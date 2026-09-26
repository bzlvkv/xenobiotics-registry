/**
 * 2026-05-04-wave-3a-keo-session-11.ts — Wave 3a session 11.
 *
 * 4 verified kₑₒ from a 2nd reverse-search pass.
 *
 *   - hydromorphone  kₑₒ 0.924 /h  limit-temperature analgesia in
 *                                  healthy volunteers; abstract
 *                                  verbatim "hydromorphone (0.75 h)"
 *                                  t½kₑₒ (PMID:41656122)
 *   - dofetilide     kₑₒ 3.78  /h  QT prolongation in conscious
 *                                  telemetered Beagles; abstract
 *                                  verbatim "equilibrium half-life
 *                                  of 11 ± 8 min" (PMID:16140023)
 *   - citalopram     kₑₒ 0.495 /h  QT in 52 overdose patients;
 *                                  abstract verbatim "half-life of
 *                                  effect-delay = 1.4 h" (PMID:16433872)
 *   - telmisartan    kₑₒ 29.4  /h  antihypertensive effect, lowest of
 *                                  3 doses; abstract verbatim "K(eo)
 *                                  were 29.4, 33.8, and 28.7 h(-1)"
 *                                  (PMID:17439731)
 *
 * Reverse search also surfaced 4 abstract-verbatim kₑₒ for compounds
 * not yet in the catalog: oliceridine, remimazolam, alfaxalone,
 * sodium-nitroprusside. Flagged for a Wave-0c stub pass.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'hydromorphone', ec: { keo_per_h: 0.924, source_pmid: 'PMID:41656122', note: 'Limit-temperature analgesia volunteers; abstract verbatim t½kₑₒ 0.75 h' } },
  { slug: 'dofetilide',    ec: { keo_per_h: 3.78,  source_pmid: 'PMID:16140023', note: 'QT in conscious Beagles; abstract verbatim "equilibrium half-life of 11 ± 8 min"' } },
  { slug: 'citalopram',    ec: { keo_per_h: 0.495, source_pmid: 'PMID:16433872', note: 'QT in 52 overdose patients; abstract verbatim "half-life of effect-delay = 1.4 h"' } },
  { slug: 'telmisartan',   ec: { keo_per_h: 29.4,  source_pmid: 'PMID:17439731', note: 'Antihypertensive; abstract verbatim "K(eo) were 29.4, 33.8, and 28.7 h(-1)" (lowest dose used)' } },
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
  console.log(`\nWave 3a session 11: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
