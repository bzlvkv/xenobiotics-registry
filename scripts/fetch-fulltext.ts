/**
 * fetch-fulltext.ts — read a paper's open-access full text, so an author can
 * quote the table an abstract does not print.
 *
 * The 2026-09-28 PD-coverage screen established that affinity constants live in
 * full-text tables, not abstracts, and Rule 1 forbids citing a source not fetched
 * this session. This is the fetch. Give it PMIDs; for each it finds the article's
 * own PMCID from its PubMed record, pulls the BioC full text (body and tables),
 * and prints it — with the passages naming a compound surfaced first when you pass
 * `--mentions`, so you can go straight to the cell that carries the number.
 *
 * What it does NOT do is lower the bar. A value read here still needs a verbatim
 * quote, the compound must be the subject and not a comparator (R2), and because
 * the text is not the abstract the quote is checked by you, not `verify:quotes` —
 * so the note says "full text" and names the table, which is the exemption
 * WORKFLOW already defines. See `packages/registry/src/pmc.ts` for the why.
 *
 * NOT EVERY PMC PAPER IS FETCHABLE. Indexed in PMC is not the same as in the
 * open-access subset; a publisher-blocked or non-OA id is reported as such, never
 * mistaken for an empty paper. `not in PMC` means no full text exists to fetch and
 * the abstract is all there is.
 *
 * Usage:
 *   pnpm fetch:fulltext 29661838                     # one paper, whole body
 *   pnpm fetch:fulltext 29661838 --mentions MitoQ    # passages naming MitoQ first
 *   pnpm fetch:fulltext 15655528 18187929            # several papers
 *
 * Network: E-utilities efetch for the PubMed record (honours NCBI_API_KEY), then
 * the BioC service for full text (a different host, no key, its own limit — so a
 * one-second pace between BioC calls, with backoff on a rate-limit).
 */

import {
  biocUrl,
  firstPmcId,
  passagesFromBioC,
  passagesMentioning,
  type Passage,
} from '../packages/registry/src/pmc';

const API_KEY = process.env.NCBI_API_KEY?.trim() || undefined;
const EFETCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const MAX_RETRIES = 5;
const BIOC_PACE_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getText(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      await sleep(500 * Math.pow(2, attempt));
    }
  }
  throw new Error(`fetch failed after ${MAX_RETRIES} attempts: ${String(lastErr)}`);
}

async function pmcidFor(pmid: string): Promise<string | null> {
  const url = `${EFETCH}?db=pubmed&id=${pmid}&rettype=xml&retmode=xml${API_KEY ? `&api_key=${API_KEY}` : ''}`;
  return firstPmcId(await getText(url));
}

function render(passages: readonly Passage[], mentions: string | null): string {
  const chosen = mentions ? passagesMentioning(passages, mentions) : passages;
  if (mentions && !chosen.length) {
    return `  (no passage mentions "${mentions}" — printing nothing; try a shorter or differently-cased term)`;
  }
  return chosen.map((p) => `  [${p.section || 'text'}] ${p.text}`).join('\n\n');
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const mi = argv.indexOf('--mentions');
  const mentions = mi >= 0 ? (argv[mi + 1] ?? null) : null;
  const mentionValueIdx = mi >= 0 ? mi + 1 : -1;
  const pmids = argv.filter((a, i) => /^\d+$/.test(a) && i !== mentionValueIdx);
  if (!pmids.length) {
    console.error('usage: pnpm fetch:fulltext <pmid> [<pmid>...] [--mentions <term>]');
    process.exit(2);
  }
  console.log(API_KEY ? 'fetch-fulltext: NCBI_API_KEY found' : 'fetch-fulltext: no NCBI_API_KEY');
  for (const pmid of pmids) {
    console.log(`\n===== PMID:${pmid} =====`);
    let pmcid: string | null;
    try {
      pmcid = await pmcidFor(pmid);
    } catch (err) {
      console.log(`  could not read the PubMed record: ${String(err)}`);
      continue;
    }
    if (!pmcid) {
      console.log('  not in PMC — no full text to fetch; the abstract is all there is.');
      continue;
    }
    console.log(`  PMC${pmcid} — fetching BioC full text`);
    await sleep(BIOC_PACE_MS);
    let body: string;
    try {
      body = await getText(biocUrl(pmcid));
    } catch (err) {
      console.log(`  BioC fetch failed: ${String(err)}`);
      continue;
    }
    const result = passagesFromBioC(body);
    if ('reason' in result) {
      console.log(`  ${result.reason}`);
      continue;
    }
    console.log(render(result.passages, mentions));
  }
}

main().catch((err) => {
  console.error('fetch-fulltext failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
