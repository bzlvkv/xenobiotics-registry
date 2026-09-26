/**
 * 2026-09-08-keo-species-declared.ts
 *
 * Three fitted keo values are RAT measurements with `source_species` unset, so
 * they read as human on every surface. Found while checking the
 * sufentanil/fentanyl shared-sentence collision in batch 10, then generalised.
 *
 * ── WHY THE EXISTING LINT RULE MISSED THEM ────────────────────────────────
 * `effect.species-in-note` required an animal word AND a study word in the SAME
 * sentence. That conjunction is right for `notes`, which is long free prose
 * discussing many studies, and wrong for `effect_compartment.note`, which is
 * one provenance statement about one value — there, naming a species IS the
 * claim. fentanyl's entire note was "antinociception (rat tail-flick)", with no
 * study word at all; atenolol's and pregabalin's put the species and the study
 * word in DIFFERENT sentences. The rule is widened in the same commit, and
 * SUPERSEDED remains as the only guard — which is the clause doing the real
 * work anyway, since a keo note routinely names the animal study it REPLACED.
 * After widening: exactly these three fire across all 249 keo records, no
 * false positives.
 *
 * ── AND A COLLISION CORRECTLY AVOIDED, WORTH RECORDING ────────────────────
 * fentanyl's source reports buprenorphine and fentanyl in ONE sentence —
 * "The k(eo) was 0.024 min(-1) ... and 0.123 min(-1) ... for buprenorphine and
 * fentanyl, respectively" — the exact shape that produced transplants
 * elsewhere. The record took 0.123, which is fentanyl's. And buprenorphine's
 * own record does NOT store 0.024: it cites a different paper in HEALTHY
 * VOLUNTEERS, verified here. Both records are right; only the labelling failed.
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
  effect_compartment?: { keo_per_h?: number; source_pmid?: string; source_species?: string; approximated?: boolean; note?: string };
  notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

const FIXES: { slug: string; keo: number; ecNote: string; prose: string; summary: string }[] = [
  { slug: 'fentanyl', keo: 7.38,
    ecNote: 'RAT tail-flick antinociception, effect-compartment/receptor-binding model. Verbatim: "The k(eo) was 0.024 min(-1) [95% CI: 0.018-0.030 min(-1)] and 0.123 min(-1) (95% CI: 0.095-0.151 min(-1)) for buprenorphine and fentanyl, respectively." keo = 0.123 × 60 = 7.38/h — fentanyl\'s value, not buprenorphine\'s, from a sentence reporting both. No human fentanyl keo was adopted; buprenorphine\'s own record cites a separate healthy-volunteer study.',
    prose: 'EFFECT COMPARTMENT: A RAT VALUE THAT READ AS HUMAN. The rate is verbatim, correctly fitted and correctly attributed — its source reports buprenorphine and fentanyl in ONE SENTENCE, the exact shape that has produced transplants elsewhere in this catalogue, AND THIS RECORD TOOK THE RIGHT HALF OF IT. But the study is rat tail-flick antinociception and the species field was unset, so the value counted among the records claiming a fitted HUMAN keo and was labelled as one on every surface. Declared. The neighbouring buprenorphine record was checked at the same time and is CLEAN: it does not carry this paper\'s buprenorphine figure at all, citing instead a separate study in healthy volunteers.',
    summary: 'fentanyl keo 7.38 — source_species: rat declared (was reading as human)' },
  { slug: 'atenolol', keo: 2.52,
    ecNote: 'WKY RAT, isoprenaline-induced tachycardia, heart-rate endpoint. Verbatim: "0.042+/-0.012 min(-1) (k(eo))". keo = 0.042 × 60 = 2.52/h. Class-typical β-blocker HR-endpoint keo; no human atenolol keo is published.',
    prose: 'EFFECT COMPARTMENT: A RAT VALUE THAT READ AS HUMAN. The rate is verbatim from a WKY-rat heart-rate model — its own title says "in rats" — and the species field was unset, so it counted among the records claiming a fitted human keo. The value itself is class-typical for a β-blocker heart-rate endpoint and is kept; only the label was missing.',
    summary: 'atenolol keo 2.52 — source_species: rat declared' },
  { slug: 'pregabalin', keo: 0.552,
    ecNote: 'RAT brain-ECF microdialysis, anticonvulsant endpoint. Verbatim: "the calculated ECe50 and Keo values were 95.3 ng/mL and 0.0092 min-1, respectively". keo = 0.0092 × 60 = 0.552/h. The abstract itself reads the value as slow: "The small Keo value suggests that the effect is not directly" concentration-driven.',
    prose: 'EFFECT COMPARTMENT: A RAT VALUE THAT READ AS HUMAN. The rate is verbatim from a rat brain-microdialysis study — its own title says "in rats" — with the species field unset. Kept and declared; the paper itself reads the value as slow, which is the right qualitative shape for this drug.',
    summary: 'pregabalin keo 0.552 — source_species: rat declared' },
];

for (const f of FIXES) {
  const c = by.get(f.slug);
  if (!c?.effect_compartment) throw new Error(`${f.slug} has no effect_compartment`);
  const ec = c.effect_compartment;
  if (ec.keo_per_h !== f.keo) throw new Error(`${f.slug} keo is ${ec.keo_per_h}, expected ${f.keo}`);
  if (ec.source_species) { log.push(`${f.slug} — species already declared, skipped`); continue; }
  ec.source_species = 'rat';
  ec.note = f.ecNote;
  if (f.ecNote.length > 500) throw new Error(`${f.slug} effect_compartment.note is ${f.ecNote.length} chars`);
  note(c, f.prose);
  log.push(f.summary);
}

// Restate the class so the next pass can see it closed.
const fitted = data.filter((c) => c.effect_compartment?.keo_per_h != null && !c.effect_compartment.approximated);
const declared = fitted.filter((c) => c.effect_compartment!.source_species);
console.log(`\nkeo species declaration — ${log.length} entries`);
console.log(`  ${fitted.length} keo values are claimed FITTED; ${declared.length} now declare a non-human species\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
