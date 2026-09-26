/**
 * 2026-09-06-mineral-pk-audit.ts
 *
 * Finishes the mineral sweep that 2026-09-06-pk-resourcing.ts started. That
 * script marked calcium, calcium-carbonate, zinc and zinc-picolinate as
 * homeostatic after finding their PK quartets unsupported; the new
 * `pk.template-quartet` lint then showed the same shape on ten more mineral
 * salt records, and the earlier pass had left the zinc family half-treated —
 * two records marked homeostatic beside three still drawing curves off the
 * same template.
 *
 * Four verification agents fetched every cited abstract plus the surrounding
 * literature through NCBI E-utilities. Full dead-end trails in AUTHORING_GAPS.
 *
 * ── Magnesium (5 records) ─────────────────────────────────────────────────
 * All five traced to two papers, and neither is a PK study.
 *   • PMID:11550076 (Ranade 2001), cited by magnesium PO+IV, magnesium-citrate,
 *     magnesium-malate and magnesium-taurate, is a narrative REVIEW whose
 *     abstract contains no numeral at all: "This review examines the
 *     bioavailability and pharmacokinetics of various magnesium salts and
 *     correlates pharmacodynamic action with the structure-activity
 *     relationship." It supports none of the stored values and cannot be
 *     repaired by reading it more closely.
 *   • PMID:7815675 (Schuette 1994), cited by magnesium-glycinate, is a stable-
 *     isotope absorption study in "12 patients who had ileal resections" — a
 *     malabsorption cohort — silent on ka, V and t½, and it CONTRADICTS the
 *     stored F 0.4: "26Mg absorption was low but was not different for the two
 *     supplements (23.5% vs 22.8% for magnesium chelate and MgO)".
 * The stored V 1050 L is independently impossible: every human magnesium volume
 * in the literature falls between 13.65 and 49 L (0.25–0.44 L/kg), so 1050 L is
 * 20–75× the entire published range for an extracellular divalent cation.
 *
 * Modelling verdict: a Bateman curve has no referent here. Swetha 2026
 * (PMID:42091979), a purpose-built healthy-volunteer oral study, declined to
 * report a half-life at all — "Parameters dependent on terminal elimination
 * (t1/2, AUC0-∞, CL/F, MRT) were not estimated because a clear terminal
 * log-linear phase was not identifiable" — and found exposure non-dose-
 * proportional, violating the linearity the model assumes. Sabatier 2003
 * (PMID:12775558), the one human oral+IV tracer study, needed a multi-pool
 * exchange model in which only ~25% of body Mg exchanges rapidly with plasma.
 * Genuine one-compartment magnesium PK does exist, but only for parenteral
 * MgSO4 at gram doses that transiently overwhelm homeostasis (preeclampsia,
 * cardiac surgery) — a different exposure from a 300 mg supplement, logged in
 * the backlog as a separate-record candidate rather than grafted on here.
 *
 * ── Zinc salts (3 records) ────────────────────────────────────────────────
 * Same verdict as zinc and zinc-picolinate, which this completes.
 *   • PMID:8577018 (Henderson 1995), cited by zinc-acetate, is a gastric-pH
 *     crossover with no IV arm; it reports only plasma AUCs, so F is not
 *     derivable even in principle, and states no ka, V or t½.
 *   • PMID:24259556 (Wegmüller 2014), cited by BOTH citrate and gluconate with
 *     identical numbers, is a stable-isotope study reporting fractional
 *     ABSORPTION: citrate "61.3% (56.6-71.0)" and gluconate "60.9% (50.6-71.7)".
 *     The stored 0.61 is citrate's figure copied onto gluconate, whose own
 *     number the same abstract gives.
 * Fractional absorption is a gut quantity measured by tracer over days; F is a
 * dose-normalised AUC ratio against IV. Zinc has no meaningful zero plasma
 * baseline — measured plasma zinc is overwhelmingly the endogenous pool — so an
 * AUC-derived F is not identifiable. Reading 61.3% as F 0.61 is a category
 * error, not a rounding one. The accepted structural model is 14 compartments
 * (Miller 2000, PMID:11049849); plasma turns over 5.3 times per hour (Pinna
 * 2001, PMID:11533268), which no 4 h half-life can represent.
 *
 * ── Boron (1 record) ──────────────────────────────────────────────────────
 * The exception that keeps its curve. Boron elimination is genuinely first-order
 * and renal, so only the provenance and three of four parameters were wrong.
 * See the inline note below.
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

/** slug → [pk_unauthored.note (<=500 chars), extra refs to keep the evidence reachable] */
const HOMEOSTATIC: Record<string, [string, string[]]> = {
  magnesium: [
    'Plasma magnesium is held by coordinated gut absorption, bone exchange and renal reabsorption. Its cited PMID:11550076 is a narrative review whose abstract states no number, and the stored V 1050 L was 20-75x above every human measurement (13.65-49 L). A purpose-built oral study could not even fit a half-life: "a clear terminal log-linear phase was not identifiable" (PMID:42091979), with non-dose-proportional exposure. Fractional absorption is 13-60%, set by meal and load, not by the salt.',
    ['PMID:42091979', 'PMID:12775558', 'PMID:25287933'],
  ],
  'magnesium-citrate': [
    'Magnesium is homeostatically regulated (see magnesium). This record stored the same four numbers as the parent under the same review citation (PMID:11550076), which states none of them. What its own reference does support is comparative and unitless: Mg citrate "shows superior bioavailability after 60 days of treatment when compared with other treatments studied" (PMID:14596323, 46 adults, 300 mg/day) — a relative ranking with no V, half-life, ka or F attached.',
    ['PMID:14596323'],
  ],
  'magnesium-malate': [
    'Magnesium is homeostatically regulated (see magnesium). The stored ka 0.6 / F 0.4 / V 1050 L / half-life 12 h were copied from the parent record and cite the same narrative review (PMID:11550076), whose abstract contains no numeral. No malate-specific human magnesium PK exists.',
    [],
  ],
  'magnesium-taurate': [
    'Magnesium is homeostatically regulated (see magnesium). The stored ka 0.6 / F 0.4 / V 1050 L / half-life 12 h were copied from the parent record and cite the same narrative review (PMID:11550076), whose abstract contains no numeral. No taurate-specific human magnesium PK exists.',
    [],
  ],
  'magnesium-glycinate': [
    'Magnesium is homeostatically regulated (see magnesium). PMID:7815675 is silent on ka, V and half-life, and contradicts the stored F 0.4: "26Mg absorption was low but was not different for the two supplements (23.5% vs 22.8% for magnesium chelate and MgO, respectively)" — and in 12 ILEAL-RESECTION patients, a malabsorption cohort that cannot source a general-population value. Its usable findings are the glycinate-vs-oxide comparison and an earlier peak (mean difference 3.2 h).',
    [],
  ],
  'zinc-acetate': [
    'Zinc is homeostatically regulated (see zinc). PMID:8577018 states none of the stored ka 0.7 / V 200 L / F 0.5 / half-life 4 h: it is a gastric-pH crossover in 10 volunteers reporting only plasma AUCs, and with no IV arm F is not derivable from it in principle. Its real finding is formulation-relative — zinc acetate at low gastric pH gives the highest plasma AUC and zinc oxide at high pH the lowest, so oxide suits acid-suppressed patients poorly.',
    [],
  ],
  'zinc-citrate': [
    'Zinc is homeostatically regulated (see zinc). PMID:24259556 reports fractional ABSORPTION by stable-isotope tracer — "zinc citrate was 61.3% (56.6-71.0)" — which is a gut quantity, not bioavailability F: F needs a dose-normalised AUC ratio against IV, and zinc has no meaningful zero plasma baseline to measure one against. The stored ka, V and half-life appear nowhere in it.',
    [],
  ],
  'zinc-gluconate': [
    'Zinc is homeostatically regulated (see zinc). This record carried zinc-citrate\'s numbers verbatim under the shared citation PMID:24259556, which in fact gives gluconate its own figure: fractional absorption "60.9% (50.6-71.7)" vs citrate\'s 61.3%, a difference the paper calls null. That is fractional absorption, not F, and the stored ka, V and half-life appear nowhere in the abstract.',
    [],
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
  if (c.effect_compartment?.approximated && !(c.receptor_occupancy?.length)) {
    delete c.effect_compartment;
    log.push(`${slug} — approximated keo dropped (no PK left to drive it)`);
  }
  log.push(`${slug} — pk stripped, marked homeostatic`);
}

// ── boron: keep the curve, re-cite the half-life, drop the invented rest ───
// Boron is NOT calcium, magnesium or zinc. A bolus traces genuine first-order
// renal elimination: Jansen 1984 (PMID:6732506) followed 8 volunteers after a
// 562-611 mg boric acid IV infusion and reports verbatim "t1/2 beta 21.0 +/-
// 4.9 h" with "The 120 h urinary excretion was 98.7 +/- 9.1% of dose", and
// Schou 1984 (PMID:6595986) confirms the figure by mouth in 7 men. The record
// keeps its curve; only the provenance and three parameters were wrong. The
// cited PMID:10050928 is Murray's comparative REVIEW — it does carry the
// half-life ("approx 21 h") but no volume, no bioavailability figure and no
// absorption rate, so it is demoted to support behind the primary. ka 1.5 and
// V 40 L appear in no human boron abstract: Jansen fits a THREE-compartment
// model with volumes in L/kg (0.251, 0.456, 0.340), so a single 40 L restates
// it rather than quoting it. F 1 rests on the review's qualitative "readily and
// completely absorbed"; the quotable number is a 93.9% mean urinary recovery
// (PMID:6537937), which is recovery, not bioavailability. All three fall
// through to resolvePk's declared defaults (ka 1.0, V 0.5 L/kg, F 0.9).
{
  const c = need('boron');
  if (c.pk?.PO && c.pk.PO.ka_hr != null) {
    c.pk.PO = { source_pmid: 'PMID:6732506' };
    c.half_life_hr = { ...c.half_life_hr, PO: 21 };
    addRefs(c, 'PMID:6732506', 'PMID:6595986', 'PMID:6537937', 'PMID:9062533');
    appendNote(c, 'PK: Jansen 1984 (PMID:6732506), 8 volunteers, 562-611 mg boric acid IV, verbatim "t1/2 beta 21.0 +/- 4.9 h" with 98.7% urinary recovery; Schou 1984 (PMID:6595986) confirms 21 h orally in 7 men. ka, V and F were dropped 2026-09-06 as unsourced - that paper fits a three-compartment model with volumes in L/kg, so the stored single V 40 L restated it rather than quoting it, and oral absorption is quotable only as a 93.9% urinary recovery (PMID:6537937), which is not F. CAVEAT: the 21 h curve describes a BOLUS. Chronic intake is homeostatically buffered - Hunt 1997 (PMID:9062533) verbatim "a 9.0-fold increase in dietary boron but yielded only a 1.5-fold increase in plasma boron concentrations" - so this model will over-predict the excursion from a 3-10 mg/day supplement. Boron-DRUG and neutron-capture literature (acoziborole, BPA/BSH at ~25 ppm blood boron, ~300x dietary levels) is a different exposure and must never be merged here.');
    log.push('boron.PO — half-life re-cited to the primary; ka/V/F dropped; homeostasis caveat added');
  } else log.push('boron.PO — already re-sourced, skipped');
}

// ── lithium: the one that keeps genuine PK, re-sourced to a single paper ──
// Lithium is a dosed drug with real therapeutic-monitoring literature, and the
// audit confirmed authentic values exist. Only the citation was wrong: the
// stored PMID:10890582 (Gai 2000) is a FOOD-EFFECT study of an in-house
// SUSTAINED-RELEASE matrix tablet whose abstract names half-life, Vd and
// fraction absorbed without quantifying any of them — "The results showed no
// differences in half-lifebeta, renal clearance, Vdbeta, AUC, tmax ..." — so it
// supports none of the four stored numbers.
//
// The replacement is Valecha 1990 (PMID:2079355): 60 manic-depressive patients,
// a single 900 mg dose, which is exactly this record's typical dose. It states
// verbatim "volume of distribution 0.62 +/- 0.26 l/kg ... serum half life 15.34
// +/- 6.06 h". One paper covers both parameters, so the route does not mix
// sources the way the defects this pass repaired did.
//
// ka and F are dropped rather than filled from a second paper. Both ARE
// supportable from PMID:365541 (Thornhill 1978) — absorption half-life 0.78 h
// for the ordinary form, giving ka 0.89 /h, and "the ordinary preparation was
// completely absorbed" — but that is a different study in a different
// population, and F's support is qualitative. They fall to resolvePk's declared
// defaults and the evidence is recorded in the note instead.
//
// The stored half-life 24 h matched nothing: single-dose figures run 15.34 h
// (PMID:2079355) and 26.8 h (PMID:365541), chronic-washout 28.9 h
// (PMID:657687). Single-dose is the right basis here because the solver
// superimposes individual intake events.
{
  const c = need('lithium');
  if (c.pk?.PO?.source_pmid === 'PMID:10890582') {
    c.pk.PO = { V_L: 43.4, source_pmid: 'PMID:2079355' };
    c.half_life_hr = { ...c.half_life_hr, PO: 15.34 };
    addRefs(c, 'PMID:2079355', 'PMID:9169962', 'PMID:657687', 'PMID:6380872');
    appendNote(c, 'PK: Valecha 1990 (PMID:2079355), 60 patients, single 900 mg lithium carbonate, verbatim "volume of distribution 0.62 +/- 0.26 l/kg" (x 70 kg = 43.4 L) and "serum half life 15.34 +/- 6.06 h". The previous citation (PMID:10890582) was a food-effect study of a sustained-release matrix that quantifies none of these. ka and F dropped 2026-09-06 to solver defaults: both are supportable from Thornhill 1978 (PMID:365541) — absorption t1/2 0.78 h for the ordinary form, so ka 0.89/h, and "the ordinary preparation was completely absorbed" — but that is a second study and the F claim is qualitative. CAVEATS: (1) half-life is basis-dependent, 15.34 h single-dose here vs 28.9 h after chronic dosing (PMID:657687), and this record stores the single-dose value because the solver superimposes intake events; (2) six of seven model-selection papers fit TWO compartments with a redistribution half-life around 4-5 h, so the first several hours of this one-compartment curve are approximate; (3) renal lithium clearance falls with sodium depletion, dehydration and reduced GFR (PMID:6380872), so a fixed-clearance curve understates toxicity risk in those states; (4) the alias Lithobid is a sustained-release product, for which absorption is ~85%, not complete.');
    log.push('lithium.PO — re-sourced to PMID:2079355; half-life 24->15.34 h, V 50->43.4 L, ka/F dropped');
  } else log.push('lithium.PO — already re-sourced, skipped');
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
