#!/usr/bin/env tsx
/**
 * seed-registry.ts — the one-time JSON → Postgres import (M2).
 *
 * v8's registry lived as version-controlled JSON and these tables were a
 * downstream copy. v12 inverts that: Postgres is the source of truth and the
 * JSON in packages/registry/data/ is the SEED, imported once and thereafter
 * historical. After this runs, author through /admin (or the RPCs) — not by
 * editing the files.
 *
 * Run:
 *   pnpm registry:seed              # dry run — validates and reports, writes nothing
 *   pnpm registry:seed --write      # actually import
 *
 * Env (both required for --write):
 *   SUPABASE_URL                 https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    bypasses RLS; keep it off any client
 *
 * WHY SERVICE ROLE: at import time there are no curators yet — the first
 * registry.curator row cannot be granted by a curator. The service key breaks
 * that bootstrap, and is never needed again. Grant yourself a curator row
 * immediately afterwards and author as a normal signed-in user from then on.
 *
 * WHAT IT DOES NOT DO: it does not verify PMIDs. Every reference lands with
 * `verified_at = null`, which the authoring UI must render as UNVERIFIED. That
 * is honest — nothing has checked them in this database yet — and running the
 * NCBI sweep is a separate, rate-limited step (`pnpm registry:verify`).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegistry, loadPathways, loadReceptors } from '../packages/registry/src/loader.ts';
import type { Compound, Pathway } from '../packages/core/src/types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'packages', 'registry', 'data');

const WRITE = process.argv.includes('--write');
const NOTE =
  'Initial import from the v8 JSON registry (packages/registry/data) at the v12 cutover. ' +
  'Values and their citations are carried over unchanged; nothing was re-derived here.';

/** Batch size for the bulk RPC. Big enough to be few round trips, small enough
 *  that one payload stays well under any request-body ceiling — 1,217 compounds
 *  at ~2 KB each is ~2.5 MB, which is too much for a single call. */
const BATCH = 100;

function read(file: string): unknown[] {
  return JSON.parse(readFileSync(join(DATA, file), 'utf-8')) as unknown[];
}

/**
 * Authored PK, an explicit "why not", or neither.
 *
 * This is the axis the registry's definition of done is written against: the
 * catalog is finished when there are no UNVISITED cells, not when every cell is
 * filled. A compound with `pk_unauthored: { reason }` is done; a compound with
 * neither is the backlog. Anything landing as 'draft' here is a row someone
 * still has to look at.
 */
function pkStatus(c: Compound): 'authored' | 'unauthored' | 'draft' {
  const withPk = c as Compound & { pk?: Record<string, unknown>; pk_unauthored?: unknown };
  if (withPk.pk && Object.keys(withPk.pk).length > 0) return 'authored';
  if (withPk.pk_unauthored) return 'unauthored';
  return 'draft';
}

/** Every PMID cited anywhere in a record, however deeply nested. The registry
 *  hangs citations off `source_pmid`, `refs[]`, receptor rows, interaction edges
 *  and effect-compartment blocks, so walk the whole document rather than trying
 *  to enumerate the shapes. */
function collectPmids(node: unknown, into: Set<string>): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const v of node) collectPmids(v, into);
    return;
  }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if ((k === 'source_pmid' || k === 'pmid') && typeof v === 'string') {
        const id = v.replace(/^PMID:\s*/i, '').trim();
        if (/^\d+$/.test(id)) into.add(id);
      } else if (k === 'refs' && Array.isArray(v)) {
        for (const r of v) {
          const raw = typeof r === 'string' ? r : ((r as { pmid?: string })?.pmid ?? '');
          const id = String(raw)
            .replace(/^PMID:\s*/i, '')
            .trim();
          if (/^\d+$/.test(id)) into.add(id);
        }
      } else {
        collectPmids(v, into);
      }
    }
  }
}

async function rpc(name: string, body: unknown): Promise<unknown> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'registry',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function upsert(table: string, rows: unknown[], onConflict: string): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const res = await fetch(
      `${url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
      {
        method: 'POST',
        headers: {
          apikey: key!,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Content-Profile': 'registry',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(chunk),
      },
    );
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  // Validate through the SAME loaders the app boots on. A record that cannot
  // pass them must never reach the database — the loader is the schema.
  const compounds = loadRegistry(read('compounds.json') as never);
  const pathways = loadPathways(read('pathways.json') as never);
  const receptorCatalog = loadReceptors(
    JSON.parse(readFileSync(join(DATA, 'receptors.json'), 'utf-8')),
  );

  const byStatus = { authored: 0, unauthored: 0, draft: 0 };
  const compoundRows = compounds.map((c) => {
    const status = pkStatus(c);
    byStatus[status]++;
    return { ...c, _pk_status: status };
  });

  const pmids = new Set<string>();
  for (const c of compounds) collectPmids(c, pmids);
  for (const p of pathways) collectPmids(p, pmids);

  const pathwayRows = pathways.map((p: Pathway) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    systems: p.systems ?? [],
    data: p,
  }));

  const receptors = [
    ...receptorCatalog.receptors.map((r) => ({ ...r, _kind: 'gpcr' })),
    ...receptorCatalog.nonGpcrTargets.map((r) => ({ ...r, _kind: 'non-gpcr' })),
  ];
  const receptorRows = receptors.map((r) => {
    const rec = r as unknown as Record<string, unknown>;
    const key = String(rec.key ?? rec.slug ?? rec.name);
    return {
      key,
      name: String(rec.name ?? key),
      family: (rec.family as string | undefined) ?? null,
      data: r,
    };
  });

  const referenceRows = [...pmids].sort().map((pmid) => ({ pmid }));

  console.log('seed-registry — validated against the runtime loaders\n');
  console.log(`  compounds   ${compounds.length}`);
  console.log(
    `                authored ${byStatus.authored} · explained ${byStatus.unauthored} · draft ${byStatus.draft}`,
  );
  console.log(`  pathways    ${pathways.length}`);
  console.log(`  receptors   ${receptorRows.length}`);
  console.log(`  references  ${referenceRows.length} distinct PMIDs (all unverified on import)`);

  if (byStatus.draft > 0) {
    console.log(
      `\n  NOTE: ${byStatus.draft} compound(s) have neither authored PK nor an explicit` +
        `\n  pk_unauthored reason. Those are UNVISITED cells — the axis the registry's` +
        `\n  definition of done is actually written against. They import as 'draft' and` +
        `\n  are excluded from published bundles until someone resolves them.`,
    );
  }

  if (!WRITE) {
    console.log('\n  dry run — nothing written. Re-run with --write to import.');
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --write.');
    process.exit(1);
  }

  // References first: compounds cite them, and a curator looking at an unverified
  // citation should find a row to attach a verification to.
  console.log('\n  writing references…');
  await upsert('reference', referenceRows, 'pmid');

  console.log('  writing pathways…');
  await upsert('pathway', pathwayRows, 'slug');

  console.log('  writing receptors…');
  await upsert('receptor', receptorRows, 'key');

  // Compounds go through the RPC so the revision trigger gets its reason and
  // every imported row lands with provenance, exactly like a hand-authored one.
  console.log('  writing compounds (via registry.save_compounds, one revision each)…');
  let done = 0;
  for (let i = 0; i < compoundRows.length; i += BATCH) {
    const chunk = compoundRows.slice(i, i + BATCH);
    await rpc('save_compounds', { p_rows: chunk, p_note: NOTE, p_pk_status: 'draft' });
    done += chunk.length;
    process.stdout.write(`\r    ${done}/${compoundRows.length}`);
  }
  console.log('\n\n  imported. Next: grant yourself a curator row, then');
  console.log('  `pnpm registry:verify` to resolve the PMIDs against NCBI.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
