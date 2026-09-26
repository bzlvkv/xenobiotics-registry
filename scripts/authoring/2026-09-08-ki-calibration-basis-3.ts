/**
 * 2026-09-08-ki-calibration-basis-3.ts
 *
 * Third ki_basis batch — and the first to find blocks that are NOT calibrations.
 *
 * ── ajmalicine IS EXACTLY WHAT THE FIELD WAS DESIGNED FOR ─────────────────
 * All eight of its edges carry the SAME value because they cite the same thing:
 * "a potent in-vitro CYP2D6 inhibitor (Ki 3.3 nM)". A Ki belongs to an ENZYME,
 * not to a victim, so one CYP2D6 constant legitimately applies to every CYP2D6
 * substrate — the repetition that made my screen flag this block is correct
 * pharmacology, not a template. ACQUITTED, and now says so explicitly.
 *
 * ── ketoconazole IS A MIXTURE, AND ONE NOTE MISDESCRIBES ITSELF ───────────
 * Only its alprazolam edge is a clean measurement ("Ki = 0.046 microM",
 * verbatim, human liver microsomes). The rest are not:
 *   triazolam / nifedipine  0.015 from a verbatim RANGE "Ki 0.011-0.045 uM",
 *                           and the nifedipine note calls 0.015 "(midpoint)"
 *                           WHEN THE MIDPOINT OF THAT RANGE IS 0.028.
 *   sildenafil              0.015 from "IC(50) values less than 0.02 microM" —
 *                           an INEQUALITY, and an IC50 is not a Ki.
 *   cyclosporine, midazolam derived from clinical exposure changes, but no
 *                           single assumed concentration reconstructs both.
 * Only the sound one is marked; the other five are logged, because relabelling
 * them would be asserting something I have not established.
 *
 * ── AND THE SAME ALGEBRA IN FOUR MORE BLOCKS ──────────────────────────────
 * amiodarone 2 uM, ciprofloxacin 7.5, clarithromycin 3, erythromycin 3.
 * ciprofloxacin is the tidiest yet — all five edges land on 7.5 uM despite
 * being derived from three different kinds of reported quantity (an exposure
 * rise, a clearance fall, and a doubled trough).
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
const CALIBRATED: Record<string, [string, number, number][]> = {
  amiodarone: [
    ['flecainide', 2, 1.44],    // trough C/D 2.03 → 2.92 ng/mL/mg
    ['metoprolol', 2, 2.0],     // "metoprolol plasma concentration is doubled"
    ['simvastatin', 2, 1.73],   // simvastatin acid AUC0-24h +73%
    ['warfarin', 2, 1.79],      // 44% maximum dose reduction → 1/0.56
    ['phenytoin', 2, 1.4038],   // AUC 208 → 292 mg·h/L
  ],
  ciprofloxacin: [
    ['theophylline', 7.5, 1.39],   // CL −23-33%
    ['tizanidine', 7.5, 10],       // "raised tizanidine AUC 10x"
    ['caffeine', 7.5, 1.589],      // AUC 16.3 → 25.9 µg·h/mL
    ['ropivacaine', 7.5, 1.449],   // "decreased the mean clearance (CL) ... by 31%"
    ['clozapine', 7.5, 2.0],       // "clozapine concentrations doubled"
  ],
  clarithromycin: [
    ['simvastatin', 3, 10],     // "raised simvastatin AUC ~10x"
    ['midazolam', 3, 6.8],      // "Combined oral AUC ratio ≈ 6.8"
    ['triazolam', 3, 4.35],     // oral CL 413 → 95 mL/min
    ['colchicine', 3, 3.82],    // "Cmax and AUC ... increased by 277% and 282%"
  ],
  erythromycin: [
    ['simvastatin', 3, 3.9],    // simvastatin ACID AUC 3.9x — the arm that reconstructs
    ['triazolam', 3, 2.83],     // oral CL 413 → 146 mL/min
    ['sildenafil', 3, 2.8],     // "AUC and Cmax of sildenafil (2.8-fold and 2.6-fold"
    ['alfentanil', 3, 1.34],    // CL 3.9 → 2.9 mL/kg/min
  ],
};

/** Edges that really are measured affinities. */
const IN_VITRO: Record<string, string[]> = {
  ajmalicine: ['dextromethorphan', 'metoprolol', 'atomoxetine', 'desipramine', 'nortriptyline', 'risperidone', 'aripiprazole', 'nebivolol'],
  ketoconazole: ['alprazolam'],
};

const PROSE: Record<string, string> = {
  amiodarone: 'INTERACTIONS: FIVE OF THE SIX AFFINITIES ARE THE CITED EXPOSURE CHANGE INVERTED THROUGH ONE ASSUMED CONCENTRATION OF 2 µM, and two of the notes already stated it. The five span an exposure rise, a doubled plasma level, a dose reduction converted as a reciprocal, and a verbatim AUC pair — all landing on the same constant. THE DIGOXIN EDGE IS LEFT ALONE AND LOGGED: it does not reconstruct from its cited 33 to 43 percent bioavailability rise, and it is the one edge in the block that is NOT enzyme inhibition at all but P-glycoprotein transport, where the solver competitive-inhibition form is a borrowed shape rather than the mechanism.',
  ciprofloxacin: 'INTERACTIONS: THE TIDIEST BLOCK FOUND SO FAR — all five affinities reconstruct from one assumed concentration of 7.5 µM, DESPITE BEING DERIVED FROM THREE DIFFERENT KINDS OF REPORTED QUANTITY: an exposure rise, two separate clearance falls correctly inverted as reciprocals, and a doubled concentration from a pair of case reports. That internal consistency is what distinguishes a coherent single-inhibitor model from a set of independent guesses, and it is also why the block can be relabelled rather than rebuilt. ONE CAVEAT CARRIED FROM ITS OWN NOTE: the clozapine edge rests on TWO CASE REPORTS rather than a controlled crossover, and case reports do not support a quantitative constant however cleanly the algebra fits.',
  clarithromycin: 'INTERACTIONS: FOUR OF THE FIVE AFFINITIES INVERT THROUGH ONE ASSUMED CONCENTRATION OF 3 µM, and one note prints the arithmetic. THE ATORVASTATIN EDGE DOES NOT RECONSTRUCT and is left alone: its stored value implies a 3.5-fold rise against a cited lactone ratio of about 2.62, so it asserts a stronger interaction than its own source. Note the block shares its assumed concentration with erythromycin, which is a defensible modelling choice for two macrolides of similar exposure but is a CHOICE and not a measurement.',
  erythromycin: 'INTERACTIONS: FOUR OF THE FIVE INVERT THROUGH THE SAME 3 µM USED FOR CLARITHROMYCIN, and two of the notes state it. ONE RECONSTRUCTION IS WORTH RECORDING BECAUSE IT IDENTIFIES THE ARM: the simvastatin edge does not fit the 6.2-fold parent-drug ratio its note leads with, but fits the 3.9-fold SIMVASTATIN ACID ratio in the same sentence — so the author was calibrating to the active acid, which is the right species, and the note simply leads with the other number. THE MIDAZOLAM EDGE IS LEFT ALONE: it implies a 2.8-fold rise while its note offers only "more than fourfold" and a 54 percent clearance fall, neither of which produces the stored value.',
  ajmalicine: 'INTERACTIONS: ACQUITTED — THIS IS EXACTLY WHAT THE FIELD WAS DESIGNED FOR. All eight edges carry the same value because they cite the same measurement, "a potent in-vitro CYP2D6 inhibitor (Ki 3.3 nM)", and a Ki belongs to an ENZYME rather than to a victim, so one CYP2D6 constant legitimately applies to every CYP2D6 substrate. The repetition that made an automated screen flag this block is correct pharmacology, not a template. The basis is now declared explicitly so the next screen does not have to rediscover it. THE RECORD OWN CAVEAT STANDS AND IS THE RIGHT ONE: this is in-vitro potency, and whether ajmalicine ever reaches an inhibitory concentration in humans is a separate question the edges do not answer.',
  ketoconazole: 'INTERACTIONS: A MIXTURE, AND ONLY ONE EDGE IS A CLEAN MEASUREMENT. The alprazolam entry is verbatim — "Ketoconazole was a potent inhibitor of ALP metabolism in vitro (Ki = 0.046 microM)" — and is declared as such. THE OTHER FIVE ARE NOT, AND ARE LEFT ALONE RATHER THAN RELABELLED ON A GUESS. Two take 0.015 from a verbatim RANGE of 0.011 to 0.045 µM, AND THE NIFEDIPINE NOTE CALLS THAT VALUE "(midpoint)" WHEN THE MIDPOINT OF THAT RANGE IS 0.028 — a range interior describing itself as something it is not. One takes 0.015 from "IC(50) values less than 0.02 microM", which is an INEQUALITY, and an inhibitory concentration is not an affinity. The remaining two derive from clinical exposure changes with no single assumed concentration reconstructing both.',
};

for (const [perp, edges] of Object.entries(CALIBRATED)) {
  const c = need(perp);
  let n = 0;
  for (const [victim, I, R] of edges) {
    const e = (c.interactions ?? []).find((x) => x.slug === victim);
    if (!e?.kinetics) throw new Error(`${perp} → ${victim} missing`);
    if (e.kinetics.ki_basis) continue;
    const exact = Number((I / (R - 1)).toPrecision(6));
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
  if (n) { note(c, PROSE[perp]!); log.push(`${perp} — ${n} edge(s) calibrated_from_auc`); }
  else log.push(`${perp} — already relabelled, skipped`);
}

for (const [perp, victims] of Object.entries(IN_VITRO)) {
  const c = need(perp);
  let n = 0;
  for (const victim of victims) {
    const e = (c.interactions ?? []).find((x) => x.slug === victim);
    if (!e?.kinetics) throw new Error(`${perp} → ${victim} missing`);
    if (e.kinetics.ki_basis) continue;
    e.kinetics.ki_basis = 'in_vitro';
    n++;
  }
  if (n) { note(c, PROSE[perp]!); log.push(`${perp} — ${n} edge(s) declared in_vitro (a real measured Ki)`); }
  else log.push(`${perp} — already declared, skipped`);
}

const left = data.reduce((s, c) => s + (c.interactions ?? []).filter((e) => e.kinetics?.ki_uM != null && !e.kinetics.ki_basis).length, 0);
console.log(`\nki calibration basis, batch 3 — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
console.log(`\n  ${left} ki_uM edges still carry no declared basis`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
