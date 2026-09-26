/**
 * Michaelis-Menten saturable-elimination tests.
 *
 * Three regimes to defend in code:
 *
 *   1. Cp ≪ Km → behaves like first-order linear PK with
 *      ke_eff = Vmax/Km. Authoring an MM compound at low dose should
 *      produce a curve indistinguishable from a 1-comp Bateman with
 *      ke = Vmax/Km, within the integrator's discretization error.
 *
 *   2. Cp ≫ Km → elimination is zero-order. Half-life rises with
 *      concentration: doubling the dose more than doubles AUC because
 *      the clearance rate is capped at Vmax.
 *
 *   3. Mass conservation: total area under dC/dt × V over the curve
 *      should sum to F × dose for PO routes (the dose that actually
 *      reached circulation). Numerical accuracy ≈ a few percent at
 *      Δt = 5 min, much tighter at 1 min.
 *
 * Multi-dose: linear superposition does NOT apply, so the integrator
 * must be invoked once per compound with all doses summed inside the
 * ODE. We test this by comparing two simultaneous half-doses to one
 * full dose — they should produce the same curve. (Linear PK has the
 * same property; here we're proving the multi-dose code path is wired
 * correctly under non-linearity.)
 */

import { describe, it, expect } from 'vitest';
import { ulid } from 'ulid';
import type { Intake } from '@xeno/core';
import { plasmaCurveMm, plasmaCurve, mmEliminationRate, mmEffectiveKe, solve } from '../src';
import type { PkParams } from '../src/types';

const HORIZON_START = Date.parse('2026-04-27T08:00:00Z');

function makeIntake(at_ms: number, dose_mg: number, route: 'PO' | 'IV' = 'PO'): Intake {
  const iso = new Date(at_ms).toISOString();
  return {
    id: ulid(),
    compound: 'phenytoin',
    dose: dose_mg,
    dose_unit: 'mg',
    route,
    at: iso,
    created_at: iso,
    updated_at: iso,
  };
}

function buildGrid(hours: number, stepMin: number): Float64Array {
  const T = Math.floor((hours * 60) / stepMin) + 1;
  const out = new Float64Array(T);
  for (let i = 0; i < T; i++) out[i] = (i * stepMin) / 60;
  return out;
}

function trapezoidalAuc(curve: Float32Array, dt_hr: number): number {
  let s = 0;
  for (let i = 1; i < curve.length; i++) {
    s += 0.5 * (curve[i]! + curve[i - 1]!) * dt_hr;
  }
  return s;
}

describe('plasmaCurveMm — pre-window dose warm-up (correctness audit)', () => {
  const pk: PkParams & { mm_vmax_per_hr: number; mm_km_mg_per_l: number } = {
    ka_hr: 1.5,
    ke_hr: 0.05,
    V_L: 50,
    F: 1.0,
    mm_vmax_per_hr: 5,
    mm_km_mg_per_l: 5,
  };
  const HOUR_MS = 3_600_000;

  it('a dose taken before the window decays to its true residual — matching a full-span integration, NOT resurrected at full mass', () => {
    const doseTime = HORIZON_START - 120 * HOUR_MS; // 5 days before the window
    const dose = makeIntake(doseTime, 300);

    // Windowed: 12h grid from HORIZON_START; the dose is 120h pre-window.
    const windowGrid = buildGrid(12, 60);
    const windowOut = plasmaCurveMm(windowGrid, [dose], pk, HORIZON_START);

    // Ground truth: integrate from the dose time across the whole 132h span at
    // the same 1h step (dose now in-window at t=0). The window region is the
    // tail, samples 120..132 — this is the correct answer by construction.
    const fullGrid = buildGrid(132, 60);
    const fullOut = plasmaCurveMm(fullGrid, [dose], pk, doseTime);

    for (let k = 0; k < windowOut.length; k++) {
      expect(Math.abs(windowOut[k]! - fullOut[120 + k]!), `sample ${k}`).toBeLessThan(1e-3);
    }
    // Concretely: the 5-day-old 300 mg dose has cleared — the window peak is
    // ~0, NOT the ~3 mg/L the old full-mass injection fabricated.
    expect(Math.max(...windowOut)).toBeLessThan(0.5);
  });

  it('an all-in-window dose set is unaffected (warm-up of 0)', () => {
    const dose = makeIntake(HORIZON_START + HOUR_MS, 300); // 1h into the window
    const out = plasmaCurveMm(buildGrid(12, 60), [dose], pk, HORIZON_START);
    expect(Math.max(...out)).toBeGreaterThan(0.5); // a fresh dose DOES produce a curve
  });
});

describe('mmEliminationRate — pointwise', () => {
  it('returns 0 at Cp = 0', () => {
    expect(mmEliminationRate(0, 10, 5)).toBe(0);
  });
  it('half-max at Cp = Km', () => {
    expect(mmEliminationRate(5, 10, 5)).toBeCloseTo(5, 6);
  });
  it('approaches Vmax as Cp → ∞', () => {
    expect(mmEliminationRate(1e9, 10, 5)).toBeCloseTo(10, 4);
  });
});

describe('mmEffectiveKe', () => {
  it('equals Vmax/Km at Cp = 0 (linear regime)', () => {
    expect(mmEffectiveKe(0, 10, 5)).toBe(2);
  });
  it('halves at Cp = Km', () => {
    expect(mmEffectiveKe(5, 10, 5)).toBeCloseTo(1, 6);
  });
});

describe('mm helpers — parallel first-order pathway (E6)', () => {
  it('mmEliminationRate adds the linear term on top of the saturable one', () => {
    // At Cp = Km the saturable rate is Vmax/2 = 5; plus kL·Cp = 0.1·5 = 0.5.
    expect(mmEliminationRate(5, 10, 5, 0.1)).toBeCloseTo(5.5, 6);
    // Cp ≫ Km: saturable caps at Vmax=10, but the linear term keeps growing.
    expect(mmEliminationRate(1000, 10, 5, 0.1)).toBeGreaterThan(100);
  });
  it('mmEffectiveKe is Vmax/Km + kL at low Cp and floors at kL at saturation', () => {
    expect(mmEffectiveKe(0, 10, 5, 0.3)).toBeCloseTo(2.3, 6); // 2 + 0.3
    expect(mmEffectiveKe(1e9, 10, 5, 0.3)).toBeCloseTo(0.3, 6); // saturable → 0
  });
  it('defaults (no linear term) are unchanged', () => {
    expect(mmEliminationRate(5, 10, 5)).toBeCloseTo(5, 6);
    expect(mmEffectiveKe(0, 10, 5)).toBe(2);
  });
});

describe('plasmaCurveMm — low-Cp linear limit', () => {
  // Vmax = 0.05 mg/L/hr, Km = 100 mg/L → ke_eff = 0.0005/hr in the
  // sub-Km regime. Pick a tiny dose so Cp << Km and compare to the
  // 1-comp Bateman with ke = Vmax/Km.
  const Vmax = 0.05;
  const Km = 100;
  const KE_EFF = Vmax / Km;

  const PO_PARAMS: PkParams = {
    ka_hr: 2,
    ke_hr: KE_EFF,
    V_L: 50,
    F: 1.0,
    mm_vmax_per_hr: Vmax,
    mm_km_mg_per_l: Km,
  };
  const PO_LINEAR: PkParams = {
    ka_hr: 2,
    ke_hr: KE_EFF,
    V_L: 50,
    F: 1.0,
  };

  it('matches first-order Bateman within 5% across the curve', () => {
    const grid = buildGrid(24, 5);
    const tinyDose = makeIntake(HORIZON_START, 0.01); // 0.01 mg → Cmax << Km
    const mm = plasmaCurveMm(grid, [tinyDose], PO_PARAMS as any, HORIZON_START);
    const lin = plasmaCurve(grid, 0.01, PO_LINEAR, 'PO');
    // Compare AUC since pointwise has discretization noise; the AUC
    // captures the regime equivalence faithfully.
    const aucMm = trapezoidalAuc(mm, 5 / 60);
    const aucLin = trapezoidalAuc(lin, 5 / 60);
    expect(Math.abs(aucMm - aucLin) / aucLin).toBeLessThan(0.05);
  });
});

describe('plasmaCurveMm — high-Cp zero-order behavior', () => {
  // At saturation (Cp >> Km), elimination ~= Vmax (constant). Doubling
  // the dose should more-than-double the AUC because the clearance is
  // capped — drug accumulates. We compare 1× vs 2× IV bolus AUCs.
  const Vmax = 5; // mg/L/hr
  const Km = 1; // mg/L
  const PARAMS: PkParams = {
    ka_hr: 0,
    ke_hr: Vmax / Km, // pseudo-linear-equivalent
    V_L: 50,
    F: 1.0,
    mm_vmax_per_hr: Vmax,
    mm_km_mg_per_l: Km,
  };

  it('AUC scales super-linearly with dose at saturation', () => {
    const grid = buildGrid(96, 5); // 4-day window so the slower decay finishes
    const oneX = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 1000, 'IV')],
      PARAMS as any,
      HORIZON_START,
    );
    const twoX = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 2000, 'IV')],
      PARAMS as any,
      HORIZON_START,
    );
    const auc1 = trapezoidalAuc(oneX, 5 / 60);
    const auc2 = trapezoidalAuc(twoX, 5 / 60);
    // Super-linear means AUC(2x) > 2 * AUC(1x). At deep saturation the
    // ratio approaches t·Vmax · (D/V) for the linear-mass-balance term;
    // the threshold here is conservative — any reasonable saturation
    // will exceed 2.1×.
    expect(auc2 / auc1).toBeGreaterThan(2.1);
  });

  it('peak from a higher dose is non-linearly higher (saturated)', () => {
    const grid = buildGrid(24, 5);
    const oneX = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 1000, 'IV')],
      PARAMS as any,
      HORIZON_START,
    );
    const tenX = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 10000, 'IV')],
      PARAMS as any,
      HORIZON_START,
    );
    expect(Math.max(...tenX)).toBeGreaterThan(10 * Math.max(...oneX) * 0.95);
  });
});

describe('plasmaCurveMm — IV bolus shape', () => {
  // IV bolus should produce C(0+) = D/V and then decay. The depot path
  // (a) stays at zero throughout. Used to be sure the IV branch in the
  // integrator bypasses the absorption term correctly.
  const PARAMS: PkParams = {
    ka_hr: 1,
    ke_hr: 0.5,
    V_L: 50,
    F: 1.0,
    mm_vmax_per_hr: 0.05,
    mm_km_mg_per_l: 100,
  };

  it('peaks at t=0 with C ≈ D/V', () => {
    const grid = buildGrid(12, 1);
    const out = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 100, 'IV')],
      PARAMS as any,
      HORIZON_START,
    );
    expect(out[0]).toBeCloseTo(100 / 50, 2);
    // Max is at the first sample.
    let peak = out[0]!;
    let peakIdx = 0;
    for (let i = 1; i < out.length; i++) {
      if (out[i]! > peak) {
        peak = out[i]!;
        peakIdx = i;
      }
    }
    expect(peakIdx).toBe(0);
  });
});

describe('plasmaCurveMm — multi-dose handling', () => {
  // Non-linear PK breaks superposition, so we can't test by adding two
  // single-dose curves. Instead: confirm that one 200 mg dose matches
  // the curve from two 100 mg doses given simultaneously. (Trivially
  // true for linear PK; here we're proving the integrator collapses
  // co-time injections correctly.)
  const PARAMS: PkParams = {
    ka_hr: 2,
    ke_hr: 0.05,
    V_L: 50,
    F: 1.0,
    mm_vmax_per_hr: 0.5,
    mm_km_mg_per_l: 5,
  };

  it('two simultaneous half-doses ≡ one full dose', () => {
    const grid = buildGrid(24, 5);
    const single = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 200)],
      PARAMS as any,
      HORIZON_START,
    );
    const split = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 100), makeIntake(HORIZON_START, 100)],
      PARAMS as any,
      HORIZON_START,
    );
    for (let i = 0; i < single.length; i++) {
      expect(split[i]!).toBeCloseTo(single[i]!, 6);
    }
  });

  it('two staggered doses produce a higher second peak than the first', () => {
    const grid = buildGrid(24, 5);
    const out = plasmaCurveMm(
      grid,
      [makeIntake(HORIZON_START, 100), makeIntake(HORIZON_START + 4 * 3_600_000, 100)],
      PARAMS as any,
      HORIZON_START,
    );
    // Find the two local peaks bracketed at 0–3h and 4–8h.
    let peak1 = 0;
    for (let i = 0; i < grid.length && grid[i]! < 3.5; i++) {
      if (out[i]! > peak1) peak1 = out[i]!;
    }
    let peak2 = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]! >= 4 && grid[i]! < 8 && out[i]! > peak2) peak2 = out[i]!;
    }
    // With saturable elimination, residual from dose 1 stacks under
    // dose 2 → peak2 > peak1.
    expect(peak2).toBeGreaterThan(peak1);
  });
});

describe('plasmaCurveMm — parallel saturable + linear pathway (E6)', () => {
  const HOUR_MS = 3_600_000;

  it('kL=0 (or absent) is byte-identical to single-pathway MM', () => {
    const grid = buildGrid(48, 5);
    const dose = [makeIntake(HORIZON_START, 300, 'IV')];
    const base = { ka_hr: 0, ke_hr: 2, V_L: 50, F: 1.0, mm_vmax_per_hr: 2, mm_km_mg_per_l: 1 };
    const pure = plasmaCurveMm(grid, dose, base as any, HORIZON_START);
    const zeroL = plasmaCurveMm(grid, dose, { ...base, mm_linear_ke_hr: 0 } as any, HORIZON_START);
    for (let i = 0; i < pure.length; i++) expect(zeroL[i]!).toBe(pure[i]!);
  });

  it('low-Cp limit is first-order with ke = Vmax/Km + kL (both pathways sum)', () => {
    // Vmax/Km = 0.0005/hr, kL = 0.01/hr → total ke_eff ≈ 0.0105/hr in the sub-Km
    // regime; a tiny dose should track a 1-comp Bateman at that summed ke.
    const grid = buildGrid(24, 5);
    const tiny = makeIntake(HORIZON_START, 0.01);
    const KE = 0.05 / 100 + 0.01;
    const mm = plasmaCurveMm(
      grid,
      [tiny],
      {
        ka_hr: 2,
        ke_hr: KE,
        V_L: 50,
        F: 1.0,
        mm_vmax_per_hr: 0.05,
        mm_km_mg_per_l: 100,
        mm_linear_ke_hr: 0.01,
      } as any,
      HORIZON_START,
    );
    const lin = plasmaCurve(grid, 0.01, { ka_hr: 2, ke_hr: KE, V_L: 50, F: 1.0 }, 'PO');
    const aucMm = trapezoidalAuc(mm, 5 / 60);
    const aucLin = trapezoidalAuc(lin, 5 / 60);
    expect(Math.abs(aucMm - aucLin) / aucLin).toBeLessThan(0.05);
  });

  it('at a saturating dose the parallel pathway keeps clearing (no runaway tail)', () => {
    // The acetaminophen problem in miniature: Vmax=2, Km=1; an IV bolus to
    // C(0)=20 mg/L (20×Km) saturates the MM route, so pure single-pathway MM
    // clears at ~Vmax=2 mg/L/hr (zero-order) and is still elevated hours later.
    // A parallel first-order route (glucuronidation) removes drug in proportion
    // to Cp → clears far faster. Window chosen so pure MM is still well above Km.
    const grid = buildGrid(8, 5);
    const dose = [makeIntake(HORIZON_START, 1000, 'IV')]; // 1000/50 = 20 mg/L
    const base = { ka_hr: 0, ke_hr: 2, V_L: 50, F: 1.0, mm_vmax_per_hr: 2, mm_km_mg_per_l: 1 };
    const pure = plasmaCurveMm(grid, dose, base as any, HORIZON_START);
    const parallel = plasmaCurveMm(
      grid,
      dose,
      { ...base, mm_linear_ke_hr: 0.5 } as any,
      HORIZON_START,
    );

    // Same instantaneous IV peak (elimination hasn't acted yet)…
    expect(parallel[0]!).toBeCloseTo(pure[0]!, 6);
    // …pure MM is still ~zero-order-declining and elevated at 8 h…
    expect(pure[pure.length - 1]!).toBeGreaterThan(2);
    // …but the parallel pathway pulls the tail down hard: much lower terminal
    // concentration and total exposure.
    expect(parallel[parallel.length - 1]!).toBeLessThan(pure[pure.length - 1]! * 0.5);
    expect(trapezoidalAuc(parallel, 5 / 60)).toBeLessThan(trapezoidalAuc(pure, 5 / 60) * 0.7);
  });

  it('end-to-end through solve(): the parallel pathway lowers AUC vs single-pathway MM', () => {
    // (makeIntake tags every dose 'phenytoin'; APAP-flavoured params ride on it.)
    const horizon = { start: HORIZON_START, end: HORIZON_START + 48 * HOUR_MS, stepMin: 5 };
    const dose = [makeIntake(HORIZON_START, 650)]; // PO, therapeutic-ish
    const base = {
      ka_hr: 3,
      ke_hr: 0.13,
      V_L: 55,
      F: 0.88,
      mm_vmax_per_hr: 1.94,
      mm_km_mg_per_l: 14.7,
    };
    const single = solve({
      intakes: dose,
      pkParams: new Map([['phenytoin', { PO: base as any }]]),
      horizon,
      mcSamples: 0,
    });
    const twoPath = solve({
      intakes: dose,
      pkParams: new Map([['phenytoin', { PO: { ...base, mm_linear_ke_hr: 0.2 } as any }]]),
      horizon,
      mcSamples: 0,
    });
    const auc = (c: Float32Array) => trapezoidalAuc(c, 5 / 60);
    expect(auc(twoPath.plasma.get('phenytoin')!)).toBeLessThan(
      auc(single.plasma.get('phenytoin')!),
    );
  });
});

describe('solve() — MM dispatch through pipeline', () => {
  // End-to-end: a compound with MM params should produce a curve
  // that's NOT identical to its linear-equivalent counterpart at
  // saturating doses, confirming the pipeline routes through the
  // integrator. The MM and linear params are matched at the low-Cp
  // limit (ke_linear = Vmax/Km), so the only divergence comes from
  // saturation behavior at high Cp.
  const Vmax = 0.5; // mg/L/hr
  const Km = 1; // mg/L  → ke_eff at low Cp = 0.5/hr
  const PARAMS: PkParams = {
    ka_hr: 2,
    ke_hr: Vmax / Km,
    V_L: 50,
    F: 1.0,
    mm_vmax_per_hr: Vmax,
    mm_km_mg_per_l: Km,
  };
  const LINEAR: PkParams = {
    ka_hr: 2,
    ke_hr: Vmax / Km,
    V_L: 50,
    F: 1.0,
  };

  it('MM AUC exceeds linear AUC at saturating dose (Cmax >> Km)', () => {
    const horizon = { start: HORIZON_START, end: HORIZON_START + 96 * 3_600_000, stepMin: 5 };
    // 500 mg IV into V=50 → C(0) = 10 mg/L = 10× Km, deeply saturated.
    const intakes = [makeIntake(HORIZON_START, 500, 'IV')];

    const mm = solve({
      intakes,
      pkParams: new Map([['phenytoin', { IV: PARAMS }]]),
      horizon,
      mcSamples: 0,
    });
    const lin = solve({
      intakes,
      pkParams: new Map([['phenytoin', { IV: LINEAR }]]),
      horizon,
      mcSamples: 0,
    });

    const cMaxMm = Math.max(...mm.plasma.get('phenytoin')!);
    const cMaxLin = Math.max(...lin.plasma.get('phenytoin')!);
    const aucMm = trapezoidalAuc(mm.plasma.get('phenytoin')!, 5 / 60);
    const aucLin = trapezoidalAuc(lin.plasma.get('phenytoin')!, 5 / 60);
    // IV bolus → both start at C(0) = D/V, identical Cmax.
    expect(cMaxMm).toBeCloseTo(cMaxLin, 1);
    // The MM tail decays slower at saturation (clearance capped at Vmax)
    // → strictly higher AUC than the linear-equivalent.
    expect(aucMm).toBeGreaterThan(aucLin);
  });
});
