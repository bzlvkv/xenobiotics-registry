/**
 * 2026-05-03-wave-0b-final-push.ts — Wave 0b sub-batch 10.
 *
 * Final push toward 1000+:
 *   - More β-blockers (nadolol, betaxolol, pindolol, esmolol)
 *   - More ACEi (captopril, fosinopril, quinapril, trandolapril)
 *   - More ARBs (candesartan, irbesartan, olmesartan)
 *   - More CCBs (nicardipine, isradipine)
 *   - Anti-seizure: zonisamide, ethosuximide, lacosamide, brivaracetam,
 *     perampanel, vigabatrin
 *   - TCAs/MAOIs: clomipramine, imipramine, desipramine, phenelzine,
 *     tranylcypromine, isocarboxazid
 *   - Topical steroids: fluocinonide, fluocinolone, desoximetasone,
 *     halobetasol, hydrocortisone-butyrate
 *   - Topical antifungals: butenafine, undecylenic-acid, tolnaftate
 *   - Lipid / circulation: cilostazol, pentoxifylline, ezetimibe,
 *     bempedoic-acid
 *   - First-gen antihistamines: chlorpheniramine, brompheniramine
 *   - Vitamin E variants (alpha-tocopherol, mixed-tocopherols)
 *   - Antiemetic specifics: aprepitant, palonosetron
 *   - Local-anesthetic OTC: benzocaine
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
  // ── β-BLOCKERS ────────────────────────────────────────────────────
  {
    slug: 'nadolol',
    name: 'Nadolol',
    aliases: ['Corgard'],
    category: 'pharmacological',
    mechanism: 'Long-acting non-selective β-adrenergic blocker. Renally cleared (no CYP), preferred in liver disease. Used for hypertension, angina, esophageal varices prophylaxis. Once-daily dosing.',
    routes: ['PO'],
    doses: { 'PO': { min: 20, max: 320, typical: 40, unit: 'mg' } },
    half_life_hr: { 'PO': 22 },
    mw_g_mol: 309.40,
    refs: [],
  },
  {
    slug: 'betaxolol',
    name: 'Betaxolol',
    aliases: ['Betoptic', 'Kerlone'],
    category: 'pharmacological',
    mechanism: 'Cardioselective β1-adrenergic blocker. Oral form for hypertension; ophthalmic form (Betoptic) for glaucoma — preferred over timolol in patients with respiratory disease due to β1 selectivity reducing bronchospasm risk.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 5, max: 40, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 307.43,
    refs: [],
  },
  {
    slug: 'pindolol',
    name: 'Pindolol',
    aliases: ['Visken'],
    category: 'pharmacological',
    mechanism: 'Non-selective β-adrenergic blocker with intrinsic sympathomimetic activity (partial agonism) — less bradycardia + less peripheral vasoconstriction than pure antagonists. Off-label augmentation strategy in SSRI-resistant depression.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 60, typical: 15, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 248.32,
    refs: [],
  },
  {
    slug: 'esmolol',
    name: 'Esmolol',
    aliases: ['Brevibloc'],
    category: 'pharmacological',
    mechanism: 'Ultra-short-acting cardioselective β1 blocker — esterase-mediated hydrolysis gives ~9 min half-life. IV-only; titratable for acute hypertensive emergencies, intraoperative tachycardia, AF rate control where rapid offset is needed.',
    routes: ['IV'],
    doses: { 'IV': { min: 50, max: 300, typical: 100, unit: 'mcg' } },
    half_life_hr: { 'IV': 0.15 },
    mw_g_mol: 295.38,
    refs: [],
  },

  // ── MORE ACEi / ARBs / CCBs ───────────────────────────────────────
  {
    slug: 'captopril',
    name: 'Captopril',
    aliases: ['Capoten'],
    category: 'pharmacological',
    mechanism: 'First-developed ACE inhibitor — short-acting, sulfhydryl-containing. Faster onset than enalapril (active drug, no prodrug) supports use in hypertensive urgency. Sulfhydryl group may contribute to higher rash + dysgeusia (metallic taste) than newer ACEi.',
    routes: ['PO'],
    doses: { 'PO': { min: 12.5, max: 150, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 217.29,
    refs: [],
  },
  {
    slug: 'fosinopril',
    name: 'Fosinopril',
    aliases: ['Monopril'],
    category: 'pharmacological',
    mechanism: 'ACE inhibitor prodrug — phosphinic acid moiety distinguishes it. Dual hepatic + renal clearance (only ACEi with this — others are predominantly renal) → no dose adjustment in mild renal impairment.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 80, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 563.66,
    refs: [],
  },
  {
    slug: 'quinapril',
    name: 'Quinapril',
    aliases: ['Accupril'],
    category: 'pharmacological',
    mechanism: 'ACE inhibitor prodrug — same conversion-to-active-form mechanism as enalapril / ramipril. Once-daily dosing for hypertension + heart failure.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 80, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 25 },
    mw_g_mol: 438.52,
    refs: [],
  },
  {
    slug: 'trandolapril',
    name: 'Trandolapril',
    aliases: ['Mavik'],
    category: 'pharmacological',
    mechanism: 'ACE inhibitor prodrug — converted to trandolaprilat. Long half-life supports once-daily dosing. Used in hypertension + post-MI heart failure.',
    routes: ['PO'],
    doses: { 'PO': { min: 1, max: 8, typical: 4, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 430.54,
    refs: [],
  },
  {
    slug: 'candesartan',
    name: 'Candesartan',
    aliases: ['Atacand'],
    category: 'pharmacological',
    mechanism: 'AT1 receptor blocker — cilexetil ester prodrug rapidly hydrolyzed during absorption. Long half-life supports once-daily dosing. Used for hypertension, HFrEF, and migraine prophylaxis (off-label).',
    routes: ['PO'],
    doses: { 'PO': { min: 4, max: 32, typical: 16, unit: 'mg' } },
    half_life_hr: { 'PO': 9 },
    mw_g_mol: 440.45,
    refs: [],
  },
  {
    slug: 'irbesartan',
    name: 'Irbesartan',
    aliases: ['Avapro'],
    category: 'pharmacological',
    mechanism: 'AT1 receptor blocker — strong renoprotection signal in IDNT trial for diabetic nephropathy. Once-daily dosing.',
    routes: ['PO'],
    doses: { 'PO': { min: 75, max: 300, typical: 150, unit: 'mg' } },
    half_life_hr: { 'PO': 14 },
    mw_g_mol: 428.53,
    refs: [],
  },
  {
    slug: 'olmesartan',
    name: 'Olmesartan',
    aliases: ['Benicar'],
    category: 'pharmacological',
    mechanism: 'AT1 receptor blocker — medoxomil prodrug ester. Distinctive sprue-like enteropathy in some chronic users (rare but FDA boxed warning). Hypertension; less data in HFrEF than other ARBs.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 40, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 13 },
    mw_g_mol: 446.50,
    refs: [],
  },
  {
    slug: 'nicardipine',
    name: 'Nicardipine',
    aliases: ['Cardene'],
    category: 'pharmacological',
    mechanism: 'Dihydropyridine CCB — vascular Cav1.2 selectivity. IV continuous infusion form for hypertensive emergencies + intraoperative HTN. Less reflex tachycardia than IR nifedipine.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 20, max: 120, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 479.53,
    refs: [],
  },
  {
    slug: 'isradipine',
    name: 'Isradipine',
    aliases: ['DynaCirc'],
    category: 'pharmacological',
    mechanism: 'Dihydropyridine CCB — vascular smooth muscle preference. Studied for Parkinson disease neuroprotection (STEADY-PD III, neutral). Less commonly used than amlodipine for routine hypertension.',
    routes: ['PO'],
    doses: { 'PO': { min: 2.5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 371.39,
    refs: [],
  },

  // ── ANTI-SEIZURE EXPANSION ────────────────────────────────────────
  {
    slug: 'zonisamide',
    name: 'Zonisamide',
    aliases: ['Zonegran'],
    category: 'pharmacological',
    mechanism: 'Sulfonamide antiseizure — Na+ + T-type Ca²⁺ channel blocker, weak carbonic anhydrase inhibition. Adjunct for partial seizures + off-label migraine prophylaxis + weight-loss adjunct (Qsymia precursor mechanistic relative).',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 600, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 63 },
    mw_g_mol: 212.23,
    refs: [],
  },
  {
    slug: 'ethosuximide',
    name: 'Ethosuximide',
    aliases: ['Zarontin'],
    category: 'pharmacological',
    mechanism: 'T-type Ca²⁺ channel blocker in thalamocortical circuits — first-line for absence seizures (childhood). Doesn\'t treat tonic-clonic; specifically fits the spike-and-wave thalamic mechanism of absence epilepsy.',
    routes: ['PO'],
    doses: { 'PO': { min: 250, max: 1500, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 50 },
    mw_g_mol: 141.17,
    refs: [],
  },
  {
    slug: 'lacosamide',
    name: 'Lacosamide',
    aliases: ['Vimpat'],
    category: 'pharmacological',
    mechanism: 'Selective slow-inactivation enhancer of voltage-gated Na+ channels — distinct from the fast-inactivation drugs (carbamazepine, lamotrigine, phenytoin). Used for partial-onset seizures. Cardiac PR prolongation at high doses.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 100, max: 400, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 13 },
    mw_g_mol: 250.30,
    refs: [],
  },
  {
    slug: 'brivaracetam',
    name: 'Brivaracetam',
    aliases: ['Briviact'],
    category: 'pharmacological',
    mechanism: 'Newer SV2A ligand — same target as levetiracetam but ~20× higher affinity + better lipid solubility for faster CNS penetration. Used for partial-onset seizures with potentially better psychiatric tolerability than levetiracetam.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 9 },
    mw_g_mol: 212.29,
    refs: [],
  },
  {
    slug: 'perampanel',
    name: 'Perampanel',
    aliases: ['Fycompa'],
    category: 'pharmacological',
    mechanism: 'Selective non-competitive AMPA glutamate receptor antagonist — first-in-class. Adjunct for partial-onset + primary generalized tonic-clonic seizures. Black-box for psychiatric / behavioral adverse effects (aggression, suicidality).',
    routes: ['PO'],
    doses: { 'PO': { min: 2, max: 12, typical: 8, unit: 'mg' } },
    half_life_hr: { 'PO': 105 },
    mw_g_mol: 349.39,
    refs: [],
  },
  {
    slug: 'vigabatrin',
    name: 'Vigabatrin',
    aliases: ['Sabril'],
    category: 'pharmacological',
    mechanism: 'Irreversible GABA-aminotransferase (GABA-T) inhibitor — raises CNS GABA. Approved for refractory complex partial seizures + infantile spasms. Permanent visual field constriction in ~30% mandates ophthalmologic monitoring → REMS program.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 3000, typical: 1500, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 129.16,
    refs: [],
  },

  // ── TCAs / MAOIs ──────────────────────────────────────────────────
  {
    slug: 'clomipramine',
    name: 'Clomipramine',
    aliases: ['Anafranil'],
    category: 'pharmacological',
    mechanism: 'TCA with strongest serotonergic activity in the class — first-line TCA for OCD. Active demethyl-clomipramine metabolite contributes NE reuptake inhibition. Same anticholinergic burden as other TCAs.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 250, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 32 },
    mw_g_mol: 314.85,
    refs: [],
  },
  {
    slug: 'imipramine',
    name: 'Imipramine',
    aliases: ['Tofranil'],
    category: 'pharmacological',
    mechanism: 'Tertiary-amine TCA — first TCA approved (1959). Approved for depression + childhood enuresis. Active desipramine metabolite. Anticholinergic burden + cardiotoxicity at overdose are class issues.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 300, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 14 },
    mw_g_mol: 280.41,
    refs: [],
  },
  {
    slug: 'desipramine',
    name: 'Desipramine',
    aliases: ['Norpramin'],
    category: 'pharmacological',
    mechanism: 'Secondary-amine TCA — active metabolite of imipramine. Strongest NE reuptake inhibition + lowest anticholinergic burden among TCAs. Used for depression + neuropathic pain when SSRIs fail.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 300, typical: 150, unit: 'mg' } },
    half_life_hr: { 'PO': 22 },
    mw_g_mol: 266.39,
    refs: [],
  },
  {
    slug: 'phenelzine',
    name: 'Phenelzine',
    aliases: ['Nardil'],
    category: 'pharmacological',
    mechanism: 'Irreversible non-selective MAO inhibitor — increases monoamines (5-HT, NE, DA) by blocking degradation. Tyramine-restricted diet mandatory (hypertensive crisis from cheese, aged meats, fermented). Reserved for refractory atypical depression + social anxiety.',
    routes: ['PO'],
    doses: { 'PO': { min: 15, max: 90, typical: 45, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 136.20,
    refs: [],
  },
  {
    slug: 'tranylcypromine',
    name: 'Tranylcypromine',
    aliases: ['Parnate'],
    category: 'pharmacological',
    mechanism: 'Irreversible non-selective MAOI with weaker dietary-tyramine restrictions than phenelzine but still mandatory. Faster onset (~10 days vs 4 weeks) than phenelzine. Refractory depression.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 60, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 2.5 },
    mw_g_mol: 133.19,
    refs: [],
  },

  // ── TOPICAL STEROIDS ──────────────────────────────────────────────
  {
    slug: 'fluocinonide',
    name: 'Fluocinonide',
    aliases: ['Lidex'],
    category: 'topical',
    mechanism: 'High-potency topical glucocorticoid (Class II). Used for moderate-severe inflammatory dermatoses where Class III–IV agents have failed. Skin atrophy + striae + perioral dermatitis at chronic facial use.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.05, max: 0.5, typical: 0.05, unit: 'mg' } },
    half_life_hr: { 'TD': 8 },
    mw_g_mol: 494.53,
    refs: [],
  },
  {
    slug: 'fluocinolone',
    name: 'Fluocinolone',
    aliases: ['Synalar'],
    category: 'topical',
    mechanism: 'Mid-to-high potency topical glucocorticoid (Class V depending on vehicle). Available in cream, ointment, scalp oil for psoriasis, atopic dermatitis, and seborrheic dermatitis.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.01, max: 0.25, typical: 0.025, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    mw_g_mol: 452.49,
    refs: [],
  },
  {
    slug: 'desoximetasone',
    name: 'Desoximetasone',
    aliases: ['Topicort'],
    category: 'topical',
    mechanism: 'High-potency topical glucocorticoid (Class II). Used in psoriasis + lichen planus + lichen simplex chronicus. Skin atrophy at chronic high-potency use over large areas.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.05, max: 0.25, typical: 0.25, unit: 'mg' } },
    half_life_hr: { 'TD': 8 },
    mw_g_mol: 376.46,
    refs: [],
  },
  {
    slug: 'halobetasol',
    name: 'Halobetasol',
    aliases: ['Ultravate'],
    category: 'topical',
    mechanism: 'Super-high-potency topical glucocorticoid (Class I — tied with clobetasol). Two-week max courses; HPA axis suppression at large body areas. Severe psoriasis, lichen planus.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.05, max: 0.05, typical: 0.05, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    mw_g_mol: 484.96,
    refs: [],
  },

  // ── TOPICAL ANTIFUNGALS ───────────────────────────────────────────
  {
    slug: 'butenafine',
    name: 'Butenafine',
    aliases: ['Lotrimin Ultra', 'Mentax'],
    category: 'topical',
    mechanism: 'Benzylamine antifungal — squalene epoxidase inhibitor (same enzyme as terbinafine). Topical for tinea pedis, cruris, corporis. OTC strength of 1% cream.',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 30, typical: 10, unit: 'mg' } },
    half_life_hr: { 'TD': 24 },
    mw_g_mol: 317.47,
    refs: [],
  },
  {
    slug: 'undecylenic-acid',
    name: 'Undecylenic Acid',
    aliases: ['Undecenoic acid'],
    category: 'topical',
    mechanism: 'Naturally-occurring 11-carbon unsaturated fatty acid — fungistatic via membrane disruption. OTC for tinea pedis, jock itch; weaker than azoles or allylamines.',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 250, typical: 100, unit: 'mg' } },
    half_life_hr: { 'TD': 12 },
    mw_g_mol: 184.28,
    refs: [],
  },
  {
    slug: 'tolnaftate',
    name: 'Tolnaftate',
    aliases: ['Tinactin'],
    category: 'topical',
    mechanism: 'Thiocarbamate antifungal — squalene epoxidase inhibitor. OTC topical for tinea pedis, cruris. Effective only against dermatophytes (not Candida). One of the oldest OTC antifungals (1965).',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 30, typical: 10, unit: 'mg' } },
    half_life_hr: { 'TD': 12 },
    mw_g_mol: 307.41,
    refs: [],
  },

  // ── LIPID / CIRCULATION ───────────────────────────────────────────
  {
    slug: 'cilostazol',
    name: 'Cilostazol',
    aliases: ['Pletal'],
    category: 'pharmacological',
    mechanism: 'Selective phosphodiesterase 3 inhibitor — raises platelet + smooth muscle cAMP. Vasodilator + antiplatelet. Used for symptomatic relief of intermittent claudication. Contraindicated in heart failure (PDE3 inhibitors increase mortality in HFrEF).',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 11 },
    mw_g_mol: 369.46,
    refs: [],
  },
  {
    slug: 'pentoxifylline',
    name: 'Pentoxifylline',
    aliases: ['Trental'],
    category: 'pharmacological',
    mechanism: 'Methylxanthine — increases red blood cell flexibility, decreases blood viscosity, mild antiplatelet effect. Used for intermittent claudication symptoms (modest effect) and cutaneous ulcers (off-label for vasculitis).',
    routes: ['PO'],
    doses: { 'PO': { min: 400, max: 1200, typical: 1200, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 278.31,
    refs: [],
  },
  {
    slug: 'ezetimibe',
    name: 'Ezetimibe',
    aliases: ['Zetia'],
    category: 'pharmacological',
    mechanism: 'Selective NPC1L1 inhibitor — blocks cholesterol absorption at the intestinal brush border. Combined with statins for additional ~20% LDL reduction. Often co-formulated with simvastatin (Vytorin) or atorvastatin.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 10, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 22 },
    mw_g_mol: 409.43,
    refs: [],
  },
  {
    slug: 'bempedoic-acid',
    name: 'Bempedoic Acid',
    aliases: ['Nexletol'],
    category: 'pharmacological',
    mechanism: 'ATP citrate lyase inhibitor — blocks cholesterol biosynthesis upstream of HMG-CoA reductase. Activated only in liver (not muscle) → no myalgia + statin-intolerance utility. Modest ~17% LDL reduction; CLEAR Outcomes trial showed CV event reduction.',
    routes: ['PO'],
    doses: { 'PO': { min: 180, max: 180, typical: 180, unit: 'mg' } },
    half_life_hr: { 'PO': 21 },
    mw_g_mol: 344.49,
    refs: [],
  },

  // ── FIRST-GEN ANTIHISTAMINES ──────────────────────────────────────
  {
    slug: 'chlorpheniramine',
    name: 'Chlorpheniramine',
    aliases: ['Chlor-Trimeton'],
    category: 'pharmacological',
    mechanism: 'First-generation H1 antagonist — common OTC component of multi-ingredient cold/allergy products. Sedating + anticholinergic burden. Less drowsy at low dose than diphenhydramine.',
    routes: ['PO'],
    doses: { 'PO': { min: 4, max: 24, typical: 4, unit: 'mg' } },
    half_life_hr: { 'PO': 27 },
    mw_g_mol: 274.79,
    refs: [],
  },
  {
    slug: 'brompheniramine',
    name: 'Brompheniramine',
    aliases: ['Dimetapp'],
    category: 'pharmacological',
    mechanism: 'First-generation H1 antagonist — bromine analog of chlorpheniramine. OTC component of multi-ingredient cold formulations. Same sedation + anticholinergic profile.',
    routes: ['PO'],
    doses: { 'PO': { min: 4, max: 24, typical: 4, unit: 'mg' } },
    half_life_hr: { 'PO': 25 },
    mw_g_mol: 319.24,
    refs: [],
  },
  {
    slug: 'meclizine',
    name: 'Meclizine',
    aliases: ['Antivert', 'Bonine'],
    category: 'pharmacological',
    mechanism: 'First-generation H1 antagonist + mild anticholinergic — selectively reduces vestibular nausea / motion sickness. OTC for motion sickness; off-label for vertigo + Meniere disease.',
    routes: ['PO'],
    doses: { 'PO': { min: 12.5, max: 100, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 391.94,
    refs: [],
  },
  {
    slug: 'dimenhydrinate',
    name: 'Dimenhydrinate',
    aliases: ['Dramamine'],
    category: 'pharmacological',
    mechanism: 'Salt of diphenhydramine + 8-chlorotheophylline — anti-motion-sickness via H1 + muscarinic blockade. OTC. Same anticholinergic burden as diphenhydramine; the theophylline component is incidental.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 25, max: 100, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 469.97,
    refs: [],
  },

  // ── VITAMIN E VARIANTS ────────────────────────────────────────────
  {
    slug: 'alpha-tocopherol',
    name: 'α-Tocopherol',
    aliases: ['Vitamin E', 'D-α-tocopherol'],
    category: 'vitamin',
    mechanism: 'Lipid-soluble antioxidant — primary form of vitamin E in human tissue. Membrane-protective against ROS-driven peroxidation; cofactor for cellular signaling. ATBC + CARET trials caution against high-dose supplementation in smokers.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 22, max: 1000, typical: 400, unit: 'IU' } },
    half_life_hr: { 'PO': 48 },
    mw_g_mol: 430.71,
    refs: [],
  },
  {
    slug: 'mixed-tocopherols',
    name: 'Mixed Tocopherols',
    aliases: ['Natural vitamin E mix'],
    category: 'vitamin',
    mechanism: 'Class entry — α + β + γ + δ tocopherols in roughly natural-source ratios. γ-tocopherol may have unique anti-inflammatory effects independent of α-tocopherol. Some clinical signal for prostate health from γ-rich preparations.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 48 },
    refs: [],
  },
  {
    slug: 'gamma-tocopherol',
    name: 'γ-Tocopherol',
    aliases: [],
    category: 'vitamin',
    mechanism: 'Most abundant dietary tocopherol; quenches reactive nitrogen species better than α-tocopherol. Anti-inflammatory via COX inhibition. Concentrated in walnuts, sesame, soybeans.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 800, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 13 },
    mw_g_mol: 416.68,
    refs: [],
  },
  {
    slug: 'tocopheryl-acetate',
    name: 'Tocopheryl Acetate',
    aliases: ['Vitamin E acetate'],
    category: 'vitamin',
    mechanism: 'Esterified vitamin E — more stable than free tocopherol; hydrolyzed to active form during absorption. Standard supplement form. Topical formulations questionable for skin benefit; vaping-related EVALI lung injury association.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 22, max: 1000, typical: 400, unit: 'IU' } },
    half_life_hr: { 'PO': 48 },
    mw_g_mol: 472.74,
    refs: [],
  },

  // ── ANTIEMETIC SPECIFICS ──────────────────────────────────────────
  {
    slug: 'aprepitant',
    name: 'Aprepitant',
    aliases: ['Emend'],
    category: 'pharmacological',
    mechanism: 'Selective NK1 (substance P) receptor antagonist — antiemetic for delayed chemotherapy-induced nausea. CYP3A4 substrate + moderate inhibitor + CYP2C9 inducer — DDI source during oncology regimens.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 80, max: 165, typical: 125, unit: 'mg' } },
    half_life_hr: { 'PO': 11 },
    mw_g_mol: 534.43,
    refs: [],
  },
  {
    slug: 'palonosetron',
    name: 'Palonosetron',
    aliases: ['Aloxi'],
    category: 'pharmacological',
    mechanism: 'Long-acting 5-HT3 antagonist — same target as ondansetron with 30× higher receptor affinity + 40h half-life. Single-dose efficacy through 5-day chemo-induced nausea window.',
    routes: ['IV', 'PO'],
    doses: { 'IV': { min: 0.25, max: 0.5, typical: 0.25, unit: 'mg' } },
    half_life_hr: { 'IV': 40 },
    mw_g_mol: 296.41,
    refs: [],
  },

  // ── LOCAL ANESTHETICS / OTC ───────────────────────────────────────
  {
    slug: 'benzocaine',
    name: 'Benzocaine',
    aliases: ['Anbesol', 'Orajel'],
    category: 'topical',
    mechanism: 'Ester-class topical local anesthetic — Na+ channel blocker. OTC oral gels for dental pain, throat lozenges, condoms. Methemoglobinemia risk (especially in infants/children) is the FDA-warned concern.',
    routes: ['TD'],
    doses: { 'TD': { min: 5, max: 200, typical: 50, unit: 'mg' } },
    half_life_hr: { 'TD': 1 },
    mw_g_mol: 165.19,
    refs: [],
  },
  {
    slug: 'pramoxine',
    name: 'Pramoxine',
    aliases: ['Caladryl', 'Tronolane'],
    category: 'topical',
    mechanism: 'Topical local anesthetic with distinct chemical class (morpholine ether) → no cross-allergy with ester-class anesthetics. OTC for hemorrhoids, anal itch, minor skin irritation.',
    routes: ['TD'],
    doses: { 'TD': { min: 1, max: 30, typical: 10, unit: 'mg' } },
    half_life_hr: { 'TD': 4 },
    mw_g_mol: 293.40,
    refs: [],
  },

  // ── SUPPLEMENTS / NICHE ATTAINABLE ────────────────────────────────
  {
    slug: 'taurine-bcaa',
    name: 'BCAA Mix',
    aliases: ['Branched-chain amino acids'],
    category: 'amino-acid',
    mechanism: 'Class entry — leucine + isoleucine + valine in 2:1:1 or 4:1:1 ratios. Workout / endurance use; modest evidence for reduced muscle soreness + fatigue. Leucine alone covers most of the anabolic signaling effect (mTOR via Sestrin2).',
    routes: ['PO'],
    doses: { 'PO': { min: 5000, max: 20000, typical: 10000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    refs: [],
  },
  {
    slug: 'leucine',
    name: 'L-Leucine',
    aliases: ['Leucine'],
    category: 'amino-acid',
    mechanism: 'Branched-chain essential amino acid + most potent activator of muscle mTOR signaling. ~3 g per dose (the "leucine threshold") triggers muscle protein synthesis via Sestrin2 → mTORC1 pathway. Catabolizes to HMB (~5%).',
    routes: ['PO'],
    doses: { 'PO': { min: 3000, max: 5000, typical: 3000, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 131.17,
    refs: [],
  },
  {
    slug: 'isoleucine',
    name: 'L-Isoleucine',
    aliases: [],
    category: 'amino-acid',
    mechanism: 'BCAA — glucogenic + ketogenic; weaker mTOR activator than leucine. Component of BCAA blends; isolated supplementation rare.',
    routes: ['PO'],
    doses: { 'PO': { min: 1500, max: 4000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 131.17,
    refs: [],
  },

  // ── MORE NOOTROPIC / RESEARCH ─────────────────────────────────────
  {
    slug: 'nsi-189',
    name: 'NSI-189',
    aliases: [],
    category: 'nootropic',
    mechanism: 'Hippocampal neurogenesis stimulator — exact mechanism partially defined; raises BDNF + ERK1/2 + dentate gyrus neurogenesis in animal studies. Failed Phase 2 for major depressive disorder in 2017; biohacker interest persists.',
    routes: ['PO'],
    doses: { 'PO': { min: 40, max: 80, typical: 40, unit: 'mg' } },
    half_life_hr: { 'PO': 17 },
    mw_g_mol: 366.50,
    refs: [],
  },
  {
    slug: 'prl-8-53',
    name: 'PRL-8-53',
    aliases: [],
    category: 'nootropic',
    mechanism: 'Old (1972) cognitive-enhancement research compound — partial AChE inhibition + dopamine modulation. One small human trial showed 200% memory recall improvement (Hansl 1978). No follow-up trials in 50 years; sold via research-chem channels.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 269.34,
    refs: [],
  },

  // ── COMMON DENTAL / OTC ───────────────────────────────────────────
  {
    slug: 'lidocaine-topical',
    name: 'Lidocaine (topical)',
    aliases: ['Aspercreme', 'LMX-4'],
    category: 'topical',
    mechanism: 'Topical local anesthetic — Na+ channel blocker. OTC at 4% strength, Rx at 5% (post-herpetic neuralgia patches). Different formulation from oral / IV lidocaine.',
    routes: ['TD'],
    doses: { 'TD': { min: 40, max: 700, typical: 200, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    mw_g_mol: 234.34,
    refs: [],
  },
  {
    slug: 'capsaicin-topical',
    name: 'Capsaicin (topical, high-strength)',
    aliases: ['Qutenza patch', 'Zostrix'],
    category: 'topical',
    mechanism: 'Topical TRPV1 agonist — chronic exposure desensitizes nociceptors → analgesia. OTC at low strength for muscle/joint aches; Rx 8% patch (Qutenza) for post-herpetic neuralgia delivers extended relief from a single 60-min office application.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.025, max: 8, typical: 0.075, unit: 'mg' } },
    half_life_hr: { 'TD': 24 },
    mw_g_mol: 305.41,
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

  console.log('\nWave 0b sub-batch 10 — final push:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
