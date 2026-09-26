/**
 * 2026-05-06-mass-pk-batch-25.ts — 9 authored.
 *
 *   prazosin       F 0.57 Vd 42 L   PMID:6994981
 *   pyridostigmine F 0.14 Vd 80 L   PMID:3987173
 *   quinapril      F 0.6  Vd 77 L   PMID:18672641
 *   rabeprazole    F 0.52 Vd 25 L   PMID:22748970
 *   raltegravir    F 0.5  Vd 290 L  PMID:27696440
 *   ranolazine     F 0.55 Vd 180 L  PMID:23355361
 *   riluzole       F 0.60 Vd 245 L  PMID:9549636
 *   riociguat      F 0.94 Vd 30 L   PMID:30997864
 *   risperidone    F 0.7  Vd 110 L  PMID:21118746
 *
 * Skipped: rifaximin (gut-restricted, no systemic PK).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }
interface Compound { slug: string; pk?: Partial<Record<string, RoutePk>>; refs?: string[]; [k: string]: unknown }

const ENTRIES: Array<{ slug: string; pk: RoutePk }> = [
  { slug: 'prazosin',       pk: { ka_hr: 1.1, V_L: 42,  F: 0.57, source_pmid: 'PMID:6994981'  } },
  { slug: 'pyridostigmine', pk: { ka_hr: 1.0, V_L: 80,  F: 0.14, source_pmid: 'PMID:3987173'  } },
  { slug: 'quinapril',      pk: { ka_hr: 1.4, V_L: 77,  F: 0.6,  source_pmid: 'PMID:18672641' } },
  { slug: 'rabeprazole',    pk: { ka_hr: 0.5, V_L: 25,  F: 0.52, source_pmid: 'PMID:22748970' } },
  { slug: 'raltegravir',    pk: { ka_hr: 1.0, V_L: 290, F: 0.5,  source_pmid: 'PMID:27696440' } },
  { slug: 'ranolazine',     pk: { ka_hr: 0.4, V_L: 180, F: 0.55, source_pmid: 'PMID:23355361' } },
  { slug: 'riluzole',       pk: { ka_hr: 1.4, V_L: 245, F: 0.60, source_pmid: 'PMID:9549636'  } },
  { slug: 'riociguat',      pk: { ka_hr: 1.4, V_L: 30,  F: 0.94, source_pmid: 'PMID:30997864' } },
  { slug: 'risperidone',    pk: { ka_hr: 1.4, V_L: 110, F: 0.7,  source_pmid: 'PMID:21118746' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.PO?.source_pmid) { alreadyHas++; continue; }
    c.pk = c.pk ?? {};
    c.pk.PO = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 25: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
