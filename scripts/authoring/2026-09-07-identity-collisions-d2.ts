/**
 * 2026-09-07-identity-collisions-d2.ts
 *
 * Batch D2: the four identity collisions D1 deliberately left, because each
 * needs slug-level surgery rather than an alias edit.
 *
 * ── TWO GENUINE DUPLICATES ─────────────────────────────────────────────
 * `citrulline`/`l-citrulline` and `glutamine`/`l-glutamine` are each ONE
 * molecule held twice — identical molecular weight, identical mechanism prose.
 * And each pair disagrees with itself: the unprefixed record carries authored
 * systemic PK while the L-prefixed one is `pk_unauthored: local-acting`, so the
 * registry publishes a curve AND a refusal-to-curve for the same substance, and
 * two intakes of it never sum into one exposure.
 *
 * Survivors chosen by inbound-reference count and authored PK, the same test the
 * earlier merge pass used — and it agrees with that pass, which put the bare
 * amino-acid slugs ahead of the "L-" supplement-label forms for arginine,
 * tryptophan and tyrosine.
 *
 * ── TWO SLUGS THAT WERE NEVER THE RIGHT NAME ───────────────────────────
 * `alanine` claims "Ala" and `ribose-5-phosphate` claims "R5P" — and both of
 * those ARE the standard abbreviations for those molecules. The collision is
 * that the slugs `ala` and `r5p` were handed to ALPHA-LINOLENIC ACID and
 * RIBOFLAVIN-5'-PHOSPHATE, so deleting the correct alias would have been the
 * wrong fix.
 *
 * `ala` is the worse of the two, because in THIS catalog it is TRIPLY ambiguous:
 * it is alanine's three-letter code, the slug for alpha-linolenic acid, and the
 * common abbreviation for alpha-lipoic acid — which is here as `ala-r`. A
 * three-letter slug cannot carry that.
 *
 * ── WHAT IS PRESERVED ──────────────────────────────────────────────────
 * Retired slugs go into the survivor's `retired_slugs`, so an intake logged
 * years ago still resolves through core's compound index. Names and aliases fold
 * into the survivor. Registry-internal references — food items and pathway steps
 * — are REWRITTEN, so internal data stays free of retired slugs and forwarding
 * exists for user data alone. The op log is append-only and is not touched.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', '..', 'packages', 'registry', 'data');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; name: string; aliases?: string[]; retired_slugs?: string[]; [k: string]: unknown }
const compounds = JSON.parse(readFileSync(join(DATA, 'compounds.json'), 'utf-8')) as Compound[];
interface FoodItem { compound: string }
interface Food {
  items?: FoodItem[];
  // Builder presets nest a SECOND set of items under options[].choices[].items —
  // a rewrite that walks only the top-level `items` leaves those dangling, which
  // is exactly what data-lint's food.compound-ref rule caught on the first run.
  options?: { choices?: { items?: FoodItem[] }[] }[];
}
const foods = JSON.parse(readFileSync(join(DATA, 'foods.json'), 'utf-8')) as Food[];
const pathways = JSON.parse(readFileSync(join(DATA, 'pathways.json'), 'utf-8')) as {
  steps?: { from: string; to: string; from_slug?: string; to_slug?: string; via_slug?: string }[];
  modulators?: { slug: string }[];
}[];
const log: string[] = [];
const bySlug = new Map(compounds.map((c) => [c.slug, c]));

/** Rewrite every registry-internal reference from `from` to `to`. */
function rewrite(from: string, to: string): string {
  let f = 0, p = 0;
  const bump = (items?: FoodItem[]) => {
    for (const it of items ?? []) if (it.compound === from) { it.compound = to; f++; }
  };
  for (const x of foods) {
    bump(x.items);
    for (const o of x.options ?? []) for (const ch of o.choices ?? []) bump(ch.items);
  }
  for (const x of pathways) {
    for (const s of x.steps ?? []) {
      if (s.from === from) { s.from = to; p++; }
      if (s.to === from) { s.to = to; p++; }
      if (s.from_slug === from) { s.from_slug = to; p++; }
      if (s.to_slug === from) { s.to_slug = to; p++; }
      if (s.via_slug === from) { s.via_slug = to; p++; }
    }
    for (const m of x.modulators ?? []) if (m.slug === from) { m.slug = to; p++; }
  }
  return `${f} food item(s), ${p} pathway reference(s)`;
}

// ── Merges: one molecule, two records ──────────────────────────────────
const MERGES: { survivor: string; retired: string; why: string }[] = [
  { survivor: 'citrulline', retired: 'l-citrulline',
    why: 'identical mw 175.19 and mechanism. The survivor carries authored PK and 3 pathway references against the retired record 1; the retired one was pk_unauthored: local-acting, so the pair published a curve and a refusal-to-curve for one molecule' },
  { survivor: 'glutamine', retired: 'l-glutamine',
    why: 'identical mw and mechanism. The survivor carries authored oral AND intravenous PK and 8 pathway references; the retired record was pk_unauthored: local-acting. Consistent with the earlier merge pass, which put arginine, tryptophan and tyrosine ahead of their L- forms for the same reason' },
];

for (const m of MERGES) {
  const survivor = bySlug.get(m.survivor);
  const retired = bySlug.get(m.retired);
  if (!survivor) throw new Error(`${m.survivor} missing`);
  if (!retired) { log.push(`${m.retired} — already merged, skipped`); continue; }
  const moved = rewrite(m.retired, m.survivor);
  survivor.retired_slugs = [...new Set([...(survivor.retired_slugs ?? []), m.retired])];
  survivor.aliases = [...new Set([
    ...(survivor.aliases ?? []).filter((a) => a !== retired.name),
    retired.name,
    ...(retired.aliases ?? []),
  ])];
  compounds.splice(compounds.indexOf(retired), 1);
  bySlug.delete(m.retired);
  log.push(`merged ${m.retired} -> ${m.survivor} (${moved}): ${m.why}`);
}

// ── Renames: the slug was never the right name for that molecule ───────
const RENAMES: { from: string; to: string; why: string }[] = [
  { from: 'ala', to: 'alpha-linolenic-acid',
    why: 'TRIPLY AMBIGUOUS IN THIS CATALOG — "Ala" is alanine three-letter code, "ALA" is the common abbreviation for alpha-lipoic acid which is here as ala-r, and this slug held alpha-LINOLENIC acid. A three-letter slug cannot carry three molecules' },
  { from: 'r5p', to: 'riboflavin-5-phosphate',
    why: 'R5P is the standard abbreviation for RIBOSE-5-phosphate, which is a separate authored record; this slug held riboflavin-5-phosphate' },
];

for (const r of RENAMES) {
  const c = bySlug.get(r.from);
  if (!c) { log.push(`${r.from} — already renamed, skipped`); continue; }
  if (bySlug.has(r.to)) throw new Error(`${r.to} already exists — cannot rename onto it`);
  const moved = rewrite(r.from, r.to);
  c.retired_slugs = [...new Set([...(c.retired_slugs ?? []), r.from])];
  c.slug = r.to;
  bySlug.delete(r.from);
  bySlug.set(r.to, c);
  log.push(`renamed ${r.from} -> ${r.to} (${moved}): ${r.why}`);
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) {
  writeFileSync(join(DATA, 'compounds.json'), JSON.stringify(compounds, null, 2) + '\n');
  writeFileSync(join(DATA, 'foods.json'), JSON.stringify(foods, null, 2) + '\n');
  writeFileSync(join(DATA, 'pathways.json'), JSON.stringify(pathways, null, 2) + '\n');
  console.log('\nWrote compounds.json, foods.json, pathways.json');
} else console.log('\nDry run — pass --write to apply.');
