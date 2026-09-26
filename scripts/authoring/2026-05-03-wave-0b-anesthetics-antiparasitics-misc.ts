/**
 * 2026-05-03-wave-0b-anesthetics-antiparasitics-misc.ts — Wave 0b sub-6.
 *
 * Therapeutic clusters covered:
 *   - Anesthetics (induction, sedation, local, neuromuscular blockers)
 *   - Antiparasitics (anthelmintics + antiprotozoals)
 *   - Cannabinoids (CBD, THC, dronabinol, nabilone)
 *   - Pulmonary hypertension (endothelin antagonists, sGC stimulators)
 *   - Anti-anginal (ranolazine, ivabradine, hydralazine)
 *   - Anti-TB (isoniazid, ethambutol, pyrazinamide)
 *   - OB/GYN specialty (clomiphene, mifepristone, misoprostol)
 *   - Urologic anticholinergics (oxybutynin, tolterodine, mirabegron)
 *   - Specialty botanical supplements (echinacea, elderberry, oregano,
 *     ginger, garlic, milk thistle silymarin already exists)
 *   - Smoking cessation (varenicline)
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
  // ── ANESTHETICS: INDUCTION + SEDATION ─────────────────────────────
  {
    slug: 'propofol',
    name: 'Propofol',
    aliases: ['Diprivan'],
    category: 'pharmacological',
    mechanism: 'Lipid-soluble GABA-A positive allosteric modulator + glycine receptor potentiation. Workhorse IV induction + maintenance anesthetic; rapid onset (~30 sec) and short duration. Hypotension via vasodilation; "propofol infusion syndrome" (lactic acidosis, rhabdomyolysis) at prolonged high-dose ICU sedation.',
    routes: ['IV'],
    doses: { 'IV': { min: 1, max: 2.5, typical: 2, unit: 'mg' } },
    half_life_hr: { 'IV': 4 },
    mw_g_mol: 178.27,
    refs: [],
  },
  {
    slug: 'midazolam',
    name: 'Midazolam',
    aliases: ['Versed'],
    category: 'pharmacological',
    mechanism: 'Short-acting benzodiazepine — GABA-A α1/α2/α3/α5 positive allosteric modulator. Procedural sedation, anxiolysis, anterograde amnesia. CYP3A4 substrate — major DDI source (azoles, macrolides, ritonavir massively prolong sedation). Reversible with flumazenil.',
    routes: ['IV', 'IM', 'PO', 'IN', 'SL'],
    doses: { 'IV': { min: 1, max: 5, typical: 2, unit: 'mg' } },
    half_life_hr: { 'IV': 2.5 },
    mw_g_mol: 325.77,
    refs: [],
  },
  {
    slug: 'ketamine',
    name: 'Ketamine',
    aliases: ['Ketalar'],
    category: 'pharmacological',
    mechanism: 'Non-competitive NMDA receptor antagonist (open-channel blocker) + opioid + monoamine reuptake effects. Dissociative anesthetic preserving airway reflexes. Sub-anesthetic IV / intranasal (esketamine) for treatment-resistant depression. Schedule III; recreational misuse signal.',
    routes: ['IV', 'IM', 'PO', 'IN'],
    doses: { 'IV': { min: 0.5, max: 2, typical: 1, unit: 'mg' } },
    half_life_hr: { 'IV': 2.5 },
    mw_g_mol: 237.73,
    refs: [],
  },
  {
    slug: 'esketamine',
    name: 'Esketamine',
    aliases: ['Spravato'],
    category: 'pharmacological',
    mechanism: 'S-enantiomer of ketamine — ~4× NMDA receptor affinity vs racemate. Intranasal formulation FDA-approved for treatment-resistant depression in conjunction with oral antidepressant. Rapid (hours) antidepressant effect; REMS for dissociation + abuse risk.',
    routes: ['IN'],
    doses: { 'IN': { min: 28, max: 84, typical: 56, unit: 'mg' } },
    half_life_hr: { 'IN': 8 },
    mw_g_mol: 237.73,
    refs: [],
  },
  {
    slug: 'etomidate',
    name: 'Etomidate',
    aliases: ['Amidate'],
    category: 'pharmacological',
    mechanism: 'Imidazole GABA-A positive allosteric modulator — induction agent of choice in hemodynamically unstable patients (preserves blood pressure better than propofol). Single-dose adrenal suppression via 11β-hydroxylase inhibition; not used for ICU infusion.',
    routes: ['IV'],
    doses: { 'IV': { min: 0.2, max: 0.4, typical: 0.3, unit: 'mg' } },
    half_life_hr: { 'IV': 4 },
    mw_g_mol: 244.29,
    refs: [],
  },
  {
    slug: 'dexmedetomidine',
    name: 'Dexmedetomidine',
    aliases: ['Precedex'],
    category: 'pharmacological',
    mechanism: 'Selective α2-adrenergic agonist — sedation without respiratory depression (preserves arousability). ICU sedation alternative to benzodiazepines reduces delirium incidence; procedural sedation. Bradycardia + hypotension (especially with bolus loading).',
    routes: ['IV'],
    doses: { 'IV': { min: 0.2, max: 1.4, typical: 0.7, unit: 'mcg' } },
    half_life_hr: { 'IV': 2 },
    mw_g_mol: 200.28,
    refs: [],
  },

  // ── INHALED ANESTHETICS ───────────────────────────────────────────
  {
    slug: 'sevoflurane',
    name: 'Sevoflurane',
    aliases: ['Ultane'],
    category: 'pharmacological',
    mechanism: 'Inhaled fluorinated ether anesthetic — mechanism likely via GABA-A potentiation + glycine receptor + voltage-gated K+ channel modulation. Low blood-gas partition coefficient → rapid induction + emergence. Workhorse for pediatric mask induction; less pungent than isoflurane.',
    routes: ['INH'],
    doses: { 'INH': { min: 0.5, max: 4, typical: 2, unit: 'mg' } },
    half_life_hr: { 'INH': 0.5 },
    mw_g_mol: 200.05,
    refs: [],
  },
  {
    slug: 'isoflurane',
    name: 'Isoflurane',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Inhaled halogenated ether anesthetic — same broad GABA-A / glycine / K+ channel effects as sevoflurane but slower induction (higher blood-gas solubility) and pungent (limits pediatric mask use). Vasodilator with coronary vasodilation that historically raised "coronary steal" concerns (now considered non-issue).',
    routes: ['INH'],
    doses: { 'INH': { min: 0.5, max: 3, typical: 1.5, unit: 'mg' } },
    half_life_hr: { 'INH': 0.5 },
    mw_g_mol: 184.49,
    refs: [],
  },

  // ── LOCAL ANESTHETICS ─────────────────────────────────────────────
  {
    slug: 'lidocaine',
    name: 'Lidocaine',
    aliases: ['Xylocaine'],
    category: 'pharmacological',
    mechanism: 'Amide-class local anesthetic — voltage-gated Na+ channel blocker preferentially binding the inactivated state. Local infiltration, regional blocks, IV antiarrhythmic (Class IB) for ventricular arrhythmias, topical 5% patch for postherpetic neuralgia.',
    routes: ['IV', 'TD', 'IM', 'SC', 'IN'],
    doses: { 'IV': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'IV': 1.5 },
    mw_g_mol: 234.34,
    refs: [],
  },
  {
    slug: 'bupivacaine',
    name: 'Bupivacaine',
    aliases: ['Marcaine'],
    category: 'pharmacological',
    mechanism: 'Long-acting amide local anesthetic — Na+ channel blocker with ~4× duration of lidocaine. Used for epidurals, spinal anesthesia, nerve blocks. Cardiotoxicity (intractable VT/VF on accidental IV injection) is the dose-limiting concern; lipid emulsion is the rescue therapy.',
    routes: ['IM', 'SC', 'TD'],
    doses: { 'IM': { min: 25, max: 175, typical: 100, unit: 'mg' } },
    half_life_hr: { 'IM': 3 },
    mw_g_mol: 288.43,
    refs: [],
  },
  {
    slug: 'ropivacaine',
    name: 'Ropivacaine',
    aliases: ['Naropin'],
    category: 'pharmacological',
    mechanism: 'Long-acting amide local anesthetic — S-enantiomer of bupivacaine\'s racemate. Cardiotoxicity reduced vs bupivacaine (still real). Preferred for continuous epidural / peripheral nerve catheters where high cumulative doses occur.',
    routes: ['IM', 'SC'],
    doses: { 'IM': { min: 25, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'IM': 2 },
    mw_g_mol: 274.40,
    refs: [],
  },

  // ── NEUROMUSCULAR BLOCKERS ────────────────────────────────────────
  {
    slug: 'rocuronium',
    name: 'Rocuronium',
    aliases: ['Zemuron'],
    category: 'pharmacological',
    mechanism: 'Aminosteroid non-depolarizing neuromuscular blocker — competitive nicotinic ACh receptor antagonist at the motor endplate. Workhorse intubating muscle relaxant; rapid onset (~60 sec). Reversal with sugammadex (encapsulating agent) or neostigmine + glycopyrrolate.',
    routes: ['IV'],
    doses: { 'IV': { min: 0.6, max: 1.2, typical: 1, unit: 'mg' } },
    half_life_hr: { 'IV': 1.5 },
    mw_g_mol: 529.78,
    refs: [],
  },
  {
    slug: 'succinylcholine',
    name: 'Succinylcholine',
    aliases: ['Anectine'],
    category: 'pharmacological',
    mechanism: 'Depolarizing neuromuscular blocker — sustained nicotinic ACh receptor activation → fasciculations → flaccid paralysis. Fastest onset of any NMB (~30 sec). Hyperkalemia risk in burns, denervation, prolonged immobility. Trigger for malignant hyperthermia.',
    routes: ['IV', 'IM'],
    doses: { 'IV': { min: 1, max: 2, typical: 1.5, unit: 'mg' } },
    half_life_hr: { 'IV': 0.05 },
    mw_g_mol: 290.42,
    refs: [],
  },

  // ── ANTIPARASITICS ────────────────────────────────────────────────
  {
    slug: 'ivermectin',
    name: 'Ivermectin',
    aliases: ['Stromectol'],
    category: 'pharmacological',
    mechanism: 'Macrocyclic lactone antiparasitic — opens parasite glutamate-gated chloride channels → flaccid paralysis. Used for strongyloidiasis, onchocerciasis, scabies, lice. P-glycoprotein efflux at the BBB protects mammals from CNS toxicity. CYP3A4 substrate.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 0.15, max: 0.4, typical: 0.2, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 875.10,
    refs: [],
  },
  {
    slug: 'albendazole',
    name: 'Albendazole',
    aliases: ['Albenza'],
    category: 'pharmacological',
    mechanism: 'Benzimidazole anthelmintic — binds parasite β-tubulin disrupting microtubule assembly → glucose uptake failure → starvation. Broad spectrum: pinworm, hookworm, whipworm, neurocysticercosis, hydatid disease. Hepatotoxic; bone marrow suppression at high cumulative doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 265.34,
    refs: [],
  },
  {
    slug: 'mebendazole',
    name: 'Mebendazole',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Benzimidazole anthelmintic — same β-tubulin mechanism as albendazole. First-line for pinworm + roundworm + hookworm + whipworm. Minimally absorbed, so primarily a luminal-effect drug; few systemic side effects at standard doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 500, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 295.30,
    refs: [],
  },
  {
    slug: 'praziquantel',
    name: 'Praziquantel',
    aliases: ['Biltricide'],
    category: 'pharmacological',
    mechanism: 'Antitrematodal / cestocidal — increases parasite Ca²⁺ permeability causing tegument paralysis + disintegration. First-line for schistosomiasis, tapeworm infections (taeniasis, cysticercosis), liver flukes. Dramatic reduction in schistosomiasis burden in endemic areas via mass drug administration.',
    routes: ['PO'],
    doses: { 'PO': { min: 600, max: 4500, typical: 2400, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 312.41,
    refs: [],
  },
  {
    slug: 'pyrantel-pamoate',
    name: 'Pyrantel Pamoate',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Anthelmintic — depolarizing neuromuscular blocker for worms (nicotinic ACh agonist at parasite NMJ → spastic paralysis). OTC for pinworm; one-dose treatment with optional 2-week repeat. Minimally absorbed.',
    routes: ['PO'],
    doses: { 'PO': { min: 11, max: 11, typical: 11, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 594.69,
    refs: [],
  },
  {
    slug: 'nitazoxanide',
    name: 'Nitazoxanide',
    aliases: ['Alinia'],
    category: 'pharmacological',
    mechanism: 'Broad-spectrum antiparasitic + antiviral — interferes with pyruvate:ferredoxin oxidoreductase (PFOR) electron transfer in anaerobic protozoa. Approved for cryptosporidiosis + giardiasis; off-label for rotavirus and other viruses with mixed evidence.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 500, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 307.28,
    refs: [],
  },
  {
    slug: 'artemisinin',
    name: 'Artemisinin',
    aliases: ['Qinghaosu'],
    category: 'pharmacological',
    mechanism: 'Sesquiterpene lactone with endoperoxide bridge — heme-iron cleavage generates carbon-centered radicals that alkylate parasite proteins. First-line antimalarial when paired with a longer-acting partner drug (artemisinin combination therapy / ACT). Resistance emergence in Southeast Asia is a public-health concern.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 800, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 282.33,
    refs: [],
  },

  // ── ANTI-TUBERCULOSIS ─────────────────────────────────────────────
  {
    slug: 'isoniazid',
    name: 'Isoniazid',
    aliases: ['INH'],
    category: 'pharmacological',
    mechanism: 'Bactericidal anti-TB agent — prodrug activated by mycobacterial KatG to nicotinoyl-NAD adduct, inhibits InhA enoyl-ACP reductase → blocks mycolic-acid synthesis. NAT2 acetylator polymorphism drives clearance variability (~3-fold). Hepatotoxicity + B6-deficiency peripheral neuropathy (B6 supplementation mandatory).',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 100, max: 300, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 137.14,
    refs: [],
  },
  {
    slug: 'ethambutol',
    name: 'Ethambutol',
    aliases: ['Myambutol'],
    category: 'pharmacological',
    mechanism: 'Anti-TB agent — inhibits arabinosyl transferase blocking mycobacterial cell wall arabinan biosynthesis. Bacteriostatic component of standard 4-drug TB regimen. Dose-dependent optic neuritis (red-green color blindness) requires baseline + monthly visual checks.',
    routes: ['PO'],
    doses: { 'PO': { min: 800, max: 1600, typical: 1200, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 204.31,
    refs: [],
  },
  {
    slug: 'pyrazinamide',
    name: 'Pyrazinamide',
    aliases: ['PZA'],
    category: 'pharmacological',
    mechanism: 'Anti-TB prodrug activated by mycobacterial pyrazinamidase to pyrazinoic acid → disrupts membrane energetics in acidic phagosomes. Sterilizing component allowing the standard TB regimen to shorten from 9 to 6 months. Hepatotoxicity + hyperuricemia (gout flares).',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 2000, typical: 1500, unit: 'mg' } },
    half_life_hr: { 'PO': 10 },
    mw_g_mol: 123.11,
    refs: [],
  },

  // ── CANNABINOIDS ──────────────────────────────────────────────────
  {
    slug: 'cbd',
    name: 'Cannabidiol',
    aliases: ['CBD', 'Epidiolex'],
    category: 'alkaloid',
    mechanism: 'Non-psychoactive phytocannabinoid — weak CB1/CB2 affinity but allosteric negative modulator of CB1; agonist at TRPV1, 5-HT1A; modulator of GPR55, adenosine reuptake. FDA-approved (Epidiolex) for Dravet + Lennox-Gastaut + tuberous sclerosis seizures. Strong CYP2C19 + CYP3A4 inhibitor at therapeutic doses.',
    routes: ['PO', 'TD', 'INH'],
    doses: { 'PO': { min: 5, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 314.46,
    refs: [],
  },
  {
    slug: 'thc',
    name: 'THC',
    aliases: ['Δ9-tetrahydrocannabinol', 'Delta-9-THC'],
    category: 'alkaloid',
    mechanism: 'Primary psychoactive phytocannabinoid — partial CB1 agonist (CNS) + CB2 partial agonist (peripheral). CB1 in nucleus accumbens / PFC drives the euphoria + cognitive effects; CB1 in brainstem is sparse, explaining the very low overdose-respiratory-depression risk.',
    routes: ['PO', 'INH', 'TD', 'SL'],
    doses: { 'PO': { min: 2.5, max: 30, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 25 },
    mw_g_mol: 314.46,
    refs: [],
  },
  {
    slug: 'dronabinol',
    name: 'Dronabinol',
    aliases: ['Marinol'],
    category: 'pharmacological',
    mechanism: 'Synthetic Δ9-THC — same CB1/CB2 partial agonism. FDA-approved for chemotherapy-induced nausea + AIDS-related anorexia. Schedule III for the synthetic; CB1-mediated dysphoria + tachycardia limit dose escalation.',
    routes: ['PO'],
    doses: { 'PO': { min: 2.5, max: 20, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 25 },
    mw_g_mol: 314.46,
    refs: [],
  },
  {
    slug: 'cbg',
    name: 'CBG',
    aliases: ['Cannabigerol'],
    category: 'alkaloid',
    mechanism: '"Mother" phytocannabinoid — biosynthetic precursor to THC, CBD, CBC. Weak CB1/CB2 modulator; α2-adrenergic agonist; 5-HT1A antagonist. Limited clinical data; growing supplement-market interest.',
    routes: ['PO', 'INH'],
    doses: { 'PO': { min: 10, max: 150, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 316.48,
    refs: [],
  },

  // ── PULMONARY HYPERTENSION ────────────────────────────────────────
  {
    slug: 'bosentan',
    name: 'Bosentan',
    aliases: ['Tracleer'],
    category: 'pharmacological',
    mechanism: 'Dual endothelin-A + B receptor antagonist — blocks vasoconstrictive + proliferative effects of endothelin-1 on pulmonary vasculature. Approved for pulmonary arterial hypertension. Hepatotoxicity (REMS program) + teratogenicity. Strong CYP3A4 inducer.',
    routes: ['PO'],
    doses: { 'PO': { min: 62.5, max: 125, typical: 125, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 551.62,
    refs: [],
  },
  {
    slug: 'macitentan',
    name: 'Macitentan',
    aliases: ['Opsumit'],
    category: 'pharmacological',
    mechanism: 'Dual endothelin receptor antagonist — successor to bosentan with sustained tissue binding and once-daily dosing. PAH; hepatotoxicity is less than bosentan. Anemia + nasopharyngitis are the more common adverse effects.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 10, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 16 },
    mw_g_mol: 588.27,
    refs: [],
  },
  {
    slug: 'riociguat',
    name: 'Riociguat',
    aliases: ['Adempas'],
    category: 'pharmacological',
    mechanism: 'Soluble guanylate cyclase (sGC) stimulator — sensitizes sGC to NO + activates the NO-independent site. Raises cGMP → pulmonary vasodilation. Approved for PAH + chronic thromboembolic pulmonary hypertension (CTEPH). Contraindicated with PDE5 inhibitors + nitrates (additive hypotension).',
    routes: ['PO'],
    doses: { 'PO': { min: 1, max: 2.5, typical: 1, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 422.42,
    refs: [],
  },

  // ── ANTI-ANGINAL / HEART FAILURE ─────────────────────────────────
  {
    slug: 'ranolazine',
    name: 'Ranolazine',
    aliases: ['Ranexa'],
    category: 'pharmacological',
    mechanism: 'Late sodium current (INa-late) inhibitor in cardiomyocytes — reduces Ca²⁺ overload and improves diastolic function. Anti-anginal without significant heart-rate or BP effects. CYP3A4 + P-gp substrate; QT prolongation modest. Mild HbA1c reduction signal.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 1000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 427.54,
    refs: [],
  },
  {
    slug: 'ivabradine',
    name: 'Ivabradine',
    aliases: ['Corlanor'],
    category: 'pharmacological',
    mechanism: 'Selective sinoatrial-node funny-current (If) inhibitor — slows HR without affecting contractility, conduction, or BP. Approved for heart failure with sinus rhythm + HR ≥ 70 bpm on max β-blocker. Phosphenes (visual brightness) from retinal Ih channel blockade.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 7.5, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 468.59,
    refs: [],
  },
  {
    slug: 'sacubitril',
    name: 'Sacubitril',
    aliases: ['Component of Entresto'],
    category: 'pharmacological',
    mechanism: 'Neprilysin inhibitor prodrug — active metabolite LBQ657 inhibits NEP, raising natriuretic peptides (BNP, ANP) → vasodilation, natriuresis, anti-fibrotic. Always co-formulated with valsartan as Entresto for HFrEF; ACE inhibitor washout 36h required to avoid angioedema.',
    routes: ['PO'],
    doses: { 'PO': { min: 24, max: 97, typical: 49, unit: 'mg' } },
    half_life_hr: { 'PO': 11 },
    mw_g_mol: 411.49,
    refs: [],
  },
  {
    slug: 'hydralazine',
    name: 'Hydralazine',
    aliases: ['Apresoline'],
    category: 'pharmacological',
    mechanism: 'Direct arterial vasodilator — likely via NO pathway + IP3 / Ca²⁺ inhibition in vascular smooth muscle. Used as adjunct in HFrEF (the BiDil combination with isosorbide dinitrate showed mortality reduction in self-identified Black patients). Drug-induced lupus is the classic adverse effect.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'PO': { min: 10, max: 100, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 160.18,
    refs: [],
  },

  // ── OB/GYN SPECIALTY ──────────────────────────────────────────────
  {
    slug: 'clomiphene',
    name: 'Clomiphene',
    aliases: ['Clomid'],
    category: 'hormone',
    mechanism: 'SERM — antagonist at hypothalamic ER → blocks negative feedback → raises GnRH/FSH/LH → ovarian stimulation. First-line ovulation induction in PCOS / unexplained infertility. Off-label in men for raising endogenous testosterone via the same hypothalamic-feedback pathway.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 100, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 120 },
    mw_g_mol: 405.96,
    refs: [],
  },
  {
    slug: 'mifepristone',
    name: 'Mifepristone',
    aliases: ['RU-486', 'Korlym'],
    category: 'hormone',
    mechanism: 'Progesterone receptor antagonist + glucocorticoid receptor antagonist. Combined with misoprostol for medical abortion (≤10 weeks). Korlym formulation for hyperglycemia in Cushing syndrome leverages the GR antagonism.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 600, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 429.60,
    refs: [],
  },
  {
    slug: 'misoprostol',
    name: 'Misoprostol',
    aliases: ['Cytotec'],
    category: 'pharmacological',
    mechanism: 'Synthetic prostaglandin E1 analog. Multiple uses: gastric mucosal protection (NSAID-induced ulcer prevention), labor induction, postpartum hemorrhage management, medical abortion (with mifepristone), missed miscarriage management.',
    routes: ['PO', 'PR', 'IM'],
    doses: { 'PO': { min: 100, max: 800, typical: 200, unit: 'mcg' } },
    half_life_hr: { 'PO': 0.5 },
    mw_g_mol: 382.54,
    refs: [],
  },
  {
    slug: 'letrozole',
    name: 'Letrozole (ovulation induction)',
    aliases: ['Femara'],
    category: 'hormone',
    mechanism: 'Aromatase inhibitor — same CYP19A1 blockade as in breast cancer, but used off-label for ovulation induction. Now first-line over clomiphene in PCOS for higher live-birth rates (Legro 2014). Lower multiple-pregnancy rate than gonadotropins.',
    routes: ['PO'],
    doses: { 'PO': { min: 2.5, max: 7.5, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 50 },
    mw_g_mol: 285.30,
    refs: [],
  },

  // ── UROLOGIC / OVERACTIVE BLADDER ─────────────────────────────────
  {
    slug: 'oxybutynin',
    name: 'Oxybutynin',
    aliases: ['Ditropan'],
    category: 'pharmacological',
    mechanism: 'Anticholinergic + direct antispasmodic — competitive M3 muscarinic antagonist on detrusor + spasmolytic on bladder smooth muscle. First-line for overactive bladder. Anticholinergic burden — Beers-list problematic in elderly (cognitive impairment + dementia signal at chronic exposure).',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 5, max: 30, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 357.49,
    refs: [],
  },
  {
    slug: 'tolterodine',
    name: 'Tolterodine',
    aliases: ['Detrol'],
    category: 'pharmacological',
    mechanism: 'Bladder-preferential M3 muscarinic antagonist — designed for higher detrusor selectivity vs salivary gland. Active 5-OH metabolite via CYP2D6. Slightly cleaner anticholinergic profile than oxybutynin, but still meaningful Beers-list concerns.',
    routes: ['PO'],
    doses: { 'PO': { min: 1, max: 4, typical: 4, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 325.49,
    refs: [],
  },
  {
    slug: 'mirabegron',
    name: 'Mirabegron',
    aliases: ['Myrbetriq'],
    category: 'pharmacological',
    mechanism: 'β3-adrenergic agonist — relaxes detrusor smooth muscle without anticholinergic side-effect burden. Preferred over oxybutynin / tolterodine in elderly. CYP2D6 inhibitor — caution with metoprolol, antidepressants. Modest BP elevation.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 50, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 50 },
    mw_g_mol: 396.51,
    refs: [],
  },

  // ── SMOKING CESSATION ─────────────────────────────────────────────
  {
    slug: 'varenicline',
    name: 'Varenicline',
    aliases: ['Chantix'],
    category: 'pharmacological',
    mechanism: 'Partial agonist at α4β2 nicotinic ACh receptor — reduces cigarette craving + withdrawal while blocking the reinforcing effect of smoked nicotine. Most efficacious smoking-cessation agent in head-to-head trials. Neuropsychiatric concerns (FDA black-box removed 2016 after EAGLES trial).',
    routes: ['PO'],
    doses: { 'PO': { min: 0.5, max: 1, typical: 1, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 211.27,
    refs: [],
  },

  // ── SPECIALTY BOTANICAL SUPPLEMENTS ───────────────────────────────
  {
    slug: 'echinacea',
    name: 'Echinacea',
    aliases: ['Echinacea purpurea / angustifolia'],
    category: 'adaptogen',
    mechanism: 'Coneflower extract; alkylamides + chicoric acid + polysaccharides as named actives. Modest immunomodulatory effects via macrophage / NK-cell stimulation. Cochrane reviews show small effect on cold duration / severity.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 900, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'elderberry',
    name: 'Elderberry',
    aliases: ['Sambucus nigra'],
    category: 'adaptogen',
    mechanism: 'Berry extract rich in anthocyanins (cyanidin glycosides). In vitro hemagglutinin binding blocks influenza adsorption; small RCTs (Tiralongo 2016) show ~2-day flu duration reduction. Raw uncooked berries contain cyanogenic glycosides — only commercial extracts are safe.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 1500, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'oregano-oil',
    name: 'Oregano Oil',
    aliases: ['Origanum vulgare oil'],
    category: 'adaptogen',
    mechanism: 'Volatile-oil mixture; carvacrol + thymol are the named antimicrobial actives. In vitro broad-spectrum antibacterial + antifungal at high concentrations. Clinical evidence for systemic infection treatment thin; common in SIBO + candida supplement protocols.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 50, max: 600, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'ginger',
    name: 'Ginger',
    aliases: ['Zingiber officinale'],
    category: 'adaptogen',
    mechanism: 'Rhizome extract; gingerols + shogaols are the named actives. 5-HT3 + M3 antagonism contribute to antiemetic effect (clinically validated for chemotherapy-induced + pregnancy nausea). COX-2 inhibition for anti-inflammatory use; modest anti-platelet activity.',
    routes: ['PO'],
    doses: { 'PO': { min: 250, max: 1500, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    refs: [],
  },
  {
    slug: 'aged-garlic',
    name: 'Aged Garlic Extract',
    aliases: ['AGE', 'Allium sativum aged'],
    category: 'adaptogen',
    mechanism: 'Aged-extract form — converts unstable allicin to stable S-allylcysteine + S-allylmercaptocysteine. Modest BP lowering (~5–8 mmHg systolic) + LDL reduction in meta-analyses. Less GI / odor side effects than fresh garlic.',
    routes: ['PO'],
    doses: { 'PO': { min: 600, max: 2400, typical: 1200, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
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

  console.log('\nWave 0b sub-batch 6 — anesthetics / antiparasitics / cannabinoids / misc:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
