/**
 * pk.ts — analytic pharmacokinetics, one- and two-compartment.
 *
 * One-compartment Bateman (first-order absorption + first-order elimination):
 *
 *     C(t) = (F · D · ka) / (V · (ka − ke)) · ( e^(−ke·t) − e^(−ka·t) )
 *
 * IV bolus 1-comp (instantaneous absorption) collapses to:
 *
 *     C(t) = (D / V) · e^(−ke·t)
 *
 * Two-compartment IV bolus (bi-exponential disposition):
 *
 *     C(t) = (D / V₁) · [ A · e^(−α·t) + B · e^(−β·t) ]
 *
 * with A = (α − k₂₁)/(α − β), B = (k₂₁ − β)/(α − β); A + B = 1, so
 * C(0) = D/V₁ as expected.
 *
 * Two-compartment PO (first-order absorption + bi-exponential disposition):
 *
 *     C(t) = (F · D · ka / V₁) · [
 *         (k₂₁ − α)/((ka − α)(β − α)) · e^(−α·t)
 *       + (k₂₁ − β)/((ka − β)(α − β)) · e^(−β·t)
 *       + (k₂₁ − ka)/((α − ka)(β − ka)) · e^(−ka·t)
 *     ]
 *
 * Zero-order absorption (transdermal patch / depot / IV infusion) — F·D
 * enters at constant rate over [0, T], T = zo_dur_hr:
 *
 *     0 ≤ t ≤ T:  C(t) = (F·D)/(V·ke·T) · (1 − e^(−ke·t))
 *     t > T:      C(t) = (F·D)/(V·ke·T) · (1 − e^(−ke·T)) · e^(−ke·(t−T))
 *
 * An optional lag (lag_hr) time-shifts the start of any absorption mode.
 *
 * All forms exact under linear-PK assumptions. Multi-dose is by
 * superposition since the system is linear. No numerical integration.
 *
 * Edge cases handled:
 *   - 1-comp ka ≈ ke (removable singularity → t·e^(−k·t) limit)
 *   - 2-comp α ≈ β or rate coincidences with ka (rare; fall back to
 *     1-comp Bateman so the curve stays smooth instead of NaN)
 */

import type { Route } from '@xeno/core';
import type { PkParams } from './types';
import { isTwoCompPk, isZeroOrderPk } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Single-dose plasma concentration — the math
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plasma concentration at hours `t_hr` after a single dose.
 * `dose_mg` is the actual mass administered (after route-specific scaling
 * by the caller — e.g. inhaled dose × deposition fraction). For IV routes,
 * pass `route='IV'` and ka is ignored.
 *
 * Returns mg/L. Returns 0 for t_hr < 0 (intakes that haven't happened yet).
 */
export function plasmaAt(t_hr: number, dose_mg: number, pk: PkParams, route: Route): number {
  if (t_hr < 0) return 0;

  // Absorption lag: input doesn't start until lag_hr. A pure time-shift,
  // valid for every absorption mode below (first-order, zero-order, IV).
  if (pk.lag_hr != null && pk.lag_hr > 0) {
    t_hr -= pk.lag_hr;
    if (t_hr < 0) return 0;
  }

  // Zero-order (constant-rate) absorption — transdermal patch / depot, and
  // also the IV-infusion case. Takes precedence over the first-order paths
  // when zo_dur_hr is set; v1 pairs it with 1-comp disposition.
  if (isZeroOrderPk(pk)) {
    return plasmaAtZeroOrder1Comp(t_hr, dose_mg, pk, route);
  }

  // Dispatch on parameter shape: full 2-comp set (α + β + k₂₁) routes
  // to the bi-exponential math; otherwise fall through to 1-comp.
  if (isTwoCompPk(pk)) {
    return route === 'IV' ? plasmaAt2CompIV(t_hr, dose_mg, pk) : plasmaAt2CompPO(t_hr, dose_mg, pk);
  }

  if (route === 'IV') {
    // Instantaneous absorption: at t=0, full dose distributed in V.
    return (dose_mg / pk.V_L) * Math.exp(-pk.ke_hr * t_hr);
  }

  const { ka_hr, ke_hr, V_L, F } = pk;

  // Flip-flop / coincident-rates fallback. The Bateman closed form has a
  // removable singularity at ka == ke; the limit gives the t·e^(−k·t) form.
  if (Math.abs(ka_hr - ke_hr) < 1e-6) {
    return (F * dose_mg * ka_hr * t_hr * Math.exp(-ke_hr * t_hr)) / V_L;
  }

  const prefactor = (F * dose_mg * ka_hr) / (V_L * (ka_hr - ke_hr));
  return prefactor * (Math.exp(-ke_hr * t_hr) - Math.exp(-ka_hr * t_hr));
}

// ─────────────────────────────────────────────────────────────────────────────
// Two-compartment forms
// ─────────────────────────────────────────────────────────────────────────────

const COINCIDENCE_EPS = 1e-6;

/**
 * IV bolus, two-compartment:
 *
 *     C(t) = (D / V₁) · [ A · e^(−α·t) + B · e^(−β·t) ]
 *
 * Coefficients derived from microconstants (FAST e^(−α·t) carries the larger
 * weight; A + B = 1 → C(0) = D/V₁):
 *     A = (α − k₂₁) / (α − β)   on e^(−α·t)
 *     B = (k₂₁ − β) / (α − β)   on e^(−β·t)
 *
 * α ≈ β is unphysical (would mean instant equilibration); we fall back
 * to 1-compartment elimination using β so the curve stays smooth
 * instead of exploding at the singularity.
 */
function plasmaAt2CompIV(
  t_hr: number,
  dose_mg: number,
  pk: PkParams & { alpha_hr: number; beta_hr: number; k21_hr: number },
): number {
  const { V_L, alpha_hr: a, beta_hr: b, k21_hr: k21 } = pk;
  if (Math.abs(a - b) < COINCIDENCE_EPS) {
    return (dose_mg / V_L) * Math.exp(-b * t_hr);
  }
  // Standard (Gibaldi–Perrier) coefficients: the FAST exponential e^(−α·t)
  // carries (α − k21)/(α − β), the slow e^(−β·t) carries (k21 − β)/(α − β).
  // (A + B = 1 → C(0) = D/V₁.) These were previously swapped, which removed the
  // fast distribution phase and inflated AUC by V1·k10 vs the textbook
  // AUC = Dose/CL = D/(V₁·k₁₀); verified against the numerical integrator.
  const A = (a - k21) / (a - b);
  const B = (k21 - b) / (a - b);
  return (dose_mg / V_L) * (A * Math.exp(-a * t_hr) + B * Math.exp(-b * t_hr));
}

/**
 * Oral / IM / SC, two-compartment:
 *
 *     C(t) = (F · D · ka / V₁) · [
 *         (k₂₁ − α)/((ka − α)(β − α)) · e^(−α·t)
 *       + (k₂₁ − β)/((ka − β)(α − β)) · e^(−β·t)
 *       + (k₂₁ − ka)/((α − ka)(β − ka)) · e^(−ka·t)
 *     ]
 *
 * Reduces to the IV-bolus 2-comp form as ka → ∞. When ka coincides with
 * α or β within 1e-6, we shift ka by a sliver to keep the closed form
 * defined — the alternative is the limit form, but with floats the
 * shift is invisibly small and avoids a second branch.
 */
function plasmaAt2CompPO(
  t_hr: number,
  dose_mg: number,
  pk: PkParams & { alpha_hr: number; beta_hr: number; k21_hr: number },
): number {
  let { ka_hr } = pk;
  const { V_L, F, alpha_hr: a, beta_hr: b, k21_hr: k21 } = pk;

  // Nudge ka off any coincidences with α, β, or itself. Accumulated
  // floating error swamps the perturbation.
  if (Math.abs(ka_hr - a) < COINCIDENCE_EPS) ka_hr += COINCIDENCE_EPS * 10;
  if (Math.abs(ka_hr - b) < COINCIDENCE_EPS) ka_hr += COINCIDENCE_EPS * 10;
  if (Math.abs(a - b) < COINCIDENCE_EPS) {
    // Pathological 2-comp where α ≈ β — degrade gracefully to 1-comp PO
    // using β as the elimination rate. Authoring should not produce this.
    if (Math.abs(ka_hr - b) < COINCIDENCE_EPS) {
      return (F * dose_mg * ka_hr * t_hr * Math.exp(-b * t_hr)) / V_L;
    }
    return (
      ((F * dose_mg * ka_hr) / (V_L * (ka_hr - b))) *
      (Math.exp(-b * t_hr) - Math.exp(-ka_hr * t_hr))
    );
  }

  const prefactor = (F * dose_mg * ka_hr) / V_L;
  const term_a = ((k21 - a) / ((ka_hr - a) * (b - a))) * Math.exp(-a * t_hr);
  const term_b = ((k21 - b) / ((ka_hr - b) * (a - b))) * Math.exp(-b * t_hr);
  const term_ka = ((k21 - ka_hr) / ((a - ka_hr) * (b - ka_hr))) * Math.exp(-ka_hr * t_hr);
  return prefactor * (term_a + term_b + term_ka);
}

// ─────────────────────────────────────────────────────────────────────────────
// Zero-order absorption (constant-rate input) — patches / depots / IV infusion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One-compartment with zero-order absorption: F·D is delivered at a constant
 * rate k0 = F·D / T over the window [0, T] (T = zo_dur_hr), then stops. This
 * is the infusion model — the correct shape for transdermal patches and depot
 * injections, which release at ~constant rate rather than first-order.
 *
 *   during input (0 ≤ t ≤ T):  C(t) = k0/(V·ke) · (1 − e^(−ke·t))
 *   after input  (t > T):      C(t) = k0/(V·ke) · (1 − e^(−ke·T)) · e^(−ke·(t−T))
 *
 * Peak is at t = T (= end of release). Exact and linear → multi-dose
 * superposition and the DDI ke/F factors apply unchanged. Total AUC is
 * k0·T/(V·ke) = F·D/(V·ke) — identical to the first-order forms, so the
 * mass-conservation invariant holds regardless of absorption mode.
 *
 * `route` is accepted for signature parity; the math is route-agnostic (an IV
 * infusion is just this with F = 1).
 */
function plasmaAtZeroOrder1Comp(
  t_hr: number,
  dose_mg: number,
  pk: PkParams & { zo_dur_hr: number },
  _route: Route,
): number {
  const { zo_dur_hr: T, ke_hr: ke, V_L: V, F } = pk;
  const plateau = (F * dose_mg) / (V * ke * T); // = k0/(V·ke)
  if (t_hr <= T) {
    return plateau * (1 - Math.exp(-ke * t_hr));
  }
  return plateau * (1 - Math.exp(-ke * T)) * Math.exp(-ke * (t_hr - T));
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-dose curve over a sample grid
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sample plasma at every point in `t_hr_grid`. Returns a Float32Array of
 * the same length. Intentionally Float32 — solvers and worker postMessage
 * pay for what they hold, and the precision is well below the IIV noise
 * floor we're modeling against.
 */
export function plasmaCurve(
  t_hr_grid: Float64Array,
  dose_mg: number,
  pk: PkParams,
  route: Route,
): Float32Array {
  const out = new Float32Array(t_hr_grid.length);
  for (let i = 0; i < t_hr_grid.length; i++) {
    out[i] = plasmaAt(t_hr_grid[i]!, dose_mg, pk, route);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-dose superposition
// ─────────────────────────────────────────────────────────────────────────────

export interface Dose {
  /** Hours from horizon.start when the dose was taken */
  t_hr: number;
  dose_mg: number;
  route: Route;
}

/**
 * Add a dose's contribution onto an existing plasma buffer (in place).
 * Returns the same buffer for chaining. Negative t-grid values for samples
 * before the dose contribute 0, so the dose has no effect on the past.
 */
export function addDose(
  buf: Float32Array,
  t_hr_grid: Float64Array,
  dose: Dose,
  pk: PkParams,
): Float32Array {
  for (let i = 0; i < t_hr_grid.length; i++) {
    const dt = t_hr_grid[i]! - dose.t_hr;
    if (dt < 0) continue;
    buf[i]! += plasmaAt(dt, dose.dose_mg, pk, dose.route);
  }
  return buf;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shape helpers — useful for tests + UI annotations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Time of peak (Tmax) in hours, after a single oral dose. Closed form:
 *
 *     Tmax = ln(ka / ke) / (ka − ke)
 *
 * Used by tests, by the "next peak in N min" tile on Today, and by
 * sampling logic that needs to densify the grid around the peak.
 */
export function tmaxOral(pk: PkParams): number {
  const lag = pk.lag_hr != null && pk.lag_hr > 0 ? pk.lag_hr : 0;
  // Zero-order: concentration rises monotonically during input and falls
  // after, so the peak is exactly at the end of release.
  if (isZeroOrderPk(pk)) return lag + pk.zo_dur_hr;
  const { ka_hr, ke_hr } = pk;
  if (Math.abs(ka_hr - ke_hr) < 1e-6) return lag + 1 / ke_hr;
  return lag + Math.log(ka_hr / ke_hr) / (ka_hr - ke_hr);
}

/** Peak plasma concentration (Cmax) for a single oral dose. */
export function cmaxOral(dose_mg: number, pk: PkParams): number {
  return plasmaAt(tmaxOral(pk), dose_mg, pk, 'PO');
}

/**
 * Total area under the plasma curve from 0 → ∞, mg·hr/L. For a one-
 * compartment model this is F·D / (V·ke) — independent of the absorption
 * mode (first-order, zero-order, or IV all deliver the same total mass
 * F·D and clear it through the same V·ke). Used in the conservation test
 * (input mass must equal cleared mass).
 */
export function aucInfinity(dose_mg: number, pk: PkParams): number {
  return (pk.F * dose_mg) / (pk.V_L * pk.ke_hr);
}

// ─────────────────────────────────────────────────────────────────────────────
// Parameter resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Molecular weight at or above which a compound is defaulted to a protein-like
 * volume rather than the small-molecule 0.5 L/kg.
 *
 * Large proteins — antibodies, and proteins of this size generally — are too
 * big to cross capillary endothelium appreciably, so they stay in plasma and
 * the interstitium immediately around it. Their volumes cluster near plasma
 * volume regardless of target or indication, which is what makes a class
 * default legitimate here and not merely convenient.
 *
 * THE 10 kDa THRESHOLD IS UNDER-DETERMINED AND DELIBERATELY SO. This catalog's
 * authored volumes jump from kisspeptin at 5.8 kDa to somatropin at 22 kDa
 * with nothing in between, so any cut in that gap fits the evidence equally
 * well; 10 kDa is the round number inside it. What the evidence DOES pin down
 * is that the cut must fall above the 3–10 kDa peptides — see below.
 */
export const PROTEIN_MW_THRESHOLD_G_MOL = 10_000;

/**
 * Protein-like volume of distribution, per kg, at the 70 kg reference:
 * 0.08 L/kg = 5.6 L, the geometric mean of this catalog's 18 authored
 * volumes at MW ≥ 10 kDa (range 3.1–9.25 L).
 *
 * VALIDATED BY LEAVE-ONE-OUT against those 18 compounds — hold each out,
 * predict it from the geometric mean of the other 17, and measure fold error
 * (which is also the fold error in reported concentration, since C ∝ 1/V):
 *
 *     0.5 L/kg (35 L):  6.30x geometric-mean error, worst case 11.3x
 *     0.08 L/kg:        1.37x geometric-mean error, worst case 1.9x
 *     closer for 18 of 18 compounds
 *
 * THE SAME TEST REFUSES TO EXTEND THIS DOWNWARD, and that is the reason for
 * the threshold rather than a blanket "large molecule" rule. For the 3–10 kDa
 * peptides (n=6: semaglutide, kisspeptin, calcitonin, exenatide, teriparatide,
 * tesamorelin) the authored volumes span 7.7–200 L, a 26-fold spread with 35 L
 * sitting inside it, and a class default is WORSE than the status quo —
 * 3.67x against 3.17x, closer on only 4 of 6. Widening the class to all
 * MW ≥ 3 kDa improves the aggregate (1.89x) purely because 18 proteins
 * outvote 6 peptides, while pushing the worst single case from 11.3x to
 * 27.9x. So the aggregate win is not the test; the per-class win is.
 *
 * A once-weekly acylated peptide like retatrutide or tirzepatide therefore
 * still defaults to 0.5 L/kg. That is not an endorsement of 35 L for them —
 * it is an admission that this catalog cannot yet say what their volume is,
 * which is what the `defaulted` flag on the surfaces exists to convey.
 */
export const PROTEIN_V_L_PER_KG = 0.08;

/** Small-molecule fallback volume, per kg — the middle of that range. */
export const SMALL_MOLECULE_V_L_PER_KG = 0.5;

/**
 * Default volume of distribution when a record authors none, in L, at
 * `weight_kg`. Split by molecular weight because one number cannot serve
 * both a 300 Da amine that partitions into tissue and a 148 kDa antibody
 * that cannot leave the bloodstream; defaulting the antibody to the amine's
 * volume was a 6-fold error on every one of them. Compounds with no authored
 * `mw_g_mol` get the small-molecule default, since the catalog's unauthored
 * MWs are overwhelmingly small molecules.
 */
export function defaultVolumeL(weight_kg: number, mw_g_mol?: number): number {
  const perKg =
    mw_g_mol != null && mw_g_mol >= PROTEIN_MW_THRESHOLD_G_MOL
      ? PROTEIN_V_L_PER_KG
      : SMALL_MOLECULE_V_L_PER_KG;
  return perKg * weight_kg;
}

/**
 * Fill in any missing PK fields with sensible defaults so downstream math
 * never sees NaN. Half-life → ke is always derivable; ka and V have to
 * come from somewhere.
 *
 * Defaults are deliberately wide-tolerance: when used, the IIV bands will
 * be honest about the uncertainty. Surfaces mark such curves — see
 * buildPkMap's `defaulted`, which keys off the RECORD's missing fields and so
 * still fires for a compound served by the protein default below: a better
 * default is still not a measurement of this compound.
 *
 * `mw_g_mol` is read for defaulting only and is not part of PkParams — it
 * selects which volume default applies. It is passed in by `pkParamsForRoute`,
 * the one place a registry Compound becomes solver params.
 */
export function resolvePk(
  partial: Partial<PkParams> & { half_life_hr?: number; mw_g_mol?: number },
  weight_kg = 70,
): PkParams {
  const has2Comp = partial.alpha_hr != null && partial.beta_hr != null && partial.k21_hr != null;
  const hasMm =
    partial.mm_vmax_per_hr != null &&
    partial.mm_vmax_per_hr > 0 &&
    partial.mm_km_mg_per_l != null &&
    partial.mm_km_mg_per_l > 0;

  // For MM, ke is unused at the math level (the integrator drives
  // elimination off Vmax/Km). We still derive a "linear-equivalent"
  // ke from Vmax/Km at the small-Cp limit so any legacy reader of
  // ke_hr (tests, surfaces showing approximate half-life) sees a
  // sensible number. For 2-comp, β replaces ke. For 1-comp, half-life
  // is the canonical authoring path.
  let ke_hr: number;
  if (hasMm) {
    // Low-Cp linear-equivalent ke = Vmax/Km + any parallel first-order pathway.
    ke_hr = partial.mm_vmax_per_hr! / partial.mm_km_mg_per_l! + (partial.mm_linear_ke_hr ?? 0);
  } else if (has2Comp) {
    ke_hr = partial.beta_hr!;
  } else {
    ke_hr = partial.ke_hr ?? (partial.half_life_hr ? Math.LN2 / partial.half_life_hr : NaN);
  }
  if (!Number.isFinite(ke_hr) || ke_hr <= 0) {
    throw new Error(
      'resolvePk: need ke_hr, half_life_hr, 2-comp params, or MM params to derive an elimination rate',
    );
  }
  return {
    ka_hr: partial.ka_hr ?? 1.0, // 1/hr ≈ 40-min absorption half-life — broadly typical for PO
    ke_hr,
    V_L: partial.V_L ?? defaultVolumeL(weight_kg, partial.mw_g_mol),
    F: partial.F ?? 0.9,
    alpha_hr: partial.alpha_hr,
    beta_hr: partial.beta_hr,
    k21_hr: partial.k21_hr,
    mm_vmax_per_hr: partial.mm_vmax_per_hr,
    mm_km_mg_per_l: partial.mm_km_mg_per_l,
    mm_linear_ke_hr: partial.mm_linear_ke_hr,
    zo_dur_hr: partial.zo_dur_hr,
    lag_hr: partial.lag_hr,
    source_pmid: partial.source_pmid,
  };
}
