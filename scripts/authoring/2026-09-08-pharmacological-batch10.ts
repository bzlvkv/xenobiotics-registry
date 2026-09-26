/**
 * 2026-09-08-pharmacological-batch10.ts
 *
 * Tenth batch of the pharmacological category: 40 compounds, eight agents.
 * This batch completes the pharmacological sweep of records carrying PK.
 *
 * ── A WHOLE DATA REGION ACQUITTED BY ARITHMETIC ────────────────────────
 * 53 records claim a FITTED keo (no `approximated` flag) and the field had never
 * been audited. I hypothesised a systematic factor-of-60 error, since this
 * literature reports keo PER MINUTE and the registry stores PER HOUR.
 * THE HYPOTHESIS IS REFUTED, twice independently and by my own census: every
 * value checked is exactly 60x a published per-minute figure, and converting all
 * 53 to equilibration half-times gives a distribution ORDERED CORRECTLY BY DRUG
 * CLASS — anaesthetics at seconds to minutes, neuromuscular blockers at 7-12
 * minutes, opioids at 3-7 with morphine an order of magnitude slower for the
 * right reason, oral cardiovascular drugs at hours.
 * BUT THE UNITS ARE THE ONLY THING THAT SURVIVES. Of the ten fitted keos audited
 * here, four are genuinely fitted, four are derived from a review or a half-time,
 * one cites a paper that says the value was "ASSUMED", and one is a two-compartment
 * effect-site parameter lifted into a single-compartment slot.
 *
 * ── AND A REVERSAL OF ONE OF MY OWN EARLIER FIXES ──────────────────────
 * Batch C2 replaced fosinopril V_L 26 -> 5.85 L because 5.85 is verbatim and 26
 * "appears nowhere". THE VERBATIM NUMBER IS THE WRONG KIND OF VOLUME — a Vss from
 * a multi-compartment fit, where the one-compartment surrogate is Vz — and the
 * record has been over-predicting exposure 5.8x ever since. The deleted 26 sits
 * inside the band three independent routes converge on. Verbatim-ness is not
 * sufficient; the quantity has to be the one the model consumes.
 *
 * ── THE STRONGEST FEASIBILITY TEST YET, AND IT NEEDS NO HALF-LIFE ──────
 * AUC/Cmax = e^(ke*tmax)/ke is minimised over ke at ke = 1/tmax, so
 *      AUC/Cmax >= e * tmax
 * from Cmax, AUC and Tmax alone. A published triple violating it cannot be
 * reproduced at ANY parameter choice, so it cannot be argued away by proposing a
 * different half-life. It independently CONFIRMED lovastatin's analyte choice:
 * the lactone arm is representable and the acid arm is not, at any parameters.
 *
 * ── THE DOSE DEFECT, SHARPENED BY A CHALLENGE ──────────────────────────
 * An agent argued the per-kg finding might be reading a SCHEMA GAP as a data
 * defect, since DoseUnit has no mg/kg and flat mass at the 70 kg reference is the
 * only representable option. I TESTED IT AND THE DISTINCTION IS CLEAN:
 * vancomycin stores 1000 mg against 15 mg/kg x 70 = 1050 — the equivalent, and
 * CORRECT; meropenem is genuinely flat-dosed. My prior was wrong on both.
 * Eleven records store the RAW per-kg number instead: propofol 2 (should be 140),
 * thiopental 4 (280), atracurium 0.5 (35), vecuronium 0.1 (7), etomidate 0.3 (21),
 * ketamine 1 (70), rocuronium 1 (70), succinylcholine 1.5 (105), cyclosporine
 * 6.67 (467), ganciclovir 5 (350), infliximab 5.33 (373). The six in this batch
 * are fixed; the rest are logged.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Occ { receptor?: string; ec50_mg_l?: number; emax?: number; hill_n?: number; basis?: string; source_pmid?: string; note?: string; [k: string]: unknown }
interface Dose { min: number; max: number; typical: number; unit: string }
interface Interaction { slug?: string; kinetics?: { ki_uM?: number; mbi?: boolean; [k: string]: unknown }; note?: string; [k: string]: unknown }
interface Compound {
  slug: string; routes?: string[]; doses?: Record<string, Dose>; mw_g_mol?: number;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  pk_analyte?: string; pk_analyte_name?: string;
  effect_compartment?: { keo_per_h?: number; approximated?: boolean; source_pmid?: string; source_species?: string; note?: string; [k: string]: unknown };
  receptor_occupancy?: Occ[];
  interactions?: Interaction[];
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

/** Whole-block PK replacements. */
const FIXES: { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'sufentanil', guard: (c) => c.pk?.IV?.V_L === 120,
    pk: { IV: { V_L: 203, F: 1, source_pmid: 'PMID:6238552' } },
    hl: { IV: 2.73 }, refs: ['PMID:1670913'],
    note: 'PK: THE RECORD TOOK THE WRONG VOLUME FROM A SENTENCE THAT OFFERS BOTH. Its citation states "Vd beta was 2.9 +/- 0.2 1/kg, Vdss 1.7 +/- 0.2 1/kg and total plasma clearance 12.7 +/- 0.8 ml X kg-1 X min-1 (935 +/- 50 ml/min)", and the steady-state volume was stored where THE TERMINAL VOLUME IS THE ONE THAT BELONGS WITH A TERMINAL HALF-LIFE. The consequence was a clearance 1.84x below that paper own figure, and the severity was visible without any arithmetic: the model retained 88% of its initial concentration at thirty minutes where the same paper reports "98% of the administered dose having left the plasma within 30 min". THE EFFECT-SITE CONSTANT WAS ALSO DERIVED FROM A NARRATIVE REVIEW rather than measured — that review says only "each with equilibration half-lives of about 6 min", and computing a rate from an approximation violates the verbatim rule twice over. The primary measurement exists and is close: "The half-time of blood-brain equilibration (T1/2Keo) was not statistically different between sufentanil and fentanyl (6.2 +/- 2.8 vs. 6.6 +/- 1.7 min)". The stored value was 3.3% from the truth, which is recorded as a near-miss. Its phantom absorption rate on an intravenous route is removed, and an intramuscular route declared with no parameters goes with it.',
    summary: 'sufentanil — stored the Vss where its own sentence offers the terminal volume; 1.84x' },

  { slug: 'vecuronium', guard: (c) => c.pk?.IV?.V_L === 18,
    pk: { IV: { V_L: 64.3, F: 1, source_pmid: 'PMID:1348166' } },
    hl: { IV: 2.22 }, refs: ['PMID:1348166', 'PMID:2875724'],
    note: 'PK: ITS CITATION IS AN EFFECT-COMPARTMENT PAPER THAT STATES NO VOLUME, NO HALF-LIFE AND NO CLEARANCE. Neither stored value appears in any source I could find, and the half-life sits between the two real ones like a midpoint. The stored pair implied a clearance BELOW EVEN THE CHOLESTASIS GROUP of this record own other reference, which reports the healthy value falling "from 4.30 +/- 1.56 ml min-1 kg-1 ... to 2.36 +/- 0.80" — the record asserted 1.98, i.e. 2.2x under the healthy figure. Everything moves to one adult abstract at this record exact dose whose three numbers are mutually consistent to five percent: "total volume of distribution (791 +/- 303 versus 919 +/- 360 mL/kg IBW), plasma clearance (4.65 +/- 0.89 versus 5.02 +/- 1.13 mL.min-1.kg IBW-1), and elimination half-life (119 +/- 43 versus 133 +/- 57 min)", control arm. A CAVEAT IS STATED RATHER THAN BURIED: that volume is a terminal one, so the fix preserves EXPOSURE at the cost of the early peak, where the true central volume is some twenty times smaller — AND FOR A NEUROMUSCULAR BLOCKER THE ONSET PHASE IS THE CLINICALLY LIVE ONE. Its effect-site constant is verified verbatim and untouched.',
    summary: 'vecuronium — its citation is a keo-only paper; both PK values appear in no source' },

  { slug: 'sitagliptin', guard: (c) => c.half_life_hr?.PO === 10.4,
    pk: { PO: { V_L: 266, F: 0.87, source_pmid: 'PMID:22173280' } },
    hl: { PO: 7.4 }, refs: ['PMID:22173280', 'PMID:17575559', 'PMID:17220239'],
    note: 'PK: THE FEASIBILITY TEST NAMES THE GUILTY PARAMETER, AND IT IS NOT THE VOLUME. Three independent routes agree the record over-predicts exposure 1.91x — a bioavailability-corrected clearance of 28.69 L/h, a renal clearance route giving 29.1, and a verbatim exposure giving 27.6, against a stored 15.02. The obvious repair is to raise the volume, and THE Cmax-OVER-AUC IDENTITY FORBIDS IT: the verbatim quartet "AUC(0-inf) (3,621 +/- 222.5 ... ng h/ml)... C(max) (282.9 +/- 7.7 ... ng/ml)... t(1/2) (7.4 +/- 0.6 ... h)" gives an exposure-to-peak ratio of 12.80 h, which passes the floor at a 7.4 h half-life and FAILS IT at the stored 10.4 — so raising the volume would fix exposure and destroy the peak. The half-life moves instead, to a verbatim value, and the volume follows from a verbatim clearance at that half-life. The stored bioavailability is verbatim in a paper with a real intravenous arm and is untouched, which also acquits class 6. A SPECULATION IS RECORDED AS UNPROVEN: the only near-10 h sitagliptin half-life indexed is the GEMFIBROZIL-INHIBITED ARM of the very study now cited, whose control is 7.4 — the same control-versus-treated confusion found on pioglitazone — but 10.4 is not 10.0, so the path is not established.',
    summary: 'sitagliptin — the identity forbids the obvious fix; the half-life was guilty, not V' },

  { slug: 'glimepiride', guard: (c) => c.half_life_hr?.PO === 8.2,
    pk: { PO: { ka_hr: 1.5, V_L: 8.8, F: 1, source_pmid: 'PMID:8960852' } },
    hl: { PO: 2.35 }, refs: ['PMID:8960852', 'PMID:12369756', 'PMID:20110017'],
    note: 'PK: AN INTRAVENOUS VOLUME MARRIED TO AN ORAL TERMINAL HALF-LIFE, AND THE FEASIBILITY TEST IS DECISIVE. The half-life is verbatim and is a stated mean, but pairing it with the label volume asserts a clearance of 12.4 mL/min against a verbatim "Mean relative total clearance and mean volume of distribution of both single ... (41.6 ml/ min and 8.47 litres, respectively, when creatinine clearance was above 50 ml/min)" — AND THAT VERBATIM PAIR ITSELF IMPLIES A HALF-LIFE OF 2.35 h, NOT 8.2. The record own citation agrees independently. THE HARD PART IS THAT NO RESCALING FIXES IT: its exposure-to-peak ratio of 4.05 h sits against a floor of 11.83 h at the stored half-life, and reaching that floor would require two thirds of all exposure to arrive beyond twenty-four hours, which is impossible over fewer than three half-lives. As stored the model renders the peak 43% LOW while exposure is twice HIGH — errors in opposite directions, so no change to volume or bioavailability can satisfy both. The half-life moves and the volume stays. THE BIOAVAILABILITY IS RIGHT AND MUST NOT BE TOUCHED: "The tablet formulation of glimepiride is completely bioavailable." CAVEAT AGAINST MYSELF: the replacement cohort is diabetics with mild renal impairment, not healthy volunteers, but the record own citation corroborates both direction and magnitude.',
    summary: 'glimepiride — 2-3.4x over; its own verbatim pair implies 2.35 h, not 8.2' },

  { slug: 'moclobemide', guard: (c) => c.pk?.PO?.V_L === 84,
    pk: { PO: { V_L: 80.7, F: 0.9, source_pmid: 'PMID:3665338' } },
    hl: { PO: 2 }, refs: ['PMID:3665338', 'PMID:2248087'],
    note: 'PK: A THREE-STATE RECORD ASSEMBLED FROM ONE PAPER. Its cited review contains no numeral at all, and every stored value traces instead to a study that was never cited: "clearance, 39.4 (15%) and 29.1 (12%) L/hr; elimination half-life, 1.60 (15%) and 2.00 (18%) hours; and volume of distribution at steady state, 84.3 (11%) and 80.7 (15%) L. The absolute oral bioavailability increased from 0.56 after the first oral dose to 0.86 and 0.90". THE VOLUME WAS THE DRUG-NAIVE FIRST INFUSION, THE HALF-LIFE WAS AFTER FIFTEEN DAYS OF DOSING, AND THE BIOAVAILABILITY WAS NEITHER. All three now come from the steady state, which is the clinically relevant one for a drug taken daily. MOCLOBEMIDE IS NOT A CARBAMAZEPINE AND MUST NOT BE STRIPPED: its ELIMINATION parameter moves only 1.25-fold on repeated dosing, squarely in the band that kept efavirenz and rifabutin, even though total exposure moves about threefold — "Mean accumulation factors for moclobemide during the first week were 1.85 for Cmax and 3.0 for AUC ... higher than predicted from single-dose characteristics". THAT IS REPRESENTABLE HERE BECAUSE THE SOLVER HAS SEPARATE BIOAVAILABILITY AND ELIMINATION SLOTS, where carbamazepine had to put the whole effect on one. The record fails the peak-to-exposure floor by 1.77x and preserves exposure; the previous mix landed the peak within 17% only because a steady-state bioavailability was being applied to a single dose.',
    summary: 'moclobemide — V from the naive state, t½ from steady state, F from neither' },

  { slug: 'fosinopril', guard: (c) => c.pk?.PO?.V_L === 5.85,
    pk: { PO: { V_L: 27.3, F: 0.22, source_pmid: 'PMID:11563407' } },
    hl: { PO: 17.4 }, refs: ['PMID:9549638'],
    note: 'PK: THIS REVERSES ONE OF MY OWN EARLIER FIXES, AND THE LESSON IS THAT VERBATIM IS NOT SUFFICIENT. An earlier pass replaced a volume of 26 L with the verbatim 5.85 from "a Vss of 5,850 +/- 2,780 mL", calling 26 a 4.4-fold error that appeared nowhere. THE VERBATIM NUMBER IS THE WRONG KIND OF VOLUME: that abstract fits a multi-compartment intravenous profile, and the one-compartment surrogate is the terminal volume, not the steady-state one. THE RECORD HAS BEEN OVER-PREDICTING EXPOSURE 5.8x EVER SINCE, against that same paper own verbatim oral exposure — where the deleted 26 was 1.30x. Three independent routes converge on twenty to twenty-seven litres and the deleted value sat inside that band. The replacement is the paper own verbatim clearance divided by the rate its own verbatim half-life implies. A SECOND FINDING IS RECORDED RATHER THAN ACTED ON: the stored bioavailability is verbatim but is a MOLAR figure, and the solver multiplies dose by it as MASS — with a prodrug dose and a metabolite analyte the correct mass factor is nearer 0.157. AND THE FEASIBILITY BOUND FAILS IN ITS STRONGEST FORM: the published exposure-to-peak ratio of 8.92 h sits below e times the peak time, 10.87 h, which no half-life whatsoever can satisfy — the only escape is an absorption lag, physically sensible for an ester requiring hydrolysis.',
    summary: 'fosinopril — REVERSES my own C2 fix; the verbatim value was the wrong kind of volume' },
];

for (const f of FIXES) {
  const c = need(f.slug);
  if (!f.guard(c)) { log.push(`${f.slug} — already re-sourced, skipped`); continue; }
  const dropped = Object.keys(c.pk ?? {}).filter((r) => !(r in f.pk));
  c.pk = f.pk;
  c.half_life_hr = f.hl;
  if (dropped.length) {
    c.routes = (c.routes ?? []).filter((r) => !dropped.includes(r));
    for (const r of dropped) if (c.doses && r in c.doses) delete c.doses[r];
  }
  if (f.refs?.length) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary + (dropped.length ? ` [route(s) removed: ${dropped.join(', ')}]` : ''));
}

/** Field-level edits: set/delete individual pk keys, optionally the half-life. */
const PATCH: { slug: string; route: string; set?: Record<string, unknown>; del?: string[]; hl?: number; guard: (c: Compound) => boolean; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'flumazenil', route: 'IV', guard: (c) => c.half_life_hr?.IV === 0.7,
    set: { V_L: 90.8, source_pmid: 'PMID:2044332' }, hl: 1.17, refs: ['PMID:2044332'],
    note: 'PK: BOTH STORED NUMBERS CAME FROM RANGES, AND ONLY ONE OF THEM MATTERED. The volume was the midpoint of "apparent distribution volume 0.6-1 kg" (sic, L/kg) and the half-life was the LOW ENDPOINT of "the short half-life of 0.7-1.3 h" — but the PAIRING SURVIVED ITS ARITHMETIC WITH ROOM, implying 55.5 L/h against that same review "high plasma and blood clearance of 520-1300 ml min-1" and within 3% of a verbatim 53.8. RECORDED SO NOBODY REWRITES A PASSING CLEARANCE. The half-life is the defect, and IT ERRED IN THE DANGEROUS DIRECTION: 0.7 h UNDERSTATES RE-SEDATION, which is this drug entire clinical hazard. Both replacements are verbatim in one twelve-volunteer study — "total body clearance, 53.8 +/- 1.2 L/h ... and elimination half-life, 70.2 +/- 9.9 min" — and the volume is that clearance over that rate, so the passing clearance is preserved exactly while the duration lengthens 1.67-fold. A DEEPER LIMIT IS RECORDED, NOT PAPERED OVER: the same abstract gives "initial volume of distribution, 16 +/- 5.7L ... distribution half-life, 4.1 +/- 1.3 min", so the model initial concentration is roughly a third of the true one — AND FOR A REVERSAL AGENT WITH A ONE-TO-TWO-MINUTE ONSET THE DISTRIBUTION PHASE IS THE DRUG. On the antagonism question: the occupancy row models flumazenil alone with no benzodiazepine term, which is INCOMPLETE RATHER THAN WRONG, since what matters clinically is the fraction of the site flumazenil holds.',
    summary: 'flumazenil — t½ was a range floor understating re-sedation; V moves with it to hold CL' },

  { slug: 'thiopental', route: 'IV', guard: (c) => c.pk?.IV?.source_pmid === 'PMID:8563444',
    set: { source_pmid: 'PMID:7235274' }, del: ['ka_hr'],
    note: 'PK: A REAL ACQUITTAL WITH ENTIRELY BROKEN PROVENANCE. The stored pair passes its clearance test to two percent, and NEITHER NUMBER APPEARS IN THE PAPER IT CITED — an EEG study that states no volume and no half-life. Both live in a reference this record already carried: "volume of distribution at steady state 97.5 l ... elimination half-life 11.5 h ... and systemic plasma clearance 0.150 l/min". The stored volume matches NEITHER the steady-state 97.5 NOR the terminal 233, and is almost exactly clearance over the terminal rate — THE CORRECT ONE-COMPARTMENT VOLUME FOR THE STORED HALF-LIFE. SOMEBODY DERIVED IT PROPERLY AND HUNG IT ON THE WRONG PMID; the fix is the citation, not the number. A NARROWER READING OF THE BINDING ACQUITTAL IS ALSO RECORDED: the fraction-unbound note calls saturation excluded, while this record own other reference says "the plasma protein binding of thiopental was CONCENTRATION DEPENDENT ... saturation of binding sites on rapid administration ... may occur" — the linearity finding covers roughly 7-93 ug/mL and the non-linearity appears near 150, which is exactly the post-bolus peak. The acquittal holds for an infusion and not for the induction bolus.',
    summary: 'thiopental — passes to 2% with both values on the wrong PMID; citation repaired' },

  { slug: 'remifentanil', route: 'IV', guard: (c) => 'ka_hr' in (c.pk?.IV ?? {}),
    del: ['ka_hr'],
    note: 'PK: THE RECORD HAS SANDED OFF A SIGNATURE IT SHOULD PRESERVE. Its own reference states "Total clearance (250-300 l/h) ... approximately three to four times greater than the normal hepatic blood flow" — the fact that makes this drug what it is — and the stored pair implies 131 L/h, HALF OF IT. The volume is an in-range pick rather than a verbatim value (0.39 L/kg gives 27.3; another source offers "25-40 l"), and the parameterisation PRESERVES ONSET AND OFFSET WHILE SACRIFICING EXPOSURE TWO-FOLD. FOR AN AGENT GIVEN BY INFUSION AND TITRATED TO EFFECT THAT IS ARGUABLY THE RIGHT TRADE, AND IT WAS ENTIRELY UNDOCUMENTED; it is now declared rather than corrected. TWO SEPARATE ITEMS ARE LOGGED RATHER THAN FIXED: the stored typical dose of 0.25 mcg is A mcg/kg/min INFUSION RATE AND NOT A DOSE AT ALL, which the schema cannot express; and its phantom absorption constant on an intravenous route is removed here.',
    summary: 'remifentanil — 2x clearance trade preserved but now declared; dead ka removed' },

  { slug: 'alfentanil', route: 'IV', guard: (c) => 'ka_hr' in (c.pk?.IV ?? {}),
    del: ['ka_hr'],
    note: 'PK: IT PASSES ITS ARITHMETIC ONLY BECAUSE ITS HALF-LIFE IS MISATTRIBUTED. The volume is verbatim in the cited paper; the half-life IS NOT IN THAT ABSTRACT, which says "97 +/- 52 minutes" — 1.617 h, not 1.5. The 1.5 comes from a different paper already carried in this record references, whose control arm ALSO supplies the clearance the record is then checked against, so the pass is partly circular. Numbers untouched, provenance stated. A CONFLICT IS RECORDED AND NOT RESOLVED: the stored fraction unbound of 0.093 disagrees 1.9-fold with this record own intravenous source, which reports "fu was 0.18 +/- 0.08". An intramuscular route declared with no parameters at all is removed, as is a phantom absorption constant on an intravenous one.',
    summary: 'alfentanil — half-life belongs to a different paper than the volume; disclosed' },

  { slug: 'atracurium', route: 'IV', guard: (c) => c.pk?.IV?.source_pmid === 'PMID:11144993',
    set: { source_pmid: 'PMID:6687550' }, del: ['ka_hr'], refs: ['PMID:6687550'],
    note: 'PK: THE CLEANEST PK ROW IN THIS AUDIT, ATTACHED TO THE WRONG PAPER. The cited study reports "volume of distribution and plasma clearance were 217 ml/kg and 550 ml/min" and a half-life "averaged 22 minutes" — none of which is what the record stores. The stored values are verbatim in a paper it never cited: "19.9 min (+/- 0.6) for the elimination half-life (T1/2 beta), 5.5 ml min-1 kg-1 (+/- 0.2) for total clearance (Cl) and 157 ml kg-1 (+/- 7) for total distribution VOLUME (Varea)". AND IT IS THE TEXTBOOK-CORRECT PAIRING — a Varea, NOT a Vss, married to a terminal half-life is exactly what a one-compartment exposure model needs — so the implied clearance reproduces that paper own stated figure to two significant figures. Fix the citation and touch nothing else.',
    summary: 'atracurium — arithmetically perfect and cited to a paper containing none of it' },

  { slug: 'dolutegravir', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 0.5,
    set: { ka_hr: 2.24, lag_hr: 0.263, V_L: 17.4, source_pmid: 'PMID:25819132' }, hl: 13.4,
    refs: ['PMID:25819132'],
    note: 'PK: THE ELEVENTH ANTIVIRAL WHOSE CITATION SUPPORTS NONE OF ITS NUMBERS — and the arithmetic was sound anyway, so only the provenance and the absorption were wrong. Its old citation states one PK constant, "The half-life was approximately 15 h", which CONTRADICTED the value stored beside it. The absorption rate was the catalogue second-most-common value, shared with two dozen unrelated records, and implied a peak at 5.1 h against a published two to three. ALL FOUR REPLACEMENTS COME FROM A SINGLE SENTENCE OF ONE POPULATION ANALYSIS: "Population estimates for apparent clearance, apparent volume of distribution, absorption rate constant and absorption lag time were 0.901 l h(-1), 17.4 l, 2.24 h(-1), and 0.263 h" — with the lag, the apparent peak lands at 2.0 h. The half-life is the one the volume and clearance in that sentence jointly imply, so all four parameters now come from one fit of one cohort. BIOAVAILABILITY OF 1 IS VERIFIED, NOT ASSUMED: no intravenous dolutegravir exists and absolute bioavailability has never been established, so every published figure is already an apparent one and pinning F prevents dividing by it twice.',
    summary: 'dolutegravir — all four parameters replaced from one verbatim population sentence' },

  { slug: 'venetoclax', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 0.15,
    set: { ka_hr: 0.38, source_label: 'FDA label: Venclexta (venetoclax) — 400 mg PO qd with a low-fat meal at steady state, V/F within the label 256–321 L range. t½ 17 h is NOT the label figure (the label says ~26 h) but an interior pick from PMID:27558232; ka is derived from a verbatim Tmax 5–8 h.' },
    note: 'PK: A LABEL CITATION THAT ATTRIBUTES TO THE LABEL A NUMBER THE LABEL CONTRADICTS. The stored half-life is presented as a Venclexta label value and THE LABEL SAYS ABOUT TWENTY-SIX HOURS; the stored figure is a pick from inside a cited range, "ranged between 14.1 and 18.2 hours at different doses", and two other verbatim means exist that are neither. THE NUMBER IS KEPT AND THE ATTRIBUTION IS FIXED, because the label three exposure figures are mutually inconsistent in one compartment by a factor of 1.59 and the shorter half-life is what makes exposure close — which is precisely why it was picked. The absorption rate is the real defect: it implied a peak at 11.9 h against a verbatim "Venetoclax peak exposures were achieved at 5 to 8 hours under low-fat conditions" and under-predicted the peak roughly two-fold. The apparent volume is back-derived but LANDS INSIDE THE LABEL OWN STATED RANGE, so it is a near-miss and must not be corrected. MY ABIRATERONE COMPARISON IS REFUTED: the food effect is real and roughly four-fold, but the label MANDATES food and this record already declares the low-fat fed state, so a single fed-state parameterisation IS the clinically realised one — unlike abiraterone, where the label instruction and the food effect pull apart.',
    summary: 'venetoclax — t½ attributed to a label that says otherwise; ka 2.5x too slow' },

  { slug: 'edoxaban', route: 'PO', guard: (c) => c.pk?.PO?.V_L == null,
    set: { V_L: 349, source_pmid: 'PMID:26620048' }, refs: ['PMID:26620048'],
    note: 'PK: A TEN-FOLD ERROR THAT NO CITATION CHECK COULD EVER HAVE FOUND, BECAUSE THE FIELD WAS ABSENT RATHER THAN WRONG. With no volume the solver silently substitutes half a litre per kilogram, and at this half-life that asserts a clearance of 2.21 L/h against a verbatim "total clearance is approximately 22 L/h". STORING THE OTHER VERBATIM NUMBER IN THE SAME SENTENCE DOES NOT FIX IT: "the steady-state volume of distribution is approximately 107 L" still leaves the model three-fold slow, because a steady-state volume is not the quantity a one-compartment exposure model consumes. The value stored is that verbatim clearance divided by the rate the stored half-life implies. The bioavailability was verbatim but MISATTRIBUTED — its stated source reports "relative bioavailability (F 1) was estimated as 67.2 %", a different quantity and a different number — so the citation moves to the paper that actually says 62 percent. The half-life itself is an interior pick from ranges that no source states as a point, and the absorption rate remains a disclosed back-derivation from a range midpoint, both left as they are and declared.',
    summary: 'edoxaban — no V_L at all, so the silent default ran 10x slow; invisible to citation checks' },

  { slug: 'lovastatin', route: 'PO', guard: (c) => c.pk?.PO?.V_L === 140,
    set: { V_L: 251 },
    note: 'PK: THE ANALYTE CHOICE IS CONFIRMED BY A TEST THE EARLIER PASS COULD NOT RUN, AND THE VOLUME IS THE SAME ORPHAN ALREADY DELETED NEXT DOOR. Its citation reports a full quartet for BOTH circulating species in the same twelve volunteers, so the feasibility bound can be applied to each: the LACTONE arm needs an exposure-to-peak ratio of at least e times its peak time, 4.62 h, and observes 5.22 — REPRESENTABLE; the ACID arm needs 11.14 and observes 5.90 — UNFITTABLE AT ANY VOLUME, ANY BIOAVAILABILITY AND ANY ABSORPTION RATE. THE RECORD IS ON THE ONLY SPECIES THIS MODEL CAN CARRY, and the simvastatin analogy does not transfer. The volume was unsupported and is THE IDENTICAL ORPHAN NUMBER ALREADY REMOVED FROM SIMVASTATIN, whose note records that no human volume exists; here it over-predicted exposure 1.79-fold against the cited paper own verbatim figure. The replacement is DERIVED, NOT VERBATIM — the value that reproduces that exposure at the stored bioavailability and half-life — and is stored rather than deleted because the silent default is further from the truth than a declared derivation. A NEAR-MISS IS RECORDED AND DELIBERATELY NOT ACTED ON: the lactone ratio sits about two percent below the theoretical floor, which against a published spread of plus or minus 79 percent is noise.',
    summary: 'lovastatin — the feasibility bound confirms the analyte; V was simvastatin deleted orphan' },

  { slug: 'tianeptine', route: 'PO', guard: (c) => c.pk?.PO?.V_L == null,
    set: { V_L: 53.9, F: 0.99, ka_hr: 2.7 },
    note: 'PK: THE ROW CARRIED A CITATION AND NOTHING ELSE, SO EVERY PARAMETER WAS A SILENT DEFAULT — while the cited abstract states three of them verbatim. THE OBVIOUS ONE IS A TRAP: "total clearance and volume of distribution of tianeptine were 230 +/- 59 ml.min-1 and 0.47 +/- 0.14 l.kg-1" is a steady-state volume from a study with a genuine distribution phase ("the mean distribution half-life being about 0.7 h"), and storing it would assert a clearance a third below that same abstract own figure. THE COHERENT ONE-COMPARTMENT VOLUME WAS ALREADY IN THIS RECORD REFERENCES — "the apparent volume of distribution being about 0.8 L/kg (0.77 +/- 0.31 L/kg)" — and lands within eight percent. Bioavailability is verbatim at 99 percent from a real intravenous arm, so class 6 is decided rather than assumed. The absorption rate is BACK-DERIVED to reproduce a verbatim peak time of 0.94 h and is flagged as such. THE COST IS STATED: preserving exposure puts the peak around 177 ng/mL against a verbatim 334, and the volume that fixes the peak breaks exposure by half — though that abstract never states its dose, so the comparison is indicative rather than decisive. A SOFT CAVEAT ON THE EFFECT COMPARTMENT: its approximation is reasoned from a neutral lipophilic opioid, while tianeptine is an ANION at physiological pH with far poorer passive brain entry, so the stored rate probably overstates the speed.',
    summary: 'tianeptine — PK row was a bare citation; the obvious verbatim volume is a class-12 trap' },

  { slug: 'levetiracetam-er', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 0.3,
    set: { ka_hr: 0.508 },
    note: 'PK: NOT THE EXTENDED-RELEASE TRANSPLANT DEFECT, AND NOT ITS REVERSE. Volume and half-life are DISPOSITION parameters, formulation-independent by construction, so an extended-release record legitimately shares them with the immediate-release sibling — AND THE CITED PAPER PROVES IT ITSELF: "levetiracetam XR and IR were bioequivalent with respect to AUC((0-t)), AUC(infinity) and C(max)". Those values are substantively correct and merely uncited. THE ONE GENUINELY FORMULATION-SENSITIVE PARAMETER IS THE WRONG ONE: the stored absorption rate implied a peak at 5.5 h against this record own citation verbatim "The median t(max) was delayed from 0.9 to 4h", and it is not an immediate-release value either. The replacement is back-derived to reproduce that verbatim 4 h exactly and is flagged as derived; a zero-order duration would model an extended-release tablet better still and is logged. AN OUT-OF-SCOPE FINDING ON THE SIBLING IS RECORDED: immediate-release levetiracetam own published quartet sits 1.31-fold below the feasibility floor, so it is mildly unrepresentable in one compartment too.',
    summary: 'levetiracetam-er — V and t½ legitimately shared; the ka was the formulation defect' },

  { slug: 'brompheniramine', route: 'PO', guard: (c) => c.pk?.PO?.F == null,
    set: { F: 1 },
    note: 'PK: MY PRIOR IS REFUTED AND THE RECORD IS RIGHT. Both stored values are verbatim in the cited abstract — "The mean serum half-life value was 24.9 +/- 9.3 hr, the mean clearance rate was 6.0 +/- 2.3 ml/min/kg, and the mean volume of distribution was 11.7 +/- 3.1 L/kg" — the transplant check against chlorpheniramine is NEGATIVE, and the earlier pass that removed an invented absorption rate and bioavailability had ALREADY DONE THE WHOLE JOB. THE APPARENT THREE-FOLD VOLUME GAP BETWEEN THE TWO ANALOGUES IS NOT A DEFECT AND IT RESOLVES: chlorpheniramine 230 L is a true intravenous-derived volume, this one is an apparent volume with no intravenous arm ("the absolute bioavailability is unknown because no intravenous formulations are available"), and applying chlorpheniramine own bioavailability to it lands on chlorpheniramine own value. THE TWO RECORDS AGREE. The one actionable item is small and real: with no bioavailability stored the solver substitutes 0.9 against a volume that ALREADY CONTAINS IT, dividing by absorption twice, so it is pinned at unity in the same convention this catalogue already uses elsewhere.',
    summary: 'brompheniramine — verified verbatim; F pinned so the apparent volume is not divided twice' },

  { slug: 'nabumetone', route: 'PO', guard: (c) => c.pk?.PO?.V_L == null,
    set: { V_L: 30.9, F: 1, lag_hr: 0.19 },
    note: 'PK: THE ERRORS COMPENSATED, EXACTLY AS THE ATRACURIUM CASE TAUGHT ME TO ASK. Volume and bioavailability were NOT AUTHORED and fell through to the solver defaults, while the correct scaling for the active metabolite is about a third — so bioavailability ran 2.7-fold high against a correspondingly small volume, and since only their RATIO reaches exposure the model landed within a quarter BY ACCIDENT. Both are now authored, the volume sitting inside an independent verbatim band of 23 to 60 L, with a verbatim absorption lag. The absorption rate and half-life were already verified verbatim from the correct tablet arm. A DIMENSIONAL CAVEAT TRAVELS WITH THE SOURCE: its abstract prints an exposure "1,269:1,338 mg.hour/ml", which is impossible as written; the numeral is verbatim and the UNIT in the abstract is a typo. MY PRIOR THAT THE MASS DEFECT PROPAGATES INTO THE OCCUPANCY ROWS IS REFUTED — both rows explicitly used the metabolite mass and their arithmetic is exact, so THE AUTHOR QUARANTINED IT CORRECTLY. BUT THE DEFECT IS LIVE SOMEWHERE ELSE ENTIRELY: the app attaches the record molecular weight to every ligand and back-converts the stored concentration for display, so the screen shows affinities several percent off what the sources say. That is a catalogue-wide convention question, logged rather than patched here. FINALLY, THE PROSE CONTRADICTS ITS OWN NUMBERS: it calls the drug COX-2-preferential while the stored pair is three-and-a-half-fold COX-1-selective.',
    summary: 'nabumetone — unauthored V and F fell to defaults that cancelled a 2.7x error' },

  { slug: 'vancomycin', route: 'IV', guard: (c) => c.half_life_hr?.IV === 6,
    set: { V_L: 60.9 }, hl: 6.6,
    note: 'PK: THE WRONG ARM OF A TWO-ARM STUDY, AND THE ARM CHOSEN WAS THE INTERVENTION. Its citation reads "Mean CONTROL values ... were 6.4 +/- 1.0 liters/h, 6.6 +/- 1.5 h ... Mean values for the same parameters were 6.4 +/- 1.0 liters/h, 6.0 +/- 0.9 h ... WHEN ACTIVATED CHARCOAL WAS GIVEN", and the record stored the charcoal figure. Ten percent is small; the SHAPE is exactly the recurring one. The volume was not in that abstract at all and had been back-derived against a half-life matching neither arm. Both halves are now anchored to the control arm, and the clearance the pair implies equals the paper own verbatim figure exactly. A PHYSICAL SANITY CHECK PASSES: at one gram twice daily the model reproduces the KNOWN INADEQUACY of that regimen against the standard exposure target, which is a real property of the drug rather than a defect. MY PER-KILOGRAM DOSE PRIOR IS REFUTED HERE — the stored doses ARE the seventy-kilogram equivalents of the standard weight-based regimen, which is the correct workaround for a schema with no weight-based unit, and it is precisely the eleven records storing the RAW per-kilogram number that are wrong. An oral route declared with no parameters is removed; I CHECKED WHETHER IT SILENTLY FELL THROUGH TO THE DEFAULTS AND IT DID NOT — the resolver returns nothing without an elimination rate, so the route was dead rather than dangerous, but the dosing interface keys off the declared list.',
    summary: 'vancomycin — stored the activated-charcoal arm; V back-derived against neither arm' },

  { slug: 'cobicistat', route: 'PO', guard: (c) => (c.pk?.PO?.source_label ?? '').startsWith('FDA label: Tybost (cobicistat), clinical pharmacology (rev. 6/2025) — 150'),
    set: { source_label: 'Derived from FDA label Tybost (cobicistat) 150 mg PO qd exposure figures: the label states Cmax, AUCtau, Ctau and t½ ~3–4 h but NO volume and NO clearance. V/F 99.5 L is back-derived as (dose/AUC)·(t½/ln2); ka 0.7 is a catalog default.' },
    note: 'PK: THE MOST INTERNALLY COHERENT RECORD IN ITS GROUP, WITH TWO PROVENANCE DEFECTS AND NO ARITHMETIC ONE. Its exposure figures reproduce each other exactly and it passes the feasibility floor. But its label citation presented as a label figure a volume THE LABEL DOES NOT CONTAIN — that document gives peak, trough and exposure and NEITHER A VOLUME NOR A CLEARANCE — so the number is a legitimate back-derivation wearing the wrong clothes, and the attribution is rewritten to say so. THE INTERACTION CONSTANT IS DELETED RATHER THAN REPAIRED: it was computed from an exposure ratio, its note says so openly, and storing a computed affinity as a measured one is exactly what the verbatim rule forbids. TWO FURTHER PROBLEMS MADE REPAIR POINTLESS: the inhibitor concentration in that derivation is unsourced and disagrees with the label own peak, and the derivation inverts a COMPETITIVE relationship while the edge is flagged mechanism-based, so the two halves are inconsistent with each other. THE VERBATIM EFFECT IS KEPT IN PROSE — "GS-9350 potently inhibited midazolam apparent clearance (95% reduction), similar in effect to ritonavir 100 mg" — which is the honest quantity. AND A PERPETRATOR QUESTION IS ANSWERED PREEMPTIVELY: adding boosting edges here would DOUBLE-COUNT, because lopinavir and darunavir already declare in their own source labels that their apparent parameters are the ritonavir-boosted ones.',
    summary: 'cobicistat — a back-derived volume dressed as a label figure; computed Ki deleted' },

  { slug: 'gemfibrozil', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr == null,
    set: { ka_hr: 1, lag_hr: 0.75 },
    note: 'PK: THE PHARMACOKINETICS ARE FINE; THE INTERACTION BLOCK IS ALGEBRA ON A MISTYPED CONSTANT. I VERIFIED THE ARITHMETIC MYSELF: five of six stored affinities are EXACTLY 35 divided by one less than that entry own exposure fold-ratio, to two decimals — cerivastatin, montelukast, pioglitazone, rosiglitazone and loperamide. AND THE CONSTANT 35 IS WRONG THREE SEPARATE WAYS. It is called the midpoint of a verbatim "K(I) ... of 20 to 52 microM" AND THE MIDPOINT IS 36. That constant BELONGS TO GEMFIBROZIL GLUCURONIDE, NOT GEMFIBROZIL — the parent only number in that paper is a different one against a different enzyme — while the solver applies it against gemfibrozil own plasma concentrations. And it DOES DOUBLE DUTY as both an affinity in one entry and an inhibitor concentration in the five derivations, one source number in two fields, at a value that is not a gemfibrozil plasma concentration on any reading. THE SIXTH BREAKS EVEN THAT SCHEME: it should be 4.93 under the same formula, and "7.0-fold" appears verbatim at this record own dose — AN EXPOSURE FOLD-RATIO STORED AS AN AFFINITY IN MICROMOLAR. All seven are deleted; THE VERBATIM FOLD-CHANGES SURVIVE IN THE NOTES AND ARE THE HONEST QUANTITY. Separately, THE SIMVASTATIN MECHANISM IS WRONG: simvastatin is not a substrate of the enzyme named, and a paper not carried here concludes "the mechanism of the pharmacokinetic interaction is probably inhibition of non-CYP3A4-mediated metabolism of simvastatin acid". EVERY OTHER VERBATIM QUOTE IN THOSE NOTES VERIFIES, and I WAS WRONG TO SUSPECT the dose-response attribution, which is exactly right. On the absorption: an earlier pass declined to author a rate because the observed peak sits above the ceiling this half-life allows, WHICH WAS CORRECT ARITHMETIC AND THE WRONG CONCLUSION — the margin is under two percent against a spread six times larger, another study peak fits underneath, and the drug has no depot formulation. THAT IS A LAG, NOT AN IMPOSSIBILITY, and leaving the field empty rendered the peak at 1.44 h, wrong in exactly the direction the earlier pass was trying to avoid.',
    summary: 'gemfibrozil — five of six Ki values are 35/(R−1) algebra; all seven deleted' },

  { slug: 'ghb', route: 'PO', guard: (c) => c.pk?.PO?.F == null,
    set: { F: 1 },
    note: 'PK: A MERGED RECORD THAT IS COHERENT EVERYWHERE IT SPEAKS AND SILENT WHERE IT MATTERS MOST. Everything cited is verbatim and correctly converted, the clearance the stored pair implies lands within three percent of its own source, and THE MERGE GENUINELY FIXED a maximal-effect value that the pre-merge record contradicted in its own note. BUT THE ORAL ROW DECLARED NEITHER BIOAVAILABILITY NOR AN ABSORPTION RATE, so the solver substituted both — and at the citation own dose the model predicted a peak roughly four-fold below that same abstract observed "GHB plasma peaks of 39.4 +/- 25.2 microg/mL". THAT GAP IS UNREACHABLE AT ANY ABSORPTION RATE: the ceiling is the dose times bioavailability over the volume, which sits BELOW the observed peak even at complete absorption, so pinning bioavailability at unity is the most the model can offer and the residual is structural. THE MECHANISM IS KNOWN AND DELIBERATELY NOT AUTHORED: capacity-limited absorption and elimination are confirmed verbatim in humans, but NO HUMAN SATURATION CONSTANTS ARE PUBLISHED — the only ones are rat, sitting in this record own effect-compartment citation — and storing rat constants as human pharmacokinetics is exactly the error this audit exists to prevent.',
    summary: 'ghb — F defaulted; the observed peak is unreachable at any ka, so the gap is structural' },
];

for (const p of PATCH) {
  const c = need(p.slug);
  if (!p.guard(c)) { log.push(`${p.slug} — already corrected, skipped`); continue; }
  const row = c.pk?.[p.route];
  if (!row) throw new Error(`${p.slug} has no pk.${p.route}`);
  for (const k of p.del ?? []) delete row[k];
  Object.assign(row, p.set ?? {});
  if (p.hl != null) { c.half_life_hr ??= {}; c.half_life_hr[p.route] = p.hl; }
  if (p.refs?.length) addRefs(c, ...p.refs);
  note(c, p.note);
  log.push(p.summary);
}

/** Half-life-only corrections, where every other stored parameter verified. */
const HL_FIXES: { slug: string; route: string; from: number; to: number; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'oseltamivir', route: 'PO', from: 7, to: 7.7,
    note: 'PK: A NEAR-TEN-FOLD EXPOSURE ERROR ASSEMBLED FROM TWO SEPARATELY DEFENSIBLE CHOICES. The bioavailability is verbatim, correctly metabolite-referenced and matches the declared analyte. The half-life sat inside a verbatim range ("an apparent half-life of 6 to 10 hours") where a point value exists — "oseltamivir carboxylate has an elimination half-life (t1/2 beta) after oral administration in healthy individuals of approximately 7.7 hours" — and that is what it becomes. THE VOLUME IS THE LARGER FAULT AND CANNOT BE FIXED FROM THE LITERATURE: the label states "The volume of distribution (Vss) of oseltamivir carboxylate, following INTRAVENOUS administration in 24 subjects (TAMIFLU is not available as an IV formulation), ranged between 23 and 26 liters", so the stored figure is BOTH the low endpoint of a range AND an intravenous steady-state volume married to a terminal ORAL half-life. NO SOURCE ANYWHERE STATES AN ORAL APPARENT VOLUME, so the value the arithmetic requires is a derivation and is logged rather than stored. The consequence is quantified against the label own verbatim figures: the record asserts a clearance eight-fold below "Renal clearance (18.8 L/h) exceeds glomerular filtration rate (7.5 L/h)" for a drug the same document says is eliminated unchanged, and over-predicts exposure nearly ten-fold. A reference supporting nothing under any of the three purposes — it is the paper this record notes already record as a REMOVED source — is deleted with it.',
    summary: 'oseltamivir — 9.7x over; t½ was a range interior, V is an IV Vss with no oral replacement' },

  { slug: 'glipizide', route: 'PO', from: 4, to: 5,
    note: 'PK: SMALL, REAL AND ENTIRELY DECIDABLE INSIDE ONE ABSTRACT. The stored half-life appears nowhere — its own citation says "t1/2 = 5.0 +/- 2.3 vs. 5.2 +/- 2.0 h" — and the clearance test runs entirely within that same paper, which states "CL/F, 2.3 +/- 1.0 vs. 2.0 +/- 1.0 L/h" against a stored assertion 47 percent higher. SUBSTITUTING THE ONE VERBATIM VALUE CUTS THE ERROR BY TWO THIRDS. The volume is verbatim but is the OBESE ARM of a two-arm study, rendered here at the seventy-kilogram reference while the non-obese figure is equally verbatim and closer to that reference — recorded, not changed, since the difference is inside the reported spread. MY SAME-CLASS COLLISION PRIOR IS REFUTED: checked in both directions against glimepiride, there is no shared or near-shared numeral, and the only value the two have in common is an absorption rate they also share with an unrelated record, most likely two independent guesses at fast absorption. A FORMULATION FLAG IS LOGGED: the stored dose range matches the extended-release ceiling while the cited study is unambiguously immediate-release, and a zero-order duration would be the honest way to carry that.',
    summary: 'glipizide — t½ appears nowhere; the verbatim value cuts the clearance error by two thirds' },

  { slug: 'rosiglitazone', route: 'PO', from: 3.5, to: 3.6,
    note: 'PK: MOSTLY RIGHT, WITH TWO SUB-FIVE-PERCENT CORRECTIONS RECORDED SO NOBODY LATER OVER-CORRECTS THEM. Bioavailability is verbatim twice over. The half-life was A MIDPOINT — its citation says "3-7 h" and this record own prose says three to four — and the verbatim replacement was ALREADY SITTING IN ITS REFERENCE LIST, in the control arm of a same-dose interaction study: "prolonged the elimination half-life (t(1/2)) of rosiglitazone from 3.6 to 7.6 h". The volume was unsupported AND CONTRADICTED BY THIS RECORD OWN MECHANISM TEXT, which states a figure two tenths of a litre larger — a transcription slip, now reconciled to the prose. Both changes are worth about three percent and neither is a defect of substance; the clearance already sat within noise of the published figure. MY PIOGLITAZONE-SHAPED PRIOR DOES NOT FIT HERE: the absorption rate matches no peak time in any cited abstract, so it is unsourced rather than misattributed.',
    summary: 'rosiglitazone — a 3-4 midpoint and a prose/data mismatch, both ~3%' },

  { slug: 'ethosuximide', route: 'PO', from: 50, to: 53.7,
    note: 'PK: THE CONTROL OF THIS BATCH, AND IT PASSES EVERY TEST. The volume is verbatim AND IS CORRECTLY THE CONTROL ARM — the patient arm in that study is the enzyme-induced one — so the range-interior class is acquitted rather than merely absent. Class 6 is acquitted BY CONSTRUCTION: an apparent volume paired with a bioavailability pinned at unity divides by absorption exactly once. And the clearance test passes handsomely against the paper own verbatim figure, corroborated independently to one percent by a second volunteer study. The half-life was the only soft spot, sitting near the midpoint of two healthy-volunteer studies where its own citation states "53.7 +/- 14.3" for controls; moving to the verbatim value IMPROVES the clearance agreement and is cosmetic otherwise. The absorption rate is unsourced BUT ACQUITTED ON SHAPE: it implies a peak at 3.33 h, which is not round, not a half-hour boundary, not a range endpoint, and sits inside the published band.',
    summary: 'ethosuximide — passes everything; t½ moved to the verbatim control-arm value' },

  { slug: 'upadacitinib', route: 'PO', from: 11.5, to: 3.8, refs: ['PMID:30945116'],
    note: 'PK: A THREE-FOLD EXPOSURE ERROR WHOSE CAUSE ITS OWN CITATION STATES OUT LOUD. The volume is verbatim and IS the extended-release figure, answering the formulation concern, and pinning bioavailability at unity is right because no intravenous form exists — THE PAPER RELATIVE BIOAVAILABILITY OF 76 PERCENT IS A DIFFERENT QUANTITY AND THE RECORD CORRECTLY DECLINED TO STORE IT, avoiding the trap that has caught other records. The defect is the half-life, an unsupported midpoint of a label range, welded to a volume the same paper describes as the sum of two compartments from a model with "mixed zero- and first-order absorption with lag time for the ER formulation". THE FIX IS UNUSUALLY CLEAN: that paper states a FUNCTIONAL half-life of three to four hours, and the value that makes the stored volume reproduce the paper own verbatim clearance falls inside that range — in a one-compartment model the single half-life must carry the whole exposure, so the functional one is the correct one. AND IT FIXES THE ABSORPTION FOR FREE: the stored rate implied a peak outside the label window and now lands inside a verbatim "2 to 4 hours for the ER formulation". THE BIOAVAILABILITY MUST NOT BE TOUCHED — lowering it would also close the exposure gap arithmetically, but against an apparent volume that would be creating one defect to paper over another. NOTE THE NEAR-IDENTITY WITH BARICITINIB THREE-FOLD GAP: same class, same defect.',
    summary: 'upadacitinib — 3.03x under; the paper own "functional half-life" is the right one' },

  { slug: 'meropenem', route: 'IV', from: 1, to: 0.8,
    note: 'PK: A GENUINE CONTROL WITH ONE ROUNDING FIX. The volume is verbatim in a sentence that also settles the arithmetic — "The mean plasma half-life of meropenem was 0.8 h, mean plasma clearance 277 ml/min and the mean volume of distribution 20.4 l" — and pinning bioavailability at unity is correct because that volume is intravenous-derived from a half-hour infusion in six healthy men. THE ROUNDED HALF-LIFE BROKE THE CLEARANCE TEST AGAINST ITS OWN CITATION by fifteen percent; the verbatim value from the same fit closes it to six, and the residual is the paper own rounding. The feasibility identity is CORRECTLY NOT APPLIED — for an intravenous-only record it degenerates into the clearance test and carries no independent information, so no second test was manufactured. AND THE PER-KILOGRAM DOSE SWEEP DOES NOT REACH THIS RECORD: flat adult dosing is correct here, the cited study used the stored minimum, the predicted peak matches the published one, and the only weight-based meropenem literature is paediatric.',
    summary: 'meropenem — t½ rounded to 1 h broke its own clearance by 15%' },

  { slug: 'doxorubicin', route: 'IV', from: 30, to: 13,
    note: 'PK: TWO ERRORS THAT WERE HIDING EACH OTHER, WHICH IS WHY EITHER ONE ALONE MAKES THE RECORD WORSE. The dose block was expressed per square metre in every source — and this record OWN mechanism text says so, quoting a lifetime ceiling in those units — so at the reference body surface the stored figures were 1.73-fold low. Independently, the volume is a steady-state one and, married to a terminal half-life, asserted a clearance 2.13-fold below a verbatim absolute figure, corroborated two ways. THE MODEL EXPOSURE WAS THEREFORE ONLY A QUARTER HIGH; CORRECTING THE DOSE ALONE WOULD HAVE MADE IT TWICE HIGH. Both move together: the doses become their body-surface equivalents and the half-life becomes a verbatim value from a normal-hepatic-function cohort, which brings the implied clearance within eight percent of the verbatim absolute. The abandoned half-life is itself verbatim but is the THIRD phase of a triexponential ("successive half-lives ... about 5 minutes, 1 hour and 30 hours"), carrying little exposure and, at three-weekly dosing, no accumulation. THE OBVIOUS TWO-COMPARTMENT ALTERNATIVE WAS TESTED AND REJECTED: one paper looks like a ready-made verbatim parameter set and the solver would accept it, but its microconstants are irreconcilable with its OWN reported clearance and exposure by a factor of nineteen and fail the standard consistency relation, while its clearance and exposure reproduce each other to two percent — so the microconstants are the broken half.',
    summary: 'doxorubicin — mg/m² dose and a Vss/terminal pairing cancelled; both moved together' },
];
for (const h of HL_FIXES) {
  const c = need(h.slug);
  if (c.half_life_hr?.[h.route] !== h.from) { log.push(`${h.slug} — half-life already ${c.half_life_hr?.[h.route]}, skipped`); continue; }
  c.half_life_hr[h.route] = h.to;
  if (h.refs?.length) addRefs(c, ...h.refs);
  note(c, h.note);
  log.push(h.summary);
}

/** Molecular weights that describe the parent while pk_analyte names the metabolite. */
const MW_FIXES: { slug: string; from: number; to: number; note: string; summary: string }[] = [
  { slug: 'oseltamivir', from: 312.4, to: 284.35,
    note: 'MASS: the stored weight was the ETHYL ESTER while the declared analyte is the carboxylate — 9.9 percent high. LATENT, NOT PROPAGATING: this record carries no occupancy rows and is no other record interaction perpetrator, so nothing consumes it today.',
    summary: 'oseltamivir mw 312.4 → 284.35 (carboxylate, the declared analyte)' },
  { slug: 'tenofovir-disoproxil', from: 519.44, to: 287.21,
    note: 'MASS: the stored weight was tenofovir DISOPROXIL free base while the declared analyte is tenofovir — 80.9 PERCENT HIGH, THE LARGEST MASS DEFECT OF THIS SHAPE FOUND IN THE WHOLE AUDIT. AND HERE IT IS NOT INERT, BECAUSE THE SAME MISMATCH RUNS THROUGH THE DOSE: the stored 300 mg is milligrams of the fumarate salt, of which only about 136 mg is tenofovir moiety, while the verbatim 25 percent bioavailability is defined molar-equivalently — so the model delivers roughly twice the analyte mass it should. THE NINE-FOLD EXPOSURE ERROR DECOMPOSES CLEANLY: about 2.2-fold from that mismatch and about 4.2-fold from an intravenous steady-state volume paired with a terminal half-life. CORRECTING EITHER ALONE MAKES THE DIAGNOSIS LOOK SOLVED WHEN IT IS NOT. THE FEASIBILITY FLOOR FAILS HARD AND INDEPENDENTLY: the label own peak, exposure and peak time sit more than three-fold below the minimum any one-compartment fit permits, so the stored half-life — genuine, verbatim, and TERMINAL — is not the one that carries this drug exposure; the effective value implied by the label own quartet is closer to a quarter of it. ALSO CORRECTED: this record note attributed its bioavailability to a FOOD EFFECT ON TENOFOVIR DIPIVOXIL. That paper exists and says approximately what the note claims, BUT IT IS A NUMERICAL COINCIDENCE AND NOT THE PROVENANCE — the figure is the label absolute bioavailability. No transplant with the alafenamide sibling is possible: that record is unauthored and has no numbers to swap.',
    summary: 'tenofovir-disoproxil mw 519.44 → 287.21 (80.9% high — the largest of the series)' },
  { slug: 'sacubitril', from: 411.49, to: 383.44,
    note: 'MASS: the stored weight was the prodrug while the declared analyte is sacubitrilat — 7.3 percent high, the smallest of the series, and inert today. THE RECORD OWN NOTE ALREADY DISCLOSED IT; disclosure is not a fix. MY DOSE PRIOR IS REFUTED AND THE DOSE BLOCK IS RIGHT: the stored figures are the SACUBITRIL COMPONENTS of the combination tablet, stated verbatim in that form, and the molar ratio checks out. The half-life is verbatim from the healthy arm and correctly analyte-referenced. THE BIOAVAILABILITY AND VOLUME ARE UNSOURCEABLE, NOT MERELY UNSOURCED: seven papers were chased and every one reports peak times, half-life ranges, geometric-mean ratios, fold-changes or urinary recovery, NEVER an absolute bioavailability, clearance or volume. The stored bioavailability matches the label qualitative floor and nothing indexed. A CLASS-2 NEAR-MISS IS RECORDED SO NOBODY LATER MISTAKES IT FOR THE SOURCE: one paper reports a urinary recovery percentage close to the stored figure but not equal to it.',
    summary: 'sacubitril mw 411.49 → 383.44 (sacubitrilat)' },
  { slug: 'nabumetone', from: 228.29, to: 216.23,
    note: 'MASS: the stored weight was the parent while the declared analyte is the active metabolite. THE OCCUPANCY ROWS ALREADY USED THE CORRECT METABOLITE MASS IN THEIR OWN CONVERSIONS, so the stored value and the rows disagreed with each other — which is how the app came to display affinities several percent away from what the sources state.',
    summary: 'nabumetone mw 228.29 → 216.23 (6-MNA, matching what the occupancy rows already used)' },
];
for (const m of MW_FIXES) {
  const c = need(m.slug);
  if (c.mw_g_mol !== m.from) { log.push(`${m.slug} — mw already ${c.mw_g_mol}, skipped`); continue; }
  c.mw_g_mol = m.to;
  note(c, m.note);
  log.push(m.summary);
}

/**
 * CLASS 14 — a per-kilogram dose stored as flat mass.
 * DoseUnit is 'mg' | 'g' | 'mcg' | 'IU' with no weight-based member, and the
 * solver never weight-scales a dose (scaleForWeight touches volume and clearance
 * only). The correct workaround is therefore the 70 kg equivalent, WHICH
 * VANCOMYCIN ALREADY USES — that is what makes these six defects rather than a
 * schema gap. Five more are logged for a dedicated pass.
 */
const DOSE_FIXES: { slug: string; route: string; from: [number, number, number]; to: [number, number, number]; perKg: string; summary: string }[] = [
  { slug: 'propofol', route: 'IV', from: [1, 2.5, 2], to: [70, 175, 140], perKg: '1–2.5 mg/kg induction', summary: 'propofol IV dose 1/2.5/2 mg → 70/175/140 mg (1–2.5 mg/kg × 70)' },
  { slug: 'thiopental', route: 'IV', from: [3, 5, 4], to: [210, 350, 280], perKg: '3–5 mg/kg induction', summary: 'thiopental IV dose 3/5/4 mg → 210/350/280 mg' },
  { slug: 'atracurium', route: 'IV', from: [0.4, 0.5, 0.5], to: [28, 35, 35], perKg: '0.4–0.5 mg/kg intubating', summary: 'atracurium IV dose 0.4/0.5/0.5 mg → 28/35/35 mg' },
  { slug: 'vecuronium', route: 'IV', from: [0.08, 0.1, 0.1], to: [5.6, 7, 7], perKg: '0.08–0.1 mg/kg intubating', summary: 'vecuronium IV dose 0.08/0.1/0.1 mg → 5.6/7/7 mg' },
  { slug: 'sufentanil', route: 'IV', from: [0.1, 30, 1], to: [7, 2100, 70], perKg: '0.1–30 mcg/kg', summary: 'sufentanil IV dose 0.1/30/1 mcg → 7/2100/70 mcg' },
  { slug: 'alfentanil', route: 'IV', from: [5, 50, 25], to: [350, 3500, 1750], perKg: '5–50 mcg/kg', summary: 'alfentanil IV dose 5/50/25 mcg → 350/3500/1750 mcg' },
  { slug: 'doxorubicin', route: 'IV', from: [30, 90, 60], to: [52, 156, 104], perKg: '30–90 mg/m² at 1.73 m²', summary: 'doxorubicin IV dose 30/90/60 mg → 52/156/104 mg (mg/m² × 1.73)' },
];
const DOSE_NOTE = 'DOSE: THE STORED FIGURE WAS THE RAW PER-WEIGHT NUMBER, NOT A DOSE — %P, entered as flat milligrams. The dose unit enumeration has no weight-based member and the solver never weight-scales a dose, so THE ONLY REPRESENTABLE FORM IS THE SEVENTY-KILOGRAM EQUIVALENT, and that is what this record now carries. I TESTED THE OBJECTION THAT THIS READS A SCHEMA GAP AS A DATA DEFECT AND THE DISTINCTION IS CLEAN: vancomycin stores the seventy-kilogram equivalent of its weight-based regimen and is CORRECT, meropenem is genuinely flat-dosed and is CORRECT, and eleven records store the raw per-weight number and are WRONG BY ROUGHLY SEVENTY-FOLD. Both of my priors on the two correct records were wrong.';
for (const d of DOSE_FIXES) {
  const c = need(d.slug);
  const row = c.doses?.[d.route];
  if (!row) throw new Error(`${d.slug} has no doses.${d.route}`);
  if (row.min !== d.from[0] || row.max !== d.from[1] || row.typical !== d.from[2]) { log.push(`${d.slug} — dose already ${row.min}/${row.max}/${row.typical}, skipped`); continue; }
  row.min = d.to[0]; row.max = d.to[1]; row.typical = d.to[2];
  note(c, DOSE_NOTE.replace('%P', d.perKg));
  log.push(d.summary);
}

/** Effect-compartment repairs. Every value is exactly 60× a published per-minute
 *  figure — the unit hypothesis is refuted — but the PROVENANCE is not. */
const EC_FIXES: { slug: string; guard: (c: Compound) => boolean; set: Record<string, unknown>; del?: string[]; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'propofol', guard: (c) => c.effect_compartment?.keo_per_h === 6.12,
    set: { keo_per_h: 27.36, source_pmid: 'PMID:10360845', note: 'Adult BIS/EEG population fit. Verbatim: "The plasma effect-site equilibration rate constant was 0.456 min(-1). The predicted time to peak effect after bolus injection ranging was 1.7 min. The time to peak effect assessed visually was 1.6 min." keo = 0.456 × 60. Replaces 6.12/h, which was verbatim but was one parameter of a TWO-compartment effect model in 14 adolescents and implied a 6.8 min equilibration half-time against an observed peak effect at 1.6 min.' },
    refs: ['PMID:10360845'],
    note: 'EFFECT COMPARTMENT: CLASS 13 — VERBATIM-CORRECT AND STILL WRONG BY FOUR AND A HALF FOLD. The stored rate is genuinely in its cited paper, but it is one parameter of "a TWO COMPARTMENT effect-site model with a keo of 0.102 min-1, ke12 of 0.121 min-1 and ke21 of 0.172 min-1", fitted in fourteen ADOLESCENTS on a scoliosis wake-up test — a structure the solver cannot represent, so lifting one of its three constants into a single-compartment slot is not the same quantity. IT IMPLIED AN EQUILIBRATION HALF-TIME OF 6.8 MINUTES FOR A DRUG WHOSE OWN LITERATURE OBSERVES PEAK EFFECT AT 1.6. The canonical adult fit replaces it and states its own validation in the same sentence. THE PHARMACOKINETIC ROW IS SEPARATELY BROKEN AND IS NOT REPAIRED HERE BECAUSE NO VERBATIM REPLACEMENT EXISTS: the volume is the euthyroid CONTROL arm of a THYROID-DISEASE study, a steady-state volume from a multi-compartment fit, and the stored half-life APPEARS NOWHERE IN THAT ABSTRACT. The pair asserts a clearance 4.4-fold below the accepted figure, and the same paper own infusion data confirm it independently — at its stated rate the model predicts a steady-state concentration four-fold above what that paper observed. A volume consistent with the stored half-life would be around 866 L, which is not a propofol volume on any reading, so the half-life is the guilty parameter and it has no published one-compartment counterpart. LOGGED.',
    summary: 'propofol keo 6.12 → 27.36 (class 13: a 2-compartment parameter in a 1-compartment slot)' },

  { slug: 'sufentanil', guard: (c) => c.effect_compartment?.keo_per_h === 6.93,
    set: { keo_per_h: 6.71, source_pmid: 'PMID:1670913', note: 'Adult human EEG. Verbatim: "The half-time of blood-brain equilibration (T1/2Keo) was not statistically different between sufentanil and fentanyl (6.2 +/- 2.8 vs. 6.6 +/- 1.7 min, mean +/- SD, respectively)." keo = ln2 / (6.2/60) = 6.71/h. Replaces 6.93/h, computed from a narrative review\'s "equilibration half-lives of about 6 min" — a 3.3% near-miss, but derived from an approximation rather than measured.' },
    refs: ['PMID:1670913'],
    note: 'EFFECT COMPARTMENT: THE OLD VALUE WAS DERIVED FROM A NARRATIVE REVIEW WITH NO SUBJECTS, violating the verbatim rule twice over — it was COMPUTED, and computed from an "about". The primary measurement exists in a paper reporting both this drug and fentanyl in one sentence, WHICH IS THE MOST DANGEROUS SHAPE IN THIS LITERATURE AND I CHECKED IT: the two records differ in value and in citation, so no transplant has occurred. THE STORED VALUE WAS ONLY 3.3 PERCENT FROM THE TRUTH, which is recorded as a near-miss so the correction is not mistaken for a large one. A LEAK WAS FOUND NEXT DOOR WHILE CHECKING: fentanyl own rate is annotated as a rat tail-flick endpoint with its species field UNSET, so it counts among the records claiming a fitted human value while being an animal one.',
    summary: 'sufentanil keo 6.93 → 6.71 (was computed from a review\'s "about 6 min")' },

  { slug: 'remifentanil', guard: (c) => c.effect_compartment?.keo_per_h === 28.8,
    set: { keo_per_h: 55.45, source_pmid: 'PMID:8638836', note: 'Adult human, direct head-to-head with alfentanil. Verbatim: "a T(12)k(e0) for remifentanil of 0.75 min [corrected] and 0.96 min for alfentanil". keo = ln2 / (0.75/60) = 55.45/h. Replaces 28.8/h, which was verbatim and correctly labelled DOG — one of only eleven records that ever set the species field — but is 1.9× slower than the human value.' },
    del: ['source_species'], refs: ['PMID:8638836'],
    note: 'EFFECT COMPARTMENT: THE OLD VALUE WAS HONEST AND STILL WRONG FOR THIS PURPOSE. It was fitted, verbatim, and CORRECTLY LABELLED AS DOG — one of only eleven records in the whole catalogue that ever declared a non-human species, which is a credit to whoever authored it — but the human measurement exists and is nearly twice as fast, in a direct head-to-head that also supplies the alfentanil value corrected in the same pass. The species flag is removed with the animal number.',
    summary: 'remifentanil keo 28.8 (dog) → 55.45 (human head-to-head)' },

  { slug: 'alfentanil', guard: (c) => c.effect_compartment?.keo_per_h === 69.3,
    set: { keo_per_h: 43.32, source_pmid: 'PMID:8638836', note: 'Adult human, direct head-to-head with remifentanil. Verbatim: "a T(12)k(e0) for remifentanil of 0.75 min [corrected] and 0.96 min for alfentanil". keo = ln2 / (0.96/60) = 43.32/h. Replaces 69.3/h, computed from a 5-subject COMPARATOR arm reporting "0.6 +/- 0.4 minutes" — a 67% relative SD, and 1.6× fast against this definitive value.' },
    refs: ['PMID:8638836'],
    note: 'EFFECT COMPARTMENT: THE OLD VALUE WAS GENUINELY FITTED, WHICH IS NOT THE SAME AS BEING THE RIGHT ONE. It came from a five-subject COMPARATOR arm whose reported spread is 67 percent of its own mean, and it ran 1.6-fold fast against the definitive head-to-head — the same abstract that supplies the remifentanil correction in this batch, so both opioids now come from one cohort measured the same way.',
    summary: 'alfentanil keo 69.3 → 43.32 (was a 5-subject comparator arm with a 67% SD)' },

  { slug: 'thiopental', guard: (c) => c.effect_compartment?.keo_per_h === 34.8,
    set: { keo_per_h: 34.66, source_pmid: 'PMID:6491902', note: 'Adult human, arterial sampling. Verbatim: "The half-time for equilibration (mean +/- SD) between concentration and response for the arterial data was 1.2 +/- 0.30 min." keo = ln2 / (1.2/60) = 34.66/h. Replaces the same number cited to a paper that says it "used an ASSUMED plasma-effect site rate constant (ke0) of 0.58" — the registry was citing the study that ASSUMED the value, not one that measured it.' },
    refs: ['PMID:6491902'],
    note: 'EFFECT COMPARTMENT: REFUTED AS FITTED, AND THE NUMBER IS RIGHT ANYWAY. The cited paper states that it "used an ASSUMED plasma-effect site rate constant (ke0) of 0.58" — SO THE REGISTRY WAS CITING THE STUDY THAT ASSUMED THE VALUE, NOT ONE THAT MEASURED IT, and an assumed constant carrying no approximation flag is the worst of both. The measurement exists, was made with arterial sampling, and lands within half a percent, corroborated by two further reports; re-pointed, the value can legitimately stay unflagged.',
    summary: 'thiopental keo → PMID:6491902 (the old citation says the value was ASSUMED)' },

  // NOT flagged `approximated`: data-lint's effect.approx-conflict is right that a
  // fitted, cited value is not an estimate. The value IS fitted — it is fitted
  // between the wrong two compartments, which is a note, not a flag.
  { slug: 'ropivacaine', guard: (c) => !(c.effect_compartment?.note ?? '').includes('WRONG COMPARTMENT'),
    set: { note: 'STRUCTURALLY THE WRONG COMPARTMENT, not a wrong number. Verbatim: "Typical ke0 half-life was 34.7 min" — but the same paper defines it "BETWEEN AMOUNT IN THE DEPOT AND EFFECT-SITE COMPARTMENTS" and its potency term is an amount ("AE90 was estimated as 20.2 mg"), i.e. perineural diffusion out of an injection depot. The solver feeds this filter the SYSTEMIC plasma curve, so the rate is repurposed, not measured for this use. Flagged, not deleted.' },
    note: 'EFFECT COMPARTMENT: CORRECTLY CITED, VERBATIM, AND MEASURED BETWEEN THE WRONG TWO COMPARTMENTS. The paper fits an equilibration delay between the AMOUNT REMAINING IN AN INJECTION DEPOT and the effect site, with a potency term expressed as a MASS rather than a concentration — that is perineural diffusion, not equilibration from the systemic circulation the solver actually feeds it. The number stays and is flagged, because deleting it would be worse.',
    summary: 'ropivacaine keo flagged approximated — a depot-to-effect rate fed a plasma curve' },
];
for (const e of EC_FIXES) {
  const c = need(e.slug);
  if (!e.guard(c)) { log.push(`${e.slug} — keo already corrected, skipped`); continue; }
  c.effect_compartment ??= {};
  for (const k of e.del ?? []) delete (c.effect_compartment as Record<string, unknown>)[k];
  Object.assign(c.effect_compartment, e.set);
  if (e.refs?.length) addRefs(c, ...e.refs);
  note(c, e.note);
  log.push(e.summary);
}

/** fosinopril's mass, found alongside the volume reversal. */
{
  const c = need('fosinopril');
  if (c.mw_g_mol === 563.66) {
    c.mw_g_mol = 435.5;
    note(c, 'MASS: the stored weight was the prodrug while the declared analyte is fosinoprilat — 29.4 percent high, second only to tenofovir-disoproxil in this series. Inert today (no occupancy rows, no interaction edge), but it is the same molar/mass confusion that makes the stored bioavailability wrong as a mass factor.');
    log.push('fosinopril mw 563.66 → 435.50 (fosinoprilat, the declared analyte)');
  } else { log.push('fosinopril — mw already corrected, skipped'); }
}

/**
 * *** THE COMPENSATING-ERROR PAIR — two independent ~60-70× errors that cancel. ***
 * Fixing either alone makes the record far worse than leaving both.
 */
{
  const c = need('atracurium');
  const row = (c.receptor_occupancy ?? [])[0];
  if (row && row.ec50_mg_l === 0.0227) {
    row.ec50_mg_l = 1.36;
    row.hill_n = 4.04;
    row.basis = 'in_vivo_plasma_ec50';
    row.source_pmid = 'PMID:11144993';
    row.note = 'HUMAN IN-VIVO PLASMA EC50, from the ICU/ARDS PK-PD study this record already cited for its keo. Verbatim: "The concentration producing 50% of the Emax was 1.36 micrograms/mL" and "The mean sigmoidicity factor, gamma, was 4.04". Replaces 0.0227 mg/L (24.4 nM), a patch-clamp IC50 in DENERVATED MOUSE skeletal muscle — 60× more potent, and an in-vitro receptor number where an in-vivo plasma relationship exists. basis in_vivo_plasma_ec50 stops the free-fraction correction being applied twice.';
    note(c, 'OCCUPANCY: THE THIRD COMPENSATING-ERROR PAIR AND THE MOST INSTRUCTIVE. Two independent errors of roughly sixty and seventy fold ran in opposite directions and cancelled: the dose was the raw per-kilogram intubating figure, and the potency term was a patch-clamp measurement in DENERVATED MOUSE skeletal muscle where THIS RECORD OWN PHARMACOKINETIC CITATION CONTAINS THE HUMAN IN-VIVO VALUE. Together they rendered an occupancy of 51 percent, which looks entirely plausible. FIXING THE DOSE ALONE DRIVES IT TO 98.6 PERCENT AND SATURATES; FIXING THE POTENCY ALONE DROPS IT TO 3.2 AND NULLS. BOTH TOGETHER — with the sigmoidicity factor from the same sentence — GIVE 70 PERCENT, WHICH IS CORRECT. This is why an audit that fixes one defect at a time is not merely slower but can be actively harmful.');
    log.push('atracurium occupancy ec50 0.0227 → 1.36 mg/L + hill_n 4.04 + in_vivo_plasma_ec50 (compensating pair)');
  } else { log.push('atracurium — occupancy already corrected, skipped'); }
}

/** Prose: an occupancy note transplanted between two records from the same lab. */
const PROSE: { slug: string; idx: number; from: string; to: string; summary: string }[] = [
  { slug: 'vecuronium', idx: 0, from: 'Same Liu 2010 paper', to: 'Wang 2010 (PMID:20305678; the authors are Wang, Yang, Xu, Yan, Li — "Liu" was transplanted from ropivacaine\'s occupancy source, a different paper from the same lab)', summary: 'vecuronium occupancy note — "Liu 2010" was the wrong first author (Wang)' },
];
for (const p of PROSE) {
  const c = need(p.slug);
  const row = (c.receptor_occupancy ?? [])[p.idx];
  if (!row || typeof row.note !== 'string' || !row.note.includes(p.from)) { log.push(`${p.slug} — prose already corrected, skipped`); continue; }
  row.note = row.note.replace(p.from, p.to);
  log.push(p.summary);
}

/** Interaction affinities that are algebra, not measurements. */
{
  const g = need('gemfibrozil');
  const stripped: string[] = [];
  for (const e of g.interactions ?? []) {
    if (e.kinetics?.ki_uM == null) continue;
    delete e.kinetics;
    e.note = (e.note ?? '')
      .replace(/;?\s*Ki\s*[≈~]\s*35\/[\d.]+\s*=\s*[\d.]+\s*µM\.?/u, '.')
      .replace(/Solver approximates as competitive Ki = 35 µM \(midpoint\); t/u, 'T')
      .replace(/\s+/gu, ' ')
      .trim();
    if (!e.note.includes('Ki removed —')) e.note += ' [Ki removed — AUTHORING_GAPS b10.]';
    if (e.note.length > 500) throw new Error(`gemfibrozil→${e.slug} note is ${e.note.length} chars`);
    stripped.push(e.slug ?? '?');
  }
  if (stripped.length) log.push(`gemfibrozil — ki_uM stripped from ${stripped.length} interactions (${stripped.join(', ')})`);
  else log.push('gemfibrozil — interactions already stripped, skipped');

  const cob = need('cobicistat');
  const mid = (cob.interactions ?? []).find((e) => e.slug === 'midazolam');
  if (mid?.kinetics?.ki_uM != null) {
    delete mid.kinetics;
    mid.note = (mid.note ?? '').replace(/\s*CL ↓95% → AUC ratio 1\/0\.05 = 20×; Ki ≈ 1\.5\/19 = 0\.079 µM\./u, ' CL ↓95%.');
    if (!mid.note.includes('Ki removed —')) mid.note += ' [Ki removed — computed from the AUC ratio; see AUTHORING_GAPS b10.]';
    if (mid.note.length > 500) throw new Error(`cobicistat note is ${mid.note.length} chars`);
    log.push('cobicistat — computed ki_uM 0.079 stripped from the midazolam edge');
  } else { log.push('cobicistat — interaction already stripped, skipped'); }
}

/** Routes declared with no parameters, and one route that is the wrong route. */
{
  const rop = need('ropivacaine');
  if (rop.pk?.IM) {
    rop.pk.SC = rop.pk.IM; delete rop.pk.IM;
    if (rop.half_life_hr?.IM != null) { rop.half_life_hr.SC = rop.half_life_hr.IM; delete rop.half_life_hr.IM; }
    if (rop.doses?.IM) { rop.doses.SC = rop.doses.IM; delete rop.doses.IM; }
    rop.routes = ['SC'];
    note(rop, 'ROUTE: THE SAME MISMATCH ALREADY CORRECTED ON BUPIVACAINE, AND ROPIVACAINE HAS NO INTRAMUSCULAR PRODUCT AT ALL. Both routes were declared with everything hung on the intramuscular one, while the citation is explicitly an INTRAVENOUS infusion in six healthy men; the subcutaneous route was a dangling declaration with no dose and no parameters. Moved, exactly as the sibling was. TWO FINDINGS TRAVEL WITH IT. NO TRANSPLANT WITH BUPIVACAINE — I CHECKED THE COLLISION I PREDICTED: one paper reports both drugs in a single sentence and THIS RECORD CORRECTLY STORES ITS OWN NUMBER, not the neighbour. And the pharmacokinetic pair is a class-12 case whose own abstract names the mechanism — "the disposition of ropivacaine can be described by a BIEXPONENTIAL function" — with a steady-state volume against a terminal half-life implying a clearance about half the paper own figure. A MATRIX QUESTION IS FLAGGED DIRECTIONALLY AND NOT ACTED ON: both that volume and that clearance are BLOOD-referenced while the solver is plasma-referenced, which would narrow the gap rather than close it, and no verbatim blood-to-plasma ratio was found.');
    log.push('ropivacaine — route IM → SC (no IM product exists; matches the bupivacaine fix)');
  } else { log.push('ropivacaine — route already moved, skipped'); }

  for (const [slug, dead] of [['vancomycin', 'PO'], ['alfentanil', 'IM']] as const) {
    const c = need(slug);
    if (!(c.routes ?? []).includes(dead)) { log.push(`${slug} — ${dead} route already removed, skipped`); continue; }
    c.routes = (c.routes ?? []).filter((r) => r !== dead);
    if (c.doses && dead in c.doses) delete c.doses[dead];
    if (c.half_life_hr && dead in c.half_life_hr) delete c.half_life_hr[dead];
    log.push(`${slug} — dangling ${dead} route removed (declared with no PK)`);
  }
}

/** References supporting nothing under any of the three purposes. */
{
  const c = need('oseltamivir');
  if ((c.refs ?? []).includes('PMID:36810140')) {
    c.refs = (c.refs ?? []).filter((r) => r !== 'PMID:36810140');
    log.push('oseltamivir — ref PMID:36810140 dropped (the removed source_pmid, left behind)');
  } else { log.push('oseltamivir — ref already dropped, skipped'); }
}

/** Records whose PK cannot be authored under the verbatim rule. */
const UNAUTHORED: { slug: string; reason: string; note: string; prose: string; summary: string }[] = [
  { slug: 'clomiphene', reason: 'mixture',
    note: 'A 3:2 mixture of two isomers with radically different disposition, and the literature says so: "The conventional model-dependent pharmacokinetics of clomiphene citrate isomers COULD NOT BE DETERMINED due to a very flat terminal half-life and the long-tailed residence time." No single-species curve is authorable.',
    prose: 'PK: STRIPPED. THE STORED HALF-LIFE APPEARS NOWHERE — its citation offers only the qualitative "The active Z isomer attained peak blood levels later than the inactive E isomer and was eliminated much more slowly, significant plasma concentrations still being detected up to 1 month after treatment" — and the stored figure is a label statement in days converted to hours. A PUBLISHED SENTENCE DECLARES THE RECORD UNAUTHORABLE OUTRIGHT: "The conventional model-dependent pharmacokinetics of clomiphene citrate isomers COULD NOT BE DETERMINED due to a very flat terminal half-life and the long-tailed residence time." The feasibility test agrees and does so for BOTH isomers at once: one needs an exposure-to-peak ratio of at least 173 h and observes 86, the other observes 4.3 — two orders apart — SO NOTHING REPRODUCES BOTH, and a mixture record must reproduce both. With the solver defaults the record was predicting a peak roughly forty-fold above the published total. The doses go too: only the lowest has any human data, the highest is off-label, and the typical figure is a computed artefact of the other two.',
    summary: 'clomiphene — STRIPPED to mixture (its own literature says the PK cannot be determined)' },
  { slug: 'dnp', reason: 'uncharacterized',
    note: 'No therapeutic human PK exists. The only half-life is n=1 from an acute-on-chronic overdose survivor; the largest live series implies 2.4-3.6× longer WITH haemoperfusion accelerating elimination, and states "DNP exhibits significant NONLINEAR pharmacokinetics ... attributed to nonlinear plasma protein binding and nonlinear partitioning into liver and kidney."',
    prose: 'PK: STRIPPED. THE STORED HALF-LIFE IS BETTER SOURCED THAN I FEARED AND STILL CANNOT STAND. Its source is a SURVIVOR with serial ante-mortem levels — "Serial DNP levels are plotted for this patient, demonstrating first order kinetics with a half-life of 18 h" — not the post-mortem redistribution artefact I expected, and the existing note is accurate; credit where it is due. BUT IT IS A SINGLE PATIENT IN ACUTE-ON-CHRONIC OVERDOSE, no therapeutic human pharmacokinetics exist at all, and the historical literature is indexed without abstracts and measures metabolic rate rather than disposition. THE LARGEST LIVE HUMAN SERIES CONTRADICTS IT: its verbatim clearance percentages imply a half-life two and a half to three and a half times longer, AND THAT IS WITH HAEMOPERFUSION ACCELERATING ELIMINATION. And one sentence settles it structurally: "DNP exhibits significant NONLINEAR pharmacokinetics, which we have attributed to nonlinear plasma protein binding and nonlinear partitioning into liver and kidney" — which the solver cannot represent at any parameter choice. The dose block is unsourced and, as this record own note concedes, OVERLAPS THE LETHAL RANGE.',
    summary: 'dnp — STRIPPED to uncharacterized (n=1 overdose survivor; published nonlinearity)' },
  { slug: 'lgd-4033', reason: 'research-only',
    note: 'The one human phase-1 study (76 men, 0.1-1.0 mg × 21 days) is correctly cited and its abstract states only "LGD-4033 had a long elimination half-life and dose-proportional accumulation upon multiple dosing" — no numeral. All 25 indexed hits swept: doping-control metabolite work, urinary detection windows, one equine and one rat study. No absolute PK parameter for the parent exists.',
    prose: 'PK: STRIPPED. MY PRIOR THAT A HUMAN PHASE-1 EXISTS WAS RIGHT AND IT IS CORRECTLY CITED — seventy-six men, three ascending doses, twenty-one days — BUT ITS ABSTRACT STATES ONLY "LGD-4033 had a long elimination half-life and dose-proportional accumulation upon multiple dosing", WITH NO NUMBER ANYWHERE, so the stored half-life came from full text or a secondary source. All twenty-five indexed hits were swept: doping-control metabolite identification, urinary detection windows, one EQUINE administration study, one rat model and a self-administration case report — NOT ONE ABSOLUTE PARAMETER FOR THE PARENT. IT DIFFERS FROM THE OTHER RESEARCH COMPOUNDS IN THAT HUMAN DATA GENUINELY EXIST, and is still unauthorable under the verbatim rule. A SEPARATE DOSE DEFECT GOES WITH IT: the stored range is ILLICIT dosing, five to ten times the highest dose ever given to a human in a study, paired with a half-life no abstract states.',
    summary: 'lgd-4033 — STRIPPED to research-only (its phase-1 abstract states no numeral)' },
];
for (const u of UNAUTHORED) {
  const c = need(u.slug);
  if (c.pk_unauthored) { log.push(`${u.slug} — already unauthored, skipped`); continue; }
  delete c.pk;
  c.half_life_hr = {};
  c.pk_unauthored = { reason: u.reason, note: u.note };
  if (u.note.length > 500) throw new Error(`${u.slug} pk_unauthored.note is ${u.note.length} chars`);
  note(c, u.prose);
  log.push(u.summary);
}

/** Findings that are real and correctly not acted on in data. */
const NOTE_ONLY: { slug: string; note: string; summary: string }[] = [
  { slug: 'everolimus',
    note: 'PK: MY MATRIX PRIOR IS REFUTED AND THE RECORD PICKED ONE MATRIX CONSISTENTLY. Both the apparent volume and the label clearance are WHOLE-BLOOD referenced and agree with each other, confirmed independently by a PLASMA-referenced analysis whose clearance is 8.6-fold larger — exactly this drug blood-to-plasma partition. Its internal arithmetic is among the best in the batch, reproducing the label exposure to a tenth of a percent. A LATENT TRAP IS DECLARED NOW RATHER THAN DISCOVERED LATER: the concentrations this record emits are WHOLE BLOOD, roughly eightfold above plasma, while the solver labels them plasma — so if anyone later authors a plasma free fraction or a plasma-referenced potency here, that becomes an eightfold live error overnight. THE FEASIBILITY FLOOR FAILS DECISIVELY AND UNFIXABLY: the label own peak, exposure and half-life sit three and a half fold below the minimum any one-compartment fit permits, so the record preserves exposure and pays on the peak, rendering it roughly four-fold low. THAT IS USER-VISIBLE AND NOT REPAIRABLE BY RE-TUNING ANY STORED FIELD. One reference supports nothing and CONTRADICTS: its only kinetic number is a half-life 1.7-fold longer than the stored one. It is KEPT because it supports the mechanism narrative, and its half-life is deliberately not adopted — at that value the one thing this record gets right would break.',
    summary: 'everolimus — whole-blood matrix acquitted; the floor fails unfixably, Cmax 3.94x low' },
  { slug: 'palonosetron',
    note: 'PK: THE RECORD THAT HOLDS UP. The half-life is verbatim twice over, the free fraction is verified from a verbatim binding percentage and honestly labelled review-grade, and the clearance the stored pair implies sits inside a verbatim published range. The feasibility identity is CORRECTLY NOT MANUFACTURED — for an intravenous-only record it degenerates into the clearance test — and the occupancy affinity was verified in the open-access full text exactly as its note claims, at a recombinant human receptor, so the free-fraction correction it receives is the right direction for that kind of measurement. The molecular weight is the free base, matching a dose expressed the same way, AND THE DOSE BLOCK IS RIGHT FOR A REASON WORTH RECORDING: the cited study dosed per kilogram while the stored figures are the actual FLAT LABEL doses, which is the opposite of the eleven records this batch found storing raw per-weight numbers. Only the volume is soft — inside two verbatim ranges but stated as a point value by nobody — and the arithmetic passes either way. ONE SOFT FLAG IS RANKED AS SOFT AND LEFT: a secondary paraphrase of a third paper reports late concentrations the model increasingly under-predicts, which is the signature of a terminal phase slower than the stored one, but it is a paraphrase of a secondary citation and this record own primary is satisfied.',
    summary: 'palonosetron — verified throughout; V is the only soft value and passes either way' },
  { slug: 'clenbuterol',
    note: 'PK: THE REAL DEFECT IS A FIELD THAT ISN\'T THERE. With no volume the solver silently substitutes half a litre per kilogram and a bioavailability of 0.9, and at the stored typical dose the model predicts a peak five-fold above what THIS RECORD OWN CITED PAPER OBSERVED. Back-solving that paper own figures puts the apparent volume five-fold higher than the default — BUT THAT IS COMPUTED, NOT VERBATIM, and no indexed clenbuterol abstract states a volume or a bioavailability at all, so the gap is logged rather than filled. The half-life is verbatim. The absorption rate is confirmed as a full-precision back-derivation, AND THE PEAK TIME IT WAS DERIVED FROM IS AN UPPER BOUND RATHER THAN A MEASUREMENT — "reached the maximum value ... WITHIN 2.5 h" — so the stored rate is a lower bound on the truth; defensible, and now recorded as derived from a bound. TWO TRAPS ARE FLAGGED FOR WHOEVER FILLS THE VOLUME GAP: the same abstract carries a plasma-binding percentage and a urinary-recovery percentage, both classic donors for a fabricated bioavailability, and a neighbouring paper that looks like a clenbuterol volume is MABUTEROL, a different drug.',
    summary: 'clenbuterol — no V_L, so the default renders Cmax 4.9x over its own paper; gap logged' },
];
for (const n of NOTE_ONLY) { const c = need(n.slug); note(c, n.note); log.push(n.summary); }

// ── length guards: the loader silently rejects over-long strings ──
const CAPS: [string, number][] = [['source_label', 300], ['note', 500]];
for (const c of data) {
  for (const [route, row] of Object.entries(c.pk ?? {})) {
    const sl = (row as Record<string, unknown>)?.source_label;
    if (typeof sl === 'string' && sl.length > 300) throw new Error(`${c.slug}.pk.${route}.source_label is ${sl.length} chars (cap 300)`);
  }
  if ((c.effect_compartment?.note?.length ?? 0) > 500) throw new Error(`${c.slug}.effect_compartment.note is ${c.effect_compartment!.note!.length} chars (cap 500)`);
  for (const [i, r] of (c.receptor_occupancy ?? []).entries()) {
    if ((r.note?.length ?? 0) > 600) throw new Error(`${c.slug}.receptor_occupancy[${i}].note is ${r.note!.length} chars (cap 600)`);
  }
  for (const [i, e] of (c.interactions ?? []).entries()) {
    if ((e.note?.length ?? 0) > 500) throw new Error(`${c.slug}.interactions[${i}].note is ${e.note!.length} chars (cap 500)`);
  }
  if ((c.pk_unauthored?.note?.length ?? 0) > 500) throw new Error(`${c.slug}.pk_unauthored.note is ${c.pk_unauthored!.note!.length} chars (cap 500)`);
}
void CAPS;

console.log(`\nbatch 10 — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) {
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwrote ${COMPOUNDS_PATH}`);
} else {
  console.log('\n(dry run — pass --write to apply)');
}
