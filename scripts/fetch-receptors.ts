/**
 * fetch-receptors.ts — regenerate the GPCR target catalog from the IUPHAR/BPS
 * Guide to PHARMACOLOGY.
 *
 *   pnpm receptors:fetch [--force] [--dry-run]
 *
 * Fetches GtoPdb's "targets and families" table — the canonical curated receptor
 * list — keeps the non-olfactory / non-taste GPCRs, and rewrites the `receptors`
 * array of `data/receptors.json`.
 *
 * IT REGENERATES `receptors` AND NOTHING ELSE. `nonGpcrTargets` in that file is
 * hand-curated: the enzymes, transporters, ion channels, nuclear receptors and
 * immune targets the registry actually binds, keyed by the occupancy key the
 * compounds use rather than by gene, plus a handful of rows GtoPdb does not
 * enumerate as targets at all (the Cavα2δ-1 subunit, cytokine ligands, free
 * IgE). An earlier version of this script rebuilt that array from a table of
 * occupancy-key→gene pairs held here in the source, which meant the catalog's
 * curated half lived in a script nobody read and silently lost any row added to
 * the JSON by hand. It is now read from the existing file and written back
 * untouched.
 *
 * WHY `--force` EXISTS. A truncated or partially-served upstream fetch parses
 * perfectly and yields fewer rows, so overwriting unconditionally would gut the
 * catalog in a way that looks like a successful run. This refuses to write fewer
 * GPCRs than the file already holds — GtoPdb does retire the odd target, so when
 * a genuine shrink happens, confirm it by hand and pass `--force`.
 *
 * WHAT THIS IS NOT. Not a pharmacodynamic source. These rows are nomenclature —
 * name, family, gene — so they carry no per-row PMID by design; provenance is the
 * GtoPdb release plus each row's GtoPdb target id, recorded in `meta`. Nothing
 * here says any compound binds anything; that lives in each compound's
 * `receptor_occupancy`, and this catalog only gives those keys a name.
 *
 * `--dry-run` fetches, parses and validates, reports what it would write, and
 * writes nothing.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadReceptors } from '@xeno/registry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'data', 'receptors.json');
const GTP_URL = 'https://www.guidetopharmacology.org/DATA/targets_and_families.csv';

const META_NOTE =
  'receptors = non-olfactory/non-taste GPCRs. nonGpcrTargets = the non-GPCR targets ' +
  '(enzymes/transporters/ion channels/nuclear receptors/immune) the registry binds, by ' +
  'occupancy key. Nomenclature reference (name/family/gene); no per-row PMID by design.';

interface ReceptorRow {
  key: string;
  name: string;
  family: string;
  gene: string | null;
  full_name: string;
  gtp_id: number;
}

/** The file as it stands. `nonGpcrTargets` passes straight through, so this
 *  script deliberately does not claim to know its shape. */
interface ExistingDoc {
  meta?: Record<string, unknown>;
  receptors?: unknown[];
  nonGpcrTargets?: unknown[];
}

/** Minimal RFC-4180-ish CSV row parser (quoted fields, "" escapes). */
function parseRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * GtoPdb writes target names as HTML: `5-HT<sub>1A</sub> receptor`, `&beta;<sub>1</sub>`.
 * The tags go, the entities become the character they name.
 *
 * This decoded an ALLOWLIST of two — `&beta;` and `&alpha;` — which is why
 * `data/receptors.json` shipped `"name": "&delta; receptor"` for OPRD1, OPRK1 and
 * OPRM1: the mu/kappa/delta opioid receptors, the most-cited targets in the
 * registry, rendered in the client as the literal text `&delta; receptor` while
 * every adrenoceptor beside them read `β1-adrenoceptor`. An allowlist of entities
 * is a promise to revisit this file whenever GtoPdb names a new Greek letter, and
 * the promise was already broken on the day it was written. Decode by rule
 * instead: the named Greek alphabet plus numeric references, so a letter nobody
 * anticipated arrives decoded rather than raw.
 */
const ENTITIES: Readonly<Record<string, string>> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  prime: '′',
  minus: '−',
  times: '×',
};

/** Any entity left undecoded is a name this script would write as raw markup, so
 *  it fails the run rather than reaching the file. */
function decodeEntities(s: string, where: string): string {
  return s.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body: string) => {
    if (body.startsWith('#')) {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (Number.isInteger(code) && code > 0 && code <= 0x10ffff) {
        return String.fromCodePoint(code);
      }
    }
    const named = ENTITIES[body];
    if (named !== undefined) return named;
    throw new Error(
      `GtoPdb ${where} contains the HTML entity ${whole}, which this script cannot decode. ` +
        `Writing it raw would put markup in the catalog — add it to ENTITIES in ` +
        `scripts/fetch-receptors.ts and re-run.`,
    );
  });
}

const stripHtml = (s: string, where: string): string =>
  decodeEntities(s.replace(/<[^>]+>/g, ''), where).trim();

function readExisting(): ExistingDoc | null {
  if (!existsSync(OUT_PATH)) return null;
  return JSON.parse(readFileSync(OUT_PATH, 'utf8')) as ExistingDoc;
}

async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  for (const arg of process.argv.slice(2)) {
    if (arg !== '--force' && arg !== '--dry-run') {
      console.error(`fetch-receptors: unknown argument ${arg}`);
      console.error('usage: tsx scripts/fetch-receptors.ts [--force] [--dry-run]');
      process.exit(2);
    }
  }

  const existing = readExisting();
  const existingReceptors = existing?.receptors?.length ?? 0;
  const nonGpcrTargets = existing?.nonGpcrTargets;

  if (existing === null) {
    console.log(`fetch-receptors: read no existing file at ${OUT_PATH}`);
  } else {
    console.log(
      `fetch-receptors: read ${OUT_PATH} — ${existingReceptors} GPCRs, ` +
        `${nonGpcrTargets?.length ?? 0} hand-curated non-GPCR targets ` +
        `(GtoPdb ${String(existing.meta?.['version'] ?? '?')}, fetched ` +
        `${String(existing.meta?.['fetched'] ?? '?')})`,
    );
  }
  if (!Array.isArray(nonGpcrTargets) || nonGpcrTargets.length === 0) {
    // The curated half only exists in that file. Writing without it would
    // silently delete every non-GPCR target the compounds bind.
    console.error(
      `fetch-receptors: no hand-curated nonGpcrTargets to preserve. This fetch only ` +
        `regenerates \`receptors\`, so writing now would drop the non-GPCR half of the ` +
        `catalog. Restore ${OUT_PATH} from git first, or pass --force to accept an empty array.`,
    );
    if (!force) process.exit(1);
  }

  console.log(`fetch-receptors: fetching ${GTP_URL} …`);
  const res = await fetch(GTP_URL);
  if (!res.ok) throw new Error(`GtoPdb fetch failed: HTTP ${res.status}`);
  const raw = await res.text();

  const allLines = raw.split(/\r?\n/);
  const versionLine = allLines.find((l) => l.includes('GtoPdb Version'));
  const version = versionLine?.match(/Version:\s*([\d.]+)/)?.[1] ?? 'unknown';

  const lines = allLines.filter((l) => l.length && !l.startsWith('"# '));
  const header = parseRow(lines[0] ?? '');
  const col = (n: string): number => header.indexOf(n);
  const iType = col('Type'),
    iFam = col('Family name'),
    iTid = col('Target id'),
    iName = col('Target name'),
    iGene = col('HGNC symbol'),
    iHname = col('HGNC name');
  if ([iType, iFam, iTid, iName, iGene, iHname].some((i) => i < 0)) {
    throw new Error(`GtoPdb CSV header changed — columns missing from: ${header.join(', ')}`);
  }

  const seen = new Set<string>();
  const rows: ReceptorRow[] = [];
  let gpcrLines = 0;
  for (let i = 1; i < lines.length; i++) {
    const f = parseRow(lines[i]!);
    if (f[iType] !== 'gpcr') continue;
    gpcrLines++;
    const family = f[iFam] ?? '';
    const tid = f[iTid] ?? '';
    const gene = (f[iGene] ?? '').trim() || null;
    if (/taste/i.test(family)) continue; // sensory, not a drug target
    if (seen.has(tid)) continue;
    seen.add(tid);
    rows.push({
      // Canonical key: HGNC gene symbol when known (stable, unique), else the
      // GtoPdb id. A compound's receptor_occupancy[].key resolves against this.
      key: gene ?? `gtp${tid}`,
      name: stripHtml(f[iName] ?? '', `target ${tid} name`),
      family: stripHtml(family, `target ${tid} family`),
      gene,
      full_name: (f[iHname] ?? '').trim(),
      gtp_id: Number(tid),
    });
  }
  rows.sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));
  const families = new Set(rows.map((r) => r.family)).size;

  console.log(
    `fetch-receptors: parsed ${lines.length - 1} GtoPdb rows (${gpcrLines} gpcr), kept ` +
      `${rows.length} GPCRs across ${families} families from GtoPdb ${version}`,
  );

  // Olfactory receptors aren't individually catalogued by GtoPdb; the only
  // sensory families present are Taste 1/2, dropped above.
  if (rows.length < existingReceptors && !force) {
    console.error(
      `fetch-receptors: REFUSING to write — upstream returned ${rows.length} GPCRs but ` +
        `${OUT_PATH} already holds ${existingReceptors}. A truncated fetch looks exactly ` +
        `like this. Confirm the retirement by hand, then re-run with --force.`,
    );
    process.exit(1);
  }

  const doc = {
    meta: {
      source: 'IUPHAR/BPS Guide to PHARMACOLOGY',
      url: 'https://www.guidetopharmacology.org/',
      version,
      fetched: new Date().toISOString().slice(0, 10),
      note: META_NOTE,
    },
    receptors: rows,
    nonGpcrTargets: Array.isArray(nonGpcrTargets) ? nonGpcrTargets : [],
  };

  // Never write a file `pnpm validate` would reject: the loader is the same one
  // the gate and the web client read through.
  loadReceptors(doc);

  if (dryRun) {
    console.log(
      `fetch-receptors: --dry-run — would write ${rows.length} GPCRs + ` +
        `${doc.nonGpcrTargets.length} non-GPCR targets to ${OUT_PATH} ` +
        `(was ${existingReceptors} GPCRs). Nothing written.`,
    );
    return;
  }

  writeFileSync(OUT_PATH, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(
    `fetch-receptors: wrote ${rows.length} GPCRs across ${families} families + ` +
      `${doc.nonGpcrTargets.length} preserved non-GPCR targets → ${OUT_PATH} ` +
      `(GtoPdb ${version}${rows.length === existingReceptors ? '' : `, was ${existingReceptors}`}).`,
  );
}

main().catch((err: unknown) => {
  console.error('fetch-receptors failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
