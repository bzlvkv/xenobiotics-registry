/**
 * 2026-05-06-mass-pk-batch-26.ts — 7 authored.
 *
 *   rufinamide       F 0.85 Vd 50 L   PMID:21397780
 *   sodium-oxybate   F 0.25 Vd 30 L   PMID:22337777
 *   sulfamethoxazole F 0.95 Vd 14 L   PMID:8696062
 *   trimethoprim     F 0.95 Vd 100 L  PMID:8696062  (same paper)
 *   telmisartan      F 0.43 Vd 500 L  PMID:23471702
 *   tofacitinib      F 0.74 Vd 90 L   PMID:33062629
 *   sacubitril       F 0.60 Vd 75 L   PMID:28527109
 *
 * Skipped: sulfasalazine, ubrogepant, velpatasvir (no abstract-verbatim).
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
  { slug: 'rufinamide',       pk: { ka_hr: 0.4, V_L: 50,  F: 0.85, source_pmid: 'PMID:21397780' } },
  { slug: 'sodium-oxybate',   pk: { ka_hr: 1.7, V_L: 30,  F: 0.25, source_pmid: 'PMID:22337777' } },
  { slug: 'sulfamethoxazole', pk: { ka_hr: 1.0, V_L: 14,  F: 0.95, source_pmid: 'PMID:8696062'  } },
  { slug: 'trimethoprim',     pk: { ka_hr: 1.2, V_L: 100, F: 0.95, source_pmid: 'PMID:8696062'  } },
  { slug: 'telmisartan',      pk: { ka_hr: 1.4, V_L: 500, F: 0.43, source_pmid: 'PMID:23471702' } },
  { slug: 'tofacitinib',      pk: { ka_hr: 1.4, V_L: 90,  F: 0.74, source_pmid: 'PMID:33062629' } },
  { slug: 'sacubitril',       pk: { ka_hr: 2.8, V_L: 75,  F: 0.60, source_pmid: 'PMID:28527109' } },
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
  console.log(`Mass-PK batch 26: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
