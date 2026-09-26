/**
 * 2026-05-06-mass-pk-batch-24.ts — 10/10 authored.
 *
 *   isradipine    F 0.17 Vd 196 L  PMID:2965165
 *   macitentan    F 0.74 Vd 50 L   PMID:23900878
 *   metolazone    F 0.65 Vd 113 L  PMID:29145890
 *   molnupiravir  F 0.56 Vd 142 L  PMID:33649113
 *   nicardipine   F 0.30 Vd 600 L  PMID:6527979
 *   oxazepam      F 0.93 Vd 41 L   PMID:3197746
 *   pibrentasvir  F 0.10 Vd 235 L  PMID:28688001
 *   pindolol      F 0.80 Vd 213 L  PMID:6487506
 *   posaconazole  F 0.42 Vd 297 L  PMID:31432392
 *   propafenone   F 0.10 Vd 250 L  PMID:6872170
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
  { slug: 'isradipine',   pk: { ka_hr: 1.5, V_L: 196, F: 0.17, source_pmid: 'PMID:2965165'  } },
  { slug: 'macitentan',   pk: { ka_hr: 0.1, V_L: 50,  F: 0.74, source_pmid: 'PMID:23900878' } },
  { slug: 'metolazone',   pk: { ka_hr: 0.5, V_L: 113, F: 0.65, source_pmid: 'PMID:29145890' } },
  { slug: 'molnupiravir', pk: { ka_hr: 1.0, V_L: 142, F: 0.56, source_pmid: 'PMID:33649113' } },
  { slug: 'nicardipine',  pk: { ka_hr: 1.5, V_L: 600, F: 0.30, source_pmid: 'PMID:6527979'  } },
  { slug: 'oxazepam',     pk: { ka_hr: 0.5, V_L: 41,  F: 0.93, source_pmid: 'PMID:3197746'  } },
  { slug: 'pibrentasvir', pk: { ka_hr: 0.3, V_L: 235, F: 0.10, source_pmid: 'PMID:28688001' } },
  { slug: 'pindolol',     pk: { ka_hr: 1.0, V_L: 213, F: 0.80, source_pmid: 'PMID:6487506'  } },
  { slug: 'posaconazole', pk: { ka_hr: 0.2, V_L: 297, F: 0.42, source_pmid: 'PMID:31432392' } },
  { slug: 'propafenone',  pk: { ka_hr: 1.0, V_L: 250, F: 0.10, source_pmid: 'PMID:6872170'  } },
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
  console.log(`Mass-PK batch 24: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
