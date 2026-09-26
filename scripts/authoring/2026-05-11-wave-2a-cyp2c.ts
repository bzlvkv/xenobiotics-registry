/**
 * 2026-05-11-wave-2a-cyp2c.ts — Wave 2a CYP2C8 + CYP2C9 (v1.1 cut).
 *
 * v1.1 ROADMAP §2a non-3A4 perpetrators, CYP2C cluster:
 *  - CYP2C8: trimethoprim (0 prior edges) + gemfibrozil tail (had 2)
 *  - CYP2C9: amiodarone CYP2C9-pure victim + fluconazole tail (had 9)
 *
 * Outcome: 10 new edges + 2 new compounds. The Niemi-Backman-Neuvonen
 * group's series of crossover studies from the early 2000s is the
 * single biggest source of clean, abstract-verbatim CYP2C8 DDI data —
 * this session captures that body of work.
 *
 * Includes the famous gemfibrozil → cerivastatin edge (Backman 2002,
 * AUC 5.59×), the documented cause of cerivastatin's 2001 withdrawal
 * after fatal rhabdomyolysis. Cerivastatin authored as a new compound
 * stub for historical reference even though it's no longer marketed.
 *
 * ── Authored edges ────────────────────────────────────────────────
 *
 * Trimethoprim (Cp_perp = 3 µM, 160 mg PO bid):
 *   → repaglinide      Ki=4.92  caution  PMID:15025742  AUC 1.61×
 *   → rosiglitazone    Ki=8.11  caution  PMID:15371985  AUC 1.37×
 *   → pioglitazone     Ki=7.14  caution  PMID:17913794  AUC 1.42×
 *
 * Trimethoprim AUC ratios are all sub-2× but the studies are clean
 * (randomized double-blind crossover, n=9-16, healthy volunteers).
 * Clinical context warrants caution-level: diabetic patients on
 * insulin secretagogues + TMP-SMX for UTI is a common combination
 * and the 1.4-1.6× exposure rise raises hypoglycemia risk.
 *
 * Gemfibrozil (Cp_perp = 35 µM, 600 mg PO bid):
 *   → cerivastatin     Ki=7.62   major    PMID:12496749  AUC 5.59×
 *   → montelukast      Ki=10.6   warn     PMID:21838784  AUC 4.30×
 *   → pioglitazone     Ki=15.9   caution  PMID:15900286  AUC 3.20×
 *   → rosiglitazone    Ki=26.9   caution  PMID:12898007  AUC 2.30×
 *   → loperamide       Ki=29.2   caution  PMID:16758263  AUC 2.20×
 *
 * Amiodarone (Cp_perp = 2 µM, 200 mg/d maintenance):
 *   → phenytoin        Ki=4.95   caution  PMID:2337037   AUC 1.40×
 *
 * Fluconazole (Cp_perp = 30 µM):
 *   → glimepiride      Ki=21.7   caution  PMID:11309547  AUC 2.38×
 *
 * ── New compounds: rosiglitazone, cerivastatin ────────────────────
 *
 * Both pure stubs without PK — PK can be authored later when a
 * user logs them.
 *
 *   rosiglitazone — Avandia. Thiazolidinedione PPAR-γ agonist for
 *     type 2 diabetes. Withdrawn EU 2010 (Mahmood/Nissen meta-analysis
 *     CV mortality signal); restricted-then-reinstated in US.
 *
 *   cerivastatin — Baycol/Lipobay. HMG-CoA reductase inhibitor.
 *     Withdrawn worldwide 2001-08-08 after 52 confirmed fatal
 *     rhabdomyolysis cases, predominantly from gemfibrozil-cerivastatin
 *     coadministration. The DDI authored in this script is the
 *     proximate cause of the withdrawal.
 *
 * ── Skipped (9) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 * Trimethoprim victims (2):
 *   paclitaxel   — Wen 2002 reports HLM K_i 32 µM, no clinical AUC.
 *   montelukast  — Filppula 2011 / Jaakkola 2006 are in vitro only.
 *
 * Amiodarone victims (3):
 *   losartan, fluvastatin, sulfonylureas — only narrative reviews or
 *     case reports in PubMed; no controlled crossover AUC ratio.
 *
 * Fluconazole victims (4):
 *   glyburide, glipizide  — Schelleman epidemiology gives OR 2.20 but
 *     no AUC ratio. Old Fournier case report (French).
 *   tolbutamide           — Lazar 1990 narrative + in vitro only.
 *   rosiglitazone         — only rat toxicity / in vitro gene-expression
 *                           studies; no human PK with AUC.
 *
 * Same "tables-not-abstracts" / "case-reports-not-crossovers" pattern
 * as Wave 2a CYP2D6 (23 skips) and CYP1A2 (7 skips). Combined v1.1
 * Wave 2a non-3A4 skip total: 39.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Kinetics { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number; }
interface InteractionRef { slug: string; name?: string; level?: string; note?: string; kinetics?: Kinetics; source_pmid?: string; }
interface Compound { slug: string; name?: string; interactions?: InteractionRef[]; refs?: string[]; [k: string]: unknown; }

// ── New compounds ────────────────────────────────────────────────────
const ROSIGLITAZONE: Compound = {
  slug: 'rosiglitazone',
  name: 'Rosiglitazone',
  aliases: ['Avandia'],
  category: 'pharmacological',
  mechanism:
    'Thiazolidinedione (TZD) PPAR-γ agonist for type 2 diabetes — improves insulin sensitivity in muscle and adipose tissue without directly increasing insulin secretion. Major CYP2C8 substrate; CYP2C9 contributes minor pathway. Withdrawn EU 2010 after Nissen meta-analysis flagged a cardiovascular mortality signal; US restriction lifted 2013 with REMS modification. Currently rare in clinical use, having been largely displaced by pioglitazone and the GLP-1/SGLT2 classes.',
  routes: ['PO'],
  doses: { PO: { min: 2, max: 8, typical: 4 } },
  mw_g_mol: 357.43,
  systems: ['endocrine'],
  refs: ['PMID:12898007', 'PMID:15371985'],
};

const CERIVASTATIN: Compound = {
  slug: 'cerivastatin',
  name: 'Cerivastatin',
  aliases: ['Baycol', 'Lipobay'],
  category: 'pharmacological',
  mechanism:
    'HMG-CoA reductase inhibitor (statin) — withdrawn worldwide 2001-08-08 after 52 confirmed fatal rhabdomyolysis cases, predominantly attributable to coadministration with gemfibrozil. Mechanism of the fatal DDI: CYP2C8 inhibition by gemfibrozil glucuronide raises cerivastatin AUC ~6× (Backman 2002 PMID:12496749 — verbatim AUC 559% of control). Bayer paid $1.15 billion to settle lawsuits over the withdrawal. Retained in the registry for historical reference and as the canonical CYP2C8 DDI cautionary tale.',
  routes: ['PO'],
  doses: { PO: { min: 0.1, max: 0.8, typical: 0.4 } },
  mw_g_mol: 459.55,
  systems: ['cardiovascular'],
  refs: ['PMID:12496749'],
};

// ── Trimethoprim CYP2C8 edges ────────────────────────────────────────
const TRIMETHOPRIM_EDGES: InteractionRef[] = [
  {
    slug: 'repaglinide',
    name: 'Repaglinide',
    level: 'caution',
    note: 'CYP2C8 inhibition. Niemi 2004 (PMID:15025742) verbatim: "Trimethoprim raised the AUC(0, infinity) and C(max) of repaglinide by 61% (range, 30-117%; P= 0.0008)". 9 healthy volunteers, randomized double-blind crossover, trimethoprim 160 mg bid × 3d + single 0.25 mg PO repaglinide. AUC ratio 1.61×; Ki ≈ 3/0.61 = 4.92 µM. Diabetic patients on TMP-SMX for UTI face hypoglycemia risk.',
    kinetics: { ki_uM: 4.92 },
    source_pmid: 'PMID:15025742',
  },
  {
    slug: 'rosiglitazone',
    name: 'Rosiglitazone',
    level: 'caution',
    note: 'CYP2C8 inhibition. Niemi 2004 (PMID:15371985) verbatim: "trimethoprim raised the area under the plasma rosiglitazone concentration-time curve [AUC(0-infinity)] by 37% (range, 16% to 51%; P <.0001)". 10 healthy volunteers, randomized crossover, trimethoprim 160 mg bid × 4d + single 4 mg PO rosiglitazone. AUC ratio 1.37×; Ki ≈ 3/0.37 = 8.11 µM. Sub-2× but reproducible; relevant at higher TZD doses.',
    kinetics: { ki_uM: 8.11 },
    source_pmid: 'PMID:15371985',
  },
  {
    slug: 'pioglitazone',
    name: 'Pioglitazone',
    level: 'caution',
    note: 'CYP2C8 inhibition. Tornio 2008 (PMID:17913794) verbatim: "Trimethoprim raised the area under the plasma pioglitazone concentration-time curve (AUC(0-infinity)) by 42% (p < 0.001)". 16 healthy volunteers stratified by CYP2C8 genotype, randomized crossover, trimethoprim 160 mg bid × 6d + 15 mg PO pioglitazone d3. AUC ratio 1.42×; Ki ≈ 3/0.42 = 7.14 µM.',
    kinetics: { ki_uM: 7.14 },
    source_pmid: 'PMID:17913794',
  },
];

// ── Gemfibrozil CYP2C8 edges (new) ───────────────────────────────────
const GEMFIBROZIL_EDGES: InteractionRef[] = [
  {
    slug: 'cerivastatin',
    name: 'Cerivastatin',
    level: 'major',
    note: 'CYP2C8 inhibition. Backman 2002 (PMID:12496749) verbatim: "the area under the plasma concentration-time curve [AUC(0-infinity)] of parent cerivastatin was on average 559% (range, 138% to 995%; P =.0002) ... of the corresponding values in the placebo phase". 10 healthy volunteers, randomized double-blind crossover, gemfibrozil 600 mg bid × 3d + single 0.3 mg PO cerivastatin. AUC ratio 5.59×; Ki ≈ 35/4.59 = 7.62 µM. THIS is the DDI that killed cerivastatin (withdrawn 2001).',
    kinetics: { ki_uM: 7.62 },
    source_pmid: 'PMID:12496749',
  },
  {
    slug: 'montelukast',
    name: 'Montelukast',
    level: 'warn',
    note: 'CYP2C8 inhibition. Karonen 2012 (PMID:21838784) verbatim: "The CYP2C8 inhibitor gemfibrozil increased the AUC(0,∞) of montelukast 4.3-fold and its t(1/2) 2.1-fold (P < 0.001)". 11 healthy subjects, randomized crossover (gemfibrozil 600 mg bid / itraconazole / placebo × 5d) + 10 mg PO montelukast d3. AUC ratio 4.30×; Ki ≈ 35/3.30 = 10.6 µM.',
    kinetics: { ki_uM: 10.6 },
    source_pmid: 'PMID:21838784',
  },
  {
    slug: 'pioglitazone',
    name: 'Pioglitazone',
    level: 'caution',
    note: 'CYP2C8 inhibition. Jaakkola 2005 (PMID:15900286) verbatim: "Gemfibrozil alone raised the mean total area under the plasma concentration-time curve from time 0 to infinity [AUC(0-infinity)] of pioglitazone 3.2-fold (range, 2.3-fold to 6.5-fold; P < .001)". 12 healthy volunteers, randomized double-blind 4-phase crossover (gemfibrozil/itraconazole), 15 mg PO pioglitazone. AUC ratio 3.20×; Ki ≈ 35/2.20 = 15.9 µM.',
    kinetics: { ki_uM: 15.9 },
    source_pmid: 'PMID:15900286',
  },
  {
    slug: 'rosiglitazone',
    name: 'Rosiglitazone',
    level: 'caution',
    note: 'CYP2C8 inhibition. Niemi 2003 (PMID:12898007) verbatim: "Gemfibrozil raised the mean area under the plasma rosiglitazone concentration-time curve (AUC) 2.3-fold (range 1.5- to 2.8-fold; p=0.00002)". 10 healthy volunteers, randomized crossover, gemfibrozil 600 mg bid × 4d + 4 mg PO rosiglitazone d3. AUC ratio 2.30×; Ki ≈ 35/1.30 = 26.9 µM. t½ prolonged 3.6 → 7.6 h.',
    kinetics: { ki_uM: 26.9 },
    source_pmid: 'PMID:12898007',
  },
  {
    slug: 'loperamide',
    name: 'Loperamide',
    level: 'caution',
    note: 'CYP2C8 inhibition (also CYP3A4 + P-gp substrate, so attribution approximate). Niemi 2006 (PMID:16758263) verbatim: "Gemfibrozil raised the Cmax of loperamide 1.6-fold (0.9-3.2; P < 0.05) and its AUC(0-infinity) 2.2-fold (1.0-3.7; P < 0.05)". 12 healthy volunteers, randomized 4-phase crossover, gemfibrozil 600 mg bid × 5d + 4 mg PO loperamide d3. AUC ratio 2.20×; Ki ≈ 35/1.20 = 29.2 µM.',
    kinetics: { ki_uM: 29.2 },
    source_pmid: 'PMID:16758263',
  },
];

// ── Amiodarone CYP2C9 edge ───────────────────────────────────────────
const AMIODARONE_EDGES: InteractionRef[] = [
  {
    slug: 'phenytoin',
    name: 'Phenytoin',
    level: 'caution',
    note: 'CYP2C9 (+ CYP2C19 minor) inhibition. Nolan 1990 (PMID:2337037) verbatim: phenytoin "area under the serum concentration time curve ... increased from 208 +/- 82.8 ... to 292 +/- 108 mg.hr/liter (p = 0.015)". 7 healthy males, steady-state oral phenytoin 2-4 mg/kg/d × 14d before/after amiodarone 200 mg/d × 6 wk. AUC ratio 1.40×; Ki ≈ 2/0.40 = 4.95 µM. Phenytoin TDM critical — narrow TI and the rise compounds over weeks as amiodarone accumulates.',
    kinetics: { ki_uM: 4.95 },
    source_pmid: 'PMID:2337037',
  },
];

// ── Fluconazole CYP2C9 tail ──────────────────────────────────────────
const FLUCONAZOLE_EDGES: InteractionRef[] = [
  {
    slug: 'glimepiride',
    name: 'Glimepiride',
    level: 'caution',
    note: 'CYP2C9 inhibition. Niemi 2001 (PMID:11309547) verbatim: "the mean total area under the plasma concentration-time curve of glimepiride was 238% (P <.0001) ... of the respective control value". 12 healthy volunteers, randomized double-blind 3-phase crossover, fluconazole 400 mg d1 / 200 mg d2-4 + single 0.5 mg PO glimepiride d4. AUC ratio 2.38×; t½ 2.0 → 3.3 h; Ki ≈ 30/1.38 = 21.7 µM. Hypoglycemia risk in diabetics on antifungal therapy.',
    kinetics: { ki_uM: 21.7 },
    source_pmid: 'PMID:11309547',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  if (existing?.kinetics?.ki_uM === edge.kinetics?.ki_uM && existing?.source_pmid === edge.source_pmid) {
    return 'already';
  }
  if (existing) {
    Object.assign(existing, edge);
    return 'updated';
  }
  perp.interactions.push(edge);
  return 'added';
}

function addRef(perp: Compound, pmid: string | undefined): void {
  if (!pmid) return;
  perp.refs = perp.refs ?? [];
  if (!perp.refs.includes(pmid)) perp.refs.push(pmid);
}

function applyEdges(bySlug: Map<string, Compound>, perpSlug: string, edges: InteractionRef[]): { added: number; updated: number; already: number } {
  const perp = bySlug.get(perpSlug);
  if (!perp) throw new Error(`perpetrator missing: ${perpSlug}`);
  let added = 0, updated = 0, already = 0;
  for (const edge of edges) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing for ${perpSlug} → ${edge.slug}`);
    const r = upsertEdge(perp, edge);
    addRef(perp, edge.source_pmid);
    if (r === 'added') added++;
    else if (r === 'updated') updated++;
    else already++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] ${perpSlug.padEnd(14)} → ${edge.slug.padEnd(15)} Ki=${edge.kinetics?.ki_uM} µM ${edge.source_pmid}`);
  }
  return { added, updated, already };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let compoundsAdded = 0;
  for (const c of [ROSIGLITAZONE, CERIVASTATIN]) {
    if (bySlug.has(c.slug)) {
      console.log(`  [skip] ${c.slug} already in registry`);
    } else {
      data.push(c);
      bySlug.set(c.slug, c);
      compoundsAdded++;
      console.log(`  [add ] ${c.slug} (new compound)`);
    }
  }

  const trim = applyEdges(bySlug, 'trimethoprim', TRIMETHOPRIM_EDGES);
  const gemf = applyEdges(bySlug, 'gemfibrozil', GEMFIBROZIL_EDGES);
  const amio = applyEdges(bySlug, 'amiodarone', AMIODARONE_EDGES);
  const flucon = applyEdges(bySlug, 'fluconazole', FLUCONAZOLE_EDGES);

  const totalAdded = trim.added + gemf.added + amio.added + flucon.added;
  const totalUpdated = trim.updated + gemf.updated + amio.updated + flucon.updated;
  const totalAlready = trim.already + gemf.already + amio.already + flucon.already;

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a CYP2C (v1.1): +${compoundsAdded} compounds, +${totalAdded} edges (${totalUpdated} updated, ${totalAlready} already-had). 9 skips logged in AUTHORING_GAPS.md.`);
}

main();
