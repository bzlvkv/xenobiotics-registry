/**
 * 2026-05-27-wave36-cns-gtp.ts — second GtoPdb antipsychotic/antidepressant
 * polypharmacology pass (continues wave35).
 *
 * Fills GtoPdb-curated HUMAN binding affinities for drugs that already carry
 * a kₑₒ (so the occupancy-needs-keo lint gate is satisfied). Two defining-
 * receptor fixes: brexpiprazole @ D2 (a D2 partial agonist, like aripiprazole)
 * and cariprazine @ D3 (its D3-preferring signature, Ki 0.09 nM, ~60× over D2).
 *
 * Provenance: GtoPdb bulk interactions.csv (see scripts/authoring/_gtp-affinity.ts).
 * Single-value rows cite the one ref; multi-paper rows give the pKi range +
 * geometric midpoint. ec50_mg_l = Ki(nM) × MW / 1e6. emax 1.0, hill_n 1.
 *
 * Requested pairs GtoPdb has no clean human value for (doxepin secondaries,
 * haloperidol α1, paliperidone H1/α1, mirtazapine H1/5-HT3, trazodone α1/H1,
 * etc.) returned nothing and are simply absent — not authored from rodent.
 *
 * Adds occupancy key dopamine_d3 (bridged DRD3 in apps/app/src/lib/receptors.ts).
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
  { slug: 'brexpiprazole', rows: [ // MW 433.57
    A('dopamine_d2', 'partial-agonist', 0.000130, 'PMID:24947465',
      'GtoPdb-curated human D2 binding: pKi 9.52 (Ki 0.30 nM), partial agonist, ref PMID:24947465. Brexpiprazole\'s defining target. ec50 = 0.30 nM × 433.57 / 1e6.') ] },
  { slug: 'cariprazine', rows: [ // MW 427.41 (D2 already authored)
    A('dopamine_d3', 'partial-agonist', 0.0000385, 'PMID:20093397',
      'GtoPdb-curated human D3 binding: pKi 10.05 (Ki 0.09 nM), partial agonist, ref PMID:20093397. Cariprazine\'s D3-preferring signature (~60× over its D2 Ki 5.7 nM). ec50 = 0.09 nM × 427.41 / 1e6.') ] },
  { slug: 'haloperidol', rows: [ // MW 375.86
    A('dopamine_d3', 'antagonist', 0.003350, 'PMID:8301582',
      'GtoPdb-curated human D3 binding: pKi range 7.5–8.6 (PMID:8301582, PMID:1354163, PMID:7862709, PMID:18308814); midpoint pKi 8.05 → Ki ≈ 8.9 nM. ec50 = 8.9 nM × 375.86 / 1e6.'),
    A('5-HT2A', 'antagonist', 0.037586, 'PMID:8935801',
      'GtoPdb-curated human 5-HT2A binding: pKi range 6.7–7.3 (PMID:8935801, PMID:9732398, PMID:12629531, PMID:15102927, PMID:18308814); midpoint pKi 7.0 → Ki ≈ 100 nM. Haloperidol\'s modest 5-HT2A antagonism. ec50 = 100 nM × 375.86 / 1e6.') ] },
  { slug: 'ziprasidone', rows: [ // MW 412.94
    A('5-HT1A', 'partial-agonist', 0.001644, 'PMID:9760039',
      'GtoPdb-curated human 5-HT1A binding: pKi range 7.9–8.9 (PMID:9760039, PMID:8935801), partial agonist; midpoint pKi 8.4 → Ki ≈ 4.0 nM. ec50 = 4.0 nM × 412.94 / 1e6.'),
    A('5-HT2C', 'antagonist', 0.001449, 'PMID:12629531',
      'GtoPdb-curated human 5-HT2C binding: pKi range 7.9–9.01 (PMID:12629531, PMID:10991983, PMID:18308814), antagonist/inverse agonist; midpoint pKi 8.46 → Ki ≈ 3.5 nM. ec50 = 3.5 nM × 412.94 / 1e6.'),
    A('H1', 'antagonist', 0.010373, 'PMID:8935801',
      'GtoPdb-curated human H1 binding: pKi range 7.4–7.8 (PMID:8935801, PMID:12629531); midpoint pKi 7.6 → Ki ≈ 25 nM. ec50 = 25 nM × 412.94 / 1e6.') ] },
  { slug: 'lurasidone', rows: [ // MW 492.68
    A('5-HT7', 'antagonist', 0.000244, 'PMID:20404009',
      'GtoPdb-curated human 5-HT7 binding: pKi 9.31 (Ki 0.495 nM), antagonist, ref PMID:20404009. Lurasidone\'s potent 5-HT7 — a putative cognitive/antidepressant contributor. ec50 = 0.495 nM × 492.68 / 1e6.') ] },
  { slug: 'asenapine', rows: [ // MW 285.79
    A('H1', 'antagonist', 0.0000453, 'PMID:8935801',
      'GtoPdb-curated human H1 binding: pKi 9.8 (Ki 0.16 nM), antagonist, ref PMID:8935801. Asenapine is among the most antihistaminic antipsychotics. ec50 = 0.16 nM × 285.79 / 1e6.') ] },
  { slug: 'mirtazapine', rows: [ // MW 265.36
    A('5-HT2C', 'antagonist', 0.010349, 'PMID:15771415',
      'GtoPdb-curated human 5-HT2C binding: pKi 7.41 (Ki 39 nM), antagonist, ref PMID:15771415. ec50 = 39 nM × 265.36 / 1e6.') ] },
  { slug: 'trazodone', rows: [ // MW 371.86
    A('5-HT2C', 'antagonist', 0.093411, 'PMID:15322733',
      'GtoPdb-curated human 5-HT2C binding: pKi 6.6 (Ki 251 nM), antagonist, ref PMID:15322733. ec50 = 251 nM × 371.86 / 1e6.') ] },
  { slug: 'fluphenazine', rows: [ // MW 437.52
    A('H1', 'antagonist', 0.008750, 'PMID:12629531',
      'GtoPdb-curated human H1 binding: pKi 7.7 (Ki 20 nM), antagonist, ref PMID:12629531. ec50 = 20 nM × 437.52 / 1e6.') ] },
  { slug: 'clomipramine', rows: [ // MW 314.85
    A('alpha_1', 'antagonist', 0.002501, 'PMID:32608144',
      'GtoPdb-curated human α1A-adrenoceptor binding: pKi 8.1 (Ki 7.9 nM), antagonist, ref PMID:32608144. Keyed alpha_1 (non-subtype-selective). ec50 = 7.9 nM × 314.85 / 1e6.') ] },
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
      console.log(`[add ] ${e.slug.padEnd(13)} @ ${row.receptor.padEnd(12)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave36: +${added} occupancy rows (${skipped} already authored).`);
}

main();
