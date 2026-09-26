/**
 * Free-fraction correction on the occupancy path (backlog §12).
 *
 * `ec50_mg_l` is, on almost every authored row, an in-vitro binding Ki —
 * a FREE-drug affinity — while the solver's curve is TOTAL plasma. Comparing
 * them directly overstates occupancy by roughly 1/fu. These tests pin the four
 * claims that make the correction safe to ship:
 *
 *   1. NO REGRESSION. A compound with no authored `fraction_unbound` gets
 *      exactly its old curve — bit-for-bit, not approximately.
 *   2. The correction is applied to the concentration, not to emax: a
 *      saturating dose still reaches emax, it just takes 1/fu more drug.
 *   3. `basis: 'in_vivo_plasma_ec50'` opts out — such an EC50 is already
 *      referenced to total plasma, so fu must NOT be applied a second time.
 *   4. Out-of-range or nonsense fu values fall back to 1 rather than
 *      producing a silently wrong curve.
 */

import { describe, it, expect } from 'vitest';
import type { ReceptorSite } from '@xeno/core';
import { hillCurve, hillOccupancyAt, freeFractionMultiplier } from '../src/hill';

const site = (over: Partial<ReceptorSite> = {}): ReceptorSite => ({
  receptor: 'test',
  emax: 1,
  ec50_mg_l: 1,
  hill_n: 1,
  ...over,
});

describe('freeFractionMultiplier', () => {
  it('is 1 when no fu is authored — the pre-correction behaviour', () => {
    expect(freeFractionMultiplier(site(), undefined)).toBe(1);
  });

  it('is fu for an in-vitro Ki, which is what almost every row holds', () => {
    expect(freeFractionMultiplier(site(), 0.01)).toBe(0.01);
    expect(freeFractionMultiplier(site({ basis: 'in_vitro_ki' }), 0.1)).toBe(0.1);
  });

  it('is 1 for an in-vivo plasma EC50 even when fu is authored', () => {
    // Such an EC50 was fitted against total plasma; applying fu would correct
    // a bias that is not there.
    expect(freeFractionMultiplier(site({ basis: 'in_vivo_plasma_ec50' }), 0.01)).toBe(1);
  });

  it('is 1 for a whole-blood IC50 — the matrix already contains the protein', () => {
    // This one shipped as a real bug: diclofenac's COX rows are human
    // whole-blood IC50s and its fu is 0.003, so the correction was being
    // applied 333-fold in the wrong direction, worse than not correcting.
    expect(freeFractionMultiplier(site({ basis: 'whole_blood_ic50' }), 0.003)).toBe(1);
  });

  it('falls back to 1 on a nonsense fu rather than distorting the curve', () => {
    for (const bad of [0, -0.5, 1.5, NaN, Infinity]) {
      expect(freeFractionMultiplier(site(), bad)).toBe(1);
    }
  });
});

describe('hillOccupancyAt with a free fraction', () => {
  it('leaves an unauthored compound bit-identical', () => {
    const s = site();
    for (const ce of [0.01, 0.5, 1, 3, 100]) {
      expect(hillOccupancyAt(ce, s, undefined)).toBe(hillOccupancyAt(ce, s));
    }
  });

  it('needs 1/fu more total drug to reach half-maximal occupancy', () => {
    const s = site();
    // Uncorrected: half-max at Ce = ec50.
    expect(hillOccupancyAt(1, s)).toBeCloseTo(0.5, 12);
    // fu = 0.01 (99% bound): half-max now needs 100x the TOTAL concentration.
    expect(hillOccupancyAt(100, s, 0.01)).toBeCloseTo(0.5, 12);
    expect(hillOccupancyAt(1, s, 0.01)).toBeCloseTo(1 / 101, 12);
  });

  it('still saturates to emax — the correction scales concentration, not emax', () => {
    expect(hillOccupancyAt(1e9, site({ emax: 0.8 }), 0.01)).toBeCloseTo(0.8, 6);
  });

  it('reproduces the buspirone-shaped overstatement it was built to fix', () => {
    // Stored in-vitro Ki 0.005783 mg/L against a therapeutic peak of
    // ~0.0025 mg/L reports ~30% occupancy; buspirone is ~95% protein bound,
    // and human PET measured 5 +/- 17%.
    const s = site({ ec50_mg_l: 0.005783 });
    const cp = 0.0025;
    expect(hillOccupancyAt(cp, s) * 100).toBeGreaterThan(29);
    expect(hillOccupancyAt(cp, s, 0.05) * 100).toBeLessThan(3);
  });
});

describe('hillCurve with a free fraction', () => {
  const ce = new Float32Array([0, 0.1, 1, 10, 100]);

  it('leaves an unauthored compound bit-identical, on both Hill branches', () => {
    for (const n of [1, 2]) {
      const s = site({ hill_n: n });
      expect(Array.from(hillCurve(ce, s, undefined))).toEqual(Array.from(hillCurve(ce, s)));
    }
  });

  it('agrees with the single-point function at every sample', () => {
    for (const n of [1, 1.5]) {
      const s = site({ hill_n: n });
      const curve = hillCurve(ce, s, 0.02);
      for (let i = 0; i < ce.length; i++) {
        expect(curve[i]!).toBeCloseTo(hillOccupancyAt(ce[i]!, s, 0.02), 6);
      }
    }
  });

  it('applies the correction on the n != 1 branch too', () => {
    // The hyperbolic fast path and the general pow() path are separate loops;
    // a correction applied to only one of them would be a silent split brain.
    const s = site({ hill_n: 2 });
    const corrected = hillCurve(ce, s, 0.01);
    const uncorrected = hillCurve(ce, s);
    for (let i = 1; i < ce.length; i++) {
      expect(corrected[i]!).toBeLessThan(uncorrected[i]!);
    }
  });

  it('opts out for an in-vivo plasma EC50', () => {
    const s = site({ basis: 'in_vivo_plasma_ec50' });
    expect(Array.from(hillCurve(ce, s, 0.01))).toEqual(Array.from(hillCurve(ce, s)));
  });
});
