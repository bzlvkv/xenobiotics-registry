/**
 * Effect-compartment + Hill–Langmuir tests.
 *
 * The PD layer rests on three claims that need to hold in code:
 *
 *   1. Ce(t) lags Cp(t): the peak of Ce is later in time than the peak
 *      of Cp, and Ce is monotone-rising while Cp is below it (the
 *      effect site is filling) and monotone-falling while Cp is above
 *      it (the effect site is emptying).
 *
 *   2. As keo → ∞, Ce → Cp: a fast-equilibrating effect compartment
 *      collapses to plasma. We test by raising keo and showing Ce
 *      tracks plasma to within tight tolerance.
 *
 *   3. Hill at ec50 returns emax/2 exactly; at 10×ec50 with Hill
 *      coefficient n=1 returns ~10/11 of emax (canonical hyperbolic
 *      shape); at 0 returns 0; saturates to emax as Ce → ∞.
 */

import { describe, it, expect } from 'vitest';
import type { ReceptorSite } from '@xeno/core';
import { effectCurve, ceSteadyState } from '../src/effect-compartment';
import { hillCurve, hillOccupancyAt, compositeOccupancyCurve } from '../src/hill';
import { plasmaCurve } from '../src/pk';
import type { PkParams } from '../src/types';

const STEP_MIN = 1; // 1-min sampling so peak detection is precise
const DT_HR = STEP_MIN / 60;

function buildPlasmaGrid(hours: number): Float64Array {
  const T = Math.floor((hours * 60) / STEP_MIN) + 1;
  const out = new Float64Array(T);
  for (let i = 0; i < T; i++) out[i] = (i * STEP_MIN) / 60;
  return out;
}

function argmax(buf: Float32Array): number {
  let idx = 0;
  for (let i = 1; i < buf.length; i++) if (buf[i]! > buf[idx]!) idx = i;
  return idx;
}

describe('effectCurve — Ce lags plasma', () => {
  // Caffeine-shaped PK: ka 5, ke ln2/5, V 36, F 1.
  const pk: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1.0 };
  const grid = buildPlasmaGrid(12); // 12h window
  const cp = plasmaCurve(grid, 100, pk, 'PO');

  it('Ce peaks later than Cp for moderate keo', () => {
    // keo = 0.7/hr (canonical caffeine effect-site rate)
    const ce = effectCurve(cp, DT_HR, 0.7);
    const cpPeak_idx = argmax(cp);
    const cePeak_idx = argmax(ce);
    expect(cePeak_idx).toBeGreaterThan(cpPeak_idx);
  });

  it('Ce starts at zero and rises monotonically until Cp drops below Ce', () => {
    const ce = effectCurve(cp, DT_HR, 0.7);
    expect(ce[0]).toBe(0);
    // Rising phase: scan until the first sample where ce[i+1] < ce[i].
    let firstFallIdx = ce.length - 1;
    for (let i = 0; i < ce.length - 1; i++) {
      if (ce[i + 1]! < ce[i]!) {
        firstFallIdx = i;
        break;
      }
    }
    // At the moment Ce stops rising, plasma must be at or below it
    // (this is the ODE invariant: dCe/dt has the sign of Cp − Ce).
    // Tolerance accounts for the trapezoidal-step half-lag where Cp
    // and Ce are evaluated at sample boundaries.
    expect(cp[firstFallIdx]!).toBeLessThanOrEqual(ce[firstFallIdx]! + 1e-2);
  });

  it('large keo collapses Ce ≈ Cp (within tolerance)', () => {
    // keo = 1000/hr — effectively instant equilibration. Ce should
    // track plasma except for the half-step lag inherent to the
    // trapezoidal recurrence (Ce[i+1] = avg(Cp[i], Cp[i+1])). At the
    // steepest part of the rising arm with Δt=1min that's a few
    // percent of cmax — tolerance is ~5% relative.
    const ce = effectCurve(cp, DT_HR, 1000);
    let maxAbsDiff = 0;
    for (let i = 1; i < cp.length; i++) {
      const diff = Math.abs(ce[i]! - cp[i]!);
      if (diff > maxAbsDiff) maxAbsDiff = diff;
    }
    const cpMax = Math.max(...cp);
    expect(maxAbsDiff / cpMax).toBeLessThan(0.05);
  });

  it('returns all-zero output when keo is 0 or negative', () => {
    expect([...effectCurve(cp, DT_HR, 0)]).toEqual(new Array(cp.length).fill(0));
    expect([...effectCurve(cp, DT_HR, -1)]).toEqual(new Array(cp.length).fill(0));
  });

  it('ceSteadyState is identity', () => {
    expect(ceSteadyState(0)).toBe(0);
    expect(ceSteadyState(1.5)).toBe(1.5);
  });
});

describe('hillOccupancy — canonical shape', () => {
  // Single hyperbolic site with emax=1, ec50=2 mg/L, n=1.
  const site: ReceptorSite = { receptor: 'r1', emax: 1, ec50_mg_l: 2, hill_n: 1 };

  it('returns 0 at Ce=0', () => {
    expect(hillOccupancyAt(0, site)).toBe(0);
  });

  it('returns emax/2 at Ce = ec50', () => {
    expect(hillOccupancyAt(2, site)).toBeCloseTo(0.5, 10);
  });

  it('returns ~10/11 emax at Ce = 10·ec50 (n=1 hyperbolic)', () => {
    expect(hillOccupancyAt(20, site)).toBeCloseTo(10 / 11, 6);
  });

  it('saturates toward emax as Ce grows', () => {
    // Hill at 1e6×ec50 returns ec/(ec50+ec) ≈ 1 - 2/1e6 = 0.999998.
    // Asymptote, not exact.
    expect(hillOccupancyAt(1e6, site)).toBeGreaterThan(0.99999);
    expect(hillOccupancyAt(1e6, site)).toBeLessThanOrEqual(1);
  });

  it('respects emax < 1', () => {
    const partial: ReceptorSite = { ...site, emax: 0.7 };
    expect(hillOccupancyAt(1e6, partial)).toBeGreaterThan(0.69999);
    expect(hillOccupancyAt(1e6, partial)).toBeLessThanOrEqual(0.7);
    expect(hillOccupancyAt(2, partial)).toBeCloseTo(0.35, 5);
  });

  it('cooperativity (n>1) is steeper around ec50', () => {
    const cooperative: ReceptorSite = { ...site, hill_n: 4 };
    // At 0.5·ec50, n=1 gives 0.333; n=4 gives 1/(1+16) = 0.0588 — much lower.
    const linear = hillOccupancyAt(1, site);
    const sigmoid = hillOccupancyAt(1, cooperative);
    expect(sigmoid).toBeLessThan(linear * 0.25);
  });
});

describe('compositeOccupancyCurve — probabilistic union', () => {
  it('returns the input unchanged for a single contributor', () => {
    const occ = new Float32Array([0, 0.3, 0.6, 0.9]);
    const out = compositeOccupancyCurve([occ]);
    for (let i = 0; i < occ.length; i++) {
      expect(out[i]).toBeCloseTo(occ[i]!, 6);
    }
  });

  it('two equal 50% contributors give 75% (1 − 0.5×0.5)', () => {
    const a = new Float32Array([0.5, 0.5, 0.5]);
    const b = new Float32Array([0.5, 0.5, 0.5]);
    const out = compositeOccupancyCurve([a, b]);
    for (const v of out) expect(v).toBeCloseTo(0.75, 6);
  });

  it('zero from any contributor still produces nonzero composite when others are nonzero', () => {
    const a = new Float32Array([0.3]);
    const b = new Float32Array([0]);
    expect(compositeOccupancyCurve([a, b])[0]).toBeCloseTo(0.3, 6);
  });

  it('saturates toward 1 with many contributors', () => {
    const T = 1;
    const curves: Float32Array[] = [];
    for (let i = 0; i < 20; i++) {
      const c = new Float32Array(T);
      c[0] = 0.3;
      curves.push(c);
    }
    const out = compositeOccupancyCurve(curves);
    // 1 − 0.7^20 ≈ 0.9992
    expect(out[0]).toBeGreaterThan(0.999);
  });

  it('returns empty array when given no contributors', () => {
    expect(compositeOccupancyCurve([]).length).toBe(0);
  });
});

describe('hillCurve — sampled across Ce buffer', () => {
  it('produces an occupancy buffer of equal length, bounded by emax', () => {
    const ce = new Float32Array([0, 0.5, 1, 2, 5, 10, 20]);
    const site: ReceptorSite = { receptor: 'r1', emax: 0.9, ec50_mg_l: 2, hill_n: 1 };
    const occ = hillCurve(ce, site);
    expect(occ.length).toBe(ce.length);
    for (const v of occ) expect(v).toBeGreaterThanOrEqual(0);
    for (const v of occ) expect(v).toBeLessThanOrEqual(0.9 + 1e-9);
    // At Ce=ec50=2 we expect emax/2 = 0.45. Float32 storage in the
    // returned buffer means ~6-decimal precision.
    expect(occ[3]).toBeCloseTo(0.45, 5);
  });
});
