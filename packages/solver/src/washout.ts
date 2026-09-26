/**
 * washout.ts — per-compound dose-relevance windowing.
 *
 * "How far back do I have to look at the dose history before older doses
 * stop mattering?" The answer is compound-specific: caffeine (t½≈5h) is
 * gone in a day, a retatrutide depot (t½≈6d) lingers for weeks. The old
 * flat 14-day `INTAKE_BACKFILL_HR` was simultaneously too long for fast
 * compounds (wasted work) and too short for long-acting ones (truncated a
 * still-present depot, which is exactly what made the at-now reading drift
 * with the chart horizon).
 *
 * We size the lookback at WASHOUT_HALFLIVES terminal half-lives. Eight,
 * not the intuitive five or seven, because regular dosing accumulates: the
 * steady-state amplification R = 1/(1−e^(−ke·τ)) scales the *dropped* tail
 * as well as the retained doses, so the aggregate truncation error is up to
 * R·2^(−m). For fast accumulation (e.g. q4h on a 5h half-life, R≈2.35) that
 * needs 2^(−m) < ~0.0043, i.e. m ≈ 8, to keep the dropped mass under ~1%.
 *
 * A second, absolute guard (`intakeStillRelevant`) keeps any dose whose
 * *current* contribution is still above an ε·reference floor even past the
 * half-life cutoff — cheap insurance against dropping a large loading dose.
 *
 * Michaelis–Menten is special: at saturation the apparent half-life grows
 * with concentration, so `ln2/(Vmax/Km)` badly underestimates the tail, and
 * `plasmaAt` has no closed form to test the floor against. MM compounds get
 * a conservative flat window instead.
 */

import type { Route } from '@xeno/core';
import type { PkParams } from './types';
import { isMichaelisMentenPk, isTwoCompPk, isZeroOrderPk } from './types';
import { plasmaAt } from './pk';

/** Terminal half-lives of lookback. See module comment for why 8. */
export const WASHOUT_HALFLIVES = 8;

/** Conservative flat window for MM compounds (saturable tails outlast any
 *  small-Cp half-life estimate). 30 days covers phenytoin-class kinetics. */
export const MM_WASHOUT_HR = 30 * 24;

/** Default absolute floor for `intakeStillRelevant`, relative to the
 *  compound's reference Cmax. 0.1% is well below the IIV noise the bands
 *  already model and below display precision. */
export const RELEVANCE_EPS = 1e-3;

/**
 * Hours after a dose beyond which it has washed out for this PK. Includes
 * absorption lag and, for zero-order release, the release duration (the
 * eliminating tail only starts once release ends).
 */
export function washoutHr(pk: PkParams): number {
  const lag = pk.lag_hr != null && pk.lag_hr > 0 ? pk.lag_hr : 0;

  // MM: no exponential tail; use the conservative flat window.
  if (isMichaelisMentenPk(pk)) return lag + MM_WASHOUT_HR;

  // Terminal elimination rate: 2-comp decays terminally at β; 1-comp and
  // zero-order (which pairs with 1-comp disposition) decay at ke.
  const kTerm = isTwoCompPk(pk) ? pk.beta_hr : pk.ke_hr;
  let hr = (WASHOUT_HALFLIVES * Math.LN2) / kTerm;

  // Zero-order: the e^(−ke·(t−T)) tail doesn't begin until release ends.
  if (isZeroOrderPk(pk)) hr += pk.zo_dur_hr;

  return lag + hr;
}

/**
 * Should a dose this old still be fed to the solver / at-now reduction?
 * True if it is within the washout window OR (for linear PK) its current
 * standalone contribution is still above ε·refCmax. `ageHr` is elapsed
 * hours since the dose relative to the moment of interest (now, or the
 * curve's end). `refCmax` is the compound's reference peak (single typical
 * dose); pass 0 to disable the absolute floor and use the time cutoff only.
 */
export function intakeStillRelevant(
  ageHr: number,
  dose_mg: number,
  pk: PkParams,
  route: Route,
  refCmax: number,
  eps: number = RELEVANCE_EPS,
): boolean {
  if (ageHr < 0) return true; // future dose — never pruned by washout
  if (ageHr <= washoutHr(pk)) return true;
  // Past the window. MM has no valid closed-form contribution to test, and
  // its flat window is already conservative — drop it.
  if (refCmax <= 0 || isMichaelisMentenPk(pk)) return false;
  return plasmaAt(ageHr, dose_mg, pk, route) >= eps * refCmax;
}
