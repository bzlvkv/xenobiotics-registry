/**
 * 2026-05-04-wave-3b-occupancy-session-6.ts — Wave 3b session 6.
 *
 * 2 verified receptor occupancy entries on compounds whose kₑₒ
 * landed in Wave 3a session 8.
 *
 *   - alprazolam  Kd 4.6 nM  rat brain BZD receptors, [3H]alprazolam
 *                            saturation binding (PMID:1964224)
 *   - lamotrigine IC50 185 µM Nav binding-site 2 (PMID:10027853 —
 *                            comparator data in PNU-151774E paper).
 *                            NOTE: synaptosomal binding-site IC50 is
 *                            higher than functional voltage-clamp
 *                            IC50 (~10–30 µM use-dependent). The
 *                            value is what the abstract literally
 *                            states; therapeutic plasma 1–4 mg/L
 *                            implies modest on-target occupancy
 *                            under this curve.
 *
 * Atropine muscarinic deferred — agent verified IC50 1.6 nM at M1
 * (PMID:2432979), but atropine has no authored kₑₒ yet. Logged in
 * AUTHORING_GAPS for next kₑₒ pass.
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
    slug: 'alprazolam',
    site: {
      receptor: 'gaba_a_bzd', pathway: 'sedation', emax: 1, hill_n: 1,
      ec50_mg_l: 0.00142, source_pmid: 'PMID:1964224',
      note: '[3H]alprazolam saturation binding rat brain BZD; abstract verbatim "Kd was 4.6 nM and the Bmax was 2.6 pmol/mg protein". MW 308.76',
    },
  },
  {
    slug: 'lamotrigine',
    site: {
      receptor: 'nav', pathway: 'seizure_control', emax: 1, hill_n: 1,
      ec50_mg_l: 47.38, source_pmid: 'PMID:10027853',
      note: 'PNU-151774E comparator paper; abstract verbatim "lamotrigine (IC50, 8 microM versus 47 and 185 microM)" — 185 µM at sodium-channel binding-site 2. MW 256.09. Synaptosomal-binding IC50; voltage-clamp values are lower',
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
  console.log(`\nWave 3b session 6: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
