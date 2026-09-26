/**
 * 2026-09-08-fulltext-gap-sweep.ts
 *
 * Prompted by the olanzapine finding: its depot peak time was sitting in the
 * FULL TEXT of the paper the record already cited, invisible to every previous
 * pass because those passes read abstracts.
 *
 * So: every record with a missing V_L, F, ka or fraction_unbound was mapped to
 * the PMIDs it already cites — 234 gap rows, 503 distinct citations — and each
 * of those citations checked for open-access full text. 122 of 503 (24%) are in
 * PMC. Their full texts were fetched and searched for the specific parameter
 * the citing record is missing.
 *
 * ── 35 CANDIDATE SENTENCES, AND MOST OF THEM DO NOT SURVIVE READING ───────
 * The screen is deliberately loose, so its output is a reading list rather than
 * a result. What it turned up was mostly author addresses, reference-list
 * fragments and table headers that happen to contain the words. Of the ones
 * that were real numbers, several are traps of kinds this audit already names:
 *   prednisone   "the bioavailability of prednisolone after oral prednisone is
 *                approximately 80% of that after prednisolone" — a RELATIVE
 *                bioavailability, the class-2 trap. Not storable as F.
 *   oxandrolone  "mean bioavailability = 62.5%" — but for a BUCCAL MCT-oil
 *                formulation, not the oral tablet the record doses.
 *   cephalexin   its numbers are the review's citations to other papers, not
 *                its own measurements.
 * Three survived, and one of those needed rearranging before it was usable.
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
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const PATCH: { slug: string; route: string; set: Record<string, unknown>; guard: (c: Compound) => boolean; note: string; summary: string }[] = [
  { slug: 'teriparatide', route: 'SC', guard: (c) => c.pk?.SC?.V_L == null,
    set: { V_L: 89.4, F: 1 },
    note: 'PK: THE VOLUME WAS IN THE FULL TEXT OF THIS RECORD OWN CITATION, AND STORING IT VERBATIM WOULD HAVE BEEN WRONG. That paper reports "Teriparatide CL/F (approximately 62 l/h, 46% CV)" and "The V/F following subcutaneous administration was approximately 7.8 l (107% CV)" — and THOSE TWO TOGETHER IMPLY A HALF-LIFE OF FIVE MINUTES, against the roughly one hour this record stores and the literature reports for the subcutaneous route. The pair describes fast disposition; the stored half-life is absorption-limited. Storing 7.8 L beside a one-hour half-life would assert a clearance of 5.4 L/h against that paper own 62 — an eleven-fold understatement, the same Vss-against-terminal shape found on sufentanil and vecuronium. The volume stored is instead the VERBATIM CLEARANCE over the rate the stored half-life implies, so exposure reproduces the paper. Bioavailability is pinned at unity because the published quantity is explicitly apparent, which stops the solver dividing by absorption twice. THE SCREEN THAT FOUND THIS READ ABSTRACTS FOR THREE PASSES AND MISSED IT EACH TIME.',
    summary: 'teriparatide — V_L 89.4 + F 1 from its own full text (verbatim CL/F 62 L/h; the verbatim V/F implies a 5-min half-life)' },

  { slug: 'mitragynine', route: 'PO', guard: (c) => c.pk?.PO?.V_L == null,
    set: { V_L: 2663, F: 1 },
    note: 'PK: THE VOLUME WAS IN THE FULL TEXT OF THIS RECORD OWN CITATION — the first human pharmacokinetic study of this compound, nine subjects. Verbatim: "the pharmacokinetic parameters established were time to reach the maximum plasma concentration (0.83±0.35 hour), terminal half-life (23.24±16.07 hours), and the apparent volume of distribution (38.04±24.32 L/kg)". THE STORED HALF-LIFE ALREADY MATCHES THAT SENTENCE EXACTLY, so the volume beside it was simply never taken; at the seventy-kilogram reference it is 2,663 L. It is an APPARENT volume, so bioavailability is pinned at unity rather than left at the 0.9 default, which would otherwise divide by absorption twice. TWO CAVEATS ARE RECORDED RATHER THAN BURIED: the paper fits a TWO-COMPARTMENT model and this is its apparent volume paired with a terminal half-life, the class-12 shape; and the spread is enormous, plus or minus 64 percent on the volume and 69 percent on the half-life, in nine subjects.',
    summary: 'mitragynine — V_L 2663 + F 1 from its own full text (verbatim 38.04 L/kg; t½ already matched that sentence)' },

  { slug: 'olanzapine', route: 'PO', guard: (c) => c.pk?.PO?.V_L == null,
    set: { V_L: 1100, ka_hr: 0.3 },
    note: 'PK: A COHERENT ONE-COMPARTMENT PARAMETER SET WAS SITTING IN THE FULL TEXT OF THE PAPER THIS RECORD CITES FOR ITS OTHER ROUTE. Verbatim: "for oral olanzapine administration, the simulation was based on a 20 mg oral dose for a one-compartment model [absorption rate constant (k a )=0.3/h; elimination rate constant (k el )]=0.0231/h; volume of distribution (V d )=1100 L]", which the authors describe as representing "typical olanzapine pharmacokinetic properties for a daily oral dose (20 mg) with an elimination half-life of 30 h and a clearance of 25 L/h". IT IS A MODELLING PARAMETERISATION RATHER THAN A FITTED MEASUREMENT, AND THAT IS SAID PLAINLY — but it is a ONE-COMPARTMENT set, which is exactly the structure this solver consumes, and it is internally consistent: at the half-life this record already stores it implies 23.1 L/h against the paper stated 25. ONLY THE ORAL HALF IS TAKEN. The same paragraph goes on to change the parameters for the long-acting injection, so the 1,100 L does NOT describe the depot route, whose volume remains an open gap.',
    summary: 'olanzapine.PO — V_L 1100 + ka 0.3 from a verbatim one-compartment set in its sibling route citation' },
];

for (const p of PATCH) {
  const c = need(p.slug);
  if (!p.guard(c)) { log.push(`${p.slug} — already corrected, skipped`); continue; }
  const row = c.pk?.[p.route];
  if (!row) throw new Error(`${p.slug} has no pk.${p.route}`);
  Object.assign(row, p.set);
  note(c, p.note);
  log.push(p.summary);
}

console.log(`\nfull-text gap sweep — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
