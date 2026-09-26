/**
 * effect-compartment.ts — Ce(t) lagging plasma by keo.
 *
 * The classical effect-compartment model treats the perceived-effect site
 * as a virtual second compartment fed from plasma:
 *
 *     dCe/dt = keo · ( Cp(t) − Ce(t) )
 *
 * For arbitrary plasma input we'd integrate numerically. Since our PK
 * forms (1-comp Bateman, 2-comp PO/IV) are sums of decaying exponentials,
 * we exploit linearity and convolve the impulse response analytically:
 *
 *     If Cp(t) = Σ Aᵢ · e^(−kᵢ·t)  (multi-exp; nonzero for t≥0)
 *     then Ce(t) = Σ ( Aᵢ · keo / (keo − kᵢ) ) · ( e^(−kᵢ·t) − e^(−keo·t) )
 *
 * The solver doesn't actually need to know the (Aᵢ, kᵢ) decomposition —
 * we work numerically against the sampled Cp grid using the discrete
 * recurrence form of the same ODE:
 *
 *     Ce[i+1] = Ce[i] · e^(−keo·Δt)
 *             + (Cp[i] + Cp[i+1])/2 · (1 − e^(−keo·Δt))
 *
 * (trapezoidal-input zero-order hold). This is exact for piecewise-linear
 * Cp and matches the analytic formula at sample points to within float
 * error. Cost is O(T) per compound and stays inside the perf budget.
 *
 * Why piecewise linear instead of zero-order hold? At small Δt and a
 * smooth Cp this is invisibly close to the analytic Bateman/2-comp form
 * we'd otherwise have to convolve term-by-term, and it works for any Cp
 * shape (future PK forms, summed multi-dose curves, MC realizations).
 */

/**
 * Compute the effect-compartment concentration Ce(t) by trapezoidal
 * integration against a uniformly-spaced plasma sample buffer.
 *
 * @param plasma  Sampled Cp at uniform Δt steps. Length T.
 * @param dt_hr   Sample spacing in hours.
 * @param keo_per_h  Plasma → effect-site rate constant, 1/hr. Larger
 *                   means tighter tracking of plasma; smaller means
 *                   longer PD tail.
 * @returns Ce sampled at the same grid. Same length as plasma. Ce[0]
 *          starts at 0 (effect site empty before any dose).
 */
export function effectCurve(plasma: Float32Array, dt_hr: number, keo_per_h: number): Float32Array {
  const T = plasma.length;
  const out = new Float32Array(T);
  if (T === 0 || keo_per_h <= 0) return out;

  const decay = Math.exp(-keo_per_h * dt_hr);
  const inflow = 1 - decay;

  out[0] = 0;
  for (let i = 0; i < T - 1; i++) {
    const cpAvg = (plasma[i]! + plasma[i + 1]!) * 0.5;
    out[i + 1] = out[i]! * decay + cpAvg * inflow;
  }
  return out;
}

/**
 * Steady-state Ce ≡ Cp at constant Cp; useful as a sanity invariant in
 * tests and for analytic Cmax_e estimation when authoring keo values.
 */
export function ceSteadyState(cp: number): number {
  return cp;
}
