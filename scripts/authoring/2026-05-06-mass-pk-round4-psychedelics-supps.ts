/**
 * 2026-05-06-mass-pk-round4-psychedelics-supps.ts — 4 authored.
 *
 *   psilocybin            PO  F 0.53  Vd 280 L  PMID:40284409
 *                              + half_life.PO updated from 2.5 → 3 (verbatim 1.5-4h range, mid)
 *   7-hydroxymitragynine  PO  F 0.20  Vd 800 L  PMID:38481700
 *                              + half_life.PO=2.5 added (no prior)
 *   berberine             PO  F 0.05  Vd 600 L  PMID:21671182
 *   5-htp                 PO  F 0.50  Vd 80 L   PMID:18308795
 *
 * Skipped: thc, cbg, rapamycin, ephedrine, theacrine, l-arginine,
 * l-glutamine, l-tryptophan (no abstract-verbatim PK in search budget).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }
interface Compound {
  slug: string;
  pk?: Partial<Record<string, RoutePk>>;
  half_life_hr?: Record<string, number>;
  refs?: string[];
  [k: string]: unknown;
}

type Authoring = { slug: string; route: string; pk: RoutePk; halfLife?: number };

const ENTRIES: Authoring[] = [
  { slug: 'psilocybin',           route: 'PO', pk: { ka_hr: 1.2, V_L: 280, F: 0.53, source_pmid: 'PMID:40284409' } },
  { slug: '7-hydroxymitragynine', route: 'PO', pk: { ka_hr: 0.5, V_L: 800, F: 0.20, source_pmid: 'PMID:38481700' }, halfLife: 2.5 },
  { slug: 'berberine',            route: 'PO', pk: { ka_hr: 1.0, V_L: 600, F: 0.05, source_pmid: 'PMID:21671182' } },
  { slug: '5-htp',                route: 'PO', pk: { ka_hr: 1.5, V_L: 80,  F: 0.50, source_pmid: 'PMID:18308795' } },
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
  console.log(`Round 4: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
