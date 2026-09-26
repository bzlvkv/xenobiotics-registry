/**
 * read.ts — the Node-only door onto the three JSON files.
 *
 * Its own module, exported as `@xeno/registry/read` and NOT re-exported from
 * `index.ts`, because this is the one file that touches `node:fs`. Anything
 * reachable from `index.ts` ends up in a browser bundle, and a bundler resolving
 * `node:fs` for the web either fails the build or ships a shim that fails at
 * runtime. Keeping the boundary at the module level rather than behind a runtime
 * check means the browser build cannot reach it by accident.
 *
 * Scripts and tests import from here. The web client does not: it fetches the
 * committed JSON and trusts it, because `pnpm validate` has already put every
 * byte through the loader, and shipping zod to re-check it would double the
 * bundle for no new guarantee.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadRegistry } from './load';
import type { Registry } from './types';

/**
 * The repository's `data/` directory, resolved RELATIVE TO THIS FILE rather than
 * to `process.cwd()`. A cwd-relative default would make `readRegistry()` mean
 * different things depending on which directory a script was run from, which is
 * the sort of thing that works for everyone until one person runs a test from a
 * subdirectory.
 */
export const DATA_DIR = fileURLToPath(new URL('../../../data', import.meta.url));

/** Read and validate the whole registry. Throws with field-level detail if any
 *  of the three documents is malformed — a gate that returns a partial registry
 *  is worse than one that stops. */
export function readRegistry(dir: string = DATA_DIR): Registry {
  const read = (name: string): unknown =>
    JSON.parse(readFileSync(join(dir, name), 'utf-8')) as unknown;
  return loadRegistry({
    compounds: read('compounds.json'),
    pathways: read('pathways.json'),
    receptors: read('receptors.json'),
  });
}
