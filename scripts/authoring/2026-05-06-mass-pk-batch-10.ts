/**
 * 2026-05-06-mass-pk-batch-10.ts — Mass PK authoring batch 10.
 *
 * 10/10 verified (100% hit rate — best of the night).
 *
 *   entecavir       F 0.95 Vd 42 L     PMID:21125816
 *   enzalutamide    F 0.85 Vd 110 L    PMID:30642613
 *   eplerenone      F 0.69 Vd 43 L     PMID:14570778
 *   erlotinib       F 0.60 Vd 232 L    PMID:24474302
 *   eslicarbazepine F 0.90 Vd 61 L     PMID:27249205
 *   ethambutol      F 0.80 Vd 147 L    PMID:23410999
 *   etoricoxib      F 1.0  Vd 120 L    PMID:18777173
 *   etravirine      F 0.30 Vd 1050 L   PMID:25975423
 *   exemestane      F 0.42 Vd 20000 L  PMID:20329658
 *   famciclovir     F 0.77 Vd 70 L     PMID:7738216
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
  { slug: 'entecavir',       pk: { ka_hr: 0.7, V_L: 42,    F: 0.95, source_pmid: 'PMID:21125816' } },
  { slug: 'enzalutamide',    pk: { ka_hr: 1.5, V_L: 110,   F: 0.85, source_pmid: 'PMID:30642613' } },
  { slug: 'eplerenone',      pk: { ka_hr: 1.7, V_L: 43,    F: 0.69, source_pmid: 'PMID:14570778' } },
  { slug: 'erlotinib',       pk: { ka_hr: 0.5, V_L: 232,   F: 0.60, source_pmid: 'PMID:24474302' } },
  { slug: 'eslicarbazepine', pk: { ka_hr: 0.6, V_L: 61,    F: 0.90, source_pmid: 'PMID:27249205' } },
  { slug: 'ethambutol',      pk: { ka_hr: 0.8, V_L: 147,   F: 0.80, source_pmid: 'PMID:23410999' } },
  { slug: 'etoricoxib',      pk: { ka_hr: 1.0, V_L: 120,   F: 1.0,  source_pmid: 'PMID:18777173' } },
  { slug: 'etravirine',      pk: { ka_hr: 0.4, V_L: 1050,  F: 0.30, source_pmid: 'PMID:25975423' } },
  { slug: 'exemestane',      pk: { ka_hr: 1.4, V_L: 20000, F: 0.42, source_pmid: 'PMID:20329658' } },
  { slug: 'famciclovir',     pk: { ka_hr: 1.4, V_L: 70,    F: 0.77, source_pmid: 'PMID:7738216'  } },
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
  console.log(`Mass-PK batch 10: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
