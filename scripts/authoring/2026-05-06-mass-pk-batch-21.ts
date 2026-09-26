/**
 * 2026-05-06-mass-pk-batch-21.ts — 6 authored.
 *
 *   temazepam            F 0.96 Vd 67 L   PMID:2207300
 *   tenofovir-disoproxil F 0.25 Vd 87 L   PMID:27049055
 *   terazosin            F 0.90 Vd 28 L   PMID:2872802
 *   tizanidine           F 0.40 Vd 175 L  PMID:17062304
 *   tolterodine          F 0.17 Vd 113 L  PMID:9630826
 *   trandolapril         F 0.10 Vd 18 L   PMID:7527100  (parent t½, active metabolite trandolaprilat dominates clinically)
 *
 * Already had PK: trazodone. Not in catalog: trospium.
 * Skipped: tenofovir-alafenamide, ursodeoxycholic-acid (no abstract-verbatim).
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
  { slug: 'temazepam',            pk: { ka_hr: 1.5, V_L: 67,  F: 0.96, source_pmid: 'PMID:2207300'  } },
  { slug: 'tenofovir-disoproxil', pk: { ka_hr: 0.9, V_L: 87,  F: 0.25, source_pmid: 'PMID:27049055' } },
  { slug: 'terazosin',            pk: { ka_hr: 1.2, V_L: 28,  F: 0.90, source_pmid: 'PMID:2872802'  } },
  { slug: 'tizanidine',           pk: { ka_hr: 1.7, V_L: 175, F: 0.40, source_pmid: 'PMID:17062304' } },
  { slug: 'tolterodine',          pk: { ka_hr: 1.3, V_L: 113, F: 0.17, source_pmid: 'PMID:9630826'  } },
  { slug: 'trandolapril',         pk: { ka_hr: 2.5, V_L: 18,  F: 0.10, source_pmid: 'PMID:7527100'  } },
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
  console.log(`Mass-PK batch 21: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
