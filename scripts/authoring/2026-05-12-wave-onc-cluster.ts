/**
 * 2026-05-12-wave-onc-cluster.ts — Oncology cluster (ONC-1..4).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'tyrosine_kinase_inhibition',
    name: 'Receptor + non-receptor tyrosine kinase inhibition',
    category: 'signaling',
    systems: ['immune-hematologic', 'integumentary'],
    description: `Tyrosine kinases phosphorylate downstream substrates → MAPK / PI3K-AKT / JAK-STAT cascades that drive proliferation. Oncogenic fusion (BCR-ABL in CML, philadelphia-chromosome+ ALL), receptor amplification (HER2 in breast), or activating mutation (EGFR in NSCLC, c-KIT in GIST) makes tumors kinase-addicted. Small-molecule TKIs (imatinib first, 2001) bind the ATP cleft of the kinase. Imatinib targets BCR-ABL + c-KIT + PDGFR; nilotinib + dasatinib are 2nd-/3rd-gen BCR-ABL TKIs covering imatinib-resistant mutations (T315I escapes both — needs ponatinib). EGFR-TKIs (erlotinib, gefitinib, osimertinib, afatinib) for NSCLC. Multi-target TKIs (sorafenib, sunitinib, pazopanib, lenvatinib) hit VEGFR + PDGFR + RAF + others — broader-spectrum antiangiogenesis + antiproliferation. JAK-i (ruxolitinib, tofacitinib) covered in jak_stat_signaling.`,
    steps: [
      { from: 'tyrosine-kinase-active', to: 'downstream-phosphorylation', via: 'ATP binding + substrate phosphorylation → MAPK / PI3K / JAK-STAT activation' },
    ],
    modulators: [
      { slug: 'imatinib', effect: 'inhibitor', target: 'BCR-ABL + c-KIT + PDGFR', note: 'first TKI (2001); CML transformed from leukemia to chronic disease; CYP3A4 substrate (verapamil/macrolide DDIs)' },
      { slug: 'nilotinib', effect: 'inhibitor', target: 'BCR-ABL (2nd-gen)', note: '2nd-gen BCR-ABL TKI; covers most imatinib-resistant mutations except T315I; QT prolongation requires monitoring' },
      { slug: 'dasatinib', effect: 'inhibitor', target: 'BCR-ABL + SRC + c-KIT (2nd-gen)', note: '2nd-gen BCR-ABL; pleural effusion + pulmonary hypertension on-target SRC tail; CYP3A4 substrate' },
      { slug: 'erlotinib', effect: 'inhibitor', target: 'EGFR kinase', note: 'EGFR-TKI; NSCLC + pancreatic; acneiform rash predicts efficacy; CYP3A4 substrate' },
      { slug: 'sorafenib', effect: 'inhibitor', target: 'VEGFR + PDGFR + RAF (multi-kinase)', note: 'multi-TKI; HCC + RCC + thyroid; HFS (hand-foot syndrome) characteristic toxicity' },
    ],
    refs: [],
  },
  {
    slug: 'aromatase_androgen_receptor_axis',
    name: 'Aromatase + androgen receptor (hormonal oncology)',
    category: 'signaling',
    systems: ['endocrine', 'reproductive'],
    description: `Hormone-driven cancers (breast, prostate) respond to depriving the target tissue of its growth-hormone signal. Breast: aromatase inhibitors (anastrozole, letrozole, exemestane) block peripheral androgen → estrogen conversion; SERMs (tamoxifen) partial-agonize estrogen receptor with tissue selectivity (antagonist in breast, agonist in endometrium → uterine-cancer signal); SERD (fulvestrant) full-degrades the estrogen receptor; clomiphene is a SERM used for ovulation induction. Prostate: GnRH analogs (leuprolide, triptorelin, goserelin agonists; cetrorelix/ganirelix/degarelix antagonists — covered in END-4) drop testicular T; CYP17 lyase inhibitor (abiraterone) blocks adrenal/intratumoral androgen synthesis; AR antagonists (enzalutamide, bicalutamide) block AR ligand binding. Mifepristone — anti-progesterone with off-label use; covered as PR antagonist.`,
    steps: [
      { from: 'androgens', to: 'estrogens', via: 'aromatase (CYP19A1) in peripheral adipose + breast tissue; AI target' },
      { from: 'androgens', to: 'androgen-receptor-activation', via: 'AR nuclear translocation + AR/DNA binding; bicalutamide/enzalutamide block' },
    ],
    modulators: [
      { slug: 'tamoxifen', effect: 'inhibitor', target: 'ER (SERM, breast-antagonist)', note: 'SERM; ER+ breast cancer adjuvant 5-10 years; endometrial cancer + VTE signals; CYP2D6 activation (PMs may have reduced efficacy)' },
      { slug: 'fulvestrant', effect: 'inhibitor', target: 'ER degrader (SERD)', note: 'IM monthly; ER+ metastatic breast; no agonist activity (unlike SERMs)' },
      { slug: 'anastrozole', effect: 'inhibitor', target: 'aromatase (CYP19A1)', note: 'non-steroidal AI; first-line postmenopausal ER+ breast cancer; bone density loss + arthralgias' },
      { slug: 'letrozole', effect: 'inhibitor', target: 'aromatase (CYP19A1)', note: 'non-steroidal AI; also off-label for ovulation induction (NEJM 2014 superior to clomiphene in PCOS)' },
      { slug: 'exemestane', effect: 'inhibitor', target: 'aromatase (CYP19A1, steroidal irreversible)', note: 'steroidal AI; covalent inactivation of aromatase; mild androgenic side effects' },
      { slug: 'clomiphene', effect: 'inhibitor', target: 'ER (SERM, hypothalamic-antagonist)', note: 'SERM; ovulation induction by blocking estrogen feedback at hypothalamus → ↑GnRH/FSH/LH; off-label for male hypogonadism' },
      { slug: 'abiraterone', effect: 'inhibitor', target: 'CYP17A1 (17,20-lyase + 17α-hydroxylase)', note: 'mCRPC; blocks adrenal + intratumoral androgen synthesis; prednisone co-prescribed for cortisol replacement' },
      { slug: 'enzalutamide', effect: 'inhibitor', target: 'androgen receptor (AR antagonist, no agonist activity)', note: 'mCRPC + mHSPC; second-gen AR-i without partial agonism; CNS-penetrant (seizure signal)' },
      { slug: 'bicalutamide', effect: 'inhibitor', target: 'androgen receptor (1st-gen antagonist)', note: 'older AR-i; partial agonist activity contributes to AR-amplification escape mechanism' },
      { slug: 'mifepristone', effect: 'inhibitor', target: 'progesterone receptor + glucocorticoid receptor', note: 'anti-PR for medical abortion; anti-GR off-label for Cushing-related hyperglycemia (Korlym)' },
    ],
    refs: [],
  },
  {
    slug: 'dna_damage_cytotoxic_response',
    name: 'DNA-damage cytotoxic chemotherapy',
    category: 'catabolism',
    systems: ['immune-hematologic'],
    description: `Traditional cytotoxic chemotherapy delivers DNA-damaging insults that proliferating cells (cancer cells, plus bone marrow + GI + hair follicle) cannot repair in time. Mechanisms: (1) DNA cross-linking — cisplatin/carboplatin form Pt-DNA adducts, cyclophosphamide forges interstrand alkyl bridges; (2) Topoisomerase poisoning — doxorubicin traps Top2-DNA complexes; (3) Microtubule disruption — paclitaxel stabilizes microtubules → arrests mitosis at metaphase; (4) Antimetabolites — 5-FU is a thymidylate synthase inhibitor (block dTMP synthesis), methotrexate is DHFR inhibitor (broader folate-cycle block — purine + pyrimidine + amino-acid synthesis). Immune-modulating offshoots: mycophenolate (IMPDH inhibitor → de novo purine synthesis block, T/B cell selective); azathioprine (6-MP prodrug, thiopurine → DNA incorporation + de novo purine block).`,
    steps: [
      { from: 'cellular-dna', to: 'dna-damage', via: 'cross-links, strand breaks, antimetabolite incorporation' },
      { from: 'dna-damage', to: 'apoptosis-mitotic-catastrophe', via: 'unrepairable damage → p53-dependent or independent cell death' },
    ],
    modulators: [
      { slug: 'doxorubicin', effect: 'inhibitor', target: 'topoisomerase II (DNA-Top2 covalent complex)', note: 'anthracycline; cardiomyopathy cumulative-dose-limited (~450 mg/m²); dexrazoxane cardioprotection in late therapy' },
      { slug: 'cisplatin', effect: 'inhibitor', target: 'DNA (intrastrand Pt-GG crosslinks)', note: 'platinum; nephrotoxicity + ototoxicity + neuropathy + nausea; pre-hydration + magnesium repletion routine' },
      { slug: 'cyclophosphamide', effect: 'inhibitor', target: 'DNA (alkylator → interstrand cross-links)', note: 'nitrogen mustard prodrug → 4-hydroxy-cyclophosphamide → phosphoramide mustard; hemorrhagic cystitis (acrolein metabolite) prevented by mesna' },
      { slug: 'paclitaxel', effect: 'inhibitor', target: 'β-tubulin (microtubule stabilizer)', note: 'taxane; breast/ovarian/lung; Cremophor-EL solvent hypersensitivity (nab-paclitaxel formulation avoids this); peripheral neuropathy dose-limiting' },
      { slug: '5-fluorouracil', effect: 'inhibitor', target: 'thymidylate synthase + RNA incorporation', note: 'pyrimidine antimetabolite; DPD deficiency → severe toxicity (mandated genetic testing in some jurisdictions); HFS + mucositis' },
      { slug: 'mycophenolate', effect: 'inhibitor', target: 'IMPDH (inosine monophosphate dehydrogenase)', note: 'transplant immunosuppression + lupus nephritis; selective T/B-cell depletion via de-novo-purine-synthesis dependence' },
      { slug: 'azathioprine', effect: 'inhibitor', target: '6-MP prodrug → de novo purine synthesis + DNA incorporation', note: 'thiopurine; IBD + transplant + autoimmune; TPMT polymorphism dictates dose (pre-treatment testing); allopurinol DDI catastrophic (XO blockade → 6-MP accumulation)' },
      { slug: 'tacrolimus', effect: 'inhibitor', target: 'calcineurin (via FKBP12 binding)', note: 'transplant immunosuppression; CYP3A4 substrate (massive DDI surface — itraconazole / clarithromycin / verapamil); narrow therapeutic index, trough-monitored' },
      { slug: 'cyclosporine', effect: 'inhibitor', target: 'calcineurin (via cyclophilin binding)', note: 'first calcineurin inhibitor; transplant + uveitis + atopic dermatitis; nephrotoxic; gingival hyperplasia; OATP1B1 + CYP3A4 dual perpetrator (DDI surface with statins → rhabdo) + victim (azoles)' },
    ],
    refs: [],
  },
  {
    slug: 'immune_checkpoint_blockade',
    name: 'Immune checkpoint blockade (PD-1 / PD-L1 / CTLA-4)',
    category: 'signaling',
    systems: ['immune-hematologic'],
    description: `T-cell activation requires antigen recognition (TCR-MHC) + co-stimulation (CD28-B7) but is balanced by inhibitory checkpoints — PD-1 (T-cell) engages PD-L1/PD-L2 (tumor or APC) → T-cell exhaustion. CTLA-4 outcompetes CD28 for B7 → blunts initial priming. Tumors hijack checkpoints to evade immunosurveillance. Checkpoint blockade releases the brake: anti-PD-1 (nivolumab, pembrolizumab) on T cells; anti-PD-L1 (atezolizumab, durvalumab) on tumors; anti-CTLA-4 (ipilimumab) priming-phase. Indications expanded to melanoma → NSCLC → renal → bladder → HCC → MSI-high tumors of any origin. Toxicity is autoimmune (irAEs): colitis, pneumonitis, hepatitis, endocrinopathies (thyroiditis → hypothyroidism, hypophysitis, T1DM, adrenal insufficiency) — managed by holding the drug ± systemic steroids.`,
    steps: [
      { from: 'pd-1-pd-l1-binding', to: 't-cell-exhaustion', via: 'PD-1 phosphatase recruitment → TCR signal dampening' },
      { from: 'ctla-4-b7-binding', to: 't-cell-priming-suppression', via: 'CTLA-4 outcompetes CD28 → reduced IL-2 + clonal expansion' },
    ],
    modulators: [
      { slug: 'nivolumab', effect: 'inhibitor', target: 'PD-1 (on T cells)', note: 'first PD-1 mAb approved (2014 melanoma); broad indications; irAE colitis + pneumonitis + endocrinopathies' },
      { slug: 'pembrolizumab', effect: 'inhibitor', target: 'PD-1 (on T cells)', note: 'PD-1 mAb; tissue-agnostic approval for MSI-H/dMMR tumors — first FDA biomarker-only indication' },
      { slug: 'atezolizumab', effect: 'inhibitor', target: 'PD-L1 (on tumor + APC)', note: 'PD-L1 mAb; NSCLC + bladder + TNBC; mechanism focuses on tumor-side ligand vs T-cell-side receptor' },
    ],
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p);
    added++;
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nONC cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
