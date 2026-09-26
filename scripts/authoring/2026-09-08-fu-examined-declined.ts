/**
 * 2026-09-08-fu-examined-declined.ts
 *
 * First user of `fu_note` WITHOUT `fraction_unbound` — the state that records
 * "a free fraction was looked for and deliberately not authored".
 *
 * `pd.occupancy-needs-fu` fires on 37 records. At least one of them is not a
 * gap at all: eplerenone's free fraction was examined in an earlier pass and
 * skipped ON THE SOURCE'S OWN WORDS — "Plasma protein binding was moderate
 * (33-60%) but CONCENTRATION-DEPENDENT over the therapeutic concentration
 * range". A single scalar cannot represent a binding that moves with
 * concentration, so declining to author one is the correct answer, not a
 * missing one.
 *
 * THAT REASONING WAS SITTING IN PROSE `notes`, WHERE THE RULE CANNOT READ IT,
 * so the lint re-reported a settled question every run — and a warning that
 * cannot be resolved by doing the right thing is one authors learn to ignore.
 * The schema now says a note without a value means examined-and-declined, and
 * the rule stays quiet for it.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; fraction_unbound?: number; fu_note?: string; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];

const DECLINED: { slug: string; note: string; summary: string }[] = [
  { slug: 'eplerenone',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. Its source states binding as both a range and a moving target: "Plasma protein binding was moderate (33-60%) but concentration-dependent over the therapeutic concentration range". A scalar can represent neither, and a range midpoint stored as a measurement is a confirmed defect class here. The occupancy rows keep the uncorrected comparison, biasing them high by up to ~3x at the low-binding end — a stated cost, not an oversight. Class 8 is separately EXCLUDED: "EP and its metabolites did not preferentially partition into the red blood cells".',
    summary: 'eplerenone — fu examined and declined (binding is concentration-dependent), reasoning moved out of prose' },
];

for (const d of DECLINED) {
  const c = by.get(d.slug);
  if (!c) throw new Error(`${d.slug} missing`);
  if (c.fraction_unbound != null) throw new Error(`${d.slug} now HAS a fraction_unbound — this script would misdescribe it`);
  if (c.fu_note) { log.push(`${d.slug} — already recorded, skipped`); continue; }
  if (d.note.length > 600) throw new Error(`${d.slug} fu_note is ${d.note.length} chars (cap 600)`);
  c.fu_note = d.note;
  log.push(d.summary);
}

console.log(`\nfu examined-and-declined — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
