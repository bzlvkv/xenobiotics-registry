/**
 * ddi-integrate.ts — numerically integrate a VICTIM under a TIME-VARYING
 * clearance driven by a perpetrator's instantaneous concentration.
 *
 * The closed-form Bateman / bi-exponential forms assume a CONSTANT clearance. A
 * kinetic interaction whose strength tracks the perpetrator's plasma level makes
 * clearance a function of time, so the victim has to be integrated. This handles
 * the two linear disposition shapes:
 *
 *   1-compartment:   depot a + central C
 *       da/dt = -ka·a                         (loaded with F·D per dose)
 *       dC/dt = (ka·a)/V − ke(t)·C            ke(t) = ke_base · keMult[i]
 *
 *   2-compartment:   depot a + central C1 + peripheral C2
 *       da/dt  = -ka·a
 *       dC1/dt = (ka·a)/V1 − (k10(t)+k12)·C1 + k21·C2   k10(t) = k10_base·keMult[i]
 *       dC2/dt = k12·C1 − k21·C2
 *     with micro-constants from the authored macro-constants:
 *       k10_base = α·β / k21,   k12 = α + β − k21 − k10_base,   V1 = V_L
 *     (the interaction scales the ELIMINATION k10, not the distribution rates).
 *
 * IV bolus bumps the central compartment by D/V at the dose moment (depot
 * bypassed). Multi-dose is integrated JOINTLY — superposition does not hold
 * under a time-varying rate. `fMult` (free-fraction / binding displacement)
 * multiplies the reported plasma per step; for a linear system that is exactly
 * equivalent to scaling F when constant.
 *
 * Accuracy: each grid step is sub-divided so (fastest rate)·sub-step ≤ 0.2,
 * keeping RK4 accurate even at coarse chart steps (15 min at a 1-week horizon).
 * Pinned EXACT at constant ke/k10 against the closed forms in pk.ts.
 */

import { type Intake } from '@xeno/core';
import { analyteDoseMg } from './dose';
import type { PkParams } from './types';
import { isTwoCompPk } from './types';

const HOUR_MS = 3_600_000;
/** Sub-step so (fastest rate)·Δt_sub stays small → RK4 holds at coarse grids. */
const MAX_RATE_STEP = 0.2;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function subSteps(dt: number, maxRate: number): number {
  if (!(dt > 0) || !(maxRate > 0)) return 1;
  return Math.max(1, Math.ceil((maxRate * dt) / MAX_RATE_STEP));
}

interface Injection {
  idx: number;
  depot: number;
  central: number;
}

/** Snap each dose to a grid index, splitting into depot load (F·D, first-order
 *  absorption) vs central bump (IV bolus, D/V). Shared by both disposition
 *  shapes — V is the central volume in each. */
function buildInjections(
  t_hr_grid: Float64Array,
  intakes: Intake[],
  horizonStart_ms: number,
  V: number,
  F: number,
  lag: number,
  // Carries only the moiety fraction; V/F/lag are already passed as scalars
  // because the two disposition shapes read them from different places.
  moiety: { dose_moiety_fraction?: number } | null,
): Map<number, Injection[]> {
  const T = t_hr_grid.length;
  const byIdx = new Map<number, Injection[]>();
  for (const i of intakes) {
    const dose_mg = analyteDoseMg(i.dose, i.dose_unit, moiety);
    if (!Number.isFinite(dose_mg) || dose_mg <= 0) continue;
    const dose_t_hr = (Date.parse(i.at) - horizonStart_ms) / HOUR_MS + lag;
    let idx: number;
    if (dose_t_hr <= t_hr_grid[0]!) idx = 0;
    else if (dose_t_hr >= t_hr_grid[T - 1]!) continue;
    else {
      idx = 0;
      for (let k = 0; k < T; k++) {
        if (t_hr_grid[k]! >= dose_t_hr) {
          idx = k;
          break;
        }
      }
    }
    const inj: Injection =
      i.route === 'IV'
        ? { idx, depot: 0, central: dose_mg / V }
        : { idx, depot: F * dose_mg, central: 0 };
    let arr = byIdx.get(idx);
    if (!arr) {
      arr = [];
      byIdx.set(idx, arr);
    }
    arr.push(inj);
  }
  return byIdx;
}

export function victimCurveTimeVaryingKe(
  t_hr_grid: Float64Array,
  intakes: Intake[],
  pk: PkParams,
  horizonStart_ms: number,
  keMult: Float32Array, // clearance scaling per grid step; length === T
  fMult: Float32Array, // free-fraction scaling per grid step; length === T
): Float32Array {
  return isTwoCompPk(pk)
    ? twoComp(t_hr_grid, intakes, pk, horizonStart_ms, keMult, fMult)
    : oneComp(t_hr_grid, intakes, pk, horizonStart_ms, keMult, fMult);
}

function oneComp(
  t_hr_grid: Float64Array,
  intakes: Intake[],
  pk: PkParams,
  horizonStart_ms: number,
  keMult: Float32Array,
  fMult: Float32Array,
): Float32Array {
  const T = t_hr_grid.length;
  const out = new Float32Array(T);
  if (T === 0) return out;

  const ka = pk.ka_hr;
  const keBase = pk.ke_hr;
  const V = pk.V_L;
  const lag = pk.lag_hr != null && pk.lag_hr > 0 ? pk.lag_hr : 0;
  const byIdx = buildInjections(t_hr_grid, intakes, horizonStart_ms, V, pk.F, lag, pk);

  let a = 0;
  let C = 0;
  const t0 = byIdx.get(0);
  if (t0)
    for (const inj of t0) {
      a += inj.depot;
      C += inj.central;
    }
  out[0] = C * fMult[0]!;

  for (let i = 1; i < T; i++) {
    const dt = t_hr_grid[i]! - t_hr_grid[i - 1]!;
    const km0 = keMult[i - 1]!;
    const km1 = keMult[i]!;
    const nsub = subSteps(dt, Math.max(ka, keBase * Math.max(km0, km1)));
    const h = dt / nsub;
    for (let s = 0; s < nsub; s++) {
      const ke0 = keBase * lerp(km0, km1, s / nsub);
      const keM = keBase * lerp(km0, km1, (s + 0.5) / nsub);
      const ke1 = keBase * lerp(km0, km1, (s + 1) / nsub);
      const f = (a_: number, C_: number, ke_: number): [number, number] => [
        -ka * a_,
        (ka * a_) / V - ke_ * C_,
      ];
      const [k1a, k1C] = f(a, C, ke0);
      const [k2a, k2C] = f(a + 0.5 * h * k1a, C + 0.5 * h * k1C, keM);
      const [k3a, k3C] = f(a + 0.5 * h * k2a, C + 0.5 * h * k2C, keM);
      const [k4a, k4C] = f(a + h * k3a, C + h * k3C, ke1);
      a += (h / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
      C += (h / 6) * (k1C + 2 * k2C + 2 * k3C + k4C);
      if (a < 0) a = 0;
      if (C < 0) C = 0;
    }
    const inj = byIdx.get(i);
    if (inj)
      for (const x of inj) {
        a += x.depot;
        C += x.central;
      }
    out[i] = C * fMult[i]!;
  }
  return out;
}

function twoComp(
  t_hr_grid: Float64Array,
  intakes: Intake[],
  pk: PkParams & { alpha_hr: number; beta_hr: number; k21_hr: number },
  horizonStart_ms: number,
  keMult: Float32Array,
  fMult: Float32Array,
): Float32Array {
  const T = t_hr_grid.length;
  const out = new Float32Array(T);
  if (T === 0) return out;

  const ka = pk.ka_hr;
  const V1 = pk.V_L;
  const lag = pk.lag_hr != null && pk.lag_hr > 0 ? pk.lag_hr : 0;
  const a_ = pk.alpha_hr;
  const b_ = pk.beta_hr;
  const k21 = pk.k21_hr;
  // Macro → micro. The interaction scales the elimination k10 only (a CYP
  // inhibitor changes clearance, not the distribution rates k12/k21).
  // Convention: c1, c2 are CENTRAL-NORMALIZED (c2 ≡ A2/V1, peripheral amount per
  // central volume). The amount ODE dA2/dt = k12·A1 − k21·A2 divided by V1 gives
  // exactly dc2/dt = k12·c1 − k21·c2, so no V2/V1 factor appears and c1 = A1/V1
  // is the reported central concentration. Verified: at keMult≡1 this reproduces
  // plasmaAt2CompIV/PO, and AUC = D/(V1·k10).
  const k10Base = k21 > 0 ? (a_ * b_) / k21 : b_;
  const k12 = Math.max(0, a_ + b_ - k21 - k10Base);
  const fastRate = Math.max(ka, a_); // α is the dominant fast eigenvalue

  const byIdx = buildInjections(t_hr_grid, intakes, horizonStart_ms, V1, pk.F, lag, pk);

  let dep = 0; // depot
  let c1 = 0; // central
  let c2 = 0; // peripheral
  const t0 = byIdx.get(0);
  if (t0)
    for (const inj of t0) {
      dep += inj.depot;
      c1 += inj.central;
    }
  out[0] = c1 * fMult[0]!;

  for (let i = 1; i < T; i++) {
    const dt = t_hr_grid[i]! - t_hr_grid[i - 1]!;
    const km0 = keMult[i - 1]!;
    const km1 = keMult[i]!;
    const nsub = subSteps(dt, fastRate);
    const h = dt / nsub;
    for (let s = 0; s < nsub; s++) {
      const k10a = k10Base * lerp(km0, km1, s / nsub);
      const k10m = k10Base * lerp(km0, km1, (s + 0.5) / nsub);
      const k10b = k10Base * lerp(km0, km1, (s + 1) / nsub);
      const f = (A: number, C1: number, C2: number, k10: number): [number, number, number] => [
        -ka * A,
        (ka * A) / V1 - (k10 + k12) * C1 + k21 * C2,
        k12 * C1 - k21 * C2,
      ];
      const [j1a, j1b, j1c] = f(dep, c1, c2, k10a);
      const [j2a, j2b, j2c] = f(dep + 0.5 * h * j1a, c1 + 0.5 * h * j1b, c2 + 0.5 * h * j1c, k10m);
      const [j3a, j3b, j3c] = f(dep + 0.5 * h * j2a, c1 + 0.5 * h * j2b, c2 + 0.5 * h * j2c, k10m);
      const [j4a, j4b, j4c] = f(dep + h * j3a, c1 + h * j3b, c2 + h * j3c, k10b);
      dep += (h / 6) * (j1a + 2 * j2a + 2 * j3a + j4a);
      c1 += (h / 6) * (j1b + 2 * j2b + 2 * j3b + j4b);
      c2 += (h / 6) * (j1c + 2 * j2c + 2 * j3c + j4c);
      if (dep < 0) dep = 0;
      if (c1 < 0) c1 = 0;
      if (c2 < 0) c2 = 0;
    }
    const inj = byIdx.get(i);
    if (inj)
      for (const x of inj) {
        dep += x.depot;
        c1 += x.central;
      }
    out[i] = c1 * fMult[i]!;
  }
  return out;
}
