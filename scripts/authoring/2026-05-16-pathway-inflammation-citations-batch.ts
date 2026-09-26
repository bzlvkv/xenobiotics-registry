/**
 * 2026-05-16-pathway-inflammation-citations-batch.ts
 *
 * Backfills refs[] on the 8 inflammation / immune-modulation
 * pathways still uncited after the steroid + CYP + NT-receptor +
 * endocrine batches. The two histamine pathways from the inflammation
 * cluster (histamine_axis, histamine_receptor_pharmacology) were
 * already covered in the NT-receptor batch and are skipped here.
 *
 * Each PMID below was verified via NCBI E-utilities `esummary`
 * 2026-05-16 (title + first-author + journal + year confirmed
 * before applying). Pre-existing refs are merged + deduped.
 *
 * Citations applied:
 *
 *   PMID:11287977 — Walport MJ 2001 N Engl J Med.
 *                   "Complement. First of two parts."
 *                   Applies: complement_cascade
 *   PMID:11297706 — Walport MJ 2001 N Engl J Med.
 *                   "Complement. Second of two parts."
 *                   Applies: complement_cascade
 *   PMID:20720586 — Ricklin D, Hajishengallis G, Yang K, Lambris JD
 *                   2010 Nat Immunol.
 *                   "Complement: a key system for immune surveillance
 *                   and homeostasis"
 *                   Applies: complement_cascade
 *
 *   PMID:28612747 — McInnes IB, Schett G 2017 Lancet.
 *                   "Pathogenetic insights from the treatment of
 *                   rheumatoid arthritis"
 *                   (canonical contemporary review for TNF / IL-6 /
 *                   IL-17 / JAK class biologics in RA — anchors the
 *                   whole biologic blockade therapeutic class)
 *                   Applies: cytokine_biologic_blockade
 *
 *   PMID:23964932 — Feagan BG et al. / GEMINI 1 Study Group 2013
 *                   N Engl J Med.
 *                   "Vedolizumab as induction and maintenance
 *                   therapy for ulcerative colitis"
 *                   Applies: ibd_mucosal_immunomodulation
 *
 *   PMID:22658127 — Topalian SL et al. 2012 N Engl J Med.
 *                   "Safety, activity, and immune correlates of
 *                   anti-PD-1 antibody in cancer"
 *                   Applies: immune_checkpoint_blockade
 *   PMID:20525992 — Hodi FS et al. 2010 N Engl J Med.
 *                   "Improved survival with ipilimumab in patients
 *                   with metastatic melanoma"
 *                   Applies: immune_checkpoint_blockade
 *   PMID:22437870 — Pardoll DM 2012 Nat Rev Cancer.
 *                   "The blockade of immune checkpoints in cancer
 *                   immunotherapy"
 *                   Applies: immune_checkpoint_blockade
 *
 *   PMID:17978293 — Peters-Golden M, Henderson WR Jr 2007
 *                   N Engl J Med.
 *                   "Leukotrienes"
 *                   Applies: mast_cell_leukotriene_axis
 *                   (canonical NEJM review; sole ref by intent)
 *
 *   PMID:21525931 — Goodridge HS et al. 2011 Nature.
 *                   "Activation of the innate immune receptor Dectin-1
 *                   upon formation of a 'phagocytic synapse'"
 *                   Applies: medicinal_mushroom_beta_glucans
 *
 *   PMID:18267068 — Hayden MS, Ghosh S 2008 Cell.
 *                   "Shared principles in NF-kappaB signaling"
 *                   Applies: nfkb_signaling
 *   PMID:16175180 — Karin M, Greten FR 2005 Nat Rev Immunol.
 *                   "NF-kappaB: linking inflammation and immunity to
 *                   cancer development and progression"
 *                   Applies: nfkb_signaling
 *
 *   PMID:20303873 — Schroder K, Tschopp J 2010 Cell.
 *                   "The inflammasomes"
 *                   Applies: nlrp3_inflammasome
 *   PMID:30026524 — Mangan MSJ et al. 2018 Nat Rev Drug Discov.
 *                   "Targeting the NLRP3 inflammasome in inflammatory
 *                   diseases"
 *                   Applies: nlrp3_inflammasome
 *
 * Coverage delta: 8 inflammation pathways at 0 refs → 1-3 refs each.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway {
  slug: string;
  refs?: string[];
  [k: string]: unknown;
}

const NEW_REFS: Record<string, string[]> = {
  complement_cascade: [
    'PMID:11287977',
    'PMID:11297706',
    'PMID:20720586',
  ],
  cytokine_biologic_blockade: [
    'PMID:28612747',
  ],
  ibd_mucosal_immunomodulation: [
    'PMID:23964932',
  ],
  immune_checkpoint_blockade: [
    'PMID:22658127',
    'PMID:20525992',
    'PMID:22437870',
  ],
  mast_cell_leukotriene_axis: [
    'PMID:17978293',
  ],
  medicinal_mushroom_beta_glucans: [
    'PMID:21525931',
  ],
  nfkb_signaling: [
    'PMID:18267068',
    'PMID:16175180',
  ],
  nlrp3_inflammasome: [
    'PMID:20303873',
    'PMID:30026524',
  ],
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const summary: Array<{ slug: string; before: number; after: number }> = [];
  const missing: string[] = [];

  for (const [slug, newRefs] of Object.entries(NEW_REFS)) {
    const path = data.find(p => p.slug === slug);
    if (!path) {
      missing.push(slug);
      continue;
    }
    const before = (path.refs ?? []).length;
    const merged = Array.from(new Set([...(path.refs ?? []), ...newRefs]));
    path.refs = merged;
    summary.push({ slug, before, after: merged.length });
  }

  if (missing.length > 0) {
    console.error('FAIL — pathways not found in registry:');
    for (const s of missing) console.error('  -', s);
    process.exit(1);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated refs[] on ${summary.length} pathways:`);
  for (const r of summary) {
    console.log(`  ${r.slug.padEnd(40)}  refs: ${r.before} → ${r.after}`);
  }
}

main();
