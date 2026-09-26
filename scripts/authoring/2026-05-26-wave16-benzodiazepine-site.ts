/**
 * 2026-05-26-wave16-benzodiazepine-site.ts — GABA-A BZ-site occupancy (wave 16).
 *
 * Extends the existing gaba_a_bzd rows (diazepam, lorazepam, alprazolam,
 * zolpidem, zaleplon, triazolam, midazolam) to three more agonists plus the
 * antagonist flumazenil. Binding occupancy at the benzodiazepine site via
 * radioligand-displacement Ki/IC50. Each PMID/quote/author re-fetched and
 * confirmed 2026-05-26.
 *
 * ec50_mg_l = Ki/IC50(nM) · MW / 1e6. emax 1.0, hill_n 1.
 * Species/radioligand differ per source (as do the existing rows — see the
 * triazolam note "Mouse brain BZ site, [3H]flunitrazepam"); BZ-site affinities
 * are comparable across these assays. Species + ligand flagged per note.
 * keo: documented-approximation (no published kₑₒ) anchored to sedative onset.
 *
 * ── Skipped (logged in AUTHORING_GAPS) ─────────────────────────────────────
 *  temazepam, oxazepam — no per-compound primary BZ-site Ki is abstract-quotable
 *  or in an open-access table. Braestrup & Squires 1978 (PMID:639854) give only
 *  the classical-BZD group range "Ki 1–60 nM"; the only oxazepam-specific numbers
 *  found are peripheral-site (µM) or a phenytoin-modulation assay (wrong target).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Authoring { slug: string; keo: number; keoPmid: string; keoNote: string; pathway: string; ec50: number; pmid: string; note: string; }

const ENTRIES: Authoring[] = [
  {
    slug: 'clonazepam', keo: 2.0, keoPmid: 'PMID:2872063', pathway: 'sedation_anxiolytic',
    keoNote: 'Approximation; no published kₑₒ. Oral clonazepam — fast-onset, long-acting BZD; anxiolytic/anticonvulsant onset ~20–60 min.',
    ec50: 0.00055249, pmid: 'PMID:2872063',
    note: 'Chweh 1986 verbatim: "Ro15-1788 and clonazepam are the most potent inhibitors (IC50s: 1.72 and 1.75 nM, respectively)". Mouse brain, [3H]flunitrazepam displacement (IC50 ≈ Ki at this high affinity). Agonist. ec50 = 1.75 nM × 315.71 / 1e6.',
  },
  {
    slug: 'eszopiclone', keo: 6.0, keoPmid: 'PMID:18973287', pathway: 'sedation_anxiolytic',
    keoNote: 'Approximation; no published kₑₒ. Rapid oral hypnotic, Tmax ~1 h.',
    ec50: 0.019479, pmid: 'PMID:18973287',
    note: 'Hanson 2008 Table (PMC2645942) verbatim: eszopiclone WT α1β2γ2 Ki "50.1 ± 10.1" nM (recombinant rat α1β2γ2 GABA-A in HEK293T, [3H]Ro15-1788; same table: zolpidem 61.9, Ro15-1788 3.3 nM). Cyclopyrrolone agonist (S-zopiclone). ec50 = 50.1 nM × 388.81 / 1e6.',
  },
  {
    slug: 'zopiclone', keo: 6.0, keoPmid: 'PMID:6329982', pathway: 'sedation_anxiolytic',
    keoNote: 'Approximation; no published kₑₒ. Rapid oral hypnotic, Tmax ~1–1.6 h.',
    ec50: 0.009331, pmid: 'PMID:6329982',
    note: 'Blanchard 1982 verbatim: "its Ki values measured against [3H]-flunitrazepam are 24 nM in the cerebral cortex, 31 nM in the cerebellum, and 36 nM in the hippocampus" (rat brain). Cyclopyrrolone agonist (racemate); cortex value used. ec50 = 24 nM × 388.81 / 1e6.',
  },
  {
    slug: 'flumazenil', keo: 30.0, keoPmid: 'PMID:6268754', pathway: 'antagonist',
    keoNote: 'Approximation; no published kₑₒ. IV BZD-reversal agent — very rapid clinical onset (~1–2 min).',
    ec50: 0.000698, pmid: 'PMID:6268754',
    note: 'Möhler 1981 verbatim: Ro 15-1788 "effectively inhibited [3H]diazepam binding in vitro (IC50 = 2.3 +/- 0.6 nmol/liter)"; "[3H]Ro 15-1788 bound to ... rat cerebral cortex with an apparent dissociation (KD) of 1.0 +/- 0.1 nmol/liter". Selective BZ-site ANTAGONIST (verbatim). ec50 = 2.3 nM × 303.29 / 1e6.',
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
    if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(12)} keo already authored`);
    else { c.effect_compartment = { keo_per_h: a.keo, source_pmid: a.keoPmid, note: a.keoNote }; addRef(c, a.keoPmid); keoN++; console.log(`  [add ] ${c.slug.padEnd(12)} keo=${a.keo}/h  ${a.keoPmid}`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    if (c.receptor_occupancy.find(x => x.receptor === 'gaba_a_bzd')) { skipN++; console.log(`  [skip] ${c.slug.padEnd(12)} @ gaba_a_bzd already authored`); continue; }
    c.receptor_occupancy.push({ receptor: 'gaba_a_bzd', pathway: a.pathway, emax: 1.0, ec50_mg_l: a.ec50, hill_n: 1, source_pmid: a.pmid, note: a.note });
    addRef(c, a.pmid); occN++;
    console.log(`  [add ] ${c.slug.padEnd(12)} @ gaba_a_bzd ec50=${a.ec50} mg/L  ${a.pmid}`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 16 BZ-site: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
