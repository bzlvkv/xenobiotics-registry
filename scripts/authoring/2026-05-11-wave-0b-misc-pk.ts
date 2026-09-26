/**
 * 2026-05-11-wave-0b-misc-pk.ts — v1.2 phase-4 PK round 2 (6 compounds).
 *
 * Continues the WebSearch-validated FDA-label PK mining for v1.1-stubbed
 * compounds that lacked PK. Same provenance pattern as v1.2 round 1:
 * inline mechanism-prose addendum naming the source label + revision
 * date; source_pmid intentionally absent (FDA labels aren't PMIDs).
 *
 *   clozapine        100 mg PO bid SS (Clozaril label)
 *   dextromethorphan 30 mg PO single, EM phenotype default (Capon 1996)
 *   rasagiline       1 mg PO qd (Azilect label)
 *   tranexamic-acid  1300 mg PO (Lysteda label) - antifibrinolytic
 *   rosiglitazone    4 mg PO qd (Avandia label)
 *   tolbutamide      500 mg PO (Orinase, classic CYP2C9 probe)
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

const PK_DATA: Record<string, { half_life: Record<string, number>; pk: Compound['pk']; mech_addendum: string }> = {
  'clozapine': {
    half_life: { PO: 14 },
    pk: { PO: { ka_hr: 0.6, V_L: 305, F: 0.40 } },
    mech_addendum: ' PK (Clozaril label, 100 mg PO bid SS): Cmax 319 ng/mL (range 102-771), Cmin 122 ng/mL (41-343), Tmax 2.5 h (range 1-6), t½ 12 h single-dose / 14 h SS, F 27-50% (avg 40%), protein binding 97%. Smoking induces CYP1A2 → lowers exposure ~50%; smoking cessation can produce toxicity at unchanged dose. Major fluvoxamine + ciprofloxacin DDIs (CYP1A2 inhibition).',
  },
  'dextromethorphan': {
    half_life: { PO: 2.5 },
    pk: { PO: { ka_hr: 1.5, V_L: 300, F: 0.11 } },
    mech_addendum: ' PK (Capon 1996 PMID:8841152 EM cohort, 30 mg PO single): EM median t½ 2.4 h, PM t½ 19.1 h (150-fold AUC difference between phenotypes — the canonical CYP2D6-polymorphism magnitude). EM F low (~11%) due to extensive first-pass CYP2D6; quinidine bumps EM AUC 43-fold (the DMQ combination product for pseudobulbar affect). Authored at EM phenotype default; phenotype-aware PK would split EM vs PM populations.',
  },
  'rasagiline': {
    half_life: { PO: 3 },
    pk: { PO: { ka_hr: 1.5, V_L: 87, F: 0.36 } },
    mech_addendum: ' PK (Azilect label, 1 mg PO qd SS): Cmax 2.5 ng/mL, Tmax 1 h, t½ 3 h SS, F 36%, Vss 87 L, protein binding 88-94%. Pharmacokinetics doesn\'t correlate with pharmacodynamics — irreversible MAO-B inhibition outlasts plasma exposure by weeks (target re-synthesis dictates effect duration). High-fat meal ↓Cmax 60%, ↓AUC 20%.',
  },
  'tranexamic-acid': {
    half_life: { PO: 11 },
    pk: { PO: { ka_hr: 0.5, V_L: 119, F: 0.45 } },
    mech_addendum: ' PK (Lysteda label, 1300 mg PO multiple-dose SS in women): Cmax 13.83 → 16.41 µg/mL after 5 days SS, AUC 78 µg·h/mL, Tmax 3 h, t½ ~11 h (initial phase ~2 h), F 45%. Protein binding 3% (minimal — nearly all unbound). Renally cleared (>95% unchanged in urine) — dose-adjust in CKD. IV formulation has different PK (instant Cmax, F=1.0).',
  },
  'rosiglitazone': {
    half_life: { PO: 3.5 },
    pk: { PO: { ka_hr: 1.5, V_L: 17.4, F: 0.99 } },
    mech_addendum: ' PK (Avandia label, 4 mg PO qd): Cmax peak 1 h post-dose, t½ 3-4 h (dose-independent), F 99%, Vss/F 17.6 L, protein binding 99.8%. Food ↓Cmax 28% + delays Tmax to 1.75 h but doesn\'t change overall AUC. CYP2C8 substrate — gemfibrozil 2.3× AUC bump (Niemi 2003 PMID:12898007).',
  },
  'tolbutamide': {
    half_life: { PO: 5.5 },
    pk: { PO: { ka_hr: 0.5, V_L: 14, F: 0.80 } },
    mech_addendum: ' PK (Orinase label, 500 mg PO single): Cmax 39-52 mg/L, Tmax 3-4 h, t½ 4.5-6.5 h, F well-absorbed (~80% est), protein binding ~95% (small Vd ~14 L follows). Food does not alter absorption. CYP2C9 substrate — canonical probe for CYP2C9 phenotyping + DDI assessment (fluconazole / sulfaphenazole / aprepitant DDIs documented).',
  },
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let updated = 0;
  for (const [slug, info] of Object.entries(PK_DATA)) {
    const c = bySlug.get(slug);
    if (!c) {
      console.log(`  [warn] ${slug} missing — skipped`);
      continue;
    }
    c.pk = info.pk;
    c.half_life_hr = { ...(c.half_life_hr ?? {}), ...info.half_life };
    if (info.mech_addendum && c.mechanism && !c.mechanism.includes('PK (')) {
      c.mechanism = c.mechanism + info.mech_addendum;
    }
    updated++;
    const route = Object.keys(info.pk ?? {})[0];
    const t12 = Object.values(info.half_life)[0];
    console.log(`  [pk  ] ${slug.padEnd(18)} t½=${t12}h route=${route}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nMisc-stub PK (v1.2 phase 4 round 2): updated ${updated} compounds with FDA-label-sourced PK.`);
}

main();
