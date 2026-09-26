/**
 * 2026-05-16-pathway-tail-citations-batch.ts
 *
 * Tail-end batch: 5 lower-modulator-density pathways that still
 * had canonical primary-literature anchors worth citing. Each
 * PMID verified via NCBI E-utilities `esummary` 2026-05-16.
 *
 *   PMID:23170060 — Ripps H, Shen W 2012 Mol Vis.
 *     "Review: taurine: a 'very essential' amino acid"
 *     Applies: taurine_synthesis
 *   PMID:20704544 — Maines MD 2010 Curr Drug Targets.
 *     Biliverdin reductase and its fragments — heme-degradation
 *     signaling.
 *     Applies: heme_degradation_bilirubin
 *   PMID:25456139 — Mehrmohamadi M et al. 2014 Cell Rep.
 *     "Characterization of the usage of the serine metabolic
 *     network in human cancer" (Locasale lab — anchors
 *     serine/glycine/one-carbon flux)
 *     Applies: glycine_serine_threonine_metabolism
 *   PMID:21321146 — Ferrari S et al. 2011 Antimicrob Agents
 *     Chemother. Azole resistance in Candida glabrata — anchors
 *     the ergosterol-synthesis target the pathway describes.
 *     Applies: fungal_ergosterol_biosynthesis
 *   PMID:23614584 — Tang WH et al. 2013 N Engl J Med.
 *     "Intestinal microbial metabolism of phosphatidylcholine and
 *     cardiovascular risk" — landmark choline → TMAO →
 *     cardiovascular paper.
 *     Applies: choline_tmao_metabolism
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  taurine_synthesis: ['PMID:23170060'],
  heme_degradation_bilirubin: ['PMID:20704544'],
  glycine_serine_threonine_metabolism: ['PMID:25456139'],
  fungal_ergosterol_biosynthesis: ['PMID:21321146'],
  choline_tmao_metabolism: ['PMID:23614584'],
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const summary: Array<{ slug: string; before: number; after: number }> = [];
  const missing: string[] = [];
  for (const [slug, newRefs] of Object.entries(NEW_REFS)) {
    const path = data.find(p => p.slug === slug);
    if (!path) { missing.push(slug); continue; }
    const before = (path.refs ?? []).length;
    const merged = Array.from(new Set([...(path.refs ?? []), ...newRefs]));
    path.refs = merged;
    summary.push({ slug, before, after: merged.length });
  }
  if (missing.length > 0) {
    console.error('FAIL — pathways not found:'); for (const s of missing) console.error('  -', s);
    process.exit(1);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated refs[] on ${summary.length} pathways:`);
  for (const r of summary) console.log(`  ${r.slug.padEnd(40)}  refs: ${r.before} → ${r.after}`);
}
main();
