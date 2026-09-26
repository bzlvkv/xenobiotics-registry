/**
 * 2026-05-04-wave-3a-keo-session-12.ts — Wave 3a session 12.
 *
 * 1 verified kₑₒ from a 3rd reverse-search pass.
 *
 *   - atenolol  kₑₒ 2.52 /h  WKY rat, isoprenaline-induced tachycardia
 *                            reduction; abstract verbatim "0.042 ±
 *                            0.012 min⁻¹ (k(eo))" (PMID:17420778)
 *
 * Rat data; HR endpoint of β-blockade is class-typical so transfer
 * to human is reasonable. Flagged in note.
 *
 * Skipped this round:
 *  - atropine kₑₒ — PMID:10217331 reports "equilibration rate constant
 *    (k(e0)) estimates were ... 11.0 (±5.28) l/h for atropine" — but
 *    "l/h" units are an effect-compartment CLEARANCE not the per-hour
 *    rate constant. Without a Vd_eo I can't convert. Defer until a
 *    PK/PD paper reports kₑₒ in proper inverse-time units.
 *  - piritramide, tiagabine — not in v8 registry (DE-only opioid +
 *    anticonvulsant).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'atenolol', ec: { keo_per_h: 2.52, source_pmid: 'PMID:17420778', note: 'WKY rat, isoprenaline-induced tachycardia; abstract verbatim "0.042 ± 0.012 min⁻¹ (k(eo))". Class-typical β-blocker HR-endpoint kₑₒ' } },
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
  console.log(`\nWave 3a session 12: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
