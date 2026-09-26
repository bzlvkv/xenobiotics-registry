/**
 * 2026-05-27-wave39-atenolol-beta1-fix.ts — collapse atenolol's duplicate β1.
 *
 * atenolol carried TWO beta_1 receptor_occupancy rows (lint receptor.duplicate
 * smell; composite occupancy can't distinguish same-receptor entries):
 *   - rat brain   [3H]CGP12177, Ki 1.2 µM  (PMID:10588927, ec50 0.3196)
 *   - rat ventricle pKi 6.58 → 263 nM       (PMID:10630733, ec50 0.0701)
 * Both rat-tissue surrogates that disagree ~4.5×.
 *
 * GtoPdb now gives a clean HUMAN β1 value — pKi range 6.7–7.6 (PMID:15060759,
 * PMID:10079020, PMID:15655528); midpoint pKi 7.15 → Ki ≈ 71 nM. Replace both
 * rat rows with this single human row (quality upgrade + dedupe). Pathway
 * 'antagonist' (the registry's dominant beta_1 label). Orphaned rat PMIDs are
 * pruned from refs.
 *
 * Idempotent: if a single human beta_1 row is already present, does nothing.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }

const OLD_PMIDS = ['PMID:10588927', 'PMID:10630733'];
const NEW_ROW: ReceptorOccupancy = {
  receptor: 'beta_1',
  pathway: 'antagonist',
  emax: 1.0,
  ec50_mg_l: 0.018853,
  hill_n: 1,
  source_pmid: 'PMID:15060759',
  note: 'GtoPdb-curated human β1-adrenoceptor binding: pKi range 6.7–7.6 (PMID:15060759, PMID:10079020, PMID:15655528); midpoint pKi 7.15 → Ki ≈ 71 nM, antagonist. Replaces two prior rat-tissue surrogates (rat brain 1.2 µM PMID:10588927; rat ventricle 263 nM PMID:10630733) that disagreed ~4.5× and duplicated the beta_1 key. ec50 = 71 nM × 266.34 / 1e6.',
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const c = data.find(x => x.slug === 'atenolol');
  if (!c) throw new Error('atenolol not found');
  const b1 = (c.receptor_occupancy ?? []).filter(r => r.receptor === 'beta_1');
  if (b1.length === 1 && b1[0]!.source_pmid === NEW_ROW.source_pmid) {
    console.log('[skip] atenolol beta_1 already collapsed to the human value'); return;
  }
  c.receptor_occupancy = (c.receptor_occupancy ?? []).filter(r => r.receptor !== 'beta_1');
  c.receptor_occupancy.push(NEW_ROW);
  // Prune orphaned rat PMIDs (only ever cited by the removed beta_1 rows) and add the new ref.
  c.refs = (c.refs ?? []).filter(r => !OLD_PMIDS.includes(r));
  if (!c.refs.includes(NEW_ROW.source_pmid!)) c.refs.push(NEW_ROW.source_pmid!);

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`[fix ] atenolol: 2 rat beta_1 rows → 1 human row (Ki ≈ 71 nM, ${NEW_ROW.source_pmid}); pruned ${OLD_PMIDS.join(', ')}`);
}

main();
