/**
 * 2026-05-15-composition-tier-a.ts — Tier-A composite authoring.
 *
 * Adds composition to 9 existing mixture-flagged parents whose constituents
 * are already authored:
 *
 *   bhb-salt, calcium-bhb, magnesium-bhb, potassium-bhb, sodium-bhb
 *   glynac, taurine-bcaa, mixed-tocopherols, oral-contraceptive-combo
 *
 * All targets currently carry `pk_unauthored: { reason: 'mixture' }` and
 * none have an authored composition yet. After this batch the solver
 * expands a logged dose into per-constituent intakes with the standard
 * mg_per_g_extract scaling.
 *
 * BHB-salt cation ratios come from molecular-weight arithmetic:
 *   • Calcium BHB Ca(BHB)₂: MW 246; 2×103/246 ≈ 837 mg BHB + 163 mg Ca per gram
 *   • Magnesium BHB Mg(BHB)₂: MW 230; ≈ 896 mg BHB + 104 mg Mg per gram
 *   • Sodium BHB NaBHB: MW 126; ≈ 817 mg BHB + 183 mg Na per gram
 *   • Potassium BHB KBHB: MW 142; ≈ 725 mg BHB + 275 mg K per gram
 *
 * Mineral cations are real co-loads — relevant for renal patients (K),
 * hypertensives (Na), Mg-RDI (Mg), Ca-balance — so listing them as
 * constituents puts the load into the solver's pipeline. Sodium isn't
 * authored as an elemental compound, so sodium-bhb gets BHB only
 * (allowed by the recently-relaxed min(1) constraint).
 *
 * GlyNAC ratio per the canonical Sekhar 2021 protocol (J Gerontol):
 * 1:1 by molar mass ≈ similar by weight; 600 + 600 mg per scoop is
 * standard. Tablet weight per gram → 500 mg glycine + 500 mg NAC.
 *
 * Mixed tocopherols — typical natural-vitamin-E supplement is alpha-
 * dominant with smaller fractions of beta/gamma/delta. The registry
 * has alpha, gamma, and tocotrienols authored (β and δ aren't), so
 * we ship a 3-constituent partial composition with explicit notes.
 *
 * Oral-contraceptive-combo — represents a generic combined OC pill
 * (Aviane / Lessina-style: 30 mcg EE + 150 mcg LNG). The parent's
 * "1 mg" placeholder dose is just a pill-equivalent; composition
 * scales constituents accordingly. Real-world brand-specific dosing
 * varies; this is a default.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Constituent {
  slug: string;
  mg_per_g_extract: number;
  note?: string;
  source_pmid?: string;
}
interface Composition {
  standardization?: string;
  constituents: Constituent[];
}
interface Compound {
  slug: string;
  composition?: Composition;
  [k: string]: unknown;
}

const PATCHES: Array<{ slug: string; composition: Composition }> = [
  // ── BHB salts ─────────────────────────────────────────────────
  {
    slug: 'bhb-salt',
    composition: {
      standardization: 'Mixed ketone salt blend — typical 4-cation profile (Ca / Mg / Na / K) standardized to ~80% BHB anion. Single dominant-cation entry shown; specific-cation salts are separate slugs.',
      constituents: [
        { slug: 'beta-hydroxybutyrate', mg_per_g_extract: 800, note: 'BHB anion content — ~80% by weight in typical mixed-cation ketone salt blends' },
        { slug: 'calcium',              mg_per_g_extract: 80,  note: 'Calcium fraction of mixed-cation BHB blends (varies by product; calcium-dominant blends are most common)' },
      ],
    },
  },
  {
    slug: 'calcium-bhb',
    composition: {
      standardization: 'Calcium β-hydroxybutyrate Ca(BHB)₂ — MW 246; 2×103/246 ≈ 84% BHB anion, 16% calcium by weight',
      constituents: [
        { slug: 'beta-hydroxybutyrate', mg_per_g_extract: 837, note: 'BHB anion derived from MW Ca(BHB)₂ = 246, 2×103 = 206' },
        { slug: 'calcium',              mg_per_g_extract: 163, note: 'Elemental Ca contribution — clinically meaningful for Ca-balance and hypercalcemia risk' },
      ],
    },
  },
  {
    slug: 'magnesium-bhb',
    composition: {
      standardization: 'Magnesium β-hydroxybutyrate Mg(BHB)₂ — MW 230; ≈ 90% BHB anion, 10% magnesium',
      constituents: [
        { slug: 'beta-hydroxybutyrate', mg_per_g_extract: 896, note: 'BHB from MW Mg(BHB)₂ = 230' },
        { slug: 'magnesium',            mg_per_g_extract: 104, note: 'Elemental Mg — 25% of RDI per gram of salt' },
      ],
    },
  },
  {
    slug: 'potassium-bhb',
    composition: {
      standardization: 'Potassium β-hydroxybutyrate KBHB — MW 142; ≈ 73% BHB anion, 27% potassium',
      constituents: [
        { slug: 'beta-hydroxybutyrate', mg_per_g_extract: 725, note: 'BHB from MW KBHB = 142' },
        { slug: 'potassium',            mg_per_g_extract: 275, note: 'Elemental K — clinically significant; flag in renal impairment / ACE-I / ARB / K-sparing diuretic use' },
      ],
    },
  },
  {
    slug: 'sodium-bhb',
    composition: {
      standardization: 'Sodium β-hydroxybutyrate NaBHB — MW 126; ≈ 82% BHB anion, 18% sodium. Sodium isn\'t authored as an elemental compound; only BHB is included as a constituent. The sodium fraction (~183 mg/g) is real and should be tracked for hypertensives + heart-failure patients.',
      constituents: [
        { slug: 'beta-hydroxybutyrate', mg_per_g_extract: 817, note: 'BHB from MW NaBHB = 126. Each gram of salt also delivers ~183 mg sodium (not tracked by the registry).' },
      ],
    },
  },

  // ── GlyNAC ────────────────────────────────────────────────────
  {
    slug: 'glynac',
    composition: {
      standardization: 'Glycine + N-acetylcysteine — typical commercial 1:1 by weight (e.g. 500 mg + 500 mg per gram). The canonical Sekhar 2021 J Gerontol protocol dosed 100 mg/kg each per day, divided.',
      constituents: [
        { slug: 'glycine', mg_per_g_extract: 500, note: 'Glycine moiety — substrate for GSH biosynthesis; rate-limiting in older adults' },
        { slug: 'nac',     mg_per_g_extract: 500, note: 'N-acetylcysteine — cysteine donor for GSH; rate-limiting upstream' },
      ],
    },
  },

  // ── Taurine + BCAA ────────────────────────────────────────────
  {
    slug: 'taurine-bcaa',
    composition: {
      standardization: '1:2:1:1 by weight (taurine : leucine : isoleucine : valine) — typical resistance-training pre-/intra-workout blend. Leucine-weighted within the BCAA fraction; taurine added for ER-stress + osmoregulation support.',
      constituents: [
        { slug: 'taurine',    mg_per_g_extract: 200, note: '20% of blend — taurine fraction' },
        { slug: 'leucine',    mg_per_g_extract: 400, note: '40% — dominant mTOR activator within the BCAA fraction (2:1:1 leu:ile:val applied to the 80% BCAA share)' },
        { slug: 'isoleucine', mg_per_g_extract: 200, note: '20%' },
        { slug: 'valine',     mg_per_g_extract: 200, note: '20%' },
      ],
    },
  },

  // ── Mixed tocopherols ─────────────────────────────────────────
  {
    slug: 'mixed-tocopherols',
    composition: {
      standardization: 'Natural-source vitamin E mix — alpha-dominant with smaller gamma + delta + beta + tocotrienol fractions. The registry has alpha + gamma + tocotrienols; beta and delta tocopherol aren\'t authored, so a typical "200 IU mixed tocopherols" softgel maps approximately to: 65% alpha + 25% gamma + 10% tocotrienols (the missing 10–15% of beta + delta is omitted).',
      constituents: [
        { slug: 'alpha-tocopherol', mg_per_g_extract: 650, note: 'Dominant tocopherol form (RRR-α-tocopherol in natural sources); ~65% of typical mixed-tocopherol blend' },
        { slug: 'gamma-tocopherol', mg_per_g_extract: 250, note: '~25% in natural-source mixed-tocopherol blends — important for nitrogen-radical scavenging not covered by α' },
        { slug: 'tocotrienols',     mg_per_g_extract: 100, note: '~10% as the tocotrienol fraction (vs. tocopherols); δ + γ tocotrienols are bioactive forms' },
      ],
    },
  },

  // ── Oral contraceptive combo ──────────────────────────────────
  {
    slug: 'oral-contraceptive-combo',
    composition: {
      standardization: 'Generic combined oral contraceptive — represents a typical low-dose pill (30 mcg ethinyl estradiol + 150 mcg levonorgestrel, e.g. Aviane / Lessina). Parent dose unit is "1 mg" as a pill-equivalent; constituent doses scale accordingly. Brand-specific products vary; this is a default standin only.',
      constituents: [
        { slug: 'ethinyl-estradiol', mg_per_g_extract: 30,  note: '30 mcg per pill at the 1 mg pill-equivalent dose — typical low-dose combined OC content' },
        { slug: 'levonorgestrel',    mg_per_g_extract: 150, note: '150 mcg per pill — typical second-generation progestin component' },
      ],
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, skipped = 0, missing = 0;
  for (const p of PATCHES) {
    const c = bySlug.get(p.slug);
    if (!c) { console.warn(`  [warn] missing: ${p.slug}`); missing++; continue; }
    if (c.composition) {
      console.log(`  [skip] ${p.slug} already has composition`);
      skipped++; continue;
    }
    c.composition = p.composition;
    added++;
    console.log(`  [add ] ${p.slug.padEnd(28)} → [${p.composition.constituents.map(x => x.slug).join(', ')}]`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nTier-A composition batch: added ${added}, skipped ${skipped}, missing ${missing}`);
}

main();
