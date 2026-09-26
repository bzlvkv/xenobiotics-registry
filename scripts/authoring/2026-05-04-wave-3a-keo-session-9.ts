/**
 * 2026-05-04-wave-3a-keo-session-9.ts — Wave 3a session 9.
 *
 * 3 verified kₑₒ values for NMBAs / NMBA reversal compounds. Hit
 * rate ~30% on the requested 10-compound list.
 *
 *   - succinylcholine  kₑₒ 3.48  /h  TOF endpoint, propofol anesthesia
 *                                    (PMID:12411790, abstract verbatim
 *                                    "k(eo) was 0.058 ± 0.026 min⁻¹")
 *   - cisatracurium    kₑₒ 3.78  /h  TOF endpoint, control group
 *                                    (PMID:23698546)
 *   - glycopyrrolate   kₑₒ 0.978 /h  HR/HF-CCV endpoint, t½kₑₒ 42.5 min
 *                                    (PMID:11417448)
 *
 * Skipped: mivacurium (rat only), pancuronium (Stanski-era, full-text
 * only), neostigmine, pyridostigmine, sugammadex, physostigmine,
 * edrophonium — no abstract-verbatim kₑₒ.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'succinylcholine', ec: { keo_per_h: 3.48,  source_pmid: 'PMID:12411790', note: 'TOF endpoint, propofol anesthesia; abstract verbatim "k(eo) was 0.058 ± 0.026 min⁻¹"' } },
  { slug: 'cisatracurium',   ec: { keo_per_h: 3.78,  source_pmid: 'PMID:23698546', note: 'TOF endpoint, ANH control; abstract verbatim "0.063 ± 0.008 min⁻¹"' } },
  { slug: 'glycopyrrolate',  ec: { keo_per_h: 0.978, source_pmid: 'PMID:11417448', note: 'Anticholinergic HR/HF-CCV endpoint; abstract verbatim "t1/2 ke0, 42.5 ± 7.7 min"' } },
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
  console.log(`\nWave 3a session 9: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
