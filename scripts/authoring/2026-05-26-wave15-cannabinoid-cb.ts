/**
 * 2026-05-26-wave15-cannabinoid-cb.ts — cannabinoid CB1/CB2 occupancy (wave 15).
 *
 * Phytocannabinoid binding occupancy at CB1 (CNR1) and CB2 (CNR2), via
 * radioligand-displacement Ki ([3H]CP55940). Extends the existing dronabinol
 * CB1 row (McPartland 2007) — the 'thc' slug is the same molecule (Δ9-THC), so
 * its CB1 value matches dronabinol's exactly; CB2 added to both. Each PMID/
 * quote/author re-fetched and confirmed 2026-05-26.
 *
 * ec50_mg_l = Ki(nM) · MW / 1e6  (= Ki(µM) · MW / 1000). emax 1.0, hill_n 1.
 * keo: documented-approximation (no published kₑₒ; radioligand-binding papers
 * don't report one) anchored to route/onset.
 *
 * Species note: CB1/CB2 are highly conserved (>97%) and all values are modern
 * [3H]CP55940 displacement Ki, so human (THC, βCP, CBD-CB2) and rodent
 * (CBD-CB1, CBG-CB1 mouse brain) values are comparable; species flagged per row.
 * Pathway reflects functional class (THC/βCP agonist, CBD antagonist, CBG
 * low-efficacy partial agonist) — the occupancy curve itself is binding fraction.
 *
 * ── Methylxanthines (theophylline/theobromine/paraxanthine) — NOT in this wave ─
 *  SKIPPED + logged: the only abstract-quotable adenosine values (Daly 1983,
 *  PMID:6309393) are RAT-brain IC50 from an old adenylate-cyclase A2 assay,
 *  NOT comparable to the existing caffeine entry (human Ki from Fredholm 1999,
 *  A1 ~11.8 µM / A2A ~2.4 µM) — the rat caffeine A1 IC50 (90–110 µM) is ~10×
 *  off and the rank order inverts. Needs Fredholm 1999 / Klotz 1998 (PMID:
 *  9459566) full-text HUMAN Ki to author comparably. See AUTHORING_GAPS.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Row { receptor: string; pathway: string; ec50: number; pmid: string; note: string; }
interface Authoring { slug: string; keo: number; keoPmid: string; keoNote: string; rows: Row[]; }

const r = (receptor: string, pathway: string, ec50: number, pmid: string, note: string): Row => ({ receptor, pathway, ec50, pmid, note });

const ENTRIES: Authoring[] = [
  {
    slug: 'thc', keo: 0.5, keoPmid: 'PMID:17641667',
    keoNote: 'Approximation; no published kₑₒ. CB1 binding tracks brain Ce; psychoactive onset is route-dependent (minutes smoked, 1–3 h oral).',
    rows: [
      r('cb1', 'agonist', 0.007893, 'PMID:17641667', 'McPartland 2007 verbatim: "mean Ki values for delta 9-tetrahydrocannabinol differed significantly between HsCB1 and RnCB1 (25.1 and 42.6 nM, respectively)". Human CB1 (HsCB1), partial agonist. ec50 = 25.1 nM × 314.46 / 1e6.'),
      r('cb2', 'agonist', 0.002673, 'PMID:25311884', 'Rosenthaler 2014 verbatim: "Ki values to CB2 range from 8.5 nM (THC) to 574.2 nM (CBDV)". Human CB2, [3H]CP-55,940 displacement; partial agonist. ec50 = 8.5 nM × 314.46 / 1e6.'),
    ],
  },
  {
    slug: 'dronabinol', keo: 0.5, keoPmid: 'PMID:17641667',
    keoNote: 'Approximation; no published kₑₒ. Oral Δ9-THC (dronabinol); slow CNS onset (Tmax ~1–3 h).',
    rows: [
      // cb1 already authored from McPartland 2007 — script skips it; add the matching CB2.
      r('cb2', 'agonist', 0.002673, 'PMID:25311884', 'Rosenthaler 2014 verbatim: "Ki values to CB2 range from 8.5 nM (THC) to 574.2 nM (CBDV)". Dronabinol = Δ9-THC; human CB2 partial agonist. ec50 = 8.5 nM × 314.46 / 1e6.'),
    ],
  },
  {
    slug: 'cbd', keo: 0.3, keoPmid: 'PMID:17245363',
    keoNote: 'Approximation; no published kₑₒ. Oral CBD; slow onset. Note CBD\'s direct CB1/CB2 affinity is weak — most CBD effects are mediated via other targets.',
    rows: [
      r('cb1', 'antagonist', 1.540854, 'PMID:17245363', 'Thomas 2007 Table 1 (PMC2189767) verbatim: cannabidiol CB1 Ki "4.9 μM (2.1 and 11.3 μM)", mouse brain membranes, [3H]CP55940 displacement. Weak; functional antagonist (not agonist). ec50 = 4.9 µM × 314.46 / 1000.'),
      r('cb2', 'antagonist', 1.320732, 'PMID:17245363', 'Thomas 2007 Table 1 (PMC2189767) verbatim: cannabidiol CB2 Ki "4.2 μM (2.9 and 6.2 μM)", human CB2 (hCB2-CHO). Weak; functional antagonist. ec50 = 4.2 µM × 314.46 / 1000.'),
    ],
  },
  {
    slug: 'cbg', keo: 0.3, keoPmid: 'PMID:20002104',
    keoNote: 'Approximation; no published kₑₒ. Note CBG\'s primary pharmacology is α2-adrenoceptor agonism / 5-HT1A antagonism; CB1/CB2 affinity is moderate–weak.',
    rows: [
      r('cb1', 'partial agonist', 0.120579, 'PMID:20002104', 'Cascio 2010 verbatim: cannabigerol Ki "381 nM (231 and 627 nM) for displacement from brain membranes" (mouse brain), [3H]CP55940; low-efficacy/partial. ec50 = 381 nM × 316.48 / 1e6.'),
      r('cb2', 'partial agonist', 0.822848, 'PMID:20002104', 'Cascio 2010 verbatim: cannabigerol Ki "2.6 µM (1.4 and 4.7 µM) for displacement from CHO-hCB2 cell membranes" (human CB2). ec50 = 2.6 µM × 316.48 / 1000.'),
    ],
  },
  {
    slug: 'beta-caryophyllene', keo: 0.3, keoPmid: 'PMID:18574142',
    keoNote: 'Approximation; no published kₑₒ. Dietary terpene; CB2-selective full agonist (no meaningful CB1 affinity).',
    rows: [
      r('cb2', 'agonist', 0.031676, 'PMID:18574142', 'Gertsch 2008 verbatim: "(E)-BCP selectively binds to the CB(2) receptor (K(i) = 155 +/- 4 nM) and that it is a functional CB(2) agonist". Human CB2 (HEK293). ec50 = 155 nM × 204.36 / 1e6.'),
    ],
  },
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let keoN = 0, occN = 0, skipN = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(18)} keo already authored`);
    else { c.effect_compartment = { keo_per_h: a.keo, source_pmid: a.keoPmid, note: a.keoNote }; addRef(c, a.keoPmid); keoN++; console.log(`  [add ] ${c.slug.padEnd(18)} keo=${a.keo}/h  ${a.keoPmid}`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    for (const row of a.rows) {
      if (c.receptor_occupancy.find(x => x.receptor === row.receptor)) { skipN++; console.log(`  [skip] ${c.slug.padEnd(18)} @ ${row.receptor} already authored`); continue; }
      c.receptor_occupancy.push({ receptor: row.receptor, pathway: row.pathway, emax: 1.0, ec50_mg_l: row.ec50, hill_n: 1, source_pmid: row.pmid, note: row.note });
      addRef(c, row.pmid); occN++;
      console.log(`  [add ] ${c.slug.padEnd(18)} @ ${row.receptor.padEnd(4)} ec50=${row.ec50} mg/L  ${row.pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 15 cannabinoids: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
