/**
 * 2026-05-03-wave-1a-pk-session-6-fix.ts — patch session 6:
 *   - Add hydroxychloroquine + prednisolone as new compound stubs (they
 *     were missing — only prednisone and chloroquine-like cousins exist)
 *   - Override 5 review PMIDs from session 6's kept-v7 set with the
 *     primary papers our agents found (methotrexate, acetaminophen,
 *     aspirin, methylphenidate, vortioxetine).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const NEW_STUBS = [
  {
    slug: 'hydroxychloroquine',
    name: 'Hydroxychloroquine',
    aliases: ['Plaquenil', 'HCQ'],
    category: 'pharmacological',
    mechanism: 'Aminoquinoline antimalarial — accumulates in lysosomes raising endosomal pH. Disrupts antigen processing + Toll-like receptor signaling. Used long-term for SLE + rheumatoid arthritis. Retinopathy risk requires baseline + annual ophthalmologic monitoring.',
    routes: ['PO'],
    doses: { 'PO': { min: 200, max: 600, typical: 400, unit: 'mg' } },
    half_life_hr: { 'PO': 960 },
    mw_g_mol: 335.87,
    pk: { 'PO': { ka_hr: 0.7, V_L: 50000, F: 0.74, source_pmid: 'PMID:2757893' } },
    refs: [],
  },
  {
    slug: 'prednisolone',
    name: 'Prednisolone',
    aliases: ['Active form of prednisone'],
    category: 'hormone',
    mechanism: 'Active glucocorticoid — prednisone is reduced to prednisolone by hepatic 11β-HSD1. Direct prednisolone use bypasses the activation step (preferred in liver dysfunction). ~4× cortisol potency. Same indications + adverse effect profile as prednisone.',
    routes: ['PO', 'IV'],
    doses: { 'PO': { min: 5, max: 60, typical: 20, unit: 'mg' } },
    half_life_hr: { 'PO': 3 },
    mw_g_mol: 360.45,
    pk: { 'PO': { ka_hr: 1.5, V_L: 50, F: 0.85, source_pmid: 'PMID:2285202' } },
    refs: [],
  },
];

const OVERRIDE_TARGETS = [
  // slug, new pk
  { slug: 'methotrexate',    half_life_hr: 8,    pk: { ka_hr: 1.5, V_L: 50, F: 0.7, source_pmid: 'PMID:9218084' } },
  { slug: 'acetaminophen',   half_life_hr: 2.5,  pk: { ka_hr: 2.5, V_L: 60, F: 0.88, source_pmid: 'PMID:30758744' } },
  { slug: 'aspirin',         half_life_hr: 0.3,  pk: { ka_hr: 4.0, V_L: 11, F: 0.7, source_pmid: 'PMID:30758744' } },
  { slug: 'methylphenidate', half_life_hr: 3,    pk: { ka_hr: 1.5, V_L: 100, F: 0.3, source_pmid: 'PMID:25274428' } },
  { slug: 'vortioxetine',    half_life_hr: 57,   pk: { ka_hr: 0.5, V_L: 2600, F: 0.75, source_pmid: 'PMID:22448783' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0, overridden = 0;

  for (const stub of NEW_STUBS) {
    if (bySlug.has(stub.slug)) continue;
    data.push(stub as unknown as Record<string, unknown>);
    bySlug.set(stub.slug, stub as unknown as Record<string, unknown>);
    added++;
  }

  for (const t of OVERRIDE_TARGETS) {
    const c = bySlug.get(t.slug);
    if (!c) continue;
    const hl = (c['half_life_hr'] as Record<string, number>) ?? {};
    hl['PO'] = t.half_life_hr;
    c['half_life_hr'] = hl;
    const pk = (c['pk'] as Record<string, unknown>) ?? {};
    pk['PO'] = t.pk;
    c['pk'] = pk;
    overridden++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nFix: added ${added} new stubs, overrode ${overridden} review PMIDs`);
}

main();
