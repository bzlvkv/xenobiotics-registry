/**
 * 2026-05-15-pathway-immuno-metabolic.ts — 6 immuno-metabolic + cancer
 * cascade pathways.
 *
 *   kynurenine_tryptophan_pathway        — IDO/TDO → quinolinic / kyn-A
 *   bile_acid_microbiome_crosstalk       — 7α-dehydroxylation → 2° BA
 *   brown_adipose_thermogenesis_ucp1     — UCP1 mitochondrial uncoupling
 *   cd4_helper_th1_th2_th17_treg         — CD4 lineage polarization
 *   p53_mdm2_dna_damage_response         — guardian-of-genome stress sensor
 *   wound_healing_cascade                — hemostasis → inflam → prolif → remodel
 *
 * Modulator slugs verified in registry; refs via NCBI esummary 2026-05-15.
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
    slug: 'kynurenine_tryptophan_pathway',
    name: 'Kynurenine pathway (tryptophan catabolism + immunometabolism)',
    category: 'catabolism',
    systems: ['immune-hematologic', 'nervous', 'endocrine'],
    description: `The kynurenine pathway (KP) handles ~95% of dietary tryptophan catabolism — the dominant non-serotonin tryptophan route. Rate-limiting enzymes: tryptophan 2,3-dioxygenase (TDO, hepatic, substrate-induced) + indoleamine 2,3-dioxygenase (IDO1, induced by IFN-γ + LPS in immune + epithelial cells). TDO/IDO oxidize Trp → N-formylkynurenine → kynurenine (the branch hub). Kynurenine routes: (1) Kynurenine 3-monooxygenase (KMO) → 3-hydroxykynurenine → 3-hydroxyanthranilic acid → quinolinic acid (QUIN, NMDA agonist + neurotoxin) → niacin / NAD⁺ synthesis (cross-link [[niacin_nad_synthesis]]). (2) Kynurenine aminotransferases (KAT-I/II/III/IV) → kynurenic acid (KYNA, NMDA + α7-nAChR antagonist — neuroprotective; cognitive-decline-associated in excess). Immunometabolism: IDO1 is a dominant immune checkpoint — local Trp depletion + Kyn accumulation suppresses effector T cells + drives Treg differentiation (cross-link [[cd4_helper_th1_th2_th17_treg]]). Tumor microenvironment exploits IDO1 for immune evasion. Therapeutic landscape: IDO1 inhibitors (epacadostat — failed phase 3 melanoma; indoximod, linrodostat in trials); KP-psychiatric link (depression has elevated kynurenine + QUIN/KYNA imbalance; ketamine bypasses QUIN-NMDA; psychedelics reduce IDO activity); pyridoxine + niacin support upstream + downstream balance. Cross-links: [[serotonin_melatonin_axis]] (5-HT competing branch), [[niacin_nad_synthesis]] (downstream NAD⁺), [[cd4_helper_th1_th2_th17_treg]] (Treg induction).`,
    steps: [
      { from: 'dietary L-tryptophan', to: 'N-formylkynurenine', via: 'TDO (hepatic, substrate-induced) or IDO1 (immune cells, IFN-γ-induced)' },
      { from: 'N-formylkynurenine', to: 'kynurenine (the branch hub)', via: 'formamidase (spontaneous + enzymatic deformylation)' },
      { from: 'kynurenine + KMO', to: '3-hydroxykynurenine → 3-HAA', via: 'flavin-dependent monooxygenase; rate-limiting for QUIN branch' },
      { from: '3-HAA → ACMSD', to: 'quinolinic acid (QUIN — NMDA agonist)', via: '→ niacin / NAD⁺ synthesis (cross-link niacin_nad_synthesis)' },
      { from: 'kynurenine + KAT-I/II/III/IV', to: 'kynurenic acid (KYNA — NMDA + α7-nAChR antagonist)', via: 'neuroprotective at low levels; cognitive impairment in excess' },
      { from: 'IDO1 induction (tumor / Treg)', to: 'local Trp depletion + Kyn accumulation', via: 'immune checkpoint: effector T-cell arrest + Treg differentiation' },
    ],
    modulators: [
      { slug: 'tryptophan',  effect: 'substrate', target: 'KP rate-limiting substrate (Trp depletion = pathway throughput limit)' },
      { slug: '5-htp',       effect: 'inhibitor', target: 'shunts Trp pool toward 5-HT branch (away from KP)' },
      { slug: 'niacin',      effect: 'inhibitor', target: 'feedback suppression of de novo KP→NAD⁺ flux' },
      { slug: 'pyridoxine',  effect: 'cofactor',  target: 'PLP cofactor for KAT enzymes (KYNA branch) + kynureninase' },
      { slug: 'melatonin',   effect: 'inhibitor', target: 'IDO1 expression (anti-inflammatory)' },
      { slug: 'curcumin',    effect: 'inhibitor', target: 'IDO1 + IFN-γ → KP suppression in tumor microenvironment' },
      { slug: 'resveratrol', effect: 'inhibitor', target: 'IDO1 (anti-inflammatory)' },
      { slug: 'egcg',        effect: 'inhibitor', target: 'IDO1' },
      { slug: 'quercetin',   effect: 'inhibitor', target: 'IDO1 (preclinical anti-tumor immune support)' },
      { slug: 'psilocybin',  effect: 'inhibitor', target: 'reduces depressive-state IDO activity (post-acute)' },
      { slug: 'ketamine',    effect: 'inhibitor', target: 'rapid antidepressant — bypasses QUIN-NMDA imbalance' },
    ],
    refs: [
      'PMID:26035167',
    ],
  },

  {
    slug: 'bile_acid_microbiome_crosstalk',
    name: 'Bile acid — microbiome crosstalk',
    category: 'signaling',
    systems: ['digestive', 'endocrine', 'immune-hematologic'],
    description: `Bile acids are a two-way signaling currency between host + gut microbiota. Primary bile acids (cholic acid, chenodeoxycholic acid) synthesized in the liver from cholesterol → conjugated with taurine/glycine → secreted into bile → small intestine. Gut bacteria modify them in two steps: (1) deconjugation — bile salt hydrolases (BSH; Bacteroides, Bifidobacterium, Lactobacillus, Clostridium have broad BSH expression) cleave taurine/glycine. (2) 7α-dehydroxylation — performed only by a small Clostridium cluster (XIVa, including C. scindens, C. hylemonae) converting primary → secondary bile acids (CDCA → litho-CA; CA → deoxycholic-CA). Secondary BA differ profoundly in receptor activity (FXR / TGR5, cross-link [[fxr_tgr5_bile_acid_receptor]]) — LCA + DCA are potent TGR5 agonists; tauro-β-muricholic acid (rodents) is a natural FXR antagonist. Enterohepatic recirculation: ~95% reabsorption in terminal ileum via ASBT → portal blood → liver → re-secretion. Disease relevance: dysbiosis (antibiotic-disrupted, IBD, MASH) → altered primary:secondary BA ratio + signaling. C. difficile susceptibility — antibiotic loss of 7α-dehydroxylating bacteria allows C. diff germination (deoxycholic acid normally suppresses germination). FXR-FGF15/19: secondary BA → ileal release of FGF15 (mouse) / FGF19 (human) → hepatic FGFR4 → ↓CYP7A1 → BA synthesis feedback. Therapeutics: UDCA (cytoprotective hydrophilic BA — PBC); colesevelam + cholestyramine (BA sequestrants → ↑synthesis + glycemic + lipid effects); rifaximin (non-absorbed gut antibiotic — IBS-D + HE); FXR agonists (obeticholic acid PBC). Cross-links: [[bile_acid_synthesis]] (upstream), [[fxr_tgr5_bile_acid_receptor]] (host receptors), [[microbiome_scfa_butyrate]] (parallel microbial signaling).`,
    steps: [
      { from: 'liver hepatocyte', to: 'primary bile acids (cholic + chenodeoxycholic — Tau/Gly conjugated)', via: 'CYP7A1 + downstream enzymes; bile secretion via BSEP' },
      { from: 'small intestine + bacterial BSH', to: 'deconjugation → free primary bile acids', via: 'Bacteroides + Bifidobacterium + Lactobacillus + Clostridium broad BSH activity' },
      { from: 'free primary BA + Clostridium XIVa', to: 'secondary BA (DCA from CA, LCA from CDCA)', via: '7α-dehydroxylation — narrow taxa; antibiotic-sensitive' },
      { from: 'secondary BA (DCA, LCA)', to: 'TGR5 + FXR activation profile shift', via: 'distinct pharmacology from primary BA → cross-link fxr_tgr5_bile_acid_receptor' },
      { from: 'ileal BA + FXR', to: 'FGF15 / FGF19 release', via: 'enteroendocrine → portal → hepatic FGFR4 → ↓CYP7A1 (feedback)' },
      { from: 'antibiotic-disrupted microbiota', to: 'loss of 2° BA → C. difficile germination', via: 'normally DCA suppresses C. diff spore germination; CDI risk rises' },
    ],
    modulators: [
      { slug: 'rifaximin',     effect: 'inhibitor', target: 'gut microbiota composition; paradoxically often ↑beneficial taxa', note: 'IBS-D + hepatic encephalopathy + SIBO' },
      { slug: 'cholestyramine', effect: 'inhibitor', target: 'BA sequestrant → ↑BA synthesis + altered microbial substrate' },
      { slug: 'colesevelam',   effect: 'inhibitor', target: 'BA sequestrant (FDA-approved for both LDL + T2D)' },
      { slug: 'semaglutide',   effect: 'activator', target: 'GLP-1R + indirect TGR5 stimulation' },
      { slug: 'tirzepatide',   effect: 'activator', target: 'GLP-1/GIP dual + bile-acid axis (MASH effect)' },
      { slug: 'metformin',     effect: 'activator', target: '↑Akkermansia + alters BA pool composition (gut-mediated)' },
      { slug: 'dha',           effect: 'activator', target: 'beneficial microbiota composition + anti-inflammatory' },
      { slug: 'epa',           effect: 'activator', target: 'beneficial microbiota composition' },
    ],
    refs: [
      'PMID:29018272',
      'PMID:35105664',
    ],
  },

  {
    slug: 'brown_adipose_thermogenesis_ucp1',
    name: 'Brown adipose thermogenesis (UCP1)',
    category: 'signaling',
    systems: ['endocrine', 'cardiovascular', 'integumentary'],
    description: `Brown adipose tissue (BAT) burns chemical energy as heat via uncoupling protein 1 (UCP1) — distinct from white adipose tissue (WAT) energy storage. UCP1 sits in the mitochondrial inner membrane and dissipates the proton gradient, decoupling fuel oxidation from ATP synthesis → heat. Mechanism: cold exposure → sympathetic activation → norepinephrine → β3-adrenergic receptor on brown adipocyte → Gs → cAMP → PKA → HSL → lipolysis → free fatty acids → activate UCP1 (FFAs are required allosteric activators). Result: thermogenesis 100–300 W/kg BAT (vs. WAT near zero). BAT vs beige (brite) adipose: classical BAT is interscapular + supraclavicular (high UCP1, multilocular lipid droplets, dense mitochondria). Beige adipocytes appear in WAT depots after cold / exercise / β3 stimulation ("browning"). PRDM16 + PGC-1α are master transcriptional regulators. Human relevance: adult humans have functional BAT (FDG-PET-detectable) in supraclavicular + perirenal depots — activated by cold (~10× metabolic rate in BAT alone); inversely correlated with BMI, age, glucose intolerance. Therapeutic landscape: mirabegron — β3-AR agonist (FDA-approved for overactive bladder; off-label BAT activation trials show modest metabolic benefit); GLP-1 agonists + tirzepatide → indirect BAT effects via weight loss + central mechanisms; thyroid hormone (T3) → UCP1 expression; capsaicin / TRPV1 → cold-mimetic activation; cold exposure + exercise → BAT recruitment + WAT browning. Cross-links: [[adrenergic_receptor_signaling]] (β3-AR), [[catecholamine_synthesis]] (NE from sympathetic), [[hpt_axis]] (T3 enhancement), [[insulin_glucose_homeostasis]] (BAT improves glycemia).`,
    steps: [
      { from: 'cold exposure + sympathetic activation', to: 'norepinephrine release onto BAT', via: 'sympathetic innervation density high in BAT; small cold = large NE release' },
      { from: 'norepinephrine + β3-AR (BAT)', to: 'Gs → cAMP → PKA activation', via: 'β3-AR is the BAT-preferring β-receptor subtype' },
      { from: 'PKA active', to: 'HSL activation → lipolysis → free fatty acids', via: 'cytoplasmic FFAs are required allosteric activators of UCP1' },
      { from: 'free fatty acids + UCP1 (mitochondrial inner membrane)', to: 'proton gradient dissipation → heat', via: 'short-circuits oxidative phosphorylation; chemical → thermal energy' },
      { from: 'sustained β3 + cold + exercise', to: 'WAT browning (beige adipocyte induction)', via: 'PRDM16 + PGC-1α → UCP1-expressing beige cells emerge in WAT depots' },
      { from: 'thyroid hormone (T3)', to: 'UCP1 transcriptional enhancement', via: 'TR-β nuclear receptor on UCP1 promoter; cross-link hpt_axis' },
    ],
    modulators: [
      { slug: 'mirabegron',    effect: 'activator', target: 'β3-AR (FDA-approved for OAB; off-label BAT activation trials)' },
      { slug: 'semaglutide',   effect: 'activator', target: 'indirect BAT activation via weight loss + central mechanisms' },
      { slug: 'tirzepatide',   effect: 'activator', target: 'GLP-1/GIP — indirect BAT effects' },
      { slug: 'liraglutide',   effect: 'activator', target: 'GLP-1R — indirect' },
      { slug: 'retatrutide',   effect: 'activator', target: 'GLP-1/GIP/GCG triple agonist; GCG arm may directly increase BAT activity' },
      { slug: 'metformin',     effect: 'activator', target: 'AMPK → mitochondrial biogenesis + BAT recruitment' },
      { slug: 'dha',           effect: 'activator', target: 'BAT biogenesis (preclinical PUFA effect)' },
      { slug: 'epa',           effect: 'activator', target: 'BAT biogenesis' },
      { slug: 'beta-hydroxybutyrate', effect: 'activator', target: 'BAT (ketogenic + AMPK + UCP1 transcription)' },
      { slug: 'capsaicin',     effect: 'activator', target: 'TRPV1 → cold-mimetic BAT activation' },
      { slug: 'curcumin',      effect: 'activator', target: 'BAT activation + WAT browning (preclinical)' },
      { slug: 'resveratrol',   effect: 'activator', target: 'SIRT1 + AMPK → BAT' },
      { slug: 'egcg',          effect: 'activator', target: 'BAT thermogenesis (modest clinical signal)' },
      { slug: 'quercetin',     effect: 'activator', target: 'BAT (preclinical)' },
      { slug: 'melatonin',     effect: 'activator', target: 'BAT mass + activity (circadian-linked)' },
      { slug: 'levothyroxine', effect: 'activator', target: 'T4 → T3 → UCP1 transcription' },
      { slug: 'liothyronine',  effect: 'activator', target: 'T3 direct' },
    ],
    refs: [
      'PMID:14715917',
      'PMID:31774114',
    ],
  },

  {
    slug: 'cd4_helper_th1_th2_th17_treg',
    name: 'CD4 T-helper differentiation (Th1 / Th2 / Th17 / Treg)',
    category: 'signaling',
    systems: ['immune-hematologic'],
    description: `Naive CD4+ T cells polarize into distinct effector lineages based on cytokine environment + master transcription factors. Lineage signatures: (1) Th1 — IL-12 + IFN-γ; T-bet (TBX21); cytokines IFN-γ + TNF-α + IL-2; intracellular pathogens + macrophage activation. (2) Th2 — IL-4; GATA3; cytokines IL-4 + IL-5 + IL-13; helminth defense + allergic disease (cross-link [[asthma_th2_eosinophil_inflammation]]). (3) Th17 — TGF-β + IL-6 + IL-23; RORγt; cytokines IL-17A/F + IL-22; extracellular bacteria + fungi at mucosa; autoimmune (psoriasis, IBD, axial spondylitis). (4) iTreg — TGF-β + IL-2; FoxP3; cytokines IL-10 + TGF-β; immune tolerance + suppressing other lineages. (5) Tfh — IL-6 + IL-21; Bcl-6; CXCR5; B-cell germinal center help. Plasticity: lineages are not fully terminal — Th17 ↔ iTreg interconversion (shared TGF-β requirement; IL-6 sets the balance); ex-Th17 → Th1-like in chronic inflammation. Metabolic profile: effector Th1/Th17 prefer glycolysis (mTORC1-dependent); Treg prefer fatty-acid oxidation (AMPK-dependent — cross-link [[ampk_signaling]] + [[mtor_signaling]]). Disease relevance: Th1 — MS, T1D; Th2 — asthma, allergy; Th17 — psoriasis, IBD, AS; Treg deficiency — IPEX (FoxP3 LOF). Therapeutic landscape: calcineurin inhibitors (block IL-2 → all lineages); mTOR inhibitors (rapamycin — expands Treg, suppresses Teff); methotrexate; JAK inhibitors (tofacitinib, baricitinib — IL-6/IFN/IL-12/23 downstream); cytokine-specific biologics: anti-IL-17 (secukinumab, ixekizumab), anti-IL-23 (ustekinumab, risankizumab); anti-IL-4Rα (dupilumab — Th2 blockade); CTLA-4-Ig (abatacept). Cross-links: [[kynurenine_tryptophan_pathway]] (IDO → Treg induction), [[asthma_th2_eosinophil_inflammation]], [[calcineurin_nfat_t_cell_activation]].`,
    steps: [
      { from: 'naive CD4+ T cell + TCR + IL-12', to: 'Th1 polarization (T-bet+)', via: 'STAT4-IL-12 → T-bet → IFN-γ feed-forward' },
      { from: 'naive CD4+ + IL-4', to: 'Th2 polarization (GATA3+)', via: 'STAT6-IL-4 → GATA3 → IL-4/5/13 production' },
      { from: 'naive CD4+ + TGF-β + IL-6 + IL-23', to: 'Th17 polarization (RORγt+)', via: 'STAT3-IL-6 → RORγt; IL-23 stabilizes phenotype' },
      { from: 'naive CD4+ + TGF-β + IL-2 (no IL-6)', to: 'iTreg polarization (FoxP3+)', via: 'STAT5-IL-2 + SMAD-TGF-β → FoxP3; IL-6 redirects to Th17' },
      { from: 'Th17 ↔ iTreg', to: 'lineage plasticity (TGF-β / IL-6 balance)', via: 'shared TGF-β; IL-6 tips the balance toward Th17' },
      { from: 'effector Th1/Th17', to: 'glycolytic metabolic state (mTORC1-driven)', via: 'distinct from Treg fatty-acid-oxidation profile (AMPK)' },
    ],
    modulators: [
      { slug: 'cyclosporine',  effect: 'inhibitor', target: 'calcineurin → ↓IL-2 → all effector lineages suppressed' },
      { slug: 'tacrolimus',    effect: 'inhibitor', target: 'calcineurin (more potent than CsA)' },
      { slug: 'rapamycin',     effect: 'inhibitor', target: 'mTORC1 → expands Treg, suppresses Teff' },
      { slug: 'everolimus',    effect: 'inhibitor', target: 'mTORC1' },
      { slug: 'methotrexate',  effect: 'inhibitor', target: 'DHFR + adenosine → anti-proliferative' },
      { slug: 'azathioprine',  effect: 'inhibitor', target: 'purine synthesis → lymphocyte anti-proliferative' },
      { slug: 'tofacitinib',   effect: 'inhibitor', target: 'JAK1/3 → broad effector cytokine block' },
      { slug: 'baricitinib',   effect: 'inhibitor', target: 'JAK1/2 → IFN + IL-6 axis' },
      { slug: 'upadacitinib',  effect: 'inhibitor', target: 'JAK1-selective' },
      { slug: 'ruxolitinib',   effect: 'inhibitor', target: 'JAK1/2' },
      { slug: 'dexamethasone', effect: 'inhibitor', target: 'GR transrepression of effector cytokines (broad)' },
      { slug: 'prednisone',    effect: 'inhibitor', target: 'GR — induces Treg + suppresses Th1/Th17' },
      { slug: 'methylprednisolone', effect: 'inhibitor', target: 'GR — MS pulse, autoimmune' },
      { slug: 'calcitriol',    effect: 'activator', target: 'VDR → Treg induction + ↓Th1/Th17' },
      { slug: 'dha',           effect: 'inhibitor', target: 'Th17 suppression + Treg support (anti-inflammatory)' },
      { slug: 'epa',           effect: 'inhibitor', target: 'Th17 + IL-17 production' },
      { slug: 'curcumin',      effect: 'inhibitor', target: 'Th17 + Treg balance modulation (preclinical)' },
      { slug: 'resveratrol',   effect: 'activator', target: 'SIRT1 → Treg support; ↓Th17' },
      { slug: 'egcg',          effect: 'inhibitor', target: 'Th17 suppression' },
      { slug: 'quercetin',     effect: 'inhibitor', target: 'Th17 + mast-cell IgE axis' },
    ],
    refs: [
      'PMID:16467870',
    ],
  },

  {
    slug: 'p53_mdm2_dna_damage_response',
    name: 'p53 / MDM2 DNA-damage response',
    category: 'signaling',
    systems: ['immune-hematologic', 'integumentary', 'nervous', 'reproductive'],
    description: `p53 (TP53) is the "guardian of the genome" — a transcription factor that senses cellular stress (DNA damage, oncogene activation, hypoxia, nutrient deprivation, ribosomal stress) and triggers cell-cycle arrest, senescence, or apoptosis. Mutated in ~50% of human cancers (most frequently mutated tumor suppressor). Steady-state regulation: MDM2 (HDM2 in humans) is an E3 ubiquitin ligase that polyubiquitinates p53 → proteasomal degradation. p53 transcribes MDM2 → negative-feedback loop; basal p53 levels stay low. Stress-induced stabilization: (1) DNA damage — ATM/ATR sense DSBs + replication stress → phosphorylate p53 (Ser15, Ser20) + MDM2 → disrupts MDM2-p53 binding. (2) Oncogene activation — ARF (p14ARF) binds + sequesters MDM2 → p53 stabilizes. (3) Ribosomal stress — RPL5/RPL11 bind MDM2. Stabilized p53 → tetramerizes + binds p53RE → transcribes p21 (cell-cycle arrest), PUMA + BAX + NOXA (apoptosis), GADD45, MDM2 (feedback), p53R2 (DNA repair). Decision logic: low / transient stress → p21 → reversible arrest. Moderate persistent stress → senescence (cross-link [[senescence_sasp_senolytics]]). High / unrepairable → BAX/PUMA → apoptosis (cross-link [[apoptosis_bcl2_axis]]). Hotspot mutations (R175H, R248Q/W, R273H/C, R282W) — loss of DNA binding + gain-of-function. Li-Fraumeni: germline TP53 → early-onset cancers. Therapeutic landscape: MDM2-p53 interaction inhibitors (idasanutlin, milademetan, navtemadlin — reactivate WT p53; toxicity is challenging); reactivators of mutant p53 (APR-246 in MDS); many natural products (curcumin, resveratrol, quercetin, withaferin-A) restore p53 function in preclinical cancer models. Cross-links: [[apoptosis_bcl2_axis]], [[senescence_sasp_senolytics]], [[cell_cycle_cdk]], [[ubiquitin_proteasome]] (MDM2-mediated p53 turnover).`,
    steps: [
      { from: 'cellular stress (DNA damage, oncogene, hypoxia, ribosomal)', to: 'ATM/ATR or ARF or RPL5/11 activation', via: 'distinct sensors → converge on p53 stabilization' },
      { from: 'ATM/ATR phosphorylation of p53 Ser15/Ser20 + MDM2', to: 'disrupted p53-MDM2 binding → p53 stabilization', via: 'p53 half-life rises from minutes to hours' },
      { from: 'stabilized p53', to: 'tetramerization + DNA binding at p53-RE', via: 'transcription factor active state' },
      { from: 'p53 transcriptional output', to: 'p21 + MDM2 + PUMA/BAX + GADD45 + p53R2', via: 'p21 = arrest; PUMA/BAX = apoptosis; MDM2 = feedback' },
      { from: 'low / transient damage', to: 'p21 → reversible G1/G2 arrest → repair', via: 'pro-survival outcome; cells re-enter cycle after repair' },
      { from: 'persistent moderate stress', to: 'senescence (p21 + p16-cyclin)', via: 'permanent arrest + SASP (cross-link senescence_sasp_senolytics)' },
      { from: 'high / unrepairable damage', to: 'BAX / PUMA → mitochondrial apoptosis', via: 'cross-link to apoptosis_bcl2_axis; pro-death p53 outcome' },
    ],
    modulators: [
      { slug: 'rapamycin',    effect: 'activator', target: 'p53-mTOR cross-talk; rapalogs can stabilize WT p53 in some contexts' },
      { slug: 'metformin',    effect: 'activator', target: 'AMPK → mTORC1 inhibition + p53 modulation (anti-cancer signal)' },
      { slug: 'curcumin',     effect: 'activator', target: 'restores / amplifies WT p53 (preclinical anti-cancer)' },
      { slug: 'resveratrol',  effect: 'activator', target: 'SIRT1 deacetylates p53 — context-dependent; preclinical cancer-suppressive' },
      { slug: 'quercetin',    effect: 'activator', target: 'p53 stabilization in cancer cell lines + senolytic' },
      { slug: 'egcg',         effect: 'activator', target: 'p53 + chemoprevention (catechin)' },
      { slug: 'luteolin',     effect: 'activator', target: 'p53 in cancer models' },
      { slug: 'withaferin-a', effect: 'activator', target: 'p53 reactivation in some cancer contexts' },
      { slug: 'sulforaphane', effect: 'activator', target: 'NRF2 + p53 — chemopreventive' },
      { slug: 'aspirin',      effect: 'activator', target: 'p53 stabilization (CRC chemoprevention partial mechanism)' },
    ],
    refs: [
      'PMID:11747320',
    ],
  },

  {
    slug: 'wound_healing_cascade',
    name: 'Wound healing cascade (hemostasis → inflammation → proliferation → remodeling)',
    category: 'signaling',
    systems: ['integumentary', 'immune-hematologic', 'cardiovascular'],
    description: `Skin wound healing proceeds through four overlapping phases. Phase 1: hemostasis (minutes-hours) — platelet aggregation → release of PDGF, TGF-β, VEGF; coagulation cascade → fibrin clot → provisional matrix. Phase 2: inflammation (hours-days) — neutrophils (1-3 d, debridement + antimicrobial) → macrophages (3-7 d, M1 pro-inflammatory then M2 pro-resolution). DAMPs (HMGB1, S100, ATP, mtDNA) drive innate response. Cytokines: IL-1, IL-6, TNF-α, MCP-1. Phase 3: proliferation (days-weeks) — re-epithelialization (keratinocyte migration + proliferation, EGFR/HGF-driven); angiogenesis (VEGF + FGF → new capillaries); granulation tissue (fibroblast migration + matrix + myofibroblast contraction); type III collagen + GAGs initially. Phase 4: remodeling (weeks-months-years) — type III → type I collagen replacement; MMP-mediated reorganization; tensile strength recovers to ~80% of intact skin. Dysfunctional healing: (1) chronic wounds (venous stasis, diabetic, pressure) — stalled in inflammation, persistent MMP elevation, biofilm, neuropathy + ischemia. (2) hypertrophic / keloid scarring — excessive collagen + TGF-β + fibroblast proliferation. Therapeutic landscape: standard care (debridement + moisture + offloading + infection control); growth factor topicals (becaplermin = recombinant PDGF for diabetic foot ulcers — boxed warning for cancer with chronic high-volume use); hyperbaric oxygen for refractory wounds; anti-TGF-β for keloid prevention (investigational); botanicals (curcumin, aloe vera, honey — preclinical + small clinical signal). Cross-links: [[coagulation_cascade]] (hemostasis upstream), [[platelet_aggregation]] (initial response), [[fibrinolysis]] (clot turnover), [[tgf_beta_signaling]] (proliferation + remodeling), [[arachidonic_acid_cascade]] (inflammation mediators).`,
    steps: [
      { from: 'wound + tissue injury', to: 'platelet aggregation + fibrin clot', via: 'coagulation cascade + platelet PDGF/TGF-β/VEGF release; hemostasis phase' },
      { from: 'DAMPs + chemokines', to: 'neutrophil influx (1–3 d) → macrophage influx (3–7 d)', via: 'inflammatory phase; M1 → M2 macrophage polarization signals resolution' },
      { from: 'macrophage M2 + growth factors', to: 'keratinocyte migration → re-epithelialization', via: 'EGFR + HGF; basal keratinocytes lose polarity + migrate across wound bed' },
      { from: 'VEGF + FGF', to: 'angiogenesis → new capillary network', via: 'supplies metabolic demand of granulation tissue' },
      { from: 'fibroblast migration + proliferation', to: 'granulation tissue (type III collagen + GAGs)', via: 'red, soft "filling" tissue bridging the defect' },
      { from: 'myofibroblast differentiation (α-SMA+)', to: 'wound contraction', via: 'TGF-β-driven; reduces wound area; excess → contracture' },
      { from: 'type III → type I collagen (weeks-months)', to: 'remodeled scar (tensile ~80% of intact)', via: 'MMP-mediated turnover; remodeling can persist >1 year' },
    ],
    modulators: [
      { slug: 'testosterone',     effect: 'activator', target: 'wound healing (anabolic; ↑muscle + ↑collagen; clinical use in chronic wounds + burns)' },
      { slug: 'ascorbic-acid',    effect: 'cofactor',  target: 'collagen prolyl + lysyl hydroxylation; scurvy = impaired healing' },
      { slug: 'zinc',             effect: 'cofactor',  target: 'metalloenzymes + collagen turnover; deficiency = poor healing' },
      { slug: 'collagen-peptides', effect: 'substrate', target: 'collagen synthesis precursor amino acids' },
      { slug: 'dha',              effect: 'activator', target: 'pro-resolving mediators (resolvins, protectins) → faster inflammation resolution' },
      { slug: 'epa',              effect: 'activator', target: 'pro-resolving mediator precursor' },
      { slug: 'curcumin',         effect: 'activator', target: 'wound healing (anti-inflammatory + collagen modulation; diabetic-wound clinical signal)' },
      { slug: 'tretinoin',        effect: 'activator', target: 'epidermal renewal + collagen synthesis (chronic topical use)' },
      { slug: 'isotretinoin',     effect: 'inhibitor', target: 'IMPAIRS surgical wound healing — discontinue 6 mo before elective procedures' },
      { slug: 'propranolol',      effect: 'inhibitor', target: 'hemangioma (infantile) regression; off-label scar modulation' },
    ],
    refs: [
      'PMID:38528155',
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
