/**
 * 2026-05-04-wave-3b-occupancy-session-5.ts — Wave 3b session 5.
 *
 * 6 verified receptor occupancy entries on compounds whose kₑₒ landed
 * earlier this push. All targets opted for highest-relevance receptor
 * with abstract-verbatim Ki/IC50/EC50/Kd:
 *
 *   ── μ-opioid (analgesia / blockade) ──
 *     - buprenorphine  Ki 0.088 nM  hMOR [35S]GTPγS antagonist Ki (PMID:10502307)
 *     - methadone      IC50 3.0  nM  R-methadone µ1 (PMID:7823756)
 *     - naloxone       Kd 110  nM  hMOR (PMID:14632053) — antagonist, emax=1+blockade
 *
 *   ── COX (analgesia / antipyresis) ──
 *     - acetaminophen  IC50 25.8 µM  human whole-blood COX-2 (PMID:17884974)
 *
 *   ── GABA-A (anesthesia) ──
 *     - sevoflurane    EC50 1.9 mM   hippocampal pyramidal neurons (PMID:23535829)
 *     - isoflurane     EC50 0.45 mM  HEK α1β2γ2L (PMID:11408543)
 *
 * Naloxone is encoded as emax=1 + pathway "mu_opioid_blockade" because
 * lint enforces emax in (0, 1]. Hill curve still describes fractional
 * occupancy; the antagonist semantics are read from the pathway name.
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
    slug: 'buprenorphine',
    site: {
      receptor: 'mu_opioid', pathway: 'analgesia', emax: 1, hill_n: 1,
      ec50_mg_l: 4.12e-5, source_pmid: 'PMID:10502307',
      note: 'Romero 1999 Synapse — abstract verbatim "antagonist-K(i) values (nM) of buprenorphine at mu, delta, and kappa receptors were 0.088 nM, 1.15 nM, and 0.072 nM"; [35S]GTPγS functional. MW 467.64',
    },
  },
  {
    slug: 'methadone',
    site: {
      receptor: 'mu_opioid', pathway: 'analgesia', emax: 1, hill_n: 1,
      ec50_mg_l: 9.28e-4, source_pmid: 'PMID:7823756',
      note: 'Kristensen 1995 Life Sci — abstract verbatim "R-methadone had a 10-fold higher affinity for mu1 receptors than S-methadone (IC50 3.0 nM and 26.4 nM)"; rat brain. MW 309.45',
    },
  },
  {
    slug: 'naloxone',
    site: {
      receptor: 'mu_opioid', pathway: 'mu_opioid_blockade', emax: 1, hill_n: 1,
      ec50_mg_l: 0.0360, source_pmid: 'PMID:14632053',
      note: 'Beigi & Wainer 2003 Anal Chem — abstract verbatim "calculated dissociation constants (Kd) were 110 nM for naloxone"; immobilized hMOR from CHO. MW 327.37',
    },
  },
  {
    slug: 'acetaminophen',
    site: {
      receptor: 'cox_2', pathway: 'antipyresis', emax: 1, hill_n: 1,
      ec50_mg_l: 3.90, source_pmid: 'PMID:17884974',
      note: 'Hinz/Cheremina/Brune 2008 FASEB J — abstract verbatim "IC(50)=25.8 micromol/L" COX-2 in human whole-blood assay. MW 151.16',
    },
  },
  {
    slug: 'sevoflurane',
    site: {
      receptor: 'gaba_a', pathway: 'anesthesia', emax: 1, hill_n: 1,
      ec50_mg_l: 380, source_pmid: 'PMID:23535829',
      note: 'Lecker 2013 Br J Anaesth — abstract verbatim "sevoflurane EC50: 1.9 (0.1) mM"; hippocampal pyramidal GABA-A potentiation. MW 200.05',
    },
  },
  {
    slug: 'isoflurane',
    site: {
      receptor: 'gaba_a', pathway: 'anesthesia', emax: 1, hill_n: 1,
      ec50_mg_l: 83, source_pmid: 'PMID:11408543',
      note: 'Hapfelmeier 2001 JPET — abstract verbatim "maximum increase … at 0.45 mM ISO (about 1 minimum alveolar concentration, EC50)"; HEK α1β2γ2L. MW 184.49',
    },
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0, alreadyHas = 0, missing = 0;

  for (const e of ENTRIES) {
    const c = bySlug.get(e.slug);
    if (!c) { console.warn(`  [warn] missing: ${e.slug}`); missing++; continue; }
    const existing = (c['receptor_occupancy'] as Occupancy[] | undefined) ?? [];
    if (existing.some(s => s.receptor === e.site.receptor && s.source_pmid === e.site.source_pmid)) {
      alreadyHas++; continue;
    }
    existing.push(e.site);
    c['receptor_occupancy'] = existing;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 3b session 5: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
