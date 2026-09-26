/**
 * mm.ts — Michaelis-Menten saturable elimination, numerically integrated.
 *
 * Why this lives outside pk.ts: the closed-form 1-comp / 2-comp math
 * superposes across doses (linear system → sum the contributions). MM
 * does NOT — `dC/dt = -Vmax·C/(Km+C)` is non-linear in C, so two doses
 * given simultaneously don't decay independently and add. The solver
 * has to integrate the full ODE with all on-board doses summed at each
 * step, which is structurally incompatible with `addDose()`.
 *
 * Model:
 *
 *   absorption (PO/IM/SC):  da/dt = -ka · a              (a = mass at absorption depot)
 *   plasma rise:            dC/dt = (ka·a/V) − Vmax·C/(Km+C)
 *
 *   IV bolus:               C(0+) bumps by D/V at the dose moment;
 *                           depot path is bypassed (a stays 0).
 *
 *   Multi-dose:             each dose adds a fresh depot mass at its
 *                           dose time; depot decays first-order, plasma
 *                           accumulates and clears via MM. The integrator
 *                           steps once per grid sample using RK4 over
 *                           the (a, C) state vector, applying any new
 *                           dose injection at the start of the step that
 *                           contains the dose's t_hr.
 *
 * Numerical choice — RK4 with the solver's own grid step is precise
 * enough for our typical Δt = 5 min: at MM saturation the relative
 * error is ~ (Δt · Vmax/Km)⁵ ≈ 1e-9, comfortably below IIV noise and
 * float-32 plotting precision. We don't sub-step around dose injection
 * times — the absorption rate ka is finite, so the dose enters the
 * depot smoothly across one Δt, not as an instantaneous spike.
 *
 * IV bolus is handled with an instantaneous C bump at the dose moment,
 * since otherwise the depot path doesn't apply. We snap to the
 * nearest grid index and add D/V; the integrator carries from there.
 *
 * The MC path applies multiplier samples to ka, V, F as before; Vmax
 * scales with the elimination multiplier (`m.ke`) since that's the
 * physiological clearance scale — patients with fast linear clearance
 * also tend to have higher Vmax under saturation. Km is treated as
 * compound-intrinsic (binding affinity to the eliminating enzyme) and
 * NOT scaled across the population.
 */

import { type Intake } from '@xeno/core';
import { analyteDoseMg } from './dose';
import type { PkParams } from './types';

const HOUR_MS = 3_600_000;

/**
 * Evaluate the MM rate of plasma decline at a single Cp. Public so
 * tests can probe the saturation regime without simulating a full
 * timeline. Always returns ≥ 0 (rate magnitude); caller applies the
 * negative sign in the ODE.
 */
export function mmEliminationRate(
  cp_mg_l: number,
  vmax_per_hr: number,
  km_mg_l: number,
  linear_ke_hr = 0,
): number {
  if (cp_mg_l <= 0) return 0;
  // Saturable pathway + optional parallel first-order pathway (both remove drug).
  return (vmax_per_hr * cp_mg_l) / (km_mg_l + cp_mg_l) + linear_ke_hr * cp_mg_l;
}

/**
 * Apparent elimination rate constant ke_eff at concentration Cp.
 * At Cp ≪ Km, this equals Vmax/Km (the linear regime). At Cp = Km
 * it's halved. At Cp ≫ Km it tends to zero (zero-order regime).
 * Surfaces use this to render the per-time "effective ke" label
 * alongside the curve when MM is active.
 */
export function mmEffectiveKe(
  cp_mg_l: number,
  vmax_per_hr: number,
  km_mg_l: number,
  linear_ke_hr = 0,
): number {
  // The parallel first-order pathway adds a constant ke on top of the saturable
  // one; at Cp≪Km the total is Vmax/Km + kL (the true low-dose half-life).
  if (cp_mg_l <= 0) return vmax_per_hr / km_mg_l + linear_ke_hr;
  return vmax_per_hr / (km_mg_l + cp_mg_l) + linear_ke_hr;
}

/**
 * A dose older than this has cleared for any realistic MM compound, so the
 * warm-up integration is capped here to bound the step count (the pipeline's
 * prune already limits on-board doses, but this defends an un-pruned caller).
 */
const MM_WARMUP_CAP_HR = 45 * 24;

/**
 * Number of grid steps to prepend so a dose taken BEFORE the window is
 * integrated from its real time rather than injected at full mass at index 0.
 * Returns 0 when no dose precedes the window (→ the integration is unchanged).
 * Requires a uniform grid (≥2 samples) to read the step; a single-sample grid
 * can't be extended and falls back to the old behavior.
 */
function mmWarmupSteps(
  t_hr_grid: Float64Array,
  intakes: Intake[],
  horizonStart_ms: number,
): number {
  if (t_hr_grid.length < 2) return 0;
  const grid0 = t_hr_grid[0]!;
  const dt = t_hr_grid[1]! - t_hr_grid[0]!;
  if (!(dt > 0)) return 0;
  let earliest = grid0;
  for (const i of intakes) {
    // Timing only — this loop asks when the earliest real dose was, and a
    // positive moiety fraction cannot change `> 0`. Routed through the helper
    // anyway so the no-bypass rule stays absolute.
    const dose_mg = analyteDoseMg(i.dose, i.dose_unit);
    if (!Number.isFinite(dose_mg) || dose_mg <= 0) continue;
    const t = (Date.parse(i.at) - horizonStart_ms) / HOUR_MS;
    if (t < earliest) earliest = t;
  }
  const warmStart = Math.max(earliest, grid0 - MM_WARMUP_CAP_HR);
  if (warmStart >= grid0) return 0;
  return Math.ceil((grid0 - warmStart) / dt);
}

/**
 * Integrate plasma over the time grid for ONE compound's MM path.
 * Doses are passed in via `intakes`; the integrator handles depot
 * absorption, IV bolus injection, and elimination together. The
 * caller is responsible for routing only intakes whose route this
 * compound actually has params for (the upstream pipeline already does).
 *
 * @param t_hr_grid  Hours from horizon.start, ascending uniformly spaced.
 * @param intakes    Doses for this compound (any route mix).
 * @param pk         Must satisfy `isMichaelisMentenPk(pk)`.
 * @param horizonStart_ms  Epoch ms zero of the t_hr grid.
 *
 * Returns the plasma curve sampled at each grid point.
 *
 * MM is non-linear, so a pre-window dose can't be superposed or decayed by a
 * closed form — its window-start residual depends on the full integration since
 * the dose. We therefore prepend a warm-up region back to the earliest pre-
 * window dose, integrate the whole span with the same RK4 + injection logic,
 * and slice the curve back to the window. Without this, a pre-window dose was
 * snapped to grid index 0 and injected at FULL mass, fabricating a plasma peak
 * for a drug that had actually cleared (and disagreeing with the at-now
 * headline). No pre-window dose → warm-up of 0 → byte-identical to before.
 */
export function plasmaCurveMm(
  t_hr_grid: Float64Array,
  intakes: Intake[],
  pk: PkParams & { mm_vmax_per_hr: number; mm_km_mg_per_l: number },
  horizonStart_ms: number,
  // DDI: a kinetic interaction on a saturable-elimination victim scales the
  // enzyme's Vmax (an inhibitor lowers it). These per-step multipliers come from
  // the perpetrator's instantaneous Cp(t); identity (undefined) → no interaction.
  // When `vmaxMult` is given the caller has already extended the grid + built the
  // curves over it, so the internal warm-up is skipped to keep them aligned.
  vmaxMult?: Float32Array,
  fMult?: Float32Array,
): Float32Array {
  const windowLen = t_hr_grid.length;
  if (windowLen === 0) return new Float32Array(0);

  // Prepend a warm-up region for any dose taken before the window (skipped when
  // a DDI caller pre-extended — see param docs).
  const warmupSteps = vmaxMult ? 0 : mmWarmupSteps(t_hr_grid, intakes, horizonStart_ms);
  if (warmupSteps > 0) {
    const grid0 = t_hr_grid[0]!;
    const dt = t_hr_grid[1]! - t_hr_grid[0]!;
    const extended = new Float64Array(warmupSteps + windowLen);
    for (let k = 0; k < warmupSteps; k++) extended[k] = grid0 - (warmupSteps - k) * dt;
    extended.set(t_hr_grid, warmupSteps);
    t_hr_grid = extended;
  }

  const T = t_hr_grid.length;
  const out = new Float32Array(T);

  const Vmax = pk.mm_vmax_per_hr;
  const Km = pk.mm_km_mg_per_l;
  const V = pk.V_L;
  const F = pk.F;
  const ka = pk.ka_hr;
  // Optional non-saturable pathway running in parallel with the MM one (e.g.
  // acetaminophen glucuronidation alongside saturable sulfation). 0 → pure MM.
  const kL = pk.mm_linear_ke_hr != null && pk.mm_linear_ke_hr > 0 ? pk.mm_linear_ke_hr : 0;

  // Pre-compute each intake's grid offset + the depot mass it injects.
  // IV intakes get a separate flag — they bypass the depot and bump C
  // directly at the dose moment.
  interface DoseInjection {
    grid_idx: number; // index in t_hr_grid where the dose lands
    depot_add_mg: number; // PO/IM/SC etc. — added to depot `a`
    plasma_add_mg_l: number; // IV — added directly to C
  }
  const injections: DoseInjection[] = [];

  // With the warm-up prepended above, t_hr_grid[0] now sits at (or before) the
  // earliest dose, so a dose lands at its true grid position and decays
  // correctly. The snap-to-index-0 branch below only fires for a dose older
  // than the warm-up cap — already cleared, so injecting its residual at the
  // grid start is negligible.
  for (const i of intakes) {
    const dose_mg = analyteDoseMg(i.dose, i.dose_unit, pk);
    if (!Number.isFinite(dose_mg) || dose_mg <= 0) continue;
    const dose_t_hr = (Date.parse(i.at) - horizonStart_ms) / HOUR_MS;
    let idx: number;
    if (dose_t_hr <= t_hr_grid[0]!) {
      idx = 0;
    } else if (dose_t_hr >= t_hr_grid[T - 1]!) {
      // Dose lands past the window — no contribution.
      continue;
    } else {
      // Find the first grid sample ≥ dose_t_hr. Linear scan; T < 1000.
      idx = 0;
      for (let k = 0; k < T; k++) {
        if (t_hr_grid[k]! >= dose_t_hr) {
          idx = k;
          break;
        }
      }
    }
    if (i.route === 'IV') {
      injections.push({ grid_idx: idx, depot_add_mg: 0, plasma_add_mg_l: dose_mg / V });
    } else {
      // F multiplies the depot mass: only F·D ever reaches the bloodstream.
      injections.push({ grid_idx: idx, depot_add_mg: F * dose_mg, plasma_add_mg_l: 0 });
    }
  }

  // Index injections by grid_idx for O(1) lookup during the step loop.
  const byIdx = new Map<number, DoseInjection[]>();
  for (const inj of injections) {
    let arr = byIdx.get(inj.grid_idx);
    if (!arr) {
      arr = [];
      byIdx.set(inj.grid_idx, arr);
    }
    arr.push(inj);
  }

  // State vector: [a (depot mass, mg), C (plasma, mg/L)].
  let a = 0;
  let C = 0;

  // Apply any t=0 injections before recording the first sample.
  const t0Inj = byIdx.get(0);
  if (t0Inj) {
    for (const inj of t0Inj) {
      a += inj.depot_add_mg;
      C += inj.plasma_add_mg_l;
    }
  }
  out[0] = C * (fMult ? fMult[0]! : 1);

  for (let i = 1; i < T; i++) {
    const dt = t_hr_grid[i]! - t_hr_grid[i - 1]!;
    // Vmax scaled by the (interpolated) DDI multiplier across the step.
    const vm0 = vmaxMult ? Vmax * vmaxMult[i - 1]! : Vmax;
    const vm1 = vmaxMult ? Vmax * vmaxMult[i]! : Vmax;
    const vmM = 0.5 * (vm0 + vm1);
    // RK4 step on [a, C]:
    //   da/dt = -ka·a
    //   dC/dt = (ka·a)/V - Vmax(t)·C/(Km + C) - kL·C   (saturable + parallel linear)
    // The DDI vmaxMult scales only the saturable enzyme's Vmax; the parallel
    // pathway (a different enzyme/route) is left unscaled by this edge.
    const f = (a_: number, C_: number, vmax: number): [number, number] => {
      const elim = C_ > 0 ? (vmax * C_) / (Km + C_) + kL * C_ : 0;
      return [-ka * a_, (ka * a_) / V - elim];
    };
    const [k1a, k1C] = f(a, C, vm0);
    const [k2a, k2C] = f(a + 0.5 * dt * k1a, C + 0.5 * dt * k1C, vmM);
    const [k3a, k3C] = f(a + 0.5 * dt * k2a, C + 0.5 * dt * k2C, vmM);
    const [k4a, k4C] = f(a + dt * k3a, C + dt * k3C, vm1);
    a += (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
    C += (dt / 6) * (k1C + 2 * k2C + 2 * k3C + k4C);
    if (a < 0) a = 0; // numerical noise floor — depot can't go negative
    if (C < 0) C = 0;
    // Apply any injections that land at this grid index.
    const inj = byIdx.get(i);
    if (inj) {
      for (const x of inj) {
        a += x.depot_add_mg;
        C += x.plasma_add_mg_l;
      }
    }
    out[i] = C * (fMult ? fMult[i]! : 1);
  }

  // Drop the warm-up region — callers only asked for the window samples.
  return warmupSteps > 0 ? out.slice(warmupSteps) : out;
}
