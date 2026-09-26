/**
 * 2026-05-04-wave-3a-keo-session-5.ts — Wave 3a session 5.
 *
 * 2 verified kₑₒ from one Stanski-group EEG paper after a 14-compound
 * BZD/Z-drug/sedating-antihistamine pass. Hit rate ~14% — abstracts
 * for BZD/Z-drug PD usually report Cmax/Emax/elim-t½ but not kₑₒ.
 *
 *   - midazolam  kₑₒ 8.66  /h (t½kₑₒ 4.8 min, IV, EEG)
 *   - diazepam   kₑₒ 25.99 /h (t½kₑₒ 1.6 min, IV, EEG)
 *
 * Both from PMID:2225714 (Bührer 1990 Clin Pharmacol Ther, Stanski group),
 * abstract verbatim: "The half-time of blood:brain equilibration was
 * significantly longer for midazolam than diazepam (4.8 minutes versus
 * 1.6 minutes)."
 *
 * Skipped (no abstract-verbatim kₑₒ): alprazolam, oxazepam, temazepam,
 * triazolam, zolpidem, zopiclone, zaleplon, diphenhydramine, hydroxyzine,
 * atropine, glycopyrrolate, tacrolimus.
 *
 * (Triazolam was a near-miss — agent surfaced t½kₑₒ 9.4 min from a
 *  Greenblatt BJCP paper, but the cited PMID resolved to the wrong
 *  paper and the correct PMID couldn't be confirmed in this pass.)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

const KEO_UPDATES = [
  { slug: 'midazolam', ec: { keo_per_h: 8.66,  source_pmid: 'PMID:2225714', note: 'EEG endpoint, IV; abstract t½kₑₒ 4.8 min, adult human' } },
  { slug: 'diazepam',  ec: { keo_per_h: 25.99, source_pmid: 'PMID:2225714', note: 'EEG endpoint, IV; abstract t½kₑₒ 1.6 min, adult human' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let kEoUpdated = 0, alreadyHas = 0, missing = 0;

  for (const u of KEO_UPDATES) {
    const c = bySlug.get(u.slug);
    if (!c) { console.warn(`  [warn] missing: ${u.slug}`); missing++; continue; }
    const existing = c['effect_compartment'] as { keo_per_h?: number; source_pmid?: string } | undefined;
    if (existing?.keo_per_h && existing.source_pmid) { alreadyHas++; continue; }
    c['effect_compartment'] = u.ec;
    kEoUpdated++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3a session 5: kₑₒ updated ${kEoUpdated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
