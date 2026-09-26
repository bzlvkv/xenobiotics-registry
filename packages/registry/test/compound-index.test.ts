/**
 * compoundIndex — retired-slug forwarding.
 *
 * The behaviour under test is what keeps a slug retirement from quietly breaking
 * every reference to the old name. If a lookup misses, nothing throws — the
 * compound just comes back undefined and the surface renders "no data", which is
 * exactly the kind of silent loss a test has to catch.
 */

import { describe, expect, it } from 'vitest';
import { compoundIndex, findCompound } from '../src/index';
import type { Compound } from '../src/index';

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
const ethanol = makeCompound({ slug: 'ethanol', name: 'Ethanol', retired_slugs: ['alcohol'] });
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

  // `compound.retired-collision` rejects this outright, but the ordering guarantee
  // matters independently: a live record must never be shadowed by another
  // compound's tombstone, because that failure is invisible.
  it('lets a LIVE slug win over another compound stale claim on it', () => {
    const squatter = makeCompound({
      slug: 'squatter',
      name: 'Squatter',
      retired_slugs: ['caffeine'],
    });
    expect(compoundIndex([squatter, caffeine]).get('caffeine')).toBe(caffeine);
    // Input order must not change the outcome.
    expect(compoundIndex([caffeine, squatter]).get('caffeine')).toBe(caffeine);
  });

  it('findCompound follows a retirement for a single lookup', () => {
    expect(findCompound(catalog, 'alcohol')).toBe(ethanol);
    expect(findCompound(catalog, 'ethanol')).toBe(ethanol);
    expect(findCompound(catalog, 'nope')).toBeUndefined();
  });
});
