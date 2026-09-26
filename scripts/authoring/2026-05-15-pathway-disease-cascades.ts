/**
 * 2026-05-15-pathway-tier1-batch.ts — 6 disease-process pathways.
 *
 * Adds the "how the disease progresses" view for major chronic-disease
 * cascades that previously had no top-level pathway entry. Each ties
 * existing molecular pathways (NF-κB, ferroptosis, apoptosis, etc.)
 * into a clinically-recognizable progression story.
 *
 *   alzheimer_amyloid_tau_cascade
 *   parkinson_alpha_synuclein_aggregation
 *   atherosclerosis_plaque_pathology
 *   neuroinflammation_microglia_priming
 *   asthma_th2_eosinophil_inflammation
 *   nafld_mash_steatohepatitis
 *
 * All modulator slugs verified in the registry; all refs verified via
 * NCBI E-utilities esummary 2026-05-15.
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
    slug: 'alzheimer_amyloid_tau_cascade',
    name: 'Alzheimer disease — amyloid β + tau cascade',
    category: 'signaling',
    systems: ['nervous'],
    description: `The dominant pathogenic model for Alzheimer disease (AD), articulated by Hardy & Selkoe (1992) and updated through 2025+. Step 1: APP (amyloid precursor protein) processing — α-secretase cleavage is non-amyloidogenic; β-secretase (BACE1) + γ-secretase (presenilin-1/2 complex) cleavage produces Aβ40 + Aβ42 monomers. Step 2: Aβ42 aggregation kinetics — oligomers (soluble, synaptotoxic) → protofibrils → mature fibrils → plaques. Soluble oligomers are the most toxic species; plaques may be a less-toxic sink. Step 3: tau hyperphosphorylation — GSK-3β + CDK5 + DYRK1A phosphorylate tau at AD-specific epitopes (Thr231, Ser202/Thr205, Ser396/404) → tau detaches from microtubules → forms paired helical filaments → neurofibrillary tangles (NFTs). Tau pathology spatially follows Braak staging (entorhinal → hippocampus → neocortex) and correlates better with cognitive decline than Aβ. Step 4: synaptic + neuronal loss — Aβ oligomers disrupt LTP, NMDA receptor function, glutamate excitotoxicity; tau disrupts axonal transport. Step 5: neuroinflammation — Aβ activates microglia + complement → TREM2 + CR3-mediated synaptic pruning (cross-link [[neuroinflammation_microglia_priming]]); chronic neuroinflammation accelerates neurodegeneration. Genetics: familial AD (PSEN1, PSEN2, APP mutations) — early-onset; APOE-ε4 — late-onset risk factor (5-15x); TREM2, SORL1, ABCA7 — modest-effect GWAS hits. Therapeutics: cholinesterase inhibitors (donepezil, rivastigmine, galantamine) — symptomatic, modest effect; memantine — NMDA modulation; anti-amyloid mAbs (aducanumab, lecanemab, donanemab — not yet in registry) — first disease-modifying class but ARIA-E/H side effects, modest clinical benefit; psychedelic + ketamine programs in early trials. Cross-links: [[bdnf_trkb_neurotrophic]] (chronic anti-AD axis), [[neuroinflammation_microglia_priming]], [[mtor_signaling]] (rapamycin neuroprotection signal), [[apoptosis_bcl2_axis]], [[ros_oxidative_stress]] (oxidative + lipid peroxidation co-injuries).`,
    steps: [
      { from: 'APP (amyloid precursor protein)', to: 'Aβ40 + Aβ42 monomers', via: 'β-secretase (BACE1) + γ-secretase (presenilin-1/2) sequential cleavage (amyloidogenic path)' },
      { from: 'Aβ42 monomers', to: 'soluble oligomers → protofibrils → fibrils → plaques', via: 'concentration-driven aggregation; oligomers are the most synaptotoxic species' },
      { from: 'soluble Aβ42 oligomers', to: 'synaptic dysfunction + LTP impairment', via: 'NMDA receptor disruption; Ca²⁺ dyshomeostasis; mitochondrial damage' },
      { from: 'GSK-3β / CDK5 / DYRK1A active', to: 'tau hyperphosphorylation (Thr231, Ser202, Ser396)', via: 'kinase activity exceeds phosphatase (PP2A) capacity; insulin signaling failure contributes' },
      { from: 'hyperphosphorylated tau', to: 'paired helical filaments → neurofibrillary tangles', via: 'tau detaches from microtubules → axonal transport failure; Braak-stage spread' },
      { from: 'Aβ + tau + neuronal stress', to: 'microglial activation + complement-mediated synaptic pruning', via: 'TREM2 / CR3-driven; chronic neuroinflammation accelerates loss' },
      { from: 'sustained neuronal stress', to: 'synaptic + neuronal loss → cognitive decline', via: 'tau pathology spatially correlates with symptoms (Braak staging)' },
    ],
    modulators: [
      { slug: 'donepezil',     effect: 'inhibitor', target: 'AChE (cholinergic compensation; symptomatic)', note: 'First-line symptomatic Rx; modest cognitive benefit, no disease modification' },
      { slug: 'rivastigmine',  effect: 'inhibitor', target: 'AChE + BuChE' },
      { slug: 'galantamine',   effect: 'inhibitor', target: 'AChE + nAChR positive allosteric modulator' },
      { slug: 'memantine',     effect: 'inhibitor', target: 'NMDA receptor (use-dependent; reduces excitotoxic injury)', note: 'Often combined with AChEi in moderate-severe AD' },
      { slug: 'tacrine',       effect: 'inhibitor', target: 'AChE (historical; hepatotoxic, withdrawn)' },
      { slug: 'huperzine-a',   effect: 'inhibitor', target: 'AChE (OTC supplement)' },
      { slug: 'curcumin',      effect: 'inhibitor', target: 'Aβ aggregation (preclinical anti-amyloid)' },
      { slug: 'resveratrol',   effect: 'inhibitor', target: 'tau hyperphosphorylation (SIRT1-mediated)' },
      { slug: 'egcg',          effect: 'inhibitor', target: 'Aβ aggregation (preclinical)' },
      { slug: 'quercetin',     effect: 'inhibitor', target: 'tau + Aβ (preclinical)' },
      { slug: 'luteolin',      effect: 'inhibitor', target: 'neuroinflammation (microglial)' },
      { slug: 'dha',           effect: 'activator', target: 'membrane composition + anti-inflammatory (epidemiologic protective signal)' },
      { slug: 'alpha-tocopherol', effect: 'inhibitor', target: 'lipid peroxidation (modest in TEAM-AD: slowed functional decline)' },
      { slug: 'metformin',     effect: 'inhibitor', target: 'tau hyperphosphorylation via AMPK + insulin sensitization (observational signal)' },
      { slug: 'rapamycin',     effect: 'inhibitor', target: 'mTORC1 → ↑autophagy clearance of Aβ + tau (preclinical neuroprotection)' },
      { slug: 'psilocybin',    effect: 'activator', target: 'TrkB + 5-HT2A (synaptogenesis trials in AD-related depression + cognitive decline)' },
      { slug: 'ketamine',      effect: 'activator', target: 'BDNF/TrkB (rapid; trials in AD-MDD comorbidity)' },
      { slug: 'lithium',       effect: 'inhibitor', target: 'GSK-3β (tau hyperphosphorylation suppression)', note: 'Epidemiologic + small-trial signal for AD prevention; not standard Rx' },
      { slug: 'valproate',     effect: 'inhibitor', target: 'GSK-3β + HDAC' },
    ],
    refs: [
      'PMID:27255958', // Karran & De Strooper 2016 J Neurochem — amyloid cascade hypothesis revisited
    ],
  },

  {
    slug: 'parkinson_alpha_synuclein_aggregation',
    name: 'Parkinson disease — α-synuclein aggregation',
    category: 'signaling',
    systems: ['nervous'],
    description: `Parkinson disease (PD) progression centers on α-synuclein (SNCA) misfolding + aggregation in dopaminergic neurons. Step 1: α-synuclein expression — physiological role at presynaptic terminals (vesicle trafficking via SNARE-complex assembly). Step 2: misfolding — exposure to oxidative stress (rotenone, MPTP), mitochondrial dysfunction (complex I deficit), or genetic forms (SNCA point mutations A53T/A30P/E46K + duplications/triplications) → β-sheet conformer. Step 3: aggregation kinetics — monomer → oligomers (most toxic) → protofibrils → mature fibrils → Lewy bodies + Lewy neurites (the histopathologic signature). Step 4: prion-like spread — misfolded α-synuclein templates further misfolding cell-to-cell; staging via Braak hypothesis follows the olfactory bulb → brainstem → midbrain → cortex axis. Step 5: dopaminergic neurodegeneration — substantia nigra pars compacta loss → striatal DA depletion → motor symptoms (bradykinesia, rigidity, resting tremor) emerge at ~50-70% DA neuron loss. Step 6: cellular stress amplification — α-synuclein oligomers disrupt mitochondria, ER homeostasis (UPR — cross-link [[upr_er_stress_perk_ire1_atf6]]), lysosomes (CMA failure), and trigger microglial activation. Step 7: non-motor progression — autonomic dysfunction, REM sleep behavior disorder (often pre-motor), cognitive decline (PDD). Genetics: SNCA, LRRK2 (most common autosomal dominant), GBA (lysosomal — strongest single risk factor), PRKN/PINK1/DJ-1 (autosomal recessive — mitophagy defects). Therapeutics: levodopa + carbidopa — symptomatic gold standard; MAO-B inhibitors (selegiline, rasagiline) — DA preservation + possible neuroprotection; dopamine agonists; COMT inhibitors; deep brain stimulation. Disease-modifying programs in development (anti-α-synuclein mAbs, LRRK2 inhibitors, GBA gene therapy). Cross-links: [[catecholamine_synthesis]] (DA depletion), [[mitochondrial_peptide_signaling]] (complex I + mitophagy), [[autophagy_lc3_axis]] (lysosomal failure), [[neuroinflammation_microglia_priming]].`,
    steps: [
      { from: 'α-synuclein (physiological)', to: 'misfolded β-sheet conformer', via: 'oxidative stress + mitochondrial dysfunction + genetic mutation (A53T, A30P, E46K)' },
      { from: 'misfolded α-synuclein', to: 'soluble oligomers (most toxic species)', via: 'concentration-driven aggregation; oligomers > fibrils for cellular toxicity' },
      { from: 'oligomers', to: 'protofibrils → mature fibrils → Lewy bodies', via: 'characteristic histopathology — intraneuronal inclusions in dopaminergic neurons' },
      { from: 'misfolded α-synuclein (extracellular)', to: 'prion-like cell-to-cell templating', via: 'Braak staging: olfactory bulb → brainstem → midbrain → cortex' },
      { from: 'oligomers (intracellular)', to: 'mitochondrial dysfunction + ER stress + lysosomal failure', via: 'complex I inhibition; UPR activation; chaperone-mediated autophagy disruption' },
      { from: 'substantia nigra pars compacta neurons', to: 'progressive loss → striatal DA depletion', via: 'motor symptoms manifest at ~50–70% neuronal loss (long preclinical phase)' },
      { from: 'striatal DA depletion', to: 'motor symptoms (bradykinesia, rigidity, tremor)', via: 'D1/D2 striatal output imbalance → indirect-pathway hyperactivity' },
    ],
    modulators: [
      { slug: 'levodopa',     effect: 'substrate', target: 'DA replacement (DOPA → DA via aromatic amino acid decarboxylase)', note: 'Gold-standard symptomatic Rx; declining efficacy + motor fluctuations over years' },
      { slug: 'selegiline',   effect: 'inhibitor', target: 'MAO-B (DA preservation; possible neuroprotection)' },
      { slug: 'rasagiline',   effect: 'inhibitor', target: 'MAO-B (more selective than selegiline)' },
      { slug: 'rapamycin',    effect: 'inhibitor', target: 'mTORC1 → ↑autophagy clearance of α-synuclein (preclinical)' },
      { slug: 'curcumin',     effect: 'inhibitor', target: 'α-synuclein aggregation (preclinical anti-fibril)' },
      { slug: 'resveratrol',  effect: 'inhibitor', target: 'α-synuclein aggregation (SIRT1 + direct)' },
      { slug: 'egcg',         effect: 'inhibitor', target: 'α-synuclein aggregation (catechin direct binding)' },
      { slug: 'quercetin',    effect: 'inhibitor', target: 'α-synuclein + oxidative damage (preclinical)' },
      { slug: 'luteolin',     effect: 'inhibitor', target: 'neuroinflammation (microglia)' },
      { slug: 'melatonin',    effect: 'inhibitor', target: 'oxidative + nitrosative stress; circadian + REM-disorder co-management' },
      { slug: 'nac',          effect: 'cofactor',  target: 'GSH precursor → ↓oxidative injury (some clinical trials in PD)' },
      { slug: 'coq10',        effect: 'cofactor',  target: 'mitochondrial complex I support (QE3 trial null; smaller trials showed modest effect)' },
      { slug: 'alpha-tocopherol', effect: 'inhibitor', target: 'lipid peroxidation' },
    ],
    refs: [
      'PMID:30853581', // Mehra 2019 — α-synuclein misfolding + aggregation
    ],
  },

  {
    slug: 'atherosclerosis_plaque_pathology',
    name: 'Atherosclerosis plaque pathology',
    category: 'signaling',
    systems: ['cardiovascular', 'immune-hematologic'],
    description: `Atherosclerosis is a chronic lipid-driven + immune-driven arterial wall disease responsible for most cardiovascular mortality. Step 1: endothelial dysfunction — risk factors (LDL excess, hypertension, smoking, diabetes, oxidative stress) impair NO bioavailability + upregulate adhesion molecules (VCAM-1, ICAM-1, E-selectin). Step 2: LDL retention + oxidation — LDL particles transcytose into subendothelial space, retained by proteoglycans, oxidized (oxLDL) by ROS + myeloperoxidase. Step 3: monocyte recruitment + foam cell formation — monocytes adhere → migrate into intima → differentiate to macrophages → scavenger-receptor (CD36, SR-A1) uptake of oxLDL → cholesterol-laden "foam cells" → fatty streaks. Step 4: smooth-muscle migration + fibrous cap — VSMCs migrate from media to intima, proliferate, secrete collagen → fibrous cap encasing the lipid core. Step 5: plaque progression — necrotic core (apoptotic foam cells + cholesterol crystals + cellular debris); cholesterol crystals trigger NLRP3 inflammasome (cross-link [[pyroptosis_gasdermin]]); ongoing inflammation drives expansion. Step 6: plaque rupture or erosion — thin-cap fibroatheroma (vulnerable plaque): inflammation thins the cap (MMP-9 degradation), shear stress + sustained inflammation rupture it → exposure of thrombogenic core → platelet activation + coagulation cascade → arterial thrombus → MI / stroke. Therapeutics: statin-driven LDL lowering is the dominant evidence base (CTT meta-analyses); PCSK9 inhibition (evolocumab, alirocumab, inclisiran); icosapent ethyl (REDUCE-IT); antiplatelet (aspirin, P2Y12 inhibitors); anti-inflammatory targeting (canakinumab CANTOS, colchicine LoDoCo2/COLCOT). Cross-links: [[ldl_receptor_pcsk9_axis]] (cholesterol delivery), [[platelet_aggregation]] (thrombus), [[nfkb_signaling]] (inflammation), [[ferroptosis_gpx4_lipid_peroxidation]] (oxLDL).`,
    steps: [
      { from: 'cardiovascular risk factors (LDL ↑, HTN, smoking, DM, ↓NO)', to: 'endothelial dysfunction', via: '↓ eNOS activity + adhesion molecule upregulation (VCAM-1, ICAM-1, E-selectin)' },
      { from: 'circulating LDL', to: 'subendothelial retention + oxidation (oxLDL)', via: 'transcytosis → proteoglycan retention → ROS + myeloperoxidase oxidation' },
      { from: 'monocyte adhesion + migration', to: 'macrophage foam cells (fatty streaks)', via: 'CD36 + SR-A1 scavenger uptake of oxLDL → unregulated cholesterol accumulation' },
      { from: 'VSMC migration from media', to: 'fibrous cap formation', via: 'collagen + ECM secretion encases lipid core; cap thickness determines stability' },
      { from: 'apoptotic foam cells + cholesterol crystals', to: 'necrotic core + NLRP3 inflammasome activation', via: 'cross-link to pyroptosis pathway — cholesterol crystals are NLRP3 triggers' },
      { from: 'thin-cap fibroatheroma + sustained inflammation', to: 'plaque rupture / erosion', via: 'MMP-9 degrades cap; shear stress + inflammation tip the balance' },
      { from: 'rupture exposure of thrombogenic core', to: 'platelet activation + coagulation → arterial thrombus', via: 'tissue factor + collagen → MI / ischemic stroke / acute limb ischemia' },
    ],
    modulators: [
      { slug: 'atorvastatin',     effect: 'inhibitor', target: 'HMG-CoA reductase → LDL ↓ + plaque stabilization' },
      { slug: 'rosuvastatin',     effect: 'inhibitor', target: 'HMG-CoA reductase (most potent LDL-lowering statin)' },
      { slug: 'simvastatin',      effect: 'inhibitor', target: 'HMG-CoA reductase' },
      { slug: 'pravastatin',      effect: 'inhibitor', target: 'HMG-CoA reductase (hydrophilic — fewer DDIs)' },
      { slug: 'lovastatin',       effect: 'inhibitor', target: 'HMG-CoA reductase' },
      { slug: 'pitavastatin',     effect: 'inhibitor', target: 'HMG-CoA reductase' },
      { slug: 'ezetimibe',        effect: 'inhibitor', target: 'NPC1L1 (intestinal cholesterol absorption)' },
      { slug: 'evolocumab',       effect: 'inhibitor', target: 'PCSK9 mAb → ↑LDL receptor recycling → ↓LDL', note: 'FOURIER + ODYSSEY CV-event reduction; ~60% LDL-C drop on statin background' },
      { slug: 'alirocumab',       effect: 'inhibitor', target: 'PCSK9 mAb' },
      { slug: 'inclisiran',       effect: 'inhibitor', target: 'PCSK9 siRNA (subcutaneous q6mo)' },
      { slug: 'bempedoic-acid',   effect: 'inhibitor', target: 'ATP citrate lyase (statin-intolerant; CLEAR Outcomes)' },
      { slug: 'aspirin',          effect: 'inhibitor', target: 'platelet COX-1 (secondary prevention)' },
      { slug: 'clopidogrel',      effect: 'inhibitor', target: 'P2Y12 (antiplatelet)' },
      { slug: 'ticagrelor',       effect: 'inhibitor', target: 'P2Y12 (reversible)' },
      { slug: 'icosapent-ethyl',  effect: 'inhibitor', target: 'EPA-only — CV event reduction (REDUCE-IT 4 g/d on statin)' },
      { slug: 'epa',              effect: 'inhibitor', target: 'plaque inflammation + membrane composition' },
      { slug: 'colchicine',       effect: 'inhibitor', target: 'NLRP3 + microtubule → ↓plaque inflammation' },
      { slug: 'colchicine-low-dose-cv', effect: 'inhibitor', target: 'NLRP3 (LoDoCo2/COLCOT post-MI CV benefit)' },
      { slug: 'empagliflozin',    effect: 'inhibitor', target: 'CV mortality reduction (EMPA-REG) — multifactorial beyond glycemia' },
      { slug: 'semaglutide',      effect: 'inhibitor', target: 'GLP-1R → cardiometabolic risk ↓ (SELECT CV outcomes)' },
      { slug: 'tirzepatide',      effect: 'inhibitor', target: 'GLP-1/GIP dual → cardiometabolic risk ↓' },
      { slug: 'curcumin',         effect: 'inhibitor', target: 'oxLDL + plaque inflammation (preclinical)' },
      { slug: 'resveratrol',      effect: 'inhibitor', target: 'endothelial function + SIRT1' },
    ],
    refs: [
      'PMID:33883728', // Libby 2021 Nature — changing landscape of atherosclerosis (landmark)
    ],
  },

  {
    slug: 'neuroinflammation_microglia_priming',
    name: 'Neuroinflammation — microglial priming',
    category: 'signaling',
    systems: ['nervous', 'immune-hematologic'],
    description: `Microglia are the resident innate immune cells of the CNS, originating from yolk-sac erythromyeloid progenitors during embryogenesis. Step 1: homeostatic state — surveillance of synaptic + parenchymal space; phagocytosis of debris + apoptotic cells; complement-tagged synaptic pruning (developmental and adult). Step 2: activation trigger — pathogen exposure, sterile injury, protein aggregates (Aβ, α-synuclein, mutant huntingtin), DAMPs (HMGB1, ATP, mitochondrial DNA). Step 3: priming — chronic low-grade stimulation lowers the activation threshold without producing full activation; primed microglia hyper-respond to subsequent triggers ("microglial reactivity hypersensitivity"). Step 4: activation phenotypes — historically M1 (pro-inflammatory: TNF-α, IL-1β, IL-6, NO, ROS) vs M2 (anti-inflammatory: IL-10, TGF-β, arginase, debris clearance); modern view recognizes continuum + disease-associated microglia (DAM) signature (Trem2-high). Step 5: chronic activation pathology — sustained pro-inflammatory output → bystander neuronal damage; complement-mediated synaptic pruning excess → cognitive decline (Alzheimer, schizophrenia, lupus-CNS); NLRP3 inflammasome → IL-1β + pyroptosis. Step 6: cross-talk — astrocyte reactivity (A1 neurotoxic vs A2 reparative); blood-brain barrier disruption recruits peripheral myeloid cells; chronic neuroinflammation contributes to AD, PD, MS, traumatic brain injury, depression. Therapeutic targets: NLRP3 (canakinumab, MCC950), microglial CSF1R (pexidartinib — preclinical CNS), TREM2 agonists (early clinical), classical anti-inflammatories (corticosteroids, minocycline — modest CNS penetration), psychobiotics + omega-3 + curcumin (chronic anti-inflammatory). Cross-links: [[tlr_innate_signaling]] (TLR4 + microglia), [[cgas_sting_type1_ifn]] (cytosolic DNA → IFN), [[nlrp3_inflammasome]] (canonical microglial inflammasome), [[alzheimer_amyloid_tau_cascade]], [[parkinson_alpha_synuclein_aggregation]].`,
    steps: [
      { from: 'homeostatic microglia (P2RY12+ TMEM119+)', to: 'surveillance + synaptic pruning + debris clearance', via: 'process motility scanning the parenchyma; complement-tagged spine pruning' },
      { from: 'DAMPs / PAMPs / protein aggregates', to: 'TLR + RAGE + NLRP3 + cGAS engagement', via: 'multiple PRRs converge on NF-κB + inflammasome priming' },
      { from: 'chronic low-grade stimulation', to: 'primed microglia (lowered activation threshold)', via: 'epigenetic + metabolic reprogramming; hyper-respond to subsequent stimulus' },
      { from: 'full activation trigger', to: 'pro-inflammatory secretion (TNF-α, IL-1β, IL-6, NO, ROS)', via: 'classical "M1" phenotype; bystander neuronal damage' },
      { from: 'NLRP3 inflammasome assembly', to: 'caspase-1 → IL-1β maturation + GSDMD pyroptosis', via: 'cross-link to [[pyroptosis_gasdermin]] — cholesterol/Aβ/α-syn crystals are triggers' },
      { from: 'chronic neuroinflammation', to: 'synaptic loss + neuronal injury + BBB compromise', via: 'feedback amplification through astrocyte reactivity + peripheral myeloid recruitment' },
    ],
    modulators: [
      { slug: 'minocycline',     effect: 'inhibitor', target: 'microglial activation (CNS-penetrant; clinical trials in PD + AD + depression)' },
      { slug: 'hydroxychloroquine', effect: 'inhibitor', target: 'lysosomal acidification + TLR9 + cGAS-STING (autoimmune CNS — lupus)' },
      { slug: 'colchicine',      effect: 'inhibitor', target: 'NLRP3 + microtubule trafficking' },
      { slug: 'colchicine-low-dose-cv', effect: 'inhibitor', target: 'NLRP3 (CV-context low-dose)' },
      { slug: 'dexamethasone',   effect: 'inhibitor', target: 'GR transrepression of NF-κB target cytokines' },
      { slug: 'prednisone',      effect: 'inhibitor', target: 'GR transrepression' },
      { slug: 'methylprednisolone', effect: 'inhibitor', target: 'GR (MS pulse + acute CNS injury)' },
      { slug: 'melatonin',       effect: 'inhibitor', target: 'microglial NF-κB; oxidative stress; circadian-driven anti-inflammatory' },
      { slug: 'dha',             effect: 'inhibitor', target: 'pro-resolving mediator precursor (resolvins, protectins)' },
      { slug: 'epa',             effect: 'inhibitor', target: 'pro-resolving mediator precursor' },
      { slug: 'curcumin',        effect: 'inhibitor', target: 'NF-κB + NLRP3 (chronic, modest clinical signal in CNS)' },
      { slug: 'resveratrol',     effect: 'inhibitor', target: 'SIRT1 → ↓microglial activation' },
      { slug: 'quercetin',       effect: 'inhibitor', target: 'NLRP3 + microglial inflammasome' },
      { slug: 'luteolin',        effect: 'inhibitor', target: 'microglial activation (preclinical neuroprotection)' },
      { slug: 'egcg',            effect: 'inhibitor', target: 'NF-κB + NLRP3' },
      { slug: 'metformin',       effect: 'inhibitor', target: 'AMPK → ↓microglial NLRP3' },
      { slug: 'rapamycin',       effect: 'inhibitor', target: 'mTORC1 → microglial autophagy enhancement' },
      { slug: 'tofacitinib',     effect: 'inhibitor', target: 'JAK1/3 → ↓IFN + cytokine signaling in CNS' },
      { slug: 'baricitinib',     effect: 'inhibitor', target: 'JAK1/2 → ↓IFN signature (used in CANDLE/SAVI interferonopathies)' },
      { slug: 'withaferin-a',    effect: 'inhibitor', target: 'NF-κB → ↓microglial cytokine output' },
      { slug: 'withanolide-a',   effect: 'inhibitor', target: 'neuroinflammation (preclinical via NF-κB + BDNF cross-talk)' },
      { slug: 'beta-hydroxybutyrate', effect: 'inhibitor', target: 'NLRP3 inhibition (direct binding; ketogenic anti-inflammatory)' },
    ],
    refs: [
      'PMID:32807643', // Chausse 2021 — microglia and lipids: metabolism controls brain innate immunity
      'PMID:33182554', // Marogianni 2020 — neurodegeneration + inflammation in PD
    ],
  },

  {
    slug: 'asthma_th2_eosinophil_inflammation',
    name: 'Asthma — Th2 / eosinophil inflammation',
    category: 'signaling',
    systems: ['respiratory', 'immune-hematologic'],
    description: `Asthma is a heterogeneous chronic airway disease. The dominant phenotype is Type-2 (T2-high) inflammation driven by eosinophils + Th2 cytokines. Step 1: trigger — inhaled allergen, virus, irritant. Step 2: epithelial alarmins — damaged airway epithelium releases TSLP (thymic stromal lymphopoietin), IL-25, IL-33 — the "alarmin axis." Step 3: ILC2 + Th2 activation — TSLP + IL-33 + IL-25 activate group 2 innate lymphoid cells (ILC2) + naive CD4+ T cells differentiating to Th2 → IL-4, IL-5, IL-13 production. Step 4: IgE class switching — IL-4 + IL-13 drive B-cell IgE class switching; IgE binds high-affinity FcεRI on mast cells + basophils. Step 5: mast-cell degranulation — allergen-IgE-FcεRI cross-linking → histamine, tryptase, leukotrienes (LTC4/D4/E4), prostaglandins (PGD2) → bronchoconstriction + vascular leak + mucus + neural reflex. Step 6: eosinophil recruitment — IL-5 → bone marrow eosinophil release + survival; eotaxins (CCL11/24/26) → airway homing; eosinophilic infiltrate releases major basic protein, ECP, EDN → epithelial damage + remodeling. Step 7: airway remodeling — chronic Th2-eosinophil inflammation → goblet cell hyperplasia + mucus, smooth-muscle hypertrophy, subepithelial fibrosis, irreversible loss of FEV1. Therapeutics by mechanism: ICS (fluticasone, budesonide, beclomethasone, ciclesonide, mometasone) — anti-inflammatory mainstay; LABA (salmeterol, formoterol) + LAMA (tiotropium, umeclidinium); leukotriene modifiers (montelukast, zafirlukast, zileuton); anti-IgE (omalizumab); anti-IL-5 (mepolizumab, reslizumab, benralizumab — not in registry); anti-IL-4Rα (dupilumab — blocks IL-4 + IL-13); anti-TSLP (tezepelumab — pan-T2). Cross-links: [[mast_cell_leukotriene_axis]], [[arachidonic_acid_cascade]] (LT + PG), [[jak_stat_signaling]] (cytokine signaling), [[tlr_innate_signaling]] (alarmin upstream).`,
    steps: [
      { from: 'inhaled allergen / virus / irritant', to: 'airway epithelial damage + alarmin release', via: 'TSLP + IL-33 + IL-25 secretion from compromised epithelium' },
      { from: 'alarmins (TSLP, IL-33, IL-25)', to: 'ILC2 + Th2 cell activation', via: 'group-2 innate lymphoid cells + naive CD4+ → Th2 polarization (GATA3 transcription factor)' },
      { from: 'Th2 / ILC2 cytokines', to: 'IL-4, IL-5, IL-13 secretion', via: 'IL-4 → B-cell IgE class switching; IL-5 → eosinophil mobilization; IL-13 → mucus + AHR' },
      { from: 'IL-4 + IL-13 (B cells)', to: 'IgE class switching → high-affinity binding to mast-cell FcεRI', via: 'allergen-IgE bridging on FcεRI triggers degranulation' },
      { from: 'mast cell degranulation', to: 'histamine + leukotrienes (LTC4/D4/E4) + PGD2 release', via: 'bronchoconstriction + vascular leak + mucus + neural reflex (cross-link arachidonic_acid_cascade)' },
      { from: 'IL-5 axis', to: 'eosinophil bone-marrow release → eotaxin-driven airway homing', via: 'CCL11/24/26 chemokines; eosinophil survival + maturation' },
      { from: 'chronic Th2-eosinophil inflammation', to: 'airway remodeling (smooth-muscle hypertrophy + subepithelial fibrosis + goblet-cell hyperplasia)', via: 'irreversible FEV1 loss; remodeling is the late-stage target' },
    ],
    modulators: [
      { slug: 'fluticasone',     effect: 'inhibitor', target: 'GR → ↓Th2 cytokine transcription + ↓eosinophil survival (ICS mainstay)' },
      { slug: 'budesonide',      effect: 'inhibitor', target: 'GR (ICS; widely used in pediatric)' },
      { slug: 'beclomethasone',  effect: 'inhibitor', target: 'GR (ICS, prodrug)' },
      { slug: 'ciclesonide',     effect: 'inhibitor', target: 'GR (ICS, on-site activation in lung — lower systemic effect)' },
      { slug: 'mometasone',      effect: 'inhibitor', target: 'GR (ICS)' },
      { slug: 'salmeterol',      effect: 'activator', target: 'β2-AR (LABA; partners with ICS)' },
      { slug: 'formoterol',      effect: 'activator', target: 'β2-AR (LABA; faster onset than salmeterol)' },
      { slug: 'albuterol',       effect: 'activator', target: 'β2-AR (SABA — rescue inhaler)' },
      { slug: 'ipratropium',     effect: 'inhibitor', target: 'M3 muscarinic (SAMA; adjunct + COPD)' },
      { slug: 'tiotropium',      effect: 'inhibitor', target: 'M3 (LAMA — Trelegy + SMART regimens)' },
      { slug: 'umeclidinium',    effect: 'inhibitor', target: 'M3 (LAMA component of Trelegy ICS/LABA/LAMA)' },
      { slug: 'aclidinium',      effect: 'inhibitor', target: 'M3 (LAMA)' },
      { slug: 'montelukast',     effect: 'inhibitor', target: 'CysLT1 receptor (leukotriene antagonist)' },
      { slug: 'zafirlukast',     effect: 'inhibitor', target: 'CysLT1 receptor' },
      { slug: 'zileuton',        effect: 'inhibitor', target: '5-lipoxygenase (upstream leukotriene synthesis)' },
      { slug: 'omalizumab',      effect: 'inhibitor', target: 'IgE (anti-IgE mAb; severe allergic asthma)' },
      { slug: 'dupilumab',       effect: 'inhibitor', target: 'IL-4Rα → blocks IL-4 + IL-13 signaling (broad T2 effect)' },
      { slug: 'prednisone',      effect: 'inhibitor', target: 'GR (systemic — exacerbation Rx; not chronic)' },
      { slug: 'dexamethasone',   effect: 'inhibitor', target: 'GR (acute exacerbation)' },
    ],
    refs: [
      'PMID:32319104', // Akdis 2020 Allergy — Type 2 immunity in skin and lungs
    ],
  },

  {
    slug: 'nafld_mash_steatohepatitis',
    name: 'NAFLD / MASH — steatohepatitis progression',
    category: 'signaling',
    systems: ['digestive', 'endocrine', 'cardiovascular'],
    description: `Metabolic dysfunction-associated steatotic liver disease (MASLD, renamed from NAFLD in 2023) is the most common chronic liver disease worldwide, with metabolic dysfunction-associated steatohepatitis (MASH, formerly NASH) as its inflammatory progression. Step 1: hepatic steatosis (MASLD) — visceral adiposity + insulin resistance → ↑lipolysis → free fatty acid (FFA) flux to liver → triglyceride accumulation (>5% hepatocyte fat). De novo lipogenesis via SREBP-1c + ChREBP also contributes; insulin resistance fails to suppress hepatic gluconeogenesis. Step 2: hepatocyte lipotoxicity — saturated FFAs + lysophosphatidylcholines + ceramides + free cholesterol drive ER stress (cross-link [[upr_er_stress_perk_ire1_atf6]]), mitochondrial dysfunction, oxidative stress. Step 3: MASH activation — hepatocyte injury releases DAMPs → Kupffer cell + macrophage activation → TNF-α, IL-1β, IL-6, CCL2 → recruits monocytes; NLRP3 inflammasome activation. Step 4: hepatic stellate cell (HSC) activation — quiescent HSCs → activated myofibroblast phenotype (α-SMA+, type I collagen-secreting) → fibrosis F1 → F2 → F3 → F4 cirrhosis. TGF-β + PDGF + LPS-TLR4 are major HSC activators. Step 5: HCC risk — cirrhosis-derived hepatocellular carcinoma; MASH is now a leading liver-transplant indication. Therapeutics — pharmacological: incretins (semaglutide ESSENCE/REGENERATE-class trials, tirzepatide, retatrutide), THR-β agonist resmetirom (Rezdiffra — first MASH FDA approval 2024), pioglitazone (insulin sensitizer + PPARγ), vitamin E (PIVENS trial), FXR agonists (obeticholic acid — withdrew NASH program), PPARα/δ pan-agonists (lanifibranor, elafibranor — phase 3). Lifestyle: 5–10% weight loss reverses early steatosis; ≥10% reverses some fibrosis. Cross-links: [[insulin_glucose_homeostasis]] (IR upstream), [[fxr_tgr5_bile_acid_receptor]] (FXR Rx target), [[ppar_alpha_gamma_delta]] (TZD + fibrate Rx), [[ferroptosis_gpx4_lipid_peroxidation]] (hepatocyte lipid peroxidation in MASH).`,
    steps: [
      { from: 'visceral adiposity + insulin resistance', to: '↑hepatic FFA flux + de novo lipogenesis', via: '↑lipolysis + SREBP-1c/ChREBP-driven lipogenesis; insulin fails to suppress gluconeogenesis' },
      { from: 'hepatocyte triglyceride accumulation (>5%)', to: 'simple steatosis (MASLD)', via: 'usually asymptomatic; reversible with weight loss' },
      { from: 'lipotoxic species (saturated FFAs, ceramides, free cholesterol)', to: 'hepatocyte ER stress + mitochondrial dysfunction', via: 'UPR activation; ROS; lipid peroxidation' },
      { from: 'hepatocyte injury → DAMP release', to: 'Kupffer cell + monocyte activation (MASH)', via: 'NLRP3 + TNF-α + IL-1β; ballooning hepatocytes + inflammatory infiltrate' },
      { from: 'TGF-β + PDGF + LPS-TLR4', to: 'hepatic stellate cell activation → myofibroblast', via: 'α-SMA+ collagen-secreting phenotype; fibrosis F1 → F4' },
      { from: 'progressive fibrosis', to: 'cirrhosis (F4) + portal hypertension + HCC risk', via: 'leading liver-transplant indication; HCC even pre-cirrhosis in MASH' },
    ],
    modulators: [
      { slug: 'semaglutide',     effect: 'activator', target: 'GLP-1R → weight loss + ↓hepatic FFA flux + direct anti-steatotic', note: 'ESSENCE trial: MASH resolution + ↑fibrosis improvement' },
      { slug: 'tirzepatide',     effect: 'activator', target: 'GLP-1/GIP dual → larger weight loss → MASH resolution (SYNERGY-NASH)' },
      { slug: 'liraglutide',     effect: 'activator', target: 'GLP-1R' },
      { slug: 'dulaglutide',     effect: 'activator', target: 'GLP-1R' },
      { slug: 'retatrutide',     effect: 'activator', target: 'GLP-1/GIP/GCG triple — largest weight loss class; MASH program' },
      { slug: 'pioglitazone',    effect: 'activator', target: 'PPARγ → insulin sensitization + adipose redistribution; PIVENS evidence' },
      { slug: 'rosiglitazone',   effect: 'activator', target: 'PPARγ (CV signal limits use)' },
      { slug: 'alpha-tocopherol', effect: 'inhibitor', target: 'lipid peroxidation; PIVENS trial: NASH resolution at 800 IU/d' },
      { slug: 'metformin',       effect: 'inhibitor', target: 'hepatic gluconeogenesis + AMPK → ↓steatosis (modest)' },
      { slug: 'empagliflozin',   effect: 'inhibitor', target: 'SGLT2 → weight loss + ↓steatosis (E-LIFT signal)' },
      { slug: 'dapagliflozin',   effect: 'inhibitor', target: 'SGLT2 → similar pattern' },
      { slug: 'canagliflozin',   effect: 'inhibitor', target: 'SGLT2' },
      { slug: 'dha',             effect: 'inhibitor', target: 'hepatic steatosis (membrane composition + anti-inflammatory)' },
      { slug: 'epa',             effect: 'inhibitor', target: 'hepatic inflammation' },
      { slug: 'curcumin',        effect: 'inhibitor', target: 'hepatic NF-κB + lipogenesis (preclinical + small trials)' },
      { slug: 'silymarin',       effect: 'inhibitor', target: 'hepatic oxidative stress + fibrogenesis (modest evidence in MASH)' },
      { slug: 'milk-thistle',    effect: 'inhibitor', target: 'silymarin source' },
      { slug: 'atorvastatin',    effect: 'inhibitor', target: 'CV co-risk treatment in MASH; appears safe + may improve hepatic outcomes' },
      { slug: 'niacin',          effect: 'inhibitor', target: 'dyslipidemia in MASH (limited primary effect on liver)' },
    ],
    refs: [
      'PMID:38851997', // EASL-EASD-EASO 2024 — MASLD clinical practice guidelines
      'PMID:39609545', // Do 2025 Nat Rev Drug Discov — MASH therapeutic landscape
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
