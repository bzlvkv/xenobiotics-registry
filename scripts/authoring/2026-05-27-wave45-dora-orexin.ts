/**
 * 2026-05-27-wave45-dora-orexin.ts — DORA class (dual orexin receptor
 * antagonists) PD authoring. suvorexant / lemborexant / daridorexant each
 * had cited PK in the registry but no keo or occupancy. The DORAs are
 * defined by their HCRTR1 + HCRTR2 antagonism — without those rows the
 * pathway view shows them as orexin_arousal_axis modulators with no
 * mechanism quantitation.
 *
 * Found via the receptor_pharmacology-pathway audit: 195 modulator entries
 * across 36 receptor_pharm pathways lacked receptor_occupancy. Most are
 * legitimately not-fillable (releasers, prodrugs, mixtures, GtoPdb-blocked
 * OTC antihistamines) but the DORA trio was a clean fill: all three have
 * keo-able acute sleep-onset PD + clean GtoPdb human pKi at OX1 + OX2.
 *
 * Bridges orexin_1 → HCRTR1, orexin_2 → HCRTR2 added in receptors.ts.
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

const KEO_NOTE = 'Approximation; no published kₑₒ. DORA class reduces sleep latency within ~30–60 min of an oral dose (i.e. acute orexin block translates rapidly to sleep onset). 1.5/h → t½kₑₒ ≈ 28 min.';
const KEO = (note = KEO_NOTE) => ({ keo_per_h: 1.5, note });

const A = (receptor: string, ec50_mg_l: number, source_pmid: string, note: string): ReceptorOccupancy => ({
  receptor, pathway: 'antagonist', emax: 1.0, ec50_mg_l, hill_n: 1, source_pmid, note,
});

const ENTRIES: { slug: string; keo: ReturnType<typeof KEO>; rows: ReceptorOccupancy[] }[] = [
  {
    slug: 'suvorexant', // MW 450.92
    keo: KEO(),
    rows: [
      A('orexin_1', 0.000451, 'PMID:20565075',
        'GtoPdb-curated human OX1 (HCRTR1) binding: pKi range 8.7–9.3 (PMID:20565075, PMID:24376396, PMID:23692283, PMID:31860301); midpoint pKi 9.0 → Ki ≈ 1.0 nM, antagonist. ec50 = 1.0 nM × 450.92 / 1e6.'),
      A('orexin_2', 0.000284, 'PMID:20565075',
        'GtoPdb-curated human OX2 (HCRTR2) binding: pKi range 8.9–9.5 (PMID:20565075, PMID:24376396, PMID:23692283, PMID:31860301); midpoint pKi 9.2 → Ki ≈ 0.63 nM, antagonist. Suvorexant\'s slight OX2 preference. ec50 = 0.63 nM × 450.92 / 1e6.'),
    ],
  },
  {
    slug: 'lemborexant', // MW 410.42
    keo: KEO(),
    rows: [
      A('orexin_1', 0.001030, 'PMID:31860301',
        'GtoPdb-curated human OX1 (HCRTR1) binding: pKi 8.6 (Ki 2.51 nM), antagonist, ref PMID:31860301. ec50 = 2.51 nM × 410.42 / 1e6.'),
      A('orexin_2', 0.000206, 'PMID:31860301',
        'GtoPdb-curated human OX2 (HCRTR2) binding: pKi 9.3 (Ki 0.5 nM), antagonist, ref PMID:31860301. Lemborexant\'s OX2 preference (~5× over OX1). ec50 = 0.5 nM × 410.42 / 1e6.'),
    ],
  },
  {
    slug: 'daridorexant', // MW 450.92
    keo: KEO(),
    rows: [
      A('orexin_1', 0.000712, 'PMID:31860301',
        'GtoPdb-curated human OX1 (HCRTR1) binding: pKi 8.8 (Ki 1.58 nM), antagonist, ref PMID:31860301. ec50 = 1.58 nM × 450.92 / 1e6.'),
      A('orexin_2', 0.000451, 'PMID:31860301',
        'GtoPdb-curated human OX2 (HCRTR2) antagonist potency: pKB range 8.9–9.1 (PMID:31860301, PMID:28663311); midpoint pKB 9.0 → ~1 nM. pKB (Schild) used as Kᵢ surrogate for an antagonist. ec50 = 1.0 nM × 450.92 / 1e6.'),
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
    else { c.effect_compartment = e.keo; addedKeo++; console.log(`[add ] ${e.slug.padEnd(13)} kₑₒ ${e.keo.keo_per_h}/h (approx)`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    c.refs = c.refs ?? [];
    for (const row of e.rows) {
      if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { console.log(`[skip] ${e.slug} @ ${row.receptor} present`); skipped++; continue; }
      c.receptor_occupancy.push(row);
      if (row.source_pmid && !c.refs.includes(row.source_pmid)) c.refs.push(row.source_pmid);
      addedOcc++;
      console.log(`[add ] ${e.slug.padEnd(13)} @ ${row.receptor.padEnd(8)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave45: +${addedKeo} keo, +${addedOcc} occupancy (${skipped} skipped).`);
}

main();
