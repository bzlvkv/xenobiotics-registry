/**
 * 2026-05-26-wave22-tca-atypical-ad.ts — tricyclic / atypical antidepressant
 * occupancy (wave 22). GtoPdb-curated values, verified primary PMIDs.
 *
 * Only the CLEANLY-sourced subset is authored. A verification sweep found
 * GtoPdb's citations for several TCA transporter rows are broken/mismatched
 * (see skips) — those are deferred to the Tatsumi 1997 full-text rather than
 * authored against wrong papers.
 *
 * ec50_mg_l = Ki(nM) · MW / 1e6. emax 1.0, hill_n 1.
 * keo: documented-approximation (no published kₑₒ).
 *
 * ── Skipped (logged in AUTHORING_GAPS) ─────────────────────────────────────
 *  amitriptyline SERT/NET — GtoPdb attributes them to an AMT/5-MeO-DALT paper
 *    (PMID:23602445) and the values (158/316 nM) are ~40× weaker than the
 *    canonical Tatsumi 1997 numbers (~4/35 nM); suspect — needs Tatsumi full-text.
 *  nortriptyline SERT/NET — GtoPdb NET ref is a 5-HT6 paper (mismatch); SERT ref
 *    is the NTP screening database (no primary PMID).
 *  imipramine SERT/NET — GtoPdb SERT ref is an implausible J Nat Prod citation
 *    (mismatch); NET row has no ref.
 *  → All four TCAs' human SERT/NET Ki live in Tatsumi 1997 (PMID:9537821) Table;
 *    pull from full-text to author comparably (PDF_QUEUE).
 *  mirtazapine H1, trazodone α1A — values exist on GtoPdb but their primary
 *    PMIDs were not extractable from the rendered page (α1A is rat-only anyway).
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

const row = (receptor: string, pathway: string, ec50: number, pmid: string, note: string): Row => ({ receptor, pathway, ec50, pmid, note });

const ENTRIES: Authoring[] = [
  {
    slug: 'clomipramine', keo: 1.0, keoPmid: 'PMID:9537821',
    keoNote: 'Approximation; no published kₑₒ. TCA, strongly serotonergic; oral.',
    rows: [
      row('SERT', 'serotonin_reuptake_inhibition', 0.0000628, 'PMID:9537821', 'Per IUPHAR/GtoPdb (human SERT, pKi 9.7 → Ki 0.20 nM); primary Tatsumi 1997 (PMID:9537821), "Pharmacological profile of antidepressants and related compounds at human monoamine transporters" — the gold-standard human transporter panel. ec50 = 0.20 nM × 314.85 / 1e6.'),
      row('net', 'norepinephrine_reuptake_inhibition', 0.012534, 'PMID:9537821', 'Per IUPHAR/GtoPdb (human NET, pKd 7.4 → Kd 39.8 nM); primary Tatsumi 1997 (PMID:9537821). Clomipramine is SERT-preferring (NET weaker). ec50 = 39.8 nM × 314.85 / 1e6.'),
    ],
  },
  {
    slug: 'mirtazapine', keo: 1.0, keoPmid: 'PMID:35224877',
    keoNote: 'Approximation; no published kₑₒ. NaSSA antidepressant; oral, Tmax ~2 h.',
    rows: [
      row('alpha_2a', 'antagonist', 0.029773, 'PMID:35224877', 'Per IUPHAR/GtoPdb (human α2A, pKi range 6.8–7.1 → geometric-mean 6.95, Ki 112 nM); primary Proudman 2022 (PMID:35224877), human α2A affinity of antidepressants (mirtazapine named). Mirtazapine\'s mechanism is α2 (auto/heteroreceptor) ANTAGONISM. ec50 = 112 nM × 265.36 / 1e6.'),
      row('5-HT2A', 'antagonist', 0.016744, 'PMID:15771415', 'Per IUPHAR/GtoPdb (human 5-HT2A, pKi 7.2 → Ki 63 nM); primary Fernández 2005 (PMID:15771415), broad psychotropic receptor profiling (mirtazapine comparator). 5-HT2A antagonist. ec50 = 63 nM × 265.36 / 1e6.'),
    ],
  },
  {
    slug: 'trazodone', keo: 1.0, keoPmid: 'PMID:15322733',
    keoNote: 'Approximation; no published kₑₒ. SARI antidepressant / hypnotic; oral.',
    rows: [
      row('5-HT2A', 'antagonist', 0.014804, 'PMID:15322733', 'Per IUPHAR/GtoPdb (human 5-HT2A, pKi 7.4 → Ki 39.8 nM); primary Knight 2004 (PMID:15322733), 5-HT2A/2B/2C binding characterization (trazodone tabulated antagonist). Trazodone is a 5-HT2A antagonist (SARI). ec50 = 39.8 nM × 371.86 / 1e6.'),
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
    if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(13)} keo already authored`);
    else { c.effect_compartment = { keo_per_h: a.keo, source_pmid: a.keoPmid, note: a.keoNote }; addRef(c, a.keoPmid); keoN++; console.log(`  [add ] ${c.slug.padEnd(13)} keo=${a.keo}/h  ${a.keoPmid}`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    for (const r of a.rows) {
      if (c.receptor_occupancy.find(x => x.receptor === r.receptor)) { skipN++; console.log(`  [skip] ${c.slug.padEnd(13)} @ ${r.receptor} already authored`); continue; }
      c.receptor_occupancy.push({ receptor: r.receptor, pathway: r.pathway, emax: 1.0, ec50_mg_l: r.ec50, hill_n: 1, source_pmid: r.pmid, note: r.note });
      addRef(c, r.pmid); occN++;
      console.log(`  [add ] ${c.slug.padEnd(13)} @ ${r.receptor.padEnd(10)} ec50=${r.ec50} mg/L  ${r.pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 22 TCA/atypical AD: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
