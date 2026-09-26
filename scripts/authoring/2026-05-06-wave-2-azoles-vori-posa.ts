/**
 * 2026-05-06-wave-2-azoles-vori-posa.ts — Wave 2 session 14.
 *
 * 5 verified voriconazole + posaconazole → CYP3A4 victim edges from
 * single-stream re-run after the parallel-agent attempt stalled on
 * NCBI rate-limit. Every PMID verified verbatim.
 *
 * Voriconazole (Cp_perp ≈ 8 µM at 200 mg BID):
 *   cyclosporine  AUC 1.7×   ki 11.4 µM  major  PMID:11956505  (Romero 2002, n=7 transplant)
 *   midazolam     AUC 10.3×  ki 0.86 µM  major  PMID:16580904  (Saari 2006, oral; F 31%→84%)
 *
 * Posaconazole (Cp_perp ≈ 2 µM at 300 mg/d):
 *   midazolam     AUC 6.2×   ki 0.38 µM  major          PMID:19302901  (Krishna 2009, 400 mg BID arm)
 *   tacrolimus    AUC 4.58×  ki 0.56 µM  major          PMID:17542765  (Sansone-Parsons 2007)
 *   rapamycin     AUC 8.9×   ki 0.25 µM  contraindicated PMID:19196220  (Moton 2009; sirolimus = rapamycin)
 *
 * Cross-pair Ki sanity: voriconazole ~0.86–11.4 µM (range driven by
 * gut+liver vs hepatic-only victims); posaconazole 0.25–0.56 µM
 * (consistently sub-µM, confirms strong CYP3A4 inhibitor class).
 *
 * Skipped (agent corrected my wrong hint PMIDs en route):
 *   vori → sirolimus    — Marty 2006 PMID:16635790 abstract gives only
 *                          dose-reduction guidance, no verbatim AUC fold
 *   vori → omeprazole   — PMID:14616415 reports the OTHER direction
 *                          (omeprazole→vori, +41%)
 *   posa → cyclosporine — PMID:17542765 mentions only "dosage reductions
 *                          14-29%" for CsA arm, no AUC fold
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
    perpetrator: 'voriconazole', victim: 'cyclosporine', victim_name: 'Cyclosporine',
    level: 'major', ki_uM: 11.4, source_pmid: 'PMID:11956505',
    note: 'CYP3A4 inhibition. Romero 2002 (PMID:11956505) n=7 stable kidney transplant on CsA 150-375 mg/d, voriconazole 200 mg q12h × 7.5d randomized double-blind crossover: CsA AUCτ ratio 1.7× (90% CI 1.47-1.96). Ki ≈ 8/0.7 = 11.4 µM. Halve CsA dose on voriconazole initiation.',
  },
  {
    perpetrator: 'voriconazole', victim: 'midazolam', victim_name: 'Midazolam',
    level: 'major', ki_uM: 0.86, source_pmid: 'PMID:16580904',
    note: 'CYP3A4 inhibition (gut + liver). Saari 2006 (PMID:16580904) n=10 healthy crossover: voriconazole raises oral midazolam Cmax 3.8×, AUC 10.3×; IV CL −72%; oral F 31%→84%. Ki ≈ 8/9.3 = 0.86 µM. Avoid oral midazolam or use markedly reduced doses.',
  },
  {
    perpetrator: 'posaconazole', victim: 'midazolam', victim_name: 'Midazolam',
    level: 'major', ki_uM: 0.38, source_pmid: 'PMID:19302901',
    note: 'CYP3A4 inhibition. Krishna 2009 (PMID:19302901) healthy volunteers, posaconazole 200/400 mg BID + oral and IV midazolam: AUCtf increased up to 4.6× (200 mg BID) and 6.2× (400 mg BID); Cmax 1.3×/2.4×. Ki ≈ 2/5.2 = 0.38 µM at 400 mg BID Cp_perp 2 µM. Strong CYP3A4 inhibitor (slightly weaker than ketoconazole).',
  },
  {
    perpetrator: 'posaconazole', victim: 'tacrolimus', victim_name: 'Tacrolimus',
    level: 'major', ki_uM: 0.56, source_pmid: 'PMID:17542765',
    note: 'CYP3A4 inhibition. Sansone-Parsons 2007 (PMID:17542765) open-label PK in healthy volunteers, single tacrolimus + posaconazole: tacrolimus Cmax +121%, AUC +358% (ratio 4.58). Ki ≈ 2/3.58 = 0.56 µM. Reduce tacrolimus dose substantially with TDM.',
  },
  {
    perpetrator: 'posaconazole', victim: 'rapamycin', victim_name: 'Sirolimus',
    level: 'contraindicated', ki_uM: 0.25, source_pmid: 'PMID:19196220',
    note: 'CYP3A4 inhibition. Moton 2009 (PMID:19196220) n=12 healthy, single sirolimus ± posaconazole: sirolimus Cmax 6.7×, AUC 8.9×. Ki ≈ 2/7.9 = 0.25 µM. Coadministration generally not recommended per posaconazole label. Slug "rapamycin" in v8 catalog = sirolimus generic.',
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
      slug: e.victim, name: e.victim_name, level: e.level, note: e.note,
      kinetics: { ki_uM: e.ki_uM }, source_pmid: e.source_pmid,
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
  console.log(`\nWave 2 session 14 (voriconazole + posaconazole): added ${added}, updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
