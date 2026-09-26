/**
 * 2026-05-11-wave-2a-cyp2d6.ts — Wave 2a CYP2D6 expansion (v1.1 cut).
 *
 * v1.1 ROADMAP §2a non-3A4 perpetrators. This session targets the
 * CYP2D6 cluster: quinidine (canonical probe inhibitor; 0 prior 2D6
 * edges), fluoxetine, bupropion, and a paroxetine tail-pass.
 *
 * Outcome: 4 new edges authored + 1 new compound (dextromethorphan
 * was missing from the registry despite being THE CYP2D6 probe substrate).
 *
 * Strict abstract-verbatim rule applied per scripts/authoring/PLAYBOOK.md.
 * 24 candidate pairs investigated and skipped — most because the AUC
 * ratio lives in result tables or the FDA package insert, not in any
 * PubMed-indexed abstract. Logged in AUTHORING_GAPS.md.
 *
 * ── Authored edges ────────────────────────────────────────────────
 *
 *   quinidine → dextromethorphan  Ki=0.036 µM  major  PMID:8841152
 *     Capon 1996 (Clin Pharmacol Ther). Verbatim: "quinidine increased the
 *     AUC in extensive metabolizers 43-fold". 6 EMs, 30 mg DM + 50 mg
 *     quinidine, 168 h sampling. Ki ≈ 1.5/(43-1) = 0.036 µM.
 *
 *   quinidine → propafenone       Ki=0.888 µM  caution  PMID:2719900
 *     Funck-Brentano 1989 (Br J Clin Pharmacol). Verbatim: "quinidine
 *     increased mean steady-state plasma propafenone concentrations more
 *     than two fold, from 408 ± 351 (mean ± s.d.) to 1096 ± 644 ng ml-1
 *     (P less than 0.001)". 7 EMs / 2 PMs, propafenone steady-state for
 *     VT + low-dose quinidine. AUC ratio 1096/408 = 2.69×.
 *     Ki ≈ 1.5/1.69 = 0.888 µM. EM phenotype only — PMs unaffected.
 *
 *   quinidine → desipramine       Ki=0.265 µM  major  PMID:2792169
 *     Brøsen & Gram 1989 (Eur J Clin Pharmacol). Verbatim: "During quinidine
 *     the total oral clearance of imipramine on average was reduced by 35%,
 *     and that of desipramine by 85%". 6 EMs of sparteine, 100 mg PO
 *     desipramine ± quinidine 200 mg/d. CL reduction 85% = AUC ratio
 *     1/(1-0.85) = 6.67×. Ki ≈ 1.5/5.67 = 0.265 µM.
 *
 *   paroxetine → carvedilol       Ki=0.133 µM  caution  PMID:20705902
 *     Stout 2010 (J Cardiovasc Pharmacol Ther). Verbatim: "AUC increased
 *     significantly with paroxetine coadministration, approximately
 *     2.5-fold and 1.9-fold for the R and S enantiomers, respectively".
 *     12 healthy volunteers, single 12.5 mg carvedilol ± paroxetine 10 mg
 *     bid, crossover. R-enantiomer (β-active eutomer) basis:
 *     Ki ≈ 0.2/(2.5-1) = 0.133 µM.
 *
 * ── New compound: dextromethorphan ────────────────────────────────
 *
 *   Surprise gap — registry had 0 dextromethorphan entry despite it
 *   being the canonical CYP2D6 probe substrate (used in basically every
 *   CYP2D6 phenotyping protocol). Authored as a minimal stub with
 *   pk_unauthored (no human single-dose F/V/ka/t½ quartet in any
 *   PubMed-indexed abstract — Capon 1996 reports half-lives but the
 *   compound's PK varies 150× between EM and PM phenotypes, which makes
 *   a single "default" PK row meaningless without a phenotype layer).
 *
 * ── Skipped (24) — logged in AUTHORING_GAPS.md ────────────────────
 *
 * Quinidine victims (4 skipped):
 *   metoprolol      — CL/MR change abstracts only; Leemann 1986 has no
 *                     indexed abstract; AUC ratio lives in tables.
 *   codeine         — O-demethylation CL changes verbatim, no AUC ratio.
 *   flecainide      — CL change reported, not AUC. Munafo 1992 IV dose.
 *   nortriptyline   — only in vitro HLM Ki, no in-vivo AUC abstracts.
 *
 * Fluoxetine victims (8 skipped, all CYP2D6):
 *   metoprolol, atomoxetine, propranolol, codeine, dextromethorphan,
 *   tamoxifen, nortriptyline, aripiprazole — uniform pattern: classic
 *   numbers live in tables (Bergstrom 1992 desipramine, Borges 2006
 *   tamoxifen, Otton 1993 DXM) or in reviews citing primaries. No
 *   abstract-verbatim AUC ratio for any of the 8 named victims.
 *
 * Bupropion victims (5 skipped):
 *   metoprolol, dextromethorphan, venlafaxine, tamoxifen, tramadol —
 *   the canonical "5× metoprolol AUC bump" lives in the Wellbutrin
 *   FDA label, not a PubMed abstract. Kotlyar 2005 (PMID:15876900)
 *   reports urinary DM/DX metabolic ratio change but not plasma AUC.
 *
 * Paroxetine tail (6 skipped):
 *   codeine, dextromethorphan, nortriptyline, tamoxifen, propafenone,
 *   propranolol — multiple structural reasons: trough-not-AUC (Laine
 *   2001 nortriptyline in ultrarapid metabolizers), wrong polarity
 *   (Stearns 2003 endoxifen formation rather than tamoxifen AUC),
 *   confounded probe (Schoedel 2012 DM coadministered with quinidine
 *   in DMQ), no PubMed-indexed primary study at all (propafenone,
 *   propranolol). The existing 6 paroxetine 2D6 edges cover the
 *   high-yield victims; the tail is a clear ceiling.
 *
 * ── Net ───────────────────────────────────────────────────────────
 *
 * 4 edges + 1 new compound. CYP2D6 perpetrator coverage:
 *   paroxetine    6 → 7  (+ carvedilol)
 *   quinidine     0 → 3  (+ DXM/propafenone/desipramine; digoxin pre-existing P-gp)
 *   fluoxetine    2 → 2
 *   bupropion     2 → 2
 *
 * Ceiling discovery: CYP2D6 victim AUC ratios are systematically under-
 * indexed in PubMed abstracts vs. CYP3A4. The 24 skips this session
 * documents the same "tables-not-abstracts" pattern v1.0 logged for
 * Wave 2b plasma binding and Wave 3a SSRI kₑₒ.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Kinetics {
  ki_uM?: number;
  induction_factor?: number;
  plasma_binding_displacement?: number;
}
interface InteractionRef {
  slug: string;
  name?: string;
  level?: string;
  note?: string;
  kinetics?: Kinetics;
  source_pmid?: string;
}
interface Compound {
  slug: string;
  name?: string;
  interactions?: InteractionRef[];
  refs?: string[];
  [k: string]: unknown;
}

// ── New compound: dextromethorphan ───────────────────────────────────
const DEXTROMETHORPHAN: Compound = {
  slug: 'dextromethorphan',
  name: 'Dextromethorphan',
  aliases: ['DXM', 'DM', 'dex', 'd-methorphan', 'Robitussin DM'],
  category: 'pharmacological',
  mechanism:
    'OTC antitussive acting centrally on the medullary cough reflex. The parent compound is a sigma-1 receptor agonist and weak NMDA receptor antagonist; the principal active metabolite dextrorphan (formed by CYP2D6 O-demethylation) is a much more potent NMDA antagonist and the source of the dissociative effects seen at supratherapeutic doses. CYP2D6 elimination is so dominant that DXM AUC differs ~150-fold between extensive and poor metabolizers — DXM is the canonical CYP2D6 probe substrate in phenotyping protocols. Secondary metabolism is N-demethylation by CYP3A4 to 3-methoxymorphinan.',
  routes: ['PO'],
  doses: { PO: { min: 10, max: 30, typical: 20 } },
  mw_g_mol: 271.40,
  systems: ['nervous'],
  refs: ['PMID:8841152'],
  // pk intentionally absent. CYP2D6 elimination dominates: Capon 1996
  // (PMID:8841152) abstract verbatim — DXM AUC is 150× higher in PMs vs EMs
  // and median t½ varies 2.4 h (EM) / 5.6 h (EM + quinidine) / 19.1 h (PM).
  // A single "default" PK row would be meaningless without a phenotype layer
  // the v8 schema does not yet model.
};

// ── Quinidine CYP2D6 edges ───────────────────────────────────────────
const QUINIDINE_EDGES: InteractionRef[] = [
  {
    slug: 'dextromethorphan',
    name: 'Dextromethorphan',
    level: 'major',
    note: 'CYP2D6 inhibition. Capon 1996 (PMID:8841152) verbatim: "quinidine increased the AUC in extensive metabolizers 43-fold". 6 EMs, single 30 mg DM + 50 mg quinidine 1 h later, 168 h sampling, crossover with placebo and quinidine-alone arms. Ki ≈ 1.5/(43-1) = 0.036 µM. Quinidine effectively converts EMs into PM-like DXM exposure — the basis for the DMQ (dextromethorphan/quinidine) combination product for pseudobulbar affect.',
    kinetics: { ki_uM: 0.036 },
    source_pmid: 'PMID:8841152',
  },
  {
    slug: 'propafenone',
    name: 'Propafenone',
    level: 'caution',
    note: 'CYP2D6 (5-hydroxylation). Funck-Brentano 1989 (PMID:2719900) verbatim: "quinidine increased mean steady-state plasma propafenone concentrations more than two fold, from 408 ± 351 to 1096 ± 644 ng ml-1 (P less than 0.001)". 7 EMs + 2 PMs on propafenone for VT; PMs unchanged. AUC 2.69×; Ki ≈ 0.888 µM. ECG/arrhythmia unchanged because 5-OH-propafenone is also active — interaction matters more for adverse effects than efficacy.',
    kinetics: { ki_uM: 0.888 },
    source_pmid: 'PMID:2719900',
  },
  {
    slug: 'desipramine',
    name: 'Desipramine',
    level: 'major',
    note: 'CYP2D6 inhibition (2-hydroxylation). Brøsen & Gram 1989 (PMID:2792169) verbatim: "During quinidine the total oral clearance of imipramine on average was reduced by 35%, and that of desipramine by 85%". 6 EMs of sparteine, single 100 mg PO desipramine ± quinidine 200 mg/d. 85% CL reduction maps algebraically to AUC ratio 1/(1-0.85) = 6.67×. Ki ≈ 1.5/5.67 = 0.265 µM. TCA narrow therapeutic index — anticholinergic + cardiac conduction risk with the 6-7× exposure rise; dose reduction needed.',
    kinetics: { ki_uM: 0.265 },
    source_pmid: 'PMID:2792169',
  },
];

// ── Paroxetine new edge (tail of the existing 6) ─────────────────────
const PAROXETINE_EDGES: InteractionRef[] = [
  {
    slug: 'carvedilol',
    name: 'Carvedilol',
    level: 'caution',
    note: 'CYP2D6 inhibition (R-enantiomer; the β-active eutomer). Stout 2010 (PMID:20705902) verbatim: "AUC increased significantly with paroxetine coadministration, approximately 2.5-fold and 1.9-fold for the R and S enantiomers, respectively". 12 healthy volunteers, single 12.5 mg PO carvedilol ± paroxetine 10 mg bid, 2-phase crossover. Ki ≈ 0.2/(2.5-1) = 0.133 µM (R basis). No HR/BP/PR changes in healthy normotensives, but the 2.5× exposure is plausibly relevant in HF patients on chronic therapy.',
    kinetics: { ki_uM: 0.133 },
    source_pmid: 'PMID:20705902',
  },
];

function upsertEdge(perp: Compound, edge: InteractionRef): 'added' | 'updated' | 'already' {
  perp.interactions = perp.interactions ?? [];
  const existing = perp.interactions.find(e => e.slug === edge.slug);
  if (existing?.kinetics?.ki_uM === edge.kinetics?.ki_uM && existing?.source_pmid === edge.source_pmid) {
    return 'already';
  }
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

  let added = 0, updated = 0, already = 0;

  // 1. Add dextromethorphan if missing
  if (!bySlug.has('dextromethorphan')) {
    data.push(DEXTROMETHORPHAN);
    bySlug.set('dextromethorphan', DEXTROMETHORPHAN);
    console.log('  [add ] dextromethorphan (new compound)');
  } else {
    console.log('  [skip] dextromethorphan already in registry');
  }

  // 2. Quinidine CYP2D6 edges
  const quinidine = bySlug.get('quinidine');
  if (!quinidine) throw new Error('quinidine missing from registry');
  for (const edge of QUINIDINE_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(quinidine, edge);
    addRef(quinidine, edge.source_pmid);
    if (r === 'added') added++;
    else if (r === 'updated') updated++;
    else already++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] quinidine → ${edge.slug.padEnd(18)} Ki=${edge.kinetics?.ki_uM} µM ${edge.source_pmid}`);
  }

  // 3. Paroxetine tail (carvedilol)
  const paroxetine = bySlug.get('paroxetine');
  if (!paroxetine) throw new Error('paroxetine missing from registry');
  for (const edge of PAROXETINE_EDGES) {
    if (!bySlug.has(edge.slug)) throw new Error(`victim missing: ${edge.slug}`);
    const r = upsertEdge(paroxetine, edge);
    addRef(paroxetine, edge.source_pmid);
    if (r === 'added') added++;
    else if (r === 'updated') updated++;
    else already++;
    console.log(`  [${r === 'already' ? 'skip' : r === 'added' ? 'add ' : 'updt'}] paroxetine → ${edge.slug.padEnd(17)} Ki=${edge.kinetics?.ki_uM} µM ${edge.source_pmid}`);
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nWave 2a CYP2D6 (v1.1): +${added} edges, ${updated} updated, ${already} already-had. 24 skips logged in AUTHORING_GAPS.md.`);
}

main();
