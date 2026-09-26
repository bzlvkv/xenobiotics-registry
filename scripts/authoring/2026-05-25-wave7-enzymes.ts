/**
 * 2026-05-25-wave7-enzymes.ts — enzyme-target "block occupancy" (wave 7).
 *
 * 10 of 16 authorable from verified abstracts. Enzyme inhibition modelled as
 * occupancy (fraction of enzyme inhibited) via IC50/Ki — same shape as the
 * authored COX/AChE/PDE5/5AR entries. keo here is the enzyme-inhibition
 * equilibration (drug inhibits the enzyme roughly as it circulates); the
 * downstream clinical effect (LDL, urate, glucose, anticoagulation) is slower
 * and is NOT what the occupancy curve shows — noted per row.
 *
 * ec50_mg_l = IC50/Ki(nM) · MW / 1e6. emax 1.0, hill_n 1, pathway 'inhibitor'.
 *
 * ── Skipped (logged) ───────────────────────────────────────────────────────
 *  atorvastatin, simvastatin (HMGCR nM only in paywalled Istvan/Deisenhofer
 *  Science 2001 — abstract has no per-compound number), dapagliflozin (SGLT2
 *  EC50 table-only), lisinopril (ACE Kᵢ not abstract-quotable), exemestane +
 *  rasagiline (IRREVERSIBLE inhibitors — reversible Hill occupancy doesn't fit,
 *  cf MAO/bergamottin), febuxostat is bovine/rodent (flagged, authored).
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

const mk = (slug: string, keo: number, keoPmid: string, keoNote: string, receptor: string, ec50: number, pmid: string, note: string): Authoring => ({
  slug,
  effect_compartment: { keo_per_h: keo, source_pmid: keoPmid, note: keoNote },
  receptor_occupancy: [{ receptor, pathway: 'inhibitor', emax: 1.0, ec50_mg_l: ec50, hill_n: 1, source_pmid: pmid, note }],
});

const ENTRIES: Authoring[] = [
  mk('rosuvastatin', 1.0, 'PMID:12773150', 'Approximation; no published kₑₒ. Hepatic HMGCR inhibition equilibrates ~with plasma; LDL effect is downstream (weeks).',
     'hmgcr', 0.000482, 'PMID:12773150', 'Holdgate 2003 verbatim: "an initial complex [inhibition constant ... K(i), approximately 1 nM] ... K(i)*, approximately 0.1 nM". Recombinant human HMG-CoAR catalytic fragment, reversible. ec50 = 1 nM × 481.54 / 1e6 (initial Ki).'),
  mk('febuxostat', 1.0, 'PMID:8243554', 'Approximation; no published kₑₒ. XO inhibition fast; urate-lowering downstream.',
     'xanthine_oxidase', 0.000443, 'PMID:8243554', 'Osada 1993 verbatim: "TEI-6720 ... inhibit bovine milk xanthine oxidase ... IC50 values of 1.4, 1.8 and 2.2 nM". Bovine/rodent (species flag; no human value in abstract). ec50 = 1.4 nM × 316.37 / 1e6.'),
  mk('sitagliptin', 1.0, 'PMID:15634008', 'Approximation; no published kₑₒ. DPP-4 inhibition fast; incretin/glucose effect downstream.',
     'dpp4', 0.007332, 'PMID:15634008', 'Kim 2005 verbatim: "a potent, orally active DPP-IV inhibitor (IC50 = 18 nM)" (compound 1 = sitagliptin). Human DPP-IV. ec50 = 18 nM × 407.31 / 1e6.'),
  mk('linagliptin', 1.0, 'PMID:18223196', 'Approximation; no published kₑₒ. DPP-4 inhibition fast; very slow off-rate (koff 3e-5/s) gives long duration.',
     'dpp4', 0.000473, 'PMID:18223196', 'Thomas 2008 verbatim: "BI 1356 inhibited DPP-4 activity in vitro with an IC(50) of approximately 1 nM ... a K(i) of 1 nM". (linagliptin). ec50 = 1 nM × 472.54 / 1e6.'),
  mk('empagliflozin', 1.0, 'PMID:21985634', 'Approximation; no published kₑₒ. Binding half-life ~1 h (competitive with glucose); glucosuria downstream.',
     'sglt2', 0.001398, 'PMID:21985634', 'Grempler 2012 verbatim: "Empagliflozin has an IC(50) of 3.1 nM for hSGLT-2." Human SGLT-2, [14C]-AMG uptake. ec50 = 3.1 nM × 450.91 / 1e6.'),
  mk('letrozole', 0.5, 'PMID:2149502', 'Approximation; no published kₑₒ. Aromatase inhibition fast; estrogen suppression downstream.',
     'aromatase', 0.003281, 'PMID:2149502', 'Bhatnagar 1990 verbatim: "CGS 20267 ... potently inhibits aromatase in vitro (IC50 of 11.5 nM)". Reversible (species unstated in abstract). ec50 = 11.5 nM × 285.3 / 1e6.'),
  mk('anastrozole', 0.5, 'PMID:8903429', 'Approximation; no published kₑₒ. Aromatase inhibition fast; estrogen suppression downstream.',
     'aromatase', 0.004401, 'PMID:8903429', 'Dukes 1996 verbatim: "inhibits human placental aromatase with an IC50 of 15 nM". Human placental aromatase, reversible. ec50 = 15 nM × 293.37 / 1e6.'),
  mk('apixaban', 2.0, 'PMID:18315548', 'Approximation; no published kₑₒ. Anticoagulant effect tracks plasma FXa inhibition (fast).',
     'factor_xa', 0.0000368, 'PMID:18315548', 'Wong 2008 verbatim: "apixaban is potent and selective, with a K(i) of 0.08 nm for human FXa". Human FXa, reversible competitive. ec50 = 0.08 nM × 459.5 / 1e6.'),
  mk('rivaroxaban', 2.0, 'PMID:15748242', 'Approximation; no published kₑₒ. Anticoagulant effect tracks plasma FXa inhibition (fast).',
     'factor_xa', 0.000174, 'PMID:15748242', 'Perzborn 2005 verbatim: "BAY 59-7939 competitively inhibits human FXa (K(i) 0.4 nm)". Human FXa, reversible competitive. ec50 = 0.4 nM × 435.88 / 1e6.'),
  mk('acetazolamide', 1.0, 'PMID:30878812', 'Approximation; no published kₑₒ. CA-II inhibition fast.',
     'carbonic_anhydrase', 0.002667, 'PMID:30878812', 'Supuran-group reference: acetazolamide (AAZ) human hCA II "KI, 12.0 nM", stopped-flow CO2 hydration. ec50 = 12 nM × 222.24 / 1e6.'),
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
    console.log(`  [add ] ${c.slug.padEnd(14)} @ ${row.receptor.padEnd(18)} ec50=${row.ec50_mg_l} mg/L  ${row.source_pmid}`);
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
  console.log(`\nWave 7 enzymes: +${occAdded} occupancy rows, +${keoAdded} keo (${occSkipped} already authored).`);
}

main();
