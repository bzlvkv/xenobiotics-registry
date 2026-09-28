/**
 * pmc.ts — the full-text path, for the provenance that abstracts do not carry.
 *
 * WHY THIS EXISTS. `pubmed.ts` fetches abstracts, and abstracts are where the
 * 2026-09-28 PD-coverage screen hit a wall: an affinity constant (Ki, Kd, EC50)
 * is almost never in the abstract, it is in a table in the full text, and Rule 1
 * forbids citing a source not fetched in this session. A batch of ~25 abstract
 * searches for occupancy affinities yielded ONE citable value. The bottleneck was
 * never the candidate supply; it was the source tier.
 *
 * PubMed Central's open-access subset is that source tier, reachable two ways:
 *   1. PMID -> PMCID, from the article's OWN PubMed record. The XML carries the
 *      article's PMCID as the first `<ArticleId IdType="pmc">`; every later one is
 *      a reference-list entry, so `firstPmcId` takes the first and no other.
 *   2. PMCID -> full text, via the BioC API, which returns the body AND tables as
 *      plain-text passages — which is exactly where the affinity numbers live.
 *
 * WHAT IT DOES NOT CHANGE. A value read from a fetched full-text table is a
 * fetched source, so it satisfies Rule 1; but it is still governed by everything
 * else. It needs a verbatim quote of the sentence or cell (`WORKFLOW` full-text
 * rule), the named compound must be the row's subject and not a comparator (R2),
 * and `verify:quotes` cannot see it because the text is not the abstract — so the
 * quote is checked by a human, and the note says "full text" so the exemption is
 * visible. Full text widens what can be sourced; it does not loosen how.
 *
 * NOT EVERY PMC ARTICLE IS FETCHABLE. Being indexed in PMC is not the same as
 * being in the open-access subset: PMC1576008 (Baker 2005, the β-blocker affinity
 * table) is in PMC and its XML download is publisher-blocked. `biocUrl` is only
 * useful for the OA subset, and a non-OA id comes back as non-JSON, which
 * `passagesFromBioC` reports rather than mistaking for empty text.
 *
 * Pure, like `pubmed.ts`: URL construction and parsing here, the network in the
 * script. Nothing in this file fetches.
 */

/** Bare PMCID digits, no `PMC` prefix, as the BioC path wants them. */
export type PmcId = string;

/**
 * The article's OWN PMCID from its PubMed record XML, or null when it is not in
 * PMC. The record lists the article's PMCID first and then one per cited
 * reference, so only the first `<ArticleId IdType="pmc">` is the article itself;
 * taking any later one would fetch a reference instead of the paper.
 */
export function firstPmcId(pubmedXml: string): PmcId | null {
  const m = pubmedXml.match(/<ArticleId IdType="pmc">\s*PMC(\d+)/i);
  return m ? m[1]! : null;
}

/**
 * The BioC full-text URL for a PMCID. The `unicode` form returns UTF-8 text
 * rather than escaped entities, which is what a reader wants to quote from. This
 * is a different service from E-utilities: it takes no `api_key` and has its own
 * rate limit, so the script paces itself rather than sending a key that does
 * nothing here.
 */
export function biocUrl(pmcid: PmcId): string {
  const bare = pmcid.replace(/^PMC/i, '');
  return `https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/PMC${bare}/unicode`;
}

/** One block of full text: a section name where BioC gives one, and its text. */
export interface Passage {
  section: string;
  text: string;
}

/**
 * The full text as passages, or a `reason` when the id is not fetchable. BioC
 * returns a JSON array of collections for an OA article and an HTML error page
 * for anything else (not in the OA subset, publisher-blocked, or rate-limited),
 * so a parse failure is reported, never silently read as an empty paper.
 */
export function passagesFromBioC(body: string): { passages: Passage[] } | { reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    const rate = /too many requests/i.test(body);
    return {
      reason: rate
        ? 'rate-limited by BioC; slow down and retry'
        : 'not in the PMC open-access subset (BioC returned no JSON)',
    };
  }
  if (!Array.isArray(parsed)) return { reason: 'unexpected BioC shape (not an array)' };
  const passages: Passage[] = [];
  for (const collection of parsed as Array<Record<string, unknown>>) {
    const docs = (collection.documents as Array<Record<string, unknown>>) ?? [];
    for (const doc of docs) {
      for (const p of (doc.passages as Array<Record<string, unknown>>) ?? []) {
        const text = typeof p.text === 'string' ? p.text : '';
        if (!text) continue;
        const infons = (p.infons as Record<string, unknown>) ?? {};
        const section =
          typeof infons.section_type === 'string'
            ? infons.section_type
            : typeof infons.type === 'string'
              ? infons.type
              : '';
        passages.push({ section, text });
      }
    }
  }
  if (!passages.length) return { reason: 'BioC returned JSON but no text passages' };
  return { passages };
}

/**
 * Passages whose text mentions `term` (case-insensitive), for pointing an author
 * at the paragraphs and table cells that name a compound without making them read
 * 36,000 characters. It is a locator, not a matcher: the author still reads the
 * passage and quotes it, because whether a number belongs to the named compound
 * or a comparator is the judgement R2 exists for and this cannot make.
 */
export function passagesMentioning(passages: readonly Passage[], term: string): Passage[] {
  const needle = term.toLowerCase();
  return passages.filter((p) => p.text.toLowerCase().includes(needle));
}
