/**
 * 2026-05-06-mass-pk-batch-8.ts — Mass PK authoring batch 8.
 *
 * 8/10 verified at relaxed convention. Skipped cyclophosphamide
 * (no human oral PK abstract) + dantrolene (IV/rat papers only).
 *
 *   cefuroxime       F 0.37 Vd 35 L    PMID:14696789  (Rojanasthien 2003)
 *   chlorpheniramine F 0.41 Vd 230 L   PMID:11332874  (Van Toor 2001)
 *   cinacalcet       F 0.225 Vd 1000 L PMID:32486863  (Routray 2020, F 20-25% verbatim)
 *   clomipramine     F 0.50 Vd 1100 L  PMID:8181196   (Nielsen 1994, CL 99 L/h)
 *   desloratadine    F 1.0  Vd 3500 L  PMID:12169042  (Affrime 2002, no published F → 1.0 with Vd/F)
 *   desvenlafaxine   F 0.80 Vd 250 L   PMID:19698900  (Perry 2009, ER Tmax 7-8h)
 *   dolutegravir    F 1.0  Vd 17 L    PMID:19884365  (Min 2010, AUC/Cmax/t½ verbatim; no published F)
 *   doravirine       F 0.64 Vd 60 L    PMID:29723418  (Khalilieh 2018, CL/F 5.9 L/h)
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
  { slug: 'cefuroxime',       pk: { ka_hr: 0.9,  V_L: 35,   F: 0.37, source_pmid: 'PMID:14696789' } },
  { slug: 'chlorpheniramine', pk: { ka_hr: 0.7,  V_L: 230,  F: 0.41, source_pmid: 'PMID:11332874' } },
  { slug: 'cinacalcet',       pk: { ka_hr: 0.3,  V_L: 1000, F: 0.225, source_pmid: 'PMID:32486863' } },
  { slug: 'clomipramine',     pk: { ka_hr: 0.5,  V_L: 1100, F: 0.50, source_pmid: 'PMID:8181196'  } },
  { slug: 'desloratadine',    pk: { ka_hr: 0.6,  V_L: 3500, F: 1.0,  source_pmid: 'PMID:12169042' } },
  { slug: 'desvenlafaxine',   pk: { ka_hr: 0.25, V_L: 250,  F: 0.80, source_pmid: 'PMID:19698900' } },
  { slug: 'dolutegravir',     pk: { ka_hr: 0.5,  V_L: 17,   F: 1.0,  source_pmid: 'PMID:19884365' } },
  { slug: 'doravirine',       pk: { ka_hr: 0.5,  V_L: 60,   F: 0.64, source_pmid: 'PMID:29723418' } },
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
  console.log(`Mass-PK batch 8: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
