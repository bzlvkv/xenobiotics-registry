/**
 * 2026-05-16-pathway-vitamin-mineral-citations-batch.ts
 *
 * 16 vitamin / mineral / cofactor pathways. Each PMID below verified
 * via NCBI E-utilities `esummary` 2026-05-16. Content-first matching:
 * read the pathway description, then pick PMIDs that anchor that
 * content (deficiency clinical-practice / metabolism review / NEJM
 * clinical-practice articles where they exist).
 *
 *   PMID:23301732 — Stabler SP 2013 NEJM. Vitamin B12 deficiency.
 *     Applies: vitamin_b12_metabolism
 *   PMID:15189147 — Eliot AC, Kirsch JF 2004 Annu Rev Biochem.
 *     Pyridoxal phosphate enzymes: mechanistic, structural, and
 *     evolutionary considerations.
 *     Applies: vitamin_b6_metabolism
 *   PMID:36287374 — Giustina A et al. 2023 Endocrine. Vitamin D in
 *     the older population: a consensus statement.
 *     Applies: vitamin_d_metabolism
 *   PMID:22516726 — Shearer MJ et al. 2012 Adv Nutr. Vitamin K
 *     nutrition, metabolism, and requirements.
 *     Applies: vitamin_k_cycle
 *   PMID:20608755 — Pietrzik K et al. 2010 Clin Pharmacokinet.
 *     Folic acid and L-5-methyltetrahydrofolate: clinical PK/PD.
 *     Applies: folate_one_carbon
 *   PMID:16462170 — Said HM 2006 Curr Opin Gastroenterol.
 *     Intestinal absorption of water-soluble vitamins: an update.
 *     Applies: biotin_metabolism
 *   PMID:10064315 — Said HM 1999 J Nutr. Cellular uptake of biotin:
 *     mechanisms and regulation.
 *     Applies: biotin_metabolism
 *   PMID:20642790 — Galvin R et al. 2010 Eur J Neurol. EFNS
 *     guidelines for diagnosis, therapy and prevention of Wernicke
 *     encephalopathy.
 *     Applies: thiamine_metabolism
 *   PMID:18429699 — Bogan KL, Brenner C 2008 Annu Rev Nutr.
 *     Nicotinic acid, nicotinamide, and nicotinamide riboside:
 *     NAD+ precursor vitamins evaluation.
 *     Applies: niacin_nad_synthesis
 *   PMID:16688755 — Blomhoff R, Blomhoff HK 2006 J Neurobiol.
 *     Overview of retinoid metabolism and function.
 *     Applies: retinol_vitamin_a_metabolism
 *   PMID:25946282 — Camaschella C 2015 NEJM. Iron-deficiency anemia.
 *     Applies: iron_metabolism
 *   PMID:11673399 — Roy CN, Andrews NC 2001 Hum Mol Genet. Iron
 *     metabolism: mutations, mechanisms and modifiers.
 *     Applies: iron_metabolism
 *   PMID:20494114 — Bentinger M, Tekle M, Dallner G 2010
 *     Biochem Biophys Res Commun. Coenzyme Q: biosynthesis and
 *     functions.
 *     Applies: ubiquinone_biosynthesis
 *   PMID:39788322 — Maret W 2025 J Nutr. The Arcana of Zinc.
 *     Applies: mineral_enzyme_cofactor_overview
 *   PMID:17561087 — Brigelius-Flohé R, Traber MG 2007
 *     Free Radic Biol Med. Is vitamin E an antioxidant, a regulator
 *     of signal transduction and gene expression, or a 'junk' food?
 *     Applies: vitamin_antioxidant_status
 *   PMID:18601945 — Lu SC 2009 Mol Aspects Med. Regulation of
 *     glutathione synthesis.
 *     Applies: glutathione_metabolism
 *   PMID:16839620 — Ajioka RS, Phillips JD, Kushner JP 2006 BBA.
 *     Biosynthesis of heme in mammals.
 *     Applies: heme_biosynthesis
 *   PMID:21890489 — Förstermann U, Sessa WC 2012 Eur Heart J.
 *     Nitric oxide synthases: regulation and function.
 *     Applies: nitric_oxide_synthesis
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  vitamin_b12_metabolism: ['PMID:23301732'],
  vitamin_b6_metabolism: ['PMID:15189147'],
  vitamin_d_metabolism: ['PMID:36287374'],
  vitamin_k_cycle: ['PMID:22516726'],
  folate_one_carbon: ['PMID:20608755'],
  biotin_metabolism: ['PMID:16462170', 'PMID:10064315'],
  thiamine_metabolism: ['PMID:20642790'],
  niacin_nad_synthesis: ['PMID:18429699'],
  retinol_vitamin_a_metabolism: ['PMID:16688755'],
  iron_metabolism: ['PMID:25946282', 'PMID:11673399'],
  ubiquinone_biosynthesis: ['PMID:20494114'],
  mineral_enzyme_cofactor_overview: ['PMID:39788322'],
  vitamin_antioxidant_status: ['PMID:17561087'],
  glutathione_metabolism: ['PMID:18601945'],
  heme_biosynthesis: ['PMID:16839620'],
  nitric_oxide_synthesis: ['PMID:21890489'],
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
