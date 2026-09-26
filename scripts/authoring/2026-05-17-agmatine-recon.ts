/**
 * 2026-05-17-agmatine-recon.ts — Agmatine PK/PD literature reconnaissance.
 *
 * Two literature passes. Net result: nothing lints-clean past the
 * receptor.needs-keo gate. Bookkeeping only.
 *
 * Verified findings (preserved here for future re-author when kₑₒ surfaces):
 *   - PMID 37770201 Clements 2023 JPET — rat IV/PO PK, F = 0.29-0.35,
 *     PO t½ 74.4-117 min (flip-flop), IV t½ 14.9-18.9 min. NOT human.
 *   - PMID 8786560 Regunathan 1996 JPET — rat aortic SMC, agmatine I2
 *     imidazoline Ki = 240 ± 25 nM ([3H]idazoxan competition).
 *   - PMID 7715734 Pinthong 1995 NSAP — rat cerebral cortex α2,
 *     pKi 5.10 ± 0.05 → Ki ≈ 7.94 µM (3H-clonidine competition); bovine
 *     α2 pKi 4.77 ± 0.38. Bulk α2, not subtype-resolved.
 *   - PMID 8930173 Piletz 1996 JPET — human platelet I1, fold-selectivity
 *     vs α2A/B/C only (1400× / 5000× / 800×). Ratio, no absolute Ki.
 *   - PMID 15982768 Askalany 2005 Neurosci Res — recombinant NMDA, IC50
 *     ~300 µM at -70 mV (voltage-dependent channel block — wrong model).
 *
 * Skips (added to AUTHORING_GAPS):
 *   - human PK: zero in PubMed (Keynan/Gilad 2010 + 13 Gilad GM papers +
 *     2013 16-author consensus review carry no PK numbers)
 *   - kₑₒ: zero hits on any endpoint
 *   - I2 occupancy: Ki verifiable but blocked by receptor.needs-keo lint
 *   - α2 occupancy: Ki verifiable (rat) but same kₑₒ block
 *   - I1 Ki: only fold-selectivity ratios in abstracts
 *   - NMDA: voltage-dependent channel block, Hill doesn't apply (same
 *     reason Mg²⁺ NMDA is skipped per PLAYBOOK)
 *
 * This script only updates agmatine's pk_unauthored.note with what we
 * now know. AUTHORING_GAPS.md is edited by hand in the same commit.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  pk_unauthored?: { reason: string; note?: string };
  [k: string]: unknown;
}

const NEW_NOTE =
  'Endogenous polyamine; no human PK in PubMed (Gilad/Keynan series + 2013 ' +
  'consensus review carry none). Rat IV/PO PK (PMID:37770201): F 29-35%, ' +
  'PO t½ 74-117 min (flip-flop), IV t½ 14.9-18.9 min. Two verbatim Ki exist ' +
  'but blocked by receptor.needs-keo lint (no published kₑₒ): I2 240 nM ' +
  '(PMID:8786560) and α2 pKi 5.10 → ~7.94 µM (PMID:7715734). See ' +
  'AUTHORING_GAPS.md for the full chase.';

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const c = data.find(x => x.slug === 'agmatine');
  if (!c) { console.error('agmatine not in registry'); process.exit(1); }

  if (c.pk_unauthored?.note === NEW_NOTE) {
    console.log('agmatine pk_unauthored.note already up to date — no-op');
    return;
  }

  c.pk_unauthored = { reason: 'research-only', note: NEW_NOTE };
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log('agmatine pk_unauthored.note updated with rat PK + I2 Ki provenance');
}

main();
