/**
 * 2026-05-06-mass-pk-batch-29.ts — 5 authored.
 *
 *   praziquantel    F 0.80 Vd 600 L  PMID:31089768
 *   vardenafil      F 0.15 Vd 208 L  PMID:29325456
 *   tranylcypromine F 0.50 Vd 100 L  PMID:12959316
 *   pentazocine     F 0.18 Vd 390 L  PMID:923183
 *   zileuton        F 0.80 Vd 115 L  PMID:8620668
 *
 * Skipped: orphenadrine, propylthiouracil, rimegepant, risedronate,
 * tenofovir-alafenamide (no abstract-verbatim).
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
  { slug: 'praziquantel',    pk: { ka_hr: 1.5, V_L: 600, F: 0.80, source_pmid: 'PMID:31089768' } },
  { slug: 'vardenafil',      pk: { ka_hr: 1.4, V_L: 208, F: 0.15, source_pmid: 'PMID:29325456' } },
  { slug: 'tranylcypromine', pk: { ka_hr: 2.0, V_L: 100, F: 0.50, source_pmid: 'PMID:12959316' } },
  { slug: 'pentazocine',     pk: { ka_hr: 2.0, V_L: 390, F: 0.18, source_pmid: 'PMID:923183'   } },
  { slug: 'zileuton',        pk: { ka_hr: 1.5, V_L: 115, F: 0.80, source_pmid: 'PMID:8620668'  } },
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
  console.log(`Mass-PK batch 29: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
