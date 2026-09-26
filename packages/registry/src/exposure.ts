/**
 * exposure.ts — what a route's stored numbers IMPLY, in one-compartment arithmetic.
 *
 * WHY THIS EXISTS. Values that are each correctly cited can still be jointly
 * impossible. teriparatide stored a verbatim V/F of 7.8 L beside a half-life of
 * an hour, while the same paper's verbatim CL/F of 62 L/h implies a five-minute
 * half-life. Nothing that reads one field at a time can see that; only resolving
 * the record into a peak, an exposure and a clearance, and holding those against
 * a published Cmax or CL, catches it. The PK/PD solver that used to do this is
 * gone, so this is the smallest honest replacement: the closed-form Bateman
 * equations, with every input labelled by where it came from.
 *
 * THE LABELS ARE THE POINT. A route with no V_L does not abstain, it asserts the
 * default volume, and before this module nothing showed which numbers on a record
 * were stored and which were silently assumed. `from: 'default'` makes that
 * visible, so an author can see that a record's peak is set by a constant nobody
 * measured.
 *
 * WHAT IT IS NOT. It is a spot-check, not a simulator. Two-compartment
 * distribution, saturable elimination, zero-order input and lag are reported as
 * caveats rather than modelled, and any consumer that does model them will
 * disagree with these numbers in exactly those places.
 */
import type { Compound, DoseUnit, Route } from './types';

/**
 * The substitutions a consumer makes for an absent PK field.
 *
 * Nothing in this repository integrates a curve with them except the arithmetic
 * below, but they are still the most consequential numbers in the catalog: a
 * record missing a field inherits one of these, invisibly, in every consumer. The
 * lint rules import them so a warning can say what an omission costs.
 */
export const PK_DEFAULTS = {
  /** Oral bioavailability assumed when `F` is absent on an extravascular route. */
  F: 0.9,
  /** Absorption rate assumed when `ka_hr` is absent: a peak inside 4-7 h
   *  whatever the drug, which is wrong in kind for a depot or a slow patch. */
  kaPerHr: 1.0,
  /** Volume assumed when `V_L` is absent: 35 L at the reference weight. */
  vLPerKg: 0.5,
  /** Applied instead above `proteinMwThreshold`: every one of the catalog's 18
   *  authored volumes at that mass falls in 3.1-9.25 L, so a small-molecule
   *  volume is wrong in kind for an antibody. */
  vLPerKgProtein: 0.08,
  referenceWeightKg: 70,
  /** Above this mass a record is treated as a protein for volume purposes. */
  proteinMwThreshold: 10_000,
} as const;

/** Where an input came from. `derived` means computed from another stored field
 *  (a half-life becoming ke); `default` means nothing on the record supplied it. */
export type InputSource = 'stored' | 'derived' | 'default';

export interface ExposureInput {
  value: number;
  from: InputSource;
}

export interface ImpliedExposure {
  ok: true;
  route: Route;
  /** The dose these numbers are for, in mg of the species the PK describes. */
  doseMg: number;
  ke: ExposureInput;
  halfLifeHr: ExposureInput;
  V: ExposureInput;
  F: ExposureInput;
  /** Absent on IV, which has no absorption phase. */
  ka?: ExposureInput;
  tmaxHr: number;
  cmaxMgPerL: number;
  aucMgHrPerL: number;
  /** Systemic clearance, ke x V. Compare against a published CL, or CL/F x F. */
  clearanceLPerHr: number;
  /** What the arithmetic does not model for this record, in plain words. */
  caveats: string[];
}

export interface NoExposure {
  ok: false;
  route: Route;
  reason: string;
}

const LN2 = Math.LN2;

const MG_PER_UNIT: Record<Exclude<DoseUnit, 'IU'>, number> = { mg: 1, g: 1000, mcg: 0.001 };

/**
 * Resolve one route of a record at a dose, default the record's typical dose.
 *
 * Returns `{ ok: false, reason }` rather than throwing when the record cannot be
 * resolved, because that is a normal state of the catalog (a `pk_unauthored`
 * record, an IU dose, a route with only saturable elimination) and a caller
 * rendering 1,244 records should say why, not crash.
 */
export function impliedExposure(
  c: Compound,
  route: Route,
  doseMg?: number,
): ImpliedExposure | NoExposure {
  const pk = c.pk?.[route];
  const t12 = c.half_life_hr?.[route];
  const caveats: string[] = [];

  let ke: ExposureInput;
  if (pk?.ke_hr != null) ke = { value: pk.ke_hr, from: 'stored' };
  else if (t12 != null) ke = { value: LN2 / t12, from: 'derived' };
  else if (pk?.mm_vmax_per_hr != null) {
    return { ok: false, route, reason: 'only saturable (Michaelis-Menten) elimination is stored' };
  } else return { ok: false, route, reason: 'no half-life or ke is stored for this route' };

  let dose: number;
  if (doseMg != null) dose = doseMg;
  else {
    const d = c.doses[route];
    if (!d) return { ok: false, route, reason: 'no dose is stored for this route' };
    if (d.unit === 'IU') return { ok: false, route, reason: 'the dose is in IU, not a mass' };
    dose = d.typical * MG_PER_UNIT[d.unit];
  }
  if (c.dose_moiety_fraction != null) {
    dose *= c.dose_moiety_fraction;
    caveats.push(`dose scaled by dose_moiety_fraction ${c.dose_moiety_fraction}`);
  }

  const isProtein = c.mw_g_mol != null && c.mw_g_mol >= PK_DEFAULTS.proteinMwThreshold;
  const V: ExposureInput =
    pk?.V_L != null
      ? { value: pk.V_L, from: 'stored' }
      : {
          value:
            (isProtein ? PK_DEFAULTS.vLPerKgProtein : PK_DEFAULTS.vLPerKg) *
            PK_DEFAULTS.referenceWeightKg,
          from: 'default',
        };

  const iv = route === 'IV';
  // IV bioavailability is 1 by definition, not by default, so it is not flagged.
  const F: ExposureInput = iv
    ? { value: 1, from: pk?.F === 1 ? 'stored' : 'derived' }
    : pk?.F != null
      ? { value: pk.F, from: 'stored' }
      : { value: PK_DEFAULTS.F, from: 'default' };

  const k = ke.value;
  let tmaxHr: number;
  let cmax: number;
  let ka: ExposureInput | undefined;
  if (iv) {
    tmaxHr = 0;
    cmax = (F.value * dose) / V.value;
  } else {
    ka =
      pk?.ka_hr != null
        ? { value: pk.ka_hr, from: 'stored' }
        : { value: PK_DEFAULTS.kaPerHr, from: 'default' };
    const a = ka.value;
    if (Math.abs(a - k) < 1e-9 * Math.max(a, k)) {
      // ka = ke is a removable singularity of the Bateman form; its limit is
      // C(t) = F·D·k·t·e^(-kt) / V, which peaks at t = 1/k.
      tmaxHr = 1 / k;
      cmax = (F.value * dose) / (V.value * Math.E);
    } else {
      tmaxHr = Math.log(a / k) / (a - k);
      cmax =
        ((F.value * dose * a) / (V.value * (a - k))) *
        (Math.exp(-k * tmaxHr) - Math.exp(-a * tmaxHr));
    }
    if (a < k) {
      caveats.push(
        'ka is below ke (flip-flop kinetics): the terminal slope is absorption, so the stored half-life may describe absorption rather than elimination',
      );
    }
  }

  if (iv && pk?.F != null && pk.F !== 1) {
    caveats.push(`the stored IV F of ${pk.F} is ignored: intravenous F is 1 (lint: pk.iv-f)`);
  }
  if (pk?.lag_hr != null) {
    tmaxHr += pk.lag_hr;
    caveats.push(`peak shifted by the stored ${pk.lag_hr} h lag`);
  }
  if (pk?.zo_dur_hr != null) {
    caveats.push(
      `zero-order input over ${pk.zo_dur_hr} h is stored but not modelled here; the peak shown assumes first-order input`,
    );
  }
  if (pk?.alpha_hr != null || pk?.beta_hr != null || pk?.k21_hr != null) {
    caveats.push('two-compartment parameters are stored but not modelled here');
  }
  if (pk?.mm_vmax_per_hr != null) {
    caveats.push('saturable elimination is stored but not modelled; high doses are underestimated');
  }
  // Absence means human; the field exists only to label an animal value.
  if (pk?.source_species) {
    caveats.push(`measured in ${pk.source_species}, not humans`);
  }
  if (c.pk_analyte && c.pk_analyte !== 'parent') {
    caveats.push(
      `the PK describes the ${c.pk_analyte}${c.pk_analyte_name ? ` (${c.pk_analyte_name})` : ''}, not the dosed parent`,
    );
  }

  const clearance = k * V.value;
  return {
    ok: true,
    route,
    doseMg: dose,
    ke,
    halfLifeHr: { value: LN2 / k, from: ke.from === 'stored' ? 'derived' : 'stored' },
    V,
    F,
    ...(ka ? { ka } : {}),
    tmaxHr,
    cmaxMgPerL: cmax,
    aucMgHrPerL: (F.value * dose) / clearance,
    clearanceLPerHr: clearance,
    caveats,
  };
}
