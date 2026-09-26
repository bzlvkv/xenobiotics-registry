/**
 * THE CONTRACT TEST. Nothing in the data may be silently dropped at load.
 *
 * zod strips unknown keys, so a field present in the JSON but absent from
 * `schema.ts` ceases to exist for every consumer with nothing thrown and nothing
 * logged. That is not a hypothetical: `receptor_occupancy[].note` (the provenance
 * prose behind 321 of 325 affinities) and `pk[route].note` (which of a route's
 * numbers came from which document) were both authored, both invisible, and both
 * found by accident rather than by a test.
 *
 * So this walks every JSON path in the three real files, walks the same paths in
 * the loaded-and-re-serialized output, and asserts no path lost occurrences.
 * Counting rather than set-comparing is the stronger check: a field dropped from
 * SOME records while surviving on others still fails.
 *
 * Array indices are collapsed to `[]` so that `interactions[3].timing` and
 * `interactions[7].timing` are the same claim about the schema.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// `@xeno/registry/read` — the package's Node-only entry, imported by path because
// a package cannot resolve its own name without a self-link in node_modules.
import { DATA_DIR, readRegistry } from '../src/read';
import { loadCompounds, loadPathways, loadReceptors } from '../src/index';

/** path → number of occurrences across the whole document. */
function pathCounts(doc: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const walk = (node: unknown, prefix: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const v of node) walk(v, `${prefix}[]`);
      return;
    }
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const p = prefix ? `${prefix}.${k}` : k;
      out.set(p, (out.get(p) ?? 0) + 1);
      walk(v, p);
    }
  };
  if (Array.isArray(doc)) for (const r of doc) walk(r, '');
  else walk(doc, '');
  return out;
}

/** Paths the input has and the output has fewer of, with both counts. */
function lostPaths(input: unknown, output: unknown): string[] {
  const before = pathCounts(input);
  const after = pathCounts(output);
  const lost: string[] = [];
  for (const [path, n] of [...before].sort()) {
    const kept = after.get(path) ?? 0;
    if (kept < n) lost.push(`${path}: ${n} in the file, ${kept} after loading`);
  }
  return lost;
}

const raw = (name: string): unknown =>
  JSON.parse(readFileSync(join(DATA_DIR, `${name}.json`), 'utf-8')) as unknown;

/** JSON.stringify drops `undefined`, which is exactly the comparison we want:
 *  a key the loader never set is a key the output does not have. */
const reserialize = (value: unknown): unknown => JSON.parse(JSON.stringify(value)) as unknown;

describe('the loader loses no field the data actually uses', () => {
  it('compounds.json round-trips every path', () => {
    const input = raw('compounds');
    const output = reserialize(loadCompounds(input));
    expect(lostPaths(input, output)).toEqual([]);
  });

  it('pathways.json round-trips every path', () => {
    const input = raw('pathways');
    const output = reserialize(loadPathways(input));
    expect(lostPaths(input, output)).toEqual([]);
  });

  it('receptors.json round-trips every path', () => {
    const input = raw('receptors');
    const output = reserialize(loadReceptors(input));
    expect(lostPaths(input, output)).toEqual([]);
  });

  it('readRegistry loses nothing either', () => {
    const reg = readRegistry();
    expect(lostPaths(raw('compounds'), reserialize(reg.compounds))).toEqual([]);
    expect(lostPaths(raw('pathways'), reserialize(reg.pathways))).toEqual([]);
    expect(lostPaths(raw('receptors'), reserialize(reg.receptors))).toEqual([]);
  });

  /**
   * The two fields that were actually lost, named so a regression reads as itself
   * rather than as one line in a list of 200 paths. Both are prose a reader was
   * meant to see, which is why their absence looked like sparse authoring rather
   * than a bug.
   */
  it('keeps the provenance prose that was stripped before', () => {
    const compounds = loadCompounds(raw('compounds'));
    const withSiteNote = compounds.filter((c) => (c.receptor_occupancy ?? []).some((r) => r.note));
    expect(withSiteNote.length).toBeGreaterThan(200);

    const withRouteNote = compounds.filter((c) => Object.values(c.pk ?? {}).some((pk) => pk?.note));
    expect(withRouteNote.length).toBeGreaterThan(0);
  });

  it('keeps the pathway sensation hook', () => {
    const pathways = loadPathways(raw('pathways'));
    expect(pathways.filter((p) => p.sensation).length).toBeGreaterThan(0);
  });
});
