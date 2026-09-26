/**
 * 2026-06-27-yohimbe-bark-extract-composition.ts
 *
 * Adds the whole-bark parent compound `yohimbe-bark` (Pausinystalia johimbe) with
 * a `composition[]` block, so the solver expands a bark/extract dose into per-
 * constituent doses (yohimbine carries the authored PK + α₂A occupancy that drives
 * the modeled response; the minor alkaloids ride along).
 *
 * Companion to 2026-06-27-yohimbe-bark-alkaloids.ts (which authored the 12 minor
 * alkaloids + the tannin mixture). This script must run AFTER it — it asserts every
 * constituent slug already resolves before writing.
 *
 * ── mg_per_g_extract provenance ────────────────────────────────────────────
 * Values are a REPRESENTATIVE whole-bark profile (mg per g dried bark), composited
 * from typical literature/label ranges supplied for this merge — NOT a single-lot
 * assay. Real content varies widely by source. A typical ~1 g serving ≈ 6 mg
 * yohimbine; per-serving mg ≈ mg_per_g_extract at the 1 g typical dose.
 *   - Major alkaloids (yohimbine, rauwolscine, corynanthine) are the three
 *     P. johimbe alkaloids quantified by Cohen 2016 (PMID:26391406), which reports
 *     per-serving yohimbine "none to 12.1 mg" — 6 mg/g sits mid-range.
 *   - Minor alkaloids: presence per the LC-MS profiles PMID:23657953 / PMID:30059216;
 *     amounts are representative trace values (ranges from the supplied profile:
 *     β-yohimbine ~0.1–0.5, pseudoyohimbine ~0.2, ajmalicine ~0.1–0.5, the rest
 *     <0.2 mg per ~1 g serving).
 *   - Tannins: the astringent condensed-tannin fraction is significant (several
 *     mg/serving) and precipitates the alkaloids.
 * source_pmid is set only where the cited paper supports the value (yohimbine);
 * elsewhere the value is a representative composite, documented in the note.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  name?: string;
  composition?: { standardization?: string; constituents: Array<{ slug: string; mg_per_g_extract: number; note?: string; source_pmid?: string }> };
  [k: string]: unknown;
}

const YOHIMBE_BARK: Compound = {
  slug: 'yohimbe-bark',
  name: 'Yohimbe bark (Pausinystalia johimbe)',
  aliases: ['Yohimbe', 'Pausinystalia johimbe', 'Corynanthe johimbe', 'yohimbe extract', 'yohimbe bark extract'],
  category: 'alkaloid',
  mechanism:
    'Dried bark of Pausinystalia johimbe, a West African tree used as a stimulant / aphrodisiac and fat-loss supplement. Its activity is dominated by yohimbine — the major alkaloid, an α₂-adrenoceptor antagonist — accompanied by a family of minor yohimbane / corynanthe indole alkaloids (rauwolscine, corynanthine, β-yohimbine, ajmalicine and others) and a significant astringent condensed-tannin fraction. Whole-bark exposure is a mixture: the modeled effect tracks the yohimbine component, while the minor alkaloids add α-adrenergic / serotonergic activity. Narrow safety window; content varies widely between products.',
  routes: ['PO'],
  doses: { PO: { min: 500, max: 3000, typical: 1000, unit: 'mg' } },
  systems: ['nervous', 'cardiovascular'],
  pk_unauthored: {
    reason: 'mixture',
    note: 'Multi-constituent botanical — no single plasma species fits a one-compartment model. The solver expands a bark dose into per-constituent doses via composition[]; yohimbine carries the authored PK / α₂A occupancy that drives the modeled response.',
  },
  composition: {
    // NB: loader.ts caps standardization at 200 chars — full provenance is in `notes` + the script header.
    standardization:
      'Representative whole-bark profile (mg/g dried bark); ~1 g ≈ 6 mg yohimbine. Typical label/literature ranges, not a single-lot assay (yohimbine none–12.1 mg/serving, PMID:26391406).',
    constituents: [
      { slug: 'yohimbine', mg_per_g_extract: 6.0, source_pmid: 'PMID:26391406', note: 'Major alkaloid. Per-serving yohimbine ranged none–12.1 mg across US supplements (PMID:26391406); ~6 mg/g ≈ 0.6% is a representative mid-range value.' },
      { slug: 'rauwolscine', mg_per_g_extract: 1.25, note: 'α-Yohimbine; one of three P. johimbe alkaloids quantified by PMID:26391406. Representative midpoint of ~0.5–2 mg/serving.' },
      { slug: 'corynanthine', mg_per_g_extract: 0.9, note: 'One of three P. johimbe alkaloids quantified by PMID:26391406. Representative midpoint of ~0.3–1.5 mg/serving.' },
      { slug: 'beta-yohimbine', mg_per_g_extract: 0.3, note: 'Minor yohimbine stereoisomer (~0.1–0.5 mg/serving, representative).' },
      { slug: 'ajmalicine', mg_per_g_extract: 0.3, note: 'Corynanthe alkaloid / raubasine (~0.1–0.5 mg/serving, representative).' },
      { slug: 'pseudoyohimbine', mg_per_g_extract: 0.2, note: 'Trace yohimbine stereoisomer (~0.2 mg/serving, representative).' },
      { slug: 'alloyohimbine', mg_per_g_extract: 0.15, note: 'Trace yohimbine stereoisomer (<0.2 mg/serving).' },
      { slug: 'corynantheine', mg_per_g_extract: 0.15, note: 'Trace corynanthe-type alkaloid (<0.2 mg/serving).' },
      { slug: 'dihydrocorynantheine', mg_per_g_extract: 0.15, note: 'Trace corynanthe-type alkaloid (<0.2 mg/serving).' },
      { slug: 'corynantheidine', mg_per_g_extract: 0.1, note: 'Trace corynanthe-type alkaloid.' },
      { slug: 'dihydrositsirikine', mg_per_g_extract: 0.1, note: 'Trace corynanthe-type alkaloid.' },
      { slug: 'yohimbinic-acid', mg_per_g_extract: 0.1, note: 'Trace yohimbine free-acid analog.' },
      { slug: 'hydroxyyohimbine', mg_per_g_extract: 0.1, note: 'Trace monohydroxy-yohimbine.' },
      { slug: 'yohimbe-tannins', mg_per_g_extract: 5.0, note: 'Astringent condensed-tannin fraction — significant (several mg/serving); precipitates the bark alkaloids.' },
    ],
  },
  notes:
    'Parent botanical/extract entry (pk_unauthored: mixture). Constituent slugs authored in the 2026-06-27 yohimbe-bark wave plus the pre-existing yohimbine. mg_per_g values are a representative composite of typical ranges (label/literature/supplied profile), not a single assay; major-alkaloid presence per PMID:26391406, minor alkaloids per PMID:23657953 / PMID:30059216.',
  refs: ['PMID:26391406', 'PMID:23657953', 'PMID:30059216'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  // Guard: every constituent slug must already exist (run the alkaloids script first).
  const missing = YOHIMBE_BARK.composition!.constituents.map(k => k.slug).filter(s => !bySlug.has(s));
  if (missing.length) {
    console.error(`  [ERROR] missing constituent slugs (run 2026-06-27-yohimbe-bark-alkaloids.ts first): ${missing.join(', ')}`);
    process.exit(1);
  }

  if (bySlug.has(YOHIMBE_BARK.slug)) {
    console.log(`  [skip] ${YOHIMBE_BARK.slug} already in registry`);
  } else {
    data.push(YOHIMBE_BARK);
    const n = YOHIMBE_BARK.composition!.constituents.length;
    console.log(`  [add ] ${YOHIMBE_BARK.slug.padEnd(24)} composition(${n} constituents) pk_unauthored=mixture`);
    writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  }

  console.log(`\nYohimbe-bark extract composition (2026-06-27): now ${data.length} compounds.`);
}

main();
