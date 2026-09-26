/**
 * 2026-05-03-wave-0b-prescription-meds-2.ts — Wave 0b second sub-batch.
 *
 * Closes out the remaining common-Rx gaps after the first batch:
 *   - Antibiotics: cephalexin, clindamycin, levofloxacin, vancomycin,
 *     sulfamethoxazole, trimethoprim
 *   - Antivirals: acyclovir, valacyclovir, oseltamivir
 *   - Cardiovascular: chlorthalidone, sotalol, isosorbide-mononitrate,
 *     diltiazem, verapamil (the two non-DHP CCBs are major CYP3A4
 *     perpetrators — high DDI relevance)
 *   - Anticoagulants: heparin (no single MW — polymer), enoxaparin (LMWH)
 *   - LABAs: salmeterol, formoterol
 *   - Antihistamine: desloratadine
 *   - Gepants (CGRP antagonists): rimegepant, ubrogepant
 *
 * Same stub shape + idempotent rules as the first sub-batch.
 *
 * Run:  pnpm tsx scripts/authoring/2026-05-03-wave-0b-prescription-meds-2.ts
 *       pnpm tsx scripts/authoring/2026-05-02-systems-tagging.ts
 *       pnpm registry:lint && pnpm -r test
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Stub = {
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  mechanism: string;
  routes: string[];
  doses: Record<string, { min: number; max: number; typical: number; unit?: string }>;
  half_life_hr: Record<string, number>;
  mw_g_mol?: number;
  refs: string[];
};

const STUBS: Stub[] = [
  // ── ANTIBIOTICS ───────────────────────────────────────────────────
  {
    slug: 'cephalexin',
    name: 'Cephalexin',
    aliases: ['Keflex'],
    category: 'pharmacological',
    mechanism: 'First-generation cephalosporin β-lactam — inhibits transpeptidase (PBPs) blocking peptidoglycan crosslinking in bacterial cell walls. Renally cleared unchanged; no CYP. Common for skin / urinary tract infections; ~10% cross-reactivity in penicillin-allergic patients.',
    routes: ['PO'],
    doses: { 'PO': { min: 250, max: 1000, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 347.39,
    refs: [],
  },
  {
    slug: 'clindamycin',
    name: 'Clindamycin',
    aliases: ['Cleocin'],
    category: 'pharmacological',
    mechanism: 'Lincosamide antibiotic — binds 50S ribosomal subunit (overlapping macrolide site) blocking translocation. Anaerobic + gram-positive coverage. Highest C. difficile infection signal among antibiotics. CYP3A4 substrate.',
    routes: ['PO', 'IV', 'IM', 'TD'],
    doses: { 'PO': { min: 150, max: 450, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 424.98,
    refs: [],
  },
  {
    slug: 'levofloxacin',
    name: 'Levofloxacin',
    aliases: ['Levaquin'],
    category: 'pharmacological',
    mechanism: 'Respiratory fluoroquinolone — S-enantiomer of ofloxacin. Inhibits bacterial DNA gyrase + topoisomerase IV. Better gram-positive (S. pneumoniae) coverage than ciprofloxacin. Same fluoroquinolone class warnings: tendinopathy, neuropathy, QT prolongation, aortopathy.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 250, max: 750, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 361.37,
    refs: [],
  },
  {
    slug: 'vancomycin',
    name: 'Vancomycin',
    aliases: ['Vancocin'],
    category: 'pharmacological',
    mechanism: 'Glycopeptide antibiotic — binds D-Ala-D-Ala terminus of peptidoglycan precursors blocking transpeptidation. Workhorse against MRSA + severe gram-positive infections. IV for systemic; PO for C. difficile colitis (not absorbed). Nephrotoxicity + ototoxicity require trough monitoring.',
    routes: ['IV', 'PO'],
    doses: { 'IV': { min: 500, max: 2000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'IV': 6 },
    mw_g_mol: 1449.25,
    refs: [],
  },
  {
    slug: 'sulfamethoxazole',
    name: 'Sulfamethoxazole',
    aliases: ['Component of Bactrim / Septra'],
    category: 'pharmacological',
    mechanism: 'Sulfonamide antibiotic — competitive inhibitor of bacterial dihydropteroate synthase (DHPS) blocking folate synthesis. Always co-formulated with trimethoprim for synergistic folate-pathway blockade. CYP2C9 inhibitor (raises warfarin INR).',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 800, max: 1600, typical: 800, unit: 'mg' } },
    half_life_hr: { 'PO': 10 },
    mw_g_mol: 253.28,
    refs: [],
  },
  {
    slug: 'trimethoprim',
    name: 'Trimethoprim',
    aliases: ['Component of Bactrim / Septra'],
    category: 'pharmacological',
    mechanism: 'Antifolate — inhibits bacterial dihydrofolate reductase (DHFR), blocking tetrahydrofolate synthesis downstream of sulfamethoxazole\'s DHPS step. Synergistic when combined. Modest renal tubular K+ secretion blockade → hyperkalemia.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 100, max: 200, typical: 160, unit: 'mg' } },
    half_life_hr: { 'PO': 10 },
    mw_g_mol: 290.32,
    refs: [],
  },

  // ── ANTIVIRALS ────────────────────────────────────────────────────
  {
    slug: 'acyclovir',
    name: 'Acyclovir',
    aliases: ['Zovirax'],
    category: 'pharmacological',
    mechanism: 'Acyclic guanosine analog. Phosphorylated by viral thymidine kinase (HSV / VZV) → tri-phosphate is a competitive substrate + chain-terminator for viral DNA polymerase. Selectively activated in infected cells. Renal-cleared; nephrotoxicity at high IV doses if hydration is poor.',
    routes: ['PO', 'IV', 'TD'],
    doses: { 'PO': { min: 200, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 225.20,
    refs: [],
  },
  {
    slug: 'valacyclovir',
    name: 'Valacyclovir',
    aliases: ['Valtrex'],
    category: 'pharmacological',
    mechanism: 'L-valyl ester prodrug of acyclovir — first-pass valine hydrolysis improves oral F from ~15% (acyclovir) to ~55% (valacyclovir). Same downstream antiviral mechanism. Once-daily HSV suppression dosing supported by improved exposure.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 2000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 324.34,
    refs: [],
  },
  {
    slug: 'oseltamivir',
    name: 'Oseltamivir',
    aliases: ['Tamiflu'],
    category: 'pharmacological',
    mechanism: 'Influenza neuraminidase inhibitor prodrug — hydrolyzed to active oseltamivir carboxylate by hepatic carboxylesterase. Blocks release of newly assembled virions from infected respiratory epithelial cells. Modest symptom-duration reduction (~1 day) when started <48h from symptom onset.',
    routes: ['PO'],
    doses: { 'PO': { min: 30, max: 75, typical: 75, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 312.40,
    refs: [],
  },

  // ── CARDIOVASCULAR ────────────────────────────────────────────────
  {
    slug: 'chlorthalidone',
    name: 'Chlorthalidone',
    aliases: ['Hygroton', 'Thalitone'],
    category: 'pharmacological',
    mechanism: 'Thiazide-like diuretic — inhibits Na+/Cl- cotransporter (NCC) in distal convoluted tubule like HCTZ but with much longer half-life (~50h). ALLHAT and SHEP outcome data showed lower CV mortality vs HCTZ in some analyses; preferred over HCTZ in some hypertension guidelines.',
    routes: ['PO'],
    doses: { 'PO': { min: 12.5, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 50 },
    mw_g_mol: 338.77,
    refs: [],
  },
  {
    slug: 'sotalol',
    name: 'Sotalol',
    aliases: ['Betapace'],
    category: 'pharmacological',
    mechanism: 'Class III antiarrhythmic + non-selective β-adrenergic blocker. Prolongs cardiac action potential via IKr blockade (class III) on top of β-blockade. Used for AF rhythm control + ventricular arrhythmias. QT prolongation requires inpatient initiation in many practices.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 80, max: 320, typical: 160, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 272.36,
    refs: [],
  },
  {
    slug: 'isosorbide-mononitrate',
    name: 'Isosorbide Mononitrate',
    aliases: ['ISMN', 'Imdur'],
    category: 'pharmacological',
    mechanism: 'Active metabolite of isosorbide dinitrate — bypasses hepatic first-pass nitrate conversion. Releases NO in vascular smooth muscle → cGMP → vasodilation; preferentially venous, reducing preload. Used for chronic stable angina + heart failure. Tolerance develops with continuous exposure → daily nitrate-free interval recommended.',
    routes: ['PO'],
    doses: { 'PO': { min: 20, max: 240, typical: 60, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 191.14,
    refs: [],
  },
  {
    slug: 'diltiazem',
    name: 'Diltiazem',
    aliases: ['Cardizem'],
    category: 'pharmacological',
    mechanism: 'Non-dihydropyridine CCB — Cav1.2 blocker with both vascular and cardiac (AV-nodal) effects. Used for AF rate control + hypertension. Moderate CYP3A4 inhibitor → significant DDI footprint (statin myopathy, raised cyclosporine, raised carbamazepine).',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 60, max: 480, typical: 240, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 414.52,
    refs: [],
  },
  {
    slug: 'verapamil',
    name: 'Verapamil',
    aliases: ['Calan', 'Isoptin'],
    category: 'pharmacological',
    mechanism: 'Non-dihydropyridine CCB — strongest cardiac (AV-nodal) effect of the class. Used for AF rate control, certain SVTs, hypertension, and migraine prophylaxis. Strong CYP3A4 + P-glycoprotein inhibitor → major DDI source. Constipation (~25%).',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 80, max: 480, typical: 240, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 454.60,
    refs: [],
  },

  // ── ANTICOAGULANTS — heparin/LMWH polymer-class ───────────────────
  // No single defined MW; treat as class compounds without mw_g_mol.
  {
    slug: 'heparin',
    name: 'Heparin (unfractionated)',
    aliases: ['UFH'],
    category: 'pharmacological',
    mechanism: 'Sulfated glycosaminoglycan polymer — binds antithrombin → ~1000× acceleration of antithrombin\'s inhibition of thrombin (factor IIa) and factor Xa. Heparin chain length governs the IIa/Xa ratio. IV/SC; aPTT-monitored. Heparin-induced thrombocytopenia (HIT) is a feared complication.',
    routes: ['IV', 'SC'],
    doses: { 'IV': { min: 5000, max: 35000, typical: 18000, unit: 'IU' } },
    half_life_hr: { 'IV': 1.5 },
    refs: [],
  },
  {
    slug: 'enoxaparin',
    name: 'Enoxaparin',
    aliases: ['Lovenox', 'LMWH'],
    category: 'pharmacological',
    mechanism: 'Low-molecular-weight heparin (~4500 Da average). Same antithrombin-mediated mechanism but biased toward factor Xa inhibition (Xa:IIa activity ratio ~3.8:1 vs UFH ~1:1). Predictable dose-response → no aPTT monitoring needed. Lower HIT incidence than UFH; preferred over UFH in most non-renal-failure scenarios.',
    routes: ['SC', 'IV'],
    doses: { 'SC': { min: 30, max: 100, typical: 40, unit: 'mg' } },
    half_life_hr: { 'SC': 4.5 },
    refs: [],
  },

  // ── LABAs — long-acting β2 agonists ───────────────────────────────
  {
    slug: 'salmeterol',
    name: 'Salmeterol',
    aliases: ['Serevent'],
    category: 'pharmacological',
    mechanism: 'Long-acting β2-adrenergic agonist (LABA) — saligenin moiety + long lipophilic tail anchors it in the β2 receptor environment for ~12h dosing. Always combined with inhaled corticosteroid for asthma maintenance (LABA monotherapy carries a mortality signal in asthma). Used in fluticasone+salmeterol (Advair).',
    routes: ['INH'],
    doses: { 'INH': { min: 0.025, max: 0.05, typical: 0.05, unit: 'mg' } },
    half_life_hr: { 'INH': 11 },
    mw_g_mol: 415.57,
    refs: [],
  },
  {
    slug: 'formoterol',
    name: 'Formoterol',
    aliases: ['Foradil', 'Perforomist'],
    category: 'pharmacological',
    mechanism: 'Long-acting β2-adrenergic agonist with rapid onset (~2 min vs salmeterol\'s ~30 min). 12h duration. Used in budesonide+formoterol (Symbicort) for asthma maintenance + reliever, and in COPD inhalers.',
    routes: ['INH'],
    doses: { 'INH': { min: 0.0045, max: 0.024, typical: 0.012, unit: 'mg' } },
    half_life_hr: { 'INH': 10 },
    mw_g_mol: 344.40,
    refs: [],
  },

  // ── ANTIHISTAMINES ────────────────────────────────────────────────
  {
    slug: 'desloratadine',
    name: 'Desloratadine',
    aliases: ['Clarinex'],
    category: 'pharmacological',
    mechanism: 'Active descarboethoxy metabolite of loratadine — a third-generation H1 antagonist with the same minimal CNS penetration but cleaner pharmacokinetics. Once-daily dosing for allergic rhinitis + chronic urticaria.',
    routes: ['PO'],
    doses: { 'PO': { min: 2.5, max: 5, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 27 },
    mw_g_mol: 310.82,
    refs: [],
  },

  // ── GEPANTS (CGRP receptor antagonists for migraine) ──────────────
  {
    slug: 'rimegepant',
    name: 'Rimegepant',
    aliases: ['Nurtec ODT'],
    category: 'pharmacological',
    mechanism: 'Small-molecule CGRP receptor antagonist — competitive blockade at the CLR/RAMP1 receptor. Approved for both acute migraine treatment and migraine prevention (every-other-day dosing). No vasoconstriction → safe in CAD where triptans are contraindicated. CYP3A4 substrate.',
    routes: ['PO'],
    doses: { 'PO': { min: 75, max: 75, typical: 75, unit: 'mg' } },
    half_life_hr: { 'PO': 11 },
    mw_g_mol: 534.56,
    refs: [],
  },
  {
    slug: 'ubrogepant',
    name: 'Ubrogepant',
    aliases: ['Ubrelvy'],
    category: 'pharmacological',
    mechanism: 'Small-molecule CGRP receptor antagonist for acute migraine. Same trigeminovascular CLR/RAMP1 receptor target as rimegepant; shorter half-life. CYP3A4 substrate — strong inhibitors contraindicated.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 100, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 449.42,
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0;
  let skipped = 0;
  for (const stub of STUBS) {
    if (bySlug.has(stub.slug)) {
      skipped++;
      continue;
    }
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log('\nWave 0b second sub-batch — closing the prescription-meds gap:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
