/**
 * 2026-05-24-signaling-batch-D.ts
 *
 * step.note grind, batch D — 5 pathways, notes-only. Existing refs
 * title-checked via esummary 2026-05-24 and topically ground these notes:
 *   bdnf_trkb_neurotrophic        PMID:23254191 (Nat Rev Neurosci) +5 BDNF reviews
 *   glutaminolysis_tca_anaplerosis  PMID:27492215 (Krebs-to-clinic), 18032601
 *   hepcidin_ferroportin_iron_regulation  PMID:24137020 (Physiol Rev), 16848710
 *   estrogen_receptor_genomic_nongenomic  PMID:31749762, 12927427, 19783454
 *   brown_adipose_thermogenesis_ucp1  PMID:14715917 (Physiol Rev BAT), 31774114
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-D.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'bdnf_trkb_neurotrophic',
    notes: {
      'BDNF gene (chr 11p14.1) proBDNF (32 kDa)':
        'The BDNF gene (11p14.1) has multiple promoters and 5′ exons spliced to a common coding exon, allowing ' +
        'tissue- and activity-specific expression. The common Val66Met prodomain polymorphism impairs ' +
        'activity-dependent BDNF secretion and is linked to memory and mood phenotypes. Translation yields the ' +
        '32-kDa precursor proBDNF.',
      'proBDNF mBDNF (14 kDa)':
        'proBDNF is cleaved (by furin/proconvertases intracellularly or plasmin/MMPs extracellularly) to the ' +
        '14-kDa mature BDNF. This is a regulatory switch, not mere processing: proBDNF and mBDNF have opposing ' +
        'actions, so the balance of cleavage decides whether the signal promotes survival or synaptic pruning.',
      'mBDNF TrkB-P (autophosphorylated)':
        'Mature BDNF binds its high-affinity receptor TrkB, driving dimerization and trans-autophosphorylation of ' +
        'cytoplasmic tyrosines. These phosphotyrosines are docking sites that launch three downstream cascades — ' +
        'the basis for BDNF’s roles in neuronal survival, synaptic plasticity, and the structural changes ' +
        'underlying learning.',
      'TrkB-P ERK1/2 → CREB → gene transcription':
        'Phospho-TrkB recruits Shc/Grb2/SOS to activate Ras-ERK1/2, which phosphorylates CREB to transcribe ' +
        'plasticity/survival genes (including BDNF itself — a positive-feedback loop). This ERK-CREB arm is ' +
        'central to long-term potentiation and to the delayed gene-expression program of antidepressant action.',
      'TrkB-P AKT → mTORC1 → cap-dependent translation':
        'A second arm activates PI3K-AKT, which relieves mTORC1 inhibition to drive cap-dependent local protein ' +
        'synthesis at synapses. This rapid, transcription-independent translation supplies proteins for ' +
        'dendritic-spine remodeling — the arm implicated in the fast antidepressant effect of ketamine via ' +
        'BDNF-TrkB-mTOR.',
      'TrkB-P IP3 / DAG → CaMKII':
        'The third arm runs through PLCγ to IP3/DAG, raising intracellular Ca²⁺ and activating CaMKII (and PKC). ' +
        'This calcium arm couples BDNF to the same kinases that read synaptic activity, directly modulating LTP ' +
        'and glutamatergic transmission — tying neurotrophic signaling to moment-to-moment plasticity.',
      'proBDNF JNK → apoptosis':
        'Opposing the survival signals, uncleaved proBDNF binds the p75NTR/sortilin complex to activate JNK and ' +
        'pro-apoptotic signaling. So one gene yields antagonistic ligands — mBDNF/TrkB for survival and ' +
        'plasticity, proBDNF/p75 for apoptosis and LTD — a yin-yang that sculpts neural circuits.',
    },
  },
  {
    slug: 'glutaminolysis_tca_anaplerosis',
    notes: {
      'extracellular glutamine cytoplasmic glutamine':
        'Glutamine is the most abundant blood amino acid, and many proliferating cells are “glutamine-addicted”, ' +
        'importing it via transporters such as ASCT2/SLC1A5. This MYC-driven uptake is often rate-limiting — ' +
        'which is why ASCT2 inhibition starves glutamine-dependent tumors and is being pursued therapeutically.',
      'glutamine glutamate + NH₃':
        'The committed step is deamidation by glutaminase (GLS) to glutamate plus ammonia. GLS is ' +
        'transcriptionally driven by MYC and is the principal anticancer target of this pathway — the inhibitor ' +
        'CB-839 (telaglenastat) blocks it. The released ammonia can itself act as an autophagy and signaling cue.',
      'glutamate α-ketoglutarate + NH₃':
        'Glutamate is oxidatively deaminated to α-ketoglutarate by glutamate dehydrogenase, releasing a second ' +
        'ammonia and generating NAD(P)H. This route dominates when amino-nitrogen is to be disposed of, linking ' +
        'glutamine catabolism to cellular redox balance and nitrogen economy.',
      'glutamate α-ketoglutarate + amino-acceptor':
        'Alternatively, transaminases convert glutamate to α-ketoglutarate while transferring its amino group to a ' +
        'keto-acid acceptor (making alanine or aspartate). This route lets the carbon enter the TCA cycle while ' +
        'the nitrogen is exported into other amino acids — the biosynthetic, rather than disposal, mode.',
      'α-ketoglutarate TCA-derived citrate (lipid synthesis precursor)':
        'α-Ketoglutarate is the key anaplerotic input that refills the TCA cycle, replacing intermediates siphoned ' +
        'for biosynthesis. Its citrate can be exported and cleaved to acetyl-CoA for fatty-acid synthesis — and ' +
        'under hypoxia α-KG runs the cycle in reverse (reductive carboxylation) to make lipids, a hallmark of ' +
        'cancer metabolism.',
      'glutamine glucosamine-6-phosphate':
        'Glutamine also feeds the hexosamine biosynthesis pathway: its amide nitrogen is donated (by GFAT) to make ' +
        'glucosamine-6-phosphate, precursor of UDP-GlcNAc. This couples nutrient availability to protein ' +
        'glycosylation and O-GlcNAc signaling — a sensor linking metabolism to growth-factor signaling.',
      'glutamine purine + pyrimidine N donor':
        'Beyond energy, glutamine is a major nitrogen donor for nucleotide synthesis, contributing amide nitrogen ' +
        'to both the purine and pyrimidine rings. This biosynthetic demand is why rapidly dividing cells need so ' +
        'much glutamine — to build DNA/RNA, not merely to make ATP.',
    },
  },
  {
    slug: 'hepcidin_ferroportin_iron_regulation',
    notes: {
      'BMP6 (sinusoidal endothelium) + Tf-Fe via TfR2/HFE hepatocyte SMAD1/5/8 + BMPR → HAMP transcription':
        'Hepcidin, the master iron hormone, is made by hepatocytes under the iron-sensing BMP/SMAD pathway: BMP6 ' +
        'from liver sinusoidal endothelium (rising with iron) plus transferrin-iron read through TfR2/HFE activate ' +
        'SMAD1/5/8 to transcribe HAMP. This is the circuit that mutations in HFE/TfR2/HJV break in hereditary ' +
        'hemochromatosis.',
      'IL-6 (inflammation) STAT3 → HAMP transcription':
        'Inflammation overrides iron sensing: IL-6 activates STAT3 to induce hepcidin independently of iron ' +
        'stores. The resulting iron sequestration starves pathogens but, when chronic, produces the anemia of ' +
        'inflammation/chronic disease — a maladaptive consequence of an innate-immune defense.',
      'EPO → erythroblast ERFE secretion BMP6 antagonism → ↓HAMP':
        'Erythropoiesis suppresses hepcidin so iron can be mobilized for new red cells: EPO drives erythroblasts ' +
        'to secrete erythroferrone (ERFE), which antagonizes BMP signaling to lower HAMP. This “erythroid ' +
        'regulator” explains the low hepcidin and iron overload of β-thalassemia and other expanded-erythropoiesis ' +
        'states.',
      'hepcidin ferroportin binding + internalization':
        'Hepcidin acts by binding ferroportin — the only known cellular iron exporter — triggering its ' +
        'internalization and degradation. So hepcidin controls iron not by entering cells but by closing the ' +
        'single gate through which iron leaves them; the hepcidin-ferroportin axis is the master switch of ' +
        'systemic iron flux.',
      'enterocyte ferroportin down ↓iron absorption (mucosal trap)':
        'When hepcidin lowers ferroportin on duodenal enterocytes, dietary iron taken up at the apical surface ' +
        'cannot be exported to blood and is lost as the cell is shed — the “mucosal block”. This is how hepcidin ' +
        'sets the rate of dietary iron absorption to match body needs.',
      'macrophage ferroportin down RES iron sequestration':
        'Hepcidin also closes ferroportin on macrophages, trapping the iron they recover from senescent red cells ' +
        '(the largest daily iron flux). In inflammation this reticuloendothelial sequestration withholds iron from ' +
        'plasma — protective against microbes but a key cause of the anemia of chronic disease.',
    },
  },
  {
    slug: 'estrogen_receptor_genomic_nongenomic',
    notes: {
      'androstenedione + testosterone estrone + estradiol (E2)':
        'Estrogens are synthesized from androgens by aromatase (CYP19A1), which converts androstenedione to ' +
        'estrone and testosterone to the most potent estrogen, 17β-estradiol (E2). Because this final step is ' +
        'aromatase-dependent, aromatase inhibitors (anastrozole, letrozole) lower estrogen in ER-positive breast ' +
        'cancer.',
      'E2 + ERα/β (cytoplasm, HSP90-bound) activated ER homodimer or heterodimer':
        'In the classical genomic pathway, E2 binds ERα or ERβ, displacing chaperones (HSP90) and driving ' +
        'dimerization and a conformational change. The activated dimer is the transcription-competent species — ' +
        'and the ERα/ERβ balance, which differs by tissue, shapes whether estrogen’s effects are proliferative or ' +
        'protective.',
      'ER-ERE complex (genomic) target gene transcription (PR, pS2/TFF1, c-Myc, cyclin D1)':
        'The activated ER dimer binds estrogen response elements (EREs) and recruits coactivators to transcribe ' +
        'target genes — progesterone receptor, pS2/TFF1, c-Myc, cyclin D1. The proliferative targets (c-Myc, ' +
        'cyclin D1) explain estrogen’s growth-promoting effect on breast epithelium, while PR induction is used ' +
        'clinically as a marker of an intact ER pathway.',
      'ER tethered to AP-1 / Sp1 ERE-less gene transcription':
        'ER can also regulate genes without an ERE by tethering to other DNA-bound factors (AP-1, Sp1). This ' +
        'indirect mode broadens estrogen’s transcriptional reach and contributes to the tissue-selective actions ' +
        'of SERMs like tamoxifen and raloxifene — agonist or antagonist depending on promoter and coregulator ' +
        'context.',
      'E2 + GPER (membrane GPCR) Gs → cAMP + EGFR transactivation → MAPK / PI3K':
        'Estrogen also signals rapidly (seconds-minutes), too fast for transcription, through the membrane GPCR ' +
        'GPER (GPR30): Gs coupling raises cAMP and transactivates EGFR to fire MAPK/PI3K. This non-genomic arm ' +
        'mediates rapid vascular and neural effects and is implicated in tamoxifen resistance.',
      'E2 + membrane-ER (palmitoylated ERα/β) PI3K-AKT + MAPK signaling':
        'A pool of classical ERα/β is palmitoylated and trafficked to the plasma membrane, where E2 binding ' +
        'activates PI3K-AKT and MAPK directly. These membrane-initiated steroid signals integrate with the ' +
        'genomic pathway and underlie estrogen’s rapid cytoprotective and metabolic actions — complicating ' +
        'efforts to fully block ER in cancer.',
    },
  },
  {
    slug: 'brown_adipose_thermogenesis_ucp1',
    notes: {
      'cold exposure + sympathetic activation norepinephrine release onto BAT':
        'Brown-fat thermogenesis is switched on by cold: hypothalamic sensing drives sympathetic nerves to ' +
        'release norepinephrine directly onto brown adipocytes. This neural (not hormonal) control couples BAT ' +
        'activity tightly to acute cold exposure — the basis for the cold-induced BAT activity seen on human PET ' +
        'imaging.',
      'norepinephrine + β3-AR (BAT) Gs → cAMP → PKA activation':
        'Norepinephrine acts mainly through the β3-adrenergic receptor, which couples to Gs to raise cAMP and ' +
        'activate PKA. The β3-AR predominance is why selective β3 agonists (e.g. mirabegron) can activate human ' +
        'BAT — an actively pursued anti-obesity and metabolic strategy.',
      'PKA active HSL activation → lipolysis → free fatty acids':
        'PKA phosphorylates hormone-sensitive lipase (and perilipin), triggering lipolysis of stored triglyceride ' +
        'to free fatty acids. In brown fat these fatty acids are not just fuel — they are the direct activators of ' +
        'the thermogenic effector, coupling lipid mobilization to heat production.',
      'free fatty acids + UCP1 (mitochondrial inner membrane) proton gradient dissipation → heat':
        'The defining step: free fatty acids activate UCP1 (thermogenin) in the inner mitochondrial membrane, ' +
        'letting protons leak back into the matrix and bypass ATP synthase. This uncouples oxidation from ATP ' +
        'production, so the proton-gradient energy is dissipated as heat — the molecular heart of non-shivering ' +
        'thermogenesis.',
      'sustained β3 + cold + exercise WAT browning (beige adipocyte induction)':
        'With sustained β3-adrenergic drive (chronic cold or exercise), white adipose depots recruit UCP1-positive ' +
        '“beige/brite” adipocytes — browning. Because beige fat expands thermogenic capacity in humans (who have ' +
        'limited classical BAT), inducing browning is a major target for raising energy expenditure.',
      'thyroid hormone (T3) UCP1 transcriptional enhancement':
        'Thyroid hormone amplifies the program: locally generated T3 (via BAT-enriched deiodinase D2) enhances ' +
        'UCP1 transcription and sensitizes the tissue to adrenergic stimulation. This is why thyroid status ' +
        'strongly influences basal metabolic rate and cold tolerance, integrating endocrine with neural control.',
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
console.log(`batch D total: ${totalAdded} notes`);
