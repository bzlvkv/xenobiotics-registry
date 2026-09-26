/**
 * 2026-05-03-wave-2-ddi-session-1.ts — Wave 2 first DDI session.
 *
 * 6 high-impact CYP3A4 inhibition edges to statins, all authored from
 * primary human DDI abstracts with verbatim AUC fold-change. Ki (µM)
 * derived from the relationship: AUC_fold = 1 + Cp_perp/Ki, using
 * each perpetrator's typical steady-state plasma Cp at the dose used
 * in the cited study.
 *
 * Skipped: ketoconazole → simvastatin / atorvastatin — agent could not
 * locate a single-compound human PK DDI abstract with verbatim numbers
 * (the interaction is recognized clinically but lacks an abstract-
 * verifiable primary study).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type InteractionRef = {
  slug: string;
  name: string;
  level: string;
  note: string;
  timing?: string;
  kinetics?: { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number };
  source_pmid?: string;
};

type Edge = {
  perpetrator: string;
  victim_slug: string;
  victim_name: string;
  level: string;
  note: string;
  ki_uM: number;
  source_pmid: string;
};

const EDGES: Edge[] = [
  {
    perpetrator: 'itraconazole',
    victim_slug: 'simvastatin',
    victim_name: 'Simvastatin',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition. Neuvonen 1998 (PMID:9542477): itraconazole 200 mg/d × 4 d raised simvastatin AUC ≥10× and simvastatin acid AUC 19× (n=10 crossover). Statin myopathy / rhabdomyolysis risk — combination contraindicated.',
    ki_uM: 0.17,
    source_pmid: 'PMID:9542477',
  },
  {
    perpetrator: 'clarithromycin',
    victim_slug: 'simvastatin',
    victim_name: 'Simvastatin',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition. Jacobson 2004 (PMID:15518608): clarithromycin raised simvastatin AUC ~10× and simvastatin acid 12×. Combination contraindicated; switch to azithromycin or hold the statin during the antibiotic course.',
    ki_uM: 0.33,
    source_pmid: 'PMID:15518608',
  },
  {
    perpetrator: 'erythromycin',
    victim_slug: 'simvastatin',
    victim_name: 'Simvastatin',
    level: 'major',
    note: 'CYP3A4 inhibition. Kantola 1998 (PMID:9728898): erythromycin 1.5 g/d × 2 d raised simvastatin AUC 6.2× + Cmax 3.4×, simvastatin acid AUC 3.9× + Cmax 5× (n=12 crossover). Avoid combination.',
    ki_uM: 1.06,
    source_pmid: 'PMID:9728898',
  },
  {
    perpetrator: 'diltiazem',
    victim_slug: 'simvastatin',
    victim_name: 'Simvastatin',
    level: 'major',
    note: 'CYP3A4 inhibition. Mousa 2000 (PMID:10741630): diltiazem 120 mg BID × 2 weeks raised simvastatin AUC 5×, Cmax 3.6×, t½ 2.3× (n=10). Limit simvastatin dose to 10 mg/d when co-administered with diltiazem.',
    ki_uM: 0.087,
    source_pmid: 'PMID:10741630',
  },
  {
    perpetrator: 'verapamil',
    victim_slug: 'simvastatin',
    victim_name: 'Simvastatin',
    level: 'major',
    note: 'CYP3A4 inhibition. Kantola 1998 (PMID:9728898): verapamil 240 mg/d × 2 d raised simvastatin AUC 4.6×, Cmax 2.6×, simvastatin acid AUC 2.8× (n=12 crossover). Limit simvastatin dose to 10 mg/d when co-administered with verapamil.',
    ki_uM: 0.09,
    source_pmid: 'PMID:9728898',
  },
  {
    perpetrator: 'ritonavir',
    victim_slug: 'atorvastatin',
    victim_name: 'Atorvastatin',
    level: 'major',
    note: 'CYP3A4 inhibition (potent PI booster). Pham 2009 (PMID:19667285): tipranavir/ritonavir at steady state raised atorvastatin AUC 9.36× and Cmax 8.61× vs atorvastatin alone. Use lowest atorvastatin dose; avoid simvastatin / lovastatin entirely with ritonavir-containing regimens.',
    ki_uM: 0.60,
    source_pmid: 'PMID:19667285',
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Array<Record<string, unknown>>;
  const bySlug = new Map(data.map(c => [c['slug'] as string, c]));

  let added = 0;
  let alreadyHas = 0;
  let missing = 0;

  for (const e of EDGES) {
    const c = bySlug.get(e.perpetrator);
    if (!c) { console.warn(`  [warn] missing perpetrator: ${e.perpetrator}`); missing++; continue; }

    const interactions = (c['interactions'] as InteractionRef[] | undefined) ?? [];
    // Skip if an edge to this victim with kinetics already exists
    const existing = interactions.find(i => i.slug === e.victim_slug && i.kinetics?.ki_uM != null);
    if (existing) { alreadyHas++; continue; }

    interactions.push({
      slug: e.victim_slug,
      name: e.victim_name,
      level: e.level,
      note: e.note,
      kinetics: { ki_uM: e.ki_uM },
      source_pmid: e.source_pmid,
    });
    c['interactions'] = interactions;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2 session 1: added ${added} kinetic edges, already-had ${alreadyHas}, missing ${missing}`);
}

main();
