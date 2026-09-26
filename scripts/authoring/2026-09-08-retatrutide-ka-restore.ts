/**
 * 2026-09-08-retatrutide-ka-restore.ts
 *
 * A REGRESSION REPORTED FROM THE APP: retatrutide's curve peaks at ~5 h where
 * it used to peak at ~4 days.
 *
 * ── CAUSE ─────────────────────────────────────────────────────────────────
 * Commit 0f5fc98 (the peptide-category audit, 2026-09-06) removed `ka_hr: 0.02`
 * on the grounds — correct as far as it goes — that the value appears in no
 * abstract. But removing an absorption rate does not leave the record without
 * one: `resolvePk` substitutes 1.0/h. FOR A ONCE-WEEKLY SUBCUTANEOUS DEPOT
 * THAT IS FIFTY TIMES TOO FAST, and it moved the modelled peak from 93.8 h to
 * 5.4 h. The exposure is unaffected (AUC = F·D/(V·ke) has no ka in it); what
 * broke is the shape, which for a depot product is the part that matters.
 *
 * THE RECORD'S OWN NOTE CONTAINS THE MISCONCEPTION, and it is worth naming
 * because it is subtle: it calls 0.02 "a registry-wide default". It was a
 * value REPEATED ACROSS RECORDS, which is not the same thing as the value the
 * SOLVER substitutes — and here the two differ by 50x in opposite directions.
 * Deleting a shared template value hands you the solver default, which for
 * this class of drug is much further from the truth than the template was.
 *
 * ── WHAT IS RESTORED, AND WHAT IS NOT ─────────────────────────────────────
 * The absorption rate only. `V_L: 7` is NOT restored: a later commit (791c095)
 * established that the 7 L figure was plasma volume shared by 13 unrelated
 * records and wrong for this class, and the reported symptom is the peak TIME,
 * which volume does not affect. The missing volume stays visible under
 * pk.defaulted-volume.
 *
 * ── AND IT IS STILL NOT A SOURCED NUMBER ──────────────────────────────────
 * No indexed abstract states a retatrutide Tmax — I checked its three cited
 * papers and the LY3437943 pharmacokinetics search. So this is a choice
 * between two UNSOURCED numbers, which is the honest way to describe it: there
 * is no null option, because the solver uses 1.0 whether or not anyone decided
 * that. 0.02 is restored because it is the one whose implied peak (3.9 days)
 * is in the right regime for a weekly acylated depot, and 1.0/h (5.4 h) is
 * not. Declared as an estimate rather than presented as a measurement.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; pk?: Record<string, Record<string, unknown> | undefined>; half_life_hr?: Record<string, number>; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const log: string[] = [];
const c = data.find((x) => x.slug === 'retatrutide');
if (!c?.pk?.SC) throw new Error('retatrutide.pk.SC missing');

if (c.pk.SC.ka_hr == null) {
  c.pk.SC.ka_hr = 0.02;
  const t = 'PK: ABSORPTION RATE RESTORED AFTER A REPORTED REGRESSION — the curve was peaking at 5.4 hours where a once-weekly subcutaneous depot should peak in days. THE EARLIER REMOVAL WAS THE RIGHT DIAGNOSIS AND THE WRONG REMEDY: 0.02/h appears in no abstract, which is true, but deleting an absorption rate does not leave the record without one — the solver substitutes 1.0/h, FIFTY TIMES FASTER, and the modelled peak moved from 93.8 h to 5.4 h. Exposure never changed, because the absorption rate cancels out of it; what broke is the shape, which for a depot product is the whole point of the formulation. THE NOTE THAT REMOVED IT CONTAINS THE MISCONCEPTION AND IT IS WORTH NAMING: it called 0.02 "a registry-wide default". It was a value REPEATED ACROSS PEPTIDE RECORDS, which is not the same thing as the value the SOLVER falls back to, and the two differ by fifty-fold in opposite directions. THIS IS STILL NOT A SOURCED NUMBER. No indexed abstract states a retatrutide peak time — its three cited papers and a targeted search give none — so this is a choice between two unsourced values with no null option available, and 0.02 is restored because the peak it implies, about 3.9 days, is in the right regime for a weekly acylated depot while 1.0/h is not. Declared an estimate, not a measurement. THE VOLUME IS DELIBERATELY NOT RESTORED: the 7 L that went with it was plasma volume shared by thirteen unrelated records and was cleared for good reason, and volume does not affect the peak time this fix is about.';
  if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t;
  const ke = Math.LN2 / (c.half_life_hr!.SC!);
  const tmax = (ka: number) => Math.log(ka / ke) / (ka - ke);
  log.push(`retatrutide — ka_hr restored to 0.02 (declared estimate): Tmax ${tmax(1).toFixed(1)} h → ${tmax(0.02).toFixed(1)} h (${(tmax(0.02) / 24).toFixed(1)} d)`);
} else {
  log.push(`retatrutide — ka already ${c.pk.SC.ka_hr}, skipped`);
}

console.log(`\nretatrutide ka restore — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
