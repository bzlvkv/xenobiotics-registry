/**
 * 2026-05-27-wave40-tier3-pramipexole.ts — add pramipexole (new compound).
 *
 * First Tier-3 addition: a common clinical drug absent from the registry.
 * PK provenance is the FDA prescribing information (label tier — recorded in
 * `notes` + refs, since pk params live in the label, not abstracts). Receptor
 * affinity is GtoPdb-curated human binding. This is the agreed label-PK tier
 * for new compounds.
 *
 * Verified sources:
 *   - MW 211.33 g/mol (free base) — PubChem (C10H17N3S).
 *   - PK — FDA label (DailyMed setid 46f88017-7b0e-437e-90b1-37bdf9013e72):
 *     F >90% (0.9), Vd ~500 L, terminal t½ ~8 h (young)/~12 h (elderly),
 *     Tmax ~2 h, ~90% renal unchanged. ka_hr 1.5 derived from Tmax 2 h
 *     (ke from t½ 8 h via Tmax = ln(ka/ke)/(ka−ke)).
 *   - D3 — GtoPdb human pKi range 8.4–8.7 (PMID:7756621, PMID:7664822),
 *     full agonist; midpoint pKi 8.55 → Ki ≈ 2.8 nM. (D2 NOT authored: GtoPdb's
 *     human range pKi 5.1–7.4 is too wide to pin a value.)
 *   - kₑₒ 0.5/h — documented approximation (no published value), reasoned from
 *     acute motor-effect onset (~1–2 h, near plasma Tmax).
 *
 * Idempotent: skips if a `pramipexole` slug already exists.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const COMPOUND = {
  slug: 'pramipexole',
  name: 'Pramipexole',
  aliases: ['Mirapex'],
  category: 'pharmacological',
  systems: ['nervous'],
  mechanism: "Non-ergot dopamine agonist with preferential affinity for the D3 receptor (within the D2 receptor family); first-line for Parkinson's disease and restless legs syndrome.",
  routes: ['PO'],
  doses: { PO: { min: 0.125, max: 1.5, typical: 0.5, unit: 'mg' } },
  half_life_hr: { PO: 8 },
  pk: { PO: { F: 0.9, V_L: 500, ka_hr: 1.5 } },
  mw_g_mol: 211.33,
  effect_compartment: {
    keo_per_h: 0.5,
    note: 'Approximation; no published kₑₒ. Reasoned from pramipexole\'s acute motor-effect onset (~1–2 h, near plasma Tmax ~2 h per FDA label). 0.5/h → t½kₑₒ ≈ 1.4 h.',
  },
  receptor_occupancy: [
    {
      receptor: 'dopamine_d3',
      pathway: 'agonist',
      emax: 1.0,
      ec50_mg_l: 0.000596,
      hill_n: 1,
      source_pmid: 'PMID:7756621',
      note: 'GtoPdb-curated human D3 binding: pKi range 8.4–8.7 (PMID:7756621, PMID:7664822), full agonist; midpoint pKi 8.55 → Ki ≈ 2.8 nM. Pramipexole\'s D3-preferring signature. ec50 = 2.8 nM × 211.33 / 1e6.',
    },
  ],
  notes: 'PK from FDA prescribing information (DailyMed setid 46f88017-7b0e-437e-90b1-37bdf9013e72): absolute bioavailability >90% (F 0.9), apparent Vd ~500 L, terminal t½ ~8 h (young)/~12 h (elderly), Tmax ~2 h, ~90% excreted unchanged in urine. ka_hr 1.5 derived from Tmax 2 h (ke from t½ 8 h). Human D2 affinity not authored — GtoPdb\'s curated human range (pKi 5.1–7.4) is too wide to pin a value.',
  refs: ['PMID:7756621', 'PMID:37600497'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as { slug: string }[];
  if (data.some(c => c.slug === COMPOUND.slug)) {
    console.log(`[skip] ${COMPOUND.slug} already in registry`); return;
  }
  data.push(COMPOUND as unknown as { slug: string });
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`[add ] ${COMPOUND.slug} — new compound (PO; F ${COMPOUND.pk.PO.F}, Vd ${COMPOUND.pk.PO.V_L} L, t½ ${COMPOUND.half_life_hr.PO} h; D3 ec50 ${COMPOUND.receptor_occupancy[0]!.ec50_mg_l} mg/L)`);
}

main();
