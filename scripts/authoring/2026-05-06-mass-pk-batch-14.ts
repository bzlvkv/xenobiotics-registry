/**
 * 2026-05-06-mass-pk-batch-14.ts — Mass PK authoring batch 14 · 4 authored.
 *
 *   linezolid      F 1.0  Vd 45 L   PMID:12936973
 *   memantine      F 1.0  Vd 850 L  PMID:18498913
 *   mesalamine     F 0.25 Vd 18 L   PMID:8141827
 *   metronidazole  F 0.90 Vd 56 L   PMID:10384859
 *
 * Already had PK: methotrexate, metoclopramide, mexiletine.
 * Skipped: lurasidone, meclizine (no abstract-verbatim);
 *          liraglutide (no oral formulation).
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
  { slug: 'linezolid',     pk: { ka_hr: 1.4,  V_L: 45,  F: 1.0,  source_pmid: 'PMID:12936973' } },
  { slug: 'memantine',     pk: { ka_hr: 0.18, V_L: 850, F: 1.0,  source_pmid: 'PMID:18498913' } },
  { slug: 'mesalamine',    pk: { ka_hr: 0.14, V_L: 18,  F: 0.25, source_pmid: 'PMID:8141827'  } },
  { slug: 'metronidazole', pk: { ka_hr: 1.4,  V_L: 56,  F: 0.90, source_pmid: 'PMID:10384859' } },
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
  console.log(`Mass-PK batch 14: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
