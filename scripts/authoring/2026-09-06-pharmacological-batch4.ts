/**
 * 2026-09-06-pharmacological-batch4.ts
 *
 * Fourth batch of the pharmacological category: 40 compounds, eight agents.
 * Two groups had to be re-dispatched after hitting a session rate limit.
 *
 * ── The finding that changes how the taxonomy is applied ─────────────────
 * TWO CLAIMS IN THIS BATCH REVERSED ON INSPECTION, and both are recorded because
 * a class rule applied without checking is how a wrong value gets written
 * confidently.
 *   • tacrine's V 349 L beside F 0.17 reads as the standard apparent-volume
 *     double-division. It is not: that volume was derived from an INTRAVENOUS
 *     dose, so it is a true V and the pairing is correct. The defect is that OUR
 *     OWN source_label calls it "apparent" — an annotation that would license a
 *     future editor to break a correct record. First case where the error is in
 *     the registry's prose rather than its numbers.
 *   • I told the group-7 agent that sorafenib, tofacitinib AND riociguat all lack
 *     an IV formulation and so all need F pinned to 1. Riociguat has a real IV arm
 *     and a measured 94% absolute bioavailability. The generalisation was right
 *     twice and wrong once.
 * Also confirmed pre-emptively: oxcarbazepine and phenytoin share mw 252.27
 * because they are constitutional isomers (both C15H12N2O2). Correct, not a
 * template collision — recorded so it is never "fixed".
 *
 * ── The bisphosphonate class rule was tested and held, 4 of 4 ────────────
 * risedronate repeats the sampling-truncation failure (72 h serum window against
 * a stored 480 h half-life, and 480 is ALSO its stored volume — one unsourced
 * numeral in two slots). zoledronate fails differently: its 39 h is verbatim but
 * is the THIRD of FOUR phases, between 1.4 h and 4526 h.
 *
 * ── New collision shapes ────────────────────────────────────────────────
 * A CROSS-ENANTIOMER AVERAGE (mepivacaine V 80 = mean of R 103 and S 57, from a
 * paper whose conclusion is that the enantiomers differ markedly). A RELATIVE
 * bioavailability read as absolute (clindamycin 0.9). A DOSE read as a
 * bioavailability (sorafenib 0.4 from "400 mg"). And four separate cross-dose
 * averages inside one nalbuphine record.
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
  { slug: 'orphenadrine', guard: (c) => c.pk?.PO?.V_L === 400,
    pk: { PO: { source_pmid: 'PMID:7056281' } }, hl: { PO: 20.1 },
    note: 'PK: the intravenous row hung on an ORAL-ONLY study of five subjects and one tablet, so F 0.9 was not merely unsourced but unmeasurable from it; that route is removed, as is the intramuscular one, which has no parameters and no citation anywhere. The stored 16.5 h was the MIDPOINT of a stated "The elimination half-life ranged from 13.2-20.1h". THE UPPER ENDPOINT IS STORED DELIBERATELY, against this batch usual lower-endpoint convention, because the same paper shows the kinetics are NON-STATIONARY: "The elimination half-lives after discontinuation of treatment showed a 2 to 3-fold increase over the single dose values", attributed to product inhibition by its own N-demethyl metabolite. Any single-dose value is therefore too short for a chronically dosed subject, and the lower endpoint would be the least representative. V 400 L is unsourced; logged for future readers, 400 appears in this literature as a DOSE in mg, from a paediatric ingestion.',
    summary: 'orphenadrine — half-life was a range midpoint; IV row had no arm; kinetics are non-stationary' },

  { slug: 'methylene-blue', guard: (c) => c.pk?.PO?.F === 0.7,
    pk: { PO: { F: 0.066, source_pmid: 'PMID:10952480' }, IV: { F: 1, source_pmid: 'PMID:10952480' } },
    hl: { PO: 5.25, IV: 5.25 },
    note: 'PK: F 0.7 IS REFUTED BY ITS OWN CITED ABSTRACT. That study dosed 100 mg by both routes and reports "the area under the concentration-time curve was much lower (9 nmol/min/ml vs 137 nmol/min/ml)", which is a bioavailability near 0.066 — an order of magnitude below the stored value, computable from the paper own two numbers. That ratio is now stored and flagged as derived rather than quoted, because deleting it would leave the resolver default overstating oral exposure more than tenfold. No better figure exists: the literature is self-contradictory, giving 6.6% for immediate release against a stated "F(abs)=139.19 +/- 52.00%" for a delayed-release tablet, and a bioavailability of 139% is physically impossible. The half-life of 5.25 h is verbatim but is a WHOLE-BLOOD, multiphasic, explicitly "estimated" value for the intravenous route; the oral terminal slope is absorption-limited at 6-27 h. V 250 L is dropped as a MATRIX ARTEFACT — the reference matrix is whole blood and the drug partitions heavily into tissue. ka 0.15 is the wrong model, not merely uncited: the oral product is delayed-release with a median time to peak of 12-16 h and saturable, food-dependent absorption.',
    summary: 'methylene-blue — F 0.7 refuted by its own abstract arithmetic (0.066); V is a matrix artefact' },

  { slug: 'lansoprazole', guard: (c) => c.pk?.PO?.V_L === 18,
    pk: { PO: { F: 0.91, source_pmid: 'PMID:8803522' } }, hl: { PO: 2.24 },
    refs: ['PMID:8803522', 'PMID:24683233', 'PMID:15301728'],
    note: 'PK: F 0.85 was a CROSS-DOSE AVERAGE of a stated "the absolute bioavailability was 91% for the 30-mg and 81% for the 15-mg enteric-coated formulation"; the 30 mg value is stored and is dose-specific. Half-life corrected to 2.24 h. V 18 L IS ITS OWN STUDY SUBJECT COUNT — nine homozygous extensive metabolisers plus nine poor metabolisers — and the identical pair (ka 1.5, V 18) sits on CEPHALEXIN, a beta-lactam sharing no chemistry, no mass and no clearance route, so the seed almost certainly originated here and was copied. THE STORED HALF-LIFE WAS ALSO A GENOTYPE SUBGROUP: 1.96 h in extensive against 4.21 h in poor metabolisers, with 3.4-fold exposure and 4.6-fold clearance differences. EFFECT IS DECOUPLED ABOUT TENFOLD, stated in one sentence of one study: "the t1/2z values of lansoprazole and the 2 metabolites were ~2 to 2.5 hours, while the acid-inhibitory effect lasted >24 hours". ka 1.5 dropped; absorption is enteric-coat lagged, and no numeric lag exists for this drug, so the omeprazole figure must not be borrowed.',
    summary: 'lansoprazole — V 18 L was its own SUBJECT COUNT, and is shared with cephalexin' },

  { slug: 'clindamycin', guard: (c) => c.pk?.PO?.V_L === 75,
    pk: { PO: { V_L: 55.3, F: 0.53, source_pmid: 'PMID:8517703' }, IV: { V_L: 55.3, F: 1, source_pmid: 'PMID:8517703' }, IM: { V_L: 55.3, F: 1, source_pmid: 'PMID:16756056' } },
    hl: { PO: 2.3, IV: 2.3, IM: 2.3 }, refs: ['PMID:8517703'],
    note: 'PK: F 0.9 WAS A RELATIVE BIOAVAILABILITY READ AS AN ABSOLUTE ONE — "Mean relative bioavailability (point estimate) was 93% for AUC and 91% for Cmax", a comparison between two ORAL products. A new shape for the taxonomy. The only verified absolute figure in healthy humans is 0.53 (PMID:8517703), from the one study giving both an intravenous infusion and oral capsules in crossover; that paper also supplies a true steady-state volume of 0.79 L/kg. Its 0.75 belongs to the AIDS subgroup and is not stored. The intravenous row previously hung on a study with no intravenous arm at all. Half-life corrected 3 -> 2.3 h and shared across routes, which is legitimate here because absorption is not rate-limiting. PRODRUG CAVEAT: the intramuscular citation used clindamycin PHOSPHATE, an ester, so its absorption phase is hydrolysis-limited appearance of active drug rather than membrane transfer. The transdermal route is removed — it had no parameters and no citation, and the nearest published non-parenteral data are intravaginal at about 4% systemic.',
    summary: 'clindamycin — F 0.9 was a RELATIVE bioavailability between two oral products' },

  { slug: 'azithromycin', guard: (c) => c.pk?.PO?.V_L === 2200,
    pk: { PO: { V_L: 2331, F: 0.37, source_pmid: 'PMID:2154441' }, IV: { V_L: 2331, F: 1, source_pmid: 'PMID:8913468' } },
    hl: { PO: 69, IV: 69 }, refs: ['PMID:2154441', 'PMID:8913468'],
    note: 'PK: the intravenous row carried the ORAL study half-life. THE 41 h IS A SAMPLING-WINDOW ARTEFACT, not a route difference: that study sampled to 120 h, while a 240-h study recovers 69 h, which is now stored for both routes. F corrected 0.38 to the stated 37%. V 2331 L is 33.3 L/kg, and it is REAL BUT NOT A DISTRIBUTION SPACE — its own source explains that "the long half-life of azithromycin is due to extensive uptake and slow release of the drug from tissues rather than an inability to clear the drug". Tissue half-lives run 2.3 to 3.2 DAYS against a serum peak of 0.4 mg/L, so a serum-referenced volume for a drug that sits almost entirely outside serum is arithmetically correct and physiologically empty. EFFECT IS INTRACELLULAR AND DECOUPLED: efficacy is argued from tissue concentrations exceeding the minimum inhibitory concentration, not from serum. ka 0.5 dropped; oral input is degradation-competing rather than simply first-order.',
    summary: 'azithromycin — the 41 h half-life is a 120-hour SAMPLING WINDOW artefact; true value 69 h' },

  { slug: 'cephalexin', guard: (c) => c.pk?.PO?.V_L === 18,
    pk: { PO: { source_pmid: 'PMID:900915' } }, hl: { PO: 0.8 }, refs: ['PMID:900915'],
    note: 'PK: its source_pmid was a SYSTEMATIC REVIEW — secondary literature used as both the source and the only reference, reporting no pharmacokinetic parameter of its own. All four values were zero-content, and its ka 1.5 and V 18 L are byte-identical to LANSOPRAZOLE, an unrelated benzimidazole; since that record 18 is independently explained as its own subject count, the seed came from there. Half-life re-sourced to 0.80 h. NO HUMAN VOLUME AND NO ABSOLUTE BIOAVAILABILITY EXIST in any abstract — the only volumes found are in calves and cats. ABSORPTION IS CARRIER-MEDIATED THROUGH PEPT1 AND SATURABLE, so a constant rate is structurally wrong: a co-administered drug shifts exposure by 38%. TWO TRAPS LOGGED on the replacement paper. It lists cefaclor FIRST and cephalexin SECOND in every pair ("0.58 ... and 0.80 ... h"), so reading position one gives the wrong drug half-life; and its "0.88 h-1" is an ELIMINATION constant that must never migrate into an absorption slot.',
    summary: 'cephalexin — its source was a systematic review; its ka and V are copied from lansoprazole' },

  { slug: 'flecainide', guard: (c) => c.pk?.PO?.V_L === 350,
    pk: { PO: { V_L: 525, F: 0.81, source_pmid: 'PMID:2115446' } }, hl: { PO: 9.5 },
    refs: ['PMID:3141098', 'PMID:12189358'],
    note: 'PK: F 0.81 is verbatim AND is the correct member of a stated triplet — "The mean absolute bioavailability was 98%, 78% and 81% for the rectal and oral solutions and the tablet" — the tablet value, correctly chosen. The cleanest sourcing in its group. V 350 L was 5.0 L/kg scaled to 70 kg, a round template that UNDERSTATES the measured intravenous volume of 7.5 L/kg by a third; half-life 14 h came from a review and the primary gives 9.5 h. ka 0.7 appears in no flecainide abstract; two candidate origins are logged as hypotheses rather than findings — it is either the RECTAL time to peak (0.67 h) from its own paper, or DIGOXIN literature absorption rate, digoxin being the other compound in the same audit group. UNUSUALLY GOOD NEWS: CYP2D6 does not matter here — "The CYP2D6 polymorphism did not appear to influence flecainide disposition kinetics or electrocardiographic effects at steady state" — so a scalar bioavailability IS defensible for this drug, unlike most of its class.',
    summary: 'flecainide — F verbatim and correctly chosen from a triplet; V understated by a third' },

  { slug: 'mexiletine', guard: (c) => c.pk?.PO?.V_L === 400,
    pk: { PO: { ka_hr: 3.1, V_L: 385, F: 0.873, source_pmid: 'PMID:7226704' } }, hl: { PO: 6.34 },
    refs: ['PMID:7226704', 'PMID:7151850'],
    note: 'PK: ka 1.5 IS A TIME TO PEAK — "The corresponding peak times were 4.68 +/- 2.04 h and 1.46 +/- 0.17 h" — so the stored value is wrong by about a factor of two AND carries the wrong units. It is replaced by a genuine published population value of 3.1 /h. V 400 L was the MIDPOINT of an APPARENT range, 5.0 to 6.6 L/kg, taken from a review filed under FLECAINIDE references rather than this record — two defects compounding, a midpoint and an apparent volume paired with an independent bioavailability. Re-sourced to one study that restricted its analysis to the intravenous data, giving a true volume of 5.5 L/kg, a half-life of 6.34 h and a bioavailability of 87.3%. THE STORED 17 h WAS THE PRE-TREATMENT CONTROL ARM OF A PHENYTOIN INDUCTION STUDY and is an outlier against 6.34, 9-11, 10, 11.3 and 11.75 h elsewhere. TRAP LOGGED: the paper supplying the absorption rate also reports a 5.3 L/kg volume that is apparent; take the rate, never that volume. Absorption is measurably slowed by acute myocardial infarction.',
    summary: 'mexiletine — ka was a Tmax; V was a midpoint of an apparent range from another drug refs' },

  { slug: 'propafenone', guard: (c) => c.pk?.PO?.F === 0.1,
    pk: { PO: { V_L: 252, F: 0.155, source_pmid: 'PMID:2379537' } }, hl: { PO: 5.5 },
    refs: ['PMID:3829342', 'PMID:6744775'],
    note: 'PK: F 0.1 appears in NO propafenone abstract. Three candidate origins are logged as hypotheses: a FOLD-CHANGE ("a 10-fold increase in drug concentration"), a PATIENT COUNT ("in 10 subjects"), or — most interesting — DIPRAFENONE, a different drug whose paper reports "bioavailability from 10.9 ... to 32.5%". A SCALAR BIOAVAILABILITY IS NOT DEFENSIBLE HERE AT ALL: first-pass is saturable, a threefold dose rise producing a tenfold concentration rise, and oral clearance splits 4.2-fold by CYP2D6 phenotype. The measured absolute value of 15.5% is stored with that caveat. The stored 6 h half-life is an EXTENSIVE-METABOLISER value in all but name — poor metabolisers are 17.2 h, a threefold split — and 5.5 h is now stored from the genotyped study. V 252 L is the same number the record had, re-sourced to the paper that actually states it as an intravenous-derived steady-state volume. ACTIVE METABOLITE MAKES PARENT-ONLY KINETICS ROUTE-DEPENDENT: 5-hydroxypropafenone is present in nine of ten extensive metabolisers and neither poor metaboliser.',
    summary: 'propafenone — F 0.1 is in no abstract; possibly from DIPRAFENONE, a different drug' },

  { slug: 'dofetilide', guard: (c) => c.pk?.PO?.V_L === 250,
    pk: { PO: { V_L: 245, F: 0.92, source_pmid: 'PMID:1958435' } }, hl: { PO: 8 },
    refs: ['PMID:1958435', 'PMID:10971309'],
    note: 'PK: F 0.92 is verbatim and stands. The volume and half-life are re-sourced to PMID:1958435, which gives "clearance (23 l h-1), terminal elimination half-life (8 h) and volume of distribution (245 l)" in one sentence from one intravenous cohort — the stored 10 h was the upper endpoint of a review range, and the stored set was internally inconsistent, its own clearance and half-life implying 353 L rather than 250. ka 1.5 appears in no dofetilide abstract and is byte-identical to the value MEXILETINE carried, from an unrelated paper that also states no rate. THE EFFECT COMPARTMENT IS REMOVED, and the reason is subtle enough to record: its value verified perfectly — right quote, right arithmetic, species correctly named as beagle dog — but it was measured under INTRAVENOUS infusion, and in humans on the ORAL route the same relationship is direct: "a counterclockwise hysteresis loop ... was observed after intravenous infusions in all subjects, whereas direct linear relationships were observed after oral administrations in eight of 10 subjects", with peak effect coinciding with peak concentration. This record is oral-only, so a dog intravenous value imposed a delay the human oral data says is not there. Its stated precision was also 11 plus or minus 8 minutes, a sixfold band stored as a point.',
    summary: 'dofetilide — a correctly species-labelled keo removed: human ORAL data show no hysteresis' },

  { slug: 'digoxin', guard: (c) => c.pk?.PO?.ka_hr === 5.84,
    pk: { PO: { ka_hr: 2.72, V_L: 382, F: 0.685, source_pmid: 'PMID:6832200' }, IV: { V_L: 382, F: 1, source_pmid: 'PMID:358815' } },
    hl: { PO: 27.9, IV: 27.9 }, refs: ['PMID:6832200', 'PMID:358815', 'PMID:458556'],
    note: 'PK: both flagged values failed, and this is a NARROW-THERAPEUTIC-INDEX drug so the errors matter more than usual. ka 5.84 implies a SEVEN-MINUTE absorption half-life, appears in no abstract, and looks back-fitted to reproduce an observed 1 h time to peak given a 40 h half-life; the measured value is 2.72 /h with a 0.16 h lag, from a stable-label study that also gives the absolute bioavailability of 68.5%. V 490 L was the textbook 7.0 L/kg scaled to 70 kg while its cited source says only "a large volume of distribution" qualitatively; the measured 5.46 L/kg is 382 L, so the stored figure OVERSTATED A LOADING DOSE BY ABOUT 28%. The 40 h half-life is stated nowhere either — the review says "between 26 and 45 hours" and 40 is not the midpoint. F 0.7 was a range lower endpoint AND the wrong quantity, describing absorption rather than systemic availability. HALF-LIFE AND VOLUME MUST TRAVEL TOGETHER: 27.9 h pairs with 5.46 L/kg, while the 42 h in the literature pairs with a roughly 13 L/kg terminal volume; grafting one onto the other would misstate clearance by about half. The effect-compartment value verifies and is human, but its endpoint is RATE CONTROL in atrial fibrillation rather than inotropy, and effect tracks the deep peripheral compartment rather than plasma.',
    summary: 'digoxin — ka implied a 7-minute absorption half-life; V overstated a loading dose by ~28%' },

  { slug: 'rizatriptan', guard: (c) => c.pk?.PO?.V_L === 110,
    pk: { PO: { V_L: 140, F: 0.47, source_pmid: 'PMID:10611145' } }, hl: { PO: 1.8 },
    refs: ['PMID:8991488'],
    note: 'PK: F 0.47 is verbatim and stands. ka 2 duplicates the record own stored half-life AND is arithmetically refuted — with the published time to peak of 1.6 h the implied absorption rate is about 0.95 /h, so the stored value is roughly twice too fast. V 110 L appears in no abstract; the primary gives a steady-state volume of 140 L alongside a 1.8 h half-life in one sentence. A sex-stratified origin for 110 is plausible but unverified and is therefore recorded as a hypothesis only, not acted on. EFFECT DECOUPLING WORTH NOTING: the plasma curve is essentially cleared by 8-10 h while 24-hour sustained pain freedom is the standard registration endpoint, and no published effect-compartment value exists for this drug, so none is stored.',
    summary: 'rizatriptan — ka duplicated its own half-life and is 2x too fast against the stated Tmax' },

  { slug: 'zolmitriptan', guard: (c) => c.pk?.PO?.V_L === 490,
    pk: { PO: { V_L: 122, F: 0.49, source_pmid: 'PMID:9205817' } }, hl: { PO: 2.3 },
    refs: ['PMID:9205817', 'PMID:10357516'],
    note: 'PK: THE RECORD SELF-DOCUMENTED ITS OWN COLLISION. Its source_label read "Tmax ~1.5 h (tablet)" while ka_hr was 1.5, and the same label said "apparent Vd" while the row paired it with an independent bioavailability — a double-division disclosed in the record own text. V 490 L is also byte-identical to DIGOXIN stored volume, and is about four times the only intravenous determination: the primary gives "8.7 +/- 1.7 ml min-1 kg-1, 122 ... and 2.30 +/- 0.59 h" after intravenous dosing, and an independent population fit agrees at 136 L. F corrected 0.4 to the stated 0.49. THE EFFECT-COMPARTMENT VALUE IS REMOVED AND BOTH ITS REFERENCES ARE THE WRONG DRUG — one is an eletriptan binding study in cultured cells, the other never mentions zolmitriptan at all. That second paper contains "the time to reach equilibrium was approximately 2 h", a rat-brain-homogenate binding equilibration, which is a plausible origin for the stored 2 /h and is exactly the shape of a pharmacodynamic quantity read as a kinetic one. ANALYTE: all values describe the parent, while the active N-desmethyl metabolite is more potent and its exposure differs by route and age.',
    summary: 'zolmitriptan — its own label text documented both the Tmax collision and the apparent volume' },

  { slug: 'ondansetron', guard: (c) => c.pk?.PO?.V_L === 160,
    pk: { PO: { ka_hr: 1.05, V_L: 127, F: 0.71, source_pmid: 'PMID:8140047' }, IV: { V_L: 127, F: 1, source_pmid: 'PMID:1531044' } },
    hl: { PO: 3.4, IV: 3.4 }, refs: ['PMID:1531044', 'PMID:31378962'],
    note: 'PK: F corrected 0.65 to the stated 71% for the oral solution; the stored value matched neither that nor the 58% rectal figure in the same sentence, though it is close to their average. This record supplies ONE OF THE FEW GENUINE PUBLISHED ABSORPTION RATES in the whole audit: "Mean absorption half-lives were 0.66, 1.1, and 0.75 hr after the oral, colonic, and rectal administrations", giving 1.05 /h orally — the stored 2 /h was about twice that and equals the drug time to peak. V 160 L appears in no abstract; 127 L is 1.81 L/kg measured at steady state after intravenous dosing. THE EFFECT-COMPARTMENT VALUE IS REMOVED BECAUSE IT CONTRADICTS THE PUBLISHED MODEL STRUCTURE, not merely because it is unsourced: the definitive analysis fits "a linear concentration-response model", which is direct and undelayed by construction. The record own note already said no such value exists; that claim now has positive evidence. A PREVIOUS FIX WAS INCOMPLETE — the fabricated palonosetron citation the note says was removed is still in the reference list, and is removed here. The intramuscular route is dropped as declared but unparameterised.',
    summary: 'ondansetron — gains a real published ka; its keo contradicted a published DIRECT model' },

  { slug: 'prochlorperazine', guard: (c) => c.pk?.PO?.V_L === 1240,
    pk: { PO: { V_L: 900, F: 0.147, source_pmid: 'PMID:1553856' }, IV: { V_L: 900, F: 1, source_pmid: 'PMID:1768559' } },
    hl: { PO: 8, IV: 9 }, refs: ['PMID:1768559', 'PMID:1553856'],
    note: 'PK: its source was an INTRAVENOUS-ONLY oncology study in 13 patients on concurrent doxorubicin, so it could not yield an oral bioavailability on any grounds — and the stored F of 0.13 matches that COHORT SIZE, the patient-count collision shape. V 1240 L is untraceable; that paper states 2254 L per square metre, about 3900 L, while the healthy-volunteer study gives 12.9 L/kg after intravenous dosing. The stored 7 h corresponds to NO MEASURED PHASE — the sources give 9 h intravenously, 8 h orally, 18 h at steady state and a 21.9 h terminal phase — so the two routes now carry their own measured values. F 0.147 is the only verbatim primary bioavailability that exists and it comes from six elderly women, which is recorded rather than hidden; it is stored because deleting it would leave the resolver default overstating oral exposure sixfold. DOCUMENTED HYSTERESIS WITH NO EFFECT COMPARTMENT: "maximal drug effects occurred 2-4 h after peak plasma drug concentrations". No equilibration value is derived from that range. The rectal route is removed as having zero support anywhere.',
    summary: 'prochlorperazine — F 0.13 matched its study COHORT SIZE; 7 h matched no measured phase' },

  { slug: 'lisinopril', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.25, source_pmid: 'PMID:2844083' } }, hl: { PO: 12.6 },
    refs: ['PMID:2547465', 'PMID:3014110'],
    note: 'PK: F 0.25 is right but was cited to the WRONG PMID — it is verbatim in this record own other reference, "has an oral bioavailability of 25 percent +/- 4 percent, which is unaffected by food", and independently corroborated at 26-27%. THE HALF-LIFE IS NEITHER DISPOSITION NOR SIMPLY WRONG: the primary states "The half-life for the terminal phase (approximately 40 h) was NOT PREDICTIVE of steady-state parameters ... The mean effective half-life for accumulation was 12.6 h", and attributes that terminal phase to binding to the target enzyme. So 12.6 h is the dosing-relevant value and the 40 h is a SATURABLE ACE-BINDING artefact rather than elimination — a distinction that matters because storing the binding phase would make a model predict accumulation that does not occur. ka 0.5 is quantitatively impossible: absorption is carrier-mediated with a time to peak of 6-8 h, and the only published rate is 0.075 /h, nearly sevenfold smaller. V 30 L is dropped; the only candidate is an apparent volume from a paediatric oral-only fit and would double-divide by F.',
    summary: 'lisinopril — its long terminal phase is ACE BINDING, not elimination; ka is 7x off' },

  { slug: 'ramipril', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.15, source_pmid: 'PMID:7768254' } }, hl: { PO: 1.9 },
    refs: ['PMID:7768254', 'PMID:2533075'],
    note: 'PK: WRONG ANALYTE ON THE PARENT MASS. The stored molecular weight of 416.51 is the ETHYL ESTER; the active diacid ramiprilat is 388.46, an ester factor of 1.072. The stored 14 h was the DIACID accumulation value while the ester own half-life is about 1.9 h. F 0.55 was a RANGE MIDPOINT — "the bioavailability of oral ramipril seems to be in the range of 44-66%", and 44 plus 66 halved is 55 — while the same abstract gives both analyte-specific measurements: "The absolute bioavailability as judged by ramipril plasma AUC was 15%, by ramiprilat plasma AUC, 44%". For a record carrying the ester mass, 15% is the correct figure and is stored. THE LONG PUBLISHED HALF-LIVES ARE SATURABLE ENZYME BINDING: "The subsequent long terminal phase at low plasma ramiprilat concentrations represented slow dissociation of the ACE-inhibitor complex", and investigators computed exposure "excluding the component for saturable binding" to obtain usable kinetics. Effect inhibition declines with a half-life near 75 h, which is an EFFECT half-life and not storable as elimination. ka and V dropped as unsourced.',
    summary: 'ramipril — parent-ester mass carrying the diacid half-life; F 0.55 was a range midpoint' },

  { slug: 'trandolapril', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.11, source_pmid: 'PMID:7527100', source_label: 'Review (PMID:10464907): bioavailability among ACE inhibitors ranges "from 11% (trandolapril)". No primary abstract states an absolute F for the parent ester; 11% is review-grade and is stored only because deleting it would leave the resolver default overstating oral exposure roughly eightfold.' } },
    hl: { PO: 0.72 }, refs: ['PMID:8480624'],
    note: 'PK: A THIRTY-THREE-FOLD ERROR WITH THE CORRECT NUMBER SITTING IN THE RECORD OWN CITATION. The stored 24 h is the ACTIVE DIACID accumulation half-life, taken from a review, while the cited paper states plainly "Trandolapril is rapidly absorbed, with a single elimination half-life (t1/2) of 0.72 h, irrespective of dose" — for trandolapril itself, the molecule the stored mass of 430.54 names. Trandolaprilat is 402.49, an ester factor of 1.070. The same paper explains the class behaviour: exposure to the diacid "increased with increasing doses but in a nonlinear fashion, probably owing to saturable plasma ACE binding", becoming linear only at the highest doses where the enzyme sink saturates — so any long half-life read from low-dose data is a binding phase. Effect persists far beyond the curve: significant blood-pressure reduction lasts 48 h after the last dose and residual enzyme inhibition is near 60% at 24 h. ka 2.5 and V 18 L dropped as unsourced.',
    summary: 'trandolapril — stored 24 h is the metabolite; its own citation states 0.72 h for the parent' },

  { slug: 'ivabradine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.4, source_pmid: 'PMID:26910057', source_label: 'F ~40% is a secondary/label figure; no primary abstract states an absolute bioavailability for ivabradine. Retained under label provenance rather than deleted, since the resolver default would overstate exposure about twofold.' } },
    hl: { PO: 6 }, refs: ['PMID:26910057', 'PMID:26265098', 'PMID:9728900'],
    note: 'PK: all four values were zero-content on a ST JOHN’S WORT INTERACTION STUDY that reports only peak concentration and exposure, with the half-life given as a direction and no number. The stored ka of 1.4 may collide with that paper "for 14 days" dosing duration, logged as a hypothesis. The 6 h half-life exists only in a systematic review and is retained on that footing. ABSORPTION IS MIXED ZERO- AND FIRST-ORDER, so a single rate constant is structurally wrong: the population model is "a 2-compartment model with mixed 0- and first-order absorption, linked to a 2-compartment model for S18982". THE ACTIVE METABOLITE SPLITS THE EFFECT IN TIME, which no single-analyte model can represent: "the metabolite is responsible for the initial bradycardic effect, whereas the parent compound is responsible for the duration of action". V 100 L dropped as unsourced.',
    summary: 'ivabradine — zero-content on a St John’s wort study; effect is split across two analytes' },

  { slug: 'felodipine', guard: (c) => c.pk?.PO?.V_L === 700,
    pk: { PO: { V_L: 679, F: 0.16, source_pmid: 'PMID:4017422' } }, hl: { PO: 10.2 },
    refs: ['PMID:1577050', 'PMID:2404502'],
    note: 'PK: the half-life of 10.2 h is verbatim and IS a genuine disposition value, being the terminal phase of a three-phase fit anchored by intravenous dosing. V corrected 700 to 679, the stated 9.7 L/kg scaled to 70 kg, and F corrected 0.15 to the cited paper own 16%. IMPORTANT NON-DEFECT, RECORDED SO IT IS NOT LATER "FIXED": this volume is INTRAVENOUS-DERIVED, so pairing it with an independent bioavailability is correct and is not the apparent-volume double-division it superficially resembles. ka 1 collides with a stated time to peak of 64 minutes. FORMULATION MISMATCH REMAINS: the cited study used an oral SOLUTION plus an intravenous arm, while the marketed product is extended-release with near zero-order erosion, so this parameter set fits neither form exactly — too slow for a solution, far too fast for the tablet. Bioavailability is not a constant for this drug in any case: grapefruit juice raises it from 15% to 45%. The record only reference was a RAT formulation study and is replaced.',
    summary: 'felodipine — V and F corrected to its own paper figures; the V/F pairing is legitimate here' },

  { slug: 'buprenorphine', guard: (c) => c.pk?.TD?.lag_hr != null,
    pk: { SL: { F: 0.29, source_pmid: 'PMID:9048270' }, IV: { F: 1, source_pmid: 'PMID:9048270' }, TD: { zo_dur_hr: 168, F: 0.14, source_pmid: 'PMID:26865472' } },
    hl: { SL: 42, IV: 42, TD: 42 }, refs: ['PMID:9048270', 'PMID:9684393', 'PMID:26865472'],
    note: 'PK: THE 17-HOUR TRANSDERMAL LAG IS THE CLONIDINE DEFECT REPEATING and is deleted. It appears in no buprenorphine transdermal abstract, and the published structural model says the opposite: "The final transdermal absorption model employed a zero-order input rate ... BUCCAL absorption was a first-order process with a time lag" — the lag belongs to a different route. The only use of the word for the patch is pharmacodynamic, "a long lag period for DOSE STABILISATION". The rest of the patch parameterisation is kept: 168 h is the stated wear interval and the input genuinely is zero-order, declining over the wear and stopping at removal. The stored 30 and 38.1 h half-lives were both unsourced, and the split was real in kind but for the wrong reason — terminal half-life IS route-dependent here because of an oral-mucosal depot and patch-limited input, so one disposition value of 42 h is now shared and the route effects left to the input model. SUBLINGUAL LOSS IS LARGE AND MEASURED: "Buprenorphine recovered from saliva ... was, on average, 52% to 55% of dose", causing "an almost twofold overestimation of bioavailability". No human volume exists in any abstract. A reference with NO ABSTRACT AT ALL is removed. THE EFFECT-COMPARTMENT VALUE IS KEPT BUT FLAGGED INCOMPLETE: its own paper states hysteresis is "a combination of biophase distribution kinetics AND receptor association/dissociation kinetics", with a partial-agonist ceiling, so a lone equilibration rate under-predicts both duration and ceiling.',
    summary: 'buprenorphine — the 17 h patch lag repeats the clonidine defect; keo kept but flagged incomplete' },

  { slug: 'nalbuphine', guard: (c) => c.pk?.IV?.V_L === 282,
    pk: { IV: { V_L: 290, F: 1, source_pmid: 'PMID:3691617' }, IM: { V_L: 290, F: 0.81, source_pmid: 'PMID:3691617' }, SC: { V_L: 290, F: 0.79, source_pmid: 'PMID:3691617' } },
    hl: { IV: 2.3, IM: 2.3, SC: 2.3 }, refs: ['PMID:3429694'],
    note: 'PK: FOUR SEPARATE CROSS-ARM AVERAGES IN ONE RECORD. V 282 L is the mean of two dose arms stated separately (290 and 274); intramuscular F 0.82 is the mean of 81 and 83; the 2.4 h half-lives are the midpoint of a stated "ranged between 2.2 and 2.6 h"; and subcutaneous F 0.78 is neither of the stated 79 and 76 nor even their mean. Each is now the single stated 10 mg arm value, and one disposition half-life of 2.3 h is shared, which the paper itself licenses: the values held "regardless of dose given or route administered", and intramuscular and subcutaneous dosing "appear to be interchangeable". ka 1 is dropped as unsourced AND as quantitatively incompatible with the stated peak at 30 to 40 minutes, which it would place near 1.7 h. DESIGN CAVEAT NOT PREVIOUSLY RECORDED: the study used THREE PARALLEL GROUPS of twelve, not a crossover, so its bioavailability figures are between-group ratios. Oral half-lives of 6.9-7.7 h exist in the literature and are formulation-specific through enterohepatic recirculation; they must never be mixed into these parenteral rows. Two references are removed as a receptor-autoradiography study and a medicinal-chemistry synthesis paper, neither containing pharmacokinetics.',
    summary: 'nalbuphine — four cross-arm averages in one record; ka incompatible with its own Tmax' },

  { slug: 'celecoxib', guard: (c) => c.pk?.PO?.V_L === 400,
    pk: { PO: { V_L: 346, F: 1, source_pmid: 'PMID:36318604' } }, hl: { PO: 7.8 },
    refs: ['PMID:36318604', 'PMID:11816012'],
    note: 'PK: the half-life of 7.8 h is verbatim and stands, labelled as the CYP2C9 extensive-metaboliser value (poor metabolisers give 11.5 h). F 0.4 is contradicted by the record own cited review, which states "the extent of absorption is not known", and no absolute bioavailability can exist because there is no intravenous formulation — so F is pinned to 1 and the volume stored as the published apparent 346 L, removing a double-division. ka 1 is dropped rather than replaced: a genuine value exists, an absorption half-life of 0.35 h, but it comes bundled with a 0.62 h lag this schema cannot represent, and a bare rate would predict onset too early. THE EFFECT-COMPARTMENT VALUE IS KEPT WITH ITS TITLE CORRECTED. It verifies exactly, but it is a PLASMA-TO-CSF TRANSFER constant rather than measured analgesic hysteresis; it was estimated as one POOLED value across three coxibs, two of which have since been withdrawn so the pooling can never be re-validated; and it applies to UNBOUND drug while celecoxib is about 97% protein bound, so feeding it a total-plasma concentration is a unit mismatch.',
    summary: 'celecoxib — F contradicted by its own review; keo is a plasma-to-CSF transfer, pooled across 3 drugs' },

  { slug: 'cerivastatin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 21, F: 0.6, source_pmid: 'PMID:9208342' } }, hl: { PO: 3 },
    refs: ['PMID:9208342'],
    note: 'PK: F 0.6 is verbatim and is now cited to the primary that measured it against a real intravenous bolus rather than to the sponsor review quoting it. WITHDRAWAL DOES NOT INVALIDATE THESE KINETICS, which is worth stating plainly: cerivastatin was withdrawn worldwide in 2001 for a pharmacodynamic and drug-interaction safety reason, rhabdomyolysis chiefly with gemfibrozil through enzyme and transporter inhibition, not because its pharmacokinetics were mischaracterised, and both pharmacokinetic sources predate the withdrawal. V 21 L is the stated 0.3 L/kg scaled to 70 kg and is a true steady-state volume, so pairing it with the absolute bioavailability is correct. The half-life of 3 h is the UPPER ENDPOINT of a stated "2 to 3 hours" and is additionally route-specific, exceeding the intravenous 1.5-2.4 h, a mild absorption-limited slope. ka 0.7 is dropped and probably collides with "approximately 70% of the administered dose is excreted as metabolites in the faeces". ANALYTE UNDERSTATEMENT WORTH RECORDING: three metabolites are "all 3 ... active inhibitors ... with a similar potency to the parent drug", so a parent-only curve captures a fraction of the enzyme inhibition. The record second reference is a gemfibrozil interaction study reporting only ratios.',
    summary: 'cerivastatin — withdrawal was a PD/DDI matter, so the PK stands; F re-cited to its primary' },

  { slug: 'sorafenib', guard: (c) => c.pk?.PO?.F === 0.4,
    pk: { PO: { V_L: 213, F: 1, source_pmid: 'PMID:21392074' } }, hl: { PO: 18.2 },
    refs: ['PMID:21392074', 'PMID:19733976'],
    note: 'PK: F 0.4 IS THE DOSE. Its sole citation is a phase II efficacy trial in prostate cancer whose regimen is "a dose of 400 mg orally twice daily", and that paper supports none of the four stored values, reporting only exposure, peak concentration and a time-to-peak range. NO ABSOLUTE BIOAVAILABILITY CAN EXIST: there is no intravenous sorafenib and the literature states that these agents "have an unknown absolute bioavailability", so F is pinned to 1 and the volume stored as the published apparent 213 L. A FIXED BIOAVAILABILITY IS WRONG IN KIND HERE, not merely unsourced: "Absolute bioavailability significantly dropped with increasing daily doses of sorafenib", exposure rising only 47.3 to 75.9 across a fourfold dose range. So is a single absorption rate: the population model uses "four transit absorption compartments and enterohepatic circulation", with half the drug recycling and gall-bladder emptying near 6 h. The half-life of 18.2 h is DERIVED from that model own clearance and volume and is flagged as such, because no abstract states a sorafenib half-life at all.',
    summary: 'sorafenib — F 0.4 was the 400 mg DOSE; absorption is transit-compartment with recirculation' },

  { slug: 'tofacitinib', guard: (c) => c.pk?.PO?.V_L === 90,
    pk: { PO: { ka_hr: 9.85, V_L: 115.8, F: 1, source_pmid: 'PMID:33513294' } }, hl: { PO: 3.2 },
    refs: ['PMID:33513294', 'PMID:24464803'],
    note: 'PK: all four values were zero-content on a salt-form bioequivalence study reporting only peak concentration, exposure and ratios. Two candidate collisions are logged as hypotheses: V 90 against its "90% confidence intervals", and ka 1.4 against its "up to 14 hours" of sampling. No absolute bioavailability exists — a PubMed search returns nothing and there is no human intravenous arm — so F is pinned to 1 and the volume stored as the published apparent 115.8 L, from a population fit that supplies the rate, the lag and the volume together. The stored rate of 1.4 was below every published estimate, which run 3.07 to 13.8 /h. THE EFFECT COMPARTMENT IS REMOVED AND ITS NOTE WAS WRONG IN DIRECTION: the cited paper is a RAT arthritis study containing no equilibration value, and its own conclusion attributes the effect to "attenuation of inflammation", a downstream process over days, while the note asserted equilibration with plasma. A search for any published equilibration constant for this drug returns nothing.',
    summary: 'tofacitinib — zero-content; its keo note was contradicted by its own rat citation' },

  { slug: 'riociguat', guard: (c) => c.pk?.PO?.ka_hr === 1.4,
    pk: { PO: { ka_hr: 2.17, V_L: 30.4, F: 0.94, source_pmid: 'PMID:27096084' } }, hl: { PO: 12 },
    refs: ['PMID:27096084', 'PMID:27162632', 'PMID:29086344'],
    note: 'PK: F 0.94 is verbatim and, contrary to the premise this batch was audited under, IS A GENUINE MEASURED ABSOLUTE VALUE — riociguat does have an intravenous arm: "riociguat (intravenous/oral) was administered to healthy male subjects in 3 open-label, randomized, crossover studies", giving "Absolute bioavailability was 94% (95% confidence interval [CI], 83%-107%)". ka corrected 1.4 to the published 2.17 /h. The stored V of 30 L was in fact the published apparent volume of 32.3 L silently multiplied by that bioavailability — the right operation performed without recording it; 30.4 is now stored with the derivation stated, so the pairing with F is explicit rather than accidental. SMOKING STATUS IS UNRECORDED IN BOTH CITED PAPERS AND MATTERS ENORMOUSLY: clearance is 120% higher in smokers, exposure falls by at least 60%, and accumulation is minimal in smokers against roughly twofold in non-smokers. The half-life of 12 h is POPULATION-SPECIFIC — 12 h in patients against 7 h in healthy individuals — and is now cited to the paper that states it. A provenance defect is also fixed: the paper carrying the bioavailability was not in the reference list while the only listed reference carried none of the stored values.',
    summary: 'riociguat — F 0.94 is genuinely measured; V 30 was an undocumented F-correction of 32.3' },

  { slug: 'sildenafil', guard: (c) => c.pk?.PO?.V_L === 105,
    pk: { PO: { V_L: 127, F: 0.41, source_pmid: 'PMID:11879254' } }, hl: { PO: 3.7 },
    refs: ['PMID:11879259', 'PMID:10219969'],
    note: 'PK: F 0.41 is verbatim from a twelve-subject crossover against a real 50 mg intravenous arm and stands. V 105 L was the exact MIDPOINT of a species-lumped "1-2 l/kg" range scaled to 70 kg; it is replaced by 127 L, the published apparent volume of 310 L multiplied by that bioavailability, with the derivation recorded. Half-life corrected to 3.7 h, and the two independent sources agree: that apparent volume with its clearance reproduces 3.67 h. ABSORPTION IS BIMODAL RATHER THAN FIRST-ORDER, so the rate is dropped rather than replaced: "the value for ka is associated with meal consumption within 2 h predose, AT ALL OTHER TIMES ka was equivalent to an instantaneous bolus administration", with 210% between-subject variability. THE EFFECT COMPARTMENT IS REMOVED — its reference is an IN-VITRO ORGAN-BATH study on human tissue strips, with no route administered and no timing of any kind, so it cannot support the note claim of a one-hour onset, and no published equilibration constant exists for this drug. The active N-desmethyl metabolite carries roughly a fifth of the activity at about half the parent exposure, so a parent-only curve understates enzyme inhibition.',
    summary: 'sildenafil — V was a species-lumped range midpoint; its keo cited an in-vitro organ bath' },

  { slug: 'levodopa', guard: (c) => c.pk?.PO?.V_L === 70,
    pk: { PO: { ka_hr: 1.86, V_L: 42.9, F: 1, source_pmid: 'PMID:26936272' } }, hl: { PO: 1.5 },
    refs: ['PMID:8112370', 'PMID:21080186'],
    note: 'PK: its cited paper is an INTRAVENOUS-INFUSION study containing NO NUMERIC PHARMACOKINETIC VALUE AT ALL, only "50%" and "doubles" — zero-content and route mismatch together — and its second reference is a pyridoxine study with no levodopa kinetics. F 0.3 CAN ONLY DESCRIBE LEVODOPA GIVEN WITHOUT A DECARBOXYLASE INHIBITOR, which is the one situation that essentially never occurs clinically; that same paper states carbidopa DOUBLES oral bioavailability. F is therefore pinned to 1 and the volume stored as the published apparent 42.9 L from a fit that also supplies the absorption rate. NEITHER A FIXED RATE NOR A FIXED BIOAVAILABILITY IS DEFENSIBLE: absorption is through a SATURABLE transporter shared with dietary large neutral amino acids and competing with protein intake, exposure is dose-nonlinear, and the between-subject variability on the absorption rate is 122%. The effect-compartment value verifies and is kept, but it describes the SHORT-DURATION response only; the days-long long-duration response is not representable by it, and the same source notes carbidopa "did not change the duration of the clinical response".',
    summary: 'levodopa — F 0.3 describes dosing without carbidopa, which essentially never happens' },

  { slug: 'oxcarbazepine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 1, source_pmid: 'PMID:17516704' } }, hl: { PO: 9 },
    refs: ['PMID:17516704', 'PMID:28528287'],
    note: 'PK: THIS RECORD IS A PARENT/METABOLITE CHIMERA and its own cited paper measured the METABOLITE, describing it as "the major component in plasma, the active monohydroxy metabolite (MHD), which is responsible for the therapeutic effect in man". The stored mass of 252.27 is the parent; the 9 h half-life is the metabolite value, the parent being 1-5 h against 7-20 h for the metabolite, and the metabolite mass is 254.28. F 0.95 came from an INEQUALITY BOUND, "the bioavailability of the oral formulation of oxcarbazepine is high (>95%)", and is replaced by a pinned 1 on the qualitative statement that absorption is complete. V 50 L matches NEITHER molecule nor either metabolite enantiomer — the parent is 131 L and the enantiomers 23.6 and 31.7 L. ka 1.5 is dropped rather than replaced because absorption is fitted with TRANSIT COMPARTMENTS. Both references are interaction studies reporting the OTHER drug kinetics. The mass-versus-analyte question is a schema decision and is logged rather than silently changed. Separately verified and NOT a defect: this record shares mass 252.27 with phenytoin because they are constitutional isomers, both C15H12N2O2.',
    summary: 'oxcarbazepine — parent mass carrying the metabolite half-life; F came from an inequality bound' },

  { slug: 'nortriptyline', guard: (c) => c.pk?.PO?.V_L === 1500,
    pk: { PO: { F: 0.46, source_pmid: 'PMID:1164819' } }, hl: { PO: 39 },
    refs: ['PMID:7366812', 'PMID:1164819', 'PMID:5558186'],
    note: 'PK: its source_pmid was a NARRATIVE REVIEW whose abstract contains not one number. V 1500 L has NO SOURCE ANYWHERE in the literature — a plausible textbook figure with nothing behind it — and is dropped. The half-life is corrected to the stated 39 h; the stored 30 h sits at the ADOLESCENT mean rather than the adult one. F 0.55 lies inside a stated "varied from 0.46 to 0.59 in 6 subjects" but is nowhere stated, so the lower endpoint is carried. AN EFFECT COMPARTMENT IS STRUCTURALLY WRONG FOR THIS DRUG AND THE RECORD IS RIGHT TO HAVE NONE: the concentration-effect relation is NON-MONOTONIC — "Amelioration was most pronounced in the intermediate plasma level range (50-139 ng/ml) and was slight both at lower and at higher plasma levels" — and no equilibration constant can represent a curve that falls again at high concentration. The therapeutic window needs an upper bound, not a half-maximal concentration. USEFUL STRUCTURAL FACT: enzyme inhibition changes clearance "whereas the volume of distribution was unchanged", so volume is the robust parameter here and clearance the fragile one. A trap is logged: a 66% figure in this literature is relative to INTRAMUSCULAR dosing and its own authors say so.',
    summary: 'nortriptyline — its source was a review with no numbers; V 1500 L has no source anywhere' },

  { slug: 'tacrine', guard: (c) => (c.pk?.PO?.source_label as string ?? '').includes('apparent V'),
    pk: { PO: { V_L: 349, F: 0.17, source_label: 'FDA label: Cognex (tacrine; withdrawn 2013) — absolute F 17 ± 13%, Tmax 1–2 h. V 349 L is IV-DERIVED (Hartvig 1990, PMID:2340845) and is a TRUE volume, not apparent — do not "correct" the F pairing.' } },
    hl: { PO: 2.91 }, refs: ['PMID:2340845', 'PMID:2598567', 'PMID:8973053'],
    note: 'PK: A CLASS-6 CALL THAT REVERSES, AND THE DEFECT WAS IN OUR OWN PROSE. V 349 L beside F 0.17 reads as an apparent volume double-divided by bioavailability. It is not: that figure comes from an intravenous dose — "After an intravenous dose of 30 mg THA ... Volume of distribution, V alpha varied 100-680 l with a mean of 349 l" — so it is a TRUE volume and the pairing is correct modelling. The defect was that our own source_label described it as "apparent", wording that would license a future editor to break a correct record; that word is now removed and the provenance stated. Two caveats travel with it: the population is amyotrophic lateral sclerosis and surgical patients rather than Alzheimer disease, and it is an alpha-phase volume with a 100-680 L spread. The half-life is re-sourced to 2.91 h, which the literature supports only as a MULTIPLE-DOSE value; single doses give 1.5-2.5 h and long-term treatment 5-7 h. ka 1 collides with the label own "Tmax 1-2 h". AN OPEN INCONSISTENCY IS RECORDED RATHER THAN HIDDEN: the stored volume, the stored half-life and the cited interaction paper own clearance cannot all be true at once.',
    summary: 'tacrine — the class-6 call REVERSES; the defect was our own label saying "apparent"' },

  { slug: 'meclizine', guard: (c) => c.pk?.PO?.V_L === 140,
    pk: { PO: { source_pmid: 'PMID:37428729' } }, hl: { PO: 7.4 }, refs: ['PMID:32282831'],
    note: 'PK: the half-life of 7.4 h is verbatim but needs its population stated, which it did not have: the study is in CHILDREN AGED 5 TO 10 WITH ACHONDROPLASIA, dosed AFTER MEALS, at steady state after fourteen days, and 7.4 h is the 12.5 mg cohort alone. The same programme fasted single-dose value is 8.5 h. A FIXED ABSORPTION RATE IS INDEFENSIBLE because food nearly DOUBLES the time to peak, from 1.7 h fasted to 3.7 h fed, and the stored rate of 1 was not even a collision with either — a bare default. F 0.5 IS NOT MEASURABLE IN HUMANS: there is no intravenous meclizine formulation and no human intravenous study exists, the only such comparison being in rats and dogs. V 140 L appears in no human abstract. Metabolism is dominated by CYP2D6 with large between-subject variability, and absorption rate is formulation-dependent while exposure is not.',
    summary: 'meclizine — its half-life is from CHILDREN with achondroplasia, fed, at steady state' },
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
  orphenadrine: ['IM'], clindamycin: ['TD'], ondansetron: ['IM'],
  prochlorperazine: ['PR'], buprenorphine: ['IM'],
};
for (const [slug, routes] of Object.entries(ROUTE_DROPS)) {
  const c = need(slug);
  const gone = routes.filter((r) => (c.routes ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} routes — already trimmed, skipped`); continue; }
  c.routes = (c.routes ?? []).filter((r) => !gone.includes(r));
  for (const r of gone) if (c.doses && r in c.doses) delete c.doses[r];
  log.push(`${slug} — dropped unparameterised route(s): ${gone.join(', ')}`);
}

/** References that state nothing about the compound they are filed under. */
const REF_DROPS: Record<string, string[]> = {
  ondansetron: ['PMID:23581504'],      // palonosetron in COS-7 cells — the "removed" fabrication
  zolmitriptan: ['PMID:10193663', 'PMID:15900510'], // eletriptan binding; a paper not mentioning the drug
  dofetilide: ['PMID:8921803'],        // Xenopus oocyte electrophysiology, no PK
  digoxin: ['PMID:18823299'],          // etoricoxib interaction, supports no stored value
  sildenafil: ['PMID:9598563'],        // in-vitro organ bath, no route, no timing
  felodipine: ['PMID:41203691'],       // rat formulation study
  buprenorphine: ['PMID:9686407'],     // no abstract at all; in-vitro binding compendium
  nalbuphine: ['PMID:2826773', 'PMID:19282177'], // autoradiography; synthesis chemistry
  levodopa: ['PMID:1167634'],          // pyridoxine study, zero levodopa PK
  oxcarbazepine: ['PMID:10368079', 'PMID:8451779'], // report the OTHER drug's kinetics
  'methylene-blue': ['PMID:29864547'], // orphaned delayed-release ref, formulation trap
};
for (const [slug, refs] of Object.entries(REF_DROPS)) {
  const c = need(slug);
  const gone = refs.filter((r) => (c.refs ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} refs — already trimmed, skipped`); continue; }
  c.refs = (c.refs ?? []).filter((r) => !gone.includes(r));
  log.push(`${slug} — dropped non-substantiating ref(s): ${gone.join(', ')}`);
}

/**
 * Effect-compartment corrections. These are NOT deletions: each of these records
 * carries receptor_occupancy rows, and the solver needs a kₑₒ to compute the
 * effect-site curve at all — removing it outright makes those curves render as
 * zero, which data-lint correctly rejects. So each keeps a value, demoted to a
 * declared approximation with the real evidence stated.
 */
const EC_FIXES: Record<string, { keo: number; species?: string; note: string; why: string }> = {
  dofetilide: { keo: 3.78, species: 'dog',
    note: 'Approximation, kept only because receptor_occupancy needs a kₑₒ. Verbatim from conscious beagle dogs under IV infusion ("an equilibrium half-life of 11+/-8 min"), but its precision spans 3-19 min (kₑₒ 2.2-13.9), and HUMAN ORAL DATA CONTRADICT THE DELAY: "direct linear relationships were observed after oral administrations in eight of 10 subjects". This record is oral-only, so treat the effect as near-direct and this as an upper bound on any lag.',
    why: 'dog IV value; human ORAL data show a direct relationship' },
  ondansetron: { keo: 2,
    note: 'Approximation; no published kₑₒ exists, and the published model is DIRECT: the definitive QTc analysis fits "a linear concentration-response model", which is undelayed by construction. A fast kₑₒ is therefore the right shape rather than a measured value. The previously cited palonosetron paper was fabricated provenance and has been removed from refs as well as from here.',
    why: 'published model is a DIRECT linear concentration-response' },
  zolmitriptan: { keo: 2,
    note: 'Approximation; no published kₑₒ exists. Both prior references were the WRONG DRUG — an eletriptan binding study, and a paper never mentioning zolmitriptan whose "time to reach equilibrium was approximately 2 h" (a rat-brain-homogenate binding value) is a plausible origin for this number. Relief is measured over 24 h against a ~2.3 h half-life, so the effect is decoupled and this is a placeholder, not a fit.',
    why: 'both prior refs were the wrong drug' },
  tofacitinib: { keo: 1,
    note: 'Approximation; no published kₑₒ exists — a search returns nothing. THE PREVIOUS NOTE WAS WRONG IN DIRECTION: it claimed kinase inhibition equilibrates with plasma, but its cited paper is a RAT arthritis study stating no equilibration value at all, whose own conclusion attributes the effect to "attenuation of inflammation", a downstream process over days. This value therefore OVERSTATES the speed of effect and should be read as an upper bound.',
    why: 'cited rat paper states no value; effect is downstream and delayed' },
  sildenafil: { keo: 1,
    note: 'Approximation; no published kₑₒ exists for sildenafil. The previously cited reference was an IN-VITRO ORGAN-BATH study on human tissue strips with no route administered and no timing of any kind, so it could not support the onset claim written against it; it has been removed from refs. The active N-desmethyl metabolite carries roughly a fifth of the activity, which a parent-only effect model does not represent.',
    why: 'cited ref was an in-vitro organ bath with no timing' },
};
for (const [slug, f] of Object.entries(EC_FIXES)) {
  const c = need(slug);
  if (String(c.effect_compartment?.note ?? '').includes(f.note.slice(0, 50))) { log.push(`${slug} kₑₒ — already corrected, skipped`); continue; }
  c.effect_compartment = { keo_per_h: f.keo, approximated: true, note: f.note, ...(f.species ? { source_species: f.species } : {}) };
  log.push(`${slug} — kₑₒ demoted to a declared approximation: ${f.why}`);
}

/** Records where nothing survives. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  risedronate: ['uncharacterized',
    'Fourth bisphosphonate to fail the same way. Its cited study sampled serum for only 72 h, so a 480 h half-life is not estimable from it — and 480 is ALSO its stored volume, one unsourced numeral in two slots. No risedronate abstract in PubMed states a terminal half-life or a volume in litres at all. F 0.0062 IS verbatim ("The absolute bioavailability was approximately 0.62%") and is preserved here. Disposition is skeletal uptake, not plasma distribution.',
    ['PMID:11405286']],
  zoledronate: ['uncharacterized',
    'Fails differently from the other bisphosphonates: its 39 h IS verbatim but is the THIRD OF FOUR phases — "half-lives of 0.2 and 1.4 hours ... and half-lives of 39 and 4526 hours" — neither the phase carrying exposure nor the terminal one. A one-compartment model is wrong both ways: plasma falls to "<1% of C(max) at 24 hours" while 4526 h is skeletal release. V 14 L is a standard deviation ("41% +/- 14%"). A search for a zoledronate volume returns zero hits.',
    ['PMID:12412821', 'PMID:28000034']],
  mepivacaine: ['local-acting',
    'Its citation is an INTRAVENOUS INFUSION study, so an IM row cannot come from it and an absorption rate is unobtainable. It reports only enantiomers, and V 80 L is the exact MEAN of the two (R 103, S 57) from a paper concluding they "demonstrated a marked difference". A plasma model is INVERTED here: effect is channel block at the INJECTION SITE, so rising plasma means block wearing off. Every human extravascular exposure in the literature is a regional block.',
    ['PMID:8989005', 'PMID:2271470']],
  dexlansoprazole: ['uncharacterized',
    'Its cited paper is an INTRAVENOUS study on a PO-only record, so every value is a route mismatch by construction, and its half-life of 1.7 h is that paper stated range midpoint (1.24-2.17). V 30 L is probably its DOSE, 30 mg, the only 30 in the abstract. No abstract anywhere states a half-life, volume, bioavailability or absorption rate for ORAL dexlansoprazole. The formulation is DUAL DELAYED RELEASE producing "two distinct peaks", which no single first-order input can represent at any value.',
    ['PMID:28138748', 'PMID:19243357']],
  ubrogepant: ['uncharacterized',
    'Its sole citation, used as both source and only reference, is a NARRATIVE REVIEW containing not one numeric value. Nine further papers were screened and none reports an absolute disposition parameter; the interaction literature gives exposure ratios only. Absorption is fitted with TRANSIT COMPARTMENTS, so a single rate constant is the wrong structure at any value.',
    ['PMID:38266060', 'PMID:42212509']],
  praziquantel: ['uncharacterized',
    'Purest zero-content case in the batch: the cited abstract is rich in exposure figures yet contains NONE of the four stored values, and is a ketoconazole interaction study. The 1.5 h is a range UPPER BOUND ("1--1.5 h") duplicated into the absorption slot. F 0.8 is off by ~an order of magnitude given "pronounced first-pass metabolism". WRONG ANALYTE: only R-praziquantel is active, and S exposure is ~4.7x higher.',
    ['PMID:729622', 'PMID:35024995']],
  lubiprostone: ['local-acting',
    'The entire block was a category error. The drug acts on the LUMINAL face of the enterocyte and is "almost completely metabolized in the gut lumen"; parent is not measurable in plasma, and the cited study measured only the M3 metabolite. V 7000 L with F 0.1 implies ~70,000 L, about 1000 L/kg, for a molecule designed not to distribute. Its absorption rate equalled its elimination rate, making the model degenerate.',
    ['PMID:36626291', 'PMID:22834474']],
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
