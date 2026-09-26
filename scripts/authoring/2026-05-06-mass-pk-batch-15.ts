/**
 * 2026-05-06-mass-pk-batch-15.ts — Mass PK authoring batch 15 · 4 authored.
 *
 *   mirabegron   F 0.29 Vd 1670 L  PMID:25791612  (Iitsuka 2015)
 *   nateglinide  F 0.73 Vd 10 L    PMID:15005635  (Kirchheiner 2004, CYP2C9 genotype)
 *   nifedipine   F 0.50 Vd 60 L    PMID:23447047  (Chen 2013 SR)
 *   nilotinib    F 0.30 Vd 600 L   PMID:21184622  (Yin 2011)
 *
 * Missing from catalog: moxifloxacin, nevirapine.
 * Skipped: miconazole (no systemic PO PK), minocycline, naltrexone, nelfinavir.
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
  { slug: 'mirabegron',  pk: { ka_hr: 0.6,  V_L: 1670, F: 0.29, source_pmid: 'PMID:25791612' } },
  { slug: 'nateglinide', pk: { ka_hr: 1.4,  V_L: 10,   F: 0.73, source_pmid: 'PMID:15005635' } },
  { slug: 'nifedipine',  pk: { ka_hr: 0.4,  V_L: 60,   F: 0.50, source_pmid: 'PMID:23447047' } },
  { slug: 'nilotinib',   pk: { ka_hr: 0.25, V_L: 600,  F: 0.30, source_pmid: 'PMID:21184622' } },
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
  console.log(`Mass-PK batch 15: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
