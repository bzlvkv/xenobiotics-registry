/**
 * 2026-06-21-fix-folate-retinol.ts — P1.1 data migration for the foods audit.
 *
 * Companion to the fdc-nutrients.ts mapper fix. The bulk FDC extraction routed
 * food folate to synthetic `folic-acid` (and double-counted it as `methylfolate`)
 * and fabricated preformed `retinol` on plant foods from Vitamin-A RAE. The
 * mapper fix prevents recurrence; this script repairs the EXISTING rows:
 *
 *   1. Registry: add the `folate` (natural food folate) compound; drop the now-
 *      ambiguous "folate" alias from `methylfolate`.
 *   2. foods.json, whole-food categories (produce/meat_seafood/dairy/grain):
 *      collapse folic-acid + methylfolate into ONE `folate` item (folic-acid's
 *      value = USDA 'Folate, total' is the total natural folate; else methylfolate).
 *   3. foods.json, produce: drop the fabricated preformed `retinol` rows — fresh
 *      produce has zero (the value was Vitamin-A RAE carotenoid activity).
 *
 * Idempotent (re-run = no-op). Dry-run by default; pass --write to apply.
 *   pnpm tsx scripts/authoring/2026-06-21-fix-folate-retinol.ts [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const COMPOUNDS = join(ROOT, 'packages', 'registry', 'data', 'compounds.json');
const FOODS = join(ROOT, 'packages', 'registry', 'data', 'foods.json');
const write = process.argv.includes('--write');

const WHOLE = new Set(['produce', 'meat_seafood', 'dairy', 'grain']);

const FOLATE_COMPOUND = {
  slug: 'folate',
  name: 'Folate (food)',
  aliases: ['Vitamin B9 (food folate)', 'Dietary folate', 'Natural folate', 'Folate, total'],
  category: 'vitamin',
  mechanism:
    "The naturally-occurring mixture of reduced folate vitamers in whole foods — predominantly 5-methyl-tetrahydrofolate polyglutamates, with smaller amounts of formyl- and tetrahydrofolate forms. Intestinal conjugase hydrolyses the polyglutamates to monoglutamates for absorption; they enter the one-carbon cycle (see [[folate_one_carbon]]) without the DHFR reduction step that synthetic [[folic-acid]] requires, so food folate produces no unmetabolised folic acid (UMFA). Used to log the folate naturally present in foods (USDA 'Folate, total' / 'Folate, food'), where labelling it folic acid misrepresents the chemical form.",
  routes: ['PO'],
  doses: { PO: { min: 100, max: 600, typical: 240, unit: 'mcg' } },
  pk_unauthored: {
    reason: 'mixture',
    note: "Natural food folate is a mixture of reduced polyglutamate vitamers with no single-species plasma PK; cumulative dietary intake (not single-dose kinetics) is the relevant axis. Supplemental reduced folate is modelled as [[methylfolate]], synthetic fortification folate as [[folic-acid]].",
  },
  systems: ['immune-hematologic', 'nervous'],
  nutrition: {
    rdi: 400,
    unit: 'mcg',
    note: "Vitamin B9 (natural food folate). FDA Daily Value 400 mcg DFE (21 CFR 101.9). No tolerable upper limit applies to food folate — the 1000 mcg/d UL is specific to synthetic folic acid.",
  },
  refs: [] as string[],
};

type Item = { compound: string; dose: number; dose_unit: string };
type Food = { slug: string; category: string; items: Item[] };

// ── Registry ─────────────────────────────────────────────────────────────
const compounds = JSON.parse(readFileSync(COMPOUNDS, 'utf-8')) as Array<{ slug: string; aliases?: string[] }>;
let compoundChanged = false;
if (!compounds.some((c) => c.slug === 'folate')) {
  const i = compounds.findIndex((c) => c.slug === 'folic-acid'); // insert next to it for locality
  if (i >= 0) compounds.splice(i + 1, 0, FOLATE_COMPOUND as unknown as { slug: string });
  else compounds.push(FOLATE_COMPOUND as unknown as { slug: string });
  compoundChanged = true;
  console.log('+ compound: folate (natural food folate)');
}
const mf = compounds.find((c) => c.slug === 'methylfolate');
if (mf?.aliases?.includes('folate')) {
  mf.aliases = mf.aliases.filter((a) => a !== 'folate');
  compoundChanged = true;
  console.log("~ methylfolate: dropped now-ambiguous 'folate' alias");
}

// ── Foods ────────────────────────────────────────────────────────────────
const foods = JSON.parse(readFileSync(FOODS, 'utf-8')) as Food[];
let folateFixed = 0, retinolDropped = 0;
for (const f of foods) {
  if (!Array.isArray(f.items)) continue;

  if (WHOLE.has(f.category)) {
    const fa = f.items.find((it) => it.compound === 'folic-acid');
    const mfo = f.items.find((it) => it.compound === 'methylfolate');
    if (fa || mfo) {
      const src = fa ?? mfo!; // folic-acid carried 'Folate, total' (the total natural folate)
      const at = f.items.findIndex((it) => it.compound === 'folic-acid' || it.compound === 'methylfolate');
      f.items = f.items.filter((it) => it.compound !== 'folic-acid' && it.compound !== 'methylfolate');
      f.items.splice(Math.min(at, f.items.length), 0, { compound: 'folate', dose: src.dose, dose_unit: src.dose_unit });
      folateFixed++;
    }
  }

  if (f.category === 'produce') {
    const before = f.items.length;
    f.items = f.items.filter((it) => it.compound !== 'retinol'); // RAE carotenoid activity, not preformed retinol
    if (f.items.length < before) retinolDropped++;
  }
}

const emptied = foods.filter((f) => Array.isArray(f.items) && f.items.length === 0).map((f) => f.slug);
if (emptied.length) { console.error(`ABORT: emptied ${emptied.join(', ')}`); process.exit(1); }

console.log(`\nfolate-collapsed (whole-food cats): ${folateFixed} foods`);
console.log(`retinol-dropped (produce): ${retinolDropped} foods`);
if (!write) { console.log('\nDRY-RUN — pass --write to apply.'); process.exit(0); }
if (compoundChanged) writeFileSync(COMPOUNDS, JSON.stringify(compounds, null, 2) + '\n');
writeFileSync(FOODS, JSON.stringify(foods, null, 2) + '\n');
console.log('\n✓ compounds.json + foods.json written. Run `pnpm registry:lint`.');
