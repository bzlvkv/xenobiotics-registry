/**
 * 2026-05-03-wave-0b-1000.ts — Wave 0b sub-batch 11 (the 1000 push).
 *
 * Final stretch to clear the v1.0 catalog target of 1000+:
 *   - More HCV DAAs (glecaprevir, pibrentasvir, velpatasvir, daclatasvir)
 *   - More HIV antiretrovirals (raltegravir, etravirine, abacavir,
 *     doravirine, lamivudine already)
 *   - More anti-seizure (rufinamide, eslicarbazepine, stiripentol)
 *   - More diabetes (alogliptin, repaglinide, nateglinide)
 *   - More AAS (methyltestosterone, danazol, fluoxymesterone)
 *   - Antiseborrheic (selenium-sulfide, zinc-pyrithione)
 *   - Topical antibiotics (erythromycin-topical, clindamycin-topical)
 *   - Specialty Rx (riluzole, sodium-oxybate, dantrolene, dicyclomine)
 *   - More herbs (yerba-mate, nettle, dandelion, raspberry-leaf)
 *   - Cosmetic peptides + research compounds
 *   - More research nootropics (fasoracetam, idra-21)
 *   - More dental local anesthetics (articaine, mepivacaine)
 *   - Cinacalcet, etoricoxib, eluxadoline
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
  // ── HCV DAAs ──────────────────────────────────────────────────────
  {
    slug: 'glecaprevir',
    name: 'Glecaprevir',
    aliases: ['Component of Mavyret'],
    category: 'pharmacological',
    mechanism: 'Pan-genotypic HCV NS3/4A protease inhibitor — blocks viral polyprotein cleavage. Co-formulated with the NS5A inhibitor pibrentasvir as Mavyret for 8-week pan-genotypic HCV cure regimen.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 300, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 838.88,
    refs: [],
  },
  {
    slug: 'pibrentasvir',
    name: 'Pibrentasvir',
    aliases: ['Component of Mavyret'],
    category: 'pharmacological',
    mechanism: 'Pan-genotypic HCV NS5A inhibitor — blocks viral RNA replication and assembly. Co-formulated with glecaprevir as Mavyret. >97% sustained viral response across HCV genotypes 1–6 in 8-week treatment-naive regimens.',
    routes: ['PO'],
    doses: { 'PO': { min: 120, max: 120, typical: 120, unit: 'mg' } },
    half_life_hr: { 'PO': 23 },
    mw_g_mol: 1113.20,
    refs: [],
  },
  {
    slug: 'velpatasvir',
    name: 'Velpatasvir',
    aliases: ['Component of Epclusa'],
    category: 'pharmacological',
    mechanism: 'Pan-genotypic HCV NS5A inhibitor — combined with sofosbuvir as Epclusa for 12-week pan-genotypic regimen including decompensated cirrhosis. CYP2C8 + CYP2B6 + CYP3A4 substrate; gastric acid required for absorption (PPI co-administration lowers F).',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 100, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 17 },
    mw_g_mol: 883.02,
    refs: [],
  },

  // ── HIV ANTIRETROVIRALS ───────────────────────────────────────────
  {
    slug: 'raltegravir',
    name: 'Raltegravir',
    aliases: ['Isentress'],
    category: 'pharmacological',
    mechanism: 'First-in-class HIV integrase strand-transfer inhibitor (INSTI) — blocks viral DNA integration into host genome. Largely supplanted by dolutegravir + bictegravir for once-daily dosing + better resistance barrier.',
    routes: ['PO'],
    doses: { 'PO': { min: 400, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 9 },
    mw_g_mol: 444.42,
    refs: [],
  },
  {
    slug: 'etravirine',
    name: 'Etravirine',
    aliases: ['Intelence'],
    category: 'pharmacological',
    mechanism: 'Second-generation NNRTI — flexible binding mode active against HIV-1 with first-generation NNRTI resistance mutations. Reserved for treatment-experienced patients. CYP3A4 + CYP2C9 + CYP2C19 substrate + inducer.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 200, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 41 },
    mw_g_mol: 435.28,
    refs: [],
  },
  {
    slug: 'abacavir',
    name: 'Abacavir',
    aliases: ['Ziagen'],
    category: 'pharmacological',
    mechanism: 'NRTI — guanosine analog, phosphorylated to carbovir-TP, a chain-terminator for HIV reverse transcriptase. HLA-B*5701 carriers (~5% of populations of European descent) develop life-threatening hypersensitivity → mandatory pre-treatment genotyping.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 600, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 286.33,
    refs: [],
  },
  {
    slug: 'doravirine',
    name: 'Doravirine',
    aliases: ['Pifeltro'],
    category: 'pharmacological',
    mechanism: 'Newer NNRTI with cleaner DDI profile (CYP3A4 substrate but minimal induction). Lower psychiatric side effect signal than efavirenz. Used in DOR/3TC/TDF (Delstrigo) once-daily regimen.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 100, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 15 },
    mw_g_mol: 425.74,
    refs: [],
  },

  // ── ANTI-SEIZURE EXPANSION ────────────────────────────────────────
  {
    slug: 'rufinamide',
    name: 'Rufinamide',
    aliases: ['Banzel'],
    category: 'pharmacological',
    mechanism: 'Triazole antiseizure — voltage-gated Na+ channel inactivation prolongation. Approved for Lennox-Gastaut syndrome adjunct. QT shortening signal at high doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 3200, typical: 1600, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 238.20,
    refs: [],
  },
  {
    slug: 'eslicarbazepine',
    name: 'Eslicarbazepine Acetate',
    aliases: ['Aptiom'],
    category: 'pharmacological',
    mechanism: 'Carbamazepine analog — voltage-gated Na+ channel slow inactivation enhancer. Active metabolite is the same S-licarbazepine fraction made by oxcarbazepine. Adjunct for partial-onset seizures.',
    routes: ['PO'],
    doses: { 'PO': { min: 400, max: 1600, typical: 800, unit: 'mg' } },
    half_life_hr: { 'PO': 22 },
    mw_g_mol: 296.32,
    refs: [],
  },

  // ── DIABETES EXPANSION ────────────────────────────────────────────
  {
    slug: 'alogliptin',
    name: 'Alogliptin',
    aliases: ['Nesina'],
    category: 'pharmacological',
    mechanism: 'DPP-4 inhibitor — same mechanism as sitagliptin, linagliptin, saxagliptin (raises endogenous GLP-1 + GIP). Renal dose adjustment needed. Heart failure signal in EXAMINE trial led to FDA boxed warning.',
    routes: ['PO'],
    doses: { 'PO': { min: 6.25, max: 25, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 21 },
    mw_g_mol: 339.39,
    refs: [],
  },
  {
    slug: 'repaglinide',
    name: 'Repaglinide',
    aliases: ['Prandin'],
    category: 'pharmacological',
    mechanism: 'Meglitinide — closes pancreatic β-cell K-ATP channels (same target as sulfonylureas, distinct binding site) → insulin release. Short half-life supports pre-prandial dosing for post-prandial glucose control. Hepatic CYP2C8 + CYP3A4 substrate.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.5, max: 16, typical: 1, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 452.59,
    refs: [],
  },
  {
    slug: 'nateglinide',
    name: 'Nateglinide',
    aliases: ['Starlix'],
    category: 'pharmacological',
    mechanism: 'Meglitinide — same K-ATP channel closure mechanism as repaglinide, faster onset. Pre-prandial dosing for post-prandial glucose. CYP2C9 + CYP3A4 substrate.',
    routes: ['PO'],
    doses: { 'PO': { min: 60, max: 360, typical: 120, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 317.43,
    refs: [],
  },

  // ── ANABOLIC STEROIDS / ANDROGENS ─────────────────────────────────
  {
    slug: 'methyltestosterone',
    name: 'Methyltestosterone',
    aliases: ['Methandren', 'Android'],
    category: 'hormone',
    mechanism: '17α-methylated oral testosterone — methyl group resists hepatic first-pass metabolism. Hepatotoxic at chronic use (cholestasis, hepatocellular adenoma, peliosis hepatis) → largely replaced by testosterone esters (IM) for hypogonadism. Schedule III.',
    routes: ['PO', 'SL'],
    doses: { 'PO': { min: 10, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 302.45,
    refs: [],
  },
  {
    slug: 'danazol',
    name: 'Danazol',
    aliases: ['Danocrine'],
    category: 'hormone',
    mechanism: '17α-ethinyl testosterone derivative — weak androgen + suppresses pituitary FSH/LH. Used for endometriosis, hereditary angioedema, fibrocystic breast disease. Hepatotoxic + virilization at higher doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 337.47,
    refs: [],
  },
  {
    slug: 'fluoxymesterone',
    name: 'Fluoxymesterone',
    aliases: ['Halotestin'],
    category: 'hormone',
    mechanism: '17α-methylated oral androgen with fluorine substitution → ~5× testosterone potency without aromatization. Hepatotoxic; banned in most sport. Schedule III. Cosmetic / strength community use persists despite better-tolerated alternatives.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 40, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 9 },
    mw_g_mol: 336.45,
    refs: [],
  },

  // ── ANTISEBORRHEIC / SCALP ────────────────────────────────────────
  {
    slug: 'selenium-sulfide',
    name: 'Selenium Sulfide',
    aliases: ['Selsun'],
    category: 'topical',
    mechanism: 'OTC antiseborrheic shampoo (1%) and Rx (2.5%). Antifungal against Malassezia furfur (the dandruff yeast); cytostatic to keratinocyte hyperproliferation. Sulfur-smell + temporary hair-color change with chronic use.',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: { 'TD': 24 },
    mw_g_mol: 143.04,
    refs: [],
  },
  {
    slug: 'zinc-pyrithione',
    name: 'Zinc Pyrithione',
    aliases: ['Head and Shoulders active'],
    category: 'topical',
    mechanism: 'OTC antiseborrheic shampoo active at 1–2%. Antifungal against Malassezia + cytostatic against keratinocyte hyperproliferation. EU restrictions emerging on environmental + safety grounds.',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'TD': 24 },
    mw_g_mol: 317.70,
    refs: [],
  },
  {
    slug: 'ketoconazole-shampoo',
    name: 'Ketoconazole Shampoo',
    aliases: ['Nizoral A-D'],
    category: 'topical',
    mechanism: 'Topical 2% (Rx) and 1% (OTC) ketoconazole shampoo for dandruff + seborrheic dermatitis. Same fungal CYP51 inhibition as oral ketoconazole but minimal systemic absorption from short scalp contact.',
    routes: ['TD'],
    doses: { 'TD': { min: 20, max: 50, typical: 30, unit: 'mg' } },
    half_life_hr: { 'TD': 12 },
    mw_g_mol: 531.43,
    refs: [],
  },

  // ── TOPICAL ANTIBIOTICS ───────────────────────────────────────────
  {
    slug: 'erythromycin-topical',
    name: 'Erythromycin (topical)',
    aliases: [],
    category: 'topical',
    mechanism: 'Topical 2% erythromycin gel/solution for inflammatory acne. Same 50S ribosomal blockade as oral erythromycin but local action minimizes systemic exposure. Bacterial resistance (Cutibacterium acnes) limits monotherapy → usually combined with benzoyl peroxide.',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 30, typical: 20, unit: 'mg' } },
    half_life_hr: { 'TD': 12 },
    mw_g_mol: 733.93,
    refs: [],
  },
  {
    slug: 'clindamycin-topical',
    name: 'Clindamycin (topical)',
    aliases: [],
    category: 'topical',
    mechanism: 'Topical 1% clindamycin gel/solution/foam for acne. Same 50S ribosomal blockade as oral. Less resistance development than topical erythromycin; standard combination with benzoyl peroxide (Duac, Acanya).',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 30, typical: 20, unit: 'mg' } },
    half_life_hr: { 'TD': 12 },
    mw_g_mol: 424.98,
    refs: [],
  },
  {
    slug: 'metronidazole-topical',
    name: 'Metronidazole (topical)',
    aliases: ['MetroGel'],
    category: 'topical',
    mechanism: 'Topical 0.75% / 1% gel for inflammatory rosacea. Reduces papules + pustules via anti-inflammatory + weak antibacterial effect. Largely supplanted by ivermectin + azelaic acid for more severe rosacea.',
    routes: ['TD'],
    doses: { 'TD': { min: 7.5, max: 30, typical: 15, unit: 'mg' } },
    half_life_hr: { 'TD': 12 },
    mw_g_mol: 171.16,
    refs: [],
  },

  // ── SPECIALTY Rx ──────────────────────────────────────────────────
  {
    slug: 'riluzole',
    name: 'Riluzole',
    aliases: ['Rilutek'],
    category: 'pharmacological',
    mechanism: 'Glutamate release inhibitor — blocks voltage-gated Na+ channels presynaptically + reduces glutamate-induced excitotoxicity. First FDA-approved drug for ALS; modest survival benefit (~3 months). CYP1A2 substrate.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 100, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 234.20,
    refs: [],
  },
  {
    slug: 'sodium-oxybate',
    name: 'Sodium Oxybate',
    aliases: ['Xyrem', 'GHB sodium'],
    category: 'pharmacological',
    mechanism: 'Sodium salt of γ-hydroxybutyrate (GHB) — GABA-B agonist + GHB-receptor agonist. Approved for narcolepsy with cataplexy. Schedule III when prescribed; the parent compound GHB is Schedule I as a date-rape drug.',
    routes: ['PO'],
    doses: { 'PO': { min: 4500, max: 9000, typical: 6000, unit: 'mg' } },
    half_life_hr: { 'PO': 0.5 },
    mw_g_mol: 126.09,
    refs: [],
  },
  {
    slug: 'dantrolene',
    name: 'Dantrolene',
    aliases: ['Dantrium'],
    category: 'pharmacological',
    mechanism: 'Skeletal muscle relaxant acting at the ryanodine receptor — inhibits sarcoplasmic Ca²⁺ release. First-line for malignant hyperthermia (rapid IV reversal); chronic oral use for spasticity in MS / spinal cord injury / cerebral palsy. Hepatotoxicity at chronic use.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 25, max: 400, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 15 },
    mw_g_mol: 314.26,
    refs: [],
  },
  {
    slug: 'dicyclomine',
    name: 'Dicyclomine',
    aliases: ['Bentyl'],
    category: 'pharmacological',
    mechanism: 'Antimuscarinic + direct GI smooth muscle relaxant — used for IBS-associated cramping pain. Anticholinergic burden — Beers-list problematic in elderly.',
    routes: ['PO', 'IM'],
    doses: { 'PO': { min: 10, max: 40, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 309.49,
    refs: [],
  },
  {
    slug: 'cinacalcet',
    name: 'Cinacalcet',
    aliases: ['Sensipar'],
    category: 'pharmacological',
    mechanism: 'Calcimimetic — positive allosteric modulator of the calcium-sensing receptor (CaSR) in parathyroid chief cells → decreased PTH secretion. Used for secondary hyperparathyroidism in CKD-on-dialysis + parathyroid carcinoma.',
    routes: ['PO'],
    doses: { 'PO': { min: 30, max: 180, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 35 },
    mw_g_mol: 357.42,
    refs: [],
  },
  {
    slug: 'eluxadoline',
    name: 'Eluxadoline',
    aliases: ['Viberzi'],
    category: 'pharmacological',
    mechanism: 'Mixed μ + κ-opioid agonist + δ-opioid antagonist — gut-locally-restricted (poor systemic absorption). Approved for IBS-D. Pancreatitis + sphincter-of-Oddi spasm risk → contraindicated post-cholecystectomy.',
    routes: ['PO'],
    doses: { 'PO': { min: 75, max: 100, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 569.65,
    refs: [],
  },
  {
    slug: 'etoricoxib',
    name: 'Etoricoxib',
    aliases: ['Arcoxia'],
    category: 'pharmacological',
    mechanism: 'Selective COX-2 inhibitor — same class as celecoxib with greater COX-2 selectivity. Approved in EU + many countries (not FDA-approved due to CV concerns). Hypertension + MI signal at chronic high doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 30, max: 120, typical: 60, unit: 'mg' } },
    half_life_hr: { 'PO': 22 },
    mw_g_mol: 358.84,
    refs: [],
  },

  // ── DENTAL LOCAL ANESTHETICS ──────────────────────────────────────
  {
    slug: 'articaine',
    name: 'Articaine',
    aliases: ['Septocaine', 'Carticaine'],
    category: 'pharmacological',
    mechanism: 'Amide local anesthetic with thiophene ring + ester side group → rapid plasma esterase hydrolysis (lower systemic toxicity). Most-used dental local anesthetic in Europe + increasingly North America. Better diffusion through bone for mandibular blocks.',
    routes: ['IM', 'SC'],
    doses: { 'IM': { min: 40, max: 200, typical: 80, unit: 'mg' } },
    half_life_hr: { 'IM': 0.5 },
    mw_g_mol: 284.38,
    refs: [],
  },
  {
    slug: 'mepivacaine',
    name: 'Mepivacaine',
    aliases: ['Carbocaine', 'Polocaine'],
    category: 'pharmacological',
    mechanism: 'Amide local anesthetic — Na+ channel blocker. Less vasodilation than lidocaine → less added epinephrine needed for dental + minor surgical procedures. Used pediatric and cardiovascular patients where epinephrine should be avoided.',
    routes: ['IM', 'SC'],
    doses: { 'IM': { min: 50, max: 400, typical: 100, unit: 'mg' } },
    half_life_hr: { 'IM': 2 },
    mw_g_mol: 246.35,
    refs: [],
  },

  // ── HERBS / BOTANICALS ────────────────────────────────────────────
  {
    slug: 'yerba-mate',
    name: 'Yerba Mate',
    aliases: ['Ilex paraguariensis'],
    category: 'adaptogen',
    mechanism: 'Caffeine-rich (~80 mg/cup) South American tea + theobromine + theophylline + chlorogenic acids. Distinct from coffee in higher chlorogenic acid + lower caffeine; subjective stimulation reportedly less jittery. Carcinogenic association with esophageal cancer in very-hot consumption.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 5000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    refs: [],
  },
  {
    slug: 'nettle',
    name: 'Stinging Nettle',
    aliases: ['Urtica dioica'],
    category: 'adaptogen',
    mechanism: 'Leaf + root extracts with distinct uses — leaf for allergic rhinitis (modest mast cell stabilization), root for BPH (5α-reductase inhibition + SHBG modulation). Allergy benefit: small RCT signal at 600 mg/d.',
    routes: ['PO'],
    doses: { 'PO': { min: 250, max: 1200, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'dandelion',
    name: 'Dandelion',
    aliases: ['Taraxacum officinale'],
    category: 'adaptogen',
    mechanism: 'Root + leaf extracts — high inulin (prebiotic), mild diuretic via potassium, traditional bitter for digestion. Limited rigorous evidence; meta-analysis signals on mild diuresis + glucose / lipid effects.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 4000, typical: 1500, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'raspberry-leaf',
    name: 'Raspberry Leaf',
    aliases: ['Rubus idaeus leaf'],
    category: 'adaptogen',
    mechanism: 'Traditional uterine-tonic herb in pregnancy — fragarine + tannins claimed to tone uterine smooth muscle. RCT evidence weak; midwife-traditional use for last-trimester labor preparation. Generally regarded as safe in pregnancy at typical tea doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 3000, typical: 1500, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'milk-thistle',
    name: 'Milk Thistle',
    aliases: ['Silybum marianum'],
    category: 'adaptogen',
    mechanism: 'Seed extract standardized to ~70-80% silymarin (a flavonolignan mix). Hepatoprotective — concentrates in hepatocytes; antioxidant + membrane-stabilizing. Trialed for chronic hepatitis C, NAFLD, alcohol-related liver disease with modest effect signals.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 800, typical: 420, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    refs: [],
  },
  {
    slug: 'milk-thistle-silibinin',
    name: 'Silibinin',
    aliases: ['Major silymarin component'],
    category: 'flavonoid',
    mechanism: 'Silymarin\'s primary active flavonolignan (~50–70% of the silymarin mix). Hepatoprotective antioxidant; IV silibinin is the antidote of choice for Amanita phalloides mushroom poisoning. Inhibits hepatic uptake of α-amanitin.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 100, max: 700, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 482.44,
    refs: [],
  },

  // ── COSMETIC PEPTIDES / RESEARCH ──────────────────────────────────
  {
    slug: 'snap-29',
    name: 'SNAP-29',
    aliases: ['Vialox'],
    category: 'peptide',
    mechanism: 'Cosmetic peptide — competitive nicotinic ACh receptor antagonist on facial muscle motor endplates. Same "Botox-in-a-jar" class as argireline; even more reduction-of-expression-line claim with sparse rigorous evidence.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.5, max: 5, typical: 2, unit: 'mg' } },
    half_life_hr: { 'TD': 6 },
    refs: [],
  },
  {
    slug: 'copper-tripeptide-1',
    name: 'Copper Tripeptide-1',
    aliases: ['GHK-Cu', 'Prezatide copper'],
    category: 'peptide',
    mechanism: 'Glycyl-histidyl-lysine + Cu²⁺ chelate — wound healing + anti-aging cosmetic peptide. Stimulates dermal fibroblast collagen + glycosaminoglycan synthesis; reduces TGF-β-driven scarring. Also as injectable in some research-chem markets for hair growth.',
    routes: ['TD', 'SC'],
    doses: { 'TD': { min: 0.5, max: 10, typical: 2, unit: 'mg' } },
    half_life_hr: { 'TD': 8 },
    mw_g_mol: 403.92,
    refs: [],
  },

  // ── RESEARCH NOOTROPICS ───────────────────────────────────────────
  {
    slug: 'fasoracetam',
    name: 'Fasoracetam',
    aliases: [],
    category: 'nootropic',
    mechanism: 'Pyrrolidone (racetam) — upregulates GABA-B and metabotropic glutamate receptors. Was in Phase 3 trial for ADHD with mGluR mutations (failed); biohacker community use persists for anxiety + cognition.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 50, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 196.25,
    refs: [],
  },
  {
    slug: 'idra-21',
    name: 'IDRA-21',
    aliases: [],
    category: 'nootropic',
    mechanism: 'Benzothiadiazide ampakine — positive allosteric modulator at AMPA glutamate receptor; reduces receptor desensitization. Animal cognition + memory enhancement. No human RCTs; sold via research-chem channels.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 50, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 246.31,
    refs: [],
  },
  {
    slug: '9-me-bc',
    name: '9-Me-BC',
    aliases: ['9-Methyl-β-carboline'],
    category: 'alkaloid',
    mechanism: 'β-Carboline derivative — putative dopaminergic + neurotrophic effects in rat models, including reported neurogenic + dopamine-neuron-protective effects. Limited human pharmacology; nootropic biohacker interest.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 40, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 182.22,
    refs: [],
  },

  // ── RESEARCH / LONGEVITY COMPOUNDS ────────────────────────────────
  {
    slug: 'glynac',
    name: 'GlyNAC',
    aliases: ['Glycine + N-acetylcysteine'],
    category: 'amino-acid',
    mechanism: 'Combination of glycine + N-acetylcysteine that raises tissue glutathione synthesis substrate availability. Rajagopal et al. 2022 trial showed ~3 μM rise in cellular glutathione + improvements in oxidative stress + insulin resistance markers in older adults.',
    routes: ['PO'],
    doses: { 'PO': { min: 1500, max: 3000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    refs: [],
  },
  {
    slug: 'urolithin-b',
    name: 'Urolithin B',
    aliases: [],
    category: 'polyphenol',
    mechanism: 'Gut-bacteria-produced metabolite of ellagitannins (pomegranate, walnuts). Less mitophagy-active than urolithin A but reported myotrophic effects (muscle protein synthesis support). Production depends on individual gut microbiome composition.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 500, typical: 250, unit: 'mg' } },
    half_life_hr: { 'PO': 30 },
    mw_g_mol: 228.20,
    refs: [],
  },
  {
    slug: 'taxifolin',
    name: 'Taxifolin',
    aliases: ['Dihydroquercetin', 'DHQ'],
    category: 'flavonoid',
    mechanism: 'Dihydroflavonol (reduced quercetin) found in onions + Siberian larch. Antioxidant + endothelial supporter; trialed for cognitive + cardiovascular endpoints with modest effect sizes. Sold as a generic flavonoid supplement.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 1000, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 304.25,
    refs: [],
  },

  // ── MORE Rx ───────────────────────────────────────────────────────
  {
    slug: 'baricitinib',
    name: 'Baricitinib',
    aliases: ['Olumiant'],
    category: 'pharmacological',
    mechanism: 'JAK1/JAK2 inhibitor — blocks cytokine receptor signaling. Approved for rheumatoid arthritis, atopic dermatitis, alopecia areata, and adjunct in COVID-19 hospitalization. Class effects: infections, MI, malignancy, thrombosis.',
    routes: ['PO'],
    doses: { 'PO': { min: 1, max: 4, typical: 2, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 371.42,
    refs: [],
  },
  {
    slug: 'tofacitinib',
    name: 'Tofacitinib',
    aliases: ['Xeljanz'],
    category: 'pharmacological',
    mechanism: 'JAK1/JAK3 inhibitor — same class effect as baricitinib. Approved for RA, psoriatic arthritis, ulcerative colitis. ORAL Surveillance trial showed worse CV + malignancy signal vs TNFi → boxed warning.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 22, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 312.37,
    refs: [],
  },
  {
    slug: 'apremilast',
    name: 'Apremilast',
    aliases: ['Otezla'],
    category: 'pharmacological',
    mechanism: 'PDE4 inhibitor — raises cellular cAMP → reduced inflammatory cytokine release. Oral approval for psoriasis + psoriatic arthritis + Behçet syndrome. Modest efficacy + cleaner side-effect profile (no infection / malignancy risk) than biologics.',
    routes: ['PO'],
    doses: { 'PO': { min: 10, max: 30, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 460.50,
    refs: [],
  },
  {
    slug: 'roflumilast',
    name: 'Roflumilast',
    aliases: ['Daliresp'],
    category: 'pharmacological',
    mechanism: 'Selective PDE4 inhibitor — anti-inflammatory effect on bronchial inflammation. Oral approval for severe COPD with chronic bronchitis. Weight loss + GI / psychiatric side effects limit use.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.25, max: 0.5, typical: 0.5, unit: 'mg' } },
    half_life_hr: { 'PO': 17 },
    mw_g_mol: 403.21,
    refs: [],
  },
  {
    slug: 'colchicine-low-dose-cv',
    name: 'Colchicine (low-dose CV)',
    aliases: ['Lodoco'],
    category: 'alkaloid',
    mechanism: 'Microtubule + NLRP3 inhibitor at 0.5 mg/d for cardiovascular event prevention. LoDoCo2 + COLCOT trials showed ~30% MACE reduction in stable CAD patients on top of statins. Distinct indication from acute gout dosing.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.5, max: 0.5, typical: 0.5, unit: 'mg' } },
    half_life_hr: { 'PO': 31 },
    mw_g_mol: 399.44,
    refs: [],
  },

  // ── CARNITINE VARIANTS / SPORTS NUTRITION ─────────────────────────
  {
    slug: 'l-carnitine-l-tartrate',
    name: 'L-Carnitine L-Tartrate',
    aliases: ['LCLT'],
    category: 'amino-acid',
    mechanism: 'Salt of L-carnitine with L-tartaric acid — improved oral absorption + handling vs free L-carnitine. Sports supplementation for fatty acid β-oxidation + muscle recovery. Modest evidence for reduced exercise-induced muscle damage.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 4000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 311.33,
    refs: [],
  },

  // ── SOLUBILITY VARIANTS / OTHER ──────────────────────────────────
  {
    slug: 'lithium-orotate',
    name: 'Lithium Orotate',
    aliases: ['Low-dose lithium'],
    category: 'mineral',
    mechanism: 'Salt of lithium with orotic acid — supplement-strength (~5 mg elemental Li per 130 mg orotate). Marketed for mood support + neuroprotection at doses far below psychiatric (300+ mg lithium carbonate ≈ 60 mg elemental). Trace-dose biohacker use; clinical evidence at supplement dose is thin.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 20, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 161.04,
    refs: [],
  },

  // ── More research peptides ────────────────────────────────────────
  {
    slug: 'epitalon',
    name: 'Epitalon',
    aliases: ['Epithalon', 'Ala-Glu-Asp-Gly'],
    category: 'peptide',
    mechanism: 'Tetrapeptide claimed to upregulate telomerase + extend telomeres — Khavinson group human trials report (with limited rigor) lifespan + age-marker benefits. Sold via research-chem channels for SC/IN injection. Mechanism evidence in humans thin.',
    routes: ['SC', 'IN'],
    doses: { 'SC': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'SC': 1 },
    refs: [],
  },
  {
    slug: 'vilon',
    name: 'Vilon',
    aliases: ['Lys-Glu', 'KE peptide'],
    category: 'peptide',
    mechanism: 'Lys-Glu dipeptide marketed by Khavinson group as immunomodulator — claimed thymic + gonadal axis support. Thin clinical evidence outside Russian-language journals; biohacker / longevity-community use.',
    routes: ['SC', 'IN'],
    doses: { 'SC': { min: 1, max: 10, typical: 5, unit: 'mg' } },
    half_life_hr: { 'SC': 1 },
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

  console.log('\nWave 0b sub-batch 11 — the 1000 push:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
