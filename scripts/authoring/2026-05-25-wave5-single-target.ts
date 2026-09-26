/**
 * 2026-05-25-wave5-single-target.ts — single-target occupancy (wave 5).
 *
 * Of 14 targeted, 8 had a Kᵢ/EC50 quotable VERBATIM from a verified abstract
 * (or PMC full-text). NO keo onset anchor surfaced for any this wave, so each
 * keo is a documented approximation leaning on the registry's existing
 * class-keo precedents (β-blockers, opioids, α2A, MT, 5-HT1A) — noted per row.
 * Lights up two new GPCR catalog pages: CB1 (CNR1) and GABA-B (GABBR1).
 *
 * ec50_mg_l = Kᵢ(nM) · MW / 1e6. emax 1.0, hill_n 1.
 *
 * ── Skipped (logged) ───────────────────────────────────────────────────────
 *  oxycodone (MOR band 1–100 nM only; exact paywalled Volpe 2011 → PDF_QUEUE),
 *  naltrexone (only qualitative "~3 nM"), memantine + dextromethorphan (NMDA
 *  voltage-dependent open-channel block — Hill occupancy doesn't apply, per
 *  AUTHORING_GAPS), donepezil + galantamine (AChE IC50 from comparator papers
 *  with species unstated).
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
    slug: 'ramelteon',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:15695169', note: 'Approximation; no published kₑₒ. Ramelteon is a rapid sleep-onset MT1/MT2 agonist (clinical Tmax ~0.75 h); class-typical melatonergic kₑₒ.' },
    receptor_occupancy: [
      { receptor: 'mt1', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.00000363, hill_n: 1, source_pmid: 'PMID:15695169', note: 'Kato 2005 verbatim: "very high affinity for human MT1 (Mel1a) and MT2 (Mel1b) receptors … with Ki values of 14.0, 112, and 23.1 pM, respectively". Human MT1 in CHO. ec50 = 0.014 nM × 259.34 / 1e6.' },
      { receptor: 'mt2', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.0000290, hill_n: 1, source_pmid: 'PMID:15695169', note: 'Kato 2005 verbatim (same quote): human MT2 Kᵢ 112 pM, CHO. ec50 = 0.112 nM × 259.34 / 1e6.' },
    ],
  },
  {
    slug: 'dronabinol',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:17641667', note: 'Approximation; no published kₑₒ. Oral Δ9-THC psychoactive onset ~1–2 h (slow absorption + CNS distribution).' },
    receptor_occupancy: [{ receptor: 'cb1', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.007893, hill_n: 1, source_pmid: 'PMID:17641667', note: 'McPartland 2007 verbatim: "mean Ki values for delta 9-tetrahydrocannabinol differed significantly between HsCB1 and RnCB1 (25.1 and 42.6 nM, respectively)". Human CB1 (meta-analysis). ec50 = 25.1 nM × 314.46 / 1e6.' }],
  },
  {
    slug: 'pindolol',
    effect_compartment: { keo_per_h: 1.0, source_pmid: 'PMID:9536453', note: 'Approximation; no published kₑₒ. Class-typical (5-HT1A / β), cf buspirone 1.0/h; pindolol HR/CNS onset rapid.' },
    receptor_occupancy: [{ receptor: '5-HT1A', pathway: 'partial-agonist', emax: 1.0, ec50_mg_l: 0.001589, hill_n: 1, source_pmid: 'PMID:9536453', note: 'Newman-Tancredi 1998 verbatim: "(-)pindolol exhibits nanomolar affinity at human 5-HT1A receptors expressed in Chinese Hamster Ovary cells (CHO-h5-HT1A; Ki = 6.4 nmol/L)". Weak partial agonist (efficacy 20%). ec50 = 6.4 nM × 248.32 / 1e6.' }],
  },
  {
    slug: 'labetalol',
    effect_compartment: { keo_per_h: 2.5, source_pmid: 'PMID:15655528', note: 'Approximation; no published kₑₒ. Class-typical β-blocker HR endpoint, cf atenolol 2.52/h (PMID 17420778).' },
    receptor_occupancy: [{ receptor: 'beta_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.007698, hill_n: 1, source_pmid: 'PMID:15655528', note: 'Baker 2005 (PMC1576008) Table 1 verbatim: labetalol human β1 logKD −7.63 ± 0.05 → Kᵢ 23.4 nM. Human β1 in CHO, [3H]CGP-12177. ec50 = 23.4 nM × 328.4 / 1e6.' }],
  },
  {
    slug: 'nadolol',
    effect_compartment: { keo_per_h: 2.5, source_pmid: 'PMID:15655528', note: 'Approximation; no published kₑₒ. Class-typical β-blocker HR endpoint, cf atenolol 2.52/h (PMID 17420778).' },
    receptor_occupancy: [{ receptor: 'beta_1', pathway: 'antagonist', emax: 1.0, ec50_mg_l: 0.018218, hill_n: 1, source_pmid: 'PMID:15655528', note: 'Baker 2005 (PMC1576008) Table 1 verbatim: nadolol human β1 logKD −7.23 ± 0.04 → Kᵢ 58.9 nM. Human β1 in CHO. ec50 = 58.9 nM × 309.4 / 1e6.' }],
  },
  {
    slug: 'tapentadol',
    effect_compartment: { keo_per_h: 2.0, source_pmid: 'PMID:17656655', note: 'Approximation; no published kₑₒ. Class-typical opioid analgesia onset, cf hydrocodone 2.0/h.' },
    receptor_occupancy: [{ receptor: 'mu_opioid', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.022134, hill_n: 1, source_pmid: 'PMID:17656655', note: 'Tzschentke 2007 verbatim: "novel micro-opioid receptor (MOR) agonist (Ki = 0.1 microM; relative efficacy compared with morphine 88% …)". Rat brain MOR (species flag). ec50 = 100 nM × 221.34 / 1e6.' }],
  },
  {
    slug: 'baclofen',
    effect_compartment: { keo_per_h: 0.5, source_pmid: 'PMID:23973998', note: 'Approximation; no published kₑₒ. Baclofen antispasticity onset ~hours (oral).' },
    receptor_occupancy: [{ receptor: 'gaba_b', pathway: 'agonist', emax: 1.0, ec50_mg_l: 1.23923, hill_n: 1, source_pmid: 'PMID:23973998', note: 'Attia 2013 (PMC full-text): baclofen reference GABA-B EC50 5.8 µM, Fluo-4 Ca²⁺ assay, rat GABAB1b/B2 in tsA201 (species flag; from PMC full text, not the abstract). ec50 = 5800 nM × 213.66 / 1e6.' }],
  },
  {
    slug: 'guanfacine',
    effect_compartment: { keo_per_h: 0.7, source_pmid: 'PMID:1356570', note: 'Approximation; no published kₑₒ. Class-typical α2A, cf clonidine 0.99/h; guanfacine BP/sedation onset over hours.' },
    receptor_occupancy: [{ receptor: 'alpha_2a', pathway: 'agonist', emax: 1.0, ec50_mg_l: 0.004897, hill_n: 1, source_pmid: 'PMID:1356570', note: 'Uhlén 1992 verbatim: "The Kds of guanfacine were 19.9 and 344 nM, respectively" (α2A, α2C). Rat cerebral cortex, [3H]MK-912 (species flag; Kd). ec50 = 19.9 nM × 246.09 / 1e6.' }],
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
  console.log(`\nWave 5 single-target: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
