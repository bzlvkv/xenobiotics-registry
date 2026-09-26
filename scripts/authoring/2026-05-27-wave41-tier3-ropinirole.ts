/**
 * 2026-05-27-wave41-tier3-ropinirole.ts — add ropinirole (new compound).
 *
 * Second Tier-3 addition (companion to pramipexole). Label-tier PK + GtoPdb
 * receptor affinity, same provenance approach as wave40.
 *
 * Verified sources:
 *   - MW 260.37 g/mol (free base) — PubChem (C16H24N2O).
 *   - PK — FDA label (DailyMed setid e32ef7a6-b4b6-4a22-a2ed-722255b486b4,
 *     IR film-coated): absolute bioavailability 45–55% (F 0.50), apparent Vd
 *     7.5 L/kg (~525 L at 70 kg), t½ ~6 h, Tmax ~1–2 h, hepatic CYP1A2.
 *     ka_hr 2.0 derived from Tmax ~1.5 h (ke from t½ 6 h).
 *   - D2 — GtoPdb human pKi 8.14 (Ki 7.2 nM), agonist, PMID:9057850.
 *   - D3 — GtoPdb human pKi 7.72 (Ki 19 nM), agonist, PMID:9057850.
 *     (ropinirole's D2 ≳ D3 affinity, unlike pramipexole.)
 *   - kₑₒ 0.5/h — documented approximation (no published value), as wave40.
 *
 * Idempotent: skips if `ropinirole` already exists.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const COMPOUND = {
  slug: 'ropinirole',
  name: 'Ropinirole',
  aliases: ['Requip'],
  category: 'pharmacological',
  systems: ['nervous'],
  mechanism: "Non-ergot dopamine agonist at D2 and D3 receptors; used in Parkinson's disease and restless legs syndrome. Hepatic CYP1A2 metabolism (interacts with CYP1A2 inhibitors/inducers).",
  routes: ['PO'],
  doses: { PO: { min: 0.25, max: 8, typical: 2, unit: 'mg' } },
  half_life_hr: { PO: 6 },
  pk: { PO: { F: 0.5, V_L: 525, ka_hr: 2.0 } },
  mw_g_mol: 260.37,
  effect_compartment: {
    keo_per_h: 0.5,
    note: 'Approximation; no published kₑₒ. Reasoned from the acute dopaminergic motor-effect onset (~1–2 h, near plasma Tmax) shared with other dopamine agonists. 0.5/h → t½kₑₒ ≈ 1.4 h.',
  },
  receptor_occupancy: [
    {
      receptor: 'dopamine_d2',
      pathway: 'agonist',
      emax: 1.0,
      ec50_mg_l: 0.001885,
      hill_n: 1,
      source_pmid: 'PMID:9057850',
      note: 'GtoPdb-curated human D2 binding: pKi 8.14 (Ki 7.2 nM), agonist, ref PMID:9057850. ec50 = 7.2 nM × 260.37 / 1e6.',
    },
    {
      receptor: 'dopamine_d3',
      pathway: 'agonist',
      emax: 1.0,
      ec50_mg_l: 0.004947,
      hill_n: 1,
      source_pmid: 'PMID:9057850',
      note: 'GtoPdb-curated human D3 binding: pKi 7.72 (Ki 19 nM), agonist, ref PMID:9057850. ec50 = 19 nM × 260.37 / 1e6.',
    },
  ],
  notes: 'PK from FDA prescribing information (DailyMed setid e32ef7a6-b4b6-4a22-a2ed-722255b486b4, IR film-coated tablet): absolute bioavailability 45–55% (F 0.50), apparent Vd 7.5 L/kg (~525 L at 70 kg), elimination t½ ~6 h, Tmax ~1–2 h, hepatic CYP1A2 metabolism. ka_hr 2.0 derived from Tmax ~1.5 h (ke from t½ 6 h).',
  refs: ['PMID:9057850'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as { slug: string }[];
  if (data.some(c => c.slug === COMPOUND.slug)) {
    console.log(`[skip] ${COMPOUND.slug} already in registry`); return;
  }
  data.push(COMPOUND as unknown as { slug: string });
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`[add ] ${COMPOUND.slug} — new compound (PO; F ${COMPOUND.pk.PO.F}, Vd ${COMPOUND.pk.PO.V_L} L, t½ ${COMPOUND.half_life_hr.PO} h; D2 ${COMPOUND.receptor_occupancy[0]!.ec50_mg_l}, D3 ${COMPOUND.receptor_occupancy[1]!.ec50_mg_l} mg/L)`);
}

main();
