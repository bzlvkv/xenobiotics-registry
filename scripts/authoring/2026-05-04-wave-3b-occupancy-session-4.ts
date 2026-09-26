/**
 * 2026-05-04-wave-3b-occupancy-session-4.ts — Wave 3b session 4.
 *
 * 10 verified receptor occupancy entries on compounds whose kₑₒ is
 * already in registry. Single-batch coverage of the anesthesia /
 * neuromuscular / antinociceptive / inotropy / local-anesthetic /
 * NSAID classes — every compound below carries kₑₒ so all entries
 * pass the receptor.needs-keo lint gate.
 *
 *   ── GABA-A (anesthesia) ──
 *     - thiopental   EC50 35.9 µM  Xenopus oocyte α1β2γ2 GABA potentiation (PMID:10498837)
 *     - etomidate    EC50  9.29 µM GABA-A PAM (PMID:39615281)
 *
 *   ── Nicotinic ACh (neuromuscular blockade) ──
 *     - rocuronium   IC50 37.9 nM  innervated mouse muscle nAChR whole-cell (PMID:20305678)
 *     - atracurium   IC50 24.4 nM  same paper, innervated muscle  (PMID:20305678)
 *     - vecuronium   IC50 11.2 nM  same paper, innervated muscle  (PMID:20305678)
 *
 *   ── Cav α2δ (antinociception) ──
 *     - pregabalin   Ki  180 nM   α2δ ligand binding (PMID:16781071)
 *
 *   ── Na+/K+-ATPase (positive inotropy) ──
 *     - digoxin      IC50 409 nM  human kidney α1β1 NADH-coupled (PMID:19487957)
 *
 *   ── Voltage-gated Na+ channel (local anesthesia) ──
 *     - ropivacaine  IC50 117.3 µM  rat dorsal-horn neurons, Vh -80 mV (PMID:10781449)
 *
 *   ── COX (anti-inflammatory) ──
 *     - ibuprofen COX-1  IC50 12  µM  human monocyte assay (PMID:11804398)
 *     - ibuprofen COX-2  IC50 80  µM  same paper, LPS-stimulated (PMID:11804398)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Occupancy = {
  receptor: string;
  pathway: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid: string;
  note?: string;
};

const ENTRIES: Array<{ slug: string; site: Occupancy }> = [
  {
    slug: 'thiopental',
    site: {
      receptor: 'gaba_a', pathway: 'anesthesia', emax: 1, hill_n: 1,
      ec50_mg_l: 8.70, source_pmid: 'PMID:10498837',
      note: 'Xenopus α1β2γ2 GABA potentiation; abstract verbatim "rac-thiopentone (35.9 ± 4.2 µM)" EC50. MW 242.34',
    },
  },
  {
    slug: 'etomidate',
    site: {
      receptor: 'gaba_a', pathway: 'anesthesia', emax: 1, hill_n: 1,
      ec50_mg_l: 2.27, source_pmid: 'PMID:39615281',
      note: 'GABA-A PAM; abstract verbatim "etomidate (EC50 = 9.29 µM)". MW 244.29',
    },
  },
  {
    slug: 'rocuronium',
    site: {
      receptor: 'nicotinic_ach', pathway: 'neuromuscular_blockade', emax: 1, hill_n: 1,
      ec50_mg_l: 0.0201, source_pmid: 'PMID:20305678',
      note: 'Innervated mouse muscle nAChR whole-cell vs 30 µM ACh; abstract verbatim "ROC: from 37.9 to 101.4 nmol/L". Used 37.9 nM. MW 529.78',
    },
  },
  {
    slug: 'atracurium',
    site: {
      receptor: 'nicotinic_ach', pathway: 'neuromuscular_blockade', emax: 1, hill_n: 1,
      ec50_mg_l: 0.0227, source_pmid: 'PMID:20305678',
      note: 'Same Liu 2010 paper; abstract verbatim "ATR: from 24.4 to 129.0 nmol/L". Used 24.4 nM (innervated). MW 929.15',
    },
  },
  {
    slug: 'vecuronium',
    site: {
      receptor: 'nicotinic_ach', pathway: 'neuromuscular_blockade', emax: 1, hill_n: 1,
      ec50_mg_l: 0.00625, source_pmid: 'PMID:20305678',
      note: 'Same Liu 2010 paper; abstract verbatim "VEC: from 11.2 to 39.2 nmol/L". Used 11.2 nM (innervated). MW 557.78',
    },
  },
  {
    slug: 'pregabalin',
    site: {
      receptor: 'cav_alpha2delta', pathway: 'antinociception', emax: 1, hill_n: 1,
      ec50_mg_l: 0.0287, source_pmid: 'PMID:16781071',
      note: 'α2δ ligand binding; abstract verbatim "Gabapentin (Ki = 120 nM), pregabalin (180 nM)". MW 159.23',
    },
  },
  {
    slug: 'digoxin',
    site: {
      receptor: 'na_k_atpase', pathway: 'positive_inotropy', emax: 1, hill_n: 1,
      ec50_mg_l: 0.319, source_pmid: 'PMID:19487957',
      note: 'Human kidney α1β1 NADH-coupled; abstract verbatim "digoxin … (IC50 = … 409 ± 171 nM …)". MW 780.94',
    },
  },
  {
    slug: 'ropivacaine',
    site: {
      receptor: 'nav', pathway: 'local_anesthesia', emax: 1, hill_n: 1,
      ec50_mg_l: 32.19, source_pmid: 'PMID:10781449',
      note: 'Rat dorsal-horn neurons, Vh -80 mV; abstract verbatim "IC(50) value of 117.3 µM". MW 274.40',
    },
  },
  {
    slug: 'ibuprofen',
    site: {
      receptor: 'cox_1', pathway: 'antiinflammatory', emax: 1, hill_n: 1,
      ec50_mg_l: 2.475, source_pmid: 'PMID:11804398',
      note: 'Human monocyte COX-1 assay; abstract verbatim "ibuprofen, 12, 80, 0.15" (COX-1 12 µM, COX-2 80 µM, ratio 0.15). MW 206.28',
    },
  },
  {
    slug: 'ibuprofen',
    site: {
      receptor: 'cox_2', pathway: 'antiinflammatory', emax: 1, hill_n: 1,
      ec50_mg_l: 16.50, source_pmid: 'PMID:11804398',
      note: 'Same paper, LPS-stimulated COX-2 assay; abstract verbatim "ibuprofen, 12, 80". 80 µM × MW 206.28',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c['receptor_occupancy'] as Occupancy[] | undefined) ?? [];
    if (existing.some(s => s.receptor === e.site.receptor && s.source_pmid === e.site.source_pmid)) {
      alreadyHas++; continue;
    }
    existing.push(e.site);
    c['receptor_occupancy'] = existing;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 4: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
