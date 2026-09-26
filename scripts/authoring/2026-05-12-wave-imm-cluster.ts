/**
 * 2026-05-12-wave-imm-cluster.ts — Immune / Inflammation cluster (IMM-1..5).
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
    slug: 'cytokine_biologic_blockade',
    name: 'Cytokine pathway biologic blockade (TNF / IL-17 / IL-23 / IL-4-13 / IgE)',
    category: 'signaling',
    systems: ['immune-hematologic', 'integumentary'],
    description: `Therapeutic mAbs + fusion proteins target inflammatory cytokines + their receptors in autoimmune + atopic disease. TNF-α: etanercept (soluble TNF-R2-Fc), adalimumab, golimumab, certolizumab-pegol (Fab-PEG), infliximab — RA / IBD / psoriasis / AS. IL-17: secukinumab + ixekizumab (anti-IL-17A) — psoriasis / PsA / AS. IL-12/23: ustekinumab (shared p40) — psoriasis / IBD. IL-23: guselkumab + risankizumab (selective p19) — psoriasis. IL-4/13: dupilumab (IL-4Rα) — atopic dermatitis + asthma + nasal polyps + EoE. IgE: omalizumab — allergic asthma + chronic spontaneous urticaria. CGRP migraine biologics covered separately (IMM-2). Bone biologics covered in IMM-4.`,
    steps: [
      { from: 'cytokine-ligand', to: 'cytokine-receptor-activation', via: 'biologic blocks the ligand-receptor engagement → downstream JAK-STAT / NF-κB suppression' },
    ],
    modulators: [
      { slug: 'etanercept', effect: 'inhibitor', target: 'TNF-α (soluble TNF-R2-Fc decoy)', note: 'TNF-i; RA + AS + plaque psoriasis + PsA; SC; less effective in IBD vs antibody-class TNF-i (mechanism difference)' },
      { slug: 'certolizumab-pegol', effect: 'inhibitor', target: 'TNF-α (Fab-PEG, no Fc)', note: 'TNF-i; Fab fragment + PEGylation extends t½ without Fc-mediated effector functions; pregnancy-preferred (no placental Fc transfer)' },
      { slug: 'golimumab', effect: 'inhibitor', target: 'TNF-α (full IgG mAb)', note: 'TNF-i; once-monthly SC; RA + PsA + AS + UC' },
      { slug: 'secukinumab', effect: 'inhibitor', target: 'IL-17A', note: 'plaque psoriasis + PsA + AS; rapid + deep skin clearance vs TNF-i; mucocutaneous candida tail (on-target Th17 effect)' },
      { slug: 'ixekizumab', effect: 'inhibitor', target: 'IL-17A', note: 'plaque psoriasis + PsA + axSpA; comparable clinical efficacy to secukinumab' },
      { slug: 'ustekinumab', effect: 'inhibitor', target: 'IL-12 + IL-23 p40 subunit (shared)', note: 'psoriasis + PsA + IBD; targets shared p40 of IL-12 + IL-23; less specific than p19 agents' },
      { slug: 'guselkumab', effect: 'inhibitor', target: 'IL-23 p19 (selective)', note: 'plaque psoriasis + PsA; p19 selectivity spares IL-12/Th1 — preserved infection defense' },
      { slug: 'risankizumab', effect: 'inhibitor', target: 'IL-23 p19', note: 'plaque psoriasis + PsA + Crohn\'s; q8-12week SC' },
      { slug: 'dupilumab', effect: 'inhibitor', target: 'IL-4Rα (blocks IL-4 + IL-13)', note: 'atopic dermatitis + asthma (T2) + nasal polyps + EoE + prurigo nodularis; SC; conjunctivitis tail' },
      { slug: 'omalizumab', effect: 'inhibitor', target: 'IgE (free, in circulation)', note: 'allergic asthma + chronic spontaneous urticaria + nasal polyps; binds free IgE → downregulates FcεRI on mast cells' },
    ],
    refs: [],
  },
  {
    slug: 'cgrp_migraine_axis',
    name: 'CGRP axis (migraine prophylaxis + acute treatment)',
    category: 'signaling',
    systems: ['nervous', 'cardiovascular'],
    description: `Calcitonin gene-related peptide (CGRP) is a 37-aa neuropeptide released from trigeminal sensory afferents → vasodilation + neurogenic inflammation in the meningeal vasculature. Validated migraine target: CGRP elevation during migraine attack; IV CGRP triggers migraine in susceptible patients. Two therapeutic classes: (1) Small-molecule CGRP-R antagonists (gepants — rimegepant, ubrogepant, atogepant) for acute treatment + prophylaxis; (2) Biologics — anti-CGRP mAbs (fremanezumab, galcanezumab, eptinezumab) or anti-CGRP-R mAb (erenumab) for prevention. Triptans (sumatriptan, rizatriptan — covered in serotonin pathway) work upstream via 5-HT1B/1D agonism that reduces CGRP release; the two classes are complementary but mechanistically linked. Long-term CGRP blockade safety is being monitored (CGRP has physiologic vasodilator role in cardiac stress response).`,
    steps: [
      { from: 'trigeminal-sensory-afferent', to: 'cgrp-release', via: 'activation in meningeal sensory fibers → CGRP secretion → vasodilation + inflammation' },
      { from: 'cgrp-release', to: 'meningeal-vasodilation', via: 'CGRP-R on smooth muscle + perivascular nerves → vasodilation + pain transmission' },
    ],
    modulators: [
      { slug: 'rimegepant', effect: 'inhibitor', target: 'CGRP receptor', note: 'gepant; oral disintegrating tablet; both acute migraine (75 mg PRN) + preventive (75 mg every other day); CYP3A4 substrate' },
      { slug: 'ubrogepant', effect: 'inhibitor', target: 'CGRP receptor', note: 'gepant; oral acute migraine; CYP3A4 substrate (strong DDI with itraconazole/macrolides)' },
      { slug: 'erenumab', effect: 'inhibitor', target: 'CGRP receptor (mAb)', note: 'only CGRP-R-directed mAb (others target ligand); monthly SC; constipation signal' },
      { slug: 'fremanezumab', effect: 'inhibitor', target: 'CGRP ligand (mAb)', note: 'anti-CGRP mAb; monthly or quarterly SC; episodic + chronic migraine prevention' },
      { slug: 'galcanezumab', effect: 'inhibitor', target: 'CGRP ligand (mAb)', note: 'anti-CGRP mAb; monthly SC; also approved for cluster headache prevention (episodic)' },
    ],
    refs: [],
  },
  {
    slug: 'bone_remodeling_rank_rankl',
    name: 'Bone remodeling (RANK/RANKL/OPG + PTH/Wnt-sclerostin + bisphosphonates)',
    category: 'signaling',
    systems: ['musculoskeletal', 'endocrine'],
    description: `Bone remodeling balance: osteoclasts (resorption) + osteoblasts (formation). RANKL (from osteoblasts/osteocytes) → RANK on osteoclast precursors → osteoclast differentiation + activation; OPG (osteoprotegerin) is a soluble decoy that buffers RANKL. PTH increases bone turnover (continuous = catabolic; intermittent pulsatile = anabolic — the basis of teriparatide therapy). Sclerostin (from osteocytes) inhibits Wnt signaling → suppresses osteoblast activity; sclerostin-i (romosozumab) is anabolic. Bisphosphonates (alendronate, risedronate, ibandronate, zoledronate) are pyrophosphate analogs that bind hydroxyapatite + are taken up by resorbing osteoclasts → inhibit farnesyl-PP synthase (N-containing BPs) → apoptosis. Denosumab is an anti-RANKL mAb that blocks osteoclast differentiation. Calcitonin (older, weaker antiresorptive) acts at osteoclast calcitonin-R. Cross-link: calcium_phosphate_pth_axis.`,
    steps: [
      { from: 'rankl', to: 'osteoclast-activation', via: 'RANK on osteoclast precursors → NF-κB + NFATc1 → resorption' },
      { from: 'osteocyte-sclerostin', to: 'osteoblast-suppression', via: 'sclerostin inhibits Wnt/β-catenin in osteoblasts → reduced bone formation' },
      { from: 'intermittent-pth', to: 'osteoblast-activation', via: 'pulsatile PTH-R1 activation → anabolic bone formation (teriparatide mimics this)' },
    ],
    modulators: [
      { slug: 'denosumab', effect: 'inhibitor', target: 'RANKL (mAb)', note: 'osteoporosis + bone metastases; q6month SC; rebound vertebral fractures on discontinuation if not bridged to bisphosphonate' },
      { slug: 'teriparatide', effect: 'activator', target: 'PTH-R1 (recombinant PTH 1-34)', note: 'anabolic osteoporosis therapy; daily SC; 2-year lifetime cap (osteosarcoma signal in rats, not seen in humans)' },
      { slug: 'alendronate', effect: 'inhibitor', target: 'osteoclast farnesyl-PP synthase (N-bisphosphonate)', note: 'oral weekly bisphosphonate; PO F <1% — strict empty-stomach + upright 30 min; esophagitis risk' },
      { slug: 'risedronate', effect: 'inhibitor', target: 'osteoclast farnesyl-PP synthase', note: 'oral weekly or monthly bisphosphonate; similar PK constraints to alendronate' },
      { slug: 'ibandronate', effect: 'inhibitor', target: 'osteoclast farnesyl-PP synthase', note: 'monthly PO or quarterly IV bisphosphonate; vertebral fracture efficacy clearest' },
      { slug: 'zoledronate', effect: 'inhibitor', target: 'osteoclast farnesyl-PP synthase', note: 'IV annual or biannual bisphosphonate; flu-like reaction after first infusion (acute phase response); ONJ + atypical femur fracture signals' },
      { slug: 'calcitonin', effect: 'inhibitor', target: 'osteoclast calcitonin receptor', note: 'salmon calcitonin; intranasal/SC for osteoporosis + Paget; weak antiresorptive — superseded by bisphosphonates' },
    ],
    refs: [],
  },
  {
    slug: 'histamine_receptor_pharmacology',
    name: 'Histamine receptor pharmacology (H1 / H2 / H3 / H4)',
    category: 'signaling',
    systems: ['immune-hematologic', 'nervous'],
    description: `Histamine acts at four GPCRs: H1 (Gq, allergic + bronchoconstriction + CNS arousal — H1-i causes sedation), H2 (Gs, gastric acid — covered in GI-1), H3 (presynaptic autoreceptor in CNS), H4 (immune cells, chemotaxis). First-gen H1 blockers cross BBB → sedation (diphenhydramine, hydroxyzine, doxylamine, chlorpheniramine, brompheniramine, meclizine, dimenhydrinate, promethazine). Second-gen H1 blockers minimize BBB penetration → non-sedating (loratadine, cetirizine, desloratadine, fexofenadine, levocetirizine, ketotifen, olopatadine — last two also have mast-cell-stabilizer activity for ophthalmic use). Inverse agonism at H1 + strong anticholinergic side effects characterize the first-generation class. Cetirizine + levocetirizine retain mild BBB penetration → some sedation.`,
    steps: [
      { from: 'histamine', to: 'h1-mediated-allergic-symptoms', via: 'H1/Gq → smooth muscle contraction + endothelial permeability + sensory nerve activation → itch/sneezing/wheal' },
      { from: 'histamine', to: 'tmn-arousal', via: 'H1 on cortical + tuberomammillary nucleus → wakefulness; cross-link: orexin_arousal_axis' },
    ],
    modulators: [
      { slug: 'diphenhydramine', effect: 'inhibitor', target: 'H1 (1st-gen, CNS-penetrant)', note: 'OTC sedating antihistamine + OTC sleep aid + acute dystonia rescue; significant anticholinergic load; cognitive effects in elderly' },
      { slug: 'hydroxyzine', effect: 'inhibitor', target: 'H1 (1st-gen) + 5-HT2A', note: 'Vistaril/Atarax; allergic urticaria + anxiety (off-label) + procedural premed; QT prolongation' },
      { slug: 'doxylamine', effect: 'inhibitor', target: 'H1 (1st-gen)', note: 'OTC sleep aid (Unisom) + pregnancy nausea (Diclegis with B6)' },
      { slug: 'chlorpheniramine', effect: 'inhibitor', target: 'H1 (1st-gen)', note: 'older OTC; cold-formulation component' },
      { slug: 'brompheniramine', effect: 'inhibitor', target: 'H1 (1st-gen)', note: 'older OTC; cold-formulation component' },
      { slug: 'meclizine', effect: 'inhibitor', target: 'H1 + muscarinic', note: 'motion sickness + vertigo; lower sedation than dimenhydrinate' },
      { slug: 'dimenhydrinate', effect: 'inhibitor', target: 'H1 (1st-gen) + muscarinic', note: 'Dramamine; motion sickness; diphenhydramine + 8-chlorotheophylline salt' },
      { slug: 'promethazine', effect: 'inhibitor', target: 'H1 + D2 + muscarinic + α1', note: 'phenothiazine; antiemetic + sedation; tissue necrosis on accidental arterial injection (boxed warning); not in <2yo (apnea)' },
      { slug: 'loratadine', effect: 'inhibitor', target: 'H1 (2nd-gen, peripheral selective)', note: 'OTC non-sedating antihistamine; minimal sedation + minimal anticholinergic load' },
      { slug: 'desloratadine', effect: 'inhibitor', target: 'H1 (active metabolite of loratadine)', note: 'descarboethoxy-loratadine; once-daily; longer t½ than loratadine' },
      { slug: 'cetirizine', effect: 'inhibitor', target: 'H1 (2nd-gen)', note: 'OTC; some BBB penetration → mild sedation in some users; active metabolite of hydroxyzine' },
      { slug: 'fexofenadine', effect: 'inhibitor', target: 'H1 (2nd-gen, fully peripheral)', note: 'OTC; minimal CNS effects; P-gp substrate (grapefruit juice reduces absorption — opposite direction from CYP3A4 DDIs)' },
      { slug: 'ketotifen', effect: 'inhibitor', target: 'H1 + mast cell stabilizer', note: 'ophthalmic OTC for allergic conjunctivitis; oral form for asthma in some countries (not US)' },
      { slug: 'olopatadine', effect: 'inhibitor', target: 'H1 + mast cell stabilizer', note: 'ophthalmic + intranasal for allergic conjunctivitis + rhinitis' },
    ],
    refs: [],
  },
  {
    slug: 'mast_cell_leukotriene_axis',
    name: 'Mast cell stabilization + leukotriene axis',
    category: 'signaling',
    systems: ['immune-hematologic', 'respiratory'],
    description: `Mast cells release preformed (histamine, tryptase, heparin) + newly synthesized (LTC4, LTD4, LTE4, PGD2, TNF-α) mediators on IgE-FcεRI crosslinking. Cromolyn + nedocromil stabilize mast cells (mechanism debated — possibly Ca²⁺ channel modulation). Leukotrienes (5-LOX pathway from arachidonic acid — cross-link: arachidonic_acid_cascade): LTB4 = chemoattractant; LTC4/D4/E4 (cysteinyl-LTs) = bronchoconstriction + vascular permeability + mucus + airway remodeling. Therapeutic blockade: 5-LOX inhibitor zileuton (blocks LT synthesis); cysteinyl-LT1 receptor antagonists montelukast + zafirlukast (asthma + allergic rhinitis). PDE4-i (roflumilast, apremilast) reduce inflammatory mediator release via cAMP elevation.`,
    steps: [
      { from: 'mast-cell-igE-crosslinking', to: 'mediator-release', via: 'FcεRI → SYK → PLCγ → Ca²⁺ → degranulation + de novo LT/PG synthesis' },
      { from: 'arachidonic-acid', to: 'leukotrienes', via: '5-LOX → LTA4 → LTB4 (LTA4H) or LTC4 (LTC4S) → LTD4 → LTE4; cross-link: arachidonic_acid_cascade' },
    ],
    modulators: [
      { slug: 'cromolyn', effect: 'inhibitor', target: 'mast cell stabilizer (mechanism debated)', note: 'inhaled prophylactic for asthma + intranasal/ophthalmic for allergic rhinitis/conjunctivitis; minimal systemic absorption' },
      { slug: 'zileuton', effect: 'inhibitor', target: '5-lipoxygenase (LT biosynthesis)', note: 'asthma; blocks all downstream LTs; LFT monitoring; less used due to qid dosing + hepatotoxicity risk' },
      { slug: 'zafirlukast', effect: 'inhibitor', target: 'cysteinyl-LT1 receptor', note: 'leukotriene-receptor antagonist; asthma + allergic rhinitis; hepatotoxicity signal; modest efficacy vs ICS' },
      { slug: 'apremilast', effect: 'inhibitor', target: 'PDE4 (cAMP elevation → reduced TNF/IL-23)', note: 'oral; plaque psoriasis + PsA + oral ulcers of Behçet; nausea + weight loss + depression tail' },
      { slug: 'roflumilast', effect: 'inhibitor', target: 'PDE4', note: 'severe COPD with chronic bronchitis phenotype; weight loss + GI side effects limit tolerability' },
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
  console.log(`\nIMM cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
