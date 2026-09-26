/**
 * 2026-05-12-pk-mw-residual-batch.ts — silent-miss PK closure (mAbs +
 * hormone + epinephrine) + MW backfill for legitimate large molecules.
 *
 * PK additions (5 compounds):
 *   rituximab              IV   popPK (Rozman 2017 PMID:28339136)
 *   trastuzumab            IV   popPK (Bruno 2005 PMID:15868146)
 *   testosterone-undecanoate IM  Aveed label + Pastuszak 2021 popPK
 *   epinephrine            IV   StatPearls + emergency-med standard
 *   paraxanthine           PO   caffeine metabolite (Lelo 1986 PMID:3741224)
 *
 * MW backfill (6 compounds — biologics + polymers with defined nominal MW):
 *   rituximab           ~145000 Da (IgG1 mAb)
 *   trastuzumab         ~145500 Da (IgG1 mAb)
 *   insulin               5808 Da (human insulin recombinant)
 *   insulin-glargine      6063 Da (modified insulin analog)
 *   inclisiran           17272 Da (chemically-modified siRNA)
 *   polyethylene-glycol   3350 Da (PEG-3350 standard laxative form)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk?: Record<string, { ka_hr?: number; ke_hr?: number; V_L?: number; F?: number; source_pmid?: string; alpha_hr?: number; beta_hr?: number; k21_hr?: number }>;
  half_life_hr?: Record<string, number>;
  mechanism?: string;
  mw_g_mol?: number;
  pk_unauthored?: { reason: string; note?: string };
  [k: string]: unknown;
}

type PkInfo = {
  half_life: Record<string, number>;
  pk: Compound['pk'];
  mech_addendum: string;
};

const PK_DATA: Record<string, PkInfo> = {
  'rituximab': {
    half_life: { IV: 528 }, // 22 days median terminal
    pk: { IV: { V_L: 3.1, F: 1.0, source_pmid: 'PMID:28339136' } },
    mech_addendum: ' PK (Rozman 2017 popPK PMID:28339136 + Rituxan label): IV-only mAb. Two-compartment model with time-varying clearance. V1 (central) 2.7-3.1 L, V/F apparent ~5 L. Two clearance routes: nonspecific CL1 0.14 L/day (Fc-receptor-mediated reticuloendothelial uptake — slow + constant) + specific CL2 0.59 L/day (B-cell/tumor-burden mediated — declines as B cells are depleted). Median terminal t½ 22 days (range 6-52). Steady state by ~16-24 weeks of weekly dosing in NHL protocol.',
  },
  'trastuzumab': {
    half_life: { IV: 684 }, // 28.5 days terminal
    pk: { IV: { V_L: 2.95, F: 1.0, source_pmid: 'PMID:15868146' } },
    mech_addendum: ' PK (Bruno 2005 popPK PMID:15868146 + Herceptin label): IV-only mAb. Two-compartment model with parallel linear + nonlinear elimination; linear clearance dominates during chronic dosing. CL 0.173-0.337 L/day (typical 0.225 L/day) similar to other IgG1 mAbs. V1 (central) 2.95 L. Terminal t½ 28.5 days. Steady state ~12 weeks for weekly or q3-week regimens. Covariates: body weight, AST, albumin, gastric primary, liver mets. Cardiotoxicity not PK-related (HER2-pathway target on cardiomyocytes).',
  },
  'testosterone-undecanoate': {
    half_life: { IM: 720 }, // 30 days from existing
    pk: { IM: { ka_hr: 0.002, V_L: 50, F: 1.0, source_pmid: 'PMID:9876028' } },
    mech_addendum: ' PK (Behre 1999 PMID:9876028 + Aveed FDA label 2014): IM oily depot ester; tissue-esterase cleavage releases free testosterone slowly from intramuscular depot. Peak serum T (~eugonadal range) reaches by ~2 weeks post-injection, slowly decays over 10-14 weeks. Aveed approved regimen: 750 mg IM at 0, 4, 10 weeks loading then q10 weeks maintenance — much less frequent than cypionate/enanthate (weekly-biweekly). Apparent V/F large but ester-hydrolysis-rate-limited (ka ≈ 0.002/hr drives the slow release; true testosterone PK kinetics after release are short-t½ as usual).',
  },
  'epinephrine': {
    half_life: { IV: 0.058 }, // ~3.5 min
    pk: { IV: { V_L: 8, F: 1.0, source_pmid: 'PMID:19534820' } },
    mech_addendum: ' PK (Coté 2009 critical-care popPK PMID:19534820 + EpiPen label): IV anaphylaxis/cardiac-arrest workhorse + IM autoinjector for outpatient anaphylaxis. t½ ~3.5 min — among the shortest of all clinical drugs. Vd 8 L (vascular + minimal tissue). Clearance dominated by hepatic MAO + COMT extraneuronal metabolism (cross-link: monoamine_oxidase_metabolism + catecholamine_synthesis). Oral F essentially zero (massive first-pass MAO/COMT). IM/SC absorption via local vasoconstriction is paradoxically variable; IM thigh (vastus lateralis) preferred over deltoid for autoinjector use (faster + more reliable absorption).',
  },
  'paraxanthine': {
    half_life: { PO: 3.5 },
    pk: { PO: { ka_hr: 1.2, V_L: 40, F: 0.7, source_pmid: 'PMID:3741224' } },
    mech_addendum: ' PK (Lelo 1986 PMID:3741224 + caffeine metabolism literature): Caffeine\'s major 1-N-demethylated metabolite (CYP1A2 product — cross-link: caffeine_demethylation pathway); also dosed directly as a research/supplement compound. t½ 3-4 h, Tmax 1-2 h, F estimated 70% from PO-dosed studies. Apparent Vd 40 L. CYP1A2 substrate same as caffeine parent (smokers/inducers clear faster); minimal CYP-perpetrator activity. Pharmacology similar to caffeine but more A2A-selective + claims of reduced anxiety vs caffeine (limited human data).',
  },
};

// MW backfill targets
const MW_DATA: Record<string, { mw: number; rationale: string }> = {
  'rituximab': { mw: 145000, rationale: 'IgG1 mAb; ~144 kDa per FDA label + Drugbank' },
  'trastuzumab': { mw: 145500, rationale: 'IgG1 mAb; ~145.5 kDa per FDA label + Drugbank' },
  'insulin': { mw: 5808, rationale: 'human insulin recombinant; 51-aa A+B chain dimer joined by 2 disulfide bonds' },
  'insulin-glargine': { mw: 6063, rationale: 'long-acting insulin analog; Asn21→Gly + 2 Arg added to B-chain C-terminus' },
  'inclisiran': { mw: 17272, rationale: 'chemically-modified siRNA (PCSK9 mRNA target); GalNAc-conjugated' },
  'polyethylene-glycol': { mw: 3350, rationale: 'PEG-3350 (MiraLAX, GoLYTELY); standard laxative formulation grade' },
};

function applyPk(c: Compound, info: PkInfo): void {
  c.pk = info.pk;
  c.half_life_hr = { ...(c.half_life_hr ?? {}), ...info.half_life };
  if (info.mech_addendum && c.mechanism && !c.mechanism.includes('PK (')) {
    c.mechanism = c.mechanism + info.mech_addendum;
  }
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let pkApplied = 0;
  for (const [slug, info] of Object.entries(PK_DATA)) {
    const c = bySlug.get(slug);
    if (!c) { console.log(`  [warn] PK target missing: ${slug}`); continue; }
    applyPk(c, info);
    pkApplied++;
    const route = Object.keys(info.pk ?? {})[0];
    const t12 = Object.values(info.half_life)[0];
    console.log(`  [pk  ] ${slug.padEnd(28)} t½=${t12}h route=${route}`);
  }

  let mwApplied = 0;
  for (const [slug, info] of Object.entries(MW_DATA)) {
    const c = bySlug.get(slug);
    if (!c) { console.log(`  [warn] MW target missing: ${slug}`); continue; }
    c.mw_g_mol = info.mw;
    mwApplied++;
    console.log(`  [mw  ] ${slug.padEnd(28)} mw_g_mol=${info.mw} (${info.rationale.slice(0, 50)})`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nResidual batch: +${pkApplied} PK, +${mwApplied} MW backfill.`);
}

main();
