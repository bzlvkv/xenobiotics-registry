/**
 * 2026-05-04-wave-3a-keo-session-8.ts — Wave 3a session 8.
 *
 * 2 verified kₑₒ values from a 15-compound AED / antiemetic /
 * antiplatelet / cardiovascular pass. Hit rate ~13%.
 *
 *   - alprazolam   kₑₒ 8.66 /h  EEG-β endpoint, IV; abstract verbatim
 *                              "effect site equilibration half-life
 *                              of 4.8 minutes" (PMID:15831776)
 *   - lamotrigine  kₑₒ 3.75 /h  MES anticonvulsant endpoint, rat;
 *                              abstract verbatim "k(e0) = 3.75 h(-1)"
 *                              (PMID:16313279)
 *
 * Skipped: triazolam, midazolam (pop-PK only), carbamazepine,
 * valproic-acid, levetiracetam, phenobarbital, ondansetron-iv,
 * nicardipine, esmolol, aspirin, clopidogrel — abstracts paraphrase
 * the PD model or report only Emax/IC50, no verbatim kₑₒ.
 *
 * (Triazolam is a known full-text value: Greenblatt 2005 BJCP reports
 *  t½kₑₒ 9.4 min in body text. Defer to a full-text pass.)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'alprazolam',  ec: { keo_per_h: 8.66, source_pmid: 'PMID:15831776', note: 'EEG-β endpoint, IV; abstract verbatim t½kₑₒ 4.8 min' } },
  { slug: 'lamotrigine', ec: { keo_per_h: 3.75, source_pmid: 'PMID:16313279', note: 'MES anticonvulsant endpoint, rat; abstract verbatim "k(e0) = 3.75 h(-1)"' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let updated = 0, alreadyHas = 0, missing = 0;

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as { keo_per_h?: number; source_pmid?: string } | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { alreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 8: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
