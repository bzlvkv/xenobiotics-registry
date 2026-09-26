/**
 * 2026-09-08-slow-absorption-ka.ts
 *
 * The class behind the reported retatrutide regression: 40 extravascular rows
 * with no `ka_hr` and a half-life of 48 h or more, every one of them rendering
 * its peak at the solver's 1.0/h default.
 *
 * ── WHY THE WHOLE CLASS LOOKS IDENTICAL ───────────────────────────────────
 * With ka fixed at 1.0, Tmax = ln(1/ke)/(1-ke) grows only LOGARITHMICALLY as
 * ke falls. So a 31-day antibody and a 2-day small molecule both peak within a
 * couple of hours of each other — the 40 rows collapse into a 4.3-7.0 h band
 * regardless of half-life. Every subcutaneous monoclonal in the catalog was
 * peaking before lunch.
 *
 * ── ka IS DERIVED FROM A VERBATIM Tmax, WHICH IS SOUND ARITHMETIC ─────────
 * For the one-compartment model, Tmax solves ln(ka/ke)/(ka-ke) = Tmax
 * uniquely for ka > ke, with ke fixed by the stored half-life. That is an
 * inversion of the model's own definition, not an estimate — and each result
 * is verified by substituting it back (all reproduce their target Tmax to 0.1 h).
 *
 * WHERE THE SOURCE GIVES A RANGE, THE ENDPOINT THAT UNDER-CORRECTS IS TAKEN,
 * with both endpoints in the note — the convention the fraction_unbound batch
 * established. Since every record here is currently far too FAST, that means
 * the SHORTER Tmax: it moves each curve part of the way to the truth and
 * cannot overshoot. perampanel is the one case where the current default is
 * too SLOW, so the rule flips and its LONGER endpoint is taken.
 *
 * ── TWO TRAPS CAUGHT WHILE READING ────────────────────────────────────────
 * SEMAGLUTIDE: its source reports two drugs in one passage — "Cagrilintide
 * 0.16-4.5 mg had a half-life of 159-195 h, with a median tmax of 24-72 h.
 * Semaglutide 2.4 mg had a half-life of 145-165 h, with a median tmax of
 * 12-24 h." The 24-72 h belongs to CAGRILINTIDE. Taking the first number in
 * the sentence would have been the shared-sentence transplant this audit keeps
 * finding.
 *
 * SECUKINUMAB: its abstract states BOTH a population absorption rate ("an
 * absorption rate of 0.18/day") and an observed peak time ("approximately 6
 * days after dosing"). THEY DISAGREE 2.1x — 0.18/day implies a 12.6-day peak.
 * The verbatim ka comes from a two-compartment population fit, and lifting one
 * parameter of a multi-compartment model into a one-compartment slot is the
 * error already documented on propofol's keo. The OBSERVABLE is used and the
 * conflict recorded.
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

/** Invert Tmax = ln(ka/ke)/(ka−ke) for ka, given ke. Unique for ka > ke. */
function kaFromTmax(halfLife: number, tmax: number): number {
  const ke = Math.LN2 / halfLife;
  if (!(tmax < 1 / ke)) throw new Error(`Tmax ${tmax} h is unreachable at t½ ${halfLife} h (ceiling ${(1 / ke).toFixed(1)} h)`);
  let lo = ke * 1.0000001, hi = 50;
  const f = (ka: number) => Math.log(ka / ke) / (ka - ke) - tmax;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

const FIXES: { slug: string; route: string; tmax: number; ref: string; quote: string; extra?: string }[] = [
  { slug: 'denosumab', route: 'SC', tmax: 192, ref: 'PMID:26447647',
    quote: '"median time to Cmax (tmax ) was 8 days (serum)" — a single 60 mg subcutaneous dose in healthy men. A stated MEDIAN, not a range interior.' },
  { slug: 'evolocumab', route: 'SC', tmax: 96, ref: 'PMID:32729822',
    quote: '"Cmax (tmax) was 4.0 days" — a stated point value after a single subcutaneous dose.' },
  { slug: 'ustekinumab', route: 'SC', tmax: 96, ref: 'PMID:23512638',
    quote: '"corresponding to the Cmax (tmax) was 4.0-8.5 days" across Chinese and non-Chinese subjects. RANGE: the shorter endpoint is taken, which moves the curve partway to the truth and cannot overshoot.' },
  { slug: 'etanercept', route: 'SC', tmax: 48, ref: 'PMID:15831771',
    quote: '"Etanercept is absorbed slowly from the site of subcutaneous injection, with time to peak concentration at approximately 48 to 60 hours". RANGE: shorter endpoint taken.' },
  { slug: 'dulaglutide', route: 'SC', tmax: 48, ref: 'PMID:34787823',
    quote: '"median time to Cmax (tmax) of approximately 48 h", single dose in healthy subjects.' },
  { slug: 'semaglutide', route: 'SC', tmax: 12, ref: 'PMID:33894838',
    quote: '"Semaglutide 2.4 mg had a half-life of 145-165 h, with a median tmax of 12-24 h". RANGE: shorter endpoint taken. THE SAME PASSAGE REPORTS CAGRILINTIDE at "a median tmax of 24-72 h" — that figure belongs to the other drug and taking it would be a shared-sentence transplant.' },
  { slug: 'fremanezumab', route: 'SC', tmax: 120, ref: 'PMID:29667896',
    quote: '"Median Tmax (range 5-11 days) and mean half-lives (range 31-39 days) were similar across doses for both ethnicities". RANGE: shorter endpoint taken.' },
  { slug: 'secukinumab', route: 'SC', tmax: 144, ref: 'PMID:28273356',
    quote: '"The time to maximum serum concentration at steady state occurred approximately 6 days after dosing for both secukinumab 300 mg and secukinumab 150 mg". ITS OWN ABSTRACT ALSO STATES "an absorption rate of 0.18/day", WHICH DISAGREES 2.1-FOLD — that value implies a 12.6-day peak. It is one parameter of a two-compartment population fit, and lifting such a parameter into a one-compartment slot is the error documented on propofol\'s keo, so the OBSERVABLE is used.' },
  { slug: 'perampanel', route: 'PO', tmax: 1.0, ref: 'PMID:36746851',
    quote: '"concentration (tmax) was 0.75-1.0 h". THIS RECORD IS THE ONE WHOSE DEFAULT IS TOO SLOW rather than too fast — 5.1 h against a published sub-hour peak — so the under-correcting endpoint is the LONGER one, 1.0 h.' },
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
  if (Math.abs(back - f.tmax) > 0.1) throw new Error(`${f.slug}: ka ${ka} reproduces Tmax ${back.toFixed(2)}, not ${f.tmax}`);
  const wasTmax = Math.log(1 / (Math.LN2 / t)) / (1 - Math.LN2 / t);
  row.ka_hr = ka;
  c.refs ??= []; if (!c.refs.includes(f.ref)) c.refs.push(f.ref);
  note(c, `PK: ABSORPTION RATE AUTHORED FROM A VERBATIM PEAK TIME. This row carried no ka, so the solver substituted 1.0/h and the modelled peak landed at ${wasTmax.toFixed(1)} h — for a slowly-absorbed ${f.route === 'SC' ? 'subcutaneous' : f.route === 'IM' ? 'intramuscular' : 'oral'} product that is wrong by design, not by a little. Source: ${f.quote} With the stored half-life fixing ke, Tmax solves uniquely for ka by inverting the model own definition, ln(ka/ke)/(ka-ke) = Tmax — ARITHMETIC, NOT AN ESTIMATE — giving ${ka}/h, which reproduces ${f.tmax} h on substitution. EXPOSURE IS UNCHANGED: the absorption rate cancels out of AUC entirely, so only the shape moves.`);
  log.push(`${f.slug}.${f.route} — ka ${ka}/h from a verbatim Tmax ${f.tmax} h: peak ${wasTmax.toFixed(1)} h → ${f.tmax} h`);
}

// Acquitted: the default happens to be right.
{
  const c = need('brexpiprazole');
  note(c, 'PK: THE ABSENT ABSORPTION RATE IS ACQUITTED, WHICH IS WORTH RECORDING BECAUSE ITS NEIGHBOURS WERE NOT. This record has no ka, so the solver substitutes 1.0/h and renders a peak at 4.9 h — and its own citation states "tmax and the mean elimination half-life of brexpiprazole were 4-5 and 52-92" hours, so the DEFAULT FALLS INSIDE THE PUBLISHED RANGE. Nothing is authored: storing 1.0/h would assert a measurement where a coincidence is the honest description, and the value the solver already uses is correct.');
  log.push('brexpiprazole — ACQUITTED: its verbatim Tmax 4-5 h contains the default 4.9 h; nothing authored');
}

console.log(`\nslow-absorption ka — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
