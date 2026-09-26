/**
 * 2026-05-04-wave-3b-occupancy-session-7.ts — Wave 3b session 7.
 *
 * 4 verified receptor occupancy entries on compounds whose kₑₒ landed
 * in Wave 3a sessions 11–14 this push.
 *
 *   - terazosin   Ki 2.5  nM  α1A recombinant; abstract verbatim
 *                             "(Ki value; alpha 1A:2.5 nM, alpha 1B:
 *                             2.7 nM, alpha 1C:7.1 nM)" (PMID:7536677)
 *   - dabigatran  Ki 4.5  nM  human α-thrombin reversible competitive
 *                             (PMID:17598008)
 *   - celecoxib   IC50 0.05 µM  recombinant hCOX-2 (PMID:15494548,
 *                             Talley valdecoxib paper, celecoxib
 *                             comparator)
 *   - atenolol    Ki 1.2  µM  rat brain β-adrenergic [3H]CGP12177
 *                             displacement (PMID:10588927). Rat data;
 *                             only abstract-verbatim atenolol nM Ki
 *                             available — flagged in note like
 *                             bisoprolol.
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
    slug: 'terazosin',
    site: {
      receptor: 'alpha_1', pathway: 'bph_lower_uts', emax: 1, hill_n: 1,
      ec50_mg_l: 0.000968, source_pmid: 'PMID:7536677',
      note: 'Recombinant α1 subtypes; abstract verbatim "Ki value; alpha 1A:2.5 nM" — α1A used. MW 387.43',
    },
  },
  {
    slug: 'dabigatran',
    site: {
      receptor: 'thrombin', pathway: 'anticoagulation', emax: 1, hill_n: 1,
      ec50_mg_l: 0.002825, source_pmid: 'PMID:17598008',
      note: 'Direct hα-thrombin reversible competitive; abstract verbatim "dabigatran selectively and reversibly inhibited human thrombin (Ki: 4.5 nM)". MW 627.73',
    },
  },
  {
    slug: 'celecoxib',
    site: {
      receptor: 'cox_2', pathway: 'antiinflammatory', emax: 1, hill_n: 1,
      ec50_mg_l: 0.01907, source_pmid: 'PMID:15494548',
      note: 'Talley 2004 valdecoxib paper, celecoxib comparator; abstract verbatim "IC values of 0.05 microM for celecoxib" recombinant hCOX-2. MW 381.37',
    },
  },
  {
    slug: 'atenolol',
    site: {
      receptor: 'beta_1', pathway: 'beta1_blockade', emax: 1, hill_n: 1,
      ec50_mg_l: 0.3196, source_pmid: 'PMID:10588927',
      note: 'Rat brain β-adrenergic [3H]CGP12177 displacement; abstract verbatim "K(i) of … 1.2 microM … for atenolol". Rat-brain data, not human cloned β1 — only abstract-verbatim nM Ki available for atenolol. MW 266.34',
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
  console.log(`\nWave 3b session 7: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
