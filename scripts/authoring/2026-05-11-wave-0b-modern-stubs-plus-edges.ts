/**
 * 2026-05-11-wave-0b-modern-stubs-plus-edges.ts — 15 modern compound
 * stubs + 3 perpetrator edges (v1.1).
 *
 * Catalog gap closure: 12 small-molecule modern drugs + 2 mAbs +
 * tolbutamide were missing despite their clinical prominence. Plus
 * three new perpetrator edges land in the same session.
 *
 * ── New compounds (15) ────────────────────────────────────────────
 *
 * Small-molecule HCV DAAs (3):
 *   daclatasvir       NS5A inhibitor, displaced by glecaprevir
 *   elbasvir          NS5A — Zepatier component (with grazoprevir)
 *   grazoprevir       NS3/4A protease inhibitor — Zepatier component
 *
 * HIV integrase inhibitor (1):
 *   elvitegravir      Stribild / Genvoya component, requires COBI boost
 *
 * BTK / Bcl-2 / oncology (3):
 *   ibrutinib         BTK inhibitor, CLL/MCL/WM — strong CYP3A4 substrate
 *   acalabrutinib     2nd-gen BTK — less off-target than ibrutinib
 *   venetoclax        Bcl-2 inhibitor, CLL/AML — strong CYP3A4 substrate
 *                     with risk of tumor lysis syndrome at initiation
 *
 * JAK inhibitors (2):
 *   upadacitinib      JAK1-selective — RA/AD/UC
 *   ruxolitinib       JAK1/2 — myelofibrosis / PV / steroid-refractory GVHD
 *
 * mTOR inhibitors (2):
 *   everolimus        Transplant + oncology + TSC; CYP3A4 substrate +
 *                     mild perpetrator
 *   temsirolimus      RCC — IV prodrug of sirolimus
 *
 * Biologic mAbs (2 — no MW; biologic PK; serves as victim slots):
 *   rituximab         CD20 — NHL/CLL/RA/MS
 *   trastuzumab       HER2 — breast cancer + gastric
 *
 * Sulfonylurea (1 — needed as victim for aprepitant edge):
 *   tolbutamide       1st-gen sulfonylurea, canonical CYP2C9 probe
 *                     substrate. Mostly displaced clinically but
 *                     retained for DDI authoring.
 *
 * ── New perpetrator edges (3) ─────────────────────────────────────
 *
 * Rifampin tail (was at 9; now 11):
 *   → oxycodone        ind×7.14  major  AUC ↓86% PO    PMID:19417618
 *   → buprenorphine    ind×3.33  major  AUC ↓70%       PMID:21596492
 *
 * Aprepitant tail (was at 2; now 3):
 *   → tolbutamide      ind×1.39  caution  AUC ratio 0.72 day 8  PMID:14973304
 *
 * The aprepitant → tolbutamide edge is the CYP2C9 INDUCTION direction
 * (polarity flipped from aprepitant's CYP3A4 inhibition of midazolam +
 * dexamethasone). Aprepitant is biphasic: CYP3A4 inhibition during dosing,
 * CYP2C9 + CYP3A4 induction over the 2 weeks following administration.
 *
 * The rifampin → oxycodone induction_factor reflects the ORAL route
 * (AUC ↓86%, factor 7.14). The IV route shows a smaller effect (AUC ↓53%,
 * factor 2.13) — abstracted into the note for now since the schema
 * doesn't carry per-route induction.
 *
 * ── Skipped (7) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 *   cobicistat PK: Mathias 2010 abstract gives only fold-ratios, no
 *     absolute Cmax/Vd/F/t½. Same pattern for Custodio 2014. PK to be
 *     authored when full-text Tybost FDA label data is accessible.
 *   atazanavir PK: DDI abstracts only; primary single-dose paper not
 *     located within budget.
 *   darunavir PK: same as atazanavir; only DDI ratio papers indexed.
 *   lopinavir PK: de Kanter 2010 (PMID:20056686) carries Cmax 7.2 mg/L
 *     + AUC0-t 71.8 mg·h/L verbatim for 400 mg Kaletra fasted — but t½
 *     isn't in the abstract, so we can't satisfy the data-lint
 *     requirement (ke_hr OR half_life_hr OR MM). PK authoring deferred.
 *   telithromycin PK: only renal-impaired absolutes are verbatim;
 *     healthy values are derived (3.6 / 1.6 fold). Deferred.
 *   voriconazole → omeprazole: PMID:14616415 measures reverse direction.
 *   voriconazole → sirolimus: 14563125 wrong paper (RNAi review).
 *   nirmatrelvir → midazolam: Eng 2022 preclinical only; reviews
 *     qualitative.
 *   aprepitant → ethinylestradiol: 14613941 wrong paper (malaria RAMA);
 *     no clinical PK abstract indexed.
 *   rifampin → digoxin: Greiner 1999 reports verbatim "intestinal P-gp
 *     content 3.5±2.1-fold" but AUC reduction is qualitative — P-gp
 *     content fold ≠ AUC fold. Re-author when full-text Greiner table
 *     yields the actual oral digoxin AUC number.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Kinetics { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number; }
interface InteractionRef { slug: string; name?: string; level?: string; note?: string; kinetics?: Kinetics; source_pmid?: string; }
interface Compound {
  slug: string;
  name?: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  routes?: string[];
  doses?: Record<string, { min: number; max: number; typical: number }>;
  mw_g_mol?: number;
  systems?: string[];
  interactions?: InteractionRef[];
  refs?: string[];
  [k: string]: unknown;
}

const NEW_COMPOUNDS: Compound[] = [
  {
    slug: 'tolbutamide',
    name: 'Tolbutamide',
    aliases: ['Orinase'],
    category: 'pharmacological',
    mechanism:
      'First-generation sulfonylurea hypoglycemic for type 2 diabetes. Closes pancreatic β-cell K_ATP channels (SUR1/Kir6.2) → depolarization → voltage-gated Ca²⁺ entry → insulin secretion. Almost entirely metabolized by CYP2C9 to hydroxymethyl- and carboxytolbutamide — making tolbutamide the canonical CYP2C9 probe substrate in classical DDI studies. Now rarely used clinically (displaced by 2nd/3rd-gen sulfonylureas + GLP-1 agonists + SGLT2 inhibitors) but retained in the registry as the workhorse CYP2C9 probe.',
    routes: ['PO'],
    doses: { PO: { min: 250, max: 3000, typical: 1000 } },
    mw_g_mol: 270.35,
    systems: ['endocrine'],
  },
  {
    slug: 'daclatasvir',
    name: 'Daclatasvir',
    aliases: ['Daklinza', 'BMS-790052', 'DCV'],
    category: 'pharmacological',
    mechanism: 'HCV NS5A inhibitor — first-in-class direct-acting antiviral targeting the viral phosphoprotein essential for HCV RNA replication complex assembly. Pan-genotypic at low concentrations. Was paired with sofosbuvir or asunaprevir in early DAA-era regimens; largely displaced by glecaprevir/pibrentasvir (Mavyret) and other co-formulated DAAs. CYP3A4 substrate; mild P-gp inhibitor.',
    routes: ['PO'],
    doses: { PO: { min: 30, max: 90, typical: 60 } },
    mw_g_mol: 738.88,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'elbasvir',
    name: 'Elbasvir',
    aliases: ['Zepatier (with grazoprevir)', 'MK-8742'],
    category: 'pharmacological',
    mechanism: 'HCV NS5A inhibitor — Zepatier component (50 mg elbasvir + 100 mg grazoprevir, once daily for genotype 1 or 4 HCV). Modest CYP3A4 substrate; not a strong inhibitor at clinical doses. The combo is taken with or without ribavirin depending on cirrhosis status and prior treatment failure.',
    routes: ['PO'],
    doses: { PO: { min: 50, max: 50, typical: 50 } },
    mw_g_mol: 882.02,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'grazoprevir',
    name: 'Grazoprevir',
    aliases: ['Zepatier (with elbasvir)', 'MK-5172'],
    category: 'pharmacological',
    mechanism: 'HCV NS3/4A protease inhibitor — Zepatier component (with elbasvir). Mild OATP1B1/B3 inhibitor → caution with statins. CYP3A4 substrate. Contraindicated in moderate/severe hepatic impairment.',
    routes: ['PO'],
    doses: { PO: { min: 100, max: 100, typical: 100 } },
    mw_g_mol: 766.91,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'elvitegravir',
    name: 'Elvitegravir',
    aliases: ['EVG', 'GS-9137'],
    category: 'pharmacological',
    mechanism: 'HIV integrase strand transfer inhibitor (INSTI) — earlier-generation INSTI requiring CYP3A4 boost (cobicistat) for adequate exposure. Stribild (EVG/COBI/FTC/TDF) and Genvoya (EVG/COBI/FTC/TAF) were once-daily fixed-dose regimens. Largely displaced by bictegravir (no boost needed) and dolutegravir (low boost requirement, higher barrier to resistance). Substrate of CYP3A4 + UGT1A1/3.',
    routes: ['PO'],
    doses: { PO: { min: 150, max: 150, typical: 150 } },
    mw_g_mol: 447.88,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'ibrutinib',
    name: 'Ibrutinib',
    aliases: ['Imbruvica', 'PCI-32765'],
    category: 'pharmacological',
    mechanism: 'First-in-class covalent BTK (Bruton tyrosine kinase) inhibitor — irreversible Michael acceptor that binds Cys481 in the BTK ATP pocket. Indications: CLL/SLL, mantle cell lymphoma, Waldenström macroglobulinemia, marginal zone lymphoma, cGVHD. Strong CYP3A4 substrate (F ~3%; raising it to ~10% with mild inducers, contraindicated with strong inhibitors due to risk of atrial fibrillation + bleeding). Off-target effects on EGFR, ITK, TEC, HER2 account for the rash + diarrhea + AF profile.',
    routes: ['PO'],
    doses: { PO: { min: 140, max: 560, typical: 420 } },
    mw_g_mol: 440.50,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'acalabrutinib',
    name: 'Acalabrutinib',
    aliases: ['Calquence', 'ACP-196'],
    category: 'pharmacological',
    mechanism: 'Second-generation covalent BTK inhibitor — designed for higher BTK selectivity than ibrutinib (less off-target EGFR/ITK/TEC). Indications: CLL/SLL, mantle cell lymphoma. Lower rates of atrial fibrillation, hypertension, and bleeding vs ibrutinib in head-to-head ELEVATE-RR. CYP3A4 substrate; PPIs reduce absorption ~70% — requires acid for solubility.',
    routes: ['PO'],
    doses: { PO: { min: 100, max: 200, typical: 200 } },
    mw_g_mol: 465.51,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'venetoclax',
    name: 'Venetoclax',
    aliases: ['Venclexta', 'ABT-199'],
    category: 'pharmacological',
    mechanism: 'Selective Bcl-2 inhibitor (BH3 mimetic) — restores apoptosis in B-cell malignancies overexpressing Bcl-2. Indications: CLL (with rituximab or obinutuzumab), AML (with HMAs in unfit elderly). Strong CYP3A4 + P-gp substrate. Initiated with a 5-week dose ramp (20 → 50 → 100 → 200 → 400 mg) to minimize tumor lysis syndrome risk — at initiation TLS can be fatal in patients with high tumor burden. Strong CYP3A4 inhibitors are contraindicated during ramp-up.',
    routes: ['PO'],
    doses: { PO: { min: 20, max: 400, typical: 400 } },
    mw_g_mol: 868.44,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'upadacitinib',
    name: 'Upadacitinib',
    aliases: ['Rinvoq', 'ABT-494'],
    category: 'pharmacological',
    mechanism: 'JAK1-selective inhibitor — designed for higher JAK1 selectivity vs tofacitinib (less JAK2/JAK3 hit, theoretically less anemia/lymphopenia). Indications: rheumatoid arthritis, atopic dermatitis, ulcerative colitis, Crohn disease, ankylosing spondylitis, psoriatic arthritis, giant cell arteritis. CYP3A4 substrate. Black-box warning for MACE / malignancy / VTE (JAK class effect from ORAL Surveillance).',
    routes: ['PO'],
    doses: { PO: { min: 15, max: 45, typical: 15 } },
    mw_g_mol: 380.37,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'ruxolitinib',
    name: 'Ruxolitinib',
    aliases: ['Jakafi', 'Jakavi', 'INCB018424'],
    category: 'pharmacological',
    mechanism: 'JAK1/JAK2 inhibitor — first JAK inhibitor approved (2011). Indications: myelofibrosis, polycythemia vera (HU-resistant), steroid-refractory acute + chronic GVHD. CYP3A4 substrate. Discontinuation of ruxolitinib in MF requires a slow taper to avoid cytokine-rebound systemic inflammatory response.',
    routes: ['PO'],
    doses: { PO: { min: 5, max: 50, typical: 20 } },
    mw_g_mol: 306.36,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'everolimus',
    name: 'Everolimus',
    aliases: ['Afinitor', 'Zortress', 'Votubia', 'RAD001'],
    category: 'pharmacological',
    mechanism: 'mTOR (mTORC1) inhibitor — binds FKBP12 → inhibits raptor-mTOR complex. Indications: HR+/HER2− breast cancer (with exemestane), advanced renal cell carcinoma, neuroendocrine tumors, TSC-associated SEGA and renal angiomyolipoma, immunosuppression in heart/kidney/liver transplant. CYP3A4 + P-gp substrate; therapeutic drug monitoring required at transplant doses (target trough 3-8 ng/mL).',
    routes: ['PO'],
    doses: { PO: { min: 0.75, max: 10, typical: 10 } },
    mw_g_mol: 958.22,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'temsirolimus',
    name: 'Temsirolimus',
    aliases: ['Torisel', 'CCI-779'],
    category: 'pharmacological',
    mechanism: 'mTOR inhibitor — ester prodrug rapidly hydrolyzed to sirolimus in vivo. Approved for advanced renal cell carcinoma (IV weekly infusion). CYP3A4 substrate (the parent ester and the sirolimus metabolite). Largely displaced by oral everolimus + kinase inhibitors (sunitinib, pazopanib, cabozantinib) in modern RCC regimens.',
    routes: ['IV'],
    doses: { IV: { min: 25, max: 25, typical: 25 } },
    mw_g_mol: 1030.30,
    systems: ['immune-hematologic'],
  },
  {
    slug: 'rituximab',
    name: 'Rituximab',
    aliases: ['Rituxan', 'MabThera', 'IDEC-C2B8'],
    category: 'pharmacological',
    mechanism: 'Chimeric mouse/human anti-CD20 IgG1 monoclonal antibody — depletes CD20+ B cells via ADCC + CDC + apoptosis. First approved oncology mAb (1997). Indications: non-Hodgkin lymphoma, CLL, rheumatoid arthritis, granulomatosis with polyangiitis / microscopic polyangiitis, pemphigus vulgaris, MS (off-label), various autoimmune diseases. Biologic PK — long IgG-class t½ ~22 days, IgG salvage / FcRn-mediated clearance, not metabolized by CYPs.',
    routes: ['IV', 'SC'],
    doses: { IV: { min: 375, max: 500, typical: 375 } },
    systems: ['immune-hematologic'],
  },
  {
    slug: 'trastuzumab',
    name: 'Trastuzumab',
    aliases: ['Herceptin'],
    category: 'pharmacological',
    mechanism: 'Humanized anti-HER2 (ERBB2) IgG1 monoclonal antibody. Binds the juxtamembrane domain IV of HER2 — blocks ligand-independent dimerization, induces ADCC, internalizes the receptor. Indications: HER2-positive breast cancer (adjuvant, metastatic, neoadjuvant) and HER2-positive gastric/GEJ cancer. Cardiotoxicity risk especially when combined with anthracyclines (synergistic reduction in EF). Biologic PK — long t½ ~28 days at steady state, IgG salvage clearance.',
    routes: ['IV', 'SC'],
    doses: { IV: { min: 4, max: 8, typical: 6 } },
    systems: ['reproductive', 'immune-hematologic'],
  },
];

const RIFAMPIN_NEW_EDGES: InteractionRef[] = [
  {
    slug: 'oxycodone',
    name: 'Oxycodone',
    level: 'major',
    note: 'CYP3A4 induction. Nieminen 2009 (PMID:19417618) verbatim: "Rifampin decreased the area under the oxycodone concentration-time curve of intravenous and oral oxycodone by 53% and 86%, respectively (P < 0.001). Oral bioavailability of oxycodone was decreased from 69% to 21%". 12 healthy volunteers, 4-session paired crossover, rifampin 600 mg/d × 7d + oxycodone IV 0.1 mg/kg / PO 15 mg. PO AUC ratio 0.14 → induction_factor 7.14 (IV ratio 0.47 = 2.13). Analgesia lost.',
    kinetics: { induction_factor: 7.14 },
    source_pmid: 'PMID:19417618',
  },
  {
    slug: 'buprenorphine',
    name: 'Buprenorphine',
    level: 'major',
    note: 'CYP3A4 induction. McCance-Katz 2011 (PMID:21596492) verbatim: "Rifampin administration produced significant reduction in plasma buprenorphine concentrations (70% reduction in mean area under the curve (AUC); p=<0.001) and onset of opiate withdrawal symptoms in 50% of participants (p=0.02)". Opioid-dependent subjects on stable BUP/NX × 24h sampling, rifampin 600 mg/d × 15d. AUC ratio 0.30 → induction_factor 3.33. Compare rifabutin: AUC ↓35% (no withdrawal).',
    kinetics: { induction_factor: 3.33 },
    source_pmid: 'PMID:21596492',
  },
];

const APREPITANT_NEW_EDGES: InteractionRef[] = [
  {
    slug: 'tolbutamide',
    name: 'Tolbutamide',
    level: 'caution',
    note: 'CYP2C9 INDUCTION direction (polarity flipped from aprepitant\'s CYP3A4 inhibition of midazolam/dexamethasone). Shadle 2004 (PMID:14973304) verbatim: "The ratio (aprepitant/placebo) of the geometric mean AUC fold-change from baseline for tolbutamide was 0.77 on day 4 (p < 0.01), 0.72 on day 8 (p < 0.001), and 0.85 on day 15 (p = 0.05)". 24 healthy, double-blind, aprepitant 125/80/80 mg × 3d. Day 8 nadir 0.72 → induction_factor 1.39. Transient; recovers by day 15.',
    kinetics: { induction_factor: 1.39 },
    source_pmid: 'PMID:14973304',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  if (existing?.kinetics?.induction_factor === edge.kinetics?.induction_factor &&
      existing?.kinetics?.ki_uM === edge.kinetics?.ki_uM &&
      existing?.source_pmid === edge.source_pmid) return 'already';
  if (existing) { Object.assign(existing, edge); return 'updated'; }
  perp.interactions.push(edge);
  return 'added';
}

function addRef(perp: Compound, pmid: string | undefined): void {
  if (!pmid) return;
  perp.refs = perp.refs ?? [];
  if (!perp.refs.includes(pmid)) perp.refs.push(pmid);
}

function applyEdges(bySlug: Map<string, Compound>, perpSlug: string, edges: InteractionRef[]): number {
  const perp = bySlug.get(perpSlug);
  if (!perp) throw new Error(`perpetrator missing: ${perpSlug}`);
  let added = 0;
  for (const edge of edges) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing for ${perpSlug} → ${edge.slug}`);
    const r = upsertEdge(perp, edge);
    addRef(perp, edge.source_pmid);
    if (r === 'added') added++;
    const k = edge.kinetics?.ki_uM != null ? `Ki=${edge.kinetics.ki_uM}` : `ind×${edge.kinetics?.induction_factor}`;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] ${perpSlug.padEnd(11)} → ${edge.slug.padEnd(14)} ${k.padEnd(12)} ${edge.source_pmid}`);
  }
  return added;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let compoundsAdded = 0;
  for (const c of NEW_COMPOUNDS) {
    if (bySlug.has(c.slug)) {
      console.log(`  [skip] ${c.slug} already in registry`);
    } else {
      data.push(c);
      bySlug.set(c.slug, c);
      compoundsAdded++;
      console.log(`  [add ] ${c.slug.padEnd(16)} (new, mw=${c.mw_g_mol ?? 'biologic'})`);
    }
  }

  const r1 = applyEdges(bySlug, 'rifampin', RIFAMPIN_NEW_EDGES);
  const r2 = applyEdges(bySlug, 'aprepitant', APREPITANT_NEW_EDGES);

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nModern stubs + perp edges (v1.1): +${compoundsAdded} compounds, +${r1 + r2} edges. 10 skips logged.`);
}

main();
