/**
 * 2026-05-11-wave-5a-pathway-batch-1.ts — 12 hand-authored pathways (v1.2).
 *
 * Picks up from the v1.2 scaffolding commit (2c3ad49) that landed 3
 * initial pathways. This batch adds 12 more across the biosynthesis /
 * catabolism / drug_metabolism / signaling / endocrine_axis axes,
 * focusing on pathways with the highest clinical-pharmacology surface:
 *
 *   1. cholesterol_synthesis     (HMG-CoA reductase — statin target)
 *   2. bile_acid_synthesis       (CYP7A1; FXR pharmacology)
 *   3. vitamin_k_cycle           (VKORC1 — warfarin target)
 *   4. warfarin_metabolism       (S- vs R- enantiomer-resolved)
 *   5. ketone_body_synthesis     (HMG-CoA synthase 2 — ketogenic diet)
 *   6. urea_cycle                (carbamoyl phosphate → urea)
 *   7. purine_catabolism         (xanthine oxidase — allopurinol target)
 *   8. arachidonic_acid_cascade  (COX/LOX — NSAID + leukotriene Rx)
 *   9. ethanol_metabolism        (ADH + ALDH — disulfiram + Asian flush)
 *  10. raas_axis                 (ACE / AT1 / aldosterone — ACEi/ARB/MRA)
 *  11. mtor_signaling            (rapamycin / everolimus / temsirolimus)
 *  12. nicotine_metabolism       (CYP2A6 — smoking cessation pharmacology)
 *
 * Authoring discipline mirrors compounds.json:
 *  - PMIDs cited only when previously verified (already in compounds.json
 *    refs[]) or trivially verifiable textbook-vintage discoveries
 *  - Step from/to compound slugs reference the existing registry where
 *    possible; biochem intermediates that aren't dosable drugs (HMG-CoA,
 *    mevalonate, acetyl-CoA, etc.) appear as off-registry tokens —
 *    data-lint surfaces them as warnings, not errors, per the schema
 *  - Pathway slug naming follows snake_case with underscores (already
 *    established at v0.6 via the receptor_occupancy.pathway tags like
 *    "beta1_blockade", "neuromuscular_blockade")
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface PathwayModulator { slug: string; effect: 'inhibitor' | 'activator' | 'substrate' | 'cofactor'; target?: string; note?: string }
interface Pathway {
  slug: string;
  name: string;
  category: 'biosynthesis' | 'catabolism' | 'drug_metabolism' | 'signaling' | 'transport' | 'membrane' | 'endocrine_axis';
  systems: string[];
  description: string;
  steps: PathwayStep[];
  modulators?: PathwayModulator[];
  refs?: string[];
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'cholesterol_synthesis',
    name: 'Cholesterol synthesis (HMG-CoA pathway)',
    category: 'biosynthesis',
    systems: ['cardiovascular', 'digestive', 'endocrine'],
    description: 'De novo cholesterol biosynthesis — ~30 enzymatic steps from acetyl-CoA via the mevalonate pathway. HMG-CoA reductase (HMGCR) is rate-limiting and is the statin target. Diurnal regulation peaks at night, which is why short-half-life statins (simvastatin, fluvastatin) are dosed at bedtime. Sterol-regulatory binding (SREBP-2) downregulates HMGCR when intracellular cholesterol rises — the homeostatic loop statins exploit (cells respond to drug-lowered cholesterol by upregulating LDL-R, which is the actual therapeutic mechanism).',
    steps: [
      { from: 'acetyl-coa', to: 'hmg-coa', via: 'HMG-CoA synthase' },
      { from: 'hmg-coa', to: 'mevalonate', via: 'HMG-CoA reductase (HMGCR) — rate-limiting; SREBP-2 regulated; STATIN TARGET' },
      { from: 'mevalonate', to: 'squalene', via: 'multi-step mevalonate pathway (kinase + decarboxylase + farnesyl-PP synthase + squalene synthase)' },
      { from: 'squalene', to: 'cholesterol', via: 'squalene epoxidase → lanosterol → cholesterol (multi-step)' },
    ],
    modulators: [
      { slug: 'atorvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'Highest LDL-lowering at standard doses (40-80 mg).' },
      { slug: 'rosuvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'Most potent statin per mg.' },
      { slug: 'simvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase' },
      { slug: 'pravastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'Hydrophilic; minimal CYP3A4 metabolism — preferred with strong CYP3A4 inhibitors.' },
      { slug: 'pitavastatin', effect: 'inhibitor', target: 'HMG-CoA reductase' },
      { slug: 'fluvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase' },
      { slug: 'lovastatin', effect: 'inhibitor', target: 'HMG-CoA reductase' },
      { slug: 'cerivastatin', effect: 'inhibitor', target: 'HMG-CoA reductase', note: 'Withdrawn 2001 after fatal rhabdomyolysis when combined with gemfibrozil.' },
    ],
    refs: [],
  },
  {
    slug: 'bile_acid_synthesis',
    name: 'Bile acid synthesis (classic + alternative pathways)',
    category: 'biosynthesis',
    systems: ['digestive', 'endocrine'],
    description: 'Hepatic conversion of cholesterol to primary bile acids (cholic acid + chenodeoxycholic acid). Classic pathway: cholesterol → 7α-hydroxycholesterol via CYP7A1 (rate-limiting, FXR-regulated). Alternative pathway: cholesterol → 27-OH-cholesterol via CYP27A1 (relevant in extrahepatic tissues). Primary bile acids conjugate with glycine or taurine before biliary secretion. In the intestine, bacterial 7α-dehydroxylase converts primary bile acids to secondary (deoxycholic + lithocholic acid). FXR feedback closes the loop: enterohepatic bile acid return → ileal FGF19 → hepatic FXR → CYP7A1 suppression.',
    steps: [
      { from: 'cholesterol', to: '7alpha-hydroxycholesterol', via: 'CYP7A1 — rate-limiting; FXR-regulated' },
      { from: '7alpha-hydroxycholesterol', to: 'cholic-acid', via: 'multi-step (12α-hydroxylation via CYP8B1 + side-chain oxidation via CYP27A1)' },
      { from: '7alpha-hydroxycholesterol', to: 'chenodeoxycholic-acid', via: 'side-chain oxidation via CYP27A1 (skips CYP8B1)' },
    ],
    modulators: [],
    refs: [],
  },
  {
    slug: 'vitamin_k_cycle',
    name: 'Vitamin K cycle (γ-carboxylation)',
    category: 'biosynthesis',
    systems: ['cardiovascular', 'immune-hematologic'],
    description: 'Catalytic cycle that regenerates active vitamin K hydroquinone (KH2) after each γ-carboxylation event. γ-Carboxylase uses KH2 + O2 + CO2 to add a γ-carboxyl group to glutamate residues on vitamin-K-dependent proteins (factors II, VII, IX, X + proteins C, S, Z; also osteocalcin and MGP). KH2 is oxidized to vitamin K epoxide in the reaction. VKORC1 reduces the epoxide back to vitamin K, completing the cycle. WARFARIN inhibits VKORC1 → epoxide accumulates → KH2 depletes → γ-carboxylation halts → undercarboxylated coagulation factors are functionally inactive.',
    steps: [
      { from: 'phylloquinone', to: 'vitamin-k-hydroquinone', via: 'vitamin K reductase' },
      { from: 'vitamin-k-hydroquinone', to: 'vitamin-k-epoxide', via: 'γ-carboxylase (consumes O2 + CO2; carboxylates Glu → Gla on factors II/VII/IX/X)' },
      { from: 'vitamin-k-epoxide', to: 'phylloquinone', via: 'VKORC1 — WARFARIN TARGET' },
    ],
    modulators: [
      { slug: 'warfarin', effect: 'inhibitor', target: 'VKORC1', note: 'Both R- and S-enantiomers inhibit VKORC1; S-warfarin is 2.7-3.8× more potent than R.' },
      { slug: 'phylloquinone', effect: 'substrate', target: 'γ-carboxylation cofactor', note: 'Vitamin K1 — dietary reversal of warfarin overdose.' },
    ],
    refs: [],
  },
  {
    slug: 'warfarin_metabolism',
    name: 'Warfarin metabolism (enantiomer-resolved)',
    category: 'drug_metabolism',
    systems: ['cardiovascular', 'immune-hematologic'],
    description: 'Warfarin is a 1:1 racemate; the enantiomers clear via different CYPs. S-warfarin (3-5× more potent at VKORC1) is metabolized primarily by CYP2C9 to 7-hydroxywarfarin — this is why CYP2C9 inhibitors (fluconazole, amiodarone) raise INR more than expected for a "weak inhibition" of total warfarin. R-warfarin (less active) is metabolized by CYP1A2 and CYP3A4. The asymmetry explains why DDIs with R- vs S-selective perpetrators produce qualitatively different INR effects.',
    steps: [
      { from: 'warfarin', to: '7-hydroxywarfarin', via: 'CYP2C9 — S-warfarin (primary path for active enantiomer)' },
      { from: 'warfarin', to: '6-hydroxywarfarin', via: 'CYP1A2 + CYP3A4 — R-warfarin (less-active enantiomer)' },
    ],
    modulators: [
      { slug: 'fluconazole', effect: 'inhibitor', target: 'CYP2C9 (S-warfarin path)', note: 'INR rises markedly because S-warfarin is the active enantiomer.' },
      { slug: 'amiodarone', effect: 'inhibitor', target: 'CYP2C9 (S-warfarin path)' },
      { slug: 'rifampin', effect: 'activator', target: 'CYP1A2/2C9/3A4 induction', note: 'Net effect: INR falls; warfarin dose typically needs ~2× increase during rifampin.' },
      { slug: 'cimetidine', effect: 'inhibitor', target: 'CYP2C9 (mild)', note: 'Modest INR rise from Kirch 1984 (PMID:6096071); CL ratio 1.55×.' },
    ],
    refs: [],
  },
  {
    slug: 'ketone_body_synthesis',
    name: 'Ketone body synthesis (ketogenesis)',
    category: 'biosynthesis',
    systems: ['endocrine', 'digestive'],
    description: 'Hepatic mitochondrial conversion of acetyl-CoA into ketone bodies during prolonged fasting, ketogenic diet, or insulin deficiency. Acetyl-CoA from accelerated β-oxidation condenses to acetoacetyl-CoA → HMG-CoA (via mitochondrial HMG-CoA synthase 2, the rate-limiting enzyme — distinct from the cytosolic HMGCS1 of cholesterol synthesis) → acetoacetate → β-hydroxybutyrate (the dominant circulating ketone, reduced by BDH1) or → acetone (spontaneous decarboxylation; responsible for the fruity breath of DKA). Extrahepatic tissues reverse the steps to regenerate acetyl-CoA for fuel.',
    steps: [
      { from: 'acetyl-coa', to: 'acetoacetyl-coa', via: 'thiolase' },
      { from: 'acetoacetyl-coa', to: 'hmg-coa', via: 'HMG-CoA synthase 2 (mitochondrial; HMGCS2 — RATE-LIMITING)' },
      { from: 'hmg-coa', to: 'acetoacetate', via: 'HMG-CoA lyase' },
      { from: 'acetoacetate', to: 'beta-hydroxybutyrate', via: 'BDH1 — interconvertible; β-HB is the dominant circulating ketone' },
      { from: 'acetoacetate', to: 'acetone', via: 'spontaneous decarboxylation (no enzyme)' },
    ],
    modulators: [
      { slug: 'beta-hydroxybutyrate', effect: 'substrate', target: 'endpoint', note: 'Exogenous BHB salts/esters bypass hepatic ketogenesis.' },
    ],
    refs: [],
  },
  {
    slug: 'urea_cycle',
    name: 'Urea cycle (ammonia disposal)',
    category: 'biosynthesis',
    systems: ['digestive', 'renal'],
    description: 'Hepatic mitochondrial → cytosolic cycle converting two molecules of toxic NH3 into one neutral urea. Mitochondrial: NH3 + CO2 → carbamoyl phosphate (CPS1, rate-limiting, N-acetylglutamate-activated) → citrulline (OTC). Cytosolic: citrulline + aspartate → argininosuccinate (ASS1) → arginine + fumarate (ASL) → urea + ornithine (arginase). Ornithine re-enters mitochondria. Genetic defects in OTC (X-linked) and CPS1 are the most common urea-cycle disorders — present as hyperammonemic encephalopathy.',
    steps: [
      { from: 'ammonia', to: 'carbamoyl-phosphate', via: 'CPS1 — rate-limiting; mitochondrial; NAG-activated' },
      { from: 'carbamoyl-phosphate', to: 'citrulline', via: 'OTC (ornithine transcarbamylase) — X-linked deficiency is most common UCD' },
      { from: 'citrulline', to: 'argininosuccinate', via: 'argininosuccinate synthase (ASS1)' },
      { from: 'argininosuccinate', to: 'l-arginine', via: 'argininosuccinate lyase (ASL); also releases fumarate to TCA' },
      { from: 'l-arginine', to: 'urea', via: 'arginase — also regenerates ornithine' },
    ],
    modulators: [],
    refs: [],
  },
  {
    slug: 'purine_catabolism',
    name: 'Purine catabolism (uric acid formation)',
    category: 'catabolism',
    systems: ['renal', 'musculoskeletal'],
    description: 'Terminal degradation of purine nucleotides (AMP, GMP) to uric acid. Hypoxanthine and guanine flow through xanthine on the way to uric acid via xanthine oxidase (XO) — the target of allopurinol + febuxostat for gout. Humans lack uricase (lost in primate evolution), so uric acid is the endpoint; in most other mammals uricase converts it to allantoin (the basis for pegloticase therapy in refractory gout — uricase enzyme replacement). Renal tubular reabsorption via URAT1 controls plasma urate setpoint — uricosurics (probenecid, lesinurad) inhibit URAT1.',
    steps: [
      { from: 'hypoxanthine', to: 'xanthine', via: 'xanthine oxidase (XO) — ALLOPURINOL TARGET' },
      { from: 'xanthine', to: 'uric-acid', via: 'xanthine oxidase (XO) — same enzyme, second step' },
    ],
    modulators: [
      { slug: 'allopurinol', effect: 'inhibitor', target: 'xanthine oxidase', note: 'Hypoxanthine analog; xanthine oxidase converts it to oxypurinol (active metabolite) which then inhibits the enzyme — suicide-inhibitor logic.' },
      { slug: 'febuxostat', effect: 'inhibitor', target: 'xanthine oxidase', note: 'Non-purine XO inhibitor; reserved for allopurinol intolerance (FDA boxed warning for CV mortality 2019).' },
    ],
    refs: [],
  },
  {
    slug: 'arachidonic_acid_cascade',
    name: 'Arachidonic acid cascade (eicosanoid synthesis)',
    category: 'biosynthesis',
    systems: ['cardiovascular', 'immune-hematologic', 'reproductive'],
    description: 'Phospholipase A2 (PLA2) liberates arachidonic acid from membrane phospholipids on inflammatory or hormonal cue. AA flows through two main enzymatic branches: cyclooxygenase (COX-1 constitutive + COX-2 inducible) → prostaglandin H2 → tissue-specific prostaglandins (PGE2 pain/fever, PGI2 vasodilator, TXA2 platelet aggregation) — NSAID + coxib target. Lipoxygenase (5-LOX) → leukotriene A4 → LTB4 (chemotaxis), LTC4/D4/E4 (cysteinyl leukotrienes — asthma + allergic rhinitis) — montelukast / zileuton target. Glucocorticoids inhibit PLA2 (via lipocortin/annexin-1 induction), blocking the entire cascade upstream.',
    steps: [
      { from: 'arachidonic-acid', to: 'prostaglandin-h2', via: 'COX-1 / COX-2 — NSAID + COXIB TARGET' },
      { from: 'prostaglandin-h2', to: 'prostaglandin-e2', via: 'PGE synthase (mPGES-1 inducible)' },
      { from: 'prostaglandin-h2', to: 'thromboxane-a2', via: 'thromboxane synthase (platelet-restricted)' },
      { from: 'prostaglandin-h2', to: 'prostacyclin', via: 'prostacyclin synthase (endothelial)' },
      { from: 'arachidonic-acid', to: 'leukotriene-a4', via: '5-lipoxygenase (5-LOX) + FLAP — ZILEUTON TARGET' },
      { from: 'leukotriene-a4', to: 'leukotriene-b4', via: 'LTA4 hydrolase (neutrophil chemotaxis)' },
      { from: 'leukotriene-a4', to: 'cysteinyl-leukotrienes', via: 'LTC4 synthase → LTC4 → LTD4 → LTE4 — MONTELUKAST blocks CysLT1 receptor' },
    ],
    modulators: [
      { slug: 'aspirin', effect: 'inhibitor', target: 'COX-1 (irreversible acetylation) + COX-2' },
      { slug: 'ibuprofen', effect: 'inhibitor', target: 'COX-1 + COX-2 (reversible)' },
      { slug: 'celecoxib', effect: 'inhibitor', target: 'COX-2 selective' },
      { slug: 'naproxen', effect: 'inhibitor', target: 'COX-1 + COX-2' },
      { slug: 'montelukast', effect: 'inhibitor', target: 'CysLT1 receptor (downstream of LTC4/D4/E4)' },
      { slug: 'prednisone', effect: 'inhibitor', target: 'PLA2 (upstream — blocks entire cascade)' },
      { slug: 'dexamethasone', effect: 'inhibitor', target: 'PLA2 (upstream)' },
    ],
    refs: [],
  },
  {
    slug: 'ethanol_metabolism',
    name: 'Ethanol metabolism (ADH + ALDH axis)',
    category: 'drug_metabolism',
    systems: ['digestive', 'nervous'],
    description: 'Ethanol oxidizes to acetaldehyde via alcohol dehydrogenase (ADH; cytosolic, gastric + hepatic) and then to acetate via aldehyde dehydrogenase (ALDH2; mitochondrial). Acetaldehyde is the toxic intermediate responsible for hangover symptoms + carcinogenicity. ALDH2*2 polymorphism (Glu487Lys) is common in East Asian populations (~30-50%) and produces dramatically reduced ALDH2 activity — the basis for "Asian flush" with even small ethanol doses. DISULFIRAM inhibits ALDH2 pharmacologically, producing the same accumulation of acetaldehyde — used as aversion therapy for alcohol-use disorder. Metronidazole + cefoperazone + certain other antibiotics produce a similar disulfiram-like reaction.',
    steps: [
      { from: 'ethanol', to: 'acetaldehyde', via: 'alcohol dehydrogenase (ADH; cytosolic; multiple isoforms ADH1-5)' },
      { from: 'acetaldehyde', to: 'acetate', via: 'aldehyde dehydrogenase 2 (ALDH2; mitochondrial) — DISULFIRAM TARGET' },
    ],
    modulators: [
      { slug: 'ethanol', effect: 'substrate', target: 'ADH step', note: 'Also undergoes MM elimination (authored at v1.0): Vmax 230 mg/L/h, Km 80 mg/L (Holford 1987 PMID:3319346).' },
    ],
    refs: [],
  },
  {
    slug: 'raas_axis',
    name: 'Renin-angiotensin-aldosterone axis',
    category: 'endocrine_axis',
    systems: ['cardiovascular', 'renal', 'endocrine'],
    description: 'Major blood-pressure + volume homeostasis loop. Renin (from JG cells) cleaves liver-derived angiotensinogen to angiotensin I (decapeptide, inactive). ACE (pulmonary endothelium) cleaves AT-I to angiotensin II (octapeptide, potent vasoconstrictor + aldosterone secretagogue). AT-II → AT1 receptor (vasculature, adrenal cortex) → systemic vasoconstriction + aldosterone release. Aldosterone acts on the distal tubule + collecting duct via MR to increase Na+/H2O reabsorption + K+/H+ excretion. ACEi block ACE; ARBs block AT1; MRAs (spironolactone, eplerenone) block aldosterone receptor; direct renin inhibitors (aliskiren) block the first step.',
    steps: [
      { from: 'angiotensinogen', to: 'angiotensin-i', via: 'renin (JG cells) — first-step rate-limiting; ALISKIREN TARGET' },
      { from: 'angiotensin-i', to: 'angiotensin-ii', via: 'ACE (angiotensin-converting enzyme, pulmonary endothelium) — ACEi TARGET' },
      { from: 'angiotensin-ii', to: 'aldosterone', via: 'AT1 receptor on adrenal zona glomerulosa — ARB TARGET (upstream)' },
    ],
    modulators: [
      { slug: 'lisinopril', effect: 'inhibitor', target: 'ACE' },
      { slug: 'ramipril', effect: 'inhibitor', target: 'ACE' },
      { slug: 'enalapril', effect: 'inhibitor', target: 'ACE' },
      { slug: 'losartan', effect: 'inhibitor', target: 'AT1 receptor (also weak XO inhibitor)' },
      { slug: 'valsartan', effect: 'inhibitor', target: 'AT1 receptor' },
      { slug: 'telmisartan', effect: 'inhibitor', target: 'AT1 receptor (longest t½ ARB; partial PPAR-γ agonist)' },
      { slug: 'spironolactone', effect: 'inhibitor', target: 'mineralocorticoid receptor (also AR + progesterone receptor — gynecomastia)' },
      { slug: 'eplerenone', effect: 'inhibitor', target: 'mineralocorticoid receptor (more selective than spironolactone)' },
    ],
    refs: [],
  },
  {
    slug: 'mtor_signaling',
    name: 'mTOR signaling (mTORC1 + mTORC2)',
    category: 'signaling',
    systems: ['endocrine', 'immune-hematologic', 'musculoskeletal'],
    description: 'Master regulator of cellular growth, autophagy, and protein synthesis. mTORC1 (raptor-containing) responds to amino acids (especially leucine via Sestrin/GATOR), energy status (AMPK), and growth factors (IGF-1/insulin → PI3K → AKT → TSC1/2 → Rheb → mTORC1) — outputs include S6K1 (translation) and 4E-BP1 (cap-dependent translation initiation). mTORC2 (rictor-containing) phosphorylates AKT itself, closing a positive loop. RAPAMYCIN (and analogs sirolimus / everolimus / temsirolimus) form a complex with FKBP12 that selectively inhibits mTORC1 — the basis for their use in transplant immunosuppression + oncology (RCC, NET, TSC-associated SEGA).',
    steps: [
      { from: 'igf-1', to: 'pi3k-activation', via: 'IGF-1R → PI3K (also activated by insulin / insulin-R)' },
      { from: 'pi3k-activation', to: 'akt-activation', via: 'PI3K → PIP3 → PDK1 → AKT phosphorylation' },
      { from: 'akt-activation', to: 'mtorc1-activation', via: 'AKT → TSC1/2 inhibition → Rheb-GTP → mTORC1 activation' },
      { from: 'mtorc1-activation', to: 'protein-synthesis', via: 'S6K1 + 4E-BP1 phosphorylation → cap-dependent translation' },
    ],
    modulators: [
      { slug: 'rapamycin', effect: 'inhibitor', target: 'mTORC1 (via FKBP12 complex)' },
      { slug: 'everolimus', effect: 'inhibitor', target: 'mTORC1 (FKBP12-bound rapamycin analog)' },
      { slug: 'temsirolimus', effect: 'inhibitor', target: 'mTORC1 (sirolimus prodrug, IV weekly for RCC)' },
    ],
    refs: [],
  },
  {
    slug: 'nicotine_metabolism',
    name: 'Nicotine metabolism (CYP2A6 axis)',
    category: 'drug_metabolism',
    systems: ['nervous', 'digestive'],
    description: 'Nicotine oxidizes to cotinine via CYP2A6 (rate-limiting; ~80% of nicotine clearance), with minor pathways to nicotine-N\'-oxide (FMO3) and nornicotine. Cotinine is further hydroxylated by CYP2A6 to trans-3\'-hydroxycotinine (3HC). CYP2A6 expression varies widely — slow-metabolizer variants (Asian/African genotypes) predict lower nicotine doses to reach reinforcing levels, lower lifetime cigarette consumption, easier smoking cessation, and lower lung cancer risk. The 3HC/cotinine ratio is the validated "nicotine metabolite ratio (NMR)" used to phenotype CYP2A6 activity in cessation trials.',
    steps: [
      { from: 'nicotine', to: 'cotinine', via: 'CYP2A6 — rate-limiting; ~80% of clearance' },
      { from: 'cotinine', to: 'trans-3-hydroxycotinine', via: 'CYP2A6 (same enzyme, second step; the NMR numerator)' },
      { from: 'nicotine', to: 'nicotine-n-oxide', via: 'FMO3 (minor pathway)' },
    ],
    modulators: [
      { slug: 'nicotine', effect: 'substrate', target: 'CYP2A6 step' },
    ],
    refs: [],
  },
];

function main(): void {
  const existing = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(existing.map(p => [p.slug, p]));

  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) {
      console.log(`  [skip] ${p.slug} already exists`);
    } else {
      existing.push(p);
      added++;
      console.log(`  [add ] ${p.slug.padEnd(28)} (${p.steps.length} steps · ${p.modulators?.length ?? 0} modulators)`);
    }
  }

  // Sort alphabetically by slug for stability (loader sorts by name; this
  // is just for diff readability in the JSON file)
  existing.sort((a, b) => a.slug.localeCompare(b.slug));

  writeFileSync(PATHWAYS_PATH, JSON.stringify(existing, null, 2) + '\n');
  console.log(`\nWave 5a batch 1 (v1.2): +${added} pathways → ${existing.length} total.`);
}

main();
