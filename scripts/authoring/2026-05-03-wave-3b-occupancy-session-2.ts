/**
 * 2026-05-03-wave-3b-occupancy-session-2.ts — Wave 3b Hill occupancy.
 *
 * 7 verified receptor occupancy entries on compounds that already have
 * an authored kₑₒ from Wave 3a (no new kₑₒ needed this session).
 *
 *   ── μ-opioid (analgesia) ──
 *     - sufentanil    Ki   0.138 nM  hMOR recombinant (PMID:21215785, Volpe 2011)
 *     - alfentanil    EC50 20.1  nM  guinea pig ileum, MOR-mediated functional (PMID:1658308, James 1991)
 *     - remifentanil  EC50  2.4  nM  guinea pig ileum, MOR-mediated functional (PMID:1658308, James 1991)
 *
 *   ── α2A-adrenergic (sedation) ──
 *     - dexmedetomidine IC50  1.3  nM  rat brain α2 (PMID:10648329, Eisenach 1999)
 *     - clonidine       IC50 12.5  nM  rat brain α2 (PMID:10648329, Eisenach 1999)
 *
 *   ── NMDA (anesthesia) ──
 *     - ketamine     Ki  300 nM (S-enantiomer)  rat brain PCP site (PMID:9311667, Øye 1992)
 *
 *   ── GABA-A (anesthesia) ──
 *     - propofol     EC50 2.3 µM  recombinant α1β1γ2L potentiation (PMID:9422818, Krasowski 1998)
 *
 * Method notes (preserved in `note`): alfentanil + remifentanil values
 * are functional EC50 from guinea pig ileum — the classical pre-cloning
 * MOR potency bioassay — rather than radioligand Ki. For a Hill curve
 * (fractional pharmacological response) functional EC50 is actually a
 * better fit than Ki, but readers should know which it is. Same for
 * propofol (allosteric GABA-A potentiation EC50).
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
    slug: 'sufentanil',
    site: {
      receptor: 'mu_opioid', pathway: 'analgesia', emax: 1, hill_n: 1,
      ec50_mg_l: 5.334e-5, source_pmid: 'PMID:21215785',
      note: 'Volpe 2011 Reg Toxicol Pharmacol — abstract verbatim "K(i) values obtained ranged from 0.1380 nM (sufentanil)…"; recombinant hMOR. MW 386.55',
    },
  },
  {
    slug: 'alfentanil',
    site: {
      receptor: 'mu_opioid', pathway: 'analgesia', emax: 1, hill_n: 1,
      ec50_mg_l: 8.372e-3, source_pmid: 'PMID:1658308',
      note: 'James 1991 JPET (remifentanil characterization) — abstract verbatim "alfentanil (EC50 = 20.1 ± 1.2 nM)" guinea pig ileum, MOR-mediated functional EC50. MW 416.52',
    },
  },
  {
    slug: 'remifentanil',
    site: {
      receptor: 'mu_opioid', pathway: 'analgesia', emax: 1, hill_n: 1,
      ec50_mg_l: 9.035e-4, source_pmid: 'PMID:1658308',
      note: 'James 1991 JPET — abstract verbatim "GI 87084B…(EC50 = 2.4 ± 0.6 nM)" guinea pig ileum, "acted through the mu class of opioid receptors". Functional EC50. MW 376.45',
    },
  },
  {
    slug: 'dexmedetomidine',
    site: {
      receptor: 'alpha_2a', pathway: 'sedation', emax: 1, hill_n: 1,
      ec50_mg_l: 0.000260, source_pmid: 'PMID:10648329',
      note: 'Eisenach 1999 — abstract "0.25 and 1.3 nM (DXM)" spinal cord / brain, [3H]UK14304 displacement, rat α2 (predominantly α2A in CNS). Brain value used. MW 200.28',
    },
  },
  {
    slug: 'clonidine',
    site: {
      receptor: 'alpha_2a', pathway: 'sedation', emax: 1, hill_n: 1,
      ec50_mg_l: 0.002876, source_pmid: 'PMID:10648329',
      note: 'Eisenach 1999 — abstract "10.8 and 12.5 nM (CL)" spinal cord / brain, same [3H]UK14304 displacement. Brain value used. MW 230.10',
    },
  },
  {
    slug: 'ketamine',
    site: {
      receptor: 'nmda', pathway: 'anesthesia', emax: 1, hill_n: 1,
      ec50_mg_l: 0.07132, source_pmid: 'PMID:9311667',
      note: 'Øye 1992 — abstract verbatim "(S)-ketamine (Ki 0.3 µM) was found to possess a 5 times higher affinity"; [3H]MK-801 displacement at PCP/open-channel site, rat brain. S-enantiomer; racemate ~2× higher. MW 237.73',
    },
  },
  {
    slug: 'propofol',
    site: {
      receptor: 'gaba_a', pathway: 'anesthesia', emax: 1, hill_n: 1,
      ec50_mg_l: 0.4100, source_pmid: 'PMID:9422818',
      note: 'Krasowski 1998 — abstract verbatim "calculated EC50 values were 2.3 ± 0.2 µM" for GABA potentiation at recombinant α1β1γ2L. Allosteric EC50, not competitive Ki. MW 178.27',
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
  console.log(`\nWave 3b session 2: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
