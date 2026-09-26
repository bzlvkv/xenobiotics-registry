/**
 * 2026-05-03-wave-1a-pk-session-6.ts — Wave 1a session 6.
 *
 * 17 compounds: immune/specialty + analgesics + psych/ADHD + misc.
 * Skipped: naltrexone (no abstract verbatim), lurasidone (only fold-
 * change abstracts), modafinil (already has primary PMID from v0.5).
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
  // Immune/specialty
  { slug: 'methotrexate',
    half_life_hr: { 'PO': 8 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.7, source_pmid: 'PMID:9218084' } } },
  { slug: 'hydroxychloroquine',
    half_life_hr: { 'PO': 960 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 50000, F: 0.74, source_pmid: 'PMID:2757893' } } },
  { slug: 'prednisolone',
    half_life_hr: { 'PO': 3 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.85, source_pmid: 'PMID:2285202' } } },
  { slug: 'montelukast',
    half_life_hr: { 'PO': 4 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 24, F: 0.65, source_pmid: 'PMID:29188782' } } },
  { slug: 'pregabalin',
    half_life_hr: { 'PO': 6.3 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 35, F: 0.9, source_pmid: 'PMID:28025964' } } },

  // Analgesics
  { slug: 'acetaminophen',
    half_life_hr: { 'PO': 2.5 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 60, F: 0.88, source_pmid: 'PMID:30758744' } } },
  { slug: 'aspirin',
    half_life_hr: { 'PO': 0.3 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 11, F: 0.7, source_pmid: 'PMID:30758744' } } },
  { slug: 'diclofenac',
    half_life_hr: { 'PO': 1.92 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 14, F: 0.55, source_pmid: 'PMID:22314121' } } },
  { slug: 'meloxicam',
    half_life_hr: { 'PO': 13.7 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 11, F: 0.89, source_pmid: 'PMID:21485709' } } },

  // Psych/ADHD
  { slug: 'nortriptyline',
    half_life_hr: { 'PO': 30 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 1500, F: 0.55, source_pmid: 'PMID:20309528' } } },
  { slug: 'vortioxetine',
    half_life_hr: { 'PO': 57 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 2600, F: 0.75, source_pmid: 'PMID:22448783' } } },
  { slug: 'topiramate',
    half_life_hr: { 'PO': 21 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.81, source_pmid: 'PMID:21770925' } } },
  { slug: 'methylphenidate',
    half_life_hr: { 'PO': 3 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 100, F: 0.3, source_pmid: 'PMID:25274428' } } },

  // Misc
  { slug: 'nicotine',
    half_life_hr: { 'PO': 4.3 },
    pk: { 'PO': { ka_hr: 0.4, V_L: 180, F: 0.4, source_pmid: 'PMID:10583017' } } },
  { slug: 'baclofen',
    half_life_hr: { 'PO': 4 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 60, F: 0.85, source_pmid: 'PMID:27879195' } } },
  { slug: 'pantoprazole',
    half_life_hr: { 'PO': 1 },
    pk: { 'PO': { ka_hr: 4.0, V_L: 12, F: 0.77, source_pmid: 'PMID:22418828' } } },
  { slug: 'sitagliptin',
    half_life_hr: { 'PO': 10.4 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 198, F: 0.87, source_pmid: 'PMID:29511780' } } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

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
  console.log(`\nWave 1a session 6: updated ${updated}, skipped ${skipped}, missing ${missing}`);
}

main();
