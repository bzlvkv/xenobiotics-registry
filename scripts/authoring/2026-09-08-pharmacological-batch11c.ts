/**
 * 2026-09-08-pharmacological-batch11c.ts
 *
 * Batch 11, part C — the last two records of the 24 that needed data changes,
 * plus the finding that closes the batch.
 *
 * ── THE TRIAGE OVER-REPORTED, AND I CHECKED RATHER THAN ASSUMED ───────────
 * The screening script flagged 24 pharmacological records as unaudited by
 * grepping `slug: '…'` out of scripts/authoring. SEVEN OF THEM WERE ALREADY
 * FULLY AUDITED — cariprazine, metolazone, desloratadine, rabeprazole,
 * sulfasalazine, warfarin and bupivacaine each carry a detailed audit note from
 * an earlier batch, several recording defects larger than anything left here.
 * They were missed because those batches reached them through PATCH tables and
 * `need('slug')` calls the grep does not match. THE DETECTION IS THE BUG, NOT
 * THE DATA. Their notes were read individually before this was concluded.
 *
 * ── RIFAMPIN IS THE PART-A FINDING IN ITS PUREST FORM ─────────────────────
 * Its own note records that a 2026-09-06 pass dropped ka, V and F and names the
 * verbatim values it declined to adopt "to avoid mixing populations" — WHILE
 * THE DEFAULTS IT FELL BACK ON ARE NOT A POPULATION AT ALL. The two declined
 * numbers turn out to come from ONE population fit of ONE cohort, so adopting
 * them mixes nothing; it is the single-state authoring moclobemide got.
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
  half_life_hr?: Record<string, number>; refs?: string[]; notes?: string;
}
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };
const note = (c: Compound, t: string) => { if (!(c.notes ?? '').includes(t.slice(0, 60))) c.notes = c.notes ? `${c.notes} ${t}` : t; };

{
  const c = need('rifampin');
  if (c.pk?.PO?.V_L == null) {
    Object.assign(c.pk!.PO!, { V_L: 53.2, F: 1, source_pmid: 'PMID:18391026' });
    c.half_life_hr!.PO = 1.92;
    note(c, 'PK: THE RECORD WAS RENDERING ENTIRELY AGAINST SILENT DEFAULTS, AND ITS OWN NOTE NAMED THE VALUES THAT FIX IT. A 2026-09-06 pass dropped the absorption rate, the volume and the bioavailability because the cited abstract states none of them — a correct diagnosis — and recorded the verbatim alternatives it declined to adopt "to avoid mixing populations". BUT THE DEFAULTS IT FELL BACK ON ARE NOT A POPULATION AT ALL: half a litre per kilogram and a bioavailability of 0.9 are unsourced constants, invisible on every surface, and they asserted a volume a third below the published one. The two declined numbers turn out to come from ONE population fit of ONE cohort of two hundred and sixty-one patients — "The typical population estimate of oral clearance was 19.2 liters x h(-1), while the volume of distribution was estimated to be 53.2 liters" — so adopting them mixes nothing. Both are APPARENT, which that abstract confirms in the same breath ("A strong correlation between clearance and volume of distribution suggested substantial variability in bioavailability"), so bioavailability is pinned at unity rather than stored, and the verbatim absolute figure from a different study — "87% and 71% for rifampicin" fasted and fed — is deliberately NOT stored beside an apparent volume. THE HALF-LIFE MOVES WITH THEM, to the one that pair implies. THAT IS A DELIBERATE CHANGE OF STATE: the abandoned 3.57 h is a single-dose figure in treatment-naive subjects, while this drug INDUCES ITS OWN METABOLISM and is taken daily for months, so the induced steady state is the one users occupy — the moclobemide reasoning, and the two states differ 1.86-fold, inside the band that kept efavirenz and rifabutin rather than the one that stripped carbamazepine. ONE ITEM IS LOGGED: that paper models absorption through a transit chain and this record has no absorption rate at all, so it renders at the default; a zero-order duration would carry it better.');
    log.push('rifampin — V/F 53.2 + F 1 + t½ 1.92 from ONE population fit (was ALL silent defaults)');
  } else { log.push('rifampin — already corrected, skipped'); }
}

{
  const c = need('rituximab');
  if (c.half_life_hr?.IV === 528) {
    c.half_life_hr.IV = 460.8;
    note(c, 'PK: A RANGE INTERIOR REPLACED BY A STATED MEAN THAT WAS ALREADY IN THIS RECORD REFERENCES. The stored half-life appears in its citation only as the inside of a spread — "a long elimination half-life of approximately 3 weeks (range, 248-859 hours)" — while the second reference this record already carries states a point value outright: "The elimination half-life at steady state of rituximab in all patients was estimated to be 19.2 (+/- 15.2%) days". THE VOLUME IS UNSOURCED AND IS DELIBERATELY NOT REPLACED: the only clearance either paper offers is itself a RANGE, "The total systemic clearance ranged between 3.1 and 11.9 mL/hr/m", and storing a volume derived from its midpoint would commit precisely the defect this audit keeps finding. At the corrected half-life the clearance the record implies sits just below the low end of that verbatim range, which is a near-miss rather than a defect and is recorded as one. Its citation also states plainly that "Rituximab disposition was characterized by a 2-exponential decay", so the usual one-compartment caveat applies: exposure is carried and the early distribution phase is not.');
    log.push('rituximab — t½ 528 (range interior) → 460.8 (verbatim mean, already in refs)');
  } else { log.push('rituximab — already corrected, skipped'); }
}

console.log(`\nbatch 11c — ${log.length} entries\n`);
for (const l of log) console.log('  ' + l);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log(`\nwrote ${COMPOUNDS_PATH}`); }
else { console.log('\n(dry run — pass --write to apply)'); }
