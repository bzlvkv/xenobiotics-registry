/**
 * 2026-05-03-wave-1a-pk-session-8.ts — Wave 1a final session.
 * 11 compounds verified. Skipped: dronedarone, vardenafil, aprepitant,
 * azathioprine (no verbatim abstract values in surveyed papers).
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
  { slug: 'edoxaban',
    half_life_hr: { 'PO': 11 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 95, F: 0.62, source_pmid: 'PMID:27121940' } } },
  { slug: 'dofetilide',
    half_life_hr: { 'PO': 10 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 250, F: 0.92, source_pmid: 'PMID:7768076' } } },
  { slug: 'rizatriptan',
    half_life_hr: { 'PO': 2 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 110, F: 0.47, source_pmid: 'PMID:10611145' } } },
  { slug: 'methylprednisolone',
    half_life_hr: { 'PO': 3 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 90, F: 0.85, source_pmid: 'PMID:10758783' } } },
  { slug: 'dexamethasone',
    half_life_hr: { 'PO': 4 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 50, F: 0.78, source_pmid: 'PMID:22047811' } } },
  { slug: 'metoclopramide',
    half_life_hr: { 'PO': 5.2 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 240, F: 0.77, source_pmid: 'PMID:7286058' } } },
  { slug: 'granisetron',
    half_life_hr: { 'PO': 9 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 250, F: 0.6, source_pmid: 'PMID:19304880' } } },
  { slug: 'mycophenolate',
    half_life_hr: { 'PO': 16 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 40, F: 0.94, source_pmid: 'PMID:20171422' } } },
  { slug: 'liothyronine',
    half_life_hr: { 'PO': 24 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 35, F: 0.85, source_pmid: 'PMID:17259789' } } },
  { slug: 'lansoprazole',
    half_life_hr: { 'PO': 2 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 18, F: 0.85, source_pmid: 'PMID:15301728' } } },
  { slug: 'dexlansoprazole',
    half_life_hr: { 'PO': 1.7 },
    pk: { 'PO': { ka_hr: 2.0, V_L: 30, F: 0.7, source_pmid: 'PMID:28138748' } } },
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
    'PMID:29189941', 'PMID:383353', 'PMID:15910008',
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
  console.log(`\nWave 1a session 8 (final): updated ${updated}, skipped ${skipped}, missing ${missing}`);
}

main();
