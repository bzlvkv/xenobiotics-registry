/**
 * 2026-09-08-pharmacological-batch11b.ts
 *
 * Batch 11, part B — eight more of the 24, decided without agents.
 *
 * ── CLASS 12 IS THE DOMINANT DEFECT IN THIS GROUP, IN FOUR VARIANTS ───────
 * Every one of these records pairs a volume with a half-life the volume does
 * not belong to, and in EVERY case the verbatim clearance that exposes it is in
 * the record's OWN citation:
 *
 *   trastuzumab   V1, the CENTRAL compartment of a 2-comp fit, welded to a
 *                 TERMINAL half-life — the worst version of the pairing.
 *                 3.13x under its own "0.225 L/day".
 *   remdesivir    Vc + Vp SUMMED (4.89 + 46.5 = 51.39) and stored as one
 *                 volume, exactly the upadacitinib shape. 1.95x over 18.1 L/h.
 *   esmolol       a half-life that is in NO arm of its citation (9 min against
 *                 a control 7.2), 1.53x over its own control clearance.
 *   epinephrine   1.33x under a clearance its citation states as an equation.
 *
 * ── AND ONE RECORD THE MODEL CANNOT CARRY, DIAGNOSED FROM ITS OWN LABEL ───
 * temsirolimus' stored source_label contains Cmax, AUC and t½. Those three
 * numbers give AUC/Cmax = 2.78 h against a floor of 24.96 h — 8.97x BELOW, so
 * NO ka, V OR F reproduces them. The everolimus verdict: preserve exposure,
 * pay on the peak, and say so. Both are whole-blood-referenced mTOR inhibitors
 * whose concentrations the solver labels plasma; that is now two records.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Dose { min: number; max: number; typical: number; unit: string }
interface Compound {
  slug: string; routes?: string[]; doses?: Record<string, Dose>;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>; pk_analyte?: string;
  pk_unauthored?: { reason: string; note?: string };
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const PATCH: { slug: string; routes: string[]; set: Record<string, unknown>; hl?: number; guard: (c: Compound) => boolean; note: string; summary: string }[] = [
  { slug: 'trastuzumab', routes: ['IV', 'SC'], guard: (c) => c.pk?.IV?.V_L === 2.95,
    set: { V_L: 9.25 },
    note: 'PK: THE WORST VERSION OF THE TWO-COMPARTMENT PAIRING — A CENTRAL VOLUME WELDED TO A TERMINAL HALF-LIFE. Its citation names the compartment explicitly: "Population estimates from the base model for clearance (CL) and volume of distribution of the CENTRAL COMPARTMENT (V1) of trastuzumab were 0.225 L/day, and 2.95 L, respectively. Estimated TERMINAL halflife (t1/2) based on the population estimate was 28.5 days." A Vss at least averages the two compartments; a V1 is only the first, so pairing it with the slowest phase understates clearance the most. THE RECORD ASSERTED 0.072 L/day AGAINST THAT ABSTRACT OWN 0.225 — 3.13-FOLD UNDER, with both numbers on the same line of the same sentence. The volume becomes the verbatim clearance over the rate the verbatim half-life implies, so exposure now reproduces the paper exactly. THE COST IS STATED: the modelled peak falls from about 142 to 45 mg/L, and the truth is between them — the one-compartment compromise every biologic in this catalogue faces, since a monoclonal antibody has a real and large distribution phase. Both routes move together, because the subcutaneous row shares this volume while carrying its own genuine bioavailability. THE DOSE BLOCK IS NOT TOUCHED: batch 8 already corrected it from a raw per-kilogram figure to the seventy-kilogram equivalent, and the subcutaneous 600 mg is a genuine flat dose.',
    summary: 'trastuzumab — V1 (central) welded to a terminal t½; 3.13x under its own verbatim CL' },

  { slug: 'remdesivir', routes: ['IV'], guard: (c) => c.pk?.IV?.V_L === 51,
    set: { V_L: 26.11 },
    note: 'PK: THE UPADACITINIB SHAPE — TWO COMPARTMENTS ADDED TOGETHER AND STORED AS ONE VOLUME. Its citation reports "central (and peripheral) volumes of distribution for remdesivir, GS-704277, and GS-441524 were 4.89 L (46.5 L), 96.4 L (8.64 L), and 26.2 L (66.2 L)", and the stored figure is the first pair SUMMED — 51.39 — which is a quantity that appears nowhere and is not what a one-compartment exposure model consumes. The same abstract states the clearance that settles it: "The estimated elimination clearances of remdesivir, GS704277, and GS-441524 reached 18.1 L/h, 36.9 L/h, and 4.74 L/h" — against a stored assertion of 35.4, NEARLY TWICE TOO FAST, so exposure rendered at half the truth. The volume becomes that verbatim clearance over the stored rate. THE HALF-LIFE IS DECLARED RATHER THAN DEFENDED: this abstract states none, so the stored one hour is unsourced by the record own citation, and it is kept because the roughly one-hour disappearance of the parent ester is the clinically salient feature of this drug and because changing it would change nothing about exposure. A LARGER STRUCTURAL POINT IS LOGGED: the analyte that matters therapeutically is the nucleoside metabolite, whose own verbatim clearance in the same sentence is nearly four times slower, and this record models only the parent.',
    summary: 'remdesivir — V was Vc+Vp summed; 1.95x over its own verbatim clearance' },

  { slug: 'esmolol', routes: ['IV'], guard: (c) => c.half_life_hr?.IV === 0.15,
    set: { V_L: 124.6 }, hl: 0.12,
    note: 'PK: A HALF-LIFE THAT IS IN NO ARM OF ITS OWN CITATION. That paper compares healthy controls with two dialysis groups and reports "Mean elimination half-life (t1/2) was 7.2 minutes in control subjects compared with 7.1 and 8.0 minutes for the hemodialysis and CAPD groups" — the stored nine minutes is none of the three. It also states the clearance the pairing has to satisfy, "total body clearance for esmolol was 171.4 +/- 69.8 ... ml/min/kg for the control", which at the seventy-kilogram reference is 720 L/h against a stored assertion of 1100 — HALF AGAIN TOO FAST. Both halves now come from the control arm: the verbatim control half-life, and the volume that the verbatim control clearance implies at that rate. The abstract says the volume "did not differ significantly among the three groups" but never prints it, so that number is DERIVED and is declared as such. TWO ITEMS ARE LOGGED RATHER THAN FIXED. The dose block holds 50 to 300 with a typical of 100 MICROGRAMS, and those are the mcg/kg/MIN INFUSION RATES from this drug label — a rate, not a dose, exactly the remifentanil case, and the schema has no unit for it; as stored the model is dosing roughly three ten-thousandths of the real amount. And the active metabolite has a half-life two orders of magnitude longer than the parent, "more than 42 hours compared with only 4 hours in the control subjects", and has no record.',
    summary: 'esmolol — t½ 9 min is in no arm of its citation; the control arm is 7.2' },

  { slug: 'epinephrine', routes: ['IV'], guard: (c) => c.pk?.IV?.V_L === 8,
    set: { V_L: 10.69 },
    note: 'PK: MY HOMEOSTATIC PRIOR IS REFUTED — THE CITATION ARGUES THE OPPOSITE, VERBATIM. I expected an endogenous catecholamine with a strong basal concentration to belong with the minerals in the unauthored class. Its source concludes "Epinephrine pharmacokinetics is linear in septic shock patients, without any saturation at high doses" and explicitly checked the basal question: "Basal neurohormonal status does not influence epinephrine pharmacokinetics." A dosed first-order curve is the right object here, and the record keeps it. The defect is smaller and ordinary: that paper states its clearance as an equation, "CL (L/hr) = 127 x (BW/70)0.60 x (SAPS II/50)-0.67", which at this catalogue seventy-kilogram reference and the score the equation is centred on is 127 L/h, against a stored assertion of 96 — a third too slow. The half-life is verbatim, "The corresponding half-life was 3.5 minutes", so the volume moves to the one that clearance implies at that rate. TWO CAVEATS TRAVEL WITH IT: the cohort is septic-shock patients under steady-state infusion, not healthy volunteers, and an intramuscular route is declared with a dose but NO parameters, so the autoinjector dose the record carries yields no curve at all.',
    summary: 'epinephrine — 1.33x under a clearance its citation states as an equation; NOT homeostatic' },

  { slug: 'temsirolimus', routes: ['IV'], guard: (c) => c.pk?.IV?.V_L === 172,
    set: { V_L: 383.5 },
    note: 'PK: DIAGNOSED ENTIRELY FROM THE NUMBERS ALREADY WRITTEN IN ITS OWN SOURCE LABEL, WHICH TURN OUT TO BE MUTUALLY UNSATISFIABLE. That label string records a peak of 585 ng/mL, an exposure of 1627 ng·h/mL and a half-life of 17.3 hours. THOSE THREE GIVE AN EXPOSURE-TO-PEAK RATIO OF 2.78 HOURS AGAINST A FLOOR OF 24.96 — NEARLY NINE-FOLD BELOW — so no absorption rate, volume or bioavailability reproduces them; the drug has a distribution phase this model has no slot for. The stored volume is additionally labelled a Vss, which is the wrong volume for a model whose exposure must close, and the pair asserted a clearance of 6.9 L/h against the 15.4 the label own dose and exposure imply — 2.23-FOLD UNDER, while the peak simultaneously rendered four-fold LOW. Errors in opposite directions, so nothing fixes both. The everolimus verdict applies: PRESERVE EXPOSURE AND PAY ON THE PEAK, declared rather than discovered later. THAT MAKES TWO WHOLE-BLOOD-REFERENCED mTOR INHIBITORS whose concentrations the solver labels plasma — the same latent trap, now a pattern rather than an incident. AND THE ACTIVE METABOLITE IS ABSENT: this record models the parent, which its analyte field correctly declares, while sirolimus carries much of the activity and has a far longer half-life.',
    summary: 'temsirolimus — its own label numbers fail the floor 8.97x; exposure preserved, peak paid' },
];
for (const p of PATCH) {
  const c = need(p.slug);
  if (!p.guard(c)) { log.push(`${p.slug} — already corrected, skipped`); continue; }
  for (const r of p.routes) {
    const row = c.pk?.[r];
    if (!row) throw new Error(`${p.slug} has no pk.${r}`);
    Object.assign(row, p.set);
    if (p.hl != null) { c.half_life_hr ??= {}; c.half_life_hr[r] = p.hl; }
  }
  note(c, p.note);
  log.push(p.summary);
}

// ── paclitaxel: a per-m2 dose and a volume computed at a DIFFERENT body surface ──
{
  const c = need('paclitaxel');
  const dose = c.doses?.IV;
  if (dose && dose.typical === 175 && c.pk?.IV?.V_L === 99) {
    dose.min = 138; dose.max = 303; dose.typical = 303;
    c.pk.IV.V_L = 95.15;
    note(c, 'PK: A PER-SQUARE-METRE DOSE ENTERED AS FLAT MASS, AND A VOLUME SCALED AT A DIFFERENT BODY SURFACE THAN THE DOSE. Its citation states every dose and the volume in per-square-metre units — "half-lives of the first and second phases after a 275 mg/m2 dose were 0.32 and 8.6 h" and "The apparent volume of distribution was 55 liters/m2" — while the record stored the raw dose numerals as milligrams and a volume of 99 L, which is that verbatim figure scaled at 1.8 square metres. THE TWO USED DIFFERENT BODIES. Both now use 1.73, the same reference doxorubicin was corrected to. THE ONE VERBATIM CONCENTRATION IN THAT ABSTRACT CONFIRMS THE DIRECTION: it reports a peak "with a dose of 275 mg/m2 ... approximately 8 microM", which the corrected convention reproduces to within 1.4-fold where the stored one was 2.5-fold low. TWO CAVEATS ARE FLAGGED AND NOT ACTED ON: the half-life kept is the terminal one of a profile the same sentence calls biphasic, which is the class-12 shape even though the abstract offers no clearance to test it against; and this drug is widely described as having vehicle-mediated non-linear disposition, which this abstract does not state and which I therefore do not assert.');
    log.push('paclitaxel — dose 80/175/175 → 138/303/303 mg (mg/m² × 1.73) and V 99 → 95.15 (same BSA)');
  } else { log.push('paclitaxel — already corrected, skipped'); }
}

// ── phenibut: the stored F traces to a RAT study of a different salt ──
{
  const c = need('phenibut');
  if (!c.pk_unauthored) {
    delete c.pk;
    c.half_life_hr = {};
    c.pk_unauthored = { reason: 'uncharacterized', note: 'The cited paper is a Russian-language BIOEQUIVALENCE abstract that reports no numbers at all — it concludes only that two formulations "are bioequivalent in terms of pharmacokinetics". No indexed abstract gives a human phenibut half-life, volume or bioavailability; the nearest figure, "Absolute bioavailability was 64%", is from a RAT study of a different salt.' };
    note(c, 'PK: STRIPPED. THE CITED PAPER REPORTS NO NUMBER OF ANY KIND — it is a Russian-language bioequivalence abstract whose entire finding is that two formulations of the same manufacturer "are bioequivalent in terms of pharmacokinetics", which is a statement about a RATIO and not a parameter. So both stored values are class 1. AND THE BIOAVAILABILITY HAS A TRACEABLE AND DISQUALIFYING ORIGIN: the only close figure in the indexed literature is "Absolute bioavailability was 64%", from a study whose own abstract says the distribution volume "only slightly surpassed the volume of extracellular body fluids IN RAT" — a rat study, of a citrate derivative rather than of phenibut itself. That is a species misattribution stacked on a compound misattribution, and it matches the stored value to within a percent. A systematic review of the clinical literature was checked for a replacement and reports case series and trials, not disposition parameters. The record is stripped rather than left asserting the solver defaults, which is the error this batch was opened by.');
    log.push('phenibut — STRIPPED to uncharacterized (its F 0.65 traces to a RAT study of a different salt)');
  } else { log.push('phenibut — already unauthored, skipped'); }
}

// ── 5-fluorouracil: recorded, not changed ──
{
  const c = need('5-fluorouracil');
  note(c, 'PK: THE HALF-LIFE IS A RANGE INTERIOR AND THE VOLUME IS UNSOURCED, BUT THE PAIR SURVIVES ITS ARITHMETIC. Its citation is a review that states "an apparent terminal half-life of approximately 8 to 20 minutes" and NO volume and NO clearance, so the stored 13.8 minutes is an interior pick close to the midpoint and the volume is class 1. The clearance the pair implies is high, which is the right qualitative shape for a drug the same abstract says is eliminated by "swift catabolism of the liver", and I found no verbatim absolute clearance to test it against — so the check is DECLARED AS NOT RUN rather than reported as passed. ONE CAVEAT IS FLAGGED AND DELIBERATELY NOT ASSERTED: this drug is widely described as having saturable, dose-dependent elimination, which would make a single first-order half-life structurally wrong, and its own cited review does not say so — so the concern is recorded and no rate constant is invented on the strength of it.');
  log.push('5-fluorouracil — t½ is a range interior, V unsourced; recorded, arithmetic untestable');
}

console.log(`\nbatch 11b — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
