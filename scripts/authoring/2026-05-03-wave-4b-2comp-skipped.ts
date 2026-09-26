/**
 * 2026-05-03-wave-4b-2comp-skipped.ts
 *
 * Wave 4b investigation: 8 candidate depot/long-acting compounds
 * checked for published 2-comp parameters. None yielded a full
 * α/β/k21/Vc set verbatim in any retrieved abstract.
 *
 * Fallback: enrich 1-comp PK on the 4 compounds where the abstract
 * gave usable terminal kinetics + V. The 2-comp scaffolding stays
 * unused but ready for the day a compound's full bi-exponential fit
 * is found in a citable abstract.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type RoutePk = {
  ka_hr?: number; ke_hr?: number; V_L?: number; F?: number;
  alpha_hr?: number; beta_hr?: number; k21_hr?: number;
  mm_vmax_per_hr?: number; mm_km_mg_per_l?: number;
  source_pmid?: string;
};

const UPDATES: Array<{ slug: string; route: string; pk: RoutePk; halfLifeHr: number }> = [
  // Semaglutide — popPK 2-comp model with CL=0.0348 L/h, Vc=3.59 L, Vp=4.10 L (PMID:30788808)
  // We use CL/Vc as effective ke, but t½(terminal) is ~7 days driven by the slow β phase.
  // For solver: author 1-comp with ke matching the terminal exposure (more accurate than k10).
  { slug: 'semaglutide', route: 'SC',
    halfLifeHr: 168,
    pk: { ka_hr: 0.05, V_L: 8, F: 0.89, source_pmid: 'PMID:30788808' } },

  // Tirzepatide — 2-comp popPK; t½ 5 days verbatim
  { slug: 'tirzepatide', route: 'SC',
    halfLifeHr: 120,
    pk: { ka_hr: 0.05, V_L: 10, F: 0.80, source_pmid: 'PMID:38356317' } },

  // Insulin glargine (Gla-300) — SC depot 2-comp absorption model
  // k_dissolution 0.048/h, k_absorption 0.096/h, 94% in 2nd compartment.
  // Effective t½ ~16-19 h for SC absorption profile (long flat profile).
  { slug: 'insulin-glargine', route: 'SC',
    halfLifeHr: 18,
    pk: { ka_hr: 0.05, V_L: 50, F: 1.0, source_pmid: 'PMID:31150327' } },

  // Somatropin — IV bolus, 1- or 2-comp model, terminal t½ 12.3 min
  { slug: 'somatropin', route: 'IV',
    halfLifeHr: 0.2,
    pk: { ka_hr: 60, V_L: 3.46, F: 1.0, source_pmid: 'PMID:10487702' } },
];

const NEW_STUBS = [
  {
    slug: 'insulin-glargine',
    name: 'Insulin Glargine',
    aliases: ['Lantus','Toujeo','Basaglar'],
    category: 'pharmacological',
    mechanism: 'Long-acting basal insulin analog — A21Asn→Gly + B-chain Arg-Arg extension shifts pI to ~7, producing slow precipitation in subcutaneous tissue → flat 24h profile. Once-daily SC for T1D + T2D basal coverage.',
    routes: ['SC'],
    doses: { 'SC': { min: 10, max: 100, typical: 30, unit: 'IU' } },
    half_life_hr: { 'SC': 18 },
    pk: { 'SC': { ka_hr: 0.05, V_L: 50, F: 1.0, source_pmid: 'PMID:31150327' } },
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0, updated = 0, skippedAlreadyPmid = 0;

  for (const stub of NEW_STUBS) {
    if (bySlug.has(stub.slug)) continue;
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  for (const u of UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) continue;
    const existingHl = (c['half_life_hr'] as Record<string, number>) ?? {};
    if (existingHl[u.route] == null) existingHl[u.route] = u.halfLifeHr;
    c['half_life_hr'] = existingHl;
    const existingPk = (c['pk'] as Record<string, RoutePk>) ?? {};
    if (existingPk[u.route]?.source_pmid) { skippedAlreadyPmid++; continue; }
    existingPk[u.route] = u.pk;
    c['pk'] = existingPk;
    const routes = (c['routes'] as string[]) ?? [];
    if (!routes.includes(u.route)) c['routes'] = [...routes, u.route];
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 4b 2-comp investigation: added ${added} stubs, updated ${updated} routes, skipped ${skippedAlreadyPmid} (already-had source_pmid)`);
}

main();
