/**
 * 2026-05-04-wave-3a-keo-session-16.ts — Wave 3a session 16.
 *
 * 3 verified kₑₒ from a final compound-by-compound reverse-search
 * pass across ~50 prescription targets across stimulants, AEDs,
 * antipsychotics, antidepressants, sleep, migraine, cardiac, ACEi,
 * diuretics, COPD, GI, endocrine, diabetes, and antiplatelets.
 * Hit rate ~6%.
 *
 *   - amiodarone  kₑₒ 0.000332 /h  Pollak & Shafer 2004; abstract
 *                                  verbatim "effect compartment …
 *                                  equilibration half-time of 87
 *                                  days" (PMID:15060512). Endpoint:
 *                                  ALT elevation (hepatic toxicity),
 *                                  reflects tissue accumulation —
 *                                  antiarrhythmic kₑₒ is faster.
 *   - tramadol    kₑₒ 0.389 /h    Anderson 2018 Paediatr Anaesth;
 *                                  abstract verbatim "t1/2 keo,TRAM
 *                                  1.78 hour" pediatric post-T&A
 *                                  analgesia, PO (PMID:30117229).
 *   - oxycodone   kₑₒ 5.78 /h     Villesen 2006 sheep IV; abstract
 *                                  verbatim "brain:blood equilibration
 *                                  … half-life of 7.2 min". Animal
 *                                  brain:blood surrogate — flagged.
 *
 * Negatives confirmed across ~50 compounds (see session script
 * trail). Reverse search has reached its yield ceiling without
 * relaxing the abstract-only verification rule.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'amiodarone', ec: { keo_per_h: 0.000332, source_pmid: 'PMID:15060512', note: 'Hepatic ALT endpoint; abstract verbatim "effect compartment … equilibration half-time of 87 days". Reflects tissue accumulation, not acute antiarrhythmic effect' } },
  { slug: 'tramadol',   ec: { keo_per_h: 0.389,    source_pmid: 'PMID:30117229', note: 'Pediatric post-T&A analgesia, PO; abstract verbatim "t1/2 keo,TRAM 1.78 hour"' } },
  { slug: 'oxycodone',  ec: { keo_per_h: 5.78,     source_pmid: 'PMID:16729270', note: 'Sheep IV oxycodone, brain:blood model; abstract verbatim "brain:blood equilibration … half-life of 7.2 min". Animal surrogate' } },
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
  console.log(`\nWave 3a session 16: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
