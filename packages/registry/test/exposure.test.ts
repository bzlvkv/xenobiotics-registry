import { describe, expect, it } from 'vitest';
import { readRegistry } from '../src/read';
import { impliedExposure, PK_DEFAULTS } from '../src/exposure';
import type { Compound, Route } from '../src/types';

const base: Compound = {
  slug: 'x',
  name: 'X',
  aliases: [],
  category: 'other',
  mechanism: '.',
  routes: ['PO', 'IV'],
  doses: {
    PO: { min: 100, max: 100, typical: 100, unit: 'mg' },
    IV: { min: 1, max: 1, typical: 1, unit: 'g' },
  },
  half_life_hr: { PO: 10, IV: 10 },
  systems: ['nervous'],
  refs: [],
};

describe('impliedExposure', () => {
  it('reproduces the closed-form oral peak and labels every default', () => {
    const r = impliedExposure(base, 'PO');
    if (!r.ok) throw new Error(r.reason);
    const ke = Math.LN2 / 10;
    const ka = PK_DEFAULTS.kaPerHr;
    const V = PK_DEFAULTS.vLPerKg * PK_DEFAULTS.referenceWeightKg;
    const tmax = Math.log(ka / ke) / (ka - ke);
    const cmax =
      ((PK_DEFAULTS.F * 100 * ka) / (V * (ka - ke))) *
      (Math.exp(-ke * tmax) - Math.exp(-ka * tmax));
    expect(r.tmaxHr).toBeCloseTo(tmax, 10);
    expect(r.cmaxMgPerL).toBeCloseTo(cmax, 10);
    expect(r.aucMgHrPerL).toBeCloseTo((PK_DEFAULTS.F * 100) / (ke * V), 10);
    // The whole reason the labels exist: nothing on this record set V, F or ka.
    expect([r.V.from, r.F.from, r.ka?.from, r.ke.from]).toEqual([
      'default',
      'default',
      'default',
      'derived',
    ]);
  });

  it('treats IV as a bolus with F = 1 and converts the dose unit', () => {
    const r = impliedExposure({ ...base, pk: { IV: { V_L: 50 } } }, 'IV');
    if (!r.ok) throw new Error(r.reason);
    expect(r.doseMg).toBe(1000);
    expect(r.tmaxHr).toBe(0);
    expect(r.cmaxMgPerL).toBeCloseTo(1000 / 50, 10);
    expect(r.F.value).toBe(1);
    expect(r.ka).toBeUndefined();
    expect(r.V.from).toBe('stored');
  });

  it('takes the limit where ka equals ke instead of dividing by zero', () => {
    const k = Math.LN2 / 10;
    const r = impliedExposure({ ...base, pk: { PO: { ka_hr: k, V_L: 10, F: 1 } } }, 'PO');
    if (!r.ok) throw new Error(r.reason);
    expect(r.tmaxHr).toBeCloseTo(1 / k, 10);
    expect(r.cmaxMgPerL).toBeCloseTo(100 / (10 * Math.E), 10);
    expect(Number.isFinite(r.cmaxMgPerL)).toBe(true);
  });

  it('uses the protein volume default above the mass threshold', () => {
    const r = impliedExposure({ ...base, mw_g_mol: 150_000 }, 'PO');
    if (!r.ok) throw new Error(r.reason);
    expect(r.V.value).toBeCloseTo(PK_DEFAULTS.vLPerKgProtein * PK_DEFAULTS.referenceWeightKg, 10);
  });

  it('says why a route cannot be resolved rather than inventing numbers', () => {
    const noT12 = impliedExposure({ ...base, half_life_hr: {} }, 'PO');
    expect(noT12.ok).toBe(false);
    const iu = impliedExposure(
      { ...base, doses: { PO: { min: 1, max: 1, typical: 1000, unit: 'IU' } } },
      'PO',
    );
    expect(iu.ok === false && iu.reason).toMatch(/IU/);
  });

  it('reports what it does not model instead of silently ignoring it', () => {
    const r = impliedExposure(
      { ...base, pk: { PO: { zo_dur_hr: 24, alpha_hr: 1, source_species: 'rat' } } },
      'PO',
    );
    if (!r.ok) throw new Error(r.reason);
    expect(r.caveats.join(' ')).toMatch(/zero-order/);
    expect(r.caveats.join(' ')).toMatch(/two-compartment/);
    expect(r.caveats.join(' ')).toMatch(/rat/);
  });

  it('resolves every authored route in the real catalog to finite numbers or a reason', () => {
    const { compounds } = readRegistry();
    let resolved = 0;
    for (const c of compounds) {
      for (const route of Object.keys(c.pk ?? {}) as Route[]) {
        const r = impliedExposure(c, route);
        if (!r.ok) {
          expect(r.reason.length).toBeGreaterThan(0);
          continue;
        }
        resolved++;
        for (const v of [r.tmaxHr, r.cmaxMgPerL, r.aucMgHrPerL, r.clearanceLPerHr]) {
          expect(Number.isFinite(v) && v >= 0, `${c.slug}.${route}`).toBe(true);
        }
      }
    }
    expect(resolved).toBeGreaterThan(600);
  });
});
