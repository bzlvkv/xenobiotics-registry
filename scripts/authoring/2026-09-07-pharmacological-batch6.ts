/**
 * 2026-09-07-pharmacological-batch6.ts
 *
 * Sixth batch of the pharmacological category: 40 compounds, eight agents.
 *
 * ── THE ABSORPTION RATE CONSTANT SURVIVES, THREE TIMES ──────────────────
 * After five batches and ~180 audited routes with zero survivors, three ka
 * values verified verbatim: amiodarone 0.49 ("Absorption rate constant Ka ...
 * 0.35 +/- 0.10 1/h and 0.49 +/- 0.35 1/h"), aprepitant 0.893 (a NONMEM
 * population estimate whose "suspicious precision" is the precision of a fit),
 * and erlotinib 0.95 — which also REFUTES the stored 0.5, nearly half of it.
 * Two of the three had the right value under the WRONG CITATION, with the
 * correct paper already sitting uncited in the record's own refs[].
 *
 * That falsifies, in one direction, the distribution screen run before the
 * agents reported: 288 of 354 remaining ka values carry <=2 significant figures
 * and 245 sit in groups of >=4 compounds sharing a byte-identical number, but
 * amiodarone's 0.49 has two significant figures and is real. The distribution
 * is a prior, not a verdict.
 *
 * ── AND THE CLASS THAT REPLACES IT: BACK-DERIVATION ─────────────────────
 * Twelve ka values in this batch were computed from the record's own half-life
 * to reproduce a Tmax quoted in its own prose. Group 5 is the cleanest cluster
 * yet — all five, four of them disclosing the derivation in their own notes:
 *   solifenacin 0.85/t½ 55  -> Tmax 5.03 h   (round 5)
 *   ropinirole  2.0 /t½ 6   -> Tmax 1.51 h   (midpoint of the label's 1-2 h)
 *   pramipexole 1.5 /t½ 8   -> Tmax 2.017 h  (exactly the label Tmax)
 * And it explains a shared value I had flagged as a cross-drug transplant:
 * lurasidone and quetiapine both store 2.02, but 2.02 reproduces Tmax 2.00 h on
 * lurasidone and 1.50 h on quetiapine. The same rate cannot have been copied
 * from one to the other AND reproduce each drug's own Tmax; they were derived
 * independently and collided. Class 9, not class 2.
 *
 * ── THE OCCUPANCY MODEL HAS NO FREE-FRACTION TERM ──────────────────────
 * Found by computing rather than reading, then confirmed by three independent
 * routes. Running the registry's own Bateman at each record's own doses.typical
 * and its own Hill function against its own ec50_mg_l, 113 of 213 pharmacological
 * occupancy rows (53%) report >=90% occupancy at a normal dose and 160 (75%)
 * report >=60%. `receptorSite` carries no protein-binding field and hill.ts
 * compares the effect-site concentration, derived from the TOTAL plasma curve,
 * straight against an ec50 that is almost always an in-vitro FREE-drug Ki.
 * Measured confirmation, from two directions:
 *   duloxetine  stored 0.000238 mg/L vs a published IN-VIVO plasma EC50 of
 *               "3.7 ng/ml" — 15x higher
 *   buspirone   model reports 30-39% 5-HT1A occupancy; human PET measured
 *               "5+/-17%", the authors concluding buspirone "is already
 *               clinically effective at LOW LEVELS of 5-HT1A occupancy"
 * Logged as backlog §12; not fixed here, because it is a schema and solver
 * change rather than a row-by-row one.
 *
 * ── A NEW DEFECT SHAPE: A DROPPED LEADING DIGIT ────────────────────────
 * promethazine's V 970 L is 1970 with the first digit lost, and the fix cannot
 * be applied to V alone: {970, 12 h} implies a clearance 18% below published,
 * {1970, 12 h} implies 67% above. Only the coherent pair works.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Occ { receptor?: string; ec50_mg_l?: number; source_pmid?: string; note?: string; [k: string]: unknown }
interface Compound {
  slug: string; routes?: string[]; doses?: Record<string, unknown>;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  effect_compartment?: { approximated?: boolean; [k: string]: unknown };
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
  { slug: 'amiodarone', guard: (c) => c.pk?.PO?.V_L === 5000,
    pk: { PO: { ka_hr: 0.49, V_L: 376, F: 0.31, source_pmid: 'PMID:6540111' },
          IV: { V_L: 376, F: 1, source_pmid: 'PMID:6540111' } },
    hl: { PO: 31.6, IV: 34.5 }, refs: ['PMID:6540111', 'PMID:8525224'],
    note: 'PK: THE STORED MODEL FAILED A PHYSICAL CHECK AGAINST ITS OWN CITED PAPER — {600 mg, F 0.5, V 5000 L} caps Cmax at 0.060 mg/L against the 0.828 that paper observed, FOURTEEN TIMES LOW. Its IV row was hung on a study whose title is "after extravascular administration of a single dose"; there is no intravenous arm in it. Its F 0.5 came from a RELATIVE bioavailability measurement ("Bioavailability extent (EBA) of examined preparation was 120 per cent in comparison with the standard one"). And t½ 1080 h is 45 days, the exact midpoint of this record own prose, describing the POST-CHRONIC-THERAPY washout rather than any single-dose phase. Everything moves to one internally consistent study with both arms in the same seven subjects. THIS IS A TRADE, NOT A FIX, AND BOTH SIDES WERE COMPUTED: the old set was 14x low on single-dose Cmax and 1.5x high at steady state; the new one is 1.7x and 2.5x low. The new one is less wrong and fully verbatim. ka 0.49 IS VERIFIED AND SURVIVES — one of three in this batch, and the first anywhere in six batches.',
    summary: 'amiodarone — its own paper refutes its model 14-fold on Cmax; ka 0.49 VERIFIES' },

  { slug: 'promethazine', guard: (c) => c.pk?.PO?.V_L === 970,
    pk: { PO: { V_L: 1970, F: 0.25, source_pmid: 'PMID:6849764' },
          IV: { V_L: 1970, F: 1, source_pmid: 'PMID:6849764' } },
    hl: { PO: 20, IV: 20 }, refs: ['PMID:6849764'],
    note: 'PK: A NEW DEFECT SHAPE — A DROPPED LEADING DIGIT. V 970 is 1970 with its first digit lost: "Promethazine disposition is characterised by a large volume of distribution (1970 l) and a high blood clearance (1.14 l min-1)". The same paper states this record F verbatim ("the oral availability of promethazine is only 25%"), which the previously cited study gives only as an interval, "12.3 to 40%". THE FIX CANNOT BE APPLIED TO V ALONE: {970, 12 h} implies a clearance 18% BELOW the published figure and {1970, 12 h} implies 67% ABOVE it; only the coherent pair {1970 L, 20 h} works, and that half-life is DERIVED from the paper own volume and clearance rather than quoted, which is recorded here rather than hidden. The stored 12 h was itself the midpoint of a REVIEW range, "promethazine 10 to 14 hours". MATRIX CAVEAT: this study measured BLOOD, not plasma. My suspicion that one PMID could not serve both routes was REFUTED — it dosed "75 mg (orally) and ... 50 mg (intravenously)". ka 0.7 dropped. Two routes declared with no parameters are removed.',
    summary: 'promethazine — V 970 is 1970 with the leading digit dropped; the pair must move together' },

  { slug: 'metoclopramide', guard: (c) => c.half_life_hr?.IV === 5.2,
    pk: { PO: { V_L: 240, F: 0.77, source_pmid: 'PMID:7286058' },
          IV: { V_L: 240, F: 1, source_pmid: 'PMID:7286058' } },
    hl: { PO: 5.17, IV: 4.55 }, refs: ['PMID:7286058'],
    note: 'PK: MOSTLY RIGHT, AND SAYING SO MATTERS. F 0.77 is verbatim ("A mean bioavailability of 0.77 was calculated for the six subjects"), the oral half-life is verbatim at 5.17 h, and V 240 L is 3.43 L/kg x 70 stated in the INTRAVENOUS paragraph — so pairing it with an independent F is CORRECT and the class-6 suspicion is dismissed. The one hard defect is ONE SOURCE NUMBER IN TWO FIELDS: the intravenous row carried the ORAL half-life, while the paper gives that arm its own value, "a mean terminal half-life of 4.55 h +/- 0.80 h". ka 4 is unsourced but is NOT a back-derivation — it implies a 0.88 h peak against the paper stated 0.93 h, whereas solving from that Tmax would have given 3.7 rather than a round 4. Its intramuscular route is declared with no parameters; the crossover that exists confirms it behaves like the oral route but publishes no numbers.',
    summary: 'metoclopramide — the IV half-life was the oral arm number; V/F pairing acquitted' },

  { slug: 'aprepitant', guard: (c) => c.pk?.PO?.V_L === 72,
    pk: { PO: { ka_hr: 0.893, V_L: 72.1, F: 1, source_pmid: 'PMID:18317761' } },
    hl: { PO: 32.4 }, refs: ['PMID:18317761'],
    note: 'PK: THE RIGHT PAPER WAS ALREADY IN THIS RECORD refs[] AND CITED BY NOTHING. Its stored source states no volume, no rate and no half-life; the population fit does, verbatim: "Typical population estimates of CL/F, apparent distribution volume (V(d)/F), absorption constant (K(a)) and absorption lag time were 1.54 L/h, 72.1 L, 0.893/h and 0.295 h". So ka 0.893 IS MEASURED — my class-9 suspicion of its precision was the precision of a FIT. The abstract names its own volume apparent, so F is pinned to 1; the measured bioavailability is 0.59 at 125 mg and 0.67 at 80 mg, and the stored 0.65 was the UPPER CONFIDENCE BOUND of the first, neither value nor their mean. The half-life of 12 h was unsourced AND self-contradictory: the same fit implies 32.4 h, while 12 h beside V 72 implies a clearance 2.7x the published one. THE INTRAVENOUS ROUTE IS REMOVED — its only intravenous exposure was a 2 mg stable-isotope TRACER MICRODOSE, sixty-fold below therapeutic in a dose-nonlinear drug, and the marketed intravenous product is FOSAPREPITANT, a different molecule.',
    summary: 'aprepitant — ka 0.893 VERIFIES; the correct paper sat uncited in its own refs' },

  { slug: 'butorphanol', guard: (c) => c.half_life_hr?.IN === 6,
    pk: { IV: { V_L: 791, F: 1, source_pmid: 'PMID:8157043' },
          IN: { V_L: 791, F: 0.7, source_pmid: 'PMID:8218955' } },
    hl: { IV: 5.95, IN: 6.28 }, refs: ['PMID:8218955'],
    note: 'PK: THE INTRAVENOUS ROW VERIFIES AND ITS VOLUME IS A TRUE Vss — "The mean CLT and Vss were 121 l.h-1 and 791 l ... for the intravenous treatment" — so pairing it with the nasal bioavailability is CORRECT, the class-6 case the brief warned about. The nasal half-life of 6 h matched neither arm of its own paper, which reports "5.95, 6.28, and 5.77 h, for treatments A, B, and C"; the transnasal arm value is now carried. F 0.7 was RIGHT WITH THE WRONG CITATION: the cited study reports 72% and was run in RHINITIS PATIENTS, chosen because nasal pathology might alter nasal absorption, while 0.70 is verbatim in a healthy-volunteer study. ka 3 is unsourced; the only absorption datum is a mean absorption time of 0.23 h, implying 4.35. Its intramuscular route is declared with no parameters and is removed. BOTH OPIOID OCCUPANCY ROWS ARE REMOVED — see the receptor block.',
    summary: 'butorphanol — nasal t½ matched neither arm; its F was right under the wrong paper' },

  { slug: 'fluphenazine', guard: (c) => c.pk?.PO?.ka_hr === 1.25,
    pk: { PO: { V_L: 1500, F: 0.027, source_pmid: 'PMID:8911886' } },
    hl: { PO: 16.4 }, refs: ['PMID:6787637'],
    note: 'PK: TWO VALUES VERIFY AND THE VOLUME IS REFUTED TWO WAYS. F 0.027 is verbatim and is correctly the IMMEDIATE-RELEASE figure ("2.7% for the immediate release formulation and 3.4% for the slow release"), not the slow-release value and not a midpoint; the oral half-life of 16.4 h is verbatim and correctly the mean rather than the adjacent standard deviation of 13.3. V 1500 L is in no abstract and fails arithmetic twice over: the volume reproducing its own paper "Cmax 2.3 ng/mL at tmax 2.8 h" is about 125 L, so the model runs TWELVE TIMES LOW, and at steady state it puts the average concentration at or below the bottom of the therapeutic window this record other citation defines. IT IS RETAINED ONLY BECAUSE THE RESOLVER DEFAULT WOULD BE FORTY-FOLD WORSE, and no replacement is invented — a volume computed from this record own numbers is precisely the defect being hunted. ka 1.25 is a BACK-DERIVATION, reproducing that same 2.8 h peak exactly. THE DEPOT ROUTE IS REMOVED: its half-life was the oral value copied across, against a citation stating the opposite — "a long half-life measurable in MONTHS rather than weeks" — and its release duration appears nowhere.',
    summary: 'fluphenazine — V 1500 runs 12x low; its ka reproduces its own paper Tmax exactly' },

  { slug: 'lurasidone', guard: (c) => c.pk?.PO?.V_L === 420,
    pk: { PO: { V_L: 6173, F: 1, source_pmid: 'PMID:27722855' } },
    hl: { PO: 18 },
    note: 'PK: V 420 L IS REFUTED BY ITS OWN CITATION, WHICH STATES A DIFFERENT NUMBER — "apparent volume of distribution of 6173 L". That published figure is now carried with F pinned to 1, because the abstract calls it APPARENT and pairing 6173 with the label 15% would manufacture a textbook double-division. F 0.15 IS NOT IN PUBMED AT ALL: a title-and-abstract search for lurasidone bioavailability returns zero records for the marketed product, so it is label-only — and it is the FASTED figure for a drug whose label REQUIRES food, under which exposure roughly doubles. The measured value is recorded here rather than stored. ka 2.02 is a BACK-DERIVATION reproducing 2.00 h, the exact midpoint of its cited "1-3 h" — class 4 inverted through class 9. That same 2.02 sits on quetiapine, which I had flagged as a cross-drug transplant; it is not, because 2.02 reproduces 1.50 h there, each drug own Tmax. The half-life of 18 h verifies verbatim.',
    summary: 'lurasidone — V refuted by its own paper; its F is absent from PubMed entirely' },

  { slug: 'risperidone', guard: (c) => c.pk?.PO?.F === 0.66,
    pk: { PO: { V_L: 110, F: 1, source_pmid: 'PMID:7690693' } },
    hl: { PO: 20 }, refs: ['PMID:7690693', 'PMID:32608144'],
    note: 'PK: CLASS 5 INSIDE A SINGLE ROW. The two stored numbers came from the same abstract but describe DIFFERENT ANALYTES, and that abstract supplies both alternatives explicitly — parent risperidone has a half-life of "about 3 hours in extensive metabolizers and 22 hours in poor metabolizers" with 66% bioavailability, while the ACTIVE MOIETY has a "mean terminal half-life, 20 +/- 2 1/2 hours; absolute oral and intramuscular bioavailability, 100%". The record stored the parent bioavailability beside the moiety half-life, which is neither row. It is resolved in favour of the ACTIVE MOIETY, because that is what drives effect, what almost every clinical paper reports, and what this record four occupancy rows are actually modelling — so F becomes 1. THE dexlansoprazole DIRECTION TEST IS NEGATIVE and is reported clean: the metabolite half-life is longer, not shorter, and paliperidone lower bioavailability is a property of its extended-release tablet rather than of the molecule. ka 1.4 is unsourced but implies 2.709 h, not a round number and not any quoted endpoint, so CLASS 9 IS RULED OUT. Its depot route is removed: that route release duration of 336 h is exactly the two-week DOSING INTERVAL its citation states three times, and its 504 h lag appears nowhere.',
    summary: 'risperidone — parent F stored beside the active moiety half-life; resolved to the moiety' },

  { slug: 'paliperidone', guard: (c) => c.pk?.PO?.F === 0.28,
    pk: { PO: { V_L: 487, F: 1, source_pmid: 'PMID:29776316' } },
    hl: { PO: 24 }, refs: ['PMID:29776316', 'PMID:20589922'],
    note: 'PK: CLASS 6 CONFIRMED, WITH RECORD-INTERNAL PROOF. V 487 L is the label APPARENT volume and no intravenous paliperidone volume exists — the only abstract reporting one calls it "Apparent clearance and apparent volume of distribution". The proof that at least one row was wrong sat inside the record: the SAME 487 L was on the depot row beside F 1, and one number cannot be simultaneously apparent and absolute. F is now pinned to 1 and the measured 28% recorded here, verbatim from a paper the record did not cite: "The marketed extended-release formulation has 28% bioavailability". THE FLIP-FLOP WAS BACKWARDS: the stored ka 0.08 exceeds the elimination rate, making the model elimination-limited, while the real extended-release half-life is ABSORPTION-limited; and 0.08 implies a 19.9 h peak against a cited "maximum plasma concentrations occurring at 24 hours". THE DEPOT ROUTE IS REMOVED — it was hung on an ORAL MASS-BALANCE study ("a single dose of 1 mg of [14C]paliperidone ORAL SOLUTION") that never used the route, never used the ester, and reports no pharmacokinetic parameters at all; its 672 h release duration is the one-month dosing interval.',
    summary: 'paliperidone — one apparent volume served both an oral and a depot row; class 6 confirmed' },

  { slug: 'clozapine', guard: (c) => c.pk?.PO?.V_L === 305,
    pk: { PO: { V_L: 112, F: 0.27, source_pmid: 'PMID:3203703' } },
    hl: { PO: 10.3 }, refs: ['PMID:3203703'],
    note: 'PK: V 305 L WAS BACK-DERIVED AND MATRIX-MISMATCHED AT ONCE. The published BLOOD clearance is 250 mL/min = 15.0 L/h, and 15.0 divided by this record own elimination rate gives 303 — against a stored 305. Not a measurement: a literature clearance divided by the record own half-life. And it is blood-referenced, in a drug whose source states "the mean equilibrium-state concentration ratio between blood and plasma was experimentally determined to be 0.87". A real intravenous-and-oral study in ten patients supplies the whole row verbatim instead: "blood clearance, hepatic extraction ratio and oral bioavailability were 250 ml/min, 0.2 and 0.27 ... The mean volume of distribution at steady-state and the terminal half-life was 1.6 l/kg and 10.3 h". This converts the batch only label-only row into a cited one. F 0.4 was a self-declared range mean, and the spread is not noise — smoking moves exposure "-20% in patients not taking valproic acid, and -46% in patients taking valproic acid". ka 0.6 implies a 4.53 h peak against this record OWN label text of 2.5 h. THE NORCLOZAPINE CONTAMINATION CHECK IS NEGATIVE: no metabolite value reached this record.',
    summary: 'clozapine — V 305 is a literature clearance divided by its own half-life' },

  { slug: 'citalopram', guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { V_L: 840, F: 0.8, source_pmid: 'PMID:9681666' } },
    hl: { PO: 36.8 }, refs: ['PMID:9681666'],
    note: 'PK: ITS CITATION WAS A BIOEQUIVALENCE ABSTRACT REPORTING ONLY AUC, Cmax AND tmax — none of the four stored values. F 0.8 is nevertheless RIGHT, verbatim in a real intravenous-and-oral study: "The absolute bioavailability of citalopram tablets in healthy subjects was 80%", which also gives 36.8 h against an unsourced 35. ka 1.5 IS A BACK-DERIVATION: against the old half-life it reproduces 2.92 h, and the cited abstract states "3 (1-6) hours (reference)". V 840 L survives only because deleting it would invoke a resolver default twenty-fold too small; it is 12 L/kg x 70, hand-scaled, and it under-predicts its own citation AUC by 40%. Two published quantities disagree about what should replace it — the paper own exposure implies about 530 L, an independent oral clearance implies about 1100 — so no number is invented. THE ENANTIOMER PAIR IS INTERNALLY INCONSISTENT: this racemate transporter affinity is stored as equal to pure escitalopram, which would require the R-enantiomer to be equipotent, while escitalopram own citation says it "was approximately 30-fold more potent than R-citalopram".',
    summary: 'citalopram — ka back-derived to its own paper Tmax; F right, citation wrong' },

  { slug: 'escitalopram', guard: (c) => c.pk?.PO?.ka_hr === 0.7,
    pk: { PO: { V_L: 1100, F: 0.8, source_pmid: 'PMID:16291715' } },
    hl: { PO: 27 }, refs: ['PMID:17375980'],
    note: 'PK: THE HEALTHIEST RECORD OF THE BATCH, AND BOTH PAIR TESTS PASS. V 1100 L is verbatim and INTRAVENOUS-DERIVED — "After intravenous infusion of escitalopram, the mean systemic clearance and volume of distribution were 31 L/h and 1,100 L" — so class 6 does not apply despite the surface shape, and the model own clearance of 28.2 L/h agrees with the published 31 to within 9%. A FALSE POSITIVE IS PRE-EMPTED: a later review, by a CO-AUTHOR of that primary, restates the same 1100 L as an oral Vz/F; do not "correct" it to 880. THE ENANTIOMER DIRECTION TEST PASSES WITH A SOURCE: 27 h against the racemate 35 h is correct chemistry, because "the latter two phenotypes eliminated S-CT more rapidly via CYP2C19" makes R-citalopram the slower half. ka 0.7 is refuted by its own source Tmax, implying 4.90 h against "attained after 3 to 4 hours". F 0.8 is unsourced here — the abstract only paraphrases "a high absolute bioavailability" — and is carried on the racemate measurement. Its only reference was a MISFILE: a January 2000 review of five SSRIs published two years before this drug was marketed, which never mentions it.',
    summary: 'escitalopram — V verified IV-derived; the enantiomer direction test passes with a source' },

  { slug: 'fluoxetine', guard: (c) => c.pk?.PO?.ka_hr === 0.4,
    pk: { PO: { V_L: 700, F: 0.7, source_pmid: 'PMID:3262026' } },
    hl: { PO: 52.8 }, refs: ['PMID:3262026'],
    note: 'PK: t½ 48 h IS TWO DAYS, THE MIDPOINT OF ITS CITED "half-life of 1-3 days". A stated mean exists instead — "The mean t1/2 was 6.6 vs. 2.2 days ... for patients with cirrhosis vs. normal volunteers" — and 2.2 days is now carried. THE WRONG-ANALYTE CHECK IS CLEAN: the stored value is the parent, not norfluoxetine 7-15 days. But a single-dose half-life materially under-represents chronic dosing, because this drug inhibits its own clearance — "approximately 2 days (6 days after multiple doses)" — and the schema cannot express that. V 700 L is refuted by arithmetic: it implies a clearance of 3.4 mL/min/kg against a verbatim 9.6, so the record runs 2.8 TIMES TOO SLOW and over-predicts exposure by the same factor. No abstract states a fluoxetine volume in litres at all, so nothing is substituted. F 0.7 IS UNSOURCEABLE IN PRINCIPLE — fluoxetine has never had an intravenous formulation, so no absolute bioavailability has ever been measured. Both are retained only because the resolver defaults would be worse. ka 0.4 is unsourced.',
    summary: 'fluoxetine — t½ is a range midpoint; V implies a clearance 2.8x too slow' },

  { slug: 'duloxetine', guard: (c) => c.pk?.PO?.ka_hr === 0.4,
    pk: { PO: { V_L: 940, F: 0.5, source_pmid: 'PMID:19539103' } },
    hl: { PO: 12.95 }, refs: ['PMID:10664922'],
    note: 'PK: THE SOUNDEST ARITHMETIC IN ITS GROUP, AND THE FIX IS DOCUMENTATION. V 940 L is not in any abstract and looks like the class-6 defect; it is the INVERSE of it. It is the cited paper verbatim 60 mg-arm apparent volume of 1879.74 L MULTIPLIED BY F — the correct correction, since the solver divides by a true volume — and the resulting clearance of 100.2 L/h matches the paper published 98.41 to within 2%. Nothing in the record said so, which is exactly how such a value gets un-corrected by a later pass; it is written down here. The half-life is the 30 mg arm alone, rounded up, and sits ABOVE this record own reference range of "approximately 10-12 hours". F 0.5 is the label figure, stated in no primary. ka 0.4 IS BACK-DERIVED AND STRUCTURALLY IMPOSSIBLE: it implies a 5.81 h peak against measured values of 6.83, 6.10 and 6.60 h, and duloxetine is ENTERIC-COATED with a roughly two-hour lag that no single first-order rate can represent — THE SCHEMA HAS NO LAG PARAMETER, so this cannot be fixed by re-sourcing. Both occupancy rows verify.',
    summary: 'duloxetine — its V is a CORRECT F-correction, undocumented; the ka hides an enteric lag' },

  { slug: 'mirtazapine', guard: (c) => c.half_life_hr?.PO === 19,
    pk: { PO: { V_L: 320, F: 0.5, source_pmid: 'PMID:10885584' } },
    hl: { PO: 18.94 }, refs: ['PMID:10885584', 'PMID:16685260'],
    note: 'PK: THE STORED HALF-LIFE FALLS BELOW THE ENTIRE PUBLISHED POPULATION RANGE, and the refutation was already sitting in this record own references: "females and the elderly show higher plasma concentrations than males and young adults" and "The elimination half-life of mirtazapine ranges from 20 to 40 hours". The 19 h came from a healthy-MALE-ONLY cohort — whose abstract never states the dose administered — and is corrected to that study verbatim 18.94 with the subgroup limitation recorded rather than smoothed away. F 0.5 IS RIGHT and its verbatim source was likewise already present: "The absolute bioavailability is approximately 50%, mainly because of gut wall and hepatic first-pass metabolism". V 320 L is refuted — it implies a clearance of 23.3 L/h against a verbatim intravenous 31 L/h, running 2.7 TIMES TOO SLOW — but no abstract publishes a mirtazapine volume in litres, and the one candidate is a set of UNITLESS REGIONAL BRAIN distribution volumes from a PET study, which would be a textbook matrix artefact. Retained, refuted, not replaced. Two references are misfiles, one of them an opioid-and-benzodiazepine overdose study that never mentions this drug.',
    summary: 'mirtazapine — t½ is a male-only value below the whole published range' },

  { slug: 'diltiazem', guard: (c) => c.pk?.PO?.ka_hr === 3.6,
    pk: { PO: { V_L: 777, F: 0.44, source_pmid: 'PMID:6727272' },
          IV: { V_L: 777, F: 1, source_pmid: 'PMID:6727272' } },
    hl: { PO: 11.2, IV: 11.2 },
    note: 'PK: THREE OF FOUR VALUES VERIFY AND THE SHARED CITATION IS LEGITIMATE. My route-mismatch suspicion is refuted — the paper has a real intravenous arm: "10-minute intravenous infusion of a 20-mg dose; oral administration of 120 mg in solution form; and oral administration of 120 mg as two 60-mg sustained-release tablets". The half-life of 11.2 h is verbatim and intravenous; F 0.44 is verbatim and comes from the SOLUTION arm, matching what this row models rather than the sustained-release one; and V 777 L is 11.1 L/kg x 70 reported under "Following intravenous administration", so CLASS 6 IS ACQUITTED. ka 3.6 appears nowhere and is not a back-derivation either, implying a 1.15 h peak that matches neither the solution 38 minutes nor the tablets 165. Caveats recorded rather than acted on: 11.2 h and 11.1 L/kg are both two to three times the usual consensus, from an outlier 1984 assay; and these are SINGLE-DOSE values in a drug that inhibits its own metabolism. All three references are CYP3A4 victim studies with no diltiazem pharmacokinetics, and all three are correctly filed.',
    summary: 'diltiazem — three of four verify; one PMID legitimately serves both routes' },

  { slug: 'nifedipine', guard: (c) => c.pk?.PO?.V_L === 60,
    pk: { PO: { V_L: 51.7, F: 0.445, source_pmid: 'PMID:2604495' } },
    hl: { PO: 2.063 }, refs: ['PMID:2604495', 'PMID:1595912'],
    note: 'PK: AN INTERNALLY CONTRADICTORY RECORD — A SUSTAINED-RELEASE PHARMACOKINETIC ROW WEARING AN IMMEDIATE-RELEASE LABEL. Its citation is an HPLC-MS/MS ASSAY-VALIDATION paper that dosed "nifedipine sustained release tablets", while this record own effect-compartment note says "Immediate-release nifedipine". The stored 7 h matches none of that paper three reported half-lives and all of them are ABSORPTION-LIMITED from a sustained-release tablet — true elimination is about 2 h. V 60 L and F 0.5 appear nowhere in it; its only 60 is the mobile phase "60:40, v/v". Everything moves to a real capsule-versus-intravenous crossover: "The F value was 44.5 + 7.5% ... for the swallowed" and "When nifedipine was administered intravenously the mean t1/2 beta was 2.063 +/- 0.24 h". The volume is the only human intravenous figure available, 0.738 L/kg, and it is from POST-CARDIAC-SURGERY PATIENTS rather than volunteers — flagged, and kept only because the resolver default would be worse. ka 0.4 is an order of magnitude too slow for a capsule peaking at 0.5 h.',
    summary: 'nifedipine — an SR-derived row under an IR label; every value replaced' },

  { slug: 'amlodipine', guard: (c) => c.pk?.PO?.ka_hr === 0.3,
    pk: { PO: { V_L: 1470, F: 0.64, source_pmid: 'PMID:2943308' } },
    hl: { PO: 36 },
    note: 'PK: THE CLEANEST RECORD IN ITS GROUP — THREE OF FOUR FIELDS VERIFY, AND THE OUTLIER-LOOKING NUMBERS ARE REAL. Verbatim: "Oral administration (single dose, 10 mg) to the same 12 volunteers gave a mean systemic availability of 64% and a mean plasma half-life of 36 h", and the volume is 21 L/kg x 70 stated under "Intravenous administration", so CLASS 6 IS ACQUITTED. Worth recording what the record did NOT do: the same abstract also contains a 45 h steady-state half-life and a 34 h intravenous one, and the record correctly took the single-dose oral value rather than averaging across arms. Only ka 0.3 fails, appearing nowhere; it implies a 9.78 h peak, which lands inside this drug textbook window, so it is consistent with having been tuned rather than measured, though no quoted Tmax exists to prove it.',
    summary: 'amlodipine — its outlier numbers verify; only the ka fails' },

  { slug: 'carvedilol', guard: (c) => c.pk?.PO?.F === 0.25,
    pk: { PO: { V_L: 132, F: 0.24, source_pmid: 'PMID:3428345' } },
    hl: { PO: 6.4 }, refs: ['PMID:3428345', 'PMID:15306222'],
    note: 'PK: EVERY STORED NUMBER CAME FROM A BIOEQUIVALENCE ABSTRACT REPORTING ONLY Cmax AND AUC — AND TWO OF THEM ARE ITS SAMPLING TIMES. That abstract schedule opens "at 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2", and the record stored F 0.25 and ka 1.5. Its only bioavailability figure is a RELATIVE one, "The relative bioavailability of the test formulation to reference formulation was 100.1%". A real intravenous-and-oral crossover supplies all four verbatim: "For the 50 mg capsule Cmax was 66 micrograms.l-1, tmax 1.2 h, t1/2 6.4 h. The t1/2 after i.v. administration was 2.4 h, CL 589 ml/min and VZ 132 l. The absolute bioavailability was 24% (50 mg capsule)." The volume is intravenous-derived, so the new pairing is legitimate. FLIP-FLOP IS EXPLICIT IN THIS LITERATURE — the oral 6.4 h against an intravenous 2.4 h is absorption-dependent — so the oral value is carried on the oral route and the intravenous one recorded here. The racemate question is answered: both cited assays were ACHIRAL, so no cross-enantiomer mean was taken. Its effect-compartment value is the best-sourced number in its group and is untouched.',
    summary: 'carvedilol — its stored F and ka are both sampling times from its own citation' },

  { slug: 'atenolol', guard: (c) => c.pk?.PO?.ka_hr === 0.7,
    pk: { PO: { V_L: 67, F: 0.5, source_pmid: 'PMID:428185' } },
    hl: { PO: 6.06 }, refs: ['PMID:428185'],
    note: 'PK: THE CONTROL OF ITS GROUP, AND IT MOSTLY HOLDS. F 0.5 verifies ("The bioavailability of approximately 50% is due to reduced absorption") and is independently confirmed at 50% by a second intravenous-and-oral study. The half-life of 6 h was the UPPER ENDPOINT of a stated "5-6 h" and is replaced by a genuine mean, "The mean (+/- SD) terminal elimination half-life is 6.06 +/- 2.02 hr". ka 0.7 IS THE CLEANEST BACK-DERIVATION OF THE BATCH: it reproduces a 3.08 h peak, the midpoint of its abstract "Peak blood levels are observed at 2-4 h", and an independent study reports the Tmax as "(3.0 hr)". A Tmax read backwards. The only measured absorption quantity anywhere is "the time for half of the bioavailable dose to be absorbed (2.0 hr)", implying 0.35 — half the stored value — but that came from a THREE-COMPARTMENT fit where the relation does not hold, so no replacement is stored. V 67 L is unsupported by any abstract; the only candidate is a CENTRAL-COMPARTMENT volume of 0.173 L/kg, a different parameter, so the stored value is retained rather than replaced by a wrong quantity.',
    summary: 'atenolol — its ka is a Tmax read backwards, the cleanest class-9 hit of the batch' },

  { slug: 'solifenacin', guard: (c) => c.pk?.PO?.F === 0.9,
    pk: { PO: { V_L: 599, F: 0.88, source_pmid: 'PMID:15293866' } },
    hl: { PO: 68.2 }, refs: ['PMID:15293866', 'PMID:17251687'],
    note: 'PK: THE LABEL ROW HAD A PRIMARY IT WAS PARAPHRASING, AND THE OUTLIER-LOOKING NUMBERS ARE REAL. A ten-milligram oral versus five-milligram INTRAVENOUS crossover states them verbatim: "a high absolute bioavailability of 88.0% ... low clearance (9.39 L/h), and an extensive mean volume of distribution at steady state (599L)". Because that volume is a steady-state figure from a real intravenous dose, CLASS 6 IS REVERSED — the pairing is correct. The half-life of 55 h was the exact MIDPOINT of the label 45-68 h band; the only verbatim single healthy-subject mean anywhere is 68.2, from the control arm of an impairment study in six subjects, and its own inconsistency is recorded rather than hidden: 68.2 h beside 599 L and 9.39 L/h does not close under one compartment, because 599 is a steady-state volume while 68.2 is a TERMINAL half-life belonging to a larger one. ka 0.85 is a back-derivation to a round 5 h. THE BLADDER-EQUILIBRIUM QUESTION IS ANSWERED, NOT ASSUMED: this drug was given intravenously, works at 88% bioavailability, and produces effects at remote sites in the same subjects, so it is not loperamide-shaped.',
    summary: 'solifenacin — the label was paraphrasing a real IV crossover; class 6 reversed' },

  { slug: 'prucalopride', guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { F: 0.9, V_L: 567, source_label: 'FDA prescribing information, DailyMed setid af559917-802b-486c-9f7b-b770115acac8 — absolute F >90% (an INEQUALITY BOUND, stored as a point estimate), steady-state Vd 567 L, terminal t½ ~24 h. Tmax median 2 h is verbatim in PMID:22943932; no primary states an absolute F, a volume or a half-life.' } },
    hl: { PO: 24 }, refs: ['PMID:22943932', 'PMID:27614912', 'PMID:11438309'],
    note: 'PK: IT STAYS A LABEL ROW, AND THE SEARCH IS LOGGED RATHER THAN PAPERED OVER. A systematic chase — including the development code name and the sponsor pharmacokinetics authors — found NO PubMed abstract stating an absolute bioavailability, a volume of distribution or a terminal half-life for this drug. The label ">90%" is an INEQUALITY BOUND stored as a point estimate, which is a confirmed collision shape, and that is now said in the row own provenance text. ka 1.5 is a back-derivation that does not even reproduce its own note claim, implying 2.69 h against the 2.5 h asserted; the one verbatim Tmax available is a median of 2 h. A MATRIX FLAG IS RECORDED: "a mean blood-to-plasma concentration ratio of 1.9 indicated uptake of prucalopride into blood cells", so a plasma-referenced volume is not interchangeable with whole-blood quantities.',
    summary: 'prucalopride — no primary exists for any PK value; kept as a label row, bound flagged' },

  { slug: 'ropinirole', guard: (c) => c.pk?.PO?.ka_hr === 2,
    pk: { PO: { V_L: 525, F: 1, source_pmid: 'PMID:11069211' } },
    hl: { PO: 6 }, refs: ['PMID:11069211', 'PMID:10219970', 'PMID:10455328', 'PMID:30362146'],
    note: 'PK: F 0.5 AND t½ 6 ARE NOW CITABLE VERBATIM — "The bioavailability is approximately 50%" and "eliminated with a half-life of approximately 6 hours" — replacing a label-only row, though the source is a sponsor review rather than a primary. V 525 L is the label APPARENT volume of 7.5 L/kg scaled by weight, and the human intravenous arm that might have anchored a true one produced no usable curve: concentrations "were below the lower limit of quantification in man (0.08 ng/ml)". F is therefore pinned to 1 so the apparent volume is used as intended, and the measured 50% recorded here. A COLLISION TRAP CHECKED AND ABSENT: that same paper "nearly all of the p.o. administered dose (94%) was rapidly absorbed" is a fraction ABSORBED, not a bioavailability, and the record correctly stored 0.5 rather than 0.94. THE SMOKING HYPOTHESIS IS REPORTED AS A NEGATIVE: every ropinirole-and-smoking record is about impulse-control behaviour, not kinetics, and the review covariate list omits smoking entirely. ka 2.0 back-derives to 1.51 h, the midpoint of the label 1-2 h.',
    summary: 'ropinirole — F and t½ now citable; V is apparent, so F is pinned to 1' },

  { slug: 'pramipexole', guard: (c) => c.pk?.PO?.V_L === 500,
    pk: { PO: { V_L: 486, F: 1, source_pmid: 'PMID:9208359' } },
    hl: { PO: 12.9 }, refs: ['PMID:9208359'],
    note: 'PK: THE LABEL ROW HAD A REAL PRIMARY IT WAS PARAPHRASING. Sixteen healthy volunteers, four dose levels: "The mean volume of distribution and elimination half-life for all participants was 486 +/- 93.2 L and 12.9 +/- 3.27 hours". The stored 8 h is contradicted by that and by a second study at 9.85 h; it was the label young-subject figure. That volume is from a STEADY-STATE ORAL study, so it is apparent and F is pinned to 1 rather than double-dividing; the label >90% is retained here as prose, and deliberately NOT upgraded to the one literature statement available, because that is a REVIEW quoting an inequality bound and citing it would dress a bound as a measurement. THE RECORD SIMPLE-KINETICS PREMISE VERIFIES: "renal clearance of pramipexole accounts for approximately 80% of oral clearance". ka 1.5 back-derives to 2.017 h, EXACTLY the label Tmax. Caveat carried: the primary cohort included women and clearance tracks creatinine clearance, so 12.9 h is not a young-male figure.',
    summary: 'pramipexole — its label row was paraphrasing a real primary; t½ 8 h is contradicted' },

  { slug: 'posaconazole', guard: (c) => c.half_life_hr?.PO === 35,
    pk: { PO: { V_L: 297, F: 0.422, source_pmid: 'PMID:31432392' },
          IV: { V_L: 297, F: 1, source_pmid: 'PMID:31432392' } },
    hl: { PO: 25.21, IV: 25.76 }, refs: ['PMID:36607589'],
    note: 'PK: THE SUSPENSION LABEL HALF-LIFE WAS HUNG ON A TABLET-AND-INTRAVENOUS PAPER THAT SAYS THE OPPOSITE — "the half-life (t½) was 25.76 h" intravenously and "a t½ of 25.21 h after fasting" for the tablet, against a stored 35. F 0.42 verifies but is condition-bound: "42.2% in the fasted state and 87.1% under high-fat breakfast conditions". THIS DRUG BIOAVAILABILITY IS NOT A SCALAR AT ALL — across product, dose and food it spans "17.1% and 10.1% under fasted conditions and 59.1% and 49.2% under fed conditions" for the suspension and "58.8% ... under fasted conditions and approached complete absorption under fed conditions" for the tablet, a range from about a tenth to unity — and even for the one modelled cell two sources disagree, 42.2 against 58.8. It is kept, declared as the fasted delayed-release tablet, because a formulation field does not exist. V 297 L is in no abstract and falls OUTSIDE the only published range, "343 to 1341 liters". ka 0.2 reproduces nothing, implying a 12.8 h peak against an observed 4 h, and real absorption needs four to eight transit compartments.',
    summary: 'posaconazole — a suspension label t½ on a tablet paper; F spans 0.10 to 1.0' },

  { slug: 'erlotinib', guard: (c) => c.pk?.PO?.ka_hr === 0.5,
    pk: { PO: { ka_hr: 0.95, V_L: 233, F: 1, source_pmid: 'PMID:16890575' } },
    hl: { PO: 36.2 }, refs: ['PMID:16890575', 'PMID:16490804', 'PMID:18176118'],
    note: 'PK: ITS CITATION WAS A RIFAMPICIN INTERACTION STUDY REPORTING ONLY EXPOSURE RATIOS — none of the four stored values. A population fit of 4068 samples from 1047 patients, using "a 1-compartment model with first-order absorption" — this registry exact model shape — supplies three verbatim: "the oral clearance was 3.95 L/h, the oral volume of distribution was 233 L, and the absorption rate was 0.95 h(-1). The median erlotinib half-life ... was 36.2 hours". THE THIRD SURVIVING ka OF THE BATCH, AND IT REFUTES THE STORED ONE: 0.95 is nearly double 0.5, and it independently checks out, reproducing a 4.2 h peak against this drug observed 4 h while 0.5 gives 6.8 h. CLASS 6 IS CONFIRMED HERE FROM THE PAPER OWN WORDS rather than from record shape: it NAMES its 233 L the "oral volume of distribution", and the only intravenous erlotinib study publishes no volume at all — so F is pinned to 1. The measured absolute bioavailability is 59% with a 55-63% interval, and a competing 76% median in patients is recorded rather than silently dropped. Exposure also moves with smoking, food and gastric pH.',
    summary: 'erlotinib — ka 0.95 VERIFIES and refutes the stored 0.5; class 6 confirmed documentarily' },

  { slug: 'bosentan', guard: (c) => c.pk?.PO?.V_L === 18,
    pk: { PO: { V_L: 14, F: 0.5, source_pmid: 'PMID:8823230' } },
    hl: { PO: 5.4 }, refs: ['PMID:8823230'],
    note: 'PK: BOTH OF MY SUSPICIONS RESOLVED IN THE RECORD FAVOUR, AND SAYING SO IS THE POINT. F 0.5 VERIFIES against a real intravenous ascending-dose arm — "The absolute bioavailability was 50% and appeared to decrease with doses above 600 mg" — in a paper this record did not cite; because that volume is intravenous-derived, CLASS 6 DOES NOT APPLY. And AUTO-INDUCTION DOES NOT BREAK THE MODEL: "the exposure to bosentan was reduced by 33% WITHOUT CHANGE IN tmax AND t(1/2)", so one half-life is valid in both the first-dose and steady-state phases — the fortunate case. Its active metabolite is likewise bounded by the same paper, "less than 25% of that to bosentan both after single and multiple doses", unlike the co-equal metabolites that made two other records in this group unauthorable. t½ 5 becomes the verbatim 5.4. V 18 L was the label figure; the nearest verbatim quantity is a dose-dependent limiting value of 0.2 L/kg, intravenous-derived, carried at 70 kg. ka 0.65 reproduces nothing, implying a 3.0 h peak against an observed 4.5 h. All four references are CYP3A4 induction citations, correctly filed.',
    summary: 'bosentan — F verified against a real IV arm; auto-induction leaves the half-life intact' },

  { slug: 'hydrocodone', guard: (c) => c.half_life_hr?.PO === 4,
    pk: { PO: { V_L: 230, F: 0.5, source_pmid: 'PMID:856847' } },
    hl: { PO: 3.8 }, refs: ['PMID:856847', 'PMID:9103485'],
    note: 'PK: ITS CITATION IS AN EXTENDED-RELEASE, ABUSE-DETERRENT FORMULATION STUDY PROPPING UP AN IMMEDIATE-RELEASE ROW, and it states none of the four stored values. A half-life is available verbatim from a human arm: "A mean peak serum drug concentration of 23.6 ng/ml and a terminal half-life of 3.8 h resulted from the human study". F 0.5 AND V 230 L ARE UNSOURCEABLE AND RETAINED ONLY BECAUSE THE DEFAULTS WOULD BE WORSE — there is no human intravenous hydrocodone arm anywhere, so an absolute bioavailability has never been measured and every candidate study reports a RELATIVE one; the record own reference concedes "relatively little is known about its pharmacokinetics". THE PRODRUG PREMISE IN OUR OWN PROSE IS REFUTED, and this is a defect in our text rather than in the data: a controlled crossover found that "EMs and PMs were equally responsive to oral hydrocodone, and quinidine had no consistent effect on their responses", concluding "only a small role of hydromorphone". Hydrocodone is an active mu agonist in its own right, so the stored pharmacokinetics and occupancy describe the RIGHT analyte.',
    summary: 'hydrocodone — an ER paper under an IR row; and our own "prodrug" prose is refuted' },

  { slug: 'naltrexone', guard: (c) => c.half_life_hr?.PO === 4,
    pk: { PO: { V_L: 1350, F: 0.05, source_pmid: 'PMID:6114837' } },
    hl: { PO: 8.9 }, refs: ['PMID:10463317', 'PMID:21502953'],
    note: 'PK: t½ 4 h IS NEITHER OF ITS OWN PAPER TWO VALUES — "2.7 hr, iv; 8.9 hr, oral" — it is the textbook round number sitting between them; the oral value now goes on the oral row. F 0.05 is the BOTTOM ENDPOINT of a quoted 5-40% band, and the only measured estimate runs four-fold the other way, but that figure is a first-pass complement rather than a stated bioavailability, so it is not substituted. I PROPOSED STRIPPING THIS RECORD AND WAS ARGUED OUT OF IT, correctly: `uncharacterized` means no primary publishes a modelled parameter, and that is false here — this drug pharmacokinetics ARE characterised. WHAT FAILS IS THE PLASMA-TO-EFFECT LINK, AND IT IS NOT A TWO-ANALYTE PROBLEM EITHER: human receptor-occupancy imaging found that "for both NTX and its principal active metabolite in humans, 6-beta-NTX, this relationship was INDIRECT", so neither plasma species predicts blockade, which "persisted for 5 days after discontinuation". That is slow receptor dissociation, which no half-life can express. The depot route is removed: its half-life was the oral value against a measured 5-7 DAYS, and its release duration of 720 h is a one-month convenience matching neither the 28-day interval nor the 31-day window.',
    summary: 'naltrexone — t½ is neither of its two published values; the PD link, not the PK, fails' },

  { slug: 'tapentadol', guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { V_L: 540, F: 0.32, source_pmid: 'PMID:23357834' } },
    hl: { PO: 4 },
    note: 'PK: THE CLEANEST RECORD OF ITS GROUP — three of four values verify against a study with a real 34 mg intravenous arm. F 0.32 is ABSOLUTE and verbatim, and identically 32% for both the immediate- and prolonged-release products, so the formulation ambiguity is harmless here. V 540 L is verbatim under "Following IV administration ... mean tapentadol volumes of distribution were 540 and 471 l" — Study 1 value, NOT a midpoint of the two — so CLASS 6 IS ACQUITTED. The half-life is likewise intravenous-derived. ka 1.5 IS A DIGIT COLLISION: the only 1.5 in that abstract is a time to peak, "a longer time to Cmax (5.0 h vs 1.5 h)" — a Tmax in hours reused as a rate per hour, the first confirmed shape on the collision list. It happens to be nearly serviceable, which is exactly why it survived. ITS EFFECT-COMPARTMENT VALUE IS AN APPROXIMATION OF AN APPROXIMATION: borrowed from hydrocodone, which is itself borrowed from dihydrocodeine miosis — two analogy hops from any measurement, now made visible in that note.',
    summary: 'tapentadol — cleanest in its group; its ka is a Tmax reused as a rate' },

  { slug: 'sumatriptan', guard: (c) => c.pk?.PO?.ka_hr === 0.7,
    pk: { PO: { V_L: 170, F: 0.14, source_pmid: 'PMID:7768259' },
          SC: { V_L: 170, F: 0.96, source_pmid: 'PMID:7768259' } },
    hl: { PO: 1.8, SC: 2 }, refs: ['PMID:7768259', 'PMID:27613076'],
    note: 'PK: ROUTE ATTRIBUTION WAS SCRAMBLED, THOUGH THE NUMBERS WERE RIGHT. Its oral row cited a PROPRANOLOL INTERACTION study at a 300 mg dose that never mentions bioavailability or volume; both are verbatim in a paper already in this record references — "The mean subcutaneous bioavailability is 96% compared to 14% for the oral tablet" and "a large apparent volume of distribution (170 l)". The oral half-life of 1.8 h does verify there and is correctly the sumatriptan-alone arm rather than the propranolol one. CLASS 6 IS CLEARED BY PHYSIOLOGICAL REDUCTIO: were 170 L an apparent volume it would imply a true volume of 24 L, impossible for this drug, so pairing it with either bioavailability is right. MY OWN PREMISE THAT ITS ABSORPTION PARAMETER WAS DOING THE WRONG JOB IS REFUTED — "The lower bioavailability following oral administration is due mainly to presystemic metabolism", so the loss correctly lives in F and the record SHAPE is sound. Both ka values fail: the oral one is dose-mismatched, since absorption rate is the single nonlinear parameter in this drug, and the subcutaneous 3 implies a 49-minute peak against a measured 15 minutes, making the injection three times slower than it is. The intranasal route is declared with no parameters at all and is removed; the one paper covering all four routes is entirely qualitative.',
    summary: 'sumatriptan — right numbers, wrong papers; its SC ka makes the injection 3x too slow' },

  { slug: 'clonazepam', guard: (c) => c.pk?.PO?.ka_hr === 2.5,
    pk: { PO: { V_L: 180, F: 0.9, source_pmid: 'PMID:12646763' } },
    hl: { PO: 39 },
    note: 'PK: THE BEST-SOURCED RECORD OF ITS GROUP, and three of four values verify against a three-way intravenous, intramuscular and oral crossover — so every parameter has an intravenous anchor. Each was also the RIGHT selection from among several in the same sentence: F 0.9 is the oral 90% and not the intramuscular 93% nor an average; the half-life is "p.o. 39.0 h" and not the intravenous 38.0 nor the mean of three; and V 180 L is a terminal volume from a study containing a real intravenous arm, so class 6 does not apply. ka 2.5 is a back-derivation to a suspiciously round 1.99 h rather than to that paper own verbatim oral time to peak of 1.7 h. THE MODEL-CLASS ERROR I EXPECTED IS ABSENT: its effect-compartment value is not fitted to a seizure-frequency endpoint over weeks — it is unsourced clinical folklore, honestly flagged, which is a lesser and different problem. The genuine benzodiazepine EEG effect-compartment models were chased and rejected: one publishes no rate at all and finds ACUTE TOLERANCE, which would make a naive value wrong anyway; the other is a different drug, given intravenously, in sheep.',
    summary: 'clonazepam — best-sourced in its group; the feared model-class error is absent' },

  { slug: 'canagliflozin', guard: (c) => c.half_life_hr?.PO === 11,
    pk: { PO: { V_L: 119, F: 0.65, source_pmid: 'PMID:27136910' } },
    hl: { PO: 11.6 },
    note: 'PK: THE BEST RECORD OF ITS GROUP, AND THE CROSS-DRUG TRANSPLANT SCREEN COMES BACK NEGATIVE. F 0.65 and V 119 L are both verbatim from an oral-plus-intravenous-microdose study — "The absolute oral bioavailability of canagliflozin was 65%" and "Vdss 83.5 (29.2) L, Vdz 119 (41.6) L" — the volume intravenous-derived, so the pairing is right. THE DANGEROUS NEAR-MISS IS RECORDED SO IT IS NOT "FIXED" LATER: dapagliflozin stores V 112 L and its published volume is about 118, within one unit of this record 119 — but 119 is verbatim this drug own intravenous value in its own study. Coincidence, not transplant, and the empagliflozin-dapagliflozin pair found in the previous batch stays isolated. The half-life was truncated from its own paper "t1/2 11.6 (0.70) hours". ka 1.2 appears nowhere, and this record own population reference gives the reason it should not be re-sourced rather than replaced: absorption is "sequential zero- and first-order absorption" with a lag, so a bare first-order rate is the wrong model class.',
    summary: 'canagliflozin — best in group; no gliflozin value is borrowed' },

  { slug: 'montelukast', guard: (c) => c.pk?.PO?.V_L === 24,
    pk: { PO: { V_L: 10.5, F: 0.66, source_pmid: 'PMID:8692739' } },
    hl: { PO: 4.9 }, refs: ['PMID:8692739', 'PMID:10722763'],
    note: 'PK: ITS CITATION IS INTERNALLY CONTRADICTORY AND SHOULD NOT HAVE BEEN THE SOURCE WHATEVER WE STORED — it reports concentrations holding inside a narrow band "at 0.5-12 hours" while also reporting a 2.63 h elimination half-life, which over that span would require a nine-fold fall. Its stored half-life of 4 h matches neither figure in it, and V 24 L is 0.34 L/kg times an assumed weight, a computed APPARENT volume paired with an independent bioavailability and two and a half times the measured intravenous one. All four values now come from one study with rising intravenous doses followed by an oral tablet in the same subjects: "CL, Vss ... were 45.5 ml/min, 10.5 l" and "the AUC, Cmax, Tmax, apparent t1/2, MAT, and bioavailability (F) ... averaged 2441 ng.hr/ml, 385 ng/ml, 3.7 hr, 4.9 hr, 3.4 hr, and 66%". THE LOPERAMIDE QUESTION ANSWERS IN THIS RECORD FAVOUR WITH DIRECT PROOF: intravenous and oral montelukast were run head to head in 51 asthmatics, and the intravenous arm moved lung function within fifteen minutes — the target is unambiguously plasma-coupled.',
    summary: 'montelukast — a self-contradictory source replaced; an IV arm proves plasma coupling' },

  { slug: 'buspirone', guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { V_L: 380, F: 0.04, source_pmid: 'PMID:10320950' } },
    hl: { PO: 2.5 }, refs: ['PMID:10320950', 'PMID:11401009', 'PMID:17494642'],
    note: 'PK: THE BACKLOG SUSPICION AGAINST THIS RECORD IS REFUTED AND THE REAL DEFECT IS SOMEWHERE ELSE. Section 11 flagged it as the most sensitive consumer of the double-division; it is not. Its own arithmetic clears it: F times dose divided by V gives 0.00211 mg/L against a measured peak of "approximately 2.5 micrograms/L", a 16% shortfall which is the ordinary shape of a steady-state volume in a one-compartment model — WERE F APPLIED TWICE THE MODEL WOULD PREDICT ABOUT A TWENTY-FIFTH OF THAT. So the pairing is right. Its citation, however, is a grapefruit-juice interaction study stating only fold-changes; both surviving values are verbatim elsewhere, "The absolute bioavailability of buspirone is approximately 4%" and "an elimination half-life of about 2.5 hours". V 380 L is 5.3 L/kg times an assumed 71.7 kg, computed. ka 1.5 predicts a 1.38 h peak against its own citation verbatim 0.75 h. CLASS 5 IS ALSO LIVE AND UNMODELLED: metabolite exposures run "approximately 12 ... and 49 ... fold higher than the exposure of the parent". THE OCCUPANCY ROW IS THE URGENT DEFECT — see the receptor block.',
    summary: 'buspirone — the §11 class-6 suspicion is refuted by arithmetic; its occupancy is the defect' },

  { slug: 'vardenafil', guard: (c) => c.half_life_hr?.PO === 4.5,
    pk: { PO: { V_L: 208, F: 0.15, source_pmid: 'PMID:15224134' } },
    hl: { PO: 4 }, refs: ['PMID:15224134', 'PMID:12638394'],
    note: 'PK: ITS CITATION MEASURED A FREEZE-DRIED ORODISPERSIBLE TABLET CO-FORMULATED WITH DAPOXETINE, while this record doses are the standard tablet — and it states none of the four stored values. TWO COLLISIONS WERE AVAILABLE IN THE SOURCES AND THE RECORD FELL FOR NEITHER, WHICH IS WORTH RECORDING: that paper offers only "relative bioavailability values of 100.9 and 85%", and the replacement paper states F beside a competitor — "an absolute bioavailability of 14.5% (vs 40% for sildenafil)" — with the record correctly holding 0.15 rather than 0.40. Its occupancy row does the same, taking 0.7 nM rather than the parenthetical 6.6 nM that is sildenafil. t½ 4.5 is the MIDPOINT of a printed "about 4-5 h" and becomes the verbatim 4. CLASS 6 IS ACQUITTED BY ARITHMETIC: F times dose over V gives 0.0144 mg/L against a measured 0.0171, a 16% shortfall, where double-division would have predicted seven times low. V 208 L is the label steady-state figure, unsupported by any abstract but correctly PAIRED, so removing it while keeping F would be worse than leaving it. ka 1.4 implies a 1.77 h peak against "Tmax approximately 40 min".',
    summary: 'vardenafil — an ODT study under a tablet row; class 6 acquitted by arithmetic' },
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

/** Routes declared in routes[] with no pk block behind them and no citation anywhere. */
const ROUTE_DROPS: Record<string, string[]> = {
  promethazine: ['IM', 'PR'], metoclopramide: ['IM'], butorphanol: ['IM'], sumatriptan: ['IN'],
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
 * References supporting NOTHING on the record they sit on. Every one was checked
 * against all three uses — PK provenance, receptor_occupancy, interactions — per
 * the standing rule adopted after four reversals of exactly this judgement.
 */
const REF_DROPS: Record<string, string[]> = {
  nifedipine: ['PMID:23447047'],    // SR assay-validation paper; supports nothing on an IR row
  carvedilol: ['PMID:1982759'],     // beta-blocker PK review that never mentions carvedilol
  citalopram: ['PMID:27738376'],    // a PAROXETINE review; citalopram never named
  fluoxetine: ['PMID:27738376'],    // same paper, same reason
  escitalopram: ['PMID:10674711'],  // Jan-2000 review of five SSRIs; this drug not marketed until 2002
  duloxetine: ['PMID:23084899'],    // med-chem THIQ series; duloxetine not named, already re-cited away
  mirtazapine: ['PMID:26143953', 'PMID:15771415'], // opioid/benzo overdose epidemiology; med-chem
  risperidone: ['PMID:11459121', 'PMID:9430133'],  // 5-HT ligand paper; abandoned narrative review
  clozapine: ['PMID:11459121'],     // orphaned when alpha-1 moved to Proudman 2020
  prucalopride: ['PMID:10646498'],  // 5-HT4 gene cloning; prucalopride not mentioned
  ropinirole: ['PMID:9057850'],     // imidazoquinoline med-chem; ropinirole not mentioned
  pramipexole: ['PMID:37600497'],   // an EXTENDED-RELEASE study propping up an IR row
  clonazepam: ['PMID:1684924'],     // anxiolytics-in-the-elderly review; clonazepam never named
  erlotinib: ['PMID:24474302'],     // rifampicin DDI; exposure ratios only
  tolterodine: ['PMID:20590605'],   // names tolterodine only as a comparator, no value
};
for (const [slug, refs] of Object.entries(REF_DROPS)) {
  const c = need(slug);
  const gone = refs.filter((r) => (c.refs ?? []).includes(r));
  if (!gone.length) { log.push(`${slug} refs — already trimmed, skipped`); continue; }
  c.refs = (c.refs ?? []).filter((r) => !gone.includes(r));
  log.push(`${slug} — dropped non-substantiating ref(s): ${gone.join(', ')}`);
}

/**
 * receptor_occupancy corrections. Two shapes: a value replaced with a verbatim
 * one, and a value left standing with its provenance corrected. Nothing is
 * invented — where no abstract states a number, the row is annotated, not guessed.
 */
const RO_FIXES: { slug: string; receptor: string; ec50?: number; pmid?: string; note: string }[] = [
  { slug: 'metoclopramide', receptor: '5ht3', ec50: 0.068349, pmid: 'PMID:12593651',
    note: 'Rat cortical membrane (species flag). Re-sourced. The previous value was a MIDPOINT of a pKi span taken across two papers, as its own note conceded, and the paper it cited contains no metoclopramide number at all — the drug appears once, inside a rank order. This paper, already sourcing the D2 row, states it verbatim in the same sentence: "serotonin 5-HT(3) receptor; 0.97 nM vs 228 nM" — 228 nM for metoclopramide. A real rat measurement replaces a manufactured human midpoint.' },
  { slug: 'carvedilol', receptor: 'beta_1', ec50: 0.001618, pmid: 'PMID:15306222',
    note: 'Human beta-1, HEK293 cells expressing a single subtype. Verbatim: "The affinity rank order and pKi values of ARs for carvedilol were as follows: alpha1D-AR (8.9)>alpha1B-AR (8.6)>beta1-AR (8.4)>beta2-AR (8.0)>alpha1A-AR (7.9)". pKi 8.4 -> 3.98 nM x 406.47 / 1e6. The previous value was 4.5 nM, the MIDPOINT of a stated "approximately 4-5 nM"; the two sources agree, since 3.98 falls inside that band.' },
  { slug: 'carvedilol', receptor: 'beta_2', ec50: 0.004065, pmid: 'PMID:15306222',
    note: 'Human beta-2, same paper and same sentence: pKi 8.0 -> 10 nM x 406.47 / 1e6. The previous value was ONE HUNDRED TIMES more potent than this human measurement and was a midpoint taken ACROSS TWO PAPERS, from an abstract naming only bisoprolol and timolol.' },
  { slug: 'carvedilol', receptor: 'alpha_1', ec50: 0.005117, pmid: 'PMID:15306222',
    note: 'Human alpha-1A, same paper: pKi 7.9 -> 12.59 nM x 406.47 / 1e6. THE PREVIOUS VALUE WAS THIS RECORD OWN BETA-1 NUMBER IN THE ALPHA-1 FIELD: it was byte-identical to the beta-1 row and back-solves to pKi exactly 8.40, which is carvedilol beta-1 affinity, while its alpha-1A is 7.9. One source number entered into two different fields, in the wrong one.' },
  { slug: 'solifenacin', receptor: 'muscarinic', ec50: 0.003625, pmid: 'PMID:12122494',
    note: 'M3. Verbatim: "In radioligand binding assays, p K(i) values of solifenacin for M(1), M(2), and M(3) receptors were 7.6, 6.9, and 8.0, respectively." pKi 8.0 -> 10 nM x 362.5 / 1e6. The previous value was a MIDPOINT of a 7.7-8.0 range whose lower endpoint came from a paper stating no pKi for this drug at all. SPECIES CAVEAT: the abstract does not say the assay used human receptors, so the earlier "human M3" claim is withdrawn rather than repeated.' },
  { slug: 'prucalopride', receptor: '5-HT4', ec50: 0.000924, pmid: 'PMID:11438309',
    note: 'Human 5-HT4a. Verbatim: "mean pK(i) estimates of 8.60 and 8.10 for the human 5-HT(4a) and 5-HT(4b) receptor". pKi 8.60 -> 2.51 nM x 367.9 / 1e6. ONE ISOFORM IS CHOSEN EXPLICITLY: averaging the two would recreate the midpoint defect this replaces, since the previous value was pKi 7.80, the middle of a curated 7.0-8.6 range.' },
  { slug: 'buspirone', receptor: '5-HT1A', ec50: 0.1465, pmid: 'PMID:17494642',
    note: 'IN-VIVO occupancy EC50, rat dorsal raphe (species flag), verbatim: "6-OH-buspirone and buspirone increased 5-hydroxytryptamine (HT)(1A) receptor occupancy in a concentration-dependent manner with EC(50) values of 1.0 +/- 0.3 and 0.38 +/- 0.06 microM in the dorsal raphe". THE PREVIOUS VALUE WAS AN IN-VITRO MEMBRANE-BINDING Ki AND IT SHIPPED A USER-FACING ERROR: it made the model report 30-39% occupancy at a therapeutic dose, while human PET measured "5+/-17%" and concluded buspirone "is already clinically effective at LOW LEVELS of 5-HT1A receptor occupancy". 0.38 uM is 25x the in-vitro Ki.' },
  { slug: 'risperidone', receptor: 'alpha_1', pmid: 'PMID:32608144',
    note: 'Re-attributed. The previous citation studies 5-HT-receptor ligands and NEVER MENTIONS RISPERIDONE; this one names it — "antipsychotics (eg, chlorpromazine and risperidone) had high alpha1-adrenoceptor affinities" — from [3H]prazosin whole-cell binding in CHO cells expressing full-length human alpha1 subtypes. The numeric value remains a table figure rather than abstract-verbatim; only the attribution is now correct. Clozapine had already made this exact substitution.' },
  { slug: 'atenolol', receptor: 'beta_1',
    note: 'APPROXIMATION, NOT A MEASUREMENT — recorded here because the value cannot be sourced. The cited abstract contains no atenolol pKi; its only atenolol number is "(-)-atenolol 1,000", a POTENCY RATIO. The stored value back-solves to pKi 7.15, a midpoint aggregated across three studies. No verbatim human atenolol beta-1 affinity exists in any abstract found, so it is retained as a declared aggregate rather than replaced by a guess.' },
  { slug: 'pramipexole', receptor: 'dopamine_d3',
    note: 'APPROXIMATION, NOT A MEASUREMENT. NEITHER CITED PAPER CONTAINS AN AFFINITY FOR THIS DRUG: one gives only "pramipexole ... 15 ... times more potent ... at the D3 than at the D2 receptor" — a SELECTIVITY RATIO sitting beside the drug name, a live collision hazard — and the other only "a 5-fold selectivity". The stored value back-solves to pKi 8.55, the midpoint of a curated 8.4-8.7 range, and neither endpoint appears in either abstract. No replacement is proposed. This record already applied exactly this reasoning to its D2 row, declining to author it because the range was too wide.' },
  { slug: 'lurasidone', receptor: 'dopamine_d2',
    note: 'Table-sourced, not abstract-verbatim: the cited abstract contains NO Ki numerals, only "Lurasidone was found to have potent binding affinity for dopamine D(2), 5-hydroxytryptamine 2A (5-HT(2A)), 5-HT(7)". It is the correct primary paper. SPECIES IS UNRESOLVED across this record three occupancy rows — two say rat and one says human, while the paper says only "using cloned human receptors OR membrane fractions prepared from animal tissue" without disambiguating per receptor.' },
];
for (const f of RO_FIXES) {
  const c = need(f.slug);
  const row = (c.receptor_occupancy ?? []).find((r) => r.receptor === f.receptor);
  if (!row) { log.push(`${f.slug}/${f.receptor} — no such occupancy row, skipped`); continue; }
  if (String(row.note ?? '') === f.note) { log.push(`${f.slug}/${f.receptor} — already corrected, skipped`); continue; }
  if (f.note.length > 600) throw new Error(`${f.slug}/${f.receptor} occupancy note ${f.note.length} > 600`);
  if (f.ec50 != null) row.ec50_mg_l = f.ec50;
  if (f.pmid) row.source_pmid = f.pmid;
  row.note = f.note;
  log.push(`${f.slug} — ${f.receptor} occupancy ${f.ec50 != null ? 'value replaced' : 'note/provenance corrected'}`);
}

/** Occupancy rows carrying a number their own citation does not state, for a drug it does not measure. */
const RO_DROPS: Record<string, string[]> = { butorphanol: ['mu_opioid', 'kappa_opioid'] };
for (const [slug, receptors] of Object.entries(RO_DROPS)) {
  const c = need(slug);
  const before = (c.receptor_occupancy ?? []).length;
  const kept = (c.receptor_occupancy ?? []).filter((r) => !receptors.includes(String(r.receptor)));
  if (kept.length === before) { log.push(`${slug} occupancy — already removed, skipped`); continue; }
  if (kept.length) c.receptor_occupancy = kept; else delete c.receptor_occupancy;
  log.push(`${slug} — removed ${before - kept.length} occupancy row(s): one number from a paper that states none`);
}

/**
 * Effect-compartment corrections. Records carrying receptor_occupancy rows keep a
 * value — the solver needs one — demoted to a declared approximation with the
 * evidence stated. That rule was adopted in batch 4 and it binds every entry here:
 * group 5 recommended deleting four outright, and all four have occupancy rows.
 */
const EC_FIXES: Record<string, { keo: number; note: string; pmid?: string; species?: string; why: string }> = {
  promethazine: { keo: 1, note: 'Approximation; no published kₑₒ. THE PREVIOUS NOTE COMMITTED A DIGIT COLLISION IN PROSE: it claimed sedation onset "within ~1 h" from a paper that states no onset at all — 1 h is that study EARLIEST SAMPLING TIME, from a schedule running "at 1, 2, 3, 4, 6, 8, 10 and 122 hours post-dose". The value is a placeholder; the direction (central H1 sedation lagging plasma) is sound, the magnitude rests on nothing.', why: 'its note read an earliest sampling time as a measured onset' },
  metoclopramide: { keo: 0.5, note: 'Approximation; no published kₑₒ. It is a class analogy to haloperidol. The fabricated citation this note previously flagged HAS BEEN REMOVED — the imperative "Remove the fabricated citation and log" was stale and is rewritten here so a later auditor does not re-chase it.', why: 'its own note carried a stale instruction that had already been carried out' },
  butorphanol: { keo: 12.6, species: 'rat', note: 'Approximation, DOWNGRADED. Rat IV EEG. The abstract confirms the model shape — "hysteresis was best described by a one-compartment biophase distribution model with identical values for k1e and keo" — and confirms 0.21/min falls inside its stated "0.04 to 0.47 min(-1)" range, but the drug-specific figure lives in a table, not the abstract, as the note already said. Treating a table value as abstract-verbatim was the error; the sign and species were always right.', why: 'a table value was being carried as abstract-verbatim' },
  fluphenazine: { keo: 0.5, note: 'Approximation; NO PUBLISHED kₑₒ EXISTS FOR ANY ANTIPSYCHOTIC IN THIS BATCH — fourteen PET and PK/PD papers were chased and none reports one. The definitive modern D2-occupancy analysis for this class uses "an Emax model relating D2RO with plasma levels", a DIRECT model with no effect compartment at all. Retained only because receptor_occupancy rows need a value. Sign is admissible: oral Tmax precedes central occupancy.', why: 'no published keo exists for the class; the modern model has no effect compartment' },
  lurasidone: { keo: 0.5, note: 'Approximation; no published kₑₒ. Fourteen antipsychotic PET/PK-PD papers chased across this batch; none reports an effect-compartment rate, and the definitive recent analysis of this class fits a DIRECT concentration-occupancy relationship instead. Placeholder, retained because occupancy rows need one.', why: 'class-wide placeholder, no published value' },
  risperidone: { keo: 0.5, note: 'Approximation; no published kₑₒ. The factual claims in the previous note DO verify against their source — 1 mg orally in three healthy men giving "a 5-HT2 receptor occupancy about 60%" and "D2 dopamine receptor occupancy ... about 50%" — so the note is accurate; the 0.5 is still a placeholder. No effect-compartment rate exists for this drug.', why: 'note accurate, value a placeholder' },
  paliperidone: { keo: 0.5, note: 'Approximation; no published kₑₒ, and NUMERICALLY NEAR-IRRELEVANT HERE: against a time to peak of 24 hours, an equilibration half-life of 1.4 h is indistinguishable from instantaneous. Retained only because occupancy rows need a value.', why: 'no published value, and inert against a 24 h Tmax' },
  clozapine: { keo: 0.5, note: 'Approximation; no published kₑₒ. Same class-wide gap as the other antipsychotics in this batch: no effect-compartment rate is published for any of them, and the modern D2-occupancy literature fits direct concentration-response models. Placeholder.', why: 'class-wide placeholder, no published value' },
  fluoxetine: { keo: 0.3, note: 'Approximation; no published kₑₒ. THE PREVIOUS RATIONALE WAS BACKWARDS AND ITS EVIDENCE WAS THE WRONG MODEL CLASS. It argued a long plasma half-life "makes onset slow", but 0.3/h is an equilibration half-life of 2.3 h — FAST — contradicting the number it justified. And it leaned on occupancy measured "before and after 4 weeks of medication administration", a steady-state endpoint carrying no time-course information. Placeholder.', why: 'its rationale contradicted its own value and rested on a 4-week endpoint' },
  mirtazapine: { keo: 1, note: 'Approximation; no published kₑₒ. THE PREVIOUS JUSTIFICATION WAS IRRELEVANT TO THE QUANTITY: it cited an oral time to peak of about 2 h, which is a property of ABSORPTION and has no bearing on effect-site equilibration. Sign is admissible; the magnitude rests on nothing. For scale, a human PET study measured 60% 5-HT2A occupancy at a clinically effective 30 mg dose — a real datum this record can be judged against, unlike a Tmax.', why: 'justified by a Tmax, which says nothing about effect-site equilibration' },
  solifenacin: { keo: 0.5, note: 'Approximation; no published kₑₒ, and TWO REASONS IT CANNOT BE FITTED LATER. The clinical endpoint is weeks long — "The full therapeutic effects of solifenacin occur after 2-4 weeks of treatment" — so anything fitted to it would measure a clinical trajectory, three orders of magnitude from this value. And the acute effects that CAN be measured (salivary flow, visual nearpoint) track plasma directly.', why: 'weeks-long clinical endpoint; acute effects track plasma directly' },
  tolterodine: { keo: 1, note: 'Approximation; no published kₑₒ, and A SPECIFIC TRAP IS RECORDED HERE. This drug own source reports that "The lack of a direct relationship between tolterodine serum concentrations and effects on stimulated salivation suggested the presence of pharmacologically ACTIVE METABOLITE(S)". So the plasma-to-effect dissociation is an ANALYTE problem — an unmeasured equipotent metabolite — not a delay. Any kₑₒ fitted to close it would be a wrong-analyte defect in an effect-compartment costume.', why: 'the apparent hysteresis is an unmeasured equipotent metabolite, not a delay' },
  prucalopride: { keo: 0.5, note: 'Approximation; no published kₑₒ, AND THE OBSERVED PHARMACODYNAMICS ARE NOT AN EFFECT-COMPARTMENT SHAPE AT ALL: "Marked increase of defecation frequencies ... were seen after a single dose. The responses during multi-dose period were less remarkable and returned to baseline in 3 days." Acute onset followed by tachyphylaxis over days is a tolerance phenomenon that no equilibration rate can express in either direction.', why: 'acute onset then tachyphylaxis — a tolerance shape, not a delay' },
  ropinirole: { keo: 0.5, note: 'Approximation, and THE ONLY HUMAN PK/PD MODEL FOR THIS DRUG REFUTES IT IN BOTH RESPECTS. It uses "an indirect response model ... for three of five subjects whose prolactin concentrations nadired BEFORE ropinirole reached C_max" — the published model class is not an effect compartment, and in most subjects the EFFECT PRECEDED THE PLASMA PEAK, which no positive rate can produce.', why: 'effect precedes plasma peak in 3 of 5 subjects; published model is indirect-response' },
  pramipexole: { keo: 0.5, note: 'Approximation; no published human kₑₒ. The only PK/PD study located is rodent microdialysis, which is neither human nor an effect-compartment parameterisation. Placeholder, retained because an occupancy row needs one.', why: 'no human keo; the only PK/PD study is rodent microdialysis' },
  montelukast: { keo: 0.5, note: 'Approximation, and WRONG IN DIRECTION. A head-to-head intravenous-versus-oral trial in 51 asthmatics found oral montelukast already at 12.90% FEV1 improvement at one hour against a time to peak of 3.7 h — the effect is not lagging plasma. The honest reading is NO MEASURABLE HYSTERESIS; treat the effect site as equilibrated. Occupancy also sits at 98-99.9% all interval, so the curve conveys nothing.', why: 'a head-to-head IV/oral trial shows no lag to represent' },
  vardenafil: { keo: 1, note: 'Approximation, and PROBABLY IMPOSING A LAG THE DATA DO NOT SUPPORT: "completion of successful sexual intercourse is possible for some patients 16 minutes after its administration" against a time to peak of 40-60 minutes. Stated carefully — "for some patients" is a responder tail, and the margin is far tighter than the confirmed sign-inversions elsewhere — so the defensible reading is NEAR-INSTANTANEOUS equilibrium, not an inverted sign.', why: 'effect at 16 min against a 40-60 min Tmax; near-instantaneous equilibrium' },
  buspirone: { keo: 1, note: 'Approximation. A MODEL-CLASS MISMATCH THAT THIS NOTE ALREADY DECLARED HONESTLY and which is restated here: the anxiolytic effect builds over 2-4 weeks while this rate models a 0.7 h effect-site lag, so the two describe different processes. The composite output — occupancy peaking about an hour after a dose — is not anxiolysis, and neither half of it should be read as such. Retained because an occupancy row needs a value.', why: 'anxiolysis takes weeks; this rate models a 0.7 h lag' },
  hydrocodone: { keo: 2, note: 'Approximation, derived by analogy from DIHYDROCODEINE miosis: "The transfer half-life between plasma and effect site was 21.1 min (95% CI 11.1-34.7 min)", giving 1.97/h. A different compound and a derived number, both disclosed. Sign is correct.', why: 'analogy chain made explicit' },
  tapentadol: { keo: 2, note: 'Approximation, and AN APPROXIMATION OF AN APPROXIMATION — made visible here rather than left implicit. It is borrowed from hydrocodone 2.0/h, which is itself borrowed from a dihydrocodeine miosis study. Two analogy hops from any measurement, in neither case this drug. Sign is correct; nothing else about it is anchored.', why: 'two analogy hops from any measurement' },
  sumatriptan: { keo: 3, note: 'Approximation, and ITS CITED SUPPORT FAILS THREE WAYS. The quoted evidence is "at all time points from 15 minutes, SC sumatriptan was significantly better than DHE nasal spray at providing headache relief": the endpoint is a BINARY RESPONDER RATE; 15 minutes is the EARLIEST ASSESSMENT TIME, not a measured onset; and it is a between-treatment superiority claim, not an onset. It is also compound-level, asserting an injection-derived 14-minute equilibration for a tablet peaking at 1.5-2 h.', why: 'a responder-rate endpoint read as an onset, applied across two routes' },
  alogliptin: { keo: 1, species: 'rat', note: 'Approximation. THE SPECIES WAS MISSING AND THE FINDING IS NOT HUMAN: the note claimed "plasma DPP-4 inhibition observed within 15 min of an oral dose", but the source sentence ends "in RATS, DOGS, AND MONKEYS". Retained because an occupancy row needs a value. Note also that a plasma half-life does not express this drug duration at all — human inhibition at 24 hours after dosing ranges from 74% to 97%.', why: 'an animal finding was presented as human' },
};
for (const [slug, f] of Object.entries(EC_FIXES)) {
  const c = need(slug);
  if (!c.effect_compartment) { log.push(`${slug} kₑₒ — none present, skipped`); continue; }
  if (String(c.effect_compartment.note ?? '') === f.note) { log.push(`${slug} kₑₒ — already corrected, skipped`); continue; }
  if (f.note.length > 500) throw new Error(`${slug} kₑₒ note ${f.note.length} > 500`);
  c.effect_compartment = {
    keo_per_h: f.keo, approximated: true, note: f.note,
    ...(f.species ? { source_species: f.species } : {}),
  };
  log.push(`${slug} — kₑₒ demoted to a declared approximation: ${f.why}`);
}

/** Records where nothing survives. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  elvitegravir: ['uncharacterized',
    'ZERO OF FOUR VALUES SURVIVE. Its half-life is CONTRADICTED BY ITS OWN ONLY REFERENCE, which says boosting "prolongs its elimination half-life to ~9.5 hours" against a stored 13. F 0.5 is unmeasurable in principle, verified not assumed: a search for an absolute bioavailability returns ZERO records and no intravenous formulation exists. Its ka is byte-identical to erlotinib. And it is never given alone: boosting moves the half-life ~3x and food moves exposure ~2x, neither declarable.',
    ['PMID:21348537', 'PMID:24615728']],
  enzalutamide: ['uncharacterized',
    'ITS ka IS A Tmax-STORED-AS-RATE COLLISION — the abstract only 1.5 is "median Tmax, 1.5 hours" — and it implies 3.8 h, not reproducing even that. t½ 130 matches NOTHING: the same paper says "mean t½, 90.7 hours" and the steady-state figure is 5.8 days. F 0.85 was never measured — no intravenous formulation exists — and 0.85 is the label ABSORBED FRACTION, a different quantity. TWO CO-EQUAL ANALYTES: "AUC0-inf of enzalutamide plus M2 was 828 ug h/mL versus 368 ug h/mL for enzalutamide alone".',
    ['PMID:25917876', 'PMID:30642613']],
  tolterodine: ['uncharacterized',
    'EVERY STORED SCALAR IS A RANGE ENDPOINT, A ROUNDING, OR ABSENT FROM ITS CITATION, which carries no bioavailability, volume or absorption data at all. V 113 L is the TOP endpoint of "0.9 to 1.6 l/kg" times an assumed weight; the half-life is the bottom endpoint of "2-3 h". AND NO SCALAR CAN REPRESENT IT: bioavailability "ranged from 10 to 70%" in one cohort because that range IS the CYP2D6 split, and the acting species is a parent-plus-metabolite sum with opposite genotype dependence.',
    ['PMID:9247842', 'PMID:11327200']],
  alogliptin: ['uncharacterized',
    'ITS CITATION IS A CACO-2 CELL AND RAT TRANSPORTER STUDY, not a human PK paper. F 0.65 IS A TWO-STEP DIGIT COLLISION: its only candidate numeral is "high absorption rate (>60-71%)", which traces to a primary where that is not absorption at all but "mean fraction of drug excreted in URINE from 0 to 72 hours after dosing, 60%-71%" — then stored as bioavailability, and 0.65 is its midpoint. V 417 L and t½ 21 h appear in NO alogliptin abstract.',
    ['PMID:18405789', 'PMID:33952821']],
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
