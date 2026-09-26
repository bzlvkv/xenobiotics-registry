/**
 * 2026-09-07-pharmacological-batch8.ts
 *
 * Eighth batch of the pharmacological category: 40 compounds, eight agents.
 *
 * ── THE ARITHMETIC TEST IS NOW THE PRIMARY SCREEN ──────────────────────
 * Class 12, introduced in batch 7, was run FIRST on all forty records this
 * time, before any citation was read: {V_L, F, t-half} jointly fix
 * CL/F = (V_L/F)*ln2/t-half and therefore AUC, so comparing that against a
 * verbatim published clearance finds defects no citation check can reach.
 * It fired on fourteen records and cleanly ACQUITTED six, and the acquittals
 * are as valuable as the hits: prazosin 1.01x, ruxolitinib 1.1%, ibrutinib
 * 1.7%, desloratadine 2.2%, ethambutol 2.6%, daclatasvir 0.7%.
 *
 * ── FIXING F ALONE MAKES IT WORSE: FOUR CONFIRMED INSTANCES ────────────
 * The warning added in batch 7 earned itself four times over. nimodipine set
 * the shape; here mirabegron (0.29 -> 0.35 turns 2.46x into 3.0x), efavirenz
 * (the error FLIPS from 1.59x under to 2.26x over), rimegepant (+3.9% becomes
 * +62%) and misoprostol (F=1 alone still leaves CL/F above the published CI).
 * V and F have to move together or not at all.
 *
 * ── AND THE INVERSE: TWO RECORDS WHOSE ERRORS CANCEL ───────────────────
 * rimegepant carries a computed volume (Vc/F + Vp/F) and an uncited label F,
 * and reproduces a dose- AND formulation-matched published AUC to 3.9%.
 * ibrutinib V 122 L is an apparent volume multiplied by F and relabelled a
 * "true Vd", which the solver then divides by F again — self-cancelling, and
 * its AUC lands within 1.7% of the label. NEITHER RECORD IS TOUCHED, and both
 * now say so, because "correcting" either introduces a 5-6x error.
 *
 * ── CLASS 14: A PER-KILOGRAM DOSE STORED AS A FLAT DOSE ────────────────
 * trastuzumab doses.IV was {4, 8, typical 6, unit mg}. Those are mg/kg — its
 * own citation says "a 4 mg/kg loading dose ... followed by 2 mg/kg weekly".
 * At the 70 kg reference the typical dose is 420 mg, not 6: A SEVENTYFOLD
 * UNDER-DOSE, which dwarfs the 3.14x clearance error on the same record.
 * Swept all 18 biologics: every other one carries genuinely flat mg doses in
 * the tens-to-hundreds. infliximab (3-10, typical 5.33) has the same defect and
 * rituximab's 375-500 is mg/m2; both are logged, not fixed, for want of a
 * verbatim source. There is no mg/kg in the DoseUnit enum.
 *
 * ── THE SILENT-DEFAULT DEBT, FOUND BY AN AGENT AND VERIFIED WIDER ──────
 * resolvePk substitutes 0.5 L/kg for a missing V_L, 0.9 for F and 1.0 for ka.
 * 161 of 793 route rows carry no V_L and render at 35 L — and ALL 161 carry a
 * source_pmid or source_label, claiming provenance for a number their citation
 * never stated. linagliptin rendered 10.4x high on AUC that way. data-lint.ts
 * had a comment describing this exact hazard and no rule behind it; this batch
 * adds `pk.defaulted-volume` and `pk.defaulted-params`.
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
  fraction_unbound?: number; fu_note?: string;
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const FIXES: { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'losartan', guard: (c) => c.pk?.PO?.V_L === 34,
    pk: { PO: { ka_hr: 2.5, V_L: 111, F: 0.33, source_pmid: 'PMID:8529329' } },
    hl: { PO: 2.1 }, refs: ['PMID:8529329'],
    note: 'PK: CLASS 12, AND THE CORRECT PAPER WAS NEVER CITED. Its source was an amlodipine interaction study containing none of the four stored values, and containing the number that convicts them: at that study own 100 mg dose the stored record predicts an AUC of 2801 against its observed 1241.50 ng.h/mL. Everything moves to the crossover that measured all of it in eighteen men — "the average plasma clearance of losartan was 610 ml/min, and the volume of distribution was 34 L ... Terminal half-life was 2.1 hours ... The oral bioavailability of losartan tablets was 33%". F 0.33 IS VERIFIED AND IS THE TABLET FIGURE, so the trap candesartan fell into is avoided here. But V 34 L is that study BI-EXPONENTIAL volume paired with its TERMINAL half-life, implying a clearance of 11.2 L/h against the same abstract 36.6 — 3.26x low. The terminal-phase volume the one-compartment model needs is 111 L, and both inputs are verbatim from the same sentence-pair. CLASS 6 IS ACQUITTED: losartan was dosed intravenously in that study, so this is a true volume and pairing it with F is correct. ka 2.5 is unsourced but reproduces the verbatim "peak concentrations ... reached in 1 hour", and is relabelled as derived rather than measured.',
    summary: 'losartan — a bi-exponential volume on a terminal half-life, 3.26x; its real paper was uncited' },

  { slug: 'olmesartan', guard: (c) => c.pk?.PO?.V_L === 17,
    pk: { PO: { ka_hr: 1.46, V_L: 32.5, F: 0.26, lag_hr: 0.427, source_pmid: 'PMID:16372830' } },
    hl: { PO: 13 }, refs: ['PMID:11361048'],
    note: 'PK: A TEXTBOOK CLASS 12, CAUGHT AGAINST A CLEARANCE VERBATIM IN ITS OWN ABSTRACT. The cited paper is explicitly a TWO-COMPARTMENT population model — "CL/F (6.66 L/h for a typical male Western hypertensive patient), absorption rate constant (1.46h-1), elimination rate constant (0.193h-1), rate constant from the central to peripheral compartment (0.061h-1) ... and absorption lag-time (0.427h)" — and the record paired that model central volume with its beta half-life, asserting CL/F 3.49 against the abstract own 6.66. AUC was 1.91x too high. The volume moves to the value that reproduces the published clearance at the stored half-life. NEITHER F NOR THE HALF-LIFE MAY BE TOUCHED INSTEAD: holding V at 17 L would force the half-life down to 6.8 h and destroy the once-daily profile that is this drug entire clinical identity. ka 1.46 is verbatim and stays, and the verbatim absorption lag of 0.427 h is added, which moves the peak to about 2.8 h and matches the measured "1.4 to 2.8 hours". CLASS 6 ACQUITTED — the same source states "When administered intravenously, RNH-6270 has a volume of distribution of 15 to 25 L". F 0.26 is verbatim, but in a DIFFERENT paper than the one cited for it.',
    summary: 'olmesartan — a two-compartment volume against a CL/F verbatim in its own abstract, 1.91x' },

  { slug: 'valsartan', guard: (c) => c.pk?.PO?.ka_hr === 1,
    pk: { PO: { ka_hr: 1.4, V_L: 22.2, F: 0.23, source_pmid: 'PMID:9174680' } },
    hl: { PO: 7 },
    note: 'PK: THE CONTROL OF ITS GROUP, AND IT HOLDS — WHICH IS WORTH SAYING. F 0.23 is verbatim AND IS THE CAPSULE VALUE: "The fraction of dose absorbed and systemically available after oral administration was 0.23 for the capsule and 0.39 for the solution". The solution figure sits in the same sentence, and this record correctly did not take it — the exact trap candesartan fell into. The half-life is verbatim, the volume is verbatim ("The volume of distribution at steady state was 16.9 l") and INTRAVENOUS, so class 6 is acquitted. Valsartan is not a prodrug and needs no conversion, which is why it was chosen as the control. Only class 12 bites, mildly: 16.9 L on a 7.0 h terminal half-life implies 1.67 L/h against the same abstract verbatim "the total body clearance 2.2 l.h-1", 1.31x low, and the abstract names the cause itself — "biphasic decay kinetics, with a distribution phase (half-life 1.0 h)". The volume moves to the one that reproduces that clearance, keeping both the half-life and the clearance verbatim. ka 1.0 is replaced because absorption here is explicitly biphasic and 1.4 reproduces the verbatim "Plasma levels peaked 2 h after oral administration of the 80 mg capsule".',
    summary: 'valsartan — the group control; took the capsule F over the solution F sitting beside it' },

  { slug: 'nadolol', guard: (c) => c.half_life_hr?.PO === 9.1,
    pk: { PO: { ka_hr: 0.85, V_L: 284, F: 0.336, source_pmid: 'PMID:16040' } },
    hl: { PO: 14 }, refs: ['PMID:16040', 'PMID:6714285', 'PMID:2235896', 'PMID:3366166'],
    note: 'PK: ITS CITATION WAS AN INTRAVENOUS-ONLY STUDY AND THREE OF THE FOUR STORED VALUES WERE ORAL. That paper entire numeric content is "total body clearance (219 to 250 ml.min-1) ... half-life (8.8 to 9.4 h), and steady-state volume of distribution (Vss) (147 to 157 l)" — no bioavailability, no absorption rate, no single-valued volume. t-half 9.1 was the EXACT ARITHMETIC MIDPOINT of that range; V 135 L appears in no abstract at all, matching neither the Vss range nor its midpoint nor any per-kg conversion. F moves to the verbatim "oral doses of nadolol-14C were absorbed to the extent of 33.6+/-2.4 per cent". THE HALF-LIFE MOVES BECAUSE THIS DRUG IS FLIP-FLOP: its oral terminal half-life exceeds its intravenous one in every paired dataset including the same subjects, "Terminal plasma half-times after oral and intravenous doses were an average of 12.2 and 9.8 hours, respectively". V 284 L IS AN APPARENT, FLIP-FLOP VOLUME and contradicts the published intravenous 2.09 L/kg; that is the price of one compartment, and it is stated rather than hidden. Checked against an independent study, the new set predicts 59.6 and 119.2 ng/mL at 60 and 120 mg against an observed "69 +/- 15 to 132 +/- 27", where the old set was 31% and 37% high. A HARDER LIMIT IS RECORDED SEPARATELY: nadolol is not superposable.',
    summary: 'nadolol — an IV-only citation behind three oral values; the half-life was a range midpoint' },

  { slug: 'prazosin', guard: (c) => c.pk?.PO?.source_pmid === 'PMID:6994981',
    pk: { PO: { ka_hr: 1.1, V_L: 42, F: 0.57, source_pmid: 'PMID:7285477' } },
    hl: { PO: 3 }, refs: ['PMID:7285477'],
    note: 'PK: VERIFIED, AND MY OWN PRIOR ABOUT IT WAS WRONG. I expected the stored 3 h to be its citation Tmax range endpoint read as a half-life — a clean collision. It is not. An intravenous-plus-oral study states "Terminal half-life (t1/2 beta) was about 3 hr and apparent volume of distribution (Vd beta) about 0.6 l/kg ... total plasma clearance was low (0.14 l/kg x hr)", which at the reference weight is 42 L, 3 h and 9.80 L/h — and the stored pair implies 9.70 L/h, A ONE PERCENT MATCH. The stored {42 L, 3 h} is a TERMINAL volume paired with a TERMINAL half-life, which is the correct one-compartment collapse and the opposite of the defect the rest of this batch is full of. F 0.57 is a STATED MEAN, not a midpoint — "ranges from 43.5 to 69.3% (mean 56.9%)", where the midpoint would be 56.4 — and the same source records that it is formulation- and food-robust. Only the citation was wrong: under the previously cited abstract alone, which says "about 2.5 hours", the same numbers WOULD have been a 1.31x class-12 error. FIRST-DOSE HYPOTENSION IS CORRECTLY ABSENT FROM THE PK, and its own source says why: "Pharmacokinetic data do not suggest a mechanism to explain the disappearance of the first-dose effect."',
    summary: 'prazosin — verified to 1%; a terminal volume on a terminal half-life, done right' },

  { slug: 'pibrentasvir', guard: (c) => c.pk?.PO?.F === 0.1,
    pk: { PO: { ka_hr: 0.66, V_L: 2350, F: 1, source_pmid: 'PMID:37661787' } },
    hl: { PO: 25 }, refs: ['PMID:28464496', 'PMID:37661787'],
    note: 'PK: THE DEFECT WAS FOUND FROM ITS PARTNER RECORD, AND CONFIRMED HERE. Its citation was fetched in full and states no absorption rate, no volume, no bioavailability and no half-life — only ratios, which is the etravirine shape exactly. That reference is KEPT, because it is the legitimate interactions citation for the glecaprevir-pibrentasvir pair. THREE MUTUALLY INCONSISTENT HALF-LIVES EXIST AND THE STORED 23 WAS NONE OF THEM: the label says 13, the monotherapy first-in-human study says "ranged from 20 to 22 hours" (a range, so storing 21 would be a defect of its own), and the co-formulated value is the verbatim "a terminal elimination half-life of 5.9 and 25 hours". The stored values describe the COMBINATION state and nothing in the record said so. F 0.10 is unsourced AND unsourceable — the Mavyret label states no bioavailability and no volume for either component and there is no human intravenous pibrentasvir — so it is pinned to 1 and the volume carries the same apparent quantity it always did. TWO OF MY PRIORS ABOUT THIS PAIR WERE REFUTED AND ARE RECORDED: the boosting is ONE-DIRECTIONAL, and "Food had minimal effect (<14%) on pibrentasvir bioavailability" ALONE while the coformulated tablet does show one — the two must not be collapsed.',
    summary: 'pibrentasvir — its citation states none of its four values; three half-lives exist and 23 was none' },

  { slug: 'nirmatrelvir', guard: (c) => c.pk?.PO?.F === 0.5,
    pk: { PO: { ka_hr: 0.6, V_L: 104.7, F: 1, source_pmid: 'PMID:42090083' } },
    hl: { PO: 6.84 },
    note: 'PK: CLASS 6 IN ITS UNAMBIGUOUS FORM. The Paxlovid label reports, for nirmatrelvir given with ritonavir, "V z /F (L), mean 104.7" with its own abbreviation key spelling out that Vz/F is the APPARENT volume of distribution — and the record stored that figure beside an F of 0.5, dividing by an availability twice. There is no human intravenous nirmatrelvir, absolute bioavailability has never been determined, and 0.5 has no source; this is not one of the reversible class-6 judgements. The damage is measured against the record OWN cited abstract: "Geometric mean nirmatrelvir Cmax and AUC were 3.08 microg/mL and 19.66 microg.h/mL after the first dose and increased to 4.50 microg/mL and 32.01 microg.h/mL at steady state ... a mean terminal half-life of 6.84 h" — against which the stored record was 2.2x low on exposure and 2.9x low on peak. The half-life also becomes that verbatim 6.84. I CONSIDERED AND REJECTED THE elvitegravir PRECEDENT: that record was stripped because its boosted and unboosted states differ threefold with no way to declare which, whereas nirmatrelvir has NO CLINICAL UNBOOSTED STATE and every label figure is already measured with ritonavir. There is nothing ambiguous to declare.',
    summary: 'nirmatrelvir — a labelled Vz/F stored beside F 0.5; 2.2x low against its own abstract' },

  { slug: 'acalabrutinib', guard: (c) => c.half_life_hr?.PO === 1,
    pk: { PO: { ka_hr: 2.2, V_L: 101, F: 0.25, source_pmid: 'PMID:30442651' } },
    hl: { PO: 1.78 }, refs: ['PMID:30556110'],
    note: 'PK: THE HALF-LIFE IS LABEL-VERBATIM AND PHYSICALLY IMPOSSIBLE BESIDE ITS OWN VOLUME. The label gives both "terminal elimination half-life (t1/2) was 1 (59%) hour" and "The geometric mean (% CV) STEADY-STATE volume of distribution (Vss) was approximately 101 (52%) L", and the record paired them — an ORAL terminal half-life with an INTRAVENOUS steady-state volume. With the measured intravenous clearance of 39.4 L/h, a 1 h half-life forces a terminal volume of 56.8 L, WHICH IS SMALLER THAN Vss. A terminal volume can never be smaller than the steady-state volume, so the half-life is pinned at no less than 1.78 h — consistent with the separately published "elimination half-life values of <2 hours". CLASS 6 IS ACQUITTED HERE AND THAT MATTERS, because my prior was that every volume in this drug class must be apparent: this label writes CL/F and Vd,ss/F explicitly elsewhere, so a plain Vss is intravenous, and a human intravenous microtracer arm exists. Dividing 101 L by F is CORRECT. F 0.25 is verbatim twice over. THE ANALYTE IS CLEAN: ACP-5862 runs two to three times the parent exposure at about half the potency, but it is a separate species with its own half-life and volume, and none of its numbers have leaked into this record.',
    summary: 'acalabrutinib — an oral half-life on an IV Vss, forcing a terminal volume below steady-state' },

  { slug: 'dasatinib', guard: (c) => c.pk?.PO?.F === 0.14,
    pk: { PO: { ka_hr: 2.65, V_L: 2100, F: 1, source_pmid: 'PMID:32112275' } },
    hl: { PO: 4 }, refs: ['PMID:21827214'],
    note: 'PK: THE LARGEST EXPOSURE ERROR IN THIS BATCH — 18.5x — AND ITS OWN CITATION REFUTES THE CULPRIT. That paper states "The absolute bioavailability of dasatinib in humans is unknown due to the lack of an intravenous formulation preventing calculation of the reference exposure." So F 0.14 is not merely unsourced, it is contradicted, and there is a likely donor: a review covering this drug and pazopanib side by side says "Absolute bioavailability in humans has been investigated only for imatinib (almost 100%) and pazopanib (14-39%; n = 3)" — the LOWER ENDPOINT OF A DIFFERENT DRUG RANGE. AND THE VOLUME PROVES THE DOUBLE DIVISION ARITHMETICALLY: the label gives "The apparent volume of distribution is 2505 L" and "The mean apparent oral clearance is 363.8 L/hr", and 2100 x ln2/4 reproduces 363.9 — the label CL/F to four figures. Someone solved the volume from an APPARENT clearance and then applied F on top of it. Because no human intravenous dasatinib exists the volume cannot be anything but V/F, so this is class 6 with certainty rather than by inference, and F is pinned to 1. A 2.4x residual against an independent patient study remains and is the class-12 residue of a terminal-phase volume. A scalar F is fragile here regardless: absorption is pH-dependent.',
    summary: 'dasatinib — 18.5x; F 0.14 is pazopanib range endpoint, on a volume back-solved from CL/F' },

  { slug: 'exemestane', guard: (c) => c.pk?.PO?.F === 0.42,
    pk: { PO: { ka_hr: 1.4, V_L: 20000, F: 1, source_pmid: 'PMID:16361559' } },
    hl: { PO: 24 }, refs: ['PMID:20329658'],
    note: 'PK: F 0.42 IS AN ABSORBED FRACTION, AND ITS SOURCE SAYS SO. The label states "Approximately 42% of radiolabeled exemestane was ABSORBED from the gastrointestinal tract", while the European summary settles the question outright: "The absolute bioavailability in humans is unknown, although it is anticipated to be limited by an extensive first pass effect." The numeral 42 appears three times in that label, twice as an excretion fraction. The volume is explicitly apparent in the same document — "The volume of distribution of exemestane, NOT CORRECTED FOR THE ORAL BIOAVAILABILITY, is ca 20000 l" — so pairing it with an independent F divided by an availability twice, and F is pinned to 1. That alone brings implied clearance to 578 L/h against a verbatim "Oral clearance of exemestane averaged 602 L/h based on an average plasma exemestane AUC of 41.5 microg h/L", with two further sources landing at 604 and 599. The previously cited study supports none of the four values and is kept only as the fed-state bioequivalence citation. A RESIDUAL IS RECORDED SO NOBODY CHASES IT: even at F 1 the model peak is far below observation, because 20,000 L is the terminal-phase volume of a drug its own label says declines polyexponentially, and one compartment can match this drug exposure or its peak but not both. A TRAP IS ALSO RECORDED: a transdermal proliposome paper quotes "bioavailability (42%)" secondhand, laundering the label absorbed fraction.',
    summary: 'exemestane — F 0.42 is the ABSORBED fraction; its own label says absolute F is unknown' },

  { slug: 'loratadine', guard: (c) => c.pk?.PO?.V_L === 119,
    pk: { PO: { V_L: 3683, F: 1, source_pmid: 'PMID:12852841' } },
    hl: { PO: 6 },
    note: 'PK: A 12.4x EXPOSURE ERROR RESTING ON A SINGLE INDEFENSIBLE VOLUME. Its own citation gives "AUC(0-infinity)) was (47+/-49) microg x h x L(-1) for LOR" at 20 mg, which is a clearance of 425.5 L/h against the stored 34.4, and a second study at 40 mg agrees at 417-500. V 119 L appears in no abstract, and its own citation implies 3683 L — thirty-one times larger. IT IS ALSO BYTE-IDENTICAL TO canagliflozin V_L, where that record notes confirm it is verbatim and intravenous-derived; the direction is unprovable and it may equally be loratadine textbook figure in L/KG stored as litres, but 119 L is indefensible either way. F 0.4 is likewise absent from the abstract, whose nearest numeral is an AUC RATIO, and loratadine has no intravenous form at all: "the absolute bioavailability is unknown because no intravenous formulations are available". F is pinned to 1 and the volume becomes the apparent one its own citation implies from verbatim dose, AUC and half-life. THE COST IS STATED: exposure becomes exact and the peak falls to about a quarter of observation, which is unavoidable — the published AUC-to-Cmax ratio for this drug is BELOW the floor a one-compartment model can produce at any parameter choice. ka 2.0 is dropped; it is shared with thirteen other records.',
    summary: 'loratadine — 12.4x on one volume that is byte-identical to canagliflozin' },

  { slug: 'imipramine', guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { V_L: 1386, F: 0.402, source_pmid: 'PMID:6726654' } },
    hl: { PO: 15.5 }, refs: ['PMID:6726654', 'PMID:9088587'],
    note: 'PK: THE SURVIVING HALF OF A CONFIRMED CLASS DEFAULT. ka 1.5 was deleted from desipramine last batch as a tricyclic default propagated across records; IT SITS ON TWENTY-FIVE RECORDS in this catalog, including 5-htp, allopurinol, glycine, lsd, warfarin and theophylline, and is deleted here too. MY PRIOR ABOUT F WAS CONFIRMED IN BOTH DIRECTIONS: the value genuinely is imipramine own — "Comparison of i.v. and p.o. imipramine doses indicated absolute bioavailability was 40.2% in the control state", an intravenous-plus-oral crossover in the same six volunteers — but it was attributed to a paper that does not contain it, and the paper that does was not in refs[] at all. The whole record now moves to that study control arm, which is the only internally consistent set in this literature: its stated clearance and its volume and half-life agree to 1.4%, and its stated oral AUC to 4.4%. It is also INTRAVENOUS-ANCHORED, which acquits class 6 — the volume is absolute, so pairing it with F is correct. The half-life 16.7 was verbatim and correctly attributed, and the word "from" in "a prolongation in imipramine half-life (from 16.7 +/- 3.3 to 19.2 +/- 5.4 h)" fixes the control arm unambiguously; it moves only to keep one coherent set. A CAVEAT IS LOGGED: the two papers disagree about 1.9x on clearance, and mixing them is what produced the 41% error.',
    summary: 'imipramine — ka 1.5 is a class default on 25 records; F was right under a paper lacking it' },

  { slug: 'bupropion', guard: (c) => c.pk?.PO?.F === 0.06,
    pk: { PO: { ka_hr: 0.5, V_L: 6695, F: 1, source_pmid: 'PMID:16368442' } },
    hl: { PO: 21 }, refs: ['PMID:27255113', 'PMID:30520001', 'PMID:14515060'],
    note: 'PK: A 6.5-TO-8.4x UNDER-PREDICTION ON A CITATION THAT CARRIES NOTHING. Its source states none of the four values — only metabolite ratios, a simulated partial-AUC range and a metabolite half-life range — and was not even in refs[]. F 0.06 has no traceable origin: no indexed abstract states an absolute bioavailability for bupropion, the frequently quoted ~87% is canine and could not be verified in any abstract either, and 0.06 sits on cbd, dronabinol, ganciclovir and oxybutynin where six percent is real. Since no absolute F exists the volume is necessarily apparent, so F is pinned to 1. THE HALF-LIFE WAS A RANGE ENDPOINT AND THE STATED VALUE WAS ALREADY IN ITS OWN refs[]: "biphasic elimination with an elimination half-life of 11 - 14 hours" was stored as 14, while a reference the record already carried says "Bupropion is extensively metabolized by the liver (t(1/2), approximately 21 hours)". The volume becomes the one reproducing a verbatim "apparent oral clearance of 221 L/h", which is disclosed as derived AND as measured at 60.9 kg rather than this registry 70. ka 0.5 is kept because it is formulation-coherent, reproducing the extended-release peak; a scalar ka can represent only one of three marketed forms and this record is declared XL. A STRUCTURAL LIMIT IS LOGGED: hydroxybupropion runs an "AUC ... approximately 10-fold greater" than the parent, so a parent-only curve cannot represent this drug pharmacology.',
    summary: 'bupropion — 6.5-8.4x under; its stated half-life was already sitting in its own refs' },

  { slug: 'vilazodone', guard: (c) => c.pk?.PO?.F === 0.72,
    pk: { PO: { V_L: 1400, F: 1, source_pmid: 'PMID:23417352' } },
    hl: { PO: 34.8 },
    note: 'PK: ONE WRONG FIELD, AND FIXING IT ALONE IS THE WHOLE REPAIR — WHICH IS RARE IN THIS BATCH. The stored volume is very nearly the correct APPARENT volume; the defect is an F dividing it a second time. Its own citation gives "total drug clearance (19.9 and 25.1 L/h vs. 26.4 and 26.9 L/h)", where the latter pair are the healthy matched controls and, coming from a single oral dose with no intravenous arm, are necessarily apparent — against which the stored record asserted 38.5 L/h. Pinning F to 1 lands at 27.9, within four to six percent. The 72% figure in this literature is the label RELATIVE bioavailability of tablet against oral solution, and vilazodone has no intravenous form; I could not quote it from any abstract, so the SHAPE is reported rather than the sourcing asserted. The half-life was a cross-arm value: the verbatim options are "35.7 and 34.8 h mild and moderate vs. 37.0 and 34.8 h matched controls", 35 is none of them, and the nearest is the MILD RENAL IMPAIRMENT arm; it becomes a verbatim healthy-control value. ka 0.14 predicted a peak at 16.3 hours against a real 4-5, AND IS BYTE-SHARED WITH mesalamine, a colonic delayed-release drug where a rate that slow is appropriate. Exposure is roughly halved fasted and the label mandates food; that is not representable here.',
    summary: 'vilazodone — F was the only wrong field; ka 0.14 is shared with a colonic-release drug' },

  { slug: 'saxagliptin', guard: (c) => c.pk?.PO?.F === 0.67,
    pk: { PO: { ka_hr: 3.5, V_L: 151, F: 0.5, source_pmid: 'PMID:22823746' } },
    hl: { PO: 3 }, refs: ['PMID:22823746', 'PMID:22668067'],
    note: 'PK: ITS CITATION CARRIED A PEAK TIME AND EXCRETION FRACTIONS AND NOTHING ELSE. F 0.67 appears in no abstract; the nearest figure in its own refs[] is "good bioavailability (50-75%) in the species tested" — RATS, DOGS AND MONKEYS — and 0.67 is not even that range midpoint. The human measurement is verbatim and unambiguous, from an intravenous microdose given alongside the therapeutic oral dose: "The geometric mean point estimates (90% confidence interval) F(p.o) . values for saxagliptin and dapagliflozin were 50% (48, 53%)". THIS IS THE ONE RECORD IN THIS BATCH WHERE FIXING F ALONE MAKES IT BETTER, and the direction was checked before acting: exposure moves from 23% high to 8% low, so the volume is deliberately left alone. The half-life was verbatim but hung on the wrong paper — "The elimination half-lives (t(1/2)) for saxagliptin and 5-hydroxy saxagliptin were approximately 3 and 4 hours" — and the record correctly took the parent value rather than the metabolite. ka 3.5 is unsourced but is NOT a back-derivation. THE ACTIVE METABOLITE IS UNMODELLED AND THE GAP IS QUANTIFIABLE: it runs two to three times the parent exposure at half the potency, so real DPP-4 inhibition is about 2.25 times what a parent-only occupancy row computes.',
    summary: 'saxagliptin — F 0.67 is an animal range; the human 50% comes from an IV microdose' },

  { slug: 'linagliptin', guard: (c) => c.pk?.PO?.V_L == null,
    pk: { PO: { ka_hr: 2.12, V_L: 402.2, F: 0.3, source_pmid: 'PMID:22568694' } },
    hl: { PO: 12 }, refs: ['PMID:21053992'],
    note: 'PK: THIS RECORD HAD NO VOLUME AT ALL, AND THE SOLVER SUPPLIED ONE SILENTLY. resolvePk substitutes 0.5 L/kg for a missing V_L, so linagliptin was rendering at 35 L and therefore 10.4x high on exposure — against a verbatim "geometric mean area under the plasma concentration-time curve (AUC) was 71 ng x h ml-1" it asserted 742, and against a verbatim "Cmax after single dose was 4.9 ng/ml" it asserted 38.7. The value now stored is verbatim from a paper that was not in refs[]: "The model-derived estimates of the V(ss) and clearance of linagliptin not bound to DPP-4 were 402.2 L and 26.9 L/h". Exposure lands within nine percent, and the two numbers cross-check — their ratio gives a 10.4 h half-life, matching the accumulation half-life this record already stores. CLASS 6 IS ACQUITTED because that volume comes from intravenous dosing. AND MY PRIOR ABOUT THE HALF-LIFE WAS WRONG IN THE OPPOSITE DIRECTION TO ESLICARBAZEPINE: I expected the stored 12 h to be an effective half-life masquerading as an elimination one, but here that is the CORRECT choice — the 126-139 h terminal phase is target-binding-driven and carries almost no exposure, and storing it would make exposure 10.5x too high. A CAVEAT IS LOGGED: clearance and volume both rise with dose, so this is defensible at the fixed stored dose and not across doses.',
    summary: 'linagliptin — no volume at all, silently rendering at the 35 L default: 10.4x high' },

  { slug: 'mirabegron', guard: (c) => c.half_life_hr?.PO === 50,
    pk: { PO: { ka_hr: 0.83, V_L: 1670, F: 0.29, source_pmid: 'PMID:22943933' } },
    hl: { PO: 20.3 }, refs: ['PMID:22943933'],
    note: 'PK: CLASS 12 AT 2.46x, AND A WORKED EXAMPLE OF WHY F MUST NOT MOVE ALONE. Its cited paper states none of the four values; the real donor, absent from refs[], gives all of them: "Mean half-life was around 40 h for both routes of administration. Volume of distribution at steady state was 1,670 l and total clearance was around 57 l/h for i.v. dosing." The stored volume is verbatim and INTRAVENOUS, so class 6 is acquitted — but pairing that bi-exponential steady-state volume with a terminal half-life asserts a clearance of 23.2 L/h against the measured 57. RAISING F TO THE 50 mg FIGURE, AS I ORIGINALLY PROPOSED, WOULD HAVE MULTIPLIED EXPOSURE BY A FURTHER 1.21 AND TURNED 2.46x INTO 3.0x. Instead the half-life becomes the mono-exponential equivalent that honours both verbatim intravenous numbers, disclosed as derived rather than quoted. The stored F is verbatim but is the 25 mg value while this record typical dose is 50 mg, and the 35% figure I asserted for 50 mg IS NOT VERBATIM ANYWHERE — that abstract jumps from 25 mg to 150 mg — so it is deliberately not stored. ka 0.6 predicted a peak at 6.4 h against "peak plasma concentrations were attained after ~ 4 h". A modelling compromise is recorded: mirabegron is dosed as a controlled-absorption tablet, so a first-order absorption rate is an approximation of a designed release profile.',
    summary: 'mirabegron — 2.46x, and raising F as I first proposed would have made it 3.0x' },

  { slug: 'misoprostol', guard: (c) => c.pk?.PO?.F === 0.88,
    pk: { PO: { ka_hr: 4, V_L: 632, F: 1, source_pmid: 'PMID:35587540' } },
    hl: { PO: 0.5 }, refs: ['PMID:35587540', 'PMID:3122274'],
    note: 'PK: THE IMPOSSIBLE CLEARANCE WAS REAL, AND F WAS WHAT MADE IT IMPOSSIBLE. This record asserted a clearance near four times cardiac output, and the diagnosis is the opposite of what that suggests: an apparent clearance of that magnitude for misoprostol acid IS published — "apparent clearance 705 (431-1099) L/h or apparent volume of distribution 632 (343-1008) L", from a one-compartment fit, the same model shape this registry runs. It exceeds cardiac output because it is divided by an availability that is low and, for the circulating acid, unmeasurable. THE DEFECT WAS F 0.88, WHICH CONVERTED A PUBLISHED APPARENT VOLUME INTO A CLAIM ABOUT A REAL ONE — class 6 running in reverse — and its likely donor sits in this record own refs[]: a serum binding figure "between 81 and 89 %", which is the confirmed protein-binding-as-bioavailability shape. FIXING F ALONE WAS NOT ENOUGH: at F 1 with the old volume the implied clearance still sat above the published confidence interval, so both moved together. CAVEATS ARE RECORDED RATHER THAN BURIED: that population is labouring women at term dosed buccally and vaginally with nonlinear clearance and no oral arm, so its absorption rates are deliberately NOT transplanted, and its relative bioavailability figure is relative. The stored half-life remains an inequality bound, "less than 30 minutes", stored as exactly the bound.',
    summary: 'misoprostol — its impossible clearance is a real published APPARENT one; F was the defect' },

  { slug: 'eslicarbazepine', guard: (c) => c.half_life_hr?.PO === 22,
    pk: { PO: { ka_hr: 0.6, V_L: 61, F: 0.94, source_pmid: 'PMID:27249205' } },
    hl: { PO: 13.2 }, refs: ['PMID:22612290', 'PMID:12952496'],
    note: 'PK: AN EFFECTIVE HALF-LIFE STORED AS AN ELIMINATION HALF-LIFE — A NEW SHAPE, AND ITS SOURCE NAMES IT. "After ESL oral administration, the EFFECTIVE half-life (t(1/2,eff)) of eslicarbazepine was 20-24 h, which is approximately TWO TIMES LONGER than its terminal half-life". The stored 22 was both the midpoint of that range and the accumulation parameter that justifies once-daily dosing rather than the elimination rate a one-compartment model needs, and it ran exposure 60% high against its own citation verbatim "AUC(0-inf), 225 000 versus 234 000 ng.h/mL". Three independent lines converge on ten to thirteen hours, including a verbatim "apparent terminal half-life of 8-17h" and the fact that OXCARBAZEPINE IN THIS SAME CATALOG STORES 9 h FOR THE SAME CIRCULATING MOLECULE. The value adopted is the one reproducing that observed exposure, disclosed as derived. F 0.90 becomes the verbatim "systemic exposure to eslicarbazepine after ESL oral administration is approximately 94% of the parent dose". AND THE MASS WAS THE PRODRUG: the record modelled S-licarbazepine while storing 296.32, the ACETATE, where the circulating species is 254.29 — a 16.5% error, proven by "Plasma BIA 2-093 concentrations were generally below the limit of quantification of the assay". It has no occupancy row today, so nothing inherited the error yet.',
    summary: 'eslicarbazepine — the EFFECTIVE half-life stored as the elimination one, 60% high' },

  { slug: 'terbinafine', guard: (c) => c.pk?.PO?.V_L === 2000,
    pk: { PO: { V_L: 1334, F: 1, source_pmid: 'PMID:8573687' } },
    hl: { PO: 25 }, refs: ['PMID:8573687'],
    note: 'PK: MY TISSUE-ACCUMULATION PRIOR WAS REFUTED AND THE REAL DEFECT IS 3.75x. The stored half-life is verbatim and is the RIGHT ONE: "The apparent terminal half-lives of terbinafine, demethylterbinafine, and the two carboxy metabolites appear to be similar (approximately 25 h)" is the plasma value, and the separate three-week deep-tissue phase is explicitly negligible for exposure — "That terminal elimination phase contributed SO LITTLE TO THE TOTAL EXPOSURE, however, that average concentrations accumulated only approximately two-fold at steady state". No conflation. The defect is class 6: against this record own refs[], a 250 mg dose gives a verbatim "AUC(0.48) of terbinafine was ... 6761.63 +/- 3140.33 ng x h/ml", an observed clearance of 36.97 L/h against the stored 138.6. THERE IS NO HUMAN INTRAVENOUS TERBINAFINE — the only intravenous data is rat and the published human model was fitted to oral data — so every human volume is apparent and dividing by F again is the double division. V 2000 also matched nothing: the verbatim human figure is 11 L/kg and this record own data imply 1334 L. A HARD LIMIT IS RECORDED: no one-compartment model at this half-life can reach the observed peak, which is 8.3x above the best achievable before any choice of volume or rate, because terbinafine has a rapid distribution phase the model has no slot for. ka 0.7 predicted a peak at 4.8 h against a real two.',
    summary: 'terbinafine — 3.75x from a V/F double division; the tissue half-life was never conflated' },

  { slug: 'ethambutol', guard: (c) => c.pk?.PO?.F === 0.8,
    pk: { PO: { ka_hr: 0.8, V_L: 147, F: 0.87, source_pmid: 'PMID:7431225' } },
    hl: { PO: 3 }, refs: ['PMID:7431225', 'PMID:26661397'],
    note: 'PK: THE ACQUITTAL OF ITS BATCH — THE NUMBERS ARE RIGHT AND ONLY THE CITATION WAS EMPTY. Against an intravenous benchmark stating "Plasma EMB clearance ranged from 7.47 to 8.87 ml/min/kg (mean 8.57)", the stored volume and half-life imply a true clearance within 5.7% and an apparent clearance within 2.6%. AND THE AUTHORING WAS SUBTLER THAN IT LOOKS: V 147 L is deliberately NOT the published steady-state volume of 3.89 L/kg, which would have overstated clearance 1.7x; it is close to the terminal-phase volume, which is the CORRECT one-compartment flattening. Whoever wrote this record got class 12 right before the class had a name. The defects are bibliographic: the cited bioequivalence study reports only 90% confidence intervals — "For ethambutol, these values were 84.7 to 105.7, 93.5 to 105.1, and 92.1 to 105.4" — and not one absolute parameter. F 0.80 is numerically fine but is probably an excretion fraction, "The fraction of the dose eliminated UNCHANGED varied from 0.75 to 0.84", which is a confirmed collision shape and the likely origin of the textbook figure; it moves to a measured absolute value, "Absolute bioavailability in the fasted state and the fed state was ... 87% and 82% for ethambutol", which also IMPROVES the clearance agreement. A POPULATION MODEL WAS REJECTED WITH PREJUDICE: its 77.4 L/h and 76.2 L imply a 0.68 h half-life and are the central compartment of a four-transit model.',
    summary: 'ethambutol — verified to within 6%; its author got the one-compartment collapse right' },

  { slug: 'ticagrelor', guard: (c) => c.pk?.PO?.ka_hr === 1,
    pk: { PO: { ka_hr: 0.67, V_L: 88, F: 0.36, source_pmid: 'PMID:27191766' } },
    hl: { PO: 8 }, refs: ['PMID:27191766', 'PMID:27536453', 'PMID:20091161'],
    note: 'PK: THE BEST AVAILABLE SOURCE IS A ONE-COMPARTMENT POPULATION MODEL — THIS REGISTRY OWN MODEL SHAPE — AND NOBODY HAD USED IT. Across nearly seven thousand patients: "A one-compartment model with population mean PK parameters of first-order absorption rate constant (0.67/h), apparent systemic clearance (14 L/h), and apparent volume of distribution (221 L) was shown to best describe the PK profile of ticagrelor." The absorption rate is therefore directly storable verbatim, replacing a value that was this catalog default and that predicted a peak at 2.68 h against a verbatim median of 1.3 to 2 h. CLASS 6 IS ACQUITTED: a 15 mg intravenous dose was given alongside the oral, so the stored volume is intravenous-anchored, and that same study carries the bioavailability verbatim — "The mean absolute bioavailability of ticagrelor was 36%" — which is the source that should have been cited. THE EFFECT COMPARTMENT IS THE LEGITIMATE CASE: unlike the irreversible inhibitors audited in a sibling group, ticagrelor is a REVERSIBLE P2Y12 antagonist, and its own literature says so — inhibition "was nearly complete at 2 h" and then "gradually decreasing with declining plasma concentration ... indicating that the IPA is reversible". A plasma-linked effect model is appropriate here, and the record already reflects it. ONE MISS IS RECORDED: an absorption lag, not the rate, explains a fourfold over-prediction at the earliest sampling time.',
    summary: 'ticagrelor — a one-compartment popPK existed, uncited; its keo is the legitimate case' },

  { slug: 'tadalafil', guard: (c) => c.pk?.PO?.F === 0.4,
    pk: { PO: { ka_hr: 1.5, V_L: 62.6, F: 1, source_pmid: 'PMID:16487221' } },
    hl: { PO: 17.5 },
    note: 'PK: MY PRIOR THAT THIS WOULD BE THE SIMPLE, CORRECT ONE IS REFUTED — IT HOLDS ITS GROUP LARGEST ERROR. Its citation states its own volume as apparent, in the same sentence as the clearance that convicts the record: "Mean oral clearance (CL/F) was 2.48 (1.35, 4.35) l h-1 and APPARENT volume of distribution (Vz/F) was 62.6 (39.5, 92.1) l". The stored 63 is that figure rounded, and it was paired with an F of 0.4, so the solver divided by an availability twice and asserted 6.24 L/h — 2.52x over. F 0.4 has no source anywhere: no human intravenous tadalafil formulation exists and the label states absolute bioavailability was never determined, so this is not one of the reversible class-6 judgements. Pinning F to 1 and storing the verbatim volume reproduces the published clearance to three digits, 2.479 against 2.48. THE HALF-LIFE WAS EXACTLY RIGHT ALL ALONG and is untouched, verbatim as "a mean ... t1/2 of 17.5 (11.5, 29.6) hours" — which is the whole clinical point of this drug. Its occupancy row is verified and its free-fraction correction correctly applied, because that affinity is a recombinant-enzyme value rather than a whole-blood one.',
    summary: 'tadalafil — a labelled Vz/F stored beside F 0.4; 2.52x, and its half-life was perfect' },

  { slug: 'pentoxifylline', guard: (c) => c.pk?.PO?.F === 0.2,
    pk: { PO: { ka_hr: 0.5, V_L: 168, F: 0.33, source_pmid: 'PMID:3965236' } },
    hl: { PO: 1.63 }, refs: ['PMID:3965236', 'PMID:2178853'],
    note: 'PK: MY EXTENDED-RELEASE PRIOR IS REFUTED, AND FOR AN INSTRUCTIVE REASON. I expected the nifedipine defect — modified-release values under an immediate-release label — but EVERY candidate source used an extended-release product BECAUSE THAT IS THE ONLY MARKETED ORAL FORM. There is no immediate-release label to mismatch, this record dose block is the standard extended-release regimen, and its absorption rate is slower than its elimination rate, which correctly encodes flip-flop for a release-limited product. CLASS 6 IS ALSO ACQUITTED, verbatim: after a 200 mg INTRAVENOUS dose, "plasma levels declined in a biphasic manner, with a terminal t1/2 of 1.63 +/- 0.8 hr. Plasma clearance was 1333 +/- 481 ml/min and the volume of distribution was 168 +/- 82.3 l". The stored volume was that figure rounded and its pairing with F was correct all along. The real defects are smaller: F 0.20 is the LOW ENDPOINT of "bioavailability averaged 20% to 30%", where a stated mean exists elsewhere at 0.33, and the half-life was verbatim nowhere. A CLASS-13 FLAG IS RAISED AND DISMISSED: the implied absolute clearance exceeds hepatic blood flow, which would normally be impossible, but its own literature explains it — "suggesting an extrahepatic metabolism". The active metabolite runs higher than the parent and is unmodelled.',
    summary: 'pentoxifylline — the ER prior fails because ER is the only marketed form; class 6 acquitted' },

  { slug: 'efavirenz', guard: (c) => c.pk?.PO?.V_L === 390,
    pk: { PO: { ka_hr: 0.3, V_L: 311, F: 1, source_pmid: 'PMID:19433561' } },
    hl: { PO: 22.7 }, refs: ['PMID:19433561', 'PMID:12545140', 'PMID:16392089'],
    note: 'PK: ITS OWN CITATION STATED TWO OF THESE NUMBERS AND THE RECORD GOT BOTH WRONG. That paper says "Oral clearance was 9.4 L/h, oral volume of distribution was 252 L, and the absorption rate constant was 0.3 h(-1)"; the record stored 0.5 and 390. The volume 390 appears in no efavirenz population model anywhere. All three published models call their volumes apparent, no intravenous formulation exists, and F 0.43 is the midpoint of a widely repeated 40-45% with no primary behind it — so F is pinned to 1 and the class-6 double division removed. THE RECORD NOW MOVES TO THE ONLY ONE-COMPARTMENT efavirenz MODEL PUBLISHED, matching this solver exactly: "Pharmacokinetic parameters were estimated according to a ONE-COMPARTMENT model ... oral clearance and the apparent volume of distribution were 9.50 liters/h and 311 liters". The half-life is that model own clearance-over-volume, derived inside a SINGLE fit rather than assembled across papers, and independently corroborated by a genotype study median of 23 h. MY AUTOINDUCTION PRIOR IS REFUTED AND THE RECORD MUST NOT BE STRIPPED: this is not a carbamazepine. The label reports accumulation only "22-42% lower" than predicted, against carbamazepine two- to threefold, so a single steady-state half-life can represent it. A POPULATION CAVEAT IS LOGGED INSTEAD: CYP2B6 genotype moves half-life from 23 to 48 hours.',
    summary: 'efavirenz — its own citation gave ka 0.3 and V 252; the record stored 0.5 and 390' },

  { slug: 'hydroxychloroquine', guard: (c) => c.pk?.PO?.V_L === 50000,
    pk: { PO: { ka_hr: 0.7, V_L: 5522, F: 0.74, source_pmid: 'PMID:3179169' } },
    hl: { PO: 960 }, refs: ['PMID:3179169'],
    note: 'PK: A MATRIX ARTEFACT WORTH 9.06x, AND MY OWN PRIOR WOULD HAVE PRESERVED IT. Hydroxychloroquine is reported in either whole blood or plasma and the two differ about sevenfold — "Blood to plasma concentration ratios were not constant (mean +/- s.d.: 7.2 +/- 4.2)" — and the source states both volumes side by side: "large volumes of distribution were calculated (5,522 l FROM BLOOD, 44,257 l FROM PLASMA)". The stored 50,000 was NEITHER: a rounded plasma-scale volume welded to a blood-derived bioavailability, since F 0.74 is verbatim "estimated from the blood and urine data" and that same abstract disqualifies the plasma route to it. Each matrix is internally consistent to within eight percent against its own clearance, 96 mL/min in blood and 667 in plasma; MIXING THEM WAS THE ENTIRE DEFECT. THE FIGURE I SUPPLIED IN THE PROMPT, 40,000-50,000 L, IS THE PLASMA NUMBER — real, but unusable beside a blood-derived F, so adopting it would have preserved the error. CLASS 6 IS ACQUITTED because an intravenous infusion was actually given. A CAVEAT IS RECORDED: this blood volume is a terminal one and under-predicts the observed peak; a whole-blood population model exists that reproduces the peak but at a half-life discarding the forty-day terminal phase, and one compartment cannot hold both.',
    summary: 'hydroxychloroquine — a plasma volume welded to a blood F, 9.06x; my own figure was the plasma one' },

  { slug: 'baloxavir', guard: (c) => c.pk?.PO?.F === 0.96,
    pk: { PO: { ka_hr: 0.5, V_L: 1180, F: 1, source_pmid: 'PMID:35176206' } },
    hl: { PO: 79.1 },
    note: 'PK: THE MASS DESCRIBED A SPECIES NEVER PRESENT IN PLASMA — the fourth instance of this shape after fenofibrate, misoprostol and eslicarbazepine. The stored 571.55 is baloxavir MARBOXIL, the prodrug; the circulating and measured species is baloxavir acid at 483.5, and the record own source says so — "PK parameters of BALOXAVIR ACID were estimated by noncompartmental analysis". An 18.2% error, carried by a record whose name field compounds the conflation. That citation also states none of the four stored values, and measured against its own verbatim numbers — "Mean maximum concentration (Cmax) was 107.6 and 206.9 ng/ml, and mean ... AUC0-inf was 6955 and 9643 ng.h/ml in the 40 and 80 mg cohorts" — the record was 2.7x low on exposure and 5.2x low on peak. F 0.96 is class 6 and its likely donor is the label PRODRUG CONVERSION sentence, an "almost completely converted" efficiency read as an oral bioavailability; no absolute bioavailability has ever been determined and every published volume is explicitly apparent. The label volume and clearance are internally coherent and are adopted together. A RESIDUE REMAINS AND IS DISCLOSED: no one-compartment fit of this drug exists in the literature at all — every published model is two or three compartments WITH AN ABSORPTION LAG this solver has no term for.',
    summary: 'baloxavir — the stored mass is the prodrug, 18.2%; no one-compartment fit of it exists' },
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

/**
 * Absorption rates that fail to reproduce a Tmax written into the record's OWN
 * source_label string. A sibling group found four of five DAA records in this
 * shape; all five of their ka values are round catalog defaults (0.7/0.5/0.7/
 * 0.3/0.6). Class 9 was tested on each and CLEARED — these are not
 * back-derivations, they are defaults that were never checked against the
 * label text sitting beside them.
 */
const KA_FIXES: { slug: string; from: number; to: number; note: string; summary: string }[] = [
  { slug: 'daclatasvir', from: 0.7, to: 1.82,
    note: 'PK: THE ABSORPTION RATE CONTRADICTED THE LABEL TEXT IN ITS OWN source_label STRING, which says peak concentrations occur "within 2 hours" while ka 0.7 predicted 3.98 h. Every other figure in that string verifies against the FDA label — "The absolute bioavailability of the tablet formulation is 67%", the 12-15 h half-life range — and the stored volume reproduces the European summary AUC to 0.7%, so only the rate moves. TWO TRAPS ARE RECORDED SO NOBODY "CORRECTS" THE VOLUME: the label separately states a steady-state volume of 47 L from an intravenous microdose, which is the most citable-looking number in the record and the WRONG one to store — it makes exposure worse — and it states a total clearance of 4.2 L/h which implies a volume near 79 L and an exposure 1.49x BELOW the same regulator own published figure. THE LABEL NUMBERS ARE MUTUALLY INCONSISTENT UNDER ONE COMPARTMENT: its volume and clearance together imply a 7.8 h half-life against its own stated 12-15. That is class 12 in the SOURCE, not in this record. Class 6 is acquitted — a human intravenous microdose exists. One prose defect: the mechanism string attributes its Cmax and AUC to the FDA label, but those figures are the European summary; the FDA label states no Cmax at all.',
    summary: 'daclatasvir — ka contradicted the Tmax in its own label string; two volume traps recorded' },
  { slug: 'elbasvir', from: 0.5, to: 1.3,
    note: 'PK: EVERY STORED LABEL FIGURE VERIFIES AND ONLY THE ABSORPTION RATE FAILS. The Zepatier label states "elbasvir peak concentrations occur at a median Tmax of 3 hours (range of 3 to 6 hours)", "The absolute bioavailability of elbasvir is estimated to be 32%", and a "geometric mean apparent terminal half-life ... approximately 24 ... hours", all of which this record carries correctly; ka 0.5 predicted a peak at 6.05 h. CLASS 6 IS ACQUITTED IN AN UNUSUAL WAY AND IT MUST BE RECORDED: the label DOES publish an apparent volume, "approximately 680 L ... based on population pharmacokinetic modeling", AND THAT IS NOT WHAT IS STORED. The stored 288 L was back-solved to reproduce the label exposure and does so to 0.2%. SUBSTITUTING THE PUBLISHED 680 L WOULD MAKE EXPOSURE 33% TOO HIGH, because that population value belongs to a multi-compartment fit. The back-solve is right; it simply has no citation, and the source_label string does not claim one. The stored values are the co-formulated clinical state. A reference on this record reports 18 h rather than the stored 24; it is the only indexed abstract on either component and must not be mistaken for the source.',
    summary: 'elbasvir — ka missed its own label Tmax; its back-solved volume beats the published one' },
  { slug: 'grazoprevir', from: 0.7, to: 2.35,
    note: 'PK: THE ABSORPTION RATE PREDICTED A PEAK AT 5.08 h AGAINST ITS OWN LABEL STRING MEDIAN OF 2 h. As with its co-formulated partner, every other stored figure verifies verbatim against the Zepatier label, including the food effect quoted in the mechanism prose. The stored volume was likewise back-solved and reproduces the label exposure to 0.8%, where the label published apparent volume of 1250 L would overshoot by 50%; it is deliberately left alone. A LIMIT IS RECORDED AS IRREDUCIBLE RATHER THAN CHASED: this record under-predicts the label peak concentration by 2.3x and NO CHOICE OF ABSORPTION RATE CAN FIX IT — with exposure and half-life both pinned to verbatim label values, the dose-over-volume ceiling is far below the observed peak. Grazoprevir is strongly biexponential because of active hepatic uptake, and that is a limitation of one compartment rather than a defect in the data.',
    summary: 'grazoprevir — ka missed its label Tmax; its 2.3x peak shortfall is structural, not a defect' },
];
for (const f of KA_FIXES) {
  const c = need(f.slug);
  const po = c.pk?.PO;
  if (!po || po.ka_hr !== f.from) { log.push(`${f.slug} ka — already corrected, skipped`); continue; }
  po.ka_hr = f.to;
  note(c, f.note);
  log.push(f.summary);
}

/** Molecular masses describing a species that is never present in plasma. */
const MW_FIXES: { slug: string; from: number; to: number; analyte?: [string, string]; note: string; summary: string }[] = [
  { slug: 'misoprostol', from: 382.54, to: 368.51, analyte: ['active-metabolite', 'misoprostol acid'],
    note: 'ANALYTE: the stored mass was the METHYL ESTER, and its own source says the ester is not there — "no unchanged drug is detected in the plasma or urine. The biologically active metabolite in the plasma is misoprostol acid (SC-30695)." The mass, the free fraction and every PK value describe the acid. The occupancy EC50 is corrected with it.',
    summary: 'misoprostol — mw 382.54 (ester) -> 368.51 (acid), the circulating species' },
  { slug: 'eslicarbazepine', from: 296.32, to: 254.29, analyte: ['active-metabolite', 'S-licarbazepine'],
    note: 'ANALYTE: the stored mass was the ACETATE PRODRUG while every PK value describes S-licarbazepine — a 16.5% error, and the largest of the four mass defects found across batches 7 and 8. Proof from its own literature: "Plasma BIA 2-093 concentrations were generally below the limit of quantification of the assay." The catalog OXCARBAZEPINE record models the same circulating molecule and carries the analogous note already; this is the same chimera, an order of magnitude larger. No occupancy row exists here yet, so nothing has inherited the error.',
    summary: 'eslicarbazepine — mw 296.32 (acetate prodrug) -> 254.29 (S-licarbazepine), 16.5%' },
  { slug: 'baloxavir', from: 571.55, to: 483.5, analyte: ['active-metabolite', 'baloxavir acid'],
    note: 'ANALYTE: the stored mass was BALOXAVIR MARBOXIL, the prodrug, while its own citation measured the acid — "PK parameters of baloxavir acid were estimated by noncompartmental analysis". 18.2% high for a species never present in plasma.',
    summary: 'baloxavir — mw 571.55 (marboxil prodrug) -> 483.5 (baloxavir acid), 18.2%' },
];
for (const f of MW_FIXES) {
  const c = need(f.slug);
  if (c.mw_g_mol !== f.from) { log.push(`${f.slug} mw — already corrected, skipped`); continue; }
  c.mw_g_mol = f.to;
  if (f.analyte) { c.pk_analyte = f.analyte[0]; c.pk_analyte_name = f.analyte[1]; }
  note(c, f.note);
  log.push(f.summary);
}

/** Occupancy EC50 converted with a mass belonging to the wrong species. */
{
  const c = need('misoprostol');
  const row = (c.receptor_occupancy ?? []).find((r) => r.receptor === 'ep3');
  if (!row) throw new Error('misoprostol ep3 row missing');
  if (row.ec50_mg_l === 0.0456952) log.push('misoprostol/ep3 — already corrected, skipped');
  else {
    row.ec50_mg_l = 0.0456952;
    row.note = `${row.note ?? ''} CONVERTED WITH THE ESTER MASS: 124 nM x 382.54 rather than the acid 368.51, 3.8% high. THREE LARGER PROBLEMS REMAIN UNFIXED: the source figure is a BINDING Ki stored as a functional EC50 with no Cheng-Prusoff correction; the assay is HAMSTER UTERUS; and the abstract names its ligand only as "misoprostol", so IF THAT IS THE ESTER the affinity does not describe the circulating acid at all, whichever mass is used. Needs the full text.`.trim();
    log.push('misoprostol/ep3 — ec50 converted with the ester mass, 0.047435 -> 0.0456952');
  }
}

/** Volume with a better-provenanced verbatim value at the same magnitude. */
{
  const c = need('desloratadine');
  if (c.pk?.PO?.V_L === 3430) log.push('desloratadine V — already corrected, skipped');
  else if (c.pk?.PO?.V_L === 3500) {
    c.pk.PO.V_L = 3430;
    addRefs(c, 'PMID:15312146');
    note(c, 'PK: THE HEALTHIEST RECORD IN ITS GROUP, AND THE NUMBERS ARE LEFT ALONE — it reproduces a verbatim "AUC(24h) 56.9 microg.h/L" to within 2.2%, which is the best arithmetic agreement in that group. Only the volume provenance moves, to the verbatim "particularly large for desloratadine (approximately 49 l/kg)", a 2% change. THAT SAME PAPER ALSO SETTLES CLASS 6 IN THE ACQUITTAL DIRECTION AND SOURCES THE F: it calls the volume APPARENT and states "the estimation for fexofenadine is at least 33%; NO ESTIMATION WAS FOUND FOR DESLORATADINE", so pinning F to 1 beside an apparent volume is correct and deliberate rather than a gap. THE DEFECT ON THIS RECORD IS IN OUR OWN PROSE: its effect-compartment note describes a "2-6 h window" that belongs to FEXOFENADINE — the cited study is a fexofenadine-versus-desloratadine comparison, and desloratadine own verbatim onset in it is 5 hours. The stored keo is right; simulated effect-site peak lands at 8.2 h, inside the verbatim "from 6 to 10 hours".');
    log.push('desloratadine — V 3500 -> 3430 (verbatim); keo note attributed fexofenadine window to it');
  } else log.push('desloratadine V — unexpected value, skipped');
}

/** trastuzumab: a per-kilogram dose block stored as flat mg, plus an SC bioavailability. */
{
  const c = need('trastuzumab');
  const iv = c.doses?.IV;
  if (iv && iv.typical === 6) {
    c.doses!.IV = { min: 280, max: 560, typical: 420, unit: 'mg' };
    c.doses!.SC = { min: 600, max: 600, typical: 600, unit: 'mg' };
    if (c.pk?.SC) { c.pk.SC.F = 0.77; c.pk.SC.source_pmid = 'PMID:26645407'; }
    addRefs(c, 'PMID:26645407', 'PMID:25019376');
    note(c, 'DOSING: A NEW DEFECT CLASS, AND IT DWARFS EVERY OTHER ERROR ON THIS RECORD. doses.IV held {4, 8, typical 6} in mg, but those are mg/KG — its own citation says "a 4 mg/kg loading dose of trastuzumab followed by 2 mg/kg weekly". At the 70 kg reference the typical dose is 420 mg, not 6: A SEVENTYFOLD UNDER-DOSE. All eighteen biologics in this catalog were swept; every other one carries genuinely flat mg doses in the tens to hundreds, and only INFLIXIMAB shares this shape while RITUXIMAB stores a per-square-metre dose. There is no mg/kg in the DoseUnit enum, so the values are converted at the reference weight and that conversion is stated here rather than hidden. The subcutaneous route was declared with no dose block at all; its fixed 600 mg is verbatim in two sources. Its subcutaneous bioavailability of 0.87 came from a paper containing NO numeric PK parameter of any kind, and the human figure is verbatim: "a two-compartment model with parallel linear and nonlinear elimination and first-order SC absorption, with a bioavailability of 77 %". The nearest 0.87-shaped published numbers are RAT. THREE OF MY OWN PRIORS ABOUT THIS RECORD WERE REFUTED: class 6 is acquitted because the central volume is genuinely intravenous-derived; the identical half-lives across routes are NOT flip-flop, since absorption here is eleven times faster than elimination and one disposition model legitimately serves both routes; and this record is not a residue of the "7 L biologic default", which belongs to a different cluster. WHAT REMAINS UNFIXED IS STRUCTURAL: its volume and half-life together assert a clearance 3.14x below its own citation, and no one-compartment model can represent target-mediated disposition. The pk_unauthored vocabulary has no reason code for that shape.');
    log.push('trastuzumab — doses.IV was mg/kg stored as mg (70x under-dose); SC dose added; SC F 0.87 -> 0.77');
  } else log.push('trastuzumab doses — already corrected, skipped');
}

/** hydroxychloroquine: doses are sulphate, the mass is free base. */
{
  const c = need('hydroxychloroquine');
  const po = c.doses?.PO;
  if (po && po.typical === 400) {
    c.doses!.PO = { min: 155, max: 465, typical: 310, unit: 'mg' };
    note(c, 'DOSING: A SALT-FACTOR MISMATCH STACKED ON TOP OF THE MATRIX ERROR. mw_g_mol 335.87 is the FREE BASE, but the stored 200/400/600 mg were SULPHATE doses, so the record fed a salt dose into a base-referenced model — a further 1.29x overstatement. Its own source states the conversion verbatim: "a 155 mg oral tablet and an intravenous infusion of 155 mg racemic hydroxychloroquine (200 mg hydroxychloroquine sulphate)". The dose block is converted to base at that stated ratio rather than the mass being changed, because every PK value on this record describes the base.');
    log.push('hydroxychloroquine — doses were sulphate against a free-base mass; converted to base (1.29x)');
  } else log.push('hydroxychloroquine doses — already corrected, skipped');
}

/** Records whose numbers survive and where saying so is the finding. */
const NOTE_ONLY: { slug: string; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'ibrutinib', refs: ['PMID:26382728'],
    note: 'PK: THE NUMBERS ARE RIGHT, THE PROSE IS A FABRICATED CONSTRUCT, AND NOBODY SHOULD "CORRECT" THIS RECORD FIELD BY FIELD. At 420 mg it predicts an exposure of 720 ng.h/mL against the label verbatim "The mean steady-state AUC (% coefficient of variation) observed in patients at 420 mg with CLL/SLL is 708 (71%) ng x h/mL" — 1.7%. But its source_label claimed a "true Vd ~122 L" and an "apparent V/F ~4200 L", and the label says neither: "The volume of distribution (Vd) was 683 L, and the apparent volume of distribution at steady state (Vd,ss/F) was approximately 10,000 L." NOTE THAT 4200 x 0.029 IS 121.8. THE STORED VOLUME WAS MANUFACTURED BY MULTIPLYING AN APPARENT VOLUME BY F AND RELABELLING THE PRODUCT A TRUE VOLUME, which the solver then divides by F again, restoring it. It is self-cancelling, which is why the exposure lands — and ANYONE WHO REPLACES IT WITH THE LABEL REAL 683 L INTRODUCES A 5.6x ERROR. Two further errors also cancel: the stored F is the FASTED single-dose figure, "Absolute bioavailability of ibrutinib in fasted condition was 2.9%", while the exposure it reproduces is from patients dosing without regard to food, where the measured availability is two to three times higher. The half-life is the midpoint of a printed "4 hours to 6 hours". Its refs[] was EMPTY.',
    summary: 'ibrutinib — an apparent volume x F relabelled a true Vd; self-cancelling, DO NOT correct' },
  { slug: 'rimegepant', refs: ['PMID:36808268'],
    note: 'PK: TWO FORMAL DEFECTS THAT CANCEL TO WITHIN 4% OF A REAL MEASUREMENT — DO NOT FIX EITHER. The stored volume is COMPUTED, the sum of a published apparent central and peripheral volume, and the stored bioavailability is an uncited label figure; the paper own wording confirms both are apparent. And yet, against a dose- AND FORMULATION-matched study of the same 75 mg orally disintegrating tablet — "mean values were 937 ng/mL (maximum concentration), 4582 h*ng/mL (area under the concentration-time curve, 0 to infinity), 7.7 hours (terminal elimination half-life), and 19.9 L/h (apparent clearance)" — this record reproduces exposure at +3.9%. PINNING F TO 1, THE APPARENT CLASS-6 FIX, MAKES IT +62%; ADOPTING THE VERBATIM 7.7 h HALF-LIFE ALONE MAKES IT -27%. The absorption rate is verbatim from a population fit, with the caveat that it belongs to a model whose four transit compartments carry the delay, so lifting it alone discards that structure. A residual is recorded as irreducible: the peak is under-predicted about threefold because the central volume is 2.4 times smaller than the steady-state volume and one compartment cannot hold both. My formulation question is answered — the cited model IS orally-disintegrating-tablet-inclusive; the record SECOND reference is the capsule free-base study and its half-life range is not the source of the stored value.',
    summary: 'rimegepant — computed V and uncited F cancel to +3.9%; both "fixes" make it worse' },
  { slug: 'ruxolitinib', refs: ['PMID:23677817'],
    note: 'PK: VERIFIED, AND SAYING SO CLEARLY IS THE POINT. Every value is sourceable and the arithmetic lands at 1.1%: implied clearance 17.5 L/h against the label verbatim "Ruxolitinib clearance (%CV) was 17.7 L/h in women and 22.1 L/h in men with MF", independently corroborated by a population analysis giving "22.1 and 17.7 L/h for a typical male and female subject" and by the label own dose-ranging exposures. The volume is the label verbatim steady-state figure and the half-life is verbatim in three separate sources. A DIGIT COLLISION WAS AVAILABLE AND CHECKED: a population paper reports a "median weight of 72.9 kg" beside this record volume of 72 L, but the label figure is independent and the resemblance is coincidence. The two-compartment risk flagged in that review does not bite — the predicted peak is only 1.3-1.5x low, which is ordinary one-compartment behaviour rather than the structural failure seen elsewhere in this batch. Only the citation moves: the previously cited review supports the bioavailability but not the volume or half-life. One prose nit: the mechanism string says 5.4 h for the extended-release form where the label says approximately 5.',
    summary: 'ruxolitinib — verified to 1.1%; a weight-versus-volume digit collision checked and dismissed' },
  { slug: 'rasagiline',
    note: 'PK: THE ABSENCE OF AN EFFECT COMPARTMENT AND OF OCCUPANCY ROWS IS DELIBERATE AND CORRECT, AND IS RECORDED HERE SO NOBODY "COMPLETES" THE RECORD. Rasagiline is an IRREVERSIBLE MAO-B inhibitor: its plasma half-life is nearly irrelevant to its duration of effect, which is governed by enzyme resynthesis over weeks. A keo cannot represent that, and the reason stated in an earlier version of this note was WRONG and is corrected here: it is NOT that a linear filter must return to baseline as plasma clears — a filter terminal slope is min(ke, keo), so a slow enough keo would decay slowly. The real reasons are that a keo slow enough to reproduce weeks of effect would ALSO delay ONSET by the same rate, which is near-immediate here; that effect-site amplitude scales as keo/ke, so buying a slow decay collapses the signal into something ec50 would have to silently absorb; and decisively, that a linear filter has UNITY STEADY-STATE GAIN and therefore cannot ratchet, whereas irreversible inactivation accumulates across doses. A keo tuned to weeks would also wrongly delay ONSET, which is near-immediate. Positron emission tomography confirms the mechanism: "Gradual recovery toward the baseline state was observed in the weeks after termination of treatment ... compatible with the known rate of de novo synthesis of MAO-B, confirming the irreversible binding of rasagiline." CLASS 6 IS ACQUITTED — the stored volume is a steady-state figure computable only from intravenous data, and an absolute bioavailability requires an intravenous arm. A LIMITATION NOBODY HAD LOGGED: rasagiline is TIME-DEPENDENT, the mirror of carbamazepine autoinduction — "Overall systemic exposure was approximately theefold on day 7 versus day 1. The mean terminal elimination half-life (t1/2) was nearly doubled on day 7 compared to day 1." The stored half-life is the steady-state value; one parameter set cannot describe both states.',
    summary: 'rasagiline — its empty keo/occupancy fields are correct for an irreversible inhibitor' },
  { slug: 'methimazole',
    note: 'PK: MY CARBIMAZOLE CONCERN IS REFUTED AND A 2x ARITHMETIC MISS IS DELIBERATELY ACQUITTED. The analyte question is settled by the citation itself, which dosed methimazole directly by both routes — "Following intravenous administration of 10mg to healthy subjects" and "absolute bioavailability after oral administration of 10mg methimazole in the fasting state was high, with a mean of 93%" — so these are not carbimazole-derived values. The clearance test fires at 2.0x against a review stating "a total clearance of about 200ml/minute", AND THAT REVIEW CONTRADICTS ITSELF: its own 40 L volume and 200 mL/min imply a 2.3 h half-life against its own stated 3 to 5 hours. The likely explanation is in the same literature — "Incomplete absorption of carbimazole could explain particular high apparent volumes of distribution and apparent clearances" — so that figure is plausibly an inflated apparent clearance from carbimazole dosing. A 40 L volume is about total body water, which is right for a 114-dalton virtually unbound drug, and pairing it with the primary intravenous half-life is the more defensible set. RECORDED AS A NEAR-MISS SO NOBODY "CORRECTS" IT. The volume is verbatim but in a DIFFERENT reference than the one cited for it, and both are already present. THE EMPTY EFFECT COMPARTMENT IS ALSO CORRECT: this drug is "concentrated in the thyroid gland, exerting an effect on intrathyroidal iodine metabolism for periods exceeding those in which serum concentrations can be measured", which a keo cannot represent.',
    summary: 'methimazole — a 2x miss acquitted; the comparator review contradicts itself' },
  { slug: 'etoricoxib', refs: ['PMID:12638395', 'PMID:12527704'],
    note: 'PK: BOTH OCCUPANCY ROWS ARE GENUINE HUMAN WHOLE-BLOOD ASSAYS AND THEIR FREE-FRACTION EXEMPTION IS CORRECT — the question that produced a live 333x error on diclofenac. Verbatim: "Etoricoxib selectively inhibited COX-2 in HUMAN WHOLE BLOOD ASSAYS in vitro, with an IC(50) value of 1.1 +/- 0.1 microM for COX-2 ... compared with an IC(50) value of 116 +/- 8 microM for COX-1", and both conversions check exactly. The cited PK paper reports only geometric mean ratios and supports none of the four stored values, but UNLIKE MOST SUCH CASES IN THIS BATCH every value is verbatim-sourceable elsewhere and the set survives the arithmetic: implied clearance 3.78 L/h against a measured intravenous 3.42, an 11% agreement, so the stored volume is a real intravenous-anchored figure rather than an orphaned population estimate. A RESIDUAL IS RECORDED AS IRREDUCIBLE: the predicted peak is 3.3x below observation, the same two-compartment signature seen on nimodipine, and matching it would require a volume that breaks the verified clearance. The previously cited paper stays as a legitimate interaction citation. One prose defect: the effect-compartment note claims an oral Tmax of about 1 h where the observed value is 2.6-3.3 h.',
    summary: 'etoricoxib — both COX rows verified as whole-blood; PK acquitted at 11%' },
];
for (const f of NOTE_ONLY) {
  const c = need(f.slug);
  if ((c.notes ?? '').includes(f.note.slice(0, 60))) { log.push(`${f.slug} — already noted, skipped`); continue; }
  if (f.refs?.length) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary);
}

/** ibrutinib's source_label asserted a "true Vd" that its own label refutes. */
{
  const c = need('ibrutinib');
  const po = c.pk?.PO;
  const REPLACEMENT = 'FDA label: Imbruvica 560 mg PO qd: Tmax 1-2 h, t half 4-6 h, F 2.9% fasted. V_L 122 is NOT a true volume — the label gives Vd 683 L and Vd,ss/F ~10,000 L. It is a fitted surrogate (4200 x F) the solver re-divides by F, reproducing the label AUC 708 ng*h/mL to 1.7%. Do not replace with 683.';
  if (po && typeof po.source_label === 'string' && po.source_label.includes('true Vd ~122 L')) {
    po.source_label = REPLACEMENT;
    log.push('ibrutinib — source_label no longer asserts a "true Vd" its own label refutes');
  } else log.push('ibrutinib source_label — already corrected, skipped');
}

/** metolazone: its citation supports nothing, and studies a different formulation. */
{
  const c = need('metolazone');
  const po = c.pk?.PO;
  if (po && po.source_pmid === 'PMID:29145890') {
    delete po.source_pmid;
    po.source_label = 'Zaroxolyn (metolazone) label — F ~65%, t half ~14 h. Label-grade: the cited study reports only dose-proportionality and a fed/fasted tmax ratio, and dosed 0.5/1/2 mg tablets — the rapid-acting Mykrox product, NOT interchangeable with the Zaroxolyn 2.5-20 mg this record doses.';
    addRefs(c, 'PMID:29145890');
    note(c, 'PK: A COMPLETE CITATION FAILURE PLUS A FORMULATION MISMATCH, AND THE MISMATCH IS PROVABLE FROM THE DOSE BLOCK. The cited study states not one of the four stored values — only that "The AUC and Cmax showed dose proportionality", that "The tmax of metolazone was increased by approximately 100% in the fed condition", and a null sex comparison — and it was the record ONLY reference. It also dosed 0.5, 1 and 2 mg tablets, the rapid-acting low-dose product, while this record is aliased Zaroxolyn and doses 2.5 to 20 mg; the two formulations differ about twofold and are explicitly not interchangeable. NO VERBATIM REPLACEMENT EXISTS: the canonical primary pharmacokinetic paper for this drug HAS NO ABSTRACT IN PUBMED AT ALL, only a title, and everything else indexed is rat, urinary-excretion pharmacodynamics or assay methodology. The four numbers are therefore kept and re-provenanced honestly to the label rather than left under a citation that cannot support them.',
    );
    log.push('metolazone — source_pmid supported nothing and studied another formulation; moved to source_label');
  } else log.push('metolazone provenance — already corrected, skipped');
}

/** Analyte declarations for records whose active metabolite carries part of the effect. */
const ANALYTES: Record<string, [string, string]> = {
  losartan: ['parent', 'losartan'],
  pentoxifylline: ['parent', 'pentoxifylline'],
  saxagliptin: ['parent', 'saxagliptin'],
};
for (const [slug, [kind, name]] of Object.entries(ANALYTES)) {
  const c = need(slug);
  if (c.pk_analyte) { log.push(`${slug} analyte — already declared, skipped`); continue; }
  c.pk_analyte = kind; c.pk_analyte_name = name;
  log.push(`${slug} — pk_analyte declared: ${kind}`);
}

/** Corrections to OUR OWN prose. */
const PROSE: { slug: string; find: string; note: string; summary: string }[] = [
  { slug: 'losartan', find: 'THE ONSET FIGURE IN THE keo NOTE IS FROM RATS',
    note: 'THE ONSET FIGURE IN THE keo NOTE IS FROM RATS AND READS AS HUMAN. Its source says "In renal hypertensive rats ... a different onset of action (valsartan at 1 h, losartan between 2 h and 24 h)" — the species flag the occupancy notes already use is missing here. SEPARATELY, THE fu NOTE ARITHMETIC IS MUDDLED: it describes the metabolite as "0.4-0.5% free, seven times lower", but the sevenfold comparator is the naive-donor 0.2%, while 0.4-0.5% are the dosed-volunteer values and are only about three times lower. The conclusion is unaffected. AND THE MODEL UNDERSTATES BLOCKADE BY DESIGN: EXP3174 has an area under the curve "about four times that of losartan" at roughly nine times the potency, so a parent-only record cannot represent total AT1 engagement.',
    summary: 'losartan — a RAT onset presented as human, and muddled fu arithmetic' },
  { slug: 'prazosin', find: 'THE OCCUPANCY NOTE NAMES THE WRONG AUTHORS',
    note: 'THE OCCUPANCY NOTE NAMES THE WRONG AUTHORS — it credits "Ford 1998" for a paper by Fukasawa, Taniguchi, Moriyama and colleagues. The affinity itself is verbatim and correct, AND THE RECORD AVOIDED A TENFOLD COLLISION AVAILABLE IN THE SAME SENTENCE: it took the human PROSTATE value rather than the human urethra value ten times larger. The effect-compartment note also quotes a 2.5 h half-life that silently contradicts the stored 3 h; both now come from the same intravenous study.',
    summary: 'prazosin — occupancy note credits the wrong authors; a 10x collision was avoided' },
];
for (const f of PROSE) {
  const c = need(f.slug);
  if ((c.notes ?? '').includes(f.find)) { log.push(`${f.slug} prose — already corrected, skipped`); continue; }
  note(c, f.note);
  log.push(f.summary);
}

/**
 * Two effect compartments justified by target residence time — which is exactly
 * what a keo cannot model. Demoted rather than deleted: both records carry
 * receptor_occupancy rows, and the standing rule forbids orphaning them.
 */
const GLIPTIN_KEO: Record<string, string> = {
  saxagliptin: 'Approximation; no published keo. THE PREVIOUS NOTE JUSTIFIED THIS BY TARGET RESIDENCE TIME, WHICH IS PRECISELY WHAT AN EFFECT COMPARTMENT CANNOT MODEL: a keo slow enough to reproduce slow target dissociation would ALSO delay onset by the same rate, and effect-site amplitude scales as keo/ke, so the fit collapses the signal. DPP-4 inhibition tracks plasma with no meaningful distributional delay, so this value is a placeholder retained only because a receptor_occupancy row needs one.',
  linagliptin: 'Approximation; no published keo. AS WITH SAXAGLIPTIN, THE PREVIOUS JUSTIFICATION WAS A TARGET OFF-RATE, WHICH A keo CANNOT REPRESENT — an effect compartment is a linear filter on plasma and cannot produce effect outlasting it. The magnitude also failed: 1 per hour is a 42-minute delay while the quoted off-rate is a 6.4 hour dissociation half-life. Retained as a declared placeholder only because a receptor_occupancy row requires one.',
};
for (const [slug, n] of Object.entries(GLIPTIN_KEO)) {
  const c = need(slug);
  if (!c.effect_compartment) throw new Error(`${slug} has no effect_compartment`);
  if (c.effect_compartment.note === n) { log.push(`${slug} keo note — already corrected, skipped`); continue; }
  c.effect_compartment.note = n;
  c.effect_compartment.approximated = true;
  log.push(`${slug} keo — note justified it by target residence, which a keo cannot model`);
}

/**
 * warfarin: the numbers are unsourced but empirically better than the fully
 * self-consistent alternative, so only the citation moves. Its stored 40 h
 * represents NEITHER enantiomer, which the racemate note now says.
 */
{
  const c = need('warfarin');
  const po = c.pk?.PO;
  if (po && po.source_pmid === 'PMID:18679669') {
    po.source_pmid = 'PMID:3542339';
    addRefs(c, 'PMID:18679669', 'PMID:6661352', 'PMID:2938614');
    note(c, 'PK: RE-POINTED WITHOUT OVERWRITING, AND THE REASON MATTERS. Its previous citation was a nebicapone interaction study reporting R- and S-warfarin peak and exposure values and no absorption rate, volume, bioavailability or half-life — class 1 for all four. The obvious replacement is already in this record refs[] and is fully self-consistent to three digits: "It distributes into a small volume of distribution (10 L/70kg) and is eliminated by hepatic metabolism with a very small clearance (0.2 L/h/70kg). The elimination half-life is about 35 hours." BUT ADOPTING IT WOULD MAKE THE MODEL WORSE: that set predicts an exposure BELOW the previously cited study own truncated observation, where the stored values bracket it. The stored numbers are label-grade and empirically defensible, so the citation moves and the values do not. THE STORED HALF-LIFE REPRESENTS NEITHER ENANTIOMER. Warfarin is a racemate whose two halves are kinetically different drugs: S-warfarin, which carries three to five times the anticoagulant potency, has a verbatim half-life of 25 h, while R-warfarin runs 37 to 47.8 h. 40 h is the label racemic figure, so THE MODEL OVER-PERSISTS THE ENANTIOMER DOING MOST OF THE WORK BY ABOUT 1.6x, and the schema cannot express two clearances. MY CROSS-ENANTIOMER-MEAN HYPOTHESIS WAS REFUTED — 40 is not the mean of any published pair — but the substance of the concern is worse than a mean would have been. ITS EMPTY effect_compartment IS CORRECT: warfarin PD is clotting-factor turnover, "the elimination half-life estimated from changes in prothrombin time is approximately 17 hours", so a keo here would have to be about 0.04/h, TWENTY-FIVE TIMES SMALLER than the 0.5-1/h its four sibling records carry. It must not inherit that default.');
    log.push('warfarin — re-pointed to a citation that supports it; racemate and keo-scale caveats recorded');
  } else log.push('warfarin — already re-pointed, skipped');
}

/** A reference supporting none of the three purposes. */
{
  const c = need('efavirenz');
  if ((c.refs ?? []).includes('PMID:18624683')) {
    c.refs = (c.refs ?? []).filter((p) => p !== 'PMID:18624683');
    log.push('efavirenz — dropped PMID:18624683, a clinical-efficacy review with no PK, occupancy or interaction content');
  } else log.push('efavirenz refs — already trimmed, skipped');
}

console.log(`${log.length} change(s):\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run. Pass --write to apply.');
