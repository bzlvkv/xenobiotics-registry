/**
 * 2026-05-24-signaling-batch-Q.ts
 *
 * step.note grind, batch Q (final) — 23 single-step pathways, notes-only.
 * Ref'd pathways' titles verified via esummary 2026-05-24; the 3 ref-less
 * pathways (antimicrobial_cosmetic_peptides, cognitive_peptide_axis,
 * nucleoside_purine_pyrimidine_supplementation) get bedrock textbook notes
 * that assert no specific citation.
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-Q.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  { slug: 'ampa_kainate_glutamate_extension', notes: {
    'glutamate ampa-positive-modulation':
      'AMPA receptors mediate fast excitatory transmission, and positive allosteric modulators (“ampakines”) slow ' +
      'their desensitization/deactivation to enhance glutamatergic signaling without directly opening the channel. ' +
      'By amplifying physiological activity (and downstream BDNF), ampakines have been explored as cognitive ' +
      'enhancers and for opioid-induced respiratory depression.' } },
  { slug: 'antimicrobial_cosmetic_peptides', notes: {
    'membrane-disruption-or-receptor-signal antimicrobial-or-cosmetic-effect':
      'Bioactive peptides act by two broad mechanisms: cationic antimicrobial peptides (LL-37, defensins) disrupt ' +
      'negatively charged microbial membranes, while signaling “cosmetic” peptides (matrikines like palmitoyl ' +
      'pentapeptide) act as receptor ligands that stimulate collagen synthesis. The same chemical class thus ' +
      'serves either host defense or skin-remodeling roles.' } },
  { slug: 'bacterial_translation_inhibition', notes: {
    'bacterial-ribosome peptide-elongation':
      'The bacterial 70S ribosome (30S + 50S) differs enough from the eukaryotic 80S to be a major selective ' +
      'antibiotic target. Drug classes hit distinct steps: aminoglycosides and tetracyclines act on the 30S ' +
      '(decoding), while macrolides, chloramphenicol, and oxazolidinones act on the 50S (peptide-bond ' +
      'formation/elongation).' } },
  { slug: 'cognitive_peptide_axis', notes: {
    'cognitive-peptide-intranasal cns-bdnf-modulation':
      'Intranasal delivery is used to bypass the blood-brain barrier, routing peptides (insulin, oxytocin, and ' +
      'various nootropic peptides) along olfactory/trigeminal pathways into the CNS. Proposed cognitive effects ' +
      'are often attributed to downstream neurotrophic (BDNF) signaling, though rigorous human evidence for many ' +
      'such peptides remains preliminary.' } },
  { slug: 'cytokine_biologic_blockade', notes: {
    'cytokine-ligand cytokine-receptor-activation':
      'Many inflammatory diseases are driven by specific cytokines binding their receptors to activate (often ' +
      'JAK-STAT) signaling. Biologics intercept this at the ligand or receptor — anti-TNF (adalimumab), anti-IL-6R ' +
      '(tocilizumab), anti-IL-17/IL-23 — a targeted alternative to broad immunosuppression that transformed ' +
      'rheumatology and dermatology.' } },
  { slug: 'gabapentinoid_alpha2delta_calcium', notes: {
    'presynaptic-vesicle-pool neurotransmitter-release':
      'Gabapentin and pregabalin bind the α2δ auxiliary subunit of presynaptic voltage-gated calcium channels, ' +
      'reducing calcium-dependent release of excitatory neurotransmitters from hyperexcitable neurons. Despite ' +
      'their names they do not act on GABA receptors — this α2δ mechanism underlies their use in neuropathic pain ' +
      'and partial seizures.' } },
  { slug: 'gi_endocrine_peptides_misc', notes: {
    'gi-meal-signals gi-peptide-release':
      'Enteroendocrine cells lining the gut sense luminal nutrients and release a suite of hormones — GLP-1, GIP, ' +
      'PYY, CCK, ghrelin, secretin — that regulate digestion, insulin secretion, and appetite. This gut-brain ' +
      'endocrine axis is the target of incretin-based therapies (GLP-1 agonists) for diabetes and obesity.' } },
  { slug: 'gi_motility_secretion', notes: {
    'gut-receptor-stimulation gi-motility-or-secretion':
      'GI motility and secretion are controlled by the enteric nervous system via receptors for ACh (M3), ' +
      'serotonin (5-HT4 prokinetic), motilin, and others. Drugs target these — prokinetics (metoclopramide, ' +
      'prucalopride) stimulate motility, antisecretory and antispasmodic agents reduce it — for conditions from ' +
      'gastroparesis to IBS.' } },
  { slug: 'helminth_protozoa_targets', notes: {
    'parasite-targets parasite-clearance':
      'Antiparasitic drugs exploit parasite-specific targets: ivermectin opens invertebrate glutamate-gated ' +
      'chloride channels (paralysis), benzimidazoles bind parasite β-tubulin, and praziquantel disrupts ' +
      'schistosome calcium homeostasis. The diversity of helminth and protozoan biology is why antiparasitic ' +
      'therapy is so organism-specific.' } },
  { slug: 'ibd_mucosal_immunomodulation', notes: {
    'gut-luminal-antigens mucosal-immune-activation':
      'In inflammatory bowel disease, a dysregulated mucosal immune response to luminal (microbial) antigens — ' +
      'across a defective epithelial barrier — drives chronic inflammation. Therapy targets this cascade at ' +
      'multiple points: anti-TNF, gut-selective anti-integrin (vedolizumab), anti-IL-12/23, and JAK inhibitors.' } },
  { slug: 'medicinal_mushroom_beta_glucans', notes: {
    'fungal-beta-glucan innate-immune-activation':
      'β-glucans from medicinal mushrooms (and yeast/fungi) are recognized by the innate immune receptor Dectin-1 ' +
      '(and CR3) on macrophages and dendritic cells, activating them and shaping downstream immunity. This ' +
      'pattern-recognition mechanism is the basis for β-glucans’ proposed immunomodulatory and adjuvant effects.' } },
  { slug: 'mineral_enzyme_cofactor_overview', notes: {
    'mineral-uptake enzyme-cofactor-incorporation':
      'Trace minerals act largely as enzyme cofactors: zinc in hundreds of metalloenzymes and zinc-finger ' +
      'factors, iron in heme/Fe-S proteins, copper in oxidases, selenium in selenoproteins (GPx). Regulated ' +
      'uptake and chaperoned incorporation supply catalytic centers while preventing free-ion toxicity — which is ' +
      'why deficiency impairs many enzymes at once.' } },
  { slug: 'mitochondrial_peptide_signaling', notes: {
    'mitochondrial-stress mdp-secretion':
      'Mitochondria encode small bioactive peptides — mitochondrial-derived peptides (MDPs) such as humanin and ' +
      'MOTS-c — within their rRNA genes, released under metabolic stress. Acting as hormone-like signals (MOTS-c ' +
      'promotes metabolic homeostasis and exercise adaptation), they form a mitochondria-to-systemic ' +
      'communication axis of growing interest in aging.' } },
  { slug: 'neuromuscular_junction_blockade', notes: {
    'acetylcholine-release-at-nmj muscle-fiber-action-potential':
      'At the neuromuscular junction, motor-nerve acetylcholine activates muscle nicotinic receptors to trigger ' +
      'the muscle action potential and contraction. Neuromuscular blockers interrupt this — non-depolarizing ' +
      'agents (rocuronium) competitively block the receptor, succinylcholine depolarizes persistently — for ' +
      'surgical paralysis, reversed by neostigmine or sugammadex.' } },
  { slug: 'nucleoside_purine_pyrimidine_supplementation', notes: {
    'dietary-nucleoside cellular-nucleotide-pool':
      'Cells obtain nucleotides by de novo synthesis or by salvaging dietary/recycled nucleosides and bases — the ' +
      'salvage pathway being far more energy-efficient. Rapidly dividing tissues (gut, immune cells) rely heavily ' +
      'on salvage, which is why dietary nucleotides are added to infant formula and why antimetabolite drugs ' +
      'target these pathways.' } },
  { slug: 'peptidoglycan_synthesis', notes: {
    'd-ala-d-ala-terminus peptidoglycan-crosslink':
      'Bacterial cell-wall strength comes from peptidoglycan cross-links formed by transpeptidases ' +
      '(penicillin-binding proteins) acting on the D-Ala-D-Ala terminus. β-lactams mimic this terminus to ' +
      'irreversibly inhibit the transpeptidases, while vancomycin binds the D-Ala-D-Ala directly — two classes ' +
      'attacking the same essential cross-linking step.' } },
  { slug: 'sarm_androgen_modulation', notes: {
    'sarm-binding tissue-selective-ar-activation':
      'Selective androgen receptor modulators (SARMs) bind the androgen receptor but induce tissue-selective ' +
      'conformations, aiming for anabolic effects in muscle and bone with less prostate/virilizing activity than ' +
      'testosterone. Investigated for muscle-wasting (and widely abused in sport), none is yet approved, and ' +
      'liver and cardiovascular safety remain concerns.' } },
  { slug: 'skeletal_muscle_relaxants', notes: {
    'spinal-reflex-arc reduced-muscle-tone':
      'Centrally acting muscle relaxants (cyclobenzaprine, tizanidine, baclofen) reduce muscle tone by dampening ' +
      'spinal/supraspinal reflex arcs rather than acting on muscle directly — via α2-adrenergic (tizanidine), ' +
      'GABA-B (baclofen), or broad CNS depression. Their sedation reflects this central action; they are used for ' +
      'spasticity and acute muscle spasm.' } },
  { slug: 'tissue_repair_peptides', notes: {
    'injury-tissue-stress repair-peptide-signaling':
      'A class of peptides (the gastric pentadecapeptide BPC-157, thymosin β4) is promoted for accelerating tissue ' +
      'repair, proposed to act via angiogenic and growth-factor (VEGF, FGF) signaling and cytoprotection. ' +
      'Preclinical data are suggestive but rigorous human evidence is limited, and these agents are unapproved and ' +
      'used off-label.' } },
  { slug: 'tricyclic_atypical_antidepressants', notes: {
    'monoamine-reuptake-blockade-or-receptor-modulation synaptic-monoamine-elevation':
      'Tricyclics (amitriptyline) and atypical/multimodal antidepressants raise synaptic monoamines by blocking ' +
      'serotonin/norepinephrine reuptake and/or modulating receptors (mirtazapine’s α2 antagonism, vortioxetine’s ' +
      'multimodal 5-HT actions). TCAs’ added antihistamine, anticholinergic, and sodium-channel effects explain ' +
      'their sedation and dangerous overdose toxicity.' } },
  { slug: 'trp_channel_sensory_transduction', notes: {
    'noxious-or-thermal-stimulus trp-channel-activation':
      'TRP channels are polymodal sensory transducers: TRPV1 detects noxious heat and capsaicin, TRPM8 cold and ' +
      'menthol, TRPA1 irritants and cold. As nonselective cation channels they depolarize sensory neurons to ' +
      'encode temperature, pain, and chemical irritation — making TRPV1 a target for analgesics and the receptor ' +
      'behind chili pepper’s “heat”.' } },
  { slug: 'tyrosine_kinase_inhibition', notes: {
    'tyrosine-kinase-active downstream-phosphorylation':
      'Receptor and non-receptor tyrosine kinases phosphorylate downstream substrates to drive proliferation and ' +
      'survival; their constitutive activation (by mutation or fusion, e.g. BCR-ABL) drives many cancers. ' +
      'Tyrosine kinase inhibitors (imatinib, the “-tinibs”) block the ATP-binding site — imatinib’s success in ' +
      'CML launched the era of targeted cancer therapy.' } },
  { slug: 'volatile_anesthetic_gaba_glycine', notes: {
    'alveolar-gas-phase systemic-equilibration':
      'Volatile anesthetics are delivered as gases whose alveolar partial pressure equilibrates with blood and ' +
      'brain; the blood-gas partition coefficient governs induction speed and MAC quantifies potency. At the ' +
      'molecular level they act largely by potentiating inhibitory GABA-A and glycine receptors (and inhibiting ' +
      'some excitatory channels), though a unified mechanism of anesthesia is still debated.' } },
];

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let totalAdded = 0;
for (const { slug, notes } of BATCH) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  let added = 0;
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = notes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(notes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
  console.log(`${slug}: added ${added} step notes`);
  totalAdded += added;
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`batch Q total: ${totalAdded} notes`);
