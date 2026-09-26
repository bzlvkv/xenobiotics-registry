/**
 * 2026-05-06-mass-pk-batch-11.ts — Mass PK authoring batch 11.
 *
 *   febuxostat   F 0.84  Vd 32.8 L  PMID:35849446  (Kamel 2022 popPK)
 *   felodipine   F 0.15  Vd 700 L   PMID:41203691
 *   fluvoxamine  F 0.53  Vd 1750 L  PMID:9184622   (DeVane 1997)
 *   ganciclovir  F 0.6   Vd 50 L    PMID:12189361  (Czock 2002, oral valgan→gan)
 *                                    + sets half_life_hr.PO = 3.5 (verbatim)
 *   glimepiride  F 1.0   Vd 8.8 L   PMID:20110017  (Kim 2009)
 *   galantamine  F 1.0   Vd 175 L   PMID:1914378   (Bickel 1991)
 *
 * Skipped: folic-acid + gemfibrozil already had PK; fosamprenavir +
 * gefitinib not in catalog.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }
interface Compound { slug: string; pk?: Partial<Record<string, RoutePk>>; refs?: string[]; half_life_hr?: Record<string, number>; [k: string]: unknown }

const ENTRIES: Array<{ slug: string; pk: RoutePk; halfLifePO?: number }> = [
  { slug: 'febuxostat',  pk: { ka_hr: 3.6, V_L: 32.8, F: 0.84, source_pmid: 'PMID:35849446' } },
  { slug: 'felodipine',  pk: { ka_hr: 1.0, V_L: 700,  F: 0.15, source_pmid: 'PMID:41203691' } },
  { slug: 'fluvoxamine', pk: { ka_hr: 0.4, V_L: 1750, F: 0.53, source_pmid: 'PMID:9184622'  } },
  { slug: 'ganciclovir', pk: { ka_hr: 0.7, V_L: 50,   F: 0.6,  source_pmid: 'PMID:12189361' }, halfLifePO: 3.5 },
  { slug: 'glimepiride', pk: { ka_hr: 1.5, V_L: 8.8,  F: 1.0,  source_pmid: 'PMID:20110017' } },
  { slug: 'galantamine', pk: { ka_hr: 1.2, V_L: 175,  F: 1.0,  source_pmid: 'PMID:1914378'  } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.PO?.source_pmid) { alreadyHas++; continue; }
    if (e.halfLifePO != null) {
      c.half_life_hr = c.half_life_hr ?? {};
      if (!c.half_life_hr.PO) c.half_life_hr.PO = e.halfLifePO;
    }
    c.pk = c.pk ?? {};
    c.pk.PO = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 11: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
