/**
 * 2026-05-03-wave-0b-onco-eye-derm.ts — Wave 0b fourth sub-batch.
 *
 * Continuing the v1.0 catalog push — covers four therapeutic clusters
 * that were thin in the catalog:
 *   - Oncology / cancer hormones (TKIs, aromatase inhibitors, AR
 *     antagonists, common cytotoxics)
 *   - Ophthalmic glaucoma drops
 *   - Anti-emetic D2 antagonists
 *   - Topical antifungals (azoles + allylamines)
 *   - Immunosuppressants (transplant + autoimmune)
 *   - Carotenoids + remaining single-molecule vitamins
 *   - Misc clinical: oxymetazoline (decongestant), promethazine,
 *     mycophenolate, azathioprine
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
  // ── ONCOLOGY: TYROSINE-KINASE INHIBITORS ──────────────────────────
  {
    slug: 'imatinib',
    name: 'Imatinib',
    aliases: ['Gleevec', 'STI571'],
    category: 'pharmacological',
    mechanism: 'First-in-class targeted-cancer drug — competitive ATP-site inhibitor of BCR-ABL tyrosine kinase (chronic myeloid leukemia) plus c-Kit (GIST) and PDGFR. Transformed CML from a fatal disease into a chronic condition. CYP3A4 substrate + moderate inhibitor.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 800, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 493.60,
    refs: [],
  },
  {
    slug: 'nilotinib',
    name: 'Nilotinib',
    aliases: ['Tasigna'],
    category: 'pharmacological',
    mechanism: 'Second-generation BCR-ABL tyrosine kinase inhibitor; ~30× imatinib potency. Used in imatinib-resistant or front-line CML. Strong CYP3A4 inhibitor; QT prolongation black-box. Food triples Cmax — must be taken fasted.',
    routes: ['PO'],
    doses: { 'PO': { min: 300, max: 800, typical: 600, unit: 'mg' } },
    half_life_hr: { 'PO': 17 },
    mw_g_mol: 529.52,
    refs: [],
  },
  {
    slug: 'erlotinib',
    name: 'Erlotinib',
    aliases: ['Tarceva'],
    category: 'pharmacological',
    mechanism: 'EGFR tyrosine kinase inhibitor — competitive ATP-site blockade. First-line therapy for EGFR-mutant non-small-cell lung cancer. CYP3A4 substrate. Acneiform rash (~75%) correlates with response. Smoking induces CYP1A2-mediated clearance, lowering levels.',
    routes: ['PO'],
    doses: { 'PO': { min: 100, max: 150, typical: 150, unit: 'mg' } },
    half_life_hr: { 'PO': 36 },
    mw_g_mol: 393.44,
    refs: [],
  },
  {
    slug: 'sorafenib',
    name: 'Sorafenib',
    aliases: ['Nexavar'],
    category: 'pharmacological',
    mechanism: 'Multi-kinase inhibitor — BRAF, VEGFR, PDGFR, c-Kit, FLT3, RET. Used for hepatocellular carcinoma + advanced renal cell carcinoma + radioactive-iodine refractory thyroid cancer. Hand-foot skin reaction + hypertension common.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 800, typical: 800, unit: 'mg' } },
    half_life_hr: { 'PO': 30 },
    mw_g_mol: 464.83,
    refs: [],
  },

  // ── ONCOLOGY: HORMONE THERAPY (breast / prostate cancer) ──────────
  {
    slug: 'anastrozole',
    name: 'Anastrozole',
    aliases: ['Arimidex'],
    category: 'pharmacological',
    mechanism: 'Non-steroidal aromatase inhibitor — competitive blockade of CYP19A1 prevents androgen-to-estrogen conversion. First-line adjuvant therapy for ER-positive breast cancer in postmenopausal women. Bone density loss requires DXA monitoring + Ca/D supplementation.',
    routes: ['PO'],
    doses: { 'PO': { min: 1, max: 1, typical: 1, unit: 'mg' } },
    half_life_hr: { 'PO': 50 },
    mw_g_mol: 293.37,
    refs: [],
  },
  {
    slug: 'exemestane',
    name: 'Exemestane',
    aliases: ['Aromasin'],
    category: 'pharmacological',
    mechanism: 'Steroidal aromatase inhibitor — irreversible inactivation of CYP19A1 (vs the reversible non-steroidal AIs anastrozole + letrozole). Adjuvant or sequential therapy in postmenopausal ER-positive breast cancer.',
    routes: ['PO'],
    doses: { 'PO': { min: 25, max: 25, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 296.40,
    refs: [],
  },
  {
    slug: 'abiraterone',
    name: 'Abiraterone',
    aliases: ['Zytiga'],
    category: 'pharmacological',
    mechanism: 'CYP17A1 (17α-hydroxylase / C17,20-lyase) inhibitor — blocks androgen biosynthesis in testes, adrenals, and prostate tumor cells. Used with prednisone to mitigate compensatory mineralocorticoid excess from upstream pregnenolone accumulation. Castration-resistant prostate cancer.',
    routes: ['PO'],
    doses: { 'PO': { min: 500, max: 1000, typical: 1000, unit: 'mg' } },
    half_life_hr: { 'PO': 14 },
    mw_g_mol: 349.51,
    refs: [],
  },
  {
    slug: 'enzalutamide',
    name: 'Enzalutamide',
    aliases: ['Xtandi'],
    category: 'pharmacological',
    mechanism: 'Androgen receptor antagonist — blocks AR ligand binding, AR nuclear translocation, and AR-DNA binding. Stronger than first-generation bicalutamide. Castration-resistant prostate cancer. Strong CYP3A4 inducer (auto-induces own clearance + lowers many co-medications).',
    routes: ['PO'],
    doses: { 'PO': { min: 40, max: 160, typical: 160, unit: 'mg' } },
    half_life_hr: { 'PO': 130 },
    mw_g_mol: 464.44,
    refs: [],
  },
  {
    slug: 'bicalutamide',
    name: 'Bicalutamide',
    aliases: ['Casodex'],
    category: 'pharmacological',
    mechanism: 'First-generation non-steroidal AR antagonist. Used in combined androgen blockade for prostate cancer; also off-label for transgender hormone therapy as an antiandrogen with minimal endocrine side effects. CYP3A4 substrate.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 150, typical: 50, unit: 'mg' } },
    half_life_hr: { 'PO': 144 },
    mw_g_mol: 430.37,
    refs: [],
  },

  // ── ONCOLOGY: COMMON CYTOTOXICS ───────────────────────────────────
  {
    slug: 'doxorubicin',
    name: 'Doxorubicin',
    aliases: ['Adriamycin'],
    category: 'pharmacological',
    mechanism: 'Anthracycline antineoplastic — DNA intercalation + topoisomerase II poisoning + iron-mediated ROS generation. Workhorse of breast / lymphoma / sarcoma regimens. Cumulative-dose cardiomyopathy is the dose-limiting toxicity (lifetime ceiling ~450 mg/m²).',
    routes: ['IV'],
    doses: { 'IV': { min: 30, max: 90, typical: 60, unit: 'mg' } },
    half_life_hr: { 'IV': 30 },
    mw_g_mol: 543.52,
    refs: [],
  },
  {
    slug: 'cisplatin',
    name: 'Cisplatin',
    aliases: [],
    category: 'pharmacological',
    mechanism: 'Platinum-based DNA crosslinker — covalently binds N7 of guanine forming intra- and inter-strand adducts that block DNA replication. Backbone of testicular, lung, head-and-neck, ovarian regimens. Nephrotoxicity, ototoxicity, severe nausea — pre-medication with antiemetics + IV hydration mandatory.',
    routes: ['IV'],
    doses: { 'IV': { min: 50, max: 100, typical: 75, unit: 'mg' } },
    half_life_hr: { 'IV': 80 },
    mw_g_mol: 300.05,
    refs: [],
  },
  {
    slug: 'cyclophosphamide',
    name: 'Cyclophosphamide',
    aliases: ['Cytoxan'],
    category: 'pharmacological',
    mechanism: 'Nitrogen-mustard alkylating prodrug — CYP2B6 + CYP3A4 oxidation produces phosphoramide mustard (cytotoxic) + acrolein (urotoxic — mesna co-administration prevents hemorrhagic cystitis). Used in lymphoma + breast + lupus + vasculitis regimens.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 50, max: 100, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 6 },
    mw_g_mol: 261.09,
    refs: [],
  },
  {
    slug: 'paclitaxel',
    name: 'Paclitaxel',
    aliases: ['Taxol'],
    category: 'pharmacological',
    mechanism: 'Taxane microtubule stabilizer — binds β-tubulin, prevents depolymerization, freezes the mitotic spindle. Originally from Pacific yew bark. Workhorse of breast + ovarian + lung regimens. CYP3A4/2C8 substrate. Hypersensitivity to Cremophor EL vehicle requires premedication; abraxane (albumin-bound) sidesteps this.',
    routes: ['IV'],
    doses: { 'IV': { min: 80, max: 175, typical: 175, unit: 'mg' } },
    half_life_hr: { 'IV': 18 },
    mw_g_mol: 853.91,
    refs: [],
  },
  {
    slug: '5-fluorouracil',
    name: '5-Fluorouracil',
    aliases: ['5-FU', 'Adrucil'],
    category: 'pharmacological',
    mechanism: 'Pyrimidine antimetabolite — converted intracellularly to FdUMP (irreversible thymidylate-synthase inhibitor) and FUTP (RNA misincorporation). Backbone of colorectal, breast, GI cancer regimens. DPYD deficiency causes life-threatening toxicity (mandatory testing in some EU countries).',
    routes: ['IV', 'TD'],
    doses: { 'IV': { min: 400, max: 1000, typical: 500, unit: 'mg' } },
    half_life_hr: { 'IV': 0.3 },
    mw_g_mol: 130.08,
    refs: [],
  },

  // ── IMMUNOSUPPRESSANTS ────────────────────────────────────────────
  {
    slug: 'mycophenolate',
    name: 'Mycophenolate Mofetil',
    aliases: ['CellCept', 'MMF'],
    category: 'pharmacological',
    mechanism: 'Prodrug of mycophenolic acid — selectively inhibits IMPDH2 (lymphocytes lack purine salvage and depend on de novo synthesis). Suppresses B + T cell proliferation. Backbone of transplant immunosuppression alongside calcineurin inhibitors; also lupus nephritis induction therapy.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 1000, max: 3000, typical: 2000, unit: 'mg' } },
    half_life_hr: { 'PO': 18 },
    mw_g_mol: 433.50,
    refs: [],
  },
  {
    slug: 'azathioprine',
    name: 'Azathioprine',
    aliases: ['Imuran'],
    category: 'pharmacological',
    mechanism: 'Prodrug of 6-mercaptopurine — incorporated into DNA as thioguanine nucleotides causing immunosuppression. TPMT polymorphism (~10% intermediate, ~0.3% deficient) drives marked toxicity variability — pre-treatment TPMT/NUDT15 genotyping standard. IBD + autoimmune + steroid-sparing transplant maintenance.',
    routes: ['PO'],
    doses: { 'PO': { min: 50, max: 200, typical: 150, unit: 'mg' } },
    half_life_hr: { 'PO': 5 },
    mw_g_mol: 277.26,
    refs: [],
  },

  // ── OPHTHALMIC GLAUCOMA DROPS ─────────────────────────────────────
  {
    slug: 'latanoprost',
    name: 'Latanoprost',
    aliases: ['Xalatan'],
    category: 'pharmacological',
    mechanism: 'Prostaglandin F2α analog (FP receptor agonist) — increases uveoscleral aqueous humor outflow → lowers intraocular pressure. First-line topical for open-angle glaucoma. Iris pigmentation darkening + eyelash growth (used off-label for cosmetic eyelashes — bimatoprost is the FDA-approved version).',
    routes: ['TD'],
    doses: { 'TD': { min: 0.005, max: 0.005, typical: 0.005, unit: 'mg' } },
    half_life_hr: { 'TD': 4 },
    mw_g_mol: 432.59,
    refs: [],
  },
  {
    slug: 'bimatoprost',
    name: 'Bimatoprost',
    aliases: ['Lumigan', 'Latisse'],
    category: 'pharmacological',
    mechanism: 'Prostamide F2α analog — same uveoscleral-outflow mechanism as latanoprost; topical formulation also FDA-approved for hypotrichosis (eyelash growth) as Latisse. Iris pigmentation change + periocular skin darkening.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.0003, max: 0.0003, typical: 0.0003, unit: 'mg' } },
    half_life_hr: { 'TD': 1 },
    mw_g_mol: 415.57,
    refs: [],
  },
  {
    slug: 'timolol-eye',
    name: 'Timolol (ophthalmic)',
    aliases: ['Timoptic'],
    category: 'pharmacological',
    mechanism: 'Non-selective β-adrenergic blocker — reduces aqueous humor production by ciliary epithelium → lowers intraocular pressure. Topical application has meaningful systemic absorption — cardiovascular + bronchoconstriction concerns in COPD/asthma + bradycardia.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.25, max: 0.5, typical: 0.5, unit: 'mg' } },
    half_life_hr: { 'TD': 4 },
    mw_g_mol: 316.42,
    refs: [],
  },
  {
    slug: 'brimonidine',
    name: 'Brimonidine',
    aliases: ['Alphagan'],
    category: 'pharmacological',
    mechanism: 'Selective α2-adrenergic agonist (ophthalmic) — reduces aqueous humor production + increases uveoscleral outflow. Used in open-angle glaucoma + ocular hypertension. Topical rosacea formulation (Mirvaso) uses the same compound for vasoconstrictive erythema reduction.',
    routes: ['TD'],
    doses: { 'TD': { min: 0.1, max: 0.2, typical: 0.2, unit: 'mg' } },
    half_life_hr: { 'TD': 3 },
    mw_g_mol: 292.13,
    refs: [],
  },
  {
    slug: 'dorzolamide',
    name: 'Dorzolamide',
    aliases: ['Trusopt'],
    category: 'pharmacological',
    mechanism: 'Topical carbonic anhydrase II inhibitor — reduces aqueous humor production by ciliary epithelium. Often combined with timolol. Sulfonamide moiety → cross-allergenicity caveat with sulfa-allergic patients (though clinically rare).',
    routes: ['TD'],
    doses: { 'TD': { min: 1, max: 2, typical: 2, unit: 'mg' } },
    half_life_hr: { 'TD': 4 },
    mw_g_mol: 324.43,
    refs: [],
  },

  // ── ANTI-EMETIC / DOPAMINE ANTAGONISTS ────────────────────────────
  {
    slug: 'prochlorperazine',
    name: 'Prochlorperazine',
    aliases: ['Compazine'],
    category: 'pharmacological',
    mechanism: 'Phenothiazine D2 antagonist — antiemetic via chemoreceptor trigger zone D2 blockade. Anti-dopaminergic side effects (EPS, akathisia, dystonia) limit chronic use. Common for migraine + chemotherapy nausea + vertigo.',
    routes: ['PO', 'IV', 'IM', 'PR'],
    doses: { 'PO': { min: 5, max: 25, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 7 },
    mw_g_mol: 373.95,
    refs: [],
  },
  {
    slug: 'promethazine',
    name: 'Promethazine',
    aliases: ['Phenergan'],
    category: 'pharmacological',
    mechanism: 'Phenothiazine first-generation H1 antihistamine + D2 antagonist + muscarinic antagonist. Sedating antiemetic + motion-sickness agent. IV extravasation causes severe tissue necrosis — black-box prefers deep IM or central line.',
    routes: ['PO', 'IM', 'IV', 'PR'],
    doses: { 'PO': { min: 12.5, max: 50, typical: 25, unit: 'mg' } },
    half_life_hr: { 'PO': 12 },
    mw_g_mol: 284.42,
    refs: [],
  },

  // ── TOPICAL ANTIFUNGALS ───────────────────────────────────────────
  {
    slug: 'clotrimazole',
    name: 'Clotrimazole',
    aliases: ['Lotrimin', 'Mycelex'],
    category: 'topical',
    mechanism: 'Imidazole topical antifungal — fungal CYP51 (lanosterol 14α-demethylase) inhibitor blocking ergosterol synthesis. OTC for tinea + cutaneous candidiasis + vaginal candidiasis. Minimal systemic absorption from topical route.',
    routes: ['TD'],
    doses: { 'TD': { min: 10, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'TD': 4 },
    mw_g_mol: 344.84,
    refs: [],
  },
  {
    slug: 'terbinafine',
    name: 'Terbinafine',
    aliases: ['Lamisil'],
    category: 'pharmacological',
    mechanism: 'Allylamine antifungal — squalene epoxidase inhibitor blocking ergosterol synthesis upstream of CYP51. Highly lipophilic + keratin-binding → systemic dosing for onychomycosis (~3 month course). Strong CYP2D6 inhibitor (DDI with antidepressants, β-blockers).',
    routes: ['PO', 'TD'],
    doses: { 'PO': { min: 250, max: 250, typical: 250, unit: 'mg' } },
    half_life_hr: { 'PO': 22 },
    mw_g_mol: 291.43,
    refs: [],
  },
  {
    slug: 'miconazole',
    name: 'Miconazole',
    aliases: ['Monistat'],
    category: 'topical',
    mechanism: 'Imidazole antifungal — fungal CYP51 inhibitor. OTC topical + intravaginal for cutaneous + vulvovaginal candidiasis. Oral gel formulation (for thrush) carries CYP3A4 inhibition concerns from systemic absorption — interaction with warfarin + statins.',
    routes: ['TD'],
    doses: { 'TD': { min: 20, max: 200, typical: 100, unit: 'mg' } },
    half_life_hr: { 'TD': 24 },
    mw_g_mol: 416.13,
    refs: [],
  },
  {
    slug: 'mupirocin',
    name: 'Mupirocin',
    aliases: ['Bactroban'],
    category: 'topical',
    mechanism: 'Topical antibacterial — inhibits bacterial isoleucyl-tRNA synthetase. Active against staphylococci + streptococci including MRSA. Used for impetigo + nasal MRSA decolonization before surgery / dialysis catheter placement.',
    routes: ['TD'],
    doses: { 'TD': { min: 5, max: 30, typical: 20, unit: 'mg' } },
    half_life_hr: { 'TD': 1 },
    mw_g_mol: 500.62,
    refs: [],
  },

  // ── DECONGESTANT (topical) ────────────────────────────────────────
  {
    slug: 'oxymetazoline',
    name: 'Oxymetazoline',
    aliases: ['Afrin'],
    category: 'topical',
    mechanism: 'Imidazoline α1A + partial α2 adrenergic agonist — topical vasoconstrictor for nasal congestion. Rebound congestion (rhinitis medicamentosa) develops with use >3 days. Topical formulation also approved for adult facial rosacea erythema (Rhofade).',
    routes: ['IN', 'TD'],
    doses: { 'IN': { min: 0.05, max: 0.05, typical: 0.05, unit: 'mg' } },
    half_life_hr: { 'IN': 6 },
    mw_g_mol: 260.38,
    refs: [],
  },

  // ── CAROTENOIDS + ADDITIONAL VITAMINS ─────────────────────────────
  {
    slug: 'beta-carotene',
    name: 'β-Carotene',
    aliases: ['Provitamin A'],
    category: 'vitamin',
    mechanism: 'C40 tetraterpenoid — cleaved by β-carotene 15,15\'-monooxygenase (BCO1) to two retinals → retinol. Lipid-soluble antioxidant + provitamin A. High-dose supplementation associated with increased lung cancer in smokers (CARET, ATBC trials) — dietary food sources preferred.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 30, typical: 15, unit: 'mg' } },
    half_life_hr: { 'PO': 168 },
    mw_g_mol: 536.87,
    refs: [],
  },
  {
    slug: 'lutein',
    name: 'Lutein',
    aliases: [],
    category: 'vitamin',
    mechanism: 'Xanthophyll carotenoid — concentrated in retinal macula where it filters blue light + scavenges singlet oxygen. AREDS2 trial showed reduced progression to advanced age-related macular degeneration with lutein + zeaxanthin (replacing the unsafe-in-smokers β-carotene).',
    routes: ['PO'],
    doses: { 'PO': { min: 6, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 568.87,
    refs: [],
  },
  {
    slug: 'zeaxanthin',
    name: 'Zeaxanthin',
    aliases: [],
    category: 'vitamin',
    mechanism: 'Xanthophyll carotenoid concentrated alongside lutein in retinal macula. AREDS2 macular protection. Stereoisomer meso-zeaxanthin is dietarily rare but accumulates in foveal center.',
    routes: ['PO'],
    doses: { 'PO': { min: 1, max: 4, typical: 2, unit: 'mg' } },
    half_life_hr: { 'PO': 24 },
    mw_g_mol: 568.87,
    refs: [],
  },
  {
    slug: 'astaxanthin',
    name: 'Astaxanthin',
    aliases: [],
    category: 'vitamin',
    mechanism: 'Keto-carotenoid pigment from Haematococcus algae (and dietary salmon, krill). High oxygen-radical absorbance — antioxidant on lipid-membrane peroxidation. Skin photoprotection + cardiovascular benefit signals in small trials.',
    routes: ['PO'],
    doses: { 'PO': { min: 2, max: 12, typical: 6, unit: 'mg' } },
    half_life_hr: { 'PO': 16 },
    mw_g_mol: 596.84,
    refs: [],
  },
  {
    slug: 'lycopene',
    name: 'Lycopene',
    aliases: [],
    category: 'vitamin',
    mechanism: 'Acyclic carotenoid — primary red pigment of tomatoes; absorption increases with cooking + fat. Strong singlet-oxygen quencher. Epidemiologic association with reduced prostate cancer; randomized trial evidence modest.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 30, typical: 15, unit: 'mg' } },
    half_life_hr: { 'PO': 36 },
    mw_g_mol: 536.87,
    refs: [],
  },
  {
    slug: 'phylloquinone',
    name: 'Phylloquinone',
    aliases: ['Vitamin K1', 'Phytonadione', 'Mephyton'],
    category: 'vitamin',
    mechanism: 'Plant-source vitamin K (leafy greens) — cofactor for γ-carboxylation of glutamate residues on coagulation factors II, VII, IX, X + proteins C/S. IV/IM/PO antidote for warfarin overdose. Slow oral onset (~12-24h) for mild reversal; IV for emergent.',
    routes: ['PO', 'IV', 'SC'],
    doses: { 'PO': { min: 1, max: 10, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 1.5 },
    mw_g_mol: 450.71,
    refs: [],
  },
  {
    slug: 'biotin',
    name: 'Biotin',
    aliases: ['Vitamin B7', 'Vitamin H'],
    category: 'vitamin',
    mechanism: 'B-complex coenzyme for four carboxylase enzymes (PCC, ACC, MCC, PC) — essential for fatty-acid synthesis, gluconeogenesis, amino-acid metabolism. Hair / nail / skin marketing; mostly placebo in non-deficient adults. High-dose supplements interfere with troponin / TSH biotin-streptavidin lab assays — clinically problematic false readings.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.03, max: 10, typical: 5, unit: 'mg' } },
    half_life_hr: { 'PO': 2 },
    mw_g_mol: 244.31,
    refs: [],
  },
  {
    slug: 'riboflavin',
    name: 'Riboflavin',
    aliases: ['Vitamin B2'],
    category: 'vitamin',
    mechanism: 'B-complex precursor of FMN + FAD — flavin coenzymes for ~80 oxidoreductases (electron transport chain, fatty acid β-oxidation, glutathione redox). High-dose (400 mg/d) is migraine prophylactic per several RCTs. Yellow-orange urine is harmless excess excretion.',
    routes: ['PO'],
    doses: { 'PO': { min: 1.3, max: 400, typical: 100, unit: 'mg' } },
    half_life_hr: { 'PO': 1.4 },
    mw_g_mol: 376.36,
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

  console.log('\nWave 0b fourth sub-batch — onco / eye / derm / immuno:');
  console.log(`  Added: ${added}`);
  console.log(`  Skipped (already present): ${skipped}`);
  console.log(`  Catalog: ${data.length} compounds`);
}

main();
