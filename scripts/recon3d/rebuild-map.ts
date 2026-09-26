/**
 * scripts/recon3d/rebuild-map.ts
 *
 * Re-derives `packages/registry/data/recon3d-map.json` from the current
 * `pathways.json`. Run after any edit to a pathway's `recon3d_subsystem`
 * field so the persisted snapshot stays aligned with the live data.
 *
 *   pnpm tsx scripts/recon3d/rebuild-map.ts
 *
 * Pure derivation — no network. Reads pathways.json, groups by
 * subsystem, writes recon3d-map.json with a stable sort order so diffs
 * are minimal.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');
const MAP_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'recon3d-map.json');

interface MinimalPathway {
  slug: string;
  recon3d_subsystem?: string;
}

interface MapFile {
  _meta: {
    source: string;
    source_pmid: string;
    source_url: string;
    version: string;
    note: string;
  };
  subsystems: Array<{ name: string; pathways: string[] }>;
}

function main(): void {
  const pathways = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as MinimalPathway[];
  const existing = JSON.parse(readFileSync(MAP_PATH, 'utf-8')) as MapFile;

  const idx = new Map<string, string[]>();
  for (const p of pathways) {
    if (!p.recon3d_subsystem) continue;
    const arr = idx.get(p.recon3d_subsystem) ?? [];
    arr.push(p.slug);
    idx.set(p.recon3d_subsystem, arr);
  }

  const subsystems = [...idx.entries()]
    .map(([name, slugs]) => ({ name, pathways: slugs.slice().sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const next: MapFile = { _meta: existing._meta, subsystems };

  writeFileSync(MAP_PATH, JSON.stringify(next, null, 2) + '\n');

  const total = pathways.length;
  const tagged = pathways.filter((p) => p.recon3d_subsystem).length;
  console.log(`rebuild-map: ${subsystems.length} subsystems · ${tagged}/${total} pathways tagged`);
}

main();
