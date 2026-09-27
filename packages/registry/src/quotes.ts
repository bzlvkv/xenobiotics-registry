/**
 * quotes.ts — checking the one provenance claim a machine CAN check.
 *
 * `pnpm verify` proves a PMID resolves. It is documented, in three places, as
 * unable to prove the abstract states the value hung on it, and that gap is the
 * largest defect class this catalog has ever had: 84 secondary-citation plus 65
 * abstract-silent out of 216 confirmed problems. The stated reason no gate can
 * close it is that the paper's text is not in the repo.
 *
 * For one shape of record, that reason does not hold. HYGIENE requires a
 * VERBATIM QUOTE in the note beside a sourced value, and 195 records supply one:
 * `Tsuchihashi 1992 verbatim: "the Kd and Bmax values were 7.42 +/- 1.03 nM …"`.
 * A quote is a falsifiable claim about a specific document. Fetch that
 * document's abstract and the claim is decidable — no judgement, no reading, no
 * model in the loop. A note quoting a sentence its own cited abstract does not
 * contain is either a quote from somewhere else, a paraphrase dressed as a
 * quote, or the wrong PMID, and all three are exactly what the audit was for.
 *
 * WHAT THIS STILL DOES NOT PROVE, and it matters as much as what it does:
 *   - A note with no quote is not checked. Silence is not a claim.
 *   - A quote that IS present proves only that the sentence is in that abstract.
 *     Whether the number in it is the one stored in `ec50_mg_l`, and whether the
 *     named compound is the paper's subject rather than a comparator, are still
 *     questions only a reader answers.
 *   - A value sourced to FULL TEXT is legitimately absent from the abstract.
 *     Those notes are reported as `unchecked`, never as failures.
 * It is a narrow gate over a real claim, which is worth more than a broad one
 * over an inferred one.
 *
 * Pure, like `pubmed.ts`: URLs and parsing in one place, the network in the
 * script. Nothing here fetches.
 */

import { describesStoredValue, splitClauses } from './lint';
import type { Registry } from './types';

/** A verbatim-quote claim: this note says this text appears in this paper. */
export interface QuoteClaim {
  /** The record the note sits on — a compound slug, or a pathway slug. */
  entity: string;
  /** Dotted path to the note, e.g. `receptor_occupancy[2].note`. */
  origin: string;
  /** Bare digits, as `pubmed.ts` and `verify-citations.ts` use them. */
  pmid: string;
  /** The quoted span, exactly as the note writes it. */
  quote: string;
}

export type QuoteVerdict =
  | { claim: QuoteClaim; state: 'found' }
  | { claim: QuoteClaim; state: 'missing' }
  | { claim: QuoteClaim; state: 'unfetched' };

/**
 * A note is CLAIMING its quote comes from the abstract when it says so. Authors
 * write this several ways — "verbatim", "abstract states", "the abstract reads"
 * — and the word carries the claim, not the quotation marks: plenty of notes
 * quote a receptor name or an assay in passing and assert nothing.
 */
const CLAIMS_VERBATIM = /\b(?:verbatim|abstract states|abstract reads|quoting the abstract)\b/i;

/**
 * A note whose value came from the full text. The abstract legitimately does not
 * contain the sentence, so failing these would train an author to stop writing
 * the quote at all — the opposite of what this file is for. WORKFLOW requires
 * the words "full text" in exactly this case, which is what makes the exemption
 * detectable rather than guessed.
 */
const CITES_FULL_TEXT = /\bfull[-\s]text\b/i;

/**
 * Quoted spans. Straight and curly pairs both occur in the data.
 *
 * The 12-character floor is not cosmetic: a short quote is a term, not a
 * sentence ("human M3", "Ki"), and matching one proves nothing while failing one
 * is almost always the abstract wording a label differently.
 */
const QUOTED_SPAN = /"([^"]{12,})"|“([^”]{12,})”/g;

/**
 * Every quoted span in a note that claims to be quoting its cited abstract.
 *
 * CLAUSE-SCOPED, and this is the whole difficulty of the file. A good note
 * quotes TWICE: once for the value it stores, and once for the value it drove
 * out, which came from a different paper. alfentanil's kₑₒ note carries
 * `Verbatim: "a T(12)k(e0) ... 0.96 min for alfentanil"` and then `Replaces
 * 69.3/h, computed from a 5-subject COMPARATOR arm reporting "0.6 +/- 0.4
 * minutes"`. The second quote is TRUE, is correctly not in this abstract, and is
 * the sentence that documents the fix. Checking it against this PMID reports the
 * best-written note in the file as a defect — the exact failure mode HYGIENE R16
 * is about, reached here within five minutes of the gate first running.
 */
export function quotesIn(note: string): string[] {
  return quotedClaimsIn(note).map((q) => q.quote);
}

/**
 * A PMID written INSIDE the prose rather than in a `source_pmid` field.
 *
 * Every stub record added on 2026-09-26 cites this way — `PMID:22327401
 * verbatim: "…"` — because a record with no authored PK has no `pk[route]` block
 * for a `source_pmid` to sit in, so its provenance lives in `mechanism` and
 * `notes`. Roughly twenty records were therefore invisible to this gate, and the
 * defect it exists to catch was found four separate times in one batch on the
 * records it COULD see. Both facts argue the same way.
 */
const INLINE_PMID = /\bPMID:?\s*(\d+)\b/g;

/** A quoted span, and the paper the clause around it names, if it names one. */
export interface NoteQuote {
  quote: string;
  /** Bare digits from an inline `PMID:n` in the same clause, else null. */
  pmid: string | null;
}

/**
 * Every quoted span a note offers as verbatim, each tagged with the PMID its own
 * clause names.
 *
 * WHY THE CLAUSE'S PMID BEATS THE ROW'S. A note routinely cites a second paper
 * mid-sentence to say where a rejected value came from, or what another group
 * calls the same thing. topiramate's row cites PMID:10768298 and carried `The
 * Supuran group calls it "low nanomolar" (PMID:12617904)` — the span belongs to
 * the paper the clause names, not to the row. Attributing it to the row reported
 * a true sentence as a defect; attributing it to the clause's own PMID checks
 * the claim actually being made. Three records carried that shape on 2026-09-27
 * and a fourth, vadadustat, was shipped by this author the day before.
 *
 * Only an UNAMBIGUOUS clause counts: two different PMIDs in one clause leave the
 * span untagged, and it falls back to the row's `source_pmid` as before, because
 * guessing which of the two a quote belongs to is exactly the judgement this
 * file refuses to make.
 *
 * Full text is honoured PER CLAUSE here, not per note. A long `notes` field
 * legitimately says "full text not retrieved" about one value while quoting
 * abstracts for five others; exempting the whole note on one phrase would hand
 * back most of what this function is for.
 */
export function quotedClaimsIn(note: string): NoteQuote[] {
  if (!CLAIMS_VERBATIM.test(note)) return [];
  const out: NoteQuote[] = [];
  for (const clause of splitClauses(note)) {
    if (!describesStoredValue(clause)) continue;
    const ids = [...new Set([...clause.matchAll(INLINE_PMID)].map((m) => m[1]!))];
    const pmid = ids.length === 1 ? ids[0]! : null;
    if (pmid !== null && citesFullText(clause)) continue;
    for (const m of clause.matchAll(QUOTED_SPAN)) {
      const quote = (m[1] ?? m[2] ?? '').trim();
      if (quote) out.push({ quote, pmid });
    }
  }
  return out;
}

/** True when the note sources its value to full text, so the abstract may be silent. */
export function citesFullText(note: string): boolean {
  return CITES_FULL_TEXT.test(note);
}

function barePmid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = value.match(/^PMID:?\s*(\d+)$/i);
  return m ? m[1]! : null;
}

/**
 * Walk a record for notes that quote their own citation.
 *
 * Generic, for the reason `allCitations` is generic: an enumerate-the-shapes
 * version silently skips every note hung somewhere it was not taught about, and
 * that has already happened once in this codebase — twenty pathway-diagram
 * citations went unchecked for as long as the enumerating version existed. A
 * claim is any object carrying BOTH a note-ish string and a `source_pmid`, so a
 * field added next year is covered by construction.
 */
function claimsIn(node: unknown, entity: string, path: string, out: QuoteClaim[]): void {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => claimsIn(v, entity, `${path}[${i}]`, out));
    return;
  }
  const rec = node as Record<string, unknown>;
  const rowPmid = barePmid(rec.source_pmid) ?? barePmid(rec.pmid);
  for (const key of ['note', 'notes', 'fu_note', 'dose_moiety_note']) {
    const text = rec[key];
    if (typeof text !== 'string') continue;
    const origin = path ? `${path}.${key}` : key;
    /*
     * Note-level full text still exempts a span that falls back to the row's
     * PMID, which is how this gate has always behaved. A span whose own clause
     * names a paper is judged on that clause alone — see `quotedClaimsIn`.
     */
    const noteExempt = citesFullText(text);
    for (const { quote, pmid } of quotedClaimsIn(text)) {
      if (pmid) out.push({ entity, origin, pmid, quote });
      else if (rowPmid && !noteExempt) out.push({ entity, origin, pmid: rowPmid, quote });
    }
  }
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v === 'object' && v !== null) claimsIn(v, entity, path ? `${path}.${k}` : k, out);
  }
}

/** Every verbatim-quote claim in the registry, with the paper each one names. */
export function verbatimClaims(registry: Registry): QuoteClaim[] {
  const out: QuoteClaim[] = [];
  for (const c of registry.compounds) claimsIn(c, c.slug, '', out);
  for (const p of registry.pathways) claimsIn(p, `${p.slug} (pathway)`, '', out);
  return out;
}

/**
 * Fold the accidents of typography out of both sides before comparing.
 *
 * Every transformation here is one that made a TRUE quote look false, and each
 * was added only after watching it do so on a real record. PubMed's abstract
 * text hard-wraps at ~80 columns, so a quote spanning a line break carries a
 * newline the note does not have. Authors paste curly quotes and en-dashes out
 * of publisher HTML while the abstract has ASCII. One side writes the micro sign
 * U+00B5 where the other has the Greek mu U+03BC: different code points,
 * identical glyphs. PubMed's plain text spells a tolerance `+/-` and a
 * reciprocal unit `min(-1)`, while a note pasted from the publisher's page has
 * `\u00b1` and `min\u207b\u00b9` \u2014 succinylcholine, terazosin, tiagabine and thiopental
 * failed on nothing else.
 *
 * Two of these go further than folding a character, because the two renderings
 * disagree about STRUCTURE, not just glyphs:
 *   - Parentheses and square brackets are deleted outright, not just trimmed.
 *     PubMed writes a reciprocal unit `h(-1)`, an isotope `[(3)h]dopamine` and a
 *     subscript `ic(50)`, where a note writes `h\u207b\u00b9`, `[3h]dopamine` and
 *     `ic50`. Same sentence, same meaning, four bracket pairs apart. Deleting
 *     them on both sides makes the pair comparable and costs nothing: no quote
 *     in this catalog is distinguished from another by a bracket alone.
 *   - `\u00b5M` becomes `microm`, matching PubMed's ASCII `microM`, and a bare
 *     `um`/`ug`/`ul` is read the same way. ketamine, cbd, cbg, tramadol,
 *     propofol, ropivacaine and thiopental all quote a micromolar affinity their
 *     abstract prints as `microM`.
 *
 * Greek letters are spelled out, because the two renderings disagree about
 * which alphabet to use: PubMed's plain text has `alpha1-adrenoceptor` where
 * risperidone's note pasted `\u03b11-adrenoceptor`. The Greek mu is the exception
 * and is read in context \u2014 `\u03bcM` is a unit and becomes `microm`, while
 * `\u03bc-opioid` is a receptor and becomes `mu-opioid`, which is how both
 * literatures write them.
 *
 * WHITESPACE IS DELETED, not collapsed, which is the single most effective line
 * here. PubMed hard-wraps mid-token, so `K(i)=4.2 nM` arrives as `K` then a
 * newline then `(i)=4.2 nM`, and no amount of space-collapsing rejoins it;
 * aripiprazole's three occupancy quotes failed on nothing else. Spacing around
 * `+/-` and `%` is equally unstable between the renderings (`35.9 +/- 4.2` vs
 * `35.9 +/-4.2`, `47%` vs `47 %`). The tilde is folded for the same reason: an
 * approximation sign arrives from the publisher as U+223C and from a keyboard as
 * ASCII `~`, which is all that stood between amiodarone's note and its abstract. At a 12-character floor, a spurious match
 * across a word boundary is not a real risk, and every quote this recovers is a
 * true one.
 *
 * What is deliberately NOT folded: an abbreviation the note contracted. PubMed
 * prints `95% confidence interval [CI]` where fentanyl's and fluvoxamine's notes
 * write `95% CI`. That is a real, if small, edit to a sentence offered as
 * verbatim, and the whole point of the gate is to show it.
 */
const SUPERSCRIPTS: Readonly<Record<string, string>> = {
  '\u2070': '0',
  '\u00b9': '1',
  '\u00b2': '2',
  '\u00b3': '3',
  '\u2074': '4',
  '\u2075': '5',
  '\u2076': '6',
  '\u2077': '7',
  '\u2078': '8',
  '\u2079': '9',
  '\u207b': '-',
};

const GREEK: Readonly<Record<string, string>> = {
  '\u03b1': 'alpha',
  '\u03b2': 'beta',
  '\u03b3': 'gamma',
  '\u03b4': 'delta',
  '\u03ba': 'kappa',
  '\u03bc': 'mu',
  '\u03c3': 'sigma',
  '\u03c4': 'tau',
};

export function normalizeForMatch(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u207b\u2070\u00b9\u00b2\u00b3\u2074-\u2079]/g, (ch) => SUPERSCRIPTS[ch] ?? ch)
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .replace(/[\u223c\u02dc]/g, '~')
      .replace(/\u00b5/g, 'micro')
      .replace(/\u03bc(?=\s*[mgl])/g, 'micro')
      .replace(/[\u03b1\u03b2\u03b3\u03b4\u03ba\u03bc\u03c3\u03c4]/g, (ch) => GREEK[ch] ?? ch)
      .replace(/\u00b1/g, '+/-')
      /*
       * A vulgar fraction against its spelled-out form. PubMed prints
       * perampanel's steady-state half-life as `mean t\u00bd, 109 h` while the note
       * writes `t1/2`, which is how every other record in this catalog writes it.
       * Same symbol, two renderings, and nothing else stood between them.
       */
      .replace(/\u00bd/g, '1/2')
      .replace(/\u00bc/g, '1/4')
      .replace(/\u00be/g, '3/4')
      /*
       * A DECIMAL POINT SET AS A MIDDLE DOT, which is Lancet house style:
       * survodutide's phase 2 abstract prints `0\u00b76, 2\u00b74, 3\u00b76, or 4\u00b78 mg` where
       * the note has `0.6, 2.4`. Folded only BETWEEN DIGITS, because U+00B7 is
       * also an ordinary separator elsewhere and this gate should not quietly
       * equate `A\u00b7B` with `A.B` outside a number.
       */
      .replace(/(?<=\d)[\u00b7\u22c5](?=\d)/g, '.')
      .replace(/[()[\]]/g, '')
      .replace(/\bu([mgl])\b/g, 'micro$1')
      .replace(/\s+/g, '')
  );
}

/** An author's elision inside a quote. Each side of it must still be present. */
const ELISION = /\s*(?:\.\.\.|…)\s*/;

/**
 * Is this quote in this abstract?
 *
 * Elisions are honoured rather than rejected: a note quoting `"the Kd … was 4.6
 * nM"` is making a claim about two fragments and their order, and holding an
 * author to the full sentence would push them toward quoting less.
 */
export function quoteFound(quote: string, abstract: string): boolean {
  const hay = normalizeForMatch(abstract);
  const parts = quote
    .split(ELISION)
    .map(normalizeForMatch)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return false;
  let from = 0;
  for (const part of parts) {
    const at = hay.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}

export const EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

/**
 * Ids per EFETCH request. Far below ESummary's 200: an abstract is a thousand
 * times the size of a summary record, and NCBI serves a large multi-record
 * `rettype=abstract` request slowly enough to time out.
 */
export const EFETCH_BATCH = 20;

export function efetchUrl(pmids: readonly string[]): string {
  return `${EFETCH_URL}?db=pubmed&id=${pmids.join(',')}&rettype=abstract&retmode=text`;
}

/**
 * Split one `rettype=abstract` response into its records.
 *
 * The format is not a data format — it is the citation display, and the only
 * machine-readable thing in it is the `PMID: 8469419 [Indexed for MEDLINE]` line
 * that ENDS each record. So records are accumulated forward and closed by that
 * line, rather than split on the `1. ` ordinals, which also match a numbered
 * sentence inside an abstract body.
 */
export function splitAbstracts(text: string): Map<string, string> {
  const out = new Map<string, string>();
  let buffer: string[] = [];
  for (const line of text.split('\n')) {
    const end = line.match(/^PMID:\s*(\d+)\b/);
    if (end) {
      out.set(end[1]!, buffer.join('\n'));
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  return out;
}
