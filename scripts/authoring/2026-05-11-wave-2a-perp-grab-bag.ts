/**
 * 2026-05-11-wave-2a-perp-grab-bag.ts — Wave 2a remaining perpetrators (v1.1).
 *
 * Five perpetrators that were at 0-1 edges each despite well-published
 * clinical PK literature: terbinafine (CYP2D6 inhibitor), aprepitant
 * (CYP3A4 inhibitor + CYP2C9 inducer), bosentan (CYP3A4/2C9 inducer),
 * oxcarbazepine (mild CYP3A4 inducer), modafinil (CYP2C19 inhibitor +
 * mild CYP3A4 inducer).
 *
 * 12 edges authored — strongest yield of any session today.
 *
 * Bonus from Rowland 2018 (PMID:29178272) modafinil cocktail study:
 * the abstract carries AUC ratios for FIVE probe substrates verbatim
 * (caffeine, DXM, losartan, midazolam, omeprazole at SS), so we get
 * three modafinil edges from one source — and the omeprazole AUC 1.90×
 * reveals modafinil as a CYP2C19 inhibitor, the canonical FDA-label
 * DDI that we hadn't captured anywhere yet.
 *
 * ── Authored edges ────────────────────────────────────────────────
 *
 * Terbinafine (CYP2D6 inhibition; Cp_perp = 3 µM):
 *   → desipramine    Ki=0.761  warn  AUC 4.94×  PMID:12412819
 *   → venlafaxine    Ki=0.769  warn  AUC 490%   PMID:17687273
 *
 * Aprepitant (CYP3A4 inhibition; Cp_perp = 1.5 µM):
 *   → midazolam      Ki=3.19   caution  AUC 1.47× IV  PMID:17463213
 *   → dexamethasone  Ki=1.50   caution  AUC 2.0×       PMID:21209230
 *
 * Bosentan (CYP3A4 + 2C9 induction):
 *   → simvastatin              ind×1.52  caution  AUC ↓34%   PMID:12603176
 *   → sildenafil               ind×2.67  caution  AUC ↓62.6% PMID:18040672
 *   → hormonal-contraceptives  ind×1.45  caution  EE ↓31%    PMID:16550733
 *
 * Oxcarbazepine (mild CYP3A4 induction):
 *   → hormonal-contraceptives  ind×1.89  caution  EE+LN ↓47% PMID:10368079
 *   → felodipine               ind×1.39  caution  AUC ↓28%   PMID:8451779
 *
 * Modafinil (CYP2C19 inhibition + CYP3A4 induction; Cp_perp = 10 µM):
 *   → omeprazole     Ki=11.1   caution  AUC 1.90×  PMID:29178272 (CYP2C19)
 *   → midazolam      ind×1.52  caution  AUC 0.66  PMID:29178272 (CYP3A4)
 *   → dextromethorphan ind×1.27 caution AUC 0.79 PMID:29178272 (CYP2D6 mild)
 *
 * ── Caveats noted in edge prose ───────────────────────────────────
 *
 * 1. aprepitant → midazolam (Majumdar 2007) is IV midazolam — bypasses
 *    gut CYP3A so oral interaction is larger (label cites ~3× oral AUC).
 *    Authored as the abstract-verbatim IV value; note explains.
 *
 * 2. aprepitant → dexamethasone (Marbury 2011) used fosaprepitant 150 mg
 *    IV (prodrug). Active species is aprepitant, so authoring under
 *    aprepitant slug with prodrug caveat in note.
 *
 * 3. bosentan → simvastatin is parent simvastatin (-34%); the active
 *    β-hydroxyacid metabolite drops 46% (verbatim). Author parent for
 *    consistency with how the lovastatin/atorvastatin edges represent
 *    parent compound.
 *
 * 4. Modafinil's dual action: CYP2C19 INHIBITION (omeprazole AUC rises)
 *    + CYP3A4 INDUCTION (midazolam falls) is unusual. All three edges
 *    are from the same Rowland 2018 cocktail abstract, so attribution
 *    is unambiguous.
 *
 * ── Skipped (8) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 *   terbinafine → nortriptyline (case report only)
 *   terbinafine → metoprolol (case report only)
 *   terbinafine → dextromethorphan (in vitro Ki=0.03 µM only)
 *   terbinafine → atomoxetine (no clinical PK indexed)
 *   aprepitant → hormonal-contraceptives (only Gateways index articles)
 *   aprepitant → tolbutamide (tolbutamide missing from registry)
 *   bosentan → cyclosporine (no clinical-AUC abstract in induction direction)
 *   oxcarbazepine → simvastatin (review-level only)
 *   modafinil → triazolam (only armodafinil PMID, not racemic modafinil)
 *   modafinil → cyclosporine (case report only)
 *   modafinil → losartan (Rowland 2018 abstract verbatim "0.98" — no signal)
 *   modafinil → caffeine (Rowland 2018 abstract verbatim "0.90" — ind×1.11
 *                          below clinically meaningful threshold)
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

const TERBINAFINE_EDGES: InteractionRef[] = [
  {
    slug: 'desipramine',
    name: 'Desipramine',
    level: 'warn',
    note: 'CYP2D6 inhibition. Madani 2002 (PMID:12412819) verbatim: "significant increase in desipramine C(max) (19 ng/ml vs. 36 ng/ml) and AUC0-infinity (482 ng.h/ml vs. 2383 ng.h/ml)". 12 CYP2D6 EMs (genotyped + phenotyped), terbinafine 250 mg/d × 21d + 50 mg PO desipramine. AUC ratio 2383/482 = 4.94×; Ki ≈ 3/3.94 = 0.761 µM. Long-lasting — C/AUC still elevated 4 wk after terbinafine discontinuation.',
    kinetics: { ki_uM: 0.761 },
    source_pmid: 'PMID:12412819',
  },
  {
    slug: 'venlafaxine',
    name: 'Venlafaxine',
    level: 'warn',
    note: 'CYP2D6 inhibition (O-demethylation). Hynninen 2008 (PMID:17687273) verbatim: "During the terbinafine phase, the area under the plasma concentration-time curve (AUC(0-infinity)) of venlafaxine was on average 490% (P<0.001) ... of the corresponding control value". Healthy volunteers, terbinafine pretreatment + 75 mg PO venlafaxine. AUC 4.90×; Ki ≈ 3/3.90 = 0.769 µM. ODV AUC ratio of parent decreased 82% — narrowed therapeutic ratio + serotonergic toxicity risk.',
    kinetics: { ki_uM: 0.769 },
    source_pmid: 'PMID:17687273',
  },
];

const APREPITANT_EDGES: InteractionRef[] = [
  {
    slug: 'midazolam',
    name: 'Midazolam',
    level: 'caution',
    note: 'CYP3A4 inhibition. Majumdar 2007 (PMID:17463213) verbatim: "Aprepitant increased intravenous midazolam AUC(0-infinity) 1.47-fold (90% confidence interval, 1.36-1.59)". 12 subjects, randomized, IV midazolam 2 mg ± 125 mg PO aprepitant. AUC 1.47× IV; Ki ≈ 1.5/0.47 = 3.19 µM. Caveat: IV midazolam bypasses gut CYP3A — ORAL midazolam interaction is larger (label cites ~3× AUC). Authored from the abstract-verbatim IV value.',
    kinetics: { ki_uM: 3.19 },
    source_pmid: 'PMID:17463213',
  },
  {
    slug: 'dexamethasone',
    name: 'Dexamethasone',
    level: 'caution',
    note: 'CYP3A4 inhibition. Marbury 2011 (PMID:21209230) verbatim: "fosaprepitant increased the area under the plasma concentration-time curve from 0 to 24 hours by approximately 2.0-fold on days 1 and 2 and to a lesser extent (~1.2-fold) on day 3". Caveat: fosaprepitant 150 mg IV (aprepitant prodrug), 8 mg PO dexamethasone × 3d. Peak AUC ratio 2.0×; Ki ≈ 1.5/1.0 = 1.50 µM. Dexamethasone dose halved in aprepitant-containing antiemetic regimens.',
    kinetics: { ki_uM: 1.50 },
    source_pmid: 'PMID:21209230',
  },
];

const BOSENTAN_EDGES: InteractionRef[] = [
  {
    slug: 'simvastatin',
    name: 'Simvastatin',
    level: 'caution',
    note: 'CYP3A4 induction. Dingemanse 2003 (PMID:12603176) verbatim: "bosentan significantly reduced exposure to simvastatin and beta-hydroxyacid simvastatin by 34 and 46%, respectively". 9 healthy males, 3-period crossover, bosentan 125 mg bid × 5.5d + simvastatin 40 mg qd × 6d. Parent AUC ratio 0.66 → induction_factor 1/0.66 = 1.52. Per the paper: "in vivo bosentan is also a mild inducer of CYP3A4".',
    kinetics: { induction_factor: 1.52 },
    source_pmid: 'PMID:12603176',
  },
  {
    slug: 'sildenafil',
    name: 'Sildenafil',
    level: 'caution',
    note: 'CYP3A4 induction. Burgess 2008 (PMID:18040672) verbatim: "bosentan decreased ... the area under the plasma concentration versus time curve over a dosing interval (AUC(tau)) by 62.6% (90% CI 56.8-67.7%)". 55 healthy male volunteers, randomized double-blind placebo-controlled parallel, sildenafil 20→80 mg tid + bosentan 125 mg bid × 11d. AUC ratio 0.374 → induction_factor 2.67. Note: PAH patients often need both for combo therapy; sildenafil dose adjustment.',
    kinetics: { induction_factor: 2.67 },
    source_pmid: 'PMID:18040672',
  },
  {
    slug: 'hormonal-contraceptives',
    name: 'Hormonal contraceptives',
    level: 'caution',
    note: 'CYP3A4 induction. van Giersbergen 2006 (PMID:16550733) verbatim: bosentan "significantly decreased the AUC of norethisterone and ethinyl estradiol by 13.7% (-23.5, -2.6) and 31.0% (-40.5,-20.2), respectively". 20 healthy women, randomized 2-way crossover, bosentan 125 mg bid × 7d + Ortho-Novum (1 mg NE + 35 µg EE). EE basis: AUC ratio 0.69 → induction_factor 1.45. "In an individual subject ... maximum decrease ... was 56% and 66%" — contraceptive failure risk.',
    kinetics: { induction_factor: 1.45 },
    source_pmid: 'PMID:16550733',
  },
];

const OXCARBAZEPINE_EDGES: InteractionRef[] = [
  {
    slug: 'hormonal-contraceptives',
    name: 'Hormonal contraceptives',
    level: 'caution',
    note: 'CYP3A4 induction. Fattore 1999 (PMID:10368079) verbatim: "AUC(0-24h, geometric means) decreased by 47% for both EE (from 1,677 to 886 pg.h/ml; p < 0.01) and LN (from 137 to 73 ng.h/ml; p < 0.01), during OCBZ treatment". 22 healthy women (16 completers), randomized double-blind crossover, oxcarbazepine 1200 mg/d × 26d + 50 µg EE / 250 µg LN × 21d. AUC ratio 0.53 → induction_factor 1.89. Contraceptive failure risk; both EE and LN equally affected.',
    kinetics: { induction_factor: 1.89 },
    source_pmid: 'PMID:10368079',
  },
  {
    slug: 'felodipine',
    name: 'Felodipine',
    level: 'caution',
    note: 'CYP3A4 induction. Zaccara 1993 (PMID:8451779) verbatim: "Repeated coadministration of OXC significantly reduced the area under the concentration-time curve (AUC0-24) of FEL by 28% and the FEL maximum plasma concentration (Cmax) by 34%". 8 healthy male volunteers, open-label within-subject, felodipine 10 mg qd × 13d + OXC 600 mg single → 450 mg bid × 7d. AUC ratio 0.72 → induction_factor 1.39.',
    kinetics: { induction_factor: 1.39 },
    source_pmid: 'PMID:8451779',
  },
];

const MODAFINIL_EDGES: InteractionRef[] = [
  {
    slug: 'omeprazole',
    name: 'Omeprazole',
    level: 'caution',
    note: 'CYP2C19 inhibition. Rowland 2018 (PMID:29178272) verbatim: "Following dosing of modafinil to steady state (200 mg for 7 days), AUC ratios for caffeine, dextromethorphan, losartan, midazolam and omeprazole were 0.90 (± 0.16), 0.79 (± 0.09), 0.98 (± 0.11), 0.66 (± 0.12) and 1.90 (± 0.53), respectively". Open-label cocktail design. Omeprazole AUC 1.90× → Ki ≈ 10/0.90 = 11.1 µM. The canonical modafinil FDA-label DDI.',
    kinetics: { ki_uM: 11.1 },
    source_pmid: 'PMID:29178272',
  },
  {
    slug: 'midazolam',
    name: 'Midazolam',
    level: 'caution',
    note: 'CYP3A4 induction at steady state. Rowland 2018 (PMID:29178272) verbatim: same cocktail study, modafinil 200 mg/d × 7d gave midazolam AUC ratio "0.66 (± 0.12)". Single-dose modafinil arm showed no effect on midazolam (AUC 0.98) — induction emerges only at SS. AUC ratio 0.66 → induction_factor 1/0.66 = 1.52.',
    kinetics: { induction_factor: 1.52 },
    source_pmid: 'PMID:29178272',
  },
  {
    slug: 'dextromethorphan',
    name: 'Dextromethorphan',
    level: 'caution',
    note: 'Mild CYP2D6 induction at steady state. Rowland 2018 (PMID:29178272) verbatim: same cocktail study, modafinil 200 mg/d × 7d gave dextromethorphan AUC ratio "0.79 (± 0.09)". Single-dose modafinil had no effect (AUC 1.01) — induction emerges only at SS. AUC ratio 0.79 → induction_factor 1.27. Mild but reproducible across the 12-subject cohort.',
    kinetics: { induction_factor: 1.27 },
    source_pmid: 'PMID:29178272',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  const sameKi = existing?.kinetics?.ki_uM === edge.kinetics?.ki_uM;
  const sameInd = existing?.kinetics?.induction_factor === edge.kinetics?.induction_factor;
  if (sameKi && sameInd && existing?.source_pmid === edge.source_pmid) return 'already';
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

  const ter = applyEdges(bySlug, 'terbinafine', TERBINAFINE_EDGES);
  const apr = applyEdges(bySlug, 'aprepitant', APREPITANT_EDGES);
  const bos = applyEdges(bySlug, 'bosentan', BOSENTAN_EDGES);
  const oxc = applyEdges(bySlug, 'oxcarbazepine', OXCARBAZEPINE_EDGES);
  const mod = applyEdges(bySlug, 'modafinil', MODAFINIL_EDGES);

  const totalAdded = ter.added + apr.added + bos.added + oxc.added + mod.added;
  const totalUpdated = ter.updated + apr.updated + bos.updated + oxc.updated + mod.updated;
  const totalAlready = ter.already + apr.already + bos.already + oxc.already + mod.already;

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a perp grab-bag (v1.1): +${totalAdded} edges (${totalUpdated} updated, ${totalAlready} already-had). 12 skips logged.`);
}

main();
