/**
 * Phenomenon-pathways batch 1 — 5 pathways anchored on a user-felt
 * observable, in the editorial mold of the prototype
 * `beta_alanine_mrgprd_paresthesia` (2026-05-16). Each entry exposes
 * the formal mechanism in `name` and the colloquial hook in the new
 * `sensation` field (added in core/types.ts this batch).
 *
 *   1. niacin_gpr109a_skin_flush         — "the flush"
 *   2. caffeine_a1_cardiac_ectopy        — "skipped beats"
 *   3. riboflavin_renal_excretion_color  — "neon-yellow pee"
 *   4. glp1_central_appetite_food_noise  — "food noise quieting"
 *   5. pde5_pde6_blue_tint_vision        — "the blue tint"
 *
 * All PMIDs verified via NCBI E-utilities esummary on 2026-05-16:
 *
 *   ── Niacin flush (GPR109A / HCA2 → PGD2)
 *   PMID:12563315 — Tunaru S et al. 2003. Nat Med 9(3):352-5.
 *                   "PUMA-G and HM74 are receptors for nicotinic acid and
 *                    mediate its anti-lipolytic effect."
 *   PMID:16322797 — Benyo Z et al. 2005. J Clin Invest 115(12):3634-40.
 *                   "GPR109A (PUMA-G/HM74A) mediates nicotinic acid-induced
 *                    flushing."
 *   PMID:17008386 — Benyo Z et al. 2006. Mol Pharmacol 70(6):1844-9.
 *                   "Nicotinic acid-induced flushing is mediated by
 *                    activation of epidermal Langerhans cells."
 *   PMID:16617107 — Cheng K et al. 2006. PNAS 103(17):6682-7.
 *                   "Antagonism of the prostaglandin D2 receptor 1
 *                    suppresses nicotinic acid-induced vasodilation in
 *                    mice and humans."
 *   PMID:20664170 — Hanson J et al. 2010. J Clin Invest 120(8):2910-9.
 *                   "Nicotinic acid- and monomethyl fumarate-induced
 *                    flushing involves GPR109A expressed by keratinocytes
 *                    and COX-2-dependent prostanoid formation."
 *
 *   ── Caffeine PVCs (A1 adenosine antagonism)
 *   PMID:10049999 — Fredholm BB et al. 1999. Pharmacol Rev 51(1):83-133.
 *                   "Actions of caffeine in the brain with special
 *                    reference to factors that contribute to its
 *                    widespread use."
 *   PMID:2193560  — DiMarco JP et al. 1990. Ann Intern Med 113(2):104-10.
 *                   "Adenosine for paroxysmal supraventricular
 *                    tachycardia: dose ranging and comparison with
 *                    verapamil."
 *   PMID:36947466 — Marcus GM et al. 2023. N Engl J Med 388(12):1092-1100.
 *                   "Acute Effects of Coffee Consumption on Health among
 *                    Ambulatory Adults." (CRAVE trial.)
 *   PMID:16522833 — Cornelis MC et al. 2006. JAMA 295(10):1135-41.
 *                   "Coffee, CYP1A2 genotype, and risk of myocardial
 *                    infarction."
 *   PMID:22058665 — Klatsky AL et al. 2011. Perm J 15(3):19-25.
 *                   "Coffee, caffeine, and risk of hospitalization for
 *                    arrhythmias."
 *
 *   ── Riboflavin neon-yellow urine
 *   PMID:12791609 — Powers HJ. 2003. Am J Clin Nutr 77(6):1352-60.
 *                   "Riboflavin (vitamin B-2) and health."
 *   PMID:18632736 — Yonezawa A et al. 2008. Am J Physiol Cell Physiol
 *                   295(3):C632-41. "Identification and functional
 *                   characterization of a novel human and rat riboflavin
 *                   transporter, RFT1."
 *   PMID:20463145 — Yao Y et al. 2010. J Nutr 140(7):1220-6.
 *                   "Identification and comparative functional
 *                    characterization of a new human riboflavin
 *                    transporter hRFT3 expressed in the brain."
 *   PMID:8843991  — Zempleni J et al. 1996. Int J Vitam Nutr Res 66(2):151-7.
 *                   "The identification and kinetics of 7 alpha-
 *                    hydroxyriboflavin in blood plasma from humans
 *                    following oral administration of riboflavin
 *                    supplements."
 *
 *   ── GLP-1 RA food-noise quieting
 *   PMID:33567185 — Wilding JPH et al. 2021. N Engl J Med 384(11):989-1002.
 *                   "Once-Weekly Semaglutide in Adults with Overweight or
 *                    Obesity." (STEP 1.)
 *   PMID:35658024 — Jastreboff AM et al. 2022. N Engl J Med 387(3):205-216.
 *                   "Tirzepatide Once Weekly for the Treatment of
 *                    Obesity." (SURMOUNT-1.)
 *   PMID:29617641 — Drucker DJ. 2018. Cell Metab 27(4):740-756.
 *                   "Mechanisms of Action and Therapeutic Application of
 *                    Glucagon-like Peptide-1."
 *   PMID:26831302 — Farr OM et al. 2016. Diabetologia 59(5):954-965.
 *                   "GLP-1 receptors exist in the parietal cortex,
 *                    hypothalamus and medulla of human brains and the
 *                    GLP-1 analogue liraglutide alters brain activity
 *                    related to highly desirable food cues..."
 *   PMID:25071023 — van Bloemendaal L et al. 2014. Diabetes 63(12):4186-96.
 *                   "GLP-1 receptor activation modulates appetite- and
 *                    reward-related brain areas in humans."
 *
 *   ── Sildenafil blue tint (PDE6 cross-inhibition)
 *   PMID:19132801 — Laties AM. 2009. Drug Saf 32(1):1-18.
 *                   "Vision disorders and phosphodiesterase type 5
 *                    inhibitors: a review of the evidence to date."
 *   PMID:10541153 — Marmor MF, Kessler R. 1999. Surv Ophthalmol 44(2):153-62.
 *                   "Sildenafil (Viagra) and ophthalmology."
 *   PMID:12207947 — Laties A, Zrenner E. 2002. Prog Retin Eye Res 21(5):485-506.
 *                   "Viagra (sildenafil citrate) and ophthalmology."
 *   PMID:15294449 — Zhang J et al. 2004. Biochem Pharmacol 68(5):867-73.
 *                   "Differential inhibitor sensitivity between human
 *                    recombinant and native photoreceptor cGMP-
 *                    phosphodiesterases (PDE6s)."
 *   PMID:15126148 — Jagle H et al. 2004. Am J Ophthalmol 137(5):842-9.
 *                   "Visual short-term effects of Viagra: double-blind
 *                    study in healthy young subjects."
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NEW_PATHWAYS = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Niacin GPR109A skin flush — "the flush"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'niacin_gpr109a_skin_flush',
    name: 'Niacin GPR109A cutaneous flush',
    sensation: 'the flush',
    category: 'receptor_pharmacology',
    systems: ['integumentary', 'immune'],
    domains: ['cardiometabolic', 'dermatology'],
    description:
      "Explains the hot, red, prickling upper-body flush that lands ~15-30 min after immediate-release nicotinic acid — the most user-noticed effect of niacin and the reason most users abandon the lipid-lowering dose. Niacin binds GPR109A (HCA2 / HM74A / PUMA-G), a Gi/o-coupled GPCR identified as the niacin receptor by Tunaru 2003. In adipocytes GPR109A drives the anti-lipolytic effect (the lipid-lowering mechanism); but in skin it sits on epidermal Langerhans cells and keratinocytes, where activation triggers a phospholipase A2 → arachidonic acid → cyclooxygenase (COX-1 in Langerhans, COX-2 in keratinocytes) → prostaglandin D2 cascade (Benyo 2005, Benyo 2006, Hanson 2010). PGD2 released into the dermis activates DP1 receptors on cutaneous vascular smooth muscle → vasodilation, warmth, redness, and the characteristic tingle-itch. The flush is dose-dependent, saturable, and tachyphylactic (most users desensitize within 2-4 weeks). Aspirin 325 mg pre-dose blunts it by inhibiting COX, and laropiprant (a DP1 antagonist) was developed specifically to suppress it (Cheng 2006) — though laropiprant-niacin (Tredaptive / Cordaptive) was withdrawn after the HPS2-THRIVE outcome trial. Acipimox produces less flush than niacin per equivalent receptor occupancy; extended-release formulations (Niaspan) blunt peak plasma to stay below the flush threshold. Mechanism is distinct from histamine flush (antihistamines don't blunt it) and from carcinoid flush (no serotonin involvement).",
    steps: [
      {
        from: 'niacin',
        to: 'GPR109A activation',
        via: 'binds Gi/o-coupled HCA2 (GPR109A / HM74A / PUMA-G) on epidermal Langerhans cells + keratinocytes (Tunaru 2003 identified the receptor)',
        source_pmid: 'PMID:12563315',
      },
      {
        from: 'GPR109A activation',
        to: 'cytosolic Ca²⁺ rise + PLA2 activation',
        via: 'Gi/o βγ subunit → PLA2 mobilization → arachidonic acid release from membrane phospholipids; skin pathway, not adipocyte anti-lipolytic pathway',
        source_pmid: 'PMID:16322797',
      },
      {
        from: 'PLA2 activation',
        to: 'PGD2 synthesis (COX-1 Langerhans, COX-2 keratinocytes)',
        via: 'arachidonic acid → cyclooxygenase → PGH2 → PGD2 synthase; aspirin blunts this step',
        source_pmid: 'PMID:20664170',
      },
      {
        from: 'PGD2 synthesis (COX-1 Langerhans, COX-2 keratinocytes)',
        to: 'DP1 receptor activation on dermal vascular smooth muscle',
        via: 'paracrine PGD2 release from skin antigen-presenting cells → Gs-coupled DP1 → cAMP rise in cutaneous arterioles',
        source_pmid: 'PMID:17008386',
      },
      {
        from: 'DP1 receptor activation on dermal vascular smooth muscle',
        to: 'cutaneous vasodilation (flush: warmth, redness, tingle, itch)',
        via: 'DP1-mediated vasodilation of face/neck/upper-trunk arterioles; laropiprant (DP1 antagonist) blocks the flush specifically without blocking the lipid effect',
        source_pmid: 'PMID:16617107',
      },
    ],
    modulators: [
      {
        slug: 'niacin',
        effect: 'activator',
        target: 'GPR109A (HCA2 / HM74A)',
        note: "the perpetrator — immediate-release doses ≥100 mg saturate skin GPR109A; extended-release (Niaspan) and slow titration build tachyphylaxis within 2-4 weeks; tachyphylaxis is the reason chronic users stop flushing",
        source_pmid: 'PMID:16322797',
      },
      {
        slug: 'aspirin',
        effect: 'inhibitor',
        target: 'COX-1 → blocks PGD2 synthesis upstream of DP1',
        note: '325 mg aspirin 30-60 min before niacin blunts the flush by ~half by inhibiting COX-1 in Langerhans cells; does not blunt the lipid-lowering effect (different mechanism in adipocytes)',
        source_pmid: 'PMID:16617107',
      },
    ],
    refs: [
      'PMID:12563315',
      'PMID:16322797',
      'PMID:17008386',
      'PMID:16617107',
      'PMID:20664170',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Caffeine A1-adenosine cardiac ectopy — "skipped beats"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'caffeine_a1_cardiac_ectopy',
    name: 'Caffeine A1-adenosine cardiac ectopy',
    sensation: 'skipped beats / palpitations',
    category: 'receptor_pharmacology',
    systems: ['cardiovascular', 'nervous'],
    domains: ['cardiometabolic'],
    description:
      "Explains the fluttery 'skipped-beat' sensation many coffee-drinkers notice — premature ventricular complexes (PVCs) and atrial ectopy that the conscious heart-tap registers as a pause-then-thud. Caffeine is a competitive antagonist at adenosine A1 and A2A receptors at ordinary intake concentrations (Fredholm 1999). Endogenous adenosine, acting on A1 receptors at the sinoatrial and atrioventricular nodes, slows automaticity and conduction — this is the mechanism behind IV adenosine as the drug of choice for terminating SVT (DiMarco 1990). When caffeine blocks A1, the tonic adenosinergic brake on nodal pacemaking is lifted, which combined with secondary catecholamine release (β1 → cAMP → PKA → If/IK shifts) raises ectopy in susceptible substrates. The 2023 CRAVE trial (Marcus 2023) is the cleanest prospective data: a randomized day-on / day-off design in 100 ambulatory adults showed coffee days had measurably more PVCs (though fewer atrial ectopic beats — the atrial story is more nuanced). CYP1A2 polymorphism gates exposure: slow metabolizers (CYP1A2*1F) accumulate caffeine longer and show stronger cardiovascular responses (Cornelis 2006 linked slow metabolizer + heavy coffee to MI risk). Effect is dose-dependent and tachyphylactic — habituated users have upregulated A1 receptors and largely lose the ectopy response. Importantly, the prospective evidence does NOT support clinical atrial-fibrillation risk from moderate coffee intake (Klatsky 2011 review); the user-felt 'skipped beats' are mostly benign PVCs amplified by caffeine-driven sympathetic tone.",
    steps: [
      {
        from: 'caffeine',
        to: 'A1 / A2A adenosine receptor antagonism',
        via: 'competitive antagonism at adenosine A1 (cardiac nodal tissue) and A2A (vascular + cortical); occupies a substantial fraction of receptors at plasma concentrations of 1-4 mg/L (Fredholm 1999)',
        source_pmid: 'PMID:10049999',
      },
      {
        from: 'A1 / A2A adenosine receptor antagonism',
        to: 'loss of tonic adenosinergic brake on SA + AV nodes',
        via: 'A1 normally slows SA pacemaking and AV conduction (Gi → ↓cAMP → ↓If, ↓ICa-L); the same mechanism IV adenosine exploits to terminate SVT',
        source_pmid: 'PMID:2193560',
      },
      {
        from: 'loss of tonic adenosinergic brake on SA + AV nodes',
        to: 'secondary catecholamine release + raised sympathetic tone',
        via: 'central A1 antagonism + peripheral sympathetic outflow rise → mild β1 cardiac stimulation → enhanced automaticity in latent pacemaker foci',
        source_pmid: 'PMID:10049999',
      },
      {
        from: 'secondary catecholamine release + raised sympathetic tone',
        to: 'increased PVCs / premature atrial complexes',
        via: 'CRAVE trial: prospective day-on/day-off coffee design showed measurably more PVCs on coffee days; atrial ectopy direction was less consistent (Marcus 2023)',
        source_pmid: 'PMID:36947466',
      },
      {
        from: 'increased PVCs / premature atrial complexes',
        to: 'palpitations / "skipped beats" sensation',
        via: 'conscious detection of the post-ectopic compensatory pause and subsequent stronger contraction; perceived as flutter, thud, or skip — benign in structurally normal hearts',
        source_pmid: 'PMID:22058665',
      },
    ],
    modulators: [
      {
        slug: 'caffeine',
        effect: 'inhibitor',
        target: 'adenosine A1 receptor (cardiac nodal tissue)',
        note: "the perpetrator — competitive A1 antagonism at intake-relevant concentrations; CYP1A2 slow metabolizers (*1F variant) accumulate higher plasma levels and show stronger cardiovascular response (Cornelis 2006). Chronic intake upregulates A1 receptors → tachyphylaxis for the ectopy effect",
        source_pmid: 'PMID:16522833',
      },
      {
        slug: 'adenosine',
        effect: 'activator',
        target: 'A1 receptor (the displaced endogenous ligand)',
        note: 'the agonist caffeine displaces; IV adenosine bolus is the clinical mirror — exploits the same A1-mediated AV nodal block to terminate paroxysmal SVT (DiMarco 1990)',
        source_pmid: 'PMID:2193560',
      },
    ],
    refs: [
      'PMID:10049999',
      'PMID:2193560',
      'PMID:36947466',
      'PMID:16522833',
      'PMID:22058665',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Riboflavin renal excretion → fluorescent urine — "neon-yellow pee"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'riboflavin_renal_excretion_color',
    name: 'Riboflavin renal overflow fluorescence',
    sensation: 'neon-yellow pee',
    category: 'transport',
    systems: ['urinary', 'gi'],
    domains: ['metabolic'],
    description:
      "Explains the bright yellow-green, almost-glowing urine that lands 1-2 hours after a B-complex, multivitamin, or standalone riboflavin dose — the most-photographed supplement side effect on the internet. Riboflavin (vitamin B2) is natively fluorescent (peak excitation ~450 nm, peak emission ~525 nm) — the same property that makes it useful as a tracer in pharmaceutical disintegration tests. Intestinal absorption is via the SLC52 family of riboflavin transporters (RFVT1/SLC52A1, RFVT2/SLC52A2, RFVT3/SLC52A3), characterized by Yonezawa 2008 and Yao 2010; the apical-side RFVT3 in enterocytes is the rate-limiting step and is saturable at modest single doses (Zempleni 1996 showed ~27 mg as the practical upper limit before disproportional excretion). Beyond that ceiling, unabsorbed riboflavin moves into stool while absorbed-but-unneeded riboflavin (above the tissue-storage requirement of ~1.3-1.6 mg/day) is filtered at the glomerulus and excreted in urine essentially unchanged, often within 1-2 hours — producing the characteristic fluorescent stream. The phenomenon is benign and a useful real-time marker of GI absorption: cloudy/lighter urine after a riboflavin-containing supplement suggests effective absorption-then-overflow; complete absence may signal severe absorption impairment. Color intensity scales with dose (visible at ~50 mg+ for most users), hydration state, and the time-since-dose; it fades within 4-6 hours. The yellow color of B-complex tablets and energy-drinks themselves is also riboflavin (E101).",
    steps: [
      {
        from: 'riboflavin',
        to: 'intestinal absorption via RFVT3 (SLC52A3)',
        via: 'apical enterocyte RFVT3 / RFVT1 / RFVT2 family — Na+-independent facilitated transport, saturable at ~27 mg single dose (Zempleni 1996)',
        source_pmid: 'PMID:8843991',
      },
      {
        from: 'intestinal absorption via RFVT3 (SLC52A3)',
        to: 'systemic FAD / FMN pool + tissue saturation',
        via: 'absorbed riboflavin phosphorylated by riboflavin kinase to FMN, then adenylated to FAD; tissue holocoenzyme pools fill at ~1.3-1.6 mg/day intake',
        source_pmid: 'PMID:12791609',
      },
      {
        from: 'systemic FAD / FMN pool + tissue saturation',
        to: 'free plasma riboflavin overflow',
        via: 'beyond tissue-storage requirement, free riboflavin (the non-phosphorylated form) accumulates in plasma — the basis for the saturation kinetics (Powers 2003 review)',
        source_pmid: 'PMID:12791609',
      },
      {
        from: 'free plasma riboflavin overflow',
        to: 'glomerular filtration + renal excretion',
        via: 'low MW (376 Da), water-soluble, minimal protein binding → filtered freely; renal RFVT2/3 reabsorb the bulk filtered load up to a transport ceiling, above which riboflavin spills into final urine',
        source_pmid: 'PMID:18632736',
      },
      {
        from: 'glomerular filtration + renal excretion',
        to: 'fluorescent yellow-green urine (peak emission ~525 nm)',
        via: 'isoalloxazine ring of riboflavin fluoresces under ambient light → visible bright yellow-green color in urine within 1-2 hours of dose, fading at 4-6 hours; intensity scales with dose and hydration',
        source_pmid: 'PMID:20463145',
      },
    ],
    modulators: [
      {
        slug: 'riboflavin',
        effect: 'substrate',
        target: 'RFVT3 (intestinal) + glomerular filtration → urine',
        note: 'the perpetrator — single doses ≥50 mg reliably produce visible neon-yellow urine; 5-25 mg typical B-complex still produces a more muted yellow shift; doses well above 27 mg face flat absorption (saturated RFVT3) so even very high doses don\'t change urinary brightness proportionally',
        source_pmid: 'PMID:8843991',
      },
    ],
    refs: [
      'PMID:12791609',
      'PMID:18632736',
      'PMID:20463145',
      'PMID:8843991',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. GLP-1 RA central appetite + food-noise quieting
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'glp1_central_appetite_food_noise',
    name: 'GLP-1 central appetite + reward-cue dampening',
    sensation: '"food noise" quieting + early satiety',
    category: 'receptor_pharmacology',
    systems: ['endocrine', 'gi', 'nervous'],
    domains: ['metabolic', 'neuropsychiatric'],
    description:
      "Explains the most user-reported phenomenon of semaglutide/tirzepatide therapy: 'food noise' — the constant intrusive thinking about food — drops away within days to weeks of starting, separate from and earlier than the weight loss itself. GLP-1 receptor agonists (semaglutide, liraglutide, dulaglutide) and the dual GIP/GLP-1 agonist tirzepatide act through GLP-1R, a Gs-coupled GPCR (Drucker 2018 review). The peripheral effects — delayed gastric emptying (a key driver of early satiety + the sulfur-burp side effect from delayed protein digestion) and pancreatic β-cell glucose-dependent insulin secretion — are real, but the appetite-and-reward effects are CNS-mediated. Farr 2016 confirmed GLP-1R expression in the human hypothalamus, parietal cortex, and medulla; van Bloemendaal 2014 showed that GLP-1 receptor activation reduces fMRI signal in appetite- and reward-related brain regions (ventral striatum, insula, OFC, amygdala) in response to food cues. The phenomenology — 'I just don't think about food anymore' — maps cleanly onto this reward-cue dampening. Clinical magnitude: semaglutide 2.4 mg weekly produced a 14.9% body-weight reduction in STEP 1 (Wilding 2021); tirzepatide 15 mg weekly produced 20.9% in SURMOUNT-1 (Jastreboff 2022). GI side effects (nausea, sulfur burps from prolonged gastric retention, constipation, reflux) cluster early and usually attenuate over 8-12 weeks. Mechanism overlap with central reward explains the off-label observations of reduced alcohol craving and possibly other reward-driven behaviors (compulsive shopping, nail-biting) — an active research area.",
    steps: [
      {
        from: 'semaglutide',
        to: 'GLP-1R activation (central + peripheral)',
        via: 'GLP-1 receptor agonism on hypothalamic neurons (arcuate POMC + AgRP), NTS, pancreatic β cells, and gastric smooth muscle; long half-life via albumin binding allows weekly dosing',
        source_pmid: 'PMID:29617641',
      },
      {
        from: 'GLP-1R activation (central + peripheral)',
        to: 'delayed gastric emptying + early satiety + insulin secretion',
        via: 'peripheral arm — Gs → ↑cAMP in gastric smooth muscle slows emptying (→ early fullness + protein retention → sulfur burps); β-cell glucose-dependent insulin release (low hypoglycemia risk because glucose-dependent)',
        source_pmid: 'PMID:33567185',
      },
      {
        from: 'GLP-1R activation (central + peripheral)',
        to: 'hypothalamic POMC drive + AgRP suppression',
        via: 'central GLP-1R on arcuate POMC neurons → α-MSH release → MC4R activation; concurrent AgRP suppression — both reduce homeostatic hunger',
        source_pmid: 'PMID:26831302',
      },
      {
        from: 'hypothalamic POMC drive + AgRP suppression',
        to: 'reduced fMRI signal in ventral striatum / insula / OFC to food cues',
        via: 'reward-circuit dampening — van Bloemendaal 2014 imaging shows GLP-1 RA reduces NAc/VTA/OFC activation to palatable food images; "food noise" likely lives in this circuit',
        source_pmid: 'PMID:25071023',
      },
      {
        from: 'reduced fMRI signal in ventral striatum / insula / OFC to food cues',
        to: '"food noise" quieting + intake reduction + weight loss',
        via: 'STEP 1: semaglutide 2.4 mg 14.9% weight reduction at 68 wk; SURMOUNT-1: tirzepatide 15 mg 20.9% at 72 wk; food-noise quieting precedes the weight loss',
        source_pmid: 'PMID:35658024',
      },
    ],
    modulators: [
      {
        slug: 'semaglutide',
        effect: 'activator',
        target: 'GLP-1 receptor',
        note: 'long-acting (t½ ~7 days) GLP-1 RA; STEP 1 / STEP series; oral Rybelsus + injectable Ozempic/Wegovy formulations',
        source_pmid: 'PMID:33567185',
      },
      {
        slug: 'tirzepatide',
        effect: 'activator',
        target: 'GLP-1 receptor + GIP receptor (dual agonist)',
        note: 'dual GIP/GLP-1 agonism; produces larger weight reduction than pure GLP-1 RA at maximal dose (SURMOUNT-1: 20.9% vs ~15% for semaglutide); food-noise quieting reported equivalently',
        source_pmid: 'PMID:35658024',
      },
      {
        slug: 'liraglutide',
        effect: 'activator',
        target: 'GLP-1 receptor',
        note: 'shorter t½ (~13 h, daily injection); the first GLP-1 RA approved for chronic weight management (Saxenda); central + peripheral mechanism identical to semaglutide',
        source_pmid: 'PMID:26831302',
      },
      {
        slug: 'dulaglutide',
        effect: 'activator',
        target: 'GLP-1 receptor',
        note: 'weekly GLP-1 RA (Trulicity); approved for T2D; similar central food-noise and appetite-suppression mechanism though typically lower max dose than semaglutide for weight outcomes',
      },
    ],
    refs: [
      'PMID:33567185',
      'PMID:35658024',
      'PMID:29617641',
      'PMID:26831302',
      'PMID:25071023',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. PDE5i blue-tinged vision — "the blue tint"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'pde5_pde6_blue_tint_vision',
    name: 'PDE5 inhibitor PDE6 retinal cross-inhibition',
    sensation: 'the blue tint / cyanopsia',
    category: 'receptor_pharmacology',
    systems: ['nervous', 'cardiovascular'],
    domains: ['neuropsychiatric'],
    description:
      "Explains the transient blue-tinged or blue-haze vision some users notice 30-60 min after sildenafil (and to a lesser extent vardenafil) — most prominent looking at bright sources or computer screens, and resolving within 4-6 hours. Sildenafil is highly selective for PDE5 (the cGMP-hydrolyzing isoform in vascular smooth muscle that the drug exploits for its erectogenic and pulmonary-hypertension effects), but it cross-inhibits PDE6 — the cGMP-PDE that lives exclusively in retinal photoreceptors and drives phototransduction. PDE5/PDE6 selectivity ratios: sildenafil ~10× (Zhang 2004); vardenafil ~15-20×; tadalafil ~700× (which is why tadalafil rarely produces visual disturbance). In rod and cone outer segments PDE6 hydrolyzes cGMP in response to transducin activation, closing CNG channels and hyperpolarizing the cell — the canonical phototransduction cascade. Sildenafil partially inhibits this cycle, raising baseline cGMP, delaying recovery, and shifting blue-cone (S-cone) responses disproportionately (Jagle 2004 demonstrated dose-dependent transient color-vision perturbation in healthy volunteers). The phenomenon is self-limiting and follows sildenafil's PK closely — peaks at Cmax (~1 h) and clears with elimination (t½ ~4 h). Reports of permanent visual change are exceedingly rare; the Laties 2009 review concluded the visual effects are reversible and dose-dependent. Concern remains for users with retinitis pigmentosa (PDE6 mutations) — these patients should avoid PDE5i. Mechanism is purely pharmacodynamic, distinct from the rare reports of NAION which appear vascular.",
    steps: [
      {
        from: 'sildenafil',
        to: 'PDE5 inhibition (intended target) + PDE6 cross-inhibition (off-target)',
        via: 'PDE5 inhibition in vascular smooth muscle drives the erectogenic effect; PDE6 is the closest homolog (cGMP-specific) and is cross-inhibited at clinical concentrations — selectivity ratio ~10× for sildenafil',
        source_pmid: 'PMID:15294449',
      },
      {
        from: 'PDE5 inhibition (intended target) + PDE6 cross-inhibition (off-target)',
        to: 'raised retinal cGMP in rod + cone outer segments',
        via: 'PDE6 is the phototransduction PDE — hydrolyzes cGMP in response to transducin activation; partial inhibition raises baseline cGMP and delays recovery of dark current',
        source_pmid: 'PMID:12207947',
      },
      {
        from: 'raised retinal cGMP in rod + cone outer segments',
        to: 'altered CNG channel gating + disproportionate S-cone (blue) response shift',
        via: 'cGMP-gated cation channel remains partially open longer; spectral effect is greatest for blue (S-cone) and least for red — the basis of the blue-tint phenomenology',
        source_pmid: 'PMID:10541153',
      },
      {
        from: 'altered CNG channel gating + disproportionate S-cone (blue) response shift',
        to: 'transient blue tint / blue haze / increased brightness sensitivity',
        via: 'cyanopsia perceived during the Tmax window (~1 h post-dose); Jagle 2004 documented dose-dependent transient color-discrimination shift in healthy volunteers',
        source_pmid: 'PMID:15126148',
      },
      {
        from: 'transient blue tint / blue haze / increased brightness sensitivity',
        to: 'resolution as plasma sildenafil clears (t½ ~4 h)',
        via: 'fully reversible PK-driven phenomenon; Laties 2009 review of PDE5i ophthalmologic safety found no evidence of permanent visual change in normal users; RP patients should avoid',
        source_pmid: 'PMID:19132801',
      },
    ],
    modulators: [
      {
        slug: 'sildenafil',
        effect: 'inhibitor',
        target: 'PDE5 (intended) + PDE6 (retinal, off-target)',
        note: 'PDE5/PDE6 selectivity ~10× — the lowest of the three approved PDE5i, hence most blue-tint reports come from sildenafil users',
        source_pmid: 'PMID:15294449',
      },
      {
        slug: 'vardenafil',
        effect: 'inhibitor',
        target: 'PDE5 (intended) + PDE6 (retinal, off-target)',
        note: 'PDE5/PDE6 selectivity ~15-20× — fewer blue-tint reports than sildenafil but still possible at higher doses',
        source_pmid: 'PMID:15294449',
      },
      {
        slug: 'tadalafil',
        effect: 'inhibitor',
        target: 'PDE5 — minimal PDE6 cross-inhibition (~700×)',
        note: 'far higher PDE5/PDE6 selectivity; blue-tint rare or absent; tadalafil cross-hits PDE11 instead (back/muscle ache mechanism) — different off-target profile',
        source_pmid: 'PMID:19132801',
      },
    ],
    refs: [
      'PMID:19132801',
      'PMID:10541153',
      'PMID:12207947',
      'PMID:15294449',
      'PMID:15126148',
    ],
  },
];

function main(): void {
  const data = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8')) as Array<{ slug: string }>;
  const existing = new Set(data.map(p => p.slug));
  const skipped: string[] = [];
  const added: string[] = [];
  for (const p of NEW_PATHWAYS) {
    if (existing.has(p.slug)) {
      skipped.push(p.slug);
      continue;
    }
    data.push(p as never);
    added.push(p.slug);
  }
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Added ${added.length} pathway(s): ${added.join(', ')}`);
  if (skipped.length) console.log(`Skipped (already exist): ${skipped.join(', ')}`);
  console.log(`Total pathways: ${data.length}`);
}

main();
