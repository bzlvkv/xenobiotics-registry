/**
 * PK math tests.
 *
 * These check the analytic forms against hand-computed expected values plus
 * the closed-form properties they must obey (peak location, AUC, monotonicity).
 * No literature data here — that's the pipeline test's job. These prove the
 * primitives are right; pipeline proves the system is right.
 */

import { describe, it, expect } from 'vitest';
import {
  plasmaAt,
  plasmaCurve,
  addDose,
  tmaxOral,
  cmaxOral,
  aucInfinity,
  resolvePk,
  defaultVolumeL,
  PROTEIN_MW_THRESHOLD_G_MOL,
  PROTEIN_V_L_PER_KG,
  SMALL_MOLECULE_V_L_PER_KG,
} from '../src/pk';
import type { PkParams } from '../src/types';

// Caffeine-shaped params, used across tests. Round numbers so the
// expected values are easy to verify by hand.
const PK: PkParams = {
  ka_hr: 5,
  ke_hr: Math.LN2 / 5, // half-life 5h ⇒ ke ≈ 0.13863
  V_L: 36,
  F: 1.0,
};
const DOSE_MG = 100;

describe('Bateman one-compartment (PO)', () => {
  it('returns 0 at t = 0', () => {
    expect(plasmaAt(0, DOSE_MG, PK, 'PO')).toBeCloseTo(0, 12);
  });

  it('returns 0 for t < 0 (intake not yet taken)', () => {
    expect(plasmaAt(-1, DOSE_MG, PK, 'PO')).toBe(0);
  });

  it('approaches 0 as t → ∞', () => {
    expect(plasmaAt(48, DOSE_MG, PK, 'PO')).toBeLessThan(0.01);
    expect(plasmaAt(100, DOSE_MG, PK, 'PO')).toBeLessThan(1e-5);
  });

  it('peak time matches closed form Tmax = ln(ka/ke)/(ka−ke)', () => {
    const expected = Math.log(PK.ka_hr / PK.ke_hr) / (PK.ka_hr - PK.ke_hr);
    expect(tmaxOral(PK)).toBeCloseTo(expected, 12);
  });

  it('peak concentration matches analytic value', () => {
    const tMax = tmaxOral(PK);
    const cMax = cmaxOral(DOSE_MG, PK);
    // Reproduce the formula directly to verify cmaxOral didn't drift.
    const prefactor = (PK.F * DOSE_MG * PK.ka_hr) / (PK.V_L * (PK.ka_hr - PK.ke_hr));
    const expected = prefactor * (Math.exp(-PK.ke_hr * tMax) - Math.exp(-PK.ka_hr * tMax));
    expect(cMax).toBeCloseTo(expected, 10);
  });

  it('curve is unimodal: increases up to Tmax, decreases after', () => {
    const tMax = tmaxOral(PK);
    // Sample on each side of Tmax
    const before = plasmaAt(tMax * 0.5, DOSE_MG, PK, 'PO');
    const at = plasmaAt(tMax, DOSE_MG, PK, 'PO');
    const after = plasmaAt(tMax * 1.5, DOSE_MG, PK, 'PO');
    expect(at).toBeGreaterThan(before);
    expect(at).toBeGreaterThan(after);
  });

  it('handles ka == ke without NaN (flip-flop case)', () => {
    const flipPk: PkParams = { ka_hr: 0.5, ke_hr: 0.5, V_L: 30, F: 1 };
    const c = plasmaAt(2, 100, flipPk, 'PO');
    expect(Number.isFinite(c)).toBe(true);
    expect(c).toBeGreaterThan(0);
  });
});

describe('IV bolus', () => {
  it('at t=0 concentration is D/V (full dose distributed)', () => {
    expect(plasmaAt(0, 100, PK, 'IV')).toBeCloseTo(100 / 36, 10);
  });

  it('decays exponentially at rate ke', () => {
    const c1 = plasmaAt(1, 100, PK, 'IV');
    const c2 = plasmaAt(2, 100, PK, 'IV');
    // c(t+1)/c(t) = exp(-ke)
    expect(c2 / c1).toBeCloseTo(Math.exp(-PK.ke_hr), 10);
  });

  it('IV ignores ka entirely', () => {
    const a: PkParams = { ...PK, ka_hr: 1 };
    const b: PkParams = { ...PK, ka_hr: 99 };
    expect(plasmaAt(2, 100, a, 'IV')).toBe(plasmaAt(2, 100, b, 'IV'));
  });
});

describe('superposition (multi-dose)', () => {
  it('two identical doses 4h apart produce a curve that = single + shifted single', () => {
    const grid = new Float64Array(48 * 4); // 15-min steps over 12h
    for (let i = 0; i < grid.length; i++) grid[i] = i * 0.25;

    const single = plasmaCurve(grid, DOSE_MG, PK, 'PO');
    // Build a separate curve that's `single` time-shifted by 4 hours.
    const shifted = new Float32Array(grid.length);
    for (let i = 0; i < grid.length; i++) {
      const dt = grid[i] - 4;
      if (dt >= 0) shifted[i] = plasmaAt(dt, DOSE_MG, PK, 'PO');
    }
    const expected = new Float32Array(grid.length);
    for (let i = 0; i < grid.length; i++) expected[i] = single[i] + shifted[i];

    // Now produce the same via addDose superposition.
    const buf = new Float32Array(grid.length);
    addDose(buf, grid, { t_hr: 0, dose_mg: DOSE_MG, route: 'PO' }, PK);
    addDose(buf, grid, { t_hr: 4, dose_mg: DOSE_MG, route: 'PO' }, PK);

    for (let i = 0; i < grid.length; i++) {
      expect(buf[i]).toBeCloseTo(expected[i], 5);
    }
  });
});

describe('AUC conservation', () => {
  it('numerically-integrated curve matches AUC∞ = F·D/(V·ke) within 1%', () => {
    // Trapezoidal integration over 0..72h with 1-min steps. PO curve
    // is essentially zero by 72h with a 5h half-life, so the truncation
    // error against AUC∞ should be < 1%.
    const stepHr = 1 / 60;
    const T = 72 / stepHr;
    let auc = 0;
    let prev = 0;
    for (let i = 0; i <= T; i++) {
      const t = i * stepHr;
      const c = plasmaAt(t, DOSE_MG, PK, 'PO');
      if (i > 0) auc += 0.5 * stepHr * (prev + c);
      prev = c;
    }
    const expected = aucInfinity(DOSE_MG, PK);
    expect(Math.abs(auc - expected) / expected).toBeLessThan(0.01);
  });
});

describe('resolvePk', () => {
  it('derives ke from half-life when ke not provided', () => {
    const pk = resolvePk({ ka_hr: 5, half_life_hr: 4, V_L: 30, F: 1 });
    expect(pk.ke_hr).toBeCloseTo(Math.LN2 / 4, 10);
  });

  it('uses 0.5 L/kg × weight_kg for V when not given', () => {
    const pk = resolvePk({ ka_hr: 5, half_life_hr: 4, F: 1 }, 80);
    expect(pk.V_L).toBe(40);
  });

  // A 148 kDa antibody cannot cross capillary endothelium, so it stays near
  // plasma volume; defaulting it to a small molecule's 0.5 L/kg was a ~6-fold
  // error on all 18 of the catalog's authored >=10 kDa volumes. Validated by
  // leave-one-out — see PROTEIN_V_L_PER_KG.
  it('uses the protein volume default for a compound at or above 10 kDa', () => {
    const pk = resolvePk({ half_life_hr: 400, mw_g_mol: 148_000 }, 70);
    expect(pk.V_L).toBeCloseTo(5.6, 10);
  });

  it('keeps the small-molecule default below the protein threshold', () => {
    const pk = resolvePk({ half_life_hr: 4, mw_g_mol: 300 }, 70);
    expect(pk.V_L).toBe(35);
  });

  // The threshold must stay ABOVE the 3-10 kDa peptides: leave-one-out says a
  // class default is WORSE than 0.5 L/kg for them (3.67x vs 3.17x), because
  // their authored volumes span 7.7-200 L. Retatrutide (4731 Da) and
  // tirzepatide (4813 Da) therefore keep the small-molecule default.
  it('does NOT apply the protein default to a mid-size acylated peptide', () => {
    const reta = resolvePk({ half_life_hr: 144, ka_hr: 0.02, mw_g_mol: 4731.33 }, 70);
    expect(reta.V_L).toBe(35);
  });

  it('falls back to the small-molecule default when mw is unauthored', () => {
    const pk = resolvePk({ half_life_hr: 4 }, 70);
    expect(pk.V_L).toBe(35);
  });

  it('authored V_L always wins over either default', () => {
    const pk = resolvePk({ half_life_hr: 400, V_L: 3.1, mw_g_mol: 145_000 }, 70);
    expect(pk.V_L).toBe(3.1);
  });

  it('scales both defaults with weight, so allometry applies uniformly', () => {
    expect(defaultVolumeL(70, 148_000)).toBeCloseTo(PROTEIN_V_L_PER_KG * 70, 10);
    expect(defaultVolumeL(90, 148_000)).toBeCloseTo(PROTEIN_V_L_PER_KG * 90, 10);
    expect(defaultVolumeL(90, 300)).toBeCloseTo(SMALL_MOLECULE_V_L_PER_KG * 90, 10);
  });

  it('switches exactly at the threshold, inclusive', () => {
    expect(defaultVolumeL(70, PROTEIN_MW_THRESHOLD_G_MOL)).toBeCloseTo(5.6, 10);
    expect(defaultVolumeL(70, PROTEIN_MW_THRESHOLD_G_MOL - 1)).toBe(35);
  });

  it('defaults F=0.9 and ka=1 when omitted', () => {
    const pk = resolvePk({ half_life_hr: 5 });
    expect(pk.F).toBe(0.9);
    expect(pk.ka_hr).toBe(1.0);
  });

  it('throws when neither ke_hr nor half_life_hr nor 2-comp params are provided', () => {
    expect(() => resolvePk({ ka_hr: 5, V_L: 30, F: 1 })).toThrow();
  });

  it('treats 2-comp β as the effective ke when present', () => {
    const pk = resolvePk({
      ka_hr: 5,
      V_L: 30,
      F: 1,
      alpha_hr: 0.5,
      beta_hr: 0.05,
      k21_hr: 0.1,
    });
    expect(pk.ke_hr).toBe(0.05);
    expect(pk.alpha_hr).toBe(0.5);
    expect(pk.beta_hr).toBe(0.05);
    expect(pk.k21_hr).toBe(0.1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Two-compartment forms — golden curve checks against the closed forms.
// ─────────────────────────────────────────────────────────────────────────

// A canonical 2-comp param set: long terminal phase, fast distribution.
// Numbers are illustrative; tests check the math, not literature fit.
const PK2: PkParams = {
  ka_hr: 5,
  ke_hr: 0.05, // β; carried through but the bi-exp form uses α/β/k21
  V_L: 40,
  F: 1.0,
  alpha_hr: 0.5,
  beta_hr: 0.05,
  k21_hr: 0.1,
};

describe('Two-compartment IV bolus', () => {
  it('starts at C(0) = D/V₁ (full dose distributed in central compartment)', () => {
    const c0 = plasmaAt(0, 100, PK2, 'IV');
    expect(c0).toBeCloseTo(100 / 40, 8);
  });

  it('decays bi-exponentially: A·e^(−α·t) + B·e^(−β·t) with A+B = 1 (FAST coeff on e^−αt)', () => {
    const a = PK2.alpha_hr!;
    const b = PK2.beta_hr!;
    const k21 = PK2.k21_hr!;
    // Standard Gibaldi–Perrier: the fast e^(−α·t) carries (α−k21)/(α−β).
    const A = (a - k21) / (a - b);
    const B = (k21 - b) / (a - b);
    expect(A + B).toBeCloseTo(1, 12);

    for (const t of [0.5, 4, 24]) {
      const expected = (100 / PK2.V_L) * (A * Math.exp(-a * t) + B * Math.exp(-b * t));
      expect(plasmaAt(t, 100, PK2, 'IV')).toBeCloseTo(expected, 10);
    }
  });

  it('AUC matches the model-independent Dose/CL = D/(V₁·k₁₀) (guards the A/B swap)', () => {
    // The bi-exponential coefficient check above could pass with A and B
    // swapped (it just recomputes the same formula). This pins the ABSOLUTE
    // exposure: for any linear IV bolus, AUC(0→∞) = Dose / CL, CL = V₁·k₁₀,
    // k₁₀ = α·β/k₂₁. The swap inflated this by ~4.5×.
    const stepHr = 0.1;
    let auc = 0;
    let prev = plasmaAt(0, 100, PK2, 'IV');
    for (let i = 1; i <= Math.floor(800 / stepHr); i++) {
      const c = plasmaAt(i * stepHr, 100, PK2, 'IV');
      auc += 0.5 * stepHr * (prev + c);
      prev = c;
    }
    const k10 = (PK2.alpha_hr! * PK2.beta_hr!) / PK2.k21_hr!;
    const expected = 100 / (PK2.V_L * k10);
    expect(Math.abs(auc - expected) / expected).toBeLessThan(0.01);
  });

  it('shows a FAST distribution phase then a slow terminal phase (drops >25% in the first hour)', () => {
    const c0 = plasmaAt(0, 100, PK2, 'IV');
    const c1 = plasmaAt(1, 100, PK2, 'IV');
    // α-distribution makes the early drop steep; the swap removed it (gentle).
    expect(c1).toBeLessThan(c0 * 0.75);
  });

  it('approaches 0 as t → ∞', () => {
    expect(plasmaAt(500, 100, PK2, 'IV')).toBeLessThan(1e-6);
  });
});

describe('Two-compartment PO (first-order absorption + bi-exp disposition)', () => {
  it('returns 0 at t = 0', () => {
    expect(plasmaAt(0, 100, PK2, 'PO')).toBeCloseTo(0, 10);
  });

  it('curve is unimodal: rises then falls', () => {
    // Sample densely; expect exactly one peak.
    const samples: Array<{ t: number; v: number }> = [];
    for (let t = 0; t <= 48; t += 0.25) {
      samples.push({ t, v: plasmaAt(t, 100, PK2, 'PO') });
    }
    let peakIdx = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i]!.v > samples[peakIdx]!.v) peakIdx = i;
    }
    // Strictly increasing on the left, strictly decreasing on the right.
    for (let i = 1; i <= peakIdx; i++) {
      expect(samples[i]!.v).toBeGreaterThanOrEqual(samples[i - 1]!.v - 1e-9);
    }
    for (let i = peakIdx + 1; i < samples.length; i++) {
      expect(samples[i]!.v).toBeLessThanOrEqual(samples[i - 1]!.v + 1e-9);
    }
  });

  it('approaches 0 as t → ∞', () => {
    expect(plasmaAt(500, 100, PK2, 'PO')).toBeLessThan(1e-6);
  });

  it('numerical AUC matches F·D/(V₁·k₁₀) with k₁₀ = α·β/k₂₁', () => {
    // For 2-comp PK the AUC is F·D / CL, where systemic clearance
    // CL = V₁ · k₁₀ and k₁₀ (central-compartment elimination rate)
    // relates to the macroconstants by k₁₀ = α·β / k₂₁. This is the
    // canonical relationship in any PopPK textbook.
    const stepHr = 0.25;
    const T = Math.floor(500 / stepHr);
    let auc = 0;
    let prev = 0;
    for (let i = 0; i <= T; i++) {
      const c = plasmaAt(i * stepHr, 100, PK2, 'PO');
      if (i > 0) auc += 0.5 * stepHr * (prev + c);
      prev = c;
    }
    const k10 = (PK2.alpha_hr! * PK2.beta_hr!) / PK2.k21_hr!;
    const expected = (PK2.F * 100) / (PK2.V_L * k10);
    expect(Math.abs(auc - expected) / expected).toBeLessThan(0.02);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Zero-order absorption (transdermal patch / depot)
// ─────────────────────────────────────────────────────────────────────────────

describe('Zero-order absorption (patch / depot)', () => {
  // Patch-shaped: 72-hour constant release, slow elimination.
  const ZO: PkParams = {
    ka_hr: 1, // present but ignored under zero-order dispatch
    ke_hr: Math.LN2 / 12, // 12 h half-life
    V_L: 100,
    F: 0.9,
    zo_dur_hr: 72,
  };
  const D = 100;

  it('returns 0 at t = 0 and for t < 0', () => {
    expect(plasmaAt(0, D, ZO, 'TD')).toBeCloseTo(0, 12);
    expect(plasmaAt(-5, D, ZO, 'TD')).toBe(0);
  });

  it('peaks at the end of release (Tmax = zo_dur_hr)', () => {
    expect(tmaxOral(ZO)).toBeCloseTo(72, 12);
    // numeric check: sample densely, the max is at ~72 h
    let argmax = 0,
      max = -1;
    for (let t = 0; t <= 120; t += 0.5) {
      const c = plasmaAt(t, D, ZO, 'TD');
      if (c > max) {
        max = c;
        argmax = t;
      }
    }
    expect(argmax).toBeCloseTo(72, 0);
  });

  it('is continuous at the end of release (during == after at t = T)', () => {
    const eps = 1e-6;
    const before = plasmaAt(72 - eps, D, ZO, 'TD');
    const after = plasmaAt(72 + eps, D, ZO, 'TD');
    expect(after).toBeCloseTo(before, 6);
  });

  it('rises monotonically during release, falls after', () => {
    for (let t = 0; t < 72; t += 4) {
      expect(plasmaAt(t + 4, D, ZO, 'TD')).toBeGreaterThan(plasmaAt(t, D, ZO, 'TD'));
    }
    for (let t = 72; t < 120; t += 4) {
      expect(plasmaAt(t + 4, D, ZO, 'TD')).toBeLessThan(plasmaAt(t, D, ZO, 'TD'));
    }
  });

  it('numerical AUC matches F·D/(V·ke) — conservation holds for zero-order', () => {
    const stepHr = 0.1;
    const T = Math.floor(2000 / stepHr);
    let auc = 0,
      prev = 0;
    for (let i = 0; i <= T; i++) {
      const c = plasmaAt(i * stepHr, D, ZO, 'TD');
      if (i > 0) auc += 0.5 * stepHr * (prev + c);
      prev = c;
    }
    expect(Math.abs(auc - aucInfinity(D, ZO)) / aucInfinity(D, ZO)).toBeLessThan(0.01);
  });

  it('peak height matches the closed form plateau·(1 − e^(−ke·T))', () => {
    const plateau = (ZO.F * D) / (ZO.V_L * ZO.ke_hr * ZO.zo_dur_hr!);
    const expected = plateau * (1 - Math.exp(-ZO.ke_hr * ZO.zo_dur_hr!));
    expect(plasmaAt(72, D, ZO, 'TD')).toBeCloseTo(expected, 6);
  });
});

describe('Absorption lag', () => {
  const LAGGED: PkParams = {
    ka_hr: 1,
    ke_hr: Math.LN2 / 12,
    V_L: 100,
    F: 0.9,
    zo_dur_hr: 24,
    lag_hr: 48, // depot release starts 2 days post-injection
  };
  const D = 100;

  it('plasma is 0 before the lag, nonzero after', () => {
    expect(plasmaAt(47, D, LAGGED, 'IM')).toBe(0);
    expect(plasmaAt(49, D, LAGGED, 'IM')).toBeGreaterThan(0);
  });

  it('peak shifts by the lag (Tmax = lag + zo_dur)', () => {
    expect(tmaxOral(LAGGED)).toBeCloseTo(72, 12);
  });

  it('lag preserves AUC (just a time shift)', () => {
    const noLag: PkParams = { ...LAGGED, lag_hr: undefined };
    const stepHr = 0.1;
    const integ = (pk: PkParams) => {
      let auc = 0,
        prev = 0;
      for (let i = 0; i <= Math.floor(2000 / stepHr); i++) {
        const c = plasmaAt(i * stepHr, D, pk, 'IM');
        if (i > 0) auc += 0.5 * stepHr * (prev + c);
        prev = c;
      }
      return auc;
    };
    expect(Math.abs(integ(LAGGED) - integ(noLag)) / integ(noLag)).toBeLessThan(0.01);
  });
});
