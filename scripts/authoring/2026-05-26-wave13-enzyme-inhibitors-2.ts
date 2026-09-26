/**
 * 2026-05-26-wave13-enzyme-inhibitors-2.ts — enzyme-inhibitor occupancy (wave 13).
 *
 * Round 2 of enzyme-target "block occupancy" (cf. wave 7). A gap-audit surfaced
 * three reversible-inhibitor clusters never probed: phosphodiesterases (PDE3/4/5),
 * extra carbonic-anhydrase inhibitors, and the remaining gliptins/gliflozins.
 * 10 of 13 authorable from VERBATIM abstract/open-access values (each PMID
 * re-fetched and confirmed 2026-05-26). Enzyme inhibition modelled as occupancy
 * (fraction of enzyme inhibited) via IC50/Ki — same shape as wave 7.
 *
 * NEW occupancy keys: pde4, pde3 (pde5/carbonic_anhydrase/dpp4/sglt2 already
 * exist). Non-GPCR enzyme targets resolve by their occupancy key — no catalog
 * entry needed (see apps/app/src/lib/receptors.ts header).
 *
 * ec50_mg_l = IC50/Ki(nM) · MW / 1e6. emax 1.0, hill_n 1, pathway 'inhibitor'.
 * keo here is the enzyme-inhibition equilibration (drug inhibits the enzyme
 * roughly as it circulates); the downstream clinical effect (erection, anti-
 * inflammatory cytokine suppression, IOP, glucose/incretin) is slower and is
 * NOT what the occupancy curve shows — noted per row.
 *
 * ── Skipped (logged in AUTHORING_GAPS) ─────────────────────────────────────
 *  dipyridamole (primary action is adenosine ENT uptake, Ki ~8 nM; its cGMP-PDE
 *    IC50 is µM-range and not abstract-quotable as a clean number),
 *  crisaborole (PDE4 IC50 ~0.49 µM / Ki ~173 nM are table-only in paywalled
 *    full text; abstracts state only "competitive, reversible … submicromolar"),
 *  dapagliflozin (hSGLT2 EC50 1.1 nM is table-only in the paywalled Meng 2008
 *    originator — abstracts say only "potent and selective hSGLT2 inhibitor";
 *    re-confirms the wave-7 table-only flag).
 *
 * ── Modelling notes ─────────────────────────────────────────────────────────
 *  apremilast — abstract gives a verbatim RANGE (IC50 10–100 nM across PDE4
 *    sub-families A1A/B1/B2/C1/D2), not a single point; modelled at the
 *    conservative upper bound (100 nM) so the drug's effect is not overstated.
 *  topiramate / zonisamide — CA inhibition is a SECONDARY/off-target effect
 *    (their primary anticonvulsant action is Na+/Ca²⁺ channel block); flagged.
 *  zonisamide — the abstract reports BOTH a classical-assay Ki (10.3 µM, 15-min
 *    incubation) and a prolonged-preincubation Ki (35.2 nM, 1 h). Modelled at
 *    the 1-h equilibrium value (35.2 nM) — closer to the in-vivo steady state
 *    where the drug sits at the enzyme for hours — with both quoted in the note.
 *  dorzolamide — topical ocular; red-cell/ocular-tissue accumulation over ~8 d,
 *    so a slow kₑₒ (ocular tissue compartment, not fast plasma onset).
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
  // ── Phosphodiesterases ──────────────────────────────────────────────────
  mk('vardenafil', 1.0, 'PMID:11890515', 'Approximation; no published kₑₒ. PDE5 inhibition tracks plasma (fast); clinical erectile onset is rapid (~15–25 min, cf. sildenafil).',
     'pde5', 0.000342, 'PMID:11890515', 'Saenz de Tejada 2001 verbatim: "Vardenafil specifically inhibited the hydrolysis of cGMP by PDE5 with an IC50 of 0.7 nM". PDE5 purified from human platelets; reversible cGMP-site competitive. ec50 = 0.7 nM × 488.6 / 1e6.'),
  mk('apremilast', 1.0, 'PMID:24882690', 'Approximation; no published kₑₒ. PDE4 inhibition fast (tracks plasma; oral Tmax ~2.5 h); anti-inflammatory cytokine suppression is downstream.',
     'pde4', 0.04605, 'PMID:24882690', 'Schafer 2014 verbatim: "Apremilast inhibited PDE4 isoforms from all four sub-families (A1A, B1, B2, C1, and D2), with IC50 values in the range of 10 to 100 nM." Recombinant human PDE4, reversible. Modelled at the conservative upper bound: ec50 = 100 nM × 460.5 / 1e6.'),
  mk('roflumilast', 1.0, 'PMID:11259554', 'Approximation; no published kₑₒ. PDE4 enzyme binding is fast; the active N-oxide sustains inhibition and the clinical anti-inflammatory effect is slow (days–weeks) downstream — an effect lag, not a plasma-equilibration lag.',
     'pde4', 0.000323, 'PMID:11259554', 'Hatzelmann 2001 verbatim: "It inhibits PDE4 activity from human neutrophils with an IC(50) of 0.8 nM without affecting PDE1". Human-neutrophil PDE4, reversible competitive. ec50 = 0.8 nM × 403.21 / 1e6.'),
  mk('cilostazol', 1.0, 'PMID:12180353', 'Approximation; no published kₑₒ. PDE3 inhibition fast (plus an adenosine-uptake component); antiplatelet/vasodilator effect builds over hours.',
     'pde3', 0.073892, 'PMID:12180353', 'Schrör 2002 (review) verbatim: "The compound is a potent inhibitor of phosphodiesterase (PDE) 3A, the isoform of PDE 3 in the cardiovascular system (IC50: 0.2 microM)." Reversible PDE3 inhibitor; review-level quote (flagged). ec50 = 200 nM × 369.46 / 1e6.'),
  // ── Carbonic anhydrase (extra inhibitors; acetazolamide already in wave 7) ─
  mk('dorzolamide', 0.1, 'PMID:9029437', 'Approximation; no published kₑₒ. Topical ocular agent — red-cell/ocular-tissue accumulation over ~8 days to reach the CA-II site concentration → slow tissue compartment, not a fast plasma onset.',
     'carbonic_anhydrase', 0.002595, 'PMID:9029437', 'Maren 1997 verbatim: "the equilibrium expression for KI of dorzolamide against CA II at 37 degrees C, as 8 x 10(-9) M" (= 8 nM, human CA II). Reversible competitive sulfonamide. ec50 = 8 nM × 324.43 / 1e6.'),
  mk('topiramate', 1.0, 'PMID:10768298', 'Approximation; no published kₑₒ. CA inhibition fast; SECONDARY target — oral Tmax ~2–4 h.',
     'carbonic_anhydrase', 2.37552, 'PMID:10768298', 'Dodgson 2000 verbatim: "Topiramate Ki values for HCA I, HCA II, HCA IV, and HCA VI were approximately 100, 7, 10, and >100 microM, respectively." hCA II = 7 µM (18O/pH assay). SECONDARY/off-target — topiramate\'s primary anticonvulsant action is Na+/Ca²⁺ channel block; CA inhibition drives side effects (paresthesia, stones). The Supuran group calls it "low nanomolar" (PMID:12617904) but gives no abstract-quotable nM, so the verbatim 7 µM is used. ec50 = 7000 nM × 339.36 / 1e6.'),
  mk('zonisamide', 1.0, 'PMID:15837316', 'Approximation; no published kₑₒ. CA inhibition fast; SECONDARY/weak target — oral Tmax ~2–6 h.',
     'carbonic_anhydrase', 0.007471, 'PMID:15837316', 'De Simone 2005 verbatim: under classical 15-min CO2-hydrase conditions "a K(I) of 10.3 microM has been obtained"; with 1 h enzyme–inhibitor preincubation "the obtained K(I) was of 35.2 nM" (human cytosolic CA II). SECONDARY/weak target (primary action is Na+/T-type Ca²⁺ channel block). Modelled at the 1-h equilibrium value (35.2 nM), closer to in-vivo steady state. ec50 = 35.2 nM × 212.23 / 1e6.'),
  // ── Gliptins / gliflozins (siblings of sitagliptin/linagliptin/empagliflozin) ─
  mk('saxagliptin', 1.0, 'PMID:22475049', 'Approximation; no published kₑₒ. DPP-4 inhibition fast; slow-binding (covalent-but-reversible, dissociation t½ 50 min) prolongs target engagement. Incretin/glucose effect downstream.',
     'dpp4', 0.000410, 'PMID:22475049', 'Wang 2012 verbatim: "Saxagliptin and its active metabolite (5-hydroxysaxagliptin) are potent inhibitors of human DPP4 with prolonged dissociation from its active site (Ki = 1.3 nM and 2.6 nM, t1/2 = 50 and 23 minutes respectively at 37°C)." Covalent-but-reversible slow-binding at Ser630. ec50 = 1.3 nM × 315.41 / 1e6.'),
  mk('alogliptin', 1.0, 'PMID:18538760', 'Approximation; no published kₑₒ. Plasma DPP-4 inhibition observed within 15 min of an oral dose; incretin/glucose effect downstream.',
     'dpp4', 0.002342, 'PMID:18538760', 'Lee 2008 verbatim: "Alogliptin potently inhibited human DPP-4 in vitro (mean IC(50), ~ 6.9 nM)"; "plasma DPP-4 inhibition was observed within 15 min". Noncovalent reversible (quinazolinone). ec50 = 6.9 nM × 339.39 / 1e6.'),
  mk('canagliflozin', 1.0, 'PMID:27189972', 'Approximation; no published kₑₒ. SGLT2 inhibition fast (competitive with glucose); urinary-glucose/threshold effect tracks plasma exposure (same-day onset).',
     'sglt2', 0.001778, 'PMID:27189972', 'Ohgaki 2016 verbatim: "Inhibition constant (Ki) values for SGLT1 and SGLT2 were 770.5 and 4.0 nM, respectively." Human SGLT2-expressing cells; reversible competitive. ec50 = 4.0 nM × 444.52 / 1e6.'),
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
  let keoN = 0, occN = 0, skipN = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    const r = apply(c, a);
    if (r.keo) keoN++;
    occN += r.occ; skipN += r.skip;
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 13 enzyme inhibitors: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
