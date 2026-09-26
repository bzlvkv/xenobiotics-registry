/**
 * 2026-05-26-wave27-iv-route-derivation.ts — fill missing IV-route pk blocks by
 * model-derivation (Phase 3, IV subset of the route gaps).
 *
 * For an intravenous route, three facts let the IV block be derived from an
 * already-authored route WITHOUT new literature:
 *   1. F = 1.0  — bioavailability is complete by definition (no absorption step).
 *   2. V_L (true volume of distribution) is a physiological property, route-
 *      INDEPENDENT — copy it from the compound's existing block. (core/types.ts:
 *      V_L = "Volume of distribution", and the Bateman/IV math applies F as a
 *      separate multiplier, so V_L is the true Vd, not Vd/F.)
 *   3. ka_hr — "Ignored for IV" (core/types.ts), so it is omitted.
 *   Elimination (ke / half-life) is also route-independent → half_life_hr.IV is
 *   set to the existing terminal half-life.
 *
 * So pk.IV = { V_L: <existing true Vd>, F: 1.0 }, half_life_hr.IV = <terminal t½>.
 * source_pmid is inherited from the donor block (same Vd value/source). These
 * are model-derived (1-compartment, route-invariant Vd) and flagged as such;
 * a maintainer can later refine with IV-specific 2-compartment data.
 *
 * Skips any IV-gap compound that has no V_L to copy (can't derive). Flip-flop
 * drugs (where oral t½ is absorption-limited) would have a shorter true IV t½;
 * none of this set are known flip-flop, but that's the one caveat.
 *
 * NOTE: the non-IV route gaps (IM 68, TD 34, SC 19, IN 14, SL 13, PO 9, INH 7,
 * PR 6 = 170) have route-SPECIFIC bioavailability that cannot be derived and
 * needs per-route primary sourcing — documented in AUTHORING_GAPS, not done here.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface RoutePk { ka_hr?: number; ke_hr?: number; V_L?: number; F?: number; source_pmid?: string; [k: string]: unknown }
interface Compound { slug: string; routes?: string[]; pk?: Record<string, RoutePk>; half_life_hr?: Record<string, number>; pk_unauthored?: unknown; [k: string]: unknown }

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  let added = 0; const skipped: string[] = [];
  for (const c of data) {
    if (c.pk_unauthored) continue;
    const pk = c.pk;
    if (!pk || typeof pk !== 'object' || Array.isArray(pk) || !Object.keys(pk).length) continue;
    if (!(c.routes || []).includes('IV')) continue;
    if (pk.IV) continue; // already has IV
    // donor block with a V_L (prefer PO, else any route)
    const donorRoute = pk.PO?.V_L != null ? 'PO' : Object.keys(pk).find(r => pk[r]?.V_L != null);
    if (!donorRoute) { skipped.push(`${c.slug}(no V_L)`); continue; }
    const donor = pk[donorRoute];
    const ivBlock: RoutePk = { V_L: donor.V_L, F: 1.0 };
    if (donor.source_pmid) ivBlock.source_pmid = donor.source_pmid;
    pk.IV = ivBlock;
    // half-life: route-independent terminal elimination
    if (c.half_life_hr && typeof c.half_life_hr === 'object') {
      const hl = c.half_life_hr.PO ?? Object.values(c.half_life_hr)[0];
      if (hl != null && c.half_life_hr.IV == null) c.half_life_hr.IV = hl;
    }
    console.log(`  [add ] ${c.slug.padEnd(20)} pk.IV = {V_L:${donor.V_L}, F:1.0} (Vd from ${donorRoute}${donor.source_pmid ? `, src ${donor.source_pmid}` : ''})`);
    added++;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 27 IV derivation: +${added} IV pk blocks. Skipped ${skipped.length}: ${skipped.join(', ')}`);
}

main();
