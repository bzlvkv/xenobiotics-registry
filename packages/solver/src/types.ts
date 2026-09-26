/**
 * @xeno/solver — types
 *
 * The solver is pure: given intakes + PK params + a time horizon, it returns
 * curves. No side effects, no I/O. The package shape is locked at v0.2 so
 * that future additions (effect compartment, Hill, DDI) extend rather than
 * break the SolveInput/SolveOutput contract.
 *
 * Time discipline:
 *   - All times in `intakes` and `horizon` are epoch milliseconds
 *   - Solver internally converts to hours from horizon.start because PK
 *     literature reports rates in 1/hr; converting once at the boundary
 *     keeps the math readable
 *   - `timeline` in the output is epoch milliseconds (consumer-friendly)
 *
 * Unit discipline:
 *   - Doses arrive in their declared dose_unit (mg/g/mcg/IU) and are
 *     normalized to mg by `doseToMg` from @xeno/core before solving
 *   - Plasma curves are reported in mg/L (== µg/mL — the same number
 *     surfaces use for human-readable values)
 *   - Compounds with non-mass dose units (notably IU) are passed through
 *     verbatim and rendered without mg/L axes; the solver flags them
 */

import type {
  EffectCompartment,
  Intake,
  InteractionKinetics,
  ReceptorAction,
  ReceptorSite,
  Route,
  Slug,
} from '@xeno/core';

// ─────────────────────────────────────────────────────────────────────────────
// PK parameters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PK parameters for a single (compound, route) pair.
 *
 * Three model shapes are supported, picked by which fields are set:
 *
 *   1-compartment:   ka_hr + ke_hr + V_L + F  (Bateman closed form)
 *
 *   2-compartment:   ka_hr + alpha_hr + beta_hr + k21_hr + V_L + F
 *                    (3-exponential PO, 2-exponential IV; closed form)
 *
 *   Non-linear:      ka_hr + V_L + F + mm_vmax_per_hr + mm_km_mg_per_l
 *                    (Michaelis-Menten saturable elimination; numerical
 *                    integration since the ODE has no closed-form C(t)
 *                    and superposition does NOT apply across doses)
 *
 * Dispatch order in the solver:
 *   - if MM fields are set      → numerical RK4 path (multi-dose summed
 *                                  inside the ODE, NOT post-hoc)
 *   - else if 2-comp fields set → bi-exponential closed form
 *   - else                       → 1-comp Bateman
 *
 * MM cannot coexist with 2-comp authoring on the same route — the v0.7
 * model treats MM as a single central compartment with saturable
 * clearance. If both are authored, MM wins (it's the more recent
 * addition and likely the intent), but `resolvePk` will warn.
 */
export interface PkParams {
  /** Absorption rate constant, 1/hr. IV routes ignore this (instantaneous). */
  ka_hr: number;
  /** Elimination rate constant, 1/hr. Computed from half-life if missing.
   *  Ignored when 2-comp params are present (β replaces ke). */
  ke_hr: number;
  /** Volume of distribution / central compartment volume, liters. */
  V_L: number;
  /** Bioavailability, fraction in [0, 1]. Defaults to 1.0 for IV, 0.9 for PO. */
  F: number;
  /**
   * Fraction of a logged dose's mass that is the species these params
   * describe — carried here from `Compound.dose_moiety_fraction` so that the
   * ONE place a registry compound becomes solver params is also the one place
   * this is read. Absent means 1.0.
   *
   * Never apply it by hand: every dose→mass conversion in this package goes
   * through `analyteDoseMg`, and a test asserts none bypasses it. A site that
   * forgets is a silent stoichiometric error, which is precisely the class of
   * bug the field was added to fix.
   */
  dose_moiety_fraction?: number;
  /** Fast disposition rate, 1/hr. Set with beta_hr + k21_hr to enable 2-comp. */
  alpha_hr?: number;
  /** Terminal elimination rate, 1/hr. Replaces ke_hr when present. */
  beta_hr?: number;
  /** Peripheral → central rate, 1/hr. */
  k21_hr?: number;
  /**
   * Maximum elimination rate (Michaelis-Menten Vmax), expressed as
   * mg cleared per hour at saturation, per L of distribution volume —
   * i.e. units of mg/L/hr. The ODE form used in pk.ts is:
   *
   *     dC/dt = - mm_vmax_per_hr · C / (mm_km_mg_per_l + C)
   *
   * Setting this AND `mm_km_mg_per_l` switches the compound to the MM
   * integrator. Linear `ke_hr` is ignored on this route.
   */
  mm_vmax_per_hr?: number;
  /**
   * Michaelis constant (Km) for the saturable elimination, mg/L. The
   * concentration at which the elimination rate is half-max.
   *
   *   - At Cp << Km:  rate ≈ (Vmax/Km) · Cp   (linear, ke_eff = Vmax/Km)
   *   - At Cp >> Km:  rate ≈ Vmax            (zero-order, half-life rises with Cp)
   *
   * The transition is what makes phenytoin / aspirin-OD / ethanol PK
   * behave so differently across the dose range.
   */
  mm_km_mg_per_l?: number;
  /**
   * First-order elimination rate constant (1/hr) for a NON-saturable pathway
   * running IN PARALLEL with the saturable MM pathway. Only used when MM is
   * active (mm_vmax + mm_km set); the integrator then eliminates via
   *
   *     dC/dt = ... − Vmax·C/(Km+C) − mm_linear_ke_hr·C
   *
   * so a high-capacity route (e.g. acetaminophen glucuronidation) keeps clearing
   * the drug even after the saturable route (sulfation) has plateaued. Absent →
   * pure single-pathway MM (unchanged). Scales with body weight / IIV like any
   * clearance rate constant. Distinct from `ke_hr`, which MM otherwise ignores.
   */
  mm_linear_ke_hr?: number;
  /**
   * Zero-order absorption duration, hr. When set, F·dose enters at a constant
   * rate k0 = F·D / zo_dur_hr over [0, zo_dur_hr] (an infusion), instead of
   * first-order ka. Models transdermal patches and depot injections. Dispatches
   * to the zero-order closed form; ka_hr is ignored. Currently pairs with
   * 1-comp disposition (if 2-comp params also present, the zero-order 1-comp
   * path takes precedence for v1).
   */
  zo_dur_hr?: number;
  /** Absorption lag, hr — input (first- or zero-order) starts at lag_hr; C=0
   *  before then. A simple time-shift, applied for any absorption mode. */
  lag_hr?: number;
  /** PMID for provenance (where the literature value came from). */
  source_pmid?: string;
}

/** Type guard — does this PkParams carry the full 2-comp parameter set? */
export function isTwoCompPk(pk: PkParams): pk is PkParams & {
  alpha_hr: number;
  beta_hr: number;
  k21_hr: number;
} {
  return pk.alpha_hr != null && pk.beta_hr != null && pk.k21_hr != null;
}

/** Type guard — does this PkParams carry the MM saturable-elimination
 *  pair? When true, the solver routes through the numerical integrator
 *  instead of the closed-form 1-comp / 2-comp paths. */
export function isMichaelisMentenPk(pk: PkParams): pk is PkParams & {
  mm_vmax_per_hr: number;
  mm_km_mg_per_l: number;
} {
  return (
    pk.mm_vmax_per_hr != null &&
    pk.mm_vmax_per_hr > 0 &&
    pk.mm_km_mg_per_l != null &&
    pk.mm_km_mg_per_l > 0
  );
}

/** Type guard — does this PkParams use zero-order (constant-rate) absorption?
 *  When true (and not MM), the solver uses the zero-order closed form
 *  (transdermal patch / depot) instead of first-order Bateman. */
export function isZeroOrderPk(pk: PkParams): pk is PkParams & { zo_dur_hr: number } {
  return pk.zo_dur_hr != null && pk.zo_dur_hr > 0;
}

/**
 * Inter-individual variability — how much each PK param varies across
 * users with the same dose. Reported as coefficient of variation (CV);
 * solver samples from log-normal distributions internally.
 */
export interface IIV {
  ka_cv: number;
  ke_cv: number;
  V_cv: number;
  F_cv: number;
}

/**
 * Default IIV when a compound's literature variance hasn't been encoded
 * yet. Conservative — wide enough to honestly say "we don't know."
 */
export const DEFAULT_IIV: IIV = {
  ka_cv: 0.3,
  ke_cv: 0.25,
  V_cv: 0.2,
  F_cv: 0.1,
};

// ─────────────────────────────────────────────────────────────────────────────
// Solve I/O
// ─────────────────────────────────────────────────────────────────────────────

export interface Horizon {
  /** Epoch ms; curves start here */
  start: number;
  /** Epoch ms; curves end here */
  end: number;
  /** Sample step in minutes (typical: 5 for plotting, 1 for tight peaks) */
  stepMin: number;
}

/**
 * Per-(compound, route) PK parameter map. PK is fundamentally route-specific
 * — F, ka, and Vd_apparent all change with route — so the same compound
 * taken PO and SL must use different parameter sets. The pipeline looks up
 * `pkParams.get(slug)?.[intake.route]` for every intake, sums each route's
 * Bateman/2-comp contribution into the compound's single plasma curve
 * (the molecule's plasma concentration is one curve regardless of how it
 * got into the bloodstream).
 *
 * Surfaces / tests pass this in; the pipeline never reaches into the registry
 * directly, so registry shape changes don't ripple through the solver.
 */
export type PkParamMap = Map<Slug, Partial<Record<Route, PkParams>>>;

/** Reference body weight (kg) that authored / typical PK params correspond to.
 *  Allometric weight scaling (see scalePkForWeight in mc.ts) is identity here. */
export const REFERENCE_WEIGHT_KG = 70;

/** Optional per-user calibration (Plus tier). Empty in v0.2. */
export interface UserCalibration {
  /** Per-compound posterior overrides from MAP fit on user-tagged peaks. */
  overrides?: Map<Slug, Partial<PkParams>>;
}

export interface SolveInput {
  intakes: Intake[];
  /** PK params keyed by compound slug. Compounds missing from the map fall
   *  through to category-based defaults; surfaces should warn when this
   *  happens since the curve's confidence is then much lower. */
  pkParams: PkParamMap;
  /** Per-compound IIV; defaults to DEFAULT_IIV when missing. */
  iiv?: Map<Slug, IIV>;
  horizon: Horizon;
  user?: UserCalibration;
  /** Number of MC samples. 0 = mean curve only (faster, no bands). v0.2
   *  default is 200 — surfaces stream progressive updates at 30/60/200. */
  mcSamples?: number;
  /** Deterministic seed for MC sampling. Tests pin this. */
  seed?: number;
  /** Per-compound effect-compartment params (keo). When present for a
   *  slug, solve() emits a Ce(t) curve in `output.effect`. */
  effect?: Map<Slug, EffectCompartment>;
  /** Per-compound receptor sites for Hill occupancy. When present, solve()
   *  emits an occupancy curve per site in `output.occupancy`. */
  receptors?: Map<Slug, ReceptorSite[]>;
  /** Per-compound fraction unbound in plasma, (0, 1]. An `in_vitro_ki`
   *  occupancy row is a FREE-drug affinity, so it is driven by `Cp x fu`
   *  rather than by the total plasma curve. A slug missing from this map is
   *  treated as fu = 1, i.e. the uncorrected curve. */
  fractionUnbound?: Map<Slug, number>;
  /** Active interaction edges between compounds in `intakes`. Each edge
   *  declares that `from` perpetrates a kinetic effect on `to` (the victim).
   *  Caller is expected to filter to edges where both compounds are on
   *  board AND the edge has a `kinetics` block authored — informational
   *  edges (note + level only) are dropped before reaching the solver. */
  interactions?: InteractionEdgeInput[];
  /** Parent → metabolite formation links. A fraction of the parent's systemic
   *  elimination forms the metabolite, which is then cleared by its own PK. The
   *  metabolite is solved (and appears in the output) even if it's never dosed
   *  directly, as long as its parent is on board and both have PK. */
  metabolites?: MetaboliteLink[];
}

/**
 * One parent → metabolite formation link. `fraction` is the MOLAR fraction of
 * the parent's elimination that forms this metabolite (fm ∈ (0, 1]); the MWs
 * convert parent mass eliminated to metabolite mass formed. Both compounds must
 * have PK in `pkParams`. See metabolite.ts for the formation-kinetics model.
 */
export interface MetaboliteLink {
  parent: Slug;
  metabolite: Slug;
  fraction: number;
  mw_parent_g_mol: number;
  mw_metabolite_g_mol: number;
}

/**
 * One quantitative interaction edge fed to the solver. The registry's
 * `InteractionRef` is the authoring shape; this is the pre-filtered,
 * pre-resolved form the pipeline consumes — it always carries a kinetics
 * block and the perpetrator's MW (when known) so unit conversion can run
 * without a registry lookup inside the solver.
 */
export interface InteractionEdgeInput {
  from: Slug;
  to: Slug;
  kinetics: InteractionKinetics;
  /** Perpetrator's molecular weight (g/mol). Required for any edge with
   *  `ki_uM` since µM → mg/L conversion needs it. May be undefined when
   *  only induction or displacement is authored on this edge. */
  perpetrator_mw_g_mol?: number;
}

/**
 * Summary of one interaction edge as it was actually applied during the
 * solve. Surfaces use this to render explainer text on interaction chips
 * ("caffeine ↑ amphetamine plasma 18% via CYP1A2 inhibition").
 *
 * Multiplier convention: 1.0 = no change. Below 1 = clearance slower /
 * F lower; above 1 = clearance faster / F higher. The product of these
 * factors is what was applied to the victim's pkByRoute.
 */
export interface InteractionApplied {
  from: Slug;
  to: Slug;
  /** Multiplier applied to the victim's `ke_hr`. <1 = inhibition,
   *  >1 = induction, ==1 = no kinetic effect on clearance. */
  ke_factor: number;
  /** Multiplier applied to the victim's bioavailability `F`. >1 = more
   *  drug unbound (positive plasma displacement). */
  F_factor: number;
  /** Mean perpetrator Cp (mg/L) used to drive the kinetic factors,
   *  averaged over the simulation horizon. Surfaces show this so the
   *  user understands "this is the inhibition strength right now." */
  perpetrator_mean_cp_mg_l: number;
}

/**
 * Curves are stored as Float32Array because (a) memory: a 48h horizon at
 * 5-minute steps is 576 samples, × dozens of compounds × 200 MC samples;
 * (b) transferable: workers can move the buffer to the main thread without
 * structured-clone cost.
 */
export interface OccupancyCurve {
  receptor: string;
  pathway?: string;
  /** The site's typed mode of action, passed through from the registry.
   *  Surfaces derive the activates/blocks/modulates direction from this and
   *  fall back to parsing `pathway` only where it's absent — see the app's
   *  receptors/direction.ts. */
  action?: ReceptorAction;
  /** Occupancy 0..emax sampled at the same time grid as plasma. When MC
   *  ran, this is the mean across realizations; otherwise it's the
   *  deterministic Hill curve over the mean Ce. */
  curve: Float32Array;
  /** Lower band (P10) across MC realizations. Populated only when the
   *  enclosing solve() ran with mcSamples > 0. The band reflects PK IIV
   *  propagated all the way through Ce(t) → Hill — not Hill noise itself,
   *  which we don't currently sample. */
  p10?: Float32Array;
  /** Upper band (P90) across MC realizations. Same conditions as p10. */
  p90?: Float32Array;
}

/**
 * Composite occupancy across every compound the user is currently dosing
 * that binds a given receptor. Computed as probabilistic union assuming
 * independent binding sites:
 *
 *     comp(t) = 1 − Π over i ( 1 − occᵢ(t) )
 *
 * The independent-binding assumption is a first-order approximation —
 * orthosteric competition between agonists/antagonists at the same site
 * would need a different math (Schild equations or full mass-action).
 * For non-competing modulators (caffeine A1 antagonism + theanine
 * something-else-entirely) the union is honest.
 */
export interface CompositeReceptor {
  receptor: string;
  /** The FIRST contributing site's pathway tag — a dose-ordering artifact,
   *  not the stack's tag. There is deliberately no `action` sibling here: a
   *  composite has no single mode of action (activators and blockers can
   *  co-occupy one receptor). Surfaces fold direction per contributor off
   *  `occupancy`, never off this field. */
  pathway?: string;
  /** Composite occupancy 0..1 across the stack, sampled at the time grid.
   *  When MC ran, this is the mean across realizations of the per-iteration
   *  union; otherwise the deterministic union of mean per-compound curves. */
  curve: Float32Array;
  /** Lower band (P10) of the composite across MC realizations. Populated
   *  only when mcSamples > 0. Note this is NOT the union of per-compound
   *  P10s — it's the percentile across iterations of the per-iteration
   *  union, which is the statistically faithful measure of stack-wide
   *  occupancy uncertainty. */
  p10?: Float32Array;
  /** Upper band (P90) of the composite across MC realizations. */
  p90?: Float32Array;
  /** Which compound slugs contribute to this receptor's composite. */
  contributors: Slug[];
}

export interface SolveOutput {
  /** Epoch ms timestamps, one per sample. Length = N. */
  timeline: Float64Array;
  /** Mean (P50) plasma curve per compound. */
  plasma: Map<Slug, Float32Array>;
  /** Lower band (P10) per compound, if MC was run. */
  plasmaP10?: Map<Slug, Float32Array>;
  /** Upper band (P90) per compound, if MC was run. */
  plasmaP90?: Map<Slug, Float32Array>;
  /** Effect-site concentration Ce(t) per compound. Only populated for
   *  compounds with an `effect_compartment.keo_per_h` authored. Same shape
   *  as plasma curves so surfaces can overlay them directly. */
  effect: Map<Slug, Float32Array>;
  /** Per-compound receptor occupancy curves. Only populated for compounds
   *  with `receptor_occupancy[]` authored AND an effect-compartment Ce
   *  (occupancy is driven by Ce, not raw plasma — that's the whole point
   *  of the effect compartment). */
  occupancy: Map<Slug, OccupancyCurve[]>;
  /** Stack-wide receptor occupancy: for every receptor that appears in
   *  any compound's occupancy[], the probabilistic-union curve across
   *  the active compounds. Empty when no compound has authored receptor
   *  data. Drives Today's "Receptor occupancy" card. */
  compositeOccupancy: Map<string, CompositeReceptor>;
  /** Composite system load 0..1, dashboard's "system load" indicator. */
  load: Float32Array;
  /** Compounds whose dose unit isn't mass — flagged for surface warnings. */
  unitWarnings: Slug[];
  /** One entry per interaction edge that actually moved a curve. Edges
   *  that resolved to ke_factor==1 AND F_factor==1 are dropped (perpetrator
   *  Cp too low to matter, or kinetics block had no fields). Empty when
   *  no `interactions` were passed to solve(). */
  interactionsApplied: InteractionApplied[];
}

/** A single sample of plasma curves — what one MC iteration produces. */
export type PlasmaSample = Map<Slug, Float32Array>;
