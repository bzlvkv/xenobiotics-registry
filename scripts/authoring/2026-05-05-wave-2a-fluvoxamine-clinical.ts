/**
 * 2026-05-05-wave-2a-fluvoxamine-clinical.ts — Wave 2a session 9.
 *
 * 5 verified fluvoxamine→victim CYP1A2 inhibition edges, each anchored
 * to a primary-source clinical PMID with verbatim AUC fold-change.
 * ki_uM back-calculated from observed AUC ratio assuming therapeutic
 * fluvoxamine Cp ≈ 0.16 µM (100 mg/d steady state):
 *
 *   Ki = Cp_perp / (AUC_ratio − 1)
 *
 * This convention matches the existing fluvoxamine→caffeine /
 * fluvoxamine→theophylline edges (Round v0.6 baseline) — Ki is fit
 * to in-vivo magnitude, not in-vitro HLM (which under-predicts due
 * to presystemic CYP1A2 inhibition + first-pass amplification).
 *
 *   - melatonin    AUC 17×  → ki 0.010 µM   PMID:10668847 (Härtter 2000)
 *   - olanzapine   AUC 1.55×→ ki 0.29  µM   PMID:15545309 (Chiu 2004)
 *   - duloxetine   AUC 5.6× → ki 0.035 µM   PMID:18307373 (Lobo 2008)
 *   - ramelteon    AUC 128× → ki 0.0013µM   PMID:20478852 (Obach 2010,
 *                                            Rozerem-label contraindicated)
 *   - tizanidine   AUC 33×  → ki 0.005 µM   PMID:15060511 (Granfors 2004,
 *                                            Zanaflex-label contraindicated)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type Edge = {
  perpetrator: string;
  victim: string;
  victim_name: string;
  level: 'caution' | 'warn' | 'major' | 'contraindicated';
  ki_uM: number;
  source_pmid: string;
  note: string;
};

const EDGES: Edge[] = [
  {
    perpetrator: 'fluvoxamine',
    victim: 'melatonin',
    victim_name: 'Melatonin',
    level: 'major',
    ki_uM: 0.010,
    source_pmid: 'PMID:10668847',
    note: 'CYP1A2 inhibition. Härtter 2000 (PMID:10668847) n=5 healthy males, single 5 mg melatonin PO ± 50 mg fluvoxamine: melatonin AUC 17× higher (P<.05), Cmax 12× higher (P<.01). Ki ≈ 0.16/(17−1) = 0.010 µM (Cp_perp ~0.16 µM at 100 mg/d). Endogenous melatonin similarly elevated at night → daytime drowsiness; avoid co-administration.',
  },
  {
    perpetrator: 'fluvoxamine',
    victim: 'olanzapine',
    victim_name: 'Olanzapine',
    level: 'warn',
    ki_uM: 0.29,
    source_pmid: 'PMID:15545309',
    note: 'CYP1A2 inhibition. Chiu 2004 (PMID:15545309) n=10 male schizophrenia smokers, fluvoxamine 50→100 mg/d × 4 wk: olanzapine AUC up 30–55%, Cmax 12–64%, t½ 25–32%; Vd −4 to −26%, CL −26 to −38%. Smoker cohort = induced CYP1A2 baseline mutes magnitude vs nonsmokers. Ki ≈ 0.16/(1.55−1) = 0.29 µM. TDM-driven dose adjustment.',
  },
  {
    perpetrator: 'fluvoxamine',
    victim: 'duloxetine',
    victim_name: 'Duloxetine',
    level: 'major',
    ki_uM: 0.035,
    source_pmid: 'PMID:18307373',
    note: 'CYP1A2 inhibition. Lobo 2008 (PMID:18307373) clinical PK study: oral duloxetine 60 mg ± steady-state fluvoxamine 100 mg/d → duloxetine AUC ↑460% (90% CI 359, 584), Cmax ↑141%; oral F rose 42.8% → 81.9%. Ki ≈ 0.16/(5.6−1) = 0.035 µM. FDA label warns against the combination.',
  },
  {
    perpetrator: 'fluvoxamine',
    victim: 'ramelteon',
    victim_name: 'Ramelteon',
    level: 'contraindicated',
    ki_uM: 0.0013,
    source_pmid: 'PMID:20478852',
    note: 'CYP1A2 inhibition (extreme). Obach 2010 (PMID:20478852) reports the in vivo ramelteon-fluvoxamine DDI verbatim as "128-fold actual" exposure increase (Rozerem-label data). Iga 2015 (PMID:26099559) corroborates "130-fold". Ki ≈ 0.16/(128−1) = 0.0013 µM. Rozerem prescribing information explicitly contraindicates concomitant use; first-pass CYP1A2 inhibition essentially abolishes ramelteon clearance.',
  },
  {
    perpetrator: 'fluvoxamine',
    victim: 'tizanidine',
    victim_name: 'Tizanidine',
    level: 'contraindicated',
    ki_uM: 0.005,
    source_pmid: 'PMID:15060511',
    note: 'CYP1A2 inhibition. Granfors 2004 (PMID:15060511) n=10 healthy, fluvoxamine 100 mg/d × 4 d then 4 mg tizanidine: AUC 33× (range 14–103×, P=2e-6), Cmax 12× (range 5–32×), t½ 1.5→4.3 h. Severe hypotension to 80 mmHg systolic. Ki ≈ 0.16/(33−1) = 0.005 µM. Authors: "concomitant use of tizanidine with fluvoxamine, or other potent inhibitors of CYP1A2, should be avoided."',
  },
];

interface Kinetics {
  ki_uM?: number;
  induction_factor?: number;
  plasma_binding_displacement?: number;
}

interface InteractionRef {
  slug: string;
  name: string;
  level: string;
  note: string;
  timing?: string;
  kinetics?: Kinetics;
  source_pmid?: string;
}

interface Compound {
  slug: string;
  interactions?: InteractionRef[];
  refs?: string[];
  [k: string]: unknown;
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  let added = 0, updated = 0, alreadyHas = 0, missing = 0;

  for (const e of EDGES) {
    const perp = bySlug.get(e.perpetrator);
    if (!perp) { console.warn(`  [warn] perpetrator missing: ${e.perpetrator}`); missing++; continue; }
    if (!bySlug.has(e.victim)) { console.warn(`  [warn] victim missing: ${e.victim}`); missing++; continue; }

    const ints = (perp.interactions ?? []) as InteractionRef[];
    const existing = ints.find(i => i.slug === e.victim);

    const newEdge: InteractionRef = {
      slug: e.victim,
      name: e.victim_name,
      level: e.level,
      note: e.note,
      kinetics: { ki_uM: e.ki_uM },
      source_pmid: e.source_pmid,
    };

    if (existing) {
      if (existing.kinetics?.ki_uM === e.ki_uM && existing.source_pmid === e.source_pmid) {
        alreadyHas++; continue;
      }
      Object.assign(existing, newEdge);
      updated++;
    } else {
      ints.push(newEdge);
      perp.interactions = ints;
      added++;
    }

    const refs = (perp.refs ?? []) as string[];
    if (!refs.includes(e.source_pmid)) refs.push(e.source_pmid);
    perp.refs = refs;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a session 9 (fluvoxamine clinical): added ${added}, updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
