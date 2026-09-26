/**
 * 2026-05-26-wave17-dihydropyridine-cav.ts — dihydropyridine L-type Ca channel
 * occupancy (wave 17). New key `cav1_2` (L-type Cav1.2, dihydropyridine site).
 *
 * 5 of 6 authorable. All are DHP-site binding affinities at the L-type channel,
 * but they split across measurement types and conditions (flagged per row):
 *   - true [3H]PN200-110-DISPLACEMENT Ki: nifedipine, nicardipine
 *   - SELF-radioligand Kd (the drug's own [3H] form): amlodipine, nimodipine,
 *     isradipine (isradipine = [3H]PN200-110 itself, i.e. the reference ligand
 *     the displacement Ki above are measured against — an internal anchor)
 * Species/tissue mixed (cat ventricle, bovine aorta, rat cardiac/brain). The
 * resulting rank (isradipine 0.035 < nifedipine 0.5 < nimodipine 1.1 < amlodipine
 * 1.68 < nicardipine 3.9 nM) is pharmacologically plausible. No existing cav1_2
 * row to contradict. Cross-source caveat noted; same source-mixing the existing
 * gaba_a_bzd / beta_1 / 5-HT rows already carry. Each PMID/quote/author re-fetched
 * and confirmed 2026-05-26 (nimodipine PMID corrected 6306402→6300912; amlodipine
 * value taken as 1.68 nM from the cited PMID:1711625).
 *
 * ec50_mg_l = Ki/Kd(nM) · MW / 1e6. emax 1.0, hill_n 1, pathway 'antagonist'.
 * keo: documented-approximation (no published kₑₒ) anchored to vasodilator onset
 * (amlodipine slow / long t½; nifedipine-IR & nicardipine fast).
 *
 * ── Skipped (logged in AUTHORING_GAPS) ─────────────────────────────────────
 *  felodipine — no abstract/open-access Cav1.2 DHP-site Ki; binding literature
 *    is calmodulin-centric and Goll 1986's table (which tabulates it) returned
 *    HTTP 403. verapamil / diltiazem — bind DISTINCT sites (phenylalkylamine /
 *    benzothiazepine) on the same channel, not the DHP site; left as a follow-on
 *    so the cav1_2 DHP-site set stays a single-site comparison.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface ReceptorOccupancy { receptor: string; pathway?: string; emax: number; ec50_mg_l: number; hill_n: number; source_pmid?: string; note?: string; }
interface EffectCompartment { keo_per_h: number; source_pmid?: string; note?: string; }
interface Compound { slug: string; effect_compartment?: EffectCompartment; receptor_occupancy?: ReceptorOccupancy[]; refs?: string[]; [k: string]: unknown; }
interface Authoring { slug: string; keo: number; keoNote: string; ec50: number; pmid: string; note: string; }

const ENTRIES: Authoring[] = [
  {
    slug: 'amlodipine', keo: 0.1, ec50: 0.000687, pmid: 'PMID:1711625',
    keoNote: 'Approximation; no published kₑₒ. Slowest-onset DHP — long t½ (~35–50 h), antihypertensive effect builds over days → slow effect-compartment equilibration.',
    note: 'Nayler 1991 verbatim: "(-)[3H]amlodipine bound to a single population of high-affinity binding sites with a KD of 1.68 +/- 0.12 nM". Rat cardiac membranes; SELF-radioligand Kd (not a PN200-110 displacement Ki — flagged). ec50 = 1.68 nM × 408.88 / 1e6.',
  },
  {
    slug: 'nifedipine', keo: 2.0, ec50: 0.000173, pmid: 'PMID:3027587',
    keoNote: 'Approximation; no published kₑₒ. Immediate-release nifedipine — rapid vasodilation/reflex tachycardia within minutes (fast equilibration).',
    note: 'Goll 1986 verbatim: "(+/-)-nitrendipine was the most potent with a Ki-value of 280 pmol/l, nifedipine had a Ki-value of 500 pmol/l". Cat ventricle membranes, (+)-[3H]PN200-110 DISPLACEMENT Ki. ec50 = 0.5 nM × 346.34 / 1e6.',
  },
  {
    slug: 'nicardipine', keo: 2.0, ec50: 0.001870, pmid: 'PMID:9612662',
    keoNote: 'Approximation; no published kₑₒ. Fast-onset vasodilator (IV form used for acute BP control).',
    note: 'Nishikawa 1998 verbatim: "12.3 +/- 4.5 and 3.9 +/- 1.0 nmol/L for ... nitrendipine and nicardipine, respectively" against [3H]-PN200-110. Bovine aortic membrane, DISPLACEMENT Ki. ec50 = 3.9 nM × 479.53 / 1e6.',
  },
  {
    slug: 'nimodipine', keo: 1.0, ec50: 0.000464, pmid: 'PMID:6300912',
    keoNote: 'Approximation; no published kₑₒ. CNS-selective DHP (cerebral vasospasm); rapid vascular onset.',
    note: 'Bellemann 1983 verbatim: "The equilibrium dissociation constant, Kd, was 1.11 nM" (rat brain membranes, [3H]nimodipine). SELF-radioligand Kd (flagged). ec50 = 1.11 nM × 418.44 / 1e6.',
  },
  {
    slug: 'isradipine', keo: 1.0, ec50: 0.000013, pmid: 'PMID:6088927',
    keoNote: 'Approximation; no published kₑₒ. Rapid-onset antihypertensive DHP.',
    note: 'Lee 1984 verbatim: "Kd values are 35 and 64 pM for the cerebral cortex and heart, respectively" for [3H](+)PN200-110. Isradipine = PN200-110 (the reference radioligand); SELF-Kd, highest-affinity DHP here. Rat cortex value used. ec50 = 0.035 nM × 371.39 / 1e6.',
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
    if (c.receptor_occupancy.find(x => x.receptor === 'cav1_2')) { skipN++; console.log(`  [skip] ${c.slug.padEnd(12)} @ cav1_2 already authored`); continue; }
    c.receptor_occupancy.push({ receptor: 'cav1_2', pathway: 'antagonist', emax: 1.0, ec50_mg_l: a.ec50, hill_n: 1, source_pmid: a.pmid, note: a.note });
    addRef(c, a.pmid); occN++;
    console.log(`  [add ] ${c.slug.padEnd(12)} @ cav1_2 ec50=${a.ec50} mg/L  ${a.pmid}`);
  }
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 17 dihydropyridine Cav1.2: +${occN} occupancy rows, +${keoN} keo (${skipN} already present).`);
}

main();
