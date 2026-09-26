/**
 * 2026-09-06-species-labelling.ts
 *
 * Declares, in data, the species behind PK and PK/PD values that were only
 * ever identified in prose.
 *
 * The registry has always allowed animal-derived values where no human study
 * exists — for research peptides, for anaesthetic EEG models, for long-ester
 * depots there often is nothing else, and an order-of-magnitude curve beats a
 * blank. What it could not do was SAY so: `effect_compartment.source_pmid`
 * rendered a rat EEG fit and a human PK/PD study identically, and a compound
 * page had no way to distinguish them. The authoring sessions knew, and wrote
 * it into the note ("Rat IV PK/EEG", "Animal surrogate", "PK is EQUINE"), where
 * no surface and no gate could act on it.
 *
 * `RoutePk.source_species` and `EffectCompartment.source_species` (added in
 * this change, with the matching loader schema entries and a round-trip test)
 * make it machine-readable. The compound page now renders a species chip, and
 * data-lint's `pk.species-in-note` / `effect.species-in-note` rules flag any
 * value whose prose credits an animal while the field is unset.
 *
 * Omitting the field still means human. That keeps the common case clean, and
 * is safe because the field is only added when a value is FOUND to be animal —
 * never removed.
 *
 * Every species below is lifted from the record's own note; no value changes.
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
  pk?: Record<string, { source_species?: string; [k: string]: unknown } | undefined>;
  effect_compartment?: { source_species?: string; note?: string; [k: string]: unknown };
}

/** slug → species, for a kₑₒ fitted in an animal. Quoted from each record's note. */
const KEO_SPECIES: Record<string, string> = {
  bupivacaine: 'rabbit',   // "Isolated perfused rabbit heart: QRS effect ..."
  butorphanol: 'rat',      // "Rat IV PK/EEG (Groenendaal 2008) ... Species: rat."
  etomidate: 'rat',        // "EEG aperiodic, rat, t½keo 2.65 min"
  lamotrigine: 'rat',      // "MES anticonvulsant endpoint, rat"
  nalbuphine: 'rat',       // "Rat IV PK/EEG (Groenendaal 2008) ... Species: rat."
  oxycodone: 'sheep',      // "Sheep IV oxycodone, brain:blood model ... Animal surrogate"
  remifentanil: 'dog',     // "EEG theta endpoint, dog"
  tiagabine: 'rat',        // "Rat EEG β-amplitude (11.5–30 Hz)"
  ghb: 'rat',              // "RAT [ANIMAL SURROGATE - FLAG]" in the moved GABA-B/keo note
};

/** slug → route → species, for PK parameters measured in an animal. */
const PK_SPECIES: Record<string, Record<string, string>> = {
  // "PK is EQUINE, not human — Soma 2007 ... after IM boldenone in horses
  // (1.1 mg/kg); authored as the best-available long-ester depot approximation."
  boldenone: { IM: 'horse' },
};

const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const applied: string[] = [];
const skipped: string[] = [];

for (const [slug, species] of Object.entries(KEO_SPECIES)) {
  const c = by.get(slug);
  if (!c?.effect_compartment) { skipped.push(`${slug} — no effect_compartment`); continue; }
  if (c.effect_compartment.source_species) { skipped.push(`${slug} — already labelled`); continue; }
  c.effect_compartment.source_species = species;
  applied.push(`${slug}.keo → ${species}`);
}

for (const [slug, routes] of Object.entries(PK_SPECIES)) {
  const c = by.get(slug);
  for (const [route, species] of Object.entries(routes)) {
    const pk = c?.pk?.[route];
    if (!pk) { skipped.push(`${slug}.${route} — no pk block`); continue; }
    if (pk.source_species) { skipped.push(`${slug}.${route} — already labelled`); continue; }
    pk.source_species = species;
    applied.push(`${slug}.pk.${route} → ${species}`);
  }
}

console.log(`source_species declared on ${applied.length} value(s):`);
for (const a of applied) console.log(`   + ${a}`);
if (skipped.length) { console.log(`\n${skipped.length} skipped:`); for (const s of skipped) console.log(`     - ${s}`); }

if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
