/**
 * 2026-09-08-ki-calibration-basis.ts
 *
 * `InteractionKinetics.ki_uM` is documented as "a published Ki against the
 * dominant clearance enzyme of the victim". ALMOST NONE OF THE 120 STORED
 * VALUES IS ONE.
 *
 * ── FOUND BY ALGEBRA, NOT BY READING ──────────────────────────────────────
 * A screen inverted every edge that quotes a clinical fold-change:
 *     I = ki_uM × (auc_ratio − 1)
 * and asked whether I is constant WITHIN a perpetrator block. It is, to two
 * decimals, on block after block — itraconazole 0.5 µM, trimethoprim 3.0,
 * aprepitant 1.5, cimetidine 5.0, paroxetine 0.2, gemfibrozil 35. Some notes
 * write the arithmetic out loud ("Ki ≈ 0.2/1.38", "Ki ≈ 1.5/0.47 = 3.19").
 * EVERY EDGE IN THESE BLOCKS CITES A CLINICAL DDI STUDY; NOT ONE CITES AN
 * IN-VITRO Ki MEASUREMENT.
 *
 * ── AND THE CALIBRATION IS MOSTLY SOUND, WHICH IS WHY DELETING IS WRONG ───
 * The solver computes an exposure ratio of 1 + Cp/Ki, so ki = I/(R−1)
 * reproduces the published R exactly WHEN Cp = I. Testing I against each
 * perpetrator's own modelled plasma level:
 *     itraconazole  I 0.5   vs mean Cp 0.53  — 0.94×, essentially exact
 *     trimethoprim  I 3.0   vs mean Cp 3.57  — 0.84×
 *     fluconazole   I 30    vs mean Cp 41.2  — 0.73×
 *     cimetidine    I 5.0   vs mean Cp 1.63  — 3.1× high
 *     paroxetine    I 0.2   vs mean Cp 0.054 — 3.7× high
 *     gemfibrozil   I 35    vs mean Cp 15.1  — and independently proved to be
 *                                              the GLUCURONIDE's K_I: foreign
 * So these are not fabrications. They are calibrations to a typical exposure —
 * a defensible way to carry an interaction whose in-vitro constant is
 * unpublished or unusable, since the fold-change is what the papers report.
 * Deleting them would remove real and clinically important magnitudes
 * (itraconazole + simvastatin is contraindicated).
 *
 * THE DEFECT IS THE LABEL, NOT THE NUMBER. A calibration stored in a field
 * documented as a measurement, against a PMID that contains no Ki, with the
 * dose-response away from the assumed exposure silently unanchored. So the
 * three inputs are now stored, the basis is declared, and data-lint ERRORS if
 * ki_uM does not reproduce assumed_perp_uM/(auc_ratio − 1) to within 2%.
 *
 * ki_uM is recomputed EXACTLY from the verbatim ratio, so a stored value now
 * reflects its own cited source rather than a rounded intermediate.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Kin { ki_uM?: number; ki_basis?: string; auc_ratio?: number; assumed_perp_uM?: number; mbi?: boolean }
interface Compound { slug: string; interactions?: { slug?: string; note?: string; kinetics?: Kin }[]; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

/** perpetrator → [assumed [I] µM, [victim, verbatim AUC ratio][]] */
const BLOCKS: Record<string, [number, [string, number][]]> = {
  // "increased the AUC 27-fold"; "2.5-fold after 20 mg dosing"; "by 144%";
  // "more than twentyfold"; 671/252 ng·h/mL = 2.663.
  itraconazole: [0.5, [['triazolam', 27], ['atorvastatin', 2.5], ['oxycodone', 2.44], ['lovastatin', 20], ['alprazolam', 2.663]]],
  // "by 61%", "by 37%", "by 42%".
  trimethoprim: [3.0, [['repaglinide', 1.61], ['rosiglitazone', 1.37], ['pioglitazone', 1.42]]],
  // "1.47-fold"; "approximately 2.0-fold".
  aprepitant: [1.5, [['midazolam', 1.47], ['dexamethasone', 2.0]]],
  // CL −36% → 1/0.64; bioavailability +136.5%; elimination −45% → 1/0.55;
  // CL 66.7 → 42.9 mL/min.
  cimetidine: [5.0, [['theophylline', 1.5625], ['propranolol', 2.365], ['diazepam', 1.8182], ['warfarin', 1.5548]]],
  // S-metoprolol 279→1418; 2.3× in *wt/*wt; 5× CL fall; +45% active moiety;
  // 2.38× in EMs; +37%; "approximately 2.5-fold".
  paroxetine: [0.2, [['metoprolol', 5.08], ['atomoxetine', 2.3], ['desipramine', 5.0], ['risperidone', 1.45], ['aripiprazole', 2.38], ['tramadol', 1.37], ['carvedilol', 2.5]]],
};

const PROSE: Record<string, string> = {
  itraconazole: 'INTERACTIONS: FIVE OF THE EIGHT AFFINITIES ON THIS RECORD ARE NOT AFFINITIES — they are the published exposure fold-change inverted through one assumed inhibitor concentration of 0.5 µM, and every one of them cites a clinical interaction study rather than any in-vitro measurement. THE CALIBRATION IS SOUND, WHICH IS WHY NOTHING IS DELETED: 0.5 µM is within six percent of this record own modelled mean plasma level, so the solver reproduces each published ratio at typical exposure. What was wrong was the label — a calibration sitting in a field documented as a measurement, against papers a reader would search in vain for a Ki. All five now declare the basis and both inputs, and the lint recomputes the constant. THREE EDGES DO NOT RECONSTRUCT AND ARE LEFT ALONE AND LOGGED: simvastatin, midazolam and cyclosporine imply ratios of 3.9, 4.8 and 1.3 against cited figures of at least tenfold, ten to fifteen fold, and about twofold. They look deliberately ATTENUATED — a tenfold clearance collapse is a violent thing to render — but that is a guess, and an undocumented cap is its own defect.',
  trimethoprim: 'INTERACTIONS: ALL THREE AFFINITIES ARE THE SAME ALGEBRA — the verbatim exposure rise inverted through one assumed concentration of 3.0 µM, which is within twenty percent of this record own modelled mean plasma level. The block reconstructs exactly on every edge, which is what makes it safe to relabel rather than remove.',
  aprepitant: 'INTERACTIONS: BOTH AFFINITIES ARE CALIBRATIONS, AND ONE NOTE ALREADY SAID SO OUT LOUD — it writes "Ki ≈ 1.5/0.47 = 3.19" in plain sight. The assumed concentration of 1.5 µM sits about four times below this record own modelled mean plasma level, so unlike itraconazole the calibration is anchored to an exposure the model does not actually produce; the ratio it reproduces is therefore softer than the published one. Declared rather than silently corrected, because the published fold-change is the quantity worth keeping.',
  cimetidine: 'INTERACTIONS: ALL FOUR AFFINITIES ARE THE SAME INVERSION THROUGH AN ASSUMED 5.0 µM, and each reconstructs its own cited figure to better than one percent — including two edges whose sources report a CLEARANCE FALL rather than an exposure rise, converted correctly as the reciprocal. THE ASSUMED CONCENTRATION IS THREE TIMES THIS RECORD OWN MODELLED MEAN, though it sits below the modelled peak, so the calibration is anchored nearer the peak than the average. Declared.',
  paroxetine: 'INTERACTIONS: ALL SEVEN AFFINITIES ARE CALIBRATIONS THROUGH ONE ASSUMED 0.2 µM, and two of the notes already print the arithmetic ("Ki ≈ 0.2/1.38"). THE ASSUMED CONCENTRATION IS NEARLY FOUR TIMES THIS RECORD OWN MODELLED MEAN PLASMA LEVEL, so the model under-produces these interactions at typical dosing — worth stating, because paroxetine is a mechanism-based inhibitor whose real-world effect is if anything larger than a static calculation suggests. Every edge is marked mechanism-based already, which is consistent with the clinical fold-changes and inconsistent with treating the number as a reversible affinity; declaring the basis is what makes that tension visible rather than hidden.',
};

for (const [perp, [I, edges]] of Object.entries(BLOCKS)) {
  const c = need(perp);
  let n = 0;
  for (const [victim, R] of edges) {
    const e = (c.interactions ?? []).find((x) => x.slug === victim);
    if (!e?.kinetics) throw new Error(`${perp} → ${victim} missing`);
    if (e.kinetics.ki_basis) continue;
    const exact = Number((I / (R - 1)).toPrecision(6)); // toFixed(4) is too coarse for a sub-nanomolar Ki: 0.16/127 rounds to 0.0013 and then fails the 2% invariant against itself
    const before = e.kinetics.ki_uM;
    if (before == null) throw new Error(`${perp} → ${victim} has no ki_uM`);
    if (Math.abs(exact - before) / before > 0.05) {
      throw new Error(`${perp} → ${victim}: I/(R−1) = ${exact} but stored ${before} — block constant does not reconstruct, refusing to relabel`);
    }
    e.kinetics.ki_uM = exact;
    e.kinetics.ki_basis = 'calibrated_from_auc';
    e.kinetics.auc_ratio = R;
    e.kinetics.assumed_perp_uM = I;
    n++;
  }
  if (n) { note(c, PROSE[perp]!); log.push(`${perp} — ${n} edge(s) relabelled calibrated_from_auc at [I] = ${I} µM`); }
  else log.push(`${perp} — already relabelled, skipped`);
}

console.log(`\nki calibration basis — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
