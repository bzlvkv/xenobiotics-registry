/**
 * 2026-05-25-wave8-kinases.ts — kinase-inhibition occupancy (wave 8).
 *
 * 4 of 9. Kinase discovery papers state potency qualitatively in abstracts
 * (numbers live in tables), and several inhibitors are covalent — so yield is
 * lower. Authored where a value was abstract/PMC-quotable AND the inhibitor is
 * reversible (ATP-competitive). Enzyme block-occupancy via IC50, cf wave 7.
 *
 * ec50_mg_l = IC50(nM) · MW / 1e6. emax 1.0, hill_n 1, pathway 'inhibitor'.
 *
 * ── Skipped (logged) ───────────────────────────────────────────────────────
 *  imatinib, dasatinib (ABL IC50 table-only — O'Hare 2005 / Buchdunger),
 *  sorafenib (Raf/VEGFR table-only — Wilhelm 2004), ruxolitinib (only a
 *  cellular IL-6 IC50 281 nM, not an enzyme constant), ibrutinib (BTK IC50
 *  0.5 nM but COVALENT/irreversible — reversible Hill doesn't model it).
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

const KEO_NOTE = 'Approximation; no published kₑₒ. Kinase inhibition equilibrates ~with plasma; antiproliferative/anti-inflammatory effect is downstream.';

const ENTRIES: Authoring[] = [
  {
    slug: 'nilotinib',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:15710326', note: KEO_NOTE },
    receptor_occupancy: [{ receptor: 'bcr_abl', pathway: 'inhibitor', emax: 1.0, ec50_mg_l: 0.015886, hill_n: 1, source_pmid: 'PMID:15710326', note: 'Weisberg 2005 verbatim: "a novel selective inhibitor of Bcr-Abl, AMN107 (IC50 <30 nM)". Reversible (DFG-out ABL). Value is an upper bound (<30 nM); ec50 = 30 nM × 529.52 / 1e6.' }],
  },
  {
    slug: 'erlotinib',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:9354447', note: KEO_NOTE },
    receptor_occupancy: [{ receptor: 'egfr', pathway: 'inhibitor', emax: 1.0, ec50_mg_l: 0.000787, hill_n: 1, source_pmid: 'PMID:9354447', note: 'Moyer 1997 verbatim: "CP-358,774 is a directly acting inhibitor of human EGFR tyrosine kinase with an IC50 of 2 nM". Reversible ATP-competitive; human EGFR. ec50 = 2 nM × 393.44 / 1e6.' }],
  },
  {
    slug: 'tofacitinib',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:20701804', note: KEO_NOTE },
    receptor_occupancy: [{ receptor: 'jak1', pathway: 'inhibitor', emax: 1.0, ec50_mg_l: 0.001000, hill_n: 1, source_pmid: 'PMID:20701804', note: 'Meyer 2010 (PMC2928212) Table 1: tofacitinib (CP-690,550) JAK1 IC50 3.2 ± 1.4 nM (recombinant human kinase, mobility-shift; ATP-competitive, reversible). JAK3 most potent (1.6 nM). ec50 = 3.2 nM × 312.37 / 1e6.' }],
  },
  {
    slug: 'baricitinib',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:20363976', note: KEO_NOTE },
    receptor_occupancy: [{ receptor: 'jak1', pathway: 'inhibitor', emax: 1.0, ec50_mg_l: 0.002191, hill_n: 1, source_pmid: 'PMID:20363976', note: 'Fridman 2010 verbatim: "INCB028050 is a selective orally bioavailable JAK1/JAK2 inhibitor with nanomolar potency against JAK1 (5.9 nM) and JAK2 (5.7 nM)". Reversible ATP-competitive. ec50 = 5.9 nM × 371.42 / 1e6.' }],
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
    console.log(`  [add ] ${c.slug.padEnd(13)} @ ${row.receptor.padEnd(9)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
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
  console.log(`\nWave 8 kinases: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
