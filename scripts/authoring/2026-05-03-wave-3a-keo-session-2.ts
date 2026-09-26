/**
 * 2026-05-03-wave-3a-keo-session-2.ts — Wave 3a session 2.
 * 5 kₑₒ values + add alfentanil/atracurium stubs if missing.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const NEW_STUBS = [
  {
    slug: 'alfentanil',
    name: 'Alfentanil',
    aliases: ['Alfenta'],
    category: 'pharmacological',
    mechanism: 'Synthetic μ-opioid agonist — phenylpiperidine class. ~⅕ fentanyl potency but faster onset (~1 min) and shorter duration. Used for short surgical procedures + rapid analgesia. CYP3A4 substrate (DDI with strong inhibitors).',
    routes: ['IV','IM'],
    doses: { 'IV': { min: 5, max: 50, typical: 25, unit: 'mcg' } },
    half_life_hr: { 'IV': 1.5 },
    mw_g_mol: 416.52,
    pk: { 'IV': { ka_hr: 60, V_L: 60, F: 1.0, source_pmid: 'PMID:7924121' } },
    refs: [],
  },
  {
    slug: 'atracurium',
    name: 'Atracurium',
    aliases: ['Tracrium'],
    category: 'pharmacological',
    mechanism: 'Benzylisoquinolinium non-depolarizing neuromuscular blocker — competitive nicotinic ACh antagonist. Cleared by Hofmann elimination + ester hydrolysis (organ-independent), making it useful in renal/hepatic failure. Histamine release at high IV bolus.',
    routes: ['IV'],
    doses: { 'IV': { min: 0.4, max: 0.5, typical: 0.5, unit: 'mg' } },
    half_life_hr: { 'IV': 0.33 },
    mw_g_mol: 929.13,
    pk: { 'IV': { ka_hr: 60, V_L: 11, F: 1.0, source_pmid: 'PMID:11144993' } },
    refs: [],
  },
];

const KEO_UPDATES = [
  { slug: 'fentanyl',        ec: { keo_per_h: 7.38,  source_pmid: 'PMID:15701707', note: 'antinociception (rat tail-flick)' } },
  { slug: 'alfentanil',      ec: { keo_per_h: 69.3,  source_pmid: 'PMID:7924121',  note: 'EEG endpoint, t½kₑₒ 0.6 min, human' } },
  { slug: 'dexmedetomidine', ec: { keo_per_h: 4.30,  source_pmid: 'PMID:20337956', note: 'MAP endpoint, post-cardiac surgery children' } },
  { slug: 'rocuronium',      ec: { keo_per_h: 11.4,  source_pmid: 'PMID:17681967', note: 'NMB TOF-EMG endpoint, human' } },
  { slug: 'atracurium',      ec: { keo_per_h: 3.54,  source_pmid: 'PMID:11144993', note: 'NMB TOF endpoint, ICU/ARDS adults' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0, kEoUpdated = 0, alreadyHas = 0, missing = 0;

  for (const stub of NEW_STUBS) {
    if (bySlug.has(stub.slug)) continue;
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as { keo_per_h?: number; source_pmid?: string } | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { alreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    kEoUpdated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 2: added ${added} stubs, kₑₒ updated ${kEoUpdated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
