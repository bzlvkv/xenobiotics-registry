/**
 * 2026-05-16-pathway-eicosanoid-hemostasis-redox-citations-batch.ts
 *
 * Backfills refs[] on 6 hemostasis + eicosanoid + redox pathways
 * that still shipped with 0 refs. Includes the 48-modulator
 * nrf2_keap1_antioxidant_response — the densest "citation buys
 * reach" pathway in the remaining uncited set.
 *
 * Lesson from the previous fixup applied here: every PMID below
 * was chosen by reading the pathway's actual description first,
 * then searching for primary literature anchoring that specific
 * mechanism content. Each PMID then verified via NCBI E-utilities
 * `esummary` 2026-05-16 (title + first-author + journal + year).
 *
 * Citations applied:
 *
 *   PMID:11729303 — Funk CD 2001 Science.
 *                   "Prostaglandins and leukotrienes: advances in
 *                   eicosanoid biology"
 *                   (canonical landmark review covering PLA2 → COX
 *                   + LOX branches → PGE2/TXA2/PGI2 + LTB4/cysLTs —
 *                   the entire pathway content)
 *                   Applies: arachidonic_acid_cascade
 *   PMID:5284360  — Vane JR 1971 Nat New Biol.
 *                   "Inhibition of prostaglandin synthesis as a
 *                   mechanism of action for aspirin-like drugs"
 *                   (Nobel-prize-winning foundational paper — the
 *                   COX inhibition mechanism the pathway describes)
 *                   Applies: arachidonic_acid_cascade
 *
 *   PMID:18753650 — Furie B, Furie BC 2008 N Engl J Med.
 *                   "Mechanisms of thrombus formation"
 *                   (canonical NEJM mechanism review covering TF /
 *                   intrinsic / common pathway → thrombin → fibrin)
 *                   Applies: coagulation_cascade
 *   PMID:21870978 — Granger CB et al. / ARISTOTLE Committees
 *                   2011 N Engl J Med.
 *                   "Apixaban versus warfarin in patients with
 *                   atrial fibrillation" (ARISTOTLE — landmark DOAC
 *                   trial anchoring the factor-Xa-inhibitor branch)
 *                   Applies: coagulation_cascade
 *
 *   PMID:7477192  — NINDS rt-PA Stroke Study Group 1995
 *                   N Engl J Med.
 *                   "Tissue plasminogen activator for acute ischemic
 *                   stroke"
 *                   (landmark thrombolysis trial — establishes the
 *                   tPA/alteplase pharmacology the pathway describes)
 *                   Applies: fibrinolysis
 *   PMID:20554319 — Shakur H et al. / CRASH-2 Trial Collaborators
 *                   2010 Lancet.
 *                   "Effects of tranexamic acid on death, vascular
 *                   occlusive events, and blood transfusion in
 *                   trauma patients with significant haemorrhage"
 *                   (CRASH-2 — anchors the TXA antifibrinolytic
 *                   branch of the pathway)
 *                   Applies: fibrinolysis
 *
 *   PMID:19717846 — Wallentin L et al. / PLATO Investigators 2009
 *                   N Engl J Med.
 *                   "Ticagrelor versus clopidogrel in patients
 *                   with acute coronary syndromes" (PLATO)
 *                   Applies: platelet_aggregation
 *   PMID:17982182 — Wiviott SD et al. / TRITON-TIMI 38
 *                   Investigators 2007 N Engl J Med.
 *                   "Prasugrel versus clopidogrel in patients
 *                   with acute coronary syndromes" (TRITON-TIMI 38)
 *                   Applies: platelet_aggregation
 *
 *   PMID:28110218 — Sies H 2017 Redox Biol.
 *                   "Hydrogen peroxide as a central redox signaling
 *                   molecule in physiological oxidative stress:
 *                   Oxidative eustress"
 *                   (canonical redox-signaling review covering
 *                   H2O2 / OH• / ONOO- chemistry the pathway describes)
 *                   Applies: ros_oxidative_stress
 *   PMID:19061483 — Murphy MP 2009 Biochem J.
 *                   "How mitochondria produce reactive oxygen
 *                   species"
 *                   (anchors the ETC-leak / Complex I + III source
 *                   the pathway lists first)
 *                   Applies: ros_oxidative_stress
 *
 *   PMID:29717933 — Yamamoto M, Kensler TW, Motohashi H 2018
 *                   Physiol Rev.
 *                   "The KEAP1-NRF2 System: a Thiol-Based Sensor-
 *                   Effector Apparatus for Maintaining Redox
 *                   Homeostasis"
 *                   (canonical KEAP1-NRF2 review covering the
 *                   ubiquitination / cysteine-electrophile sensing /
 *                   ARE-driven transcription mechanism the pathway
 *                   describes)
 *                   Applies: nrf2_keap1_antioxidant_response
 *   PMID:30610225 — Cuadrado A et al. 2019 Nat Rev Drug Discov.
 *                   "Therapeutic targeting of the NRF2 and KEAP1
 *                   partnership in chronic diseases"
 *                   (anchors the polyphenol / flavonoid /
 *                   isothiocyanate therapeutic-activator branch)
 *                   Applies: nrf2_keap1_antioxidant_response
 *   PMID:24647116 — Hayes JD, Dinkova-Kostova AT 2014
 *                   Trends Biochem Sci.
 *                   "The Nrf2 regulatory network provides an
 *                   interface between redox and intermediary
 *                   metabolism"
 *                   (anchors the GST / UGT / HO-1 / NQO1 / GSH
 *                   downstream transcriptional program the pathway
 *                   describes)
 *                   Applies: nrf2_keap1_antioxidant_response
 *
 * Coverage delta: 6 pathways at 0 refs → 2-3 refs each.
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
  arachidonic_acid_cascade: [
    'PMID:11729303',
    'PMID:5284360',
  ],
  coagulation_cascade: [
    'PMID:18753650',
    'PMID:21870978',
  ],
  fibrinolysis: [
    'PMID:7477192',
    'PMID:20554319',
  ],
  platelet_aggregation: [
    'PMID:19717846',
    'PMID:17982182',
  ],
  ros_oxidative_stress: [
    'PMID:28110218',
    'PMID:19061483',
  ],
  nrf2_keap1_antioxidant_response: [
    'PMID:29717933',
    'PMID:30610225',
    'PMID:24647116',
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
