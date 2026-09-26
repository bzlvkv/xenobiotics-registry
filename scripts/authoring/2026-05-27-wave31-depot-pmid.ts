/**
 * 2026-05-27-wave31-depot-pmid.ts — LAI depots now backed by a PUBLISHED human
 * PK paper (vs the FDA-label-only profiles deferred in wave 30). Zero-order +
 * lag model. +3 IM depot blocks.
 *
 *  risperidone (Consta) — Gefvert 2005 (PMID:15710053, Int J Neuropsychopharmacol,
 *    human): "Stable plasma concentrations were reached after the third injection
 *    … maintained for 4–5 wk after the last injection and then declined rapidly."
 *    Confirms the delayed/sustained q2-week depot behavior. The precise ~3-week
 *    release lag (lag_hr 504) is the established Consta profile (clinically
 *    mandated 3-week oral overlap; FDA label) — not stated verbatim in Gefvert's
 *    abstract, noted as the canonical product characteristic. zo_dur 336 (release
 *    weeks 4–6). MEDIUM confidence on the lag.
 *  naltrexone (Vivitrol) — Dunbar 2006 (PMID:16499489, Alcohol Clin Exp Res,
 *    human): "measurable in all subjects for at least 31 days postdose"; q28-day.
 *    zo_dur 720, lag 48 (depot main peak ~2–3 d; dual-peak detail is full-text).
 *  octreotide (Sandostatin LAR) — Tiberg 2015 (PMID:26076191, Br J Clin Pharmacol,
 *    122 healthy volunteers): release "rapid and sustained for up to 4 weeks"
 *    (zo_dur 672); rebound ~1 week after the initial burst → lag 168 (full text,
 *    PMC4574831). Replaces the rabbit Petersen 2011 data.
 *
 * F = 1.0 (parenteral). half_life_hr[IM] = MOLECULAR t½ (registry value) — once
 * the depot is exhausted, decline is molecular, not release-limited.
 *
 * STILL deferred: leuprolide — Mazzei 1990 (PMID:2108885) is the SUBCUTANEOUS
 * depot; the registry's open leuprolide gap is the IM (Lupron Depot) route, and
 * SC is already authored. Route/formulation mismatch → needs an IM-depot PK paper.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { V_L?: number; F?: number; zo_dur_hr?: number; lag_hr?: number; source_pmid?: string; [k: string]: unknown }
interface Compound { slug: string; pk?: Record<string, RoutePk>; half_life_hr?: Record<string, number>; [k: string]: unknown }

// [slug, route, zo_dur_hr, lag_hr, F, thalf_hr (molecular), pmid]
const DEPOTS: Array<[string, string, number, number, number, number, string]> = [
  ['risperidone', 'IM', 336, 504, 1.0, 20, 'PMID:15710053'],
  ['naltrexone', 'IM', 720, 48, 1.0, 4, 'PMID:16499489'],
  ['octreotide', 'IM', 672, 168, 1.0, 1.5, 'PMID:26076191'],
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let added = 0; const skip: string[] = [];
  for (const [slug, route, zoDur, lag, F, thalf, pmid] of DEPOTS) {
    const c = bySlug.get(slug);
    if (!c?.pk) { skip.push(`${slug}(no pk)`); continue; }
    if (c.pk[route]) { skip.push(`${slug}:${route}(exists)`); continue; }
    const Vd = c.pk.PO?.V_L != null ? c.pk.PO.V_L : Object.values(c.pk).find(b => b?.V_L != null)?.V_L;
    if (Vd == null) { skip.push(`${slug}(no Vd)`); continue; }
    c.pk[route] = { zo_dur_hr: zoDur, lag_hr: lag, V_L: Vd, F, source_pmid: pmid };
    c.half_life_hr = c.half_life_hr ?? {};
    c.half_life_hr[route] = thalf;
    console.log(`  [add ] ${slug.padEnd(13)} pk.${route} = {zo_dur:${zoDur}h, lag:${lag}h, V_L:${Vd}, F:${F}}  t½=${thalf}h  ${pmid}`);
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 31: +${added} depot blocks. Skipped: ${skip.join(', ') || 'none'}`);
}

main();
