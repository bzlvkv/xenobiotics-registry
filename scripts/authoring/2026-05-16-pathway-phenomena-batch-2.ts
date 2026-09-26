/**
 * Phenomenon-pathways batch 2 — 5 pathways anchored on a user-felt
 * observable, same editorial mold as
 * `beta_alanine_mrgprd_paresthesia` and phenomena-batch-1.
 *
 *   1. ssri_discontinuation_brain_zaps   — "brain zaps"
 *   2. carbonic_anhydrase_paresthesia    — "tingling fingers + toes"
 *   3. melatonin_rem_rebound_grogginess  — "vivid dreams + morning fog"
 *   4. creatine_intracellular_water_pump — "muscle fullness"
 *   5. minoxidil_anagen_synchronization  — "the dread shed"
 *
 * All PMIDs verified via NCBI E-utilities esummary on 2026-05-16:
 *
 *   ── SSRI brain zaps / discontinuation
 *   PMID:38851198 — Henssler J et al. 2024. Lancet Psychiatry 11(7):526-535.
 *                   "Incidence of antidepressant discontinuation symptoms:
 *                    a systematic review and meta-analysis."
 *   PMID:25721705 — Fava GA et al. 2015. Psychother Psychosom 84(2):72-81.
 *                   "Withdrawal Symptoms after Selective Serotonin
 *                    Reuptake Inhibitor Discontinuation: A Systematic
 *                    Review."
 *   PMID:10863885 — Black K et al. 2000. J Psychiatry Neurosci 25(3):255-61.
 *                   "Selective serotonin reuptake inhibitor discontinuation
 *                    syndrome: proposed diagnostic criteria."
 *   PMID:9219489  — Haddad P. 1997. J Clin Psychiatry 58 Suppl 7:17-21.
 *                   "Newer antidepressants and the discontinuation
 *                    syndrome."
 *   PMID:30292574 — Davies J, Read J. 2019. Addict Behav 97:111-121.
 *                   "A systematic review into the incidence, severity
 *                    and duration of antidepressant withdrawal effects:
 *                    Are guidelines evidence-based?"
 *
 *   ── Carbonic anhydrase paresthesia
 *   PMID:4964060  — Maren TH. 1967. Physiol Rev 47(4):595-781.
 *                   "Carbonic anhydrase: chemistry, physiology, and
 *                    inhibition."
 *   PMID:18167490 — Supuran CT. 2008. Nat Rev Drug Discov 7(2):168-81.
 *                   "Carbonic anhydrases: novel therapeutic applications
 *                    for inhibitors and activators."
 *   PMID:10768298 — Dodgson SJ, Shank RP, Maryanoff BE. 2000.
 *                   Epilepsia 41(Suppl 1):S35-9.
 *                   "Topiramate as an inhibitor of carbonic anhydrase
 *                    isoenzymes."
 *   PMID:37368102 — Pearl NZ et al. 2023. Adv Ther 40(9):3626-3638.
 *                   "Narrative Review of Topiramate: Clinical Uses and
 *                    Pharmacological Considerations."
 *
 *   ── Melatonin REM rebound + grogginess
 *   PMID:8988899  — Brzezinski A. 1997. N Engl J Med 336(3):186-95.
 *                   "Melatonin in humans."
 *   PMID:11600532 — Zhdanova IV, Wurtman RJ, Regan MM. 2001.
 *                   J Clin Endocrinol Metab 86(10):4727-30.
 *                   "Melatonin treatment for age-related insomnia."
 *   PMID:20410229 — Burgess HJ, Revell VL, Molina TA. 2010.
 *                   J Clin Endocrinol Metab 95(7):3325-31.
 *                   "Human phase response curves to three days of daily
 *                    melatonin: 0.5 mg versus 3.0 mg."
 *   PMID:26414986 — Auger RR et al. 2015. J Clin Sleep Med 11(10):1199-236.
 *                   "Clinical Practice Guideline for the Treatment of
 *                    Intrinsic Circadian Rhythm Sleep-Wake Disorders."
 *   PMID:25380732 — Costello RB et al. 2014. Nutr J 13:106.
 *                   "The effectiveness of melatonin for promoting healthy
 *                    sleep: a rapid evidence assessment of the
 *                    literature."
 *
 *   ── Creatine muscle fullness
 *   PMID:8828669  — Hultman E, Soderlund K, Timmons JA. 1996.
 *                   J Appl Physiol 81(1):232-7. "Muscle creatine loading
 *                    in men."
 *   PMID:28615996 — Kreider RB et al. 2017. J Int Soc Sports Nutr 14:18.
 *                   "International Society of Sports Nutrition position
 *                    stand: safety and efficacy of creatine
 *                    supplementation in exercise, sport, and medicine."
 *   PMID:12937471 — Powers ME, Arnold BL, Weltman AL. 2003.
 *                   J Athl Train 38(1):44-50. "Creatine Supplementation
 *                    Increases Total Body Water Without Altering Fluid
 *                    Distribution."
 *   PMID:10449017 — Volek JS, Duncan ND, Mazzetti SA. 1999.
 *                   Med Sci Sports Exerc 31(8):1147-56.
 *                   "Performance and muscle fiber adaptations to creatine
 *                    supplementation and heavy resistance training."
 *
 *   ── Minoxidil shed phase
 *   PMID:31496654 — Suchonwanit P, Thammarucha S, Leerunyakul K. 2019.
 *                   Drug Des Devel Ther 13:2777-2786.
 *                   "Minoxidil and its use in hair disorders: a review."
 *   PMID:14996087 — Messenger AG, Rundegren J. 2004. Br J Dermatol
 *                   150(2):186-94. "Minoxidil: mechanisms of action on
 *                    hair growth."
 *   PMID:2465357  — Buhl AE, Waldon DJ, Kawabe TT. 1989.
 *                   J Invest Dermatol 92(3):315-20.
 *                   "Minoxidil stimulates mouse vibrissae follicles in
 *                    organ culture."
 *   PMID:3722507  — Olsen EA, DeLong ER, Weiner MS. 1986.
 *                   J Am Acad Dermatol 15(1):30-7.
 *                   "Dose-response study of topical minoxidil in male
 *                    pattern baldness."
 *   PMID:24773771 — Roberts J et al. (Goren A) 2014.
 *                   Dermatol Ther 27(4):252-4.
 *                   "Sulfotransferase activity in plucked hair follicles
 *                    predicts response to topical minoxidil in the
 *                    treatment of female androgenetic alopecia."
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NEW_PATHWAYS = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. SSRI/SNRI discontinuation brain zaps — "brain zaps"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'ssri_discontinuation_brain_zaps',
    name: 'SSRI/SNRI discontinuation syndrome',
    sensation: 'brain zaps',
    category: 'receptor_pharmacology',
    systems: ['nervous'],
    domains: ['neuropsychiatric'],
    description:
      "Explains the brief electric-shock-like sensations in the head — often triggered by lateral eye movement — that hit users when they miss a dose or taper an SSRI or SNRI. 'Brain zaps' (also: brain shivers, electric jolts) sit alongside dizziness, nausea, flu-like malaise, sleep disturbance, and emotional lability under the umbrella of antidepressant discontinuation syndrome (Black 2000 first proposed formal diagnostic criteria; Haddad 1997 was the early canonical description). Incidence is half-life-driven: short-half-life agents like paroxetine and venlafaxine are the worst (Davies 2019 systematic review put discontinuation symptom incidence at ~56% pooled across studies), while fluoxetine — t½ of 1-4 days plus an active metabolite norfluoxetine of 7-15 days — produces it rarely because the drug self-tapers. Mechanism is incompletely understood and likely multifactorial: sudden 5-HT transporter availability rebound, a hypothesized cholinergic-serotonergic balance shift, GABAergic system perturbation, and oculomotor-saccade-coupled sensory disturbance that explains the eye-movement trigger. Henssler 2024 meta-analysis is the most rigorous recent quantification — incidence and severity is real but had been overstated in some earlier work without placebo controls. Symptoms typically resolve within 1-6 weeks; bridging with a fluoxetine swap or extreme-slow taper (months, sometimes hyperbolic dose reduction) is the standard mitigation. Distinct from SSRI rebound (relapse of underlying depression) and from serotonin syndrome (acute toxic excess). Common misattribution: users sometimes interpret zaps as relapse or new disorder rather than a discontinuation effect.",
    steps: [
      {
        from: 'fluvoxamine',
        to: 'tonic central 5-HT transporter inhibition + receptor adaptation',
        via: 'chronic SSRI use → SERT occupancy ~80% in therapeutic range → adaptive downregulation of 5-HT1A autoreceptors and 5-HT2A postsynaptic receptors over weeks',
        source_pmid: 'PMID:25721705',
      },
      {
        from: 'tonic central 5-HT transporter inhibition + receptor adaptation',
        to: 'abrupt loss of SERT occupancy on dose miss / taper',
        via: 'half-life dictates speed of plasma fall — paroxetine/venlafaxine t½ ~21 h; fluoxetine/norfluoxetine effective t½ ~7-15 d self-tapers and rarely produces discontinuation symptoms (Haddad 1997)',
        source_pmid: 'PMID:9219489',
      },
      {
        from: 'abrupt loss of SERT occupancy on dose miss / taper',
        to: 'serotonergic-cholinergic imbalance + GABAergic perturbation',
        via: 'cholinergic rebound + glutamatergic disinhibition hypothesized; mechanistic certainty is incomplete — Black 2000 proposed framework still largely current',
        source_pmid: 'PMID:10863885',
      },
      {
        from: 'serotonergic-cholinergic imbalance + GABAergic perturbation',
        to: 'paroxysmal sensory phenomena — "brain zaps" + lateral-gaze trigger',
        via: 'oculomotor coupling — saccades reliably trigger zaps in many users; proposed mechanism is brief cortical electrical event linked to brainstem GABA/5-HT shift; lasts < 1 s per event',
        source_pmid: 'PMID:38851198',
      },
      {
        from: 'paroxysmal sensory phenomena — "brain zaps" + lateral-gaze trigger',
        to: 'resolution over 1-6 weeks (or on dose resumption / fluoxetine bridge)',
        via: 'symptoms remit as receptor systems re-equilibrate; clinical mitigation = hyperbolic taper, fluoxetine bridge, or temporary dose resumption; meta-analysis incidence ~56% in pooled data (Davies 2019)',
        source_pmid: 'PMID:30292574',
      },
    ],
    modulators: [
      {
        slug: 'paroxetine',
        effect: 'inhibitor',
        target: 'SERT (and weak muscarinic antagonism)',
        note: 'highest discontinuation-syndrome incidence among SSRIs — short t½ (~21 h) + muscarinic activity → strong cholinergic rebound on stop',
        source_pmid: 'PMID:9219489',
      },
      {
        slug: 'venlafaxine',
        effect: 'inhibitor',
        target: 'SERT + NET (SNRI)',
        note: 'short t½ (~5 h), no active metabolite of comparable potency; high rates of brain zaps; XR formulation softens but does not eliminate',
        source_pmid: 'PMID:25721705',
      },
      {
        slug: 'duloxetine',
        effect: 'inhibitor',
        target: 'SERT + NET (SNRI)',
        note: 't½ ~12 h; high rate of discontinuation symptoms; capsule contains enteric-coated pellets that cannot be split — taper requires alternate-day or compounded approach',
        source_pmid: 'PMID:38851198',
      },
      {
        slug: 'sertraline',
        effect: 'inhibitor',
        target: 'SERT',
        note: 'moderate discontinuation risk — t½ ~26 h; symptoms exist but less commonly than paroxetine/venlafaxine',
      },
      {
        slug: 'citalopram',
        effect: 'inhibitor',
        target: 'SERT',
        note: 'moderate discontinuation risk — t½ ~35 h offers some self-tapering buffer',
      },
      {
        slug: 'escitalopram',
        effect: 'inhibitor',
        target: 'SERT (S-enantiomer of citalopram)',
        note: 'similar profile to citalopram — t½ ~27-32 h',
      },
      {
        slug: 'fluvoxamine',
        effect: 'inhibitor',
        target: 'SERT (also σ-1 agonism)',
        note: 'short t½ (~15 h) → reasonable discontinuation symptom rates; σ-1 contribution to discontinuation phenomenology not well characterized',
      },
      {
        slug: 'fluoxetine',
        effect: 'inhibitor',
        target: 'SERT (active metabolite norfluoxetine)',
        note: 'rarely produces discontinuation symptoms — t½ of parent ~1-4 d plus norfluoxetine t½ ~7-15 d creates an automatic taper; for this reason often used as a *bridge* when switching off other SSRIs/SNRIs',
        source_pmid: 'PMID:9219489',
      },
    ],
    refs: [
      'PMID:38851198',
      'PMID:25721705',
      'PMID:10863885',
      'PMID:9219489',
      'PMID:30292574',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Carbonic anhydrase paresthesia — "tingling fingers + toes"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'carbonic_anhydrase_paresthesia',
    name: 'Carbonic anhydrase inhibitor paresthesia',
    sensation: 'tingling fingers + toes',
    category: 'receptor_pharmacology',
    systems: ['nervous', 'urinary'],
    domains: ['neuropsychiatric'],
    description:
      "Explains the gentle pins-and-needles tingling in fingers, toes, and sometimes lips that lands within days of starting topiramate, acetazolamide, or zonisamide — the most common reason users describe these medications as 'feeling weird.' All three are carbonic anhydrase (CA) inhibitors with varying isoform selectivity. CA catalyzes CO2 + H2O ↔ H+ + HCO3⁻ across many tissues — Maren 1967 is the foundational pharmacology review; Supuran 2008 catalogs the 15+ human isoforms. Topiramate inhibits CA II, IV, V, VI, and VII (Dodgson 2000); acetazolamide is a broad CA II/IV inhibitor; both produce a mild systemic metabolic acidosis through impaired renal HCO3⁻ reabsorption in the proximal tubule. The paresthesia is the class-typical adverse effect — incidence reported at 30-50% for topiramate, dose-dependent (Pearl 2023 narrative review). Mechanism for peripheral paresthesia is incompletely worked out but two contributors are recognized: (1) the systemic mild acidosis lowers ionized calcium availability at neuromuscular junctions and at peripheral sensory nerve endings, producing the same tingling-around-extremities pattern seen in hyperventilation tetany; (2) direct CA inhibition in peripheral nerve myelin and Schwann cells (CA II and IV are expressed there) raises local pH gradient sensitivity and may directly affect axonal excitability. The paresthesia is benign, tends to attenuate over weeks (partial tolerance), and is dose-dependent — most users tolerate it. Worth noting: the same drugs also produce a 'soda tastes weird' phenomenon (CA VI in saliva — carbonation-sensing impaired) and the 'topamax brain fog' phenomenology that is distinct from paresthesia and likely AMPA/kainate-related.",
    steps: [
      {
        from: 'topiramate',
        to: 'carbonic anhydrase inhibition (CA II, IV, V, VI, VII)',
        via: 'sulfamate group binding zinc active site of CA; topiramate is a moderate-potency inhibitor compared to acetazolamide but inhibits more isoforms (Dodgson 2000)',
        source_pmid: 'PMID:10768298',
      },
      {
        from: 'carbonic anhydrase inhibition (CA II, IV, V, VI, VII)',
        to: 'impaired renal HCO3⁻ reabsorption in proximal tubule',
        via: 'CA IV (apical) + CA II (cytosolic) in proximal tubule normally regenerate HCO3⁻; inhibition → urinary bicarbonate loss → mild hyperchloremic metabolic acidosis (Maren 1967)',
        source_pmid: 'PMID:4964060',
      },
      {
        from: 'impaired renal HCO3⁻ reabsorption in proximal tubule',
        to: 'mild systemic metabolic acidosis + ↓ionized Ca²⁺',
        via: 'plasma HCO3⁻ falls 2-4 mEq/L; pH-dependent shift in Ca²⁺ binding to albumin — acidosis raises ionized Ca²⁺ globally but local nerve-ending ratios shift; concurrent CA inhibition in nerve directly perturbs Schwann pH handling',
        source_pmid: 'PMID:18167490',
      },
      {
        from: 'mild systemic metabolic acidosis + ↓ionized Ca²⁺',
        to: 'increased peripheral sensory nerve excitability (distal-symmetric)',
        via: 'Schwann-cell CA II/IV inhibition perturbs nodal pH micro-environment + acidosis-driven Ca²⁺ shifts → spontaneous low-threshold afferent firing in long fibers (fingers, toes, lips first — length-dependent)',
        source_pmid: 'PMID:37368102',
      },
      {
        from: 'increased peripheral sensory nerve excitability (distal-symmetric)',
        to: 'paresthesia ("tingling fingers + toes") + partial tolerance over weeks',
        via: 'dose-dependent, incidence 30-50% for topiramate; tends to attenuate by weeks 4-8; severe cases respond to dose reduction or supplemental KHCO3 / citrate',
        source_pmid: 'PMID:37368102',
      },
    ],
    modulators: [
      {
        slug: 'topiramate',
        effect: 'inhibitor',
        target: 'CA II, IV, V, VI, VII',
        note: 'broadest isoform coverage among approved CA inhibitors; paresthesia incidence 30-50%, dose-dependent; second most common reason for discontinuation after cognitive effects',
        source_pmid: 'PMID:37368102',
      },
      {
        slug: 'acetazolamide',
        effect: 'inhibitor',
        target: 'CA II + IV',
        note: 'classical CA inhibitor — used for glaucoma, altitude sickness prophylaxis, IIH, alkalosis correction; paresthesia is universal at therapeutic doses and is *the* characteristic AE',
        source_pmid: 'PMID:4964060',
      },
      {
        slug: 'zonisamide',
        effect: 'inhibitor',
        target: 'CA II (weaker than topiramate, plus Na/T-type Ca channels)',
        note: 'less paresthesia than topiramate because weaker CA II inhibitor; primary anti-seizure mechanism is Na channel + T-Ca, not CA',
      },
    ],
    refs: [
      'PMID:4964060',
      'PMID:18167490',
      'PMID:10768298',
      'PMID:37368102',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Melatonin REM rebound + grogginess — "vivid dreams + morning fog"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'melatonin_rem_rebound_grogginess',
    name: 'Melatonin MT1/MT2 dose-response + REM rebound',
    sensation: 'vivid dreams + morning grogginess',
    category: 'receptor_pharmacology',
    systems: ['nervous', 'endocrine'],
    domains: ['neuropsychiatric'],
    description:
      "Explains the two most-reported melatonin phenomenology shifts: (a) more vivid, longer, more emotionally intense dreams the night-of, and (b) lingering grogginess on waking — both more pronounced at the high doses (3-10 mg) typical of US OTC products than at the physiologic-mimic dose (~0.3 mg) the pharmacology actually supports. Melatonin acts at MT1 and MT2, Gi/Gq-coupled GPCRs in the SCN (Brzezinski 1997 NEJM review); MT1 mediates the sleep-promoting effect, MT2 the phase-shift effect. Zhdanova 2001 showed that 0.3 mg produces plasma levels approximating physiologic nocturnal peak and is sufficient for sleep-onset assistance in older insomnia; 3-10 mg pushes plasma to supraphysiologic peaks that persist into morning, explaining the grogginess. Burgess 2010 mapped the phase-response curve at 0.5 vs 3.0 mg and showed comparable peak phase-shift magnitude — the higher dose is not more effective, just longer-lasting. The vivid-dream phenomenon is REM-rebound-like: melatonin appears to consolidate REM and increase REM density (proposed mechanism: MT2-mediated facilitation of REM sleep generators in the pons + suppression of early-night arousals → more REM total) — but the strong-dose effect is also explained by morning-rising plasma overlap with normal endogenous SCN melatonin rise. Auger 2015 AASM guideline supports low-dose, well-timed melatonin (1-3 mg, 30-60 min before desired sleep) and explicitly notes the dose-grogginess relationship; Costello 2014 found grogginess and headache as the most common AEs. Mitigation: lower dose (0.3-1 mg), take 30-60 min before lights-out, prefer immediate-release over sustained-release for the dream/grogginess profile.",
    steps: [
      {
        from: 'melatonin',
        to: 'MT1 + MT2 receptor activation in SCN',
        via: 'Gi/Gq-coupled GPCRs — MT1 mediates the sleep-promoting effect (reduces SCN firing → loss of wake-promoting signal); MT2 mediates phase shifting (Brzezinski 1997)',
        source_pmid: 'PMID:8988899',
      },
      {
        from: 'MT1 + MT2 receptor activation in SCN',
        to: 'circadian phase shift + sleep onset facilitation',
        via: 'PRC: melatonin in the evening advances; in the morning delays — dose-dependent magnitude but plateau at modest doses (0.5 mg vs 3.0 mg comparable; Burgess 2010)',
        source_pmid: 'PMID:20410229',
      },
      {
        from: 'MT1 + MT2 receptor activation in SCN',
        to: 'REM facilitation + reduced early-night arousals → REM-dense sleep architecture',
        via: 'MT2 in pontine REM-generating regions consolidates REM bouts; reduced sleep fragmentation → more uninterrupted REM cycles → more dream recall and emotional intensity',
        source_pmid: 'PMID:26414986',
      },
      {
        from: 'REM facilitation + reduced early-night arousals → REM-dense sleep architecture',
        to: 'vivid dreams (the night-of phenomenology)',
        via: 'phenomenology = more total REM + later-night REM bouts that overlap with the waking transition (when dream recall is best); dose-dependent — more pronounced at 3-10 mg than at 0.3 mg',
        source_pmid: 'PMID:25380732',
      },
      {
        from: 'plasma melatonin concentration > physiologic peak (3-10 mg dose)',
        to: 'morning grogginess + hangover',
        via: 'supraphysiologic plasma levels at high OTC doses persist into morning (melatonin t½ ~30-50 min but Cmax 10-100× physiologic with 3-10 mg); overlap with endogenous morning rise window produces grogginess; lower dose (0.3-1 mg) mostly avoids this',
        source_pmid: 'PMID:11600532',
      },
    ],
    modulators: [
      {
        slug: 'melatonin',
        effect: 'activator',
        target: 'MT1 + MT2 receptors',
        note: "lower doses (0.3-1 mg) produce physiologic-range plasma levels and adequate sleep-onset effect with minimal next-day grogginess; the 3-10 mg US-OTC norm pushes supraphysiologic levels with no additional efficacy on phase shift (Burgess 2010) but more vivid dreams and morning hangover — Zhdanova's 0.3 mg work is the underused canonical reference here",
        source_pmid: 'PMID:11600532',
      },
    ],
    refs: [
      'PMID:8988899',
      'PMID:11600532',
      'PMID:20410229',
      'PMID:26414986',
      'PMID:25380732',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Creatine intracellular water shift — "muscle fullness"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'creatine_intracellular_water_pump',
    name: 'Creatine SLC6A8 intracellular osmotic loading',
    sensation: 'muscle fullness + scale weight jump',
    category: 'transport',
    systems: ['musculoskeletal'],
    domains: ['metabolic'],
    description:
      "Explains the 1-3 kg scale jump and the persistent 'pumped' feel that most lifters notice in week 1 of creatine loading or in week 2-3 of a maintenance-dose protocol — the most observable user-felt effect of the most-used legal ergogenic. Creatine enters skeletal muscle via SLC6A8 (CRT1), a Na+/Cl⁻-coupled cotransporter, and is phosphorylated in situ by creatine kinase to phosphocreatine. Hultman 1996 showed that loading (20 g/day × 5-7 days) raises intramuscular total creatine by ~20% in responders; lower maintenance doses (3-5 g/day × 3-4 weeks) reach the same plateau more slowly. Creatine + phosphocreatine are osmotically active solutes; their accumulation inside the myocyte pulls water across the sarcolemma — Powers 2003 demonstrated this directly with total body water + ICW/ECW measurement, showing that creatine raises total body water but does not alter the ICW:ECW ratio (i.e., water tracks the intracellular osmotic load rather than expanding ECW). This intracellular volume expansion is the 'fullness': individual myocytes swell ~3-5% and the muscle bellies look and feel rounder/firmer; the scale registers it as ~1-3 kg added body mass within the loading week — fluid, not fat or contractile protein. The effect saturates at the loading plateau; further intake is excreted in urine as creatinine (raising serum Cr without indicating renal impairment — a common lab-test confounder). Kreider 2017 ISSN position stand is the authoritative safety/efficacy summary; Volek 1999 covers the body-composition + training adaptation arc. Non-responders (~20-30%) have lower baseline transporter capacity / already-high muscle creatine and show smaller fullness effects.",
    steps: [
      {
        from: 'creatine',
        to: 'SLC6A8 (CRT1) Na+/Cl⁻-coupled uptake into myocyte',
        via: 'creatine transporter cotransports 2 Na+ + 1 Cl⁻ + 1 creatine; rate-limiting for muscle creatine pool size; Insulin upregulates CRT1 trafficking — co-ingestion with carbs improves loading',
        source_pmid: 'PMID:28615996',
      },
      {
        from: 'SLC6A8 (CRT1) Na+/Cl⁻-coupled uptake into myocyte',
        to: 'intracellular creatine + phosphocreatine pool expansion (~+20% total Cr)',
        via: 'cytosolic creatine kinase phosphorylates creatine using ATP → PCr; loading 20 g/day × 5-7 d raises total muscle creatine ~20% in responders (Hultman 1996)',
        source_pmid: 'PMID:8828669',
      },
      {
        from: 'intracellular creatine + phosphocreatine pool expansion (~+20% total Cr)',
        to: 'intracellular osmotic load → water draw across sarcolemma',
        via: 'creatine + PCr are osmotically active; ~120-160 mmol/L total muscle concentration after loading; aquaporin-mediated water shift to balance osmolarity',
        source_pmid: 'PMID:12937471',
      },
      {
        from: 'intracellular osmotic load → water draw across sarcolemma',
        to: 'myocyte volume expansion (~3-5%) + total body water rise without ECW shift',
        via: 'Powers 2003: TBW + ICW rise; ICW:ECW ratio preserved; characteristic ~1-3 kg scale weight jump in the loading week — fluid, not fat or contractile protein',
        source_pmid: 'PMID:12937471',
      },
      {
        from: 'myocyte volume expansion (~3-5%) + total body water rise without ECW shift',
        to: 'subjective "muscle fullness" + visible muscle belly thickening',
        via: 'phenomenology = persistent pumped feel, rounder muscle bellies, firmer-to-the-touch tone at rest; saturates at the loading plateau; non-responders (~20-30%) show smaller magnitude',
        source_pmid: 'PMID:10449017',
      },
    ],
    modulators: [
      {
        slug: 'creatine',
        effect: 'substrate',
        target: 'SLC6A8 (CRT1) → intramuscular creatine pool',
        note: 'standard protocols: load 20 g/day × 5-7 d → maintenance 3-5 g/day; OR direct maintenance 3-5 g/day reaches plateau in 3-4 weeks. Co-ingestion with carbs or protein improves loading via insulin-driven CRT1 upregulation. Excess intake is excreted as creatinine — confounds serum Cr labs without indicating renal impairment',
        source_pmid: 'PMID:28615996',
      },
    ],
    refs: [
      'PMID:8828669',
      'PMID:28615996',
      'PMID:12937471',
      'PMID:10449017',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Minoxidil shed phase — "the dread shed"
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'minoxidil_anagen_synchronization',
    name: 'Minoxidil anagen-synchronization initial shed',
    sensation: 'the dread shed (weeks 2-8)',
    category: 'receptor_pharmacology',
    systems: ['integumentary'],
    domains: ['dermatology'],
    description:
      "Explains the alarming temporary increase in hair shedding that hits 2-8 weeks after starting topical or oral minoxidil — the most common reason users abandon the drug before it has time to work. Minoxidil is a K⁺-ATP channel opener; in vascular smooth muscle this drives the original-indication antihypertensive effect, but in the hair follicle the pharmacology is different (Suchonwanit 2019 review; Messenger 2004 mechanism summary). The active metabolite is minoxidil sulfate, formed in the follicle by SULT1A1 — sulfotransferase activity is the rate-limiting step and is the basis of the 20-40% non-responder phenotype (Goren 2014 / Roberts 2014 showed plucked-hair SULT1A1 activity predicts clinical response). Follicular K⁺-ATP opening and downstream effects (VEGF upregulation, PGE2 increase, β-catenin signaling in the dermal papilla, Buhl 1989) shorten the telogen (resting) phase and trigger premature anagen (growth) entry. The catch: telogen hairs about to fall out anyway are pushed out simultaneously to make room for the synchronized new anagen growth — producing the visible shed at weeks 2-8. The hairs released ARE the old, miniaturized ones that were going to shed eventually; their loss is necessary for replacement. New anagen hairs become visible around weeks 12-16, with full effect at 6-12 months. Counseling matters: users not warned about the shed often interpret it as drug failure and stop — Mysore counseling protocols and ISHRS guidelines now flag this as a key pre-prescription discussion item. Olsen 1986 was the first dose-response demonstration of clinical efficacy in male pattern baldness.",
    steps: [
      {
        from: 'minoxidil',
        to: 'SULT1A1 conversion to minoxidil sulfate (in follicle)',
        via: 'sulfotransferase SULT1A1 in the outer root sheath converts minoxidil → minoxidil sulfate, the active species; sulfotransferase activity varies 20-30× between individuals → response variability',
        source_pmid: 'PMID:24773771',
      },
      {
        from: 'SULT1A1 conversion to minoxidil sulfate (in follicle)',
        to: 'K+ATP channel opening + dermal papilla VEGF / PGE2 / β-catenin signaling',
        via: 'minoxidil sulfate opens KATP → hyperpolarization → VEGF expression rise, PGE2 release, dermal papilla β-catenin pathway activation — pro-anagen mediators (Messenger 2004)',
        source_pmid: 'PMID:14996087',
      },
      {
        from: 'K+ATP channel opening + dermal papilla VEGF / PGE2 / β-catenin signaling',
        to: 'shortened telogen phase + premature anagen entry across follicles',
        via: 'follicle cycle re-synchronization — many follicles previously in late-telogen are pushed into anagen simultaneously; the cycle re-set is the mechanism, not a single-follicle "growth boost" (Buhl 1989)',
        source_pmid: 'PMID:2465357',
      },
      {
        from: 'shortened telogen phase + premature anagen entry across follicles',
        to: 'visible shed at weeks 2-8 (old telogen hairs displaced by new anagen)',
        via: 'the hairs that fall are the old miniaturized telogen hairs about to shed anyway — pushed out by the new anagen hair following them; pathognomonic timing and reversible, but psychologically alarming',
        source_pmid: 'PMID:31496654',
      },
      {
        from: 'visible shed at weeks 2-8 (old telogen hairs displaced by new anagen)',
        to: 'new anagen hair growth visible at weeks 12-16, full effect 6-12 months',
        via: 'dose-response demonstrated in Olsen 1986 (topical, MPB); oral 0.25-5 mg shows similar phenomenology with shorter onset; the shed is a positive prognostic sign in this framing — it indicates the drug is engaging the follicle cycle',
        source_pmid: 'PMID:3722507',
      },
    ],
    modulators: [
      {
        slug: 'minoxidil',
        effect: 'activator',
        target: 'follicular K+ATP channel (via SULT1A1-activated minoxidil sulfate)',
        note: 'topical 2-5% solution/foam BID was the original; oral low-dose (0.25-5 mg/day) is now widely used off-label with similar efficacy and shed-phase phenomenology — typically faster onset and more reliable absorption. Non-responders (~20-30%) have low follicular SULT1A1 activity — predictable with the Goren plucked-hair assay. Pre-treatment counseling about the shed is essential to retention',
        source_pmid: 'PMID:31496654',
      },
    ],
    refs: [
      'PMID:31496654',
      'PMID:14996087',
      'PMID:2465357',
      'PMID:3722507',
      'PMID:24773771',
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
