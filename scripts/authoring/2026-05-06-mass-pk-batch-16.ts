/**
 * 2026-05-06-mass-pk-batch-16.ts — 4 authored.
 *
 *   nimodipine     F 0.13 Vd 1300 L PMID:11986913
 *   nitrofurantoin F 0.4  Vd 50 L   PMID:30859184
 *   olmesartan     F 0.26 Vd 17 L   PMID:16372830  (ka 1.46 verbatim)
 *   oxybutynin     F 0.06 Vd 193 L  PMID:10073329
 *
 * Already had PK: oxcarbazepine. Not in catalog: nintedanib, ofloxacin.
 * Skipped: obeticholic-acid, nystatin (non-absorbed by design).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }
interface Compound { slug: string; pk?: Partial<Record<string, RoutePk>>; refs?: string[]; [k: string]: unknown }

const ENTRIES: Array<{ slug: string; pk: RoutePk }> = [
  { slug: 'nimodipine',     pk: { ka_hr: 1.0,  V_L: 1300, F: 0.13, source_pmid: 'PMID:11986913' } },
  { slug: 'nitrofurantoin', pk: { ka_hr: 1.4,  V_L: 50,   F: 0.4,  source_pmid: 'PMID:30859184' } },
  { slug: 'olmesartan',     pk: { ka_hr: 1.46, V_L: 17,   F: 0.26, source_pmid: 'PMID:16372830' } },
  { slug: 'oxybutynin',     pk: { ka_hr: 2.0,  V_L: 193,  F: 0.06, source_pmid: 'PMID:10073329' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.PO?.source_pmid) { alreadyHas++; continue; }
    c.pk = c.pk ?? {};
    c.pk.PO = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 16: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
