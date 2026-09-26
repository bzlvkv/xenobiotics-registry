/**
 * hill.ts — Hill–Langmuir receptor-occupancy curve.
 *
 *     occupancy(Ce) = emax · Ceⁿ / (ec50ⁿ + Ceⁿ)
 *
 * Where:
 *   - Ce is the effect-site concentration (mg/L), driving the receptor
 *   - ec50 is the Ce at half-maximum occupancy (mg/L)
 *   - n is the Hill coefficient: n=1 → hyperbolic (single-site binding),
 *     n>1 → cooperative sigmoid, n<1 → negative-cooperativity flat top
 *   - emax is the saturating occupancy fraction in [0, 1]; usually 1.0
 *
 * Numerically stable for any nonnegative Ce: when Ce → 0, occupancy → 0;
 * when Ce → ∞, occupancy → emax. We don't add tolerance bands here — IIV
 * sampling at the PK level already produces realistic spread; per-receptor
 * Hill noise can be authored later if literature reports it.
 */

import type { ReceptorSite } from '@xeno/core';

/**
 * The multiplier taking the solver's TOTAL-drug effect-site concentration to
 * the one this site's `ec50_mg_l` is actually referenced to.
 *
 * An `in_vitro_ki` — which is what almost every authored row holds — is a
 * FREE-drug affinity measured in a buffer or membrane prep, so it must be
 * compared against free plasma, `Cp x fu`. Comparing it against total plasma
 * overstates occupancy by about 1/fu; for the 90-99%-bound molecules that
 * dominate the catalog that is one to two orders of magnitude.
 *
 * An `in_vivo_plasma_ec50` is already referenced to total plasma, and a
 * `whole_blood_ic50` was measured in a matrix that already contains albumin and
 * AAG at physiological concentration — so neither takes a correction. Applying
 * fu to a whole-blood COX IC50 would double-correct by 1/fu, which for
 * diclofenac is 333-fold.
 *
 * `fu` absent or non-finite yields 1 — the pre-correction behaviour — so a
 * compound without an authored fraction unbound is left exactly as it was
 * rather than silently re-scaled.
 */
export function freeFractionMultiplier(site: ReceptorSite, fu?: number): number {
  if (site.basis === 'in_vivo_plasma_ec50' || site.basis === 'whole_blood_ic50') return 1;
  if (fu == null || !Number.isFinite(fu) || fu <= 0 || fu > 1) return 1;
  return fu;
}

/**
 * Single-point Hill occupancy at effect-site concentration `ce_mg_l` (TOTAL
 * drug). `fu` is the compound's fraction unbound in plasma; omit it to get the
 * uncorrected curve.
 */
export function hillOccupancyAt(ce_mg_l: number, site: ReceptorSite, fu?: number): number {
  if (ce_mg_l <= 0) return 0;
  const c = ce_mg_l * freeFractionMultiplier(site, fu);
  const cn = Math.pow(c, site.hill_n);
  const ec50n = Math.pow(site.ec50_mg_l, site.hill_n);
  return (site.emax * cn) / (ec50n + cn);
}

/**
 * Sample occupancy across a Ce-vs-time buffer for one receptor site.
 * Returns occupancy in [0, emax] at every sample.
 */
export function hillCurve(ce: Float32Array, site: ReceptorSite, fu?: number): Float32Array {
  const T = ce.length;
  const out = new Float32Array(T);
  const { emax, ec50_mg_l: ec50, hill_n: n } = site;
  // Total drug -> the concentration this site's ec50 is referenced to. 1 when
  // no fraction unbound is authored, so the curve is unchanged.
  const f = freeFractionMultiplier(site, fu);

  // Hyperbolic single-site binding (the common case): pow(x, 1) === x in
  // IEEE, so skip both pow calls entirely. Byte-identical to the general
  // branch, just without the per-sample exponentials.
  if (n === 1) {
    for (let i = 0; i < T; i++) {
      const c = ce[i]! * f;
      out[i] = c > 0 ? (emax * c) / (ec50 + c) : 0;
    }
    return out;
  }

  // ec50ⁿ is constant across the buffer — hoist it out of the loop instead
  // of recomputing the same pow() at every one of T samples.
  const ec50n = Math.pow(ec50, n);
  for (let i = 0; i < T; i++) {
    const c = ce[i]! * f;
    if (c <= 0) {
      out[i] = 0;
      continue;
    }
    const cn = Math.pow(c, n);
    out[i] = (emax * cn) / (ec50n + cn);
  }
  return out;
}

/**
 * Combine N per-compound occupancy curves into one stack-wide curve via
 * probabilistic union, assuming independent binding events:
 *
 *     comp(t) = 1 − Π ( 1 − occᵢ(t) )
 *
 * Equivalent to "what's the probability the receptor is occupied by AT
 * LEAST ONE bound molecule at time t?" Holds when the compounds bind at
 * non-competing sites or when total occupancy is well below saturation
 * for each individual compound. For full orthosteric competition, the
 * upstream model would need to renormalise per-compound occupancies; we
 * accept the approximation here because (a) most authored compounds don't
 * have competing entries on the same receptor, and (b) when they do, the
 * per-compound occupancies will already be small.
 */
export function compositeOccupancyCurve(curves: Float32Array[]): Float32Array {
  if (curves.length === 0) return new Float32Array(0);
  const T = curves[0]!.length;
  const out = new Float32Array(T);
  for (let t = 0; t < T; t++) {
    let unbound = 1;
    for (let i = 0; i < curves.length; i++) {
      const o = curves[i]![t]!;
      unbound *= 1 - o;
    }
    out[t] = 1 - unbound;
  }
  return out;
}
