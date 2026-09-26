/**
 * compoundIndex — retired-slug forwarding.
 *
 * The behaviour under test is what keeps a slug retirement from quietly
 * destroying user history. `Intake.compound` stores a slug and the op log is
 * append-only, so intakes logged before a merge still name the retired slug.
 * If the lookup misses, nothing throws — the compound just loses its PK and
 * shows up as "no PK on file", which is exactly the kind of silent loss a test
 * has to catch.
 */
import { describe, it, expect } from 'vitest';
import type { Compound } from '../src/types';
import { compoundIndex, resolveCompound } from '../src/compound-index';

function makeCompound(partial: Partial<Compound> & { slug: string; name: string }): Compound {
  return {
    aliases: [],
    category: 'other',
    mechanism: '.',
    routes: ['PO'],
    doses: { PO: { min: 1, max: 100, typical: 10, unit: 'mg' } },
    half_life_hr: {},
    refs: [],
    ...partial,
  };
}

const tyrosine = makeCompound({
  slug: 'tyrosine',
  name: 'Tyrosine',
  retired_slugs: ['l-tyrosine'],
});
const ethanol = makeCompound({
  slug: 'ethanol',
  name: 'Ethanol',
  retired_slugs: ['alcohol'],
});
const caffeine = makeCompound({ slug: 'caffeine', name: 'Caffeine' });

const catalog = [tyrosine, ethanol, caffeine];

describe('compoundIndex', () => {
  it('resolves a canonical slug to its own compound', () => {
    expect(compoundIndex(catalog).get('tyrosine')).toBe(tyrosine);
  });

  it('resolves a retired slug to the compound that absorbed it', () => {
    const idx = compoundIndex(catalog);
    expect(idx.get('l-tyrosine')).toBe(tyrosine);
    expect(idx.get('alcohol')).toBe(ethanol);
  });

  it('returns undefined for a slug nothing claims', () => {
    expect(compoundIndex(catalog).get('not-a-compound')).toBeUndefined();
  });

  it('handles compounds with no retired_slugs', () => {
    expect(compoundIndex(catalog).get('caffeine')).toBe(caffeine);
  });

  it('indexes every retired slug when one compound absorbed several', () => {
    const merged = makeCompound({
      slug: 'arginine',
      name: 'Arginine',
      retired_slugs: ['l-arginine', 'arginine-hcl'],
    });
    const idx = compoundIndex([merged]);
    expect(idx.get('l-arginine')).toBe(merged);
    expect(idx.get('arginine-hcl')).toBe(merged);
    expect(idx.get('arginine')).toBe(merged);
  });

  // data-lint rejects this outright (compound.retired-collision), but the
  // ordering guarantee matters: a live record must never be shadowed by
  // another compound's tombstone, because that failure is invisible.
  it('lets a LIVE slug win over another compound stale claim on it', () => {
    const squatter = makeCompound({
      slug: 'squatter',
      name: 'Squatter',
      retired_slugs: ['caffeine'],
    });
    expect(compoundIndex([squatter, caffeine]).get('caffeine')).toBe(caffeine);
    // Order of the input array must not change the outcome.
    expect(compoundIndex([caffeine, squatter]).get('caffeine')).toBe(caffeine);
  });

  it('resolveCompound follows a retirement for a single lookup', () => {
    expect(resolveCompound(catalog, 'alcohol')).toBe(ethanol);
    expect(resolveCompound(catalog, 'ethanol')).toBe(ethanol);
    expect(resolveCompound(catalog, 'nope')).toBeUndefined();
  });
});
