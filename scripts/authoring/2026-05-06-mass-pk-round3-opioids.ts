/**
 * 2026-05-06-mass-pk-round3-opioids.ts — 7 route entries.
 *
 *   fentanyl     IV  V 280 L F 1.0   PMID:6226471   (Mather 1983)
 *   fentanyl     TD  V 280 L F 0.63  PMID:7661346   (Fiset 1995)
 *   hydromorphone IV V 85 L  F 1.0   PMID:6165742   (Vallner 1981; t½ 2.64h, V 1.22 L/kg verbatim)
 *   hydromorphone PO V 85 L  F 0.33  PMID:33177323  (Lohela 2021)
 *   oxymorphone  PO  V 210 L F 0.10  PMID:17658959  (Guay 2007 review)
 *   enoxaparin   SC  V 7 L   F 0.92  PMID:2851016   (Frydman 1988)
 *   codeine      PO  V 245 L F 0.50  PMID:8227477   (Mohammed 1993; CL/F 89 L/h verbatim)
 *
 * Skipped: atropine, scopolamine, heparin (non-linear), isoflurane,
 * sevoflurane (gas partition coeff PK doesn't fit), armodafinil,
 * pseudoephedrine.
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

type Authoring = { slug: string; route: string; pk: RoutePk; halfLife?: number };

const ENTRIES: Authoring[] = [
  { slug: 'fentanyl',      route: 'IV', pk: { V_L: 280, F: 1.0,  source_pmid: 'PMID:6226471'  } },
  { slug: 'fentanyl',      route: 'TD', pk: { ka_hr: 0.05, V_L: 280, F: 0.63, source_pmid: 'PMID:7661346' }, halfLife: 16 },
  { slug: 'hydromorphone', route: 'IV', pk: { V_L: 85,  F: 1.0,  source_pmid: 'PMID:6165742'  } },
  { slug: 'hydromorphone', route: 'PO', pk: { ka_hr: 1.4, V_L: 85, F: 0.33, source_pmid: 'PMID:33177323' } },
  { slug: 'oxymorphone',   route: 'PO', pk: { ka_hr: 1.4, V_L: 210, F: 0.10, source_pmid: 'PMID:17658959' } },
  { slug: 'enoxaparin',    route: 'SC', pk: { ka_hr: 0.35, V_L: 7, F: 0.92, source_pmid: 'PMID:2851016' } },
  { slug: 'codeine',       route: 'PO', pk: { ka_hr: 1.4, V_L: 245, F: 0.50, source_pmid: 'PMID:8227477' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.[e.route]?.source_pmid) { alreadyHas++; continue; }
    if (e.halfLife != null) {
      c.half_life_hr = c.half_life_hr ?? {};
      if (!c.half_life_hr[e.route]) c.half_life_hr[e.route] = e.halfLife;
    }
    c.pk = c.pk ?? {};
    c.pk[e.route] = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Round 3: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
