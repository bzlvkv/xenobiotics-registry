/**
 * 2026-05-16-pathway-nt-receptor-citations-batch.ts
 *
 * Backfills refs[] on the 14 neurotransmitter-receptor + neuro-
 * pharmacology pathways which shipped with 0 refs. This is the
 * densest "citation buys reach" cluster — 209 in-library
 * modulators across these 14 pathways, so users tapping any
 * modulator from `/library/{slug}` will land on a pathway page
 * whose references no longer read as empty.
 *
 * Each PMID below was verified via NCBI E-utilities `esummary`
 * 2026-05-16 (title + first-author + journal + year confirmed
 * before applying). Pre-existing refs (none on this batch) are
 * merged + deduped via Set so re-runs are idempotent.
 *
 * Some pathways end at 1 ref. That's intentional: when a single
 * canonical Pharmacol Rev / Nat Rev Neurosci review owns the
 * field (Beaulieu+Gainetdinov 2011 for D1-D5; Traynelis 2010 for
 * glutamate receptors; Sills 2006 for gabapentinoid α2δ), adding
 * a thinner second ref dilutes the signal. The "cite only what
 * literature actually anchors" rule applies — overcitation is
 * worse than undercitation.
 *
 * Citations applied:
 *
 *   PMID:23040810 — Picciotto MR, Higley MJ, Mineur YS 2012 Neuron.
 *                   "Acetylcholine as a neuromodulator: cholinergic
 *                   signaling shapes nervous system function and
 *                   behavior"
 *                   Applies: acetylcholine_axis
 *   PMID:16530842 — Sarter M, Gehring WJ, Kozak R 2006 Brain Res Rev.
 *                   "More attention must be paid: the neurobiology
 *                   of attentional effort"
 *                   Applies: acetylcholine_axis
 *
 *   PMID:17216434 — Brodde OE 2007 Naunyn Schmiedebergs Arch
 *                   Pharmacol. Beta-adrenoceptor blocker treatment
 *                   + cardiac β-AR-Gs-AC system in chronic heart
 *                   failure
 *                   Applies: adrenergic_receptor_signaling
 *   PMID:15655520 — Bylund DB 2005 Br J Pharmacol.
 *                   "Alpha-2 adrenoceptor subtypes: are more better?"
 *                   Applies: adrenergic_receptor_signaling
 *
 *   PMID:26843645 — Lauterborn JC et al. 2016 J Neurosci.
 *                   "Chronic Ampakine Treatments Stimulate Dendritic
 *                   Growth and Promote Learning in Middle-Aged Rats"
 *                   Applies: ampa_kainate_glutamate_extension
 *   PMID:11978816 — Bowie D, Lange GD 2002 J Neurosci.
 *                   "Functional stoichiometry of glutamate receptor
 *                   desensitization"
 *                   Applies: ampa_kainate_glutamate_extension
 *
 *   PMID:21303898 — Beaulieu JM, Gainetdinov RR 2011 Pharmacol Rev.
 *                   "The physiology, signaling, and pharmacology of
 *                   dopamine receptors"
 *                   Applies: dopamine_receptor_signaling
 *                   (canonical D1-D5 review; sole ref by intent)
 *
 *   PMID:18760291 — Olsen RW, Sieghart W 2009 Neuropharmacology.
 *                   "GABA A receptors: subtypes provide diversity of
 *                   function and pharmacology"
 *                   Applies: gaba_a_receptor_signaling
 *   PMID:22921455 — Engin E, Liu J, Rudolph U 2012 Pharmacol Ther.
 *                   "α2-containing GABA(A) receptors: a target for
 *                   novel CNS disorder treatment strategies"
 *                   Applies: gaba_a_receptor_signaling
 *
 *   PMID:16376147 — Sills GJ 2006 Curr Opin Pharmacol.
 *                   "The mechanisms of action of gabapentin and
 *                   pregabalin"
 *                   Applies: gabapentinoid_alpha2delta_calcium
 *                   (canonical mechanism paper; sole ref by intent)
 *
 *   PMID:33989661 — Camilleri M 2021 Gastroenterology.
 *                   "New drugs on the horizon for functional and
 *                   motility gastrointestinal disorders"
 *                   Applies: gi_motility_secretion
 *
 *   PMID:25380696 — Walls AB et al. 2015 Neurochem Res.
 *                   "The glutamine-glutamate/GABA cycle: regional
 *                   production and metabolic interference effects"
 *                   Applies: glutamate_glutamine_cycle
 *
 *   PMID:20716669 — Traynelis SF et al. 2010 Pharmacol Rev.
 *                   "Glutamate receptor ion channels: structure,
 *                   regulation, and function"
 *                   Applies: glutamate_receptor_pharmacology
 *                   (the canonical iGluR review; sole ref by intent)
 *
 *   PMID:17490952 — Maintz L, Novak N 2007 Am J Clin Nutr.
 *                   "Histamine and histamine intolerance"
 *                   Applies: histamine_axis
 *   PMID:21824648 — O'Mahony L, Akdis M, Akdis CA 2011
 *                   J Allergy Clin Immunol.
 *                   "Regulation of the immune response and
 *                   inflammation by histamine and histamine receptors"
 *                   Applies: histamine_axis
 *
 *   PMID:9311023  — Hill SJ et al. 1997 Pharmacol Rev.
 *                   "International Union of Pharmacology. XIII.
 *                   Classification of histamine receptors"
 *                   (IUPHAR canonical)
 *                   Applies: histamine_receptor_pharmacology
 *   PMID:22035879 — Simons FE, Simons KJ 2011 J Allergy Clin Immunol.
 *                   "Histamine and H1-antihistamines: celebrating a
 *                   century of progress"
 *                   Applies: histamine_receptor_pharmacology
 *
 *   PMID:11152760 — Williams JT, Christie MJ, Manzoni O 2001
 *                   Physiol Rev.
 *                   "Cellular and synaptic adaptations mediating
 *                   opioid dependence"
 *                   Applies: opioid_receptor_signaling
 *   PMID:30792513 — Volkow ND, Blanco C 2019 Nat Rev Neurol.
 *                   "The role of neurologists in tackling the opioid
 *                   epidemic"
 *                   Applies: opioid_receptor_signaling
 *
 *   PMID:26841800 — Nichols DE 2016 Pharmacol Rev. "Psychedelics"
 *                   Applies: serotonin_receptor_pharmacology
 *   PMID:10462127 — Barnes NM, Sharp T 1999 Neuropharmacology.
 *                   "A review of central 5-HT receptors and their
 *                   function"
 *                   Applies: serotonin_receptor_pharmacology
 *
 *   PMID:18425091 — Franks NP 2008 Nat Rev Neurosci.
 *                   "General anaesthesia: from molecular targets to
 *                   neuronal pathways of sleep and arousal"
 *                   Applies: volatile_anesthetic_gaba_glycine
 *   PMID:31147199 — Hemmings HC Jr et al. 2019 Trends Pharmacol Sci.
 *                   "Towards comprehensive understanding of
 *                   anesthetic mechanisms: a decade of discovery"
 *                   Applies: volatile_anesthetic_gaba_glycine
 *
 * Coverage delta: 14 NT-receptor pathways at 0 refs → 1-2 refs each.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface Pathway {
  slug: string;
  refs?: string[];
  [k: string]: unknown;
}

const NEW_REFS: Record<string, string[]> = {
  acetylcholine_axis: [
    'PMID:23040810',
    'PMID:16530842',
  ],
  adrenergic_receptor_signaling: [
    'PMID:17216434',
    'PMID:15655520',
  ],
  ampa_kainate_glutamate_extension: [
    'PMID:26843645',
    'PMID:11978816',
  ],
  dopamine_receptor_signaling: [
    'PMID:21303898',
  ],
  gaba_a_receptor_signaling: [
    'PMID:18760291',
    'PMID:22921455',
  ],
  gabapentinoid_alpha2delta_calcium: [
    'PMID:16376147',
  ],
  gi_motility_secretion: [
    'PMID:33989661',
  ],
  glutamate_glutamine_cycle: [
    'PMID:25380696',
  ],
  glutamate_receptor_pharmacology: [
    'PMID:20716669',
  ],
  histamine_axis: [
    'PMID:17490952',
    'PMID:21824648',
  ],
  histamine_receptor_pharmacology: [
    'PMID:9311023',
    'PMID:22035879',
  ],
  opioid_receptor_signaling: [
    'PMID:11152760',
    'PMID:30792513',
  ],
  serotonin_receptor_pharmacology: [
    'PMID:26841800',
    'PMID:10462127',
  ],
  volatile_anesthetic_gaba_glycine: [
    'PMID:18425091',
    'PMID:31147199',
  ],
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const summary: Array<{ slug: string; before: number; after: number }> = [];
  const missing: string[] = [];

  for (const [slug, newRefs] of Object.entries(NEW_REFS)) {
    const path = data.find(p => p.slug === slug);
    if (!path) {
      missing.push(slug);
      continue;
    }
    const before = (path.refs ?? []).length;
    const merged = Array.from(new Set([...(path.refs ?? []), ...newRefs]));
    path.refs = merged;
    summary.push({ slug, before, after: merged.length });
  }

  if (missing.length > 0) {
    console.error('FAIL — pathways not found in registry:');
    for (const s of missing) console.error('  -', s);
    process.exit(1);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated refs[] on ${summary.length} pathways:`);
  for (const r of summary) {
    console.log(`  ${r.slug.padEnd(40)}  refs: ${r.before} → ${r.after}`);
  }
}

main();
