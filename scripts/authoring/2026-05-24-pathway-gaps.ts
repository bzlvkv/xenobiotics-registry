/**
 * 2026-05-24-pathway-gaps.ts
 *
 * #3 content-gap audit — fixes the two unambiguous gaps the audit surfaced:
 *  A) growth_hormone_ghs_axis had a DUPLICATE edge (ghrh -> pituitary-gh-release
 *     twice). Keep the richer-note copy, drop the thin duplicate. GH has 0 step
 *     pins, so removing a step is index-safe.
 *  B) 3 pathways carried ZERO refs; add one canonical, esummary-verified
 *     (2026-05-24) review each, grounding the textbook notes authored earlier:
 *       antimicrobial_cosmetic_peptides   PMID:15703760 (Brogden 2005 NRMicro, AMP mechanism)
 *       cognitive_peptide_axis            PMID:11992114 (Born 2002 Nat Neurosci, transnasal CNS)
 *       nucleoside_purine_pyrimidine_supplementation  PMID:9785353 (Cosgrove 1998 Nutrition)
 * Idempotent. tsx scripts/authoring/2026-05-24-pathway-gaps.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Step = { from: string; to: string; via?: string; note?: string };
type Pathway = { slug: string; steps: Step[]; modulators?: Array<{ step?: number }>; refs?: string[] };

const data: Pathway[] = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));
const find = (slug: string) => {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  return pw;
};

// ── A) dedup growth_hormone_ghs_axis ───────────────────────────────────────
const gh = find('growth_hormone_ghs_axis');
const dupKey = (s: Step) => s.from === 'ghrh' && s.to === 'pituitary-gh-release';
const dups = gh.steps.filter(dupKey);
if (dups.length > 1) {
  if ((gh.modulators ?? []).some(m => m.step !== undefined)) {
    throw new Error('growth_hormone_ghs_axis has step pins — dedup would need reindexing; aborting');
  }
  // keep the copy with the longer (richer) note; drop the rest
  const keep = dups.reduce((a, b) => (b.note?.length ?? 0) > (a.note?.length ?? 0) ? b : a);
  let removed = 0;
  gh.steps = gh.steps.filter(s => !dupKey(s) || s === keep);
  removed = dups.length - 1;
  console.log(`growth_hormone_ghs_axis: removed ${removed} duplicate edge(s) → ${gh.steps.length} steps`);
} else {
  console.log('growth_hormone_ghs_axis: no duplicate edge (already deduped)');
}

// ── B) add a verified ref to each zero-ref pathway ──────────────────────────
const REFS: Record<string, string> = {
  antimicrobial_cosmetic_peptides: 'PMID:15703760',
  cognitive_peptide_axis: 'PMID:11992114',
  nucleoside_purine_pyrimidine_supplementation: 'PMID:9785353',
};
let refsAdded = 0;
for (const [slug, ref] of Object.entries(REFS)) {
  const pw = find(slug);
  pw.refs = pw.refs ?? [];
  if (!pw.refs.includes(ref)) { pw.refs.push(ref); refsAdded++; console.log(`${slug}: + ${ref}`); }
  else console.log(`${slug}: ${ref} already present`);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`\ngaps: GH deduped, ${refsAdded} refs added`);
