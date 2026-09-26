/**
 * @xeno/solver — public entry.
 *
 * The whole package is pure: no I/O, no globals, no clock reads. Surfaces
 * call solve(input) on a worker thread; tests call it directly. Same
 * function, identical output for identical inputs (including seed).
 *
 * v0.2 surface area:
 *   - solve() — the orchestrator
 *   - PK primitives (plasmaAt, plasmaCurve, addDose, tmaxOral, cmaxOral, ...)
 *     exposed for surfaces that want analytic forms without the full pipeline
 *     (e.g. Stack composer's "preview" mode while editing a dose)
 *   - Monte Carlo primitives (rng, samplePk, percentile) for tests + Plus
 *     tier's personal-calibration MAP fitting in v0.3+
 *
 * Anything not exported here is implementation detail and may move freely.
 */

export * from './types';
export * from './pk';
export { analyteDoseMg, moietyFraction } from './dose';
export * from './mc';
export { compositeLoad } from './load';
export { solve } from './pipeline';
export {
  buildPkMap,
  buildPkMapWithComposites,
  pkParamsForRoute,
  expandComposites,
  type BuiltPkMap,
  type CompositeGroup,
  type ExpandedIntakes,
} from './registry-glue';
export { effectCurve, ceSteadyState } from './effect-compartment';
export {
  hillCurve,
  hillOccupancyAt,
  compositeOccupancyCurve,
  freeFractionMultiplier,
} from './hill';
export { computeInteractionFactors, applyInteractionFactorsToRoutes } from './interactions';
export { mmEliminationRate, mmEffectiveKe, plasmaCurveMm } from './mm';
export {
  washoutHr,
  intakeStillRelevant,
  WASHOUT_HALFLIVES,
  MM_WASHOUT_HR,
  RELEVANCE_EPS,
} from './washout';
export {
  concentrationsAtNow,
  concentrationsAtTimes,
  type AtNowInput,
  type AtTimesInput,
  type AtTimesResult,
} from './atnow';
export { periodicAt, periodicCurve, addRegimen, type Regimen } from './periodic';
