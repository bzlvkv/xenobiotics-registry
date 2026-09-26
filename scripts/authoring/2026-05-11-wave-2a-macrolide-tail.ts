/**
 * 2026-05-11-wave-2a-macrolide-tail.ts — Rifabutin perpetrator (v1.1).
 *
 * Wave 2a v1.1 session 12. Originally a 4-edge target list (clari +
 * ery + rifabutin), but 3 of 4 turned out to already be authored with
 * the same PMIDs from earlier sessions (Greenblatt 1998, Muirhead 2002).
 * Net: 1 new edge — rifabutin → buprenorphine — captured from the
 * same McCance-Katz 2011 paper that yielded rifampin → buprenorphine
 * in the prior session.
 *
 * ── Authored edge (1) ─────────────────────────────────────────────
 *
 *   rifabutin → buprenorphine   ind×1.54   caution   AUC ↓35%   PMID:21596492
 *
 * Same paper as rifampin → buprenorphine (ind×3.33, AUC ↓70%, major).
 * The head-to-head finding: rifabutin is the weaker CYP3A4 inducer
 * (35% vs 70% AUC reduction) and crucially produces NO opiate
 * withdrawal symptoms vs 50% incidence with rifampin. This is the
 * mechanistic basis for preferring rifabutin over rifampin in HIV/TB
 * co-therapy when opioids are on board.
 *
 * ── Already-authored (3, no-op) ───────────────────────────────────
 *
 *   clarithromycin → triazolam (already PMID:9757151 Ki=0.9)
 *   erythromycin → triazolam   (already PMID:9757151 Ki=1.6)
 *   erythromycin → sildenafil  (already PMID:11879258 Ki=1.7)
 *
 * The Greenblatt 1998 paper supports both the clari + ery triazolam
 * edges — already authored in a prior session.
 *
 * ── Skipped (5) — logged in AUTHORING_GAPS.md ─────────────────────
 *
 *   clarithromycin → quetiapine (PMID:19067264 title-only)
 *   clarithromycin → colchicine (Terkeltaub 2011 "ratios >125%" only)
 *   erythromycin → carbamazepine (reviews / passing mentions only)
 *   rifabutin → atazanavir (PMID:21712242 reverse direction)
 *   rifabutin → midazolam (in vitro hepatocytes only)
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

const RIFABUTIN_EDGES: InteractionRef[] = [
  {
    slug: 'buprenorphine',
    name: 'Buprenorphine',
    level: 'caution',
    note: 'CYP3A4 induction (weaker than rifampin). McCance-Katz 2011 (PMID:21596492) verbatim: rifabutin "resulted in a significant decrease in buprenorphine plasma concentrations (35% decrease in AUC; p<0.001) no opiate withdrawal was seen". Same paper, head-to-head vs rifampin: rifabutin AUC ↓35%, NO withdrawal; rifampin AUC ↓70%, 50% withdrawal. Rifabutin clinically preferred for HIV/TB + opioid co-therapy. Ratio 0.65 → induction_factor 1.54.',
    kinetics: { induction_factor: 1.54 },
    source_pmid: 'PMID:21596492',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  if (existing?.kinetics?.induction_factor === edge.kinetics?.induction_factor &&
      existing?.source_pmid === edge.source_pmid) return 'already';
  if (existing) { Object.assign(existing, edge); return 'updated'; }
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

  const rif = bySlug.get('rifabutin');
  if (!rif) throw new Error('rifabutin missing');

  let added = 0;
  for (const edge of RIFABUTIN_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(rif, edge);
    addRef(rif, edge.source_pmid);
    if (r === 'added') added++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] rifabutin → ${edge.slug.padEnd(15)} ind×${edge.kinetics?.induction_factor} ${edge.source_pmid}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nRifabutin perpetrator (v1.1): +${added} edge. 5 skips + 3 already-authored noted.`);
}

main();
