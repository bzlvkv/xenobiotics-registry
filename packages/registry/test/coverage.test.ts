/**
 * coverage() over the real registry.
 *
 * The one hard assertion is `unvisited.length === 0`: a compound with neither
 * authored PK nor a `pk_unauthored` reason is one nobody has looked at. Every
 * other number here is descriptive and allowed to move in either direction —
 * notably `pkUnauthored`, which GOES UP when an audit correctly removes an
 * unsourceable value. A test that treated that as regression would punish the
 * behaviour the project wants.
 */

import { describe, expect, it } from 'vitest';
import { coverage } from '../src/index';
import { readRegistry } from '../src/read';

const registry = readRegistry();
const report = coverage(registry);

describe('coverage', () => {
  it('leaves NOTHING unvisited', () => {
    expect(report.compounds.unvisited).toEqual([]);
  });

  it('accounts for every compound as either authored or deliberately unauthored', () => {
    const { total, withPk, pkUnauthored } = report.compounds;
    expect(total).toBe(registry.compounds.length);
    expect(withPk + pkUnauthored).toBe(total);
    // Each unauthored record carries a REASON, which is what makes the absence a
    // decision instead of a gap.
    const reasons = Object.values(report.compounds.byUnauthoredReason).reduce((a, b) => a + b, 0);
    expect(reasons).toBe(pkUnauthored);
  });

  it('leaves no compound untagged, which systems.tagged enforces as an error', () => {
    expect(report.compounds.untagged).toEqual([]);
    const tagged = Object.values(report.compounds.bySystem).reduce((a, b) => a + b, 0);
    expect(tagged).toBeGreaterThan(report.compounds.total);
  });

  it('counts every authored route block and how many are cited', () => {
    expect(report.compounds.routeEntries).toBeGreaterThan(0);
    expect(report.compounds.routeEntriesCited).toBeLessThanOrEqual(report.compounds.routeEntries);
    // The `pk.pmid` rule fires on the difference, so a gate with zero such warnings
    // means every route block carries a source_pmid or a source_label.
    expect(report.compounds.routeEntriesCited).toBe(report.compounds.routeEntries);
  });

  it('keeps fitted and estimated keo values apart', () => {
    const { withEffectCompartment, keoFitted, keoEstimated } = report.compounds;
    expect(keoFitted + keoEstimated).toBe(withEffectCompartment);
    // Roughly a third of the catalog's keo values are openly-declared estimates, and
    // that is by design: for whole mechanism classes no model has ever been
    // published, and a keo of 0 would be a worse lie than an order-of-magnitude one.
    expect(keoEstimated).toBeGreaterThan(0);
    expect(keoFitted).toBeGreaterThan(0);
  });

  it('sums the row-level counts consistently with the per-compound flags', () => {
    const occupancyRows = registry.compounds.reduce(
      (n, c) => n + (c.receptor_occupancy ?? []).length,
      0,
    );
    expect(report.compounds.occupancyRows).toBe(occupancyRows);
    expect(report.compounds.withOccupancy).toBeLessThanOrEqual(occupancyRows);
    expect(report.compounds.interactionEdges).toBeGreaterThanOrEqual(
      report.compounds.withInteractions,
    );
  });

  it('describes the pathways and their Recon3D alignment', () => {
    expect(report.pathways.total).toBe(registry.pathways.length);
    expect(report.pathways.steps).toBeGreaterThan(0);
    expect(report.pathways.modulators).toBeGreaterThan(0);
    // A 111-subsystem reconstruction is coarser than a hand-authored pathway, so
    // several slugs legitimately share one subsystem.
    const claimed = Object.values(report.pathways.subsystems).flat();
    expect(claimed.length).toBe(report.pathways.withRecon3dSubsystem);
  });

  it('reports the occupancy keys the target catalog cannot describe', () => {
    const { occupancyKeysUsed, occupancyKeysUnknown } = report.targets;
    expect(occupancyKeysUsed).toBeGreaterThan(0);
    expect(occupancyKeysUnknown.length).toBeLessThanOrEqual(occupancyKeysUsed);
    // Sorted, so two reports diff cleanly.
    expect(occupancyKeysUnknown).toEqual([...occupancyKeysUnknown].sort());
    console.log(
      `coverage: ${occupancyKeysUsed} occupancy keys in use, ${occupancyKeysUnknown.length} not catalogued`,
    );
  });

  it('counts citations, total and unique', () => {
    expect(report.citations.unique).toBeGreaterThan(1000);
    expect(report.citations.unique).toBeLessThanOrEqual(report.citations.total);
  });
});
