/**
 * mc.ts — Monte Carlo IIV sampling.
 *
 * Inter-individual variability (IIV) means the same dose produces
 * different curves in different people. Standard PopPK practice models
 * each PK param as log-normal (positive-bounded, right-skewed):
 *
 *     param_i  =  param_typical · exp(η_i),    η_i ~ N(0, ω²)
 *
 * where ω² is the variance corresponding to the reported CV%:
 *
 *     ω = sqrt( ln(1 + CV²) )                  (exact form)
 *     ω ≈ CV                                   (small-CV approximation)
 *
 * We use the exact form so that 30% CV is faithfully wide.
 *
 * Determinism: tests pin a `seed` and we use a small in-place PRNG
 * (Mulberry32) instead of Math.random — same seed, same MC samples,
 * everywhere, always.
 */

import type { IIV, PkParams } from './types';
import { REFERENCE_WEIGHT_KG } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// PRNG — Mulberry32, deterministic, ~uniform on (0, 1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a function that yields the next pseudorandom number on each call.
 * Mulberry32 is small and gives excellent statistical quality for our
 * sample sizes (up to ~10⁶). Seed must be an integer.
 */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform: two uniforms → one standard-normal sample.
 * Re-runs to regenerate; we don't cache the second draw because the
 * cost is negligible at MC sample counts in [50, 1000].
 */
export function gaussian(rand: () => number): number {
  // Avoid log(0) by clamping u away from zero.
  const u1 = Math.max(rand(), Number.MIN_VALUE);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Sample a value from log-normal(typical, cv). When cv == 0, returns the
 * typical value exactly — useful for "compute the mean curve only" paths.
 */
export function lognormalSample(typical: number, cv: number, rand: () => number): number {
  if (cv <= 0) return typical;
  const omega = Math.sqrt(Math.log(1 + cv * cv));
  return typical * Math.exp(omega * gaussian(rand));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sampling a full PK param vector
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Multiplier vector applied to a typical PK param set to get one MC realization.
 * Drawn once per patient-iteration; the same multipliers should apply to every
 * route of a single compound (a person whose Vd is at the high end has high Vd
 * regardless of how the molecule entered the bloodstream — patient physiology
 * is correlated across routes).
 */
export interface PkMultipliers {
  ka: number;
  ke: number;
  V: number;
  F: number;
}

/**
 * Draw one set of patient-physiology multipliers. The multipliers are pure
 * scalars centered on 1; the realized F is clamped to (0, 1] after
 * multiplication in applyPkMultipliers, not here, because the clamp is
 * physical (bioavailability) and shouldn't bleed into the multiplier itself.
 */
export function samplePkMultipliers(iiv: IIV, rand: () => number): PkMultipliers {
  return {
    ka: lognormalSample(1, iiv.ka_cv, rand),
    ke: lognormalSample(1, iiv.ke_cv, rand),
    V: lognormalSample(1, iiv.V_cv, rand),
    F: lognormalSample(1, iiv.F_cv, rand),
  };
}

/**
 * Apply a multiplier vector to a typical PK parameter set. Bioavailability
 * is clamped to (0, 1] after scaling. 2-comp disposition rates (α, β, k₂₁)
 * scale with the elimination multiplier — they're all inverse-time rates
 * that share the same patient-clearance physiology.
 */
export function applyPkMultipliers(typical: PkParams, m: PkMultipliers): PkParams {
  return {
    ka_hr: typical.ka_hr * m.ka,
    ke_hr: typical.ke_hr * m.ke,
    V_L: typical.V_L * m.V,
    F: Math.min(1, Math.max(0.001, typical.F * m.F)),
    alpha_hr: typical.alpha_hr != null ? typical.alpha_hr * m.ke : undefined,
    beta_hr: typical.beta_hr != null ? typical.beta_hr * m.ke : undefined,
    k21_hr: typical.k21_hr != null ? typical.k21_hr * m.ke : undefined,
    // Vmax scales with the elimination multiplier (same physiology
    // as ke — fast-clearance patients tend to have higher saturable
    // capacity too). Km is enzyme-binding-affinity intrinsic to the
    // molecule and stays fixed across the population.
    mm_vmax_per_hr: typical.mm_vmax_per_hr != null ? typical.mm_vmax_per_hr * m.ke : undefined,
    mm_km_mg_per_l: typical.mm_km_mg_per_l,
    // Parallel first-order pathway is a clearance rate constant → scales with the
    // ke multiplier (weight allometry + IIV), same as the saturable Vmax.
    mm_linear_ke_hr: typical.mm_linear_ke_hr != null ? typical.mm_linear_ke_hr * m.ke : undefined,
    // Zero-order release duration and lag are formulation/device properties
    // (a patch's wear time, a depot's release window) — fixed across patients,
    // so they pass through unscaled. Patient IIV lives in ke/V/F. Must be
    // carried here or the realization would silently drop to first-order.
    zo_dur_hr: typical.zo_dur_hr,
    lag_hr: typical.lag_hr,
    source_pmid: typical.source_pmid,
  };
}

/**
 * Allometric body-weight scaling of a resolved PK param set. Volumes scale
 * linearly with weight (V ∝ WT¹); clearance scales as WT^0.75, and since every
 * disposition parameter here is a RATE CONSTANT (rate = clearance / volume),
 * ke, α, β, k₂₁ and the concentration-form MM Vmax all scale as WT^(0.75−1) =
 * WT^−0.25. Km (enzyme affinity), ka (absorption), F, and formulation timings
 * are weight-independent. Identity at REFERENCE_WEIGHT_KG. Reuses
 * applyPkMultipliers so the field-by-field scaling stays in one place — note it
 * already scales alpha/beta/k21/mm_vmax by the `ke` multiplier, which is exactly
 * the WT^−0.25 factor we want for those rates.
 */
export function scalePkForWeight(pk: PkParams, weight_kg: number): PkParams {
  if (!(weight_kg > 0) || weight_kg === REFERENCE_WEIGHT_KG) return pk;
  const w = weight_kg / REFERENCE_WEIGHT_KG;
  return applyPkMultipliers(pk, { ka: 1, ke: Math.pow(w, -0.25), V: w, F: 1 });
}

/**
 * Draw one MC realization of PK params. Convenience wrapper over
 * samplePkMultipliers + applyPkMultipliers — used by tests and any caller
 * that has a single (compound, route) PK to perturb. The pipeline draws
 * multipliers once per compound and applies them to all of that compound's
 * routes so cross-route variability stays correlated.
 */
export function samplePk(typical: PkParams, iiv: IIV, rand: () => number): PkParams {
  return applyPkMultipliers(typical, samplePkMultipliers(iiv, rand));
}

// ─────────────────────────────────────────────────────────────────────────────
// Percentile bands across N samples
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given N curves of length T (an N × T matrix shaped as Float32Array[N]),
 * compute the per-time-point percentile across the N samples.
 *
 * Uses linear interpolation between sorted samples. For T ≈ 600,
 * N ≈ 200 this runs in a few ms — well under the perf budget for
 * a 5-compound 48h solve (spec §07: < 50ms on M1).
 */
export function percentile(samples: Float32Array[], p: number): Float32Array {
  if (samples.length === 0) throw new Error('percentile: no samples');
  const N = samples.length;
  // `samples[0]` is non-null after the length check above. The bracket
  // accesses inside the inner loops are also safe — `t` is bounded by
  // `T = samples[0].length`, `n` by N, so each sample's row of length T
  // is fully addressable. `!` rather than null guards keeps the hot
  // loop branch-free.
  const T = samples[0]!.length;
  const out = new Float32Array(T);
  const col = new Float32Array(N);

  for (let t = 0; t < T; t++) {
    for (let n = 0; n < N; n++) col[n] = samples[n]![t]!;
    col.sort();
    const idx = (N - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const frac = idx - lo;
    out[t] = col[lo]! * (1 - frac) + col[hi]! * frac;
  }
  return out;
}

/**
 * One-pass mean + p10 + p90 across N samples of length T. Replaces a
 * `meanCurve` + two `percentile` calls — which summed once and sorted each
 * column twice — with a single column gather that folds the mean in and
 * sorts once, reading both percentile indices off the same sorted column.
 *
 * Byte-identical to the separate calls: the mean accumulates in the same
 * n-order, and both percentiles read the same order statistics from the
 * same sort with the same linear interpolation.
 */
export function summarizeBands(samples: Float32Array[]): {
  mean: Float32Array;
  p10: Float32Array;
  p90: Float32Array;
} {
  if (samples.length === 0) throw new Error('summarizeBands: no samples');
  const N = samples.length;
  const T = samples[0]!.length;
  const mean = new Float32Array(T);
  const p10 = new Float32Array(T);
  const p90 = new Float32Array(T);
  const col = new Float32Array(N);

  const i10 = (N - 1) * 0.1;
  const lo10 = Math.floor(i10);
  const hi10 = Math.ceil(i10);
  const f10 = i10 - lo10;
  const i90 = (N - 1) * 0.9;
  const lo90 = Math.floor(i90);
  const hi90 = Math.ceil(i90);
  const f90 = i90 - lo90;

  for (let t = 0; t < T; t++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      const v = samples[n]![t]!;
      col[n] = v;
      sum += v;
    }
    mean[t] = sum / N;
    col.sort();
    p10[t] = col[lo10]! * (1 - f10) + col[hi10]! * f10;
    p90[t] = col[lo90]! * (1 - f90) + col[hi90]! * f90;
  }
  return { mean, p10, p90 };
}

/**
 * Mean curve across samples. Faster than percentile(0.5) and what
 * surfaces actually want for the headline plasma line — P50 medians
 * are noisier in Monte Carlo at modest sample counts.
 */
export function meanCurve(samples: Float32Array[]): Float32Array {
  if (samples.length === 0) throw new Error('meanCurve: no samples');
  const N = samples.length;
  const T = samples[0]!.length;
  const out = new Float32Array(T);

  for (let n = 0; n < N; n++) {
    const s = samples[n]!;
    for (let t = 0; t < T; t++) out[t]! += s[t]!;
  }
  for (let t = 0; t < T; t++) out[t]! /= N;
  return out;
}
