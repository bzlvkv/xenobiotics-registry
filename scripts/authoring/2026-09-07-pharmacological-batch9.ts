/**
 * 2026-09-07-pharmacological-batch9.ts
 *
 * Ninth batch of the pharmacological category: 40 compounds, eight agents, plus
 * a ninth agent that audited a single authoring script's central claim.
 *
 * ── A SECOND, STRONGER ARITHMETIC TEST: THE Cmax/AUC IDENTITY ──────────
 * At the peak, ka*e^(-ka*tmax) = ke*e^(-ke*tmax), and the absorption terms
 * cancel exactly:
 *      Cmax = (F*D/V) * e^(-ke*tmax)      AUC = F*D/(V*ke)
 *      ==>  Cmax/AUC = ke * e^(-ke*tmax)   INDEPENDENT of ka, V and F
 * Verified numerically to 1e-12. Consequence: any published {Cmax, AUC, Tmax,
 * t-half} quartet either fits this model or CANNOT BE FITTED BY ANY ka, V OR F.
 * That is strictly stronger than the clearance test, where a bad number can
 * always be traded off against another. The only escape is lag_hr.
 * Corollary floor: AUC/Cmax >= 1/ke. Records found BELOW the floor, i.e.
 * unrepresentable here at any parameter choice: mesalamine (6.8x outside the
 * ceiling), rabeprazole (no ka reaches its published Cmax), trimetazidine (both
 * arms), sumatriptan-succinate (2.5x), dapagliflozin (4.7x), ketoconazole
 * (1.50x on the marketed tablet). Where a record could be fixed, the note says
 * WHICH of Cmax and AUC the fix preserves, because they cannot both be kept.
 *
 * ── AN AUTHORING SCRIPT'S CENTRAL CLAIM, AUDITED IN FULL ───────────────
 * 2026-05-26-wave25-ka-from-tmax.ts derived ka for 44 drugs by inverting
 * Tmax = ln(ka/ke)/(ka-ke), and its header claimed "Each Tmax is verbatim from a
 * primary human oral PK study". ALL 44 WERE CHECKED: 16 PASS, 28 FAIL — 14 are
 * the arithmetic midpoint of a stated range, 5 appear nowhere in the abstract,
 * 7 cite an abstract with NO Tmax at all, and 2 take another drug's arm or a
 * renal-failure population. AND THE HEADER'S OWN SPOT-CHECK SENTENCE IS 25%
 * ACCURATE: of the four entries it names as re-confirmed, only rosuvastatin
 * holds. That header is retracted in place, in the script itself.
 * Fifteen failing entries were still live; they are disclosed below rather than
 * deleted, because a midpoint of a narrow range is usually inside the true
 * spread and deleting would push each value to the solver's ka default of 1.0.
 *
 * ── AND THE AUDIT CORRECTED TWO OF MY OWN "CONFIRMED" ENTRIES ──────────
 * I had recorded lurasidone 2.0 h as verbatim from earlier batches. It is the
 * midpoint of "within 1.0-3.0 h". And fluvastatin 1.0 h passes only as a unit
 * conversion — its source says "60.0 +/-30.0 minutes".
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Occ { receptor?: string; ec50_mg_l?: number; emax?: number; source_pmid?: string; note?: string; [k: string]: unknown }
interface Dose { min: number; max: number; typical: number; unit: string }
interface Compound {
  slug: string; routes?: string[]; doses?: Record<string, Dose>; mw_g_mol?: number;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  pk_analyte?: string; pk_analyte_name?: string;
  effect_compartment?: { keo_per_h?: number; approximated?: boolean; source_pmid?: string; note?: string; [k: string]: unknown };
  receptor_occupancy?: Occ[];
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const FIXES: { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'atorvastatin', guard: (c) => c.pk?.PO?.V_L === 380,
    pk: { PO: { ka_hr: 2.5, V_L: 381, F: 0.14, source_pmid: 'PMID:14531725' } },
    hl: { PO: 7 }, refs: ['PMID:22801271'],
    note: 'PK: CLASS 12, AND THE FIX IS TO PUT THE WHOLE BLOCK ON ONE SELF-CONSISTENT ABSTRACT. The stored half-life of 11.4 h is verbatim, but from a DIFFERENT dataset — a terminal t1/2z for parent acid — while the volume belongs with a 7 h effective half-life. Bolting the terminal slope onto that volume dropped implied clearance to 23.1 L/h against the review own "The total plasma clearance of atorvastatin acid is 625 mL/min", and inflated exposure 2.24x AGAINST THE VERY PAPER THE RECORD CITED. CLASS 6 IS ACQUITTED, AND PROVABLY SO: no human intravenous atorvastatin study exists, but three numbers in one abstract are mutually consistent ONLY if the volume is true — "The volume of distribution of atorvastatin acid is 381L" with that clearance and "the half-life is about 7 hours" reproduce each other to 0.6%, whereas a V/F reading would imply a 0.98 h half-life and contradict the same sentence. The stored 380 was off by one from the verbatim 381. THE ANALYTE IS CORRECT WITH A SCOPE CAVEAT: the mass and both sources are the acid, so there is no acid-versus-lactone confusion, but the same paper shows the ortho-hydroxy metabolite carrying 1.8 times the parent exposure, so the prose claim that a long half-life permits any-time-of-day dosing is METABOLITE-DRIVEN and the record models the minority species.',
    summary: 'atorvastatin — a terminal half-life on a 7 h volume, 2.24x against its own citation' },

  { slug: 'pioglitazone', guard: (c) => c.half_life_hr?.PO === 7,
    pk: { PO: { ka_hr: 1.5, V_L: 17, F: 0.83, source_pmid: 'PMID:11594240' } },
    hl: { PO: 8.3 }, refs: ['PMID:15900286'],
    note: 'PK: THE HALF-LIFE WAS REFUTED BY THE ABSTRACT THE RECORD ALREADY CITED, which states the control value verbatim in the course of reporting an interaction — "prolonged its elimination half-life (t (1/2) ) from 8.3 to 22.7 hours". The stored 7 matches that paper, nor a 4.9 h value at 30 mg, nor a review "about 9 hours". F 0.83 becomes verbatim from a paper that was not cited at all: "It is well-absorbed, with a mean absolute bioavailability of 83% and reaching maximum concentrations in around 1.5 hours". THAT SAME SENTENCE IS ALSO THE PROBABLE ORIGIN OF ka 1.5, WHERE 1.5 IS A Tmax — and as a rate it does not even reproduce it, peaking at 2.04 h where 1.5 h would need about 2.3. Flagged as a strong candidate rather than a certainty, because 1.5 is also a round default elsewhere in this catalog; the co-location of both stored numbers in one sentence of an uncited paper is what makes it hard to read otherwise. CLASS 12 IS ACQUITTED: the cited study shows a perpetrator raising exposure 3.2x and half-life 2.7x with "no significant effect on its peak concentration (C max)", a pure clearance effect, so one compartment describes this drug well. V 17 is in no abstract and is NOT called as class 6, because it matches no obvious multiple of the label apparent volume.',
    summary: 'pioglitazone — its own cited abstract states the control half-life it contradicts' },

  { slug: 'emtricitabine', guard: (c) => c.half_life_hr?.PO === 10,
    pk: { PO: { ka_hr: 3.4, V_L: 177, F: 0.93, source_pmid: 'PMID:26195515' } },
    hl: { PO: 6.4 }, refs: ['PMID:26195515', 'PMID:22129166', 'PMID:24802019'],
    note: 'PK: CLASS 12 AT 2.55x, MEASURED AGAINST ITS OWN CITATION. That bioequivalence paper states none of the four stored values but does state the exposure that convicts them — "the AUC(0-infinity) were 10,615.14 ... ng x h/mL" at 200 mg, i.e. a clearance of 18.8 L/h against the stored 7.38 — and an independent study agrees at "apparent clearance (CL/F): 25.0 ... vs. 20.6 ... L/h". THE STORED HALF-LIFE IS NEITHER OF THIS DRUG TWO PHASES: "for emtricitabine, 41 h [36 to 54 h] versus 6.4 h (5.9 to 7.6 h)" over 216 h and over 0-24 h respectively, and for a once-daily model the 0-24 h figure is the right one. ka 1.4 implied a 2.26 h peak against a measured 1.05 h for the drug given alone — AND NOTE THAT 1.40 IS ANOTHER ARM Tmax IN HOURS IN THE SAME SENTENCE, which is the confirmed collision shape, though 1.4 L/kg is also this drug label volume so the path is not proven. V 99 L IS VERBATIM LAMIVUDINE INTRAVENOUS Vdss, and lamivudine holds 91 L, its own label figure — RECORDED, NOT ASSERTED, because the label coincidence is real and both volumes are wrong by the same mechanism anyway. THE FIX PRESERVES EXPOSURE AND COSTS THE PEAK: this drug is genuinely biexponential, and the AUC-matched volume under-predicts the observed peak by about half.',
    summary: 'emtricitabine — 2.55x on a half-life that is neither of its two published phases' },

  { slug: 'lamivudine', guard: (c) => c.pk?.PO?.V_L === 91,
    pk: { PO: { ka_hr: 3.7, V_L: 206, F: 0.86, source_pmid: 'PMID:17962426' } },
    hl: { PO: 7 }, refs: ['PMID:9989342', 'PMID:8750368'],
    note: 'PK: CLASS 12, AND THE CONTRADICTION IS INSIDE THE RECORD OWN CITATION. That paper states "Mean oral clearance (CL/F) values of lamivudine, zidovudine, and nevirapine for the fixed-dose combination were 23.7, 127, and 1.65 L/h" while the stored triple implies 10.48 — 2.26x below a number printed in its own abstract, and three further sources cluster at 20-28 L/h. EVERY STORED VALUE TRACES TO A REVIEW THAT WAS NOT THE CITED SOURCE. ka 1.5 IS A Tmax RANGE ENDPOINT read as a rate — "maximum serum concentrations usually attained 0.5 to 1.5 hours after the dose" — and it implies a 1.94 h peak, ABOVE the entire published range. V 91 L is that review "approximately 1.3 L/kg following intravenous administration", which is NOT class 6 because it is genuinely intravenous, but IS class 12 because it is a STEADY-STATE volume: an independent study proves it, its Vss of 99 L equalling clearance times mean residence time exactly while the terminal half-life is 8.4-9.1 h. F and the half-life are both range endpoints of "86% to 88%" and "approximately 5 to 7 hours". The volume moves to the value reproducing the clearance stated in the record own source, at the same cost to the peak as its sister record.',
    summary: 'lamivudine — 2.26x below a clearance printed in its own abstract; V was a Vss' },

  { slug: 'atazanavir', guard: (c) => c.pk?.PO?.V_L === 91,
    pk: { PO: { ka_hr: 3.4, V_L: 103, F: 1, source_pmid: 'PMID:19329800' } },
    hl: { PO: 9.91 }, refs: ['PMID:19329800', 'PMID:19043924'],
    note: 'PK: A PUBLISHED ONE-COMPARTMENT MODEL EXISTS WITH EXACTLY THIS SOLVER STRUCTURE AND WAS NOT USED — "Final estimates of apparent oral clearance (CL/F), volume of distribution (V/F) and absorption rate constant ... were 7.7 L/h (5, 29), 103 L (13, 48) and 3.4 h(-1) (34, 154); a lag-time of 0.96 h (1)". The stored absorption rate was 5.7x too slow and the volume 12% low. THE HALF-LIFE WAS REFUTED BY THE RECORD OWN REFERENCE: "Geometric mean terminal elimination half-life to 72 h of atazanavir was 8.35 h and not different from the 0-24 h half-life (9.91 h)", on the same boosted regimen, where the source_label claimed 9-18 h and that range could not be verified anywhere. CLASS 6 IS ACQUITTED DELIBERATELY: there is no human intravenous atazanavir, so every published volume is apparent and pinning F to 1 is the correct convention rather than a gap. MY OWN PRIOR THAT THE BOOSTED AND UNBOOSTED STATES DIFFER SEVERAL-FOLD IS REFUTED — "Atazanavir CL/F was reduced by ritonavir by 45%", about 1.8x — but the record still spans two clinical states, because its dose block reaches 400 mg, WHICH IS THE UNBOOSTED REGIMEN, while every stored parameter describes the boosted one. The lag time is not representable here, so absorption starts about an hour early.',
    summary: 'atazanavir — a one-compartment popPK matching this solver exactly, uncited; ka 5.7x slow' },

  { slug: 'imatinib', guard: (c) => c.pk?.PO?.V_L === 139,
    pk: { PO: { ka_hr: 0.94, V_L: 347, F: 0.98, source_pmid: 'PMID:16842382' } },
    hl: { PO: 18 }, refs: ['PMID:16842382', 'PMID:16122278', 'PMID:14747424', 'PMID:26189007'],
    note: 'PK: A TWO-COMPARTMENT CENTRAL VOLUME IN A ONE-COMPARTMENT RECORD. The cited paper is explicit — "a two-compartment open model with sequential zero- then first-order absorption ... oral clearance of 19 L/h ... central volume of distribution (V c/F) of 139 L ... apparent peripheral volume of distribution (V p/F) of 130 L" — and the stored triple implied 5.46 L/h, 3.48x below that paper own clearance. The replacement is chosen for its MODEL SHAPE as much as its numbers: "A ONE-COMPARTMENT MODEL with first-order absorption appropriately described the data, giving a mean (+/-SEM) oral clearance of 14.3 l h-1 (+/-1.0) and a volume of distribution of 347 l", which lands within 5% and is internally consistent with the stored half-life. THE PHYSICAL CHECK IS DECISIVE AND SHOWS THE OLD VALUE WAS A STATE ERROR: at 139 L the model put steady-state peak at 4.08 mg/L against a measured "2.6 +/- 0.8" and trough at 1.93 against "1.2 +/- 0.8" — it reproduced the STEADY-STATE peak on the FIRST dose. MY PRIOR THAT IMATINIB BIOAVAILABILITY IS GENUINELY MEASURED IS CONFIRMED, verbatim twice, and class 6 is therefore immaterial: at 98% apparent and true are indistinguishable. Its active metabolite has "comparable pharmacological activity to the parent drug" and is not modelled.',
    summary: 'imatinib — a 2-compartment Vc in a 1-compartment record; replaced by a 1-compartment fit' },

  { slug: 'bicalutamide', guard: (c) => c.pk?.PO?.ka_hr === 0.06,
    pk: { PO: { ka_hr: 0.155, V_L: 41, F: 1, source_pmid: 'PMID:21353117' } },
    hl: { PO: 168 }, refs: ['PMID:8310708', 'PMID:15509184'],
    note: 'PK: THE CITED PAPER CARRIES FOUR EXCELLENT VERBATIM NUMBERS AND NONE OF THEM WERE THE FOUR STORED — "Median T(max) was 24 hours for both formulations. The C(max) ... was 1176.2 (191.6) ... The corresponding values for AUC(0-672) were 277,503 (66,865) ... mug . h/L" at 50 mg — against which the stored record was 2.20x under on exposure, 2.32x under on peak and 1.90x late on the peak time. The values adopted are FITTED to reproduce all three of those verbatim measurements and are disclosed as fitted: no abstract states a bicalutamide volume or absorption rate at all, and F 1 is an assumption because this drug has no human intravenous form. MY WARFARIN-SHAPED PRIOR THAT ONE HALF-LIFE MUST BE A TWO-ENANTIOMER BLEND IS REFUTED, AND THE RECORD ALREADY DOCUMENTED WHY: the R-enantiomer peaks at 559-970 ng/mL and declines over 4.2 days while S peaks at 32-66 ng/mL and clears in 19 h, and "Plasma concentrations of the racemate were in very good agreement with the sum of the enantiomer concentrations" — so past the first day THE RACEMATE CURVE IS THE R CURVE. The half-life becomes the verbatim "a long plasma elimination half-life (1 week)". Its free fraction stays label-grade: the only indexed figure is "greater than 95%", an inequality that must not be entered as a point value.',
    summary: 'bicalutamide — 2.2x under on its own citation; the enantiomer-blend prior refuted' },

  { slug: 'tamoxifen', guard: (c) => c.pk?.PO?.V_L === 1400,
    pk: { PO: { ka_hr: 1.37, V_L: 911, F: 1, source_pmid: 'PMID:7427960' } },
    hl: { PO: 96 }, refs: ['PMID:7427960', 'PMID:16361559'],
    note: 'PK: THE VOLUME AND THE HALF-LIFE CAME FROM DIFFERENT ERAS. The stored 96 h is verbatim and correctly the PARENT — "The half-lives of the drug and metabolite were approximately 4 and 9 days" — but the volume belongs with the modern 5-to-7-day figure, since the apparent volume implied by a measured steady-state exposure at a 6-day half-life is about 1367 L. Adam own abstract even flags the instability: "After three widely separated single doses, a reversible increase in elimination half-life occurred." Class 12 compounded by a superseded value. The repair keeps the VERBATIM half-life and moves the volume to reproduce the best exposure anchor, "the area under the plasma concentration versus time curve (AUC) of tamoxifen at steady state before [3.04 mg h/L; 90% CI, 2.71-3.44]" on 20 mg daily, against which the stored pair asserted a clearance 1.54x too high. F 1 IS A RELATIVE BIOAVAILABILITY READ AS ABSOLUTE — that paper compares a TABLET TO A SOLUTION, tamoxifen has no human intravenous form, and its absolute availability has never been measured — so F is pinned as a convention rather than a claim. ONE COMPARTMENT CANNOT SATISFY BOTH the steady-state exposure and this drug single-dose peak; exposure is preserved. MY WRONG-MASS PRIOR IS REFUTED BY ABSENCE: mw 371.51 IS the free base and this record has NO occupancy row for a mass error to propagate into.',
    summary: 'tamoxifen — a 1980 half-life paired with a modern volume; F is tablet-versus-solution' },

  { slug: 'oxazepam', guard: (c) => c.half_life_hr?.PO === 8,
    pk: { PO: { V_L: 41, F: 0.93, source_pmid: 'PMID:3197746' } },
    hl: { PO: 5.8 },
    note: 'PK: THE BEST CONTROL IN ITS GROUP, AND ONLY TWO FIELDS MOVE. F 0.93 is verbatim ("a bioavailability of 92.8%") and V 41 L is verbatim by the registry own weight convention ("volume of distribution at steady-state (Vss) 0.59 l.kg-1"), INTRAVENOUS in the same subjects who took the oral dose, so class 6 is acquitted outright. The half-life was the single inconsistency: that paper reports 6.7 h intravenously and 5.8 h orally and the record stored 8, which made implied clearance 27% low against the paper own figure. A NEAR-MISS IS RECORDED SO NOBODY "CORRECTS" IT BACK: 8 h is within three percent of a real verbatim mean elsewhere in this literature, "longer in females (mean: 9.7 hr) than in males (7.8 hr)", and within one percent of an elderly median of 8.1 h — it is defensible literature, simply not this citation number. ka 0.5 is REMOVED rather than replaced: it implied a 4.24 h peak against this paper own "the peak plasma level was reached in 1.7 to 2.8 h", both available Tmax figures are RANGES so a midpoint is barred, and deleting lands on the solver default of 1.0, which puts the peak at 2.41 h — inside both published ranges. It was also not a default to begin with; the solver default is 1.0, so 0.5 was entered deliberately and unsourced.',
    summary: 'oxazepam — the one inconsistency was a half-life its own paper contradicts twice' },

  { slug: 'esketamine', guard: (c) => c.half_life_hr?.IN === 8,
    pk: { IN: { ka_hr: 7.45, V_L: 752, F: 0.54, source_pmid: 'PMID:33128208' } },
    hl: { IN: 4.57 },
    note: 'PK: THE VOLUME AND THE CLEARANCE ARE STATED IN ONE SENTENCE AND ONLY THE VOLUME WAS TAKEN. "Esketamine volume at steady state and clearance were 752 L and 114 L/h, respectively" — the record kept the 752, dropped the clearance, and paired the volume with an unsourced 8 h, asserting 120.7 L/h against that paper own 211.1 and over-predicting exposure 1.75x. F 0.54 is verbatim and is correctly the 56 mg half of "The absolute bioavailability of 56 and 84 mg of intranasal esketamine is 54 and 51%", matching this record typical dose. THE FIX PRESERVES THE PEAK AND IS STATED AS SUCH: holding the verbatim volume forces the half-life to 4.57 h, whereas restoring the paper clearance at 8 h would need a 1316 L volume and collapse the peak. EVEN THEN THE RECORD CANNOT BE RIGHT ON BOTH — the abstract says "An open linear model for esketamine (THREE COMPARTMENTS)" and the true exposure-to-peak ratio is well below what one compartment can produce. NO TRANSPLANT WITH KETAMINE, the fifth consecutive negative on a marketed enantiomer or metabolite pair: no field matches, and the shared molecular mass is CORRECT because enantiomers have identical mass. ka 4 implied a 59 minute peak against a published 22-32 minutes.',
    summary: 'esketamine — its citation gave V and CL in one sentence; only V was taken, 1.75x' },

  { slug: 'cefdinir', guard: (c) => c.pk?.PO?.V_L === 245,
    pk: { PO: { ka_hr: 0.5, V_L: 48, F: 1, source_pmid: 'PMID:15631795' } },
    hl: { PO: 1.73 }, refs: ['PMID:8222489'],
    note: 'PK: THE LARGEST ERROR IN THIS BATCH AT 24.5x, AND IT IS A DOUBLE DIVISION. The cited paper supports only three quantities — "the Tmax, Cmax and T1/2beta of cefdinir and cefpodoxime after oral administration of 100 mg were 2.5 h +/- 0.48 h, 0.81 mg/L +/- 0.19 mg/L, 1.73 h +/- 0.3 h" — and states no volume, clearance or bioavailability at all. The stored pair gave an effective apparent volume of 1167 L and a clearance of 476 L/h FOR A RENALLY CLEARED BETA-LACTAM, more than five times hepatic blood flow. Against a verbatim "AUC(0-12) ... 10.3 +/- 1.35 micrograms.hr/ml" the model produced 0.42. CLASS 6 IS PROVABLE HERE RATHER THAN INFERRED: cefdinir has NO INTRAVENOUS FORMULATION, so an absolute bioavailability cannot have been measured and any published volume must be apparent. The replacement is triangulated two independent ways — from that exposure and from the peak — landing on the same apparent volume within 7%, and it reproduces both to within 5%. A NEAR-MISS IS RECORDED SO NOBODY TAKES THE OBVIOUS SHORTCUT: 245 is exactly ten times the textbook 24.5 L, a tempting dropped-decimal story, BUT AT 24.5 L THE RECORD IS STILL 2.45x LOW — the defect is the double division, not a lost decimal point. Its own Tmax of 2.5 h also exceeds the one-compartment ceiling its own half-life implies.',
    summary: 'cefdinir — 24.5x from a V/F double division; the dropped-decimal story is wrong' },

  { slug: 'rifabutin', guard: (c) => c.pk?.PO?.F === 0.16,
    pk: { PO: { ka_hr: 1.5, V_L: 595, F: 0.2, source_pmid: 'PMID:2552902' } },
    hl: { PO: 36 }, refs: ['PMID:7736687', 'PMID:2177293', 'PMID:7698069'],
    note: 'PK: DO NOT STRIP THIS RECORD — IT IS EMPHATICALLY NOT THE CARBAMAZEPINE SHAPE, and two papers say so verbatim. "After repeated administration, induction of metabolism was indicated by lower AUC and Cmin values ... THE ELIMINATION HALF-LIFE WAS UNCHANGED AFTER REPEATED ADMINISTRATION ... induced systemic clearance (if any) should be of minor importance", and "Under autoinduction conditions, the elimination half-life of rifampicin decreases, whereas THAT OF RIFABUTIN IS NOT ALTERED." Carbamazepine was stripped because autoinduction moves its ELIMINATION parameter two- to threefold, so no single rate is valid; rifabutin induction lands on first-pass metabolism, which one steady-state bioavailability can hold. The magnitude cannot be established — no abstract states a number — and that is logged as an unsourceable gap rather than a strip trigger. F 0.16 was the computed midpoint of "Oral bioavailability was 12 to 20%" and becomes the verbatim "about 20% after single dose administration", the single-dose state this record models; the 12-20% range comes from patients already autoinduced at day 28. ka 0.7 implied a 5.28 h peak against a verbatim "about 2 to 3 h". CLASS 6 IS ACQUITTED — an intravenous tracer arm existed. A CLASS-13 NEAR-MISS IS RECORDED: a review states "The elimination half-life of rifabutin is long (45 hours)", but AT 45 h THE CLEARANCE TEST FAILS, falling below the verbatim 10-18 L/h floor, whereas 36 h is verbatim from a primary AND arithmetically consistent. KEEP 36.',
    summary: 'rifabutin — its half-life is verbatim UNCHANGED on repeat dosing; not a carbamazepine' },

  { slug: 'allopurinol', guard: (c) => c.half_life_hr?.PO === 2,
    pk: { PO: { ka_hr: 1.18, V_L: 54.9, F: 0.904, source_pmid: 'PMID:7094977' } },
    hl: { PO: 0.797 }, refs: ['PMID:7094977', 'PMID:10583019', 'PMID:639435'],
    note: 'PK: THE HALF-LIFE WAS OFF BY A FACTOR OF 2.5 AND TWO PRIMARIES SAY SO. "Serum half-lives of allopurinol and oxipurinol were 39 +/- 11 min and 13.6 +/- 2.8 hr" and "an elimination half-life of 47.8 +/- 10.6 min" — ALLOPURINOL HALF-LIFE IS FORTY TO FORTY-EIGHT MINUTES, not the 2 h stored, which is the textbook range endpoint. The whole block moves to one study that dosed BOTH intravenously and orally, giving a verbatim half-life, a verbatim clearance of 11.37 ml/min/kg and a verbatim "The bioavailability of oral allopurinol computed from plasma data was 90.4 +/- 8.7%"; the volume and absorption rate are derived from those inside that single fit and the derived peak lands at 0.98 h, INSIDE that paper own "reached within 30 to 120 min". The previously stored bioavailability was itself verbatim and correctly sourced, from four subjects, and is superseded only to keep one coherent set. V 65 L WAS PROBABLY A CLEARANCE READ AS A VOLUME: the cited abstract gives a volume only for the METABOLITE, and neither of its two figures is 65, but it does state "Total clearance of allopurinol ... (15.7+/-3.8 ml min-1 kg-1)", which at the reference weight is 65.94 L/h. Offered as a hypothesis. The record pharmacology belongs to oxipurinol, but it carries no occupancy row, so nothing currently makes a false effect claim.',
    summary: 'allopurinol — a 40-minute half-life stored as 2 h; V 65 is probably its clearance' },

  { slug: 'zileuton', guard: (c) => c.pk?.PO?.F === 0.8,
    pk: { PO: { ka_hr: 1.315, V_L: 115, F: 1, source_pmid: 'PMID:8620668' } },
    hl: { PO: 2.3 },
    note: 'PK: THE VOLUME IS VERBATIM AND THE ABSTRACT OWN WORDING MAKES IT APPARENT — "apparent total plasma clearance, and APPARENT terminal phase volume of distribution values after the q8h and q6h regimens were ... 793 +/- 233 and 579 +/- 162 ml/min, and 179 +/- 126 and 115 +/- 29L, respectively" — so pairing it with an independent bioavailability divided by that quantity twice. THE DIRECTION WAS CHECKED BEFORE ACTING, as the contract requires, AND HERE FIXING F ALONE MAKES THE RECORD BETTER: implied clearance moves from 1.15x high to 0.92x of the paper own figure. Note the stored volume is also the q6h ARM ONLY, where the q8h arm is 179 L. The half-life was stated nowhere in that abstract, which reports only peak concentration, peak time, clearance and volume; the value adopted is that paper own volume over its own clearance for the same arm. ka 1.5 is removed for a reason worth recording: the abstract verbatim peak time is "1.5 +/- 0.9 and 1.5 +/- 0.9 hours", NUMERICALLY IDENTICAL TO THE STORED RATE, which is the confirmed collision shape — although 1.5 is also a catalog default on two dozen routes, and it does not even reproduce that peak time. THE DOSE BLOCK IS SEPARATELY WRONG and is corrected: it mixed an immediate-release unit dose, a controlled-release unit dose and a daily total.',
    summary: 'zileuton — an apparent volume beside an F; and fixing F alone IMPROVES it' },

  { slug: 'trimetazidine', guard: (c) => c.half_life_hr?.PO === 3.45,
    pk: { PO: { ka_hr: 1.028, V_L: 197.6, F: 1, source_pmid: 'PMID:17208404' } },
    hl: { PO: 4.74 }, refs: ['PMID:17208404', 'PMID:21899207'],
    note: 'PK: THE CITED PAPER STUDIED A DIFFERENT PRODUCT, AND THE Cmax-OVER-AUC IDENTITY PROVED ITS NUMBERS UNUSABLE. It is a bioequivalence study of two 35 mg MODIFIED-RELEASE formulations while this record doses the 20 mg immediate-release tablet, and BOTH OF ITS ARMS FALL BELOW THE ONE-COMPARTMENT FLOOR — exposure over peak of 4.695 and 4.510 hours against floors of 4.977 and 5.324 — so NO CHOICE OF ABSORPTION RATE, VOLUME OR BIOAVAILABILITY COULD HAVE FITTED THEM. The physical reason is benign, because it is a modified-release product and this solver does have a zero-order input term, but the right repair for a 20 mg immediate-release record is a different citation. The replacement dosed exactly this product at exactly this dose, and ITS QUARTET PASSES THE IDENTITY ALMOST EXACTLY, at 0.982 and 1.007 across two arms. The stored bioavailability was never absolute — that study reports only ratios of 106.19%, 104.74% and 106.30% — and the stored volume was back-derived from its exposure and half-life. The old set also asserted a clearance of 1250 mL/min FOR A DRUG SIXTY PERCENT RENALLY EXCRETED UNCHANGED, several-fold above filtration and above hepatic blood flow; it faithfully encoded a number that is itself an outlier. A NEAR-MISS: the stored ka of 1.0 IS THE SOLVER OWN DEFAULT AND IS ESSENTIALLY RIGHT, within 3% of the properly-sourced value.',
    summary: 'trimetazidine — an MR citation on an IR record whose quartet is below the model floor' },

  { slug: 'dapoxetine', guard: (c) => c.pk?.PO?.F === 0.42,
    pk: { PO: { ka_hr: 1.5, V_L: 126, F: 1, source_pmid: 'PMID:16490806' } },
    hl: { PO: 2.97 }, refs: ['PMID:16920897', 'PMID:17322143'],
    note: 'PK: A 6.45x ERROR THAT DECOMPOSES EXACTLY INTO TWO NAMED CLASSES MULTIPLYING TOGETHER. Removing the double division by bioavailability accounts for 2.38x, and replacing a DISTRIBUTION half-life with an effective one accounts for 2.71x; their product is the whole error. The stored 1.4 h is verbatim but the same sentence names it: "Elimination was biphasic, with an initial half-life of approximately 1.4 hours and a terminal half-life of approximately 20 hours" — AND THIS RECORD OWN PROSE ALREADY SAID "~90 min initial; ~19 h terminal", so the author knew. The old set asserted 3163 mL/min, twice hepatic blood flow and roughly sixty percent of cardiac output, against a published 29.41 L/h. NEITHER PUBLISHED HALF-LIFE IS THE RIGHT MONO-EXPONENTIAL: the terminal one fails the exposure-to-peak floor by 4.8x while the distribution one passes, and the value satisfying the identity sits between them. All four adopted numbers are DERIVED rather than verbatim and are disclosed as such; the two-compartment slot is the physically right answer but no abstract states the transfer constant it needs. ka 1.77 is removed as a back-derivation of a rounded phrase — it solves to a peak at 0.9993 h against "approximately 1 hour after dosing" — where the measured value is 1.47 h.',
    summary: 'dapoxetine — 6.45x = class 6 (2.38x) times class 12 (2.71x), exactly' },
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

/** Targeted field-level edits, where replacing the whole block would be wrong. */
const PATCH: { slug: string; route: string; set?: Record<string, unknown>; del?: string[]; hl?: number; guard: (c: Compound) => boolean; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'letrozole', route: 'PO', guard: (c) => c.pk?.PO?.source_pmid === 'PMID:9267682',
    set: { source_pmid: 'PMID:9429742' }, refs: ['PMID:9429742', 'PMID:9267682', 'PMID:11745921'],
    note: 'PK: THE CLEANEST RECORD IN ITS GROUP — CORRECT TO 0.3% — AND NOT ONE VALUE CHANGES. Every number in it came from a paper that was never cited: "Letrozole absolute systemic bioavailability after p.o. administration was 99.9 +/- 16.3%. ... Total-body clearance of letrozole from plasma after i.v. administration was low (2.21 L h-1). The calculated distribution volume at steady state (1.87 L kg-1)". The stored bioavailability is that 99.9%, the stored volume is that 1.87 L/kg at the registry weight, and the stored half-life is what those two imply — 41.7 h. The record asserts a clearance of 2.2171 L/h against that paper verbatim INTRAVENOUS 2.21. CLASS 6 IS DEFINITIVELY ACQUITTED: this is a true steady-state volume from a study with a real intravenous arm, which is the acquittal shape the contract warns can be misread in either direction. The previously cited paper is a FOOD-EFFECT study containing none of the three values and stating only "in view of the half-life of about 2 d" — 48 h, not 42. A COINCIDENCE IS RECORDED SO IT IS NOT "DISCOVERED" LATER AS A DEFECT: the numeral 42 also appears in this literature as "half-life and AUC increased significantly by 42%", a textbook collision candidate — but the derivation from the same paper own volume and clearance is a far better explanation and makes the whole triple self-consistent. MY NON-LINEARITY PRIOR WAS REFUTED IN DIRECTION: clearance FALLS and half-life RISES at steady state, so the stored single-dose state under-predicts chronic exposure by about 28%.',
    summary: 'letrozole — verified to 0.3%; only the citation moves' },

  { slug: 'cefepime', route: 'IV', guard: (c) => c.half_life_hr?.IV === 2, hl: 2.2,
    note: 'PK: THE TRIAGE FLAGGED THIS RECORD TWICE AND BOTH FLAGS ARE FALSE POSITIVES, which is worth recording as clearly as a defect. It has NO ORAL PARAMETERS ANYWHERE — the absorption rate it was flagged for sits on the INTRAMUSCULAR route, a genuine approved route where an absorption rate is correct. And the identical half-life across routes is PHYSIOLOGICALLY REQUIRED here: cefepime is over eighty percent renally excreted unchanged with a verbatim "absolute bioavailability after intramuscular dose was 100%", so the two terminal half-lives must coincide. The intravenous clearance also passes, at 5.55 L/h against a verbatim range of 4.66 to 6.55. Only the intravenous half-life moves, to the value its own citation actually states — that abstract says "about 2.2 h" in young subjects and "about 3 h" in the elderly, and 2 appears in neither. Two smaller provenance gaps are recorded rather than patched: the volume is a computed midpoint of "Vss ranged from 0.21 to 0.24 liter/kg", and the intramuscular row volume is the intravenous number copied across, filed under an abstract that states no volume. The intramuscular absorption rate is a disclosed Tmax inversion of a midpoint of "mean peak times were 1.0-1.6 hours".',
    summary: 'cefepime — both triage flags are false positives; only the IV half-life moves' },

  { slug: 'ketoconazole', route: 'PO', guard: (c) => c.pk?.PO?.F === 0.75,
    set: { V_L: 88.31, F: 1 }, refs: ['PMID:3735080'],
    note: 'PK: THE ABSTRACT OWN WORDING SETTLES CLASS 6 WITHOUT INFERENCE — "The mean ORAL clearance of the solution dose was 209 ... ml/min, and the mean APPARENT volume of distribution was 88.31 ... liters" — and NO HUMAN INTRAVENOUS KETOCONAZOLE HAS EVER EXISTED, confirmed by a companion paper that gave the intravenous arm to DOGS while humans received oral only. So the human absolute bioavailability is unmeasurable, the volume must be apparent, and the stored 0.75 was in no abstract anyway; the only availability figures in the cited paper are RELATIVE, "81.2 ... and 89.0 ... % of that of the solution". Pinning bioavailability to 1 makes the record reproduce an INDEPENDENT paper verbatim human exposure almost exactly, 50.3 against "50.0 +/- 15.2 micrograms X h/ml" at 400 mg. THE Cmax-OVER-AUC IDENTITY NEVERTHELESS FAILS ON ALL THREE FORMULATIONS, and worst on the marketed tablet at 1.50x, WHICH NO ABSORPTION RATE CAN FIX and which a lag time cannot rescue either. The mechanism is transparent: this drug DISTRIBUTION half-life of 1.5-1.7 h EQUALS ITS TABLET PEAK TIME, so the peak happens inside a phase the model has no slot for. A further caveat is stated rather than hidden: exposure is genuinely superproportional across the approved range, "The mean oral clearance decreased from 244.9 to 123.6 and 80.0 ml/min ... as the dose increased from 200 to 400 and 800 mg", so a single linear set must pick a dose to be right at, and this one anchors at 400 mg.',
    summary: 'ketoconazole — an abstract that calls its own volume apparent; F pinned, AUC to 0.6%' },

  { slug: 'darunavir', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 0.5, set: { ka_hr: 1.1 },
    note: 'PK: THIS IS THE LOPINAVIR CASE, NOT THE ATAZANAVIR CASE, AND THE REASONING IS RECORDED SO IT IS NOT RE-LITIGATED. Atazanavir was flagged because its dose range straddles two APPROVED regimens with different exposure regimes; darunavir has NEVER had an approved or marketed unboosted regimen at any dose — "The approved dosage of darunavir is 600 mg in combination with ritonavir 100mg twice daily" — and both ends of this record dose range are boosted. There is no clinical unboosted state for the schema to be ambiguous between, so a boosted-only parameterisation is unambiguous rather than incomplete. A DOUBLE-COUNTING CHECK WAS RUN AND IS CLEAN: darunavir appears in no interactions block as a victim anywhere in this catalog, so nothing currently applies ritonavir inhibition twice — but a future edge would, since these parameters already embed it. The label-only classification is confirmed: eight papers were chased and every one reports ratios, geometric mean ratios or percentage changes, with only the half-life escaping, verbatim twice. The clearance test passes to 0.1%. The absorption rate was the one unambiguous defect, implying a 5.25 h peak against a verbatim "reaching peak plasma concentrations after 2.5-4 hours". A LIMIT IS RECORDED AS A CHOICE RATHER THAN AN ERROR: the record preserves exposure and under-predicts the steady-state peak 1.58x, because a 15 h TERMINAL half-life in one compartment spreads the dose too thin — and the paper says so, naming "a fast distribution/elimination phase" before it.',
    summary: 'darunavir — the lopinavir case; ka was the one unambiguous defect' },

  { slug: 'lopinavir', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 0.7, set: { ka_hr: 0.57 },
    refs: ['PMID:21172791', 'PMID:21422211'],
    note: 'PK: VERIFIED TO 6% ON EXPOSURE — DO NOT STRIP IT, AND DO NOT "FIX" THE VOLUME OR HALF-LIFE. Lopinavir has never been approved or marketed as a single agent anywhere; the fixed combination is the only product, so unlike elvitegravir there is no second prescribed state for the schema to be ambiguous between, and the only unboosted figure in the literature is explicitly a MODEL EXTRAPOLATION FROM BOOSTED DATA rather than an administered regimen. The stored clearance of 4.27 L/h sits against a verbatim "AUC(0-12) ... 99,599" at 400 mg twice daily, which is 4.02 — 6.4% high — and inside the 4.0 to 5.6 L/h real-world span. THE CONTRACT WARNING APPLIES DIRECTLY AND WAS HEEDED: the obvious replacement is a verbatim one-compartment pair from a study of the SAME SIXTEEN VOLUNTEERS as this record own reference, "the apparent volume of distribution and absorption rate constant were 55.3 liters ... and 0.57 h(-1)", but adopting its volume and half-life makes exposure 1.34x LOW where the current pair is 1.06x high. The individually unsourced volume and half-life have a RATIO — the only thing the solver uses for exposure — that is right. Only the absorption rate moves, and that is a provenance fix rather than an accuracy one. A milder ambiguity is noted: the dose block spans a twice-daily and a once-daily regimen whose interval half-lives differ, 7.15 against 4.88 hours.',
    summary: 'lopinavir — verified to 6%; the better-provenanced replacement fits worse' },

  { slug: 'bictegravir', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 0.7,
    del: ['ka_hr'], set: { source_pmid: 'PMID:28196003' }, refs: ['PMID:28196003'],
    note: 'PK: THE RECORD OWN DATA-INTEGRITY FLAG IS MISPLACED AND IS CLOSED HERE. Its note claimed the stored volume is a central-compartment value, but the cited paper is a physiologically-based interaction study whose abstract reports only fold-changes and CONTAINS NO COMPARTMENT VOLUMES AT ALL, so that claim was unsupported in either direction. THE VOLUME AND BIOAVAILABILITY ARE ACQUITTED ON ARITHMETIC: they imply a clearance of 0.63 L/h against about 0.49 derived from a published exposure — 1.28x, the tightest agreement in that group — and an independent source states "Its systemic plasma clearance is low, and the volume of distribution is approximately the volume of extracellular water in nonclinical species", which is around fourteen litres and consistent with what is stored. Bictegravir is the one drug in its group where a low clearance and a small volume make the central and terminal volumes converge, so the usual class-12 hazard does not bite. The absorption rate is removed rather than replaced: it implied a 4.33 h peak against a verbatim "Median Tmax ranged from 1.0 to 1.8 hours (day 1, postdose) and 1.3-2.7 hours (day 10)", ABOVE THE UPPER BOUND OF THE ENTIRE PUBLISHED RANGE, and the only source reports ranges across four dose cohorts rather than a value for the dose this record models. The half-life is unsupported but sits inside that paper verbatim 15.9 to 20.9 hours.',
    summary: 'bictegravir — V/F acquitted at 1.28x; its own integrity flag was unsupported' },

  { slug: 'viloxazine', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 0.354,
    del: ['ka_hr'], set: { source_pmid: 'PMID:42503060' }, refs: ['PMID:42503060'],
    note: 'PK: BOTH CITED PAPERS ARE RATIO-ONLY AND THE ABSORPTION RATE CAME FROM A Tmax THAT DOES NOT EXIST. This record was the entry point to a wider finding: an authoring script derived absorption rates for forty-four drugs from assumed peak times, claiming each was verbatim from a primary study, and THIS ONE CITES AN ABSTRACT CONTAINING NO PEAK TIME AT ALL — only co-administration ratio percentages. The rate is removed rather than repaired. THE STORED HALF-LIFE IS ESSENTIALLY RIGHT AND ONLY NEEDED A SOURCE: a hepatic-impairment study gives matched healthy controls verbatim at 6.7, 6.0 and 7.1 hours. MY FORMULATION PRIOR WAS REFUTED AND THE RECORD IS CORRECT: viloxazine ships only as an extended-release capsule, both cited studies use it, and the immediate-release literature gives 2.2 to 4.3 hours, so the stored seven hours is genuinely formulation-extended and there is no flip-flop. THE Cmax-OVER-AUC IDENTITY NEVERTHELESS FAILS, and instructively: three independent control cohorts give an exposure-to-peak ratio of 23.7, 24.2 and 22.1 hours — strikingly dose-independent — against the 16.6 h this record parameters produce, and reaching it would need a half-life contradicting those same verbatim controls. The signature is extended-release absorption continuing past the peak, which one first-order rate cannot describe. The record preserves the PEAK and under-predicts exposure by about 29%.',
    summary: 'viloxazine — the ka came from a Tmax its cited abstract does not contain' },

  { slug: 'dapagliflozin', route: 'PO', guard: (c) => c.pk?.PO?.ka_hr === 5.12,
    del: ['ka_hr'], refs: ['PMID:19129748'],
    note: 'PK: MY TRANSPLANT PRIOR IS REFUTED AND THE THEFT RAN THE OTHER WAY — AND WAS ALREADY FIXED. "F(p.o) values for saxagliptin and dapagliflozin were 50% (48, 53%) and 78% (73, 83%), respectively": the stored bioavailability is dapagliflozin OWN, verbatim and correctly attributed. It was EMPAGLIFLOZIN that took it, and that record notes show the theft was caught in an earlier pass and pinned back. DO NOT TOUCH THIS BIOAVAILABILITY. The absorption rate is removed: it was derived from a peak time of 0.9 h that is EXACTLY THE MIDPOINT of a verbatim "time to maximum plasma concentration of 0.5-1.3 h" — the second independent failure of that authoring script header claim. Two further values are unsupported by anything cited and are logged rather than patched: the only abstract-verifiable half-life for this drug is seventeen hours, not the label 12.9 that is stored, and the volume could not be located in any source at all. THE CmaxOVER-AUC IDENTITY FAILS DECISIVELY AND IN BOTH DIRECTIONS AT ONCE — the record under-predicts the peak 2.4x while over-predicting exposure 2.06x, which is the floor-violation signature — and adopting the verbatim seventeen-hour half-life would DEEPEN it. That is the honest signal that this drug needs the two-compartment slot rather than a better scalar. Seven abstracts were chased and not one states an absolute peak or exposure, which is itself the label-only signature.',
    summary: 'dapagliflozin — F is its own and correct; ka came from a range midpoint' },

  { slug: 'aspirin', route: 'PO', guard: (c) => c.half_life_hr?.PO === 0.3,
    set: { F: 0.68 }, hl: 0.4, refs: ['PMID:8750369', 'PMID:14671681'],
    note: 'PK: TWO OF MY THREE PRIORS ABOUT THIS RECORD WERE REFUTED, AND THE REAL DEFECT IS SCOPE. I proposed the solver Michaelis-Menten parameters for saturable kinetics — BUT THE SATURATION IS SALICYLATE, WHICH THIS RECORD DOES NOT MODEL, and within its own dose block salicylate half-life is still two to three hours, below the saturating regime; no abstract states a maximum rate or half-saturation constant for it in man anyway. I also asked what the record asserts through an effect compartment — IT ASSERTS NOTHING, correctly, having neither a keo nor an occupancy row, so there was nothing to fix. What is wrong is smaller and larger at once. The two field corrections are verbatim: "only 68% of the dose reaches the systemic circulation as aspirin" and "The terminal half-lives (t1/2) of ASA and SA were 0.4 and 2.1 hours", against a stored 0.7 and 0.3 that matched neither this citation nor any other. The absorption rate remains a range midpoint of "an absorption half-life ranging from 5 to 16 minutes". THE SCOPE PROBLEM IS LOGGED RATHER THAN ACTED ON because it changes the record identity: at 500 mg this record total exposure is UNDER TEN PERCENT of the salicylate exposure that actually produces the analgesia its 325-650 mg dose block is for, and salicylate IS representable in this solver. OUR OWN PROSE IS ALSO WRONG: it calls 7-10 days the red-cell lifetime; that is the PLATELET lifetime.',
    summary: 'aspirin — my MM and keo priors both refuted; the real defect is analyte scope' },

  { slug: 'sumatriptan-succinate', route: 'SC', guard: (c) => c.pk?.SC?.ka_hr === 7,
    del: ['ka_hr'], set: { F: 0.96, source_pmid: 'PMID:7768259' }, hl: 2, refs: ['PMID:7768259', 'PMID:19925626', 'PMID:28597922'],
    note: 'PK: AN ABSORPTION RATE DERIVED WITH THE WRONG FORMULA, A HALF-LIFE FROM THE WRONG ROUTE, AND A DUPLICATE RECORD. Its authoring script states the method in its own comment — "ka derived from Tmax 12 min via ka ~ ln2/(Tmax/2) ~ 7/hr" — WHICH IS NOT THE BATEMAN RELATION THIS SOLVER USES; it implies a 28.8 minute peak against that citation verbatim twelve minutes. Every authoring script was grepped and that formula appears ONCE, only here, so the error did not spread; the sibling record had its own subcutaneous rate removed for the same defect and this one survived. The half-life is verbatim but it is the INTRANASAL value, and the script own override REPLACED THIS RECORD ORIGINAL, CORRECT SUBCUTANEOUS 2 h WITH IT — a documented regression, now reversed. Bioavailability moves from a range interior to the verbatim endpoint of "96-100%", cited at last to the paper that actually states both it and the volume. THE ROW IS NEVERTHELESS UNREPRESENTABLE AND THAT IS RECORDED RATHER THAN TUNED AWAY: verbatim exposure over peak is 1.427 hours against a floor of 2.885 even at the corrected half-life, 2.02x below what any parameter choice can produce, and a second paper names the reason — "The decay curve ... includes a large distribution component". A SALT-VERSUS-BASE MISMATCH IS ALSO LOGGED, and it runs OPPOSITE to the hydroxychloroquine shape: the mass is the succinate while the doses are free base, which does not overstate the dose and is inert until an interaction edge or occupancy site is authored.',
    summary: 'sumatriptan-succinate — its ka used a formula that is not the Bateman relation' },
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

/** rabeprazole: the clearance is right to 0.3%; the absorption needs a lag, not a rate. */
{
  const c = need('rabeprazole');
  const po = c.pk?.PO;
  if (po && po.lag_hr == null) {
    po.ka_hr = 3; po.lag_hr = 2.6;
    delete po.source_pmid;
    po.source_label = 'Aciphex (rabeprazole) label — absolute F 52% vs intravenous; t half 1-2 h. The cited relative-bioavailability study of paediatric sprinkle granules supports none of the stored values.';
    addRefs(c, 'PMID:21970660', 'PMID:22748970');
    note(c, 'PK: THE CLEARANCE IS RIGHT TO 0.3% AND NO ABSORPTION RATE CAN REPRODUCE THE PEAK. Against a verbatim "the AUC(0-infinity) were 301.12" at 10 mg this record predicts 300.1 — so the volume, bioavailability and half-life are COLLECTIVELY CORRECT and must not be moved on a failed verbatim check. But the Cmax-over-AUC identity is decisive in the other direction: the observed ratio is 0.656 per hour while the model ceiling at the published peak times is 52, 37 and 26 ng/mL against an observed 197. NO ka EXISTS THAT PRODUCES IT. Solving the identity gives an effective absorption window of five minutes once the enteric coat dissolves, which is exactly what an enteric-coated delayed-release tablet does — so the missing parameter is a LAG, not a rate, and the solver supports one. THE EMPTY EFFECT COMPARTMENT IS CORRECT AND THE ARGUMENT IS THE STRONGEST FORM YET FOUND: acid suppression builds over three to five days of once-daily dosing while the plasma profile is IDENTICAL on day one and day five, and A LINEAR FILTER HAS UNITY STEADY-STATE GAIN — its output tracks exposure per interval, which does not change — SO NO keo OF ANY MAGNITUDE PRODUCES DAY-OVER-DAY ACCUMULATION FROM A NON-ACCUMULATING CURVE. Recovery is set by proton-pump resynthesis, independent of concentration. The stored bioavailability is the label figure and correct; the cited paper is a RELATIVE study of granules in soft food.');
    log.push('rabeprazole — CL right to 0.3%; no ka can reach its peak, so a 2.6 h enteric lag is added');
  } else log.push('rabeprazole — already corrected, skipped');
}

/** sulfasalazine: every value is label-derived and the cited paper contradicts one. */
{
  const c = need('sulfasalazine');
  const po = c.pk?.PO;
  if (po && po.source_pmid === 'PMID:2864155') {
    delete po.source_pmid;
    po.source_label = 'Azulfidine (sulfasalazine) label — Vdss 7.5 +/- 1.6 L and plasma half-life 7.6 +/- 3.4 h, both INTRAVENOUS. F 0.15 is the label upper bound ("less than 15%") stored as a point value; no primary publishes a point estimate.';
    addRefs(c, 'PMID:2864155', 'PMID:2857146');
    note(c, 'PK: EVERY STORED VALUE IS LABEL-DERIVED AND THE CITED PAPER SUPPORTS NONE OF THEM AND CONTRADICTS ONE. The volume and half-life are verbatim in the label and are explicitly INTRAVENOUS — "calculated volume of distribution (Vdss) for SSZ was 7.5 +/- 1.6 L" and "observed plasma half-life for intravenous sulfasalazine is 7.6 +/- 3.4 hours" — so class 6 is acquitted and pairing them with an independent bioavailability is correct. That bioavailability is the one contradiction: the label says "LESS THAN 15% for parent drug", an inequality stored as a point, and THE CITED ABSTRACT PUTS IT LOWER STILL at "3 to 12%", so the stored value sits ABOVE ITS OWN CITATION UPPER ENDPOINT. No primary publishes a point estimate and a midpoint of 3-12% is barred, so the number stays with its provenance corrected. A PHYSICAL CHECK PASSES: the record predicts 68.6 micromol/L against a verbatim "between ... 32 and 114 mumol/L", and bioavailability anywhere from 0.07 to 0.25 lands in range, SO THE F QUESTION IS INVISIBLE TO THE PHYSICAL TEST and is purely a provenance defect. THE ANALYTE QUESTION HAS AN UNUSUAL ANSWER AND THE RECORD ALREADY HANDLES IT: the systemically measurable species is the intact azo compound, which is NEITHER the colitis-active species, luminal 5-aminosalicylate, NOR the toxicity carrier, sulfapyridine. That is why this record is not local-acting. MY SUSPECTED TRANSPLANT WITH MESALAMINE RUNS THE OTHER WAY: mesalamine bioavailability of 0.25 is THIS record citation "at least 25% is absorbed".');
    log.push('sulfasalazine — all four values are label-derived; its cited F is lower than what is stored');
  } else log.push('sulfasalazine — already corrected, skipped');
}

/** cariprazine: a PET measurement pins the missing volume, and its curve is saturated without it. */
{
  const c = need('cariprazine');
  const po = c.pk?.PO;
  if (po && po.V_L == null) {
    po.V_L = 1000;
    addRefs(c, 'PMID:26834462', 'PMID:23966785');
    note(c, 'PK: A HUMAN PET MEASUREMENT PINS THIS RECORD ERROR, AND THE MISSING VOLUME — NOT THE AFFINITY — WAS THE CAUSE. With no volume stored, the solver silently substituted 0.5 L/kg, putting steady-state cariprazine at 185 ng/mL on 3 mg daily and driving modelled D2 occupancy to 98.7% — AGAINST ITS OWN CITATION VERBATIM "Doses >= 1.5 mg/d yielded 69 - 75% D2/D3 receptor occupancy as measured in positron emission tomography scans". Back-solving from that anchor gives about a thousand litres, i.e. THE CONCENTRATION SCALE WAS ROUGHLY THIRTYFOLD TOO HIGH. The value stored is that PET-anchored figure and is disclosed as derived: no cariprazine volume appears in ANY indexed abstract — the population analysis, the paediatric studies, the interaction study and the orodispersible bioequivalence study all report structure or ratios only. MY WRONG-MASS PRIOR IS REFUTED: the stored mass IS the free base, the species the PK claims to describe, and both occupancy conversions check exactly. THE REAL OCCUPANCY DEFECT IS DIFFERENT AND IS LOGGED: the two rows come from mutually inconsistent scales, encoding a 63-fold selectivity where this record own other reference says about tenfold — and the PET anchor ACQUITS THE D2 ROW, since the stored affinity requires a steady-state concentration in exactly the real therapeutic range while the alternative would require one far below it. THE HALF-LIFE IS ALSO THE WRONG ANALYTE: "Terminal half-lives of cariprazine, desmethyl-cariprazine, and didesmethyl-cariprazine ranged from 31.6 to 68.4, 29.7 to 37.5, and 314 to 446 hours", so the stored 72 h sits ABOVE the parent own measured range while the total active moiety runs about a week.');
    log.push('cariprazine — a PET measurement pins its missing volume; occupancy read 98.7% vs 69-75%');
  } else log.push('cariprazine — already corrected, skipped');
}

/** bupivacaine: the routes are wrong, and the citation is an intravenous study. */
{
  const c = need('bupivacaine');
  if ((c.routes ?? []).includes('IM')) {
    const imDose = c.doses?.IM;
    c.pk = { SC: { ka_hr: 3.8, V_L: 117, F: 1, source_pmid: 'PMID:9052295' } };
    c.half_life_hr = { SC: 1.84 };
    c.routes = ['SC'];
    c.doses = imDose ? { SC: imDose } : (c.doses ?? {});
    addRefs(c, 'PMID:9052295');
    note(c, 'PK: KEEP THE PLASMA CURVE — THIS IS NOT A LOCAL-ACTING RECORD — BUT THE ROUTES WERE WRONG AND THE CITATION WAS AN INTRAVENOUS STUDY. Two sibling records were stripped to local-acting in this same batch on the grounds that plasma concentration is not what drives effect; bupivacaine differs, and its own citation says why: "All subjects experienced mild CNS toxicity ... associated with peak venous plasma concentrations of 0.81 to 2.7 micrograms/ml". That is a dose-limiting, CONCENTRATION-DEFINED toxicity, which is exactly what a plasma curve is for, and stripping the record would delete the only quantitative safety signal in it. What was broken is the route declaration: it listed intramuscular, subcutaneous and transdermal with parameters on the intramuscular one, AND BUPIVACAINE HAS NO INTRAMUSCULAR AND NO TRANSDERMAL PRODUCT — its own mechanism text says epidural, spinal and nerve block. That paper administered the drug INTRAVENOUSLY, so the row was also a route mismatch. THE VOCABULARY HAS NO EPIDURAL OR INTRATHECAL ROUTE, so the record still cannot be filed exactly right; subcutaneous is kept because infiltration block genuinely is subcutaneous, and the values move to a real human epidural dataset. TWO CAUTIONS ARE RECORDED: that source reports lidocaine and bupivacaine as PAIRS in every sentence and the FIRST value is lidocaine, and its population is parturients, whose free fraction is higher. The row over-predicts exposure about 15% by construction, being below the one-compartment floor. ITS OCCUPANCY ROW IS IN THE WRONG COMPARTMENT: the affinity is a frog sciatic nerve block, and at therapeutic plasma levels it reads about ten percent, which is neither the anaesthetic effect at the nerve nor a calibrated cardiotoxicity metric.');
    log.push('bupivacaine — IM and TD are not bupivacaine routes; its IM row cited an IV study');
  } else log.push('bupivacaine — already corrected, skipped');
}

/** Records that cannot be represented, with the reason each is a different kind of no. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  navitoclax: ['research-only',
    'PK REMOVED. THE WHOLE BLOCK IS CONSTRUCTED, AND THE ARITHMETIC REPRODUCES EXACTLY. Fixing the stored absorption rate and forcing a peak at exactly 11.000 h back-solves a half-life of 22.1791, WHICH ROUNDS TO THE STORED 22.2 AT ITS FULL STORED PRECISION — so with a round volume and a round bioavailability beside it, the record is two guesses, an assumed round peak time, and one derived digit presented as a measurement. Its citation is a genuine, on-topic, correctly-attributed phase-one paper CONTAINING NOT ONE NUMERIC PK PARAMETER: no rate, no volume, no bioavailability, no half-life, no peak, no exposure. Six further human studies were chased and every one reports dose levels, ratios or model structure only — the population analysis says merely "The population PKs were adequately characterized by two-compartment models" without publishing an estimate. Navitoclax was never approved and its development was discontinued, SO THERE IS NO LABEL TO FALL BACK ON: this is not the label-only shape, it is an absence of published human pharmacokinetics.',
    ['PMID:21282543']],
  linaclotide: ['local-acting',
    'PK REMOVED. ITS LABEL NAMES THIS RECORD EXACT DOSE TRIPLE AS UNMEASURABLE: "Concentrations of linaclotide and its active metabolite in plasma are BELOW THE LIMIT OF QUANTITATION after oral doses of 72 mcg, 145 mcg, or 290 mcg" and "minimally absorbed with negligible systemic availability" — and the registry doses are those same three. The stored parameters drew a curve peaking around nine picograms per millilitre, roughly twenty times below any published assay limit, FOR A QUANTITY NEVER MEASURED IN A HUMAN, so the volume is not merely unsourced but unmeasurable in principle. The stored bioavailability of 0.1% is also the WRONG SPECIES: its source is preclinical throughout and never attaches a species to that figure, while the companion disposition paper settles it — "the low systemic and portal vein concentrations of linaclotide and MM-419447 observed in THE RAT confirmed both peptides are minimally absorbed". This is a fourteen-amino-acid peptide acting on guanylate cyclase-C at the apical surface of enterocytes; the lumen is the compartment that matters.',
    ['PMID:20863829', 'PMID:23090647']],
  mesalamine: ['local-acting',
    'PK REMOVED. THE SHAPE CANNOT BE FIXED, NOT MERELY THE NUMBERS. Against its own citation the observed peak-to-exposure ratio is 0.283 per hour while the model CEILING at that paper own peak time is 0.042 — 6.8x OUTSIDE WHAT ANY ABSORPTION RATE CAN PRODUCE — because the real profile is a delayed-release lag followed by fast absorption, which is what a colonic tablet is. At the registry own minimum dose the stored parameters over-predicted exposure 6.8x and peak 6.0x against verbatim measurements. A single bioavailability is also indefensible across the delivery systems this dose range spans: two pH-dependent tablets differ 8.5-fold per milligram, and the mechanism is stated verbatim — "pH-dependent mesalazine formulations may release their contents rapidly in the small intestine and proximal colon resulting in higher plasma and urinary concentrations". THE STORED BIOAVAILABILITY WAS ALSO THE SULFASALAZINE RECORD CITATION SPEAKING: "at least 25% is absorbed" is an inequality about colonic 5-aminosalicylate after azo-cleavage, not a tablet systemic availability. Effect is luminal by its own literature — "its mode of action appears to be TOPICALLY rather than systemically" — and a plasma curve here is a nephrotoxicity index, not an efficacy one.',
    ['PMID:8141827', 'PMID:15142198', 'PMID:3319458']],
  'hormonal-contraceptives': ['mixture',
    'PK REMOVED. THE RECORD DESCRIBES NO MIXTURE AND ITS COMPONENTS ALREADY EXIST SEPARATELY. Its citation is an ETHINYLOESTRADIOL-ONLY study; the stored bioavailability is one minus that paper "an about 60% first-pass effect in women", i.e. that oestrogen availability, COMPUTED, on a combination record — and this catalog own ethinyl-estradiol record already stores the verbatim figure from a better source. The stored half-life is refuted by the same citation, which says "the terminal half-life ... was calculated to be about 1 day". A combined pill oestrogen and progestin have different kinetics and cannot share one parameter set, and both components are separate, better-sourced records here. THE VOLUME IS WORSE THAN THE TRANSPLANT I SUSPECTED: it is not the progestin figure but a HOUSE FILLER shared by five unrelated compounds. Structurally the record declares five routes with a COMPLETELY EMPTY dose block and has no molecular mass, which a mixture cannot have. An earlier authoring wave already skipped this record for "no clean human oral PK" and was right to.',
    ['PMID:455989']],
  insulin: ['mixture',
    'PK REMOVED. ITS INTRAVENOUS VOLUME IS REFUTED BY ITS OWN PAPER AND ITS SUBCUTANEOUS HALF-LIFE IS A PEAK TIME. That citation states "a fractional insulin loss rate of 0.112 +/- 0.063 min(1) and A DISTRIBUTION VOLUME OF 15.6 +/- 4.0 L"; the record took the rate constant and substituted a volume a third of that, understating insulin clearance 3.09x against its own source and against the physiological figure. The subcutaneous row is worse: its citation reports no bioavailability, no volume and no half-life, and the ONLY "one hour" in that abstract is "peak serum IRI at 60 to 90 minutes after conventional SC insulin injection" — A PEAK TIME STORED AS A HALF-LIFE. That row is also absorption-limited by a factor of ten against the intravenous one and CARRIES NO ABSORPTION RATE AT ALL, so the single parameter that governs subcutaneous insulin was a solver fallback. BEYOND THAT THE SCHEMA CANNOT HOLD THIS RECORD: the dose block is empty for all four routes, insulin is dosed in international units with no conversion field, and "insulin" is not one molecule — this record own aliases name two long-acting analogues whose half-lives are twelve and over twenty-five hours against a stored subcutaneous one hour, and its own bibliography carries the review documenting the molecules its parameters do not describe. Its subcutaneous citation also had to SUPPRESS ENDOGENOUS SECRETION to measure exogenous drug at all, and the model has no endogenous baseline.',
    ['PMID:15738706', 'PMID:6341763', 'PMID:18715209']],
  dicyclomine: ['label-only',
    'PK REMOVED. THE INSERT ITSELF DISOWNS THE ONE HALF-LIFE IT QUANTIFIES: "approximately 1.8 hours when plasma concentrations were measured FOR 9 HOURS ... In subsequent studies, plasma concentrations were followed for up to 24 hours after a single dose, showing a SECONDARY PHASE OF ELIMINATION WITH A SOMEWHAT LONGER HALF-LIFE". That truncated first phase was stored beside a large volume, and the pair implies a clearance of 1.64 litres per minute — ABOVE HEPATIC BLOOD FLOW, and roughly twenty times filtration for a drug the same label says is principally renally excreted. The volume is also explicitly ORAL-derived, "Mean volume of distribution for a 20 mg ORAL DOSE is approximately 3.65 L/kg", so pairing it with a bioavailability divided by that quantity twice. AND THAT BIOAVAILABILITY IS ABSENT FROM EVERY FDA LABEL FETCHED: the insert says "Intramuscular injection is about TWICE as bioavailable as oral dosage forms", corroborated by its own dosing section, which is a RELATIVE two-to-one ratio rather than the stored figure — so the record source_label attributed to the FDA label a number the label does not contain. Every indexed paper is an assay method without an abstract, a rodent interaction study, or a rabbit formulation study.',
    []],
};
for (const [slug, [reason, why, refs]] of Object.entries(UNAUTHORED)) {
  const c = need(slug);
  if (c.pk_unauthored) { log.push(`${slug} — already unauthored, skipped`); continue; }
  delete c.pk; delete c.half_life_hr;
  c.pk_unauthored = { reason, note: why.length > 500 ? why.slice(0, 497) + '...' : why };
  if (why.length > 500) note(c, why);
  if (refs.length) addRefs(c, ...refs);
  log.push(`${slug} — PK stripped, pk_unauthored: ${reason}`);
}

/** Records whose numbers survive; saying so is the finding. */
const NOTE_ONLY: { slug: string; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'fluvastatin', refs: ['PMID:1640002', 'PMID:11509920'],
    note: 'PK: TOTAL PROVENANCE FAILURE AND NOT ONE NUMBER SHOULD MOVE — THIS IS THE CONTRACT WARNING CASE, LIVE. The cited review contains none of the four stored values; the absorption rate is a back-derivation that solves to a peak at 1.0002 h from a Tmax sitting in this record OWN references, "the time to reach C(max) (t(max)) ... were ... 60.0 +/-30.0 minutes"; the bioavailability is exactly the midpoint of a verbatim "the estimated bioavailability from the 2- and 10-mg doses was only 19 to 29%" and is also the label figure, so midpoint arithmetic and label copying cannot be distinguished; and the volume is a per-kilogram computation absent from every abstract fetched. YET THE RECORD REPRODUCES OBSERVED 40 MG EXPOSURE TO WITHIN 1.0 TO 1.3x. The reason is saturable first-pass metabolism: that bioavailability was measured at 2 to 10 mg, both sources report over-proportional exposure at 40 to 80 mg, and a low clearance is cancelling a low bioavailability. The verbatim clearance is "0.97 L/hour/kg" against the model 14.15 L/h — 4.8x apart — SO CORRECTING EITHER IN ISOLATION WOULD BREAK A CURRENTLY ACCURATE RECORD. Class 6 is definitively acquitted: a human intravenous arm exists, "an absolute bioavailability study using doses of 2 mg intravenously or 10 mg orally". MY EXTENDED-RELEASE PRIOR IS REFUTED — the parameters are immediate-release shaped and nowhere near the extended-release peak — but the DOSE BLOCK mixes the two, its maximum being an extended-release-only strength.',
    summary: 'fluvastatin — every value unsourced, exposure right to 1.0-1.3x; compensating errors' },
  { slug: 'pitavastatin', refs: ['PMID:16198653'],
    note: 'PK: THE WORST STRUCTURAL FAILURE IN ITS GROUP, AND IT CANNOT BE FIXED BY A BETTER SCALAR. The record under-predicts the peak by between 5.5x and 16x depending on which of its two source studies is used — and those two disagree with each other 2.8-fold on exposure — while matching one of them on exposure. The diagnostic is FORMULATION-INDEPENDENT and reproduced by both: the observed exposure-to-peak ratio is 2.99 and 2.90 hours while a one-compartment model at the stored half-life FORCES about 15.9, a 5.3-fold mismatch, because the stored volume is a TERMINAL volume being used as a central one for a drug whose mean residence time is about three hours. Either the peak under-prediction is accepted or the record is re-parameterised to an effective half-life near two hours, WHICH CANNOT BE SOURCED VERBATIM — so it is left as a design decision rather than patched. Class 6 is acquitted: the canonical volume is a true terminal volume consistent with the stored bioavailability. That bioavailability is nonetheless label-only and is ACTIVELY CONTRADICTED by this record own other reference, which puts pitavastatin at "60% OR GREATER". The absorption rate is a back-derivation solving to exactly 0.700 h where the cited abstract actual peak times are 0.63, 0.65 and 0.79 — provenance rather than magnitude, since the target is close to the true mean. The stored volume is also off by one from the canonical published figure, the same shape as atorvastatin 380-for-381.',
    summary: 'pitavastatin — peak 5.5-16x low, structural; a design decision, not a patchable defect' },
  { slug: 'nateglinide', refs: ['PMID:14748619'],
    note: 'PK: PHYSICALLY SOUND, PROVENANCE THIN, AND ONE COINCIDENCE WORTH NOT ACTING ON. The cited paper states none of the four stored values but is useful for the arithmetic — "Median total clearances were 7.9, 8.4, 6.5, 6.9, 5.8 and 4.1 L/h" — against which this record 6.33 is 0.80 times the wild-type median, well within the spread. The bioavailability is now replaceable verbatim from a paper that was not cited: "The pharmacokinetics of nateglinide are characterised by rapid absorption and elimination, with good (73%) bioavailability", matching the stored value exactly. The volume is label-only, attributed by the label to intravenous data so the pairing is correct in principle, and the half-life sits inside published values without being any of them. THE ABSORPTION RATE IS PLAUSIBLE BUT SLOW AND UNSOURCED: it is this catalog shared default across fourteen records, it implies a 1.18 h peak against a real 0.5 to 1.0, and it is NOT a back-derivation. A COINCIDENCE IS FLAGGED AND DELIBERATELY NOT CALLED: nateglinide published elimination half-life is 1.4 HOURS verbatim, the same numeral as the stored absorption rate, which is exactly the half-life-as-rate collision shape — but thirteen other records share that same rate and the shared-default explanation covers all of them, so calling it here would be pattern-matching rather than evidence. Worth checking whether the other thirteen show similar coincidences.',
    summary: 'nateglinide — sound within 25%; a half-life-as-rate coincidence flagged, not called' },
  { slug: 'ethanol',
    note: 'PK: MY MODEL-CLASS PRIOR IS REFUTED — THIS RECORD IS RIGHT, AND SAYING SO MATTERS. I expected a first-order half-life on a drug that follows zero-order kinetics. There is no half-life stored at all: elimination runs on the solver Michaelis-Menten parameters, and BOTH CONSTANTS VERIFY VERBATIM — "This would be equivalent to a blood ethanol disappearance rate of 230 mg/L/h if metabolism took place at its maximum rate" and "The elimination rate is half of the elimination capacity at a peripheral blood ethanol concentration (Km) of about 80 mg/L" — as does the volume. THE REFERENCE ALREADY IN THIS RECORD IS DOING REAL WORK: an independent intravenous-infusion cohort gives "The average Vm[0.232 mg/(ml x hr)] and Km[0.0821 mg/ml]", corroborating both to within 0.9% and 2.6% FROM A DIFFERENT ROUTE AND A DIFFERENT STUDY, and the internal check closes too. A CAVEAT IS RECORDED THAT IS NOT A DEFECT: every parameter here is WHOLE-BLOOD referenced, so the curve this record emits is a blood alcohol concentration rather than a plasma one, about 1.15 times lower — the set is internally consistent and NO SINGLE VALUE SHOULD BE "CORRECTED" INTO PLASMA UNITS. The one weak field is the absorption rate, which appears nowhere in the citation and which that paper explicitly declines to commit to, saying "Little attention has been paid to evaluation of potential models" of absorption. The bioavailability is one minus a stated extraction ratio, which is definitional but describes a quantity the same abstract calls flow- and rate-dependent.',
    summary: 'ethanol — verified; my model-class prior refuted, MM is used correctly' },
];
for (const f of NOTE_ONLY) {
  const c = need(f.slug);
  if ((c.notes ?? '').includes(f.note.slice(0, 60))) { log.push(`${f.slug} — already noted, skipped`); continue; }
  if (f.refs?.length) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary);
}

/** zileuton's dose block mixed an IR unit dose, a CR unit dose and a daily total. */
{
  const c = need('zileuton');
  const po = c.doses?.PO;
  if (po && po.typical === 1200) {
    c.doses!.PO = { min: 600, max: 600, typical: 600, unit: 'mg' };
    note(c, 'DOSING: THE BLOCK MIXED THREE DIFFERENT QUANTITIES. Its minimum was the immediate-release unit dose, its typical was the CONTROLLED-RELEASE unit dose, and its maximum was A DAILY TOTAL RATHER THAN A UNIT DOSE AT ALL — under a citation that studied only 600 mg immediate-release, four and six hourly. The value most surfaces read, the typical, was the one with no support. The block is narrowed to the dose its citation actually studied.');
    log.push('zileuton — dose block mixed an IR unit, a CR unit and a daily total; narrowed to the studied dose');
  } else log.push('zileuton doses — already corrected, skipped');
}

/** Declared routes with no parameters, or that the drug does not have. */
const ROUTE_DROPS: Record<string, string[]> = {
  ketoconazole: ['TD'],
  'sumatriptan-succinate': ['IN'],
};
for (const [slug, routes] of Object.entries(ROUTE_DROPS)) {
  const c = need(slug);
  const gone = routes.filter((r) => (c.routes ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} routes — already trimmed, skipped`); continue; }
  c.routes = (c.routes ?? []).filter((r) => !gone.includes(r));
  for (const r of gone) if (c.doses && r in c.doses) delete c.doses[r];
  log.push(`${slug} — dropped route(s) with no parameters: ${gone.join(', ')}`);
}

/** A reference that could not support an occupancy row even if one existed. */
{
  const c = need('tamoxifen');
  if ((c.refs ?? []).includes('PMID:9048584')) {
    c.refs = (c.refs ?? []).filter((p) => p !== 'PMID:9048584');
    log.push('tamoxifen — dropped PMID:9048584, an occupancy source for a record with no occupancy row');
  } else log.push('tamoxifen refs — already trimmed, skipped');
}

/** tamoxifen's effect compartment represents nothing; the record has no occupancy row to orphan. */
{
  const c = need('tamoxifen');
  if (c.effect_compartment) {
    delete c.effect_compartment;
    note(c, 'THE EFFECT COMPARTMENT IS REMOVED AND THE STANDING NO-ORPHAN RULE DOES NOT BLOCK IT, because this record carries no receptor_occupancy row for it to orphan. Its equilibration half-life was under fourteen hours against an antiestrogenic genomic response that builds over months, and it was seven times FASTER than this drug own elimination, so it was a null filter either way.');
    log.push('tamoxifen — removed a null effect compartment (no occupancy rows to orphan)');
  } else log.push('tamoxifen keo — already removed, skipped');
}

/**
 * The fifteen still-live entries from the audited ka-from-Tmax wave. These are
 * DISCLOSED rather than deleted: most are midpoints of narrow ranges and so are
 * probably inside the true spread, and deleting would push each to the solver's
 * ka default of 1.0, which is worse for most of them.
 */
const KA_DISCLOSURE: Record<string, string> = {
  'dextroamphetamine': 'the number is verbatim but belongs to the RACEMIC amphetamine arm of that study, not to dexamfetamine',
  'dutasteride': 'the cited abstract states no peak time at all, only that fed volunteers showed a higher one',
  'edoxaban': 'the midpoint of a verbatim "peak plasma concentrations within 1.0-2.0 h"',
  'guanfacine': 'the population is five patients with renal insufficiency plus five on chronic dialysis, and the figure is an upper bound, "within two hours"',
  'mdma': 'the cited abstract reports peak concentration, exposure, half-life, volume and clearance, and no peak time',
  'mixed-amphetamine-salts': 'the midpoint of a review range generic to all immediate-release amphetamine, not to this product',
  'oxiracetam': 'the midpoint of a verbatim "peak levels within 1-2 h"',
  'piracetam': 'the cited abstract mentions a delayed peak time under fed conditions and publishes no value — AND THIS IS ONE OF THE FOUR ENTRIES THE SCRIPT HEADER NAMED AS SPOT-CHECK RE-CONFIRMED',
  'pitavastatin': 'the cited abstract actual peak times are 0.63, 0.65 and 0.79 h and none is the 0.70 used',
  'pramiracetam': 'the midpoint of a verbatim "attained between two to three hours"',
  'ramelteon': 'the midpoint of a verbatim "Mean T(max) values of 0.75 to 0.94 hours"',
  'suvorexant': 'a value appearing nowhere in a verbatim "ranged from 1.5 to 4.0 h", and not its midpoint either',
  'tamoxifen': 'the cited abstract reports exposure and peak fold-changes by genotype and no peak time — AND THIS IS ANOTHER OF THE FOUR ENTRIES NAMED AS SPOT-CHECK RE-CONFIRMED',
  'dapagliflozin': 'exactly the midpoint of a verbatim "time to maximum plasma concentration of 0.5-1.3 h"',
  'viloxazine': 'the cited abstract contains no peak time at all, only co-administration ratio percentages',
};
const KA_PREFIX = 'ABSORPTION-RATE PROVENANCE: this value was derived by inverting the one-compartment peak-time relation in 2026-05-26-wave25-ka-from-tmax.ts, whose header claimed every peak time was verbatim from a primary human study. ALL FORTY-FOUR ENTRIES HAVE NOW BEEN CHECKED AND TWENTY-EIGHT FAIL. This one fails because ';
const KA_SUFFIX = '. It is DISCLOSED RATHER THAN DELETED: a midpoint of a narrow range is usually inside the true spread, and removing it would fall back on the solver default of 1.0 per hour, which is worse for most of these records.';
for (const [slug, why] of Object.entries(KA_DISCLOSURE)) {
  const c = by.get(slug);
  if (!c) { log.push(`${slug} — not in catalog, skipped`); continue; }
  if (c.pk?.PO?.ka_hr == null) { log.push(`${slug} ka — no longer present, skipped`); continue; }
  const text = KA_PREFIX + why + KA_SUFFIX;
  if ((c.notes ?? '').includes(KA_PREFIX.slice(0, 60))) { log.push(`${slug} ka provenance — already disclosed, skipped`); continue; }
  note(c, text);
  log.push(`${slug} — ka provenance disclosed`);
}

console.log(`${log.length} change(s):\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run. Pass --write to apply.');
