/**
 * 2026-05-25-wave3-fulltext-occupancy.ts — occupancy from PMC full-text tables.
 *
 * Wave 3 relaxes to "verbatim from a PMC-accessible full-text TABLE" (the
 * 2026-05-08 full-text rule, extended to tables). Affinities here were read
 * directly from public PMC table cells; everything that lives only behind a
 * paywall is BACKLOGGED in PDF_QUEUE_*.md, not authored. kₑₒ is the
 * documented-approximation convention anchored to human PET occupancy.
 *
 * ── Authored (5 compounds, 7 rows) ─────────────────────────────────────────
 *  SSRIs — human SERT Kᵢ from Nevels 2016 Table 1 (PMC5044489, "Dissociation
 *  Constants … in Nanomoles"; the same table that already sourced citalopram
 *  1.16 nM): fluoxetine 0.81, sertraline 0.29, paroxetine 0.13, fluvoxamine
 *  0.79 nM. kₑₒ ≈ 0.3–0.4/h from [11C]DASB/McN5652 PET occupancy time-courses
 *  (Arakawa 2016 single-dose: max SERT occupancy at 4 h).
 *  olanzapine — D2 67.72 / 5-HT2A 4.22 / H1 0.13 nM from a CC-BY OA paper
 *  (PMID 22726212, PMC3485633, Table 1) — RAT brain (species-flagged). kₑₒ
 *  ≈ 0.5/h from human PET D2 occupancy (Kapur 1998).
 *
 * ── Backlogged (paywalled, added to PDF_QUEUE) ─────────────────────────────
 *  Richelson 2000 (PMID 11132243) — HUMAN D2/5-HT2A/H1 for clozapine,
 *  olanzapine, risperidone, quetiapine (highest leverage); Jensen 2008
 *  (18059438) quetiapine; Ishibashi 2010 (20404009) lurasidone; Kroeze 2003
 *  (12629531) H1; Bymaster 1996 (8822531) olanzapine-human.
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

const SSRI_KEO = (anchor: string, note: string): EffectCompartment => ({ keo_per_h: 0.4, source_pmid: anchor, note });

const ENTRIES: Authoring[] = [
  {
    slug: 'fluoxetine',
    effect_compartment: { keo_per_h: 0.3, source_pmid: 'PMID:15121647', note: 'Approximation; no published kₑₒ. Meyer 2004 [11C]DASB: SSRIs reach 76–85% SERT occupancy at minimum therapeutic dose. Fluoxetine\'s long t½ (+ norfluoxetine) makes onset slow — kₑₒ ≈ 0.3/h.' },
    receptor_occupancy: [{ receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1.0, ec50_mg_l: 0.000251, hill_n: 1, source_pmid: 'PMID:27738376', note: 'Nevels 2016 (PMC5044489) Table 1 "Dissociation Constants of Antidepressants at Monoamine Transporters in Nanomoles": fluoxetine SERT 0.81 (read from the public PMC table; same table as the authored citalopram 1.16). ec50 = 0.81 nM × 309.33 / 1e6.' }],
  },
  {
    slug: 'sertraline',
    effect_compartment: SSRI_KEO('PMID:27082864', 'Approximation; no published kₑₒ. Arakawa 2016 [11C]DASB single-dose: "All drugs showed maximum occupancy at 4h after dosing"; sertraline 69–78% at 4 h — CNS SERT occupancy equilibrates over hours.'),
    receptor_occupancy: [{ receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1.0, ec50_mg_l: 0.0000888, hill_n: 1, source_pmid: 'PMID:27738376', note: 'Nevels 2016 (PMC5044489) Table 1: sertraline SERT 0.29 nM (public PMC table). ec50 = 0.29 nM × 306.23 / 1e6.' }],
  },
  {
    slug: 'paroxetine',
    effect_compartment: SSRI_KEO('PMID:27082864', 'Approximation; no published kₑₒ. Arakawa 2016 [11C]DASB single-dose: max SERT occupancy at 4 h (paroxetine 44.6% at 4 h, single 20 mg) — hours-scale equilibration.'),
    receptor_occupancy: [{ receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1.0, ec50_mg_l: 0.0000428, hill_n: 1, source_pmid: 'PMID:27738376', note: 'Nevels 2016 (PMC5044489) Table 1: paroxetine SERT 0.13 nM ("highest known antidepressant affinity for SERT"; public PMC table). ec50 = 0.13 nM × 329.37 / 1e6.' }],
  },
  {
    slug: 'fluvoxamine',
    effect_compartment: SSRI_KEO('PMID:12695316', 'Approximation; no published kₑₒ. Suhara 2003 [11C](+)McN5652: clinical fluvoxamine ≈80% 5-HTT occupancy (ED50 4.19 ng/mL) — CNS occupancy anchor; hours-scale equilibration assumed.'),
    receptor_occupancy: [{ receptor: 'SERT', pathway: 'serotonin_reuptake_inhibition', emax: 1.0, ec50_mg_l: 0.0002515, hill_n: 1, source_pmid: 'PMID:27738376', note: 'Nevels 2016 (PMC5044489) Table 1: fluvoxamine SERT 0.79 nM (public PMC table). ec50 = 0.79 nM × 318.34 / 1e6.' }],
  },
  {
    slug: 'olanzapine',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:9659858', note: 'Approximation; no published kₑₒ. Kapur 1998 PET: olanzapine D2 occupancy 43–80% (5–20 mg) to 83–88% (30–40 mg); near-saturation 5-HT2 — central engagement within hours.' },
    receptor_occupancy: [
      { receptor: 'dopamine_d2', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.021158, hill_n: 1, source_pmid: 'PMID:22726212', note: 'BMC Pharmacology 2012 (PMC3485633, CC BY) Table 1 verbatim: "olanzapine 67.72 ± 9.21" D2 Ki. RAT brain, [3H]spiperone (species flag). ec50 = 67.72 nM × 312.43 / 1e6.' },
      { receptor: '5-HT2A', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.001318, hill_n: 1, source_pmid: 'PMID:22726212', note: 'PMC3485633 Table 1 verbatim: olanzapine 5HT2A "4.22 ± 0.77" nM. Rat brain (species flag). ec50 = 4.22 nM × 312.43 / 1e6.' },
      { receptor: 'H1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.0000406, hill_n: 1, source_pmid: 'PMID:22726212', note: 'PMC3485633 Table 1 verbatim: olanzapine H1 "0.13 ± 0.02" nM. Rat brain (species flag). ec50 = 0.13 nM × 312.43 / 1e6.' },
    ],
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
    console.log(`  [add ] ${c.slug.padEnd(13)} @ ${row.receptor.padEnd(11)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
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
  console.log(`\nWave 3 full-text occupancy: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
