/**
 * 2026-05-06-mass-pk-batch-13.ts — Mass PK authoring batch 13.
 *
 *   isosorbide-mononitrate F 1.0  Vd 45 L   PMID:15146932  (Chen 2004)
 *   lacosamide             F 1.0  Vd 42 L   PMID:23148731  (Cawello 2013)
 *   ledipasvir             F 0.4  Vd 290 L  PMID:27193156  (German 2016)
 *   levofloxacin           F 0.99 Vd 90 L   PMID:22404324  (Lim 2012)
 *
 * Already had PK: ivermectin, lansoprazole, levetiracetam, levothyroxine.
 * Missing from catalog: ketoprofen.
 * Skipped: labetalol (no abstract-verbatim PK in search budget).
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
  { slug: 'isosorbide-mononitrate', pk: { ka_hr: 1.4,  V_L: 45,  F: 1.0,  source_pmid: 'PMID:15146932' } },
  { slug: 'lacosamide',             pk: { ka_hr: 1.4,  V_L: 42,  F: 1.0,  source_pmid: 'PMID:23148731' } },
  { slug: 'ledipasvir',             pk: { ka_hr: 0.32, V_L: 290, F: 0.4,  source_pmid: 'PMID:27193156' } },
  { slug: 'levofloxacin',           pk: { ka_hr: 1.4,  V_L: 90,  F: 0.99, source_pmid: 'PMID:22404324' } },
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
  console.log(`Mass-PK batch 13: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
