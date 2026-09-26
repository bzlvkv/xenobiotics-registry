/**
 * 2026-05-16-pathway-signaling-citations-batch.ts
 *
 * 15 signaling pathways. Each PMID verified via NCBI E-utilities
 * `esummary` 2026-05-16. Content-first matching.
 *
 * Skipped (no strong canonical anchor found this pass):
 *   autonomic_balance, cognitive_peptide_axis,
 *   skeletal_muscle_relaxants, skin_antimicrobial_antiparasitic,
 *   sunscreen_uv_photoprotection, tissue_repair_peptides
 * (Russian neuropeptides + research peptides + cosmetic-pharm are
 * dominated by gray literature; better uncited than padded with
 * weak refs.)
 *
 *   PMID:23043438 — Scott JD 2013 Annu Rev Pharmacol Toxicol.
 *     "Creating order from chaos: cellular regulation by kinase
 *     anchoring" (PKA / AKAP scaffolding)
 *     Applies: camp_pka_second_messenger
 *   PMID:12209131 — Beavo JA, Brunton LL 2002 Nat Rev Mol Cell Biol.
 *     "Cyclic nucleotide research -- still expanding after half a
 *     century"
 *     Applies: camp_pka_second_messenger
 *   PMID:19238148 — Malumbres M, Barbacid M 2009 Nat Rev Cancer.
 *     "Cell cycle, CDKs and cancer: a changing paradigm"
 *     Applies: cell_cycle_cdk
 *   PMID:26376968 — Diener HC, Charles A, Goadsby PJ, Holle D 2015
 *     Lancet Neurol. "New therapeutic approaches for the prevention
 *     and treatment of migraine" (CGRP-class therapeutic anchor)
 *     Applies: cgrp_migraine_axis
 *   PMID:18498744 — Kaelin WG Jr, Ratcliffe PJ 2008 Mol Cell.
 *     "Oxygen sensing by metazoans: the central role of the HIF
 *     hydroxylase pathway" (Nobel-prize-winning work)
 *     Applies: hif_oxygen_sensing
 *   PMID:19010359 — Berridge MJ 2009 Biochim Biophys Acta.
 *     "Inositol trisphosphate and calcium signalling mechanisms"
 *     Applies: inositol_phosphate_signaling
 *   PMID:29999544 — Gadina M et al. 2018 J Leukoc Biol.
 *     "Translational and clinical advances in JAK-STAT biology:
 *     The present and future of jakinibs"
 *     Applies: jak_stat_signaling
 *   PMID:9620771  — Krude H et al. 1998 Nat Genet.
 *     "Severe early-onset obesity, adrenal insufficiency and red
 *     hair pigmentation caused by POMC mutations"
 *     Applies: melanocortin_mc4r_axis
 *   PMID:25600267 — Ghamari-Langroudi M et al. 2015 Nature.
 *     "G-protein-independent coupling of MC4R to Kir7.1 in
 *     hypothalamic neurons"
 *     Applies: melanocortin_mc4r_axis
 *   PMID:25738459 — Lee C et al. 2015 Cell Metab.
 *     "The mitochondrial-derived peptide MOTS-c promotes metabolic
 *     homeostasis and reduces obesity and insulin resistance"
 *     (foundational paper establishing the MDP signaling axis)
 *     Applies: mitochondrial_peptide_signaling
 *   PMID:23881373 — Naguib M, Brull SJ 2013 Anesth Analg.
 *     "Reasoning of an anomaly: residual block after sugammadex"
 *     Applies: neuromuscular_junction_blockade
 *   PMID:22992590 — Massagué J 2012 Nat Rev Mol Cell Biol.
 *     "TGFβ signalling in context"
 *     Applies: tgf_beta_signaling
 *   PMID:17471183 — Gillman PK 2007 Br J Pharmacol.
 *     "Tricyclic antidepressant pharmacology and therapeutic drug
 *     interactions updated"
 *     Applies: tricyclic_atypical_antidepressants
 *   PMID:26062986 — Stahl SM 2015 CNS Spectr.
 *     "Modes and nodes explain the mechanism of action of
 *     vortioxetine, a multimodal agent"
 *     Applies: tricyclic_atypical_antidepressants
 *   PMID:17151364 — Druker BJ et al. 2006 N Engl J Med.
 *     "Five-year follow-up of patients receiving imatinib for
 *     chronic myeloid leukemia" (IRIS — TKI anchor)
 *     Applies: tyrosine_kinase_inhibition
 *   PMID:2451132  — Yanagisawa M et al. 1988 Nature.
 *     "A novel potent vasoconstrictor peptide produced by vascular
 *     endothelial cells" (endothelin-1 discovery)
 *     Applies: vasodilator_no_endothelin
 *   PMID:17942972 — Burnett AL 2008 J Androl.
 *     "Molecular pharmacotherapeutic targeting of PDE5 for
 *     preservation of penile health"
 *     Applies: pde5_no_cgmp_axis
 *   PMID:22275187 — Kanai A et al. 2012 Neurourol Urodyn.
 *     "Mechanisms of action of botulinum neurotoxins, β3-adrenergic
 *     receptor agonists, and PDE5 inhibitors in modulating detrusor
 *     function in overactive bladders"
 *     Applies: bladder_detrusor_pharmacology
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  camp_pka_second_messenger: ['PMID:23043438', 'PMID:12209131'],
  cell_cycle_cdk: ['PMID:19238148'],
  cgrp_migraine_axis: ['PMID:26376968'],
  hif_oxygen_sensing: ['PMID:18498744'],
  inositol_phosphate_signaling: ['PMID:19010359'],
  jak_stat_signaling: ['PMID:29999544'],
  melanocortin_mc4r_axis: ['PMID:9620771', 'PMID:25600267'],
  mitochondrial_peptide_signaling: ['PMID:25738459'],
  neuromuscular_junction_blockade: ['PMID:23881373'],
  tgf_beta_signaling: ['PMID:22992590'],
  tricyclic_atypical_antidepressants: ['PMID:17471183', 'PMID:26062986'],
  tyrosine_kinase_inhibition: ['PMID:17151364'],
  vasodilator_no_endothelin: ['PMID:2451132'],
  pde5_no_cgmp_axis: ['PMID:17942972'],
  bladder_detrusor_pharmacology: ['PMID:22275187'],
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
