/**
 * The quote gate, tested on the shapes that actually occur.
 *
 * Every string in this file is copied from a real record or a real PubMed
 * abstract. A synthetic pair proves the matcher can match; only the real pairs
 * prove it survives the two renderings of the same sentence, which is the entire
 * problem this module solves.
 */

import { describe, expect, it } from 'vitest';
import {
  apiKeyParam,
  citesFullText,
  EFETCH_URL,
  efetchUrl,
  ESUMMARY_URL,
  esummaryUrl,
  normalizeForMatch,
  quoteFound,
  quotesIn,
  quotedClaimsIn,
  splitAbstracts,
  verbatimClaims,
  verbatimClaimsWithOrphans,
} from '../src/index';
import type { Registry } from '../src/types';
import { readRegistry } from '../src/read';

describe('quotesIn', () => {
  it('takes the quote from a note that claims to be quoting its abstract', () => {
    expect(
      quotesIn('Tsuchihashi 1992 verbatim: "the Kd and Bmax values were 7.42 +/- 1.03 nM".'),
    ).toEqual(['the Kd and Bmax values were 7.42 +/- 1.03 nM']);
  });

  it('claims nothing when the note claims nothing', () => {
    expect(
      quotesIn('Human beta-1, HEK293 cells expressing a single subtype, "high affinity".'),
    ).toEqual([]);
  });

  it('ignores a quote attributed to the value this record REPLACED', () => {
    // alfentanil's kₑₒ note, which is why this rule exists: the second quote is
    // true, comes from a different paper, and is correctly absent from this one.
    const note =
      'Adult human, direct head-to-head with remifentanil. Verbatim: "a T(12)k(e0) for ' +
      'remifentanil of 0.75 min [corrected] and 0.96 min for alfentanil". keo = ln2 / ' +
      '(0.96/60) = 43.32/h. Replaces 69.3/h, computed from a 5-subject COMPARATOR arm ' +
      'reporting "0.6 +/- 0.4 minutes" — a 67% relative SD.';
    expect(quotesIn(note)).toEqual([
      'a T(12)k(e0) for remifentanil of 0.75 min [corrected] and 0.96 min for alfentanil',
    ]);
  });

  it('skips a term too short to be a sentence', () => {
    expect(quotesIn('Abstract states "human M3" only.')).toEqual([]);
  });

  it('recognises a full-text provenance, which the abstract cannot be expected to carry', () => {
    expect(citesFullText('Cox 2010 full-text binding table: human OX1R Ki = 0.55 nM.')).toBe(true);
    expect(citesFullText('Abstract verbatim: "Ki = 0.55 nM".')).toBe(false);
  });
});

describe('normalizeForMatch folds the two renderings of one sentence', () => {
  const same = (a: string, b: string): boolean => normalizeForMatch(a) === normalizeForMatch(b);

  it('folds the tolerance sign, the micro sign and superscript units', () => {
    expect(same('35.9 ± 4.2 µM', '35.9 +/-4.2 microM')).toBe(true);
    expect(same('k(eo) was 0.058 ± 0.026 min⁻¹', 'k(eo) was 0.058 +/- 0.026 min(-1)')).toBe(true);
  });

  it('rejoins a token PubMed hard-wrapped mid-word', () => {
    expect(
      quoteFound('5-HT1A receptors K i=4.2 nM', 'human 5-HT1A receptors K\n(i)=4.2 nM using'),
    ).toBe(true);
  });

  it('reads the Greek mu as a unit before m/g/l and as the letter otherwise', () => {
    expect(same('4.9 μM', '4.9 microM')).toBe(true);
    expect(normalizeForMatch('μ-opioid')).toBe('mu-opioid');
  });

  it('spells out the other Greek letters, which PubMed prints as words', () => {
    expect(same('α1-adrenoceptor affinities', 'alpha1-adrenoceptor affinities')).toBe(true);
  });

  it('folds the approximation sign and the curly apostrophe', () => {
    expect(same('IC50 of ~45nM', 'IC50 of ∼45nM')).toBe(true);
    expect(same('St John’s wort', "St John's wort")).toBe(true);
  });
});

describe('quoteFound', () => {
  const abstract =
    'Ki values in the individual layers were in a range between 8.5 +/- 6.5 microM and\n' +
    '18.9 +/- 16.0 microM for caffeine.';

  it('finds a quote spanning the abstract line wrap', () => {
    expect(quoteFound('between 8.5 +/- 6.5 microM and 18.9 +/- 16.0 microM', abstract)).toBe(true);
  });

  it('honours an elision, in order', () => {
    expect(quoteFound('Ki values … for caffeine', abstract)).toBe(true);
    expect(quoteFound('for caffeine … Ki values', abstract)).toBe(false);
  });

  it('refuses a sentence the abstract does not contain', () => {
    expect(quoteFound('caffeine Ki was 12.7 microM', abstract)).toBe(false);
  });
});

describe('splitAbstracts', () => {
  it('keys each record on the PMID line that ENDS it', () => {
    const text = [
      '1. J One. 1990.',
      '',
      'First body.',
      '',
      'PMID: 111 [Indexed for MEDLINE]',
      '',
      '2. J Two. 1991.',
      '',
      'Second body.',
      '',
      'PMID: 222',
    ].join('\n');
    const out = splitAbstracts(text);
    expect([...out.keys()]).toEqual(['111', '222']);
    expect(out.get('111')).toContain('First body.');
    expect(out.get('222')).toContain('Second body.');
    expect(out.get('222')).not.toContain('First body.');
  });
});

describe('verbatimClaims over the real registry', () => {
  const claims = verbatimClaims(readRegistry());

  it('finds claims, and every one names a bare PMID and a non-empty quote', () => {
    expect(claims.length).toBeGreaterThan(100);
    for (const c of claims) {
      expect(c.pmid, `${c.entity} ${c.origin}`).toMatch(/^\d+$/);
      expect(c.quote.length, `${c.entity} ${c.origin}`).toBeGreaterThan(11);
      expect(c.entity.length).toBeGreaterThan(0);
    }
  });

  it('reaches notes on nested records, not only the top level', () => {
    const origins = claims.map((c) => c.origin);
    expect(origins.some((o) => o.startsWith('receptor_occupancy['))).toBe(true);
    expect(origins.some((o) => o.startsWith('interactions['))).toBe(true);
    expect(origins.some((o) => o === 'effect_compartment.note')).toBe(true);
  });

  it('excludes a note that sources its value to full text', () => {
    // suvorexant's orexin rows quote a binding table and say so; the abstract is
    // silent on the number by the paper's own construction.
    expect(claims.filter((c) => c.entity === 'suvorexant')).toEqual([]);
  });
});

describe('quotedClaimsIn — a PMID named inside the clause', () => {
  it('attributes a span to the paper its own clause names, not to the row', () => {
    const note =
      'Dodgson 2000 verbatim: "Ki values were approximately 100, 7, 10 microM". ' +
      'A separate group calls it low nanomolar (PMID:12617904) and states "no quotable figure here".';
    const out = quotedClaimsIn(note);
    expect(out.find((q) => q.quote.startsWith('Ki values'))?.pmid).toBeNull();
    expect(out.find((q) => q.quote.startsWith('no quotable'))?.pmid).toBe('12617904');
  });

  it('leaves a span untagged when one clause names two different papers', () => {
    const note = 'Verbatim, PMID:111 against PMID:222: "the disputed sentence here".';
    expect(quotedClaimsIn(note)[0]?.pmid).toBeNull();
  });

  it('repeating one PMID in a clause is not ambiguity', () => {
    const note = 'PMID:333 verbatim, and PMID:333 again: "the quoted sentence here".';
    expect(quotedClaimsIn(note)[0]?.pmid).toBe('333');
  });

  it('exempts full text PER CLAUSE, so one such clause does not exempt the note', () => {
    const note =
      'FULL TEXT of PMID:111 Table 2: "a table sentence not in the abstract". ' +
      'PMID:222 abstract states "a sentence that really is in the abstract".';
    const out = quotedClaimsIn(note);
    expect(out.map((q) => q.pmid)).toEqual(['222']);
  });

  it('still refuses a clause describing a value corrected away from', () => {
    const note =
      'Verbatim: "the stored sentence goes here". Replaces PMID:999 which said "the old wrong sentence".';
    expect(quotedClaimsIn(note).map((q) => q.quote)).toEqual(['the stored sentence goes here']);
  });
});

describe('verbatimClaims reaches inline-cited prose', () => {
  const claims = verbatimClaims(readRegistry());

  it('checks compound-level mechanism and notes, which carry no source_pmid', () => {
    const origins = new Set(claims.map((c) => c.origin));
    expect(origins.has('notes')).toBe(true);
  });
});

describe('normalizeForMatch — renderings that are the same sentence', () => {
  it('folds a vulgar fraction against its spelled-out form', () => {
    // perampanel: PubMed prints `mean t½, 109 h`; the note writes `t1/2`.
    expect(
      quoteFound('mean t1/2, 109 h', 'were median tss,max, 1.25 h; mean t½, 109 h; mean Css,max'),
    ).toBe(true);
  });

  it('folds a Lancet middle-dot decimal against an ordinary point', () => {
    // survodutide: the abstract prints `0·6, 2·4, 3·6, or 4·8 mg`.
    const abstract =
      'to subcutaneous survodutide (0·6, 2·4, 3·6, or 4·8 mg) or placebo once-weekly for 46 weeks';
    expect(
      quoteFound(
        'subcutaneous survodutide (0.6, 2.4, 3.6, or 4.8 mg) or placebo once-weekly',
        abstract,
      ),
    ).toBe(true);
  });

  it('does not fold a middle dot that is not between digits', () => {
    expect(normalizeForMatch('A·B')).not.toBe(normalizeForMatch('A.B'));
  });
});

describe('quoted spans pair by parity, not by scanning', () => {
  it('does not read the prose between two quotations as a quotation', () => {
    // metronidazole: `>90%` is under the floor, so a scanning regex skipped it
    // and matched the thirty characters of prose that followed.
    const note =
      'Verbatim: the stored value was a lower BOUND (">90%") while the measured figure is "approximately 1" here.';
    expect(quotedClaimsIn(note).map((q) => q.quote)).toEqual(['approximately 1']);
  });

  it('still takes two genuine quotations in one clause', () => {
    const note = 'Verbatim: "the first quoted sentence" and "the second quoted sentence".';
    expect(quotedClaimsIn(note).map((q) => q.quote)).toEqual([
      'the first quoted sentence',
      'the second quoted sentence',
    ]);
  });
});

describe('quotations pair over the whole note, not per clause', () => {
  it('does not read the prose between two quotations as a quotation', () => {
    // metronidazole: `>90%` is under the floor, so a scanner skipped it and
    // matched the thirty characters of prose that followed.
    const note =
      'Verbatim: the stored value was a lower BOUND (">90%") while the measured figure is "approximately 1" here.';
    expect(quotedClaimsIn(note).map((q) => q.quote)).toEqual(['approximately 1']);
  });

  it('keeps a quotation that contains a full stop, which straddles a clause', () => {
    const note =
      'PMID:123 verbatim: "the first sentence ends. and the second one follows" after it.';
    expect(quotedClaimsIn(note)).toEqual([
      { quote: 'the first sentence ends. and the second one follows', pmid: '123' },
    ]);
  });

  it('does not report the trailing prose after such a quotation', () => {
    const note =
      'PMID:9 verbatim: "a quoted sentence here. and more of it" — editorial gloss follows.';
    expect(quotedClaimsIn(note).map((q) => q.quote)).toEqual([
      'a quoted sentence here. and more of it',
    ]);
  });
});

describe('the decision markers are read outside the quotation marks', () => {
  it('does not exempt a quote because the SOURCE sentence contains "used to"', () => {
    // prednisolone's fu_note. "was used to characterize" is the paper's own
    // wording, and `used to` is in the vocabulary meaning "corrected away
    // from", so this quotation was silently never checked.
    const note =
      'PMID:7310640 verbatim: "a two compartment, nonlinear equation was used ' +
      'to characterize the effective binding of prednisolone".';
    expect(quotedClaimsIn(note)).toEqual([
      {
        quote:
          'a two compartment, nonlinear equation was used to characterize the effective binding of prednisolone',
        pmid: '7310640',
      },
    ]);
  });

  it('still exempts one when the AUTHOR writes the marker in their own prose', () => {
    const note = 'PMID:7310640 verbatim: "the quoted sentence here" — replaces an earlier value.';
    expect(quotedClaimsIn(note)).toEqual([]);
  });

  it('breaks a clause after the closing mark of a quotation that ended a sentence', () => {
    // Without the closing mark in the boundary the two sentences are one clause,
    // its three PMIDs make the attribution ambiguous, and the quote is dropped.
    const note =
      'PMID:7310640 verbatim: "the binding was markedly concentration-dependent." ' +
      'Two further papers agree (PMID:3834071, PMID:3593903).';
    expect(quotedClaimsIn(note)).toEqual([
      { quote: 'the binding was markedly concentration-dependent.', pmid: '7310640' },
    ]);
  });
});

describe('the NCBI API key travels as a query parameter, or not at all', () => {
  it('omits api_key when none is given, so the bare URL is unchanged', () => {
    expect(efetchUrl(['1', '2'])).toBe(
      `${EFETCH_URL}?db=pubmed&id=1,2&rettype=abstract&retmode=text`,
    );
    expect(esummaryUrl(['1'])).toBe(`${ESUMMARY_URL}?db=pubmed&id=1&retmode=json`);
  });

  it('appends it when given, and encodes it', () => {
    expect(efetchUrl(['1'], 'abc123')).toContain('&api_key=abc123');
    expect(esummaryUrl(['1'], 'a b')).toContain('&api_key=a%20b');
  });

  it('treats blank and whitespace as absent, so an empty env var is not sent', () => {
    expect(apiKeyParam('')).toBe('');
    expect(apiKeyParam('   ')).toBe('');
    expect(apiKeyParam(undefined)).toBe('');
  });
});

describe('verbatimClaimsWithOrphans', () => {
  const reg = (compound: Record<string, unknown>): Registry =>
    ({
      compounds: [compound],
      pathways: [],
      receptors: { gpcrs: [], others: [] },
    }) as unknown as Registry;

  it('counts a quote its clause cannot attribute instead of dropping it', () => {
    // The levothyroxine shape: the PMID is named in one sentence and the paper is
    // quoted in the next, so the span belongs to no clause that names a source.
    const { claims, orphans } = verbatimClaimsWithOrphans(
      reg({
        slug: 'x',
        notes: 'PMID:29212434 is the source. Verbatim: "were estimated to be 0.712 L/h".',
      }),
    );
    expect(claims).toHaveLength(0);
    expect(orphans).toHaveLength(1);
    expect(orphans[0]?.notePmid).toBe(true);
  });

  it('marks an orphan unrecoverable when its note names no paper at all', () => {
    const { orphans } = verbatimClaimsWithOrphans(
      reg({ slug: 'x', notes: 'The abstract states "a terminal half-life of eight hours".' }),
    );
    expect(orphans[0]?.notePmid).toBe(false);
  });

  it('is not an orphan once the quoting clause names the paper', () => {
    const { claims, orphans } = verbatimClaimsWithOrphans(
      reg({ slug: 'x', notes: 'PMID:29212434 states verbatim "were estimated to be 0.712 L/h".' }),
    );
    expect(orphans).toHaveLength(0);
    expect(claims[0]?.pmid).toBe('29212434');
  });

  it('keeps verbatimClaims identical, since both walk once', () => {
    const c = reg({ slug: 'x', notes: 'PMID:1 states verbatim "a half-life of eight hours".' });
    expect(verbatimClaims(c)).toEqual(verbatimClaimsWithOrphans(c).claims);
  });
});
