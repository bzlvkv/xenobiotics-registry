/**
 * Allometric body-weight scaling (scalePkForWeight).
 *
 * Convention: V ∝ WT¹, clearance ∝ WT^0.75. The model stores rate constants
 * (rate = clearance / volume), so every rate constant — ke, α, β, k₂₁, and the
 * concentration-form MM Vmax — scales as WT^(0.75−1) = WT^−0.25. Km, ka, F and
 * formulation timings are weight-independent. Identity at the reference weight.
 */

import { describe, it, expect } from 'vitest';
import { scalePkForWeight } from '../src/mc';
import { REFERENCE_WEIGHT_KG } from '../src/types';
import type { PkParams } from '../src/types';

const REF = REFERENCE_WEIGHT_KG; // 70 kg

const PK1: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1.0 };
const MM: PkParams = {
  ka_hr: 1,
  ke_hr: 0.1,
  V_L: 40,
  F: 0.9,
  mm_vmax_per_hr: 2,
  mm_km_mg_per_l: 5,
};
const TWO: PkParams = {
  ka_hr: 1,
  ke_hr: 0.1,
  V_L: 30,
  F: 1,
  alpha_hr: 1.2,
  beta_hr: 0.08,
  k21_hr: 0.3,
};

describe('scalePkForWeight — allometric body-weight scaling', () => {
  it('is identity at the reference weight (same object back)', () => {
    expect(scalePkForWeight(PK1, REF)).toBe(PK1);
  });

  it('is identity for a non-positive weight (guard)', () => {
    expect(scalePkForWeight(PK1, 0)).toBe(PK1);
    expect(scalePkForWeight(PK1, -5)).toBe(PK1);
  });

  it('scales V linearly (V ∝ WT¹) and ke by WT^−0.25', () => {
    const W = 105;
    const w = W / REF; // 1.5
    const s = scalePkForWeight(PK1, W);
    expect(s.V_L).toBeCloseTo(PK1.V_L * w, 10);
    expect(s.ke_hr).toBeCloseTo(PK1.ke_hr * Math.pow(w, -0.25), 10);
  });

  it('leaves ka and F unchanged', () => {
    const s = scalePkForWeight(PK1, 105);
    expect(s.ka_hr).toBe(PK1.ka_hr);
    expect(s.F).toBeCloseTo(PK1.F, 10);
  });

  it('gives clearance ∝ WT^0.75 and AUC ∝ WT^−0.75', () => {
    const W = 35;
    const w = W / REF; // 0.5
    const s = scalePkForWeight(PK1, W);
    // CL = V·ke
    const clRatio = (s.V_L * s.ke_hr) / (PK1.V_L * PK1.ke_hr);
    expect(clRatio).toBeCloseTo(Math.pow(w, 0.75), 10);
    // AUC = F·D/(V·ke) ⇒ ∝ 1/(V·ke)
    const aucRatio = (PK1.V_L * PK1.ke_hr) / (s.V_L * s.ke_hr);
    expect(aucRatio).toBeCloseTo(Math.pow(w, -0.75), 10);
  });

  it('scales MM Vmax by WT^−0.25 and keeps Km fixed', () => {
    const W = 105;
    const w = W / REF;
    const s = scalePkForWeight(MM, W);
    expect(s.mm_vmax_per_hr!).toBeCloseTo(MM.mm_vmax_per_hr! * Math.pow(w, -0.25), 10);
    expect(s.mm_km_mg_per_l).toBe(MM.mm_km_mg_per_l);
    expect(s.V_L).toBeCloseTo(MM.V_L * w, 10);
  });

  it('scales 2-comp rate constants by WT^−0.25 and V by WT¹', () => {
    const W = 140;
    const w = W / REF; // 2.0
    const s = scalePkForWeight(TWO, W);
    const f = Math.pow(w, -0.25);
    expect(s.alpha_hr!).toBeCloseTo(TWO.alpha_hr! * f, 10);
    expect(s.beta_hr!).toBeCloseTo(TWO.beta_hr! * f, 10);
    expect(s.k21_hr!).toBeCloseTo(TWO.k21_hr! * f, 10);
    expect(s.V_L).toBeCloseTo(TWO.V_L * w, 10);
  });
});
