/**
 * 2026-05-04-wave-0c-tiagabine-stub.ts — Wave 0c addendum.
 *
 * Adds tiagabine — oral GAT-1 GABA-reuptake inhibitor (anticonvulsant)
 * — with full primary-source-cited PK + kₑₒ.
 *
 *   PK    PMID:9118850   half-life 7 h normal subjects (Lau 1997 Epilepsia)
 *   kₑₒ   PMID:10728492  rat EEG β-amplitude, kₑₒ 0.030 ± 0.002 min⁻¹
 *                        → 1.80 /h (rat data — mechanism is class-typical)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const STUB = {
  slug: 'tiagabine',
  name: 'Tiagabine',
  aliases: ['Gabitril'],
  category: 'pharmacological',
  mechanism: 'Selective GAT-1 GABA-reuptake inhibitor — increases synaptic GABA dwell time → enhanced inhibitory tone in cortex / hippocampus. FDA-approved for partial seizures (adjunct). Off-label for anxiety + sleep architecture studies. Highly protein-bound (~96%); extensive CYP3A4 metabolism.',
  routes: ['PO'],
  doses: { 'PO': { min: 4, max: 56, typical: 32, unit: 'mg' } },
  half_life_hr: { 'PO': 7 },
  mw_g_mol: 412.0,
  systems: ['nervous'],
  pk: { 'PO': { ka_hr: 1.5, V_L: 70, F: 0.96, source_pmid: 'PMID:9118850' } },
  effect_compartment: { keo_per_h: 1.80, source_pmid: 'PMID:10728492', note: 'Rat EEG β-amplitude (11.5–30 Hz); abstract verbatim "keo = 0.030 ± 0.002 min⁻¹"' },
  refs: [],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  if (bySlug.has(STUB.slug)) {
    console.log('Wave 0c addendum: tiagabine already present, no-op');
    return;
  }
  data.push(STUB as unknown as Record<string, unknown>);
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log('\nWave 0c addendum: added tiagabine (1)');
}

main();
