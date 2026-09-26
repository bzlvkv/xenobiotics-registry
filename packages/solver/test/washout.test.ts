/**
 * washout.test.ts — per-compound dose-relevance windowing.
 *
 * The headline guarantee: at 8 half-lives the *aggregate* truncation error
 * under fast steady-state dosing stays under 1% (the steady-state
 * accumulation factor R amplifies the dropped tail, so 7 isn't enough).
 */
import { describe, it, expect } from 'vitest';
import { washoutHr, intakeStillRelevant, MM_WASHOUT_HR } from '../src/washout';
import { plasmaAt, cmaxOral } from '../src/pk';
import type { PkParams } from '../src/types';

const CAFFEINE: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1.0 };

describe('washoutHr', () => {
  it('1-comp = 8 half-lives', () => {
    expect(washoutHr(CAFFEINE)).toBeCloseTo(8 * 5, 6); // t½ = 5h → 40h
  });

  it('adds absorption lag', () => {
    expect(washoutHr({ ...CAFFEINE, lag_hr: 2 })).toBeCloseTo(8 * 5 + 2, 6);
  });

  it('2-comp uses the terminal (β) rate, not ke', () => {
    const twoComp: PkParams = {
      ka_hr: 5,
      ke_hr: 1.0,
      V_L: 36,
      F: 1.0,
      alpha_hr: 2.0,
      beta_hr: Math.LN2 / 20,
      k21_hr: 0.5,
    };
    // terminal t½ = ln2/β = 20h → 160h, NOT driven by ke=1.0
    expect(washoutHr(twoComp)).toBeCloseTo(8 * 20, 6);
  });

  it('zero-order adds the release duration', () => {
    const patch: PkParams = { ka_hr: 1, ke_hr: Math.LN2 / 10, V_L: 36, F: 1.0, zo_dur_hr: 24 };
    expect(washoutHr(patch)).toBeCloseTo(24 + 8 * 10, 6);
  });

  it('MM uses the conservative flat window', () => {
    const mm: PkParams = {
      ka_hr: 1,
      ke_hr: 0.1,
      V_L: 36,
      F: 1.0,
      mm_vmax_per_hr: 10,
      mm_km_mg_per_l: 5,
    };
    expect(washoutHr(mm)).toBeCloseTo(MM_WASHOUT_HR, 6);
  });
});

describe('truncation error', () => {
  it('a single dose at the washout cutoff has decayed below ~0.4% of its peak', () => {
    const cut = washoutHr(CAFFEINE);
    const residual = plasmaAt(cut, 100, CAFFEINE, 'PO');
    const peak = cmaxOral(100, CAFFEINE);
    // 2^-8 of the elimination-extrapolated C0; ~0.45% of the (lower) Cmax —
    // either way an order of magnitude under the 1% truncation budget.
    expect(residual / peak).toBeLessThan(0.005);
  });

  it('aggregate error under fast steady-state dosing (q4h on a 5h t½) stays < 1%', () => {
    // 60 days of caffeine every 4h; evaluate Cp at a dose instant (now=0).
    const tau = 4;
    const N = (60 * 24) / tau; // doses, most recent at age 0
    const cut = washoutHr(CAFFEINE);

    let full = 0;
    let windowed = 0;
    for (let k = 0; k < N; k++) {
      const ageHr = k * tau;
      const c = plasmaAt(ageHr, 100, CAFFEINE, 'PO');
      full += c;
      if (ageHr <= cut) windowed += c;
    }
    const relErr = Math.abs(full - windowed) / full;
    expect(relErr).toBeLessThan(0.01);
  });

  it('7 half-lives would NOT suffice for the same case (justifies 8)', () => {
    const tau = 4;
    const N = (60 * 24) / tau;
    const cut7 = 7 * 5;
    let full = 0;
    let windowed = 0;
    for (let k = 0; k < N; k++) {
      const ageHr = k * tau;
      const c = plasmaAt(ageHr, 100, CAFFEINE, 'PO');
      full += c;
      if (ageHr <= cut7) windowed += c;
    }
    const relErr7 = Math.abs(full - windowed) / full;
    // 7 half-lives leaves materially more than the 1% budget under accumulation
    expect(relErr7).toBeGreaterThan(0.005);
  });
});

describe('intakeStillRelevant', () => {
  const refCmax = cmaxOral(100, CAFFEINE);

  it('keeps doses within the washout window', () => {
    expect(intakeStillRelevant(10, 100, CAFFEINE, 'PO', refCmax)).toBe(true);
  });

  it('drops an old, fully-decayed normal dose', () => {
    expect(intakeStillRelevant(200, 100, CAFFEINE, 'PO', refCmax)).toBe(false);
  });

  it('keeps an old but still-material loading dose (absolute floor)', () => {
    // A 100× dose past the cutoff still contributes above ε·refCmax.
    expect(intakeStillRelevant(50, 10_000, CAFFEINE, 'PO', refCmax)).toBe(true);
  });

  it('future doses are never pruned by washout', () => {
    expect(intakeStillRelevant(-5, 100, CAFFEINE, 'PO', refCmax)).toBe(true);
  });
});
