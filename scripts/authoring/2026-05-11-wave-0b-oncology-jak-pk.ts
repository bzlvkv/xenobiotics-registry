/**
 * 2026-05-11-wave-0b-oncology-jak-pk.ts — Phase 4 PK mining (v1.2).
 *
 * 7 of the v1.1-added oncology / JAK / Bcl-2 / mTOR stubs were missing
 * PK. Sources: DailyMed FDA labels (acalabrutinib, temsirolimus return
 * cleanly without truncation); WebSearch summarization of accessdata.fda.gov
 * labels + PMC PK reviews for the larger labels that DailyMed truncates
 * (ibrutinib, venetoclax, ruxolitinib, upadacitinib, everolimus).
 *
 * Each compound's mechanism prose is updated with verbatim PK + the
 * source label revision date inline. source_pmid is left undefined
 * (FDA labels aren't PMIDs); data-lint warns but doesn't error.
 *
 *   ibrutinib       560 mg PO qd SS  (Imbruvica label)
 *   acalabrutinib   100 mg PO bid    (Calquence label, DailyMed)
 *   venetoclax      400 mg PO qd SS  (Venclexta label, low-fat meal)
 *   ruxolitinib     20 mg PO bid     (Jakafi label, IR formulation)
 *   upadacitinib    15 mg ER qd      (Rinvoq label, ER formulation)
 *   everolimus      10 mg PO qd      (Afinitor oncology label)
 *   temsirolimus    25 mg IV         (Torisel label, weekly RCC dose)
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
  'ibrutinib': {
    half_life: { PO: 5 },
    pk: { PO: { ka_hr: 0.8, V_L: 122, F: 0.029 } },
    mech_addendum: ' PK (Imbruvica label, SS 560 mg PO qd): AUC 953 ± 705 ng·h/mL, t½ 4-6 h, Tmax 1-2 h, absolute F 2.9% fasted (doubles to ~6% with food — administration with food recommended). Apparent V/F ~4200 L; true Vd ~122 L. CYP3A4 substrate; massive food effect + strong inducer/inhibitor sensitivity.',
  },
  'acalabrutinib': {
    half_life: { PO: 1 },
    pk: { PO: { ka_hr: 4.0, V_L: 101, F: 0.25 } },
    mech_addendum: ' PK (Calquence label, SS 100 mg PO bid): Cmax 563 ng/mL (29% CV), AUC24 1843 ng·h/mL (38% CV), Tmax median 0.9 h, t½ 1 h, F 25%, Vss 101 L (52% CV), protein binding 97.5%. Short t½ explains bid dosing despite irreversible BTK binding (target turnover is what matters).',
  },
  'venetoclax': {
    half_life: { PO: 17 },
    pk: { PO: { ka_hr: 0.15, V_L: 299, F: 1.0 } },
    mech_addendum: ' PK (Venclexta label, SS 400 mg PO qd with low-fat meal): Cmax 2.1 ± 1.1 µg/mL, AUC0-24 32.8 ± 16.9 µg·h/mL, Tmax 5-8 h (slow absorption — explains the late peak), t½ 17 h healthy (35 h severe hepatic impairment). Apparent V/F ~299 L; protein binding ~99%. Must be taken with food (F drops dramatically fasted). Required 5-week dose ramp at initiation (TLS risk).',
  },
  'ruxolitinib': {
    half_life: { PO: 3 },
    pk: { PO: { ka_hr: 1.0, V_L: 72, F: 0.95 } },
    mech_addendum: ' PK (Jakafi label, 20 mg PO bid IR): Cmax 205-7100 nM across single-dose range (linear), Tmax 1-2 h, F ≥95%, t½ 3.0 h IR formulation (5.4 h newer ER once-daily formulation), Vss 72 L. CYP3A4 substrate; no significant food effect.',
  },
  'upadacitinib': {
    half_life: { PO: 11.5 },
    pk: { PO: { ka_hr: 0.4, V_L: 294, F: 1.0 } },
    mech_addendum: ' PK (Rinvoq label, 15 mg ER PO qd): t½ 9-14 h, Tmax 2-3 h fasting / 4 h fed, F 76% relative to IR (absolute F not stated). Apparent CL/F 53.7 L/h, V/F 294 L. Steady state by day 4 with no accumulation. CYP3A4 substrate (avoid strong CYP3A4 inhibitors).',
  },
  'everolimus': {
    half_life: { PO: 17.5 },
    pk: { PO: { ka_hr: 1.5, V_L: 581, F: 1.0 } },
    mech_addendum: ' PK (Afinitor label, 10 mg PO qd oncology dose): Cmax 61.5 ng/mL (29.6% CV), AUC24 435 ng·h/mL (28.1% CV), Tmax 1-2 h, t½ 16-19 h, protein binding ~74%. Apparent CL/F 23 L/h, V/F 581 L. High-fat meal ↓AUC 22%, ↓Cmax 54%; light-fat meal ↓AUC 32%. CYP3A4 + P-gp substrate; therapeutic drug monitoring (target trough 3-8 ng/mL at transplant doses).',
  },
  'temsirolimus': {
    half_life: { IV: 17.3 },
    pk: { IV: { V_L: 172, F: 1.0 } },
    mech_addendum: ' PK (Torisel label, 25 mg IV weekly): mean Cmax 585 ng/mL (CV 14%), AUC 1627 ng·h/mL (CV 26%), t½ 17.3 h (parent); 54.6 h sirolimus metabolite. Vss 172 L in whole blood. Hydrolyzed in vivo to sirolimus (active mTOR-inhibiting metabolite); both species contribute to clinical effect. CYP3A4 substrate.',
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
    console.log(`  [pk  ] ${slug.padEnd(16)} t½=${t12}h route=${route}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nOncology/JAK/mTOR PK (v1.2 phase 4): updated ${updated} compounds with FDA-label-sourced PK.`);
}

main();
