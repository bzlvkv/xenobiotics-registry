/**
 * 2026-05-06-mass-pk-parenterals.ts — 11 compounds across 14 route authorings.
 *
 *   vancomycin       IV  CL 6.4 L/h, t½ 6.6 h verbatim    PMID:3606073
 *   gentamicin       IV  V 0.20 L/kg, CL 0.075 L/kg/h     PMID:8361865
 *   ceftriaxone      IV  V 8.5 L, t½ 8.1 h verbatim       PMID:3985603
 *   ceftriaxone      IM  Cmax 131 µg/mL Tmax 1.4 h        PMID:3985603 (same paper)
 *   meropenem        IV  V 20.4 L, CL 16.6 L/h, t½ 0.8h   PMID:2055812
 *   propofol         IV  Vss 2.8 L/kg, CL 2.5 L/min       PMID:9661573
 *   ketamine         IV  t½ 120 min, V 3 L/kg             PMID:12516077
 *   ketamine         IN  F 0.45                           PMID:12516077 (same paper)
 *   dexmedetomidine  IN  Tmax 38 min, F 0.65              PMID:21318594  (also adds IN to routes[])
 *   midazolam        IV  t½ 2.3 h, Vss 50.2 L, CL 19.4 L/h PMID:6138080
 *   midazolam        PO  F 0.31-0.72                      PMID:6138080 (same paper)
 *   midazolam        IN  Tmax 11 min, F 0.75              PMID:27780297
 *   cbd              PO  t½ 1.4-10.9 h, F~0.06            PMID:30534073
 *   daridorexant     PO  Tmax 1h, t½ 8h verbatim          PMID:39118245
 *   lemborexant      PO  Tmax 1-3h, t½ 17-19h verbatim    PMID:32468649
 *   zopiclone        PO  F 0.80, t½ 3.5-6.5 h             PMID:8787948
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
  routes?: string[];
  [k: string]: unknown;
}

type Authoring = { slug: string; route: string; pk: RoutePk; halfLife?: number; addRoute?: boolean };

const ENTRIES: Authoring[] = [
  { slug: 'vancomycin',      route: 'IV', pk: { V_L: 60,   F: 1.0,  source_pmid: 'PMID:3606073'  } },
  { slug: 'gentamicin',      route: 'IV', pk: { V_L: 14,   F: 1.0,  source_pmid: 'PMID:8361865'  } },
  { slug: 'ceftriaxone',     route: 'IV', pk: { V_L: 8.5,  F: 1.0,  source_pmid: 'PMID:3985603'  } },
  { slug: 'ceftriaxone',     route: 'IM', pk: { ka_hr: 1.5, V_L: 8.5, F: 1.0, source_pmid: 'PMID:3985603'  }, halfLife: 8.1 },
  { slug: 'meropenem',       route: 'IV', pk: { V_L: 20.4, F: 1.0,  source_pmid: 'PMID:2055812'  } },
  { slug: 'propofol',        route: 'IV', pk: { V_L: 196,  F: 1.0,  source_pmid: 'PMID:9661573'  } },
  { slug: 'ketamine',        route: 'IV', pk: { V_L: 200,  F: 1.0,  source_pmid: 'PMID:12516077' } },
  { slug: 'ketamine',        route: 'IN', pk: { ka_hr: 6,   V_L: 200, F: 0.45, source_pmid: 'PMID:12516077' }, halfLife: 2.5 },
  { slug: 'dexmedetomidine', route: 'IN', pk: { ka_hr: 3,   V_L: 90,  F: 0.65, source_pmid: 'PMID:21318594' }, halfLife: 2, addRoute: true },
  { slug: 'midazolam',       route: 'IV', pk: { V_L: 50.2, F: 1.0,  source_pmid: 'PMID:6138080'  } },
  { slug: 'midazolam',       route: 'PO', pk: { ka_hr: 1.4, V_L: 114, F: 0.44, source_pmid: 'PMID:6138080'  }, halfLife: 2.3 },
  { slug: 'midazolam',       route: 'IN', pk: { ka_hr: 9,   V_L: 50,  F: 0.75, source_pmid: 'PMID:27780297' }, halfLife: 2.3 },
  { slug: 'cbd',             route: 'PO', pk: { ka_hr: 0.5, V_L: 1300, F: 0.06, source_pmid: 'PMID:30534073' } },
  { slug: 'daridorexant',    route: 'PO', pk: { ka_hr: 3.0, V_L: 31,  F: 0.62, source_pmid: 'PMID:39118245' } },
  { slug: 'lemborexant',     route: 'PO', pk: { ka_hr: 1.0, V_L: 4400,F: 0.5,  source_pmid: 'PMID:32468649' } },
  { slug: 'zopiclone',       route: 'PO', pk: { ka_hr: 1.4, V_L: 100, F: 0.80, source_pmid: 'PMID:8787948'  } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0, alreadyHas = 0, missing = 0;
  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    if (c.pk?.[e.route]?.source_pmid) { alreadyHas++; continue; }
    if (e.addRoute && !(c.routes ?? []).includes(e.route)) {
      c.routes = [...(c.routes ?? []), e.route];
    }
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
  console.log(`Mass-PK parenterals: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
