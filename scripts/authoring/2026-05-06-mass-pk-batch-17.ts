/**
 * 2026-05-06-mass-pk-batch-17.ts — 3 authored.
 *
 *   perampanel    F 1.0  Vd 77 L  PMID:28535410
 *   phenobarbital F 0.95 Vd 42 L  PMID:7068937
 *   pioglitazone  F 0.83 Vd 17 L  PMID:15900286
 *
 * Already had PK: pantoprazole. Not in catalog: paliperidone, pazopanib, pemoline, pirfenidone.
 * Skipped: phenelzine (no abstract-verbatim).
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
  { slug: 'perampanel',    pk: { ka_hr: 1.0, V_L: 77, F: 1.0,  source_pmid: 'PMID:28535410' } },
  { slug: 'phenobarbital', pk: { ka_hr: 1.0, V_L: 42, F: 0.95, source_pmid: 'PMID:7068937'  } },
  { slug: 'pioglitazone',  pk: { ka_hr: 1.5, V_L: 17, F: 0.83, source_pmid: 'PMID:15900286' } },
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
  console.log(`Mass-PK batch 17: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
