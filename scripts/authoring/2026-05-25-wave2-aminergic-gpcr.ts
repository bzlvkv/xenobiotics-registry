/**
 * 2026-05-25-wave2-aminergic-gpcr.ts — aminergic GPCR occupancy (wave 2).
 *
 * Parallel verification agents (2026-05-25) swept α-adrenergic, 5-HT, and
 * D2/5-HT2A antipsychotic candidates. Of 12 targeted, 6 had a Kᵢ quotable
 * VERBATIM from an abstract; the other 6 (clozapine, olanzapine, lurasidone,
 * mirtazapine, yohimbine, trazodone) carry their affinities only in data
 * tables — logged in AUTHORING_GAPS, NOT guessed. No measured kₑₒ exists for
 * any, so each uses a documented-approximation kₑₒ anchored to a real onset /
 * PET-occupancy paper.
 *
 * ec50_mg_l = Kᵢ(nM) · MW / 1e6. emax = binding-occupancy fraction (1.0); for
 * partial agonists (buspirone) this is occupancy, not intrinsic activity —
 * noted. hill_n = 1.
 *
 * ── Authored (6) ────────────────────────────────────────────────────────
 *  prazosin   α1  0.25 nM (human prostate, PMID 9839591)
 *  doxazosin  α1  pKi 8.60 → 2.51 nM (human, PMID 8905340; deterministic pKi→nM)
 *  buspirone  5-HT1A  15 nM (rat hippocampus, PMID 7647978)
 *  sumatriptan 5-HT1B 9.4 nM (human cloned; the 1992 "5-HT1D" clone = modern
 *             5-HT1B per the abstract's sequence note — PMID 1328844)
 *  risperidone 5-HT2A 0.4 nM (cloned human, PMID 7520908; D2 was relative-only → skipped)
 *  brexpiprazole H1 19 nM (cloned human, PMID 24947465; D2/5-HT2A given only as
 *             "<1 nM" bound, not authorable as an exact value)
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
    slug: 'prazosin',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:6994981', note: 'Approximation; no published kₑₒ. Jaillon 1980: oral Tmax 1–3 h, t½ ≈ 2.5 h — α1-blocker hypotensive effect lags plasma modestly.' },
    receptor_occupancy: [{ receptor: 'alpha_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.0000959, hill_n: 1, source_pmid: 'PMID:9839591', note: 'Ford 1998 verbatim: "its affinity for alpha1-adrenoceptors in the human prostate (Ki, 0.25 nmol/L) ... and all of the cloned subtypes (Ki, 0.26-0.44 nmol/L)". Human prostate α1, [3H]prazosin. ec50 = 0.25 nM × 383.4 / 1e6.' }],
  },
  {
    slug: 'doxazosin',
    effect_compartment: { keo_per_h: 0.3, source_pmid: 'PMID:2945688', note: 'Approximation; no published kₑₒ. Carlson 1986: "maximum fall in blood pressure ... occurred between 4 and 8 hours" vs Tmax 2.6–3.6 h — slow effect-site lag.' },
    receptor_occupancy: [{ receptor: 'alpha_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.001133, hill_n: 1, source_pmid: 'PMID:8905340', note: 'Hatano 1996 verbatim: "mean -log Ki (pKi) values were 8.60-8.63 [racemic doxazosin] ... at human prostate α1". pKi 8.60 → Ki 2.51 nM (deterministic). ec50 = 2.51 nM × 451.48 / 1e6.' }],
  },
  {
    slug: 'buspirone',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:9871430', note: 'Approximation; no published kₑₒ. Lilja 1998: oral Tmax ≈ 0.75 h — fast CNS 5-HT1A engagement (the anxiolytic clinical effect builds over weeks, distinct from occupancy).' },
    receptor_occupancy: [{ receptor: '5-HT1A', pathway: 'partial-agonist', emax: 1.0, ec50_mg_l: 0.005783, hill_n: 1, source_pmid: 'PMID:7647978', note: 'Croci 1995 verbatim: "8-OH-DPAT, buspirone ... displaced [3H]-8-OH-DPAT ... (Ki, nM; ... 15 ...)" — rat hippocampus (species flag). Clinically a 5-HT1A partial agonist; emax = binding occupancy (intrinsic activity not in abstract). ec50 = 15 nM × 385.51 / 1e6.' }],
  },
  {
    slug: 'sumatriptan',
    effect_compartment: { keo_per_h: 3.0, source_pmid: 'PMID:8757005', note: 'Approximation; no published kₑₒ. Touchon 1996: SC sumatriptan headache relief "from 15 minutes" — fast effect-site equilibration.' },
    receptor_occupancy: [{ receptor: '5-HT1B', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.002777, hill_n: 1, source_pmid: 'PMID:1328844', note: 'Veldman 1992 verbatim: "high affinity for the 5-HT1D-selective compound sumatriptan (Ki = 9.4 nM)". Human cloned receptor — the 1992 "5-HT1D" clone (RH-2) is 94% identical to rat 5-HT1B and is modern HTR1B. ec50 = 9.4 nM × 295.4 / 1e6.' }],
  },
  {
    slug: 'risperidone',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:7530376', note: 'Approximation; no published kₑₒ. Nyberg 1993 human PET: single oral 1 mg → ~50% striatal D2 and ~60% 5-HT2 occupancy — central engagement within hours.' },
    receptor_occupancy: [{ receptor: '5-HT2A', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.000164, hill_n: 1, source_pmid: 'PMID:7520908', note: 'Leysen 1994 verbatim: "their highest affinity was for 5-HT2A receptors (cloned human, Ki 0.4 nM)". Cloned human 5-HT2A. (D2 given only as "one order of magnitude lower" — not authored.) ec50 = 0.4 nM × 410.49 / 1e6.' }],
  },
  {
    slug: 'brexpiprazole',
    effect_compartment: { keo_per_h: 0.4, source_pmid: 'PMID:31847007', note: 'Approximation; no published kₑₒ. Girgis 2020 PET: D2 occupancy 64% (1 mg/day) → 80% (4 mg/day) at day-10 steady state.' },
    receptor_occupancy: [{ receptor: 'H1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.008238, hill_n: 1, source_pmid: 'PMID:24947465', note: 'Maeda 2014 verbatim: "moderate affinity for hH1 (Ki = 19 nm)". Cloned human H1. (D2L/5-HT2A reported only as "Ki < 1 nM" bound — not authorable as exact values; H1 is the sole exact Kᵢ in the abstract.) ec50 = 19 nM × 433.57 / 1e6.' }],
  },
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function apply(c: Compound, a: Authoring): { keo: boolean; occ: number; skip: number } {
  let keo = false;
  if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(14)} keo already authored`);
  else { c.effect_compartment = a.effect_compartment; addRef(c, a.effect_compartment.source_pmid); keo = true; console.log(`  [add ] ${c.slug.padEnd(14)} keo=${a.effect_compartment.keo_per_h}/h  ${a.effect_compartment.source_pmid}`); }
  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let occ = 0, skip = 0;
  for (const row of a.receptor_occupancy) {
    if (c.receptor_occupancy.find(r => r.receptor === row.receptor)) { skip++; console.log(`  [skip] ${c.slug.padEnd(14)} @ ${row.receptor} already authored`); continue; }
    c.receptor_occupancy.push(row); addRef(c, row.source_pmid); occ++;
    console.log(`  [add ] ${c.slug.padEnd(14)} @ ${row.receptor.padEnd(10)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
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
  console.log(`\nWave 2 aminergic GPCR: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
