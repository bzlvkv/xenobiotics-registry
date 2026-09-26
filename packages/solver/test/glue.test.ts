/**
 * registry-glue tests — buildPkMap behavior across authoring states.
 *
 * Three relevant cases:
 *   - fully authored (pk.PO.ka_hr, V_L, F, source_pmid all present)
 *   - partial (only half_life_hr) → params produced via defaults; defaulted
 *   - sourced but scale-less (source_pmid + half-life, no V_L/F) → defaulted
 *   - none (no pk, no half_life_hr) → no params; unmodelled
 */

import { describe, it, expect } from 'vitest';
import { ulid } from 'ulid';
import type { Compound, Intake } from '@xeno/core';
import { buildPkMap, pkParamsForRoute } from '../src/registry-glue';

function makeCompound(partial: Partial<Compound> & { slug: string; name: string }): Compound {
  return {
    aliases: [],
    category: 'other',
    mechanism: '.',
    routes: ['PO'],
    doses: { PO: { min: 1, max: 100, typical: 10, unit: 'mg' } },
    half_life_hr: {},
    refs: [],
    ...partial,
  };
}

function makeIntake(slug: string, route: Intake['route'] = 'PO'): Intake {
  const at = new Date().toISOString();
  return {
    id: ulid(),
    compound: slug,
    dose: 100,
    dose_unit: 'mg',
    route,
    at,
    created_at: at,
    updated_at: at,
  };
}

describe('pkParamsForRoute', () => {
  it('returns null when neither ke nor half-life is available', () => {
    const c = makeCompound({ slug: 'unknown', name: 'Unknown' });
    expect(pkParamsForRoute(c, 'PO')).toBeNull();
  });

  it('builds params from half_life_hr alone (ka/V/F defaulted)', () => {
    const c = makeCompound({
      slug: 'h-only',
      name: 'Half-only',
      half_life_hr: { PO: 4 },
    });
    const pk = pkParamsForRoute(c, 'PO')!;
    expect(pk).not.toBeNull();
    expect(pk.ke_hr).toBeCloseTo(Math.LN2 / 4, 10);
    expect(pk.ka_hr).toBe(1.0); // resolvePk default
  });

  // Regression: the null-gate used to test ONLY ke_hr / half_life_hr, so a
  // compound authored purely on saturable or two-compartment params was
  // rejected before resolvePk (which accepts both) ever ran. Ethanol is the
  // real-world case — MM params, no half-life, and the app said "no PK".
  it('builds params from MM params alone, with no ke and no half-life', () => {
    const c = makeCompound({
      slug: 'mm-only',
      name: 'MM-only',
      pk: { PO: { V_L: 37, F: 0.8, mm_vmax_per_hr: 230, mm_km_mg_per_l: 80 } },
    });
    const pk = pkParamsForRoute(c, 'PO');
    expect(pk).not.toBeNull();
    expect(pk!.mm_vmax_per_hr).toBeCloseTo(230 * Math.pow(70 / 70, -0.25), 10);
    expect(pk!.mm_km_mg_per_l).toBe(80);
    // resolvePk derives a low-Cp linear-equivalent ke = Vmax/Km for readers
    // that only understand first-order elimination.
    expect(pk!.ke_hr).toBeGreaterThan(0);
  });

  it('builds params from two-compartment params alone', () => {
    const c = makeCompound({
      slug: 'tc-only',
      name: 'TwoComp-only',
      pk: { PO: { V_L: 50, F: 1, alpha_hr: 0.9, beta_hr: 0.05, k21_hr: 0.2 } },
    });
    const pk = pkParamsForRoute(c, 'PO');
    expect(pk).not.toBeNull();
    // beta is the terminal rate and stands in for ke in the 1-comp reading.
    expect(pk!.ke_hr).toBeCloseTo(0.05, 10);
  });

  it('still returns null when a route has params but no elimination path', () => {
    const c = makeCompound({
      slug: 'no-elim',
      name: 'No elimination',
      pk: { PO: { ka_hr: 1, V_L: 30, F: 0.9 } },
    });
    expect(pkParamsForRoute(c, 'PO')).toBeNull();
  });

  it('respects authored pk overrides over defaults', () => {
    const c = makeCompound({
      slug: 'authored',
      name: 'Authored',
      half_life_hr: { PO: 4 },
      pk: { PO: { ka_hr: 9, V_L: 50, F: 0.95 } },
    });
    const pk = pkParamsForRoute(c, 'PO')!;
    expect(pk.ka_hr).toBe(9);
    expect(pk.V_L).toBe(50);
    expect(pk.F).toBe(0.95);
  });
});

describe('retired-slug forwarding', () => {
  // The merge of duplicate compound records retires a slug, but intakes
  // logged before the merge still name it and the op log is append-only.
  // If buildPkMap misses the forwarding, nothing throws — the compound just
  // silently loses its curve and reads as "no PK on file".
  const merged: Compound[] = [
    makeCompound({
      slug: 'tyrosine',
      name: 'Tyrosine',
      retired_slugs: ['l-tyrosine'],
      half_life_hr: { PO: 3 },
      pk: { PO: { ka_hr: 1, V_L: 42, F: 0.7, source_pmid: 'PMID:481129' } },
    }),
  ];

  it('gives a pre-merge intake the surviving compound PK params', () => {
    const { params } = buildPkMap(merged, [makeIntake('l-tyrosine')]);
    const pk = params.get('l-tyrosine')?.PO;
    expect(pk).toBeDefined();
    expect(pk!.V_L).toBe(42);
    expect(pk!.F).toBe(0.7);
    expect(pk!.ke_hr).toBeCloseTo(Math.LN2 / 3, 10);
  });

  it('gives the same params whichever slug the intake was logged under', () => {
    const viaRetired = buildPkMap(merged, [makeIntake('l-tyrosine')]).params.get('l-tyrosine')?.PO;
    const viaCanonical = buildPkMap(merged, [makeIntake('tyrosine')]).params.get('tyrosine')?.PO;
    expect(viaRetired).toEqual(viaCanonical);
  });

  it('still reports an unknown slug as unresolvable', () => {
    const { params } = buildPkMap(merged, [makeIntake('not-a-compound')]);
    expect(params.get('not-a-compound')).toBeUndefined();
  });
});

describe('buildPkMap', () => {
  const compounds: Compound[] = [
    makeCompound({
      slug: 'caffeine',
      name: 'Caffeine',
      half_life_hr: { PO: 5 },
      pk: { PO: { ka_hr: 5, V_L: 36, F: 1.0, source_pmid: 'PMID:20164566' } },
    }),
    makeCompound({
      slug: 'partial',
      name: 'Partial',
      half_life_hr: { PO: 3 },
    }),
    makeCompound({
      slug: 'no-pk',
      name: 'NoPk',
      // no half-life, no pk — should land in defaulted with no params
    }),
  ];

  it('includes fully-authored compounds with no defaulted flag', () => {
    const { params, defaulted } = buildPkMap(compounds, [makeIntake('caffeine')]);
    expect(params.get('caffeine')?.PO).toBeDefined();
    expect(defaulted).not.toContain('caffeine');
  });

  it('flags partial compounds as defaulted but still produces params', () => {
    const { params, defaulted } = buildPkMap(compounds, [makeIntake('partial')]);
    expect(params.get('partial')?.PO).toBeDefined();
    expect(defaulted).toContain('partial');
  });

  it('reports compounds with no PK as unmodelled, not merely defaulted', () => {
    const { params, unmodelled, defaulted } = buildPkMap(compounds, [makeIntake('no-pk')]);
    expect(params.has('no-pk')).toBe(false);
    expect(unmodelled).toContain('no-pk');
    // The two lists are disjoint: "no curve" and "curve at a guessed scale"
    // need different copy, which is why they were split.
    expect(defaulted).not.toContain('no-pk');
  });

  it('reports compounds not in the registry as unmodelled', () => {
    const { params, unmodelled } = buildPkMap(compounds, [makeIntake('unknown-slug')]);
    expect(params.size).toBe(0);
    expect(unmodelled).toContain('unknown-slug');
  });

  // Regression: `fullyAuthored` was `source_pmid != null`, so a compound whose
  // citation covers only its half-life passed the confidence test while V_L
  // and F silently came from resolvePk. That is retatrutide exactly — a 4.7
  // kDa peptide rendered at the 0.5 L/kg small-molecule default, ~4x low,
  // with nothing marking it. A PMID must no longer launder the scale.
  it('flags a sourced half-life with no V_L as defaulted, and still curves it', () => {
    const peptide = makeCompound({
      slug: 'retatrutide',
      name: 'Retatrutide',
      routes: ['SC'],
      half_life_hr: { SC: 144 },
      pk: { SC: { ka_hr: 0.02, source_pmid: 'PMID:36354040' } },
    });
    const { params, defaulted, unmodelled } = buildPkMap(
      [peptide],
      [makeIntake('retatrutide', 'SC')],
    );
    expect(params.get('retatrutide')?.SC).toBeDefined();
    expect(params.get('retatrutide')?.SC?.V_L).toBe(35); // resolvePk's 0.5 L/kg
    expect(defaulted).toContain('retatrutide');
    expect(unmodelled).not.toContain('retatrutide');
  });

  // The protein volume default is a BETTER default, not a measurement: the
  // record still authors no V_L, so the slug must keep its `defaulted` flag.
  // A default that silenced the flag would be the same bug in a nicer suit.
  it('applies the protein volume default through the glue, and still flags it', () => {
    const mab = makeCompound({
      slug: 'pembrolizumab',
      name: 'Pembrolizumab',
      routes: ['IV'],
      mw_g_mol: 148_000,
      half_life_hr: { IV: 600 },
      pk: { IV: { source_pmid: 'PMID:1' } },
    });
    const { params, defaulted } = buildPkMap([mab], [makeIntake('pembrolizumab', 'IV')]);
    expect(params.get('pembrolizumab')?.IV?.V_L).toBeCloseTo(5.6, 6);
    expect(defaulted).toContain('pembrolizumab');
  });

  it('leaves a mid-size peptide on the small-molecule default through the glue', () => {
    const peptide = makeCompound({
      slug: 'retatrutide',
      name: 'Retatrutide',
      routes: ['SC'],
      mw_g_mol: 4731.33,
      half_life_hr: { SC: 144 },
      pk: { SC: { ka_hr: 0.02, source_pmid: 'PMID:36354040' } },
    });
    const { params, defaulted } = buildPkMap([peptide], [makeIntake('retatrutide', 'SC')]);
    expect(params.get('retatrutide')?.SC?.V_L).toBe(35);
    expect(defaulted).toContain('retatrutide');
  });

  it('does not require F on an IV route, where the math ignores it', () => {
    const iv = makeCompound({
      slug: 'iv-only',
      name: 'IvOnly',
      routes: ['IV'],
      half_life_hr: { IV: 3 },
      pk: { IV: { V_L: 12, source_pmid: 'PMID:1' } },
    });
    const { defaulted } = buildPkMap([iv], [makeIntake('iv-only', 'IV')]);
    expect(defaulted).not.toContain('iv-only');
  });

  it('builds per-route entries for every distinct route used per compound', () => {
    // Compound with PO and SL authored.
    const melatonin = makeCompound({
      slug: 'melatonin',
      name: 'Melatonin',
      half_life_hr: { PO: 0.7, SL: 0.5 },
      pk: {
        PO: { ka_hr: 3, V_L: 35, F: 0.15, source_pmid: 'PMID:37438493' },
        SL: { ka_hr: 6, V_L: 35, F: 0.5, source_pmid: 'PMID:37438493' },
      },
    });
    const intakes = [makeIntake('melatonin', 'PO'), makeIntake('melatonin', 'SL')];
    const { params, defaulted } = buildPkMap([melatonin], intakes);
    expect(params.get('melatonin')?.PO?.F).toBe(0.15);
    expect(params.get('melatonin')?.SL?.F).toBe(0.5);
    expect(defaulted).not.toContain('melatonin');
  });

  it('drops a route lacking PK params but keeps the slug for routes that do', () => {
    // Caffeine has only PO authored. An IV intake gets no IV params,
    // and the slug lands in `defaulted` because not every used route was
    // anchored, but the PO entry is still populated.
    const intakes = [makeIntake('caffeine', 'PO'), makeIntake('caffeine', 'IV')];
    const { params, defaulted, unmodelled } = buildPkMap(compounds, intakes);
    expect(params.get('caffeine')?.PO).toBeDefined();
    expect(params.get('caffeine')?.IV).toBeUndefined();
    // Some curve exists, so it is `defaulted` (partial), not `unmodelled`.
    expect(defaulted).toContain('caffeine');
    expect(unmodelled).not.toContain('caffeine');
  });
});
