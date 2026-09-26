/**
 * 2026-05-11-wave-2a-multi-cyp.ts — Wave 2a multi-CYP perpetrators (v1.1).
 *
 * Cimetidine had 0 kinetic edges despite being the classic "broad" CYP
 * inhibitor (touches CYP1A2, CYP2C9, CYP2D6, CYP3A4). Phenobarbital
 * also at 0. Carbamazepine had 1 induction edge (cyclosporine) + 1
 * note-only (warfarin). This session captures clean abstract-verbatim
 * AUC ratios across the cimetidine-era classics (Powell 1984, Heagerty
 * 1981, Pasanen 1986, Kirch 1984) plus modern CBZ induction studies
 * (Ucar 2004 simvastatin, Backman 1996 midazolam, Crawford 1990 EE).
 *
 * Bonus: Crawford 1990 (PMID:2126946) carries BOTH carbamazepine →
 * ethinylestradiol AND phenytoin → ethinylestradiol numbers verbatim
 * in the same abstract — so we author both from one source.
 *
 * ── Authored edges (9 total) ──────────────────────────────────────
 *
 * Cimetidine (Cp_perp = 5 µM, 400-1200 mg/d):
 *   → theophylline    Ki=8.93   caution  PMID:6322709   AUC 1.56× (CYP1A2)
 *   → propranolol     Ki=3.66   caution  PMID:6786672   AUC 2.37× (CYP1A2/2D6)
 *   → diazepam        Ki=6.10   caution  PMID:2878667   AUC 1.82× (CYP2C19/3A4)
 *   → warfarin        Ki=9.01   caution  PMID:6096071   AUC 1.55× (CYP2C9, review-source)
 *
 * Carbamazepine (induction):
 *   → simvastatin     ind×4.0   strong   PMID:14691614  AUC ↓75%
 *   → midazolam       ind×17.5  strong   PMID:8598183   AUC 5.7% of control
 *   → hormonal-contraceptives  ind×1.73  moderate  PMID:2126946  EE2 AUC 1163→672
 *
 * Phenobarbital (induction):
 *   → theophylline    ind×1.34  weak-mod PMID:659737    CL +34%
 *
 * Phenytoin (induction — bonus from Crawford 1990, paper's other arm):
 *   → hormonal-contraceptives  ind×1.96  moderate  PMID:2126946  EE2 AUC 806→411
 *
 * ── Caveats noted in edge prose ───────────────────────────────────
 *
 * 1. cimetidine → warfarin from Kirch 1984 (PMID:6096071) is a review
 *    paper. The CL value (66.7→42.9 ml/min) is verbatim in the abstract
 *    but originates in a primary Serlin/Toon study — flagged in the
 *    note for the registry maintainer to optionally re-cite primary.
 *
 * 2. carbamazepine → midazolam from Backman 1996 (PMID:8598183) used
 *    a mixed cohort of 6 epilepsy patients on EITHER CBZ or PHT vs 7
 *    noninduced controls. The 5.7% number is for the combined cohort;
 *    authoring under CBZ since CBZ is the stronger CYP3A4 inducer of
 *    the pair, with cohort-mix caveat in the note. PHT → midazolam
 *    skipped from this specific source (not split out in abstract).
 *
 * 3. The level field uses 5-tier scale (caution/warn/major/strong/weak-mod)
 *    matching existing st-johns-wort and rifampin induction patterns
 *    for inducer entries.
 *
 * ── Skipped (10) — logged in AUTHORING_GAPS.md ───────────────────
 *
 * Cimetidine victims (2):
 *   phenytoin   — Bartle 1983 + Frigo 1983 abstracts qualitative only.
 *   metoprolol  — Reimann 1981 not indexed; Spahn 1983 no abstract.
 *
 * Carbamazepine victims (3):
 *   atorvastatin — wrong direction (atorvastatin perp of CBZ) + mouse.
 *   warfarin     — case report PMID:24612117, no AUC ratio.
 *   quetiapine   — Spina/Besag reviews qualitative.
 *
 * Phenobarbital victims (5):
 *   warfarin (human) — rat-only abstracts (PMIDs:7205571, 1862655);
 *                      Cropp/Bussey review has no AUC numbers.
 *   carbamazepine    — no abstract-verbatim AUC change.
 *   ethinylestradiol — Back/Orme + Harden reviews qualitative.
 *
 * Phenytoin → midazolam from Backman 1996 — same cohort caveat as
 * the CBZ side; not authored as a separate phenytoin edge.
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

// ── Cimetidine (4 Ki edges across 4 isoforms) ────────────────────────
const CIMETIDINE_EDGES: InteractionRef[] = [
  {
    slug: 'theophylline',
    name: 'Theophylline',
    level: 'caution',
    note: 'CYP1A2 inhibition. Powell 1984 (PMID:6322709) verbatim: "Cimetidine, 1,200 mg/day, significantly decreased theophylline clearance by 36% (range, 22% to 49%)". 12 healthy men, IV 6 mg/kg aminophylline, 4 arms (control / cim 1200 / cim 2400 / ranitidine 300). CL ↓36% → AUC ratio 1/(1-0.36) = 1.56×. Ki ≈ 5/0.56 = 8.93 µM. t½ 5.7 → 9.2 h. Ranitidine not affected (specificity).',
    kinetics: { ki_uM: 8.93 },
    source_pmid: 'PMID:6322709',
  },
  {
    slug: 'propranolol',
    name: 'Propranolol',
    level: 'caution',
    note: 'CYP1A2 + CYP2D6 (first-pass) inhibition. Heagerty 1981 (PMID:6786672) verbatim: "The mean increase in bioavailability was 136.5 +/- 57.6%". 6 patients, single 80 mg PO propranolol ± cimetidine. Bioavailability ↑136.5% → AUC ratio 2.37×. Ki ≈ 5/1.37 = 3.66 µM. "Cimetidine reduces the hepatic first-pass extraction of propranolol."',
    kinetics: { ki_uM: 3.66 },
    source_pmid: 'PMID:6786672',
  },
  {
    slug: 'diazepam',
    name: 'Diazepam',
    level: 'caution',
    note: 'CYP2C19 + CYP3A4 inhibition. Pasanen 1986 (PMID:2878667) verbatim: "in man, only C inhibited the hepatic elimination of diazepam by about 45%" (comparing 5 H2-antagonists; only cimetidine [C] inhibited). CL ↓45% → AUC ratio 1/(1-0.45) = 1.82×. Ki ≈ 5/0.82 = 6.10 µM. Specificity vs ranitidine/famotidine/etc confirmed in same study.',
    kinetics: { ki_uM: 6.10 },
    source_pmid: 'PMID:2878667',
  },
  {
    slug: 'warfarin',
    name: 'Warfarin',
    level: 'caution',
    note: 'CYP2C9 inhibition. Kirch 1984 review (PMID:6096071) verbatim: "warfarin clearance was significantly reduced from 66.7 to 48.7 ml/min by ranitidine, and by cimetidine to 42.9 ml/min". CL ratio 66.7/42.9 = 1.555 → AUC ratio 1.55×. Ki ≈ 5/0.55 = 9.01 µM. Caveat: secondary reporting in a review paper (Kirch); primary source is Serlin/Toon era 1980-83 studies.',
    kinetics: { ki_uM: 9.01 },
    source_pmid: 'PMID:6096071',
  },
];

// ── Carbamazepine induction edges (3 new) ────────────────────────────
const CARBAMAZEPINE_EDGES: InteractionRef[] = [
  {
    slug: 'simvastatin',
    name: 'Simvastatin',
    level: 'major',
    note: 'CYP3A4 induction. Ucar 2004 (PMID:14691614) verbatim: "Carbamazepine decreased the mean total area under the serum concentration-time curve of simvastatin and simvastatin acid by 75% (P<0.001) and 82% (P<0.001), respectively". 12 healthy volunteers, randomized 2-phase crossover, CBZ 600 mg/d × 14d (200 mg/d first 2d) + single 80 mg PO simvastatin. AUC ↓75% → induction_factor 1/0.25 = 4.0. t½ simvastatin acid 5.9 → 3.7 h.',
    kinetics: { induction_factor: 4.0 },
    source_pmid: 'PMID:14691614',
  },
  {
    slug: 'midazolam',
    name: 'Midazolam',
    level: 'major',
    note: 'CYP3A4 induction. Backman 1996 (PMID:8598183) verbatim: "the area under the plasma concentration-time curve (AUC) of midazolam (mean +/- SEM) was only 5.7% (0.60 +/- 0.16 vs. 10.5 +/- 0.6 microgram x min/ml) ... of its value in control subjects (p < 0.001)". Caveat: 6 epilepsy patients on CBZ OR phenytoin pooled vs 7 controls — combined-cohort effect; authoring under CBZ as the dominant CYP3A4 inducer. AUC 5.7% of control → induction_factor 17.5.',
    kinetics: { induction_factor: 17.5 },
    source_pmid: 'PMID:8598183',
  },
  {
    slug: 'hormonal-contraceptives',
    name: 'Hormonal contraceptives',
    level: 'warn',
    note: 'CYP3A4 induction (ethinylestradiol). Crawford 1990 (PMID:2126946) verbatim: "Carbamazepine reduced the AUC for EE2 from 1163 +/- 466 to 672 +/- 211 pg ml-1 h (P less than 0.05) and for Ng from 22.9 +/- 9.4 to 13.8 +/- 5.8 ng ml-1 h (P less than 0.05)". n=4 women on CBZ 8-12 wk, single-dose 50 µg EE2 + 250 µg levonorgestrel. EE2 AUC 672/1163 = 0.578 → induction_factor 1.73. Contraceptive failure risk well-documented.',
    kinetics: { induction_factor: 1.73 },
    source_pmid: 'PMID:2126946',
  },
];

// ── Phenobarbital induction (1 new) ──────────────────────────────────
const PHENOBARBITAL_EDGES: InteractionRef[] = [
  {
    slug: 'theophylline',
    name: 'Theophylline',
    level: 'caution',
    note: 'CYP1A2 induction. Landay 1978 (PMID:659737) verbatim: "Following four weeks of phenobarbital administration, all six subjects showed a resultant increase in serum clearance varying from 11% to 60% with a mean increase of 34% (from 3.01 to 4.04 L/hr/1.73 M2)". 6 healthy nonsmoking adults, within-subject before/after design. CL × 1.34 → induction_factor 1.34. Clinically: barbiturate co-administration with asthma therapy requires theophylline dose adjustment.',
    kinetics: { induction_factor: 1.34 },
    source_pmid: 'PMID:659737',
  },
];

// ── Phenytoin induction (1 bonus edge from same Crawford 1990 paper) ─
const PHENYTOIN_EDGES: InteractionRef[] = [
  {
    slug: 'hormonal-contraceptives',
    name: 'Hormonal contraceptives',
    level: 'warn',
    note: 'CYP3A4 induction (ethinylestradiol). Crawford 1990 (PMID:2126946) verbatim: "Phenytoin reduced the AUC for EE2 from 806 +/- 50 (mean +/- s.d.) to 411 +/- 132 pg ml-1 h (P less than 0.05) and for Ng from 33.6 +/- 7.8 to 19.5 +/- 3.8 ng ml-1 h (P less than 0.05)". n=6 women on phenytoin 8-12 wk, single-dose 50 µg EE2 + 250 µg levonorgestrel. EE2 AUC 411/806 = 0.510 → induction_factor 1.96. Contraceptive failure well-documented with phenytoin.',
    kinetics: { induction_factor: 1.96 },
    source_pmid: 'PMID:2126946',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  const sameKi = existing?.kinetics?.ki_uM === edge.kinetics?.ki_uM;
  const sameInd = existing?.kinetics?.induction_factor === edge.kinetics?.induction_factor;
  if (sameKi && sameInd && existing?.source_pmid === edge.source_pmid) {
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
    const k = edge.kinetics?.ki_uM != null ? `Ki=${edge.kinetics.ki_uM} µM` : `ind×${edge.kinetics?.induction_factor}`;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] ${perpSlug.padEnd(14)} → ${edge.slug.padEnd(24)} ${k.padEnd(14)} ${edge.source_pmid}`);
  }
  return { added, updated, already };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  const cim = applyEdges(bySlug, 'cimetidine', CIMETIDINE_EDGES);
  const cbz = applyEdges(bySlug, 'carbamazepine', CARBAMAZEPINE_EDGES);
  const phb = applyEdges(bySlug, 'phenobarbital', PHENOBARBITAL_EDGES);
  const pht = applyEdges(bySlug, 'phenytoin', PHENYTOIN_EDGES);

  const totalAdded = cim.added + cbz.added + phb.added + pht.added;
  const totalUpdated = cim.updated + cbz.updated + phb.updated + pht.updated;
  const totalAlready = cim.already + cbz.already + phb.already + pht.already;

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a multi-CYP (v1.1): +${totalAdded} edges (${totalUpdated} updated, ${totalAlready} already-had). 10 skips logged.`);
}

main();
