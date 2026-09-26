/**
 * 2026-05-11-wave-5a-pathway-batch-4.ts — 15 more Recon3D-aligned (v1.2).
 *
 * Pushes pathway total from 47 to 62 — into the v8.1 spec "80+" stretch
 * territory. Covers under-mapped sugar / lipid / vitamin / drug-meta
 * subsystems with high clinical-pharmacology surface.
 *
 *   48. polyol_pathway                 aldose reductase / diabetic complications
 *   49. fructose_metabolism            fructolysis; hereditary fructose intolerance
 *   50. galactose_metabolism           classic galactosemia (GALT)
 *   51. omega_fatty_acid_metabolism    EPA/DHA from ALA + SPM (resolvins)
 *   52. ldl_receptor_pcsk9_axis        LDL-R recycling; PCSK9 mAbs + siRNA
 *   53. carnitine_shuttle              CPT1/CPT2; valproate side-effect path
 *   54. choline_tmao_metabolism        gut microbiome → TMAO → CV risk
 *   55. vitamin_d_metabolism           D3 → 25-OH-D → 1,25-OH-D; CKD-MBD
 *   56. iron_metabolism                transferrin / ferritin / hepcidin
 *   57. calcium_phosphate_pth_axis     PTH / vitamin D / bone homeostasis
 *   58. cyp_phase1_overview            CYP3A4/2D6/1A2/2C9/2C19 substrate spectrum
 *   59. conjugation_phase2_overview    UGT + SULT + GST + NAT
 *   60. transporter_phase3_overview    P-gp + OATP + BCRP + MRP + OCT
 *   61. monoamine_oxidase_metabolism   MAO-A / MAO-B; selegiline / rasagiline
 *   62. acetylcholine_axis             ChAT + AChE; donepezil + pyridostigmine + sarin
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
    slug: 'polyol_pathway',
    name: 'Polyol pathway (aldose reductase)',
    category: 'catabolism',
    systems: ['endocrine', 'nervous', 'renal'],
    description: 'Alternative glucose pathway active in tissues with insulin-independent glucose uptake (lens, retina, peripheral nerve, kidney). Glucose → sorbitol (aldose reductase, NADPH consumer) → fructose (sorbitol dehydrogenase, NAD+ consumer). Hyperglycemia drives flux through this pathway, producing osmotic stress (sorbitol accumulation), NADPH depletion (oxidative stress; impaired glutathione regeneration), and AGE precursor generation (fructose is more reactive than glucose). Proposed mechanism for diabetic neuropathy, retinopathy, cataracts. Aldose reductase inhibitors (epalrestat, ranirestat) developed for diabetic neuropathy with mixed clinical outcomes — epalrestat approved in Japan + China but not in Western markets.',
    steps: [
      { from: 'glucose', to: 'sorbitol', via: 'aldose reductase (AKR1B1) — NADPH consumer; EPALRESTAT TARGET' },
      { from: 'sorbitol', to: 'fructose', via: 'sorbitol dehydrogenase (SORD) — NAD+ consumer' },
    ],
    refs: [],
  },
  {
    slug: 'fructose_metabolism',
    name: 'Fructose metabolism (fructolysis)',
    category: 'catabolism',
    systems: ['digestive', 'endocrine'],
    description: 'Hepatic-dominant fructose handling, distinct from glycolysis. Fructose → fructose-1-P (fructokinase / ketohexokinase, KHK — bypasses the insulin-sensitive PFK-1 step). F1P → glyceraldehyde + DHAP (aldolase B). Glyceraldehyde → glyceraldehyde-3-P (triokinase) → glycolysis. Bypass of PFK-1 makes fructose uniquely lipogenic at high intakes — drives hepatic de novo lipogenesis (see fatty_acid_biosynthesis) + NAFLD risk. Hereditary fructose intolerance = aldolase B deficiency (autosomal recessive): F1P accumulates, depletes ATP + phosphate, produces hypoglycemia + vomiting + hepatic injury after fructose / sucrose / sorbitol exposure. Essential fructosuria = benign fructokinase deficiency (no symptoms — fructose excreted unchanged).',
    steps: [
      { from: 'fructose', to: 'fructose-1-phosphate', via: 'fructokinase (KHK) — hepatic; bypasses PFK-1' },
      { from: 'fructose-1-phosphate', to: 'glyceraldehyde-dhap', via: 'aldolase B — HEREDITARY FRUCTOSE INTOLERANCE deficiency' },
      { from: 'glyceraldehyde-dhap', to: 'glyceraldehyde-3-phosphate', via: 'triokinase; enters glycolysis below PFK-1' },
    ],
    refs: [],
  },
  {
    slug: 'galactose_metabolism',
    name: 'Galactose metabolism (Leloir pathway)',
    category: 'catabolism',
    systems: ['digestive', 'endocrine'],
    description: 'Conversion of dietary galactose (primarily from lactose) into glucose-1-phosphate via the Leloir pathway. Galactose → galactose-1-P (galactokinase, GALK1) → glucose-1-P (galactose-1-P uridyltransferase, GALT — the Leloir enzyme; uses UDP-glucose as the UDP donor, regenerating UDP-galactose). Classic galactosemia = GALT deficiency: G1P accumulates, depletes phosphate + UDP, produces hepatic + renal + cerebral injury in the newborn period; lethal without lactose-free diet. Galactokinase deficiency = milder galactosemia variant with isolated cataracts. Epimerase deficiency = third variant. Newborn screening detects GALT specifically. Long-term outcomes (ovarian failure, learning difficulties) persist despite early diet correction.',
    steps: [
      { from: 'galactose', to: 'galactose-1-phosphate', via: 'galactokinase (GALK1)' },
      { from: 'galactose-1-phosphate', to: 'glucose-1-phosphate', via: 'galactose-1-P uridyltransferase (GALT) — CLASSIC GALACTOSEMIA enzyme' },
    ],
    refs: [],
  },
  {
    slug: 'omega_fatty_acid_metabolism',
    name: 'Omega-3 / omega-6 fatty acid elongation + specialized pro-resolving mediators',
    category: 'biosynthesis',
    systems: ['cardiovascular', 'immune-hematologic', 'nervous'],
    description: 'Mammals lack the desaturases to make omega-3 (ω3) and omega-6 (ω6) fatty acids de novo — they must come from diet. ALA (α-linolenic, ω3) → EPA → DHA via FADS2 (Δ6-desaturase) + elongases + FADS1 (Δ5). Conversion rate ALA → EPA → DHA is low (<10%) — explains why dietary EPA/DHA from fish oil has effects ALA supplementation doesn\'t reproduce. Linoleic (ω6) → arachidonic acid (AA) via the same enzyme set — competes with ω3 desaturation. SPMs (specialized pro-resolving mediators): from EPA → E-series resolvins; from DHA → D-series resolvins + protectins + maresins. SPMs actively terminate inflammation (vs glucocorticoids which suppress it) — therapeutic interest is growing.',
    steps: [
      { from: 'alpha-linolenic-acid', to: 'eicosapentaenoic-acid', via: 'FADS2 + elongases + FADS1; conversion <10% in most humans' },
      { from: 'eicosapentaenoic-acid', to: 'docosahexaenoic-acid', via: 'elongases + FADS2 + retroconversion' },
      { from: 'eicosapentaenoic-acid', to: 'resolvin-e1', via: 'aspirin-triggered + cox-2 + ALOX5 → E-series resolvins' },
      { from: 'docosahexaenoic-acid', to: 'resolvin-d1', via: 'ALOX15 + ALOX5 → D-series resolvins + protectins + maresins' },
    ],
    modulators: [
      { slug: 'epa-dha', effect: 'substrate', target: 'EPA + DHA pool replenishment from dietary fish oil' },
      { slug: 'aspirin', effect: 'activator', target: 'cox-2 acetylation produces aspirin-triggered resolvins from EPA' },
    ],
    refs: [],
  },
  {
    slug: 'ldl_receptor_pcsk9_axis',
    name: 'LDL receptor + PCSK9 axis',
    category: 'transport',
    systems: ['cardiovascular', 'digestive'],
    description: 'LDL receptor (LDL-R) clears circulating LDL particles by hepatic endocytosis. After internalization, LDL-R normally recycles back to the plasma membrane for hundreds of cycles. PCSK9 binds LDL-R + diverts it to lysosomal degradation, reducing surface receptor density and raising plasma LDL. Statins lower intracellular cholesterol → SREBP-2 activation → upregulates BOTH LDL-R AND PCSK9 (negating part of the LDL-R upregulation). PCSK9 inhibitors (mAb: alirocumab + evolocumab; siRNA: inclisiran with q6-monthly dosing) block PCSK9 → preserve LDL-R recycling → LDL reductions of 50-60% on top of maximal statin. Familial hypercholesterolemia: most often LDL-R loss-of-function mutations (autosomal codominant); gain-of-function PCSK9 mutations produce phenocopy.',
    steps: [
      { from: 'circulating-ldl', to: 'hepatic-internalization', via: 'LDL-R binding + clathrin-mediated endocytosis' },
      { from: 'ldl-receptor', to: 'recycling-or-degradation', via: 'PCSK9 binding determines lysosomal degradation vs surface recycling' },
    ],
    modulators: [
      { slug: 'atorvastatin', effect: 'activator', target: 'SREBP-2 activation → LDL-R upregulation (statin class mechanism)' },
      { slug: 'rosuvastatin', effect: 'activator', target: 'SREBP-2 → LDL-R upregulation' },
    ],
    refs: [],
  },
  {
    slug: 'carnitine_shuttle',
    name: 'Carnitine shuttle (CPT1 + CPT2)',
    category: 'transport',
    systems: ['musculoskeletal', 'cardiovascular', 'endocrine'],
    description: 'Transports long-chain fatty acyl groups across the inner mitochondrial membrane for β-oxidation. Outer membrane: CPT1 transfers the acyl group from CoA to carnitine, producing acyl-carnitine. Inner membrane: CACT (carnitine-acylcarnitine translocase) exchanges acyl-carnitine for free carnitine. Inner matrix: CPT2 transfers the acyl group back to CoA, regenerating intramitochondrial acyl-CoA for β-oxidation. CPT1 is the regulatory step — inhibited by malonyl-CoA (the link to fatty acid biosynthesis: high malonyl-CoA → FA synthesis ON + β-oxidation OFF). Carnitine deficiency (primary genetic or secondary to valproate/pivalate antibiotics/hemodialysis) presents as hypoketotic hypoglycemia + cardiomyopathy + skeletal myopathy. Levocarnitine supplementation is therapeutic.',
    steps: [
      { from: 'long-chain-acyl-coa', to: 'acyl-carnitine', via: 'CPT1 (outer mitochondrial membrane) — REGULATORY; malonyl-CoA inhibits' },
      { from: 'acyl-carnitine', to: 'mitochondrial-acyl-carnitine', via: 'CACT (carnitine-acylcarnitine translocase, inner membrane)' },
      { from: 'mitochondrial-acyl-carnitine', to: 'mitochondrial-acyl-coa', via: 'CPT2 (inner mitochondrial leaflet) — feeds β-oxidation' },
    ],
    modulators: [],
    refs: [],
  },
  {
    slug: 'choline_tmao_metabolism',
    name: 'Choline / TMAO metabolism',
    category: 'catabolism',
    systems: ['cardiovascular', 'digestive'],
    description: 'Dietary choline + carnitine + phosphatidylcholine reach the colon partially intact, where gut microbiota produce trimethylamine (TMA) via cleavage. Portal venous TMA reaches the liver and is oxidized by FMO3 (flavin monooxygenase 3) to TMAO (trimethylamine-N-oxide). Plasma TMAO is associated with cardiovascular events in observational studies — proposed mechanism: TMAO impairs reverse cholesterol transport + promotes macrophage foam cell formation + enhances platelet hyperreactivity. The "gut microbiome → CVD" causal link is being actively investigated (Hazen lab series, mostly). FMO3 LOF variants cause trimethylaminuria ("fish odor syndrome") — exhaled + sweat-derived TMA produces a fish-like body odor.',
    steps: [
      { from: 'choline', to: 'trimethylamine', via: 'gut microbial choline-TMA-lyase (CutC/D) — primarily colonic Proteobacteria + Firmicutes' },
      { from: 'trimethylamine', to: 'trimethylamine-n-oxide', via: 'FMO3 (hepatic) — LOF variants → trimethylaminuria; CV risk association' },
    ],
    modulators: [
      { slug: 'alpha-gpc', effect: 'substrate', target: 'upstream choline source' },
      { slug: 'l-carnitine', effect: 'substrate', target: 'alternative TMA precursor; gut microbiome dependent' },
    ],
    refs: [],
  },
  {
    slug: 'vitamin_d_metabolism',
    name: 'Vitamin D activation cascade',
    category: 'biosynthesis',
    systems: ['endocrine', 'musculoskeletal', 'renal'],
    description: 'Cholecalciferol (D3, dietary + cutaneous via UV-B on 7-dehydrocholesterol) and ergocalciferol (D2, fungal) → 25-hydroxyvitamin D (calcidiol) via hepatic CYP2R1 — the form measured clinically (reflects body stores; t½ ~3 weeks). 25-OH-D → 1,25-dihydroxyvitamin D (calcitriol, active hormone) via renal CYP27B1 (1α-hydroxylase) under PTH stimulation. Calcitriol → VDR → genomic effects (intestinal Ca/PO4 absorption + bone remodeling + immune modulation). Inactivation by CYP24A1 (24-hydroxylase). CKD-MBD: progressive CYP27B1 deficiency → low 1,25-D → secondary hyperPTH → bone disease + CV calcification. Treatment: calcitriol or paricalcitol (already-active vitamin D analogs) bypassing the failing renal step.',
    steps: [
      { from: '7-dehydrocholesterol', to: 'cholecalciferol', via: 'UV-B photolysis in skin (vitamin D3 endogenous synthesis)' },
      { from: 'cholecalciferol', to: '25-hydroxycholecalciferol', via: 'CYP2R1 (hepatic) — the calcidiol measured clinically' },
      { from: '25-hydroxycholecalciferol', to: 'calcitriol', via: 'CYP27B1 (renal 1α-hydroxylase) — PTH-activated; deficient in CKD' },
      { from: 'calcitriol', to: 'inactive-24-hydroxy', via: 'CYP24A1 (negative feedback)' },
    ],
    modulators: [
      { slug: 'cholecalciferol', effect: 'substrate', target: 'cascade entry (vitamin D3 supplementation)' },
    ],
    refs: [],
  },
  {
    slug: 'iron_metabolism',
    name: 'Iron metabolism (transferrin / ferritin / hepcidin)',
    category: 'transport',
    systems: ['immune-hematologic', 'digestive', 'endocrine'],
    description: 'Iron absorption: dietary Fe3+ reduced to Fe2+ at the duodenal brush border (DCYTB) → imported by DMT1 → exported to plasma by ferroportin (FPN). Plasma iron binds transferrin → delivered to erythroblasts (transferrin-R) + stored in ferritin in liver / macrophages / enterocytes. HEPCIDIN (hepatic peptide hormone) is the master regulator: high hepcidin internalizes + degrades ferroportin → blocks export from enterocytes + macrophages → plasma iron falls. Hepcidin is upregulated by iron load + inflammation (IL-6 — explains anemia of chronic inflammation), downregulated by erythropoietic drive (erythroferrone from erythroblasts). Hereditary hemochromatosis = HFE mutations → low hepcidin → unrestricted absorption.',
    steps: [
      { from: 'dietary-iron', to: 'enterocyte-iron', via: 'DCYTB reductase + DMT1 importer (apical)' },
      { from: 'enterocyte-iron', to: 'plasma-iron', via: 'ferroportin (FPN) — HEPCIDIN-controlled' },
      { from: 'plasma-iron', to: 'erythroblast-iron', via: 'transferrin → transferrin-R endocytosis → ferritin storage or heme synthesis' },
    ],
    refs: [],
  },
  {
    slug: 'calcium_phosphate_pth_axis',
    name: 'Calcium / phosphate / PTH / vitamin D axis',
    category: 'endocrine_axis',
    systems: ['endocrine', 'musculoskeletal', 'renal'],
    description: 'Coupled homeostatic loop. Plasma Ca2+ low → parathyroid CaSR senses → PTH released → (1) bone: stimulates osteoclast resorption via RANKL on osteoblasts; (2) kidney: increases Ca2+ reabsorption + PO4 excretion + activates CYP27B1 → calcitriol; (3) gut: indirect via calcitriol → upregulates calbindin / TRPV6 for active Ca absorption. Net: plasma Ca rises. Inverse for high Ca → calcitonin from thyroid C cells (lesser role in humans). Pharmacology: bisphosphonates inhibit osteoclasts (alendronate, zoledronate); denosumab is anti-RANKL mAb; teriparatide is recombinant PTH(1-34) — paradoxically anabolic when given pulsatile (vs continuous which is resorptive); romosozumab is anti-sclerostin (Wnt activator → bone formation); cinacalcet is a CaSR PAM for secondary hyperPTH + parathyroid carcinoma.',
    steps: [
      { from: 'low-plasma-calcium', to: 'pth-release', via: 'CaSR senses → parathyroid chief cells release PTH' },
      { from: 'pth-release', to: 'bone-resorption', via: 'RANKL-mediated osteoclast activation' },
      { from: 'pth-release', to: 'renal-calcium-reabsorption', via: 'distal tubule TRPV5 + calbindin' },
      { from: 'pth-release', to: 'calcitriol-synthesis', via: 'renal CYP27B1 activation (see vitamin_d_metabolism)' },
    ],
    modulators: [
      { slug: 'cholecalciferol', effect: 'substrate', target: 'axis component (supports gut Ca absorption)' },
    ],
    refs: [],
  },
  {
    slug: 'cyp_phase1_overview',
    name: 'CYP phase-1 drug metabolism overview',
    category: 'drug_metabolism',
    systems: ['digestive'],
    description: 'Cytochrome P450 superfamily — the dominant phase-1 (oxidative) drug-metabolizing enzymes. Five isoforms handle most clinically used drugs: CYP3A4 (≈50% of marketed drugs — see midazolam, statins, immunosuppressants, opioids, BTK/Bcl-2/JAK inhibitors); CYP2D6 (≈25% — beta-blockers, antidepressants, opioids; highly polymorphic — PM/IM/EM/UM); CYP2C9 (warfarin, NSAIDs, phenytoin); CYP2C19 (omeprazole, clopidogrel — *2/*3 reduced-function alleles); CYP1A2 (caffeine, theophylline, clozapine, smoking-inducible). DDI authoring across the registry maps perpetrator → victim Ki / induction_factor for each of these. Phase-1 metabolism typically increases water solubility for subsequent phase-2 conjugation + phase-3 transport excretion.',
    steps: [
      { from: 'lipophilic-drug', to: 'oxidized-metabolite', via: 'CYP3A4 / 2D6 / 2C9 / 2C19 / 1A2 / 2B6 / 2E1 etc. — substrate-specific isoform' },
    ],
    modulators: [],
    refs: [],
  },
  {
    slug: 'conjugation_phase2_overview',
    name: 'Phase-2 conjugation (UGT + SULT + GST + NAT)',
    category: 'drug_metabolism',
    systems: ['digestive'],
    description: 'Phase-2 conjugating enzymes attach polar groups to phase-1 oxidized metabolites (or directly to parent drugs), dramatically increasing water solubility for biliary or renal excretion. UGT (UDP-glucuronosyltransferase) — major; bilirubin + many drugs (UGT1A1 deficiency = Gilbert syndrome benign hyperbilirubinemia + atazanavir-induced jaundice; Crigler-Najjar severe form). SULT (sulfotransferase) — major for acetaminophen at therapeutic doses, hormones. GST (glutathione-S-transferase) — major for reactive metabolites (NAPQI from acetaminophen → GST → mercapturate excretion). NAT (N-acetyltransferase, NAT2) — isoniazid + sulfonamides; slow/fast acetylator phenotypes (NAT2 polymorphism affects INH toxicity). Methylation (COMT, HNMT) + acetylation (NAT) close the major phase-2 axes.',
    steps: [
      { from: 'oxidized-or-parent-drug', to: 'glucuronide-conjugate', via: 'UGT1A1 / 1A4 / 2B7 etc.' },
      { from: 'oxidized-or-parent-drug', to: 'sulfate-conjugate', via: 'SULT1A1 / 1A3 / 2A1' },
      { from: 'reactive-metabolite', to: 'glutathione-conjugate', via: 'GST + γ-glutamyl-transpeptidase + mercapturate formation' },
      { from: 'arylamine-or-hydrazide', to: 'n-acetyl-conjugate', via: 'NAT2 — INH; slow/fast acetylator phenotype' },
    ],
    modulators: [],
    refs: [],
  },
  {
    slug: 'transporter_phase3_overview',
    name: 'Phase-3 transport (P-gp + OATP + BCRP + MRP + OCT)',
    category: 'transport',
    systems: ['digestive', 'renal', 'nervous'],
    description: 'Phase-3 = active transmembrane transport that determines drug absorption, distribution, biliary + renal excretion. Efflux pumps (ABC family): P-glycoprotein (P-gp / ABCB1 — broad substrate; gut barrier + BBB + biliary; digoxin / colchicine / fexofenadine); BCRP (ABCG2 — overlapping with P-gp; rosuvastatin); MRP family (ABCC1-7 — glucuronide / glutathione conjugates). Uptake pumps (SLC family): OATP1B1/B3 (hepatic uptake of statins; SLCO1B1 polymorphism affects simvastatin myopathy risk); OCT2 (renal cation uptake; metformin); MATE1/2 (renal cation efflux; cobicistat blocks → mild creatinine rise). Cobicistat + ritonavir + verapamil are clinically important P-gp + OATP inhibitors. Rifampin is a P-gp inducer (digoxin AUC reduction).',
    steps: [
      { from: 'lumenal-drug', to: 'enterocyte-or-blocked', via: 'P-gp efflux at gut barrier (limits absorption)' },
      { from: 'portal-blood-drug', to: 'hepatocyte', via: 'OATP1B1 / OATP1B3 uptake (statins, irinotecan)' },
      { from: 'hepatocyte-drug', to: 'bile', via: 'P-gp / BCRP / MRP2 canalicular efflux' },
    ],
    modulators: [
      { slug: 'rifampin', effect: 'activator', target: 'P-gp + OATP + BCRP induction (PXR-mediated)' },
      { slug: 'cobicistat', effect: 'inhibitor', target: 'P-gp + OATP + MATE1 (mild creatinine rise without GFR change)' },
    ],
    refs: [],
  },
  {
    slug: 'monoamine_oxidase_metabolism',
    name: 'Monoamine oxidase (MAO-A + MAO-B) metabolism',
    category: 'drug_metabolism',
    systems: ['nervous', 'digestive'],
    description: 'Outer mitochondrial membrane flavoenzymes — degrade biogenic amines via oxidative deamination → aldehyde intermediates → carboxylic acids (via ALDH). MAO-A: serotonin, norepinephrine, dopamine (high affinity) — broad tissue distribution. MAO-B: dopamine, phenethylamine, benzylamine — concentrated in CNS + platelets. Pharmacology: irreversible non-selective inhibitors (phenelzine, tranylcypromine, isocarboxazid) — antidepressants with the famous tyramine hypertensive-crisis risk (dietary tyramine bypasses MAO-A in the gut + reaches systemic circulation, releases stored norepinephrine). Selective + reversible MAO-A: moclobemide (less tyramine risk). Selective MAO-B: SELEGILINE (Parkinson disease adjunct + transdermal for depression; reversible loss-of-selectivity at high doses), RASAGILINE (newer; once-daily). Selegiline metabolizes to amphetamine + methamphetamine — explains some of its CNS effects.',
    steps: [
      { from: 'serotonin', to: '5-hydroxyindoleacetaldehyde', via: 'MAO-A → ALDH → 5-HIAA (urinary marker)' },
      { from: 'norepinephrine', to: 'dihydroxyphenylglycoaldehyde', via: 'MAO-A → ALDH/AR → VMA / DHPG (urinary markers)' },
      { from: 'dopamine', to: 'dopal', via: 'MAO-A + MAO-B → ALDH → DOPAC → HVA (urinary marker)' },
    ],
    modulators: [
      { slug: 'selegiline', effect: 'inhibitor', target: 'MAO-B (selective at low dose; non-selective at high)' },
      { slug: 'rasagiline', effect: 'inhibitor', target: 'MAO-B (selective; once-daily Parkinson)' },
      { slug: 'phenelzine', effect: 'inhibitor', target: 'MAO-A + MAO-B (non-selective irreversible; tyramine crisis risk)' },
    ],
    refs: [],
  },
  {
    slug: 'acetylcholine_axis',
    name: 'Acetylcholine synthesis + degradation',
    category: 'biosynthesis',
    systems: ['nervous', 'musculoskeletal'],
    description: 'ACh synthesis: choline + acetyl-CoA → acetylcholine (CHOLINE ACETYLTRANSFERASE, ChAT — cholinergic neuron marker). Released into synapse, binds nicotinic (NMJ + ganglia + CNS) and muscarinic (M1-M5 — autonomic + CNS) receptors. Rapid hydrolysis: ACh → choline + acetate (ACETYLCHOLINESTERASE, AChE — postsynaptic NMJ + RBCs). Plasma butyrylcholinesterase (BChE / pseudocholinesterase) is a related enzyme — succinylcholine + mivacurium hydrolyzed here. Cholinesterase inhibitors: reversible (DONEPEZIL / rivastigmine / galantamine for Alzheimer; PYRIDOSTIGMINE / neostigmine for myasthenia gravis + NMJ reversal); irreversible (organophosphates — sarin, VX, malathion; pralidoxime + atropine for poisoning). BChE-deficient phenotypes have prolonged paralysis with succinylcholine (the classic "succinylcholine apnea" complication).',
    steps: [
      { from: 'choline', to: 'acetylcholine', via: 'ChAT (choline acetyltransferase) — cholinergic neuron marker' },
      { from: 'acetylcholine', to: 'choline-acetate', via: 'AChE (acetylcholinesterase) — postsynaptic; sarin / donepezil / pyridostigmine target' },
    ],
    modulators: [
      { slug: 'donepezil', effect: 'inhibitor', target: 'AChE — Alzheimer disease' },
      { slug: 'pyridostigmine', effect: 'inhibitor', target: 'AChE — myasthenia gravis' },
      { slug: 'alpha-gpc', effect: 'substrate', target: 'choline donor (upstream)' },
      { slug: 'citicoline', effect: 'substrate', target: 'choline donor (upstream)' },
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
  console.log(`\nWave 5a batch 4 (v1.2): +${added} pathways → ${existing.length} total.`);
}

main();
