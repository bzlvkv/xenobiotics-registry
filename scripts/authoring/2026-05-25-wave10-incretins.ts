/**
 * 2026-05-25-wave10-incretins.ts — GLP-1 / GIP agonist occupancy (wave 10).
 *
 * Incretin peptides were missed by the small-molecule probes (no MW on file).
 * Backfills peptide MW (chemistry fact, no PMID — cf MW backfill) and authors
 * GLP-1R/GIPR occupancy where a verbatim affinity exists. The GLP-1R/GIPR
 * pages already exist (retatrutide). kₑₒ ≈ 0.05/h for the weekly agents
 * (matching retatrutide) — the glucose/weight effect builds over weeks.
 *
 * ── Authored (3 compounds, 4 rows) ─────────────────────────────────────────
 *  semaglutide GLP-1R 0.38 nM (human, Lau 2015 PMID 26308095)
 *  tirzepatide GLP-1R 4.23 nM + GIPR 0.135 nM (human, Coskun 2018 PMID 30473097)
 *  exenatide   GLP-1R 0.46 nM (rat, Schepp 1994 PMID 7851494 — species flag)
 *
 * ── Skipped ─────────────────────────────────────────────────────────────────
 *  liraglutide, dulaglutide — discovery abstracts describe affinity only
 *  qualitatively ("full receptor activity"; semaglutide "3-fold" vs liraglutide
 *  is derived, not quoted). No verbatim number → logged in AUTHORING_GAPS.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; mw_g_mol?: number; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Authoring { slug: string; mw: number; effect_compartment: EffectCompartment; receptor_occupancy: ReceptorOccupancy[]; }

const ENTRIES: Authoring[] = [
  {
    slug: 'semaglutide', mw: 4113.58,
    effect_compartment: { keo_per_h: 0.05, source_pmid: 'PMID:26308095', note: 'Approximation; no published kₑₒ. Once-weekly GLP-1 analogue (t½ ~1 week); glucose/weight effect builds over weeks — very slow effective kₑₒ (cf retatrutide 0.05/h).' },
    receptor_occupancy: [{ receptor: 'glp_1r', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.001563, hill_n: 1, source_pmid: 'PMID:26308095', note: 'Lau 2015 verbatim: "The GLP-1R affinity of semaglutide (0.38 ± 0.06 nM) was three-fold decreased compared to liraglutide". Human GLP-1R. ec50 = 0.38 nM × 4113.58 / 1e6.' }],
  },
  {
    slug: 'tirzepatide', mw: 4813.45,
    effect_compartment: { keo_per_h: 0.05, source_pmid: 'PMID:30473097', note: 'Approximation; no published kₑₒ. Once-weekly dual GIP/GLP-1 agonist; glucose/weight effect over weeks — very slow effective kₑₒ.' },
    receptor_occupancy: [
      { receptor: 'gipr', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.000650, hill_n: 1, source_pmid: 'PMID:30473097', note: 'Coskun 2018 (PMC6308032): tirzepatide (LY3298176) GIPR Ki 0.135 nM (binding affinity); human recombinant, HEK293. GIP-receptor-biased dual agonist. ec50 = 0.135 nM × 4813.45 / 1e6.' },
      { receptor: 'glp_1r', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.020361, hill_n: 1, source_pmid: 'PMID:30473097', note: 'Coskun 2018 (PMC6308032): tirzepatide GLP-1R Ki 4.23 nM (binding affinity); human recombinant, HEK293 (~5-fold weaker than native GLP-1). ec50 = 4.23 nM × 4813.45 / 1e6.' },
    ],
  },
  {
    slug: 'exenatide', mw: 4186.57,
    effect_compartment: { keo_per_h: 0.2, source_pmid: 'PMID:7851494', note: 'Approximation; no published kₑₒ. Exenatide (exendin-4) IR is twice-daily (plasma t½ ~2.4 h); incretin effect acute postprandially — moderate-slow kₑₒ.' },
    receptor_occupancy: [{ receptor: 'glp_1r', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.001926, hill_n: 1, source_pmid: 'PMID:7851494', note: 'Schepp 1994 verbatim: "exendin-4 (Ki = 4.6 x 10⁻¹⁰ M)" = 0.46 nM. RAT parietal cell GLP-1R (species flag; human Thorens 1993 describes exendin-4 only as "similar" to GLP-1 Kd 0.5 nM). ec50 = 0.46 nM × 4186.57 / 1e6.' }],
  },
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function apply(c: Compound, a: Authoring): { keo: boolean; occ: number; skip: number; mw: boolean } {
  let mw = false;
  if (c.mw_g_mol == null) { c.mw_g_mol = a.mw; mw = true; console.log(`  [mw  ] ${c.slug.padEnd(13)} MW=${a.mw}`); }
  let keo = false;
  if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(13)} keo already authored`);
  else { c.effect_compartment = a.effect_compartment; addRef(c, a.effect_compartment.source_pmid); keo = true; console.log(`  [add ] ${c.slug.padEnd(13)} keo=${a.effect_compartment.keo_per_h}/h  ${a.effect_compartment.source_pmid}`); }
  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let occ = 0, skip = 0;
  for (const row of a.receptor_occupancy) {
    if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { skip++; console.log(`  [skip] ${c.slug.padEnd(13)} @ ${row.receptor} already authored`); continue; }
    c.receptor_occupancy.push(row); addRef(c, row.source_pmid); occ++;
    console.log(`  [add ] ${c.slug.padEnd(13)} @ ${row.receptor.padEnd(8)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
  }
  return { keo, occ, skip, mw };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let keoAdded = 0, occAdded = 0, mwAdded = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    const r = apply(c, a);
    if (r.keo) keoAdded++; if (r.mw) mwAdded++; occAdded += r.occ;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 10 incretins: +${occAdded} occupancy rows, +${keoAdded} keo, +${mwAdded} MW.`);
}

main();
