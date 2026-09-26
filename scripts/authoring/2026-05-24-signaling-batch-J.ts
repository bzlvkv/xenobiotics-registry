/**
 * 2026-05-24-signaling-batch-J.ts
 *
 * step.note grind, batch J — 6 well-cited supplement/drug-effect pathways,
 * notes-only. All 28 existing refs title-checked via esummary 2026-05-24 and
 * topically ground these notes (each pathway already carries 4-5 refs):
 *   caffeine_a1_cardiac_ectopy           PMID:10049999,2193560,36947466,16522833,22058665
 *   creatine_intracellular_water_pump    PMID:8828669,28615996,12937471,10449017
 *   niacin_gpr109a_skin_flush            PMID:12563315,16322797,17008386,16617107,20664170
 *   glp1_central_appetite_food_noise     PMID:33567185,35658024,29617641,26831302,25071023
 *   melatonin_rem_rebound_grogginess     PMID:8988899,11600532,20410229,26414986,25380732
 *   beta_alanine_mrgprd_paresthesia      PMID:15037633,23077038,25636080,26175657,29066740
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-J.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'caffeine_a1_cardiac_ectopy',
    notes: {
      'caffeine A1 / A2A adenosine receptor antagonism':
        'Caffeine’s cardiac effects begin with competitive antagonism of adenosine A1 and A2A receptors — it is a ' +
        'structural analog of adenosine. At ordinary dietary doses this receptor blockade (not phosphodiesterase ' +
        'inhibition, which needs far higher levels) is the dominant mechanism behind caffeine’s actions.',
      'A1 / A2A adenosine receptor antagonism loss of tonic adenosinergic brake on SA + AV nodes':
        'Adenosine normally exerts a tonic inhibitory “brake” on the SA and AV nodes — slowing rate and ' +
        'conduction, the basis of using IV adenosine to terminate SVT. By blocking A1 receptors, caffeine removes ' +
        'this brake, nudging the conduction system toward faster, more excitable behavior.',
      'loss of tonic adenosinergic brake on SA + AV nodes secondary catecholamine release + raised sympathetic tone':
        'Losing the adenosinergic brake also raises sympathetic tone and secondary catecholamine release, further ' +
        'increasing automaticity and the chance of ectopic beats. This sympathetic arm is why caffeine’s cardiac ' +
        'effects are amplified by stress, sleep deprivation, or other stimulants.',
      'secondary catecholamine release + raised sympathetic tone increased PVCs / premature atrial complexes':
        'The net result is a greater tendency to premature ventricular contractions (PVCs) and premature atrial ' +
        'complexes — ectopic beats arising outside the normal pacemaker. Notably, large studies (and a randomized ' +
        'NEJM coffee trial) show this effect is modest and inconsistent, so routine caffeine restriction for ' +
        'ectopy is often unwarranted.',
      'increased PVCs / premature atrial complexes palpitations / "skipped beats" sensation':
        'Ectopic beats are felt as palpitations or “skipped beats” — the compensatory pause after a PVC and the ' +
        'forceful next beat are what the person actually notices. The sensation’s intensity correlates poorly ' +
        'with arrhythmic risk, which is usually benign in structurally normal hearts.',
    },
  },
  {
    slug: 'creatine_intracellular_water_pump',
    notes: {
      'creatine SLC6A8 (CRT1) Na+/Cl⁻-coupled uptake into myocyte':
        'Creatine is actively transported into muscle by the sodium/chloride-coupled transporter SLC6A8 (CRT1). ' +
        'Because uptake is Na⁺-driven and saturable, it is rate-limiting — and is downregulated by high creatine, ' +
        'which is why loading plateaus and why co-ingested carbohydrate (insulin) enhances uptake.',
      'SLC6A8 (CRT1) Na+/Cl⁻-coupled uptake into myocyte intracellular creatine + phosphocreatine pool expansion (~+20% total Cr)':
        'Loading expands the intramuscular total creatine pool (free creatine + phosphocreatine) by roughly 20%. ' +
        'The phosphocreatine increase is the ergogenic part — buffering ATP regeneration during short, intense ' +
        'efforts — while the osmotic consequence of the larger pool drives the water effect.',
      'intracellular creatine + phosphocreatine pool expansion (~+20% total Cr) intracellular osmotic load → water draw across sarcolemma':
        'Creatine is osmotically active, so expanding its intracellular pool raises intracellular osmolarity and ' +
        'draws water across the sarcolemma into the myocyte. This intracellular (not extracellular) water shift is ' +
        'the basis of creatine-associated water retention — distinct from bloating or subcutaneous fluid.',
      'intracellular osmotic load → water draw across sarcolemma myocyte volume expansion (~3-5%) + total body water rise without ECW shift':
        'The osmotic draw expands myocyte volume by ~3-5% and raises total body water, but the gain is ' +
        'intracellular with no rise in extracellular water. Cell swelling may itself be an anabolic signal, and ' +
        'the absence of an ECW shift is why creatine water retention is not edema.',
      'myocyte volume expansion (~3-5%) + total body water rise without ECW shift subjective "muscle fullness" + visible muscle belly thickening':
        'Subjectively this is felt as “muscle fullness” and shows as a slightly thicker muscle belly and rapid ' +
        'early scale-weight gain (largely water). Recognizing this as intracellular water — not fat or true ' +
        'hypertrophy — explains the quick 1-2 kg gain in the first week of creatine loading.',
    },
  },
  {
    slug: 'niacin_gpr109a_skin_flush',
    notes: {
      'niacin GPR109A activation':
        'The niacin flush is a receptor-mediated, prostaglandin-driven reflex, not a direct vascular effect. ' +
        'Niacin (nicotinic acid) activates GPR109A (HCA2/PUMA-G), the Gi-coupled receptor that also mediates its ' +
        'lipid effects and that butyrate activates. Identifying this receptor explained why flushing and ' +
        'lipid-lowering trace to one target.',
      'GPR109A activation cytosolic Ca²⁺ rise + PLA2 activation':
        'On skin immune cells (Langerhans cells, keratinocytes), GPR109A activation raises cytosolic Ca²⁺ and ' +
        'activates phospholipase A2, liberating arachidonic acid. This is the first committed step toward the ' +
        'prostaglandin burst that causes the flush — where the signal leaves the niacin receptor for the ' +
        'eicosanoid pathway.',
      'PLA2 activation PGD2 synthesis (COX-1 Langerhans, COX-2 keratinocytes)':
        'Arachidonic acid is converted to prostaglandin D2 (and E2) by cyclooxygenases — COX-1 in Langerhans ' +
        'cells (the early flush) and COX-2 in keratinocytes (the later, sustained phase). This is why aspirin (a ' +
        'COX inhibitor) taken beforehand blunts the niacin flush, a common clinical workaround.',
      'PGD2 synthesis (COX-1 Langerhans, COX-2 keratinocytes) DP1 receptor activation on dermal vascular smooth muscle':
        'The PGD2 released acts on the DP1 receptor of dermal vascular smooth muscle. The finding that DP1 ' +
        'antagonism suppresses flushing led to laropiprant, a DP1 blocker co-formulated with niacin to prevent the ' +
        'flush (though the combination was later withdrawn for lack of outcome benefit).',
      'DP1 receptor activation on dermal vascular smooth muscle cutaneous vasodilation (flush: warmth, redness, tingle, itch)':
        'DP1 activation relaxes dermal vascular smooth muscle, producing cutaneous vasodilation — the warmth, ' +
        'redness, tingling, and itch of the flush, typically over the face and upper body. Though harmless, this ' +
        'flush is the main reason patients quit niacin, hence extended-release forms and aspirin pretreatment.',
    },
  },
  {
    slug: 'glp1_central_appetite_food_noise',
    notes: {
      'semaglutide GLP-1R activation (central + peripheral)':
        'Semaglutide is a long-acting GLP-1 receptor agonist that resists DPP-4 degradation, giving a weekly ' +
        'half-life. It activates GLP-1Rs both peripherally and in the brain — and the realization that the central ' +
        'receptors drive most of the weight effect reframed these drugs from glucose-lowering to anti-obesity ' +
        'agents.',
      'GLP-1R activation (central + peripheral) delayed gastric emptying + early satiety + insulin secretion':
        'Peripherally, GLP-1R activation slows gastric emptying and stimulates glucose-dependent insulin secretion ' +
        'while suppressing glucagon. Delayed emptying and the resulting early satiety reduce intake (and cause the ' +
        'nausea that is the main side effect), complementing the central appetite effects.',
      'GLP-1R activation (central + peripheral) hypothalamic POMC drive + AgRP suppression':
        'Centrally, GLP-1R agonism acts on the hypothalamic arcuate nucleus to increase anorexigenic POMC/CART ' +
        'signaling and suppress orexigenic AgRP/NPY neurons. This directly shifts the energy-balance set point ' +
        'toward reduced food intake — the core of the drugs’ appetite suppression.',
      'hypothalamic POMC drive + AgRP suppression reduced fMRI signal in ventral striatum / insula / OFC to food cues':
        'Beyond the hypothalamus, GLP-1R signaling dampens food-reward circuitry: functional imaging shows reduced ' +
        'responses in the ventral striatum, insula, and orbitofrontal cortex to food cues. This blunting of reward ' +
        'salience — not just hunger — is a distinctive feature of GLP-1-based weight loss.',
      'reduced fMRI signal in ventral striatum / insula / OFC to food cues "food noise" quieting + intake reduction + weight loss':
        'Patients describe the result as quieting of “food noise” — the intrusive, constant thoughts about eating ' +
        '— alongside smaller portions and weight loss. This subjective reward/craving change helps explain why ' +
        'GLP-1 agonists reduce intake more durably than appetite-suppressants acting on hunger alone.',
    },
  },
  {
    slug: 'melatonin_rem_rebound_grogginess',
    notes: {
      'melatonin MT1 + MT2 receptor activation in SCN':
        'Melatonin acts on two high-affinity GPCRs, MT1 and MT2, concentrated in the SCN (the master clock). MT1 ' +
        'chiefly mediates the acute sleep-promoting effect and MT2 the circadian phase-shifting effect — a ' +
        'division exploited by ramelteon (an MT1/MT2 agonist) for insomnia.',
      'MT1 + MT2 receptor activation in SCN circadian phase shift + sleep onset facilitation':
        'In the SCN, melatonin both facilitates sleep onset and shifts circadian phase depending on timing. Per ' +
        'the phase-response curve, evening melatonin advances the clock (earlier sleep) and morning melatonin ' +
        'delays it — which is why correct timing, often more than dose, determines efficacy for jet lag and DSPD.',
      'MT1 + MT2 receptor activation in SCN REM facilitation + reduced early-night arousals → REM-dense sleep architecture':
        'Melatonin tends to facilitate REM sleep and reduce early-night arousals, biasing sleep architecture ' +
        'toward more consolidated, REM-dense sleep. This REM effect, rather than a large change in total sleep ' +
        'time, is one reason exogenous melatonin’s hypnotic effect is modest versus classic sedatives.',
      'REM facilitation + reduced early-night arousals → REM-dense sleep architecture vivid dreams (the night-of phenomenology)':
        'The REM-dense architecture is the proximate cause of the vivid (sometimes bizarre) dreams many report on ' +
        'melatonin — a “night-of” phenomenology rather than a true side effect. It reflects more time in the sleep ' +
        'stage where vivid dreaming occurs, especially at higher doses.',
      'plasma melatonin concentration > physiologic peak (3-10 mg dose) morning grogginess + hangover':
        'Common doses (3-10 mg) push plasma melatonin far above the physiologic nocturnal peak, and the long ' +
        'supraphysiologic tail can persist into the morning. This residual melatonin causes next-day ' +
        'grogginess/“hangover” — the basis for recommending much lower doses (0.3-1 mg) timed correctly instead.',
    },
  },
  {
    slug: 'beta_alanine_mrgprd_paresthesia',
    notes: {
      'beta-alanine MrgprD activation':
        'The harmless tingling from beta-alanine is a specific receptor effect, not general nerve irritation: ' +
        'beta-alanine is an agonist at MrgprD, a Mas-related GPCR expressed selectively on a subset of sensory ' +
        '(C-fiber) neurons that mediate itch and light touch. Identifying MrgprD explained the distinctive, ' +
        'dose-related paresthesia.',
      'MrgprD activation Gq → PLCβ signaling':
        'MrgprD couples to Gq, activating phospholipase C-β. This is the standard Gq cascade — the same one used ' +
        'by many itch and irritant receptors — channeling the beta-alanine signal toward calcium release rather ' +
        'than cAMP changes.',
      'Gq → PLCβ signaling IP3 → ER Ca²⁺ release':
        'PLCβ cleaves PIP2 to IP3, which opens ER IP3 receptors to release stored Ca²⁺ into the cytosol. This rise ' +
        'in intracellular calcium is the second-messenger step that converts receptor activation into electrical ' +
        'excitation of the sensory neuron.',
      'IP3 → ER Ca²⁺ release C-fiber depolarization (action potential)':
        'The calcium rise (with downstream channel effects) depolarizes the C-fiber to threshold, firing action ' +
        'potentials along these itch/touch-sensing afferents. Because MrgprD-positive fibers are a defined sensory ' +
        'population, the sensation is specific in quality and location rather than diffuse pain.',
      'C-fiber depolarization (action potential) paresthesia (tingle / prickle / mild itch)':
        'The brain interprets this C-fiber input as paresthesia — tingling, prickling, or mild itch, typically on ' +
        'the face, scalp, and hands minutes after a dose. It is benign and self-limiting; splitting the dose or ' +
        'using sustained-release beta-alanine reduces it without affecting the muscle-carnosine benefit.',
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
console.log(`batch J total: ${totalAdded} notes`);
