/**
 * 2026-05-25-wave12-monoclonals.ts — monoclonal antibody / fusion target occupancy.
 *
 * mAbs were missed by all earlier probes (no MW on file). 13 of 22 had a
 * verbatim KD/Ki (SPR, usually picomolar). MODELLING NOTE: most mAb targets are
 * SOLUBLE ligands/cytokines (TNF-α, IL-17A, IL-23, IgE) — so the Hill curve here
 * is "fraction of circulating target bound/neutralised", not classic receptor
 * occupancy; PD-1 and the CGRP receptor are cell-surface (true receptor binding).
 * Each note states the target type. Nominal IgG MW (~148 kDa; glycosylation-
 * dependent) is backfilled. kₑₒ ≈ 0.02/h — mAb t½ is weeks; target coverage
 * builds over the dosing interval.
 *
 * ec50_mg_l = KD(nM) · MW / 1e6. emax 1.0, hill_n 1.
 *
 * ── Skipped (KD in package inserts / full-text tables, not abstracts) ──────
 *  alirocumab, evolocumab (PCSK9), atezolizumab (PD-L1), fremanezumab,
 *  galcanezumab (CGRP ligand), dupilumab (IL-4Rα), denosumab (RANKL),
 *  rituximab (CD20), trastuzumab (HER2).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; mw_g_mol?: number; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Authoring { slug: string; mw: number; receptor: string; pathway: string; ec50: number; pmid: string; note: string; }

const KEO = (pmid: string): EffectCompartment => ({ keo_per_h: 0.02, source_pmid: pmid, note: 'Approximation; no published kₑₒ. mAb/fusion — plasma t½ is weeks; target binding/neutralisation builds over the (weekly–monthly) dosing interval — very slow effective kₑₒ.' });

const ENTRIES: Authoring[] = [
  { slug: 'adalimumab', mw: 148000, receptor: 'tnf_alpha', pathway: 'neutralizer', ec50: 0.018796, pmid: 'PMID:20519961', note: 'Shealy 2010 verbatim: "significantly greater than that of adalimumab (127 pM ...)" — SPR KD to SOLUBLE human TNF-α. Soluble-ligand neutralisation. ec50 = 0.127 nM × 148000 / 1e6.' },
  { slug: 'golimumab', mw: 148000, receptor: 'tnf_alpha', pathway: 'neutralizer', ec50: 0.002664, pmid: 'PMID:20519961', note: 'Shealy 2010 verbatim: "affinity of golimumab for soluble human TNFα ... (18 pM ...)" by SPR. Soluble-ligand neutralisation. ec50 = 0.018 nM × 148000 / 1e6.' },
  { slug: 'infliximab', mw: 148000, receptor: 'tnf_alpha', pathway: 'neutralizer', ec50: 0.006512, pmid: 'PMID:20519961', note: 'Shealy 2010 verbatim: "greater than that of infliximab (44 pM)" by SPR, soluble human TNF-α. Soluble-ligand neutralisation. ec50 = 0.044 nM × 148000 / 1e6.' },
  { slug: 'etanercept', mw: 150000, receptor: 'tnf_alpha', pathway: 'neutralizer', ec50: 0.00165, pmid: 'PMID:20519961', note: 'Shealy 2010 verbatim: etanercept soluble-TNFα SPR KD "11 pM". TNFR2-Fc fusion (dimer ~150 kDa); soluble-ligand neutralisation. ec50 = 0.011 nM × 150000 / 1e6.' },
  { slug: 'nivolumab', mw: 148000, receptor: 'pd_1', pathway: 'antagonist', ec50: 0.471528, pmid: 'PMID:31402780', note: 'Wang 2019 verbatim: "KD of sintilimab, MDX-1106, and MK-3475 was 74 pM, 3186 pM and 1785 pM" — MDX-1106 = nivolumab, KD 3186 pM, SPR to cell-surface PD-1. ec50 = 3.186 nM × 148000 / 1e6.' },
  { slug: 'pembrolizumab', mw: 148000, receptor: 'pd_1', pathway: 'antagonist', ec50: 0.26418, pmid: 'PMID:31402780', note: 'Wang 2019 verbatim: MK-3475 = pembrolizumab, KD 1785 pM, SPR to PD-1 (cell-surface receptor). ec50 = 1.785 nM × 148000 / 1e6.' },
  { slug: 'erenumab', mw: 148000, receptor: 'cgrp_receptor', pathway: 'antagonist', ec50: 0.00296, pmid: 'PMID:26559125', note: 'Shi 2016 verbatim: "AMG 334 competes with [(125)I]-CGRP binding to the human CGRP receptor, with a Ki of 0.02 nM". CGRP receptor = CALCRL/RAMP1 (cell-surface GPCR). Value is a Ki. ec50 = 0.02 nM × 148000 / 1e6.' },
  { slug: 'omalizumab', mw: 148000, receptor: 'ige', pathway: 'neutralizer', ec50: 0.393532, pmid: 'PMID:31913280', note: 'Gasser 2020 (PMC6949303) Table 1: omalizumab IgG SPR KD to free human IgE = 2659 pM. Soluble-IgE neutralisation. ec50 = 2.659 nM × 148000 / 1e6.' },
  { slug: 'guselkumab', mw: 148000, receptor: 'il23_p19', pathway: 'neutralizer', ec50: 0.00518, pmid: 'PMID:34460338', note: 'Zhou 2021 verbatim: "Risankizumab and guselkumab exhibited high affinity to human scIL-23 with mean KDs of 21 pM and 35 pM, respectively" — guselkumab 35 pM, SPR. Soluble IL-23 (p19) neutralisation. ec50 = 0.035 nM × 148000 / 1e6.' },
  { slug: 'risankizumab', mw: 148000, receptor: 'il23_p19', pathway: 'neutralizer', ec50: 0.003108, pmid: 'PMID:34460338', note: 'Zhou 2021 verbatim: risankizumab scIL-23 SPR KD 21 pM (originator Singh 2015 PMID 25905918: "<10 pM"). Soluble IL-23 (p19) neutralisation. ec50 = 0.021 nM × 148000 / 1e6.' },
  { slug: 'ustekinumab', mw: 148000, receptor: 'il12_23_p40', pathway: 'neutralizer', ec50: 0.015688, pmid: 'PMID:34460338', note: 'Zhou 2021 verbatim: "ustekinumab ... mean KDs of ... 106 pM" to scIL-23 (binds shared p40 subunit). SPR. Soluble IL-12/IL-23 (p40) neutralisation. ec50 = 0.106 nM × 148000 / 1e6.' },
  { slug: 'secukinumab', mw: 148000, receptor: 'il17a', pathway: 'neutralizer', ec50: 0.019092, pmid: 'PMID:32973785', note: 'Adams 2020 (PMC7473305) Table 3: secukinumab IL-17A SPR KD 129 pM (footnote "internal and published" — provenance caveat). Soluble IL-17A neutralisation. ec50 = 0.129 nM × 148000 / 1e6.' },
  { slug: 'ixekizumab', mw: 148000, receptor: 'il17a', pathway: 'neutralizer', ec50: 0.0002664, pmid: 'PMID:27143947', note: 'Liu 2016 verbatim: "equilibrium dissociation constants (KD) of ixekizumab for human and cynomolgus monkey IL-17A were 1.8 pM and 0.8 pM". Soluble IL-17A neutralisation. ec50 = 0.0018 nM × 148000 / 1e6.' },
];

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let occ = 0, keo = 0, mw = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    if (c.mw_g_mol == null) { c.mw_g_mol = a.mw; mw++; }
    if (c.effect_compartment?.keo_per_h == null) { c.effect_compartment = KEO(a.pmid); addRef(c, a.pmid); keo++; }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    if (!c.receptor_occupancy.find(r => r.receptor === a.receptor)) {
      c.receptor_occupancy.push({ receptor: a.receptor, pathway: a.pathway, emax: 1.0, ec50_mg_l: a.ec50, hill_n: 1, source_pmid: a.pmid, note: a.note });
      addRef(c, a.pmid); occ++;
      console.log(`  [add ] ${a.slug.padEnd(14)} @ ${a.receptor.padEnd(13)} ec50=${a.ec50} mg/L  ${a.pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 12 monoclonals: +${occ} occupancy rows, +${keo} keo, +${mw} MW.`);
}

main();
