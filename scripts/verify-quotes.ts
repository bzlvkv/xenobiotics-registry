/**
 * verify-quotes.ts — the second network gate: every verbatim quote this registry
 * writes, checked against the abstract it names.
 *
 * WHY THIS EXISTS BESIDE `verify-citations.ts`. That gate resolves identifiers
 * and says so in its own header: it cannot prove the abstract states the value
 * cited to it, and that class — a real, on-topic, correctly-attributed paper
 * hung on a number it never mentions — was 149 of the 216 problems the
 * 2026-06-28 audit confirmed. The stated reason no gate could close it is that
 * the paper's text is not in the repo.
 *
 * But the CLAIM is in the repo. HYGIENE asks every sourced value to carry the
 * sentence it came from, and 195 records do. A quote is falsifiable against the
 * document it names, and this script fetches that document and decides. Where it
 * fails, one of three things is true and all three are defects: the quote was
 * paraphrased into existence, it came from a different paper, or the PMID is
 * wrong. It does not need to know which — it prints both strings and a human
 * sees it in a second.
 *
 * WHAT A PASS DOES NOT MEAN. That the sentence is in the abstract, and nothing
 * more. Not that the number in it is the number stored in the field, not that
 * the compound is the paper's subject rather than a comparator, and not that a
 * record without a quote is sound — a note that claims nothing is never checked
 * here and is exactly where the remaining defects live. This narrows the gap; it
 * does not close it.
 *
 * EXEMPT BY DESIGN: a note that says "full text". WORKFLOW requires those words
 * when a value comes from a table the abstract does not carry, and the abstract
 * is then legitimately silent. They are counted as `unchecked` and named, so the
 * exemption is visible rather than a hole.
 *
 * NETWORK DISCIPLINE. NCBI E-utilities: 20 ids per EFETCH (abstracts are large,
 * and a 200-id request times out), ~3 req/s bare or ~9 with an `NCBI_API_KEY` in
 * the environment, 5-attempt
 * exponential backoff, deduped by pmid. Roughly 130 unique papers, so a full run
 * is well under a minute.
 *
 * Usage:
 *   pnpm verify:quotes             # every claim, the real gate
 *   pnpm verify:quotes --limit 10  # first 10 papers — is the network working
 *   pnpm verify:quotes --json      # machine-readable, for an agent
 *
 * Exit 1 if any quote is missing from the abstract it names.
 */

import {
  EFETCH_BATCH,
  efetchUrl,
  quoteFound,
  splitAbstracts,
  verbatimClaims,
  type QuoteClaim,
  type Registry,
} from '@xeno/registry';
import { DATA_DIR, readRegistry } from '@xeno/registry/read';

/**
 * NCBI raises the rate ceiling from 3 to 10 requests a second for a registered
 * API key. It is read from the environment, so the gate works identically with
 * and without one and nothing about the key lives in the repository.
 *
 * 110 ms is ~9 req/s, deliberately under the 10 the key buys: NCBI throttles on
 * its own clock, not ours, and a run that trips the limit costs more in retries
 * than the margin saves. NEVER LOG A BUILT URL from here — the key travels as a
 * query parameter because NCBI accepts it no other way.
 */
const API_KEY = process.env.NCBI_API_KEY?.trim() || undefined;
const BATCH_DELAY_MS = API_KEY ? 110 : 350; // ~9 req/s with a key, ~3 without
const MAX_RETRIES = 5;

const CAVEAT =
  'A pass means the quoted sentence is in the abstract it names. It does not mean ' +
  'the stored number is the one in that sentence, nor that the compound is the ' +
  "paper's subject rather than a comparator. Notes that quote nothing are not checked.";

const USAGE = `usage: tsx scripts/verify-quotes.ts [--limit N] [--json]`;

process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

interface Options {
  limit: number | null;
  json: boolean;
}

function fatal(message: string): never {
  console.error(`verify-quotes: ${message}`);
  console.error(USAGE);
  process.exit(2);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAbstracts(pmids: readonly string[]): Promise<Map<string, string>> {
  const url = efetchUrl(pmids, API_KEY);
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text().catch(() => '')}`);
      return splitAbstracts(await res.text());
    } catch (err) {
      lastErr = err;
      await sleep(250 * Math.pow(2, attempt));
    }
  }
  throw new Error(`EFetch failed after ${MAX_RETRIES} attempts: ${String(lastErr)}`);
}

/** One line per finding: the record, the paper, and the sentence that is not in it. */
function renderMissing(claim: QuoteClaim): string {
  return (
    `  MISSING  ${claim.entity} ${claim.origin}  ->  PMID:${claim.pmid}\n` +
    `           quote: "${claim.quote}"`
  );
}

async function main(): Promise<void> {
  const started = performance.now();
  const opts = parseArgs(process.argv.slice(2));
  const log = (line: string): void => {
    if (opts.json) console.error(line);
    else console.log(line);
  };

  let registry: Registry;
  try {
    registry = readRegistry();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`verify-quotes: could not load the registry from ${DATA_DIR}\n  ${detail}`);
    process.exitCode = 1;
    return;
  }

  const claims = verbatimClaims(registry);
  const papers = [...new Set(claims.map((c) => c.pmid))];
  const targets = opts.limit === null ? papers : papers.slice(0, opts.limit);
  const wanted = new Set(targets);
  const checking = claims.filter((c) => wanted.has(c.pmid));

  log(
    `verify-quotes: read ${registry.compounds.length} compounds · ` +
      `${registry.pathways.length} pathways from ${DATA_DIR}`,
  );
  // Which rate the run used, never the key itself. A run that is slower than
  // expected should be able to say why without anyone reading the source.
  log(`verify-quotes: ${API_KEY ? 'NCBI_API_KEY found, ~9 req/s' : 'no NCBI_API_KEY, ~3 req/s'}`);
  log(
    `verify-quotes: ${claims.length} verbatim quotes over ${papers.length} papers` +
      (opts.limit === null
        ? ''
        : ` — checking the first ${targets.length} (--limit ${opts.limit})`),
  );
  log(`verify-quotes: ${CAVEAT}`);

  const abstracts = new Map<string, string>();
  for (let i = 0; i < targets.length; i += EFETCH_BATCH) {
    const batch = targets.slice(i, i + EFETCH_BATCH);
    for (const [pmid, text] of await fetchAbstracts(batch)) abstracts.set(pmid, text);
    if (i + EFETCH_BATCH < targets.length) {
      log(`  … ${Math.min(i + EFETCH_BATCH, targets.length)}/${targets.length}`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  const found: QuoteClaim[] = [];
  const missing: QuoteClaim[] = [];
  // An id EFETCH returned nothing for is not a failed quote: it is a paper this
  // run could not read, and calling it a bad quote would be the false trail the
  // GAPS ledger exists to prevent. `pnpm verify` is the gate for dead ids.
  const unfetched: QuoteClaim[] = [];
  for (const claim of checking) {
    const abstract = abstracts.get(claim.pmid);
    if (abstract === undefined) unfetched.push(claim);
    else if (quoteFound(claim.quote, abstract)) found.push(claim);
    else missing.push(claim);
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
          quotes: { total: claims.length, papers: papers.length, checked: checking.length },
          limit: opts.limit,
          found: found.length,
          missing,
          unfetched,
          verdict: missing.length === 0 ? 'pass' : 'fail',
          elapsed_ms: ms,
          caveat: CAVEAT,
        },
        null,
        2,
      ),
    );
  } else {
    for (const claim of missing) console.error(renderMissing(claim));
    for (const claim of unfetched) {
      console.error(`  UNREAD   ${claim.entity} ${claim.origin}  ->  PMID:${claim.pmid}`);
    }
    console.log('');
    console.log(
      `verify-quotes: ${found.length} quoted · ${missing.length} missing · ` +
        `${unfetched.length} unread · ${checking.length} checked of ${claims.length} ` +
        `(${ms} ms) — ${missing.length === 0 ? 'PASS' : 'FAIL'}`,
    );
    if (opts.limit !== null && missing.length === 0) {
      console.log(
        `verify-quotes: --limit was set, so this proves nothing about the ` +
          `${papers.length - targets.length} papers it skipped.`,
      );
    }
  }

  if (missing.length > 0) {
    console.error(
      `\nverify-quotes: ${missing.length} quote${missing.length === 1 ? '' : 's'} ` +
        `${missing.length === 1 ? 'is' : 'are'} not in the abstract cited beside ` +
        `${missing.length === 1 ? 'it' : 'them'}. Either the quote came from somewhere ` +
        `else (say "full text" and cite the table), or the citation is wrong.`,
    );
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error('verify-quotes failed:', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
