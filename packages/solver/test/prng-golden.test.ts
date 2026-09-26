/**
 * prng-golden.test.ts — pins the Mulberry32 stream and the order in which
 * `samplePkMultipliers` consumes it (ka, ke, V, F).
 *
 * The MC restructuring (amplitude factoring) must NOT change which random
 * draws happen, or in what order — doing so silently shifts every MC band
 * and only surfaces later as an opaque failure in the determinism KATs.
 * These snapshots fail *immediately* and *legibly* if the draw order
 * regresses, while staying green for any change that preserves it.
 */
import { describe, it, expect } from 'vitest';
import { rng, samplePkMultipliers } from '../src/mc';
import type { IIV } from '../src/types';

describe('PRNG stream golden', () => {
  it('rng(seed) yields a stable sequence', () => {
    const r = rng(12345);
    const out = Array.from({ length: 40 }, () => r());
    expect(out).toMatchSnapshot();
  });

  it('samplePkMultipliers consumes the stream in ka,ke,V,F order', () => {
    // All CVs nonzero so every one of the four draws actually fires (a
    // cv<=0 short-circuits before consuming uniforms — see lognormalSample).
    const iiv: IIV = { ka_cv: 0.3, ke_cv: 0.25, V_cv: 0.2, F_cv: 0.1 };
    const r = rng(42);
    const vecs = Array.from({ length: 5 }, () => samplePkMultipliers(iiv, r));
    expect(vecs).toMatchSnapshot();
  });

  it('a zero-CV param still returns 1 without disturbing later draws', () => {
    // ke_cv=0 must NOT consume uniforms (lognormalSample returns early), so
    // V and F draws land on the same stream positions as if ke were absent.
    const iivNoKe: IIV = { ka_cv: 0.3, ke_cv: 0, V_cv: 0.2, F_cv: 0.1 };
    const r = rng(7);
    const m = samplePkMultipliers(iivNoKe, r);
    expect(m.ke).toBe(1);
    expect(m).toMatchSnapshot();
  });
});
