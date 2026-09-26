/**
 * 2026-05-11-wave-5a-pathway-batch-5.ts — Final batch · +18 → 80 pathways (v1.2).
 *
 * Final push hits the v8.1 spec §16.3 "80+" stretch target. Covers the
 * remaining major clinical-pharmacology surfaces not yet authored:
 * cell-death + cell-cycle + cytokine + autonomic + cardiac + renal
 * + opioid + endocannabinoid + complement + proteostasis + heme deg.
 *
 *   63. apoptosis_bcl2_axis            BAX/BAK; venetoclax (Bcl-2)
 *   64. cell_cycle_cdk                 cyclin/CDK; palbociclib + ribociclib
 *   65. autophagy_lc3_axis             ATG genes; chloroquine; rapamycin link
 *   66. complement_cascade             C1-C9; eculizumab; ravulizumab
 *   67. jak_stat_signaling             cytokine receptors; tofacitinib + ruxol + bari
 *   68. opioid_receptor_signaling      MOR/KOR/DOR; β-arrestin bias; oliceridine
 *   69. endocannabinoid_system         anandamide / 2-AG; FAAH / MAGL
 *   70. retinol_vitamin_a_metabolism   tretinoin; isotretinoin; acitretin
 *   71. heme_degradation_bilirubin     biliverdin → bilirubin → urobilinogen
 *   72. renal_tubular_transport        diuretic targets across the nephron
 *   73. cardiac_action_potential       ion channels; antiarrhythmic targets
 *   74. platelet_aggregation           ADP / TXA2 / GPIIb-IIIa; antiplatelet Rx
 *   75. tgf_beta_signaling             SMAD; fibrosis; pirfenidone / nintedanib
 *   76. hif_oxygen_sensing             HIF / PHD; roxadustat (CKD anemia)
 *   77. ubiquitin_proteasome           E1-E2-E3; bortezomib + carfilzomib
 *   78. nlrp3_inflammasome             pyroptosis; canakinumab + anakinra
 *   79. ros_oxidative_stress           NADPH oxidase + mitochondria; antioxidants
 *   80. autonomic_balance              sympathetic + parasympathetic overview
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
  slug: string; name: string;
  category: 'biosynthesis' | 'catabolism' | 'drug_metabolism' | 'signaling' | 'transport' | 'membrane' | 'endocrine_axis';
  systems: string[]; description: string;
  steps: PathwayStep[];
  modulators?: PathwayModulator[];
  refs?: string[];
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'apoptosis_bcl2_axis',
    name: 'Apoptosis (intrinsic + extrinsic) — Bcl-2 family',
    category: 'signaling',
    systems: ['immune-hematologic', 'reproductive'],
    description: 'Programmed cell death. Intrinsic (mitochondrial) pathway: pro-apoptotic BH3-only proteins (BIM, BID, PUMA, NOXA) activate effector BAX/BAK → MOMP (mitochondrial outer membrane permeabilization) → cytochrome c release → apoptosome (Apaf-1 + caspase-9) → executioner caspase-3/7. Antagonized by anti-apoptotic Bcl-2 family (BCL-2, BCL-xL, MCL-1, BCL-w). Extrinsic (death receptor): Fas/TNF/TRAIL → DISC → caspase-8 → caspase-3/7 + BID truncation (crosstalk to mitochondria). VENETOCLAX is a BH3-mimetic that selectively occupies Bcl-2\'s BH3 groove → frees pro-apoptotic effectors → triggers apoptosis in Bcl-2-dependent cancer cells (CLL, AML). Navitoclax adds BCL-xL inhibition (causes thrombocytopenia — platelets depend on BCL-xL).',
    steps: [
      { from: 'death-signal-intrinsic', to: 'bax-bak-activation', via: 'BH3-only proteins released by p53 / DNA damage / growth factor withdrawal' },
      { from: 'bax-bak-activation', to: 'cytochrome-c-release', via: 'mitochondrial outer membrane permeabilization (MOMP)' },
      { from: 'cytochrome-c-release', to: 'apoptosome', via: 'Apaf-1 + procaspase-9 oligomerization' },
      { from: 'apoptosome', to: 'executioner-caspase-activation', via: 'caspase-9 → caspase-3/7 → DNA fragmentation + cytoskeletal cleavage' },
    ],
    modulators: [
      { slug: 'venetoclax', effect: 'inhibitor', target: 'BCL-2 (BH3 mimetic) — frees BAX/BAK; CLL + AML therapy' },
    ],
    refs: [],
  },
  {
    slug: 'cell_cycle_cdk',
    name: 'Cell cycle (cyclins + CDKs)',
    category: 'signaling',
    systems: ['immune-hematologic', 'reproductive'],
    description: 'Sequential phosphorylation events drive G1 → S → G2 → M progression. Cyclin D + CDK4/6 phosphorylate Rb → releases E2F → S-phase entry. Cyclin E + CDK2 in late G1. Cyclin A + CDK2/1 in S/G2. Cyclin B + CDK1 in mitosis. p53 / p21 / p16 are major brakes. CDK4/6 INHIBITORS (palbociclib, ribociclib, abemaciclib) block G1 → S in HR+/HER2− metastatic breast cancer — synergistic with aromatase inhibitors or fulvestrant. AURORA + PLK1 kinases coordinate mitosis. Chemotherapy targets: taxanes stabilize microtubules (M); vinca alkaloids depolymerize (M); 5-FU / methotrexate hit S; etoposide blocks topo II in G2/M.',
    steps: [
      { from: 'mitogen-signaling', to: 'cyclin-d-cdk4-6', via: 'growth factor → MAPK → cyclin D transcription' },
      { from: 'cyclin-d-cdk4-6', to: 'rb-phosphorylation', via: 'CDK4/6 phosphorylates Rb — PALBOCICLIB TARGET' },
      { from: 'rb-phosphorylation', to: 'e2f-release', via: 'frees E2F → S-phase gene transcription' },
      { from: 'e2f-release', to: 's-phase-entry', via: 'cyclin E + CDK2; DNA replication initiation' },
    ],
    refs: [],
  },
  {
    slug: 'autophagy_lc3_axis',
    name: 'Autophagy (macroautophagy)',
    category: 'catabolism',
    systems: ['endocrine', 'musculoskeletal', 'nervous'],
    description: 'Cellular self-eating — bulk degradation of cytoplasmic content via autophagosome → lysosome fusion. Regulated by mTORC1 (active mTORC1 INHIBITS autophagy; nutrient deprivation / rapamycin / metformin via AMPK activates it). Initiation: ULK1 complex. Nucleation: PI3K complex (Beclin-1 / VPS34). Elongation: ATG12-ATG5 conjugation + LC3 (MAP1LC3B) lipidation to PE on autophagosome membrane. Cargo capture (selective autophagy uses adaptors: p62/SQSTM1 for ubiquitinated cargo; NIX for mitochondria = mitophagy; nuclear/ER-phagy variants). Fusion with lysosome → autolysosome → cargo degraded by lysosomal hydrolases. Chloroquine + hydroxychloroquine inhibit autophagosome-lysosome fusion (basis for some cancer trial uses + part of antimalarial mechanism).',
    steps: [
      { from: 'nutrient-stress-or-rapamycin', to: 'ulk1-activation', via: 'mTORC1 inhibition releases ULK1 (also AMPK directly activates ULK1)' },
      { from: 'ulk1-activation', to: 'phagophore-nucleation', via: 'PI3K complex (Beclin-1 / VPS34)' },
      { from: 'phagophore-nucleation', to: 'autophagosome', via: 'ATG12-ATG5 + LC3 lipidation; cargo capture via p62/SQSTM1' },
      { from: 'autophagosome', to: 'lysosomal-degradation', via: 'autophagosome-lysosome fusion (HOPS complex) → autolysosome — CHLOROQUINE-BLOCKED' },
    ],
    modulators: [
      { slug: 'rapamycin', effect: 'activator', target: 'mTORC1 inhibition → autophagy ON' },
      { slug: 'everolimus', effect: 'activator', target: 'mTORC1 inhibition (same pathway)' },
      { slug: 'metformin', effect: 'activator', target: 'AMPK → ULK1 (mTOR-independent autophagy induction)' },
    ],
    refs: [],
  },
  {
    slug: 'complement_cascade',
    name: 'Complement cascade (classical + alternative + lectin)',
    category: 'signaling',
    systems: ['immune-hematologic'],
    description: 'Plasma protease cascade with three activation arms converging on C3 cleavage → C5 cleavage → MAC (C5b-9 membrane attack complex). Classical: C1q recognizes antibody-antigen → C1r/s → C4 + C2 → C3 convertase. Alternative: spontaneous C3 tickover, accelerated by surfaces lacking host regulators (DAF, MCP, FH). Lectin: MBL recognizes microbial mannose → MASP → same C4/C2 cleavage. PNH (paroxysmal nocturnal hemoglobinuria) lacks GPI-anchored DAF + CD59 on RBCs → uncontrolled alternative-pathway complement activation → intravascular hemolysis. ECULIZUMAB (anti-C5) prevents C5 cleavage → no MAC formation → PNH + atypical HUS treatment. RAVULIZUMAB is longer-half-life eculizumab analog. Iptacopan is a newer oral factor B inhibitor (alternative pathway).',
    steps: [
      { from: 'pattern-recognition', to: 'c3-convertase', via: 'classical (C1q → C4 + C2) or alternative (C3b tickover) or lectin (MBL → MASP) arms converge' },
      { from: 'c3-convertase', to: 'c3a-c3b', via: 'C3 cleavage — central amplification step' },
      { from: 'c3b', to: 'c5-convertase', via: 'C3b joins C3 convertase → C5 convertase' },
      { from: 'c5-convertase', to: 'mac-c5b-9', via: 'C5 cleavage → C5b + C6-C9 = MAC; cell lysis — ECULIZUMAB BLOCKS C5' },
    ],
    refs: [],
  },
  {
    slug: 'jak_stat_signaling',
    name: 'JAK-STAT signaling',
    category: 'signaling',
    systems: ['immune-hematologic'],
    description: 'Cytokine receptor → JAK → STAT → nuclear → transcription. Cytokine binding triggers receptor dimerization → JAK (1/2/3/TYK2) cross-phosphorylation → JAK phosphorylates the receptor cytoplasmic tail → STAT (1-6) recruited via SH2 → STAT phosphorylated → dimerizes → nuclear translocation → DNA binding → gene transcription. Receptor-JAK pairings: IFN-γ → JAK1/2 → STAT1; IL-6 family → JAK1/TYK2 → STAT3; IL-2/4/7/9/15/21 → JAK1/3 → STAT5/6; thrombopoietin/erythropoietin → JAK2 → STAT5. JAK INHIBITORS: tofacitinib (JAK1/3), baricitinib (JAK1/2), upadacitinib (JAK1-selective), ruxolitinib (JAK1/2 — myelofibrosis, PV, GVHD), fedratinib (JAK2). Class warning: MACE / VTE / malignancy (ORAL Surveillance trial).',
    steps: [
      { from: 'cytokine-receptor-engagement', to: 'jak-activation', via: 'receptor dimerization → JAK cross-phosphorylation' },
      { from: 'jak-activation', to: 'stat-phosphorylation', via: 'JAK phosphorylates receptor cytoplasmic tail + recruits STAT via SH2' },
      { from: 'stat-phosphorylation', to: 'stat-dimer-nuclear', via: 'STAT dimerization → nuclear translocation' },
      { from: 'stat-dimer-nuclear', to: 'transcription', via: 'STAT dimer binds GAS / ISRE / IFN-stim response elements → cytokine + survival gene expression' },
    ],
    modulators: [
      { slug: 'tofacitinib', effect: 'inhibitor', target: 'JAK1 + JAK3 (UC, RA, PsA)' },
      { slug: 'baricitinib', effect: 'inhibitor', target: 'JAK1 + JAK2 (RA, alopecia areata)' },
      { slug: 'upadacitinib', effect: 'inhibitor', target: 'JAK1-selective (RA, AD, UC, CD)' },
      { slug: 'ruxolitinib', effect: 'inhibitor', target: 'JAK1 + JAK2 (myelofibrosis, PV, GVHD)' },
    ],
    refs: [],
  },
  {
    slug: 'opioid_receptor_signaling',
    name: 'Opioid receptor signaling (MOR / KOR / DOR)',
    category: 'signaling',
    systems: ['nervous'],
    description: 'Gi/o-coupled GPCRs activated by endogenous opioid peptides (β-endorphin, enkephalins, dynorphins) and exogenous opioid drugs. Downstream: Gi/o → adenylyl cyclase inhibition → reduced cAMP + PKA; Gβγ → opens K+ channels (hyperpolarization) + closes Ca2+ channels (reduces neurotransmitter release). MOR = analgesia + euphoria + respiratory depression + constipation + miosis (the canonical opioid effects). KOR = spinal analgesia + dysphoria + sedation + diuresis. DOR = mood + minor analgesia. β-arrestin recruitment vs G-protein activation underlies "biased agonism" — OLICERIDINE is a MOR G-protein-biased agonist with less β-arrestin recruitment, marketed claim of less respiratory depression per analgesic equivalent (clinical evidence modest). Mixed agonists/antagonists (NALBUPHINE κ + MOR-partial; BUPRENORPHINE MOR-partial) have a ceiling effect on respiratory depression. NALOXONE / naltrexone are antagonists at all three.',
    steps: [
      { from: 'opioid-receptor-agonist', to: 'gi-go-activation', via: 'MOR / KOR / DOR; conformational change → Gi/o exchange' },
      { from: 'gi-go-activation', to: 'adenylyl-cyclase-inhibition', via: 'reduced cAMP → reduced PKA → multiple downstream' },
      { from: 'gi-go-activation', to: 'k-channel-opening-ca-closing', via: 'Gβγ → hyperpolarization + reduced presynaptic Ca2+ → neurotransmitter release ↓' },
    ],
    modulators: [
      { slug: 'morphine', effect: 'activator', target: 'MOR full agonist' },
      { slug: 'oxycodone', effect: 'activator', target: 'MOR full agonist' },
      { slug: 'buprenorphine', effect: 'activator', target: 'MOR partial agonist + κ antagonist; ceiling on respiratory depression' },
      { slug: 'nalbuphine', effect: 'activator', target: 'KOR agonist + MOR partial agonist/antagonist' },
      { slug: 'naloxone', effect: 'inhibitor', target: 'MOR + KOR + DOR antagonist (reversal)' },
    ],
    refs: [],
  },
  {
    slug: 'endocannabinoid_system',
    name: 'Endocannabinoid system (CB1/CB2 + anandamide + 2-AG)',
    category: 'signaling',
    systems: ['nervous', 'immune-hematologic', 'digestive'],
    description: 'On-demand lipid neurotransmitter system. Endogenous ligands synthesized from membrane phospholipids in postsynaptic neurons + immune cells: anandamide (N-arachidonoylethanolamine, AEA) via NAPE-PLD; 2-AG (2-arachidonoylglycerol) via DAGL. Retrograde signaling: endocannabinoids cross synapse to act on presynaptic CB1 (CNS) or peripheral CB2 (immune) — Gi/o-coupled → reduces neurotransmitter release. Degradation: AEA → FAAH (fatty acid amide hydrolase) → arachidonic acid + ethanolamine; 2-AG → MAGL (monoacylglycerol lipase) → AA + glycerol. Pharmacology: THC = partial CB1/CB2 agonist; CBD = weak CB receptor activity + multi-target (TRPV1, 5-HT1A, PPAR); rimonabant (withdrawn — psychiatric side effects) was a CB1 antagonist for obesity. FAAH inhibitors (BIA 10-2474 — fatal trial; others in development) raise endogenous AEA.',
    steps: [
      { from: 'postsynaptic-depolarization', to: 'endocannabinoid-release', via: 'AEA (NAPE-PLD) + 2-AG (DAGL) synthesized on demand from membrane lipids' },
      { from: 'endocannabinoid-release', to: 'presynaptic-cb1', via: 'retrograde diffusion to CB1 (CNS) or CB2 (immune); Gi/o-coupled' },
      { from: 'anandamide', to: 'arachidonic-acid', via: 'FAAH degradation; raises arachidonic pool' },
      { from: '2-ag', to: 'arachidonic-acid-glycerol', via: 'MAGL degradation' },
    ],
    refs: [],
  },
  {
    slug: 'retinol_vitamin_a_metabolism',
    name: 'Retinol / vitamin A metabolism',
    category: 'biosynthesis',
    systems: ['integumentary', 'reproductive', 'nervous'],
    description: 'Dietary retinyl esters / β-carotene → retinol (vitamin A) → retinaldehyde (RDH enzymes; reversible) → retinoic acid (RALDH; irreversible). Retinoic acid binds RAR (nuclear receptor) → controls hundreds of genes in differentiation, embryogenesis, vision, immune function. Photoreceptor cycle: 11-cis-retinal + opsin = rhodopsin → light → all-trans-retinal + isomerization back to 11-cis by RPE65 (target of LUXTURNA gene therapy for LCA). Pharmacology: tretinoin (all-trans retinoic acid) = APL (acute promyelocytic leukemia) treatment + topical for acne / photoaging; isotretinoin (13-cis) = severe nodulocystic acne (teratogenic; iPLEDGE program); acitretin = psoriasis. Vitamin A deficiency causes xerophthalmia (preventable blindness in low-resource settings) — major WHO supplementation target.',
    steps: [
      { from: 'beta-carotene', to: 'retinol', via: 'intestinal BCO1 cleavage; alternative source to dietary retinyl esters' },
      { from: 'retinol', to: 'retinaldehyde', via: 'RDH (retinol dehydrogenase) — reversible' },
      { from: 'retinaldehyde', to: 'retinoic-acid', via: 'RALDH — irreversible; tissue-restricted (limb buds, immune cells)' },
      { from: 'retinoic-acid', to: 'rar-rxr-binding', via: 'nuclear receptor binding → RARE-driven transcription' },
    ],
    refs: [],
  },
  {
    slug: 'heme_degradation_bilirubin',
    name: 'Heme degradation (bilirubin axis)',
    category: 'catabolism',
    systems: ['immune-hematologic', 'digestive'],
    description: 'Senescent RBCs phagocytosed by reticuloendothelial macrophages → heme oxygenase (HO-1 inducible + HO-2 constitutive) cleaves heme → biliverdin + CO (free!) + Fe2+ (recycled via transferrin). Biliverdin reductase → unconjugated bilirubin (lipid-soluble, albumin-bound). Hepatic uptake → UGT1A1 conjugation with glucuronic acid → conjugated bilirubin (water-soluble; biliary excretion). Intestinal bacteria deconjugate + reduce to urobilinogen → ~80% excreted as stercobilin (fecal color); ~20% absorbed + recycled / renally excreted as urobilinogen (urine color). Clinical: Gilbert syndrome = UGT1A1 promoter polymorphism → mild unconjugated hyperbilirubinemia (~5% population; benign; can present with fasting/stress jaundice); Crigler-Najjar = severe UGT1A1 deficiency (autosomal recessive). Atazanavir + indinavir inhibit UGT1A1 → unconjugated hyperbilirubinemia + scleral icterus (benign).',
    steps: [
      { from: 'heme', to: 'biliverdin', via: 'heme oxygenase (HO-1 + HO-2); releases CO + Fe2+' },
      { from: 'biliverdin', to: 'unconjugated-bilirubin', via: 'biliverdin reductase' },
      { from: 'unconjugated-bilirubin', to: 'conjugated-bilirubin', via: 'UGT1A1 — GILBERT / CRIGLER-NAJJAR enzyme; ATAZANAVIR-INHIBITED' },
      { from: 'conjugated-bilirubin', to: 'urobilinogen', via: 'intestinal bacterial deconjugation + reduction; excretion + EHC' },
    ],
    modulators: [
      { slug: 'atazanavir', effect: 'inhibitor', target: 'UGT1A1 (off-target; benign Gilbert-like hyperbilirubinemia)' },
    ],
    refs: [],
  },
  {
    slug: 'renal_tubular_transport',
    name: 'Renal tubular transport (diuretic targets)',
    category: 'transport',
    systems: ['renal', 'cardiovascular'],
    description: 'Nephron sequence: proximal tubule (PT) reabsorbs ~67% of filtered Na+ via Na+/H+ exchange + co-transport (the SGLT2 site for glucose — empagliflozin / dapagliflozin / canagliflozin targets here; also carbonic anhydrase, acetazolamide target). Thick ascending limb of Henle (TAL): NKCC2 (Na/K/2Cl cotransporter) — FUROSEMIDE / bumetanide / torsemide target. Distal convoluted tubule (DCT): NCC (Na/Cl cotransporter) — THIAZIDE diuretics target. Cortical collecting duct (CCD): ENaC (epithelial sodium channel) — amiloride + triamterene block directly; SPIRONOLACTONE + eplerenone block upstream mineralocorticoid receptor → reduced ENaC expression. Net diuretic potency: SGLT2i < CA-i < thiazide < loop; K-sparing reduces K+ wasting that the others produce.',
    steps: [
      { from: 'glomerular-filtrate', to: 'pt-reabsorption', via: 'Na+/H+ + SGLT2 + carbonic anhydrase — SGLT2i + acetazolamide targets' },
      { from: 'pt-reabsorption', to: 'tal-reabsorption', via: 'NKCC2 (Na/K/2Cl) — LOOP DIURETIC target' },
      { from: 'tal-reabsorption', to: 'dct-reabsorption', via: 'NCC (Na/Cl) — THIAZIDE target' },
      { from: 'dct-reabsorption', to: 'ccd-fine-tuning', via: 'ENaC (amiloride/triamterene) + aldosterone (spironolactone/eplerenone)' },
    ],
    modulators: [
      { slug: 'furosemide', effect: 'inhibitor', target: 'NKCC2 (loop diuretic)' },
      { slug: 'empagliflozin', effect: 'inhibitor', target: 'SGLT2 (proximal tubule)' },
      { slug: 'dapagliflozin', effect: 'inhibitor', target: 'SGLT2' },
      { slug: 'spironolactone', effect: 'inhibitor', target: 'MR (upstream of ENaC)' },
      { slug: 'eplerenone', effect: 'inhibitor', target: 'MR (selective)' },
    ],
    refs: [],
  },
  {
    slug: 'cardiac_action_potential',
    name: 'Cardiac action potential (ion channels + antiarrhythmic targets)',
    category: 'signaling',
    systems: ['cardiovascular'],
    description: 'Ventricular AP has 5 phases. Phase 0 (rapid depolarization): voltage-gated Na+ channels (Nav1.5) — CLASS I antiarrhythmics block (Ia quinidine + procainamide; Ib lidocaine + mexiletine; Ic flecainide + propafenone). Phase 1 (early repolarization): Ito1 transient outward K+. Phase 2 (plateau): L-type Ca2+ current — CLASS IV CCBs (verapamil + diltiazem) block here. Phase 3 (repolarization): IKr (hERG, KCNH2 = Kv11.1) + IKs (KCNQ1) — CLASS III (sotalol + dofetilide + ibutilide + amiodarone) block IKr → QT prolongation. Phase 4 (resting potential): inward rectifier IK1 maintains. SA + AV node: β1-AR controls If "funny current" pacemaker — β-BLOCKERS (CLASS II) slow rate. Genetic LQTS: KCNH2 LOF (LQT2, drug-induced TdP susceptibility), KCNQ1 LOF (LQT1), SCN5A GOF (LQT3).',
    steps: [
      { from: 'phase-0-depolarization', to: 'phase-1-early-repolarization', via: 'Nav1.5 opens; Ito1 closes; CLASS I antiarrhythmic target' },
      { from: 'phase-1-early-repolarization', to: 'phase-2-plateau', via: 'L-type Ca2+ inward + Ito1 declining; CCB target' },
      { from: 'phase-2-plateau', to: 'phase-3-repolarization', via: 'IKr (hERG) + IKs activate; CLASS III antiarrhythmic + drug-induced TdP target' },
      { from: 'phase-3-repolarization', to: 'phase-4-resting', via: 'IK1 inward rectifier; If pacemaker in SA/AV nodes; β-BLOCKER target' },
    ],
    refs: [],
  },
  {
    slug: 'platelet_aggregation',
    name: 'Platelet aggregation (ADP + TXA2 + GPIIb-IIIa)',
    category: 'signaling',
    systems: ['immune-hematologic', 'cardiovascular'],
    description: 'Three reinforcing activation loops. (1) Thromboxane A2 from platelet COX-1: aspirin irreversibly acetylates COX-1 → no TXA2 for the platelet\'s 7-10 d life span. (2) ADP from dense granules → P2Y12 receptor (Gi-coupled) → CLOPIDOGREL (irreversible, prodrug requiring CYP2C19 activation), PRASUGREL (irreversible, more reliable activation), TICAGRELOR (reversible, direct); cangrelor IV. (3) Thrombin → PAR1 (vorapaxar antagonist). Final common path: αIIbβ3 (GPIIb-IIIa) conformational change → fibrinogen binding → cross-linking + aggregation. Abciximab + eptifibatide + tirofiban block αIIbβ3 (PCI use). Combined antiplatelet: dual = aspirin + P2Y12i (standard post-PCI; CV mortality benefit). Bleeding risk scales with intensity + number of agents.',
    steps: [
      { from: 'platelet-activation', to: 'txa2-release', via: 'COX-1 (platelet) → TXA2; ASPIRIN-INHIBITED (irreversibly)' },
      { from: 'platelet-activation', to: 'adp-release', via: 'dense granule exocytosis → P2Y12 on neighboring platelets; CLOPIDOGREL / TICAGRELOR target' },
      { from: 'platelet-activation', to: 'thrombin-par1', via: 'thrombin generation + PAR1 cleavage; vorapaxar antagonist' },
      { from: 'platelet-activation', to: 'gpiib-iiia-binding', via: 'αIIbβ3 conformational change → fibrinogen cross-linking; ABCIXIMAB blocks' },
    ],
    modulators: [
      { slug: 'aspirin', effect: 'inhibitor', target: 'COX-1 (platelet TXA2) — irreversible for life of platelet' },
      { slug: 'clopidogrel', effect: 'inhibitor', target: 'P2Y12 — irreversible; CYP2C19 activation required' },
      { slug: 'ticagrelor', effect: 'inhibitor', target: 'P2Y12 — reversible direct' },
      { slug: 'prasugrel', effect: 'inhibitor', target: 'P2Y12 — irreversible; more reliable activation than clopidogrel' },
    ],
    refs: [],
  },
  {
    slug: 'tgf_beta_signaling',
    name: 'TGF-β signaling (SMAD axis + fibrosis)',
    category: 'signaling',
    systems: ['immune-hematologic', 'respiratory', 'integumentary'],
    description: 'Transforming growth factor β family ligands → type II + type I serine/threonine kinase receptors → R-SMAD (SMAD2/3) phosphorylation → R-SMAD + co-SMAD (SMAD4) complex → nuclear translocation → transcription of ECM genes (collagen, fibronectin, integrins) + EMT genes. Master driver of FIBROSIS in IPF, hepatic, renal, scleroderma, post-surgical scarring. Pharmacology: pirfenidone (multimodal antifibrotic, partly anti-TGF-β; approved for IPF + slows FVC decline); nintedanib (multi-kinase inhibitor PDGFR + FGFR + VEGFR; reduces IPF FVC decline). Direct TGF-β neutralization (fresolimumab, etc.) trialed in fibrosis + oncology with mixed results. Bone morphogenetic proteins (BMPs) are TGF-β family but signal through SMAD1/5/8.',
    steps: [
      { from: 'tgf-beta-ligand', to: 'tgfbr1-tgfbr2-activation', via: 'ligand binds type II receptor → recruits + phosphorylates type I' },
      { from: 'tgfbr1-tgfbr2-activation', to: 'smad2-smad3-phosphorylation', via: 'type I receptor kinase domain phosphorylates R-SMAD' },
      { from: 'smad2-smad3-phosphorylation', to: 'smad2-3-4-complex-nuclear', via: 'R-SMAD + SMAD4 oligomerization → nuclear translocation' },
      { from: 'smad2-3-4-complex-nuclear', to: 'ecm-gene-transcription', via: 'collagen + fibronectin + integrin gene induction → fibrosis' },
    ],
    refs: [],
  },
  {
    slug: 'hif_oxygen_sensing',
    name: 'HIF / oxygen-sensing axis',
    category: 'signaling',
    systems: ['immune-hematologic', 'cardiovascular', 'renal'],
    description: 'Cells sense O2 via PHD (prolyl hydroxylase) enzymes that hydroxylate HIF-α (HIF-1α + HIF-2α) on conserved prolines using O2 + α-ketoglutarate. Normoxia: hydroxylated HIF-α is recognized by VHL E3 ligase → ubiquitinated → proteasome. Hypoxia: PHD has no O2 substrate → HIF-α accumulates → binds HIF-β → nuclear → HRE-driven transcription of EPO, VEGF, glycolytic enzymes (Warburg effect), GLUT1. Tumor angiogenesis + Warburg metabolism = pathological HIF activation. HIF-PHD INHIBITORS (roxadustat, vadadustat, daprodustat) stabilize HIF → endogenous EPO synthesis without rhEPO injection → orally treat CKD anemia (alternative to ESA therapy). Phase 3 + post-marketing safety remains under scrutiny (CV signal in some trials).',
    steps: [
      { from: 'hif-alpha-protein', to: 'hif-alpha-hydroxylated', via: 'PHD1/2/3 prolyl hydroxylation; requires O2 + α-KG + Fe2+ + ascorbate' },
      { from: 'hif-alpha-hydroxylated', to: 'vhl-degradation', via: 'VHL E3 ligase → ubiquitin → proteasome (normoxia outcome)' },
      { from: 'hif-alpha-stabilized', to: 'epo-vegf-glycolytic-transcription', via: 'hypoxia → no PHD action → HIF-α stabilized → HRE binding' },
    ],
    refs: [],
  },
  {
    slug: 'ubiquitin_proteasome',
    name: 'Ubiquitin-proteasome degradation (E1 + E2 + E3 + 26S)',
    category: 'catabolism',
    systems: ['immune-hematologic', 'nervous'],
    description: 'Primary cellular protein degradation pathway. E1 activates ubiquitin (ATP-dependent thioester); E2 conjugating enzymes carry activated ubiquitin; E3 ligases (~600 in humans — APC/C, SCF, MDM2, VHL, RNF, etc.) determine substrate specificity. Substrate proteins receive K48-linked polyubiquitin chains → recognized by the 19S regulatory cap of the 26S proteasome → unfolding + threading + 20S core proteolysis → peptides. Distinct K63-linked ubiquitination signals trafficking + autophagy, not degradation. Pharmacology: BORTEZOMIB (Velcade) + CARFILZOMIB + IXAZOMIB = 26S proteasome inhibitors for multiple myeloma + mantle cell lymphoma (myeloma plasma cells are exquisitely dependent on protein turnover). Thalidomide / lenalidomide / pomalidomide bind cereblon → redirect CRBN E3 ligase to ubiquitinate IKZF1/3 (immunomodulatory mechanism for myeloma + MDS).',
    steps: [
      { from: 'substrate-protein', to: 'monoubiquitinated', via: 'E1 → E2 → E3 ligase (substrate-specific)' },
      { from: 'monoubiquitinated', to: 'polyubiquitinated-k48', via: 'chain elongation (E4 enzymes + processive E2-E3)' },
      { from: 'polyubiquitinated-k48', to: 'proteasomal-peptides', via: '26S proteasome — BORTEZOMIB / CARFILZOMIB target' },
    ],
    refs: [],
  },
  {
    slug: 'nlrp3_inflammasome',
    name: 'NLRP3 inflammasome (pyroptosis + IL-1β)',
    category: 'signaling',
    systems: ['immune-hematologic'],
    description: 'Multi-protein cytoplasmic complex activated by danger signals (urate crystals, cholesterol crystals, ATP, β-amyloid, viral RNA). Two-signal model: Signal 1 (priming) — TLR/NF-κB upregulates NLRP3 + pro-IL-1β + pro-IL-18 transcripts. Signal 2 (activation) — NLRP3 oligomerizes + recruits ASC + procaspase-1 → autoactivation → CASPASE-1. Outputs: (1) cleaves pro-IL-1β + pro-IL-18 to mature cytokines → secretion. (2) Cleaves gasdermin D (GSDMD) → N-terminus oligomerizes in plasma membrane → pyroptotic pore + cytokine release + cell death. Disease: gout (urate crystals), atherosclerosis (cholesterol crystals; CANTOS canakinumab trial showed CV event reduction); CAPS (CIAS1/NLRP3 GOF mutations; treated with anakinra IL-1RA, rilonacept IL-1 trap, or canakinumab anti-IL-1β mAb).',
    steps: [
      { from: 'tlr-priming-signal', to: 'nlrp3-pro-il1b-upregulated', via: 'NF-κB-driven transcription (signal 1)' },
      { from: 'danger-signal', to: 'nlrp3-activation', via: 'crystals + ATP + reactive oxygen → NLRP3 conformation (signal 2)' },
      { from: 'nlrp3-activation', to: 'caspase-1-activation', via: 'NLRP3 + ASC + procaspase-1 oligomerization → caspase-1 autoactivation' },
      { from: 'caspase-1-activation', to: 'il-1beta-secretion', via: 'cleaves pro-IL-1β to mature IL-1β + GSDMD → pyroptotic pore' },
    ],
    modulators: [
      { slug: 'allopurinol', effect: 'inhibitor', target: 'upstream urate crystal substrate (gout prevention)' },
      { slug: 'colchicine', effect: 'inhibitor', target: 'NLRP3 inflammasome assembly + microtubule effects on neutrophil migration' },
    ],
    refs: [],
  },
  {
    slug: 'ros_oxidative_stress',
    name: 'Reactive oxygen species (ROS) + oxidative stress',
    category: 'signaling',
    systems: ['immune-hematologic', 'cardiovascular', 'nervous'],
    description: 'Reactive oxygen + nitrogen species (superoxide O2•−, hydrogen peroxide H2O2, hydroxyl •OH, peroxynitrite ONOO−). Sources: (1) mitochondrial ETC leak at Complex I + III; (2) NADPH oxidase (NOX family — NOX2 in neutrophils for respiratory burst; NOX4 widely expressed); (3) xanthine oxidase; (4) NOS uncoupling (eNOS without BH4 makes O2•− instead of NO). Defenses: superoxide dismutase (SOD1 cytosol, SOD2 mitochondria) → H2O2 → catalase + glutathione peroxidase (selenium) + peroxiredoxins (thioredoxin-dependent). Glutathione + NADPH + vitamin C + vitamin E + bilirubin = small-molecule antioxidants. Pathologic ROS underlies ischemia-reperfusion injury, neurodegeneration, atherosclerosis. NRF2-KEAP1 axis induces antioxidant gene transcription (sulforaphane activator; dimethyl fumarate for MS).',
    steps: [
      { from: 'electron-transport-leak', to: 'superoxide', via: 'Complex I + III leak (1-2% of O2 reduced this way)' },
      { from: 'superoxide', to: 'hydrogen-peroxide', via: 'SOD1 (Cu/Zn cytosol) + SOD2 (Mn mitochondria) dismutation' },
      { from: 'hydrogen-peroxide', to: 'water', via: 'catalase (peroxisomal) + GPx (selenium, glutathione-coupled)' },
    ],
    refs: [],
  },
  {
    slug: 'autonomic_balance',
    name: 'Autonomic nervous system balance (sympathetic + parasympathetic)',
    category: 'signaling',
    systems: ['nervous', 'cardiovascular', 'digestive', 'respiratory'],
    description: 'Two-arm coordination of involuntary visceral function. Sympathetic: thoracolumbar pre-ganglionic neurons → ganglion → post-ganglionic norepinephrine → α1 (vasoconstriction), α2 (presynaptic inhibition + CNS sedation), β1 (heart rate + contractility), β2 (bronchodilation + vasodilation), β3 (lipolysis). Adrenal medulla = modified sympathetic ganglion releasing epinephrine systemically. Parasympathetic: craniosacral pre-ganglionic → ganglion (close to target organ) → post-ganglionic acetylcholine → M2 (heart — bradycardia), M3 (smooth muscle contraction + glandular secretion). Pharmacology: α1-blockers (prazosin, tamsulosin) — BPH + HTN; α2-agonists (clonidine, dexmedetomidine) — central sympathetic suppression + sedation; β1-blockers (metoprolol, atenolol) — CV; β2-agonists (albuterol) — asthma; antimuscarinics (atropine, oxybutynin, glycopyrrolate) — OAB, bradycardia rescue, secretion drying.',
    steps: [
      { from: 'sympathetic-activation', to: 'norepinephrine-release', via: 'post-ganglionic sympathetic neurons (thoracolumbar)' },
      { from: 'norepinephrine-release', to: 'alpha-beta-receptor-activation', via: 'α1 vasoconstriction; β1 cardiac; β2 vasodilation/bronchodilation; α2 negative feedback' },
      { from: 'parasympathetic-activation', to: 'acetylcholine-release', via: 'post-ganglionic parasympathetic neurons (craniosacral)' },
      { from: 'acetylcholine-release', to: 'muscarinic-activation', via: 'M2 cardiac (slowing); M3 smooth muscle + glandular secretion' },
    ],
    modulators: [
      { slug: 'metoprolol', effect: 'inhibitor', target: 'β1 (sympathetic arm — HR, contractility)' },
      { slug: 'atropine', effect: 'inhibitor', target: 'muscarinic (parasympathetic arm — rescue bradycardia)' },
      { slug: 'clonidine', effect: 'activator', target: 'α2 central — sympathetic suppression + sedation' },
    ],
    refs: [],
  },
];

function main(): void {
  const existing = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8'));
  const bySlug = new Map(existing.map((p: { slug: string }) => [p.slug, p]));

  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) {
      console.log(`  [skip] ${p.slug} already exists`);
    } else {
      existing.push(p);
      added++;
      console.log(`  [add ] ${p.slug.padEnd(34)} (${p.steps.length} steps · ${p.modulators?.length ?? 0} modulators)`);
    }
  }

  existing.sort((a: { slug: string }, b: { slug: string }) => a.slug.localeCompare(b.slug));

  writeFileSync(PATHWAYS_PATH, JSON.stringify(existing, null, 2) + '\n');
  console.log(`\nWave 5a batch 5 (FINAL, v1.2): +${added} pathways → ${existing.length} total. v8.1 spec 80+ target hit.`);
}

main();
