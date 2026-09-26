/**
 * verify-citations.ts — the network gate: every PMID this registry cites,
 * resolved against NCBI ESummary.
 *
 * WHAT THIS PROVES, AND THE MUCH LARGER THING IT DOES NOT. It proves an
 * identifier RESOLVES: that PMID:17604717 is a real record, correctly attributed,
 * and that the id in the file is not a transposed digit or a number someone
 * remembered. It CANNOT prove that the abstract states the value hung on it. A
 * real paper cited for a number it never mentions passes this gate every single
 * time, and thirty-plus such cases were the single largest defect class ever
 * found in this dataset. Only a human — or an AI that has actually read the
 * full text — closes that gap. A green run here means "no dead links", never
 * "the numbers are sourced". Every document that describes this gate must keep
 * saying so.
 *
 * WHAT IT WALKS. `allCitations` walks the whole document rather than
 * enumerating the shapes it knows about, because the enumerate-them version
 * silently skipped every citation hung anywhere it had not been taught. It was
 * already skipping some: twenty papers cited on `pathway.diagram.edges[].pmid`
 * had never been checked once, and on that design never would be — and those are
 * precisely the citations a reader is most likely to click, since they sit on the
 * arrows of a rendered diagram. A citation shape someone adds next year is
 * covered by construction instead of by remembering to come back here.
 *
 * WHAT IT NO LONGER DOES. An earlier version of this script also wrote every
 * verdict into a Postgres `registry.reference` table behind `--write`, with a
 * Supabase service key. That database is gone, and with it the whole idea that
 * this script owns state. It reports and it sets an exit code. Nothing else.
 *
 * NETWORK DISCIPLINE. Public NCBI E-utilities, no API key: 200 ids per request
 * (their documented ceiling), ~3 req/s, 5-attempt exponential backoff on 5xx and
 * transport errors, deduped by pmid so the same id never spends the rate limit
 * twice. The full sweep is ~2,500 unique ids, so it takes a couple of minutes;
 * `--limit` exists for the smoke test you actually want while iterating.
 *
 * Usage:
 *   pnpm verify                 # the whole catalog, the real gate
 *   pnpm verify --limit 25      # first 25 unique ids — is the network working
 *   pnpm verify --json          # machine-readable summary, for an agent
 *
 * Exit 1 if any id is dead.
 */

import {
  ESUMMARY_BATCH,
  allCitations,
  esummaryUrl,
  resolved,
  type Citation,
  type EsummaryResponse,
  type Registry,
} from '@xeno/registry';
import { DATA_DIR, readRegistry } from '@xeno/registry/read';

const BATCH_DELAY_MS = 350; // ~3 req/s, the ceiling NCBI allows without a key
const MAX_RETRIES = 5;

const CAVEAT =
  'This gate proves each identifier resolves to a real, correctly-attributed record. ' +
  'It cannot prove the abstract states the value cited to it — the largest defect ' +
  'class in this dataset. Only reading the paper closes that gap.';

const USAGE = `usage: tsx scripts/verify-citations.ts [--limit N] [--json]`;
// `pnpm verify | head` closes stdout early; that is the reader leaving, not a
// failure, and a stack trace from `node:net` in its place is pure noise.
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

interface Options {
  limit: number | null;
  json: boolean;
}

function parseArgs(argv: readonly string[]): Options {
  let limit: number | null = null;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--json') {
      json = true;
    } else if (arg === '--limit' || arg.startsWith('--limit=')) {
      const raw = arg.startsWith('--limit=') ? arg.slice('--limit='.length) : argv[++i];
      const n = Number(raw);
      if (!Number.isInteger(n) || n <= 0) fatal(`--limit needs a positive integer, got ${raw}`);
      limit = n;
    } else if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      fatal(`unknown argument ${arg}`);
    }
  }
  return { limit, json };
}

function fatal(message: string): never {
  console.error(`verify-citations: ${message}`);
  console.error(USAGE);
  process.exit(2);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBatch(pmids: readonly string[]): Promise<EsummaryResponse> {
  const url = esummaryUrl(pmids);
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => '')}`);
      return (await res.json()) as EsummaryResponse;
    } catch (err) {
      lastErr = err;
      await sleep(250 * Math.pow(2, attempt));
    }
  }
  throw new Error(`ESummary failed after ${MAX_RETRIES} attempts: ${String(lastErr)}`);
}

/** pmid -> every JSON path that cites it, so a dead verdict names the cells to
 *  fix rather than just the number that is broken. */
function byPmid(citations: readonly Citation[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const c of citations) {
    const origins = out.get(c.pmid);
    if (origins) origins.push(c.origin);
    else out.set(c.pmid, [c.origin]);
  }
  return out;
}

async function main(): Promise<void> {
  const started = performance.now();
  const opts = parseArgs(process.argv.slice(2));
  // With --json, stdout carries only the JSON document; progress goes to stderr.
  const log = (line: string): void => {
    if (opts.json) console.error(line);
    else console.log(line);
  };

  let registry: Registry;
  try {
    registry = readRegistry();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`verify-citations: could not load the registry from ${DATA_DIR}\n  ${detail}`);
    process.exitCode = 1;
    return;
  }

  const citations = allCitations(registry);
  const cited = byPmid(citations);
  const unique = [...cited.keys()];
  const targets = opts.limit === null ? unique : unique.slice(0, opts.limit);

  log(
    `verify-citations: read ${registry.compounds.length} compounds · ` +
      `${registry.pathways.length} pathways from ${DATA_DIR}`,
  );
  log(
    `verify-citations: ${citations.length} citations, ${unique.length} unique PMIDs` +
      (opts.limit === null
        ? ''
        : ` — checking the first ${targets.length} (--limit ${opts.limit})`),
  );
  log(`verify-citations: ${CAVEAT}`);

  const ok: string[] = [];
  const dead: string[] = [];

  for (let i = 0; i < targets.length; i += ESUMMARY_BATCH) {
    const batch = targets.slice(i, i + ESUMMARY_BATCH);
    const response = await fetchBatch(batch);
    const result = response.result ?? {};
    for (const pmid of batch) {
      (resolved(pmid, result[pmid]) ? ok : dead).push(pmid);
    }
    if (i + ESUMMARY_BATCH < targets.length) {
      log(`  … ${Math.min(i + ESUMMARY_BATCH, targets.length)}/${targets.length}`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  const ms = Math.round(performance.now() - started);

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          read: {
            dir: DATA_DIR,
            compounds: registry.compounds.length,
            pathways: registry.pathways.length,
          },
          citations: { total: citations.length, unique: unique.length, checked: targets.length },
          limit: opts.limit,
          ok: ok.length,
          dead: dead.map((pmid) => ({ pmid, cited_by: cited.get(pmid) ?? [] })),
          verdict: dead.length === 0 ? 'pass' : 'fail',
          elapsed_ms: ms,
          caveat: CAVEAT,
        },
        null,
        2,
      ),
    );
  } else {
    for (const pmid of dead) {
      for (const origin of cited.get(pmid) ?? []) {
        console.error(`  DEAD  PMID:${pmid}  <-  ${origin}`);
      }
    }
    console.log('');
    console.log(
      `verify-citations: ${ok.length} resolved · ${dead.length} dead · ` +
        `${targets.length} checked of ${unique.length} unique (${ms} ms) — ` +
        `${dead.length === 0 ? 'PASS' : 'FAIL'}`,
    );
    if (opts.limit !== null && dead.length === 0) {
      console.log(
        `verify-citations: --limit was set, so this proves nothing about the ` +
          `${unique.length - targets.length} ids it skipped.`,
      );
    }
  }

  if (dead.length > 0) {
    console.error(
      `\nverify-citations: ${dead.length} PMID${dead.length === 1 ? '' : 's'} did not resolve. ` +
        `Fix or remove the citation${dead.length === 1 ? '' : 's'} above and re-run.`,
    );
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error('verify-citations failed:', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
