/**
 * 2026-09-08-pharmacological-batch11a.ts
 *
 * Batch 11, part A — the six records of the remaining 24 that I could decide
 * myself. The other eighteen are dumped and prompted but unaudited: all five
 * batch-11 agents died on an account rate limit, not on anything in the work.
 *
 * ── THE FINDING THAT ORGANISES THIS PART ──────────────────────────────────
 * DELETING AN UNSUPPORTED VALUE DOES NOT LEAVE THE RECORD SILENT. IT LEAVES IT
 * ASSERTING THE DEFAULT — F 0.9, V 0.5 L/kg (35 L), ka 1.0/h — which is itself
 * an unsourced number, is invisible on every surface, and for a low-availability
 * drug is FURTHER FROM THE TRUTH THAN THE FLAWED VALUE THAT WAS REMOVED.
 *
 * A 2026-09-06 pass dropped `ka`, `V` and `F` from a group of records whenever
 * the cited abstract did not state them. The diagnosis was right every time.
 * The remedy was not, and two of the worst errors in the whole audit are its
 * direct result:
 *
 *   raloxifene        Cmax renders ~2,900x over  — F 2% and V/F 2348 L/kg are
 *                     BOTH VERBATIM IN THE ABSTRACT THE RECORD ALREADY CITES
 *   dextromethorphan  Cmax renders ~100x over    — the removed values were dog
 *                     values (correctly diagnosed) but were ~70x CLOSER than
 *                     the defaults that replaced them
 *
 * This is the same shape as the fosinopril reversal in batch 10 and is why the
 * standing rule — never delete an F or a V_L for a low-bioavailability drug —
 * exists. The honest options are a DECLARED DERIVATION or `pk_unauthored`.
 * Deleting and saying nothing is not one of them.
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
  slug: string; pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>; pk_analyte?: string;
  pk_unauthored?: { reason: string; note?: string };
  refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

// ── Records whose missing parameters are recoverable ──────────────────────
const PATCH: { slug: string; route: string; set: Record<string, unknown>; guard: (c: Compound) => boolean; note: string; summary: string }[] = [
  { slug: 'raloxifene', route: 'PO', guard: (c) => c.pk?.PO?.V_L == null,
    set: { V_L: 164360, F: 1 },
    note: 'PK: THE WORST SINGLE ERROR FOUND IN THIS AUDIT, AND BOTH MISSING NUMBERS WERE VERBATIM IN THE ABSTRACT THE RECORD ALREADY CITED. With no volume and no bioavailability the solver substituted 35 L and 0.9 — for a drug the same sentence describes as having "absolute bioavailability is only 2%" — and the record was rendering a peak concentration roughly TWO THOUSAND NINE HUNDRED TIMES the real one. The citation states the pair outright: "Approximately 60% of a dose is absorbed; however, absolute bioavailability is only 2%. The volume of distribution is 2348 L/kg for a single oral dose of 30-150 mg, and the elimination half-life averages 32.5 hours." THE TWO NUMBERS MUST NOT BOTH BE STORED. That volume is an APPARENT one from oral dosing — it already contains the 2 percent — so pairing it with a stored bioavailability of 0.02 would divide by absorption twice and inflate exposure fifty-fold. The volume is stored at the seventy-kilogram reference with bioavailability pinned at unity, the same convention ethosuximide, levetiracetam and brompheniramine use. THE 60 PERCENT IS A CLASS-2 DONOR SITTING IN THE SAME SENTENCE and is deliberately not stored: it is FRACTIONAL ABSORPTION, not bioavailability, and the gap between them is this drug entire first-pass glucuronidation. The catalogue has no field for that distinction, which is a schema gap already logged.',
    summary: 'raloxifene — V/F 164,360 L + F 1 from its OWN citation; was rendering Cmax ~2,900x over' },

  { slug: 'dextromethorphan', route: 'PO', guard: (c) => c.pk?.PO?.V_L == null,
    set: { V_L: 3359, F: 1 },
    note: 'PK: AN EARLIER PASS DIAGNOSED THIS RECORD CORRECTLY AND THEN MADE IT SEVENTY TIMES WORSE. It found the stored bioavailability and volume to be DOG values and removed them as a species misattribution, which was right — and removing them did not silence the record, it made it assert the solver defaults instead, 0.9 and 35 L, for a drug whose own mechanism text says first-pass metabolism is so extensive that exposure differs a hundred and fifty fold between metaboliser phenotypes. The defaults put the rendered peak roughly a hundred times above reality; THE DOG VALUES, WRONG AS THEY WERE, HAD BEEN WITHIN A FACTOR OF TWO. THE REPLACEMENT COMES FROM THE RECORD OWN CITATION, which states the two numbers that fix it in one sentence each: "The apparent partial clearance of dextromethorphan to dextrorphan was 1.2 L/hr in poor metabolizers, 78.5 L/hr in extensive metabolizers given quinidine, and 970 L/hr in extensive metabolizers" and "2.4 hours in extensive metabolizers". The volume is those two combined and is therefore DERIVED, NOT VERBATIM — and it is a LOWER BOUND, because 970 is the clearance to ONE metabolite while the total must be at least that. For this drug the bound is tight: the route measured is the dominant one in extensive metabolisers. The record is authored at the extensive-metaboliser phenotype throughout, which its own prose already declares.',
    summary: 'dextromethorphan — V/F 3,359 L + F 1; the earlier deletion left it ~100x over' },
];
for (const p of PATCH) {
  const c = need(p.slug);
  if (!p.guard(c)) { log.push(`${p.slug} — already corrected, skipped`); continue; }
  const row = c.pk?.[p.route];
  if (!row) throw new Error(`${p.slug} has no pk.${p.route}`);
  Object.assign(row, p.set);
  note(c, p.note);
  log.push(p.summary);
}

// ── Records that cannot be authored under the verbatim rule ───────────────
const UNAUTHORED: { slug: string; reason: string; note: string; prose: string; summary: string }[] = [
  { slug: 'orlistat', reason: 'local-acting',
    note: 'Acts in the gut lumen; its own cited review concludes "systemic absorption of orlistat is negligible" and "almost the entire dose was recovered from fecal samples; little was found in plasma and urine", across 25 phase-1 studies including two mass-balance studies. That abstract states no half-life, no volume and no bioavailability figure.',
    prose: 'PK: STRIPPED. THE CITATION IS AN ARGUMENT THAT THIS RECORD SHOULD NOT EXIST. It screened twenty-five phase-1 studies plus two radiolabel mass-balance studies and concluded that "systemic absorption of orlistat is negligible", with "almost the entire dose ... recovered from fecal samples; little was found in plasma and urine" — and it states NO half-life, NO volume and NO bioavailability number, so both stored values were class 1. A plasma curve is the wrong object for a drug whose entire pharmacology is luminal lipase inhibition, and with no volume authored the solver was rendering one against an arbitrary thirty-five litres anyway.',
    summary: 'orlistat — STRIPPED to local-acting (its own citation says absorption is negligible)' },
  { slug: 'ostarine', reason: 'research-only',
    note: 'The cited drug-interaction study reports only PERCENTAGE CHANGES and fold-ratios (Cmax −23 %, AUC −43 % with rifampin), never an absolute half-life, volume or bioavailability. The only ADME study indexed is in RATS ("mean elimination half-life of 0.6 h and 16.4 h in male and female rats").',
    prose: 'PK: STRIPPED. THE CITED PAPER CONTAINS ONLY RELATIVE QUANTITIES — "reduced the maximal plasma concentration (Cmax) by 23 % and the area under the curve (AUC-infinity) by 43 %" and similar fold-changes for four other perpetrators — WHICH IS THE CLASS-2 TRAP IN ITS PUREST FORM: a percentage change is not a parameter, and no absolute half-life, volume or bioavailability appears anywhere in it. The stored half-life is also a round twenty-four hours, the shape a template value takes. Searching the indexed literature returns one disposition study and IT IS IN RATS — "moderate plasma clearance (117.7 and 74.5 mL/h/kg) and mean elimination half-life of 0.6 h and 16.4 h in male and female rats" — a difference of twenty-seven fold between the sexes of one species, which is itself a reason not to extrapolate. Same verdict as lgd-4033 and s23.',
    summary: 'ostarine — STRIPPED to research-only (its citation states only percentage changes)' },
  { slug: 'mk-677', reason: 'research-only',
    note: 'The cited paper is a BIOANALYTICAL METHOD development study (LC-MS/MS assay for MK-677 in human plasma), not a pharmacokinetic one, and states no half-life. No indexed abstract gives a human MK-677 half-life, volume or bioavailability; the hits are medicinal chemistry (rat and dog F) and equine doping control.',
    prose: 'PK: STRIPPED. THE CITATION IS AN ASSAY PAPER, NOT A PHARMACOKINETIC ONE — it develops an LC-MS/MS method for measuring this compound in human plasma at picogram levels and reports no disposition parameter at all, so the stored half-life is class 1. The indexed literature was swept for a replacement and contains none: the pharmacokinetic-sounding hits are medicinal-chemistry papers reporting ANIMAL bioavailability ("F(rat)=65%, F(dog)=44%"), a review, and equine doping-control mass spectrometry. Human trials of this compound were run and their parameters are not in any abstract I can reach, which is exactly the lgd-4033 situation: human data exist, and the record is still unauthorable under the verbatim rule.',
    summary: 'mk-677 — STRIPPED to research-only (its citation is an assay-development paper)' },
];
for (const u of UNAUTHORED) {
  const c = need(u.slug);
  if (c.pk_unauthored) { log.push(`${u.slug} — already unauthored, skipped`); continue; }
  delete c.pk;
  c.half_life_hr = {};
  c.pk_unauthored = { reason: u.reason, note: u.note };
  if (u.note.length > 500) throw new Error(`${u.slug} pk_unauthored.note is ${u.note.length} chars`);
  note(c, u.prose);
  log.push(u.summary);
}

// ── Acquitted, with the gap recorded ──────────────────────────────────────
{
  const c = need('rad-140');
  note(c, 'PK: MY PRIOR IS REFUTED — THE HALF-LIFE IS VERBATIM AND PROPERLY SOURCED. Unlike lgd-4033, ostarine and mk-677, this record cites a real phase-1 in twenty-two patients that states the number outright: "The half-life (t1/2) of 44.7 hours supported QD dosing". AND THE DOSE BLOCK IS NOT THE lgd-4033 DEFECT EITHER: that trial escalated to a maximum tolerated dose well ABOVE anything this record simulates, so unlike the SARM next door it is not asserting a dose no human has received. WHAT IS MISSING IS THE VOLUME AND THE BIOAVAILABILITY, so the curve is rendered against thirty-five litres and 0.9 — neither of which that abstract states, and neither of which I could source. LOGGED RATHER THAN INVENTED. The record is kept because the elimination it describes is real and sourced.');
  log.push('rad-140 — acquitted; t½ 44.7 is verbatim in a real phase-1. V/F gap logged.');
}

// ── Found, quantified, and DELIBERATELY NOT ACTED ON IN DATA ──────────────
// The two lithium defects have to move together or the record gets worse, which
// is the compensating-error lesson from atracurium and doxorubicin applied
// before the mistake rather than after it.
{
  const c = need('lithium');
  note(c, 'PK: A THERAPEUTIC DOSE RENDERS AS A TOXIC SERUM LEVEL, AND THE CAUSE IS A CATALOGUE-WIDE CONVENTION RATHER THAN A WRONG NUMBER. Every stored value is verbatim and correctly sourced. But the dose is nine hundred milligrams of lithium CARBONATE while the volume, the half-life and the reported serum concentration all describe the lithium ION, and only 18.8 percent of that salt mass IS lithium — so the solver divides a salt mass by an ion volume and OVERSTATES THE PLASMA CURVE 5.32-FOLD. In the units this drug is actually monitored in, the model renders a single standard dose at 2.32 mmol/L against a therapeutic band of 0.6 to 1.2 and a toxicity threshold around 1.5; with the ion mass it renders 0.44, which is the right order. THE SECOND DEFECT PULLS THE OTHER WAY AND IS WHY NEITHER IS FIXED ALONE: no bioavailability is stored, so the solver substitutes 0.9 against a volume that is itself an APPARENT one from an oral study, dividing by absorption twice — pinning it at unity is correct and would make the toxic reading WORSE by a further ten percent. Both move together or neither moves. AND THE CONVENTION IS NOT LITHIUM-SPECIFIC: this catalogue deliberately stores free-base masses beside salt-form doses, which is harmless while the mass is only used to convert micromolar affinities and is NOT harmless once the dose feeds the plasma curve. Brompheniramine has the same shape at 1.36-fold, at least twenty-nine records discuss a salt-versus-base distinction in their prose, and lithium is merely the extreme because its counter-ion is most of the molecule. LOGGED AS A SCHEMA GAP: there is no field that says which moiety a dose is expressed in.');
  log.push('lithium — 5.32x salt/ion dose mismatch quantified and logged, NOT patched (paired with the F default)');
}

console.log(`\nbatch 11a — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
