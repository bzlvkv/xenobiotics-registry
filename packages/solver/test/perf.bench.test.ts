/**
 * perf.bench.test.ts — solver wall-clock regression gate.
 *
 * Env-gated (XENO_BENCH=1) so it never slows normal `vitest run`. Run:
 *   XENO_BENCH=1 pnpm -F @xeno/solver exec vitest run test/perf.bench.test.ts
 *
 * It records the loads that drove the perf rewrite. The Monte-Carlo loop
 * is the cost: pre-rewrite a 20-compound × 90-dose schedule at MC=100 took
 * ~6 s (a UI freeze). This is the before/after ledger and the trigger for
 * deciding whether WASM is still worth porting after the algorithmic work.
 */
import { describe, it, expect } from 'vitest';
import { solve } from '../src';
import type { PkParams, SolveInput } from '../src/types';
import type { Intake } from '@xeno/core';

const RUN = process.env.XENO_BENCH === '1';
const NOW = Date.parse('2026-05-29T12:00:00Z');
const HOUR = 3_600_000;

function pkFor(c: number): PkParams {
  return { ka_hr: 2.5 + (c % 5), ke_hr: Math.LN2 / (4 + (c % 9)), V_L: 30 + c, F: 0.9 };
}

interface Spec {
  C: number;
  dosesPerCompound: number;
  doseSpanHr: number;
  horizonHr: number;
  stepMin: number;
  mc: number;
}

function build(spec: Spec): SolveInput {
  const intakes: Intake[] = [];
  const pkParams = new Map<string, Partial<Record<'PO', PkParams>>>();
  for (let c = 0; c < spec.C; c++) {
    const slug = `c${c}`;
    pkParams.set(slug, { PO: pkFor(c) });
    for (let d = 0; d < spec.dosesPerCompound; d++) {
      const ageHr =
        spec.dosesPerCompound === 1 ? 1 : (d / (spec.dosesPerCompound - 1)) * spec.doseSpanHr;
      const at = new Date(NOW - ageHr * HOUR).toISOString();
      intakes.push({
        id: `${slug}-${d}`,
        compound: slug,
        dose: 100,
        dose_unit: 'mg',
        route: 'PO',
        at,
        created_at: at,
        updated_at: at,
      });
    }
  }
  return {
    intakes,
    pkParams: pkParams as SolveInput['pkParams'],
    horizon: {
      start: NOW - spec.horizonHr * HOUR,
      end: NOW + spec.horizonHr * HOUR,
      stepMin: spec.stepMin,
    },
    mcSamples: spec.mc,
    seed: 42,
  };
}

function bench(label: string, spec: Spec, reps = 5): void {
  const input = build(spec);
  solve(input); // warm
  const ts: number[] = [];
  for (let r = 0; r < reps; r++) {
    const t0 = performance.now();
    solve(input);
    ts.push(performance.now() - t0);
  }
  ts.sort((a, b) => a - b);
  const med = ts[Math.floor(reps / 2)]!;
  const T =
    Math.floor((input.horizon.end - input.horizon.start) / (input.horizon.stepMin * 60_000)) + 1;
  console.log(
    `${label.padEnd(34)} median=${med.toFixed(1).padStart(8)}ms  C=${spec.C} D=${input.intakes.length} T=${T} mc=${spec.mc}`,
  );
}

describe.runIf(RUN)('solver perf ledger', () => {
  it('records representative + stress loads', () => {
    bench('Today 6h, mc=0', {
      C: 12,
      dosesPerCompound: 3,
      doseSpanHr: 14 * 24,
      horizonHr: 6,
      stepMin: 5,
      mc: 0,
    });
    bench('Today 6h, mc=100', {
      C: 12,
      dosesPerCompound: 3,
      doseSpanHr: 14 * 24,
      horizonHr: 6,
      stepMin: 5,
      mc: 100,
    });
    bench('1mo view, mc=100', {
      C: 12,
      dosesPerCompound: 3,
      doseSpanHr: 14 * 24,
      horizonHr: 720,
      stepMin: 60,
      mc: 100,
    });
    bench('LongSched 20c×90d, mc=0', {
      C: 20,
      dosesPerCompound: 90,
      doseSpanHr: 90 * 24,
      horizonHr: 24,
      stepMin: 5,
      mc: 0,
    });
    bench('LongSched 20c×90d, mc=100', {
      C: 20,
      dosesPerCompound: 90,
      doseSpanHr: 90 * 24,
      horizonHr: 24,
      stepMin: 5,
      mc: 100,
    });
    bench('Polypharm 40c×10d, mc=200', {
      C: 40,
      dosesPerCompound: 10,
      doseSpanHr: 14 * 24,
      horizonHr: 24,
      stepMin: 5,
      mc: 200,
    });
    expect(true).toBe(true);
  }, 600_000);
});

// Keep at least one always-collected assertion so the file isn't "empty"
// when the gate is off (vitest treats a file with zero tests as an error).
describe('perf bench harness', () => {
  it('builds a valid SolveInput', () => {
    const input = build({
      C: 2,
      dosesPerCompound: 2,
      doseSpanHr: 24,
      horizonHr: 6,
      stepMin: 5,
      mc: 0,
    });
    expect(input.intakes.length).toBe(4);
    expect(solve(input).plasma.size).toBe(2);
  });
});
