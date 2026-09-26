/**
 * loadFoods tests — the validator rules.
 *
 * v12 ships no curated food catalog: food logging is live USDA FDC search, and
 * `loadFoods` now validates FDC-derived and user-authored presets rather than a
 * shipped file. So these test the RULES against fixtures. The assertions that
 * used to read data/foods.json went with the catalog.
 */

import { describe, it, expect } from 'vitest';
import { loadFoods } from '../src';

const base = {
  slug: 'test-cola',
  name: 'Test Cola',
  category: 'soda',
  serving: '355 mL can',
  items: [{ compound: 'caffeine', dose: 34, dose_unit: 'mg' }],
  source: { kind: 'label' },
};

const builder = {
  slug: 'test-build-a-bowl',
  name: 'Build a Bowl',
  category: 'fast_food',
  path: ['Testeria'],
  serving: '1 bowl (your build)',
  items: [],
  options: [
    {
      name: 'Protein',
      pick: 'one',
      choices: [
        { label: 'Steak (3.5 oz)', items: [{ compound: 'sodium', dose: 600, dose_unit: 'mg' }] },
        { label: 'Tofu (3.5 oz)', items: [{ compound: 'sodium', dose: 200, dose_unit: 'mg' }] },
      ],
    },
    {
      name: 'Toppings',
      pick: 'many',
      choices: [
        {
          label: 'Cheese (1 oz)',
          default: true,
          items: [{ compound: 'sodium', dose: 180, dose_unit: 'mg' }],
        },
        { label: 'Lettuce (0.25 oz)', items: [] },
      ],
    },
  ],
  source: { kind: 'label' },
};

describe('loadFoods', () => {
  it('accepts a fixed-recipe preset and a builder preset (empty items + options)', () => {
    const out = loadFoods([base, builder] as never);
    expect(out.map((f) => f.slug).sort()).toEqual(['test-build-a-bowl', 'test-cola']);
    const b = out.find((f) => f.slug === 'test-build-a-bowl')!;
    expect(b.options?.[0]?.choices.map((c) => c.label)).toEqual([
      'Steak (3.5 oz)',
      'Tofu (3.5 oz)',
    ]);
  });

  it('rejects empty items WITHOUT options', () => {
    expect(() => loadFoods([{ ...base, items: [] }] as never)).toThrow(/items/);
  });

  it('rejects a pick-one group with two defaults', () => {
    const bad = JSON.parse(JSON.stringify(builder));
    bad.options[0].choices[0].default = true;
    bad.options[0].choices[1].default = true;
    expect(() => loadFoods([bad] as never)).toThrow(/default/);
  });

  it('rejects a single-choice group (a picker with nothing to pick)', () => {
    const bad = JSON.parse(JSON.stringify(builder));
    bad.options[0].choices = [bad.options[0].choices[0]];
    expect(() => loadFoods([bad] as never)).toThrow(/invalid food preset/);
  });

  it('throws on duplicate slug', () => {
    expect(() => loadFoods([base, { ...base, name: 'Test Cola Two' }] as never)).toThrow(
      /duplicate food slug/,
    );
  });
});
