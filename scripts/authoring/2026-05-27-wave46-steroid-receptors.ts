/**
 * 2026-05-27-wave46-steroid-receptors.ts — corticosteroid GR/MR + SERM ER +
 * PGR (progesterone class) PD authoring. Eight compounds, each previously
 * carrying PK but missing keo + occupancy at its defining nuclear receptor.
 *
 * Cleanly fillable from GtoPdb-curated human values. PGR (progesterone
 * receptor) added to the non-GPCR catalog via build-receptor-catalog
 * (NONGPCR map) before this wave runs.
 *
 * kₑₒ approximations: steroid-receptor PD is transcriptional — chronic build.
 * Use 0.1/h (t½kₑₒ ≈ 7 h) for GR/MR/PR ligands, matching the existing
 * dexamethasone/prednisolone convention. SERMs (tamoxifen, fulvestrant) get a
 * slower 0.05/h (t½kₑₒ ≈ 14 h) reflecting their weeks-of-dosing onset.
 *
 * ec50_mg_l = Ki(nM) × MW / 1e6. emax 1.0, hill_n 1. Idempotent.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: { keo_per_h: number; source_pmid?: string; note?: string }; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }

const KEO_STEROID = (k = 0.1, label = 'transcriptional GR/MR/PR ligand'): { keo_per_h: number; note: string } => ({
  keo_per_h: k, note: `Approximation; no published kₑₒ. ${label}: PD onset via nuclear-receptor transcriptional change (hours to days), so a slow effect-compartment ~${k}/h (t½kₑₒ ≈ ${Math.round(0.693/k)} h). Matches the existing dexamethasone/prednisolone keo convention.`,
});
const A = (receptor: string, pathway: string, ec50_mg_l: number, source_pmid: string, note: string): ReceptorOccupancy => ({ receptor, pathway, emax: 1.0, ec50_mg_l, hill_n: 1, source_pmid, note });

const ENTRIES: { slug: string; keo: { keo_per_h: number; note: string }; rows: ReceptorOccupancy[] }[] = [
  {
    slug: 'cortisol', keo: KEO_STEROID(0.1, 'endogenous GR/MR agonist'),
    rows: [
      A('glucocorticoid', 'agonist', 0.008119, 'PMID:8282004',
        'GtoPdb-curated human GR (NR3C1) binding: pIC50 range 7.3–8.0 (PMID:8282004, PMID:10611474, PMID:10747884); midpoint 7.65 → IC50 ≈ 22 nM. Cortisol is the endogenous GR agonist. ec50 = 22 nM × 362.46 / 1e6.'),
      A('mineralocorticoid', 'agonist', 0.0000484, 'PMID:8282004',
        'GtoPdb-curated human MR (NR3C2) binding: pIC50 range 9.8–9.95 (PMID:8282004, PMID:10611474); midpoint 9.875 → IC50 ≈ 0.13 nM. Cortisol\'s high MR affinity is why 11β-HSD2 in distal tubule must inactivate it to spare MR for aldosterone. ec50 = 0.13 nM × 362.46 / 1e6.'),
    ],
  },
  {
    slug: 'mifepristone', keo: KEO_STEROID(0.1, 'GR/PR antagonist'),
    rows: [
      A('glucocorticoid', 'antagonist', 0.000171, 'PMID:8282004',
        'GtoPdb-curated human GR (NR3C1) binding: pKd 9.4 (Kd 0.40 nM), antagonist (PMID:8282004, PMID:3560943). Mifepristone\'s anti-GR action is the basis for its hypercortisolism (Cushing\'s) indication. ec50 = 0.40 nM × 429.6 / 1e6.'),
      A('progesterone_receptor', 'antagonist', 0.000473, 'PMID:12781197',
        'GtoPdb-curated human PR (PGR) binding: pKi 8.96 (Ki 1.1 nM), mixed agonist/antagonist (PMID:12781197). Net antagonism at PR is the basis for medical abortion + emergency contraception. ec50 = 1.1 nM × 429.6 / 1e6.'),
    ],
  },
  {
    slug: 'fludrocortisone', keo: KEO_STEROID(0.1, 'MR-preferring agonist'),
    rows: [
      A('mineralocorticoid', 'agonist', 0.0000457, 'PMID:8282004',
        'GtoPdb-curated human MR (NR3C2) binding: pIC50 9.92 (IC50 0.12 nM), agonist (PMID:8282004). Fludrocortisone\'s defining MR-preferring activity (used for Addison\'s + orthostatic hypotension). ec50 = 0.12 nM × 380.45 / 1e6.'),
    ],
  },
  {
    slug: 'triamcinolone', keo: KEO_STEROID(0.1, 'synthetic GR agonist'),
    rows: [
      A('glucocorticoid', 'agonist', 0.007889, 'PMID:10747884',
        'GtoPdb-curated human GR (NR3C1) binding: pIC50 7.7 (IC50 20 nM), full agonist (PMID:10747884). ec50 = 20 nM × 394.43 / 1e6.'),
    ],
  },
  {
    slug: 'budesonide', keo: KEO_STEROID(0.1, 'synthetic GR agonist'),
    rows: [
      A('glucocorticoid', 'agonist', 0.009311, 'PMID:21880489',
        'GtoPdb-curated human GR (NR3C1) functional potency: pEC50 7.42 (PMID:28937774) + 7.91 (PMID:21880489); midpoint pEC50 7.665 → EC50 ≈ 22 nM. ec50 = 22 nM × 430.54 / 1e6.'),
    ],
  },
  {
    slug: 'tamoxifen', keo: KEO_STEROID(0.05, 'SERM (chronic ER suppression)'),
    rows: [
      A('estrogen_receptor', 'partial-agonist', 0.005755, 'PMID:9048584',
        'GtoPdb-curated human ERα (ESR1) binding: pKi 7.8 (Ki 15.5 nM), mixed agonist/antagonist (SERM) per PMID:9048584. The mixed action drives tamoxifen\'s tissue-selective profile (antagonist in breast, partial agonist in endometrium/bone). Also binds ERβ (Ki ≈ 68 nM) — not authored as a separate row. ec50 = 15.5 nM × 371.51 / 1e6.'),
    ],
  },
  {
    slug: 'fulvestrant', keo: KEO_STEROID(0.05, 'SERD (pure ER antagonist + degrader)'),
    rows: [
      A('estrogen_receptor', 'antagonist', 0.000637, 'PMID:12672240',
        'GtoPdb-curated human ERα (ESR1) binding: pKi 8.98 (Ki 1.05 nM), pure antagonist + receptor degrader (SERD) per PMID:12672240. Also potent at ERβ (Ki ≈ 1.4 nM) — both subtypes degraded. ec50 = 1.05 nM × 606.77 / 1e6.'),
    ],
  },
  {
    slug: 'progesterone', keo: KEO_STEROID(0.1, 'endogenous PR agonist'),
    rows: [
      A('progesterone_receptor', 'agonist', 0.001090, 'PMID:9464360',
        'GtoPdb-curated human PR (PGR) binding: pKi 8.46 (Ki 3.5 nM), full agonist (PMID:9464360); pEC50 8.82 (PMID:9667968) functionally consistent. Endogenous PR agonist. ec50 = 3.5 nM × 314.46 / 1e6.'),
    ],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let addedKeo = 0, addedOcc = 0, skipped = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) throw new Error(`${e.slug} missing`);
    if (c.effect_compartment?.keo_per_h) { console.log(`[skip] ${e.slug} keo present`); skipped++; }
    else { c.effect_compartment = e.keo; addedKeo++; console.log(`[add ] ${e.slug.padEnd(15)} kₑₒ ${e.keo.keo_per_h}/h`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    c.refs = c.refs ?? [];
    for (const row of e.rows) {
      if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { console.log(`[skip] ${e.slug} @ ${row.receptor} present`); skipped++; continue; }
      c.receptor_occupancy.push(row);
      if (row.source_pmid && !c.refs.includes(row.source_pmid)) c.refs.push(row.source_pmid);
      addedOcc++;
      console.log(`[add ] ${e.slug.padEnd(15)} @ ${row.receptor.padEnd(22)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave46: +${addedKeo} keo, +${addedOcc} occupancy (${skipped} skipped).`);
}

main();
