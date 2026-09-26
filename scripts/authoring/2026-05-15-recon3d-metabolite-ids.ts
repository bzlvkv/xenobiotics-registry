/**
 * 2026-05-15-recon3d-metabolite-ids.ts
 *
 * Backfills `recon3d_metabolite_id` on v8 compound entries that map to
 * canonical BiGG metabolite IDs in the Recon3D human metabolic
 * reconstruction (Brunk 2018 PMID:29457794). The IDs follow the BiGG
 * universal namespace — stored WITHOUT compartment suffix (no `_c`,
 * `_e`, etc.) since v8 doesn't model compartments.
 *
 * Verification policy: every ID below was confirmed by reading a real
 * BiGG model JSON file from the SBRG/bigg_models_data GitHub mirror
 * (master branch, fetched 2026-05-15). IDs sourced from:
 *
 *   iML1515.json — E. coli K-12 MG1655 model (Monk et al. 2017).
 *                  Covers universal core metabolism: amino acids,
 *                  vitamins, cofactors, energy carriers, glycolysis +
 *                  TCA intermediates. BiGG namespace is universal —
 *                  the metabolite `atp` is the same chemical entity
 *                  in every model.
 *   iCHOv1.json  — Chinese Hamster Ovary mammalian model (Hefzi 2016).
 *                  Adds mammalian-specific monoamines + GABA +
 *                  hypotaurine + carnitine.
 *
 * Metabolites whose BiGG IDs we could NOT verify from the network at
 * authoring time (dopamine, norepinephrine, melatonin, creatine,
 * cholesterol, ascorbate, folate, cobalamin variants, NR, etc.) are
 * INTENTIONALLY left unmapped. They can be backfilled in a future pass
 * once `import-skeleton.ts --input <Recon3D.json>` runs against a
 * locally-downloaded model. The no-fabricated-identifiers rule applies
 * to BiGG IDs the same way it applies to PMIDs.
 *
 * Coverage delta: compounds with recon3d_metabolite_id 0 → 41.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface Compound {
  slug: string;
  recon3d_metabolite_id?: string;
  [k: string]: unknown;
}

// v8 slug → canonical BiGG metabolite ID (bare, no compartment suffix)
const MAPPING: Record<string, string> = {
  // ── Energy carriers + redox cofactors (iML1515) ────────────────────
  'nad-plus':            'nad',
  'nadh':                'nadh',
  'pyruvate':            'pyr',

  // ── Amino acids (iML1515; chirality suffix `__L` per BiGG) ─────────
  'tryptophan':          'trp__L',
  'l-tryptophan':        'trp__L',
  'tyrosine':            'tyr__L',
  'l-tyrosine':          'tyr__L',
  'phenylalanine':       'phe__L',
  'arginine':            'arg__L',
  'l-arginine':          'arg__L',
  'glycine':             'gly',
  'methionine':          'met__L',
  'cysteine':            'cys__L',
  'serine':              'ser__L',
  'leucine':             'leu__L',
  'valine':              'val__L',
  'isoleucine':          'ile__L',
  'alanine':             'ala__L',
  'aspartate':           'asp__L',
  'asparagine':          'asn__L',
  'lysine':              'lys__L',
  'histidine':           'his__L',
  'proline':             'pro__L',
  'threonine':           'thr__L',
  'glutamate':           'glu__L',

  // ── Vitamins / cofactors (iML1515) ─────────────────────────────────
  'thiamine':            'thm',
  'p5p':                 'pydx5p',
  'pyridoxine':          'pydxn',
  'biotin':              'btn',
  'methylfolate':        'mlthf',
  'nmn':                 'nmn',
  'niacinamide':         'ncam',

  // ── Glutathione + sulfur metabolites (iML1515 / iCHOv1) ────────────
  'glutathione':         'gthrd',  // reduced — the species the compound entry represents
  'taurine':             'tau',
  'hypotaurine':         'hyptaur',

  // ── Mammalian-specific (iCHOv1) ────────────────────────────────────
  'serotonin':           'srtn',
  '5-htp':               '5htrp',
  'gaba':                '4abut',
  'epinephrine':         'adrnl',
  'l-carnitine':         'crn',

  // ── Other (iML1515) ────────────────────────────────────────────────
  'choline-bitartrate':  'chol',  // the salt delivers the bare choline metabolite
};

function main(): void {
  const cs = JSON.parse(readFileSync(PATH, 'utf-8')) as Compound[];
  let patched = 0;
  let alreadySet = 0;
  let unknownSlug = 0;
  const slugIdx = new Map(cs.map(c => [c.slug, c]));

  for (const [slug, biggId] of Object.entries(MAPPING)) {
    const c = slugIdx.get(slug);
    if (!c) {
      unknownSlug++;
      console.log(`  [skip] ${slug.padEnd(22)} — not in registry`);
      continue;
    }
    if (c.recon3d_metabolite_id) {
      alreadySet++;
      console.log(`  [keep] ${slug.padEnd(22)} already → ${c.recon3d_metabolite_id}`);
      continue;
    }
    c.recon3d_metabolite_id = biggId;
    patched++;
    console.log(`  [patch] ${slug.padEnd(22)} → ${biggId}`);
  }

  writeFileSync(PATH, JSON.stringify(cs, null, 2) + '\n');

  console.log('\nRecon3D metabolite-ID backfill complete.');
  console.log(`  Patched: ${patched}`);
  console.log(`  Already set: ${alreadySet}`);
  console.log(`  Unknown slug: ${unknownSlug}`);
  console.log(`  Total compounds: ${cs.length}`);
  const withId = cs.filter(c => c.recon3d_metabolite_id).length;
  console.log(`  Coverage: ${withId} / ${cs.length} (${((withId / cs.length) * 100).toFixed(1)}%)`);
}

main();
