/**
 * 2026-05-06-wave-2-rifampin-induction.ts — Wave 2 session 13.
 *
 * 7 verified rifampin → CYP3A4 (and CYP2C9 + P-gp) induction edges.
 * Every PMID verified verbatim. induction_factor is the observed
 * clinical AUC ratio (AUC_baseline / AUC_with_rifampin) — for high-
 * first-pass oral substrates this lumps gut + hepatic induction
 * together, matching the clinical AUC the user actually observes.
 * Route-dependence (IV-only effect smaller) flagged in notes.
 *
 *   - midazolam     AUC −96%  factor 24.3  contraindicated  PMID:8549036    (Backman 1996)
 *   - atorvastatin  AUC −80%  factor 5.0   major            PMID:16084850   (Backman 2005)
 *   - simvastatin   AUC −87%  factor 7.7   major            PMID:11180018   (Kyrklund 2000; acid form 14×)
 *   - cyclosporine  oral 3.8× factor 3.8   major            PMID:1424418    (Hebert 1992; CL 1.4×, F 27%→10%)
 *   - tacrolimus    oral 3.0× factor 3.0   major            PMID:9987705    (Hebert 1999; CL 1.47×, F 14.4%→7%)
 *   - losartan      AUC −35%  factor 1.55  warn             PMID:9542475    (Williamson 1998; E-3174 also −40%)
 *   - verapamil     oral CL 32× factor 32  contraindicated  PMID:8855178    (Fromm 1996; IV CL only 1.3×)
 *
 * The verapamil 32× factor is route-driven — IV verapamil sees only
 * 1.3× hepatic CL induction; the 32× reflects gut CYP3A4 induction
 * abolishing first-pass survival. Oral is the typical route, so the
 * observed AUC ratio is the right pragmatic value; solver will
 * over-correct for IV but IV verapamil is not a typical user scenario.
 *
 * Skipped (no abstract-verbatim AUC fold-decrease):
 *   rifampin → digoxin — PMID:10411543 (Greiner 1999) abstract reports
 *   intestinal P-gp +3.5× but no verbatim digoxin AUC fold-change.
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
  induction_factor: number;
  source_pmid: string;
  note: string;
};

const EDGES: Edge[] = [
  {
    perpetrator: 'rifampin', victim: 'midazolam', victim_name: 'Midazolam',
    level: 'contraindicated', induction_factor: 24.3, source_pmid: 'PMID:8549036',
    note: 'CYP3A4 induction (gut + liver). Backman 1996 (PMID:8549036) n=10 healthy crossover, rifampin 600 mg/d × 5d then 15 mg PO midazolam d6: oral midazolam AUC dropped 96% (10.2→0.42 µg·min/mL). Factor 10.2/0.42 = 24.3. Renders oral midazolam ineffective; combination is label-contraindicated.',
  },
  {
    perpetrator: 'rifampin', victim: 'atorvastatin', victim_name: 'Atorvastatin',
    level: 'major', induction_factor: 5.0, source_pmid: 'PMID:16084850',
    note: 'CYP3A4 induction. Backman 2005 (PMID:16084850) n=10 randomized crossover, rifampin 600 mg/d × 5d + atorvastatin 40 mg single d6: AUC of unchanged atorvastatin acid −80% (95% CI 73-84%, P<.001). Factor 1/0.20 = 5.0. Undermines LDL lowering.',
  },
  {
    perpetrator: 'rifampin', victim: 'simvastatin', victim_name: 'Simvastatin',
    level: 'major', induction_factor: 7.7, source_pmid: 'PMID:11180018',
    note: 'CYP3A4 first-pass induction. Kyrklund 2000 (PMID:11180018) n=10 crossover, rifampin 600 mg × 5d + simvastatin 40 mg d6: parent AUC −87%, simva acid −93% (P<.001). Factor 1/0.13 = 7.7 (parent; conservative — acid form 14×). Cholesterol-lowering effectively abolished.',
  },
  {
    perpetrator: 'rifampin', victim: 'cyclosporine', victim_name: 'Cyclosporine',
    level: 'major', induction_factor: 3.8, source_pmid: 'PMID:1424418',
    note: 'CYP3A4 induction (gut + liver). Hebert 1992 (PMID:1424418) n=6, oral 10 mg/kg + IV 3 mg/kg ± rifampin: blood CL 0.30→0.42 L/h/kg (1.4×), F 27%→10% (oral combined drop 3.8×). IV-pure factor 1.4. Author at oral 3.8 — most CsA dosing is PO, transplant rejection risk.',
  },
  {
    perpetrator: 'rifampin', victim: 'tacrolimus', victim_name: 'Tacrolimus',
    level: 'major', induction_factor: 3.0, source_pmid: 'PMID:9987705',
    note: 'CYP3A4 + P-gp induction (gut + liver). Hebert 1999 (PMID:9987705) n=6, oral 0.1 mg/kg + IV 0.025 mg/kg/4h ± rifampin × 18d: CL 36→52.8 mL/h/kg (1.47×), F 14.4%→7% — oral combined 3.0×. Threatens graft rejection; close TDM mandatory.',
  },
  {
    perpetrator: 'rifampin', victim: 'losartan', victim_name: 'Losartan',
    level: 'warn', induction_factor: 1.55, source_pmid: 'PMID:9542475',
    note: 'CYP2C9 + CYP3A4 induction. Williamson 1998 (PMID:9542475) n=10, losartan 50 mg/d + rifampin 300 mg BID × 1 wk: AUC0-24 −35% (349→225 ng·h/mL, P=0.0001). Factor 1/0.65 = 1.55. Active E-3174 also −40% — moderate efficacy reduction.',
  },
  {
    perpetrator: 'rifampin', victim: 'verapamil', victim_name: 'Verapamil',
    level: 'contraindicated', induction_factor: 32.0, source_pmid: 'PMID:8855178',
    note: 'CYP3A4 gut-wall induction (extreme). Fromm 1996 (PMID:8855178) n=8, verapamil 120 mg BID × 24d + rifampin 600 mg/d d5-16: oral S-verapamil CL 32× higher (P<.001), F 25× lower. IV CL only 1.3× higher — effect is overwhelmingly first-pass. Author at oral 32; AV-conduction effect abolished.',
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
      kinetics: { induction_factor: e.induction_factor }, source_pmid: e.source_pmid,
    };

    if (existing) {
      if (existing.kinetics?.induction_factor === e.induction_factor && existing.source_pmid === e.source_pmid) {
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
  console.log(`\nWave 2 session 13 (rifampin induction): added ${added}, updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
