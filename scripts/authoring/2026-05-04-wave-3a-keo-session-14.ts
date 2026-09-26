/**
 * 2026-05-04-wave-3a-keo-session-14.ts — Wave 3a session 14.
 *
 * 3 verified kₑₒ from a niche-classes reverse-search pass (DOACs,
 * COX-2 inhibitors, BPH α1-blockers).
 *
 *   - dabigatran  kₑₒ 39.98 /h  IV cardiac surgery; ROTEM clotting-time
 *                               endpoint; abstract verbatim "T1/2keo
 *                               was 1.04 min" (PMID:38171494).
 *                               Plasma→clotting-effect-site fast.
 *   - celecoxib   kₑₒ 0.825 /h  Pediatric anesthesia analgesia paper;
 *                               abstract verbatim "common equilibration
 *                               half-time (T1/2 keq) of 0.84 h" for
 *                               plasma→CSF transfer (PMID:36318604).
 *                               Common-shared parameter across 3 coxibs;
 *                               model-parsimonious not drug-specific fit.
 *   - terazosin   kₑₒ 0.40  /h  2 mg PO healthy volunteers; arterial
 *                               SBP endpoint; abstract verbatim "0.40
 *                               ± 0.006 h⁻¹ for systolic blood pressure"
 *                               (PMID:18266399). Paper uses "first-order
 *                               rate constant of inhibitory Emax"
 *                               terminology — mathematically equivalent
 *                               to kₑₒ.
 *
 * Negative-confirmed (no verbatim kₑₒ in any abstract): apixaban,
 * rivaroxaban, edoxaban, enoxaparin, dalteparin, sildenafil, tadalafil,
 * sumatriptan, rizatriptan, zolmitriptan, finasteride, dutasteride,
 * tamsulosin, doxazosin, hydrochlorothiazide, indapamide, bumetanide,
 * furosemide, spironolactone, eplerenone, omeprazole/esomeprazole/
 * pantoprazole, famotidine, loperamide, cabergoline, bromocriptine,
 * nesiritide.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'dabigatran', ec: { keo_per_h: 39.98, source_pmid: 'PMID:38171494', note: 'IV dabigatran cardiac surgery, ROTEM CT endpoint; abstract verbatim "T1/2keo was 1.04 min"' } },
  { slug: 'celecoxib',  ec: { keo_per_h: 0.825, source_pmid: 'PMID:36318604', note: 'Plasma→CSF transfer, common to celecoxib/rofecoxib/valdecoxib; abstract verbatim "common equilibration half-time (T1/2 keq) of 0.84 h". Model-parsimonious shared value' } },
  { slug: 'terazosin',  ec: { keo_per_h: 0.40,  source_pmid: 'PMID:18266399', note: '2 mg PO healthy volunteers, arterial SBP; abstract verbatim "0.40 ± 0.006 h⁻¹ for systolic blood pressure". Paper uses "first-order rate constant of inhibitory Emax" terminology, math-equivalent to kₑₒ' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let updated = 0, alreadyHas = 0, missing = 0;

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as { keo_per_h?: number; source_pmid?: string } | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { alreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 14: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
