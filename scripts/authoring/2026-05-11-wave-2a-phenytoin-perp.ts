/**
 * 2026-05-11-wave-2a-phenytoin-perp.ts — Phenytoin as broad-CYP inducer (v1.1).
 *
 * Phenytoin had only 1 perpetrator edge (hormonal-contraceptives,
 * authored from Crawford 1990 in the same session that captured the
 * CBZ perpetrator cluster). This session expands phenytoin's
 * perpetrator side with the two clinically high-impact edges that
 * survived the strict abstract-verbatim rule:
 *
 *   → atorvastatin   ind×2.17  warn   PMID:21635243  AUC ↓54%
 *   → quetiapine     ind×5.0   major  PMID:11199955  CL × 5
 *
 * The atorvastatin edge is from a 119-volunteer open-label study by GSK
 * (Bullman 2011) — large n, clean design. The quetiapine edge is from
 * Wong 2001 (AstraZeneca, Seroquel maker), schizophrenia / schizoaffective
 * / bipolar patients on steady-state quetiapine + phenytoin add-on.
 *
 * ── Skipped (6) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 *   phenytoin → simvastatin   — narrative mentions only across 3 PMIDs.
 *   phenytoin → cyclosporine  — Freeman 1984 (PMID:6529529) is qualitative
 *     ("significantly reduced ... AUC") without a numeric magnitude.
 *   phenytoin → midazolam     — Backman 1996 (PMID:8598183) pooled CBZ+PHT
 *     cohort; the 5.7% AUC value isn't split per perpetrator. Skipped per
 *     the same caveat that authored CBZ→midazolam under CBZ alone.
 *   phenytoin → praziquantel  — Bittencourt 1992 (PMID:1549207) qualitative
 *     ("magnitude of the decrease is surprisingly high"), no AUC ratio.
 *   phenytoin → warfarin      — Levine 1984 (PMID:6723231) no abstract;
 *     other hits are reviews. Mechanism is mixed (CYP1A2 induction reduces
 *     R-warfarin CL while CYP2C9 inhibition raises S-warfarin) so a
 *     single induction_factor may not capture the clinical picture even
 *     with a verbatim PK number.
 *   phenytoin → R-warfarin    — separately chased; no abstract with split.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Kinetics { ki_uM?: number; induction_factor?: number; plasma_binding_displacement?: number; }
interface InteractionRef { slug: string; name?: string; level?: string; note?: string; kinetics?: Kinetics; source_pmid?: string; }
interface Compound { slug: string; name?: string; interactions?: InteractionRef[]; refs?: string[]; [k: string]: unknown; }

const PHENYTOIN_EDGES: InteractionRef[] = [
  {
    slug: 'atorvastatin',
    name: 'Atorvastatin',
    level: 'warn',
    note: 'CYP3A4 induction. Bullman 2011 (PMID:21635243) verbatim: "When atorvastatin was administered with phenytoin compared with when atorvastatin was administered alone, reductions in AUC((0-τ)) and C(max) were observed for atorvastatin (54% and 24%, respectively)". 119 healthy volunteers, open-label single-sequence, atorvastatin 40 mg/d × 7d + phenytoin ~4 mg/kg/d × 28d. AUC ratio 0.46 → induction_factor 1/0.46 = 2.17. Statin efficacy loss.',
    kinetics: { induction_factor: 2.17 },
    source_pmid: 'PMID:21635243',
  },
  {
    slug: 'quetiapine',
    name: 'Quetiapine',
    level: 'major',
    note: 'CYP3A4 induction. Wong 2001 (PMID:11199955) verbatim: phenytoin "did indeed have a marked effect on the metabolism of quetiapine, resulting in a 5-fold increase in clearance when administered concomitantly to patients". Steady-state PK in schizophrenia / schizoaffective / bipolar patients on quetiapine + phenytoin add-on. CL × 5 → induction_factor 5.0. Dose adjustment of quetiapine likely required; loss of antipsychotic efficacy.',
    kinetics: { induction_factor: 5.0 },
    source_pmid: 'PMID:11199955',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  const sameKi = existing?.kinetics?.ki_uM === edge.kinetics?.ki_uM;
  const sameInd = existing?.kinetics?.induction_factor === edge.kinetics?.induction_factor;
  if (sameKi && sameInd && existing?.source_pmid === edge.source_pmid) return 'already';
  if (existing) {
    Object.assign(existing, edge);
    return 'updated';
  }
  perp.interactions.push(edge);
  return 'added';
}

function addRef(perp: Compound, pmid: string | undefined): void {
  if (!pmid) return;
  perp.refs = perp.refs ?? [];
  if (!perp.refs.includes(pmid)) perp.refs.push(pmid);
}

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  const phen = bySlug.get('phenytoin');
  if (!phen) throw new Error('phenytoin missing from registry');

  let added = 0, updated = 0, already = 0;
  for (const edge of PHENYTOIN_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(phen, edge);
    addRef(phen, edge.source_pmid);
    if (r === 'added') added++;
    else if (r === 'updated') updated++;
    else already++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] phenytoin → ${edge.slug.padEnd(15)} ind×${edge.kinetics?.induction_factor} ${edge.source_pmid}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nPhenytoin perpetrator (v1.1): +${added} edges (${updated} updated, ${already} already-had). 6 skips logged.`);
}

main();
