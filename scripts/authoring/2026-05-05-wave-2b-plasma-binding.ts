/**
 * 2026-05-05-wave-2b-plasma-binding.ts — Wave 2b session 1.
 *
 * 4 verified plasma-binding-displacement interaction edges. Each edge's
 * source_pmid carries the verbatim Δfree-fraction value the schema's
 * `plasma_binding_displacement` field encodes; math is documented in the
 * note alongside the verbatim quote span the agent verified.
 *
 *   - ibuprofen → warfarin    Δfu 0.18 (low-end, in-vitro Chan 1989)
 *   - naproxen  → warfarin    Δfu 1.12 (low-end of in-vitro range, in-vivo
 *                              attenuation per PMID:758244 documented)
 *   - aspirin   → valproate   Δfu 2.58 (clinical n=6, fu 12% → 43%)
 *   - valproate → phenytoin   Δfu 0.35 (clinical n=9, fu 0.135 → 0.182)
 *
 * Skipped (no abstract-verbatim Δfu in any verified PMID — see
 * AUTHORING_GAPS.md):
 *   - celecoxib  → warfarin
 *   - aspirin    → warfarin
 *   - phenytoin  → valproate (negative result PMID:8009559)
 *   - sulfamethoxazole → warfarin
 *   - trimethoprim → warfarin
 *   - ibuprofen  → phenytoin
 *
 * Schema semantics: plasma_binding_displacement scales the victim's
 * effective free fraction at therapeutic perpetrator levels. Solver
 * applies F_factor = 1 + plasma_binding_displacement during the window
 * both compounds are on board.
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
  displacement: number;
  source_pmid: string;
  note: string;
};

const EDGES: Edge[] = [
  {
    perpetrator: 'ibuprofen',
    victim: 'warfarin',
    victim_name: 'Warfarin',
    level: 'caution',
    displacement: 0.18,
    source_pmid: 'PMID:2724076',
    note: 'Plasma protein-binding displacement at HSA. Chan 1989 (PMID:2724076) equilibrium dialysis: free warfarin 5–9% with ibuprofen vs 2.5–6% baseline. Low-end Δfu = (5 − 4.25)/4.25 ≈ 0.18. In-vitro magnitude; clinical effect smaller. Dominant clinical concern is COX-1/platelet additive bleed risk + GI mucosal injury, not displacement.',
  },
  {
    perpetrator: 'naproxen',
    victim: 'warfarin',
    victim_name: 'Warfarin',
    level: 'warn',
    displacement: 1.12,
    source_pmid: 'PMID:2724076',
    note: 'Plasma protein-binding displacement at HSA. Chan 1989 (PMID:2724076) equilibrium dialysis: free warfarin 9–24% with naproxen vs 2.5–6% baseline. Low-end Δfu = (9 − 4.25)/4.25 ≈ 1.12. In-vitro magnitude; clinical attenuation per Schentag/PMID:758244 ("small but statistically significant increase of warfarin-free fraction"). Encoded at low-end; expect smaller in vivo.',
  },
  {
    perpetrator: 'aspirin',
    victim: 'valproate',
    victim_name: 'Valproate',
    level: 'major',
    displacement: 2.58,
    source_pmid: 'PMID:6804150',
    note: 'Canonical clinical displacement. Goulden 1987 (PMID:6804150) n=6 epileptic children on VPA + aspirin: "the steady-state serum free fractions of VPA rose from 12% to 43%" — Δfu = (0.43 − 0.12)/0.12 ≈ 2.58. Free-VPA spike >3× drives toxicity; high-dose aspirin combination should be avoided in epilepsy patients on chronic VPA.',
  },
  {
    perpetrator: 'valproate',
    victim: 'phenytoin',
    victim_name: 'Phenytoin',
    level: 'warn',
    displacement: 0.35,
    source_pmid: 'PMID:6430316',
    note: 'Clinical plasma-binding displacement. Riva 1984 (PMID:6430316) n=9 epileptic patients, before/after VPA add-on: "The mean free fraction rose from 0.135 +/- 0.019 (s.d.) to 0.182 +/- 0.030" — Δfu = 0.047/0.135 ≈ 0.35. Total PHT may look unchanged while free PHT (active drug) rises ~35% — TDM by free-PHT or symptoms, not total level.',
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
      kinetics: { plasma_binding_displacement: e.displacement },
      source_pmid: e.source_pmid,
    };

    if (existing) {
      if (existing.kinetics?.plasma_binding_displacement === e.displacement && existing.source_pmid === e.source_pmid) {
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
  console.log(`\nWave 2b session 1: added ${added}, updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
