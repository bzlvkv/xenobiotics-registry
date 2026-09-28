/**
 * The full-text path, tested on the shapes the network actually returns.
 */
import { describe, expect, it } from 'vitest';
import { firstPmcId, biocUrl, passagesFromBioC, passagesMentioning } from '../src/index';

describe('firstPmcId', () => {
  it('takes the article own PMCID, the first one, not a reference-list entry', () => {
    // A real PubMed record lists the article's PMCID first, then one per cited
    // reference; taking a later one would fetch a reference instead of the paper.
    const xml =
      '<ArticleIdList><ArticleId IdType="pubmed">29661838</ArticleId>' +
      '<ArticleId IdType="pmc">PMC5945293</ArticleId></ArticleIdList>' +
      '<ReferenceList><ArticleId IdType="pmc">PMC5408160</ArticleId></ReferenceList>';
    expect(firstPmcId(xml)).toBe('5945293');
  });
  it('returns null when the article is not in PMC', () => {
    expect(firstPmcId('<ArticleId IdType="pubmed">18187929</ArticleId>')).toBeNull();
  });
});

describe('biocUrl', () => {
  it('builds the unicode BioC url from bare or prefixed ids alike', () => {
    expect(biocUrl('5945293')).toBe(biocUrl('PMC5945293'));
    expect(biocUrl('5945293')).toContain('/BioC_json/PMC5945293/unicode');
  });
});

describe('passagesFromBioC', () => {
  const oa = JSON.stringify([
    {
      documents: [
        {
          passages: [
            { infons: { section_type: 'ABSTRACT' }, text: 'Ki was 1.3 nM at NK1.' },
            { infons: { section_type: 'TABLE' }, text: 'aprepitant 1.3' },
            { infons: {}, text: '' },
          ],
        },
      ],
    },
  ]);
  it('returns section-labelled passages, skipping empty text', () => {
    const r = passagesFromBioC(oa);
    if ('reason' in r) throw new Error(r.reason);
    expect(r.passages).toHaveLength(2);
    expect(r.passages[0]).toEqual({ section: 'ABSTRACT', text: 'Ki was 1.3 nM at NK1.' });
  });
  it('reports a non-OA HTML page as a reason, never as an empty paper', () => {
    const r = passagesFromBioC('<!DOCTYPE html><html>not json</html>');
    expect('reason' in r && r.reason).toContain('open-access');
  });
  it('names a rate-limit distinctly, since that is retryable and OA-absence is not', () => {
    const r = passagesFromBioC('<html><title>Too Many Requests</title></html>');
    expect('reason' in r && r.reason).toContain('rate-limited');
  });
});

describe('passagesMentioning', () => {
  it('locates the passages naming a term, case-insensitively', () => {
    const ps = [
      { section: 'A', text: 'Aprepitant Ki 1.3 nM' },
      { section: 'B', text: 'unrelated' },
    ];
    expect(passagesMentioning(ps, 'aprepitant')).toHaveLength(1);
  });
});
