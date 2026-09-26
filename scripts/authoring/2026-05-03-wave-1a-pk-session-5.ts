/**
 * 2026-05-03-wave-1a-pk-session-5.ts — Wave 1a session 5.
 *
 * 19 compounds: antibiotics + benzodiazepines + antihistamines +
 * specialty (ivermectin, lithium, spironolactone, tadalafil,
 * chlorthalidone). Fluvoxamine skipped — only class-review abstract
 * found, no primary single-compound study with verbatim values.
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
  // Antibiotics
  { slug: 'amoxicillin',
    half_life_hr: { 'PO': 1.5 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 25, F: 0.95, source_pmid: 'PMID:16478005' } } },
  { slug: 'azithromycin',
    half_life_hr: { 'PO': 41 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 2200, F: 0.38, source_pmid: 'PMID:22677307' } } },
  { slug: 'doxycycline',
    half_life_hr: { 'PO': 17 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.93, source_pmid: 'PMID:2080940' } } },
  { slug: 'cephalexin',
    half_life_hr: { 'PO': 1 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 18, F: 0.9, source_pmid: 'PMID:8743403' } } },
  { slug: 'allopurinol',
    half_life_hr: { 'PO': 2 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 65, F: 0.81, source_pmid: 'PMID:10583019' } } },

  // Benzodiazepines
  { slug: 'alprazolam',
    half_life_hr: { 'PO': 16 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 80, F: 0.9, source_pmid: 'PMID:11549205' } } },
  { slug: 'clonazepam',
    half_life_hr: { 'PO': 39 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 180, F: 0.9, source_pmid: 'PMID:12646763' } } },
  { slug: 'lorazepam',
    half_life_hr: { 'PO': 14 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 90, F: 0.9, source_pmid: 'PMID:20218012' } } },
  { slug: 'diazepam',
    half_life_hr: { 'PO': 20 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 70, F: 1.0, source_pmid: 'PMID:10613621' } } },

  // Antihistamines / anxiolytic
  { slug: 'cetirizine',
    half_life_hr: { 'PO': 7.4 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 35, F: 0.7, source_pmid: 'PMID:2892447' } } },
  { slug: 'fexofenadine',
    half_life_hr: { 'PO': 3.75 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 80, F: 0.33, source_pmid: 'PMID:23422332' } } },
  { slug: 'loratadine',
    half_life_hr: { 'PO': 6 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 119, F: 0.4, source_pmid: 'PMID:12852841' } } },
  { slug: 'hydroxyzine',
    half_life_hr: { 'PO': 20 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 1200, F: 0.7, source_pmid: 'PMID:512901' } } },
  { slug: 'buspirone',
    half_life_hr: { 'PO': 2.5 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 370, F: 0.04, source_pmid: 'PMID:10320950' } } },

  // Specialty
  { slug: 'ivermectin',
    half_life_hr: { 'PO': 35 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 200, F: 0.5, source_pmid: 'PMID:8839664' } } },
  { slug: 'lithium',
    half_life_hr: { 'PO': 24 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 50, F: 1.0, source_pmid: 'PMID:10890582' } } },
  { slug: 'spironolactone',
    half_life_hr: { 'PO': 1.5 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 80, F: 0.9, source_pmid: 'PMID:2723123' } } },
  { slug: 'tadalafil',
    half_life_hr: { 'PO': 17.5 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 63, F: 0.4, source_pmid: 'PMID:16487221' } } },
  { slug: 'chlorthalidone',
    half_life_hr: { 'PO': 44 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 280, F: 0.64, source_pmid: 'PMID:421727' } } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  // All review PMIDs accumulated across sessions
  const REVIEW_PMIDS_TO_OVERWRITE = new Set([
    'PMID:1982759', 'PMID:10674711', 'PMID:14531725', 'PMID:21366359', 'PMID:30349610',
    'PMID:10511917', 'PMID:10885584', 'PMID:11192473', 'PMID:15509185', 'PMID:16368442',
    'PMID:36191287', 'PMID:1684924', 'PMID:3542339', 'PMID:8492004', 'PMID:9113437',
    'PMID:9515184', 'PMID:10749518', 'PMID:15871634', 'PMID:18399711', 'PMID:23999929',
    'PMID:25301538',
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
  console.log(`\nWave 1a session 5: updated ${updated}, skipped ${skipped}, missing ${missing}`);
}

main();
