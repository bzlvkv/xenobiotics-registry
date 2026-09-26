/**
 * 2026-05-06-mass-pk-batch-6.ts — Mass PK authoring batch 6.
 *
 * 5 of 7 verified entries actually need authoring (diltiazem already
 * had PK, disopyramide missing from catalog).
 *
 *   brivaracetam   F 1.0  Vd 40 L   PMID:18341673
 *   captopril      F 0.65 Vd 56 L   PMID:3292102
 *   carisoprodol   F 0.6  Vd 77 L   PMID:27758843
 *   donepezil      F 1.0  Vd 840 L  PMID:9839768
 *   doxazosin      F 0.65 Vd 100 L  PMID:2945688
 *
 * Skipped (no abstract-verbatim PK): brexpiprazole, brompheniramine, butalbital.
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
  { slug: 'brivaracetam', pk: { ka_hr: 1.4,  V_L: 40,  F: 1.0,  source_pmid: 'PMID:18341673' } },
  { slug: 'captopril',    pk: { ka_hr: 1.4,  V_L: 56,  F: 0.65, source_pmid: 'PMID:3292102'  } },
  { slug: 'carisoprodol', pk: { ka_hr: 1.4,  V_L: 77,  F: 0.6,  source_pmid: 'PMID:27758843' } },
  { slug: 'donepezil',    pk: { ka_hr: 0.46, V_L: 840, F: 1.0,  source_pmid: 'PMID:9839768'  } },
  { slug: 'doxazosin',    pk: { ka_hr: 0.7,  V_L: 100, F: 0.65, source_pmid: 'PMID:2945688'  } },
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
  console.log(`Mass-PK batch 6: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
