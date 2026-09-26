/**
 * 2026-05-26-wave19-antimuscarinic-alpha2.ts — antimuscarinic (muscarinic) +
 * alpha-2A occupancy, GtoPdb-sourced (wave 19). Same provenance tier as wave 18.
 *
 * Extends the existing atropine (muscarinic) and clonidine/guanfacine/
 * dexmedetomidine (alpha_2a) rows. Values are GtoPdb-curated single human pKi
 * with a verified primary PMID (table-only in the primary papers).
 *
 * ec50_mg_l = Ki(nM) · MW / 1e6. emax 1.0, hill_n 1.
 * keo: documented-approximation (no published kₑₒ).
 *
 * ── Skipped (multi-paper ranges / no single curated value) ──────────────────
 *  tolterodine (M3 pKi 8.4–8.5, 2-paper range), tiotropium (9.5–11.1, 5-paper),
 *  ipratropium (9.3–9.8, 3-paper), brimonidine (α2A 6.4–8.7, 5-paper) — GtoPdb
 *  prints only ranges; held to the single-value bar (cf. wave 18 quetiapine/
 *  clozapine). methyldopa (α2A) — prodrug; GtoPdb lists no adrenoceptor binding
 *  (the metabolite α-methylnorepinephrine is the α2 agonist, not the parent).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Authoring { slug: string; keo: number; keoNote: string; receptor: string; pathway: string; ec50: number; pmid: string; note: string; }

const ENTRIES: Authoring[] = [
  {
    slug: 'oxybutynin', keo: 1.0, receptor: 'muscarinic', pathway: 'parasympatholysis', ec50: 0.000567, pmid: 'PMID:22243489',
    keoNote: 'Approximation; no published kₑₒ. Oral antimuscarinic (overactive bladder), Tmax ~1 h.',
    note: 'Per IUPHAR/GtoPdb (human M3, pKi 8.8 → Ki 1.59 nM); primary ref Del Bello 2012 (PMID:22243489), "1,4-dioxane … novel M3 muscarinic receptor antagonists" — oxybutynin as reference antagonist in the M3 binding table. GtoPdb-curated; M3-subtype value (keyed generic muscarinic, as atropine). ec50 = 1.59 nM × 357.49 / 1e6.',
  },
  {
    slug: 'scopolamine', keo: 1.0, receptor: 'muscarinic', pathway: 'parasympatholysis', ec50: 0.000121, pmid: 'PMID:1346637',
    keoNote: 'Approximation; no published kₑₒ. Antimuscarinic (antiemetic/antispasmodic); oral Tmax ~1 h (transdermal much slower).',
    note: 'Per IUPHAR/GtoPdb (human M3, pKi 9.4 → Ki 0.40 nM); primary ref Bolden 1992 (PMID:1346637), "Antagonism by antimuscarinic and neuroleptic compounds at the five cloned human muscarinic cholinergic receptors expressed in CHO cells" ([3H]QNB) — the ideal cloned-human-M3 source. GtoPdb-curated. ec50 = 0.40 nM × 303.35 / 1e6.',
  },
  {
    slug: 'tizanidine', keo: 1.0, receptor: 'alpha_2a', pathway: 'agonist', ec50: 0.253710, pmid: 'PMID:36101495',
    keoNote: 'Approximation; no published kₑₒ. Oral α2-agonist muscle relaxant, short-acting, Tmax ~1–2 h.',
    note: 'Per IUPHAR/GtoPdb (human α2A, pKi 6.0 → Ki 1000 nM, binding); primary ref Proudman 2022 (PMID:36101495), "The signaling and selectivity of α-adrenoceptor agonists for the human α2A, α2B and α2C-adrenoceptors". Binding pKi is weak (functional potency higher, as for a partial/low-efficacy readout). GtoPdb-curated. ec50 = 1000 nM × 253.71 / 1e6.',
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
    else { c.effect_compartment = { keo_per_h: a.keo, source_pmid: a.pmid, note: a.keoNote }; addRef(c, a.pmid); keoN++; console.log(`  [add ] ${c.slug.padEnd(12)} keo=${a.keo}/h  ${a.pmid}`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    if (c.receptor_occupancy.find(x => x.receptor === a.receptor)) { skipN++; console.log(`  [skip] ${c.slug.padEnd(12)} @ ${a.receptor} already authored`); continue; }
    c.receptor_occupancy.push({ receptor: a.receptor, pathway: a.pathway, emax: 1.0, ec50_mg_l: a.ec50, hill_n: 1, source_pmid: a.pmid, note: a.note });
    addRef(c, a.pmid); occN++;
    console.log(`  [add ] ${c.slug.padEnd(12)} @ ${a.receptor.padEnd(11)} ec50=${a.ec50} mg/L  ${a.pmid}`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 19 antimuscarinic+α2: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
