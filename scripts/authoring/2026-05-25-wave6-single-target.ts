/**
 * 2026-05-25-wave6-single-target.ts — single-target occupancy (wave 6).
 *
 * 8 of 11 authorable from verified abstracts/PMC. Two new enzyme targets
 * (PDE5, 5α-reductase) — "block occupancy" via IC50, same shape as the
 * authored COX/AChE-class entries. keo is documented-approximation (no onset
 * anchors surfaced; class precedents / clinical onset noted per row).
 *
 * ec50_mg_l = Kᵢ/IC50(nM) · MW / 1e6. emax 1.0, hill_n 1.
 *
 * ── Skipped (logged) ───────────────────────────────────────────────────────
 *  eszopiclone (only IC50 21 nM for (+)-zopiclone, subtype-unspecified, not
 *  Kᵢ), codeine (MOR only ">100 nM" band — exact in paywalled Volpe 2011,
 *  PDF_QUEUE row 16), clomipramine (hSERT ~0.6 nM in PMC2665081 Table 1 but
 *  the exact decimal couldn't be locked from the render — needs direct read).
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
    slug: 'nicotine',
    effect_compartment: { keo_per_h: 3.0, source_pmid: 'PMID:9882698', note: 'Approximation; no published kₑₒ. Rapid CNS nicotinic engagement (smoking-derived plasma spikes act within minutes).' },
    receptor_occupancy: [{ receptor: 'nachr_a4b2', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.0000649, hill_n: 1, source_pmid: 'PMID:9882698', note: 'Sabey 1999 verbatim: "[3H]nicotine ... single class of high-affinity sites (dissociation constants 0.1 nM and 0.4 nM, respectively)" — nicotine Kd 0.4 nM. Rat α4β2 in HEK293 (species flag; Kd, not Ki). ec50 = 0.4 nM × 162.23 / 1e6.' }],
  },
  {
    slug: 'zolpidem',
    effect_compartment: { keo_per_h: 6.0, source_pmid: 'PMID:10454469', note: 'Approximation; no published kₑₒ. Z-drug rapid sleep onset (cf zaleplon 35.9/h); fast BZ-site equilibration.' },
    receptor_occupancy: [{ receptor: 'gaba_a_bzd', pathway: 'sedation', emax: 1.0, ec50_mg_l: 0.007685, hill_n: 1, source_pmid: 'PMID:10454469', note: 'Araujo 1999 verbatim: high-affinity site "25.0 +/- 7.0 nM ... for zolpidem" at anti-α1 immunoprecipitated GABA-A. Rat hippocampus, [3H]flunitrazepam (species flag; multi-site, high-affinity component). ec50 = 25 nM × 307.4 / 1e6.' }],
  },
  {
    slug: 'loperamide',
    effect_compartment: { keo_per_h: 2.0, source_pmid: 'PMID:10087042', note: 'Approximation; no published kₑₒ. Opioid-class onset; loperamide is gut-selective (poor CNS penetration) so the systemic curve reflects peripheral MOR.' },
    receptor_occupancy: [{ receptor: 'mu_opioid', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.001431, hill_n: 1, source_pmid: 'PMID:10087042', note: 'verbatim: "Loperamide exhibited potent affinity and selectivity for the cloned micro (Ki = 3 nM) ... human opioid receptors". Human cloned MOR in CHO. ec50 = 3 nM × 477.04 / 1e6.' }],
  },
  {
    slug: 'metoclopramide',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:12593651', note: 'Approximation; no published kₑₒ. Class-typical D2 antagonist, cf haloperidol 0.5/h.' },
    receptor_occupancy: [{ receptor: 'dopamine_d2', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.13311, hill_n: 1, source_pmid: 'PMID:12593651', note: 'verbatim: "metoclopramide (dopamine D(2) receptor; 23.3 nM vs 444 nM ...)" — metoclopramide D2 Kᵢ 444 nM. Rat striatum (species flag). ec50 = 444 nM × 299.8 / 1e6.' }],
  },
  {
    slug: 'doxepin',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:6146381', note: 'Approximation; no published kₑₒ. H1-mediated sedation onset; class-typical antihistamine.' },
    receptor_occupancy: [{ receptor: 'H1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.0000866, hill_n: 1, source_pmid: 'PMID:6146381', note: 'Kanba & Richelson 1984 verbatim: "high-affinity binding site with a dissociation constant (KD +/- S.E.M.) of 3.1 +/- 0.3 X 10(-10) M ... identified as histamine H1 receptors". Human brain (Kd 0.31 nM). ec50 = 0.31 nM × 279.38 / 1e6.' }],
  },
  {
    slug: 'sildenafil',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:9598563', note: 'Approximation; no published kₑₒ. PDE5-mediated cavernosal/vascular relaxation onset ~1 h (oral).' },
    receptor_occupancy: [{ receptor: 'pde5', pathway: 'inhibitor', emax: 1.0, ec50_mg_l: 0.001661, hill_n: 1, source_pmid: 'PMID:9598563', note: 'Ballard 1998 verbatim: "sildenafil ... inhibiting PDE5 from HCC with a geometric mean IC50 of 3.5 nM". Human corpus cavernosum PDE5, [3H]cGMP hydrolysis (IC50, enzyme block). ec50 = 3.5 nM × 474.58 / 1e6.' }],
  },
  {
    slug: 'tadalafil',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:23937247', note: 'Approximation; no published kₑₒ. Long-acting PDE5 inhibitor (slow offset; effect over many hours).' },
    receptor_occupancy: [{ receptor: 'pde5', pathway: 'inhibitor', emax: 1.0, ec50_mg_l: 0.000915, hill_n: 1, source_pmid: 'PMID:23937247', note: 'Wang 2013 verbatim: "The IC50 of TPN729MA, sildenafil, and tadalafil for PDE5 was 2.28, 5.22, and 2.35 nM, respectively". Human recombinant PDE5 (IC50). ec50 = 2.35 nM × 389.4 / 1e6.' }],
  },
  {
    slug: 'finasteride',
    effect_compartment: { keo_per_h: 0.05, source_pmid: 'PMID:9605412', note: 'Approximation; no published kₑₒ. Prostatic DHT suppression builds over days — very slow effective onset.' },
    receptor_occupancy: [{ receptor: 'srd5a2', pathway: 'inhibitor', emax: 1.0, ec50_mg_l: 0.004210, hill_n: 1, source_pmid: 'PMID:9605412', note: 'di Salle 1998 verbatim: "finasteride (IC50 values of 313 and 11.3 nM)" for human recombinant 5α-reductase type I and II — type II 11.3 nM. ec50 = 11.3 nM × 372.55 / 1e6.' }],
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
    console.log(`  [add ] ${c.slug.padEnd(14)} @ ${row.receptor.padEnd(12)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
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
  console.log(`\nWave 6 single-target: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
