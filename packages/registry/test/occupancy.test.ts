/**
 * occupancy.test.ts — the PD spot-check.
 *
 * The arithmetic is pinned against hand-computable cases and against two limits
 * that must hold for any correct effect-compartment solution: Ce peaks after Cp,
 * and Ce collapses onto Cp as equilibration becomes instant. Those two catch a
 * wrong coefficient, which a single worked example can miss.
 */
import { describe, expect, it } from 'vitest';
import { impliedExposure, impliedOccupancy, impliedOccupancies } from '../src/index';
import type { Compound, ReceptorSite } from '../src/index';

const base = (over: Partial<Compound> = {}): Compound =>
  ({
    slug: 'x',
    name: 'X',
    category: 'pharmacological',
    mechanism: 'm',
    routes: ['PO'],
    systems: ['nervous'],
    aliases: [],
    refs: [],
    doses: { PO: { min: 10, max: 10, typical: 10, unit: 'mg' } },
    half_life_hr: { PO: 4 },
    pk: { PO: { F: 1, V_L: 100, ka_hr: 2 } },
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:1' },
    ...over,
  }) as unknown as Compound;

const site = (over: Partial<ReceptorSite> = {}): ReceptorSite =>
  ({ receptor: 'r', emax: 1, ec50_mg_l: 0.05, hill_n: 1, ...over }) as ReceptorSite;

describe('impliedOccupancy', () => {
  it('peaks LATER than the plasma curve, which is what an effect compartment is', () => {
    const c = base();
    const e = impliedExposure(c, 'PO');
    const o = impliedOccupancy(c, 'PO', site());
    if (!o.ok || !e.ok) throw new Error('expected both to resolve');
    expect(o.tCeMaxHr).toBeGreaterThan(e.tmaxHr);
  });

  it('collapses onto the plasma peak as equilibration becomes instant', () => {
    // keo -> infinity means Ce == Cp, so CeMax must approach Cmax. This is the
    // limit that catches a wrong leading coefficient in the three-term form.
    const c = base({ effect_compartment: { keo_per_h: 5000, source_pmid: 'PMID:1' } } as never);
    const e = impliedExposure(c, 'PO');
    const o = impliedOccupancy(c, 'PO', site());
    if (!o.ok || !e.ok) throw new Error('expected both to resolve');
    expect(o.ceMaxMgPerL / e.cmaxMgPerL).toBeCloseTo(1, 2);
  });

  it('a slower keo gives a lower, later effect-site peak', () => {
    const fast = impliedOccupancy(base(), 'PO', site());
    const slow = impliedOccupancy(
      base({ effect_compartment: { keo_per_h: 0.05, source_pmid: 'PMID:1' } } as never),
      'PO',
      site(),
    );
    if (!fast.ok || !slow.ok) throw new Error('expected both to resolve');
    expect(slow.ceMaxMgPerL).toBeLessThan(fast.ceMaxMgPerL);
    expect(slow.tCeMaxHr).toBeGreaterThan(fast.tCeMaxHr);
  });

  it('applies fraction_unbound to an in-vitro Ki, and says it did', () => {
    const c = base({ fraction_unbound: 0.1 } as never);
    const o = impliedOccupancy(c, 'PO', site());
    if (!o.ok) throw new Error('expected a result');
    expect(o.fu).toEqual({ value: 0.1, from: 'stored' });
    expect(o.effectiveMgPerL).toBeCloseTo(o.ceMaxMgPerL * 0.1, 12);
  });

  it('does NOT apply it to a value already referenced to plasma', () => {
    const c = base({ fraction_unbound: 0.1 } as never);
    const o = impliedOccupancy(c, 'PO', site({ basis: 'in_vivo_plasma_ec50' }));
    if (!o.ok) throw new Error('expected a result');
    expect(o.fu.value).toBe(1);
    expect(o.effectiveMgPerL).toBeCloseTo(o.ceMaxMgPerL, 12);
  });

  it('flags the uncorrected comparison when an in-vitro Ki has no fu', () => {
    const o = impliedOccupancy(base(), 'PO', site());
    if (!o.ok) throw new Error('expected a result');
    expect(o.fu.from).toBe('default');
    expect(o.caveats.join(' ')).toContain('biased HIGH');
  });

  it('computes the Hill fraction against the effective concentration', () => {
    // ec50 set to the effective peak, so occupancy must be exactly half of emax.
    const c = base({ fraction_unbound: 0.5 } as never);
    const probe = impliedOccupancy(c, 'PO', site());
    if (!probe.ok) throw new Error('expected a result');
    const o = impliedOccupancy(c, 'PO', site({ ec50_mg_l: probe.effectiveMgPerL, emax: 0.8 }));
    if (!o.ok) throw new Error('expected a result');
    expect(o.peakOccupancy).toBeCloseTo(0.4, 9);
  });

  it('survives ka == keo, a removable singularity this catalog hits often', () => {
    // 46 compounds share keo 1.0/h and 445 rows default ka to 1.0/h.
    const c = base({
      pk: { PO: { F: 1, V_L: 100, ka_hr: 1 } },
      effect_compartment: { keo_per_h: 1, source_pmid: 'PMID:1' },
    } as never);
    const o = impliedOccupancy(c, 'PO', site());
    if (!o.ok) throw new Error('expected a result');
    expect(Number.isFinite(o.ceMaxMgPerL)).toBe(true);
    expect(o.ceMaxMgPerL).toBeGreaterThan(0);
  });

  it('refuses rather than guesses when no keo is stored', () => {
    const c = base({ effect_compartment: undefined } as never);
    const o = impliedOccupancy(c, 'PO', site());
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.reason).toContain('keo');
  });

  it('carries the exposure caveats through, so a defaulted volume stays visible', () => {
    const c = base({ pk: { PO: { F: 1, ka_hr: 2 } } } as never);
    const o = impliedOccupancy(c, 'PO', site());
    if (!o.ok) throw new Error('expected a result');
    expect(o.caveats.join(' ')).toContain('single dose');
  });

  it('sweeps every row of a record against the first route that resolves', () => {
    const c = base({
      routes: ['IM', 'PO'],
      receptor_occupancy: [site(), site({ receptor: 's' })],
    } as never);
    const out = impliedOccupancies(c);
    expect(out).toHaveLength(2);
    // IM has no half-life here, so PO is used.
    expect(out.every((o) => o.ok && o.route === 'PO')).toBe(true);
  });
});
