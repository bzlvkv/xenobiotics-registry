/**
 * Parent → metabolite formation kinetics (E6 parent→metabolite half).
 *
 * A metabolite is FORMED from a parent's elimination and cleared by its own PK.
 * We defend:
 *   - the coupling scalar (fm · MW ratio · volume ratio),
 *   - the formation source curve (∝ parent elimination rate),
 *   - the integrator: mass balance (all parent that's eliminated shows up as
 *     metabolite when fm=1), formation delay (metabolite peaks after the parent),
 *     and persistence (metabolite outlives a fast-cleared parent),
 *   - end-to-end through solve(): a formed-only metabolite appears in the output
 *     with the mass-balance AUC and correlated MC bands.
 */
import { describe, it, expect } from 'vitest';
import { ulid } from 'ulid';
import type { Intake } from '@xeno/core';
import { solve } from '../src';
import { metaboliteCoupling, metaboliteFormationRate, metaboliteCurve } from '../src/metabolite';
import type { PkParams, MetaboliteLink } from '../src/types';

const HS = Date.parse('2026-05-01T08:00:00Z');

function intake(
  compound: string,
  at_ms: number,
  dose_mg: number,
  route: 'PO' | 'IV' = 'PO',
): Intake {
  const iso = new Date(at_ms).toISOString();
  return {
    id: ulid(),
    compound,
    dose: dose_mg,
    dose_unit: 'mg',
    route,
    at: iso,
    created_at: iso,
    updated_at: iso,
  };
}
function grid(hours: number, stepMin: number): Float64Array {
  const T = Math.floor((hours * 60) / stepMin) + 1;
  const g = new Float64Array(T);
  for (let i = 0; i < T; i++) g[i] = (i * stepMin) / 60;
  return g;
}
function auc(c: Float32Array, dt_hr: number): number {
  let s = 0;
  for (let i = 1; i < c.length; i++) s += 0.5 * (c[i]! + c[i - 1]!) * dt_hr;
  return s;
}

describe('metaboliteCoupling', () => {
  it('is fm · (MWm/MWp) · (Vp/Vm)', () => {
    expect(metaboliteCoupling(1, 100, 100, 50, 50)).toBeCloseTo(1, 12);
    expect(metaboliteCoupling(0.5, 180, 138, 11, 30)).toBeCloseTo(
      0.5 * (138 / 180) * (11 / 30),
      12,
    );
    expect(metaboliteCoupling(1, 0, 100, 50, 50)).toBe(0); // guard: MWp=0
    expect(metaboliteCoupling(1, 100, 100, 50, 0)).toBe(0); // guard: Vm=0
  });
});

describe('metaboliteFormationRate', () => {
  it('linear parent: source = coupling · ke · Cp', () => {
    const pk: PkParams = { ka_hr: 1, ke_hr: 0.5, V_L: 40, F: 1 };
    const cp = Float32Array.from([0, 2, 4, 1]);
    const r = metaboliteFormationRate(cp, pk, 2); // coupling = 2
    expect(Array.from(r)).toEqual([0, 2 * 0.5 * 2, 2 * 0.5 * 4, 2 * 0.5 * 1]);
  });
  it('is all-zero when coupling is 0', () => {
    const pk: PkParams = { ka_hr: 1, ke_hr: 0.5, V_L: 40, F: 1 };
    expect(Array.from(metaboliteFormationRate(Float32Array.from([1, 2, 3]), pk, 0))).toEqual([
      0, 0, 0,
    ]);
  });
});

describe('metaboliteCurve — integrator', () => {
  it('a constant formation source drives a linear metabolite to Css = src/ke', () => {
    const g = grid(60, 5);
    const src = new Float32Array(g.length).fill(3); // 3 mg/L/hr constant formation
    const pk: PkParams = { ka_hr: 1, ke_hr: 0.5, V_L: 50, F: 1 };
    const c = metaboliteCurve(g, [], pk, HS, src);
    // Css = src/ke = 3/0.5 = 6 mg/L; approached by 60 h (many half-lives).
    expect(c[c.length - 1]!).toBeCloseTo(6, 1);
    expect(c[0]!).toBe(0); // starts empty
    // Monotonic rise toward Css under constant input.
    for (let i = 1; i < c.length; i++) expect(c[i]!).toBeGreaterThanOrEqual(c[i - 1]! - 1e-6);
  });

  it('is a plain 1-comp curve when there is no formation (direct dose only)', () => {
    const g = grid(24, 5);
    const zero = new Float32Array(g.length);
    const pk: PkParams = { ka_hr: 2, ke_hr: 0.3, V_L: 50, F: 1 };
    const c = metaboliteCurve(g, [intake('met', HS, 100, 'IV')], pk, HS, zero);
    expect(c[0]!).toBeCloseTo(100 / 50, 6); // IV bolus C(0) = D/V
    expect(c[c.length - 1]!).toBeLessThan(c[0]!); // decays
  });
});

describe('solve() — parent → metabolite end to end', () => {
  const par: PkParams = { ka_hr: 1, ke_hr: 2, V_L: 50, F: 1 }; // fast (t½ ≈ 0.35 h)
  const met: PkParams = { ka_hr: 1, ke_hr: 0.2, V_L: 50, F: 1 }; // slow (t½ ≈ 3.5 h)
  const link: MetaboliteLink = {
    parent: 'par',
    metabolite: 'met',
    fraction: 1,
    mw_parent_g_mol: 100,
    mw_metabolite_g_mol: 100,
  };
  const horizon = { start: HS, end: HS + 72 * 3_600_000, stepMin: 5 };

  it('forms a metabolite that is never dosed, with the mass-balance AUC', () => {
    const out = solve({
      intakes: [intake('par', HS, 1000, 'IV')],
      pkParams: new Map([
        ['par', { IV: par }],
        ['met', { IV: met, PO: met }],
      ]),
      horizon,
      mcSamples: 0,
      metabolites: [link],
    });
    const mc = out.plasma.get('met');
    expect(mc).toBeDefined();
    // fm=1, MW equal → every mg of parent eliminated becomes a mg of metabolite.
    // Mass balance: metabolite AUC = D/(ke_m·V) = 1000/(0.2·50) = 100.
    expect(auc(mc!, 5 / 60)).toBeCloseTo(100, 0);
    // Parent AUC = D/(ke_p·V) = 1000/(2·50) = 10.
    expect(auc(out.plasma.get('par')!, 5 / 60)).toBeCloseTo(10, 0);
  });

  it('metabolite peaks AFTER the parent and persists once the parent has cleared', () => {
    const out = solve({
      intakes: [intake('par', HS, 1000, 'IV')],
      pkParams: new Map([
        ['par', { IV: par }],
        ['met', { IV: met, PO: met }],
      ]),
      horizon,
      mcSamples: 0,
      metabolites: [link],
    });
    const p = out.plasma.get('par')!;
    const m = out.plasma.get('met')!;
    const argmax = (c: Float32Array) => {
      let bi = 0;
      for (let i = 1; i < c.length; i++) if (c[i]! > c[bi]!) bi = i;
      return bi;
    };
    expect(argmax(p)).toBe(0); // IV parent peaks immediately
    expect(argmax(m)).toBeGreaterThan(5); // formation-rate-limited → later peak
    // At 10 h the fast parent (t½ 0.35 h) is gone but the metabolite lingers.
    const i10 = Math.round((10 * 60) / 5);
    expect(p[i10]!).toBeLessThan(1e-3);
    expect(m[i10]!).toBeGreaterThan(0.5);
  });

  it('drops the link when the parent is not on board', () => {
    const out = solve({
      intakes: [intake('other', HS, 100, 'PO')],
      pkParams: new Map([
        ['other', { PO: par }],
        ['met', { PO: met }],
      ]),
      horizon,
      mcSamples: 0,
      metabolites: [link],
    });
    expect(out.plasma.has('met')).toBe(false); // parent 'par' absent → no formation
  });

  it('gives the metabolite MC bands (IIV propagated from formation)', () => {
    const out = solve({
      intakes: [intake('par', HS, 1000, 'IV')],
      pkParams: new Map([
        ['par', { IV: par }],
        ['met', { IV: met, PO: met }],
      ]),
      horizon,
      mcSamples: 40,
      seed: 7,
      metabolites: [link],
    });
    const p10 = out.plasmaP10?.get('met');
    const p90 = out.plasmaP90?.get('met');
    expect(p10).toBeDefined();
    expect(p90).toBeDefined();
    const peak = (c: Float32Array) => Math.max(...c);
    expect(peak(p90!)).toBeGreaterThan(peak(p10!)); // a real band, not degenerate
  });
});
