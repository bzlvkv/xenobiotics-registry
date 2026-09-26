/**
 * 2026-05-27-wave37-opioid-betablocker-gtp.ts — opioid κ/δ subtypes +
 * β-blocker α1/β2 cross-reactivity, from GtoPdb curated human affinities.
 *
 * Correctness angle: carvedilol & labetalol are DEFINED by combined α+β
 * blockade but only carried β1; butorphanol had a keo but no occupancy at all.
 * Opioid rows add the κ/δ profile that distinguishes the mixed agonists/
 * antagonists (buprenorphine κ-antagonism, naloxone's non-selective block,
 * morphine's weak κ/δ).
 *
 * Provenance: GtoPdb bulk interactions.csv (see _gtp-affinity.ts). Single-value
 * rows cite the one ref; multi-paper rows give the pKi range + midpoint.
 * ec50_mg_l = Ki(nM) × MW / 1e6. emax 1.0, hill_n 1.
 *
 * No clean human GtoPdb value (left unauthored, NOT rodent-substituted):
 *   oxycodone @ μ, propranolol @ β1, buprenorphine @ δ, butorphanol @ δ,
 *   metoclopramide @ 5-HT4.
 *
 * Adds occupancy key delta_opioid (bridged OPRD1 in apps/app/src/lib/receptors.ts).
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
  { slug: 'carvedilol', rows: [ // MW 406.47
    A('alpha_1', 'antagonist', 0.001618, 'PMID:32608144',
      'GtoPdb-curated human α1A-adrenoceptor binding: pKi 8.4 (Ki 4.0 nM), antagonist, ref PMID:32608144. Carvedilol\'s defining α1 blockade (vasodilation in heart failure). Keyed alpha_1. ec50 = 4.0 nM × 406.47 / 1e6.'),
    A('beta_2', 'antagonist', 0.0000406, 'PMID:15655528',
      'GtoPdb-curated human β2-adrenoceptor binding: pKi range 9.4–10.6 (PMID:15655528, PMID:10411574); midpoint pKi 10.0 → Ki ≈ 0.1 nM, antagonist. Carvedilol is non-β1-selective. ec50 = 0.1 nM × 406.47 / 1e6.') ] },
  { slug: 'labetalol', rows: [ // MW 328.4
    A('alpha_1', 'antagonist', 0.016459, 'PMID:34355529',
      'GtoPdb-curated human α1A-adrenoceptor binding: pKi 7.3 (Ki 50 nM), antagonist, ref PMID:34355529. Labetalol\'s α1 blockade (its combined α/β mechanism). Keyed alpha_1. ec50 = 50 nM × 328.4 / 1e6.'),
    A('beta_2', 'partial-agonist', 0.003612, 'PMID:15655528',
      'GtoPdb-curated human β2-adrenoceptor binding: pKi 7.96 (Ki 11 nM), partial agonist (ISA), ref PMID:15655528. ec50 = 11 nM × 328.4 / 1e6.') ] },
  { slug: 'buprenorphine', rows: [ // MW 467.64
    A('kappa_opioid', 'antagonist', 0.000105, 'PMID:9686407',
      'GtoPdb-curated human κ-opioid binding: pKi range 9.1–10.2 (PMID:9686407, PMID:9262330); midpoint pKi 9.65 → Ki ≈ 0.22 nM, antagonist. Buprenorphine\'s κ antagonism. ec50 = 0.22 nM × 467.64 / 1e6.') ] },
  { slug: 'butorphanol', rows: [ // MW 327.46
    A('mu_opioid', 'partial-agonist', 0.0000393, 'PMID:18674902',
      'GtoPdb-curated human μ-opioid binding: pKi 9.92 (Ki 0.12 nM), partial agonist, ref PMID:18674902. ec50 = 0.12 nM × 327.46 / 1e6.'),
    A('kappa_opioid', 'partial-agonist', 0.0000393, 'PMID:18674902',
      'GtoPdb-curated human κ-opioid binding: pKi 9.92 (Ki 0.12 nM), agonist, ref PMID:18674902. Butorphanol is a κ-agonist / μ-partial-agonist analgesic. ec50 = 0.12 nM × 327.46 / 1e6.') ] },
  { slug: 'morphine', rows: [ // MW 285.34
    A('kappa_opioid', 'partial-agonist', 0.014301, 'PMID:9686407',
      'GtoPdb-curated human κ-opioid binding: pKi 7.3 (Ki 50 nM), partial agonist, ref PMID:9686407. Morphine\'s weak κ activity. ec50 = 50 nM × 285.34 / 1e6.'),
    A('delta_opioid', 'agonist', 0.035921, 'PMID:9686407',
      'GtoPdb-curated human δ-opioid binding: pKi 6.9 (Ki 126 nM), full agonist, ref PMID:9686407. Morphine\'s weak δ activity. ec50 = 126 nM × 285.34 / 1e6.') ] },
  { slug: 'naloxone', rows: [ // MW 327.37
    A('kappa_opioid', 'antagonist', 0.002600, 'PMID:9686407',
      'GtoPdb-curated human κ-opioid binding: pKi range 7.6–8.6 (PMID:9686407, PMID:7869844, PMID:7624359, PMID:9262330); midpoint pKi 8.1 → Ki ≈ 7.9 nM, antagonist. Naloxone\'s non-selective antagonism. ec50 = 7.9 nM × 327.37 / 1e6.'),
    A('delta_opioid', 'antagonist', 0.020657, 'PMID:9686407',
      'GtoPdb-curated human δ-opioid binding: pKi 7.2 (Ki 63 nM), antagonist, ref PMID:9686407. ec50 = 63 nM × 327.37 / 1e6.') ] },
  { slug: 'nalbuphine', rows: [ // MW 357.45
    A('delta_opioid', 'partial-agonist', 0.207321, 'PMID:19282177',
      'GtoPdb-curated human δ-opioid binding: pKi 6.24 (Ki 580 nM), partial agonist, ref PMID:19282177. ec50 = 580 nM × 357.45 / 1e6.') ] },
  { slug: 'metoclopramide', rows: [ // MW 299.8
    A('5ht3', 'antagonist', 0.178558, 'PMID:11489465',
      'GtoPdb-curated human 5-HT3A binding: pKi range 6.0–6.45 (PMID:11489465, PMID:8818349); midpoint pKi 6.23 → Ki ≈ 596 nM, antagonist. Metoclopramide\'s antiemetic 5-HT3 block. ec50 = 596 nM × 299.8 / 1e6.') ] },
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
        skipped++; console.log(`[skip] ${e.slug.padEnd(14)} @ ${row.receptor} already authored`); continue;
      }
      c.receptor_occupancy.push(row);
      if (row.source_pmid && !c.refs.includes(row.source_pmid)) c.refs.push(row.source_pmid);
      added++;
      console.log(`[add ] ${e.slug.padEnd(14)} @ ${row.receptor.padEnd(13)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave37: +${added} occupancy rows (${skipped} already authored).`);
}

main();
