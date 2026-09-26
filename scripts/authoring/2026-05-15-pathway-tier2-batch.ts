/**
 * Tier-2 pathway batch (2026-05-15) — 12 new pathways for the v8 registry.
 *
 * Builds on the Tier-1 batch (same day). All modulator slugs verified
 * against the compound registry; refs verified via NCBI E-utilities esummary 2026-05-15.
 *
 * Pathways added:
 *   fxr_tgr5_bile_acid_receptor
 *   mineralocorticoid_receptor
 *   vdr_genomic_signaling
 *   senescence_sasp_senolytics
 *   notch_signaling
 *   hedgehog_smoothened
 *   upr_er_stress_perk_ire1_atf6
 *   klotho_fgf23_phosphate_axis
 *   hepcidin_ferroportin_iron_regulation
 *   adenosine_receptor_signaling
 *   serotonin_5ht2a_psychedelic_signaling
 *   mglur_metabotropic_glutamate
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
type Pathway = {
  slug: string;
  name: string;
  category: 'biosynthesis' | 'catabolism' | 'signaling' | 'transport' | 'endocrine_axis' | 'drug_metabolism';
  systems: string[];
  description: string;
  steps: Array<{ from: string; to: string; via: string }>;
  modulators: Array<{ slug: string; effect: Effect; target: string; note?: string }>;
  refs: string[];
};

const PATHWAYS: Pathway[] = [
  {
    slug: 'fxr_tgr5_bile_acid_receptor',
    name: 'FXR / TGR5 bile-acid receptor signaling',
    category: 'signaling',
    systems: ['digestive', 'endocrine'],
    description:
      `Bile acids are not just emulsifiers — they are hormones acting through two distinct receptor classes. (1) FXR (farnesoid X receptor, NR1H4) is a nuclear receptor activated principally by CDCA > LCA > DCA > CA. FXR-RXR heterodimer drives transcription of: FGF15/19 (intestinal — feedback signal to liver via FGFR4/βKlotho → ↓CYP7A1 → ↓de novo bile acid synthesis); SHP (small heterodimer partner — represses LRH-1/HNF4α); BSEP (canalicular bile acid efflux); OST-α/β (basolateral efflux); IBABP (intestinal binding); apoC-II (lipoprotein metabolism). FXR also represses NF-κB → anti-inflammatory in liver/gut. (2) TGR5 (GPBAR1) is a Gs-coupled GPCR responding to LCA > DCA > CDCA → cAMP → PKA. Tissue effects: brown adipose / muscle (D2 → T3 → thermogenesis); intestinal L-cells (↑GLP-1 secretion — incretin axis crosstalk); macrophages (anti-inflammatory); biliary epithelium (proliferation + chloride secretion); gallbladder relaxation (postprandial). Microbiota–FXR crosstalk: gut bacteria deconjugate + 7α-dehydroxylate bile acids → secondary BAs (DCA, LCA) → tip the FXR/TGR5 balance; tauro-β-muricholic acid is a natural FXR antagonist (Sayin 2013). Therapeutics: obeticholic acid (OCA, INT-747 — semi-synthetic CDCA derivative, potent FXR agonist) for PBC + cholestatic liver disease, NASH trials; cilofexor + tropifexor (FXR agonists in development); UDCA + tauroUDCA (TUDCA) (PXR/FXR partial modulators — cytoprotective in cholestasis); bile-acid sequestrants (colesevelam, cholestyramine, colestipol) lower bile-acid pool → ↑FXR signal release → glucose effects (metformin-like). Cross-links: [[bile_acid_synthesis]] (upstream), [[insulin_glucose_homeostasis]] (TGR5 → GLP-1), [[gi_endocrine_peptides_misc]] (FGF15/19 endocrine).`,
    steps: [
      { from: 'cholesterol', to: 'primary bile acids (cholic + chenodeoxycholic)', via: 'CYP7A1 hepatic — rate-limiting; opposed by FXR via SHP feedback' },
      { from: 'primary BAs (taurine/glycine conjugated)', to: 'secondary BAs (DCA, LCA, UDCA)', via: 'gut microbiota deconjugation + 7α-dehydroxylation (Clostridium / Eubacterium)' },
      { from: 'CDCA (or OCA) binding FXR-LBD', to: 'FXR-RXR heterodimer on FXRE', via: 'corepressor displacement; coactivator recruitment' },
      { from: 'FXR active (intestine)', to: 'FGF15/19 secretion → liver FGFR4/βKlotho', via: '→ ERK → ↓CYP7A1 → ↓bile acid synthesis (feedback)' },
      { from: 'FXR active (liver)', to: 'SHP induction → LRH-1 / HNF4α repression', via: '→ ↓CYP7A1; ↑BSEP for canalicular efflux' },
      { from: 'LCA / DCA binding TGR5', to: 'Gs → cAMP → PKA', via: 'BAT/muscle thermogenesis; L-cell GLP-1; gallbladder relaxation' },
      { from: 'TGR5 (L-cell)', to: 'GLP-1 secretion', via: 'incretin axis crosstalk; partial mechanism of bile-acid sequestrant glycemic effect' },
    ],
    modulators: [
      { slug: 'colesevelam',  effect: 'activator', target: 'FXR signal release (sequesters BAs → ↑BA synthesis → glycemic benefit)', note: 'FDA-approved for both LDL and T2D — uniquely dual indication' },
      { slug: 'cholestyramine', effect: 'activator', target: 'FXR signal release (sequestrant)' },
      { slug: 'metformin',    effect: 'activator', target: 'FXR (indirect — alters BA pool composition + microbiota)' },
      { slug: 'semaglutide',  effect: 'activator', target: 'TGR5 indirect (GLP-1R axis intersects bile-acid signaling)' },
      { slug: 'liraglutide',  effect: 'activator', target: 'TGR5 indirect (GLP-1)' },
      { slug: 'retatrutide',  effect: 'activator', target: 'TGR5 indirect (GLP-1/GIP/GCG triple)' },
      { slug: 'tirzepatide',  effect: 'activator', target: 'TGR5 indirect (GLP-1/GIP)' },
      { slug: 'dulaglutide',  effect: 'activator', target: 'TGR5 indirect (GLP-1)' },
    ],
    refs: [
      'PMID:23395169', // Sayin 2013 Cell Metab — gut microbiota regulates FXR
      'PMID:29018272', // Jia 2018 Nat Rev Gastroenterol Hepatol — bile acid-microbiota crosstalk
    ],
  },

  {
    slug: 'mineralocorticoid_receptor',
    name: 'Mineralocorticoid receptor (aldosterone)',
    category: 'signaling',
    systems: ['endocrine', 'cardiovascular', 'renal'],
    description:
      `The mineralocorticoid receptor (MR, NR3C2) is a steroid nuclear receptor canonically activated by aldosterone in the kidney distal nephron, where it drives Na⁺ retention + K⁺ excretion. Mechanism: aldosterone diffuses across the basolateral membrane → binds MR (in DCT/CD principal cells) → MR translocates to nucleus → induces SGK1, ENaC (αβγ subunits), Na⁺/K⁺-ATPase, ROMK → net Na⁺ reabsorption + K⁺ secretion. Critical 11β-HSD2 selectivity: aldosterone and cortisol bind MR with similar affinity, but kidney + colon co-express 11β-HSD2 which inactivates cortisol to cortisone, allowing aldosterone selectivity. 11β-HSD2 deficiency or licorice (glycyrrhetinic acid) inhibition → "apparent mineralocorticoid excess" — cortisol drives MR → hypokalemic HTN. Extra-renal MR is now recognized in heart (cardiomyocytes + fibroblasts → maladaptive fibrosis), vasculature (endothelial dysfunction, vascular inflammation), brain (neurons → BP regulation + mood), adipocytes (inflammation). Clinical: aldosterone-driven heart failure (RALES/EPHESUS), resistant hypertension (PATHWAY-2), primary aldosteronism (Conn's). Drugs: steroidal MRAs — spironolactone (non-selective; off-target androgen + progesterone receptors → gynecomastia + impotence); eplerenone (selective MR; better-tolerated but less potent); canrenone (active spironolactone metabolite). Non-steroidal MRA — finerenone (FIDELIO-DKD + FIGARO-DKD — slows CKD progression in T2D; selective without sex-hormone side effects); esaxerenone (Japan). SGLT2 inhibitors lower aldosterone modestly + synergize with MRA in CKD. Cross-links: [[raas_axis]] (aldosterone synthesis upstream), [[renal_tubular_transport]] (downstream Na/K handling).`,
    steps: [
      { from: 'angiotensin II + ↑[K⁺] + ACTH', to: 'aldosterone synthesis (zona glomerulosa)', via: 'CYP11B2 (aldosterone synthase) — rate-limiting; KCNJ5 mutations → primary aldosteronism' },
      { from: 'aldosterone', to: 'MR (cytoplasmic → nuclear)', via: 'kidney + colon: 11β-HSD2 protects from cortisol cross-activation' },
      { from: 'MR-aldosterone', to: 'SGK1 induction (early)', via: '→ ENaC trafficking + Na/K-ATPase activity in DCT/CD' },
      { from: 'MR-aldosterone', to: 'ENaC αβγ + ROMK transcription', via: '→ apical Na⁺ entry + basolateral K⁺ secretion' },
      { from: 'cortisol + 11β-HSD2 deficiency / licorice', to: 'MR over-activation (AME)', via: '→ hypokalemic hypertension' },
      { from: 'extra-renal MR (heart, vessels)', to: 'fibrosis + endothelial dysfunction', via: 'maladaptive remodeling in HFrEF — basis for MRA benefit beyond Na handling' },
    ],
    modulators: [
      { slug: 'spironolactone',    effect: 'inhibitor', target: 'MR (steroidal, non-selective)', note: 'cross-reacts with androgen + progesterone receptors → gynecomastia, impotence, menstrual disturbance' },
      { slug: 'eplerenone',        effect: 'inhibitor', target: 'MR (steroidal, selective)', note: 'EPHESUS post-MI HFrEF; less potent but cleaner side-effect profile vs spiro' },
      { slug: 'dexamethasone',     effect: 'activator', target: 'MR (cross-occupancy)', note: 'high-dose synthetic GC has some MR activity; not primary use' },
      { slug: 'hydrocortisone',    effect: 'activator', target: 'MR (1:1 affinity vs aldosterone; protected by 11β-HSD2 in kidney)' },
      { slug: 'cortisol',          effect: 'activator', target: 'MR (endogenous; 11β-HSD2 inactivates to cortisone in kidney)' },
      { slug: 'prednisone',        effect: 'activator', target: 'MR (modest cross-occupancy at high doses)' },
      { slug: 'prednisolone',      effect: 'activator', target: 'MR (modest)' },
      { slug: 'dapagliflozin',     effect: 'inhibitor', target: 'MR axis (indirect — ↓aldosterone; synergy with MRA in DKD)' },
      { slug: 'empagliflozin',     effect: 'inhibitor', target: 'MR axis (indirect)' },
      { slug: 'canagliflozin',     effect: 'inhibitor', target: 'MR axis (indirect)' },
      { slug: 'potassium-chloride', effect: 'cofactor', target: 'MR-K⁺ feedback (↑K⁺ drives aldosterone; MR replacement needs K⁺ caution)' },
      { slug: 'dexmedetomidine',   effect: 'inhibitor', target: 'aldosterone secretion (α2-mediated; modest)' },
    ],
    refs: [
      'PMID:30678864', // Fuller 2019 Vitam Horm — MR signaling mechanisms
      'PMID:10639017', // Rogerson 2000 Steroids — Mineralocorticoid action
    ],
  },

  {
    slug: 'vdr_genomic_signaling',
    name: 'Vitamin D receptor genomic signaling (VDR)',
    category: 'signaling',
    systems: ['endocrine', 'immune-hematologic', 'musculoskeletal', 'digestive'],
    description:
      `The vitamin D receptor (VDR, NR1I1) is a steroid nuclear receptor activated by 1,25-(OH)₂-vitamin D₃ (calcitriol). 1α-hydroxylation in the kidney (CYP27B1) converts 25-OH-D₃ → 1,25-(OH)₂-D₃; extra-renal 1α-hydroxylation in macrophages, keratinocytes, and other tissues enables autocrine/paracrine VDR signaling. Genomic mechanism: calcitriol binds VDR → VDR-RXR heterodimer → binds VDREs in target gene promoters → coactivator recruitment (DRIP/Mediator, SRC-1, p300) → transcription. Canonical mineral-homeostasis targets: intestinal CaBP-9k + TRPV6 → Ca²⁺ absorption; CYP24A1 → calcitriol catabolism (feedback); renal Ca²⁺ reabsorption; bone osteoblast RANKL → osteoclastogenesis. Pleiotropic non-classical targets: keratinocyte differentiation (calcipotriene for psoriasis); innate immunity (cathelicidin/LL-37 in monocytes — TB defense); adaptive immunity (T-reg induction, Th1/Th17 suppression — autoimmunity modulation); insulin secretion (pancreatic β-cell); cardiovascular (RAAS suppression — VDR-knockout mice have ↑RAAS). Non-genomic / membrane-VDR effects: rapid Ca²⁺/cAMP responses (membrane-associated rapid response steroid binding protein). Therapeutics: cholecalciferol (D₃) + ergocalciferol (D₂) — substrate replacement; calcitriol — direct VDR agonist (renal failure, hypocalcemia); paricalcitol + doxercalciferol — selective VDR analogs (less hypercalcemic); calcipotriene/calcipotriol — topical psoriasis. Cross-links: [[vitamin_d_metabolism]] (upstream synthesis + activation), [[calcium_phosphate_pth_axis]] (mineral homeostasis), [[bone_remodeling_rank_rankl]] (RANKL induction).`,
    steps: [
      { from: '7-dehydrocholesterol (skin) + UVB', to: 'previtamin D₃ → cholecalciferol (D₃)', via: 'photolysis; spontaneous thermal isomerization' },
      { from: 'D₃ (skin) / D₂ (diet)', to: '25-OH-D (storage form)', via: 'liver CYP2R1 (+ CYP27A1 minor)' },
      { from: '25-OH-D', to: '1,25-(OH)₂-D (calcitriol — active)', via: 'kidney CYP27B1 (rate-limiting); upregulated by PTH, ↓Pi; downregulated by FGF23, calcitriol itself' },
      { from: 'calcitriol + VDR (cytoplasm)', to: 'VDR-RXR heterodimer on VDRE', via: 'coactivator recruitment (DRIP/Mediator, SRC-1, p300)' },
      { from: 'VDR-RXR on VDRE (intestine)', to: 'TRPV6 + calbindin-D9k transcription', via: '→ active Ca²⁺ absorption' },
      { from: 'VDR-RXR on VDRE (bone)', to: 'RANKL induction (osteoblasts)', via: '→ osteoclastogenesis when serum Ca²⁺ low' },
      { from: 'VDR-RXR (macrophages)', to: 'cathelicidin / LL-37 transcription', via: 'innate antimicrobial defense — TB association' },
      { from: 'VDR-RXR', to: 'CYP24A1 induction (feedback)', via: 'calcitriol → 24,25-(OH)₂-D inactivation' },
    ],
    modulators: [
      { slug: 'cholecalciferol', effect: 'substrate', target: 'D₃ substrate; needs 25-hydroxylation + 1α-hydroxylation' },
      { slug: 'ergocalciferol',  effect: 'substrate', target: 'D₂ substrate; less effective than D₃ at sustaining 25-OH-D' },
      { slug: 'calcitriol',      effect: 'activator', target: 'VDR direct agonist (active hormone)', note: 'renal failure (1α-OHase deficient); narrow Ca²⁺ window' },
      { slug: 'calcipotriene',   effect: 'activator', target: 'VDR (topical, low systemic Ca²⁺ effect)', note: 'topical psoriasis; keratinocyte differentiation' },
      { slug: 'calcium',         effect: 'cofactor',  target: 'VDR-target endpoint (intestinal absorption)' },
      { slug: 'magnesium',       effect: 'cofactor',  target: 'CYP27B1 + CYP24A1 require Mg²⁺ — Mg deficiency = functional vitamin D resistance' },
      { slug: 'mk4',             effect: 'cofactor',  target: 'VDR/K-axis crosstalk (Gla-osteocalcin requires K₂)' },
      { slug: 'mk7',             effect: 'cofactor',  target: 'K-axis crosstalk' },
      { slug: 'vitamin-k2-mk7',  effect: 'cofactor',  target: 'osteocalcin γ-carboxylation' },
    ],
    refs: [
      'PMID:26681795', // Christakos 2016 Physiol Rev — Vitamin D: Metabolism, Molecular Mechanism, Pleiotropic Actions
    ],
  },

  {
    slug: 'senescence_sasp_senolytics',
    name: 'Cellular senescence / SASP / senolytics',
    category: 'signaling',
    systems: ['immune-hematologic', 'musculoskeletal', 'cardiovascular', 'integumentary'],
    description:
      `Cellular senescence is a stable cell-cycle arrest triggered by genotoxic stress (replicative telomere erosion, oxidative damage, oncogene activation — OIS) — initially tumor-suppressive but accumulates with age and drives "inflammaging" + age-related disease via the senescence-associated secretory phenotype (SASP). Two main routes: (1) p16^INK4a^/Rb axis — irreversible cell-cycle arrest in G1; (2) p21^CIP1^/p53 axis — initial arrest, more reversible. Hallmarks: SA-β-galactosidase activity, enlarged flattened morphology, SAHF (senescence-associated heterochromatin foci), LADs (lamin-associated domains) reorganization, lysosomal expansion. SASP: senescent cells secrete a pro-inflammatory cocktail — IL-6, IL-8, MCP-1, MMPs, GROα, TIMPs, GDF15 — driven by NF-κB + C/EBPβ + cGAS-STING (cross-link). SASP paracrine: spreads senescence to neighbors; recruits immune clearance (when functional); promotes tumor microenvironment + fibrosis when persistent. Tissue burden of p16-positive cells ↑ with age; targeted clearance in mice extends healthspan + reverses age-related dysfunction (Baker 2016 — INK-ATTAC). Senolytics: drugs that selectively kill senescent cells (which depend on anti-apoptotic SCAPs — BCL-2, BCL-xL, PI3K-AKT). Established: dasatinib + quercetin (D+Q — Kirkland canonical combo; first-in-human trials in idiopathic pulmonary fibrosis, diabetic kidney disease); fisetin (mono-senolytic, gentler); navitoclax + venetoclax (BCL-2/BCL-xL inhibitors — too toxic systemically, focal use); rapamycin/mTOR inhibitors (gerosuppression but not senolytic per se); metformin (gerosuppressive, ↓SASP); resveratrol/curcumin (modest SASP suppression). Cross-links: [[cell_cycle_cdk]] (p16/p21 arrest), [[nfkb_signaling]] (SASP transcription), [[cgas_sting_type1_ifn]] (DNA-damage trigger), [[mtor_signaling]] (gerosuppression), [[autophagy_lc3_axis]] (lysosomal-senescence).`,
    steps: [
      { from: 'genotoxic stress (telomere erosion, ROS, oncogene)', to: 'DDR + p53-p21 / p16-Rb activation', via: 'CHK1/CHK2 + ATM/ATR; commitment over 7–10 days' },
      { from: 'p16^INK4a^ ↑', to: 'Rb hypophosphorylation → stable G1 arrest', via: 'irreversible vs p21 (transient)' },
      { from: 'persistent DNA damage / cytosolic DNA', to: 'cGAS-STING + NF-κB activation', via: 'cross-link to [[cgas_sting_type1_ifn]] — drives SASP transcription' },
      { from: 'NF-κB + C/EBPβ + GATA4', to: 'SASP transcription (IL-6, IL-8, MCP-1, MMPs, GDF15)', via: 'paracrine senescence spread + immune chemotaxis' },
      { from: 'BCL-2 / BCL-xL upregulation (SCAP)', to: 'apoptosis resistance', via: 'senescent cells survive via SCAPs — pharmacological vulnerability for senolytics' },
      { from: 'senolytic drug (D+Q, fisetin, navitoclax)', to: 'selective apoptosis of senescent cells', via: 'SCAP inhibition removes survival signal' },
    ],
    modulators: [
      { slug: 'dasatinib',    effect: 'inhibitor', target: 'tyrosine kinases including ephrin → senolytic (D+Q combo)', note: 'Kirkland D+Q regimen; intermittent dosing (~2 d/mo) to clear senescent cells' },
      { slug: 'quercetin',    effect: 'inhibitor', target: 'PI3K + flavonoid pleiotropy → senolytic (with dasatinib)' },
      { slug: 'fisetin',      effect: 'inhibitor', target: 'mono-senolytic (PI3K/AKT + BCL pathway)' },
      { slug: 'navitoclax',   effect: 'inhibitor', target: 'BCL-2 + BCL-xL → potent senolytic (but thrombocytopenia limits systemic use)' },
      { slug: 'venetoclax',   effect: 'inhibitor', target: 'BCL-2 selective → focal senolytic; CLL/AML approved' },
      { slug: 'rapamycin',    effect: 'inhibitor', target: 'mTOR → gerosuppression (delays onset of senescence; not senolytic)' },
      { slug: 'everolimus',   effect: 'inhibitor', target: 'mTOR → gerosuppression' },
      { slug: 'metformin',    effect: 'inhibitor', target: 'AMPK-mediated SASP suppression + mTOR damping' },
      { slug: 'resveratrol',  effect: 'inhibitor', target: 'SIRT1 → SASP modulation' },
      { slug: 'curcumin',     effect: 'inhibitor', target: 'NF-κB-driven SASP' },
      { slug: 'egcg',         effect: 'inhibitor', target: 'SASP / oxidative damage' },
      { slug: 'luteolin',     effect: 'inhibitor', target: 'SASP / senolytic (preclinical)' },
      { slug: 'spermidine',   effect: 'activator', target: 'autophagy (lifespan extension; gerosuppressive)' },
      { slug: 'nmn',          effect: 'cofactor',  target: 'NAD⁺ precursor → SIRT1/2 → SASP modulation' },
      { slug: 'nr',           effect: 'cofactor',  target: 'NAD⁺ precursor (nicotinamide riboside)' },
      { slug: 'azithromycin', effect: 'inhibitor', target: 'modest senolytic + anti-inflammatory; macrolide off-target' },
    ],
    refs: [
      'PMID:32686219', // Kirkland 2020 J Intern Med — Senolytic drugs: discovery to translation
      'PMID:28416161', // Kirkland 2017 EBioMedicine — Cellular Senescence: A Translational Perspective
    ],
  },

  {
    slug: 'notch_signaling',
    name: 'Notch signaling',
    category: 'signaling',
    systems: ['immune-hematologic', 'nervous', 'digestive', 'cardiovascular'],
    description:
      `Notch is a juxtacrine cell-cell signaling system — short-range, contact-dependent — that controls binary cell-fate decisions and lateral inhibition. Four mammalian receptors (Notch1–4) + five DSL ligands (Delta-like 1/3/4, Jagged1/2). Mechanism: receptor and ligand are both transmembrane on adjacent cells. Ligand-receptor binding pulls the Notch extracellular domain off → exposes S2 cleavage site for ADAM10/17 (TACE) → produces a substrate for γ-secretase (the same complex that cleaves APP — relevant to Alzheimer pharmacology). γ-secretase performs S3 cleavage in the transmembrane domain → releases the Notch intracellular domain (NICD) → NICD translocates to nucleus → binds CSL (CBF-1/RBP-Jκ in mammals) → recruits MAML coactivator + p300 → activates Notch target genes (HES, HEY families — basic-helix-loop-helix repressors of differentiation programs). Output: maintains stem/progenitor states; drives lineage choice (e.g., T-cell vs B-cell at thymic entry; absorptive vs secretory enterocyte; arterial vs venous endothelial). Cancer relevance: NOTCH1 gain-of-function in ~50% of T-ALL (γ-secretase inhibitors trialed); NOTCH3 in vascular CADASIL; oncogene in some solid tumors but tumor suppressor in others (skin SCC). Therapeutics: γ-secretase inhibitors (GSIs — once trialed in Alzheimer for APP-cleavage; failed due to Notch-mediated GI toxicity — goblet-cell metaplasia from disrupted intestinal differentiation); anti-DLL3 (rovalpituzumab) for SCLC; anti-Notch1 antibody Brontictuzumab. Cross-links: [[cell_cycle_cdk]] (proliferation control), [[wnt_beta_catenin]] (parallel/contrasting morphogen), [[hedgehog_smoothened]] (parallel).`,
    steps: [
      { from: 'DSL ligand (Delta/Jagged) on signal-sending cell', to: 'Notch receptor extracellular domain on adjacent cell', via: 'mechanical pulling force; cis-inhibition by ligand on same cell' },
      { from: 'Notch-ligand engagement', to: 'S2 cleavage by ADAM10/17 (TACE)', via: 'extracellular domain released; substrate primed for γ-secretase' },
      { from: 'S2-cleaved Notch', to: 'S3 cleavage by γ-secretase → NICD release', via: 'γ-secretase = presenilin-1/2 + nicastrin + APH-1 + PEN-2 (same as APP)' },
      { from: 'NICD (cytoplasmic)', to: 'nuclear translocation → CSL binding', via: 'binds CSL → displaces CoR (CIR/SMRT) → recruits MAML + p300 coactivators' },
      { from: 'NICD-CSL-MAML on enhancer', to: 'HES / HEY transcription', via: 'bHLH repressors of differentiation; maintains progenitor state' },
      { from: 'NICD ubiquitination (FBXW7)', to: 'proteasomal degradation', via: 'NICD half-life minutes; sustained signaling requires continuous receptor activation' },
    ],
    modulators: [
      { slug: 'curcumin',     effect: 'inhibitor', target: 'Notch (chronic; tumor models)' },
      { slug: 'resveratrol',  effect: 'inhibitor', target: 'Notch (chronic)' },
      { slug: 'quercetin',    effect: 'inhibitor', target: 'Notch (preclinical)' },
      { slug: 'egcg',         effect: 'inhibitor', target: 'Notch (chemopreventive)' },
      { slug: 'luteolin',     effect: 'inhibitor', target: 'Notch' },
      { slug: 'genistein',    effect: 'inhibitor', target: 'Notch (isoflavone)' },
      { slug: 'daidzein',     effect: 'inhibitor', target: 'Notch (isoflavone)' },
      { slug: 'tretinoin',    effect: 'inhibitor', target: 'Notch — RAR opposes Notch in differentiation contexts (APL mechanism overlap)' },
      { slug: 'isotretinoin', effect: 'inhibitor', target: 'Notch — RAR-mediated cross-talk' },
      { slug: 'retinol',      effect: 'inhibitor', target: 'Notch — pro-vitamin A → retinoic acid → RAR' },
      { slug: 'aspirin',      effect: 'inhibitor', target: 'Notch (CRC chemoprevention; partial)' },
      { slug: 'dapagliflozin', effect: 'inhibitor', target: 'Notch (preclinical fibrosis models)' },
    ],
    refs: [
      'PMID:10221902', // Artavanis-Tsakonas 1999 Science — canonical Notch review
      'PMID:23729744', // Hori 2013 J Cell Sci — Notch signaling at a glance
    ],
  },

  {
    slug: 'hedgehog_smoothened',
    name: 'Hedgehog / Smoothened signaling',
    category: 'signaling',
    systems: ['integumentary', 'musculoskeletal', 'nervous', 'digestive'],
    description:
      `Hedgehog (Hh) signaling is a developmental morphogen pathway essential for embryonic patterning (limb, neural tube, somites) and adult stem-cell maintenance. Three mammalian ligands: Sonic (SHH — most studied), Indian (IHH — bone/cartilage), Desert (DHH — gonadal). Mechanism is unusual: when no ligand is present, the 12-pass transmembrane receptor PATCHED1 (PTCH1) tonically INHIBITS Smoothened (SMO, a 7-pass GPCR-like receptor that doesn\'t use a heterotrimeric G-protein in the canonical sense). PTCH1 likely transports oxysterols/cholesterol away from SMO to keep it inactive. When SHH binds PTCH1, PTCH1 internalizes → relieves SMO inhibition → SMO active → GLI transcription factors translocate to nucleus → activate Hh target genes (PTCH1 itself — feedback, GLI1, BCL2, cyclin D, FOXM1). In OFF state, GLI3 (and GLI2) are processed by a destruction complex (SUFU + KIF7 + PKA + GSK-3β + CK1) → cleaved to GLI3-Rep (repressor) — analogous to Wnt/β-catenin. Disease: gorlin syndrome (PTCH1 LOF — basal cell carcinoma + medulloblastoma); sporadic BCC (PTCH1 / SMO somatic mutations — most common human cancer); medulloblastoma (SMO + PTCH1); rhabdomyosarcoma. Therapeutics — SMO inhibitors: vismodegib (Erivedge) — first FDA-approved Hh inhibitor (2012, locally advanced/metastatic BCC); sonidegib (Odomzo, 2015); glasdegib (Daurismo, 2018 — AML in combination). Itraconazole is an off-target SMO inhibitor (independent of CYP51); arsenic trioxide inhibits GLI directly (APL secondary use). Resistance: SMO D473H mutation (vismodegib); downstream GLI activation bypassing SMO. Cross-links: [[wnt_beta_catenin]] (parallel developmental), [[notch_signaling]] (parallel), [[cell_cycle_cdk]] (cyclin D target).`,
    steps: [
      { from: 'no SHH — PTCH1 active', to: 'SMO tonically inhibited', via: 'PTCH1 keeps SMO out of primary cilium / dephosphorylated; net Hh OFF' },
      { from: 'GLI3 / GLI2 cytoplasm', to: 'GLI-Rep (cleaved repressor)', via: 'SUFU + KIF7 + PKA + GSK-3β + CK1 destruction complex (analogous to APC-Axin for Wnt)' },
      { from: 'SHH ligand', to: 'PTCH1 binding + internalization', via: 'SHH is palmitoylated + cholesterol-modified — diffuses as multimers' },
      { from: 'PTCH1 internalized', to: 'SMO derepression + ciliary accumulation', via: 'oxysterol / cholesterol shift in primary cilium membrane activates SMO' },
      { from: 'SMO active', to: 'GLI dissociation from SUFU → nuclear', via: 'GLI-Act drives target gene transcription' },
      { from: 'GLI-Act (nucleus)', to: 'PTCH1 (feedback), GLI1, BCL2, cyclin D, FOXM1 transcription', via: 'PTCH1 upregulation = negative-feedback; GLI1 = positive feedback' },
    ],
    modulators: [
      { slug: 'itraconazole', effect: 'inhibitor', target: 'SMO (off-target, independent of antifungal CYP51 action)', note: 'repurposing trials for BCC + Hh-driven tumors; not first-line vs vismodegib' },
      { slug: 'curcumin',     effect: 'inhibitor', target: 'Hedgehog (chronic; tumor models)' },
      { slug: 'resveratrol',  effect: 'inhibitor', target: 'Hh / GLI (preclinical)' },
      { slug: 'egcg',         effect: 'inhibitor', target: 'Hh (chemopreventive)' },
      { slug: 'quercetin',    effect: 'inhibitor', target: 'Hh' },
      { slug: 'genistein',    effect: 'inhibitor', target: 'Hh (isoflavone)' },
      { slug: 'aspirin',      effect: 'inhibitor', target: 'Hh (CRC chemoprevention partial; Hh cross-talk)' },
    ],
    refs: [
      'PMID:35606054', // Ingham 2022 Curr Top Dev Biol — Hedgehog signaling
      'PMID:9649421',  // Ingham 1998 EMBO J — Transducing Hedgehog (foundational)
    ],
  },

  {
    slug: 'upr_er_stress_perk_ire1_atf6',
    name: 'Unfolded protein response / ER stress (PERK / IRE1 / ATF6)',
    category: 'signaling',
    systems: ['immune-hematologic', 'digestive', 'endocrine', 'nervous'],
    description:
      `The unfolded protein response (UPR) is the ER\'s quality-control system for accumulated misfolded proteins — triggered by accumulation that exceeds chaperone (BiP/GRP78) capacity. BiP normally binds the luminal domains of three ER-resident sensors (PERK, IRE1α, ATF6), keeping them inactive. When misfolded proteins accumulate, BiP is competed away → sensor activation. Three parallel arms: (1) PERK (PERK/EIF2AK3) — autophosphorylates → phosphorylates eIF2α → halts cap-dependent translation globally (reduces ER load) but selectively allows translation of ATF4 (because of uORFs) → induces CHOP, GADD34, amino-acid metabolism genes; sustained PERK → CHOP → apoptosis. (2) IRE1α — RNase + kinase; autophosphorylates → splices XBP1 mRNA (removes 26-nt intron) → XBP1s (spliced, active TF) → induces ER chaperones (BiP, GRP94), ERAD components, lipid biosynthesis. IRE1α also performs regulated IRE1-dependent decay (RIDD) of select mRNAs. (3) ATF6 — translocates to Golgi → cleaved by S1P/S2P proteases (same that cleave SREBPs) → cytosolic fragment (ATF6f) is a bZIP TF → induces BiP, XBP1, ERAD components. Acute UPR: pro-survival (restore homeostasis). Chronic/excessive UPR: pro-apoptotic (CHOP, JNK, caspase-12 in rodents). Disease relevance: type 2 diabetes (β-cell ER stress under chronic insulin demand); neurodegeneration (ALS, Parkinson, Alzheimer — protein aggregation triggers UPR); cancer (tumors co-opt IRE1/XBP1 for survival; hypoxia → UPR); cystic fibrosis (ΔF508 misfolding); transthyretin amyloidosis. Therapeutics: 4-phenylbutyrate + TUDCA — chemical chaperones (clinical for CF, urea-cycle disorders); ISRIB (integrated stress response inhibitor — PERK arm); GSK2606414 / GSK2656157 — PERK inhibitors (preclinical); ORIN1001 / MKC-3946 — IRE1 RNase inhibitors. Proteasome inhibitors (bortezomib) overload ERAD → ER stress → multiple myeloma cell death. Cross-links: [[apoptosis_bcl2_axis]] (CHOP-driven), [[autophagy_lc3_axis]] (UPR triggers autophagy), [[insulin_glucose_homeostasis]] (β-cell ER stress).`,
    steps: [
      { from: 'misfolded protein accumulation in ER lumen', to: 'BiP/GRP78 displacement from PERK / IRE1α / ATF6', via: 'BiP preferentially binds exposed hydrophobic stretches; sensors de-repressed' },
      { from: 'PERK active', to: 'eIF2α phosphorylation → global translation arrest', via: 'reduces ER load; selectively spares ATF4 mRNA via uORFs' },
      { from: 'ATF4', to: 'CHOP + GADD34 + amino-acid response genes', via: 'GADD34 = PP1-targeting subunit → dephosphorylates eIF2α → feedback restart' },
      { from: 'IRE1α RNase', to: 'XBP1 splicing (26-nt intron removal)', via: 'XBP1s = ER chaperones, ERAD, lipid synthesis; IRE1 also performs RIDD' },
      { from: 'ATF6 (ER)', to: 'Golgi → S1P/S2P cleavage → ATF6f', via: 'cytosolic ATF6f bZIP-TF → BiP, XBP1 transcription' },
      { from: 'sustained UPR (chronic)', to: 'CHOP-driven apoptosis', via: 'pro-survival → pro-apoptotic switch when ER stress unresolved' },
    ],
    modulators: [
      { slug: 'metformin',    effect: 'inhibitor', target: 'UPR (chronic; via AMPK-mediated ER stress reduction)' },
      { slug: 'rapamycin',    effect: 'inhibitor', target: 'UPR (via mTOR damping → ↓ER load)' },
      { slug: 'aspirin',      effect: 'inhibitor', target: 'UPR (anti-inflammatory; modest)' },
      { slug: 'curcumin',     effect: 'inhibitor', target: 'CHOP-driven apoptosis (preclinical neuroprotection)' },
      { slug: 'resveratrol',  effect: 'inhibitor', target: 'ER stress (SIRT1-mediated)' },
      { slug: 'quercetin',    effect: 'inhibitor', target: 'ER stress (flavonoid)' },
      { slug: 'luteolin',     effect: 'inhibitor', target: 'ER stress' },
      { slug: 'egcg',         effect: 'inhibitor', target: 'ER stress' },
      { slug: 'dha',          effect: 'inhibitor', target: 'ER stress (membrane composition + anti-inflammatory)' },
      { slug: 'epa',          effect: 'inhibitor', target: 'ER stress (anti-inflammatory)' },
    ],
    refs: [
      'PMID:22013210', // Hetz 2011 Physiol Rev — UPR: integrating stress signals through IRE1α
    ],
  },

  {
    slug: 'klotho_fgf23_phosphate_axis',
    name: 'Klotho / FGF23 phosphate axis',
    category: 'endocrine_axis',
    systems: ['renal', 'endocrine', 'musculoskeletal'],
    description:
      `Klotho (αKlotho) is a single-pass transmembrane protein discovered as a longevity gene — Klotho-deficient mice show premature aging (vascular calcification, osteopenia, infertility, atrophy). αKlotho acts as the obligate co-receptor for FGF23, converting promiscuous FGFRs (1c, 3c, 4) into FGF23-specific high-affinity receptors in target tissues (kidney proximal tubule + parathyroid). Phosphate axis: FGF23 is secreted by osteocytes/osteoblasts in response to ↑serum Pi + ↑calcitriol + ↑PTH. FGF23-Klotho-FGFR1c on kidney → ↓NaPi-2a/2c (PT brush border) → phosphaturia; FGF23 also ↓CYP27B1 + ↑CYP24A1 → ↓calcitriol (counter-regulating Pi absorption). In parathyroid: FGF23 → ↓PTH (acute). Three-hormone interplay: PTH ↑Pi excretion + ↑calcitriol + ↑bone resorption; FGF23 ↑Pi excretion + ↓calcitriol; calcitriol ↑Ca + Pi absorption + ↑FGF23 secretion. CKD-MBD: declining GFR → Pi retention → ↑FGF23 (compensatory) → ↓calcitriol → secondary hyperparathyroidism → tertiary HPT; ↑FGF23 also independently associated with CV mortality + LVH. Klotho also has hormonal soluble form (shed by ADAM10/17 + γ-secretase) — circulates as anti-aging factor (regulates Ca channels, oxidative stress, Wnt, IGF-1). Loss of soluble Klotho in CKD → contributes to vascular calcification + cognitive decline. Therapeutics: phosphate binders (sevelamer, lanthanum, calcium carbonate, sucroferric oxyhydroxide) lower dietary Pi load; calcimimetics (cinacalcet, etelcalcetide) — CaSR agonists → ↓PTH; calcitriol/paricalcitol for CKD-MBD with monitoring; burosumab (anti-FGF23 mAb) for X-linked hypophosphatemic rickets + tumor-induced osteomalacia. Cross-links: [[calcium_phosphate_pth_axis]] (PTH + Ca arm), [[vitamin_d_metabolism]] (calcitriol), [[bone_remodeling_rank_rankl]] (osteocyte source).`,
    steps: [
      { from: '↑serum Pi + ↑calcitriol', to: 'osteocyte FGF23 secretion', via: 'PHEX / DMP1 regulation; FAM20C kinase phosphorylates Ser180 → cleavage protection' },
      { from: 'FGF23 + αKlotho (PT cell)', to: 'FGFR1c high-affinity activation', via: 'Klotho is the co-receptor that confers FGF23 specificity to otherwise promiscuous FGFRs' },
      { from: 'FGF23-Klotho-FGFR1c (kidney PT)', to: '↓NaPi-2a / NaPi-2c brush-border transporters', via: '→ phosphaturia (primary endocrine effect)' },
      { from: 'FGF23 (kidney)', to: '↓CYP27B1 + ↑CYP24A1', via: '→ ↓calcitriol production + ↑inactivation; secondary mineral homeostasis effect' },
      { from: 'FGF23 (parathyroid)', to: '↓PTH (acute)', via: 'short-term; chronic FGF23 ↑ → parathyroid resistance + PTH escape' },
      { from: 'membrane Klotho', to: 'soluble Klotho (sKL) by ADAM10/17 + γ-secretase shedding', via: 'circulating hormone — Ca-channel modulation, anti-fibrotic, oxidative stress reduction' },
    ],
    modulators: [
      { slug: 'cholecalciferol', effect: 'substrate', target: 'D₃ substrate; calcitriol drives FGF23 secretion (feedback)' },
      { slug: 'ergocalciferol',  effect: 'substrate', target: 'D₂ substrate' },
      { slug: 'calcitriol',      effect: 'activator', target: 'FGF23 secretion (positive feedback); also direct VDR target' },
      { slug: 'calcipotriene',   effect: 'activator', target: 'FGF23 axis (topical; minimal systemic)' },
      { slug: 'calcium',         effect: 'cofactor',  target: 'PTH + FGF23 axis (CaSR + bone)' },
      { slug: 'cinacalcet',      effect: 'activator', target: 'CaSR → ↓PTH (downstream of FGF23 axis)' },
      { slug: 'atorvastatin',    effect: 'inhibitor', target: 'FGF23 (modest; vascular calcification context)' },
      { slug: 'rosuvastatin',    effect: 'inhibitor', target: 'FGF23 (modest)' },
    ],
    refs: [
      'PMID:30455427', // Kuro-O 2019 Nat Rev Nephrol — Klotho proteins in health and disease
      'PMID:32982966', // Buchanan 2020 Front Endocrinol — Klotho, Aging, and the Failing Kidney
    ],
  },

  {
    slug: 'hepcidin_ferroportin_iron_regulation',
    name: 'Hepcidin / ferroportin iron regulation',
    category: 'endocrine_axis',
    systems: ['immune-hematologic', 'digestive', 'endocrine'],
    description:
      `Hepcidin (HAMP) is the master regulator of systemic iron homeostasis — a 25-aa peptide hormone secreted by hepatocytes that binds ferroportin (SLC40A1, the only known cellular iron exporter) on duodenal enterocytes, macrophages, and hepatocytes → triggers ferroportin internalization + degradation → blocks iron egress → ↓serum iron. Reciprocal regulation: BMP6 (sinusoidal endothelium) + iron-loaded transferrin via TfR2 + HFE → SMAD1/5/8 + BMP-receptor complex on hepatocytes → ↑HAMP transcription (the high-iron limb). IL-6 (inflammation) → STAT3 → ↑HAMP (the inflammation limb; explains anemia of chronic disease + functional iron deficiency). Erythroid demand: erythroferrone (ERFE, secreted by erythroblasts in response to EPO) → suppresses hepcidin → ↑iron availability for erythropoiesis (the bone-marrow demand limb). Tissue effects: ↑hepcidin → enterocyte ferroportin internalized → iron trapped in mucosa, lost in shed enterocyte → ↓absorption; macrophage ferroportin internalized → iron retained in RES (reticuloendothelial sequestration). Disease: hereditary hemochromatosis (HFE, HJV, TfR2, HAMP mutations — failed hepcidin response → unopposed iron absorption → tissue overload + cirrhosis, DM, cardiomyopathy); iron-refractory iron deficiency anemia (TMPRSS6 LOF — constitutively elevated hepcidin); anemia of chronic disease (IL-6 driven hepcidin → functional Fe deficiency); CKD-MBD anemia (multifactorial; hepcidin + EPO). Therapeutics: classical iron supplementation (ferrous sulfate, iron-bisglycinate, heme iron) overcomes mild deficiency; IV iron (sucrose, gluconate, carboxymaltose, derisomaltose) bypasses gut absorption block; iron chelators (deferoxamine SC/IV, deferasirox oral, deferiprone) for overload; hepcidin agonists (PTG-300/rusfertide for polycythemia vera) — clinical pipeline; hepcidin antagonists for hemochromatosis (in development); EPO/darbepoetin → ERFE → ↓hepcidin (functional). Cross-links: [[iron_metabolism]] (transferrin, ferritin, cellular iron), [[heme_biosynthesis]] (iron demand sink), [[ferroptosis_gpx4_lipid_peroxidation]] (Fe²⁺ toxicity downstream).`,
    steps: [
      { from: 'BMP6 (sinusoidal endothelium) + Tf-Fe via TfR2/HFE', to: 'hepatocyte SMAD1/5/8 + BMPR → HAMP transcription', via: 'high-iron limb — physiological hepcidin upregulation' },
      { from: 'IL-6 (inflammation)', to: 'STAT3 → HAMP transcription', via: 'inflammation limb — anemia of chronic disease mechanism' },
      { from: 'EPO → erythroblast ERFE secretion', to: 'BMP6 antagonism → ↓HAMP', via: 'erythroid-demand limb — high-demand suppresses hepcidin to free iron' },
      { from: 'hepcidin', to: 'ferroportin binding + internalization', via: 'ferroportin = only cellular iron exporter; endocytosis → lysosomal degradation' },
      { from: 'enterocyte ferroportin down', to: '↓iron absorption (mucosal trap)', via: 'apical DMT1 → cytoplasm → cannot exit basolaterally → lost when enterocyte sheds' },
      { from: 'macrophage ferroportin down', to: 'RES iron sequestration', via: 'red-pulp macrophages cannot release recycled iron → functional iron deficiency in plasma' },
    ],
    modulators: [
      { slug: 'iron',                  effect: 'substrate', target: 'pool — ↑Tf saturation → hepcidin' },
      { slug: 'iron-bisglycinate',     effect: 'substrate', target: 'chelated iron — better tolerance, similar net absorption' },
      { slug: 'ascorbic-acid',         effect: 'cofactor',  target: 'reduces Fe³⁺→Fe²⁺ → ↑ duodenal DMT1 uptake' },
      { slug: 'testosterone-cypionate', effect: 'inhibitor', target: 'hepcidin (T directly suppresses HAMP transcription)', note: 'mechanism for testosterone-induced erythrocytosis' },
      { slug: 'testosterone-enanthate', effect: 'inhibitor', target: 'hepcidin' },
      { slug: 'metformin',             effect: 'inhibitor', target: 'hepcidin (modest)' },
      { slug: 'resveratrol',           effect: 'inhibitor', target: 'hepcidin (anti-inflammatory)' },
      { slug: 'curcumin',              effect: 'inhibitor', target: 'IL-6 → hepcidin axis' },
      { slug: 'quercetin',             effect: 'inhibitor', target: 'iron chelation + ferroportin protection' },
      { slug: 'egcg',                  effect: 'inhibitor', target: 'iron chelation + hepcidin modulation' },
      { slug: 'calcium',               effect: 'inhibitor', target: 'non-heme iron absorption (DMT1 competition)' },
      { slug: 'magnesium',             effect: 'inhibitor', target: 'iron uptake (modest interference)' },
      { slug: 'zinc',                  effect: 'inhibitor', target: 'iron uptake (DMT1 competition)' },
    ],
    refs: [
      'PMID:24137020', // Ganz 2013 Physiol Rev — Systemic iron homeostasis
      'PMID:16848710', // Nemeth 2006 Annu Rev Nutr — Regulation of iron metabolism by hepcidin
    ],
  },

  {
    slug: 'adenosine_receptor_signaling',
    name: 'Adenosine receptor signaling (A1 / A2A / A2B / A3)',
    category: 'signaling',
    systems: ['nervous', 'cardiovascular', 'immune-hematologic', 'respiratory'],
    description:
      `Adenosine is a ubiquitous purine signaling molecule generated from ATP/AMP breakdown (extracellular via CD39 → CD73; intracellular via SAH → SAM cycle). Acts on four G-protein-coupled receptors with distinct G-coupling and tissue distribution. A1 (Gi/o-coupled, high abundance in brain, heart, kidney): ↓cAMP → ↓neurotransmitter release (sleep-promoting; "ado pressure" Borbély S process), bradycardia (cardiac AV node — therapeutic adenosine bolus for SVT), antinociception, ↓renal renin. A2A (Gs-coupled, striatum, blood vessels, lymphocytes, platelets): ↑cAMP → vasodilation (coronary — basis of dipyridamole/regadenoson stress testing), inhibits T-cell activation (immunosuppression — tumor microenvironment), antiplatelet (ticagrelor partial mechanism); striatal A2A on D2 MSNs antagonizes D2 → Parkinson target (istradefylline). A2B (Gs, lower-affinity, widely expressed): mast-cell activation, asthma + inflammation. A3 (Gi, cardioprotective, anti-tumor, anti-inflammation; pre-clinical agonists). Adenosine pharmacokinetics: ultra-short half-life (~10 s in plasma) — rapidly degraded by adenosine deaminase + cellular uptake via ENT1/2 (dipyridamole blocks uptake → ↑extracellular adenosine → potentiates stress test). Methylxanthines (caffeine, theophylline, theobromine, pentoxifylline) are non-selective adenosine receptor antagonists — explains stimulant, bronchodilator, ↑HR, ↑BP effects. Therapeutics: A1 — direct adenosine IV for SVT termination (transient AV block); A2A — regadenoson (CV-stress imaging — selective A2A, doesn\'t hit A1 bronchoconstriction); dipyridamole (uptake inhibitor → A2A-mediated coronary vasodilation, stress imaging + antiplatelet in CADASIL); ticagrelor partial A2A; istradefylline for Parkinson; A2B + A3 agonists/antagonists in clinical trials (cancer immunotherapy, fibrosis). Cross-links: [[caffeine_demethylation]] (xanthines), [[circadian_clock_bmal1_per_cry]] (sleep), [[platelet_aggregation]] (antiplatelet).`,
    steps: [
      { from: 'ATP / ADP (released — stress, ischemia, inflammation)', to: 'AMP (CD39, ENTPD1)', via: 'ectonucleotidase; rate-limiting step in extracellular adenosine generation' },
      { from: 'AMP', to: 'adenosine (CD73, NT5E)', via: 'CD73 is the rate-limiting enzyme — therapeutic target in cancer immunotherapy' },
      { from: 'adenosine + A1 (Gi)', to: '↓cAMP → ↓neurotransmitter release + bradycardia', via: 'brain sleep-pressure; cardiac AV node block (clinical bolus for SVT)' },
      { from: 'adenosine + A2A (Gs)', to: '↑cAMP → vasodilation + T-cell suppression', via: 'coronary stress test; tumor microenvironment immune evasion' },
      { from: 'adenosine + A2B (Gs)', to: 'mast-cell + inflammatory signaling', via: 'asthma + inflammation; lower-affinity than A2A' },
      { from: 'adenosine', to: 'inosine (ADA) or recycled (ENT1/2 → SAH cycle)', via: 'half-life ~10 s; dipyridamole blocks ENT1 uptake' },
      { from: 'caffeine / theophylline', to: 'A1 + A2A non-selective antagonism', via: 'reverses adenosine-mediated sleep pressure → wakefulness; bronchodilation' },
    ],
    modulators: [
      { slug: 'caffeine',      effect: 'inhibitor', target: 'A1 + A2A (non-selective antagonist)', note: 'principal stimulant mechanism; CYP1A2 substrate explains DDIs' },
      { slug: 'theophylline',  effect: 'inhibitor', target: 'A1 + A2A; also PDE inhibitor (narrow TI)' },
      { slug: 'theobromine',   effect: 'inhibitor', target: 'A1 + A2A weaker; cacao alkaloid' },
      { slug: 'pentoxifylline', effect: 'inhibitor', target: 'A1 + A2A weak; primarily PDE inhibitor (rheology in claudication)' },
      { slug: 'adenosine',     effect: 'activator', target: 'A1/A2A/A2B/A3 (full endogenous agonist)', note: 'IV bolus for SVT; transient AV block (seconds); contraindicated with carbamazepine + dipyridamole potentiation' },
      { slug: 'dipyridamole',  effect: 'activator', target: 'adenosine (indirect — blocks ENT1 uptake → ↑extracellular)', note: 'stress imaging adjunct + antiplatelet; potentiates adenosine effects' },
      { slug: 'ticagrelor',    effect: 'activator', target: 'adenosine (partial — blocks ENT1 uptake; explains dyspnea side effect)' },
      { slug: 'clopidogrel',   effect: 'inhibitor', target: 'P2Y12 receptor (related purinergic; not adenosine)' },
      { slug: 'prasugrel',     effect: 'inhibitor', target: 'P2Y12 (related)' },
    ],
    refs: [
      'PMID:20164566', // Ribeiro 2010 J Alzheimers Dis — caffeine and adenosine
      'PMID:28287473', // Ciancetta 2017 Molecules — A3 adenosine receptor structural review
    ],
  },

  {
    slug: 'serotonin_5ht2a_psychedelic_signaling',
    name: '5-HT2A psychedelic signaling',
    category: 'signaling',
    systems: ['nervous'],
    description:
      `The 5-HT2A receptor is a Gq-coupled GPCR expressed at high density on cortical layer V pyramidal neurons (especially prefrontal cortex) and is the obligate target of classical psychedelics — psilocin (active metabolite of psilocybin), LSD, DMT, mescaline, 5-MeO-DMT. Pharmacology distinguishes psychedelic from non-psychedelic 5-HT2A agonists: biased agonism for β-arrestin-2 + specific G-protein subtypes (Gq, but with downstream signaling that engages BDNF/mTOR — see [[bdnf_trkb_neurotrophic]]); recent evidence that psilocin + LSD bind TrkB directly (Moliner 2023) and that head-twitch response in rodents (a 5-HT2A psychedelic-specific behavior) tracks subjective "trip" intensity in humans. Functional mechanism: 5-HT2A → Gq → PLC → IP3 + DAG → Ca²⁺ + PKC → cortical pyramidal cell depolarization → glutamate release (especially on thalamic relay) → mGluR2/3 cross-talk modulates the experience (ketanserin blocks the experience; mGluR2 agonists dampen it). Persistent post-acute effects: ↑synaptogenesis in PFC (rapid, mTOR-dependent), ↑plasticity, ↓DMN connectivity (network "reset" hypothesis for depression/anxiety/addiction). 5-HT2A is also a major off-target for atypical antipsychotics (high 5-HT2A:D2 ratio defines "atypicality" per Meltzer hypothesis — clozapine, olanzapine, risperidone, quetiapine block 5-HT2A → ↓EPS, ↑metabolic effects). Pure 5-HT2A inverse agonists: pimavanserin (Parkinson disease psychosis — no D2 blockade); historic ritanserin (depression trials, failed). Therapeutics — psychedelic: psilocybin (COMP360 in TRD phase 3); MDMA (PTSD — Lykos); LSD trials. Anti-psychotic: pimavanserin selective; nuplazid. Cross-links: [[serotonin_receptor_pharmacology]] (parent), [[bdnf_trkb_neurotrophic]] (downstream psychoplastogen mechanism), [[mglur_metabotropic_glutamate]] (mGluR2/3 modulation of psychedelic).`,
    steps: [
      { from: 'psilocybin (PO)', to: 'psilocin (active)', via: 'alkaline phosphatase + non-specific esterase dephosphorylation; not CYP' },
      { from: 'psilocin / LSD / DMT', to: '5-HT2A receptor activation (Gq biased)', via: 'cortical layer V pyramidal neuron; β-arrestin-2 + Gq engagement' },
      { from: '5-HT2A → Gq → PLC', to: 'IP3 + DAG → Ca²⁺ + PKC', via: 'cortical pyramidal depolarization' },
      { from: 'cortical pyramidal glutamate release', to: 'mGluR2/3 + AMPA modulation', via: 'thalamic relay disruption; mGluR2 agonists block subjective effect' },
      { from: 'psilocin / LSD', to: 'TrkB direct binding (Moliner 2023)', via: 'distinct from 5-HT2A — psychoplastogen mechanism; supports BDNF cross-link' },
      { from: 'sustained 5-HT2A → mTOR', to: 'PFC synaptogenesis (24–48 h)', via: 'rapid, mTOR-dependent; persists weeks (ketamine-like mechanism)' },
    ],
    modulators: [
      { slug: 'psilocybin',    effect: 'activator', target: '5-HT2A agonist (via psilocin)', note: 'COMP360 / TRD pipeline; phase 3' },
      { slug: 'lsd',           effect: 'activator', target: '5-HT2A + 5-HT1A + D2 partial', note: 'long receptor residence (~12 h subjective trip)' },
      { slug: 'dmt',           effect: 'activator', target: '5-HT2A + σ1 (acute, short duration)' },
      { slug: 'mdma',          effect: 'activator', target: 'serotonin release + 5-HT2A indirect', note: 'entactogen vs psychedelic — distinct subjective profile' },
      { slug: 'mescaline',     effect: 'activator', target: '5-HT2A + 5-HT2C' },
      { slug: 'trazodone',     effect: 'inhibitor', target: '5-HT2A antagonist + SARI', note: 'sedation + low-dose insomnia use comes from 5-HT2A antagonism' },
      { slug: 'mirtazapine',   effect: 'inhibitor', target: '5-HT2A + H1 + α2 — atypical antidep' },
      { slug: 'risperidone',   effect: 'inhibitor', target: '5-HT2A + D2 — atypical antipsychotic' },
      { slug: 'olanzapine',    effect: 'inhibitor', target: '5-HT2A + D2 + H1 — atypical' },
      { slug: 'clozapine',     effect: 'inhibitor', target: '5-HT2A + D2 + many; gold-standard for TRD' },
      { slug: 'aripiprazole',  effect: 'inhibitor', target: '5-HT2A partial agonist + D2 partial agonist' },
      { slug: 'brexpiprazole', effect: 'inhibitor', target: '5-HT2A + D2 partial agonists' },
      { slug: 'cariprazine',   effect: 'inhibitor', target: '5-HT2A + D3-preferring partial agonist' },
    ],
    refs: [
      'PMID:26841800', // Nichols 2016 Pharmacol Rev — Psychedelics (canonical)
    ],
  },

  {
    slug: 'mglur_metabotropic_glutamate',
    name: 'Metabotropic glutamate receptors (mGluR I/II/III)',
    category: 'signaling',
    systems: ['nervous'],
    description:
      `Metabotropic glutamate receptors (mGluR1–8) are class C GPCRs — distinct from the fast ionotropic AMPA/NMDA/kainate channels. Three families with distinct G-protein coupling and synaptic localization: Group I (mGluR1, mGluR5) — Gq-coupled, postsynaptic, depolarizing — drives synaptic plasticity, LTD, Fragile-X synthesis; positive modulators trialed for cognition; negative modulators (mavoglurant — fragile X failed). Group II (mGluR2, mGluR3) — Gi/o-coupled, presynaptic autoreceptors — inhibit glutamate release; agonists (LY379268, LY2140023 — pomaglumetad) trialed for schizophrenia + anxiety; reverses 5-HT2A psychedelic effects (ketanserin/mGluR2 agonist crosstalk). Group III (mGluR4/6/7/8) — Gi/o, presynaptic + mGluR6 in retinal ON-bipolar cells; allosteric agonists trialed for Parkinson + anxiety. Distinct from iGluRs in being slower, modulatory, and pharmacologically tractable via allosteric sites (less off-target than the orthosteric glutamate site). Clinical relevance: ketamine\'s rapid antidepressant action involves disinhibition of glutamate release → AMPA → BDNF/mTOR (cross-link); group II agonists antagonize this (perampanel + LY379268). Riluzole (ALS) inhibits glutamate release in part through group I mGluR modulation. Fragile X is the prototypical mGluR-disorder (Bear hypothesis — excess mGluR5-LTD → phenotype; mGluR5 NAMs trialed but mostly failed). Cross-links: [[glutamate_receptor_pharmacology]] (parent), [[bdnf_trkb_neurotrophic]] (downstream of ketamine/glutamate disinhibition), [[serotonin_5ht2a_psychedelic_signaling]] (mGluR2 cross-talk).`,
    steps: [
      { from: 'glutamate (synaptic spillover)', to: 'mGluR I (mGluR1, mGluR5) — postsynaptic Gq', via: '→ PLC → IP3 + DAG; depolarizing; LTD' },
      { from: 'glutamate (presynaptic autoreceptor)', to: 'mGluR II (mGluR2, mGluR3) — Gi/o', via: '→ ↓cAMP + ↓Ca²⁺ channels → ↓glutamate release (negative feedback)' },
      { from: 'glutamate (presynaptic + retinal ON)', to: 'mGluR III (mGluR4/6/7/8) — Gi/o', via: 'mGluR6 obligate for retinal ON-bipolar cells (CSNB1 disease)' },
      { from: 'mGluR2 activation', to: '5-HT2A psychedelic effect dampening', via: 'mGluR2-5-HT2A heteromer or downstream antagonism — therapeutic for managing trip intensity' },
      { from: 'NMDA blockade (ketamine)', to: 'glutamate burst → AMPA → mGluR cross-talk', via: 'paradoxical glutamate increase drives rapid antidepressant effect via BDNF/mTOR' },
    ],
    modulators: [
      { slug: 'ketamine',         effect: 'inhibitor', target: 'NMDA (upstream of mGluR cross-talk)', note: 'disinhibits glutamate → AMPA + mGluR engagement; rapid antidep mechanism' },
      { slug: 'esketamine',       effect: 'inhibitor', target: 'NMDA (S-enantiomer)' },
      { slug: 'memantine',        effect: 'inhibitor', target: 'NMDA channel-blocker; weak mGluR effect; AD' },
      { slug: 'dextromethorphan', effect: 'inhibitor', target: 'NMDA + σ1; mGluR indirect' },
      { slug: 'riluzole',         effect: 'inhibitor', target: '↓glutamate release; partial mGluR I modulation; ALS' },
      { slug: 'perampanel',       effect: 'inhibitor', target: 'AMPA antagonist (downstream of mGluR)' },
      { slug: 'lamotrigine',      effect: 'inhibitor', target: 'Na⁺ channel → ↓glutamate release (indirect mGluR upstream)' },
      { slug: 'topiramate',       effect: 'inhibitor', target: 'kainate + AMPA + Na⁺ channel — broad glutamate damping' },
      { slug: 'gabapentin',       effect: 'inhibitor', target: 'α2δ Ca channel → ↓glutamate release' },
      { slug: 'pregabalin',       effect: 'inhibitor', target: 'α2δ Ca channel → ↓glutamate release' },
      { slug: 'baclofen',         effect: 'activator', target: 'GABA-B (parallel inhibitory autoreceptor — analogous mechanism)' },
      { slug: 'psilocybin',       effect: 'activator', target: '5-HT2A → cortical glutamate → mGluR cross-talk (downstream)' },
      { slug: 'lsd',              effect: 'activator', target: '5-HT2A → cortical glutamate' },
    ],
    refs: [
      'PMID:20055706', // Niswender 2010 Annu Rev Pharmacol Toxicol — mGluR canonical review
    ],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const existing = new Set(data.map((p) => p.slug));
  let added = 0;
  let skipped = 0;
  for (const p of PATHWAYS) {
    if (existing.has(p.slug)) {
      console.log(`SKIP (already exists): ${p.slug}`);
      skipped++;
      continue;
    }
    data.push(p);
    added++;
    console.log(`ADD: ${p.slug} (${p.modulators.length} mods, ${p.refs.length} refs)`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nTotal pathways: ${data.length} (added ${added}, skipped ${skipped})`);
}

main();
