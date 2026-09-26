/**
 * 2026-09-07-fraction-unbound-a3.ts
 *
 * Batch A3 of backlog §12: `fraction_unbound` for the next 80 compounds.
 * 70 sourced, 10 gaps.
 *
 * ── A FLAW IN THE A2 STORAGE RULE, CAUGHT HERE ─────────────────────────
 * A2 said "an inequality can only under-correct". That holds only for a
 * `>X% bound` statement:
 *   ">99% bound"  -> fu in [0, 0.01)  -> store 0.01 = MAX fu = least correction
 *   "<=40% bound" -> fu in [0.60, 1]  -> store 0.60 = MIN fu = MOST correction
 * The rule is STORE THE MAXIMUM fu CONSISTENT WITH THE INEQUALITY, which
 * coincides with the bound in the first shape and is its opposite in the
 * second. ropinirole, sumatriptan, saxagliptin and varenicline are the
 * inverted shape; each can over-correct, but by at most 1.25-1.67x, and the
 * notes now say so instead of claiming a guarantee that does not hold.
 *
 * ── AND A LIVE BUG A2 SHIPPED, FIXED ALONGSIDE THIS BATCH ──────────────
 * Ten occupancy rows carry a HUMAN WHOLE-BLOOD IC50, which is already measured
 * in a matrix containing albumin and AAG at physiological concentration.
 * Applying fu to one of those double-corrects. diclofenac's COX rows against
 * its fu of 0.003 were being shifted 333-fold in the wrong direction and
 * ketoprofen's 192-fold — worse than the uncorrected error this work exists to
 * fix. A third `basis` value, `whole_blood_ic50`, now opts them out.
 *
 * ── SKIPS ARE STRUCTURAL, NOT LOOKUP FAILURES ──────────────────────────
 * Six of the ten are compounds whose binding saturates inside the therapeutic
 * range, and in four cases the LABEL says so itself: naproxen ("saturation of
 * plasma protein binding at higher doses" inside the approved range),
 * nabumetone (free fraction 0.2-0.3% at 1000 mg rising to 0.6-0.8% at 2000),
 * prednisolone ("95.0% was bound ... falling to 80.5%" across ordinary doses),
 * eplerenone, quinidine (13% -> 36% across the antiarrhythmic range) and
 * ibuprofen, whose label puts the saturation threshold at 20 mcg/mL against a
 * measured Cmax of 59.75 after 800 mg.
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
  { slug: 'telmisartan', fu: 0.005, refs: ['PMID:11185629'],
    note: 'Healthy male volunteers, [14C]telmisartan: "About 99.5% of telmisartan was bound to plasma protein, mainly to albumin and alpha-1-acid glycoprotein" (PMID:11185629). Independently confirmed as ">= 99.5%" in healthy and hepatically-impaired subjects, so 0.005 is the under-correcting bound. This is the sharp regime — a "97%" reading would have been sixfold wrong. Binds AAG as well as albumin, so not purely albumin-stable.' },
  { slug: 'diazepam', fu: 0.0148, refs: ['PMID:6790582'],
    note: 'Stated as a free fraction directly, which is what this regime needs: "The free fraction for diazepam averaged 1.48 per cent (range 0.85 to 2.30 per cent) and increased with age" — equilibrium dialysis in 62 volunteers aged 20-85 (PMID:6790582). A measured mean with an observed spread, not a range midpoint. Corroborated three ways. ANALYTE: the parent. Desmethyldiazepam in the same abstract is 2.97% unbound, TWICE the parent, and must not leak in. fu rises steeply in renal failure (7%) and uraemia.' },
  { slug: 'nicardipine', fu: 0.02, refs: ['PMID:2413297'],
    note: 'Human serum, equilibrium dialysis: "The overall binding of nicardipine in serum varied from 98 to 99.5%" (PMID:2413297) — the higher-fu endpoint is stored. The abstract distinguishes OVERALL binding from the carrier breakdown in the same sentence (lipoproteins, orosomucoid, albumin, erythrocytes), so this is total binding and not an isolated-protein figure. Three-way binding means fu moves with both lipids and acute-phase AAG.' },
  { slug: 'celecoxib', fu: 0.026, refs: ['PMID:10701700'],
    note: 'MY PRIOR OF ">99% BOUND" WAS WRONG AND THE AGENT DECLINED TO SHADE TOWARD IT. Eight healthy volunteers, ex vivo: "The fraction of bound drug in the volunteers was constant (97.4 +/- 0.1%) at total celecoxib plasma concentrations ranging from 0.01 to 4.02 microg/mL" (PMID:10701700) — 97.4%, not 99%, a sevenfold difference in fu, and explicitly concentration-INDEPENDENT across the therapeutic range. THE ANIMAL FIGURES SIT IN THE SAME ABSTRACT (mouse 98.3, rat 98.3, dog 98.5); taking any would have given 0.017 and silently over-corrected.' },
  { slug: 'mirtazapine', fu: 0.15, refs: ['PMID:10885584'],
    note: 'Human: "Mirtazapine binds to plasma proteins (85%) in a nonspecific and reversible way" (PMID:10885584) — already this record own PK source, so no new citation. Review-grade, and the sentence does not name a species, though the paper is entirely human clinical PK. The label independently establishes concentration-independence across 0.01 to 10 mcg/mL, three orders of magnitude above therapeutic levels. Binding is described as NONSPECIFIC, so no single-protein caveat applies.' },
  { slug: 'granisetron', fu: 0.35,
    note: 'LABEL-GRADE: "Plasma protein binding is approximately 65% and granisetron distributes freely between plasma and red blood cells." No PubMed abstract states a figure — every "granisetron binding" hit in the literature is [3H]granisetron as a RADIOLIGAND at the 5-HT3 receptor, a completely different measurement. Applies to all routes on this record, binding being a disposition property.' },
  { slug: 'dabigatran', fu: 0.65,
    note: 'LABEL-GRADE: "Dabigatran is approximately 35% bound to human plasma proteins" — and the label sentence names DABIGATRAN, the circulating active species at mw 471.51, which is what this record stores, not the etexilate prodrug. Unusually low binding for an anticoagulant, which is why the drug is dialysable. No PubMed abstract gives a number; a "55% to 95%" figure in the literature is a class range across five direct oral anticoagulants. Orthogonal to the etexilate dose-basis error already logged here.' },
  { slug: 'pindolol', fu: 0.60,
    note: 'A THREE-WAY CONFLICT, RESOLVED AGAINST THE ONLY ABSTRACT THAT NAMES A NUMBER. That abstract says "Pindolol was 71.4 +/- 8.6% bound to plasma proteins" in seven volunteers (fu 0.286); the label says "only 40% bound" (fu 0.60); and a cardiomyopathy study reports 26-31% bound (fu 0.69-0.74). Two independent lines put binding well under 50%, so the 71.4% looks like the outlier — and the label value also under-corrects. Basic drug, AAG-bound, and that cardiomyopathy study is a direct demonstration of the acute-phase swing.' },

  // ── group 2 ────────────────────────────────────────────────────────
  { slug: 'lorazepam', fu: 0.101, refs: ['PMID:6131586'],
    note: 'Stated as a free fraction directly, 8 healthy volunteers, single IV doses: "mean free fraction 1.5% for diazepam versus 10.1% for lorazepam" (PMID:6131586). Parent lorazepam, no active metabolite. The label disagrees at "approximately 85% bound" (fu 0.15), which would under-correct; the measured free fraction is preferred, and the gap is small.' },
  { slug: 'atenolol', fu: 0.97, refs: ['PMID:6749509'],
    note: 'Near-unbound, as expected for a hydrophilic renally-cleared beta-blocker, and it is a real finding rather than a missing value: "In plasma only 3% of atenolol are protein-bound" (PMID:6749509). The label gives a range, "only a small amount (6% to 16%)", whose under-correcting endpoint is 0.94 — either choice is under a 1.2x correction. TWO TRAPS REJECTED: a 0.93 free fraction that is RAT plasma, and a 4.3-6.0% free figure measured in BOVINE SERUM ALBUMIN, an isolated protein.' },
  { slug: 'morphine', fu: 0.647, refs: ['PMID:8249052'],
    note: 'PARENT morphine, which is what this record models — its mw is the parent, its occupancy row is the parent mu-opioid Ki, and there is no M6G or M3G record in this catalog. Human serum: "the mean (+/- SD) serum protein binding of oxycodone was 45.1% (+/- 0.4%) and that of morphine was 35.3% (+/- 0.2%)" (PMID:8249052). Albumin-bound and explicitly concentration-independent over 5-100 ng/mL. The 45.1% in the same sentence is OXYCODONE.' },
  { slug: 'vardenafil', fu: 0.05,
    note: 'LABEL-GRADE: "Vardenafil and its major circulating metabolite, M1, are highly bound to plasma proteins (about 95% for parent drug and M1). This protein binding is reversible and independent of total drug concentrations." AND THIS ROW CORRECTS AN ERROR IN MY OWN PROMPT: I told the agent this record already carried fu 0.15. It did not — 0.15 is its BIOAVAILABILITY, and the true fu is threefold lower. Parent and M1 bind identically, so the analyte question closes itself. A "72-76%" figure in the literature is a technetium radiocomplex OF vardenafil, not the drug.' },
  { slug: 'tiagabine', fu: 0.04, refs: ['PMID:8827398'],
    note: 'Human: "It is highly (96%) bound to plasma proteins and it is eliminated primarily by cytochrome P450 3A-mediated oxidation, with a half-life of about 7 hours in healthy volunteers" (PMID:8827398) — the CYP3A and 7 h details pin the sentence to tiagabine within a paragraph listing several antiepileptics. Label agrees to the digit and closes the concentration question across 10 to 10,000 ng/mL. Binds albumin AND AAG, and the label confirms it can be displaced by other highly bound drugs.' },
  { slug: 'alprazolam', fu: 0.30, refs: ['PMID:2567646'],
    note: 'Human: "Alprazolam is 70% bound to plasma proteins and the extent of binding is independent of concentration" (PMID:2567646). Parent alprazolam; its hydroxy metabolites run below 10% of parent concentrations. ABSTRACT AND LABEL DISAGREE — the label says 80% bound (fu 0.20). The abstract value is both abstract-grade and the higher fu, so it under-corrects; the disagreement is recorded rather than averaged. Renal disease raises the free fraction.' },
  { slug: 'cimetidine', fu: 0.80, refs: ['PMID:6418428'],
    note: 'Weakly bound, and that is a real finding: "Plasma protein binding is 20%, and there is no relevant effect of changes in binding on the pharmacokinetics of cimetidine" (PMID:6418428). Human clinical PK review across healthy subjects and ulcer patients. No US label states a percentage, so the abstract is the only source and is adequate.' },
  { slug: 'flumazenil', fu: 0.60, refs: ['PMID:3127102'],
    note: 'Human: "The low plasma protein binding of flumazenil (about 40%) will not limit its wide distribution" (PMID:3127102). Parent flumazenil; its metabolites are inactive. Hedged with "about", and the label disagrees at approximately 50% bound (fu 0.50); the abstract value is the higher fu and under-corrects. A rejected paper measures flumazenil DISPLACING other drugs in DOG plasma.' },
  { slug: 'clonazepam', fu: 0.139, refs: ['PMID:3424402'],
    note: 'Stated as unbound directly in 6 healthy volunteers: "The unbound fraction of clonazepam (mean +/- SEM) was 13.9 +/- 0.2% in volunteers" (PMID:3424402), and reproduced to the digit by a second study at "13.9% +/- 0.2% in adult serum". Binds preferentially to albumin. The disease values in the same paper are NOT used — 17.1% cirrhotic, 16.0% poor renal function, 1.56% pre-haemodialysis. A "82% bound" figure elsewhere is DOG.' },
  { slug: 'zolpidem', fu: 0.081, refs: ['PMID:3198298'],
    note: 'Stated as unbound directly, 6 healthy subjects: "The unbound fraction (mean +/- s.e.m.) was 8.1 +/- 0.2% (healthy volunteers)" (PMID:3198298). THE ISOLATED-PROTEIN TRAP SITS IN THE SAME ABSTRACT: it opens with "Similar degree (65-66%) of binding ... with physiological concentrations of isolated human albumin ... or alpha-1-acid glycoprotein", two separate single-protein figures that are NOT total binding — total is 91.9%. Corroborated by the label at 92.5%, concentration-independent 40-790 ng/mL.' },
// ── group 3 ────────────────────────────────────────────────────────
  { slug: 'letrozole', fu: 0.399, refs: ['PMID:9725549'],
    note: 'A DEDICATED binding study, and the cleanest row of the batch: "The binding of letrozole in human serum was 60.1 +/- 2.9% as a mean obtained in six individual sera and was similar in human plasma" (PMID:9725549). Cross-validated by equilibrium dialysis AND ultrafiltration, concentration-independent 10-500 ng/mL, and confirmed ex vivo in dosed patients at 61.4%. TWO TRAPS SIT IN THIS SAME ABSTRACT: an albumin-only 55.1% (isolated protein, not total), and animal sera roughly 10% lower with baboon 20% higher.' },
  { slug: 'ranitidine', fu: 0.85, refs: ['PMID:6329583'],
    note: 'Weakly bound, and confirmed: "Plasma protein binding of ranitidine is approximately 15%" (PMID:6329583), matching the label. TWO NEAR-MISSES REJECTED: a "15 to 22%" figure that is FAMOTIDINE, a different drug whose number is close enough to pass unnoticed; and a 4.6% binding figure measured in ten patients with biopsy-proven hepatic CIRRHOSIS. A 0.889 free fraction elsewhere is RAT isolated perfused kidney perfusate.' },
  { slug: 'labetalol', fu: 0.50, refs: ['PMID:6370541'],
    note: 'Human: "About 50% of the drug is bound in the plasma" (PMID:6370541), corroborated verbatim by the label. Analyte is labetalol as marketed — the mixture of four stereoisomers, which is what this record two receptor rows describe. Independent of the recently re-sourced PK, whose volume and half-life come from separate intravenous work.' },
  { slug: 'ondansetron', fu: 0.30, refs: ['PMID:7586904'],
    note: 'Human: "binds moderately (70 to 76%) to plasma proteins" (PMID:7586904) — a range, stored at its under-correcting endpoint. The same sentence gives a volume of about 160 L and a half-life of 3.8 h, both consistent with this record. Parent ondansetron: the same review states "Metabolites do not play a role in the activity of the drug".' },
  { slug: 'triazolam', fu: 0.15, refs: ['PMID:8830062'],
    note: 'Healthy adult males, ex vivo: "The plasma protein binding of triazolam was approximately 85% when triazolam was given alone" (PMID:8830062). THE HEALTHY-ADULT LITERATURE SPANS ROUGHLY TWOFOLD — 0.099, 0.17-0.18 and 0.185-0.188 across three other volunteer studies — so this is a point value inside a real spread rather than a tight measurement. AAG-bound, not albumin, so it swings with inflammation. A 0.30 free fraction in the literature is RAT; a 6.4-15.4% range is DIALYSIS PATIENTS.' },
  { slug: 'sumatriptan', fu: 0.86,
    note: 'LABEL-GRADE, and a range stored at its under-correcting endpoint: "Protein binding, determined by equilibrium dialysis over the concentration range of 10 to 1,000 ng/mL is low, approximately 14% to 21%", so fu spans 0.79 to 0.86. NOTE THE INEQUALITY IN THE ABSTRACT RUNS THE OTHER WAY: "Less than 20% of the drug is protein bound" bounds fu from BELOW, so storing 0.80 from it would have been the over-correcting end. The label range resolves it. Concentration-independent; the single major metabolite is inactive.' },
  { slug: 'bicalutamide', fu: 0.04,
    note: 'LABEL-GRADE: "Bicalutamide is highly protein-bound (96%)". THE ENANTIOMER QUESTION IS RESOLVED RATHER THAN ASSUMED: the same label section states the S-enantiomer is rapidly cleared and "the R-enantiomer accounting for about 99% of total steady-state plasma concentrations", with a 5.8-day half-life matching this record 144 h. So total bicalutamide is effectively R-bicalutamide at steady state and the figure describes the same species this PK block does. No abstract states a number; an SPR study of ANALOGUES against isolated HSA and RSA was rejected.' },
  { slug: 'carvedilol', fu: 0.02,
    note: 'LABEL-GRADE, an inequality stored at its bound: "Carvedilol is more than 98% bound to plasma proteins, primarily with albumin. The plasma-protein binding is independent of concentration over the therapeutic range." THE MOST DANGEROUS REJECTED SOURCE OF THE BATCH: a paper reporting ">98% for total plasma" in RATS — right magnitude, right phrasing, wrong species, and it would have silently confirmed the expectation. Two isolated-protein studies against HSA and AAG separately were also rejected. Parent racemate; the active metabolites are not covered.' },
  { slug: 'chlorpheniramine', fu: 0.30,
    note: 'LABEL-GRADE and hedged: "is about 70% bound to plasma proteins", with the label saying "reportedly", so it is quoting secondary literature. The usual primary has NO PubMed abstract at all, so nothing can be quoted verbatim from it. Analyte is the racemate, matching this record Ki. Rat data show the binding is STEREOSELECTIVE, so a racemic figure averages two different enantiomer values. Rejected: a 44% figure in RABBITS, a rat stereoselectivity study, and an isolated HSA/AGP capillary-electrophoresis study.' },
  { slug: 'ibuprofen', fu: 0.01, refs: ['PMID:8229677'],
    note: 'A LOW-CONCENTRATION FLOOR, NOT A THERAPEUTIC-DOSE VALUE, and the saturation threshold is now quotable against this drug own Cmax. The label says binding "is saturable, and at concentrations >20 mcg/mL binding is nonlinear" — and that same label PK table gives an adult Cmax of 59.75 mcg/mL after 800 mg, roughly THREE TIMES the threshold. The stored figure is "greater than 99%" at therapeutic concentrations (PMID:8229677). Because true fu at dose is higher, this floor sits BELOW the truth and OVER-corrects. Enantiomers differ ~1.5x and activity resides in S.' },

  // ── group 4 ────────────────────────────────────────────────────────
  { slug: 'tianeptine', fu: 0.062, refs: ['PMID:3180120'],
    note: 'MY PRIOR THAT THIS DRUG IS WEAKLY BOUND WAS WRONG — it is 94-95% bound. Healthy volunteers in vivo: "protein binding, which averages 93.8 +/- 2.4%" (PMID:3180120); a second human study gives 95% by equilibrium dialysis with fu 0.045 and states "No saturation of the binding sites was seen" over therapeutic concentrations. The higher, in-vivo figure is stored. Albumin-dominant, and a 94% albumin figure in that second paper is an ISOLATED-PROTEIN value, not total. Renal failure raises fu to 0.153, cirrhosis to 0.088.' },
  { slug: 'palonosetron', fu: 0.38, refs: ['PMID:15139789'],
    note: 'Human, intravenous — matching this record IV-only PK row: "moderate (62%) plasma protein binding" (PMID:15139789). Review-grade (an Adis drug profile) rather than a primary measurement, though it is a point value and matches the label. No primary abstract states it.' },
  { slug: 'baclofen', fu: 0.65, refs: ['PMID:2336342'],
    note: 'Human, racemic baclofen at oral steady state: "The total body clearance averaged 175 ml.min-1 (+/- 44), plasma protein binding 35% (+/- 6)" (PMID:2336342). POPULATION IS SIX SPASTIC PATIENTS, not healthy volunteers, though the paper states the results agree with earlier single-dose work in healthy subjects. Consistent with renal clearance — the same abstract reports 65% excreted unchanged with renal clearance equal to creatinine clearance. Weakly bound, so the correction barely moves occupancy.' },
  { slug: 'baricitinib', fu: 0.50,
    note: 'LABEL-GRADE, and A NEW TRAP SHAPE: the label sentence reads "Baricitinib is approximately 50% bound to plasma proteins and 45% bound to serum proteins" — TWO TOTAL-BINDING FIGURES IN ONE SENTENCE, in different matrices. The Hill comparison needs the PLASMA one; taking serum would have given 0.55. Distinct from the isolated-protein trap, since both are total binding. Parent baricitinib, not appreciably metabolised. A fluorescence-quenching study against isolated AAG was rejected.' },
  { slug: 'nimodipine', fu: 0.05,
    note: 'LABEL-GRADE, an inequality stored at its bound: "Nimodipine is over 95% bound to plasma proteins". AAG-BOUND, AND THE POPULATION THAT RECEIVES THIS DRUG RUNS HIGH AAG — a subarachnoid-haemorrhage study found unbound nimodipine threefold higher during low-AAG periods, so real-world fu in an SAH patient is likely below this stored bound, which the bound already accommodates. A "97%" figure in the literature is RAT AND DOG; another is MONKEY.' },
  { slug: 'venlafaxine', fu: 0.73,
    note: 'LABEL-GRADE, PARENT venlafaxine — which is what this record models: "The degree of binding of venlafaxine to human plasma is 27% +/- 2% at concentrations ranging from 2.5 to 2215 ng/mL." Flat across a roughly 900-fold span, so no concentration dependence. The O-desmethyl metabolite figure of 30% sits in the very next sentence and is a separate marketed drug; here the two happen to be close, so the analyte confusion would have been benign — unlike the sevenfold losartan case.' },
  { slug: 'vortioxetine', fu: 0.02,
    note: 'LABEL-GRADE and unusually well-behaved for the sharp regime: "The plasma protein binding of vortioxetine in humans is 98%, independent of plasma concentrations." A point value rather than an inequality, explicitly human, and explicitly concentration-independent, so the how-many-nines hazard does not bite. The label adds that binding is unchanged across hepatic and renal impairment including end-stage disease.' },

  // ── group 5 ────────────────────────────────────────────────────────
  { slug: 'caffeine', fu: 0.65, refs: ['PMID:7153897'],
    note: 'Human, young and elderly males by ultrafiltration: "In spite of a significantly lower plasma albumin concentration in the elderly subjects the observed percent bound (approximately 35%) was essentially identical in both subject groups" (PMID:7153897). Albumin-bound, and the same paper states the free fraction remained constant across the concentrations examined — a positive concentration-independence finding.' },
  { slug: 'cilostazol', fu: 0.048, refs: ['PMID:10702884'],
    note: 'HEALTHY-VOLUNTEER ARM taken deliberately over the patient arm in the same sentence: "Protein binding did not differ between the groups (95.2% healthy volunteers, 94.6% hepatically impaired patients)" (PMID:10702884). Parent cilostazol; its two metabolites are tracked separately in that paper. The label range of 95-98% brackets this point value. Severe renal impairment alters the parent binding, per the label.' },
  { slug: 'meloxicam', fu: 0.005, refs: ['PMID:9105543'],
    note: 'An inequality stored at its bound, from 78 healthy male volunteers across oral, intravenous and rectal routes: "is bound to plasma proteins by more than 99.5%" (PMID:9105543), corroborated verbatim by a second study. Acidic oxicam, albumin-bound; its four metabolites are biologically inactive so there is no analyte risk. The label gives a point 99.4%, i.e. 0.006 — a mild contradiction, and the label value would under-correct slightly more. Binding falls to about 99% in renal disease, doubling fu.' },
  { slug: 'oxycodone', fu: 0.549, refs: ['PMID:8249052'],
    note: 'Human serum at physiological pH and temperature: "the mean (+/- SD) serum protein binding of oxycodone was 45.1% (+/- 0.4%)" (PMID:8249052), matching the label exactly. Explicitly concentration-independent over 5-100 ng/mL. Despite oxycodone being basic the paper finds ALBUMIN the major binding protein. The 35.3% in the same sentence is MORPHINE, not a metabolite.' },
  { slug: 'zopiclone', fu: 0.207, refs: ['PMID:9951403'],
    note: 'A THREE-WAY CONFLICT IN WHICH THE MOST-QUOTED NUMBER IS THE ONE TO REJECT. The widely-cited "about 45%" comes from a MULTI-SPECIES paper covering rats, rabbits, dogs and humans whose binding sentence NAMES NO SPECIES. The stored value is the only source that is simultaneously human, racemic and total-binding: "The total plasma protein binding percentages were 79.3 +/- 5.5%, 83.8 +/- 5.2%, and 75.1 +/- 2.1%, for racemic zopiclone, (-)zopiclone and (+)zopiclone" (PMID:9951403). The eszopiclone label 52-59% is the wrong analyte and disagrees with that paper on the same enantiomer.' },
  { slug: 'amiodarone', fu: 0.037, refs: ['PMID:6370540'],
    note: 'MY PRIOR OF ">99% BOUND" WAS WRONG BY FOURFOLD, IN THE DANGEROUS DIRECTION. Two independent sources give about 96%: "In vitro protein binding of amiodarone has been reported to be 96.3 +/- 0.6%" (PMID:6370540) and a label saying "approximately 96%". Storing my prior would have over-corrected fourfold on what is already the most fragile PK record in this catalog. At 96% the sharp regime does not even apply. AN ISOLATED-PROTEIN TRAP REJECTED: "chiefly bound to albumin (62.1%) and ... (33.5%) ... beta-lipoprotein" are CARRIER SHARES of bound drug, not total binding.' },
  { slug: 'roflumilast', fu: 0.01,
    note: 'LABEL-GRADE, PARENT roflumilast: "Plasma protein binding of roflumilast and its N-oxide metabolite is approximately 99% and 97%, respectively." THIS VALUE IS ANALYTE-COUPLED AND MUST TRAVEL WITH ANY REPOINTING OF THE RECORD. It is correct only while this record models the parent, which it does. But this record own note states the N-oxide "accounts for >90% of roflumilast total PDE4 inhibitory activity" at roughly twelvefold higher exposure — and if the PK is ever repointed there, fu must become 0.03 or it becomes a threefold over-correction. The first case where fu and pk_analyte are coupled.' },
  { slug: 'desloratadine', fu: 0.18,
    note: 'LABEL-GRADE, a range stored at its under-correcting endpoint: "Desloratadine and 3-hydroxydesloratadine are approximately 82% to 87% and 85% to 89% bound to plasma proteins, respectively" — the first range is this compound, the second belongs to its downstream metabolite and must not be crossed. Desloratadine is itself loratadine active metabolite and this record models it directly. The label adds that binding is unaltered in renal impairment.' },
  { slug: 'apremilast', fu: 0.32,
    note: 'LABEL-GRADE: "Human plasma protein binding of apremilast is approximately 68%." Explicitly human, a point value, no concentration dependence noted. Wrong-analyte risk is low — the human mass-balance study states the major metabolites are at least fiftyfold less pharmacologically active. An enantioselective study against isolated HSA with molecular docking was rejected as an isolated-protein source.' },
// ── group 6 ────────────────────────────────────────────────────────
  { slug: 'nadolol', fu: 0.86, refs: ['PMID:6146679'],
    note: 'Human, 95 healthy subjects: "Binding was found to range between 4 and 27%, with a mean of 14 +/- 4% (s.d.)" (PMID:6146679). THE LABEL DISAGREES at "approximately 30 percent ... reversibly bound", i.e. fu 0.70 — the direct measurement in a large healthy cohort is preferred, and it also under-corrects. Mildly AAG-correlated, immaterial at this fu.' },
  { slug: 'yohimbine', fu: 0.18, refs: ['PMID:8097957'],
    note: 'Parent yohimbine, which is what this record models: "the bound fraction being 82%, 43% and 32% respectively for yohimbine, 11-OH-yohimbine and 10-OH-yohimbine" (PMID:8097957) — the two metabolite figures sit in the same sentence and must not be taken. WEAKEST SPECIES ATTRIBUTION OF THE BATCH: the abstract says "plasma proteins" without naming a species, though every other assay in that paper is human. No n, no SD, and no US label exists to cross-check — this is an unapproved drug. Rejected: values in steers, horses, dogs, ponies and rat.' },
  { slug: 'estradiol', fu: 0.016, refs: ['PMID:4039300'],
    note: 'Free fraction stated directly, so no flip risk: "No difference in the free fraction of oestradiol was found between women with breast cancer (1.8 +/- 0.4%, mean +/- SD) and normal women (1.6 +/- 0.3%)" (PMID:4039300) — the normal comparator is stored. THE NEXT SENTENCE IS AN ISOLATED-PROTEIN SPLIT, not total binding: 40% albumin and 60% SHBG OF THE BOUND FRACTION. Population is postmenopausal women, n=8. SHBG rises severalfold with oral oestrogen, pregnancy and hyperthyroidism, cutting fu — non-pregnant adults only.' },
  { slug: 'oxybutynin', fu: 0.01, refs: ['PMID:11939551'],
    note: 'An inequality stored at its bound: "The bound drug fraction in human plasma containing 2-10 microM (R)- or (S)-OXY was higher than 99%" (PMID:11939551), AAG-dominant and enantioselective. The assay ran roughly a hundredfold above therapeutic concentrations and binding saturates upward, so real therapeutic fu is lower than this bound — which under-corrects, correctly. THE METABOLITE TRAP IS INVERTED HERE AND THEREFORE HARMLESS: N-desethyloxybutynin is LESS bound (1.19-2.33% unbound), so a mix-up would under-correct. No label figure exists on any of five SPLs.' },
  { slug: 'prucalopride', fu: 0.70,
    note: 'LABEL-GRADE: "The plasma protein binding of prucalopride is approximately 30%." No PubMed abstract states a figure — which mirrors this record PK row, already label-sourced for the same reason after a systematic chase found no primary for any of its values.' },
  { slug: 'amlodipine', fu: 0.07,
    note: 'LABEL-GRADE, an ex-vivo measurement: "Ex vivo studies have shown that approximately 93% of the circulating drug is bound to plasma proteins in hypertensive patients." A PubMed review states 98% instead, giving 0.02 — a 3.5x stronger correction — but it is an unreferenced round number in a review abstract, while the label describes an actual measurement and also under-corrects. Population is hypertensive patients, which does not itself shift binding proteins. Notably that same review 21 L/kg is the figure this record V of 1470 L already encodes.' },
  { slug: 'ropinirole', fu: 0.60,
    note: 'LABEL-GRADE, AND THE INEQUALITY RUNS THE OPPOSITE WAY TO THE USUAL ONE: "It is up to 40% bound to plasma proteins and has a blood-to-plasma ratio of 1:1." A ceiling on BINDING is a floor on fu, so 0.60 is the MOST-correcting end and can over-correct by at most 1.67x — the one-sided guarantee that holds for a ">99% bound" statement does not hold here. Small and capped, and the strictly safe end (1.0) would be no correction at all. This record own PK source says only "low plasma protein binding", qualitatively. Metabolites are stated inactive.' },

  // ── group 7 ────────────────────────────────────────────────────────
  { slug: 'lemborexant', fu: 0.065, refs: ['PMID:33822479'],
    note: 'Free fraction stated directly, and THREE independent readings land together: "Lemborexant unbound fraction was similar in all groups (range: 0.060-0.065)" (PMID:33822479), "the mean unbound fraction of lemborexant was ~7%" in a renal study healthy comparator, and a label giving 94% in clinical samples. Healthy controls matched for age, sex and BMI; parent lemborexant, with its M4/M9/M10 metabolites measured separately. The under-correcting endpoint of the stated range is stored.' },
  { slug: 'piroxicam', fu: 0.011, refs: ['PMID:3965234'],
    note: 'Human, 12 young and 13 elderly healthy subjects, equilibrium dialysis: "Plasma protein binding of piroxicam ranged from 98.90% to 99.54% bound and was not affected by age or sex" (PMID:3965234) — stored at the under-correcting endpoint, which matters here since the two ends differ 2.4-fold in fu. AND UNLIKE THE OTHER NSAIDs IN THIS SWEEP IT IS NOT SATURABLE IN RANGE: a second study found binding "plasma-concentration dependent with oxaprozin ... but not with piroxicam (range, 1-30 mg/L)", a span containing this record exposure. Acidic, albumin-bound.' },
  { slug: 'bisoprolol', fu: 0.70, refs: ['PMID:2439789'],
    note: 'Human: "Because of the low plasma protein-binding (30%), kinetics are insensitive to protein-binding interactions" (PMID:2439789). SPECIES IS HUMAN BY INFERENCE RATHER THAN BY AN EXPLICIT WORD — the abstract is a human clinical-PK review whose other parameters (90% bioavailability, 10-11 h half-life) match this record. The US label carries no protein-binding sentence at all. Contrast with nebivolol at fu 0.02 in the same batch: a 35-fold difference, and neither is the complement of the other.' },
  { slug: 'atracurium', fu: 0.52, refs: ['PMID:7486041'],
    note: 'MY SUGGESTION THAT A BINDING FIGURE MIGHT NOT EXIST FOR THIS DRUG WAS WRONG. Human plasma ultrafiltration, healthy young volunteers: "52% +/- 6% for atracurium", stated as a FREE fraction (PMID:7486041), with a second cohort in the same abstract at 50%. Binds LIPOPROTEINS, and free fraction fell to 40% in hyperlipidaemic patients — the same non-albumin fragility as dronabinol but at a far gentler point on the 1/fu curve. An older source lumps all neuromuscular blockers at 77-91% bound with no atracurium-specific number and does not reconcile.' },
  { slug: 'solifenacin', fu: 0.02, refs: ['PMID:15906588'],
    note: 'In-vivo unbound fraction in 47 healthy adults: "Solifenacin was highly bound to plasma proteins (fraction of the drug unbound in plasma was approximately 0.02), but there was no clear effect of gender or age" (PMID:15906588), matching the label 98%. TWO OF MY STORAGE HEURISTICS COLLIDE HERE AND THE PRIMARY WINS: a review gives 93-96%, whose under-correcting endpoint would be 0.07, but a direct in-vivo measurement in 47 subjects beats a review range. AAG-bound, so inflammation-sensitive.' },
  { slug: 'dronabinol', fu: 0.03,
    note: 'LABEL-GRADE AND THE WEAKEST VALUE OF THE BATCH, for structural reasons: "The plasma protein binding of dronabinol and its metabolites is approximately 97%" — which LUMPS PARENT AND METABOLITES into one figure, and the binding is majority-LIPOPROTEIN rather than albumin, so it moves with fasting state and lipid status. A 97% figure in the literature is in DOGS and coincides exactly with the label number, which must not be read as confirmation. The one paper titled for human binding has no PubMed abstract.' },
  { slug: 'nebivolol', fu: 0.02,
    note: 'LABEL-GRADE, and an unusually complete label sentence: "The in vitro human plasma protein binding of nebivolol is approximately 98%, mostly to albumin, and is independent of nebivolol concentrations" — explicitly human, explicitly the parent rather than the hydroxy metabolite, explicitly concentration-independent. No abstract states it; a nebivolol ultrafiltration study is in the RAT and stereoselective.' },
  { slug: 'modafinil', fu: 0.40,
    note: 'LABEL-GRADE: "In human plasma, in vitro, modafinil is moderately bound to plasma protein (approximately 60%), mainly to albumin." Racemic modafinil, which is this record; armodafinil is a separate slug. Nothing in PubMed states a figure, including this record own PK source.' },
  { slug: 'methylphenidate', fu: 0.90,
    note: 'LABEL-GRADE, a range stored at its under-correcting endpoint: "Plasma protein binding is 10% to 33%", giving fu 0.90 to 0.67. MY PRIOR OF ~15% BOUND IS NOT A NUMBER ANY SOURCE STATES — it sits inside the label band but the label commits only to the band. The obvious primary is a 1974 paper with no PubMed abstract, and it would need species disambiguation anyway since its title covers "man and animals". Direction checked: this is the low-binding compound of its group, so a high fu is correct.' },

  // ── group 8 ────────────────────────────────────────────────────────
  { slug: 'tapentadol', fu: 0.80,
    note: 'LABEL-GRADE: "Plasma protein binding of tapentadol is low (approximately 20%)." No PubMed abstract states a number — three reviews say only "limited protein binding" qualitatively. Parent tapentadol; its O-glucuronide is inactive, so no analyte question.' },
  { slug: 'acetaminophen', fu: 0.80, refs: ['PMID:6491906'],
    note: 'Eight healthy adults: "The serum protein binding of acetaminophen (congruent to 20%) and acetaminophen glucuronide (less than 10%) are minor. Acetaminophen sulfate is greater than 50% protein bound" (PMID:6491906) — the conjugate figures sit in the same sentence and only the 20% is parent. CONCENTRATION DEPENDENCE EXISTS BUT IS AN OVERDOSE PHENOMENON, NOT A THERAPEUTIC-RANGE ONE, so this is not a skip: the label puts therapeutic binding at 10-25% and says only 20-50% may be bound in acute intoxication — it RISES in overdose. Its COX row is a whole-blood IC50 and opts out.' },
  { slug: 'hydrocodone', fu: 0.64,
    note: 'LABEL-GRADE, in vivo, and from the SINGLE-ENTITY product because the combination labels carry only acetaminophen figure: "The extent of in vivo binding of hydrocodone to human plasma proteins was minimal with a mean % bound at 36%." Parent hydrocodone, consistent with the batch-6 finding that the parent is the right analyte. TWO TRAPS IN A SIBLING LABEL AVOIDED: one infers hydrocodone binding from CONGENERS ("structural similarities to related opioid analgesics suggest") rather than measuring it, and another "about 70% bound" two sentences away is CHLORPHENIRAMINE.' },
  { slug: 'finasteride', fu: 0.10, refs: ['PMID:7679063'],
    note: 'Human: "Finasteride is approximately 90% bound to plasma proteins" (PMID:7679063), corroborated exactly by the label, which adds that binding was unchanged in renal impairment down to a creatinine clearance of 9 mL/min. Review-grade rather than a primary binding experiment, but the sponsor label agrees to the digit.' },
  { slug: 'pramipexole', fu: 0.85,
    note: 'LABEL-GRADE: "It is about 15% bound to plasma proteins." Parent pramipexole, which is essentially not metabolised — about 90% is renally excreted unchanged, a premise this record own PK audit already verified. No PubMed abstract states a figure across a hundred-abstract scan.' },
  { slug: 'etoricoxib', fu: 0.08,
    note: 'LABEL-GRADE, AND THERE IS NO FDA LABEL AT ALL — this drug is not FDA-approved, so the source is the EU summary of product characteristics: "Etoricoxib is approximately 92 % bound to human plasma protein over the range of concentrations of 0.05 to 5 microg/mL." That range brackets the clinical Cmax of about 3.6 microg/mL at 120 mg, so it is not concentration-dependent in range. NOTE THIS RECORD COX ROWS ARE WHOLE-BLOOD IC50s and are marked to opt OUT of the fu correction; applying it there would have shifted them twelvefold the wrong way.' },
  { slug: 'topiramate', fu: 0.85, refs: ['PMID:19764603'],
    note: 'Human: "Serum protein binding is approximately 15%, and biologic half-life in healthy volunteers is considered to range from 20 to 30 hours" (PMID:19764603). Two corroborating sources give HIGHER fu — "negligibly (9-17%) bound" and "topiramate (10%) being minimally bound" — so 0.85 is the conservative pick. THE LABEL RANGE IS MISLEADING HERE: its "15% to 41% bound" spans up to 250 mcg/mL, roughly tenfold above therapeutic, and every therapeutic-range source lands at 9-17%. Its saturable ERYTHROCYTE binding is a blood:plasma effect, not plasma protein binding.' },
  { slug: 'vecuronium', fu: 0.25, refs: ['PMID:7486041'],
    note: 'Free fraction stated directly, human plasma ultrafiltration: "NMBA free fraction was 25% +/- 5% for vecuronium" (PMID:7486041). Population is surgical patients, which is this drug actual use frame, and the paper concludes age and weight do not alter it in otherwise healthy patients. Triangulated: a second ultrafiltration study gives 31%, and the label a 60-80% bound range whose under-correcting endpoint is 0.40. No source names which protein binds it, so no albumin or AAG claim is made.' },
  { slug: 'haloperidol', fu: 0.085, refs: ['PMID:7862945'],
    note: 'Free fraction stated directly, and the metabolite trap runs the SAFE way here: "the unbound fraction of HP (0.085 +/- 0.016) and RHP (0.244 +/- 0.026) in plasma ... were independent of their concentration" (PMID:7862945) — reduced haloperidol is roughly 2.9x LESS bound, so a mix-up would under-correct. POPULATION IS 25 PATIENTS ON CHRONIC HALOPERIDOL, not healthy volunteers; no healthy-volunteer figure with a number could be found. AAG-bound, and two studies disagree on the DIRECTION of the age effect, which is itself a reason to treat any single value as approximate.' },
  { slug: 'lamotrigine', fu: 0.45, refs: ['PMID:9429124'],
    note: 'Human: "The volume of distribution is between 1.25 and 1.47 L/kg and protein binding is about 55%" (PMID:9429124), corroborated by two further abstracts at 56% and 55% and by a label stating 55% across 1 to 10 mcg/mL — explicitly flat across and above the therapeutic range. Parent lamotrigine; elimination is by glucuronidation to an inactive N2-glucuronide. A rejected ultrafiltration study measuring both paracetamol and lamotrigine is in PREGNANT AND DEVELOPING RAT plasma.' },
];

for (const f of FU) {
  const c = need(f.slug);
  if (c.fraction_unbound != null) { log.push(`${f.slug} — already authored, skipped`); continue; }
  if (f.note.length > 600) throw new Error(`${f.slug} fu_note ${f.note.length} > 600`);
  if (!(f.fu > 0 && f.fu <= 1)) throw new Error(`${f.slug} fu ${f.fu} outside (0, 1]`);
  c.fraction_unbound = f.fu;
  c.fu_note = f.note;
  if (f.refs?.length) { c.refs ??= []; for (const r of f.refs) if (!c.refs.includes(r)) c.refs.push(r); }
  log.push(`${f.slug} — fu ${f.fu} (${(1 / f.fu).toFixed(1)}x correction)`);
}

console.log(` ${FU.length} authored:\n`);
for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
