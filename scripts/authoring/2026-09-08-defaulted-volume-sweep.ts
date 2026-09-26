/**
 * 2026-09-08-defaulted-volume-sweep.ts
 *
 * 29 route rows across 24 records stored `V_L: 35` — WHICH IS THE SOLVER'S OWN
 * DEFAULT, 0.5 L/kg at the 70 kg reference — as though it were a measurement.
 * Every one of them carries a `source_pmid`.
 *
 * ── THIS IS THE BATCH-11 FINDING RUNNING THE OTHER WAY ────────────────────
 * Batch 11 found deletions that silently became defaults. This is a default
 * that was silently promoted to a datum: same seam, opposite direction, and it
 * is the more insidious of the two, because a stored number carries a citation
 * and reads on every surface as though someone measured it.
 *
 * I FETCHED ALL 22 CITATIONS. FOUR STATE A VOLUME AT ALL, and not one of the
 * four states 35 L:
 *   hydroxocobalamin  "The apparent volume of distribution is 0.45 +/- 0.03
 *                     L/kg"                                    -> 31.5 L
 *   NAC               "its volume of distribution (VSS) was 0.47 l.kg-1"
 *                     with "plasma clearance was 0.11 l.h-1.kg-1"
 *   pramiracetam      "the mean apparent volume of distribution (1.82-2.94
 *                     L/kg)"  -> 127-206 L: THE STORED VALUE IS 4-6x BELOW THE
 *                     BOTTOM OF ITS OWN CITED RANGE
 *   tocotrienols      "volume of distribution (Vd/f, mg/h) 0.34" — a volume in
 *                     mg/h, dimensionally impossible as printed
 *
 * ── WHY DELETING THE REST IS SAFE HERE AND WAS NOT IN BATCH 11 ────────────
 * Batch 11's rule is that deleting a value does not silence a record, it makes
 * it assert the default — and for a low-availability drug the default is worse
 * than the flawed number removed. THAT RULE DOES NOT APPLY WHEN THE STORED
 * VALUE *IS* THE DEFAULT. Removing a 35 here is numerically a no-op (resolvePk
 * substitutes 0.5 L/kg and scalePkForWeight then treats both identically), so
 * nothing moves on any curve. What changes is that the record stops claiming a
 * measurement it does not have, and `pk.defaulted-volume` starts counting it —
 * turning an invisible assertion into a visible gap.
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
  half_life_hr?: Record<string, number>; pk_unauthored?: { reason: string; note?: string }; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

// ── The four whose citation says something ────────────────────────────────
const SOURCED: { slug: string; routes: string[]; V: number; set?: Record<string, unknown>; note: string; summary: string }[] = [
  { slug: 'hydroxocobalamin', routes: ['IV', 'IM'], V: 31.5,
    note: 'PK: THE CITED ABSTRACT STATES THE VOLUME AND THE RECORD STORED THE SOLVER DEFAULT INSTEAD. Verbatim: "the elimination half-life 26.2 +/- 2.7 h. The apparent volume of distribution is 0.45 +/- 0.03 L/kg" — the half-life was taken and the volume beside it was not, leaving 0.5 L/kg standing in for a measured 0.45. Eleven percent, and free. A CAVEAT THE ABSTRACT RAISES ITSELF: the cohort is eleven smoke-inhalation victims with cyanide exposure, and it warns that this "elimination half-life in these cyanide-exposed patients far exceeds those found in previous studies of dogs and minimally-exposed humans" — so the record describes the antidotal setting, not routine supplementation.',
    summary: 'hydroxocobalamin V 35 → 31.5 (verbatim 0.45 L/kg; the half-life beside it was already taken)' },
  { slug: 'nac', routes: ['IV', 'PO'], V: 66.7, set: { PO: { F: 0.091 } },
    note: 'PK: THE VOLUME WAS THE SOLVER DEFAULT, THE BIOAVAILABILITY MATCHED NEITHER ARM, AND THE PAPER REPORTS TWO OF EVERYTHING. Its citation measures reduced and TOTAL N-acetylcysteine separately: "Reduced NAC had a volume of distribution (VSS) of 0.59 l.kg-1 and a plasma clearance of 0.84 l.h-1.kg-1 ... The oral bioavailability was 4.0%" against "its volume of distribution (VSS) was 0.47 l.kg-1 and its plasma clearance was 0.11 l.h-1.kg-1 ... Oral bioavailability of total NAC was 9.1%". The stored half-life of 6 h identifies the TOTAL arm ("5.58 h after intravenous administration and 6.25 h after oral"), so that is the arm the rest must come from — AND THE STORED BIOAVAILABILITY OF 0.07 IS NEITHER 4.0 NOR 9.1, sitting between them like a blend of two arms. It moves to the verbatim total-NAC figure. THE VOLUME IS DERIVED AND DECLARED: the verbatim steady-state volume paired with the terminal half-life asserts a clearance half the paper own, the usual Vss-against-terminal mismatch, so the stored value is that verbatim clearance over the stored rate and exposure now reproduces the paper.',
    summary: 'nac V 35 → 66.7 (verbatim CL 0.11 L/h/kg) + PO F 0.07 → 0.091 (verbatim total-NAC arm)' },
  { slug: 'pramiracetam', routes: ['PO'], V: 135,
    note: 'PK: THE STORED VOLUME IS FOUR TO SIX TIMES BELOW THE BOTTOM OF ITS OWN CITED RANGE. That abstract reports "the mean apparent volume of distribution (1.82-2.94 L/kg)", which at the seventy-kilogram reference is 127 to 206 litres, against a stored 35 — the solver default, not a measurement. EVERY PARAMETER IN THAT PAPER IS A RANGE and none is a point value, so nothing there is directly storable: the half-life is "4.5-6.5 hours" and the clearance "4.45-4.85 mL/min/kg". THE REPLACEMENT IS THEREFORE DERIVED AND SAYS SO — the clearance at the stored half-life — and its one virtue is a genuine cross-check: it lands INSIDE the independently stated volume range, which the stored value did not. A range interior would normally be refused; the alternative here was a number outside the range altogether.',
    summary: 'pramiracetam V 35 → 135 (derived; 35 was 4-6x below its own cited range)' },
];
for (const s of SOURCED) {
  const c = need(s.slug);
  if (c.pk?.[s.routes[0]!]?.V_L !== 35) { log.push(`${s.slug} — volume already corrected, skipped`); continue; }
  for (const r of s.routes) { const row = c.pk![r]; if (row) row.V_L = s.V; }
  for (const [r, patch] of Object.entries(s.set ?? {})) Object.assign(c.pk![r]!, patch);
  note(c, s.note);
  log.push(s.summary);
}

// ── tocotrienols: an isomer mixture whose abstract is dimensionally broken ──
{
  const c = need('tocotrienols');
  if (!c.pk_unauthored) {
    delete c.pk;
    c.half_life_hr = {};
    c.pk_unauthored = { reason: 'mixture', note: 'A mixture of α/β/γ/δ isomers whose only human study reports each isomer SEPARATELY, so no single curve describes the product. Its volume is printed as "volume of distribution (Vd/f, mg/h) 0.34" — a volume in mg/h, dimensionally impossible as written — and the half-life it does state for δ-tocotrienol (2.74, 2.68 h) is not the value that was stored.' };
    note(c, 'PK: STRIPPED. THE ONLY HUMAN STUDY REPORTS EACH ISOMER SEPARATELY — δ-tocotrienol in the body of the abstract and then "Similar results of these parameters were reported for γ-tocotrienol, β-tocotrienol, α-tocotrienol" and three tocopherols — so there is no single species for a one-compartment curve to describe. THE VOLUME IN THAT ABSTRACT IS DIMENSIONALLY IMPOSSIBLE AS PRINTED, "volume of distribution (Vd/f, mg/h) 0.34", and the stored record used neither it nor the stated half-life: the abstract gives 2.74 and 2.68 h for δ-tocotrienol against a stored 4. The volume was the solver default wearing a citation.');
    log.push('tocotrienols — STRIPPED to mixture (per-isomer data; its volume is printed in mg/h)');
  } else { log.push('tocotrienols — already unauthored, skipped'); }
}

// ── The rest: the citation states no volume at all ────────────────────────
const dropped: string[] = [];
for (const c of data) {
  if (c.slug === 'nac' || c.slug === 'hydroxocobalamin' || c.slug === 'pramiracetam') continue;
  for (const [r, p] of Object.entries(c.pk ?? {})) {
    if (p && p.V_L === 35) { delete p.V_L; dropped.push(`${c.slug}.${r}`); }
  }
}
if (dropped.length) {
  for (const slug of new Set(dropped.map((x) => x.split('.')[0]!))) {
    note(need(slug), 'PK: THE STORED VOLUME WAS THE SOLVER DEFAULT WEARING A CITATION. 35 L is exactly 0.5 L/kg at the seventy-kilogram reference — the value resolvePk substitutes when the field is ABSENT — and this record cited abstract states no volume at all. Removing it is NUMERICALLY A NO-OP, since the resolver now supplies the identical number; what changes is that the record stops asserting a measurement it does not have, and the defaulted-volume lint begins counting it as the open gap it is. This is the batch-11 finding running backwards: there a deletion silently became a default, here a default had silently become a datum.');
  }
  log.push(`${dropped.length} rows dropped an unsourced V_L of exactly 35 (numerically a no-op): ${dropped.join(', ')}`);
}

console.log(`\ndefaulted-volume sweep — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
