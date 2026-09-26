/**
 * 2026-05-05-wave-3b-occupancy-session-11.ts — Wave 3b session 11.
 *
 * 8 verified receptor occupancy entries on compounds whose kₑₒ was
 * authored in earlier Wave-3a sessions (or v0.5/v0.6 baseline).
 *
 *   - hydromorphone   μ-opioid       Ki   0.6 nM     PMID:1851921  (rat MOR)
 *   - telmisartan     AT1            Ki   3.7 nM     PMID:8220885  (rat AT1)
 *   - irbesartan      AT1            Ki  ~0.5 nM     PMID:9246947  (gp liver AT1)
 *   - triazolam       GABA-A BZD     Ki   0.50 nM    PMID:9536021  (mouse brain)
 *   - zaleplon        GABA-A BZD     IC50 4454.5 nM  PMID:12122506 (rat hippocamp.)
 *   - tiagabine       GAT-1          IC50 67 nM      PMID:2299358  (rat synapt.)
 *   - quinine         hERG           IC50 57 µM      PMID:12695533 (Xenopus, 0 mV)
 *   - succinylcholine nAChR (muscle) EC50 10.8 µM    PMID:16571968 (human nAChR)
 *
 * Notes:
 *   - hydromorphone Ki 0.6 nM correctly distinguished from hydrocodone
 *     19.8 nM in the same paper (PMID:1851921, Codd 1995); the metabolite
 *     binds far more strongly than the parent.
 *   - succinylcholine activates then desensitizes nAChR (depolarizing
 *     block); EC50 captures the activation phase. Hill model is an
 *     approximation since steady-state response is biphasic.
 *   - quinine hERG IC50 (57 µM) is ~12× weaker than its diastereomer
 *     quinidine (4.6 µM) in the same paper.
 *
 * Skipped (no abstract-verbatim IC50 — logged in AUTHORING_GAPS):
 *   - quinine Nav1.5 — 9 PMIDs chased, no verbatim cardiac INa IC50
 *     (e.g. PMID:9582223 reports use-dependent INa reduction at >20 µM
 *     but no IC50 fit; quinine surfaces as Kv blocker in most patch-clamp
 *     papers, not Nav).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Occupancy = {
  receptor: string;
  pathway: string;
  emax: number;
  ec50_mg_l: number;
  hill_n: number;
  source_pmid: string;
  note?: string;
};

const ENTRIES: Array<{ slug: string; site: Occupancy }> = [
  {
    slug: 'hydromorphone',
    site: {
      receptor: 'mu_opioid', pathway: 'analgesia',
      emax: 1, ec50_mg_l: 0.000171, hill_n: 1,
      source_pmid: 'PMID:1851921',
      note: 'Rat brain MOR, [3H]DAMGO competition (Codd 1995); abstract verbatim "their O-demethylated metabolites (e.g. hydromorphone, Ki = 0.6 nM) had much stronger binding". 33× more potent than parent hydrocodone (19.8 nM same paper). ec50_mg_l = 0.6 nM × 285.34 g/mol / 1e6.',
    },
  },
  {
    slug: 'telmisartan',
    site: {
      receptor: 'at1', pathway: 'angiotensin_blockade',
      emax: 1, ec50_mg_l: 0.001904, hill_n: 1,
      source_pmid: 'PMID:8220885',
      note: 'Rat AT1 receptor radioligand binding (Wienen 1993); abstract verbatim "BIBR 277 potently interacted with rat AT1 receptors (Ki 3.7 nM)". BIBR 277 = telmisartan development code. Insurmountable antagonist. ec50_mg_l = 3.7 nM × 514.62 / 1e6.',
    },
  },
  {
    slug: 'irbesartan',
    site: {
      receptor: 'at1', pathway: 'angiotensin_blockade',
      emax: 1, ec50_mg_l: 0.000214, hill_n: 1,
      source_pmid: 'PMID:9246947',
      note: 'Guinea pig liver AT1 [125I][Sar1-Ile8]AngII competition (García-Sáinz 1997); abstract verbatim "irbesartan (approximately 0.5 nM) > losartan (approximately 36 nM)". ec50_mg_l = 0.5 nM × 428.53 / 1e6.',
    },
  },
  {
    slug: 'triazolam',
    site: {
      receptor: 'gaba_a_bzd', pathway: 'sedation_anxiolytic',
      emax: 1, ec50_mg_l: 0.000172, hill_n: 1,
      source_pmid: 'PMID:9536021',
      note: 'Mouse brain BZ site, [3H]flunitrazepam displacement (Fahey 1998); abstract verbatim "Triazolam alone inhibited [3H]flunitrazepam binding with an IC50 value of 0.85 nM and a Ki value of 0.50 nM". ec50_mg_l = 0.50 nM × 343.21 / 1e6.',
    },
  },
  {
    slug: 'zaleplon',
    site: {
      receptor: 'gaba_a_bzd', pathway: 'sedation_anxiolytic',
      emax: 1, ec50_mg_l: 1.360, hill_n: 1,
      source_pmid: 'PMID:12122506',
      note: 'Rat hippocampal membranes, [3H]flunitrazepam displacement (Noguchi 2002); abstract verbatim "zaleplon displaced bound [(3)H]flunitrazepam from membrane preparations from the rat hippocampus with an IC(50) of 4,454.5 nM". α1-selectivity → low-residual sedation profile. ec50_mg_l = 4454.5 nM × 305.34 / 1e6.',
    },
  },
  {
    slug: 'tiagabine',
    site: {
      receptor: 'gat1', pathway: 'gaba_uptake_inhibition',
      emax: 1, ec50_mg_l: 0.0276, hill_n: 1,
      source_pmid: 'PMID:2299358',
      note: 'Rat forebrain synaptosomes, [3H]GABA uptake inhibition (Braestrup 1990); abstract verbatim "NO 328 is a potent inhibitor of gamma-[3H]aminobutyric acid [(3H]GABA) uptake in a rat forebrain synaptosomal preparation (IC50 = 67 nM)". NO 328 = tiagabine R-enantiomer. ec50_mg_l = 67 nM × 412 / 1e6.',
    },
  },
  {
    slug: 'quinine',
    site: {
      receptor: 'herg', pathway: 'ikr_block_qt',
      emax: 1, ec50_mg_l: 18.49, hill_n: 1,
      source_pmid: 'PMID:12695533',
      note: 'HERG in Xenopus oocytes, two-electrode VC (Sánchez-Chapula 2003); abstract verbatim "The IC(50) values determined with voltage-clamp pulses to 0 mV were 4.6 microM and 57 microM for quinidine and quinine, respectively". ~12× weaker than quinidine same paper. ec50_mg_l = 57000 nM × 324.42 / 1e6.',
    },
  },
  {
    slug: 'succinylcholine',
    site: {
      receptor: 'nachr_muscle', pathway: 'neuromuscular_block',
      emax: 1, ec50_mg_l: 3.137, hill_n: 1,
      source_pmid: 'PMID:16571968',
      note: 'Xenopus oocytes expressing human muscle-type nAChR mRNA (Jonsson 2006); abstract verbatim "Succinylcholine concentration-dependently activated the muscle-type nAChR with an EC50 value of 10.8 microm (95% confidence interval, 9.8-11.9 microm), and after the initial activation, succinylcholine desensitized the muscle-type nAChR". Hill model is approximation — depolarizing-block mechanism is biphasic activation→desensitization. ec50_mg_l = 10.8 µM × 290.42 / 1e6.',
    },
  },
];

interface Compound {
  slug: string;
  receptor_occupancy?: Occupancy[];
  refs?: string[];
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c.receptor_occupancy ?? []) as Occupancy[];
    if (existing.some(s => s.receptor === e.site.receptor && s.source_pmid === e.site.source_pmid)) {
      alreadyHas++; continue;
    }
    existing.push(e.site);
    c.receptor_occupancy = existing;
    const refs = (c.refs ?? []) as string[];
    if (!refs.includes(e.site.source_pmid)) refs.push(e.site.source_pmid);
    c.refs = refs;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 11: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
