/**
 * 2026-05-22-agmatine-refs.ts — populate agmatine.refs[].
 *
 * Tail of the 2026-05-17 recon. The recon verified 7 load-bearing PMIDs
 * but left agmatine.refs[] empty. Each PMID below is referenced in either
 * the compound's mechanism text, its dose range, or its pk_unauthored.note,
 * and was verified verbatim during the original recon (see header of
 * scripts/authoring/2026-05-17-agmatine-recon.ts).
 *
 *   PMID:8786560  — Regunathan 1996 JPET. Rat aortic SMC I2 imidazoline Ki
 *                   = 240 ± 25 nM. Supports "Imidazoline I1/I2 receptor
 *                   ligand" claim in mechanism.
 *   PMID:7715734  — Pinthong 1995 NSAP. Rat cerebral cortex α2 pKi 5.10
 *                   → Ki ≈ 7.94 µM. Supports "α₂-adrenergic partial
 *                   agonist" claim.
 *   PMID:8930173  — Piletz 1996 JPET. I1 fold-selectivity (1400×/5000×/
 *                   800× over α2A/B/C). Supports "I1 receptor ligand"
 *                   claim; absolute Ki dead per recon.
 *   PMID:15982768 — Askalany 2005 Neurosci Res. Recombinant NMDA IC50
 *                   ~300 µM at −70 mV. Supports "NMDA receptor antagonist
 *                   at nitric-oxide site" claim; voltage-dependent so
 *                   doesn't lint as occupancy.
 *   PMID:37770201 — Clements 2023 JPET. Rat IV/PO PK (F 29-35%, PO t½
 *                   74-117 min, IV t½ 14.9-18.9 min). Cited in
 *                   pk_unauthored.note as best-available PK.
 *   PMID:20447305 — Keynan/Gilad 2010 RCT. Source of clinical dose
 *                   schedule (1.3-3.6 g/day range underlies doses.PO).
 *   PMID:23769988 — Drug Discov Today 2013, 16-author consensus review
 *                   "Agmatine: clinical applications after 100 years in
 *                   translation". Dispositive null for human PK.
 *
 * No new literature this pass — the 2026-05-22 PubMed sweep (Rafi 2024
 * review PMID:38608401, Cao 2026 microbiome PMID:41314165, plus 5 newer
 * preclinical papers) yielded nothing authorable. See AUTHORING_GAPS.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  refs?: string[];
  [k: string]: unknown;
}

const REFS = [
  'PMID:8786560',
  'PMID:7715734',
  'PMID:8930173',
  'PMID:15982768',
  'PMID:37770201',
  'PMID:20447305',
  'PMID:23769988',
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const c = data.find(x => x.slug === 'agmatine');
  if (!c) { console.error('agmatine not in registry'); process.exit(1); }

  const current = JSON.stringify(c.refs ?? []);
  const next = JSON.stringify(REFS);
  if (current === next) {
    console.log('agmatine.refs already up to date — no-op');
    return;
  }

  c.refs = REFS;
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`agmatine.refs populated with ${REFS.length} PMIDs`);
}

main();
