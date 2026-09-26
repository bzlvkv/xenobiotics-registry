/**
 * 2026-09-08-slow-absorption-ka-2.ts
 *
 * Second pass at the slow-absorption class. 31 rows still had no `ka` and a
 * half-life of 48 h or more, every one rendering its peak at the solver's
 * 1.0/h default.
 *
 * ── THE SEARCH LARGELY FAILED, AND THAT IS THE RESULT ─────────────────────
 * Twenty-seven targeted searches across three groups — the remaining
 * monoclonals, the depot injectables, and the oral tail — plus the 98
 * abstracts these records already cite. TWO USABLE PEAK TIMES CAME BACK.
 * The rest either report Tmax as a named parameter without a value, or report
 * it qualitatively ("higher and earlier peaks with the phenylpropionate
 * ester"), or have no abstract-level pharmacokinetics at all. For monoclonals
 * Tmax is overwhelmingly a label and full-text figure, not an abstract one.
 *
 * NOTHING IS INVENTED TO CLOSE THE REST. Restoring a plausible absorption rate
 * across the class is precisely the move that produced the retatrutide
 * regression this whole line of work started from.
 *
 * ── ONE FALSE LEAD WORTH RECORDING ────────────────────────────────────────
 * A search for tirzepatide returned a phase 1 reporting "The time to maximum
 * observed drug concentrations varied across cohorts (8-96 h)" beside a 12-day
 * half-life and once-weekly dosing — a near-perfect fit. IT IS LY3537021, A
 * DIFFERENT LILLY COMPOUND. Rejected on reading the title rather than the
 * numbers, which is the only thing that catches that class of error.
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
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

function kaFromTmax(halfLife: number, tmax: number): number {
  const ke = Math.LN2 / halfLife;
  if (!(tmax < 1 / ke)) throw new Error(`Tmax ${tmax} h unreachable at t½ ${halfLife} h (ceiling ${(1 / ke).toFixed(1)} h)`);
  let lo = ke * 1.0000001, hi = 50;
  const f = (ka: number) => Math.log(ka / ke) / (ka - ke) - tmax;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

const FIXES: { slug: string; route: string; tmax: number; ref: string; quote: string }[] = [
  { slug: 'risankizumab', route: 'SC', tmax: 72, ref: 'PMID:31758502',
    quote: '"Following subcutaneous administration, peak plasma concentration was reached approximately 3-14 days after dosing, with an estimated bioavailability of 89%." RANGE, and an unusually wide one: the shorter endpoint is taken, which moves the curve partway toward the truth and cannot overshoot. THE SAME SENTENCE CORROBORATES THIS RECORD STORED BIOAVAILABILITY OF 0.89 INDEPENDENTLY, and its "approximately 28 days" matches the stored half-life.' },
  { slug: 'ixekizumab', route: 'SC', tmax: 48, ref: 'PMID:37356077',
    quote: '"The median time to maximum observed ixekizumab concentrations occurred 2-4 days after dosing and the geometric mean half-life was 15-16 days". RANGE of medians: shorter endpoint taken. NOTE A TENSION LEFT ALONE: that half-life of 15-16 days is longer than this record stored 13 days, but the absorption rate here is derived against the STORED rate constant, which is what the solver actually uses, so the two remain internally consistent.' },
];

for (const f of FIXES) {
  const c = need(f.slug);
  const row = c.pk?.[f.route];
  if (!row) throw new Error(`${f.slug} has no pk.${f.route}`);
  if (row.ka_hr != null) { log.push(`${f.slug} — ka already ${row.ka_hr}, skipped`); continue; }
  const t = c.half_life_hr?.[f.route];
  if (t == null) throw new Error(`${f.slug} has no half-life on ${f.route}`);
  const ka = Number(kaFromTmax(t, f.tmax).toPrecision(4));
  const back = Math.log(ka / (Math.LN2 / t)) / (ka - Math.LN2 / t);
  if (Math.abs(back - f.tmax) > 0.1) throw new Error(`${f.slug}: ka ${ka} reproduces ${back.toFixed(2)} h, not ${f.tmax}`);
  const was = Math.log(1 / (Math.LN2 / t)) / (1 - Math.LN2 / t);
  row.ka_hr = ka;
  c.refs ??= []; if (!c.refs.includes(f.ref)) c.refs.push(f.ref);
  note(c, `PK: ABSORPTION RATE AUTHORED FROM A VERBATIM PEAK TIME. This row carried no ka, so the solver substituted 1.0/h and put the modelled peak at ${was.toFixed(1)} h — for a subcutaneous antibody that is wrong by design rather than by a margin. Source: ${f.quote} With the stored half-life fixing ke, Tmax solves uniquely for ka by inverting the model own definition, ln(ka/ke)/(ka-ke) = Tmax — ARITHMETIC, NOT AN ESTIMATE — giving ${ka}/h, which reproduces ${f.tmax} h on substitution. EXPOSURE IS UNCHANGED: the absorption rate cancels out of AUC entirely, so only the shape moves.`);
  log.push(`${f.slug}.${f.route} — ka ${ka}/h from a verbatim Tmax ${f.tmax} h: peak ${was.toFixed(1)} h → ${f.tmax} h`);
}

const L = Math.LN2;
let left = 0;
for (const c of data) for (const [r, p] of Object.entries(c.pk ?? {})) {
  if (r === 'IV' || !p || p.ka_hr != null || p.zo_dur_hr != null) continue;
  const t = c.half_life_hr?.[r]; if (!t || t < 48) continue; left++;
}
void L;
console.log(`\nslow-absorption ka, pass 2 — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
console.log(`\n  ${left} rows still have no ka at t½ >= 48 h`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
