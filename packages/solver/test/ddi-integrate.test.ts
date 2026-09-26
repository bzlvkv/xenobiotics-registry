/**
 * victimCurveTimeVaryingKe — foundational correctness before it's wired into the
 * DDI path. The whole faithful-DDI fix rests on this integrator being EXACT at
 * constant ke (so a time-varying interaction is the only thing that moves the
 * curve, never the integrator itself). We pin it against the closed-form Bateman.
 */

import { describe, it, expect } from 'vitest';
import { ulid } from 'ulid';
import type { Intake } from '@xeno/core';
import { plasmaCurve, addDose } from '../src/pk';
import { victimCurveTimeVaryingKe } from '../src/ddi-integrate';
import type { PkParams } from '../src/types';

const HORIZON_START = Date.parse('2026-04-27T08:00:00Z');
const HOUR_MS = 3_600_000;
const PK: PkParams = { ka_hr: 1.2, ke_hr: 0.15, V_L: 40, F: 0.9 };

function buildGrid(hours: number, stepMin: number): Float64Array {
  const T = Math.floor((hours * 60) / stepMin) + 1;
  const out = new Float64Array(T);
  for (let i = 0; i < T; i++) out[i] = (i * stepMin) / 60;
  return out;
}
function makeIntake(at_ms: number, dose_mg: number, route: 'PO' | 'IV' = 'PO'): Intake {
  const iso = new Date(at_ms).toISOString();
  return {
    id: ulid(),
    compound: 'victim',
    dose: dose_mg,
    dose_unit: 'mg',
    route,
    at: iso,
    created_at: iso,
    updated_at: iso,
  };
}
const filled = (T: number, v: number) => {
  const a = new Float32Array(T);
  a.fill(v);
  return a;
};
function maxAbsDiff(a: Float32Array, b: Float32Array): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i]! - b[i]!));
  return m;
}

describe('victimCurveTimeVaryingKe — exact at constant ke', () => {
  it('keMult ≡ 1, fMult ≡ 1 reproduces the closed-form Bateman (single PO dose)', () => {
    const grid = buildGrid(24, 5);
    const T = grid.length;
    const num = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const closed = plasmaCurve(grid, 100, PK, 'PO');
    expect(maxAbsDiff(num, closed)).toBeLessThan(1e-3); // peak ~2.2 mg/L → <0.05% error
  });

  it('a constant keMult = s reproduces the closed form with ke scaled by s', () => {
    const grid = buildGrid(24, 5);
    const T = grid.length;
    const s = 0.5; // a strong inhibitor halving clearance
    const num = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK,
      HORIZON_START,
      filled(T, s),
      filled(T, 1),
    );
    const closed = plasmaCurve(grid, 100, { ...PK, ke_hr: PK.ke_hr * s }, 'PO');
    expect(maxAbsDiff(num, closed)).toBeLessThan(2e-3);
  });

  it('a constant fMult = c scales the whole curve by c (linear F displacement)', () => {
    const grid = buildGrid(24, 5);
    const T = grid.length;
    const base = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const scaled = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1.3),
    );
    for (let i = 0; i < T; i++) expect(Math.abs(scaled[i]! - 1.3 * base[i]!)).toBeLessThan(1e-4);
  });

  it('multi-dose superposes (linear) at constant ke', () => {
    const grid = buildGrid(24, 5);
    const T = grid.length;
    const num = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100), makeIntake(HORIZON_START + 4 * HOUR_MS, 100)],
      PK,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const closed = new Float32Array(T);
    addDose(closed, grid, { t_hr: 0, dose_mg: 100, route: 'PO' }, PK);
    addDose(closed, grid, { t_hr: 4, dose_mg: 100, route: 'PO' }, PK);
    expect(maxAbsDiff(num, closed)).toBeLessThan(2e-3);
  });

  it('IV bolus matches the closed-form IV decay (depot bypassed)', () => {
    const grid = buildGrid(24, 5);
    const T = grid.length;
    const num = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100, 'IV')],
      PK,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const closed = plasmaCurve(grid, 100, PK, 'IV');
    expect(maxAbsDiff(num, closed)).toBeLessThan(2e-3);
  });
});

describe('victimCurveTimeVaryingKe — 2-comp exact at constant ke', () => {
  // Well-separated macro-constants → micro-constants k10=αβ/k21=0.8, k12=0.9 (physical).
  const PK2: PkParams = {
    ka_hr: 3,
    ke_hr: 0.2,
    V_L: 40,
    F: 0.9,
    alpha_hr: 2.0,
    beta_hr: 0.2,
    k21_hr: 0.5,
  };
  const auc = (c: Float32Array) => {
    let s = 0;
    for (let i = 0; i < c.length; i++) s += c[i]!;
    return s;
  };

  it('2-comp PO at keMult ≡ 1 reproduces the closed-form bi-exponential', () => {
    const grid = buildGrid(24, 5);
    const T = grid.length;
    const num = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK2,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const closed = plasmaCurve(grid, 100, PK2, 'PO');
    expect(maxAbsDiff(num, closed)).toBeLessThan(5e-3);
  });

  it('2-comp IV at keMult ≡ 1 reproduces the closed-form IV bi-exponential', () => {
    const grid = buildGrid(24, 5);
    const T = grid.length;
    const num = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100, 'IV')],
      PK2,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const closed = plasmaCurve(grid, 100, PK2, 'IV');
    expect(maxAbsDiff(num, closed)).toBeLessThan(5e-3);
  });

  it('holds at a COARSE 15-min step too (sub-stepping keeps the fast α phase accurate)', () => {
    const grid = buildGrid(48, 15);
    const T = grid.length;
    const num = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK2,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const closed = plasmaCurve(grid, 100, PK2, 'PO');
    expect(maxAbsDiff(num, closed)).toBeLessThan(5e-3);
  });

  it('inhibition (keMult < 1) raises the 2-comp victim AUC', () => {
    const grid = buildGrid(48, 5);
    const T = grid.length;
    const base = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK2,
      HORIZON_START,
      filled(T, 1),
      filled(T, 1),
    );
    const inhib = victimCurveTimeVaryingKe(
      grid,
      [makeIntake(HORIZON_START, 100)],
      PK2,
      HORIZON_START,
      filled(T, 0.5),
      filled(T, 1),
    );
    expect(auc(inhib)).toBeGreaterThan(auc(base));
  });
});
