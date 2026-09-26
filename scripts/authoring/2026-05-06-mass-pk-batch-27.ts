/**
 * 2026-05-06-mass-pk-batch-27.ts — 8 authored.
 *
 *   dimenhydrinate F 0.6  Vd 280 L  PMID:12851661  (diphenhydramine measured)
 *   labetalol      F 0.18 Vd 660 L  PMID:7203731   (Kanto 1981)
 *   lubiprostone   F 0.1  Vd 7000 L PMID:36626291  (M3 metabolite measured)
 *   naltrexone     F 0.05 Vd 1350 L PMID:6114837   (Wall 1981)
 *   nirmatrelvir   F 0.5  Vd 105 L  PMID:42090083  (boosted by ritonavir)
 *   nitazoxanide   F 0.3  Vd 50 L   PMID:22533565  (tizoxanide measured)
 *   pentoxifylline F 0.2  Vd 170 L  PMID:10478991
 *   zonisamide     F 0.95 Vd 100 L  PMID:27007995  (CL 23.25 L/h verbatim)
 *
 * Skipped: dicyclomine, icosapent-ethyl (no abstract-verbatim).
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
  { slug: 'dimenhydrinate', pk: { ka_hr: 0.7, V_L: 280,  F: 0.6,  source_pmid: 'PMID:12851661' } },
  { slug: 'labetalol',      pk: { ka_hr: 1.5, V_L: 660,  F: 0.18, source_pmid: 'PMID:7203731'  } },
  { slug: 'lubiprostone',   pk: { ka_hr: 1.0, V_L: 7000, F: 0.1,  source_pmid: 'PMID:36626291' } },
  { slug: 'naltrexone',     pk: { ka_hr: 1.4, V_L: 1350, F: 0.05, source_pmid: 'PMID:6114837'  } },
  { slug: 'nirmatrelvir',   pk: { ka_hr: 0.6, V_L: 105,  F: 0.5,  source_pmid: 'PMID:42090083' } },
  { slug: 'nitazoxanide',   pk: { ka_hr: 0.9, V_L: 50,   F: 0.3,  source_pmid: 'PMID:22533565' } },
  { slug: 'pentoxifylline', pk: { ka_hr: 0.5, V_L: 170,  F: 0.2,  source_pmid: 'PMID:10478991' } },
  { slug: 'zonisamide',     pk: { ka_hr: 0.5, V_L: 100,  F: 0.95, source_pmid: 'PMID:27007995' } },
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
  console.log(`Mass-PK batch 27: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
