// Ambient type for `import.meta.glob` — a Vite build-time macro used in
// bundled.ts to load the generated food chunks (per-category, sharded when
// a category exceeds MAX_FOOD_CHUNK_BYTES). The registry package doesn't
// depend on `vite/client` (it's not a vite project itself; only the app's vite
// build/transform sees these files), so we declare just the one signature we use.
// Vite replaces the actual call at build/dev; this is types-only for `tsc`.
interface ImportMeta {
  glob<T = unknown>(pattern: string): Record<string, () => Promise<T>>;
}
