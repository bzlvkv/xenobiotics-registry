/**
 * pipeline.ts — the public solve() function.
 *
 * Orchestrates the full PK → PD chain:
 *
 *   1. Build the time grid (epoch ms → hours-from-start)
 *   2. Group intakes by compound; flag unit warnings (IU etc.)
 *   3. For each compound:
 *        a. Mean Cp(t)  (sum analytic Bateman across that compound's intakes,
 *                        picking the route-specific PK per intake)
 *        b. If mcSamples > 0: draw N PK multiplier sets per compound; for
 *           each iteration carry the realization through Cp → Ce(t) → Hill
 *           → per-receptor occupancy. After the loop, take percentiles
 *           across N to emit P10/P90 bands at every layer.
 *   4. Composite system load from mean Cp curves
 *   5. Composite receptor occupancy: per-iteration probabilistic-union
 *      across compounds binding the same receptor, percentile across
 *      iterations afterwards. Done inside the unified MC loop because the
 *      union must run on synchronized iterations (same patient state) for
 *      the resulting band to be statistically faithful.
 *
 * Why one big MC loop instead of layered (PK first, then PD on the mean)?
 * v0.5 ran the PD pass against the mean Cp only, which understated PD
 * variance. A 25% Vd-CV bleeds straight into a sigmoid Hill curve as
 * non-linear occupancy variance, often wider than the underlying Cp band.
 * Propagating the realization through the chain captures that.
 *
 * Route discipline: PK is fundamentally route-specific (F, ka, V_apparent
 * all change). The same compound taken PO and SL must use different PK
 * params. The pipeline looks up `pkParams.get(slug)?.[intake.route]` per
 * intake and sums each route's contribution into the compound's single
 * plasma curve — once the molecule is in the bloodstream, its concentration
 * is one curve regardless of how it got there.
 *
 * Determinism: identical input + same seed → byte-identical output. This
 * is the property `curve_cache` keying depends on (spec §06).
 */

import {
  type EffectCompartment,
  type Intake,
  type ReceptorSite,
  type Route,
  type Slug,
} from '@xeno/core';
import type {
  CompositeReceptor,
  Horizon,
  IIV,
  OccupancyCurve,
  PkParamMap,
  PkParams,
  SolveInput,
  SolveOutput,
} from './types';
import { DEFAULT_IIV, isMichaelisMentenPk, isZeroOrderPk } from './types';
import { analyteDoseMg } from './dose';
import { addDose, cmaxOral } from './pk';
import { plasmaCurveMm } from './mm';
import { metaboliteCurve, metaboliteFormationRate, metaboliteCoupling } from './metabolite';
import { victimCurveTimeVaryingKe } from './ddi-integrate';
import { applyPkMultipliers, meanCurve, summarizeBands, rng, samplePkMultipliers } from './mc';
import { compositeLoad } from './load';
import { effectCurve } from './effect-compartment';
import { hillCurve, compositeOccupancyCurve } from './hill';
import { intakeStillRelevant } from './washout';
import {
  applyInteractionFactorsToRoutes,
  computeInteractionFactors,
  inductionRamp,
  mbiActivityEnvelope,
  kiMgPerL,
} from './interactions';
import type { InteractionApplied, InteractionEdgeInput } from './types';

const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

// ─────────────────────────────────────────────────────────────────────────────
// Time grid
// ─────────────────────────────────────────────────────────────────────────────

interface TimeGrid {
  /** Epoch ms timestamps, length T */
  timeline_ms: Float64Array;
  /** Hours since horizon.start, length T — what the PK math reads */
  t_hr: Float64Array;
  T: number;
}

function buildGrid(h: Horizon): TimeGrid {
  if (h.end <= h.start) throw new Error('horizon.end must be > horizon.start');
  if (h.stepMin <= 0) throw new Error('horizon.stepMin must be > 0');

  const stepMs = h.stepMin * MIN_MS;
  const T = Math.floor((h.end - h.start) / stepMs) + 1;
  const timeline_ms = new Float64Array(T);
  const t_hr = new Float64Array(T);

  for (let i = 0; i < T; i++) {
    timeline_ms[i] = h.start + i * stepMs;
    t_hr[i] = (i * stepMs) / HOUR_MS;
  }
  return { timeline_ms, t_hr, T };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mean curve for one compound across all its intakes (any routes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate plasma for one compound's full intake set.
 *
 * Dispatch:
 *   - If ANY route's PK carries the MM saturable-elimination block
 *     (Vmax + Km), route the entire compound through the numerical
 *     integrator. Linear superposition doesn't apply to MM, so we
 *     can't mix-and-match by route — the integrator handles the full
 *     stack of doses jointly. The MM block is treated as route-
 *     agnostic clearance (one enzyme system); ka stays route-aware
 *     by way of the PK we pick. v0.7 caveat: if a compound has MM on
 *     PO but is dosed both PO and SL, the SL absorption uses the PO
 *     ka (best available approximation until per-route MM authoring
 *     ships).
 *   - Otherwise, sum closed-form Bateman / 2-comp contributions per
 *     intake — the linear path that v0.2-v0.6 always took.
 */
function compoundMeanCurve(
  intakes: Intake[],
  pkByRoute: Partial<Record<Route, PkParams>>,
  grid: TimeGrid,
  horizonStart: number,
): Float32Array {
  // MM dispatch: find any route with a saturable-elimination block.
  for (const pk of Object.values(pkByRoute)) {
    if (pk && isMichaelisMentenPk(pk)) {
      return plasmaCurveMm(grid.t_hr, intakes, pk, horizonStart);
    }
  }

  // Linear path: closed-form per intake, sum across.
  const buf = new Float32Array(grid.T);
  for (const i of intakes) {
    const pk = pkByRoute[i.route];
    if (!pk) continue; // route lacks PK params — skip this intake
    const t_hr = (Date.parse(i.at) - horizonStart) / HOUR_MS;
    addDose(
      buf,
      grid.t_hr,
      { t_hr, dose_mg: analyteDoseMg(i.dose, i.dose_unit, pk), route: i.route },
      pk,
    );
  }
  return buf;
}

// ─────────────────────────────────────────────────────────────────────────────
// Effect-compartment warm-up
// ─────────────────────────────────────────────────────────────────────────────
//
// Ce(t) lags Cp by the keo time constant. A window whose left edge already has
// drug on board must NOT start Ce at 0 — that under-reports receptor occupancy
// for the first ~1/keo of the window (occupancy ramps up from a false zero).
// We warm the effect compartment up from the EARLIEST on-board dose, where
// Ce = 0 IS exact (the effect site is empty before any dose), integrate Cp → Ce
// across the whole span, and slice back to the window. This is exact, not a
// steady-state approximation, and mirrors the MM plasma warm-up.

/** A dose older than this has cleared; bounds the warm-up step count (the
 *  pipeline's washout prune already limits on-board doses upstream). */
const EFFECT_WARMUP_CAP_HR = 45 * 24;

/** Grid steps to prepend so Ce is integrated from the earliest on-board dose
 *  rather than started at 0 at the window's left edge. 0 when no dose precedes
 *  the window (→ the direct window solve is already exact). */
function effectWarmupSteps(
  grid: TimeGrid,
  intakes: Intake[],
  horizonStart: number,
  dt_hr: number,
): number {
  if (grid.T < 1 || !(dt_hr > 0)) return 0;
  const grid0 = grid.t_hr[0]!;
  let earliest = grid0;
  for (const i of intakes) {
    // Timing only — a positive moiety fraction cannot change `> 0`; routed
    // through the helper so the no-bypass rule stays absolute.
    if (!(analyteDoseMg(i.dose, i.dose_unit) > 0)) continue;
    const t = (Date.parse(i.at) - horizonStart) / HOUR_MS;
    if (t < earliest) earliest = t;
  }
  const warmStart = Math.max(earliest, grid0 - EFFECT_WARMUP_CAP_HR);
  if (warmStart >= grid0) return 0;
  return Math.ceil((grid0 - warmStart) / dt_hr);
}

/** A copy of `grid` with `W` uniform samples prepended (t_hr goes negative). */
function extendGridBack(grid: TimeGrid, W: number, dt_hr: number): TimeGrid {
  const T = grid.T + W;
  const t_hr = new Float64Array(T);
  const timeline_ms = new Float64Array(T);
  const grid0 = grid.t_hr[0]!;
  const start0Ms = grid.timeline_ms[0]!;
  const stepMs = dt_hr * HOUR_MS;
  for (let k = 0; k < W; k++) {
    t_hr[k] = grid0 - (W - k) * dt_hr;
    timeline_ms[k] = start0Ms - (W - k) * stepMs;
  }
  t_hr.set(grid.t_hr, W);
  timeline_ms.set(grid.timeline_ms, W);
  return { t_hr, timeline_ms, T };
}

/**
 * Window plasma + warmed-up effect-site Ce for one compound. Ce enters the
 * window already equilibrated (warmed from the earliest dose) instead of
 * ramping from a false zero; the window plasma is sliced from the SAME extended
 * integration, so it is identical to a direct window solve. No pre-window dose
 * → warm-up of 0 → byte-identical to the previous direct path.
 */
function plasmaAndWarmedCe(
  intakes: Intake[],
  pkByRoute: Partial<Record<Route, PkParams>>,
  grid: TimeGrid,
  horizonStart: number,
  dt_hr: number,
  keo_per_h: number,
): { cp: Float32Array; ce: Float32Array } {
  const W = effectWarmupSteps(grid, intakes, horizonStart, dt_hr);
  if (W === 0) {
    const cp = compoundMeanCurve(intakes, pkByRoute, grid, horizonStart);
    return { cp, ce: effectCurve(cp, dt_hr, keo_per_h) };
  }
  const extGrid = extendGridBack(grid, W, dt_hr);
  const extCp = compoundMeanCurve(intakes, pkByRoute, extGrid, horizonStart);
  const extCe = effectCurve(extCp, dt_hr, keo_per_h);
  return { cp: extCp.slice(W), ce: extCe.slice(W) };
}

// ─────────────────────────────────────────────────────────────────────────────
// MC plumbing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply one set of patient-multipliers to every route's PK in a compound.
 * The multipliers are drawn once per MC iteration and reused across all
 * routes a compound carries — physiologically, the same person's Vd, ka,
 * ke don't differ by route, so cross-route variability stays correlated.
 */
function applyMultipliersToRoutes(
  pkByRoute: Partial<Record<Route, PkParams>>,
  m: ReturnType<typeof samplePkMultipliers>,
): Partial<Record<Route, PkParams>> {
  const out: Partial<Record<Route, PkParams>> = {};
  for (const [route, pk] of Object.entries(pkByRoute) as Array<[Route, PkParams | undefined]>) {
    if (pk) out[route] = applyPkMultipliers(pk, m);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reference Cmax for the load denominator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pick the per-compound reference concentration that drives the composite
 * load denominator. We want the largest single-dose Cmax across routes the
 * user actually used (so the load is "fraction of a typical peak"). For
 * IV-only compounds we still need a reference; cmaxOral works on the IV
 * params because at ka == ∞ Cmax is just D/V. We approximate that with the
 * largest dose * 1/V → use cmaxOral with the IV-converted PK as a stand-in.
 */
/**
 * Drop intakes too old to contribute to the visible window — older than the
 * compound's washout (per its route's PK) measured from the window start.
 * Bounds the dose count the MC loop superposes for long schedules without
 * changing the curve: a dropped dose is below the relevance floor across all
 * of [start, end] (it only decays further after `start`). Intakes whose route
 * lacks PK are kept here and skipped downstream as before.
 */
function pruneToWashout(
  intakes: Intake[],
  pkByRoute: Partial<Record<Route, PkParams>>,
  windowStartMs: number,
): Intake[] {
  const refCmax = referenceCmax(intakes, pkByRoute);
  return intakes.filter((i) => {
    const pk = pkByRoute[i.route];
    if (!pk) return true;
    const ageAtStartHr = (windowStartMs - Date.parse(i.at)) / HOUR_MS;
    return intakeStillRelevant(
      ageAtStartHr,
      analyteDoseMg(i.dose, i.dose_unit, pk),
      pk,
      i.route,
      refCmax,
    );
  });
}

export function referenceCmax(
  intakes: Intake[],
  pkByRoute: Partial<Record<Route, PkParams>>,
): number {
  let max = 0;
  // Find the largest dose mass per route used.
  const largestPerRoute = new Map<Route, number>();
  for (const i of intakes) {
    // Scaled here rather than in the second loop: the map is keyed by route and
    // the comparison must be between analyte masses, not label masses.
    const m = analyteDoseMg(i.dose, i.dose_unit, pkByRoute[i.route]);
    const cur = largestPerRoute.get(i.route) ?? 0;
    if (m > cur) largestPerRoute.set(i.route, m);
  }
  for (const [route, mass] of largestPerRoute) {
    const pk = pkByRoute[route];
    if (!pk) continue;
    let c: number;
    if (route === 'IV') {
      // IV bolus: Cmax = D / V (instantaneous distribution).
      c = mass / pk.V_L;
    } else {
      c = cmaxOral(mass, pk);
    }
    if (Number.isFinite(c) && c > max) max = c;
  }
  return max;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function solve(input: SolveInput): SolveOutput {
  const grid = buildGrid(input.horizon);
  const seed = input.seed ?? 0xc0ffee;
  const N = input.mcSamples ?? 0;
  const rand = rng(seed);

  // Group intakes by compound, dropping anything without PK params.
  const byCompound = new Map<Slug, Intake[]>();
  const unitWarnings: Slug[] = [];
  const seenUnitWarn = new Set<Slug>();
  for (const i of input.intakes) {
    if (i.dose_unit === 'IU') {
      if (!seenUnitWarn.has(i.compound)) {
        unitWarnings.push(i.compound);
        seenUnitWarn.add(i.compound);
      }
    }
    const list = byCompound.get(i.compound) ?? [];
    list.push(i);
    byCompound.set(i.compound, list);
  }

  // Resolve PK + PD inputs per compound up front. Compounds without PK
  // for any of their dosed routes are dropped here — `solve()` returning
  // less than the input asked for is honest, and the caller already
  // surfaces an "unsolved" hint on Today.
  const compounds = new Map<Slug, CompoundInputs>();
  for (const [slug, intakes] of byCompound) {
    const pkByRoute = resolveCompoundPkByRoute(slug, input.pkParams, input.user);
    if (!pkByRoute) continue;
    compounds.set(slug, {
      intakes: pruneToWashout(intakes, pkByRoute, input.horizon.start),
      pkByRoute,
      iiv: input.iiv?.get(slug) ?? DEFAULT_IIV,
      ec: input.effect?.get(slug),
      sites: input.receptors?.get(slug) ?? [],
      fu: input.fractionUnbound?.get(slug),
    });
  }

  // ── Parent → metabolite links ────────────────────────────────────────
  // For each link whose PARENT is on board, ensure the metabolite is in the
  // solved set (injecting a formed-only compound with no direct doses) and tag
  // it with its formation coupling. Appended AFTER the dosed compounds so the
  // Map's insertion order keeps parents before their metabolites — the solve
  // loops rely on that to have the parent's per-iteration curve ready first.
  if (input.metabolites && input.metabolites.length > 0) {
    for (const link of input.metabolites) {
      if (!compounds.has(link.parent)) continue; // parent not on board
      if (!(link.fraction > 0)) continue;
      const metaPk = resolveCompoundPkByRoute(link.metabolite, input.pkParams, input.user);
      if (!metaPk) continue; // metabolite has no PK
      // A parent dose can be cleared (pruned by the parent's short washout) while
      // the metabolite it formed still lingers. Re-prune the parent by the
      // METABOLITE's (usually longer) washout so its formation history survives.
      const parent = compounds.get(link.parent)!;
      const rawParentIntakes = byCompound.get(link.parent) ?? parent.intakes;
      parent.intakes = pruneToWashout(rawParentIntakes, metaPk, input.horizon.start);
      const existing = compounds.get(link.metabolite);
      const meta = existing ?? {
        intakes: [] as Intake[],
        pkByRoute: metaPk,
        iiv: input.iiv?.get(link.metabolite) ?? DEFAULT_IIV,
        ec: input.effect?.get(link.metabolite),
        sites: input.receptors?.get(link.metabolite) ?? [],
        fu: input.fractionUnbound?.get(link.metabolite),
      };
      meta.metaboliteOf = {
        parentSlug: link.parent,
        fraction: link.fraction,
        mw_parent_g_mol: link.mw_parent_g_mol,
        mw_metabolite_g_mol: link.mw_metabolite_g_mol,
      };
      // Re-insert so a formed-only metabolite lands after its parent; an
      // already-dosed metabolite keeps its slot (still after its parent unless
      // the parent is itself dosed later — links are shallow in practice).
      compounds.delete(link.metabolite);
      compounds.set(link.metabolite, meta);
    }
  }

  // ── Interaction kinetics pre-pass ────────────────────────────────────
  // Compute typical perpetrator plasma curves (mean only, ignoring any
  // interaction effects on the perpetrator itself), derive multipliers
  // per (perpetrator, victim) pair, and stack them onto the victim's
  // pkByRoute. The downstream MC / mean loop then runs against the
  // adjusted PK with no further interaction-aware logic. See
  // interactions.ts for the steady-state approximation rationale.
  const interactionsApplied: InteractionApplied[] = [];
  if (input.interactions && input.interactions.length > 0) {
    interactionsApplied.push(
      ...applyInteractionsPrePass({
        edges: input.interactions,
        compounds,
        grid,
        horizonStart: input.horizon.start,
      }),
    );
  }

  const plasma = new Map<Slug, Float32Array>();
  const plasmaP10 = N > 0 ? new Map<Slug, Float32Array>() : undefined;
  const plasmaP90 = N > 0 ? new Map<Slug, Float32Array>() : undefined;
  const reference = new Map<Slug, number>();
  const effect = new Map<Slug, Float32Array>();
  const occupancy = new Map<Slug, OccupancyCurve[]>();
  const compositeOccupancy = new Map<string, CompositeReceptor>();

  // Sample step in hours — the effect compartment's discrete recurrence
  // wants the actual Δt, not just T.
  const dt_hr = input.horizon.stepMin / 60;

  // ── Reference Cmax + the mean-only path ──────────────────────────────
  // Reference Cmax doesn't depend on MC and is used by composite load
  // regardless. Compute up front so both paths can share it.
  for (const [slug, inputs] of compounds) {
    const refMax = referenceCmax(inputs.intakes, inputs.pkByRoute);
    if (refMax > 0) reference.set(slug, refMax);
  }

  if (N > 0) {
    runMcLoop({
      compounds,
      grid,
      horizonStart: input.horizon.start,
      N,
      rand,
      dt_hr,
      plasma,
      plasmaP10: plasmaP10!,
      plasmaP90: plasmaP90!,
      effect,
      occupancy,
      compositeOccupancy,
    });
  } else {
    runMeanOnly({
      compounds,
      grid,
      horizonStart: input.horizon.start,
      dt_hr,
      plasma,
      effect,
      occupancy,
      compositeOccupancy,
    });
  }

  const load = compositeLoad({ plasma, reference, T: grid.T });

  return {
    timeline: grid.timeline_ms,
    plasma,
    plasmaP10,
    plasmaP90,
    effect,
    occupancy,
    compositeOccupancy,
    load,
    unitWarnings,
    interactionsApplied,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Interaction kinetics pre-pass
// ─────────────────────────────────────────────────────────────────────────────

interface InteractionPrePassCtx {
  edges: InteractionEdgeInput[];
  compounds: Map<Slug, CompoundInputs>;
  grid: TimeGrid;
  horizonStart: number;
}

/**
 * For each authored interaction edge whose perpetrator and victim are both
 * on board, compute the multipliers and apply them to the victim's
 * pkByRoute. Mutates `compounds[victim].pkByRoute` in place. Returns the
 * set of edges that produced a non-trivial adjustment, for surfaces.
 *
 * Multiple edges into the same victim multiply: one inhibitor's drop
 * combines with another's, and an inducer can partially cancel an
 * inhibitor by adding back ke. Done in a single accumulation pass so
 * order-independence holds (the multiplicative combine is commutative).
 */
/** True for a victim a time-varying integrator can handle: a single dosing
 *  route whose PK is 1-comp, 2-comp, or Michaelis-Menten. Multi-route and
 *  zero-order (patch/depot) victims fall back to the horizon-independent scalar
 *  path (a unified central compartment is ill-defined across per-route apparent
 *  volumes; zero-order absorption isn't modelled by the integrators). */
function isTimeVaryingVictim(
  intakes: Intake[],
  pkByRoute: Partial<Record<Route, PkParams>>,
): boolean {
  const routes = new Set<Route>();
  for (const i of intakes) routes.add(i.route);
  if (routes.size !== 1) return false;
  const [route] = routes;
  const pk = pkByRoute[route!];
  if (!pk) return false;
  return !isZeroOrderPk(pk);
}

/** Mean perpetrator Cp over the CO-ADMINISTRATION window (samples where it's
 *  meaningfully present), NOT the whole grid. Horizon-independent: appending
 *  near-zero tail samples as the chart zooms out no longer drags the driver
 *  down. Used for the scalar fallback and for the surface report's
 *  representative factor. */
function coAdminMeanCp(perpCp: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < perpCp.length; i++) if (perpCp[i]! > peak) peak = perpCp[i]!;
  if (peak <= 0) return 0;
  const thr = peak * 0.05;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < perpCp.length; i++) {
    const v = perpCp[i]!;
    if (v >= thr) {
      sum += v;
      n++;
    }
  }
  return n > 0 ? sum / n : 0;
}

/** Epoch-ms of a compound's earliest intake (its first real dose), or +Infinity
 *  if none parse. Used to anchor the induction ramp to when the inducer actually
 *  entered the body, independent of where the chart window starts. */
function earliestIntakeMs(intakes: Intake[]): number {
  let min = Infinity;
  for (const i of intakes) {
    const t = Date.parse(i.at);
    if (Number.isFinite(t) && t < min) min = t;
  }
  return min;
}

/**
 * For each authored interaction edge whose perpetrator and victim are both on
 * board, derive the victim adjustment and either (a) store a time-varying
 * ke/F multiplier curve on the victim (1-comp single-route — faithful,
 * integrated downstream), or (b) apply a horizon-independent scalar factor to
 * its PK (2-comp / MM / multi-route fallback). Returns the edges that produced
 * a non-trivial adjustment, for surfaces.
 *
 * The driver is the perpetrator's INSTANTANEOUS Cp(t) (time-varying path) or its
 * co-administration-window mean (scalar path) — never the whole-grid mean, which
 * made the modeled interaction strength depend on the chart's zoom level.
 */
function applyInteractionsPrePass(ctx: InteractionPrePassCtx): InteractionApplied[] {
  const dt_hr = ctx.grid.T >= 2 ? ctx.grid.t_hr[1]! - ctx.grid.t_hr[0]! : 0;

  // Snapshot each compound's PK before any victim mutation so a perpetrator
  // that is itself a (scalar) victim still drives interactions off its
  // un-adjusted PK — keeps the pre-pass order-independent.
  const perpPk = new Map<Slug, Partial<Record<Route, PkParams>>>();
  for (const [slug, inp] of ctx.compounds) perpPk.set(slug, { ...inp.pkByRoute });

  // Group inbound edges per victim.
  const edgesByVictim = new Map<Slug, InteractionEdgeInput[]>();
  for (const edge of ctx.edges) {
    if (!ctx.compounds.has(edge.from) || !ctx.compounds.has(edge.to)) continue;
    const arr = edgesByVictim.get(edge.to) ?? [];
    arr.push(edge);
    edgesByVictim.set(edge.to, arr);
  }

  const perpCpOver = (extGrid: TimeGrid, perp: Slug): Float32Array =>
    compoundMeanCurve(
      ctx.compounds.get(perp)!.intakes,
      perpPk.get(perp)!,
      extGrid,
      ctx.horizonStart,
    );

  const out: InteractionApplied[] = [];
  for (const [victimSlug, edges] of edgesByVictim) {
    const victim = ctx.compounds.get(victimSlug)!;

    if (dt_hr > 0 && isTimeVaryingVictim(victim.intakes, victim.pkByRoute)) {
      // ── Time-varying path ──────────────────────────────────────────────
      // Build per-step ke/F multipliers over a grid warmed back to the
      // victim's earliest dose (so a pre-window victim dose integrates from
      // its real time), driven by each perpetrator's instantaneous Cp(t).
      const W = effectWarmupSteps(ctx.grid, victim.intakes, ctx.horizonStart, dt_hr);
      const extGrid = W > 0 ? extendGridBack(ctx.grid, W, dt_hr) : ctx.grid;
      const T = extGrid.T;
      const keMult = new Float32Array(T).fill(1);
      const fMult = new Float32Array(T).fill(1);
      let moved = false;

      const gridStartMs = extGrid.timeline_ms[0]!;
      for (const edge of edges) {
        const perpCp = perpCpOver(extGrid, edge.from);
        // A mechanism-based inhibitor's Ki depth is applied via the persistence
        // envelope below, not the memoryless per-step factor — so exclude ki here.
        const isMbi =
          edge.kinetics.mbi === true &&
          edge.kinetics.ki_uM != null &&
          edge.perpetrator_mw_g_mol != null;
        // Memoryless factors (reversible inhibition + binding displacement) track
        // instantaneous Cp; induction + MBI are slow effects handled separately below.
        for (let i = 0; i < T; i++) {
          const f = computeInteractionFactors(
            edge.kinetics,
            perpCp[i]!,
            edge.perpetrator_mw_g_mol,
            { includeInduction: false, includeKi: !isMbi },
          );
          if (f.ke !== 1 || f.F !== 1) {
            keMult[i] = keMult[i]! * f.ke;
            fMult[i] = fMult[i]! * f.F;
            moved = true;
          }
        }
        // Mechanism-based inhibition: hold the Ki-calibrated depth and let it
        // recover on the enzyme-turnover time constant after the perpetrator
        // clears (a persistence tail the memoryless reversible form can't give).
        if (isMbi) {
          const env = mbiActivityEnvelope(
            perpCp,
            kiMgPerL(edge.kinetics.ki_uM!, edge.perpetrator_mw_g_mol!),
            dt_hr,
          );
          for (let i = 0; i < T; i++) {
            if (env[i]! !== 1) {
              keMult[i] = keMult[i]! * env[i]!;
              moved = true;
            }
          }
        }
        // Enzyme induction: fold in the first-order up/down-regulation ramp,
        // anchored to the perpetrator's real first dose (so it's horizon-invariant
        // and doesn't apply full strength instantly or before the inducer exists).
        const indF = edge.kinetics.induction_factor;
        if (indF != null && indF > 0 && indF !== 1) {
          const perpEarliestMs = earliestIntakeMs(ctx.compounds.get(edge.from)!.intakes);
          const ramp = inductionRamp(perpCp, dt_hr, indF, gridStartMs, perpEarliestMs);
          for (let i = 0; i < T; i++) {
            if (ramp[i]! !== 1) {
              keMult[i] = keMult[i]! * ramp[i]!;
              moved = true;
            }
          }
        }
        // Representative (horizon-independent) factor for the surface report:
        // the STEADY-STATE strength (includes the full induction plateau).
        const repCp = coAdminMeanCp(W > 0 ? perpCp.slice(W) : perpCp);
        const rf = computeInteractionFactors(edge.kinetics, repCp, edge.perpetrator_mw_g_mol);
        if (rf.ke !== 1 || rf.F !== 1) {
          out.push({
            from: edge.from,
            to: edge.to,
            ke_factor: rf.ke,
            F_factor: rf.F,
            perpetrator_mean_cp_mg_l: repCp,
          });
        }
      }

      if (moved) victim.ddi = { keMult, fMult, warmupSteps: W, extGrid };
    } else {
      // ── Scalar fallback (2-comp / MM / multi-route) ────────────────────
      // Horizon-independent co-administration-window driver; combine edges
      // multiplicatively and apply once to the victim's PK.
      let ke = 1;
      let F = 1;
      for (const edge of edges) {
        const driver = coAdminMeanCp(perpCpOver(ctx.grid, edge.from));
        const f = computeInteractionFactors(edge.kinetics, driver, edge.perpetrator_mw_g_mol);
        if (f.ke === 1 && f.F === 1) continue;
        ke *= f.ke;
        F *= f.F;
        out.push({
          from: edge.from,
          to: edge.to,
          ke_factor: f.ke,
          F_factor: f.F,
          perpetrator_mean_cp_mg_l: driver,
        });
      }
      if (ke !== 1 || F !== 1) {
        victim.pkByRoute = applyInteractionFactorsToRoutes(victim.pkByRoute, { ke, F });
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mean-only path (mcSamples = 0)
// ─────────────────────────────────────────────────────────────────────────────

interface CompoundInputs {
  intakes: Intake[];
  pkByRoute: Partial<Record<Route, PkParams>>;
  iiv: IIV;
  ec: EffectCompartment | undefined;
  sites: ReceptorSite[];
  /** Fraction unbound in plasma. Undefined -> 1, i.e. the uncorrected curve. */
  fu: number | undefined;
  /**
   * Set by the interaction pre-pass for a single-route 1-comp VICTIM whose
   * clearance is modulated by an on-board perpetrator. Holds the per-step
   * ke / F multipliers (built from the perpetrator's INSTANTANEOUS Cp(t), so
   * horizon-independent) over a grid warmed back to the victim's earliest dose.
   * When present, the victim is numerically integrated (time-varying ke) rather
   * than using the closed-form Bateman with a scalar factor.
   */
  ddi?: {
    keMult: Float32Array;
    fMult: Float32Array;
    warmupSteps: number;
    extGrid: TimeGrid;
  };
  /**
   * Set when this compound is a METABOLITE formed from a parent that is also on
   * board. Its plasma curve is driven by the parent's elimination flux (plus any
   * direct doses of the metabolite itself), integrated in metabolite.ts. The
   * parent's per-iteration PK is read from the solve loop's scratch so formation
   * uses the SAME realization (correlated IIV), not a fresh draw.
   */
  metaboliteOf?: {
    parentSlug: Slug;
    fraction: number;
    mw_parent_g_mol: number;
    mw_metabolite_g_mol: number;
  };
}

interface MeanCtx {
  compounds: Map<Slug, CompoundInputs>;
  grid: TimeGrid;
  horizonStart: number;
  dt_hr: number;
  plasma: Map<Slug, Float32Array>;
  effect: Map<Slug, Float32Array>;
  occupancy: Map<Slug, OccupancyCurve[]>;
  compositeOccupancy: Map<string, CompositeReceptor>;
}

/** The single representative 1-comp PK for a time-varying DDI victim (its gate
 *  guarantees one dosing route). */
function singleRoutePk(pkByRoute: Partial<Record<Route, PkParams>>, intakes: Intake[]): PkParams {
  const route = intakes[0]?.route;
  return (route ? pkByRoute[route] : undefined) ?? Object.values(pkByRoute)[0]!;
}

/**
 * Window plasma (+ warmed-up Ce when wanted) for one compound, dispatching to
 * the right integrator: a DDI victim is integrated with time-varying ke over its
 * warm-up-extended grid (Ce warmed from the same extended plasma); everything
 * else uses the closed-form / MM path with the effect warm-up. `pkForIter` is
 * the compound's PK for this run (mean) or MC iteration (IIV-multiplied).
 */
function computePlasmaAndCe(
  inputs: CompoundInputs,
  pkForIter: Partial<Record<Route, PkParams>>,
  grid: TimeGrid,
  horizonStart: number,
  dt_hr: number,
  wantCe: boolean,
): { cp: Float32Array; ce: Float32Array | null } {
  const keo = inputs.ec?.keo_per_h ?? 0;
  const ceWanted = wantCe && keo > 0;

  if (inputs.ddi) {
    const { keMult, fMult, warmupSteps, extGrid } = inputs.ddi;
    const pk1 = singleRoutePk(pkForIter, inputs.intakes);
    // The interaction multiplier scales clearance: ke / k10 for the linear
    // shapes, Vmax for Michaelis-Menten. Pick the integrator by PK shape.
    const extCp = isMichaelisMentenPk(pk1)
      ? plasmaCurveMm(extGrid.t_hr, inputs.intakes, pk1, horizonStart, keMult, fMult)
      : victimCurveTimeVaryingKe(extGrid.t_hr, inputs.intakes, pk1, horizonStart, keMult, fMult);
    const cp = warmupSteps > 0 ? extCp.slice(warmupSteps) : extCp;
    if (ceWanted) {
      const extCe = effectCurve(extCp, dt_hr, keo);
      return { cp, ce: warmupSteps > 0 ? extCe.slice(warmupSteps) : extCe };
    }
    return { cp, ce: null };
  }

  if (ceWanted) {
    const w = plasmaAndWarmedCe(inputs.intakes, pkForIter, grid, horizonStart, dt_hr, keo);
    return { cp: w.cp, ce: w.ce };
  }
  return { cp: compoundMeanCurve(inputs.intakes, pkForIter, grid, horizonStart), ce: null };
}

/**
 * Window plasma (+ warmed-up Ce) for a METABOLITE: recompute the parent's Cp on
 * a warm-up-extended grid using the parent's per-iteration PK, turn its
 * elimination flux into a formation source, and integrate the metabolite
 * compartment (formation + any direct doses − own elimination). Warm-up spans
 * back to the earliest parent OR metabolite dose so a pre-window parent dose's
 * lingering metabolite is present at the window's left edge.
 */
function computeMetabolitePlasmaAndCe(
  inputs: CompoundInputs,
  metabPkForIter: Partial<Record<Route, PkParams>>,
  parentIntakes: Intake[],
  parentPkForIter: Partial<Record<Route, PkParams>>,
  grid: TimeGrid,
  horizonStart: number,
  dt_hr: number,
  wantCe: boolean,
): { cp: Float32Array; ce: Float32Array | null } {
  const link = inputs.metaboliteOf!;
  const keo = inputs.ec?.keo_per_h ?? 0;
  const ceWanted = wantCe && keo > 0;

  const allDoses =
    parentIntakes.length + inputs.intakes.length > 0
      ? [...parentIntakes, ...inputs.intakes]
      : parentIntakes;
  const W = effectWarmupSteps(grid, allDoses, horizonStart, dt_hr);
  const g = W > 0 ? extendGridBack(grid, W, dt_hr) : grid;

  const parentPk1 = singleRoutePk(parentPkForIter, parentIntakes);
  const metabPk1 = singleRoutePk(metabPkForIter, inputs.intakes);
  const parentCp = compoundMeanCurve(parentIntakes, parentPkForIter, g, horizonStart);
  const coupling = metaboliteCoupling(
    link.fraction,
    link.mw_parent_g_mol,
    link.mw_metabolite_g_mol,
    parentPk1.V_L,
    metabPk1.V_L,
  );
  const formation = metaboliteFormationRate(parentCp, parentPk1, coupling);
  const extCm = metaboliteCurve(g.t_hr, inputs.intakes, metabPk1, horizonStart, formation);
  const cp = W > 0 ? extCm.slice(W) : extCm;
  if (ceWanted) {
    const extCe = effectCurve(extCm, dt_hr, keo);
    return { cp, ce: W > 0 ? extCe.slice(W) : extCe };
  }
  return { cp, ce: null };
}

function runMeanOnly(ctx: MeanCtx): void {
  // Per-compound deterministic chain.
  const perCompoundOcc = new Map<Slug, OccupancyCurve[]>();
  for (const [slug, inputs] of ctx.compounds) {
    const wantCe = !!(inputs.ec && inputs.ec.keo_per_h > 0);
    const { cp, ce } = inputs.metaboliteOf
      ? computeMetabolitePlasmaAndCe(
          inputs,
          inputs.pkByRoute,
          ctx.compounds.get(inputs.metaboliteOf.parentSlug)!.intakes,
          ctx.compounds.get(inputs.metaboliteOf.parentSlug)!.pkByRoute,
          ctx.grid,
          ctx.horizonStart,
          ctx.dt_hr,
          wantCe,
        )
      : computePlasmaAndCe(inputs, inputs.pkByRoute, ctx.grid, ctx.horizonStart, ctx.dt_hr, wantCe);
    ctx.plasma.set(slug, cp);

    if (ce) {
      ctx.effect.set(slug, ce);
      if (inputs.sites.length > 0) {
        const curves: OccupancyCurve[] = inputs.sites.map((site) => ({
          receptor: site.receptor,
          pathway: site.pathway,
          action: site.action,
          curve: hillCurve(ce, site, inputs.fu),
        }));
        ctx.occupancy.set(slug, curves);
        perCompoundOcc.set(slug, curves);
      }
    }
  }

  // Composite via union of mean curves — no bands in the no-MC path.
  for (const [receptor, info] of bucketByReceptor(perCompoundOcc)) {
    const curves = info.sites.map((s) => s.curve);
    const composite = compositeOccupancyCurve(curves);
    ctx.compositeOccupancy.set(receptor, {
      receptor,
      pathway: info.pathway,
      curve: composite,
      contributors: info.sites.map((s) => s.slug),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MC path (mcSamples > 0)
// ─────────────────────────────────────────────────────────────────────────────

interface McCtx extends MeanCtx {
  N: number;
  rand: () => number;
  plasmaP10: Map<Slug, Float32Array>;
  plasmaP90: Map<Slug, Float32Array>;
}

/**
 * Unified MC loop. Each iteration draws one multiplier set per compound,
 * builds Cp → Ce → per-receptor occupancy for that iteration, and
 * unions compounds into a per-iteration composite. After N iterations,
 * percentiles across iterations give us bands at every layer.
 *
 * Memory: per compound holds N × T floats for plasma, plus optional
 * N × T for Ce, plus N × T per receptor it binds. For N=200, T=600,
 * 5 compounds, 3 receptors each, that's ~14 MB peak before we collapse
 * to summary curves. Within budget; we can stream-percentile later if
 * a horizon balloons (worker-side concern).
 *
 * Why per-iteration composite union: compositeOccupancyCurve assumes
 * independent binding events. Within one iteration, the per-compound
 * occupancy realizations represent a coherent patient state — the union
 * is meaningful. Doing the union on the percentile curves directly would
 * conflate "p10 of stack" with "stack of p10s" (bias toward the stack
 * being low, since each p10 is already low).
 */
function runMcLoop(ctx: McCtx): void {
  // Per-compound storage of all N realizations. Curves get collapsed to
  // mean / p10 / p90 at the end and these arrays are released.
  interface CompoundReal {
    plasma: Float32Array[];
    ce: Float32Array[] | null;
    occByReceptor: Map<string, Float32Array[]> | null;
    sitesByReceptor: Map<string, ReceptorSite> | null;
  }
  const realizations = new Map<Slug, CompoundReal>();
  for (const [slug, inputs] of ctx.compounds) {
    realizations.set(slug, {
      plasma: [],
      ce: inputs.ec && inputs.ec.keo_per_h > 0 && inputs.sites.length > 0 ? [] : null,
      occByReceptor: inputs.sites.length > 0 ? new Map() : null,
      sitesByReceptor:
        inputs.sites.length > 0 ? new Map(inputs.sites.map((s) => [s.receptor, s])) : null,
    });
  }

  // Per-receptor composite realizations across the stack. Built per
  // iteration via probabilistic-union of the iteration's contributing
  // compounds; percentiled at the end.
  interface CompositeReal {
    pathway: string | undefined;
    contributors: Set<Slug>;
    samples: Float32Array[];
  }
  const compositeReals = new Map<string, CompositeReal>();

  for (let n = 0; n < ctx.N; n++) {
    // Per-iteration scratch: receptor → list of per-compound occupancy
    // curves contributed in THIS iteration. Used to union into composite.
    const iterByReceptor = new Map<string, Float32Array[]>();
    const iterContributors = new Map<string, Set<Slug>>();
    const iterPathway = new Map<string, string | undefined>();
    // This iteration's sampled PK per compound, so a metabolite forms from the
    // SAME realization of its parent (correlated IIV). Parents precede their
    // metabolites in insertion order, so the parent's sample is always present.
    const iterPk = new Map<Slug, Partial<Record<Route, PkParams>>>();

    for (const [slug, inputs] of ctx.compounds) {
      const m = samplePkMultipliers(inputs.iiv, ctx.rand);
      const sampledByRoute = applyMultipliersToRoutes(inputs.pkByRoute, m);
      iterPk.set(slug, sampledByRoute);
      const real = realizations.get(slug)!;

      // Same dispatch as the mean path: a metabolite is formed from its parent's
      // (this-iteration) curve; a DDI victim is integrated with time-varying ke;
      // an effect compound is warmed from its earliest dose.
      const { cp, ce } = inputs.metaboliteOf
        ? computeMetabolitePlasmaAndCe(
            inputs,
            sampledByRoute,
            ctx.compounds.get(inputs.metaboliteOf.parentSlug)!.intakes,
            iterPk.get(inputs.metaboliteOf.parentSlug) ??
              ctx.compounds.get(inputs.metaboliteOf.parentSlug)!.pkByRoute,
            ctx.grid,
            ctx.horizonStart,
            ctx.dt_hr,
            real.ce != null,
          )
        : computePlasmaAndCe(
            inputs,
            sampledByRoute,
            ctx.grid,
            ctx.horizonStart,
            ctx.dt_hr,
            real.ce != null,
          );
      real.plasma.push(cp);

      if (real.ce && ce) {
        real.ce.push(ce);

        for (const site of inputs.sites) {
          const occ = hillCurve(ce, site, inputs.fu);
          // Per-compound storage (for compound-level bands).
          let arr = real.occByReceptor!.get(site.receptor);
          if (!arr) {
            arr = [];
            real.occByReceptor!.set(site.receptor, arr);
          }
          arr.push(occ);

          // Per-iteration scratch (for composite union).
          let curves = iterByReceptor.get(site.receptor);
          if (!curves) {
            curves = [];
            iterByReceptor.set(site.receptor, curves);
          }
          curves.push(occ);

          let contribs = iterContributors.get(site.receptor);
          if (!contribs) {
            contribs = new Set<Slug>();
            iterContributors.set(site.receptor, contribs);
          }
          contribs.add(slug);

          if (!iterPathway.has(site.receptor)) {
            iterPathway.set(site.receptor, site.pathway);
          }
        }
      }
    }

    // Union per-compound occupancies → per-iteration composite.
    for (const [receptor, curves] of iterByReceptor) {
      const composite = compositeOccupancyCurve(curves);
      let cr = compositeReals.get(receptor);
      if (!cr) {
        cr = {
          pathway: iterPathway.get(receptor),
          contributors: new Set<Slug>(),
          samples: [],
        };
        compositeReals.set(receptor, cr);
      }
      for (const slug of iterContributors.get(receptor)!) cr.contributors.add(slug);
      cr.samples.push(composite);
    }
  }

  // Collapse per-compound realizations to summary curves.
  for (const [slug, real] of realizations) {
    const pb = summarizeBands(real.plasma);
    ctx.plasma.set(slug, pb.mean);
    ctx.plasmaP10.set(slug, pb.p10);
    ctx.plasmaP90.set(slug, pb.p90);

    if (real.ce && real.ce.length > 0) {
      ctx.effect.set(slug, meanCurve(real.ce));
    }

    if (real.occByReceptor && real.sitesByReceptor) {
      const curves: OccupancyCurve[] = [];
      for (const [receptor, samples] of real.occByReceptor) {
        const site = real.sitesByReceptor.get(receptor)!;
        const ob = summarizeBands(samples);
        curves.push({
          receptor,
          pathway: site.pathway,
          action: site.action,
          curve: ob.mean,
          p10: ob.p10,
          p90: ob.p90,
        });
      }
      // Stable order across runs — sort by receptor key so determinism
      // tests can compare per-index even when MC draw order shifts.
      curves.sort((a, b) => a.receptor.localeCompare(b.receptor));
      if (curves.length > 0) ctx.occupancy.set(slug, curves);
    }
  }

  // Collapse composite realizations to summary curves.
  for (const [receptor, cr] of compositeReals) {
    if (cr.samples.length === 0) continue;
    const cb = summarizeBands(cr.samples);
    ctx.compositeOccupancy.set(receptor, {
      receptor,
      pathway: cr.pathway,
      curve: cb.mean,
      p10: cb.p10,
      p90: cb.p90,
      contributors: [...cr.contributors],
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Receptor bucketing helper (mean-only path)
// ─────────────────────────────────────────────────────────────────────────────

function bucketByReceptor(
  occupancy: Map<Slug, OccupancyCurve[]>,
): Map<string, { pathway?: string; sites: Array<{ slug: Slug; curve: Float32Array }> }> {
  const buckets = new Map<
    string,
    { pathway?: string; sites: Array<{ slug: Slug; curve: Float32Array }> }
  >();
  for (const [slug, curves] of occupancy) {
    for (const oc of curves) {
      let bucket = buckets.get(oc.receptor);
      if (!bucket) {
        bucket = { pathway: oc.pathway, sites: [] };
        buckets.set(oc.receptor, bucket);
      }
      bucket.sites.push({ slug, curve: oc.curve });
    }
  }
  return buckets;
}

// ─────────────────────────────────────────────────────────────────────────────
// PK resolution with optional user calibration overrides
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up the per-route PK map for one compound, layering optional
 * user-calibration overrides on top of every route. Returns undefined if
 * the compound has no PK for any route.
 *
 * User overrides apply uniformly across routes: the calibration captures
 * the patient's physiology (Vd scaler, ke scaler), which is correlated
 * across routes — overriding F for PO would imply also overriding F for
 * SL by the same factor, but in practice user calibration in v0.2 only
 * adjusts shared params (ka/ke/V) so this is fine.
 */
export function resolveCompoundPkByRoute(
  slug: Slug,
  pkParams: PkParamMap,
  user?: SolveInput['user'],
): Partial<Record<Route, PkParams>> | undefined {
  const base = pkParams.get(slug);
  if (!base) return undefined;
  const override = user?.overrides?.get(slug);
  if (!override) return base;
  const merged: Partial<Record<Route, PkParams>> = {};
  for (const [route, pk] of Object.entries(base) as Array<[Route, PkParams | undefined]>) {
    if (pk) merged[route] = { ...pk, ...override };
  }
  return merged;
}
