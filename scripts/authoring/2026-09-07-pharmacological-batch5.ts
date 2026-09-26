/**
 * 2026-09-07-pharmacological-batch5.ts
 *
 * Fifth batch of the pharmacological category: 40 compounds, eight agents.
 * Built around PRODRUGS and ACTIVE METABOLITES, because that class produced the
 * sharpest error in batch 4.
 *
 * ── The finding that dominates ──────────────────────────────────────────
 * For a prodrug whose active species never enters plasma, a plasma record does
 * not merely carry wrong numbers — it models the wrong molecule. sofosbuvir has
 * THREE species: a prodrug cleared in minutes, an intracellular triphosphate that
 * never appears in plasma, and an inactive metabolite carrying >90% of systemic
 * exposure. The record stored the least relevant one. tenofovir-alafenamide is
 * worse: its stored bioavailability of 0.25 is the 25 mg DOSE, and its stored
 * half-life describes a prodrug whose active species persists for 20.8 DAYS.
 *
 * ── A new defect shape: a CROSS-DRUG TRANSPLANT ─────────────────────────
 * empagliflozin's F 0.78 is DAPAGLIFLOZIN's absolute bioavailability, verbatim
 * from a paper reporting both. Empagliflozin has never been given intravenously
 * to humans and therefore has no absolute bioavailability at all. I screened the
 * catalog's congeneric families — gliflozins, gliptins, statins, triptans,
 * sartans, prazoles, dipines — and this is the ONLY shared bioavailability among
 * them, so the shape is real but isolated rather than systematic.
 *
 * ── Two impossibilities, both caught by arithmetic rather than by reading ──
 * eluxadoline stored V 80 L with F 0.01, implying a true volume of 0.8 L — below
 * plasma volume. oxybutynin stored 2 h orally and 7.5 h transdermally against one
 * volume, making clearance 3.75x lower through skin than through vein.
 *
 * ── And one live user-facing error ──────────────────────────────────────
 * loperamide's stored receptor affinity against its therapeutic plasma peak makes
 * the app render 45% mu-opioid occupancy at an ordinary dose, presenting a
 * gut-restricted antidiarrhoeal as a centrally-active opioid.
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
  { slug: 'apixaban', guard: (c) => c.pk?.PO?.V_L === 21,
    pk: { PO: { ka_hr: 0.781, V_L: 28.2, F: 1, source_pmid: 'PMID:39449344' } }, hl: { PO: 12 },
    refs: ['PMID:39449344', 'PMID:31089975'],
    note: 'PK: F 0.662 is verbatim and was the only sound value, but it cannot be kept alongside the replacement volume: the published 28.2 L is APPARENT, so F is pinned to 1 and the measured bioavailability recorded here instead. V 21 L was a number picked from inside a stated "17 to 26 L" range and is not even its midpoint; half-life 11.5 h appears nowhere. THE EFFECT COMPARTMENT IS REMOVED BECAUSE ITS OWN CITATION REFUTES IT: "Anti-FXa activity and mPT changes followed the apixaban plasma concentration-time profile; both were highly correlated with concentration (R2 = 0.99 and R2 = 0.93)". The effect is not decoupled, so a delay is structurally wrong. Two references carry no pharmacokinetics — an outcomes trial and a RABBIT thrombosis study.',
    summary: 'apixaban — keo refuted by its own citation (R²=0.99 with plasma); V was picked from inside a range' },

  { slug: 'dabigatran', guard: (c) => c.pk?.PO?.V_L === 60,
    pk: { PO: { V_L: 1860, F: 1, source_pmid: 'PMID:17506785' } }, hl: { PO: 14 },
    refs: ['PMID:17506785', 'PMID:18076218'],
    note: 'PK: A NOTE THAT DESCRIBED THE WRONG STUDY ENTIRELY. Its effect-compartment note read "IV dabigatran CARDIAC SURGERY, ROTEM CT endpoint"; the paper is FIVE SHEEP and the endpoint is thromboelastometric R-time. The quoted number and arithmetic were both right, but the note invented a human clinical population — a step beyond the batch-3 case where a note merely quoted an absent string. It is also contradicted by this record own pharmacokinetic citation, which reports "a rapid onset of action WITHOUT A TIME DELAY", and the entire dabigatran effect-compartment literature is animal-intravenous. Removed. A DOSE-BASIS ERROR IS LOGGED RATHER THAN SILENTLY FIXED: mw 471.51 is the ACTIVE species, correct for its half-life and volume, but the administered molecule is dabigatran ETEXILATE at 627.73, so a 150 mg dose is converted to moles 1.331x too high. This is the mirror image of the batch-4 prodrug failure. V 1860 L is the published apparent value with F pinned to 1, replacing an unsourced 60 L and a 0.07 that appears in no abstract. The half-life is the upper endpoint of a stated 12-14 h; no point value is published.',
    summary: 'dabigatran — its keo note described five sheep as human cardiac surgery; dose-basis error logged' },

  { slug: 'ranolazine', guard: (c) => c.pk?.PO?.V_L === 180,
    pk: { PO: { F: 0.35, source_pmid: 'PMID:16640453' } }, hl: { PO: 7 },
    refs: ['PMID:16640453'],
    note: 'PK: THE HALF-LIFE IS RELEASE-LIMITED, AND ITS OWN LITERATURE SAYS SO IN ONE SENTENCE: "Elimination half-life of ranolazine is 1.4-1.9 hours but is apparently prolonged, on average, to 7 hours for the ER formulation as a result of extended absorption (FLIP-FLOP KINETICS)". So the disposition value is about four times shorter, and the stored 7 h is retained only as the extended-release apparent value, now labelled. It also collided with its cited paper "500 mg twice daily for 7 DAYS", that paper actually reporting 6.4, 6.4, 6.7 and 6.28 h. V 180 L was the UPPER BOUND of a stated "85 to 180 L", and F 0.55 lay OUTSIDE the stated "35% to 50%" entirely; the lower endpoint is now carried. ELIMINATION IS SATURABLE — clearance falls from 45 to 33 L/h between 500 and 1000 mg twice daily — so no single clearance holds across the dose range. ka 0.4 dropped.',
    summary: 'ranolazine — half-life is flip-flop from the ER form; F 0.55 was outside the stated range' },

  { slug: 'cinacalcet', guard: (c) => c.pk?.PO?.F === 0.225,
    pk: { PO: { V_L: 1000, F: 1, source_pmid: 'PMID:19566113' } }, hl: { PO: 30 },
    refs: ['PMID:19566113'],
    note: 'PK: F 0.225 is the EXACT MIDPOINT of "poor oral bioavailability of 20 to 25%" — and that sentence is a BACKGROUND CLAIM in a NANOPARTICLE FORMULATION-DEVELOPMENT paper WHOSE SPECIES IS NEVER STATED, whose own result is merely a relative doubling against an aqueous suspension. Half-life 35 h is likewise the exact midpoint of a stated "30-40 hours"; the lower endpoint is now carried. NO CINACALCET VOLUME EXISTS IN ANY ABSTRACT — a search returns zero records — and there is no intravenous formulation, so the 1000 L is necessarily APPARENT; F is pinned to 1, which removes a double-division that had been inflating the effective volume to about 4400 L. The volume itself is retained as an unsourced label figure rather than deleted, because the resolver default would be twenty-fold too small for this drug. ka 0.3 dropped. Effect broadly tracks plasma: parathyroid hormone nadir at 2-3 h against a 2-6 h time to peak.',
    summary: 'cinacalcet — F was a midpoint from a nanoparticle paper of unstated species; V now apparent' },

  { slug: 'ledipasvir', guard: (c) => c.pk?.PO?.V_L === 290,
    pk: { PO: { F: 1, source_pmid: 'PMID:27193156' } }, hl: { PO: 47 },
    refs: ['PMID:24320933'],
    note: 'PK: its citation is a NARRATIVE REVIEW by the manufacturer, with no study, no subject count and no dose. The half-life of 47 h is verbatim there and is retained on that footing, but it CONFLICTS WITH THE PRIMARY, which reports "an extended plasma half-life of 37-45 h in healthy volunteers" — 47 lies outside that range. Every value derives from the fixed-dose combination because ledipasvir is never given alone. V 290 L appears in no abstract and is byte-identical to RALTEGRAVIR stored volume, from a paper that likewise states none — a duplicated placeholder across two unrelated antivirals. No intravenous formulation exists, so F is pinned to 1. ka 0.32 dropped; absorption is modelled zero-order with a lag.',
    summary: 'ledipasvir — review-only citation; V 290 L duplicated with raltegravir, sourced in neither' },

  { slug: 'raltegravir', guard: (c) => c.pk?.PO?.V_L === 290,
    pk: { PO: { F: 1, source_pmid: 'PMID:21746959' } }, hl: { PO: 7.8 },
    refs: ['PMID:21746959', 'PMID:33369217'],
    note: 'PK: zero-content — its citation is an atazanavir interaction study that used an INVESTIGATIONAL formulation and inflated exposure 1.67-fold with a co-administered inhibitor. The stored 9 h probably collides with its "atazanavir q.d. for 9 CONSECUTIVE DAYS". F 0.5 IS UNSOURCEABLE IN PRINCIPLE: searches for an absolute bioavailability or any intravenous raltegravir study return zero records, so F is pinned to 1. ABSORPTION IS THREE SEQUENTIAL TRANSIT COMPARTMENTS, delayed in pregnancy, CIRCADIAN, and formulation-dependent — the 600 mg tablet is 21% more bioavailable than the 400 mg and pregnancy cuts it 49% — so no single rate is admissible. An unusual reversal worth recording: the INTRACELLULAR half-life is 4.5 h, SHORTER than the 7.8 h plasma value, with "no intracellular accumulation or persistence" — the opposite of the other antivirals in this batch.',
    summary: 'raltegravir — F unsourceable in principle (no IV form exists); absorption is transit-compartment' },

  { slug: 'telithromycin', guard: (c) => c.pk?.PO?.V_L === 516,
    pk: { PO: { V_L: 203, F: 0.57, source_pmid: 'PMID:12476037' } }, hl: { PO: 9.81 },
    refs: ['PMID:11120961', 'PMID:12476037'],
    note: 'PK: half-life 9.81 h is REAL but belonged to a primary the record did not cite; its actual citation is a narrative review that says "approximately 10 hours" — a provenance defect rather than a value defect. F 0.57 is verbatim and is a genuine absolute bioavailability from a crossover against an intravenous infusion. V 516 L IS UNSOURCEABLE ANYWHERE: the review gives 2.9 L/kg after intravenous infusion, about 203 L, and 516 is neither that at any plausible weight nor the apparent volume derived from it. THIS RECORD IS THE LEGITIMATE VERSION OF THE PAIRING WE USUALLY FLAG: an intravenous-derived volume beside a measured absolute bioavailability is CORRECT, so only the number needed replacing. A trap inside that source is logged — "2.9" appears twice, as the volume in L/kg and as the initial half-life in hours. The stored half-life is also only one of two phases; a one-compartment model at 9.81 h misfits the first six hours, where a 2.87 h phase dominates. ka 1 dropped. Withdrawn from most markets for hepatotoxicity.',
    summary: 'telithromycin — V 516 L exists nowhere; the correct value is 203 L and the F pairing is legitimate' },

  { slug: 'fexofenadine', guard: (c) => c.pk?.PO?.V_L === 80,
    pk: { PO: { V_L: 163, F: 1, source_pmid: 'PMID:23422332' } }, hl: { PO: 3.75 },
    note: 'PK: F 0.33 IS AN INEQUALITY BOUND — "at least 33%" — and an absolute bioavailability for this drug does not exist: "not known because of a lack of studies of intravenous administration of this agent". F is therefore pinned to 1 and the volume stored as apparent, derived within the cited paper own placebo arm from its exposure and half-life. V 80 L was a template shared with five unrelated compounds. The half-life of 3.75 h is verbatim but is SAMPLING-WINDOW-LIMITED: the literature spans 3 to 17 h, and the drug shows flip-flop from slow absorption of a zwitterion. A SCALAR BIOAVAILABILITY IS NOT DEFENSIBLE ANYWAY — grapefruit juice alone moves exposure 2.8-fold. Both this record only reference and its receptor source are a TERFENADINE analogue paper: fexofenadine is terfenadine active metabolite, so the provenance is anchored to the parent drug rather than to this molecule. ka 1 dropped, the registry modal default appearing on 43 records.',
    summary: 'fexofenadine — F was an inequality bound; no absolute bioavailability exists for this drug' },

  { slug: 'cetirizine', guard: (c) => c.pk?.PO?.V_L === 35,
    pk: { PO: { V_L: 34.7, F: 1, source_pmid: 'PMID:15889300' } }, hl: { PO: 7.4 },
    refs: ['PMID:15889300', 'PMID:10543317'],
    note: 'PK: ka 4 IS CONTRADICTED BY THIS RECORD OWN REFERENCE, which states "a rapid absorption phase (Ka = 1.0-1.4 h(-1))" — about three times too fast — and no scalar can be taken from that range. V 35 L was the registry single most common value, shared by 31 records and identical to the resolver default; the measured figure is 34.7 L but it is APPARENT, so storing 35 beside F 0.7 gave an effective 50 L, 44% above the only measurement. F is pinned to 1. Parent inheritance from hydroxyzine was checked and is CLEAN — cetirizine is hydroxyzine active metabolite, but none of its numbers came from the parent. THE EFFECT MODEL IS A CLASS MISMATCH, NOT A WRONG NUMBER: the record cites a study that fits an INDIRECT-RESPONSE model, and its own quote verifies — peak concentration at 1 h against maximal effect at about 6 h — which an effect compartment at the stored rate cannot reproduce either.',
    summary: 'cetirizine — ka contradicted by its own ref; V was the registry default and the resolver default' },

  { slug: 'famotidine', guard: (c) => c.half_life_hr?.IV === 3.6,
    pk: { PO: { V_L: 79, F: 0.43, source_pmid: 'PMID:2892544' }, IV: { V_L: 79, F: 1, source_pmid: 'PMID:2888738' } },
    hl: { PO: 3.6, IV: 4 },
    note: 'PK: this record PASSES the two-arm check — its citation genuinely administered both oral and intravenous doses to the same six volunteers — and its volume is IV-derived at 1.13 L/kg, so pairing it with an independent bioavailability is CORRECT and was checked before judging. Two defects remain. The intravenous half-life of 3.6 h is the ORAL value copied across: the same paper states "an initial half-life (t1/2) of 0.5 h and a terminal t1/2 of 4.0 h" for the intravenous arm, and the half-life here is genuinely route-specific. And F 0.45 matches neither the stated "ranged from 20 to 66%" nor its midpoint; the measured figure of 43% is now carried. ka 1 dropped, the registry modal default.',
    summary: 'famotidine — IV half-life was the oral value copied across; its V/F pairing is legitimate' },

  { slug: 'ranitidine', guard: (c) => c.half_life_hr?.PO === 3,
    pk: { PO: { V_L: 96, F: 0.6, source_pmid: 'PMID:6125204' }, IV: { V_L: 96, F: 1, source_pmid: 'PMID:6125204' } },
    hl: { PO: 2.3, IV: 1.7 }, refs: ['PMID:6125204'],
    note: 'PK: the stored 3 h was wrong twice over and is a DIGIT COLLISION — its own paper reports 2.3 h oral and 1.7 h intravenous, and separately "a second peak at 3 +/- 0 h". The half-life is genuinely route-specific here and the paper gives the mechanism: more extensive biotransformation and biliary excretion after oral dosing, with renal recovery of 79% intravenously against 27% orally. ABSORPTION IS BIMODAL — "a first peak at 1.1 h and a second peak at 3 h" — so no single first-order rate is admissible at any value, and ka 1 is dropped rather than replaced. V 96 L and F 0.60 are BOTH verbatim and the volume is intravenous-derived, so that pairing is correct and is left alone. THE EFFECT-COMPARTMENT VALUE IS REMOVED FOR A STRUCTURAL REASON: the drug reaches its gastric pH target at 20-40 minutes while the plasma first peak is at 1.1 h, so the effect PRECEDES plasma, and an effect compartment can only delay effect, never advance it. Its note also said "oral" where the source studied EFFERVESCENT tablets, whose published selling point is faster onset.',
    summary: 'ranitidine — effect PRECEDES plasma, which no positive keo can represent; absorption is bimodal' },

  { slug: 'sotalol', guard: (c) => c.pk?.PO?.V_L === 126,
    pk: { PO: { ka_hr: 0.49, F: 1, source_pmid: 'PMID:9643622' }, IV: { F: 1, source_pmid: 'PMID:2373132' } },
    hl: { PO: 7.2, IV: 7.2 }, refs: ['PMID:9643622', 'PMID:2373132', 'PMID:8951189'],
    note: 'PK: zero-content — its citation reports only peak concentration and exposure. V 126 L is the EXACT MIDPOINT of a review "1.2-2.4 liters/kg" and F 0.95 the exact midpoint of "90-100%": two clean midpoints in one record. Both are dropped; the measured absolute bioavailability is 1.00 against an intravenous reference, and a genuine published absorption rate of 0.49 /h exists for the oral solution, which is stored with that formulation caveat since a tablet is slower. Half-life 7.2 h replaces an unsourced 12 h. THE EFFECT COMPARTMENT IS DEMOTED, NOT DELETED, because occupancy rows need one — but it is contradicted for the class-III action: "The correlation between the plasma concentration of (+/-)-sotalol and prolongation of QTc intervals was nearly linear, and SHOWED NO HYSTERESIS". Beta-blockade behaves oppositely, so one value cannot serve sotalol two actions either way. ANALYTE: this is a racemate in which only l-sotalol carries beta-blockade while both enantiomers block potassium channels, so a beta-blockade endpoint driven off total drug is over-driven about twofold. Renally cleared, so the half-life tracks creatinine clearance rather than being a constant.',
    summary: 'sotalol — two clean range midpoints; its keo is contradicted for the QT endpoint' },

  { slug: 'nebivolol', guard: (c) => c.pk?.PO?.V_L === 700,
    pk: { PO: { V_L: 673, F: 0.12, source_pmid: 'PMID:9112066', source_label: 'F ~12% is a label/secondary figure; no abstract states an absolute bioavailability for nebivolol. Retained under label provenance because the resolver default would be sevenfold too high.' } },
    hl: { PO: 10.3 }, refs: ['PMID:9112066', 'PMID:17094780'],
    note: 'PK: zero-content, and a population mismatch — its citation is a CHRONIC KIDNEY DISEASE and haemodialysis study reporting only enantiomer exposures. V 700 L is a rounding of a 673 L the cited paper never gives; the real figure is an intravenous-derived steady-state volume, so pairing it with a bioavailability is correct. A SINGLE SCALAR IS NOT DEFENSIBLE: steady-state concentrations are 10 to 15-fold greater in CYP2D6 poor metabolisers, clearance falls from 51.6 to 15-18 L/h and the half-life rises from 10.3 to 32-34 h, so this record should really be two phenotype rows. THE EFFECT IS DECOUPLED IN AN UNUSUAL DIRECTION: despite that 10 to 15-fold exposure difference, "EMs and PMs displayed similar BP responses", attributed to active hydroxylated metabolites — so the parent curve is not the effect driver in extensive metabolisers. ITS EFFECT-COMPARTMENT VALUE IS REMOVED: it was borrowed from a RAT S(-)-ATENOLOL study, and the "2.52" its note attributed to that paper does not appear there — it is a unit conversion of 0.042 per minute presented as the paper figure.',
    summary: 'nebivolol — keo borrowed from rat atenolol, and the quoted number is absent from that paper' },

  { slug: 'labetalol', guard: (c) => c.half_life_hr?.PO === 6,
    pk: { PO: { V_L: 660, F: 0.18, source_pmid: 'PMID:7203731' }, IV: { V_L: 660, F: 1, source_pmid: 'PMID:7203731' } },
    hl: { PO: 4.9, IV: 4.9 }, refs: ['PMID:1884570'],
    note: 'PK: F 0.18 is verbatim and stands, and V 660 L IS INTRAVENOUS-DERIVED — a steady-state volume of 9.41 L/kg — so pairing the two is CORRECT and was checked before judging; had it been an oral apparent volume, dividing by F again would have inflated it about 5.5-fold. Half-life corrected 6 to the stated 4.9 h. ITS EFFECT-COMPARTMENT VALUE IS REMOVED ON TWO GROUNDS: it was borrowed from a rat single-enantiomer atenolol study under a "class-typical" label that is not a real quantity, and its note claim of "no published keo" is FALSE — this record own cited paper fits an effect compartment and reports a significant correlation, it simply does not print the rate. FOUR STEREOISOMERS SHARE THIS RECORD with different actions: the parent is an alpha-1 antagonist while one isomer, about a quarter of the material, is a beta-2 agonist with negligible alpha affinity. A reference is a paper on alpha-1 AGONISTS in which labetalol, an antagonist, does not appear.',
    summary: 'labetalol — its V/F pairing is legitimate; the "no published keo" claim was false' },

  { slug: 'verapamil', guard: (c) => c.half_life_hr?.PO === 5,
    pk: { PO: { V_L: 270, F: 0.2, source_pmid: 'PMID:7202473' }, IV: { V_L: 270, F: 1, source_pmid: 'PMID:971476' } },
    hl: { PO: 5.38, IV: 5.38 }, refs: ['PMID:6508982', 'PMID:7202473', 'PMID:971476'],
    note: 'PK: the oral half-life of 5 h is a TMAX COLLISION — its paper states "time to peak plasma concentrations of 4.91+/-0.89h" — and that paper actual oral half-life is 55.1 h, because THE CITED STUDY USED A RETARD FORMULATION on a route the registry lists as plain oral. Its input is time-varying and INCOMPLETE at 39.17% cumulative, so no first-order rate can represent it, and ka 0.5 is dropped. The route split is resolved by a same-subject two-route study: 4.03 to 5.38 h for the two enantiomers "following oral administration ... were similar to those previously obtained following intravenous administration". V 130 L was an unsourced back-calculation two to three times too small; the measured range is 270 to 460 L and the lower endpoint is stored. THE MOST IMPORTANT FINDING IS NOT A NUMBER: first-pass is STEREOSELECTIVE, giving a (+)/(-) plasma ratio of 4.92 orally against about 2 intravenously, while the (-) enantiomer is 8 to 10 times more potent on conduction — so "the serum concentration-response curve after oral application is displaced towards the right reflecting lower potency". The SAME total concentration is two to three times less potent orally, which no effect compartment can fix. Two references are victim-drug studies with no verapamil kinetics.',
    summary: 'verapamil — oral half-life was a Tmax; the cited study was a RETARD form on an IR route' },

  { slug: 'doxazosin', guard: (c) => c.pk?.PO?.V_L === 100,
    pk: { PO: { F: 0.65, source_pmid: 'PMID:2884857' } }, hl: { PO: 12.6 },
    refs: ['PMID:2884857', 'PMID:6123342', 'PMID:6135439'],
    note: 'PK: the half-life of 12.6 h is verbatim, is correctly the HEALTHY-VOLUNTEER subgroup rather than the renal-failure arm or a pooled average, and is confirmed route-independent at about 9 h after both oral and intravenous dosing. F 0.65 is real but belongs to a REVIEW, not to the cited paper, which was oral-only and could not have measured an absolute bioavailability; it is re-attributed and flagged review-grade. V 100 L is dropped as a probable midpoint of a review "1.0 to 1.9 liters/kg". THIS RECORD HAS THE ONE EFFECT-COMPARTMENT VALUE IN ITS GROUP THAT SURVIVES, AND THE AUDIT FOUND A BETTER ANCHOR FOR IT: the stored quote verifies verbatim, but its oral-versus-oral comparison is confounded by absorption, whereas two intravenous studies show blood-pressure effect maximal at 5-6 h AFTER AN INTRAVENOUS DOSE — unambiguous biophase delay with absorption removed. The note claim of "no published keo" is corrected: one was fitted and reported significant, though the rate is not printed. Unusually for this batch, enantiomers are not an issue — racemic, R- and S-doxazosin have indistinguishable potency.',
    summary: 'doxazosin — the one surviving keo, and the audit found a better IV anchor for it' },

  { slug: 'ibuprofen', guard: (c) => c.pk?.PO?.V_L === 10,
    pk: { PO: { ka_hr: 1.52, V_L: 9.3, F: 1, source_pmid: 'PMID:11678782' },
          IV: { V_L: 9.3, F: 1, source_pmid: 'PMID:11678782' } }, hl: { PO: 1.9, IV: 1.9 },
    refs: ['PMID:11678782', 'PMID:2109643', 'PMID:9515184'],
    note: 'PK: V 10 L IS THE DOSE — the cited study gave "single dose 10 mg; double dose 20 mg total", against a therapeutic 200 to 800 mg, in ELDERLY subjects sampled for only six hours. THIS RECORD OWN REFERENCE CONTAINS THE SENTENCE THAT INVALIDATES ITS PHARMACOKINETIC BLOCK: "data generated using nonstereospecific assays may not be extrapolated to explain the disposition of the individual enantiomers", with substantial unidirectional inversion of the inactive R-enantiomer to the active S. Every stored value describes racemic total drug. ka 2 was refuted by its own citation, predicting a 1.04 h peak against a stated 1.6-1.8 h; a genuine published rate of 1.52 /h now replaces it, alongside a summed apparent volume from the same fit. F is pinned to 1 because absolute bioavailability is essentially complete at 102.7% — which is also why THE INTRAVENOUS ROW IS KEPT AND GIVEN THE SAME VOLUME: at complete bioavailability the oral apparent volume is the true one, so it transfers legitimately even though the cited study ran no intravenous arm. The transdermal route is removed as declared with no parameters and no citation. The effect-compartment value verifies and is the one sound number the record already had.',
    summary: 'ibuprofen — V 10 L was the 10 mg DOSE; its own ref says racemic data cannot describe the active enantiomer' },

  { slug: 'diclofenac', guard: (c) => c.pk?.PO?.V_L === 14,
    pk: { PO: { F: 0.651, source_pmid: 'PMID:15606444' } }, hl: { PO: 1.92 },
    refs: ['PMID:15606444', 'PMID:3369245'],
    note: 'PK: the half-life of 1.92 h is verbatim and correctly taken from the reference-diclofenac arm rather than averaged with the nano-formulation arms. F 0.55 appears nowhere in the cited paper, whose only bioavailability statement is a relative one; the measured absolute figure of 65.1% at 25 mg against an intravenous reference now replaces it. V 14 L and ka 4 are unsourced, and the rate is refuted by the paper own 0.80 h time to peak. THE TRANSDERMAL AND INTRAMUSCULAR ROUTES ARE REMOVED, AND THE TRANSDERMAL ONE MATTERS: patch steady-state peak concentration is 3.36 ng/mL against an oral 50 mg peak of 1316 ng/mL — roughly 400-FOLD lower systemic exposure — so a transdermal row inheriting the oral block would be grossly wrong. Absorption is formulation-dependent and lagged, the enteric-coated form having a stated 2.2 h lag. The record only reference dosed a SUSTAINED-RELEASE product while the block models immediate release, and reports no kinetics at all.',
    summary: 'diclofenac — TD exposure is ~400x lower than oral; that route inherited the oral block' },

  { slug: 'ketorolac', guard: (c) => c.pk?.IV?.V_L === 13,
    pk: { IV: { V_L: 7.7, F: 1, source_pmid: 'PMID:3264245' }, IM: { V_L: 7.7, F: 1, source_pmid: 'PMID:3264245' }, PO: { V_L: 7.7, F: 1, source_pmid: 'PMID:3264245' } },
    hl: { IV: 5.09, IM: 5.09, PO: 5.09 }, refs: ['PMID:8148223'],
    note: 'PK: this record PASSES the three-arm check — its citation genuinely dosed intravenously, intramuscularly and orally in a fifteen-subject crossover — and its volume is intravenous-derived, so the pairing with bioavailability is correct. The half-life of 5.09 h is verbatim and legitimately shared across routes. But V 13 L matches NEITHER stated value: the paper gives a steady-state 0.11 L/kg, which is 7.7 L, and a terminal 0.17 L/kg, which is 11.9 L; 13 L requires an undeclared 76.5 kg. Both absorption rates are refuted by the paper own peak times and INVERT its ordering — it reports intramuscular and oral peaks differing by 0.1 h while the stored rates differ by 59%. Bioavailability is stated only qualitatively as "essentially complete", so the 0.9 becomes 1 with that qualitative basis recorded. ANALYTE: this is a racemate whose S-enantiomer carries essentially all analgesia and clears about 2.4 times faster, so 5.09 h describes neither active species; an honest caveat is that the enantiomer half-lives available come from an assay a later paper shows RACEMIZES the drug.',
    summary: 'ketorolac — V 13 L matches neither stated value; its ka pair inverts the paper own ordering' },

  { slug: 'sulindac', guard: (c) => c.pk?.PO?.V_L === 15,
    pk: { PO: { F: 0.88, source_pmid: 'PMID:300048' } }, hl: { PO: 18.2 },
    refs: ['PMID:300048', 'PMID:4042521', 'PMID:8366178'],
    note: 'PK: THE CLEANEST CHIMERA IN THE AUDIT — ONE NUMBER, ONE SENTENCE, ENTERED TWICE. The cited abstract contains exactly one half-life and it is explicitly the METABOLITE: "The latter, which all available evidence indicates to be the pharmacologically active form of sulindac ... has an apparent terminal half-life of 18.2 hr". There is no parent half-life in that paper at all. That single figure was entered once correctly as the sulfide in the effect note and once incorrectly as the parent oral half-life. The stored mass of 356.41 is the parent sulfoxide while the sulfide is 340.42, so the record mass and its half-life describe DIFFERENT MOLECULES — and the record itself contained the evidence. The value is retained, now labelled as the active sulfide, and the parent value of about 1.98 h is recorded in prose. F 0.88 IS A FRACTION ABSORBED WITH ITS HEDGE STRIPPED — "a MINIMUM OF APPROXIMATELY 88% of an oral dose is ABSORBED" — which is not bioavailability for a drug cleared by hepatic oxidation and reduction. ABOUT HALF THE ACTIVE SULFIDE IS MADE BY COLONIC BACTERIA: in ileostomy patients the late exposure fraction falls from 55% to 7%. A first-order gastric rate is the wrong model in kind, and ka 1.18 is dropped. V 15 L is unsourced and no intravenous study exists.',
    summary: 'sulindac — one metabolite half-life entered twice, once mislabelled as the parent' },

  { slug: 'isotretinoin', guard: (c) => c.pk?.PO?.V_L === 35,
    pk: { PO: { V_L: 85, F: 1, source_pmid: 'PMID:17224928' } }, hl: { PO: 20 },
    refs: ['PMID:6957421', 'PMID:17224928', 'PMID:6582073'],
    note: 'PK: the half-life of 20 h is REAL but belonged to the record other reference; the cited paper states 10 h and 16 h. V 35 L was the registry single most common value, shared by 31 records and identical to the resolver default, and was never measured — no intravenous formulation exists, so no true volume can. It is replaced by the published apparent 85 L with F pinned to 1. F 0.25 has no primary anywhere; candidate origins are a review or the cited paper own "25 DAYS" of dosing. ABSORPTION IS ZERO-ORDER WITH A 40-MINUTE LAG, plus enterohepatic recycling producing secondary and tertiary peaks and a 1.5 to 2-fold food effect, so a first-order rate is wrong in kind and ka 1.56 is dropped. The record correctly has NO effect compartment and must never acquire one: the sebaceous pharmacology develops over weeks to months, and an active 4-oxo metabolite exceeds the parent at steady state. A reference is a hypervitaminosis A review containing no kinetics.',
    summary: 'isotretinoin — V was the registry default; absorption is zero-order with a lag' },

  { slug: 'empagliflozin', guard: (c) => c.pk?.PO?.F === 0.78,
    pk: { PO: { F: 1, source_pmid: 'PMID:23149871' } }, hl: { PO: 11.7 },
    refs: ['PMID:22823746', 'PMID:26511213'],
    note: 'PK: A NEW DEFECT SHAPE — A CROSS-DRUG TRANSPLANT. F 0.78 is DAPAGLIFLOZIN absolute bioavailability, verbatim from a paper reporting "F(p.o) values for saxagliptin and dapagliflozin were 50% ... and 78%". Empagliflozin HAS NEVER BEEN GIVEN INTRAVENOUSLY TO HUMANS and therefore has no absolute bioavailability at all, so F is pinned to 1. I screened the catalog congeneric families — gliflozins, gliptins, statins, triptans, sartans, prazoles, dipines — and this is the ONLY shared bioavailability among them, so the shape is real but isolated. V 70 L is dropped for the same reason: with no intravenous data no true volume exists. The half-life of 11.7 h is retained but relabelled — every published value for this drug is a RANGE, and 11.7 is the maximum of a stated "7.76 to 11.7 h" across dose groups. ITS EFFECT-COMPARTMENT VALUE IS AN IN-VITRO RADIOLIGAND DISSOCIATION HALF-LIFE from HEK293 cell membranes, and it was copied WITHOUT CONVERSION — a one-hour half-life is a rate of 0.693, not 1. Absorption is SEQUENTIAL ZERO-THEN-FIRST-ORDER, so ka 2.59 is dropped as the wrong model.',
    summary: 'empagliflozin — F 0.78 is DAPAGLIFLOZIN value; a cross-drug transplant, screened and isolated' },

  { slug: 'repaglinide', guard: (c) => c.pk?.PO?.V_L === 30,
    pk: { PO: { F: 0.625, source_pmid: 'PMID:9877000' } }, hl: { PO: 1.7 },
    refs: ['PMID:9877000', 'PMID:15961978', 'PMID:10199798'],
    note: 'PK: zero-content on all four — its citation is a mass-balance study with no intravenous arm, reporting no half-life, volume, bioavailability or rate. F 0.6 is replaced by a measured 62.5% against an intravenous infusion. A SCALAR BIOAVAILABILITY IS THE LEAST DEFENSIBLE IN THIS BATCH: exposure varies 16.9-FOLD between individual healthy subjects, with transporter genotype alone accounting for 107 to 188% and a metabolising-enzyme variant for a further 48% reduction. Critically, "The elimination half-life of repaglinide was not associated with any SNP" — so the entire spread lives in bioavailability and first-pass, not in disposition, which is why the fix is a variability flag rather than a different scalar. The half-life is re-sourced to the only published point estimate, which is in ELDERLY type 2 diabetic subjects and is labelled as such. V 30 L is dropped: the only numeric candidate reports its volume in units of litres per hour and is an oral apparent value. The cited study also dosed an oral SOLUTION while the product is a tablet, whose absorption is slower. UNIQUELY IN ITS GROUP THE EFFECT IS COUPLED to plasma, so having no effect compartment is correct.',
    summary: 'repaglinide — zero-content; exposure varies 16.9-fold between individuals, all of it in F' },

  { slug: 'propylthiouracil', guard: (c) => c.half_life_hr?.PO === 1.5,
    pk: { PO: { V_L: 30, F: 0.8, source_pmid: 'PMID:6713763', source_label: 'V 30 L is review-derived (PMID:6172233, "around 30L for propylthiouracil"); no primary abstract states a human PTU volume.' } },
    hl: { PO: 1.25 }, refs: ['PMID:6688911', 'PMID:6172233'],
    note: 'PK: the half-life of 1.5 h is the exact MIDPOINT of a review "half-life of 1 to 2 hours", and the cited primary says only that half-lives were unchanged by surgery, giving no number; the measured value of 75 minutes now replaces it. V 30 L is real but belongs to that review, not to the cited paper — whose only volume sentence is about AMPICILLIN, the other drug in the study — and it is re-attributed under label provenance. A TRAP IS LOGGED SO A FUTURE PASS DOES NOT REVERSE THIS CORRECTLY-STORED VALUE: F 0.8 is genuinely a bioavailability, verbatim, but the same review states the drug is "about 80% protein-bound" — the exact coincidence that has produced four protein-binding-read-as-bioavailability errors elsewhere in this audit. This one is correct. Its population is intestinal-bypass patients, which is recorded. ka 1 is dropped, and no scalar is defensible: absorption rate is about three times higher in younger than elderly subjects. THE EFFECT IS PROFOUNDLY DECOUPLED and its own reference says so: the drug is "concentrated in the thyroid gland, exerting an effect on intrathyroidal iodine metabolism for periods exceeding those in which serum concentrations can be measured", rate-limited by turnover of stored hormone over weeks.',
    summary: 'propylthiouracil — half-life was a review midpoint; its F 0.8 is correct despite an 80% binding coincidence' },

  { slug: 'budesonide', guard: (c) => c.pk?.PO?.V_L === 200,
    pk: { PO: { V_L: 301, F: 0.107, source_pmid: 'PMID:6958498' } }, hl: { INH: 2.8, PO: 2.8 },
    refs: ['PMID:6958498', 'PMID:11736861', 'PMID:12468958'],
    note: 'PK: THERE IS NO SUCH THING AS "THE INHALED BIOAVAILABILITY" OF THIS DRUG. Systemic availability spans 15% to 39% and lung deposition 14% to 32% PURELY BY DEVICE — and plasma does not even order the systemic effect, since one device delivers more drug to plasma yet suppresses cortisol less. The inhaled and intranasal routes therefore carry no plasma block and should be keyed to device if they ever acquire one. The half-life IS legitimately route-independent, measured after inhalation, oral AND intravenous dosing in the same volunteers, so that structural practice was right; only the number and its sourcing were wrong, and 2.8 h now replaces an unsourced 3 h. V 200 L is replaced by the only human intravenous measurement, 301 L, and F by the plain-oral 10.7% from the same study rather than the 11% adult subgroup of six Crohn patients on a controlled-release capsule. ka 1 is dropped and is structurally wrong for the formulation the record cited: controlled ileal release shifts time to peak from 1.8 to 4.5 hours with over 60% absorbed from ileum and colon. A reference is a medicinal-chemistry paper that never mentions budesonide.',
    summary: 'budesonide — inhaled bioavailability spans 15-39% BY DEVICE; plasma does not order the effect' },

  { slug: 'roflumilast', guard: (c) => c.pk?.PO?.V_L === 200,
    pk: { PO: { V_L: 204, F: 0.79, source_pmid: 'PMID:21176727' } }, hl: { PO: 14.8 },
    refs: ['PMID:21176727', 'PMID:22059647', 'PMID:20690782'],
    note: 'PK: zero-content on all four, and THE PARENT IS THE WRONG ANALYTE WHILE THE RECORD ALREADY KNEW IT — its own effect note says "the active N-oxide sustains inhibition" yet every stored value describes the parent. The N-oxide "accounts for >90% of roflumilast total PDE4 inhibitory activity", reaches about TWELVE-FOLD higher exposure, and accumulates 169% against the parent 20-40%, so the two analytes reach steady state differently. Worse, the 21% of an oral dose that fails the bioavailability is NOT LOST BUT CONVERTED to the active N-oxide, so applying a parent bioavailability DISCARDS ACTIVE DRUG — the structure is biased, not merely incomplete. The parent values are now correctly sourced from the intravenous study the record never cited, which is internally consistent, and the volume is intravenous-derived so the pairing with bioavailability is right. Absorption is first-order WITH A LAG and the metabolite forms zero-order, so ka 1 is dropped. THE EFFECT-COMPARTMENT VALUE IS REMOVED: it was invented and attached to the analyte carrying under a tenth of the activity, against a clinical benefit that accrues over weeks. A reference is an in-vitro leukocyte study with no kinetics.',
    summary: 'roflumilast — parent-only model is BIASED: the failed fraction becomes the active metabolite' },

  { slug: 'temazepam', guard: (c) => c.pk?.PO?.F === 0.96,
    pk: { PO: { ka_hr: 1.31, V_L: 67, F: 1, source_pmid: 'PMID:2207300' } }, hl: { PO: 9.9 },
    refs: ['PMID:2891534', 'PMID:2858279'],
    note: 'PK: F 0.96 IS THE VOLUME OF DISTRIBUTION IN LITRES PER KILOGRAM. The cited abstract states "volume of distribution, 0.961 kg-1", and the registry used that one number TWICE — correctly scaled to a 67 L volume, and again as a bioavailability. A new shape: the same source figure entered into two different fields. No temazepam absolute bioavailability exists in PubMed at all, since no intravenous study has ever been done, so F is pinned to 1 and the volume is flagged apparent. The half-life of 11 h also matches two contaminants — a cimetidine INTERACTION arm at 11.4 h and the lower bound of an END-STAGE RENAL DISEASE range — while the paper own value of 9.9 h is the only one consistent with the clearance it also reports. A genuine published absorption rate replaces the unsourced one, taken from the NIGHT-TIME arm because this is a bedtime hypnotic; the morning arm differs, so this drug is measurably chronopharmacokinetic. EFFECT SHOWS CLOCKWISE HYSTERESIS — acute tolerance — so effect falls faster than plasma and no effect compartment should be added.',
    summary: 'temazepam — F 0.96 is the volume in L/kg, the same number used twice in two fields' },

  { slug: 'tizanidine', guard: (c) => c.pk?.PO?.V_L === 175,
    pk: { PO: { ka_hr: 2.31, F: 0.21, source_pmid: 'PMID:3447935' } }, hl: { PO: 3 },
    refs: ['PMID:3447935', 'PMID:6617726', 'PMID:15060511'],
    note: 'PK: its citation is a FOOD-EFFECT and formulation-comparison study reporting no half-life, no volume, no bioavailability and no rate — zero-content on all four. A SCALAR BIOAVAILABILITY IS INDEFENSIBLE: fluvoxamine raises exposure 33-FOLD, with a range of 14 to 103-fold within ten healthy people; oral contraceptives about fourfold; food about 1.45-fold. The measured 21% is stored with that CYP1A2-conditional caveat. V 175 L is dropped without replacement — it is a placeholder SHARED WITH SELEGILINE, and the best available source explicitly warns that any oral-derived tizanidine volume is "almost certainly overestimates", while no intravenous study exists. A genuine published absorption rate with a 0.36 h lag replaces the unsourced one, from a study in the indicated spasticity population rather than healthy volunteers, which is recorded. UNIQUELY IN ITS GROUP THE EFFECT IS COUPLED — relief "appeared greatest at the time of peak plasma levels" — so if anything the stored equilibration is too slow rather than too fast.',
    summary: 'tizanidine — a scalar F is indefensible when fluvoxamine moves exposure 33-fold' },

  { slug: 'oxybutynin', guard: (c) => c.half_life_hr?.TD === 7.5,
    pk: { PO: { V_L: 193, F: 0.06, source_pmid: 'PMID:3234461' }, TD: { zo_dur_hr: 96, V_L: 193, F: 1, source_pmid: 'PMID:12608543' } },
    hl: { PO: 2, TD: 2 }, refs: ['PMID:3234461', 'PMID:12608543', 'PMID:11496941'],
    note: 'PK: THE STORED HALF-LIVES MADE CLEARANCE ROUTE-DEPENDENT, WHICH IS IMPOSSIBLE. Against one volume, 2 h orally and 7.5 h transdermally imply a clearance 3.75 times lower through skin than through vein. The transdermal figure is a skin-depot flip-flop artefact encoded as disposition ON TOP of an already-explicit 96-hour zero-order input, counting the sustained release twice; one disposition value now serves both routes. The half-life and bioavailability were both correct but cited to a paper containing neither — an OROS controlled-release study reporting only relative bioavailability — and are re-sourced to the study that states them, which included intravenous arms so the volume pairing is legitimate. The zero-order duration is likewise real but belonged to an uncited paper. ka 2 EQUALS THE RECORD OWN HALF-LIFE IN HOURS, and here the copy direction is identifiable: the half-life is independently sourceable while no absorption rate exists anywhere, so the half-life was reused as a rate. THE ACTIVE METABOLITE CHANGES BY ROUTE: its ratio to parent is 4.1 orally against 1.2 transdermally, and the anticholinergic burden tracks the metabolite — which is precisely why the patch causes less dry mouth, an effect a parent-only model cannot show. A reference is a medicinal-chemistry paper on rat bladder.',
    summary: 'oxybutynin — stored half-lives made clearance 3.75x lower through skin than vein' },

  { slug: 'ceftriaxone', guard: (c) => c.half_life_hr?.IV === 8,
    pk: { IV: { V_L: 8.5, F: 1, source_pmid: 'PMID:3985603' }, IM: { V_L: 8.5, F: 1, source_pmid: 'PMID:3985603' } },
    hl: { IV: 8.1, IM: 8.1 }, refs: ['PMID:7249794', 'PMID:6275779'],
    note: 'PK: this record PASSES the two-route check — its citation genuinely dosed both intravenously and intramuscularly in a crossover — and its volume and intramuscular bioavailability are both verbatim. But the 8 versus 8.1 h split is a FABRICATED ROUTE DIFFERENCE: the paper reports one half-life for the crossover, and with a measured 100% intramuscular bioavailability there is no mechanism for a route difference anyway. BINDING IS SATURABLE ACROSS THE THERAPEUTIC RANGE, which the model cannot express: free fraction rises about fourfold, from 0.04 to 0.17, so total-drug volume runs 7.0 to 10.1 L and half-life 5.9 to 8.1 h between 0.15 and 3 g, while free-drug parameters stay dose-independent. The stored pair is therefore valid only at or below 1 g and will mis-predict at the 2 to 4 g meningitis regimens. ka 1.5 is dropped and is refuted by the paper own 1.4 h time to peak, which implies about 2.5 per hour.',
    summary: 'ceftriaxone — a fabricated route split; binding is saturable so V and t½ are dose-dependent' },

  { slug: 'dronabinol', guard: (c) => c.pk?.PO?.V_L === 700,
    pk: { PO: { F: 0.06, source_pmid: 'PMID:6250760' } }, hl: { PO: 4 },
    refs: ['PMID:6250760'],
    note: 'PK: V 700 L is the label APPARENT volume of 10 L/kg, and pairing it with a bioavailability of 0.1 UNDER-PREDICTED PLASMA CONCENTRATION TENFOLD; it is dropped rather than re-paired, since no true volume exists. The half-life of 2.75 h was a SIMULATION OUTPUT in a four-subject subgroup on a different formulation, and is shorter than even the alpha phase of the true biphasic profile, whose distribution phase is about 4 h and terminal phase 25 to 36 h; the alpha value is stored with that caveat. F 0.1 was the lower endpoint of a label range and is replaced by a measured 6% against an intravenous reference, with the caveat that its vehicle was a cookie rather than a sesame-oil capsule. ANALYTE: the 11-hydroxy metabolite is present "in approximately equal concentrations in plasma", is more potent, and its ratio to parent is route-dependent, so a parent-only curve represents about half the active material after oral dosing. EFFECT IS DECOUPLED WITH DOCUMENTED HYSTERESIS: "The appearance of high lagged behind the increase in plasma concentrations", and oral effects occur "at much lower plasma concentrations" than by other routes. Absorption is lagged and erratic with a fourfold food effect, so ka 0.5 is dropped.',
    summary: 'dronabinol — V 700 L paired with F 0.1 under-predicted concentration tenfold' },

  { slug: 'rosuvastatin', guard: (c) => c.pk?.PO?.V_L === 140,
    pk: { PO: { V_L: 134, F: 0.201, source_pmid: 'PMID:14667956' } }, hl: { PO: 19 },
    refs: ['PMID:14667956', 'PMID:16198652'],
    note: 'PK: F 0.2 is right but its cited paper is an oral-only mass-balance study with NO INTRAVENOUS ARM and could not have measured it; the real crossover exists, was uncited, and gives 20.1% alongside a steady-state volume of 134 L that is intravenous-derived, so the pairing is legitimate. V 140 L appears in no source. ka 0.595 is BACK-DERIVED rather than measured: against the stored half-life it reproduces a time to peak of exactly 5.00 h, and 5 h is itself the UPPER endpoint of a stated 3 to 5 h range; it is dropped. The half-life of 19 h is a genuine disposition value but is label-sourced, which is now recorded rather than attributed to a paper that does not state it. AN UNMODELLED TWOFOLD COVARIATE: exposure is 1.6 to 2.3 times higher in Chinese, Malay and Indian subjects than in white subjects — and, refuting the obvious explanation, the transporter genotype "did not account for the observed pharmacokinetic differences". THE EFFECT-COMPARTMENT VALUE IS REMOVED: the target is inside the hepatocyte, concentrated there by a transporter, and the clinical endpoint is cholesterol at four weeks, which no equilibration rate can bridge.',
    summary: 'rosuvastatin — its ka was back-derived to reproduce a Tmax that is itself a range endpoint' },

  { slug: 'zaleplon', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 89, F: 0.306, source_pmid: 'PMID:10211871' } }, hl: { PO: 1.05 },
    refs: ['PMID:11192136'],
    note: 'PK: THE BEST-SOURCED RECORD IN THIS BATCH, and it is recorded as such. Its half-life, volume and bioavailability all trace to one true intravenous-and-oral crossover, the half-life is the INTRAVENOUS value and therefore a genuine disposition parameter, and the volume is a steady-state figure from that same intravenous arm — so pairing it with the measured bioavailability is CORRECT, not the double-division it superficially resembles. Only ka 1.5 fails, appearing nowhere; the paper says merely that absorption was "rapid", and it is dropped rather than invented. A CAVEAT IS ADDED TO THE EFFECT-COMPARTMENT VALUE, WHICH ITSELF VERIFIES EXACTLY: its quote and arithmetic are both right, but the study delivered zaleplon as an INHALED AEROSOL against an arterial-like peak at 1.9 minutes, while this record models the oral route whose peak is around an hour. At the stored rate the effect site is numerically indistinguishable from plasma, so the parameter does no work here. The record also carries a reference that is a RAT behavioural study with no human content. The deeper limitation is duration rather than coupling: sedation returns to baseline in about four hours against an eight-hour night.',
    summary: 'zaleplon — the batch best-sourced record; only its ka fails, and its keo is from an inhaled study' },

  { slug: 'tranexamic-acid', guard: (c) => c.pk?.PO?.V_L === 119,
    pk: { PO: { V_L: 17.9, F: 0.34, source_pmid: 'PMID:7308275' }, IV: { V_L: 17.9, F: 1, source_pmid: 'PMID:31013357' } },
    hl: { PO: 2, IV: 2 }, refs: ['PMID:31013357'],
    note: 'PK: THE RECORD INTERNAL CONTRADICTION IS RESOLVED IN FAVOUR OF THE STORED NUMBER. Its own label text read "t1/2 ~11 h" against a stored 2 h, and both figures are real but describe DIFFERENT QUANTITIES: 11 h is the terminal phase seen by modern long-sampling assays, while 2 h is the dominant elimination phase — "Most elimination took place during the first eight hours, giving an apparent elimination half-life of approximately two hours". Elimination is renal and about 90% complete by 24 hours, so the terminal phase carries negligible exposure and the stored 2 h is the right value for a one-compartment model. The LABEL TEXT was the error, not the number, and it is corrected. There is no flip-flop: absorption is much faster than elimination, so one value legitimately serves both routes. V 119 L is wrong by four to twelvefold — published volumes are about 13 to 27 L — and is replaced by a pooled population estimate, flagged because that source is a meta-analysis rather than a single primary. F 0.45 is the label figure for a modified-release tablet in women, while the cited paper states 34% for immediate release, which is what this row models. EFFECT OUTLASTS PLASMA: antifibrinolytic concentrations persist in tissue for about 17 hours against a 2 h plasma phase.',
    summary: 'tranexamic-acid — the contradiction resolves for the stored number; our label text was the error' },
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

/** Routes declared with no PK block and no citation anywhere. */
const ROUTE_DROPS: Record<string, string[]> = { ibuprofen: ['TD'], diclofenac: ['TD', 'IM'] };
for (const [slug, routes] of Object.entries(ROUTE_DROPS)) {
  const c = need(slug);
  const gone = routes.filter((r) => (c.routes ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} routes — already trimmed, skipped`); continue; }
  c.routes = (c.routes ?? []).filter((r) => !gone.includes(r));
  for (const r of gone) if (c.doses && r in c.doses) delete c.doses[r];
  log.push(`${slug} — dropped unparameterised route(s): ${gone.join(', ')}`);
}

/**
 * References that support NOTHING on the record they sit on. Checked against all
 * three uses — PK provenance, receptor_occupancy and interactions — per the
 * standing rule adopted after four reversals of this exact judgement.
 */
const REF_DROPS: Record<string, string[]> = {
  apixaban: ['PMID:21870978', 'PMID:18315548'], // outcomes trial; rabbit thrombosis
  zaleplon: ['PMID:12122506'],                  // rat behavioural study
  budesonide: ['PMID:21880489'],                // med-chem paper not mentioning the drug
  labetalol: ['PMID:34355529'],                 // alpha-1 AGONISTS; labetalol is an antagonist
  verapamil: ['PMID:9663178', 'PMID:8198928'],  // victim-drug studies, no verapamil PK
  isotretinoin: ['PMID:3294938'],               // hypervitaminosis A review, no kinetics
  oxybutynin: ['PMID:22243489'],                // med-chem on rat bladder
  roflumilast: ['PMID:11259554'],               // in-vitro leukocytes, no PK
};
for (const [slug, refs] of Object.entries(REF_DROPS)) {
  const c = need(slug);
  const gone = refs.filter((r) => (c.refs ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} refs — already trimmed, skipped`); continue; }
  c.refs = (c.refs ?? []).filter((r) => !gone.includes(r));
  log.push(`${slug} — dropped non-substantiating ref(s): ${gone.join(', ')}`);
}

/**
 * Effect-compartment corrections. Records carrying receptor_occupancy rows keep a
 * value (the solver needs one) demoted to a declared approximation; the rest are
 * removed outright.
 */
const EC_FIXES: Record<string, { keo?: number; note?: string; why: string; pmid?: string }> = {
  apixaban: { keo: 2, note: 'Approximation; no published kₑₒ. RETAINED ONLY because receptor_occupancy rows need one, and it is REFUTED BY THIS RECORD OWN CITATION, which found anti-Xa activity tracking plasma directly — "a linear relationship with apixaban plasma concentration (R2 = 0.99)" — leaving no hysteresis for an effect compartment to represent. A value fast enough to be numerically inert is kept as a placeholder rather than a claim.', why: 'its own citation reports R²=0.99 with plasma — the effect is not delayed' },
  dabigatran: { keo: 39.98, note: 'Approximation. The NUMBER is defensible — coagulation effect follows plasma with no meaningful delay — but the previous note attributed it to human cardiac surgery when the source was FIVE SHEEP given the drug intravenously. The value is kept as a fast, effectively inert placeholder for the receptor_occupancy rows; the human claim is withdrawn.', why: 'note described five sheep as human cardiac surgery; human data show no delay' },
  ranitidine: { keo: 1.5, note: 'Approximation, retained only because a receptor_occupancy row needs one. IT HAS THE WRONG SIGN: gastric pH rises above 4 within 20 to 40 minutes of an oral dose while plasma peaks at about 3 h, so effect PRECEDES plasma — and an effect compartment can only delay effect, never advance it. No positive rate can represent this record pharmacodynamics; treat the curve as unmodelled.', why: 'effect PRECEDES plasma Cmax; an effect compartment can only delay, never advance' },
  nebivolol: { keo: 2.5, note: 'Approximation; no published kₑₒ. The previous value was BORROWED FROM RAT S(-)-atenolol, and the specific figure quoted in support of it does not appear in that paper at all. The number is kept only because receptor_occupancy rows need one; it rests on nothing measured in humans for this drug.', why: 'borrowed from rat S(-)-atenolol; the quoted 2.52 is absent from that paper' },
  labetalol: { keo: 2.5, note: 'Approximation. Same rat S(-)-atenolol borrowing as its congener, and the previous note claim that no human kₑₒ has been published was FALSE — effect-compartment analyses of this drug exist. Retained only because receptor_occupancy rows need a value; it is a placeholder, not a fitted parameter.', why: 'same rat borrowing; and its "no published kₑₒ" claim was false' },
  roflumilast: { keo: 1, note: 'Approximation, invented rather than fitted, and ATTACHED TO THE WRONG SPECIES: it sits on the parent, which carries under a tenth of total PDE4 inhibitory activity, while the N-oxide metabolite carries the rest and has a far longer half-life. Retained only because a receptor_occupancy row needs one.', why: 'invented, and attached to the analyte carrying under a tenth of the activity' },
  rosuvastatin: { keo: 1, note: 'Approximation, retained only because a receptor_occupancy row needs one. NO EQUILIBRATION RATE CAN BRIDGE THIS GAP: the target is inside the hepatocyte, where a transporter concentrates the drug well above plasma, and the clinical endpoint is LDL cholesterol measured at four weeks — a turnover process, not a distribution delay.', why: 'target is intra-hepatocyte and the endpoint is cholesterol at four weeks' },
  sotalol: { keo: 1, note: 'Approximation; no published kₑₒ. RETAINED ONLY because receptor_occupancy rows need one. It is CONTRADICTED for the class-III action — "The correlation between the plasma concentration of (+/-)-sotalol and prolongation of QTc intervals was nearly linear, and showed no hysteresis" — while beta-blockade behaves oppositely, its antagonism outlasting the plasma curve. One value cannot serve both of this drug two actions; treat it as a placeholder.', why: 'contradicted for QT, opposite for beta-blockade' },
  empagliflozin: { keo: 0.693, note: 'Approximation; no published kₑₒ. The previous value was an IN-VITRO RADIOLIGAND DISSOCIATION half-life measured on cell membranes — "binding to SGLT-2 is competitive with glucose (half-life approximately 1 h)" — copied WITHOUT CONVERSION, since a one-hour half-life is a rate of 0.693 rather than 1. The conversion is now done, but the quantity remains an in-vitro binding rate rather than an in-vivo equilibration.', why: 'an in-vitro binding half-life copied without converting to a rate' },
  cetirizine: { keo: 0.35, note: 'Approximation. The quote in the previous note VERIFIES verbatim — peak plasma within 1 h against maximal wheal suppression at about 6 h — but the source fits an INDIRECT-RESPONSE model rather than an effect compartment, so this is a model-class mismatch as much as a wrong number, and 0.35/h under-lags the observed 6 h peak in any case.', why: 'source fits an indirect-response model, a different model class' },
  loperamide: { keo: 2, note: 'Approximation, retained only because a receptor_occupancy row needs one. IT HAS THE WRONG SIGN: the antidiarrhoeal effect begins within about an hour against a capsule time-to-peak of 5.2 h, so effect PRECEDES plasma and an effect compartment can only delay. The target is gut-wall receptor seeing luminal concentrations orders of magnitude above plasma, so no plasma-linked value can be right.', why: 'effect precedes plasma; target is luminal, not systemic' },
  doxazosin: { keo: 0.3, note: 'Approximation; no published kₑₒ. THE NUMBER SURVIVES AUDIT and is re-anchored to a better source than the one previously quoted: the intravenous-and-oral study, where the effect is maximal 5 to 6 h after an oral dose against a plasma peak near 3 h — a genuine hysteresis measured against a route-independent input, not inferred from an oral time course alone.', why: 'the one surviving kₑₒ in this batch, re-anchored to the IV study' },
  zaleplon: { keo: 35.85, pmid: 'PMID:23436259', note: 'Sedation endpoint; abstract verbatim "equilibration half-life for sedation (t(1/2) k(e0)) was 1.16 (0.62, 2.17) minutes". QUOTE AND ARITHMETIC BOTH VERIFY — but THE STUDY DELIVERED THE DRUG AS AN INHALED AEROSOL, peaking at 1.9 minutes, while this record models the oral route peaking near an hour. At this rate the effect site is numerically indistinguishable from plasma, so the parameter does no work for an oral dose.', why: 'value verifies exactly, but the study route was inhaled, not oral' },
  fexofenadine: { keo: 0.3, note: 'Approximation; no published kₑₒ. Wheal suppression outlasts a 3.75 h plasma half-life, so some delay is right in direction, but no value is measured. Note this drug is terfenadine active metabolite and its receptor source is a terfenadine-analogue paper.', why: 'unchanged value, note corrected for provenance' },
};

for (const [slug, f] of Object.entries(EC_FIXES)) {
  const c = need(slug);
  if (!c.effect_compartment) { log.push(`${slug} kₑₒ — already handled, skipped`); continue; }
  if (f.keo == null) {
    if (c.receptor_occupancy?.length) { log.push(`${slug} kₑₒ — has occupancy rows, NOT removed`); continue; }
    delete c.effect_compartment;
    log.push(`${slug} — kₑₒ removed: ${f.why}`);
  } else {
    if ((f.note ?? '').length > 500) throw new Error(`${slug} kₑₒ note ${(f.note ?? '').length} > 500`);
    if (String(c.effect_compartment.note ?? '') === f.note) { log.push(`${slug} kₑₒ — already corrected, skipped`); continue; }
    c.effect_compartment = f.pmid
      ? { keo_per_h: f.keo, source_pmid: f.pmid, note: f.note }
      : { keo_per_h: f.keo, approximated: true, note: f.note };
    log.push(`${slug} — kₑₒ ${f.pmid ? 'kept, note corrected' : 'demoted to a declared approximation'}: ${f.why}`);
  }
}

/** Records where nothing survives. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  sofosbuvir: ['uncharacterized',
    'THREE SPECIES EXIST AND THE RECORD MODELLED THE LEAST RELEVANT. The dosed prodrug clears in minutes; the ACTIVE species is an intracellular triphosphate never seen in plasma; the measured analyte is an INACTIVE metabolite "accounting for >90% of systemic drug-related material exposure" with a 27 h half-life against the stored 0.5 h. V 140 L and F 0.8 have no analyte at all. Its own review reports "no exposure-response relationships for efficacy or safety".',
    ['PMID:32053101', 'PMID:25822283']],
  'tenofovir-alafenamide': ['uncharacterized',
    'F 0.25 IS THE DOSE — "a single dose of TAF at 25 mg" — the milligram figure stored as a fraction. The stored 0.43 h half-life describes the prodrug, while the ACTIVE intracellular species persists with a half-life of 20.8 DAYS, a factor of about 1160. Its source_pmid and its only reference are DIFFERENT papers and neither states any stored value. No intravenous formulation exists, so no absolute bioavailability can.',
    ['PMID:34703277', 'PMID:32539288']],
  prasugrel: ['uncharacterized',
    'THE PARENT IS NOT MEASURABLE IN PLASMA — hydrolysed by intestinal carboxylesterase before reaching the circulation — so mw 373.44 describes a molecule that never appears there. Its citation measured only metabolites and states no half-life, volume, bioavailability or rate. ka 4 probably collides with a subject count and is refuted by a stated 0.5 h time to peak. AND A HALF-LIFE CANNOT DESCRIBE THIS DRUG AT ALL: P2Y12 binding is irreversible, so duration is platelet turnover over 7-10 days.',
    ['PMID:25697420', 'PMID:19698014']],
  selegiline: ['uncharacterized',
    'Joins the other irreversible MAO inhibitors already marked so. Platelet MAO is still 96% inhibited five days after stopping and takes two weeks to recover, against a ~1.2 h plasma half-life — a 250-fold decoupling — and its literature states "systemic selegiline levels may not predict the propensity for a hypertensive crisis". Its cited paper measured only METABOLITES, which run 12 to 20-fold above the parent. Oral F 0.1 is contradicted by this record own other reference, which states 4%.',
    ['PMID:17715422', 'PMID:2505797']],
  loperamide: ['local-acting',
    'A systemic plasma model does not represent this drug and its own numbers proved it: the stored affinity against a therapeutic peak of 0.00118 mg/L made the model report ~45% mu-opioid occupancy at an ordinary 8 mg dose, presenting a gut-restricted antidiarrhoeal as centrally active. The target is myenteric receptor seeing luminal concentrations orders of magnitude above plasma while a transporter excludes the drug from the brain. V 350 L is a template shared with five unrelated compounds.',
    ['PMID:15496339', 'PMID:438356']],
  eluxadoline: ['local-acting',
    'V 80 L WITH F 0.01 IMPLIES A TRUE VOLUME OF 0.8 L, BELOW PLASMA VOLUME — physically impossible, and the two are not separately identifiable because no intravenous arm has ever been run. The 0.01 is an inequality bound, "less than 1% was recovered in urine", and the label states outright that absolute bioavailability "has not been determined". The half-life is the midpoint of a stated 3.7 to 6 hours. Its citation is a transporter interaction study stating none of the values.',
    ['PMID:25491493']],
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
