/**
 * atnow.test.ts — the horizon-independent "right now" reduction.
 *
 * Proves: (1) it's an exact superposition for linear PK; (2) it's bounded
 * and stable under a long dose history (washout windowing); (3) it
 * demonstrates the bug it fixes — truncating the dose set (what the chart
 * horizon did) changes the number, while the full reduction is the stable
 * truth; (4) interactions are driven by the perpetrator's *instantaneous*
 * Cp(now), so a washed-out perpetrator exerts no effect.
 */
import { describe, it, expect } from 'vitest';
import { concentrationsAtNow, concentrationsAtTimes } from '../src/atnow';
import { solve } from '../src';
import { plasmaAt } from '../src/pk';
import type { PkParamMap, PkParams } from '../src/types';
import type { Intake } from '@xeno/core';

const HOUR = 3_600_000;
const NOW = Date.parse('2026-05-29T12:00:00Z');

const CAFFEINE: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1.0 };
// Long-acting depot: t½ ≈ 6 days.
const DEPOT: PkParams = { ka_hr: 0.3, ke_hr: Math.LN2 / 144, V_L: 50, F: 0.8 };

function intake(compound: string, ageHr: number, dose_mg = 100, route = 'PO'): Intake {
  const at = new Date(NOW - ageHr * HOUR).toISOString();
  return {
    id: `${compound}-${ageHr}`,
    compound,
    dose: dose_mg,
    dose_unit: 'mg',
    route: route as Intake['route'],
    at,
    created_at: at,
    updated_at: at,
  };
}

describe('concentrationsAtNow — linear superposition', () => {
  it('matches plasmaAt for a single dose', () => {
    const pk: PkParamMap = new Map([['caffeine', { PO: CAFFEINE }]]);
    const got = concentrationsAtNow({ intakes: [intake('caffeine', 2)], pkParams: pk, nowMs: NOW });
    expect(got.get('caffeine')!).toBeCloseTo(plasmaAt(2, 100, CAFFEINE, 'PO'), 6);
  });

  it('sums multiple doses exactly', () => {
    const pk: PkParamMap = new Map([['caffeine', { PO: CAFFEINE }]]);
    const ages = [1, 4, 7];
    const got = concentrationsAtNow({
      intakes: ages.map((a) => intake('caffeine', a)),
      pkParams: pk,
      nowMs: NOW,
    });
    const expected = ages.reduce((s, a) => s + plasmaAt(a, 100, CAFFEINE, 'PO'), 0);
    expect(got.get('caffeine')!).toBeCloseTo(expected, 6);
  });

  it('agrees with the grid solver read at now (fine step)', () => {
    const pk: PkParamMap = new Map([['caffeine', { PO: CAFFEINE }]]);
    const intakes = [intake('caffeine', 3), intake('caffeine', 0.5)];
    const out = solve({
      intakes,
      pkParams: pk,
      horizon: { start: NOW - 6 * HOUR, end: NOW + 6 * HOUR, stepMin: 1 },
      mcSamples: 0,
    });
    const curve = out.plasma.get('caffeine')!;
    // now is the exact grid centre at stepMin=1 → curve mid-sample.
    const nowIdx = Math.round((curve.length - 1) / 2);
    const atNow = concentrationsAtNow({ intakes, pkParams: pk, nowMs: NOW }).get('caffeine')!;
    expect(atNow).toBeCloseTo(curve[nowIdx]!, 2);
  });
});

describe('washout windowing — bounded & stable under long history', () => {
  it('is horizon-independent: truncating old doses changes the number, the full reduction is stable', () => {
    const pk: PkParamMap = new Map([['depot', { PO: DEPOT }]]);
    // Weekly depot for 6 weeks — all within the depot's ~48-day washout.
    const full: Intake[] = [];
    for (let w = 0; w < 6; w++) full.push(intake('depot', w * 7 * 24, 100));

    const fullVal = concentrationsAtNow({ intakes: full, pkParams: pk, nowMs: NOW }).get('depot')!;

    // What the 6h chart window did: keep only doses in the last 6h → drops
    // every prior weekly dose still circulating.
    const truncated = full.filter((i) => (NOW - Date.parse(i.at)) / HOUR <= 6);
    const truncVal =
      concentrationsAtNow({ intakes: truncated, pkParams: pk, nowMs: NOW }).get('depot') ?? 0;

    // The truncated (chart-6h) read is materially lower — that's the bug.
    expect(truncVal).toBeLessThan(fullVal * 0.6);
    // The full reduction includes the accumulated depot — the correct value.
    expect(fullVal).toBeGreaterThan(0);
  });

  it('drops doses far beyond washout (caffeine history older than 8 half-lives)', () => {
    const pk: PkParamMap = new Map([['caffeine', { PO: CAFFEINE }]]);
    const recent = [intake('caffeine', 1)];
    const withAncient = [...recent, intake('caffeine', 1000)]; // 1000h ≫ 40h washout
    const a = concentrationsAtNow({ intakes: recent, pkParams: pk, nowMs: NOW }).get('caffeine')!;
    const b = concentrationsAtNow({ intakes: withAncient, pkParams: pk, nowMs: NOW }).get(
      'caffeine',
    )!;
    expect(b).toBeCloseTo(a, 9); // ancient dose contributes nothing
  });
});

describe('interactions — instantaneous Cp(now) driver', () => {
  const VICTIM: PkParams = { ka_hr: 4, ke_hr: Math.LN2 / 6, V_L: 40, F: 0.9 };
  const PERP: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 4, V_L: 30, F: 1.0 };
  const pk: PkParamMap = new Map([
    ['victim', { PO: VICTIM }],
    ['perp', { PO: PERP }],
  ]);
  const edge = {
    from: 'perp',
    to: 'victim',
    kinetics: { ki_uM: 1 },
    perpetrator_mw_g_mol: 200,
  };

  it('an on-board inhibitor raises the victim Cp(now) vs no interaction', () => {
    const intakes = [intake('victim', 3), intake('perp', 1)];
    const base = concentrationsAtNow({ intakes, pkParams: pk, nowMs: NOW }).get('victim')!;
    const withDdi = concentrationsAtNow({
      intakes,
      pkParams: pk,
      nowMs: NOW,
      interactions: [edge],
    }).get('victim')!;
    expect(withDdi).toBeGreaterThan(base);
  });

  it('a washed-out perpetrator exerts ~no effect (presence-gated by Cp(now))', () => {
    const intakes = [intake('victim', 3), intake('perp', 500)]; // perp dosed 500h ago → Cp(now)≈0
    const base = concentrationsAtNow({ intakes, pkParams: pk, nowMs: NOW }).get('victim')!;
    const withDdi = concentrationsAtNow({
      intakes,
      pkParams: pk,
      nowMs: NOW,
      interactions: [edge],
    }).get('victim')!;
    expect(withDdi).toBeCloseTo(base, 4);
  });
});

describe('concentrationsAtTimes — batch sampler parity', () => {
  const VICTIM: PkParams = { ka_hr: 4, ke_hr: Math.LN2 / 6, V_L: 40, F: 0.9 };
  const PERP: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 4, V_L: 30, F: 1.0 };
  const edge = { from: 'perp', to: 'victim', kinetics: { ki_uM: 1 }, perpetrator_mw_g_mol: 200 };

  // Five instants spanning the doses' rise and decay; the batch column at each
  // must equal the single-instant reduction to the float — same code path,
  // PK resolved once instead of per call.
  const times = [-6, -2, 0, 4, 9].map((h) => NOW + h * HOUR);

  it('each column equals concentrationsAtNow at that instant (linear, multi-compound)', () => {
    const pk: PkParamMap = new Map([
      ['caffeine', { PO: CAFFEINE }],
      ['depot', { PO: DEPOT }],
    ]);
    const intakes = [intake('caffeine', 3), intake('caffeine', 0.5), intake('depot', 72)];
    const batch = concentrationsAtTimes({ intakes, pkParams: pk, timesMs: times });

    expect(batch.times).toEqual(times);
    for (let ti = 0; ti < times.length; ti++) {
      const single = concentrationsAtNow({ intakes, pkParams: pk, nowMs: times[ti] });
      for (const slug of batch.bySlug.keys()) {
        expect(batch.bySlug.get(slug)![ti]).toBeCloseTo(single.get(slug) ?? 0, 9);
      }
      // Same compound set as the single-instant reduction.
      expect([...batch.bySlug.keys()].sort()).toEqual([...single.keys()].sort());
    }
  });

  it('recomputes DDIs per instant — parity with concentrationsAtNow under interactions', () => {
    const pk: PkParamMap = new Map([
      ['victim', { PO: VICTIM }],
      ['perp', { PO: PERP }],
    ]);
    // Perp dosed once near the middle instant: on-board for later columns,
    // absent (future dose) for earlier ones → the victim's DDI bump must
    // appear only where Cp_perp(t) > 0, recomputed per column.
    const intakes = [intake('victim', 8), intake('perp', 2)];
    const batch = concentrationsAtTimes({
      intakes,
      pkParams: pk,
      timesMs: times,
      interactions: [edge],
    });
    for (let ti = 0; ti < times.length; ti++) {
      const single = concentrationsAtNow({
        intakes,
        pkParams: pk,
        nowMs: times[ti],
        interactions: [edge],
      });
      expect(batch.bySlug.get('victim')![ti]).toBeCloseTo(single.get('victim') ?? 0, 9);
    }
  });

  it('produces one sample per requested time and shares the array length', () => {
    const pk: PkParamMap = new Map([['caffeine', { PO: CAFFEINE }]]);
    const batch = concentrationsAtTimes({
      intakes: [intake('caffeine', 1)],
      pkParams: pk,
      timesMs: times,
    });
    expect(batch.bySlug.get('caffeine')!.length).toBe(times.length);
  });
});
