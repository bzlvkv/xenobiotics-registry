/**
 * 2026-09-08-aripiprazole-analyte.ts
 *
 * The one TRUE positive among three `pk.prodrug-analyte-unstated` warnings.
 *
 * The other two were the rule reading prose backwards — valsartan's note says
 * "no active metabolite (unlike losartan)" and hydroxychloroquine's "converted
 * to base" is a SALT conversion — and were fixed in the rule, not the data.
 * This one is real: the cited study reports "plasma concentrations of
 * aripiprazole AND ITS ACTIVE METABOLITE dehydro-aripiprazole" as separate
 * analytes, so "the half-life" on this record is genuinely ambiguous until it
 * says which molecule it means.
 *
 * It means the parent: the stored bioavailability is verbatim for the parent —
 * "the geometric mean values for the absolute bioavailability of aripiprazole
 * following oral and intramuscular administration were 0.85 and 0.98" — and
 * 0.85 is what the record stores on its oral route.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; pk_analyte?: string; pk_analyte_name?: string; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const log: string[] = [];
const c = data.find((x) => x.slug === 'aripiprazole');
if (!c) throw new Error('aripiprazole missing');

if (c.pk_analyte == null) {
  c.pk_analyte = 'parent';
  const t = 'PK ANALYTE: DECLARED PARENT, because this record cited study measures two molecules and the record stores one of them. Verbatim, that paper determined "The noncompartmental pharmacokinetic parameters for plasma concentrations of aripiprazole and its active metabolite dehydro-aripiprazole", and the bioavailability stored here is unambiguously the parent figure — "the geometric mean values for the absolute bioavailability of aripiprazole following oral and intramuscular administration were 0.85 and 0.98". WHAT THIS DOES NOT FIX, AND SHOULD BE SAID: the active metabolite carries a substantial share of exposure at steady state and has its own longer half-life, so a parent-only curve understates the active material at the receptor. The occupancy rows on this record are therefore driven by the smaller half of the pharmacology. Logged rather than modelled, since authoring a metabolite chain needs a formation fraction this abstract does not state.';
  if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t;
  log.push('aripiprazole — pk_analyte: parent (its citation measures parent and dehydro-aripiprazole separately)');
} else {
  log.push(`aripiprazole — pk_analyte already ${c.pk_analyte}, skipped`);
}

console.log(`\naripiprazole analyte — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
