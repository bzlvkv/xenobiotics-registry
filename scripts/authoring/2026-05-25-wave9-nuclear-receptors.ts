/**
 * 2026-05-25-wave9-nuclear-receptors.ts — nuclear-receptor occupancy (wave 9).
 *
 * 8 of 11 authorable. Nuclear receptors are intracellular/genomic — the
 * BINDING occupancy is modelled here (Ce-driven Hill); the transcriptional
 * effect is downstream (hours–days), so kₑₒ is slow and noted. Same treatment
 * as the existing androgen_receptor entry.
 *
 * ec50_mg_l = Kd/Ki/IC50(nM) · MW / 1e6. emax 1.0, hill_n 1.
 *
 * ── Skipped (logged) ───────────────────────────────────────────────────────
 *  tamoxifen / 4-OH-tamoxifen (only a relative binding affinity, RBA 310% of
 *  estradiol — no absolute Kᵢ), pioglitazone (PPARγ EC50 table-only),
 *  hydrocortisone (no abstract-quotable human GR Kd for cortisol itself).
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

const genomicKeo = (pmid: string): EffectCompartment => ({ keo_per_h: 0.1, source_pmid: pmid, note: 'Approximation; no published kₑₒ. Nuclear-receptor binding equilibrates over hours; the genomic (transcriptional) effect is downstream (hours–days) — slow effective kₑₒ.' });

const ENTRIES: Authoring[] = [
  {
    slug: 'estradiol', effect_compartment: genomicKeo('PMID:9048584'),
    receptor_occupancy: [{ receptor: 'estrogen_receptor', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.0000272, hill_n: 1, source_pmid: 'PMID:9048584', note: 'Kuiper 1997 verbatim: "dissociation constant (Kd) = 0.1 nM for ER alpha protein". Human ERα, 16α-[125I]iodo-17β-estradiol saturation binding. ec50 = 0.1 nM × 272.38 / 1e6.' }],
  },
  {
    slug: 'bicalutamide', effect_compartment: genomicKeo('PMID:19359544'),
    receptor_occupancy: [{ receptor: 'androgen_receptor', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.068429, hill_n: 1, source_pmid: 'PMID:19359544', note: 'Tran 2009 (PMC2981508) Fig 1B legend: "IC50 values ... 159 nM (Bic)". Human LNCaP/AR cells, 18F-FDHT competition. ec50 = 159 nM × 430.37 / 1e6.' }],
  },
  {
    slug: 'enzalutamide', effect_compartment: genomicKeo('PMID:19359544'),
    receptor_occupancy: [{ receptor: 'androgen_receptor', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.016720, hill_n: 1, source_pmid: 'PMID:19359544', note: 'Tran 2009 (PMC2981508) Fig 1B legend: "36 nM (MDV3100)" = enzalutamide. Human LNCaP/AR, 18F-FDHT competition. ec50 = 36 nM × 464.44 / 1e6.' }],
  },
  {
    slug: 'spironolactone', effect_compartment: genomicKeo('PMID:26073023'),
    receptor_occupancy: [{ receptor: 'mineralocorticoid', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.014997, hill_n: 1, source_pmid: 'PMID:26073023', note: 'Arai 2015 verbatim: "spironolactone and eplerenone, whose IC50s were 36 and 713nM, respectively" (³H-aldosterone MR binding). ec50 = 36 nM × 416.57 / 1e6.' }],
  },
  {
    slug: 'eplerenone', effect_compartment: genomicKeo('PMID:26073023'),
    receptor_occupancy: [{ receptor: 'mineralocorticoid', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.295531, hill_n: 1, source_pmid: 'PMID:26073023', note: 'Arai 2015 verbatim: eplerenone MR IC50 713 nM (³H-aldosterone binding). ec50 = 713 nM × 414.49 / 1e6.' }],
  },
  {
    slug: 'dexamethasone', effect_compartment: genomicKeo('PMID:7578014'),
    receptor_occupancy: [{ receptor: 'glucocorticoid', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.000981, hill_n: 1, source_pmid: 'PMID:7578014', note: 'Chakraborti 1995 verbatim: "wild type receptor Kd of 2.5 nM" ([3H]dexamethasone, human GR). ec50 = 2.5 nM × 392.46 / 1e6.' }],
  },
  {
    slug: 'prednisolone', effect_compartment: genomicKeo('PMID:7915437'),
    receptor_occupancy: [{ receptor: 'glucocorticoid', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.010093, hill_n: 1, source_pmid: 'PMID:7915437', note: 'verbatim: "prednisolone (P) for glucocorticoid receptor affinity (P IC50 = 28 nM)". GR competition; rat H4-II-C3 context (species flag). ec50 = 28 nM × 360.45 / 1e6.' }],
  },
  {
    slug: 'fenofibrate', effect_compartment: { keo_per_h: 0.05, source_pmid: 'PMID:14982965', note: 'Approximation; no published kₑₒ. PPARα is genomic; lipid effect builds over days/weeks — very slow effective kₑₒ.' },
    receptor_occupancy: [{ receptor: 'ppar_alpha', pathway: 'agonist', emax: 1.0, ec50_mg_l: 7.2166, hill_n: 1, source_pmid: 'PMID:14982965', note: 'Kuwabara 2004 verbatim: "Fenofibric acid ... weak agonist activity for PPARalpha (EC(50), 2-8 x 10(-5) M)". Active form fenofibric acid; human PPARα reporter. ec50 from lower bound 2e-5 M (20000 nM) × 360.83 / 1e6.' }],
  },
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function apply(c: Compound, a: Authoring): { keo: boolean; occ: number; skip: number } {
  let keo = false;
  if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(15)} keo already authored`);
  else { c.effect_compartment = a.effect_compartment; addRef(c, a.effect_compartment.source_pmid); keo = true; console.log(`  [add ] ${c.slug.padEnd(15)} keo=${a.effect_compartment.keo_per_h}/h  ${a.effect_compartment.source_pmid}`); }
  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let occ = 0, skip = 0;
  for (const row of a.receptor_occupancy) {
    if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { skip++; console.log(`  [skip] ${c.slug.padEnd(15)} @ ${row.receptor} already authored`); continue; }
    c.receptor_occupancy.push(row); addRef(c, row.source_pmid); occ++;
    console.log(`  [add ] ${c.slug.padEnd(15)} @ ${row.receptor.padEnd(19)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
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
  console.log(`\nWave 9 nuclear receptors: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
