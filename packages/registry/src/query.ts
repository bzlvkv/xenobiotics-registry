/**
 * Query helpers — small surface, pure functions over a loaded Compound[].
 *
 * The UI (compound picker, library) sits on top of these. Free-text paths
 * (`search`, `resolveLabelName`) stay linear scans — they have to read every
 * record anyway. The point lookup (`bySlug`), though, is now indexed: see the
 * cache note on `slugIndex` below.
 */

import { compoundIndex, type Compound, type Slug } from '@xeno/core';

/**
 * Per-array slug index, keyed on the Compound[] *identity*.
 *
 * `bySlug` used to do `compounds.find(...)` — an O(n) scan that was fine at
 * the "flat array is small enough" scale the original comment assumed. But
 * the catalog is now ~1100+ compounds and `bySlug` is called per-row inside
 * the reactive plasma-chart derives (which re-run on every 30s now-tick) and
 * from ~15 sites across the stores, so the scan shows up as steady
 * main-thread churn. Caching one `Map<slug, Compound>` per array identity
 * makes repeat lookups O(1) without changing the signature: every hot caller
 * passes the same immutable `bundledCompounds` reference, so the index is
 * built once and reused for the life of that array. A distinct array (a
 * search/filter result) gets its own index entry; a one-shot throwaway array
 * costs exactly one build — the same work the old `find` did on first call,
 * no regression. The WeakMap keys on the array, so an index is garbage-
 * collected with the array it describes.
 *
 * In-place growth IS handled: `bundledCompounds` is exported empty and filled
 * in place by `ensureBundledCompounds()` (the lazy-registry defer), so a lookup
 * that races ahead of the fill would otherwise cache an empty/partial index and
 * keep returning `undefined` for every compound loaded later — a flaky "the
 * picker shows no result" bug. We tag the cached index with the array length it
 * was built at and rebuild when the length changes, so the index self-heals the
 * moment the array grows. (Length, not Map size: a duplicate slug would shrink
 * the Map and force a rebuild every call — registry slugs are unique, but
 * comparing length keeps it correct regardless.) Per-element in-place mutation
 * that doesn't change length is still unsupported; the codebase builds new
 * arrays for query results rather than splicing, so that never happens.
 */
const slugIndexCache = new WeakMap<Compound[], { len: number; idx: Map<Slug, Compound> }>();

function slugIndex(compounds: Compound[]): Map<Slug, Compound> {
  let cached = slugIndexCache.get(compounds);
  if (!cached || cached.len !== compounds.length) {
    // compoundIndex also keys every RETIRED slug onto the compound that
    // absorbed it, so an intake logged under a merged-away slug still resolves
    // here. That is the whole forwarding path for ~96 bySlug call sites.
    cached = { len: compounds.length, idx: compoundIndex(compounds) };
    slugIndexCache.set(compounds, cached);
  }
  return cached.idx;
}

export function bySlug(compounds: Compound[], slug: Slug): Compound | undefined {
  return slugIndex(compounds).get(slug);
}

/**
 * Substring + alias search. Case-insensitive. Ranks exact slug/name matches
 * first, then prefix matches, then anywhere matches. We score instead of
 * sorting alphabetically because typing "mag" should surface "magnesium-*"
 * before "ergothioneine" even though both contain the substring.
 */
export function search(compounds: Compound[], q: string, limit = 25): Compound[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return compounds.slice(0, limit);

  const scored: Array<{ c: Compound; score: number }> = [];
  for (const c of compounds) {
    const score = scoreCompound(c, needle);
    if (score > 0) scored.push({ c, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
    .slice(0, limit)
    .map((s) => s.c);
}

function scoreCompound(c: Compound, needle: string): number {
  const name = c.name.toLowerCase();
  const slug = c.slug.toLowerCase();
  if (name === needle || slug === needle) return 100;
  if (name.startsWith(needle) || slug.startsWith(needle)) return 60;
  for (const a of c.aliases) {
    const al = a.toLowerCase();
    if (al === needle) return 80;
    if (al.startsWith(needle)) return 50;
    if (al.includes(needle)) return 20;
  }
  if (name.includes(needle) || slug.includes(needle)) return 30;
  return 0;
}

export function byCategory(compounds: Compound[], cat: Compound['category']): Compound[] {
  return compounds.filter((c) => c.category === cat);
}

/** Lowercase, collapse runs of non-alphanumerics to single spaces, and
 *  pad with surrounding spaces so callers can test ` ${needle} ` for
 *  whole-word containment without regex-escaping the needle. */
function normalizeForMatch(s: string): string {
  return ` ${s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

/**
 * Inverse of `search`: given free-text as printed on a product label or
 * handwritten in a log, find the registry compound whose canonical name
 * or alias appears *inside* that text. `search` asks "is the query a
 * substring of a compound name?"; this asks the reverse — "does this
 * printed string contain a known compound?" — which is what you want
 * when an OCR model hands back a row it couldn't itself match (e.g.
 * "Vitamin D3 (as Cholecalciferol)", "GPC/Cycad™ (Alpha GPC Spec)",
 * "AstraPure® (Astragalus membranaceus Root)").
 *
 * Matching is normalized (punctuation → spaces, lowercased) and
 * word-boundary anchored, so "iron" can't match inside "environment" and
 * "alpha-gpc" matches "Alpha GPC". Terms shorter than `minTermLen` (4)
 * are skipped — bare aliases like "B6"/"K2"/"P5P" would false-fire — and
 * the LONGEST matching term wins, so "Magnesium L-Threonate" resolves to
 * `magnesium-l-threonate` rather than the bare `magnesium`. Returns the
 * matched slug, or null when nothing confident matches (leave the row
 * for the user to pick manually).
 *
 * Used at the OCR → row boundary (StackCapture, BacklogCapture,
 * OcrCapture) to rescue ingredients the vision model left unmatched.
 */
export function resolveLabelName(
  compounds: Compound[],
  labelText: string,
  minTermLen = 4,
): Slug | null {
  const hay = normalizeForMatch(labelText);
  let best: { slug: Slug; len: number } | null = null;
  for (const c of compounds) {
    for (const term of [c.name, ...c.aliases]) {
      const norm = normalizeForMatch(term).trim();
      if (norm.length < minTermLen) continue;
      if (hay.includes(` ${norm} `) && (!best || norm.length > best.len)) {
        best = { slug: c.slug, len: norm.length };
      }
    }
  }
  return best?.slug ?? null;
}
