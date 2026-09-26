/**
 * normalize-receptor-keys.ts — collapse receptor_occupancy keys to canonical.
 *
 * One-off refactor, re-runnable and idempotent. Rewrites compounds.json,
 * mapping each receptor_occupancy[].receptor through RECEPTOR_ALIASES (the
 * shared map in ./receptor-aliases.ts). Run with:
 *
 *   pnpm tsx scripts/normalize-receptor-keys.ts
 *
 * Reports every rename and flags any compound left with two entries that
 * share a canonical key — a real duplicate-authoring collision the new lint
 * rule (`receptor.duplicate`) will warn on. Those are resolved by
 * re-authoring from a primary source, NOT by silently dropping a row here.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalReceptor } from './receptor-aliases.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy {
  receptor: string;
  [k: string]: unknown;
}
interface Compound {
  slug: string;
  receptor_occupancy?: ReceptorOccupancy[];
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  let renames = 0;
  const collisions: string[] = [];

  for (const c of data) {
    const ro = c.receptor_occupancy;
    if (!ro || ro.length === 0) continue;

    for (const site of ro) {
      const canon = canonicalReceptor(site.receptor);
      if (canon !== site.receptor) {
        console.log(`  [rename] ${c.slug.padEnd(16)} ${site.receptor} → ${canon}`);
        site.receptor = canon;
        renames++;
      }
    }

    const counts = new Map<string, number>();
    for (const site of ro) counts.set(site.receptor, (counts.get(site.receptor) ?? 0) + 1);
    for (const [rec, n] of counts) {
      if (n > 1) collisions.push(`${c.slug} → ${n}× "${rec}"`);
    }
  }

  if (renames === 0) {
    console.log('  (no alias keys found — already canonical)');
  } else {
    writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  }

  console.log(`\nReceptor-key normalization: ${renames} key${renames === 1 ? '' : 's'} renamed.`);
  if (collisions.length > 0) {
    console.log(
      `\n⚠ ${collisions.length} duplicate-canonical collision${collisions.length === 1 ? '' : 's'} (lint will warn — resolve by re-authoring):`,
    );
    for (const c of collisions) console.log(`    ${c}`);
  }
}

main();
