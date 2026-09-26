/**
 * Add beta_alanine_mrgprd_paresthesia pathway to registry.
 *
 * Prototype "phenomenon pathway" — explains the *observable user-felt
 * effect* of taking a compound (the β-alanine "tingle/itch") rather
 * than answering "how does this biological system work?" Structurally
 * a receptor_pharmacology pathway, but editorially distinct: short
 * chain, single observable terminal node, perpetrator compound as
 * the headline modulator with a structured per-modulator citation.
 *
 * Refs (verified via NCBI E-utilities esummary 2026-05-16):
 *   PMID:15037633 — Shinohara T et al. 2004. J Biol Chem 279:23559-64.
 *                   "Identification of a G protein-coupled receptor
 *                    specifically responsive to beta-alanine."
 *                   (Original Mrgpr/β-alanine identification.)
 *   PMID:23077038 — Liu Q et al. 2012. J Neurosci 32(42):14532-7.
 *                   "Mechanisms of itch evoked by β-alanine."
 *                   (Direct itch-mechanism study in DRG neurons + mice.)
 *   PMID:25636080 — Bellinger PM, Minahan CL. 2016. Eur J Sport Sci 16(1):88-95.
 *                   "Performance effects of acute β-alanine induced
 *                    paresthesia in competitive cyclists."
 *                   (Human paresthesia from supplementation.)
 *   PMID:26175657 — Trexler ET et al. 2015. J Int Soc Sports Nutr 12:30.
 *                   "International society of sports nutrition position
 *                    stand: Beta-Alanine."
 *                   (Supplementation context + dose-response on paresthesia.)
 *   PMID:29066740 — Dong P et al. 2017. Sci Rep 7(1):13869.
 *                   "TRPC3 Is Dispensable for β-Alanine Triggered Acute Itch."
 *                   (Discriminates downstream channel — TRPC3 ruled out.)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NEW_PATHWAY = {
  slug: 'beta_alanine_mrgprd_paresthesia',
  name: 'β-Alanine MrgprD paresthesia (the tingle)',
  category: 'receptor_pharmacology',
  systems: ['nervous'],
  domains: ['pain_analgesia'],
  description:
    "Explains the characteristic tingle/itch felt 10-20 min after a bolus dose of β-alanine — the most user-noticed and most-asked-about side effect of the supplement. β-alanine is a low-affinity but selective agonist of MrgprD (Mas-related G protein-coupled receptor D), a Gq-coupled GPCR expressed on a discrete subpopulation of non-peptidergic C-fiber sensory neurons that innervate skin (Shinohara 2004 identified the receptor; Liu 2012 mapped the itch circuit). Activation drives PLCβ → IP3 → intracellular Ca²⁺ release → depolarization → action potentials in MrgprD⁺ afferents, perceived centrally as paresthesia (tingle, prickle, mild itch) localized to face, scalp, neck, and back — the regions with the densest MrgprD⁺ innervation. The sensation is dose-dependent and saturable; slow-release / split-dose formulations blunt it by keeping plasma β-alanine below the activation threshold (Trexler 2015). Mechanism is histamine-independent — antihistamines don't blunt it — which is why it reads as 'tingle' rather than 'itch' to most users. Downstream channel discrimination: TRPC3 is dispensable (Dong 2017); the conducting current is more likely a calcium-activated chloride channel (TMEM16A/anoctamin-1) and TRPA1-dependent in the longer-tail neuropathic context. Bellinger 2016 shows paresthesia does not impair endurance-cycling performance — useful clinical reassurance.",
  steps: [
    {
      from: 'beta-alanine',
      to: 'MrgprD activation',
      via: 'low-affinity but selective agonism of Mas-related GPCR D on non-peptidergic C-fiber sensory neurons (DRG)',
      source_pmid: 'PMID:15037633',
    },
    {
      from: 'MrgprD activation',
      to: 'Gq → PLCβ signaling',
      via: 'GPCR-Gq coupling; PLCβ hydrolyzes PIP2 → IP3 + DAG',
      source_pmid: 'PMID:15037633',
    },
    {
      from: 'Gq → PLCβ signaling',
      to: 'IP3 → ER Ca²⁺ release',
      via: 'IP3 binds IP3R on ER → cytosolic Ca²⁺ rise; TRPC3 is dispensable as the downstream channel (Dong 2017)',
      source_pmid: 'PMID:29066740',
    },
    {
      from: 'IP3 → ER Ca²⁺ release',
      to: 'C-fiber depolarization (action potential)',
      via: 'Ca²⁺ activates anoctamin-1 (TMEM16A) Cl⁻ current + voltage-gated Na⁺ — primary afferent fires',
      source_pmid: 'PMID:23077038',
    },
    {
      from: 'C-fiber depolarization (action potential)',
      to: 'paresthesia (tingle / prickle / mild itch)',
      via: 'central perception of MrgprD⁺ afferent firing — face / scalp / neck / back; histamine-independent',
      source_pmid: 'PMID:25636080',
    },
  ],
  modulators: [
    {
      slug: 'beta-alanine',
      effect: 'substrate',
      target: 'MrgprD (Gq-coupled GPCR)',
      note: 'the perpetrator — bolus doses ≥0.8 g exceed activation threshold and trigger paresthesia in ~70% of users; slow-release or split dosing keeps plasma below threshold while preserving the muscle-carnosine effect',
      source_pmid: 'PMID:23077038',
    },
    {
      slug: 'carnosine',
      effect: 'substrate',
      target: 'MrgprD (weaker than free β-alanine)',
      note: 'carnosine (β-alanyl-L-histidine) is the storage form; some MrgprD activation but lower potency than free β-alanine — why dietary carnosine from meat does not trigger paresthesia',
    },
  ],
  refs: [
    'PMID:15037633',
    'PMID:23077038',
    'PMID:25636080',
    'PMID:26175657',
    'PMID:29066740',
  ],
};

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Array<{ slug: string }>;
  if (data.find((p) => p.slug === NEW_PATHWAY.slug)) {
    console.error(`ALREADY EXISTS: ${NEW_PATHWAY.slug}`);
    process.exit(1);
  }
  data.push(NEW_PATHWAY as never);
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ${NEW_PATHWAY.slug}; total pathways: ${data.length}; modulators: ${NEW_PATHWAY.modulators.length}`);
}

main();
