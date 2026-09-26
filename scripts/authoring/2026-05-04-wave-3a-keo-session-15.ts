/**
 * 2026-05-04-wave-3a-keo-session-15.ts — Wave 3a session 15.
 *
 * 2 verified kₑₒ from an endpoint-terminology reverse-search pass.
 *
 *   - quinine    kₑₒ 3.32 /h  oral 5-15 mg/kg, audiometry threshold-shift
 *                            (hearing impairment) endpoint in n=6;
 *                            abstract verbatim "mean value of ke0 was
 *                            3.32 ± 5.93 h-1 s.d." (PMID:2049249).
 *                            Wide variability flagged.
 *   - atropine   kₑₒ 11.0 /h  IV, parasympatholytic HRV endpoint;
 *                            abstract verbatim "ke0 11.0 ± 5.28"
 *                            (NLM units render as "l/h" but this is
 *                            a typesetting artifact — 11.0 h⁻¹ →
 *                            t½kₑₒ 3.8 min, which matches the
 *                            published atropine literature for HR/HRV
 *                            kₑₒ ~4 min) (PMID:10217331).
 *
 * Atropine kₑₒ unblocks the deferred atropine M1 occupancy entry
 * (Ki 1.6 nM, PMID:2432979) — landed in the next Wave 3b session.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'quinine',  ec: { keo_per_h: 3.32, source_pmid: 'PMID:2049249',  note: 'Audiometry threshold-shift endpoint, oral 5–15 mg/kg, n=6; abstract verbatim "mean value of ke0 was 3.32 ± 5.93 h-1". Wide SD' } },
  { slug: 'atropine', ec: { keo_per_h: 11.0, source_pmid: 'PMID:10217331', note: 'IV, parasympatholytic HRV endpoint; abstract verbatim "ke0 11.0 ± 5.28" (units render as "l/h" but consistent with t½kₑₒ ~4 min in atropine HR literature)' } },
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
  console.log(`\nWave 3a session 15: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
