/**
 * interactions.ts — apply pair-wise kinetic interactions to victim PK.
 *
 * v0.7 first-cut model: steady-state approximation. Each authored
 * interaction edge declares that the perpetrator (`from`) modifies the
 * victim (`to`) via one or more of:
 *
 *   - reversible inhibition  (ki_uM)
 *   - enzyme induction       (induction_factor at typical exposure)
 *   - protein-binding displacement (plasma_binding_displacement)
 *
 * The driver is the perpetrator's mean plasma concentration over the
 * simulation horizon. We average across the window because:
 *
 *   1. Most clinically meaningful interactions involve compounds that are
 *      both on board for several hours, so peak vs trough averaging
 *      smooths to "typical exposure during co-administration."
 *   2. The closed-form Bateman that downstream PK uses can't natively
 *      accept a time-varying ke. Recomputing curves at every Δt with
 *      adjusted parameters would require numerical integration; that's a
 *      meaningful performance hit for a first-cut model.
 *   3. Steady-state is the convention literature reports interactions in
 *      (the published "ke ↓ 30%" numbers are exposure-averaged, not
 *      instantaneous). Matching the literature framing keeps the math
 *      faithful to the cited evidence.
 *
 * The simplification we accept: an interaction stays at "full strength"
 * for the whole window even after the perpetrator has cleared. For most
 * realistic stacks this overestimates the effect's late-window impact by
 * a small amount; future v0.8+ time-varying integration would tighten it.
 *
 * Multiple perpetrators on the same victim multiply (e.g. caffeine and
 * grapefruit both inhibiting CYP3A4 → multiplied ke factors). This is
 * the conservative assumption; full mechanistic enzyme math would saturate.
 */

import type { InteractionKinetics, Route } from '@xeno/core';
import type { PkParams } from './types';
import { isMichaelisMentenPk, isTwoCompPk } from './types';

const HOUR_MS = 3_600_000;

/**
 * Enzyme resynthesis / turnover time constant (h). This one physical process —
 * a CYP's synthesis/degradation turnover, a multi-day-to-week timescale (CYP3A4
 * protein t½ ≈ 1–6 days) — rate-limits BOTH slow interaction transients we model:
 *   • induction: an inducer raises enzyme abundance over ~1–2 weeks and it
 *     reverses over ~2 weeks (rifampin);
 *   • mechanism-based inhibition recovery: after an irreversible inhibitor
 *     clears, activity returns only as new enzyme is made (grapefruit suppresses
 *     CYP3A4 for days after a single exposure).
 * We use one representative ~1-week time constant rather than fabricating per-
 * edge kdeg values we cannot cite. Real recovery spans ~2 days (gut CYP3A4) to
 * ~2 weeks (deep hepatic); 168 h is a defensible middle.
 */
export const ENZYME_TURNOVER_TAU_HR = 168;
/** @deprecated alias — induction shares the enzyme-turnover timescale. */
export const INDUCTION_TAU_HR = ENZYME_TURNOVER_TAU_HR;
/** Perpetrator counts as "on board" once its Cp exceeds this fraction of its own
 *  peak — scale-free, matching the co-administration-window presence convention
 *  used elsewhere in the pre-pass. Shared by the induction + MBI ramps. */
const PERPETRATOR_PRESENCE_FRACTION = 0.05;

/**
 * Compute the multiplicative factors one interaction edge contributes to
 * the victim's PK. Returns `{ke: 1, F: 1}` when the kinetics block has
 * no fields or when MW is missing for an inhibition adjustment.
 *
 * `opts.includeInduction` (default true) folds the steady-state induction factor
 * into `ke`. The time-varying victim path passes `false` and instead integrates
 * the slow induction ramp itself (see `inductionRamp`), because induction has
 * enzyme-turnover memory that a memoryless per-step factor can't express; the
 * scalar-fallback and surface-report paths keep the chronic steady-state factor.
 *
 * `opts.includeKi` (default true) folds the reversible Ki inhibition into `ke`.
 * The time-varying path passes `false` for a MECHANISM-BASED edge and instead
 * runs the same Ki depth through `mbiActivityEnvelope` (which adds the slow
 * enzyme-recovery tail) — displacement F still comes from here.
 */
export function computeInteractionFactors(
  kinetics: InteractionKinetics,
  perpetrator_mean_cp_mg_l: number,
  perpetrator_mw_g_mol: number | undefined,
  opts?: { includeInduction?: boolean; includeKi?: boolean },
): { ke: number; F: number } {
  let ke = 1;
  let F = 1;

  // ── Reversible inhibition ─────────────────────────────────────────
  // Cp / (Cp + Ki) is the fractional drop in clearance when ke ∝ free
  // enzyme — Michaelis–Menten form rearranged. At Cp = Ki, ke halves.
  // Convert µM Ki to mg/L using perpetrator's MW so units match Cp.
  if ((opts?.includeKi ?? true) && kinetics.ki_uM != null && perpetrator_mw_g_mol != null) {
    const ki_mg_l = (kinetics.ki_uM * perpetrator_mw_g_mol) / 1000;
    if (ki_mg_l > 0) {
      const drop = perpetrator_mean_cp_mg_l / (perpetrator_mean_cp_mg_l + ki_mg_l);
      // ke shrinks by `drop` fraction. Bound at a small floor so a very
      // strong inhibitor doesn't collapse ke to zero (which would make
      // the victim's plasma curve never decay — unphysiological).
      ke *= Math.max(0.05, 1 - drop);
    }
  }

  // ── Steady-state induction ────────────────────────────────────────
  // Induction is a first-order process with a multi-day timescale. The
  // time-varying victim path integrates that ramp explicitly (`inductionRamp`)
  // and calls us with includeInduction:false; the scalar-fallback and the
  // surface-report paths take the STEADY-STATE (plateau) factor here, which is
  // the honest "chronic co-administration" strength to combine/report.
  if (
    (opts?.includeInduction ?? true) &&
    kinetics.induction_factor != null &&
    kinetics.induction_factor > 0
  ) {
    ke *= kinetics.induction_factor;
  }

  // ── Plasma-protein-binding displacement ───────────────────────────
  // Bumping the victim's free fraction is approximated by scaling F.
  // Strictly F is "fraction reaching circulation" not "fraction free,"
  // but for a kinetic surface the effect is the same: more victim drug
  // shows up as plasma-active. Multiplicative over multiple displacers.
  if (kinetics.plasma_binding_displacement != null) {
    F *= 1 + kinetics.plasma_binding_displacement;
  }

  return { ke, F };
}

/**
 * Per-step ke multiplier for the SLOW enzyme-induction component of one edge,
 * integrated across a (uniform) time grid. Induction is not a switch: while the
 * perpetrator is on board the enzyme up-regulates toward the authored steady-
 * state factor over `INDUCTION_TAU_HR`, and relaxes back over the same timescale
 * once it clears. We track the fraction of full induction I(t) ∈ [0,1] with a
 * first-order fill toward the perpetrator's presence and return
 *   1 + (inductionFactor − 1)·I(t)
 * (1 at baseline, `inductionFactor` at plateau). The memoryless reversible-
 * inhibition / displacement factors are handled by `computeInteractionFactors`
 * with includeInduction:false — this is ONLY the inductive part.
 *
 * Presence is gated at 5% of the perpetrator's own peak Cp (scale-free). I is
 * warm-started at the grid's first sample from how long the perpetrator has
 * already been on board (`perpEarliestMs` before `gridStartMs`), so a stack that
 * predates the chart window doesn't restart the ramp from zero — the ramp is
 * anchored to the perpetrator's real first dose, keeping it horizon-invariant.
 */
export function inductionRamp(
  perpCp: Float32Array,
  dt_hr: number,
  inductionFactor: number,
  gridStartMs: number,
  perpEarliestMs: number,
): Float32Array {
  const T = perpCp.length;
  const out = new Float32Array(T).fill(1);
  if (T === 0 || !(dt_hr > 0) || !(inductionFactor > 0) || inductionFactor === 1) return out;

  let peak = 0;
  for (let i = 0; i < T; i++) if (perpCp[i]! > peak) peak = perpCp[i]!;
  if (peak <= 0) return out;
  const floor = peak * PERPETRATOR_PRESENCE_FRACTION;
  const present = (i: number): number => (perpCp[i]! >= floor ? 1 : 0);

  // Exact per-step solution of dI/dt = (target − I)/τ over a uniform step.
  const decay = Math.exp(-dt_hr / ENZYME_TURNOVER_TAU_HR);

  // Warm-start: if the perpetrator's first real dose predates the grid AND it's
  // still on board at the first sample, the enzyme has been ramping since then.
  // Continuous-presence approximation over the prior span (all we can assert
  // without integrating pre-grid; the un-warmed grid can't see it otherwise).
  let I = 0;
  if (Number.isFinite(perpEarliestMs) && perpEarliestMs < gridStartMs && present(0) === 1) {
    const priorHr = (gridStartMs - perpEarliestMs) / HOUR_MS;
    I = 1 - Math.exp(-priorHr / ENZYME_TURNOVER_TAU_HR);
  }
  out[0] = 1 + (inductionFactor - 1) * I;

  for (let i = 1; i < T; i++) {
    const target = present(i);
    I = target + (I - target) * decay;
    out[i] = 1 + (inductionFactor - 1) * I;
  }
  return out;
}

/** µM Ki → mg/L using the perpetrator's molecular weight, so it's comparable to
 *  Cp in mg/L. Mirrors the conversion in `computeInteractionFactors`. */
export function kiMgPerL(ki_uM: number, perpetrator_mw_g_mol: number): number {
  return (ki_uM * perpetrator_mw_g_mol) / 1000;
}

/** Reversible ke-multiplier at a given perpetrator Cp: 1 − Cp/(Cp+Ki), floored
 *  so a strong inhibitor can't collapse clearance to zero (matches the reversible
 *  branch of `computeInteractionFactors`). This is the inhibition DEPTH; the MBI
 *  envelope adds only the recovery tail on top of it. */
function reversibleActivity(cp: number, ki_mg_l: number): number {
  if (!(ki_mg_l > 0)) return 1;
  return Math.max(0.05, 1 - cp / (cp + ki_mg_l));
}

/**
 * Per-step ke multiplier for a MECHANISM-BASED (irreversible / time-dependent)
 * inhibitor across a uniform grid. Unlike reversible inhibition — which tracks
 * the perpetrator's instantaneous Cp and vanishes the moment it clears — a
 * mechanism-based inhibitor covalently inactivates the enzyme, so its effect
 * outlasts its plasma presence and returns only as new enzyme is synthesised.
 *
 * We model the enzyme-activity envelope A(t) ∈ [floor,1] with **fast attack,
 * slow release**:
 *   • attack (Cp rising → deeper inhibition): A drops to the Ki-calibrated
 *     reversible depth essentially at once — inactivation is fast relative to
 *     enzyme turnover, and the studies the Ki came from are steady-state;
 *   • release (Cp falling → recovery): A relaxes back UP toward the reversible
 *     target only on the enzyme-turnover time constant, so a single exposure
 *     leaves a multi-day tail.
 * The DEPTH is exactly the published-Ki reversible depth (no k_inact/K_I is
 * fabricated) — only the persistence is added. Warm-started to the reversible
 * equilibrium at the first sample (perpetrator already on board → inhibition
 * already established).
 */
export function mbiActivityEnvelope(
  perpCp: Float32Array,
  ki_mg_l: number,
  dt_hr: number,
): Float32Array {
  const T = perpCp.length;
  const out = new Float32Array(T).fill(1);
  if (T === 0 || !(dt_hr > 0) || !(ki_mg_l > 0)) return out;

  const decay = Math.exp(-dt_hr / ENZYME_TURNOVER_TAU_HR);
  let A = reversibleActivity(perpCp[0]!, ki_mg_l);
  out[0] = A;
  for (let i = 1; i < T; i++) {
    const target = reversibleActivity(perpCp[i]!, ki_mg_l);
    // Deeper inhibition establishes at once; recovery lags at the turnover rate.
    A = target <= A ? target : target + (A - target) * decay;
    out[i] = A;
  }
  return out;
}

/**
 * Apply a combined ke / F factor pair to every route's PK in a compound.
 * Used after stacking multiple inbound edges multiplicatively. Bounds
 * F to (0, 1] (bioavailability can't exceed 100%) and ke to a small
 * positive floor (clearance can't be zero).
 */
export function applyInteractionFactorsToRoutes(
  pkByRoute: Partial<Record<Route, PkParams>>,
  factors: { ke: number; F: number },
): Partial<Record<Route, PkParams>> {
  const clampF = (f: number): number => Math.min(1, Math.max(0.001, f));
  const out: Partial<Record<Route, PkParams>> = {};
  for (const [route, pk] of Object.entries(pkByRoute) as Array<[Route, PkParams | undefined]>) {
    if (!pk) continue;

    if (isTwoCompPk(pk)) {
      // A CYP interaction scales the CENTRAL ELIMINATION k10 only — distribution
      // (k12, k21) is unchanged. Scaling both α and β by the factor instead
      // would scale k10 = α·β/k21 by factor² (e.g. a 0.5× clearance DDI would
      // 4×-inflate AUC, not 2×). Recompute the macro eigenvalues from the
      // scaled k10. This matches the time-varying integrator's k10 scaling.
      const a = pk.alpha_hr,
        b = pk.beta_hr,
        k21 = pk.k21_hr;
      const k10 = (a * b) / k21;
      const k12 = Math.max(0, a + b - k21 - k10);
      const k10p = Math.max(1e-4, k10 * factors.ke);
      const sum = k10p + k12 + k21;
      const disc = Math.sqrt(Math.max(0, sum * sum - 4 * k10p * k21));
      out[route] = {
        ...pk,
        alpha_hr: (sum + disc) / 2,
        beta_hr: (sum - disc) / 2,
        k21_hr: k21,
        F: clampF(pk.F * factors.F),
      };
    } else if (isMichaelisMentenPk(pk)) {
      // Saturable victim: the interaction scales the enzyme's Vmax (an inhibitor
      // lowers it). ke_hr is inert for MM, so scaling it — as this function used
      // to — was a silent no-op for MM DDI victims.
      out[route] = {
        ...pk,
        mm_vmax_per_hr: Math.max(1e-6, pk.mm_vmax_per_hr * factors.ke),
        F: clampF(pk.F * factors.F),
      };
    } else {
      // 1-comp (and zero-order, whose ke drives the same elimination): scale ke.
      out[route] = {
        ...pk,
        ke_hr: Math.max(1e-4, pk.ke_hr * factors.ke),
        F: clampF(pk.F * factors.F),
      };
    }
  }
  return out;
}
