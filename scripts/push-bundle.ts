/**
 * push-bundle.ts — publish a built registry bundle to the cloud (N4/N5 Stage 2).
 * Run AFTER `pnpm registry:bundle`: `pnpm registry:push` (dry-run) / `--write`.
 *
 * Reads packages/registry/dist/ (Stage 1 output) and, with the service role:
 *   1. uploads each payload to the public Supabase Storage bucket `registry-bundle`
 *      at BOTH `<version>/<file>` (immutable, content-addressed) and `latest/<file>`
 *      (the mutable pointer the app's PUBLIC_REGISTRY_BUNDLE_URL targets);
 *   2. upserts one `registry.bundle_manifest` row (the DB-authoritative freshness
 *      record the /registry-bundle edge fn serves).
 *
 * Deploy order matters: payload FIRST, manifest row LAST, so the freshness record
 * never advertises a version whose files aren't up yet. Idempotent — the version
 * is content-addressed, so re-pushing identical data overwrites the same objects
 * and upserts the same row.
 *
 * Runtime-verified against the v12 project on 2026-09-12: bundle a74710aec9170953
 * published, then fetched anonymously from Storage and parsed back to 1,217
 * compounds. (The v8-era header claimed this was unverified; it no longer is.)
 *
 * Requires a public `registry-bundle` bucket to exist — create it once with
 * POST /storage/v1/bucket {"id":"registry-bundle","public":true}.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'packages', 'registry', 'dist');
const BUCKET = 'registry-bundle';
// Three datasets since v12 dropped the curated food catalog. Must stay in
// lockstep with build-bundle.ts's DATASETS and the client's DATASET_FILES —
// a file listed here but not built fails the publish half-way, with the
// payload already uploaded and the manifest row not yet written.
const FILES = ['compounds.json', 'pathways.json', 'receptors.json'] as const;

interface Manifest {
  version: string;
  schemaVersion: number;
  generatedAt: string;
  datasets: Record<string, { count: number; bytes: number; gzipBytes: number; sha256: string }>;
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!existsSync(join(DIST, 'manifest.json')))
    fail('no dist/manifest.json — run `pnpm registry:bundle` first');
  const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf-8')) as Manifest;
  const storageBase = url
    ? `${url}/storage/v1/object/public/${BUCKET}/latest`
    : '(SUPABASE_URL unset)';

  console.log(`bundle ${manifest.version} (schema v${manifest.schemaVersion}) → ${BUCKET}/`);
  for (const f of FILES)
    console.log(`  ${f.padEnd(15)} ${manifest.datasets[f.replace('.json', '')]?.count ?? '?'} rec`);

  if (!write) {
    console.log(`\nDRY-RUN — pass --write to publish to Storage + registry.bundle_manifest.`);
    console.log(`Then set PUBLIC_REGISTRY_BUNDLE_URL=${storageBase}`);
    return;
  }
  if (!url || !key) fail('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required for --write');

  // 1. Upload payloads (immutable version dir + mutable latest/ pointer). Both the
  //    plain .json and the gzipped .json.gz, so a CDN/edge can serve either.
  for (const f of FILES) {
    for (const variant of [f, `${f}.gz`] as const) {
      const bytes = readFileSync(join(DIST, variant));
      const ctype = variant.endsWith('.gz') ? 'application/gzip' : 'application/json';
      for (const path of [`${manifest.version}/${variant}`, `latest/${variant}`]) {
        await upload(url, key, path, bytes, ctype);
      }
    }
  }
  // manifest.json too (so a static client can fetch <base>/manifest.json).
  const mraw = readFileSync(join(DIST, 'manifest.json'));
  for (const path of [`${manifest.version}/manifest.json`, `latest/manifest.json`]) {
    await upload(url, key, path, mraw, 'application/json');
  }

  // 2. Upsert the freshness row LAST (payload is now up).
  await upsertManifest(url, key, manifest, storageBase);

  console.log(`\nPublished. Point PUBLIC_REGISTRY_BUNDLE_URL at:\n  ${storageBase}`);
}

async function upload(
  url: string,
  key: string,
  path: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': contentType,
      'x-upsert': 'true', // overwrite an existing object (idempotent re-push)
      'cache-control': path.startsWith('latest/') ? 'max-age=300' : 'max-age=31536000, immutable',
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) fail(`upload ${path} → ${res.status}: ${await res.text()}`);
  console.log(`  ↑ ${BUCKET}/${path}`);
}

async function upsertManifest(
  url: string,
  key: string,
  m: Manifest,
  storageBase: string,
): Promise<void> {
  const res = await fetch(`${url}/rest/v1/bundle_manifest`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      'content-profile': 'registry',
      prefer: 'resolution=merge-duplicates,return=minimal', // upsert on the version PK
    },
    body: JSON.stringify({
      version: m.version,
      schema_version: m.schemaVersion,
      generated_at: m.generatedAt,
      datasets: m.datasets,
      storage_base: storageBase,
    }),
  });
  if (!res.ok) fail(`upsert bundle_manifest → ${res.status}: ${await res.text()}`);
  console.log(`  ✓ registry.bundle_manifest ${m.version}`);
}

function fail(msg: string): never {
  console.error(`push-bundle: ${msg}`);
  process.exit(1);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
