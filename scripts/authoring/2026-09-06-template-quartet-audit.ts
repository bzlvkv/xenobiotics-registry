/**
 * 2026-09-06-template-quartet-audit.ts
 *
 * Clears the seven `pk.template-quartet` groups the lint rule surfaced in
 * commit 9f59298 — 15 compounds that stored a byte-identical {ka, V, F} trio
 * under different citations. Seven verification agents read every cited
 * abstract plus the surrounding literature through NCBI E-utilities.
 *
 * THE RULE WAS RIGHT IN ALL SEVEN CASES. Across the 15 records, not one of the
 * shared trios is stated by any cited paper. Two mechanisms produced them:
 *   • pure defaults, with a real on-topic paper attached afterwards; and
 *   • digit collisions, where the cited abstract does contain the numeral but
 *     attached to a different quantity. quinapril's "1.4" is quinaprilat's
 *     median tmax in HOURS; rivaroxaban's "1.5" and "0.80" are a median tmax
 *     and a factor-Xa effect ratio; baclofen's "1.50" is a median tmax.
 *
 * The half-lives, which the rule treated as independently authored, turned out
 * to be the better-sourced field but not clean either: five were verbatim or
 * near-verbatim, and the rest were rounded (pyrazinamide 9.6 -> 10), midpointed
 * out of a stated range (fluconazole "31 to 37 hours" -> 34), averaged across
 * two study arms (rivaroxaban "10.6 vs 10.8" -> 10.7), or taken from the wrong
 * analyte entirely (carisoprodol 8 h is its METABOLITE meprobamate's figure,
 * ~4x the parent's).
 *
 * ── Where a volume is APPARENT (V/F), F is pinned to 1 ────────────────────
 * Several replacement volumes come from oral studies and are therefore V/F —
 * bioavailability is already inside them. Storing such a volume beside an
 * independent F divides the dose by F twice. Those records set F: 1 explicitly
 * and record the measured bioavailability in the note instead. This is a
 * modelling convention, not a claim that absorption is complete.
 *
 * ── Two records leave the Bateman model entirely ──────────────────────────
 * tryptophan and tyrosine join the homeostatic bucket. Their evidence is
 * direct rather than by analogy: Moller 1981 (PMID:6210561) reports that
 * tryptophan "disappeared linearly from 2 to 5 h and exponentially from 5 to
 * 8 h" — zero-order elimination across most of the observed window, so a
 * first-order half-life is a category error, not a missing citation. Plasma
 * pools of both amino acids swing with diet and time of day by more than a
 * supplemental dose moves them: 50 g of glucose alone drops branched-chain
 * amino acids 35-41% and tryptophan 23% (PMID:6750316). The physiologically
 * meaningful quantity is the ratio to competing large neutral amino acids at
 * the LAT1 transporter, which a single-compound curve cannot express.
 *
 * ── One route deleted ─────────────────────────────────────────────────────
 * rifampin's IV block cited a study that administered ORAL doses only, so its
 * volume, bioavailability and half-life were route-mismatched as well as
 * unsourced. The route is removed rather than left claiming an oral half-life.
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
  slug: string;
  routes?: string[];
  doses?: Record<string, unknown>;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  effect_compartment?: { approximated?: boolean; [k: string]: unknown };
  receptor_occupancy?: unknown[];
  refs?: string[];
  notes?: string;
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (slug: string) => { const c = by.get(slug); if (!c) throw new Error(`${slug} not in registry`); return c; };
const addRefs = (c: Compound, ...pmids: string[]) => { c.refs ??= []; for (const p of pmids) if (!c.refs.includes(p)) c.refs.push(p); };
const appendNote = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t)) c.notes = c.notes ? `${c.notes} ${t}` : t; };

/**
 * Records that keep a curve. Each entry replaces pk[route] wholesale, sets the
 * half-life, and appends the provenance note. `guard` makes the script
 * idempotent by naming a value that only the pre-audit record carries.
 */
interface Fix { slug: string; guard: (c: Compound) => boolean; pk: Record<string, Record<string, unknown>>; hl: Record<string, number>; refs: string[]; note: string; summary: string }

const FIXES: Fix[] = [
  {
    slug: 'liothyronine',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    // Nicoloff 1972 is an IV tracer study, so it sources the IV route properly
    // too — the previous citation was an oral-solution-vs-tablet bioequivalence
    // study with no IV arm at all.
    pk: { PO: { V_L: 38.4, source_pmid: 'PMID:4110897' }, IV: { V_L: 38.4, F: 1, source_pmid: 'PMID:4110897' } },
    hl: { PO: 24, IV: 24 },
    refs: ['PMID:4110897', 'PMID:24977379'],
    note: 'PK: Nicoloff 1972 (PMID:4110897), simultaneous T3/T4 tracer kinetics in 31 subjects, verbatim "The normal mean T(3) fractional turnover rate (kT(3)) was 0.68 (half-life = 1.0 days)" and "The mean T(3) distribution space in normal subjects was 38.4 liters" — the volume stored until 2026-09-06 was 28 L, which appears in no paper. The previous citation (PMID:17259789) is a relative-bioequivalence study of oral formulations that reports only Cmax, AUC and Tmax, and has NO IV arm despite having been cited for the IV route. ka and F dropped as unsourced; the observable is Tmax 2.5 h after 50 mcg oral (PMID:24977379). CAVEATS: distribution equilibration takes ~22 h against a 24 h half-life, so a one-compartment curve under-predicts the peak; and endogenous production is ~27.6 mcg/day, the same order as a 25-75 mcg dose, so in a euthyroid user this is a perturbation of an occupied pool under TSH feedback, not a curve rising from zero.',
    summary: 'liothyronine — V 28->38.4 L, half-life re-cited to an IV tracer study; ka/F dropped',
  },
  {
    slug: 'fluconazole',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 35, F: 1, source_pmid: 'PMID:7579091' }, IV: { V_L: 35, F: 1, source_pmid: 'PMID:7579091' } },
    hl: { PO: 36.7, IV: 36.7 },
    refs: ['PMID:7579091', 'PMID:1680653', 'PMID:7486928'],
    note: 'PK: the stored 34 h was a midpoint of the cited paper\'s printed range, "The half-life of fluconazole was 31 to 37 hours after oral and intravenous administration" (PMID:2379224) — a number that appears nowhere. Replaced by Berl 1995 (PMID:7579091), whose normal-renal-function group (n=10, CLcr 107 mL/min) gives a verbatim scalar: "the Day 10 mean half-lives were inversely related to mean CLcr (36.7 h in Group 1, 84.5 h in Group 2, and 101.9 h in Group 3)". V 35 L is Brammer 1991 (PMID:1680653) verbatim "apparent volume of distribution were 0.23 ml/min/kg and 0.5 liter/kg" scaled to 70 kg; no primary states any litre figure, and the previously stored 50 L traces to a REVIEW\'s 0.7 L/kg. F is pinned to 1 because that volume is apparent; the measured value supports it — absorption "approximated unity" (PMID:7486928) — and the stored 0.9 was in no paper. ka dropped: the only human value is 0.93 /h in HIV-positive patients (PMID:11829202), not the stored 2.5. CAVEAT: half-life is renal-function dependent, rising to 84.5 h and 101.9 h in the impaired groups of the same paper.',
    summary: 'fluconazole — half-life 34 (a midpoint) -> 36.7 h; V 50 -> 35 L; ka dropped',
  },
  {
    slug: 'pyrazinamide',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:2737233' } },
    hl: { PO: 9.6 },
    refs: ['PMID:16685561', 'PMID:12066959'],
    note: 'PK: half-life corrected 10 -> 9.6 h, the value its own citation actually prints — Lacroix 1989 (PMID:2737233), 9 healthy subjects, single oral 27 mg/kg, verbatim "an elimination phase of t1/2 beta = 9.6 h". ka, V and F dropped 2026-09-06: that abstract states none of them, and the stored 50 L was ~1.7x the real figure. Not adopted, and why: Wilkins 2006 (PMID:16685561) gives V/F 29.2 L but in 227 South African TB patients, and reports absorption as BIMODAL — "Absorption rate was threefold greater in fast absorbers (3.56 h(-1)) in comparison to slow absorbers (1.25 h(-1))" — which a single ka cannot represent. No human absolute bioavailability exists for pyrazinamide in any abstract; the one modern absolute-F trial dosed the other three TB drugs intravenously and pyrazinamide orally only (PMID:26661397). CAVEATS: half-life is shorter in TB patients (6.0 h, PMID:12066959) than in healthy subjects, and longer in cirrhosis (15.07 h). Acetylator status is NOT a covariate — that applies to isoniazid.',
    summary: 'pyrazinamide — half-life 10 -> 9.6 h (its own paper\'s figure); ka/V/F dropped',
  },
  {
    slug: 'carisoprodol',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { source_pmid: 'PMID:35160309' } },
    hl: { PO: 2 },
    refs: ['PMID:35160309', 'PMID:7974621', 'PMID:16021435'],
    note: 'PK: Calvo 2022 (PMID:35160309), 13 healthy volunteers, 350 mg PO, verbatim "half-life (T1/2): 2 +/- 0.8 h". The half-life stored until 2026-09-06 was 8 h — the METABOLITE\'s figure. The same paper gives meprobamate 9 +/- 1.9 h, and three further studies put the parent at 1.6-2.1 h (PMID:7974621 "99 +/- 46 min", PMID:16021435 96 min in extensive metabolisers, PMID:24683250 1.74/1.96 h), so the record overstated carisoprodol\'s persistence roughly fourfold. ka, V and F dropped as unsourced: the previous citation (PMID:27758843) is a model-fitting reanalysis whose abstract says human Vd "has not been reported" and gives only a range, "the Vd for carisoprodol ranged from 0.93 to 1.3 L/kg", left unstored rather than collapsed to a midpoint. No human absolute bioavailability exists. CAVEATS: meprobamate is itself active and accumulates on repeated dosing where the parent does not, so one curve cannot represent both; CYP2C19 poor metabolisers show ~4x parent exposure (PMID:8946470).',
    summary: 'carisoprodol — half-life 8 -> 2 h (8 h was the metabolite\'s); ka/V/F dropped',
  },
  {
    slug: 'quinapril',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 77, F: 1, source_pmid: 'PMID:18672641' } },
    hl: { PO: 1.2 },
    refs: ['PMID:8739020', 'PMID:2144994'],
    note: 'PK: Rojanasthien 2008 (PMID:18672641), 24 healthy volunteers, single 20 mg, verbatim "The half-life of quinapril (1.2 h)" and "the volume of distribution (Vd/F) of quinapril (1.1 L/kg)" (x 70 kg = 77 L). This record models the PARENT prodrug, matching its stored mw; the active species is quinaprilat (t1/2 1.8-1.9 h, Vd/F 0.3 L/kg in the same paper). F is pinned to 1 BECAUSE that volume is apparent (Vd/F) and already contains bioavailability; the measured absolute value is "approximately 50%" (Breslin 1996, PMID:8739020, IV quinaprilat vs oral quinapril), and applying it again would halve the true volume. ka dropped 2026-09-06: the stored 1.4 traces to quinaprilat\'s median tmax of "1.4 - 1.5 h" in the cited abstract, a time in hours, not a rate constant. Do NOT add a terminal accumulation phase — PMID:2144994 found "no accumulation between 2 and 7 days, even in severe renal impairment"; the 24 h duration of action is slow dissociation from tissue ACE, a PD effect with no matching plasma phase.',
    summary: 'quinapril — V 77 L kept as apparent with F pinned to 1; ka (a tmax) and F 0.6 dropped',
  },
  {
    slug: 'prednisone',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 39.5, source_pmid: 'PMID:15098802' } },
    hl: { PO: 3.32 },
    refs: ['PMID:15098802', 'PMID:39962604', 'PMID:7310640', 'PMID:3350994'],
    note: 'PK models PREDNISOLONE, the active species (prednisone is a prodrug). Carson 2004 (PMID:15098802), 14 healthy volunteers, IV 40 mg, verbatim "volume of distribution (39.5 +/- 12.4 ... L)" and "elimination half-life (3.32 +/- 0.83 ... hrs)" — one paper, one arm, so volume and half-life stay mutually consistent; Tauber 1984 (PMID:6698661) corroborates 3.1 h. All four values stored until 2026-09-06 were unsourced: the previous citation (PMID:39962604) is a real prednisone PK study but states no ka, volume or half-life, and its "approximately 80%" is bioavailability RELATIVE to oral prednisolone, not absolute F. No absolute F is stored because the quantity is ill-defined here — Ferry 1988 (PMID:3350994) found reversible prednisone/prednisolone interconversion gives ~70% against IV prednisone but exceeds 1 against IV prednisolone. CAVEAT: kinetics are dose-dependent through saturable transcortin binding, clearance rising from 111 to 194 mL/min/1.73m2 across 5-40 mg with volume rising alongside (Rose 1981, PMID:7310640), so this set describes the 40 mg range.',
    summary: 'prednisone — re-sourced to prednisolone (V 39.5 L, half-life 3.32 h); ka/F dropped',
  },
  {
    slug: 'rivaroxaban',
    guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { ka_hr: 1.24, V_L: 57.9, F: 1, source_pmid: 'PMID:22242932' } },
    hl: { PO: 6.19 },
    refs: ['PMID:22242932', 'PMID:16328318', 'PMID:23458226', 'PMID:23381840'],
    note: 'PK: Xu 2012 (PMID:22242932), oral ONE-COMPARTMENT population fit in 2290 acute-coronary-syndrome patients — the same structure the solver uses — verbatim "The estimated absorption rate, apparent clearance and volume of distribution were 1.24 h(-1) ..., 6.48 l h(-1) ... and 57.9 l". The half-life is that fit\'s own ln2 x V/CL = 6.19 h rather than a second paper\'s number, and it sits inside the independently measured "5.7-9.2 h at steady state" (PMID:16328318). F is pinned to 1 BECAUSE 57.9 L is apparent (V/F). The measured bioavailability is a conditional floor, not a constant: "high oral bioavailability (>= 80%)" holds up to 10 mg fasted or fed, but at 15-20 mg only WITH food, and fasted exposure at those doses is "less than dose proportional" (PMID:23458226). Values stored until 2026-09-06 were unsourced, and the 10.7 h half-life was the midpoint of "mean 10.6 vs 10.8 h", the two arms of PMID:32959922. CAVEAT: clearance falls with age, AUC "41% higher in elderly" (PMID:23381840), with terminal half-life 11-13 h in the elderly against 5-9 h in young adults. The warfarin review PMID:15911722 was removed from this record; it never mentions rivaroxaban.',
    summary: 'rivaroxaban — one coherent popPK fit; half-life 10.7 (an average) -> 6.19 h',
  },
  {
    slug: 'baclofen',
    guard: (c) => c.pk?.PO?.ka_hr === 1.5,
    pk: { PO: { ka_hr: 2.23, V_L: 44.5, F: 1, source_pmid: 'PMID:29091319' } },
    hl: { PO: 3.86 },
    refs: ['PMID:29091319', 'PMID:25028414', 'PMID:27867020', 'PMID:30826461'],
    note: 'PK: Chevillard 2018 (PMID:29091319), population fit in 143 adults on oral baclofen, verbatim "mean values for clearance (CL/F), volume of distribution (V/F) and absorption rate constant at 8.0 L/h, 44.5 L and 2.23 h-1". Half-life is that fit\'s own ln2 x V/CL = 3.86 h. Taking all three from one fit keeps them mutually consistent; F is pinned to 1 because V is apparent. None of the values stored until 2026-09-06 came from the cited paper: PMID:27879195 is a two-tablet bioequivalence study reporting only tmax, Cmax and AUClast, and its "1.50" is a median tmax in HOURS, not the stored ka. The record\'s other reference (PMID:23973998) is a synthetic-chemistry SAR paper with no human PK. Alternatives not adopted, to avoid mixing fits: absolute bioavailability 74% in 12 healthy adults against IV (PMID:25028414), and healthy single-dose half-lives of 5.24 h PO / 5.79 h IV (PMID:27867020). CAVEAT: baclofen is renally cleared and clearance scales with GFR as 13.5 x (GFR/103)^0.839 (PMID:30826461), so a fixed-clearance curve understates exposure in renal impairment.',
    summary: 'baclofen — one coherent popPK fit (ka 2.23, V 44.5 L, half-life 3.86 h)',
  },
  {
    slug: 'dexmethylphenidate',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.23, source_pmid: 'PMID:8430051' } },
    hl: { PO: 3.74 },
    refs: ['PMID:8430051', 'PMID:26729760', 'PMID:20861586'],
    note: 'PK: F 0.23 is Srinivas 1993 (PMID:8430051), 11 healthy adults with an IV reference arm, verbatim "After oral administration of dl-MPH, the absolute bioavailability (F) of d-MPH was 0.23 and that of l-MPH was 0.05"; it transfers to enantiopure d-MPH on Patrick 2016 (PMID:26729760), a head-to-head IR crossover whose d-MPH AUC ratio fell inside 0.80-1.25. That is a two-paper chain, flagged as such: no study reports an absolute F for enantiopure d-MPH against IV. Half-life 2.5 h was replaced by 3.74 h (PMID:20861586, "For IR MPH, the half-life was 3.74 hours", 30 healthy adults) because nothing supports 2.5 h for d-MPH — that figure traces to PEDIATRIC RACEMIC sources. ka and V dropped: no human abstract reports either, the stored 100 L appears nowhere, and a ka of 1.5 /h would put tmax near 1.5 h against the 2.0-2.2 h consistently observed. NOTE the enantiomer relationship justifies sharing ELIMINATION parameters with methylphenidate but not absorption: enantiopure d-MPH reaches the circulation faster, its 1-hour concentration being 56% higher than after the racemate (PMID:26729760).',
    summary: 'dexmethylphenidate — F 0.23 sourced, half-life 2.5 -> 3.74 h; ka/V dropped',
  },
  {
    slug: 'methylphenidate',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { F: 0.14, source_pmid: 'PMID:8430051' } },
    hl: { PO: 3.74 },
    refs: ['PMID:8430051', 'PMID:20861586', 'PMID:26729760'],
    note: 'PK: this record doses the RACEMATE in mg, so its F must be per mg of racemate, not per mg of the active enantiomer. Srinivas 1993 (PMID:8430051), 11 healthy adults with an IV arm, states both halves verbatim — "the absolute bioavailability (F) of d-MPH was 0.23 and that of l-MPH was 0.05" — and a 1:1 racemate therefore delivers (0.23 + 0.05)/2 = 0.14 of the dose as circulating methylphenidate. The stored 0.3 over-predicted systemic exposure roughly twofold. Half-life 3 h -> 3.74 h (PMID:20861586, "For IR MPH, the half-life was 3.74 hours", 30 healthy adults 18-68 y); the stored value came from a review\'s "2 to 3 hours" range. ka and V dropped as unsourced. The previous citation (PMID:25274428) is a fed, steady-state, extended-release bioequivalence study stating none of the four values. NOTE: the l-isomer is destroyed presystemically by CES1 and does not alter d-MPH disposition once absorbed, so elimination is shared with dexmethylphenidate while absorption is not.',
    summary: 'methylphenidate — F 0.3 -> 0.14 (per mg racemate), half-life 3 -> 3.74 h',
  },
  {
    slug: 'isosorbide-mononitrate',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    pk: { PO: { V_L: 48, F: 1, source_pmid: 'PMID:6478734' } },
    hl: { PO: 4.15 },
    refs: ['PMID:6478734', 'PMID:11037739'],
    note: 'PK: Straehl 1984 (PMID:6478734), healthy subjects given IV 5 mg and oral 10-20 mg, supplies three values from one study — verbatim "volume of distribution at steady state (Vd ss) was 48 l", "elimination t 1/2 was 4.15 hr" and "absolute systemic availability was 100%". Because that F is a true absolute measurement against IV, the 48 L is a true Vss and the two pair without double-counting. Corroborated independently at 48.5 L and 4.4 h (PMID:6666223). The values stored until 2026-09-06 were unsourced — the previous citation (PMID:15146932) prints no volume and no half-life value, and its "105 +/- 20%" is relative bioavailability. ka dropped, and it was not merely unsourced but contradicted: the same paper gives "absorption t 1/2 ranged from 2.5 to 5 min", i.e. 8.3-16.6 /h for the immediate-release tablet, roughly an order of magnitude faster than the stored 1.4 /h. Left unstored rather than collapsed to a midpoint. CAVEAT: nitrate tolerance develops on continuous dosing (PMID:11037739) but is PHARMACODYNAMIC — the kinetics are dose-linear and unchanged, so tolerance must never be encoded as an altered half-life or clearance.',
    summary: 'isosorbide-mononitrate — V 48 L, half-life 4.15 h, F 1 all from one study; ka dropped',
  },
  {
    slug: 'linezolid',
    guard: (c) => c.pk?.PO?.ka_hr != null,
    // The IV route moves to Welshman 2001, which actually ran an IV arm; the
    // previous citation was an oral-only renal-impairment study.
    pk: { PO: { ka_hr: 1.81, F: 1, source_pmid: 'PMID:12407127' }, IV: { F: 1, source_pmid: 'PMID:11745911' } },
    hl: { PO: 9.53, IV: 9.53 },
    refs: ['PMID:12407127', 'PMID:11745911', 'PMID:17639029', 'PMID:23926058'],
    note: 'PK: Burkhardt 2002 (PMID:12407127), 12 healthy volunteers on 600 mg twice daily, verbatim day-1 terminal half-life "9.53 +/- 2.87" h. F 1 is Welshman 2001 (PMID:11745911), a true absolute-bioavailability study, verbatim "the mean absolute bioavailability (F) of the tablet, using the IV sterile solution as the reference treatment, was 103% (+/-20%)" — stored as 1 rather than 1.03 since a fraction above unity is unphysical. ka 1.81 /h is Plock 2007 (PMID:17639029). None of the values stored until 2026-09-06 came from the cited paper: PMID:12936973 studies renal impairment, reports only clearances, and — decisively — has NO IV ARM despite having been cited for the whole IV block, which now points at the study that does. V dropped: the only human figures are sex-split, "41.6 +/- 4.2 versus 52.2 +/- 3.3 L/70 kg" (PMID:12407127), and collapsing them would be an average; the stored 45 L appears in no primary, only in a review. CAVEAT: exposure accumulates on repeated dosing while the half-life does not change — AUC rose from 140.5 to 220.2 mg.h/L between days 1 and 7 (PMID:12407127) through time-dependent inhibition of clearance (PMID:17639029) — so a fixed one-compartment curve under-predicts steady state.',
    summary: 'linezolid — half-life 9.53 h + ka 1.81 sourced; IV re-cited to a study with an IV arm',
  },
];

for (const fix of FIXES) {
  const c = need(fix.slug);
  if (!fix.guard(c)) { log.push(`${fix.slug} — already re-sourced, skipped`); continue; }
  c.pk = fix.pk;
  c.half_life_hr = fix.hl;
  if (fix.slug === 'rivaroxaban') c.refs = (c.refs ?? []).filter((r) => r !== 'PMID:15911722');
  addRefs(c, ...fix.refs);
  appendNote(c, fix.note);
  log.push(fix.summary);
}

// ── rifampin: keep the one supported value; delete the mis-routed IV block ──
// The half-life is the single stored number its citation carries, and it is
// tightly scoped: Pargal 2001 (PMID:11263520) gives "3.57 (34.85) h, at the
// 450 mg dose (tablet)" and 5.44 h at 600 mg in the same paper, calling the
// difference significant. ka, V and F are absent from it, and ka is worse than
// absent — the paper concludes rifampicin shows "zero order absorption", so a
// first-order constant is the wrong model for its own source. The IV route is
// removed outright: that study dosed orally only, so its volume, bioavailability
// and half-life could not describe an IV arm at any value.
{
  const c = need('rifampin');
  if (c.pk?.PO?.ka_hr != null) {
    c.pk = { PO: { source_pmid: 'PMID:11263520' } };
    c.half_life_hr = { PO: 3.57 };
    c.routes = (c.routes ?? []).filter((r) => r !== 'IV');
    if (c.doses && 'IV' in c.doses) delete c.doses.IV;
    addRefs(c, 'PMID:18391026', 'PMID:26661397', 'PMID:22252827');
    appendNote(c, 'PK: Pargal 2001 (PMID:11263520), 12 healthy volunteers, verbatim "3.57 (34.85) h, at the 450 mg dose (tablet)" — scoped to a single 450 mg oral tablet in treatment-naive subjects, since the same paper reports 5.44 h at 600 mg and calls the difference significant. ka, V and F dropped 2026-09-06: that abstract states none of them, and ka is contradicted in kind because the paper concludes rifampicin shows "zero order absorption". Not adopted, to avoid mixing populations: V 53.2 L and CL/F 19.2 L/h in 261 TB patients at induced steady state (PMID:18391026), and absolute bioavailability "87% and 71% for rifampicin" fasted and fed (PMID:26661397). The IV route was REMOVED — its whole block cited this oral-only study. CAVEATS: rifampicin autoinduces its own metabolism, clearance rising from 7.76 L/h at first dose by 1.82-1.85x at steady state with AUC falling 41-42% over ~40 days (PMID:22252827), so this single-dose half-life understates chronic clearance; and at high doses bioavailability falls while clearance saturates (PMID:28653479).');
    log.push('rifampin — kept the one supported value (half-life 3.57 h); ka/V/F dropped; IV route removed');
  } else log.push('rifampin — already re-sourced, skipped');
}

// ── tryptophan and tyrosine: out of the Bateman model entirely ─────────────
const HOMEOSTATIC: Record<string, [string, string[]]> = {
  tryptophan: [
    'Plasma tryptophan is a large regulated pool, not a dose-driven curve. Moller 1981 (PMID:6210561), the closest human PK study, reports it "disappeared linearly from 2 to 5 h and exponentially from 5 to 8 h" — zero-order across most of the window, so a first-order half-life is a category error rather than a missing citation. The cited PMID:6805013 is a tolerance study stating none of the stored values. Glucose alone moves the pool: 50 g dropped plasma tryptophan 23% (PMID:6750316).',
    ['PMID:6210561', 'PMID:6750316'],
  ],
  tyrosine: [
    'Plasma tyrosine is a large regulated pool, not a dose-driven curve. Its own cited paper (PMID:29168741) reports the plasma response is both dose- and age-dependent, which is incompatible with a fixed volume and bioavailability, and it states none of the four stored values. No human abstract reports a tyrosine ka, volume, bioavailability or half-life. The pool swings with diet and time of day (PMID:6538743), and the meaningful readout is the ratio to competing large neutral amino acids.',
    ['PMID:7190187', 'PMID:6538743'],
  ],
};
for (const [slug, [note, refs]] of Object.entries(HOMEOSTATIC)) {
  const c = need(slug);
  if (c.pk_unauthored) { log.push(`${slug} — already pk_unauthored, skipped`); continue; }
  if (note.length > 500) throw new Error(`${slug} note is ${note.length} chars, schema caps at 500`);
  delete c.pk;
  c.half_life_hr = {};
  c.pk_unauthored = { reason: 'homeostatic', note };
  addRefs(c, ...refs);
  if (slug === 'tryptophan') appendNote(c, 'The cited tolerance study (PMID:6805013) dosed 100 mg/kg, roughly 10x this record\'s range, and tryptophan elimination is demonstrably dose-saturable, so even a value extracted from it would not describe a supplemental dose. Brain uptake depends on the ratio to competing large neutral amino acids at the LAT1 transporter, which a single-compound curve cannot express.');
  if (slug === 'tyrosine') appendNote(c, 'Melamed 1980 (PMID:7190187) reports the supplemental effect as a ratio rather than a concentration — "the plasma tyrosine ratio increased from 0.13 to 0.21" — which is the quantity brain uptake actually depends on. Sampling in the cited dose-response study (PMID:29168741) stopped at 240 min, too short to support any terminal half-life.');
  log.push(`${slug} — pk stripped, marked homeostatic`);
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
