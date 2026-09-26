/**
 * build-bundle.ts — build the versioned, content-addressed registry distribution
 * bundle. Run: `pnpm registry:bundle`.
 *
 * WHERE THE DATA COMES FROM. Postgres, which is v12's source of truth. This
 * script used to read `packages/registry/data/*.json`, which was correct in v8
 * where those files WERE the registry, and became a trap the moment authoring
 * moved into the database: a curator could author a compound, watch the
 * revision row land, press Publish, and ship a bundle cut from the September
 * cutover snapshot that had never heard of their edit. Nothing would have said
 * a word, because the quality gates were reading the same stale file.
 *
 * `--from-json` still reads the snapshot, for seeding a fresh project and for
 * diffing the live catalog against the cutover.
 *
 * WHAT IT REFUSES TO PUBLISH.
 *   1. Anything the app's own Zod loaders reject — the loader is the schema,
 *      and a bundle that cannot be loaded is worse than a stale one.
 *   2. Anything `lint-rules.ts` calls an ERROR. Those are the semantic checks
 *      that catch valid-but-wrong data: a retired slug shadowing a live
 *      compound, two records claiming one molecule, a citation pointing at a
 *      paper that does not carry the value. In v8 these ran in a GitHub Action
 *      that never once executed. Running them here, in the step that decides
 *      what reaches users, is the point: a draft nobody publishes harms nobody,
 *      and this is the last gate before it stops being a draft.
 *   3. Rows with `pk_status = 'draft'` are excluded rather than refused —
 *      that status means "in progress", and 0002 defines it as out of bundles.
 *
 * Warnings are printed and do NOT block. There are 106 of them today, they are
 * a genuine backlog rather than a defect, and a gate that cannot be satisfied
 * is a gate people learn to bypass.
 *
 * The VERSION is CONTENT-ADDRESSED (a hash of the canonical data, whitespace-
 * independent), so it changes only when the data changes: an unchanged rebuild
 * re-emits the same version, and a client's cache is stale iff the hash differs.
 * `generatedAt` is recorded for humans but deliberately excluded from the hashed
 * identity so it can't perturb the version. Note that moving the source from the
 * JSON files to the database DID change the version once, and legitimately: the
 * loaders sort by name and strip unknown keys, so the bytes differ even where
 * the data does not.
 */
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY_SCHEMA_VERSION } from '../packages/registry/src/schema-version.ts';
import { loadCatalog, originFromArgv, type Catalog } from './registry-source.ts';
import { lintRegistry, type LintPathway } from './lint-rules.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'packages', 'registry', 'dist');

/** Loader/record shape version — shared with the app's distribution client so a
 *  cache and the running app can't silently disagree on shape. */
const SCHEMA_VERSION = REGISTRY_SCHEMA_VERSION;

interface DatasetSpec {
  key: string;
  /** The catalog value this dataset serializes. Already validated — it came
   *  back through the same Zod loaders the app boots on. */
  payload: (c: Catalog) => unknown;
  count: (payload: unknown) => number;
}

const DATASETS: DatasetSpec[] = [
  { key: 'compounds', payload: (c) => c.compounds, count: (p) => (p as unknown[]).length },
  { key: 'pathways', payload: (c) => c.pathways, count: (p) => (p as unknown[]).length },
  {
    key: 'receptors',
    payload: (c) => c.receptors,
    // Both arrays, because both ship and both are records someone authored.
    count: (p) => {
      const d = p as { receptors?: unknown[]; nonGpcrTargets?: unknown[] };
      return (d.receptors?.length ?? 0) + (d.nonGpcrTargets?.length ?? 0);
    },
  },
];

const sha256 = (s: string | Buffer): string => createHash('sha256').update(s).digest('hex');

interface DatasetManifest {
  count: number;
  bytes: number;
  gzipBytes: number;
  sha256: string;
}

async function main(): Promise<void> {
  const origin = originFromArgv();
  // Drafts are excluded here, not filtered later: `pk_status = 'draft'` means a
  // row someone is still working on, and 0002 defines it as out of bundles.
  const catalog = await loadCatalog(origin, { includeDraft: false });
  console.log(`build-bundle: reading ${catalog.origin}`);

  // ── Gate ────────────────────────────────────────────────────────────────
  const findings = lintRegistry({
    compounds: catalog.compounds as never,
    pathways: catalog.pathways as unknown as LintPathway[],
  });
  const errors = findings.filter((f) => f.level === 'error');
  const warnings = findings.filter((f) => f.level === 'warning');
  if (warnings.length > 0) {
    console.log(`build-bundle: ${warnings.length} lint warning(s) — not blocking, still owed`);
  }
  if (errors.length > 0) {
    for (const f of errors) console.error(`  ERR ${f.slug.padEnd(28)} ${f.rule}  ${f.message}`);
    fail(
      `${errors.length} lint error(s). These are not style: each one is data that would ` +
        'render as a claim the catalog cannot support. Fix them, or publish without them.',
    );
  }

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const datasets: Record<string, DatasetManifest> = {};
  const versionParts: string[] = [];

  for (const ds of DATASETS) {
    const payload = ds.payload(catalog);
    // Hash the CANONICAL re-serialization (normalizes indentation; preserves key
    // + array order) so re-indenting a source file doesn't churn the version.
    const canonical = JSON.stringify(payload);
    const hash = sha256(canonical);
    const raw = JSON.stringify(payload, null, 2) + '\n';
    const gz = gzipSync(Buffer.from(raw), { level: 9 });

    writeFileSync(join(OUT_DIR, `${ds.key}.json`), raw); // servable payload
    writeFileSync(join(OUT_DIR, `${ds.key}.json.gz`), gz); // CDN-ready compressed

    datasets[ds.key] = {
      count: ds.count(payload),
      bytes: Buffer.byteLength(raw),
      gzipBytes: gz.byteLength,
      sha256: hash,
    };
    versionParts.push(`${ds.key}:${hash}`);
  }

  // Bundle version = short hash of the per-dataset hashes → content-addressed.
  const version = sha256(versionParts.join('\n')).slice(0, 16);
  const manifest = {
    version,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(), // human-facing only; NOT in the hash
    datasets,
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  console.log(`registry bundle ${version}  (schema v${SCHEMA_VERSION})  → packages/registry/dist/`);
  for (const [k, d] of Object.entries(datasets)) {
    console.log(
      `  ${k.padEnd(10)} ${String(d.count).padStart(6)} rec` +
        `  ${(d.bytes / 1024).toFixed(0).padStart(6)} KB` +
        `  ${(d.gzipBytes / 1024).toFixed(0).padStart(5)} KB gz` +
        `  ${d.sha256.slice(0, 12)}…`,
    );
  }
}

function fail(msg: string): never {
  console.error(`build-bundle: ${msg}`);
  process.exit(1);
}

main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
