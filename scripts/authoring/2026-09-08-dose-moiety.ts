/**
 * 2026-09-08-dose-moiety.ts
 *
 * First users of `Compound.dose_moiety_fraction`.
 *
 * `doses[]` holds what a person takes, which is routinely a SALT, while `pk[]`
 * describes the free base or the ion. The solver divides dose by volume, so
 * without a correction it divides a salt mass by a free-base volume and
 * overstates every concentration by the counter-ion's share of the formula
 * mass. The catalog's stated convention — free-base `mw_g_mol` beside salt-form
 * doses — is harmless while the mass only converts micromolar affinities, and
 * NOT harmless once the dose feeds the plasma curve.
 *
 * ── THE ONE THAT FORCED IT, AND WHY IT WAS HELD BACK ──────────────────────
 * lithium. 900 mg of the carbonate is 169 mg of lithium, so the curve ran
 * 5.32x high and rendered a standard dose at 2.32 mmol/L against a therapeutic
 * band of 0.6-1.2 and toxicity near 1.5 — WRONG IN THE DIRECTION THAT MATTERS,
 * on a drug people titrate by serum level. Batch 11a quantified it and
 * deliberately did NOT patch it, because the record's second defect pulls the
 * other way: no bioavailability is stored, so the solver substitutes 0.9
 * against a volume that is itself apparent, and pinning it at 1 — which is
 * correct — makes the toxic reading ten percent WORSE. Both move here, in one
 * commit, which is the compensating-error lesson applied before the mistake
 * rather than after it.
 *
 * ── EVERY FRACTION IS STOICHIOMETRY, NOT A FITTED VALUE ───────────────────
 * Each is the analyte's share of the dosed salt's formula mass, from formulae
 * verified against PubChem. That is arithmetic, not a published measurement,
 * so the verbatim rule does not reach it — but the arithmetic is written into
 * `dose_moiety_note` on every record, and data-lint now fails a fraction that
 * arrives without one.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Dose { min: number; max: number; typical: number; unit: string }
interface Compound {
  slug: string; doses?: Record<string, Dose>; mw_g_mol?: number;
  pk?: Record<string, Record<string, unknown> | undefined>;
  dose_moiety_fraction?: number; dose_moiety_note?: string; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const MOIETY: { slug: string; fraction: number; moietyNote: string; prose: string; summary: string }[] = [
  { slug: 'lithium', fraction: 0.18787,
    moietyNote: 'Doses are lithium CARBONATE (Li₂CO₃, CLi2O3, 73.891 g/mol), the marketed form; pk[] and half_life_hr[] describe the lithium ION, which is what serum monitoring reports. Fraction = 2 × 6.941 / 73.891 = 0.18787. A 900 mg tablet therefore delivers 169.1 mg of lithium. Formula verified against PubChem.',
    prose: 'DOSE MOIETY: THE RECORD WAS RENDERING A THERAPEUTIC DOSE AS A TOXIC SERUM LEVEL, AND NOT ONE OF ITS NUMBERS WAS WRONG. Every stored value is verbatim; the defect was that the dose is nine hundred milligrams of lithium CARBONATE while the volume, the half-life and the concentration this drug is monitored by all describe the lithium ION, of which the salt is only 18.787 percent. The model asserted 2.32 mmol/L for a standard dose against a therapeutic band of 0.6 to 1.2 and a toxicity threshold near 1.5. WITH THE MOIETY DECLARED IT RENDERS ABOUT 0.49, which is the right order for a single dose. THE BIOAVAILABILITY MOVES IN THE SAME COMMIT AND DELIBERATELY SO: it was absent, so the solver substituted 0.9 against a volume that is itself an APPARENT one from an oral study, dividing by absorption twice — and pinning it at unity, which is the correct convention and is supported by a second study reporting that "the ordinary preparation was completely absorbed", makes the uncorrected reading ten percent WORSE. Fixing either alone would have been the atracurium mistake. The displayed dose is unchanged: a nine hundred milligram tablet is still logged and shown as nine hundred milligrams.',
    summary: 'lithium — moiety 0.18787 (Li₂CO₃ → Li⁺) + F pinned at 1; was 5.32x over, now ~0.49 mmol/L' },

  { slug: 'tenofovir-disoproxil', fraction: 0.45194,
    moietyNote: 'Doses are tenofovir disoproxil FUMARATE (C23H34N5O14P, 635.5 g/mol); pk_analyte is tenofovir (287.21). Fraction = 287.21 / 635.5 = 0.45194, so a 300 mg tablet delivers 135.6 mg of tenofovir moiety. The stored F 0.25 is the label\'s absolute bioavailability of tenofovir FROM the prodrug, defined molar-equivalently, so it composes with this rather than double-counting. Formula verified against PubChem.',
    prose: 'DOSE MOIETY: THE HALF OF THIS RECORD NINE-FOLD ERROR THAT BATCH 10 IDENTIFIED AND COULD NOT FIX. That pass decomposed the error into roughly 2.2-fold from a prodrug/analyte mass mismatch and roughly 4.2-fold from an intravenous steady-state volume paired with a terminal half-life, and warned that correcting either alone makes the diagnosis LOOK solved when it is not. The mass half is now fixed properly rather than by moving the bioavailability: the dose is milligrams of the FUMARATE salt of a prodrug, of which only 45 percent is tenofovir, while the stored bioavailability is already defined against the tenofovir moiety — so the two compose and neither double-counts. THE DOSE RANGE IS ALSO NORMALISED: its lower bound of 245 was the same tablet expressed as tenofovir DISOPROXIL rather than as its fumarate, so the block was mixing two salt bases in one range. The remaining volume defect is unchanged and still logged.',
    summary: 'tenofovir-disoproxil — moiety 0.45194 (TDF → tenofovir); closes the 2.2x half of its 9x error' },

  { slug: 'brompheniramine', fraction: 0.73338,
    moietyNote: 'Doses are brompheniramine MALEATE (C20H23BrN2O4, 435.3 g/mol), the marketed form; mw_g_mol and pk[] describe the free base (319.24). Fraction = 319.24 / 435.3 = 0.73338, so a 4 mg tablet delivers 2.93 mg of base. Formula verified against PubChem.',
    prose: 'DOSE MOIETY: THE 1.36-FOLD CASE FOUND ALONGSIDE LITHIUM. Batch 10 acquitted every stored value on this record and noted in passing that the molecular weight is the free base while the four milligram dose is the MALEATE — raised then only because it is systematic across the first-generation antihistamines. It is not cosmetic once the dose feeds the curve: the solver was dividing maleate mass by a free-base volume. Declared, and the sibling chlorpheniramine is corrected in the same pass.',
    summary: 'brompheniramine — moiety 0.73338 (maleate → base)' },

  { slug: 'chlorpheniramine', fraction: 0.70297,
    moietyNote: 'Doses are chlorpheniramine MALEATE (C20H23ClN2O4, 390.9 g/mol), the marketed form; mw_g_mol and pk[] describe the free base (274.79). Fraction = 274.79 / 390.9 = 0.70297, so a 4 mg tablet delivers 2.81 mg of base. Formula verified against PubChem.',
    prose: 'DOSE MOIETY: THE SIBLING OF THE BROMPHENIRAMINE CASE, AND THE SAME ARITHMETIC. Doses are the maleate; the molecular weight and the pharmacokinetics are the free base. Note this record stores a real measured bioavailability against a true intravenous-derived volume, so unlike its sibling nothing else on it moves.',
    summary: 'chlorpheniramine — moiety 0.70297 (maleate → base)' },
];

for (const m of MOIETY) {
  const c = need(m.slug);
  if (c.dose_moiety_fraction != null) { log.push(`${m.slug} — moiety already declared, skipped`); continue; }
  c.dose_moiety_fraction = m.fraction;
  c.dose_moiety_note = m.moietyNote;
  if (m.moietyNote.length > 600) throw new Error(`${m.slug} dose_moiety_note is ${m.moietyNote.length} chars`);
  note(c, m.prose);
  log.push(m.summary);
}

// lithium's second defect — must move in the same commit, not after it.
{
  const c = need('lithium');
  const row = c.pk?.PO;
  if (row && row.F == null) {
    row.F = 1;
    log.push('lithium — F pinned at 1 (V 0.62 L/kg is an apparent oral volume; the 0.9 default divided twice)');
  } else { log.push('lithium — F already pinned, skipped'); }
}

// tenofovir's dose range mixed the fumarate and the disoproxil expression of one tablet.
{
  const c = need('tenofovir-disoproxil');
  const d = c.doses?.PO;
  if (d && d.min === 245) { d.min = 300; log.push('tenofovir-disoproxil — dose min 245 → 300 (both were the same tablet, two salt bases)'); }
  else { log.push('tenofovir-disoproxil — dose range already normalised, skipped'); }
}

console.log(`\ndose moiety — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
