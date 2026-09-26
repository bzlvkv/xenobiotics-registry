/**
 * 2026-09-06-pharmacological-batch1.ts
 *
 * First batch of the pharmacological category: the 41 compounds that scored
 * highest on the templating signatures earlier passes established (a
 * volume-and-bioavailability pair shared with unrelated drugs, a volume shared
 * across ten or more compounds, a full parameter quartet, a lone reference).
 * Eight agents read every cited abstract.
 *
 * ── The finding that dominates this batch ─────────────────────────────────
 * ABSORPTION RATE IS UNSOURCED ACROSS THE WHOLE REGISTRY. Half of the 524
 * compounds carrying a non-IV `ka_hr` share just five values — 73 use 1.0, 71
 * use 1.5, 47 use 0.5, 37 use 1.4, 35 use 0.7. Of the 44 audited routes that
 * carried one, NOT ONE was supported by its citation. The cause is structural
 * rather than careless: papers report a time to peak, not an absorption rate
 * constant, so there was usually nothing to cite. Several stored values are
 * demonstrably a Tmax in HOURS reused as a rate in PER HOUR (cimetidine 2,
 * lacosamide 1.4 from a bioequivalence ratio of 1.48, zafirlukast 0.5 from a
 * ratio between two rate constants). Every audited ka is therefore removed and
 * the field left to resolvePk's declared default.
 *
 * ── Three defects that are wrong models, not wrong numbers ────────────────
 *   • midazolam's oral volume of 114 L is 50.2 / 0.44 — its own IV volume
 *     divided by its own bioavailability. Storing both then divides by F twice,
 *     understating oral exposure by exactly 1/F.
 *   • olanzapine's IM row carried 33 h while its citation says the depot
 *     half-life is "~30 days, controlled by the slow rate of intramuscular
 *     absorption rather than the 30-h elimination rate-based half-life of oral
 *     olanzapine" — about 24x wrong, and it inverts the paper's point.
 *   • inclisiran is undetectable in plasma at 48 h while its effect lasts six
 *     months, because it acts inside hepatocytes. No plasma curve represents it.
 *
 * ── Route errors: a citation that never used the route it is filed under ──
 * Seven rows. lorazepam's IV row is the starkest: its cited paper administered
 * no IV lorazepam at all — the only IV agent in it was ANTIPYRINE, a probe drug.
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
 * Where a replacement volume is APPARENT (V/F), F is pinned to 1 so absorption
 * is not divided in twice; the measured bioavailability is recorded in the note.
 */
const FIXES: { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs?: string[]; note: string; summary: string }[] = [
  { slug: 'alprazolam', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 58.8, F: 0.92, source_pmid: 'PMID:6152055' }, SL: { source_pmid: 'PMID:3680603' } },
    hl: { PO: 11.8, SL: 11.7 }, refs: ['PMID:6152055', 'PMID:8491063'],
    note: 'PK: Smith 1984 (PMID:6152055), 6 healthy men, 1 mg IV and 1 mg oral crossover — the only true-IV alprazolam study — verbatim "volume of distribution (Vd) 0.72 and 0.84 l/kg", "elimination half-life (t1/2) 11.7 and 11.8 h" and "The mean fraction absorbed after oral administration was 0.92". The oral V is 0.84 L/kg x 70 kg = 58.8 L. The SL half-life was 16 h, copied from the PO row: its own paper (PMID:3680603) states 11.7 h. V 80 L and F 0.9 were a shared default appearing in neither abstract, and ka 2.5 /h has no relationship to the cited paper Tmax of 1.5 h. A population ka of 1.1 /h exists (PMID:8491063) but is from 94 psychiatric inpatients and is not imported.',
    summary: 'alprazolam — re-sourced to the IV/PO crossover; SL half-life 16->11.7 h; shared V/F default dropped' },

  { slug: 'lacosamide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 1, source_pmid: 'PMID:23148731' }, IV: { F: 1, source_pmid: 'PMID:22722651' } },
    hl: { PO: 12.5, IV: 12.5 }, refs: ['PMID:22722651', 'PMID:25957198'],
    note: 'PK: half-life corrected 13 -> 12.5 h. The cited paper (PMID:23148731) reports "12.5 and 12.4 h in plasma, and 13.1 and 13.3 h in saliva" — the stored value was a rounding of the SALIVA figure. The IV row was filed under a paper with no intravenous arm; it now cites Cawello 2012 (PMID:22722651), which establishes IV/oral bioequivalence and so justifies carrying the same half-life. F 1 is supported: "Oral bioavailability is high (100 %) for a dose up to 800 mg" (PMID:25957198). V 42 L and ka 1.4 /h dropped — no PubMed abstract states a lacosamide volume, 42 L is the approval document 0.6 L/kg x 70, and the 1.4 traces to a bioequivalence RATIO of 1.48, not a rate.',
    summary: 'lacosamide — half-life was the saliva figure; IV row re-cited to a study with an IV arm' },

  { slug: 'zafirlukast', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:11888331' } }, hl: { PO: 10 },
    note: 'PK: only the half-life survives — "a mean terminal elimination half-life of approximately 10 hours in both healthy volunteers and patients with asthma" (PMID:11888331, a review). THE STORED F 0.6 WAS CONTRADICTED IN TERMS: the same abstract states "The absolute bioavailability of zafirlukast is unknown", and 0.6 was mis-derived from the very next sentence, that food "reduces bioavailability by approximately 40%" — a food effect turned into an absolute bioavailability. ka 0.5 /h traces to a ratio BETWEEN two rate constants ("Kac:Ka was <0.5", PMID:10751029), not to a rate. V 70 L appears nowhere. No absolute bioavailability or volume exists anywhere in the zafirlukast literature.',
    summary: 'zafirlukast — F 0.6 contradicted by its own citation ("bioavailability is unknown"); ka/V dropped' },

  { slug: 'gentamicin', guard: (c) => c.pk?.IM?.ka_hr != null,
    pk: { IV: { V_L: 12.9, F: 1, source_pmid: 'PMID:8361865' }, IM: { F: 1, source_pmid: 'PMID:3396458' } },
    hl: { IV: 1.92, IM: 1.92 }, refs: ['PMID:712111'],
    note: 'PK: Merritt 1993 (PMID:8361865), 5 healthy men dosed on LEAN body weight, verbatim "beta half-life (112, 115 min)" and "volume of distribution (0.201, 0.184 L/kg)" — the normobaric arm gives 115 min (1.92 h) and 0.184 L/kg, which is 12.9 L at 70 kg. The stored 2 h and 14 L were roundings of the other arm. The IM row previously carried a half-life its own paper never reports and a ka of 2.33 /h matching nothing in it; that paper (PMID:3396458) supports only that IM bioavailability "was complete and did not differ from control values". CAVEATS: gentamicin is renally cleared, so a fixed half-life is valid only at normal renal function; and the volume is body-composition dependent (PMID:712111), so it should be read per kilogram rather than as a fixed 12.9 L.',
    summary: 'gentamicin — half-life 2->1.92 h and V 14->12.9 L (its paper own figures); IM ka dropped' },

  { slug: 'tolbutamide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 10.5, source_pmid: 'PMID:837649' } }, hl: { PO: 6.29 },
    refs: ['PMID:3169118', 'PMID:837649', 'PMID:10190649'],
    note: 'PK: the stored 5.5 h was the MIDPOINT of the approval document range "4.5 to 6.5 hours" and sat below every published human measurement. Replaced by Adebayo 1988 (PMID:3169118), 8 healthy men, verbatim "Control half-life of tolbutamide 6.29 h". V 10.5 L is Williams 1977 (PMID:837649), the only TRUE (intravenous) human volume, verbatim "0.15 +/- 0.03 L/kg" x 70 kg; the stored 14 L was above every measured value. ka 0.5 /h and F 0.8 dropped: neither appears in the approval document, whose only absorption statement is a Tmax of 3 to 4 hours, nor anywhere in PubMed. An apparent volume of 9.1 L exists (PMID:10190649) but must not be paired with a separate bioavailability.',
    summary: 'tolbutamide — half-life 5.5 (a midpoint) -> 6.29 h; V 14 -> 10.5 L (true IV volume); ka/F dropped' },

  { slug: 'simvastatin', guard: (c) => c.pk?.PO?.V_L === 140,
    pk: { PO: { F: 0.07, source_pmid: 'PMID:8343198' } }, hl: { PO: 5.9 },
    refs: ['PMID:14691614'],
    note: 'PK models SIMVASTATIN ACID, the active species — the parent is an inactive lactone prodrug, and its own citation says so: "simvastatin is not active, while its metabolites are". Half-life 5.9 h is Ucar 2004 (PMID:14691614), 12 healthy volunteers, 80 mg, verbatim "half-life of simvastatin acid was shortened from 5.9+/-0.3 h". THE STORED 3 h WAS NOT A HALF-LIFE AT ALL: it is the midpoint of "peak inhibition of HMG-CoA reductase activity occurs within 2 to 4 hours", a pharmacodynamic time to peak effect. F corrected 0.05 -> 0.07, the figure its own citation states: "only 7% of the dose reaches the general circulation intact" — which describes the parent lactone. V 140 L dropped: no human volume exists, and at 5-7% bioavailability any apparent volume paired with F would double-count a near-total first-pass extraction.',
    summary: 'simvastatin — stored half-life was a PD time-to-peak; re-sourced to the active acid; F 0.05->0.07' },

  { slug: 'levetiracetam', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 35.1, F: 1, source_pmid: 'PMID:17324224' }, IV: { F: 1, source_pmid: 'PMID:16886975' } },
    hl: { PO: 7.3, IV: 8 }, refs: ['PMID:39932425', 'PMID:16861095', 'PMID:16886975'],
    note: 'PK: the oral half-life 7.3 h is verbatim and stands (PMID:17324224, 26 healthy men). The IV row was filed under that ORAL-ONLY study and now cites Ramael 2006 (PMID:16886975), verbatim "terminal half-life, 8.0 (14.5%) and 7.0 (12.7%) h" for two IV infusion arms. V 42 L was the midpoint of a review 0.5-0.7 L/kg x 70 kg; replaced by 35.1 L from a population fit (PMID:39932425) and F pinned to 1 because that is an apparent V/F. Oral and IV are bioequivalent, "geometric mean IV/oral ratios were 92.2 ... for AUC" (PMID:16861095). ka 4 /h dropped: unstated, and it predicts a Tmax near 1 h against the cited paper own median of 0.5 h.',
    summary: 'levetiracetam — IV row re-cited to an IV study; V 42 (a midpoint) -> 35.1 L apparent' },

  { slug: 'cimetidine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 70, F: 0.6, source_pmid: 'PMID:6418428' }, IV: { V_L: 70, F: 1, source_pmid: 'PMID:7059413' } },
    hl: { PO: 2, IV: 2 }, refs: ['PMID:7059413'],
    note: 'PK: half-life 2 h and oral F 0.6 are both verbatim in the cited review ("Elimination half-life is approximately 2 hours"; "The absolute bioavailability in healthy subjects is about 60%"), and the IV row now cites the primary behind that figure, Larsson 1982 (PMID:7059413), 9 patients with normal renal function. V 70 L is retained as the review 1 L/kg scaled to 70 kg and is flagged as derived rather than quoted. ka 2 /h dropped as a DIGIT COLLISION with the 2 h half-life, and it could not be right in any case: the same abstract reports that "2 plasma concentration peaks are frequently observed", which no single first-order absorption rate can represent. PERPETRATOR CAVEAT: this record drives other compounds interaction curves, and its 2 h holds only at normal renal function — the same primary gives 3.1 h at moderate and 4.5 h at severe impairment.',
    summary: 'cimetidine — IV re-cited to the primary; ka dropped as a collision with its own half-life' },

  { slug: 'glyburide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 7.44, F: 1.0, source_pmid: 'PMID:3932228' } }, hl: { PO: 9.7 },
    refs: ['PMID:3932228', 'PMID:8576296'],
    note: 'PK: half-life 9.7 h is verbatim but is the TERMINAL phase of a two-compartment fit — the same paper gives an initial phase of 3.3 h, so a one-compartment curve on 9.7 h overstates persistence. V 14 L matched nothing: both human intravenous determinations give 7.3-7.4 L (PMID:8576296 "7.44 +/- 1.53 litres" intravenously), and the larger 15.5 and 20.8 L figures in that same abstract belong to the METABOLITES M1 and M2, a wrong-analyte trap. F is re-cited to Neugebauer 1985 (PMID:3932228), the only true absolute determination, verbatim "an absolute bioavailability of 102% for HB 420" — formulation-specific, since the older form is 73% of it. ka 0.7 /h dropped, unstated anywhere.',
    summary: 'glyburide — V 14 -> 7.44 L (the real IV figure); F re-cited to the absolute study' },

  { slug: 'spironolactone', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:2723123' } }, hl: { PO: 1.4 },
    note: 'PK models the PARENT, which is a prodrug, and that is the record limitation rather than a citation defect. Half-life corrected 1.5 -> 1.4 h, the figure its own paper states. THE PARENT IS ABOUT 3% OF ACTIVE EXPOSURE: the same abstract gives day-15 areas under the curve of 231 for spironolactone against 2173 for canrenone and 2804 and 1727 for two further active metabolites, whose half-lives are 13.8 to 16.5 h. A 1.4 h curve therefore shows the effect gone in about six hours when real mineralocorticoid blockade lasts a day. ka 1.5 /h, V 80 L and F 0.9 dropped: none appears in the abstract, the V and F were a default shared with an unrelated record, and no volume or absolute bioavailability exists for spironolactone at all, since there is no intravenous formulation.',
    summary: 'spironolactone — half-life 1.5->1.4 h; shared V/F default dropped; parent-vs-metabolite gap recorded' },

  { slug: 'bisoprolol', guard: (c) => c.pk?.PO?.V_L === 210,
    pk: { PO: { V_L: 226, F: 0.9, source_pmid: 'PMID:2878941' } }, hl: { PO: 11 },
    note: 'PK: the best-supported record in this batch. Leopold 1986 (PMID:2878941), 23 healthy volunteers, verbatim "mean elimination half-lives of 11 hours for the unchanged drug" and "yielded an absolute bioavailability of 90%", both stored correctly. Volume corrected 210 -> 226 L, the paper own figure, verbatim "The volume of distribution was 226 L". Because that bioavailability is ABSOLUTE, measured against an intravenous comparison, the volume and F pair legitimately here — unlike most records in this batch. The absence of an absorption rate was already honest; the abstract says only that enteral absorption "was nearly complete".',
    summary: 'bisoprolol — V 210->226 L; half-life and absolute F confirmed verbatim as stored' },

  { slug: 'metronidazole', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 1, source_pmid: 'PMID:508508' }, IV: { V_L: 28, F: 1, source_pmid: 'PMID:3731917' } },
    hl: { PO: 7, IV: 7.1 }, refs: ['PMID:508508', 'PMID:3731917', 'PMID:3743624'],
    note: 'PK: the previous citation (PMID:10384859) is a REVIEW that states no numeric half-life at all, and its volume was the midpoint of a stated 0.51-1.1 L/kg range scaled to 70 kg. Re-sourced: Bergan 1986 (PMID:3731917), 10 healthy volunteers, 0.5 g IV, verbatim "The serum half-life of metronidazole was 7.1 in the healthy subjects" and a steady-state distribution volume of "0.404 liter/kg" (28 L at 70 kg) — one paper for both. Oral half-life 7.0 h from Houghton 1979 (PMID:508508), verbatim "the half-life estimates were 7.0 h and 7.3 h respectively". F corrected 0.9 -> 1: the stored value was a lower BOUND (">90%") while the measured figure is "approximately 1" (PMID:3743624). ka 1.4 /h dropped as unstated.',
    summary: 'metronidazole — re-sourced off a review; V was a range midpoint; F was a bound stored as a value' },

  { slug: 'pitolisant', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 700, F: 1, source_label: 'FDA prescribing information, Wakix (pitolisant), clinical pharmacology — apparent volume of distribution approximately 700 L (5 to 10 L/kg), median half-life approximately 20 hours (7.5 to 24.2), median Tmax 3.5 hours.' } },
    hl: { PO: 20 },
    note: 'PK stays on the approval document, which is the only source: no PubMed primary reports a pitolisant half-life, volume, absorption rate or bioavailability. THE LABEL WAS MISQUOTED. It says "The oral ABSORPTION of WAKIX is around 90%" — fraction absorbed, not bioavailability — and states no absolute bioavailability anywhere, so the stored F 0.9 was a misreading. F is pinned to 1 because the volume is explicitly APPARENT (V/F) and pairing the two would double-count absorption. ka 1.0 /h removed: it is a back-calculation from the label median Tmax of 3.5 h, not a stated figure. The half-life is a median with an individual spread of 7.5 to 24.2 h.',
    summary: 'pitolisant — F 0.9 was the label fraction absorbed, not bioavailability; V pinned apparent; ka dropped' },

  { slug: 'enalapril', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.62, source_pmid: 'PMID:3011046' } }, hl: { PO: 11 },
    refs: ['PMID:6091806', 'PMID:3011046'],
    note: 'PK describes ENALAPRILAT, the active diacid — enalapril is a prodrug and the cited paper measures only the metabolite. THE IV ROUTE WAS REMOVED: its cited study administered nothing intravenously, and more fundamentally the marketed intravenous product is enalaprilat, a different molecule, so an enalapril IV row asserting complete availability describes something that does not happen clinically. F corrected 0.6 -> 0.62, verbatim "There was no difference in F between young (0.62 +/- 0.16) and elderly subjects" (PMID:3011046, 9 healthy volunteers, oral enalapril against intravenous enalaprilat) — a true absolute figure. The half-life is re-cited to PMID:6091806, "An average effective half-life for accumulation of approximately 11h", and should be read as an accumulation half-life from urine data rather than a terminal disposition value. ka 1.2 /h and V 70 L dropped as unstated.',
    summary: 'enalapril — IV route removed (the IV drug is a different molecule); F 0.6->0.62 absolute' },

  { slug: 'cyclophosphamide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 46.5, F: 1, source_pmid: 'PMID:32390827' }, IV: { V_L: 46.5, F: 1, source_pmid: 'PMID:32390827' } },
    hl: { PO: 6.4, IV: 6.4 }, refs: ['PMID:32390827', 'PMID:3552204'],
    note: 'PK: the stored 4 h oral and 9 h intravenous half-lives were BOTH midpoints of ranges in the old citation (1.32-6.8 h and 5.97-12.37 h) and encoded a route-dependent disposition half-life, which cannot be right — the same paper own metabolite endpoint shows "no significant difference following oral and intravenous administration". A single value is now carried on both routes. V 46.5 L is Ahmed 2020 (PMID:32390827), 267 patients, verbatim "clearance and apparent volume of distribution of 5.41 L/h and 46.5 L", and the half-life follows from that fit ln2 x V/CL = 6.4 h rather than from a second paper; F is pinned to 1 because that volume is apparent. F 0.75 dropped: it was one minus a hepatic extraction ratio of 0.25, which ignores gut availability and is not a bioavailability. Analyte note: cyclophosphamide is a prodrug and these are parent values.',
    summary: 'cyclophosphamide — two range-midpoint half-lives replaced by one coherent fit; F was 1 minus an extraction ratio' },

  { slug: 'ezetimibe', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:23109219' } }, hl: { PO: 24.32 },
    refs: ['PMID:11901097'],
    note: 'PK models TOTAL EZETIMIBE, parent plus its active glucuronide, which is what the cited figure describes: verbatim "elimination half-life (t(1/2)) 24.32 +/- 13.27 and 18.90 +/- 9.66 h" for total and free drug respectively. The stored 24.3 was a rounding of the total; the parent alone is 18.90 h. CAVEAT ON THE MODEL ITSELF: ezetimibe recirculates through bile and shows "multiple peaks, indicating enterohepatic recycling" (PMID:11901097), which a monotonic one-compartment curve cannot represent at any half-life, and the model has no state for the glucuronide that carries most of the circulating exposure. ka 2.5 /h, V 100 L and F 0.5 dropped: the abstract states none of them.',
    summary: 'ezetimibe — analyte declared (total, not parent); ka/V/F dropped; recirculation caveat recorded' },

  { slug: 'trimethoprim', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 105, F: 1, source_pmid: 'PMID:7695325' }, IV: { V_L: 112, F: 1, source_pmid: 'PMID:7695325' } },
    hl: { PO: 11.3, IV: 10.9 }, refs: ['PMID:7695325'],
    note: 'PK re-sourced to Chin 1995 (PMID:7695325), adult patients dosed intravenously and then switched to oral in the SAME subjects, with trimethoprim reported separately from sulfamethoxazole — verbatim "volume of distribution, 1.6 +/- 0.5 versus 1.5 +/- 0.5 liters/kg", "half-life, 10.9 +/- 7.4 versus 11.3 +/- 4.0 h" and "bioavailability was 97.5% +/- 22.4% versus 101.8% +/- 22.7% for trimethoprim". Volumes are the per-kilogram figures scaled to 70 kg, and F is pinned to 1 since the measurement is effectively complete. The previous citation studied FOUR CHILDREN WITH BILIARY ATRESIA, reported a half-life whose standard deviation exceeded its mean, and contained no intravenous arm at all though the IV row cited it.',
    summary: 'trimethoprim — re-sourced off a 4-child biliary-atresia study to an adult IV-and-oral study' },

  { slug: 'entecavir', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:17050790' } }, hl: { PO: 24 },
    refs: ['PMID:17050790'],
    note: 'PK: half-life corrected 130 -> 24 h, and the correction is a change of PARAMETER, not just of number. Yan 2006 (PMID:17050790), 24 healthy subjects on 14 days of dosing, states verbatim a "terminal half-life ranging from 128 to 149 hours and an effective half-life of approximately 24 hours". The 128-149 h terminal phase reflects intracellular triphosphate persistence and is the wrong quantity for a plasma model on daily dosing; the effective half-life governs accumulation. The stored 130 h sat inside that terminal range but is written in no paper. ka 0.7 /h, V 42 L and F 0.95 dropped: the previous citation is a food-effect study whose only numbers are relative changes.',
    summary: 'entecavir — half-life 130 -> 24 h effective (the terminal phase is intracellular, not plasma)' },

  { slug: 'riluzole', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.6, source_pmid: 'PMID:9549636' } }, hl: { PO: 12 },
    refs: ['PMID:9390108'],
    note: 'PK: F 0.6 is verbatim and genuinely ABSOLUTE — "The mean absolute oral bioavailability of riluzole (50-mg tablet) was approximately 60%" — and is the only fully supported stored value in its group. The half-life of 12 h is retained as a LABEL-derived figure: the cited paper says only that it "appeared to be independent of dose" and no indexed abstract states a number. ka 1.4 /h dropped as a Tmax collision, the paper reporting a peak at "1.0 hour to 1.5 hours". V 245 L dropped: it is an apparent volume from the approval document and pairing it with a measured absolute bioavailability would double-count absorption. CAVEAT: clearance varies widely — 32% lower in women and 36% lower in non-smokers, with 51% between-subject variability (PMID:9390108).',
    summary: 'riluzole — absolute F confirmed; apparent V dropped to avoid double-counting; ka was a Tmax' },

  { slug: 'zonisamide', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:9549648' } }, hl: { PO: 63 },
    refs: ['PMID:9549648', 'PMID:6891599'],
    note: 'PK: half-life 63 h retained but re-cited to Kochak 1998 (PMID:9549648), 24 healthy volunteers, verbatim "The terminal-phase half-life after the last dose was 63 to 69 hours" — stored as the lower bound of that range. THE STORED ka OF 0.026 /h WAS VERBATIM IN ITS OWN CITATION AND IS STILL REMOVED: that model reports a clearance of 23.25 L/h against 0.60-0.71 L/h in the literature, about 33-fold out, and 0.026 /h implies an absorption half-life of 27 hours against an observed Tmax of 5.3-6.0 h (PMID:6891599). Verbatim but internally inconsistent, so it is not shipped. V 100 L and F 0.95 dropped as unstated; the only bioavailability figure in any species is approximately 100% in RAT.',
    summary: 'zonisamide — half-life re-cited; the verbatim ka removed as internally inconsistent (CL 33x out)' },

  { slug: 'lorazepam', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.998, source_pmid: 'PMID:6121043' }, IV: { V_L: 91, F: 1, source_pmid: 'PMID:6121043' }, SL: { F: 0.941, source_pmid: 'PMID:6121043' } },
    hl: { PO: 12.9, IV: 12.9, SL: 12.9 }, refs: ['PMID:6121043'],
    note: 'PK: the whole record moves to Greenblatt 1982 (PMID:6121043), 10 healthy volunteers given 2 mg by five routes including intravenous — verbatim "elimination half-life (t 1/2 beta), 12.9 (+/- 0.8) hr", "volume of distribution, 1.3 (+/- 0.07) liters/kg" (91 L at 70 kg) and "Absolute systemic availability for trials B, C, D, and E averaged 95.9, 99.8, 94.1, and 98.2%". THE PREVIOUS IV CITATION GAVE NO INTRAVENOUS LORAZEPAM AT ALL — its only intravenous agent was ANTIPYRINE, a metabolic probe. The sublingual figure is narrowed to 0.941, an ordinary tablet held sublingually; 0.982 describes a specially formulated sublingual tablet. ka values dropped on both extravascular routes: 1.5 /h traces to a different drug 1.5-HOUR absorption half-life, and the paper own sublingual absorption half-life of 28.7 min gives 1.45 /h, not the stored 1.59.',
    summary: 'lorazepam — IV row cited a study whose only IV agent was antipyrine; whole record re-sourced' },

  { slug: 'sulfamethoxazole', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 28, F: 0.991, source_pmid: 'PMID:7695325' }, IV: { V_L: 28, F: 1, source_pmid: 'PMID:7695325' } },
    hl: { PO: 14.3, IV: 14.3 }, refs: ['PMID:7695325'],
    note: 'PK re-sourced to Chin 1995 (PMID:7695325), adult patients dosed intravenously then orally, sulfamethoxazole reported separately — verbatim "volume of distribution, ... 0.5 +/- 0.3 versus 0.4 +/- 0.1 liters/kg", "half-life, ... 15.5 +/- 9.5 versus 14.3 +/- 4.7 h" and "bioavailability was ... 86.2% +/- 17.9% versus 99.1% +/- 20.5% for sulfamethoxazole"; the non-critically-ill arm is stored. The previous citation described four children with biliary atresia and NO intravenous dosing though the IV row cited it. Two likely origins worth recording: the stored V of 14 L matches that paper sulfamethoxazole CLEARANCE of 13.7 mL/kg/h, and the stored F of 0.95 matches TRIMETHOPRIM fraction absorbed of 0.955 in a different paper.',
    summary: 'sulfamethoxazole — re-sourced; stored V traced to a clearance and stored F to the other drug' },

  { slug: 'amitriptyline', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 987, source_pmid: 'PMID:6825390' } }, hl: { PO: 16.2 },
    refs: ['PMID:6825390'],
    note: 'PK re-sourced to Schulz 1983 (PMID:6825390), 7 young and 5 elderly healthy men given a parenteral or oral dose — verbatim "Mean t 1/2 was longer in the older (21.7 +/- 2.9 hr) than in the younger group (16.2 +/- 6.1 hr) as a result of an increase in the volume of distribution (17.1 +/- 2.4 and 14.1 +/- 2.0 l/kg)". The young-adult figures are stored: 16.2 h and 14.1 L/kg (987 L at 70 kg). Because that study has a parenteral arm the volume is ABSOLUTE, not apparent. The stored 21 h silently encoded the ELDERLY value as the general one, and the stored 1100 L fell between the two groups without matching either. ka 1.5 /h and F 0.5 dropped: the previous citation states neither, and its numbers (17, 61.5, 18.8, 30.6) are clearances in L/h, a digit-collision trap.',
    summary: 'amitriptyline — re-sourced; stored half-life was the elderly value, stored V matched neither group' },

  { slug: 'midazolam', guard: (c) => c.pk?.PO?.V_L === 114,
    pk: { IV: { V_L: 50.2, F: 1, source_pmid: 'PMID:6138080' }, PO: { V_L: 50.2, F: 0.44, source_pmid: 'PMID:6138080' }, IN: { F: 0.75, source_pmid: 'PMID:27780297' } },
    hl: { IV: 2.3, PO: 2.3, IN: 2.3 },
    note: 'PK: Heizmann 1983 (PMID:6138080), 6 volunteers, verbatim "elimination half-life, 2.3 h" and "apparent volume of distribution at steady-state (VSS), 50.2" — the record had the two routes half-lives BACKWARDS, storing 2.5 h on the intravenous row. THE ORAL VOLUME OF 114 L WAS A BACK-CALCULATION: 50.2 divided by 0.44, its own intravenous volume divided by its own bioavailability. Storing both then divided the dose by F twice and understated oral exposure by exactly 1/F, about 2.3-fold. The absolute volume is now carried on both routes so the bioavailability applies once. The intranasal bioavailability of 0.75 is verbatim but specific to a concentrated formulation; a conventional spray measures 50% with an absorption rate of 2.46 /h and a half-life of 3.1 h in one study, which is not blended here. ka values dropped throughout as unstated.',
    summary: 'midazolam — oral V was IV-V divided by F, double-counting absorption; routes half-lives were swapped' },

  { slug: 'indomethacin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:22913908' }, PR: { F: 0.8, source_pmid: 'PMID:4090993' } },
    hl: { PO: 4.5, PR: 4.5 }, refs: ['PMID:1100305'],
    note: 'PK: the rectal bioavailability of 0.8 is verbatim, "The bioavailability after the two rectal forms was found to be almost the same, about 80%" (PMID:4090993, 8 volunteers) — though it pools a rectal solution with suppositories whose times to peak differ threefold, and another human study reports complete rectal availability instead. THE INTRAVENOUS ROUTE WAS REMOVED: its cited study is oral-only. V 21 L dropped as worse than unsourced — at 0.30 L/kg it sits BELOW the observed human range of 0.34 to 1.57 L/kg (PMID:1100305). The oral F of 0.98 and both absorption rates are dropped as unstated; the cited abstract only numbers are times to peak of 1.11, 1.25 and 1.97 hours, the classic collision.',
    summary: 'indomethacin — IV route removed (oral-only citation); V was below the observed human range' },

  { slug: 'olanzapine', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:10511917' }, IM: { F: 1, source_pmid: 'PMID:24815672' } },
    hl: { PO: 33, IM: 720 }, refs: ['PMID:10511917'],
    note: 'PK: THE INTRAMUSCULAR ROW IS A DEPOT AND CARRIED THE ORAL HALF-LIFE. Its own citation says the depot half-life is "~30 days, controlled by the slow rate of intramuscular absorption rather than the 30-h elimination rate-based half-life of oral olanzapine" — so the stored 33 h was about 24-fold wrong and inverted the paper point. It is corrected to 720 h. The oral half-life of 33 h is now cited to Callaghan 1999 (PMID:10511917), verbatim "Its mean half-life in healthy individuals was 33 hours", flagged as a review rather than a primary; the previous citation was a metabolic phenotyping study stating none of the four values. V 1000 L dropped: it is shared verbatim with four unrelated drugs and fails the paper own arithmetic, since a clearance of 26 L/h with a 33 h half-life implies about 1238 L.',
    summary: 'olanzapine — IM depot half-life 33 h -> 720 h (~24x); V 1000 L was shared with four other drugs' },

  { slug: 'lidocaine', guard: (c) => c.pk?.IV?.V_L === 200,
    pk: { IV: { F: 1, source_pmid: 'PMID:6196560' }, IM: { F: 1, source_pmid: 'PMID:7439378' }, IN: { F: 0.26, source_pmid: 'PMID:2611092' } },
    hl: { IV: 1.66, IM: 1.68, IN: 1.68 }, refs: ['PMID:3954094'],
    note: 'PK: the intranasal bioavailability of 0.26 is verbatim and is the best-sourced value on this record, "the mean bioavailability of the intranasal formulation (AUC ratio) was 0.26 +/- 0.08" — though it ranged from 0.05 to 0.48 between individuals and describes one gel formulation. The intramuscular half-life is corrected to 1.68 h ("101 min"), its own paper figure; the stored 1.66 h had been imported from the intravenous paper. V 200 L dropped from all three rows: it appears in none of the three cited abstracts and is shared with unrelated drugs. CAVEATS: the intravenous 1.66 h is the fastest of four subgroups in a paper whose thesis is that they differ, the others being 2.07 to 2.70 h; and lidocaine disposition is genuinely TWO-compartment with a distribution half-life near 3.6 min (PMID:3954094), so a one-compartment curve over-predicts early concentrations.',
    summary: 'lidocaine — shared V 200 L dropped from three rows; IM half-life had been imported from the IV paper' },

  { slug: 'minocycline', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 183.3, F: 1, source_pmid: 'PMID:40132622' }, IV: { F: 1, source_pmid: 'PMID:782466' } },
    hl: { PO: 15.7, IV: 15.7 }, refs: ['PMID:40132622', 'PMID:782466'],
    note: 'PK: all five stored values were unsupported and the ORAL row hung on an INTRAVENOUS-ONLY study. Re-sourced: the oral row to Athanassa 2025 (PMID:40132622), 24 critically ill adults on oral minocycline, verbatim "183.3 L, 6.55 L/h and 1.66 h-1, for the apparent volume of distribution (V/F), the apparent clearance (CL/F) and the absorption rate constant" — F is pinned to 1 because that volume is apparent; and the half-life to Simon 1976 (PMID:782466), verbatim "Half-life was calculated as 15.7 h" after a 200 mg intravenous infusion. The stored 15.5 h is stated nowhere. No human absolute bioavailability for minocycline exists in any abstract, so the stored 0.95 is dropped rather than replaced.',
    summary: 'minocycline — all five values unsupported and the oral row cited an IV-only study; re-sourced' },

  { slug: 'phenobarbital', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 42, F: 0.949, source_pmid: 'PMID:7068937' }, IV: { V_L: 42, F: 1, source_pmid: 'PMID:7068937' }, IM: { source_pmid: 'PMID:624773' } },
    hl: { PO: 122, IV: 139, IM: 90 }, refs: ['PMID:624773'],
    note: 'PK: the stored 96 h on all three routes is stated by NEITHER cited paper and is not a neonatal figure either — the adult values are 139 h intravenously and 122 h orally (PMID:7068937, verbatim "the mean elimination half-life was 5.8 days" and "averaged 5.1 days for the oral dose") and about 90 h intramuscularly (PMID:624773). Each route now carries its own. V 42 L is retained: it is 0.60 L/kg scaled to 70 kg and, being measured after intravenous dosing, is a TRUE volume that pairs safely with a bioavailability. F 0.949 is verbatim ("94.9 per cent"). The intramuscular F of 0.76 was a CROSS-PAPER PRODUCT, 0.80 relative to oral multiplied by 0.949 absolute, and is dropped. Both absorption rates dropped as unstated.',
    summary: 'phenobarbital — one half-life of 96 h (stated nowhere) split into the three real route values' },

  { slug: 'ivermectin', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:8839664' } }, hl: { PO: 35 },
    refs: ['PMID:30566757'],
    note: 'PK: the half-life of 35.0 h is verbatim and stands (PMID:8839664, 25 onchocerciasis patients, single oral 150 micrograms/kg), though the paper does not state whether dosing was fasted or fed, which matters because food raises ivermectin exposure substantially. F 0.5 is dropped as UNSOURCEABLE rather than merely unsourced: there is no human intravenous ivermectin formulation, so an absolute bioavailability cannot exist. V 200 L is dropped as a value shared with unrelated drugs; the real human volumes are apparent and two-compartment, 89 L central and 234 L peripheral (PMID:30566757). ka 0.5 /h dropped, the source model using transit absorption with no single rate constant.',
    summary: 'ivermectin — half-life confirmed; F dropped as unsourceable (no human IV formulation exists)' },

  { slug: 'perampanel', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 64.35, F: 1, source_pmid: 'PMID:39902756' } }, hl: { PO: 109 },
    refs: ['PMID:36746851', 'PMID:35596529', 'PMID:39902756'],
    note: 'PK: half-life re-cited and corrected 105 -> 109 h. The stored 105 h was verbatim but sat in the OBJECTIVES of its paper as borrowed background ("In vitro studies and Phase I trials indicate"), not as that study measurement; Jing 2023 (PMID:36746851) measures it, verbatim "mean t1/2, 109 h" at steady state. V 77 L is the approval-document figure and appears in no abstract; replaced by 64.35 L from a population fit (PMID:39902756) with F pinned to 1, since that volume is apparent. Bioavailability near unity is supported by an oral-to-intravenous exposure ratio of "1.03 (0.97-1.09)" (PMID:35596529). ka 1.0 /h dropped as unstated.',
    summary: 'perampanel — half-life was borrowed background in its own citation; V was a label figure' },

  { slug: 'methocarbamol', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:2253675' } }, hl: { PO: 1.14 },
    refs: ['PMID:2253675'],
    note: 'PK: all four stored values were unsupported and the INTRAVENOUS ROW hung on an oral-only bioequivalence study, which is why that route is removed. Half-life re-sourced to Sica 1990 (PMID:2253675), 17 healthy male volunteers on 1.5 g orally, verbatim "The harmonic mean elimination half-life was similar between the two groups, 1.24 and 1.14 h" — the healthy-volunteer figure is stored. The previous citation reports only areas under the curve and peak concentrations; a bioequivalence study cannot yield an absolute bioavailability in any case. No human volume and no absolute bioavailability exist for methocarbamol in any abstract found.',
    summary: 'methocarbamol — IV route removed (oral-only citation); half-life re-sourced, all else dropped' },

  { slug: 'dichloroacetate', guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 31, F: 1, source_pmid: 'PMID:8824690' }, IV: { V_L: 31, F: 1, source_pmid: 'PMID:8824690' } },
    hl: { PO: 3.4, IV: 3.4 }, refs: ['PMID:8824690', 'PMID:1878534'],
    note: 'PK re-sourced to Krishna 1996 (PMID:8824690), 11 adults, verbatim "V = 0.44(0.2) 1 kg-1" (31 L at 70 kg) and "t1/2 = 3.4(2.2) h" — one paper for both. The previous citation states none of the four values; its only bioavailability figure is a range, "ranging from 27 to 100%", of which the stored F of 1 was the upper end. THE CRITICAL CAVEAT: dichloroacetate INHIBITS ITS OWN METABOLISM, so no single half-life is defensible — the first dose gives 1.58 h, later doses 3.64 h and then 9.9 h, with washout taking from one week to over three months (PMID:1878534). This record models a single dose only and will understate exposure on any repeated-dosing simulation. ka 2.5 /h dropped as unstated.',
    summary: 'dichloroacetate — re-sourced to one fit; self-inhibition caveat recorded (t½ 1.58 -> 9.9 h on repeat)' },
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
  if (f.refs) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary + (dropped.length ? ` [route(s) removed: ${dropped.join(', ')}]` : ''));
}

/** Records where nothing survives. */
const UNAUTHORED: Record<string, [string, string, string[]]> = {
  phenelzine: ['uncharacterized',
    'Nothing is citable. Its only reference (PMID:4066998) is a metabolite-identification study which, despite "pharmacokinetics" in its title, states no disposition parameter at all. All four stored values rested on it and the record had no other reference. No PubMed abstract states a phenelzine half-life, absorption rate, volume or bioavailability. As an irreversible MAO inhibitor its effect duration is set by enzyme resynthesis, not by a plasma curve.',
    ['PMID:4066998']],
  tranylcypromine: ['uncharacterized',
    'All four stored values are absent from the cited abstract. The best source gives only a RANGE, 1.54 to 3.15 h, and reports absorption was biphasic in seven of nine subjects, so a single first-order absorption rate is refuted rather than merely uncited. As an irreversible MAO inhibitor its pharmacodynamic half-life is 1.3 days fast and 14.2 days slow (PMID:7106165) against a ~2 h plasma curve.',
    ['PMID:3757407', 'PMID:7106165']],
  nitazoxanide: ['uncharacterized',
    'All four stored values are absent from the cited abstract, a bioanalytical assay paper. The parent is not measurable in plasma at all — the only measurable species is the metabolite tizoxanide (PMID:8864798) — so any value could only describe that metabolite, and that paper gives 1.03 to 1.6 h, not 1.5. No IV arm has ever existed, so the volume is unidentifiable and absolute bioavailability not estimable.',
    ['PMID:8864798']],
  clopidogrel: ['uncharacterized',
    'All four stored values are absent from the cited abstract, which reports only peak concentration, exposure and apparent clearance. The parent is an inactive prodrug: the antiplatelet effect comes from a thiol metabolite and is irreversible, so duration is set by PLATELET TURNOVER, not by a plasma half-life. A parent curve cannot represent the drug at any parameter values.',
    ['PMID:23016453', 'PMID:19948947']],
  rufinamide: ['uncharacterized',
    'All four stored values are absent from the cited abstract, a single-dose all-fed bioequivalence study that cannot show the dose-limited absorption or food effect the record credited it with. The stored 8 h is the midpoint of a review 6-10 h range and the 0.85 the upper bound of a review 70-85% range; the absorption rate and volume have no source at all.',
    ['PMID:26294172']],
  inclisiran: ['uncharacterized',
    'All three stored values are absent from the cited abstract, the landmark efficacy trial, which reports only cholesterol reductions and adverse events. A plasma model is meaningless here regardless: this is a GalNAc-conjugated siRNA taken into hepatocytes, undetectable in plasma 48 hours after dosing (PMID:31630870) while its effect lasts six months. Measured plasma half-lives are 6.5-7.6 h, not 9.',
    ['PMID:37164838', 'PMID:31630870']],
  'insulin-glargine': ['uncharacterized',
    'All four stored values are absent from the cited abstract, whose conclusion refutes the model shape: glargine precipitates at the injection site and needs a two-compartment dissolution-then-absorption cascade, so its duration is absorption-limited and the stored 18 h is not a disposition half-life. The paper also separates U100 from U300, which the record collapses into one row.',
    ['PMID:26086190']],
  'diphenoxylate-atropine': ['mixture',
    'A two-molecule combination stored as one record, and the missing molecular weight is the schema correctly refusing to name one. Three kinetically distinct species are involved: diphenoxylate, its active metabolite difenoxin, and atropine. The stored half-life is verbatim but is DIFENOXIN\'s, and the stored absorption rate was derived from a metabolite FORMATION half-life, which is not an absorption rate.',
    ['PMID:3682841']],
  triptorelin: ['uncharacterized',
    'All four stored values are unsupported. The citation is a review of the six-month depot reporting only testosterone pharmacodynamics and no PK parameter. The stored 4 h describes immediate-release triptorelin, not a depot; the genuine human figure is 2.8 h after IV dosing (PMID:9354307). A depot is release-limited and no abstract quantifies that.',
    ['PMID:9354307']],
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
