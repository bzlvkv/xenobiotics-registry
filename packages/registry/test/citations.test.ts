/**
 * citationsIn — the walker, and the three spellings it has to accept.
 *
 * The rule this encodes: a citation shape added next year must be found without
 * anyone remembering to update the walker. The previous version enumerated the
 * shapes it knew about, and the twenty PMIDs on the PI3K/Akt diagram's edges were
 * therefore never verified — not reported as unparseable, simply never counted,
 * which reads identically to "there are no citations here".
 */

import { describe, expect, it } from 'vitest';
import { allCitations, citationsIn } from '../src/index';
import { readRegistry } from '../src/read';

describe('citationsIn', () => {
  it('reads a prefixed source_pmid', () => {
    expect(citationsIn({ pk: { PO: { source_pmid: 'PMID:17604717' } } }, 'x')).toEqual([
      { pmid: '17604717', origin: 'x.pk.PO.source_pmid' },
    ]);
  });

  it('reads a BARE pmid, which is what diagram edges write', () => {
    // This is the bug the walker was rewritten for. A strict parser returned null
    // for a bare id, which is indistinguishable from "no citation in this field".
    expect(citationsIn({ diagram: { edges: [{ pmid: '8645157' }] } }, 'p')).toEqual([
      { pmid: '8645157', origin: 'p.diagram.edges[0].pmid' },
    ]);
  });

  it('reads refs[] entries, which MUST carry the prefix', () => {
    // refs[] is free-form and also holds the odd DOI, so a bare number there could
    // be anything and is deliberately not treated as a PMID.
    expect(citationsIn({ refs: ['PMID:123', 'PMID: 456', '10.1000/xyz', '789'] }, 'c')).toEqual([
      { pmid: '123', origin: 'c.refs[0]' },
      { pmid: '456', origin: 'c.refs[1]' },
    ]);
  });

  it('finds citations at any depth, including shapes nobody enumerated', () => {
    const doc = {
      a: { b: [{ c: { source_pmid: 'PMID:1' } }] },
      interactions: [{ source_pmid: 'PMID:2' }],
      whatever_field_is_added_next: { pmid: '3' },
    };
    expect(
      citationsIn(doc, 'root')
        .map((c) => c.pmid)
        .sort(),
    ).toEqual(['1', '2', '3']);
  });

  it('records an origin path a curator can navigate to', () => {
    const [cite] = citationsIn({ receptor_occupancy: [{}, { source_pmid: 'PMID:9' }] }, 'caffeine');
    expect(cite!.origin).toBe('caffeine.receptor_occupancy[1].source_pmid');
  });

  it('ignores non-string and malformed values instead of throwing', () => {
    expect(citationsIn({ source_pmid: 12345, refs: [1, null, {}] }, 'x')).toEqual([]);
    expect(citationsIn({ pmid: 'PMID:not-a-number' }, 'x')).toEqual([]);
    expect(citationsIn(null, 'x')).toEqual([]);
  });
});

describe('allCitations over the real registry', () => {
  const registry = readRegistry();
  const citations = allCitations(registry);

  it('finds thousands of citations and labels where each sits', () => {
    expect(citations.length).toBeGreaterThan(2000);
    expect(new Set(citations.map((c) => c.pmid)).size).toBeGreaterThan(1000);
    expect(citations.every((c) => /^\d+$/.test(c.pmid))).toBe(true);
  });

  it('includes the diagram-edge citations that the old walker missed', () => {
    const diagramCites = citations.filter((c) => c.origin.includes('.diagram.edges['));
    expect(diagramCites.length).toBeGreaterThan(0);
  });

  it('distinguishes compound origins from pathway origins', () => {
    expect(citations.some((c) => c.origin.includes('(pathway)'))).toBe(true);
    expect(citations.some((c) => !c.origin.includes('(pathway)'))).toBe(true);
  });
});
