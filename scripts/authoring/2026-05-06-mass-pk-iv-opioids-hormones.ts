/**
 * 2026-05-06-mass-pk-iv-opioids-hormones.ts — 12 route entries.
 *
 *   cefepime       IV  V 16 L  F 1.0   PMID:1416818  (Barbhaiya 1992)
 *   esketamine     IN  V 752 L F 0.54  PMID:33128208 (Perez-Ruixo popPK)
 *   naloxone       IN  V 200 L F 0.47  PMID:31556537 (Tylleskar 2019)
 *   nalbuphine     IV  V 282 L F 1.0   PMID:3691617  (Lo 1987)
 *   nalbuphine     IM  V 282 L F 0.82  PMID:3691617 (same paper, +half_life_hr.IM=2.4)
 *   nalbuphine     SC  V 282 L F 0.78  PMID:3691617 (same paper, +half_life_hr.SC=2.4)
 *   butorphanol    IV  V 791 L F 1.0   PMID:8157043
 *   butorphanol    IN  V 791 L F 0.70  PMID:8157043 (same paper, +half_life_hr.IN=6)
 *   flumazenil     IV  V 56 L  F 1.0   PMID:2842128  (Klotz 1988)
 *   sumatriptan    SC  V 170 L F 0.96  PMID:7768259  (Lacey 1995; PO already authored from earlier)
 *   hydrocortisone IV  V 30 L  F 1.0   PMID:29795974
 *   hydrocortisone PO  V 30 L  F 1.0   PMID:29795974 (same paper, completely absorbed)
 *   mifepristone   PO  V 103 L F 0.40  PMID:11858883 (Sarkar 2002)
 *
 * Skipped: tobramycin, piperacillin-tazobactam, etomidate (no
 * abstract-verbatim adult healthy PK in search budget).
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
  { slug: 'cefepime',       route: 'IV', pk: { V_L: 16,   F: 1.0,  source_pmid: 'PMID:1416818'  } },
  { slug: 'esketamine',     route: 'IN', pk: { ka_hr: 4.0, V_L: 752, F: 0.54, source_pmid: 'PMID:33128208' } },
  { slug: 'naloxone',       route: 'IN', pk: { ka_hr: 2.6, V_L: 200, F: 0.47, source_pmid: 'PMID:31556537' }, halfLife: 1 },
  { slug: 'nalbuphine',     route: 'IV', pk: { V_L: 282,  F: 1.0,  source_pmid: 'PMID:3691617'  } },
  { slug: 'nalbuphine',     route: 'IM', pk: { ka_hr: 1.0, V_L: 282, F: 0.82, source_pmid: 'PMID:3691617' }, halfLife: 2.4 },
  { slug: 'nalbuphine',     route: 'SC', pk: { ka_hr: 1.0, V_L: 282, F: 0.78, source_pmid: 'PMID:3691617' }, halfLife: 2.4 },
  { slug: 'butorphanol',    route: 'IV', pk: { V_L: 791,  F: 1.0,  source_pmid: 'PMID:8157043'  } },
  { slug: 'butorphanol',    route: 'IN', pk: { ka_hr: 3.0, V_L: 791, F: 0.70, source_pmid: 'PMID:8157043' }, halfLife: 6 },
  { slug: 'flumazenil',     route: 'IV', pk: { V_L: 56,   F: 1.0,  source_pmid: 'PMID:2842128'  } },
  { slug: 'sumatriptan',    route: 'SC', pk: { ka_hr: 3.0, V_L: 170, F: 0.96, source_pmid: 'PMID:7768259' }, halfLife: 2 },
  { slug: 'hydrocortisone', route: 'PO', pk: { ka_hr: 3.5, V_L: 30,  F: 1.0,  source_pmid: 'PMID:29795974' } },
  { slug: 'hydrocortisone', route: 'IV', pk: { V_L: 30,   F: 1.0,  source_pmid: 'PMID:29795974' }, halfLife: 1.5 },
  { slug: 'mifepristone',   route: 'PO', pk: { ka_hr: 0.7, V_L: 103, F: 0.40, source_pmid: 'PMID:11858883' } },
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
  console.log(`Round 2: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
