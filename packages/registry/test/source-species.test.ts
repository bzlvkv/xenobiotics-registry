/**
 * Guards the loader against silently stripping `source_species`.
 *
 * The registry's Zod schemas drop unknown keys, so a field added to
 * compounds.json without a matching loader entry does not exist as far as the
 * app is concerned — the failure is invisible, because nothing throws and the
 * surface just renders a blank. This test is the tripwire for that.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegistry } from '../src/loader';

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'compounds.json');
const raw = JSON.parse(readFileSync(dataPath, 'utf-8')) as Record<string, unknown>[];

function probe() {
  const c = structuredClone(raw.find((r) => r.slug === 'ghrp-2')!) as Record<string, any>;
  c.pk.SC.source_species = 'rat';
  c.effect_compartment = { keo_per_h: 1.13, source_pmid: 'PMID:9543135', source_species: 'rat' };
  return c;
}

describe('source_species round-trips through the loader', () => {
  it('survives on pk[route]', () => {
    const [c] = loadRegistry([probe()]);
    expect(c.pk?.SC?.source_species).toBe('rat');
  });

  it('survives on effect_compartment', () => {
    const [c] = loadRegistry([probe()]);
    expect(c.effect_compartment?.source_species).toBe('rat');
  });

  it('rejects a species outside the enum rather than accepting it silently', () => {
    const bad = probe();
    bad.pk.SC.source_species = 'hamster';
    expect(() => loadRegistry([bad])).toThrow();
  });

  it('leaves human values unmarked', () => {
    const c = structuredClone(raw.find((r) => r.slug === 'ghrp-2')!) as Record<string, any>;
    const [loaded] = loadRegistry([c]);
    expect(loaded.pk?.SC?.source_species).toBeUndefined();
  });
});
