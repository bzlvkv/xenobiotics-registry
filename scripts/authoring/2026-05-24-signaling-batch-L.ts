/**
 * 2026-05-24-signaling-batch-L.ts
 *
 * step.note grind, batch L — 4 well-cited drug-effect pathways + 2 canonical
 * cell-bio skeletons, notes-only. All refs title-checked via esummary
 * 2026-05-24 and topically ground these notes:
 *   carbonic_anhydrase_paresthesia  PMID:4964060,18167490,10768298,37368102
 *   minoxidil_anagen_synchronization  PMID:31496654,14996087,2465357,3722507,24773771
 *   pde5_pde6_blue_tint_vision      PMID:19132801,10541153,12207947,15294449,15126148
 *   ssri_discontinuation_brain_zaps PMID:38851198,25721705,10863885,9219489,30292574
 *   nlrp3_inflammasome              PMID:20303873 (Cell), 30026524 (NRDD)
 *   tgf_beta_signaling              PMID:22992590 (NRMCB, TGFβ in context)
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-L.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'carbonic_anhydrase_paresthesia',
    notes: {
      'topiramate carbonic anhydrase inhibition (CA II, IV, V, VI, VII)':
        'Topiramate, beyond its anticonvulsant actions, is a weak inhibitor of several carbonic anhydrase ' +
        'isoenzymes (CA II, IV, V, VI, VII). This off-target CA inhibition — shared with acetazolamide and ' +
        'zonisamide — is responsible for several of its characteristic side effects: paresthesia, kidney stones, ' +
        'and metabolic acidosis.',
      'carbonic anhydrase inhibition (CA II, IV, V, VI, VII) impaired renal HCO3⁻ reabsorption in proximal tubule':
        'Inhibiting carbonic anhydrase in the proximal renal tubule impairs bicarbonate (HCO3⁻) reabsorption, so ' +
        'bicarbonate is lost in the urine. This is the same mechanism by which acetazolamide acts as a diuretic ' +
        'and alkalinizes urine — here it is an unintended consequence of topiramate’s CA inhibition.',
      'impaired renal HCO3⁻ reabsorption in proximal tubule mild systemic metabolic acidosis + ↓ionized Ca²⁺':
        'Renal bicarbonate wasting produces a mild hyperchloremic metabolic acidosis, and the acid-base shift ' +
        'lowers ionized calcium. This systemic chemistry change — rather than any direct neural drug effect — is ' +
        'the proximate cause of the nerve hyperexcitability that follows.',
      'mild systemic metabolic acidosis + ↓ionized Ca²⁺ increased peripheral sensory nerve excitability (distal-symmetric)':
        'Metabolic acidosis and reduced ionized calcium increase peripheral sensory nerve excitability, lowering ' +
        'the threshold for spontaneous firing in a distal-symmetric (longest-nerve-first) pattern. This parallels ' +
        'the paresthesia of hyperventilation alkalosis, where altered ionized calcium similarly destabilizes nerve ' +
        'membranes.',
      'increased peripheral sensory nerve excitability (distal-symmetric) paresthesia ("tingling fingers + toes") + partial tolerance over weeks':
        'The result is the classic topiramate paresthesia — tingling in the fingers and toes — usually mild and ' +
        'often subsiding partially over weeks as compensation develops. Recognizing it as a benign, predictable ' +
        'CA-inhibition effect (sometimes eased by potassium/bicarbonate) avoids unnecessary discontinuation.',
    },
  },
  {
    slug: 'minoxidil_anagen_synchronization',
    notes: {
      'minoxidil SULT1A1 conversion to minoxidil sulfate (in follicle)':
        'Minoxidil is a prodrug: the follicular enzyme sulfotransferase SULT1A1 converts it to the active ' +
        'minoxidil sulfate. Because individuals vary widely in follicular SULT1A1 activity, this conversion ' +
        'predicts who responds — and a SULT1A1 assay can forecast topical-minoxidil efficacy.',
      'SULT1A1 conversion to minoxidil sulfate (in follicle) K+ATP channel opening + dermal papilla VEGF / PGE2 / β-catenin signaling':
        'Minoxidil sulfate opens ATP-sensitive potassium (KATP) channels and stimulates dermal-papilla signaling ' +
        '(VEGF, PGE2, Wnt/β-catenin). These combined vascular and growth-factor effects prolong anagen and enlarge ' +
        'miniaturized follicles — the pro-growth actions underlying its benefit in AGA.',
      'K+ATP channel opening + dermal papilla VEGF / PGE2 / β-catenin signaling shortened telogen phase + premature anagen entry across follicles':
        'By driving resting (telogen) follicles prematurely into the growth (anagen) phase, minoxidil synchronizes ' +
        'a cohort of follicles into a new cycle. This forced telogen-to-anagen transition is the key to its ' +
        'effect — but also sets up the transient shedding that precedes regrowth.',
      'shortened telogen phase + premature anagen entry across follicles visible shed at weeks 2-8 (old telogen hairs displaced by new anagen)':
        'As old telogen (club) hairs are pushed out by new anagen hairs emerging beneath them, users see a ' +
        'temporary increase in shedding around weeks 2-8 — the well-known “dread shed”. Counterintuitively this ' +
        'signals the drug is working, and it is self-limiting; warning patients prevents premature discontinuation.',
      'visible shed at weeks 2-8 (old telogen hairs displaced by new anagen) new anagen hair growth visible at weeks 12-16, full effect 6-12 months':
        'New anagen hair becomes visible around weeks 12-16, with full effect by 6-12 months — the slow timeline ' +
        'set by hair-cycle biology. This is why minoxidil must be judged at months, not weeks, and why benefits ' +
        'reverse within months of stopping as follicles revert to their prior cycling.',
    },
  },
  {
    slug: 'pde5_pde6_blue_tint_vision',
    notes: {
      'sildenafil PDE5 inhibition (intended target) + PDE6 cross-inhibition (off-target)':
        'Sildenafil inhibits PDE5 (its intended vascular target) but also weakly cross-inhibits the closely ' +
        'related PDE6 — the phototransduction enzyme of the retina. This off-target PDE6 affinity (greater for ' +
        'sildenafil than tadalafil) is the entire basis of its visual side effects.',
      'PDE5 inhibition (intended target) + PDE6 cross-inhibition (off-target) raised retinal cGMP in rod + cone outer segments':
        'PDE6 normally hydrolyzes cGMP in rod and cone outer segments to terminate the light response; inhibiting ' +
        'it raises retinal cGMP. Elevated cGMP perturbs the phototransduction cascade — the molecular step linking ' +
        'a systemic vasoactive drug to a visual disturbance.',
      'raised retinal cGMP in rod + cone outer segments altered CNG channel gating + disproportionate S-cone (blue) response shift':
        'Raised cGMP alters gating of the cyclic-nucleotide-gated (CNG) channels, shifting the photoreceptor ' +
        'response — disproportionately affecting the blue-sensitive S-cone pathway. This selective effect on ' +
        'blue/yellow discrimination is why the disturbance is characteristically a blue tint.',
      'altered CNG channel gating + disproportionate S-cone (blue) response shift transient blue tint / blue haze / increased brightness sensitivity':
        'The perceptual result is a transient bluish tint or haze and increased brightness/light sensitivity — the ' +
        'classic, dose-related sildenafil visual effect. It is usually mild and reversible, distinct from the ' +
        'rare, serious concern of non-arteritic ischemic optic neuropathy (NAION).',
      'transient blue tint / blue haze / increased brightness sensitivity resolution as plasma sildenafil clears (t½ ~4 h)':
        'Because the effect tracks plasma drug level, it resolves as sildenafil is cleared (half-life ~4 h) — ' +
        'appearing near peak concentration and fading within hours. The longer half-life of tadalafil (and its ' +
        'lower PDE6 affinity) gives it a different visual side-effect profile.',
    },
  },
  {
    slug: 'ssri_discontinuation_brain_zaps',
    notes: {
      'fluvoxamine tonic central 5-HT transporter inhibition + receptor adaptation':
        'Chronic SSRI use (e.g. fluvoxamine) tonically inhibits the central serotonin transporter (SERT), and the ' +
        'brain adapts — downregulating postsynaptic receptors and resetting serotonergic tone. This adaptation is ' +
        'why the system is destabilized when the drug is suddenly removed, the basis of discontinuation symptoms.',
      'tonic central 5-HT transporter inhibition + receptor adaptation abrupt loss of SERT occupancy on dose miss / taper':
        'On a missed dose or rapid taper, SERT occupancy falls abruptly — and the speed of this drop matters more ' +
        'than the absolute level. Short-half-life agents (paroxetine, fluvoxamine, venlafaxine) cause the steepest ' +
        'falls and the worst discontinuation, while long-half-life fluoxetine self-tapers and rarely does.',
      'abrupt loss of SERT occupancy on dose miss / taper serotonergic-cholinergic imbalance + GABAergic perturbation':
        'The sudden serotonergic change disturbs downstream systems — a serotonergic-cholinergic imbalance and ' +
        'GABAergic/glutamatergic perturbation. These secondary neurotransmitter shifts (not serotonin alone) are ' +
        'thought to generate the diverse, sometimes bizarre, discontinuation phenomena.',
      'serotonergic-cholinergic imbalance + GABAergic perturbation paroxysmal sensory phenomena — "brain zaps" + lateral-gaze trigger':
        'A hallmark symptom is the “brain zap” — a brief, electric-shock-like sensory paroxysm, often triggered by ' +
        'lateral eye movement. Though benign and poorly understood, its distinctive, stereotyped quality makes it ' +
        'a recognizable marker of SSRI/SNRI discontinuation rather than relapse.',
      'paroxysmal sensory phenomena — "brain zaps" + lateral-gaze trigger resolution over 1-6 weeks (or on dose resumption / fluoxetine bridge)':
        'Symptoms typically resolve over 1-6 weeks as the brain re-equilibrates, and they abate quickly if the ' +
        'drug is resumed — the basis for slow tapering or bridging with long-half-life fluoxetine. Their relief on ' +
        'resumption also helps distinguish discontinuation from a depressive relapse.',
    },
  },
  {
    slug: 'nlrp3_inflammasome',
    notes: {
      'tlr-priming-signal nlrp3-pro-il1b-upregulated':
        'NLRP3 activation requires two signals. Signal 1 (priming) is typically a TLR/NF-κB stimulus that ' +
        'transcriptionally upregulates NLRP3 itself and pro-IL-1β — neither present at rest. This two-step ' +
        'requirement is a safety catch preventing inadvertent release of the potent cytokine IL-1β.',
      'danger-signal nlrp3-activation':
        'Signal 2 (activation) is a diverse set of danger signals — ATP, pore-forming toxins, crystals (urate, ' +
        'cholesterol, silica), and ionic flux (notably K⁺ efflux) — that trigger NLRP3 to oligomerize and ' +
        'nucleate the inflammasome. The breadth of activators is why NLRP3 is central to so many sterile ' +
        'inflammatory diseases.',
      'nlrp3-activation caspase-1-activation':
        'Assembled NLRP3 recruits the adaptor ASC, which clusters and activates caspase-1 by induced proximity. ' +
        'This is the catalytic core of the inflammasome — converting danger recognition into an active protease, ' +
        'and the step targeted by direct NLRP3 inhibitors (MCC950) in development.',
      'caspase-1-activation il-1beta-secretion':
        'Active caspase-1 cleaves pro-IL-1β (and pro-IL-18) to their mature forms and cleaves gasdermin D to drive ' +
        'their release (and pyroptosis). IL-1β is a potent pyrogenic, pro-inflammatory cytokine — which is why ' +
        'IL-1 blockade (anakinra, canakinumab) treats inflammasome-driven diseases.',
    },
  },
  {
    slug: 'tgf_beta_signaling',
    notes: {
      'tgf-beta-ligand tgfbr1-tgfbr2-activation':
        'TGF-β signaling begins when the ligand binds the type II receptor (TGFBR2), which recruits and ' +
        'transphosphorylates the type I receptor (TGFBR1/ALK5). This receptor pairing is the activation switch — ' +
        'and its context-dependence (the same ligand can suppress or promote tumors) is a hallmark of the pathway.',
      'tgfbr1-tgfbr2-activation smad2-smad3-phosphorylation':
        'Activated TGFBR1 phosphorylates the receptor-regulated SMADs, SMAD2 and SMAD3, on their C-terminal tails. ' +
        'This is the canonical transduction step, tunable by inhibitory SMAD7 and by receptor turnover — providing ' +
        'built-in negative feedback.',
      'smad2-smad3-phosphorylation smad2-3-4-complex-nuclear':
        'Phospho-SMAD2/3 partner with the common mediator SMAD4 and translocate to the nucleus as a complex. The ' +
        'requirement for SMAD4 (a frequently deleted tumor suppressor) explains why its loss disables the ' +
        'growth-suppressive arm of TGF-β signaling in cancer.',
      'smad2-3-4-complex-nuclear ecm-gene-transcription':
        'In the nucleus the SMAD complex, with cofactors, drives target genes — prominently extracellular-matrix ' +
        'components (collagens) and regulators of growth and EMT. The ECM-inducing output is central to tissue ' +
        'fibrosis, making TGF-β a key antifibrotic target.',
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
console.log(`batch L total: ${totalAdded} notes`);
