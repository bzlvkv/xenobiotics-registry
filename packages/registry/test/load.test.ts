/**
 * Loader tests over the real data.
 *
 * The three JSON files are the catalog; if one ever fails validation, every
 * consumer fails at load. This catches that drift in a gate rather than in a
 * browser.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadCompounds, loadPathways, loadReceptors, loadRegistry } from '../src/index';
import { DATA_DIR, readRegistry } from '../src/read';

const raw = (name: string): unknown =>
  JSON.parse(readFileSync(join(DATA_DIR, `${name}.json`), 'utf-8')) as unknown;

const compoundRecords = raw('compounds');
const pathwayRecords = raw('pathways');
const receptorDoc = raw('receptors');

describe('loadCompounds', () => {
  it('loads the real catalog', () => {
    expect(loadCompounds(compoundRecords).length).toBeGreaterThan(1000);
  });

  it('returns compounds sorted by name', () => {
    const names = loadCompounds(compoundRecords).map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('throws on duplicate slug', () => {
    const one = {
      slug: 'foo',
      name: 'Foo',
      category: 'other',
      mechanism: '.',
      routes: ['PO'],
      doses: { PO: { min: 1, max: 2, typical: 1, unit: 'mg' } },
    };
    expect(() => loadCompounds([one, { ...one, name: 'Foo Two' }])).toThrow(/duplicate slug/);
  });

  it('throws with field-level detail on bad input', () => {
    // The message must name the field, not just fail: a gate that says "invalid"
    // over a 1,244-record file is a gate nobody can act on.
    expect(() => loadCompounds([{ slug: 'INVALID-SLUG', name: 'Bad' }])).toThrow(
      /invalid compound/,
    );
    expect(() => loadCompounds([{ slug: 'INVALID-SLUG', name: 'Bad' }])).toThrow(/slug/);
  });

  it('rejects a non-array rather than treating it as empty', () => {
    expect(() => loadCompounds({ compounds: [] })).toThrow(/must be a JSON array/);
  });

  it('rejects a route key that is not a Route', () => {
    // An enum-keyed record REJECTS an unlisted key instead of dropping it, which
    // is the whole reason doses/pk are typed that way: "OP" for "PO" fails here
    // rather than producing a compound with no oral dose.
    expect(() =>
      loadCompounds([
        {
          slug: 'typo',
          name: 'Typo',
          category: 'other',
          mechanism: '.',
          routes: ['PO'],
          doses: { OP: { min: 1, max: 2, typical: 1, unit: 'mg' } },
        },
      ]),
    ).toThrow(/invalid compound/);
  });

  it('is strict inside pk_unauthored, composition and nutrition too', () => {
    const base = {
      slug: 'typo',
      name: 'Typo',
      category: 'other',
      mechanism: '.',
      routes: ['PO'],
      doses: { PO: { min: 1, max: 2, typical: 1, unit: 'mg' } },
      systems: ['nervous'],
      refs: [],
    };
    expect(() =>
      loadCompounds([{ ...base, pk_unauthored: { reason: 'mixture', nte: 'x' } }]),
    ).toThrow(/pk_unauthored: Unrecognized key\(s\) in object: 'nte'/);
    expect(() =>
      loadCompounds([{ ...base, nutrition: { rdi: 1, unit: 'mg', sourse_pmid: 'PMID:1' } }]),
    ).toThrow(/nutrition: Unrecognized key\(s\) in object: 'sourse_pmid'/);
    expect(() =>
      loadCompounds([
        {
          ...base,
          composition: {
            standardisation: '5%',
            constituents: [{ slug: 'x-y', mg_per_g_extract: 1 }],
          },
        },
      ]),
    ).toThrow(/composition: Unrecognized key\(s\) in object: 'standardisation'/);
  });

  it('shape-checks every citation, including refs[]', () => {
    const base = {
      slug: 'cite',
      name: 'Cite',
      category: 'other',
      mechanism: '.',
      routes: ['PO'],
      doses: { PO: { min: 1, max: 2, typical: 1, unit: 'mg' } },
      systems: ['nervous'],
    };
    // A bare number or a typo'd prefix was invisible to `pnpm verify`, which only
    // resolves ids it can parse, so it must fail here instead.
    expect(() => loadCompounds([{ ...base, refs: ['12345678'] }])).toThrow(/refs\.0/);
    expect(() => loadCompounds([{ ...base, refs: ['PMDI:12345678'] }])).toThrow(/refs\.0/);
    expect(() =>
      loadCompounds([
        { ...base, refs: [], nutrition: { rdi: 1, unit: 'mg', source_pmid: 'doi:x' } },
      ]),
    ).toThrow(/nutrition\.source_pmid/);
  });

  it('rejects a misspelled or undeclared key instead of stripping it', () => {
    // Under zod's default a typo like `sourse_pmid` was stripped and the gate
    // passed, leaving the PK block uncited in every consumer. Every schema object
    // is strict so the gate names the key instead.
    const base = {
      slug: 'typo',
      name: 'Typo',
      category: 'other',
      mechanism: '.',
      routes: ['PO'],
      doses: { PO: { min: 1, max: 2, typical: 1, unit: 'mg' } },
      systems: ['nervous'],
      refs: [],
    };
    expect(() =>
      loadCompounds([{ ...base, pk: { PO: { ka_hr: 1, sourse_pmid: 'PMID:1' } } }]),
    ).toThrow(/pk\.PO: Unrecognized key\(s\) in object: 'sourse_pmid'/);
    expect(() => loadCompounds([{ ...base, metabolites: [] }])).toThrow(
      /Unrecognized key\(s\) in object: 'metabolites'/,
    );
    expect(() =>
      loadPathways([
        {
          slug: 'p',
          name: 'P',
          category: 'signaling',
          systems: ['nervous'],
          description: '.',
          steps: [],
          refs: [],
          invented: true,
        },
      ]),
    ).toThrow(/Unrecognized key\(s\) in object: 'invented'/);
  });
});

describe('loadPathways', () => {
  it('loads the real catalog', () => {
    expect(loadPathways(pathwayRecords).length).toBeGreaterThan(100);
  });

  it('returns pathways sorted by name', () => {
    const names = loadPathways(pathwayRecords).map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('throws on duplicate pathway slug', () => {
    const one = {
      slug: 'foo_path',
      name: 'Foo',
      category: 'biosynthesis',
      systems: ['nervous'],
      description: 'x',
      steps: [{ from: 'a', to: 'b' }],
    };
    expect(() => loadPathways([one, { ...one, name: 'Foo Two' }])).toThrow(
      /duplicate pathway slug/,
    );
  });

  it('throws on an invalid pathway shape', () => {
    expect(() => loadPathways([{ slug: 'p1', name: 'P1' }])).toThrow(/invalid pathway/);
  });

  it('keeps the catecholamine step chain intact', () => {
    const p = loadPathways(pathwayRecords).find((x) => x.slug === 'catecholamine_synthesis');
    expect(p).toBeDefined();
    expect(p!.steps.length).toBeGreaterThanOrEqual(4);
    // 'l-tyrosine' was merged into 'tyrosine' in a 2026-09-06 duplicate-slug
    // retirement and the step was rewritten to the canonical slug.
    expect(p!.steps[0]!.from).toBe('tyrosine');
    expect(p!.steps[p!.steps.length - 1]!.to).toBe('epinephrine');
  });
});

describe('loadReceptors', () => {
  it('loads the real catalog with its provenance block', () => {
    const cat = loadReceptors(receptorDoc);
    expect(cat.receptors.length).toBeGreaterThan(300);
    expect(cat.nonGpcrTargets.length).toBeGreaterThan(0);
    // The meta block is the only record of WHICH GtoPdb release the nomenclature
    // came from, and nomenclature changes between releases.
    expect(cat.meta.version).toBeTruthy();
    expect(cat.meta.source).toMatch(/PHARMACOLOGY/i);
  });

  it('defaults nonGpcrTargets rather than leaving it undefined', () => {
    const cat = loadReceptors({
      meta: { source: 's', url: 'u', version: 'v', fetched: 'f' },
      receptors: [],
    });
    expect(cat.nonGpcrTargets).toEqual([]);
  });

  it('rejects a duplicated target key', () => {
    // A duplicate key would make an occupancy row resolve to whichever entry was
    // indexed last — one target wearing another's gene and family, undetectable
    // downstream.
    const entry = {
      key: 'cox_1',
      name: 'COX-1',
      family: 'Cyclooxygenase',
      gene: 'PTGS1',
      full_name: 'x',
      class: 'enzyme' as const,
      gtp_id: 1,
    };
    expect(() =>
      loadReceptors({
        meta: { source: 's', url: 'u', version: 'v', fetched: 'f' },
        receptors: [],
        nonGpcrTargets: [entry, { ...entry, name: 'COX-1 again' }],
      }),
    ).toThrow(/duplicate target key/);
  });
});

describe('loadRegistry / readRegistry', () => {
  it('loads all three documents together', () => {
    const reg = loadRegistry({
      compounds: compoundRecords,
      pathways: pathwayRecords,
      receptors: receptorDoc,
    });
    expect(reg.compounds.length).toBeGreaterThan(1000);
    expect(reg.pathways.length).toBeGreaterThan(100);
    expect(reg.receptors.receptors.length).toBeGreaterThan(300);
  });

  it('readRegistry resolves data/ relative to the package, not the cwd', () => {
    // The default must not depend on where the process was started; a cwd-relative
    // default works for everyone until someone runs a test from a subdirectory.
    expect(DATA_DIR.endsWith('/data')).toBe(true);
    expect(readRegistry().compounds.length).toBe(loadCompounds(compoundRecords).length);
  });
});
