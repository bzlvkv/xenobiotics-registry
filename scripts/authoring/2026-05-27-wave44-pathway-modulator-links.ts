/**
 * 2026-05-27-wave44-pathway-modulator-links.ts — wire 11 compound→pathway
 * modulator linkages the registry was missing (the compounds were on the
 * registry; their *mechanism* pathways existed; only the modulator entry was
 * absent, so the pathway view didn't surface the compound as a modulator).
 *
 * All factual biochemistry — none of these adds a new compound or pathway.
 *
 * Pathway audit context: of 230 pathways, all 30+ supplement-mechanism domains
 * I probed have coverage. The only fillable gaps were these modulator-side
 * cross-references.
 *
 * Idempotent per (pathway, slug).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Modulator = { slug: string; effect: string; target?: string; note?: string };
type Pathway = { slug: string; modulators?: Modulator[]; [k: string]: unknown };

interface Link { pathway: string; mod: Modulator }
const LINKS: Link[] = [
  { pathway: 'oxidative_phosphorylation', mod: { slug: 'coq10', effect: 'cofactor', target: 'ETC Complex I/II → III electron carrier (ubiquinone ↔ ubiquinol)', note: 'Mobile lipid-soluble electron shuttle between Complex I/II and Complex III; supplemented to support mitochondrial energy in statin myopathy, mitochondrial disease, and aging.' } },
  { pathway: 'carnitine_shuttle', mod: { slug: 'l-carnitine', effect: 'substrate', target: 'long-chain FA mitochondrial import (CPT1/CPT2)', note: 'Parent l-carnitine; CPT1 conjugates it to long-chain fatty acyl-CoA for inner-mitochondrial transport. Endogenous + dietary (red meat); supplements for primary deficiency or athletic energy claims.' } },
  { pathway: 'beta_oxidation', mod: { slug: 'l-carnitine', effect: 'cofactor', target: 'rate of FA β-oxidation (entry-limiting via carnitine shuttle)', note: 'L-carnitine availability gates long-chain fatty acid delivery into the mitochondrial matrix and thus β-oxidation flux.' } },
  { pathway: 'arachidonic_acid_cascade', mod: { slug: 'epa', effect: 'inhibitor', target: 'AA-derived eicosanoid output (2-series PG, 4-series LT)', note: 'EPA competes with arachidonic acid at COX/LOX; shifts output toward less-inflammatory 3-series prostaglandins + 5-series leukotrienes, and is a substrate for E-series resolvin biosynthesis.' } },
  { pathway: 'arachidonic_acid_cascade', mod: { slug: 'dha', effect: 'inhibitor', target: 'membrane AA pool; AA-derived eicosanoid output', note: 'DHA incorporates into phospholipids, displacing AA from membrane pools and lowering COX/LOX substrate supply; precursor of D-series resolvins and protectins.' } },
  { pathway: 'arachidonic_acid_cascade', mod: { slug: 'fish-oil', effect: 'inhibitor', target: 'AA-derived eicosanoid output (via EPA + DHA membrane incorporation)', note: 'Combined EPA+DHA marine source; suppresses AA-derived 2-series PG and 4-series LT via the EPA/DHA mechanisms above.' } },
  { pathway: 'methionine_sam_cycle', mod: { slug: 'methylfolate', effect: 'cofactor', target: 'homocysteine remethylation (methionine synthase)', note: '5-MTHF donates its methyl group to homocysteine via methionine synthase (B12-dependent), forming methionine + THF; bypasses MTHFR for those with reduced enzyme activity.' } },
  { pathway: 'methionine_sam_cycle', mod: { slug: 'methylcobalamin', effect: 'cofactor', target: 'methionine synthase (transient methyl carrier on cobalt)', note: 'Active B12 form; the cobalt center holds the methyl group transiently between 5-MTHF and homocysteine.' } },
  { pathway: 'methionine_sam_cycle', mod: { slug: 'cyanocobalamin', effect: 'cofactor', target: 'intracellular B12 pool → methylcobalamin (methionine synthase)', note: 'Synthetic B12 precursor; cellular processing removes the cyanide and forms the active methyl- and adenosyl-cobalamin coenzymes.' } },
  { pathway: 'glutathione_metabolism', mod: { slug: 'nac', effect: 'substrate', target: 'intracellular cysteine pool — rate-limiting for GSH synthesis', note: 'N-acetylcysteine deacetylates to cysteine, the rate-limiting precursor for γ-glutamylcysteine + GSH (γ-glutamylcysteine synthetase reaction).' } },
  { pathway: 'folate_one_carbon', mod: { slug: 'pyridoxine', effect: 'cofactor', target: 'SHMT (serine ↔ glycine + 5,10-methylene-THF)', note: 'B6 (pyridoxine) converts to PLP, the cofactor for serine hydroxymethyltransferase — the enzyme that generates one-carbon units onto THF from serine.' } },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0, skipped = 0;
  for (const link of LINKS) {
    const p = bySlug.get(link.pathway);
    if (!p) { console.log(`[skip] pathway "${link.pathway}" not found`); skipped++; continue; }
    p.modulators = p.modulators ?? [];
    if (p.modulators.find(m => m.slug === link.mod.slug)) {
      console.log(`[skip] ${link.pathway} already has modulator ${link.mod.slug}`); skipped++; continue;
    }
    p.modulators.push(link.mod);
    added++;
    console.log(`[add ] ${link.pathway.padEnd(32)} ← ${link.mod.slug} (${link.mod.effect})`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nwave44: +${added} modulator links (${skipped} skipped).`);
}

main();
