/**
 * 2026-09-07-identity-collisions-d1.ts
 *
 * Batch D1: the 21 open `compound.identity-collision` warnings, which turn out
 * to be THREE different problems wearing one warning.
 *
 * A collision fires when compound A lists an alias that is compound B's
 * canonical identity — so a user searching for B can land on A.
 *
 * ── KIND 1: A CLAIMS A MORE SPECIFIC FORM THAT HAS ITS OWN RECORD (17) ──
 * The bulk of them. `calcium` claims "Calcium carbonate", `zinc` claims "Zinc
 * picolinate", `ldn` claims "naltrexone", `epa-dha` claims "Fish oil", "epa" and
 * "dha", and the three branched-chain amino acids each claim "BCAA" — every one
 * of those is a separate authored record. The alias is simply wrong: searching
 * "naltrexone" must not surface low-dose naltrexone, and searching "BCAA" must
 * not surface leucine alone. Removing the alias is the whole fix.
 *
 * ── KIND 2: THE SLUG IS THE COLLISION, NOT THE ALIAS (2) ────────────────
 * `alanine` claims "Ala" and `ribose-5-phosphate` claims "R5P" — and both of
 * those ARE the standard abbreviations for those molecules. The problem is that
 * the slugs `ala` and `r5p` were given to ALPHA-LINOLENIC ACID and
 * RIBOFLAVIN-5'-PHOSPHATE. Deleting the correct alias would be the wrong fix;
 * these need the slugs renamed with retired-slug forwarding, which is the merge
 * script's job. Left for D2 and logged.
 *
 * ── KIND 3: GENUINE DUPLICATES (2) ─────────────────────────────────────
 * `citrulline`/`l-citrulline` and `glutamine`/`l-glutamine` are each one
 * molecule held twice — identical molecular weight and mechanism. Worse, each
 * pair disagrees with itself: the unprefixed record carries authored systemic
 * PK while the L-prefixed one is `pk_unauthored: local-acting`, so the registry
 * publishes a curve and a refusal-to-curve for the same substance. That needs a
 * merge with inbound-reference forwarding, not an alias edit. Left for D2.
 *
 * Idempotent; dry-run by default; --write to apply.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const WRITE = process.argv.includes('--write');

interface Compound { slug: string; name: string; aliases?: string[]; [k: string]: unknown }
const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
const by = new Map(data.map((c) => [c.slug, c]));
const log: string[] = [];
const need = (s: string) => { const c = by.get(s); if (!c) throw new Error(`${s} missing`); return c; };

/** slug -> aliases to drop, each of which is another record's canonical identity. */
const ALIAS_DROPS: { slug: string; drop: string[]; owner: string; why: string }[] = [
  { slug: 'calcium', drop: ['Calcium carbonate'], owner: 'calcium-carbonate',
    why: 'a specific salt with its own authored record; the element must not answer a search for it' },
  { slug: 'potassium', drop: ['Potassium chloride'], owner: 'potassium-chloride',
    why: 'a specific salt with its own record' },
  { slug: 'sodium', drop: ['Sodium chloride'], owner: 'sodium-chloride',
    why: 'a specific salt with its own record' },
  { slug: 'zinc', drop: ['Zinc picolinate'], owner: 'zinc-picolinate',
    why: 'a specific salt with its own record. Note the counter-ion matters for absorption but not for the ion disposition, which is why the salt is authored separately' },
  { slug: 'l-carnitine', drop: ['Propionyl-L-carnitine'], owner: 'propionyl-l-carnitine',
    why: 'a distinct acylated ester with its own record, not a synonym for the parent' },
  { slug: 'coq10-ubiquinol', drop: ['coq10'], owner: 'coq10',
    why: 'ubiquinol is the REDUCED form; the oxidised ubiquinone is the separate coq10 record, and the two are not interchangeable' },
  { slug: 'selenium-methionine', drop: ['selenium'], owner: 'selenium',
    why: 'selenomethionine is an organic carrier; elemental selenium has its own record' },
  { slug: 'semax', drop: ['N-acetyl semax (NA-Semax)'], owner: 'n-acetyl-semax',
    why: 'the N-acetyl amidate is a separate peptide with its own record' },
  { slug: 'ldn', drop: ['naltrexone'], owner: 'naltrexone',
    why: 'THE CLEAREST CASE — low-dose naltrexone claiming the full drug identity means a search for "naltrexone" can surface a 4.5 mg off-label protocol instead of the 50 mg antagonist' },
  { slug: 'epa-dha', drop: ['Fish oil', 'fish oil', 'epa', 'dha'], owner: 'fish-oil / epa / dha',
    why: 'THREE separate records claimed at once — the combination product cannot also be each of its constituents and their common source' },
  { slug: 'hormonal-contraceptives', drop: ['Progestin-only pill'], owner: 'progestin-only-pill',
    why: 'the progestin-only pill is a distinct regimen with its own record; the umbrella term must not absorb it' },
  { slug: 'isoleucine', drop: ['BCAA'], owner: 'bcaa',
    why: 'BCAA is the three-amino-acid MIXTURE and has its own record; one constituent must not answer for it' },
  { slug: 'leucine', drop: ['BCAA'], owner: 'bcaa', why: 'as isoleucine' },
  { slug: 'valine', drop: ['BCAA'], owner: 'bcaa', why: 'as isoleucine' },
  { slug: 'zinc-picolinate', drop: ['zinc'], owner: 'zinc',
    why: 'the MIRROR of the zinc entry above, and it only surfaced once that one was fixed: the salt was claiming the element as well as the element claiming the salt. Both directions had to go' },
  { slug: 'aspartate', drop: ['D-Aspartic acid'], owner: 'd-aspartic-acid',
    why: 'A STEREOCHEMICAL ERROR, not just a naming one: this record is L-aspartate, the proteinogenic form, while D-aspartic acid is the opposite enantiomer with its own record and its own neuroendocrine literature' },
];

for (const e of ALIAS_DROPS) {
  const c = need(e.slug);
  const gone = (e.drop).filter((a) => (c.aliases ?? []).includes(a));
  if (!gone.length) { log.push(`${e.slug} — already trimmed, skipped`); continue; }
  c.aliases = (c.aliases ?? []).filter((a) => !gone.includes(a));
  log.push(`${e.slug} — dropped ${gone.map((g) => `"${g}"`).join(', ')} (owned by ${e.owner}): ${e.why}`);
}

for (const l of log) console.log(` • ${l}`);
if (WRITE) { writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n'); console.log('\nWrote compounds.json'); }
else console.log('\nDry run — pass --write to apply.');
