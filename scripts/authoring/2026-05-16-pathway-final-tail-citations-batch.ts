/**
 * 2026-05-16-pathway-final-tail-citations-batch.ts
 *
 * Final 11 pathways. Each PMID verified via NCBI E-utilities
 * `esummary` 2026-05-16.
 *
 *   PMID:21176768 — Daubner SC et al. 2011 Arch Biochem Biophys.
 *     "Tyrosine hydroxylase and regulation of dopamine synthesis"
 *     Applies: tyrosine_metabolism
 *   PMID:24043460 — Hallen A et al. 2013 Amino Acids.
 *     "Lysine metabolism in mammalian brain"
 *     Applies: lysine_metabolism
 *   PMID:17898897 — Smith S, Tsai SC 2007 Nat Prod Rep.
 *     "The type I fatty acid and polyketide synthases:
 *     a tale of two megasynthases"
 *     Applies: fatty_acid_biosynthesis
 *   PMID:12678487 — Wells L et al. 2003 Cell Mol Life Sci.
 *     N-acetylglucosamine as a nutrient sensor + insulin resistance.
 *     Applies: aminosugar_metabolism
 *   PMID:15919781 — Brownlee M 2005 Diabetes. "The pathobiology
 *     of diabetic complications: a unifying mechanism" (anchors
 *     the polyol-aldose-reductase mechanism the pathway describes)
 *     Applies: polyol_pathway
 *   PMID:38980576 — Sikiric P et al. 2024 Inflammopharmacology.
 *     BPC-157 — stable gastric pentadecapeptide tissue protection.
 *     Applies: tissue_repair_peptides
 *   PMID:32043431 — Löffler M et al. 2020
 *     Nucleosides Nucleotides Nucleic Acids.
 *     "The pathway to pyrimidines: The essential focus on
 *     dihydroorotate dehydrogenase"
 *     Applies: pyrimidine_metabolism
 *   PMID:33179964 — Pareek V et al. 2021 Crit Rev Biochem Mol Biol.
 *     "Human de novo purine biosynthesis"
 *     Applies: purine_de_novo_synthesis
 *   PMID:32234503 — Naquet P et al. 2020 Prog Lipid Res.
 *     "Regulation of coenzyme A levels by degradation"
 *     Applies: coa_synthesis
 *   PMID:10711939 — Chosidow O 2000 Lancet.
 *     "Scabies and pediculosis"
 *     Applies: skin_antimicrobial_antiparasitic
 *   PMID:23320122 — Latha MS et al. 2013 J Clin Aesthet Dermatol.
 *     "Sunscreening agents: a review"
 *     Applies: sunscreen_uv_photoprotection
 *
 * Still uncited (3 pathways) — gray-literature heavy (Russian
 * neuropeptides, cosmetic peptides, research peptide
 * supplementation); better uncited than padded with non-canonical
 * references:
 *   cognitive_peptide_axis
 *   antimicrobial_cosmetic_peptides
 *   nucleoside_purine_pyrimidine_supplementation
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  tyrosine_metabolism: ['PMID:21176768'],
  lysine_metabolism: ['PMID:24043460'],
  fatty_acid_biosynthesis: ['PMID:17898897'],
  aminosugar_metabolism: ['PMID:12678487'],
  polyol_pathway: ['PMID:15919781'],
  tissue_repair_peptides: ['PMID:38980576'],
  pyrimidine_metabolism: ['PMID:32043431'],
  purine_de_novo_synthesis: ['PMID:33179964'],
  coa_synthesis: ['PMID:32234503'],
  skin_antimicrobial_antiparasitic: ['PMID:10711939'],
  sunscreen_uv_photoprotection: ['PMID:23320122'],
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
