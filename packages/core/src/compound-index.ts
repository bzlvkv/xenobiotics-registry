/**
 * Slug → Compound index with retired-slug forwarding.
 *
 * Lives in core rather than in the registry package because the three places
 * that map USER data onto the catalog sit in different packages — the solver
 * (building PK params per logged intake), oplog (achievements over intake
 * history) and the app's Today/plasma surfaces — and only core is a dependency
 * of all of them. Building the map in one place is what keeps forwarding from
 * being half-applied: a lookup that misses an alias does not error, it returns
 * undefined, and the compound silently loses its curve.
 *
 * See `Compound.retired_slugs` for why forwarding is needed at all.
 */
import type { Compound, Slug } from './types';

/**
 * Build a lookup keyed by every name a compound answers to: its canonical slug
 * plus any slug it absorbed in a merge.
 *
 * Canonical slugs are written last so that if a retired slug ever collides
 * with a live one, the LIVE record wins the key. data-lint rejects that
 * collision outright (`compound.retired-collision`), so this is a belt-and-
 * braces ordering rather than an expected case — but the failure it prevents
 * (a live compound shadowed by another's tombstone) would be silent.
 */
export function compoundIndex(compounds: readonly Compound[]): Map<Slug, Compound> {
  const idx = new Map<Slug, Compound>();
  for (const c of compounds) {
    for (const retired of c.retired_slugs ?? []) idx.set(retired, c);
  }
  for (const c of compounds) idx.set(c.slug, c);
  return idx;
}

/**
 * Resolve one slug to the compound that now owns it, following a retirement if
 * there was one. Convenience wrapper for callers doing a single lookup; build
 * the index once with `compoundIndex` when resolving many.
 */
export function resolveCompound(compounds: readonly Compound[], slug: Slug): Compound | undefined {
  return compoundIndex(compounds).get(slug);
}
