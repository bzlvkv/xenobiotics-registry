/**
 * 2026-05-06-mass-pk-batch-22.ts — 5 authored.
 *
 *   valacyclovir   F 0.54 Vd 50 L    PMID:8593015
 *   valganciclovir F 0.59 Vd 50 L    PMID:22305377
 *   varenicline    F 0.9  Vd 415 L   PMID:19583451
 *   vigabatrin     F 0.92 Vd 56 L    PMID:2757905
 *   vilazodone     F 0.72 Vd 1400 L  PMID:23417352
 *
 * Already had PK: vortioxetine.
 * Not in catalog: valbenazine, vemurafenib, zidovudine, zolmitriptan.
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
  { slug: 'valacyclovir',   pk: { ka_hr: 2.1,  V_L: 50,   F: 0.54, source_pmid: 'PMID:8593015'  } },
  { slug: 'valganciclovir', pk: { ka_hr: 1.4,  V_L: 50,   F: 0.59, source_pmid: 'PMID:22305377' } },
  { slug: 'varenicline',    pk: { ka_hr: 0.7,  V_L: 415,  F: 0.9,  source_pmid: 'PMID:19583451' } },
  { slug: 'vigabatrin',     pk: { ka_hr: 1.2,  V_L: 56,   F: 0.92, source_pmid: 'PMID:2757905'  } },
  { slug: 'vilazodone',     pk: { ka_hr: 0.14, V_L: 1400, F: 0.72, source_pmid: 'PMID:23417352' } },
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
  console.log(`Mass-PK batch 22: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
