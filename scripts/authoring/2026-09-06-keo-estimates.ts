/**
 * 2026-09-06-keo-estimates.ts
 *
 * Finishes the job that 2026-09-06-provenance-typing.ts Part B started, and
 * corrects the rule that made it stop short.
 *
 * That script flagged a kₑₒ as `approximated` only when the effect_compartment
 * carried NO `source_pmid`, on the principle "a cited kₑₒ is a fitted value;
 * never overwrite a citation with an estimate flag". It reached 34 compounds.
 * But the registry holds ~150 more whose effect_compartment DOES carry a
 * `source_pmid` while the note beside it says, in the authoring session's own
 * words, "Approximation; no published kₑₒ". On those records the PMID is not
 * the source of the kₑₒ — it is the paper that anchors the compound's
 * pharmacology (a PET occupancy time-course, an onset-of-effect trial, the
 * receptor-binding primary), and the number was reasoned from it. The compound
 * page renders `source_pmid` as a PubMed link beside the kₑₒ value, so every
 * one of those pages presented a reasoned estimate as a fitted measurement.
 * data-lint's `effect.approx-conflict` rule (an estimate must not also cite a
 * fit) was blind to them for the same reason: the flag was never set.
 *
 * What this script does, per matching compound:
 *   1. sets `effect_compartment.approximated = true`;
 *   2. moves the PMID out of `effect_compartment.source_pmid` and into the
 *      compound's `refs[]` if it is not already there — the paper stays cited,
 *      verified by `registry:verify`, and reachable from the References list;
 *      it just stops claiming to be a kₑₒ fit;
 *   3. leaves `keo_per_h` and the note untouched. The note already carries the
 *      reasoning and, in most cases, names the anchoring paper.
 *
 * A note is treated as admitting an estimate when it says so: "Approximation",
 * "no published kₑₒ", "no measured … kₑₒ", "no <x>-specific kₑₒ", "approximated
 * from", "textbook approximation", or the "captures / matches the … lag",
 * "modeled here as a small keo" phrasing the early sessions used for a value
 * reasoned from clinical onset timing. Three cited kₑₒ notes
 * also contain words like "approximately" but quote a verbatim equilibration
 * half-life from the abstract (digoxin 3.8 h, oxycodone 7.2 min in sheep,
 * sodium-oxybate 5.6 min in rat); those are genuine fits and are excluded by
 * name so the regex cannot reach them.
 *
 * No number changes. Idempotent: a compound already flagged is skipped.
 * Dry-run by default; pass --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

/** Notes that admit, in their own words, that the kₑₒ is reasoned rather than fitted. */
const ADMITS_ESTIMATE =
  /approximation|approximated from|no published k|no measured (?:human )?k|no human keo|no [\w-]+-specific k|no .*keo modeling published|textbook approximation|captures the (?:slow|moderate|multi-week|long-tail|Cp)|matches the (?:moderate|rapid|slow) Cp|modeled here as a small keo|small keo reflects the slow|matches the sleep-onset PD timing/i;

/** Cited kₑₒ values whose abstract states the equilibration half-life verbatim — real fits, never flagged. */
const VERBATIM_FITS = new Set(['digoxin', 'oxycodone', 'sodium-oxybate']);

interface Compound {
  slug: string;
  refs?: string[];
  effect_compartment?: { keo_per_h?: number; source_pmid?: string; approximated?: boolean; note?: string };
}

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const applied: string[] = [];
const refAdded: string[] = [];
const needsRead: string[] = [];

for (const c of data) {
  const ec = c.effect_compartment;
  if (!ec?.keo_per_h || !ec.source_pmid) continue;
  if (ec.approximated) continue; // already flagged (would be an approx-conflict error anyway)
  if (VERBATIM_FITS.has(c.slug)) continue;
  if (!ec.note || !ADMITS_ESTIMATE.test(ec.note)) {
    // A cited kₑₒ whose note does not admit an estimate is presumed fitted.
    // Listed only so a human can eyeball the presumption; nothing changes.
    needsRead.push(c.slug);
    continue;
  }
  const pmid = ec.source_pmid;
  delete ec.source_pmid;
  ec.approximated = true;
  c.refs ??= [];
  if (!c.refs.includes(pmid)) {
    c.refs.push(pmid);
    refAdded.push(`${c.slug} += ${pmid}`);
  }
  applied.push(`${c.slug} (${pmid} → refs; kₑₒ ${ec.keo_per_h}/h now ESTIMATED)`);
}

console.log(`effect_compartment.approximated: ${applied.length} applied`);
for (const a of applied) console.log(`   + ${a}`);
console.log(`\nrefs[] gained the anchoring PMID on ${refAdded.length} compounds`);
for (const r of refAdded) console.log(`   + ${r}`);
console.log(`\n${needsRead.length} cited kₑₒ left as fits (note does not admit an estimate):`);
console.log(`   ${needsRead.join(', ')}`);

if (WRITE) {
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWrote ${COMPOUNDS_PATH}`);
} else {
  console.log('\nDry run — pass --write to apply.');
}
