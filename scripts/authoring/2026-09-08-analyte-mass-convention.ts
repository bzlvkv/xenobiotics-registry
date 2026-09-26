/**
 * 2026-09-08-analyte-mass-convention.ts
 *
 * `mw_g_mol` describes ONE species, and a record with `pk_analyte:
 * 'active-metabolite'` describes TWO. Ten records stored the PARENT mass while
 * every consumer of the field wants the ANALYTE.
 *
 * ── WHY THE ANALYTE MASS IS THE RIGHT ONE FOR BOTH CONSUMERS ───────────────
 * 1. INTERACTION PERPETRATOR CONVERSION. The solver converts a `ki_uM` against
 *    the perpetrator's PLASMA concentration. For a prodrug, the species in
 *    plasma is the analyte — which is exactly what `pk[]` and `half_life_hr[]`
 *    already describe. Using the parent mass converts against a molecule that
 *    is not there.
 * 2. AFFINITY DISPLAY. `affinityLabel()` in apps/app/src/lib/receptors.ts
 *    back-converts the stored `ec50_mg_l` to a Ki for display, using the
 *    RECORD'S mw. The rows themselves were authored by converting a published
 *    nM or µM affinity — measured on the ACTIVE species — into mg/L. So when
 *    the record's mw disagrees with the mass the row used, THE SCREEN SHOWS A
 *    NUMBER THE SOURCE DOES NOT CONTAIN, and the round trip does not close.
 *
 * ── WHAT THE SWEEP ACTUALLY FOUND, AGAINST MY EXPECTATION ─────────────────
 * A batch-10 agent reported "all 19 records declaring a metabolite analyte
 * store the parent mass", with four live in the UI. THAT WAS TRUE WHEN THE
 * CONVENTION WAS FIRST NOTICED AND IS NO LONGER TRUE — earlier passes had
 * already corrected fenofibrate and misoprostol IN THE ROW NOTES, batch 10
 * corrected nabumetone, fosinopril, oseltamivir, sacubitril and
 * tenofovir-disoproxil, and baloxavir and eslicarbazepine were right all along.
 * OF THE FOUR RECORDS WITH LIVE OCCUPANCY ROWS, ONLY sulindac STILL MISMATCHES.
 * The remaining nine are latent — no occupancy rows, no kinetics edge — but
 * they are the same defect and they are one authored edge away from being live.
 *
 * Masses are computed from the molecular formula (verified against PubChem
 * PUG-REST), not cited: a molecular weight is arithmetic on a formula, not a
 * published measurement, so the verbatim rule does not reach it. Where an
 * occupancy row already recorded the mass it converted with, THAT value is
 * stored, so the record closes on itself exactly.
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
  slug: string; mw_g_mol?: number; pk_analyte?: string; pk_analyte_name?: string;
  receptor_occupancy?: { ec50_mg_l?: number; note?: string }[];
  interactions?: { kinetics?: { ki_uM?: number } }[];
  notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

/** [slug, parent mass now stored, analyte mass, formula, analyte] */
const FIXES: [string, number, number, string, string][] = [
  ['enalapril',        376.45, 348.40, 'C18H24N2O5', 'enalaprilat'],
  ['famciclovir',      321.34, 253.26, 'C10H15N5O3', 'penciclovir'],
  ['lisdexamfetamine', 263.38, 135.21, 'C9H13N',     'dextroamphetamine'],
  ['mycophenolate',    433.50, 320.34, 'C17H20O6',   'mycophenolic acid'],
  ['prednisone',       358.43, 360.44, 'C21H28O5',   'prednisolone'],
  ['simvastatin',      418.57, 436.59, 'C25H40O6',   'simvastatin acid'],
  ['sulindac',         356.41, 340.40, 'C20H17FO2S', 'sulindac sulfide'],
  ['tazarotene',       351.46, 323.41, 'C19H17NO2S', 'tazarotenic acid'],
  ['valacyclovir',     324.34, 225.20, 'C8H11N5O3',  'acyclovir'],
  ['valganciclovir',   354.36, 255.23, 'C9H13N5O4',  'ganciclovir'],
];

const SULINDAC_NOTE = 'MASS: THE ONLY ONE OF THE FOUR LIVE RECORDS IN THIS CLASS STILL MISMATCHED, AND THE DISAGREEMENT IS INTERNAL. Its occupancy row converted a published whole-blood inhibitory concentration using the SULFIDE mass, which is right — that is the species the assay measured and the species this record pk_analyte declares — while the record own molecular weight was the PARENT. Since the app back-converts the stored concentration for display USING THE RECORD MASS, the round trip did not close and the screen showed an affinity 4.5 percent away from what the source states. The stored mass is now the one the row itself used, so the record closes on itself exactly.';
const GENERIC_NOTE = 'MASS: the stored molecular weight described the PARENT while pk_analyte declares the metabolite, so the one field that must name a single species named the wrong one. LATENT RATHER THAN LIVE — this record carries no occupancy rows and is no other record interaction perpetrator — but it is one authored edge away from being live, because both consumers of the field (the micromolar-to-mass conversion for a kinetics edge, and the affinity the app renders from a stored occupancy concentration) want the species that actually circulates, which is the species pk[] already describes.';

for (const [slug, from, to, formula, analyte] of FIXES) {
  const c = by.get(slug);
  if (!c) throw new Error(`${slug} missing`);
  if (c.pk_analyte === 'parent' || c.pk_analyte == null) throw new Error(`${slug} is not a metabolite-analyte record`);
  if (c.mw_g_mol !== from) { log.push(`${slug} — mw already ${c.mw_g_mol}, skipped`); continue; }
  c.mw_g_mol = to;
  note(c, slug === 'sulindac' ? SULINDAC_NOTE : GENERIC_NOTE);
  const pct = (Math.abs(to - from) / from) * 100;
  log.push(`${slug} mw ${from} → ${to} (${analyte}, ${formula}) — ${pct.toFixed(1)}% ${to > from ? 'low' : 'high'} as stored`);
}

// The whole class, restated after the fix, so the next pass can see it closed.
const CLASS = data.filter((c) => c.pk_analyte && c.pk_analyte !== 'parent');
const live = CLASS.filter((c) => (c.receptor_occupancy ?? []).length > 0 || (c.interactions ?? []).some((e) => e.kinetics?.ki_uM != null));
console.log(`\nanalyte-mass convention — ${log.length} entries`);
console.log(`  ${CLASS.length} records declare a non-parent pk_analyte; ${live.length} have a live consumer (occupancy row or ki edge)\n`);
for (const l of log) console.log('  ' + l);

if (WRITE) {
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwrote ${COMPOUNDS_PATH}`);
} else {
  console.log('\n(dry run — pass --write to apply)');
}
