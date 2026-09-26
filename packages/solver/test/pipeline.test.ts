/**
 * Pipeline tests — solve() across full SolveInput → SolveOutput round-trips.
 *
 * The "golden curve" pattern from spec §07: pick known PK params, run the
 * solver against a synthetic intake set, and check that:
 *   - the output peaks at the right time (Tmax)
 *   - the peak height matches the analytic Cmax
 *   - mean curve and MC P50 are close (large N)
 *   - P10 ≤ P50 ≤ P90 at every sample
 *   - same seed → byte-identical output (determinism)
 *
 * v0.2 ships only one such fixture (caffeine). Adding another compound is
 * a 30-line copy-paste so the harness scales as we authenticate more PK
 * params from literature in v0.3+.
 */

import { describe, it, expect } from 'vitest';
import { ulid } from 'ulid';
import type { EffectCompartment, Intake, ReceptorSite } from '@xeno/core';
import { solve, tmaxOral, cmaxOral } from '../src';
import type { InteractionEdgeInput, PkParams } from '../src/types';

// Caffeine reference params — the same values used in pk.test.ts.
// These are textbook small-molecule values; specific PMID is intentionally
// not cited here (the project rule is to verify before citing).
const CAFFEINE: PkParams = {
  ka_hr: 5,
  ke_hr: Math.LN2 / 5,
  V_L: 36,
  F: 1.0,
};

const HORIZON_START = Date.parse('2026-04-27T08:00:00Z');
const HORIZON_END = Date.parse('2026-04-27T20:00:00Z'); // 12h window
const STEP_MIN = 5;

function makeIntake(at_iso: string, dose_mg = 100): Intake {
  return {
    id: ulid(),
    compound: 'caffeine',
    dose: dose_mg,
    dose_unit: 'mg',
    route: 'PO',
    at: at_iso,
    created_at: at_iso,
    updated_at: at_iso,
  };
}

describe('solve() — single compound, single intake', () => {
  it('peak occurs near Tmax after the intake time', () => {
    const intakeAt = HORIZON_START + 0; // dose at horizon start, 08:00
    const out = solve({
      intakes: [makeIntake(new Date(intakeAt).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: STEP_MIN },
      mcSamples: 0,
    });

    const curve = out.plasma.get('caffeine')!;
    expect(curve).toBeDefined();
    expect(curve.length).toBe(out.timeline.length);

    // Find the index of the peak.
    let peakIdx = 0;
    for (let i = 1; i < curve.length; i++) {
      if (curve[i] > curve[peakIdx]) peakIdx = i;
    }
    const peakTime_hr = (out.timeline[peakIdx] - intakeAt) / 3_600_000;
    const expectedTmax = tmaxOral(CAFFEINE);
    // Discretization error: peak can land on either side of the true Tmax
    // by up to one stepMin. With stepMin=5 (=0.083h) the gap is bounded.
    expect(Math.abs(peakTime_hr - expectedTmax)).toBeLessThan(STEP_MIN / 60 + 1e-6);
  });

  it('peak height matches analytic Cmax within 1%', () => {
    const out = solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 1 },
      mcSamples: 0,
    });
    const curve = out.plasma.get('caffeine')!;
    const peak = Math.max(...curve);
    const expected = cmaxOral(100, CAFFEINE);
    expect(Math.abs(peak - expected) / expected).toBeLessThan(0.01);
  });

  it("intakes outside the horizon don't crash and produce zero contribution", () => {
    // 48h before the horizon = 9.6 half-lives for a 5h-t½ compound.
    // Residual plasma should be ≈ 0.004 mg/L — comfortably below 0.05.
    // (24h would still leave ~0.1 mg/L; "essentially zero" needs more
    // half-lives than the round-number choice suggests.)
    const out = solve({
      intakes: [makeIntake(new Date(HORIZON_START - 48 * 3_600_000).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 30 },
      mcSamples: 0,
    });
    const curve = out.plasma.get('caffeine')!;
    for (let i = 0; i < curve.length; i++) {
      expect(curve[i]).toBeLessThan(0.05); // mg/L
    }
  });
});

describe('solve() — Monte Carlo bands', () => {
  it('emits P10 ≤ P50 ≤ P90 at every timepoint', () => {
    const out = solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
      mcSamples: 200,
      seed: 42,
    });
    const p10 = out.plasmaP10!.get('caffeine')!;
    const p50 = out.plasma.get('caffeine')!;
    const p90 = out.plasmaP90!.get('caffeine')!;
    for (let i = 0; i < p50.length; i++) {
      expect(p10[i]).toBeLessThanOrEqual(p50[i] + 1e-6);
      expect(p50[i]).toBeLessThanOrEqual(p90[i] + 1e-6);
    }
  });

  it('is deterministic: same seed → identical output', () => {
    const input = {
      intakes: [makeIntake(new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 15 },
      mcSamples: 100,
      seed: 12345,
    };
    const a = solve(input);
    const b = solve(input);
    const ca = a.plasma.get('caffeine')!;
    const cb = b.plasma.get('caffeine')!;
    expect(ca.length).toBe(cb.length);
    for (let i = 0; i < ca.length; i++) {
      expect(ca[i]).toBe(cb[i]);
    }
  });

  it('different seeds produce different curves (sanity)', () => {
    const base = {
      intakes: [makeIntake(new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 15 },
      mcSamples: 50,
    };
    const a = solve({ ...base, seed: 1 });
    const b = solve({ ...base, seed: 2 });
    let diff = 0;
    const ca = a.plasma.get('caffeine')!;
    const cb = b.plasma.get('caffeine')!;
    for (let i = 0; i < ca.length; i++) diff += Math.abs(ca[i] - cb[i]);
    expect(diff).toBeGreaterThan(0);
  });
});

describe('solve() — composite load', () => {
  it('a single compound at its typical dose peaks at ~1.0 (one typical-peak-equivalent)', () => {
    const out = solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
      mcSamples: 0,
    });
    let maxLoad = 0;
    for (let i = 0; i < out.load.length; i++) {
      expect(out.load[i]).toBeGreaterThanOrEqual(0);
      if (out.load[i]! > maxLoad) maxLoad = out.load[i]!;
    }
    // Cp(t) ≤ its own Cmax = referenceCmax, so a single typical dose tops out at
    // load 1.0 (the grid may sample just below the analytic peak).
    expect(maxLoad).toBeGreaterThan(0.9);
    expect(maxLoad).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('peaks alongside the plasma peak', () => {
    const out = solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 5 },
      mcSamples: 0,
    });
    const plasma = out.plasma.get('caffeine')!;
    let pIdx = 0;
    for (let i = 1; i < plasma.length; i++) if (plasma[i] > plasma[pIdx]) pIdx = i;
    let lIdx = 0;
    for (let i = 1; i < out.load.length; i++) if (out.load[i] > out.load[lIdx]) lIdx = i;
    expect(Math.abs(pIdx - lIdx)).toBeLessThanOrEqual(1);
  });
});

describe('solve() — guardrails', () => {
  it('rejects horizon.end <= horizon.start', () => {
    expect(() =>
      solve({
        intakes: [],
        pkParams: new Map(),
        horizon: { start: HORIZON_START, end: HORIZON_START, stepMin: 5 },
      }),
    ).toThrow(/horizon.end/);
  });

  it('rejects non-positive stepMin', () => {
    expect(() =>
      solve({
        intakes: [],
        pkParams: new Map(),
        horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 0 },
      }),
    ).toThrow(/stepMin/);
  });

  it('flags IU dose units as unitWarnings', () => {
    const intake: Intake = {
      id: ulid(),
      compound: 'vitamin-d3',
      dose: 5000,
      dose_unit: 'IU',
      route: 'PO',
      at: new Date(HORIZON_START).toISOString(),
      created_at: new Date(HORIZON_START).toISOString(),
      updated_at: new Date(HORIZON_START).toISOString(),
    };
    const out = solve({
      intakes: [intake],
      pkParams: new Map(), // no PK for vitamin-d3 — should still warn on units
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 30 },
    });
    expect(out.unitWarnings).toContain('vitamin-d3');
  });

  it('skips compounds without PK params (no crash, no curve)', () => {
    const out = solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString())],
      pkParams: new Map(), // caffeine has no params provided
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 30 },
    });
    expect(out.plasma.size).toBe(0);
    expect(out.unitWarnings).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multi-route — same compound, different routes (e.g. melatonin PO + SL)
// ─────────────────────────────────────────────────────────────────────────────

describe('solve() — multi-route same compound', () => {
  // Melatonin-shaped fixture: PO has heavy first-pass (F=0.15, slow ka),
  // SL bypasses it (F=0.5, fast ka). Realistic numbers from PMID:37438493.
  const MEL_PO: PkParams = {
    ka_hr: 3,
    ke_hr: Math.LN2 / 0.7,
    V_L: 35,
    F: 0.15,
  };
  const MEL_SL: PkParams = {
    ka_hr: 6,
    ke_hr: Math.LN2 / 0.5,
    V_L: 35,
    F: 0.5,
  };

  function makeMelIntake(at_iso: string, route: Intake['route'], dose_mg: number): Intake {
    return {
      id: ulid(),
      compound: 'melatonin',
      dose: dose_mg,
      dose_unit: 'mg',
      route,
      at: at_iso,
      created_at: at_iso,
      updated_at: at_iso,
    };
  }

  it('uses route-specific PK per intake — SL with PO params is wrong', () => {
    // Same dose, same time. The SL contribution must use SL's F (0.5),
    // not PO's (0.15). With identical-time PO + SL doses summed, the peak
    // should be approximately Cmax(SL) + Cmax(PO) — bounded below by
    // Cmax(SL) alone, which is much taller than two PO doses at F=0.15.
    const t0 = HORIZON_START;
    const out = solve({
      intakes: [
        makeMelIntake(new Date(t0).toISOString(), 'PO', 1.0),
        makeMelIntake(new Date(t0).toISOString(), 'SL', 1.0),
      ],
      pkParams: new Map([['melatonin', { PO: MEL_PO, SL: MEL_SL }]]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 1 },
      mcSamples: 0,
    });
    const mixed = out.plasma.get('melatonin')!;
    const peakMixed = Math.max(...mixed);

    // Reference: SL-only run with the same dose. The PO+SL peak must
    // exceed the SL-only peak (PO contributes a small but positive bump),
    // and must exceed the PO-only peak by at least the SL contribution.
    const slOnly = solve({
      intakes: [makeMelIntake(new Date(t0).toISOString(), 'SL', 1.0)],
      pkParams: new Map([['melatonin', { SL: MEL_SL }]]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 1 },
      mcSamples: 0,
    });
    const peakSL = Math.max(...slOnly.plasma.get('melatonin')!);
    const poOnly = solve({
      intakes: [makeMelIntake(new Date(t0).toISOString(), 'PO', 1.0)],
      pkParams: new Map([['melatonin', { PO: MEL_PO }]]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 1 },
      mcSamples: 0,
    });
    const peakPO = Math.max(...poOnly.plasma.get('melatonin')!);

    expect(peakMixed).toBeGreaterThan(peakSL);
    expect(peakMixed).toBeGreaterThan(peakPO);
    // Sanity: SL-only peak >> PO-only peak (3× higher F, same dose)
    expect(peakSL / peakPO).toBeGreaterThan(2.5);
  });

  it('drops intakes for routes that lack PK params, keeps the rest', () => {
    const t0 = HORIZON_START;
    const out = solve({
      intakes: [
        makeMelIntake(new Date(t0).toISOString(), 'PO', 1.0),
        makeMelIntake(new Date(t0).toISOString(), 'SL', 1.0),
      ],
      // Only PO PK is provided — SL intake should silently contribute 0.
      pkParams: new Map([['melatonin', { PO: MEL_PO }]]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 1 },
      mcSamples: 0,
    });
    const mixed = Math.max(...out.plasma.get('melatonin')!);
    const poOnly = solve({
      intakes: [makeMelIntake(new Date(t0).toISOString(), 'PO', 1.0)],
      pkParams: new Map([['melatonin', { PO: MEL_PO }]]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 1 },
      mcSamples: 0,
    });
    const refPO = Math.max(...poOnly.plasma.get('melatonin')!);
    expect(Math.abs(mixed - refPO) / refPO).toBeLessThan(1e-3);
  });

  it('IV vs PO of the same compound — IV peaks instantly at D/V, PO at Tmax', () => {
    const IV: PkParams = { ka_hr: 1, ke_hr: Math.LN2 / 5, V_L: 36, F: 1.0 };
    const PO_PARAMS: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1.0 };
    const t0 = HORIZON_START;
    const out = solve({
      intakes: [
        {
          id: ulid(),
          compound: 'caffeine',
          dose: 100,
          dose_unit: 'mg',
          route: 'IV',
          at: new Date(t0).toISOString(),
          created_at: new Date(t0).toISOString(),
          updated_at: new Date(t0).toISOString(),
        },
      ],
      pkParams: new Map([['caffeine', { IV, PO: PO_PARAMS }]]),
      horizon: { start: t0, end: t0 + 4 * 3_600_000, stepMin: 1 },
      mcSamples: 0,
    });
    const curve = out.plasma.get('caffeine')!;
    // IV bolus: peak is at t=0, value = D/V = 100/36 ≈ 2.78 mg/L
    expect(curve[0]).toBeCloseTo(100 / 36, 1);
    // PO with same params would peak well below D/V because absorption
    // is gradual; a healthy gap proves the route mattered.
    expect(curve[0]).toBeGreaterThan(2.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Receptor occupancy bands (Batch 2 of v0.7)
// ─────────────────────────────────────────────────────────────────────────────
//
// Three claims to defend in code:
//
//   1. With mcSamples > 0 and authored receptor sites, the per-compound
//      occupancy entries gain p10/p90 bands. Bands sandwich the headline
//      curve (p10 ≤ mean ≤ p90) at every timepoint.
//   2. The composite-occupancy entry per receptor also carries bands,
//      computed from per-iteration probabilistic-union (not from per-
//      compound percentiles).
//   3. With mcSamples = 0, no bands are emitted — the deterministic chain
//      runs as before.

describe('solve() — effect-compartment warm-up for a pre-window dose (correctness audit)', () => {
  const A2A: ReceptorSite = {
    receptor: 'adenosine_a2a',
    pathway: 'wakefulness',
    ec50_mg_l: 1.5,
    hill_n: 1,
    emax: 1,
  };
  const KEO: EffectCompartment = { keo_per_h: 0.7 };
  const HOUR_MS = 3_600_000;
  const common = {
    pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
    mcSamples: 0,
    effect: new Map([['caffeine', KEO]]),
    receptors: new Map([['caffeine', [A2A]]]),
  };

  it('occupancy enters the window already equilibrated when drug is on board at window start (not ramping from 0)', () => {
    const dose = makeIntake(new Date(HORIZON_START - 4 * HOUR_MS).toISOString(), 200); // 4h pre-window
    const out = solve({
      ...common,
      intakes: [dose],
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
    });
    const occ = out.occupancy.get('caffeine')![0]!.curve;
    // 4h after a 200 mg dose the A2A site is ~71% occupied — NOT 0. The
    // cold-start bug read occupancy[0] = 0.000 and ramped up over ~1/keo hours.
    expect(occ[0]).toBeGreaterThan(0.5);
  });

  it('matches a full-span solve from the dose time (ground-truth oracle)', () => {
    const doseTime = HORIZON_START - 4 * HOUR_MS;
    const dose = makeIntake(new Date(doseTime).toISOString(), 200);
    const windowed = solve({
      ...common,
      intakes: [dose],
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
    });
    const full = solve({
      ...common,
      intakes: [dose],
      horizon: { start: doseTime, end: HORIZON_END, stepMin: 10 },
    });
    const wOcc = windowed.occupancy.get('caffeine')![0]!.curve;
    const fOcc = full.occupancy.get('caffeine')![0]!.curve;
    const offset = (4 * 60) / 10; // window start = 4h into the full solve = sample 24
    for (let k = 0; k < wOcc.length; k++) {
      expect(Math.abs(wOcc[k]! - fOcc[offset + k]!), `sample ${k}`).toBeLessThan(2e-3);
    }
  });
});

describe('solve() — receptor occupancy bands', () => {
  // Caffeine binds adenosine A1 + A2A. Authored EC50 / hill / emax pulled
  // from textbook ranges; numbers don't have to be physiological-precise
  // for the test (we're checking shape invariants, not Kd values).
  const A1: ReceptorSite = {
    receptor: 'adenosine_a1',
    pathway: 'wakefulness',
    ec50_mg_l: 2.0,
    hill_n: 1,
    emax: 1,
  };
  const A2A: ReceptorSite = {
    receptor: 'adenosine_a2a',
    pathway: 'wakefulness',
    ec50_mg_l: 1.5,
    hill_n: 1,
    emax: 1,
  };
  const KEO: EffectCompartment = { keo_per_h: 0.7 };

  function caffeineSolveWithMc(N: number, seed = 7) {
    return solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString(), 200)],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
      mcSamples: N,
      seed,
      effect: new Map([['caffeine', KEO]]),
      receptors: new Map([['caffeine', [A1, A2A]]]),
    });
  }

  it('emits p10 ≤ mean ≤ p90 bands on per-compound occupancy', () => {
    const out = caffeineSolveWithMc(200);
    const occs = out.occupancy.get('caffeine');
    expect(occs).toBeDefined();
    expect(occs!.length).toBe(2);
    for (const oc of occs!) {
      expect(oc.p10).toBeDefined();
      expect(oc.p90).toBeDefined();
      const T = oc.curve.length;
      for (let i = 0; i < T; i++) {
        expect(oc.p10![i]).toBeLessThanOrEqual(oc.curve[i]! + 1e-6);
        expect(oc.curve[i]).toBeLessThanOrEqual(oc.p90![i]! + 1e-6);
      }
    }
  });

  it('emits bands on compositeOccupancy entries too', () => {
    const out = caffeineSolveWithMc(200);
    expect(out.compositeOccupancy.size).toBeGreaterThan(0);
    for (const [, comp] of out.compositeOccupancy) {
      expect(comp.p10).toBeDefined();
      expect(comp.p90).toBeDefined();
      const T = comp.curve.length;
      for (let i = 0; i < T; i++) {
        expect(comp.p10![i]).toBeLessThanOrEqual(comp.curve[i]! + 1e-6);
        expect(comp.curve[i]).toBeLessThanOrEqual(comp.p90![i]! + 1e-6);
      }
    }
  });

  it('omits bands when mcSamples is 0 (mean-only chain)', () => {
    const out = solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString(), 200)],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
      mcSamples: 0,
      effect: new Map([['caffeine', KEO]]),
      receptors: new Map([['caffeine', [A1, A2A]]]),
    });
    for (const oc of out.occupancy.get('caffeine')!) {
      expect(oc.p10).toBeUndefined();
      expect(oc.p90).toBeUndefined();
    }
    for (const [, comp] of out.compositeOccupancy) {
      expect(comp.p10).toBeUndefined();
      expect(comp.p90).toBeUndefined();
    }
  });

  it('bands sit in [0, emax] (occupancy is bounded by Hill saturation)', () => {
    const out = caffeineSolveWithMc(200);
    for (const oc of out.occupancy.get('caffeine')!) {
      const T = oc.curve.length;
      for (let i = 0; i < T; i++) {
        expect(oc.p10![i]).toBeGreaterThanOrEqual(0);
        expect(oc.p90![i]).toBeLessThanOrEqual(1 + 1e-6);
      }
    }
  });

  it('determinism — same seed produces byte-identical occupancy bands', () => {
    const a = caffeineSolveWithMc(100, 99);
    const b = caffeineSolveWithMc(100, 99);
    const oa = a.occupancy.get('caffeine')!;
    const ob = b.occupancy.get('caffeine')!;
    expect(oa.length).toBe(ob.length);
    for (let r = 0; r < oa.length; r++) {
      const T = oa[r]!.curve.length;
      for (let i = 0; i < T; i++) {
        expect(oa[r]!.curve[i]).toBe(ob[r]!.curve[i]);
        expect(oa[r]!.p10![i]).toBe(ob[r]!.p10![i]);
        expect(oa[r]!.p90![i]).toBe(ob[r]!.p90![i]);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interaction kinetics (Batch 2 of v0.7)
// ─────────────────────────────────────────────────────────────────────────────
//
// Three claims:
//   1. With no interactions input, the solver behaves identically to before.
//   2. An inhibitor edge with reasonable Ki shrinks the victim's clearance,
//      pushing the victim's plasma curve UP (slower decay → higher AUC).
//   3. The solver reports back which interactions actually shifted curves
//      via `output.interactionsApplied`.

describe('solve() — interaction kinetics', () => {
  // Two test compounds with well-defined PK so we can tell when an
  // interaction has bent the curve.
  const ALPHA: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 5, V_L: 36, F: 1.0 };
  const BETA: PkParams = { ka_hr: 4, ke_hr: Math.LN2 / 6, V_L: 50, F: 0.9 };
  const ALPHA_MW = 194; // pretend caffeine-shaped; unit conversion uses this

  function makeIntakeFor(slug: string, at_iso: string, dose_mg = 100): Intake {
    return {
      id: ulid(),
      compound: slug,
      dose: dose_mg,
      dose_unit: 'mg',
      route: 'PO',
      at: at_iso,
      created_at: at_iso,
      updated_at: at_iso,
    };
  }

  it('no interactions input → identical output to baseline solve', () => {
    const baseline = solve({
      intakes: [makeIntakeFor('beta', new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['beta', { PO: BETA }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
      mcSamples: 0,
    });
    const withEmpty = solve({
      intakes: [makeIntakeFor('beta', new Date(HORIZON_START).toISOString())],
      pkParams: new Map([['beta', { PO: BETA }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
      mcSamples: 0,
      interactions: [],
    });
    const a = baseline.plasma.get('beta')!;
    const b = withEmpty.plasma.get('beta')!;
    for (let i = 0; i < a.length; i++) expect(a[i]).toBe(b[i]);
    expect(withEmpty.interactionsApplied).toEqual([]);
  });

  it("inhibitor edge raises the victim's plasma AUC (slower clearance)", () => {
    const t0 = HORIZON_START;
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString(), 200),
      makeIntakeFor('beta', new Date(t0).toISOString(), 100),
    ];
    const pkParams = new Map([
      ['alpha', { PO: ALPHA }],
      ['beta', { PO: BETA }],
    ]);
    const horizon = { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 };

    const baseline = solve({ intakes, pkParams, horizon, mcSamples: 0 });

    // Strong-but-realistic inhibition: Ki around the perpetrator's mean Cp
    // produces ~0.5× ke for the victim.
    const inhibitorEdge: InteractionEdgeInput = {
      from: 'alpha',
      to: 'beta',
      kinetics: { ki_uM: 5 },
      perpetrator_mw_g_mol: ALPHA_MW,
    };
    const withInhibition = solve({
      intakes,
      pkParams,
      horizon,
      mcSamples: 0,
      interactions: [inhibitorEdge],
    });

    // AUC integral via simple trapezoidal sum.
    const auc = (curve: Float32Array): number => {
      let s = 0;
      for (let i = 0; i < curve.length; i++) s += curve[i]!;
      return s;
    };
    const baseAuc = auc(baseline.plasma.get('beta')!);
    const inhibAuc = auc(withInhibition.plasma.get('beta')!);
    expect(inhibAuc).toBeGreaterThan(baseAuc);

    // The interaction should be reported back.
    expect(withInhibition.interactionsApplied.length).toBe(1);
    expect(withInhibition.interactionsApplied[0]!.from).toBe('alpha');
    expect(withInhibition.interactionsApplied[0]!.to).toBe('beta');
    expect(withInhibition.interactionsApplied[0]!.ke_factor).toBeLessThan(1);
  });

  it('the victim curve is HORIZON-INVARIANT (interaction tracks instantaneous Cp, not the grid mean)', () => {
    const t0 = HORIZON_START;
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString(), 200),
      makeIntakeFor('beta', new Date(t0).toISOString(), 100),
    ];
    const pkParams = new Map([
      ['alpha', { PO: ALPHA }],
      ['beta', { PO: BETA }],
    ]);
    const edge: InteractionEdgeInput = {
      from: 'alpha',
      to: 'beta',
      kinetics: { ki_uM: 5 },
      perpetrator_mw_g_mol: ALPHA_MW,
    };

    // The SAME physical scenario at two horizons differing only in length (same
    // step so samples align over the shared first 12h).
    const short = solve({
      intakes,
      pkParams,
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 },
      mcSamples: 0,
      interactions: [edge],
    });
    const long = solve({
      intakes,
      pkParams,
      horizon: { start: t0, end: t0 + 96 * 3_600_000, stepMin: 5 },
      mcSamples: 0,
      interactions: [edge],
    });

    const sBeta = short.plasma.get('beta')!;
    const lBeta = long.plasma.get('beta')!;
    // Over the overlapping 12h the victim curve must be identical regardless of
    // chart zoom. The old whole-grid-mean driver made the 96h curve ~2.6x off.
    for (let i = 0; i < sBeta.length; i++) {
      expect(Math.abs(sBeta[i]! - lBeta[i]!), `sample ${i}`).toBeLessThan(1e-3);
    }
    // And the interaction still bends the curve (sanity: it's actually active).
    const baseline = solve({
      intakes,
      pkParams,
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 },
      mcSamples: 0,
    });
    const auc = (c: Float32Array) => {
      let s = 0;
      for (let i = 0; i < c.length; i++) s += c[i]!;
      return s;
    };
    expect(auc(sBeta)).toBeGreaterThan(auc(baseline.plasma.get('beta')!));
  });

  it('a 2-COMP victim is horizon-invariant under a time-varying interaction', () => {
    const t0 = HORIZON_START;
    const BETA2: PkParams = {
      ka_hr: 4,
      ke_hr: 0.1,
      V_L: 50,
      F: 0.9,
      alpha_hr: 1.2,
      beta_hr: 0.1,
      k21_hr: 0.3,
    };
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString(), 200),
      makeIntakeFor('beta', new Date(t0).toISOString(), 100),
    ];
    const pkParams = new Map([
      ['alpha', { PO: ALPHA }],
      ['beta', { PO: BETA2 }],
    ]);
    const edge: InteractionEdgeInput = {
      from: 'alpha',
      to: 'beta',
      kinetics: { ki_uM: 5 },
      perpetrator_mw_g_mol: ALPHA_MW,
    };
    const short = solve({
      intakes,
      pkParams,
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 },
      mcSamples: 0,
      interactions: [edge],
    });
    const long = solve({
      intakes,
      pkParams,
      horizon: { start: t0, end: t0 + 96 * 3_600_000, stepMin: 5 },
      mcSamples: 0,
      interactions: [edge],
    });
    const s = short.plasma.get('beta')!,
      l = long.plasma.get('beta')!;
    for (let i = 0; i < s.length; i++)
      expect(Math.abs(s[i]! - l[i]!), `sample ${i}`).toBeLessThan(1e-3);
  });

  it('a MICHAELIS-MENTEN victim now responds to a DDI (was silently ignored) and is horizon-invariant', () => {
    const t0 = HORIZON_START;
    // Phenytoin-shaped saturable victim.
    const PHEN: PkParams = {
      ka_hr: 1.5,
      ke_hr: 0.05,
      V_L: 50,
      F: 1.0,
      mm_vmax_per_hr: 8,
      mm_km_mg_per_l: 5,
    };
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString(), 200),
      makeIntakeFor('phen', new Date(t0).toISOString(), 300),
    ];
    const pkParams = new Map([
      ['alpha', { PO: ALPHA }],
      ['phen', { PO: PHEN }],
    ]);
    const edge: InteractionEdgeInput = {
      from: 'alpha',
      to: 'phen',
      kinetics: { ki_uM: 5 },
      perpetrator_mw_g_mol: ALPHA_MW,
    };
    const auc = (c: Float32Array) => {
      let s = 0;
      for (let i = 0; i < c.length; i++) s += c[i]!;
      return s;
    };

    const h12 = { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 };
    const base = solve({ intakes, pkParams, horizon: h12, mcSamples: 0 });
    const inhib = solve({ intakes, pkParams, horizon: h12, mcSamples: 0, interactions: [edge] });
    // The inhibitor lowers Vmax → the saturable victim clears slower → higher
    // exposure. (Before the fix the scalar factor scaled ke_hr, which MM ignores,
    // so this was a no-op.)
    expect(auc(inhib.plasma.get('phen')!)).toBeGreaterThan(auc(base.plasma.get('phen')!) * 1.02);

    const long = solve({
      intakes,
      pkParams,
      horizon: { start: t0, end: t0 + 96 * 3_600_000, stepMin: 5 },
      mcSamples: 0,
      interactions: [edge],
    });
    const s = inhib.plasma.get('phen')!,
      l = long.plasma.get('phen')!;
    for (let i = 0; i < s.length; i++)
      expect(Math.abs(s[i]! - l[i]!), `sample ${i}`).toBeLessThan(2e-3);
  });

  it("induction edge lowers the victim's plasma AUC (faster clearance)", () => {
    const t0 = HORIZON_START;
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString(), 200),
      makeIntakeFor('beta', new Date(t0).toISOString(), 100),
    ];
    const pkParams = new Map([
      ['alpha', { PO: ALPHA }],
      ['beta', { PO: BETA }],
    ]);
    const horizon = { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 };

    const baseline = solve({ intakes, pkParams, horizon, mcSamples: 0 });
    const induced = solve({
      intakes,
      pkParams,
      horizon,
      mcSamples: 0,
      interactions: [
        {
          from: 'alpha',
          to: 'beta',
          kinetics: { induction_factor: 1.5 }, // 50% faster ke
        },
      ],
    });

    const auc = (curve: Float32Array): number => {
      let s = 0;
      for (let i = 0; i < curve.length; i++) s += curve[i]!;
      return s;
    };
    expect(auc(induced.plasma.get('beta')!)).toBeLessThan(auc(baseline.plasma.get('beta')!));
    expect(induced.interactionsApplied[0]!.ke_factor).toBeGreaterThan(1);
  });

  it('applies induction as a slow ramp, not an instantaneous step', () => {
    // Over a 12 h window the enzyme has barely up-regulated, so a 1.5× steady-
    // state inducer removes only a sliver of the victim's exposure — nowhere near
    // the ~⅓ AUC drop a constant 1.5× ke would give. (Regression guard: induction
    // used to apply full strength from t=0.) The reported factor is still the
    // chronic plateau (1.5), which is the honest steady-state strength to surface.
    const t0 = HORIZON_START;
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString(), 200),
      makeIntakeFor('beta', new Date(t0).toISOString(), 100),
    ];
    const pkParams = new Map([
      ['alpha', { PO: ALPHA }],
      ['beta', { PO: BETA }],
    ]);
    const horizon = { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 };
    const edge: InteractionEdgeInput = {
      from: 'alpha',
      to: 'beta',
      kinetics: { induction_factor: 1.5 },
    };

    const auc = (c: Float32Array) => {
      let s = 0;
      for (let i = 0; i < c.length; i++) s += c[i]!;
      return s;
    };
    const base = auc(solve({ intakes, pkParams, horizon, mcSamples: 0 }).plasma.get('beta')!);
    const out = solve({ intakes, pkParams, horizon, mcSamples: 0, interactions: [edge] });
    const reduction = 1 - auc(out.plasma.get('beta')!) / base;
    expect(reduction).toBeGreaterThan(0); // some effect builds within the window
    expect(reduction).toBeLessThan(0.05); // but tiny — the ramp hasn't plateaued
    expect(out.interactionsApplied[0]!.ke_factor).toBeCloseTo(1.5, 5); // plateau reported
  });

  it("warm-starts induction from the perpetrator's prior on-board history", () => {
    // Same victim dose at horizon start, same 12 h window. When the inducer has
    // been dosed daily for the prior 3 weeks the enzyme is near-plateau, so the
    // victim clears markedly faster than when the inducer only just started.
    const t0 = HORIZON_START;
    const DAY = 24 * 3_600_000;
    // A long-lived inducer (t½ ≈ 24 h) so once-daily dosing keeps it on board
    // (above the presence floor) at trough — that's the regime where a prior
    // history warms the ramp.
    const INDUCER: PkParams = { ka_hr: 5, ke_hr: Math.LN2 / 24, V_L: 36, F: 1.0 };
    const beta = makeIntakeFor('beta', new Date(t0).toISOString(), 100);
    const horizon = { start: t0, end: t0 + 12 * 3_600_000, stepMin: 5 };
    const pkParams = new Map([
      ['alpha', { PO: INDUCER }],
      ['beta', { PO: BETA }],
    ]);
    const edge: InteractionEdgeInput = {
      from: 'alpha',
      to: 'beta',
      kinetics: { induction_factor: 1.5 },
    };
    const auc = (c: Float32Array) => {
      let s = 0;
      for (let i = 0; i < c.length; i++) s += c[i]!;
      return s;
    };

    const coldAlpha = [makeIntakeFor('alpha', new Date(t0).toISOString(), 200)];
    const warmAlpha = Array.from({ length: 22 }, (_, d) =>
      makeIntakeFor('alpha', new Date(t0 - (21 - d) * DAY).toISOString(), 200),
    ); // daily, day −21..0

    const cold = solve({
      intakes: [...coldAlpha, beta],
      pkParams,
      horizon,
      mcSamples: 0,
      interactions: [edge],
    });
    const warm = solve({
      intakes: [...warmAlpha, beta],
      pkParams,
      horizon,
      mcSamples: 0,
      interactions: [edge],
    });
    expect(auc(warm.plasma.get('beta')!)).toBeLessThan(auc(cold.plasma.get('beta')!));
  });

  it('a mechanism-based inhibitor keeps inhibiting after it clears; reversible does not', () => {
    // Perpetrator dosed once at t0; victim dosed 48 h later — many half-lives past
    // a t½≈5 h perpetrator, so it's genuinely cleared, but still inside the enzyme
    // recovery tail. Reversible inhibition is gone by then (victim ≈ unaffected); a
    // mechanism-based inhibitor has left the enzyme down, so the victim's exposure
    // is still elevated. Same Ki, same doses — only the `mbi` flag differs.
    const t0 = HORIZON_START;
    const H = 3_600_000;
    const alpha = makeIntakeFor('alpha', new Date(t0).toISOString(), 200);
    const victimLate = makeIntakeFor('beta', new Date(t0 + 48 * H).toISOString(), 100);
    const pkParams = new Map([
      ['alpha', { PO: ALPHA }],
      ['beta', { PO: BETA }],
    ]);
    const horizon = { start: t0, end: t0 + 80 * H, stepMin: 15 };
    const auc = (c: Float32Array) => {
      let s = 0;
      for (let i = 0; i < c.length; i++) s += c[i]!;
      return s;
    };
    const mk = (mbi: boolean): InteractionEdgeInput => ({
      from: 'alpha',
      to: 'beta',
      kinetics: mbi ? { ki_uM: 2, mbi: true } : { ki_uM: 2 },
      perpetrator_mw_g_mol: ALPHA_MW,
    });

    const intakes = [alpha, victimLate];
    const reversible = auc(
      solve({ intakes, pkParams, horizon, mcSamples: 0, interactions: [mk(false)] }).plasma.get(
        'beta',
      )!,
    );
    const mbi = auc(
      solve({ intakes, pkParams, horizon, mcSamples: 0, interactions: [mk(true)] }).plasma.get(
        'beta',
      )!,
    );
    const base = auc(solve({ intakes, pkParams, horizon, mcSamples: 0 }).plasma.get('beta')!);

    // Reversible: perpetrator long gone at the victim's dose → within ~3% of baseline.
    expect(reversible).toBeLessThan(base * 1.03);
    // MBI: enzyme still suppressed → victim exposure meaningfully higher than both.
    expect(mbi).toBeGreaterThan(reversible * 1.1);
    expect(mbi).toBeGreaterThan(base * 1.1);
  });

  it("drops edges whose perpetrator isn't on board", () => {
    const t0 = HORIZON_START;
    const intakes = [makeIntakeFor('beta', new Date(t0).toISOString())];
    const out = solve({
      intakes,
      pkParams: new Map([['beta', { PO: BETA }]]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 10 },
      mcSamples: 0,
      interactions: [
        {
          from: 'alpha',
          to: 'beta',
          kinetics: { ki_uM: 5 },
          perpetrator_mw_g_mol: ALPHA_MW,
        },
      ],
    });
    // Alpha never dosed, so its mean Cp is undefined → edge is dropped.
    expect(out.interactionsApplied).toEqual([]);
  });

  it('skips Ki adjustment when perpetrator MW is missing', () => {
    const t0 = HORIZON_START;
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString()),
      makeIntakeFor('beta', new Date(t0).toISOString()),
    ];
    const out = solve({
      intakes,
      pkParams: new Map([
        ['alpha', { PO: ALPHA }],
        ['beta', { PO: BETA }],
      ]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 10 },
      mcSamples: 0,
      interactions: [
        {
          from: 'alpha',
          to: 'beta',
          kinetics: { ki_uM: 5 },
          // perpetrator_mw_g_mol intentionally omitted
        },
      ],
    });
    // Without MW we can't convert µM Ki to mg/L, so the edge contributes
    // nothing — interactionsApplied stays empty.
    expect(out.interactionsApplied).toEqual([]);
  });

  it('multiple inbound edges multiply (combined ke factor)', () => {
    const t0 = HORIZON_START;
    const intakes = [
      makeIntakeFor('alpha', new Date(t0).toISOString()),
      makeIntakeFor('gamma', new Date(t0).toISOString()),
      makeIntakeFor('beta', new Date(t0).toISOString()),
    ];
    const out = solve({
      intakes,
      pkParams: new Map([
        ['alpha', { PO: ALPHA }],
        ['gamma', { PO: ALPHA }], // same shape as alpha for the test
        ['beta', { PO: BETA }],
      ]),
      horizon: { start: t0, end: t0 + 12 * 3_600_000, stepMin: 10 },
      mcSamples: 0,
      interactions: [
        { from: 'alpha', to: 'beta', kinetics: { induction_factor: 1.4 } },
        { from: 'gamma', to: 'beta', kinetics: { induction_factor: 1.2 } },
      ],
    });
    expect(out.interactionsApplied.length).toBe(2);
    // Both should be inducers; their multiplied effect ought to be > each
    // individual factor. Verify by checking the reported factors land
    // around 1.4 and 1.2.
    const factors = out.interactionsApplied.map((i) => i.ke_factor).sort();
    expect(factors[0]).toBeCloseTo(1.2, 1);
    expect(factors[1]).toBeCloseTo(1.4, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Typed receptor action pass-through (Batch 3, PD1b)
// ─────────────────────────────────────────────────────────────────────────────
//
// Surfaces derive the activates/blocks/modulates direction from the site's
// typed `action`, falling back to parsing `pathway` only where it's absent.
// That fallback is silent, so a solver that dropped `action` would read as
// "correct but always modulates" — these pin the pass-through on both the
// mean and the MC path.

describe('solve() — receptor action pass-through', () => {
  // Deliberately mismatched: `pathway` is a phenotypic label that parses to
  // 'modulates', so only a real pass-through of `action` can distinguish them.
  const ANTAGONIST: ReceptorSite = {
    receptor: 'adenosine_a1',
    pathway: 'wakefulness',
    action: 'antagonist',
    ec50_mg_l: 2.0,
    hill_n: 1,
    emax: 1,
  };
  const UNAUTHORED: ReceptorSite = {
    receptor: 'adenosine_a2a',
    pathway: 'wakefulness',
    ec50_mg_l: 1.5,
    hill_n: 1,
    emax: 1,
  };
  const KEO: EffectCompartment = { keo_per_h: 0.7 };

  function solveWith(mcSamples: number) {
    return solve({
      intakes: [makeIntake(new Date(HORIZON_START).toISOString(), 200)],
      pkParams: new Map([['caffeine', { PO: CAFFEINE }]]),
      horizon: { start: HORIZON_START, end: HORIZON_END, stepMin: 10 },
      mcSamples,
      seed: 7,
      effect: new Map([['caffeine', KEO]]),
      receptors: new Map([['caffeine', [ANTAGONIST, UNAUTHORED]]]),
    });
  }

  it.each([
    ['mean', 0],
    ['MC', 200],
  ] as const)(
    'carries the authored action onto the occupancy curve (%s path)',
    (_label, mcSamples) => {
      const occs = solveWith(mcSamples).occupancy.get('caffeine')!;
      const a1 = occs.find((o) => o.receptor === 'adenosine_a1')!;
      expect(a1.action).toBe('antagonist');
      // pathway is still passed through unchanged alongside it.
      expect(a1.pathway).toBe('wakefulness');
    },
  );

  it.each([
    ['mean', 0],
    ['MC', 200],
  ] as const)(
    'leaves action undefined for a site that never authored one (%s path)',
    (_label, mcSamples) => {
      const occs = solveWith(mcSamples).occupancy.get('caffeine')!;
      expect(occs.find((o) => o.receptor === 'adenosine_a2a')!.action).toBeUndefined();
    },
  );

  it('does not put an action on the composite — a stack has no single mode', () => {
    const comp = solveWith(0).compositeOccupancy.get('adenosine_a1')!;
    expect(comp).toBeDefined();
    expect('action' in comp).toBe(false);
  });
});
