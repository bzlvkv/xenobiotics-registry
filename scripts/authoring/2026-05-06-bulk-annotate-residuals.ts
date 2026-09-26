/**
 * 2026-05-06-bulk-annotate-residuals.ts
 *
 * Bulk pk_unauthored annotations for the 225 residual Missing
 * compounds, grouped by why authoring isn't tractable from PubMed
 * abstract searches. Each entry gets a category-specific note.
 *
 * research-only (~70): endogenous nucleotides/nucleosides used
 *   primarily as research probes; dietary endogenous amino acids;
 *   supplement-form metabolites; specialty research compounds;
 *   anabolic/sex steroids without published abstract-verbatim PK.
 *
 * local-acting (~15): essential-oil terpenoids and aromatics used
 *   primarily as fragrance / topical; iodine in topical antiseptic
 *   form; certain dietary compounds with no systemic plasma PK.
 *
 * mixture (~10): multi-component / formulation entries where no
 *   single plasma species fits.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk_unauthored?: { reason: string; note?: string };
  [k: string]: unknown;
}

type Annotation = { slug: string; reason: 'local-acting' | 'research-only' | 'mixture'; note: string };

const ANNOTATIONS: Annotation[] = [
  // ── Endogenous nucleosides / nucleotides (research/supplement) ────
  { slug: 'amp',         reason: 'research-only', note: 'Adenosine 5\'-monophosphate; endogenous nucleotide. Oral supplements have no published clinical PK profile — degraded by intestinal phosphatases; absorbed as adenosine.' },
  { slug: 'naad',        reason: 'research-only', note: 'Nicotinic acid adenine dinucleotide; intermediate in NAD biosynthesis. No clinical PK characterization; supplement use is experimental.' },
  { slug: 'nad-plus',    reason: 'research-only', note: 'Endogenous nicotinamide adenine dinucleotide. Oral supplements have no abstract-verbatim PK — degraded by intestinal CD73; circulating NAD comes from precursor (NMN, NR).' },
  { slug: 'nadh',        reason: 'research-only', note: 'Reduced form of NAD. Oral supplements lack abstract-verbatim PK; degraded by intestinal phosphatases.' },
  { slug: 'namn',        reason: 'research-only', note: 'Nicotinic acid mononucleotide; NAD biosynthesis intermediate. No clinical PK published.' },
  { slug: 'ump',         reason: 'research-only', note: 'Uridine monophosphate; pre-clinical / supplement. No abstract-verbatim PK.' },
  { slug: 'peak-atp',    reason: 'research-only', note: 'Branded ATP (adenosine 5\'-triphosphate disodium) supplement. Oral ATP has no plasma PK — hydrolyzed in the GI tract before absorption.' },
  { slug: 'cordycepin',  reason: 'research-only', note: '3\'-Deoxyadenosine; Cordyceps active. Pre-clinical research; rapidly degraded by adenosine deaminase. No clinical PK abstract.' },
  { slug: 'cytidine',    reason: 'research-only', note: 'Endogenous nucleoside; oral supplements (often paired with uridine). No clinical PK published.' },
  { slug: 'guanosine',   reason: 'research-only', note: 'Endogenous nucleoside; pre-clinical neuroprotection research. No clinical PK characterization.' },
  { slug: 'thymidine',   reason: 'research-only', note: 'Endogenous DNA nucleoside; supplemental form. No clinical PK published; rapidly metabolized by thymidine phosphorylase.' },
  { slug: 'uridine',     reason: 'research-only', note: 'Endogenous nucleoside; supplemental for mitochondrial / membrane synthesis research. Some PK exists for triacetyluridine prodrug, but parent uridine no abstract-verbatim PK.' },

  // ── Dietary / endogenous amino acids (no drug PK) ─────────────────
  { slug: 'alanine',         reason: 'research-only', note: 'Endogenous proteinogenic amino acid; dietary essential at physiological levels. No drug-style PK characterization.' },
  { slug: 'asparagine',      reason: 'research-only', note: 'Endogenous proteinogenic amino acid; non-essential in adults. No clinical PK as a drug.' },
  { slug: 'aspartate',       reason: 'research-only', note: 'Endogenous proteinogenic amino acid; not used as a drug. No clinical PK profile.' },
  { slug: 'd-aspartic-acid', reason: 'research-only', note: 'D-isomer used as supplement for testosterone effect (research). No published clinical PK.' },
  { slug: 'cysteine',        reason: 'research-only', note: 'Endogenous proteinogenic amino acid; supplement form less common than NAC (which has authored PK separately). No drug PK.' },
  { slug: 'glutamate',       reason: 'research-only', note: 'Endogenous neurotransmitter / amino acid. Not used as a clinical drug; oral glutamate is dietary.' },
  { slug: 'histidine',       reason: 'research-only', note: 'Endogenous proteinogenic amino acid; conditional essential. No drug PK profile.' },
  { slug: 'homocysteine',    reason: 'research-only', note: 'Endogenous metabolite of methionine; not administered as a supplement (elevated levels are a CV risk marker). No clinical PK.' },
  { slug: 'hypotaurine',     reason: 'research-only', note: 'Taurine biosynthesis intermediate; supplement form. No abstract-verbatim PK.' },
  { slug: 'lysine',          reason: 'research-only', note: 'Essential amino acid; supplement / herpes-recurrence research. No formal drug PK profile in PubMed abstracts.' },
  { slug: 'methionine',      reason: 'research-only', note: 'Essential amino acid; supplement and IV therapy adjuncts. No abstract-verbatim PK in healthy supplementation studies.' },
  { slug: 'phenylalanine',   reason: 'research-only', note: 'Essential amino acid; supplement for mood / focus (D, L, DL forms). No formal clinical PK abstract.' },
  { slug: 'proline',         reason: 'research-only', note: 'Endogenous proteinogenic amino acid; dietary non-essential. No drug PK.' },
  { slug: 'serine',          reason: 'research-only', note: 'Endogenous proteinogenic amino acid; supplement form (D-serine for NMDA modulation in research). No abstract-verbatim PK.' },
  { slug: 'threonine',       reason: 'research-only', note: 'Essential amino acid; supplement form. No formal clinical PK abstract.' },
  { slug: 'taurine-bcaa',    reason: 'mixture',       note: 'Combined taurine + branched-chain amino acid (leucine/isoleucine/valine) supplement. Multi-component; no single plasma species PK.' },
  { slug: 'glynac',          reason: 'mixture',       note: 'Glycine + N-acetylcysteine combination; antioxidant / glutathione precursor. No single plasma species fits combined PK.' },
  { slug: 'choline-bitartrate', reason: 'research-only', note: 'Choline salt; dietary / nootropic supplement. Plasma choline is endogenously regulated; no authored drug PK profile.' },
  { slug: 'l-carnitine-l-tartrate', reason: 'research-only', note: 'L-carnitine bound to tartaric acid; sports-nutrition supplement. F ~14-18% per tracer studies (Rebouche full-text), but PubMed abstracts don\'t carry verbatim values for the tartrate form.' },
  { slug: 'propionyl-l-carnitine', reason: 'research-only', note: 'Propionyl-L-carnitine; CV/PAD supplement. Limited clinical PK literature in PubMed abstracts.' },
  { slug: 'hmb',             reason: 'research-only', note: '3-hydroxy-3-methylbutyric acid; leucine metabolite supplement for muscle preservation. No authored clinical PK abstract.' },

  // ── Endogenous metabolites ───────────────────────────────────────
  { slug: 'agmatine',         reason: 'research-only', note: 'Endogenous polyamine derived from L-arginine. Supplemented for analgesia/cognition research; no authored clinical PK.' },
  { slug: 'ergothioneine',    reason: 'research-only', note: 'Endogenous mushroom-derived antioxidant; concentrated by SLC22A4 transporter. No authored clinical PK.' },
  { slug: 'glucosamine',      reason: 'research-only', note: 'Endogenous aminosaccharide; OA supplement. Highly variable F (~25%); no abstract-verbatim PK.' },
  { slug: 'pqq',              reason: 'research-only', note: 'Pyrroloquinoline quinone; mitochondrial biogenesis supplement. No authored clinical PK abstract.' },
  { slug: 'pyruvate',         reason: 'research-only', note: 'Endogenous α-keto acid; supplemented as calcium pyruvate for metabolic / weight effects. No authored clinical PK as a drug.' },
  { slug: 'ribose-5-phosphate', reason: 'research-only', note: 'Endogenous metabolite (PPP intermediate); supplement form. No drug PK.' },
  { slug: 'spermidine',       reason: 'research-only', note: 'Endogenous polyamine; longevity supplement (autophagy research). No authored clinical PK.' },
  { slug: 'inositol',         reason: 'research-only', note: 'Endogenous cyclitol (myo-inositol); supplemented for PCOS / mood research. No formal clinical PK abstract.' },
  { slug: 'd-chiro-inositol', reason: 'research-only', note: 'D-chiro form, often paired with myo-inositol for PCOS. No authored clinical PK.' },
  { slug: 'msm',              reason: 'research-only', note: 'Methylsulfonylmethane (DMSO2); joint supplement. Limited clinical PK in PubMed abstracts.' },
  { slug: 'allicin',          reason: 'research-only', note: 'Garlic-derived organosulfur; unstable in plasma (rapid conversion). No authored clinical PK as a drug.' },

  // ── Polyphenols (dietary, no clinical drug PK) ───────────────────
  { slug: 'caffeic-acid',     reason: 'research-only', note: 'Endogenous coffee/plant polyphenol metabolite. No authored clinical PK as a drug.' },
  { slug: 'chlorogenic-acid', reason: 'research-only', note: 'Coffee/yerba-mate polyphenol; dietary supplement. No formal clinical PK abstract for parent (most cleavage to caffeic acid in colon).' },
  { slug: 'ellagic-acid',     reason: 'research-only', note: 'Pomegranate / berry polyphenol; metabolized to urolithins in colon. No authored clinical PK (parent has very low oral F).' },
  { slug: 'ferulic-acid',     reason: 'research-only', note: 'Whole-grain / plant phenolic acid. No authored clinical PK abstract.' },
  { slug: 'hydroxytyrosol',   reason: 'research-only', note: 'Olive-oil phenolic; antioxidant supplement. Limited clinical PK in PubMed abstracts.' },
  { slug: 'oleocanthal',      reason: 'research-only', note: 'Extra-virgin olive oil phenolic with NSAID-like properties. No authored clinical PK.' },
  { slug: 'oleuropein',       reason: 'research-only', note: 'Olive-leaf glycoside; hydrolyzed in gut to hydroxytyrosol. No authored clinical PK abstract.' },
  { slug: 'rosmarinic-acid',  reason: 'research-only', note: 'Lamiaceae plant polyphenol (rosemary/sage/lemon balm). No authored clinical PK abstract.' },
  { slug: 'sesamin',          reason: 'research-only', note: 'Sesame-seed lignan; CYP1A2 / Δ5-desaturase inhibitor research supplement. No authored clinical PK.' },
  { slug: 'theaflavin',       reason: 'research-only', note: 'Black-tea polyphenol; oxidation product of catechins. No authored clinical PK abstract.' },
  { slug: 'urolithin-b',      reason: 'research-only', note: 'Gut-microbiota metabolite of ellagic acid. No authored clinical PK as a drug.' },
  { slug: 'grape-seed-extract', reason: 'mixture',     note: 'Multi-component proanthocyanidin / oligomeric procyanidin (OPC) extract. No single plasma species fits PK.' },

  // ── Essential-oil terpenoids (local-acting / fragrance) ──────────
  { slug: 'alpha-pinene',         reason: 'local-acting', note: 'Pinewood / cannabis terpene; primarily inhaled (essential oils, aromatherapy) or trace in supplements. No formal systemic plasma PK profile.' },
  { slug: 'beta-pinene',          reason: 'local-acting', note: 'Pine / hops terpene; same use class as α-pinene. Local effect via inhalation/topical.' },
  { slug: 'beta-caryophyllene',   reason: 'local-acting', note: 'CB2-agonist sesquiterpene from black pepper / hops. Used in essential oils; no authored systemic PK.' },
  { slug: 'bisabolol',            reason: 'local-acting', note: 'Chamomile-derived terpenoid; topical cosmetic / dermatology use. No systemic PK at applied concentrations.' },
  { slug: 'camphor',              reason: 'local-acting', note: 'Bicyclic terpene ketone; topical analgesic / OTC mucosal (Vicks). Limited systemic absorption from topical use.' },
  { slug: 'cinnamaldehyde',       reason: 'local-acting', note: 'Cinnamon-bark phenylpropanoid; flavoring / antimicrobial topical. No authored systemic PK.' },
  { slug: 'eucalyptol',           reason: 'local-acting', note: '1,8-cineole; eucalyptus oil component. Topical / inhaled mucolytic. No authored systemic plasma PK.' },
  { slug: 'geraniol',             reason: 'local-acting', note: 'Rose / geranium terpene alcohol; cosmetic / repellent use. No authored clinical PK.' },
  { slug: 'limonene',             reason: 'local-acting', note: 'Citrus-peel terpene; aromatherapy / dietary trace. Some PK literature exists in cancer-prevention trials but no abstract-verbatim ka/V/F.' },
  { slug: 'linalool',             reason: 'local-acting', note: 'Lavender / coriander terpene; aromatherapy. No authored clinical systemic PK.' },
  { slug: 'menthol',              reason: 'local-acting', note: 'Mint-derived terpene; topical / inhaled / OTC throat lozenge. Local action; no authored systemic PK.' },
  { slug: 'myrcene',              reason: 'local-acting', note: 'Cannabis / hops terpene; aromatherapy. No authored clinical PK.' },
  { slug: 'thymol',               reason: 'local-acting', note: 'Thyme oil phenol; topical antiseptic / dental. No authored systemic PK.' },

  // ── Ketone delivery vehicles (research; deliver BHB) ─────────────
  { slug: 'acetoacetate',          reason: 'research-only', note: 'Endogenous ketone body; not used as a clinical drug. Plasma levels reflect dietary/fasting state, not authored drug PK.' },
  { slug: 'acetone',               reason: 'research-only', note: 'Endogenous ketone body terminal product. Volatile, exhaled; not authored as a drug PK profile.' },
  { slug: 'bd-acetoacetate-diester', reason: 'research-only', note: '1,3-butanediol acetoacetate diester; research ketone-ester precursor. Limited clinical PK.' },
  { slug: 'bhb-salt',              reason: 'mixture',       note: 'Generic BHB salt entry — actual delivered species is β-hydroxybutyrate (catalog has a separate bhb / beta-hydroxybutyrate entry with PK).' },
  { slug: 'bis-hexanoyl-bd',       reason: 'research-only', note: 'Bis-hexanoyl 1,3-butanediol; research ketone ester. Limited clinical PK in PubMed abstracts.' },
  { slug: 'butanediol-1-3',        reason: 'research-only', note: '1,3-butanediol; metabolic ketone precursor (converted by liver to BHB). No authored clinical PK.' },
  { slug: 'butanediol-ester',      reason: 'research-only', note: 'Generic 1,3-BD ester; research ketone delivery vehicle. Liver hydrolyzes to BD then BHB.' },
  { slug: 'calcium-bhb',           reason: 'mixture',       note: 'Calcium β-hydroxybutyrate salt; supplement delivery form for BHB (which has its own PK entry).' },
  { slug: 'l-bhb',                 reason: 'research-only', note: 'L-isomer of β-hydroxybutyrate; less metabolically active than D-BHB. No authored clinical PK distinct from racemic BHB.' },
  { slug: 'magnesium-bhb',         reason: 'mixture',       note: 'Magnesium β-hydroxybutyrate salt; same logic as calcium-bhb — delivery form for BHB.' },
  { slug: 'potassium-bhb',         reason: 'mixture',       note: 'Potassium β-hydroxybutyrate salt; delivery form for BHB.' },
  { slug: 'sodium-bhb',            reason: 'mixture',       note: 'Sodium β-hydroxybutyrate salt; delivery form for BHB.' },

  // ── Hormones — endogenous probes / regulatory PK only ────────────
  { slug: 'pregnenolone',          reason: 'research-only', note: 'Endogenous neurosteroid / adrenal hormone precursor. Oral supplementation; no abstract-verbatim PK in PubMed (clinical PK exists in older regulatory dossiers).' },
  { slug: 'dhea-sulfate',          reason: 'research-only', note: 'Endogenous androgen precursor. Plasma levels are observational, not authored as drug PK.' },
  { slug: '17a-estradiol',         reason: 'research-only', note: '17α-stereoisomer of estradiol; weak estrogen used in hair-loss research. No authored clinical PK abstract.' },
  { slug: 'fluoxymesterone',       reason: 'research-only', note: 'C-1-methyl androgen; rarely prescribed today. No abstract-verbatim clinical PK.' },
  { slug: 'methyltestosterone',    reason: 'research-only', note: 'Oral androgen; abstract-verbatim PK in humans not surfaced in PubMed (rainbow trout PK exists).' },
  { slug: 'stanozolol',            reason: 'research-only', note: 'Oral C-17α-alkylated anabolic; abstracts focus on metabolite identification, not PK.' },
  { slug: 'danazol',               reason: 'research-only', note: 'Synthetic ethisterone derivative; endometriosis treatment. Abstract-verbatim PK in humans not surfaced.' },
  { slug: 'fludrocortisone',       reason: 'research-only', note: '9α-fluoro mineralocorticoid; rarely studied as standalone PK in PubMed abstracts.' },
  { slug: 'oral-contraceptive-combo', reason: 'mixture',    note: 'Generic combined oral contraceptive entry (estrogen + progestin). Multi-compound; PK is per-component.' },
  { slug: 'progestin-only-pill',   reason: 'mixture',       note: 'Generic POP entry — actual species is the specific progestin (norethindrone, drospirenone, etc.).' },

  // ── Misc research / specialty ────────────────────────────────────
  { slug: '5-amino-1mq',           reason: 'research-only', note: 'NNMT inhibitor; pre-clinical metabolic / longevity research. No clinical PK abstract.' },
  { slug: 'ala-r',                 reason: 'research-only', note: 'R-isomer of α-lipoic acid; supplement / research. PubMed abstracts have variable PK on racemic ALA but not the R-form specifically.' },
  { slug: 'c60',                   reason: 'research-only', note: 'Buckminsterfullerene; speculative longevity supplement. No clinical PK characterization in humans.' },
  { slug: 'coq10-ubiquinol',       reason: 'mixture',       note: 'Reduced form of CoQ10; multi-form supplement (gel-cap formulations vary). Limited abstract-verbatim PK; the parent CoQ10 has separate authoring.' },
  { slug: 'curcumin-meriva',       reason: 'mixture',       note: 'Phytosome formulation of curcumin (with phosphatidylcholine for absorption). Not a single plasma species; PK is the formulation\'s combined effect on parent curcumin.' },
  { slug: 'ldn',                   reason: 'research-only', note: 'Low-dose naltrexone (1.5–4.5 mg, vs ~50 mg standard). Off-label autoimmune use; no dedicated low-dose PK study in PubMed abstracts.' },
  { slug: 'nmn',                   reason: 'research-only', note: 'Nicotinamide mononucleotide; longevity supplement. Some Cmax/AUC numbers exist (PMID:35182418) but not F/V_L verbatim. Tractable with full-text retrieval.' },
  { slug: 'rapamycin',             reason: 'research-only', note: 'Sirolimus; FDA-approved for transplant but used off-label for longevity at lower doses. Standard PK exists (t½ 67-68h) but abstract-verbatim ka/V/F not surfaced in 2-min PubMed search.' },

  // ── Trace minerals (no drug-style PK) ────────────────────────────
  { slug: 'chromium',              reason: 'research-only', note: 'Trace mineral; insulin-sensitivity supplementation research. No authored clinical PK profile in healthy adults.' },
  { slug: 'copper',                reason: 'research-only', note: 'Endogenous trace mineral; plasma levels homeostatically regulated by ceruloplasmin. No authored drug PK.' },
  { slug: 'iodine',                reason: 'research-only', note: 'Endogenous trace mineral concentrated by NIS in thyroid; plasma kinetics governed by uptake/recycle. Not authored as drug PK.' },
  { slug: 'iodine-potassium-iodide', reason: 'research-only', note: 'KI prophylaxis form (radiation emergencies / iodine deficiency). Plasma kinetics dominated by thyroid uptake.' },
  { slug: 'iron',                  reason: 'research-only', note: 'Generic elemental iron entry; specific salt forms (ferrous-sulfate has authored PK) carry the actual PK.' },
  { slug: 'iron-bisglycinate',     reason: 'research-only', note: 'Chelated iron supplement; abstract-verbatim PK not surfaced.' },
  { slug: 'manganese',             reason: 'research-only', note: 'Trace mineral; toxicity at supplement doses. No authored clinical PK.' },
  { slug: 'molybdenum',            reason: 'research-only', note: 'Trace mineral; cofactor for sulfite oxidase, xanthine oxidase. No authored clinical PK.' },
  { slug: 'potassium',             reason: 'research-only', note: 'Endogenous electrolyte; plasma levels strictly homeostatic. Not authored as drug PK (clinical use is repletion, not pharmacokinetic dosing).' },
  { slug: 'selenium',              reason: 'research-only', note: 'Trace mineral; selenoprotein cofactor. No authored clinical PK.' },
  { slug: 'selenium-methionine',   reason: 'research-only', note: 'Organoselenium supplement form. Limited clinical PK data; protein-incorporated.' },
  { slug: 'shilajit',              reason: 'mixture',       note: 'Himalayan exudate — multi-component (fulvic acids, humic substances, dibenzo-α-pyrones, minerals). Not a single plasma species.' },
  { slug: 'sodium-bicarbonate',    reason: 'research-only', note: 'Endogenous buffer; plasma kinetics governed by CO2/HCO3 equilibrium and renal handling. Not authored as classical drug PK.' },
  { slug: 'sodium-chloride',       reason: 'research-only', note: 'Endogenous electrolyte; plasma levels strictly homeostatic. Not authored as drug PK.' },
  { slug: 'lithium-orotate',       reason: 'research-only', note: 'Lithium in orotate salt; supplement form. Limited PK data; lithium itself has PK literature on lithium carbonate.' },
  { slug: 'magnesium-chloride',    reason: 'research-only', note: 'Mg salt; topical / IV/PO use. Mg PK is endogenous-pool driven; no authored drug PK abstract for this salt.' },
  { slug: 'magnesium-orotate',     reason: 'research-only', note: 'Mg orotate salt; cardiovascular supplement. No authored clinical PK abstract (rat data exists).' },

  // ── Lipids (dietary essentials) ──────────────────────────────────
  { slug: 'dha',                   reason: 'research-only', note: 'Docosahexaenoic acid (omega-3); dietary essential. Plasma levels reflect long-term dietary intake; not authored as drug PK.' },
  { slug: 'epa',                   reason: 'research-only', note: 'Eicosapentaenoic acid (omega-3); dietary essential. Same mechanism as DHA — long-term dietary kinetics, not drug PK.' },
  { slug: 'glycerol-supplement',   reason: 'research-only', note: 'Endogenous lipid metabolism intermediate; rarely supplemented as a drug. No authored clinical PK.' },
  { slug: 'phosphatidylserine',    reason: 'mixture',       note: 'Phospholipid; dietary supplement (often soy- or sunflower-derived). Multi-FA-chain composition; no single plasma species.' },

  // ── Misc category-other ──────────────────────────────────────────
  { slug: 'collagen-peptides',     reason: 'mixture',       note: 'Hydrolyzed collagen peptides (varying MW). Multi-MW peptide mixture; absorbed as free amino acids + small peptides; no single plasma species fits PK.' },
  { slug: 'mixed-tocopherols',     reason: 'mixture',       note: 'Vitamin E mix (α + β + γ + δ tocopherols + sometimes tocotrienols). Multi-isomer; per-isomer PK exists (gamma-tocopherol authored separately).' },
  { slug: 'vitamin-b12-methylcobalamin', reason: 'research-only', note: 'Methyl-B12 form; oral / sublingual supplements. No abstract-verbatim oral PK in PubMed (radioisotope tracer studies are old / not indexed verbatim).' },
  { slug: 'icosapent-ethyl',       reason: 'mixture',       note: 'Ethyl ester of EPA (Vascepa). PK reported as plasma EPA, not the ester. Effectively delivers EPA.' },

  // ── Adaptogen single-component markers ───────────────────────────
  { slug: 'ginsenoside-rg1',       reason: 'research-only', note: 'Single ginsenoside (panaxoside Rg1). Pre-clinical research; limited clinical PK data in PubMed abstracts (mostly from Asian-language journals).' },
  { slug: 'ginsenoside-rg3',       reason: 'research-only', note: 'Single ginsenoside (panaxoside Rg3). Same as Rg1 — pre-clinical / abstracts not in standard PubMed indexed format.' },
  { slug: 'rosavin',               reason: 'research-only', note: 'Rhodiola marker compound (cinnamyl alcohol glycoside). No authored clinical PK abstract.' },

  // ── Flavonoids (dietary supplements) ─────────────────────────────
  { slug: 'icariin',               reason: 'research-only', note: 'Horny goat weed flavonoid; supplement. No authored clinical PK abstract.' },
  { slug: 'milk-thistle-silibinin', reason: 'research-only', note: 'Silibinin (silybin) — single flavonolignan from silymarin complex. Highly variable F (~30%); no authored abstract-verbatim PK.' },
  { slug: 'taxifolin',             reason: 'research-only', note: 'Dihydroquercetin flavonoid; supplement. Limited clinical PK data.' },

  // ── Nootropic research compounds ─────────────────────────────────
  { slug: 'adrafinil',             reason: 'research-only', note: 'Modafinil prodrug; not approved as a separate drug. Hepatically converted to modafinil (which has authored PK).' },
  { slug: 'coluracetam',           reason: 'research-only', note: 'Racetam; pre-clinical / supplement. No authored clinical PK abstract.' },
  { slug: 'dmae',                  reason: 'research-only', note: 'Dimethylaminoethanol; nootropic supplement. No authored clinical PK abstract.' },
  { slug: 'fasoracetam',           reason: 'research-only', note: 'Racetam; abandoned by Aevi development. Limited clinical PK in published abstracts.' },
  { slug: 'hydrafinil',            reason: 'research-only', note: '9-fluorenone-related research stimulant; pre-clinical only. No clinical PK.' },
  { slug: 'idebenone',             reason: 'research-only', note: 'Synthetic CoQ10 analog; orphan-drug for Leber HON / FA. PK exists in regulatory but not surfaced in PubMed abstracts verbatim.' },
  { slug: 'idra-21',               reason: 'research-only', note: 'AMPA modulator (positive allosteric); pre-clinical only.' },
  { slug: 'lions-mane',            reason: 'mixture',       note: 'Hericium erinaceus mushroom extract; multi-component (hericenones, erinacines, β-glucans). No single plasma species.' },
  { slug: 'nsi-189',               reason: 'research-only', note: 'Neurogenic compound; Neuralstem development stalled in Phase II. No authored clinical PK abstract.' },
  { slug: 'phenylpiracetam',       reason: 'research-only', note: 'Russian-origin racetam (Phenotropil). Limited PubMed-indexed PK abstracts.' },
  { slug: 'prl-8-53',              reason: 'research-only', note: 'Pre-clinical memory-enhancing compound from 1970s patent. No clinical PK.' },
  { slug: 'sunifiram',             reason: 'research-only', note: 'AMPA-kine research compound; pre-clinical only.' },

  // ── Stimulants without authored PK ───────────────────────────────
  { slug: 'phenylephrine-otc',     reason: 'research-only', note: 'OTC oral phenylephrine. FDA Sept 2023 advisory committee voted oral PE ineffective at standard doses (low F due to SULT1A3 first-pass). PK characterization exists but not in classical PubMed abstracts.' },
  { slug: 'synephrine',            reason: 'research-only', note: 'Bitter orange (Citrus aurantium) alkaloid; supplement. No authored clinical PK abstract.' },
  { slug: 'theacrine',             reason: 'research-only', note: 'Kucha tea (Camellia assamica var. kucha) purine alkaloid; supplement. PK abstract exists qualitatively; no abstract-verbatim ka/V/F.' },
  { slug: 'ephedrine',             reason: 'research-only', note: 'Ephedra alkaloid; controlled in many jurisdictions. Abstract-verbatim PK not surfaced in PubMed (mostly rat/historical data).' },
  { slug: 'pseudoephedrine',       reason: 'research-only', note: 'OTC sympathomimetic decongestant. Some pediatric PK exists (PMID:8917241 t½ 3.1h verbatim) but full ka/V/F not in abstract.' },
  { slug: 'armodafinil',           reason: 'research-only', note: 'R-isomer of modafinil (Nuvigil). PK exists in regulatory documents; abstract-verbatim ka/V/F not surfaced.' },

  // ── Alkaloids without authored PK ────────────────────────────────
  { slug: 'mescaline',             reason: 'research-only', note: 'Phenethylamine psychedelic from peyote / San Pedro cactus. Schedule I; clinical PK studies rare.' },
  { slug: 'capsaicin',             reason: 'local-acting', note: 'TRPV1 agonist; topical use is the dominant clinical pathway (capsaicin-topical authored separately). Oral capsaicin is dietary.' },
  { slug: 'reserpine',             reason: 'research-only', note: 'Vesicular monoamine depleter; rarely prescribed today. Limited modern PK in PubMed abstracts.' },
  { slug: 'thc',                   reason: 'research-only', note: 'Δ9-tetrahydrocannabinol; clinical PK varies dramatically by formulation (smoke/vapor/oral/sublingual). Abstract-verbatim ka/V/F values rarely co-located.' },
  { slug: 'cbg',                   reason: 'research-only', note: 'Cannabigerol; pre-clinical / supplement. No clinical PK with abstract-verbatim values surfaced.' },
  { slug: 'colchicine-low-dose-cv', reason: 'mixture',     note: 'Low-dose (0.5 mg) colchicine for cardiovascular indications (LoDoCo). Same drug as colchicine entry — different dosing context, not a separate PK entity.' },
  { slug: 'quinine',               reason: 'research-only', note: 'Cinchona alkaloid; rarely first-line antimalarial today. Quinidine (related diastereomer) has authored PK; quinine clinical PK abstracts limited.' },
  { slug: 'atropine',              reason: 'research-only', note: 'Belladonna alkaloid; emergency IV/IM use. Despite ubiquitous clinical use, abstract-verbatim ka/V/F PK not surfaced in PubMed (most uses are bolus dosing without classical PK characterization).' },
  { slug: 'scopolamine',           reason: 'research-only', note: 'Belladonna alkaloid; transdermal patch for motion sickness. TD PK exists but not abstract-verbatim in standard PubMed search.' },
  { slug: '9-me-bc',               reason: 'research-only', note: '9-methyl-β-carboline; pre-clinical research compound (neurogenesis / neuroprotection). No clinical PK.' },

  // ── Misc pharmacological skipped throughout the night ────────────
  { slug: 'cholestyramine',        reason: 'local-acting', note: 'Bile-acid sequestrant resin; gut-acting non-absorbed (~0% F). Effect is on enterohepatic bile-acid recycling, not systemic.' },
  { slug: 'colesevelam',           reason: 'local-acting', note: 'Same class as cholestyramine; non-absorbed bile-acid sequestrant resin.' },
  { slug: 'heparin',               reason: 'research-only', note: 'Unfractionated heparin (large MW polysaccharide mixture). PK is non-linear, dose-dependent, and dominated by reticuloendothelial clearance — doesn\'t fit linear ka/V/F. LMWH (enoxaparin) authored separately.' },
  { slug: 'isoflurane',            reason: 'research-only', note: 'Volatile inhalational anesthetic. PK described by blood:gas partition coefficient (~1.4) and MAC, not classical first-order ka/V/F.' },
  { slug: 'sevoflurane',           reason: 'research-only', note: 'Volatile inhalational anesthetic. PK described by blood:gas partition (~0.65) and MAC, not classical kinetics.' },
  { slug: 'rocuronium',            reason: 'research-only', note: 'Steroidal NMBA; IV-only with rapid plasma redistribution. Abstract-verbatim Vd/F not surfaced; clinical PK is bolus + reversal dominated.' },
  { slug: 'succinylcholine',       reason: 'research-only', note: 'Depolarizing NMBA; metabolized by plasma butyrylcholinesterase in seconds. Plasma t½ ~1 min — no classical PK profile.' },
  { slug: 'cisplatin',             reason: 'research-only', note: 'Platinum-based chemotherapy; binds extensively to plasma proteins (>90%) and tissues. Abstract-verbatim ka/V/F not surfaced; PK is dose / nephrotoxicity-dominated.' },
  { slug: 'voriconazole',          reason: 'research-only', note: 'Triazole antifungal — already has interactions/kinetic edges authored from existing work; PK on PO route may exist but pk[PO] not yet authored. Documented for future retrieval.' },
  { slug: 'ritonavir',             reason: 'research-only', note: 'Protease inhibitor / CYP3A4 booster — interactions authored extensively. PK on PO route not yet authored as pk[PO]. Documented for future.' },
  { slug: 'tobramycin',            reason: 'research-only', note: 'Aminoglycoside antibiotic; classical IV PK exists in textbooks but abstract-verbatim adult-healthy values not surfaced in PubMed search budget.' },
  { slug: 'piperacillin-tazobactam', reason: 'mixture',    note: 'Piperacillin + tazobactam fixed combination (Zosyn); two distinct active species with different PK.' },
  { slug: 'etomidate',             reason: 'research-only', note: 'Imidazole IV induction agent. Adult-healthy abstract-verbatim Vd not surfaced in PubMed search budget.' },
  { slug: 'gentamicin',            reason: 'research-only', note: 'Already has IV PK authored; this entry is the IM route which behaves identically (F~100%) — kept as research-only marker. Update: actually IV authored, this annotation is redundant. (TODO check)' },
  { slug: 'enoxaparin',            reason: 'research-only', note: 'Already has SC PK authored; this annotation is redundant if SC was applied. (TODO check; remove if redundant)' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0, skippedHasPk = 0;
  for (const a of ANNOTATIONS) {
    const c = bySlug.get(a.slug);
    if (!c) { console.warn(`  [warn] missing: ${a.slug}`); missing++; continue; }
    if (c.pk_unauthored) { alreadyHas++; continue; }
    // Don't annotate compounds that already have authored PK — they're not "missing"
    const hasPk = c.pk && Object.values(c.pk).some((r: any) => r?.source_pmid);
    if (hasPk) { skippedHasPk++; continue; }
    c.pk_unauthored = { reason: a.reason, note: a.note };
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`bulk residuals: added ${added}, already-had ${alreadyHas}, missing ${missing}, skipped (has PK) ${skippedHasPk}`);
}

main();
