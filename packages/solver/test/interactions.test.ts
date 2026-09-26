/**
 * applyInteractionFactorsToRoutes — clearance scaling for the SCALAR DDI
 * fallback (multi-route / zero-order victims). The 1-comp/2-comp/MM single-route
 * victims go through the time-varying integrator instead; this pins that the
 * scalar path scales CLEARANCE correctly per disposition shape (it used to scale
 * both α and β, which scales k10 by factor² — a 4×-AUC error — and to scale the
 * inert ke_hr for MM, a silent no-op).
 */

import { describe, it, expect } from 'vitest';
import {
  applyInteractionFactorsToRoutes,
  inductionRamp,
  mbiActivityEnvelope,
  INDUCTION_TAU_HR,
  ENZYME_TURNOVER_TAU_HR,
} from '../src/interactions';
import type { PkParams } from '../src/types';

describe('applyInteractionFactorsToRoutes — clearance scaling per shape', () => {
  it('1-comp: scales ke by the factor', () => {
    const pk: PkParams = { ka_hr: 1, ke_hr: 0.2, V_L: 40, F: 0.9 };
    const out = applyInteractionFactorsToRoutes({ PO: pk }, { ke: 0.5, F: 1 }).PO!;
    expect(out.ke_hr).toBeCloseTo(0.1, 10);
  });

  it('2-comp: scales k10 (=α·β/k21) by the factor — NOT by factor² — keeping k12, k21 fixed', () => {
    const pk: PkParams = {
      ka_hr: 4,
      ke_hr: 0.1,
      V_L: 50,
      F: 0.9,
      alpha_hr: 1.2,
      beta_hr: 0.1,
      k21_hr: 0.3,
    };
    const k10 = (pk.alpha_hr! * pk.beta_hr!) / pk.k21_hr!;
    const k12 = pk.alpha_hr! + pk.beta_hr! - pk.k21_hr! - k10;

    const out = applyInteractionFactorsToRoutes({ PO: pk }, { ke: 0.5, F: 1 }).PO!;
    const k10p = (out.alpha_hr! * out.beta_hr!) / out.k21_hr!;
    const k12p = out.alpha_hr! + out.beta_hr! - out.k21_hr! - k10p;

    expect(k10p).toBeCloseTo(0.5 * k10, 10); // clearance halved (was wrongly quartered)
    expect(k12p).toBeCloseTo(k12, 10); // distribution unchanged
    expect(out.k21_hr).toBeCloseTo(pk.k21_hr!, 12);
  });

  it('MM: scales Vmax by the factor (ke_hr is inert for MM — used to be a no-op)', () => {
    const pk: PkParams = {
      ka_hr: 1.5,
      ke_hr: 0.05,
      V_L: 50,
      F: 1.0,
      mm_vmax_per_hr: 8,
      mm_km_mg_per_l: 5,
    };
    const out = applyInteractionFactorsToRoutes({ PO: pk }, { ke: 0.5, F: 1 }).PO!;
    expect(out.mm_vmax_per_hr).toBeCloseTo(4, 10);
  });

  it('F displacement scales F (clamped to ≤1)', () => {
    const pk: PkParams = { ka_hr: 1, ke_hr: 0.2, V_L: 40, F: 0.6 };
    expect(applyInteractionFactorsToRoutes({ PO: pk }, { ke: 1, F: 1.3 }).PO!.F).toBeCloseTo(
      0.78,
      10,
    );
    expect(applyInteractionFactorsToRoutes({ PO: pk }, { ke: 1, F: 3 }).PO!.F).toBe(1); // clamped
  });
});

describe('inductionRamp — first-order enzyme-turnover ke ramp', () => {
  const F = 1.5; // steady-state induction factor (50% faster clearance)
  const dt = 1; // 1 h grid
  const HOUR_MS = 3_600_000;
  /** perpCp array of length T, above the presence floor at every step. */
  const present = (T: number) => Float32Array.from({ length: T }, () => 1);

  it('starts at baseline and fills toward the factor with τ ≈ 1 week (no prior history)', () => {
    const T = 24 * 28; // 4 weeks
    const perp = present(T);
    // gridStart == perpEarliest → no warm-start; ramp begins at 1.
    const r = inductionRamp(perp, dt, F, 0, 0);
    expect(r[0]!).toBeCloseTo(1, 6); // not instantaneous
    // I(τ) = 1 − e⁻¹ ≈ 0.632 at t = INDUCTION_TAU_HR.
    const kTau = Math.round(INDUCTION_TAU_HR / dt);
    expect(r[kTau]!).toBeCloseTo(1 + (F - 1) * (1 - Math.exp(-1)), 3);
    // Monotonic up under constant presence, and near (but below) the plateau by 4 weeks.
    for (let i = 1; i < T; i++) expect(r[i]!).toBeGreaterThanOrEqual(r[i - 1]!);
    expect(r[T - 1]!).toBeGreaterThan(1 + (F - 1) * 0.9);
    expect(r[T - 1]!).toBeLessThan(F);
  });

  it('warm-starts from prior on-board duration (stack predates the window)', () => {
    const T = 24;
    const perp = present(T);
    // Perpetrator first dosed one τ before the grid, still on board → I₀ = 1 − e⁻¹.
    const gridStart = 10 * INDUCTION_TAU_HR * HOUR_MS; // arbitrary anchor
    const perpEarliest = gridStart - INDUCTION_TAU_HR * HOUR_MS;
    const r = inductionRamp(perp, dt, F, gridStart, perpEarliest);
    expect(r[0]!).toBeCloseTo(1 + (F - 1) * (1 - Math.exp(-1)), 3);
  });

  it('de-induces back toward baseline after the perpetrator clears', () => {
    const T = 24 * 42; // 6 weeks
    const perp = new Float32Array(T);
    const half = Math.floor(T / 2);
    for (let i = 0; i < half; i++) perp[i] = 1; // present first 3 weeks, absent after
    const r = inductionRamp(perp, dt, F, 0, 0);
    // Rising while present, then falling once absent, relaxing toward 1.
    expect(r[half - 1]!).toBeGreaterThan(r[half + 24]!);
    expect(r[T - 1]!).toBeLessThan(1 + (F - 1) * 0.2);
    expect(r[T - 1]!).toBeGreaterThan(1);
  });

  it('is inert with no induction factor or no perpetrator on board', () => {
    expect(Array.from(inductionRamp(present(10), dt, 1, 0, 0))).toEqual(Array(10).fill(1));
    expect(Array.from(inductionRamp(new Float32Array(10), dt, F, 0, 0))).toEqual(Array(10).fill(1));
  });
});

describe('mbiActivityEnvelope — mechanism-based inhibition persistence tail', () => {
  const dt = 1; // 1 h grid
  const ki = 1; // mg/L
  const rev = (cp: number) => Math.max(0.05, 1 - cp / (cp + ki)); // reversible depth

  it('holds the Ki depth while present, then recovers on the enzyme-turnover τ', () => {
    // Perpetrator strongly present for 24 h, then gone (single-exposure shape).
    const T = 24 * 21; // 3 weeks
    const perp = new Float32Array(T);
    for (let i = 0; i < 24; i++) perp[i] = 100; // ≫ ki → deep inhibition (~0.05 floor)
    const env = mbiActivityEnvelope(perp, ki, dt);

    // While present: at the Ki-calibrated (reversible) depth — no extra depth invented.
    expect(env[12]!).toBeCloseTo(rev(100), 6);
    // The step AFTER the perpetrator vanishes is still deeply inhibited (memory) —
    // a reversible edge would have snapped back to ~1 here.
    expect(env[24]!).toBeLessThan(0.2);
    // Recovery is first-order with τ = ENZYME_TURNOVER_TAU_HR: one τ after clearance
    // the gap to full activity has shrunk by ≈ 1/e.
    const gap0 = 1 - env[24]!;
    const kTau = 24 + ENZYME_TURNOVER_TAU_HR;
    expect(1 - env[kTau]!).toBeCloseTo(gap0 * Math.exp(-1), 2);
    // Monotonic recovery back toward baseline once the inhibitor is gone.
    for (let i = 25; i < T; i++) expect(env[i]!).toBeGreaterThanOrEqual(env[i - 1]!);
    expect(env[T - 1]!).toBeGreaterThan(0.9);
  });

  it('fast attack: deeper inhibition establishes at once (no up-ramp lag)', () => {
    const T = 48;
    const perp = new Float32Array(T);
    for (let i = 10; i < T; i++) perp[i] = 100; // steps in at i=10
    const env = mbiActivityEnvelope(perp, ki, dt);
    expect(env[9]!).toBeCloseTo(1, 6); // nothing before onset
    expect(env[10]!).toBeCloseTo(rev(100), 6); // full depth the very first present step
  });

  it('matches the reversible depth at steady presence (no free depth, only a tail)', () => {
    // Constant moderate presence → envelope sits exactly at the reversible value.
    const perp = Float32Array.from({ length: 50 }, () => 2); // Cp = 2·ki
    const env = mbiActivityEnvelope(perp, ki, dt);
    for (let i = 0; i < env.length; i++) expect(env[i]!).toBeCloseTo(rev(2), 6);
  });

  it('is inert with no Ki or no perpetrator on board', () => {
    expect(
      Array.from(
        mbiActivityEnvelope(
          Float32Array.from({ length: 8 }, () => 5),
          0,
          dt,
        ),
      ),
    ).toEqual(Array(8).fill(1));
    expect(Array.from(mbiActivityEnvelope(new Float32Array(8), ki, dt))).toEqual(Array(8).fill(1));
  });
});
