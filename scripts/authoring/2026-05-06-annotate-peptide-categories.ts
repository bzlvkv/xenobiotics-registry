/**
 * 2026-05-06-annotate-peptide-categories.ts
 *
 * Annotates research / cosmetic / gut-acting peptides with the
 * appropriate pk_unauthored reason. Most peptides in the catalog
 * fall into one of three buckets that can be flagged without
 * verification work:
 *
 *   research-only — pre-clinical / grey-market / Khavinson short
 *                   peptides with no published clinical PK
 *   local-acting  — cosmetic topical peptides (TD only) where systemic
 *                   PK is irrelevant by formulation, OR gut-acting
 *                   peptides degraded in the GI tract before absorption
 *   mixture       — multi-component peptide preparations (e.g.
 *                   cerebrolysin = neurotrophic protein hydrolysate)
 *
 * Spared (for separate clinical-PK authoring agent):
 *   desmopressin, setmelanotide, melanotan-ii, kisspeptin-10
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

type Annotation = { slug: string; reason: 'local-acting' | 'research-only' | 'mixture'; note: string };

const ANNOTATIONS: Annotation[] = [
  // ── Research peptides (pre-clinical, grey-market, no Phase I PK) ──
  { slug: 'ace-031',                reason: 'research-only', note: 'Anti-myostatin / activin receptor IIB ligand trap (Acceleron). Phase II terminated 2013 for nosebleeds; no marketed clinical PK profile.' },
  { slug: 'aod-9604',               reason: 'research-only', note: 'hGH 176-191 fragment; Metabolic Pharmaceuticals development halted in Phase II obesity trials. Pre-clinical PK only.' },
  { slug: 'des-igf-1',              reason: 'research-only', note: 'Truncated IGF-1 analog (research peptide); no clinical PK literature in healthy human cohorts.' },
  { slug: 'dihexa',                 reason: 'research-only', note: 'Hepatocyte growth factor mimetic (PNB Vesper Pharma); pre-clinical pro-cognitive research peptide. No Phase I PK published.' },
  { slug: 'epitalon',               reason: 'research-only', note: 'Khavinson short peptide (Ala-Glu-Asp-Gly); Russian preclinical literature on aging/telomerase. No standard clinical PK published.' },
  { slug: 'epithalon',              reason: 'research-only', note: 'Alternative spelling for the Khavinson short peptide; same compound as epitalon entry. No clinical PK published.' },
  { slug: 'follistatin-344',        reason: 'research-only', note: 'Truncated follistatin isoform; pre-clinical anti-myostatin research. No clinical PK characterization.' },
  { slug: 'humanin',                reason: 'research-only', note: 'Mitochondrial-derived peptide; pre-clinical research on neuroprotection / metabolic regulation. No clinical PK in humans.' },
  { slug: 'mechano-growth-factor',  reason: 'research-only', note: 'IGF-1Ec splice variant (MGF); pre-clinical / sports-supplement research. No clinical PK published.' },
  { slug: 'mots-c',                 reason: 'research-only', note: 'Mitochondrial open-reading-frame peptide; pre-clinical metabolic research. No clinical PK characterization.' },
  { slug: 'pe22-28',                reason: 'research-only', note: 'Spadin-derived peptide (TREK-1 antagonist); pre-clinical antidepressant research. No clinical PK.' },
  { slug: 'pinealon',               reason: 'research-only', note: 'Khavinson tripeptide (Glu-Asp-Arg); Russian preclinical literature on cognitive aging. No standard clinical PK.' },
  { slug: 'ss-31',                  reason: 'research-only', note: 'Stealth Biotherapeutics elamipretide (mitochondrial-targeted peptide). Phase III ongoing; some PK exists in trial reports but not in indexed PubMed abstracts as verbatim values.' },
  { slug: 'tb-500',                 reason: 'research-only', note: 'Synthetic thymosin β4 fragment; veterinary use only (racehorses). No human clinical PK published.' },
  { slug: 'tbp-4',                  reason: 'research-only', note: 'TGF-β-binding peptide research compound. No clinical PK literature.' },
  { slug: 'vilon',                  reason: 'research-only', note: 'Khavinson dipeptide (Lys-Glu); Russian pre-clinical immunoregulatory research. No standard clinical PK.' },
  { slug: 'll-37',                  reason: 'research-only', note: 'Endogenous human cathelicidin antimicrobial peptide; topical/research use. No clinical SC PK characterization.' },
  { slug: 'adropin',                reason: 'research-only', note: 'Endogenous regulatory peptide (ENHO gene product); research SC dosing only, no clinical PK trials.' },
  { slug: 'cholecystokinin',        reason: 'research-only', note: 'Endogenous gut peptide; IV use is in physiological challenge testing only, not therapeutic. No standardized clinical PK profile.' },
  { slug: 'pancreatic-polypeptide', reason: 'research-only', note: 'Endogenous pancreatic peptide; investigational IV use in obesity / appetite research. No marketed-product PK.' },
  { slug: 'vip',                    reason: 'research-only', note: 'Vasoactive Intestinal Peptide; endogenous neuropeptide, occasional research IV use. Not a clinical drug with established PK.' },

  // ── Cosmetic / topical peptides (TD only, systemic PK irrelevant) ─
  { slug: 'argireline',             reason: 'local-acting', note: 'Acetyl hexapeptide-8; topical cosmetic peptide marketed for expression-line softening. Negligible systemic absorption from topical formulation.' },
  { slug: 'matrixyl',               reason: 'local-acting', note: 'Palmitoyl pentapeptide-4 (Matrixyl) — topical cosmetic peptide for collagen stimulation. No systemic plasma PK at cosmetic doses.' },
  { slug: 'snap-8',                 reason: 'local-acting', note: 'Acetyl octapeptide-3; cosmetic topical peptide. Negligible systemic absorption.' },
  { slug: 'snap-29',                reason: 'local-acting', note: 'Cosmetic topical peptide marketed alongside SNAP-8 for the same anti-wrinkle indication. Negligible systemic exposure.' },
  { slug: 'copper-tripeptide-1',    reason: 'local-acting', note: 'GHK-Cu (Cu-bound glycyl-histidyl-lysine); topical cosmetic peptide for skin remodeling. SC research dosing exists but the dominant clinical use is topical.' },
  { slug: 'ghk-cu',                 reason: 'local-acting', note: 'Same compound as copper-tripeptide-1 (alternate naming). Cosmetic topical with negligible systemic PK at typical doses.' },

  // ── Gut-acting peptides (degraded in GI / no systemic absorption) ──
  { slug: 'larazotide',             reason: 'local-acting', note: 'Tight-junction modulator (acetate salt); acts in the small intestine lumen on zonulin-mediated barrier function. F essentially zero by design.' },
  { slug: 'kpv',                    reason: 'local-acting', note: 'α-MSH C-terminal tripeptide; oral use is local-GI for IBD research. No clinical systemic PK published.' },
  { slug: 'type-ii-collagen',       reason: 'local-acting', note: 'Undenatured chicken type-II collagen; oral immune-tolerance mechanism in OA / RA. Acts in gut-associated lymphoid tissue, not systemic plasma.' },

  // ── Multi-component peptide preparation ───────────────────────────
  { slug: 'cerebrolysin',           reason: 'mixture', note: 'Porcine brain protein hydrolysate; mixture of free amino acids + low-MW neuropeptides. No single plasma species to fit PK to; clinical effect attributed to the aggregate neurotrophic activity.' },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, alreadyHas = 0, missing = 0;
  for (const a of ANNOTATIONS) {
    const c = bySlug.get(a.slug);
    if (!c) { console.warn(`  [warn] missing: ${a.slug}`); missing++; continue; }
    if (c.pk_unauthored) { alreadyHas++; continue; }
    c.pk_unauthored = { reason: a.reason, note: a.note };
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`peptide annotation: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
