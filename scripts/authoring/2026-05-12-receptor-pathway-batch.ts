/**
 * 2026-05-12-receptor-pathway-batch.ts — v1.2 closure.
 *
 * Six receptor / receptor-family pathways that connect ~108 orphan
 * pharmacological compounds previously not surfaced in any pathway.
 * Each is high-traffic in the registry's drug catalog AND high-value
 * for the Today pathway-convergence tile (≥2 active intakes on the
 * same node lights up the band).
 *
 *   gaba_a_receptor_signaling            19 modulators
 *   serotonin_receptor_pharmacology      23 modulators
 *   adrenergic_receptor_signaling        22 modulators
 *   dopamine_receptor_signaling          16 modulators
 *   insulin_glucose_homeostasis          20 modulators
 *   orexin_arousal_axis                   8 modulators
 *
 * Authoring rules:
 *  - All modulator.slug values verified to exist in compounds.json.
 *  - effect is one of 'inhibitor' | 'activator' | 'substrate' |
 *    'cofactor' (Zod-validated enum). Antagonists / inverse agonists /
 *    blockers map to 'inhibitor'; agonists / partial agonists /
 *    releasers / positive allosterics map to 'activator'. The
 *    receptor-subtype + binding-mode nuance lives in `target`.
 *  - refs[] intentionally empty — these pathways are well-established
 *    in any pharmacology textbook; classic refs can land in a follow-up
 *    once PMIDs are verified one-by-one to keep the no-fabrication
 *    discipline tight.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface PathwayModulator { slug: string; effect: 'inhibitor' | 'activator' | 'substrate' | 'cofactor'; target?: string; note?: string }
interface Pathway {
  slug: string;
  name: string;
  category: 'biosynthesis' | 'catabolism' | 'drug_metabolism' | 'signaling' | 'transport' | 'membrane' | 'endocrine_axis';
  systems: string[];
  description: string;
  steps: PathwayStep[];
  modulators?: PathwayModulator[];
  refs?: string[];
  recon3d_subsystem?: string;
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'gaba_a_receptor_signaling',
    name: 'GABA-A receptor signaling (chloride channel)',
    category: 'signaling',
    systems: ['nervous'],
    description: `Major inhibitory neurotransmitter system. GABA binding to pentameric GABA-A chloride channels (α/β/γ subunit composition) increases Cl⁻ conductance, hyperpolarizes the neuron, and dampens excitability. Distinct allosteric sites accept benzodiazepines (α1/2/3/5 + γ2 interface — positive allosteric modulators that enhance GABA's effect but require GABA to act), barbiturates (β subunit — at higher doses become direct channel openers without GABA, hence the larger toxicity tail), Z-drugs (α1-selective benzodiazepine-site binders, biased toward sedation over anxiolysis), neurosteroids (allopregnanolone — δ subunit-containing extra-synaptic receptors), and propofol / etomidate (β3 subunit — direct openers like barbiturates). Alcohol's CNS-depressant action is partly GABA-A potentiation at α4/δ extra-synaptic receptors. The GABA-A vs GABA-B split matters — baclofen is a metabotropic GABA-B agonist (Gi-coupled), not a GABA-A modulator, despite both being "GABA-ergic".`,
    steps: [
      { from: 'glutamate', to: 'gaba', via: 'GAD (glutamic acid decarboxylase) — vitamin B6 (P5P) is the cofactor' },
      { from: 'gaba', to: 'gaba-a-receptor-activation', via: 'orthosteric binding at α/β interface → Cl⁻ channel opening → hyperpolarization' },
      { from: 'gaba-a-receptor-activation', to: 'neuronal-inhibition', via: 'Cl⁻ influx → IPSP → reduced firing probability' },
      { from: 'gaba', to: 'succinate', via: 'GABA transaminase + succinic semialdehyde dehydrogenase → GABA shunt → TCA cycle' },
    ],
    modulators: [
      { slug: 'diazepam', effect: 'activator', target: 'BZD site (α1/2/3/5)', note: 'classic long-acting BZD; active metabolites (nordiazepam, oxazepam, temazepam) extend effect to ~100h' },
      { slug: 'alprazolam', effect: 'activator', target: 'BZD site (α1/2/3/5)', note: 'short-to-intermediate BZD; widely prescribed for panic; CYP3A4 substrate (DDI hot spot)' },
      { slug: 'clonazepam', effect: 'activator', target: 'BZD site (α1/2/3/5)', note: 'long-acting BZD; seizure + panic indications' },
      { slug: 'lorazepam', effect: 'activator', target: 'BZD site (α1/2/3/5)', note: 'intermediate BZD; glucuronidated (UGT, not CYP) so fewer DDIs; status epilepticus first-line IV' },
      { slug: 'midazolam', effect: 'activator', target: 'BZD site (α1/2/3/5)', note: 'short-acting BZD; canonical CYP3A4 substrate (probe drug for CYP3A4 inhibition studies)' },
      { slug: 'zolpidem', effect: 'activator', target: 'α1-selective BZD-site (Z-drug)', note: 'sedative-biased imidazopyridine; complex-sleep-behavior boxed warning' },
      { slug: 'zopiclone', effect: 'activator', target: 'α1-selective BZD-site (Z-drug)', note: 'cyclopyrrolone; eszopiclone is the active S-enantiomer' },
      { slug: 'eszopiclone', effect: 'activator', target: 'α1-selective BZD-site (Z-drug)', note: 'S-enantiomer of zopiclone; metallic-taste signature side effect' },
      { slug: 'phenobarbital', effect: 'activator', target: 'β-subunit (barbiturate site)', note: 'long-acting barbiturate; at high doses direct channel opener without GABA — wider toxicity tail than BZDs' },
      { slug: 'butalbital', effect: 'activator', target: 'β-subunit (barbiturate site)', note: 'intermediate barbiturate; component of Fioricet for tension headache; chronic-use rebound risk' },
      { slug: 'propofol', effect: 'activator', target: 'β3-subunit', note: 'IV anesthetic; direct GABA-A channel opener like barbiturates; rapid onset/offset due to lipid redistribution' },
      { slug: 'etomidate', effect: 'activator', target: 'β3-subunit', note: 'IV anesthetic; cardiovascular stability favored for shock + RSI; adrenocortical suppression limits infusion use' },
      { slug: 'alcohol', effect: 'activator', target: 'α4/δ extra-synaptic GABA-A', note: 'partial enhancement at low doses; high doses also inhibit NMDA — combined produces the disinhibition + sedation phenotype' },
      { slug: 'ethanol', effect: 'activator', target: 'α4/δ extra-synaptic GABA-A', note: 'chemistry-canonical slug for the same molecule; kept distinct from alcohol stub for solver-PK separation' },
      { slug: 'valproate', effect: 'activator', target: 'GABA-T inhibition + Na+/Ca++ channel block', note: 'NOT a direct GABA-A modulator; raises CNS GABA by inhibiting GABA-aminotransferase + multiple non-GABA mechanisms' },
      { slug: 'tiagabine', effect: 'inhibitor', target: 'GAT-1 (GABA transporter)', note: 'blocks neuronal/glial GABA reuptake → prolongs synaptic GABA → indirect enhancement of GABA-A signaling' },
      { slug: 'vigabatrin', effect: 'inhibitor', target: 'GABA-T (irreversible)', note: 'suicide inhibitor of GABA-aminotransferase → elevated CNS GABA; irreversible visual field defects limit use' },
      { slug: 'baclofen', effect: 'activator', target: 'GABA-B (metabotropic, Gi-coupled)', note: 'NOT GABA-A; included here for completeness since users often expect both GABA receptor families together — distinct binding site + signal transduction' },
      { slug: 'gaba', effect: 'substrate', target: 'GABA-A orthosteric agonist (endogenous)', note: 'parent neurotransmitter; PO supplemental GABA has minimal BBB penetration so peripheral PO GABA does not reliably modulate central GABA-A' },
    ],
    refs: [],
  },

  {
    slug: 'serotonin_receptor_pharmacology',
    name: 'Serotonin receptor pharmacology (5-HT1/2/3/4/6/7 + SERT)',
    category: 'signaling',
    systems: ['nervous', 'digestive', 'cardiovascular'],
    description: "5-HT family receptors (all GPCR except 5-HT3 which is a ligand-gated cation channel) drive mood, sleep, appetite, vasoconstriction, GI motility, and emesis. SERT (serotonin transporter) clears synaptic 5-HT and is the primary target of SSRIs / SNRIs / TCAs. 5-HT1A — somatodendritic autoreceptor + postsynaptic anxiolysis target (buspirone partial agonist; aripiprazole partial agonist). 5-HT1B/1D — vascular vasoconstriction (triptan target for migraine). 5-HT2A — cortical pyramidal-cell depolarization (psychedelic target; atypical-antipsychotic inverse-agonist target). 5-HT2C — appetite + mood. 5-HT3 — area-postrema emesis (setron target for chemo emesis). 5-HT4 — gut motility + cognition. 5-HT7 — circadian + mood. Vortioxetine is a multimodal SERT inhibitor + 5-HT1A agonist + 5-HT3/7 antagonist (single-molecule receptor cocktail). MDMA is a SERT releaser. Psychedelics (psilocybin / LSD / DMT) are 5-HT2A agonists.",
    steps: [
      { from: 'tryptophan', to: '5-hydroxytryptophan', via: 'tryptophan hydroxylase (TPH1 peripheral, TPH2 CNS) — rate-limiting step' },
      { from: '5-hydroxytryptophan', to: 'serotonin', via: 'aromatic amino-acid decarboxylase (AADC, P5P cofactor)' },
      { from: 'serotonin', to: '5ht-receptor-activation', via: 'extracellular binding to GPCR (1A/1B/1D/2A/2C/4/6/7) or ligand-gated channel (3)' },
      { from: '5ht-receptor-activation', to: 'serotonin', via: 'SERT reuptake (Na+/Cl- symporter) terminates synaptic signal — SSRI/SNRI/TCA target' },
      { from: 'serotonin', to: 'melatonin', via: 'AANAT → HIOMT; pineal-specific (cross-link: serotonin_melatonin_axis pathway)' },
    ],
    modulators: [
      { slug: 'fluoxetine', effect: 'inhibitor', target: 'SERT', note: 'long-acting SSRI; active metabolite norfluoxetine adds days to effect duration; CYP2D6 inhibitor' },
      { slug: 'sertraline', effect: 'inhibitor', target: 'SERT', note: 'SSRI with mild DAT activity (clinically negligible); food increases absorption' },
      { slug: 'paroxetine', effect: 'inhibitor', target: 'SERT', note: 'potent SSRI; strong CYP2D6 mechanism-based inhibitor (DDI hot spot for AP/opioid/β-blocker co-administration)' },
      { slug: 'citalopram', effect: 'inhibitor', target: 'SERT', note: 'racemic SSRI; QT prolongation at >40 mg led to FDA dose cap (2011)' },
      { slug: 'escitalopram', effect: 'inhibitor', target: 'SERT', note: 'S-enantiomer of citalopram; same QT profile minus the inactive R-enantiomer' },
      { slug: 'fluvoxamine', effect: 'inhibitor', target: 'SERT', note: 'SSRI; potent CYP1A2 + CYP2C19 inhibitor (major DDIs with clozapine, caffeine, tacrine)' },
      { slug: 'venlafaxine', effect: 'inhibitor', target: 'SERT + NET (dose-dependent)', note: 'SNRI; SERT-dominant at low dose, NET adds above ~150 mg/d (the "SNRI threshold")' },
      { slug: 'duloxetine', effect: 'inhibitor', target: 'SERT + NET', note: 'balanced SNRI from initial dose; diabetic neuropathy + fibromyalgia indications' },
      { slug: 'vortioxetine', effect: 'inhibitor', target: 'SERT inhibitor + 5-HT1A agonist + 5-HT3/7 antagonist', note: 'multimodal agent — receptor profile differs from pure SSRIs (cognitive-domain benefits claimed)' },
      { slug: 'sumatriptan', effect: 'activator', target: '5-HT1B/1D', note: 'triptan; vasoconstrictor at cranial blood vessels for migraine; CV-disease contraindication' },
      { slug: 'rizatriptan', effect: 'activator', target: '5-HT1B/1D', note: 'oral triptan; faster Tmax than sumatriptan; MAO-A substrate (propranolol DDI doubles AUC)' },
      { slug: 'buspirone', effect: 'activator', target: '5-HT1A (partial agonist)', note: 'azaspirone anxiolytic; delayed onset (~2 weeks); CYP3A4 substrate (massive grapefruit / verapamil DDIs)' },
      { slug: 'aripiprazole', effect: 'activator', target: '5-HT1A partial agonist + 5-HT2A inverse agonist (also D2 partial agonist)', note: 'atypical AP; dopamine + serotonin partial-agonist hybrid distinguishes it from pure D2 antagonists' },
      { slug: 'quetiapine', effect: 'inhibitor', target: '5-HT2A antagonist (also H1, D2, M1)', note: 'multi-target atypical AP; sedation-prone receptor profile' },
      { slug: 'olanzapine', effect: 'inhibitor', target: '5-HT2A antagonist (also D2, H1, M1)', note: 'atypical AP; metabolic side-effect profile (weight + glucose) driven by H1/5HT2C antagonism' },
      { slug: 'risperidone', effect: 'inhibitor', target: '5-HT2A antagonist (also D2)', note: 'high 5HT2A:D2 ratio at low doses; at high doses behaves like typical AP' },
      { slug: 'clozapine', effect: 'inhibitor', target: '5-HT2A antagonist + multi-receptor', note: 'reference atypical AP for treatment-resistant schizophrenia; agranulocytosis monitoring + CYP1A2 substrate' },
      { slug: 'psilocybin', effect: 'activator', target: '5-HT2A (psilocin is the active metabolite)', note: 'prodrug — dephosphorylated to psilocin; 5-HT2A agonism produces the classic psychedelic state' },
      { slug: 'lsd', effect: 'activator', target: '5-HT2A (partial agonist) + 5-HT1A/2C', note: 'sub-mg potent; long duration vs psilocybin reflects β-arrestin recruitment kinetics' },
      { slug: 'dmt', effect: 'activator', target: '5-HT2A', note: 'short-duration psychedelic; oral DMT inactive without MAOI (ayahuasca = DMT + harmaline MAOI brew)' },
      { slug: 'mdma', effect: 'activator', target: 'SERT releaser (also NET, DAT)', note: 'reverses SERT direction → massive 5-HT efflux; serotonin-syndrome risk with SSRIs / MAOIs' },
      { slug: 'ondansetron', effect: 'inhibitor', target: '5-HT3', note: 'setron antiemetic; QT prolongation; first-line chemo-emesis prevention' },
      { slug: 'granisetron', effect: 'inhibitor', target: '5-HT3', note: 'setron; longer half-life vs ondansetron permits once-daily dosing' },
    ],
    refs: [],
  },

  {
    slug: 'adrenergic_receptor_signaling',
    name: 'Adrenergic receptor signaling (α1/α2/β1/β2/β3)',
    category: 'signaling',
    systems: ['cardiovascular', 'nervous', 'respiratory'],
    description: "Catecholamine GPCRs split into α-family (Gq-coupled vasoconstriction at α1; Gi-coupled presynaptic feedback inhibition at α2) and β-family (Gs-coupled cAMP elevation: β1 cardiac chronotropy + inotropy, β2 bronchodilation + vasodilation, β3 lipolysis + detrusor relaxation). Antagonists branch by subtype: non-selective β-blockers (propranolol, nadolol, sotalol) block β1+β2; β1-cardioselective (atenolol, metoprolol, bisoprolol) preserve bronchodilation at therapeutic doses; mixed α/β (carvedilol, labetalol) add vasodilation. α1-blockers (prazosin, doxazosin, tamsulosin) lower BP + relax urethra. α2-agonists (clonidine, guanfacine) suppress central sympathetic outflow. β2-agonists (albuterol, salmeterol) relax bronchial smooth muscle. Sympathomimetics (ephedrine, pseudoephedrine, phenylephrine, synephrine) activate α + β to varying degrees. NRI (atomoxetine) blocks NET, raising synaptic NE without the abuse potential of stimulants.",
    steps: [
      { from: 'norepinephrine', to: 'adrenergic-receptor-activation', via: 'cross-link: catecholamine_synthesis pathway upstream (tyrosine → L-DOPA → dopamine → NE → epi)' },
      { from: 'adrenergic-receptor-activation', to: 'norepinephrine', via: 'NET reuptake (atomoxetine target) — terminates synaptic NE; complements postsynaptic adrenoceptor antagonism' },
      { from: 'norepinephrine', to: 'metanephrine', via: 'COMT → MAO inactivation pathway (cross-link: monoamine_oxidase_metabolism)' },
    ],
    modulators: [
      { slug: 'propranolol', effect: 'inhibitor', target: 'β1 + β2 (non-selective)', note: 'classic non-selective β-blocker; lipophilic (CNS-penetrant); CYP2D6 + 1A2 metabolism' },
      { slug: 'atenolol', effect: 'inhibitor', target: 'β1-cardioselective', note: 'renally cleared; reduced CNS effects vs propranolol; weak BP efficacy in younger patients' },
      { slug: 'metoprolol', effect: 'inhibitor', target: 'β1-cardioselective', note: 'CYP2D6 substrate (poor metabolizers see 5× AUC); succinate form for HFrEF qd dosing' },
      { slug: 'bisoprolol', effect: 'inhibitor', target: 'β1-cardioselective (highly selective)', note: 'most β1-selective of the cardioselectives; HFrEF + HTN' },
      { slug: 'nadolol', effect: 'inhibitor', target: 'β1 + β2 (non-selective, hydrophilic)', note: 'renally cleared; long t½ (~20h) permits qd dosing; portal HTN variceal-bleed prophylaxis' },
      { slug: 'sotalol', effect: 'inhibitor', target: 'β1 + β2 (non-selective) + IKr block', note: 'class III antiarrhythmic by IKr block at higher doses; QT prolongation requires admission for initiation' },
      { slug: 'carvedilol', effect: 'inhibitor', target: 'β1 + β2 + α1 (mixed)', note: 'α1-blockade adds vasodilation; HFrEF mortality benefit; lipophilic CYP2D6 substrate' },
      { slug: 'labetalol', effect: 'inhibitor', target: 'β1 + β2 + α1 (mixed)', note: 'mixed α/β; IV use in hypertensive emergencies + pregnancy HTN' },
      { slug: 'prazosin', effect: 'inhibitor', target: 'α1', note: 'first-dose syncope; PTSD nightmare indication off-label; not a first-line HTN agent' },
      { slug: 'doxazosin', effect: 'inhibitor', target: 'α1', note: 'BPH + HTN; ALLHAT showed worse HF outcomes vs thiazide — relegated to second-line' },
      { slug: 'tamsulosin', effect: 'inhibitor', target: 'α1A (uroselective)', note: 'BPH; uroselectivity minimizes BP effects but floppy-iris syndrome risk persists' },
      { slug: 'clonidine', effect: 'activator', target: 'α2 (central)', note: 'central sympatholysis lowers BP + heart rate; rebound HTN on abrupt discontinuation; also opioid-withdrawal symptom control' },
      { slug: 'guanfacine', effect: 'activator', target: 'α2A (central)', note: 'extended-release for ADHD (esp. impulsivity); sedation less than clonidine due to subtype selectivity' },
      { slug: 'phenylephrine-otc', effect: 'activator', target: 'α1', note: 'oral decongestant; 2023 FDA advisory committee found PO phenylephrine ineffective for nasal congestion (poor F)' },
      { slug: 'pseudoephedrine', effect: 'activator', target: 'α1 + β1/β2 (mixed; releases NE)', note: 'effective oral decongestant; behind-the-counter restrictions due to meth-precursor risk' },
      { slug: 'ephedrine', effect: 'activator', target: 'α + β (mixed; releases NE)', note: 'indirect sympathomimetic; ephedrine alkaloids banned from supplements 2004; IV pressor use persists' },
      { slug: 'synephrine', effect: 'activator', target: 'α1 (selective in vitro)', note: 'bitter orange supplement; weaker than ephedrine but flagged in dietary supplement safety reviews' },
      { slug: 'epinephrine', effect: 'activator', target: 'α1 + α2 + β1 + β2 (full agonist)', note: 'anaphylaxis first-line; dose-dependent receptor shift (β-dominant at low dose, α-dominant at high)' },
      { slug: 'norepinephrine', effect: 'activator', target: 'α1 + β1 (minimal β2)', note: 'septic shock first-line pressor; α1 vasoconstriction dominant; minimal β2 → less tachycardia than dopamine' },
      { slug: 'salmeterol', effect: 'activator', target: 'β2 (long-acting)', note: 'LABA; 12-hour duration via lipophilic membrane retention; never monotherapy in asthma (boxed warning)' },
      { slug: 'albuterol', effect: 'activator', target: 'β2', note: 'SABA bronchodilator; rescue inhaler; tremor + hypokalemia at high doses' },
      { slug: 'atomoxetine', effect: 'inhibitor', target: 'NET (norepinephrine transporter)', note: 'non-stimulant ADHD; NRI raises NE + DA in PFC without abuse liability; CYP2D6 substrate (5× AUC in PM)' },
    ],
    refs: [],
  },

  {
    slug: 'dopamine_receptor_signaling',
    name: 'Dopamine receptor signaling (D1-D5)',
    category: 'signaling',
    systems: ['nervous', 'endocrine', 'digestive'],
    description: "Dopamine GPCRs split D1-family (D1, D5 — Gs-coupled, increase cAMP) and D2-family (D2, D3, D4 — Gi-coupled, decrease cAMP). D1 → cortical-striatal motor planning. D2 → nigrostriatal motor control + tuberoinfundibular prolactin inhibition + mesocortical/mesolimbic mood + reward. Antipsychotics (typical: high D2 affinity, EPS-prone; atypical: D2 antagonism + 5-HT2A inverse agonism, lower EPS, broader receptor profile). Partial-agonist atypicals (aripiprazole, brexpiprazole, cariprazine) self-titrate dopamine tone — partial agonism stabilizes both hypo- and hyperdopaminergic states. L-DOPA + carbidopa supplies precursor for striatal dopamine in Parkinson's (cross-link: catecholamine_synthesis upstream). Stimulants (methylphenidate, amphetamine) raise synaptic DA via DAT blockade + release. Antiemetics (metoclopramide, prochlorperazine) act at D2 in the area postrema — EPS + tardive dyskinesia tail when used chronically.",
    steps: [
      { from: 'dopamine', to: 'dopamine-receptor-activation', via: 'binding to D1/D5 (Gs) or D2/D3/D4 (Gi); cross-link: catecholamine_synthesis supplies dopamine' },
      { from: 'dopamine-receptor-activation', to: 'dopamine', via: 'DAT reuptake (stimulant target) terminates synaptic signal' },
      { from: 'dopamine', to: 'homovanillic-acid', via: 'MAO-B + COMT inactivation (cross-link: monoamine_oxidase_metabolism)' },
    ],
    modulators: [
      { slug: 'levodopa', effect: 'substrate', target: 'dopamine precursor (peripheral AADC + cross-BBB then central AADC)', note: 'always co-administered with carbidopa (peripheral AADC inhibitor) to prevent peripheral conversion + GI side effects' },
      { slug: 'aripiprazole', effect: 'activator', target: 'D2 partial agonist (also 5-HT1A partial, 5-HT2A inverse)', note: 'dopamine stabilizer — partial agonist activity rescues mesocortical hypoactivity while damping mesolimbic hyperactivity' },
      { slug: 'brexpiprazole', effect: 'activator', target: 'D2 partial agonist', note: 'aripiprazole successor; slightly different receptor profile (more 5-HT1A); akathisia less prominent' },
      { slug: 'cariprazine', effect: 'activator', target: 'D3-preferring partial agonist (also D2 partial)', note: 'unique D3-preference; depression + schizophrenia indications; longer half-life than aripiprazole' },
      { slug: 'olanzapine', effect: 'inhibitor', target: 'D2 antagonist (also 5-HT2A, H1, M1)', note: 'atypical AP; H1 + 5-HT2C drive weight + metabolic side effects' },
      { slug: 'quetiapine', effect: 'inhibitor', target: 'D2 antagonist (transient — high koff)', note: 'fast D2 dissociation distinguishes from clozapine; sedation-dominant at low doses (H1)' },
      { slug: 'risperidone', effect: 'inhibitor', target: 'D2 antagonist (also 5-HT2A)', note: 'high D2 occupancy → EPS at therapeutic doses despite "atypical" label; hyperprolactinemia signature' },
      { slug: 'haloperidol', effect: 'inhibitor', target: 'D2 antagonist (high-potency typical)', note: 'classic typical AP; acute IV use for delirium; tardive dyskinesia risk' },
      { slug: 'clozapine', effect: 'inhibitor', target: 'D2 antagonist (low affinity) + multi-receptor', note: 'low D2 occupancy paradox — minimal EPS; treatment-resistant schizophrenia gold standard; agranulocytosis monitoring' },
      { slug: 'metoclopramide', effect: 'inhibitor', target: 'D2 (area postrema + GI)', note: 'antiemetic + gastric prokinetic; boxed warning for tardive dyskinesia with chronic use (>12 weeks)' },
      { slug: 'prochlorperazine', effect: 'inhibitor', target: 'D2 (phenothiazine)', note: 'antiemetic + migraine; EPS + akathisia common acute side effects' },
      { slug: 'methylphenidate', effect: 'inhibitor', target: 'DAT + NET (transporter blocker)', note: 'raises synaptic DA without releasing intracellular stores (unlike amphetamine); first-line ADHD' },
      { slug: 'amphetamine', effect: 'inhibitor', target: 'DAT + NET (also TAAR1 + VMAT reversal → release)', note: 'mixed reuptake-blocker + releaser; greater abuse liability vs methylphenidate from the release component' },
      { slug: 'dextroamphetamine', effect: 'inhibitor', target: 'DAT + NET (same mechanism as amphetamine)', note: 'D-enantiomer of amphetamine; component of Adderall (D:L 3:1)' },
      { slug: 'lisdexamfetamine', effect: 'inhibitor', target: 'DAT + NET (prodrug → dextroamphetamine in RBCs)', note: 'lysine-conjugated d-amphetamine; cleaved by RBC peptidases at near-constant rate → smoother PK + lower abuse liability' },
      { slug: 'dexmethylphenidate', effect: 'inhibitor', target: 'DAT + NET', note: 'D-threo-methylphenidate (the active enantiomer of racemic methylphenidate); half the dose for same effect' },
    ],
    refs: [],
  },

  {
    slug: 'insulin_glucose_homeostasis',
    name: 'Insulin signaling + glucose homeostasis',
    category: 'signaling',
    systems: ['endocrine', 'cardiovascular'],
    description: `β-cell insulin secretion + peripheral insulin action set systemic glucose disposal. Insulin → InsR (RTK) → IRS-1 → PI3K → AKT → GLUT4 translocation in muscle + adipose (peripheral glucose uptake) and inhibits hepatic gluconeogenesis. Incretin axis (GLP-1, GIP) augments glucose-dependent insulin release + delays gastric emptying + suppresses glucagon. Drug classes: insulin variants replace; GLP-1 agonists (semaglutide, tirzepatide dual GLP-1/GIP, liraglutide, dulaglutide, exenatide); DPP-4 inhibitors prolong endogenous GLP-1/GIP; SGLT2 inhibitors block renal glucose reabsorption; sulfonylureas / glinides close β-cell KATP channels for glucose-independent insulin release; TZDs (pioglitazone, rosiglitazone) activate PPAR-γ as insulin-sensitizers; metformin suppresses hepatic gluconeogenesis via AMPK + complex-I inhibition. Cross-links: gluconeogenesis, glycolysis, glycogen_metabolism, oxidative_phosphorylation.`,
    steps: [
      { from: 'glucose', to: 'insulin-release', via: 'β-cell GLUT2 uptake → glycolysis → ATP/ADP ↑ → KATP closure → depolarization → Ca2+ influx → insulin granule exocytosis' },
      { from: 'insulin-release', to: 'insulin-receptor-activation', via: 'systemic insulin binds peripheral InsR (RTK family)' },
      { from: 'insulin-receptor-activation', to: 'glut4-translocation', via: 'IRS-1 → PI3K → AKT → AS160 phosphorylation → GLUT4 vesicle fusion → glucose uptake' },
      { from: 'insulin-receptor-activation', to: 'glucose', via: 'hepatic AKT → FoxO1 inactivation → ↓gluconeogenesis + ↑glycogen synthesis (net glucose disposal)' },
      { from: 'glp-1', to: 'insulin-release', via: 'incretin amplification; glucose-dependent (no hypoglycemia by mechanism)' },
      { from: 'glp-1', to: 'glp-1', via: 'DPP-4 cleavage inactivates within ~2 min — DPP-4 inhibitors block this step' },
    ],
    modulators: [
      { slug: 'insulin', effect: 'activator', target: 'InsR (RTK)', note: 'regular human insulin; covers prandial glucose; CV use also via potassium shift treatment for hyperkalemia' },
      { slug: 'insulin-glargine', effect: 'activator', target: 'InsR (RTK)', note: 'long-acting basal insulin; pH-shift depot mechanism; 24h flat profile' },
      { slug: 'metformin', effect: 'inhibitor', target: 'mitochondrial complex I + AMPK (hepatic)', note: 'first-line T2DM; primary action hepatic gluconeogenesis suppression; OCT2/MATE transporter substrate; lactic acidosis risk at severe renal impairment' },
      { slug: 'semaglutide', effect: 'activator', target: 'GLP-1R (incretin mimetic)', note: 'long-acting GLP-1 agonist; Ozempic SC weekly + Rybelsus PO daily + Wegovy SC weekly (obesity); CV + renal outcome benefits' },
      { slug: 'tirzepatide', effect: 'activator', target: 'GLP-1R + GIP-R (dual incretin)', note: 'first dual GIP/GLP-1 agonist; superior HbA1c + weight reduction vs semaglutide in head-to-head SURPASS-2' },
      { slug: 'liraglutide', effect: 'activator', target: 'GLP-1R', note: 'GLP-1 agonist; daily SC; T2DM (Victoza) + obesity (Saxenda) indications' },
      { slug: 'dulaglutide', effect: 'activator', target: 'GLP-1R', note: 'weekly SC GLP-1 agonist; Fc-fusion extends half-life' },
      { slug: 'exenatide', effect: 'activator', target: 'GLP-1R', note: 'exendin-4 analog from Gila monster saliva; original GLP-1 agonist (Byetta 2005)' },
      { slug: 'sitagliptin', effect: 'inhibitor', target: 'DPP-4', note: 'DPP-4 inhibitor — raises endogenous GLP-1/GIP ~2-3×; weight-neutral; renally adjusted' },
      { slug: 'saxagliptin', effect: 'inhibitor', target: 'DPP-4', note: 'DPP-4 inhibitor; SAVOR-TIMI HF signal limited cardiac use' },
      { slug: 'linagliptin', effect: 'inhibitor', target: 'DPP-4', note: 'biliary clearance — no renal adjustment needed; preferred in CKD' },
      { slug: 'canagliflozin', effect: 'inhibitor', target: 'SGLT2 (proximal tubule)', note: 'first SGLT2i (Invokana); CV + renal outcome benefits; amputation signal restricted clinical use' },
      { slug: 'dapagliflozin', effect: 'inhibitor', target: 'SGLT2', note: 'HFrEF + CKD outcome benefits in non-diabetic patients (DAPA-HF, DAPA-CKD)' },
      { slug: 'empagliflozin', effect: 'inhibitor', target: 'SGLT2', note: 'EMPA-REG OUTCOME established CV mortality benefit; HFrEF + HFpEF indications' },
      { slug: 'glipizide', effect: 'activator', target: 'KATP channel block (SUR1)', note: 'sulfonylurea — glucose-independent insulin release → hypoglycemia risk; weight gain' },
      { slug: 'glyburide', effect: 'activator', target: 'KATP channel block (SUR1)', note: 'long-acting sulfonylurea; avoid in elderly + renal impairment (severe hypoglycemia risk)' },
      { slug: 'glimepiride', effect: 'activator', target: 'KATP channel block (SUR1)', note: 'sulfonylurea; slightly lower hypoglycemia risk than glyburide; CYP2C9 substrate (fluconazole DDI authored Wave 2a v1.1)' },
      { slug: 'repaglinide', effect: 'activator', target: 'KATP channel block (SUR1, distinct site from sulfonylureas)', note: 'meglitinide — short t½ for prandial timing; CYP2C8 substrate (gemfibrozil DDI catastrophic, contraindicated)' },
      { slug: 'pioglitazone', effect: 'activator', target: 'PPAR-γ (insulin sensitizer)', note: 'thiazolidinedione; insulin sensitization in adipose + muscle; bladder cancer signal (small) + HF risk via fluid retention' },
      { slug: 'rosiglitazone', effect: 'activator', target: 'PPAR-γ', note: 'thiazolidinedione; REMS restriction 2010-2013 from CV signal (Nissen meta-analysis); off-restriction 2013' },
    ],
    refs: [],
  },

  {
    slug: 'orexin_arousal_axis',
    name: 'Orexin / wakefulness arousal axis',
    category: 'signaling',
    systems: ['nervous'],
    description: "Lateral hypothalamic orexin (hypocretin) neurons project broadly to monoaminergic + cholinergic arousal nuclei (LC, raphe, TMN, BF), stabilizing wakefulness. Orexin loss (autoimmune destruction of LH neurons) is the proximal cause of narcolepsy type 1. Pharmacology: dual orexin receptor antagonists (DORAs — suvorexant, lemborexant, daridorexant) block OX1 + OX2 to induce sleep without GABA-A modulation (lower fall + cognitive risk vs benzos). Modafinil's wake-promoting action is partly via orexin-system activation (DAT-low-affinity inhibitor with downstream orexin amplification). Caffeine's wake effect is via A1/A2A adenosine antagonism — adenosine accumulates during waking + inhibits orexin neurons; caffeine removes that inhibition.",
    steps: [
      { from: 'orexin-release', to: 'monoaminergic-arousal', via: 'OX1/OX2 receptors on LC noradrenergic + raphe serotonergic + TMN histaminergic + BF cholinergic neurons → wake-promotion' },
      { from: 'adenosine', to: 'orexin-release', via: 'A1 receptors on orexin neurons inhibit firing; rising adenosine across waking hours promotes sleep pressure' },
    ],
    modulators: [
      { slug: 'suvorexant', effect: 'inhibitor', target: 'OX1 + OX2 (DORA)', note: 'first DORA (Belsomra 2014); ~12h half-life can drag into next morning; next-day driving warning' },
      { slug: 'lemborexant', effect: 'inhibitor', target: 'OX1 + OX2 (DORA, OX2-biased)', note: 'Dayvigo 2019; faster sleep-onset profile than suvorexant; SUNRISE trials' },
      { slug: 'daridorexant', effect: 'inhibitor', target: 'OX1 + OX2 (DORA)', note: 'Quviviq 2022; shortest half-life of the DORAs (~8h) — minimizes next-day residual sedation' },
      { slug: 'modafinil', effect: 'activator', target: 'orexin neurons (indirect via DAT + downstream activation)', note: 'wake-promoting; narcolepsy + shift-work + OSA-residual sleepiness indications; CYP3A4 inducer (multi-DDI perpetrator Wave 2a v1.1)' },
      { slug: 'armodafinil', effect: 'activator', target: 'orexin neurons (indirect)', note: 'R-enantiomer of modafinil; longer t½ allows once-daily morning dosing' },
      { slug: 'adrafinil', effect: 'activator', target: 'orexin neurons (prodrug → modafinil)', note: 'modafinil prodrug; hepatic conversion; supplement-channel availability outside Rx' },
      { slug: 'caffeine', effect: 'activator', target: 'orexin disinhibition (via A1/A2A antagonism on orexin neurons)', note: 'wake-promotion by removing adenosine inhibition of orexin firing; cross-link: caffeine_demethylation for clearance + adenosine receptors as direct target' },
      { slug: 'adenosine', effect: 'inhibitor', target: 'orexin firing (A1 on orexin neurons)', note: 'endogenous sleep-pressure signal; accumulates across the waking day; CYP-independent (deaminated by ADA)' },
    ],
    refs: [],
  },
];

interface PathwayFile { slug: string; [k: string]: unknown }

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as PathwayFile[];
  const existing = new Set(data.map(p => p.slug));

  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (existing.has(p.slug)) {
      console.log(`  [skip] ${p.slug} already exists`);
      continue;
    }
    data.push(p as PathwayFile);
    added++;
    console.log(`  [add ] ${p.slug.padEnd(40)} category=${p.category} modulators=${p.modulators?.length ?? 0}`);
  }

  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nReceptor-pathway batch: +${added} pathways. Total: ${data.length}.`);
}

main();
