/**
 * 2026-05-16-pathway-amino-acid-tail-citations-batch.ts
 *
 * 7 more pathways. Each PMID verified via NCBI E-utilities `esummary`
 * 2026-05-16.
 *
 *   PMID:26316329 — Maiuolo J et al. 2016 Int J Cardiol.
 *     "Regulation of uric acid metabolism and excretion"
 *     Applies: purine_catabolism
 *   PMID:28082082 — van Spronsen FJ et al. 2017 Lancet Diabetes
 *     Endocrinol. European PKU guidelines.
 *     Applies: phenylalanine_metabolism
 *   PMID:2227213  — Patel MS, Roche TE 1990 FASEB J.
 *     "Molecular biology and biochemistry of pyruvate
 *     dehydrogenase complexes"
 *     Applies: pyruvate_metabolism
 *   PMID:20301691 — Berry GT 1993 GeneReviews. "Classic
 *     Galactosemia and Clinical Variant Galactosemia"
 *     Applies: galactose_metabolism
 *   PMID:18225966 — See S, Ginzburg R 2008 Pharmacotherapy.
 *     "Skeletal muscle relaxants"
 *     Applies: skeletal_muscle_relaxants
 *   PMID:28093795 — Kaufmann H et al. 2017 Ann Neurol.
 *     "Natural history of pure autonomic failure"
 *     Applies: autonomic_balance
 *   PMID:22220568 — Watschinger K, Werner ER 2012 Biochem J.
 *     Catalytic residues + predicted structure of
 *     tetrahydrobiopterin-dependent alkylglycerol monooxygenase.
 *     Applies: bh4_cycle
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  purine_catabolism: ['PMID:26316329'],
  phenylalanine_metabolism: ['PMID:28082082'],
  pyruvate_metabolism: ['PMID:2227213'],
  galactose_metabolism: ['PMID:20301691'],
  skeletal_muscle_relaxants: ['PMID:18225966'],
  autonomic_balance: ['PMID:28093795'],
  bh4_cycle: ['PMID:22220568'],
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const summary: Array<{ slug: string; before: number; after: number }> = [];
  const missing: string[] = [];
  for (const [slug, newRefs] of Object.entries(NEW_REFS)) {
    const path = data.find(p => p.slug === slug);
    if (!path) { missing.push(slug); continue; }
    const before = (path.refs ?? []).length;
    const merged = Array.from(new Set([...(path.refs ?? []), ...newRefs]));
    path.refs = merged;
    summary.push({ slug, before, after: merged.length });
  }
  if (missing.length > 0) {
    console.error('FAIL — pathways not found:'); for (const s of missing) console.error('  -', s);
    process.exit(1);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated refs[] on ${summary.length} pathways:`);
  for (const r of summary) console.log(`  ${r.slug.padEnd(40)}  refs: ${r.before} → ${r.after}`);
}
main();
