/**
 * 2026-05-06-mass-pk-batch-2.ts — Mass PK authoring batch 2.
 *
 * 6/10 verified at relaxed convention. 4 skipped (aprepitant,
 * artemisinin, azathioprine, bictegravir) — no PubMed abstract names
 * a verbatim PK value within search budget.
 *
 *   amoxicillin-clavulanate  F 0.797 Vd 9 L     PMID:32888018
 *   apremilast               F 0.73  Vd 87 L    PMID:33932093
 *   baloxavir                F 0.96  Vd 1730 L  PMID:35176206
 *   baricitinib              F 0.79  Vd 76 L    PMID:24965573
 *   betaxolol                F 0.85  Vd 360 L   PMID:2906367
 *   bicalutamide             F 1.0   Vd 79 L    PMID:21353117  (Tmax 24h → ka 0.06)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string }
interface Compound { slug: string; pk?: Partial<Record<string, RoutePk>>; refs?: string[]; [k: string]: unknown }

type Authoring = { slug: string; route: 'PO'; pk: RoutePk };

const ENTRIES: Authoring[] = [
  { slug: 'amoxicillin-clavulanate', route: 'PO', pk: { ka_hr: 1.0,  V_L: 9,    F: 0.797, source_pmid: 'PMID:32888018' } },
  { slug: 'apremilast',              route: 'PO', pk: { ka_hr: 0.92, V_L: 87,   F: 0.73,  source_pmid: 'PMID:33932093' } },
  { slug: 'baloxavir',               route: 'PO', pk: { ka_hr: 0.5,  V_L: 1730, F: 0.96,  source_pmid: 'PMID:35176206' } },
  { slug: 'baricitinib',             route: 'PO', pk: { ka_hr: 1.4,  V_L: 76,   F: 0.79,  source_pmid: 'PMID:24965573' } },
  { slug: 'betaxolol',               route: 'PO', pk: { ka_hr: 0.6,  V_L: 360,  F: 0.85,  source_pmid: 'PMID:2906367'  } },
  { slug: 'bicalutamide',            route: 'PO', pk: { ka_hr: 0.06, V_L: 79,   F: 1.0,   source_pmid: 'PMID:21353117' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = c.pk?.[e.route];
    if (existing && existing.source_pmid === e.pk.source_pmid && existing.F === e.pk.F) {
      alreadyHas++; continue;
    }
    c.pk = c.pk ?? {};
    c.pk[e.route] = e.pk;
    const refs = c.refs ?? [];
    if (e.pk.source_pmid && !refs.includes(e.pk.source_pmid)) refs.push(e.pk.source_pmid);
    c.refs = refs;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Mass-PK batch 2: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
