/**
 * periodic.test.ts — the closed-form regimen superposition must equal an
 * explicit sum of n single-dose Bateman responses, for every PK form and
 * the singular edges (ka≈ke, near-zero k·τ, lag, finite-n decay tail).
 */
import { describe, it, expect } from 'vitest';
import { periodicAt, type Regimen } from '../src/periodic';
import { plasmaAt } from '../src/pk';
import type { PkParams } from '../src/types';

/** Ground truth: sum each dose's single-dose response (plasmaAt handles lag
 *  and the t<0 "not yet" case per dose). */
function explicitRef(t_hr: number, r: Regimen, pk: PkParams): number {
  let c = 0;
  for (let i = 0; i < r.n; i++) {
    c += plasmaAt(t_hr - (r.t0_hr + i * r.tau_hr), r.dose_mg, pk, r.route);
  }
  return c;
}

function near(a: number, b: number, rel = 1e-6): void {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(rel * Math.max(1, Math.abs(b)) + 1e-9);
}

const CAFFEINE: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1 };
const TWO_COMP: PkParams = {
  ka_hr: 4,
  ke_hr: 0.1,
  V_L: 40,
  F: 0.9,
  alpha_hr: 1.5,
  beta_hr: 0.08,
  k21_hr: 0.4,
};
const ZERO_ORDER: PkParams = { ka_hr: 1, ke_hr: Math.LN2 / 10, V_L: 36, F: 0.9, zo_dur_hr: 6 };

const SWEEP = [0.5, 5, 23.9, 24, 73.2, 100, 500];

describe('closed-form == explicit superposition', () => {
  it('1-comp PO, 90 daily doses', () => {
    const r: Regimen = { t0_hr: 0, tau_hr: 24, n: 90, dose_mg: 100, route: 'PO' };
    for (const t of [...SWEEP, 2136 /* last dose */, 2200, 3000])
      near(periodicAt(t, r, CAFFEINE), explicitRef(t, r, CAFFEINE));
  });

  it('1-comp PO, frequent dosing (q4h ×200) — high accumulation', () => {
    const r: Regimen = { t0_hr: 0, tau_hr: 4, n: 200, dose_mg: 50, route: 'PO' };
    for (const t of [3.9, 4, 80, 400, 796, 900])
      near(periodicAt(t, r, CAFFEINE), explicitRef(t, r, CAFFEINE));
  });

  it('IV bolus train', () => {
    const r: Regimen = { t0_hr: 0, tau_hr: 12, n: 30, dose_mg: 10, route: 'IV' };
    for (const t of SWEEP) near(periodicAt(t, r, CAFFEINE), explicitRef(t, r, CAFFEINE));
  });

  it('2-comp (explicit fallback path stays exact)', () => {
    const r: Regimen = { t0_hr: 0, tau_hr: 24, n: 40, dose_mg: 100, route: 'PO' };
    for (const t of SWEEP) near(periodicAt(t, r, TWO_COMP), explicitRef(t, r, TWO_COMP));
  });

  it('zero-order release (explicit fallback path stays exact)', () => {
    const r: Regimen = { t0_hr: 0, tau_hr: 24, n: 20, dose_mg: 100, route: 'TD' };
    for (const t of SWEEP) near(periodicAt(t, r, ZERO_ORDER), explicitRef(t, r, ZERO_ORDER));
  });
});

describe('singular edges', () => {
  it('ka≈ke removable singularity (fallback)', () => {
    const k = 0.5;
    const flip: PkParams = { ka_hr: k, ke_hr: k + 1e-9, V_L: 30, F: 1 };
    const r: Regimen = { t0_hr: 0, tau_hr: 8, n: 30, dose_mg: 100, route: 'PO' };
    for (const t of SWEEP) near(periodicAt(t, r, flip), explicitRef(t, r, flip));
  });

  it('near-zero k·τ (long half-life, frequent dosing — geometric stays stable)', () => {
    const slow: PkParams = { ka_hr: 2, ke_hr: Math.LN2 / 2000, V_L: 50, F: 0.8 };
    const r: Regimen = { t0_hr: 0, tau_hr: 1, n: 500, dose_mg: 10, route: 'PO' };
    for (const t of [50, 250, 499, 600])
      near(periodicAt(t, r, slow), explicitRef(t, r, slow), 1e-5);
  });

  it('absorption lag shifts the whole train once (no double-lag)', () => {
    const lagged: PkParams = { ...CAFFEINE, lag_hr: 1.5 };
    const r: Regimen = { t0_hr: 0, tau_hr: 12, n: 20, dose_mg: 100, route: 'PO' };
    for (const t of [1, 1.6, 5, 50, 240]) near(periodicAt(t, r, lagged), explicitRef(t, r, lagged));
  });
});

describe('boundaries', () => {
  it('n=1 equals a single dose', () => {
    const r: Regimen = { t0_hr: 3, tau_hr: 24, n: 1, dose_mg: 100, route: 'PO' };
    near(periodicAt(10, r, CAFFEINE), plasmaAt(7, 100, CAFFEINE, 'PO'));
  });

  it('zero before the first dose', () => {
    const r: Regimen = { t0_hr: 5, tau_hr: 24, n: 10, dose_mg: 100, route: 'PO' };
    expect(periodicAt(4, r, CAFFEINE)).toBe(0);
  });

  it('finite train: pure decay after the last dose', () => {
    const r: Regimen = { t0_hr: 0, tau_hr: 6, n: 5, dose_mg: 100, route: 'PO' };
    // well past the 5th dose (t=24): only decay of all 5 remains
    for (const t of [30, 60, 120]) near(periodicAt(t, r, CAFFEINE), explicitRef(t, r, CAFFEINE));
  });
});
