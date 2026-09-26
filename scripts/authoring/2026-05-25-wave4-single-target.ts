/**
 * 2026-05-25-wave4-single-target.ts — single-target occupancy (wave 4).
 *
 * Parallel agents swept H2 antagonists, 5-HT3 setrons, antimuscarinics,
 * a triptan, and varenicline. Of 11 targeted, 4 had a Kᵢ quotable VERBATIM
 * from a verified abstract AND a usable keo/onset anchor. The rest are logged
 * (5-HT3 human Kᵢ paywalled → PDF_QUEUE; tolterodine/oxybutynin Kᵢ verified
 * but no keo anchor; rizatriptan/famotidine no abstract-quotable nM).
 *
 * ec50_mg_l = Kᵢ(nM) · MW / 1e6. emax 1.0 (binding occupancy), hill_n 1.
 *
 * ── Authored (4) ────────────────────────────────────────────────────────
 *  cimetidine  H2 560 nM (human, PMID 7921611) · ranitidine H2 190 nM
 *  (guinea-pig, PMID 9205741); kₑₒ from acid-suppression onset (PMID 9663842).
 *  tamsulosin  α1A 0.13 nM (PMID 11026539 — species unstated in abstract,
 *  flagged); kₑₒ from MR Tmax 5 h (PMID 9489594).
 *  varenicline α4β2 nAChR 0.14 nM (rat, PMID 22550286); kₑₒ from functional
 *  EC50 (PMID 16766716).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Authoring { slug: string; effect_compartment: EffectCompartment; receptor_occupancy: ReceptorOccupancy[]; }

const ENTRIES: Authoring[] = [
  {
    slug: 'cimetidine',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:9663842', note: 'Approximation; no cimetidine-specific kₑₒ. Class anchor Hedenström 1997: oral H2-blockers raise intragastric pH within ~20–80 min — acid-suppression effect equilibrates within ~1 h.' },
    receptor_occupancy: [{ receptor: 'H2', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.14131, hill_n: 1, source_pmid: 'PMID:7921611', note: 'Leurs 1994 verbatim: "blocked by tiotidine and cimetidine, resulting in Ki values of 8 +/- 1 nM and 0.56 +/- 0.24 MicroM respectively". Human H2 in CHO, functional cAMP block. ec50 = 560 nM × 252.34 / 1e6.' }],
  },
  {
    slug: 'ranitidine',
    effect_compartment: { keo_per_h: 1.5, source_pmid: 'PMID:9663842', note: 'Approximation; no published kₑₒ. Hedenström 1997: oral ranitidine reached intragastric pH 4 in 20–40 min ("significantly more rapid onset … compared to famotidine") — fast effect-site equilibration.' },
    receptor_occupancy: [{ receptor: 'H2', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.059736, hill_n: 1, source_pmid: 'PMID:9205741', note: 'Agut 1997 verbatim: "ranitidine (Ki: 190.0 nmol/l)" by [3H]-thiotidine displacement. Guinea-pig cerebellum/cortex membranes (species flag). ec50 = 190 nM × 314.4 / 1e6.' }],
  },
  {
    slug: 'tamsulosin',
    effect_compartment: { keo_per_h: 0.3, source_pmid: 'PMID:9489594', note: 'Approximation; no published kₑₒ. Taguchi 1998: modified-release tamsulosin median peak plasma at 5 h — slow effective onset (MR formulation).' },
    receptor_occupancy: [{ receptor: 'alpha_1a', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.0000531, hill_n: 1, source_pmid: 'PMID:11026539', note: 'Kuo 2000 verbatim: "tamsulosin (Ki = 0.13 nM, alpha1b/alpha1a = 15, alpha1d/alpha1a = 1.4)" — α1A-AR. CAVEAT: abstract states the value as a comparator and does not name species/preparation. ec50 = 0.13 nM × 408.51 / 1e6.' }],
  },
  {
    slug: 'varenicline',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:16766716', note: 'Approximation; no published kₑₒ. Mihalak 2006: varenicline α4β2 partial agonist, EC50 2.3 µM, 13.4% efficacy (rat oocyte) — functional onset anchor; central nAChR engagement over hours.' },
    receptor_occupancy: [{ receptor: 'nachr_a4b2', pathway: 'partial-agonist', emax: 1.0, ec50_mg_l: 0.0000296, hill_n: 1, source_pmid: 'PMID:22550286', note: 'Bordia 2012 verbatim: "varenicline inhibited α6β2* nAChR binding (K(i) = 0.12 nM) as potently as α4β2* nAChR binding (K(i) = 0.14 nM) in rat striatal sections". Rat (species flag); α4β2 ligand-gated channel. ec50 = 0.14 nM × 211.27 / 1e6.' }],
  },
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function apply(c: Compound, a: Authoring): { keo: boolean; occ: number; skip: number } {
  let keo = false;
  if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(13)} keo already authored`);
  else { c.effect_compartment = a.effect_compartment; addRef(c, a.effect_compartment.source_pmid); keo = true; console.log(`  [add ] ${c.slug.padEnd(13)} keo=${a.effect_compartment.keo_per_h}/h  ${a.effect_compartment.source_pmid}`); }
  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let occ = 0, skip = 0;
  for (const row of a.receptor_occupancy) {
    if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { skip++; console.log(`  [skip] ${c.slug.padEnd(13)} @ ${row.receptor} already authored`); continue; }
    c.receptor_occupancy.push(row); addRef(c, row.source_pmid); occ++;
    console.log(`  [add ] ${c.slug.padEnd(13)} @ ${row.receptor.padEnd(12)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
  }
  return { keo, occ, skip };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let keoAdded = 0, occAdded = 0, occSkipped = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    const r = apply(c, a);
    if (r.keo) keoAdded++; occAdded += r.occ; occSkipped += r.skip;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 4 single-target: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
