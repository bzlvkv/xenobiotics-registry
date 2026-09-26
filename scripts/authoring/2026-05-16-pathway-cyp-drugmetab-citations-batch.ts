/**
 * 2026-05-16-pathway-cyp-drugmetab-citations-batch.ts
 *
 * Backfills refs[] on the 7 phase-1/phase-2 drug-metabolism pathways
 * which shipped with 0 refs. Pair with the steroid-citations batch
 * (same date) to lift two high-leverage clusters off the empty-refs
 * floor.
 *
 * Each PMID below was verified via NCBI E-utilities `esummary`
 * 2026-05-16 (title + first-author + journal + year confirmed before
 * applying). Existing refs are merged + deduped (none of these
 * pathways had pre-existing refs, but the merge is consistent with
 * the steroid batch so future re-runs are idempotent).
 *
 * Citations applied:
 *
 *   PMID:11179432 — Tukey RH, Strassburg CP 2001 Mol Pharmacol.
 *                   "Genetic multiplicity of the human UDP-
 *                   glucuronosyltransferases and regulation in the
 *                   gastrointestinal tract"
 *                   Applies: conjugation_phase2_overview
 *   PMID:15822171 — Hayes JD, Flanagan JU, Jowsey IR 2005
 *                   Annu Rev Pharmacol Toxicol.
 *                   "Glutathione transferases"
 *                   Applies: conjugation_phase2_overview
 *   PMID:18852012 — Sim E 2008 Toxicology.
 *                   "Arylamine N-acetyltransferases: structural and
 *                   functional implications of polymorphisms"
 *                   Applies: conjugation_phase2_overview
 *
 *   PMID:23333322 — Zanger UM, Schwab M 2013 Pharmacol Ther.
 *                   "Cytochrome P450 enzymes in drug metabolism:
 *                   regulation of gene expression, enzyme activities,
 *                   and impact of genetic variation"
 *                   Applies: cyp_phase1_overview
 *   PMID:18052394 — Guengerich FP 2008 Chem Res Toxicol.
 *                   "Cytochrome p450 and chemical toxicology"
 *                   Applies: cyp_phase1_overview
 *   PMID:16224454 — Wienkers LC, Heath TG 2005 Nat Rev Drug Discov.
 *                   "Predicting in vivo drug interactions from in
 *                   vitro drug discovery data"
 *                   Applies: cyp_phase1_overview
 *
 *   PMID:17718394 — Edenberg HJ 2007 Alcohol Res Health.
 *                   "The genetics of alcohol metabolism: role of
 *                   alcohol dehydrogenase and aldehyde dehydrogenase
 *                   variants"
 *                   Applies: ethanol_metabolism
 *   PMID:15670660 — Lieber CS 2004 Alcohol.
 *                   "Alcoholic fatty liver: its pathogenesis and
 *                   mechanism of progression to inflammation and
 *                   fibrosis"
 *                   Applies: ethanol_metabolism
 *
 *   PMID:10762063 — Finkelstein JD 2000 Int J Biochem Cell Biol.
 *                   "Homocysteine"
 *                   Applies: methionine_sam_cycle
 *   PMID:16958675 — Lu SC, Mato JM 2006 J Gastroenterol Hepatol.
 *                   "Methionine adenosyltransferase and S-
 *                   adenosylmethionine in alcoholic liver disease"
 *                   Applies: methionine_sam_cycle
 *
 *   PMID:16552415 — Youdim MB, Edmondson D, Tipton KF 2006
 *                   Nat Rev Neurosci.
 *                   "The therapeutic potential of monoamine oxidase
 *                   inhibitors"
 *                   Applies: monoamine_oxidase_metabolism
 *   PMID:29748850 — Bortolato M, Shih JC 2018
 *                   J Neural Transm (Vienna).
 *                   "From aggression to autism: new perspectives on
 *                   behavioral sequelae of monoamine oxidase
 *                   deficiency"
 *                   Applies: monoamine_oxidase_metabolism
 *
 *   PMID:15734728 — Hukkanen J, Jacob P, Benowitz NL 2005
 *                   Pharmacol Rev.
 *                   "Metabolism and disposition kinetics of nicotine"
 *                   Applies: nicotine_metabolism
 *   PMID:20554984 — Benowitz NL 2010 N Engl J Med.
 *                   "Nicotine addiction"
 *                   Applies: nicotine_metabolism
 *
 *   PMID:19228618 — Klein TE et al. / Intl Warfarin Pharmacogenetics
 *                   Consortium 2009 N Engl J Med.
 *                   "Estimation of the warfarin dose with clinical
 *                   and pharmacogenetic data" (IWPC)
 *                   Applies: warfarin_metabolism
 *   PMID:1581537  — Rettie AE et al. 1992 Chem Res Toxicol.
 *                   "Hydroxylation of warfarin by human cDNA-
 *                   expressed cytochrome P-450: a role for P-4502C9"
 *                   (canonical paper establishing CYP2C9 as the
 *                   S-warfarin metaboliser — anchors the entire
 *                   warfarin DDI literature)
 *                   Applies: warfarin_metabolism
 *
 * Coverage delta: 7 drug-metabolism pathways at 0 refs → 2-3 refs each.
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
  conjugation_phase2_overview: [
    'PMID:11179432',
    'PMID:15822171',
    'PMID:18852012',
  ],
  cyp_phase1_overview: [
    'PMID:23333322',
    'PMID:18052394',
    'PMID:16224454',
  ],
  ethanol_metabolism: [
    'PMID:17718394',
    'PMID:15670660',
  ],
  methionine_sam_cycle: [
    'PMID:10762063',
    'PMID:16958675',
  ],
  monoamine_oxidase_metabolism: [
    'PMID:16552415',
    'PMID:29748850',
  ],
  nicotine_metabolism: [
    'PMID:15734728',
    'PMID:20554984',
  ],
  warfarin_metabolism: [
    'PMID:19228618',
    'PMID:1581537',
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
