/**
 * 2026-05-24-signaling-batch-C.ts
 *
 * step.note grind, batch C — 5 pathways, notes-only. Existing refs
 * title-checked via esummary 2026-05-24 and topically ground these notes:
 *   calcineurin_nfat_t_cell_activation  PMID:32210952 (Ca-CN-NFAT review), 10099825
 *   vdr_genomic_signaling               PMID:26681795 (Physiol Rev vitamin D)
 *   adenosine_receptor_signaling        PMID:20164566 (caffeine/adenosine), 28287473
 *   alzheimer_amyloid_tau_cascade       PMID:27255958 (amyloid cascade hypothesis)
 *   parkinson_alpha_synuclein_aggregation  PMID:30853581 (α-syn misfolding review)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-C.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'calcineurin_nfat_t_cell_activation',
    notes: {
      'TCR / CD3 engagement LCK / ZAP70 / LAT → PLCγ1':
        'T-cell activation begins when the TCR/CD3 complex recognizes peptide-MHC. The Src-family kinase LCK ' +
        'phosphorylates CD3 ITAMs, recruiting ZAP-70, which builds the LAT signalosome and activates PLCγ1 — the ' +
        'proximal cascade converting antigen recognition into the second messengers that drive the calcium and ' +
        'Ras/MAPK arms.',
      'PLCγ1 IP3 → ER Ca²⁺ release':
        'PLCγ1 cleaves PIP2 into IP3 and DAG. IP3 opens IP3 receptors on the ER to release stored Ca²⁺ — the ' +
        'initial, transient calcium signal. DAG simultaneously launches the parallel PKC/Ras-AP-1 arm that is also ' +
        'required for full activation.',
      'STIM1 / STIM2 (ER sensor) ORAI1 channel activation (plasma membrane)':
        'ER Ca²⁺ depletion is sensed by STIM1/STIM2, which oligomerize and gate ORAI1 channels in the plasma ' +
        'membrane — store-operated Ca²⁺ entry (CRAC). This sustained influx, not the brief ER release, maintains ' +
        'the high cytosolic calcium needed downstream; ORAI1/STIM mutations cause immunodeficiency.',
      '↑[Ca²⁺]cyt + calmodulin calcineurin activation':
        'Sustained high cytosolic Ca²⁺ binds calmodulin, which activates the phosphatase calcineurin (PP2B). ' +
        'Calcineurin is unusual as a Ca²⁺/calmodulin-regulated Ser/Thr phosphatase — the node that converts the ' +
        'calcium signal into a dephosphorylation event, and the direct target of the major transplant ' +
        'immunosuppressants.',
      'calcineurin active NFAT dephosphorylation (multi-site Ser)':
        'Active calcineurin dephosphorylates NFAT at multiple serines, unmasking a nuclear localization signal so ' +
        'NFAT enters the nucleus. Kinases (GSK-3, CK1) rapidly re-phosphorylate it when calcium falls, so NFAT ' +
        'activity tracks sustained calcium in real time — a built-in coincidence detector.',
      'nuclear NFAT + AP-1 (PMA-induced Fos-Jun) IL-2 / IL-4 / IFN-γ / CD40L transcription':
        'In the nucleus NFAT must partner with AP-1 (Fos/Jun, supplied by the DAG-PKC-Ras arm) to transactivate ' +
        'IL-2, IL-4, IFN-γ, and CD40L. This NFAT/AP-1 requirement enforces that the calcium and Ras arms fire ' +
        'together — productive activation versus the anergy that NFAT alone induces.',
      'cyclosporine + cyclophilin A calcineurin inhibition (drug action)':
        'Cyclosporine first binds the immunophilin cyclophilin A; the cyclosporine-cyclophilin complex then binds ' +
        'and inhibits calcineurin. Blocking calcineurin prevents NFAT dephosphorylation and IL-2 transcription — ' +
        'the basis of its use in transplantation, and of its dose-limiting nephrotoxicity.',
      'tacrolimus + FKBP12 calcineurin inhibition (drug action)':
        'Tacrolimus (FK506) reaches the same target by a parallel route: it binds the immunophilin FKBP12, and the ' +
        'tacrolimus-FKBP12 complex inhibits calcineurin. Two structurally different drugs thus converge on one ' +
        'step — both calcineurin inhibitors — explaining their shared efficacy and overlapping nephro/neurotoxicity.',
    },
  },
  {
    slug: 'vdr_genomic_signaling',
    notes: {
      '7-dehydrocholesterol (skin) + UVB previtamin D₃ → cholecalciferol (D₃)':
        'Vitamin D synthesis starts in skin: UVB photolyzes 7-dehydrocholesterol to previtamin D₃, which thermally ' +
        'isomerizes to cholecalciferol (D₃). Because this step is light-driven, latitude, season, skin ' +
        'pigmentation, and sunscreen all limit it — the basis of widespread vitamin-D insufficiency.',
      'D₃ (skin) / D₂ (diet) 25-OH-D (storage form)':
        'Whether from skin (D₃) or diet (D₂/D₃), vitamin D is first hydroxylated in the liver (CYP2R1) to ' +
        '25-hydroxyvitamin D. This circulating 25-OH-D is the long-lived storage form and the metabolite measured ' +
        'clinically to assess vitamin-D status — it is not yet the active hormone.',
      '25-OH-D 1,25-(OH)₂-D (calcitriol — active)':
        'The activating step is renal 1α-hydroxylation (CYP27B1) of 25-OH-D to 1,25-(OH)₂-D (calcitriol). It is ' +
        'tightly regulated by PTH, phosphate, and FGF23 — making the kidney the gatekeeper that sets ' +
        'active-hormone levels, and the reason renal failure causes calcitriol deficiency.',
      'calcitriol + VDR (cytoplasm) VDR-RXR heterodimer on VDRE':
        'Calcitriol diffuses into cells and binds the vitamin D receptor, a nuclear receptor that heterodimerizes ' +
        'with RXR and docks on vitamin D response elements (VDREs). As a ligand-activated transcription factor, ' +
        'VDR exchanges corepressors for coactivators — the genomic basis for vitamin D’s pleiotropic effects.',
      'VDR-RXR on VDRE (intestine) TRPV6 + calbindin-D9k transcription':
        'In intestine, VDR-RXR induces the calcium-absorption machinery — the apical channel TRPV6 and the ' +
        'cytosolic shuttle calbindin-D9k — driving active transcellular calcium uptake. This is the central ' +
        'calcium-homeostatic action and why severe deficiency causes rickets/osteomalacia.',
      'VDR-RXR on VDRE (bone) RANKL induction (osteoblasts)':
        'In bone, calcitriol induces RANKL on osteoblasts, which drives osteoclast differentiation and bone ' +
        'resorption to mobilize calcium when needed. So vitamin D both absorbs dietary calcium and, paradoxically, ' +
        'can liberate skeletal calcium — its net skeletal effect depends on calcium supply.',
      'VDR-RXR (macrophages) cathelicidin / LL-37 transcription':
        'Beyond mineral metabolism, VDR in macrophages induces the antimicrobial peptide cathelicidin (LL-37) — a ' +
        'key innate-immune output linking vitamin-D status to host defense (notably against M. tuberculosis). This ' +
        'is a major arm of vitamin D’s non-classical, immune-pleiotropic actions.',
      'VDR-RXR CYP24A1 induction (feedback)':
        'Calcitriol limits its own signal by inducing CYP24A1, the 24-hydroxylase that catabolizes both 25-OH-D ' +
        'and calcitriol to inactive metabolites — a negative-feedback brake against vitamin-D toxicity. ' +
        'Loss-of-function CYP24A1 mutations cause infantile hypercalcemia.',
    },
  },
  {
    slug: 'adenosine_receptor_signaling',
    notes: {
      'ATP / ADP (released — stress, ischemia, inflammation) AMP (CD39, ENTPD1)':
        'Extracellular adenosine is generated on demand from released nucleotides: under stress, ischemia, or ' +
        'inflammation, ATP/ADP are dephosphorylated to AMP by the ectoenzyme CD39 (ENTPD1). This flips ATP’s ' +
        'pro-inflammatory “danger” message toward the anti-inflammatory signal that adenosine carries.',
      'AMP adenosine (CD73, NT5E)':
        'The rate-limiting step is CD73 (NT5E), the ecto-5′-nucleotidase that dephosphorylates AMP to adenosine. ' +
        'The CD39→CD73 tandem is a major immune checkpoint — tumors exploit it to generate immunosuppressive ' +
        'adenosine, which is why CD73 and A2A inhibitors are in cancer-immunotherapy trials.',
      'adenosine + A1 (Gi) ↓cAMP → ↓neurotransmitter release + bradycardia':
        'The A1 receptor couples to Gi, lowering cAMP. In heart it slows the SA/AV node (the basis of adenosine’s ' +
        'use to terminate SVT), and in brain it suppresses presynaptic neurotransmitter release — the inhibitory, ' +
        'sedative/anticonvulsant tone that caffeine blocks.',
      'adenosine + A2A (Gs) ↑cAMP → vasodilation + T-cell suppression':
        'The A2A receptor couples to Gs, raising cAMP. It mediates coronary/peripheral vasodilation and potently ' +
        'suppresses T-cell activation — the dominant immunosuppressive adenosine receptor, hence A2A antagonists ' +
        'as cancer immunotherapeutics and the rationale for istradefylline in Parkinson’s.',
      'adenosine + A2B (Gs) mast-cell + inflammatory signaling':
        'The A2B receptor (also Gs, but low-affinity) engages mainly at the high adenosine levels of injured or ' +
        'hypoxic tissue, driving mast-cell and inflammatory signaling. Its low affinity makes it a sensor of ' +
        'pathological — not basal — adenosine, implicated in asthma and inflammatory disease.',
      'adenosine inosine (ADA) or recycled (ENT1/2 → SAH cycle)':
        'Adenosine is cleared by deamination to inosine via adenosine deaminase (ADA), or recycled through ENT1/2 ' +
        'transporters into the intracellular SAH/methionine cycle. ADA deficiency causes a form of SCID — ' +
        'underscoring how toxic adenosine accumulation is to lymphocytes.',
      'caffeine / theophylline A1 + A2A non-selective antagonism':
        'Caffeine and theophylline are non-selective antagonists at A1 and A2A receptors — they block adenosine’s ' +
        'inhibitory tone rather than stimulate directly. This is why their effects (alertness, diuresis, ' +
        'bronchodilation, tachycardia) mirror the opposite of adenosine’s, and why tolerance involves receptor ' +
        'upregulation.',
    },
  },
  {
    slug: 'alzheimer_amyloid_tau_cascade',
    notes: {
      'APP (amyloid precursor protein) Aβ40 + Aβ42 monomers':
        'The cascade begins with sequential cleavage of APP by β- and γ-secretases, releasing amyloid-β peptides. ' +
        'The γ-secretase cut is imprecise, yielding a mix dominated by Aβ40 but including the more hydrophobic, ' +
        'aggregation-prone Aβ42. The Aβ42:Aβ40 ratio — not total Aβ — is the key determinant of disease.',
      'Aβ42 monomers soluble oligomers → protofibrils → fibrils → plaques':
        'Aβ42 self-assembles through soluble oligomers and protofibrils into fibrils that deposit as extracellular ' +
        'plaques. The amyloid cascade hypothesis places this aggregation upstream of tau — though the weak ' +
        'correlation between plaque load and dementia points to soluble species, not plaques, as the toxic agents.',
      'soluble Aβ42 oligomers synaptic dysfunction + LTP impairment':
        'Soluble Aβ42 oligomers (not the insoluble plaques) are the principal synaptotoxic species: they bind ' +
        'synaptic receptors, impair long-term potentiation, and drive synapse loss — the change that best ' +
        'correlates with cognitive decline, and the rationale for antibodies targeting oligomeric/protofibrillar Aβ.',
      'GSK-3β / CDK5 / DYRK1A active tau hyperphosphorylation (Thr231, Ser202, Ser396)':
        'In parallel, kinases including GSK-3β, CDK5, and DYRK1A become dysregulated and hyperphosphorylate tau at ' +
        'sites such as Thr231, Ser202, and Ser396. Hyperphosphorylation detaches tau from microtubules, both ' +
        'destabilizing axonal transport and freeing tau to aggregate.',
      'hyperphosphorylated tau paired helical filaments → neurofibrillary tangles':
        'Detached hyperphosphorylated tau misfolds and assembles into paired helical filaments that accumulate as ' +
        'intraneuronal neurofibrillary tangles. Unlike amyloid, tangle distribution tracks closely with cognitive ' +
        'decline (Braak staging) — the basis of tau PET imaging and tau-targeted therapeutics.',
      'Aβ + tau + neuronal stress microglial activation + complement-mediated synaptic pruning':
        'Aβ, tau, and neuronal stress activate microglia, which drive neuroinflammation and — via complement ' +
        '(C1q/C3) tagging of synapses — pathological synaptic pruning. This immune arm, highlighted by TREM2 and ' +
        'other risk genes, has shifted Alzheimer’s toward a neuroimmune disease model.',
      'sustained neuronal stress synaptic + neuronal loss → cognitive decline':
        'Sustained synaptic dysfunction, tangle burden, and neuroinflammation culminate in synapse and neuron ' +
        'loss, producing progressive cognitive decline. The long preclinical phase — pathology accruing years ' +
        'before symptoms — is the rationale for early biomarker detection and pre-symptomatic intervention.',
    },
  },
  {
    slug: 'parkinson_alpha_synuclein_aggregation',
    notes: {
      'α-synuclein (physiological) misfolded β-sheet conformer':
        'α-Synuclein is normally a soluble presynaptic protein involved in vesicle trafficking. In disease it ' +
        'misfolds from its native state into a β-sheet-rich conformer — the seed of aggregation. Gene ' +
        'multiplication (more protein) and point mutations (faster misfolding) both cause familial Parkinson’s, ' +
        'supporting a causal role.',
      'misfolded α-synuclein soluble oligomers (most toxic species)':
        'Misfolded monomers assemble first into soluble oligomers, now considered the most toxic species — more so ' +
        'than mature deposits. Oligomers permeabilize membranes and disrupt multiple organelles, which is why ' +
        'lowering α-synuclein or blocking oligomer formation (not just clearing fibrils) is a therapeutic aim.',
      'oligomers protofibrils → mature fibrils → Lewy bodies':
        'Oligomers mature through protofibrils into insoluble amyloid fibrils that deposit as Lewy bodies and ' +
        'Lewy neurites — the pathological hallmark of Parkinson’s. Paradoxically, sequestration into Lewy bodies ' +
        'may be partly protective, removing the more toxic soluble oligomers from the cytosol.',
      'misfolded α-synuclein (extracellular) prion-like cell-to-cell templating':
        'Released misfolded α-synuclein is taken up by neighboring neurons, where it templates the misfolding of ' +
        'native protein — a prion-like, self-propagating spread. This mechanism explains the stereotyped, ' +
        'ascending progression of Lewy pathology described in Braak staging.',
      'oligomers (intracellular) mitochondrial dysfunction + ER stress + lysosomal failure':
        'Intracellular oligomers converge on several stress axes: they impair mitochondrial complex I, induce ER ' +
        'stress, and disrupt lysosomal/autophagic clearance (notably via GBA, the strongest common genetic risk ' +
        'factor). Impaired clearance then allows yet more α-synuclein to accumulate — a vicious cycle.',
      'substantia nigra pars compacta neurons progressive loss → striatal DA depletion':
        'This toxicity is selective for the dopaminergic neurons of the substantia nigra pars compacta, whose ' +
        'progressive loss depletes striatal dopamine. Their high energy demand, pacemaking calcium load, and ' +
        'dopamine-derived oxidative stress may explain this particular vulnerability.',
      'striatal DA depletion motor symptoms (bradykinesia, rigidity, tremor)':
        'Striatal dopamine depletion unbalances the basal-ganglia motor circuit, producing the cardinal motor ' +
        'signs — bradykinesia, rigidity, and resting tremor — once ~50-70% of nigral neurons are lost. Dopamine ' +
        'replacement (levodopa) treats these symptoms but does not slow the underlying aggregation.',
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
console.log(`batch C total: ${totalAdded} notes`);
