/**
 * 2026-05-05-wave-3a-keo-session-17.ts — Wave 3a session 17.
 *
 * 1 verified kₑₒ from a cardiovascular reverse-search pass spanning
 * β-blockers, ARBs, ACEi, CCBs, antiarrhythmics, diuretics, and
 * vasodilators (~50 compounds chased). Hit rate ~2% — most CV-drug
 * effect-compartment kₑₒ values live in tables/figures of full-text
 * rather than abstracts.
 *
 *   - quinidine   kₑₒ 3.74 /h    Karbwang 1993 (PMID:8471402);
 *                                abstract verbatim "rates of elimination
 *                                from the cardiac conduction 'effect'
 *                                compartment (keo; ... 3.74 [1.63-13.14]
 *                                h-1 for quinidine)" — human, IV 10 mg/kg
 *                                over 1 h, n=8, QTc endpoint. Rare human
 *                                IV PK/PD with directly reported per-hour kₑₒ.
 *
 * Confirmed already-authored hits surfaced again by reverse-search:
 *   - atenolol     kₑₒ 2.52 /h (PMID:17420778, rat HR)
 *   - dofetilide   kₑₒ 3.78 /h (PMID:16140023, dog QTc)
 *
 * Negative confirmations (no abstract-verbatim kₑₒ — added to
 * AUTHORING_GAPS.md):
 *   metoprolol, sotalol, propranolol, esmolol, labetalol, bisoprolol,
 *   verapamil, flecainide, diltiazem, nicardipine, amlodipine,
 *   nifedipine, losartan, captopril, ramipril, enalapril, lisinopril,
 *   perindopril, benazepril, valsartan, candesartan, olmesartan,
 *   irbesartan, telmisartan, ibutilide, dronedarone, propafenone,
 *   mexiletine, lidocaine, furosemide, bumetanide, torsemide,
 *   hydrochlorothiazide, spironolactone, eplerenone, hydralazine,
 *   minoxidil, nitroglycerin, isosorbide-mononitrate, nebivolol.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  {
    slug: 'quinidine',
    ec: {
      keo_per_h: 3.74,
      source_pmid: 'PMID:8471402',
      note: 'Human IV quinidine 10 mg/kg over 1 h (n=8 healthy Thai males), QTc endpoint; abstract verbatim "keo; ... 3.74 [1.63-13.14] h-1 for quinidine". Wide CI reflects between-subject variability in cardiac response.',
    },
  },
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
    const refs = (c['refs'] as string[] | undefined) ?? [];
    if (!refs.includes(u.ec.source_pmid)) refs.push(u.ec.source_pmid);
    c['refs'] = refs;
    updated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 17: kₑₒ updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
