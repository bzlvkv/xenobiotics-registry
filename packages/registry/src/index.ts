/**
 * @xeno/registry — read-only compound dataset.
 *
 * v0.1: ships JSON files baked into the bundle. Authoring + community PRs
 * (planned for v0.4) will swap this out for a fetched + cached snapshot,
 * but the loader API stays the same.
 *
 * The registry is intentionally small surface: load once, query in memory.
 * No reactivity. UI consumers wrap it in Svelte stores at the app layer.
 */

export * from './loader';
export * from './query';
export * from './interactions';
export * from './recon3d';
export * from './pubmed';
export { resettableMemo } from './memo';
export {
  bundledCompounds,
  ensureBundledCompounds,
  loadCompoundProvenance,
  loadCompoundProvenanceIndex,
  bundledReceptors,
  ensureBundledReceptors,
  loadBundledPathways,
  bundledFoods,
  ensureBundledFoods,
  setRegistryBundleOverride,
  type RegistryBundleOverride,
} from './bundled';
export { REGISTRY_SCHEMA_VERSION } from './schema-version';
