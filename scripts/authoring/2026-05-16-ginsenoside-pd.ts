/**
 * 2026-05-16-ginsenoside-pd.ts
 *
 * MW backfill only — receptor authoring intentionally skipped.
 *
 * History: an earlier draft of this pass attempted to author 3 in-vitro
 * receptor entries on ginsenoside-rg3 (Nav1.2 / 5-HT3A / α9α10 nAChR,
 * from Lee 2005/2007/2013, all in Xenopus oocytes, IC50 25-31 mg/L).
 * `pnpm registry:lint` rejected it: receptor_occupancy entries require
 * `effect_compartment.keo_per_h` so Ce(t) is computable, and no
 * published kₑₒ for Rg3 exists. A 2026-05-16 PubMed sweep returned
 * zero hits for "ginsenoside Rg3" combined with effect-compartment /
 * hysteresis / keo / ke0 / PK-PD-model. The Rg3 clinical-pharmacology
 * literature is pure PK (Pang 2001 PMID:12580081, Zhao 2016
 * PMID:26470874) — consistent with the observation that Cmax/IC50 is
 * ~0.06% at any oral dose, so nobody has bothered fitting an
 * effect-compartment model.
 *
 * The three IC50 PMIDs are preserved in AUTHORING_GAPS.md under the
 * "Receptor occupancy — Ki verified, kₑₒ missing" pattern so a future
 * full-text pass (or any in-vivo PD-time-course paper that surfaces)
 * can author them as a single unit alongside a real kₑₒ.
 *
 * For ginsenoside-rb1: PubMed surveys returned no IC50 data with the
 * standard quantitative-receptor search patterns. Rb1's published
 * effects are largely downstream (AMPK activation, anti-inflammatory,
 * NMDA modulation in qualitative reports). Authoring downstream
 * signaling effects is what modulators[] on pathways is for; that's
 * already in place via the pathway authoring batches.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  mw_g_mol?: number;
  [k: string]: unknown;
}

const RG3_MW = 785.0;   // C42H72O13, PubChem CID 9918693
const RB1_MW = 1109.3;  // C54H92O23, PubChem CID 9898279

function main(): void {
  const cs = JSON.parse(readFileSync(PATH, 'utf-8')) as Compound[];

  let mwPatched = 0;

  const rb1 = cs.find(c => c.slug === 'ginsenoside-rb1');
  if (rb1 && rb1.mw_g_mol == null) {
    rb1.mw_g_mol = RB1_MW;
    mwPatched++;
    console.log(`  [mw]    ginsenoside-rb1 → ${RB1_MW} g/mol`);
  }
  const rg3 = cs.find(c => c.slug === 'ginsenoside-rg3');
  if (rg3 && rg3.mw_g_mol == null) {
    rg3.mw_g_mol = RG3_MW;
    mwPatched++;
    console.log(`  [mw]    ginsenoside-rg3 → ${RG3_MW} g/mol`);
  }

  writeFileSync(PATH, JSON.stringify(cs, null, 2) + '\n');

  console.log('\nGinsenoside PD authoring pass:');
  console.log(`  MW backfilled: ${mwPatched}`);
  console.log(`  Receptor sites added: 0 (deferred — see AUTHORING_GAPS.md, no kₑₒ in literature)`);
}

main();
