/**
 * 2026-05-26-wave14-nsaid-cox.ts — NSAID cyclooxygenase occupancy (wave 14).
 *
 * Extends the existing COX rows (ibuprofen COX-1/2, celecoxib COX-2,
 * acetaminophen COX-2) to four more NSAIDs. COX inhibition modelled as
 * occupancy (fraction of enzyme inhibited) via IC50 — same shape as wave 7.
 *
 * 4 of 6 authorable. COX IC50 is HIGHLY assay-dependent (purified enzyme vs
 * cell-based vs human whole-blood assay [WBA]); the human WBA is the most
 * clinically relevant, so every authored value here is a HUMAN WHOLE-BLOOD
 * IC50, keeping the four compounds mutually comparable. Each PMID/quote/author
 * was re-fetched and confirmed 2026-05-26.
 *
 * ec50_mg_l = IC50(µM) · MW / 1000. emax 1.0, hill_n 1, pathway 'antiinflammatory'.
 * keo here is the enzyme-inhibition equilibration (fast, tracks plasma); the
 * analgesic/anti-inflammatory clinical effect is downstream — documented
 * approximation anchored to oral Tmax (no published kₑₒ for any).
 *
 * ── Skipped (logged in AUTHORING_GAPS) ─────────────────────────────────────
 *  indomethacin — the only abstract-quotable value (Laufer 1999 PMID:10219655:
 *    PGHS-1 0.002 µM / PGHS-2 0.43 µM, 200× COX-1-selective) is a CELL-BASED
 *    (isolated mononuclear-cell) assay; that 200× selectivity is an artifact
 *    that collapses toward ~1 in human whole blood. Authoring it next to four
 *    WBA values would make it look artifactually ~1000× more COX-1-potent than
 *    naproxen. SKIP pending a true human-WBA indomethacin IC50.
 *  aspirin — IRREVERSIBLE COX acetylator (Ser-530 COX-1). A reversible Hill
 *    occupancy doesn't fit (cf. exemestane/rasagiline/bergamottin). The only
 *    quotable number (Ouellet 2001, washed-platelet residual reversible IC50
 *    1.3 µM) is not the operative steady-state acetylation mechanism. SKIP.
 *
 * ── Assay caveat (Blain 2002) ───────────────────────────────────────────────
 *  diclofenac + meloxicam values come from Blain 2002, whose own thesis is that
 *  the in-vitro WBA IC50 RATIO overstates clinical COX-2 selectivity (oral
 *  diclofenac inhibits COX-1 ~70% in vivo). The absolute IC50s are valid WBA
 *  measurements; the selectivity caveat is noted per row.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Row { receptor: string; ec50: number; pmid: string; note: string; }
interface Authoring { slug: string; keo: number; keoPmid: string; keoNote: string; rows: Row[]; }

const row = (receptor: string, ec50: number, pmid: string, note: string): Row => ({ receptor, ec50, pmid, note });

const ENTRIES: Authoring[] = [
  {
    slug: 'naproxen', keo: 0.5, keoPmid: 'PMID:18397691',
    keoNote: 'Approximation; no published kₑₒ. COX inhibition tracks plasma; analgesic effect downstream. Oral Tmax ~2–4 h.',
    rows: [
      row('cox_1', 8.16962, 'PMID:18397691', 'Hinz 2008 verbatim: "ex vivo IC50 values of 35.48 micromol/l (COX-1) and 64.62 micromol/l (COX-2)". Human whole-blood ex vivo (coagulation TXB2 = COX-1), reversible competitive. ec50 = 35.48 µM × 230.26 / 1000.'),
      row('cox_2', 14.8794, 'PMID:18397691', 'Hinz 2008 verbatim: "ex vivo IC50 values of 35.48 micromol/l (COX-1) and 64.62 micromol/l (COX-2)". Human whole-blood ex vivo (LPS-induced PGE2 = COX-2), reversible. ec50 = 64.62 µM × 230.26 / 1000.'),
    ],
  },
  {
    slug: 'diclofenac', keo: 1.0, keoPmid: 'PMID:11874389',
    keoNote: 'Approximation; no published kₑₒ. COX inhibition tracks plasma; analgesic effect downstream. IR oral Tmax ~1 h.',
    rows: [
      row('cox_1', 0.103653, 'PMID:11874389', 'Blain 2002 Table 1 (PMC1874310, human whole-blood assay) verbatim: diclofenac COX-1 IC50 "0.35 ± 0.26" µM. Reversible competitive. NOTE: the paper shows in-vitro WBA selectivity overstates clinical (oral diclofenac inhibits COX-1 ~70% in vivo). ec50 = 0.35 µM × 296.15 / 1000.'),
      row('cox_2', 0.017769, 'PMID:11874389', 'Blain 2002 Table 1 (PMC1874310, human whole-blood assay) verbatim: diclofenac COX-2 IC50 "0.06 ± 0.05" µM; abstract corroborates COX-2/COX-1 ratio 0.16. Reversible. ec50 = 0.06 µM × 296.15 / 1000.'),
    ],
  },
  {
    slug: 'meloxicam', keo: 0.3, keoPmid: 'PMID:11874389',
    keoNote: 'Approximation; no published kₑₒ. COX inhibition tracks plasma; anti-inflammatory effect downstream. Oral Tmax ~4–5 h.',
    rows: [
      row('cox_1', 0.927696, 'PMID:11874389', 'Blain 2002 Table 1 (PMC1874310, human whole-blood assay) verbatim: meloxicam COX-1 IC50 "2.64 ± 2.49" µM. COX-2-preferential; reversible. ec50 = 2.64 µM × 351.4 / 1000.'),
      row('cox_2', 0.21084, 'PMID:11874389', 'Blain 2002 Table 1 (PMC1874310, human whole-blood assay) verbatim: meloxicam COX-2 IC50 "0.60 ± 0.82" µM. Reversible. NOTE: in-vitro WBA ratio overstates clinical COX-2 selectivity. ec50 = 0.60 µM × 351.4 / 1000.'),
    ],
  },
  {
    slug: 'etoricoxib', keo: 1.0, keoPmid: 'PMID:11160644',
    keoNote: 'Approximation; no published kₑₒ. COX-2 inhibition tracks plasma; anti-inflammatory effect downstream. Oral Tmax ~1 h.',
    rows: [
      row('cox_2', 0.394724, 'PMID:11160644', 'Riendeau 2001 verbatim: "an IC(50) value of 1.1 +/- 0.1 microM for COX-2 (LPS-induced prostaglandin E2 synthesis)". Human whole-blood, COX-2-selective reversible. ec50 = 1.1 µM × 358.84 / 1000.'),
      row('cox_1', 41.62544, 'PMID:11160644', 'Riendeau 2001 verbatim: "an IC(50) value of 116 +/- 8 microM for COX-1 (serum thromboxane B2 generation after clotting of the blood)". Human whole-blood; weak COX-1 (high ec50 → minimal occupancy, as expected for a coxib). ec50 = 116 µM × 358.84 / 1000.'),
    ],
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
    for (const r of a.rows) {
      if (c.receptor_occupancy.find(x => x.receptor === r.receptor)) { skipN++; console.log(`  [skip] ${c.slug.padEnd(12)} @ ${r.receptor} already authored`); continue; }
      c.receptor_occupancy.push({ receptor: r.receptor, pathway: 'antiinflammatory', emax: 1.0, ec50_mg_l: r.ec50, hill_n: 1, source_pmid: r.pmid, note: r.note });
      addRef(c, r.pmid); occN++;
      console.log(`  [add ] ${c.slug.padEnd(12)} @ ${r.receptor.padEnd(6)} ec50=${r.ec50} mg/L  ${r.pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 14 NSAID COX: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
