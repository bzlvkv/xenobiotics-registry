/**
 * wasm-parity.test.ts — the Rust/WASM superposition kernel must agree with
 * the TS reference (`addDose`) within tolerance for every linear PK form.
 *
 * Cross-engine *byte* equality is unattainable (f64::exp vs Math.exp differ
 * ~1 ULP; WASM accumulates in f64 and narrows once, TS narrows per add), so
 * we assert relative agreement well inside the 1%-Cmax KAT budget.
 *
 * The parity cases skip cleanly when the crate hasn't been built (`wasm-pack
 * build packages/solver-wasm --target nodejs --out-dir pkg-node`) — but with
 * XENO_WASM_PARITY=1 (the CI/bench gate, which builds the artifact first) a
 * missing artifact is a HARD FAILURE, so the kernel can't silently drift out
 * of parity unguarded. (The 2-comp IV coefficient bug fixed in the Rust kernel
 * existed because there was no 2-comp IV case here at all — now there is.)
 */
import { describe, it, expect } from 'vitest';
import { addDose, type Dose } from '../src/pk';
import { isTwoCompPk, isZeroOrderPk, type PkParams } from '../src/types';
import type { Route } from '@xeno/core';

// Dynamic import so the suite degrades to skipped rather than erroring when
// the wasm artifact is absent.
let wasm: typeof import('../../solver-wasm/pkg-node/xeno_solver_wasm.js') | null = null;
try {
  wasm = await import('../../solver-wasm/pkg-node/xeno_solver_wasm.js');
} catch {
  wasm = null;
}

// When the gate sets XENO_WASM_PARITY=1 it has already built the artifact, so a
// null `wasm` here means the build failed / drifted — fail loudly instead of
// silently skipping the whole suite (which is how the 2-comp IV bug hid).
const REQUIRE_WASM = process.env.XENO_WASM_PARITY === '1';
describe('WASM parity gate', () => {
  it('artifact must be present when XENO_WASM_PARITY=1', () => {
    if (!REQUIRE_WASM) return; // local dev w/o Rust toolchain — parity cases skip below
    expect(
      wasm,
      'XENO_WASM_PARITY=1 but solver-wasm/pkg-node is missing — run `wasm-pack build packages/solver-wasm --target nodejs --out-dir pkg-node`',
    ).not.toBeNull();
  });
});

function grid(hours: number, stepHr: number): Float64Array {
  const T = Math.floor(hours / stepHr) + 1;
  const g = new Float64Array(T);
  for (let i = 0; i < T; i++) g[i] = i * stepHr;
  return g;
}

function tsCurve(g: Float64Array, doses: Dose[], pk: PkParams): Float32Array {
  const buf = new Float32Array(g.length);
  for (const d of doses) addDose(buf, g, d, pk);
  return buf;
}

function wasmCurve(g: Float64Array, doses: Dose[], pk: PkParams, route: Route): Float32Array {
  const doseT = new Float64Array(doses.map((d) => d.t_hr));
  const doseMg = new Float64Array(doses.map((d) => d.dose_mg));
  return wasm!.plasma_curve(
    g,
    doseT,
    doseMg,
    pk.ka_hr,
    pk.ke_hr,
    pk.V_L,
    pk.F,
    route === 'IV',
    pk.alpha_hr ?? 0,
    pk.beta_hr ?? 0,
    pk.k21_hr ?? 0,
    isTwoCompPk(pk),
    pk.zo_dur_hr ?? 0,
    isZeroOrderPk(pk),
    pk.lag_hr ?? 0,
  );
}

function assertClose(a: Float32Array, b: Float32Array, rel = 1e-3): void {
  expect(a.length).toBe(b.length);
  let maxRel = 0;
  for (let i = 0; i < a.length; i++) {
    const denom = Math.max(1e-6, Math.abs(b[i]!));
    maxRel = Math.max(maxRel, Math.abs(a[i]! - b[i]!) / denom);
  }
  expect(maxRel).toBeLessThanOrEqual(rel);
}

const CAFFEINE: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1 };
const TWO_COMP: PkParams = {
  ka_hr: 4,
  ke_hr: 0.1,
  V_L: 40,
  F: 0.9,
  alpha_hr: 1.5,
  beta_hr: 0.08,
  k21_hr: 0.4,
};
const ZERO_ORDER: PkParams = { ka_hr: 1, ke_hr: Math.LN2 / 10, V_L: 36, F: 0.9, zo_dur_hr: 6 };
const LAGGED: PkParams = { ...CAFFEINE, lag_hr: 1.5 };

function doses(route: Route, n: number, tau: number, mg = 100): Dose[] {
  return Array.from({ length: n }, (_, i) => ({ t_hr: i * tau, dose_mg: mg, route }));
}

describe.skipIf(!wasm)('WASM superposition parity with TS', () => {
  const g = grid(96, 5 / 60); // 96h at 5-min steps

  it('1-comp Bateman PO, many doses', () => {
    const d = doses('PO', 20, 4);
    assertClose(wasmCurve(g, d, CAFFEINE, 'PO'), tsCurve(g, d, CAFFEINE));
  });

  it('1-comp IV bolus', () => {
    const d = doses('IV', 8, 12);
    assertClose(wasmCurve(g, d, CAFFEINE, 'IV'), tsCurve(g, d, CAFFEINE));
  });

  it('2-compartment PO', () => {
    const d = doses('PO', 10, 24);
    assertClose(wasmCurve(g, d, TWO_COMP, 'PO'), tsCurve(g, d, TWO_COMP));
  });

  it('2-compartment IV bolus', () => {
    // Exercises the bi-exponential disposition coefficients (A on e^−αt, B on
    // e^−βt). A swapped A/B removes the distribution phase and inflates AUC ~4.5×;
    // this case is what catches it — there was no 2-comp IV parity case before.
    const d = doses('IV', 8, 12);
    assertClose(wasmCurve(g, d, TWO_COMP, 'IV'), tsCurve(g, d, TWO_COMP));
  });

  it('zero-order release', () => {
    const d = doses('TD', 6, 24);
    assertClose(wasmCurve(g, d, ZERO_ORDER, 'TD'), tsCurve(g, d, ZERO_ORDER));
  });

  it('absorption lag', () => {
    const d = doses('PO', 12, 8);
    assertClose(wasmCurve(g, d, LAGGED, 'PO'), tsCurve(g, d, LAGGED));
  });
});
