/**
 * 2026-05-27-wave38-antidepressant-gtp.ts — antidepressant mechanism
 * completions from GtoPdb curated human affinities.
 *
 * Defining-mechanism fixes:
 *   - vortioxetine ("multimodal" antidepressant) carried only SERT; adds its
 *     5-HT1A/1B partial agonism + 5-HT7 antagonism (the multimodal signature).
 *   - venlafaxine & duloxetine are SNRIs but carried only SERT; adds the NET
 *     component (duloxetine balanced; venlafaxine SERT≫NET).
 *
 * Provenance: GtoPdb bulk interactions.csv (see _gtp-affinity.ts). All
 * single-value pKi/pIC50. ec50_mg_l = Ki(nM) × MW / 1e6. emax 1.0, hill_n 1.
 * Transporter rows use the registry's reuptake-inhibition pathway label.
 *
 * No clean human GtoPdb value (left unauthored): vortioxetine 5-HT1D/5-HT3,
 * fluoxetine 5-HT2C, paroxetine muscarinic/NET, citalopram H1, sertraline DAT.
 *
 * Idempotent: skips any (compound, receptor) already present.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy {
  receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number;
  source_pmid?: string; note?: string;
}
interface Compound {
  slug: string; effect_compartment?: { keo_per_h?: number };
  receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown;
}

const A = (receptor: string, pathway: string, ec50_mg_l: number, source_pmid: string, note: string): ReceptorOccupancy =>
  ({ receptor, pathway, emax: 1.0, ec50_mg_l, hill_n: 1, source_pmid, note });

const ENTRIES: { slug: string; rows: ReceptorOccupancy[] }[] = [
  { slug: 'vortioxetine', rows: [ // MW 298.45
    A('5-HT1A', 'partial-agonist', 0.004477, 'PMID:21486038',
      'GtoPdb-curated human 5-HT1A binding: pKi 7.82 (Ki 15 nM), partial agonist, ref PMID:21486038. Part of vortioxetine\'s multimodal 5-HT profile. ec50 = 15 nM × 298.45 / 1e6.'),
    A('5-HT1B', 'partial-agonist', 0.009849, 'PMID:21486038',
      'GtoPdb-curated human 5-HT1B binding: pKi 7.48 (Ki 33 nM), partial agonist, ref PMID:21486038. ec50 = 33 nM × 298.45 / 1e6.'),
    A('5-HT7', 'antagonist', 0.134303, 'PMID:21486038',
      'GtoPdb-curated human 5-HT7 binding: pKi 6.35 (Ki 450 nM), antagonist, ref PMID:21486038. ec50 = 450 nM × 298.45 / 1e6.') ] },
  { slug: 'duloxetine', rows: [ // MW 297.41
    A('net', 'norepinephrine_reuptake_inhibition', 0.001776, 'PMID:23084899',
      'GtoPdb-curated human NET (SLC6A2): pKi 8.22 (Ki 5.97 nM), uptake inhibitor, ref PMID:23084899. Duloxetine\'s norepinephrine-reuptake component (balanced SNRI). ec50 = 5.97 nM × 297.41 / 1e6.') ] },
  { slug: 'venlafaxine', rows: [ // MW 277.4
    A('net', 'norepinephrine_reuptake_inhibition', 0.148409, 'PMID:20378347',
      'GtoPdb-curated human NET (SLC6A2): pIC50 6.27 (IC50 535 nM), uptake inhibitor, ref PMID:20378347. Venlafaxine\'s weak NET component (SERT≫NET; NET engaged mainly at higher doses). ec50 = 535 nM × 277.4 / 1e6.') ] },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, skipped = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) throw new Error(`compound "${e.slug}" not found`);
    if (!c.effect_compartment?.keo_per_h) throw new Error(`${e.slug} has no keo — occupancy would fail lint`);
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    c.refs = c.refs ?? [];
    for (const row of e.rows) {
      if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) {
        skipped++; console.log(`[skip] ${e.slug.padEnd(13)} @ ${row.receptor} already authored`); continue;
      }
      c.receptor_occupancy.push(row);
      if (row.source_pmid && !c.refs.includes(row.source_pmid)) c.refs.push(row.source_pmid);
      added++;
      console.log(`[add ] ${e.slug.padEnd(13)} @ ${row.receptor.padEnd(8)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave38: +${added} occupancy rows (${skipped} already authored).`);
}

main();
