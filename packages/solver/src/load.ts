/**
 * load.ts — composite "system load".
 *
 * "System load" aggregates a stack's total pharmacological burden into one
 * curve. Each compound's plasma curve is normalized against its own reference
 * concentration (`referenceCmax` — the Cmax of a typical single dose) and the
 * fractions are summed. The unit is therefore "typical-single-dose-peak
 * equivalents": load = 1.0 is one compound sitting at its typical peak; a
 * multi-compound stack whose curves overlap reads 2×, 3×, … Faithfully linear
 * and unbounded — a 10-compound stack genuinely IS ~10× the burden of one — and
 * the surfaces auto-scale the sparkline to its own peak, so the shape stays
 * legible while the headline number carries the honest magnitude.
 *
 * Normalizing to each compound's own Cmax is the only fabrication-free way to
 * combine heterogeneous compounds (a vitamin and a benzodiazepine share no mg/L
 * scale). What load deliberately is NOT — because each needs per-compound data
 * that isn't citable, so modeling it would be false precision, not fidelity:
 *   - System-specific (CNS / liver / kidney) — needs authored organ-burden weights
 *   - Synergy-aware beyond the already-applied kinetic DDI edges
 *   - Tolerance-aware — needs a non-superposable chronic-exposure state variable
 *
 * (Through v0.2 this squashed the sum through `tanh(0.5·Σ)` into [0,1); that
 * anchor — "one compound at Cmax ≈ 0.46" — was arbitrary and nonlinearly
 * distorted the sparkline shape. Removed: the raw sum is the honest measure.)
 */

import type { Slug } from '@xeno/core';

interface LoadInput {
  /** Mean plasma curves keyed by slug. mg/L. */
  plasma: Map<Slug, Float32Array>;
  /** Per-compound reference concentration for normalization — the typical
   *  single-dose Cmax (`referenceCmax`). mg/L. */
  reference: Map<Slug, number>;
  /** Number of timeline samples — all curves must match this length. */
  T: number;
}

/**
 * Composite load = Σ_compounds Cp(t) / referenceCmax, in typical-single-dose-peak
 * equivalents (≥ 0, unbounded). One compound at its typical peak contributes 1.0.
 * Empty input → all zeros. A compound with no positive reference is skipped.
 */
export function compositeLoad(input: LoadInput): Float32Array {
  const out = new Float32Array(input.T);
  if (input.plasma.size === 0) return out;

  for (const [slug, curve] of input.plasma) {
    const ref = input.reference.get(slug);
    if (!ref || ref <= 0) continue;
    for (let t = 0; t < input.T; t++) {
      out[t]! += curve[t]! / ref;
    }
  }
  return out;
}
