/**
 * 2026-05-06-mass-pk-vitamins-minerals.ts — 14 authored.
 *
 * Vitamins (9):
 *   methylfolate        F 0.95 Vd 35 L  PMID:22909145
 *   p5p                 F 1.0  Vd 60 L  PMID:21079545
 *   vitamin-k2-mk7      F 0.8  Vd 15 L  PMID:23140417
 *   lutein              F 0.4  Vd 35 L  PMID:7661123
 *   zeaxanthin          F 0.3  Vd 30 L  PMID:15137922
 *   astaxanthin         F 0.3  Vd 80 L  PMID:15556071  (Cmax 0.28 mg/L, t½ 52h verbatim)
 *   lycopene            F 0.25 Vd 60 L  PMID:15159319
 *   gamma-tocopherol    F 0.55 Vd 35 L  PMID:27493840
 *   tocopheryl-acetate  F 0.5  Vd 35 L  PMID:15623833
 *
 * Minerals (5):
 *   boron               F 1.0  Vd 40 L   PMID:10050928  (t½ 21h verbatim)
 *   calcium-carbonate   F 0.15 Vd 25 L   PMID:22254052
 *   zinc-citrate        F 0.61 Vd 200 L  PMID:24259556
 *   zinc-gluconate      F 0.61 Vd 200 L  PMID:24259556
 *   zinc-acetate        F 0.5  Vd 200 L  PMID:8577018
 *
 * Skipped: vitamin-b12-methylcobalamin, chromium, selenium-methionine,
 * sodium-bicarbonate, magnesium-orotate, iodine-potassium-iodide.
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
  { slug: 'methylfolate',       pk: { ka_hr: 1.0,  V_L: 35,  F: 0.95, source_pmid: 'PMID:22909145' } },
  { slug: 'p5p',                pk: { ka_hr: 0.5,  V_L: 60,  F: 1.0,  source_pmid: 'PMID:21079545' } },
  { slug: 'vitamin-k2-mk7',     pk: { ka_hr: 0.3,  V_L: 15,  F: 0.8,  source_pmid: 'PMID:23140417' } },
  { slug: 'lutein',             pk: { ka_hr: 0.15, V_L: 35,  F: 0.4,  source_pmid: 'PMID:7661123'  } },
  { slug: 'zeaxanthin',         pk: { ka_hr: 0.1,  V_L: 30,  F: 0.3,  source_pmid: 'PMID:15137922' } },
  { slug: 'astaxanthin',        pk: { ka_hr: 0.15, V_L: 80,  F: 0.3,  source_pmid: 'PMID:15556071' } },
  { slug: 'lycopene',           pk: { ka_hr: 0.1,  V_L: 60,  F: 0.25, source_pmid: 'PMID:15159319' } },
  { slug: 'gamma-tocopherol',   pk: { ka_hr: 0.4,  V_L: 35,  F: 0.55, source_pmid: 'PMID:27493840' } },
  { slug: 'tocopheryl-acetate', pk: { ka_hr: 0.25, V_L: 35,  F: 0.5,  source_pmid: 'PMID:15623833' } },
  { slug: 'boron',              pk: { ka_hr: 1.5,  V_L: 40,  F: 1.0,  source_pmid: 'PMID:10050928' } },
  { slug: 'calcium-carbonate',  pk: { ka_hr: 0.4,  V_L: 25,  F: 0.15, source_pmid: 'PMID:22254052' } },
  { slug: 'zinc-citrate',       pk: { ka_hr: 0.6,  V_L: 200, F: 0.61, source_pmid: 'PMID:24259556' } },
  { slug: 'zinc-gluconate',     pk: { ka_hr: 0.6,  V_L: 200, F: 0.61, source_pmid: 'PMID:24259556' } },
  { slug: 'zinc-acetate',       pk: { ka_hr: 0.7,  V_L: 200, F: 0.5,  source_pmid: 'PMID:8577018'  } },
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
  console.log(`Mass-PK vitamins+minerals: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
