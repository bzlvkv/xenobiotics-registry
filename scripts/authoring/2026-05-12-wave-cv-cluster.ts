/**
 * 2026-05-12-wave-cv-cluster.ts — Cardiovascular cluster (CV-1..4).
 *
 * Four waves in one apply pass to keep pathway authoring coherent:
 *
 *   CV-1 BP & vasoactive       2 new pathways (calcium_channel_modulation,
 *                              vasodilator_no_endothelin) + RAAS modulator
 *                              extension + renal_tubular_transport extension
 *   CV-2 Antiarrhythmics       cardiac_action_potential modulator extension
 *                              (Vaughan-Williams I-IV + ivabradine + digoxin)
 *   CV-3 Hemostasis Rx         coagulation_cascade + platelet_aggregation
 *                              modulator extensions (anticoagulants +
 *                              antiplatelets + thrombolytics)
 *   CV-4 Lipid handling        cholesterol_synthesis + ldl_receptor_pcsk9_axis
 *                              modulator extensions (statins + non-statin
 *                              lipid-lowering + PCSK9 inhibitors)
 *
 * Idempotent: re-running adds nothing — `addModulators` skips already-present
 * slugs by identity. New pathways skip on slug match.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}

// ─────────────────────────────────────────────────────────────────────
// CV-1: New pathways
// ─────────────────────────────────────────────────────────────────────

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'calcium_channel_modulation',
    name: 'Voltage-gated calcium channels (L-type / T-type / α2δ)',
    category: 'signaling',
    systems: ['cardiovascular', 'nervous'],
    description: `L-type Cav1.x channels carry inward Ca²⁺ in cardiac + vascular smooth muscle (phase 2 plateau + vasoconstriction). Dihydropyridines (amlodipine, nifedipine, felodipine, nicardipine, isradipine, nimodipine) preferentially block vascular L-type → vasodilation; reflex tachycardia tempered by long-acting kinetics. Non-dihydropyridines (verapamil phenylalkylamine + diltiazem benzothiazepine) hit cardiac + vascular L-type → AV block + negative inotropy + vasodilation; antiarrhythmic class IV. T-type Cav3.x (ethosuximide) underlies thalamic 3-Hz spike-wave absence seizures. α2δ subunits (gabapentin / pregabalin) modulate channel assembly; gabapentinoids reduce neurotransmitter release at presynaptic terminals.`,
    steps: [
      { from: 'depolarization', to: 'l-type-calcium-influx', via: 'Cav1.2 (cardiac/smooth muscle) or Cav1.3 (sinoatrial) opening' },
      { from: 'l-type-calcium-influx', to: 'cytosolic-calcium-rise', via: 'cytoplasmic Ca²⁺ activates contraction (muscle) or release (Ca²⁺-induced Ca²⁺ release in cardiac SR)' },
    ],
    modulators: [
      { slug: 'amlodipine', effect: 'inhibitor', target: 'L-type Cav1.2 (vascular)', note: 'long-acting dihydropyridine; vascular-selective; daily dosing; first-line HTN' },
      { slug: 'nifedipine', effect: 'inhibitor', target: 'L-type Cav1.2 (vascular)', note: 'first dihydropyridine; short-acting IR form caused reflex tachycardia + ischemia (withdrawn); ER form used in HTN + Raynaud' },
      { slug: 'felodipine', effect: 'inhibitor', target: 'L-type Cav1.2 (vascular)', note: 'dihydropyridine; CYP3A4 substrate (grapefruit DDI 4× AUC documented Bailey 1991)' },
      { slug: 'nicardipine', effect: 'inhibitor', target: 'L-type Cav1.2 (vascular)', note: 'dihydropyridine; IV use in hypertensive emergencies + ICU BP control' },
      { slug: 'isradipine', effect: 'inhibitor', target: 'L-type Cav1.2 (vascular)', note: 'dihydropyridine; mild PD-protection signal in early studies (negative phase 3 STEADY-PD III 2020)' },
      { slug: 'nimodipine', effect: 'inhibitor', target: 'L-type Cav1.2 (cerebral vasculature)', note: 'CNS-penetrant dihydropyridine; SAH-vasospasm prophylaxis indication' },
      { slug: 'verapamil', effect: 'inhibitor', target: 'L-type Cav1.2 (cardiac + vascular)', note: 'phenylalkylamine; cardiac-dominant — AV nodal blocker (SVT rate control); CYP3A4 inhibitor (DDI hot spot with statins/midazolam authored Wave 2a v1.1)' },
      { slug: 'diltiazem', effect: 'inhibitor', target: 'L-type Cav1.2 (cardiac + vascular)', note: 'benzothiazepine; intermediate cardiac/vascular profile; CYP3A4 inhibitor' },
      { slug: 'ethosuximide', effect: 'inhibitor', target: 'T-type Cav3.x (thalamic)', note: 'absence seizure first-line; blocks low-threshold 3-Hz spike-wave oscillator' },
      { slug: 'gabapentin', effect: 'inhibitor', target: 'α2δ-1 subunit (presynaptic Ca channel)', note: 'reduces glutamate/substance-P release at primary afferent terminals; neuropathic pain + restless legs + adjunct seizures' },
      { slug: 'pregabalin', effect: 'inhibitor', target: 'α2δ-1 subunit', note: 'higher-affinity α2δ ligand vs gabapentin; linear PK (no saturable absorption); generalized anxiety + fibromyalgia + neuropathic pain' },
    ],
    refs: [],
  },
  {
    slug: 'vasodilator_no_endothelin',
    name: 'Vasodilator pharmacology (NO / sGC / endothelin / direct)',
    category: 'signaling',
    systems: ['cardiovascular'],
    description: `Vascular tone arises from the balance of vasoconstrictors (endothelin-1, angiotensin II, NE) and vasodilators (NO/sGC/cGMP cascade, prostacyclin, ANP/BNP). Therapeutic vasodilators split: NO donors (organic nitrates → NO → sGC activation → cGMP → PKG → vasodilation) are tolerance-prone at chronic exposure. Soluble guanylate cyclase (sGC) stimulators (riociguat) act NO-independently — synergistic with endogenous NO. PDE5 inhibitors (sildenafil family, not all in registry) preserve cGMP. Endothelin-receptor antagonists (bosentan dual ET-A/B, macitentan, ambrisentan ET-A-selective) blunt the most potent endogenous vasoconstrictor — PAH indication. Direct smooth-muscle relaxants (hydralazine, minoxidil) — mechanism less specified. ARNI (sacubitril) blocks neprilysin → preserves ANP/BNP → natriuresis + vasodilation.`,
    steps: [
      { from: 'l-arginine', to: 'nitric-oxide', via: 'eNOS in endothelium (cross-link: nitric_oxide_synthesis)' },
      { from: 'nitric-oxide', to: 'cgmp-elevation', via: 'sGC activation by NO → cGMP from GTP' },
      { from: 'cgmp-elevation', to: 'vasodilation', via: 'PKG → myosin light chain phosphatase activation → smooth-muscle relaxation' },
      { from: 'endothelin-1', to: 'vasoconstriction', via: 'ET-A receptor on smooth muscle → Gq → IP3 → cytosolic Ca²⁺ rise (cross-link: inositol_phosphate_signaling)' },
    ],
    modulators: [
      { slug: 'nitroglycerin', effect: 'activator', target: 'NO release (mitochondrial ALDH2)', note: 'organic nitrate; ALDH2 bioactivation; sublingual rescue for angina; tolerance with continuous exposure → daily nitrate-free interval required' },
      { slug: 'isosorbide-mononitrate', effect: 'activator', target: 'NO release', note: 'long-acting organic nitrate; chronic angina prophylaxis; same tolerance issue as nitroglycerin' },
      { slug: 'riociguat', effect: 'activator', target: 'sGC (NO-independent stimulator)', note: 'PAH + CTEPH; works even when endogenous NO is low; pregnancy contraindicated (teratogenic)' },
      { slug: 'bosentan', effect: 'inhibitor', target: 'endothelin ET-A + ET-B (dual antagonist)', note: 'PAH; hepatotoxicity (monthly LFT monitoring); CYP3A4/2C9 substrate + inducer (multi-DDI perpetrator authored Wave 2a v1.1)' },
      { slug: 'macitentan', effect: 'inhibitor', target: 'endothelin ET-A + ET-B', note: 'newer ERA; once-daily; replaces bosentan in many PAH protocols; less hepatotoxicity' },
      { slug: 'hydralazine', effect: 'activator', target: 'direct vascular smooth muscle relaxant (mechanism not fully specified)', note: 'arteriolar dilator; reflex tachycardia + fluid retention; lupus-like syndrome at high doses; classic HF combo with isosorbide-dinitrate' },
      { slug: 'sacubitril', effect: 'inhibitor', target: 'neprilysin (NEP)', note: 'ARNI component (combined with valsartan as Entresto); blocks ANP/BNP degradation → natriuresis + vasodilation; HFrEF mortality benefit (PARADIGM-HF)' },
    ],
    refs: [],
  },
];

// ─────────────────────────────────────────────────────────────────────
// CV-1 modulator extensions
// ─────────────────────────────────────────────────────────────────────

const MODULATOR_ADDITIONS: Record<string, PathwayModulator[]> = {
  // CV-1: RAAS extension (ACE-i + ARBs)
  raas_axis: [
    { slug: 'captopril', effect: 'inhibitor', target: 'ACE', note: 'first oral ACE-i; short t½ (qid); SH group → unique cough/taste/skin side effects' },
    { slug: 'enalapril', effect: 'inhibitor', target: 'ACE (prodrug → enalaprilat)', note: 'prodrug hydrolyzed by hepatic esterases to active enalaprilat; bid dosing' },
    { slug: 'lisinopril', effect: 'inhibitor', target: 'ACE', note: 'not a prodrug; renally cleared; once-daily; widely prescribed first-line HTN + HFrEF' },
    { slug: 'ramipril', effect: 'inhibitor', target: 'ACE (prodrug → ramiprilat)', note: 'cardio-protective indication (HOPE trial) beyond BP lowering' },
    { slug: 'fosinopril', effect: 'inhibitor', target: 'ACE', note: 'dual hepatic + renal clearance — preferred in CKD over purely renally-cleared ACE-i' },
    { slug: 'quinapril', effect: 'inhibitor', target: 'ACE' },
    { slug: 'trandolapril', effect: 'inhibitor', target: 'ACE' },
    { slug: 'losartan', effect: 'inhibitor', target: 'AT-1 receptor', note: 'first ARB; uricosuric (lowers urate slightly) — useful in gout patients; CYP2C9 substrate' },
    { slug: 'valsartan', effect: 'inhibitor', target: 'AT-1 receptor', note: 'ARB; component of sacubitril/valsartan (Entresto)' },
    { slug: 'candesartan', effect: 'inhibitor', target: 'AT-1 receptor', note: 'tight AT-1 binding → strong + sustained BP effect; migraine prophylaxis off-label' },
    { slug: 'irbesartan', effect: 'inhibitor', target: 'AT-1 receptor' },
    { slug: 'olmesartan', effect: 'inhibitor', target: 'AT-1 receptor', note: 'sprue-like enteropathy boxed warning; rare but reversible on discontinuation' },
    { slug: 'telmisartan', effect: 'inhibitor', target: 'AT-1 receptor + partial PPAR-γ agonist', note: 'longest t½ of ARBs (24h); insulin-sensitizing claim via PPAR-γ activity' },
    { slug: 'methyldopa', effect: 'activator', target: 'central α2 (after AADC conversion to α-methyl-NE)', note: 'pre-ARB-era central antihypertensive; pregnancy HTN gold standard for decades; hemolytic anemia risk' },
  ],

  // CV-1: Diuretics into renal_tubular_transport
  renal_tubular_transport: [
    { slug: 'hydrochlorothiazide', effect: 'inhibitor', target: 'NCC (Na+/Cl- cotransporter, DCT)', note: 'thiazide first-line HTN; hypokalemia + hyponatremia + uricemia + glucose elevation tail' },
    { slug: 'chlorthalidone', effect: 'inhibitor', target: 'NCC (DCT)', note: 'thiazide-like; longer t½ (40-60h) vs HCTZ; SHEP/ALLHAT primary outcome trials used this' },
    { slug: 'metolazone', effect: 'inhibitor', target: 'NCC (DCT) + weak loop activity', note: 'used as a sequential nephron blocker added to a loop diuretic in resistant HF edema' },
    { slug: 'furosemide', effect: 'inhibitor', target: 'NKCC2 (TAL loop)', note: 'loop diuretic; HF + edema first-line; PO F highly variable (10-100%) — IV in acute decompensation; ototoxicity at high doses + with aminoglycosides' },
    { slug: 'spironolactone', effect: 'inhibitor', target: 'mineralocorticoid receptor', note: 'K-sparing diuretic; HFrEF mortality benefit (RALES); androgen-receptor activity → gynecomastia in men; PCOS off-label' },
    { slug: 'eplerenone', effect: 'inhibitor', target: 'mineralocorticoid receptor (selective)', note: 'cleaner MR-selective vs spironolactone — less gynecomastia; HF post-MI (EPHESUS)' },
    { slug: 'acetazolamide', effect: 'inhibitor', target: 'carbonic anhydrase (PCT + ciliary body)', note: 'PCT bicarbonate diuresis (mild) + IOP lowering (glaucoma) + altitude-sickness prophylaxis; respiratory alkalosis correction' },
  ],

  // CV-2: Antiarrhythmics into cardiac_action_potential
  cardiac_action_potential: [
    { slug: 'quinidine', effect: 'inhibitor', target: 'Na+ channel + IKr (class IA)', note: 'oldest antiarrhythmic; broad Na+/K+ block; cinchonism + QT prolongation + thrombocytopenia tail; CYP2D6 potent inhibitor (DDI authored Wave 2a v1.1: DXM 43×, propafenone, desipramine)' },
    { slug: 'mexiletine', effect: 'inhibitor', target: 'Na+ channel (class IB)', note: 'oral lidocaine analog; ventricular arrhythmia + myotonic dystrophy off-label' },
    { slug: 'flecainide', effect: 'inhibitor', target: 'Na+ channel (class IC)', note: 'strong Na+ blocker; CAST trial established mortality harm in post-MI structural heart disease — contraindicated; safe in lone AF + SVT' },
    { slug: 'propafenone', effect: 'inhibitor', target: 'Na+ channel (class IC) + weak β-block', note: 'CYP2D6 substrate (poor metabolizers 5-10× AUC of S-enantiomer); pill-in-pocket for AF cardioversion' },
    { slug: 'amiodarone', effect: 'inhibitor', target: 'multi-channel (K+ class III dominant; also Na+/Ca²⁺/β)', note: 'broadest-spectrum antiarrhythmic; AF + VT/VF; thyroid + pulmonary + ocular + hepatic toxicity tail; very long t½ (~50 days); strong CYP3A4 inhibitor' },
    { slug: 'sotalol', effect: 'inhibitor', target: 'β + IKr (class III)', note: 'racemic; D-sotalol pure IKr blocker (negative SWORD trial mortality); racemic AF/VT — initiate inpatient with QT monitoring' },
    { slug: 'dofetilide', effect: 'inhibitor', target: 'IKr-selective (class III pure)', note: 'AF rhythm control; mandatory 3-day inpatient initiation with QT/CrCl titration' },
    { slug: 'ivabradine', effect: 'inhibitor', target: 'If (HCN4) — sinus pacemaker funny current', note: 'reduces heart rate without inotropy or BP effect; HFrEF (SHIFT) + chronic stable angina; phosphenes (visual side effect) from retinal HCN expression' },
    { slug: 'lidocaine', effect: 'inhibitor', target: 'Na+ channel (class IB)', note: 'IV antiarrhythmic for monomorphic VT; also workhorse local anesthetic (covered in CNS-2 wave)' },
    { slug: 'digoxin', effect: 'inhibitor', target: 'Na+/K+-ATPase (myocardial)', note: 'cardiac glycoside; positive inotrope + negative dromotrope; narrow therapeutic index; renally cleared; classic K+/Mg²⁺/digoxin-toxicity triad' },
    { slug: 'ranolazine', effect: 'inhibitor', target: 'late Na+ current (INaL)', note: 'reduces Ca²⁺ overload via late-Na blockade; chronic stable angina; modest HbA1c effect; QT prolongation' },
    { slug: 'adenosine', effect: 'activator', target: 'A1 receptor → IKACh activation', note: 'IV bolus terminates AVNRT/AVRT via transient AV block; 10-second half-life; flushing/chest pressure + bronchoconstriction warning' },
  ],

  // CV-3: Hemostasis Rx
  coagulation_cascade: [
    { slug: 'heparin', effect: 'inhibitor', target: 'antithrombin enhancer (Xa + IIa)', note: 'unfractionated heparin; aPTT-monitored; reversible by protamine; HIT risk (heparin-induced thrombocytopenia)' },
    { slug: 'enoxaparin', effect: 'inhibitor', target: 'antithrombin enhancer (Xa > IIa)', note: 'LMWH; predictable PK → no routine monitoring; SC qd-bid; renal dose adjustment' },
    { slug: 'apixaban', effect: 'inhibitor', target: 'factor Xa (direct, oral)', note: 'DOAC; AF stroke prevention + VTE; lowest bleeding rate vs warfarin head-to-head (ARISTOTLE)' },
    { slug: 'rivaroxaban', effect: 'inhibitor', target: 'factor Xa (direct, oral)', note: 'DOAC; once-daily for AF; bid for acute VTE; food required for 15+ mg doses (F drops fasting)' },
    { slug: 'edoxaban', effect: 'inhibitor', target: 'factor Xa (direct, oral)', note: 'DOAC; renal-clearance restriction at high CrCl (paradoxical reduced efficacy)' },
    { slug: 'dabigatran', effect: 'inhibitor', target: 'thrombin / factor IIa (direct, oral)', note: 'DOAC; reversible by idarucizumab; dyspepsia + GI bleeding tail' },
  ],
  platelet_aggregation: [
    { slug: 'aspirin', effect: 'inhibitor', target: 'COX-1 (platelet, irreversible)', note: 'antiplatelet at 81-325 mg daily; lasts platelet lifespan (~10 days); cross-link: arachidonic_acid_cascade for prostaglandin/TXA2 axis' },
    { slug: 'clopidogrel', effect: 'inhibitor', target: 'P2Y12 (prodrug → active metabolite)', note: 'thienopyridine prodrug; CYP2C19 activation — PMs have ~30% lower exposure to active metabolite + worse clinical outcomes; PPI DDI debated' },
    { slug: 'prasugrel', effect: 'inhibitor', target: 'P2Y12 (more reliable activation than clopidogrel)', note: 'thienopyridine; faster onset + more consistent inhibition; contraindicated post-stroke (bleeding signal); ACS indication' },
    { slug: 'ticagrelor', effect: 'inhibitor', target: 'P2Y12 (reversible, non-prodrug)', note: 'cyclopentyl-triazolo-pyrimidine; direct-acting (no metabolic activation needed); dyspnea + uricemia side effects' },
    { slug: 'dipyridamole', effect: 'inhibitor', target: 'PDE3 + adenosine reuptake', note: 'antiplatelet + coronary vasodilator; used in pharmacologic stress testing (induces coronary steal)' },
    { slug: 'cilostazol', effect: 'inhibitor', target: 'PDE3', note: 'intermittent claudication; PDE3 inhibition raises cAMP in platelets + vascular smooth muscle' },
    { slug: 'pentoxifylline', effect: 'inhibitor', target: 'PDE (non-selective) + RBC deformability', note: 'intermittent claudication; modest efficacy; xanthine-class' },
  ],

  // CV-4: Lipid handling
  cholesterol_synthesis: [
    { slug: 'simvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase (prodrug → β-hydroxy acid)', note: 'lipophilic statin; CYP3A4 substrate (major itraconazole DDI authored Wave 2a v1.1); 80-mg dose restricted post-2011 (myopathy)' },
    { slug: 'atorvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'lipophilic; CYP3A4 substrate; t½ 14h + active metabolites → 24h+ effective duration; high-intensity statin' },
    { slug: 'rosuvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'hydrophilic; minimal CYP metabolism (OATP1B1 transport) — fewer DDIs than the CYP3A4 statins; high-intensity at 20-40 mg' },
    { slug: 'pitavastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'hydrophilic; minimal CYP metabolism; preferred in HIV patients on PIs' },
    { slug: 'pravastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'hydrophilic; minimal CYP metabolism; moderate-intensity' },
    { slug: 'lovastatin', effect: 'inhibitor', target: 'HMG-CoA reductase (prodrug)', note: 'first statin (1987); CYP3A4 substrate; itraconazole AUC ~20× DDI contraindicated' },
    { slug: 'cerivastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'withdrawn 2001 for rhabdo cluster; CYP2C8/3A4 dual metabolism; gemfibrozil DDI 5.6× AUC (authored Wave 2a v1.1)' },
  ],
  ldl_receptor_pcsk9_axis: [
    { slug: 'ezetimibe', effect: 'inhibitor', target: 'NPC1L1 (intestinal cholesterol absorption)', note: 'reduces dietary + biliary cholesterol uptake; LDL ~20% lowering as monotherapy; IMPROVE-IT showed CV-outcome benefit added to simvastatin' },
    { slug: 'cholestyramine', effect: 'inhibitor', target: 'bile acid sequestrant (resin)', note: 'binds bile acids in gut → enterohepatic interruption → hepatic LDL-R upregulation; constipation + drug-binding DDIs (separate dosing)' },
    { slug: 'colesevelam', effect: 'inhibitor', target: 'bile acid sequestrant (resin)', note: 'newer resin; better-tolerated than cholestyramine; modest glycemic benefit in T2DM' },
    { slug: 'fenofibrate', effect: 'activator', target: 'PPAR-α', note: 'fibrate; ↑LPL → triglyceride lowering; ↑HDL; mild LDL effect; less myopathy with statins vs gemfibrozil (no CYP2C8 inhibition)' },
    { slug: 'gemfibrozil', effect: 'activator', target: 'PPAR-α', note: 'fibrate; CYP2C8 strong inhibitor — catastrophic cerivastatin rhabdo combo (Wave 2a v1.1) + repaglinide DDI 8×' },
    { slug: 'icosapent-ethyl', effect: 'activator', target: 'EPA elevation → TG ↓ + anti-inflammatory', note: 'purified EPA ethyl ester; REDUCE-IT showed 25% CV-event reduction added to statin in high-TG patients' },
    { slug: 'bempedoic-acid', effect: 'inhibitor', target: 'ATP-citrate lyase (ACLY)', note: 'prodrug activated only in liver (not muscle) → no statin-myopathy mechanism; CLEAR Outcomes 2023 showed CV-outcome benefit' },
    { slug: 'evolocumab', effect: 'inhibitor', target: 'PCSK9 (extracellular)', note: 'PCSK9 mAb; blocks PCSK9-mediated LDL-R degradation → ↑LDL-R recycling; FOURIER showed CV-outcome benefit; q2week SC' },
    { slug: 'alirocumab', effect: 'inhibitor', target: 'PCSK9 (extracellular)', note: 'PCSK9 mAb; ODYSSEY CV outcomes; q2week SC; comparable to evolocumab' },
    { slug: 'inclisiran', effect: 'inhibitor', target: 'PCSK9 mRNA (siRNA)', note: 'siRNA targeting PCSK9 transcript in hepatocytes; q6month SC dosing schedule — durable LDL lowering with minimal injections' },
    { slug: 'clofibrate', effect: 'activator', target: 'PPAR-α', note: 'first-generation fibrate; CHD signal led to phase-out; plasma-binding-displacement DDI with warfarin authored Wave 2b v1.0' },
  ],
};

function addModulators(p: Pathway, items: PathwayModulator[]): number {
  p.modulators = p.modulators ?? [];
  const have = new Set(p.modulators.map(m => m.slug));
  let added = 0;
  for (const m of items) {
    if (have.has(m.slug)) continue;
    p.modulators.push(m);
    have.add(m.slug);
    added++;
  }
  return added;
}

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));

  let pathwaysAdded = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p);
    pathwaysAdded++;
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }

  let modsAdded = 0;
  for (const [slug, items] of Object.entries(MODULATOR_ADDITIONS)) {
    const p = bySlug.get(slug);
    if (!p) { console.log(`  [warn] target pathway missing: ${slug}`); continue; }
    const n = addModulators(p, items);
    modsAdded += n;
    console.log(`  [ext ] ${slug.padEnd(40)} +${n} modulators (now ${p.modulators!.length})`);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nCV cluster: +${pathwaysAdded} pathways, +${modsAdded} modulator entries. Total pathways: ${data.length}.`);
}

main();
