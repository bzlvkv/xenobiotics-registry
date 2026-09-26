/**
 * verify-registry.ts — resolve every PMID the catalog cites against PubMed, and
 * record the verdict.
 *
 * WHAT CHANGED FROM v8. Two things, and both were the difference between a
 * check and a claim.
 *
 * It reads the LIVE catalog out of Postgres rather than the cutover snapshot on
 * disk, so it verifies what is about to be published rather than what was true
 * in September. `--from-json` still reads the snapshot.
 *
 * And it WRITES. In v8 this printed OK/DEAD lines and set an exit code, so the
 * verdict lived in a terminal scrollback that no longer exists. 0002 gives every
 * PMID a `status` and a `verified_at` for exactly this, and defines
 * `verified_at is null` as NOT YET CHECKED — which is what all 2,506 rows in the
 * v12 database say today. An unverified citation should read as unverified in
 * the authoring UI, and it cannot unless something stores the answer.
 *
 * `--write` persists. Without it the run reports and changes nothing.
 *
 * WHAT THIS GATE CANNOT DO, restated because it is the one people forget: it
 * proves the identifier resolves to a real, correctly-attributed paper. It does
 * NOT prove the abstract states the value hung on it. Thirty-plus such cases —
 * a real paper cited for a number it never mentions — were the single largest
 * defect class found in v8's catalog. Only a human reading the abstract closes
 * that gap, which is why `authoring_gap` exists.
 *
 * Network discipline: public NCBI E-utilities, no API key; 200 PMIDs per
 * request; ~3 req/s; 5-attempt exponential backoff on 5xx and network errors.
 *
 * Run: `pnpm registry:verify [--write] [--from-json]`
 */

import { loadCatalog, originFromArgv } from './registry-source.ts';
import {
  describePubmed,
  esummaryUrl,
  resolved,
  type EsummaryResponse,
} from '../packages/registry/src/pubmed.ts';

const BATCH_SIZE = 200;
const BATCH_DELAY_MS = 350; // ~3 req/s ceiling per NCBI rules without an API key
const MAX_RETRIES = 5;

// ─────────────────────────────────────────────────────────────────────────────

interface Citation {
  pmid: string;
  /** Where in the document the citation sits, as a JSON-ish path. Printed
   *  beside a DEAD verdict so the curator can go straight to the cell. */
  origin: string;
}

/**
 * A PMID out of a `refs[]` entry, which is free-form and must carry the prefix.
 * A bare number there could be anything, and `refs` does also hold the odd DOI.
 */
function parseRef(s: string): string | null {
  const m = s.match(/^PMID:?\s*(\d+)$/i);
  return m ? m[1]! : null;
}

/**
 * A PMID out of a field literally NAMED `pmid` or `source_pmid`, where the key
 * has already asserted what the value is. Both spellings in the catalog are
 * accepted, because the catalog genuinely uses both: `refs[]` and
 * `source_pmid` write "PMID:17604717", while `diagram.edges[].pmid` writes a
 * bare "8645157".
 *
 * That difference is why the twenty citations on the PI3K/Akt diagram had never
 * been verified. The strict parser rejected every bare id and returned null,
 * which reads identically to "this field holds no citation" — so they were not
 * reported as unparseable, they were simply not counted. The seed's own walker
 * strips an optional prefix and takes the rest, which is why the reference table
 * had 2,506 rows to the verifier's 2,487, and why that gap was the clue.
 */
function parsePmidField(s: string): string | null {
  const m = s.match(/^(?:PMID:?\s*)?(\d+)$/i);
  return m ? m[1]! : null;
}

/**
 * Every PMID cited anywhere in a document, found by walking it.
 *
 * This used to enumerate the shapes it knew about — `refs[]`, `pk[route]`,
 * `interactions[]`, `receptor_occupancy[]`, `effect_compartment`, and for
 * pathways `refs[]` and `steps[]`. Which meant it silently skipped every
 * citation hung anywhere else, and it was already skipping some: the twenty
 * papers cited by `pi3k_akt_signaling.diagram.edges[].pmid` had never been
 * checked, and on the enumerate-the-shapes design never would be. They are
 * exactly the citations a reader is most likely to click, since they sit on the
 * arrows of a rendered diagram.
 *
 * So it walks instead, the same way `seed-registry.ts` does when it collects
 * PMIDs to insert — which is why the seed found 2,506 references while the
 * verifier could only account for 2,487. A citation shape someone adds next
 * year is covered by construction rather than by remembering to come back here.
 */
function collectCitations(root: unknown, label: string): Citation[] {
  const out: Citation[] = [];
  const walk = (node: unknown, path: string): void => {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const here = `${path}.${k}`;
      if ((k === 'source_pmid' || k === 'pmid') && typeof v === 'string') {
        const pmid = parsePmidField(v);
        if (pmid) out.push({ pmid, origin: here });
      } else if (k === 'refs' && Array.isArray(v)) {
        v.forEach((r, i) => {
          if (typeof r !== 'string') return;
          const pmid = parseRef(r);
          if (pmid) out.push({ pmid, origin: `${here}[${i}]` });
        });
      } else {
        walk(v, here);
      }
    }
  };
  walk(root, label);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// NCBI ESummary
// ─────────────────────────────────────────────────────────────────────────────

/** Upsert the verdicts. One request per chunk, `resolution=merge-duplicates`, so
 *  a re-run refreshes `verified_at` rather than erroring on the primary key. */
async function persist(rows: Record<string, unknown>[]): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('--write needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  for (let i = 0; i < rows.length; i += 200) {
    const res = await fetch(`${url}/rest/v1/reference?on_conflict=pmid`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'registry',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows.slice(i, i + 200)),
    });
    if (!res.ok) throw new Error(`reference upsert: ${res.status} ${await res.text()}`);
  }
}

async function fetchBatch(pmids: string[]): Promise<EsummaryResponse> {
  const url = esummaryUrl(pmids);
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => '')}`);
      return (await res.json()) as EsummaryResponse;
    } catch (e) {
      lastErr = e;
      const wait = 250 * Math.pow(2, attempt);
      await sleep(wait);
    }
  }
  throw new Error(`ESummary failed after ${MAX_RETRIES} attempts: ${String(lastErr)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const catalog = await loadCatalog(originFromArgv());
  console.log(`verify-registry: reading ${catalog.origin}`);

  const { compounds, pathways } = catalog;
  const citations = [
    ...compounds.flatMap((c) => collectCitations(c, c.slug)),
    ...pathways.flatMap((p) => collectCitations(p, `${p.slug} (pathway)`)),
  ];

  // Dedupe by PMID — checking the same id twice wastes the rate limit.
  const byPmid = new Map<string, Citation[]>();
  for (const c of citations) {
    (byPmid.get(c.pmid) ?? byPmid.set(c.pmid, []).get(c.pmid)!).push(c);
  }
  const uniquePmids = [...byPmid.keys()];

  console.log(
    `Verifying ${uniquePmids.length} unique PMIDs across ${compounds.length} compounds + ${pathways.length} pathways` +
      `${write ? ' (persisting to registry.reference)' : ' (report only — pass --write to persist)'}...`,
  );

  const dead: string[] = [];
  const ok: string[] = [];
  const rows: Record<string, unknown>[] = [];
  const checkedAt = new Date().toISOString();

  for (let i = 0; i < uniquePmids.length; i += BATCH_SIZE) {
    const batch = uniquePmids.slice(i, i + BATCH_SIZE);
    const resp = await fetchBatch(batch);
    const result = resp.result ?? {};
    for (const pmid of batch) {
      const rec = result[pmid];
      const ok_ = resolved(pmid, rec);
      (ok_ ? ok : dead).push(pmid);
      // A dead id gets a row too. "This was checked and did not resolve" is a
      // finding worth keeping; leaving the row null would say "never checked",
      // which is a different and much weaker statement.
      rows.push({
        pmid,
        status: ok_ ? 'ok' : 'dead',
        verified_at: checkedAt,
        ...describePubmed(ok_ ? rec : undefined),
        data: { cited_by: (byPmid.get(pmid) ?? []).map((c) => c.origin) },
      });
    }
    if (i + BATCH_SIZE < uniquePmids.length) await sleep(BATCH_DELAY_MS);
  }

  for (const pmid of dead) {
    for (const o of byPmid.get(pmid) ?? []) console.error(`  DEAD  PMID:${pmid}  <-  ${o.origin}`);
  }

  if (write) {
    await persist(rows);
    console.log(`wrote ${rows.length} rows to registry.reference`);
  }

  console.log(`\n${ok.length} verified · ${dead.length} dead · ${uniquePmids.length} total`);
  if (dead.length > 0) {
    console.error(
      `\n${dead.length} PMID${dead.length === 1 ? '' : 's'} did not resolve against PubMed. Fix or remove the citation${dead.length === 1 ? '' : 's'} above and re-run.`,
    );
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error('verify-registry failed:', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
