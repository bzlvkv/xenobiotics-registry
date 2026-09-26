/**
 * compositeLoad — the aggregate "system load" curve, in typical-single-dose-peak
 * equivalents (Σ Cp/referenceCmax). The point of the v0.2→ rewrite: it is LINEAR
 * and unbounded (no tanh squash), so a stack's burden adds up faithfully.
 */
import { describe, it, expect } from 'vitest';
import { compositeLoad } from '../src/load';

const f = (...v: number[]) => Float32Array.from(v);

describe('compositeLoad — typical-single-dose-peak equivalents', () => {
  it('empty input → all zeros', () => {
    const out = compositeLoad({ plasma: new Map(), reference: new Map(), T: 3 });
    expect([...out]).toEqual([0, 0, 0]);
  });

  it('one compound at its reference Cmax reads 1.0', () => {
    const out = compositeLoad({
      plasma: new Map([['a', f(0, 5, 10)]]),
      reference: new Map([['a', 10]]),
      T: 3,
    });
    expect([...out]).toEqual([0, 0.5, 1]);
  });

  it('is additive and linear — summed fractions pass through unchanged (no squash)', () => {
    // a at 1× + b at 2× → 3× at that sample; the old tanh(0.5·1.5) would give ≈0.905.
    const out = compositeLoad({
      plasma: new Map([
        ['a', f(10)],
        ['b', f(40)],
      ]),
      reference: new Map([
        ['a', 10],
        ['b', 20],
      ]),
      T: 1,
    });
    expect(out[0]).toBeCloseTo(3, 6);
  });

  it('skips compounds with no positive reference', () => {
    const out = compositeLoad({
      plasma: new Map([
        ['a', f(10)],
        ['b', f(99)],
      ]),
      reference: new Map([
        ['a', 10],
        ['b', 0],
      ]),
      T: 1,
    });
    expect(out[0]).toBeCloseTo(1, 6); // b (ref 0) skipped
  });
});
