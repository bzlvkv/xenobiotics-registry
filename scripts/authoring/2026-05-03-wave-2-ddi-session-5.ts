/**
 * 2026-05-03-wave-2-ddi-session-5.ts — Wave 2 fifth DDI session.
 *
 * 3 quantitative + 5 qualitative-only edges. Skipped phenytoin→warfarin
 * (no abstract AUC fold) + ibuprofen×warfarin (well-known clinically
 * but no verbatim PK numbers in any retrieved abstract).
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
  // Quantitative
  {
    perpetrator: 'cyclosporine',
    victim_slug: 'rosuvastatin',
    victim_name: 'Rosuvastatin',
    level: 'major',
    note: 'OATP1B1 + BCRP transporter inhibition. Simonson 2004 (PMID:15289793): cyclosporine raised rosuvastatin AUC₀₋₂₄ 7.1× and Cmax 10.6× in transplant recipients vs control. Avoid combination — limit alternative statin (or pravastatin/fluvastatin only at low dose).',
    kinetics: { ki_uM: 0.082 },
    source_pmid: 'PMID:15289793',
  },
  {
    perpetrator: 'gemfibrozil',
    victim_slug: 'repaglinide',
    victim_name: 'Repaglinide',
    level: 'contraindicated',
    note: 'CYP2C8 mechanism-based inhibition. Niemi 2003 (PMID:12687332): gemfibrozil raised repaglinide AUC 8.1× (range 5.5-15×) and prolonged t½ 1.3→3.7 h. Dose-response confirmed at 30-900 mg gemfibrozil (Honkalammi 2011). Combination contraindicated due to severe hypoglycemia risk.',
    kinetics: { ki_uM: 7 },
    source_pmid: 'PMID:12687332',
  },
  {
    perpetrator: 'fluconazole',
    victim_slug: 'tacrolimus',
    victim_name: 'Tacrolimus',
    level: 'major',
    note: 'CYP3A4 inhibition. Lumlertgul 2006 (PMID:17044457): fluconazole reduced tacrolimus CL 38.8→14.7 L/h (62% reduction), allowing dose reduction from 10.7→5.7 mg/d. Kuypers 2008 (PMID:18704002) confirms ~3.3× trough rise in CYP3A5*3/*3 carriers. Empirically halve tacrolimus dose on fluconazole initiation.',
    kinetics: { ki_uM: 13 },
    source_pmid: 'PMID:17044457',
  },

  // Qualitative-only (mechanism + level + PMID, no kinetics block)
  {
    perpetrator: 'cyclosporine',
    victim_slug: 'atorvastatin',
    victim_name: 'Atorvastatin',
    level: 'major',
    note: 'CYP3A4 + OATP1B1 + P-gp inhibition. Lemahieu 2005 (PMID:16095503): cyclosporine significantly raised atorvastatin acid + metabolite exposure in transplant recipients (no fold-change quoted in abstract). Tacrolimus had no effect — distinguishing the OATP1B1 vs CYP3A4 contributions.',
    source_pmid: 'PMID:16095503',
  },
  {
    perpetrator: 'metronidazole',
    victim_slug: 'warfarin',
    victim_name: 'Warfarin',
    level: 'major',
    note: 'CYP2C9 inhibition (S-warfarin selective). O\'Reilly 1976 (PMID:934223): metronidazole significantly augmented S-warfarin levels and hypoprothrombinemia; no R-warfarin effect. Reduce warfarin dose or monitor INR closely during metronidazole courses.',
    source_pmid: 'PMID:934223',
  },
  {
    perpetrator: 'fluconazole',
    victim_slug: 'cyclosporine',
    victim_name: 'Cyclosporine',
    level: 'major',
    note: 'CYP3A4 inhibition. Lopez-Gil 1993 (PMID:8477116): fluconazole 300 mg/d sharply raised cyclosporine trough + serum creatinine in transplant patient; 100 mg/d dose did not. Effect dose-dependent — monitor at fluconazole ≥200 mg/d.',
    source_pmid: 'PMID:8477116',
  },
  {
    perpetrator: 'clarithromycin',
    victim_slug: 'tacrolimus',
    victim_name: 'Tacrolimus',
    level: 'major',
    note: 'CYP3A4 inhibition. Kunicki 2005 (PMID:15665756) case report demonstrates tacrolimus rise on clarithromycin co-administration. Mechanism confirmed in vitro (Wen 2024). Avoid; substitute azithromycin if a macrolide is needed.',
    source_pmid: 'PMID:15665756',
  },
  {
    perpetrator: 'amiodarone',
    victim_slug: 'simvastatin',
    victim_name: 'Simvastatin',
    level: 'major',
    note: 'CYP3A4 inhibition. Marot 2011 (PMID:21630612): severe simvastatin-induced rhabdomyolysis triggered by amiodarone addition. FDA dose limit: simvastatin ≤20 mg/d when on amiodarone.',
    source_pmid: 'PMID:21630612',
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
  console.log(`\nWave 2 session 5: added ${added}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
