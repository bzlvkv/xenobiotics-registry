/**
 * 2026-05-03-wave-3a-keo-session-3.ts — Wave 3a session 3.
 * 6 verified kₑₒ values + 3 new stubs (sufentanil, thiopental, vecuronium).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const NEW_STUBS = [
  {
    slug: 'sufentanil',
    name: 'Sufentanil',
    aliases: ['Sufenta'],
    category: 'pharmacological',
    mechanism: 'Synthetic μ-opioid agonist — phenylpiperidine class with ~10× fentanyl potency. Used in anesthesia + obstetric epidural / spinal analgesia. CYP3A4 substrate.',
    routes: ['IV','IM'],
    doses: { 'IV': { min: 0.1, max: 30, typical: 1, unit: 'mcg' } },
    half_life_hr: { 'IV': 2.5 },
    mw_g_mol: 386.55,
    pk: { 'IV': { ka_hr: 60, V_L: 120, F: 1.0, source_pmid: 'PMID:15907650' } },
    refs: [],
  },
  {
    slug: 'thiopental',
    name: 'Thiopental',
    aliases: ['Pentothal','Sodium thiopental'],
    category: 'pharmacological',
    mechanism: 'Ultra-short-acting barbiturate — GABA-A positive allosteric modulator. Once the workhorse induction anesthetic; supplanted by propofol. Still used for refractory status epilepticus + execution-protocol contexts. Significant cardiovascular depression at induction doses.',
    routes: ['IV'],
    doses: { 'IV': { min: 3, max: 5, typical: 4, unit: 'mg' } },
    half_life_hr: { 'IV': 11 },
    mw_g_mol: 242.34,
    pk: { 'IV': { ka_hr: 60, V_L: 140, F: 1.0, source_pmid: 'PMID:8563444' } },
    refs: [],
  },
  {
    slug: 'vecuronium',
    name: 'Vecuronium',
    aliases: ['Norcuron'],
    category: 'pharmacological',
    mechanism: 'Aminosteroid non-depolarizing neuromuscular blocker — competitive nicotinic ACh antagonist. Intermediate-acting (~30 min). Hepatic + biliary clearance — accumulates in liver failure.',
    routes: ['IV'],
    doses: { 'IV': { min: 0.08, max: 0.1, typical: 0.1, unit: 'mg' } },
    half_life_hr: { 'IV': 1.5 },
    mw_g_mol: 557.78,
    pk: { 'IV': { ka_hr: 60, V_L: 18, F: 1.0, source_pmid: 'PMID:29619783' } },
    refs: [],
  },
];

const KEO_UPDATES = [
  { slug: 'sufentanil',  ec: { keo_per_h: 6.93,  source_pmid: 'PMID:15907650', note: 'EEG endpoint, t½kₑₒ 6 min, adult human' } },
  { slug: 'thiopental',  ec: { keo_per_h: 34.8,  source_pmid: 'PMID:8563444',  note: 'EEG endpoint, kₑₒ 0.58/min adult human' } },
  { slug: 'vecuronium',  ec: { keo_per_h: 4.62,  source_pmid: 'PMID:29619783', note: 'NMBA TOF, adult human' } },
  { slug: 'ropivacaine', ec: { keo_per_h: 1.20,  source_pmid: 'PMID:25790027', note: 'Sensory block, femoral nerve block, t½kₑₒ 34.7 min' } },
  { slug: 'etomidate',   ec: { keo_per_h: 15.69, source_pmid: 'PMID:10397615', note: 'EEG aperiodic, rat, t½kₑₒ 2.65 min' } },
  { slug: 'clonidine',   ec: { keo_per_h: 0.99,  source_pmid: 'PMID:1623908',  note: 'MAP endpoint, oral 200 µg, t½kₑₒ 42 min' } },
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
  console.log(`\nWave 3a session 3: added ${added} stubs, kₑₒ updated ${kEoUpdated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
