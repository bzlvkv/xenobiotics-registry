/**
 * 2026-05-24-biochem-step-notes-batch5.ts
 *
 * step.note LARGE batch 5 — 12 textbook pathways (essential-fatty-acid
 * desaturation/elongation, sphingolipid, glycerophospholipid, ketone
 * synthesis, fibrinolysis, gastric acid, lysine, glycine/serine/
 * threonine, thiamine, B6, biotin, aminosugar). Established biochem,
 * complementary to each `via`; grounded by existing refs[], NO new
 * PMIDs. Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-biochem-step-notes-batch5.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  essential_fatty_acid_n3_n6_conversion: {
    'α-linolenic acid (ALA, 18:3n-3) 18:4n-3':
      'Δ6-desaturase (FADS2) is the rate-limiting first step shared by BOTH the n-3 and n-6 families, so ALA ' +
      'and linoleic acid compete for it — high dietary LA (Western seed oils) throttles ALA→EPA/DHA ' +
      'conversion, and FADS variants strongly shape endogenous PUFA status.',
    '18:4n-3 eicosatetraenoic acid (20:4n-3)':
      'ELOVL5 elongates by two carbons. The whole elongation/desaturation chain is slow in humans, so ' +
      'endogenous EPA/DHA synthesis from plant ALA is limited (often <5–10%) — the rationale for preformed ' +
      'marine EPA/DHA.',
    'eicosatetraenoic acid (20:4n-3) EPA (20:5n-3)':
      'Δ5-desaturase (FADS1) makes EPA, substrate for the less-inflammatory series-3 eicosanoids and ' +
      'resolvins. FADS1/2 sit in a gene cluster whose variants explain much of the inter-individual ' +
      'difference in EPA/DHA levels and fish-oil response.',
    'EPA (20:5n-3) DHA (22:6n-3)':
      'DHA synthesis is roundabout (the Sprecher pathway): elongation to 24:6n-3 then peroxisomal ' +
      'β-oxidation back to 22:6n-3 — humans have no direct Δ4-desaturase. This further limits endogenous ' +
      'DHA, which is critical for brain and retina.',
    'linoleic acid (LA, 18:2n-6) γ-linolenic acid (GLA, 18:3n-6)':
      'The n-6 arm uses the same Δ6-desaturase as n-3 (the point of competition). This step is often cited as ' +
      'limiting, the basis for GLA-supplying oils (evening primrose, borage) that bypass it.',
    'GLA (18:3n-6) dihomo-γ-linolenic acid (DGLA, 20:3n-6)':
      'ELOVL5 elongates GLA to DGLA, precursor of the series-1 (anti-inflammatory) prostaglandin PGE1 — so ' +
      'DGLA is an anti-inflammatory node, balanced against its onward conversion to arachidonic acid.',
    'DGLA (20:3n-6) arachidonic acid (AA, 20:4n-6)':
      'Δ5-desaturase makes arachidonic acid, which feeds the pro-inflammatory eicosanoid cascade (see ' +
      'arachidonic_acid_cascade). The dietary n-3:n-6 ratio shifts membrane AA vs EPA and thus the ' +
      'inflammatory tone of eicosanoid signaling.',
  },
  sphingolipid_metabolism: {
    'palmitoyl-coa 3-ketosphinganine':
      'Serine palmitoyltransferase condenses serine with palmitoyl-CoA — the committed, rate-limiting entry ' +
      'to sphingolipid synthesis. SPT mutations cause hereditary sensory neuropathy (HSAN1) via toxic ' +
      'deoxy-sphingolipids.',
    '3-ketosphinganine ceramide':
      'Ceramide is the central hub of sphingolipid metabolism — both a building block and a pro-apoptotic, ' +
      'stress/senescence second messenger. Ceramide synthases (CerS1–6) differ by acyl-chain length, giving ' +
      'tissue-specific ceramide species.',
    'ceramide sphingomyelin':
      'Sphingomyelin synthase transfers phosphocholine from PC onto ceramide, making the major membrane ' +
      'sphingolipid (abundant in myelin and lipid rafts) and generating DAG — coupling sphingolipid and ' +
      'glycerolipid signaling.',
    'ceramide glucosylceramide':
      'Glucosylceramide synthase begins glycosphingolipid/ganglioside synthesis and is the eliglustat ' +
      'target. Defects in the reverse lysosomal catabolism cause sphingolipidoses — Gaucher ' +
      '(glucocerebrosidase) and Tay-Sachs (hexosaminidase A).',
  },
  glycerophospholipid_metabolism: {
    'glycerol-3-phosphate phosphatidic-acid':
      'Sequential acylation (GPAT, AGPAT) of glycerol-3-phosphate builds phosphatidic acid — the common ' +
      'precursor of all glycerophospholipids and of triacylglycerol, and itself a signaling lipid; the branch ' +
      'point between membrane phospholipid and fat storage.',
    'phosphatidic-acid diacylglycerol':
      'Phosphatidic-acid phosphatase (lipin-1) makes DAG, both a triglyceride precursor and a PKC-activating ' +
      'signaling lipid. Lipin-1 mutations cause recurrent rhabdomyolysis; this PA↔DAG node governs the ' +
      'lipogenesis-vs-signaling split.',
    'diacylglycerol phosphatidylcholine':
      'The CDP-choline (Kennedy) pathway makes phosphatidylcholine, the most abundant membrane phospholipid, ' +
      'from choline — linking choline status to membrane integrity and to hepatic VLDL secretion (PC is ' +
      'required to package and export fat).',
    'phosphatidylethanolamine phosphatidylcholine':
      'PEMT methylates phosphatidylethanolamine to PC via three SAM methylations — a hepatic route supplying ' +
      '~30% of PC and a large methyl-group consumer. It lets the liver make PC when dietary choline is low, ' +
      'but PEMT variants/estrogen-dependence make choline conditionally essential in some.',
  },
  ketone_body_synthesis: {
    'acetyl-coa acetoacetyl-coa':
      'Thiolase condenses two acetyl-CoA (reverse of the β-oxidation thiolase step) — so ketogenesis draws on ' +
      'the acetyl-CoA flooding mitochondria in fasting/low-carb states when fat oxidation outpaces TCA ' +
      'capacity (oxaloacetate diverted to gluconeogenesis).',
    'acetoacetyl-coa hmg-coa':
      'Mitochondrial HMG-CoA synthase 2 (HMGCS2) is the rate-limiting, ketogenesis-committed enzyme — ' +
      'distinct from the cytosolic HMGCS1 of cholesterol synthesis — and is induced by fasting via ' +
      'PPARα/FGF21, restricting ketone production largely to the liver.',
    'hmg-coa acetoacetate':
      'HMG-CoA lyase cleaves HMG-CoA to acetoacetate plus acetyl-CoA; though HMG-CoA is shared with ' +
      'cholesterol synthesis, this mitochondrial pool is committed to ketones. Lyase deficiency causes ' +
      'hypoketotic hypoglycemia with metabolic crises.',
    'acetoacetate beta-hydroxybutyrate':
      'BDH1 interconverts acetoacetate and β-hydroxybutyrate; β-HB is the dominant circulating ketone and the ' +
      'form home meters measure. The acetoacetate:β-HB ratio reflects mitochondrial NADH/NAD⁺ redox state.',
    'acetoacetate acetone':
      'Acetoacetate spontaneously (non-enzymatically) decarboxylates to acetone, which is exhaled — the ' +
      'fruity breath of fasting/ketoacidosis and the basis of breath-ketone meters.',
  },
  fibrinolysis: {
    'plasminogen plasmin':
      'tPA (endothelial) and urokinase convert fibrin-bound plasminogen to plasmin, with fibrin itself acting ' +
      'as a cofactor that focuses fibrinolysis on the clot. Recombinant tPA (alteplase) is the thrombolytic ' +
      'for acute stroke/MI; PAI-1 and α2-antiplasmin restrain it.',
    'plasmin fibrin-degradation-products':
      'Plasmin digests cross-linked fibrin into D-dimer and other FDPs — D-dimer being the marker used to ' +
      'rule out VTE/DIC. Antifibrinolytics (tranexamic acid, aminocaproic acid) block plasmin(ogen) to reduce ' +
      'bleeding.',
  },
  gastric_acid_secretion: {
    'parietal-cell-stimulation h-k-atpase-activation':
      'Three stimuli converge on the parietal cell: histamine (H2/Gs from ECL cells — the dominant ' +
      'amplifier), acetylcholine (M3/Gq, vagal), and gastrin (CCK2/Gq). This is why H2-blockers and vagotomy ' +
      'reduce acid; somatostatin is the physiologic brake.',
    'h-k-atpase-activation gastric-hcl-secretion':
      'The H⁺/K⁺-ATPase (proton pump) is the final common step, secreting H⁺ to make luminal HCl as low as ' +
      '~pH 1. It is the irreversible target of proton-pump inhibitors, which bind only the activated pump — ' +
      'hence PPIs work best dosed before meals.',
  },
  lysine_metabolism: {
    'lysine saccharopine':
      'The saccharopine pathway (bifunctional AASS) is the main lysine catabolic route; defects cause ' +
      'hyperlysinemia (usually benign). Lysine is strictly ketogenic, ultimately yielding acetyl-CoA via ' +
      'α-aminoadipate and glutaryl-CoA.',
    'saccharopine alpha-aminoadipate':
      'Continuing to α-aminoadipate, the pathway heads toward glutaryl-CoA; a downstream block at glutaryl-CoA ' +
      'dehydrogenase causes glutaric aciduria type I (a treatable cause of acute striatal injury) — tying ' +
      'lysine catabolism to a key neurometabolic disease.',
    'lysine l-carnitine':
      'Protein-bound trimethyl-lysine is also the carbon skeleton for endogenous carnitine synthesis, ' +
      'completed in liver/kidney by γ-butyrobetaine hydroxylase (BBOX1) — the step inhibited by meldonium ' +
      '(mildronate).',
  },
  glycine_serine_threonine_metabolism: {
    'serine glycine':
      'SHMT interconverts serine and glycine while loading a one-carbon unit onto THF — the major one-carbon ' +
      'source feeding nucleotide synthesis and methylation, so serine/glycine availability is a control point ' +
      'on proliferation.',
    '3-phosphoglycerate serine':
      'De-novo serine from the glycolytic intermediate 3-phosphoglycerate (PHGDH rate-limiting) — amplified in ' +
      'several cancers and the reason serine/glycine become conditionally essential when growth/one-carbon ' +
      'demand is high.',
    'threonine glycine-acetylcoa':
      'Threonine dehydrogenase is a major threonine catabolic route in the newborn and in rodents (largely ' +
      'silenced in adult humans by a pseudogene), yielding glycine and acetyl-CoA.',
  },
  thiamine_metabolism: {
    'thiamine thiamine-pyrophosphate':
      'Thiamine pyrophosphokinase activates dietary B1 to thiamine pyrophosphate (TPP), cofactor for pyruvate ' +
      'dehydrogenase, α-ketoglutarate dehydrogenase, branched-chain ketoacid dehydrogenase, and ' +
      'transketolase. Deficiency (beriberi, Wernicke-Korsakoff) cripples these enzymes — and a glucose load ' +
      'can precipitate Wernicke in the depleted.',
  },
  vitamin_b6_metabolism: {
    'pyridoxine pyridoxal-5-phosphate':
      'Pyridoxal kinase and PNPO convert the B6 vitamers to pyridoxal-5′-phosphate (PLP) — cofactor for ~150 ' +
      'enzymes, especially transaminases, the decarboxylases of GABA/dopamine/serotonin/histamine synthesis, ' +
      'and δ-ALA synthase. PNPO deficiency causes PLP-responsive neonatal seizures; isoniazid depletes PLP.',
  },
  biotin_metabolism: {
    'biotin biotinyl-apocarboxylase':
      'Holocarboxylase synthetase covalently attaches biotin to the four carboxylases (pyruvate carboxylase, ' +
      'acetyl-CoA carboxylase, propionyl-CoA carboxylase, methylcrotonyl-CoA carboxylase); its deficiency is ' +
      'multiple carboxylase deficiency, treatable with biotin.',
    'biocytin biotin':
      'Biotinidase recycles biotin from degraded carboxylases (biocytin); its deficiency — on newborn screens ' +
      '— causes a treatable neurocutaneous syndrome. Raw egg white (avidin) tightly binds biotin and can ' +
      'induce deficiency.',
  },
  aminosugar_metabolism: {
    'fructose-6-phosphate glucosamine-6-phosphate':
      'GFAT diverts fructose-6-phosphate plus glutamine into the hexosamine biosynthesis pathway — the ' +
      'rate-limiting step and a nutrient sensor whose flux scales with glucose, glutamine, acetyl-CoA, and ' +
      'UTP availability.',
    'glucosamine-6-phosphate udp-glcnac':
      'The pathway ends in UDP-GlcNAc, the donor for N-/O-glycosylation and for O-GlcNAcylation — a ' +
      'nutrient-responsive signaling modification linked to insulin resistance and to glucosamine ' +
      'supplementation’s proposed effects.',
  },
};

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let added = 0;
for (const [slug, stepNotes] of Object.entries(NOTES)) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = stepNotes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(stepNotes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`added ${added} step notes across ${Object.keys(NOTES).length} pathways`);
