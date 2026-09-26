/**
 * 2026-05-06-wave-2-fluoxetine.ts — Wave 2 session 15.
 *
 * 2 verified fluoxetine → CYP2D6 victim edges. Round 10 hit a rate-limit
 * guard before the full 8-target list could be verified — diazepam and
 * phenytoin remain unverified (queued for a future session); 4 pairs
 * confirmed-no-data (metoprolol, atomoxetine, tramadol, omeprazole).
 *
 * Cp_perp ≈ 1 µM (combined fluoxetine parent + norfluoxetine active
 * metabolite at 20 mg/d steady-state). Fluoxetine is a TDI/MBI of
 * CYP2D6; competitive Ki is a lower-bound. Long washout (~5 weeks)
 * because of norfluoxetine accumulation.
 *
 *   desipramine   AUC 4.8×    ki 0.263 µM  major  CYP2D6  PMID:8195463  (Preskorn 1994)
 *   risperidone   active-moiety 1.41×  ki 2.44 µM  warn   CYP2D6  PMID:11985287 (Bondolfi 2002)
 *
 * Risperidone parent AUC rose 4.15× in EMs, but the clinically-
 * relevant active moiety (risperidone + 9-OH-risperidone) only rose
 * 1.41× — encoding the active-moiety fold-change because 9-OH is
 * equipotent and reduced 9-OH formation offsets the parent rise.
 *
 * Skipped (no primary PubMed abstract with verbatim fluoxetine-
 * specific AUC fold-change):
 *   fluox → metoprolol   — only "same degree" generic statements,
 *                          no fluoxetine-specific number indexed
 *   fluox → atomoxetine  — Belle 2002 PMID:12412820 is paroxetine
 *                          → atomoxetine (6.5×), NOT fluoxetine
 *   fluox → tramadol     — Brosen 2015 review, no PK numbers
 *   fluox → omeprazole   — Foti 2008 in-vitro only; Bertilsson review
 *                          has no abstract numbers
 *
 * Unverified (rate-limit blocked, queued for retry):
 *   fluox → diazepam, phenytoin
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
    perpetrator: 'fluoxetine', victim: 'desipramine', victim_name: 'Desipramine',
    level: 'major', ki_uM: 0.263, source_pmid: 'PMID:8195463',
    note: 'CYP2D6 inhibition (TDI). Preskorn 1994 (PMID:8195463) n=18 healthy males, DXM-phenotyped EMs, desipramine 50 mg/d × 7d alone then × 21d + fluoxetine 20 mg/d: desipramine Cmax 4.0×, AUC0-24 4.8× (vs sertraline 31%/23%). Ki ≈ 1/3.8 = 0.263 µM (lower-bound; TDI true Ki lower). Effect persists ~5 weeks post-fluox-discontinuation due to norfluoxetine.',
  },
  {
    perpetrator: 'fluoxetine', victim: 'risperidone', victim_name: 'Risperidone',
    level: 'warn', ki_uM: 2.44, source_pmid: 'PMID:11985287',
    note: 'CYP2D6 inhibition. Bondolfi 2002 (PMID:11985287) n=11 psychotic inpatients (8 EM, 3 PM), risperidone 4-6 mg/d + fluoxetine 20 mg/d × 30d: parent AUC 83→345 ng·h/mL in EMs (4.15×), 398→514 in PMs. Active moiety (risperidone + 9-OH) only 470→663 (1.41×) since reduced 9-OH formation offsets parent rise. Ki ≈ 1/0.41 = 2.44 µM (active-moiety basis, the clinically-relevant endpoint).',
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
  console.log(`\nWave 2 session 15 (fluoxetine): added ${added}, updated ${updated}, already-had ${alreadyHas}, missing ${missing}`);
}

main();
