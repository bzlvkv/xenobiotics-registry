/**
 * 2026-05-06-mass-pk-batch-1.ts — Mass PK authoring batch 1.
 *
 * First batch of an autonomous push to give every compound in the
 * catalog authored PK. Convention matches the existing 395 PK entries:
 *   - half_life_hr[route] at top-level is set (already true for all 10)
 *   - pk[route] adds ka_hr, V_L, F, source_pmid
 *   - source_pmid is a PubMed paper that names AT LEAST ONE PK value
 *     for the compound verbatim; other params come from FDA-label /
 *     standard pharmacology references and are flagged in commit notes
 *
 * Hit rate this batch: 9/10 (acarbose skipped — minimally absorbed,
 * no systemic plasma PK in any PubMed abstract).
 *
 * Verified anchors (all PMIDs confirmed via NCBI ESummary):
 *   abacavir       PMID:18479171  Yuen 2008 (F 0.83, t½ 1.5, Vd 0.86 L/kg)
 *   abiraterone    PMID:30671920  Bouhajib 2019 (Tmax 5.5h, t½ 8.98±3.92h)
 *   acetazolamide  PMID:29626002  Van Berkel 2018 (t½ 4-8h verbatim)
 *   acyclovir      PMID:18540483  Yu 2008 (Cmax 2.27 µg/mL, Tmax 0.8-1h, t½ 2.96h)
 *   agomelatine    PMID:28392509  Li 2017 (Cmax/Tmax/AUC/t½ verbatim quartet)
 *   albendazole    PMID:10079501  Marques 1999 (sulfoxide active metabolite t½ 5.2h, Cmax 302 ng/mL)
 *   alendronate    PMID:10384857  Porras 1999 (F 0.7% fasted verbatim)
 *   alogliptin     PMID:33952821  Morimoto 2021 (absorption 60-71% verbatim)
 *   ampicillin     PMID:6313357   Emmerson 1983 (Cmax 23.1 mg/L, Tmax 1.5h, t½ 1.45h)
 *
 * Skipped: acarbose (no systemic plasma PK in any PubMed abstract;
 * acarbose's clinical effect is via gut α-glucosidase inhibition, not
 * systemic exposure — F~2% by FDA label).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk {
  ka_hr?: number;
  V_L?: number;
  F?: number;
  source_pmid?: string;
}

interface Compound {
  slug: string;
  pk?: Partial<Record<string, RoutePk>>;
  refs?: string[];
  [k: string]: unknown;
}

type Authoring = {
  slug: string;
  route: 'PO';
  pk: RoutePk;
};

const ENTRIES: Authoring[] = [
  { slug: 'abacavir',      route: 'PO', pk: { ka_hr: 1.5, V_L: 60,    F: 0.83, source_pmid: 'PMID:18479171' } },
  { slug: 'abiraterone',   route: 'PO', pk: { ka_hr: 0.4, V_L: 19000, F: 0.10, source_pmid: 'PMID:30671920' } },
  { slug: 'acetazolamide', route: 'PO', pk: { ka_hr: 1.0, V_L: 17,    F: 0.90, source_pmid: 'PMID:29626002' } },
  { slug: 'acyclovir',     route: 'PO', pk: { ka_hr: 0.9, V_L: 50,    F: 0.20, source_pmid: 'PMID:18540483' } },
  { slug: 'agomelatine',   route: 'PO', pk: { ka_hr: 1.0, V_L: 70,    F: 0.04, source_pmid: 'PMID:28392509' } },
  { slug: 'albendazole',   route: 'PO', pk: { ka_hr: 0.5, V_L: 600,   F: 0.05, source_pmid: 'PMID:10079501' } },
  { slug: 'alendronate',   route: 'PO', pk: { ka_hr: 0.5, V_L: 28,    F: 0.007, source_pmid: 'PMID:10384857' } },
  { slug: 'alogliptin',    route: 'PO', pk: { ka_hr: 0.6, V_L: 417,   F: 0.65, source_pmid: 'PMID:33952821' } },
  { slug: 'ampicillin',    route: 'PO', pk: { ka_hr: 1.0, V_L: 21,    F: 0.40, source_pmid: 'PMID:6313357' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }

    const existing = c.pk?.[e.route];
    if (existing && existing.source_pmid === e.pk.source_pmid && existing.F === e.pk.F) {
      alreadyHas++; continue;
    }

    c.pk = c.pk ?? {};
    c.pk[e.route] = e.pk;

    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 1: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
