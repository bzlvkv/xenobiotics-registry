/**
 * 2026-05-06-mass-pk-batch-18.ts — 5 authored.
 *
 *   promethazine F 0.25 Vd 970 L  PMID:8147942
 *   pyrazinamide F 0.9  Vd 50 L   PMID:2737233
 *   ranitidine   F 0.6  Vd 96 L   PMID:6125204
 *   repaglinide  F 0.6  Vd 30 L   PMID:10501822
 *   rifabutin    F 0.16 Vd 595 L  PMID:2552902
 *
 * Not in catalog: pramipexole, primidone, probenecid.
 * Skipped: pyridoxine, rasagiline (no abstract-verbatim).
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
  { slug: 'promethazine', pk: { ka_hr: 0.7, V_L: 970, F: 0.25, source_pmid: 'PMID:8147942'  } },
  { slug: 'pyrazinamide', pk: { ka_hr: 2.5, V_L: 50,  F: 0.9,  source_pmid: 'PMID:2737233'  } },
  { slug: 'ranitidine',   pk: { ka_hr: 1.0, V_L: 96,  F: 0.6,  source_pmid: 'PMID:6125204'  } },
  { slug: 'repaglinide',  pk: { ka_hr: 4.0, V_L: 30,  F: 0.6,  source_pmid: 'PMID:10501822' } },
  { slug: 'rifabutin',    pk: { ka_hr: 0.7, V_L: 595, F: 0.16, source_pmid: 'PMID:2552902'  } },
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
  console.log(`Mass-PK batch 18: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
