/**
 * The gate, tested two ways.
 *
 * First and most important: ZERO ERRORS over the real registry. Errors are the
 * rules the project has decided must not ship, so that assertion is the publish
 * gate expressed as a test. Warnings are expected and several are standing caveats
 * that a correct audit makes MORE numerous, so the count is printed rather than
 * bounded — a test that capped it would be a test that punishes honesty.
 *
 * Second: each rule family is fired deliberately against a synthetic registry, so
 * a rule that silently stopped working is caught. A rule that fires nowhere in the
 * real data and has no unit test is indistinguishable from a rule that was deleted.
 */

import { describe, expect, it } from 'vitest';
import { OCCUPANCY_TARGET_KEYS, lintRegistry, targetKeyFor } from '../src/index';
import type { Compound, Pathway, ReceptorCatalog, Registry } from '../src/index';
import { readRegistry } from '../src/read';

// ─────────────────────────────────────────────────────────────────────────────
// The real thing
// ─────────────────────────────────────────────────────────────────────────────

describe('lintRegistry over the real registry', () => {
  const registry = readRegistry();
  const findings = lintRegistry(registry);
  const errors = findings.filter((f) => f.level === 'error');
  const warnings = findings.filter((f) => f.level === 'warning');

  it('reports ZERO errors', () => {
    const rendered = errors.map((e) => `${e.entity} ${e.rule}: ${e.message}`);
    expect(rendered).toEqual([]);
  });

  it('reports warnings, and says how many', () => {
    const byRule = new Map<string, number>();
    for (const w of warnings) byRule.set(w.rule, (byRule.get(w.rule) ?? 0) + 1);
    const summary = [...byRule]
      .sort((a, b) => b[1] - a[1])
      .map(([rule, n]) => `${n} ${rule}`)
      .join(', ');
    console.log(`lintRegistry: 0 errors, ${warnings.length} warnings — ${summary}`);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('is stable across runs, so two reports diff cleanly', () => {
    expect(lintRegistry(registry)).toEqual(findings);
  });

  it('does not carry the two rule families that were deliberately dropped (five ids)', () => {
    // `compound.schema` re-parsed through zod from inside the linter, which pinned
    // zod into every consumer including the browser; the loader runs first now.
    // The `nutrient-group.*` family checked a table that described an application's
    // daily-intake card and is deleted.
    const rules = new Set(findings.map((f) => f.rule));
    expect(rules.has('compound.schema')).toBe(false);
    expect([...rules].filter((r) => r.startsWith('nutrient-group.'))).toEqual([]);
  });

  it('keys catalog-wide findings on (catalog), not on a slug', () => {
    // The field is `entity` rather than `slug` precisely because of these: a field
    // named `slug` invited a consumer to look it up and get undefined.
    const catalogLevel = findings.filter((f) => f.entity === '(catalog)');
    expect(catalogLevel.length).toBeGreaterThan(0);
    expect(catalogLevel.every((f) => f.level === 'warning')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic triggers
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_CATALOG: ReceptorCatalog = {
  meta: { source: 'test', url: 'test', version: '0', fetched: '0' },
  receptors: [],
  nonGpcrTargets: [],
};

function compound(partial: Partial<Compound> & { slug: string; name: string }): Compound {
  return {
    aliases: [],
    category: 'other',
    mechanism: '.',
    systems: ['nervous'],
    routes: ['PO'],
    doses: { PO: { min: 1, max: 100, typical: 10, unit: 'mg' } },
    half_life_hr: { PO: 4 },
    refs: [],
    ...partial,
  };
}

function pathway(partial: Partial<Pathway> & { slug: string; name: string }): Pathway {
  return {
    category: 'signaling',
    systems: ['nervous'],
    description: 'x',
    steps: [{ from: 'a', to: 'b' }],
    refs: [],
    ...partial,
  };
}

function lint(
  compounds: Compound[],
  pathways: Pathway[] = [],
  receptors: ReceptorCatalog = EMPTY_CATALOG,
): ReturnType<typeof lintRegistry> {
  const registry: Registry = { compounds, pathways, receptors };
  return lintRegistry(registry);
}

const rules = (findings: ReturnType<typeof lintRegistry>): string[] => findings.map((f) => f.rule);

describe('compound identity and retirement rules', () => {
  it('slug.unique fires on a duplicated slug', () => {
    const c = compound({ slug: 'a', name: 'A' });
    expect(rules(lint([c, { ...c, name: 'A2' }]))).toContain('slug.unique');
  });

  it('compound.retired-self fires when a compound retires its own slug', () => {
    expect(rules(lint([compound({ slug: 'a', name: 'A', retired_slugs: ['a'] })]))).toContain(
      'compound.retired-self',
    );
  });

  it('compound.retired-collision fires on a tombstone over a live slug', () => {
    const findings = lint([
      compound({ slug: 'a', name: 'A', retired_slugs: ['b'] }),
      compound({ slug: 'b', name: 'B' }),
    ]);
    expect(rules(findings)).toContain('compound.retired-collision');
  });

  it('compound.retired-collision fires when two compounds claim one tombstone', () => {
    const findings = lint([
      compound({ slug: 'a', name: 'A', retired_slugs: ['old'] }),
      compound({ slug: 'b', name: 'B', retired_slugs: ['old'] }),
    ]);
    expect(rules(findings)).toContain('compound.retired-collision');
  });

  it('compound.identity-collision fires when an alias is another canonical name', () => {
    const findings = lint([
      compound({ slug: 'ethanol', name: 'Ethanol' }),
      compound({ slug: 'alcohol', name: 'Alcohol', aliases: ['Ethanol'] }),
    ]);
    expect(rules(findings)).toContain('compound.identity-collision');
  });

  it('identity comparison TRANSLITERATES greek rather than stripping it', () => {
    // α- and β-tocopherol are different vitamers; deleting the glyph would report
    // them as one molecule.
    const findings = lint([
      compound({ slug: 'alpha-tocopherol', name: 'α-Tocopherol' }),
      compound({ slug: 'beta-tocopherol', name: 'β-Tocopherol' }),
    ]);
    expect(rules(findings)).not.toContain('compound.identity-collision');
  });

  it('pk.shared-source-conflict fires when two names for one molecule cite one paper differently', () => {
    const findings = lint([
      compound({
        slug: 'ethanol',
        name: 'Ethanol',
        pk: { PO: { F: 0.8, source_pmid: 'PMID:1' } },
      }),
      compound({
        slug: 'alcohol',
        name: 'Alcohol',
        aliases: ['Ethanol'],
        pk: { PO: { F: 0.5, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).toContain('pk.shared-source-conflict');
  });
});

describe('pk rules', () => {
  it('pk.route-listed fires on a pk route absent from routes[]', () => {
    const findings = lint([
      compound({
        slug: 'a',
        name: 'A',
        routes: ['PO'],
        pk: { IV: { F: 1 } },
        half_life_hr: { IV: 2 },
      }),
    ]);
    expect(rules(findings)).toContain('pk.route-listed');
  });

  it('pk.elimination fires when nothing yields a decay', () => {
    const findings = lint([
      compound({ slug: 'a', name: 'A', pk: { PO: { F: 0.5 } }, half_life_hr: {} }),
    ]);
    expect(rules(findings)).toContain('pk.elimination');
  });

  it('pk.pmid fires on a parameterized route with no provenance at all', () => {
    const findings = lint([compound({ slug: 'a', name: 'A', pk: { PO: { F: 0.5 } } })]);
    expect(rules(findings)).toContain('pk.pmid');
  });

  it('pk.pmid accepts a regulatory label as a primary source', () => {
    // For many modern agents the label is the only public document stating Cmax,
    // t-half and F together; refusing it would push authors to omit provenance.
    const findings = lint([
      compound({ slug: 'a', name: 'A', pk: { PO: { F: 0.5, source_label: 'FDA label: X' } } }),
    ]);
    expect(rules(findings)).not.toContain('pk.pmid');
  });

  it('pk.salt-disposition-drift fires when a salt claims its own volume', () => {
    const findings = lint([
      compound({
        slug: 'magnesium',
        name: 'Magnesium',
        pk: { PO: { V_L: 14, source_pmid: 'PMID:1' } },
      }),
      compound({
        slug: 'magnesium-glycinate',
        name: 'Magnesium glycinate',
        pk: { PO: { V_L: 1050, source_pmid: 'PMID:2' } },
      }),
    ]);
    expect(rules(findings)).toContain('pk.salt-disposition-drift');
  });

  it('pk.defaulted-ka-slow fires on a long half-life with no absorption rate', () => {
    const findings = lint([
      compound({
        slug: 'a',
        name: 'A',
        routes: ['SC'],
        doses: { SC: { min: 1, max: 2, typical: 1, unit: 'mg' } },
        half_life_hr: { SC: 744 },
        pk: { SC: { F: 0.8, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).toContain('pk.defaulted-ka-slow');
  });

  it('pk.defaulted-ka-slow acquits the four rows whose published Tmax contains the default', () => {
    // A warning that cannot be resolved by doing the right thing is one authors
    // learn to ignore, so these are listed out rather than left to fire forever.
    const findings = lint([
      compound({
        slug: 'brexpiprazole',
        name: 'Brexpiprazole',
        half_life_hr: { PO: 91 },
        pk: { PO: { F: 0.95, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).not.toContain('pk.defaulted-ka-slow');
  });

  it('pk.unsolvable-default-route fires when routes[0] yields no curve', () => {
    const findings = lint([
      compound({
        slug: 'a',
        name: 'A',
        routes: ['PO', 'IV'],
        doses: {
          PO: { min: 1, max: 2, typical: 1, unit: 'mg' },
          IV: { min: 1, max: 2, typical: 1, unit: 'mg' },
        },
        half_life_hr: { IV: 2 },
        pk: { IV: { F: 1, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).toContain('pk.unsolvable-default-route');
    expect(rules(findings)).toContain('pk.unsolvable-route');
  });

  it('pk.prodrug-analyte-unstated fires on prose that says it converts', () => {
    const findings = lint([
      compound({
        slug: 'a',
        name: 'A',
        notes: 'A prodrug that is rapidly hydrolysed to the active species.',
        pk: { PO: { F: 0.5, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).toContain('pk.prodrug-analyte-unstated');
  });

  it('pk.prodrug-analyte-unstated does NOT fire on prose that denies it', () => {
    // valsartan's note says outright "no active metabolite (unlike losartan)" and
    // was flagged for exactly that sentence.
    const findings = lint([
      compound({
        slug: 'valsartan',
        name: 'Valsartan',
        notes: 'Has no active metabolite (unlike losartan), which is metabolized to EXP3174.',
        pk: { PO: { F: 0.25, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).not.toContain('pk.prodrug-analyte-unstated');
  });

  it('dose.moiety-note fires on a bare stoichiometric constant', () => {
    const findings = lint([
      compound({
        slug: 'a',
        name: 'A',
        dose_moiety_fraction: 0.188,
        pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).toContain('dose.moiety-note');
  });

  it('dose.salt-moiety-unset fires when prose says the dose is a salt', () => {
    const findings = lint([
      compound({
        slug: 'lithium',
        name: 'Lithium',
        notes: 'The dose is the carbonate salt while pk describes the ion.',
        pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      }),
    ]);
    expect(rules(findings)).toContain('dose.salt-moiety-unset');
  });
});

describe('interaction rules', () => {
  const victim = compound({
    slug: 'victim',
    name: 'Victim',
    pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
  });

  it('interactions.kinetics-pmid and ki-needs-mw fire together on an unsourced Ki', () => {
    const perp = compound({
      slug: 'perp',
      name: 'Perp',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      interactions: [
        { slug: 'victim', name: 'Victim', level: 'warn', note: 'n', kinetics: { ki_uM: 3 } },
      ],
    });
    const found = rules(lint([perp, victim]));
    expect(found).toContain('interactions.kinetics-pmid');
    expect(found).toContain('interactions.ki-needs-mw');
  });

  it('interactions.ki-calibration-incomplete fires on a calibration with no arithmetic', () => {
    const perp = compound({
      slug: 'perp',
      name: 'Perp',
      mw_g_mol: 300,
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      interactions: [
        {
          slug: 'victim',
          name: 'Victim',
          level: 'warn',
          note: 'n',
          source_pmid: 'PMID:2',
          kinetics: { ki_uM: 1, ki_basis: 'calibrated_from_auc' },
        },
      ],
    });
    expect(rules(lint([perp, victim]))).toContain('interactions.ki-calibration-incomplete');
  });

  it('interactions.ki-calibration-mismatch fires when the three numbers disagree', () => {
    const perp = compound({
      slug: 'perp',
      name: 'Perp',
      mw_g_mol: 300,
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      interactions: [
        {
          slug: 'victim',
          name: 'Victim',
          level: 'warn',
          note: 'n',
          source_pmid: 'PMID:2',
          kinetics: {
            ki_uM: 9,
            ki_basis: 'calibrated_from_auc',
            auc_ratio: 2.5,
            assumed_perp_uM: 0.5,
          },
        },
      ],
    });
    expect(rules(lint([perp, victim]))).toContain('interactions.ki-calibration-mismatch');
  });

  it('a self-consistent calibration passes', () => {
    // ki_uM = assumed_perp_uM / (auc_ratio − 1) = 0.5 / 1.5
    const perp = compound({
      slug: 'perp',
      name: 'Perp',
      mw_g_mol: 300,
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      interactions: [
        {
          slug: 'victim',
          name: 'Victim',
          level: 'warn',
          note: 'n',
          source_pmid: 'PMID:2',
          kinetics: {
            ki_uM: 0.5 / 1.5,
            ki_basis: 'calibrated_from_auc',
            auc_ratio: 2.5,
            assumed_perp_uM: 0.5,
          },
        },
      ],
    });
    const found = rules(lint([perp, victim]));
    expect(found).not.toContain('interactions.ki-calibration-mismatch');
    expect(found).not.toContain('interactions.ki-calibration-incomplete');
  });

  it('interactions.ki-basis-unstated fires on calibration inputs without the basis', () => {
    const perp = compound({
      slug: 'perp',
      name: 'Perp',
      mw_g_mol: 300,
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      interactions: [
        {
          slug: 'victim',
          name: 'Victim',
          level: 'warn',
          note: 'n',
          source_pmid: 'PMID:2',
          kinetics: { ki_uM: 1, auc_ratio: 2 },
        },
      ],
    });
    expect(rules(lint([perp, victim]))).toContain('interactions.ki-basis-unstated');
  });

  it('interactions.target-exists fires on a kinetic edge to an unknown slug', () => {
    const perp = compound({
      slug: 'perp',
      name: 'Perp',
      mw_g_mol: 300,
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      interactions: [
        {
          slug: 'nobody',
          name: 'Nobody',
          level: 'warn',
          note: 'n',
          source_pmid: 'PMID:2',
          kinetics: { induction_factor: 1.4 },
        },
      ],
    });
    expect(rules(lint([perp]))).toContain('interactions.target-exists');
  });

  it('interactions.inert-kinetics reports an edge whose victim has no curve', () => {
    const inertVictim = compound({ slug: 'victim', name: 'Victim', half_life_hr: {} });
    const perp = compound({
      slug: 'perp',
      name: 'Perp',
      mw_g_mol: 300,
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      interactions: [
        {
          slug: 'victim',
          name: 'Victim',
          level: 'warn',
          note: 'n',
          source_pmid: 'PMID:2',
          kinetics: { induction_factor: 1.4 },
        },
      ],
    });
    expect(rules(lint([perp, inertVictim]))).toContain('interactions.inert-kinetics');
  });
});

describe('receptor and effect-compartment rules', () => {
  const site = {
    receptor: '5-HT2A',
    emax: 1,
    ec50_mg_l: 0.01,
    hill_n: 1,
    source_pmid: 'PMID:1',
  };
  const catalog: ReceptorCatalog = {
    ...EMPTY_CATALOG,
    receptors: [
      {
        key: 'HTR2A',
        name: '5-HT2A receptor',
        family: '5-Hydroxytryptamine receptors',
        gene: 'HTR2A',
        full_name: 'x',
        gtp_id: 6,
      },
    ],
  };

  it('receptor.needs-keo fires on occupancy with no keo', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      receptor_occupancy: [site],
      fu_note: 'examined',
    });
    expect(rules(lint([c], [], catalog))).toContain('receptor.needs-keo');
  });

  it('receptor.alias fires on a non-canonical key', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [{ ...site, receptor: 'MOR' }],
      fu_note: 'examined',
    });
    expect(rules(lint([c], [], catalog))).toContain('receptor.alias');
  });

  it('receptor.duplicate fires when two rows canonicalize to one receptor', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [
        { ...site, receptor: 'mu_opioid' },
        { ...site, receptor: 'MOR' },
      ],
      fu_note: 'examined',
    });
    expect(rules(lint([c], [], catalog))).toContain('receptor.duplicate');
  });

  // ── provenance of the affinity itself ───────────────────────────────────
  // Both rules read the note's prose, so each gets its false-positive guard
  // tested beside it: every shape below is taken from a real row, and the two
  // "does NOT fire" cases are rows that were already re-authored correctly.

  const occ = (note: string) => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [{ ...site, note }],
      fu_note: 'examined',
    });
    return rules(lint([c], [], catalog));
  };

  it('receptor.derived-value fires on a midpoint of a published range', () => {
    expect(
      occ(
        'Per IUPHAR/GtoPdb (human D2, pKi range 5.8–6.9 across 5 refs → midpoint 6.35, Ki 447 nM).',
      ),
    ).toContain('receptor.derived-value');
  });

  it('receptor.derived-value fires on a cross-paper geometric mean', () => {
    expect(
      occ('Per IUPHAR/GtoPdb (human 5-HT2A, pKi 8.8–9.5 range → geometric-mean Ki 0.69 nM).'),
    ).toContain('receptor.derived-value');
  });

  it('receptor.derived-value does NOT fire on a note describing the midpoint it replaced', () => {
    expect(
      occ(
        'Verbatim: "pKi values ... beta1-AR (8.4)". The previous value was 4.5 nM, the MIDPOINT of a stated "approximately 4-5 nM".',
      ),
    ).not.toContain('receptor.derived-value');
  });

  it("receptor.derived-value does NOT fire on an average that is the PAPER's own", () => {
    expect(
      occ(
        'Abstract verbatim "quinidine suppressed INa with an average IC50 of 1.4 +/- 0.3 microM".',
      ),
    ).not.toContain('receptor.derived-value');
  });

  it("receptor.derived-value does NOT fire when the mean is inside the SOURCE's own quote", () => {
    // sildenafil's PDE5 note. The averaging is the paper's, over its own
    // replicates, and 3.5 nM is the single verbatim value the rules ask for.
    // The elision puts a full stop inside the quotation, so the guard has to
    // strip quotes before splitting the note into clauses.
    expect(
      occ(
        'Ballard 1998 verbatim: "sildenafil ... inhibiting PDE5 from HCC with a geometric mean IC50 of 3.5 nM". Human corpus cavernosum PDE5.',
      ),
    ).not.toContain('receptor.derived-value');
  });

  it('receptor.secondary-source fires when the database supplied the constant', () => {
    expect(
      occ('GtoPdb-curated human H1 binding: pKi 9.8 (Ki 0.16 nM), antagonist, ref PMID:8935801.'),
    ).toContain('receptor.secondary-source');
  });

  it('receptor.secondary-source does NOT fire when the database is cited for the mode of action', () => {
    expect(
      occ(
        'In-model primary target 5-HT2A (full agonist per GtoPdb); subject-primary Wacker 2017, Kd 0.33 nM at human 5-HT2A.',
      ),
    ).not.toContain('receptor.secondary-source');
  });

  it('receptor.secondary-source does NOT fire when the database is named only as corroboration', () => {
    expect(
      occ(
        "Cox 2010 full-text binding table: human OX1R Ki = 0.55 nM. Corroborated by GtoPdb's OX1 pKi range 8.7-9.3.",
      ),
    ).not.toContain('receptor.secondary-source');
  });

  it('a derived GtoPdb midpoint reports the specific rule only, not both', () => {
    const fired = occ(
      'Per IUPHAR/GtoPdb (human 5-HT2A, pKi range 6.4–7.0 → midpoint 6.7, Ki 200 nM).',
    );
    expect(fired).toContain('receptor.derived-value');
    expect(fired).not.toContain('receptor.secondary-source');
  });

  it('receptor.pmid / emax-range / ec50-positive / hill-positive all fire', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [{ receptor: 'HTR2A', emax: 2, ec50_mg_l: -1, hill_n: 0 }],
      fu_note: 'examined',
    });
    const found = rules(lint([c], [], catalog));
    expect(found).toContain('receptor.pmid');
    expect(found).toContain('receptor.emax-range');
    expect(found).toContain('receptor.ec50-positive');
    expect(found).toContain('receptor.hill-positive');
  });

  it('receptor.pmid accepts a regulatory label in place of a PMID', () => {
    // GEODON section 12.2 states ziprasidone's 5-HT2A, 5-HT2C and H1 affinities
    // verbatim and no fetchable paper does. A label is primary provenance here
    // exactly as it is on a pk route.
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [
        {
          receptor: '5-HT2A',
          emax: 1,
          ec50_mg_l: 0.1,
          hill_n: 1,
          source_label: 'GEODON (ziprasidone HCl), DailyMed set id 8326928a, SPL v50, 2026-09-18',
        },
      ],
      fu_note: 'examined',
    });
    expect(rules(lint([c], [], catalog))).not.toContain('receptor.pmid');
  });

  it('receptor.unknown-target fires on a key the catalog does not describe', () => {
    // The NEW rule. It was impossible while the linter was handed compounds and
    // pathways only and never saw the target catalog.
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [{ ...site, receptor: 'not_a_catalogued_target' }],
      fu_note: 'examined',
    });
    const findings = lint([c], [], catalog);
    const finding = findings.find((f) => f.rule === 'receptor.unknown-target');
    expect(finding).toBeDefined();
    expect(finding!.level).toBe('warning');
    expect(finding!.entity).toBe('(catalog)');
    expect(finding!.message).toContain('not_a_catalogued_target');
  });

  it('receptor.unknown-target resolves aliases and shorthand to the catalog key', () => {
    // The real shape: the GPCR is catalogued under its gene symbol, the row uses
    // an alias of the shorthand. MOR -> mu_opioid -> OPRM1 must count as known.
    const gpcrOnly: ReceptorCatalog = {
      ...EMPTY_CATALOG,
      receptors: [
        {
          key: 'OPRM1',
          name: 'μ receptor',
          family: 'Opioid receptors',
          gene: 'OPRM1',
          full_name: 'opioid receptor mu 1',
          gtp_id: 319,
        },
      ],
    };
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [{ ...site, receptor: 'MOR' }],
      fu_note: 'examined',
    });
    expect(rules(lint([c], [], gpcrOnly))).not.toContain('receptor.unknown-target');
  });

  it('receptor.unknown-target still reports a class-level key with no single target', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [{ ...site, receptor: 'muscarinic' }],
      fu_note: 'examined',
    });
    expect(rules(lint([c], [], EMPTY_CATALOG))).toContain('receptor.unknown-target');
  });

  it('every OCCUPANCY_TARGET_KEYS value exists in the real catalog', () => {
    // A bridge entry pointing at a key the catalog lacks would silently resolve a
    // row to nothing, which is the failure the bridge exists to remove.
    const { receptors } = readRegistry();
    const keys = new Set(receptors.receptors.map((r) => r.key));
    for (const [from, to] of Object.entries(OCCUPANCY_TARGET_KEYS)) {
      expect(keys.has(to), `${from} -> ${to}`).toBe(true);
    }
  });

  it('effect.approx-conflict fires when a value is both fitted and estimated', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1', approximated: true },
    });
    expect(rules(lint([c]))).toContain('effect.approx-conflict');
  });

  it('effect.pmid fires on a bare keo, and effect.approx-note on an unexplained estimate', () => {
    expect(
      rules(lint([compound({ slug: 'a', name: 'A', effect_compartment: { keo_per_h: 1 } })])),
    ).toContain('effect.pmid');
    expect(
      rules(
        lint([
          compound({
            slug: 'a',
            name: 'A',
            effect_compartment: { keo_per_h: 1, approximated: true },
          }),
        ]),
      ),
    ).toContain('effect.approx-note');
  });

  it('effect.approx-in-note fires on a cited keo whose note admits it is an estimate', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      effect_compartment: {
        keo_per_h: 1,
        source_pmid: 'PMID:1',
        note: 'Approximation; no published keo for this class.',
      },
    });
    expect(rules(lint([c]))).toContain('effect.approx-in-note');
  });

  it('effect.approx-in-note does NOT fire on a note describing the estimate it replaced', () => {
    // This catalog's prose is largely a record of decisions, so a rule that reads
    // prose has to separate a decision's subject from its outcome.
    const c = compound({
      slug: 'a',
      name: 'A',
      effect_compartment: {
        keo_per_h: 1,
        source_pmid: 'PMID:1',
        note: 'Replaces a prior approximation computed from a narrative review.',
      },
    });
    expect(rules(lint([c]))).not.toContain('effect.approx-in-note');
  });

  it('effect.species-in-note fires on an undeclared animal source', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      effect_compartment: {
        keo_per_h: 1,
        source_pmid: 'PMID:1',
        note: 'antinociception (rat tail-flick)',
      },
    });
    expect(rules(lint([c]))).toContain('effect.species-in-note');
  });

  it('effect.species-in-note does NOT fire once source_species says so', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      effect_compartment: {
        keo_per_h: 1,
        source_pmid: 'PMID:1',
        source_species: 'rat',
        note: 'antinociception (rat tail-flick)',
      },
    });
    expect(rules(lint([c]))).not.toContain('effect.species-in-note');
  });

  it('pd.needs-solvable-pk fires when no route yields an elimination rate', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      half_life_hr: {},
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
    });
    expect(rules(lint([c]))).toContain('pd.needs-solvable-pk');
  });

  it('pd.occupancy-needs-fu fires on an in-vitro Ki with no free fraction', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [site],
    });
    expect(rules(lint([c], [], catalog))).toContain('pd.occupancy-needs-fu');
  });

  it('pd.occupancy-needs-fu treats an fu_note with no value as an answered question', () => {
    // Before this state existed the rule kept re-reporting settled questions, where
    // binding is concentration-dependent across the therapeutic range and a scalar
    // was deliberately not authored.
    const c = compound({
      slug: 'a',
      name: 'A',
      fu_note: 'Binding is concentration-dependent across the therapeutic range.',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [site],
    });
    expect(rules(lint([c], [], catalog))).not.toContain('pd.occupancy-needs-fu');
  });

  it('pd.occupancy-needs-fu exempts biologics and whole-blood assays', () => {
    const igg = compound({
      slug: 'a',
      name: 'A',
      category: 'biologic',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [site],
    });
    expect(rules(lint([igg], [], catalog))).not.toContain('pd.occupancy-needs-fu');

    const wholeBlood = compound({
      slug: 'b',
      name: 'B',
      pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [{ ...site, basis: 'whole_blood_ic50' }],
    });
    expect(rules(lint([wholeBlood], [], catalog))).not.toContain('pd.occupancy-needs-fu');
  });
});

describe('rules added in the redesign', () => {
  const authored = { PO: { F: 1, V_L: 10, source_pmid: 'PMID:1' } };
  const explained = { reason: 'research-only' as const, note: 'no human PK' };

  it('compound.unvisited fires on a record with neither pk nor pk_unauthored', () => {
    expect(rules(lint([compound({ slug: 'a', name: 'A' })]))).toContain('compound.unvisited');
    expect(rules(lint([compound({ slug: 'a', name: 'A', pk: authored })]))).not.toContain(
      'compound.unvisited',
    );
    expect(
      rules(lint([compound({ slug: 'a', name: 'A', pk_unauthored: explained })])),
    ).not.toContain('compound.unvisited');
  });

  it('compound.pk-and-unauthored fires when a record claims both', () => {
    const c = compound({ slug: 'a', name: 'A', pk: authored, pk_unauthored: explained });
    expect(rules(lint([c]))).toContain('compound.pk-and-unauthored');
  });

  it('compound.retired-alias-clash fires when a slug lookup and a name search disagree', () => {
    const a = compound({
      slug: 'a-long',
      name: 'A Long',
      pk_unauthored: explained,
      retired_slugs: ['ab'],
    });
    const b = compound({
      slug: 'b-long',
      name: 'B Long',
      pk_unauthored: explained,
      aliases: ['AB'],
    });
    expect(rules(lint([a, b]))).toContain('compound.retired-alias-clash');
    // The same record owning both is fine: nothing disagrees.
    const same = compound({
      slug: 'c-long',
      name: 'C Long',
      pk_unauthored: explained,
      retired_slugs: ['cd'],
      aliases: ['CD'],
    });
    expect(rules(lint([same]))).not.toContain('compound.retired-alias-clash');
  });

  it('pk.iv-f refuses an intravenous F other than 1', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      routes: ['IV'],
      doses: { IV: { min: 1, max: 1, typical: 1, unit: 'mg' } },
      half_life_hr: { IV: 4 },
      pk: { IV: { F: 0.5, V_L: 10, source_pmid: 'PMID:1' } },
    });
    expect(rules(lint([c]))).toContain('pk.iv-f');
    const ok = { ...c, pk: { IV: { F: 1, V_L: 10, source_pmid: 'PMID:1' } } };
    expect(rules(lint([ok]))).not.toContain('pk.iv-f');
  });

  it('receptor.gene-key refuses a catalog gene key on an occupancy row', () => {
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: authored,
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [
        { receptor: 'HTR2A', emax: 1, ec50_mg_l: 0.01, hill_n: 1, source_pmid: 'PMID:1' },
      ],
      fu_note: 'examined',
    });
    const found = lint([c]).find((f) => f.rule === 'receptor.gene-key');
    expect(found?.message).toMatch(/"5-HT2A"/);
  });

  it('receptor.duplicate treats a shorthand key and its alias as one target', () => {
    const row = { emax: 1, ec50_mg_l: 0.01, hill_n: 1, source_pmid: 'PMID:1' };
    const c = compound({
      slug: 'a',
      name: 'A',
      pk: authored,
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
      receptor_occupancy: [
        { receptor: 'mu_opioid', ...row },
        { receptor: 'MOR', ...row },
      ],
      fu_note: 'examined',
    });
    expect(rules(lint([c]))).toContain('receptor.duplicate');
  });
});

describe('systems rules', () => {
  it('systems.tagged is an ERROR, not a warning', () => {
    const findings = lint([compound({ slug: 'a', name: 'A', systems: [] })]);
    const finding = findings.find((f) => f.rule === 'systems.tagged');
    expect(finding?.level).toBe('error');
  });

  it('systems.unique fires on a duplicated tag', () => {
    const findings = lint([compound({ slug: 'a', name: 'A', systems: ['nervous', 'nervous'] })]);
    expect(rules(findings)).toContain('systems.unique');
  });

  it('systems.valid fires on a tag outside the ten systems', () => {
    // Defence in depth: the loader's enum already rejects this, but these rules also
    // run against records that have not been through the loader.
    const c = compound({ slug: 'a', name: 'A' });
    const bad = { ...c, systems: ['metabolic'] } as unknown as Compound;
    expect(rules(lint([bad]))).toContain('systems.valid');
  });
});

describe('pathway rules', () => {
  // Fully authored so the compound half of the linter contributes nothing, leaving
  // each assertion below about the pathway rules alone.
  const known = compound({
    slug: 'real',
    name: 'Real',
    pk: { PO: { F: 1, source_pmid: 'PMID:1' } },
  });

  it('pathway.slug-unique fires on a duplicated pathway slug', () => {
    const p = pathway({ slug: 'p', name: 'P' });
    expect(rules(lint([known], [p, { ...p, name: 'P2' }]))).toContain('pathway.slug-unique');
  });

  it('step slug claims must resolve', () => {
    const p = pathway({
      slug: 'p',
      name: 'P',
      steps: [{ from: 'x', to: 'y', from_slug: 'nope', to_slug: 'nope2', via_slug: 'nope3' }],
    });
    const found = rules(lint([known], [p]));
    expect(found).toContain('pathway.step-from-slug');
    expect(found).toContain('pathway.step-to-slug');
    expect(found).toContain('pathway.via-slug');
  });

  it('free-text endpoints are NOT checked', () => {
    // The old warning fired 1,613 times on endpoints that are processes and states,
    // and was unactionable by construction.
    const p = pathway({
      slug: 'p',
      name: 'P',
      steps: [{ from: 'cortical pyramidal glutamate release', to: '5-HT2A -> Gq -> PLC' }],
    });
    expect(rules(lint([known], [p])).filter((r) => r.startsWith('pathway.'))).toEqual([]);
  });

  it('pathway.modulator-slug and modulator-step fire on bad references', () => {
    const p = pathway({
      slug: 'p',
      name: 'P',
      steps: [{ from: 'a', to: 'b' }],
      modulators: [
        { slug: 'nobody', effect: 'inhibitor' },
        { slug: 'real', effect: 'inhibitor', step: 7 },
      ],
    });
    const found = rules(lint([known], [p]));
    expect(found).toContain('pathway.modulator-slug');
    expect(found).toContain('pathway.modulator-step');
  });

  it('length limits are errors, because exceeding one makes the loader throw', () => {
    const p = pathway({
      slug: 'p',
      name: 'P',
      steps: [{ from: 'x'.repeat(81), to: 'y', via: 'v'.repeat(121), note: 'n'.repeat(501) }],
      modulators: [
        { slug: 'real', effect: 'inhibitor', target: 't'.repeat(121), note: 'n'.repeat(501) },
      ],
    });
    const findings = lint([known], [p]).filter((f) => f.rule.endsWith('-len'));
    expect(findings.filter((f) => f.rule === 'pathway.step-len').length).toBe(3);
    expect(findings.filter((f) => f.rule === 'pathway.modulator-len').length).toBe(2);
    expect(findings.every((f) => f.level === 'error')).toBe(true);
  });

  it('diagram references and coordinates are checked against the node set', () => {
    const p = pathway({
      slug: 'p',
      name: 'P',
      diagram: {
        nodes: [
          { id: 'a', label: 'A', kind: 'input' },
          { id: 'a', label: 'A again', kind: 'hub' },
          { id: 'off', label: 'Off', kind: 'hub', x: 9000, y: -9000 },
        ],
        edges: [{ from: 'a', to: 'ghost' }],
        chips: [{ id: 'c', target: 'ghost2', side: 'left', label: 'C', kind: 'enzyme' }],
        feedback: { from: 'ghost3', to: 'a', label: 'f' },
      },
    });
    const found = rules(lint([known], [p]));
    expect(found).toContain('pathway.diagram-node-dup');
    expect(found).toContain('pathway.diagram-coord');
    expect(found.filter((r) => r === 'pathway.diagram-ref').length).toBe(3);
  });
});

describe('pk.label-revision', () => {
  it('fires on a label citation that names no set id and no date', () => {
    const findings = lintRegistry(readRegistry());
    const hit = findings.filter((f) => f.rule === 'pk.label-revision');
    expect(hit.length).toBeGreaterThan(0);
    // Every one must name the route whose label citation is unpinned.
    for (const f of hit) expect(f.message).toMatch(/^pk\.[A-Z]+ cites a label/);
  });

  it('does not fire on the rows that do name a DailyMed set id', () => {
    const findings = lintRegistry(readRegistry()).filter((f) => f.rule === 'pk.label-revision');
    const named = new Set(findings.map((f) => f.entity));
    // These three carry `set id <uuid>` in their source_label.
    for (const slug of ['somapacitan', 'macimorelin', 'prucalopride']) {
      expect(named.has(slug), `${slug} should be pinned`).toBe(false);
    }
  });
});

describe('muscarinic subtype keys bridge to the catalogued CHRM genes', () => {
  it('maps m1 and m3, which receptors.json already carries from GtoPdb', () => {
    expect(targetKeyFor('m1')).toBe('CHRM1');
    expect(targetKeyFor('m3')).toBe('CHRM3');
  });

  it('still leaves the class keys unmapped, because a native tissue is a mixture', () => {
    // doxazosin and prazosin were measured in native human prostate, tolterodine
    // in native human bladder: a Ki from a mixture belongs to no single subtype.
    expect(targetKeyFor('muscarinic')).toBe('muscarinic');
    expect(targetKeyFor('alpha_1')).toBe('alpha_1');
  });
});
