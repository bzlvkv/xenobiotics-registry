/**
 * 2026-05-27-wave30-td-depot-inh.ts — transdermal patches, LAI depots, and
 * systemic inhaled routes, using the new zero-order absorption model (wave 27
 * solver feature). Closes the deferred non-IV gaps that the 1-comp first-order
 * model couldn't represent.
 *
 * TD / DEPOT → zero-order block { zo_dur_hr, lag_hr?, V_L, F }:
 *   zo_dur_hr = release/wear window; lag_hr = onset/release lag; F = systemic
 *   bioavailability (sourced, else 1.0 for transdermal/parenteral that bypass
 *   first-pass — flagged); V_L copied (route-independent). half_life_hr[route]
 *   = the route's ELIMINATION t½ that drives both the rise-to-plateau and the
 *   post-removal/post-release decline:
 *     - patches: the route-APPARENT t½ (skin reservoir → tail slower than
 *       molecular) where the literature reports one;
 *     - depots: the MOLECULAR t½ (once the depot is exhausted, decline is
 *       molecular — per Heres 2014 for olanzapine).
 *
 * INH → fast first-order block { ka_hr (from sourced Tmax + ke), V_L, F }:
 *   inhaled absorption is fast (not zero-order); the limit is deposition F.
 *
 * fentanyl TD is UPGRADED from the old slow-first-order approximation
 * (ka_hr 0.05) to the physically-correct zero-order patch block.
 *
 * Each PMID verified 2026-05-27. Local/topical "TD" (ibuprofen, diclofenac,
 * steroids, antifungals, lidocaine, magnesium, dhea, cbd-TD, etc.) and local
 * "INH" (budesonide, nac, glutathione, racemic epinephrine) are NOT systemic-
 * delivery routes → left unauthored (logged). Depots with FDA-label-only PK
 * (risperidone Consta, naltrexone Vivitrol, leuprolide) or species-only data
 * (octreotide LAR — rabbit) deferred for lack of a PMID-backed human profile.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');
const LN2 = Math.log(2);

function solveKa(Tmax: number, ke: number): number {
  let lo = ke * 1.0000001, hi = ke * 1e6;
  const f = (ka: number) => Math.log(ka / ke) / (ka - ke) - Tmax;
  for (let i = 0; i < 200; i++) { const mid = Math.sqrt(lo * hi); if (f(mid) > 0) lo = mid; else hi = mid; }
  return Math.sqrt(lo * hi);
}

interface RoutePk { ka_hr?: number; V_L?: number; F?: number; zo_dur_hr?: number; lag_hr?: number; source_pmid?: string; [k: string]: unknown }
interface Compound { slug: string; pk?: Record<string, RoutePk>; half_life_hr?: Record<string, number>; [k: string]: unknown }

// Zero-order (TD patches + LAI depots): [slug, route, zo_dur_hr, lag_hr, F, thalf_hr, pmid, overwrite?]
const ZERO: Array<[string, string, number, number, number, number, string, boolean?]> = [
  // Transdermal patches
  ['buprenorphine', 'TD', 168, 17, 0.15, 20, 'PMID:30051169'],
  ['clonidine', 'TD', 168, 48, 0.60, 12, 'PMID:2565958'],
  ['nicotine', 'TD', 24, 0, 0.76, 4.5, 'PMID:33354734'],
  ['selegiline', 'TD', 24, 0, 0.73, 1.5, 'PMID:17715422'],
  ['rivastigmine', 'TD', 24, 1, 1.0, 3.4, 'PMID:19920911'],
  ['estradiol', 'TD', 168, 0, 1.0, 14, 'PMID:9553686'],
  ['oxybutynin', 'TD', 96, 0, 1.0, 7.5, 'PMID:12934778'],
  ['granisetron', 'TD', 168, 0, 1.0, 35.9, 'PMID:21188092'],
  ['fentanyl', 'TD', 72, 12, 0.63, 21.9, 'PMID:7661346', true], // upgrade slow-first-order → zero-order
  // LAI depot injections (IM)
  ['aripiprazole', 'IM', 864, 130, 1.0, 75, 'PMID:28350572'],  // lauroxil — onset ~5–6 d, release ~36 d
  ['olanzapine', 'IM', 672, 0, 1.0, 33, 'PMID:24815672'],      // pamoate — peak 2–4 d; molecular t½ 30 h
  ['haloperidol', 'IM', 672, 0, 1.0, 18, 'PMID:3559159'],      // decanoate — monthly
];

// Inhaled (fast first-order): [slug, Tmax_h, F, thalf_hr, pmid]
const INH: Array<[string, number, number, number, string]> = [
  ['nicotine', 0.4, 0.53, 4.3, 'PMID:8612383'],   // Molander 1996 — F 51–56%, Tmax 20–30 min
  ['cbd', 0.09, 0.59, 24, 'PMID:34676320'],        // Meyer 2018 — F 59% (±, nebulized), Tmax ~5 min
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let zo = 0, inh = 0; const skip: string[] = [];

  const donorVd = (c: Compound) => (c.pk?.PO?.V_L != null ? c.pk.PO.V_L : Object.values(c.pk ?? {}).find(b => b?.V_L != null)?.V_L);

  for (const [slug, route, zoDur, lag, F, thalf, pmid, overwrite] of ZERO) {
    const c = bySlug.get(slug);
    if (!c?.pk) { skip.push(`${slug}:${route}(no pk)`); continue; }
    if (c.pk[route] && !overwrite) { skip.push(`${slug}:${route}(exists)`); continue; }
    const Vd = donorVd(c);
    if (Vd == null) { skip.push(`${slug}:${route}(no Vd)`); continue; }
    const block: RoutePk = { zo_dur_hr: zoDur, V_L: Vd, F, source_pmid: pmid };
    if (lag > 0) block.lag_hr = lag;
    c.pk[route] = block;
    c.half_life_hr = c.half_life_hr ?? {};
    c.half_life_hr[route] = thalf;
    console.log(`  [${overwrite ? 'upd ' : 'add '}] ${slug.padEnd(14)} pk.${route} = {zo_dur:${zoDur}h${lag > 0 ? `, lag:${lag}h` : ''}, V_L:${Vd}, F:${F}}  t½=${thalf}h  ${pmid}`);
    zo++;
  }

  for (const [slug, Tmax, F, thalf, pmid] of INH) {
    const c = bySlug.get(slug);
    if (!c?.pk) { skip.push(`${slug}:INH(no pk)`); continue; }
    if (c.pk.INH) { skip.push(`${slug}:INH(exists)`); continue; }
    const Vd = donorVd(c);
    if (Vd == null) { skip.push(`${slug}:INH(no Vd)`); continue; }
    const ka = solveKa(Tmax, LN2 / thalf);
    const kaR = ka < 1 ? +ka.toFixed(3) : +ka.toFixed(2);
    c.pk.INH = { ka_hr: kaR, V_L: Vd, F, source_pmid: pmid };
    c.half_life_hr = c.half_life_hr ?? {};
    c.half_life_hr.INH = thalf;
    console.log(`  [add ] ${slug.padEnd(14)} pk.INH = {ka:${kaR}, V_L:${Vd}, F:${F}}  t½=${thalf}h  ${pmid}`);
    inh++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 30: +${zo} zero-order (TD/depot) + ${inh} inhaled blocks. Skipped: ${skip.join(', ') || 'none'}`);
}

main();
