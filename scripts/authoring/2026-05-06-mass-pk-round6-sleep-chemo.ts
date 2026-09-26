/**
 * 2026-05-06-mass-pk-round6-sleep-chemo.ts — 7 route entries.
 *
 *   diphenhydramine  PO  V 315 L F 0.72  PMID:3760245   (Blyden 1986)
 *   doxylamine       PO  V 177 L F 1.0   PMID:2743704   (Friedman 1989)
 *   tasimelteon      PO  V 42.7 L F 0.38 PMID:25658956  (Torres 2015)
 *   paclitaxel       IV  V 99 L  F 1.0   PMID:2882837   (Wiernik 1987)
 *   doxorubicin      IV  V 1050 L F 1.0  PMID:8137342   (Robert 1993)
 *   remdesivir       IV  V 51 L  F 1.0   PMID:36123499  (Abouellil 2023)
 *   naloxone         IV  V 56 L  F 1.0   PMID:3963538   (Goldfrank 1986)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }
interface Compound {
  slug: string;
  pk?: Partial<Record<string, RoutePk>>;
  half_life_hr?: Record<string, number>;
  refs?: string[];
  [k: string]: unknown;
}

type Authoring = { slug: string; route: string; pk: RoutePk };

const ENTRIES: Authoring[] = [
  { slug: 'diphenhydramine', route: 'PO', pk: { ka_hr: 1.8, V_L: 315,  F: 0.72, source_pmid: 'PMID:3760245'  } },
  { slug: 'doxylamine',      route: 'PO', pk: { ka_hr: 1.0, V_L: 177,  F: 1.0,  source_pmid: 'PMID:2743704'  } },
  { slug: 'tasimelteon',     route: 'PO', pk: { ka_hr: 1.4, V_L: 42.7, F: 0.38, source_pmid: 'PMID:25658956' } },
  { slug: 'paclitaxel',      route: 'IV', pk: { V_L: 99,   F: 1.0,    source_pmid: 'PMID:2882837'  } },
  { slug: 'doxorubicin',     route: 'IV', pk: { V_L: 1050, F: 1.0,    source_pmid: 'PMID:8137342'  } },
  { slug: 'remdesivir',      route: 'IV', pk: { V_L: 51,   F: 1.0,    source_pmid: 'PMID:36123499' } },
  { slug: 'naloxone',        route: 'IV', pk: { V_L: 56,   F: 1.0,    source_pmid: 'PMID:3963538'  } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.[e.route]?.source_pmid) { alreadyHas++; continue; }
    c.pk = c.pk ?? {};
    c.pk[e.route] = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Round 6: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
