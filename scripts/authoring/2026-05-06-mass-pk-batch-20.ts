/**
 * 2026-05-06-mass-pk-batch-20.ts — 8 authored.
 *
 *   saxagliptin  F 0.67 Vd 151 L  PMID:22496391
 *   sofosbuvir   F 0.80 Vd 140 L  PMID:32053101
 *   sorafenib    F 0.40 Vd 210 L  PMID:18172272
 *   sotalol      F 0.95 Vd 126 L  PMID:20562595
 *   tamsulosin   F 0.90 Vd 16 L   PMID:21496064
 *   tapentadol   F 0.32 Vd 540 L  PMID:31303784
 *   terbinafine  F 0.40 Vd 2000 L PMID:18751504
 *   ticagrelor   F 0.36 Vd 88 L   PMID:25500486
 *
 * Skipped: sulfasalazine, tofacitinib (no abstract-verbatim).
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
  { slug: 'saxagliptin', pk: { ka_hr: 3.5, V_L: 151,  F: 0.67, source_pmid: 'PMID:22496391' } },
  { slug: 'sofosbuvir',  pk: { ka_hr: 2.5, V_L: 140,  F: 0.80, source_pmid: 'PMID:32053101' } },
  { slug: 'sorafenib',   pk: { ka_hr: 0.20,V_L: 210,  F: 0.40, source_pmid: 'PMID:18172272' } },
  { slug: 'sotalol',     pk: { ka_hr: 0.7, V_L: 126,  F: 0.95, source_pmid: 'PMID:20562595' } },
  { slug: 'tamsulosin',  pk: { ka_hr: 0.4, V_L: 16,   F: 0.90, source_pmid: 'PMID:21496064' } },
  { slug: 'tapentadol',  pk: { ka_hr: 1.5, V_L: 540,  F: 0.32, source_pmid: 'PMID:31303784' } },
  { slug: 'terbinafine', pk: { ka_hr: 0.7, V_L: 2000, F: 0.40, source_pmid: 'PMID:18751504' } },
  { slug: 'ticagrelor',  pk: { ka_hr: 1.0, V_L: 88,   F: 0.36, source_pmid: 'PMID:25500486' } },
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
  console.log(`Mass-PK batch 20: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
