/**
 * 2026-05-24-signaling-batch-O.ts
 *
 * step.note grind, batch O — 5 gap-3 + 7 canonical gap-2 pathways, notes-only.
 * Refs title-checked via esummary 2026-05-24:
 *   bladder_detrusor_pharmacology  PMID:22275187
 *   hiv_replication_blockade       PMID:9287227, 24195548 (dolutegravir)
 *   inositol_phosphate_signaling   PMID:19010359
 *   pde5_no_cgmp_axis              PMID:17942972
 *   transporter_phase3_overview    PMID:30091177 (ITC transporters)
 *   glucocorticoid_receptor_signaling  PMID:21149445
 *   histamine_receptor_pharmacology    PMID:9311023, 22035879
 *   glutamate_receptor_pharmacology    PMID:20716669 (Pharmacol Rev)
 *   nrf2_keap1_antioxidant_response    PMID:29717933, 30610225, 24647116
 *   ldl_receptor_pcsk9_axis        PMID:28304224 (FOURIER), 30403574 (ODYSSEY), 19299327
 *   voltage_gated_sodium_channels  PMID:33199904
 *   retinoic_acid_rar_rxr_signaling  PMID:17132853 (IUPHAR retinoid)
 * NOTE: pde5_no_cgmp_axis "cgmp-rise -> cgmp-rise" self-loop not annotated.
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-O.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'bladder_detrusor_pharmacology',
    notes: {
      'detrusor-m3-activation detrusor-contraction':
        'The detrusor (bladder wall) muscle contracts to void via parasympathetic acetylcholine acting on M3 ' +
        'muscarinic receptors. This is the target of antimuscarinics (oxybutynin, tolterodine) for overactive ' +
        'bladder — though the same M3 blockade elsewhere causes the dry mouth and constipation that limit them.',
      'detrusor-b3-activation detrusor-relaxation':
        'Detrusor relaxation during filling is promoted by sympathetic β3-adrenergic signaling, letting the ' +
        'bladder store urine at low pressure. The β3 agonist mirabegron exploits this to treat overactive bladder ' +
        'without antimuscarinic side effects — a mechanistically distinct alternative.',
      'urethral-a1a-activation urethral-contraction':
        'Continence also requires the internal urethral sphincter to stay contracted, driven by α1A-adrenergic ' +
        'tone. This is why α1-blockers (tamsulosin) relax the bladder outlet to relieve obstruction in BPH — and ' +
        'why they can cause stress incontinence or retrograde ejaculation.',
    },
  },
  {
    slug: 'hiv_replication_blockade',
    notes: {
      'hiv-rna hiv-dna':
        'HIV is a retrovirus: its reverse transcriptase copies the viral RNA genome into DNA — a step with no host ' +
        'equivalent, making it a prime drug target. Nucleoside (NRTI) and non-nucleoside (NNRTI) ' +
        'reverse-transcriptase inhibitors block this conversion, the backbone of antiretroviral therapy.',
      'hiv-dna proviral-integration':
        'The viral DNA is spliced into the host genome by integrase, establishing a permanent provirus (and the ' +
        'latent reservoir that prevents cure). Integrase strand-transfer inhibitors (dolutegravir, bictegravir) ' +
        'block this step and are now first-line for their potency and high barrier to resistance.',
      'hiv-polyprotein mature-virion':
        'New viral polyproteins must be cleaved by HIV protease into functional proteins to form an infectious, ' +
        'mature virion. Protease inhibitors block this maturation, yielding non-infectious particles — a third ' +
        'target class that, combined with the others, drives viral load below detection in modern triple therapy.',
    },
  },
  {
    slug: 'inositol_phosphate_signaling',
    notes: {
      'phosphatidylinositol-4-5-bisphosphate inositol-trisphosphate':
        'Gq-coupled receptors activate phospholipase C, which cleaves the membrane lipid PIP2 into two second ' +
        'messengers: inositol-1,4,5-trisphosphate (IP3) and diacylglycerol (DAG). IP3 is the soluble arm that ' +
        'mobilizes calcium, while DAG stays in the membrane to activate PKC — splitting one signal into two.',
      'inositol-trisphosphate inositol':
        'IP3 diffuses to the ER and opens IP3 receptors, releasing stored Ca²⁺ into the cytosol — the calcium ' +
        'signal behind secretion, contraction, and gene expression. IP3 is then dephosphorylated stepwise back to ' +
        'free inositol, terminating the signal.',
      'inositol phosphatidylinositol':
        'Free inositol is recycled to rebuild phosphatidylinositol and replenish the PIP2 pool. Lithium inhibits ' +
        'inositol monophosphatase in this recycling pathway — the leading “inositol-depletion” hypothesis for its ' +
        'mood-stabilizing action in bipolar disorder.',
    },
  },
  {
    slug: 'pde5_no_cgmp_axis',
    notes: {
      'nitric-oxide cgmp-rise':
        'Nitric oxide (from nerves or endothelium) activates soluble guanylate cyclase to raise cGMP in smooth ' +
        'muscle. In the penis, NO from non-adrenergic non-cholinergic nerves drives this rise — the physiological ' +
        'trigger for erection, and the upstream half of the pathway PDE5 inhibitors act on.',
      'cgmp-rise smooth-muscle-relaxation':
        'cGMP activates protein kinase G, lowering intracellular calcium to relax smooth muscle — vasodilation ' +
        'and, in the corpus cavernosum, erection. PDE5 normally degrades cGMP to end the signal, so inhibiting it ' +
        '(sildenafil, tadalafil) sustains cGMP — which is why these drugs still require NO/arousal to work.',
    },
  },
  {
    slug: 'transporter_phase3_overview',
    notes: {
      'lumenal-drug enterocyte-or-blocked':
        'Phase III refers to membrane transporters that move drugs across barriers — the disposition step after ' +
        'phase-I/II metabolism. At the intestine, efflux pumps like P-glycoprotein (MDR1) pump drug back into the ' +
        'lumen, limiting oral absorption and underlying many drug-drug interactions.',
      'portal-blood-drug hepatocyte':
        'Uptake transporters (OATPs) on the hepatocyte sinusoidal membrane carry drugs from portal blood into the ' +
        'liver — the entry step for hepatic clearance. OATP inhibition (by some drugs or grapefruit components) ' +
        'raises plasma levels of statins and other substrates, a key interaction mechanism.',
      'hepatocyte-drug bile':
        'Canalicular efflux transporters (MRP2, BCRP, BSEP) then pump drugs and conjugates from the hepatocyte ' +
        'into bile for elimination. This biliary excretion completes clearance; its inhibition (e.g. BSEP ' +
        'blockade) causes drug-induced cholestasis, a recognized hepatotoxicity mechanism.',
    },
  },
  {
    slug: 'glucocorticoid_receptor_signaling',
    notes: {
      'cortisol-or-synthetic-glucocorticoid gr-activation-translocation':
        'Cortisol and synthetic glucocorticoids (prednisone, dexamethasone) are lipophilic and diffuse into cells ' +
        'to bind the cytoplasmic glucocorticoid receptor, which sheds chaperones (HSP90) and translocates to the ' +
        'nucleus. This ligand-activated nuclear receptor is the single target behind glucocorticoids’ broad ' +
        'effects.',
      'gr-activation-translocation antiinflammatory-gene-transcription':
        'In the nucleus, GR induces anti-inflammatory genes (transactivation) and, by tethering to NF-κB/AP-1, ' +
        'represses pro-inflammatory genes (transrepression). This dual action gives glucocorticoids their ' +
        'immunosuppression — and the metabolic transactivation effects (hyperglycemia, osteoporosis) behind their ' +
        'side effects.',
    },
  },
  {
    slug: 'histamine_receptor_pharmacology',
    notes: {
      'histamine h1-mediated-allergic-symptoms':
        'Histamine released from mast cells and basophils acts on H1 receptors (Gq) to cause the wheal-and-flare ' +
        'of allergy — vasodilation, increased permeability (edema), itch, and bronchoconstriction. ' +
        'H1-antihistamines (cetirizine, loratadine) are inverse agonists here; older sedating ones also cross into ' +
        'the brain.',
      'histamine tmn-arousal':
        'Histamine from tuberomammillary nucleus (TMN) neurons acts as a wakefulness-promoting neurotransmitter in ' +
        'the brain. This is why first-generation (CNS-penetrant) H1-antihistamines cause sedation, and why the H3 ' +
        'autoreceptor controlling histamine release is a target for wake-promoting drugs (pitolisant).',
    },
  },
  {
    slug: 'glutamate_receptor_pharmacology',
    notes: {
      'glutamate ampa-fast-epsp':
        'Glutamate, the main excitatory neurotransmitter, activates AMPA receptors to produce the fast excitatory ' +
        'postsynaptic potential — the rapid Na⁺-driven depolarization carrying most moment-to-moment excitatory ' +
        'transmission. AMPA-receptor trafficking is a core mechanism of synaptic plasticity.',
      'glutamate nmda-ca-influx':
        'Glutamate also activates NMDA receptors, which are both ligand- and voltage-gated (Mg²⁺-blocked at rest) ' +
        'and highly Ca²⁺-permeable. This coincidence detection and calcium influx make NMDA receptors central to ' +
        'LTP and learning — and to excitotoxicity; they are the target of memantine and ketamine.',
    },
  },
  {
    slug: 'nrf2_keap1_antioxidant_response',
    notes: {
      'oxidative-or-electrophilic-stress keap1-cysteine-modification':
        'Under basal conditions KEAP1 constantly targets the transcription factor NRF2 for degradation. Oxidative ' +
        'or electrophilic stress modifies reactive cysteines on KEAP1, disabling it — so KEAP1 is a thiol-based ' +
        'sensor that detects “electrophilic load”, the trigger of the antioxidant response.',
      'nrf2-stabilization antioxidant-gene-transcription':
        'With KEAP1 disabled, NRF2 is stabilized, accumulates, and enters the nucleus to drive ' +
        'antioxidant-response-element (ARE) genes — glutathione synthesis, NQO1, HO-1, and phase-II detox ' +
        'enzymes. This master cytoprotective program is activated by dietary electrophiles (sulforaphane) and the ' +
        'drug dimethyl fumarate.',
    },
  },
  {
    slug: 'ldl_receptor_pcsk9_axis',
    notes: {
      'circulating-ldl hepatic-internalization':
        'Hepatic LDL receptors bind circulating LDL and internalize it, clearing cholesterol from blood — the main ' +
        'route lowering plasma LDL. Statins work largely by upregulating these receptors; LDLR loss-of-function ' +
        'mutations cause familial hypercholesterolemia with very high LDL and premature atherosclerosis.',
      'ldl-receptor recycling-or-degradation':
        'After internalization the LDL receptor normally recycles to the surface — unless PCSK9 binds it and routes ' +
        'it to lysosomal degradation. Blocking PCSK9 (evolocumab, alirocumab; or inclisiran siRNA) spares the ' +
        'receptors, dramatically lowering LDL and cutting cardiovascular events (FOURIER, ODYSSEY).',
    },
  },
  {
    slug: 'voltage_gated_sodium_channels',
    notes: {
      'membrane-depolarization na-channel-opening':
        'Voltage-gated sodium channels open within microseconds of membrane depolarization, allowing the Na⁺ ' +
        'influx that drives the rising phase of the action potential. This regenerative depolarization is the ' +
        'basis of electrical signaling in neurons and muscle — and the target of local anesthetics and class-I ' +
        'antiarrhythmics.',
      'na-channel-opening na-channel-inactivation':
        'Within milliseconds the channel inactivates (a hinged intracellular gate occludes the pore), ending the ' +
        'Na⁺ current and setting the refractory period. Many anticonvulsants (phenytoin, carbamazepine, ' +
        'lamotrigine) preferentially stabilize this inactivated state in rapidly firing neurons — a ' +
        'use-dependent block.',
    },
  },
  {
    slug: 'retinoic_acid_rar_rxr_signaling',
    notes: {
      'retinol retinoic-acid':
        'Dietary vitamin A (retinol) is oxidized in two steps — to retinaldehyde, then to all-trans retinoic acid ' +
        '(by retinaldehyde dehydrogenases) — the active hormone. This is the committed activation step, and excess ' +
        'retinoid (or the drug isotretinoin) is teratogenic precisely because retinoic acid is so developmentally ' +
        'potent.',
      'retinoic-acid rar-rxr-heterodimer-activation':
        'Retinoic acid binds nuclear retinoic-acid receptors (RARs), which heterodimerize with RXR and bind ' +
        'retinoic-acid response elements to control differentiation and developmental genes. This is exploited ' +
        'therapeutically — ATRA forces differentiation in acute promyelocytic leukemia, and retinoids treat acne ' +
        'and photoaging.',
    },
  },
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
console.log(`batch O total: ${totalAdded} notes`);
