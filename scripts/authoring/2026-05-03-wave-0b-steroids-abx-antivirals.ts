/**
 * 2026-05-03-wave-0b-steroids-abx-antivirals.ts — Wave 0b sub-batch 5.
 *
 * Therapeutic clusters this batch fills:
 *   - Topical corticosteroids (low → super-high potency ladder)
 *   - β-lactam antibiotics (penicillins, cephalosporins beyond cephalexin,
 *     carbapenems)
 *   - Aminoglycosides (gentamicin, tobramycin)
 *   - Tetracyclines (minocycline, tigecycline)
 *   - HIV antiretrovirals (nucleoside / non-nucleoside / integrase /
 *     protease inhibitors)
 *   - HCV direct-acting antivirals (sofosbuvir, ledipasvir)
 *   - SARS-CoV-2 antivirals (nirmatrelvir, remdesivir, molnupiravir)
 *   - Topical immunomodulators (tacrolimus-topical)
 *   - Additional SSRIs / SNRIs / atypical antidepressants
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
  // ── TOPICAL CORTICOSTEROIDS (potency ladder) ──────────────────────
  {
    slug: 'hydrocortisone-topical',
    name: 'Hydrocortisone (topical)',
    aliases: ['Cortizone-10'],
    category: 'topical',
    mechanism: 'Low-potency topical glucocorticoid (Class VII) — same molecule as endogenous cortisol. OTC at 0.5–1% strength for mild dermatitis, eczema, insect bites. Minimal systemic absorption from intact skin; safe for face / intertriginous use short-term.',
    routes: ['TD'],
    doses: { 'TD': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'TD': 3 },
    mw_g_mol: 362.46,
    refs: [],
  },
  {
    slug: 'triamcinolone',
    name: 'Triamcinolone',
    aliases: ['Kenalog'],
    category: 'pharmacological',
    mechanism: 'Mid-potency synthetic glucocorticoid — fluorinated to enhance receptor affinity. Available topical, intra-articular (Kenalog injection), inhaled (nasal), and intra-ocular. Common for joint injections in osteoarthritis flares + dermatologic flares.',
    routes: ['TD', 'IM', 'IN', 'INH'],
    doses: { 'TD': { min: 0.025, max: 0.5, typical: 0.1, unit: 'mg' } },
    half_life_hr: { 'TD': 4 },
    mw_g_mol: 394.43,
    refs: [],
  },
  {
    slug: 'mometasone',
    name: 'Mometasone',
    aliases: ['Elocon', 'Nasonex'],
    category: 'pharmacological',
    mechanism: 'High-potency synthetic glucocorticoid with very low systemic bioavailability after intranasal or topical use — first-line intranasal corticosteroid for allergic rhinitis. Once-daily dosing. Topical Class III strength for moderate-to-severe dermatitis.',
    routes: ['IN', 'INH', 'TD'],
    doses: { 'IN': { min: 0.1, max: 0.4, typical: 0.2, unit: 'mg' } },
    half_life_hr: { 'IN': 5 },
    mw_g_mol: 521.43,
    refs: [],
  },
  {
    slug: 'betamethasone',
    name: 'Betamethasone',
    aliases: ['Diprolene'],
    category: 'pharmacological',
    mechanism: 'High-potency fluorinated synthetic glucocorticoid (~25× cortisol). Topical Class I-III strength depending on vehicle + ester form. Systemic IM/IV used for fetal lung maturation in preterm labor. Cushingoid risk with chronic high-potency topical use over large body areas.',
    routes: ['TD', 'IM', 'IV', 'PO'],
    doses: { 'TD': { min: 0.05, max: 0.5, typical: 0.1, unit: 'mg' } },
    half_life_hr: { 'TD': 5 },
    mw_g_mol: 392.46,
    refs: [],
  },
  {
    slug: 'clobetasol',
    name: 'Clobetasol Propionate',
    aliases: ['Temovate'],
    category: 'topical',
    mechanism: 'Super-high-potency topical glucocorticoid (Class I — most potent) — fluorinated + chlorinated steroid. Reserved for severe psoriasis, lichen planus, recalcitrant dermatitis. Two-week max courses on limited body areas to avoid HPA axis suppression and skin atrophy.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.05, max: 0.5, typical: 0.05, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    mw_g_mol: 467.0,
    refs: [],
  },
  {
    slug: 'tacrolimus-topical',
    name: 'Tacrolimus (topical)',
    aliases: ['Protopic'],
    category: 'topical',
    mechanism: 'Topical calcineurin inhibitor — binds FKBP-12 → blocks calcineurin-dependent T cell activation locally in skin. Steroid-sparing for atopic dermatitis, especially face / eyelid where steroid atrophy is concerning. FDA black-box for theoretical lymphoma risk; epidemiologic signal weak.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.3, max: 1, typical: 1, unit: 'mg' } },
    half_life_hr: { 'TD': 10 },
    mw_g_mol: 804.02,
    refs: [],
  },
  {
    slug: 'pimecrolimus',
    name: 'Pimecrolimus',
    aliases: ['Elidel'],
    category: 'topical',
    mechanism: 'Topical calcineurin inhibitor — same FKBP-12 / calcineurin pathway as tacrolimus, slightly less potent and lower systemic absorption. Approved for mild-to-moderate atopic dermatitis as a steroid alternative. Same FDA black-box (theoretical lymphoma).',
    routes: ['TD'],
    doses: { 'TD': { min: 1, max: 1, typical: 1, unit: 'mg' } },
    half_life_hr: { 'TD': 12 },
    mw_g_mol: 810.46,
    refs: [],
  },

  // ── β-LACTAM ANTIBIOTICS ──────────────────────────────────────────
  {
    slug: 'penicillin-v',
    name: 'Penicillin V',
    aliases: ['Phenoxymethylpenicillin'],
    category: 'pharmacological',
    mechanism: 'Acid-stable orally-absorbed penicillin — inhibits bacterial transpeptidase (PBPs) crosslinking peptidoglycan. Streptococcal coverage for strep pharyngitis, secondary prophylaxis of rheumatic fever, dental prophylaxis (where indicated). Renal-cleared.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 250, max: 500, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 350.39,
    refs: [],
  },
  {
    slug: 'ampicillin',
    name: 'Ampicillin',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Aminopenicillin β-lactam — broader spectrum than penicillin (adds Listeria, Enterococcus, some gram-negatives). IV use in meningitis empiric coverage + Listeria-targeted therapy in elderly + immunocompromised. Renal-cleared.',
    routes: ['PO', 'IV', 'IM'],
    doses: { 'IV': { min: 250, max: 2000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'IV': 1 },
    mw_g_mol: 349.41,
    refs: [],
  },
  {
    slug: 'amoxicillin-clavulanate',
    name: 'Amoxicillin / Clavulanate',
    aliases: ['Augmentin'],
    category: 'pharmacological',
    mechanism: 'Amoxicillin + the β-lactamase inhibitor clavulanate — extends coverage to β-lactamase-producing H. influenzae, Moraxella, Bacteroides. Higher GI side-effect rate than amoxicillin alone (clavulanate-driven). First-line for animal bite + many sinusitis / otitis media + UTIs.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 500, max: 875, typical: 875, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 365.40,
    refs: [],
  },
  {
    slug: 'ceftriaxone',
    name: 'Ceftriaxone',
    aliases: ['Rocephin'],
    category: 'pharmacological',
    mechanism: 'Third-generation cephalosporin β-lactam — extended gram-negative + good gram-positive coverage. Once-daily IV/IM dosing makes it a workhorse for inpatient pneumonia, meningitis (CSF penetration), gonorrhea single-dose. Biliary > renal clearance — sludging in gallbladder.',
    routes: ['IV', 'IM'],
    doses: { 'IV': { min: 500, max: 2000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'IV': 8 },
    mw_g_mol: 554.58,
    refs: [],
  },
  {
    slug: 'cefepime',
    name: 'Cefepime',
    aliases: ['Maxipime'],
    category: 'pharmacological',
    mechanism: 'Fourth-generation cephalosporin — extended gram-negative coverage including Pseudomonas while retaining gram-positive activity. Empiric therapy for febrile neutropenia + healthcare-associated infections. Neurotoxicity (altered mental status, myoclonus) at high doses or renal failure.',
    routes: ['IV', 'IM'],
    doses: { 'IV': { min: 500, max: 2000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'IV': 2 },
    mw_g_mol: 480.56,
    refs: [],
  },
  {
    slug: 'meropenem',
    name: 'Meropenem',
    aliases: ['Merrem'],
    category: 'pharmacological',
    mechanism: 'Carbapenem β-lactam — very broad spectrum (gram-positive, gram-negative including Pseudomonas + ESBL producers, anaerobes). Reserved for severe infections + ESBL-producing organisms. Lower seizure risk than imipenem.',
    routes: ['IV'],
    doses: { 'IV': { min: 500, max: 2000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'IV': 1 },
    mw_g_mol: 437.52,
    refs: [],
  },
  {
    slug: 'piperacillin-tazobactam',
    name: 'Piperacillin / Tazobactam',
    aliases: ['Zosyn'],
    category: 'pharmacological',
    mechanism: 'Anti-pseudomonal penicillin (piperacillin) + β-lactamase inhibitor (tazobactam). Workhorse empiric IV for hospital-acquired pneumonia + intra-abdominal infections + febrile neutropenia. Synergy with aminoglycosides for severe Pseudomonas infections.',
    routes: ['IV'],
    doses: { 'IV': { min: 2250, max: 4500, typical: 3375, unit: 'mg' } },
    half_life_hr: { 'IV': 1 },
    mw_g_mol: 539.54,
    refs: [],
  },

  // ── AMINOGLYCOSIDES ───────────────────────────────────────────────
  {
    slug: 'gentamicin',
    name: 'Gentamicin',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Aminoglycoside — binds bacterial 30S ribosome at A-site, causes misreading + premature chain termination. Concentration-dependent killing → once-daily extended-interval dosing. Nephrotoxicity + ototoxicity (cochlear + vestibular) require trough monitoring + audiometry.',
    routes: ['IV', 'IM', 'TD'],
    doses: { 'IV': { min: 80, max: 500, typical: 240, unit: 'mg' } },
    half_life_hr: { 'IV': 2 },
    mw_g_mol: 477.60,
    refs: [],
  },
  {
    slug: 'tobramycin',
    name: 'Tobramycin',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Aminoglycoside with anti-pseudomonal activity slightly stronger than gentamicin. Inhaled formulation (TOBI) for chronic Pseudomonas suppression in cystic fibrosis. Same nephro / oto toxicity profile.',
    routes: ['IV', 'IM', 'INH', 'TD'],
    doses: { 'IV': { min: 80, max: 500, typical: 240, unit: 'mg' } },
    half_life_hr: { 'IV': 2 },
    mw_g_mol: 467.51,
    refs: [],
  },

  // ── TETRACYCLINES ─────────────────────────────────────────────────
  {
    slug: 'minocycline',
    name: 'Minocycline',
    aliases: ['Minocin'],
    category: 'pharmacological',
    mechanism: 'Tetracycline — 30S ribosomal inhibitor. Higher CNS penetration than doxycycline (anti-inflammatory neuro-applications studied). First-line for inflammatory acne; vestibular side effects (~10%) worse than doxycycline.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 50, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 16 },
    mw_g_mol: 457.48,
    refs: [],
  },

  // ── HIV ANTIRETROVIRALS ───────────────────────────────────────────
  {
    slug: 'tenofovir-disoproxil',
    name: 'Tenofovir Disoproxil',
    aliases: ['TDF', 'Viread'],
    category: 'pharmacological',
    mechanism: 'Nucleotide reverse transcriptase inhibitor prodrug — converted to tenofovir → di-phosphate, a chain-terminator for HIV/HBV reverse transcriptase. Backbone of HIV ART + HBV antiviral. Renal proximal tubular toxicity + bone density loss are class concerns; TAF formulation (tenofovir alafenamide) reduces both.',
    routes: ['PO'],
    doses: { 'PO': { min: 245, max: 300, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 17 },
    mw_g_mol: 519.44,
    refs: [],
  },
  {
    slug: 'tenofovir-alafenamide',
    name: 'Tenofovir Alafenamide',
    aliases: ['TAF'],
    category: 'pharmacological',
    mechanism: 'Newer prodrug of tenofovir — preferential cleavage by lymphocyte cathepsin A → higher intracellular tenofovir-DP with much lower plasma tenofovir vs TDF. Reduced renal + bone toxicity. Replaces TDF in modern combination ART regimens.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 25, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 0.5 },
    mw_g_mol: 476.47,
    refs: [],
  },
  {
    slug: 'emtricitabine',
    name: 'Emtricitabine',
    aliases: ['FTC'],
    category: 'pharmacological',
    mechanism: 'NRTI — cytidine analog phosphorylated to FTC-TP, a chain-terminator for HIV-1 reverse transcriptase. Always combined with tenofovir as the dual NRTI backbone of HIV ART. Active against HBV. Excellent tolerability.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 200, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 10 },
    mw_g_mol: 247.25,
    refs: [],
  },
  {
    slug: 'lamivudine',
    name: 'Lamivudine',
    aliases: ['3TC', 'Epivir'],
    category: 'pharmacological',
    mechanism: 'NRTI — cytidine analog. Older HIV / HBV antiviral; lower-cost backbone in resource-limited settings. Mostly replaced in HIV ART by emtricitabine, but still used in HBV monotherapy + co-formulated dual products.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 300, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 229.26,
    refs: [],
  },
  {
    slug: 'efavirenz',
    name: 'Efavirenz',
    aliases: ['Sustiva'],
    category: 'pharmacological',
    mechanism: 'NNRTI — non-competitive HIV-1 reverse transcriptase inhibitor. Strong CYP3A4 inducer + CYP2B6 substrate (poor metabolizers have very high AUC + CNS toxicity). Vivid dreams, depression, suicidality signal at therapeutic doses — modern regimens have largely moved past efavirenz.',
    routes: ['PO'],
    doses: { 'PO': { min: 600, max: 600, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 50 },
    mw_g_mol: 315.68,
    refs: [],
  },
  {
    slug: 'dolutegravir',
    name: 'Dolutegravir',
    aliases: ['Tivicay'],
    category: 'pharmacological',
    mechanism: 'HIV integrase strand-transfer inhibitor (INSTI) — blocks integration of viral DNA into host genome. High barrier to resistance; cornerstone of modern first-line ART. Modest UGT1A1 substrate; food doubles AUC.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 50, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 14 },
    mw_g_mol: 419.38,
    refs: [],
  },
  {
    slug: 'bictegravir',
    name: 'Bictegravir',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Second-generation HIV INSTI — higher barrier to resistance than dolutegravir. Co-formulated with TAF + emtricitabine as Biktarvy, a single-tablet once-daily HIV regimen.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 50, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 449.39,
    refs: [],
  },

  // ── HCV DIRECT-ACTING ANTIVIRALS ──────────────────────────────────
  {
    slug: 'sofosbuvir',
    name: 'Sofosbuvir',
    aliases: ['Sovaldi'],
    category: 'pharmacological',
    mechanism: 'HCV NS5B nucleotide polymerase inhibitor — uridine analog phosphorylated to active triphosphate, a chain-terminator for HCV RNA polymerase. Backbone of pan-genotypic HCV cure regimens (typically combined with NS5A inhibitor).',
    routes: ['PO'],
    doses: { 'PO': { min: 400, max: 400, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 0.5 },
    mw_g_mol: 529.45,
    refs: [],
  },
  {
    slug: 'ledipasvir',
    name: 'Ledipasvir',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'HCV NS5A inhibitor — disrupts NS5A protein function, blocking viral replication and assembly. Co-formulated with sofosbuvir as Harvoni for genotype 1/4/5/6 HCV — 12-week course with > 95% cure rate.',
    routes: ['PO'],
    doses: { 'PO': { min: 90, max: 90, typical: 90, unit: 'mg' } },
    half_life_hr: { 'PO': 47 },
    mw_g_mol: 889.00,
    refs: [],
  },

  // ── COVID-19 ANTIVIRALS ───────────────────────────────────────────
  {
    slug: 'nirmatrelvir',
    name: 'Nirmatrelvir',
    aliases: ['Component of Paxlovid'],
    category: 'pharmacological',
    mechanism: 'SARS-CoV-2 main protease (3CLpro / Mpro) inhibitor — blocks polyprotein cleavage. Co-administered with low-dose ritonavir as Paxlovid to inhibit nirmatrelvir\'s CYP3A4 metabolism. Major DDI engine via the ritonavir component during the 5-day course.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 300, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 499.53,
    refs: [],
  },
  {
    slug: 'molnupiravir',
    name: 'Molnupiravir',
    aliases: ['Lagevrio'],
    category: 'pharmacological',
    mechanism: 'Ribonucleoside prodrug — phosphorylated to a pseudo-cytidine analog incorporated by SARS-CoV-2 RNA polymerase, inducing lethal mutagenesis (error catastrophe). Less efficacious than Paxlovid; used when Paxlovid is contraindicated or inaccessible.',
    routes: ['PO'],
    doses: { 'PO': { min: 800, max: 800, typical: 800, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 329.31,
    refs: [],
  },
  {
    slug: 'remdesivir',
    name: 'Remdesivir',
    aliases: ['Veklury'],
    category: 'pharmacological',
    mechanism: 'Adenosine analog prodrug — intracellularly activated to remdesivir-TP, a delayed chain-terminator for SARS-CoV-2 RNA-dependent RNA polymerase (RdRp). IV infusion for hospitalized COVID-19 + outpatient high-risk unable to take Paxlovid.',
    routes: ['IV'],
    doses: { 'IV': { min: 100, max: 200, typical: 200, unit: 'mg' } },
    half_life_hr: { 'IV': 1 },
    mw_g_mol: 602.58,
    refs: [],
  },

  // ── ADDITIONAL SSRI / SNRI / ATYPICAL ─────────────────────────────
  {
    slug: 'fluvoxamine',
    name: 'Fluvoxamine',
    aliases: ['Luvox'],
    category: 'pharmacological',
    mechanism: 'SSRI — also a strong CYP1A2 inhibitor (raises clozapine, theophylline, melatonin, caffeine to clinically meaningful degrees). FDA-approved for OCD; off-label for depression + early COVID-19 (the "TOGETHER" trial).',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 300, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 16 },
    mw_g_mol: 318.34,
    refs: [],
  },
  {
    slug: 'desvenlafaxine',
    name: 'Desvenlafaxine',
    aliases: ['Pristiq'],
    category: 'pharmacological',
    mechanism: 'SNRI — active O-desmethyl metabolite of venlafaxine. Bypasses CYP2D6 conversion → more consistent levels in CYP2D6 poor metabolizers. Stronger NE component at therapeutic doses than venlafaxine.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 100, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 11 },
    mw_g_mol: 263.38,
    refs: [],
  },
  {
    slug: 'agomelatine',
    name: 'Agomelatine',
    aliases: ['Valdoxan'],
    category: 'pharmacological',
    mechanism: 'Atypical antidepressant — melatonin MT1/MT2 agonist + 5-HT2C antagonist. Resynchronizes circadian rhythm in depression with sleep architecture disruption. Hepatotoxicity warning requires LFT monitoring.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 243.30,
    refs: [],
  },
  {
    slug: 'vilazodone',
    name: 'Vilazodone',
    aliases: ['Viibryd'],
    category: 'pharmacological',
    mechanism: 'SSRI + 5-HT1A partial agonist — dual mechanism intended to soften initial worsening of anxiety + sexual side effects vs traditional SSRIs. Take with food (doubles AUC).',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 40, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 25 },
    mw_g_mol: 441.52,
    refs: [],
  },

  // ── ADDITIONAL ANTI-PSYCH / MOOD ──────────────────────────────────
  {
    slug: 'brexpiprazole',
    name: 'Brexpiprazole',
    aliases: ['Rexulti'],
    category: 'pharmacological',
    mechanism: 'Atypical antipsychotic — D2 + 5-HT1A partial agonist + 5-HT2A antagonist. Lower akathisia + activation than aripiprazole. Approved for schizophrenia + adjunct in MDD + Alzheimer-related agitation (2023).',
    routes: ['PO'],
    doses: { 'PO': { min: 0.25, max: 4, typical: 2, unit: 'mg' } },
    half_life_hr: { 'PO': 91 },
    mw_g_mol: 433.57,
    refs: [],
  },
  {
    slug: 'lurasidone',
    name: 'Lurasidone',
    aliases: ['Latuda'],
    category: 'pharmacological',
    mechanism: 'Atypical antipsychotic — D2 + 5-HT2A + 5-HT7 antagonist + 5-HT1A partial agonist. Lower metabolic profile (weight, lipids) than olanzapine / quetiapine; FDA-approved for schizophrenia + bipolar depression. CYP3A4 substrate; food-effect (must take with ≥350 kcal meal).',
    routes: ['PO'],
    doses: { 'PO': { min: 20, max: 160, typical: 80, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 492.68,
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

  console.log('\nWave 0b sub-batch 5 — steroids / abx / antivirals / psych:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
