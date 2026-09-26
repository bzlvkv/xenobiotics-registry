/**
 * 2026-09-07-pk-analyte-c2.ts
 *
 * Batch C2: the nine records C1 held back rather than inferred, now verified —
 * plus a reopening of one C1 already "resolved".
 *
 * C1 declared 37 analytes from what the records already documented, and left
 * nine where the only evidence was an internal inconsistency: a PARENT-ESTER
 * molecular weight sitting beside an ACTIVE-DIACID half-life. That is a chimera
 * worth confirming against the literature rather than asserting from arithmetic.
 *
 * ── SEVEN CONFIRMED, ONE REFUTED, ONE STRIPPED ─────────────────────────
 * Seven were chimeras exactly as suspected. lovastatin was NOT, and refuting it
 * mattered: the parent-ester tell does not apply there because lactone and acid
 * have statistically indistinguishable half-lives (3.7 vs 4.3 h, SDs 2.5 and
 * 2.8), so nothing forces the record onto the acid. molnupiravir's analyte is
 * settled by the literature but no defensible half-life exists for its stored
 * dose, so it is stripped rather than labelled.
 *
 * ── AND A RECORD C1 GOT WRONG ──────────────────────────────────────────
 * simvastatin was labelled `active-metabolite` / simvastatin acid in C1 on the
 * strength of its own note — but that same note concedes its bioavailability
 * "describes the parent lactone". So the row pairs an ACID half-life with a
 * LACTONE bioavailability under an active-metabolite label: the exact chimera
 * this pass exists to eliminate, in a record the pass had already passed.
 * Found by the verification agent, not by the pass that created it.
 *
 * ── FOUR CITATION DEFECTS, FOUND ALONG THE WAY ─────────────────────────
 * oseltamivir, tenofovir-disoproxil, sacubitril and lisdexamfetamine each cite a
 * source_pmid whose abstract supports NONE of their stored numbers.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

type Analyte = 'parent' | 'active-metabolite' | 'active-moiety' | 'total-drug-related';
interface Compound {
  slug: string; pk_analyte?: Analyte; pk_analyte_name?: string;
  pk?: Record<string, Record<string, unknown> | undefined>;
  half_life_hr?: Record<string, number>;
  pk_unauthored?: { reason: string; note?: string };
  effect_compartment?: { approximated?: boolean; [k: string]: unknown };
  receptor_occupancy?: unknown[];
  refs?: string[]; notes?: string; [k: string]: unknown;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const addRefs = (c: Compound, ...p: string[]) => { c.refs ??= []; for (const x of p) if (!c.refs.includes(x)) c.refs.push(x); };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const FIXES: {
  slug: string; a: Analyte; name?: string; guard?: (c: Compound) => boolean;
  pk?: Record<string, Record<string, unknown>>; hl?: Record<string, number>;
  refs?: string[]; note: string; summary: string;
}[] = [
  { slug: 'enalapril', a: 'active-metabolite', name: 'enalaprilat',
    note: 'ANALYTE: the active diacid ENALAPRILAT, confirmed rather than inferred. Its cited crossover measured only enalaprilat on both arms — "After both drugs, a biexponential curve was fitted to the decline in plasma enalaprilat concentration" — so the stored bioavailability of 0.62 is oral enalapril against INTRAVENOUS ENALAPRILAT, and the 11 h is enalaprilat accumulation. The pk block is therefore internally consistent; only the mass is not, since mw 376.45 is the ethyl ester. Caveat retained: 11 h is an ACCUMULATION half-life derived from urine, not a terminal disposition value.',
    summary: 'enalapril — active metabolite (enalaprilat); chimera is the mass only' },

  { slug: 'fosinopril', a: 'active-metabolite', name: 'fosinoprilat',
    pk: { PO: { F: 0.22, V_L: 5.85, source_pmid: 'PMID:11563407' } }, hl: { PO: 17.4 },
    note: 'ANALYTE: FOSINOPRILAT, and the strongest analyte case of the nine — its cited study sampled "for fosinoprilat concentrations over 48 hours" on BOTH the oral and intravenous arms, so the diacid is the only species measured anywhere in it. AND A NEW DEFECT: V 26 L CONTRADICTS THAT SAME CITATION, which states "a Vss of 5,850 +/- 2,780 mL" — 5.85 L, a 4.4-fold error, with 26 appearing nowhere. The stored 12 h was likewise in neither row; the paper gives 17.4 h oral and 13.0 h intravenous, and the oral value is carried. ka 0.4 is unstated and dropped. mw 563.66 is the parent phosphinate ester.',
    summary: 'fosinopril — V 26 L contradicts its own citation, which says 5.85 L' },

  { slug: 'oseltamivir', a: 'active-metabolite', name: 'oseltamivir carboxylate (Ro 64-0802)',
    pk: { PO: { F: 0.8, V_L: 23, source_pmid: 'PMID:10628898' } }, hl: { PO: 7 },
    refs: ['PMID:10628898'],
    note: 'ANALYTE: the CARBOXYLATE, and the stored bioavailability was already metabolite-referenced without saying so — "The absolute bioavailability of the active metabolite from orally administered oseltamivir is 80%". So the pk block is internally consistent. CITATION DEFECT CORRECTED: the previous source was a generic-versus-brand bioequivalence study whose abstract contains no half-life, no bioavailability and no volume, only time-to-peak and confidence intervals — it supported none of the four stored values. The 7 h sits inside a stated "6 to 10 hours" but is not itself verbatim. ka 1.4 dropped. mw 312.4 is the ethyl ester.',
    summary: 'oseltamivir — cited a bioequivalence study supporting none of its values' },

  { slug: 'tenofovir-disoproxil', a: 'active-metabolite', name: 'tenofovir',
    pk: { PO: { F: 0.25, V_L: 87, source_pmid: 'PMID:15217303' } }, hl: { PO: 17 },
    refs: ['PMID:15217303'],
    note: 'ANALYTE: TENOFOVIR, and the stored half-life is verbatim and explicitly its serum value — "Tenofovir exhibits longer serum (17 hours) and intracellular (>or=60 hours) half-lives than those of nucleoside analogues". NOT THE SOFOSBUVIR SHAPE, and the distinction matters: three species exist, but unlike sofosbuvir inactive dead-end metabolite this plasma analyte is the direct precursor of the active anabolite, with dose-proportional kinetics consistent across healthy and infected subjects. F 0.25 IS UNSOURCED — neither cited paper supports it, and a 25% figure in this literature is a FOOD EFFECT on tenofovir DIPIVOXIL, a different prodrug. Retained only because the resolver default would be worse. ka 0.9 dropped.',
    summary: 'tenofovir-disoproxil — t½ verbatim for the metabolite; its F remains unsourced' },

  { slug: 'sacubitril', a: 'active-metabolite', name: 'sacubitrilat (LBQ657)',
    pk: { PO: { F: 0.6, V_L: 75, source_pmid: 'PMID:27230850' } }, hl: { PO: 12 },
    refs: ['PMID:27230850'],
    note: 'ANALYTE: SACUBITRILAT, discriminated against the parent by this record own other citation: sacubitril peaks at 0.5 h and shows "no accumulation" on twice-daily dosing while sacubitrilat peaks at 1.5-2.0 h and accumulates about 1.6-fold. So the stored 11 h cannot be the parent. Corrected to the verbatim 12 h from a healthy-subject arm. CITATION DEFECT: the previous source abstract supports none of the stored numbers — no half-life, no bioavailability, no volume, no rate. F 0.6 and V 75 remain unsourced and are gap-listed; ka 2.8 dropped. mw 411.49 is the sacubitril ethyl ester.',
    summary: 'sacubitril — parent peaks at 0.5 h and does not accumulate; 11 h was the metabolite' },

  { slug: 'lisdexamfetamine', a: 'active-metabolite', name: 'dextroamphetamine',
    pk: { PO: { F: 0.96, V_L: 210, source_pmid: 'PMID:27935735' } }, hl: { PO: 17 },
    refs: ['PMID:27935735'],
    note: 'ANALYTE: DEXTROAMPHETAMINE, and the cleanest discrimination of the nine — one abstract, same subjects, both species: lisdexamfetamine "half-life [t1/2] = 0.5 hours" against d-amphetamine "t1/2 = 17.0 hours", a THIRTY-FOUR-FOLD split. The stored 11.6 h could only be the metabolite, and is corrected to the verbatim 17.0. CITATION DEFECT: the previous source reports no half-life, no bioavailability and no volume, though it does confirm the analyte by measuring "Plasma concentrations of amphetamine". THE WORST DOSE-BASIS RATIO OF THE BATCH: mw 263.38 is the lysine conjugate while d-amphetamine is 135.21, so a dose converts to moles about 1.95x too high.',
    summary: 'lisdexamfetamine — parent clears in 0.5 h against the stored 11.6; a 1.95x mass error' },

  { slug: 'tazarotene', a: 'active-metabolite', name: 'tazarotenic acid',
    note: 'ANALYTE: TAZAROTENIC ACID, and this record is the BEST-SOURCED of the nine rather than a candidate for stripping, which is what I had wondered about. Its existing citation carries BOTH stored values for the metabolite explicitly: "Tazarotenic acid ... is rapidly eliminated ... with a terminal half-life of about 18 hours" and "The systemic bioavailability of tazarotene (measured as tazarotenic acid) is low, approximately 1%" — that parenthetical names the analyte outright. So a systemic half-life IS meaningful here despite the topical route. One caveat worth carrying: bioavailability rises with use, from 1% single-dose to 5% or less at steady state in psoriasis. mw 351.46 is the parent ester.',
    summary: 'tazarotene — best-sourced of the nine; both values are verbatim for the metabolite' },

  { slug: 'lovastatin', a: 'parent',
    pk: { PO: { F: 0.05, V_L: 140, source_pmid: 'PMID:11868800' } }, hl: { PO: 3.7 },
    refs: ['PMID:11868800'],
    note: 'ANALYTE: THE PARENT LACTONE — MY INFERENCE WAS REFUTED, AND THIS RECORD SHOULD NOT MATCH ITS SIBLING. The parent-ester tell does not apply here because lactone and acid have statistically indistinguishable half-lives in the same 12 volunteers: 3.7 +/- 2.5 h and 4.3 +/- 2.8 h. Nothing forces the record onto the acid. F 0.05 is verbatim, lovastatin-specific and describes the lactone, matching mw 404.55. A SEPARATE DEFECT CORRECTED: the stored 3 h was the top of a THREE-DRUG CLASS RANGE — "Lovastatin, pravastatin and simvastatin ... have elimination half-lives of 1-3 h" — and is replaced by the measured 3.7 h lactone value, so mass, bioavailability and half-life now all describe one species.',
    summary: 'lovastatin — inference REFUTED; it is the parent, and its 3 h was a class range' },

  { slug: 'simvastatin', a: 'active-metabolite', name: 'simvastatin acid',
    guard: (c) => c.pk?.PO?.F === 0.07,
    pk: { PO: { F: 1, source_pmid: 'PMID:8343198' } }, hl: { PO: 5.9 },
    note: 'A RECORD BATCH C1 ALREADY "RESOLVED", REOPENED — AND THE VERIFICATION AGENT FOUND IT, NOT THE PASS THAT CREATED IT. C1 labelled this active-metabolite on the strength of its own note, but that same note concedes the stored bioavailability of 0.07 "describes the parent lactone" ("only 7% of the dose reaches the general circulation intact"). So the row paired an ACID half-life with a LACTONE bioavailability under an active-metabolite label — the exact chimera this pass exists to eliminate. F is now pinned to 1 so the row describes one species throughout, and the measured 7% systemic availability of the PARENT is recorded here instead. Contrast lovastatin, which is genuinely parent: the two statin records legitimately differ.',
    summary: 'simvastatin — a C1 record reopened: acid t½ paired with a lactone F' },
];

for (const f of FIXES) {
  const c = need(f.slug);
  // simvastatin already carries a pk_analyte from C1 — the reopening is about
  // the row being a chimera under that label, so it needs its own guard.
  const done = f.guard ? !f.guard(c) : c.pk_analyte != null;
  if (done) { log.push(`${f.slug} — already applied, skipped`); continue; }
  c.pk_analyte = f.a;
  if (f.name) c.pk_analyte_name = f.name;
  if (f.pk) c.pk = f.pk;
  if (f.hl) c.half_life_hr = f.hl;
  if (f.refs?.length) addRefs(c, ...f.refs);
  note(c, f.note);
  log.push(f.summary);
}

/** Settled analyte, but no defensible half-life for the stored dose. */
const STRIP: Record<string, [string, string, string[]]> = {
  molnupiravir: ['uncharacterized',
    'THE ANALYTE IS SETTLED AND THE NUMBERS STILL ARE NOT. Three species exist: the prodrug, NHC "the primary form found in systemic circulation", and an intracellular triphosphate, "the bioactive anabolite". THE STORED 3 h IS NEITHER OF THE TWO ROWS ITS OWN ABSTRACT OFFERS — NHC "declined with a geometric half-life of approximately 1 hour", with a slower phase of "7.1 hours at the highest dose tested", and that abstract never says what that dose was. F 0.56 is unsupportable: no IV study exists.',
    ['PMID:33649113', 'PMID:34555541']],
};
for (const [slug, [reason, n, refs]] of Object.entries(STRIP)) {
  const c = need(slug);
  if (c.pk_unauthored) { log.push(`${slug} — already pk_unauthored, skipped`); continue; }
  if (n.length > 500) throw new Error(`${slug} note ${n.length} > 500`);
  delete c.pk;
  c.half_life_hr = {};
  c.pk_unauthored = { reason, note: n };
  addRefs(c, ...refs);
  if (c.effect_compartment?.approximated && !(c.receptor_occupancy?.length)) delete c.effect_compartment;
  log.push(`${slug} — pk stripped, marked ${reason}: its 3 h is neither of the two rows its own abstract offers`);
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
