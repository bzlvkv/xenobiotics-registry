/**
 * atnow.ts — horizon-independent "what's in me right now" reduction.
 *
 * The plasma strip's headline number is the concentration *at this instant*.
 * It must not depend on the chart's zoom level — yet the grid solver's
 * at-now reading did, three ways: the dose set was truncated by the chart
 * window, the sample step (and thus the interpolation error) changed with
 * the horizon, and the DDI strength was averaged over the chart window.
 *
 * This module computes Cp(now) directly: a closed-form superposition
 * evaluated at the single moment `now`, over a per-compound washout window,
 * with interactions driven by each perpetrator's *instantaneous* Cp(now).
 * No grid, no horizon, O(D) per compound. Exact for linear PK; MM falls back
 * to a short bounded integration (no superposition under saturation).
 *
 * The chart curve stays horizon-driven — it's for drawing. This number is
 * the source of truth for the displayed value and the NOW marker.
 */

import type { Intake, Route, Slug } from '@xeno/core';
import { analyteDoseMg } from './dose';
import type { PkParamMap, PkParams, InteractionEdgeInput, SolveInput } from './types';
import { isMichaelisMentenPk } from './types';
import { plasmaAt } from './pk';
import { plasmaCurveMm } from './mm';
import { washoutHr, intakeStillRelevant } from './washout';
import { computeInteractionFactors, applyInteractionFactorsToRoutes } from './interactions';
import { resolveCompoundPkByRoute, referenceCmax } from './pipeline';

const HOUR_MS = 3_600_000;
/** Sample step for the MM at-now integration. MM is rare and its window is
 *  long; 15 min keeps the point count modest while RK4 stays accurate. */
const MM_ATNOW_STEP_MIN = 15;

export interface AtNowInput {
  intakes: Intake[];
  pkParams: PkParamMap;
  /** Wall-clock instant to evaluate, epoch ms. */
  nowMs: number;
  user?: SolveInput['user'];
  /** Active interaction edges (both compounds on board, kinetics authored). */
  interactions?: InteractionEdgeInput[];
}

/** Intakes grouped by compound + the PK resolved once for each — the setup
 *  that's invariant across evaluation instants. Resolving it a single time is
 *  what makes {@link concentrationsAtTimes} cheap over many timestamps. */
interface ResolvedPk {
  byCompound: Map<Slug, Intake[]>;
  pkByCompound: Map<Slug, Partial<Record<Route, PkParams>>>;
}

/** Group intakes by compound and resolve per-(compound, route) PK once,
 *  dropping any compound without params for its dosed routes (mirrors
 *  `solve()`). Pure; independent of the evaluation instant. */
function resolvePkOnce(
  intakes: Intake[],
  pkParams: PkParamMap,
  user: SolveInput['user'] | undefined,
): ResolvedPk {
  const byCompound = new Map<Slug, Intake[]>();
  for (const i of intakes) {
    const list = byCompound.get(i.compound) ?? [];
    list.push(i);
    byCompound.set(i.compound, list);
  }

  const pkByCompound = new Map<Slug, Partial<Record<Route, PkParams>>>();
  for (const slug of byCompound.keys()) {
    const pk = resolveCompoundPkByRoute(slug, pkParams, user);
    if (pk) pkByCompound.set(slug, pk);
  }
  return { byCompound, pkByCompound };
}

/**
 * Cp (mg/L) for every PK-resolved compound at a single instant `nowMs`,
 * given already-resolved PK. The DDI pass is driven by each perpetrator's
 * *instantaneous* Cp(now), so the result is horizon-independent by
 * construction. Factored out of {@link concentrationsAtNow} so the batch
 * sampler can reuse it per timestamp without re-resolving PK.
 */
function cpAllAt(
  resolved: ResolvedPk,
  nowMs: number,
  interactions: InteractionEdgeInput[] | undefined,
): Map<Slug, number> {
  const { byCompound, pkByCompound } = resolved;

  // Base, interaction-free Cp(now). Doubles as the perpetrator exposure that
  // drives DDIs (instantaneous, so horizon-independent by construction).
  const baseCp = new Map<Slug, number>();
  for (const [slug, list] of byCompound) {
    const pk = pkByCompound.get(slug);
    if (!pk) continue;
    baseCp.set(slug, cpAtNow(list, pk, nowMs));
  }

  if (!interactions || interactions.length === 0) return baseCp;

  // Interaction pass: combine inbound factors per victim, then recompute the
  // victim's Cp(now) with the adjusted PK. `computeInteractionFactors` takes
  // the perpetrator's Cp directly, so passing Cp(now) makes reversible
  // inhibition instantaneous; induction/displacement are presence-gated
  // there (they only fire when the perpetrator's Cp(now) > 0 anyway, since a
  // perpetrator with no on-board drug isn't in `baseCp` with a positive value).
  const perVictim = new Map<Slug, { ke: number; F: number }>();
  for (const edge of interactions) {
    const perpCp = baseCp.get(edge.from);
    if (perpCp == null || perpCp <= 0) continue;
    if (!pkByCompound.has(edge.to)) continue;
    const f = computeInteractionFactors(edge.kinetics, perpCp, edge.perpetrator_mw_g_mol);
    if (f.ke === 1 && f.F === 1) continue;
    const acc = perVictim.get(edge.to) ?? { ke: 1, F: 1 };
    acc.ke *= f.ke;
    acc.F *= f.F;
    perVictim.set(edge.to, acc);
  }

  const out = new Map(baseCp);
  for (const [victimSlug, acc] of perVictim) {
    const adjusted = applyInteractionFactorsToRoutes(pkByCompound.get(victimSlug)!, acc);
    out.set(victimSlug, cpAtNow(byCompound.get(victimSlug)!, adjusted, nowMs));
  }
  return out;
}

/**
 * Plasma concentration (mg/L) at `nowMs`, keyed by compound slug. Depends
 * only on the dose history and PK — never on any chart window. Compounds
 * with no PK for their dosed routes are omitted (mirrors `solve()`).
 */
export function concentrationsAtNow(input: AtNowInput): Map<Slug, number> {
  const { intakes, pkParams, nowMs, user, interactions } = input;
  return cpAllAt(resolvePkOnce(intakes, pkParams, user), nowMs, interactions);
}

export interface AtTimesInput {
  intakes: Intake[];
  pkParams: PkParamMap;
  /** Wall-clock instants to evaluate, epoch ms. Order is preserved. */
  timesMs: number[];
  user?: SolveInput['user'];
  /** Active interaction edges (both compounds on board, kinetics authored). */
  interactions?: InteractionEdgeInput[];
}

export interface AtTimesResult {
  /** Echo of the requested instants; column index into each series. */
  times: number[];
  /** Per compound, Cp(mg/L) sampled at each `times[i]`. Same compound set as
   *  `concentrationsAtNow` (those with PK for a dosed route). */
  bySlug: Map<Slug, Float64Array>;
}

/**
 * Batch form of {@link concentrationsAtNow}: Cp(mg/L) for every PK-resolved
 * compound at each instant in `timesMs`. PK is grouped and resolved *once*
 * (via {@link resolvePkOnce}), then each instant pays only the O(D) closed-form
 * superposition — so sampling M timestamps costs the per-instant work M times,
 * not the resolve+group setup M times. This is the predictor primitive for the
 * concentration↔outcome correlation (sample Cp at each PRO-observation time);
 * call once with all observation timestamps rather than looping the at-now path.
 *
 * Each instant is evaluated independently and exactly matches
 * `concentrationsAtNow({ ..., nowMs: t })` (DDIs recomputed per instant from
 * the perpetrator's Cp at that instant). MM compounds fall through to the
 * bounded RK4 integration per timestamp — acceptable for a handful of
 * observation times, but decimate/memoize before sampling long dense grids.
 */
export function concentrationsAtTimes(input: AtTimesInput): AtTimesResult {
  const { intakes, pkParams, timesMs, user, interactions } = input;
  const resolved = resolvePkOnce(intakes, pkParams, user);

  const bySlug = new Map<Slug, Float64Array>();
  for (const slug of resolved.pkByCompound.keys()) {
    bySlug.set(slug, new Float64Array(timesMs.length));
  }

  for (let ti = 0; ti < timesMs.length; ti++) {
    const cp = cpAllAt(resolved, timesMs[ti]!, interactions);
    for (const [slug, v] of cp) {
      const arr = bySlug.get(slug);
      if (arr) arr[ti] = v;
    }
  }
  return { times: timesMs.slice(), bySlug };
}

/**
 * Cp at `nowMs` for one compound's dose list. Linear PK: closed-form
 * superposition over washout-relevant doses. MM: short bounded integration.
 */
function cpAtNow(
  intakes: Intake[],
  pkByRoute: Partial<Record<Route, PkParams>>,
  nowMs: number,
): number {
  // MM dispatch — any saturable route routes the whole compound through the
  // integrator (clearance is one enzyme system; superposition is invalid).
  for (const pk of Object.values(pkByRoute)) {
    if (pk && isMichaelisMentenPk(pk)) return mmCpAtNow(intakes, pk, nowMs);
  }

  const refCmax = referenceCmax(intakes, pkByRoute);
  let cp = 0;
  for (const i of intakes) {
    const pk = pkByRoute[i.route];
    if (!pk) continue;
    const ageHr = (nowMs - Date.parse(i.at)) / HOUR_MS;
    if (ageHr < 0) continue; // future dose — no contribution now
    const dose_mg = analyteDoseMg(i.dose, i.dose_unit, pk);
    if (!intakeStillRelevant(ageHr, dose_mg, pk, i.route, refCmax)) continue;
    cp += plasmaAt(ageHr, dose_mg, pk, i.route);
  }
  return cp;
}

/**
 * MM Cp at now: integrate the saturable ODE forward over a bounded window
 * ending at `now` and return the last sample. Doses before the window snap
 * to its start (the integrator's existing pre-grid behavior); by a full MM
 * washout earlier they've effectively cleared, so the error is negligible.
 */
function mmCpAtNow(
  intakes: Intake[],
  pk: PkParams & { mm_vmax_per_hr: number; mm_km_mg_per_l: number },
  nowMs: number,
): number {
  const lookbackHr = washoutHr(pk);
  const startMs = nowMs - lookbackHr * HOUR_MS;
  const stepMs = MM_ATNOW_STEP_MIN * 60_000;
  const T = Math.max(2, Math.floor((nowMs - startMs) / stepMs) + 1);
  const t_hr = new Float64Array(T);
  for (let i = 0; i < T; i++) t_hr[i] = (i * stepMs) / HOUR_MS;
  const curve = plasmaCurveMm(t_hr, intakes, pk, startMs);
  return curve[T - 1] ?? 0;
}
