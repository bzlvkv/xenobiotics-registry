/**
 * Bundled registry dataset — the v0.1 seed.
 *
 * Datasets exported:
 *  - bundledCompounds + ensureBundledCompounds(): the compound catalog
 *    (compounds.json, ~1.5 MB) — LAZY, populated in place
 *  - bundledReceptors + ensureBundledReceptors(): the GPCR reference catalog
 *    (receptors.json, ~90 KB) — LAZY, populated in place
 *  - loadBundledPathways(): the pathway catalog (pathways.json) — LAZY
 *
 * NONE of the three datasets load eagerly — they were the bulk of the
 * first-paint transfer cost, so each loads via dynamic `import()` and stays out
 * of the eager bundle chunk (off the critical path). pathways yields a fresh
 * array per `loadBundledPathways()`; compounds is exported as a single EMPTY
 * array filled in place by `ensureBundledCompounds()`, and receptors as a
 * single EMPTY catalog object filled in place by `ensureBundledReceptors()`, so
 * their synchronous importers keep their plain-value API — every importer holds
 * the same reference and sees the records once ensure resolves. The app gates
 * its boot screen on those resolves (ensureRegistry in stores.ts), so no surface
 * reads the data before it's filled; the receptor detail route's load() awaits
 * them too so a cold deep-link can't 404 against an empty catalog. All loaders
 * memoize the promise so concurrent callers share one import + validation pass.
 */

import {
  loadRegistry,
  loadPathways,
  loadReceptors,
  type RegistrySource,
  type ReceptorCatalog,
} from './loader';
import { resettableMemo } from './memo';
import type { Compound, FoodPreset, Pathway } from '@xeno/core';

/**
 * A validated, FETCHED registry bundle the app-layer distribution client
 * (BACKLOG N4/N5 Stage 4) can supply to override the baked-in seed. Each field
 * is ALREADY run through its loader by the client; set it BEFORE the ensure*
 * calls and they fill from it instead of importing the baked JSON chunk. Any
 * field left undefined falls through to the seed for that dataset. Passing
 * `null` clears the override (back to pure seed).
 */
export interface RegistryBundleOverride {
  compounds?: Compound[];
  receptors?: ReceptorCatalog;
  pathways?: Pathway[];
  foods?: FoodPreset[];
}
let override: RegistryBundleOverride | null = null;
export function setRegistryBundleOverride(o: RegistryBundleOverride | null): void {
  override = o;
}

/** Guarded boot-profiling mark (standard Performance API; read back by the
 *  app's PerfOverlay). No-op when unavailable. Diagnostics only — lets the
 *  overlay separate the compounds.json chunk FETCH from the Zod parse. */
const pmark = (name: string): void => {
  try {
    (globalThis as { performance?: { mark?: (n: string) => void } }).performance?.mark?.(name);
  } catch {
    /* ignore */
  }
};

// Exported empty and filled in place by ensureBundledCompounds(). The lazy
// chunk loader makes Vite emit the compound core as its own async chunk
// instead of inlining it into the eager registry bundle.
//
// resettableMemo (not a plain `promise ??=`) so a transient import failure
// (stale chunk after deploy, flaky network) doesn't poison the slot for the
// whole session — the next call retries. The `push` is the last step, so a
// failed import never leaves a half-filled array, and a successful resolution
// is cached → push runs exactly once.
// data/compounds/*.json — gitignored build artifacts split out of the canonical
// compounds.json by scripts/build-compound-chunks.mjs, which the app's vite
// config runs at buildStart. Resolved through import.meta.glob rather than a
// literal import() path for the same reason the food chunks are: tsc and
// svelte-check resolve a literal path and fail on a fresh clone, and CI runs
// `pnpm typecheck` and `pnpm -F app check` with no build step before them. The
// glob is a Vite macro — replaced at build/dev, a plain call to tsc.
//
// Unlike the food glob, a missing chunk here is NOT a benign empty state: it
// would mean a registry with no compounds. So the lookup throws instead of
// degrading to no data, and says how to regenerate.
const compoundChunks = import.meta.glob<{ default: unknown }>('../data/compounds/*.json');

function compoundChunk(name: string): () => Promise<{ default: unknown }> {
  const loader = compoundChunks[`../data/compounds/${name}.json`];
  if (!loader) {
    throw new Error(
      `registry: data/compounds/${name}.json is missing. It is generated from ` +
        `compounds.json by scripts/build-compound-chunks.mjs at vite buildStart — ` +
        `run a build or dev server before loading the bundled registry.`,
    );
  }
  return loader;
}

/**
 * The audit trail, keyed by slug — provenance for why a stored value is what it
 * is. Split out of compounds.json by scripts/build-compound-chunks.mjs because
 * it grew to ~560 KB and crowded the check-bundle budgets; see that script and
 * bundle-budget.json. Loaded ONLY when a reader expands it on one compound
 * page, so the cost falls on the handful of people who ask for it rather than
 * on everyone who opens the library.
 */
export const loadCompoundProvenance: () => Promise<Record<string, string>> = resettableMemo(
  async () => (await compoundChunk('provenance')()).default as Record<string, string>,
);

/** Slugs that HAVE an audit trail — a few KB, so a surface can decide whether to
 *  offer the disclosure without pulling the text behind it. */
export const loadCompoundProvenanceIndex: () => Promise<Set<string>> = resettableMemo(
  async () => new Set((await compoundChunk('provenance-index')()).default as string[]),
);

export const bundledCompounds: Compound[] = [];
export const ensureBundledCompounds: () => Promise<void> = resettableMemo(async () => {
  if (override?.compounds) {
    if (bundledCompounds.length === 0) bundledCompounds.push(...override.compounds);
    return;
  }
  const m = await compoundChunk('core')();
  pmark('xeno:registry.zod:start');
  const loaded = loadRegistry(m.default as unknown as RegistrySource);
  pmark('xeno:registry.zod:end');
  bundledCompounds.push(...loaded);
});

// GPCR reference catalog (data/receptors.json, ~90 KB). A single provenance-
// tagged document, not a record array — see scripts/build-receptor-catalog.ts.
// Exported EMPTY and filled in place by ensureBundledReceptors() so the dynamic
// import() emits receptors.json as its own async chunk instead of inlining it
// into the eager registry bundle (it's only consumed after the compound catalog
// resolves, so it has no business on the first-paint critical path). The empty
// object preserves the `bundledReceptors.{meta,receptors,nonGpcrTargets}` API
// for synchronous importers — every importer holds the same reference and sees
// the data once ensure resolves. resettableMemo so a transient import failure
// doesn't poison the slot for the whole session.
export const bundledReceptors: ReceptorCatalog = {
  meta: { source: '', url: '', version: '', fetched: '' },
  receptors: [],
  nonGpcrTargets: [],
};
export const ensureBundledReceptors: () => Promise<void> = resettableMemo(async () => {
  const loaded =
    override?.receptors ??
    loadReceptors((await import('../data/receptors.json')).default as unknown);
  if (bundledReceptors.receptors.length === 0) {
    bundledReceptors.meta = loaded.meta;
    bundledReceptors.receptors.push(...loaded.receptors);
    bundledReceptors.nonGpcrTargets.push(...loaded.nonGpcrTargets);
  }
});

// Lazily-imported pathway catalog. The dynamic import() makes Vite emit
// pathways.json as its own async chunk rather than inlining it into the eager
// registry bundle. resettableMemo so the first call kicks off the import +
// validation and every later call reuses the same SUCCESS promise — but a
// transient import failure clears the slot instead of caching the rejection,
// so the pathway-convergence card (and any later caller) can retry.
export const loadBundledPathways: () => Promise<Pathway[]> = resettableMemo(async () => {
  if (override?.pathways) return override.pathways;
  const m = await import('../data/pathways.json');
  return loadPathways(m.default as unknown as RegistrySource);
});

// Foods. v12 ships NO curated food catalog — that was 13 MB of authored rows
// and it went with the food registry. Food logging is live USDA FDC search
// (see lib/api/barcode-lookup.ts) plus the user's own saved foods from the
// op-log, so nothing is bundled here.
//
// `bundledFoods` stays exported, and empty, because FoodPreset is still the
// interchange shape: `extractFdcItems` projects an FDC record into
// FoodPresetItem[], and `loadFoods` still validates those and user-authored
// foods. Callers that merge a registry-supplied catalog (the bundle override
// path) keep working; there just isn't one by default.
export const bundledFoods: FoodPreset[] = [];
export const ensureBundledFoods: () => Promise<void> = resettableMemo(async () => {
  if (override?.foods && bundledFoods.length === 0) {
    bundledFoods.push(...override.foods);
  }
});
