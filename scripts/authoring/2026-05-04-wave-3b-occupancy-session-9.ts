/**
 * 2026-05-04-wave-3b-occupancy-session-9.ts — Wave 3b session 9.
 *
 * 2 verified receptor occupancy entries on compounds whose kₑₒ
 * landed in Wave 3a session 16.
 *
 *   - tramadol    Ki   2.4 µM   cloned hMOR, [3H]naloxone competition
 *                               in CHO membranes (PMID:10961373)
 *   - amiodarone  IC50 45  nM   HEK293 patch-clamp on cloned hERG;
 *                               IhERG outward-tail block (PMID:27256139)
 *
 * Deferred — Ki verified verbatim but kₑₒ missing on host compound:
 *   - hydrocodone   μ-opioid Ki 19.8 nM (PMID:1851921)
 *   - propranolol   β1 pKi 9.02 (~0.95 nM) (PMID:10895074)
 *   - metoprolol    β1 pKi 5.99 (~1023 nM) (PMID:10895074)
 *   - haloperidol   D2 Kd 7.42 nM rat striatum (PMID:1361536)
 *   Logged in AUTHORING_GAPS.md.
 *
 * Skipped (no abstract-verbatim Ki):
 *   - oxycodone   (47.4 nM Ki lives in full-text only)
 *   - codeine     (qualitative only in abstracts)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Occupancy = {
  receptor: string;
  pathway: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid: string;
  note?: string;
};

const ENTRIES: Array<{ slug: string; site: Occupancy }> = [
  {
    slug: 'tramadol',
    site: {
      receptor: 'mu_opioid', pathway: 'analgesia', emax: 1, hill_n: 1,
      ec50_mg_l: 0.632, source_pmid: 'PMID:10961373',
      note: 'Cloned hMOR, [3H]naloxone competition CHO membranes; abstract verbatim "(±)-tramadol (Ki=2.4 µM)". MW 263.38',
    },
  },
  {
    slug: 'amiodarone',
    site: {
      receptor: 'herg', pathway: 'antiarrhythmic', emax: 1, hill_n: 1,
      ec50_mg_l: 0.029, source_pmid: 'PMID:27256139',
      note: 'HEK293 patch-clamp cloned hERG outward IhERG tails; abstract verbatim "IC50 of ~45nM". MW 645.31. NB: amiodarone kₑₒ in registry is for hepatic ALT (87-d t½kₑₒ); the antiarrhythmic ke₀ is faster — flagged at compound level',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c['receptor_occupancy'] as Occupancy[] | undefined) ?? [];
    if (existing.some(s => s.receptor === e.site.receptor && s.source_pmid === e.site.source_pmid)) {
      alreadyHas++; continue;
    }
    existing.push(e.site);
    c['receptor_occupancy'] = existing;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 9: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
