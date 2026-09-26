/**
 * periodic.ts — closed-form superposition for a regular dosing train.
 *
 * A regimen of `n` identical doses spaced `tau` hours apart is, under linear
 * PK, a geometric series of single-dose responses. Instead of summing `n`
 * Bateman terms at every grid point (O(n) per point), the finite geometric
 * sum collapses to O(1):
 *
 *   Σ_{p=0..m} e^{-k(Δ + p·tau)}  =  e^{-k·Δ} · (1 − e^{-k·tau·(m+1)}) / (1 − e^{-k·tau})
 *
 * where, at absolute elapsed time since the first dose, `m` is the index of
 * the most recent dose on board (capped at n−1) and `Δ` is the time since
 * that dose. A 90-day daily regimen then costs the same as a single dose.
 *
 * Exact for the linear forms whose shape is a sum of decaying exponentials
 * in the dose-elapsed time (1-comp Bateman, IV bolus). For 2-comp and
 * zero-order the same principle applies per exponential term, but the
 * book-keeping (and the τ<release overlap case for patches) earns its keep
 * only for very long trains; we fall back to an explicit sum over the doses
 * actually on board — which washout-windowing already keeps small — for
 * those, for the ka≈ke removable singularity, and for MM (no superposition).
 */

import type { Route } from '@xeno/core';
import type { PkParams } from './types';
import { isTwoCompPk, isZeroOrderPk, isMichaelisMentenPk } from './types';
import { plasmaAt } from './pk';

/** A regular dosing train, in hours-from-horizon-start coordinates. */
export interface Regimen {
  /** Hours from horizon start to the first dose. */
  t0_hr: number;
  /** Interval between doses, hours (> 0). */
  tau_hr: number;
  /** Number of doses in the train (≥ 1). */
  n: number;
  /** Mass per dose, mg (already route-scaled by the caller). */
  dose_mg: number;
  route: Route;
}

const KA_KE_EPS = 1e-6;
const KTAU_EPS = 1e-9;

/**
 * Finite geometric sum Σ_{p=0..m} e^{-k·(delta + p·tau)}. Stable: the ratio
 * e^{-k·tau} ∈ (0,1], summed forward. Handles the k·tau → 0 removable
 * singularity (the sum is just (m+1) equal terms in the limit).
 */
function geomSum(k: number, delta: number, m: number, tau: number): number {
  const head = Math.exp(-k * delta);
  const x = k * tau;
  if (x < KTAU_EPS) return head * (m + 1);
  const r = Math.exp(-x);
  return (head * (1 - Math.exp(-x * (m + 1)))) / (1 - r);
}

/**
 * Plasma concentration at `t_hr` from a whole regimen. Closed-form O(1) for
 * 1-comp first-order and IV; explicit (bounded) otherwise.
 */
export function periodicAt(t_hr: number, r: Regimen, pk: PkParams): number {
  // Absorption lag time-shifts the whole train's response uniformly: fold it
  // into `elapsed` once here so neither the closed form nor the explicit
  // fallback re-applies it (plasmaAt would otherwise lag each dose again).
  const lag = pk.lag_hr != null && pk.lag_hr > 0 ? pk.lag_hr : 0;
  const elapsed = t_hr - r.t0_hr - lag;
  if (elapsed < 0) return 0;
  const m = Math.min(r.n - 1, Math.floor(elapsed / r.tau_hr));
  const delta = elapsed - m * r.tau_hr;

  // No superposition under saturation; the closed forms assume 1-comp
  // first-order. Everything else (2-comp, zero-order, ka≈ke singularity,
  // MM) takes the exact explicit path — bounded by doses on board, which
  // washout-windowing keeps small. Strip lag from the pk we hand plasmaAt
  // since `elapsed` already applied it.
  if (
    isMichaelisMentenPk(pk) ||
    isTwoCompPk(pk) ||
    isZeroOrderPk(pk) ||
    Math.abs(pk.ka_hr - pk.ke_hr) < KA_KE_EPS
  ) {
    const lagFree = lag > 0 ? { ...pk, lag_hr: undefined } : pk;
    let c = 0;
    for (let p = 0; p <= m; p++) {
      c += plasmaAt(delta + p * r.tau_hr, r.dose_mg, lagFree, r.route);
    }
    return c;
  }

  if (r.route === 'IV') {
    // IV bolus: C = (D/V)·e^{-ke·t}, one exponential.
    return (r.dose_mg / pk.V_L) * geomSum(pk.ke_hr, delta, m, r.tau_hr);
  }

  // 1-comp Bateman: P·(e^{-ke·τ} − e^{-ka·τ}) per dose → P·(S_ke − S_ka).
  const P = (pk.F * r.dose_mg * pk.ka_hr) / (pk.V_L * (pk.ka_hr - pk.ke_hr));
  return P * (geomSum(pk.ke_hr, delta, m, r.tau_hr) - geomSum(pk.ka_hr, delta, m, r.tau_hr));
}

/** Sample a regimen's contribution across a time grid (hours-from-start). */
export function periodicCurve(t_hr_grid: Float64Array, r: Regimen, pk: PkParams): Float32Array {
  const out = new Float32Array(t_hr_grid.length);
  for (let i = 0; i < t_hr_grid.length; i++) {
    out[i] = periodicAt(t_hr_grid[i]!, r, pk);
  }
  return out;
}

/**
 * Add a regimen's contribution onto an existing plasma buffer (in place),
 * mirroring `addDose` so regimens and discrete intakes compose on one curve.
 */
export function addRegimen(
  buf: Float32Array,
  t_hr_grid: Float64Array,
  r: Regimen,
  pk: PkParams,
): Float32Array {
  for (let i = 0; i < t_hr_grid.length; i++) {
    buf[i]! += periodicAt(t_hr_grid[i]!, r, pk);
  }
  return buf;
}
