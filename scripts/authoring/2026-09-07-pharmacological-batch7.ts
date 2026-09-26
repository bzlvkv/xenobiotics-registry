/**
 * 2026-09-07-pharmacological-batch7.ts
 *
 * Seventh batch of the pharmacological category: 40 compounds, eight agents.
 *
 * ── CLASS 12: TWO-COMPARTMENT PARAMETERS FLATTENED INTO ONE COMPARTMENT ─
 * The largest finding of this batch, and it was found by ARITHMETIC rather than
 * by reading citations. In the one-compartment Bateman model this registry uses,
 * the stored {V_L, F, t-half} jointly fix CL/F = (V_L/F)*ln2/t-half, and therefore
 * fix AUC. Compare that against a verbatim published clearance or AUC and a class
 * of defect appears that no citation check can reach, because EVERY INDIVIDUAL
 * NUMBER IS CORRECTLY SOURCED:
 *   baricitinib  {76, 0.79, 12}  implies CL/F 5.56 L/h; its own cited paper says
 *                "low oral-dose clearance (17 L/h)"  -> 3.1x over-prediction
 *   candesartan  {9, 0.4, 9.3}   implies CL/F 1.68 L/h; three sources say 13.2,
 *                9.9 and 17.5 L/h  -> Cmax 4.4x too high at the typical dose
 *   febuxostat   implies AUC/dose 0.259 h/L against a measured 0.095  -> 2.7x
 *   nimodipine   {1300, 0.13} predicts 2.5 ng/mL against the cited paper own
 *                observed "10.208 +/- 0.317 ng/ml"  -> 4x under
 * The root cause is a volume from a bi-exponential fit paired with that fit
 * TERMINAL half-life, fed to a solver with one compartment. Each is defensible;
 * the pair is not. Candesartan is the sharpest case: V 9 L is its genuine small
 * IV-derived volume and 9.3 h is its genuine terminal half-life, and FIXING F
 * ALONE MAKES IT WORSE (F 0.15 cuts CL/F to 0.63 L/h).
 *
 * ── CLASS 13: VERBATIM-CORRECT BUT SUPERSEDED ──────────────────────────
 * hydroxyzine t-half 3 h PASSES the contract - PMID:512901 says "the half-life
 * of drug removal was approximately 3 hr", human, oral, correct analyte. It is
 * still wrong: four later human studies give 20, 20-25, 29.3 and 7.1 h, and the
 * 1979 GLC-MS assay truncated sampling below the terminal phase. The independent
 * proof is physical - V 1200 with t-half 3 implies CL/F 277 L/h = 4.6 L/min,
 * EXCEEDING CARDIAC OUTPUT, against a measured 40.3 L/h. A citation check can
 * never catch this shape; only arithmetic can.
 *
 * ── THE 1.5-HOUR GENERATOR ─────────────────────────────────────────────
 * Two agents independently reported a ka solving to Tmax 1.50 h. Sweeping the
 * catalog: of 86 extravascular routes whose ka is NOT itself a round number,
 * 14 land within 0.005 h of a half-hour Tmax against 1.7 expected by chance,
 * an 8.1x enrichment. The aggregate signal is invisible (1.3x) until round ka
 * values, which produce round Tmax trivially, are excluded. Confirmed members
 * here: quetiapine 2.02 -> 1.502, venlafaxine 1.88 -> 1.497, fenofibrate
 * 1.56 -> 2.496, ketoprofen 2.13 -> 0.9996, piroxicam 1.02 -> 4.0046.
 *
 * ── AND THE COUNTER-FINDING: A PUBLISHED keo FOR AN ANTIPSYCHOTIC ──────
 * My standing claim that no published keo exists for any antipsychotic is FALSE
 * for aripiprazole. Kim 2012 (PMID:22186667), the paper already cited, fits a
 * genuine effect-compartment model: keo 0.725, RSE 12.9%, CI 0.542-0.908, with
 * "The equilibrium half-life for the effect site ... was 0.96 hours." The
 * stored value is correct and is left alone. The claim does hold for asenapine,
 * brexpiprazole and clomipramine.
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
interface Compound {
  slug: string; routes?: string[]; doses?: Record<string, unknown>; mw_g_mol?: number;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  pk_analyte?: string; pk_analyte_name?: string;
  effect_compartment?: { keo_per_h?: number; approximated?: boolean; source_pmid?: string; note?: string; [k: string]: unknown };
  receptor_occupancy?: Occ[];
  fu_note?: string;
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const FIXES: { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'aripiprazole', guard: (c) => c.pk?.IM?.zo_dur_hr === 864,
    pk: { PO: { ka_hr: 1.4, V_L: 343, F: 0.85, source_pmid: 'PMID:18563956' } },
    hl: { PO: 75 }, refs: ['PMID:15257633', 'PMID:17242925', 'PMID:12065741'],
    note: 'PK: ITS INTRAMUSCULAR ROUTE WAS A DEPOT BOLTED ONTO IMMEDIATE-RELEASE DOSES. PMID:28350572 is ARIPIPRAZOLE LAUROXIL, a monthly extended-release prodrug dosed at "441-882 mg dosed monthly", and its 36-day release window (zo_dur 864 h, which is verbatim) sat beside a 10-30 mg dose block that belongs to the immediate-release agitation injection studied in a different paper. As stored the solver delivered about 16.7 mg over 36 days where the real depot delivers 441-882 mg, a THIRTY- TO FIFTY-FOLD under-delivery, and it applied the ORAL terminal half-life to a depot with flip-flop kinetics. lag_hr 130 was interpolated from "after 5 to 6 days" (120-144 h). The route is removed rather than patched; aripiprazole lauroxil is a different product and deserves its own record. F 0.87 is real but was hung on a paper that says 0.85 verbatim - "the geometric mean values for the absolute bioavailability of aripiprazole following oral and intramuscular administration were 0.85 and 0.98" - so the record now stores what its own citation states. V 343 L is the label 4.9 L/kg, which is an IV steady-state figure, so CLASS 6 IS ACQUITTED and pairing it with an independent F is correct. ka 1.4 is a DISCLOSED Tmax inversion reproducing Kubo 3.6 h, not a measurement, and now says so. ITS keo IS THE COUNTER-EXAMPLE TO MY OWN STANDING CLAIM: Kim 2012 fits a real effect compartment, keo 0.725 with a 12.9% RSE, and it is left untouched.',
    summary: 'aripiprazole — a monthly depot paper filed against 10-30 mg IR doses, 30-50x under-delivery; keo 0.725 VERIFIES' },

  { slug: 'asenapine', guard: (c) => c.pk?.TD?.F === 0.35,
    pk: { SL: { ka_hr: 5.23, V_L: 1500, F: 0.35, source_pmid: 'PMID:32943849' },
          TD: { zo_dur_hr: 24, V_L: 1500, F: 1, source_pmid: 'PMID:33734167' } },
    hl: { SL: 24, TD: 33.9 }, refs: ['PMID:24793403', 'PMID:32943849'],
    note: 'PK: THE PATCH CARRIED THE SUBLINGUAL BIOAVAILABILITY. F 0.35 is verbatim for the sublingual tablet ("Total bioavailability is 35%") and was copied onto the transdermal row, where the source reports only RELATIVE bioavailability - the 3.8 mg/24 h patch matches 10 mg/day sublingual on AUC, implying a patch availability near 0.92. As stored the patch delivered 2.0 mg/day against the sublingual 3.5, a 2.6x under-delivery on the marketed product. Because patch strengths are already expressed as DELIVERED mg/24 h, F is pinned to 1 rather than set to a figure nobody published. TD t-half 33 was a TRUNCATION of "Terminal half-life ... was 33.9 hours", measured on the 1.9 mg/24 h patch, the lowest and non-marketed strength. Both sublingual values were verbatim under the WRONG citation and now point at the papers that state them. V 1500 L survives unsourced and is declared so: the search for an asenapine volume of distribution returns ZERO PubMed records, and the default is worse than a label figure. ka 5.23 is an exact inversion of "a T (max) value of about 1 h" - three significant figures extracted from the word about.',
    summary: 'asenapine — the SL bioavailability copied onto the patch, 2.6x under-delivery' },

  { slug: 'brexpiprazole', guard: (c) => c.pk?.PO?.ka_hr === 0.4,
    pk: { PO: { V_L: 240, F: 0.95, source_pmid: 'PMID:28750151' } },
    hl: { PO: 91 },
    note: 'PK: ka 0.4 CONTRADICTED ITS OWN CITATION AND DUPLICATED THIS RECORD keo. The abstract states "The median tmax and the mean elimination half-life of brexpiprazole were 4-5 and 52-92 hours"; ka 0.4 with the stored half-life predicts a peak at 10.09 h, more than double the published 4-5 h. It is also byte-identical to the stored keo_per_h of 0.4 - the one-source-number-in-two-fields shape - and matches the placeholder that the same authoring wave used on eluxadoline, efavirenz, velpatasvir and doxepin. Removed rather than replaced, because reproducing the published Tmax would take a number nobody measured. V 240 IS A RANGE MIDPOINT: the full-text table gives V/F by dose arm as 307.8, 178.4 and 175.7, and 240 is none of them but is the midpoint of their span; the column is explicitly V/F while F 0.95 sits beside it, so F divides twice, costing about 5% because F is near 1. t-half 91 is the 1 MG SUBGROUP value, the lowest and least clinically relevant arm, where the 4 mg therapeutic arm measured 70.6 h. F 0.95 appears nowhere in the paper - a grep of the full text for bioavail returns nothing. All three are retained as label-grade rather than deleted, because the alternatives are a default and a midpoint. NO CROSS-DRUG TRANSPLANT WITH ARIPIPRAZOLE: all five fields differ, checked pairwise.',
    summary: 'brexpiprazole — ka 0.4 predicts a 10 h peak against a published 4-5 h, and duplicates its own keo' },

  { slug: 'clomipramine', guard: (c) => c.pk?.PO?.ka_hr === 0.5,
    pk: { PO: { V_L: 1100, F: 0.5, source_pmid: 'PMID:8181196' } },
    hl: { PO: 32 }, refs: ['PMID:2197816', 'PMID:11185671'],
    note: 'PK: REAL PMID, ZERO CONTENT - the citation states exactly one quantity and it is none of the four stored. PMID:8181196 gives only "The total median clearance of clomipramine was 99 L.hr-1", and because it is a single oral dose with no intravenous reference that figure is necessarily CL/F, not CL. The only human review carrying numbers CONTRADICTS all three stored values: "reduces oral bioavailability to less than 62 percent" is an inequality rather than 0.50, "(volume of distribution 9-25 L/kg)" is a range whose midpoint is not the stored 15.7 L/kg, and "a plasma half-life of 20-24 hours" puts the stored 32 h OUTSIDE it, with PMID:11185671 independently implying about 23 h. The values are kept and declared LABEL-GRADE rather than replaced with a range midpoint, which is itself a named defect class. ka 0.5 is removed: it predicts a peak at 6.56 h against a label Tmax of 2-6 h, outside the range, and is the same placeholder seen across this authoring wave. MY ANALYTE SUSPICION WAS WRONG - these are parent values, not desmethylclomipramine, whose half-life is about 69 h; the metabolite trap is real but confined to fu, where the note already documents it. The keo of 1.0 models a 42-minute equilibration for a drug whose antiobsessional effect emerges over WEEKS - a model-class mismatch rather than an imprecise rate.',
    summary: 'clomipramine — its citation carries one number, a CL/F, and none of the four stored' },

  { slug: 'hydroxyzine', guard: (c) => c.half_life_hr?.PO === 3,
    pk: { PO: { ka_hr: 2, V_L: 1200, F: 1, source_pmid: 'PMID:2866055' } },
    hl: { PO: 20 }, refs: ['PMID:512901', 'PMID:2562944', 'PMID:6361228'],
    note: 'PK: A NEW DEFECT CLASS - VERBATIM-CORRECT AND STILL WRONG. The stored t-half of 3 h PASSED the contract: PMID:512901 says "the half-life of drug removal was approximately 3 hr", human, oral, 100 mg, healthy males, correct analyte. Four later human studies disagree by 2 to 12 times - "hydroxyzine about 20 hours", "20 to 25 hours", "29.3 +/- 10.1 hours" in the elderly, 7.1 h in children - because the 1979 assay truncated sampling below the terminal phase. THE PROOF IS PHYSICAL, NOT BIBLIOGRAPHIC: V 1200 L with a 3 h half-life implies a clearance of 277 L/h, or 4.6 L/min, WHICH EXCEEDS CARDIAC OUTPUT, against a measured 9.6 ml/min/kg = 40.3 L/h. A citation check can never reach this shape; only arithmetic can. AND THE ABSORPTION CONSTANT WAS THE INNOCENT PARTY: ka 2.0 with the old half-life predicts a peak at 1.22 h against a measured 2.0-2.3 h, but with the corrected 20 h it reproduces Tmax 2.00 h almost exactly, so it is kept and re-anchored. F 0.7 is removed and pinned to 1 - the only published bioavailability figure for hydroxyzine, 72%, is in SIX HEALTHY DOGS, and every human volume in the literature is apparent and per-kg, so an independent F would divide twice. Its H1 occupancy row is deleted separately.',
    summary: 'hydroxyzine — t-half 3 h is verbatim, superseded, and implies a clearance above cardiac output' },

  { slug: 'paroxetine', guard: (c) => c.pk?.PO?.ka_hr === 0.4,
    pk: { PO: { V_L: 900, F: 0.5, source_pmid: 'PMID:18250057' } },
    hl: { PO: 20 }, refs: ['PMID:18250057'],
    note: 'PK: t-half 20 IS VERIFIED and survives the non-linearity objection. Its citation states "t(1/2) 20.03-/+5.33 h" verbatim, and the steady-state literature agrees - "between 21 (paroxetine) and 36 (citalopram) hr". Autoinhibition of CYP2D6 bites on CLEARANCE and BIOAVAILABILITY, not on the terminal slope: "with repeated administration, bioavailability of paroxetine increases and pharmacokinetics may become nonlinear in some patients", and apparent oral clearance falls markedly on multiple dosing. So F 0.5 is a modelling approximation BY CONSTRUCTION rather than a measurement - paroxetine has no intravenous form and no absolute bioavailability has ever been published - and V 900 is likewise absent from the citation. Both are declared rather than deleted. ka 0.4 is removed for two independent reasons: it is byte-identical to this record own keo_per_h of 0.4, the one-number-two-fields shape, and it implies a peak at 6.7 h against the cited paper own measured "T(max)5.64-/+1.84 h". All eleven references were checked against the three purposes and every one earns its place; the live source_pmid was missing from refs and is added.',
    summary: 'paroxetine — t-half 20 verifies; ka 0.4 duplicates its own keo and misses the cited Tmax' },

  { slug: 'quetiapine', guard: (c) => c.half_life_hr?.PO === 6,
    pk: { PO: { V_L: 700, F: 1, source_pmid: 'PMID:11510628' } },
    hl: { PO: 7 }, refs: ['PMID:26436896', 'PMID:9497016'],
    note: 'PK: REFUTED BY ITS OWN CITATION, TWICE, AND BOTH FIXES ARE FREE. The stored t-half of 6 h becomes 7: the cited abstract says "The drug is eliminated with a mean terminal half-life of approximately 7 hours", and an independent patient study agrees at "approximately 7 h for quetiapine". F 0.9 is refuted by the same abstract in the opposite direction - "The absolute bioavailability is unknown, but the RELATIVE bioavailability from orally administered tablets compared with a solution was nearly complete" - which is the confirmed relative-read-as-absolute shape; F is pinned to 1 because V 700 L is the label 10 L/kg apparent figure. ka 2.02 is a member of the 1.5-hour generator: with the old half-life it solves to Tmax 1.503 h, the exact midpoint of the abstract "ranging from 1 to 2 hours", while the measured immediate-release Tmax is 2 h. I did NOT swap in the one published apparent volume, 277 L, because it comes from an extended-release study and pairs with a 2.2 h half-life that contradicts everything else. The formulation question is settled and is NOT a half-life problem: "modifying the formulation does not change the overall absorption or elimination of quetiapine". My earlier 83%-bound finding is re-confirmed here verbatim.',
    summary: 'quetiapine — its own citation says 7 h and says the absolute F is unknown' },

  { slug: 'venlafaxine', guard: (c) => c.pk?.PO?.ka_hr === 1.88,
    pk: { PO: { V_L: 490, F: 0.45, source_pmid: 'PMID:9549664' } },
    hl: { PO: 4 }, refs: ['PMID:9549664', 'PMID:9537821'],
    note: 'PK: THE HALF-LIFE WAS REFUTED BY ITS OWN CITATION AND THE BIOAVAILABILITY WAS RIGHT UNDER THE WRONG ONE. PMID:1487561 states "Steady-state elimination half-life was 3 to 4 hours for venlafaxine and 10 hours for O-desmethylvenlafaxine"; the stored 5 is neither number nor their midpoint, and becomes the verbatim upper endpoint. F 0.45 moves to PMID:9549664, a four-way crossover with a genuine 10 mg INTRAVENOUS arm - "The absolute bioavailability of venlafaxine was between 40% and 45%" - where the previously cited abstract contains no bioavailability at all. ka 1.88 is the second member of the 1.5-hour generator, solving to Tmax 1.497 h against a measured 2-2.5 h; V 490 is reproducible from this record own numbers, CL/F 0.98 L/h/kg times 70 divided by the stored ke, giving 495. NO TRANSPLANT WITH DESVENLAFAXINE - both records were compared field by field from both sides and share no value. The real analyte issue is subtler and is recorded here: this models the MINOR circulating species, since "The area under the metabolite curve was two to three times greater than that for venlafaxine" and the metabolite has "almost equal activity", so a parent-only curve understates serotonergic exposure roughly threefold.',
    summary: 'venlafaxine — its citation says 3 to 4 hours, not 5; F moves to the paper with the IV arm' },

  { slug: 'chlorpheniramine', guard: (c) => c.pk?.PO?.ka_hr === 0.7,
    pk: { PO: { V_L: 230, F: 0.34, source_pmid: 'PMID:7106172' } },
    hl: { PO: 28 }, refs: ['PMID:7106172', 'PMID:2866055'],
    note: 'PK: A CITATION TRANSPLANT WITH THE DONOR IDENTIFIED. PMID:11332874, a nasal-spray relative-bioavailability study, states NONE of the five stored numbers - its entire numeric content is Cmax, AUC and four ratios. Every value instead tracks Huang 1982, a proper adult intravenous-plus-oral study that was never cited: "Mean t 1/2 from 7 oral fasting studies in 5 subjects was 28 h". F 0.41 IS A CROSS-ARM AVERAGE, and the arithmetic is exact: the source reports "Absolute bioavailability from oral solution (10 mg) was 59 and 34%, and from tablets (8 mg) 44 and 25%", whose four-way mean is 40.5%. It becomes 0.34, verbatim from a review - "about 0.34 for chlorpheniramine" - which is also close to the tablet-only arms this record doses. ka 0.7 IS A NEW COLLISION SHAPE: IT IS THE ABSORPTION LAG TIME. The same sentence reads "Mean absorption lag time was 0.7 h (0.4-1.3 h), and mean peak time was 2.8 h", and 0.7 per hour predicts a peak at 4.9 h against that measured 2.8. V 230 L is IV-derived at 3.2-3.6 L/kg, so CLASS 6 IS ACQUITTED. MY PREDICTION THAT THIS RECORD WOULD HAVE TO BE SKIPPED WAS WRONG - the literature is thin only if you read the wrong paper.',
    summary: 'chlorpheniramine — ka 0.7 is the absorption LAG TIME; F 0.41 is a four-arm average' },

  { slug: 'cilostazol', guard: (c) => c.pk?.PO?.F === 0.95,
    pk: { PO: { V_L: 193, F: 1, source_pmid: 'PMID:10702882' } },
    hl: { PO: 11 }, refs: ['PMID:10702883'],
    note: 'PK: FLIP-FLOP, AND THE EVIDENCE WAS IN THE SAME JOURNAL SUPPLEMENT AS THE CITED PAPER. PMID:10702883, never referenced here, states "The oral pharmacokinetics of cilostazol and metabolites are absorption-rate limited ... suggest flip-flop pharmacokinetics" and, decisively, "The t1/2z of cilostazol decreased from 15.5 hours after a tablet to 2.5 hours after an ethanolic solution". The stored 11 h is therefore an APPARENT, absorption-limited tablet value - the cited abstract calls it "The apparent elimination half-life" - and under flip-flop the stored ka 0.7 and ke 0.063 have their roles reversed. ka is removed rather than inverted. F 0.95 was not a measurement of anything: the abstract offers only the qualitative "indicating a low extraction ratio drug, and hence low probability of a significant first-pass effect", and a human absolute bioavailability CANNOT EXIST because cilostazol has no intravenous form - the only two absolute figures in the literature are in rats. F is pinned to 1 so that the volume, which the source names verbatim as "The apparent volume of distribution (Vz/F; 2.76 L/kg)", is not divided by an availability twice. The parent-only row understates activity: OPC-13015 is 4-7 times more potent at PDE3 and is not modelled.',
    summary: 'cilostazol — absorption-limited half-life, and no human absolute F can exist' },

  { slug: 'doxepin', guard: (c) => c.pk?.PO?.ka_hr === 2,
    pk: { PO: { V_L: 1589, F: 1, source_pmid: 'PMID:7293791' } },
    hl: { PO: 17.9 }, refs: ['PMID:12162857', 'PMID:7293791'],
    note: 'PK: ITS CITATION WAS A TWO-FORMULATION BIOEQUIVALENCE STUDY WITH NO INTRAVENOUS ARM, which cannot support a volume, a half-life or an absolute bioavailability, and it reports AUC, Cmax and tmax only. ka 2.0 is that tmax: "Time to reach doxepin maximum plasma concentration (tmax) was 1.98 h for both preparations" - the confirmed hours-as-rate collision, and the only number in the abstract it could have come from. THE STORED F WAS RIGHT AND ITS CITATION WAS WRONG: 0.29 is verbatim in an intravenous-plus-oral crossover, "The mean fraction absorbed after oral administration was 0.29 for each isomer", and independently corroborated by "first-pass metabolism of DOX was 71%". Because the only volume anywhere in this literature is explicitly apparent - "The mean total apparent volume of distribution was 22.7 l/kg" from an oral-only study - F is pinned to 1 and the volume moves to that figure, which corrects a threefold under-prediction of plasma concentration that the previous pairing produced. t-half 15 was stated by nothing and becomes the verbatim 17.9 h. TWO CORRECTIONS TO OUR OWN PROSE: doxepin is NOT a racemate but a mixture of geometric isomers, "Z:E = 15:85", and the claim that desmethyldoxepin free fraction is twice the parent is REFUTED - the two papers give 21.4 versus 20.4 percent unbound and 76.0 versus 75.5 percent bound. Doxepin partitions into erythrocytes with a time-dependent ratio.',
    summary: 'doxepin — ka 2.0 is the cited tmax 1.98; the right F sat under a study that cannot measure one' },

  { slug: 'fenofibrate', guard: (c) => c.pk?.PO?.F === 0.6,
    pk: { PO: { V_L: 63, F: 1, source_pmid: 'PMID:12581543' } },
    hl: { PO: 20 }, refs: ['PMID:12581543', 'PMID:1970770'],
    note: 'PK: EVERY STORED VALUE DESCRIBES FENOFIBRIC ACID AND THE RECORD CALLED IT FENOFIBRATE. Its own label says no unchanged fenofibrate is detected in plasma, and the cited mass-balance paper agrees from the other end - "The principal compound in feces was unchanged fenofibrate" - so the parent appears only unabsorbed. That citation is a 14C metabolite-identification study reporting NO half-life, NO volume, NO bioavailability and NO absorption rate, and all four values were class 1 against it. F 0.60 IS A URINARY RECOVERY PERCENTAGE, traceable inside the cited abstract itself - "59% in the urine" - and the quantity is unknowable in principle: "The absolute bioavailability of fenofibrate cannot be determined due to its being virtually insoluble in aqueous media suitable for injection; however ... approximately 60% of the dose appeared in urine". One sentence contains both the true fact and the numeral that was mistaken for it. F is pinned to 1 because the retained volume is apparent. ka 1.56 is a back-derivation implying a round 2.5 h peak, against a real "peak plasma levels attained in 6 to 8 hours". The analyte, the molecular weight and the occupancy EC50 are corrected together, because the stored EC50 converted a fenofibric-acid molar value using the PARENT mass.',
    summary: 'fenofibrate — F 0.60 is a urinary recovery; the whole record is fenofibric acid' },

  { slug: 'fluvoxamine', guard: (c) => c.pk?.PO?.F === 0.53,
    pk: { PO: { V_L: 1750, F: 0.5, source_pmid: 'PMID:8846617' } },
    hl: { PO: 15 }, refs: ['PMID:8846617'],
    note: 'PK: THE BETTER SOURCE WAS ALREADY IN refs[] AND CITED BY NOTHING. van Harten states F verbatim - "Despite complete absorption, oral bioavailability in man is approximately 50% on account of first-pass hepatic metabolism" - where a targeted search for a 53% figure returns zero hits. t-half 16 was a RANGE-INTERIOR value: the previously cited review says "a mean half-life of 15 hours and a range from 9 hours to 28 hours", and two other sources bracket 15 at 12-15 and 15-20. ka 0.4 is removed as unsourced. V 1750 L, about 25 L/kg, appears in NO abstract I could reach - not in the cited review, not in van Harten, not in Perucca - and is retained with that stated, because the resolver default would be worse than a label figure. FLUVOXAMINE IS THE ONE RECORD IN ITS GROUP WITH NO ANALYTE AMBIGUITY AT ALL: it "does not have an asymmetric carbon in its structure and therefore does not exist as optical isomers", and of nine identified metabolites "none of which are known to be pharmacologically active". Its 77% protein binding is confirmed verbatim and is described as "low compared with that of other SSRIs", so class analogies from the other SSRIs do not transfer to it. Its keo note checks out verbatim against the cited PET study.',
    summary: 'fluvoxamine — F 0.50 and the better citation were already sitting in its own refs' },

  { slug: 'isradipine', guard: (c) => c.pk?.PO?.F === 0.17,
    pk: { PO: { V_L: 196, F: 0.28, source_pmid: 'PMID:10815751' } },
    hl: { PO: 2.8 }, refs: ['PMID:10815751'],
    note: 'PK: MY FORMULATION PRIOR WAS REFUTED AND THE UNDERLYING DEFECT WAS REAL ANYWAY. The cited study used oral SOLUTION and CAPSULES only - no sustained-release arm exists in it - so the nifedipine defect is NOT present here. But the stored half-life was absorption-limited by a different route, and the paper that proves it asks the question in its own title, "half-life shorter than expected?": "A terminal half-life of 8-9 hr has been reported, in several pharmacokinetic studies after ORAL administration of isradipine ... Mean terminal half-life after INTRAVENOUS administration was calculated to be 2.8 hr". The stored 8 was precisely the oral artefact. F 0.17 was never measured either - the cited study determined RELATIVE bioavailability only and states no percentage - and becomes 0.28, verbatim and absolute against an intravenous comparator in the same crossover, so the F and the half-life now come from one internally consistent study. ADVERSARIAL CAVEAT RECORDED: that study sampled only 10-12 h, which may truncate a long terminal phase and bias the intravenous half-life short; an AUC ratio is far less sensitive to truncation than a half-life, so the bioavailability is the sturdier of the two. ka 1.5 is removed - it is both the capsule tmax of 1.57 h and a back-derivation to a round 2.02 h peak. V 196 L is in no abstract.',
    summary: 'isradipine — the 8 h half-life is an oral absorption artefact; F 0.17 was never absolute' },

  { slug: 'naproxen', guard: (c) => c.half_life_hr?.PO === 15,
    pk: { PO: { ka_hr: 1, V_L: 12, F: 0.95, source_pmid: 'PMID:7439246' } },
    hl: { PO: 17.7 }, refs: ['PMID:7439246'],
    note: 'PK: THE CITATION WAS BOTH EMPTY AND THE WRONG FORMULATION. PMID:26257511 reports only Cmax and AUC, none of the four stored values, and HCP1004 and VIMOVO are fixed-dose combinations of ENTERIC-COATED naproxen with esomeprazole - a delayed-release product cited on an immediate-release row, the nifedipine defect in milder form. t-half 15 was a RANGE ENDPOINT lifted from a review "naproxen (12-15 h)" and becomes the verbatim "the elimination half-life of naproxen was 17.7 +/- 3.0 h" from eight healthy subjects on a single oral dose. V 12 L and F 0.95 are retained and declared: no verbatim human naproxen volume in litres exists in any abstract - the nearest statement is a class-wide inequality, "Volume of distribution is mostly low (less than 0.2 L/kg)" - and the only 95% figure in this literature is a RELATIVE one, "the bioavailability of naproxen in the suppositories was 94.8%+/-6.3% OF the bioavailability of naproxen in the tablets", which is a live collision candidate rather than a source. BOTH COX ROWS VERIFY and the whole-blood exemption is justified: "ex vivo IC50 values of 35.48 micromol/l (COX-1) and 64.62 micromol/l (COX-2)", "measured ex vivo in human whole blood". OUR OWN PROSE WAS WRONG: the warfarin interaction note credits PMID:2724076 to Chan 1989; the paper is Diana, Veronich and Kapoor.',
    summary: 'naproxen — an enteric-coated combination product cited on an IR row, and empty besides' },

  { slug: 'nimodipine', guard: (c) => c.pk?.PO?.F === 0.13,
    pk: { PO: { ka_hr: 1, V_L: 2500, F: 1, source_pmid: 'PMID:11986913' } },
    hl: { PO: 2.9 }, refs: ['PMID:8832305'],
    note: 'PK: MY FORMULATION PRIOR DOES NOT REPEAT - THE RECORD ALREADY GOT THAT RIGHT. The cited study compared regular 30 mg every 6 h against a programmed-action 120 mg every 24 h, and the record took the IMMEDIATE-RELEASE arm, correctly leaving the modified-release "Apparent half-life ... in 17.8 h" alone. This is not nifedipine. The real defect is CLASS 12, and the cited paper refutes the record with its own data: {V 1300, F 0.13} gives an effective V/F of 10,000 L, and simulating that paper own regimen predicts a steady-state Cmax of 2.5 ng/mL against its observed "10.208 +/- 0.317 ng/ml" - FOUR TIMES LOW - while its data imply V/F near 2,500 L. THE TWO NUMBERS HAD TO MOVE TOGETHER: setting F to the real absolute figure while leaving V at 1300 would have made V/F 24,000 and the error nearly TEN times, worse than before. So F is pinned to 1 and the volume becomes the apparent V/F the citation own observations support, with the measured absolute bioavailability recorded here instead: "The absolute bioavailability was 10.6/1.60% in the elderly and 5.4/2.11% in young subjects", which is exactly the 5-13% spread and shows the stored 0.13 was above both arms. t-half 2.9 is verbatim but is NOT a consensus value - the literature spans 7 min and 1 h intravenously, 9.1 h orally and a review 13 h - and is kept because it is the cited paper own number.',
    summary: 'nimodipine — V and F together under-predict its own paper Cmax fourfold; fixing F alone doubles the error' },

  { slug: 'nitroglycerin', guard: (c) => c.pk?.SL?.F === 0.39,
    pk: { SL: { ka_hr: 8, V_L: 210, F: 0.362, source_pmid: 'PMID:3917598' },
          IV: { V_L: 210, F: 1, source_pmid: 'PMID:6101155' } },
    hl: { SL: 0.05, IV: 0.05 }, refs: ['PMID:6101155', 'PMID:3917598', 'PMID:3925750'],
    note: 'PK: ITS SOURCE WAS A NARRATIVE REVIEW WHOSE ABSTRACT CONTAINS NOT ONE NUMERAL, cited on BOTH routes and even for F:1 on the intravenous row, which no review can establish. Every value now has a real home and three of the four barely move. V 210 L was correct all along: "a large volume of distribution (approximately 3 liters/kg)" times 70 kg is 210 exactly, from an eight-subject intravenous infusion study - and because it is IV-derived it legitimately serves both routes and its pairing with an independent sublingual F is correct. t-half 0.04 h, 2.4 minutes, matched no published value and becomes 0.05 from the same sentence, "a rapid plasma half-life (approximately 3 min)". Sublingual F 0.39 becomes the verbatim absolute 0.362, "The mean bioavailability ... of sublingual nitroglycerin ... was 36.2 +/- 24.9%". THE SUBLINGUAL ROUTE IS FLIP-FLOP AND HAD NO ABSORPTION CONSTANT AT ALL: measured Tmax is "5.3 +/- 2.3 minutes", which EXCEEDS the 3-minute half-life, and the authors add that absorption "is not instantaneous and can be relatively slow, with peak times of as long as 10 minutes"; with no ka the simulator produced an instantaneous spike no study has observed, so a ka anchored to that Tmax is added and disclosed as derived. A LIVE TRAP IS RECORDED FOR FUTURE BATCHES: PMID:3105569 is a clean human study offering a 60 L volume and an 88.6% bioavailability, but its analyte is GLYCERYL-1-MONONITRATE, a metabolite.',
    summary: 'nitroglycerin — a numeral-free review cited on both routes; the SL row had no ka and is flip-flop' },

  { slug: 'pindolol', guard: (c) => c.half_life_hr?.PO === 4,
    pk: { PO: { ka_hr: 1, V_L: 213, F: 0.795, source_pmid: 'PMID:6487506' } },
    hl: { PO: 4.7 }, refs: ['PMID:639828', 'PMID:427002'],
    note: 'PK: THE HALF-LIFE BELONGED TO TWO OTHER DRUGS. The cited abstract states NO half-life; what it gives is a control elimination constant, "ke: 1.43 +/- 0.46 h-1 vs 0.56 +/- 0.10 h-1", whose control value implies 1.24 h and therefore ACTIVELY CONTRADICTS the stored 4. Meanwhile searching pindolol surfaces three abstracts on MEPINDOLOL and BOPINDOLOL - different drugs in the same class - reporting "half-life of disposition was 4.0 +/- 1.5 h", "4-5 h" and "about 4 h", any of which would produce exactly 4. It becomes 4.7, verbatim in a true pindolol study: "The plasma elimination half-life was identical after SD (4.7 +/- 0,8h) and MD (4.1 +/- 1.1h)". F and V are both VERIFIED and stay: the record correctly took the healthy-CONTROL arm of a malabsorption study, "59.4 +/- 6.2% in patients vs 79.5 +/- 8.6% in controls", refined here to 0.795, and its volume is IV-derived at 3.05 L/kg so CLASS 6 IS ACQUITTED and class 8 is excluded outright - "the drug was not concentrated in the red cell". CONFLICTS SURFACED HONESTLY: one study gives 2.9 h and 53% instead, and a third route to F is a derived 1 minus a 20% first-pass. The 5-HT1A emax is corrected separately, and our own fu_note is factually wrong about its own premise.',
    summary: 'pindolol — its 4 h half-life is mepindolol/bopindolol; its own citation implies 1.24 h' },

  { slug: 'piroxicam', guard: (c) => c.pk?.PO?.ka_hr === 1.02,
    pk: { PO: { V_L: 11.3, F: 1, source_pmid: 'PMID:3965234' } },
    hl: { PO: 37.5 }, refs: ['PMID:3965234'],
    note: 'PK: MY LONG-HALF-LIFE PRIOR HELD AND THE HALF-LIFE IS UNTOUCHED - 37.5 h is verbatim and correctly the FASTING arm rather than a cross-arm average, independently corroborated by a cimetidine study control arm at 37.36 h. Two other values fail. ka 1.02 is the cleanest back-derivation in this batch: with the stored half-life it solves to Tmax 4.0046 h, within five thousandths of a round 4. And V 10 L IS CLASS 6 DIAGNOSED FROM THE SOURCE OWN WORDING RATHER THAN FROM RECORD SHAPE - the abstract says "volume of distribution DIVIDED BY availability, 0.140 or 0.136 liter/kg" - so an independent F 0.95 applied it twice; it was also a 70-kg scaling rather than a quoted litre value. It becomes 11.3 L, verbatim IN LITRES, with F pinned to 1 because that figure is apparent too. The subgroup caveat is real and recorded: 11.3 is the young-men arm of "elderly women (7.8 +/- 0.4 l) ... young men (11.3 +/- 0.3 l) and elderly men (10.8 +/- 0.8 l)", and it is the only verbatim-in-litres option available. F 0.95 had no source at all - no absolute-bioavailability abstract for piroxicam exists - and the nearby 0.95 in this literature is a RELATIVE intramuscular figure for TENOXICAM.',
    summary: 'piroxicam — ka 1.02 solves to a round 4 h peak; its volume is V/F by the abstract own words' },

  { slug: 'sertraline', guard: (c) => c.pk?.PO?.F === 0.44,
    pk: { PO: { V_L: 1400, F: 1, source_pmid: 'PMID:15497672' } },
    hl: { PO: 26 },
    note: 'PK: t-half 26 IS VERIFIED - "The mean t1/2el was 26.49 +/- 6.45 h for the test formulation" - and the analyte is the PARENT, assayed by HPLC-MS-MS, not desmethylsertraline. F 0.44 IS A FAECAL METABOLITE FRACTION: the SSRI review that carries it says "larger quantities of metabolites of paroxetine (36%) and sertraline (44%) are excreted in FAECES", and the cited bioequivalence study has no intravenous arm and therefore cannot report an absolute bioavailability at all. Because 1400 L is the label 20 L/kg and no human intravenous sertraline study exists, that volume is necessarily apparent, so F is pinned to 1 rather than deleted - which also removes the double-division the old pairing carried. ka 0.4 is removed as unsourced. THE DEFECT IN OUR OWN PROSE: this record effect_compartment note reads "sertraline 69-78% at 4 h", but the cited PET study says "Escitalopram AND sertraline showed high occupancies of 69.1-77.9% at 4h" - a combined two-drug range attributed to one drug - and the note is corrected. Its SERT affinity remains a full-text table value, which the note already discloses honestly; the abstract names only mazindol, sertraline at the DOPAMINE transporter, and nomifensine numerically.',
    summary: 'sertraline — F 0.44 is a faecal metabolite fraction; our own keo note merges two drugs' },

  { slug: 'tamsulosin', guard: (c) => c.pk?.PO?.F === 0.9,
    pk: { PO: { V_L: 16, F: 1, source_pmid: 'PMID:9344174' } },
    hl: { PO: 11.4 }, refs: ['PMID:9344174'],
    note: 'PK: F 0.9 IS A PROTEIN-BINDING PERCENTAGE, AND THE DONOR WAS SITTING IN THIS RECORD OWN refs[]. PMID:10492056 states "The mean percentage of unbound 14C-tamsulosin was 0.90% in the healthy subjects", and F 0.9 is that free fraction read as a bioavailability - the confirmed collision shape, with the source already present. The real figure is verbatim and is essentially complete: "The mean absolute oral bioavailability (+/-SD) was approximated at 100 +/- 19%", measured on modified-release granules against a 0.125 mg intravenous infusion, so F becomes 1. V 16 L IS CORRECT and only its citation was wrong - "estimated at 16 +/- 4 L in the steady state", IV-derived, so class 6 does not apply. A NEAR-MISS IS RECORDED SO NOBODY UNDOES IT: another paper in this record refs[] reports "peak plasma levels of 16 ng ml(-1)", making V_L 16 look exactly like a Cmax collision, but the volume is independently verbatim. It is a coincidence. t-half 14 appears nowhere; the cited interaction study gives "from 11.4 h to 15.3 h", where 15.3 and 11.8 are the INHIBITED arms, so the control 11.4 is stored. ka 0.4 is removed because this route is flip-flop: the intravenous terminal half-life is 6.8 h against an oral 10.5-11.4 h, so the oral slope is absorption-limited and a 1.7 h absorption half-life is incoherent with it.',
    summary: 'tamsulosin — F 0.9 is its own 0.90% unbound fraction; true F is ~100%' },

  { slug: 'telmisartan', guard: (c) => c.pk?.PO?.ka_hr === 1.4,
    pk: { PO: { V_L: 500, F: 0.43, source_pmid: 'PMID:11185629' } },
    hl: { PO: 24 }, refs: ['PMID:10854085', 'PMID:11014323'],
    note: 'PK: MY PRIOR HELD AND THE OUTLIER-LOOKING VALUES ARE REAL. F 0.43 is verbatim - "Absolute bioavailability was 43%" - with a matched intravenous arm, and V 500 L is verbatim in a review as an explicitly STEADY-STATE volume, "a high of 500 L (telmisartan)", so pairing the two is CORRECT and class 6 is acquitted. I could NOT source my own claim of 42% at 40 mg rising to 58% at 160 mg from any abstract, and it is deliberately not stored; what is sourceable is only "maximum plasma concentrations increasing disproportionately with dose", and the verbatim 43% was measured on a 40 mg oral SOLUTION rather than a tablet. t-half 24 IS THE DOSING INTERVAL: no abstract states 24 h for telmisartan, and the one that comes closest contains both "a prolonged terminal elimination phase (> 20 h in healthy and hypertensive subjects)" and, in the same abstract, "the full 24-h dosing interval". No clean scalar replacement exists - the only point values are 27 to 42 hours in HEPATIC IMPAIRMENT - so 24 is retained with its true provenance stated and the verbatim inequality recorded, because the model needs an elimination rate. ka 1.4 is removed for being too SLOW: observed tmax is "0.5 to 1 hour" and 1.4 predicts 2.8 h. Telmisartan is "reversibly distributed into erythrocytes", which is noted but is not a matrix defect.',
    summary: 'telmisartan — t-half 24 is its dosing interval; V 500 and F 0.43 are both real and correctly paired' },

  { slug: 'varenicline', guard: (c) => c.pk?.PO?.ka_hr === 0.7,
    pk: { PO: { ka_hr: 1.69, V_L: 415, F: 1, source_pmid: 'PMID:19916991' } },
    hl: { PO: 24 }, refs: ['PMID:19916991'],
    note: 'PK: I PREDICTED THIS WOULD BE THE SIMPLE ONE AND THAT ITS VALUES WERE PROBABLY CORRECT. The half-life is - 24 h is verbatim in three independent sources, with a Chinese cohort at 15.2 and 18.3 h recorded as counter-evidence. The bioavailability is not: F 0.9 IS A URINARY EXCRETION FRACTION, taken from "approximately 90% of the drug is excreted in the urine unchanged", where the same abstract actual availability statement is unquantified - "Varenicline is almost entirely absorbed following oral administration" - and a disposition study gives the human figure as 81%, again excreted unchanged rather than absorbed. No abstract states an absolute F for varenicline, so it is pinned to 1, which is also what the retained volume requires. ka 0.7 becomes the first measured absorption constant in this batch, from a population fit over 1878 smokers in nine pooled studies: "K(a), 1.69 h(-1) (1.27, 2.00)", with a 0.43 h lag the solver cannot yet express. V 415 is DISCLOSED AS A SUM rather than a quotation - it is that fit V(2)/F 337 L plus V(3)/F 78.1 L - and since every parameter in that model is apparent, pinning F to 1 also removes a genuine double-division. Its low protein binding is confirmed verbatim, "low (< or = 20%) and independent of age and renal function".',
    summary: 'varenicline — F 0.9 is its urinary excretion fraction; ka 1.69 is a real population estimate' },

  { slug: 'anastrozole', guard: (c) => c.pk?.PO?.source_pmid === 'PMID:7626450',
    pk: { PO: { V_L: 140, F: 0.85, source_pmid: 'PMID:9522927' } },
    hl: { PO: 50 }, refs: ['PMID:9522927', 'PMID:11747767'],
    note: 'PK: THE HALF-LIFE WAS RIGHT UNDER A CITATION THAT GIVES ONLY A RANGE. The old source says "The elimination half-life of ARIMIDEX in humans ranged from 30 to 60 h", and 50 is not even its midpoint; the replacement states it verbatim, "The drug terminal half-life after multiple doses is 50 hours". F 0.85 and V 140 L ARE UNSOURCEABLE - a PubMed search for an anastrozole volume of distribution returns COUNT 0, twice - AND THEY ARE KEPT ANYWAY, because they reproduce the only human exposure measurement in the literature almost exactly: {140, 0.85, 50} imply CL/F 2.283 L/h against an observed "AUC(0-infinity) ... (443 +/- 141) ... microg . h . L-1" at 1 mg, which is 2.257 L/h. A 1.2% match. That is almost certainly a class-9 back-derivation from this very AUC, but it is a CORRECT one, and deleting it would make the model worse; it is annotated as model-derived rather than measured. TWO TRAPS AVOIDED AND RECORDED: the same exposure paper "relative bioavailability ... 100 % +/- 9 %" is RELATIVE and unusable for F, and a microdose cassette study F figures of 34.9% and 18.4% belong to CETROZOLE and TMD-322, not to anastrozole.',
    summary: 'anastrozole — unsourceable V and F kept because they reproduce the only human AUC to 1.2%' },

  { slug: 'betaxolol', guard: (c) => c.pk?.PO?.V_L === 360,
    pk: { PO: { ka_hr: 1, V_L: 342, F: 0.88, source_pmid: 'PMID:2906367' } },
    hl: { PO: 17.5 }, refs: ['PMID:1865331', 'PMID:6104498', 'PMID:6108127'],
    note: 'PK: FOUR VALUES REPLACED, ALL VERBATIM, AND THE REPLACEMENTS ARE MUTUALLY COHERENT. F 0.85 was a CROSS-ARM AVERAGE - the source reports "F: 0.88 +/- 0.08, 0.82 +/- 0.06, 0.84 +/- 0.07" for 10, 20 and 40 mg, whose mean is 0.847 - and becomes the 10 mg arm, matching this record typical dose; an independent study confirms the magnitude at "89 +/- 5%". ka 0.6 is probably that sentence STANDARD DEVIATION, since the only 0.6 in this literature is in "apparent absorption rate constant ... 1.0 +/- 0.6 versus 1.2 +/- 0.6 h-1", and it is independently wrong: 0.6 predicts a peak at 4.89 h, OUTSIDE the observed "3-4 h", while 1.0 predicts 3.36 h inside it. V 360 becomes the verbatim "342 +/- 62 versus 340 +/- 65 L", which is INTRAVENOUS so the F pairing stays correct. t-half 18 was neither endpoint nor midpoint of a printed "13-20 h" and becomes a verbatim 17.5 h. THE CHECK THAT MATTERS: the new set implies CL/F 15.4 L/h against a measured intravenous 15.6 and 16.4, and predicts Cmax 22.6 ug/L against an observed "21.6 +/- 3.7". IN FAIRNESS TO THE OLD RECORD, its exposure was never badly wrong, only about 7% off; what was wrong was that nothing but F traced to the cited paper, and a Tmax misplaced by 1.5 h. A rabbit anterior-chamber "volume of distribution" of 1421 microlitres was rejected. MATRIX CAVEAT: both studies assayed WHOLE BLOOD, harmless today but decisive before any ec50 is added.',
    summary: 'betaxolol — F was a three-arm average and ka was probably its SD; four verbatim replacements' },

  { slug: 'candesartan', guard: (c) => c.pk?.PO?.source_pmid === 'PMID:29746726',
    pk: { PO: { ka_hr: 0.5, V_L: 9, F: 0.4, source_pmid: 'PMID:9696961' } },
    hl: { PO: 9.3 }, refs: ['PMID:9696961'],
    note: 'PK: THE HALF-LIFE IS EXACTLY RIGHT AND ITS CITATION NEVER STATED IT. The old source says the half-life "were assessed" and then never reports it; the replacement gives "the elimination half-life was 9.3 h in healthy volunteers and 12 h in the patients", and whoever stored 9.3 correctly avoided the hepatic-impairment arm. The analyte declaration is confirmed - "Candesartan cilexetil is the prodrug of candesartan ... Absorbed candesartan cilexetil is completely metabolised to candesartan" - so modelling the acid at mw 440.45 is right. WHAT IS NOT FIXED HERE, DELIBERATELY: this record over-predicts candesartan exposure six- to eightfold and I will not close it with an invented number. {V 9, F 0.4, 9.3 h} imply CL/F 1.68 L/h against three independent measurements of 13.2, 9.9 and 17.5 L/h, and simulated Cmax at the typical 16 mg is about 710 ng/mL against an observed "160.91". The individual values are not the problem: 9 L is candesartan genuine small intravenous-derived volume and 9.3 h is a genuine terminal half-life, and they cannot coexist in one compartment. FIXING F ALONE MAKES IT WORSE - the tablet figure is about 15%, not the 40% that belongs to the oral SOLUTION, and F 0.15 would cut CL/F to 0.63 L/h. Reproducing the observed AUC needs V/F near 132 L, which no abstract states. Logged to AUTHORING_GAPS.',
    summary: 'candesartan — 9.3 h verifies under a citation that omits it; a 6-8x exposure error is logged, not patched' },

  { slug: 'cyclobenzaprine', guard: (c) => c.pk?.PO?.F === 0.55,
    pk: { PO: { V_L: 400, F: 0.33, source_pmid: 'PMID:7082776' } },
    hl: { PO: 31.9 }, refs: ['PMID:24151591', 'PMID:7082776'],
    note: 'PK: THE HALF-LIFE WAS VERBATIM FROM THE WRONG FORMULATION. The cited "mean t(1/2) was 33.4 hours for CER 15 mg and 32.0 hours for CER 30 mg" is EXTENDED-RELEASE cyclobenzaprine, filed against a record whose doses are immediate-release, and it also picks one of two arms. It becomes 31.9 h, verbatim from an immediate-release crossover sampled to 240 h. F 0.55 IS THE UPPER ENDPOINT of the label 33-55% range and becomes the only absolute measurement anyone has published: "the bioavailability of the 10 mg oral tablet, 10 mg i.m. and 20 mg i.m. injection was 0.33, 0.76, and 0.56, respectively, when compared to the 10 mg i.v. injection". A ROUTE MISMATCH WAS ONE KEYSTROKE AWAY in that sentence - 0.56 is the 20 mg INTRAMUSCULAR value. TWO OF MY PRIORS WERE WRONG: the half-life is not about 18 h, a figure I could not source anywhere, since two primaries on two formulations agree near 32 h; and a scalar F IS defensible after all, because 0.33 is a single intravenous-referenced absolute measurement and the 33-55% range is an artefact of secondary sources, so this record error was taking the wrong end of it. ka 0.4 is removed and is not even a back-derivation - it implies a 7.71 h peak, matching neither the extended-release 6.0 h nor the immediate-release 4.5 h. V 400 L has no quantitative source at all.',
    summary: 'cyclobenzaprine — an extended-release half-life on an IR record; F was the favourable end of a range' },

  { slug: 'desipramine', guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { V_L: 2300, F: 1, source_pmid: 'PMID:16680561' } },
    hl: { PO: 21 }, refs: ['PMID:3965690', 'PMID:2185906'],
    note: 'PK: t-half 21 IS VERIFIED AND THE ARM ORDERING WAS CHECKED ADVERSARIALLY, because "21.0 versus 43.3" is exactly the ambiguous shape that produces a wrong-arm store. Two independent reads confirm the record picked correctly: the sentence asserts the half-life was LONGER with cinacalcet, so 43.3 must be the interaction arm, and the same abstract uses alone-first ordering elsewhere. Corroborated at "21.2 hr" in a separate study. The population is narrower than the record said and is now recorded: "Seventeen subjects who were genotyped as CYP2D6 EXTENSIVE METABOLIZERS were enrolled", so this does not represent poor metabolisers. F 0.5 has no source - no abstract states an absolute bioavailability for desipramine - and the nearby numbers all belong to IMIPRAMINE, whose own "absolute bioavailability was 40.2% in the control state" appears to be the origin of the imipramine record stored F. CLASS 6 APPLIES HERE IN ITS DIAGNOSABLE FORM, not as a shape guess: no human intravenous desipramine study exists, so 2300 L is necessarily V/F, and F is pinned to 1 accordingly. ka 1.5 is removed because IMIPRAMINE STORES THE IDENTICAL 1.5 - a tricyclic class default propagated across records. Desipramine concentrates in erythrocytes, and its kinetics turn non-linear above 150 micrograms/L in at least a third of people.',
    summary: 'desipramine — its ka is imipramine ka; class 6 diagnosable because no human IV study exists' },

  { slug: 'eplerenone', guard: (c) => c.pk?.PO?.ka_hr === 1.7,
    pk: { PO: { V_L: 43, F: 1, source_pmid: 'PMID:14570778' } },
    hl: { PO: 3 },
    note: 'PK: A GOOD PAPER MINED FOR LESS THAN HALF OF WHAT WAS HUNG ON IT - class 1 in its most deceptive form, since the citation is genuine, human and on-topic. t-half 3.0 is verbatim, "plasma concentrations of EP declined with a half-life of 3.0 h". ka 1.7 is not: the only 1.7 in that abstract is a CONCENTRATION, "a mean EP Cmax of 1.72 mug/ml", and back-derivation is excluded because the stored pair implies a 1.36 h peak whereas reproducing the quoted 1.2 h would need about 2.0 - so the Cmax collision is the only route left, and it is removed. V 43 L is the LOWER ENDPOINT of the label 43-to-90 L range, and class 6 applies in its diagnosable form because eplerenone has no human intravenous formulation in any abstract, making 43 necessarily V/F; F is pinned to 1 rather than left at an unsourced 0.69, for which a search returns ZERO records and whose nearest neighbour, 66.6%, is urinary mass balance. TWO FINDINGS WORTH KEEPING: the earlier decision to skip a free fraction here was RIGHT, on this paper own words - "Plasma protein binding was moderate (33-60%) but concentration-dependent over the therapeutic concentration range" - and class 8 is affirmatively EXCLUDED, "EP and its metabolites did not preferentially partition into the red blood cells", so a plasma-referenced volume is correct and this need not be re-litigated.',
    summary: 'eplerenone — ka 1.7 is the cited Cmax 1.72 ug/ml; V 43 is a range endpoint and is V/F' },

  { slug: 'etravirine', guard: (c) => c.pk?.PO?.F === 0.3,
    pk: { PO: { ka_hr: 1.16, V_L: 972, F: 1, source_pmid: 'PMID:27665573' } },
    hl: { PO: 16.2 }, refs: ['PMID:27665573', 'PMID:19725591'],
    note: 'PK: ITS SOURCE WAS A TELAPREVIR INTERACTION STUDY REPORTING ONLY PERCENTAGE CHANGES - "Telaprevir Cmin, Cmax, and AUC decreased 25%, 10%, and 16%" - and no half-life, volume, bioavailability or absorption rate for any drug. All four values were class 1 against it, and the antiviral over-representation in that class holds. F 0.30 IS DELETED RATHER THAN REPLACED because it is unknowable: no abstract states an absolute bioavailability for etravirine, both dedicated Clin Pharmacokinet reviews omit one, and there is no intravenous formulation. Everything moves to a population fit over 4728 concentrations in 817 adults: "Estimates of apparent total clearance (CL/F), apparent central volume of distribution (V c/F), first-order absorption rate constant (k a), and absorption lag-time were 41.7 L/h, 972 L, 1.16 h, and 1.32 h" - all apparent, so F is pinned to 1. THE HALF-LIFE IS DERIVED AND SAYS SO: 16.2 h is what that model own volume and clearance require, and it deliberately does NOT match the reviews 30-40 hour TERMINAL half-life, which a one-compartment model built on this volume cannot reproduce. Storing the literature 41 h beside V 972 would assert a clearance of 17.8 L/h against the measured 41.7, over-predicting exposure 2.3-fold; the old record under-predicted by 1.42. Exposure is the quantity the simulator exists to get right.',
    summary: 'etravirine — a telaprevir DDI paper cited for four PK values; F cannot be measured at all' },

  { slug: 'febuxostat', guard: (c) => c.pk?.PO?.V_L === 32.8,
    pk: { PO: { ka_hr: 3.6, V_L: 142, F: 1, source_pmid: 'PMID:27753003' } },
    hl: { PO: 9.4 }, refs: ['PMID:27753003'],
    note: 'PK: CLASS 12, AND THE LARGEST QUANTITATIVE ERROR IN ITS GROUP. ka 3.6 and V 32.8 are both verbatim - "the population mean for apparent clearance (CL/F), apparent central volume of distribution (Vc/F) ... and absorption rate constant (ka) ... were 6.91 l h-1, 32.8 l ... and 3.6 h-1" - but 32.8 L is the CENTRAL volume of a TWO-COMPARTMENT model and this registry runs one, so the stored set implied an AUC per dose of 0.259 h/L against a measured 0.095, OVER-PREDICTING EXPOSURE 2.7-FOLD. It is also explicitly apparent and sat beside an independent F 0.84, which is itself the label "at least 84% ABSORBED" - an absorption fraction read as a bioavailability. The volume becomes the one-compartment value that reproduces this drug own verbatim clearance at its own verbatim terminal half-life, "an apparent oral clearance (CL/F) of 10.5 +/- 3.4 L/h" and "the terminal t 1/2 determined at daily doses of 40 mg or more is 9.4 +/- 4.9 h", and that derivation is disclosed rather than presented as a measurement. The paper Vss/F of 48 L is NOT used, because a steady-state two-compartment volume is not a one-compartment volume either. F is pinned to 1 since every parameter here is apparent. ka 3.6 is the FASTED value: "Food reduced the relative biovailability and ka by 67% and 87%". MY THIN-LITERATURE PRIOR WAS RIGHT ONLY FOR F.',
    summary: 'febuxostat — a two-compartment central volume in a one-compartment record, 2.7x over-prediction' },

  { slug: 'glecaprevir', guard: (c) => c.pk?.PO?.F === 0.05,
    pk: { PO: { ka_hr: 0.5, V_L: 390, F: 1, source_pmid: 'PMID:37661787' } },
    hl: { PO: 5.9 }, refs: ['PMID:28688001', 'PMID:27863806'],
    note: 'PK: BOTH OF MY PRIORS WERE WRONG AND THE RECORD STILL NEEDED FIXING. The elvitegravir shape does NOT transfer: glecaprevir was studied alone, and the boosting is ONE-DIRECTIONAL - "Glecaprevir C max and AUC values during coadministration were less than 1.5-fold of the values when glecaprevir was administered alone", while glecaprevir raises pibrentasvir up to sevenfold. So its combination values ARE its monotherapy values and there is nothing the schema needs to express. My food-effect claim is also refuted: "Food had a minimal effect on ABT-493 exposures". t-half 6 was a rounding of the verbatim "a terminal elimination half-life of 5.9 and 25 hours". F 0.05 IS THE MOST DANGEROUS VALUE HERE: it is unsourced - five searches found no bioavailability, volume or absorption rate for glecaprevir anywhere - and if V 390 L is apparent, which is the only kind of volume published for this drug, the record discounted by F twice for a TWENTYFOLD exposure error. F is pinned to 1. ka and V are retained as declared gaps. SPILLOVER RECORDED: pibrentasvir carries PMID:28688001 for its ka, V, F and half-life, and that abstract states none of those four either; its half-life is available verbatim as 25 h from the same source used here.',
    summary: 'glecaprevir — an unsourced F 0.05 beside an apparent volume, a 20x exposure error' },

  { slug: 'ketoprofen', guard: (c) => c.pk?.PO?.ka_hr === 2.13,
    pk: { PO: { V_L: 15, F: 0.814, source_pmid: 'PMID:8527271' } },
    hl: { PO: 2.05 }, refs: ['PMID:8527271', 'PMID:3581635'],
    note: 'PK: ka 2.13 IS THE CLEANEST BACK-DERIVATION IN THIS BATCH - with the stored half-life it solves to Tmax 0.9996 h, landing on exactly one hour, where the cited abstract real peak times are "72 +/- 45" and "61 +/- 39" MINUTES. F 0.95 becomes the measured absolute figure, and the enantiomer question is handled explicitly rather than averaged away: "The absolute bioavailability of the 50 mg oral dose was 84.5 (s.d. 20.6) % and 81.4 (18.0) % for R-ketoprofen and S-ketoprofen, respectively". NO RACEMATE FIGURE IS STATED, so no mean is taken; the stored value is the S-enantiomer, which carries the pharmacology, and the R value is recorded here. t-half 1.9 becomes 2.05 h, verbatim and INTRAVENOUS, which pairs coherently with the volume and clearance from the same study. V 15 L IS ACQUITTED AND I NEARLY FLAGGED IT WRONGLY: it is a back-derivation, but from intravenous data - that study clearance of 5.10 L/h divided by the rate implied by its own 2.05 h half-life gives 15.08 - so the magnitude is right and the pairing with an independent F is NOT a class-6 defect. THE WHOLE-BLOOD QUESTION IS SETTLED IN THE OCCUPANCY ROWS AND HAS NO PK ANALOGUE: both COX values were re-read from the source table directly and both conversions check exactly.',
    summary: 'ketoprofen — ka 2.13 solves to exactly 1.000 h; F is the S-enantiomer, not a racemate mean' },

  { slug: 'lamotrigine', guard: (c) => c.pk?.PO?.F === 0.98,
    pk: { PO: { ka_hr: 1, V_L: 77.4, F: 1, source_pmid: 'PMID:9159559' } },
    hl: { PO: 27.7 }, refs: ['PMID:9159559', 'PMID:8119045', 'PMID:25903807'],
    note: 'PK: THE VOLUME WAS RIGHT AND ITS HOME WAS A DIFFERENT PAPER - "The final population estimate of V/F was 77.4 l with an interpatient variability of 34%", from 163 patients on MONOTHERAPY, which also answers the background-regimen question this drug always raises. A TRAP IS RECORDED SO NOBODY RE-SOURCES IT: another abstract reports an "apparent volume of distribution: 1.08 +/- 0.37 l/kg" that also scales to about 77 L, but its ANALYTE IS CARBAMAZEPINE-10,11-EPOXIDE. Because 77.4 is explicitly V/F, F is pinned to 1, and the half-life becomes the value coherent with that same study measured clearance, "CLo increased by 17.3% during the 48 weeks of therapy, from 1.94 to 2.28 l h(-1)" - the stored 36 h would assert 1.49 L/h and over-predict exposure by 1.3 to 1.5 times. The derivation is disclosed. THE INTERACTION CAVEAT IS THE POINT OF THIS RECORD and is now declared: enzyme inducers "reduce the half-life of lamotrigine (to mean values of 13.5 to 15 hours), whereas valproic acid increases the half-life ... (to mean values of 48.3 to 59 hours)", a fourfold span, so every stored value here means MONOTHERAPY. COUNTER-EVIDENCE ON F: lamotrigine DOES have an intravenous form, and the primary absolute study gives "73% and 92%" for immediate- and extended-release, against the 98% everyone quotes.',
    summary: 'lamotrigine — V 77.4 is monotherapy V/F; its half-life now matches its own study clearance' },
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

/** Routes declared in routes[] with no pk block behind them, or mislabelled outright. */
const ROUTE_DROPS: Record<string, string[]> = {
  // betaxolol non-oral form is OPHTHALMIC (Betoptic), as this record own mechanism string says.
  // "TD" is the wrong label for it AND carries no pk or doses block.
  betaxolol: ['TD'],
  // nitroglycerin TD and IN carry no pk row, and doses gives them the same 5-400 mcg range as
  // SL/IV, which is wrong for a patch dosed in mg/h over 24 h.
  nitroglycerin: ['TD', 'IN'],
  hydroxyzine: ['IM'],
};
for (const [slug, routes] of Object.entries(ROUTE_DROPS)) {
  const c = need(slug);
  const gone = routes.filter((r) => (c.routes ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} routes — already trimmed, skipped`); continue; }
  c.routes = (c.routes ?? []).filter((r) => !gone.includes(r));
  for (const r of gone) if (c.doses && r in c.doses) delete c.doses[r];
  log.push(`${slug} — dropped unparameterised route(s): ${gone.join(', ')}`);
}

/**
 * References supporting NOTHING on the record they sit on. Every one was checked against all
 * three uses — PK provenance, receptor_occupancy, interactions — per the standing rule adopted
 * after four reversals of exactly this judgement. Candidates that survived that check and are
 * therefore NOT removed: fenofibrate 16310551 (a 9795-patient outcomes trial), fluvoxamine
 * 27738376 and quetiapine 9430133 (both document REJECTED values), telmisartan 23471702.
 */
const REF_DROPS: Record<string, string[]> = {
  // Zajdel 2013: novel quinoline-sulfonamide ANALOGS (compounds 33/39/40). No aripiprazole value.
  aripiprazole: ['PMID:23279866'],
  // A heterocyclic cycloalkanol ethylamine synthesis series. No venlafaxine value at all — the
  // residue of a NET affinity this record note says was replaced.
  venlafaxine: ['PMID:20378347'],
  // Phthalazinone analogues measured against AZELASTINE. No chlorpheniramine number.
  chlorpheniramine: ['PMID:21381763'],
};
for (const [slug, pmids] of Object.entries(REF_DROPS)) {
  const c = need(slug);
  const gone = pmids.filter((p) => (c.refs ?? []).includes(p));
  if (!gone.length) { log.push(`${slug} refs — already trimmed, skipped`); continue; }
  c.refs = (c.refs ?? []).filter((p) => !gone.includes(p));
  log.push(`${slug} — dropped ref(s) supporting nothing: ${gone.join(', ')}`);
}

/** receptor_occupancy corrections. */
const RO_FIXES: { slug: string; receptor: string; ec50?: number; emax?: number; note: string }[] = [
  { slug: 'pindolol', receptor: '5-HT1A', emax: 0.203,
    note: 'emax CORRECTED FROM 1 TO 0.203, AND THIS RECORD OWN NOTE ALREADY KNEW: the source states "(-)pindolol displays an efficacy of 20.3% relative to the endogenous agonist, 5-HT (= 100%)", and the note wrote "efficacy 20%" while the model ran a FULL agonist. The affinity is verbatim and untouched, "Ki = 6.4 nmol/L", human recombinant 5-HT1A.' },
  { slug: 'piroxicam', receptor: 'cox_1', ec50: 0.79524,
    note: 'ARITHMETIC CORRECTED: 2.4 uM x 331.35 / 1000 is 0.79524, but 0.79512 was stored, back-solving to a mass of 331.30 — THE TWO COX ROWS ON ONE COMPOUND USED DIFFERENT MASSES, since COX-2 converts correctly. Both IC50s are full-text Table 1 figures: the Warner 1999 ABSTRACT STATES NO PER-COMPOUND NUMBER, and the tell is that naproxen occupancy notes carry a verbatim quote while these carry none. Not fabrication — Warner is canonical — but flagged full-text-sourced. The 1999 erratum, PNAS 96(17):9666, is unreflected.' },
  { slug: 'fenofibrate', receptor: 'ppar_alpha', ec50: 6.3751,
    note: 'CONVERTED WITH THE PARENT MASS. The source EC50 is fenofibric acid — "Fenofibric acid and bezafibrate showed weak agonist activity for PPARalpha (EC(50), 2-8 x 10(-5) M)" — but the stored value used 360.83 rather than the acid 318.75, making it 13.2% high. Corrected with mw and the analyte. Also: 2 x 10(-5) M is the LOWER ENDPOINT of a range, not a point estimate.' },
];
for (const f of RO_FIXES) {
  const c = need(f.slug);
  const row = (c.receptor_occupancy ?? []).find((r) => r.receptor === f.receptor);
  if (!row) throw new Error(`${f.slug} occupancy row ${f.receptor} missing`);
  const done = (f.ec50 != null && row.ec50_mg_l === f.ec50) || (f.emax != null && row.emax === f.emax);
  if (done) { log.push(`${f.slug}/${f.receptor} — already corrected, skipped`); continue; }
  if (f.ec50 != null) row.ec50_mg_l = f.ec50;
  if (f.emax != null) row.emax = f.emax;
  row.note = row.note ? `${row.note} ${f.note}` : f.note;
  log.push(`${f.slug}/${f.receptor} — ${f.ec50 != null ? `ec50 -> ${f.ec50}` : `emax -> ${f.emax}`}`);
}

/**
 * Occupancy rows whose citation cannot support them at all. hydroxyzine H1 cites a PMID that
 * PubMed returns with title, authors and journal and NO ABSTRACT TEXT WHATSOEVER, and the row own
 * note admits the reasoning was that hydroxyzine is "a UCB compound ... and a canonical member of
 * such a panel" — inference from plausibility. AUTHORING_GAPS.md already recorded that no abstract
 * names a hydroxyzine H1 Ki. The gap log was right and the record was wrong.
 */
const RO_DROPS: Record<string, string[]> = { hydroxyzine: ['H1'] };
for (const [slug, receptors] of Object.entries(RO_DROPS)) {
  const c = need(slug);
  const kept = (c.receptor_occupancy ?? []).filter((r) => !receptors.includes(String(r.receptor)));
  if (kept.length === (c.receptor_occupancy ?? []).length) { log.push(`${slug} occupancy — already dropped, skipped`); continue; }
  const gone = (c.receptor_occupancy ?? []).length - kept.length;
  if (kept.length) c.receptor_occupancy = kept; else delete c.receptor_occupancy;
  log.push(`${slug} — dropped ${gone} occupancy row(s) with no citable affinity: ${receptors.join(', ')}`);
}

/** effect_compartment corrections. */
const EC_FIXES: Record<string, { keo: number; approximated: boolean; dropSource?: boolean; note: string; summary: string }> = {
  quetiapine: { keo: 0.07, approximated: true, dropSource: true,
    note: 'Approximation. ITS PREVIOUS SOURCE WAS A RAT STUDY OF LIPID-CORE NANOCAPSULES — brain microdialysis in a phenotyped rat model, no keo in the abstract, no human, no tablet — and is removed. Human data point the other way: quetiapine has "an occupancy half-life (10 h), which was about twice as long as that for plasma", where plasma was 5.3 h. The stored 0.45 modelled a 1.5 h effect half-life, about six times too fast. The sign was never wrong, the magnitude was.',
    summary: 'quetiapine keo — its source was rat nanocapsule microdialysis; 0.45 was ~6x too fast' },
  telmisartan: { keo: 0.1, approximated: true, dropSource: true,
    note: 'Approximation; no published human keo. THE PREVIOUS VALUE WAS VERBATIM AND WRONG THREE WAYS. Its quote is genuine — "the K(eo) were 29.4, 33.8, and 28.7 h(-1)" — but the study is spontaneously hypertensive RATS with tail-cuff blood pressure; THE AUTHORS THEMSELVES REJECTED THAT MODEL, preferring "the proposed indirect response model"; and 29.4 per hour is a 1.4 MINUTE effect delay for a drug whose effect builds over hours to weeks. Demoted, not deleted: an occupancy row needs one.',
    summary: 'telmisartan keo — a rat value from a model its own authors rejected, 1.4 minutes of delay' },
};
for (const [slug, f] of Object.entries(EC_FIXES)) {
  const c = need(slug);
  if (!c.effect_compartment) throw new Error(`${slug} has no effect_compartment`);
  if (c.effect_compartment.keo_per_h === f.keo) { log.push(`${slug} keo — already corrected, skipped`); continue; }
  c.effect_compartment.keo_per_h = f.keo;
  c.effect_compartment.approximated = f.approximated;
  if (f.dropSource) delete c.effect_compartment.source_pmid;
  c.effect_compartment.note = f.note;
  log.push(f.summary);
}

/** fenofibrate models fenofibric acid. The mass, the analyte and the ec50 move together. */
{
  const c = need('fenofibrate');
  if (c.mw_g_mol === 318.75) log.push('fenofibrate analyte — already declared, skipped');
  else {
    c.mw_g_mol = 318.75;
    c.pk_analyte = 'active-metabolite';
    c.pk_analyte_name = 'fenofibric acid';
    log.push('fenofibrate — mw 360.83 -> 318.75, analyte declared as fenofibric acid');
  }
}

/** Corrections to OUR OWN PROSE, where the defect was in the note rather than the data. */
const PROSE_FIXES: { slug: string; find: string; note: string; summary: string }[] = [
  { slug: 'sertraline', find: 'THE keo NOTE MERGED TWO DRUGS',
    note: 'THE keo NOTE MERGED TWO DRUGS. It read "sertraline 69-78% at 4 h", but the cited PET study says "Escitalopram and sertraline showed high occupancies of 69.1-77.9% at 4h" — a COMBINED two-drug range attributed to sertraline alone. The 4 h peak-occupancy timing it anchors is unaffected; the range is not sertraline own.',
    summary: 'sertraline — our keo note attributed a two-drug occupancy range to one drug' },
  { slug: 'naproxen', find: 'THE WARFARIN INTERACTION NOTE MISCREDITS ITS SOURCE',
    note: 'THE WARFARIN INTERACTION NOTE MISCREDITS ITS SOURCE: PMID:2724076 is credited to "Chan 1989" and is in fact Diana, Veronich and Kapoor, J Pharm Sci 1989. The quoted displacement figures, free warfarin 9-24% against 2.5-6%, ARE verbatim and the interaction itself is correctly filed.',
    summary: 'naproxen — the warfarin interaction note names the wrong authors' },
];
for (const f of PROSE_FIXES) {
  const c = need(f.slug);
  if ((c.notes ?? '').includes(f.find)) { log.push(`${f.slug} prose — already corrected, skipped`); continue; }
  note(c, f.note);
  log.push(f.summary);
}

/**
 * pindolol fu_note asserts its 71.4% figure came from "THE ONLY ABSTRACT THAT NAMES A NUMBER".
 * That is false, and the second abstract argues the other way — which matters, because the stored
 * fraction_unbound of 0.6 was retained DESPITE the 71.4% figure rather than because of it.
 */
{
  const c = need('pindolol');
  const FU = 'Retained at 0.6, AND THIS NOTE OWN PREMISE WAS FALSE. An earlier version claimed the 71.4%-bound figure came from the only abstract naming a number. PMID:427002 also names one and disagrees: "Plasma protein binding was 38% and was independent of plasma concentration; the drug was not concentrated in the red cell." A directly measured human value, confirming the label 40% and ruling out saturable binding across the range. Three independent lines now sit under 50% — 38%, the label 40%, and 26-31% in cardiomyopathy — against one outlier at 71.4%.';
  if ((c.fu_note ?? '').startsWith('Retained at 0.6, AND THIS NOTE')) log.push('pindolol fu_note — already corrected, skipped');
  else { c.fu_note = FU; log.push('pindolol — fu_note corrected; it denied the existence of a source that exists'); }
}

/** Records whose PK cannot be represented, or cannot be sourced, and should assert nothing. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  abiraterone: ['uncharacterized',
    'PK REMOVED. ITS CITATION CHARACTERISES THE PRODRUG ITS OWN ABSTRACT CALLS UNDETECTABLE — every quoted parameter, including "The apparent elimination half-life (t1/2) showed a mean of 8.98 +/- 3.92 h", belongs to abiraterone ACETATE. The stored t-half 14 is verbatim nowhere. F 0.1 IS AN INEQUALITY BOUND, "poor oral bioavailability (<10%) and a dramatic positive food effect (5-10-fold)", with a second candidate in the cited abstract itself, an assay limit of "0.1 ng/ml for abiraterone". AND A SCALAR F IS INDEFENSIBLE: fed-versus-fasted AUC is "351.64%" and Cmax "478.45%", and dosing around meals moves exposure "by 57 %, 595 %, and 649 %". V 19000 is the label figure; the only published human volumes are explicitly apparent, "large apparent central (5,620 L) and peripheral (17,400 L) volumes", and pairing an apparent volume with F 0.1 discounted tenfold twice. Absorption is not first-order at all — it needs "an Erlang-type absorption model ... with three-transit compartments". mw 349.51 IS CORRECT and untouched: it is the free base, the circulating species.',
    ['PMID:25204404', 'PMID:31981706', 'PMID:37574850', 'PMID:25344090']],
  carbamazepine: ['uncharacterized',
    'PK REMOVED. THE RECORD ALREADY CONTRADICTED ITSELF: its mechanism string says the drug own elimination rate "rises 2-3x by week 4" while half_life_hr stored the treatment-naive 33 h, so the simulator over-predicted exposure two- to threefold for every patient actually taking it. Three independent disqualifiers, any one sufficient. AUTOINDUCTION, measured in the same subjects with deuterium-labelled drug: "After 17 to 32 days of treatment, the plasma clearance of CBZ-D4 was doubled", and "During multiple dosing, the half-life is decreased to 10-20 hours" from about 35 — no single elimination rate exists. AN ACTIVE METABOLITE: the 10,11-epoxide has "anticonvulsant activity comparable with that of the parent drug" and runs "between 5 and 81%" of parent concentration — no single analyte. AND A FORMULATION-DOMINATED BIOAVAILABILITY spanning about 25% for tablets to essentially complete for solution. The stored t-half 33 was itself verbatim and correctly attributed; that is the point. ka 0.3 was a back-derivation reproducing the same paper own 9.3 h peak. Its three interaction references are untouched.',
    ['PMID:3734137', 'PMID:346287', 'PMID:2344850']],
  desvenlafaxine: ['label-only',
    'PK REMOVED, AND THE REASON IS DELIBERATELY NOT uncharacterized. Desvenlafaxine is thoroughly characterised — in its label and registration dossier. What is missing is INDEXING: every candidate abstract reports ratios, percentage changes or subgroup contrasts and no absolute parameter. Its source_pmid was a NARRATIVE REVIEW, which is a contract violation independent of the numbers, and that review states only "t((1/2)) values of 9 to 15 hours" — the stored 11 is neither endpoint nor the midpoint 12 — and "reaches T(max) in 7 to 8 hours", from which the stored ka 0.25 was back-derived, since it solves to a 7.37 h peak. V 250 and F 0.8 are label figures. NO TRANSPLANT WITH VENLAFAXINE: the two records were compared field by field from both sides and share no value. This is the first use of the label-only reason, added for exactly this shape; tagging it uncharacterized would tell a future reader something false about the drug.',
    ['PMID:29228473', 'PMID:23623756']],
};
for (const [slug, [reason, why, refs]] of Object.entries(UNAUTHORED)) {
  const c = need(slug);
  if (c.pk_unauthored) { log.push(`${slug} — already unauthored, skipped`); continue; }
  delete c.pk; delete c.half_life_hr;
  c.pk_unauthored = { reason, note: why.length > 500 ? why.slice(0, 497) + '...' : why };
  if (why.length > 500) note(c, why);
  addRefs(c, ...refs);
  log.push(`${slug} — PK stripped, pk_unauthored: ${reason}`);
}

/** Notes on records whose numbers were checked and survive. Saying so is a finding. */
const NOTE_ONLY: { slug: string; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'vortioxetine', refs: ['PMID:22448783'],
    note: 'PK: THE CLEANEST RECORD IN THIS BATCH, AND MY PRIOR ABOUT IT WAS WRONG. I flagged its half-life as "long (~66 h)"; the record stores 57 and its citation says 57 verbatim — "a mean elimination half-life of 57 hr" — while 66 h is the REVIEW value and 65.8 h the population estimate. All three are defensible and the stored one matches its own source exactly. F 0.75 is likewise verbatim, "The absolute bioavailability was 75%", from an intravenous-plus-oral study in 97 volunteers. NO CHANGE. Two values remain unsourced and are declared: V 2600 L appears in no abstract, and the one published figure, 1.97e3 L, is a CENTRAL compartment volume rather than a one-compartment analogue, so swapping it in would be worse; ka 0.5 is uncited but is NOT a back-derivation, implying a 7.6 h peak that sits inside the observed late-Tmax window rather than on a round number. The analyte question closes cleanly: "The major metabolite is pharmacologically inactive".',
    summary: 'vortioxetine — verified unchanged; my "~66 h" prior was the review value, not the record' },
  { slug: 'apremilast', refs: ['PMID:21859393'],
    note: 'PK: EVERY NUMBER IS UNSOURCED AND EVERY NUMBER IS RIGHT, which is worth recording as carefully as a defect. A search for an apremilast volume of distribution returns COUNT 0, and the only published 73% sits in the introduction of a RAT formulation study restating the label, which would launder a label figure through a rodent paper and is deliberately not cited. But the stored triple reproduces real human exposure: {V 87, F 0.73, t-half 8} imply CL/F 10.33 L/h against a verbatim "Mean C(max), AUC(0-inf) and t(max) values for apremilast in plasma were 333 ng/mL, 1970 ng*h/mL and 1.5 h" after 20 mg, which is 10.15 L/h. A 1.7% agreement. The half-life is the LOWER bound of a printed "8-9 h" and no better point value exists. The analyte question closes cleanly, as predicted: "The major metabolites were at least 50-fold less pharmacologically active than apremilast", so the parent is right.',
    summary: 'apremilast — label-grade numbers validated to 1.7% against a verbatim human AUC' },
  { slug: 'baricitinib', refs: ['PMID:24965573'],
    note: 'PK: ZERO OF FOUR FIELDS ARE SUPPORTED ANYWHERE IN PUBMED, and no fix is available. Four separate searches — absolute bioavailability, volume of distribution, elimination half-life, absorption rate constant — return COUNT 0 or nothing usable, and the cited paper, which is a genuine healthy-volunteer PK/PD study, states none of ka 1.4, V 76, F 0.79 or t-half 12. What it does state exposes a CLASS 12 DEFECT: the stored set implies CL/F 5.56 L/h against that paper own "low oral-dose clearance (17 L/h)", a 3.06-fold disagreement, so this record OVER-PREDICTS BARICITINIB EXPOSURE ABOUT THREEFOLD. The cause is that 76 L is a volume from a bi-exponential fit — the abstract says concentrations "decline in a bi-exponential fashion" — paired with that fit terminal half-life and fed to a one-compartment solver. Reproducing 17 L/h at 12 h would need V/F 294 L, which is verbatim nowhere. The label triple is kept, its false provenance is stripped, and the error is logged rather than closed with an invented number. A 99.42 L volume in the literature is n=1, critically ill and on haemofiltration.',
    summary: 'baricitinib — nothing is sourceable and it over-predicts exposure 3x; logged, not patched' },
];
for (const f of NOTE_ONLY) {
  const c = need(f.slug);
  if ((c.notes ?? '').includes(f.note.slice(0, 60))) { log.push(`${f.slug} — already noted, skipped`); continue; }
  if (f.refs?.length) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary);
}

/** baricitinib PK row provenance: its source_pmid supports none of the four values it carries. */
{
  const c = need('baricitinib');
  const po = c.pk?.PO;
  if (po && po.source_pmid === 'PMID:24965573') {
    delete po.source_pmid;
    po.source_label = 'Olumiant (baricitinib) prescribing information — V, F, ka and half-life are label-grade. No PubMed abstract states any of them, and the previously cited study states none of them either; it remains in refs[] for the clearance and Tmax it does report.';
    log.push('baricitinib — PK row moved off a citation that supports none of its values');
  } else log.push('baricitinib provenance — already corrected, skipped');
}

console.log(`${log.length} change(s):\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run. Pass --write to apply.');
