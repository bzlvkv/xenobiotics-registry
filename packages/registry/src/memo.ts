/**
 * resettableMemo — memoize an async factory WITHOUT caching a rejection.
 *
 * The registry's heavy datasets (compounds.json ~1.5 MB, pathways.json ~1.2 MB)
 * load via a dynamic `import()` and memoize the promise so concurrent callers
 * share one fetch + validation pass. The hazard a plain `promise ??= factory()`
 * memo introduces: if that promise REJECTS — a flaky connection, a CSP hiccup,
 * or (most common) a stale chunk hash after a redeploy while the page is on a
 * cached bundle — the rejected promise is cached forever. Every later caller
 * (the boot gate, [slug] page loads, receptor rebuilds) re-awaits the same
 * rejection, so the registry-gated UI freezes on skeletons for the whole
 * session with no retry short of a full reload.
 *
 * This wrapper caches only a SETTLED-SUCCESS promise: on rejection it clears the
 * slot so the next call re-invokes the factory (a transient failure becomes
 * recoverable — a later navigation, a boot "Retry", or a re-render retries the
 * load). The success promise is still shared, so the factory's side effects run
 * exactly once.
 */
export function resettableMemo<T>(factory: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  return () => {
    if (!promise) {
      promise = factory().catch((err) => {
        promise = null; // don't poison the slot — let the next call retry
        throw err;
      });
    }
    return promise;
  };
}
