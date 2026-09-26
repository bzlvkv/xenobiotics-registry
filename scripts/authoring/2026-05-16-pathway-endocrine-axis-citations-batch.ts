/**
 * 2026-05-16-pathway-endocrine-axis-citations-batch.ts
 *
 * Backfills refs[] on the 9 endocrine-axis pathways which shipped
 * with 0 refs. Closes out the "core physiology axes" surface —
 * after this batch, HPA / HPG / HPT / RAAS / GnRH / GH / posterior
 * pituitary / gut endocrine / Ca-PO4-PTH all carry primary-source
 * anchors.
 *
 * Each PMID below was verified via NCBI E-utilities `esummary`
 * 2026-05-16 (title + first-author + journal + year confirmed
 * before applying). Several pathways land at 1 ref — same rule as
 * the NT-receptor batch: when a single canonical review
 * (Brent J Clin Invest, Plant Front Neuroendocrinol, Stoop
 * Annu Rev Neurosci) owns the field, padding with a thinner
 * second cite dilutes the signal.
 *
 * Citations applied:
 *
 *   PMID:17615391 — McEwen BS 2007 Physiol Rev.
 *                   "Physiology and neurobiology of stress and
 *                   adaptation: central role of the brain"
 *                   Applies: hpa_axis
 *   PMID:3041279  — Gold PW, Goodwin FK, Chrousos GP 1988 N Engl J Med.
 *                   "Clinical and biochemical manifestations of
 *                   depression. Relation to the neurobiology of
 *                   stress (First of two parts)"
 *                   Applies: hpa_axis
 *
 *   PMID:18838102 — Veldhuis JD 2009 Mol Cell Endocrinol.
 *                   "The aging male hypothalamic-pituitary-gonadal
 *                   axis: pulsatility and feedback"
 *                   Applies: hpg_axis
 *
 *   PMID:22945636 — Brent GA 2012 J Clin Invest.
 *                   "Mechanisms of thyroid hormone action"
 *                   Applies: hpt_axis
 *                   (canonical review; sole ref by intent)
 *
 *   PMID:17970613 — Atlas SA 2007 J Manag Care Pharm.
 *                   "The renin-angiotensin aldosterone system:
 *                   pathophysiological role and pharmacologic
 *                   inhibition"
 *                   Applies: raas_axis
 *   PMID:18378520 — Yusuf S et al. / ONTARGET Investigators 2008
 *                   N Engl J Med.
 *                   "Telmisartan, ramipril, or both in patients at
 *                   high risk for vascular events" (ONTARGET)
 *                   Applies: raas_axis
 *
 *   PMID:25913220 — Plant TM 2015 Front Neuroendocrinol.
 *                   "Neuroendocrine control of the onset of puberty"
 *                   Applies: gnrh_pulse_generator_axis
 *
 *   PMID:10604470 — Kojima M et al. 1999 Nature.
 *                   "Ghrelin is a growth-hormone-releasing acylated
 *                   peptide from stomach"
 *                   (foundational paper — establishes the GHS axis
 *                   that anchors all subsequent ghrelin / GHRP /
 *                   mimetic pharmacology)
 *                   Applies: growth_hormone_ghs_axis
 *   PMID:18057375 — Ho KK / 2007 GH Research Society 2007
 *                   Eur J Endocrinol.
 *                   "Consensus guidelines for the diagnosis and
 *                   treatment of adults with GH deficiency II"
 *                   Applies: growth_hormone_ghs_axis
 *
 *   PMID:26154981 — Stoop R 2015 Annu Rev Neurosci.
 *                   "New opportunities in vasopressin and oxytocin
 *                   research: a perspective from the amygdala"
 *                   Applies: posterior_pituitary_oxt_vp
 *
 *   PMID:38198966 — Drucker DJ 2024 Cell Metab.
 *                   "Prevention of cardiorenal complications in
 *                   people with type 2 diabetes and obesity"
 *                   (the contemporary anchor for incretin / GLP-1 /
 *                   GIP / glucagon co-agonist pharmacology)
 *                   Applies: gi_endocrine_peptides_misc
 *
 *   PMID:17634462 — Holick MF 2007 N Engl J Med.
 *                   "Vitamin D deficiency"
 *                   Applies: calcium_phosphate_pth_axis
 *   PMID:30060226 — Bilezikian JP 2018 J Clin Endocrinol Metab.
 *                   "Primary Hyperparathyroidism"
 *                   Applies: calcium_phosphate_pth_axis
 *
 * Coverage delta: 9 endocrine pathways at 0 refs → 1-2 refs each.
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
  hpa_axis: [
    'PMID:17615391',
    'PMID:3041279',
  ],
  hpg_axis: [
    'PMID:18838102',
  ],
  hpt_axis: [
    'PMID:22945636',
  ],
  raas_axis: [
    'PMID:17970613',
    'PMID:18378520',
  ],
  gnrh_pulse_generator_axis: [
    'PMID:25913220',
  ],
  growth_hormone_ghs_axis: [
    'PMID:10604470',
    'PMID:18057375',
  ],
  posterior_pituitary_oxt_vp: [
    'PMID:26154981',
  ],
  gi_endocrine_peptides_misc: [
    'PMID:38198966',
  ],
  calcium_phosphate_pth_axis: [
    'PMID:17634462',
    'PMID:30060226',
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
