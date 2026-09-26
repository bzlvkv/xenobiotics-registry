/**
 * 2026-05-03-wave-1a-pk-session-7.ts — Wave 1a session 7.
 * 16 compounds with primary PMIDs. Skipped: dextroamphetamine,
 * mixed-amphetamine-salts, levonorgestrel, testosterone-enanthate
 * (no verbatim values in surveyed abstracts).
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
  { slug: 'dexmethylphenidate',
    half_life_hr: { 'PO': 2.5 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 100, F: 0.3, source_pmid: 'PMID:18184535' } } },
  { slug: 'atomoxetine',
    half_life_hr: { 'PO': 5 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 60, F: 0.63, source_pmid: 'PMID:27518170' } } },
  { slug: 'lisdexamfetamine',
    half_life_hr: { 'PO': 11.6 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 200, F: 0.96, source_pmid: 'PMID:21539403' } } },
  { slug: 'estradiol',
    half_life_hr: { 'PO': 14 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 1000, F: 0.05, source_pmid: 'PMID:30694918' } } },
  { slug: 'progesterone',
    half_life_hr: { 'PO': 18 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 200, F: 0.09, source_pmid: 'PMID:8513955' } } },
  { slug: 'dhea',
    half_life_hr: { 'PO': 24 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 110, F: 0.5, source_pmid: 'PMID:10999810' } } },
  { slug: 'amitriptyline',
    half_life_hr: { 'PO': 21 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 1100, F: 0.5, source_pmid: 'PMID:30452773' } } },
  { slug: 'doxepin',
    half_life_hr: { 'PO': 15 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 1400, F: 0.29, source_pmid: 'PMID:11304934' } } },
  { slug: 'citalopram',
    half_life_hr: { 'PO': 35 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 840, F: 0.8, source_pmid: 'PMID:23179471' } } },
  { slug: 'imipramine',
    half_life_hr: { 'PO': 16.7 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 1100, F: 0.4, source_pmid: 'PMID:9088587' } } },
  { slug: 'desipramine',
    half_life_hr: { 'PO': 21 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 2300, F: 0.5, source_pmid: 'PMID:16680561' } } },
  { slug: 'phenytoin',
    half_life_hr: { 'PO': 19 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 50, F: 0.9, source_pmid: 'PMID:9470324' } } },
  { slug: 'levetiracetam',
    half_life_hr: { 'PO': 7.3 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 42, F: 1.0, source_pmid: 'PMID:17324224' } } },
  { slug: 'oxcarbazepine',
    half_life_hr: { 'PO': 9 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.95, source_pmid: 'PMID:7993989' } } },
  { slug: 'mexiletine',
    half_life_hr: { 'PO': 17 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 400, F: 0.85, source_pmid: 'PMID:7104173' } } },
  { slug: 'flecainide',
    half_life_hr: { 'PO': 14 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 350, F: 0.81, source_pmid: 'PMID:2115446' } } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  const REVIEW_PMIDS_TO_OVERWRITE = new Set([
    'PMID:1982759', 'PMID:10674711', 'PMID:14531725', 'PMID:21366359', 'PMID:30349610',
    'PMID:10511917', 'PMID:10885584', 'PMID:11192473', 'PMID:15509185', 'PMID:16368442',
    'PMID:36191287', 'PMID:1684924', 'PMID:3542339', 'PMID:8492004', 'PMID:9113437',
    'PMID:9515184', 'PMID:10749518', 'PMID:15871634', 'PMID:18399711', 'PMID:23999929',
    'PMID:25301538', 'PMID:8882301', 'PMID:6347057', 'PMID:3888490', 'PMID:10628897',
    'PMID:29189941',
  ]);

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
  console.log(`\nWave 1a session 7: updated ${updated}, skipped ${skipped}, missing ${missing}`);
}

main();
