/**
 * 2026-05-11-wave-2a-ccb-cyp3a4.ts — Wave 2a CCB-as-CYP3A4-perpetrator (v1.1).
 *
 * Verapamil and diltiazem had only 1 kinetic edge each (simvastatin)
 * despite both being well-characterized CYP3A4 perpetrators with deep
 * clinical PK literature. This session captures the Lamberg + Backman
 * + Azie crossover studies from the late-1990s Helsinki / Indiana
 * pharmacology groups.
 *
 * ── Authored edges ────────────────────────────────────────────────
 *
 * Verapamil (Cp_perp = 0.5 µM, 80 mg tid steady-state):
 *   → buspirone     Ki=0.208  caution  PMID:9663178   AUC 3.4×
 *   → midazolam     Ki=0.260  caution  PMID:8198928   AUC 2.92×
 *
 * Diltiazem (Cp_perp = 0.5 µM, 60 mg tid steady-state):
 *   → buspirone     Ki=0.111  major    PMID:9663178   AUC 5.5×
 *   → midazolam     Ki=0.182  caution  PMID:8198928   AUC 3.75×
 *   → lovastatin    Ki=0.195  caution  PMID:9797793   AUC 3.57×
 *
 * The Lamberg 1998 and Backman 1994 papers carry both perpetrators in
 * the same 3-phase crossover, which is why two perpetrator → buspirone
 * edges and two perpetrator → midazolam edges share PMIDs.
 *
 * ── Skipped (2) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 *   verapamil → atorvastatin: Choi 2008 papers measured atorvastatin
 *     as the PERPETRATOR of verapamil (reverse direction). The clinical
 *     atorvastatin + verapamil DDI is documented as a case-report
 *     pattern, no abstract-verbatim crossover AUC.
 *   diltiazem → atorvastatin: case report (PMID:21545622), PBPK
 *     simulation (PMID:31518878), or epidemiology survey only.
 *
 * Net: +5 edges, verapamil 1 → 3, diltiazem 1 → 4.
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

const VERAPAMIL_EDGES: InteractionRef[] = [
  {
    slug: 'buspirone',
    name: 'Buspirone',
    level: 'caution',
    note: 'CYP3A4 inhibition. Lamberg 1998 (PMID:9663178) verbatim: "Verapamil and diltiazem increased the area under the buspirone plasma concentration-time curve [AUC (0-infinity)] 3.4-fold (p < 0.001) and 5.5-fold (p < 0.001), respectively". 9 healthy volunteers, randomized 3-phase crossover, verapamil 80 mg tid + 10 mg PO buspirone on d2. AUC 3.4×; Ki ≈ 0.5/2.4 = 0.208 µM. Cmax also 3.4× — substantial sedation amplification.',
    kinetics: { ki_uM: 0.208 },
    source_pmid: 'PMID:9663178',
  },
  {
    slug: 'midazolam',
    name: 'Midazolam',
    level: 'caution',
    note: 'CYP3A4 inhibition. Backman 1994 (PMID:8198928) verbatim: midazolam AUC "increased from 12 +/- 1 microgram ml-1 min ... to 35 +/- 5 micrograms ml-1 min by verapamil (P < 0.001)". 9 healthy volunteers, double-blind 3-phase crossover, verapamil 80 mg tid × 2d + 15 mg PO midazolam d2. AUC ratio 35/12 = 2.92×; Ki ≈ 0.5/1.92 = 0.260 µM. Cmax doubled, t½ prolonged, "profound and prolonged sedative effects" — dose reduction advised.',
    kinetics: { ki_uM: 0.260 },
    source_pmid: 'PMID:8198928',
  },
];

const DILTIAZEM_EDGES: InteractionRef[] = [
  {
    slug: 'buspirone',
    name: 'Buspirone',
    level: 'major',
    note: 'CYP3A4 inhibition. Lamberg 1998 (PMID:9663178) verbatim: "Verapamil and diltiazem increased the area under the buspirone plasma concentration-time curve [AUC (0-infinity)] 3.4-fold (p < 0.001) and 5.5-fold (p < 0.001), respectively". 9 healthy volunteers, randomized 3-phase crossover, diltiazem 60 mg tid + 10 mg PO buspirone on d2. AUC 5.5×; Ki ≈ 0.5/4.5 = 0.111 µM. Cmax 4.1×; diltiazem effect significantly larger than verapamil (P < 0.05).',
    kinetics: { ki_uM: 0.111 },
    source_pmid: 'PMID:9663178',
  },
  {
    slug: 'midazolam',
    name: 'Midazolam',
    level: 'caution',
    note: 'CYP3A4 inhibition. Backman 1994 (PMID:8198928) verbatim: midazolam AUC "increased from 12 +/- 1 microgram ml-1 min to 45 +/- 5 micrograms ml-1 min by diltiazem (P < 0.001)". 9 healthy volunteers, double-blind 3-phase crossover, diltiazem 60 mg tid × 2d + 15 mg PO midazolam d2. AUC ratio 45/12 = 3.75×; Ki ≈ 0.5/2.75 = 0.182 µM. Cmax doubled, t½ prolonged; "Dose of midazolam should be reduced during diltiazem and verapamil treatments" per paper title.',
    kinetics: { ki_uM: 0.182 },
    source_pmid: 'PMID:8198928',
  },
  {
    slug: 'lovastatin',
    name: 'Lovastatin',
    level: 'caution',
    note: 'CYP3A4 inhibition. Azie 1998 (PMID:9797793) verbatim: "Diltiazem significantly (P < .05) increased the oral area under the serum concentration-time curve (AUC) of lovastatin from 3607 +/- 1525 ng/ml/min (mean +/- SD) to 12886 +/- 6558 ng/ml/min". 10 healthy volunteers, randomized 4-way open-label crossover, diltiazem 120 mg bid × 2 wk + single 20 mg PO lovastatin. AUC ratio 12886/3607 = 3.57×; Ki ≈ 0.5/2.57 = 0.195 µM. Pravastatin unaffected (confirms CYP3A specificity, not transporter).',
    kinetics: { ki_uM: 0.195 },
    source_pmid: 'PMID:9797793',
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
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] ${perpSlug.padEnd(10)} → ${edge.slug.padEnd(12)} Ki=${edge.kinetics?.ki_uM} µM ${edge.source_pmid}`);
  }
  return { added, updated, already };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  const vera = applyEdges(bySlug, 'verapamil', VERAPAMIL_EDGES);
  const dilt = applyEdges(bySlug, 'diltiazem', DILTIAZEM_EDGES);

  const totalAdded = vera.added + dilt.added;
  const totalUpdated = vera.updated + dilt.updated;
  const totalAlready = vera.already + dilt.already;

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a CCB-as-perp (v1.1): +${totalAdded} edges (${totalUpdated} updated, ${totalAlready} already-had). 2 skips logged.`);
}

main();
