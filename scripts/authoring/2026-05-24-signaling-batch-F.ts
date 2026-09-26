/**
 * 2026-05-24-signaling-batch-F.ts
 *
 * step.note grind, batch F — 5 pathways, notes-only. Existing refs
 * title-checked via esummary 2026-05-24 and topically ground these notes:
 *   atherosclerosis_plaque_pathology  PMID:33883728 (Nature, changing landscape)
 *   wound_healing_cascade             PMID:38528155 (NRMCB wound healing)
 *   asthma_th2_eosinophil_inflammation  PMID:32319104 (Type 2 immunity)
 *   nafld_mash_steatohepatitis        PMID:38851997 (EASL guidelines), 39609545 (MASH Rx)
 *   neuroinflammation_microglia_priming  PMID:32807643, 33182554
 * Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-signaling-batch-F.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  {
    slug: 'atherosclerosis_plaque_pathology',
    notes: {
      'cardiovascular risk factors (LDL ↑, HTN, smoking, DM, ↓NO) endothelial dysfunction':
        'Atherosclerosis begins with endothelial dysfunction: risk factors (high LDL, hypertension, smoking, ' +
        'diabetes) reduce nitric-oxide bioavailability and make the endothelium pro-inflammatory and permeable. ' +
        'Disturbed flow at branch points explains why plaques form at characteristic sites — the earliest, ' +
        'still-reversible stage.',
      'circulating LDL subendothelial retention + oxidation (oxLDL)':
        'ApoB lipoproteins (LDL) cross the activated endothelium and are retained by binding arterial ' +
        'proteoglycans, then modified (oxidized) to oxLDL. This subendothelial LDL retention is the initiating ' +
        'causal event — the basis of the “lower LDL is better” principle behind statins and PCSK9 inhibitors.',
      'monocyte adhesion + migration macrophage foam cells (fatty streaks)':
        'oxLDL activates the endothelium to recruit monocytes, which enter the intima as macrophages and ingest ' +
        'oxLDL via scavenger receptors — unregulated uptake that turns them into lipid-laden foam cells. ' +
        'Aggregated foam cells form the fatty streak, the first visible lesion and the engine of plaque ' +
        'inflammation.',
      'VSMC migration from media fibrous cap formation':
        'Vascular smooth-muscle cells migrate from the media into the intima and switch to a synthetic phenotype, ' +
        'laying down collagen to form a fibrous cap over the lipid core. This cap is protective — its thickness ' +
        'and collagen content determine whether a plaque stays stable or becomes rupture-prone.',
      'apoptotic foam cells + cholesterol crystals necrotic core + NLRP3 inflammasome activation':
        'As foam cells die and efferocytosis fails, their debris and cholesterol crystals coalesce into a necrotic ' +
        'lipid core. The crystals activate the NLRP3 inflammasome (IL-1β), driving the sterile inflammation that ' +
        'destabilizes plaque — the rationale for anti-IL-1β therapy (canakinumab) in cardiovascular disease.',
      'thin-cap fibroatheroma + sustained inflammation plaque rupture / erosion':
        'A thin-cap fibroatheroma — a large necrotic core under a thin, inflamed, collagen-poor cap — is the ' +
        'vulnerable plaque. Inflammatory proteases (MMPs) degrade the cap while smooth-muscle death limits repair. ' +
        'Most heart attacks arise from such lesions, often not the most stenotic ones.',
      'rupture exposure of thrombogenic core platelet activation + coagulation → arterial thrombus':
        'When the cap ruptures or erodes, the thrombogenic core meets blood: exposed tissue factor and collagen ' +
        'trigger platelet activation and the coagulation cascade, forming an occlusive thrombus. This acute ' +
        'thrombosis — not gradual narrowing — causes most infarctions and strokes, and is why antiplatelet therapy ' +
        'is central.',
    },
  },
  {
    slug: 'wound_healing_cascade',
    notes: {
      'wound + tissue injury platelet aggregation + fibrin clot':
        'Healing begins immediately with hemostasis: platelets aggregate at the injury and a fibrin clot forms to ' +
        'stop bleeding. The clot is also a provisional matrix and a reservoir of platelet-released growth factors ' +
        '(PDGF, TGF-β) that recruit cells for the next phases — so hemostasis and inflammation are linked.',
      'DAMPs + chemokines neutrophil influx (1–3 d) → macrophage influx (3–7 d)':
        'The inflammatory phase follows a defined sequence: DAMPs and chemokines draw neutrophils (days 1-3) to ' +
        'kill bacteria and debride, then monocyte-derived macrophages (days 3-7). Macrophages orchestrate the ' +
        'switch from inflammation toward repair; failure here underlies chronic non-healing wounds.',
      'macrophage M2 + growth factors keratinocyte migration → re-epithelialization':
        'As macrophages adopt a reparative (M2) phenotype and release growth factors, edge keratinocytes ' +
        'proliferate and migrate across the provisional matrix to restore the epidermal barrier ' +
        '(re-epithelialization). Migration halts on contact once the surface is covered.',
      'VEGF + FGF angiogenesis → new capillary network':
        'VEGF and FGF drive angiogenesis — new capillaries sprout into the wound to supply oxygen and nutrients ' +
        'for the metabolically demanding repair. This neovascularization gives granulation tissue its red, ' +
        'granular look; inadequate angiogenesis (as in diabetes) is a major cause of impaired healing.',
      'fibroblast migration + proliferation granulation tissue (type III collagen + GAGs)':
        'Fibroblasts migrate in and proliferate, depositing a provisional matrix of type III collagen and ' +
        'glycosaminoglycans to build granulation tissue. This new connective-tissue scaffold replaces the fibrin ' +
        'clot and provides the substrate on which contraction and remodeling occur.',
      'myofibroblast differentiation (α-SMA+) wound contraction':
        'Some fibroblasts differentiate into α-SMA-expressing myofibroblasts that generate contractile force, ' +
        'pulling the wound edges together to shrink the defect. Excessive or persistent myofibroblast activity ' +
        'causes pathological scarring — hypertrophic scars, keloids, and organ fibrosis.',
      'type III → type I collagen (weeks-months) remodeled scar (tensile ~80% of intact)':
        'Remodeling is the longest phase (weeks to months): type III collagen is gradually replaced by stronger, ' +
        'organized type I collagen as the scar matures. Even fully remodeled scar regains only ~80% of intact ' +
        'skin’s tensile strength and lacks appendages — repair, not true regeneration.',
    },
  },
  {
    slug: 'asthma_th2_eosinophil_inflammation',
    notes: {
      'inhaled allergen / virus / irritant airway epithelial damage + alarmin release':
        'Allergic (type 2) asthma starts at the airway epithelium: allergens (often with intrinsic protease ' +
        'activity), viruses, or irritants damage the barrier and trigger alarmin release. The epithelium is thus ' +
        'an active initiating sensor, not a passive barrier — the target of newer epithelial-directed biologics ' +
        '(anti-TSLP).',
      'alarmins (TSLP, IL-33, IL-25) ILC2 + Th2 cell activation':
        'The alarmins TSLP, IL-33, and IL-25 activate group 2 innate lymphoid cells (ILC2s) and prime dendritic ' +
        'cells to drive Th2 responses. ILC2s provide a rapid, antigen-independent source of type-2 cytokines, ' +
        'explaining type-2 inflammation even in non-allergic asthma.',
      'Th2 / ILC2 cytokines IL-4, IL-5, IL-13 secretion':
        'Activated Th2 cells and ILC2s secrete the signature type-2 cytokines IL-4, IL-5, and IL-13, which ' +
        'orchestrate the allergic response. Each has a distinct job — making them precise biologic targets ' +
        '(dupilumab blocks IL-4/IL-13 signaling; mepolizumab blocks IL-5).',
      'IL-4 + IL-13 (B cells) IgE class switching → high-affinity binding to mast-cell FcεRI':
        'IL-4 and IL-13 drive B-cell class switching to IgE, which binds the high-affinity receptor FcεRI on mast ' +
        'cells and basophils, arming them against the allergen. This IgE sensitization defines the allergic ' +
        'phenotype and is the target of anti-IgE therapy (omalizumab).',
      'mast cell degranulation histamine + leukotrienes (LTC4/D4/E4) + PGD2 release':
        'Re-exposure cross-links mast-cell IgE, triggering degranulation: preformed histamine plus newly made ' +
        'cysteinyl leukotrienes (LTC4/D4/E4) and prostaglandin D2 cause the immediate bronchoconstriction, edema, ' +
        'and mucus of the early response. The leukotriene arm is blocked by montelukast.',
      'IL-5 axis eosinophil bone-marrow release → eotaxin-driven airway homing':
        'IL-5 is the master eosinophil cytokine: it drives eosinophil production and release from marrow, while ' +
        'eotaxins guide their homing to the airway. Eosinophils drive the late-phase response and tissue damage — ' +
        'and blood/sputum eosinophilia defines the type-2-high asthma that responds to anti-IL-5 biologics.',
      'chronic Th2-eosinophil inflammation airway remodeling (hypertrophy + fibrosis + goblet hyperplasia)':
        'Sustained type-2 inflammation remodels the airway: smooth-muscle hypertrophy, subepithelial fibrosis, ' +
        'goblet-cell (mucus) hyperplasia, and angiogenesis. Remodeling causes the fixed, partly irreversible ' +
        'airflow obstruction of chronic asthma — a structural change bronchodilators cannot reverse, motivating ' +
        'early anti-inflammatory control.',
    },
  },
  {
    slug: 'nafld_mash_steatohepatitis',
    notes: {
      'visceral adiposity + insulin resistance ↑hepatic FFA flux + de novo lipogenesis':
        'MASLD (formerly NAFLD) is driven by metabolic overload: insulin resistance and visceral adiposity raise ' +
        'free-fatty-acid flux to the liver and, with hyperinsulinemia and excess sugar, ramp up hepatic de novo ' +
        'lipogenesis. The liver receives more fat than it can export or oxidize — the upstream cause of steatosis.',
      'hepatocyte triglyceride accumulation (>5%) simple steatosis (MASLD)':
        'When triglyceride accumulates in >5% of hepatocytes, the result is simple steatosis (MASLD). Triglyceride ' +
        'storage is itself relatively inert and may even be protective — a buffer against more toxic lipids — ' +
        'which is why most steatosis does not progress; the danger is the lipid species, not the fat per se.',
      'lipotoxic species (saturated FFAs, ceramides, free cholesterol) hepatocyte ER stress + mitochondrial dysfunction':
        'Progression depends on lipotoxicity: saturated free fatty acids, ceramides, and free cholesterol (not ' +
        'stored triglyceride) injure hepatocytes by inducing ER stress, mitochondrial dysfunction, and oxidative ' +
        'stress. This lipotoxic injury is the switch from benign steatosis toward steatohepatitis.',
      'hepatocyte injury → DAMP release Kupffer cell + monocyte activation (MASH)':
        'Injured and dying hepatocytes release DAMPs that activate resident Kupffer cells and recruit monocytes, ' +
        'igniting the inflammation that defines MASH (steatohepatitis). This inflammatory, ballooning-and-injury ' +
        'stage — not steatosis alone — is what drives fibrosis and clinical risk.',
      'TGF-β + PDGF + LPS-TLR4 hepatic stellate cell activation → myofibroblast':
        'Inflammatory and injury signals (TGF-β, PDGF, gut-derived LPS via TLR4) activate hepatic stellate cells, ' +
        'which transdifferentiate into collagen-secreting myofibroblasts. These are the principal source of liver ' +
        'scar — the central effector of fibrosis and the key antifibrotic drug target.',
      'progressive fibrosis cirrhosis (F4) + portal hypertension + HCC risk':
        'Unchecked fibrosis advances through stages to cirrhosis (F4), bringing portal hypertension, ' +
        'decompensation, and a markedly raised risk of hepatocellular carcinoma. Fibrosis stage — more than ' +
        'inflammation grade — is the strongest predictor of liver-related outcomes, so it anchors prognosis and ' +
        'trial endpoints.',
    },
  },
  {
    slug: 'neuroinflammation_microglia_priming',
    notes: {
      'homeostatic microglia (P2RY12+ TMEM119+) surveillance + synaptic pruning + debris clearance':
        'In the healthy CNS, microglia (marked by P2RY12, TMEM119) are not resting but actively surveilling — ' +
        'extending processes to monitor synapses, prune them, and clear debris. This homeostatic role makes them ' +
        'essential housekeepers; their dysfunction, not just their activation, contributes to disease.',
      'DAMPs / PAMPs / protein aggregates TLR + RAGE + NLRP3 + cGAS engagement':
        'Microglia sense danger through pattern-recognition receptors: TLRs and RAGE detect DAMPs/PAMPs and ' +
        'protein aggregates (Aβ, α-synuclein), while NLRP3 and cGAS-STING detect crystalline and nucleic-acid ' +
        'danger. This repertoire lets them respond to both infection and the misfolded proteins of ' +
        'neurodegeneration.',
      'chronic low-grade stimulation primed microglia (lowered activation threshold)':
        'Repeated or chronic low-grade stimulation “primes” microglia — leaving them sensitized with a lowered ' +
        'threshold, so a later trigger provokes an exaggerated response. Priming (by aging, prior infection, or ' +
        'ongoing pathology) links systemic inflammation to amplified CNS responses and to delayed ' +
        'neurodegeneration.',
      'full activation trigger pro-inflammatory secretion (TNF-α, IL-1β, IL-6, NO, ROS)':
        'On full activation, microglia secrete pro-inflammatory mediators — TNF-α, IL-1β, IL-6, nitric oxide, and ' +
        'ROS. Acutely these aid defense, but sustained release is neurotoxic, damaging neurons and reinforcing ' +
        'inflammation. The balance of protective versus harmful output is context- and duration-dependent.',
      'NLRP3 inflammasome assembly caspase-1 → IL-1β maturation + GSDMD pyroptosis':
        'A central amplifier is the NLRP3 inflammasome: assembly activates caspase-1, which matures IL-1β and ' +
        'cleaves gasdermin D for pyroptotic release. This couples microglial sensing to potent IL-1β-driven ' +
        'inflammation and is implicated in Alzheimer’s and Parkinson’s — making NLRP3 a neuro-inflammatory target.',
      'chronic neuroinflammation synaptic loss + neuronal injury + BBB compromise':
        'Chronic, unresolved neuroinflammation becomes a driver of pathology: it promotes synaptic loss (via ' +
        'complement-tagged pruning), direct neuronal injury, and blood-brain-barrier breakdown that admits ' +
        'peripheral immune cells. This self-sustaining cycle is now seen as an active contributor to ' +
        'neurodegeneration, not merely a reaction to it.',
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
console.log(`batch F total: ${totalAdded} notes`);
