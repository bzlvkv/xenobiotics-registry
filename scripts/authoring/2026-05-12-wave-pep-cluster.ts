/**
 * 2026-05-12-wave-pep-cluster.ts — Repair / Research peptides (PEP-1..4).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
interface PathwayModulator { slug: string; effect: Effect; target?: string; note?: string }
interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface Pathway {
  slug: string; name: string; category: string; systems: string[];
  description: string; steps: PathwayStep[]; modulators?: PathwayModulator[];
  refs?: string[]; recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'tissue_repair_peptides',
    name: 'Tissue repair peptides (BPC-157 / TB-500 / GHK-Cu / MGF)',
    category: 'signaling',
    systems: ['musculoskeletal', 'integumentary'],
    description: `Research peptides with claimed tissue-repair, anti-inflammatory, and angiogenic effects. Most are not FDA-approved but circulate in the supplement / research-chemical market with mechanism evidence from animal studies + small clinical trials. BPC-157 (Body Protection Compound, 15-aa) — gastric pentadecapeptide; animal-model evidence for tendon/ligament/bone healing + GI ulcer protection + angiogenesis via VEGFR2 + NO upregulation. TB-500 (synthetic thymosin β4 fragment) — actin-binding peptide; tendon repair claims; hair regrowth. GHK-Cu (copper tripeptide-1) — endogenous tri-peptide; copper-binding; skin/wound repair; collagen synthesis upregulation. Mechano growth factor (MGF) — IGF-1 Ec splice variant released by mechanically-stressed muscle; satellite-cell activator. PE22-28 — ADNP-derived fragment; neuroprotection claim.`,
    steps: [
      { from: 'injury-tissue-stress', to: 'repair-peptide-signaling', via: 'mechanisms include VEGF/NO + actin remodeling + collagen synthesis + satellite-cell activation' },
    ],
    modulators: [
      { slug: 'bpc-157', effect: 'activator', target: 'angiogenesis + VEGFR2 + NO (mechanism partial)', note: 'gastric pentadecapeptide; tendon/ligament/GI repair claims; not FDA-approved; oral + SC routes studied' },
      { slug: 'tb-500', effect: 'activator', target: 'actin sequestration + tissue migration', note: 'synthetic thymosin β4 fragment; tendon + dermal repair; SC; not FDA-approved' },
      { slug: 'ghk-cu', effect: 'activator', target: 'collagen synthesis + copper delivery', note: 'GHK-Cu; cosmetic + topical hair-loss + wound-healing; topical + injectable' },
      { slug: 'copper-tripeptide-1', effect: 'activator', target: 'identical to GHK-Cu (alternative slug)', note: 'naming overlap with ghk-cu — both refer to glycyl-histidyl-lysyl-copper' },
      { slug: 'pe22-28', effect: 'activator', target: 'ADNP-derived neuroprotection (research)', note: 'ADNP-fragment peptide; neuroprotection animal data; not human-approved' },
      { slug: 'thymosin-alpha-1', effect: 'activator', target: 'TLR9-mediated immune modulation (Tα1)', note: 'Zadaxin (FDA-orphan); immune modulation + adjunct in HBV/HCV + sepsis; SC' },
      { slug: 'collagen-peptides', effect: 'substrate', target: 'collagen amino-acid + di-/tri-peptide signaling', note: 'hydrolyzed collagen; food supplement; ~25-30% absorbed intact as di/tri-peptides (Pro-Hyp, hydroxyprolyl-glycine) that may signal to fibroblasts' },
      { slug: 'type-ii-collagen', effect: 'substrate', target: 'oral tolerance / collagen building blocks', note: 'undenatured type II collagen (UC-II); osteoarthritis joint health claim via oral tolerance to autoimmune-targeted collagen' },
    ],
    refs: [],
  },
  {
    slug: 'cognitive_peptide_axis',
    name: 'Cognitive peptide axis (semax / selank / cerebrolysin / epithalon)',
    category: 'signaling',
    systems: ['nervous'],
    description: `Russian + Eastern European neuro-peptide pharmacology developed largely separately from Western Rx pathways; few of these have FDA approval but several have Russian Pharmacopeia listings + intranasal Rx availability. Semax (ACTH-4-10 derivative — Met-Glu-His-Phe-Pro-Gly-Pro) — BDNF upregulation, MAO modulation; cognitive enhancement + stroke recovery Russian Rx. Selank (TFTGAS-Pro-Gly-Pro — tuftsin analog) — anxiolytic via GABA + 5-HT modulation; Russian Rx (intranasal). N-acetyl variants are stability-enhanced. Cerebrolysin — porcine brain-derived peptide mixture; vascular dementia + Alzheimer's Eastern European Rx; IV/IM. Pinealon (Epitalamin) + Epithalon + Vilon — Khavinson "bioregulator" peptides; longevity claims with limited Western validation. Dihexa — angiotensin-IV analog → HGF/c-Met activation → synaptogenesis claim (research-stage).`,
    steps: [
      { from: 'cognitive-peptide-intranasal', to: 'cns-bdnf-modulation', via: 'intranasal route bypasses BBB; mechanism: BDNF/NGF upregulation + monoamine modulation' },
    ],
    modulators: [
      { slug: 'semax', effect: 'activator', target: 'BDNF + MAO modulation (ACTH 4-10 fragment)', note: 'Russian Rx (intranasal); stroke recovery + cognitive enhancement; lacks Western FDA path' },
      { slug: 'selank', effect: 'activator', target: 'tuftsin + GABA + 5-HT (anxiolytic)', note: 'Russian Rx (intranasal); generalized anxiety; non-sedating anxiolysis profile' },
      { slug: 'n-acetyl-semax', effect: 'activator', target: 'stabilized semax analog', note: 'acetylated for stability; longer duration than parent semax' },
      { slug: 'n-acetyl-selank', effect: 'activator', target: 'stabilized selank analog', note: 'acetylated selank variant' },
      { slug: 'cerebrolysin', effect: 'activator', target: 'BDNF-mimetic peptide mixture (porcine brain-derived)', note: 'IV/IM Eastern European Rx; vascular dementia + Alzheimer\'s + stroke; mixture pharmacology' },
      { slug: 'pinealon', effect: 'activator', target: 'pineal/regulatory peptide (Khavinson)', note: 'tripeptide; longevity bioregulator; limited Western validation' },
      { slug: 'epithalon', effect: 'activator', target: 'telomerase activation (claimed)', note: 'epitalon; Khavinson tetrapeptide; anti-aging + telomere claims; SC' },
      { slug: 'epitalon', effect: 'activator', target: 'telomerase activation (claimed) — naming variant', note: 'duplicate slug for epithalon — name spelling variant; same compound' },
      { slug: 'vilon', effect: 'activator', target: 'immune/aging modulator (Khavinson dipeptide)', note: 'Lys-Glu dipeptide; Khavinson bioregulator series' },
      { slug: 'dihexa', effect: 'activator', target: 'HGF/c-Met → synaptogenesis (angiotensin-IV analog)', note: 'research nootropic; synapse-formation claim from rat studies; not human-validated' },
      { slug: 'dsip', effect: 'inhibitor', target: 'delta-sleep-inducing peptide (mechanism unclear)', note: 'nonapeptide; sleep induction + opioid-withdrawal claim; mechanism not specifically established' },
    ],
    refs: [],
  },
  {
    slug: 'mitochondrial_peptide_signaling',
    name: 'Mitochondrial-encoded peptide signaling (MOTS-c / SS-31 / humanin)',
    category: 'signaling',
    systems: ['musculoskeletal', 'endocrine'],
    description: `Mitochondrial-derived peptides (MDPs) are bioactive peptides encoded in mtDNA (within 12S/16S rRNA + the ND open reading frames). They function as cell signaling molecules in glucose homeostasis, apoptosis, and oxidative stress. MOTS-c (16-aa from mt-12S) — exercise mimetic; AMPK activator; declines with age; correlates with metabolic health. Humanin (24-aa from mt-16S) — antiapoptotic; receptor FPRL1/CNTFR/IL-27R. SHLP1-6 family (small humanin-like peptides) — same locus, different reading frames. SS-31 (Bendavia/elamipretide) — synthetic aromatic-cationic tetrapeptide targeting cardiolipin in inner mt membrane → preserves cristae structure under stress; phase 2 trials in primary mitochondrial myopathies + dry AMD + HF (mixed outcomes). Adropin — secreted peptide modulating insulin signaling; gut-liver-brain axis.`,
    steps: [
      { from: 'mitochondrial-stress', to: 'mdp-secretion', via: 'mtDNA encoded ORFs → translated peptides → cellular signaling beyond traditional nuclear DNA' },
    ],
    modulators: [
      { slug: 'mots-c', effect: 'activator', target: 'AMPK (exercise-mimetic from mt-12S)', note: 'glucose homeostasis + exercise tolerance + bone density signal; declines with age' },
      { slug: 'humanin', effect: 'inhibitor', target: 'apoptosis (FPRL1/STAT3-mediated)', note: '24-aa MDP; antiapoptotic; AD plaque neuroprotection claim; analog HNG ~1000× potency' },
      { slug: 'ss-31', effect: 'activator', target: 'cardiolipin (inner mt membrane stabilization)', note: 'elamipretide; phase 2 mitochondrial myopathies + dry AMD; aromatic-cationic tetrapeptide design' },
      { slug: 'adropin', effect: 'activator', target: 'GPR19 (proposed) + insulin sensitivity', note: 'liver + brain peptide; metabolic regulator; supplementation research-stage' },
    ],
    refs: [],
  },
  {
    slug: 'antimicrobial_cosmetic_peptides',
    name: 'Antimicrobial + cosmetic peptides',
    category: 'biosynthesis',
    systems: ['integumentary', 'immune-hematologic'],
    description: `Two functional categories. (1) Antimicrobial peptides (AMPs) — cathelicidin (LL-37) + defensins as innate immune effectors; pore formation in bacterial membranes; some research-stage as antibiotic adjuncts. KPV (lysine-proline-valine, α-MSH fragment) — anti-inflammatory peptide; topical IBD + dermatitis claim. Larazotide — zonulin antagonist; restores intestinal tight junctions; phase 3 celiac disease. (2) Cosmetic peptides — argireline (acetyl hexapeptide-3) is a SNAP-25 fragment that competitively inhibits SNARE complex → blunts muscle contraction → "topical Botox" mechanism (modest signal). Matrixyl (palmitoyl pentapeptide-4) → procollagen + hyaluronic acid synthesis upregulation. SNAP-8 / SNAP-29 — argireline analogs.`,
    steps: [
      { from: 'membrane-disruption-or-receptor-signal', to: 'antimicrobial-or-cosmetic-effect', via: 'AMPs disrupt bacterial membranes; cosmetic peptides modulate cellular signaling pathways' },
    ],
    modulators: [
      { slug: 'll-37', effect: 'inhibitor', target: 'bacterial membrane disruption + immune modulation', note: 'human cathelicidin; broad-spectrum AMP; psoriasis + rosacea pathophysiology contributor' },
      { slug: 'kpv', effect: 'inhibitor', target: 'NF-κB / α-MSH-fragment anti-inflammatory', note: 'C-terminal tripeptide of α-MSH; topical/oral anti-inflammatory; IBD + psoriasis research' },
      { slug: 'larazotide', effect: 'inhibitor', target: 'zonulin / tight-junction regulation', note: 'octapeptide; phase 3 celiac disease (CeDLara); restores intestinal tight junctions' },
      { slug: 'argireline', effect: 'inhibitor', target: 'SNAP-25 / SNARE complex', note: 'acetyl hexapeptide-3; topical "Botox-like" cosmetic; modest effect at supraphysiological concentrations' },
      { slug: 'matrixyl', effect: 'activator', target: 'fibroblast collagen synthesis', note: 'palmitoyl pentapeptide-4; cosmetic topical; procollagen + GAG production claims' },
      { slug: 'snap-8', effect: 'inhibitor', target: 'SNARE complex (argireline derivative)', note: 'acetyl octapeptide-3; modified argireline; cosmetic' },
      { slug: 'snap-29', effect: 'inhibitor', target: 'SNARE complex regulatory protein (research)', note: 'distinct from cosmetic SNAP peptides; SNARE-trafficking research molecule' },
      { slug: 'tbp-4', effect: 'activator', target: 'tubulin polymerization-related peptide (research)', note: 'research peptide; mechanism + indication not well established' },
      { slug: 'follistatin-344', effect: 'inhibitor', target: 'myostatin + activin', note: 'follistatin variant; muscle-growth claims via myostatin neutralization; research-stage' },
    ],
    refs: [],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p); added++;
    console.log(`  [add ] ${p.slug.padEnd(42)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nPEP cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
