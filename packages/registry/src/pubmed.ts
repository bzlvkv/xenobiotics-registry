/**
 * pubmed.ts — reading NCBI E-utilities, once.
 *
 * PMID verification happens in more than one place and has to mean the same
 * thing in each: a script sweeps the whole catalog from Node, and a browser
 * surface can check the citations on one compound as a curator reads it. Same
 * endpoint, same 200-id batch ceiling, same verdict.
 *
 * Each had its own copy of the ESummary record shape and the code that turns it
 * into a bibliographic row — which is a citation formatter that could drift into
 * two opinions about what a paper is called.
 *
 * Deliberately NOT here: the fetching, the rate limiting and the retry policy. A
 * 2,500-id sweep with a 350 ms pacing loop and a browser checking six ids are
 * different enough that sharing them would mean a function with a mode flag.
 * This module is pure: URLs in, verdicts out, no network.
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
 *  carrying an `error`, or one whose `uid` does not echo the request, is a dead
 *  identifier however much else it contains. */
export function resolved(pmid: string, rec: EsummaryRecord | undefined): boolean {
  return !!rec && !rec.error && rec.uid === pmid;
}

/** ESummary record → the bibliographic columns worth storing. */
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

export const ESUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
/** NCBI's documented ceiling for ids in one ESummary request. */
export const ESUMMARY_BATCH = 200;

export function esummaryUrl(pmids: readonly string[]): string {
  return `${ESUMMARY_URL}?db=pubmed&id=${pmids.join(',')}&retmode=json`;
}

/**
 * WHAT A PMID CHECK CAN AND CANNOT PROVE, restated here because it is the thing
 * people forget: resolving an identifier proves the paper exists and is correctly
 * attributed. It does NOT prove the abstract states the value hung on it. Thirty
 * or more such cases — a real paper cited for a number it never mentions — were
 * the single largest defect class in the catalog's history, and only a human
 * reading the source closes that gap. That is what the skip ledger in
 * `data/GAPS.md` is for.
 */
