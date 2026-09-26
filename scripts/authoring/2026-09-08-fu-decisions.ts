/**
 * 2026-09-08-fu-decisions.ts
 *
 * `pd.occupancy-needs-fu` fires on 36 records. THE ANSWER FOR MOST OF THEM WAS
 * ALREADY KNOWN — an earlier fraction_unbound batch examined them, chased the
 * literature, and recorded in AUTHORING_GAPS.md that a scalar is INDEFENSIBLE,
 * not merely unfound. That reasoning never reached the data, so the lint has
 * been re-reporting settled questions ever since.
 *
 * This moves those decisions into `fu_note`, where the rule can read them, and
 * authors the two values I could establish verbatim.
 *
 * ── WHY "NOT AUTHORED" IS THE ACCURATE ANSWER FOR THESE ───────────────────
 * Every one has a specific, sourced reason a single number would be a fiction:
 *   linagliptin  binding saturates on its own target, and the therapeutic
 *                steady-state Cmax sits INSIDE the transition
 *   cortisol     fu swings 1.6x across an ordinary day before any stress
 *   mifepristone AAG binding saturates within the therapeutic range
 *   montelukast  its own methods literature says only a range is reportable
 *   irbesartan   two independent laboratories disagree
 *   olanzapine   the circulating "90%" is ALBUMIN-ONLY, not total binding
 *   progesterone the available figures are rat
 *   semaglutide, tirzepatide, retatrutide — see below
 *
 * ── THE ACYLATED-PEPTIDE ARGUMENT, WHICH CUTS THE OTHER WAY ───────────────
 * These carry engineered fatty-acid chains whose albumin binding IS the
 * half-life mechanism, and potency assays for such analogues are routinely run
 * WITH ALBUMIN PRESENT. So a stored EC50 may ALREADY be albumin-shifted, and
 * dividing by fu would double-count the same binding and UNDER-predict
 * occupancy roughly a hundredfold. `basis: 'in_vitro_ki'` silently assumes a
 * protein-free assay; for engineered albumin binders that is unverified.
 * Here the correction is not merely unmeasurable — IT MIGHT BE BACKWARDS.
 * (The earlier batch made this argument for semaglutide and tirzepatide.
 * Extending it to retatrutide is MINE, on the strength of that record's own
 * prose describing the same C-20 fatty-diacid albumin anchor; flagged as an
 * extension rather than presented as inherited.)
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; fraction_unbound?: number; fu_note?: string; refs?: string[]; notes?: string }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };

/** Values I could establish verbatim. */
const AUTHORED: { slug: string; fu: number; note: string; ref?: string; summary: string }[] = [
  { slug: 'quinidine', fu: 0.228, ref: 'PMID:8471402',
    note: 'Verbatim, 8 healthy Thai males, IV 10 mg/kg, quinidine vs quinine head-to-head: "quinidine was less bound to plasma proteins (% free drug: 22.8 [15.4-47.2] vs 9.4 [7.3-15.0]%, P < 0.01)". Stated MEDIAN, not a computed midpoint. TWO CAVEATS: the range spans twofold, and binding is largely to alpha-1-acid glycoprotein, which RISES in the acute-phase response — so in the malaria patients this drug is used against, fu is lower than in these healthy volunteers and the correction stored here under-corrects.',
    summary: 'quinidine — fu 0.228 authored (verbatim median, healthy volunteers)' },
  { slug: 'quinine', fu: 0.094, ref: 'PMID:8471402',
    note: 'Verbatim, the same 8 healthy Thai males and the same head-to-head infusion: "(% free drug: 22.8 [15.4-47.2] vs 9.4 [7.3-15.0]%, P < 0.01)", quinine being the second figure. Stated MEDIAN. SAME CAVEATS AS THE QUINIDINE ARM: the range spans twofold, and alpha-1-acid glycoprotein rises in acute malaria, so fu in the treated population is lower than in these healthy volunteers.',
    summary: 'quinine — fu 0.094 authored (verbatim median, same study)' },
];

/** Examined, chased, and deliberately not authored. */
const DECLINED: { slug: string; note: string; summary: string }[] = [
  { slug: 'linagliptin',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. Verbatim: "Linagliptin exhibits concentration-dependent protein binding in human plasma in vitro (99% at 1 nmol/L to 75-89% at >30 nmol/L)" — saturation of binding to its own target, DPP-4. Its therapeutic steady-state Cmax is 11-12 nmol/L, SQUARELY INSIDE THAT TRANSITION, where fu moves from 0.01 to 0.11-0.25. No scalar is correct anywhere in the dosing range. The same source also describes "target-mediated nonlinear pharmacokinetics", which this one-compartment model cannot represent either.',
    summary: 'linagliptin — declined: binding saturates on its own target, inside the therapeutic range' },
  { slug: 'montelukast',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. Its own methods literature states outright that "only a range of fu can be reported with confidence because of uncertainty in the true equilibrium" for extensively bound, high-logD drugs. A scalar here would import a known measurement artefact and present it as a fact. Note the general hazard this is an instance of: above 98% bound, a one-point difference in the bound figure is a TWOFOLD difference in fu.',
    summary: 'montelukast — declined: its methods literature says only a range is reportable' },
  { slug: 'cortisol',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. From one paper own verbatim pairs, fu is 0.085 at 08:00 and 0.053 at 22:00 — A 1.6-FOLD SWING ACROSS AN ORDINARY DAY, before any stress response, because corticosteroid-binding globulin is near saturation at physiological concentrations. A third source gives 0.109 by a method that reads about 16% higher than equilibrium dialysis. For a hormone whose whole point is a diurnal rhythm, a single free fraction is not an approximation but a category error.',
    summary: 'cortisol — declined: fu swings 1.6x diurnally before any stress response' },
  { slug: 'mifepristone',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. Four independent abstracts establish that its alpha-1-acid glycoprotein binding SATURATES WITHIN the therapeutic range, so fu rises with dose exactly where the model would apply a constant. Separately, its metabolites circulate at concentrations similar to the parent while retaining receptor affinity, so even a correct parent fu would describe only part of the active material reaching the receptor.',
    summary: 'mifepristone — declined: AAG binding saturates within the therapeutic range' },
  { slug: 'irbesartan',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. Its own literature reports "a large discrepancy in protein binding between previously reported and the present experimental data, obtained from two different non-associated laboratories". When the primary sources disagree at that scale, picking one is a coin toss dressed as a measurement.',
    summary: 'irbesartan — declined: two independent laboratories disagree' },
  { slug: 'olanzapine',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. The widely circulated "90%" is ALBUMIN-ONLY: its source says "predominantly bound to albumin (90%) and alpha 1-acid glycoprotein (77%)" — two separate isolated-protein percentages, not total plasma binding, which is higher than either. Converting the albumin figure to a free fraction would overstate fu and therefore under-correct occupancy, and no total-binding figure was found.',
    summary: 'olanzapine — declined: the familiar 90% is albumin-only, not total binding' },
  { slug: 'progesterone',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. Every free-fraction figure found for this steroid is RAT. The catalogue permits animal PK where it is labelled, but an unlabelled animal free fraction silently rescales every occupancy curve on the record, and progesterone binding is dominated by corticosteroid-binding globulin and albumin whose concentrations differ substantially between species.',
    summary: 'progesterone — declined: every figure found is rat' },
  { slug: 'semaglutide',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED, AND THE CORRECTION MIGHT BE BACKWARDS. Its engineered C-18 fatty-acid chain binds albumin BY DESIGN — that binding is the 7-day half-life mechanism. Potency assays for acylated GLP-1 analogues are routinely run WITH 1-2% ALBUMIN PRESENT, precisely because of it, so the stored EC50 may already be albumin-shifted; dividing by fu would then DOUBLE-COUNT the same binding and under-predict occupancy roughly a hundredfold. The discovery paper does not state its assay albumin conditions, and basis in_vitro_ki silently assumes a protein-free assay.',
    summary: 'semaglutide — declined: fu correction may double-count designed albumin binding' },
  { slug: 'tirzepatide',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED, for the same reason as semaglutide. Its C-20 fatty diacid on Lys-20 binds albumin BY DESIGN and is the ~5-day half-life mechanism. Potency assays for acylated incretin analogues are routinely run with albumin present, so the stored EC50 may already be albumin-shifted and dividing by fu would double-count the same binding, under-predicting occupancy by roughly two orders of magnitude. Not merely unmeasurable — the correction could point the wrong way.',
    summary: 'tirzepatide — declined: same designed-albumin-binding double-count hazard' },
  { slug: 'retatrutide',
    note: 'EXAMINED AND DELIBERATELY NOT AUTHORED. THIS RECORD WAS NOT PART OF THE ORIGINAL FINDING AND IS INCLUDED BY EXTENSION, WHICH IS STATED RATHER THAN HIDDEN: the argument was made for semaglutide and tirzepatide, and this record own prose describes the same mechanism — "a C-20 fatty diacid linker on Lys(17) via a gammaGlu-2xOEG spacer that binds albumin, extending t half into once-weekly territory". Same engineered albumin anchor, same likelihood that a potency assay was run with albumin present, same risk that dividing by fu double-counts it.',
    summary: 'retatrutide — declined by EXTENSION of the acylated-peptide argument (flagged as mine)' },
];

for (const a of AUTHORED) {
  const c = need(a.slug);
  if (c.fraction_unbound != null) { log.push(`${a.slug} — fu already stored, skipped`); continue; }
  if (a.note.length > 600) throw new Error(`${a.slug} fu_note is ${a.note.length} chars`);
  c.fraction_unbound = a.fu;
  c.fu_note = a.note;
  if (a.ref) { c.refs ??= []; if (!c.refs.includes(a.ref)) c.refs.push(a.ref); }
  log.push(a.summary);
}
for (const d of DECLINED) {
  const c = need(d.slug);
  if (c.fraction_unbound != null) throw new Error(`${d.slug} HAS a fraction_unbound — this script would misdescribe it`);
  if (c.fu_note) { log.push(`${d.slug} — already recorded, skipped`); continue; }
  if (d.note.length > 600) throw new Error(`${d.slug} fu_note is ${d.note.length} chars (cap 600)`);
  c.fu_note = d.note;
  log.push(d.summary);
}

console.log(`\nfu decisions — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
