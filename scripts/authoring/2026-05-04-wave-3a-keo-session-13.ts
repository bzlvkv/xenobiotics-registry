/**
 * 2026-05-04-wave-3a-keo-session-13.ts — Wave 3a session 13.
 *
 * 1 verified kₑₒ from a 4th reverse-search pass (broader queries
 * including indirect-response, biophase, peripheral block).
 *
 *   - irbesartan  kₑₒ 0.65 /h  300 mg PO healthy volunteers, SBP/DBP
 *                              endpoints; abstract verbatim "K(eo)
 *                              values were 0.62 ± 0.09 and 0.68 ±
 *                              0.07 h⁻¹" (PMID:17315536). Mean of
 *                              the two BP-endpoint values.
 *
 * Skipped this round:
 *   - magnesium-sulfate kₑₒ 0.76 /h (PMID:12403646) — IV preeclampsia
 *     SBP endpoint; magnesium-sulfate isn't in the v8 catalog
 *     (magnesium-citrate is, but it's the oral form, different
 *     pharmacokinetics).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'irbesartan', ec: { keo_per_h: 0.65, source_pmid: 'PMID:17315536', note: 'SBP/DBP endpoint, 300 mg PO; abstract verbatim "K(eo) values were 0.62 ± 0.09 and 0.68 ± 0.07 h⁻¹" (mean used)' } },
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
  console.log(`\nWave 3a session 13: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
