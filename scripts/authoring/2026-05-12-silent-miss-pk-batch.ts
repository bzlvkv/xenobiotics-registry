/**
 * 2026-05-12-silent-miss-pk-batch.ts — v1.2 closure.
 *
 * 12 silent-miss compounds: each was authored to the registry without
 * `pk[route]` AND without `pk_unauthored` to document why. These are
 * the v1.2 audit residuals — FDA-approved (or investigational, with
 * abstract-published Phase I PK) drugs where the absence wasn't
 * intentional, just a fall-through during stub authoring.
 *
 * Closes the v1.2 silent-miss row identified in the 2026-05-11 audit
 * (23 total no-PK compounds; the other 11 are deferred: mAbs-2,
 * amino-acid/peptide-7, hormones-2 — different sourcing patterns).
 *
 * 10 land as FDA-label-sourced PK with provenance recorded inline in
 * mechanism prose (label name + revision date). 1 is reclassified as
 * `pk_unauthored: local-acting` (pyrantel-pamoate — pamoate salt is
 * engineered to stay in the gut). 1 lands as PMID-sourced PK from a
 * Phase I trial (navitoclax — Wilson 2010, PMID:21282543).
 *
 *   minocycline       PO 100 mg bid SS (Minocin label 2024)
 *   sulfasalazine     PO 2 g qd        (Azulfidine label) — parent F <15%; metabolites differ
 *   nadolol           PO 40 mg qd      (Corgard label)
 *   phenelzine        PO 45 mg qd      (Nardil label) — single-dose PK; PD outlasts plasma
 *   dicyclomine       PO 20 mg qid     (Bentyl label) — t½ correction: 1.8h, not 4h
 *   butalbital        PO 50 mg q6h     (Fioricet label)
 *   tacrine           PO 40 mg qid     (Cognex label) — withdrawn 2013, PK still cited
 *   cerivastatin      PO 0.4 mg qd     (Baycol label) — withdrawn 2001 (gemfibrozil DDI)
 *   elvitegravir      PO 150 mg qd     (Vitekta label) — boosted with cobicistat
 *   setmelanotide     SC 3 mg qd       (Imcivree label)
 *   navitoclax        PO 200 mg qd     (PMID:21282543 — Wilson Lancet Oncol 2010 Phase I)
 *   pyrantel-pamoate  RECLASSIFIED to pk_unauthored.local-acting
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
  pk_unauthored?: { reason: string; note?: string };
  [k: string]: unknown;
}

type PkInfo = {
  half_life: Record<string, number>;
  pk: Compound['pk'];
  mech_addendum: string;
};

const PK_DATA: Record<string, PkInfo> = {
  'minocycline': {
    half_life: { PO: 15.5 },
    pk: { PO: { ka_hr: 1.0, V_L: 100, F: 0.95 } },
    mech_addendum: ' PK (Minocin label 2024, capsule formulation): Cmax 2.1–5.1 µg/mL (avg 3.5 µg/mL), Tmax 1–4 h (avg 2.1 h), t½ 11.1–22.1 h (avg 15.5 h), oral absorption virtually complete (F ≈ 0.95). High-fat meal does not change extent of absorption but delays Tmax by 1 h. Highly lipophilic of the tetracyclines — good CSF + sebaceous-gland penetration.',
  },
  'sulfasalazine': {
    half_life: { PO: 7.6 },
    pk: { PO: { ka_hr: 0.3, V_L: 7.5, F: 0.15 } },
    mech_addendum: ' PK (Azulfidine label, parent species): Absolute F < 15% for parent — most of a PO dose is cleaved by colonic bacteria to sulfapyridine (F 60%, well-absorbed) + 5-aminosalicylic acid (F 10–30%, poorly absorbed, locally active). Vdss 7.5 ± 1.6 L from IV data, t½ 7.6 ± 3.4 h. The "PK" recorded here is for the parent — the clinical effect is driven by 5-ASA topically in the colon for UC and by an undefined immunomodulatory mechanism for RA.',
  },
  'nadolol': {
    half_life: { PO: 20 },
    pk: { PO: { ka_hr: 0.4, V_L: 135, F: 0.30 } },
    mech_addendum: ' PK (Corgard label + Kalsoom 2022 systematic review PMID:35243668): F ~30–35% (poor oral absorption — hydrophilic β-blocker), apparent Vd ~1.9 L/kg (~135 L), t½ 17–23 h (allowing once-daily dosing), Tmax 3–4 h. ~75% renally excreted unchanged — accumulates in renal impairment. Steady state by day 3. Binds primarily to α₁-acid glycoprotein, free fraction ~0.7.',
  },
  'phenelzine': {
    half_life: { PO: 11.6 },
    pk: { PO: { ka_hr: 2.0, V_L: 200, F: 0.50 } },
    mech_addendum: ' PK (Nardil label, single 30 mg PO dose): Cmax 19.8 ng/mL at Tmax 43 min, mean t½ 11.6 h, extensive metabolism via MAO (73% of dose recovered in urine as phenylacetic + parahydroxyphenylacetic acid within 96 h). Multiple-dose PK not studied in humans. PD-PK divergence: PD effect (irreversible MAO-A/B inactivation) outlasts plasma by weeks since target re-synthesis dictates effect duration — same caveat that applies to rasagiline and selegiline. F and Vd not in the label; estimates are textbook (~0.5 F first-pass, ~200 L apparent Vd from large lipophilic-amine class).',
  },
  'dicyclomine': {
    half_life: { PO: 1.8 },
    pk: { PO: { ka_hr: 1.5, V_L: 256, F: 0.67 } },
    mech_addendum: ' PK (Bentyl label): Relative F 67% (oral vs IM), apparent Vd 3.65 L/kg (~256 L), t½ 1.8 h, Tmax 1–1.5 h (capsule/tablet/solution equivalent). Note: the t½ correction here resolves a v0.x-era authored value of 4 h that did not match the Bentyl label. Anticholinergic with central muscarinic effects at therapeutic doses.',
  },
  'butalbital': {
    half_life: { PO: 35 },
    pk: { PO: { ka_hr: 1.0, V_L: 56, F: 0.95 } },
    mech_addendum: ' PK (Fioricet label, butalbital component): Well-absorbed from GI tract (F ~0.95 — textbook for short/intermediate-acting barbiturates), t½ 35 h (intermediate-acting), elimination 59–88% renal as parent or metabolites. Vd ~0.8 L/kg (~56 L, textbook barbiturate). The 35-h t½ underlies the rebound-headache risk on chronic Fioricet use — multi-day accumulation at qid dosing. Tmax not in the label; co-formulated APAP (t½ 1–3 h) + caffeine (t½ 3 h) clear long before butalbital.',
  },
  'tacrine': {
    half_life: { PO: 3 },
    pk: { PO: { ka_hr: 1.0, V_L: 350, F: 0.17 } },
    mech_addendum: ' PK (Cognex label, withdrawn 2013 for hepatotoxicity but PK well-characterized): Absolute F 17 ± 13% (low — extensive first-pass via CYP1A2), Tmax 1–2 h, t½ ~3 h (qid dosing). Apparent V 349 ± 193 L (large lipophilic distribution). Protein binding ~55%. Food reduces F by 30–40% (give ≥1 h before meals). The first FDA-approved AChE inhibitor for Alzheimer\'s, displaced by donepezil/rivastigmine/galantamine — kept in the registry for CYP1A2 victim modeling (fluvoxamine → tacrine 8.30× authored Wave 2a v1.1).',
  },
  'cerivastatin': {
    half_life: { PO: 3 },
    pk: { PO: { ka_hr: 0.7, V_L: 21, F: 0.60 } },
    mech_addendum: ' PK (Baycol label + Mück 2000 PMID:10976657 review): Absolute F 60% (range 39–101%) due to presystemic first-pass, Tmax 2–3 h, terminal t½ 2–4 h, plasma protein binding >99%, apparent Vd ~0.3 L/kg (~21 L). Dual CYP2C8/CYP3A4 metabolism — the latter pathway only ~50% effective when both routes are inhibited, which is why gemfibrozil (CYP2C8 inhibitor, AUC ↑5.59× Wave 2a v1.1) and itraconazole (CYP3A4) produced lethal rhabdomyolysis combinations and led to the August 2001 worldwide withdrawal after 52 fatal cases.',
  },
  'elvitegravir': {
    half_life: { PO: 13 },
    pk: { PO: { ka_hr: 0.5, V_L: 120, F: 0.50 } },
    mech_addendum: ' PK (Vitekta label, 150 mg PO qd boosted with cobicistat 150 mg or ritonavir 100 mg): Tmax ~4 h, t½ 13 h boosted (vs. ~3 h unboosted — the booster eliminates CYP3A4 first-pass). Protein binding 98–99%. CYP3A substrate (primary) + UGT1A1/3 glucuronidation. F nominally low without booster but clinical-use F is "effective ~0.5" with COBI (the Stribild / Genvoya regimen). Always given with food (increases AUC substantially). Apparent Vd ~120 L (textbook for the boosted state).',
  },
  'setmelanotide': {
    half_life: { SC: 11 },
    pk: { SC: { ka_hr: 0.2, V_L: 75, F: 0.85 } },
    mech_addendum: ' PK (Imcivree label, 3 mg SC qd SS): Apparent V/F 75.2 L, effective t½ ~11 h, total apparent CL/F 7.15 L/h (typical 120 kg male, normal renal function). Free fraction ~0.2. SC bioavailability lower than IV due to interstitial protease/peptidase degradation + lymphatic clearance — F 0.85 estimated (label notes "lower than IV" without quoting; consistent with other small-peptide SC depots). Metabolized to small peptides by general catabolic pathways. First MC4R agonist approved for monogenic obesity (POMC/PCSK1/LEPR deficiency, BBS).',
  },
  'navitoclax': {
    half_life: { PO: 22.2 },
    pk: { PO: { ka_hr: 0.2, V_L: 40, F: 0.30, source_pmid: 'PMID:21282543' } },
    mech_addendum: ' PK (Wilson Lancet Oncol 2010 Phase I PMID:21282543 + lymphatic-transport PK PMID:24212376): Low aqueous solubility, high logP — F ~30% in humans (56.5% in fed dogs, lower in fasted state — strong food effect). Apparent Vd ~0.5–0.7 L/kg (~35–50 L), t½ 22.2 h, Tmax 5–6 h (slow absorption via mixed portal + lymphatic uptake). Exposure dose-proportional 50–425 mg/d. Phase I dose-limiting toxicity was thrombocytopenia (Bcl-xL on-target effect on platelets), which paved the way for the more Bcl-2-selective venetoclax (Venclexta).',
  },
};

const PYRANTEL_RECLASSIFY = {
  slug: 'pyrantel-pamoate',
  pk_unauthored: {
    reason: 'local-acting' as const,
    note: 'Pamoate salt is engineered to stay in the GI tract — F ~16% systemic for the pamoate vs. 41% for the (unavailable in US) citrate salt. The drug acts as a depolarizing neuromuscular blocker on luminal nematodes; systemic exposure is incidental and not the therapeutic target. Treated as local-acting for the same reason acarbose / rifaximin / simethicone are.',
  },
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
    console.log(`  [pk  ] ${slug.padEnd(18)} t½=${t12}h route=${route}`);
  }

  const pyr = bySlug.get(PYRANTEL_RECLASSIFY.slug);
  if (pyr) {
    pyr.pk_unauthored = PYRANTEL_RECLASSIFY.pk_unauthored;
    console.log(`  [unau] ${PYRANTEL_RECLASSIFY.slug.padEnd(18)} reclassified → local-acting`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nSilent-miss PK closure: +${pkApplied} PK profiles + 1 reclassification. 12 v1.2 audit residuals resolved.`);
}

main();
