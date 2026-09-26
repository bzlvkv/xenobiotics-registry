/**
 * 2026-05-27-wave43-non-rx-hygiene.ts — non-prescription data hygiene.
 *
 * (1) yohimbine α2A occupancy + kₑₒ. yohimbine already had MW + a cited PK
 * block (Owen 1990, PMID:2076728) but no PD; GtoPdb has a clean human α2A
 * value, so add the defining-receptor row and a documented-approximation kₑₒ.
 *
 * (2) PK stragglers — three amino acids that the registry left
 * un-pk-modeled AND un-flagged. They act as nutrients/biosynthetic precursors,
 * not Bateman drugs; mark them `pk_unauthored: 'local-acting'` to bring them
 * in line with the 217 other supplement compounds the project already flags.
 *
 * MW backfill (originally proposed) — DEFERRED: of 156 compounds missing MW,
 * only 2 are functionally critical (have occupancy or are kinetic perps), and
 * neither has a cheap fix (retatrutide PubChem name lookup 404s; hormonal-
 * contraceptives is a mixture, not a single-MW compound, and isn't currently
 * triggering a lint error). The remaining 154 are peptides / biologic mAbs /
 * herbal extracts where MW is either undefined or unused.
 *
 * Idempotent.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Compound = { slug: string; effect_compartment?: { keo_per_h: number; note?: string }; receptor_occupancy?: Array<{ receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string }>; pk_unauthored?: { reason: string; note?: string }; refs?: string[]; [k: string]: unknown };

const YOHIMBINE_KEO = {
  keo_per_h: 2.0,
  note: 'Approximation; no published kₑₒ. Yohimbine\'s sympathetic/anxiogenic effects (tachycardia, BP rise, anxiety) emerge within ~15–30 min of an oral dose; given its short plasma t½ (~36 min, PMID:2076728), the effect tracks plasma closely. 2.0/h → t½kₑₒ ≈ 21 min.',
};

const YOHIMBINE_ROW = {
  receptor: 'alpha_2a',
  pathway: 'antagonist',
  emax: 1.0,
  ec50_mg_l: 0.000999,
  hill_n: 1,
  source_pmid: 'PMID:7996470',
  note: 'GtoPdb-curated human α2A-adrenoceptor binding: pKi range 8.4–8.7 (PMID:7996470, PMID:1353247, PMID:7908642, PMID:35224877); midpoint pKi 8.55 → Ki ≈ 2.8 nM, antagonist. Yohimbine\'s defining α2 antagonism. ec50 = 2.8 nM × 354.44 / 1e6.',
};

const PK_STRAGGLERS: { slug: string; note: string }[] = [
  { slug: 'l-citrulline', note: 'Dietary amino acid / arginine-NO biosynthetic precursor; effect is on tissue arginine/NO pools, not plasma-driven receptor PD. Bateman absorption/distribution doesn\'t apply.' },
  { slug: 'l-glutamine', note: 'Dietary amino acid / gut & immune substrate; acts via metabolic incorporation, not plasma-driven receptor PD. Bateman absorption/distribution doesn\'t apply.' },
  { slug: 'n-acetylcysteine-amide', note: 'NAC amide (intracellular cysteine/glutathione precursor); antioxidant action via tissue thiol pools, not plasma-driven receptor PD. Bateman absorption/distribution doesn\'t apply.' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let addedKeo = 0, addedOcc = 0, addedUnauth = 0, skipped = 0;

  // (1) yohimbine
  const y = bySlug.get('yohimbine');
  if (!y) throw new Error('yohimbine missing');
  if (y.effect_compartment?.keo_per_h) {
    console.log('[skip] yohimbine keo already authored'); skipped++;
  } else {
    y.effect_compartment = YOHIMBINE_KEO; addedKeo++;
    console.log(`[add ] yohimbine kₑₒ ${YOHIMBINE_KEO.keo_per_h}/h (approx)`);
  }
  y.receptor_occupancy = y.receptor_occupancy ?? [];
  if (y.receptor_occupancy.find(r => r.receptor === YOHIMBINE_ROW.receptor)) {
    console.log('[skip] yohimbine alpha_2a already authored'); skipped++;
  } else {
    y.receptor_occupancy.push(YOHIMBINE_ROW); addedOcc++;
    y.refs = y.refs ?? [];
    if (!y.refs.includes(YOHIMBINE_ROW.source_pmid)) y.refs.push(YOHIMBINE_ROW.source_pmid);
    console.log(`[add ] yohimbine @ alpha_2a ec50=${YOHIMBINE_ROW.ec50_mg_l} mg/L  ${YOHIMBINE_ROW.source_pmid}`);
  }

  // (2) PK stragglers
  for (const s of PK_STRAGGLERS) {
    const c = bySlug.get(s.slug);
    if (!c) { console.log(`[skip] ${s.slug} not in registry`); skipped++; continue; }
    if (c.pk_unauthored) { console.log(`[skip] ${s.slug} already has pk_unauthored`); skipped++; continue; }
    c.pk_unauthored = { reason: 'local-acting', note: s.note };
    addedUnauth++;
    console.log(`[add ] ${s.slug.padEnd(22)} pk_unauthored: 'local-acting'`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave43: +${addedKeo} keo, +${addedOcc} occupancy, +${addedUnauth} pk_unauthored (${skipped} skipped).`);
}

main();
