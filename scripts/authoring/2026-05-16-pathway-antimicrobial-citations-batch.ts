/**
 * 2026-05-16-pathway-antimicrobial-citations-batch.ts
 *
 * Backfills refs[] on 9 antiviral + antimicrobial pathways that
 * shipped with 0 refs. Same content-first authoring rule as the
 * eicosanoid/redox batch: each PMID chosen by matching the
 * pathway's actual mechanism description, then verified via
 * NCBI E-utilities `esummary` 2026-05-16.
 *
 * Citations applied:
 *
 *   PMID:27281742 — De Clercq E, Li G 2016 Clin Microbiol Rev.
 *                   "Approved Antiviral Drugs over the Past 50 Years"
 *                   (canonical 50-year sweep — anchors the entire
 *                   nucleoside-analog chemistry the pathway describes:
 *                   acyclovir TK selectivity, tenofovir, sofosbuvir,
 *                   remdesivir)
 *                   Applies: viral_polymerase_nucleoside_inhibition
 *   PMID:32445440 — Beigel JH et al. / ACTT-1 Study Group 2020
 *                   N Engl J Med.
 *                   "Remdesivir for the Treatment of Covid-19 -
 *                   Final Report"
 *                   Applies: viral_polymerase_nucleoside_inhibition
 *
 *   PMID:10697061 — Treanor JJ et al. 2000 JAMA.
 *                   "Efficacy and safety of the oral neuraminidase
 *                   inhibitor oseltamivir in treating acute influenza"
 *                   (landmark pivotal trial — anchors the NA-inhibitor
 *                   class the pathway describes)
 *                   Applies: viral_protease_neuraminidase
 *   PMID:35172054 — Hammond J et al. / EPIC-HR Investigators 2022
 *                   N Engl J Med.
 *                   "Oral Nirmatrelvir for High-Risk, Nonhospitalized
 *                   Adults with Covid-19" (EPIC-HR — anchors the
 *                   protease-inhibitor branch / Paxlovid)
 *                   Applies: viral_protease_neuraminidase
 *
 *   PMID:9287227  — Hammer SM et al. 1997 N Engl J Med.
 *                   "A controlled trial of two nucleoside analogues
 *                   plus indinavir in persons with human
 *                   immunodeficiency virus infection"
 *                   (landmark HAART trial — established the
 *                   combination antiretroviral therapy backbone
 *                   the pathway describes)
 *                   Applies: hiv_replication_blockade
 *   PMID:24195548 — Walmsley SL et al. / SINGLE Investigators 2013
 *                   N Engl J Med.
 *                   "Dolutegravir plus abacavir-lamivudine for the
 *                   treatment of HIV-1 infection" (SINGLE — anchors
 *                   the INSTI class)
 *                   Applies: hiv_replication_blockade
 *
 *   PMID:23607594 — Lawitz E et al. / NEUTRINO 2013 N Engl J Med.
 *                   "Sofosbuvir for previously untreated chronic
 *                   hepatitis C infection"
 *                   (sofosbuvir NS5B nucleotide analog — pivotal
 *                   pangenotypic trial)
 *                   Applies: hcv_ns_replication
 *   PMID:24725239 — Afdhal N et al. / ION-1 Investigators 2014
 *                   N Engl J Med.
 *                   "Ledipasvir and sofosbuvir for untreated HCV
 *                   genotype 1 infection" (ION-1 — anchors the
 *                   NS5A inhibitor + NS5B combo class)
 *                   Applies: hcv_ns_replication
 *
 *   PMID:29570352 — Lin J et al. 2018 Annu Rev Biochem.
 *                   "Ribosome-Targeting Antibiotics: Modes of Action,
 *                   Mechanisms of Resistance, and Implications for
 *                   Drug Design"
 *                   (canonical structural-biology review of the 30S
 *                   + 50S inhibitor classes the pathway describes;
 *                   sole ref by intent)
 *                   Applies: bacterial_translation_inhibition
 *
 *   PMID:22203377 — Typas A, Banzhaf M, Gross CA, Vollmer W 2011
 *                   Nat Rev Microbiol.
 *                   "From the regulation of peptidoglycan synthesis
 *                   to bacterial growth and morphology"
 *                   (canonical peptidoglycan / PBP / transpeptidase
 *                   review anchoring the β-lactam mechanism the
 *                   pathway describes; sole ref by intent)
 *                   Applies: peptidoglycan_synthesis
 *
 *   PMID:23425167 — Zumla A, Raviglione M, Hafner R, von Reyn CF
 *                   2013 N Engl J Med. "Tuberculosis"
 *                   (anchors the standard RIPE regimen + drug
 *                   landscape the pathway describes)
 *                   Applies: mycobacterial_cell_envelope
 *   PMID:22828481 — Diacon AH et al. 2012 Lancet.
 *                   "14-day bactericidal activity of PA-824,
 *                   bedaquiline, pyrazinamide, and moxifloxacin
 *                   combinations: a randomised trial"
 *                   (bedaquiline clinical anchor)
 *                   Applies: mycobacterial_cell_envelope
 *
 *   PMID:27449972 — Hooper DC, Jacoby GA 2016
 *                   Cold Spring Harb Perspect Med.
 *                   "Topoisomerase Inhibitors: Fluoroquinolone
 *                   Mechanisms of Action and Resistance"
 *                   (canonical fluoroquinolone mechanism review;
 *                   sole ref by intent — covers the dominant
 *                   pharmacology of this dual-mechanism pathway)
 *                   Applies: bacterial_dna_folate_disruption
 *
 *   PMID:21321478 — Crump A, Omura S 2011
 *                   Proc Jpn Acad Ser B Phys Biol Sci.
 *                   "Ivermectin, 'wonder drug' from Japan: the human
 *                   use perspective"
 *                   Applies: helminth_protozoa_targets
 *   PMID:25130507 — Omura S, Crump A 2014 Trends Parasitol.
 *                   "Ivermectin: panacea for resource-poor
 *                   communities?"
 *                   (Omura was 2015 Nobel Laureate for ivermectin
 *                   discovery — these two anchor the avermectin
 *                   class that dominates anthelmintic pharmacology)
 *                   Applies: helminth_protozoa_targets
 *
 * Coverage delta: 9 antimicrobial pathways at 0 refs → 1-2 refs each.
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
  viral_polymerase_nucleoside_inhibition: [
    'PMID:27281742',
    'PMID:32445440',
  ],
  viral_protease_neuraminidase: [
    'PMID:10697061',
    'PMID:35172054',
  ],
  hiv_replication_blockade: [
    'PMID:9287227',
    'PMID:24195548',
  ],
  hcv_ns_replication: [
    'PMID:23607594',
    'PMID:24725239',
  ],
  bacterial_translation_inhibition: [
    'PMID:29570352',
  ],
  peptidoglycan_synthesis: [
    'PMID:22203377',
  ],
  mycobacterial_cell_envelope: [
    'PMID:23425167',
    'PMID:22828481',
  ],
  bacterial_dna_folate_disruption: [
    'PMID:27449972',
  ],
  helminth_protozoa_targets: [
    'PMID:21321478',
    'PMID:25130507',
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
