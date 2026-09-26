/**
 * 2026-05-04-wave-3a-keo-session-7.ts — Wave 3a session 7.
 *
 * 3 verified kₑₒ values for the volatile anesthetics from Rehberg 1999
 * (Anesthesiology 91:397, PMID:10443602): EEG-slowing PD model in
 * humans/sheep. Abstract verbatim:
 *   "Ke0 value was significantly higher for desflurane (0.61 ± 0.11
 *    min⁻¹)" and "common value of 0.29 ± 0.04 min⁻¹" (sevo + iso).
 *
 *   - desflurane   kₑₒ 36.6 /h (0.61/min × 60)
 *   - sevoflurane  kₑₒ 17.4 /h (0.29/min × 60)
 *   - isoflurane   kₑₒ 17.4 /h (shared common value)
 *
 * Deferred this session (occupancy collected, kₑₒ not):
 *   - lidocaine, bupivacaine, mepivacaine, procaine (Nav block — Ki
 *     verified verbatim in PMID:9768788 Bräu 1998)
 *   - cetirizine, levocetirizine, desloratadine, loratadine,
 *     diphenhydramine, chlorpheniramine (hH1 — Ki verified verbatim
 *     in 5 different abstracts)
 *   No abstract carries verbatim kₑₒ for any of these — wheal/flare
 *   and antiarrhythmic PK/PD studies report kₑₒ inside full-text
 *   tables only. Documented in AUTHORING_GAPS.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'desflurane',  ec: { keo_per_h: 36.6, source_pmid: 'PMID:10443602', note: 'EEG-slowing endpoint; abstract verbatim "Ke0 … desflurane (0.61 ± 0.11 min⁻¹)" → 36.6 /h' } },
  { slug: 'sevoflurane', ec: { keo_per_h: 17.4, source_pmid: 'PMID:10443602', note: 'EEG-slowing endpoint; abstract verbatim "common value of 0.29 ± 0.04 min⁻¹" (sevo + iso)' } },
  { slug: 'isoflurane',  ec: { keo_per_h: 17.4, source_pmid: 'PMID:10443602', note: 'EEG-slowing endpoint; shared common 0.29 /min with sevoflurane in same paper' } },
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
  console.log(`\nWave 3a session 7: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
