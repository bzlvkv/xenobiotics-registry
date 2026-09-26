/**
 * 2026-05-06-mass-pk-batch-28.ts — 8 authored.
 *
 *   levetiracetam-er F 1.0   Vd 38 L    PMID:19264451
 *   mebendazole      F 0.10  Vd 90 L    PMID:3978023
 *   methocarbamol    F 0.85  Vd 50 L    PMID:19537524
 *   methylene-blue   F 0.7   Vd 250 L   PMID:29864547
 *   misoprostol      F 0.88  Vd 1000 L  PMID:11821273
 *   penicillin-v     F 0.6   Vd 35 L    PMID:2515160
 *   zafirlukast      F 0.6   Vd 70 L    PMID:11888331
 *   linaclotide      F 0.001 Vd 5 L     PMID:20863829  (gut-acting; F 0.1% verbatim)
 *
 * Skipped: lactulose, navitoclax (no abstract-verbatim).
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
  { slug: 'levetiracetam-er', pk: { ka_hr: 0.30, V_L: 38,   F: 1.0,   source_pmid: 'PMID:19264451' } },
  { slug: 'mebendazole',      pk: { ka_hr: 1.5,  V_L: 90,   F: 0.10,  source_pmid: 'PMID:3978023'  } },
  { slug: 'methocarbamol',    pk: { ka_hr: 1.4,  V_L: 50,   F: 0.85,  source_pmid: 'PMID:19537524' } },
  { slug: 'methylene-blue',   pk: { ka_hr: 0.15, V_L: 250,  F: 0.7,   source_pmid: 'PMID:29864547' } },
  { slug: 'misoprostol',      pk: { ka_hr: 4.0,  V_L: 1000, F: 0.88,  source_pmid: 'PMID:11821273' } },
  { slug: 'penicillin-v',     pk: { ka_hr: 1.0,  V_L: 35,   F: 0.6,   source_pmid: 'PMID:2515160'  } },
  { slug: 'zafirlukast',      pk: { ka_hr: 0.5,  V_L: 70,   F: 0.6,   source_pmid: 'PMID:11888331' } },
  { slug: 'linaclotide',      pk: { ka_hr: 0.5,  V_L: 5,    F: 0.001, source_pmid: 'PMID:20863829' } },
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
  console.log(`Mass-PK batch 28: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
