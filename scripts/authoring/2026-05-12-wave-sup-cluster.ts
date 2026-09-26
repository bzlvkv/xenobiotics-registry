/**
 * 2026-05-12-wave-sup-cluster.ts — Supplements / Pharmacognosy (SUP-1..7).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'adaptogen_hpa_stress_modulation',
    name: 'Adaptogen HPA / cortisol stress modulation',
    category: 'signaling',
    systems: ['endocrine', 'nervous'],
    description: `"Adaptogen" is a regulatory category (Soviet Lazarev/Brekhman 1947-69) for non-specific stress-resistance modulators acting on HPA axis + monoamines + heat-shock proteins. Mechanism evidence is patchier than pharmaceutical pathways — most adaptogen claims rest on traditional use + animal pharmacology + small clinical trials with mixed outcomes. Ashwagandha (Withania somnifera) lowers cortisol in chronic-stress samples (Indian Ayurvedic). Rhodiola rosea contains salidroside + rosavins → MAO inhibition + 5-HT modulation. Panax ginseng (Korean/American) ginsenosides modulate HPA + nitric oxide. Eleuthero (Siberian "ginseng") — separate genus, similar use. Bacopa monnieri → bacosides + cerebral blood flow + AChE modulation. Holy basil (tulsi), schisandra, maca, gotu kola, astragalus all marketed in the same category. Mechanism prose herein reflects current consensus — many specific claims need full-text trial citation for kinetic parameters.`,
    steps: [
      { from: 'chronic-psychophysical-stress', to: 'hpa-axis-dysregulation', via: 'sustained cortisol elevation + reduced negative feedback sensitivity' },
      { from: 'adaptogen-extract', to: 'normalized-hpa-output', via: 'mechanism varies — monoamine modulation + HSP induction + cortisol-curve flattening' },
    ],
    modulators: [
      { slug: 'ashwagandha', effect: 'inhibitor', target: 'HPA cortisol output (down)', note: 'Withania somnifera; meta-analyses show cortisol reduction + sleep/anxiety improvement in chronically-stressed samples' },
      { slug: 'ashwagandha-ksm66', effect: 'inhibitor', target: 'HPA cortisol output (standardized extract)', note: 'standardized to 5% withanolides; commonly studied form in clinical trials' },
      { slug: 'ashwagandha-sensoril', effect: 'inhibitor', target: 'HPA cortisol output (standardized extract)', note: 'standardized to 10% withanolides + 32% oligosaccharides; competing branded extract' },
      { slug: 'ashwagandha-shoden', effect: 'inhibitor', target: 'HPA cortisol output (standardized extract)', note: 'standardized to 35% withanolide glycosides; high-potency form' },
      { slug: 'rhodiola-rosea', effect: 'inhibitor', target: 'MAO + 5-HT modulation + HSP induction', note: 'salidroside + rosavins; fatigue + mild depression + cognitive fatigue under stress' },
      { slug: 'rosavin', effect: 'inhibitor', target: 'MAO modulation (R. rosea constituent)', note: 'one of three primary Rhodiola actives; tracked separately when sold as isolate' },
      { slug: 'salidroside', effect: 'inhibitor', target: 'MAO + HSP70 induction', note: 'rhodiola active; Hsp70 induction → stress tolerance + neuroprotection in animal models' },
      { slug: 'panax-ginseng', effect: 'activator', target: 'NO + HPA modulation (ginsenosides)', note: 'Korean/Asian ginseng; Rb1/Rg1/Rg3 ginsenosides — different mechanism each; energy + cognitive claims' },
      { slug: 'ginsenoside-rb1', effect: 'inhibitor', target: 'NMDA antagonism + HSP induction', note: 'major Panax ginsenoside; calming + neuroprotective profile' },
      { slug: 'ginsenoside-rg1', effect: 'activator', target: 'NO release + glucocorticoid receptor', note: 'stimulating ginsenoside; complementary to Rb1' },
      { slug: 'ginsenoside-rg3', effect: 'inhibitor', target: 'VEGF + multiple cancer pathways (in vitro)', note: 'oncology-claimed ginsenoside; research stage; food-supplement market' },
      { slug: 'eleuthero', effect: 'activator', target: 'HPA + heat-shock modulation', note: 'Eleutherococcus senticosus (formerly "Siberian ginseng"); separate genus from Panax' },
      { slug: 'bacopa', effect: 'inhibitor', target: 'AChE + cerebral blood flow + antioxidant', note: 'Bacopa monnieri; cognitive enhancement in chronic dosing (8-12 weeks); bacosides as actives' },
      { slug: 'holy-basil', effect: 'inhibitor', target: 'HPA + COX-2 + 5-LOX', note: 'tulsi; Ayurvedic adaptogen; eugenol + ursolic acid actives' },
      { slug: 'maca', effect: 'activator', target: 'undefined (no specific receptor target identified)', note: 'Lepidium meyenii Peruvian root; libido + energy claims; mechanism not specifically established' },
      { slug: 'astragalus', effect: 'activator', target: 'immune modulation + telomerase activation (TA-65)', note: 'Astragalus membranaceus; TCM tonic; astragaloside IV cited for cardiovascular + anti-aging' },
      { slug: 'gotu-kola', effect: 'activator', target: 'collagen synthesis + GABA-A potentiation', note: 'Centella asiatica; asiaticoside actives; wound healing + cognitive use' },
      { slug: 'schisandra', effect: 'activator', target: 'multi-target (hepatoprotective + nootropic)', note: 'Schisandra chinensis; lignans (schisandrin) as actives; classic TCM five-flavor berry' },
      { slug: 'tongkat-ali', effect: 'activator', target: 'SHBG modulation + free-T elevation', note: 'Eurycoma longifolia; libido + male hormone claims; eurycomanone actives' },
    ],
    refs: [],
  },
  {
    slug: 'nrf2_keap1_antioxidant_response',
    name: 'Nrf2 / Keap1 antioxidant response (polyphenol + flavonoid activators)',
    category: 'signaling',
    systems: ['immune-hematologic', 'digestive'],
    description: `Nrf2 (NFE2L2) is the master transcription factor for antioxidant + phase II detoxification genes. Under basal conditions, Keap1 (cytoplasmic) ubiquitinates Nrf2 → proteasomal degradation. Electrophilic / oxidative stress modifies cysteine residues on Keap1 → Nrf2 released → nuclear translocation → ARE (antioxidant response element) binding → induces HO-1, NQO1, glutathione synthesis, GST, UGT1A enzymes. Many polyphenol + flavonoid + isothiocyanate compounds activate this pathway: sulforaphane (broccoli isothiocyanate — most potent Nrf2 inducer in nature), curcumin, resveratrol, EGCG, quercetin, urolithin-A. Polyphenols are not single-target — they hit Nrf2 + sirtuins + AMPK + cyclic-AMP downstream of metabolite-based signaling. Long-term clinical trials are mostly null for hard outcomes despite robust mechanistic signals — the bioavailability + first-pass conjugation gap remains poorly bridged.`,
    steps: [
      { from: 'oxidative-or-electrophilic-stress', to: 'keap1-cysteine-modification', via: 'electrophile/ROS oxidizes Keap1 Cys151/Cys273/Cys288 → conformational change → Nrf2 release' },
      { from: 'nrf2-stabilization', to: 'antioxidant-gene-transcription', via: 'nuclear translocation → ARE binding → HO-1/NQO1/GST/UGT/GCL transcription' },
    ],
    modulators: [
      { slug: 'sulforaphane', effect: 'activator', target: 'Keap1 (cysteine modification → Nrf2 release)', note: 'isothiocyanate from broccoli/sprouts; most potent natural Nrf2 inducer; phase 2 trial in autism (Singh 2014)' },
      { slug: 'curcumin', effect: 'activator', target: 'Nrf2 + NF-κB + COX-2 (multi-target)', note: 'turmeric; poor bioavailability (low water solubility) — phytosomal/Meriva/piperine formulations 3-29× better' },
      { slug: 'curcumin-meriva', effect: 'activator', target: 'Nrf2 (phospholipid-complex formulation)', note: 'phytosomal curcumin; ~29× bioavailability of plain curcumin (Cuomo 2011)' },
      { slug: 'resveratrol', effect: 'activator', target: 'SIRT1 + Nrf2 + AMPK', note: 'stilbenoid from red grape skins; sirtuin activation drives healthspan claims; clinical results mixed for cardiovascular outcomes' },
      { slug: 'pterostilbene', effect: 'activator', target: 'Nrf2 + SIRT1 (dimethyl-resveratrol)', note: 'resveratrol analog; better oral bioavailability than parent; similar mechanistic profile' },
      { slug: 'egcg', effect: 'activator', target: 'Nrf2 + COMT inhibition + receptor cross-talk', note: 'epigallocatechin-3-gallate; green tea catechin; hepatotoxicity at high doses (>700 mg/d EGCG)' },
      { slug: 'quercetin', effect: 'activator', target: 'Nrf2 + COMT + xanthine oxidase + mast cell stabilization', note: 'broad-spectrum flavonoid; poor bioavailability; isoquercetin formulations ~20× better' },
      { slug: 'urolithin-a', effect: 'activator', target: 'mitophagy + Nrf2', note: 'gut microbiota metabolite of ellagitannins; mitochondrial biogenesis; supplement form (Mitopure) bypasses microbiome variability' },
      { slug: 'urolithin-b', effect: 'activator', target: 'mitophagy + Nrf2', note: 'related urolithin; less commercialized than urolithin-A; same gut-metabolite source' },
      { slug: 'ergothioneine', effect: 'activator', target: 'mitochondrial antioxidant (OCTN1 transporter-mediated uptake)', note: 'unique amino-acid antioxidant; OCTN1-concentrated in tissues; mushroom-rich diets' },
      { slug: 'fisetin', effect: 'activator', target: 'senolytic + Nrf2', note: 'flavonoid; senescent-cell-eliminating activity in animal models; strawberry-rich source' },
      { slug: 'hesperidin', effect: 'activator', target: 'Nrf2 + COMT modulation', note: 'citrus flavanone; antioxidant + venotonic; OTC for chronic venous insufficiency in Europe' },
      { slug: 'kaempferol', effect: 'activator', target: 'Nrf2 + estrogen-receptor modulation', note: 'plant-derived flavonoid; broad antioxidant + estrogen-like activity' },
      { slug: 'apigenin', effect: 'activator', target: 'Nrf2 + CYP inhibition + benzodiazepine-site BZD', note: 'flavonoid; chamomile component; weak BZD-site activity → sedation; CYP1A2/2C9 inhibitor' },
      { slug: 'luteolin', effect: 'activator', target: 'Nrf2 + mast cell stabilizer', note: 'flavonoid; allergy/mast-cell claims; quercetin-class' },
      { slug: 'catechin', effect: 'activator', target: 'Nrf2 + COMT', note: 'tea/cocoa flavanol; lesser potency than EGCG; antioxidant + vasodilator claims' },
      { slug: 'epicatechin', effect: 'activator', target: 'Nrf2 + nitric oxide release', note: 'cocoa flavanol; vasodilation + endothelial function studied' },
      { slug: 'naringenin', effect: 'activator', target: 'Nrf2 + CYP3A4 modulator (grapefruit constituent — but naringin is the bigger DDI driver)', note: 'citrus flavanone; OATP inhibition for fexofenadine; mild CYP modulation' },
      { slug: 'rutin', effect: 'activator', target: 'Nrf2 + venous tone', note: 'flavonoid glycoside; chronic venous insufficiency; supplement claim' },
      { slug: 'silymarin', effect: 'activator', target: 'Nrf2 + hepatoprotection', note: 'milk thistle flavonolignan; silibinin is the major active; hepatoprotective claims + Amanita mushroom poisoning antidote (silibinin IV)' },
      { slug: 'baicalein', effect: 'activator', target: 'Nrf2 + COX-2 + lipoxygenase', note: 'Scutellaria flavone; anti-inflammatory + neuroprotective claims' },
      { slug: 'ellagic-acid', effect: 'activator', target: 'Nrf2 + carcinogen metabolism modulation', note: 'pomegranate / berry polyphenol; ellagitannin parent; precursor to urolithin-A microbiome metabolite' },
      { slug: 'chlorogenic-acid', effect: 'activator', target: 'AMPK + Nrf2', note: 'coffee polyphenol; glucose homeostasis + antioxidant' },
      { slug: 'caffeic-acid', effect: 'activator', target: 'Nrf2 + COX-2', note: 'phenylpropanoid; widespread in plants; antioxidant building block' },
      { slug: 'ferulic-acid', effect: 'activator', target: 'Nrf2', note: 'phenylpropanoid; rice bran + whole grains; UV photoprotection topical' },
    ],
    refs: [],
  },
  {
    slug: 'medicinal_mushroom_beta_glucans',
    name: 'Medicinal mushroom β-glucans (Dectin-1 + complement + NK)',
    category: 'signaling',
    systems: ['immune-hematologic'],
    description: `β(1→3)/β(1→6)-glucans from fungal cell walls are pathogen-associated molecular patterns recognized by Dectin-1 (CLEC7A) on macrophages + dendritic cells → Syk → CARD9 → NF-κB → cytokine release; also complement-mediated CR3-binding on neutrophils. Mushroom polysaccharide extracts: PSK + PSP (Trametes versicolor / turkey tail) — adjuvant in stomach + colorectal cancer in Japanese pharmacy schedule; lentinan (Shiitake — Japanese IV cancer adjuvant); maitake D-fraction; cordyceps polysaccharides + cordycepin (adenosine analog with antiviral / immunomodulatory activity); reishi triterpenes + polysaccharides; chaga (Inonotus obliquus) — birch tree pathogen, betulinic acid + melanin; lions mane (Hericium erinaceus) — hericenones + erinacines stimulate NGF synthesis (nootropic claim).`,
    steps: [
      { from: 'fungal-beta-glucan', to: 'innate-immune-activation', via: 'Dectin-1 + complement CR3 + TLR2 → Syk → CARD9 → NF-κB → cytokine secretion + adaptive immune priming' },
    ],
    modulators: [
      { slug: 'reishi', effect: 'activator', target: 'Dectin-1 + multi-receptor (polysaccharides + triterpenes)', note: 'Ganoderma lucidum; "lingzhi"; traditional immune-tonic; sleep + adaptogen claims' },
      { slug: 'cordyceps', effect: 'activator', target: 'multiple (cordycepin + polysaccharides)', note: 'Cordyceps sinensis/militaris; energy + athletic performance + immune claims; cordycepin = 3′-deoxyadenosine' },
      { slug: 'cordycepin', effect: 'inhibitor', target: 'adenosine analog (RNA chain termination + adenosine receptor)', note: 'isolated Cordyceps active; research-stage anticancer + antiviral; adenosine-A2 receptor activity' },
      { slug: 'maitake', effect: 'activator', target: 'Dectin-1 (D-fraction beta-glucan)', note: 'Grifola frondosa; D-fraction extract for immune support + glycemic control claims' },
      { slug: 'chaga', effect: 'activator', target: 'antioxidant + immune (betulinic acid + melanin)', note: 'Inonotus obliquus; birch parasite; high ORAC; oxalate-rich → kidney-stone risk in chronic high dosing' },
      { slug: 'shiitake', effect: 'activator', target: 'Dectin-1 (lentinan)', note: 'Lentinula edodes; lentinan IV is approved in Japan as a stomach cancer chemotherapy adjuvant' },
      { slug: 'turkey-tail', effect: 'activator', target: 'Dectin-1 (PSK + PSP)', note: 'Trametes versicolor; PSK (Krestin) approved adjuvant chemo in Japan since 1977' },
      { slug: 'lions-mane', effect: 'activator', target: 'NGF synthesis stimulation (hericenones + erinacines)', note: 'Hericium erinaceus; cognitive enhancement claims via NGF pathway; food-grade safety profile' },
    ],
    refs: [],
  },
  {
    slug: 'ampa_kainate_glutamate_extension',
    name: 'AMPA + kainate glutamate receptor modulation (racetams + AMPAkines)',
    category: 'signaling',
    systems: ['nervous'],
    description: `AMPA receptors carry the fast-glutamate excitatory current that underlies most synaptic transmission. Pharmacological enhancement (AMPAkines / positive allosteric modulators) is a long-standing nootropic + cognitive-enhancement target. Mechanism evidence is patchier than benzodiazepine-site GABA-A modulation but several molecules act here. Racetams (piracetam, aniracetam, oxiracetam, pramiracetam, phenylpiracetam, coluracetam, fasoracetam) — original piracetam (Giurgea 1972) coined the "nootropic" category; mechanism nominally AMPA-allosteric + cholinergic facilitation; modest clinical signal except for breath-holding spells + myoclonus. Sunifiram + idra-21 are research-stage AMPAkines. Noopept is a peptidic dipeptide claimed to be a more potent racetam-like agent with BDNF modulation. AMPA negative allosteric modulator perampanel — covered in CNS-1.`,
    steps: [
      { from: 'glutamate', to: 'ampa-positive-modulation', via: 'allosteric site enhances opening kinetics without orthosteric activity' },
    ],
    modulators: [
      { slug: 'piracetam', effect: 'activator', target: 'AMPA (modest allosteric) + cholinergic facilitation', note: 'original racetam (1964); Rx in many EU countries (myoclonus + breath-holding spells); marginal cognitive signal in clinical trials' },
      { slug: 'aniracetam', effect: 'activator', target: 'AMPA (allosteric positive)', note: 'fat-soluble racetam; faster Tmax than piracetam; anxiolytic claim' },
      { slug: 'oxiracetam', effect: 'activator', target: 'AMPA (allosteric positive)', note: 'piracetam analog; mild stimulant claim' },
      { slug: 'pramiracetam', effect: 'activator', target: 'cholinergic uptake enhancement', note: 'racetam with strong choline-uptake claim; memory + focus marketing' },
      { slug: 'phenylpiracetam', effect: 'activator', target: 'AMPA + DAT/NET inhibition', note: 'phenyl-substituted piracetam; stimulant-like; WADA-banned for athletes' },
      { slug: 'coluracetam', effect: 'activator', target: 'high-affinity choline uptake (HACU)', note: 'racetam; choline transport activation; depression + anxiety claims; research-stage' },
      { slug: 'fasoracetam', effect: 'activator', target: 'mGlu group I activator', note: 'racetam; mGlu receptor target distinguishes from AMPAkines; failed Alzheimer\'s trial' },
      { slug: 'sunifiram', effect: 'activator', target: 'AMPA (positive allosteric, research-stage)', note: 'ampakine research compound; piperazine; nootropic supplement market' },
      { slug: 'idra-21', effect: 'activator', target: 'AMPA (positive allosteric, research-stage)', note: 'AMPAkine research compound; cognition + memory animal studies; no human trials' },
      { slug: 'noopept', effect: 'activator', target: 'BDNF/NGF + AMPA + cholinergic', note: 'dipeptide; claimed 1000× piracetam potency; Russian Rx (mild cognitive impairment); cycloprolyl-glycine metabolite as proposed active' },
      { slug: 'prl-8-53', effect: 'activator', target: 'choline + dopamine system', note: 'research compound; one published human pilot (Hansl 1978); poorly characterized' },
      { slug: 'nsi-189', effect: 'activator', target: 'BDNF/neurogenesis (research)', note: 'neurogenic; failed phase 3 depression trial 2017' },
      { slug: 'bromantane', effect: 'activator', target: 'dopaminergic + serotonergic (adamantane derivative)', note: 'Russian psychostimulant + nootropic; WADA-banned; military-stress claim' },
    ],
    refs: [],
  },
  {
    slug: 'creatine_phosphocreatine_energy',
    name: 'Creatine / phosphocreatine energy buffer',
    category: 'biosynthesis',
    systems: ['musculoskeletal', 'nervous'],
    description: `Creatine + phosphocreatine (PCr) form the high-energy phosphate buffer for cells with rapid ATP turnover (skeletal muscle, brain). Creatine kinase reversibly transfers a phosphate between ATP/ADP and PCr/Cr — under high-energy demand PCr → ATP within milliseconds (faster than glycolysis/oxidative phosphorylation can ramp). Endogenous creatine synthesis: glycine + arginine → guanidinoacetate (AGAT in kidney) → creatine (GAMT in liver, methyl group from SAM — cross-link: methionine_sam_cycle). Daily ~1-2 g endogenous + dietary turnover. Supplemental creatine monohydrate ~3-5 g/d saturates muscle PCr stores in ~30 days (slow-load) or 5-7 days (loading 20 g/d × 5d then maintenance). Documented benefits: anaerobic performance, muscle mass, possibly cognitive function under stress. Phosphocreatine system limits acidosis-driven fatigue at sprint-duration efforts. Cross-link: carnitine + carnitine_shuttle complements creatine for energy systems.`,
    steps: [
      { from: 'glycine-and-arginine', to: 'guanidinoacetate', via: 'AGAT (kidney + pancreas)' },
      { from: 'guanidinoacetate', to: 'creatine', via: 'GAMT (liver) — SAM methyl donor' },
      { from: 'creatine', to: 'phosphocreatine', via: 'creatine kinase (mitochondrial + cytosolic isoforms)' },
    ],
    modulators: [
      { slug: 'creatine', effect: 'substrate', target: 'PCr pool (skeletal muscle + CNS)', note: 'creatine monohydrate — best-studied form; 3-5 g/d maintenance; ~30 days to saturation without loading' },
      { slug: 'd-ribose', effect: 'substrate', target: 'ATP/AMP regeneration (purine salvage)', note: 'pentose; chronic-fatigue + CHF claims; biochemical rationale solid but clinical signal weak' },
      { slug: 'peak-atp', effect: 'substrate', target: 'oral ATP supplement (CFM-branded)', note: 'oral ATP supplement; bioavailability problem since ATP doesn\'t cross cell membranes — claimed peripheral signaling effects' },
    ],
    refs: [],
  },
  {
    slug: 'mineral_enzyme_cofactor_overview',
    name: 'Mineral enzyme cofactor overview (Mg / Zn / Cu / Mn / Mo / Se)',
    category: 'biosynthesis',
    systems: ['endocrine', 'musculoskeletal', 'nervous'],
    description: `Essential trace minerals serve as obligate enzyme cofactors throughout metabolism. Mg²⁺ — ATP-Mg complex obligate for all kinases + Na/K-ATPase; >300 enzymes. Zn²⁺ — alcohol dehydrogenase + carbonic anhydrase + carboxypeptidase + zinc-finger TFs (e.g. steroid hormone receptors). Cu — cytochrome c oxidase + superoxide dismutase + tyrosinase + lysyl oxidase + dopamine β-hydroxylase. Mn — Mn-SOD (mitochondrial) + arginase + glutamine synthetase. Mo — xanthine oxidase + sulfite oxidase + aldehyde oxidase. Se — glutathione peroxidase + thioredoxin reductase + thyroid deiodinases (DIO1-3 — cross-link: hpt_axis); selenocysteine is the 21st amino acid. Cr³⁺ — disputed; chromium-binding protein "chromodulin" possibly amplifies insulin signaling, but human deficiency cases are essentially nil. I — thyroid hormone synthesis (cross-link: hpt_axis).`,
    steps: [
      { from: 'mineral-uptake', to: 'enzyme-cofactor-incorporation', via: 'dietary or supplemental Zn/Cu/Mn/Mo/Se → tissue distribution → enzyme active-site binding' },
    ],
    modulators: [
      { slug: 'magnesium', effect: 'cofactor', target: 'ATP + kinase + Na/K-ATPase', note: 'elemental Mg; most common Mg-containing supplements; 300+ enzyme cofactor; deficiency → muscle cramps + arrhythmia + insulin resistance' },
      { slug: 'magnesium-citrate', effect: 'cofactor', target: 'ATP-Mg complex (citrate form, GI laxative effect)', note: 'high bioavailability + osmotic laxative; preferred form when constipation is also addressed' },
      { slug: 'magnesium-glycinate', effect: 'cofactor', target: 'ATP-Mg complex (glycinate chelate)', note: 'gentle GI tolerance; common form for sleep + relaxation claims' },
      { slug: 'magnesium-l-threonate', effect: 'cofactor', target: 'CNS-targeted Mg delivery (MIT/Magtein)', note: 'Stanford-developed; claimed CNS penetration superior to other Mg forms; cognitive + sleep marketing' },
      { slug: 'magnesium-malate', effect: 'cofactor', target: 'ATP-Mg (malate as Krebs intermediate)', note: 'malate form; fibromyalgia + chronic fatigue marketing; less GI than oxide' },
      { slug: 'magnesium-taurate', effect: 'cofactor', target: 'ATP-Mg + taurine co-delivery', note: 'taurine + Mg combo; cardiovascular claims' },
      { slug: 'magnesium-orotate', effect: 'cofactor', target: 'ATP-Mg + orotate (pyrimidine precursor)', note: 'orotate form; sports + cardiac claims' },
      { slug: 'magnesium-chloride', effect: 'cofactor', target: 'ATP-Mg', note: 'magnesium chloride; topical/transdermal use; oral form is well-absorbed' },
      { slug: 'magnesium-bhb', effect: 'substrate', target: 'BHB ketone delivery + Mg cofactor', note: 'BHB salt with Mg counterion; cross-link: ketone_body_synthesis' },
      { slug: 'zinc', effect: 'cofactor', target: 'metalloenzymes + zinc-finger TFs', note: '~300 enzymes; immune + wound healing; deficiency → taste/smell loss + immune compromise' },
      { slug: 'zinc-picolinate', effect: 'cofactor', target: 'Zn delivery (picolinate chelate)', note: 'well-absorbed Zn form; immune support marketing' },
      { slug: 'zinc-citrate', effect: 'cofactor', target: 'Zn delivery (citrate)', note: 'mid-tier absorption; commonly available' },
      { slug: 'zinc-gluconate', effect: 'cofactor', target: 'Zn delivery (gluconate)', note: 'common OTC; cold-duration shortening claims for lozenges (older meta-analyses)' },
      { slug: 'zinc-acetate', effect: 'cofactor', target: 'Zn delivery (acetate, ionic dissociation)', note: 'preferred form for cold-lozenge studies; high free-ion availability' },
      { slug: 'copper', effect: 'cofactor', target: 'Cu enzymes (CCO, SOD1, tyrosinase, DBH, lysyl oxidase)', note: 'rarely deficient in Western diets; high Zn supplementation can induce Cu deficiency over months' },
      { slug: 'manganese', effect: 'cofactor', target: 'Mn-SOD + arginase + glutamine synthetase', note: 'rarely deficient; toxicity (manganism) more often the clinical issue (welders + chronic occupational exposure)' },
      { slug: 'molybdenum', effect: 'cofactor', target: 'xanthine oxidase + sulfite oxidase + aldehyde oxidase', note: 'genuine deficiency essentially unknown in non-experimental settings; supplementation rarely indicated' },
      { slug: 'selenium', effect: 'cofactor', target: 'GPx + thioredoxin reductase + DIO deiodinases', note: 'selenoprotein cofactor; thyroid + antioxidant; toxicity at >400 µg/d (selenosis: nail/hair loss)' },
      { slug: 'selenium-methionine', effect: 'cofactor', target: 'organic Se source (better bioavailability)', note: 'organic selenium form; preferred over selenate/selenite for chronic supplementation' },
      { slug: 'chromium', effect: 'activator', target: 'putative insulin sensitizer (mechanism debated)', note: 'Cr³⁺; disputed nutrient status; clinically meaningful deficiency essentially unproven' },
      { slug: 'boron', effect: 'cofactor', target: 'bone health + hormone modulation (mechanism unclear)', note: 'trace mineral; modest effects on T + estradiol levels in supplementation trials' },
      { slug: 'iodine', effect: 'substrate', target: 'thyroid hormone synthesis', note: 'thyroid hormone substrate; cross-link: hpt_axis; deficiency → goiter + cretinism (historically)' },
      { slug: 'iodine-potassium-iodide', effect: 'substrate', target: 'thyroid hormone synthesis + radiation protection', note: 'KI form; thyroid-blocking dose 130 mg for radioiodine exposure prophylaxis' },
      { slug: 'sodium-bicarbonate', effect: 'cofactor', target: 'systemic alkalinization', note: 'oral or IV bicarbonate; metabolic acidosis correction + sodium-channel-blocker toxicity rescue' },
      { slug: 'potassium-chloride', effect: 'cofactor', target: 'K replacement', note: 'oral KCl for hypokalemia; ECG monitoring at high doses + renal failure' },
      { slug: 'sodium-chloride', effect: 'substrate', target: 'osmolyte / electrolyte', note: 'NaCl; IV saline + oral salt; restriction in HTN' },
      { slug: 'calcium', effect: 'substrate', target: 'bone + signaling Ca²⁺ pool', note: 'elemental Ca²⁺; bone + secretion + muscle; cross-link: calcium_phosphate_pth_axis' },
      { slug: 'calcium-carbonate', effect: 'substrate', target: 'Ca + antacid', note: 'highest %Ca by weight; antacid + bone-supplement common form; requires acid for absorption (PPI DDI)' },
      { slug: 'iron', effect: 'substrate', target: 'hemoglobin + cytochromes + enzymes', note: 'elemental Fe; cross-link: iron_metabolism; ferrous forms (sulfate/gluconate) better absorbed than ferric' },
      { slug: 'iron-bisglycinate', effect: 'substrate', target: 'Fe (bisglycinate chelate)', note: 'gentler GI tolerance than ferrous sulfate; chelate form bypasses some absorption competition' },
      { slug: 'lithium-orotate', effect: 'inhibitor', target: 'low-dose Li (mood / IP3 cycle)', note: 'OTC supplement form (5-20 mg elemental Li); cross-link: inositol_phosphate_signaling for prescription lithium' },
      { slug: 'shilajit', effect: 'activator', target: 'fulvic-acid + mineral complex (humic substance)', note: 'Himalayan resin; testosterone + energy claims; trace mineral + fulvic acid mix' },
    ],
    refs: [],
  },
  {
    slug: 'ketone_body_metabolism_supplementation',
    name: 'Ketone body metabolism + exogenous ketones',
    category: 'biosynthesis',
    systems: ['nervous', 'musculoskeletal'],
    description: `Ketogenesis (cross-link: ketone_body_synthesis) produces β-hydroxybutyrate (BHB), acetoacetate, and minor acetone under low-insulin / high-fatty-acid flux states. BHB is the dominant circulating ketone, metabolized in brain + heart + muscle to acetyl-CoA → TCA via BDH1 + SCOT (succinyl-CoA-3-ketoacid CoA transferase — absent in liver, which prevents the liver from oxidizing its own ketones). Exogenous ketone supplements bypass dietary keto: (1) BHB salts (Na/K/Ca/Mg-BHB) raise BHB to ~0.5-1 mM (sub-physiologic vs 1-5 mM with strict keto diet); (2) Ketone esters (HVMN Ketone-IQ / ΔG / 1,3-butanediol diester) achieve 2-4 mM. Claims: cognitive enhancement, endurance, neuroprotection, weight loss adjunct. Long-term clinical outcome data limited; mechanism plausible via mitochondrial uncoupling + HDAC inhibition + GPR109A signaling.`,
    steps: [
      { from: 'acetyl-coa', to: 'beta-hydroxybutyrate', via: 'HMG-CoA synthase + HMG-CoA lyase + BDH1 (hepatic ketogenesis); cross-link: ketone_body_synthesis' },
      { from: 'beta-hydroxybutyrate', to: 'acetyl-coa', via: 'BDH1 + SCOT (extrahepatic tissues) → TCA' },
    ],
    modulators: [
      { slug: 'bhb-salt', effect: 'substrate', target: 'circulating BHB (salt-bound)', note: 'racemic BHB ± enantiopure D-BHB; counter-ions (Na/K/Ca/Mg) drive their own electrolyte load' },
      { slug: 'l-bhb', effect: 'substrate', target: 'L-BHB (non-physiologic enantiomer)', note: 'L-isomer is poorly oxidized by BDH1 — most therapeutic interest is in D-BHB' },
      { slug: 'calcium-bhb', effect: 'substrate', target: 'BHB (Ca counter-ion)', note: 'Ca counter-ion form; ~30 mEq Ca per dose at typical 12 g BHB serving' },
      { slug: 'sodium-bhb', effect: 'substrate', target: 'BHB (Na counter-ion)', note: 'Na counter-ion; ~600 mg Na per 10 g BHB — HTN-sensitive patients consider' },
      { slug: 'potassium-bhb', effect: 'substrate', target: 'BHB (K counter-ion)', note: 'K counter-ion; renal-impairment + hyperkalemia caveat' },
      { slug: 'magnesium-bhb', effect: 'substrate', target: 'BHB (Mg counter-ion)', note: 'Mg counter-ion; GI tolerance varies' },
      { slug: 'butanediol-1-3', effect: 'substrate', target: 'BHB precursor (alcohol → ketone via ADH/ALDH)', note: '1,3-butanediol; ADH-converted to acetoacetate → BHB; ketone-ester building block' },
      { slug: 'butanediol-ester', effect: 'substrate', target: 'BHB delivery (ester hydrolysis to BHB + BD)', note: 'BD-BHB ester; raises BHB more durably than salts' },
      { slug: 'bd-acetoacetate-diester', effect: 'substrate', target: 'BHB + acetoacetate (diester)', note: 'two-ester format; faster onset + balanced AcAc/BHB ratio' },
      { slug: 'ketone-ester-deltag', effect: 'substrate', target: 'BHB delivery (R-1,3-BD-BHB monoester ΔG)', note: 'Veech-developed ester; military + endurance use; expensive' },
      { slug: 'bis-hexanoyl-bd', effect: 'substrate', target: 'BHB delivery (hexanoyl-BD ester)', note: 'newer ester; aims for taste improvement + sustained kinetics' },
      { slug: 'mct-c6', effect: 'substrate', target: 'caproic acid → rapid hepatic ketogenesis (C6 MCT)', note: 'fastest-oxidized MCT; raises BHB ~1-2 hr post-ingestion; GI tolerance limit' },
      { slug: 'mct-c8', effect: 'substrate', target: 'caprylic acid → ketogenesis (C8 MCT)', note: 'most-studied ketogenic MCT (Brain Octane); ~2-fold BHB rise' },
      { slug: 'mct-c10', effect: 'substrate', target: 'capric acid → ketogenesis (C10 MCT)', note: 'slower onset than C8; coconut-derived MCTs typically C8+C10 blend' },
    ],
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p); added++;
    console.log(`  [add ] ${p.slug.padEnd(48)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nSUP cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
