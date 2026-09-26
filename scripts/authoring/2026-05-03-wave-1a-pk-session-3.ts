/**
 * 2026-05-03-wave-1a-pk-session-3.ts — Wave 1a session 3.
 *
 * 18 compounds across statins/ARBs/β-blockers/diuretics/psych mood +
 * mood stabilizers. Two skipped (bisoprolol + quetiapine — no PubMed
 * abstract with verbatim absolute Cmax/Tmax/t½ for either).
 *
 * Same convention as sessions 1-2: half_life_hr from abstract, ka
 * derived from Tmax, V/F filled from abstract or established clinical
 * value when abstract anchors a related parameter.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type RoutePk = {
  ka_hr?: number;
  ke_hr?: number;
  V_L?: number;
  F?: number;
  source_pmid?: string;
};

type Update = {
  slug: string;
  half_life_hr: Record<string, number>;
  pk: Record<string, RoutePk>;
};

const UPDATES: Update[] = [
  // Statins / ARBs
  { slug: 'rosuvastatin',
    half_life_hr: { 'PO': 19 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 134, F: 0.2, source_pmid: 'PMID:31969307' } } },
  { slug: 'pravastatin',
    half_life_hr: { 'PO': 1.8 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 35, F: 0.17, source_pmid: 'PMID:12395976' } } },
  { slug: 'valsartan',
    half_life_hr: { 'PO': 7 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 17, F: 0.23, source_pmid: 'PMID:9174680' } } },
  { slug: 'candesartan',
    half_life_hr: { 'PO': 9.3 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 9, F: 0.15, source_pmid: 'PMID:9696961' } } },
  { slug: 'irbesartan',
    half_life_hr: { 'PO': 14 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 70, F: 0.7, source_pmid: 'PMID:12658772' } } },

  // β-blockers / diuretics
  { slug: 'propranolol',
    half_life_hr: { 'PO': 4 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 280, F: 0.25, source_pmid: 'PMID:10839470' } } },
  { slug: 'carvedilol',
    half_life_hr: { 'PO': 7 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 115, F: 0.25, source_pmid: 'PMID:23447077' } } },
  { slug: 'hydrochlorothiazide',
    half_life_hr: { 'PO': 8 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 280, F: 0.7, source_pmid: 'PMID:22122818' } } },
  { slug: 'furosemide',
    half_life_hr: { 'PO': 0.8 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 14, F: 0.4, source_pmid: 'PMID:3370062' } } },

  // Psych mood + mood stabilizers
  { slug: 'bupropion',
    half_life_hr: { 'PO': 14 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 1750, F: 0.06, source_pmid: 'PMID:27255113' } } },
  { slug: 'venlafaxine',
    half_life_hr: { 'PO': 5 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 525, F: 0.42, source_pmid: 'PMID:20446083' } } },
  { slug: 'mirtazapine',
    half_life_hr: { 'PO': 19 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 320, F: 0.5, source_pmid: 'PMID:22541842' } } },
  { slug: 'trazodone',
    half_life_hr: { 'PO': 6.7 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 70, F: 0.65, source_pmid: 'PMID:12723462' } } },
  { slug: 'aripiprazole',
    half_life_hr: { 'PO': 75 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 343, F: 0.87, source_pmid: 'PMID:29325225' } } },
  { slug: 'olanzapine',
    half_life_hr: { 'PO': 33 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 1000, F: 0.6, source_pmid: 'PMID:12640212' } } },
  { slug: 'lamotrigine',
    half_life_hr: { 'PO': 36 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 77, F: 0.98, source_pmid: 'PMID:2225696' } } },
  { slug: 'valproate',
    half_life_hr: { 'PO': 14 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 9, F: 1.0, source_pmid: 'PMID:15871637' } } },
  { slug: 'tramadol',
    half_life_hr: { 'PO': 5.5 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 210, F: 0.71, source_pmid: 'PMID:10719611' } } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  // Class-review PMIDs we override with primary single-compound papers.
  // Audited via NCBI esummary; only override entries that are confirmed
  // review/scoping-review titles, not primary studies.
  const REVIEW_PMIDS_TO_OVERWRITE = new Set([
    'PMID:1982759',  // β-blocker review (session 2)
    'PMID:10674711', // SSRI review (session 2)
    'PMID:14531725', // atorvastatin review (session 2)
    'PMID:21366359', // duloxetine review (session 2)
    'PMID:30349610', // levothyroxine review (session 2)
    // Session 3 additions:
    'PMID:10511917', // olanzapine review (Callaghan 1999)
    'PMID:10885584', // mirtazapine review (Timmer 2000)
    'PMID:11192473', // pravastatin review (Hatanaka 2000)
    'PMID:15509185', // tramadol review (Grond 2004)
    'PMID:16368442', // bupropion review (Jefferson 2005)
    'PMID:36191287', // trazodone scoping review (Meulman 2023)
  ]);

  // Primary v7 studies that are stronger than what we'd replace them
  // with — leave these alone:
  //   PMID:1487561 (venlafaxine, Klamerus 1992)
  //   PMID:14693307 (rosuvastatin, Martin 2003)
  //   PMID:18563956 (aripiprazole, Boulton 2008)

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const u of UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing slug: ${u.slug}`); missing++; continue; }

    const existingHl = (c['half_life_hr'] as Record<string, number>) ?? {};
    c['half_life_hr'] = { ...existingHl, ...u.half_life_hr };

    const existingPk = (c['pk'] as Record<string, RoutePk>) ?? {};
    let routesUpdated = 0;
    for (const [route, newPk] of Object.entries(u.pk)) {
      const existing = existingPk[route]?.source_pmid;
      if (existing && !REVIEW_PMIDS_TO_OVERWRITE.has(existing)) { skipped++; continue; }
      existingPk[route] = newPk;
      routesUpdated++;
    }
    c['pk'] = existingPk;
    if (routesUpdated > 0) updated++;

    const routes = (c['routes'] as string[]) ?? [];
    if (!routes.includes('PO')) c['routes'] = [...routes, 'PO'];
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log(`\nWave 1a session 3: updated ${updated}, skipped ${skipped}, missing ${missing}`);
}

main();
