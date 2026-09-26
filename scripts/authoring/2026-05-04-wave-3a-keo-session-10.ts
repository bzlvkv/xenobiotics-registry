/**
 * 2026-05-04-wave-3a-keo-session-10.ts — Wave 3a session 10.
 *
 * 1 verified kₑₒ from a reverse-search pass (search PubMed for
 * abstracts containing "ke0" verbatim, then identify the compound).
 *
 *   - levodopa  kₑₒ 1.37 /h  UPDRS III motor / dyskinesia endpoint
 *                            (PMID:26936272). Abstract verbatim:
 *                            "similar KE0 values of 1.37 1/h
 *                            [1.01-1.77]"
 *
 * Reverse search also surfaced 8 other compounds with abstract-
 * verbatim kₑₒ but they aren't in the v8 catalog: triazolam,
 * zaleplon, clevidipine, tolfenamic-acid, adinazolam, cebranopadol,
 * morphine-6-glucuronide, ciprofol. Of these, triazolam + zaleplon
 * are prescription Rx and worth adding as stubs in a future Wave-0c
 * pass; the rest are research/metabolite/non-US compounds and stay
 * out of scope.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'levodopa', ec: { keo_per_h: 1.37, source_pmid: 'PMID:26936272', note: 'UPDRS III motor / dyskinesia endpoint; abstract verbatim "similar KE0 values of 1.37 1/h"' } },
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
  console.log(`\nWave 3a session 10: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
