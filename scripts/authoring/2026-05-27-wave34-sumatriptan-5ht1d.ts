/**
 * 2026-05-27-wave34-sumatriptan-5ht1d.ts — sumatriptan 5-HT1D occupancy.
 *
 * Extends sumatriptan beyond its existing 5-HT1B row to the canonical
 * triptan target, 5-HT1D. Clean HUMAN, abstract-verbatim value; the
 * compound already carries an effect_compartment (kₑₒ 3/h, PMID:8757005),
 * so no keo work is needed — lint's "occupancy needs keo" gate is satisfied.
 *
 * sumatriptan (MW 295.4) — 5-HT1D K(D) 6.58 nM, Napier 1999 (PMID:10193663),
 *   human recombinant 5-HT1D in HeLa cells, [³H]sumatriptan saturation.
 *     ec50 = 6.58 nM × 295.4 / 1e6 = 0.001944 mg/L
 *   Abstract verbatim: "[3H]eletriptan had over 6-fold higher affinity than
 *   [3H]sumatriptan at the 5-HT1D receptor (K(D): 0.92 and 6.58 nM,
 *   respectively)". KD is the direct half-occupancy constant — the ideal
 *   parameter for the Hill curve. Post-1996 paper → modern HTR1D nomenclature
 *   (no 5-HT1Dα/β ambiguity). Full agonist → emax 1.0, hill_n 1.
 *
 * ── NOT authored (source-quality wall, documented) ─────────────────
 *   5-HT1F  — GtoPdb gives a human pKi range (7.2–7.9, 4 papers) but NO
 *             abstract states the human number verbatim (Adham 1993 PNAS =
 *             potency ranking only; Napier 1999 quantifies 1B/1D not 1F;
 *             9225282/10193663 qualitative for human 1F). Citing any single
 *             PMID for it would misattribute the value. Skipped, not parked
 *             in error.
 *
 * Idempotent: re-running skips the row if already present.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy {
  receptor: string;
  pathway?: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid?: string;
  note?: string;
}
interface Compound {
  slug: string;
  effect_compartment?: { keo_per_h?: number };
  receptor_occupancy?: ReceptorOccupancy[];
  refs?: string[];
  [k: string]: unknown;
}

const SLUG = 'sumatriptan';
const ROW: ReceptorOccupancy = {
  receptor: '5-HT1D',
  pathway: 'agonist',
  emax: 1.0,
  ec50_mg_l: 0.001944,
  hill_n: 1,
  source_pmid: 'PMID:10193663',
  note: 'Napier 1999 (Eur J Pharmacol) verbatim: "[3H]eletriptan had over 6-fold higher affinity than [3H]sumatriptan at the 5-HT1D receptor (K(D): 0.92 and 6.58 nM, respectively)". Human recombinant 5-HT1D in HeLa cells, [³H]sumatriptan saturation binding → KD 6.58 nM. ec50 = 6.58 nM × 295.4 / 1e6.',
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const c = data.find(x => x.slug === SLUG);
  if (!c) throw new Error(`compound "${SLUG}" not found in registry`);
  if (!c.effect_compartment?.keo_per_h) throw new Error(`${SLUG} has no keo — occupancy would fail lint`);

  c.receptor_occupancy = c.receptor_occupancy ?? [];
  if (c.receptor_occupancy.find(r => r.receptor === ROW.receptor)) {
    console.log(`[skip] ${SLUG} @ ${ROW.receptor} already authored`);
    return;
  }
  c.receptor_occupancy.push(ROW);
  c.refs = c.refs ?? [];
  if (ROW.source_pmid && !c.refs.includes(ROW.source_pmid)) c.refs.push(ROW.source_pmid);

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`[add ] ${SLUG} @ ${ROW.receptor} ec50=${ROW.ec50_mg_l} mg/L emax=${ROW.emax}  ${ROW.source_pmid}`);
}

main();
