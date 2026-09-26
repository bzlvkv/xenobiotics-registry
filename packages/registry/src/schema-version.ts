/**
 * Registry bundle schema version. Bump on any INCOMPATIBLE loader/record shape
 * change (a field the app now requires, a renamed key, a validation that would
 * reject older data). The distribution client stamps it into every cached bundle
 * and refuses a cache whose schemaVersion differs from the running app's — so a
 * client on an older schema falls back to its baked-in seed instead of parsing a
 * newer fetched bundle it can't understand (and vice versa).
 *
 * Shared by `scripts/build-bundle.ts` (stamps the manifest) and the app's
 * registry distribution client (gates the cache), so the two can never drift.
 */
// v2: build-your-own food presets — FoodPreset.options groups, and empty base
//     items become legal when options are present (older loaders reject them).
// v3: v12 drops the curated food catalog. A published bundle now carries THREE
//     datasets (compounds, pathways, receptors) where v2 carried four, and
//     validateBundle requires all of them — so a v2 cache handed to a v3 client
//     would be rejected as incomplete rather than recognised as stale. The bump
//     makes that a clean schema-skew fallback to the seed instead of a confusing
//     "a dataset is missing" path.
export const REGISTRY_SCHEMA_VERSION = 3;
