/**
 * 2026-05-06-mass-pk-batch-19.ts — 2 authored.
 *
 *   rivastigmine F 0.35 Vd 130 L  PMID:9737824   (Polinsky 1998)
 *   roflumilast  F 0.8  Vd 200 L  PMID:27306372
 *
 * Already had PK: rivaroxaban, selegiline.
 * Not in catalog: rifapentine, rilpivirine, ropinirole, sacubitril-valsartan.
 * Skipped: rotigotine (TD product, no oral).
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
  { slug: 'rivastigmine', pk: { ka_hr: 1.5, V_L: 130, F: 0.35, source_pmid: 'PMID:9737824'  } },
  { slug: 'roflumilast',  pk: { ka_hr: 1.0, V_L: 200, F: 0.8,  source_pmid: 'PMID:27306372' } },
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
  console.log(`Mass-PK batch 19: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
