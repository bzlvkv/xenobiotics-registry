/**
 * 2026-05-03-wave-0b-supplements-and-rx.ts — Wave 0b third sub-batch.
 *
 * Mixes the "top supplements" bucket with the remaining "common Rx"
 * tail. Adds:
 *   - Botanical supplements (ginkgo, valerian, chamomile, saffron, etc.)
 *   - Medicinal mushrooms (maitake, chaga, shiitake, turkey tail)
 *   - Algae (spirulina, chlorella)
 *   - Single-molecule amino-acid + nutrient forms (l-arginine, l-glutamine,
 *     beta-alanine, choline-bitartrate, dmae, inositol, msm, allicin,
 *     icosapent-ethyl)
 *   - EPA / DHA as separate entries (the existing 'epa-dha' entry is a
 *     mixture stub — separating gives proper MW + per-molecule kinetics)
 *   - Remaining cardiovascular Rx: enalapril, ramipril, nifedipine,
 *     nebivolol, ticagrelor, prasugrel
 *   - Other clinical: tiotropium (LAMA), mesalamine (IBD), methimazole +
 *     propylthiouracil (hyperthyroidism), allopurinol + febuxostat (gout)
 *   - Beetroot extract, red-yeast-rice (cardio-nutraceuticals)
 *
 * Class/extract entries (botanicals, mushrooms, algae, oils) carry
 * mechanism + dose + half-life but no mw_g_mol — they're multi-component
 * and don't have a single defined molecular weight. Same convention as
 * Wave 0a's deliberate skips (heparin, enoxaparin, hyaluronic-acid).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Stub = {
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  mechanism: string;
  routes: string[];
  doses: Record<string, { min: number; max: number; typical: number; unit?: string }>;
  half_life_hr: Record<string, number>;
  mw_g_mol?: number;
  refs: string[];
};

const STUBS: Stub[] = [
  // ── BOTANICAL SUPPLEMENTS (extract entries — no single MW) ────────
  {
    slug: 'ginkgo-biloba',
    name: 'Ginkgo Biloba',
    aliases: ['Ginkgo extract', 'EGb 761'],
    category: 'adaptogen',
    mechanism: 'Standardized leaf extract (typically 24% flavone glycosides + 6% terpene lactones — ginkgolides A/B/C, bilobalide). Modest cerebral microcirculation enhancement + PAF antagonism. Trialed in age-related cognitive decline; effect size small. Bleeding risk via PAF inhibition concerns with anticoagulants.',
    routes: ['PO'],
    doses: { 'PO': { min: 60, max: 240, typical: 120, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    refs: [],
  },
  {
    slug: 'valerian',
    name: 'Valerian',
    aliases: ['Valeriana officinalis'],
    category: 'adaptogen',
    mechanism: 'Root extract — valerenic acid + valepotriates positive allosteric modulators at GABA-A receptors. Sedative + anxiolytic; trialed for insomnia + mild anxiety with modest effect sizes. Often combined with hops, lemon balm, or melatonin.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 600, typical: 450, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    refs: [],
  },
  {
    slug: 'lemon-balm',
    name: 'Lemon Balm',
    aliases: ['Melissa officinalis'],
    category: 'adaptogen',
    mechanism: 'Leaf extract with rosmarinic acid + citronellal as named actives. Anxiolytic + mild sedative — modest GABA-T inhibition contributes to anxiolysis. Often paired with valerian or theanine in sleep formulations.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 600, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    refs: [],
  },
  {
    slug: 'chamomile',
    name: 'Chamomile',
    aliases: ['Matricaria recutita', 'German chamomile'],
    category: 'adaptogen',
    mechanism: 'Flower extract — apigenin (a flavone) is the primary anxiolytic active via partial GABA-A benzodiazepine-site binding. Anti-inflammatory bisabolol + chamazulene contribute to topical and GI benefits. Modest sleep-onset improvement in clinical trials.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 220, max: 1100, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'saffron',
    name: 'Saffron',
    aliases: ['Crocus sativus stigma extract', 'Affron'],
    category: 'adaptogen',
    mechanism: 'Stigma extract; crocin + safranal + picrocrocin are the named actives. Multiple meta-analyses report antidepressant effect comparable to fluoxetine 20 mg in mild-to-moderate depression. SSRI-like serotonin reuptake modulation suggested; mechanism not fully resolved.',
    routes: ['PO'],
    doses: { 'PO': { min: 15, max: 100, typical: 30, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    refs: [],
  },
  {
    slug: 'passionflower',
    name: 'Passionflower',
    aliases: ['Passiflora incarnata'],
    category: 'adaptogen',
    mechanism: 'Aerial-parts extract; harman alkaloids + flavonoids (chrysin, vitexin) suggested as actives. Anxiolytic via GABA-A modulation. Trialed for generalized anxiety + presurgical anxiety with modest effects.',
    routes: ['PO'],
    doses: { 'PO': { min: 250, max: 1000, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    refs: [],
  },

  // ── MEDICINAL MUSHROOMS ──────────────────────────────────────────
  {
    slug: 'maitake',
    name: 'Maitake',
    aliases: ['Grifola frondosa', 'Hen of the woods'],
    category: 'adaptogen',
    mechanism: 'Mushroom fruit-body extract; β-1,3/1,6-glucan (D-fraction) is the immunomodulatory active. Activates Dectin-1 on macrophages + NK cells. Trialed in immune support during chemotherapy; modest blood glucose effect in some studies.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 3000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'chaga',
    name: 'Chaga',
    aliases: ['Inonotus obliquus'],
    category: 'adaptogen',
    mechanism: 'Birch-tree fungus extract with high triterpene + melanin + β-glucan content. Antioxidant capacity on ORAC assays among the highest of foods. Immunomodulatory + glucose-lowering signals; oxalate-related kidney injury reports limit chronic high-dose use.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 2000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'shiitake',
    name: 'Shiitake',
    aliases: ['Lentinula edodes'],
    category: 'adaptogen',
    mechanism: 'Edible mushroom containing lentinan (β-glucan), eritadenine (cholesterol-lowering), and ergosterol (vitamin D2 precursor). Lentinan is an approved adjuvant immunotherapy for gastric cancer in Japan.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 5000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },
  {
    slug: 'turkey-tail',
    name: 'Turkey Tail',
    aliases: ['Trametes versicolor', 'PSK', 'PSP'],
    category: 'adaptogen',
    mechanism: 'Mushroom polysaccharide extracts: PSK (Krestin) and PSP — protein-bound β-glucans with 30+ years of approved oncology adjuvant use in Japan + China. Activates dendritic cells and NK cells.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 3000, typical: 1500, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    refs: [],
  },

  // ── ALGAE / SUPERFOODS ────────────────────────────────────────────
  {
    slug: 'spirulina',
    name: 'Spirulina',
    aliases: ['Arthrospira platensis'],
    category: 'adaptogen',
    mechanism: 'Cyanobacteria — high in phycocyanin (anti-inflammatory pigment-protein), B-vitamins, and complete amino acids. Modest LDL-lowering + blood-pressure effects in meta-analyses. Heavy metal contamination concern depending on harvest source.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 8000, typical: 3000, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    refs: [],
  },
  {
    slug: 'chlorella',
    name: 'Chlorella',
    aliases: ['Chlorella vulgaris', 'Chlorella pyrenoidosa'],
    category: 'adaptogen',
    mechanism: 'Single-cell green algae; high chlorophyll + CGF (Chlorella Growth Factor — nucleic acid mix). Marketed for heavy metal chelation (cell wall binding) and immune support; clinical evidence weak. Cell-wall-cracked preparations have higher bioavailability.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 6000, typical: 3000, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    refs: [],
  },

  // ── AMINO ACIDS / NUTRIENT FORMS (single-molecule) ────────────────
  {
    slug: 'l-arginine',
    name: 'L-Arginine',
    aliases: ['Arginine'],
    category: 'amino-acid',
    mechanism: 'Conditionally essential amino acid; substrate for nitric oxide synthase (NOS) → NO → vascular smooth muscle relaxation. Also urea-cycle intermediate (Krebs-Henseleit cycle in liver). Used as supplement for endothelial / cardiovascular support; effect size small at supplement doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 2000, max: 12000, typical: 5000, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 174.20,
    refs: [],
  },
  {
    slug: 'l-glutamine',
    name: 'L-Glutamine',
    aliases: ['Glutamine'],
    category: 'amino-acid',
    mechanism: 'Most abundant amino acid in plasma + skeletal muscle. Primary fuel for enterocytes and rapidly dividing immune cells. Supports gut-barrier integrity in critical illness; trialed as ergogenic aid with mixed results.',
    routes: ['PO'],
    doses: { 'PO': { min: 5000, max: 30000, typical: 10000, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 146.15,
    refs: [],
  },
  {
    slug: 'l-citrulline',
    name: 'L-Citrulline',
    aliases: ['Citrulline'],
    category: 'amino-acid',
    mechanism: 'Non-proteinogenic urea-cycle amino acid. Bypasses gut + hepatic L-arginine first-pass metabolism — converted to arginine in the kidney → raises plasma arginine more efficiently than oral L-arginine itself. Vasodilation + erectile-function support, modest effect sizes.',
    routes: ['PO'],
    doses: { 'PO': { min: 3000, max: 8000, typical: 6000, unit: 'mg' } },
    half_life_hr: { 'PO': 0.7 },
    mw_g_mol: 175.19,
    refs: [],
  },
  {
    slug: 'beta-alanine',
    name: 'β-Alanine',
    aliases: ['Beta-alanine'],
    category: 'amino-acid',
    mechanism: 'Non-proteinogenic amino acid — rate-limiting precursor for muscle carnosine synthesis. Carnosine buffers H+ in the muscle during anaerobic exercise → ~2–3% improvement in 1–4 minute work capacity. Paresthesia ("tingles") at >800 mg single doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 2000, max: 6400, typical: 3200, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 89.09,
    refs: [],
  },
  {
    slug: 'choline-bitartrate',
    name: 'Choline Bitartrate',
    aliases: [],
    category: 'amino-acid',
    mechanism: 'Choline + L-tartrate salt; choline is an essential nutrient — substrate for acetylcholine and phosphatidylcholine biosynthesis, and methyl donor via CDP-choline / betaine pathway. Supplement of last resort for choline deficiency; alpha-GPC and citicoline have higher CNS bioavailability.',
    routes: ['PO'],
    doses: { 'PO': { min: 250, max: 2000, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 253.25,
    refs: [],
  },
  {
    slug: 'dmae',
    name: 'DMAE',
    aliases: ['Dimethylaminoethanol', 'Deanol'],
    category: 'nootropic',
    mechanism: 'Choline analog with one methyl group replaced by H. Marketed as nootropic / acetylcholine precursor; biochemical evidence for ACh elevation is weak. Cosmetic topical use claims skin tightening with limited rigor.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 100, max: 350, typical: 200, unit: 'mg' } },
    half_life_hr: { 'PO': 4 },
    mw_g_mol: 89.14,
    refs: [],
  },
  {
    slug: 'inositol',
    name: 'Inositol',
    aliases: ['myo-Inositol', 'Vitamin B8'],
    category: 'metabolite',
    mechanism: 'Cyclic polyol — myo-inositol predominates (~95% of body inositol). Backbone of phosphatidylinositol membrane lipids and IP3 second messenger. Trialed for PCOS (insulin sensitization), anxiety, OCD; dose-dependent benefit in PCOS at 2 g BID.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 18000, typical: 4000, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 180.16,
    refs: [],
  },
  {
    slug: 'd-chiro-inositol',
    name: 'D-Chiro-Inositol',
    aliases: ['DCI'],
    category: 'metabolite',
    mechanism: 'Inositol stereoisomer — synthesized from myo-inositol by epimerase. Mediator of insulin signaling in muscle and adipose. Used in PCOS in 40:1 myo:DCI ratio mimicking serum levels. Doses too high reduce ovulation (the "DCI paradox").',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 600, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 180.16,
    refs: [],
  },

  // ── JOINT / CONNECTIVE / PERFORMANCE ──────────────────────────────
  {
    slug: 'msm',
    name: 'MSM',
    aliases: ['Methylsulfonylmethane', 'DMSO2'],
    category: 'metabolite',
    mechanism: 'Naturally occurring organosulfur compound — oxidized form of DMSO. Sulfur source for collagen + cartilage + glutathione synthesis. Trialed for osteoarthritis pain with modest effect; often combined with glucosamine + chondroitin.',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 1000, max: 6000, typical: 3000, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 94.13,
    refs: [],
  },
  {
    slug: 'allicin',
    name: 'Allicin',
    aliases: [],
    category: 'metabolite',
    mechanism: 'Diallyl thiosulfinate formed when fresh garlic is crushed (alliin + alliinase enzymatic conversion). Antimicrobial, modest blood-pressure lowering, weak antiplatelet. Highly unstable — degrades to ajoene + diallyl sulfides during heating + GI transit.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 15, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 1 },
    mw_g_mol: 162.27,
    refs: [],
  },
  {
    slug: 'collagen-peptides',
    name: 'Collagen Peptides',
    aliases: ['Hydrolyzed collagen'],
    category: 'biologic',
    mechanism: 'Enzymatically hydrolyzed bovine / marine collagen yielding 2–10 kDa peptide fragments. Distinct dipeptides (Pro-Hyp, Hyp-Gly) are absorbed intact via PEPT1 and traffic to skin / cartilage / bone. Modest clinical evidence for skin elasticity + joint pain at 5–15 g/d.',
    routes: ['PO'],
    doses: { 'PO': { min: 5000, max: 15000, typical: 10000, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    refs: [],
  },
  {
    slug: 'beetroot-extract',
    name: 'Beetroot Extract',
    aliases: ['Beta vulgaris', 'Nitrate-rich beetroot'],
    category: 'adaptogen',
    mechanism: 'Concentrated beetroot juice / powder — high inorganic nitrate (NO3-). Reduced enterosalivarily to nitrite, then to nitric oxide → vasodilation, lower BP (~3–5 mmHg), modest endurance ergogenic effect.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 8000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    refs: [],
  },
  {
    slug: 'red-yeast-rice',
    name: 'Red Yeast Rice',
    aliases: ['Monascus purpureus rice'],
    category: 'adaptogen',
    mechanism: 'Rice fermented by Monascus purpureus yields monacolin K (chemically identical to lovastatin). HMG-CoA reductase inhibition lowers LDL with the same hepatotoxicity / myopathy profile as the prescription statin. FDA enforces statin-level limits on US products — actual monacolin content varies widely.',
    routes: ['PO'],
    doses: { 'PO': { min: 600, max: 2400, typical: 1200, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    refs: [],
  },

  // ── OMEGA-3 SINGLE MOLECULES (canonical lipid entries) ────────────
  {
    slug: 'epa',
    name: 'EPA',
    aliases: ['Eicosapentaenoic acid', 'C20:5n3'],
    category: 'lipid',
    mechanism: 'C20:5 ω-3 polyunsaturated fatty acid. Substrate for COX/LOX enzymes generating series-3 (less inflammatory) prostaglandins + thromboxanes + series-5 leukotrienes. Direct modulator of inflammatory gene expression via PPAR-α, FFAR4. Cardiovascular + triglyceride-lowering effects.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 4000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 302.45,
    refs: [],
  },
  {
    slug: 'dha',
    name: 'DHA',
    aliases: ['Docosahexaenoic acid', 'C22:6n3'],
    category: 'lipid',
    mechanism: 'C22:6 ω-3 polyunsaturated fatty acid. Major structural lipid of neuronal + retinal membranes — ~30% of CNS phospholipid fatty acids. Critical for neurodevelopment in fetal life and CNS maintenance lifelong. Cardiovascular benefits parallel EPA.',
    routes: ['PO'],
    doses: { 'PO': { min: 250, max: 2000, typical: 500, unit: 'mg' } },
    half_life_hr: { 'PO': 30 },
    mw_g_mol: 328.49,
    refs: [],
  },
  {
    slug: 'icosapent-ethyl',
    name: 'Icosapent Ethyl',
    aliases: ['Vascepa'],
    category: 'pharmacological',
    mechanism: 'Ethyl ester of pure EPA (no DHA) — pharmaceutical grade ω-3. REDUCE-IT trial (2018) demonstrated 25% MACE reduction in statin-treated high-risk patients with elevated triglycerides. Mechanism beyond TG-lowering involves stabilization of atherosclerotic plaque + anti-inflammatory eicosanoid shift.',
    routes: ['PO'],
    doses: { 'PO': { min: 1000, max: 4000, typical: 4000, unit: 'mg' } },
    half_life_hr: { 'PO': 72 },
    mw_g_mol: 330.51,
    refs: [],
  },

  // ── REMAINING CARDIOVASCULAR Rx ───────────────────────────────────
  {
    slug: 'enalapril',
    name: 'Enalapril',
    aliases: ['Vasotec'],
    category: 'pharmacological',
    mechanism: 'ACE inhibitor prodrug — hydrolyzed in liver to enalaprilat (the active form) by carboxylesterase. Same blockade of angiotensin I → II conversion as lisinopril, but oral prodrug strategy gave better bioavailability than the early ACEi captopril.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 2.5, max: 40, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 11 },
    mw_g_mol: 376.45,
    refs: [],
  },
  {
    slug: 'ramipril',
    name: 'Ramipril',
    aliases: ['Altace'],
    category: 'pharmacological',
    mechanism: 'ACE inhibitor prodrug — hepatic carboxylesterase converts to ramiprilat. HOPE trial (2000) demonstrated CV-event reduction in high-risk patients independent of BP lowering — drove modern preferred use of ACEi for cardioprotection.',
    routes: ['PO'],
    doses: { 'PO': { min: 1.25, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 14 },
    mw_g_mol: 416.51,
    refs: [],
  },
  {
    slug: 'nifedipine',
    name: 'Nifedipine',
    aliases: ['Procardia', 'Adalat'],
    category: 'pharmacological',
    mechanism: 'Dihydropyridine calcium-channel blocker — vascular Cav1.2 blockade with minimal direct cardiac effect. Immediate-release form has rapid BP swings and reflex tachycardia (associated with mortality signal in MI patients) → extended-release preferred for hypertension. Used acutely for severe hypertension and Raynaud\'s.',
    routes: ['PO'],
    doses: { 'PO': { min: 30, max: 120, typical: 60, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 346.34,
    refs: [],
  },
  {
    slug: 'nebivolol',
    name: 'Nebivolol',
    aliases: ['Bystolic'],
    category: 'pharmacological',
    mechanism: 'Third-generation β1-selective adrenergic blocker — also stimulates endothelial nitric oxide synthesis → vasodilation that other β-blockers lack. Lower fatigue + sexual side-effect profile. CYP2D6 substrate; poor metabolizers have ~10× higher AUC.',
    routes: ['PO'],
    doses: { 'PO': { min: 2.5, max: 40, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 405.43,
    refs: [],
  },
  {
    slug: 'ticagrelor',
    name: 'Ticagrelor',
    aliases: ['Brilinta'],
    category: 'pharmacological',
    mechanism: 'Reversible P2Y12 ADP-receptor antagonist — direct-acting (not a prodrug) so onset within ~30 min independent of CYP2C19 phenotype. Used in ACS / post-PCI antiplatelet therapy. Dyspnea (~15%) from adenosine reuptake inhibition in lung.',
    routes: ['PO'],
    doses: { 'PO': { min: 60, max: 90, typical: 90, unit: 'mg' } },
    half_life_hr: { 'PO': 8 },
    mw_g_mol: 522.57,
    refs: [],
  },
  {
    slug: 'prasugrel',
    name: 'Prasugrel',
    aliases: ['Effient'],
    category: 'pharmacological',
    mechanism: 'Thienopyridine P2Y12 antagonist prodrug — hydrolyzed in intestine + activated by CYP3A4/2B6 to the active R-138727 metabolite. Faster + more consistent activation than clopidogrel; higher bleeding risk. Contraindicated in stroke/TIA history due to hemorrhagic stroke signal.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 60, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 373.44,
    refs: [],
  },

  // ── OTHER CLINICAL Rx ─────────────────────────────────────────────
  {
    slug: 'tiotropium',
    name: 'Tiotropium',
    aliases: ['Spiriva'],
    category: 'pharmacological',
    mechanism: 'Long-acting muscarinic antagonist (LAMA) — quaternary ammonium derivative of ipratropium with M3 receptor kinetic selectivity (slow dissociation from M3 vs M2 → 24h dosing). Cornerstone COPD maintenance therapy; also approved for severe asthma.',
    routes: ['INH'],
    doses: { 'INH': { min: 0.0025, max: 0.018, typical: 0.018, unit: 'mg' } },
    half_life_hr: { 'INH': 27 },
    mw_g_mol: 472.41,
    refs: [],
  },
  {
    slug: 'mesalamine',
    name: 'Mesalamine',
    aliases: ['5-ASA', '5-aminosalicylic acid', 'Mesalazine'],
    category: 'pharmacological',
    mechanism: 'Active anti-inflammatory metabolite of sulfasalazine — local action in colon mucosa via COX/LOX inhibition + scavenging of reactive oxygen species. First-line for mild-to-moderate ulcerative colitis; pH- and time-controlled formulations target distal ileum/colon.',
    routes: ['PO', 'PR'],
    doses: { 'PO': { min: 800, max: 4800, typical: 2400, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 153.14,
    refs: [],
  },
  {
    slug: 'methimazole',
    name: 'Methimazole',
    aliases: ['Tapazole'],
    category: 'pharmacological',
    mechanism: 'Thionamide antithyroid — inhibits thyroid peroxidase (TPO) blocking iodination of thyroglobulin tyrosines → halts thyroid hormone synthesis. First-line for Graves disease + thyroid storm (after PTU in early pregnancy). Agranulocytosis is the feared adverse effect.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 40, typical: 15, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 114.17,
    refs: [],
  },
  {
    slug: 'propylthiouracil',
    name: 'Propylthiouracil',
    aliases: ['PTU'],
    category: 'pharmacological',
    mechanism: 'Thionamide antithyroid — same TPO inhibition as methimazole + additional inhibition of peripheral T4→T3 conversion. Preferred over methimazole in first-trimester pregnancy (lower teratogen risk) and in thyroid storm. Hepatotoxicity warning at high doses.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 600, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 170.23,
    refs: [],
  },
  {
    slug: 'allopurinol',
    name: 'Allopurinol',
    aliases: ['Zyloprim'],
    category: 'pharmacological',
    mechanism: 'Xanthine oxidase inhibitor — converts to active oxipurinol; both compete with hypoxanthine + xanthine for XO active site. Lowers serum uric acid in gout + tumor lysis syndrome. SCAR (severe cutaneous adverse reactions) risk in HLA-B*5801 carriers (Asian / African ancestry).',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 800, typical: 300, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 136.11,
    refs: [],
  },
  {
    slug: 'febuxostat',
    name: 'Febuxostat',
    aliases: ['Uloric'],
    category: 'pharmacological',
    mechanism: 'Non-purine xanthine oxidase inhibitor. More potent uric acid lowering than allopurinol. CARES trial (2018) showed CV mortality signal vs allopurinol → black-box warning + reserved for allopurinol-intolerant patients.',
    routes: ['PO'],
    doses: { 'PO': { min: 40, max: 80, typical: 40, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 316.37,
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0;
  let skipped = 0;
  for (const stub of STUBS) {
    if (bySlug.has(stub.slug)) {
      skipped++;
      continue;
    }
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');

  console.log('\nWave 0b third sub-batch — supplements + remaining Rx:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
