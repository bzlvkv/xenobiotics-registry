/**
 * 2026-09-08-ki-calibration-basis-2.ts
 *
 * Second ki_basis batch: fluconazole, fluvoxamine and ritonavir — the three
 * largest remaining blocks. 25 edges.
 *
 * ── THESE BLOCKS DOCUMENT THEMSELVES ──────────────────────────────────────
 * Unlike the first five, most of these notes print the arithmetic in plain
 * sight — "Ki ~ 30/0.33 = 89.8", "Ki ~ 0.16/(17-1) = 0.010 uM (Cp_perp ~0.16",
 * "Ki ~ 5/(11-1) = 0.50 uM at full-dose Cp_perp". The author knew exactly what
 * they were computing and said so; what was missing was a FIELD to say it in,
 * so a reader of the data (rather than of the prose) saw only a bare affinity.
 *
 * ── RITONAVIR IS DELIBERATELY TWO-TIERED, AND THAT IS GOOD PRACTICE ───────
 * It is the one block that does NOT share one assumed concentration, and the
 * notes explain why: 5 uM for full-dose ritonavir (600 mg BID, the old
 * antiretroviral dose) and 1.5 uM for the 100 mg BOOSTER dose. Those are
 * genuinely different exposures of the same drug, and calibrating each edge to
 * the regimen its source actually studied is more careful, not less. The new
 * per-edge `assumed_perp_uM` records it exactly; a single block-wide constant
 * could not have.
 *
 * ── THE ATTENUATION PATTERN, NOW SEEN IN THREE INDEPENDENT BLOCKS ─────────
 * Six edges refuse to reconstruct, and they are not random — THEY ARE THE
 * LARGEST FOLD-CHANGES IN THEIR BLOCKS:
 *     ritonavir -> simvastatin  cited 32x,   stored implies  ~20x
 *     ritonavir -> tacrolimus   cited 57x,   stored implies  ~36x
 *     ritonavir -> midazolam    cited 28.4x, stored implies  ~46x
 *     itraconazole -> simvastatin/midazolam/cyclosporine (batch 1)
 *     fluconazole -> warfarin    cited 3.3x, stored implies  4.75x
 * Somebody appears to have hand-adjusted the extreme ones — in both directions,
 * which is why "they capped the big ones" is a guess and not a finding. The
 * script THROWS rather than relabel an edge whose arithmetic does not close, so
 * none of them could be swept in silently. Logged.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Kin { ki_uM?: number; ki_basis?: string; auc_ratio?: number; assumed_perp_uM?: number }
interface Compound { slug: string; interactions?: { slug?: string; kinetics?: Kin }[]; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

/** perpetrator → [victim, assumed [I] µM, verbatim exposure ratio][] */
const EDGES: Record<string, [string, number, number][]> = {
  fluconazole: [
    ['phenytoin', 30, 1.3342],    // AUC0-48 195.2 vs 146.3 µg·h/mL
    ['losartan', 30, 1.66],       // parent AUC +66%
    ['ibuprofen', 30, 1.82],      // "S-(+)-AUC ratio 1.82"
    ['celecoxib', 30, 2.61],      // "AUCinf increased 2.61x" in *1/*1 EMs
    ['fluvastatin', 30, 1.84],    // "AUC0-inf +84%"
    ['omeprazole', 30, 6.293],    // AUC 491 → 3090 ng·h/mL
    ['diazepam', 30, 2.5],        // "AUC0-inf 2.5x"
    ['midazolam', 30, 2.5],       // "AUC0-3, AUC0-17 increased 2-3x"
    ['triazolam', 30, 4.4],       // 4.4x at the 200 mg/d arm
    ['glimepiride', 30, 2.38],    // "was 238% ... of the respective control value"
    ['tacrolimus', 30, 3.3],      // "~3.3x trough rise" (the corroborating study)
  ],
  fluvoxamine: [
    ['caffeine', 0.16, 5.0952],   // total CL 107 → 21 mL/min
    ['theophylline', 0.16, 3.3333], // CL 80 → 24 mL/min
    ['melatonin', 0.16, 17],      // "melatonin AUC 17x higher"
    ['olanzapine', 0.16, 1.55],   // "AUC up 30-55%" — upper bound
    ['duloxetine', 0.16, 5.6],    // "AUC ↑460%"
    ['ramelteon', 0.16, 128],     // "128-fold actual"
    ['tizanidine', 0.16, 33],     // "AUC 33x"
    ['clozapine', 0.16, 3.63],    // "fluvoxamine (E=+263%)"
    ['tacrine', 0.16, 8.2963],    // AUC 27 → 224 ng·h/mL
  ],
  ritonavir: [
    ['atorvastatin', 5, 9.36],    // full-dose regimen
    ['sildenafil', 5, 11],        // "ritonavir 500 mg BID x 7d (full-dose)"
    ['alprazolam', 1.5, 2.44],    // "200 mg x 4 doses (booster-equivalent)"
    ['fentanyl', 1.5, 3],
    ['amlodipine', 1.5, 1.96],    // RTV-boosted darunavir
  ],
};

const PROSE: Record<string, string> = {
  fluconazole: 'INTERACTIONS: ELEVEN OF THE TWELVE AFFINITIES ARE THE PUBLISHED EXPOSURE RISE INVERTED THROUGH ONE ASSUMED CONCENTRATION OF 30 µM, and most of the notes already printed that arithmetic in plain sight. The calibration is well anchored: 30 µM is within thirty percent of this record own modelled mean plasma level, so the solver reproduces each cited ratio near typical exposure. Every edge cites a clinical interaction study and none cites an in-vitro constant, which is why the basis had to be declared rather than the numbers trusted as affinities. ONE EDGE DOES NOT RECONSTRUCT AND IS LEFT ALONE: the warfarin entry implies a 4.75-fold rise against a cited figure of about 3.3, so it asserts a stronger interaction than its own source — the opposite direction from the attenuated edges found elsewhere, which is why hand-adjustment is a guess rather than a finding.',
  fluvoxamine: 'INTERACTIONS: ALL NINE AFFINITIES RECONSTRUCT EXACTLY FROM ONE ASSUMED CONCENTRATION OF 0.16 µM, and two of the notes state it outright. THE BLOCK IS UNUSUALLY WELL BUILT UNDERNEATH THE MISLABELLING: four of the nine were derived from a reported CLEARANCE fall rather than an exposure rise and were correctly inverted as reciprocals, and the ratios span a hundred-fold — from 1.55 for olanzapine to 128 for ramelteon — with the same constant fitting every one. That is a coherent model of one inhibitor, not nine independent guesses. What was wrong is only that a reader of the DATA, as opposed to the prose, saw nine bare affinities against papers that contain none.',
  ritonavir: 'INTERACTIONS: THE ONE BLOCK THAT DELIBERATELY USES TWO ASSUMED CONCENTRATIONS, AND IT IS RIGHT TO. Its notes distinguish full-dose ritonavir from the 100 mg BOOSTER dose and calibrate each edge to the regimen its own source studied — 5 µM for the former, 1.5 µM for the latter. Those are genuinely different exposures of the same drug, so a single block constant would have been the cruder choice; the per-edge field now records the distinction that the prose was carrying alone. THREE EDGES REFUSE TO RECONSTRUCT AND ARE LEFT ALONE: simvastatin, tacrolimus and midazolam cite 32-fold, 57-fold and 28-fold rises while their stored values imply roughly 20, 36 and 46. THESE ARE THE THREE LARGEST FOLD-CHANGES IN THE BLOCK, and the same is true of the unreconstructed edges on itraconazole — but two are attenuated and one is amplified, so the pattern is real and its cause is not established.',
};

for (const [perp, edges] of Object.entries(EDGES)) {
  const c = need(perp);
  let n = 0;
  for (const [victim, I, R] of edges) {
    const e = (c.interactions ?? []).find((x) => x.slug === victim);
    if (!e?.kinetics) throw new Error(`${perp} → ${victim} missing`);
    if (e.kinetics.ki_basis) continue;
    const exact = Number((I / (R - 1)).toPrecision(6)); // toFixed(4) is too coarse for a sub-nanomolar Ki: 0.16/127 rounds to 0.0013 and then fails the 2% invariant against itself
    const before = e.kinetics.ki_uM;
    if (before == null) throw new Error(`${perp} → ${victim} has no ki_uM`);
    if (Math.abs(exact - before) / before > 0.05) {
      throw new Error(`${perp} → ${victim}: [I]/(R−1) = ${exact} but stored ${before} — refusing to relabel`);
    }
    e.kinetics.ki_uM = exact;
    e.kinetics.ki_basis = 'calibrated_from_auc';
    e.kinetics.auc_ratio = R;
    e.kinetics.assumed_perp_uM = I;
    n++;
  }
  if (n) { note(c, PROSE[perp]!); log.push(`${perp} — ${n} edge(s) relabelled calibrated_from_auc`); }
  else log.push(`${perp} — already relabelled, skipped`);
}

const left = data.reduce((s, c) => s + (c.interactions ?? []).filter((e) => e.kinetics?.ki_uM != null && !e.kinetics.ki_basis).length, 0);
console.log(`\nki calibration basis, batch 2 — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
console.log(`\n  ${left} ki_uM edges still carry no declared basis`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
