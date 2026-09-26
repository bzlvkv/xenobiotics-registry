/**
 * 2026-05-16-pathway-metabolic-cardio-citations-batch.ts
 *
 * Backfills refs[] on the remaining glucose-metabolic + cardio +
 * bone/apoptosis/tryptophan pathways still uncited after the
 * steroid + CYP + NT-receptor + endocrine + inflammation batches.
 *
 * 11 pathways across the "core therapeutic + metabolism axes":
 *   gluconeogenesis, glycogen_metabolism, insulin_glucose_homeostasis,
 *   mtor_signaling, nad_sirtuin_axis (glucose / metabolic);
 *   cardiac_action_potential, cholesterol_synthesis,
 *   ldl_receptor_pcsk9_axis (cardio); apoptosis_bcl2_axis,
 *   tryptophan_metabolism, bone_remodeling_rank_rankl (remainders).
 *
 * Each PMID below was verified via NCBI E-utilities `esummary`
 * 2026-05-16 (title + first-author + journal + year confirmed
 * before applying). Existing refs are merged + deduped via Set.
 *
 * Citations applied:
 *
 *   PMID:28868790 — Hatting M et al. 2018 Ann N Y Acad Sci.
 *                   "Insulin regulation of gluconeogenesis"
 *                   Applies: gluconeogenesis
 *
 *   PMID:27051594 — Adeva-Andany MM et al. 2016 BBA Clin.
 *                   "Glycogen metabolism in humans"
 *                   Applies: glycogen_metabolism
 *
 *   PMID:3056758  — Reaven GM 1988 Diabetes.
 *                   "Banting lecture 1988. Role of insulin
 *                   resistance in human disease"
 *                   (foundational metabolic-syndrome paper)
 *                   Applies: insulin_glucose_homeostasis
 *   PMID:11742412 — Saltiel AR, Kahn CR 2001 Nature.
 *                   "Insulin signalling and the regulation of
 *                   glucose and lipid metabolism"
 *                   Applies: insulin_glucose_homeostasis
 *
 *   PMID:28283069 — Saxton RA, Sabatini DM 2017 Cell.
 *                   "mTOR Signaling in Growth, Metabolism, and Disease"
 *                   Applies: mtor_signaling
 *   PMID:22500797 — Laplante M, Sabatini DM 2012 Cell.
 *                   "mTOR signaling in growth control and disease"
 *                   Applies: mtor_signaling
 *
 *   PMID:26785480 — Verdin E 2015 Science.
 *                   "NAD⁺ in aging, metabolism, and neurodegeneration"
 *                   Applies: nad_sirtuin_axis
 *   PMID:28721271 — Imai SI, Guarente L 2016 NPJ Aging Mech Dis.
 *                   "It takes two to tango: NAD⁺ and sirtuins in
 *                   aging/longevity control"
 *                   Applies: nad_sirtuin_axis
 *
 *   PMID:16183911 — Nerbonne JM, Kass RS 2005 Physiol Rev.
 *                   "Molecular physiology of cardiac repolarization"
 *                   (canonical cardiac ion-channel + AP review;
 *                   sole ref by intent)
 *                   Applies: cardiac_action_potential
 *
 *   PMID:19299327 — Goldstein JL, Brown MS 2009 Arterioscler Thromb
 *                   Vasc Biol. "The LDL receptor"
 *                   (canonical paper anchoring cholesterol
 *                   homeostasis + LDL-R biology — cited from both
 *                   cholesterol_synthesis AND ldl_receptor_pcsk9_axis)
 *                   Applies: cholesterol_synthesis,
 *                            ldl_receptor_pcsk9_axis
 *
 *   PMID:28304224 — Sabatine MS et al. / FOURIER Steering Committee
 *                   2017 N Engl J Med.
 *                   "Evolocumab and Clinical Outcomes in Patients
 *                   with Cardiovascular Disease" (FOURIER)
 *                   Applies: ldl_receptor_pcsk9_axis
 *   PMID:30403574 — Schwartz GG et al. / ODYSSEY OUTCOMES
 *                   Committees 2018 N Engl J Med.
 *                   "Alirocumab and Cardiovascular Outcomes after
 *                   Acute Coronary Syndrome"
 *                   Applies: ldl_receptor_pcsk9_axis
 *
 *   PMID:23291630 — Souers AJ et al. 2013 Nat Med.
 *                   "ABT-199, a potent and selective BCL-2 inhibitor,
 *                   achieves antitumor activity while sparing platelets"
 *                   (venetoclax discovery)
 *                   Applies: apoptosis_bcl2_axis
 *   PMID:27178240 — Stilgenbauer S et al. 2016 Lancet Oncol.
 *                   "Venetoclax in relapsed or refractory chronic
 *                   lymphocytic leukaemia with 17p deletion"
 *                   Applies: apoptosis_bcl2_axis
 *
 *   PMID:21640374 — Zwilling D et al. 2011 Cell.
 *                   "Kynurenine 3-monooxygenase inhibition in blood
 *                   ameliorates neurodegeneration"
 *                   Applies: tryptophan_metabolism
 *
 *   PMID:12748652 — Boyle WJ, Simonet WS, Lacey DL 2003 Nature.
 *                   "Osteoclast differentiation and activation"
 *                   (canonical RANK / RANKL / OPG review)
 *                   Applies: bone_remodeling_rank_rankl
 *   PMID:19671655 — Cummings SR et al. / FREEDOM Trial 2009
 *                   N Engl J Med.
 *                   "Denosumab for prevention of fractures in
 *                   postmenopausal women with osteoporosis"
 *                   Applies: bone_remodeling_rank_rankl
 *
 * Coverage delta: 11 pathways at 0 refs → 1-3 refs each.
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
  gluconeogenesis: [
    'PMID:28868790',
  ],
  glycogen_metabolism: [
    'PMID:27051594',
  ],
  insulin_glucose_homeostasis: [
    'PMID:3056758',
    'PMID:11742412',
  ],
  mtor_signaling: [
    'PMID:28283069',
    'PMID:22500797',
  ],
  nad_sirtuin_axis: [
    'PMID:26785480',
    'PMID:28721271',
  ],
  cardiac_action_potential: [
    'PMID:16183911',
  ],
  cholesterol_synthesis: [
    'PMID:19299327',
  ],
  ldl_receptor_pcsk9_axis: [
    'PMID:28304224',
    'PMID:30403574',
    'PMID:19299327',
  ],
  apoptosis_bcl2_axis: [
    'PMID:23291630',
    'PMID:27178240',
  ],
  tryptophan_metabolism: [
    'PMID:21640374',
  ],
  bone_remodeling_rank_rankl: [
    'PMID:12748652',
    'PMID:19671655',
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
