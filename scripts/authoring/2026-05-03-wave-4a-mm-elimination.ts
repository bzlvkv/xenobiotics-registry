/**
 * 2026-05-03-wave-4a-mm-elimination.ts — Wave 4a (MM saturable elim).
 *
 * Authors mm_vmax_per_hr + mm_km_mg_per_l on pk[route] for 3 compounds
 * with abstract-verbatim Vmax/Km values:
 *   - phenytoin (PMID:27174459) Vmax 0.53 mg/L/h, Km 4.03 mg/L
 *   - alcohol (ethanol) (PMID:11003200) Vmax 136 mg/L/h, Km 96 mg/L
 *   - theophylline (PMID:11554438) Vmax 0.31 mg/L/h, Km 2.4 mg/L (3-MX
 *     + 1-MU combined demethylation, primary saturable pathway)
 *
 * Skipped: salicylate (qualitative only in abstract), paroxetine
 * (CYP2D6 saturation confirmed but no Vmax/Km numbers in abstract).
 *
 * Solver effect: when both mm_vmax_per_hr + mm_km_mg_per_l are set
 * for a route, the integrator switches from first-order Bateman to
 * the MM ODE dC/dt = -Vmax·C/(Km + C). Existing ke_hr / half_life
 * fields are ignored on that route.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type RoutePk = {
  ka_hr?: number; ke_hr?: number; V_L?: number; F?: number;
  alpha_hr?: number; beta_hr?: number; k21_hr?: number;
  mm_vmax_per_hr?: number; mm_km_mg_per_l?: number;
  source_pmid?: string;
};

const MM_UPDATES: Array<{ slug: string; route: string; vmax: number; km: number; source_pmid: string }> = [
  { slug: 'phenytoin',    route: 'PO', vmax: 0.53, km: 4.03, source_pmid: 'PMID:27174459' },
  { slug: 'alcohol',      route: 'PO', vmax: 136,  km: 96,   source_pmid: 'PMID:11003200' },
  { slug: 'theophylline', route: 'PO', vmax: 0.31, km: 2.4,  source_pmid: 'PMID:11554438' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let updated = 0, alreadyHas = 0, missing = 0;

  for (const u of MM_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const pk = (c['pk'] as Record<string, RoutePk> | undefined) ?? {};
    const routePk = pk[u.route] ?? {};
    if (routePk.mm_vmax_per_hr != null && routePk.mm_km_mg_per_l != null) {
      alreadyHas++;
      continue;
    }
    pk[u.route] = {
      ...routePk,
      mm_vmax_per_hr: u.vmax,
      mm_km_mg_per_l: u.km,
      // source_pmid stays from prior PK authoring; the MM citation
      // can also live in a notes field or alongside if both are
      // needed. For this batch, prefer the MM-specific PMID since
      // it now anchors the elimination pathway the solver actually uses.
      source_pmid: u.source_pmid,
    };
    c['pk'] = pk;
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 4a MM elimination: updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
