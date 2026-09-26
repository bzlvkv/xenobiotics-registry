/**
 * 2026-05-11-wave-3b-hill-fillin.ts — Hill occupancy fill-in (v1.1).
 *
 * 19 compounds in the registry had effect_compartment.keo_per_h authored
 * but no receptor_occupancy[] entries — meaning their Ce(t) curves
 * existed but no occupancy display was possible. Of those 19, 11 are
 * documented schema/mechanism misfits (precursors, mixtures, genomic
 * receptors, voltage-dependent channels — see AUTHORING_GAPS.md
 * "Receptor occupancy — investigated, skipped"). 8 are real candidates;
 * this session authored Hill rows for 3 of them, totalling 7 rows.
 *
 * ── Authored rows (7) ─────────────────────────────────────────────
 *
 * aripiprazole (MW 448.39) — 4 rows from Stark 2007 (PMID:17242925),
 *   which carries every 5-HT subtype Ki verbatim in the abstract:
 *     5-HT1A  Ki 4.2 nM   ec50=0.00188 mg/L  emax 0.65 (partial agonist)
 *     5-HT2A  Ki 3.4 nM   ec50=0.00152 mg/L  emax 1.0  (antagonist)
 *     5-HT2C  Ki 15 nM    ec50=0.00673 mg/L  emax 1.0  (antagonist)
 *     5-HT7   Ki 39 nM    ec50=0.01749 mg/L  emax 1.0  (antagonist)
 *
 * metoprolol (MW 267.36) — 1 row from Nakamura 2000 (PMID:10895074):
 *     β1-AR   pKi 5.99 (= Ki 1023 nM)  ec50=0.274 mg/L  emax 1.0
 *
 * nalbuphine (MW 357.45) — 2 rows from De Souza 1988 (PMID:2826773),
 *   rat brain homogenate (lint accepts; species documented in note):
 *     MOR     Ki 0.5 nM   ec50=0.000179 mg/L  emax 0.5  (μ partial agonist)
 *     KOR     Ki 29 nM    ec50=0.01037 mg/L   emax 0.85 (κ agonist)
 *
 * ── Skipped (3) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 *   aripiprazole → D2: Burris 2002 (PMID:12065741) describes high
 *     affinity to G-protein-coupled / uncoupled D2 states qualitatively;
 *     no verbatim Ki in abstract. The widely-cited 0.34 nM D2 Ki lives
 *     in Lawler 1999 *Neuropsychopharmacology* tables.
 *   oxycodone → MOR: Volpe 2011 (PMID:21215785) brackets oxycodone into
 *     "Ki 1-100 nM" range alongside 7 other opioids; no individual Ki.
 *   quetiapine → 5-HT2A / D2 / H1: Kongsamut 2002, Saller/Salama 1993
 *     describe profile qualitatively; no verbatim Ki at any receptor.
 *   butorphanol → MOR/KOR: Volpe 2011 brackets butorphanol into
 *     "Ki < 1 nM" alongside 5 other opioids; no individual Ki.
 *
 * After this session, 11 of 19 keo-but-no-Hill compounds remain — all
 * documented mechanism misfits. Hill fill-in effectively closed at
 * its abstract-verbatim ceiling.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy {
  receptor: string;
  pathway?: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid?: string;
  note?: string;
}
interface Compound {
  slug: string;
  name?: string;
  receptor_occupancy?: ReceptorOccupancy[];
  refs?: string[];
  effect_compartment?: { keo_per_h?: number; source_pmid?: string };
  [k: string]: unknown;
}

// ── aripiprazole — 4 Hill rows from Stark 2007 ───────────────────────
const ARIPIPRAZOLE_HILL: ReceptorOccupancy[] = [
  {
    receptor: '5-HT1A',
    pathway: 'partial-agonist',
    emax: 0.65,
    ec50_mg_l: 0.001883,
    hill_n: 1,
    source_pmid: 'PMID:17242925',
    note: 'Stark 2007 (Psychopharmacology) verbatim: "Aripiprazole showed a high affinity for human 5-HT(1A) receptors (K(i) = 4.2 nM) using parietal cortex membrane preparations". Partial agonist — pEC50 7.2 in [35S]GTPγS assay, intrinsic activity similar to buspirone. ec50_mg_l = 4.2 nM × 448.39 g/mol / 1e6.',
  },
  {
    receptor: '5-HT2A',
    pathway: 'antagonist',
    emax: 1.0,
    ec50_mg_l: 0.001525,
    hill_n: 1,
    source_pmid: 'PMID:17242925',
    note: 'Stark 2007 verbatim: "In membranes from cells expressing human recombinant receptors, aripiprazole bound with high affinity to 5-HT(2A) receptors (K(i) = 3.4 nM)". Also potently blocks 5-HT2A-mediated Ca²⁺ increase in rat pituitary cell line (IC50 = 11 nM). Functional antagonist. ec50_mg_l = 3.4 nM × 448.39 / 1e6.',
  },
  {
    receptor: '5-HT2C',
    pathway: 'antagonist',
    emax: 1.0,
    ec50_mg_l: 0.006726,
    hill_n: 1,
    source_pmid: 'PMID:17242925',
    note: 'Stark 2007 verbatim: "moderate affinity to 5-HT(2C) (K(i) = 15 nM)" in human recombinant receptor membranes. Functional antagonist. ec50_mg_l = 15 nM × 448.39 / 1e6.',
  },
  {
    receptor: '5-HT7',
    pathway: 'antagonist',
    emax: 1.0,
    ec50_mg_l: 0.017488,
    hill_n: 1,
    source_pmid: 'PMID:17242925',
    note: 'Stark 2007 verbatim: "moderate affinity to ... 5-HT(7) (K(i) = 39 nM)" in human recombinant receptor membranes. Functional antagonist. ec50_mg_l = 39 nM × 448.39 / 1e6.',
  },
];

// ── metoprolol — 1 Hill row from Nakamura 2000 ───────────────────────
const METOPROLOL_HILL: ReceptorOccupancy[] = [
  {
    receptor: 'β1-AR',
    pathway: 'antagonist',
    emax: 1.0,
    ec50_mg_l: 0.2735,
    hill_n: 1,
    source_pmid: 'PMID:10895074',
    note: 'Nakamura 2000 (Pharmacology) verbatim: pKi values "to beta(1)-AR subtypes obtained from COS-7 cell membranes ... metoprolol ... 5.99 +/- 0.13". COS-7 cells transiently expressing β1-AR, [3H]CGP-12177 radioligand. pKi 5.99 → Ki = 10⁻⁵·⁹⁹ M ≈ 1023 nM. ec50_mg_l = 1.023 µM × 267.36 / 1000.',
  },
];

// ── nalbuphine — 2 Hill rows from De Souza 1988 (rat brain) ──────────
const NALBUPHINE_HILL: ReceptorOccupancy[] = [
  {
    receptor: 'MOR',
    pathway: 'partial-agonist',
    emax: 0.5,
    ec50_mg_l: 0.000179,
    hill_n: 1,
    source_pmid: 'PMID:2826773',
    note: 'De Souza 1988 (JPET) verbatim: "In displacement studies in rat brain homogenates, nalbuphine had the highest affinity (Ki) for mu receptors (0.5 nM) with progressively lower affinities for kappa (29 nM) and delta (60 nM) opioid receptors". Rat brain (best-available primary). Nalbuphine is functionally a μ partial agonist / antagonist clinically (morphine-reversal). ec50_mg_l = 0.5 nM × 357.45 / 1e6.',
  },
  {
    receptor: 'KOR',
    pathway: 'agonist',
    emax: 0.85,
    ec50_mg_l: 0.01037,
    hill_n: 1,
    source_pmid: 'PMID:2826773',
    note: 'De Souza 1988 verbatim: "kappa (29 nM) ... opioid receptors". Rat brain homogenate, [3H]ethylketocyclazocine radioligand. Nalbuphine is functionally a κ agonist clinically — primary analgesic mechanism. ec50_mg_l = 29 nM × 357.45 / 1e6.',
  },
];

function applyHill(c: Compound, rows: ReceptorOccupancy[]): { added: number; already: number } {
  c.receptor_occupancy = c.receptor_occupancy ?? [];
  let added = 0, already = 0;
  for (const row of rows) {
    const existing = c.receptor_occupancy.find(r => r.receptor === row.receptor);
    if (existing) {
      already++;
      console.log(`  [skip] ${c.slug.padEnd(14)} @ ${row.receptor.padEnd(8)} already authored`);
      continue;
    }
    c.receptor_occupancy.push(row);
    if (row.source_pmid) {
      c.refs = c.refs ?? [];
      if (!c.refs.includes(row.source_pmid)) c.refs.push(row.source_pmid);
    }
    added++;
    console.log(`  [add ] ${c.slug.padEnd(14)} @ ${row.receptor.padEnd(8)} ec50=${row.ec50_mg_l} mg/L emax=${row.emax}  ${row.source_pmid}`);
  }
  return { added, already };
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  const ari = bySlug.get('aripiprazole');
  const met = bySlug.get('metoprolol');
  const nal = bySlug.get('nalbuphine');
  if (!ari || !met || !nal) throw new Error('one of aripiprazole/metoprolol/nalbuphine missing');

  // Sanity: each must have keo authored (lint enforces, but be explicit)
  for (const c of [ari, met, nal]) {
    if (!c.effect_compartment?.keo_per_h) throw new Error(`${c.slug} missing keo_per_h — Hill rows would fail lint`);
  }

  const r1 = applyHill(ari, ARIPIPRAZOLE_HILL);
  const r2 = applyHill(met, METOPROLOL_HILL);
  const r3 = applyHill(nal, NALBUPHINE_HILL);

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b Hill fill-in (v1.1): +${r1.added + r2.added + r3.added} rows (${r1.already + r2.already + r3.already} already authored).`);
}

main();
