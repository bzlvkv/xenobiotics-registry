/**
 * Loader + query tests over the bundled compound dataset.
 *
 * The bundled JSON is the canonical seed; if it ever fails validation, the
 * app boot would explode loud — this test catches that drift in CI before
 * it hits a user.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadRegistry, loadPathways, bySlug, search, byCategory, resolveLabelName } from '../src';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compoundsPath = join(__dirname, '..', 'data', 'compounds.json');
const pathwaysPath = join(__dirname, '..', 'data', 'pathways.json');
const records = JSON.parse(readFileSync(compoundsPath, 'utf-8')) as unknown[];
const pathwayRecords = JSON.parse(readFileSync(pathwaysPath, 'utf-8')) as unknown[];

describe('registry loader', () => {
  it('loads bundled compounds without error', () => {
    const all = loadRegistry(records);
    expect(all.length).toBeGreaterThan(0);
  });

  it('returns compounds sorted by name', () => {
    const all = loadRegistry(records);
    const names = all.map((c) => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('throws on duplicate slug', () => {
    const dup = [
      {
        slug: 'foo',
        name: 'Foo',
        category: 'other',
        mechanism: '.',
        routes: ['PO'],
        doses: { PO: { min: 1, max: 2, typical: 1, unit: 'mg' } },
      },
      {
        slug: 'foo',
        name: 'Foo Two',
        category: 'other',
        mechanism: '.',
        routes: ['PO'],
        doses: { PO: { min: 1, max: 2, typical: 1, unit: 'mg' } },
      },
    ];
    expect(() => loadRegistry(dup)).toThrow(/duplicate slug/);
  });

  it('throws with field-level detail on bad input', () => {
    const bad = [{ slug: 'INVALID-SLUG', name: 'Bad' }];
    expect(() => loadRegistry(bad)).toThrow(/invalid compound/);
  });
});

describe('registry query', () => {
  const all = loadRegistry(records);

  it('bySlug returns the right compound', () => {
    const caffeine = bySlug(all, 'caffeine');
    expect(caffeine?.name).toBe('Caffeine');
  });

  it('bySlug re-indexes after the array is filled in place (lazy-fill race guard)', () => {
    // `bundledCompounds` is exported empty and filled in place by
    // ensureBundledCompounds() (the lazy-registry defer). A bySlug call that
    // raced ahead of the fill used to cache an empty index keyed on the array
    // identity and then return undefined forever — a flaky "compound picker /
    // run page shows no result after selecting" bug. The index must re-build
    // when the (same-identity) array grows.
    const arr = [...all].slice(0, 0); // empty array, typed as Compound[]
    const probe = all[0]!.slug;
    const lastSlug = all[all.length - 1]!.slug;
    expect(bySlug(arr, probe)).toBeUndefined(); // caches an empty index
    arr.push(...all); // fill in place — same identity, new length
    expect(bySlug(arr, probe)?.slug).toBe(probe);
    expect(bySlug(arr, lastSlug)?.slug).toBe(lastSlug);
  });

  it('bySlug returns undefined on miss', () => {
    expect(bySlug(all, 'does-not-exist')).toBeUndefined();
  });

  it('bySlug is identity-stable and cache does not leak across arrays', () => {
    // Repeated lookups on the same array reference return the same object
    // (the index is built once, then reused).
    const a = bySlug(all, 'caffeine');
    const b = bySlug(all, 'caffeine');
    expect(a).toBe(b);

    // A *different* array reference must not read the first array's cached
    // index — each array gets its own index keyed on identity. Here a
    // single-element subset must miss every slug except its own.
    const subset = [all.find((c) => c.slug === 'caffeine')!];
    expect(bySlug(subset, 'caffeine')?.slug).toBe('caffeine');
    // 'theanine' exists in `all` but not in `subset` — proves the subset
    // resolves against its own contents, not a stale shared index.
    expect(bySlug(all, 'theanine')).toBeDefined();
    expect(bySlug(subset, 'theanine')).toBeUndefined();
  });

  it('search ranks prefix matches above substring matches', () => {
    // 'caf' prefix-matches caffeine, caffeic-acid; substring-matches
    // alpha-gpc-caffeine-mix etc. Assert any prefix match comes before
    // any substring match — the rank invariant — rather than tying to
    // a specific compound (registry can grow more "caf*" entries).
    const r = search(all, 'caf', 10);
    const prefixMatches = r.filter((c) => c.slug.startsWith('caf'));
    const substringMatches = r.filter((c) => !c.slug.startsWith('caf') && c.slug.includes('caf'));
    expect(prefixMatches.length).toBeGreaterThan(0);
    if (substringMatches.length > 0) {
      const lastPrefixIdx = r.findIndex(
        (c) => c.slug === prefixMatches[prefixMatches.length - 1]!.slug,
      );
      const firstSubstringIdx = r.findIndex((c) => c.slug === substringMatches[0]!.slug);
      expect(lastPrefixIdx).toBeLessThan(firstSubstringIdx);
    }
    expect(prefixMatches.some((c) => c.slug === 'caffeine')).toBe(true);
  });

  it('search matches aliases', () => {
    // theanine is the canonical slug post-consolidation (was l-theanine pre-2026-05-06);
    // 'l-theanine' lives on as an alias so the search should still find it via either query.
    const r = search(all, 'theanine', 5);
    expect(r.some((c) => c.slug === 'theanine')).toBe(true);
    const r2 = search(all, 'l-theanine', 5);
    expect(r2.some((c) => c.slug === 'theanine')).toBe(true);
  });

  it('byCategory filters correctly', () => {
    const stims = byCategory(all, 'stimulant');
    expect(stims.every((c) => c.category === 'stimulant')).toBe(true);
    expect(stims.length).toBeGreaterThan(0);
  });
});

describe('resolveLabelName (inverse OCR matcher)', () => {
  const all = loadRegistry(records);

  it('resolves a compound named inside a branded / qualified label string', () => {
    // The printed name CONTAINS the compound term — the reverse of search.
    expect(resolveLabelName(all, 'Vitamin D3 (as Cholecalciferol)')).toBe('cholecalciferol');
    expect(resolveLabelName(all, 'AstraPure® (Astragalus membranaceus Root)')).toBe('astragalus');
    expect(resolveLabelName(all, "Lion's Mane Mushroom Extract")).toBe('lions-mane');
  });

  it('prefers the longest matching term (salt form over bare mineral)', () => {
    expect(resolveLabelName(all, 'Magnesium L-Threonate')).toBe('magnesium-l-threonate');
  });

  it('is punctuation-insensitive (hyphen vs space)', () => {
    // "Alpha-GPC" in the registry must still match "Alpha GPC" on a label.
    expect(resolveLabelName(all, 'GPC/Cycad (Alpha GPC Spec)')).toBe('alpha-gpc');
  });

  it('returns null when no registry compound is present', () => {
    expect(resolveLabelName(all, 'Poria (Poria cocos) (Fruit)')).toBeNull();
    expect(resolveLabelName(all, 'Totally Made Up Proprietary Blend')).toBeNull();
  });

  it('does not match on sub-minimum-length terms (no B6/K2 false-fire)', () => {
    // A bare "Vitamin K2" has no registry slug and must not false-match a
    // short alias; word-boundary + minTermLen guard against it.
    expect(resolveLabelName(all, 'Vitamin K2')).toBeNull();
  });

  it('anchors on word boundaries (no mid-word substring matches)', () => {
    // "iron" must not match inside "environmental"; if this resolves to a
    // compound, the boundary guard regressed.
    expect(resolveLabelName(all, 'Environmental support factor')).toBeNull();
  });
});

describe('pathway loader (v1.2 Wave 5a)', () => {
  it('loads bundled pathways without error', () => {
    const all = loadPathways(pathwayRecords);
    expect(all.length).toBeGreaterThan(0);
  });

  it('returns pathways sorted by name', () => {
    const all = loadPathways(pathwayRecords);
    const names = all.map((p) => p.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('throws on duplicate pathway slug', () => {
    const dup = [
      {
        slug: 'foo_path',
        name: 'Foo',
        category: 'biosynthesis',
        systems: ['nervous'],
        description: 'x',
        steps: [{ from: 'a', to: 'b' }],
      },
      {
        slug: 'foo_path',
        name: 'Foo Two',
        category: 'biosynthesis',
        systems: ['nervous'],
        description: 'x',
        steps: [{ from: 'a', to: 'b' }],
      },
    ];
    expect(() => loadPathways(dup)).toThrow(/duplicate pathway slug/);
  });

  it('throws on invalid pathway shape', () => {
    const bad = [{ slug: 'p1', name: 'P1' }]; // missing required fields
    expect(() => loadPathways(bad)).toThrow(/invalid pathway/);
  });

  it('catecholamine_synthesis pathway has the expected step chain', () => {
    const all = loadPathways(pathwayRecords);
    const p = all.find((p) => p.slug === 'catecholamine_synthesis');
    expect(p).toBeDefined();
    expect(p!.steps.length).toBeGreaterThanOrEqual(4);
    // 'l-tyrosine' was merged into 'tyrosine' (2026-09-06 duplicate-slug
    // retirement) and the pathway step was rewritten to the canonical slug.
    expect(p!.steps[0]!.from).toBe('tyrosine');
    expect(p!.steps[p!.steps.length - 1]!.to).toBe('epinephrine');
  });
});

/**
 * PD1b Layer 2 closed the last gap: every authored receptor_occupancy site now
 * carries a typed `action`. The app derives the activates/blocks/modulates
 * glyph from it and falls back to PARSING the phenotypic `pathway` word only
 * where it's absent — and that fallback abstains to 'modulates' silently. So a
 * site that regains an unauthored action reads as plausible-but-undirected
 * rather than failing, which is exactly the kind of drift a test has to catch.
 */
describe('receptor_occupancy — typed action coverage', () => {
  const ACTIONS = new Set([
    'agonist',
    'partial_agonist',
    'inverse_agonist',
    'antagonist',
    'inhibitor',
    'blocker',
    'neutralizer',
    'pam',
    'nam',
    'substrate',
    'modulator',
    'unknown',
  ]);

  const sites = loadRegistry(records).flatMap((c) =>
    (c.receptor_occupancy ?? []).map((s) => ({ slug: c.slug, ...s })),
  );

  it('has authored sites to check', () => {
    expect(sites.length).toBeGreaterThan(300);
  });

  it('every site carries an action', () => {
    const missing = sites
      .filter((s) => s.action == null)
      .map((s) => `${s.slug} @ ${s.receptor} [${s.pathway ?? ''}]`);
    expect(missing).toEqual([]);
  });

  it('every action is a known ReceptorAction', () => {
    const bad = sites
      .filter((s) => s.action != null && !ACTIONS.has(s.action))
      .map((s) => `${s.slug} @ ${s.receptor}: ${s.action}`);
    expect(bad).toEqual([]);
  });

  it('no site is typed the placeholder "unknown" — that would read as modulates', () => {
    const unknown = sites
      .filter((s) => s.action === 'unknown')
      .map((s) => `${s.slug} @ ${s.receptor}`);
    expect(unknown).toEqual([]);
  });
});
