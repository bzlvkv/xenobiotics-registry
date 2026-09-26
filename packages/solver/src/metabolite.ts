/**
 * metabolite.ts — parent → metabolite formation kinetics.
 *
 * A metabolite is not dosed directly (usually): it is FORMED from a parent drug
 * as the parent is eliminated, then cleared by its own PK. Aspirin → salicylate,
 * codeine → morphine, tamoxifen → endoxifen all share this shape. The coupling is
 * one-way — the metabolite never turns back into the parent — so we solve it
 * sequentially: take the parent's already-computed Cp(t), read off its
 * elimination flux, convert a molar fraction of that flux into a mass input to
 * the metabolite compartment, and integrate the metabolite forward.
 *
 * Mass balance (per grid step):
 *   parent elimination      = elimRate_parent(Cp_p)        [mg/L/hr of PARENT]
 *   → mass eliminated       = elimRate_parent · V_p        [mg parent / hr]
 *   → moles to metabolite   = fm · (that / MW_p)           [mmol / hr]
 *   → mass formed           = · MW_m                       [mg metabolite / hr]
 *   → conc source into met  = / V_m                        [mg/L/hr of METABOLITE]
 * which collapses to  source(t) = coupling · elimRate_parent(Cp_p(t)),
 * with the single coupling scalar  fm · (MW_m/MW_p) · (V_p/V_m).
 *
 * The metabolite is then integrated as its own 1-comp compartment (linear OR
 * Michaelis-Menten + parallel-linear, whichever it authors) with:
 *   - the formation source above,
 *   - optional DIRECT doses (a metabolite can also be taken as a drug, e.g.
 *     salsalate → salicylate), absorbed through the usual depot,
 *   - its own elimination.
 *
 * The caller pre-extends the grid for warm-up (a parent dose before the window
 * forms metabolite that persists into it) and passes the parent Cp + formation
 * aligned to that extended grid, mirroring the MM / DDI warm-up convention.
 */

import { type Intake } from '@xeno/core';
import { analyteDoseMg } from './dose';
import type { PkParams } from './types';
import { isMichaelisMentenPk, isTwoCompPk } from './types';
import { mmEliminationRate } from './mm';

const HOUR_MS = 3_600_000;

/** The parent's instantaneous elimination rate at a plasma concentration, in
 *  mg/L/hr of PARENT — dispatched by the parent's disposition shape. For 2-comp
 *  it's the central elimination k10·C1 (k10 = α·β/k21); distribution doesn't
 *  remove drug. Linear uses ke; MM uses the saturable(+parallel) rate. */
function parentEliminationRate(cp: number, pk: PkParams): number {
  if (cp <= 0) return 0;
  if (isMichaelisMentenPk(pk)) {
    return mmEliminationRate(cp, pk.mm_vmax_per_hr, pk.mm_km_mg_per_l, pk.mm_linear_ke_hr ?? 0);
  }
  if (isTwoCompPk(pk)) {
    const k10 = pk.k21_hr > 0 ? (pk.alpha_hr * pk.beta_hr) / pk.k21_hr : pk.beta_hr;
    return k10 * cp;
  }
  return pk.ke_hr * cp;
}

/** Molar coupling scalar: fraction of the parent eliminated that becomes this
 *  metabolite (fm), converted parent→metabolite mass (MW ratio) and parent→
 *  metabolite concentration (volume ratio). Multiply by the parent's elimination
 *  rate to get the metabolite's formation conc-rate (mg/L/hr). */
export function metaboliteCoupling(
  fraction: number,
  mw_parent_g_mol: number,
  mw_metabolite_g_mol: number,
  v_parent_l: number,
  v_metabolite_l: number,
): number {
  if (!(mw_parent_g_mol > 0) || !(v_metabolite_l > 0)) return 0;
  return fraction * (mw_metabolite_g_mol / mw_parent_g_mol) * (v_parent_l / v_metabolite_l);
}

/** Per-step formation conc-rate (mg/L/hr of metabolite) from the parent's Cp
 *  curve. `coupling` is `metaboliteCoupling(...)`. */
export function metaboliteFormationRate(
  parentCp: Float32Array,
  parentPk: PkParams,
  coupling: number,
): Float32Array {
  const T = parentCp.length;
  const out = new Float32Array(T);
  if (!(coupling > 0)) return out;
  for (let i = 0; i < T; i++) out[i] = coupling * parentEliminationRate(parentCp[i]!, parentPk);
  return out;
}

/**
 * Integrate a metabolite's plasma curve over a uniform grid: its own depot
 * absorption from any DIRECT doses, plus a time-varying formation source, minus
 * its own elimination (linear or MM + parallel-linear). RK4 on [a (depot), C].
 * `formationConcRate` is aligned to `t_hr_grid` (mg/L/hr, from
 * metaboliteFormationRate); pass an all-zero array for a purely-dosed compound.
 */
export function metaboliteCurve(
  t_hr_grid: Float64Array,
  directIntakes: Intake[],
  pk: PkParams,
  horizonStart_ms: number,
  formationConcRate: Float32Array,
): Float32Array {
  const T = t_hr_grid.length;
  const out = new Float32Array(T);
  if (T === 0) return out;

  const ka = pk.ka_hr;
  const V = pk.V_L;
  const F = pk.F;
  const lag = pk.lag_hr != null && pk.lag_hr > 0 ? pk.lag_hr : 0;
  const mm = isMichaelisMentenPk(pk);
  const Vmax = pk.mm_vmax_per_hr ?? 0;
  const Km = pk.mm_km_mg_per_l ?? 1;
  const kL = pk.mm_linear_ke_hr != null && pk.mm_linear_ke_hr > 0 ? pk.mm_linear_ke_hr : 0;
  const ke = pk.ke_hr;
  const elim = (C: number): number => (C > 0 ? (mm ? (Vmax * C) / (Km + C) + kL * C : ke * C) : 0);

  // Direct-dose injections snapped to grid indices (depot for absorbed routes,
  // central bump for IV). Same convention as the MM integrator.
  const byIdx = new Map<number, { depot: number; central: number }[]>();
  for (const i of directIntakes) {
    const dose_mg = analyteDoseMg(i.dose, i.dose_unit, pk);
    if (!Number.isFinite(dose_mg) || dose_mg <= 0) continue;
    const dose_t_hr = (Date.parse(i.at) - horizonStart_ms) / HOUR_MS + lag;
    let idx: number;
    if (dose_t_hr <= t_hr_grid[0]!) idx = 0;
    else if (dose_t_hr >= t_hr_grid[T - 1]!) continue;
    else {
      idx = 0;
      for (let k = 0; k < T; k++) {
        if (t_hr_grid[k]! >= dose_t_hr) {
          idx = k;
          break;
        }
      }
    }
    const inj =
      i.route === 'IV' ? { depot: 0, central: dose_mg / V } : { depot: F * dose_mg, central: 0 };
    const arr = byIdx.get(idx) ?? [];
    arr.push(inj);
    byIdx.set(idx, arr);
  }

  let a = 0;
  let C = 0;
  const t0 = byIdx.get(0);
  if (t0)
    for (const inj of t0) {
      a += inj.depot;
      C += inj.central;
    }
  out[0] = C;

  for (let i = 1; i < T; i++) {
    const dt = t_hr_grid[i]! - t_hr_grid[i - 1]!;
    const s0 = formationConcRate[i - 1]!;
    const s1 = formationConcRate[i]!;
    const sM = 0.5 * (s0 + s1);
    const f = (a_: number, C_: number, src: number): [number, number] => [
      -ka * a_,
      (ka * a_) / V + src - elim(C_),
    ];
    const [k1a, k1C] = f(a, C, s0);
    const [k2a, k2C] = f(a + 0.5 * dt * k1a, C + 0.5 * dt * k1C, sM);
    const [k3a, k3C] = f(a + 0.5 * dt * k2a, C + 0.5 * dt * k2C, sM);
    const [k4a, k4C] = f(a + dt * k3a, C + dt * k3C, s1);
    a += (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
    C += (dt / 6) * (k1C + 2 * k2C + 2 * k3C + k4C);
    if (a < 0) a = 0;
    if (C < 0) C = 0;
    const inj = byIdx.get(i);
    if (inj)
      for (const x of inj) {
        a += x.depot;
        C += x.central;
      }
    out[i] = C;
  }
  return out;
}
