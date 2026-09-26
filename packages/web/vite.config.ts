import { defineConfig } from 'vite';

/**
 * The three datasets are 3.8 MB of JSON. Importing them would put all of it in
 * the JS bundle, so instead the repo's `data/` directory IS the public dir:
 * vite serves and copies it verbatim, and the client fetches /compounds.json,
 * /pathways.json and /receptors.json at boot. That also publishes GAPS.md, the
 * skip ledger, at /GAPS.md — which the home view links to on purpose.
 */
export default defineConfig({
  publicDir: '../../data',
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
});
