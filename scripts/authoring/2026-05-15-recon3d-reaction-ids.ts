/**
 * 2026-05-15-recon3d-reaction-ids.ts
 *
 * Backfills `recon3d_reaction_ids` on v8 pathway steps that correspond
 * to canonical BiGG reactions in the Recon3D human metabolic model
 * (Brunk 2018, PMID:29457794). BiGG reaction IDs follow a universal
 * namespace — the reaction `CS` (citrate synthase) is the same enzyme
 * in every model that contains it.
 *
 * Verification policy: every reaction ID below was confirmed present in
 * a real BiGG model JSON file (iML1515.json from SBRG/bigg_models_data,
 * fetched 2026-05-15). Reaction IDs that could not be verified
 * (HEX1 for human hexokinase 1, MTHFR/CBS/METS for one-carbon
 * metabolism, ARGSL/ARGN for urea cycle, BDH/HMGCS for ketogenesis,
 * etc.) are INTENTIONALLY skipped. They can be backfilled by running
 * `scripts/recon3d/import-skeleton.ts --input <Recon3D.json>` against
 * a locally-downloaded Recon3D model. The no-fabricated-identifiers
 * rule applies the same way to reaction IDs as to PMIDs.
 *
 * Coverage delta: 0 → ~22 pathway steps annotated with BiGG reaction
 * cross-references.
 *
 * Authoring layout: keyed by (pathway_slug, step_index) so re-runs
 * detect mismatches if a pathway's step order changes. Step indices
 * are 0-based.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface PathwayStep {
  from: string;
  to: string;
  via?: string;
  via_slug?: string;
  note?: string;
  source_pmid?: string;
  recon3d_reaction_ids?: string[];
}
interface Pathway {
  slug: string;
  steps: PathwayStep[];
  [k: string]: unknown;
}

interface StepBackfill {
  /** Verbatim string that must appear in the step's `via` field; guards
   *  against silently mis-annotating a step whose enzyme was rewritten. */
  expectVia: string;
  /** BiGG reaction IDs (universal namespace, no compartment suffix). */
  ids: string[];
}
type PathwayBackfill = Record<number, StepBackfill>;

const MAPPING: Record<string, PathwayBackfill> = {
  // ── Glycolysis (3 v8 steps; v8 compresses 10 textbook steps) ───────
  glycolysis: {
    // Step 0 (glucose → G6P via hexokinase): HEX1 (Recon3D ID) not
    // verifiable from iML1515; skipping.
    1: {
      expectVia: 'phosphofructokinase-1 (PFK-1) — RATE-LIMITING',
      ids: ['PGI', 'PFK'], // G6P → F6P → F1,6BP
    },
    2: {
      expectVia: 'multi-step (aldolase + TPI + GAPDH + PGK + PGM + enolase + PYRUVATE KINASE)',
      ids: ['FBA', 'TPI', 'GAPD', 'PGK', 'PGM', 'ENO', 'PYK'], // F1,6BP → pyruvate
    },
  },

  // ── TCA cycle (8 v8 steps) ─────────────────────────────────────────
  tca_cycle: {
    0: { expectVia: 'citrate synthase (irreversible)', ids: ['CS'] },
    1: { expectVia: 'aconitase', ids: ['ACONTa', 'ACONTb'] }, // BiGG splits aconitase
    2: { expectVia: 'isocitrate dehydrogenase (IDH) — rate-limiting; NAD-linked', ids: ['ICDHyr'] },
    3: { expectVia: 'α-KG dehydrogenase complex (mirror of PDH)', ids: ['AKGDH'] },
    4: { expectVia: 'succinyl-CoA synthetase (substrate-level phosphorylation)', ids: ['SUCOAS'] },
    5: { expectVia: 'succinate dehydrogenase = ETC Complex II', ids: ['SUCDi'] },
    6: { expectVia: 'fumarase', ids: ['FUM'] },
    7: { expectVia: 'malate dehydrogenase (closes cycle)', ids: ['MDH'] },
  },

  // ── Pentose phosphate pathway (3 v8 steps) ─────────────────────────
  pentose_phosphate_pathway: {
    0: { expectVia: 'G6PD — RATE-LIMITING; X-linked; common deficiency', ids: ['G6PDH2r'] },
    1: { expectVia: '6-phosphogluconate dehydrogenase (NADP+ → NADPH)', ids: ['PGL', 'GND'] }, // includes lactonase step
    2: { expectVia: 'phosphopentose isomerase (substrate for nucleotide synthesis)', ids: ['RPI'] },
  },

  // ── β-oxidation (4 v8 steps) ───────────────────────────────────────
  beta_oxidation: {
    // Step 0 (FA-CoA → enoyl-CoA via acyl-CoA dehydrogenase): ACAD
    // variants (ACOAD1f / ACOAD1z etc.) not found in iML1515; skipping.
    1: { expectVia: 'enoyl-CoA hydratase', ids: ['ECOAH', 'ECOAH1'] },
    2: { expectVia: '3-OH-acyl-CoA dehydrogenase (NAD → NADH)', ids: ['HACD1'] },
    3: { expectVia: 'β-ketothiolase (also produces a shortened acyl-CoA for next cycle)', ids: ['ACACT1'] },
  },

  // ── Glutamate / glutamine cycle (3 v8 steps) ───────────────────────
  glutamate_glutamine_cycle: {
    0: { expectVia: 'glutamine synthetase (GS, astrocyte) — incorporates NH4+', ids: ['GLNS'] },
    // Step 1 (glutamine → glutamate via GLS): GLUN/GLUNm not verifiable
    // from iML1515 (mammalian-specific naming); skipping.
    2: { expectVia: 'glutamate dehydrogenase (GDH) — TCA anaplerosis', ids: ['GLUDy'] },
  },

  // ── Urea cycle (5 v8 steps) ────────────────────────────────────────
  // Only the entry step (CPS1) and ASS step are verifiable from
  // iML1515; OTC, ASL, and arginase use mammalian-specific BiGG ids
  // not in the E. coli model. Skipping unverified steps.
  urea_cycle: {
    0: { expectVia: 'CPS1 — rate-limiting; mitochondrial; NAG-activated', ids: ['CBPS'] },
    2: { expectVia: 'argininosuccinate synthase (ASS1)', ids: ['ARGSS'] },
  },
};

function main(): void {
  const ps = JSON.parse(readFileSync(PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(ps.map(p => [p.slug, p]));

  let totalPatched = 0;
  let mismatches = 0;
  let pathwayMissing = 0;
  let stepMissing = 0;

  for (const [slug, stepMap] of Object.entries(MAPPING)) {
    const p = bySlug.get(slug);
    if (!p) {
      pathwayMissing++;
      console.log(`  [skip] pathway not in registry: ${slug}`);
      continue;
    }
    for (const [idxStr, backfill] of Object.entries(stepMap)) {
      const idx = Number(idxStr);
      const step = p.steps[idx];
      if (!step) {
        stepMissing++;
        console.log(`  [skip] ${slug} step ${idx} missing — pathway has ${p.steps.length} steps`);
        continue;
      }
      if (step.via !== backfill.expectVia) {
        mismatches++;
        console.log(`  [warn] ${slug}[${idx}] via-string drift:`);
        console.log(`         expected: "${backfill.expectVia}"`);
        console.log(`         actual:   "${step.via}"`);
        continue;
      }
      if (step.recon3d_reaction_ids) {
        console.log(`  [keep] ${slug}[${idx}] already has IDs: ${step.recon3d_reaction_ids.join(',')}`);
        continue;
      }
      step.recon3d_reaction_ids = backfill.ids;
      totalPatched++;
      console.log(`  [patch] ${slug.padEnd(34)} step ${idx}: ${backfill.ids.join(', ')}`);
    }
  }

  // Sort pathways alpha so the file's order stays stable.
  ps.sort((a, b) => (a.slug as string).localeCompare(b.slug as string));
  writeFileSync(PATH, JSON.stringify(ps, null, 2) + '\n');

  console.log('\nRecon3D reaction-ID backfill complete.');
  console.log(`  Patched: ${totalPatched} step${totalPatched === 1 ? '' : 's'}`);
  console.log(`  Via-string mismatches: ${mismatches}`);
  console.log(`  Pathway missing: ${pathwayMissing}`);
  console.log(`  Step missing: ${stepMissing}`);

  let totalSteps = 0;
  let stepsWithIds = 0;
  for (const p of ps) {
    for (const s of p.steps) {
      totalSteps++;
      if (s.recon3d_reaction_ids?.length) stepsWithIds++;
    }
  }
  console.log(`  Coverage: ${stepsWithIds} / ${totalSteps} steps (${((stepsWithIds / totalSteps) * 100).toFixed(1)}%)`);
}

main();
