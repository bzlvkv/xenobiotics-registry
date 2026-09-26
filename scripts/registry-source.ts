/**
 * registry-source.ts — where the registry scripts read the catalog FROM.
 *
 * THIS PROJECT INVERTS v12's DEFAULT, DELIBERATELY. In the v12 app repo Postgres
 * is the registry's source of truth and `--from-json` is the escape hatch. Here
 * the git-versioned JSON under `packages/registry/data/` IS the source of truth:
 * it is what the dated apply-scripts in `scripts/authoring/` write, what review
 * happens against in a diff, and what `registry:seed` pushes INTO a database.
 * So `loadCatalog` defaults to JSON and `--from-db` opts into Postgres, which is
 * the reverse of the wiring this file originally shipped with. The reasoning
 * below is kept because it still explains why the READ path is abstracted at all
 * — a gate that lints a different catalog from the one that ships is the trap,
 * whichever direction the arrow points.
 *
 * v12's defining data decision is that Postgres is the registry's source of
 * truth. That landed for the WRITE direction in M2: the seed imported the JSON
 * into `registry.*`, the authoring RPCs write there, and every edit is recorded
 * in `registry.compound_revision`.
 *
 * It had not landed for the READ direction. `data-lint`, `verify-registry` and
 * `build-bundle` all still opened `packages/registry/data/*.json` — the frozen
 * cutover snapshot. Left alone, that is a trap with a specific victim: a curator
 * authors a compound in the admin UI, the revision row is written, the DB row is
 * correct, they press Publish — and the bundle is cut from a September file that
 * has never heard of their edit. The quality gates would have been checking the
 * same file, so nothing anywhere would have said a word.
 *
 * So the three scripts read through here instead, and the default is the
 * database. `--from-json` is kept for exactly two jobs: seeding a fresh project,
 * and diffing the live catalog against the cutover snapshot to see what
 * authoring has changed since. It is not a fallback — if the DB is unreachable
 * that is an error worth stopping on, not a reason to quietly lint a file.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadRegistry,
  loadPathways,
  loadReceptors,
  type RegistrySource,
} from '../packages/registry/src/loader.ts';
import type { Compound, Pathway } from '../packages/core/src/types.ts';

const DATA_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'packages',
  'registry',
  'data',
);

/** PostgREST caps a response at 1,000 rows by default and the catalog is larger
 *  than that, so every read pages. A silent truncation here would present a
 *  short catalog as the whole one — which is how a lint pass reports clean. */
const PAGE = 500;

export interface Catalog {
  compounds: Compound[];
  pathways: Pathway[];
  /** The receptor catalog document, `{ meta, receptors: [...] }`. */
  receptors: unknown;
  /** Where this came from, for the line every script prints before its verdict.
   *  A gate that does not say what it read is a gate you cannot trust twice. */
  origin: string;
}

export type Origin = 'db' | 'json';

/**
 * `--from-db` anywhere in argv, else the JSON on disk.
 *
 * Inverted against the v12 app repo on purpose — see the header. `--from-json`
 * is still accepted so a command copied from v12's docs or history does what it
 * says rather than silently selecting the other catalog.
 */
export function originFromArgv(argv: readonly string[] = process.argv): Origin {
  if (argv.includes('--from-db')) return 'db';
  return 'json';
}

function env(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'reading the catalog from the database needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
        '(or SUPABASE_ANON_KEY — the registry tables are world-readable). ' +
        'To read the cutover snapshot on disk instead, pass --from-json.',
    );
  }
  return { url, key };
}

/** One paged select against a `registry.*` table, newest schema first. */
async function selectAll(
  table: string,
  columns: string,
  order: string,
  filter = '',
): Promise<Record<string, unknown>[]> {
  const { url, key } = env();
  const out: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const q = `${url}/rest/v1/${table}?select=${columns}&order=${order}&limit=${PAGE}&offset=${offset}${filter}`;
    const res = await fetch(q, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'registry' },
    });
    if (!res.ok) throw new Error(`read ${table}: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as Record<string, unknown>[];
    out.push(...page);
    if (page.length < PAGE) return out;
  }
}

/**
 * The catalog as the app would see it.
 *
 * `includeDraft` is the one axis on which the readers legitimately differ.
 * `pk_status = 'draft'` means "in progress", and 0002 excludes drafts from
 * published bundles — so `build-bundle` must not carry them, while `data-lint`
 * must, since a draft nobody lints is a draft that fails on the day it ships.
 */
export async function loadCatalog(
  origin: Origin,
  { includeDraft = true }: { includeDraft?: boolean } = {},
): Promise<Catalog> {
  if (origin === 'json') {
    const read = (f: string): unknown => JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8'));
    return {
      compounds: loadRegistry(read('compounds.json') as RegistrySource),
      pathways: loadPathways(read('pathways.json') as RegistrySource),
      receptors: loadReceptors(read('receptors.json')),
      origin: `${DATA_DIR} (this project's source of truth)`,
    };
  }

  const { url } = env();
  const draftFilter = includeDraft ? '' : '&pk_status=neq.draft';
  const [compoundRows, pathwayRows, receptorRows, metaRows] = await Promise.all([
    selectAll('compound', 'data', 'slug.asc', draftFilter),
    selectAll('pathway', 'data', 'slug.asc'),
    selectAll('receptor', 'data', 'key.asc'),
    selectAll('catalog_meta', 'dataset,data', 'dataset.asc'),
  ]);

  // Validated through the SAME Zod loaders the app boots on, exactly as the
  // JSON path is. The database column is `jsonb` and Postgres does not know
  // what a Compound is; nothing else in the pipeline would catch a document
  // written before a schema change.
  return {
    compounds: loadRegistry(compoundRows.map((r) => r.data) as RegistrySource),
    pathways: loadPathways(pathwayRows.map((r) => r.data) as RegistrySource),
    receptors: loadReceptors(rebuildReceptorDoc(receptorRows, metaRows)),
    origin: `${url} · registry.* ${includeDraft ? '(including drafts)' : '(published rows only)'}`,
  };
}

/**
 * Put the receptor catalog document back together from its rows.
 *
 * `registry.receptor` is one flat table, but the document it came from has TWO
 * arrays with different schemas: `receptors` are GPCRs and their `gtp_id` must
 * be positive, while `nonGpcrTargets` are hand-curated enzymes, transporters,
 * ion channels and immune targets that carry a `class` and are allowed
 * `gtp_id: 0`, meaning GtoPdb has no id for them.
 *
 * Flattening the 428 rows into one array puts the 47 non-GPCR targets where the
 * positive-id rule applies, and six of them — TNF-α, IgE, IL-17A, IL-23 p19,
 * IL-12/23 p40 and the Caᵥα2δ-1 subunit — fail it. That is not a data problem:
 * the seed foresaw this and stamped every row with `_kind`, which is what makes
 * the partition here exact rather than a guess from the shape of the record.
 * `_kind` is a storage detail and is stripped on the way out.
 */
function rebuildReceptorDoc(
  rows: Record<string, unknown>[],
  metaRows: Record<string, unknown>[],
): unknown {
  const meta = metaRows.find((m) => m.dataset === 'receptors')?.data;
  if (!meta) {
    throw new Error(
      "registry.catalog_meta has no 'receptors' row, so the catalog's provenance " +
        '(GtoPdb release and fetch date) is unknown. Apply migration 0005 rather than ' +
        'publishing a catalog whose source this pipeline would have to invent.',
    );
  }
  const receptors: unknown[] = [];
  const nonGpcrTargets: unknown[] = [];
  for (const row of rows) {
    const { _kind, ...entry } = row.data as Record<string, unknown> & { _kind?: string };
    (_kind === 'non-gpcr' ? nonGpcrTargets : receptors).push(entry);
  }
  return { meta, receptors, nonGpcrTargets };
}
