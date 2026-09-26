/**
 * Guards `source_species` specifically, because of what it is FOR.
 *
 * Animal-derived PK is allowed in this registry; passing it off as human is not.
 * The field is the entire mechanism for that distinction, and it is optional — so
 * a schema that dropped it would produce no error, no warning and no visible
 * change, just a rat half-life rendering exactly like a human one. That is the
 * failure this test exists for, and it is the concrete case behind the broader
 * no-field-loss test beside it.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadCompounds } from '../src/index';
import { DATA_DIR } from '../src/read';

const raw = JSON.parse(readFileSync(join(DATA_DIR, 'compounds.json'), 'utf-8')) as Record<
  string,
  unknown
>[];

/** ghrp-2 is the probe because it carries an SC route with no species of its own,
 *  so setting one proves the field survives rather than proving the file has one. */
function probe(): Record<string, unknown> {
  const c = structuredClone(raw.find((r) => r.slug === 'ghrp-2')!) as Record<string, never>;
  const pk = c.pk as unknown as Record<string, Record<string, unknown>>;
  pk.SC!.source_species = 'rat';
  (c as unknown as Record<string, unknown>).effect_compartment = {
    keo_per_h: 1.13,
    source_pmid: 'PMID:9543135',
    source_species: 'rat',
  };
  return c as unknown as Record<string, unknown>;
}

describe('source_species round-trips through the loader', () => {
  it('survives on pk[route]', () => {
    const [c] = loadCompounds([probe()]);
    expect(c!.pk?.SC?.source_species).toBe('rat');
  });

  it('survives on effect_compartment', () => {
    const [c] = loadCompounds([probe()]);
    expect(c!.effect_compartment?.source_species).toBe('rat');
  });

  it('rejects a species outside the enum rather than accepting it silently', () => {
    const bad = probe();
    (bad.pk as Record<string, Record<string, unknown>>).SC!.source_species = 'hamster';
    expect(() => loadCompounds([bad])).toThrow();
  });

  it('leaves human values unmarked', () => {
    // Omitted means human, so the common case must stay free of noise — a loader
    // that defaulted the field to 'human' would make every record claim a species
    // nobody authored.
    const c = structuredClone(raw.find((r) => r.slug === 'ghrp-2')!);
    const [loaded] = loadCompounds([c]);
    expect(loaded!.pk?.SC?.source_species).toBeUndefined();
  });

  it('the real catalog still carries its animal-derived values', () => {
    const compounds = loadCompounds(raw);
    const routeSpecies = compounds.flatMap((c) =>
      Object.values(c.pk ?? {}).filter((pk) => pk?.source_species),
    );
    const keoSpecies = compounds.filter((c) => c.effect_compartment?.source_species);
    expect(routeSpecies.length).toBeGreaterThan(0);
    expect(keoSpecies.length).toBeGreaterThan(0);
  });
});
