/**
 * 2026-05-07-wave-2b-clofibrate.ts — Wave 2b plasma-binding +1 edge.
 *
 * Adds:
 *   - clofibrate (new compound stub) — fibrate lipid-lowering, perpetrator
 *     of warfarin plasma-binding displacement
 *   - clofibrate → warfarin edge with verbatim Δfu=0.13 from PMID:480183
 *     (Bjornsson 1979): "Clofibrate caused a displacement of warfarin from
 *     plasma protein binding sites, with a 13% increase in the free drug
 *     fraction in plasma."
 *
 * Wave 2b state after this commit: 5 edges (was 4). v1.0 target was 10-20
 * but the verification sweep (2026-05-07) confirmed under the strict
 * no-fabrication rule, only ~5-6 pairs are achievable from PubMed abstracts.
 * The remainder require full-text access and are logged in AUTHORING_GAPS.md.
 *
 * Skipped this session (logged separately): valproate → diazepam (PMID:6802161
 * "approximately two fold" is semi-quantitative and didn't meet strict rule);
 * 12 other candidate pairs investigated and confirmed full-text-only.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

interface InteractionEdge {
  slug: string;
  name?: string;
  level?: string;
  note?: string;
  kinetics?: { plasma_binding_displacement?: number };
  source_pmid?: string;
}
interface Compound {
  slug: string;
  interactions?: InteractionEdge[];
  refs?: string[];
  [k: string]: unknown;
}

const CLOFIBRATE: Compound = {
  slug: 'clofibrate',
  name: 'Clofibrate',
  aliases: ['Atromid-S', 'ethyl 2-(4-chlorophenoxy)-2-methylpropanoate'],
  category: 'pharmacological',
  mechanism:
    'First-generation fibrate (PPAR-α agonist) that activates lipoprotein lipase and lowers serum triglycerides + LDL. Largely supplanted by gemfibrozil and fenofibrate due to a 1978 WHO trial showing increased non-cardiovascular mortality. Highly protein-bound (~96-97%) — clinically relevant as a warfarin plasma-binding displacer.',
  routes: ['PO'],
  doses: { PO: { min: 500, max: 2000, typical: 1000 } },
  mw_g_mol: 242.70,
  systems: ['cardiovascular', 'digestive'],
  pk_unauthored: {
    reason: 'research-only',
    note: 'Largely withdrawn from clinical use after the 1978 WHO trial. Catalog entry exists for the warfarin plasma-binding displacement edge (the canonical clofibrate-warfarin interaction is well-documented). Full PK not authored — gemfibrozil and fenofibrate are the clinically active fibrate slugs.',
  },
  interactions: [
    {
      slug: 'warfarin',
      name: 'Warfarin',
      level: 'major',
      note: 'Bjornsson 1979 (PMID:480183) verbatim: "Clofibrate caused a displacement of warfarin from plasma protein binding sites, with a 13% increase in the free drug fraction in plasma." Δfu/fu_baseline = 0.13. Mechanism: high albumin binding by both compounds (~97% bound) → competition at site I. Clinically: clofibrate potentiates warfarin\'s anticoagulant effect — INR monitoring required.',
      kinetics: { plasma_binding_displacement: 0.13 },
      source_pmid: 'PMID:480183',
    },
  ],
  refs: ['PMID:480183'],
};

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];
  const bySlug = new Map(data.map(c => [c.slug, c]));

  if (bySlug.has('clofibrate')) {
    console.log('  [skip] clofibrate already in registry');
  } else {
    data.push(CLOFIBRATE);
    console.log('  [add ] clofibrate (new compound) + 1 edge (clofibrate → warfarin, Δfu=0.13, PMID:480183)');
  }

  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log('Wave 2b: 1 new compound + 1 plasma-binding edge.');
}

main();
