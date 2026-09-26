/**
 * 2026-05-30-wave44-nutrition-fda-dv.ts — expand Today's "Daily intake"
 * card to the full FDA Daily Value vitamin/mineral panel.
 *
 * wave43 seeded 9 nutrients off NIH ODS DRI picks. This wave re-bases the
 * whole panel onto the FDA Daily Values (21 CFR 101.9 — the %DV reference
 * printed on every Nutrition/Supplement Facts label, 2016 final rule
 * effective 2020) so the card reads as a coherent "% of Daily Value"
 * surface, and broadens coverage to every vitamin/mineral that (a) has an
 * FDA DV and (b) exists in the registry as a standalone compound.
 *
 * Provenance, like wave43: no source_pmid — these are consensus reference
 * tables, not single-study PK. The basis is named in each `note`:
 *   - rdi  → FDA Daily Value (21 CFR 101.9)
 *   - ul   → NIH ODS Tolerable Upper Intake Level (IOM/NASEM DRI)
 *
 * UNIT DISCIPLINE: `nutrition.unit` is chosen to match the unit each
 * compound is actually dosed in (verified against `doses[route].unit`),
 * because the Daily-intake aggregator converts mg↔mcg↔g but DROPS any
 * IU↔mass conversion. Vitamin D stays IU (how D supplements are logged);
 * everything else is mass. A mismatch would silently zero out a nutrient's
 * intakes — so the unit is part of the data, not a formatting choice.
 *
 * OVERWRITE semantics (not skip-if-present like wave43): every listed slug
 * is set to its canonical FDA value, so re-running converges and the five
 * wave43 entries that differed from the FDA DV (D3, K2, Ca, Mg, K) are
 * re-based. Idempotent by value.
 *
 * Excluded on purpose:
 *   - niacinamide — registry entry is the topical (skincare) form, no oral
 *     dose; cumulative daily intake isn't the right axis.
 *   - boron — no FDA Daily Value / RDA exists (not classified essential);
 *     schema requires a positive rdi, so it can't be authored honestly.
 *   - fish-oil — left as wave43 authored it; FDA sets no DV for omega-3.
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
  // ── Fat-soluble vitamins ───────────────────────────────────────────────
  {
    slug: 'retinol',
    nutrition: {
      rdi: 900, ul: 3000, unit: 'mcg',
      note: 'Vitamin A. FDA Daily Value 900 mcg RAE (21 CFR 101.9). NIH ODS UL 3000 mcg/d preformed retinol (hepatotoxicity / teratogenicity above).',
    },
  },
  {
    slug: 'cholecalciferol',
    nutrition: {
      rdi: 800, ul: 4000, unit: 'IU',
      note: 'Vitamin D3. FDA Daily Value 20 mcg = 800 IU (21 CFR 101.9). NIH ODS UL 100 mcg = 4000 IU/d. 1 mcg = 40 IU.',
    },
  },
  {
    slug: 'ergocalciferol',
    nutrition: {
      rdi: 800, ul: 4000, unit: 'IU',
      note: 'Vitamin D2. Shares the vitamin D Daily Value: 20 mcg = 800 IU (21 CFR 101.9); NIH ODS UL 100 mcg = 4000 IU/d. 1 mcg = 40 IU.',
    },
  },
  {
    slug: 'phylloquinone',
    nutrition: {
      rdi: 120, unit: 'mcg',
      note: 'Vitamin K1. FDA Daily Value for vitamin K is 120 mcg (21 CFR 101.9). No UL established.',
    },
  },
  {
    slug: 'vitamin-k2-mk7',
    nutrition: {
      rdi: 120, unit: 'mcg',
      note: 'Vitamin K2 (MK-7). FDA does not split K1/K2 — applies the total vitamin K Daily Value 120 mcg (21 CFR 101.9). No UL established.',
    },
  },
  // ── Water-soluble vitamins ─────────────────────────────────────────────
  {
    slug: 'ascorbic-acid',
    nutrition: {
      rdi: 90, ul: 2000, unit: 'mg',
      note: 'Vitamin C. FDA Daily Value 90 mg (21 CFR 101.9). NIH ODS UL 2000 mg/d (osmotic diarrhea above).',
    },
  },
  {
    slug: 'thiamine',
    nutrition: {
      rdi: 1.2, unit: 'mg',
      note: 'Vitamin B1. FDA Daily Value 1.2 mg (21 CFR 101.9). No UL established.',
    },
  },
  {
    slug: 'riboflavin',
    nutrition: {
      rdi: 1.3, unit: 'mg',
      note: 'Vitamin B2. FDA Daily Value 1.3 mg (21 CFR 101.9). No UL established.',
    },
  },
  {
    slug: 'niacin',
    nutrition: {
      rdi: 16, ul: 35, unit: 'mg',
      note: 'Vitamin B3. FDA Daily Value 16 mg NE (21 CFR 101.9). NIH ODS UL 35 mg/d (nicotinic-acid flushing) applies to supplemental forms.',
    },
  },
  {
    slug: 'pantothenic-acid',
    nutrition: {
      rdi: 5, unit: 'mg',
      note: 'Vitamin B5. FDA Daily Value 5 mg (21 CFR 101.9). No UL established.',
    },
  },
  {
    slug: 'pyridoxine',
    nutrition: {
      rdi: 1.7, ul: 100, unit: 'mg',
      note: 'Vitamin B6. FDA Daily Value 1.7 mg (21 CFR 101.9). NIH ODS UL 100 mg/d (sensory neuropathy above).',
    },
  },
  {
    slug: 'biotin',
    nutrition: {
      rdi: 30, unit: 'mcg',
      note: 'Vitamin B7. FDA Daily Value 30 mcg (21 CFR 101.9). No UL established. Supplements commonly dose in mg (thousands of mcg) — well over DV but considered safe.',
    },
  },
  {
    slug: 'folic-acid',
    nutrition: {
      rdi: 400, ul: 1000, unit: 'mcg',
      note: 'Vitamin B9 (synthetic folic acid). FDA Daily Value 400 mcg DFE (21 CFR 101.9). NIH ODS UL 1000 mcg/d folic acid (can mask B12 deficiency above).',
    },
  },
  {
    slug: 'methylfolate',
    nutrition: {
      rdi: 400, unit: 'mcg',
      note: 'Vitamin B9 (5-MTHF). FDA Daily Value 400 mcg DFE (21 CFR 101.9). The 1000 mcg UL applies to synthetic folic acid, not reduced folate — no formal UL for 5-MTHF.',
    },
  },
  {
    slug: 'cyanocobalamin',
    nutrition: {
      rdi: 2.4, unit: 'mcg',
      note: 'Vitamin B12 (cyano form). FDA Daily Value 2.4 mcg (21 CFR 101.9). No UL established.',
    },
  },
  {
    slug: 'methylcobalamin',
    nutrition: {
      rdi: 2.4, unit: 'mcg',
      note: 'Vitamin B12 (methyl form). FDA Daily Value 2.4 mcg (21 CFR 101.9). No UL established.',
    },
  },
  {
    slug: 'vitamin-b12-methylcobalamin',
    nutrition: {
      rdi: 2.4, unit: 'mcg',
      note: 'Vitamin B12 (methyl form). FDA Daily Value 2.4 mcg (21 CFR 101.9). No UL established.',
    },
  },
  // ── Minerals / electrolytes ────────────────────────────────────────────
  {
    slug: 'calcium',
    nutrition: {
      rdi: 1300, ul: 2500, unit: 'mg',
      note: 'FDA Daily Value 1300 mg (21 CFR 101.9). NIH ODS UL 2500 mg/d (2000 mg for 51+).',
    },
  },
  {
    slug: 'iron',
    nutrition: {
      rdi: 18, ul: 45, unit: 'mg',
      note: 'FDA Daily Value 18 mg (21 CFR 101.9). NIH ODS UL 45 mg/d (GI distress above).',
    },
  },
  {
    slug: 'magnesium',
    nutrition: {
      rdi: 420, ul: 350, unit: 'mg',
      note: 'FDA Daily Value 420 mg (21 CFR 101.9). NIH ODS UL 350 mg/d applies only to SUPPLEMENTAL magnesium; dietary intake above is generally safe.',
    },
  },
  {
    slug: 'zinc',
    nutrition: {
      rdi: 11, ul: 40, unit: 'mg',
      note: 'FDA Daily Value 11 mg (21 CFR 101.9). NIH ODS UL 40 mg/d (copper antagonism above).',
    },
  },
  {
    slug: 'selenium',
    nutrition: {
      rdi: 55, ul: 400, unit: 'mcg',
      note: 'FDA Daily Value 55 mcg (21 CFR 101.9). NIH ODS UL 400 mcg/d (selenosis above).',
    },
  },
  {
    slug: 'copper',
    nutrition: {
      rdi: 0.9, ul: 10, unit: 'mg',
      note: 'FDA Daily Value 0.9 mg (21 CFR 101.9). NIH ODS UL 10 mg/d (hepatotoxicity above).',
    },
  },
  {
    slug: 'manganese',
    nutrition: {
      rdi: 2.3, ul: 11, unit: 'mg',
      note: 'FDA Daily Value 2.3 mg (21 CFR 101.9). NIH ODS UL 11 mg/d.',
    },
  },
  {
    slug: 'chromium',
    nutrition: {
      rdi: 35, unit: 'mcg',
      note: 'FDA Daily Value 35 mcg (21 CFR 101.9). No UL established.',
    },
  },
  {
    slug: 'molybdenum',
    nutrition: {
      rdi: 45, ul: 2000, unit: 'mcg',
      note: 'FDA Daily Value 45 mcg (21 CFR 101.9). NIH ODS UL 2000 mcg/d.',
    },
  },
  {
    slug: 'iodine',
    nutrition: {
      rdi: 150, ul: 1100, unit: 'mcg',
      note: 'FDA Daily Value 150 mcg (21 CFR 101.9). NIH ODS UL 1100 mcg/d (thyroid dysfunction above).',
    },
  },
  {
    slug: 'potassium',
    nutrition: {
      rdi: 4700, unit: 'mg',
      note: 'FDA Daily Value 4700 mg (21 CFR 101.9). No formal UL; supplemental intake >5 g/d not recommended for healthy adults.',
    },
  },
  {
    slug: 'sodium',
    nutrition: {
      rdi: 2300, unit: 'mg',
      note: 'FDA Daily Value 2300 mg (21 CFR 101.9). No UL; NASEM Chronic Disease Risk Reduction intake also 2300 mg/d.',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<{
    slug: string;
    nutrition?: Nutrition;
  }>;
  let added = 0;
  let changed = 0;
  let unchanged = 0;
  let missing = 0;
  for (const { slug, nutrition } of NUTRITION) {
    const c = data.find(x => x.slug === slug);
    if (!c) {
      console.log(`[miss] ${slug} not in registry`);
      missing++;
      continue;
    }
    const before = c.nutrition ? JSON.stringify(c.nutrition) : null;
    const after = JSON.stringify(nutrition);
    if (before === after) {
      unchanged++;
      continue;
    }
    const ulStr = nutrition.ul != null ? ` / UL ${nutrition.ul}${nutrition.unit}` : '';
    if (before == null) {
      console.log(`[add ] ${slug.padEnd(28)} DV ${nutrition.rdi}${nutrition.unit}${ulStr}`);
      added++;
    } else {
      console.log(`[chg ] ${slug.padEnd(28)} → DV ${nutrition.rdi}${nutrition.unit}${ulStr}  (was ${before})`);
      changed++;
    }
    c.nutrition = nutrition;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(
    `\nwave44: ${added} added · ${changed} re-based to FDA DV · ${unchanged} already canonical · ${missing} not in registry.`,
  );
}

main();
