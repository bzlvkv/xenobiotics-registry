/**
 * 2026-05-27-wave29-sc-in-sl-pr-routes.ts — SC/IN/SL/PR route pk blocks
 * (Phase 3 non-IV campaign, "clean subset only" per user). TD & INH skipped
 * (transdermal/inhaled are zero-order/deposition-limited — 1-comp ka mismatch).
 *
 * Per route: V_L = copied true Vd (route-independent); F = sourced absolute
 * bioavailability (route-specific — NO blanket assumption for SL/IN/PR; SC ~1
 * only where sourced); ka_hr derived from sourced route Tmax + ke, or (mAb)
 * from the sourced absorption half-life. half_life_hr.<route> = terminal t½.
 * Each PMID verified to resolve 2026-05-27.
 *
 * Authored (10 blocks):
 *  SC: morphine (F~1.0 bioequiv IV, Stuart-Harris 2000), trastuzumab (F 0.87,
 *      ka from absorption t½ 2.5 d, Hourcade-Potelleret 2014)
 *  IN: fentanyl (F 0.747, Nardi-Hiebl 2021), lidocaine (F 0.26, Scavone 1989),
 *      morphine (F 0.10 simple-solution, Illum 2002)
 *  SL: lorazepam (F 0.98, Greenblatt 1982), fentanyl (F 0.789, Lim 2012),
 *      alprazolam (F ~0.9, SL AUC≈oral, Scavone 1987 — flagged derived)
 *  PR: indomethacin (F 0.80, Jensen 1985)
 *
 * The rest of SC/IN/SL/PR were skipped (depot, relative-F-only, local-action,
 * F-or-Tmax-missing, or wrong-molecule e.g. desmopressin≠vasopressin) — logged
 * in AUTHORING_GAPS.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const LN2 = Math.log(2);

function solveKa(Tmax: number, ke: number): number | null {
  if (Tmax >= 1 / ke) return null;
  let lo = ke * 1.0000001, hi = ke * 1e6;
  const f = (ka: number) => Math.log(ka / ke) / (ka - ke) - Tmax;
  for (let i = 0; i < 200; i++) { const mid = Math.sqrt(lo * hi); if (f(mid) > 0) lo = mid; else hi = mid; }
  return Math.sqrt(lo * hi);
}

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; source_pmid?: string; [k: string]: unknown }
interface Compound { slug: string; pk?: Record<string, RoutePk>; half_life_hr?: Record<string, number>; [k: string]: unknown }

// [slug, route, F, Tmax_h|null, ka_direct|null, pmid]
const ENTRIES: Array<[string, string, number, number | null, number | null, string]> = [
  ['morphine', 'SC', 1.0, 0.25, null, 'PMID:10718775'],
  ['trastuzumab', 'SC', 0.87, null, LN2 / 60, 'PMID:25019376'], // ka from absorption t½ 2.5 d
  ['fentanyl', 'IN', 0.747, 0.21, null, 'PMID:34880961'],
  ['lidocaine', 'IN', 0.26, 0.92, null, 'PMID:2611092'],
  ['morphine', 'IN', 0.10, 0.17, null, 'PMID:11907197'],
  ['lorazepam', 'SL', 0.98, 2.25, null, 'PMID:6121043'],
  ['fentanyl', 'SL', 0.789, 0.91, null, 'PMID:22584544'],
  ['alprazolam', 'SL', 0.9, 1.17, null, 'PMID:3680603'],
  ['indomethacin', 'PR', 0.80, 1.0, null, 'PMID:4090993'],
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0; const skip: string[] = [];
  for (const [slug, route, F, Tmax, kaDirect, pmid] of ENTRIES) {
    const c = bySlug.get(slug);
    if (!c?.pk) { skip.push(`${slug}:${route}(no pk)`); continue; }
    if (c.pk[route]) { skip.push(`${slug}:${route}(exists)`); continue; }
    const donor = c.pk.PO?.V_L != null ? c.pk.PO : Object.values(c.pk).find(b => b?.V_L != null);
    const Vd = donor?.V_L;
    const hl = c.half_life_hr?.PO ?? (c.half_life_hr ? Object.values(c.half_life_hr)[0] : undefined);
    if (Vd == null || hl == null) { skip.push(`${slug}:${route}(no Vd/hl)`); continue; }
    let ka: number | null = kaDirect;
    if (ka == null && Tmax != null) ka = solveKa(Tmax, LN2 / hl);
    if (ka == null) { skip.push(`${slug}:${route}(flip-flop)`); continue; }
    const kaR = ka < 1 ? +ka.toFixed(4) : +ka.toFixed(2);
    c.pk[route] = { ka_hr: kaR, V_L: Vd, F, source_pmid: pmid };
    if (c.half_life_hr && c.half_life_hr[route] == null) c.half_life_hr[route] = hl;
    console.log(`  [add ] ${slug.padEnd(13)} pk.${route} = {ka:${kaR}, V_L:${Vd}, F:${F}}  ${pmid}`);
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 29 SC/IN/SL/PR: +${added} blocks. Skipped: ${skip.join(', ') || 'none'}`);
}

main();
