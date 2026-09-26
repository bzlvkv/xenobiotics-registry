/**
 * pubmed.ts — reading NCBI E-utilities, once.
 *
 * PMID verification happens in two places and has to mean the same thing in
 * both: `scripts/verify-registry.ts` sweeps the whole catalog from Node, and
 * `/admin` checks the citations on one compound from the browser as a curator
 * edits it. Same endpoint, same 200-id batch ceiling, same verdict.
 *
 * They each had their own copy of the ESummary record shape and the code that
 * turns it into a bibliographic row — 26 identical lines, which is a citation
 * formatter that could drift into two opinions about what a paper is called.
 * It lives here because verifying a PMID is registry-domain work, and both
 * callers already depend on `@xeno/registry`.
 *
 * Deliberately NOT here: the fetching. The Node sweep batches 2,500 ids with a
 * rate-limited loop and writes through PostgREST with a service key; the
 * browser checks a handful and writes as the signed-in curator. Those are
 * different enough that sharing them would mean a function with a mode flag.
 */

/** One record as ESummary returns it. Every field is optional — a dead id comes
 *  back as `{ uid, error }` and nothing else. */
export interface EsummaryRecord {
  uid?: string;
  error?: string;
  title?: string;
  pubdate?: string;
  source?: string;
  authors?: Array<{ name?: string }>;
  elocationid?: string;
  articleids?: Array<{ idtype?: string; value?: string }>;
}

export interface EsummaryResponse {
  result?: Record<string, EsummaryRecord>;
}

/** The bibliographic detail of a verdict. A PMID with a title and a journal
 *  beside it is a citation a curator can sanity-check at a glance; a bare
 *  nine-digit number is not. */
export interface PubmedDetail {
  title: string | null;
  year: number | null;
  authors: string[];
  journal: string | null;
  doi: string | null;
}

/** `true` when ESummary resolved this id to the paper we asked for. A record
 *  carrying an `error`, or one whose `uid` does not echo the request, is a
 *  dead identifier however much else it contains. */
export function resolved(pmid: string, rec: EsummaryRecord | undefined): boolean {
  return !!rec && !rec.error && rec.uid === pmid;
}

/** ESummary record → the columns `registry.reference` stores. */
export function describePubmed(rec: EsummaryRecord | undefined): PubmedDetail {
  const yearMatch = rec?.pubdate?.match(/\b(1[89]\d{2}|20\d{2})\b/);
  const doi =
    rec?.articleids?.find((a) => a.idtype === 'doi')?.value ??
    (rec?.elocationid?.startsWith('doi:') ? rec.elocationid.slice(4).trim() : null);
  return {
    title: rec?.title?.trim() || null,
    year: yearMatch ? Number(yearMatch[1]) : null,
    authors: (rec?.authors ?? []).map((a) => a.name ?? '').filter(Boolean),
    journal: rec?.source?.trim() || null,
    doi: doi || null,
  };
}

/** The ESummary URL for a batch. 200 ids is NCBI's documented ceiling. */
export const ESUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
export const ESUMMARY_BATCH = 200;

export function esummaryUrl(pmids: readonly string[]): string {
  return `${ESUMMARY_URL}?db=pubmed&id=${pmids.join(',')}&retmode=json`;
}
