/**
 * 2026-05-03-wave-2-ddi-session-3.ts — Wave 2 third session.
 *
 * 6 quantitative edges + 1 qualitative:
 *   - amiodarone → digoxin (P-gp inhibition, Ki 2 µM)
 *   - quinidine → digoxin (P-gp inhibition, Ki 1.1 µM)
 *   - ritonavir → tacrolimus (CYP3A4 inhibition, Ki 0.14 µM)
 *   - itraconazole → cyclosporine (CYP3A4, Ki 1.5 µM)
 *   - ketoconazole → cyclosporine (CYP3A4, Ki 1.4 µM)
 *   - valproate → lamotrigine (UGT inhibition, Ki 485 µM — high but
 *     fits 2× AUC at clinical valproate Cp ~485 µM)
 *   - paroxetine → tamoxifen (qualitative — CYP2D6 reduces endoxifen
 *     formation, doesn\'t fit the inhibitor-on-clearance kinetics shape)
 *
 * Skipped: grapefruit → simvastatin (no perpetrator slug in registry —
 * grapefruit is not catalogued as a single compound).
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
  {
    perpetrator: 'amiodarone',
    victim_slug: 'digoxin',
    victim_name: 'Digoxin',
    level: 'major',
    note: 'P-glycoprotein inhibition. Santostasi 1987 (PMID:2438499): amiodarone 200 mg/d × 2 weeks raised digoxin oral bioavailability by 33-43% (n=6 healthy volunteers). Halve digoxin dose on amiodarone initiation; monitor levels.',
    kinetics: { ki_uM: 2.0 },
    source_pmid: 'PMID:2438499',
  },
  {
    perpetrator: 'quinidine',
    victim_slug: 'digoxin',
    victim_name: 'Digoxin',
    level: 'major',
    note: 'Classic P-glycoprotein inhibition example. Rameis 1985 (PMID:3997300): quinidine prolonged digoxin t½ from 33 to 44 h, raised AUC ~2.65×, dropped renal CL from 150 to 79 mL/min (n=6 healthy crossover). Halve digoxin dose; modern alternatives preferred.',
    kinetics: { ki_uM: 1.1 },
    source_pmid: 'PMID:3997300',
  },
  {
    perpetrator: 'ritonavir',
    victim_slug: 'tacrolimus',
    victim_name: 'Tacrolimus',
    level: 'contraindicated',
    note: 'CYP3A4 inhibition. Badri 2015 (PMID:25708713): ritonavir-containing regimen raised tacrolimus AUC 57×, t½ from 32 to 232 h (n=12 healthy). Empirically reduce tacrolimus to 0.5-1 mg every 1-2 weeks with ritonavir; trough monitoring mandatory.',
    kinetics: { ki_uM: 0.14 },
    source_pmid: 'PMID:25708713',
  },
  {
    perpetrator: 'itraconazole',
    victim_slug: 'cyclosporine',
    victim_name: 'Cyclosporine',
    level: 'major',
    note: 'CYP3A4 inhibition. Florea 2003 (PMID:14697925): itraconazole 200 mg BID required ~48% cyclosporine dose reduction in renal transplant patients to maintain target trough (n=8). Implies ~2× AUC at fixed dose.',
    kinetics: { ki_uM: 1.5 },
    source_pmid: 'PMID:14697925',
  },
  {
    perpetrator: 'ketoconazole',
    victim_slug: 'cyclosporine',
    victim_name: 'Cyclosporine',
    level: 'major',
    note: 'CYP3A4 inhibition. Gomez 1995 (PMID:7628178): ketoconazole 200 mg/d raised cyclosporine oral F from 22% to 56% and reduced IV CL from 0.32 to 0.18 L/h/kg (n=5 healthy crossover). Combined effect ~4.5× cyclosporine AUC.',
    kinetics: { ki_uM: 1.4 },
    source_pmid: 'PMID:7628178',
  },
  {
    perpetrator: 'valproate',
    victim_slug: 'lamotrigine',
    victim_name: 'Lamotrigine',
    level: 'major',
    note: 'UGT1A4 inhibition. Anderson 1996 (PMID:8823232): valproate 500 mg BID approximately doubles lamotrigine half-life — start lamotrigine at 25 mg every other day, escalate slowly to mitigate SJS/TEN risk. Bidirectional: lamotrigine modestly raises valproate CL (small effect, opposite direction).',
    kinetics: { ki_uM: 485 },
    source_pmid: 'PMID:8823232',
  },
  {
    perpetrator: 'paroxetine',
    victim_slug: 'tamoxifen',
    victim_name: 'Tamoxifen',
    level: 'major',
    note: 'CYP2D6 inhibition reduces tamoxifen → endoxifen activation (the active anti-estrogen metabolite). Stearns 2003 (PMID:14652237): paroxetine 4 weeks dropped plasma endoxifen 12.4 → 5.5 ng/mL (~56% reduction). Avoid paroxetine + tamoxifen for breast cancer; use venlafaxine or escitalopram instead. Solver inhibitor model doesn\'t fit reduction-of-prodrug-activation; mechanism captured in note only.',
    source_pmid: 'PMID:14652237',
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
      i.slug === e.victim_slug && (i.kinetics != null || i.source_pmid === e.source_pmid));
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
  console.log(`\nWave 2 session 3: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
