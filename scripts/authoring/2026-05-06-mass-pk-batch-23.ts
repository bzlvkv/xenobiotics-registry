/**
 * 2026-05-06-mass-pk-batch-23.ts — 6 authored.
 *
 *   ivabradine  F 0.40 Vd 100 L  PMID:16988208
 *   lamivudine  F 0.86 Vd 91 L   PMID:17962426
 *   nebivolol   F 0.12 Vd 700 L  PMID:26914703
 *   oseltamivir F 0.80 Vd 23 L   PMID:36810140
 *   prasugrel   F 0.79 Vd 100 L  PMID:25697420
 *   ramipril    F 0.55 Vd 90 L   PMID:14755115
 *
 * Skipped: methimazole, methyldopa, minocycline, nadolol (no abstract-verbatim).
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
  { slug: 'ivabradine',  pk: { ka_hr: 1.4, V_L: 100, F: 0.40, source_pmid: 'PMID:16988208' } },
  { slug: 'lamivudine',  pk: { ka_hr: 1.5, V_L: 91,  F: 0.86, source_pmid: 'PMID:17962426' } },
  { slug: 'nebivolol',   pk: { ka_hr: 0.7, V_L: 700, F: 0.12, source_pmid: 'PMID:26914703' } },
  { slug: 'oseltamivir', pk: { ka_hr: 1.4, V_L: 23,  F: 0.80, source_pmid: 'PMID:36810140' } },
  { slug: 'prasugrel',   pk: { ka_hr: 4.0, V_L: 100, F: 0.79, source_pmid: 'PMID:25697420' } },
  { slug: 'ramipril',    pk: { ka_hr: 1.5, V_L: 90,  F: 0.55, source_pmid: 'PMID:14755115' } },
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
  console.log(`Mass-PK batch 23: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
