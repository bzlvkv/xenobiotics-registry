/**
 * 2026-05-15-pathway-tier3-batch.ts — 3 supplementary signaling pathways.
 *
 *   hippo_yap_taz_signaling           — organ-size control, cancer, regen
 *   telomere_shelterin_maintenance    — replicative senescence + cancer
 *   mitophagy_pink1_parkin            — split from autophagy_lc3_axis
 *
 * All modulator slugs verified; refs verified via NCBI esummary 2026-05-15.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
type Pathway = {
  slug: string;
  name: string;
  category: 'biosynthesis' | 'catabolism' | 'signaling' | 'transport' | 'endocrine_axis' | 'drug_metabolism';
  systems: string[];
  description: string;
  steps: Array<{ from: string; to: string; via: string }>;
  modulators: Array<{ slug: string; effect: Effect; target: string; note?: string }>;
  refs: string[];
};

const PATHWAYS: Pathway[] = [
  {
    slug: 'hippo_yap_taz_signaling',
    name: 'Hippo / YAP-TAZ signaling',
    category: 'signaling',
    systems: ['musculoskeletal', 'cardiovascular', 'digestive', 'integumentary'],
    description: `Hippo is the master organ-size control pathway — discovered in Drosophila (Warts/Hippo phenotypes — oversized tissues) and conserved in mammals. The core is a kinase cascade that restrains the YAP and TAZ transcriptional coactivators. Inputs: contact inhibition (cell-cell + cell-matrix tension via Crumbs, NF2/Merlin, AMOT, α-catenin), mechanical cues (substrate stiffness via integrins, F-actin/RhoA), GPCR signaling (LPA, S1P, thrombin activate YAP via Rho-GTPases; many Gs-coupled inhibit it), and metabolic state. ON state (cascade active — Hippo "on"): MST1/2 (STK4/3) → LATS1/2 phosphorylation → LATS1/2 phosphorylates YAP-Ser127 + TAZ-Ser89 → 14-3-3 binding → cytoplasmic retention + β-TrCP-mediated degradation → YAP/TAZ inactive → tissue growth restrained. OFF state (cascade off — Hippo "off"): YAP/TAZ unphosphorylated → translocate to nucleus → bind TEAD1–4 transcription factors → drive proliferation + survival + stemness target genes (CTGF, CYR61, ANKRD1, BIRC5, MYC). Tumor-suppressor vs oncogene paradox: in healthy tissue, Hippo restrains growth. In cancer, YAP/TAZ are hyperactive (mesothelioma — NF2 loss; some hepatocellular carcinoma, breast cancer with chromosomal amplification at 11q22 — YAP locus). NF2 (merlin) is the classical tumor suppressor (neurofibromatosis type 2). Therapeutic landscape: verteporfin (originally a photodynamic agent for AMD) is the best-known YAP-TEAD interaction inhibitor; new YAP/TAZ-TEAD palmitoyl-pocket inhibitors entering trials (IK-930 / IAG933 / VT3989) — early efficacy in NF2-mutant mesothelioma. Statins have YAP-modulating activity (HMG-CoA reductase → reduced geranylgeranylation of RhoA → YAP inactivation), partly explaining cancer chemoprevention signals. Cross-links: [[cell_cycle_cdk]] (downstream growth control), [[wnt_beta_catenin]] (parallel developmental morphogen), [[pi3k_akt_signaling]] (RhoA crosstalk).`,
    steps: [
      { from: 'contact / mechanical / GPCR inputs', to: 'NF2 / AMOT / Crumbs signal integration', via: 'tissue tension + cell-cell contact + LPA/S1P GPCRs converge at the kinase cascade input' },
      { from: 'MST1/2 (STK4/3) active', to: 'LATS1/2 + MOB1 activation (phosphorylation)', via: 'SAV1 scaffold; MST1/2 are core upstream kinases' },
      { from: 'LATS1/2 active', to: 'YAP-Ser127 + TAZ-Ser89 phosphorylation', via: '14-3-3 binding → cytoplasmic retention; β-TrCP → degradation' },
      { from: 'YAP / TAZ cytoplasmic + degraded', to: 'tissue growth restrained (Hippo ON)', via: 'transcriptional coactivators absent from nucleus' },
      { from: 'Hippo cascade OFF (low cell density, soft substrate)', to: 'YAP / TAZ nuclear translocation', via: 'unphosphorylated YAP/TAZ enter nucleus to drive transcription' },
      { from: 'YAP / TAZ + TEAD1–4', to: 'CTGF + CYR61 + ANKRD1 + MYC transcription', via: 'proliferation + survival + stemness program; tumor-promoting in cancer context' },
    ],
    modulators: [
      { slug: 'rapamycin',    effect: 'inhibitor', target: 'mTORC1 → YAP cross-talk (TSC2 axis); part of growth-restraint' },
      { slug: 'everolimus',   effect: 'inhibitor', target: 'mTORC1 → YAP cross-talk' },
      { slug: 'metformin',    effect: 'inhibitor', target: 'AMPK → LATS activation → YAP suppression (preclinical anti-cancer signal)' },
      { slug: 'dasatinib',    effect: 'inhibitor', target: 'SRC → YAP regulation (off-target in cancer)' },
      { slug: 'atorvastatin', effect: 'inhibitor', target: 'HMG-CoA reductase → ↓RhoA geranylgeranylation → YAP inactivation' },
      { slug: 'simvastatin',  effect: 'inhibitor', target: 'HMG-CoA reductase → YAP suppression (cancer chemoprevention partial mechanism)' },
      { slug: 'curcumin',     effect: 'inhibitor', target: 'YAP/TAZ-TEAD (preclinical anti-cancer)' },
      { slug: 'resveratrol',  effect: 'inhibitor', target: 'YAP via SIRT1 + AMPK' },
      { slug: 'quercetin',    effect: 'inhibitor', target: 'YAP/TAZ (preclinical)' },
    ],
    refs: [
      'PMID:30566373', // Ma 2019 Annu Rev Biochem — The Hippo Pathway: Biology and Pathophysiology
    ],
  },

  {
    slug: 'telomere_shelterin_maintenance',
    name: 'Telomere maintenance + shelterin complex',
    category: 'signaling',
    systems: ['immune-hematologic', 'reproductive', 'integumentary'],
    description: `Telomeres are TTAGGG-tandem-repeat caps at chromosome ends, protected by the shelterin protein complex (TRF1, TRF2, POT1, TIN2, TPP1, RAP1). Without protection, chromosome ends would be recognized as double-strand DNA breaks and trigger DDR (ATM/ATR + p53/p21) → senescence or apoptosis. The "end-replication problem": DNA polymerase cannot fully replicate the 3' end of the lagging strand → progressive telomere shortening (~50-100 bp per cell division). Without compensation: replicative senescence (Hayflick limit, ~50-60 divisions) → tissue aging phenotypes. Compensation by telomerase: the ribonucleoprotein reverse transcriptase TERT (catalytic) + TERC/TR (RNA template) extends telomeres. Expression: active in germline + stem cells + most cancers (~85-90% of tumors reactivate telomerase); suppressed in most somatic adult cells (limits tumor formation but causes aging). ALT (alternative lengthening of telomeres) pathway: ~10-15% of cancers — homologous recombination-based; common in mesenchymal tumors + osteosarcoma. Disease relevance: dyskeratosis congenita + telomere biology disorders (TERT, TERC, DKC1, TINF2, RTEL1, CTC1 mutations) → bone marrow failure, pulmonary fibrosis, hepatic fibrosis, premature aging. Therapeutic landscape: telomerase inhibition (imetelstat — first-in-class, FDA-approved 2024 for transfusion-dependent MDS); telomerase activators (TA-65 — astragalus-derived, modest evidence); G-quadruplex stabilizers (BRACO-19) preclinical. Lifestyle: chronic stress + smoking + obesity → faster telomere shortening; exercise + Mediterranean diet → slower attrition. Cross-links: [[senescence_sasp_senolytics]] (replicative senescence end-state), [[apoptosis_bcl2_axis]] (cellular response to uncapped telomeres), [[hpa_axis]] (chronic stress affects telomere attrition).`,
    steps: [
      { from: 'TTAGGG telomeric tandem repeats', to: 'shelterin complex binding (TRF1/2, POT1, TIN2, TPP1, RAP1)', via: 'caps the chromosome end + prevents DDR misinterpretation as DSB' },
      { from: 'lagging-strand DNA polymerase', to: 'incomplete 3′ end replication → 50–100 bp loss per division', via: 'the "end-replication problem"; primary mechanism of replicative shortening' },
      { from: 'TERT (catalytic) + TERC (RNA template)', to: 'telomerase ribonucleoprotein assembly', via: 'reverse transcribes TTAGGG onto the 3′ overhang; active in germline + stem + cancer cells' },
      { from: 'telomerase active', to: 'telomere extension → cellular replicative lifespan extended', via: 'maintains capacity for division; cancer cells exploit this' },
      { from: 'telomere shortening past critical threshold', to: 'DDR activation (ATM/ATR + p53/p21)', via: 'uncapped telomeres look like DNA double-strand breaks → senescence or apoptosis' },
      { from: 'replicative senescence (Hayflick limit)', to: 'permanent cell-cycle arrest + SASP', via: 'cross-link to [[senescence_sasp_senolytics]] — primary driver of aging phenotype' },
    ],
    modulators: [
      { slug: 'astragalus',   effect: 'activator', target: 'TA-65 / cycloastragenol (telomerase activation; modest evidence)' },
      { slug: 'resveratrol',  effect: 'activator', target: 'SIRT1 → telomere protection (chronic, modest)' },
      { slug: 'metformin',    effect: 'activator', target: 'AMPK → telomere length preservation (epidemiologic signal)' },
      { slug: 'rapamycin',    effect: 'activator', target: 'mTORC1 inhibition → telomere protection via reduced replicative pressure' },
      { slug: 'nmn',          effect: 'cofactor',  target: 'NAD⁺ → SIRT1 → telomere stability' },
      { slug: 'nr',           effect: 'cofactor',  target: 'NAD⁺ precursor (nicotinamide riboside)' },
      { slug: 'curcumin',     effect: 'activator', target: 'telomerase + telomere length (preclinical)' },
      { slug: 'quercetin',    effect: 'activator', target: 'telomere protection via senolytic + antioxidant pathways' },
    ],
    refs: [
      'PMID:16166375', // de Lange 2005 Genes Dev — Shelterin: the protein complex
      'PMID:18680434', // Palm & de Lange 2008 Annu Rev Genet — How shelterin protects telomeres
    ],
  },

  {
    slug: 'mitophagy_pink1_parkin',
    name: 'Mitophagy (PINK1 / Parkin)',
    category: 'signaling',
    systems: ['nervous', 'musculoskeletal', 'cardiovascular'],
    description: `Mitophagy — selective autophagy of damaged mitochondria — distinct from general macroautophagy ([[autophagy_lc3_axis]]). Quality-control mechanism preventing accumulation of dysfunctional mitochondria. Canonical PINK1/Parkin pathway: (1) Healthy mitochondria — PINK1 (PTEN-induced kinase 1) is imported through TOM/TIM complexes to the inner membrane → MPP-cleaved → degraded. PINK1 levels stay low. (2) Damaged mitochondria — loss of inner-membrane potential (Δψm) blocks PINK1 import → PINK1 accumulates on the outer membrane (OMM) → activates by trans-autophosphorylation → phosphorylates ubiquitin Ser65 + Parkin. (3) Parkin recruitment + amplification — pSer65-Ub binds + activates Parkin (an E3 ubiquitin ligase) → Parkin polyubiquitinates OMM proteins (Mfn1/2, MIRO1/2, TOM20) → more pSer65-Ub → feed-forward loop. (4) Autophagy receptors — OPTN, NDP52, TAX1BP1, p62 bind polyubiquitin chains → LC3 recruitment → autophagosome enclosure → lysosomal fusion → degradation. PINK1/Parkin-independent mitophagy: BNIP3, NIX, FUNDC1 are receptors that bind LC3 directly (no ubiquitin step) — important for developmental mitophagy (erythrocyte maturation, hypoxia response). Disease relevance: PINK1 + PRKN (Parkin) loss-of-function mutations → autosomal recessive early-onset Parkinson disease (cross-link [[parkinson_alpha_synuclein_aggregation]] — failure of dopaminergic mitochondrial QC). Therapeutic landscape: urolithin A (a gut-microbiome metabolite of ellagic acid) is the first compound demonstrated to induce mitophagy in humans (MIBIOTECH trial); rapamycin + metformin enhance mitophagy via AMPK + mTORC1; NAD precursors (NMN, NR) support PARP/SIRT axis. Cross-links: [[autophagy_lc3_axis]] (parent autophagy mechanism), [[parkinson_alpha_synuclein_aggregation]] (PINK1/PRKN loss → familial PD), [[ampk_signaling]] (mitophagy induction via energy stress), [[mtor_signaling]] (mTORC1 inhibition promotes mitophagy).`,
    steps: [
      { from: 'healthy mitochondrion (intact Δψm)', to: 'PINK1 imported + degraded by MPP', via: 'low steady-state PINK1; no Parkin recruitment' },
      { from: 'damaged mitochondrion (Δψm loss)', to: 'PINK1 accumulation on outer membrane', via: 'loss of inner-membrane import → OMM retention; trans-autophosphorylation' },
      { from: 'PINK1 active (OMM)', to: 'Ub-Ser65 phosphorylation + Parkin activation', via: 'pSer65-Ub binds + activates Parkin E3 ligase' },
      { from: 'Parkin E3 ligase', to: 'OMM protein polyubiquitination (Mfn1/2, MIRO, TOM20)', via: 'feed-forward — more pSer65-Ub → more Parkin recruitment + activation' },
      { from: 'polyubiquitinated mitochondrion', to: 'OPTN / NDP52 / TAX1BP1 / p62 binding → LC3 recruitment', via: 'autophagy receptors bridge Ub chains to LC3-decorated autophagosome' },
      { from: 'mitochondrion in autophagosome', to: 'lysosomal degradation', via: 'STX17-mediated autophagosome-lysosome fusion → mitochondrial content recycled' },
      { from: 'developmental mitophagy (no Ub step)', to: 'BNIP3 / NIX / FUNDC1 → direct LC3 binding', via: 'erythrocyte maturation + hypoxia response — Parkin-independent route' },
    ],
    modulators: [
      { slug: 'rapamycin',      effect: 'activator', target: 'mTORC1 inhibition → ↑mitophagy + autophagy' },
      { slug: 'everolimus',     effect: 'activator', target: 'mTORC1 inhibition → ↑mitophagy' },
      { slug: 'metformin',      effect: 'activator', target: 'AMPK → mitophagy enhancement' },
      { slug: 'urolithin-a',    effect: 'activator', target: 'direct mitophagy induction (ellagic-acid-derived gut metabolite)', note: 'MIBIOTECH human trial: improved mitochondrial gene expression + muscle endurance' },
      { slug: 'nmn',            effect: 'cofactor',  target: 'NAD⁺ precursor → SIRT-driven mitochondrial biogenesis + QC' },
      { slug: 'nr',             effect: 'cofactor',  target: 'NAD⁺ precursor (nicotinamide riboside)' },
      { slug: 'spermidine',     effect: 'activator', target: 'autophagy + mitophagy (lifespan-extending across species)' },
      { slug: 'resveratrol',    effect: 'activator', target: 'SIRT1 → mitochondrial QC' },
      { slug: 'quercetin',      effect: 'activator', target: 'mitophagy + senolytic' },
      { slug: 'fisetin',        effect: 'activator', target: 'mitophagy + senolytic' },
      { slug: 'curcumin',       effect: 'activator', target: 'mitophagy (preclinical neuroprotection)' },
      { slug: 'egcg',           effect: 'activator', target: 'mitophagy + antioxidant' },
      { slug: 'luteolin',       effect: 'activator', target: 'mitophagy (preclinical)' },
      { slug: 'beta-hydroxybutyrate', effect: 'activator', target: 'mitochondrial QC (HDAC inhibition + AMPK)' },
    ],
    refs: [
      'PMID:21179058', // Youle & Narendra 2011 Nat Rev Mol Cell Biol — Mechanisms of mitophagy
      'PMID:39358449', // Narendra 2024 Nat Cell Biol — PINK1-Parkin role in mitochondrial QC
    ],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const existing = new Set(data.map((p) => p.slug));
  let added = 0;
  let skipped = 0;
  for (const p of PATHWAYS) {
    if (existing.has(p.slug)) {
      console.log(`SKIP (already exists): ${p.slug}`);
      skipped++;
      continue;
    }
    data.push(p);
    added++;
    console.log(`ADD: ${p.slug} (${p.modulators.length} mods, ${p.refs.length} refs)`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nTotal pathways: ${data.length} (added ${added}, skipped ${skipped})`);
}

main();
