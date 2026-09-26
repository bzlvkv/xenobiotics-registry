/**
 * 2026-05-11-wave-5a-pathway-batch-3.ts — Recon3D-aligned subsystems (v1.2).
 *
 * Recon3D's ~110 metabolic subsystems organize human biochemistry into
 * navigable groupings. Doing a true ETL pass would require parsing the
 * ~50 MB MATLAB model (Recon3D.mat) — separate plan. Instead this batch
 * authors 17 high-clinical-yield subsystems in a Recon3D-aligned style:
 * names that match BiGG/Recon3D convention, broad-stroke step chains
 * that surface the key reactions + drug targets per subsystem.
 *
 * None of these overlap with the 30 hand-authored pathways from batches
 * 1-2 + scaffolding.
 *
 * Carbohydrate (4):
 *   31. pentose_phosphate_pathway     G6PD deficiency / NADPH supply
 *   32. pyruvate_metabolism           PDH; lactic acid; alternative fates
 *   33. glycogen_metabolism           glycogenolysis + storage diseases
 *   34. inositol_phosphate_signaling  PI/IP3; lithium target (IMPA)
 *
 * Lipid (4):
 *   35. fatty_acid_biosynthesis       ACC + FAS; cytosolic; insulin-driven
 *   36. glycerophospholipid_metabolism PEMT/CDP-choline; choline supp
 *   37. sphingolipid_metabolism       ceramide; eliglustat / miglustat
 *   38. steroid_hormone_biosynthesis  CYP17 + CYP19 + 11β-HSD
 *
 * Amino acid (4):
 *   39. tyrosine_metabolism           HPP path / alkaptonuria / nitisinone
 *   40. tryptophan_metabolism         kynurenine path / IDO / quinolinic
 *   41. bcaa_metabolism               valine/leucine/isoleucine; MSUD
 *   42. glutathione_metabolism        γ-GCS; acetaminophen + NAC
 *
 * Nucleotide (2):
 *   43. pyrimidine_metabolism         5-FU / leflunomide targets
 *   44. purine_de_novo_synthesis      methotrexate / mycophenolate
 *
 * Vitamins / cofactors (2):
 *   45. niacin_nad_synthesis          NAD/NADP from tryptophan + niacin
 *   46. ubiquinone_biosynthesis       CoQ10; statin-related depletion
 *
 * Bioenergetics (1):
 *   47. oxidative_phosphorylation     Complex I-V; metformin Complex I
 *
 * Brings pathway total to 47 (out of v8.1 spec's 80+ stretch — the
 * remaining 33+ are Recon3D subsystems requiring true ETL or hand-
 * authoring of more specialized biochem axes).
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
    slug: 'pentose_phosphate_pathway',
    name: 'Pentose phosphate pathway',
    category: 'catabolism',
    systems: ['immune-hematologic', 'endocrine'],
    description: 'Cytosolic alternative glucose oxidation generating NADPH (reducing power for biosynthesis + glutathione regeneration) + ribose-5-phosphate (nucleotide precursor). Oxidative branch (irreversible): G6P → 6-phosphogluconolactone → 6-phosphogluconate → ribulose-5-P, producing 2 NADPH per G6P. Non-oxidative branch (reversible): ribulose-5-P interconverts with ribose-5-P, sedoheptulose-7-P, fructose-6-P, glyceraldehyde-3-P — balances supply between nucleotide and glycolytic demands. G6PD is rate-limiting + X-linked; deficiency is the most common human enzymopathy (~400M carriers) and produces hemolytic anemia on oxidative stress (primaquine, sulfa, fava beans, dapsone, methylene blue).',
    steps: [
      { from: 'glucose-6-phosphate', to: '6-phosphogluconolactone', via: 'G6PD — RATE-LIMITING; X-linked; common deficiency' },
      { from: '6-phosphogluconolactone', to: 'ribulose-5-phosphate', via: '6-phosphogluconate dehydrogenase (NADP+ → NADPH)' },
      { from: 'ribulose-5-phosphate', to: 'ribose-5-phosphate', via: 'phosphopentose isomerase (substrate for nucleotide synthesis)' },
    ],
    refs: [],
  },
  {
    slug: 'pyruvate_metabolism',
    name: 'Pyruvate metabolism',
    category: 'catabolism',
    systems: ['endocrine', 'musculoskeletal', 'nervous'],
    description: 'Branch point between glycolytic endpoint and TCA / fermentation / gluconeogenesis. Three fates: (1) pyruvate dehydrogenase (PDH) → acetyl-CoA (mitochondrial, irreversible; the gateway to TCA + fatty acid synthesis); (2) lactate dehydrogenase (LDH) → lactate (cytosolic; regenerates NAD+ in anaerobic conditions or in Warburg-effect tumors; type A tissues = muscle/liver, type B = heart); (3) pyruvate carboxylase → oxaloacetate (anaplerotic; mitochondrial; gluconeogenesis entry). PDH deficiency is the most common congenital lactic acidosis; thiamine deficiency (Wernicke-Korsakoff) presents partly as PDH dysfunction (TPP cofactor). Dichloroacetate (DCA) activates PDH and is investigated for MELAS + congenital lactic acidosis.',
    steps: [
      { from: 'pyruvate', to: 'acetyl-coa', via: 'PDH complex (E1 + E2 + E3 + TPP + lipoamide + FAD + NAD cofactors)' },
      { from: 'pyruvate', to: 'lactate', via: 'LDH (regenerates NAD+; anaerobic / Warburg effect)' },
      { from: 'pyruvate', to: 'oxaloacetate', via: 'pyruvate carboxylase (biotin; mitochondrial; anaplerotic)' },
    ],
    refs: [],
  },
  {
    slug: 'glycogen_metabolism',
    name: 'Glycogen synthesis + breakdown',
    category: 'biosynthesis',
    systems: ['endocrine', 'musculoskeletal', 'digestive'],
    description: 'Glycogen synthesis (glycogenesis): G6P → G1P (phosphoglucomutase) → UDP-glucose (UDP-glucose pyrophosphorylase) → glycogen extension by glycogen synthase. Glycogen breakdown (glycogenolysis): glycogen phosphorylase → G1P → G6P → fates. Liver glycogen feeds blood glucose; muscle glycogen feeds local glycolysis only (no G6Pase). Glycogen storage diseases: von Gierke (G6Pase, type I), Pompe (acid maltase, type II — only one affecting lysosomal glycogen), McArdle (muscle phosphorylase, type V). Regulation: glucagon + epinephrine activate phosphorylase via PKA cascade; insulin activates glycogen synthase via PP1.',
    steps: [
      { from: 'glucose-6-phosphate', to: 'glucose-1-phosphate', via: 'phosphoglucomutase' },
      { from: 'glucose-1-phosphate', to: 'udp-glucose', via: 'UDP-glucose pyrophosphorylase' },
      { from: 'udp-glucose', to: 'glycogen', via: 'glycogen synthase (insulin-activated)' },
      { from: 'glycogen', to: 'glucose-1-phosphate', via: 'glycogen phosphorylase (glucagon/epinephrine-activated via PKA)' },
    ],
    refs: [],
  },
  {
    slug: 'inositol_phosphate_signaling',
    name: 'Inositol phosphate / PI signaling',
    category: 'signaling',
    systems: ['nervous', 'endocrine'],
    description: 'Membrane phosphatidylinositol cycle and downstream signaling. PI(4,5)P2 is cleaved by PLC (phospholipase C, Gq-coupled or RTK-coupled) into IP3 (releases ER Ca2+ via IP3R) and DAG (activates PKC). IP3 is degraded by sequential phosphatases — inositol monophosphatase (IMPA1) is the proposed LITHIUM TARGET for bipolar disorder ("inositol depletion hypothesis"). Lithium also inhibits GSK-3β; the relative contribution of each to mood-stabilization is debated. Inositol supplementation has been investigated for PCOS, depression, and lithium-augmentation strategies (with mixed evidence). PI(3,4,5)P3 (made from PI(4,5)P2 by PI3K) is a separate signaling axis driving AKT — see mtor_signaling pathway.',
    steps: [
      { from: 'phosphatidylinositol-4-5-bisphosphate', to: 'inositol-trisphosphate', via: 'PLC β (Gq) or PLC γ (RTK) — cleaves PIP2 into IP3 + DAG' },
      { from: 'inositol-trisphosphate', to: 'inositol', via: 'sequential phosphatases; IMPA1 dephosphorylates IP1 — LITHIUM TARGET' },
      { from: 'inositol', to: 'phosphatidylinositol', via: 'PI synthase + CDP-DAG reincorporation; closes cycle' },
    ],
    modulators: [
      { slug: 'lithium', effect: 'inhibitor', target: 'IMPA1 (inositol monophosphatase) — mood-stabilizing mechanism candidate' },
    ],
    refs: [],
  },
  {
    slug: 'fatty_acid_biosynthesis',
    name: 'Fatty acid biosynthesis (de novo)',
    category: 'biosynthesis',
    systems: ['endocrine', 'digestive'],
    description: 'Cytosolic synthesis of palmitate (C16:0) from acetyl-CoA — opposite direction of mitochondrial β-oxidation. Acetyl-CoA is exported from mitochondria via citrate shuttle. Acetyl-CoA carboxylase (ACC) — RATE-LIMITING — produces malonyl-CoA (biotin-dependent; same step inhibits CPT1, preventing simultaneous synthesis + oxidation). Fatty acid synthase (FAS) is a single megaenzyme that sequentially condenses acetyl-CoA + malonyl-CoA into palmitate using NADPH (from PPP). Insulin upregulates ACC + FAS (postprandial lipogenesis). Lipogenesis inhibitors investigated for cancer (TVB-2640) and NASH.',
    steps: [
      { from: 'acetyl-coa', to: 'malonyl-coa', via: 'ACC (acetyl-CoA carboxylase) — RATE-LIMITING; biotin; also CPT1 inhibitor' },
      { from: 'malonyl-coa', to: 'palmitate', via: 'fatty acid synthase (FAS) — megaenzyme; sequential C2 extensions; NADPH consumer' },
    ],
    refs: [],
  },
  {
    slug: 'glycerophospholipid_metabolism',
    name: 'Glycerophospholipid metabolism',
    category: 'biosynthesis',
    systems: ['endocrine', 'nervous'],
    description: 'Membrane phospholipid biosynthesis from glycerol-3-phosphate via phosphatidic acid (PA) intermediate. PA → diacylglycerol (DAG; also a signaling molecule, see inositol_phosphate_signaling) → choline/ethanolamine/serine/inositol head-group attachment (Kennedy pathway: CDP-choline / CDP-ethanolamine activation). PEMT (phosphatidylethanolamine N-methyltransferase, hepatic) provides ~30% of phosphatidylcholine via 3 sequential methylations from SAM. Choline supplementation (alpha-GPC, citicoline) feeds the Kennedy pathway. Phospholipid imbalance (low PC/PE ratio) is associated with NAFLD progression. Lysophosphatidylcholine + lysophosphatidic acid are bioactive lipid mediators.',
    steps: [
      { from: 'glycerol-3-phosphate', to: 'phosphatidic-acid', via: 'GPAT + AGPAT (acyl-CoA donor)' },
      { from: 'phosphatidic-acid', to: 'diacylglycerol', via: 'PA phosphatase (lipin-1)' },
      { from: 'diacylglycerol', to: 'phosphatidylcholine', via: 'Kennedy pathway: CDP-choline + DAG → PC (CPT)' },
      { from: 'phosphatidylethanolamine', to: 'phosphatidylcholine', via: 'PEMT — hepatic; 3 sequential SAM methylations; ~30% of PC pool' },
    ],
    modulators: [
      { slug: 'alpha-gpc', effect: 'substrate', target: 'Kennedy pathway (choline supplementation)' },
      { slug: 'citicoline', effect: 'substrate', target: 'CDP-choline step (Kennedy pathway)' },
    ],
    refs: [],
  },
  {
    slug: 'sphingolipid_metabolism',
    name: 'Sphingolipid metabolism',
    category: 'biosynthesis',
    systems: ['nervous', 'immune-hematologic'],
    description: 'Sphingoid-backbone lipids — sphingomyelin (membrane), ceramide (signaling + apoptosis induction), glucosylceramide (precursor for complex glycosphingolipids + gangliosides). De novo synthesis: serine + palmitoyl-CoA → 3-ketosphinganine (SPT) → sphinganine → ceramide (CerS). Sphingomyelin synthase + glucosylceramide synthase build the complex lipids. Lysosomal storage diseases of sphingolipid degradation: Gaucher (glucocerebrosidase), Niemann-Pick A/B (acid sphingomyelinase), Fabry (α-galactosidase A), Krabbe (galactocerebrosidase), Tay-Sachs (β-hexosaminidase A). Eliglustat / miglustat are oral glucosylceramide synthase inhibitors for Gaucher (substrate reduction therapy, vs ERT alternatives).',
    steps: [
      { from: 'palmitoyl-coa', to: '3-ketosphinganine', via: 'serine palmitoyltransferase (SPT) — condenses serine + palmitoyl-CoA' },
      { from: '3-ketosphinganine', to: 'ceramide', via: 'multi-step (3-KSR + ceramide synthase + desaturase)' },
      { from: 'ceramide', to: 'sphingomyelin', via: 'sphingomyelin synthase (phosphocholine from PC)' },
      { from: 'ceramide', to: 'glucosylceramide', via: 'glucosylceramide synthase (UGCG) — ELIGLUSTAT TARGET' },
    ],
    refs: [],
  },
  {
    slug: 'steroid_hormone_biosynthesis',
    name: 'Steroid hormone biosynthesis',
    category: 'biosynthesis',
    systems: ['endocrine', 'reproductive'],
    description: 'Adrenal cortex + gonad pathway converting cholesterol to glucocorticoids / mineralocorticoids / androgens / estrogens. Rate-limiting: cholesterol side-chain cleavage by CYP11A1 (P450scc; StAR-mediated cholesterol import) → pregnenolone. Branch points: 17α-hydroxylase (CYP17A1) — glucocorticoid + androgen path; aldosterone synthase (CYP11B2) — mineralocorticoid path; aromatase (CYP19A1) — androgen → estrogen. Drug targets: ketoconazole + abiraterone block CYP17A1 (high-dose ketoconazole and abiraterone for castration-resistant prostate cancer); aromatase inhibitors (anastrozole / letrozole / exemestane) block CYP19A1 for ER+ breast cancer; metyrapone blocks 11β-hydroxylase (Cushing diagnostic). 21-hydroxylase deficiency (CYP21A2) is most common congenital adrenal hyperplasia.',
    steps: [
      { from: 'cholesterol', to: 'pregnenolone', via: 'CYP11A1 (P450scc) — RATE-LIMITING; mitochondrial; StAR-mediated import' },
      { from: 'pregnenolone', to: 'progesterone', via: '3β-HSD' },
      { from: 'progesterone', to: 'cortisol', via: '21-hydroxylase (CYP21A2) + 11β-hydroxylase (CYP11B1)' },
      { from: 'pregnenolone', to: 'testosterone', via: 'CYP17A1 (17α-hydroxylase + 17,20-lyase) — KETOCONAZOLE + ABIRATERONE TARGET' },
      { from: 'testosterone', to: 'estradiol', via: 'aromatase (CYP19A1) — AROMATASE-INHIBITOR TARGET' },
    ],
    modulators: [
      { slug: 'ketoconazole', effect: 'inhibitor', target: 'CYP17A1 (at high dose, off-target for prostate Ca historically)' },
      { slug: 'spironolactone', effect: 'inhibitor', target: '17α-hydroxylase / 17,20-lyase (off-target; basis for gynecomastia)' },
    ],
    refs: [],
  },
  {
    slug: 'tyrosine_metabolism',
    name: 'Tyrosine metabolism (broader)',
    category: 'catabolism',
    systems: ['nervous', 'endocrine', 'digestive'],
    description: 'Beyond catecholamine biosynthesis (see catecholamine_synthesis pathway), tyrosine has a major degradation route through the homogentisic acid (HGA) pathway. Tyrosine → 4-hydroxyphenylpyruvate (TAT) → HGA (HPPD — 4-hydroxyphenylpyruvate dioxygenase) → maleylacetoacetate → fumarylacetoacetate → fumarate + acetoacetate. Enzyme defects: hereditary tyrosinemia type 1 (FAH deficiency — toxic fumarylacetoacetate accumulates; NITISINONE rescues by blocking HPPD upstream); alkaptonuria (HGD deficiency — HGA accumulates, oxidizes to alkapton causing ochronosis + arthritis; nitisinone is also being investigated here). HPPD is the same enzyme inhibited by mesotrione + nitisinone — the latter repurposed from herbicide development for tyrosinemia.',
    steps: [
      { from: 'tyrosine', to: '4-hydroxyphenylpyruvate', via: 'tyrosine aminotransferase (TAT)' },
      { from: '4-hydroxyphenylpyruvate', to: 'homogentisic-acid', via: 'HPPD (4-hydroxyphenylpyruvate dioxygenase) — NITISINONE TARGET' },
      { from: 'homogentisic-acid', to: 'maleylacetoacetate', via: 'HGD — alkaptonuria deficiency' },
      { from: 'maleylacetoacetate', to: 'fumarate-acetoacetate', via: 'FAH — tyrosinemia type 1 deficiency' },
    ],
    refs: [],
  },
  {
    slug: 'tryptophan_metabolism',
    name: 'Tryptophan metabolism (kynurenine pathway)',
    category: 'catabolism',
    systems: ['nervous', 'immune-hematologic'],
    description: 'Beyond the 5-HT / melatonin axis (see serotonin_melatonin_axis), the dominant route for tryptophan (~95% of dietary intake) is the kynurenine pathway → eventually NAD+ via de novo synthesis (see niacin_nad_synthesis). Tryptophan → N-formylkynurenine (IDO in immune cells, TDO in liver) → kynurenine. Branch points: KMO → 3-hydroxykynurenine → quinolinic acid (NMDA agonist; neurotoxic at high concentration) → NAD+. KAT → kynurenic acid (NMDA antagonist; potentially neuroprotective). IDO is upregulated by IFN-γ in tumors as an immune-evasion mechanism — basis for IDO inhibitor oncology trials (epacadostat, etc., mostly negative in phase III). Tryptophan depletion underlies the proposed mechanism of depression in chronic inflammation.',
    steps: [
      { from: 'tryptophan', to: 'n-formylkynurenine', via: 'TDO (hepatic, glucocorticoid-induced) or IDO (immune, IFN-γ-induced) — RATE-LIMITING' },
      { from: 'n-formylkynurenine', to: 'kynurenine', via: 'formamidase' },
      { from: 'kynurenine', to: '3-hydroxykynurenine', via: 'KMO — main path; eventually NAD+ via quinolinic acid' },
      { from: 'kynurenine', to: 'kynurenic-acid', via: 'KAT — branch path; NMDA antagonist; potentially neuroprotective' },
    ],
    refs: [],
  },
  {
    slug: 'bcaa_metabolism',
    name: 'Branched-chain amino acid (BCAA) metabolism',
    category: 'catabolism',
    systems: ['endocrine', 'musculoskeletal', 'digestive'],
    description: 'Valine, leucine, and isoleucine share the first two catabolic steps. (1) BCAT (branched-chain aminotransferase, tissue-distributed): reversible transamination → α-keto acids (KIC from leucine, KIV from valine, KMV from isoleucine). (2) BCKDH (branched-chain α-ketoacid dehydrogenase complex, mitochondrial; analogous to PDH + α-KGDH): oxidative decarboxylation. After that, each BCAA diverges to a different end product: valine + isoleucine are glucogenic (→ succinyl-CoA); leucine is purely ketogenic (→ acetoacetate + acetyl-CoA). BCKDH deficiency causes maple syrup urine disease (MSUD) — accumulated α-keto acids produce the characteristic odor + acute encephalopathy. Leucine specifically activates mTORC1 (see mtor_signaling); explains the BCAA-supplementation rationale for muscle hypertrophy.',
    steps: [
      { from: 'leucine', to: 'alpha-ketoisocaproate', via: 'BCAT — branched-chain aminotransferase (reversible)' },
      { from: 'valine', to: 'alpha-ketoisovalerate', via: 'BCAT' },
      { from: 'isoleucine', to: 'alpha-keto-3-methylvalerate', via: 'BCAT' },
      { from: 'alpha-ketoisocaproate', to: 'acetyl-coa', via: 'BCKDH complex — MSUD enzyme; multi-step continues' },
    ],
    modulators: [
      { slug: 'leucine', effect: 'activator', target: 'mTORC1 (Sestrin/GATOR — see mtor_signaling)' },
    ],
    refs: [],
  },
  {
    slug: 'glutathione_metabolism',
    name: 'Glutathione synthesis + redox cycle',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'digestive', 'integumentary'],
    description: 'Glutathione (GSH; γ-glutamyl-cysteinyl-glycine) is the major intracellular antioxidant + xenobiotic conjugator. Synthesis: glutamate + cysteine → γ-glutamylcysteine via γ-glutamylcysteine synthetase (γ-GCS) — RATE-LIMITING, inhibited by GSH (negative feedback). γ-GC + glycine → GSH (GSS). Redox cycle: GSH + ROS → GSSG (oxidized) via glutathione peroxidase (selenium cofactor); GSSG → GSH via glutathione reductase (NADPH from PPP). Acetaminophen toxicity: NAPQI (CYP2E1 metabolite of APAP, normally <5% of dose) depletes hepatic GSH; once GSH falls below ~30% of baseline, NAPQI covalently binds liver proteins → centrilobular necrosis. N-ACETYLCYSTEINE rescues by replenishing cysteine for GSH synthesis (most effective <8h post-ingestion).',
    steps: [
      { from: 'glutamate', to: 'gamma-glutamylcysteine', via: 'γ-glutamylcysteine synthetase (γ-GCS) — RATE-LIMITING; GSH feedback inhibition' },
      { from: 'gamma-glutamylcysteine', to: 'glutathione', via: 'glutathione synthetase (GSS)' },
      { from: 'glutathione', to: 'glutathione-disulfide', via: 'glutathione peroxidase (GPx) — selenium cofactor; ROS detox' },
      { from: 'glutathione-disulfide', to: 'glutathione', via: 'glutathione reductase (GR) — NADPH consumer (PPP-fed)' },
    ],
    modulators: [
      { slug: 'acetaminophen', effect: 'inhibitor', target: 'GSH depletion via NAPQI (toxic dose only)' },
    ],
    refs: [],
  },
  {
    slug: 'pyrimidine_metabolism',
    name: 'Pyrimidine de novo synthesis + salvage',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'digestive'],
    description: 'De novo pyrimidine synthesis: carbamoyl-P (CPS2, cytosolic; distinct from urea-cycle CPS1) → orotate → UMP → UTP/CTP. DHODH (dihydroorotate dehydrogenase, mitochondrial inner membrane, FMN cofactor) is the key drug target — LEFLUNOMIDE inhibits DHODH for rheumatoid arthritis (immunosuppression via T-cell pyrimidine starvation). 5-FU is a thymidylate synthase inhibitor (TS converts dUMP → dTMP using methylene-THF — see folate_one_carbon) — chemotherapy + topical for actinic keratosis. Capecitabine is a 5-FU prodrug activated preferentially in tumor cells by thymidine phosphorylase. Salvage path: free pyrimidine bases + nucleosides recycled via thymidine kinase (also acyclovir activation site) + uridine kinase.',
    steps: [
      { from: 'glutamine', to: 'carbamoyl-phosphate', via: 'CPS2 (cytosolic; distinct from CPS1 urea cycle)' },
      { from: 'carbamoyl-phosphate', to: 'orotate', via: 'multi-step; DHODH (dihydroorotate dehydrogenase) — LEFLUNOMIDE TARGET' },
      { from: 'orotate', to: 'ump', via: 'UMP synthase (orotate phosphoribosyltransferase + OMP decarboxylase)' },
      { from: 'ump', to: 'utp', via: 'kinase phosphorylation; then CTP synthase → CTP' },
    ],
    modulators: [
      { slug: 'methotrexate', effect: 'inhibitor', target: 'thymidylate synthase (downstream — dTMP synthesis)' },
    ],
    refs: [],
  },
  {
    slug: 'purine_de_novo_synthesis',
    name: 'Purine de novo synthesis',
    category: 'biosynthesis',
    systems: ['immune-hematologic'],
    description: 'IMP (inosine monophosphate) is built up from PRPP through 10 enzymatic steps using formyl-THF (from folate_one_carbon) at two positions, glutamine amides at two more, glycine + aspartate + CO2 + bicarbonate at others. The most expensive biosynthesis in the cell. IMP → AMP (adenylosuccinate synthetase + lyase) or → GMP (IMPDH + GMP synthase). Drug targets: methotrexate depletes folate cofactors (slows steps 3 + 9 of purine synthesis + thymidylate synthesis); mycophenolate (MMF / Cellcept) inhibits IMPDH (selective T+B lymphocyte effect — these cells lack the salvage path and depend on de novo). Allopurinol\'s active metabolite oxypurinol also weakly inhibits PRPP synthetase upstream. Salvage path via HGPRT — deficient in Lesch-Nyhan (severe gout + self-mutilation behavior).',
    steps: [
      { from: 'phosphoribosyl-pyrophosphate', to: 'phosphoribosylamine', via: 'PRPP amidotransferase (committed step; glutamine donor)' },
      { from: 'phosphoribosylamine', to: 'inosine-monophosphate', via: 'multi-step (10 enzymes); 2× formyl-THF + 2× glutamine + glycine + aspartate' },
      { from: 'inosine-monophosphate', to: 'amp', via: 'adenylosuccinate synthetase + lyase' },
      { from: 'inosine-monophosphate', to: 'gmp', via: 'IMPDH (rate-limiting for GMP) — MYCOPHENOLATE TARGET; then GMP synthase' },
    ],
    modulators: [
      { slug: 'methotrexate', effect: 'inhibitor', target: 'folate-dependent purine steps (AICAR transformylase + GAR transformylase)' },
    ],
    refs: [],
  },
  {
    slug: 'niacin_nad_synthesis',
    name: 'Niacin / NAD+ biosynthesis',
    category: 'biosynthesis',
    systems: ['endocrine', 'nervous'],
    description: 'NAD+ / NADP+ are the major cellular hydride acceptors — used by hundreds of dehydrogenases plus sirtuins (NAD+-consuming deacetylases) plus PARPs (NAD+-consuming DNA repair). Sources: (1) De novo from tryptophan via the kynurenine pathway (see tryptophan_metabolism) — quinolinic acid → NAD+ via QPRT. (2) Preformed from dietary niacin (nicotinic acid / nicotinamide / nicotinamide riboside) via the Preiss-Handler pathway. ~60 mg dietary tryptophan = 1 mg niacin equivalent. Pellagra (niacin deficiency) presents as the 4 D\'s: dermatitis, diarrhea, dementia, death — historically endemic in corn-dependent populations because corn niacin is bound and bioavailability is low. NAD+ supplementation (NR, NMN, NAD+ precursors) is heavily promoted for longevity but rigorous evidence remains thin.',
    steps: [
      { from: 'tryptophan', to: 'quinolinic-acid', via: 'kynurenine pathway (TDO/IDO → KMO → 3-OH-anthranilate → QA)' },
      { from: 'quinolinic-acid', to: 'nicotinic-acid-mononucleotide', via: 'QPRT (quinolinate phosphoribosyltransferase)' },
      { from: 'nicotinic-acid', to: 'nicotinamide-adenine-dinucleotide', via: 'Preiss-Handler pathway (NaPRT + NMNAT + glutamine-dependent NAD synthetase)' },
      { from: 'nr', to: 'nicotinamide-adenine-dinucleotide', via: 'NRK (nicotinamide riboside kinase) + NMNAT — the NR-supplementation entry point' },
    ],
    modulators: [
      { slug: 'niacin', effect: 'substrate', target: 'Preiss-Handler entry; high-dose Rx for dyslipidemia (HDL raise)' },
      { slug: 'nr', effect: 'substrate', target: 'NRK pathway entry (nicotinamide riboside; longevity supplement positioning)' },
      { slug: 'nmn', effect: 'substrate', target: 'NMNAT pathway entry (nicotinamide mononucleotide; longevity supplement)' },
    ],
    refs: [],
  },
  {
    slug: 'ubiquinone_biosynthesis',
    name: 'Ubiquinone (CoQ10) biosynthesis',
    category: 'biosynthesis',
    systems: ['cardiovascular', 'musculoskeletal', 'endocrine'],
    description: 'CoQ10 (ubiquinone-10) is the lipid-soluble mobile electron carrier of the ETC between Complex I/II and Complex III. Synthesized from tyrosine (provides the quinone head group via 4-hydroxybenzoate / 4-HB) + the mevalonate pathway (provides the polyprenyl tail — branches off from the cholesterol synthesis pathway, see cholesterol_synthesis). STATINS deplete CoQ10 because they block HMG-CoA reductase upstream of the polyprenyl-tail branch. The hypothesis that statin-related myalgia is CoQ10-depletion-mediated has been investigated and is inconclusive — supplementation trials for statin myalgia show mixed effect. Mitochondrial CoQ10 deficiency syndromes (genetic — COQ2, COQ4, COQ7, COQ8B mutations) cause nephrotic syndrome + encephalopathy + cardiomyopathy and DO respond to high-dose CoQ10 (200-1200 mg/d).',
    steps: [
      { from: 'tyrosine', to: '4-hydroxybenzoate', via: 'multi-step (provides ubiquinone head group)' },
      { from: 'mevalonate', to: 'polyprenyl-pyrophosphate', via: 'mevalonate pathway (shared with cholesterol synthesis) — STATIN-DEPLETED' },
      { from: '4-hydroxybenzoate', to: 'coenzyme-q10', via: 'COQ2-COQ10 complex (mitochondrial; assembles head + tail + decorates ring)' },
    ],
    modulators: [
      { slug: 'atorvastatin', effect: 'inhibitor', target: 'CoQ10 depletion via HMG-CoA reductase block (statin class effect)' },
    ],
    refs: [],
  },
  {
    slug: 'oxidative_phosphorylation',
    name: 'Oxidative phosphorylation (ETC + ATP synthase)',
    category: 'catabolism',
    systems: ['endocrine', 'musculoskeletal', 'nervous'],
    description: 'Mitochondrial inner-membrane electron transport chain coupled to chemiosmotic ATP synthesis. Complex I (NADH:CoQ oxidoreductase) — NADH → CoQ; METFORMIN TARGET. Complex II (succinate dehydrogenase = TCA enzyme) — succinate → CoQ; doesn\'t pump protons. Complex III (CoQ:cytochrome c oxidoreductase) — Q-cycle pumps protons. Complex IV (cytochrome c oxidase) — final O2 reduction; CYANIDE + carbon monoxide target. Complex V (ATP synthase) — H+ flow drives ATP synthesis; OLIGOMYCIN target. Uncouplers (2,4-DNP historic, fatal hyperthermia) collapse the H+ gradient → heat instead of ATP. Mitochondrial myopathies / encephalopathies (MELAS, MERRF, LHON) arise from mutations in mtDNA-encoded ETC subunits.',
    steps: [
      { from: 'nadh', to: 'coenzyme-q10', via: 'Complex I (NADH:Q oxidoreductase) — METFORMIN target; pumps 4 H+' },
      { from: 'succinate', to: 'coenzyme-q10', via: 'Complex II (= TCA succinate dehydrogenase); doesn\'t pump H+' },
      { from: 'coenzyme-q10', to: 'cytochrome-c', via: 'Complex III (Q-cycle); pumps 4 H+' },
      { from: 'cytochrome-c', to: 'water', via: 'Complex IV (cytochrome c oxidase) — CN/CO target; pumps 2 H+; final O2 reduction' },
      { from: 'proton-gradient', to: 'atp', via: 'Complex V (ATP synthase F1F0) — OLIGOMYCIN target' },
    ],
    modulators: [
      { slug: 'metformin', effect: 'inhibitor', target: 'Complex I (mild) — basis for hepatic gluconeogenesis suppression + lactic acidosis risk' },
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
  console.log(`\nWave 5a batch 3 (Recon3D-aligned, v1.2): +${added} pathways → ${existing.length} total.`);
}

main();
