/**
 * 2026-09-07-fraction-unbound-a4.ts
 *
 * Batch A4 of backlog §12, and the last of the fraction_unbound data batches.
 * 43 of 62 sourced, 19 gaps.
 *
 * ── THE SWEEP THIS BATCH TRIGGERED, WHICH MATTERED MORE THAN ITS VALUES ──
 * A4 group 2 noticed that sulindac's COX row is a human WHOLE-BLOOD assay, where
 * an fu correction double-counts. The A3 fix had screened for that by note TEXT
 * and caught one of seven rows citing Warner 1999, a 40-compound whole-blood
 * paper. Re-screening by source_pmid — the authoritative key — found six more,
 * THREE OF THEM LIVE: ketoprofen's second COX row (192x) and both of piroxicam's
 * (91x). The lesson is that provenance lives in the citation, not the prose.
 *
 * ── SIX MORE OF MY PRIORS WERE WRONG, TWO OF THEM REVERSING A PLANNED SKIP ──
 *   thiopental      I said saturable; its authors explicitly disproved that
 *   fludrocortisone I said saturable CBG like cortisol; it is dosed 200x lower
 *                   and sits ~0.5% of CBG capacity, so the analogy is false
 *   ketamine        I said ~12% bound; it is ~60%
 *   budesonide      I asked for a route-specific value; three labels agree it
 *                   is route-INDEPENDENT
 *   thc             I said 97-99%; nothing credible exceeds 97%
 *   triamcinolone   I flagged it as a possible CBG skip; its own paper tested
 *                   exactly that over a 24-fold range and found binding constant
 *
 * ── AND THE MOST USEFUL SINGLE FINDING: TWO ERRORS CANCELLING ───────────
 * fluphenazine is skipped, and it must stay gated to a second fix. Its volume
 * runs the model twelvefold low, which accidentally does most of the work the
 * missing fu should do — the row shows ~23% occupancy where the repaired volume
 * alone would show ~78%. REPAIRING THE VOLUME WITHOUT AN fu WOULD CREATE A NEW
 * FALSE POSITIVE. The two changes have to land together.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; fraction_unbound?: number; fu_note?: string; refs?: string[]; [k: string]: unknown }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };

const FU: { slug: string; fu: number; note: string; refs?: string[] }[] = [
  // ── group 1 ────────────────────────────────────────────────────────
  { slug: 'metoprolol', fu: 0.89, refs: ['PMID:6114930'],
    note: 'Human: "did seem to relate to their degree of binding to plasma proteins (propranolol 93%, oxprenolol 80%, metoprolol 11%)" (PMID:6114930). The label agrees at 90% unbound but phrases it as "bound to serum ALBUMIN" — the isolated-protein shape, so the abstract total-binding figure is preferred even though they concur. Racemic parent. No stereoselective binding figure exists, and at ~10% bound no plausible enantiomer difference moves fu outside 0.85-0.92, so the CYP2D6 story does not reach this field.' },
  { slug: 'tramadol', fu: 0.80, refs: ['PMID:15509185'],
    note: 'Human: "plasma protein binding is about 20%" (PMID:15509185), and the label is the stronger sentence — "approximately 20% and binding also appears to be independent of concentration up to 10 mcg/mL". Racemic PARENT, matching this record mu-opioid row, which cites a (+/-)-tramadol Ki. M1 IS NOT COVERED: the opioid activity rides on that metabolite while every stored parameter describes the parent, so this fu inherits that same limitation — not a new defect, but the same one.' },
  { slug: 'metoclopramide', fu: 0.60, refs: ['PMID:3964535'],
    note: 'THE IDEAL SOURCE SHAPE FOR THIS FIELD: a free fraction stated directly, in humans, with the healthy arm separated from the diseased one. "The mean free fraction in renal disease (0.59 range 0.41-0.71) was not significantly different from controls (mean 0.6 range 0.56-0.69)" (PMID:3964535), 18 healthy age- and sex-matched individuals. The 0.59 in the same sentence is the RENAL arm. The label disagrees at about 30% bound (fu 0.70); the primary is preferred, and its own finding that AAG rather than albumin is the major binder explains why a nominal figure drifts.' },
  { slug: 'guanfacine', fu: 0.284, refs: ['PMID:3323255'],
    note: 'Human, 18 healthy male volunteers, oral and intravenous crossover: "The mean plasma protein binding results were 71.6%, not influenced by plasma concentration or route of administration" (PMID:3323255) — the source rules out both concentration and route dependence itself. Label agrees at approximately 70%.' },
  { slug: 'eszopiclone', fu: 0.249, refs: ['PMID:9951403'],
    note: 'ESZOPICLONE IS (+)-ZOPICLONE, verified against PubChem synonyms rather than assumed — so the racemic paper (+)-enantiomer row is this drug own figure: "79.3 +/- 5.5%, 83.8 +/- 5.2%, and 75.1 +/- 2.1%, for racemic zopiclone, (-)zopiclone and (+)zopiclone" (PMID:9951403). THE LITERATURE IS NOT A SINGLE OUTLIER: two mutually consistent measurements from one paper (racemate 79.3, (+) 75.1) against a label of 52-59%. And the widely-quoted "about 45%" comes from an abstract covering rats, dogs, rabbits AND humans with no species attached to that sentence. Conflict recorded; the spread is under 2x.' },
  { slug: 'anastrozole', fu: 0.60,
    note: 'LABEL-GRADE: "Anastrozole is 40% bound to plasma proteins in the therapeutic range" — that trailing phrase is a scope statement, not an admission of concentration dependence. A title-and-abstract search for a binding figure returns ZERO records. A near-null correction at 1.7x; its value is closing the field rather than moving the curve.' },

  // ── group 2 ────────────────────────────────────────────────────────
  { slug: 'alfentanil', fu: 0.093, refs: ['PMID:1729938'],
    note: 'Free fraction stated directly, 28 surgical patients sampled BEFORE induction so it is a pre-operative baseline: "The average free fraction of alfentanil was 9.3 +/- 3.9% (range 3.7-19.1%)" (PMID:1729938). That range is INTER-INDIVIDUAL SPREAD, not a measurement range, so the point value is stored rather than an endpoint. Three further papers converge at 11.5%, 0.11 and 11.8%, and the label says 92% bound — so the defensible band is 0.08-0.12. AAG-driven: cirrhosis 0.186, renal failure 0.19, and cardiopulmonary bypass shifts it.' },
  { slug: 'sufentanil', fu: 0.078, refs: ['PMID:2137997'],
    note: 'Human plasma, equilibrium dialysis, ADULT arm of a four-value sentence: "significantly higher in infants (11.5 +/- 3.2%; P less than 0.01) than in children (8.1 +/- 1.4%) or in adults (7.8 +/- 1.5%)" (PMID:2137997) — newborn 19.5% is in the same sentence. THE LABEL IS ITSELF A THREE-FIGURE TRAP: "approximately 93% in healthy males, 91% in mothers and 79% in neonates". An ICU study in 35 post-cardiac-surgery patients gives 88.4% and finds binding concentration-dependent IN THAT POPULATION — an ICU-specific finding, not a healthy-subject one, so it does not trigger a skip.' },
  { slug: 'bupivacaine', fu: 0.054, refs: ['PMID:2024561'],
    note: 'Human, NON-PREGNANT volunteer arm: "The free fraction was significantly higher in parturients (8.2% vs 5.4%)" (PMID:2024561). Racemic bupivacaine; levobupivacaine is a separate marketed drug. THE POST-OPERATIVE AAG EFFECT IS LARGE AND CONFIRMED: a second study found free fraction falling from "5.4% preoperatively to 2.7% in the postoperative period" — fu HALVES within days of surgery, in exactly the population receiving it. Both papers are one group using one method, so convergent but not independent. The labels carry no binding percentage at all.' },
  { slug: 'sulindac', fu: 0.021,
    note: 'LABEL-GRADE, and this is the SULFIDE — the correct analyte, since this record is declared pk_analyte: active-metabolite. "Sulindac, and its sulfone and sulfide metabolites, are 93.1, 95.4, and 97.9% bound to plasma proteins" — the order is unambiguous and the label states binding is constant over 0.5-2.0 mcg/mL. CONTESTED THREEFOLD: an ultrafiltration study in six normal subjects gives 6.01% free (fu 0.060), and it is hard to dismiss because its PARENT value validates against the label almost exactly (6.78% free vs the label 6.9%).' },
  { slug: 'fenofibrate', fu: 0.01,
    note: 'LABEL-GRADE, and the analyte is FENOFIBRIC ACID, which the label settles outright: "no unchanged fenofibrate is detected in plasma". "Serum protein binding was approximately 99% in normal and hyperlipidemic subjects" — NOTE SERUM, not plasma, and unlike the baricitinib case there is no plasma figure to prefer. A soft number in the sharp regime: "approximately 99%" could be 98.5% (fu 0.015) or 99.5% (0.005), a threefold band. A record defect found alongside: the occupancy row converts a fenofibric-acid EC50 using the PARENT mass, so its ec50_mg_l is 13% high.' },
  { slug: 'tizanidine', fu: 0.70,
    note: 'LABEL-GRADE: "Tizanidine is approximately 30% bound to plasma proteins" — plasma, not serum, stated beside the healthy-volunteer volume of distribution. No PubMed abstract carries a figure; the nearest are binding CONSTANTS against isolated HSA and AGP by fluorescence and docking, the olanzapine trap in its purest form. A 1.4x correction, so this is not where the remaining over-occupancy lives.' },
  { slug: 'dofetilide', fu: 0.40,
    note: 'LABEL-GRADE, a range stored at its under-correcting endpoint: "Plasma protein binding of dofetilide is 60-70%, is independent of plasma concentration, and is unaffected by renal impairment" — so fu spans 0.30 to 0.40, and the label rules out the concentration-dependence skip itself. A SPECIES TRAP CAUGHT: a paper stating "Protein binding increasing from 54% for dofetilide, the least lipophilic" is titled for the BEAGLE DOG and its binding was measured in dog plasma — right magnitude, right phrasing, and it would have passed unnoticed.' },

  // ── group 3 ────────────────────────────────────────────────────────
  { slug: 'propofol', fu: 0.0098, refs: ['PMID:7838996'],
    note: 'Human plasma, healthy volunteers, and the source settles the saturation question itself: "The free fraction of propofol in plasma was 0.98 +/- 0.12% and binding was NOT SATURABLE" (PMID:7838996). A second human study gives 1.07%. MY "~97-99%" PRIOR WOULD HAVE BEEN A THREEFOLD ERROR AT ITS LOWER END — both primaries say ~99.0%. THE ISOLATED-PROTEIN TRAP IS IN THE SAME ABSTRACT: "Albumin seems to play an important role (95% bound), whereas the participation of AGA was low (54% bound)" — neither is total binding.' },
  { slug: 'thiopental', fu: 0.157, refs: ['PMID:7094508'],
    note: 'MY PREDICTION THAT THIS WOULD BE A SATURATION SKIP WAS WRONG, AND THE SAME AUTHORS DISPROVED IT: "The protein binding of thiopental ... was found to be LINEAR over a concentration range of 93 +/- 60 micrograms/ml to 6.9 +/- 0.62 micrograms/ml. Thus, concentration-dependent or nonlinear protein binding of thiopental after a single iv bolus administration could not be demonstrated." Its textbook reputation is for ALBUMIN-DEPENDENCE — a population effect, visible as 28.0% free in chronic renal failure — not for saturation.' },
  { slug: 'misoprostol', fu: 0.19, refs: ['PMID:9120826'],
    note: 'Human serum, young and elderly, range stored at its under-correcting endpoint: "[3H]MPA serum binding (between 81 and 89 %) was similar and CONCENTRATION INDEPENDENT in the young and elderly subjects" (PMID:9120826). ANALYTE IS MISPROSTOL ACID, which is correct — the ester is not detectable in plasma — but that exposes a record defect: mw 382.54 is the methyl ESTER while the acid is 368.5. Both sources are SERUM. The label offers only an inequality, "less than 90% bound", whose maximum consistent fu is 1.0 and is therefore useless alone.' },
  { slug: 'remifentanil', fu: 0.30,
    note: 'LABEL-GRADE: "Remifentanil is approximately 70% bound to plasma proteins of which two-thirds is binding to alpha-1-acid-glycoprotein." A GENUINE 2.4-FOLD CONFLICT IS RECORDED: a 2025 equilibrium-dialysis study in 13 cardiac-surgery patients measures 27.9% bound, i.e. fu 0.72. The flip risk was checked by anchoring on propofol in the same sentence-group at 97.5%, so the semantics are right — but equilibrium dialysis over hours exposes remifentanil to esterase hydrolysis, which would bias apparent free upward. The label value is stored; the correction is only 1.4-3.3x either way.' },
  { slug: 'ropivacaine', fu: 0.06,
    note: 'LABEL-GRADE: "Ropivacaine is 94% protein bound, mainly to alpha1-acid glycoprotein", corroborated two ways — an abstract giving "approximately 94%", and the label OWN CLEARANCE ARITHMETIC, since total plasma clearance divided by unbound clearance gives 0.054. A SPECIES TRAP REJECTED: "Both drugs were highly bound to serum proteins (> 98%)" is a DOG study, right magnitude and phrasing to slip through. An infant study giving 10% free is a low-AAG population.' },
  { slug: 'zaleplon', fu: 0.40,
    note: 'LABEL-GRADE: "The in vitro plasma protein binding is approximately 60%+/-15% and is independent of zaleplon concentration over the range of 10 ng/mL to 1000 ng/mL" — plasma, explicitly a fraction bound, explicitly concentration-independent. The +/-15 is percentage points, so bound spans 45-75% and fu 0.55-0.25; the point value is stored since the label states it as one. No PubMed abstract carries a figure across five query shapes.' },
// ── group 4 ────────────────────────────────────────────────────────
  { slug: 'digoxin', fu: 0.77, refs: ['PMID:5771186'],
    note: 'The only primary with the figure verbatim in its group: "At concentrations of 2 mug/ml or less in plasma, only 23% of digoxin was bound" (PMID:5771186), human plasma, equilibrium dialysis. That 2 ug/mL is ~1000x above therapeutic and the abstract stated Ka rules out saturation, so it covers the range. Low binding is why digoxin is not dialysable. THE TRAP IS IN THE ADJACENT SENTENCES: the same abstract gives DIGITOXIN as "97% ... nondialyzable" (fu 0.03, a 25-fold error) and discusses digoxiGENIN; a second source pairs digitoxin at 2.6-6.9% free with the digoxin figure in one paragraph.' },
  { slug: 'alogliptin', fu: 0.80,
    note: 'LABEL-GRADE: "Alogliptin is 20% bound to plasma proteins." AND THE SAME LABEL SECTION CLOSES AN EARLIER AUDIT: this record was stripped to pk_unauthored when its F 0.65 proved to be a two-step digit collision, and the label names the culprit — "60% to 71% of the dose is excreted as unchanged drug in the urine" — while supplying real replacements: absolute bioavailability approximately 100%, terminal volume 417 L, half-life approximately 21 hours. Re-authoring from those would un-zero its DPP-4 curve; logged for a follow-up rather than done here.' },
  { slug: 'brimonidine', fu: 0.71,
    note: 'LABEL-GRADE: "Brimonidine was approximately 29% bound to plasma proteins in healthy subjects." No abstract carries a figure; every literature hit is alpha-2 RECEPTOR binding. A CAVEAT WORTH MORE THAN THE VALUE: this record only route is an ocular drop, whose systemic peak is sub-ng/mL against an ec50 of 8.2 ug/L — so the occupancy curve is modelling a systemic concentration with almost nothing to do with the drug site of action, and an fu correction does not fix that.' },
  { slug: 'atropine', fu: 0.56,
    note: 'LABEL-GRADE, and the saturability language does NOT trigger a skip once the arithmetic is done: "Atropine plasma protein binding is about 44% and saturable in the 2 mcg/mL to 20 mcg/mL concentration range" — but a 1 mg intravenous dose against this record volume gives roughly 7 ng/mL, THREE HUNDRED TO THREE THOUSAND TIMES BELOW that window, so therapeutic concentrations sit on the unsaturated plateau. Residual weakness: the label never says at what concentration the 44% was measured. The primary exists but reports no number in its abstract.' },
  { slug: 'ghb', fu: 1.0,
    note: 'LABEL-GRADE, an inequality whose maximum consistent fu is stored: "At GHB concentrations ranging from 3 mcg/mL to 300 mcg/mL, less than 1% is bound to plasma proteins" — so fu exceeds 0.99 and storing 1.0 under-corrects by at most 1%, which is harmless. This record oral doses put the peak inside that stated window. Primary human support exists but carries no number: "GHB did not bind to significant extent to plasma proteins over the therapeutic concentration range". A near-unbound value is the real finding here, not a missing one.' },
  { slug: 'budesonide', fu: 0.15,
    note: 'LABEL-GRADE, a range stored at its under-correcting endpoint. MY PREMISE THAT THIS NEEDED A ROUTE-SPECIFIC VALUE WAS WRONG: three separate labels — inhaled, oral delayed-release and oral extended-release — carry the IDENTICAL "85-90%", each stating it is concentration-independent across a range bracketing therapeutic exposure. A DIGIT COLLISION AVOIDED: a rectal-dosing paper "88%" is FIRST-PASS HEPATIC EXTRACTION, and 88% is also the number often quoted for this drug binding. The label adds that it shows "little or no binding to corticosteroid binding globulin", unlike cortisol.' },
  { slug: 'cbd', fu: 0.06,
    note: 'THE WEAKEST VALUE IN THIS BATCH, with three defects stacked in one label sentence: "Protein binding of the cannabidiol AND ITS METABOLITES was >94% in vitro." It is (a) an inequality in the sharp regime, spanning fu 0.06 down to ~0.001, so storing 0.06 could under-correct sixtyfold; (b) a LUMPED ANALYTE, the dronabinol failure exactly, when this record models parent CBD; and (c) stated without species, matrix or concentration. Lipoprotein-bound, so fu moves with fasting state — and the same label reports a fourfold Cmax rise with a high-fat meal.' },

  // ── group 5 ────────────────────────────────────────────────────────
  { slug: 'etomidate', fu: 0.249, refs: ['PMID:455872'],
    note: 'Free fraction stated directly, healthy volunteers: "markedly increased in patients with renal failure and in patients with hepatic cirrhosis, when compared with a group of healthy volunteers (43.4 +/- 2.9% and 44.2 +/- 2.1 versus 24.9 +/- 1.4%)" (PMID:455872). A second human study gives 76.5% bound, agreeing within 6%. THREE TRAPS IN THAT CORROBORATING ABSTRACT WERE AVOIDED: a dog value of 75.4% in the same sentence, a separate figure for the metabolite R 28 141, and an ISOLATED 4% HSA figure of 78.5% that is HIGHER than whole plasma. fu roughly doubles in renal failure and cirrhosis.' },
  { slug: 'fentanyl', fu: 0.156, refs: ['PMID:6214227'],
    note: 'Human plasma, HEALTHY VOLUNTEERS — the population I did not expect to get: "In human plasma, 84.4% of fentanyl was bound, 92.5% of sufentanil, 92.1% of alfentanil and 93.6% of lofentanil. Plasma protein binding of the four analgesics was INDEPENDENT OF THEIR CONCENTRATION over the whole therapeutic range" (PMID:6214227) — that second sentence rebuts the skip criterion in the source own words. Rats and dogs are in the same paper and three analogues in the same sentence.' },
  { slug: 'dexmedetomidine', fu: 0.06,
    note: 'LABEL-GRADE: "Dexmedetomidine protein binding was assessed in the plasma of normal healthy male and female subjects. The average protein binding was 94% and was CONSTANT ACROSS the different plasma concentrations tested." Plasma, healthy, sex-invariant, concentration-independent. The abstract that echoes 94% is restating the label, so the whole finding is label-grade. Its own measured line is a different population — 90.4% in critically ill patients, fu 0.096 — which would be defensible if matching the ICU use case, and under-corrects. An isolated HSA-and-AAG study was rejected.' },
  { slug: 'enzalutamide', fu: 0.03,
    note: 'LABEL-GRADE, a range stored at its under-correcting endpoint: "Enzalutamide is 97% to 98% bound to plasma proteins, primarily albumin. N-desmethyl enzalutamide is 95% bound." The PARENT figure is the right one — this record mass and its occupancy ec50 are both the parent. Sharp regime at one edge: 97 versus 98 is a 1.5x difference in fu and no source resolves it. A SPECIES TRAP NAMED FOR THE FUTURE: a paper giving 94.7% binding is in RATS, and it carries a rat oral bioavailability of 89.7% two sentences away — precisely the shape that would tempt anyone restoring this record stripped F.' },
  { slug: 'dorzolamide', fu: 0.67,
    note: 'LABEL-GRADE: "Dorzolamide binds moderately to plasma proteins (approximately 33%)." THE MATRIX TRAP WAS REAL AND WAS DODGED: a study reporting "98% or 71% of the drug was taken up by the erythrocytes" is RED-CELL PARTITIONING onto carbonic anhydrase, saturable, and storing it as fu would repeat the acetazolamide defect — the label keeps the red-cell and plasma sentences in separate clauses, which is what makes 33% safe. Inert today: this record is local-acting with no systemic PK, so no plasma concentration is simulated.' },

  // ── group 6 ────────────────────────────────────────────────────────
  { slug: 'naloxone', fu: 0.540, refs: ['PMID:6519154'],
    note: 'The best-quality source of its group: percent FREE stated directly, 18 healthy adults, equilibrium dialysis at 37 C, plasma at pH 7.4. "Percent free naloxone in adult (means = 54.0) was lower (p less than 0.01) than in foetal (means = 61.5) plasma" (PMID:6519154), and the same abstract states the free fraction was independent of concentration from 9 ng/mL to 2.5 ug/mL. TWO TRAPS LIVE IN THAT ONE ABSTRACT AND BOTH ARE AVOIDED: 61.5 is UMBILICAL CORD plasma, and a 68.7 figure elsewhere in it is "buffered solutions of purified HSA" — isolated protein.' },
  { slug: 'ketamine', fu: 0.40, refs: ['PMID:11956671'],
    note: 'MY "~12% BOUND" PRIOR WAS WRONG BY FIVEFOLD. Human serum: "The percentage of drug bound to serum proteins at 30 degrees C was found to be 69%, 60% and 50% for DHNK, ketamine and NK" (PMID:11956671) — a THREE-ANALYTE sentence whose MIDDLE figure is ketamine. The classic source behind the 12% figure has NO PubMed abstract, and that paper\'s own opening says why it exists: "Scarce data were observed in the literature about the binding of ketamine to human plasma proteins." SERUM not plasma; binding falls as temperature rises, so true fu is likely slightly above 0.40.' },
  { slug: 'lidocaine', fu: 0.302, refs: ['PMID:7357791'],
    note: 'Unbound stated directly, 24 healthy subjects, equilibrium dialysis at a mid-therapeutic 3 ug/mL: "The percentage of unbound lidocaine varied from 19.9 to 38.8 (30.2 +/- 5, mean +/- SD) was inversely related to the concentration of alpha 1-acid glycoprotein" (PMID:7357791). AAG rises to a maximum around day 7 after myocardial infarction, so fu falls in exactly the population receiving this drug and this healthy value OVER-states free drug there. A "50 to about 30%" free figure elsewhere is DOG.' },
  { slug: 'midazolam', fu: 0.039, refs: ['PMID:6638545'],
    note: 'THE CLEANEST LARGE CORRECTION IN THE SWEEP, because its occupancy row cites a Kd measured in "58 nmol/l PLASMA WATER" — explicitly the unbound compartment — so the stored ec50 is a bona-fide free-drug affinity and this 26x de-rating is exactly what the field is for. "CRF patients had a significantly higher (P less than 0.005) plasma-free drug fraction (6.5% +/- 0.7) compared with the control patients (3.9% +/- 0.1)" (PMID:6638545), controls being matched healthy volunteers. THE LABEL SENTENCE IS A WRONG-ANALYTE TRAP: parent 97% and 1-hydroxymidazolam 89% in one sentence.' },
  { slug: 'loperamide', fu: 0.05,
    note: 'LABEL-GRADE and doubly hedged, the label itself saying "Based on literature information, the plasma protein binding of loperamide is about 95%". STATED PLAINLY: THIS IS MEANINGLESS FOR THE THERAPEUTIC EFFECT. The target is a myenteric receptor bathed in luminal drug orders of magnitude above plasma, and applying fu to the mu-opioid row would cut its spurious 45% occupancy to about 4% — a better-looking number reached for the wrong reason. It IS the right correction for this drug megadose hERG cardiotoxicity, which is genuinely plasma-driven. Inert today, the record being pk_unauthored.' },
  { slug: 'nilotinib', fu: 0.02,
    note: 'LABEL-GRADE: "Serum protein binding is approximately 98% with a blood-to-serum ratio of 0.68" — SERUM, not plasma. Corroborated and bracketed by a primary inequality, "The plasma protein binding was high (> 97.5%) in preclinical species and humans", whose maximum consistent fu of 0.025 is close but which pools humans with preclinical species in one phrase. Sharp regime: one percentage point spans a factor of two here, so treat 0.02 as order-of-magnitude. A binding CONSTANT against purified HSA by NMR was rejected as isolated-protein.' },

  // ── group 7 ────────────────────────────────────────────────────────
  { slug: 'tolterodine', fu: 0.037, refs: ['PMID:10206324'],
    note: 'The strongest value of its group: two independent framings agreeing to the digit, one saying SERUM and one saying PLASMA, which closes the matrix hazard rather than assuming it away. "the unbound fraction (f(u)) was 3.7%" (PMID:10206324) and the label "Unbound concentrations of tolterodine average 3.7% +/- 0.13% over the concentration range achieved in clinical studies". THE ANALYTE HAZARD RUNS OPPOSITE TO THE USUAL ONE: the active metabolite 5-HMT is TEN TIMES LESS bound at 36%, so this parent value UNDER-states the free active moiety, and the blend shifts with CYP2D6 genotype.' },
  { slug: 'succinylcholine', fu: 0.80, refs: ['PMID:15169739'],
    note: 'Stated as a FREE fraction: "free fraction (from 31% for vecuronium to 80% for succinylcholine)" (PMID:15169739), by ultrafiltration. The direction is internally confirmed — this drug is also the logD extreme in the same sentence at -4.15, consistent for a small bis-quaternary dication. A BINDING FIGURE DOES EXIST, so my doubt about the frame was unwarranted, as it was for atracurium.' },
  { slug: 'rocuronium', fu: 0.70,
    note: 'LABEL-GRADE, verified on two independent SPLs: "Rocuronium is approximately 30% bound to human plasma proteins." Species and matrix both stated explicitly. The intravenous anaesthesia frame is fine — the figure comes from surgical patients, which is the drug actual use. TWO SPECIES TRAPS REJECTED: both papers reporting rocuronium unbound concentrations are in ANAESTHETIZED DOGS. The human ultrafiltration paper this catalog already uses for vecuronium and atracurium does not cover rocuronium. A 1.43x correction.' },
  { slug: 'tiotropium', fu: 0.28,
    note: 'LABEL-GRADE, corroborated verbatim across two device SPLs: "Tiotropium is 72% bound to plasma protein and had a volume of distribution of 32 L/kg after intravenous administration to young healthy volunteers." A renal-impairment study adds that binding does not significantly change, so no renal caveat is needed. FRAME CAVEAT: this record is local-acting and the target is airway M3 reached by direct deposition, not via plasma — the label itself says lung concentrations are unknown but "substantially higher". The correction is arithmetically safe but does not fix that.' },
  { slug: 'thc', fu: 0.03,
    note: 'LABEL-GRADE and weak, sharing dronabinol source and its flaw: "The plasma protein binding of dronabinol AND ITS METABOLITES is approximately 97%" — dronabinol is synthetic delta-9-THC so the analyte is right, but the figure lumps parent with metabolites. MY "97-99%" PRIOR HAS NO SUPPORT AT ITS UPPER END; nothing credible exceeds 97% and one review says 90-95%, so 0.03 may OVER-correct by 2-3x. THREE TRAPS NAMED: the 97% that looks like corroboration is DOGS; a 97% albumin figure is the carboxy-THC GLUCURONIDE; and a tempting 0.05 is fu in a MICROSOMAL INCUBATION including labware binding.' },

  // ── group 8 ────────────────────────────────────────────────────────
  { slug: 'triamcinolone', fu: 0.32, refs: ['PMID:10883419'],
    note: 'MY PRIOR THAT THIS MIGHT JOIN CORTISOL AND PREDNISOLONE IN THE SATURABLE-CBG SKIP CLASS WAS WRONG, AND THE SOURCE PRE-EMPTS IT: "Mean plasma protein binding of triamcinolone acetonide was CONSTANT, PREDICTABLE, and a relatively low 68% over a 24-FOLD RANGE of plasma concentrations" (PMID:10883419) — the authors ran exactly the experiment that disqualified the other two. Six healthy males, [14C] mass balance, acetonide. A PRE-EXISTING MISMATCH LOGGED SEPARATELY: this record mass is the free alcohol while all four of its marketed routes are the acetonide.' },
];

for (const f of FU) {
  const c = need(f.slug);
  if (c.fraction_unbound != null) { log.push(`${f.slug} — already authored, skipped`); continue; }
  if (f.note.length > 600) throw new Error(`${f.slug} fu_note ${f.note.length} > 600`);
  if (!(f.fu > 0 && f.fu <= 1)) throw new Error(`${f.slug} fu ${f.fu} outside (0, 1]`);
  c.fraction_unbound = f.fu;
  c.fu_note = f.note;
  if (f.refs?.length) { c.refs ??= []; for (const r of f.refs) if (!c.refs.includes(r)) c.refs.push(r); }
  log.push(`${f.slug} — fu ${f.fu} (${(1 / f.fu).toFixed(1)}x)`);
}

console.log(` ${FU.length} authored:\n`);
for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
