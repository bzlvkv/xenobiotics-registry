/**
 * import-v7-compounds.ts — fold the v7 registry into v8.
 *
 * Reads every JSON under `../../v7/compounds/<category>/<slug>.json`,
 * maps to the v8 Compound shape, and merges with the existing
 * `packages/registry/data/compounds.json`. Slugs already in v8 keep
 * their entry — v8's hand-authored PK + cited references survive.
 *
 * Mapping rules (kept intentionally narrow; richer fields like effects,
 * traits, interactions are dropped because v8 doesn't surface them yet):
 *
 *   v7 field           → v8 field
 *   slug               → slug
 *   name               → name
 *   aliases            → aliases
 *   category           → category (1-to-1; new categories were added to
 *                        v8's enum to round-trip)
 *   mechanism          → mechanism
 *   routes (lower)     → routes (upper, "top" → "TD")
 *   absorption.*       → half_life_hr[primary_route] + pk[primary_route]
 *                        with V_L = vd_l_kg.value × 70 kg
 *   dose (free-text)   → doses[primary_route] best-effort parse
 *   cite (handles)     → refs (PMID:NNNN entries only; non-PMID dropped)
 *
 * Notes about lossy fields:
 *   - `dose: "100–400 mg/day"` is parsed via regex; multiple-route doses
 *     get the same parsed range. When parsing fails we drop the dose
 *     entry and Library shows "—" until a human authors it.
 *   - PMID-only citation policy: only `pmid:NNNN` handles round-trip.
 *     `doi:`, `fda:`, `usp:` etc are dropped (v8's verifier is PubMed-only
 *     for now). When we add a doi-resolver, this script gets one branch.
 *
 * Run:
 *   pnpm registry:import-v7
 *
 * Then:
 *   pnpm registry:verify     # confirms every imported PMID still resolves
 *   pnpm test                # confirms the new shape parses through Zod
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/ → v0.1/ → code/ → v8/ → xenobiotics/ → v7/compounds
const V7_ROOT = join(__dirname, '..', '..', '..', '..', 'v7', 'compounds');
const V8_OUT = join(__dirname, '..', 'packages', 'registry', 'data', 'compounds.json');

// ─────────────────────────────────────────────────────────────────────────────
// Types matching v8's Compound shape (subset — only what we write).
// ─────────────────────────────────────────────────────────────────────────────

type V8Route = 'PO' | 'SL' | 'IM' | 'IV' | 'SC' | 'IN' | 'TD' | 'INH' | 'PR';
type V8DoseUnit = 'mg' | 'g' | 'mcg' | 'IU';

interface V8DoseRange {
  min: number;
  max: number;
  typical: number;
  unit?: V8DoseUnit;
}

interface V8RoutePk {
  ka_hr?: number;
  ke_hr?: number;
  V_L?: number;
  F?: number;
  alpha_hr?: number;
  beta_hr?: number;
  k21_hr?: number;
  source_pmid?: string;
}

type V8InteractionLevel =
  'synergistic' | 'beneficial' | 'caution' | 'warn' | 'major' | 'contraindicated';

interface V8InteractionRef {
  slug: string;
  name: string;
  level: V8InteractionLevel;
  note: string;
  timing?: string;
}

interface V8Compound {
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  mechanism: string;
  routes: V8Route[];
  doses: Partial<Record<V8Route, V8DoseRange>>;
  half_life_hr: Partial<Record<V8Route, number>>;
  pk?: Partial<Record<V8Route, V8RoutePk>>;
  interactions?: V8InteractionRef[];
  notes?: string;
  refs: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// v7 shapes (subset — we ignore traits, effects, interactions, etc.)
// ─────────────────────────────────────────────────────────────────────────────

interface V7PkParam {
  value: number;
  cite?: string | string[];
  ref?: { pmid?: string };
}

interface V7InteractionRef {
  slug?: string;
  name?: string;
  level?: string;
  note?: string;
  timing?: string;
}

interface V7Compound {
  slug?: string;
  name?: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  routes?: string[];
  dose?: string;
  absorption?: {
    half_life_h?: V7PkParam;
    ka_per_h?: V7PkParam;
    f_bioavailability?: V7PkParam;
    vd_l_kg?: V7PkParam;
  };
  interactions?: V7InteractionRef[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mappings
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_MAP: Record<string, V8Route | null> = {
  po: 'PO',
  sl: 'SL',
  sc: 'SC',
  im: 'IM',
  iv: 'IV',
  in: 'IN',
  top: 'TD', // v7 'topical' → v8 'transdermal' approximation
  inh: 'INH',
};

/**
 * Snake_case categories in v7 use underscores; v8 uses hyphens for the
 * one compound case ('amino-acid'). Map any drift here.
 */
const CATEGORY_MAP: Record<string, string> = {
  alkaloid: 'alkaloid',
  amino_acid: 'amino-acid',
  lipid: 'lipid',
  mineral: 'mineral',
  vitamin: 'vitamin',
  adaptogen: 'adaptogen',
  polyphenol: 'polyphenol',
  metabolite: 'metabolite',
  neurotransmitter: 'neurotransmitter',
  nucleotide: 'nucleotide',
  nucleoside: 'nucleoside',
  biologic: 'biologic',
  peptide: 'peptide',
  terpenoid: 'terpenoid',
  flavonoid: 'flavonoid',
  ketone: 'ketone',
  pharmacological: 'pharmacological',
  topical: 'topical',
};

const VALID_V8_CATEGORIES = new Set([
  'stimulant',
  'nootropic',
  'mineral',
  'vitamin',
  'adaptogen',
  'amino-acid',
  'lipid',
  'hormone',
  'sleep',
  'alkaloid',
  'polyphenol',
  'metabolite',
  'neurotransmitter',
  'nucleotide',
  'nucleoside',
  'biologic',
  'peptide',
  'terpenoid',
  'flavonoid',
  'ketone',
  'pharmacological',
  'topical',
  'other',
]);

// Slug regex from v8's Zod schema. v7 has compounds whose slugs use
// underscores; we transform "ashwagandha_ksm66" → "ashwagandha-ksm66".
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Round a dose value to a sensible precision based on magnitude. The
 * input range "1-12 mg" averages to typical=4.666... which renders
 * ugly; this collapses to 4.67 for a 1–9.99 value, and to integers
 * above 100. Without it, every imported compound carries a 16-digit
 * float through the JSON.
 */
function cleanDose(x: number): number {
  if (x === 0) return 0;
  if (x >= 100) return Math.round(x);
  if (x >= 10) return Math.round(x * 10) / 10;
  if (x >= 1) return Math.round(x * 100) / 100;
  return Math.round(x * 1000) / 1000;
}

/**
 * Pull mg/g/mcg/IU values out of free-text dose strings like
 *   "300–600 mg/day", "0.5 mg per day", "1000–5000 IU".
 * Returns null when nothing parseable is found — caller skips the entry.
 */
function parseDose(text: string | undefined): V8DoseRange | null {
  if (!text) return null;
  // Normalize unicode dashes.
  const t = text.replace(/[–—‐]/g, '-');

  // Try "X-Y unit" or "X – Y unit"
  const range = t.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(mg|g|mcg|µg|ug|IU)\b/i);
  if (range) {
    const min = parseFloat(range[1]!);
    const max = parseFloat(range[2]!);
    const unit = canonUnit(range[3]!);
    if (max <= 0) return null; // schema requires positive max + typical
    return {
      min: cleanDose(min),
      max: cleanDose(max),
      typical: cleanDose(min + (max - min) / 3),
      unit,
    };
  }

  // Single value "X unit"
  const single = t.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|µg|ug|IU)\b/i);
  if (single) {
    const v = parseFloat(single[1]!);
    if (v <= 0) return null;
    return {
      min: cleanDose(v),
      max: cleanDose(v),
      typical: cleanDose(v),
      unit: canonUnit(single[2]!),
    };
  }

  return null;
}

function canonUnit(u: string): V8DoseUnit {
  const lower = u.toLowerCase();
  if (lower === 'mg') return 'mg';
  if (lower === 'g') return 'g';
  if (lower === 'iu') return 'IU';
  if (lower === 'mcg' || lower === 'µg' || lower === 'ug') return 'mcg';
  return 'mg';
}

/**
 * Pull "pmid:NNNN" out of a v7 cite handle. Returns "PMID:NNNN" or null.
 * doi/fda/usp handles are dropped — v8's verifier is PubMed-only for now.
 */
function citeToRef(cite: string | string[] | undefined): string[] {
  if (!cite) return [];
  const arr = Array.isArray(cite) ? cite : [cite];
  const out: string[] = [];
  for (const c of arr) {
    const m = c.match(/^pmid:(\d+)$/i);
    if (m) out.push(`PMID:${m[1]}`);
  }
  return out;
}

function pmidsFromCompound(c: V7Compound & { cite?: string | string[] }): string[] {
  const set = new Set<string>(citeToRef(c.cite));
  // Also pull PMIDs from absorption[*].cite — these are the same study
  // most of the time but cheap to dedupe.
  const abs = c.absorption ?? {};
  for (const field of Object.values(abs)) {
    if (!field) continue;
    for (const ref of citeToRef(field.cite)) set.add(ref);
  }
  return [...set];
}

const VALID_INTERACTION_LEVELS = new Set<V8InteractionLevel>([
  'synergistic',
  'beneficial',
  'caution',
  'warn',
  'major',
  'contraindicated',
]);

/** Drop rows missing required fields; clamp level to the v8 enum. */
function mapInteractions(v7s: V7InteractionRef[] | undefined): V8InteractionRef[] | undefined {
  if (!v7s || v7s.length === 0) return undefined;
  const out: V8InteractionRef[] = [];
  for (const r of v7s) {
    if (!r.slug || !r.name || !r.level || !r.note) continue;
    const level = r.level.toLowerCase() as V8InteractionLevel;
    if (!VALID_INTERACTION_LEVELS.has(level)) continue;
    out.push({
      slug: normalizeSlug(r.slug),
      name: r.name,
      level,
      note: r.note,
      timing: r.timing,
    });
  }
  return out.length > 0 ? out : undefined;
}

/**
 * Merge interactions from v7 into an existing v8 entry, dedup by
 * counterparty slug + level. v8's authored entries (if any) win on
 * tie. Result is undefined when neither source has any.
 */
function mergeInteractions(
  v8: V8InteractionRef[] | undefined,
  v7Mapped: V8InteractionRef[] | undefined,
): V8InteractionRef[] | undefined {
  const a = v8 ?? [];
  const b = v7Mapped ?? [];
  if (a.length === 0 && b.length === 0) return undefined;
  const seen = new Set<string>();
  const out: V8InteractionRef[] = [];
  for (const r of [...a, ...b]) {
    const key = `${r.slug}@${r.level}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out.length > 0 ? out : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping
// ─────────────────────────────────────────────────────────────────────────────

const PARTICIPATING_WEIGHT_KG = 70;

/** Pick the route to attach PK + dose data to. v7 stores them at compound
 *  level (one absorption block) without per-route differentiation. */
function primaryRoute(routes: V8Route[]): V8Route {
  return routes[0] ?? 'PO';
}

function mapCompound(v7: V7Compound & { cite?: string | string[] }): V8Compound | null {
  if (!v7.slug || !v7.name) return null;
  const slug = normalizeSlug(v7.slug);
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(slug)) return null;

  // Routes
  const routes: V8Route[] = [];
  for (const r of v7.routes ?? []) {
    const mapped = ROUTE_MAP[r.toLowerCase()];
    if (mapped && !routes.includes(mapped)) routes.push(mapped);
  }
  if (routes.length === 0) routes.push('PO'); // sensible default

  // Category
  const v7cat = (v7.category ?? '').toLowerCase();
  const v8cat = CATEGORY_MAP[v7cat] ?? 'other';
  if (!VALID_V8_CATEGORIES.has(v8cat)) return null;

  // Mechanism
  const mechanism = (v7.mechanism ?? '').trim();
  if (!mechanism) return null; // v8 schema requires non-empty

  // Doses (single parsed range applied to every route — v7 doesn't
  // differentiate per-route doses in the free-text field).
  const doses: V8Compound['doses'] = {};
  const parsed = parseDose(v7.dose);
  if (parsed) {
    for (const r of routes) doses[r] = parsed;
  } else {
    // No parseable dose — don't ship a dose block. Surfaces show "—"
    // and the user authors a real range when they touch this compound.
  }

  // PK + half-life
  const half_life_hr: V8Compound['half_life_hr'] = {};
  let pk: V8Compound['pk'] = undefined;
  const abs = v7.absorption;
  if (abs) {
    const route = primaryRoute(routes);
    if (abs.half_life_h?.value) {
      half_life_hr[route] = abs.half_life_h.value;
    }
    const routePk: V8RoutePk = {};
    if (abs.ka_per_h?.value) routePk.ka_hr = abs.ka_per_h.value;
    if (abs.f_bioavailability?.value != null) {
      // F can come in as 0.99 or as a percentage like 60. Clamp to [0, 1].
      const raw = abs.f_bioavailability.value;
      routePk.F = raw > 1 ? raw / 100 : raw;
      if (routePk.F > 1) routePk.F = 1;
      if (routePk.F < 0) routePk.F = 0;
    }
    if (abs.vd_l_kg?.value) {
      routePk.V_L = abs.vd_l_kg.value * PARTICIPATING_WEIGHT_KG;
    }
    // Source PMID from any of the four absorption sub-fields.
    const sourceCites = [
      abs.half_life_h?.cite,
      abs.ka_per_h?.cite,
      abs.f_bioavailability?.cite,
      abs.vd_l_kg?.cite,
    ];
    for (const c of sourceCites) {
      const pmids = citeToRef(c);
      if (pmids.length > 0) {
        routePk.source_pmid = pmids[0];
        break;
      }
    }
    if (Object.keys(routePk).length > 0) {
      pk = { [route]: routePk } as V8Compound['pk'];
    }
  }

  // refs
  const refs = pmidsFromCompound(v7);

  // Interactions — v7 stores them as one-direction edges per compound.
  // We carry them through unchanged; the caller can dedupe across the
  // graph if it wants symmetric edges. Drop entries with missing fields.
  const interactions = mapInteractions(v7.interactions);

  return {
    slug,
    name: v7.name,
    aliases: v7.aliases ?? [],
    category: v8cat,
    mechanism,
    routes,
    doses,
    half_life_hr,
    pk,
    interactions,
    refs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Discover + read v7 files
// ─────────────────────────────────────────────────────────────────────────────

function readAllV7Compounds(): Array<V7Compound & { cite?: string | string[] }> {
  const out: Array<V7Compound & { cite?: string | string[] }> = [];
  const categories = readdirSync(V7_ROOT).filter((n) => statSync(join(V7_ROOT, n)).isDirectory());
  for (const cat of categories) {
    const catDir = join(V7_ROOT, cat);
    for (const file of readdirSync(catDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = readFileSync(join(catDir, file), 'utf-8');
        const parsed = JSON.parse(raw) as V7Compound & { cite?: string | string[] };
        out.push(parsed);
      } catch (e) {
        console.warn(`  skip ${cat}/${file}: ${(e as Error).message}`);
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  console.log(`Reading v7 compounds from ${V7_ROOT}...`);
  const v7s = readAllV7Compounds();
  console.log(`  ${v7s.length} v7 compound files read.`);

  const existingV8 = JSON.parse(readFileSync(V8_OUT, 'utf-8')) as V8Compound[];
  const bySlug = new Map<string, V8Compound>();
  for (const c of existingV8) bySlug.set(c.slug, c);
  const v8PreserveCount = bySlug.size;

  let imported = 0;
  let skipped = 0;
  let collided = 0;
  let interactionsMergedOnCollision = 0;

  for (const v7 of v7s) {
    const mapped = mapCompound(v7);
    if (!mapped) {
      skipped++;
      continue;
    }
    const existing = bySlug.get(mapped.slug);
    if (existing) {
      // v8 entry wins for compound-level fields. We DO merge interactions
      // additively — v8 might have hand-authored some, v7 carries the
      // bulk; keeping the union improves the warning surface without
      // overwriting any author work.
      const before = existing.interactions?.length ?? 0;
      const merged = mergeInteractions(existing.interactions, mapped.interactions);
      existing.interactions = merged;
      const after = merged?.length ?? 0;
      if (after > before) interactionsMergedOnCollision += after - before;
      collided++;
      continue;
    }
    bySlug.set(mapped.slug, mapped);
    imported++;
  }

  // Write back, sorted alphabetically by slug for predictable diffs.
  const merged = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  writeFileSync(V8_OUT, JSON.stringify(merged, null, 2) + '\n', 'utf-8');

  // Tally final interaction count for reporting.
  let totalEdges = 0;
  for (const c of merged) totalEdges += c.interactions?.length ?? 0;

  console.log('');
  console.log(`v8 preserved:               ${v8PreserveCount}`);
  console.log(`v7 imported:                ${imported}`);
  console.log(`v7 collided:                ${collided}  (kept v8 compound, merged edges)`);
  console.log(`v7 skipped:                 ${skipped}    (missing required fields / unmappable)`);
  console.log(`new edges on collisions:    ${interactionsMergedOnCollision}`);
  console.log(`total compounds in v8:      ${merged.length}`);
  console.log(`total interaction edges:    ${totalEdges}`);
  console.log('');
  console.log(`Wrote ${V8_OUT}`);
  console.log('Next: `pnpm registry:verify` to confirm every PMID still resolves.');
}

main();
