/**
 * 2026-05-16-pathway-final-citations-batch.ts
 *
 * Final batch covering 7 higher-modulator-density pathways that
 * still had 0 refs after earlier batches. Each PMID verified via
 * NCBI E-utilities `esummary` 2026-05-16 against pathway content.
 *
 *   PMID:28826372 — Newman JC, Verdin E 2017 Annu Rev Nutr.
 *     "β-Hydroxybutyrate: A Signaling Metabolite"
 *     Applies: ketone_body_metabolism_supplementation,
 *              ketone_body_synthesis
 *   PMID:19460998 — Vander Heiden MG, Cantley LC, Thompson CB 2009
 *     Science. "Understanding the Warburg effect: metabolic
 *     requirements of cell proliferation"
 *     Applies: glycolysis
 *   PMID:10893433 — Wyss M, Kaddurah-Daouk R 2000 Physiol Rev.
 *     "Creatine and creatinine metabolism"
 *     Applies: creatine_phosphocreatine_energy
 *   PMID:23908456 — Curthoys NP, Moe OW 2014 Clin J Am Soc Nephrol.
 *     "Proximal tubule function and response to acidosis"
 *     Applies: renal_tubular_transport
 *   PMID:15564334 — Slominski A et al. 2005 Endocrinology.
 *     "Preservation of eumelanin hair pigmentation in
 *     proopiomelanocortin-deficient mice"
 *     Applies: epidermal_keratinization_melanogenesis
 *   PMID:22262082 — Stamer WD, Acott TS 2012 Curr Opin Ophthalmol.
 *     "Current understanding of conventional outflow dysfunction in
 *     glaucoma"
 *     Applies: aqueous_humor_iop_regulation
 *
 * Pathways left uncited after this session (~30, mostly textbook-
 * biochem with 0 or few modulators where the strongest canonical
 * anchor is a textbook chapter without a stable PMID; less valuable
 * to cite weakly than to leave uncited):
 *   aminosugar_metabolism, bh4_cycle, coa_synthesis,
 *   fatty_acid_biosynthesis, fructose_metabolism, galactose_metabolism,
 *   glycine_serine_threonine_metabolism, glycerophospholipid_metabolism,
 *   heme_degradation_bilirubin, lysine_metabolism, oxidative_phosphorylation,
 *   pentose_phosphate_pathway, phenylalanine_metabolism, polyol_pathway,
 *   purine_catabolism, purine_de_novo_synthesis, pyrimidine_metabolism,
 *   pyruvate_metabolism, sphingolipid_metabolism, taurine_synthesis,
 *   tca_cycle, transporter_phase3_overview, tyrosine_metabolism,
 *   choline_tmao_metabolism, nucleoside_purine_pyrimidine_supplementation,
 *   fungal_ergosterol_biosynthesis, autonomic_balance,
 *   cognitive_peptide_axis, skeletal_muscle_relaxants,
 *   skin_antimicrobial_antiparasitic, sunscreen_uv_photoprotection,
 *   tissue_repair_peptides, antimicrobial_cosmetic_peptides
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  ketone_body_metabolism_supplementation: ['PMID:28826372'],
  ketone_body_synthesis: ['PMID:28826372'],
  glycolysis: ['PMID:19460998'],
  creatine_phosphocreatine_energy: ['PMID:10893433'],
  renal_tubular_transport: ['PMID:23908456'],
  epidermal_keratinization_melanogenesis: ['PMID:15564334'],
  aqueous_humor_iop_regulation: ['PMID:22262082'],
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
