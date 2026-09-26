/**
 * 2026-05-06-mass-pk-batch-5.ts — Mass PK authoring batch 5.
 *
 * Agent verified 9/10 PMIDs but 7 of those compounds already had PK
 * from prior work (my no-PK target list was stale). Authoring only
 * the 2 that genuinely lacked PK.
 *
 *   clindamycin      F 0.90  Vd 75 L   PMID:10475141  (Mazur 1999)
 *   cyclobenzaprine  F 0.55  Vd 400 L  PMID:19243711  (Darwish 2009 ER)
 *
 * Verified-but-already-authored: clonazepam, clopidogrel, dabigatran,
 * dapagliflozin, desipramine, dexmethylphenidate, diclofenac.
 * Skipped: clobazam (no abstract-verbatim PK in search budget).
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
  { slug: 'clindamycin',     pk: { ka_hr: 2.0, V_L: 75,  F: 0.90, source_pmid: 'PMID:10475141' } },
  { slug: 'cyclobenzaprine', pk: { ka_hr: 0.4, V_L: 400, F: 0.55, source_pmid: 'PMID:19243711' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = c.pk?.PO;
    if (existing && existing.source_pmid) { alreadyHas++; continue; }
    c.pk = c.pk ?? {};
    c.pk.PO = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 5: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
