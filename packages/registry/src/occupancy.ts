/**
 * occupancy.ts — what a record's PD numbers IMPLY, in effect-compartment arithmetic.
 *
 * WHY THIS EXISTS. `exposure.ts` says outright that "the PK/PD solver that used to
 * do this is gone, so this is the smallest honest replacement" — and it replaced
 * only the PK half. Nothing in this repository consumed `receptor_occupancy` or
 * `effect_compartment` at all: `ec50_mg_l` appeared in two web tables, and
 * `fraction_unbound` was displayed on a compound page and applied to nothing.
 *
 * So three lint rules described a consumer that did not exist.
 * `pd.occupancy-needs-fu` warned that "a free-drug affinity is being compared
 * against the TOTAL plasma curve, biasing occupancy high by ~1/fu"; nothing made
 * that comparison. `receptor.needs-keo` said "Ce(t) can't be computed"; nothing
 * computed Ce(t) either way. A rule whose premise is unimplemented cannot be
 * wrong, but it also cannot be checked, and 303 occupancy rows over 249 effect
 * compartments had no consumer to be wrong in front of.
 *
 * THE POINT IS THE SAME AS `exposure.ts`: values that are each correctly cited can
 * still be jointly impossible, and only resolving them together shows it. There
 * the case was teriparatide, whose verbatim volume and verbatim clearance implied
 * half-lives an hour apart. Here it is a record whose affinity, unbound fraction
 * and dose jointly put peak occupancy at 0.02% or at 99.99% — a dose-response
 * curve with no response in it, which no amount of reading one field at a time can
 * see.
 *
 * WHAT IT IS NOT. A spot-check, not a simulator, and it inherits every limitation
 * of the exposure arithmetic underneath it: one compartment, first-order input, no
 * saturable elimination, single dose rather than steady state. It reports those as
 * caveats rather than modelling them.
 *
 * THE FREE-DRUG CORRECTION IS APPLIED HERE, not assumed away. An `in_vitro_ki`
 * affinity is measured against free drug while Ce(t) is a total-plasma
 * concentration, so the comparison needs `Cp x fu`. That is the whole content of
 * HYGIENE R13, and this is the first code in the repository to perform it — which
 * is also why the correction's absence is visible as `fu: { from: 'default' }`
 * rather than silently omitted.
 */

import { impliedExposure, type ExposureInput } from './exposure';
import type { Compound, ReceptorSite, Route } from './types';

/**
 * What `ec50_mg_l` is referenced to, restated from the schema because the default
 * matters: an absent `basis` means `in_vitro_ki`, which is the one value that
 * needs the free-drug correction.
 */
export type OccupancyBasis = 'in_vitro_ki' | 'in_vivo_plasma_ec50' | 'whole_blood_ic50';

export interface ImpliedOccupancy {
  ok: true;
  route: Route;
  /** The occupancy row's receptor key, as stored. */
  receptor: string;
  doseMg: number;
  keoPerHr: ExposureInput;
  basis: OccupancyBasis;
  /**
   * The factor Ce(t) is multiplied by before it meets `ec50_mg_l`.
   *
   * `stored` when the record has a `fraction_unbound` and the basis needs it.
   * `derived` at 1.0 when the basis is already referenced to plasma or whole
   * blood, where no correction is wanted. `default` at 1.0 when an `in_vitro_ki`
   * row has no `fraction_unbound` — the uncorrected comparison `pd.occupancy-
   * needs-fu` warns about, now visible in the output rather than implied.
   */
  fu: ExposureInput;
  /** Peak effect-site concentration, total drug, mg/L. */
  ceMaxMgPerL: number;
  /** When Ce peaks. Always later than the plasma peak. */
  tCeMaxHr: number;
  /** Ce x fu at the peak: what is actually compared against ec50_mg_l. */
  effectiveMgPerL: number;
  /** Peak occupancy as a fraction of the row's own emax, 0..1. */
  peakOccupancy: number;
  caveats: string[];
}

export interface NoOccupancy {
  ok: false;
  route: Route;
  receptor: string;
  reason: string;
}

/**
 * Ce(t) for a one-compartment plasma curve linked to an effect compartment.
 *
 * Written as a shape times a scale, because only the shape needs the three-term
 * form. The scale is the plasma curve's own, so a record whose Cp is wrong is
 * wrong here by exactly the same factor rather than by a new one.
 *
 * The three-exponential form has removable singularities wherever two rate
 * constants coincide, and a catalog with 46 compounds sharing keo 1.0/h and 445
 * rows defaulting ka to 1.0/h will hit ka = keo often. Rather than special-case
 * each coincidence, the rates are nudged apart by a relative epsilon: the function
 * is continuous there, so the limit and the nudged value agree to well beyond the
 * precision any of these inputs deserve.
 */
function ceShape(t: number, ke: number, keo: number, ka?: number): number {
  if (ka === undefined) {
    // IV bolus: two terms only.
    const [a, b] = separate(ke, keo);
    return (b / (b - a)) * (Math.exp(-a * t) - Math.exp(-b * t));
  }
  const [k, kap, keoP] = separateThree(ke, ka, keo);
  return (
    kap *
    keoP *
    (Math.exp(-k * t) / ((kap - k) * (keoP - k)) +
      Math.exp(-kap * t) / ((k - kap) * (keoP - kap)) +
      Math.exp(-keoP * t) / ((k - keoP) * (kap - keoP)))
  );
}

/** Nudge two rates apart if they coincide, so a removable singularity cannot divide by zero. */
function separate(a: number, b: number): [number, number] {
  return Math.abs(a - b) < 1e-9 * Math.max(a, b) ? [a, b * (1 + 1e-6)] : [a, b];
}

/** The same, for three rates that must be pairwise distinct. */
function separateThree(a: number, b: number, c: number): [number, number, number] {
  let [x, y] = separate(a, b);
  let z = c;
  [y, z] = separate(y, z);
  [x, z] = separate(x, z);
  return [x, y, z];
}

/**
 * The peak of a unimodal Ce(t), by ternary search.
 *
 * Analytic for a two-term curve but not for three, and a numeric peak that is
 * right for every case beats a closed form that is right for two of them. The
 * bracket runs to ten half-lives of the SLOWEST rate, which always contains the
 * peak: Ce cannot peak after the last exponential has decayed.
 */
function peakOf(ke: number, keo: number, ka: number | undefined): { t: number; value: number } {
  const slowest = Math.min(ke, keo, ka ?? Infinity);
  let lo = 0;
  let hi = (10 * Math.LN2) / slowest;
  for (let i = 0; i < 200; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (ceShape(m1, ke, keo, ka) < ceShape(m2, ke, keo, ka)) lo = m1;
    else hi = m2;
  }
  const t = (lo + hi) / 2;
  return { t, value: ceShape(t, ke, keo, ka) };
}

/** An absent `basis` means an in-vitro Ki — the schema's documented default. */
function basisOf(row: ReceptorSite): OccupancyBasis {
  return (row.basis as OccupancyBasis | undefined) ?? 'in_vitro_ki';
}

/**
 * Resolve one occupancy row of a record at a dose, default the record's typical.
 *
 * Returns `{ ok: false, reason }` for the same reason `impliedExposure` does: a
 * record with no keo, or no solvable route, is a normal state of this catalog and
 * a caller sweeping 1,265 records should be told why rather than crash.
 */
export function impliedOccupancy(
  c: Compound,
  route: Route,
  row: ReceptorSite,
  doseMg?: number,
): ImpliedOccupancy | NoOccupancy {
  const receptor = row.receptor;
  const keo = c.effect_compartment?.keo_per_h;
  if (keo == null) {
    return { ok: false, route, receptor, reason: 'no effect_compartment.keo_per_h is stored' };
  }
  const exp = impliedExposure(c, route, doseMg);
  if (!exp.ok) return { ok: false, route, receptor, reason: exp.reason };

  const basis = basisOf(row);
  const needsFu = basis === 'in_vitro_ki';
  const fu: ExposureInput = !needsFu
    ? { value: 1, from: 'derived' }
    : c.fraction_unbound != null
      ? { value: c.fraction_unbound, from: 'stored' }
      : { value: 1, from: 'default' };

  const { t, value: shape } = peakOf(exp.ke.value, keo, exp.ka?.value);
  // The plasma curve's scale: Cmax divided by its own shape at its own peak.
  const cpShape = exp.ka
    ? plasmaShape(exp.tmaxHr - (c.pk?.[route]?.lag_hr ?? 0), exp.ke.value, exp.ka.value)
    : 1;
  const scale = exp.cmaxMgPerL / cpShape;
  const ceMax = scale * shape;
  const effective = ceMax * fu.value;

  const hill = row.hill_n;
  const ec50 = row.ec50_mg_l;
  const frac = Math.pow(effective, hill) / (Math.pow(ec50, hill) + Math.pow(effective, hill));

  const caveats = [...exp.caveats];
  if (c.effect_compartment?.approximated) {
    caveats.push('keo is a declared approximation, not a published fit (lint: pd.template-keo)');
  }
  if (c.effect_compartment?.source_species) {
    caveats.push(`keo measured in ${c.effect_compartment.source_species}, not humans`);
  }
  if (needsFu && fu.from === 'default') {
    caveats.push(
      'an in-vitro Ki is compared against the TOTAL plasma curve for want of fraction_unbound, so this occupancy is biased HIGH by roughly 1/fu (lint: pd.occupancy-needs-fu)',
    );
  }
  if (needsFu && fu.from === 'stored') {
    caveats.push(
      `Ce was scaled by fraction_unbound ${fu.value} because the affinity is a free-drug value`,
    );
  }
  caveats.push('single dose, not steady state');

  return {
    ok: true,
    route,
    receptor,
    doseMg: exp.doseMg,
    keoPerHr: { value: keo, from: 'stored' },
    basis,
    fu,
    ceMaxMgPerL: ceMax,
    tCeMaxHr: t + (c.pk?.[route]?.lag_hr ?? 0),
    effectiveMgPerL: effective,
    peakOccupancy: frac * row.emax,
    caveats,
  };
}

/** The Bateman shape, so Ce can be scaled by the same curve `exposure.ts` reports. */
function plasmaShape(t: number, ke: number, ka: number): number {
  const [k, a] = separate(ke, ka);
  return (a / (a - k)) * (Math.exp(-k * t) - Math.exp(-a * t));
}

/**
 * Every occupancy row of a record, against the first route that resolves.
 *
 * `routes[0]` is what the dosing UI defaults to, so that is the order tried —
 * the same choice `pk.unsolvable-default-route` is about.
 */
export function impliedOccupancies(
  c: Compound,
  doseMg?: number,
): (ImpliedOccupancy | NoOccupancy)[] {
  const rows = c.receptor_occupancy ?? [];
  if (rows.length === 0) return [];
  const route = (c.routes ?? []).find((r) => impliedExposure(c, r, doseMg).ok) ?? c.routes?.[0];
  if (!route) {
    return rows.map((row) => ({
      ok: false as const,
      route: 'PO' as Route,
      receptor: row.receptor,
      reason: 'the record declares no routes',
    }));
  }
  return rows.map((row) => impliedOccupancy(c, route, row, doseMg));
}
