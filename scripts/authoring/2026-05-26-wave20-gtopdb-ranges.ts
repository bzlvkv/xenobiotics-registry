/**
 * 2026-05-26-wave20-gtopdb-ranges.ts — GtoPdb occupancy from multi-paper pKi
 * RANGES (wave 20). Companion to waves 18–19; ranges are now accepted.
 *
 * Where GtoPdb prints a pKi RANGE across several primary papers (rather than a
 * single curated value), we model at the GEOMETRIC MEAN = the pKi-range
 * midpoint (Ki = 10^(9 − pKi_mid) nM). Each note records the full pKi range,
 * the number of refs, and one representative primary PMID (fetched + confirmed
 * on-topic, 2026-05-26) that goes in source_pmid. Provenance = GtoPdb curation.
 *
 * ec50_mg_l = Ki(nM) · MW / 1e6. emax 1.0, hill_n 1.
 * keo: documented-approximation (no published kₑₒ).
 *
 * New key: beta_2 (β2-adrenoceptor; propranolol + sotalol are the first rows).
 * propranolol β1 is NOT here — GtoPdb has no β1 row for propranolol (logged).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Row { receptor: string; pathway: string; ec50: number; pmid: string; note: string; }
interface Authoring { slug: string; keo: number; keoNote: string; keoPmid: string; rows: Row[]; }

const row = (receptor: string, pathway: string, ec50: number, pmid: string, note: string): Row => ({ receptor, pathway, ec50, pmid, note });

const ENTRIES: Authoring[] = [
  {
    slug: 'tolterodine', keo: 1.0, keoPmid: 'PMID:20590605',
    keoNote: 'Approximation; no published kₑₒ. Oral antimuscarinic (overactive bladder), Tmax ~1–2 h.',
    rows: [row('muscarinic', 'parasympatholysis', 0.001155, 'PMID:20590605', 'Per IUPHAR/GtoPdb (human M3, pKi range 8.4–8.5 across 2 refs → midpoint 8.45, Ki 3.55 nM); representative primary Sinha 2010 (PMID:20590605, human recombinant muscarinic, tolterodine comparator). ec50 = 3.55 nM × 325.49 / 1e6.')],
  },
  {
    slug: 'tiotropium', keo: 0.3, keoPmid: 'PMID:19653626',
    keoNote: 'Approximation; no published kₑₒ. Inhaled long-acting antimuscarinic (LAMA); slow dissociation, sustained bronchodilation.',
    rows: [row('muscarinic', 'parasympatholysis', 0.0000237, 'PMID:19653626', 'Per IUPHAR/GtoPdb (human M3, pKi range 9.5–11.1 across 5 refs → midpoint 10.3, Ki 0.050 nM); representative primary Prat 2009 (PMID:19653626, human M1–M5 antagonist panel). Very high affinity / slow off-rate. ec50 = 0.050 nM × 472.41 / 1e6.')],
  },
  {
    slug: 'ipratropium', keo: 2.0, keoPmid: 'PMID:16847442',
    keoNote: 'Approximation; no published kₑₒ. Inhaled short-acting antimuscarinic (SAMA); fast onset.',
    rows: [row('muscarinic', 'parasympatholysis', 0.0000937, 'PMID:16847442', 'Per IUPHAR/GtoPdb (human M3, pKi range 9.3–9.8 across 3 refs → midpoint 9.55, Ki 0.28 nM); representative primary Dowling 2006 (PMID:16847442, human M3 antagonist affinity/kinetics). ec50 = 0.28 nM × 332.46 / 1e6.')],
  },
  {
    slug: 'brimonidine', keo: 1.0, keoPmid: 'PMID:9605427',
    keoNote: 'Approximation; no published kₑₒ. α2-agonist (ophthalmic/oral); reduces aqueous humor / sympathetic outflow.',
    rows: [row('alpha_2a', 'agonist', 0.008232, 'PMID:9605427', 'Per IUPHAR/GtoPdb (human α2A, binding pKi range 6.4–8.7 across 5 refs → midpoint 7.55, Ki 28.2 nM); representative primary Jasper 1998 (PMID:9605427, recombinant human α2A/B/C agonist binding incl. UK-14304/brimonidine). ec50 = 28.2 nM × 292.13 / 1e6.')],
  },
  {
    slug: 'quetiapine', keo: 1.0, keoPmid: 'PMID:9430133',
    keoNote: 'Approximation; no published kₑₒ. Oral atypical antipsychotic, Tmax ~1.5 h; clinical effect downstream.',
    rows: [
      row('dopamine_d2', 'antagonist', 0.024201, 'PMID:9430133', 'Per IUPHAR/GtoPdb (human D2, pKi 7.2 → Ki 63 nM; review-sourced — Arnt 1998 PMID:9430133, "Do novel antipsychotics have similar pharmacological characteristics?"). GtoPdb-curated. ec50 = 63 nM × 383.51 / 1e6.'),
      row('5-HT2A', 'antagonist', 0.076524, 'PMID:12176106', 'Per IUPHAR/GtoPdb (human 5-HT2A, pKi range 6.4–7.0 → midpoint 6.7, Ki 200 nM); representative primary Kongsamut 2002 (PMID:12176106, antipsychotic D2/5-HT2A binding + hERG, quetiapine tested). ec50 = 200 nM × 383.51 / 1e6.'),
    ],
  },
  {
    slug: 'clozapine', keo: 0.5, keoPmid: 'PMID:8935801',
    keoNote: 'Approximation; no published kₑₒ. Oral atypical antipsychotic, Tmax ~2.5 h; clinical effect downstream.',
    rows: [
      row('dopamine_d2', 'antagonist', 0.145995, 'PMID:1354163', 'Per IUPHAR/GtoPdb (human D2, pKi range 5.8–6.9 across 5 refs [Freedman 1994, MacKenzie 1994, Shahid 2009, Sokoloff 1992, Tang 1994] → midpoint 6.35, Ki 447 nM); representative primary Sokoloff 1992 (PMID:1354163, human D2/D3 pharmacology, antipsychotic panel). Clozapine is a weak/low-affinity D2 antagonist (its hallmark). ec50 = 447 nM × 326.83 / 1e6.'),
      row('5-HT2A', 'antagonist', 0.001638, 'PMID:8935801', 'Per IUPHAR/GtoPdb (human 5-HT2A, pKi range 7.6–9.0 across 5 refs → midpoint 8.3, Ki 5.0 nM); representative primary Schotte 1996 (PMID:8935801, risperidone vs reference antipsychotics receptor binding incl. clozapine). ec50 = 5.0 nM × 326.83 / 1e6.'),
    ],
  },
  {
    slug: 'propranolol', keo: 1.0, keoPmid: 'PMID:15655528',
    keoNote: 'Approximation; no published kₑₒ. Non-selective β-blocker; oral, fairly fast onset.',
    rows: [row('beta_2', 'antagonist', 0.000116, 'PMID:15655528', 'Per IUPHAR/GtoPdb (human β2, pKi range 9.2–9.5 across 4 refs → midpoint 9.35, Ki 0.45 nM); representative primary Baker 2005 (PMID:15655528, β-antagonist selectivity at human β1/β2/β3). NOTE: GtoPdb has no β1 row for propranolol (β1 omitted, logged). ec50 = 0.45 nM × 259.34 / 1e6.')],
  },
  {
    slug: 'sotalol', keo: 1.0, keoPmid: 'PMID:15655528',
    keoNote: 'Approximation; no published kₑₒ. β-blocker + class-III antiarrhythmic (K-channel block not modelled here); oral.',
    rows: [
      row('beta_1', 'antagonist', 0.305588, 'PMID:15655528', 'Per IUPHAR/GtoPdb (human β1, pKi range 5.8–6.1 → midpoint 5.95, Ki 1122 nM; single-source within-paper range); primary Baker 2005 (PMID:15655528). Weak β-affinity (sotalol is hydrophilic, high doses). ec50 = 1122 nM × 272.36 / 1e6.'),
      row('beta_2', 'antagonist', 0.054344, 'PMID:15655528', 'Per IUPHAR/GtoPdb (human β2, pKi range 6.5–6.9 → midpoint 6.7, Ki 200 nM); primary Baker 2005 (PMID:15655528). ec50 = 200 nM × 272.36 / 1e6.'),
    ],
  },
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let keoN = 0, occN = 0, skipN = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(12)} keo already authored`);
    else { c.effect_compartment = { keo_per_h: a.keo, source_pmid: a.keoPmid, note: a.keoNote }; addRef(c, a.keoPmid); keoN++; console.log(`  [add ] ${c.slug.padEnd(12)} keo=${a.keo}/h  ${a.keoPmid}`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    for (const r of a.rows) {
      if (c.receptor_occupancy.find(x => x.receptor === r.receptor)) { skipN++; console.log(`  [skip] ${c.slug.padEnd(12)} @ ${r.receptor} already authored`); continue; }
      c.receptor_occupancy.push({ receptor: r.receptor, pathway: r.pathway, emax: 1.0, ec50_mg_l: r.ec50, hill_n: 1, source_pmid: r.pmid, note: r.note });
      addRef(c, r.pmid); occN++;
      console.log(`  [add ] ${c.slug.padEnd(12)} @ ${r.receptor.padEnd(11)} ec50=${r.ec50} mg/L  ${r.pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 20 GtoPdb ranges: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
