/**
 * 2026-05-05-wave-3b-occupancy-session-10.ts — Wave 3b session 10.
 *
 * 4 verified receptor occupancy entries on cardiovascular compounds whose
 * kₑₒ landed in earlier Wave-3a sessions (atenolol, dofetilide) or in
 * Wave 3a session 17 (quinidine). Lint requires effect_compartment.keo_per_h
 * before occupancy can be authored — must run 2026-05-05-wave-3a-keo-session-17.ts
 * first if quinidine kₑₒ isn't yet committed.
 *
 *   - atenolol     β1 adrenergic   Ki 263 nM   PMID:10630733 (rat ventricular
 *                                              [3H]CGP-12177; pKi 6.58 verbatim)
 *   - dofetilide   hERG            IC50 35 nM  PMID:8921803  (Xenopus macro patches;
 *                                              "IC50 of 35 nmol/L" verbatim)
 *   - quinidine    hERG            IC50 0.41µM PMID:12086981 (HEK293 stable line, 37°C;
 *                                              "IC(50) of 0.41+/-0.04 microM" verbatim)
 *   - quinidine    Nav1.5          IC50 1.4 µM PMID:9413244  (human atrial myocytes,
 *                                              native Nav1.5; "average IC50 of … 1.4
 *                                              +/- 0.3 microM" verbatim)
 *
 * Caveats: atenolol value is rat ventricular β1, not cloned human β1 —
 * the cleaner human Ki (Baker/Hoffmann tables) lives outside abstracts so
 * is not abstract-verbatim. Rat ventricular β1 is the canonical surrogate;
 * 263 nM matches textbook values.
 *
 * Hill_n defaulted to 1 (none reported in abstracts).
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
    slug: 'atenolol',
    site: {
      receptor: 'beta1_adrenergic', pathway: 'sympathetic_chronotropy',
      emax: 1, ec50_mg_l: 0.0701, hill_n: 1,
      source_pmid: 'PMID:10630733',
      note: 'Rat ventricular [3H]CGP-12177 binding (Yeh 2000); abstract verbatim "atenolol (pKi, 6.58 for beta1 …)". pKi 6.58 → Ki 263 nM. ec50_mg_l = 263 nM × 266.34 g/mol / 1e6. Rat-tissue surrogate; cleaner cloned-human β1 lives in tables.',
    },
  },
  {
    slug: 'dofetilide',
    site: {
      receptor: 'herg', pathway: 'ikr_block_qt',
      emax: 1, ec50_mg_l: 0.01545, hill_n: 1,
      source_pmid: 'PMID:8921803',
      note: 'HERG cRNA in Xenopus oocyte excised macro patches (Kiehn 1996); abstract verbatim "HERG currents were blocked by the class III antiarrhythmic drug dofetilide, with an IC50 of 35 nmol/L". ec50_mg_l = 35 nM × 441.56 g/mol / 1e6.',
    },
  },
  {
    slug: 'quinidine',
    site: {
      receptor: 'herg', pathway: 'ikr_block_qt',
      emax: 1, ec50_mg_l: 0.1330, hill_n: 1,
      source_pmid: 'PMID:12086981',
      note: 'HEK293 stably expressing HERG, whole-cell voltage clamp 37°C (Paul 2002); abstract verbatim "QUIN inhibited I(HERG) with an IC(50) of 0.41+/-0.04 microM". ec50_mg_l = 410 nM × 324.42 g/mol / 1e6.',
    },
  },
  {
    slug: 'quinidine',
    site: {
      receptor: 'nav1_5', pathway: 'ina_block_class_ia',
      emax: 1, ec50_mg_l: 0.4542, hill_n: 1,
      source_pmid: 'PMID:9413244',
      note: 'Human atrial myocytes, native Nav1.5 (Chi 1997); abstract verbatim "JKL1073A and quinidine suppressed INa with an average IC50 of 2.4 +/- 0.6 microM and 1.4 +/- 0.3 microM, respectively". Native human cardiac, not cloned hH1. ec50_mg_l = 1400 nM × 324.42 g/mol / 1e6.',
    },
  },
];

interface Compound {
  slug: string;
  receptor_occupancy?: Occupancy[];
  refs?: string[];
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c.receptor_occupancy ?? []) as Occupancy[];
    if (existing.some(s => s.receptor === e.site.receptor && s.source_pmid === e.site.source_pmid)) {
      alreadyHas++; continue;
    }
    existing.push(e.site);
    c.receptor_occupancy = existing;
    const refs = (c.refs ?? []) as string[];
    if (!refs.includes(e.site.source_pmid)) refs.push(e.site.source_pmid);
    c.refs = refs;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 10: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
