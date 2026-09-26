/**
 * 2026-05-15-pathway-receptor-depth.ts — 3 receptor-pharmacology
 * pathways for receptor families that weren't yet split out.
 *
 * Existing pathways already cover opioid, GABA-A, adrenergic, dopamine,
 * cannabinoid (endocannabinoid_system), TRP, histamine_receptor,
 * serotonin_receptor, mGluR. The genuine gaps are:
 *
 *   purinergic_p2x_p2y_signaling           — P2 (ATP/ADP); P1 adenosine
 *                                            already in adenosine_receptor_signaling
 *   nicotinic_ach_receptor_pharmacology    — pentameric ligand-gated;
 *                                            distinct from muscarinic
 *   muscarinic_receptor_subtypes           — M1–M5 GPCRs
 *
 * All modulator slugs verified in registry; refs verified via NCBI
 * E-utilities esummary 2026-05-15.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

type Effect = 'inhibitor' | 'activator' | 'substrate' | 'cofactor';
type Pathway = {
  slug: string;
  name: string;
  category: 'biosynthesis' | 'catabolism' | 'signaling' | 'transport' | 'endocrine_axis' | 'drug_metabolism';
  systems: string[];
  description: string;
  steps: Array<{ from: string; to: string; via: string }>;
  modulators: Array<{ slug: string; effect: Effect; target: string; note?: string }>;
  refs: string[];
};

const PATHWAYS: Pathway[] = [
  {
    slug: 'purinergic_p2x_p2y_signaling',
    name: 'Purinergic signaling (P2X / P2Y receptors)',
    category: 'signaling',
    systems: ['cardiovascular', 'nervous', 'immune-hematologic', 'digestive'],
    description: `Purinergic signaling — Burnstock's framework, vindicated over 50+ years — comprises ATP-binding P2 receptors and adenosine-binding P1 receptors. This pathway covers P2 (ATP / ADP / UTP / UDP). The adenosine P1 family lives in [[adenosine_receptor_signaling]]. P2 splits into: (1) P2X (ionotropic — ATP-gated trimeric cation channels P2X1–7, fast ms-scale Ca²⁺/Na⁺ influx; P2X7 is the slow pore-forming subtype on macrophages → NLRP3 inflammasome trigger, cross-link [[pyroptosis_gasdermin]]); (2) P2Y (metabotropic GPCRs — P2Y1/2/4/6/11/12/13/14; Gq/Gi/Gs coupling varies). Sources of extracellular nucleotides: regulated release (synaptic vesicles, taste cells, autocrine via Cx43 / pannexin-1 hemichannels), passive release (cell stress, ischemia, injury — ATP as DAMP). Hydrolysis cascade: ATP → ADP → AMP → adenosine via CD39 (ENTPD1) + CD73 (NT5E) ecto-enzymes — links P2 to P1. Therapeutic landscape — best-developed at platelet P2Y12: clopidogrel + prasugrel (irreversible prodrugs requiring CYP activation), ticagrelor (reversible), cangrelor (IV reversible) are antiplatelet mainstays for ACS, PCI, stent thrombosis prevention. P2X7 antagonists trialed for inflammatory disease — programs largely abandoned. IV adenosine for SVT (transient AV block) and pharmacologic stress imaging via P1. Suramin = non-selective P2 antagonist (historical anti-trypanosomal). Cross-links: [[platelet_aggregation]] (P2Y12 antiplatelet pharmacology), [[adenosine_receptor_signaling]] (P1 sister family), [[pyroptosis_gasdermin]] (P2X7 → NLRP3).`,
    steps: [
      { from: 'cellular ATP (regulated release or stress)', to: 'extracellular ATP / ADP / UTP / UDP', via: 'synaptic vesicles, pannexin-1 / Cx43 hemichannels, or passive release from damaged cells (DAMP)' },
      { from: 'extracellular ATP', to: 'P2X1–7 (ionotropic) Ca²⁺/Na⁺ influx', via: 'fast ms-scale channels; P2X7 is the slow pore-forming subtype' },
      { from: 'extracellular ATP / ADP / UTP / UDP', to: 'P2Y1/2/4/6/11/12/13/14 (metabotropic GPCRs)', via: 'Gq/Gi/Gs coupling differs by subtype; P2Y12 on platelets is Gi-coupled' },
      { from: 'ATP', to: 'ADP', via: 'CD39 (ENTPD1) ecto-nucleotidase — rate-limiting in many tissues' },
      { from: 'AMP', to: 'adenosine', via: 'CD73 (NT5E) — joins P2 + P1 systems (cross-link)' },
      { from: 'P2X7 sustained activation (macrophage)', to: 'NLRP3 inflammasome priming + pore formation', via: 'ATP as DAMP triggers IL-1β maturation; cross-link to pyroptosis' },
      { from: 'P2Y12 antagonist (Rx)', to: 'platelet aggregation inhibition', via: 'antiplatelet pharmacology — ACS / PCI / stent thrombosis prevention' },
    ],
    modulators: [
      { slug: 'clopidogrel',  effect: 'inhibitor', target: 'P2Y12 irreversible (CYP2C19 prodrug — *2/*3 poor metabolizers have reduced effect)' },
      { slug: 'prasugrel',    effect: 'inhibitor', target: 'P2Y12 irreversible (CYP3A4/2B6 activation; more consistent than clopidogrel)' },
      { slug: 'ticagrelor',   effect: 'inhibitor', target: 'P2Y12 reversible (direct-acting; faster onset)' },
      { slug: 'caffeine',     effect: 'inhibitor', target: 'P1 (adenosine) antagonist — indirect P2 system modulation' },
      { slug: 'theophylline', effect: 'inhibitor', target: 'P1 + PDE; indirect P2 effects' },
      { slug: 'adenosine',    effect: 'substrate', target: 'P1 (cross-link adenosine_receptor_signaling)' },
      { slug: 'dipyridamole', effect: 'activator', target: 'ENT1 inhibition → ↑extracellular adenosine → P1 activation' },
    ],
    refs: [
      'PMID:33444568',
      'PMID:15078211',
    ],
  },

  {
    slug: 'nicotinic_ach_receptor_pharmacology',
    name: 'Nicotinic ACh receptor pharmacology',
    category: 'signaling',
    systems: ['nervous', 'musculoskeletal', 'immune-hematologic'],
    description: `Nicotinic acetylcholine receptors (nAChRs) are pentameric ligand-gated cation channels — distinct from muscarinic ACh (Gq/Gi GPCRs, [[muscarinic_receptor_subtypes]]). Three major locations: (1) Neuromuscular junction (NMJ) — exclusively α1β1δε (adult) or α1β1δγ (fetal/denervated) muscle-type pentamers; succinylcholine, rocuronium, vecuronium, pancuronium, atracurium = NMJ-targeted neuromuscular blockers. (2) Autonomic ganglia — α3β4 (with α5 modulatory subunit); ganglionic blockers (historical: hexamethonium, trimethaphan) lost favor due to side-effect breadth. (3) CNS — α4β2 (dominant high-affinity nicotine binding; addiction + cognition target — varenicline partial agonist for smoking cessation) and α7 homopentamer (rapidly desensitizing; cognitive + cholinergic anti-inflammatory pathway via spleen vagal-nicotinic axis). Receptor states: closed → open (ms) → desensitized (s–min) → closed; chronic nicotine + α4β2-selective partial agonists drive desensitization → paradoxical functional block of fast-onset activation. Biased modulators: PAMs (galantamine on α7 and some α4β2) enhance ACh response without direct agonism. Neuromuscular blockade reversal: AChEi (neostigmine, edrophonium, pyridostigmine) restore ACh competition; sugammadex sequesters rocuronium/vecuronium directly. Smoking cessation: varenicline α4β2 partial agonist (Champix/Chantix); bupropion adjunct (DA/NE reuptake + nAChR antagonist). Cross-links: [[acetylcholine_axis]] (ACh synthesis + release upstream), [[neuromuscular_junction_blockade]] (clinical use).`,
    steps: [
      { from: 'ACh release at synaptic cleft', to: 'nAChR binding (2 ACh per pentamer required)', via: 'two non-equivalent α-subunit binding sites; cooperative activation' },
      { from: 'nAChR open state (ms)', to: 'Na⁺/Ca²⁺/K⁺ influx → depolarization', via: 'high cation permeability; α7 has highest Ca²⁺ fraction (signaling role)' },
      { from: 'sustained ACh / agonist exposure', to: 'desensitized state (slow recovery)', via: 'chronic nicotine drives this — paradoxical functional block' },
      { from: 'NMJ nAChR (α1β1δε)', to: 'end-plate depolarization → muscle contraction', via: 'AChE hydrolysis terminates signal; NMB drugs block here' },
      { from: 'α7 nAChR (CNS / immune)', to: 'cognitive + anti-inflammatory cholinergic pathway', via: 'vagal-spleen anti-inflammatory pathway; rapid desensitization characteristic' },
      { from: 'α4β2 nAChR (CNS)', to: 'nicotine reward circuit → addiction', via: 'mesolimbic DA release via VTA α4β2; varenicline partial agonist target' },
    ],
    modulators: [
      { slug: 'nicotine',         effect: 'activator', target: 'α4β2 + α7 (full agonist; rapid desensitization)' },
      { slug: 'varenicline',      effect: 'activator', target: 'α4β2 partial agonist + α7 full agonist', note: 'smoking cessation — reduces craving + withdrawal' },
      { slug: 'bupropion',        effect: 'inhibitor', target: 'nAChR (non-selective antagonist) + DA/NE reuptake', note: 'smoking-cessation Rx via dual mechanism' },
      { slug: 'galantamine',      effect: 'activator', target: 'α7 PAM + AChEi (Alzheimer Rx)' },
      { slug: 'pyridostigmine',   effect: 'activator', target: 'NMJ ACh prolongation (myasthenia gravis Rx)' },
      { slug: 'succinylcholine',  effect: 'activator', target: 'NMJ depolarizing blocker — Phase I depol → Phase II desensitization' },
      { slug: 'rocuronium',       effect: 'inhibitor', target: 'NMJ non-depolarizing blocker (intermediate-acting)' },
      { slug: 'vecuronium',       effect: 'inhibitor', target: 'NMJ non-depolarizing' },
      { slug: 'atracurium',       effect: 'inhibitor', target: 'NMJ non-depolarizing (Hofmann elimination — independent of renal/hepatic clearance)' },
    ],
    refs: [
      'PMID:30137518',
    ],
  },

  {
    slug: 'muscarinic_receptor_subtypes',
    name: 'Muscarinic ACh receptor subtypes (M1–M5)',
    category: 'signaling',
    systems: ['nervous', 'cardiovascular', 'digestive', 'respiratory'],
    description: `Muscarinic ACh receptors (mAChRs) are GPCRs — distinct from nicotinic ([[nicotinic_ach_receptor_pharmacology]]). Five subtypes with conserved Gq vs Gi coupling pattern: M1, M3, M5 → Gq → PLC → IP3 + DAG → Ca²⁺ mobilization (excitatory). M2, M4 → Gi → ↓cAMP + ↑GIRK K⁺ channels (inhibitory). Tissue distribution: M1 = CNS (cortex, hippocampus — cognitive function); M2 = cardiac (SA + AV node — bradycardia; vagal heart-rate slowing); M3 = smooth muscle (bronchial, GI, bladder, vascular endothelium NO release) + glands (salivary, lacrimal); M4 = CNS (striatum); M5 = CNS (VTA — implicated in addiction). Therapeutic challenges: most clinically-used "anticholinergics" lack subtype selectivity → broad side effects (dry mouth, blurred vision, urinary retention, constipation, cognitive impairment in elderly = "anticholinergic burden" — dementia association in long-term use). Subtype-targeted programs are difficult — orthosteric binding pocket is highly conserved. PAMs for M1 (xanomeline/trospium combo — KarXT, FDA-approved 2024 for schizophrenia) achieve selectivity via less-conserved allosteric sites. M3-selective inhaled bronchodilators (tiotropium, umeclidinium, aclidinium) minimize systemic load. Urinary M3 antagonists (oxybutynin, tolterodine, solifenacin, darifenacin, trospium, fesoterodine) for overactive bladder. M2-selective drugs not clinically used (cardiac vagal effect dangerous). Cross-links: [[acetylcholine_axis]] (ACh synthesis + AChE), [[autonomic_balance]] (parasympathetic output is M-receptor-mediated), [[bladder_detrusor_pharmacology]] (M3 urinary).`,
    steps: [
      { from: 'ACh release at parasympathetic terminal', to: 'muscarinic receptor binding (M1–M5)', via: 'all 5 subtypes bind ACh with similar orthosteric affinity; tissue + subtype determines effect' },
      { from: 'M1 / M3 / M5 (Gq)', to: 'PLC → IP3 + DAG → Ca²⁺ + PKC', via: 'excitatory; smooth-muscle contraction, glandular secretion, cortical excitation' },
      { from: 'M2 / M4 (Gi)', to: '↓cAMP + ↑GIRK K⁺ → hyperpolarization', via: 'inhibitory; cardiac bradycardia (M2 SA/AV node); striatal M4' },
      { from: 'M3 endothelial', to: 'eNOS → NO → vasodilation', via: 'paradoxical vasodilator effect of ACh in vivo (in vitro M3 = constriction)' },
      { from: 'M3 bronchial smooth muscle', to: 'bronchoconstriction', via: 'COPD / asthma anticholinergic target (tiotropium etc.)' },
      { from: 'M1 CNS (cortex / hippocampus)', to: 'cognitive function + memory', via: 'KarXT (xanomeline-trospium) leverages this for schizophrenia treatment' },
    ],
    modulators: [
      { slug: 'atropine',       effect: 'inhibitor', target: 'M1–M5 non-selective (acute — anticholinergic toxidrome reversal, ACLS bradycardia)' },
      { slug: 'scopolamine',    effect: 'inhibitor', target: 'M1–M5 non-selective (transdermal motion sickness; CNS-penetrant)' },
      { slug: 'ipratropium',    effect: 'inhibitor', target: 'M3-preferring (SAMA — inhaled COPD)' },
      { slug: 'tiotropium',     effect: 'inhibitor', target: 'M3-preferring (LAMA — once-daily; slow M3 dissociation kinetics)' },
      { slug: 'umeclidinium',   effect: 'inhibitor', target: 'M3 LAMA (Trelegy component)' },
      { slug: 'aclidinium',     effect: 'inhibitor', target: 'M3 LAMA' },
      { slug: 'oxybutynin',     effect: 'inhibitor', target: 'M3 (urinary; CNS side effects in elderly — high anticholinergic burden)' },
      { slug: 'tolterodine',    effect: 'inhibitor', target: 'M2/M3 (urinary; less CNS than oxybutynin)' },
      { slug: 'mirabegron',     effect: 'activator', target: 'β3-AR (alternative to mAChR for overactive bladder)' },
      { slug: 'dicyclomine',    effect: 'inhibitor', target: 'M1/M3 (IBS-D antispasmodic)' },
      { slug: 'orphenadrine',   effect: 'inhibitor', target: 'M1 + NMDA antagonist (skeletal muscle relaxant)' },
    ],
    refs: [
      'PMID:17073660',
    ],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const existing = new Set(data.map((p) => p.slug));
  let added = 0;
  let skipped = 0;
  for (const p of PATHWAYS) {
    if (existing.has(p.slug)) {
      console.log(`SKIP (already exists): ${p.slug}`);
      skipped++;
      continue;
    }
    data.push(p);
    added++;
    console.log(`ADD: ${p.slug} (${p.modulators.length} mods, ${p.refs.length} refs)`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nTotal pathways: ${data.length} (added ${added}, skipped ${skipped})`);
}

main();
