/**
 * 2026-05-24-signaling-batch-H.ts
 *
 * step.note grind, batch H — 6 pathways, notes-only. Refs title-checked
 * via esummary 2026-05-24; all topically ground these notes:
 *   fxr_tgr5_bile_acid_receptor   PMID:23395169 (Cell Metab), 29018272 (NRGH)
 *   purinergic_p2x_p2y_signaling  PMID:33444568, 15078211 (P2 receptors)
 *   complement_cascade            PMID:11287977/11297706 (NEJM), 20720586 (Nat Immunol)
 *   cell_cycle_cdk                PMID:19238148 (Nat Rev Cancer)
 *   camp_pka_second_messenger     PMID:23043438 (AKAP), 12209131 (NRMCB)
 *   autophagy_lc3_axis            PMID:18006683 (Genes Dev, Mizushima)
 * NOTE: camp step "adenylate-cyclase-activation -> adenylate-cyclase-activation"
 *   is a self-loop data smell (flagged for restructuring) — intentionally
 *   not annotated here.
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-H.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'fxr_tgr5_bile_acid_receptor',
    notes: {
      'cholesterol primary bile acids (cholic + chenodeoxycholic)':
        'Bile-acid synthesis is the major route of cholesterol catabolism: the liver converts cholesterol to the ' +
        'primary bile acids cholic and chenodeoxycholic acid, the rate-limiting enzyme being CYP7A1 (classic ' +
        'pathway). This is quantitatively the body’s main way to dispose of cholesterol, and it is ' +
        'feedback-regulated by FXR.',
      'primary BAs (taurine/glycine conjugated) secondary BAs (DCA, LCA, UDCA)':
        'Conjugated to taurine or glycine for solubility, primary bile acids are deconjugated and dehydroxylated ' +
        'by gut bacteria into secondary bile acids (deoxycholic, lithocholic, ursodeoxycholic). This microbial ' +
        'transformation shapes the bile-acid pool — making the microbiome a regulator of host bile-acid ' +
        'signaling, and a route by which antibiotics alter it.',
      'CDCA (or OCA) binding FXR-LBD FXR-RXR heterodimer on FXRE':
        'Bile acids are signaling molecules, not just detergents: chenodeoxycholic acid (and the drug obeticholic ' +
        'acid, OCA) is the endogenous agonist of the nuclear receptor FXR, which heterodimerizes with RXR on FXR ' +
        'response elements. FXR is the master sensor that feedback-regulates bile-acid synthesis, transport, and ' +
        'metabolism.',
      'FXR active (intestine) FGF15/19 secretion → liver FGFR4/βKlotho':
        'In the intestine, FXR induces FGF15 (mouse)/FGF19 (human), a hormone that travels to the liver and ' +
        'signals through FGFR4/βKlotho to repress CYP7A1 — the endocrine arm of bile-acid feedback. FGF19 analogs ' +
        'are in trials for cholestatic and metabolic liver disease.',
      'FXR active (liver) SHP induction → LRH-1 / HNF4α repression':
        'In the liver, FXR induces the atypical nuclear receptor SHP, which represses LRH-1 and HNF4α to shut down ' +
        'CYP7A1 — the intracellular arm of negative feedback. Together the intestinal FGF19 and hepatic SHP arms ' +
        'keep bile-acid synthesis matched to need; FXR agonists exploit this in cholestasis and MASH.',
      'LCA / DCA binding TGR5 Gs → cAMP → PKA':
        'Bile acids also act through a membrane GPCR, TGR5 (GPBAR1), preferentially bound by the secondary bile ' +
        'acids lithocholic and deoxycholic acid. TGR5 couples to Gs to raise cAMP and activate PKA — a non-genomic ' +
        'bile-acid signal distinct from FXR, mediating metabolic and anti-inflammatory effects across tissues.',
      'TGR5 (L-cell) GLP-1 secretion':
        'A key TGR5 action is on intestinal L-cells, where bile acids stimulate secretion of the incretin GLP-1 — ' +
        'linking bile-acid delivery after a meal to insulin secretion and appetite. This is one mechanism by ' +
        'which bile-acid signaling (and bariatric surgery, which raises bile acids) improves glucose metabolism.',
    },
  },
  {
    slug: 'purinergic_p2x_p2y_signaling',
    notes: {
      'cellular ATP (regulated release or stress) extracellular ATP / ADP / UTP / UDP':
        'ATP is not only an intracellular energy currency but an extracellular signal: it is released by regulated ' +
        'exocytosis, through pannexin/connexin channels, or by leakage from damaged cells. Extracellular ' +
        'ATP/ADP/UTP/UDP thus act as an activity/“danger” signal — high in injury, inflammation, and at synapses.',
      'extracellular ATP P2X1–7 (ionotropic) Ca²⁺/Na⁺ influx':
        'P2X receptors (P2X1-7) are ATP-gated ion channels — fast, ionotropic signaling that admits Ca²⁺ and Na⁺ ' +
        'to depolarize the cell. Being directly ATP-gated, they mediate rapid responses such as sensory (pain) ' +
        'signaling and smooth-muscle contraction, distinct from the slower GPCR arm.',
      'extracellular ATP / ADP / UTP / UDP P2Y1/2/4/6/11/12/13/14 (metabotropic GPCRs)':
        'P2Y receptors are metabotropic GPCRs activated by ATP, ADP, UTP, or UDP, signaling through Gq or Gi to ' +
        'second messengers. This slower, amplified arm covers platelet aggregation, vascular tone, and ' +
        'secretion — and its nucleotide selectivity across subtypes gives subtype-specific pharmacology.',
      'ATP ADP':
        'Extracellular ATP is rapidly hydrolyzed to ADP by ectonucleotidases (CD39/NTPDases). This both terminates ' +
        'ATP signaling and generates ADP — itself an agonist at P2Y receptors (notably platelet P2Y12) — so the ' +
        'enzymatic cascade actively reshapes which receptors are engaged over time.',
      'AMP adenosine':
        'Further dephosphorylation by CD73 converts AMP to adenosine, switching signaling from the ' +
        'pro-inflammatory P2 (ATP) system to the largely anti-inflammatory P1 (adenosine receptor) system. This ' +
        'CD39-CD73 relay is a key immunoregulatory checkpoint linking purinergic to adenosine signaling.',
      'P2X7 sustained activation (macrophage) NLRP3 inflammasome priming + pore formation':
        'Sustained P2X7 activation by the high ATP at sites of cell death is a major danger signal in macrophages: ' +
        'it provides “signal 2” for NLRP3 inflammasome activation and, with prolonged stimulation, forms a large ' +
        'membrane pore. P2X7 thus couples extracellular ATP to IL-1β-driven inflammation — a drug target.',
      'P2Y12 antagonist (Rx) platelet aggregation inhibition':
        'The platelet ADP receptor P2Y12 is the target of major antiplatelet drugs (clopidogrel, prasugrel, ' +
        'ticagrelor): blocking it inhibits ADP-amplified platelet aggregation. This is among the most clinically ' +
        'important purinergic interventions, central to preventing arterial thrombosis after stenting and ACS.',
    },
  },
  {
    slug: 'complement_cascade',
    notes: {
      'pattern-recognition c3-convertase':
        'Complement activation converges on forming a C3 convertase, triggered by three routes: the classical ' +
        'pathway (antibody-antigen via C1q), the lectin pathway (MBL/ficolins recognizing microbial sugars), and ' +
        'the alternative pathway (spontaneous C3 tick-over amplified on unprotected surfaces). Pattern recognition ' +
        'thus funnels diverse triggers into one cascade.',
      'c3-convertase c3a-c3b':
        'The C3 convertase cleaves C3 into C3a and C3b — the central amplification step of the system. C3a is an ' +
        'anaphylatoxin (inflammation, mast-cell activation), while C3b opsonizes the target for phagocytosis and ' +
        'seeds more convertase (positive feedback) — which is why C3 is the cascade’s hub.',
      'c3b c5-convertase':
        'Deposited C3b joins the convertase to form the C5 convertase, shifting the cascade from amplification to ' +
        'terminal activation. This step couples opsonization to the membrane-attack phase and is a key regulatory ' +
        'checkpoint — the target of anti-C5 therapy (eculizumab) in PNH and aHUS.',
      'c5-convertase mac-c5b-9':
        'C5 convertase cleaves C5; C5a is a potent anaphylatoxin/chemoattractant, and C5b nucleates assembly of ' +
        'C6-C9 into the membrane attack complex (MAC, C5b-9). The MAC punches lytic pores in target membranes — ' +
        'killing gram-negative bacteria, and when dysregulated, damaging host cells.',
    },
  },
  {
    slug: 'cell_cycle_cdk',
    notes: {
      'mitogen-signaling cyclin-d-cdk4-6':
        'Mitogenic growth-factor signaling (via Ras-ERK and PI3K) induces D-type cyclins, which partner with ' +
        'CDK4/6 to form the first active kinase of the cycle. This makes cyclin D-CDK4/6 the node that links ' +
        'extracellular growth signals to the cell-cycle machinery — and the target of CDK4/6 inhibitors ' +
        '(palbociclib) in breast cancer.',
      'cyclin-d-cdk4-6 rb-phosphorylation':
        'Cyclin D-CDK4/6 begins phosphorylating the retinoblastoma protein (Rb). Hypophosphorylated Rb is the ' +
        'brake on the cycle, so phosphorylating it starts to release that brake. Loss of Rb or its regulation is ' +
        'one of the most common lesions in cancer, removing this key restriction on proliferation.',
      'rb-phosphorylation e2f-release':
        'Once Rb is hyperphosphorylated (completed by cyclin E-CDK2), it releases the E2F transcription factors it ' +
        'had been sequestering. This is the molecular basis of the restriction point — after it the cell is ' +
        'committed to divide independent of mitogens, the cycle’s key irreversible decision.',
      'e2f-release s-phase-entry':
        'Freed E2F transcribes the genes needed for S phase — DNA-synthesis enzymes, replication factors, and ' +
        'cyclin E (positive feedback) — driving entry into DNA replication. This couples the Rb/E2F switch ' +
        'directly to genome duplication, the point of no return into the cycle.',
    },
  },
  {
    slug: 'camp_pka_second_messenger',
    notes: {
      'gs-coupled-receptor-activation adenylate-cyclase-activation':
        'Many hormones and neurotransmitters act through Gs-coupled receptors, whose activated Gαs subunit ' +
        'stimulates adenylate cyclase. This is the canonical start of cAMP signaling — the step locked on by ' +
        'cholera toxin and opposed by Gi-coupled receptors, so the cell’s cAMP level reflects a balance of inputs.',
      'adenylate-cyclase-activation pka-activation':
        'Adenylate cyclase converts ATP to the second messenger cAMP, which rises rapidly and is degraded by ' +
        'phosphodiesterases (PDEs). cAMP’s main effector is protein kinase A: cAMP binding to PKA’s regulatory ' +
        'subunits frees the active catalytic subunits. PDE inhibitors (caffeine, the sildenafil class) act by ' +
        'raising cyclic-nucleotide levels here.',
      'pka-activation creb-phosphorylation':
        'Active PKA phosphorylates many targets, including the transcription factor CREB (Ser133), which recruits ' +
        'CBP/p300 to drive cAMP-responsive genes. This is how a transient membrane signal reaches the nucleus to ' +
        'change gene expression — and AKAP scaffolds localize PKA to give the signaling spatial specificity.',
    },
  },
  {
    slug: 'autophagy_lc3_axis',
    notes: {
      'nutrient-stress-or-rapamycin ulk1-activation':
        'Macroautophagy is triggered by nutrient stress: when nutrients/growth factors are scarce, mTORC1 (its ' +
        'main inhibitor) switches off and AMPK switches on, jointly activating the ULK1 kinase complex. Rapamycin ' +
        'mimics starvation by inhibiting mTORC1 — the classic pharmacologic autophagy inducer.',
      'ulk1-activation phagophore-nucleation':
        'Active ULK1 nucleates the phagophore by activating the class-III PI3K (VPS34/Beclin-1) complex, ' +
        'generating PI3P on a nascent membrane to recruit the downstream machinery. This nucleation step commits a ' +
        'patch of membrane to becoming an autophagosome and is where many autophagy regulators act.',
      'phagophore-nucleation autophagosome':
        'The phagophore elongates and closes around cargo, driven by two ubiquitin-like conjugation systems ' +
        '(ATG12-ATG5 and the LC3 lipidation that yields membrane-bound LC3-II). LC3-II marks autophagosomes, and ' +
        'cargo receptors like p62/SQSTM1 link ubiquitinated cargo to LC3 for selective autophagy.',
      'autophagosome lysosomal-degradation':
        'The completed autophagosome fuses with a lysosome, whose acid hydrolases degrade the engulfed contents; ' +
        'the breakdown products are recycled to the cytosol. This step recycles nutrients during starvation and ' +
        'clears damaged organelles and aggregates — its failure contributes to neurodegeneration and aging.',
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
console.log(`batch H total: ${totalAdded} notes`);
