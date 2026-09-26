/**
 * dose-moiety.test.ts — a logged dose is a salt; the model wants the moiety.
 *
 * `doses[]` holds what a person takes, which is routinely a salt, while `pk[]`
 * describes the free base or the ion. Without a correction the solver divides a
 * salt mass by a free-base volume. lithium is the case that forced the field:
 * 900 mg of lithium carbonate is 169 mg of lithium, so the curve ran 5.32× high
 * and put a standard dose above the toxicity threshold on a drug titrated by
 * serum level.
 *
 * The second test is the one that matters long-term. The failure mode here is
 * NOT a wrong constant — it is a dose→mass call site that silently forgets to
 * apply it, which no numeric test would catch because it only shows up on the
 * handful of records that set the field. So the conversion is funnelled through
 * `analyteDoseMg`, and this asserts that nothing in the solver bypasses it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyteDoseMg, moietyFraction } from '../src/dose';
import { concentrationsAtNow } from '../src/atnow';
import type { PkParamMap, PkParams } from '../src/types';
import type { Intake } from '@xeno/core';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-08T12:00:00Z');

// Li₂CO₃ is 73.89 g/mol and carries 2 × 6.94 g/mol of lithium.
const LI_FRACTION = (2 * 6.94) / 73.89;

const LITHIUM: PkParams = { ka_hr: 1, ke_hr: Math.LN2 / 15.34, V_L: 43.4, F: 0.9 };

function intake(dose: number, ageHr = 3.24): Intake {
  const at = new Date(NOW - ageHr * HOUR).toISOString();
  return {
    id: `li-${dose}`,
    compound: 'lithium',
    dose,
    dose_unit: 'mg',
    route: 'PO',
    at,
    created_at: at,
    updated_at: at,
  };
}

describe('analyteDoseMg', () => {
  it('is the identity when no moiety fraction is set', () => {
    expect(analyteDoseMg(900, 'mg')).toBe(900);
    expect(analyteDoseMg(900, 'mg', {})).toBe(900);
    expect(analyteDoseMg(900, 'mg', null)).toBe(900);
  });

  it('converts a salt dose to the moiety it carries', () => {
    expect(analyteDoseMg(900, 'mg', { dose_moiety_fraction: LI_FRACTION })).toBeCloseTo(169.06, 2);
  });

  it('composes with the unit conversion rather than replacing it', () => {
    // 1 g of the carbonate is the same moiety mass as 1000 mg of it.
    expect(analyteDoseMg(1, 'g', { dose_moiety_fraction: LI_FRACTION })).toBeCloseTo(
      analyteDoseMg(1000, 'mg', { dose_moiety_fraction: LI_FRACTION }),
      10,
    );
  });

  it('rejects a nonsensical fraction rather than propagating it', () => {
    // The loader already constrains this to (0, 1]; the runtime refuses to
    // amplify a dose if a bad value ever reaches it from elsewhere.
    expect(moietyFraction({ dose_moiety_fraction: 0 })).toBe(1);
    expect(moietyFraction({ dose_moiety_fraction: -0.5 })).toBe(1);
    expect(moietyFraction({ dose_moiety_fraction: 1.4 })).toBe(1);
    expect(moietyFraction({ dose_moiety_fraction: LI_FRACTION })).toBeCloseTo(0.18785, 5);
  });
});

describe('the fraction reaches the plasma curve', () => {
  it('scales Cp exactly linearly, and by the lithium factor', () => {
    const bare: PkParamMap = new Map([['lithium', { PO: LITHIUM }]]);
    const corrected: PkParamMap = new Map([
      ['lithium', { PO: { ...LITHIUM, dose_moiety_fraction: LI_FRACTION } }],
    ]);
    const doses = [intake(900)];
    const before = concentrationsAtNow({ intakes: doses, pkParams: bare, nowMs: NOW }).get(
      'lithium',
    )!;
    const after = concentrationsAtNow({ intakes: doses, pkParams: corrected, nowMs: NOW }).get(
      'lithium',
    )!;

    expect(before).toBeGreaterThan(0);
    expect(after / before).toBeCloseTo(LI_FRACTION, 10);
    // 5.32× is the overstatement the field exists to remove.
    expect(before / after).toBeCloseTo(5.324, 2);
  });

  it('leaves every record that does not set it untouched', () => {
    const bare: PkParamMap = new Map([['lithium', { PO: LITHIUM }]]);
    const explicitOne: PkParamMap = new Map([
      ['lithium', { PO: { ...LITHIUM, dose_moiety_fraction: 1 } }],
    ]);
    const doses = [intake(900), intake(300, 12)];
    expect(
      concentrationsAtNow({ intakes: doses, pkParams: explicitOne, nowMs: NOW }).get('lithium'),
    ).toBeCloseTo(
      concentrationsAtNow({ intakes: doses, pkParams: bare, nowMs: NOW }).get('lithium')!,
      12,
    );
  });
});

describe('no call site bypasses the conversion', () => {
  it('no solver module calls doseToMg directly; every conversion goes through analyteDoseMg', () => {
    // dose.ts is the one place allowed to reach for the raw unit conversion.
    const offenders: string[] = [];
    for (const f of readdirSync(SRC).filter((x) => x.endsWith('.ts'))) {
      if (f === 'dose.ts') continue;
      const src = readFileSync(join(SRC, f), 'utf-8');
      for (const [i, line] of src.split('\n').entries()) {
        if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) continue;
        if (/\bdoseToMg\s*\(/.test(line)) offenders.push(`${f}:${i + 1}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
