/**
 * 2026-09-06-merge-duplicate-slugs.ts
 *
 * Retires ten duplicate compound records — pairs that described ONE molecule
 * under two slugs, so the catalog published two different curves for one
 * substance and two intakes of it never summed into one exposure. Surfaced by
 * the `compound.identity-collision` lint rule.
 *
 * ── How a survivor was chosen ─────────────────────────────────────────────
 * Not by which name reads better. By counting INBOUND REFERENCES, because
 * every reference to a retired slug is a link that has to be rewritten, and a
 * missed one is a broken pathway step or a food preset that logs a compound
 * the solver cannot find. The counts decided several of these against the more
 * natural-sounding name:
 *
 *   ethanol   132 food items + the demo seed   vs  alcohol      0 foods
 *   arginine  555 food items + the FDC importer vs l-arginine   3 foods
 *   tryptophan 621 food items + the FDC importer vs l-tryptophan 3 foods
 *   tyrosine  525 food items + the FDC importer vs l-tyrosine   4 foods
 *
 * So the bare amino-acid slugs win over the "L-" forms that a supplement label
 * would use, and `ethanol` wins over `alcohol` even though `alcohol` is also a
 * food CATEGORY name. `vitamin-k2-mk7` wins over `mk7` because it is a member
 * of the vitamin-K nutrient group that drives the Daily-intake card, and
 * data-lint errors if a group member stops resolving.
 *
 * ── What is preserved ─────────────────────────────────────────────────────
 * 1. The retired slug goes into the survivor's `retired_slugs`, and every slug
 *    lookup resolves through it (core's `compoundIndex`). An intake logged
 *    years ago under `l-tyrosine` still finds its PK. The op log is append-only
 *    and is NOT rewritten.
 * 2. The retired record's name and aliases fold into the survivor's aliases, so
 *    search still finds the compound by the retired name.
 * 3. Registry-internal references (pathway steps and modulators, food preset
 *    items, interaction edges, metabolite and composition links) are REWRITTEN
 *    to the survivor. Internal data stays free of retired slugs; forwarding is
 *    for user data alone.
 *
 * ── What is dropped, deliberately ─────────────────────────────────────────
 * The survivor keeps its own authored PK unchanged. The retired record's PK is
 * NOT merged in, because grafting two independently-authored parameter sets
 * together is how the contradictions arose in the first place. Two cases worth
 * naming:
 *   • `alcohol` carried an IV route the survivor lacks. It is dropped rather
 *     than grafted on: alcohol's elimination is saturable (the surviving
 *     `ethanol` record models it with Michaelis-Menten parameters from Holford
 *     1987), and `alcohol`'s IV entry used a flat 0.25 h first-order half-life.
 *     Carrying it over would give one molecule two different elimination models
 *     depending on the route. Logged in AUTHORING_GAPS.md as a re-author target.
 *   • `s-23` carried an uncited 12 h oral half-life. The surviving `s23` record
 *     is marked research-only precisely because S-23 never entered a human
 *     trial, so that number had no source and is not carried.
 *
 * Idempotent: a pair whose retired slug is already absorbed is skipped.
 * Dry-run by default; pass --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', '..', 'packages', 'registry', 'data');
const COMPOUNDS_PATH = join(DATA, 'compounds.json');
const PATHWAYS_PATH = join(DATA, 'pathways.json');
const FOODS_PATH = join(DATA, 'foods.json');
const WRITE = process.argv.includes('--write');

/** [retired, survivor, why this survivor] */
const MERGES: [string, string, string][] = [
  ['alcohol', 'ethanol', '132 food items and the demo seed reference ethanol; alcohol has none'],
  ['l-arginine', 'arginine', '555 food items + the FDC nutrient importer key on arginine'],
  ['l-tryptophan', 'tryptophan', '621 food items + the FDC nutrient importer key on tryptophan'],
  ['l-tyrosine', 'tyrosine', '525 food items + the FDC nutrient importer key on tyrosine'],
  ['citicoline', 'cdp-choline', 'cdp-choline carries 3 inbound interaction edges and the IV route'],
  ['mk7', 'vitamin-k2-mk7', 'vitamin-k2-mk7 is a member of the vitamin-K nutrient group (Daily Value)'],
  ['s-23', 's23', 's23 carries the androgen-receptor occupancy row'],
  ['epithalon', 'epitalon', 'epitalon is the more common transliteration and carries the SC half-life'],
  ['albuterol', 'salbutamol', 'salbutamol carries the INH route, which is the one a SABA is actually dosed by'],
  ['copper-tripeptide-1', 'ghk-cu', 'ghk-cu carries all three routes (TD/SC/IN)'],
  // ── second pass, same day, after 2026-09-06-pk-resourcing.ts ──
  ['hydrocortisone', 'cortisol', 'cortisol carries 3 pathway steps, 3 modulators, the GR/MR occupancy rows and the kₑₒ; its PK was re-sourced to Derendorf 1991 first, since neither record\'s prior citation supported its numbers'],
  ['sodium-oxybate', 'ghb', 'ghb\'s one cited value was verbatim-supported and its paper also states V; all four of sodium-oxybate\'s PK values were absent from its citation. The kₑₒ and GABA-B row were moved to ghb beforehand (emax corrected 1 → 0.69)'],
];

interface Compound {
  slug: string;
  name: string;
  aliases?: string[];
  retired_slugs?: string[];
  interactions?: { slug: string }[];
  metabolites?: { slug: string }[];
  composition?: { constituents?: { slug: string }[] };
}
interface Pathway {
  slug: string;
  steps?: { from: string; to: string; via_slug?: string }[];
  modulators?: { slug: string }[];
}
interface Food { slug?: string; items?: { compound?: string }[] }

const compounds = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const pathways = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
const foods = JSON.parse(readFileSync(FOODS_PATH, 'utf-8')) as Food[];

const bySlug = new Map(compounds.map((c) => [c.slug, c]));
const retiredNow: string[] = [];
const rewrites = { pathwayStep: 0, pathwayVia: 0, pathwayMod: 0, foodItem: 0, interaction: 0, metabolite: 0, constituent: 0 };
const skipped: string[] = [];

/** Case-insensitive alias union, preserving the survivor's existing order. */
function foldAliases(survivor: Compound, retired: Compound) {
  const seen = new Set([survivor.name.toLowerCase(), ...(survivor.aliases ?? []).map((a) => a.toLowerCase())]);
  const add: string[] = [];
  for (const candidate of [retired.name, ...(retired.aliases ?? [])]) {
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    add.push(candidate);
  }
  if (add.length) survivor.aliases = [...(survivor.aliases ?? []), ...add];
  return add;
}

for (const [retiredSlug, survivorSlug, why] of MERGES) {
  const survivor = bySlug.get(survivorSlug);
  const retired = bySlug.get(retiredSlug);
  if (!survivor) { skipped.push(`${retiredSlug} → ${survivorSlug}: SURVIVOR MISSING`); continue; }
  if (!retired) {
    if ((survivor.retired_slugs ?? []).includes(retiredSlug)) skipped.push(`${retiredSlug} → ${survivorSlug}: already merged`);
    else skipped.push(`${retiredSlug} → ${survivorSlug}: RETIRED RECORD MISSING and not recorded`);
    continue;
  }

  const added = foldAliases(survivor, retired);
  survivor.retired_slugs = [...new Set([...(survivor.retired_slugs ?? []), retiredSlug, ...(retired.retired_slugs ?? [])])].sort();
  retiredNow.push(`${retiredSlug} → ${survivorSlug}  (${why})${added.length ? `\n        aliases folded: ${added.join(', ')}` : ''}`);

  // ── rewrite every registry-internal reference ──
  for (const p of pathways) {
    for (const step of p.steps ?? []) {
      if (step.from === retiredSlug) { step.from = survivorSlug; rewrites.pathwayStep++; }
      if (step.to === retiredSlug) { step.to = survivorSlug; rewrites.pathwayStep++; }
      if (step.via_slug === retiredSlug) { step.via_slug = survivorSlug; rewrites.pathwayVia++; }
    }
    for (const m of p.modulators ?? []) {
      if (m.slug === retiredSlug) { m.slug = survivorSlug; rewrites.pathwayMod++; }
    }
  }
  for (const f of foods) {
    for (const item of f.items ?? []) {
      if (item.compound === retiredSlug) { item.compound = survivorSlug; rewrites.foodItem++; }
    }
  }
  for (const c of compounds) {
    for (const edge of c.interactions ?? []) {
      if (edge.slug === retiredSlug) { edge.slug = survivorSlug; rewrites.interaction++; }
    }
    for (const m of c.metabolites ?? []) {
      if (m.slug === retiredSlug) { m.slug = survivorSlug; rewrites.metabolite++; }
    }
    for (const k of c.composition?.constituents ?? []) {
      if (k.slug === retiredSlug) { k.slug = survivorSlug; rewrites.constituent++; }
    }
  }
}

// Drop the retired records last, so the rewrite loops above still saw them.
const retiredSet = new Set(retiredNow.map((line) => line.split(' → ')[0]));
const kept = compounds.filter((c) => !retiredSet.has(c.slug));

// A compound must never end up pointing an interaction edge at itself, which
// is what a merge produces when both sides of a pair carried the same edge.
let selfEdges = 0;
for (const c of kept) {
  if (!c.interactions) continue;
  const before = c.interactions.length;
  c.interactions = c.interactions.filter((e) => e.slug !== c.slug);
  selfEdges += before - c.interactions.length;
}

console.log(`Merged ${retiredNow.length} duplicate pair(s):`);
for (const line of retiredNow) console.log(`   • ${line}`);
console.log(`\nRecords removed: ${compounds.length - kept.length}  (catalog ${compounds.length} → ${kept.length})`);
console.log('Internal references rewritten:', JSON.stringify(rewrites));
if (selfEdges) console.log(`Self-referential interaction edges dropped after merge: ${selfEdges}`);
if (skipped.length) {
  console.log(`\n${skipped.length} skipped:`);
  for (const s of skipped) console.log(`   - ${s}`);
}

if (WRITE) {
  writeFileSync(COMPOUNDS_PATH, `${JSON.stringify(kept, null, 2)}\n`);
  writeFileSync(PATHWAYS_PATH, `${JSON.stringify(pathways, null, 2)}\n`);
  writeFileSync(FOODS_PATH, `${JSON.stringify(foods, null, 2)}\n`);
  console.log('\nWROTE compounds.json, pathways.json, foods.json');
} else {
  console.log('\nDry run — pass --write to apply.');
}
