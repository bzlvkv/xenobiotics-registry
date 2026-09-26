/**
 * 2026-05-03-wave-1a-pk-session-2.ts — Wave 1a session 2.
 *
 * 14 high-volume Rx with full PK + verified PMIDs:
 *   Cardio: lisinopril, losartan, atorvastatin, metoprolol, amlodipine, atenolol
 *   Psych: sertraline, fluoxetine, paroxetine, escitalopram, duloxetine
 *   Other: metformin, gabapentin, levothyroxine
 *
 * Skipped: simvastatin (no PubMed abstract reports verbatim absolute
 * Cmax/AUC/t½ — all candidates either reported GMR/CI ratios in BE
 * studies or described parameters without listing values).
 *
 * Authoring convention: as in session 1, half_life_hr from abstract,
 * ka derived from abstract Tmax, V/F from abstract or established clinical
 * value when the cited paper anchors a related parameter (e.g. CL/F, F
 * with V/F derived). All values defensible from the paper or from
 * well-established clinical pharmacokinetics for the parent compound.
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
  // ── LISINOPRIL ────────────────────────────────────────────────────
  // PMID:18368945 — Shin 2008. Cmax 60.4 ng/mL, AUC 793 ng·h/mL (single
  // 10 mg, n=26 BE). t½ ~12 h, Tmax ~6 h, F ~25%, V ~30 L (clinical).
  {
    slug: 'lisinopril',
    half_life_hr: { 'PO': 12 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 30, F: 0.25, source_pmid: 'PMID:18368945' } },
  },

  // ── LOSARTAN ──────────────────────────────────────────────────────
  // PMID:31058419 — Park 2019. AUCτ 1242 ng·h/mL parent, CL/F 84.6 L/h
  // (50 mg PO daily SS). Parent t½ ~2 h; F ~33%; V ~34 L (clinical).
  {
    slug: 'losartan',
    half_life_hr: { 'PO': 2 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 34, F: 0.33, source_pmid: 'PMID:31058419' } },
  },

  // ── ATORVASTATIN ──────────────────────────────────────────────────
  // PMID:22801271 — Shen 2012. Cmax 10.6 µg/L, t½ 11.4 h, AUC 54.2
  // µg·h/L (20 mg PO single, n=24). Tmax ~1-2 h; F ~14% (extensive
  // first-pass via CYP3A4); V ~380 L (clinical).
  {
    slug: 'atorvastatin',
    half_life_hr: { 'PO': 11.4 },
    pk: { 'PO': { ka_hr: 2.5, V_L: 380, F: 0.14, source_pmid: 'PMID:22801271' } },
  },

  // ── METOPROLOL ────────────────────────────────────────────────────
  // PMID:15470329 — Kirchheiner 2004. CL 168 L/h (EM CYP2D6), Cmax 118
  // µg/L (100 mg PO). EM t½ ~3.5 h, Tmax ~1.5 h, F ~45%, V ~280 L.
  {
    slug: 'metoprolol',
    half_life_hr: { 'PO': 3.5 },
    pk: { 'PO': { ka_hr: 1.5, V_L: 280, F: 0.45, source_pmid: 'PMID:15470329' } },
  },

  // ── SERTRALINE ────────────────────────────────────────────────────
  // PMID:15497672 — Koytchev 2004. Cmax 9.0 ng/mL, Tmax 5.9 h, t½ 26.5
  // h, AUC 259 ng·h/mL (50 mg PO single, n=24). F ~44%; V huge ~1400 L.
  {
    slug: 'sertraline',
    half_life_hr: { 'PO': 26 },
    pk: { 'PO': { ka_hr: 0.4, V_L: 1400, F: 0.44, source_pmid: 'PMID:15497672' } },
  },

  // ── FLUOXETINE ────────────────────────────────────────────────────
  // PMID:3871765 — Lemberger 1985. Verbatim: "fluoxetine half-life of
  // 1-3 days; norfluoxetine half-life of 7-15 days; ~65% urinary recovery"
  // (30 mg PO × 7 d). Use parent t½ = 48 h. Tmax ~6 h, F ~70%, V ~700 L.
  {
    slug: 'fluoxetine',
    half_life_hr: { 'PO': 48 },
    pk: { 'PO': { ka_hr: 0.4, V_L: 700, F: 0.7, source_pmid: 'PMID:3871765' } },
  },

  // ── PAROXETINE ────────────────────────────────────────────────────
  // PMID:18250057 — Zhu 2008. Cmax 64.7 ng/mL, Tmax 5.6 h, t½ 20 h,
  // AUC 1087 ng·h/mL (40 mg PO single, n=20). F ~50%; V ~900 L.
  {
    slug: 'paroxetine',
    half_life_hr: { 'PO': 20 },
    pk: { 'PO': { ka_hr: 0.4, V_L: 900, F: 0.5, source_pmid: 'PMID:18250057' } },
  },

  // ── ESCITALOPRAM ──────────────────────────────────────────────────
  // PMID:16291715 — Søgaard 2005. t½ 27 h (single) / 33 h (SS), V (IV)
  // 1100 L, V/F oral ~20 L/kg = 1400 L, CL 31 L/h, Tmax 3-4 h. F ~80%
  // (high absolute bioavailability stated qualitatively in abstract).
  {
    slug: 'escitalopram',
    half_life_hr: { 'PO': 27 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 1100, F: 0.8, source_pmid: 'PMID:16291715' } },
  },

  // ── DULOXETINE ────────────────────────────────────────────────────
  // PMID:19539103 — Zhao 2009. Cmax 44.4 ng/mL, Tmax 6.1 h, t½ 12.8 h,
  // V/F 1880 L, CL/F 98.4 L/h (60 mg PO single, n=10). F ~50% (food +
  // first-pass); V ≈ V/F × F = 940 L.
  {
    slug: 'duloxetine',
    half_life_hr: { 'PO': 13 },
    pk: { 'PO': { ka_hr: 0.4, V_L: 940, F: 0.5, source_pmid: 'PMID:19539103' } },
  },

  // ── METFORMIN ─────────────────────────────────────────────────────
  // PMID:7306436 — Tucker 1981. t½ 4 h (plasma), Tmax ~2 h, F 50-60%
  // (use 0.55), n=4 healthy + 12 T2DM. V ~280 L (4 L/kg, high tissue
  // distribution).
  {
    slug: 'metformin',
    half_life_hr: { 'PO': 4 },
    pk: { 'PO': { ka_hr: 1.0, V_L: 280, F: 0.55, source_pmid: 'PMID:7306436' } },
  },

  // ── AMLODIPINE ────────────────────────────────────────────────────
  // PMID:2943308 — Faulkner 1986. t½ 36 h (oral), V 21 L/kg = 1470 L,
  // F 64%, CL 7 mL/min/kg (10 mg single PO/IV, n=12). Tmax ~9 h
  // (clinical, not in abstract).
  {
    slug: 'amlodipine',
    half_life_hr: { 'PO': 36 },
    pk: { 'PO': { ka_hr: 0.3, V_L: 1470, F: 0.64, source_pmid: 'PMID:2943308' } },
  },

  // ── ATENOLOL ──────────────────────────────────────────────────────
  // PMID:658112 — Fitzgerald 1978. Verbatim: "Peak blood levels are
  // observed at 2-4 h and the half life of atenolol given orally is
  // 5-6 h"; F ~50% (100/200 mg PO + IV). V ~67 L (1 L/kg, hydrophilic).
  {
    slug: 'atenolol',
    half_life_hr: { 'PO': 6 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 67, F: 0.5, source_pmid: 'PMID:658112' } },
  },

  // ── GABAPENTIN ────────────────────────────────────────────────────
  // PMID:8456077 — Stewart 1993. Verbatim: "F 73.8% at 100 mg → 35.7%
  // at 1600 mg" (saturable LAT1 absorption). Use F = 0.6 for typical
  // 600 mg dose. t½ ~6 h, Tmax ~3 h, V ~60 L (clinical).
  {
    slug: 'gabapentin',
    half_life_hr: { 'PO': 6 },
    pk: { 'PO': { ka_hr: 0.7, V_L: 60, F: 0.6, source_pmid: 'PMID:8456077' } },
  },

  // ── LEVOTHYROXINE ─────────────────────────────────────────────────
  // PMID:6688797 — Maxon 1983. F 66-72% (~0.18 mg single PO vs IV).
  // Abstract doesn't quote t½ — use established clinical t½ = 168 h
  // (7 days). Tmax 2-4 h, V ~11 L (small Vd, plasma-bound).
  {
    slug: 'levothyroxine',
    half_life_hr: { 'PO': 168 },
    pk: { 'PO': { ka_hr: 0.5, V_L: 11, F: 0.69, source_pmid: 'PMID:6688797' } },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let updated = 0;
  let skippedAlreadyHasPmid = 0;
  let missing = 0;

  for (const u of UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) {
      console.warn(`  [warn] slug not in registry: ${u.slug}`);
      missing++;
      continue;
    }

    const existingHl = (c['half_life_hr'] as Record<string, number>) ?? {};
    c['half_life_hr'] = { ...existingHl, ...u.half_life_hr };

    // PMIDs from the v7 import that are class-review papers (not
    // compound-specific primary PK). We overwrite these with the
    // primary papers our verification agents located.
    const REVIEW_PMIDS_TO_OVERWRITE = new Set([
      'PMID:1982759',  // β-blocker review — used for metoprolol + atenolol in v7
      'PMID:10674711', // SSRI class review — used for 4 SSRIs in v7
      'PMID:14531725', // atorvastatin review (v7)
      'PMID:21366359', // duloxetine review (v7)
      'PMID:30349610', // levothyroxine review (v7)
    ]);

    const existingPk = (c['pk'] as Record<string, RoutePk>) ?? {};
    let routesUpdated = 0;
    for (const [route, newPk] of Object.entries(u.pk)) {
      const existingPmid = existingPk[route]?.source_pmid;
      if (existingPmid && !REVIEW_PMIDS_TO_OVERWRITE.has(existingPmid)) {
        skippedAlreadyHasPmid++;
        continue;
      }
      existingPk[route] = newPk;
      routesUpdated++;
    }
    c['pk'] = existingPk;
    if (routesUpdated > 0) updated++;

    const routes = (c['routes'] as string[]) ?? [];
    if (!routes.includes('PO')) c['routes'] = [...routes, 'PO'];
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log('\nWave 1a session 2 — full PK for 14 high-volume Rx:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (already had source_pmid): ${skippedAlreadyHasPmid}`);
  console.log(`  Missing slugs: ${missing}`);
}

main();
