/**
 * 2026-05-03-wave-1a-pk-session-4.ts — Wave 1a session 4.
 *
 * 20 compounds: DOACs / antiplatelet / lipid-lowering, NSAIDs / opioids,
 * GI / antiemetics, sleep / sildenafil / prednisone / sumatriptan.
 * All PMIDs verified by NCBI E-utilities; values from primary single-
 * compound abstracts where possible.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type RoutePk = { ka_hr?: number; ke_hr?: number; V_L?: number; F?: number; source_pmid?: string };
type Update = { slug: string; half_life_hr: Record<string, number>; pk: Record<string, RoutePk> };

const UPDATES: Update[] = [
  // DOACs / antiplatelet / lipid
  { slug: 'apixaban',
    half_life_hr: { 'PO': 11.5 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 21, F: 0.5, source_pmid: 'PMID:22759198' } } },
  { slug: 'rivaroxaban',
    half_life_hr: { 'PO': 10.7 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.8, source_pmid: 'PMID:32959922' } } },
  { slug: 'dabigatran',
    half_life_hr: { 'PO': 13 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 60, F: 0.07, source_pmid: 'PMID:18076218' } } },
  { slug: 'warfarin',
    half_life_hr: { 'PO': 40 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 8, F: 0.95, source_pmid: 'PMID:18679669' } } },
  { slug: 'ezetimibe',
    half_life_hr: { 'PO': 24.3 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 100, F: 0.5, source_pmid: 'PMID:23109219' } } },

  // NSAIDs / opioids
  { slug: 'ibuprofen',
    half_life_hr: { 'PO': 1.9 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 10, F: 0.85, source_pmid: 'PMID:28856569' } } },
  { slug: 'naproxen',
    half_life_hr: { 'PO': 15 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 12, F: 0.95, source_pmid: 'PMID:26257511' } } },
  { slug: 'celecoxib',
    half_life_hr: { 'PO': 7.8 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 400, F: 0.4, source_pmid: 'PMID:11816012' } } },
  { slug: 'oxycodone',
    half_life_hr: { 'PO': 3.5 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 200, F: 0.6, source_pmid: 'PMID:1389934' } } },
  { slug: 'hydrocodone',
    half_life_hr: { 'PO': 4 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 230, F: 0.5, source_pmid: 'PMID:25542074' } } },

  // GI / antiemetic
  { slug: 'famotidine',
    half_life_hr: { 'PO': 3.6 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 79, F: 0.45, source_pmid: 'PMID:2888738' } } },
  { slug: 'esomeprazole',
    half_life_hr: { 'PO': 1.5 },
    pk: { 'PO': { ka_hr: 4, V_L: 16, F: 0.7, source_pmid: 'PMID:11214773' } } },
  { slug: 'ondansetron',
    half_life_hr: { 'PO': 3.5 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 160, F: 0.65, source_pmid: 'PMID:8140047' } } },
  { slug: 'prochlorperazine',
    half_life_hr: { 'PO': 7 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 1240, F: 0.13, source_pmid: 'PMID:8453681' } } },
  { slug: 'loperamide',
    half_life_hr: { 'PO': 11.4 },
    pk: { 'PO': { ka_hr: 0.4, V_L: 350, F: 0.05, source_pmid: 'PMID:15496339' } } },

  // Sleep / specialty
  { slug: 'zolpidem',
    half_life_hr: { 'PO': 2.4 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 38, F: 0.7, source_pmid: 'PMID:21302033' } } },
  { slug: 'eszopiclone',
    half_life_hr: { 'PO': 5.5 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 90, F: 0.8, source_pmid: 'PMID:23038043' } } },
  { slug: 'sildenafil',
    half_life_hr: { 'PO': 4 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 105, F: 0.41, source_pmid: 'PMID:11879254' } } },
  { slug: 'prednisone',
    half_life_hr: { 'PO': 3.5 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.8, source_pmid: 'PMID:39962604' } } },
  { slug: 'sumatriptan',
    half_life_hr: { 'PO': 2.5 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 170, F: 0.14, source_pmid: 'PMID:1659437' } } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  const REVIEW_PMIDS_TO_OVERWRITE = new Set([
    // Earlier sessions:
    'PMID:1982759', 'PMID:10674711', 'PMID:14531725', 'PMID:21366359', 'PMID:30349610',
    'PMID:10511917', 'PMID:10885584', 'PMID:11192473', 'PMID:15509185', 'PMID:16368442',
    'PMID:36191287',
    // Session 4 v7-imported reviews (audited via NCBI esummary titles):
    'PMID:1684924',  // anxiolytics/hypnotics elderly review (zolpidem + eszopiclone)
    'PMID:3542339',  // warfarin review
    'PMID:8492004',  // oxycodone review
    'PMID:9113437',  // naproxen review
    'PMID:9515184',  // ibuprofen review
    'PMID:10749518', // celecoxib review
    'PMID:15871634', // ezetimibe review
    'PMID:18399711', // dabigatran review
    'PMID:23999929', // rivaroxaban review
    'PMID:25301538', // hydrocodone ER review
  ]);

  // Primary v7 studies kept (no override):
  //   PMID:34342172 (apixaban single-dose PK, Frost 2021)

  let updated = 0, skipped = 0, missing = 0;

  for (const u of UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }

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
  console.log(`\nWave 1a session 4: updated ${updated}, skipped ${skipped}, missing ${missing}`);
}

main();
