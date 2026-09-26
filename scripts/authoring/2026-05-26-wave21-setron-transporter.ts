/**
 * 2026-05-26-wave21-setron-transporter.ts — 5-HT3 antiemetics + monoamine
 * transporter (DAT/NET) occupancy (wave 21).
 *
 * New keys: 5ht3 (5-HT3A receptor), net (norepinephrine transporter). dat
 * already exists (modafinil). Each PMID/quote re-fetched + confirmed 2026-05-26.
 *
 * ec50_mg_l = Ki(nM) · MW / 1e6. emax 1.0, hill_n 1.
 *
 * ── Setrons (human 5-HT3A binding) ─────────────────────────────────────────
 *  ondansetron, palonosetron: Hothersall 2013 (PMID:23581504) — recombinant
 *  HUMAN 5-HT3A in COS-7, [3H]granisetron competition Ki (Ki in the full-text
 *  Results). granisetron: Hope 1996 (PMID:8818349) — h5-HT3A, [3H]granisetron
 *  self-KD pKD 8.87 (abstract-verbatim). Note: GtoPdb's palonosetron pKi 10.5
 *  was REJECTED — it cites a computational/modelling paper (PMID:20724042), a
 *  secondary-citation smell; the directly-measured Hothersall Ki is used.
 *
 * ── Transporters ───────────────────────────────────────────────────────────
 *  atomoxetine: Bymaster 2002 (PMID:12431845) abstract-verbatim "Ki values of
 *  5, 77 and 1451 nM" at human NE/5-HT/DA transporters → NET 5, DAT 1451.
 *  methylphenidate: GtoPdb human DAT/NET pKi ranges (med-chem analogue papers,
 *  MPH as reference comparator → secondary-citation pattern, medium confidence);
 *  modelled at geometric-mean midpoint (DAT 34–110 → 61 nM; NET 340–660 → 474 nM).
 *
 * ── Skipped (logged in AUTHORING_GAPS) ─────────────────────────────────────
 *  bupropion (DAT/NET) — GtoPdb values are wide ranges and the agent's cited
 *  "Carroll 2009" PMID resolved to a different paper (Lapinsky 2009, pyrovalerone);
 *  no clean verified single source. amphetamine (DAT/NET) — only rat uptake-
 *  inhibition IC50 (Tuomisto 1976), and it is a RELEASER/substrate not a blocker,
 *  so an equilibrium-occupancy/Ki model misrepresents its mechanism (cf. aspirin).
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
    slug: 'ondansetron', keo: 2.0, keoPmid: 'PMID:23581504',
    keoNote: 'Approximation; no published kₑₒ. Antiemetic; fast onset (IV minutes / oral ~1.5 h).',
    rows: [row('5ht3', 'antagonist', 0.000138, 'PMID:23581504', 'Hothersall 2013 (PMID:23581504, full-text Results): ondansetron Ki = 0.47 nM, recombinant HUMAN 5-HT3A (COS-7), [3H]granisetron competition (Cheng-Prusoff). ec50 = 0.47 nM × 293.36 / 1e6.')],
  },
  {
    slug: 'granisetron', keo: 2.0, keoPmid: 'PMID:8818349',
    keoNote: 'Approximation; no published kₑₒ. Antiemetic; fast onset.',
    rows: [row('5ht3', 'antagonist', 0.000421, 'PMID:8818349', 'Hope 1996 verbatim: [3H]-granisetron bound h5-HT3A "with high affinity (pKD = 8.87 +/- 0.08)" → KD 1.35 nM (recombinant human 5-HT3A, HEK293; self-binding KD = affinity). ec50 = 1.35 nM × 312.41 / 1e6.')],
  },
  {
    slug: 'palonosetron', keo: 1.0, keoPmid: 'PMID:23581504',
    keoNote: 'Approximation; no published kₑₒ. Second-gen antiemetic; very slow receptor dissociation (long duration).',
    rows: [row('5ht3', 'antagonist', 0.0000652, 'PMID:23581504', 'Hothersall 2013 (PMID:23581504, full-text Results): palonosetron Ki = 0.22 nM, recombinant HUMAN 5-HT3A (COS-7), [3H]granisetron competition. (GtoPdb pKi 10.5 rejected — cites a computational paper.) ec50 = 0.22 nM × 296.41 / 1e6.')],
  },
  {
    slug: 'atomoxetine', keo: 1.0, keoPmid: 'PMID:12431845',
    keoNote: 'Approximation; no published kₑₒ. NET-selective reuptake blocker (ADHD); oral Tmax ~1–2 h.',
    rows: [
      row('net', 'norepinephrine_reuptake_inhibition', 0.001277, 'PMID:12431845', 'Bymaster 2002 verbatim: "Atomoxetine inhibited binding of radioligands to clonal cell lines transfected with human NE, serotonin (5-HT) and dopamine (DA) transporters with dissociation constants (K(i)) values of 5, 77 and 1451 nM, respectively". Human NET, Ki 5 nM. ec50 = 5 nM × 255.36 / 1e6.'),
      row('dat', 'dopamine_reuptake_inhibition', 0.370527, 'PMID:12431845', 'Bymaster 2002 verbatim (same sentence): human DAT Ki 1451 nM — weak off-target (atomoxetine is NET-selective). ec50 = 1451 nM × 255.36 / 1e6.'),
    ],
  },
  {
    slug: 'methylphenidate', keo: 2.0, keoPmid: 'PMID:17228864',
    keoNote: 'Approximation; no published kₑₒ. Stimulant reuptake blocker; IR onset ~30 min.',
    rows: [
      row('dat', 'dopamine_reuptake_inhibition', 0.014269, 'PMID:17228864', 'Per IUPHAR/GtoPdb (human DAT, Ki range 34–110 nM across 2 med-chem analogue papers → geometric-mean 61 nM); representative primary Froimowitz 2007 (PMID:17228864, MPH analogues at the DA transporter). MPH as reference comparator (medium confidence). ec50 = 61 nM × 233.31 / 1e6.'),
      row('net', 'norepinephrine_reuptake_inhibition', 0.110532, 'PMID:17228864', 'Per IUPHAR/GtoPdb (human NET, Ki range 340–660 nM → geometric-mean 474 nM); same source set (Froimowitz 2007, PMID:17228864). DAT-preferring (NET weaker), consistent with MPH selectivity. ec50 = 474 nM × 233.31 / 1e6.'),
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
    if (c.effect_compartment?.keo_per_h != null) console.log(`  [skip] ${c.slug.padEnd(15)} keo already authored`);
    else { c.effect_compartment = { keo_per_h: a.keo, source_pmid: a.keoPmid, note: a.keoNote }; addRef(c, a.keoPmid); keoN++; console.log(`  [add ] ${c.slug.padEnd(15)} keo=${a.keo}/h  ${a.keoPmid}`); }
    c.receptor_occupancy = c.receptor_occupancy ?? [];
    for (const r of a.rows) {
      if (c.receptor_occupancy.find(x => x.receptor === r.receptor)) { skipN++; console.log(`  [skip] ${c.slug.padEnd(15)} @ ${r.receptor} already authored`); continue; }
      c.receptor_occupancy.push({ receptor: r.receptor, pathway: r.pathway, emax: 1.0, ec50_mg_l: r.ec50, hill_n: 1, source_pmid: r.pmid, note: r.note });
      addRef(c, r.pmid); occN++;
      console.log(`  [add ] ${c.slug.padEnd(15)} @ ${r.receptor.padEnd(5)} ec50=${r.ec50} mg/L  ${r.pmid}`);
    }
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 21 setron+transporter: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
