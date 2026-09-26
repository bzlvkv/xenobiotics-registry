/**
 * 2026-05-11-wave-2a-cyp1a2.ts — Wave 2a CYP1A2 expansion (v1.1 cut).
 *
 * v1.1 ROADMAP §2a non-3A4 perpetrators, CYP1A2 cluster. Ciprofloxacin
 * had only 2 edges (theophylline, tizanidine); fluvoxamine had 7 but
 * was missing two clinically important victims (clozapine, tacrine).
 *
 * Outcome: 5 new edges + 2 new compounds. Clozapine and tacrine were
 * both missing from the registry despite being canonical CYP1A2 victims
 * (clozapine clinically active, tacrine historically the first AchEI
 * approved for Alzheimer's; withdrawn 2013 for hepatotoxicity but still
 * the textbook CYP1A2 substrate example).
 *
 * Strict abstract-verbatim rule applied. 7 candidate pairs investigated
 * and skipped — same "tables-not-abstracts" / label-only pattern that
 * blocked Wave 2a CYP2D6 fluoxetine and bupropion. Logged in
 * AUTHORING_GAPS.md.
 *
 * ── Authored edges ────────────────────────────────────────────────
 *
 *   ciprofloxacin → caffeine     Ki=12.73 µM  caution  PMID:2729942
 *     Healy 1989. Verbatim: AUC "16.3 ± 6.6 to 25.9 ± 7.8 micrograms.h/ml".
 *     10 healthy males, 100 mg PO caffeine ± cipro 750 mg q12h × 3 doses.
 *     AUC ratio 1.59×. Ki ≈ 7.5/(1.59-1) = 12.73 µM. Same 5-20 µM range
 *     as cipro's existing theophylline + tizanidine entries.
 *
 *   ciprofloxacin → ropivacaine  Ki=16.71 µM  caution  PMID:12610740
 *     Jokinen 2003. Verbatim: "Ciprofloxacin decreased the mean clearance
 *     (CL) of ropivacaine by 31%". 9 healthy volunteers, double-blind
 *     crossover, cipro 500 mg PO bid × 2.5d → 0.6 mg/kg IV ropivacaine.
 *     AUC ratio 1/(1-0.31) = 1.45×. Ki ≈ 7.5/0.45 = 16.71 µM. Clinical
 *     relevance: long-block regional anesthesia + cipro = toxicity risk
 *     for individuals at the high end of the 31% CL-reduction range.
 *
 *   ciprofloxacin → clozapine    Ki=7.5 µM   caution  PMID:19067475
 *     Brouwers 2009. Verbatim (case report): "clozapine concentrations
 *     doubled over that time period". 58 y/o male on 300 mg/d clozapine,
 *     plasma doubled within 3 days of cipro initiation. Concentration
 *     ratio 2× (Css proxy). Ki ≈ 7.5/(2-1) = 7.5 µM. Provenance is case
 *     report, not crossover — confidence is lower but the clinical
 *     pattern is well-documented and Ki sits in cipro's other-victim
 *     CYP1A2 range. Narrow TI (agranulocytosis); dose reduction or
 *     alternate antibiotic when combined.
 *
 *   fluvoxamine → clozapine      Ki=0.061 µM  caution  PMID:18484549
 *     Diaz 2008. Verbatim: "fluvoxamine (E=+263%) and paroxetine (E=+30%)
 *     inhibit it [clozapine metabolism]". 255 patients, 415 SS troughs,
 *     mixed model controlling for smoking + valproate. Css ratio 1+2.63
 *     = 3.63×. Ki ≈ 0.16/(3.63-1) = 0.0608 µM. Naturalistic data is
 *     less clean than a designed crossover but captures real-world
 *     practice. Clozapine narrow TI — combination is a known hazard.
 *
 *   fluvoxamine → tacrine        Ki=0.022 µM  major   PMID:9209244
 *     Becquemont 1997. Verbatim AUC: "27 (95% CI, 19 to 38) ng.hr/ml
 *     versus 224 (95% CI, 166 to 302) ng.hr/ml". 13 healthy volunteers,
 *     double-blind randomized crossover, fluvox 100 mg/d × 6d + single
 *     40 mg PO tacrine. AUC ratio 224/27 = 8.30×. Ki ≈ 0.16/7.30 = 0.022 µM.
 *     Apparent oral CL dropped from 1683 to 200 L/hr (88%). Tacrine is
 *     withdrawn from clinical use; entry retained for completeness of
 *     CYP1A2 reference data.
 *
 * ── New compounds: clozapine, tacrine ─────────────────────────────
 *
 * Both pure stubs without PK. Adding because data-lint requires
 * kinetic edge victim slugs to exist in the registry; PK can be
 * authored later when an active-stack user logs either.
 *
 * ── Skipped (7) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 * Ciprofloxacin victims (3 skipped):
 *   olanzapine    — only case report (Markowitz 1999), no AUC ratio.
 *   duloxetine    — Cymbalta label cites ~6× AUC but no primary PMID.
 *   mexiletine    — Labbé 2004 reports only "marginally decreased
 *                   clearances (2 to 5 L/h)" without percent reduction.
 *
 * Fluvoxamine victims (4 skipped):
 *   mexiletine    — Kusumoto 2001 AUC ratio 1.55× (below caution
 *                   threshold; mexiletine is primarily CYP2D6).
 *   rasagiline    — Label warns of ~10× AUC, no PubMed abstract.
 *   agomelatine   — Famous ~60× AUC interaction; SmPC-only, never in
 *                   any abstract.
 *   frovatriptan  — Buchan 2002 "slight increases ... no clinical
 *                   significance"; no number.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Kinetics {
  ki_uM?: number;
  induction_factor?: number;
  plasma_binding_displacement?: number;
}
interface InteractionRef {
  slug: string;
  name?: string;
  level?: string;
  note?: string;
  kinetics?: Kinetics;
  source_pmid?: string;
}
interface Compound {
  slug: string;
  name?: string;
  interactions?: InteractionRef[];
  refs?: string[];
  [k: string]: unknown;
}

// ── New compounds: clozapine, tacrine ────────────────────────────────
const CLOZAPINE: Compound = {
  slug: 'clozapine',
  name: 'Clozapine',
  aliases: ['Clozaril', 'Versacloz', 'FazaClo'],
  category: 'pharmacological',
  mechanism:
    'Atypical antipsychotic with broad receptor activity: 5-HT2A, D4, D2 (lower affinity than typicals), α1, H1, M1-5 antagonism. Indicated for treatment-resistant schizophrenia and reduction of suicidal behavior. Narrow therapeutic index: agranulocytosis risk (~1%) mandates lifelong WBC monitoring under REMS. Primarily metabolized by CYP1A2 (major) and CYP3A4 (minor). Smoking induces CYP1A2 and substantially lowers clozapine exposure; smoking cessation is a clinical interaction. Active metabolite norclozapine.',
  routes: ['PO'],
  doses: { PO: { min: 12.5, max: 900, typical: 300 } },
  mw_g_mol: 326.83,
  systems: ['nervous'],
  refs: ['PMID:18484549', 'PMID:19067475'],
};

const TACRINE: Compound = {
  slug: 'tacrine',
  name: 'Tacrine',
  aliases: ['Cognex', 'tetrahydroaminoacridine', 'THA'],
  category: 'pharmacological',
  mechanism:
    'Reversible acetylcholinesterase inhibitor — first medication approved (1993) for Alzheimer disease. Withdrawn from US market in 2013 because of hepatotoxicity (asymptomatic ALT elevations in 30-50% of patients, with frank hepatitis in a minority). Almost entirely metabolized by CYP1A2, making it the textbook CYP1A2 victim in pharmacology education. Retained in the registry for reference data on CYP1A2 inhibitor potency despite the compound being clinically obsolete.',
  routes: ['PO'],
  doses: { PO: { min: 10, max: 160, typical: 40 } },
  mw_g_mol: 198.26,
  systems: ['nervous'],
  refs: ['PMID:9209244'],
};

// ── Ciprofloxacin CYP1A2 edges ───────────────────────────────────────
const CIPRO_EDGES: InteractionRef[] = [
  {
    slug: 'caffeine',
    name: 'Caffeine',
    level: 'caution',
    note: 'CYP1A2 inhibition. Healy 1989 (PMID:2729942) verbatim: AUC "from 16.3 ± 6.6 to 25.9 ± 7.8 micrograms.h/ml" and CL "from 106 ± 41.6 to 58.2 ± 28.8 ml/min per 1.73 m2". 10 fasting xanthine-free males, 100 mg PO caffeine ± ciprofloxacin 750 mg q12h × 3 doses. AUC ratio 1.59×; Ki ≈ 7.5/0.59 = 12.73 µM. Clinically: jitter / insomnia magnified by chronic cipro at typical caffeine intakes.',
    kinetics: { ki_uM: 12.73 },
    source_pmid: 'PMID:2729942',
  },
  {
    slug: 'ropivacaine',
    name: 'Ropivacaine',
    level: 'caution',
    note: 'CYP1A2 inhibition (3-OH-ropivacaine formation). Jokinen 2003 (PMID:12610740) verbatim: "Ciprofloxacin decreased the mean clearance (CL) of ropivacaine by 31%". 9 healthy volunteers, double-blind crossover, cipro 500 mg PO bid × 2.5d → 0.6 mg/kg IV ropivacaine. Inter-individual range -52% to +39% CL change. AUC ratio 1/(1-0.31) = 1.45×; Ki ≈ 16.71 µM. Long-block regional anesthesia + cipro risks toxicity for high-end responders.',
    kinetics: { ki_uM: 16.71 },
    source_pmid: 'PMID:12610740',
  },
  {
    slug: 'clozapine',
    name: 'Clozapine',
    level: 'caution',
    note: 'CYP1A2 + minor CYP3A4 inhibition. Brouwers 2009 (PMID:19067475) — TWO CASE REPORTS, not a controlled crossover. Verbatim: "clozapine concentrations doubled over that time period". 58 y/o male on 300 mg/d clozapine, plasma doubled within 3 days of cipro initiation. Concentration ratio ~2×; Ki ≈ 7.5 µM (case-report provenance, less precise than controlled). Narrow TI: dose reduction or alternate antibiotic when combined.',
    kinetics: { ki_uM: 7.5 },
    source_pmid: 'PMID:19067475',
  },
];

// ── Fluvoxamine CYP1A2 tail edges ────────────────────────────────────
const FLUVOX_EDGES: InteractionRef[] = [
  {
    slug: 'clozapine',
    name: 'Clozapine',
    level: 'caution',
    note: 'CYP1A2 inhibition (strong). Diaz 2008 (PMID:18484549) verbatim: "fluvoxamine (E=+263%) and paroxetine (E=+30%) inhibit it [clozapine metabolism]". Mixed-model analysis of 255 patients, 415 SS troughs, controlling for smoking + valproate. Css ratio 1+2.63 = 3.63×; Ki ≈ 0.16/2.63 = 0.061 µM. Naturalistic data — less precise than a controlled crossover but reflects real-world clozapine + SSRI co-prescription practice.',
    kinetics: { ki_uM: 0.0608 },
    source_pmid: 'PMID:18484549',
  },
  {
    slug: 'tacrine',
    name: 'Tacrine',
    level: 'major',
    note: 'CYP1A2 inhibition (strong). Becquemont 1997 (PMID:9209244) verbatim: tacrine AUC "27 (95% CI, 19 to 38) ng.hr/ml versus 224 (95% CI, 166 to 302) ng.hr/ml". 13 healthy volunteers, double-blind randomized crossover, fluvoxamine 100 mg/d × 6d + single 40 mg PO tacrine. AUC ratio 224/27 = 8.30×; apparent oral CL 1683 → 200 L/hr (88% reduction). Ki ≈ 0.16/7.30 = 0.022 µM. Tacrine withdrawn 2013 — retained as textbook CYP1A2 reference data.',
    kinetics: { ki_uM: 0.0219 },
    source_pmid: 'PMID:9209244',
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

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let compoundsAdded = 0, edgesAdded = 0, edgesUpdated = 0, edgesAlready = 0;

  // 1. New compounds
  for (const c of [CLOZAPINE, TACRINE]) {
    if (bySlug.has(c.slug)) {
      console.log(`  [skip] ${c.slug} already in registry`);
    } else {
      data.push(c);
      bySlug.set(c.slug, c);
      compoundsAdded++;
      console.log(`  [add ] ${c.slug} (new compound)`);
    }
  }

  // 2. Ciprofloxacin edges
  const cipro = bySlug.get('ciprofloxacin');
  if (!cipro) throw new Error('ciprofloxacin missing from registry');
  for (const edge of CIPRO_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(cipro, edge);
    addRef(cipro, edge.source_pmid);
    if (r === 'added') edgesAdded++;
    else if (r === 'updated') edgesUpdated++;
    else edgesAlready++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] ciprofloxacin → ${edge.slug.padEnd(14)} Ki=${edge.kinetics?.ki_uM} µM ${edge.source_pmid}`);
  }

  // 3. Fluvoxamine edges
  const fluvox = bySlug.get('fluvoxamine');
  if (!fluvox) throw new Error('fluvoxamine missing from registry');
  for (const edge of FLUVOX_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(fluvox, edge);
    addRef(fluvox, edge.source_pmid);
    if (r === 'added') edgesAdded++;
    else if (r === 'updated') edgesUpdated++;
    else edgesAlready++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] fluvoxamine   → ${edge.slug.padEnd(14)} Ki=${edge.kinetics?.ki_uM} µM ${edge.source_pmid}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a CYP1A2 (v1.1): +${compoundsAdded} compounds, +${edgesAdded} edges (${edgesUpdated} updated, ${edgesAlready} already-had). 7 skips logged in AUTHORING_GAPS.md.`);
}

main();
