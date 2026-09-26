/**
 * 2026-09-08-ki-calibration-basis-4.ts
 *
 * Fourth ki_basis batch — the tail, where blocks stop being uniform.
 *
 * posaconazole is the last clean one: three edges, one assumed concentration of
 * 2 uM, two of the notes printing the arithmetic. After that the blocks split.
 *
 * ── WHERE ONE CONSTANT NO LONGER FITS, ONLY THE FITTING EDGES MOVE ────────
 *   quinidine     1.5 uM fits dextromethorphan and propafenone. It does NOT
 *                 fit digoxin — which is P-GLYCOPROTEIN, not CYP, so a
 *                 competitive-inhibition constant there is a borrowed shape.
 *   voriconazole  8 uM fits midazolam and cyclosporine; tacrolimus and
 *                 alfentanil both imply a 9-fold rise their sources do not
 *                 state (6.02x and 6.67x respectively).
 *   verapamil     0.5 uM fits buspirone and midazolam but not simvastatin.
 *   diltiazem     NO constant fits: its four edges imply 0.35, 0.27 and 0.50.
 *                 Untouched entirely.
 *   fluoxetine    two edges imply 1.0 and 7.7. Untouched.
 * That is the discipline the invariant buys: the script THROWS rather than
 * relabel an edge whose arithmetic does not close, so a block can be half
 * converted and the remainder stays visibly undeclared instead of being
 * quietly rounded into agreement.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Kin { ki_uM?: number; ki_basis?: string; auc_ratio?: number; assumed_perp_uM?: number }
interface Compound { slug: string; interactions?: { slug?: string; kinetics?: Kin }[]; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

/** perpetrator → [victim, assumed [I] µM, verbatim exposure ratio][] */
const CALIBRATED: Record<string, [string, number, number][]> = {
  posaconazole: [
    ['midazolam', 2, 6.2],      // "6.2x (400 mg BID)"
    ['tacrolimus', 2, 4.58],    // "AUC +358% (ratio 4.58)"
    ['rapamycin', 2, 8.9],      // "sirolimus Cmax 6.7x, AUC 8.9x"
  ],
  quinidine: [
    ['dextromethorphan', 1.5, 43],  // "increased the AUC in extensive metabolizers 43-fold"
    ['propafenone', 1.5, 2.671],    // steady-state 408 → 1090 ng/mL
  ],
  voriconazole: [
    ['midazolam', 8, 10.3],     // "oral midazolam Cmax 3.8x, AUC 10.3x"
    ['cyclosporine', 8, 1.7],   // "CsA AUCt ratio 1.7x"
  ],
  verapamil: [
    ['buspirone', 0.5, 3.4],    // "increased the ... AUC (0-infinity) 3.4-fold"
    ['midazolam', 0.5, 2.9167], // AUC 12 → 35 µg·mL⁻¹·min
  ],
  bupropion: [
    ['atomoxetine', 1, 5.1],    // AUC0-inf 1580 → 8060 ng·h/mL
    ['desipramine', 1, 5],      // "marked (5-fold) increases in desipramine exposure"
  ],
  terbinafine: [
    ['desipramine', 3, 4.944],  // AUC0-inf 482 → 2383 ng·h/mL
  ],
};

/** Edges that really are measured affinities. */
const IN_VITRO: Record<string, string[]> = {};

const PROSE: Record<string, string> = {
  posaconazole: 'INTERACTIONS: THE LAST UNIFORM BLOCK — all three affinities invert through one assumed concentration of 2 µM and two of the notes print the arithmetic. Nothing here is in dispute; the basis simply had no field to live in.',
  quinidine: 'INTERACTIONS: TWO OF FOUR INVERT THROUGH 1.5 µM — the dextromethorphan edge, whose source is the same paper this catalogue cites for dextromethorphan own pharmacokinetics, and propafenone. THE DIGOXIN EDGE IS LEFT ALONE FOR A REASON WORTH STATING: it does not fit the constant, and it is P-GLYCOPROTEIN INHIBITION rather than enzyme inhibition, so a competitive-inhibition affinity is a borrowed shape there regardless of what number sits in it. The desipramine edge implies a rise its visible note does not state.',
  voriconazole: 'INTERACTIONS: TWO OF FOUR INVERT THROUGH 8 µM, one of them stating it outright. THE OTHER TWO BOTH IMPLY A NINE-FOLD RISE THAT NEITHER SOURCE STATES — tacrolimus cites 6.02-fold and alfentanil an 85 percent clearance fall, which is 6.67-fold — so two independent edges were adjusted to the same wrong place, which is more suggestive than one but still not a finding. Left alone.',
  verapamil: 'INTERACTIONS: TWO OF THREE INVERT THROUGH 0.5 µM, the same constant its sibling diltiazem fails to share. The simvastatin edge does not fit and is left alone. NOTE THE BUSPIRONE SOURCE REPORTS BOTH CALCIUM BLOCKERS IN ONE SENTENCE — "Verapamil and diltiazem increased the ... AUC (0-infinity) 3.4-fold" — the shared-sentence shape that has produced transplants elsewhere in this catalogue; here both records correctly store the same ratio, because the sentence genuinely reports one figure for both drugs.',
  bupropion: 'INTERACTIONS: BOTH AFFINITIES INVERT THROUGH 1.0 µM, from a fivefold exposure rise in each case. A caveat carried from the record own notes: the inhibition is attributed to bupropion together with its hydroxy metabolite, so a constant expressed against the parent plasma curve alone understates the perpetrator.',
  terbinafine: 'INTERACTIONS: THE DESIPRAMINE EDGE INVERTS THROUGH 3 µM from a verbatim exposure pair, "AUC0-infinity (482 ng.h/ml vs. 2383 ng.h/ml)". The venlafaxine edge is left undeclared because the ratio it would need is not in the visible note, though its stored value sits close enough to the same constant to suggest it belongs to it.',
  diltiazem: 'INTERACTIONS: NO SINGLE ASSUMED CONCENTRATION FITS THIS BLOCK — its four edges imply 0.35, 0.27, 0.50 and an unresolved fourth, so unlike every other block audited it was not built from one constant. NOTHING IS RELABELLED HERE. Its sibling verapamil does invert through 0.5 µM on two of three edges, which makes the inconsistency specific to this record rather than to the pair.',
  fluoxetine: 'INTERACTIONS: THE TWO AFFINITIES IMPLY ASSUMED CONCENTRATIONS OF 1.0 AND 7.7 µM, a sevenfold disagreement within one block, so neither can be relabelled on the evidence available. Left undeclared rather than forced into agreement.',
};

for (const [perp, edges] of Object.entries(CALIBRATED)) {
  const c = need(perp);
  let n = 0;
  for (const [victim, I, R] of edges) {
    const e = (c.interactions ?? []).find((x) => x.slug === victim);
    if (!e?.kinetics) throw new Error(`${perp} → ${victim} missing`);
    if (e.kinetics.ki_basis) continue;
    const exact = Number((I / (R - 1)).toPrecision(6));
    const before = e.kinetics.ki_uM;
    if (before == null) throw new Error(`${perp} → ${victim} has no ki_uM`);
    if (Math.abs(exact - before) / before > 0.05) {
      throw new Error(`${perp} → ${victim}: [I]/(R−1) = ${exact} but stored ${before} — refusing to relabel`);
    }
    e.kinetics.ki_uM = exact;
    e.kinetics.ki_basis = 'calibrated_from_auc';
    e.kinetics.auc_ratio = R;
    e.kinetics.assumed_perp_uM = I;
    n++;
  }
  if (n) { note(c, PROSE[perp]!); log.push(`${perp} — ${n} edge(s) calibrated_from_auc`); }
  else log.push(`${perp} — already relabelled, skipped`);
}

for (const [perp, victims] of Object.entries(IN_VITRO)) {
  const c = need(perp);
  let n = 0;
  for (const victim of victims) {
    const e = (c.interactions ?? []).find((x) => x.slug === victim);
    if (!e?.kinetics) throw new Error(`${perp} → ${victim} missing`);
    if (e.kinetics.ki_basis) continue;
    e.kinetics.ki_basis = 'in_vitro';
    n++;
  }
  if (n) { note(c, PROSE[perp]!); log.push(`${perp} — ${n} edge(s) declared in_vitro (a real measured Ki)`); }
  else log.push(`${perp} — already declared, skipped`);
}

for (const slug of ['diltiazem', 'fluoxetine']) { note(need(slug), PROSE[slug]!); log.push(`${slug} — NOT relabelled; no single assumed concentration fits the block`); }

const left = data.reduce((s, c) => s + (c.interactions ?? []).filter((e) => e.kinetics?.ki_uM != null && !e.kinetics.ki_basis).length, 0);
console.log(`\nki calibration basis, batch 4 — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
console.log(`\n  ${left} ki_uM edges still carry no declared basis`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
