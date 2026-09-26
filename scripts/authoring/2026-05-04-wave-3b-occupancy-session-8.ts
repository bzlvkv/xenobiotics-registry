/**
 * 2026-05-04-wave-3b-occupancy-session-8.ts — Wave 3b session 8.
 *
 * 1 verified receptor occupancy entry on atropine, whose kₑₒ landed
 * in Wave 3a session 15 this push.
 *
 *   - atropine  IC50 1.6 nM  human muscarinic M1 cortical, [3H]NMS
 *                            displacement (PMID:2432979). Abstract
 *                            verbatim "1.6-4.6 nM" across M1/M2/M3/M4
 *                            subtypes; M1 cortical = 1.6 nM used.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Occupancy = {
  receptor: string;
  pathway: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid: string;
  note?: string;
};

const ENTRIES: Array<{ slug: string; site: Occupancy }> = [
  {
    slug: 'atropine',
    site: {
      receptor: 'muscarinic', pathway: 'parasympatholysis', emax: 1, hill_n: 1,
      ec50_mg_l: 0.000463, source_pmid: 'PMID:2432979',
      note: 'M1 cortical IC50; abstract verbatim "atropine displayed similar affinities for either subtype with IC50s varying only slightly (1.6-4.6 nM)". MW 289.37',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c['receptor_occupancy'] as Occupancy[] | undefined) ?? [];
    if (existing.some(s => s.receptor === e.site.receptor && s.source_pmid === e.site.source_pmid)) {
      alreadyHas++; continue;
    }
    existing.push(e.site);
    c['receptor_occupancy'] = existing;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 8: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
