/**
 * 2026-05-11-wave-0b-hiv-pk.ts — PK for the 5 v1.1 HIV/ketolide stubs.
 *
 * v1.1 added cobicistat / atazanavir / darunavir / lopinavir /
 * telithromycin as stubs but skipped PK authoring under the strict
 * "values must be abstract-verbatim from PubMed" rule. Per v1.2
 * "let's not paywall anything", values are now sourced from
 * FDA-approved prescribing-info labels (DailyMed) + PMC open-access
 * peer-reviewed papers — both publicly-available primary regulatory
 * / scientific documents.
 *
 * Each compound's mechanism prose is updated to inline the
 * verbatim Cmax / AUC / Tmax / t½ source citation, so the
 * provenance is preserved in the compound entry even without a
 * formal source_pmid (data-lint warns but doesn't error on
 * missing source_pmid).
 *
 * ── Authored pk[PO] / pk[IV] entries ──────────────────────────────
 *
 *   cobicistat:    SS 150 mg PO daily (Tybost label rev 6/2025)
 *   atazanavir:    SS 300/100 mg + RTV PO daily (Reyataz label)
 *   darunavir:     SS 800/100 mg + RTV PO daily (Prezista label)
 *   lopinavir:     SS 400/100 mg + RTV PO bid (Kaletra label)
 *   telithromycin: SS 800 mg PO daily (Ketek label rev 12/2010)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk?: Record<string, { ka_hr?: number; ke_hr?: number; V_L?: number; F?: number; source_pmid?: string }>;
  half_life_hr?: Record<string, number>;
  mechanism?: string;
  refs?: string[];
  [k: string]: unknown;
}

// Source-provenance addition appended to each compound's mechanism prose.
const PK_NOTES: Record<string, { half_life: number; pk: Compound['pk']; mech_addendum: string }> = {
  'cobicistat': {
    half_life: 3.5,
    pk: { PO: { ka_hr: 0.7, V_L: 99.5, F: 1.0 } },
    mech_addendum: ' PK (Tybost prescribing info rev 6/2025; SS 150 mg PO qd): Cmax 0.99 ± 0.3 µg/mL, AUCtau 7.6 ± 3.7 µg·h/mL, Tmax ~3.5 h, t½ 3-4 h, protein binding 97-98%. CL/F ≈ 19.7 L/h, V/F ≈ 99.5 L.',
  },
  'atazanavir': {
    half_life: 12,
    pk: { PO: { ka_hr: 0.6, V_L: 91, F: 1.0 } },
    mech_addendum: ' PK (Reyataz label, boosted 300/100 mg PO qd with RTV at SS): Cmax 6129 ng/mL, AUC(0-24) 57039 ng·h/mL, Tmax ~2.5 h, t½ 9-18 h boosted (7-8 h unboosted). Light meal ↑ AUC ~33% + Cmax ~40% (food taken with dose). CL/F ≈ 5.3 L/h, V/F ≈ 91 L.',
  },
  'darunavir': {
    half_life: 15,
    pk: { PO: { ka_hr: 0.5, V_L: 221, F: 1.0 } },
    mech_addendum: ' PK (Prezista label, boosted 800/100 mg PO qd with RTV at SS): Cmax ~6973 ng/mL, AUC(0-24) ~78,410 ng·h/mL, t½ 15 h supporting once-daily dosing. CL/F ≈ 10.2 L/h, V/F ≈ 221 L. Must be taken with food (F drops ~30% fasted).',
  },
  'lopinavir': {
    half_life: 6,
    pk: { PO: { ka_hr: 0.7, V_L: 37, F: 1.0 } },
    mech_addendum: ' PK (Kaletra label, boosted 400/100 mg PO bid with RTV at SS): Cmax 9.8 ± 3.7 µg/mL, Cmin 5.5 ± 2.7 µg/mL, AUCtau (0-12) 92.6 ± 36.7 µg·h/mL. t½ ~6 h (boost makes effective t½ longer due to CYP3A4 inhibition). CL/F per 12-h interval ≈ 4.3 L/h, V/F ≈ 37 L.',
  },
  'telithromycin': {
    half_life: 9.81,
    pk: { PO: { ka_hr: 1.0, V_L: 516, F: 0.57 } },
    mech_addendum: ' PK (Ketek label rev 12/2010, SS 800 mg PO qd × 7d in healthy adults, n=18): Cmax 2.27 ± 0.71 µg/mL, AUC(0-24) 12.5 ± 5.4 µg·h/mL, Tmax 1.0 h (range 0.5-3.0), t½ 9.81 ± 1.9 h, F 57%, Vd 2.9 L/kg IV (V/F derived ≈ 905 L; true V ≈ 516 L with F 0.57), protein binding 60-70%.',
  },
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let updated = 0;
  for (const [slug, info] of Object.entries(PK_NOTES)) {
    const c = bySlug.get(slug);
    if (!c) {
      console.log(`  [warn] ${slug} missing — skipped`);
      continue;
    }
    c.pk = info.pk;
    c.half_life_hr = { ...(c.half_life_hr ?? {}), PO: info.half_life };
    if (info.mech_addendum && c.mechanism && !c.mechanism.includes('PK (')) {
      c.mechanism = c.mechanism + info.mech_addendum;
    }
    updated++;
    const pk_keys = Object.keys(info.pk ?? {}).join(',');
    console.log(`  [pk  ] ${slug.padEnd(15)} t½=${info.half_life}h  routes=[${pk_keys}]`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nHIV/ketolide PK (v1.2): updated ${updated} compounds with FDA-label-sourced PK.`);
}

main();
