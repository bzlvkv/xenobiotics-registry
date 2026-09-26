/**
 * 2026-05-06-mass-pk-batch-30-non-po.ts — non-PO PK authoring.
 *
 *   esmolol      IV  V_L 238 L  F 1.0   PMID:2563962  (Flaherty 1989, t½ 7.2 min, CL 171 mL/min/kg verbatim)
 *   betamethasone PO V_L 67 L   F 0.72  PMID:8148226  (Kubota 1994, Cmax 5 ng/mL, AUC 75.4 ng·h/mL, t½ 8.1h verbatim)
 *                + adds half_life_hr.PO = 8.1 (was missing)
 *
 * Skipped: 5-fluorouracil IV (no clinical cohort verbatim), dolutegravir
 * alt-route (PBPK only). Liraglutide SC already had PK from earlier work.
 *
 * Note: IV pk omits ka_hr (instant bolus, not first-order absorption).
 * Solver should treat absent ka as instantaneous availability.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }
interface Compound { slug: string; pk?: Partial<Record<string, RoutePk>>; refs?: string[]; half_life_hr?: Record<string, number>; [k: string]: unknown }

type Authoring = { slug: string; route: string; pk: RoutePk; halfLife?: number };

const ENTRIES: Authoring[] = [
  { slug: 'esmolol',       route: 'IV', pk: { V_L: 238, F: 1.0,  source_pmid: 'PMID:2563962' } },
  { slug: 'betamethasone', route: 'PO', pk: { ka_hr: 1.5, V_L: 67, F: 0.72, source_pmid: 'PMID:8148226' }, halfLife: 8.1 },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.[e.route]?.source_pmid) { alreadyHas++; continue; }
    if (e.halfLife != null) {
      c.half_life_hr = c.half_life_hr ?? {};
      if (!c.half_life_hr[e.route]) c.half_life_hr[e.route] = e.halfLife;
    }
    c.pk = c.pk ?? {};
    c.pk[e.route] = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 30 (non-PO): added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
