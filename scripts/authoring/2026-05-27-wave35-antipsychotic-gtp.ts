/**
 * 2026-05-27-wave35-antipsychotic-gtp.ts — antipsychotic polypharmacology
 * from GtoPdb's curated human binding affinities.
 *
 * Fixes a correctness gap and deepens four antipsychotics. aripiprazole and
 * risperidone were missing their DEFINING receptor (dopamine D2); the rest
 * lacked the secondary receptors that drive their side-effect profiles
 * (H1 → sedation, α1 → orthostasis, 5-HT2C → metabolic).
 *
 * Provenance tier: GtoPdb-curated human values (the abstract-verbatim bar
 * excludes these — the numbers live in full-text tables, which GtoPdb
 * aggregates). Each note records GtoPdb's value + its contributing primary
 * PMIDs. Single-value entries cite the one ref; multi-paper entries give the
 * pKi range and the geometric midpoint (pKi mean → Ki) per house convention.
 *
 *   ec50_mg_l = Ki(nM) × MW(g/mol) / 1e6.  All are functional
 *   antagonists / (partial/inverse) agonists → max occupancy emax 1.0,
 *   hill_n 1 (no cooperativity curated).
 *
 * All five compounds already carry a kₑₒ, so the "occupancy needs keo" lint
 * gate is satisfied without PD work here.
 *
 * Skipped: clozapine @ M1 — GtoPdb's only human entry is an allosteric
 * positive modulator (functional pIC50), which the orthosteric occupancy
 * model can't represent; and our 'muscarinic' key bridges CHRM3, not CHRM1.
 *
 * Idempotent: re-running skips any (compound, receptor) already present.
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

const ENTRIES: { slug: string; rows: ReceptorOccupancy[] }[] = [
  {
    slug: 'aripiprazole', // MW 448.39
    rows: [{
      receptor: 'dopamine_d2', pathway: 'partial-agonist', emax: 1.0, ec50_mg_l: 0.000359, hill_n: 1,
      source_pmid: 'PMID:23279866',
      note: 'GtoPdb-curated human D2 binding: pKi 9.1 (Ki 0.8 nM), partial agonist, ref PMID:23279866. Aripiprazole\'s defining target. ec50 = 0.8 nM × 448.39 / 1e6.',
    }],
  },
  {
    slug: 'risperidone', // MW 410.49
    rows: [
      {
        receptor: 'dopamine_d2', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.000181, hill_n: 1,
        source_pmid: 'PMID:9430133',
        note: 'GtoPdb-curated human D2 binding: pKi 9.36 (Ki 0.44 nM), antagonist, ref PMID:9430133. ec50 = 0.44 nM × 410.49 / 1e6.',
      },
      {
        receptor: 'H1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.008210, hill_n: 1,
        source_pmid: 'PMID:8935801',
        note: 'GtoPdb-curated human H1 binding: pKi range 7.6–7.8 (PMID:8935801, PMID:12629531); midpoint pKi 7.7 → Ki ≈ 20 nM. ec50 = 20 nM × 410.49 / 1e6.',
      },
      {
        receptor: 'alpha_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.001157, hill_n: 1,
        source_pmid: 'PMID:11459121',
        note: 'GtoPdb-curated human α1A-adrenoceptor binding: pKi range 8.4–8.7 (PMID:11459121, PMID:32608144); midpoint pKi 8.55 → Ki ≈ 2.8 nM. Keyed alpha_1 (non-subtype-selective α1 blockade, as for prazosin/doxazosin). ec50 = 2.8 nM × 410.49 / 1e6.',
      },
    ],
  },
  {
    slug: 'clozapine', // MW 326.83
    rows: [
      {
        receptor: 'H1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.000206, hill_n: 1,
        source_pmid: 'PMID:8935801',
        note: 'GtoPdb-curated human H1 binding: pKi range 8.8–9.6 (PMID:8935801, PMID:12629531, PMID:12065734); midpoint pKi 9.2 → Ki ≈ 0.63 nM. Clozapine\'s potent antihistamine action. ec50 = 0.63 nM × 326.83 / 1e6.',
      },
      {
        receptor: 'alpha_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.002062, hill_n: 1,
        source_pmid: 'PMID:11459121',
        note: 'GtoPdb-curated human α1A-adrenoceptor binding: pKi range 8.1–8.3 (PMID:11459121, PMID:32608144); midpoint pKi 8.2 → Ki ≈ 6.3 nM. Keyed alpha_1 (non-subtype-selective). ec50 = 6.3 nM × 326.83 / 1e6.',
      },
    ],
  },
  {
    slug: 'olanzapine', // MW 312.43
    rows: [{
      receptor: '5-HT2C', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.001757, hill_n: 1,
      source_pmid: 'PMID:12629531',
      note: 'GtoPdb-curated human 5-HT2C binding: pKi range 8.1–8.4 (PMID:12629531, PMID:10991983, PMID:18308814), antagonist/inverse agonist; midpoint pKi 8.25 → Ki ≈ 5.6 nM. Implicated in olanzapine\'s metabolic effects. ec50 = 5.6 nM × 312.43 / 1e6.',
    }],
  },
  {
    slug: 'quetiapine', // MW 383.51
    rows: [{
      receptor: 'H1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.001713, hill_n: 1,
      source_pmid: 'PMID:8935801',
      note: 'GtoPdb-curated human H1 binding: pKi range 8.0–8.7 (PMID:8935801, PMID:12629531); midpoint pKi 8.35 → Ki ≈ 4.5 nM. Drives quetiapine\'s sedation. ec50 = 4.5 nM × 383.51 / 1e6.',
    }],
  },
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
        skipped++; console.log(`[skip] ${e.slug.padEnd(12)} @ ${row.receptor} already authored`); continue;
      }
      c.receptor_occupancy.push(row);
      if (row.source_pmid && !c.refs.includes(row.source_pmid)) c.refs.push(row.source_pmid);
      added++;
      console.log(`[add ] ${e.slug.padEnd(12)} @ ${row.receptor.padEnd(12)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave35: +${added} occupancy rows (${skipped} already authored).`);
}

main();
