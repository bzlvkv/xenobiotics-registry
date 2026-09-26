/**
 * 2026-05-03-wave-3a-keo-session-1.ts — Wave 3a first kₑₒ session.
 * 5 verified PK/PD effect-compartment values for the freshly-PK'd
 * compounds. Skipped: midazolam, fentanyl, alfentanil, dexmedetomidine,
 * propranolol (verbatim kₑₒ not in any retrieved abstract).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type EffectCompartment = { keo_per_h: number; source_pmid?: string; note?: string };

const KEO_UPDATES: Array<{ slug: string; ec: EffectCompartment }> = [
  { slug: 'morphine',     ec: { keo_per_h: 2.58, source_pmid: 'PMID:18467078', note: 'EEG endpoint, rat (Groenendaal 2008)' } },
  { slug: 'ketamine',     ec: { keo_per_h: 14.28, source_pmid: 'PMID:39546215', note: 'ANI / analgesia endpoint, human IV bolus' } },
  { slug: 'remifentanil', ec: { keo_per_h: 28.8, source_pmid: 'PMID:15653707', note: 'EEG theta endpoint, dog' } },
  { slug: 'lorazepam',    ec: { keo_per_h: 4.73, source_pmid: 'PMID:10966246', note: 'EEG 13-30 Hz; t½kₑₒ 8.8 min' } },
  { slug: 'propofol',     ec: { keo_per_h: 6.12, source_pmid: 'PMID:30669968', note: 'BIS endpoint, adolescent humans' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let updated = 0, alreadyHas = 0, missing = 0, addedRemifentanil = 0;

  // Add remifentanil if missing (anesthetics batch may have skipped)
  if (!bySlug.has('remifentanil')) {
    data.push({
      slug: 'remifentanil',
      name: 'Remifentanil',
      aliases: ['Ultiva'],
      category: 'pharmacological',
      mechanism: 'Ultra-short-acting synthetic μ-opioid agonist — esterase-cleared (not CYP) giving ~3-4 min context-sensitive half-time even after long infusions. IV-only continuous infusion for surgical anesthesia. Rapid offset means no opioid-tolerance build-up across surgery.',
      routes: ['IV'],
      doses: { 'IV': { min: 0.05, max: 2, typical: 0.25, unit: 'mcg' } },
      half_life_hr: { 'IV': 0.07 },
      mw_g_mol: 376.45,
      pk: { 'IV': { ka_hr: 60, V_L: 30, F: 1.0, source_pmid: 'PMID:15653707' } },
      refs: [],
    });
    bySlug.set('remifentanil', data[data.length - 1]!);
    addedRemifentanil++;
  }

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as EffectCompartment | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { alreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 1: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}, added remifentanil ${addedRemifentanil}`);
}

main();
