/**
 * 2026-05-24-signaling-batch-A.ts
 *
 * step.note grind, batch A — 5 canonical pathways, notes-only. Each
 * pathway's existing refs were title-checked via esummary 2026-05-24 and
 * topically ground these notes (no new PMIDs):
 *   p53_mdm2_dna_damage_response   PMID:11747320 (p53 activation review)
 *   ampk_signaling                 PMID:22117616/25456737 (metformin), 14976552 (LKB1)
 *   notch_signaling                PMID:10221902 (Science review), 23729744 (at a glance)
 *   hedgehog_smoothened            PMID:35606054 (2022 review), 9649421 (Transducing Hh)
 *   ferroptosis_gpx4_lipid_peroxidation  PMID:32413317, 26653790 (Trends Cell Biol)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-A.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'p53_mdm2_dna_damage_response',
    notes: {
      'cellular stress (DNA damage, oncogene, hypoxia, ribosomal) ATM/ATR or ARF or RPL5/11 activation':
        'Diverse stresses feed p53 through distinct sensors that converge on its stabilization: DNA double-strand ' +
        'breaks activate ATM/ATR kinases; oncogene-driven hyperproliferation induces ARF (which sequesters MDM2); ' +
        'and impaired ribosome biogenesis frees RPL5/RPL11 to bind MDM2. This sensor multiplicity lets p53 act as ' +
        'a central integrator of cellular damage.',
      'ATM/ATR phosphorylation of p53 Ser15/Ser20 + MDM2 disrupted p53-MDM2 binding → p53 stabilization':
        'Normally the E3 ligase MDM2 keeps p53 low by constant ubiquitination/degradation (half-life minutes). ' +
        'ATM/ATR phosphorylation of p53 (Ser15/20) and of MDM2 disrupts their binding, so p53 escapes degradation ' +
        'and accumulates within hours. This brake is exploited by MDM2 antagonists (nutlins) that reactivate ' +
        'wild-type p53.',
      'stabilized p53 tetramerization + DNA binding at p53-RE':
        'Stabilized p53 assembles into tetramers and binds p53 response elements as a sequence-specific ' +
        'transcription factor. Most cancer-associated TP53 mutations are missense changes in the DNA-binding ' +
        'domain that cripple this step — making p53 the most frequently mutated gene in human cancer.',
      'p53 transcriptional output p21 + MDM2 + PUMA/BAX + GADD45 + p53R2':
        'Active p53 transactivates a program spanning opposing fates: p21 (CDKN1A) for cell-cycle arrest, ' +
        'PUMA/BAX for apoptosis, GADD45 and p53R2 for repair, and MDM2 for negative feedback. The balance of ' +
        'these targets — tuned by p53 levels, modifications, and cofactors — decides whether a cell pauses, dies, ' +
        'or senesces.',
      'low / transient damage p21 → reversible G1/G2 arrest → repair':
        'With low or transient damage, p21 inhibits CDKs to impose a reversible G1/G2 arrest, giving time for ' +
        'repair before cells re-enter the cycle — the pro-survival outcome. p21 is the principal effector linking ' +
        'p53 to the cell-cycle machinery.',
      'persistent moderate stress senescence (p21 + p16-cyclin)':
        'Persistent moderate stress tips the outcome toward senescence — a permanent arrest enforced by p21 plus ' +
        'the p16-cyclin/Rb axis and accompanied by the senescence-associated secretory phenotype (SASP). This is ' +
        'a potent tumor-suppressive barrier that also contributes to aging.',
      'high / unrepairable damage BAX / PUMA → mitochondrial apoptosis':
        'High or unrepairable damage drives p53 toward pro-apoptotic targets (BAX, PUMA), which engage the ' +
        'mitochondrial (intrinsic) apoptosis pathway — committing the cell to death rather than risking ' +
        'propagation of a damaged genome.',
    },
  },
  {
    slug: 'ampk_signaling',
    notes: {
      '↑AMP/ATP + ↑ADP/ATP ratios AMPK-γ AMP binding':
        'AMPK is the cell’s energy gauge: a rise in AMP/ATP (and ADP/ATP) — from exercise, hypoxia, glucose ' +
        'deprivation, or mitochondrial poisoning — signals low energy charge. AMP/ADP binding to the regulatory ' +
        'γ-subunit CBS domains is the trigger that allosterically activates the kinase and protects its activating ' +
        'phosphorylation from removal.',
      'AMPK-γ AMP-bound AMPK-α Thr172 phosphorylation':
        'AMP/ADP binding promotes phosphorylation of the catalytic α-subunit at Thr172. The constitutive upstream ' +
        'kinase LKB1 supplies this in most tissues (its loss causes Peutz-Jeghers syndrome), while CaMKKβ provides ' +
        'a Ca²⁺-dependent route. AMPK is also activated indirectly by metformin via mild complex-I inhibition.',
      'AMPK active ACC1 / ACC2 phosphorylation → inhibition':
        'Active AMPK phosphorylates and inhibits acetyl-CoA carboxylase (ACC1/2), lowering malonyl-CoA. Less ' +
        'malonyl-CoA relieves inhibition of CPT1, so fatty acids enter mitochondria for β-oxidation — switching ' +
        'the cell from lipid synthesis to lipid burning, the core of AMPK’s catabolic-over-anabolic logic.',
      'AMPK active TSC2 + Raptor phosphorylation':
        'AMPK restrains growth by phosphorylating TSC2 (activating it) and Raptor — both inhibit mTORC1. The ' +
        'result is reduced protein/lipid synthesis and de-repressed autophagy, directly opposing the anabolic ' +
        'mTOR program when energy is scarce.',
      'AMPK active ULK1 phosphorylation':
        'AMPK also activates autophagy directly by phosphorylating ULK1 at activating sites — a switch normally ' +
        'held off by mTORC1’s inhibitory phosphorylation of the same kinase. So AMPK promotes autophagy on two ' +
        'fronts: turning ULK1 on and turning its repressor mTORC1 off.',
      'AMPK active PGC-1α phosphorylation + SIRT1 NAD+ generation':
        'For the longer-term response, AMPK phosphorylates PGC-1α and raises NAD⁺ to activate SIRT1, driving ' +
        'mitochondrial biogenesis and an oxidative gene program — adapting capacity to chronic energy demand. ' +
        'This underlies much of the metabolic benefit of endurance exercise.',
      'AMPK active (muscle) TBC1D1 / TBC1D4 phosphorylation → GLUT4 translocation':
        'In muscle, AMPK phosphorylates the Rab-GAPs TBC1D1/TBC1D4 to trigger GLUT4 translocation, raising glucose ' +
        'uptake independently of insulin. This insulin-independent route is why exercise (and AMPK activation) ' +
        'improves glycemia even in insulin resistance.',
    },
  },
  {
    slug: 'notch_signaling',
    notes: {
      'DSL ligand (Delta/Jagged) on signal-sending cell Notch receptor extracellular domain on adjacent cell':
        'Notch is a juxtacrine system: a DSL ligand (Delta or Jagged) on one cell engages the Notch receptor on ' +
        'the touching neighbor — signaling needs direct cell-cell contact. Ligand endocytosis generates a ' +
        'mechanical pulling force that exposes the receptor’s cleavage site, while ligand on the same cell instead ' +
        'causes cis-inhibition.',
      'Notch-ligand engagement S2 cleavage by ADAM10/17 (TACE)':
        'Ligand pulling exposes Notch’s negative regulatory region to the ADAM10/17 (TACE) metalloproteases, which ' +
        'make the S2 cut that sheds the extracellular domain. This primes the remaining membrane-bound fragment as ' +
        'a substrate for the next, intramembrane cleavage.',
      'S2-cleaved Notch S3 cleavage by γ-secretase → NICD release':
        'γ-secretase (presenilin-1/2 + nicastrin + APH-1 + PEN-2) makes the S3 cut within the membrane, releasing ' +
        'the Notch intracellular domain (NICD). This is the same protease that processes APP — so γ-secretase ' +
        'inhibitors developed for Alzheimer’s also block Notch, causing characteristic GI/skin toxicity.',
      'NICD (cytoplasmic) nuclear translocation → CSL binding':
        'Free NICD translocates to the nucleus and binds the DNA-binding factor CSL (RBP-Jκ), converting it from a ' +
        'repressor to an activator by displacing corepressors (CIR/SMRT) and recruiting the coactivator MAML and ' +
        'p300. Notch is thus a membrane receptor that doubles as a direct transcriptional regulator.',
      'NICD-CSL-MAML on enhancer HES / HEY transcription':
        'The NICD-CSL-MAML complex drives the bHLH repressors of the HES/HEY families, which block differentiation ' +
        'genes and maintain progenitor/stem states. This output underlies lateral inhibition — neighboring cells ' +
        'adopting distinct fates — and binary cell-fate decisions throughout development.',
      'NICD ubiquitination (FBXW7) proteasomal degradation':
        'Notch signaling is non-catalytic and self-limiting: each receptor is cleaved once and consumed, and ' +
        'nuclear NICD is rapidly phosphorylated and targeted by the FBXW7 ubiquitin ligase for degradation ' +
        '(half-life minutes). Sustained signaling therefore needs continuous ligand engagement — and FBXW7 loss ' +
        'is oncogenic.',
    },
  },
  {
    slug: 'hedgehog_smoothened',
    notes: {
      'no SHH — PTCH1 active SMO tonically inhibited':
        'In the resting (OFF) state the receptor PTCH1 keeps the transducer SMO inactive — catalytically pumping ' +
        'sterols to deny SMO its activating ligand and keeping it out of the primary cilium. That cilium is the ' +
        'essential compartment where vertebrate Hedgehog transduction is organized.',
      'GLI3 / GLI2 cytoplasm GLI-Rep (cleaved repressor)':
        'Without signal, a SUFU/KIF7/PKA/GSK-3β/CK1 complex (functionally analogous to Wnt’s destruction complex) ' +
        'processes the GLI transcription factors (GLI2/3) into truncated repressor forms (GLI-Rep) that actively ' +
        'silence target genes — so the default Hedgehog output is repression, not merely the absence of activation.',
      'SHH ligand PTCH1 binding + internalization':
        'The SHH ligand is dually lipid-modified (N-palmitoylated and C-cholesterol-modified), which controls its ' +
        'release and multimeric spread. SHH binding to PTCH1 triggers their internalization, removing PTCH1’s ' +
        'inhibition of SMO. Sterol/cholesterol handling is therefore central to the pathway — and a drug-target node.',
      'PTCH1 internalized SMO derepression + ciliary accumulation':
        'With PTCH1 internalized, SMO is derepressed and accumulates in the primary cilium, activated by a shift ' +
        'in ciliary oxysterols/cholesterol. SMO is the target of the approved antagonists vismodegib and sonidegib ' +
        '(basal-cell carcinoma) — and the natural teratogen cyclopamine acts here.',
      'SMO active GLI dissociation from SUFU → nuclear':
        'Active ciliary SMO blocks SUFU-mediated processing, so full-length GLI escapes as the activator form ' +
        '(GLI-Act) and enters the nucleus. The net GLI-Act vs GLI-Rep ratio — not a simple on/off — encodes the ' +
        'strength and duration of the signal, allowing morphogen-gradient readout.',
      'GLI-Act (nucleus) PTCH1 (feedback), GLI1, BCL2, cyclin D, FOXM1 transcription':
        'Nuclear GLI-Act transcribes proliferation/survival genes (cyclin D, BCL2, FOXM1), the amplifier GLI1 ' +
        '(positive feedback), and PTCH1 itself (negative feedback that limits the response). Inappropriate ' +
        'reactivation drives basal-cell carcinoma and medulloblastoma — the rationale for SMO/GLI-targeted therapy.',
    },
  },
  {
    slug: 'ferroptosis_gpx4_lipid_peroxidation',
    notes: {
      'labile-iron pool (Fe²⁺) + H₂O₂ Fenton •OH radical':
        'Ferroptosis is iron-dependent: the labile Fe²⁺ pool reacts with peroxide via Fenton chemistry to ' +
        'generate the hydroxyl radical (•OH), which initiates lipid radical chains. This iron requirement is why ' +
        'iron chelators block ferroptosis and why iron-loaded or rapidly proliferating cells are especially ' +
        'vulnerable.',
      'PUFA-CoA PE-PUFA (membrane phospholipid)':
        'Ferroptosis needs a specific lipid substrate: ACSL4 and LPCAT3 esterify polyunsaturated fatty acids ' +
        '(arachidonic/adrenic acid) into membrane phosphatidylethanolamine. Those PUFA double bonds are the ' +
        'oxidizable fuel — so ACSL4-low cells are ferroptosis-resistant, and membrane PUFA content tunes ' +
        'sensitivity.',
      'PE-PUFA + •OH PE-PUFA-OOH (lipid hydroperoxide)':
        'The membrane PUFA-PE is oxidized to lipid hydroperoxides (PE-PUFA-OOH) — both by radical autoxidation and ' +
        'enzymatically by 15-lipoxygenase (ALOX15). Once started the chain self-propagates: each peroxyl radical ' +
        'abstracts another bis-allylic hydrogen, spreading damage across the bilayer.',
      'PE-PUFA-OOH + 2 GSH PE-PUFA-OH + GSSG':
        'The master defense is GPX4, a selenocysteine glutathione peroxidase that reduces lethal lipid ' +
        'hydroperoxides to harmless alcohols using two GSH. Direct GPX4 inhibition (RSL3) forces ferroptosis, and ' +
        'GPX4’s selenium requirement ties the pathway to selenium status and the wider antioxidant network.',
      'extracellular cystine intracellular cysteine → GSH':
        'GPX4 needs glutathione, whose synthesis is cysteine-limited. The cystine/glutamate antiporter system xc⁻ ' +
        '(SLC7A11/xCT) imports cystine for conversion to cysteine; blocking it (erastin, sulfasalazine, or ' +
        'glutamate excess) starves GSH synthesis and triggers ferroptosis — the classic indirect route to GPX4 ' +
        'failure.',
      'CoQ10 + FSP1 (AIFM2) CoQ10H₂ (reduced) at plasma membrane':
        'A parallel, GPX4-independent guard works at the plasma membrane: FSP1 (AIFM2) regenerates reduced CoQ10 ' +
        '(ubiquinol), a lipophilic radical-trapping antioxidant. This axis explains why some cells resist GPX4 ' +
        'inhibition — so the GPX4/GSH and FSP1/CoQ10 systems jointly set the ferroptotic threshold.',
      'PE-PUFA-OOH (unreduced) membrane disruption → ferroptotic cell death':
        'If hydroperoxides outpace these defenses, accumulating oxidized lipids and their reactive breakdown ' +
        'products (e.g. 4-HNE) rupture membrane integrity, producing the characteristic ferroptotic morphology ' +
        '(shrunken mitochondria with dense cristae). Lipid peroxidation is thus both trigger and executioner.',
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
console.log(`batch A total: ${totalAdded} notes`);
