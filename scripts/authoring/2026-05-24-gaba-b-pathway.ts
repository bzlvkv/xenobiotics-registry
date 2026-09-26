/**
 * 2026-05-24-gaba-b-pathway.ts
 *
 * Authors gaba_b_receptor_signaling — the metabotropic (Gi/o) arm of
 * GABAergic inhibition, distinct from the ionotropic gaba_a pathway.
 * Created to give baclofen / phenibut / sodium-oxybate a proper home
 * (they previously appeared only in gaba_a / mglur as "GABA-B
 * contrast"). Per the cross-listing decision, those gaba_a entries are
 * LEFT in place; this adds the GABA-B pathway with them as primary
 * modulators pinned to the receptor-activation step.
 *
 * Science: obligate GABA-B1 (ligand) / GABA-B2 (G-protein) heterodimer
 * → Gαi/o; three effector arms — ↓adenylate cyclase (cAMP), presynaptic
 * Cav2.1/2.2 inhibition (↓release; auto/heteroreceptor), postsynaptic
 * GIRK/Kir3 (slow IPSP). Textbook neuropharmacology.
 *
 * Citations — all PMIDs verified via NCBI E-utilities esummary
 * 2026-05-24 (title/author/journal/year confirmed, raw JSON):
 *   PMID:15269338 — Bettler B et al. 2004 Physiol Rev.
 *     "Molecular structure and physiological functions of GABA(B) receptors"
 *   PMID:12037141 — Bowery NG et al. 2002 Pharmacol Rev.
 *     "IUPHAR XXXIII. Mammalian GABA(B) receptors: structure and function"
 *   PMID:22595784 — Gassmann M et al. 2012 Nat Rev Neurosci.
 *     "Regulation of neuronal GABA(B) receptor functions by subunit composition"
 *   PMID:20655485 — Pinard A et al. 2010 Adv Pharmacol.
 *     "GABAB receptors: physiological functions and mechanisms of diversity"
 *   PMID:8532848  — Misgeld U et al. 1995 Prog Neurobiol.
 *     "A physiological role for GABAB receptors and the effects of baclofen…"
 *
 * Idempotent; appends only if the slug is absent. Run once:
 *   tsx scripts/authoring/2026-05-24-gaba-b-pathway.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const SLUG = 'gaba_b_receptor_signaling';

const pathway = {
  slug: SLUG,
  name: 'GABA-B receptor signaling (metabotropic Gi/o)',
  category: 'receptor_pharmacology',
  systems: ['nervous'],
  domains: ['neuropsychiatric'],
  description:
    'GABA-B receptors are the metabotropic arm of GABAergic inhibition: obligate heterodimers of ' +
    'GABA-B1 (ligand-binding) and GABA-B2 (G-protein-coupling) subunits that signal through Gαi/o. ' +
    'Unlike the ionotropic GABA-A receptor (a ligand-gated Cl⁻ channel; see gaba_a_receptor_signaling), ' +
    'GABA-B produces slower, longer-lasting inhibition via two effector arms — presynaptic suppression ' +
    'of P/Q- and N-type Ca²⁺ channels that dampens neurotransmitter release (auto- and heteroreceptors), ' +
    'and postsynaptic activation of GIRK/Kir3 K⁺ channels that generates the slow IPSP — both reinforced ' +
    'by adenylate-cyclase inhibition that lowers cAMP/PKA tone. Clinically, the orthosteric agonist ' +
    'baclofen treats spasticity; phenibut and γ-hydroxybutyrate (sodium oxybate) are weaker/partial ' +
    'GABA-B agonists with additional targets. These ligands appear in gaba_a_receptor_signaling only as ' +
    'mechanistic contrast; this pathway is their primary home.',
  steps: [
    {
      from: 'gaba',
      to: 'gaba-b-receptor-activation',
      via: 'orthosteric GABA binding at the GABA-B1 Venus-flytrap domain; obligate B1/B2 heterodimer, B2 couples Gαi/o',
      source_pmid: 'PMID:15269338',
    },
    {
      from: 'gaba-b-receptor-activation',
      to: 'reduced-camp',
      via: 'Gαi/o → adenylate cyclase inhibition → ↓cAMP → ↓PKA tone',
    },
    {
      from: 'gaba-b-receptor-activation',
      to: 'reduced-neurotransmitter-release',
      via: 'Gβγ → inhibits presynaptic P/Q- and N-type Ca²⁺ channels → ↓vesicular release (auto/heteroreceptor)',
    },
    {
      from: 'gaba-b-receptor-activation',
      to: 'neuronal-hyperpolarization',
      via: 'Gβγ → GIRK/Kir3 K⁺ channel opening → slow IPSP → postsynaptic hyperpolarization',
    },
  ],
  modulators: [
    { slug: 'baclofen', effect: 'activator', target: 'GABA-B orthosteric agonist (antispasticity)', step: 0, source_pmid: 'PMID:8532848' },
    { slug: 'phenibut', effect: 'activator', target: 'GABA-B agonist + α2δ Ca channel', step: 0 },
    { slug: 'sodium-oxybate', effect: 'activator', target: 'GABA-B (weak/partial) + GHB-specific receptors', step: 0 },
    { slug: 'gaba', effect: 'substrate', target: 'GABA-B orthosteric agonist (endogenous)', step: 0 },
  ],
  refs: ['PMID:15269338', 'PMID:12037141', 'PMID:22595784', 'PMID:20655485', 'PMID:8532848'],
};

const data: Array<{ slug: string }> = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));
if (data.some(p => p.slug === SLUG)) {
  console.log(`${SLUG} already present — no change`);
} else {
  data.push(pathway as unknown as { slug: string });
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`appended ${SLUG} (${pathway.steps.length} steps, ${pathway.modulators.length} modulators, ${pathway.refs.length} refs)`);
}
