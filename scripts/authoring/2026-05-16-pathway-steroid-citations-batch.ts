/**
 * 2026-05-16-pathway-steroid-citations-batch.ts
 *
 * Backfills refs[] on the 8 steroid-related pathways which previously
 * shipped with 0 (or 1) refs. Each PMID below was verified via NCBI
 * E-utilities `esummary` 2026-05-16 (title + first-author + journal +
 * year confirmed before applying). Existing refs are preserved + merged
 * (dedup by string) with the new list so the two pathways that
 * already had one cite each don't lose them.
 *
 * Per-step source_pmid + per-modulator source_pmid are intentionally
 * NOT touched here — that's a deeper-layer pass after the refs[]
 * surface is solid. Goal of this batch is broad coverage: each
 * steroid pathway gains an authoritative anchor or two so the
 * detail page's references section is no longer empty.
 *
 * Citations applied:
 *
 *   PMID:23439798 — Chandrasekhar K et al. 2012 Indian J Psychol Med.
 *                   "A prospective, randomized double-blind, placebo-
 *                   controlled study of safety and efficacy of a high-
 *                   concentration full-spectrum extract of ashwagandha
 *                   root in reducing stress and anxiety in adults"
 *                   Applies: adaptogen_hpa_stress_modulation
 *   PMID:16261511 — Wagner H 2005 Phytother Res.
 *                   "Stimulating effect of adaptogens: an overview
 *                   with particular reference to their efficacy
 *                   following single dose administration"
 *                   Applies: adaptogen_hpa_stress_modulation
 *
 *   PMID:12196747 — Olsen EA et al. 2002 J Am Acad Dermatol.
 *                   Minoxidil 5% vs 2% vs placebo in male-pattern
 *                   hair loss (pivotal RCT)
 *                   Applies: androgenetic_alopecia_minoxidil
 *   PMID:18573712 — Meehan AG et al. 2008 Eur J Dermatol.
 *                   "Long-term treatment with finasteride 1 mg
 *                   decreases the likelihood of developing further
 *                   visible hair loss in men with androgenetic
 *                   alopecia"
 *                   Applies: androgenetic_alopecia_minoxidil
 *
 *   PMID:24881730 — Beer TM et al. 2014 NEJM.
 *                   "Enzalutamide in metastatic prostate cancer
 *                   before chemotherapy" (PREVAIL)
 *                   Applies: aromatase_androgen_receptor_axis
 *   PMID:21612468 — de Bono JS et al. 2011 NEJM.
 *                   "Abiraterone and increased survival in metastatic
 *                   prostate cancer" (COU-AA-301)
 *                   Applies: aromatase_androgen_receptor_axis
 *   PMID:15639680 — Tobias JS / ATAC Trialists' Group 2005 Lancet.
 *                   ATAC trial 5-year results — anastrozole vs
 *                   tamoxifen in postmenopausal breast cancer
 *                   Applies: aromatase_androgen_receptor_axis
 *
 *   PMID:12927427 — Beral V 2003 Lancet.
 *                   "Breast cancer and hormone-replacement therapy in
 *                   the Million Women Study"
 *                   Applies: estrogen_receptor_genomic_nongenomic
 *   PMID:19783454 — Levin ER 2009 Trends Endocrinol Metab.
 *                   "Plasma membrane estrogen receptors"
 *                   Applies: estrogen_receptor_genomic_nongenomic
 *
 *   PMID:15714387 — Lydon JP et al. 2005 Semin Reprod Med.
 *                   "Revealing progesterone's role in uterine and
 *                   mammary gland biology: insights from the mouse"
 *                   Applies: progesterone_receptor_signaling
 *   PMID:29544630 — Reddy DS 2018 Vitam Horm.
 *                   "GABA-A Receptors Mediate Tonic Inhibition and
 *                   Neurosteroid Sensitivity in the Brain"
 *                   Applies: progesterone_receptor_signaling
 *                   (anchors the allopregnanolone → GABA-A non-PR branch)
 *
 *   PMID:27138015 — Dalton JT 2016 Curr Oncol Rep.
 *                   "Study Design and Rationale for the Phase 3
 *                   Clinical Development Program of Enobosarm"
 *                   Applies: sarm_androgen_modulation
 *   PMID:24189892 — Steiner MS, Dalton JT 2013 Curr Opin Support
 *                   Palliat Care. "Selective androgen receptor
 *                   modulators for the prevention and treatment of
 *                   muscle wasting associated with cancer"
 *                   Applies: sarm_androgen_modulation
 *   PMID:33148520 — Willoughby DS et al. 2020 Steroids.
 *                   SARMs — recreational/athletic use mechanisms +
 *                   deleterious effects
 *                   Applies: sarm_androgen_modulation
 *
 *   PMID:21051590 — Miller WL, Auchus RJ 2011 Endocr Rev.
 *                   "The molecular biology, biochemistry, and
 *                   physiology of human steroidogenesis and its
 *                   disorders"
 *                   Applies: steroid_hormone_biosynthesis
 *   PMID:15583024 — Payne AH, Hales DB 2004 Endocr Rev.
 *                   "Overview of steroidogenic enzymes in the
 *                   pathway from cholesterol to active steroid
 *                   hormones"
 *                   Applies: steroid_hormone_biosynthesis
 *
 *   PMID:24813302 — Eichenfield LF et al. 2014 J Am Acad Dermatol.
 *                   "Guidelines of care for the management of atopic
 *                   dermatitis. Section 2: Management and treatment
 *                   of atopic dermatitis with topical therapies"
 *                   Applies: topical_steroid_skin_inflammation
 *   PMID:31264114 — Tallman AM et al. 2019 Am J Clin Dermatol.
 *                   "Efficacy and Safety of Crisaborole Ointment,
 *                   2%, for the Treatment of Mild-to-Moderate Atopic
 *                   Dermatitis"
 *                   Applies: topical_steroid_skin_inflammation
 *
 * Coverage delta: 8 steroid pathways had 0 or 1 refs → 2-3 refs each.
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
  // other fields untouched
  [k: string]: unknown;
}

/** Each entry: pathway slug → PMIDs to add. The script merges these
 *  into the existing refs[] (dedup by string equality) so authored
 *  refs that pre-date this batch are preserved. */
const NEW_REFS: Record<string, string[]> = {
  adaptogen_hpa_stress_modulation: [
    'PMID:23439798',
    'PMID:16261511',
  ],
  androgenetic_alopecia_minoxidil: [
    'PMID:12196747',
    'PMID:18573712',
  ],
  aromatase_androgen_receptor_axis: [
    'PMID:24881730',
    'PMID:21612468',
    'PMID:15639680',
  ],
  estrogen_receptor_genomic_nongenomic: [
    'PMID:12927427',
    'PMID:19783454',
  ],
  progesterone_receptor_signaling: [
    'PMID:15714387',
    'PMID:29544630',
  ],
  sarm_androgen_modulation: [
    'PMID:27138015',
    'PMID:24189892',
    'PMID:33148520',
  ],
  steroid_hormone_biosynthesis: [
    'PMID:21051590',
    'PMID:15583024',
  ],
  topical_steroid_skin_inflammation: [
    'PMID:24813302',
    'PMID:31264114',
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
