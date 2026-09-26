/**
 * 2026-05-27-wave43-nutrition-rdi.ts — author `nutrition` (RDI + UL) for
 * the bounded set of nutrients/electrolytes where plasma PK is the wrong
 * question. Today's "Daily intake" card consumes this to surface
 * cumulative-intake bars vs. RDI + UL rather than pretending a meaningful
 * Cmax/AUC.
 *
 * Values from NIH ODS DRI tables (the canonical adult RDA/AI/UL set).
 * No source_pmid because these are DRI consensus, not single-study PK —
 * provenance lives in `note` for verifiability without fabricating a PMID.
 *
 * Idempotent per slug — skips any compound that already has nutrition
 * authored, so re-running the script is safe.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Nutrition = {
  rdi: number;
  ul?: number;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  source_pmid?: string;
  note?: string;
};

const NUTRITION: Array<{ slug: string; nutrition: Nutrition }> = [
  {
    slug: 'potassium',
    nutrition: {
      rdi: 3400,
      unit: 'mg',
      note: 'NIH ODS DRI (2019): adult AI 3400 mg/d (M), 2600 (F). No formal UL — but supplemental intake >5 g/d not recommended for healthy adults.',
    },
  },
  {
    slug: 'selenium',
    nutrition: {
      rdi: 55,
      ul: 400,
      unit: 'mcg',
      note: 'NIH ODS DRI: adult RDA 55 mcg/d. Tolerable UL 400 mcg/d (selenosis risk above).',
    },
  },
  {
    slug: 'magnesium',
    nutrition: {
      rdi: 400,
      ul: 350,
      unit: 'mg',
      note: 'NIH ODS DRI: adult RDA 310–420 mg/d (sex/age). UL 350 mg/d applies only to *supplemental* magnesium — dietary intake above this is generally safe.',
    },
  },
  {
    slug: 'calcium',
    nutrition: {
      rdi: 1000,
      ul: 2500,
      unit: 'mg',
      note: 'NIH ODS DRI: adult RDA 1000 mg/d (1200 for women 51+ and all adults 71+). UL 2500 mg/d (2000 for 51+).',
    },
  },
  {
    slug: 'iron',
    nutrition: {
      rdi: 18,
      ul: 45,
      unit: 'mg',
      note: 'NIH ODS DRI: adult RDA 8 mg/d (M), 18 mg/d (F premenopausal). UL 45 mg/d. Using 18 as conservative target.',
    },
  },
  {
    slug: 'zinc',
    nutrition: {
      rdi: 11,
      ul: 40,
      unit: 'mg',
      note: 'NIH ODS DRI: adult RDA 11 mg/d (M), 8 mg/d (F). UL 40 mg/d.',
    },
  },
  {
    slug: 'cholecalciferol',
    nutrition: {
      rdi: 600,
      ul: 4000,
      unit: 'IU',
      note: 'NIH ODS DRI: adult RDA 600 IU/d (800 for 71+). UL 4000 IU/d. 1 mcg = 40 IU.',
    },
  },
  {
    slug: 'vitamin-k2-mk7',
    nutrition: {
      rdi: 100,
      unit: 'mcg',
      note: 'No formal RDI for K2 specifically. Total vitamin K AI is 120 mcg/d (M), 90 (F); K2-MK7 supplementation typically 90–200 mcg/d. No UL established.',
    },
  },
  {
    slug: 'fish-oil',
    nutrition: {
      rdi: 1,
      unit: 'g',
      note: 'No formal RDI. AHA recommends 250–500 mg/d combined EPA+DHA; typical 30%-EPA+DHA fish oil supplements deliver that at ~1 g/d. Coarse target — actual EPA+DHA content varies by product.',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<{ slug: string; nutrition?: unknown }>;
  let updated = 0;
  let skipped = 0;
  let missing = 0;
  for (const { slug, nutrition } of NUTRITION) {
    const c = data.find(x => x.slug === slug);
    if (!c) { console.log(`[miss] ${slug} not in registry`); missing++; continue; }
    if (c.nutrition) { console.log(`[skip] ${slug} already has nutrition`); skipped++; continue; }
    c.nutrition = nutrition;
    const ulStr = nutrition.ul != null ? ` / UL ${nutrition.ul}${nutrition.unit}` : '';
    console.log(`[add ] ${slug.padEnd(20)} RDI ${nutrition.rdi}${nutrition.unit}${ulStr}`);
    updated++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave43: +${updated} nutrition blocks added · ${skipped} already authored · ${missing} not in registry.`);
}

main();
