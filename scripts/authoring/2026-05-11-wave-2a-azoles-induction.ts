/**
 * 2026-05-11-wave-2a-azoles-induction.ts — Wave 2a azole tail + induction tail (v1.1).
 *
 * Itraconazole had 3 edges (simvastatin, cyclosporine, midazolam)
 * despite being the canonical strong CYP3A4 inhibitor with the deepest
 * crossover-PK literature of any azole. Voriconazole had 3 edges
 * (tacrolimus, cyclosporine, midazolam). St John's Wort had 4 induction
 * edges but was missing the canonical digoxin / midazolam / simvastatin
 * / methadone victims.
 *
 * This session: 10 edges authored — 5 itraconazole, 1 voriconazole
 * (alfentanil bonus from a "wrong-substrate" skip), 4 SJW induction.
 *
 * ── Authored edges ────────────────────────────────────────────────
 *
 * Itraconazole (Cp_perp = 0.5 µM):
 *   → triazolam      Ki=0.019  contraindicated  AUC 27×  PMID:7995001
 *   → alprazolam     Ki=0.30   caution         AUC 2.66× PMID:9784084
 *   → atorvastatin   Ki=0.33   caution         AUC 2.5×  PMID:11061579
 *   → lovastatin     Ki=0.026  contraindicated  AUC >20× PMID:8689812
 *   → oxycodone      Ki=0.35   caution         AUC 2.44× PMID:20076952
 *
 * Voriconazole (Cp_perp = 5 µM):
 *   → alfentanil     Ki=1.0    major           AUC 6×    PMID:17112806
 *
 * St John's Wort (induction, hyperforin-driven CYP3A4 / P-gp):
 *   → digoxin        ind×1.33  caution         AUC ↓25%  PMID:10546917 (P-gp)
 *   → methadone      ind×2.13  caution         conc ↓47% PMID:12649774 (case series)
 *   → midazolam      ind×1.53  caution         CL ratio  PMID:14663455
 *   → simvastatin    ind×2.08  warn            AUC 0.48× PMID:11753267
 *
 * ── Caveats ───────────────────────────────────────────────────────
 *
 * 1. itraconazole → lovastatin: abstract says "more than twentyfold";
 *    Ki uses 20× as conservative lower bound. Actual fold likely higher,
 *    meaning Ki authored here slightly underestimates inhibition strength.
 *    Contraindication holds regardless.
 *
 * 2. SJW → methadone: PMID:12649774 is a n=4 open case series, not
 *    a controlled crossover. Trough concentration ratio used as AUC
 *    proxy. Provenance flagged in note. Same lower-confidence pattern
 *    as the earlier cipro → clozapine case-report edge.
 *
 * 3. SJW → midazolam: abstract reports oral CL ratio (109.2 → 166.7 L/h)
 *    rather than AUC. For oral midazolam where systemic CL is unchanged,
 *    AUC_oral ratio = CL_oral_baseline / CL_oral_after = 0.655 → ind×1.53.
 *    Algebra noted in edge prose.
 *
 * 4. SJW → digoxin: digoxin is P-gp substrate, not primarily CYP3A4.
 *    The induction factor is authored as a P-gp induction edge — the
 *    schema accepts induction_factor for any kinetic mechanism that
 *    accelerates elimination, so it fits.
 *
 * 5. voriconazole → alfentanil came back from the agent as a "wrong-
 *    substrate" skip (target list had fentanyl, paper studied alfentanil).
 *    But alfentanil IS in the registry as its own slug, and the PMID
 *    carries a clean abstract-verbatim 6-fold AUC bump for that pair —
 *    so authored as voriconazole → alfentanil, not fentanyl.
 *
 * ── Skipped (11) — logged in AUTHORING_GAPS.md ────────────────────
 *
 *   itraconazole → fentanyl       — only PBPK modeling paper indexed
 *   posaconazole → cyclosporine   — empiric dose guidance, no AUC
 *   posaconazole → vincristine    — Italian survey + reviews, no PK
 *   posaconazole → simvastatin    — case report + Aspergillosis review
 *   posaconazole → atorvastatin   — wrong-topic papers in PubMed
 *   voriconazole → omeprazole     — reverse direction (omep on vori)
 *   voriconazole → warfarin       — PD endpoint (PT-AUEC), no S-warf AUC
 *   voriconazole → fentanyl       — vori + fentanyl pair not indexed
 *                                   (alfentanil pair authored from same source)
 *   voriconazole → sirolimus      — empiric "90% dose reduction" case series
 *   voriconazole → simvastatin    — only modeling review indexed
 *   modafinil → ethinylestradiol  — Robertson 2002 abstract qualitative
 *                                   ("marked decrease", "much smaller")
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

// ── Itraconazole CYP3A4 tail (5 edges) ───────────────────────────────
const ITRACONAZOLE_EDGES: InteractionRef[] = [
  {
    slug: 'triazolam',
    name: 'Triazolam',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition. Varhe 1994 (PMID:7995001) verbatim: "ketoconazole and itraconazole increased the area under the triazolam concentration-time curve [AUC(0-infinity)] 22-fold and 27-fold (p < 0.001)". 9 healthy volunteers, double-blind 3-phase crossover, itraconazole 200 mg/d × 4d + single 0.25 mg PO triazolam d4. AUC 27×; Ki ≈ 0.5/26 = 0.019 µM. PD profoundly impaired; pair is label-contraindicated.',
    kinetics: { ki_uM: 0.019 },
    source_pmid: 'PMID:7995001',
  },
  {
    slug: 'alprazolam',
    name: 'Alprazolam',
    level: 'caution',
    note: 'CYP3A4 inhibition. Yasui 1998 (PMID:9784084) verbatim: itraconazole "increased the area under the concentration-time curves from 0 h to infinity (252 +/- 47 versus 671 +/- 205 ng h/ml)". 10 healthy male, double-blind randomized crossover, itra 200 mg/d × 6d + 0.8 mg PO alprazolam. AUC ratio 671/252 = 2.66×; Ki ≈ 0.5/1.66 = 0.30 µM.',
    kinetics: { ki_uM: 0.30 },
    source_pmid: 'PMID:9784084',
  },
  {
    slug: 'atorvastatin',
    name: 'Atorvastatin',
    level: 'caution',
    note: 'CYP3A4 inhibition. Mazzu 2000 (PMID:11061579) verbatim: "itraconazole dramatically increased atorvastatin AUC (150%)" / "elevated atorvastatin plasma levels (2.5-fold) after 20 mg dosing". 18 healthy, single-site randomized 3-way open-label crossover, itra 200 mg + atorvastatin 20 mg. AUC ratio 2.5×; Ki ≈ 0.5/1.5 = 0.33 µM. Statin myopathy risk.',
    kinetics: { ki_uM: 0.33 },
    source_pmid: 'PMID:11061579',
  },
  {
    slug: 'lovastatin',
    name: 'Lovastatin',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition. Neuvonen 1996 (PMID:8689812) verbatim: "itraconazole increased the peak concentration (Cmax) of lovastatin and the area under the lovastatin concentration-time curve (AUC) more than twentyfold (p < 0.001)". 12 healthy, double-blind 2-phase crossover, itra 200 mg/d × 4d + single 40 mg PO lovastatin. AUC ≥20× (conservative lower bound); Ki ≈ 0.5/19 = 0.026 µM. Rhabdomyolysis risk; pair is label-contraindicated.',
    kinetics: { ki_uM: 0.026 },
    source_pmid: 'PMID:8689812',
  },
  {
    slug: 'oxycodone',
    name: 'Oxycodone',
    level: 'caution',
    note: 'CYP3A4 inhibition (N-demethylation to noroxycodone). Saari 2010 (PMID:20076952) verbatim: itraconazole "increased the AUC(0-infinity) of orally administrated oxycodone by 144% (P<0.001)". 12 healthy, 4-session paired crossover, itra 200 mg × 5d + 10 mg PO oxycodone (oral arm; separate IV arm +51%). PO AUC ratio 2.44×; Ki ≈ 0.5/1.44 = 0.35 µM. Respiratory depression risk.',
    kinetics: { ki_uM: 0.35 },
    source_pmid: 'PMID:20076952',
  },
];

// ── Voriconazole CYP3A4 (1 edge, alfentanil) ─────────────────────────
const VORICONAZOLE_EDGES: InteractionRef[] = [
  {
    slug: 'alfentanil',
    name: 'Alfentanil',
    level: 'major',
    note: 'CYP3A4 inhibition. Saari 2006 (PMID:17112806) verbatim: "Voriconazole decreased the mean plasma clearance of intravenous alfentanil by 85% ... The area under the alfentanil plasma concentration-time curve was increased by 6-fold by voriconazole (P<.001)". 12 healthy, randomized 3-phase crossover, oral vori (400 mg bid d1, 200 mg bid d2) + 20 µg/kg IV alfentanil. t½ 1.5 → 6.6 h. Ki ≈ 5/5 = 1.0 µM. Profound respiratory depression risk.',
    kinetics: { ki_uM: 1.0 },
    source_pmid: 'PMID:17112806',
  },
];

// ── St John's Wort induction tail (4 edges) ──────────────────────────
const SJW_EDGES: InteractionRef[] = [
  {
    slug: 'digoxin',
    name: 'Digoxin',
    level: 'caution',
    note: 'P-gp induction (digoxin is primarily P-gp substrate, not CYP3A4). Johne 1999 (PMID:10546917) verbatim: "10 days of treatment with hypericum extract resulted in a decrease of digoxin AUC(0-24) by 25% (day 15, 17.2+/-4.0 microg x h/L and 12.9+/-2.3 microg x h/L; P = .0035)". Single-blind placebo-controlled parallel, n=13 SJW (LI160 900 mg/d × 10d) vs n=12 placebo. AUC ratio 12.9/17.2 = 0.75 → induction_factor 1/0.75 = 1.33.',
    kinetics: { induction_factor: 1.33 },
    source_pmid: 'PMID:10546917',
  },
  {
    slug: 'methadone',
    name: 'Methadone',
    level: 'caution',
    note: 'CYP3A4 induction. Eich-Höchli 2003 (PMID:12649774) verbatim: trough methadone after SJW gave "median decrease to 47% of the original concentration (range: 19% - 60%)". n=4 OPEN CASE SERIES (not crossover), SJW 900 mg/d × ~31d. Trough → AUC proxy ratio 0.47 → induction_factor 2.13. Provenance is case-series — lower confidence than controlled crossover; flagged here so the registry maintainer can re-cite when a primary RCT publishes.',
    kinetics: { induction_factor: 2.13 },
    source_pmid: 'PMID:12649774',
  },
  {
    slug: 'midazolam',
    name: 'Midazolam',
    level: 'caution',
    note: 'CYP3A4 induction. Hall 2003 (PMID:14663455) verbatim: "The oral clearance of midazolam was significantly increased (109.2 +/- 47.9 L/h to 166.7 +/- 81.3 L/h, P =.007)" by SJW. 12 healthy premenopausal women, controlled crossover-within-cycle design, SJW 300 mg tid × 14d. Oral CL ratio 109.2/166.7 = 0.655; AUC_oral_ratio = 0.655 → induction_factor 1/0.655 = 1.53.',
    kinetics: { induction_factor: 1.53 },
    source_pmid: 'PMID:14663455',
  },
  {
    slug: 'simvastatin',
    name: 'Simvastatin',
    level: 'warn',
    note: 'CYP3A4 induction. Sugimoto 2001 (PMID:11753267) verbatim: simvastatin acid "area under the plasma concentration-time curve between time zero and 24 hours after administration (ratio, 0.48 of placebo) was significantly decreased (P <.05) by St John\\u2019s Wort". n=8 simvastatin arm, double-blind crossover, SJW 300 mg tid × 14d. Active-metabolite AUC ratio 0.48 → induction_factor 1/0.48 = 2.08. Statin efficacy loss.',
    kinetics: { induction_factor: 2.08 },
    source_pmid: 'PMID:11753267',
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
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] ${perpSlug.padEnd(14)} → ${edge.slug.padEnd(14)} ${k.padEnd(14)} ${edge.source_pmid}`);
  }
  return { added, updated, already };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  const itra = applyEdges(bySlug, 'itraconazole', ITRACONAZOLE_EDGES);
  const vori = applyEdges(bySlug, 'voriconazole', VORICONAZOLE_EDGES);
  const sjw = applyEdges(bySlug, 'st-johns-wort', SJW_EDGES);

  const totalAdded = itra.added + vori.added + sjw.added;
  const totalUpdated = itra.updated + vori.updated + sjw.updated;
  const totalAlready = itra.already + vori.already + sjw.already;

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a azoles + induction (v1.1): +${totalAdded} edges (${totalUpdated} updated, ${totalAlready} already-had). 11 skips logged.`);
}

main();
