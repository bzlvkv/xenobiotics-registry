/**
 * 2026-09-08-epinephrine-im-unrepresentable.ts
 *
 * epinephrine.IM is the record's DEFAULT route and the drug's commonest real
 * use — the anaphylaxis autoinjector — and it carries a dose with no PK, so
 * logging one renders nothing. This pass set out to author it and found that
 * IT CANNOT BE AUTHORED, for a reason the model itself proves.
 *
 * ── THE ARITHMETIC THAT SETTLES IT ────────────────────────────────────────
 * A one-compartment model's peak time is bounded: Tmax = ln(ka/ke)/(ka-ke) is
 * maximised as ka approaches ke, giving a CEILING of 1/ke. This record's
 * intravenous half-life is 3.5 minutes verbatim, so its ceiling is 5.0 minutes.
 * The published intramuscular peak is 5-10 minutes — AT the ceiling at best and
 * beyond it at worst. No ka reproduces it.
 *
 * That is not a missing number; it is FLIP-FLOP KINETICS. Intramuscular
 * absorption is slower than elimination, so the intramuscular route's apparent
 * terminal slope reflects ABSORPTION rather than elimination and cannot inherit
 * the intravenous half-life. Authoring it needs an intramuscular-specific
 * apparent half-life, and no indexed abstract states one.
 *
 * ── AND THE PROFILE IS BIPHASIC ANYWAY ────────────────────────────────────
 * Verbatim from a systematic review of the intramuscular literature: "Most
 * investigators found two Cmax's with Tmax 5-10 min and 30-50 min,
 * respectively." A single first-order absorption rate produces exactly one
 * peak. Even with a correct half-life this route would be structurally
 * misrepresented, which is worth saying before someone fits a ka to the first
 * peak and calls the record done.
 *
 * NOTHING IS AUTHORED. The lint warning stands, and now names the reason.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; pk?: Record<string, Record<string, unknown> | undefined>; half_life_hr?: Record<string, number>; refs?: string[]; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const log: string[] = [];
const c = data.find((x) => x.slug === 'epinephrine');
if (!c) throw new Error('epinephrine missing');

const t = c.half_life_hr?.IV;
if (t == null) throw new Error('epinephrine has no IV half-life');
const ceilingMin = (t / Math.LN2) * 60;
if (!(ceilingMin < 10)) throw new Error(`the ceiling is ${ceilingMin.toFixed(1)} min — the argument below no longer holds, re-check before keeping this note`);

const NOTE = `PK: THE INTRAMUSCULAR ROUTE IS THIS RECORD DEFAULT AND ITS COMMONEST REAL USE — the anaphylaxis autoinjector — AND IT CANNOT BE MODELLED HERE. That is a finding, not an omission, and the model proves it. A one-compartment peak time is bounded, because Tmax = ln(ka/ke)/(ka-ke) rises as ka approaches ke and cannot exceed 1/ke; at this record verbatim intravenous half-life of 3.5 minutes that CEILING IS ${ceilingMin.toFixed(1)} MINUTES. The published intramuscular peak is "Tmax 5-10 min" — at the ceiling at best and past it at worst — SO NO ABSORPTION RATE REPRODUCES IT. The reason is flip-flop kinetics: intramuscular absorption is slower than elimination, so this route apparent terminal slope reflects ABSORPTION rather than elimination and cannot inherit the intravenous half-life. Authoring it needs an intramuscular-specific apparent half-life and no indexed abstract states one. AND THE PROFILE IS BIPHASIC REGARDLESS: a systematic review of the intramuscular literature reports verbatim that "Most investigators found two Cmax's with Tmax 5-10 min and 30-50 min, respectively", while a single first-order rate produces exactly one peak — so even with a correct half-life this route would be structurally misrepresented. Recorded before someone fits a rate to the first peak and calls the record finished.`;

if (!(c.notes ?? '').includes(NOTE.slice(0, 60))) {
  c.notes = c.notes ? `${c.notes} ${NOTE}` : NOTE;
  c.refs ??= [];
  for (const r of ['PMID:33685510', 'PMID:37604314']) if (!c.refs.includes(r)) c.refs.push(r);
  log.push(`epinephrine — IM route documented as unrepresentable (Tmax ceiling ${ceilingMin.toFixed(1)} min vs a published 5-10 min peak); nothing authored`);
} else {
  log.push('epinephrine — already documented, skipped');
}

console.log(`\nepinephrine IM — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
