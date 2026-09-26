/**
 * 2026-05-03-wave-3a-keo-session-4.ts — Wave 3a session 4.
 * 1 verified kₑₒ (digoxin) after a 14-compound cardiovascular pass.
 * Most cardiac PD/PK papers report kₑₒ in tables, not abstracts —
 * abstract-verbatim hit rate was ~7%.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  {
    slug: 'digoxin',
    ec: {
      keo_per_h: 0.182,
      source_pmid: 'PMID:12634981',
      note: 'Hornestam 2003 Eur J Clin Pharmacol — abstract verbatim "half-life for the digoxin distribution to the effect compartment was approximately 3.8 h"; HR endpoint in acute AF (DAAF). kₑₒ = ln(2)/3.8 h',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let kEoUpdated = 0, alreadyHas = 0, missing = 0;

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as { keo_per_h?: number; source_pmid?: string } | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { alreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    kEoUpdated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 4: kₑₒ updated ${kEoUpdated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
