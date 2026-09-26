/**
 * 2026-05-12-wave-cns-cluster.ts — CNS cluster (CNS-1..6).
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
    slug: 'glutamate_receptor_pharmacology',
    name: 'Glutamate receptor pharmacology (NMDA / AMPA / kainate / mGlu)',
    category: 'signaling',
    systems: ['nervous'],
    description: `Glutamate is the major excitatory neurotransmitter. Ionotropic receptors: NMDA (Mg²⁺-blocked at rest, Ca²⁺-permeable on coincident depolarization + glutamate binding — Hebbian "coincidence detector" for LTP), AMPA (fast Na⁺/K⁺ current, primary EPSP carrier), kainate (presynaptic modulation + epileptogenesis). Metabotropic mGlu (Gq or Gi) modulate. Therapeutic targets: NMDA antagonists for depression (ketamine, esketamine — rapid antidepressant via glutamate-burst/BDNF mechanism), Alzheimer's (memantine — moderate-affinity uncompetitive NMDA blocker), and dextromethorphan (low-affinity NMDA antagonist + sigma-1 — DXM/quinidine combo for pseudobulbar affect). ALS: riluzole reduces presynaptic glutamate release + blocks Na⁺ channels. AMPA negative allosteric: perampanel for partial-onset epilepsy. Phencyclidine + ketamine share the NMDA-channel-pore binding site (dissociative phenotype). Glycine + D-serine are NMDA co-agonists at the glycine-B site.`,
    steps: [
      { from: 'glutamate', to: 'ampa-fast-epsp', via: 'AMPA-R Na⁺/K⁺ current — primary fast excitation' },
      { from: 'glutamate', to: 'nmda-ca-influx', via: 'NMDA-R Ca²⁺ influx requires coincident depolarization (Mg²⁺ block release) — LTP signal' },
    ],
    modulators: [
      { slug: 'ketamine', effect: 'inhibitor', target: 'NMDA channel pore (uncompetitive)', note: 'IV/IM dissociative anesthetic; rapid antidepressant (single sub-anesthetic infusion → days of effect); ketamine + analog psychiatric use surging' },
      { slug: 'esketamine', effect: 'inhibitor', target: 'NMDA channel pore (S-enantiomer of ketamine)', note: 'intranasal Spravato; treatment-resistant depression + acute suicidality; REMS program (in-clinic observation)' },
      { slug: 'memantine', effect: 'inhibitor', target: 'NMDA channel pore (moderate affinity, uncompetitive)', note: 'Alzheimer\'s moderate-severe; binds when channel is over-activated → spares physiological transmission; well-tolerated' },
      { slug: 'riluzole', effect: 'inhibitor', target: 'presynaptic glutamate release + Na+ channel block', note: 'ALS; modest survival benefit (~3 months); CYP1A2 substrate (caffeine-rich diet may alter exposure)' },
      { slug: 'perampanel', effect: 'inhibitor', target: 'AMPA receptor (selective non-competitive)', note: 'partial-onset seizures + primary generalized tonic-clonic; psychiatric tail (aggression/depression) — boxed warning' },
      { slug: 'dextromethorphan', effect: 'inhibitor', target: 'NMDA (low-affinity) + sigma-1', note: 'cough suppressant + pseudobulbar affect (with quinidine as DMQ); CYP2D6 substrate (PMs 150× AUC); MDMA-like effects at high doses' },
    ],
    refs: [],
  },
  {
    slug: 'voltage_gated_sodium_channels',
    name: 'Voltage-gated sodium channels (Nav1.x) — anticonvulsants + local anesthetics',
    category: 'signaling',
    systems: ['nervous'],
    description: `Nav1.x voltage-gated Na+ channels generate the action-potential upstroke. Pharmacology blocks the channel in its open or inactivated state, preferentially silencing rapidly-firing neurons (use-dependent block). Anticonvulsants (phenytoin, carbamazepine, oxcarbazepine, eslicarbazepine, lamotrigine, lacosamide, zonisamide) raise the seizure threshold by slowing recovery from inactivation. Local anesthetics (lidocaine, bupivacaine, ropivacaine, articaine, mepivacaine) achieve regional sensory block by depolarization-induced channel binding from inside the membrane; cardiotoxicity is dose-dependent (bupivacaine highest — racemic mix risk, levobupivacaine + ropivacaine were developed to reduce CV risk). Topical surface anesthetics (benzocaine, pramoxine) have the same fundamental MOA but stay extracellular. Methemoglobinemia is a benzocaine + prilocaine specific risk.`,
    steps: [
      { from: 'membrane-depolarization', to: 'na-channel-opening', via: 'Nav1.x activation → AP upstroke' },
      { from: 'na-channel-opening', to: 'na-channel-inactivation', via: 'fast inactivation (h-gate) closes the channel within 1 ms — anticonvulsants stabilize this state' },
    ],
    modulators: [
      { slug: 'phenytoin', effect: 'inhibitor', target: 'Nav1.x (inactivation-state stabilizer)', note: 'classic anticonvulsant; saturable MM elimination (cross-link: mm-elim pathway); strong CYP3A4 inducer + 2C9 substrate; narrow therapeutic index' },
      { slug: 'carbamazepine', effect: 'inhibitor', target: 'Nav1.x', note: 'epilepsy + trigeminal neuralgia + bipolar; potent CYP3A4 + UGT inducer (DDI hot spot); SJS HLA-B*1502 screening in Asian ancestry' },
      { slug: 'oxcarbazepine', effect: 'inhibitor', target: 'Nav1.x (prodrug → 10-hydroxy metabolite)', note: 'carbamazepine analog; less CYP3A4 induction but still significant; hyponatremia signal' },
      { slug: 'eslicarbazepine', effect: 'inhibitor', target: 'Nav1.x (S-licarbazepine, the active species)', note: 'carbamazepine descendant; once-daily; further reduced inducer activity vs oxcarbazepine' },
      { slug: 'lacosamide', effect: 'inhibitor', target: 'Nav1.x (slow-inactivation enhancer — distinct mechanism)', note: 'partial-onset seizures + diabetic neuropathy; PR-interval prolongation' },
      { slug: 'lamotrigine', effect: 'inhibitor', target: 'Nav1.x + glutamate release inhibition', note: 'broad-spectrum anticonvulsant + bipolar (depressive phase); SJS risk requires slow titration; VPA + LTG combo doubles SJS risk + AUC' },
      { slug: 'zonisamide', effect: 'inhibitor', target: 'Nav1.x + T-type Ca²⁺ + carbonic anhydrase', note: 'multi-target anticonvulsant; sulfonamide allergy contraindication; weight-loss signal (off-label obesity adjunct)' },
      { slug: 'lidocaine', effect: 'inhibitor', target: 'Nav1.x (local anesthetic)', note: 'workhorse local anesthetic + class IB antiarrhythmic; cross-link: cardiac_action_potential' },
      { slug: 'bupivacaine', effect: 'inhibitor', target: 'Nav1.x (long-acting amide LA)', note: 'long-acting; spinal/epidural + nerve block; cardiotoxic at accidental IV injection (rescue: 20% lipid emulsion)' },
      { slug: 'ropivacaine', effect: 'inhibitor', target: 'Nav1.x (S-enantiomer of bupivacaine analog)', note: 'less cardiotoxic than bupivacaine; sensorimotor differential (more sensory at low concentrations)' },
      { slug: 'articaine', effect: 'inhibitor', target: 'Nav1.x', note: 'dental local anesthetic; thiophene ring + ester side chain; partial ester hydrolysis → shorter systemic half-life' },
      { slug: 'mepivacaine', effect: 'inhibitor', target: 'Nav1.x (amide LA)', note: 'intermediate-acting amide LA; obstetric anesthesia avoided historically (placental transfer)' },
      { slug: 'benzocaine', effect: 'inhibitor', target: 'Nav1.x (topical ester LA)', note: 'topical OTC; methemoglobinemia risk in infants/young children + on mucosal surfaces' },
      { slug: 'pramoxine', effect: 'inhibitor', target: 'Nav1.x (topical, not ester/amide class)', note: 'topical surface anesthetic; less allergenic than benzocaine; hemorrhoid + minor cuts/burns' },
    ],
    refs: [],
  },
  {
    slug: 'gabapentinoid_alpha2delta_calcium',
    name: 'Gabapentinoid α2δ-1 + topiramate + levetiracetam-SV2A',
    category: 'signaling',
    systems: ['nervous'],
    description: `Anticonvulsants that don't fit the classic Na+ channel or GABA-A pattern. Gabapentin + pregabalin bind α2δ-1 auxiliary subunit of voltage-gated Ca²⁺ channels → reduce neurotransmitter release at presynaptic terminals (covered in calcium_channel_modulation as well). Topiramate has multiple actions: Na+ channel block + GABA-A enhancement + AMPA inhibition + carbonic anhydrase inhibition — partly explains its broad anticonvulsant + migraine + weight-loss profile. Zonisamide has a similar broad-target profile. Levetiracetam binds SV2A (synaptic vesicle glycoprotein 2A) → modulates presynaptic vesicle release; novel mechanism, clean DDI profile. Brivaracetam is a higher-affinity SV2A ligand. Ethosuximide blocks thalamic T-type Ca²⁺ — covered in calcium_channel_modulation; absence-seizure specific. Rufinamide for Lennox-Gastaut.`,
    steps: [
      { from: 'presynaptic-vesicle-pool', to: 'neurotransmitter-release', via: 'SV2A scaffolds vesicle release; levetiracetam family target' },
    ],
    modulators: [
      { slug: 'topiramate', effect: 'inhibitor', target: 'Na+ channels + GABA-A enhancer + AMPA + carbonic anhydrase', note: 'multi-target anticonvulsant; migraine prophylaxis + binge eating + weight loss; "dopamax" cognitive slowing; nephrolithiasis risk' },
      { slug: 'levetiracetam', effect: 'inhibitor', target: 'SV2A (presynaptic vesicle protein)', note: 'broad-spectrum AED + status epilepticus IV; clean DDI profile (renally cleared); psychiatric tail (irritability/depression)' },
      { slug: 'brivaracetam', effect: 'inhibitor', target: 'SV2A (higher affinity than levetiracetam)', note: 'levetiracetam-class second-gen; partial-onset seizures; better tolerability for some patients' },
      { slug: 'rufinamide', effect: 'inhibitor', target: 'Na+ channel inactivation prolonger', note: 'Lennox-Gastaut syndrome adjunct; rare orphan-drug use' },
    ],
    refs: [],
  },
  {
    slug: 'neuromuscular_junction_blockade',
    name: 'Neuromuscular junction blockade + reversal',
    category: 'signaling',
    systems: ['musculoskeletal', 'nervous'],
    description: `Neuromuscular blockers paralyze skeletal muscle for surgical anesthesia + ICU + ECT. Depolarizing blockers (succinylcholine) are nAChR agonists that bind + persist → continuous depolarization → fasciculations then flaccid paralysis (cannot be repolarized); cleared by plasma cholinesterase (pseudocholinesterase deficiency → prolonged paralysis); malignant hyperthermia trigger in RYR1-susceptible patients (cross-trigger with volatile anesthetics). Non-depolarizing blockers (rocuronium, vecuronium, atracurium) are competitive nAChR antagonists; reversed by sugammadex (γ-cyclodextrin selective for rocuronium/vecuronium) or AChE inhibitors (neostigmine — must co-administer glycopyrrolate for muscarinic side effects). Atracurium clears by Hofmann elimination (organ-independent); rocuronium hepatic; vecuronium renal.`,
    steps: [
      { from: 'acetylcholine-release-at-nmj', to: 'muscle-fiber-action-potential', via: 'nAChR (α1β1δε pentameric) Na+/K+ permeable channel at endplate' },
    ],
    modulators: [
      { slug: 'succinylcholine', effect: 'activator', target: 'nAChR (depolarizing — persistent activation)', note: 'rapid-onset depolarizing block (60 sec); RSI workhorse; MH trigger; pseudocholinesterase deficiency → prolonged paralysis' },
      { slug: 'rocuronium', effect: 'inhibitor', target: 'nAChR (non-depolarizing competitive antagonist)', note: 'fast-onset alternative to succinylcholine for RSI; reversible by sugammadex' },
      { slug: 'vecuronium', effect: 'inhibitor', target: 'nAChR (non-depolarizing)', note: 'intermediate-duration; reversible by sugammadex; ICU paralysis use' },
      { slug: 'atracurium', effect: 'inhibitor', target: 'nAChR (non-depolarizing)', note: 'Hofmann elimination — independent of hepatic/renal function; safe in organ-failure ICU patients' },
    ],
    refs: [],
  },
  {
    slug: 'volatile_anesthetic_gaba_glycine',
    name: 'Volatile anesthetic action (GABA-A / glycine / TASK-K2P / NMDA)',
    category: 'signaling',
    systems: ['nervous'],
    description: `Inhaled anesthetics produce reversible loss of consciousness through diffuse + low-affinity binding at multiple targets: GABA-A potentiation (sedation/hypnosis), glycine-receptor potentiation (spinal immobility), background K⁺ leak channels (TASK/TREK — neuronal hyperpolarization), and NMDA inhibition for some agents (xenon, nitrous oxide). MAC (minimum alveolar concentration) is the standardized potency measure. Sevoflurane + isoflurane + desflurane are halogenated ethers with different blood-gas solubilities (lower = faster on/off); sevoflurane is preferred for inhalational induction in children due to non-pungent odor. Volatile anesthetics + succinylcholine + RYR1 polymorphism are the MH-trigger triad; dantrolene is the antidote (releases the RYR1 calcium leak — cross-link: ros_oxidative_stress / dantrolene appears across multiple pathways).`,
    steps: [
      { from: 'alveolar-gas-phase', to: 'systemic-equilibration', via: 'low blood/gas partition coefficient → faster on/off; high lipid/blood partition → potent (MAC↓)' },
    ],
    modulators: [
      { slug: 'sevoflurane', effect: 'activator', target: 'GABA-A + glycine + TASK-1/3 K+ channels', note: 'preferred pediatric inhalational induction (low pungency); fluoride byproduct theoretical nephrotoxicity (not seen clinically)' },
      { slug: 'isoflurane', effect: 'activator', target: 'GABA-A + glycine + TASK channels', note: 'workhorse ICU sedation + OR maintenance; pungent odor → not for mask induction; vasodilator' },
    ],
    refs: [],
  },
  {
    slug: 'trp_channel_sensory_transduction',
    name: 'TRP channel sensory transduction (TRPV1 / TRPM8 / TRPA1)',
    category: 'signaling',
    systems: ['nervous', 'integumentary'],
    description: `Transient receptor potential (TRP) channels are polymodal cation channels on primary sensory afferents (nociceptors + thermoreceptors). TRPV1 — capsaicin + heat (>43°C) + low pH; activation produces burning pain; desensitization on chronic exposure underlies topical capsaicin pain therapy. TRPM8 — menthol + cool (<25°C); activation produces cooling sensation. TRPA1 — mustard oil, cinnamaldehyde, environmental irritants; coupled with TRPV1 in noxious sensing. Therapeutic exploitation: high-concentration topical capsaicin (8% patch — Qutenza) for postherpetic neuralgia → defunctionalizes TRPV1+ nociceptive fibers. Menthol provides counter-irritant analgesia. Camphor + eucalyptol + thymol are TRPM8/TRPV1 polymodal activators present in over-the-counter musculoskeletal/respiratory rubs.`,
    steps: [
      { from: 'noxious-or-thermal-stimulus', to: 'trp-channel-activation', via: 'agonist binding or thermal threshold crossing → Ca²⁺/Na⁺ influx → sensory afferent depolarization' },
    ],
    modulators: [
      { slug: 'capsaicin', effect: 'activator', target: 'TRPV1 (vanilloid receptor)', note: 'chili pepper alkaloid; topical desensitization for postherpetic neuralgia + diabetic neuropathy; brief initial burn precedes long defunctionalization' },
      { slug: 'menthol', effect: 'activator', target: 'TRPM8 (cool receptor)', note: 'topical counter-irritant + cooling; throat lozenges + decongestant rubs + OTC analgesic creams' },
      { slug: 'camphor', effect: 'activator', target: 'TRPV1 + TRPV3 + TRPM8 (polymodal)', note: 'topical rubefacient; OTC cold-rubs (Vicks); ingestion toxicity in pediatric exposures' },
      { slug: 'eucalyptol', effect: 'activator', target: 'TRPM8 + TRPA1', note: '1,8-cineole; eucalyptus oil major component; topical/inhaled decongestant + cool sensation' },
      { slug: 'thymol', effect: 'activator', target: 'TRPA1 + TRPV3', note: 'phenolic terpenoid (thyme/oregano); antimicrobial + counter-irritant; Listerine component' },
    ],
    refs: [],
  },
];

// Modulator extensions to acetylcholine_axis (CNS-4)
const ACH_EXT = [
  { slug: 'scopolamine', effect: 'inhibitor' as const, target: 'muscarinic M1 (broad)', note: 'tropane alkaloid; transdermal motion-sickness; CNS-penetrant — useful in chemo-induced + post-op N/V' },
  { slug: 'oxybutynin', effect: 'inhibitor' as const, target: 'muscarinic M1/M3 (urinary)', note: 'overactive bladder; CNS side effects (cognitive dulling in elderly) limit chronic use — transdermal reduces them' },
  { slug: 'tolterodine', effect: 'inhibitor' as const, target: 'muscarinic M2/M3 (urinary)', note: 'overactive bladder; less CNS penetration than oxybutynin; CYP2D6 substrate' },
  { slug: 'dicyclomine', effect: 'inhibitor' as const, target: 'muscarinic M1/M3 (GI)', note: 'antispasmodic for IBS-D + functional bowel; centrally active' },
  { slug: 'orphenadrine', effect: 'inhibitor' as const, target: 'muscarinic M1 + NMDA antagonist', note: 'skeletal muscle relaxant; anticholinergic side effect tail' },
  { slug: 'ipratropium', effect: 'inhibitor' as const, target: 'muscarinic M3 (bronchial)', note: 'short-acting muscarinic antagonist (SAMA); inhaled — minimal systemic anticholinergic load; COPD' },
  { slug: 'tiotropium', effect: 'inhibitor' as const, target: 'muscarinic M3 (bronchial, long-acting)', note: 'LAMA; once-daily COPD maintenance; kinetic selectivity (slower M3 dissociation vs M2)' },
  { slug: 'aclidinium', effect: 'inhibitor' as const, target: 'muscarinic M3 (bronchial)', note: 'LAMA; twice-daily COPD; faster plasma hydrolysis → lower systemic exposure' },
  { slug: 'umeclidinium', effect: 'inhibitor' as const, target: 'muscarinic M3', note: 'once-daily LAMA; component of Trelegy (ICS/LABA/LAMA triple)' },
  { slug: 'galantamine', effect: 'inhibitor' as const, target: 'AChE + nAChR positive allosteric modulator', note: 'Alzheimer\'s dual-action AChE-i + nicotinic enhancer; CYP2D6 + CYP3A4 substrate' },
  { slug: 'rivastigmine', effect: 'inhibitor' as const, target: 'AChE + BuChE (dual)', note: 'Alzheimer\'s + Parkinson\'s dementia; pseudo-irreversible (carbamate); transdermal patch reduces GI side effects' },
  { slug: 'huperzine-a', effect: 'inhibitor' as const, target: 'AChE (selective reversible)', note: 'Lycopodium alkaloid; nootropic + Alzheimer\'s (off-label) supplement; sold OTC despite Rx-grade pharmacology' },
  { slug: 'tacrine', effect: 'inhibitor' as const, target: 'AChE', note: 'first Alzheimer\'s AChE-i (1993); withdrawn 2013 for hepatotoxicity; CYP1A2 substrate (cross-link: caffeine_demethylation, fluvoxamine DDI Wave 2a v1.1)' },
  { slug: 'varenicline', effect: 'activator' as const, target: 'α4β2 nicotinic (partial agonist)', note: 'smoking cessation; reduces nicotine reward + craving; neuropsychiatric tail historically (FDA boxed warning removed 2016)' },
  { slug: 'nicotine', effect: 'activator' as const, target: 'nicotinic acetylcholine receptors (full agonist)', note: 'tobacco alkaloid + smoking cessation gum/patch; CYP1A2 substrate (smoking induces own clearance)' },
  { slug: 'dexmedetomidine', effect: 'activator' as const, target: 'α2-adrenergic (NOT muscarinic — sedation via locus coeruleus disinhibition)', note: 'ICU + procedural sedation; preserves respiration; rebound HTN on abrupt discontinuation; cross-link: adrenergic_receptor_signaling' },
];

function addModulators(p: Pathway, items: PathwayModulator[]): number {
  p.modulators = p.modulators ?? [];
  const have = new Set(p.modulators.map(m => m.slug));
  let added = 0;
  for (const m of items) {
    if (have.has(m.slug)) continue;
    p.modulators.push(m); have.add(m.slug); added++;
  }
  return added;
}

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Pathway[];
  const bySlug = new Map(data.map(p => [p.slug, p]));
  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) { console.log(`  [skip] ${p.slug}`); continue; }
    data.push(p); bySlug.set(p.slug, p); added++;
    console.log(`  [add ] ${p.slug.padEnd(42)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  const ach = bySlug.get('acetylcholine_axis');
  if (ach) {
    const n = addModulators(ach, ACH_EXT);
    console.log(`  [ext ] acetylcholine_axis                       +${n} modulators (now ${ach.modulators!.length})`);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nCNS cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
