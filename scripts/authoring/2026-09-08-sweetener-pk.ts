/**
 * 2026-09-08-sweetener-pk.ts
 *
 * The last three records in the whole catalog that carried PK and had never
 * been audited: saccharin, sucralose and mannitol. All three are sweeteners,
 * and all three share one shape.
 *
 * ── WHAT A "BIOAVAILABILITY" MEANS IN THIS LITERATURE ─────────────────────
 * None of these three papers measures bioavailability. They measure RECOVERY —
 * how much of a radiolabel or an unchanged compound turns up in urine — and
 * every record stored that recovery in the `F` field:
 *
 *   saccharin  "The fraction absorbed was about 0.85"  — fraction ABSORBED
 *   sucralose  "a mean of 14.5% ... excreted in urine" — urinary recovery of
 *              RADIOACTIVITY, which includes two glucuronide metabolites
 *
 * The catalog has no field for fractional absorption as distinct from
 * bioavailability — a schema gap logged during the mineral pass and now hit
 * again. For these two the substitution happens to be defensible (neither has
 * meaningful first-pass metabolism), which is exactly why it needs saying: it
 * is defensible HERE, not in general, and raloxifene in batch 11a is the same
 * sentence shape where storing it would have been a fifty-fold error.
 *
 * ── AND SUCRALOSE IS NOT MEASURING SUCRALOSE ──────────────────────────────
 * Its half-life is "the effective half-life for the decline of plasma
 * RADIOACTIVITY", i.e. total drug-related material, not the parent. The schema
 * has an enum member for exactly this and the record did not use it.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound {
  slug: string; pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>; pk_analyte?: string; pk_analyte_name?: string;
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

{
  const c = need('sucralose');
  if (c.pk_analyte == null) {
    c.pk_analyte = 'total-drug-related';
    c.pk_analyte_name = 'total ¹⁴C-sucralose-derived radioactivity';
    note(c, 'PK: THE RECORD IS NOT MEASURING SUCRALOSE, AND THE SCHEMA HAS AN ENUM MEMBER FOR EXACTLY THAT. Its citation states "the effective half-life for the decline of plasma RADIOACTIVITY was 13hr" — total drug-related material, not the parent — and the analyte field was unset, so every surface presented it as a sucralose half-life. Declared. THE BIOAVAILABILITY IS ALSO A RECOVERY RATHER THAN A MEASUREMENT: "a mean of 14.5% (range 8.9 to 21.8%) of the radioactivity was excreted in urine and 78.3% ... in the faeces". For this compound the substitution is defensible — the faecal fraction is unabsorbed parent, "essentially unchanged sucralose" in that abstract own words — but it is defensible HERE and not in general, and about a sixth of the urinary figure is glucuronide rather than sucralose, so the parent-referenced value would be nearer 0.12. The catalogue still has no field for fractional absorption as distinct from bioavailability, which is the same schema gap the mineral pass logged. NO VOLUME IS AUTHORED AND NONE IS PUBLISHED: the paper reports a mean residence time of 18.8 h and no volume or clearance, so the curve renders against the solver default and that gap is recorded rather than filled.');
    log.push('sucralose — pk_analyte: total-drug-related (its t½ is plasma RADIOACTIVITY, not sucralose)');
  } else { log.push('sucralose — already declared, skipped'); }
}

{
  const c = need('saccharin');
  if (c.pk_analyte == null) {
    c.pk_analyte = 'parent';
    note(c, 'PK: EVERY STORED NUMBER IS VERBATIM AND EACH ONE IS A DIFFERENT KIND OF QUANTITY THAN THE FIELD IT SITS IN. The half-life is "a two-compartment open model with a terminal half-life of 70 min" — a TERMINAL half-life from an INTRAVENOUS fit, stored on an oral route, which is the class-12 pairing and the class-8 route mismatch at once. The bioavailability is "The fraction absorbed was about 0.85", which is fractional ABSORPTION and not bioavailability; for saccharin the two coincide, because the same abstract says the compound is recovered quantitatively in urine with high renal clearance and no metabolism, so there is no first pass for them to differ across. THAT COINCIDENCE IS THE POINT: raloxifene carries the identical sentence shape, and storing its fraction absorbed as bioavailability would have been a fifty-fold error. NO VOLUME IS PUBLISHED — the abstract says only that "Renal clearance was high" — so the curve renders against the solver default, and this record note previously presented that as a choice ("ka and Vd are left to solver defaults") rather than as the gap it is. AND THE ABSTRACT WARNS AGAINST THE ORAL MODEL IN ITS OWN WORDS: "After oral administration (2 g) more complex and variable plasma concentration-time curves were obtained".');
    log.push('saccharin — IV terminal t½ on a PO route + fraction-absorbed-as-F, both recorded');
  } else { log.push('saccharin — already declared, skipped'); }
}

{
  const c = need('mannitol');
  if (c.pk?.IV?.V_L === 32.9) {
    c.pk.IV.V_L = 51.4;
    c.pk_analyte = 'parent';
    note(c, 'PK: THE NOTE CLAIMED A ONE-COMPARTMENT APPROXIMATION THAT DOES NOT CLOSE. All three numbers are verbatim from four human subjects — "the mean ... elimination half-life was 71.15 +/- 27.02 min", "The volume of distribution was 0.47 +/- 0.50 liters/kg and total body clearance was 7.15 +/- 10.23 ml X min-1 X kg-1" — but the stored volume paired with the stored half-life asserts a clearance of 19.2 L/h against that paper own 30.0, HALF AGAIN TOO SLOW, so the record was not the approximation it said it was. The volume becomes the verbatim clearance over the verbatim rate, and exposure now reproduces the paper. A CAVEAT LARGER THAN THE CORRECTION: this is four subjects and EVERY REPORTED STANDARD DEVIATION EXCEEDS ITS OWN MEAN, so the 1.56-fold gap sits comfortably inside the noise and the fix buys internal coherence rather than accuracy. THE ORAL ROUTE IS DELIBERATELY LEFT WITHOUT PARAMETERS: it is declared with a food-additive dose and no pharmacokinetics, so it yields no curve at all — and here that is CORRECT rather than broken, because oral mannitol is minimally absorbed and acts osmotically in the gut lumen, which is also why the laxative warning exists.');
    log.push('mannitol — V 32.9 → 51.4 (its own verbatim clearance); the "1-comp approximation" did not close');
  } else { log.push('mannitol — already corrected, skipped'); }
}

console.log(`\nsweetener PK — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
