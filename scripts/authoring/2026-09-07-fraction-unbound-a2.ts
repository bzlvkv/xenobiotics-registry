/**
 * 2026-09-07-fraction-unbound-a2.ts
 *
 * Batch A2 of backlog §12: authors `fraction_unbound` for the 80 compounds whose
 * occupancy rows the model currently overstates most. Eight agents, ten each.
 *
 * 64 of 80 sourced, 16 genuine gaps.
 *
 * ── THE STORAGE RULE THIS BATCH ESTABLISHED ────────────────────────────
 * About a third of what came back is an INEQUALITY (">99% bound") or a RANGE
 * rather than a point value, and the agents were right to refuse to invent
 * digits. But the correction matters MOST exactly where the sourcing is
 * weakest — the >99%-bound drugs, where a 100x correction rides on a ">".
 * Leaving those null keeps the full uncorrected error. So:
 *
 *   1. point value from an abstract        -> store it
 *   2. point value from a label only       -> store it, note flags the grade
 *   3. inequality (">99% bound")           -> store the implied bound. That is
 *      an UPPER bound on fu, hence a LOWER bound on the correction: it can only
 *      UNDER-correct, never over-correct.
 *   4. range with no single measurement    -> store the endpoint that
 *      under-corrects (the HIGHER fu), both endpoints in the note
 *   5. concentration-dependent within the therapeutic range, or otherwise
 *      indefensible                        -> SKIP, log the gap
 *
 * The error direction is then one-sided everywhere: every stored fu either
 * under-corrects or is right, and none over-corrects. That matters because the
 * pre-correction state overstates occupancy — moving partway toward truth is
 * strictly better and introduces no new error class.
 *
 * ── WHAT THE SKIPS ARE, WHICH IS NOT "NOT FOUND" ───────────────────────
 * Four are compounds whose binding SATURATES inside the therapeutic range, so a
 * scalar is indefensible rather than merely unsourced: linagliptin (99% at
 * 1 nmol/L falling to 75-89% above 30, with a steady-state Cmax of 11-12 that
 * sits inside the transition), mifepristone, cortisol (fu 0.053 at 22:00 and
 * 0.085 at 08:00 from one paper's own numbers, before any stress response) and
 * montelukast, whose methods literature states outright that "only a range of
 * fu can be reported with confidence".
 *
 * Two more are the engineered peptides, and they raise a limit on the whole
 * correction: semaglutide and tirzepatide carry fatty-acid chains whose albumin
 * binding IS the half-life mechanism, and potency assays for acylated GLP-1
 * analogues are routinely run WITH albumin present. If a stored EC50 came from
 * such an assay it is already albumin-shifted, and dividing by fu would
 * double-count the same binding. `basis: 'in_vitro_ki'` silently assumes a
 * protein-free assay; for these two that assumption is unverified.
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

/** fu, the note that must travel with it, and any PMID to add to refs[]. */
const FU: { slug: string; fu: number; note: string; refs?: string[] }[] = [
  // ── group 1 ────────────────────────────────────────────────────────
  { slug: 'apixaban', fu: 0.13, refs: ['PMID:35680619'],
    note: 'Human, stated as a FREE FRACTION directly rather than as a bound percentage, so no complement conversion was needed: "plasma protein binding (free fraction) averages 0.08 nM and 0.13 in humans and 0.16 nM and 0.37 in rabbits, respectively" (PMID:35680619). The rabbit value of 0.37 sits in the same sentence and is not this one. Independently cross-checked against the label figure of 87% bound, which gives the same 0.13.' },
  { slug: 'clozapine', fu: 0.0165, refs: ['PMID:31111332'],
    note: 'Human, MEASURED rather than label-derived: "1.22% vs. 1.65%" unbound in elevated- versus normal-AAG samples (PMID:31111332). The normal-AAG figure is stored. Population is patients on clozapine, not healthy volunteers. AAG-BOUND AND THEREFORE INFLAMMATION-SENSITIVE — fu swings about 26% between normal and inflamed states. Note this measured value is LOWER than the commonly quoted 97% bound, which would give 0.03.' },
  { slug: 'ziprasidone', fu: 0.01, refs: ['PMID:11978164'],
    note: 'AN INEQUALITY STORED AS ITS BOUND, not a measurement: "protein binding is extensive at >99%" (PMID:11978164). No abstract states a point value. Since the true fu is at most 0.01, this can only UNDER-correct the occupancy overstatement, never over-correct it.' },
  { slug: 'daridorexant', fu: 0.01, refs: ['PMID:34002356'],
    note: 'AN INEQUALITY STORED AS ITS BOUND: "the high plasma protein binding (> 99%)" (PMID:34002356). Under-corrects by construction. The same source states that cirrhosis raises the unbound fraction 1.9- to 2.3-fold, so this healthy-subject value does not describe hepatic impairment.' },
  { slug: 'febuxostat', fu: 0.008,
    note: 'LABEL-GRADE: the US prescribing information gives 99.2% bound, mainly to albumin, and no PubMed abstract states a percentage — the one paper titled for plasma protein binding reports only that ibuprofen and warfarin do not displace it. Acidic and albumin-bound, so expect hypoalbuminaemia and renal failure to raise fu.' },

  // ── group 2 ────────────────────────────────────────────────────────
  { slug: 'acetazolamide', fu: 0.041, refs: ['PMID:3986087', 'PMID:23683608'],
    note: 'Human, young healthy adults, stated as unbound: "6.9 vs 4.1%" in elderly versus younger subjects (PMID:3986087). THE MATRIX HAZARD IS HANDLED, NOT IGNORED — that study measured plasma, plasma ULTRAFILTRATE and erythrocytes as separate compartments, so this is unambiguously plasma binding and not red-cell partitioning. CONCENTRATION-DEPENDENT: a second source states "protein binding of ACTZ was concentration dependent" — and since fu rises with concentration, this low-concentration value sits BELOW the truth at dose and OVER-corrects.' },
  { slug: 'nifedipine', fu: 0.040, refs: ['PMID:3987180'],
    note: 'Human, normal renal function: "96.0% +/- 0.5% in controls" (PMID:3987180), converted 1 - 0.960. Converges across three independent human studies at 0.040 to 0.046. Renal failure raises it to 0.065-0.112. A false lead recorded so it is not re-chased: a saturable-AAG paper that surfaces on a nifedipine search is a BEPRIDIL study in which nifedipine appears only as a displacer.' },
  { slug: 'valsartan', fu: 0.04, refs: ['PMID:9089423'],
    note: 'The best-characterised row of this batch. Human serum: "The binding of valsartan was high (96 +/- 2%) ... at concentrations ranging from 0.05 micrograms/mL to 5 micrograms/mL" (PMID:9089423) — a mean and SD, not a range, and CONCENTRATION-INDEPENDENT across the therapeutic span. Albumin-bound (92%) with low AAG binding (22%), so not inflammation-sensitive, and not displaced by hydrochlorothiazide, diclofenac, furosemide or warfarin. The same abstract states the figure is human-specific and differs in mouse.' },
  { slug: 'buprenorphine', fu: 0.04, refs: ['PMID:15966752'],
    note: 'Parent buprenorphine, human: "highly protein bound (96%)" (PMID:15966752). REVIEW-GRADE — the primary reports a RANGE, 95-98%, and says why: ultrafiltration and equilibrium dialysis were both "inappropriate because of the high membrane binding of neutral buprenorphine", so one of the two usable methods was red-cell partition. The frequently-repeated claim that it binds mainly alpha- and beta-globulin is a monograph statement; a targeted search returns no abstract sentence supporting it. No norbuprenorphine binding figure exists in any abstract.' },
  { slug: 'bosentan', fu: 0.02, refs: ['PMID:15788364'],
    note: 'Stated as a free fraction directly: "the low clearance, highly protein bound bosentan (CL(H) = 3.9 ml min(-1) kg(-1); free fraction = 0.02)" (PMID:15788364). SPECIES IS IMPLIED RATHER THAN STATED — the study uses human hepatocytes and human serum throughout and the companion clearances are human-scale, but the sentence does not say "human plasma". It also appears in a methods sentence rather than as the paper own result. No abstract gives an explicit bosentan binding percentage.' },
  { slug: 'rivaroxaban', fu: 0.08, refs: ['PMID:32279215'],
    note: 'A RANGE STORED AT ITS UNDER-CORRECTING ENDPOINT: "Rivaroxaban is 92-95% protein bound" (PMID:32279215), giving fu 0.08 to 0.05; the higher value is stored so the correction cannot be overstated. Both endpoints are review-intro statements with no method or species. The sponsor preclinical paper says only that binding "was high, species dependent and fully reversible" — no number, and rats and dogs only.' },
  { slug: 'erlotinib', fu: 0.07,
    note: 'LABEL-GRADE (93% bound). The nearest abstract gives "about 95%" for gefitinib, erlotinib and lapatinib COLLECTIVELY — one hedged number spread across three chemically distinct drugs, which is not an erlotinib value. CAVEAT THAT MATTERS CLINICALLY: erlotinib binds AAG substantially and two independent population analyses find AAG a significant covariate on its clearance. AAG is an acute-phase reactant, routinely elevated in oncology patients, so real-world fu is likely BELOW this figure.' },

  // ── group 3 ────────────────────────────────────────────────────────
  { slug: 'prazosin', fu: 0.065, refs: ['PMID:8739810'],
    note: 'The cleanest row of its group. Human, 20 healthy volunteers: "Protein binding was 93.4% in the elderly and 93.5% in the young subjects and the serum alpha 1 acid glycoprotein concentration was not different in the two groups" (PMID:8739810). Young value stored, 1 - 0.935. Partly AAG-mediated but the same study found no age difference in either binding or AAG concentration.' },
  { slug: 'propranolol', fu: 0.159, refs: ['PMID:2719906'],
    note: 'RACEMATE, which is what this record models, in young healthy males: "The fu values were 0.159 +/- 0.049 ... (+/-)" (PMID:2719906), stated as a free fraction. ENANTIOMER-SELECTIVE AND THE ACTIVE ISOMER IS THE MORE BOUND ONE — (-) 0.135 versus (+) 0.174. THE VERIFIED HUMAN SPREAD IS 0.09 TO 0.19 AND IS METHOD-DRIVEN, NOT NOISE: equilibrium dialysis gives 0.159, pressure ultrafiltration 0.089, a third study 0.190. AAG-driven — "Variability in AAG concentration accounted for most of the observed intersubject variability".' },
  { slug: 'zonisamide', fu: 0.50, refs: ['PMID:16302888'],
    note: 'Human: "lamotrigine (55%) and zonisamide (50%) intermediate binding" (PMID:16302888), converted 1 - 0.50. REVIEW-GRADE — no primary human abstract states a number. The label says approximately 40% bound, giving 0.60; immaterial for a Hill correction, where 1/fu is 2.0 versus 1.7. The same abstract raises the matrix caveat itself: "the binding by zonisamide is complicated by its binding to erythrocytes as well as albumin", and the label reports an eightfold red-cell concentration. A 60%-unbound figure in the literature is in HOUND DOGS and was rejected.' },
  { slug: 'clomipramine', fu: 0.03,
    note: 'LABEL-GRADE, parent clomipramine: approximately 97% bound, principally to albumin, and explicitly INDEPENDENT OF CONCENTRATION. Two wrong-analyte traps rejected: the 8.0% and 3.9% free fractions circulating in this literature belong to the DEMETHYL metabolite, and a 94.9% figure in the same search belongs to TRIMIPRAMINE, a different drug. A 6.51% free fraction is in RATS.' },
  { slug: 'isradipine', fu: 0.05,
    note: 'LABEL-GRADE (95% bound). The only abstract available states "strongly bound to serum proteins (up to 97%)" for ISRADIPINE AND DARODIPINE JOINTLY — an upper bound covering two drugs, which is exactly the shape this audit rejects. Also binds lipoproteins and partitions into red cells (16%).' },
  { slug: 'canagliflozin', fu: 0.01,
    note: 'LABEL-GRADE (99% bound, mainly albumin), and the label closes two caveats explicitly: binding is independent of concentration and is not meaningfully altered in renal or hepatic impairment. A PubMed-indexed record carries the same number but is a tertiary NIH database restating the label, so it adds no independent grade.' },
  { slug: 'atomoxetine', fu: 0.02,
    note: 'LABEL-GRADE, chosen deliberately over an abstract: the label says "At therapeutic concentrations, 98% of atomoxetine in plasma is bound to protein", while a sponsor review says "approximately 99% bound". A ONE-POINT DIFFERENCE IN THE BOUND FIGURE IS A TWOFOLD DIFFERENCE IN fu — 1/fu of 50 versus 100 — which is the general hazard of storing fu for anything above 98% bound. The label value is the more conservative and is the one the regulator accepted.' },
  { slug: 'pitolisant', fu: 0.09,
    note: 'A LABEL RANGE STORED AT ITS UNDER-CORRECTING ENDPOINT: "Serum protein binding is approximately 91% to 96%", giving fu 0.09 to 0.04; the higher value is stored so the correction cannot be overstated. THERE IS NO PUBMED ABSTRACT AT ALL — searches across the drug name, its development code and its brand name return only H3-receptor medicinal chemistry. The endpoints differ by more than twofold in 1/fu, so this row is weak; a midpoint would have been worse.' },

  // ── group 4 ────────────────────────────────────────────────────────
  { slug: 'tamsulosin', fu: 0.0090, refs: ['PMID:10492056'],
    note: 'The strongest row of its group: a dedicated ultrafiltration study with an explicit healthy-adult control arm, stated as unbound. "The mean percentage of unbound 14C-tamsulosin was 0.90% in the healthy subjects (control) and was 0.71% in the patients" (PMID:10492056). AAG-BOUND, AND ITS DISEASE SHIFT RUNS OPPOSITE TO THE ACIDIC-DRUG PATTERN — in renal patients binding went UP and fu DOWN, because AAG rises. The species gap is large and the rat value (79-81% bound) must not be used.' },
  { slug: 'paroxetine', fu: 0.05, refs: ['PMID:23338224'],
    note: 'Human, parent paroxetine: "Approximately 95% of paroxetine is protein bound in the plasma" (PMID:23338224), corroborated verbatim by a second independent abstract. Both are review-grade rather than primary binding experiments. Only mildly concentration-dependent — the label shows 95% at 100 ng/mL falling to 93% at 400, and 100 ng/mL is already the top of the therapeutic range.' },
  { slug: 'quetiapine', fu: 0.17, refs: ['PMID:11510628'],
    note: 'Human serum, parent quetiapine: "The drug is approximately 83% bound to serum proteins" (PMID:11510628), corroborated by the label at therapeutic concentrations. THIS IS ABOVE THE RANGE I EXPECTED AND WAS NOT SHADED TOWARD IT — quetiapine is genuinely much less bound than the SSRIs and tricyclics it sits beside. Its two active metabolites circulate at 2-12% of parent, so the parent is the right analyte.' },
  { slug: 'doxepin', fu: 0.204, refs: ['PMID:7113722'],
    note: 'Human, 16 healthy subjects, equilibrium dialysis, stated as unbound: "The mean +/- SEM percentages of unbound DOX were: 20.4 +/- 1.2 and 15.9 +/- 1.2 in healthy subjects (n = 16) and patients (n = 15) respectively" (PMID:7113722). ALSO ABOVE MY STATED PRIOR, WHICH APPEARS TO HAVE BEEN ANCHORED ON THE ONE OUTLYING STUDY (0.105). The verified human spread is 0.105-0.245 and the source reports "2--4-fold interindividual variability". Binds both albumin and AAG. The active metabolite desmethyldoxepin is 21.4% unbound in the same paper.' },
  { slug: 'ketoprofen', fu: 0.0052, refs: ['PMID:9353694'],
    note: 'A FLOOR, NOT A THERAPEUTIC-DOSE VALUE, and stored as such. The source gives it as fu_min, the asymptotic limit "at low drug concentrations": "ketoprofen 0.52%" (PMID:9353694). It has the WEAKEST albumin affinity of the six NSAIDs in that paper (K1 5.23 uM against flurbiprofen 0.0658) and therapeutic plasma sits at 20-40 uM, well ABOVE K1 — so in-vivo fu at dose is higher, meaning this floor sits BELOW the truth and OVER-corrects. Kept as the only sourceable figure, with the direction stated. Enantiomer risk is bounded: binding is "non-stereoselective ... over the therapeutic range".' },
  { slug: 'ramelteon', fu: 0.18,
    note: 'LABEL-GRADE, parent ramelteon: approximately 82% in human serum, "independent of concentration" — unusually clean for a fallback. No PubMed abstract states a figure; two 40-record sweeps returned only "rebound insomnia". ANALYTE CAVEAT: the active metabolite M-II circulates far above parent, and this figure describes the parent alone.' },
  { slug: 'sertraline', fu: 0.02,
    note: 'LABEL-GRADE, human serum in vitro: 98% bound over 20 to 500 ng/mL, a span covering the therapeutic range, so no saturation flag is needed. PubMed offers only non-values: one review gives ">= 95%" for three SSRIs jointly, another "up to 97%" in passing, and a third states ">97% bound" in a paper titled for the RAT AND DOG with no species attached to that sentence.' },
  { slug: 'empagliflozin', fu: 0.138,
    note: 'LABEL-GRADE but IN-VIVO AND HUMAN, which is a strong provenance despite not being an abstract: after an oral [14C]-empagliflozin solution to healthy subjects, red blood cell partitioning was approximately 36.8% and plasma protein binding 86.2%. No PubMed abstract carries the figure — a 60-record sweep returns molecular-docking papers, where "protein binding" means ligand-receptor docking rather than plasma binding.' },
  { slug: 'terazosin', fu: 0.10,
    note: 'A LABEL RANGE STORED AT ITS UNDER-CORRECTING ENDPOINT: "The drug is 90 to 94% bound to plasma proteins and binding is constant over the clinical dose range", giving fu 0.10 to 0.06; the higher value is stored. NO PUBMED ABSTRACT STATES PROTEIN BINDING AT ALL — the only "binding" hits are alpha-1 adrenoceptor radioligand binding in rat tissue, which is a different kind of binding entirely. The 1.67-fold width is the whole risk, and the label at least rules out concentration dependence.' },

  // ── group 5 ────────────────────────────────────────────────────────
  { slug: 'ticagrelor', fu: 0.002, refs: ['PMID:30048515', 'PMID:21727045'],
    note: 'The cleanest row of its group, and free of the usual analyte ambiguity because PARENT AND ACTIVE METABOLITE BIND IDENTICALLY: "plasma protein-bound to 99.8% and only the 0.2% free fraction is able to inhibit the P2Y12 receptor" (PMID:30048515), corroborated by equilibrium dialysis in human plasma showing both above 99.8% (PMID:21727045).' },
  { slug: 'risperidone', fu: 0.100, refs: ['PMID:7531854'],
    note: 'Human, parent risperidone: "Risperidone was 90.0% bound in human plasma, 88.2% in rat plasma and 91.7% in dog plasma" (PMID:7531854) — the human figure stated alongside the animal ones, so no species ambiguity. The same abstract resolves every population caveat: binding is "independent of the drug concentration up to 200 ng/ml", not different in the elderly, and only slightly changed in hepatic or renal impairment. Bound to both albumin and AAG.' },
  { slug: 'paliperidone', fu: 0.226, refs: ['PMID:7531854'],
    note: 'Human, 9-hydroxyrisperidone: "The protein binding of 9-hydroxy-risperidone was lower and averaged 77.4% in human plasma, 74.7% in rat plasma and 79.7% in dog plasma" (PMID:7531854). A SPECIES TRAP AVOIDED, AND MY OWN PROMPT SUPPLIED IT — I told the agent to expect roughly 74%, and 74.7% IS THE RAT VALUE in this abstract; the human figure is 77.4%. The label separately gives 74% for racemic paliperidone, a different route to nearly the same number. Parent and metabolite come from adjacent sentences of one paper, so citing it for both removes any transplant risk.' },
  { slug: 'methadone', fu: 0.106, refs: ['PMID:7193106', 'PMID:2311335'],
    note: 'RACEMATE, 29 healthy subjects, stated as a free fraction: "free fraction of dl-methadone was (mean% +/- SD) 10.62 +/- 1.43" (PMID:7193106); a second study of 45 healthy subjects gives 12.7%. THE ACTIVE l-ENANTIOMER IS THE LESS BOUND ONE — 12.4% and 14.2% free in the two studies — so an R-methadone affinity would need the enantiomer value, not this one. AAG-DRIVEN AND THE SWING IS TENFOLD: "As the alpha 1-AGP increased from 0.05 to 2.0 gm/l, free fraction fell from 92.40% to 8.80%." In maintenance patients it is also dose-dependent, varying 5-25% inversely with total dose.' },
  { slug: 'pregabalin', fu: 1.0, refs: ['PMID:23205518'],
    note: 'A CITABLE POSITIVE FACT RATHER THAN AN ABSENCE OF DATA: "There is no binding to plasma proteins, and more than 90% of the drug is renally excreted" (PMID:23205518), corroborated by an ultracentrifugation study of 278 sera finding gabapentin and pregabalin "non-protein-bound". fu = 1 makes the free-fraction correction a no-op for this compound, which is the correct outcome.' },
  { slug: 'fluoxetine', fu: 0.055,
    note: 'LABEL-GRADE, parent fluoxetine, chosen over the abstract deliberately: "Over the concentration range from 200 ng/mL to 1,000 ng/mL, approximately 94.5% of fluoxetine is bound in vitro to human serum proteins, including albumin and alpha1-glycoprotein" — a stated concentration span bracketing therapeutic levels. The nearest abstract gives "approximately 94% protein bound" in a narrative review whose PRECEDING SENTENCE quotes bioavailability in DOGS, so the species of the binding sentence is not established. Norfluoxetine is not covered.' },
  { slug: 'cetirizine', fu: 0.07,
    note: 'LABEL-GRADE, racemate: "The mean plasma protein binding of cetirizine is 93%, independent of concentration in the range of 25-1000 ng/mL, which includes the therapeutic plasma levels observed". No abstract states a racemate value. Rejected: a levocetirizine-only figure (96.1%), a 6.45% free fraction that is a WHOLE-BLOOD partition rather than a plasma fu, an 88-96% range, and an 88% value measured in CATS.' },
  { slug: 'aripiprazole', fu: 0.01, refs: ['PMID:15257633'],
    note: 'AN INEQUALITY STORED AS ITS BOUND: "more than 99% of aripiprazole and dehydro-aripiprazole (the main active metabolite of aripiprazole) is bound to plasma protein" (PMID:15257633). Every source found states the inequality and none a point value, so this under-corrects by construction. Parent and active metabolite are stated together, so there is no analyte ambiguity, and binding is primarily to albumin rather than AAG.' },
  { slug: 'duloxetine', fu: 0.10,
    note: 'AN INEQUALITY STORED AS ITS BOUND, LABEL-GRADE: "Duloxetine is highly bound (>90%) to proteins in human plasma, binding primarily to albumin and alpha1-acid glycoprotein", so fu is at most 0.10 and this under-corrects. NO PUBMED ABSTRACT STATES A PERCENTAGE — roughly 275 abstracts were swept across four query strategies. The widely-cited 96% appears in neither the abstracts nor the label. The label does state that binding is unaffected by renal or hepatic impairment.' },

  // ── group 6 ────────────────────────────────────────────────────────
  { slug: 'losartan', fu: 0.014, refs: ['PMID:7657853'],
    note: 'PARENT losartan, and the analyte was confirmed against this record rather than assumed: our mw, half-life and occupancy KB are all the parent, and EXP3174 has no entry. Human: "a percent unbound (free) of 1.4 +/- 0.2% to 1.2 +/- 0.1% at concentrations ranging from 0.5 to 5.0 micrograms/mL" (PMID:7657853). EXP3174 IN THAT SAME PAPER IS 0.4-0.5% FREE, SEVEN TIMES LOWER — taking the metabolite value would have been a sevenfold error against a parent curve. Albumin-bound with negligible AAG binding.' },
  { slug: 'hydromorphone', fu: 0.86, refs: ['PMID:22884788', 'PMID:12587803'],
    note: 'Human, and corroborated three ways including one source stating it as a free fraction outright, which removes any complement-flip risk: "Hydromorphone was on the average 14% bound to plasma proteins" (PMID:22884788); "unbound fractions of 1 and 0.84" in milk and plasma of healthy lactating women (PMID:12587803); and 11.6% bound in an ICU cohort. The label range of 8-19% bound brackets all three.' },
  { slug: 'sotalol', fu: 1.0, refs: ['PMID:8573689'],
    note: 'Essentially unbound, as expected for a hydrophilic renally-cleared beta-blocker. The label states it "does not bind to plasma proteins", and an ultrafiltration study of young and elderly humans found "bound fraction was less than 7% for both STL enantiomers", concluding binding is "negligible and non-stereoselective". A CONFLICT IS LOGGED RATHER THAN BURIED: one steady-state patient study reports 35-38% bound, implying fu near 0.63. It is contradicted by two independent methods and by the label, and is judged the outlier — but at any value above 0.93 the correction is a no-op regardless.' },
  { slug: 'asenapine', fu: 0.05, refs: ['PMID:32943849'],
    note: 'Human: "Asenapine is highly bound (95%) to albumin and alpha1-acid glycoprotein" (PMID:32943849), matching the label verbatim. REVIEW-GRADE RESTATING LABEL DATA — only two abstracts in all of PubMed pair this drug with any binding term, and the other reports unbound AUC ratios with no fraction. Partly AAG-bound, so inflammation-sensitive.' },
  { slug: 'sildenafil', fu: 0.04,
    note: 'LABEL-GRADE: "Sildenafil and its major circulating N-desmethyl metabolite are both approximately 96% bound to plasma proteins". The nearest abstract gives the same 4% free but only as a parenthetical comparator inside a paediatric case report. AGE DEPENDENCE RUNS IN THE UNUSUAL DIRECTION — the unbound fraction is SMALLER in the elderly, not larger. A 84-96% figure in the literature is pooled across dog and human and was rejected as a range.' },
  { slug: 'tofacitinib', fu: 0.60,
    note: 'LABEL-GRADE: "The protein binding of tofacitinib is approximately 40%. Tofacitinib binds predominantly to albumin and does not appear to bind to alpha1-acid glycoprotein." No PubMed abstract states it; the "40%" hits in that literature are colectomy and hypoalbuminaemia clinical papers. Albumin-only binding matters here, because it means fu is stable across the inflammation that defines this drug indications.' },
  { slug: 'olmesartan', fu: 0.01,
    note: 'LABEL-GRADE: "Olmesartan is highly bound to plasma proteins (99%) and does not penetrate red blood cells." THE ABSENCE IS UNUSUALLY COMPLETE — a raw search for this drug with "protein binding" in title or abstract returns exactly ONE record in all of PubMed, and it is a computational paper about ligand binding SITES. Analyte confirmed against this record: our mw and half-life are the active acid, not the medoxomil ester, and the label figure is for the acid.' },
  { slug: 'tadalafil', fu: 0.06,
    note: 'LABEL-GRADE: "At therapeutic concentrations, 94% of tadalafil in plasma is bound to proteins." The only human abstract data is in CHILDREN WITH PROTEIN-LOSING ENTEROPATHY at serum albumin 2.4-4.2 g/dL, giving a 3.9-13% range across two patients — precisely the hypoalbuminaemic shift that makes a patient value unusable, though it does confirm the direction and the albumin dependence.' },
  { slug: 'varenicline', fu: 0.80, refs: ['PMID:21053991'],
    note: 'AN INEQUALITY STORED AT ITS CONSERVATIVE END: "Protein binding of varenicline is low (<= 20%) and independent of age and renal function" (PMID:21053991), so fu is at least 0.80 and storing 0.80 assumes maximum binding — it cannot overstate the correction. Every source gives a ceiling and none a point value. 0.80 is the UNBOUND share; this drug is genuinely weakly bound.' },

  // ── group 7 ────────────────────────────────────────────────────────
  { slug: 'dexamethasone', fu: 0.249, refs: ['PMID:2316228'],
    note: 'Human, normal serum, equilibrium dialysis: "The mean (+/- SD) percent bound ... for dexamethasone was similar for untreated (75.1 +/- 3.6 percent) and charcoal-treated (77.3 +/- 3.5 percent) normal serum" (PMID:2316228). THE EXPECTATION THAT IT BEHAVES UNLIKE CORTISOL IS CONFIRMED BY THE SOURCE, NOT ASSUMED: "the binding of dexamethasone is linear and occurs primarily to albumin, with little or no binding to corticosteroid-binding globulin", and linear across 10-1000 ng/mL. Uraemia raises fu to 0.308.' },
  { slug: 'doxazosin', fu: 0.010, refs: ['PMID:2951051'],
    note: 'Stated as unbound directly, and explicitly dose-independent: "degree of protein binding (1.2%, 1.0%, and 1.0% unbound, respectively) were dose independent" at 2, 4 and 8 mg steady state (PMID:2951051). Population is essential-hypertension patients rather than healthy volunteers. A second human source gives 98.3% bound, i.e. 0.017; the rat value in that same sentence is 95.3% and is not used. Active metabolites do not contribute meaningfully, so the parent is the right analyte.' },
  { slug: 'lurasidone', fu: 0.01, refs: ['PMID:27722855'],
    note: 'Human: "it is approximately 99 % bound to serum plasma proteins" (PMID:27722855). ONE SIGNIFICANT FIGURE, WHICH AT THIS BINDING LEVEL IS A FACTOR-OF-TWO UNCERTAINTY IN THE FREE CONCENTRATION, and the source is a systematic review rather than a primary measurement. The only primary binding study is in RATS (99.6%, concentration-independent) and is not carried across.' },
  { slug: 'spironolactone', fu: 0.11, refs: ['PMID:1261153'],
    note: 'AN INEQUALITY STORED AS ITS BOUND, and it is the one PARENT-specific figure in the literature rather than the label "spironolactone and its metabolites" lump: "their protein binding exceeded 89% at concentrations of 550 and 710 ng/ml" for parent and canrenone respectively, in 5 healthy men (PMID:1261153). Canrenone is separately about 95% bound and must not be cross-applied. STANDING CAVEAT INDEPENDENT OF fu: this record own note records that the parent carries roughly 3% of active exposure, and correcting the parent occupancy does not fix that.' },
  { slug: 'brexpiprazole', fu: 0.01, refs: ['PMID:33685346'],
    note: 'AN INEQUALITY STORED AS ITS BOUND, AND SPECIES-LUMPED: "The serum protein binding of brexpiprazole was 99% or more in animals and human" (PMID:33685346) — human is included but not separately quantified. Storing 0.01 asserts exactly 99%, which the source does not say; the true fu could be several times lower, so this under-corrects. No abstract gives a decimal.' },
  { slug: 'saxagliptin', fu: 0.70, refs: ['PMID:19251818'],
    note: 'A CEILING ON BINDING STORED AT ITS CONSERVATIVE END: "The in vitro serum protein binding was low (< or =30%) in rats, dogs, monkeys, and humans" (PMID:19251818), so fu is at least 0.70. THE GUARANTEE IS INVERTED FOR THIS SHAPE: a ceiling on BINDING is a floor on fu, so 0.70 is the MOST-correcting end and can over-correct by at most 1.43x. Species-pooled, human included. The honest interval is 0.70 to 1.0. 0.70 is the UNBOUND share; this drug is genuinely weakly bound.' },
  { slug: 'sitagliptin', fu: 0.62,
    note: 'LABEL-GRADE despite appearing in a PubMed abstract: "only 38% of the drug is bound reversibly to plasma proteins" is background prose in a MUCOADHESIVE NANOPARTICLE FORMULATION paper restating the label, not a binding measurement. The human mass-balance study states no binding figure, and the nearest disposition paper is rats and dogs. 0.62 is the UNBOUND share.' },
  { slug: 'rosuvastatin', fu: 0.12,
    note: 'LABEL-GRADE (approximately 88% bound, mostly albumin); no PubMed abstract states a percentage. AN fu CORRECTION MAKES THIS ROW LOOK MORE PRINCIPLED WITHOUT MAKING IT MORE TRUE: the target is inside the hepatocyte and OATP1B1 actively concentrates the drug there, so free plasma is a FLOOR on the target-site concentration rather than an estimate of it — one of the papers chased is titled for exactly this, "The Presence of a Transporter-Induced Protein Binding Shift". This record own effect-compartment note already says no equilibration rate can bridge that gap.' },

  // ── group 8 ────────────────────────────────────────────────────────
  { slug: 'diclofenac', fu: 0.003, refs: ['PMID:3572745'],
    note: 'Human plasma, equilibrium dialysis: "99.5 +/- 0.2% versus 99.7 +/- 0.1%" for synovial fluid versus plasma respectively (PMID:3572745), so 99.7% is the plasma figure. Albumin confirmed as the binding protein, and arthritic and normal plasma differ very little. A SECOND HUMAN SOURCE GIVES A LOWER FLOOR OF 0.0021 as an fu_min at low concentration; 0.003 is preferred because the stored source shows binding constant across 2-10 ug/mL, which spans therapeutic Cmax. A >99% figure in the same literature is in MONKEYS, and a 99.0-99.2% figure never names its species.' },
  { slug: 'escitalopram', fu: 0.44, refs: ['PMID:17375980'],
    note: 'SOURCED INDEPENDENTLY OF CITALOPRAM, deliberately: "Escitalopram has low protein binding (56%)" (PMID:17375980), from an escitalopram-specific review that states the figure of this drug rather than inheriting it from the racemate. A source giving "50-56%" for escitalopram and citalopram jointly was rejected — it is both a range and a lumping of the two records, which is the cross-drug transplant shape this catalog has already been bitten by.' },
  { slug: 'fluvoxamine', fu: 0.23, refs: ['PMID:8846617'],
    note: 'Human: "Plasma protein binding of fluvoxamine (77%) is low compared with that of other SSRIs" (PMID:8846617). Analyte is unambiguous — the same review notes nine metabolites, "none of which are known to be pharmacologically active", and fluvoxamine has no stereoisomers. Review-grade with no method or n stated, and the author affiliation is the manufacturer.' },
  { slug: 'zolmitriptan', fu: 0.75, refs: ['PMID:18028032'],
    note: 'Human, parent zolmitriptan: "only 25% of zolmitriptan is bound to plasma proteins" (PMID:18028032). The label independently corroborates and rules out concentration dependence: binding is 25% over 10 to 1000 ng/mL. The active N-desmethyl metabolite is not covered by this figure.' },
  { slug: 'melatonin', fu: 0.47, refs: ['PMID:9380773'],
    note: 'Human serum, equilibrium dialysis: "The binding to serum was moderate (53%) for physiological melatonin concentrations below 1 nmol/L" (PMID:9380773). CONCENTRATION-DEPENDENT, AND THE QUALIFIER MATTERS — binding has "a saturable and a nonsaturable component", the saturable one being high-affinity AAG, and a 3 mg oral dose goes well above 1 nmol/L. So true fu at a real dose is HIGHER than this, which means 0.47 sits BELOW the truth and OVER-corrects — it reduces occupancy more than warranted. The one-sided guarantee that holds for inequalities and ranges does NOT hold here.' },
  { slug: 'diphenhydramine', fu: 0.183, refs: ['PMID:2369804'],
    note: 'Healthy human volunteers, stated as unbound: "the percentages of unbound diphenhydramine (26.40% +/- 6.46% versus 18.30% +/- 4.31 ...) were significantly higher in Chinese subjects compared to Caucasians" (PMID:2369804). The Caucasian value is stored; the ethnic difference is 1.4-fold and is AAG-driven. THIS CONFLICTS BY AN ORDER OF MAGNITUDE with the 98-99% bound figure that circulates in tertiary references, which could not be sourced to any abstract. A direct measurement in a clinical pharmacology journal is preferred over the tertiary number, but the disagreement is recorded.' },
  { slug: 'nicotine', fu: 0.951, refs: ['PMID:3545615'],
    note: 'A RANGE STORED AT ITS UNDER-CORRECTING ENDPOINT: "Plasma protein binding is negligible, ranging from 4.9 to 20%" (PMID:3545615), giving fu 0.951 to 0.80. Direction checked deliberately — the source reports BINDING of 4.9-20% and calls it negligible, so fu is high and the complement would have been the flipped error. The consequence of the range is small here: anywhere in 0.80-0.95 changes occupancy by under 20%.' },
  { slug: 'trazodone', fu: 0.11,
    note: 'A LABEL RANGE STORED AT ITS UNDER-CORRECTING ENDPOINT, and label-grade as well as range-only: "Trazodone is 89 to 95% protein bound in vitro at concentrations attained with therapeutic doses in humans", giving fu 0.11 to 0.05. No PubMed abstract states a percentage. PARENT ONLY — the active metabolite mCPP has its own receptor profile and does not inherit this figure.' },
  { slug: 'candesartan', fu: 0.01, refs: ['PMID:11825094'],
    note: 'AN INEQUALITY STORED AS ITS BOUND: "Plasma protein binding in humans is more than 99%" (PMID:11825094), so this under-corrects by construction. Analyte is correct — the same abstract establishes that the cilexetil prodrug is completely metabolised to candesartan and the binding sentence sits in the active-drug section. The label adds that binding is constant well above therapeutic concentrations and that the drug does not penetrate red blood cells.' },
];

for (const f of FU) {
  const c = need(f.slug);
  if (c.fraction_unbound != null) { log.push(`${f.slug} — already authored, skipped`); continue; }
  if (f.note.length > 600) throw new Error(`${f.slug} fu_note ${f.note.length} > 600`);
  if (!(f.fu > 0 && f.fu <= 1)) throw new Error(`${f.slug} fu ${f.fu} outside (0, 1]`);
  c.fraction_unbound = f.fu;
  c.fu_note = f.note;
  if (f.refs?.length) { c.refs ??= []; for (const r of f.refs) if (!c.refs.includes(r)) c.refs.push(r); }
  log.push(`${f.slug} — fu ${f.fu} (1/fu = ${(1 / f.fu).toFixed(1)}x correction)`);
}

console.log(` ${FU.length} authored:\n`);
for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
