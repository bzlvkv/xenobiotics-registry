/**
 * Add bdnf_trkb_neurotrophic pathway to registry.
 *
 * Refs (verified via NCBI E-utilities 2026-05-14):
 *   PMID:23254191 — Park H, Poo MM. 2013. Nat Rev Neurosci. "Neurotrophin regulation of neural circuit development and function."
 *   PMID:22407616 — Autry AE, Monteggia LM. 2012. Pharmacol Rev. "BDNF and neuropsychiatric disorders."
 *   PMID:27425886 — Castrén E. 2017. Neurobiol Dis. "BDNF in mood disorders and antidepressant treatments."
 *   PMID:26519901 — Björkholm C, Monteggia LM. 2016. Neuropharmacology. "BDNF — a key transducer of antidepressant effects."
 *   PMID:24120943 — Wrann CD et al. 2013. Cell Metab. "Exercise induces hippocampal BDNF through a PGC-1α/FNDC5 pathway."
 *   PMID:27253067 — Sleiman SF et al. 2016. eLife. "Exercise promotes BDNF expression through β-hydroxybutyrate (HDAC inhibition)."
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NEW_PATHWAY = {
  slug: 'bdnf_trkb_neurotrophic',
  name: 'BDNF / TrkB neurotrophic signaling',
  category: 'signaling',
  systems: ['nervous'],
  description:
    'Brain-derived neurotrophic factor (BDNF) is the principal neurotrophin of the adult mammalian brain — driver of activity-dependent synaptic plasticity (LTP), dendritic arborization, neurogenesis (hippocampal dentate gyrus), and neuronal survival. Synthesized as proBDNF (32 kDa), cleaved by furin/PC1 intracellularly or plasmin/MMP-9 extracellularly to mature BDNF (mBDNF, 14 kDa). mBDNF binds TrkB (high-affinity, Kd ~10 pM) → autophosphorylation → three parallel cascades: (1) Ras → Raf → MEK → ERK1/2 → CREB → gene transcription (positive feedback on BDNF + c-Fos + Arc); (2) PI3K → AKT → mTORC1 → S6K/4E-BP → cap-dependent protein synthesis (synaptic remodeling — the rapid-antidepressant axis hit by ketamine via NMDA-burst → mTOR); (3) PLCγ → IP3/DAG → CaMKII → presynaptic facilitation. ProBDNF preferentially binds p75NTR + sortilin → JNK → apoptosis (counter-regulatory; favored when proBDNF cleavage fails). Activity-dependent transcription: glutamate → NMDA → Ca²⁺ → CaMKIV → CREB; the BDNF promoter is also acetylation-sensitive — HDAC inhibitors (β-hydroxybutyrate, valproate) directly upregulate BDNF (Sleiman 2016). Antidepressant action of SSRIs is largely mediated by chronic BDNF/TrkB upregulation (weeks-scale — molecular basis of delayed onset); ketamine and 5-HT2A psychedelics bypass this delay via direct glutamate/mTOR engagement (Björkholm 2016). PGC-1α/FNDC5/irisin transduces exercise to hippocampal BDNF (Wrann 2013). Val66Met (rs6265) disrupts activity-dependent secretion — reduces LTP, increases anxiety/depression risk. Cross-links: mtor_signaling (PI3K-AKT-mTOR cascade), glutamate_receptor_pharmacology (NMDA-dependent transcription), serotonin_receptor_pharmacology (5-HT2A psychedelic transduction).',
  steps: [
    {
      from: 'BDNF gene (chr 11p14.1)',
      to: 'proBDNF (32 kDa)',
      via: 'CREB-driven transcription (activity-dependent) → ER translation; promoter IV is the activity-responsive exon',
    },
    {
      from: 'proBDNF',
      to: 'mBDNF (14 kDa)',
      via: 'furin / PC1 intracellularly OR plasmin / MMP-9 extracellularly; balance determines TrkB vs p75NTR signaling',
    },
    {
      from: 'mBDNF',
      to: 'TrkB-P (autophosphorylated)',
      via: 'TrkB high-affinity binding (Kd ~10 pM); receptor dimerization → trans-autophosphorylation Y515/Y816',
    },
    {
      from: 'TrkB-P',
      to: 'ERK1/2 → CREB → gene transcription',
      via: 'Ras → Raf → MEK → ERK; positive feedback on BDNF; LTP-associated plasticity genes',
    },
    {
      from: 'TrkB-P',
      to: 'AKT → mTORC1 → cap-dependent translation',
      via: 'PI3K → PDK1/AKT → mTORC1 → S6K + 4E-BP1 phosphorylation; ketamine rapid-antidepressant pathway',
    },
    {
      from: 'TrkB-P',
      to: 'IP3 / DAG → CaMKII',
      via: 'PLCγ activation; presynaptic vesicle release facilitation',
    },
    {
      from: 'proBDNF',
      to: 'JNK → apoptosis',
      via: 'p75NTR + sortilin co-receptor; counter-regulatory branch favored if cleavage fails',
    },
  ],
  modulators: [
    { slug: 'fluoxetine',           effect: 'activator', target: 'BDNF/TrkB (chronic, indirect via 5-HT)',                            note: 'chronic dosing weeks → ↑ hippocampal BDNF; molecular basis of delayed antidepressant response' },
    { slug: 'sertraline',           effect: 'activator', target: 'BDNF/TrkB (chronic)' },
    { slug: 'paroxetine',           effect: 'activator', target: 'BDNF/TrkB (chronic)' },
    { slug: 'citalopram',           effect: 'activator', target: 'BDNF/TrkB (chronic)' },
    { slug: 'escitalopram',         effect: 'activator', target: 'BDNF/TrkB (chronic)' },
    { slug: 'venlafaxine',          effect: 'activator', target: 'BDNF/TrkB (chronic)' },
    { slug: 'duloxetine',           effect: 'activator', target: 'BDNF/TrkB (chronic)' },
    { slug: 'vortioxetine',         effect: 'activator', target: 'BDNF/TrkB (chronic) + 5-HT1A partial + 5-HT3 antag',                note: 'multimodal — pro-cognitive in addition to mood effect' },
    { slug: 'ketamine',             effect: 'activator', target: 'TrkB-mTOR (acute, NMDA-burst)',                                     note: 'rapid (hours) BDNF release + mTOR-dependent synaptogenesis; bypasses chronic-SSRI delay' },
    { slug: 'esketamine',           effect: 'activator', target: 'TrkB-mTOR (acute)',                                                 note: 'S-enantiomer; FDA-approved intranasal (Spravato) for TRD' },
    { slug: 'psilocybin',           effect: 'activator', target: 'TrkB direct + 5-HT2A (psychoplastogen)',                            note: 'recent evidence psilocin binds TrkB directly (Moliner 2023); 5-HT2A axis canonical' },
    { slug: 'lsd',                  effect: 'activator', target: 'TrkB direct + 5-HT2A (psychoplastogen)',                            note: 'similar TrkB direct binding mechanism; long receptor residence time' },
    { slug: 'dmt',                  effect: 'activator', target: '5-HT2A → BDNF (acute)' },
    { slug: 'mdma',                 effect: 'activator', target: 'serotonin-driven BDNF (post-acute)' },
    { slug: 'lithium',              effect: 'activator', target: 'BDNF (via GSK-3β inhibition → CREB)',                               note: 'lithium-induced neurogenesis well-documented; clinical anti-suicidal effect partly BDNF-mediated' },
    { slug: 'valproate',            effect: 'activator', target: 'BDNF (via HDAC inhibition → promoter acetylation)' },
    { slug: 'lamotrigine',          effect: 'activator', target: 'BDNF (modest, chronic)' },
    { slug: 'amitriptyline',        effect: 'activator', target: 'BDNF (chronic) + direct TrkB partial agonist (Jang 2009)' },
    { slug: 'imipramine',           effect: 'activator', target: 'BDNF (chronic)' },
    { slug: 'nortriptyline',        effect: 'activator', target: 'BDNF (chronic)' },
    { slug: 'mirtazapine',          effect: 'activator', target: 'BDNF (chronic, indirect)' },
    { slug: 'trazodone',            effect: 'activator', target: 'BDNF (chronic, modest)' },
    { slug: 'agomelatine',          effect: 'activator', target: 'BDNF (via MT1/MT2 + 5-HT2C antagonism)' },
    { slug: 'bupropion',            effect: 'activator', target: 'BDNF (DA/NE reuptake; chronic)' },
    { slug: 'memantine',            effect: 'activator', target: 'BDNF (chronic NMDA modulation)' },
    { slug: 'beta-hydroxybutyrate', effect: 'activator', target: 'BDNF promoter (HDAC2/3 inhibition)',                                note: 'Sleiman 2016 eLife — exercise-induced BDNF transduced through ketone-body HDAC inhibition' },
    { slug: 'curcumin',             effect: 'activator', target: 'BDNF (chronic; HDAC + 5-HT pathways)' },
    { slug: 'resveratrol',          effect: 'activator', target: 'BDNF (SIRT1 → CREB)' },
    { slug: 'egcg',                 effect: 'activator', target: 'BDNF (anti-inflammatory + CREB)' },
    { slug: 'dha',                  effect: 'activator', target: 'BDNF (membrane fluidity + CREB)' },
    { slug: 'epa',                  effect: 'activator', target: 'BDNF (anti-inflammatory)' },
    { slug: 'lions-mane',           effect: 'activator', target: 'NGF + BDNF (hericenones / erinacines)' },
    { slug: 'bacopa',               effect: 'activator', target: 'BDNF (bacosides; chronic)' },
    { slug: 'ginkgo-biloba',        effect: 'activator', target: 'BDNF (modest; chronic)' },
    { slug: 'rhodiola-rosea',       effect: 'activator', target: 'BDNF (chronic stress models)' },
    { slug: 'ashwagandha',          effect: 'activator', target: 'BDNF (withanolides; HPA axis + direct)' },
    { slug: 'cerebrolysin',         effect: 'activator', target: 'BDNF/NGF-like (peptide mixture from porcine brain)' },
    { slug: 'semax',                effect: 'activator', target: 'BDNF/NGF expression (ACTH(4-10) analog)' },
    { slug: 'selank',               effect: 'activator', target: 'BDNF (tuftsin analog; anxiolytic)' },
    { slug: 'noopept',              effect: 'activator', target: 'BDNF/NGF (dipeptide nootropic; chronic)' },
  ],
  refs: [
    'PMID:23254191',
    'PMID:22407616',
    'PMID:27425886',
    'PMID:26519901',
    'PMID:24120943',
    'PMID:27253067',
  ],
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Array<{ slug: string }>;
  if (data.find((p) => p.slug === NEW_PATHWAY.slug)) {
    console.error(`ALREADY EXISTS: ${NEW_PATHWAY.slug}`);
    process.exit(1);
  }
  data.push(NEW_PATHWAY as never);
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ${NEW_PATHWAY.slug}; total pathways: ${data.length}; modulators: ${NEW_PATHWAY.modulators.length}`);
}

main();
