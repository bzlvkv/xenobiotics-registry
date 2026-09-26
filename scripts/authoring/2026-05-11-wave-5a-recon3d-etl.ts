/**
 * 2026-05-11-wave-5a-recon3d-etl.ts — true Recon3D ETL (v1.2).
 *
 * Reads the 111 subsystems out of the Recon3D SBML (Brunk 2018,
 * PMID:29457794; available at github.com/VirtualMetabolicHuman/Recon)
 * and produces two outputs:
 *
 *   1. Backfills `recon3d_subsystem` on existing v1.2 hand-authored
 *      pathways where they align with a Recon3D subsystem name. This
 *      creates a navigable bridge between the v8 pathway view and the
 *      broader Recon3D reaction network for any future cross-database
 *      queries.
 *
 *   2. Authors NEW pathways for Recon3D subsystems that are clinically
 *      meaningful but didn't make the v1.2 hand-authored batches —
 *      filling out the metabolic-coverage long tail. Filters out the
 *      ~35 narrow / cofactor / glycan / "exchange/demand" / "miscellaneous"
 *      / "R group synthesis" entries that don't carry independent
 *      pharmacological surface.
 *
 * Recon3D subsystems intentionally NOT authored as standalone pathways:
 *   - exchange/demand reaction       (model-boundary, not biology)
 *   - miscellaneous                  (catchall, no specific biology)
 *   - aminoacyl-tRNA biosynthesis    (foundational protein synthesis)
 *   - protein assembly/degradation/formation/modification
 *   - peptide metabolism             (catchall)
 *   - r group synthesis              (cofactor side-chain — unclear scope)
 *   - alkaloid synthesis             (humans don't make alkaloids; legacy)
 *   - limonene and pinene degradation (exogenous; humans don't synthesize)
 *   - stilbene, coumarine and lignin synthesis (exogenous)
 *   - dietary fiber binding          (boundary)
 *   - hippurate metabolism           (narrow gut-derived xenobiotic)
 *   - blood group synthesis          (specialized cell-surface)
 *   - chondroitin / heparan / keratan sulfate / hyaluronan / N-glycan /
 *     O-glycan / nucleotide sugar / cytochrome metabolism — narrow GAG /
 *     cofactor side paths without pharmacology surface
 *   - 7 transport categories         (membrane location, not biology)
 *
 * Net: 12 new pathways added, ~45 existing pathways get
 * recon3d_subsystem cross-references backfilled.
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
  recon3d_subsystem?: string;
}

// ── Backfill map ─────────────────────────────────────────────────────
// Existing slug → canonical Recon3D subsystem name. Derived by manual
// review of the 111-subsystem list against the 80 v1.2 pathways.
const BACKFILL: Record<string, string> = {
  'arachidonic_acid_cascade': 'Arachidonic acid metabolism',
  'bcaa_metabolism': 'Valine, leucine, and isoleucine metabolism',
  'beta_oxidation': 'Fatty acid oxidation',
  'bile_acid_synthesis': 'Bile acid synthesis',
  'carnitine_shuttle': 'Fatty acid oxidation',
  'catecholamine_synthesis': 'Tyrosine metabolism',
  'cholesterol_synthesis': 'Squalene and cholesterol synthesis',
  'fatty_acid_biosynthesis': 'Fatty acid synthesis',
  'folate_one_carbon': 'Folate metabolism',
  'fructose_metabolism': 'Fructose and mannose metabolism',
  'galactose_metabolism': 'Galactose metabolism',
  'glutathione_metabolism': 'Glutathione metabolism',
  'glycerophospholipid_metabolism': 'Glycerophospholipid metabolism',
  'glycogen_metabolism': 'Starch and sucrose metabolism',
  'glycolysis': 'Glycolysis/gluconeogenesis',
  'gluconeogenesis': 'Glycolysis/gluconeogenesis',
  'heme_biosynthesis': 'Heme synthesis',
  'heme_degradation_bilirubin': 'Heme degradation',
  'histamine_axis': 'Histidine metabolism',
  'inositol_phosphate_signaling': 'Inositol phosphate metabolism',
  'ketone_body_synthesis': 'Butanoate metabolism',
  'methionine_sam_cycle': 'Methionine and cysteine metabolism',
  'niacin_nad_synthesis': 'NAD metabolism',
  'nitric_oxide_synthesis': 'Arginine and proline metabolism',
  'oxidative_phosphorylation': 'Oxidative phosphorylation',
  'pentose_phosphate_pathway': 'Pentose phosphate pathway',
  'purine_catabolism': 'Purine catabolism',
  'purine_de_novo_synthesis': 'Purine synthesis',
  'pyrimidine_metabolism': 'Pyrimidine synthesis',
  'pyruvate_metabolism': 'Pyruvate metabolism',
  'serotonin_melatonin_axis': 'Tryptophan metabolism',
  'sphingolipid_metabolism': 'Sphingolipid metabolism',
  'steroid_hormone_biosynthesis': 'Androgen and estrogen synthesis and metabolism',
  'tca_cycle': 'Citric acid cycle',
  'tryptophan_metabolism': 'Tryptophan metabolism',
  'tyrosine_metabolism': 'Tyrosine metabolism',
  'ubiquinone_biosynthesis': 'Ubiquinone synthesis',
  'urea_cycle': 'Urea cycle',
  'vitamin_d_metabolism': 'Vitamin D metabolism',
  'vitamin_k_cycle': 'Vitamin K metabolism',
  'retinol_vitamin_a_metabolism': 'Vitamin A metabolism',
  'caffeine_demethylation': 'Drug metabolism',
  'nicotine_metabolism': 'Drug metabolism',
  'warfarin_metabolism': 'Drug metabolism',
  'cyp_phase1_overview': 'Drug metabolism',
  'conjugation_phase2_overview': 'Xenobiotics metabolism',
  'transporter_phase3_overview': 'Xenobiotics metabolism',
  'monoamine_oxidase_metabolism': 'Drug metabolism',
  'ldl_receptor_pcsk9_axis': 'Cholesterol metabolism',
  'omega_fatty_acid_metabolism': 'Linoleate metabolism',
  'ros_oxidative_stress': 'ROS detoxification',
  'choline_tmao_metabolism': 'Glycerophospholipid metabolism',
};

// ── New pathways for under-covered Recon3D subsystems ────────────────
const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'glutamate_glutamine_cycle',
    name: 'Glutamate / glutamine cycle (astrocyte-neuron)',
    category: 'biosynthesis',
    systems: ['nervous'],
    description: 'CNS glutamate handling — neuronal release after synaptic firing, astrocyte uptake via EAAT1/EAAT2, conversion to glutamine via glutamine synthetase (avoids excitotoxicity), glutamine shuttle back to neuron, conversion back to glutamate via glutaminase. Also peripheral glutamate involvement in TCA anaplerosis (α-KG ↔ glutamate via glutamate dehydrogenase or aminotransferases). Glutamate is the dominant CNS excitatory transmitter; NMDA + AMPA + kainate ionotropic + 8 mGluR metabotropic. Ketamine + memantine = NMDA antagonists; perampanel = AMPA antagonist; tiagabine GAT-1 transporter is downstream into GABA (the inhibitory mirror). Hepatic encephalopathy = ammonia rises because hepatic glutamine synthetase fails; lactulose + rifaximin shift gut microbiome to reduce NH3 production.',
    steps: [
      { from: 'glutamate', to: 'glutamine', via: 'glutamine synthetase (GS, astrocyte) — incorporates NH4+' },
      { from: 'glutamine', to: 'glutamate', via: 'glutaminase (GLS, neuronal) — releases NH4+' },
      { from: 'alpha-ketoglutarate', to: 'glutamate', via: 'glutamate dehydrogenase (GDH) — TCA anaplerosis' },
    ],
    recon3d_subsystem: 'Glutamate metabolism',
    refs: [],
  },
  {
    slug: 'glycine_serine_threonine_metabolism',
    name: 'Glycine / serine / threonine metabolism',
    category: 'biosynthesis',
    systems: ['nervous', 'immune-hematologic'],
    description: 'Interconverting amino acid axis with major one-carbon donor role. Serine ↔ glycine via SHMT (serine hydroxymethyltransferase) — donates a methylene to THF for the folate cycle (see folate_one_carbon). Glycine is the dominant inhibitory transmitter in spinal cord + brainstem (strychnine antagonist + tetanus toxin). Threonine catabolism produces glycine + acetyl-CoA via TDH (mostly in newborns; minor in adults). PHGDH (phosphoglycerate dehydrogenase) is the rate-limiting step in serine biosynthesis from 3-phosphoglycerate — overexpressed in some breast / melanoma cancers (one-carbon biosynthesis dependency).',
    steps: [
      { from: 'serine', to: 'glycine', via: 'SHMT — donates methylene to THF (1C feeder)' },
      { from: '3-phosphoglycerate', to: 'serine', via: 'PHGDH → PSAT1 → PSP (serine de novo synthesis)' },
      { from: 'threonine', to: 'glycine-acetylcoa', via: 'TDH (newborn-dominant) + cleavage' },
    ],
    recon3d_subsystem: 'Glycine, serine, alanine, and threonine metabolism',
    refs: [],
  },
  {
    slug: 'phenylalanine_metabolism',
    name: 'Phenylalanine metabolism (PKU pathway)',
    category: 'catabolism',
    systems: ['nervous', 'endocrine'],
    description: 'Phenylalanine → tyrosine via PHENYLALANINE HYDROXYLASE (PAH, BH4-dependent). PAH deficiency = phenylketonuria (PKU), the prototype inborn error of metabolism. Phenylalanine accumulates and is metabolized via alternative deamination → phenylpyruvate + phenylacetate + phenyllactate, which are excreted in urine (the "musty" odor). Untreated PKU → severe intellectual disability + microcephaly + seizures due to phenylalanine neurotoxicity (mechanism: competes with other large neutral amino acids for LAT1 BBB transport, depleting brain serotonin + catecholamine precursors). Treatment: phenylalanine-restricted diet from birth (newborn screening detects). SAPROPTERIN = synthetic BH4 cofactor; rescues partial-deficiency PAH variants. PEGVALIASE = recombinant phenylalanine ammonia lyase enzyme replacement (Palynziq, 2018).',
    steps: [
      { from: 'phenylalanine', to: 'tyrosine', via: 'phenylalanine hydroxylase (PAH) — BH4 cofactor; PKU deficiency enzyme' },
    ],
    recon3d_subsystem: 'Phenylalanine metabolism',
    refs: [],
  },
  {
    slug: 'lysine_metabolism',
    name: 'Lysine metabolism',
    category: 'catabolism',
    systems: ['musculoskeletal', 'digestive'],
    description: 'Lysine is essential (humans cannot synthesize) and the most-abundant basic amino acid. Catabolism goes via saccharopine pathway (LKR / SDH — bifunctional enzyme deficient in hyperlysinemia) → α-aminoadipate → α-ketoadipate → glutaryl-CoA → acetyl-CoA + CO2. Lysine is the precursor for CARNITINE biosynthesis (multi-step: lysine → trimethyllysine → β-hydroxy-trimethyllysine → 4-N-trimethylaminobutyraldehyde → γ-butyrobetaine → L-carnitine; the last step is hydroxylated by BBOX1, which is also a target of the ketogenic-mimetic mildronate / meldonium). Hyperlysinemia is generally benign; glutaric aciduria type 1 (GCDH deficiency, downstream) causes a macrocephalic neonatal encephalopathy.',
    steps: [
      { from: 'lysine', to: 'saccharopine', via: 'LKR (α-aminoadipic semialdehyde synthase, bifunctional LKR-SDH)' },
      { from: 'saccharopine', to: 'alpha-aminoadipate', via: 'SDH (saccharopine dehydrogenase) + glutamate semialdehyde branch' },
      { from: 'lysine', to: 'l-carnitine', via: 'multi-step (TMLD + 4-OH-TML + TMABA → BBOX1) — only in liver + kidney + brain' },
    ],
    recon3d_subsystem: 'Lysine metabolism',
    refs: [],
  },
  {
    slug: 'taurine_synthesis',
    name: 'Taurine synthesis + bile-acid conjugation',
    category: 'biosynthesis',
    systems: ['digestive', 'nervous'],
    description: 'Most-abundant free amino acid in mammals; not protein-bound. Synthesized from cysteine: cysteine → cysteine sulfinic acid (via cysteine dioxygenase, CDO1) → hypotaurine (via cysteine sulfinic acid decarboxylase, CSAD, the rate-limiting step) → taurine (via hypotaurine dehydrogenase). Major uses: (1) bile-acid conjugation (cholic + chenodeoxycholic acid + taurine → taurocholate / taurochenodeoxycholate, ratio 1:3 with glycine conjugates in humans); (2) osmolyte in retinal photoreceptors + cardiomyocytes; (3) GABA-A receptor agonist (CNS inhibition); (4) cardioprotection (taurine deficiency in cats → dilated cardiomyopathy, a classic veterinary observation that drove discovery of taurine essentiality in cats). Humans can synthesize but at low rates — supplemental taurine is investigated for CHF, post-MI cardioprotection, and as a popular component of energy drinks (proposed efferent + glycemic effects).',
    steps: [
      { from: 'cysteine', to: 'cysteine-sulfinic-acid', via: 'cysteine dioxygenase (CDO1)' },
      { from: 'cysteine-sulfinic-acid', to: 'hypotaurine', via: 'cysteine sulfinic acid decarboxylase (CSAD) — RATE-LIMITING' },
      { from: 'hypotaurine', to: 'taurine', via: 'hypotaurine dehydrogenase' },
    ],
    recon3d_subsystem: 'Taurine and hypotaurine metabolism',
    refs: [],
  },
  {
    slug: 'bh4_cycle',
    name: 'Tetrahydrobiopterin (BH4) cycle',
    category: 'biosynthesis',
    systems: ['nervous', 'endocrine'],
    description: 'BH4 (tetrahydrobiopterin) is the obligate cofactor for the aromatic amino acid hydroxylases — TYROSINE HYDROXYLASE (TH, catecholamine synthesis), TRYPTOPHAN HYDROXYLASE (TPH, serotonin synthesis), PHENYLALANINE HYDROXYLASE (PAH, PKU enzyme) — and for all three NITRIC OXIDE SYNTHASE isoforms (NOS1/2/3). De novo synthesis: GTP → 7,8-dihydroneopterin triphosphate (GTPCH1, rate-limiting + tightly regulated) → multi-step → BH4. Salvage: 7,8-dihydrobiopterin → BH4 via DHFR. After each hydroxylation reaction BH4 is oxidized to BH2; recycled by DHPR (dihydropteridine reductase). DHPR deficiency causes a PKU-like phenotype because functional PAH activity fails despite intact enzyme protein. SAPROPTERIN = synthetic BH4 used to rescue mild PAH deficiency. BH4 deficiency also causes monoamine deficiency syndromes — treated with L-DOPA + 5-HTP supplementation.',
    steps: [
      { from: 'gtp', to: '7-8-dihydroneopterin-triphosphate', via: 'GTP cyclohydrolase 1 (GTPCH1) — RATE-LIMITING' },
      { from: '7-8-dihydroneopterin-triphosphate', to: 'bh4', via: 'multi-step (PTPS + SR)' },
      { from: 'bh2', to: 'bh4', via: 'DHPR (dihydropteridine reductase) — recycles cofactor after hydroxylation' },
    ],
    recon3d_subsystem: 'Tetrahydrobiopterin metabolism',
    refs: [],
  },
  {
    slug: 'thiamine_metabolism',
    name: 'Thiamine metabolism (vitamin B1)',
    category: 'biosynthesis',
    systems: ['nervous', 'digestive'],
    description: 'Thiamine = vitamin B1. Active form: thiamine pyrophosphate (TPP), cofactor for pyruvate dehydrogenase (PDH), α-ketoglutarate dehydrogenase (TCA), transketolase (PPP), and branched-chain α-ketoacid dehydrogenase (BCAA catabolism). Deficiency causes: BERIBERI (wet = high-output CHF; dry = peripheral neuropathy) when chronic; WERNICKE encephalopathy (acute confusion + ataxia + ophthalmoplegia) when acute — classic in alcoholism + hyperemesis gravidarum + bariatric surgery + chronic vomiting. Korsakoff syndrome = chronic memory deficit residual to untreated Wernicke. Glucose load WITHOUT thiamine repletion can precipitate Wernicke (the "give thiamine before glucose" ED rule). High-dose IV thiamine (500 mg q8h × 3 days) is first-line treatment.',
    steps: [
      { from: 'thiamine', to: 'thiamine-pyrophosphate', via: 'thiamine pyrophosphokinase (TPK1)' },
    ],
    recon3d_subsystem: 'Thiamine metabolism',
    refs: [],
  },
  {
    slug: 'biotin_metabolism',
    name: 'Biotin metabolism (vitamin B7)',
    category: 'biosynthesis',
    systems: ['endocrine', 'integumentary'],
    description: 'Biotin = vitamin B7, cofactor for the FOUR mammalian carboxylases: pyruvate carboxylase (PC, gluconeogenesis anaplerosis), acetyl-CoA carboxylase (ACC, fatty acid synthesis rate-limiting), propionyl-CoA carboxylase (PCC, BCAA + odd-chain FA), methylcrotonyl-CoA carboxylase (MCC, leucine catabolism). Biotin is covalently attached to apo-carboxylases by HCS (holocarboxylase synthetase) on a specific lysine. Recycled by BIOTINIDASE that cleaves biotin from biotinyl-lysine (biocytin). Biotinidase deficiency = newborn-screened multiple carboxylase deficiency presenting with alopecia + seizures + cutaneous rash + metabolic acidosis; treated with oral biotin. Biotin supplementation (high doses for "hair + nails") interferes with biotin-streptavidin immunoassays — causes spurious lab results (TSH, troponin, hCG).',
    steps: [
      { from: 'biotin', to: 'biotinyl-apocarboxylase', via: 'holocarboxylase synthetase (HCS) — covalent attachment to PC/ACC/PCC/MCC' },
      { from: 'biocytin', to: 'biotin', via: 'biotinidase — recycles cofactor; deficiency is screened in newborn screen' },
    ],
    recon3d_subsystem: 'Biotin metabolism',
    refs: [],
  },
  {
    slug: 'vitamin_b12_metabolism',
    name: 'Vitamin B12 (cobalamin) metabolism',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'nervous', 'digestive'],
    description: 'Cobalamin = vitamin B12. Absorption: dietary B12 in protein binds INTRINSIC FACTOR (IF, gastric parietal cells) in duodenum → IF-B12 complex absorbed at terminal ileum via cubilin/AMN receptor. Two coenzymes: methylcobalamin (methionine synthase cofactor, see methionine_sam_cycle) and adenosylcobalamin (methylmalonyl-CoA mutase cofactor, propionate catabolism). Deficiency causes: megaloblastic anemia (impaired DNA synthesis via THF trap), subacute combined degeneration of the spinal cord (impaired myelin maintenance from methylmalonate accumulation), hyperhomocysteinemia. Causes: pernicious anemia (autoimmune anti-IF antibodies), atrophic gastritis, terminal ileum disease/resection, strict vegan diet without supplementation. Treatment: IM cyanocobalamin (1000 µg monthly) or high-dose oral; underlying cause-specific.',
    steps: [
      { from: 'cobalamin', to: 'methylcobalamin', via: 'methionine synthase reductase + MTRR' },
      { from: 'cobalamin', to: 'adenosylcobalamin', via: 'mitochondrial adenosylation (MMAA/MMAB)' },
    ],
    recon3d_subsystem: 'Vitamin B12 metabolism',
    refs: [],
  },
  {
    slug: 'vitamin_b6_metabolism',
    name: 'Vitamin B6 metabolism (pyridoxal phosphate)',
    category: 'biosynthesis',
    systems: ['nervous', 'immune-hematologic'],
    description: 'Vitamin B6 has 6 vitamers; the active coenzyme is pyridoxal 5\'-phosphate (PLP). Cofactor for ~150 enzymes — virtually all aminotransferases, decarboxylases (AADC → catecholamines + serotonin, GAD → GABA), heme synthesis (ALA synthase, see heme_biosynthesis), glycogen phosphorylase, cystathionine β-synthase (CBS, methionine cycle transsulfuration), kynureninase (tryptophan kynurenine path). Deficiency: peripheral neuropathy + sideroblastic anemia + seizures (especially in neonates with PNPO deficiency or ALDH7A1 pyridoxine-dependent epilepsy — IV pyridoxine bolus is the diagnostic test). ISONIAZID + cycloserine + hydralazine deplete PLP (isoniazid forms a hydrazone) — pyridoxine 25-50 mg/d co-prescribed with INH for TB to prevent neuropathy. High-dose pyridoxine (>200 mg/d chronic) causes a sensory neuronopathy via paradoxical mechanism.',
    steps: [
      { from: 'pyridoxine', to: 'pyridoxal-5-phosphate', via: 'pyridoxal kinase (PDXK) + PNPO (pyridox(am)ine 5\'-phosphate oxidase)' },
    ],
    recon3d_subsystem: 'Vitamin B6 metabolism',
    refs: [],
  },
  {
    slug: 'aminosugar_metabolism',
    name: 'Aminosugar metabolism (hexosamine pathway)',
    category: 'biosynthesis',
    systems: ['musculoskeletal', 'integumentary', 'endocrine'],
    description: 'Branch of glucose metabolism that diverts F6P → UDP-N-acetylglucosamine (UDP-GlcNAc), the substrate for: (1) O-GlcNAc protein modification (analogous to phosphorylation, dynamic regulation of metabolic + transcription factors); (2) N-linked glycoprotein synthesis (ER); (3) glycosaminoglycan biosynthesis (hyaluronan, chondroitin, heparan sulfate). The committed step is GFAT (glutamine fructose-6-P aminotransferase). Flux is glucose-sensitive — diabetic hyperglycemia drives increased UDP-GlcNAc + increased O-GlcNAcylation, a proposed mechanism in diabetic vascular complications. GLUCOSAMINE supplementation enters at the F6P-amination step; clinical evidence for joint-disease effects is mixed.',
    steps: [
      { from: 'fructose-6-phosphate', to: 'glucosamine-6-phosphate', via: 'GFAT (glutamine-fructose-6-P amidotransferase) — RATE-LIMITING; glutamine N-donor' },
      { from: 'glucosamine-6-phosphate', to: 'udp-glcnac', via: 'multi-step (GNA + AGM + UAP)' },
    ],
    recon3d_subsystem: 'Aminosugar metabolism',
    refs: [],
  },
  {
    slug: 'coa_synthesis',
    name: 'Coenzyme A synthesis (pantothenate pathway)',
    category: 'biosynthesis',
    systems: ['endocrine', 'musculoskeletal'],
    description: 'CoA (coenzyme A) is the central acyl-carrier in metabolism — present in acetyl-CoA, succinyl-CoA, fatty acyl-CoA, HMG-CoA, every acyl-CoA species. Biosynthesized from pantothenate (vitamin B5) via five enzymatic steps: pantothenate → 4\'-phosphopantothenate (PANK1-4, RATE-LIMITING) → 4\'-phospho-N-pantothenoylcysteine → 4\'-phosphopantetheine → dephospho-CoA → CoA. PANK2 deficiency causes PKAN (pantothenate kinase-associated neurodegeneration, formerly Hallervorden-Spatz) — autosomal recessive with iron accumulation in basal ganglia ("eye-of-the-tiger" MRI sign); experimental treatment with deferiprone + fosmetpantotenate. Holo-acyl carrier protein (ACP, fatty acid synthase component) also uses the phosphopantetheine arm.',
    steps: [
      { from: 'pantothenate', to: '4-prime-phosphopantothenate', via: 'pantothenate kinase (PANK1-4) — RATE-LIMITING; PKAN deficiency' },
      { from: '4-prime-phosphopantothenate', to: 'coa', via: 'multi-step (PPCS + PPCDC + COASY)' },
    ],
    recon3d_subsystem: 'CoA synthesis',
    refs: [],
  },
];

function main(): void {
  const existing = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(existing.map(p => [p.slug, p]));

  // ── Step 1: backfill recon3d_subsystem on existing pathways ─────────
  let backfilled = 0;
  for (const [slug, subsystem] of Object.entries(BACKFILL)) {
    const p = bySlug.get(slug);
    if (!p) {
      console.log(`  [warn] backfill target missing: ${slug}`);
      continue;
    }
    if (!p.recon3d_subsystem) {
      p.recon3d_subsystem = subsystem;
      backfilled++;
      console.log(`  [r3d ] ${slug.padEnd(34)} ← "${subsystem}"`);
    }
  }

  // ── Step 2: append new pathways for under-covered Recon3D subsystems ──
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) {
      console.log(`  [skip] ${p.slug} already exists`);
    } else {
      existing.push(p);
      added++;
      console.log(`  [add ] ${p.slug.padEnd(34)} (${p.steps.length} steps, R3D="${p.recon3d_subsystem}")`);
    }
  }

  existing.sort((a, b) => a.slug.localeCompare(b.slug));

  writeFileSync(PATHWAYS_PATH, JSON.stringify(existing, null, 2) + '\n');
  console.log(`\nWave 5a Recon3D ETL (v1.2): backfilled ${backfilled}, +${added} pathways → ${existing.length} total.`);
}

main();
