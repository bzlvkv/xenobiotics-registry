/**
 * 2026-09-06-pharmacological-batch2.ts
 *
 * Second batch of the pharmacological category: 40 compounds, eight agents,
 * every cited abstract read value by value. Of roughly 170 stored numbers,
 * fewer than 20 were verbatim in the paper they claimed.
 *
 * ── Two defect classes this batch established ─────────────────────────────
 * A BINDING PERCENTAGE READ AS A BIOAVAILABILITY. terazosin stored F 0.9 from
 * "90 to 94 percent ... bound to plasma proteins" while its own paper calls the
 * drug "completely and consistently bioavailable"; tiagabine stored F 0.96 from
 * "highly (96%) bound to plasma proteins". Two independent occurrences make it a
 * type, not an accident — a plausible fraction sitting one sentence away from a
 * real parameter.
 *
 * A STUDY-DESIGN INTERVAL READ AS A PARAMETER. topiramate stored a half-life of
 * 21 h; the only 21 in its cited abstract is "21 days of washout between
 * treatments". The paper states four half-lives — 55.7, 80.2, 72.5 and 37.1 h —
 * and none of them is 21. This is the furthest a digit collision has travelled.
 *
 * ── The prodrug pair, seen from both sides ───────────────────────────────
 * ganciclovir's oral row and valganciclovir's row are the SAME measurement.
 * PMID:12189361 dosed oral valganciclovir only, and its "ganciclovir
 * bioavailability was 60%" is correct on the valganciclovir record and nowhere
 * else. Oral ganciclovir capsules average 6-9% (PMID:9110063), so the stored 0.6
 * over-predicted oral exposure by roughly eight-fold — the largest single error
 * found in the pharmacological category so far.
 *
 * ── Absorption rate ──────────────────────────────────────────────────────
 * 70 audited routes now carry a ka; not one was supported by its citation. Four
 * of this batch's cited papers model absorption as ZERO-ORDER (ganciclovir,
 * cefuroxime, nilotinib, penicillin V) and gabapentin's is saturable, so for
 * those a first-order rate is the wrong model rather than an uncited number.
 * One genuine published human ka is added here: valganciclovir 0.895 /h.
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

/**
 * Records that keep a curve. `pk` replaces the whole block, `hl` the half-lives.
 * Where a replacement volume is APPARENT (V/F), F is pinned to 1 so absorption is
 * not divided in twice. Where a paper states a RANGE, the stated lower endpoint is
 * stored and the range recorded in prose — never the midpoint, which is a
 * measurement no one made.
 */
const FIXES: { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'ziprasidone', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.6, source_pmid: 'PMID:11978164' }, IM: { F: 1, source_pmid: 'PMID:15901743' } },
    hl: { PO: 7, IM: 2.5 }, refs: ['PMID:11978164', 'PMID:15901743'],
    note: 'PK: the oral row was real-PMID zero-content — PMID:10771448 states none of its four values. Re-cited to a review (PMID:11978164) for the two figures that exist: "half-life is approximately 6-7 hours" (the upper endpoint is stored) and "Oral bioavailability of ziprasidone taken with food is approximately 60%", which must be read as a FED value — fasting exposure is roughly half. The intramuscular row is re-sourced to PMID:15901743, 24 plus 12 healthy volunteers with a real intravenous arm, verbatim "The mean IM elimination t(1/2) was short and approximately 2.5 hours" and "bioavailability for the 5-mg IM ziprasidone dose was approximately 100%" — the stored 3 h was not stated and is not even the midpoint of the 2-5 h range its old citation gives. V 105 L on both rows and both absorption rates dropped as unsourced.',
    summary: 'ziprasidone — oral row zero-content; IM half-life 3 -> 2.5 h and re-sourced to a study with an IV arm' },

  { slug: 'captopril', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 56, F: 0.65, source_pmid: 'PMID:3292102' } },
    hl: { PO: 2 }, refs: ['PMID:7037265'],
    note: 'PK: half-life 2 h and F 0.65 are both VERBATIM and stand, and captopril is confirmed not a prodrug, so there is no analyte question. V 56 L is that paper 0.8 L/kg scaled by an invisible 70 kg — it is measured after intravenous dosing, so it is a TRUE volume and pairs safely with a bioavailability, but the weight assumption is now declared. THE REAL CAVEAT IS NOT TISSUE ACE: the cited abstract documents a DISULPHIDE RESERVOIR with cysteine and glutathione giving "a duration of action longer than that predicted by blood concentrations of unchanged captopril", so the plasma curve understates duration. ka 1.4 /h dropped as unstated. A single self-consistent alternative set exists (PMID:7037265: t½ 1.9 h, F 0.62, Vss 0.7 L/kg) but the stored values are the verbatim ones and were kept.',
    summary: 'captopril — the two verbatim values stand; ka dropped; the duration caveat is a disulphide reservoir' },

  { slug: 'gabapentin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.6, source_pmid: 'PMID:20818832' } },
    hl: { PO: 6 }, refs: ['PMID:20818832'],
    note: 'PK: THE OLD CITATION WAS A RAT IN-SITU PERFUSION STUDY AND IT REFUTES THE VALUE IT WAS CITED FOR — its finding is that a saturable transport mechanism causes the lack of dose proportionality. Re-cited to human data (PMID:20818832), verbatim "elimination half-lives of approximately 6 hours". F 0.6 is retained but is valid ONLY AT 900 mg/day: the same source states bioavailability "drops from 60% to 33% as the dosage increases from 900 to 3600 mg/day", so a scalar overstates exposure at higher doses. ka 0.7 /h is dropped and must not be restored: gabapentin absorption is ZERO-ORDER through a saturable transporter, so a first-order rate constant is uncitable in principle rather than merely uncited. V 60 L has no source in any abstract.',
    summary: 'gabapentin — its citation was a rat study refuting the stored F; ka is uncitable (zero-order absorption)' },

  { slug: 'nicardipine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 70, F: 0.15, source_pmid: 'PMID:6527979' }, IV: { V_L: 70, F: 1, source_pmid: 'PMID:2598970' } },
    hl: { PO: 4, IV: 4 }, refs: ['PMID:2598970'],
    note: 'PK: F 0.3 was the EXACT MIDPOINT of a stated "15-45% approximately over the dose range 10-40 mg", and the same abstract says bioavailability "was found to be non-linearly related to dose" — so a scalar is wrong in kind, not merely imprecise. The stated LOWER endpoint is now stored and understates exposure at higher doses; the range belongs in any interpretation. V 600 L was about 8.6x the only human measurement: Guerret 1989 (PMID:2598970), six healthy men dosed intravenously with deuterium-labelled drug, verbatim "the volume of distribution was of the order of 1 l/kg and the half-life of beta-elimination ranged from 4 to 5 h" — 70 L at 70 kg, a true volume, and the stored 3 h appears in neither paper. That study also confirms disposition is THREE-compartment and route-independent. ka 1.5 /h dropped.',
    summary: 'nicardipine — F was a range midpoint of a non-linear quantity; V 600 -> 70 L, half-life 3 -> 4 h' },

  { slug: 'tiagabine', guard: (c) => c.pk?.PO?.F === 0.96,
    pk: { PO: { ka_hr: 1.25, V_L: 62, F: 1, source_pmid: 'PMID:11042231' } },
    hl: { PO: 5.72 }, refs: ['PMID:11042231', 'PMID:9118850'],
    note: 'PK: F 0.96 WAS A PROTEIN-BINDING FRACTION — the source sentence is that tiagabine "is highly (96%) bound to plasma proteins", one clause away from the 7 h half-life that was also taken from it. The record now carries one internally consistent population fit (PMID:11042231, 130 monotherapy patients): "1.25 /h" absorption, "62.0 L" apparent volume and "5.72 h" half-life, with F pinned to 1 because that volume is apparent. This is one of only two genuine published human absorption rate constants found across the whole audit. The healthy-subject half-life of 7 h is also real (PMID:9118850) but must not be mixed with a volume and rate fitted at 5.72 h. V 70 L was a shared default.',
    summary: 'tiagabine — F 0.96 was protein binding; replaced by one self-consistent popPK fit incl. a real ka' },

  { slug: 'abacavir', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 60, F: 0.83, source_pmid: 'PMID:10453964' } },
    hl: { PO: 1.5 }, refs: ['PMID:10453964'],
    note: 'PK: half-life 1.5 h and F 0.83 are both verbatim and stand, and V 60 L is the review 0.86 L/kg scaled to 70 kg — measured after intravenous dosing, so a TRUE volume that pairs safely with a bioavailability. F is now cited to the primary that measured it (PMID:10453964, six HIV-infected men, oral versus a 60-minute intravenous infusion) rather than to the review quoting it. ka 1.5 /h dropped as a DIGIT COLLISION with the half-life; the cited paper only absorption figure is a peak at 0.63-1 hour. ANALYTE CAVEAT: 1.5 h is the PLASMA PARENT half-life, but the drug is dosed once daily on the strength of an intracellular carbovir-triphosphate half-life above 20 hours — right analyte for a plasma model, wrong one for an effect model.',
    summary: 'abacavir — verbatim values stand; F re-cited to its primary; ka dropped as a half-life collision' },

  { slug: 'cefuroxime', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 15, F: 0.35, source_pmid: 'PMID:6706890' }, IV: { V_L: 15, F: 1, source_pmid: 'PMID:17589665' } },
    hl: { PO: 1.3, IV: 1.8 }, refs: ['PMID:6706890', 'PMID:9017772', 'PMID:17589665', 'PMID:6703686'],
    note: 'PK: all seven stored values were unsupported — the citation was a RELATIVE bioequivalence study, a design that cannot yield an absolute bioavailability, and the stored 1.5 h was its median Tmax IN HOURS. Re-sourced per parameter: oral F 0.35 fasted from Williams 1984 (PMID:6706890) against an intravenous reference, oral half-life 1.30 h from PMID:9017772, and the intravenous row from PMID:17589665, verbatim "elimination half-life: 1.8 h" and "0.19, 0.25, and 0.22 L/kg" (0.22 x 70 = 15 L, not the stored 35 L). TWO MOLECULES SHARE THIS RECORD: the oral product is cefuroxime AXETIL, an ester never detected intact in blood (PMID:6703686), and the intravenous one is cefuroxime sodium. Disposition is shared after de-esterification; absorption belongs to the ester alone, and the stored mw 424.39 is the free acid rather than either. Oral F is also food-dependent, 0.35 fasted against 0.45 fed. ka 0.9 /h dropped; that paper models absorption as apparent zero order.',
    summary: 'cefuroxime — all 7 values unsupported; V 35 -> 15 L; oral and IV are two different molecules' },

  { slug: 'ganciclovir', guard: (c) => c.pk?.PO?.F === 0.6,
    pk: { PO: { V_L: 34, F: 0.06, source_pmid: 'PMID:9110063' }, IV: { V_L: 34, F: 1, source_pmid: 'PMID:2847287' } },
    hl: { PO: 3.6, IV: 3.6 }, refs: ['PMID:9110063', 'PMID:2847287', 'PMID:1662377'],
    note: 'PK: THE LARGEST SINGLE ERROR FOUND IN THIS CATEGORY. F 0.6 is verbatim in the cited paper, but that paper dosed ORAL VALGANCICLOVIR ONLY, so 60% is the yield of ganciclovir from the prodrug and belongs on the valganciclovir record. Oral GANCICLOVIR capsules average 6-9% (PMID:9110063), so the stored value over-predicted oral exposure roughly eight-fold; the stated lower endpoint is now carried. The intravenous half-life of 4 h was invented — the nearest numeral in that abstract is a Tmax of 4.3 h in SEVERE RENAL IMPAIRMENT — and that study had no intravenous arm at all. Both routes now share one disposition half-life, 3.60 h from Sommadossi 1988 (PMID:2847287) at normal renal function, and V 34 L is 0.48 L/kg from PMID:1662377. ka 0.7 /h dropped: the old citation own model is "zero-order input and first-order elimination", so a first-order rate had no home in it.',
    summary: 'ganciclovir — oral F was valganciclovir measurement; 0.6 -> 0.06, an ~8x over-prediction removed' },

  { slug: 'topiramate', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 38.5, F: 1, source_pmid: 'PMID:8930774' } },
    hl: { PO: 21.5 }, refs: ['PMID:8930774', 'PMID:8764818'],
    note: 'PK: THE FURTHEST A DIGIT COLLISION HAS TRAVELLED. The stored 21 h had no half-life behind it — the only 21 in the cited abstract is "21 days of washout between treatments", a study-design interval. That paper states four half-lives, 55.7, 80.2, 72.5 and 37.1 h, none of them 21, and it is an EXTENDED-RELEASE study cited for an immediate-release row; its F of 91.2% is relative to Topamax, not absolute. Re-sourced to the first-in-human phase I (PMID:8930774), verbatim "Elimination half-life (t1/2) values calculated from plasma (21.5 hrs)" and "volume of distribution (Vd/F) was 38.5 to 58.0 L" — the stated lower endpoint is stored and F is pinned to 1 because that volume is APPARENT. MONOTHERAPY ONLY: oral and non-renal clearance run two- to three-fold higher with enzyme-inducing antiepileptics (PMID:8764818). ka 1.5 /h dropped.',
    summary: 'topiramate — stored half-life was a 21-DAY WASHOUT interval; re-sourced to the first-in-human study' },

  { slug: 'acyclovir', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 70.7, F: 0.2, source_pmid: 'PMID:6355048' }, IV: { V_L: 70.7, F: 1, source_pmid: 'PMID:6355048' } },
    hl: { PO: 2.5, IV: 2.5 }, refs: ['PMID:6355048'],
    note: 'PK: the old citation was an HPLC ASSAY-VALIDATION study that dosed capsules only, so it supported nothing and the intravenous row had no arm behind it. Its ka 0.9 /h is the MEAN of the two Tmax values it does state, 0.8 and 1.0 hours. Re-sourced wholesale to de Miranda 1983 (PMID:6355048), which has both routes: verbatim "For patients with normal renal function (creatinine clearance greater than 80 ml/min/1.73m2) mean T1/2 beta and Cltot were 2.5 h and 327 ml/min/1.73 m2" and "the bioavailability of acyclovir was approximately 20%". THE HALF-LIFE IS VALID ONLY AT NORMAL RENAL FUNCTION — the same abstract states it is significantly renal-function dependent. V 70.7 L is DERIVED, not quoted: it is that paper own clearance and half-life combined, and is flagged as such. No abstract anywhere states an adult human acyclovir volume, and the stored 50 L was a shared default.',
    summary: 'acyclovir — cited an assay-validation paper with no IV arm; re-sourced to a true IV/PO study' },

  { slug: 'chlorthalidone', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.64, source_pmid: 'PMID:421727' } },
    hl: { PO: 44.1 }, refs: ['PMID:421727', 'PMID:649750'],
    note: 'PK: the best citation in this batch. F 0.64 is verbatim and stands, and the half-life is corrected 44 -> 44.1 h, the figure its paper states. But 44.1 h is the ORAL apparent value: the same crossover gives 36.5 h after a two-hour infusion, so it is not a disposition half-life and an intravenous row would have to carry 36.5. V 280 L is dropped as unsourced AND as conceptually unsafe — erythrocyte concentrations run 50 to 100 times plasma (PMID:649750) and plasma must be separated immediately or the measured concentration falls by more than half, so any plasma-referenced volume for this drug is a matrix artefact. The same study reports separate red-cell half-lives of 46.4 and 52.7 h. ka 0.7 /h dropped, probably a collision with the bioavailability estimates 0.67 and 0.72 that the abstract does contain.',
    summary: 'chlorthalidone — F verbatim; V 280 L dropped (plasma-referenced volumes are a red-cell artefact)' },

  { slug: 'granisetron', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 186, source_pmid: 'PMID:12867217' }, IV: { V_L: 186, F: 1, source_pmid: 'PMID:8039536' }, TD: { zo_dur_hr: 168, V_L: 186, F: 1, source_pmid: 'PMID:19304880' } },
    hl: { PO: 6.9, IV: 4.1, TD: 36 }, refs: ['PMID:8039536', 'PMID:12867217', 'PMID:27186139'],
    note: 'PK: the transdermal half-life of 35.9 h was the worst misfiling found — it is an APF530 SUBCUTANEOUS POLY(ORTHOESTER) DEPOT value (PMID:27186139) stored under a patch and attributed to a paper that says 36. The patch figure of 36 h is itself ABSORPTION RATE-LIMITED, not disposition: the same abstract puts maximal concentration at 48 h post-application. The intravenous row had no arm in its old citation; it is re-sourced to Allen 1994 (PMID:8039536), 24 healthy males, verbatim "mean volumes of distribution ranging from 186-264 l" and "Mean t1/2 values ranged from 4.1 to 6.3 h" — stated lower endpoints are stored, and that true volume now serves all three routes since disposition is route-independent. Oral half-life 6.9 h is from the granisetron-alone arm of PMID:12867217; the stored 9 h appears nowhere. Oral F 0.6 dropped: the nearest literature match is an ED50 oral-to-intravenous POTENCY RATIO in anaesthetised rats, not a fraction absorbed. ka 1.5 /h dropped.',
    summary: 'granisetron — TD half-life was a SUBCUTANEOUS DEPOT value; IV row re-sourced, V 250 -> 186 L' },

  { slug: 'valacyclovir', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 70.7, F: 0.542, source_pmid: 'PMID:8593015' } },
    hl: { PO: 2.8 }, refs: ['PMID:8245883', 'PMID:6355048'],
    note: 'PK: THIS RECORD IS A WRONG-ANALYTE HYBRID and now says so. F is verbatim at 54.2% but it is the yield of ACYCLOVIR per mole of valaciclovir swallowed, not valaciclovir absorption; mw 324.34 is the prodrug; and the stored 3 h and 50 L were byte-identical copies of the acyclovir record. Valaciclovir itself is under 0.5% of the dose in urine and undetectable in plasma after 3 hours — and that detection-limit statement is exactly where the stored 3 h came from. Every parameter here therefore describes acyclovir: half-life 2.8 h (PMID:8245883, review-grade) and the derived acyclovir volume. This is NOT a double-count with the acyclovir record: 20% is oral acyclovir and 54.2% is oral valaciclovir, two products in two studies. ka 2.1 /h dropped. The clean fix is structural — either re-key this record to acyclovir mass or fold it into acyclovir as a third route — and is logged rather than done here.',
    summary: 'valacyclovir — every value describes acyclovir, not the prodrug; stored half-life was a detection limit' },

  { slug: 'agomelatine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.04, source_pmid: 'PMID:28392509', source_label: 'SmPC (Valdoxan): absolute bioavailability is low (<5%) after oral dosing owing to extensive first-pass metabolism. No PubMed abstract states an absolute figure.' } },
    hl: { PO: 0.96 }, refs: [],
    note: 'PK: half-life 0.96 h is verbatim and stands. F 0.04 is real drug pharmacology but has NO PubMed source — it was claiming support from a relative-bioequivalence study with no intravenous arm — so it is retained under an explicit label provenance rather than a citation it does not have. Dropping it was rejected because the resolver default of 0.9 would over-predict exposure more than twenty-fold for a drug whose first-pass extraction is near total. ka 1 /h and V 70 L dropped as unsourced; any volume recoverable from an oral area under the curve would be apparent and would need F pinned to 1.',
    summary: 'agomelatine — F 0.04 kept but moved to label provenance; ka and V dropped' },

  { slug: 'diazepam', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 88, F: 0.94, source_pmid: 'PMID:6849499' }, IV: { V_L: 88, F: 1, source_pmid: 'PMID:6784999' } },
    hl: { PO: 43.3, IV: 43.3 }, refs: ['PMID:6784999', 'PMID:6849499', 'PMID:10613621'],
    note: 'PK: the intravenous row was filed under an ORAL-ONLY study, and the stored 20 h was that study CYP2C19 wild-type SUBGROUP of six subjects — its other genotype arms give 62.9 and 84.0 h, so a population value it is not. The record also contradicted its own mechanism text, which names desmethyldiazepam at 99.2 h. Re-sourced: half-life 43.3 h and Vss 1.26 L/kg (88 L at 70 kg, a true intravenous volume) from PMID:6784999, six healthy young subjects on 10 mg intravenously; oral F 0.94 from PMID:6849499, 22 volunteers aged 20 to 78 dosed orally against intravenous. THE PARENT HALF-LIFE UNDERSTATES DURATION: desmethyldiazepam runs 99.2 h in the same wild-type subjects (PMID:10613621), which is kept as a metabolite citation only. ka 2 /h dropped; the 0.9 h beside it is a Tmax.',
    summary: 'diazepam — IV row cited an oral-only study; 20 h was a 6-subject genotype arm; half-life -> 43.3 h' },

  { slug: 'hydrochlorothiazide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 317, F: 1, source_pmid: 'PMID:9737817' } },
    hl: { PO: 9.8 }, refs: ['PMID:9737817'],
    note: 'PK: textbook real-PMID zero-content — none of the four stored values appears in the cited abstract, and that citation was the record ONLY reference, so nothing else propped it up. Re-sourced to PMID:9737817, 20 healthy male volunteers at steady state: half-life corrected 8 -> 9.8 h. V 317 L is DERIVED and flagged as such, from that same paper verbatim apparent clearance of 22.4 L/h and its half-life; because it is apparent, F is pinned to 1 and the stored 0.7 is dropped rather than paired with it. ka 1 /h dropped; the 1.8 h beside it is a time to peak, not a rate.',
    summary: 'hydrochlorothiazide — zero-content on all four; half-life 8 -> 9.8 h, V now apparent with F pinned' },

  { slug: 'oxycodone', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 141, F: 0.6, source_pmid: 'PMID:1389934' }, IV: { V_L: 141, F: 1, source_pmid: 'PMID:9062618' } },
    hl: { PO: 2.6, IV: 2.6 }, refs: ['PMID:9062618'],
    note: 'PK: the intravenous row was a route error of a subtle kind — the cited study parenteral arm was INTRAMUSCULAR, not intravenous. F 0.60 survives intact but must be read as RELATIVE TO INTRAMUSCULAR dosing rather than absolute. The intravenous row is re-sourced to PMID:9062618, ten healthy volunteers on a 0.05 mg/kg bolus, giving a half-life of 157 minutes (2.6 h, replacing 3.5 h on both rows) and a steady-state volume of 2.02 L/kg, which is 141 L at 70 kg and is a true intravenous volume. ka 2.5 /h dropped; the only timing in the source is a median Tmax of 1 h. An elderly parameterisation exists as a matched pair (3.1 h with 277 L, PMID:18473019) and must be taken whole or not at all.',
    summary: 'oxycodone — IV row was actually IM; half-life 3.5 -> 2.6 h, V 200 -> 141 L' },

  { slug: 'valganciclovir', guard: (c) => c.pk?.PO?.ka_hr === 1.4,
    pk: { PO: { ka_hr: 0.895, V_L: 31.9, F: 0.59, source_pmid: 'PMID:22305377' } },
    hl: { PO: 3.73 }, refs: ['PMID:19738014'],
    note: 'PK: F 0.59 is verbatim and stands, RELABELLED — it measures ganciclovir appearing in plasma after oral valganciclovir, not the prodrug itself, and the two records molecular weights differ by a factor of 1.39, so molar work must name which species it means. Half-life corrected 4 -> 3.73 h from the same ten lung-transplant recipients. V 31.9 L and ka 0.895 /h come from Caldes 2009 (PMID:19738014) in solid-organ transplant patients; the volume is a two-compartment CENTRAL volume being carried in a one-compartment slot, and that paper own bioavailability is 0.825 rather than 0.59, so the mixture of sources is deliberate and recorded. THE ABSORPTION RATE IS ONE OF ONLY TWO GENUINE PUBLISHED HUMAN ka VALUES FOUND IN THE ENTIRE AUDIT of 70 routes. The ganciclovir record oral row was the same measurement double-filed and has been corrected separately.',
    summary: 'valganciclovir — a real published ka (0.895/h) replaces the invented 1.4; half-life 4 -> 3.73 h' },

  { slug: 'dimenhydrinate', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 315, F: 0.72, source_pmid: 'PMID:3760245' }, IV: { V_L: 315, F: 1, source_pmid: 'PMID:3760245' } },
    hl: { PO: 8.4, IV: 8.4 }, refs: ['PMID:3760245'],
    note: 'PK: the old citation was a CHEWING-GUM study, so the intravenous row had no arm behind it and the stored 8 h came from a sustained-release formulation. Re-sourced to PMID:3760245, ten subjects given 50 mg intravenously and orally: half-life 8.4 h, steady-state volume 4.5 L/kg (315 L at 70 kg, a true intravenous volume) and oral F 0.72. THE MOLECULAR WEIGHT IS THE SALT AND THE PHARMACOLOGY IS NOT: dimenhydrinate is diphenhydramine paired with 8-chlorotheophylline, so all of the above describes DIPHENHYDRAMINE at mw 255.35 while the record carries 469.97. About 54% of a dimenhydrinate dose is active drug, and any molar conversion here is 1.84x wrong until the schema can express a salt-to-active factor. ka 0.7 /h dropped; the 2.6 h beside it is a Tmax.',
    summary: 'dimenhydrinate — IV row was a chewing-gum study; re-sourced, and the salt/active mw gap recorded' },

  { slug: 'irbesartan', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 53, F: 0.6, source_pmid: 'PMID:9725545' } },
    hl: { PO: 13 }, refs: ['PMID:9725545'],
    note: 'PK: THE STORED 14 h WAS A STANDARD DEVIATION. Its paper reports 20.21 plus or minus 14.71, and the second number was stored as the half-life — a new collision shape, a dispersion statistic read as a central value. Re-sourced to PMID:9725545, 18 healthy males dosed orally and intravenously, which states a half-life of 13 to 16 h, a steady-state volume of 53 to 93 L and a bioavailability of 60 to 80%; the stated LOWER endpoints are stored, and the previous F of 0.7 was that range midpoint. ka 1.5 /h dropped as a Tmax collision, the cited paper time to peak being 1.44 h.',
    summary: 'irbesartan — the stored half-life was a STANDARD DEVIATION; F was a range midpoint' },

  { slug: 'penicillin-v', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 35.41, F: 0.48, source_pmid: 'PMID:3924086' } },
    hl: { PO: 0.86 }, refs: ['PMID:3924086'],
    note: 'PK: THE INTRAVENOUS ROUTE IS REMOVED BECAUSE THE PRODUCT DOES NOT EXIST — parenteral penicillin is penicillin G, and no marketed intravenous phenoxymethylpenicillin exists to model. Re-sourced to Overbosch 1985 (PMID:3924086), verbatim "The volume of distribution in the steady state of PM was 35.41" and "the absorption after oral administration of PM as the acid was 48% of the dose"; the stored F 0.6 was neither. The half-life of 0.86 h is DERIVED and flagged as such, from that same paper own steady-state volume and its clearance of 476.4 ml/min — no PubMed abstract states a human phenoxymethylpenicillin half-life at all. Subjects were patients rather than healthy volunteers and clearance tracked creatinine clearance, so the value holds only at normal renal function. ka 1 /h dropped; the 0.81 h beside it is a Tmax.',
    summary: 'penicillin-v — IV route removed (no such product); re-sourced, half-life derived from one paper' },

  { slug: 'vigabatrin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 56, F: 1, source_pmid: 'PMID:1395360' } },
    hl: { PO: 6.8 }, refs: ['PMID:1395360'],
    note: 'PK: half-life corrected 7 -> 6.8 h, the figure its own paper states. F 0.92 was a RELATIVE bioavailability, fed against fasted, not an absolute one, and is dropped; no absolute figure exists in any abstract. V 56 L is retained but re-attributed to PMID:1395360 as 0.8 L/kg and is APPARENT, so F is pinned to 1 rather than paired with a separate bioavailability. ka 1.2 /h dropped. THE PLASMA BLOCK IS DISPOSITION ONLY: vigabatrin inactivates GABA transaminase irreversibly, so its effect outlasts its curve by days and duration is set by enzyme resynthesis.',
    summary: 'vigabatrin — F 0.92 was a fed-versus-fasted ratio; V now apparent with F pinned to 1' },

  { slug: 'ampicillin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 29.4, F: 0.35, source_pmid: 'PMID:279976' }, IV: { V_L: 29.4, F: 1, source_pmid: 'PMID:6460974' } },
    hl: { PO: 0.87, IV: 0.87 }, refs: ['PMID:279976', 'PMID:6460974'],
    note: 'PK: the stored 1.45 h is verbatim but POISONED TWICE OVER — the study co-dosed 1 g of PROBENECID, which blocks the tubular secretion that dominates ampicillin elimination, and the drug given was SULTAMICILLIN, a prodrug. That paper also has no intravenous arm, so the 1 h on the intravenous row was invented to make a route split look plausible; a disposition half-life cannot differ by route. Re-sourced: 52.4 minutes (0.87 h) and a true volume of 29.4 L from PMID:6460974, ten healthy men dosed intravenously without probenecid, and oral F 0.35 from PMID:279976, ten subjects in an oral-versus-intravenous crossover — the stored 0.4 was neither, and the 65% urinary recovery in the old paper is not a bioavailability. V 21 L and ka 1 /h dropped.',
    summary: 'ampicillin — its half-life was probenecid-blocked and prodrug-derived; IV row had no arm' },

  { slug: 'doravirine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 1, source_pmid: 'PMID:31388941' } },
    hl: { PO: 15 }, refs: ['PMID:31388941', 'PMID:25470746'],
    note: 'PK: real-PMID zero-content on all four. The one supported number in that paper is one the record does not store, an apparent clearance of 5.9 L/h, and the stored V 60 L is contradicted by the record own arithmetic — that clearance with a 15 h half-life implies about 128 L. ABSOLUTE BIOAVAILABILITY HAS NEVER BEEN DETERMINED: there is no intravenous doravirine and no published intravenous arm, and the 64% in circulation traces to sponsor label data rather than to any abstract. F is therefore pinned to 1 and every doravirine volume is necessarily apparent. The half-life of 15 h is retained but is REVIEW-GRADE (PMID:31388941); the primary gives a range of 12 to 21 h (PMID:25470746), of which 15 is not even the midpoint. V dropped rather than derived across two papers, which leaves the resolver default understating the apparent volume by roughly three-fold. ka 0.5 /h dropped against a stated time to peak of 1 to 4 h.',
    summary: 'doravirine — zero-content; F unmeasurable in principle so pinned to 1; V and ka dropped' },

  { slug: 'ketamine', guard: (c) => c.pk?.IN?.ka_hr != null,
    pk: { IV: { V_L: 392, F: 1, source_pmid: 'PMID:6488686' }, IN: { V_L: 392, F: 0.45, source_pmid: 'PMID:12516077' } },
    hl: { IV: 2.17, IN: 2.17 }, refs: ['PMID:6488686', 'PMID:34019627', 'PMID:8881626'],
    note: 'PK: intranasal F 0.45 is verbatim and stands, though from only three subjects; an independent paediatric figure of 0.50 exists (PMID:8881626). The stored 2.5 h matched NO paper — four genuine sources give 2.0, 2.17, 3.1 and 5.2/6.1 h — and is replaced by Domino 1984 (PMID:6488686), eight healthy males on 2.2 mg/kg intravenously, verbatim "elimination (beta t 1/2) = 2.17 hr". THAT SAME PAPER SHOWS DISPOSITION IS THREE-PHASE, so a one-compartment curve is a real simplification here. V 392 L is 5.6 L/kg, the LOWER of the two enantiomer steady-state volumes stated in PMID:34019627 (S 6.6, R 5.6 L/kg) — no racemic human volume appears in any abstract found, and the stored 200 L was roughly half either figure. ka 6 /h dropped and refuted rather than merely unsourced: it implies a seven-minute absorption half-life against an observed nasal peak at about 20 minutes. A prolonged-release oral arm exists in the literature whose 10-11 h half-life is absorption flip-flop and must never reach an immediate-release row.',
    summary: 'ketamine — half-life 2.5 h matched no paper; V 200 -> 392 L; the intranasal ka is refuted, not just uncited' },

  { slug: 'pravastatin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 35.7, F: 0.18, source_pmid: 'PMID:2106337' } },
    hl: { PO: 1.8 }, refs: ['PMID:2106337'],
    note: 'PK: a pure attribution failure — all three values are real and none of them is in the cited paper, which studied heart-transplant recipients ON CYCLOSPORIN, a transporter interaction that raises pravastatin exposure about twelve-fold, and is a drug-interaction study rather than a baseline one. Re-pointed to Singhvi 1990 (PMID:2106337), eight healthy men in a crossover WITH A REAL INTRAVENOUS ARM: verbatim "the oral bioavailability was about 18%" (the stored 0.17 was a rounding down), "0.8 and 1.8 h for the intravenous and oral routes" and "the steady-state volume of distribution averaged 0.51 kg-1", which is 35.7 L at 70 kg. That volume is measured after intravenous dosing, so it is a TRUE Vss and pairs legitimately with the bioavailability — this is the one record in the batch where that pairing is clean. ka 1.5 /h dropped as a Tmax collision.',
    summary: 'pravastatin — values were right but belonged to a different paper; cited study was a cyclosporin DDI' },

  { slug: 'azathioprine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.47, source_pmid: 'PMID:8881811' } },
    hl: { PO: 0.83 }, refs: ['PMID:3957504'],
    note: 'PK: F 0.47 is verbatim but is 6-MERCAPTOPURINE bioavailability after oral azathioprine, not azathioprine own, and is now labelled as such. The stored 5 h was wrong by an order of magnitude: the parent terminal half-life is 50 minutes and 6-mercaptopurine 74 minutes (PMID:3957504), and 0.83 h is now stored. ka 1 /h and V 60 L dropped as unsourced. EFFECT IS DECOUPLED FROM PLASMA: the active species are thioguanine nucleotides that persist inside cells for weeks, so no parameter here represents the duration of immunosuppression.',
    summary: 'azathioprine — half-life 5 h -> 0.83 h (an order of magnitude); F relabelled as the metabolite' },

  { slug: 'doxycycline', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:2080940' }, IV: { F: 1, source_pmid: 'PMID:2729939' } },
    hl: { PO: 16.6, IV: 16.2 }, refs: ['PMID:2080940', 'PMID:2729939'],
    note: 'PK: the intravenous row had no intravenous arm in its only citation and is re-sourced to PMID:2729939, six healthy males on a 200 mg infusion, verbatim "the half-life of intravenous doxycycline was shortened from 16.2 +/- 2.6" in the antacid-free arm. The oral half-life is corrected 17 -> 16.6 h, the figure its own paper states. ka 1.5 /h is a clean Tmax collision, that paper time to peak being 1.47 h. V 50 L and F 0.93 dropped as unsourced, which leaves both to the resolver defaults.',
    summary: 'doxycycline — IV row had no IV arm; half-life 17 -> 16.6 h; ka was a Tmax of 1.47 h' },

  { slug: 'macitentan', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 34, F: 1, source_pmid: 'PMID:34159557' } },
    hl: { PO: 14.3 }, refs: ['PMID:34159557'],
    note: 'PK: the stored 16 h was the MIDPOINT of a stated 14.3 to 18.5 h range and is replaced by the stated lower endpoint. V 34 L comes from a population fit of 452 patients (PMID:34159557) and is APPARENT, so F is pinned to 1 and the stored 0.74 is dropped rather than paired with it. ka 0.1 /h dropped as unsourced. The active metabolite aprocitentan has a half-life near 48 hours and is not modelled by this record, so the curve understates the duration of endothelin blockade.',
    summary: 'macitentan — half-life was a range midpoint; V now apparent with F pinned to 1' },

  { slug: 'pregabalin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.9, source_pmid: 'PMID:20147618' } },
    hl: { PO: 6 }, refs: ['PMID:20147618'],
    note: 'PK: real-PMID zero-content — the cited paper states none of the four values — but two of them are genuine and merely misattributed. Re-pointed to PMID:20147618, pooled across five healthy-volunteer studies, verbatim "Pregabalin oral bioavailability is approximately 90% and is independent of dose and frequency of administration" and "Pregabalin elimination half-life is approximately 6 hours"; the stored 6.3 h was a rounding of neither. ka 1.5 /h and V 35 L dropped; the 0.7 to 1.3 h beside the rate is a time to peak.',
    summary: 'pregabalin — zero-content citation, but F 0.9 and 6 h are genuine once re-pointed' },

  { slug: 'bempedoic-acid', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:37477389' } },
    hl: { PO: 21.1 }, refs: [],
    note: 'PK: the one clean record in this batch — its citation is a real phase 1 study rather than an outcomes trial, and the half-life is corrected 21 -> 21.1 h, the figure that study states in healthy adults at steady state. The analyte is the parent prodrug in plasma. ka 1.01 /h, V 17.5 L and F 0.95 dropped as unsourced; the 3.5 h median beside the rate is a time to peak.',
    summary: 'bempedoic-acid — the batch only well-cited record; half-life 21 -> 21.1 h, the other three dropped' },

  { slug: 'terazosin', guard: (c) => c.pk?.PO?.F === 0.9,
    pk: { PO: { V_L: 25, F: 1, source_pmid: 'PMID:2872802' } },
    hl: { PO: 12 }, refs: [],
    note: 'PK: F 0.9 WAS LIFTED FROM A PROTEIN-BINDING FIGURE — the source sentence is that terazosin is "90 to 94 percent ... bound to plasma proteins", while the same abstract says the drug is "completely and consistently bioavailable", so F is pinned to 1. This is one of two such collisions found in this batch, the other being tiagabine at 96%. Half-life 12 h is verbatim and stands. V 28 L was the midpoint of a stated "25 to 30 L"; the stated lower endpoint is now carried. ka 1.2 /h dropped, sitting beside a stated time to peak of one to two hours.',
    summary: 'terazosin — F 0.9 was a PROTEIN-BINDING percentage; V 28 L was a range midpoint' },

  { slug: 'betamethasone', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:8148226' }, IV: { F: 1, source_pmid: 'PMID:6662164' }, IM: { F: 1, source_pmid: 'PMID:6487477' } },
    hl: { PO: 8.1, IV: 6.5, IM: 9.6, TD: 16.6 }, refs: ['PMID:6662164', 'PMID:21899210', 'PMID:6487477'],
    note: 'PK: three routes, three separate failures. The oral half-life of 8.1 h is verbatim and stands, but it was copied onto the intravenous row from a study comparing ORAL WITH TOPICAL dosing; the intravenous value is 6.5 h (PMID:6662164, eight healthy adults on a phosphate bolus). The intramuscular row cited a DEPOT product whose own paper gives 9.6 h for betamethasone and 80.8 h for the 17-monopropionate ester (PMID:21899210), so no single intramuscular half-life represents that product and 9.6 h is stored for the immediate species only; intramuscular F of 1 holds only for a phosphate-only solution (PMID:6487477), the same paper showing depot availability is much lower. THE TRANSDERMAL ROW CONTRADICTED ITS OWN CITATION: 5 h against a stated 16.6 h. All three volumes of 67 L are dropped — no abstract found states any numeric betamethasone volume — along with oral F 0.72 (from a paper with no intravenous arm) and both absorption rates, which sit beside stated peaks at 2.8 h.',
    summary: 'betamethasone — 3 routes, 3 failures; TD half-life contradicted its own paper (5 vs 16.6 h)' },

  { slug: 'famciclovir', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 105, F: 0.77, source_pmid: 'PMID:8876860' } },
    hl: { PO: 2.15 }, refs: ['PMID:8162668', 'PMID:1336464', 'PMID:8876860'],
    note: 'PK: real-PMID zero-content, and EVERY VALUE HERE DESCRIBES PENCICLOVIR, not famciclovir — the parent is a diacetyl ester prodrug that is not the measured species. Half-life corrected 2.5 -> 2.15 h (PMID:8162668, nine healthy subjects on 500 mg orally); V 105 L is 1.5 L/kg measured after INTRAVENOUS PENCICLOVIR (PMID:1336464, fifteen subjects), so it is a true volume that pairs safely with a bioavailability; F 0.77 is retained but is REVIEW-GRADE only (PMID:8876860). ka 1.4 /h dropped. penciclovir is still not a slug in this registry, so the analyte the numbers describe cannot yet be named as its own record.',
    summary: 'famciclovir — zero-content; all four values are penciclovir, which is still not a slug' },

  { slug: 'butalbital', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 56, source_label: 'FDA label: Fioricet (butalbital/acetaminophen/caffeine), butalbital component — half-life 35 h, Vd ~0.8 L/kg (~56 L), 59-88% renal elimination.' } },
    hl: { PO: 35 }, refs: ['PMID:29124988'],
    note: 'PK: no PubMed primary exists for butalbital, so this record stays label-cited by necessity and now says so. The volume of 0.8 L/kg does appear verbatim in a human case report (PMID:29124988), but as a BACKGROUND STATEMENT rather than a measurement, and the half-life of 35 h remains unverifiable against any abstract. F 0.95 and ka 1 /h are dropped: both were invented beyond what the quoted label states, which says nothing about either.',
    summary: 'butalbital — F and ka invented beyond the quoted label; the rest stays label-cited by necessity' },

  { slug: 'methyldopa', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 42, F: 0.25, source_pmid: 'PMID:781212' }, IV: { V_L: 42, F: 1, source_pmid: 'PMID:7047042' } },
    hl: { PO: 1.28, IV: 1.28 }, refs: ['PMID:7047042', 'PMID:7093115'],
    note: 'PK: F 0.25 is verbatim and stands (PMID:781212, eleven subjects). The half-life is corrected 2 -> 1.28 h, the beta-phase figure in normal subjects, and V 28 L becomes 42 L from 0.60 L/kg — both from PMID:7047042, a review, so they are flagged as review-grade. THE STORED V WAS ALSO BYTE-IDENTICAL TO TERAZOSIN 28 L, an unrelated drug, which is what drew this record into the batch. ka 1 /h dropped. EFFECT IS DECOUPLED FROM PLASMA: the antihypertensive effect half-life is about 10 hours against a plasma curve of 1.28 h (PMID:7093115), because the active species is alpha-methylnoradrenaline formed centrally.',
    summary: 'methyldopa — V 28 L was shared byte-identically with terazosin; half-life 2 -> 1.28 h' },
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

/** irbesartan kₑₒ 0.65 was the MEAN of two stated endpoints; store one of them. */
{
  const c = need('irbesartan');
  if (c.effect_compartment?.keo_per_h === 0.65) {
    c.effect_compartment = {
      keo_per_h: 0.62, source_pmid: 'PMID:17315536',
      note: 'SBP endpoint, 300 mg PO; abstract verbatim "K(eo) values were 0.62 ± 0.09 and 0.68 ± 0.07 h⁻¹" for SBP and DBP. The systolic value is stored; the previous 0.65 was their mean, which the paper never reports.',
    };
    log.push('irbesartan — kₑₒ 0.65 (a mean of two endpoints) -> 0.62, the stated systolic value');
  } else log.push('irbesartan kₑₒ — already corrected, skipped');
}

/** Records where nothing survives. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  alendronate: ['uncharacterized',
    'A plasma block cannot represent this drug. The stored 240 h is a sampling-truncation artifact: plasma falls to about 5% of peak within 6 h while the true terminal half-life exceeds 10 years, because disposition is skeletal uptake and slow release (PMID:9333131), and its kinetics were characterised from urine rather than plasma. F 0.007 is verbatim in PMID:10384857 and is preserved here; V 28 L and ka 0.5 /h had no source.',
    ['PMID:9333131']],
  nilotinib: ['uncharacterized',
    'Real PMID, zero content: the cited paper states none of the four stored values. Absolute bioavailability has never been measured — there is no human intravenous nilotinib, and the literature says only that 31% is "assumed" (PMID:21827214). Food defeats a scalar F outright: exposure rises 50-82%, and up to 180% for capsules (PMID:40349288), which also models absorption as zero-order with a lag. No abstract states a volume; the 17 h half-life is review-grade only (PMID:21419933).',
    ['PMID:21827214', 'PMID:21419933', 'PMID:40349288']],
  artemisinin: ['uncharacterized',
    'Real PMID, zero content, and no fixed parameter set is defensible: artemisinin induces its own metabolism to an unusual degree. Exposure falls to 24% of day 1 by day 7 (PMID:9443848) and oral clearance rises from 207 to 981 L/h within one course (PMID:11678781). Hepatic extraction is 0.93 rising to 0.99 (PMID:15676041), capping F near 0.07 then 0.01, so the stored 0.32 was 5-30x high. V 30 L is contradicted ~50x by the cited paper own clearance.',
    ['PMID:9443848', 'PMID:11678781', 'PMID:15676041']],
  nitrofurantoin: ['uncharacterized',
    'Real PMID, zero content on all four, and a plasma compartment does not represent this drug. Its own citation shows urinary exposure exceeds plasma by about 150-fold and that renal excretion is saturable, so no linear volume, bioavailability or rate is meaningful. The true oral half-life is 0.72-0.79 h (PMID:18429968). The stored F 0.4 is that study 39-44% urinary recovery, which is F times the excreted fraction, not bioavailability.',
    ['PMID:18429968', 'PMID:30184207']],
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
