/**
 * 2026-05-16-pathway-textbook-biochem-citations-batch.ts
 *
 * 7 textbook-biochemistry pathways with low modulator density but
 * canonical primary-literature anchors do exist. Each PMID verified
 * via NCBI E-utilities `esummary` 2026-05-16.
 *
 *   PMID:24068518 — Akram M 2014 Cell Biochem Biophys.
 *     "Citric acid cycle and role of its intermediates in metabolism"
 *     Applies: tca_cycle
 *   PMID:25243985 — Stincone A et al. 2015 Biol Rev.
 *     "The return of metabolism: biochemistry and physiology of the
 *     pentose phosphate pathway"
 *     Applies: pentose_phosphate_pathway
 *   PMID:18216770 — Hannun YA, Obeid LM 2008 Nat Rev Mol Cell Biol.
 *     "Principles of bioactive lipid signalling: lessons from
 *     sphingolipids"
 *     Applies: sphingolipid_metabolism
 *   PMID:28411170 — van der Veen JN et al. 2017
 *     Biochim Biophys Acta Biomembr. "The critical role of
 *     phosphatidylcholine and phosphatidylethanolamine metabolism
 *     in health and disease"
 *     Applies: glycerophospholipid_metabolism
 *   PMID:27775730 — Gorman GS et al. 2016 Nat Rev Dis Primers.
 *     "Mitochondrial diseases"
 *     Applies: oxidative_phosphorylation
 *   PMID:30091177 — Zamek-Gliszczynski MJ et al. / Intl Transporter
 *     Consortium 2018 Clin Pharmacol Ther.
 *     "Transporters in Drug Development: 2018 ITC Recommendations
 *     for Transporters of Emerging Clinical Importance"
 *     Applies: transporter_phase3_overview
 *   PMID:29406418 — Tappy L 2018 Curr Opin Clin Nutr Metab Care.
 *     "Fructose metabolism and noncommunicable diseases"
 *     Applies: fructose_metabolism
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  tca_cycle: ['PMID:24068518'],
  pentose_phosphate_pathway: ['PMID:25243985'],
  sphingolipid_metabolism: ['PMID:18216770'],
  glycerophospholipid_metabolism: ['PMID:28411170'],
  oxidative_phosphorylation: ['PMID:27775730'],
  transporter_phase3_overview: ['PMID:30091177'],
  fructose_metabolism: ['PMID:29406418'],
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
