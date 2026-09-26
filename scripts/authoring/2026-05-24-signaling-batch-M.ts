/**
 * 2026-05-24-signaling-batch-M.ts
 *
 * step.note grind, batch M — 7 foundational axis/cell-bio skeleton pathways,
 * notes-only. Refs title-checked via esummary 2026-05-24:
 *   autonomic_balance          PMID:28093795 (+ textbook autonomic physiology)
 *   calcium_phosphate_pth_axis PMID:17634462 (NEJM vit-D), 30060226 (primary HPT)
 *   endocannabinoid_system     PMID:16968947 (Pacher, Pharmacol Rev)
 *   gaba_b_receptor_signaling  PMID:15269338,12037141,22595784,20655485,8532848
 *   hpg_axis                   PMID:18838102, 29562364
 *   platelet_aggregation       PMID:19717846 (PLATO), 17982182 (TRITON)
 *   vasodilator_no_endothelin  PMID:2451132 (endothelin discovery, Nature)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-M.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'autonomic_balance',
    notes: {
      'sympathetic-activation norepinephrine-release':
        'The sympathetic (“fight-or-flight”) branch acts on target organs chiefly via postganglionic release of ' +
        'norepinephrine (the adrenal medulla adds circulating epinephrine). This is the effector arm of the ' +
        'stress/arousal response, opposed at most organs by the parasympathetic branch — the balance defining ' +
        'autonomic tone.',
      'norepinephrine-release alpha-beta-receptor-activation':
        'Norepinephrine acts on adrenergic receptors whose subtype sets the effect: α1 (vasoconstriction), β1 ' +
        '(cardiac rate/force), β2 (bronchodilation, vasodilation). The same transmitter thus produces opposite ' +
        'effects in different tissues depending on which receptor predominates — the basis of selective ' +
        'adrenergic drugs.',
      'parasympathetic-activation acetylcholine-release':
        'The parasympathetic (“rest-and-digest”) branch signals to target organs through postganglionic release ' +
        'of acetylcholine. It dominates at rest — slowing the heart, stimulating digestion and secretion — and is ' +
        'carried largely by the vagus nerve, the major parasympathetic outflow.',
      'acetylcholine-release muscarinic-activation':
        'Acetylcholine acts on muscarinic GPCRs at parasympathetic target organs (M2 in heart, M3 in ' +
        'glands/smooth muscle), producing the rest-and-digest effects. This is the receptor blocked by atropine ' +
        'and “anticholinergic” drugs — while ganglionic and neuromuscular signaling instead use nicotinic ACh ' +
        'receptors.',
    },
  },
  {
    slug: 'calcium_phosphate_pth_axis',
    notes: {
      'low-plasma-calcium pth-release':
        'A fall in plasma ionized calcium is sensed by the parathyroid calcium-sensing receptor (CaSR), which ' +
        'triggers PTH secretion within minutes. The CaSR is exquisitely sensitive, making PTH the rapid, ' +
        'first-line defense of calcium homeostasis — and the target of calcimimetics (cinacalcet) that lower PTH.',
      'pth-release bone-resorption':
        'PTH stimulates osteoclastic bone resorption (indirectly, via RANKL on osteoblasts), releasing calcium ' +
        'and phosphate from the skeleton. Continuous high PTH is catabolic to bone (as in hyperparathyroidism), ' +
        'whereas intermittent PTH is anabolic — the paradox exploited by teriparatide for osteoporosis.',
      'pth-release renal-calcium-reabsorption':
        'In the kidney, PTH increases distal tubular calcium reabsorption (conserving calcium) while inhibiting ' +
        'proximal phosphate reabsorption (promoting phosphaturia). This dual renal action raises serum calcium ' +
        'while preventing the phosphate co-released from bone from accumulating.',
      'pth-release calcitriol-synthesis':
        'PTH also induces renal 1α-hydroxylase (CYP27B1) to make active calcitriol (1,25-D), which raises ' +
        'intestinal calcium absorption — the slower, third arm of PTH action. This ties the PTH-calcium axis to ' +
        'vitamin D status; deficiency causes secondary hyperparathyroidism.',
    },
  },
  {
    slug: 'endocannabinoid_system',
    notes: {
      'postsynaptic-depolarization endocannabinoid-release':
        'Endocannabinoids are made on demand: postsynaptic depolarization and Ca²⁺ entry trigger synthesis of ' +
        'lipid messengers (anandamide, 2-AG) from membrane precursors. Unlike classical transmitters they are not ' +
        'stored in vesicles — produced and released exactly when and where neuronal activity calls for them.',
      'endocannabinoid-release presynaptic-cb1':
        'Released endocannabinoids travel backward across the synapse (retrograde signaling) to activate ' +
        'presynaptic CB1 receptors, which suppress further neurotransmitter release. This retrograde, on-demand ' +
        'inhibition is the system’s signature — a feedback brake on synaptic activity, and the target of THC (a ' +
        'CB1 agonist).',
      'anandamide arachidonic-acid':
        'Anandamide is terminated by the enzyme FAAH, which hydrolyzes it to arachidonic acid and ethanolamine. ' +
        'Because FAAH controls anandamide tone, FAAH inhibitors have been pursued to raise endocannabinoid ' +
        'signaling for pain and anxiety (with cautious development after an early trial tragedy).',
      '2-ag arachidonic-acid-glycerol':
        '2-AG, the more abundant endocannabinoid, is degraded mainly by monoacylglycerol lipase (MAGL) to ' +
        'arachidonic acid and glycerol. This links the endocannabinoid system to eicosanoids — MAGL-derived ' +
        'arachidonic acid feeds prostaglandin synthesis, so MAGL inhibition is both pro-cannabinoid and ' +
        'anti-inflammatory.',
    },
  },
  {
    slug: 'gaba_b_receptor_signaling',
    notes: {
      'gaba gaba-b-receptor-activation':
        'GABA-B receptors are the metabotropic arm of GABA signaling — Gi/o-coupled GPCRs (obligate heterodimers ' +
        'of GABA-B1 and GABA-B2), distinct from the ionotropic GABA-A channels. They mediate the slow, prolonged ' +
        'inhibition of GABA and are the target of baclofen, used for spasticity.',
      'gaba-b-receptor-activation reduced-camp':
        'Via Gi/o, GABA-B activation inhibits adenylate cyclase, lowering cAMP. This reduces PKA-dependent ' +
        'signaling and contributes to the receptor’s modulatory, longer-lasting effects on excitability — the ' +
        'metabotropic counterpart to GABA-A’s fast chloride current.',
      'gaba-b-receptor-activation reduced-neurotransmitter-release':
        'Presynaptically, GABA-B receptors inhibit voltage-gated Ca²⁺ channels, reducing neurotransmitter release ' +
        '— acting as autoreceptors (curbing GABA release) and heteroreceptors (curbing glutamate and other ' +
        'transmitters). This presynaptic brake is central to their tuning of synaptic transmission.',
      'gaba-b-receptor-activation neuronal-hyperpolarization':
        'Postsynaptically, GABA-B receptors open GIRK potassium channels, hyperpolarizing the neuron and producing ' +
        'the slow inhibitory postsynaptic potential. This sustained hyperpolarization dampens excitability over a ' +
        'longer timescale than GABA-A — relevant to absence seizures and to baclofen’s CNS depressant effects.',
    },
  },
  {
    slug: 'hpg_axis',
    notes: {
      'gnrh lh':
        'The hypothalamus releases GnRH in pulses that drive the anterior pituitary to secrete luteinizing hormone ' +
        '(LH). The pulse frequency encodes the signal — fast pulses favor LH — and continuous (non-pulsatile) GnRH ' +
        'paradoxically shuts the axis down, the basis of GnRH-agonist therapy in prostate cancer and ' +
        'endometriosis.',
      'gnrh fsh':
        'GnRH also drives pituitary secretion of follicle-stimulating hormone (FSH); slower GnRH pulses favor FSH ' +
        'over LH. FSH supports gametogenesis — spermatogenesis (Sertoli cells) in males and follicular ' +
        'development in females — complementing LH’s steroidogenic role.',
      'lh testosterone':
        'In males, LH stimulates testicular Leydig cells to synthesize testosterone, which exerts negative ' +
        'feedback on the hypothalamus and pituitary. This loop is why exogenous androgens suppress the axis (and ' +
        'endogenous production/fertility) — relevant to anabolic-steroid use and testosterone therapy.',
      'lh estradiol':
        'In females, LH drives ovarian estradiol synthesis, and the mid-cycle LH surge triggers ovulation. ' +
        'Estradiol feedback is usually negative but switches to positive at mid-cycle to generate that surge — the ' +
        'unique feature of the female HPG axis exploited by hormonal contraception.',
    },
  },
  {
    slug: 'platelet_aggregation',
    notes: {
      'platelet-activation txa2-release':
        'Activated platelets synthesize thromboxane A2 (TXA2) from arachidonic acid via COX-1, which recruits and ' +
        'activates more platelets in a positive-feedback loop. This COX-1/TXA2 step is irreversibly blocked by ' +
        'aspirin — the mechanistic basis of low-dose aspirin’s antiplatelet effect.',
      'platelet-activation adp-release':
        'Activated platelets also secrete ADP from dense granules, which acts on the P2Y12 receptor to amplify and ' +
        'sustain activation. P2Y12 is the target of clopidogrel, prasugrel, and ticagrelor — the other pillar of ' +
        'dual antiplatelet therapy alongside aspirin.',
      'platelet-activation thrombin-par1':
        'Thrombin, generated by the coagulation cascade, is the most potent platelet activator, acting through ' +
        'protease-activated receptors (PAR1/PAR4). This links secondary hemostasis (coagulation) to platelet ' +
        'activation — and PAR1 antagonists (vorapaxar) are a newer antiplatelet class.',
      'platelet-activation gpiib-iiia-binding':
        'All activation pathways converge on the integrin GPIIb/IIIa, which changes conformation to bind ' +
        'fibrinogen, cross-linking platelets into an aggregate — the final common step. GPIIb/IIIa inhibitors ' +
        '(abciximab, eptifibatide) block it directly, and its deficiency causes Glanzmann thrombasthenia.',
    },
  },
  {
    slug: 'vasodilator_no_endothelin',
    notes: {
      'l-arginine nitric-oxide':
        'Endothelial nitric oxide synthase (eNOS) makes nitric oxide (NO) from L-arginine in response to shear ' +
        'stress and agonists like acetylcholine. NO is the principal endothelium-derived relaxing factor — a ' +
        'freely diffusing gas that signals from endothelium to the underlying smooth muscle.',
      'nitric-oxide cgmp-elevation':
        'NO diffuses into vascular smooth muscle and activates soluble guanylate cyclase, raising cGMP. This is ' +
        'the core vasodilatory signal — the same pathway amplified by PDE5 inhibitors (which prevent cGMP ' +
        'breakdown) and by nitrates (which donate NO).',
      'cgmp-elevation vasodilation':
        'cGMP activates protein kinase G, which lowers intracellular calcium and desensitizes the contractile ' +
        'apparatus, relaxing the smooth muscle — vasodilation. This NO-cGMP-PKG axis sets vascular tone and is ' +
        'the target of nitrates, PDE5 inhibitors, and the sGC stimulator riociguat.',
      'endothelin-1 vasoconstriction':
        'Opposing vasodilation, endothelial cells also make endothelin-1, one of the most potent endogenous ' +
        'vasoconstrictors, acting on smooth-muscle ETA receptors. The balance of NO (dilator) and endothelin ' +
        '(constrictor) sets vascular tone — and endothelin antagonists (bosentan) treat pulmonary arterial ' +
        'hypertension.',
    },
  },
];

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let totalAdded = 0;
for (const { slug, notes } of BATCH) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  let added = 0;
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = notes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(notes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
  console.log(`${slug}: added ${added} step notes`);
  totalAdded += added;
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`batch M total: ${totalAdded} notes`);
