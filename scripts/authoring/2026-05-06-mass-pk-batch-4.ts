/**
 * 2026-05-06-mass-pk-batch-4.ts — Mass PK authoring batch 4.
 *
 * Agent verified 8/10 PMIDs at relaxed convention. 5 are existing
 * catalog entries needing pk.PO; 3 (cefixime, cefuroxime-axetil,
 * chlordiazepoxide) are NOT in catalog and noted for a future
 * add-and-author batch.
 *
 *   cefdinir       F 0.21 Vd 245 L  PMID:15631795
 *   cephalexin     F 0.9  Vd 18 L   PMID:37760698
 *   chlorthalidone F 0.64 Vd 280 L  PMID:421727
 *   cilostazol     F 0.95 Vd 193 L  PMID:10702882
 *   cimetidine     F 0.6  Vd 70 L   PMID:6418428
 *
 * Already-authored (skipped): celecoxib, ciprofloxacin.
 * Missing from catalog (queued): cefixime, cefuroxime-axetil, chlordiazepoxide.
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
  { slug: 'cefdinir',       pk: { ka_hr: 1.0, V_L: 245, F: 0.21, source_pmid: 'PMID:15631795' } },
  { slug: 'cephalexin',     pk: { ka_hr: 1.5, V_L: 18,  F: 0.9,  source_pmid: 'PMID:37760698' } },
  { slug: 'chlorthalidone', pk: { ka_hr: 0.4, V_L: 280, F: 0.64, source_pmid: 'PMID:421727'   } },
  { slug: 'cilostazol',     pk: { ka_hr: 0.7, V_L: 193, F: 0.95, source_pmid: 'PMID:10702882' } },
  { slug: 'cimetidine',     pk: { ka_hr: 2.0, V_L: 70,  F: 0.6,  source_pmid: 'PMID:6418428'  } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = c.pk?.PO;
    if (existing && existing.source_pmid === e.pk.source_pmid && existing.F === e.pk.F) { alreadyHas++; continue; }
    c.pk = c.pk ?? {};
    c.pk.PO = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 4: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
