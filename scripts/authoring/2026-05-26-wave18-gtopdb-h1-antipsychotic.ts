/**
 * 2026-05-26-wave18-gtopdb-h1-antipsychotic.ts — H1 antihistamines + antipsychotic
 * D2/5-HT2A occupancy, sourced from IUPHAR/Guide to Pharmacology (wave 18).
 *
 * METHODOLOGY SHIFT (deliberate, documented): prior waves required an
 * abstract-verbatim or open-access-table number. These compounds' affinities
 * are table-only in their primary papers (logged as skips in AUTHORING_GAPS),
 * but IUPHAR/GtoPdb — the SAME peer-reviewed, curated database this project
 * already uses for the receptor catalog (data/receptors.json) — publishes a
 * curated human Ki/pKi for each, with a primary citation. Provenance here is
 * "GtoPdb curation + the primary PMID it cites" (transparent in each note),
 * NOT an abstract quote. Every primary PMID was fetched and confirmed to
 * resolve and be the correct on-topic paper (2026-05-26).
 *
 * ec50_mg_l = Ki(nM) · MW / 1e6. emax 1.0, hill_n 1.
 * keo: documented-approximation (no published kₑₒ), anchored to onset.
 *
 * ── Skipped (logged in AUTHORING_GAPS) ─────────────────────────────────────
 *  loratadine — GtoPdb "human" Ki 37 nM ≈ the historical guinea-pig value
 *    (35 nM); the cited binding looks rodent and the parent is weak vs its
 *    already-authored active metabolite desloratadine (0.9 nM). Species
 *    provenance too shaky to treat as human.
 *  doxylamine — GtoPdb has NO affinity data ("unable to find publicly available
 *    affinity data ... not tagged a primary drug target").
 *  quetiapine — GtoPdb D2 value is review-sourced (Arnt 1998) and 5-HT2A is a
 *    multi-paper pKi RANGE; no single curated primary value.
 *  clozapine — GtoPdb D2 (126–1585 nM) and 5-HT2A (1–25 nM) are both pKi RANGES
 *    aggregated across 5 papers each; no single value to author.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Row { receptor: string; pathway: string; ec50: number; pmid: string; note: string; }
interface Authoring { slug: string; keo: number; keoNote: string; keoPmid: string; rows: Row[]; }

const ENTRIES: Authoring[] = [
  // ── H1 antihistamines (extend cetirizine/desloratadine/promethazine; all human) ─
  {
    slug: 'diphenhydramine', keo: 1.0, keoPmid: 'PMID:12065734',
    keoNote: 'Approximation; no published kₑₒ. Sedating first-gen antihistamine; CNS H1 onset fairly fast (~1–2 h oral).',
    rows: [r('H1', 'antagonist', 0.003218, 'PMID:12065734', 'Per IUPHAR/GtoPdb (human H1, pKi 7.9 → Ki 12.6 nM); primary ref Booth 2002 (PMID:12065734), "A novel phenylaminotetralin radioligand reveals a subpopulation of histamine H1 receptors" — cloned human H1 in CHO. GtoPdb-curated (table); ec50 = 12.6 nM × 255.36 / 1e6.')],
  },
  {
    slug: 'fexofenadine', keo: 0.3, keoPmid: 'PMID:19660947',
    keoNote: 'Approximation; no published kₑₒ. Non-sedating peripheral H1 antagonist (terfenadine metabolite); minimal CNS penetration.',
    rows: [r('H1', 'antagonist', 0.013545, 'PMID:19660947', 'Per IUPHAR/GtoPdb (human H1, Ki 27 nM); primary ref Aslanian 2009 (PMID:19660947), "Structural determinants for histamine H1 affinity ... in a series of terfenadine analogs". GtoPdb-curated (table; fexofenadine = terfenadine metabolite in the series). ec50 = 27 nM × 501.66 / 1e6.')],
  },
  {
    slug: 'hydroxyzine', keo: 0.5, keoPmid: 'PMID:11809864',
    keoNote: 'Approximation; no published kₑₒ. Sedating H1 antagonist (cetirizine\'s parent); CNS onset over 1–2 h.',
    rows: [r('H1', 'antagonist', 0.000746, 'PMID:11809864', 'Per IUPHAR/GtoPdb (human H1, Ki 1.99 nM); primary ref Gillard 2002 (PMID:11809864) — the SAME human H1 [3H]mepyramine competition paper that sourced cetirizine (6 nM). GtoPdb-curated (table). ec50 = 1.99 nM × 374.91 / 1e6.')],
  },
  {
    slug: 'chlorpheniramine', keo: 0.5, keoPmid: 'PMID:21381763',
    keoNote: 'Approximation; no published kₑₒ. Sedating first-gen H1 antagonist.',
    rows: [r('H1', 'antagonist', 0.001924, 'PMID:21381763', 'Per IUPHAR/GtoPdb (human H1, Ki 7 nM); primary ref Procopiou 2011 (PMID:21381763), "The discovery of phthalazinone-based human H1 and H3 ... antagonists" — chlorpheniramine as reference comparator in the human H1 series. GtoPdb-curated (table). ec50 = 7 nM × 274.79 / 1e6.')],
  },
  // ── Antipsychotics (extend olanzapine/risperidone/aripiprazole/haloperidol) ─
  {
    slug: 'cariprazine', keo: 0.1, keoPmid: 'PMID:22537450',
    keoNote: 'Approximation; no published kₑₒ. Long-acting (active metabolites, effective t½ days) → slow effect-compartment equilibration; clinical effect over weeks.',
    rows: [r('dopamine_d2', 'partial agonist', 0.002436, 'PMID:22537450', 'Per IUPHAR/GtoPdb (human D2L, Ki 5.7 nM, partial agonist); primary ref Agai-Csongor 2012 (PMID:22537450), "Discovery of cariprazine (RGH-188): a novel antipsychotic acting on dopamine D3/D2 receptors". D2/D3 partial agonist (D3-preferring; D3 Ki ~0.09 nM per GtoPdb). GtoPdb-curated. ec50 = 5.7 nM × 427.41 / 1e6.')],
  },
  {
    slug: 'lurasidone', keo: 0.5, keoPmid: 'PMID:20404009',
    keoNote: 'Approximation; no published kₑₒ. Oral antipsychotic, Tmax ~1–3 h; clinical effect downstream.',
    rows: [
      r('dopamine_d2', 'antagonist', 0.000828, 'PMID:20404009', 'Per IUPHAR/GtoPdb (Ki 1.68 nM, species rat per GtoPdb — cf. the rat olanzapine D2 entry); primary ref Ishibashi 2010 (PMID:20404009), "Pharmacological profile of lurasidone ...". Potent D2 antagonist. GtoPdb-curated. ec50 = 1.68 nM × 492.68 / 1e6.'),
      r('5-HT2A', 'antagonist', 0.001000, 'PMID:20404009', 'Per IUPHAR/GtoPdb (Ki 2.03 nM, species rat per GtoPdb); primary ref Ishibashi 2010 (PMID:20404009). Potent 5-HT2A antagonist. GtoPdb-curated. ec50 = 2.03 nM × 492.68 / 1e6.'),
    ],
  },
];

function r(receptor: string, pathway: string, ec50: number, pmid: string, note: string): Row { return { receptor, pathway, ec50, pmid, note }; }

function addRef(c: Compound, pmid?: string): void { if (!pmid) return; c.refs = c.refs ?? []; if (!c.refs.includes(pmid)) c.refs.push(pmid); }

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));
  let keoN = 0, occN = 0, skipN = 0;
  for (const a of ENTRIES) {
    const c = bySlug.get(a.slug);
    if (!c) throw new Error(`compound "${a.slug}" not found`);
    if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(16)} keo already authored`);
    else { c.effect_compartment = { keo_per_h: a.keo, source_pmid: a.keoPmid, note: a.keoNote }; addRef(c, a.keoPmid); keoN++; console.log(`  [add ] ${c.slug.padEnd(16)} keo=${a.keo}/h  ${a.keoPmid}`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    for (const row of a.rows) {
      if (c.receptor_occupancy.find(x => x.receptor === row.receptor)) { skipN++; console.log(`  [skip] ${c.slug.padEnd(16)} @ ${row.receptor} already authored`); continue; }
      c.receptor_occupancy.push({ receptor: row.receptor, pathway: row.pathway, emax: 1.0, ec50_mg_l: row.ec50, hill_n: 1, source_pmid: row.pmid, note: row.note });
      addRef(c, row.pmid); occN++;
      console.log(`  [add ] ${c.slug.padEnd(16)} @ ${row.receptor.padEnd(11)} ec50=${row.ec50} mg/L  ${row.pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 18 GtoPdb H1+antipsychotic: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
