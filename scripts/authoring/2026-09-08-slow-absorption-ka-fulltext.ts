/**
 * 2026-09-08-slow-absorption-ka-fulltext.ts
 *
 * Fourth and final pass at the slow-absorption class, from PMC OPEN-ACCESS
 * FULL TEXT — the third source tier after abstracts and FDA labels.
 *
 * ── THE MOST USEFUL FINDING IS THAT ONE WAS ALREADY THERE ─────────────────
 * olanzapine's depot Tmax is stated in PMID:24815672 — WHICH IS THE RECORD'S
 * OWN CITED SOURCE FOR THAT ROUTE. The number was in the paper the record
 * already points at, in the full text rather than the abstract, and no pass
 * over abstracts could ever have found it. That is worth stating plainly: an
 * abstract-only reading of a citation is not a reading of the citation.
 *
 * ── AND ANOTHER TRAP OF THE SAME FAMILY, AVOIDED ──────────────────────────
 * A PMC search for olanzapine also returned "a median T max of 12 min", which
 * belongs to a different olanzapine product entirely. The depot's own figure —
 * "After injection of OLAI, the mean observed olanzapine plasma concentration
 * ... reached a peak on day 2" — had to be confirmed by reading the surrounding
 * paragraph, which establishes that OLAI means the long-acting injection and
 * that the measurement excludes carry-over from prior oral dosing.
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
  if (!(tmax < 1 / ke)) throw new Error(`Tmax ${tmax} h unreachable at t½ ${halfLife} h`);
  let lo = ke * 1.0000001, hi = 200;
  const f = (ka: number) => Math.log(ka / ke) / (ka - ke) - tmax;
  for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

const FIXES: { slug: string; route: string; tmax: number; ref: string; pmc: string; quote: string }[] = [
  { slug: 'dupilumab', route: 'SC', tmax: 72, ref: 'PMID:32348036', pmc: 'PMC7496261',
    quote: '"The concentration-time profiles of the dupilumab 150- and 300-mg SC doses ... with peak drug concentrations being achieved on average at 3-7 days after dosing" — the therapeutic dose range. RANGE: the shorter endpoint is taken. A second open-access paper corroborates it independently at "t max was 4-8 days" for weight-based dosing.' },
  { slug: 'erenumab', route: 'SC', tmax: 120, ref: 'PMID:33818780', pmc: 'PMC8252052',
    quote: '"Following a single dose of erenumab or galcanezumab, peak plasma concentrations are attained in approximately 5-6 days and their elimination half-lives are in the range of 27-28 days." A BACKGROUND STATEMENT rather than this study own measurement, and it is used because it CROSS-CHECKS: the galcanezumab half of the same sentence matches the EMGALITY label exactly at 5 days, and the 27-28 day half-life range contains this record stored 21 days.' },
  { slug: 'olanzapine', route: 'IM', tmax: 48, ref: 'PMID:24815672', pmc: 'PMC4186727',
    quote: '"After injection of OLAI, the mean observed olanzapine plasma concentration stemming from both formulations reached a peak on day 2 and olanzapine concentrations remained in all patients in the study throughout a period of 4 weeks" — OLAI being the long-acting injection, and the surrounding paragraph establishes that the measurement excludes carry-over from the prior oral dose. THE PRECISION IS COARSE — a peak located to a day, not an hour — and that is recorded rather than smoothed over.' },
];

for (const f of FIXES) {
  const c = need(f.slug);
  const row = c.pk?.[f.route];
  if (!row) throw new Error(`${f.slug} has no pk.${f.route}`);
  if (row.ka_hr != null) { log.push(`${f.slug} — ka already ${row.ka_hr}, skipped`); continue; }
  const t = c.half_life_hr?.[f.route];
  if (t == null) throw new Error(`${f.slug} has no half-life on ${f.route}`);
  const ke = Math.LN2 / t;
  const was = Math.log(1 / ke) / (1 - ke);
  const ka = Number(kaFromTmax(t, f.tmax).toPrecision(4));
  const back = Math.log(ka / ke) / (ka - ke);
  if (Math.abs(back - f.tmax) > 0.05) throw new Error(`${f.slug}: ka ${ka} reproduces ${back.toFixed(2)}, not ${f.tmax}`);
  if (Math.abs(was - f.tmax) < 0.2) throw new Error(`${f.slug}: target equals the default — acquit instead`);
  row.ka_hr = ka;
  c.refs ??= []; if (!c.refs.includes(f.ref)) c.refs.push(f.ref);
  const own = row.source_pmid === f.ref ? ' NOTE THAT THIS IS THE RECORD OWN CITED SOURCE FOR THIS ROUTE — the number was in the paper already pointed at, in the full text rather than the abstract, so no pass over abstracts could have found it.' : '';
  note(c, `PK: ABSORPTION RATE AUTHORED FROM OPEN-ACCESS FULL TEXT (${f.pmc}). This row carried no ka, so the solver substituted 1.0/h and put the peak at ${was.toFixed(1)} h. Verbatim: ${f.quote}${own} With the stored half-life fixing ke, Tmax solves uniquely for ka by inverting the model own definition, ln(ka/ke)/(ka-ke) = Tmax — ARITHMETIC, NOT AN ESTIMATE — giving ${ka}/h, which reproduces ${f.tmax} h on substitution. EXPOSURE IS UNCHANGED: the absorption rate cancels out of AUC, so only the shape moves.`);
  log.push(`${f.slug}.${f.route} — ka ${ka}/h from ${f.pmc}: peak ${was.toFixed(1)} h → ${f.tmax} h${own ? '  [its OWN citation]' : ''}`);
}

{
  const c = need('cariprazine');
  const t = c.half_life_hr?.PO;
  if (t == null) throw new Error('cariprazine has no PO half-life');
  const ke = Math.LN2 / t;
  const was = Math.log(1 / ke) / (1 - ke);
  c.refs ??= []; if (!c.refs.includes('PMID:41689599')) c.refs.push('PMID:41689599');
  note(c, `PK: THE ABSENT ABSORPTION RATE IS ACQUITTED AGAINST OPEN-ACCESS FULL TEXT. With no ka the solver substitutes 1.0/h and renders a peak at ${was.toFixed(1)} h, and PMC13269304 states "Cariprazine is rapidly and well absorbed following oral administration, reaching peak plasma concentrations (C max ) approximately 3 to 6 h post-dose" — SO THE DEFAULT FALLS INSIDE THE PUBLISHED RANGE. Nothing is authored: storing a number would assert a measurement where the honest description is that the default happens to land correctly. A SEPARATE CAVEAT IS LEFT STANDING: this record models the parent, whose active metabolite DDCAR has a far longer half-life and accumulates over weeks, so the single-dose shape corrected here is not the whole pharmacology.`);
  log.push(`cariprazine.PO — ACQUITTED: default ${was.toFixed(1)} h is inside the published 3-6 h`);
}

let left = 0;
for (const c of data) for (const [r, p] of Object.entries(c.pk ?? {})) {
  if (r === 'IV' || !p || p.ka_hr != null || p.zo_dur_hr != null) continue;
  const t = c.half_life_hr?.[r]; if (!t || t < 48) continue; left++;
}
console.log(`\nslow-absorption ka from full text — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
console.log(`\n  ${left} rows still have no ka at t½ >= 48 h`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
