/**
 * 2026-09-06-pharmacological-batch3.ts
 *
 * Third batch of the pharmacological category: 40 compounds, eight agents. This
 * batch was selected by re-running the templating triage, which put five records
 * at the top score of 12 — higher than batch 1's 9, against my own earlier note
 * that the signal was thinning. It was not.
 *
 * ── What this batch is actually about ────────────────────────────────────
 * Batches 1 and 2 established that a stored number is usually a REAL numeral from
 * the RIGHT paper attached to the WRONG quantity. Batch 3 shows how far that goes.
 * Stored values here turned out to be: a patient count (phenytoin V 50), a
 * randomisation ratio of 9:3 (brivaracetam t½ 9), a subject's mean body weight
 * (triazolam V 77), an age-range endpoint (triazolam F 0.44), a dosing duration in
 * days (valproate t½ 14), a plasma clearance in L/h (esomeprazole V 16), a dose in
 * grams (erythromycin t½ 1.5), an AUC in mg·h/L (isoniazid V 42), an inequality
 * bound (ibandronate V 90, from a review's "V > 90 L"), a four-weekly dosing
 * interval (haloperidol zo_dur 672) and the earliest sampling timepoint in a study
 * (pentazocine IM ka 17.55, implying a 2.4-minute absorption half-life).
 *
 * ── The shape that keeps recurring ──────────────────────────────────────
 * A PROTEIN-BINDING PERCENTAGE READ AS A BIOAVAILABILITY, third and fourth
 * instances: phenytoin F 0.9 from "approximately 90% bound to plasma proteins".
 * After terazosin and tiagabine in batch 2, this is the most reliably recurring
 * collision in the catalog.
 *
 * ── A defect class this batch names ─────────────────────────────────────
 * MATRIX ARTEFACT. cyclosporine's 280 L is 4.0 L/kg, the classic PLASMA figure,
 * for a drug whose reference matrix is WHOLE BLOOD (true value 2.88 L/kg).
 * acetazolamide's 17 L is a plasma-fitted volume for a drug that lives bound to
 * carbonic anhydrase inside erythrocytes. With chlorthalidone in batch 2 that is
 * three instances. tacrolimus is the control that shows the test works: its 105 L
 * is 1.5 L/kg, inside the whole-blood range, so it is merely unsourced.
 *
 * ── Records that lose PK entirely ───────────────────────────────────────
 * ibandronate repeats alendronate exactly — and worse: its cited study sampled
 * only "up to 48.0 hours", so a 240 h half-life cannot have come from it at all.
 * Two for two makes bisphosphonates a class rule. emoxypine's citation is a RABBIT
 * study containing no numeric PK value of any kind. velpatasvir is zero-content
 * four for four and has no IV formulation, so an absolute F cannot exist.
 * amoxicillin-clavulanate is a two-molecule product whose every value describes
 * amoxicillin, measured in obese subjects, under amoxicillin's molecular weight.
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
  slug: string; routes?: string[]; doses?: Record<string, unknown>;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  effect_compartment?: { approximated?: boolean; [k: string]: unknown };
  receptor_occupancy?: unknown[];
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const FIXES: { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'amoxicillin', guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { ka_hr: 1.02, V_L: 20.2, F: 0.765, source_pmid: 'PMID:7387142' }, IV: { V_L: 20.2, F: 1, source_pmid: 'PMID:3986077' } },
    hl: { PO: 1.7, IV: 1.7 }, refs: ['PMID:7387142', 'PMID:3986077'],
    note: 'PK: the old citation was an ORAL-ONLY bioequivalence study, so the intravenous row had no arm behind it, and its stored ka of 1.5 was the record own half-life numeral reused as a rate. Re-sourced to Arancibia 1980 (PMID:7387142), healthy fasted subjects dosed both ways: verbatim "The volume of distribution was 20.2 liters (0.30 liter/kg)", "recovery from the urine was 43.4% after the oral dose and 57.4% after the intravenous dose, indicating 76.5% bioavailability", and — rare in this audit — a genuine published absorption rate, "The absorption rate constant, kappa a, in the oral study, calculated by the Loo-Riegelman method, was 1.02 h-1, and the absorption half-life was 0.72 h", the two being internally consistent. Half-life 1.7 h from a true intravenous study (PMID:3986077). BOTH F AND ka ARE DOSE-SPECIFIC: absorption is carrier-mediated and saturable, so the 500 mg figures must not be carried to 875 or 1000 mg.',
    summary: 'amoxicillin — a GENUINE published ka (1.02/h) replaces its own half-life numeral; IV row re-sourced' },

  { slug: 'levofloxacin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 101.71, F: 1, source_pmid: 'PMID:29947489' }, IV: { V_L: 101.71, F: 1, source_pmid: 'PMID:16255991' } },
    hl: { PO: 6.5, IV: 6.5 }, refs: ['PMID:9333057', 'PMID:16255991', 'PMID:29947489'],
    note: 'PK: the cleanest zero-content case in its group — the cited paper reports only dose-normalised peak and exposure, and supports NONE of its seven values. The stored 7 h was a review range endpoint ("7 to 8 hours"), not a measurement; the real intravenous half-life at 500 mg is 6.5 h (PMID:16255991), rising to 7.75 h at 750 mg, so it is dose-specific. F 0.99 was RIGHT but wrongly cited; it belongs to Chien 1997 (PMID:9333057), 24 healthy men in a three-way oral-versus-intravenous crossover, verbatim "mean absolute bioavailability of > or =99%". No healthy-volunteer intravenous volume exists in any abstract, so V 101.71 L is APPARENT and F is pinned to 1 — which costs almost nothing here precisely because the real F is 99%. That paper also confirms the routes are interchangeable.',
    summary: 'levofloxacin — 6 of 7 values zero-content; F 0.99 re-cited; V now apparent with F pinned' },

  { slug: 'ciprofloxacin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 140, F: 0.837, source_pmid: 'PMID:2941278' }, IV: { V_L: 140, F: 1, source_pmid: 'PMID:6489326' } },
    hl: { PO: 4, IV: 4 }, refs: ['PMID:6489326'],
    note: 'PK: another correct-value-wrong-paper. The half-life of 4 h is verbatim in Wingender 1984 (PMID:6489326) — "The elimination half-life was about 4 h and the renal clearance was 4.75 ml/min . kg; both were independent of the route of administration", which also settles the route question affirmatively — while the CITED paper says 3.2 h and that oral is shorter still. V 200 L was never stated in any unit: it is 2.76 L/kg silently converted at an undeclared 72.5 kg. Replaced by the same paper Vss, "the total volume at steady state was 2.0 l/kg" (140 L at 70 kg), a true intravenous volume. F corrected 0.84 to the stated 83.7% — and that figure is scoped to a 100 mg dose. BIOAVAILABILITY IS GENUINELY CONTESTED AND DOSE-DEPENDENT: 83.7% at 100 mg, about 60% at 250 mg, 82% at 500 mg in patients with AIDS. Food reduces absorption 15-20%. ka 1.5 dropped; absorption carries a lag that LENGTHENS with dose, 0.34 to 0.53 h.',
    summary: 'ciprofloxacin — half-life right but from another paper; V 200 L was an undeclared weight conversion' },

  { slug: 'dipyridamole', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 141, F: 0.52, source_pmid: 'PMID:6579711' }, IV: { V_L: 141, F: 1, source_pmid: 'PMID:6579711' } },
    hl: { PO: 11.6, IV: 11.6 },
    note: 'PK: F 0.52 is verbatim and stands. The stored 12 h was NOT the paper measurement but a CHRONIC-DOSING accumulation estimate in 20 bypass patients ("the terminal half-life averaged about half a day"), displacing that same paper single-dose intravenous figure of 11.6 h. V 175 L appears nowhere; the stated value is 141 L. The corrected triple is self-consistent — clearance 138 ml/min with 141 L implies 11.8 h against the stated 11.6 — whereas the stored 175 L with 12 h implied a clearance 22% above the measured one. EFFECT IS STRONGLY DECOUPLED AND THE PD LAYER SHOULD BE TREATED AS UNVALIDATED: the drug is 99.13% protein bound, acts by potentiating ENDOGENOUS adenosine, and one study states outright that "dipyridamole concentrations did not correlate with changes in diastolic or systolic blood pressure, or heart rate". A reference in this record is a GUINEA-PIG receptor paper with no pharmacokinetics at all. ka 2.59 dropped; absorption is pH-gated, and in one study two of twenty patients had UNDETECTABLE levels, which no first-order rate can represent.',
    summary: 'dipyridamole — half-life was a chronic-dosing estimate; V 175 -> 141 L; effect layer flagged unvalidated' },

  { slug: 'omeprazole', guard: (c) => c.pk?.PO?.ka_hr === 4,
    pk: { PO: { V_L: 16.1, F: 0.39, source_pmid: 'PMID:2315973' }, IV: { V_L: 16.1, F: 1, source_pmid: 'PMID:2315973' } },
    hl: { PO: 0.58, IV: 0.58 }, refs: ['PMID:2315973', 'PMID:2044903'],
    note: 'PK re-sourced wholesale to Regardh 1990 (PMID:2315973), 8 young healthy subjects given 10 mg intravenously and 20 mg orally: verbatim "Mean Vss was 0.23 +/- 0.04 L/kg" (16.1 L at 70 kg, a TRUE volume), "The median bioavailability was 39% (25-117%)", and "t1/2 for the i.v. dose was 35 min (16-150 min) and 39 min (14-186 min) after oral administration" — the two agreeing, so one disposition value serves both routes. The stored 12 L was pantoprazole figure. The stored 0.6 h was verbatim but is the CYP2C19 HOMOZYGOUS-EXTENSIVE-METABOLISER subgroup alone: the same abstract gives 1.1 h heterozygous and 2.8 h poor, a 4.7-fold spread with an 8-fold exposure spread, so no scalar is defensible without a genotype covariate. THE EFFECT IS DECOUPLED ABOUT FIFTEEN-FOLD AND ANY DOSING MODEL DRIVEN OFF THIS HALF-LIFE IS INVALID: binding is covalent, and in one study the same patients showed half-lives of 2.3 h against durations of action of 34 h, with acid secretion normal only after 3-4 days. ka 4 dropped: absorption is modelled zero-order WITH A LAG measured at 0.62 h, a property of the enteric coat.',
    summary: 'omeprazole — V was pantoprazole value; half-life is an EM-subgroup figure; effect decoupled ~15x' },

  { slug: 'esomeprazole', guard: (c) => c.pk?.PO?.ka_hr === 4,
    pk: { PO: { F: 0.64, source_pmid: 'PMID:11214773' }, IV: { F: 1, source_pmid: 'PMID:11214773' } },
    hl: { PO: 1.7, IV: 1.7 }, refs: ['PMID:11286324'],
    note: 'PK: V 16 L WAS A PLASMA CLEARANCE. The cited abstract states no volume at all; what it states is "Plasma clearance (CL) of esomeprazole decreased from 22 l/h to 16 l/h" — a clearance in litres per hour stored as a volume in litres. A new collision shape. The half-life of 1.5 h was that paper stated TMAX; the real figure is 1.7 h (PMID:11286324, though in elderly subjects at day 5). F corrected 0.7 to the stated 64%, the 40 mg capsule single-dose value; the stored figure was a rounding of the day-5 20 mg SOLUTION arm. NO HUMAN VOLUME EXISTS in any abstract found, so V is dropped and the resolver default overstates it roughly two-fold — logged rather than guessed. THIS IS THE S-ENANTIOMER of omeprazole and the two records are not interchangeable: its bioavailability is about double the racemate. Effect decoupling and the enteric-coat lag apply here exactly as for omeprazole.',
    summary: 'esomeprazole — V 16 L was a CLEARANCE in L/h; half-life was a Tmax; F was the wrong dose arm' },

  { slug: 'pantoprazole', guard: (c) => c.pk?.PO?.ka_hr === 4,
    pk: { PO: { V_L: 11.9, F: 0.77, source_pmid: 'PMID:8405016' }, IV: { V_L: 11.9, F: 1, source_pmid: 'PMID:8405016' } },
    hl: { PO: 1.9, IV: 1.9 }, refs: ['PMID:8405016'],
    note: 'PK: the one proton-pump inhibitor whose NUMBERS were right and whose CITATION was wrong. V 11.9 L and F 0.77 are both verbatim in Pue 1993 (PMID:8405016) — "The apparent volume of distribution estimated at steady state (0.17 l.kg-1)" and "the absolute systemic bioavailability of the compound was estimated as 77% (95% CI, 67 to 89%)" — a paper already sitting in this record references while the source_pmid pointed at an oral-only genotype study that states neither. That study is also the intravenous arm the row needed. Half-life corrected 1 to the stated 1.9 h. ka 4 dropped: the same paper describes "a variable onset of absorption", a lag rather than a rate, and the lag is a property of the enteric coat that disappears with a bicarbonate suspension. The same effect-decoupling flag as the other two applies.',
    summary: 'pantoprazole — right numbers, wrong paper; the correct one was already in its own refs' },

  { slug: 'clarithromycin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.52, source_pmid: 'PMID:1387301' }, IV: { F: 1, source_pmid: 'PMID:1387301' } },
    hl: { PO: 5, IV: 5 }, refs: ['PMID:1387301', 'PMID:9797791'],
    note: 'PK: zero-content on all four, and the intravenous row hung on an oral-only study. Re-sourced: F 0.52 from Chu 1992 (PMID:1387301), 22 healthy volunteers in a three-way crossover against an intravenous lactobionate infusion, verbatim "the mean absolute bioavailabilities of the two oral formulations were 52 and 55%"; half-life 5 h from PMID:9797791 at 500 mg twice daily. THE HALF-LIFE IS DOSE-DEPENDENT, NOT A CONSTANT: 2.3 to 6.0 h across 100 to 1200 mg, and 3.3 h at 250 mg. NO HUMAN VOLUME EXISTS in any abstract — the only intravenous steady-state volume found anywhere is in FOALS at 10.4 L/kg — so V 250 L is dropped without replacement. ACTIVE 14-HYDROXY METABOLITE: oral dosing yields markedly more of it than intravenous because of marked first-pass metabolism, so a scalar bioavailability on the parent understates oral antibacterial exposure. Kinetics are saturable and non-linear, so a linear rate constant is structurally wrong too. Four references were victim-drug studies in which this drug is the perpetrator and which state no clarithromycin parameter.',
    summary: 'clarithromycin — zero-content; no human volume exists anywhere; 4 non-substantiating refs found' },

  { slug: 'erythromycin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 57.6, F: 0.335, source_pmid: 'PMID:7107981' }, IV: { V_L: 57.6, F: 1, source_pmid: 'PMID:3606934' } },
    hl: { PO: 2, IV: 1.6 }, refs: ['PMID:7107981', 'PMID:3606934'],
    note: 'PK: THE STORED HALF-LIFE WAS A DOSE IN GRAMS. The cited abstract states no half-life anywhere; its only 1.5 is "erythromycin stearate, 1.5 g", appearing three times. That paper is also unusable in principle for a generic oral row, because it compares a SALT (stearate, 1.5 g) against a PRODRUG ESTER (ethylsuccinate, 3.0 g) — two molecules at two doses — and it has no intravenous arm. Re-sourced to Hall 1982 (PMID:7107981), 6 normal volunteers dosed intravenously and as enteric-coated tablets: "The elimination half-life was 1.6 +/- 0.7 hours after the intravenous dose and 2.0 +/- 0.7 hours after the oral dose" and "The systemic availability of erythromycin was 33.5 per cent". THE ROUTE SPLIT IS REAL HERE and is kept: the oral value is 25% longer in the same subjects, a mild flip-flop from the enteric coat. V 57.6 L is a true steady-state volume from PMID:3606934. HAZARD LOGGED: that paper protein-binding figures, 30.5% unbound in normals and 58.3% in cirrhotics, must never migrate into a bioavailability field.',
    summary: 'erythromycin — its half-life was a 1.5 GRAM DOSE; cited paper compared a salt against a prodrug ester' },

  { slug: 'propranolol', guard: (c) => c.pk?.PO?.V_L === 280,
    pk: { PO: { V_L: 161, F: 0.6, source_pmid: 'PMID:7098380' }, IV: { V_L: 161, F: 1, source_pmid: 'PMID:7098380' } },
    hl: { PO: 3.8, IV: 5.3 }, refs: ['PMID:7098380', 'PMID:3000793'],
    note: 'PK: zero-content on all five, and the intravenous row hung on an oral-only study. Re-sourced to Ochs 1982 (PMID:7098380), 6 healthy volunteers given 20 mg intravenously and 80 mg orally in crossover: "volume of distribution, 2.3 (+/- 0.3) l/kg" (161 L at 70 kg, a TRUE volume), "elimination half-life (t 1/2 beta), 5.3 (+/- 0.6) h", "After single oral doses, t 1/2 beta (3.8 +/- 0.2 h) tended to be smaller", and "actual systemic availability (0.60 +/- 0.07)". NOTE THE SHARED 280 L WAS WRONG FOR THIS DRUG TOO — it was not a correct propranolol figure copied onto metoprolol, it was sourced for neither. F 0.60 is far above the stored 0.25 and above the textbook 25-30% because first-pass is SATURABLE and dose-dependent; it is also food- and comedication-sensitive, and no cited population is CYP2D6-genotyped, so a scalar is an approximation. EFFECT IS NOT MEANINGFULLY DECOUPLED, which is itself well evidenced: "the concentrations of antagonist present in plasma are representative of the concentrations in the effect compartment". The real complication is a stimulus-dependent potency — the concentration-effect curve shifts 2-3 fold rightward on exercise.',
    summary: 'propranolol — zero-content; the shared 280 L was sourced for neither beta-blocker; F 0.25 -> 0.60' },

  { slug: 'metoprolol', guard: (c) => c.pk?.PO?.V_L === 280,
    pk: { PO: { V_L: 175, F: 0.5, source_pmid: 'PMID:7333059' }, IV: { V_L: 175, F: 1, source_pmid: 'PMID:3443140' } },
    hl: { PO: 4.2, IV: 4.2 }, refs: ['PMID:7333059', 'PMID:3443140'],
    note: 'PK: zero-content on all five; the intravenous row hung on a single-oral-dose study. Re-sourced: V 175 L from Schaaf 1987 (PMID:3443140), verbatim "smokers (S) and nonsmokers (NS) was that S had a larger steady-state volume of distribution (3.3 vs 2.5 l/kg)" — the non-smoker figure, an intravenous-infusion steady-state volume; half-life 4.2 h and F 0.50 from Regardh 1981 (PMID:7333059), verbatim "The mean fraction of the drug available systematically was 84 +/- 10% in patients and 50 +/- 11% in a control group of 6 healthy subjects" (the healthy-control arm, NOT the cirrhotic one). A SINGLE SCALAR BIOAVAILABILITY IS EMPHATICALLY WRONG HERE: clearance differs more than ten-fold between CYP2D6 poor and ultrarapid metabolisers (31 against 367 L/h), between-subject F spans 15 to 92%, and first-pass is saturable, F rising from 31% to 46% between 20 and 100 mg. BUT THE EFFECT IS BUFFERED AGAINST THAT: despite the ten-fold clearance spread, pharmacodynamics "differed only by less than 2-fold", so a model predicting effect from the plasma curve will overstate the genotype spread roughly five-fold.',
    summary: 'metoprolol — zero-content; >10x genotype clearance spread but <2x effect spread' },

  { slug: 'quinidine', guard: (c) => c.pk?.PO?.V_L === 200,
    pk: { PO: { V_L: 177, F: 0.7, source_pmid: 'PMID:512840' }, IV: { V_L: 177, F: 1, source_pmid: 'PMID:512840' } },
    hl: { PO: 10.34, IV: 5.7 }, refs: ['PMID:512840'],
    note: 'PK: the best-cited record in its group. The oral half-life 10.34 h is verbatim and stands, as does the effect-compartment value. F 0.7 is exactly right but belonged to Guentert 1979 (PMID:512840), not the cited interaction study — verbatim "The mean oral bioavailability of quinidine was 0.70 +/- 0.17" — and that paper also supplies a true intravenous volume, "Vdarea: 2.53 +/- 0.72 liter/kg" (177 L at 70 kg). The stored 200 L appears nowhere; the only volume in the CITED abstract belongs to DIGOXIN. The intravenous row now carries 5.7 h, the value measured after intravenous dosing, since 10.34 h is an oral steady-state figure. ABSORPTION IS ZERO-ORDER, stated outright: "Absorption was in most cases best described by a zero-order rather than by a first-order process" — so the stored rate was structurally wrong, not merely uncited. F 0.70 is an oral SOLUTION figure; sustained-release tablets differ (78-87%). Three references are CYP2D6-inhibition studies containing no quinidine pharmacokinetics.',
    summary: 'quinidine — F right but from another paper; V 200 L was DIGOXIN volume; absorption is zero-order' },

  { slug: 'hydralazine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 408, F: 0.313, source_pmid: 'PMID:7438695' }, IV: { V_L: 408, F: 1, source_pmid: 'PMID:7438689' } },
    hl: { PO: 0.9, IV: 0.9 }, refs: ['PMID:7438689', 'PMID:7381691'],
    note: 'PK: the stored 3 h contradicts its own citation, which says 4 to 6 h — AND BOTH ARE WRONG. The companion intravenous study by the same group (PMID:7438689) gives "terminal half-life, t1/2 (53.7 min, harmonic mean)" and explains the discrepancy: "Reports based on nonselective assay methods have underestimated CLT, Vd ss, and Vd area and have overestimated the t1/2 of hydralazine", because the drug circulates largely as a hydrazone whose own half-life is 239 min. V 408 L is that paper Vd,area of 5.83 L/kg, chosen over its steady-state 1.83 L/kg because it is the one consistent with the terminal half-life and the stated clearance. F 0.313 IS A SINGLE PHENOTYPE STRATUM, NOT A POPULATION VALUE, and is now labelled as such: the same sentence gives 9.5% and 6.6% for fast acetylators against 31.3% and 39.3% for slow, a six-fold split, and first-pass is additionally SATURABLE so bioavailability rises with dose. The slow-acetylator single-dose arm is stored as the higher-exposure case. The intramuscular route is removed: no cited paper supports it.',
    summary: 'hydralazine — half-life 3 h wrong and so is its paper 4-6 h; the truth is 54 min. F is one phenotype arm' },

  { slug: 'dantrolene', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 26.1, source_pmid: 'PMID:16301243' }, IV: { V_L: 26.1, F: 1, source_pmid: 'PMID:16301243' } },
    hl: { PO: 10, IV: 10 }, refs: ['PMID:16301243', 'PMID:3057938'],
    note: 'PK: the route-split half-life is resolved in favour of the intravenous value. The stored oral 15 h is absorption rate-limited and appears nowhere in its cited paper, which states no pharmacokinetic parameter at all; the oral 15.8 h that does exist elsewhere is attributed by its own authors to "continued absorption of dantrolene in the postoperative period". Adults and children agree on 10 h, so one disposition value serves both routes — though the verbatim source for it is a PAEDIATRIC study (children aged 2 to 7), which also condemns the stored 56 L, a volume physiologically impossible for a small child. The adult figure is 26.1 L, the sum of the two compartment volumes in Podranski 2005 (PMID:16301243), flagged as arithmetic rather than a quoted total. F 0.7 IS DELETED WITHOUT REPLACEMENT: no human absolute bioavailability exists in any species-appropriate abstract — the only absolute figure found anywhere is 39% in HORSES. The old citation is retained as a PHARMACODYNAMIC reference, since it does support one thing: plasma and effect correlate in healthy volunteers but "No relationship between the plasma concentration of dantrolene sodium and its effect could be established in patients".',
    summary: 'dantrolene — oral 15 h was absorption-limited; V 56 L came from a paediatric study; F has no human source' },

  { slug: 'phenytoin', guard: (c) => c.pk?.PO?.mm_vmax_per_hr === 0.53,
    pk: { PO: { V_L: 50, mm_vmax_per_hr: 0.453, mm_km_mg_per_l: 4.03, source_pmid: 'PMID:27174459' }, IV: { V_L: 50, F: 1, mm_vmax_per_hr: 0.453, mm_km_mg_per_l: 4.03, source_pmid: 'PMID:27174459' } },
    hl: {}, refs: ['PMID:383353'],
    note: 'PK: the Michaelis constant 4.03 mg/L is verbatim and stands, but it is the CYP2C9 *1/*1 SUBGROUP value — the same abstract gives 5.96 for *1/*3 — so storing it unqualified silently asserts a genotype. The maximum rate is corrected: 0.53 appears nowhere, the paper states "Vmax=22.66.(BWT/60.96)0.454(mg/h)", an AMOUNT rate, and 22.66 mg/h over the 50 L reference volume gives 0.453. That volume and that rate now travel as a declared pair; neither is independently sourced, and 50 L itself collides with the abstract "additional 50 patients". THE FIXED HALF-LIFE IS REMOVED: with these parameters the apparent half-life is about 25 h at 15 mg/L and 9 h at 5 mg/L, so a stored 19 h was a first-order leftover contradicting the record own saturable model. It was in any case inert, since the solver ignores a rate constant on a saturable route. F 0.9 IS DELETED AS A PROTEIN-BINDING PERCENTAGE — a reference on this very record says "approximately 90% bound to plasma proteins" — and an oral bioavailability is ill-defined here anyway, because exposure after a test dose varies with the background concentration. Values are TOTAL drug; free fraction rises on valproate co-therapy. Saturable elimination is a DISPOSITION property, so the Michaelis parameters are carried on both routes.',
    summary: 'phenytoin — Vmax 0.53 stated nowhere (0.453); F 0.9 was PROTEIN BINDING; fixed half-life removed' },

  { slug: 'valproate', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 14.2, F: 1, source_pmid: 'PMID:15199078' }, IV: { V_L: 14.2, F: 1, source_pmid: 'PMID:8218957' } },
    hl: { PO: 15.9, IV: 15.9 }, refs: ['PMID:8218957', 'PMID:12576164', 'PMID:15199078'],
    note: 'PK: purest zero-content in its group — the cited paper states none of the four values, and the two numerals that superficially match belong to the OTHER drug in that interaction study. The stored 14 h was its phrase "after 14 DAYS of zonisamide treatment", a dosing duration read as a half-life. Re-sourced to Hussein 1993 (PMID:8218957), 16 healthy men given 1000 mg intravenously: "an average terminal-phase half-life of 15.9 h" and terminal volumes of "14.2-15.1 l", the lower stated endpoint being carried. THE STORED 9 L WAS BELOW EVERY INTRAVENOUS-MEASURED ADULT VALUE, and 9 appears in the literature as the UNBOUND FRACTION IN PERCENT at 45 mg/L — the same collision shape again. F 1 is now sourced: absolute bioavailability of the delayed-release form is "approximately 100%". BINDING IS SATURABLE, unbound fraction moving from 15% to 9% across the therapeutic range, so total-drug volume is itself concentration-dependent and a single value is an approximation. DEPOT TRAP LOGGED: the extended-release form has F 0.896 and releases at a CONSTANT ZERO-ORDER RATE over about 22 h, so an ER route must never inherit this row absorption or bioavailability.',
    summary: 'valproate — half-life 14 was a 14-DAY dosing duration; V 9 L below every measured value' },

  { slug: 'brivaracetam', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 1, source_pmid: 'PMID:27346728' }, IV: { F: 1, source_pmid: 'PMID:27346728' } },
    hl: { PO: 8, IV: 8 }, refs: ['PMID:27346728', 'PMID:17908923'],
    note: 'PK: THE STORED HALF-LIFE WAS A RANDOMISATION RATIO. The cited abstract says "eliminated (t(1/2) 7-8 h)", and the only 9 in it is "or placebo (9 : 3)", the active-to-placebo allocation. The upper stated endpoint, 8 h, is now carried and is independently corroborated. F 1 was not measured in the cited paper, which has no intravenous arm at all; it is re-cited to Stockis 2016 (PMID:27346728), a five-period crossover in 25 participants that DOES include a 100 mg intravenous bolus and found bioequivalence with the tablets — which legitimises the intravenous row at the same time. Honest caveat: that study reports bioequivalence confidence limits rather than a point estimate, so F of 1 reads as an exposure ratio within 0.80 to 1.25 rather than a measured unity. Complete absorption and low protein binding are separately confirmed. V 40 L is dropped as unstated — the cited paper says only that volume was "slightly lower than total body water" — which leaves the resolver default, and that default happens to sit close to the qualitative description. ka 1.4 dropped against a stated time to peak of about 2 h.',
    summary: 'brivaracetam — half-life 9 h was the 9:3 RANDOMISATION RATIO; F re-cited to a study with an IV arm' },

  { slug: 'acetazolamide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:27300254' }, IV: { F: 1, source_pmid: 'PMID:27300254' } },
    hl: { PO: 6, IV: 6 }, refs: ['PMID:27300254', 'PMID:3986087'],
    note: 'PK: both cited papers are unusable — one is a narrative review of off-label uses, the other an IN-VITRO medicinal-chemistry paper using this drug only as a reference inhibitor — so all five values were unsupported and the stored 8 h was the upper endpoint of that review 4-8 h range. NO SINGLE HALF-LIFE IS DEFENSIBLE: the therapeutic-dose value is 3 to 6 h but a microdose gives 24.5 h, an EIGHT-FOLD DOSE DEPENDENCE, because the erythrocyte carbonic-anhydrase binding capacity saturates. The upper therapeutic endpoint is stored. V 17 L IS A MATRIX ARTEFACT and is deleted: the dominant compartment is the ERYTHROCYTE, whose own sequestration half-life is 50.2 h and whose concentrations run five to ten times plasma, and the apparent volume demonstrably halves when salicylate displaces the drug. For a related carbonic-anhydrase inhibitor, fitting the same data in plasma against whole blood gave volumes of 559 and 7.6 L. F is dropped: the only bioavailability studies found are relative lot-comparisons, one of which reports bio-INEQUIVALENCE between tablet lots, and absorption rate is likewise formulation-lot-specific.',
    summary: 'acetazolamide — both citations unusable; V 17 L is a plasma artefact for an erythrocyte-bound drug' },

  { slug: 'triazolam', guard: (c) => c.pk?.PO?.V_L === 77,
    pk: { PO: { F: 0.44, source_pmid: 'PMID:7593708' } },
    hl: { PO: 2.6 }, refs: ['PMID:7593708', 'PMID:3950055'],
    note: 'PK: the half-life 2.6 h is verbatim and stands, and so does the effect-compartment value, whose stored note quotes its paper accurately and converts correctly from "the mean plasma effect site equilibration half-life was 9.4 minutes" — the one properly-sourced effect model in its group, with documented hysteresis, "Peak plasma triazolam concentrations preceded maximum pharmacodynamic effects". TWO COLLISIONS ARE REMOVED. V 77 L was the study subjects "mean body weight of 77 kg". F 0.44 was the endpoint of "aged 20-44 years" — and the cited study, being oral-only, could not have measured an absolute bioavailability at all. The VALUE 0.44 is nonetheless correct and is re-cited to Kroboth 1995 (PMID:7593708), a three-way crossover with a real intravenous arm: "the observed mean absolute availability was 44% (oral) and 53% (sublingual)". NO VOLUME IS STORED, deliberately: every published triazolam volume is apparent, so pairing one with this measured bioavailability would divide the dose by F twice. ka 1.5 dropped; the only genuine absorption figures are time-of-day dependent, 13.3 minutes in the morning against 21.9 in the evening.',
    summary: 'triazolam — V 77 L was BODY WEIGHT, F 0.44 an AGE RANGE; the value is right, from another paper' },

  { slug: 'methotrexate', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 38, F: 0.7, source_pmid: 'PMID:2715941' }, IV: { V_L: 38, F: 1, source_pmid: 'PMID:2715941' } },
    hl: { PO: 6, IV: 6 }, refs: ['PMID:2715941', 'PMID:3199396'],
    note: 'PK: zero-content on the whole oral block, and the intravenous row hung on an oral-only study. Re-sourced to Herman 1989 (PMID:2715941), 41 patients dosed 10 mg/m2 orally and intravenously a week apart: "the oral bioavailability was 0.70", "The terminal half-life was approximately 6 h", and "The volumes of distribution at steady state and for the central compartment were 22.2 and 13.5 L/m2" — the steady-state figure scaled at 1.73 m2 gives 38 L, an intravenous-derived TRUE volume. The stored 8 h was the upper endpoint of a review "5 to 8 hours". F 0.70 IS VALID ONLY AT LOW DOSE: absorption is saturable, and a 50 mg oral dose yields only 1.1 to 2.7 times the exposure of 15 mg, so above roughly 25 mg this over-predicts. The subcutaneous and intramuscular routes on this record ARE supportable — "Intramuscular and subcutaneous injections of methotrexate result in comparable pharmacokinetics, suggesting that these routes of administration are interchangeable" — though no absorption rate exists for either. EFFECT IS DECOUPLED: "No clear relationship between pharmacokinetic parameters and clinical response has been demonstrated", and the active polyglutamates are retained inside cells.',
    summary: 'methotrexate — zero-content; half-life was a range endpoint; F 0.7 valid only below ~25 mg' },

  { slug: 'cyclosporine', guard: (c) => c.pk?.PO?.V_L === 280,
    pk: { PO: { V_L: 202, F: 0.27, source_pmid: 'PMID:3058372' }, IV: { V_L: 202, F: 1, source_pmid: 'PMID:3058372' } },
    hl: { PO: 12.8, IV: 12.8 }, refs: ['PMID:3058372', 'PMID:8165192'],
    note: 'PK: the worst-cited record in its batch — its source was a REVIEW that administered no route at all and whose abstract contains a single number, about a dosing threshold, with all six values hung on it. THE STORED 280 L IS ALSO A MATRIX ARTEFACT: it is 4.0 L/kg, the classic PLASMA figure, for a drug whose reference matrix is WHOLE BLOOD because it partitions into erythrocytes in a haematocrit-dependent way. Re-sourced to PMID:3058372, renal transplant recipients measured in whole blood by HPLC: "a volume of distribution of 2.88 +/- 1.1 L/kg" (202 L at 70 kg, intravenous-derived), "the bioavailability ranged from 0.11 to 0.47, with a mean value of 0.27", and "the elimination half-life was 12.8 +/- 3.8 hours". FORMULATION CAVEAT: no cited paper used NEORAL. Sandimmune absorption is saturable, its exposure rising "in a less than proportional manner with respect to dose", while the microemulsion is linear and delivers 174 to 239% of it — so one bioavailability cannot cover both products. A reference on this record contains no cyclosporine at all.',
    summary: 'cyclosporine — cited a review that dosed nothing; 280 L was a PLASMA volume for a whole-blood drug' },

  { slug: 'tacrolimus', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 69, F: 0.2, source_pmid: 'PMID:10348790' }, IV: { V_L: 69, F: 1, source_pmid: 'PMID:9246018' } },
    hl: { PO: 12, IV: 12 }, refs: ['PMID:9246018', 'PMID:8787947'],
    note: 'PK: F 0.2 is verbatim and stands ("The oral bioavailability was about 20%"). The other values were misattributed: the half-life of 12 h is real but belongs to PMID:8787947, "The mean disposition half-life is 12 hours" — explicitly a disposition value, so route-independence is correct — while the paper it was cited to states 44 h. V 105 L is replaced by 69 L, the steady-state volume of 0.99 L/kg measured in WHOLE BLOOD after intravenous dosing (PMID:9246018). Tacrolimus is the control case for the matrix test and it PASSES: 105 L is 1.5 L/kg, inside the whole-blood range, whereas a plasma-referenced volume would have been roughly fifteen times larger. So it was unsourced, not artefactual. A SINGLE SCALAR BIOAVAILABILITY IS NOT DEFENSIBLE: five verified sources give 14%, about 20%, about 25%, 11 to 19%, and 31 to 49% in bone-marrow transplant patients, a three-and-a-half-fold spread. The transdermal route is removed: topical tacrolimus is an ointment with negligible systemic absorption. A reference on this record contains no tacrolimus at all.',
    summary: 'tacrolimus — F verbatim; half-life cited to a paper saying 44 h; TD route removed as non-systemic' },

  { slug: 'mycophenolate', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.941, source_pmid: 'PMID:8728345' }, IV: { F: 1, source_pmid: 'PMID:8728345' } },
    hl: { PO: 17, IV: 17 }, refs: ['PMID:8728345'],
    note: 'PK: WRONG ANALYTE, CONFIRMED BY MASS. The stored molecular weight of 433.5 is mycophenolate MOFETIL, the prodrug ester, while every measured value describes MYCOPHENOLIC ACID at 320.34 — the cited paper says so outright, and another states that "After oral administration, however, plasma MMF was below quantitation limits at all times". Any dose-to-mole conversion here is off by the 1.353 ester factor; that is a schema question and is logged, not silently changed. F 0.941 is real but belonged to PMID:8728345, "mean bioavailability of MPA from oral administration of MMF estimated as 94.1% relative to the intravenous route"; the cited paper 101.5% is a test-versus-reference FORMULATION RATIO. Half-life 17 h from the same paper, explicitly route-independent. V 40 L is dropped: it is roughly eight times smaller than the only published volume, and that one is apparent. ENTEROHEPATIC RECIRCULATION: a secondary peak at 8 to 12 hours contributes about 40% of exposure, and no single first-order absorption term can reproduce it — which is why the stored rate of 4, though within rounding of a real published 4.1, is dropped rather than kept.',
    summary: 'mycophenolate — mw is the prodrug, every value is the active acid; F right but from another paper' },

  { slug: 'itraconazole', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 672, F: 1, source_pmid: 'PMID:17048974' }, IV: { V_L: 672, F: 1, source_pmid: 'PMID:17048974' } },
    hl: { PO: 21, IV: 21 }, refs: ['PMID:17048974', 'PMID:9884817'],
    note: 'PK: the half-life 21 h is verbatim and stands, with a caveat that matters — it is a SINGLE-DOSE CAPSULE terminal value in a drug whose own cited abstract calls its elimination saturable and reports a SEVEN-FOLD exposure accumulation at steady state, so it does not describe repeated dosing. All five references were perpetrator interaction studies containing no itraconazole parameter. V 700 L was APPARENT and was paired with an independent bioavailability, a live double-division; F is now pinned to 1 and the volume re-cited to the published apparent figure of 672 L. F 0.55 IS A DIGIT COLLISION WITH TWO READINGS — an absolute "about 55%" in a review, and a capsule-to-solution RELATIVE ratio of 0.55 — and no scalar is defensible in any case: the capsule delivers barely half of the oral solution, food significantly increases absorption, and the kinetics are explicitly saturable. ACTIVE METABOLITE: hydroxy-itraconazole has comparable in-vitro activity at two to three times the parent concentration, so a parent-only curve understates active exposure roughly three-fold.',
    summary: 'itraconazole — all 5 refs were DDI studies with no PK; apparent V was double-divided by F' },

  { slug: 'acetaminophen', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 50.8, F: 0.822, mm_vmax_per_hr: 1.94, mm_km_mg_per_l: 14.66, mm_linear_ke_hr: 0.164, source_pmid: 'PMID:18759860' }, IV: { V_L: 50.8, F: 1, mm_vmax_per_hr: 1.94, mm_km_mg_per_l: 14.66, mm_linear_ke_hr: 0.164, source_pmid: 'PMID:18759860' } },
    hl: { PO: 2.5, IV: 2.5 }, refs: ['PMID:28419483', 'PMID:1487229', 'PMID:7002186'],
    note: 'PK: the saturable architecture is RIGHT and is kept — sulphation is saturable with a Michaelis constant of 14.66 mg/L, inside the therapeutic range, while glucuronidation sits about seventy times above peak concentrations and is legitimately linear. But all three values are DERIVED, NOT QUOTED: they reproduce exactly from the abstract millimolar figures only under a 70 kg weight and a 60 L volume the paper never states, and that volume was itself unsourced, making the derivation circular. The volume is now sourced independently (50.8 L, PMID:28419483) and the maximum-rate field keeps a unit caveat, since the quantity is mg/L/h rather than a rate constant. F 0.822 replaces an unsourced 0.88. The half-life is re-sourced to a stated range endpoint and is consistent with what the saturable pair already implies, about 2.34 h — and it is in any case INERT, because the solver ignores a first-order rate on a saturable route. THE PAPER THIRD PATHWAY IS NOT MODELLED: the glutathione route that matters in overdose. A reference on this record was a WARFARIN review.',
    summary: 'acetaminophen — MM values are derived not quoted, and were circular with an unsourced volume' },

  { slug: 'tramadol', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 216, F: 0.706, source_pmid: 'PMID:10719611' }, IV: { V_L: 216, F: 1, source_pmid: 'PMID:9638309' } },
    hl: { PO: 5.5, IV: 5.2 }, refs: ['PMID:9638309'],
    note: 'PK: F 0.706 is verbatim and stands, but it is FORMULATION-SPECIFIC — oral drops without ethanol. The half-life 5.5 h is real yet belonged to PMID:9638309, which also gives the intravenous value as 5.2 h and the only true volume, "216 +/- 21 l (Vd,beta)". ANALYTE CAVEAT THAT CHANGES THE MEANING OF F: every stored value describes PARENT tramadol, while the opioid activity is carried by the CYP2D6-dependent O-desmethyl metabolite. So 0.706 is defensible only as the fraction reaching the circulation as parent, and is not a bioavailability of effect; in poor metabolisers parent exposure is unchanged or higher while the active metabolite collapses. ka 2 is dropped even though a real value exists, because absorption rate here is strongly formulation-dependent — absorption half-lives of 0.23, 0.34 and 0.38 h across three oral forms of the same drug — and every published figure comes bundled with a lag time this schema cannot represent, so a bare rate would predict onset too early.',
    summary: 'tramadol — half-life belonged to another paper; F describes parent, not the active metabolite' },

  { slug: 'pentazocine', guard: (c) => c.pk?.IM?.ka_hr != null,
    pk: { PO: { V_L: 389, F: 0.184, source_pmid: 'PMID:923183' }, IV: { V_L: 389, F: 1, source_pmid: 'PMID:923183' }, IM: { V_L: 389, source_pmid: 'PMID:3709032' } },
    hl: { PO: 2.95, IV: 3.38, IM: 4.6 }, refs: ['PMID:923183'],
    note: 'PK: THE INTRAMUSCULAR ABSORPTION RATE OF 17.55 WAS A SAMPLING ARTEFACT. It implies a 2.4-MINUTE absorption half-life, faster than most intravenous bolus mixing, and the only supporting numeral in its paper is "mean peak plasma concentrations at 15 minutes" — the EARLIEST SAMPLING POINT, so the peak was censored by the schedule rather than measured. The evidence runs the other way entirely: the intramuscular half-lives, 4.6 and 5.3 h, EXCEED the intravenous value of 3.38 h, which is the signature of absorption-limited input. The intramuscular bioavailability of 1 is likewise unobtainable, since that study had no intravenous arm. Oral F 0.184 and the volume of 5.56 L/kg are verbatim and stand, the latter being intravenous-derived and therefore safe to pair with a bioavailability. The three route half-lives now carry their own measured values rather than one rounded 3 h. The subcutaneous route is removed as declared but unsupported.',
    summary: 'pentazocine — IM ka of 17.55/h came from the earliest SAMPLING POINT; IM input is actually slow' },

  { slug: 'meloxicam', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 13.9, F: 1, source_pmid: 'PMID:9105543' }, IV: { V_L: 13.9, F: 1, source_pmid: 'PMID:9105543' } },
    hl: { PO: 20, IV: 20 }, refs: ['PMID:9105543', 'PMID:11108435'],
    note: 'PK: the cited study is a two-tablet bioequivalence with no intravenous arm, so it could not yield an absolute bioavailability and states no volume at all. Its half-life of 13.7 h is verbatim but is an ORAL TERMINAL value, and it conflicts with the 78-volunteer study that did include intravenous and rectal arms and reports "an elimination half-life (t1/2) of around 20 h". V 13.9 L is DERIVED from that same paper clearance of 7 to 8 ml/min and its half-life, and is flagged as such; because that dataset includes intravenous dosing it is a true volume. NOTE IN THE RECORD DEFENCE: a small volume is CORRECT in principle here — meloxicam is more than 99.5% protein bound, so a value near 12 to 14 L is the expected consequence of confinement to plasma and interstitial water, not a contradiction. So the stored 11 L was unsourced rather than absurd. F is set to 1 on the qualitative "almost complete absorption over a prolonged phase". THE EFFECT SITE IS SYNOVIAL FLUID, not plasma, at a fairly constant ratio near 0.47, and free synovial concentration exceeds the enzyme inhibitory concentration from 6 to 36 hours. The intramuscular route is removed as unparameterised.',
    summary: 'meloxicam — bioequivalence citation cannot yield F; small volume is right in principle, wrong in source' },

  { slug: 'haloperidol', guard: (c) => c.pk?.PO?.V_L === 12.9,
    pk: { PO: { V_L: 1250, F: 0.65, source_pmid: 'PMID:6831826' }, IV: { V_L: 1250, F: 1, source_pmid: 'PMID:6831826' }, IM: { V_L: 1250, F: 1, source_pmid: 'PMID:6831826' } },
    hl: { PO: 17.9, IV: 17.9, IM: 17.9 }, refs: ['PMID:6831826', 'PMID:3108922'],
    note: 'PK: THE LARGEST SIMULATION ERROR IN THIS BATCH. The stored 12.9 L is verbatim in its abstract, but it is an apparent volume INTERNALLY INCONSISTENT WITH THAT SAME ABSTRACT own exposure figure by roughly 740-fold; read as per-kilogram the two reconcile, so the published units are almost certainly mislabelled. The true intravenous-derived value is "mean steady-state volume of distribution was 17.8 +/- 6.5 l/kg", about 1250 L, so the stored figure understated the distribution space by two orders of magnitude — and it was additionally paired with a bioavailability, a double-division, and reused unchanged on every route. Everything is now taken from one study with both routes (PMID:6831826): "Mean elimination t1/2 for the subjects was 17.9 +/- 6.4 (SD) hr" and "Bioavailability was 0.65 +/- 0.14 after oral doses"; the stored 29.6 h was an oral terminal value from a bioequivalence study. THE INTRAMUSCULAR ROW WAS A DEPOT CHIMERA: its zero-order duration of 672 h is the DECANOATE FOUR-WEEKLY DOSING INTERVAL read as an input duration, and that product is released FIRST-ORDER with an apparent half-life of three weeks, not zero-order. This row now models immediate-release intramuscular haloperidol only; the decanoate needs its own record. The effect-compartment citation states no equilibration value at all and its evidence points the other way, occupancy remaining high at 27 h against an 18 h plasma half-life.',
    summary: 'haloperidol — V understated ~100x; IM row mixed a decanoate depot interval with an IR half-life' },

  { slug: 'isoniazid', guard: (c) => c.pk?.PO?.V_L === 42,
    pk: { PO: { ka_hr: 3.94, V_L: 56.8, F: 1, source_pmid: 'PMID:35928262' }, IV: { V_L: 56.8, F: 1, source_pmid: 'PMID:35928262' } },
    hl: { PO: 3.68, IV: 3.68 }, refs: ['PMID:35928262', 'PMID:8275616', 'PMID:26661397'],
    note: 'PK: zero-content, and V 42 L WAS AN AUC — the abstract only 42s are exposures of "42.24 +/- 8.51 mg/h/L" and "42.19 +/- 8.80", read as a volume in litres; the stored 3 h looks likewise to be its "3 h post-dose" sampling timepoint. The intravenous row hung on an oral-only study. Re-sourced to a population fit in 45 healthy participants and 157 patients (PMID:35928262): "The estimated absorption rate constant (Ka), oral clearance (CL/F), and apparent volume of distribution (V2/F) for INH were 3.94 +/- 0.44 h-1 ... and 56.8 +/- 5.53 L" — a GENUINE published absorption rate, and one that is 2.8 TIMES the template default it replaces. Because that volume is apparent, F is pinned to 1; the real absolute bioavailability is 93% fasted against 78% fed. ACETYLATION IS BIMODAL SO NO SCALAR IS TRULY VALID: half-lives are 1.54 h in rapid and 3.68 h in slow acetylators, and the mixture proportion is population-specific. The slow-acetylator arm is stored as the higher-exposure case and labelled. The intramuscular route is removed as unsupported.',
    summary: 'isoniazid — V 42 L was an AUC; a real published ka (3.94/h) is 2.8x the default it replaces' },

  { slug: 'mebendazole', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.22, source_pmid: 'PMID:3978023' } },
    hl: { PO: 1.12 }, refs: ['PMID:7094986'],
    note: 'PK: the citation is genuinely good — a human crossover with both routes — but the record misread it twice. F 0.1 against a STATED 22%, and a half-life of 0.93 h that is the ORAL arm, which is shorter than the same paper intravenous value of 1.12 h and therefore cannot be a disposition half-life; the gap is noise in a five-subject tracer study. The intravenous figure is now stored. BOTH ARE TRACER-DOSE VALUES IN SOLUTION and do not describe therapeutic dosing: at 10 mg/kg in tablets the half-life runs 2.8 to 9.0 h. The paper also explains its own bioavailability — at tracer dose absorption is "almost complete" and the 22% loss is entirely first-pass — so the figure does not transfer to tablets, where absorption is dissolution-limited and fat-dependent. V 90 L dropped as unsourced. THE EFFECT IS DECOUPLED FOR THE DRUG MAIN USE: against intestinal helminths mebendazole acts in the GUT LUMEN, so the plasma curve measures the fraction that escaped the site of action, and a systemic model addresses the wrong compartment for most prescriptions.',
    summary: 'mebendazole — F 0.1 against a stated 22%; oral half-life was shorter than its own IV value' },

  { slug: 'dexmedetomidine', guard: (c) => c.pk?.IN?.ka_hr != null,
    pk: { IV: { V_L: 208.8, F: 1, source_pmid: 'PMID:8098191' }, IN: { V_L: 208.8, F: 0.65, source_pmid: 'PMID:21318594' } },
    hl: { IV: 3.1, IN: 3.1 }, refs: ['PMID:8098191', 'PMID:7957520'],
    note: 'PK: the citation supports exactly ONE of its five values. Intranasal F 0.65 is verbatim and stands, though it is a MEDIAN with a 35 to 93% range in six subjects. No volume or half-life appears in it at all: the volume is now the sum of three compartment volumes from Dyck 1993 (PMID:8098191), flagged as arithmetic rather than a quoted total but intravenous-derived and therefore safe to pair with a bioavailability, and the half-life is 3.1 h from PMID:7957520. The corrected pair implies a clearance bracketed by two independent intensive-care estimates, so it is not internally contradictory. THE EFFECT-COMPARTMENT VALUE NEEDS TWO CAVEATS IT DID NOT CARRY: its published variability is 165%, so the parameter is essentially unidentified, and it belongs only to the DELAYED SYMPATHOLYTIC limb of a biphasic blood-pressure model whose vasopressor limb is explicitly undelayed — applying it to a generic sedation effect misuses the estimate. ka 3 dropped against a stated time to peak of 38 minutes.',
    summary: 'dexmedetomidine — citation supported 1 of 5 values; keo has 165% CV and is limb-specific' },

  { slug: 'naloxone', guard: (c) => c.pk?.IN?.V_L === 200,
    pk: { IV: { V_L: 37.96, F: 1, source_pmid: 'PMID:18641540' }, IN: { ka_hr: 1.52, V_L: 37.96, F: 0.47, source_pmid: 'PMID:31556537' } },
    hl: { IV: 1.07, IN: 1.07 }, refs: ['PMID:18641540', 'PMID:1267205'],
    note: 'PK: the record carried TWO DIFFERENT VOLUMES for one drug, which a disposition volume cannot have. The intravenous 56 L is verbatim but is the CENTRAL COMPARTMENT of a biexponential fit, not a whole-body volume; the intranasal 200 L appears nowhere in its cited paper at all. Both are replaced by one route-independent 37.96 L, the sum of three compartment volumes in Dowling 2008 (PMID:18641540), which dosed intravenously, intramuscularly and intranasally. That paper also supplies the FIRST LITERAL, NAMED, NUMERIC absorption rate constant found anywhere in this audit series — "Ka (intramuscular), 0.65; and Ka (intranasal), 1.52" — and the intranasal figure is stored. FORMULATION CAVEAT: Dowling sprayed the dilute injectable solution and measured only 4% bioavailability, so its RATE is taken but not its extent; the 47% retained here is from a purpose-built concentrated spray. The half-life is re-cited: the old abstract MISLABELS ITS OWN UNITS, printing rate constants in reciprocal minutes as half-lives. THE SAFETY FACT IS IN THE RECORD OWN CITATION: naloxone is shorter-acting than the opioids it reverses, so "repeated naloxone dosing often is required to prevent the recurrence of respiratory depression", and duration of reversal is set by the opioid dissociation, not by this curve.',
    summary: 'naloxone — two volumes for one drug; gains the first literal published ka in the series' },

  { slug: 'clonidine', guard: (c) => c.pk?.TD?.lag_hr != null,
    pk: { PO: { V_L: 181.5, F: 0.752, source_pmid: 'PMID:870272' }, IV: { V_L: 181.5, F: 1, source_pmid: 'PMID:870272' }, TD: { zo_dur_hr: 168, V_L: 181.5, F: 0.6, source_pmid: 'PMID:2565958' } },
    hl: { PO: 8.5, IV: 8.5, TD: 8.5 }, refs: ['PMID:870272', 'PMID:17767627'],
    note: 'PK: THE TRANSDERMAL LAG OF 48 HOURS IS DELETED AS A CATEGORY ERROR. It appears in no cited paper; its likely origin is a review sentence that maximum blood-pressure reduction occurs two to three DAYS after application — a time to maximum EFFECT under a week-long zero-order input, which is an emergent property of the model rather than an input delay. Keeping it would have delayed predicted concentrations by two days past data showing plasma rises immediately. THE REST OF THE PATCH PARAMETERISATION IS RIGHT AND IS KEPT: the 168 h zero-order duration is verbatim, "a relatively reproducible and consistent rate of 4.32 micrograms h-1 over a 7-day period", and its bioavailability of about 60% is a genuine intravenous-referenced absolute figure. The half-life of 12 h was the MIDPOINT of a stated 9.0 to 15.1 h range and is replaced by an intravenous-derived 8.5 h. F 0.85 matched none of the four published values and was not a midpoint of any; 0.752 is the adult intravenous-referenced figure. NO ADULT HUMAN VOLUME EXISTS in any abstract found — 181.5 L is size-standardised from a pooled PAEDIATRIC dataset that includes intravenous dosing, and it cross-checks against the adult clearance to within about 1%.',
    summary: 'clonidine — the 48 h patch lag was a PD onset time; half-life was a range midpoint' },

  { slug: 'furosemide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 8.3, F: 0.51, source_pmid: 'PMID:6723758' }, IV: { V_L: 8.3, F: 1, source_pmid: 'PMID:6723758' } },
    hl: { PO: 0.6, IV: 0.6 }, refs: ['PMID:6723758', 'PMID:3999028'],
    note: 'PK: THE RECORD ERASED ITS OWN FLIP-FLOP SIGNAL. Its citation states 0.6 h intravenously and 0.8 h orally, and the record stored 0.8 on BOTH rows — so the disposition half-life was replaced by an absorption-limited one, which is confirmed elsewhere as "absorption rate-limited kinetics of furosemide". One value of 0.6 h now serves both routes. V 14 L was unsourced; the true steady-state volume measured after an intravenous bolus is 8.3 L, and it cross-checks with the same paper clearance to within about 2%. F is corrected to the tablet fasting figure of 51%, with the 40 to 51% spread recorded, since bioavailability here is genuinely formulation- and product-dependent. A PLASMA MODEL DOES NOT REPRESENT THIS DRUG EFFECT and must never be given one: furosemide acts from the luminal side of the nephron, so the driver is urinary excretion rate, the excretion-response curve shows clockwise hysteresis indicating acute tolerance within a single dose, and a three-fold difference in delivered drug produced no difference in diuresis. The intramuscular route is removed as never studied.',
    summary: 'furosemide — oral half-life was stored on the IV row too, erasing the flip-flop its own paper shows' },

  { slug: 'pyridostigmine', guard: (c) => c.pk?.PO?.ka_hr === 1,
    pk: { PO: { ka_hr: 0.208, V_L: 100.1, F: 0.143, source_pmid: 'PMID:3987173' }, IV: { V_L: 100.1, F: 1, source_pmid: 'PMID:7439266' } },
    hl: { PO: 1.62, IV: 1.62 }, refs: ['PMID:7439266', 'PMID:9549661'],
    note: 'PK: the best-supported record in its group — F 14.3% and the intravenous half-life of 97 minutes are both verbatim. THE STORED ABSORPTION RATE WAS STRUCTURALLY IMPOSSIBLE, NOT MERELY UNSOURCED: its own cited paper diagnoses flip-flop outright, "Mean t1/2 of the plasma level decline after oral dosing was 200 minutes, twice as long as the terminal elimination t1/2 after intravenous infusion (97 minutes). Thus absorption may proceed at a slower rate than elimination" — so the rate must be BELOW the elimination constant of 0.429, and 1.0 asserted more than double it. The correct value derived from that same 200 minutes is 0.208, flagged as derived. The oral half-life of 3.5 h is likewise the absorption showing through and is replaced by the disposition value on both routes. V 80 L becomes an intravenous-derived 1.43 L/kg, though from only two subjects, and the trap on that paper is logged: its ORAL 1.64 L/kg is apparent and must never be paired with the measured bioavailability. UNIQUELY IN ITS GROUP THE EFFECT IS NOT DECOUPLED — "The pharmacodynamic effect does not lag significantly from the plasma concentration" — so having no effect compartment is correct.',
    summary: 'pyridostigmine — its ka exceeded ke, inverting the flip-flop its own paper diagnosed' },
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

/** Routes declared with no PK block and no source anywhere. */
const ROUTE_DROPS: Record<string, string[]> = {
  hydralazine: ['IM'], tacrolimus: ['TD'], pentazocine: ['SC'],
  meloxicam: ['IM'], isoniazid: ['IM'], furosemide: ['IM'],
};
for (const [slug, routes] of Object.entries(ROUTE_DROPS)) {
  const c = need(slug);
  const gone = routes.filter((r) => (c.routes ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} routes — already trimmed, skipped`); continue; }
  c.routes = (c.routes ?? []).filter((r) => !gone.includes(r));
  for (const r of gone) if (c.doses && r in c.doses) delete c.doses[r];
  log.push(`${slug} — dropped unparameterised route(s): ${gone.join(', ')}`);
}

/** Effect-compartment corrections. */
{
  const m = need('metoprolol');
  if (m.effect_compartment?.source_pmid === 'PMID:16733693') {
    m.effect_compartment = { keo_per_h: 1.14, approximated: true, note: 'Approximation. The previous note quoted "t1/2,keo = 36.6 min" from a rat microdialysis paper, but that string appears nowhere in its abstract, so the value cannot be verified; the paper is real and is a rat effect-compartment study. No human kₑₒ exists in any abstract found. NOTE the effect is buffered against exposure — a >10x CYP2D6 clearance spread produces <2x difference in response.' };
    log.push('metoprolol — kₑₒ note quoted a string absent from its paper; demoted to a declared approximation');
  } else log.push('metoprolol kₑₒ — already corrected, skipped');

  const h = need('haloperidol');
  if (h.effect_compartment && !String(h.effect_compartment.note ?? '').includes('states no equilibration value')) {
    h.effect_compartment = { keo_per_h: 0.5, approximated: true, note: 'Approximation; no published kₑₒ. The cited PET study states no equilibration value, no plasma concentrations and no PK/PD model, and its evidence points the other way: D2 occupancy "remained high for at least 27 h" against a ~18 h plasma half-life, so effect-site kinetics are SLOW. Antipsychotic response additionally lags by days to weeks.' };
    log.push('haloperidol — kₑₒ citation stated no value; note corrected and marked approximated');
  } else log.push('haloperidol kₑₒ — already corrected, skipped');

  const a = need('acetazolamide');
  if (a.effect_compartment && !String(a.effect_compartment.note ?? '').includes('WRONG IN DIRECTION')) {
    a.effect_compartment = { keo_per_h: 1, approximated: true, note: 'Approximation; no published kₑₒ. THE PREVIOUS NOTE WAS WRONG IN DIRECTION, not magnitude: it reasoned from a fast on-rate at carbonic anhydrase, but the published behaviour is that effect OUTLASTS plasma — the erythrocyte sequestration half-life is 50.2 h against a plasma 3-6 h, and the cited review itself says the pharmacologic effects last longer. This value is therefore a lower bound on duration.' };
    log.push('acetazolamide — kₑₒ note was directionally wrong; corrected');
  } else log.push('acetazolamide kₑₒ — already corrected, skipped');
}

/** Records where nothing survives. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  ibandronate: ['uncharacterized',
    'Repeats alendronate, one layer worse: the cited study sampled only "up to 48.0 hours", so a 240 h half-life cannot have come from it, and 240 matches nothing — the review range tops out at 60 h. V 90 L is an INEQUALITY BOUND ("V(D) > 90 L") stored as a point estimate. A one-compartment plasma model cannot represent a bisphosphonate: IV data fit three compartments, the initial phase is 1.3 h, 40-50% of the dose binds to bone, and 0-6 h exposure predicts 12-month bone density.',
    ['PMID:11792604', 'PMID:17190376', 'PMID:15317823']],
  emoxypine: ['uncharacterized',
    'The purest zero-content case found: the cited paper is in RABBITS and contains NOT ONE numeric PK value — every result is a direction of difference, and the only numeral in its abstract is the animal count. All five stored values were invented. No human study of this molecule with numeric PK parameters exists in PubMed across four searches. The one human kinetic paper gives urinary recovery only, and argues against the stored F: 0.31% parent against 49.6% glucuronide.',
    ['PMID:10572752']],
  velpatasvir: ['uncharacterized',
    'Real PMID, zero content, four for four — the cited abstract only numerals are a dosing duration, two doses and a genotype span. There is NO intravenous velpatasvir, so an absolute bioavailability cannot exist and every volume is necessarily apparent; storing V 105 L beside F 0.27 was a live double-division. The whole clinical-pharmacology and popPK series was searched: not one abstract reports a half-life, clearance, volume or rate.',
    ['PMID:26519191']],
  'amoxicillin-clavulanate': ['mixture',
    'A two-molecule product carrying one molecular weight, and that weight is AMOXICILLIN (365.4; clavulanic acid is 199.16). Its cited study assayed amoxicillin ONLY, in OBESE adults of median 109 kg, so V 9.0 L and F 0.797 describe amoxicillin in an atypical population — and 9.0 L is a CENTRAL compartment, not a total volume. The uncited 1 h half-life sits near clavulanate real 0.97 h, making the record a chimera. It also contradicted the amoxicillin record on every shared parameter.',
    ['PMID:32888018', 'PMID:4066561', 'PMID:3370303']],
};
for (const [slug, [reason, n, refs]] of Object.entries(UNAUTHORED)) {
  const c = need(slug);
  if (c.pk_unauthored) { log.push(`${slug} — already pk_unauthored, skipped`); continue; }
  if (n.length > 500) throw new Error(`${slug} note ${n.length} > 500`);
  delete c.pk;
  c.half_life_hr = {};
  c.pk_unauthored = { reason, note: n };
  addRefs(c, ...refs);
  if (c.effect_compartment?.approximated && !(c.receptor_occupancy?.length)) delete c.effect_compartment;
  log.push(`${slug} — pk stripped, marked ${reason}`);
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
