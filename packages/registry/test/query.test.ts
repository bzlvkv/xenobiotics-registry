/**
 * Query tests. Search ranking, the target flattening, and the two joins that a
 * browsing client is built out of.
 */

import { describe, expect, it } from 'vitest';
import {
  allTargets,
  compoundsForPathway,
  compoundsForTarget,
  interactionsOf,
  pubmedUrl,
  searchCompounds,
  searchPathways,
  searchTargets,
} from '../src/index';
import type { Compound } from '../src/index';
import { readRegistry } from '../src/read';

const registry = readRegistry();
const { compounds, pathways, receptors } = registry;

describe('searchCompounds', () => {
  it('ranks prefix matches above substring matches', () => {
    // Asserts the rank INVARIANT rather than a specific result order, because the
    // catalog keeps growing more "caf*" entries.
    const r = searchCompounds(compounds, 'caf', 10);
    const prefix = r.filter((c) => c.slug.startsWith('caf'));
    const substring = r.filter((c) => !c.slug.startsWith('caf') && c.slug.includes('caf'));
    expect(prefix.length).toBeGreaterThan(0);
    if (substring.length > 0) {
      const lastPrefix = r.findIndex((c) => c.slug === prefix[prefix.length - 1]!.slug);
      const firstSubstring = r.findIndex((c) => c.slug === substring[0]!.slug);
      expect(lastPrefix).toBeLessThan(firstSubstring);
    }
    expect(prefix.some((c) => c.slug === 'caffeine')).toBe(true);
  });

  it('matches aliases', () => {
    // 'theanine' is the canonical slug post-consolidation; 'l-theanine' lives on as
    // an alias, so either query must find it.
    expect(searchCompounds(compounds, 'theanine', 5).some((c) => c.slug === 'theanine')).toBe(true);
    expect(searchCompounds(compounds, 'l-theanine', 5).some((c) => c.slug === 'theanine')).toBe(
      true,
    );
  });

  it('respects the limit and returns a head slice for an empty query', () => {
    expect(searchCompounds(compounds, 'a', 7)).toHaveLength(7);
    expect(searchCompounds(compounds, '   ', 3)).toEqual(compounds.slice(0, 3));
  });
});

describe('searchPathways', () => {
  it('finds a pathway by its colloquial sensation hook', () => {
    // The whole reason `sensation` is scored high: nobody searching for the felt
    // phenomenon knows the formal pathway name.
    const withSensation = pathways.filter((p) => p.sensation);
    expect(withSensation.length).toBeGreaterThan(0);
    const probe = withSensation[0]!;
    const hit = searchPathways(pathways, probe.sensation!.split(/[^a-z]+/i)[0]!, 50);
    expect(hit.some((p) => p.slug === probe.slug)).toBe(true);
  });

  it('matches an underscored slug typed with spaces', () => {
    const p = pathways.find((x) => x.slug.includes('_'))!;
    const spaced = p.slug.replace(/_/g, ' ');
    expect(searchPathways(pathways, spaced, 50).some((x) => x.slug === p.slug)).toBe(true);
  });
});

describe('targets', () => {
  it('flattens both catalogs into one list, tagged by kind', () => {
    const all = allTargets(receptors);
    expect(all.length).toBe(receptors.receptors.length + receptors.nonGpcrTargets.length);
    expect(all.filter((t) => t.kind === 'gpcr').length).toBe(receptors.receptors.length);
    expect(all.filter((t) => t.kind === 'non-gpcr').length).toBe(receptors.nonGpcrTargets.length);
    // Only the non-GPCR half carries a class, which is why `class` is optional.
    expect(all.filter((t) => t.class).every((t) => t.kind === 'non-gpcr')).toBe(true);
  });

  it('turns a null gene into an absent one, so a consumer has one check to make', () => {
    const orphans = receptors.receptors.filter((r) => r.gene === null);
    expect(orphans.length).toBeGreaterThan(0);
    const flattened = allTargets(receptors).find((t) => t.key === orphans[0]!.key)!;
    expect('gene' in flattened).toBe(false);
  });

  it('searches by key, gene and name', () => {
    expect(searchTargets(receptors, 'HTR2A', 5)[0]!.key).toBe('HTR2A');
    expect(searchTargets(receptors, 'cox_1', 5)[0]!.key).toBe('cox_1');
    expect(searchTargets(receptors, '5-HT2A', 5).some((t) => t.key === 'HTR2A')).toBe(true);
  });
});

describe('joins', () => {
  it('compoundsForTarget finds every compound bound to an occupancy key', () => {
    const hits = compoundsForTarget(compounds, 'adenosine_A1');
    expect(hits.some((c) => c.slug === 'caffeine')).toBe(true);
    expect(
      hits.every((c) => (c.receptor_occupancy ?? []).some((r) => r.receptor === 'adenosine_A1')),
    ).toBe(true);
  });

  it('compoundsForTarget canonicalizes the key it is asked about', () => {
    // A caller that types an alias spelling must still find the rows authored
    // under the canonical one, or a target page silently shows nothing.
    expect(compoundsForTarget(compounds, 'MOR')).toEqual(
      compoundsForTarget(compounds, 'mu_opioid'),
    );
  });

  it('compoundsForPathway reaches every modulator of the pathway', () => {
    const p = pathways.find((x) => (x.modulators ?? []).length > 3)!;
    const slugs = new Set(compoundsForPathway(compounds, p).map((c) => c.slug));
    for (const m of p.modulators ?? []) expect(slugs.has(m.slug)).toBe(true);
  });

  it('compoundsForPathway finds a compound for nearly every pathway in the real data', () => {
    // The regression this guards: called the wrong way, the function returned an
    // empty list for all 230 pathways and every page said nothing touched it.
    const touched = pathways.filter((p) => compoundsForPathway(compounds, p).length > 0);
    expect(touched.length).toBeGreaterThan(200);
  });

  it('compoundsForPathway de-duplicates a compound reachable both ways', () => {
    const p = pathways.find((x) => (x.modulators ?? []).length > 1)!;
    const dupModulators = { ...p, modulators: [...(p.modulators ?? []), p.modulators![0]!] };
    const hits = compoundsForPathway(compounds, dupModulators);
    expect(new Set(hits.map((c) => c.slug)).size).toBe(hits.length);
  });
});

describe('interactionsOf', () => {
  const a: Compound = {
    slug: 'a',
    name: 'A',
    aliases: [],
    category: 'other',
    mechanism: '.',
    routes: ['PO'],
    doses: { PO: { min: 1, max: 2, typical: 1, unit: 'mg' } },
    half_life_hr: {},
    refs: [],
    interactions: [{ slug: 'b', name: 'B', level: 'caution', note: 'n' }],
  };
  const b: Compound = { ...a, slug: 'b', name: 'B', interactions: undefined };
  const c: Compound = {
    ...a,
    slug: 'c',
    name: 'C',
    interactions: [{ slug: 'b', name: 'B', level: 'warn', note: 'n' }],
  };

  it('shows both directions, because an edge is stored on one side only', () => {
    // Reading only `compound.interactions` shows half the picture, and which half
    // depends on which record you opened.
    const edges = interactionsOf([a, b, c], 'b');
    expect(edges).toHaveLength(2);
    expect(edges.every((e) => e.direction === 'in')).toBe(true);
    expect(edges.map((e) => e.other?.slug).sort()).toEqual(['a', 'c']);
  });

  it('marks a compound own edges as outgoing', () => {
    const edges = interactionsOf([a, b, c], 'a');
    expect(edges).toHaveLength(1);
    expect(edges[0]!.direction).toBe('out');
    expect(edges[0]!.other?.slug).toBe('b');
  });

  it('keeps an off-registry counterparty with other undefined', () => {
    // Informational edges against substances the catalog does not yet carry are
    // legal and must not be dropped — the warning is the content.
    const off: Compound = {
      ...a,
      slug: 'd',
      name: 'D',
      interactions: [{ slug: 'adenosine', name: 'Adenosine', level: 'caution', note: 'n' }],
    };
    const edges = interactionsOf([off], 'd');
    expect(edges).toHaveLength(1);
    expect(edges[0]!.other).toBeUndefined();
    expect(edges[0]!.ref.name).toBe('Adenosine');
  });

  it('follows a retired slug', () => {
    const merged: Compound = { ...b, retired_slugs: ['b-old'] };
    const edges = interactionsOf([a, merged, c], 'b-old');
    expect(edges.map((e) => e.other?.slug).sort()).toEqual(['a', 'c']);
  });

  it('finds an in-edge authored against a retired slug when asked by the canonical one', () => {
    // The direction that matters, because a page routes by the CANONICAL slug. An
    // edge written against the old name used to be found only by that old name, so
    // it vanished from the surviving record's page while still linting clean.
    const merged: Compound = { ...b, slug: 'b-new', retired_slugs: ['b'] };
    const edges = interactionsOf([a, merged, c], 'b-new');
    expect(edges.map((e) => e.other?.slug).sort()).toEqual(['a', 'c']);
    expect(edges.every((e) => e.direction === 'in')).toBe(true);
  });

  it('finds the two real edges the catalog authored against retired slugs', () => {
    // `epa-dha → ala` and `riboflavin → r5p`. Both counterparties were merged away,
    // and both edges are only reachable through the forwarding index.
    for (const [canonical, from] of [
      ['alpha-linolenic-acid', 'epa-dha'],
      ['riboflavin-5-phosphate', 'riboflavin'],
    ] as const) {
      const incoming = interactionsOf(compounds, canonical).filter((e) => e.direction === 'in');
      expect(incoming.map((e) => e.other?.slug)).toContain(from);
    }
  });

  it('works over the real catalog', () => {
    const edges = interactionsOf(compounds, 'caffeine');
    expect(edges.length).toBeGreaterThan(0);
    expect(edges.some((e) => e.direction === 'out')).toBe(true);
  });
});

describe('pubmedUrl', () => {
  it('accepts both spellings the catalog uses', () => {
    expect(pubmedUrl('PMID:17604717')).toBe('https://pubmed.ncbi.nlm.nih.gov/17604717/');
    expect(pubmedUrl('8645157')).toBe('https://pubmed.ncbi.nlm.nih.gov/8645157/');
  });
});
