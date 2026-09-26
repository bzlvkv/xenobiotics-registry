/**
 * 2026-05-16-pathway-catabolism-biosynthesis-citations-batch.ts
 *
 * 17 catabolism / biosynthesis / signaling / membrane / receptor /
 * transport pathways. Each PMID verified via NCBI E-utilities
 * `esummary` 2026-05-16 against pathway content.
 *
 *   PMID:20195903 — Houten SM, Wanders RJ 2010 J Inherit Metab Dis.
 *     "A general introduction to the biochemistry of mitochondrial
 *     fatty acid β-oxidation"
 *     Applies: beta_oxidation
 *   PMID:12543708 — Russell DW 2003 Annu Rev Biochem.
 *     "The enzymes, regulation, and genetics of bile acid synthesis"
 *     Applies: bile_acid_synthesis
 *   PMID:16365087 — Kimball SR, Jefferson LS 2006 J Nutr.
 *     "Signaling pathways and molecular mechanisms through which
 *     branched-chain amino acids mediate translational control of
 *     protein synthesis"
 *     Applies: bcaa_metabolism
 *   PMID:21746798 — Catterall WA 2011 Cold Spring Harb Perspect Biol.
 *     "Voltage-gated calcium channels"
 *     Applies: calcium_channel_modulation
 *   PMID:14654832 — Clapham DE 2003 Nature. "TRP channels as cellular sensors"
 *     Applies: trp_channel_sensory_transduction
 *   PMID:16968947 — Pacher P, Bátkai S, Kunos G 2006 Pharmacol Rev.
 *     "The endocannabinoid system as an emerging target of pharmacotherapy"
 *     Applies: endocannabinoid_system
 *   PMID:19847258 — Jackson SP, Bartek J 2009 Nature.
 *     "The DNA-damage response in human biology and disease"
 *     Applies: dna_damage_cytotoxic_response
 *   PMID:18006683 — Mizushima N 2007 Genes Dev. "Autophagy: process and function"
 *     Applies: autophagy_lc3_axis
 *   PMID:33199904 — Catterall WA et al. 2020 Nat Chem Biol.
 *     "The conformational cycle of a prototypical voltage-gated sodium channel"
 *     Applies: voltage_gated_sodium_channels
 *   PMID:21149445 — Oakley RH, Cidlowski JA 2011 J Biol Chem.
 *     "Cellular processing of the glucocorticoid receptor gene and protein"
 *     Applies: glucocorticoid_receptor_signaling
 *   PMID:17132853 — Germain P et al. 2006 Pharmacol Rev.
 *     "International Union of Pharmacology. LXIII. Retinoid X receptors"
 *     Applies: retinoic_acid_rar_rxr_signaling
 *   PMID:14564313 — Yokoyama M et al. 2003 Am Heart J. JELIS — EPA
 *     and cardiovascular events in Japanese hypercholesterolemia.
 *     Applies: omega_fatty_acid_metabolism
 *   PMID:22642880 — Häberle J et al. 2012 Orphanet J Rare Dis.
 *     "Suggested guidelines for the diagnosis and management of
 *     urea cycle disorders"
 *     Applies: urea_cycle
 *   PMID:17299454 — Sakurai T 2007 Nat Rev Neurosci.
 *     "The neural circuit of orexin (hypocretin): maintaining sleep
 *     and wakefulness"
 *     Applies: orexin_arousal_axis
 *   PMID:28787289 — Schubert ML 2017 Curr Opin Gastroenterol.
 *     "Physiologic, pathophysiologic, and pharmacologic regulation
 *     of gastric acid secretion"
 *     Applies: gastric_acid_secretion
 *   PMID:14685250 — Goldberg AL 2003 Nature. "Protein degradation
 *     and protection against misfolded or damaged proteins"
 *     Applies: ubiquitin_proteasome
 *   PMID:28841266 — Frigeni M et al. 2017 Hum Mutat. "Functional and
 *     molecular studies in primary carnitine deficiency"
 *     Applies: carnitine_shuttle
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway { slug: string; refs?: string[]; [k: string]: unknown }

const NEW_REFS: Record<string, string[]> = {
  beta_oxidation: ['PMID:20195903'],
  bile_acid_synthesis: ['PMID:12543708'],
  bcaa_metabolism: ['PMID:16365087'],
  calcium_channel_modulation: ['PMID:21746798'],
  trp_channel_sensory_transduction: ['PMID:14654832'],
  endocannabinoid_system: ['PMID:16968947'],
  dna_damage_cytotoxic_response: ['PMID:19847258'],
  autophagy_lc3_axis: ['PMID:18006683'],
  voltage_gated_sodium_channels: ['PMID:33199904'],
  glucocorticoid_receptor_signaling: ['PMID:21149445'],
  retinoic_acid_rar_rxr_signaling: ['PMID:17132853'],
  omega_fatty_acid_metabolism: ['PMID:14564313'],
  urea_cycle: ['PMID:22642880'],
  orexin_arousal_axis: ['PMID:17299454'],
  gastric_acid_secretion: ['PMID:28787289'],
  ubiquitin_proteasome: ['PMID:14685250'],
  carnitine_shuttle: ['PMID:28841266'],
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
