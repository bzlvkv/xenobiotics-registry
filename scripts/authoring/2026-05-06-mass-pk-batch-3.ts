/**
 * 2026-05-06-mass-pk-batch-3.ts — Mass PK authoring batch 3.
 *
 * 8/10 verified (80% hit rate). Skipped bismuth-subsalicylate
 * (minimal systemic absorption) + bromocriptine (no abstract-verbatim
 * PK in search budget).
 *
 *   bosentan        F 0.50  Vd 18 L    PMID:12047483
 *   budesonide      F 0.11  Vd 200 L   PMID:12492736
 *   buspirone       F 0.04  Vd 380 L   PMID:9871430   (very low F due to CYP3A4 first-pass)
 *   cabergoline     F 0.40  Vd 1500 L  PMID:7884663   (t½ 68 h, very long)
 *   canagliflozin   F 0.65  Vd 119 L   PMID:27136910  (Cmax/Tmax/AUC/t½/F all verbatim)
 *   candesartan     F 0.40  Vd 9 L     PMID:29746726
 *   capecitabine    F 1.0   Vd 280 L   PMID:11286326  (5-FU prodrug, near-complete absorption)
 *   carvedilol      F 0.25  Vd 115 L   PMID:23447077
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
  { slug: 'bosentan',      pk: { ka_hr: 0.65, V_L: 18,   F: 0.50, source_pmid: 'PMID:12047483' } },
  { slug: 'budesonide',    pk: { ka_hr: 1.0,  V_L: 200,  F: 0.11, source_pmid: 'PMID:12492736' } },
  { slug: 'buspirone',     pk: { ka_hr: 1.5,  V_L: 380,  F: 0.04, source_pmid: 'PMID:9871430'  } },
  { slug: 'cabergoline',   pk: { ka_hr: 0.4,  V_L: 1500, F: 0.40, source_pmid: 'PMID:7884663'  } },
  { slug: 'canagliflozin', pk: { ka_hr: 1.2,  V_L: 119,  F: 0.65, source_pmid: 'PMID:27136910' } },
  { slug: 'candesartan',   pk: { ka_hr: 0.5,  V_L: 9,    F: 0.40, source_pmid: 'PMID:29746726' } },
  { slug: 'capecitabine',  pk: { ka_hr: 1.4,  V_L: 280,  F: 1.0,  source_pmid: 'PMID:11286326' } },
  { slug: 'carvedilol',    pk: { ka_hr: 1.5,  V_L: 115,  F: 0.25, source_pmid: 'PMID:23447077' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = c.pk?.PO;
    if (existing && existing.source_pmid === e.pk.source_pmid && existing.F === e.pk.F) { alreadyHas++; continue; }
    c.pk = c.pk ?? {};
    c.pk.PO = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 3: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
