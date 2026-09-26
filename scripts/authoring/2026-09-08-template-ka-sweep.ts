/**
 * 2026-09-08-template-ka-sweep.ts
 *
 * The absorption-rate half of the template problem.
 *
 * 621 extravascular route rows; 276 carry a `ka_hr` and 345 already default
 * silently. Of the 276, TWELVE VALUES ACCOUNT FOR 152 ROWS — 1.0 on 31, 0.5 on
 * 23, 1.5 on 22, 0.8 and 1.4 on 14 each, 2.0 on 12 — across compounds with
 * nothing in common but an author reaching for a plausible number.
 *
 * ── THIS PASS TOUCHES ONLY THE ONE BUCKET WHERE DELETING IS FREE ──────────
 * `resolvePk` substitutes `ka_hr ?? 1.0`, so a stored 1.0 IS THE DEFAULT —
 * exactly the shape found on `V_L: 35`. Removing it is numerically a no-op and
 * converts a false claim into a declared gap.
 *
 * THE OTHER 121 ROWS ARE NOT TOUCHED, AND THAT IS DELIBERATE. 0.5, 1.5, 0.8,
 * 1.4 and 2.0 are NOT the default, so deleting them would move every one of
 * those curves toward 1.0 — the batch-11 trap, where a deletion silently
 * becomes a default that is further from the truth. They need sourcing, one
 * record at a time, and until then a new lint rule counts them out loud.
 *
 * ── THE ONE EXCEPTION KEPT ────────────────────────────────────────────────
 * gemfibrozil's ka of 1.0 was authored deliberately in batch 10, paired with a
 * verbatim-reasoned `lag_hr` of 0.75 to reproduce an observed peak the bare
 * default renders 35 minutes too early. Deleting it would orphan the lag. Any
 * row carrying a `lag_hr` or `zo_dur_hr` is exempt for the same reason.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; pk?: Record<string, Record<string, unknown> | undefined>; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const log: string[] = [];
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const NOTE = 'PK: THE STORED ABSORPTION RATE WAS THE SOLVER DEFAULT WEARING A CITATION. A ka of 1.0/h is exactly what resolvePk substitutes when the field is ABSENT, and no source on this record states one. Removing it is NUMERICALLY A NO-OP — the resolver supplies the identical number — so no curve moves; what changes is that the record stops asserting an absorption rate it never measured. This is the same shape already found on a volume of 35 L, which is likewise the default at the seventy-kilogram reference. THE WIDER DEBT IS LEFT ALONE ON PURPOSE: twelve values account for 152 of the 276 authored absorption rates, but the other eleven are NOT the default, so deleting those would move their curves rather than leave them, which is the error this audit spent a batch documenting.';

const dropped: string[] = [];
for (const c of data) {
  for (const [r, p] of Object.entries(c.pk ?? {})) {
    if (!p || r === 'IV' || p.ka_hr !== 1) continue;
    // A lag or a zero-order duration means the absorption block was authored as
    // a unit; removing half of it would leave the other half meaningless.
    if (p.lag_hr != null || p.zo_dur_hr != null) { log.push(`${c.slug}.${r} — ka 1.0 kept (authored with a lag/zero-order duration)`); continue; }
    delete p.ka_hr;
    dropped.push(`${c.slug}.${r}`);
    note(c, NOTE);
  }
}
if (dropped.length) log.push(`${dropped.length} rows dropped an unsourced ka of exactly 1.0 (numerically a no-op): ${dropped.join(', ')}`);

console.log(`\ntemplate-ka sweep — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
