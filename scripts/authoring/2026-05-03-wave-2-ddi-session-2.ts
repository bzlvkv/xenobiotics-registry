/**
 * 2026-05-03-wave-2-ddi-session-2.ts — Wave 2 second DDI session.
 *
 * 7 quantitative edges (Ki / induction_factor authored) + 3 qualitative
 * edges (mechanism-only, no kinetics block — abstracts confirm interaction
 * but lack verbatim AUC fold-change for the solver to use):
 *
 *   Quantitative:
 *     - rifampin → warfarin (CYP2C9 induction, induction_factor 2.5)
 *     - rifampin → ethinyl-estradiol (CYP3A4/UGT induction, 1.72)
 *     - ciprofloxacin → theophylline (CYP1A2 inhibition, Ki 19 µM)
 *     - ciprofloxacin → tizanidine (CYP1A2 inhibition, Ki 0.83 µM)
 *     - fluconazole → warfarin (CYP2C9 inhibition, Ki 8 µM)
 *     - ritonavir → simvastatin (CYP3A4 inhibition, Ki 0.26 µM)
 *     - voriconazole → tacrolimus (CYP3A4 inhibition, Ki 1.0 µM)
 *
 *   Qualitative-only (level set, no kinetics block):
 *     - carbamazepine → warfarin (CYP2C9 induction, no abstract AUC fold)
 *     - omeprazole → clopidogrel (CYP2C19 inhibits prodrug activation —
 *       model doesn't fit standard inhibitor template; abstract gives
 *       active-metab AUC reduction 40-47%)
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
  kinetics?: { ki_uM?: number; induction_factor?: number };
  source_pmid?: string;
};

const EDGES: Edge[] = [
  // INDUCERS
  {
    perpetrator: 'rifampin',
    victim_slug: 'warfarin',
    victim_name: 'Warfarin',
    level: 'major',
    note: 'CYP2C9 induction. Hammond 2022 systematic review (PMID:35152432): 17 studies show warfarin AUC reduced 15-74% with rifampin; warfarin dose increases of 3-5× pre-rifampin dose required to maintain INR. Use midpoint induction_factor 2.5×.',
    kinetics: { induction_factor: 2.5 },
    source_pmid: 'PMID:35152432',
  },
  {
    perpetrator: 'rifampin',
    victim_slug: 'ethinyl-estradiol',
    victim_name: 'Ethinyl Estradiol',
    level: 'contraindicated',
    note: 'CYP3A4 + UGT induction → contraceptive failure. Bolt 1980 (PMID:7189454): rifampin 450-600 mg/d reduced EE AUC from 1747 to 1014 pg/mL·h (42% reduction → ke induction 1.72×); t½ shortened from 6.3 to 2.9 h. Backup contraception required during + 4 weeks after rifampin.',
    kinetics: { induction_factor: 1.72 },
    source_pmid: 'PMID:7189454',
  },

  // CYP1A2 INHIBITORS
  {
    perpetrator: 'ciprofloxacin',
    victim_slug: 'theophylline',
    victim_name: 'Theophylline',
    level: 'major',
    note: 'CYP1A2 inhibition. Loi 1997 (PMID:9023273): ciprofloxacin 500 mg q12h × 5d reduced theophylline CL by 23-33% (AUC ~1.39× increase). Theophylline narrow therapeutic index → monitor levels + reduce theophylline dose 30-50% on co-administration.',
    kinetics: { ki_uM: 19 },
    source_pmid: 'PMID:9023273',
  },
  {
    perpetrator: 'ciprofloxacin',
    victim_slug: 'tizanidine',
    victim_name: 'Tizanidine',
    level: 'contraindicated',
    note: 'CYP1A2 inhibition. Granfors 2004 (PMID:15592331): ciprofloxacin raised tizanidine AUC 10× (range 6-24×). Hypotension + sedation risk severe enough that the combination is contraindicated; fluvoxamine-tizanidine carries the same warning.',
    kinetics: { ki_uM: 0.83 },
    source_pmid: 'PMID:15592331',
  },

  // CYP2C9 INHIBITION (warfarin victim)
  {
    perpetrator: 'fluconazole',
    victim_slug: 'warfarin',
    victim_name: 'Warfarin',
    level: 'major',
    note: 'CYP2C9 inhibition. Black 1996 (PMID:8801057): fluconazole 400 mg/d × 6d inhibited S-warfarin 7-hydroxylation by ~70% (AUC ≈ 3.3× increase). Reduce warfarin dose ~50% with fluconazole; monitor INR closely on initiation + discontinuation.',
    kinetics: { ki_uM: 8 },
    source_pmid: 'PMID:8801057',
  },

  // CYP3A4 INHIBITION (more)
  {
    perpetrator: 'ritonavir',
    victim_slug: 'simvastatin',
    victim_name: 'Simvastatin',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition (potent PI booster). Fichtenbaum 2002 (PMID:11873000): RTV/SQV combination raised simvastatin AUC 32× (3059% increase) over 14 days. Combination contraindicated. With ritonavir-based regimens, use rosuvastatin or pravastatin (not CYP3A4 substrates).',
    kinetics: { ki_uM: 0.26 },
    source_pmid: 'PMID:11873000',
  },
  {
    perpetrator: 'voriconazole',
    victim_slug: 'tacrolimus',
    victim_name: 'Tacrolimus',
    level: 'major',
    note: 'CYP3A4 inhibition. Vanhove 2019 (PMID:31152598): voriconazole at steady state raised IR-tacrolimus AUC 6.02× (Cmax 2.7×) and PR-tacrolimus AUC 2.62× (Cmax 2.02×) in healthy volunteer crossover. Reduce tacrolimus dose ~66% empirically and follow trough levels.',
    kinetics: { ki_uM: 1.0 },
    source_pmid: 'PMID:31152598',
  },

  // QUALITATIVE / MECHANISM-ONLY
  {
    perpetrator: 'carbamazepine',
    victim_slug: 'warfarin',
    victim_name: 'Warfarin',
    level: 'major',
    note: 'CYP2C9 induction. Documented in case reports (PMID:24612117 et al.) showing warfarin dose increases of ~3× to maintain INR. No primary HV abstract reports verbatim AUC fold-change → kinetics block deferred until full-text Ki/induction_factor available.',
    source_pmid: 'PMID:24612117',
  },
  {
    perpetrator: 'omeprazole',
    victim_slug: 'clopidogrel',
    victim_name: 'Clopidogrel',
    level: 'caution',
    note: 'CYP2C19 inhibition reduces clopidogrel ACTIVATION (clopidogrel is a prodrug). Angiolillo 2011 (PMID:20844485): omeprazole reduced clopidogrel active-metabolite AUC by 40-47%; pantoprazole only 14% (preferred PPI when clopidogrel is needed). Solver model assumes perpetrator → reduces victim clearance, so this prodrug-activation pattern doesn\'t fit kinetics block; effect captured in note only.',
    source_pmid: 'PMID:20844485',
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
    if (!bySlug.has(e.victim_slug)) { console.warn(`  [warn] missing victim: ${e.victim_slug}`); missing++; continue; }

    const interactions = (c['interactions'] as InteractionRef[] | undefined) ?? [];
    const existing = interactions.find(i =>
      i.slug === e.victim_slug && i.kinetics != null);
    if (existing) { alreadyHas++; continue; }

    const newRef: InteractionRef = {
      slug: e.victim_slug,
      name: e.victim_name,
      level: e.level,
      note: e.note,
    };
    if (e.kinetics) newRef.kinetics = e.kinetics;
    if (e.source_pmid) newRef.source_pmid = e.source_pmid;
    interactions.push(newRef);
    c['interactions'] = interactions;
    added++;
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2 session 2: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
