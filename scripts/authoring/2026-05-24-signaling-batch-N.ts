/**
 * 2026-05-24-signaling-batch-N.ts
 *
 * step.note grind, batch N — 10 gap-3 receptor/axis/cell-bio skeletons,
 * notes-only. Refs title-checked via esummary 2026-05-24:
 *   adrenergic_receptor_signaling  PMID:17216434,15655520
 *   dopamine_receptor_signaling    PMID:21303898 (Pharmacol Rev)
 *   opioid_receptor_signaling      PMID:11152760,30792513
 *   hpa_axis                       PMID:17615391,3041279
 *   hpt_axis                       PMID:22945636 (JCI, thyroid action)
 *   raas_axis                      PMID:17970613,18378520 (ONTARGET)
 *   hif_oxygen_sensing             PMID:18498744 (Mol Cell)
 *   ros_oxidative_stress           PMID:28110218,19061483
 *   melanocortin_mc4r_axis         PMID:9620771,25600267
 *   bone_remodeling_rank_rankl     PMID:12748652,19671655 (denosumab)
 * NOTE: adrenergic + dopamine each have a "receptor-activation -> [transmitter]"
 *   back-edge loop (skeleton smell) — intentionally not annotated.
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-N.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'adrenergic_receptor_signaling',
    notes: {
      'norepinephrine adrenergic-receptor-activation':
        'Norepinephrine (and epinephrine) activate adrenergic GPCRs whose subtype sets the response: α1 (Gq, ' +
        'vasoconstriction), α2 (Gi, presynaptic autoinhibition), β1 (Gs, cardiac stimulation), β2 (Gs, ' +
        'smooth-muscle relaxation), β3 (lipolysis/thermogenesis). This subtype diversity is the basis of selective ' +
        'adrenergic drugs (β-blockers, α-agonists).',
      'norepinephrine metanephrine':
        'Norepinephrine is inactivated by reuptake (NET) and enzymatic metabolism: COMT and MAO convert it to ' +
        'normetanephrine and ultimately VMA. Plasma/urine metanephrines are the key biochemical test for ' +
        'pheochromocytoma — and blocking reuptake or metabolism (TCAs, MAO inhibitors) potentiates adrenergic ' +
        'signaling.',
    },
  },
  {
    slug: 'dopamine_receptor_signaling',
    notes: {
      'dopamine dopamine-receptor-activation':
        'Dopamine acts on five GPCR subtypes in two families: D1-like (D1, D5; Gs, raise cAMP) and D2-like (D2, ' +
        'D3, D4; Gi, lower cAMP). This D1/D2 dichotomy underlies CNS pharmacology — antipsychotics are D2 ' +
        'antagonists while Parkinson’s therapy boosts D1/D2 signaling — shaping motor, reward, and endocrine ' +
        'effects.',
      'dopamine homovanillic-acid':
        'Dopamine is cleared by reuptake (DAT) and degraded by MAO and COMT to homovanillic acid (HVA), its major ' +
        'metabolite. DAT is the target of cocaine and amphetamines, and MAO-B/COMT inhibitors are used in ' +
        'Parkinson’s to prolong dopamine action — the metabolic side of dopaminergic pharmacology.',
    },
  },
  {
    slug: 'opioid_receptor_signaling',
    notes: {
      'opioid-receptor-agonist gi-go-activation':
        'Opioid receptors (μ, δ, κ) are Gi/Go-coupled GPCRs; agonists (endorphins, enkephalins, morphine) activate ' +
        'the inhibitory G protein. The μ-receptor mediates most analgesia plus the euphoria, respiratory ' +
        'depression, and dependence of clinical opioids — the basis of both their efficacy and their danger.',
      'gi-go-activation adenylyl-cyclase-inhibition':
        'Through Gαi, opioid receptors inhibit adenylyl cyclase, lowering cAMP. Chronic opioid exposure causes ' +
        'compensatory upregulation of this cyclase system, so on withdrawal cAMP rebounds — a key molecular driver ' +
        'of opioid dependence and the withdrawal syndrome.',
      'gi-go-activation k-channel-opening-ca-closing':
        'Via Gβγ, opioid receptors open potassium channels (hyperpolarizing neurons) and close voltage-gated ' +
        'calcium channels (reducing neurotransmitter release). These two ion-channel actions are the proximate ' +
        'mechanism of opioid analgesia — dampening neuronal excitability and transmission in pain pathways.',
    },
  },
  {
    slug: 'hpa_axis',
    notes: {
      'crh acth':
        'Stress and circadian cues drive hypothalamic release of corticotropin-releasing hormone (CRH), which ' +
        'stimulates the anterior pituitary to secrete adrenocorticotropic hormone (ACTH). This is the top of the ' +
        'stress axis, integrating neural inputs into an endocrine cascade with a strong diurnal rhythm (peak at ' +
        'waking).',
      'acth cortisol':
        'ACTH stimulates the adrenal cortex (zona fasciculata) to synthesize and release cortisol, which mobilizes ' +
        'glucose, modulates immunity, and mediates the systemic stress response. Measuring cortisol with ACTH ' +
        'localizes the cause of Cushing’s or Addison’s disease.',
      'cortisol crh-suppression':
        'Cortisol feeds back negatively on the hypothalamus and pituitary to suppress CRH and ACTH, closing the ' +
        'loop and limiting the stress response. Exogenous glucocorticoids exploit and suppress this loop — chronic ' +
        'use causes adrenal suppression, so steroids must be tapered, not stopped abruptly.',
    },
  },
  {
    slug: 'hpt_axis',
    notes: {
      'trh tsh':
        'Hypothalamic thyrotropin-releasing hormone (TRH) stimulates the anterior pituitary to secrete ' +
        'thyroid-stimulating hormone (TSH). Pituitary TSH is the most sensitive clinical marker of thyroid status ' +
        'because of the steep, logarithmic feedback relationship between TSH and thyroid hormone.',
      'tsh thyroxine':
        'TSH drives the thyroid to synthesize and release thyroid hormone, predominantly thyroxine (T4) — the main ' +
        'circulating form but largely a prohormone. TSH also promotes iodide uptake and thyroid growth, which is ' +
        'why goiter develops when TSH is chronically elevated.',
      'thyroxine triiodothyronine':
        'In peripheral tissues, deiodinases convert T4 to the far more active triiodothyronine (T3), the form that ' +
        'binds nuclear thyroid receptors. This local activation (and its reverse-T3 alternative) lets tissues ' +
        'control their own thyroid exposure — and is suppressed in illness (sick-euthyroid) and by ' +
        'propylthiouracil.',
    },
  },
  {
    slug: 'raas_axis',
    notes: {
      'angiotensinogen angiotensin-i':
        'The liver constitutively secretes angiotensinogen, which renin — released by the kidney in response to ' +
        'low perfusion, low sodium, or sympathetic drive — cleaves to angiotensin I. Renin release is the ' +
        'rate-limiting, regulated step of the system, and the target of direct renin inhibitors (aliskiren).',
      'angiotensin-i angiotensin-ii':
        'Angiotensin-converting enzyme (ACE), mainly in the lung, converts inactive angiotensin I to active ' +
        'angiotensin II. ACE also degrades bradykinin — which is why ACE inhibitors both lower angiotensin II and ' +
        'cause bradykinin-mediated cough/angioedema, whereas ARBs instead block the AT1 receptor downstream.',
      'angiotensin-ii aldosterone':
        'Angiotensin II raises blood pressure directly (vasoconstriction) and indirectly by stimulating adrenal ' +
        'aldosterone release, which drives renal sodium and water retention. This volume/pressure-raising output ' +
        'is the core of the RAAS — and the reason its blockade is central to hypertension, heart failure, and CKD.',
    },
  },
  {
    slug: 'hif_oxygen_sensing',
    notes: {
      'hif-alpha-protein hif-alpha-hydroxylated':
        'HIF-α is produced constitutively but, when oxygen is present, is hydroxylated on proline residues by ' +
        'prolyl hydroxylases (PHDs). The PHDs use molecular O2 as a substrate, making them direct cellular oxygen ' +
        'sensors — the molecular basis of how cells “measure” oxygen, recognized by the 2019 Nobel Prize.',
      'hif-alpha-hydroxylated vhl-degradation':
        'Hydroxylated HIF-α is recognized by the von Hippel-Lindau (VHL) E3 ligase and rapidly ubiquitinated for ' +
        'proteasomal degradation. So in normoxia HIF-α is destroyed within minutes; VHL loss-of-function (VHL ' +
        'disease, clear-cell renal cancer) stabilizes HIF constitutively, driving tumor angiogenesis.',
      'hif-alpha-stabilized epo-vegf-glycolytic-transcription':
        'In hypoxia, hydroxylation stops, so HIF-α is stabilized, enters the nucleus, dimerizes with HIF-β, and ' +
        'transcribes adaptive genes — erythropoietin (EPO), VEGF (angiogenesis), and glycolytic enzymes. PHD ' +
        'inhibitors that stabilize HIF are now used to treat the anemia of chronic kidney disease.',
    },
  },
  {
    slug: 'ros_oxidative_stress',
    notes: {
      'electron-transport-leak superoxide':
        'Reactive oxygen species arise mainly as a byproduct of the mitochondrial electron transport chain: ' +
        'electrons leaking from complexes I and III reduce O2 to superoxide. A few percent of consumed oxygen ' +
        'becomes superoxide, making mitochondria the dominant ROS source and a key site of oxidative damage and ' +
        'signaling.',
      'superoxide hydrogen-peroxide':
        'Superoxide is rapidly converted to hydrogen peroxide by superoxide dismutase — mitochondrial MnSOD (SOD2) ' +
        'and cytosolic Cu/ZnSOD (SOD1). H2O2 is more stable and membrane-permeant, so it doubles as the main redox ' +
        'signaling molecule (oxidizing target cysteines) and a damage agent.',
      'hydrogen-peroxide water':
        'Hydrogen peroxide is detoxified to water by catalase and the glutathione/peroxiredoxin peroxidase ' +
        'systems. The balance between ROS production and this antioxidant removal sets the redox state — mild ROS ' +
        'act as signals (hormesis), while overwhelming the defenses causes the oxidative stress of aging and ' +
        'disease.',
    },
  },
  {
    slug: 'melanocortin_mc4r_axis',
    notes: {
      'pomc alpha-msh':
        'Pro-opiomelanocortin (POMC) is a precursor cleaved by prohormone convertases into several peptides, ' +
        'including α-melanocyte-stimulating hormone (α-MSH) and ACTH. The same precursor serves pigmentation, ' +
        'adrenal, and appetite functions — and POMC mutations cause early-onset obesity with adrenal ' +
        'insufficiency and red hair.',
      'alpha-msh mc1r-melanogenesis':
        'α-MSH acts on the melanocortin-1 receptor (MC1R) on melanocytes to stimulate eumelanin (brown/black ' +
        'pigment) synthesis. MC1R variants that weaken this signaling give red hair, fair skin, and poor tanning ' +
        '— raising melanoma risk; this is the receptor mimicked by tanning peptides like afamelanotide.',
      'alpha-msh mc4r-appetite-suppression':
        'In the hypothalamus, α-MSH acts on the melanocortin-4 receptor (MC4R) to suppress appetite — the dominant ' +
        'central anorexigenic signal, opposed by AgRP. MC4R is the most common monogenic cause of obesity, and ' +
        'MC4R agonists (setmelanotide) treat specific genetic obesity syndromes.',
    },
  },
  {
    slug: 'bone_remodeling_rank_rankl',
    notes: {
      'rankl osteoclast-activation':
        'RANKL, expressed by osteoblasts/osteocytes, binds RANK on osteoclast precursors to drive their ' +
        'differentiation and activation — the master signal for bone resorption. Its decoy receptor ' +
        'osteoprotegerin (OPG) opposes it, so the RANKL:OPG ratio sets resorption; the antibody denosumab blocks ' +
        'RANKL to treat osteoporosis.',
      'osteocyte-sclerostin osteoblast-suppression':
        'Osteocytes (the mechanosensing cells embedded in bone) secrete sclerostin, which inhibits Wnt signaling ' +
        'in osteoblasts to suppress bone formation. Blocking sclerostin (romosozumab) unleashes osteoblast ' +
        'activity — a bone-anabolic therapy — making this a key formation-side drug target.',
      'intermittent-pth osteoblast-activation':
        'Intermittent PTH (as opposed to continuous) preferentially activates osteoblasts, favoring bone formation ' +
        'over resorption. This anabolic window is the basis of teriparatide therapy — the same hormone that, when ' +
        'chronically elevated, is catabolic to bone, showing how dosing pattern determines the effect.',
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
console.log(`batch N total: ${totalAdded} notes`);
