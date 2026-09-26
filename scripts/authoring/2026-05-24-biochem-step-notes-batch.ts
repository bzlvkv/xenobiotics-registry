/**
 * 2026-05-24-biochem-step-notes-batch.ts
 *
 * step.note LARGE batch — 9 textbook metabolic/biochemical pathways
 * (glycogen, cholesterol, heme synthesis + degradation, purine de-novo
 * + catabolism, pyrimidine, folate one-carbon, glutathione). Pure
 * established biochemistry, complementary to each step's `via`;
 * grounded by existing refs[], NO new PMIDs. Matched by from→to;
 * idempotent. Run once:
 *   tsx scripts/authoring/2026-05-24-biochem-step-notes-batch.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  glycogen_metabolism: {
    'glucose-6-phosphate glucose-1-phosphate':
      'Phosphoglucomutase reversibly interconverts G6P and G1P — the hub that links glycogen to glycolysis ' +
      '(via G6P) and to nucleotide-sugar synthesis. Direction follows whether the cell is storing or ' +
      'mobilizing glycogen.',
    'glucose-1-phosphate udp-glucose':
      'UDP-glucose pyrophosphorylase activates G1P to UDP-glucose at the cost of UTP; hydrolysis of the ' +
      'released pyrophosphate pulls the reaction forward. UDP-glucose is the universal glucosyl donor — for ' +
      'glycogen and for glucuronidation.',
    'udp-glucose glycogen':
      'Glycogen synthase is the rate-limiting synthetic enzyme, extending α-1,4 chains (branching enzyme adds ' +
      'α-1,6 branches). Insulin activates it via PP1 dephosphorylation and G6P activates it allosterically, ' +
      'while PKA phosphorylation inhibits it — reciprocal with phosphorylase.',
    'glycogen glucose-1-phosphate':
      'Glycogen phosphorylase releases G1P by phosphorolysis and is the rate-limiting breakdown enzyme — ' +
      'activated by glucagon/epinephrine (PKA cascade) and, in muscle, by AMP and Ca²⁺. Myophosphorylase ' +
      'deficiency is McArdle disease (exercise intolerance); liver and muscle isoforms differ.',
  },
  cholesterol_synthesis: {
    'acetyl-coa hmg-coa':
      'Two acetyl-CoA condense to acetoacetyl-CoA, then a third yields HMG-CoA. The cytosolic HMG-CoA ' +
      'synthase here feeds sterol synthesis — distinct from the mitochondrial isoform that initiates ' +
      'ketogenesis from the same intermediate.',
    'hmg-coa mevalonate':
      'HMG-CoA reductase is the rate-limiting, committed step and the statin target. Sterols feedback-regulate ' +
      'it via SREBP-2/SCAP/INSIG (transcription + ER retention) and accelerated degradation; statins lower LDL ' +
      'largely by de-repressing hepatic LDL receptors.',
    'mevalonate squalene':
      'Mevalonate is phosphorylated and decarboxylated to isopentenyl-PP, the isoprenoid building block. ' +
      'Beyond sterols this branch also makes farnesyl/geranylgeranyl groups (protein prenylation), ubiquinone ' +
      '(CoQ10), dolichol and heme-A — why statins can modestly lower CoQ10.',
    'squalene cholesterol':
      'Squalene epoxidase (a second regulated, oxygen-dependent step; the analogous fungal enzyme is the ' +
      'terbinafine target) feeds cyclization to lanosterol, then ~19 further steps to cholesterol. The oxygen ' +
      'demand makes late cholesterol synthesis sensitive to hypoxia.',
  },
  heme_biosynthesis: {
    'succinyl-coa aminolevulinic-acid':
      'ALA synthase is the rate-limiting step and requires pyridoxal-5′-phosphate (B6). Hepatic ALAS1 is ' +
      'heme-repressed and drug-inducible (CYP demand → acute porphyria attacks); erythroid ALAS2 is ' +
      'iron/erythropoiesis-regulated and mutated in X-linked sideroblastic anemia.',
    'aminolevulinic-acid porphobilinogen':
      'ALA dehydratase (PBGS) condenses two ALA and is zinc-dependent. It is potently lead-inhibited (lead ' +
      'displaces the zinc), so lead poisoning raises ALA and produces a porphyria-like picture.',
    'porphobilinogen coproporphyrinogen-iii':
      'Four porphobilinogens assemble into the tetrapyrrole ring: PBG deaminase (HMBS, mutated in acute ' +
      'intermittent porphyria), then UROS and UROD shape and decarboxylate it. UROD deficiency causes ' +
      'porphyria cutanea tarda (photosensitivity).',
    'coproporphyrinogen-iii protoporphyrin-ix':
      'Coproporphyrinogen oxidase then protoporphyrinogen oxidase complete oxidation as the pathway re-enters ' +
      'the mitochondrion, creating the conjugated ring that will chelate iron. PPOX deficiency causes ' +
      'variegate porphyria.',
    'protoporphyrin-ix heme':
      'Ferrochelatase inserts ferrous iron (Fe²⁺) into protoporphyrin IX — the final step, also lead-inhibited ' +
      '(lead blocks both ends of the pathway). Its deficiency causes erythropoietic protoporphyria; iron ' +
      'deficiency leaves zinc-protoporphyrin instead.',
  },
  heme_degradation_bilirubin: {
    'heme biliverdin':
      'Heme oxygenase (inducible HO-1, constitutive HO-2) opens the porphyrin ring, releasing carbon monoxide ' +
      '(the main endogenous CO source, a gasotransmitter) and Fe²⁺ for recycling. HO-1 is a key Nrf2-induced ' +
      'cytoprotective/antioxidant stress enzyme.',
    'biliverdin unconjugated-bilirubin':
      'Biliverdin reductase yields unconjugated (indirect) bilirubin — lipophilic, albumin-bound in blood, and ' +
      'itself a potent antioxidant. Being lipid-soluble it can cross the blood–brain barrier, the basis of ' +
      'neonatal kernicterus risk.',
    'unconjugated-bilirubin conjugated-bilirubin':
      'UGT1A1 glucuronidates bilirubin to the water-soluble conjugated form for biliary excretion. Reduced ' +
      'activity causes Gilbert syndrome (mild, common) and Crigler-Najjar (severe); the same enzyme is ' +
      'inhibited by atazanavir and performs many drug glucuronidations.',
    'conjugated-bilirubin urobilinogen':
      'Gut bacteria deconjugate and reduce bilirubin to urobilinogen; most exits as stercobilin (stool color) ' +
      'while some is reabsorbed (enterohepatic circulation) and renally excreted as urobilin (urine color). ' +
      'Biliary obstruction → pale stool with dark urine.',
  },
  purine_de_novo_synthesis: {
    'phosphoribosyl-pyrophosphate phosphoribosylamine':
      'PRPP amidotransferase is the committed, rate-limiting step, using glutamine as nitrogen donor. It is ' +
      'feedback-inhibited by the end products IMP/AMP/GMP and activated by PRPP — purine output balanced ' +
      'against need.',
    'phosphoribosylamine inosine-monophosphate':
      'Ten steps build the purine ring directly onto ribose, consuming glycine, aspartate, two glutamines, ' +
      'CO₂ and two one-carbon units from N10-formyl-THF — why antifolates indirectly throttle purine ' +
      'synthesis. IMP is the common precursor of AMP and GMP.',
    'inosine-monophosphate amp':
      'AMP synthesis from IMP uses GTP for energy and aspartate as nitrogen (via adenylosuccinate). Note the ' +
      'reciprocal cross-regulation: GTP drives AMP synthesis while ATP drives GMP synthesis, keeping the two ' +
      'nucleotide pools balanced.',
    'inosine-monophosphate gmp':
      'IMP dehydrogenase is rate-limiting for GMP and the target of mycophenolate (transplant ' +
      'immunosuppression) and ribavirin. Lymphocytes rely heavily on de-novo purines, which is why ' +
      'IMPDH inhibition is selectively immunosuppressive.',
  },
  purine_catabolism: {
    'hypoxanthine xanthine':
      'Xanthine oxidase oxidizes hypoxanthine to xanthine, generating reactive oxygen species as a byproduct. ' +
      'It is the target of allopurinol (and its active metabolite oxypurinol) and febuxostat in ' +
      'gout/hyperuricemia.',
    'xanthine uric-acid':
      'The same enzyme oxidizes xanthine to uric acid, the end product of purine catabolism in humans (who ' +
      'lack uricase). Poor urate solubility drives gout (monosodium-urate crystals) and uric-acid stones; ' +
      'rasburicase is recombinant uricase for tumor-lysis syndrome.',
  },
  pyrimidine_metabolism: {
    'glutamine carbamoyl-phosphate':
      'Cytosolic CPS II starts pyrimidine synthesis from glutamine — distinct from mitochondrial CPS1 of the ' +
      'urea cycle (which uses ammonia and needs NAG). CPS II is part of the multifunctional CAD enzyme and is ' +
      'the committed step (ATP-activated, UTP-inhibited).',
    'carbamoyl-phosphate orotate':
      'Unlike purines, the pyrimidine ring is built first and only then joined to ribose. Dihydroorotate ' +
      'dehydrogenase (DHODH) is the sole mitochondrial, membrane-bound step (coupled to the respiratory ' +
      'chain) and the target of leflunomide/teriflunomide.',
    'orotate ump':
      'UMP synthase is bifunctional (orotate phosphoribosyltransferase + OMP decarboxylase) and joins the ' +
      'ring to PRPP-derived ribose to form the first complete pyrimidine nucleotide; its deficiency causes ' +
      'hereditary orotic aciduria.',
    'ump utp':
      'UMP is phosphorylated to UDP/UTP, then CTP synthase aminates UTP to CTP using glutamine. Ribonucleotide ' +
      'reductase makes the deoxy forms for DNA, and thymidylate synthase makes dTMP (the 5-fluorouracil ' +
      'target), a folate-dependent step.',
  },
  folate_one_carbon: {
    'folic-acid dihydrofolate':
      'Supplemental folic acid (the synthetic, fully oxidized form) must be reduced before use; this first ' +
      'reduction is slow, so high doses can leave unmetabolized folic acid in circulation — part of the ' +
      'rationale for supplementing reduced 5-MTHF instead.',
    'dihydrofolate tetrahydrofolate':
      'Dihydrofolate reductase regenerates tetrahydrofolate, the active one-carbon carrier, and is the target ' +
      'of methotrexate, trimethoprim (bacterial-selective) and pyrimethamine (antiparasitic) — species ' +
      'differences in DHFR give these drugs their selectivity.',
    'tetrahydrofolate 5-methyl-tetrahydrofolate':
      'MTHFR commits one-carbon units to remethylating homocysteine to methionine (via B12-dependent ' +
      'methionine synthase). The common C677T variant lowers activity, modestly raising homocysteine; 5-MTHF ' +
      'is the form that crosses into the CNS and feeds the methionine cycle.',
    'tetrahydrofolate 5-10-methylene-tetrahydrofolate':
      'Serine hydroxymethyltransferase moves a one-carbon unit from serine (a major one-carbon source) onto ' +
      'THF, giving the 5,10-methylene-THF used by thymidylate synthase for dTMP — linking folate status ' +
      'directly to DNA synthesis and to the antifolate mechanism.',
  },
  glutathione_metabolism: {
    'glutamate gamma-glutamylcysteine':
      'γ-glutamylcysteine ligase (GCL) is the rate-limiting step, feedback-inhibited by glutathione; cysteine ' +
      'is usually the limiting substrate — the rationale for N-acetylcysteine (NAC) to replenish GSH, e.g. in ' +
      'acetaminophen overdose.',
    'gamma-glutamylcysteine glutathione':
      'Glutathione synthetase adds glycine to complete the tripeptide. GSH’s unusual γ-glutamyl bond resists ' +
      'ordinary peptidases, so it is broken down only by γ-glutamyl transferase (GGT) — itself a clinical ' +
      'marker of hepatobiliary and oxidative stress.',
    'glutathione glutathione-disulfide':
      'Glutathione peroxidase uses two GSH to reduce peroxides (H₂O₂, lipid peroxides) to water, forming ' +
      'oxidized GSSG — the cell’s principal aqueous antioxidant defense. GPx is a selenoenzyme, tying selenium ' +
      'status to antioxidant capacity.',
    'glutathione-disulfide glutathione':
      'Glutathione reductase regenerates reduced GSH from GSSG using NADPH — supplied largely by the ' +
      'pentose-phosphate pathway, which is why G6PD deficiency impairs GSH recycling and causes ' +
      'oxidant-induced hemolysis. The GSH:GSSG ratio is a core redox readout.',
  },
};

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let added = 0;
const pathwaysTouched: string[] = [];
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
  pathwaysTouched.push(slug);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`added ${added} step notes across ${pathwaysTouched.length} pathways`);
