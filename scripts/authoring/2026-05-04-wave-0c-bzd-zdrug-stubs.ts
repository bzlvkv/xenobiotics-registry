/**
 * 2026-05-04-wave-0c-bzd-zdrug-stubs.ts — Wave 0c stub additions.
 *
 * Adds 2 prescription Rx compounds the reverse-search Wave-3a passes
 * surfaced (kₑₒ-ready) but were not yet in the catalog. Each comes
 * with full primary-source-cited PK + kₑₒ on top.
 *
 *   - triazolam (Halcion) — short-acting BZD, sleep
 *       PK   PMID:3567010  half-life 2.6 h, Tmax 1.3 h
 *       kₑₒ  PMID:8033487  EEG-β / DSST, t½kₑₒ 9.4 min
 *   - zaleplon (Sonata)   — Z-drug, sleep
 *       PK   PMID:10211871 half-life 1.05 h, F 30.6%, Vd 1.27 L/kg
 *       kₑₒ  PMID:23436259 sedation, t½kₑₒ 1.16 min
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const NEW_STUBS = [
  {
    slug: 'triazolam',
    name: 'Triazolam',
    aliases: ['Halcion'],
    category: 'pharmacological',
    mechanism: 'Short-acting triazolobenzodiazepine — positive allosteric modulator at GABA-A BZD site (α1-preferring). Used for short-term insomnia and procedural sedation. Extensively metabolized by CYP3A4 — sensitive to CYP3A inhibitors (azoles, ritonavir, clarithromycin) which can extend the t½ markedly. Rapid onset, short duration.',
    routes: ['PO'],
    doses: { 'PO': { min: 0.125, max: 0.5, typical: 0.25, unit: 'mg' } },
    half_life_hr: { 'PO': 2.6 },
    mw_g_mol: 343.21,
    pk: { 'PO': { ka_hr: 1.5, V_L: 77, F: 0.44, source_pmid: 'PMID:3567010' } },
    effect_compartment: { keo_per_h: 4.42, source_pmid: 'PMID:8033487', note: 'EEG-β + DSST endpoint, oral; abstract verbatim "mean plasma effect site equilibration half-life was 9.4 minutes"' },
    refs: [],
  },
  {
    slug: 'zaleplon',
    name: 'Zaleplon',
    aliases: ['Sonata','Starnoc'],
    category: 'pharmacological',
    mechanism: 'Z-drug pyrazolopyrimidine — positive allosteric modulator at GABA-A BZD site, selective for α1 subunit. Used for sleep onset (very short t½ ~1 h limits middle-of-night dosing risk). Mostly metabolized by aldehyde oxidase + CYP3A4. Rapid absorption.',
    routes: ['PO'],
    doses: { 'PO': { min: 5, max: 20, typical: 10, unit: 'mg' } },
    half_life_hr: { 'PO': 1.05 },
    mw_g_mol: 305.34,
    pk: { 'PO': { ka_hr: 1.5, V_L: 89, F: 0.306, source_pmid: 'PMID:10211871' } },
    effect_compartment: { keo_per_h: 35.85, source_pmid: 'PMID:23436259', note: 'Sedation endpoint; abstract verbatim "equilibration half-life for sedation (t(1/2) k(e0)) was 1.16 (0.62, 2.17) minutes"' },
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0;
  for (const stub of NEW_STUBS) {
    if (bySlug.has(stub.slug)) continue;
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 0c stubs: added ${added}`);
}

main();
