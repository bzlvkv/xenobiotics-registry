/**
 * 2026-05-02-systems-tagging.ts — bulk-tag every compound's body systems
 * from existing mechanism prose.
 *
 * Authoring rule (per packages/core/src/types.ts SystemId comment):
 * a system tag is justified when the compound's `mechanism` prose names
 * a target tissue / organ / receptor in that system. The mechanism field
 * is the no-fabrication ledger; systems[] is a derived marker.
 *
 * This script does NOT invent system tags. It runs a carefully-tuned
 * keyword pattern set against the existing mechanism + name + aliases +
 * category fields. Each pattern is tied to an unambiguous organ-system
 * signal (e.g. "GLP-1R" → endocrine; "myocardial" → cardiovascular).
 * Compounds whose mechanism doesn't trigger any pattern stay untagged
 * (`systems` field absent) and surface on /library/all under the
 * "Untagged" lens for manual authoring later.
 *
 * Idempotent: re-running on already-tagged compounds is a no-op
 * (existing systems[] is preserved). Only writes when adding new tags.
 *
 * Run:  pnpm tsx scripts/authoring/2026-05-02-systems-tagging.ts
 * Then: pnpm registry:lint  (warning count drops as tags land)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPOUNDS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'compounds.json');

type SystemId =
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'endocrine'
  | 'digestive'
  | 'renal'
  | 'reproductive'
  | 'musculoskeletal'
  | 'integumentary'
  | 'immune-hematologic';

type Compound = {
  slug: string;
  name: string;
  aliases?: string[];
  category?: string;
  mechanism?: string;
  systems?: SystemId[];
  notes?: string;
};

// ─────────────────────────────────────────────────────────────────────
// Keyword patterns, system-by-system. Each entry is a pattern + a label
// for the audit log. Patterns are case-insensitive. Designed for
// PRECISION over RECALL: a missed tag is fine (user revisits), a wrong
// tag is not.
//
// Pattern guidance:
//   - Whole-word boundaries via \b where possible
//   - Tie to receptor / tissue / organ NAMES, not vague descriptors
//   - "depression" alone is ambiguous (mood vs respiration); require
//     qualifying context ("respiratory depression", "antidepressant")
// ─────────────────────────────────────────────────────────────────────

type Pattern = { rx: RegExp; label: string };

const NERVOUS: Pattern[] = [
  // Receptor families anchored in the CNS
  { rx: /\badenosine\s+A[12][AB]?\b/i,           label: 'adenosine A1/A2A' },
  { rx: /\bGABA[-\s]?A\b/i,                      label: 'GABA-A' },
  { rx: /\bGABA[-\s]?B\b/i,                      label: 'GABA-B' },
  { rx: /\bNMDA\b/i,                             label: 'NMDA' },
  { rx: /\bAMPA(?:R|\b)/i,                       label: 'AMPA' },
  { rx: /\bkainate\s+receptor/i,                 label: 'kainate receptor' },
  { rx: /\bglycine\s+receptor/i,                 label: 'glycine receptor' },
  // Greek/micro glyphs (µ U+00B5, μ U+03BC, κ U+03BA, δ U+03B4) aren't
  // word characters, so `\b` doesn't anchor before them. Drop the
  // leading `\b` for those forms; keep it for the ASCII "mu/kappa/delta"
  // spellings via alternation.
  { rx: /(?:\bmu|µ|μ)[-\s]?opioid\b/i,           label: 'µ-opioid' },
  { rx: /(?:\bkappa|κ)[-\s]?opioid\b/i,          label: 'κ-opioid' },
  { rx: /(?:\bdelta|δ)[-\s]?opioid\b/i,          label: 'δ-opioid' },
  { rx: /\bdopamine\s+D[1-5]\b/i,                label: 'dopamine D-receptor' },
  { rx: /\b(?:5[-\s]?HT|serotonin)\s*[12][ABCD]?(?:\s+receptor)?\b/i, label: '5-HT receptor' },
  { rx: /\bhistamine\s+H[123]\b/i,               label: 'histamine H-receptor' },
  { rx: /\bH1\s+(?:antihistamine|antagonist|blocker|receptor)/i, label: 'H1 antihistamine' },
  { rx: /\bcannabinoid\s+CB[12]\b/i,             label: 'cannabinoid CB' },
  { rx: /\bsigma[-\s]?[12]\s+receptor/i,         label: 'sigma receptor' },
  { rx: /\borexin\b/i,                           label: 'orexin' },
  { rx: /\bmelatonin\s+MT[12]\b/i,               label: 'melatonin MT' },
  { rx: /\bmuscarinic\s+(?:M[1-5]|receptor|antagonist|agonist)/i, label: 'muscarinic receptor' },
  { rx: /\bnicotinic[-\s]+(?:acetylcholine|ACh|receptor)/i, label: 'nicotinic AChR' },
  { rx: /\bnAChR\b/i,                            label: 'nAChR' },
  { rx: /\bmonoamine\s+oxidase\b|\bMAO[-\s]?[AB]?\b/i, label: 'monoamine oxidase' },
  { rx: /\b(?:NET|noradrenaline\s+transporter|norepinephrine\s+transporter)\b/i, label: 'NET' },
  { rx: /\bSERT\b|\bserotonin\s+transporter\b/i, label: 'SERT' },
  { rx: /\bDAT\b|\bdopamine\s+transporter\b/i,   label: 'DAT' },
  // CNS drug classes — abbreviations are unambiguously CNS contexts.
  { rx: /\bSSRI\b|\bSNRI\b|\bNDRI\b|\bSARI\b|\bMAOI\b/, label: 'CNS class (SSRI/SNRI/etc.)' },
  // Stimulant / sympathomimetic agents
  { rx: /\bsympathomimetic\b/i,                  label: 'sympathomimetic' },
  { rx: /\bamphetamine(?:s)?\b/i,                label: 'amphetamine' },
  // Migraine + neuropeptide signaling
  { rx: /\bCGRP\b/,                              label: 'CGRP' },
  { rx: /\btrigeminovascular\b/i,                label: 'trigeminovascular' },
  { rx: /\bmigraine\b/i,                         label: 'migraine' },
  { rx: /\bcluster\s+headache\b/i,               label: 'cluster headache' },
  { rx: /\bparkinson(?:'s|ism|'s\s+disease)?\b/i, label: 'parkinsonism' },
  // Brain regions and CNS structures
  { rx: /\b(?:hippocamp|prefrontal|striat|nucleus accumbens|thalam|hypothalam|amygdal|cerebell|cortex|brainstem|basal\s+ganglia)/i, label: 'CNS region' },
  { rx: /\bspinal\s+cord\b/i,                    label: 'spinal cord' },
  // Eye / retina — CNS-derived tissue (optic nerve = CNS tract)
  { rx: /\bretina(?:l)?\b/i,                     label: 'retina' },
  { rx: /\bmacula(?:r)?\b/i,                     label: 'macula' },
  { rx: /\bblood[-\s]brain\s+barrier|\bBBB\b/i,  label: 'BBB' },
  // Functional / clinical descriptors that uniquely indicate CNS
  { rx: /\banxiolytic\b/i,                       label: 'anxiolytic' },
  { rx: /\bantidepressant\b/i,                   label: 'antidepressant' },
  { rx: /\bantipsychotic\b/i,                    label: 'antipsychotic' },
  { rx: /\banticonvulsant\b|\bantiepileptic\b|\bepilepsy\b|\bseizure\b/i, label: 'anticonvulsant' },
  { rx: /\b(?:sedative|hypnotic)\b/i,             label: 'sedative/hypnotic' },
  { rx: /\bbenzodiazepine\b/i,                    label: 'benzodiazepine' },
  { rx: /\bbarbiturate\b/i,                       label: 'barbiturate' },
  { rx: /\bSV2A\b/,                              label: 'SV2A (CNS)' },
  { rx: /\bvoltage[-\s]gated\s+(?:sodium|Na\+?)\s+channel\b/i, label: 'voltage-gated Na+ channel' },
  { rx: /\bvoltage[-\s]gated\s+(?:calcium|Ca²?\+?)\s+channel\b/i, label: 'voltage-gated Ca channel' },
  { rx: /\b(?:local|general|spinal|epidural)\s+anesthetic\b/i, label: 'anesthetic' },
  { rx: /\bnerve\s+block\b/i,                    label: 'nerve block' },
  { rx: /\boptic\s+neuritis\b/i,                 label: 'optic neuritis' },
  // Greek α2-adrenergic (the glyph version)
  { rx: /α2[-\s]?adrenergic|\balpha[-\s]?2[-\s]?adrenergic/i, label: 'α2-adrenergic' },
  { rx: /\bneuroprotect/i,                       label: 'neuroprotection' },
  { rx: /\bneurogenes/i,                         label: 'neurogenesis' },
  { rx: /\bsynapt(?:ic|ogen)/i,                  label: 'synaptic' },
  { rx: /\bBDNF\b/i,                             label: 'BDNF' },
  { rx: /\bcognitive\s+enhanc|\bnootropic\s+effect/i, label: 'cognitive enhancement' },
  // CNS / PNS / brain — positive-context only. Bare "CNS" caught
  // dismissive prose like "low CNS penetration" (rosuvastatin) where the
  // drug DOESN'T act on the CNS. We require a positive qualifier or a
  // structural mention (BBB, brain region, action verb).
  { rx: /\b(?:enhanced|increased|high|good|improved|excellent)\s+CNS\b/i, label: 'CNS (positive)' },
  { rx: /\bCNS\s+(?:depression|stimulation|activity|effect|penetrant|active)/i, label: 'CNS action' },
  { rx: /\bdepress(?:ion|ive)\s+disorder|\bmajor\s+depress/i, label: 'depression (clinical)' },
  { rx: /\bCNS[-\s](?:active|penetrant|targeted)/i, label: 'CNS-active' },
  { rx: /\bcrosses\s+(?:the\s+)?(?:BBB|blood[-\s]brain\s+barrier)/i, label: 'crosses BBB' },
  { rx: /\bPNS\b/,                               label: 'PNS' },
  { rx: /\b(?:in\s+the\s+)?brain\s+(?:waves?|function|tissue|barrier|penetrat|effect)/i, label: 'brain (qualified)' },
  { rx: /\bnerve\s+(?:conduction|transmission|growth)/i, label: 'nerve function' },
  { rx: /\bneuropath\w*\b/i,                    label: 'neuropathy' },
  { rx: /\bnociceptor\w*\b/i,                   label: 'nociceptor' },
  { rx: /\bTRPV[12]?\b/i,                       label: 'TRPV channel' },
  { rx: /\bTRPM[123458]?\b/i,                   label: 'TRPM channel' },
  { rx: /\bNGF\b/,                               label: 'NGF (nerve growth)' },
  { rx: /\bmyelin/i,                             label: 'myelin' },
  { rx: /\bneurotransmitt/i,                     label: 'neurotransmitter' },
  // Bare neurotransmitter names — these are unambiguously CNS chemistry
  // when named as the compound's mechanism target. False-positive risk
  // is low because a non-CNS compound rarely names dopamine/GABA in
  // mechanism prose unless it acts on them.
  { rx: /\b(?:modulates?|releases?|inhibits?|enhances?|antagon|agon|stimulat|reuptak|increas|decreas|blocks?|substrate\s+for|precursor\s+(?:to|of|for)|synthesi[sz]es)\s+[A-Za-z,\s+\/-]*?\b(?:GABA|glutamate|dopamine|serotonin|noradrenaline|norepinephrine|acetylcholine|histamine)\b/i, label: 'neurotransmitter (action)' },
  { rx: /\b(?:GABA|glutamate|dopamine|serotonin|noradrenaline|norepinephrine|acetylcholine)\s+(?:reuptake|release|synthesis|biosynthesis|signaling|signalling|receptor|transporter|precursor)/i, label: 'neurotransmitter (target)' },
  { rx: /\b(?:dopaminergic|serotonergic|noradrenergic|GABAergic|glutamatergic|cholinergic|histaminergic)/i, label: 'neurotransmitter system' },
  // Bare neurotransmitters with action context — tryptophan-style cases
  // where the prose names the pathway but not a specific receptor.
  { rx: /\bserotonin\s+(?:synth|pathway|release|reuptake|biosynthesis|precursor|production|level)/i, label: 'serotonin pathway' },
  { rx: /\bmelatonin\s+pathway\b|\bmelatonin\s+(?:synth|biosynth)/i, label: 'melatonin pathway' },
];

const CARDIOVASCULAR: Pattern[] = [
  { rx: /\bmyocard/i,                            label: 'myocardium' },
  { rx: /\bcardiac\s+(?:muscle|output|contract|function|conduction|uptake|tissue|cell|action|remodel)/i, label: 'cardiac function' },
  { rx: /\bcoronary\b/i,                         label: 'coronary' },
  { rx: /\batri(?:al|um)\b/i,                    label: 'atrial' },
  { rx: /\bventricular\b/i,                      label: 'ventricular' },
  { rx: /\barrhythm/i,                           label: 'arrhythmia' },
  { rx: /\bathero(?:scleros|genic)/i,            label: 'atherosclerosis' },
  { rx: /\b(?:hypertensi|antihypertensive)/i,    label: 'hypertension' },
  { rx: /\bblood\s+pressure\b|\bBP\b/i,          label: 'blood pressure' },
  { rx: /\b(?:vasodilat|vasoconstrict)/i,        label: 'vaso-' },
  { rx: /\bendothel(?:ial|ium|in)/i,             label: 'endothelium' },
  { rx: /\b(?:LDL|HDL|VLDL|cholesterol)\b/,      label: 'cholesterol' },
  { rx: /\btriglyceride/i,                       label: 'triglycerides' },
  { rx: /\bapolipoprotein|\bApo[BCE]\b/i,        label: 'apolipoprotein' },
  { rx: /\bPCSK9\b/i,                            label: 'PCSK9' },
  { rx: /\bHMG[-\s]?CoA/i,                       label: 'HMG-CoA' },
  { rx: /\bstatin/i,                             label: 'statin (lipid)' },
  { rx: /\bfibrate/i,                            label: 'fibrate (lipid)' },
  { rx: /\bPPAR[-\s]?α|\bPPAR[-\s]?alpha/i,      label: 'PPAR-α (fibrate)' },
  { rx: /\bbeta[-\s]?adrenergic\s+blocker|\bβ[-\s]?blocker\b/i, label: 'β-blocker' },
  { rx: /\bACE\s+inhibit|\bangiotensin[-\s]converting\s+enzyme/i, label: 'ACE inhibitor' },
  { rx: /\bARB\b|\bangiotensin\s+receptor\s+blocker/i, label: 'ARB' },
  { rx: /\bRAAS\b/i,                             label: 'RAAS' },
  { rx: /\bcalcium\s+channel\s+blocker/i,        label: 'CCB' },
  { rx: /\bischemic\s+heart\s+disease|\bMI\b|\bmyocardial\s+infarction/i, label: 'IHD' },
  { rx: /\bheart\s+failure\b/i,                  label: 'heart failure' },
  { rx: /\bvascular\s+(?:smooth\s+muscle|tone|resistance|inflammation)/i, label: 'vascular' },
  { rx: /\bcardiovascular\s+(?:benefit|risk|disease|outcome|effect|protect|event|mortality)/i, label: 'cardiovascular (qualified)' },
  { rx: /\bCV[-\s](?:effect|risk|protect|contribution|benefit|outcome|mortality|event)\b/i, label: 'CV (abbrev)' },
  { rx: /\bω-?3\b|\bomega-?3\b|\bn-?3\s+PUFA/i,  label: 'ω-3 (lipid)' },
];

const RESPIRATORY: Pattern[] = [
  { rx: /\b(?:lung|pulmonary)\b/i,               label: 'lung/pulmonary' },
  { rx: /\bbronch(?:i|ial|odilat|oconstrict|ospasm)/i, label: 'bronchial' },
  { rx: /\balveol/i,                             label: 'alveolar' },
  { rx: /\bairway/i,                             label: 'airway' },
  { rx: /\basthma\b/i,                           label: 'asthma' },
  { rx: /\bCOPD\b/,                              label: 'COPD' },
  { rx: /\bdyspnea\b/i,                          label: 'dyspnea' },
  { rx: /\bbeta[-\s]?2[-\s]?adrenergic|\bβ2[-\s]?adrenergic/i, label: 'β2-adrenergic' },
  { rx: /\brespiratory\s+depression/i,           label: 'respiratory depression' },
  { rx: /\brespiratory\s+(?:infection|tract|illness|symptom|virus|drive)/i, label: 'respiratory (qualified)' },
  { rx: /\bupper\s+respiratory\b/i,              label: 'upper respiratory' },
  { rx: /\b(?:common\s+)?cold\s+(?:duration|onset|symptom|lozenge|prophylax)/i, label: 'common cold' },
  { rx: /\binhalation(?:al)?\s+(?:steroid|corticosteroid|anesthetic)/i, label: 'inhalation' },
  { rx: /\bmucus\s+clearance|\bsurfactant\b/i,   label: 'mucus/surfactant' },
];

const ENDOCRINE: Pattern[] = [
  // Specific endocrine receptors
  { rx: /\bGLP[-\s]?1R?\b/,                      label: 'GLP-1' },
  { rx: /\bGIP[-\s]?R?\b/,                       label: 'GIP' },
  { rx: /\bglucagon\s+receptor/i,                label: 'glucagon receptor' },
  { rx: /\bandrogen\s+receptor\b|\bAR\b(?!.*receptor)/i, label: 'androgen receptor' },
  { rx: /\bestrogen\s+receptor\b|\bER[αβ]\b|\bER[-\s]alpha|\bER[-\s]beta/i, label: 'estrogen receptor' },
  { rx: /\bprogesterone\s+receptor/i,            label: 'progesterone receptor' },
  { rx: /\bglucocorticoid\s+receptor/i,          label: 'glucocorticoid receptor' },
  { rx: /\bmineralocorticoid\s+receptor/i,       label: 'mineralocorticoid receptor' },
  { rx: /\bthyroid\s+(?:hormone\s+receptor|receptor)|\bTR[αβ]/i, label: 'thyroid receptor' },
  { rx: /\bvitamin[-\s]?D\s+receptor|\bVDR\b/i,  label: 'VDR' },
  { rx: /\bretinoic[-\s]?acid\s+receptor|\bRAR-?[αβγ]?|\bRXR\b/i, label: 'retinoic acid receptor' },
  { rx: /\bmelanocortin\s+receptor|\bMC[1-5]R/i, label: 'melanocortin receptor' },
  { rx: /\binsulin\s+receptor\b/i,               label: 'insulin receptor' },
  { rx: /\bsomatostatin\s+receptor|\bSST[1-5]\b/, label: 'somatostatin receptor' },
  // Hormones (action in the body)
  { rx: /\b(?:testosterone|dihydrotestosterone|DHT)\b/i, label: 'testosterone/DHT' },
  { rx: /\bestradiol\b|\bestrogen\b/i,           label: 'estrogen/estradiol' },
  { rx: /\bprogesterone\b/i,                     label: 'progesterone' },
  { rx: /\bcortisol\b|\bcortisone\b/i,           label: 'cortisol' },
  { rx: /\baldosterone\b/i,                      label: 'aldosterone' },
  { rx: /\bgrowth\s+hormone\b|\bIGF[-\s]?1\b/i,  label: 'GH/IGF-1' },
  { rx: /\bprolactin\b/i,                        label: 'prolactin' },
  { rx: /\boxytocin\b/i,                         label: 'oxytocin' },
  { rx: /\bvasopressin\b|\bADH\b/i,              label: 'vasopressin/ADH' },
  { rx: /\b(?:T3|T4|thyroxine|triiodothyronine)\b/, label: 'thyroid hormone' },
  { rx: /\bTSH\b|\bthyroid[-\s]?stimulating/i,   label: 'TSH' },
  { rx: /\bLH\b|\bluteinizing/i,                 label: 'LH' },
  { rx: /\bFSH\b|\bfollicle[-\s]?stimulating/i,  label: 'FSH' },
  { rx: /\bGnRH\b|\bgonadotropin[-\s]?releasing/i, label: 'GnRH' },
  { rx: /\bACTH\b|\bcorticotropin/i,             label: 'ACTH' },
  { rx: /\bsomatostatin\b/i,                     label: 'somatostatin' },
  { rx: /\binsulin\b/i,                          label: 'insulin' },
  { rx: /\bglucagon\b/i,                         label: 'glucagon' },
  { rx: /\bleptin\b/i,                           label: 'leptin' },
  { rx: /\bghrelin\b/i,                          label: 'ghrelin' },
  { rx: /\bincretin\b/i,                         label: 'incretin' },
  { rx: /\bmelatonin\b(?!\s+MT)/i,               label: 'melatonin (hormone)' },
  // Tissues / glands
  { rx: /\bthyroid\b(?!\s+hormone)/i,            label: 'thyroid gland' },
  { rx: /\badrenal\b/i,                          label: 'adrenal' },
  { rx: /\bpituitary\b/i,                        label: 'pituitary' },
  { rx: /\bpancrea(?:tic\s+islet|s\s+islet)/i,   label: 'pancreatic islet' },
  { rx: /\bislet\s+(?:cell|β[-\s]?cell|alpha[-\s]?cell)/i, label: 'islet cell' },
  { rx: /\bparathyroid\b/i,                      label: 'parathyroid' },
  { rx: /\bpineal\b/i,                           label: 'pineal' },
  // Enzymes (steroidogenesis / hormone metabolism)
  { rx: /\b5[α-]?[-\s]?reductase\b/i,            label: '5α-reductase' },
  { rx: /\baromatase\b/i,                        label: 'aromatase' },
  { rx: /\b11β[-\s]?HSD|\b11[-\s]?beta[-\s]?hydroxysteroid/i, label: '11β-HSD' },
  // Functional / clinical
  { rx: /\bHPA\s+axis\b/,                        label: 'HPA axis' },
  { rx: /\bHPT\s+axis\b/,                        label: 'HPT axis' },
  { rx: /\bhormone\s+replacement\b/i,            label: 'HRT' },
  { rx: /\bdiabetes\b|\bT[12]D(?:M|)\b/i,        label: 'diabetes' },
  { rx: /\bhypothyroid|\bhyperthyroid/i,         label: 'thyroid disorder' },
  { rx: /\bhypogonad/i,                          label: 'hypogonadism' },
  { rx: /\bsteroid\s+hormone\b/i,                label: 'steroid hormone' },
  { rx: /\banabolic\b/i,                         label: 'anabolic' },
  { rx: /\bglucose\s+(?:homeostasis|control)/i,  label: 'glucose homeostasis' },
  { rx: /\bglycemic\s+control\b/i,               label: 'glycemic control' },
];

const DIGESTIVE: Pattern[] = [
  // Liver / hepatic. Bare "liver" was too weak — fired on incidental
  // mentions like "type I isoform (sebum, liver)" without the compound
  // actually acting hepatically. The "hepat-" stem is reliable; pair
  // bare "liver" with verbs that imply target organ.
  { rx: /\bliver\s+(?:metabolism|disease|cell|injury|enzyme|toxicity|cirrhosis|fibrosis|fat|steatosis)/i, label: 'liver (action)' },
  { rx: /\b(?:in\s+the\s+)?liver(?:\s+via|\s+by|\s+through)?\b(?=[^.]*?(?:metaboli|clear|hydroxyl|conjug|secret|target))/i, label: 'liver (action context)' },
  { rx: /\bhepat(?:ic|itis|ocyte|ocellular)/i,   label: 'hepatic' },
  { rx: /\bbile\b|\bbiliary\b/i,                 label: 'bile/biliary' },
  // GI tract
  { rx: /\bgastric\s+(?:mucosa|emptying|acid|secretion|ulcer)/i, label: 'gastric' },
  { rx: /\bintestin(?:al|e)/i,                   label: 'intestinal' },
  { rx: /\bcolon(?:ic)?\b/i,                     label: 'colon' },
  { rx: /\bduoden|\bjejun|\bileum/i,             label: 'small intestine segment' },
  { rx: /\benterocyte\b/i,                       label: 'enterocyte' },
  { rx: /\bbrush[-\s]?border\b/i,                label: 'brush border' },
  { rx: /\bgastro(?:intestinal|enteritis)/i,     label: 'GI' },
  { rx: /\bGI\s+tract\b|\bGI\s+(?:absorption|motility)\b/, label: 'GI tract' },
  // Bare "gut" with action context — caught absorption / motility /
  // microbiome but not "in the gut" alone (could be incidental).
  { rx: /\b(?:in\s+the\s+)?gut\s+(?:absorption|motility|microbi|barrier|wall|lumen|epithel)/i, label: 'gut (action)' },
  { rx: /\b(?:in\s+the\s+|in\s+|to\s+)?gut\b(?=[^.]*?(?:absorpt|metaboli|secret|enzyme|fe\s+absorb))/i, label: 'gut (action context)' },
  // Intestinal nutrient transporters
  { rx: /\bPEPT1\b|\bDMT1\b|\bSGLT1\b|\bGLUT[125]\b/, label: 'intestinal transporter' },
  // Hepatic urea cycle + iron homeostasis
  { rx: /\burea\s+(?:cycle|synthesis)\b/i,       label: 'urea cycle (hepatic)' },
  { rx: /\bhepcidin\b/i,                         label: 'hepcidin (hepatic)' },
  { rx: /\bGI\s+(?:irritat|tolerance|side[-\s]effect)/i, label: 'GI tolerance' },
  // H2 receptor (gastric parietal cell target) and proton pump
  { rx: /\bH2\s+receptor/i,                      label: 'H2 receptor (gastric)' },
  { rx: /\bproton\s+pump\b|\bH\+\/K\+[-\s]?ATPase\b/i, label: 'proton pump' },
  { rx: /\bparietal\s+cell\b/i,                  label: 'parietal cell' },
  // Pancreas exocrine (note: pancreatic islet is endocrine, captured above)
  { rx: /\bpancreatic\s+exocrine|\bpancreatic\s+enzyme/i, label: 'pancreas exocrine' },
  // Drug-metabolizing enzymes (mostly hepatic + intestinal)
  { rx: /\bCYP[12345][ABCD]?\d?/i,               label: 'CYP enzyme' },
  { rx: /\bP[-\s]?glycoprotein\b|\bP[-\s]?gp\b/i, label: 'P-gp' },
  { rx: /\bUGT\b|\buridine[-\s]?diphosphate[-\s]?glucuronosyltransferase/i, label: 'UGT' },
  { rx: /\bMRP[12345]\b|\bMDR1\b/,               label: 'MRP/MDR1' },
  { rx: /\bOATP\b|\borganic\s+anion\s+transporter/i, label: 'OATP' },
  { rx: /\bBCRP\b/,                              label: 'BCRP' },
  { rx: /\bglutathione[-\s]?S[-\s]?transferase|\bGSTs?\b/i, label: 'GST' },
  // First-pass / clearance
  { rx: /\bfirst[-\s]?pass\b/i,                  label: 'first-pass' },
  { rx: /\bhepatic\s+clearance\b/i,              label: 'hepatic clearance' },
  { rx: /\bintestinal\s+absorption\b/i,          label: 'intestinal absorption' },
  // Clinical
  { rx: /\bIBD\b|\bIBS\b|\bcrohn|\bulcerative\s+colitis|\bGERD\b|\bpeptic\s+ulcer/i, label: 'GI disorder' },
  { rx: /\bcholestyramine|\bcholestasis/i,       label: 'cholestasis' },
  { rx: /\bhepatotoxic/i,                        label: 'hepatotoxicity' },
  { rx: /\bsatiety\b|\bappetite\s+suppress/i,    label: 'satiety' },
];

const RENAL: Pattern[] = [
  { rx: /\b(?:kidney|kidneys)\b/i,               label: 'kidney' },
  { rx: /\brenal\b/i,                            label: 'renal' },
  { rx: /\bnephro(?:n|tic|toxic|pathy)/i,        label: 'nephron/nephropathy' },
  // Standalone "nephro" with implied suffix — catches prose like "nephro / oto toxicity"
  { rx: /\bnephro\b/i,                           label: 'nephro (standalone)' },
  { rx: /\bglomerul(?:ar|onephritis)/i,          label: 'glomerular' },
  { rx: /\btubular\s+(?:secretion|reabsorption|necrosis)/i, label: 'tubular' },
  // Bare "urine" was matching incidentals like "maple syrup urine
  // disease" (a metabolic disorder named for the smell, not a renal
  // pathology). Require the adjective form OR an explicit renal action.
  { rx: /\burinary\b/i,                          label: 'urinary' },
  { rx: /\burine\s+(?:output|production|excretion|sample|test|flow|volume)/i, label: 'urine (action)' },
  { rx: /\bexcret\w*\s+(?:[a-z\s]{1,15}\s+)?(?:in|via)\s+(?:the\s+)?urine\b/i, label: 'urinary excretion' },
  { rx: /\bbladder\b/i,                          label: 'bladder' },
  { rx: /\bGFR\b|\bcreatinine\s+clearance\b/i,   label: 'GFR' },
  { rx: /\bdiuret(?:ic|ics|ic\s+effect)/i,       label: 'diuretic' },
  { rx: /\bSGLT[12]\b/,                          label: 'SGLT' },
  { rx: /\bloop\s+diuretic|\bthiazide|\bK[-\s]?sparing\s+diuretic/i, label: 'diuretic class' },
  { rx: /\bCKD\b|\bAKI\b|\bESRD\b/,              label: 'kidney disease' },
];

const REPRODUCTIVE: Pattern[] = [
  { rx: /\bovary|\bovarian\b/i,                  label: 'ovary' },
  { rx: /\bovulat/i,                             label: 'ovulation' },
  { rx: /\btestic(?:le|ular|les)\b/i,            label: 'testes' },
  { rx: /\bprostat(?:e|ic)\b/i,                  label: 'prostate' },
  { rx: /\bsperm(?:ato)?(?:gen|cyte|atid)?/i,    label: 'sperm' },
  { rx: /\bseminal\s+vesicle/i,                  label: 'seminal vesicle' },
  { rx: /\buterine\b|\bendometri/i,              label: 'uterine/endometrial' },
  { rx: /\bmenstrual\b|\bmenarch/i,              label: 'menstrual' },
  { rx: /\bmenopaus/i,                           label: 'menopause' },
  { rx: /\bvagin(?:a|al)/i,                      label: 'vaginal' },
  { rx: /\bfertil(?:ity|ization)/i,              label: 'fertility' },
  { rx: /\bcontracept(?:ive|ion)/i,              label: 'contraception' },
  { rx: /\bsexual\s+function\b/i,                label: 'sexual function' },
  { rx: /\berectile\b|\bgynaecomast/i,            label: 'erectile/gyne' },
  { rx: /\bbreast\s+(?:cancer|tissue)/i,         label: 'breast' },
  { rx: /\bgonad(?:al|s)\b/i,                    label: 'gonad' },
  { rx: /\bSERM\b|\bselective\s+estrogen\s+receptor/i, label: 'SERM' },
  { rx: /\bBPH\b|\bbenign\s+prostatic/i,         label: 'BPH' },
  { rx: /\bPCOS\b/,                              label: 'PCOS' },
  { rx: /\blibido\b/i,                           label: 'libido' },
];

const MUSCULOSKELETAL: Pattern[] = [
  // "muscle" alone is ambiguous — smooth muscle (gut/vasculature) and
  // cardiac muscle aren't MSK. Require qualifier or specific MSK term.
  { rx: /\bskeletal\s+muscle\b/i,                label: 'skeletal muscle' },
  { rx: /\bmuscle\s+(?:protein\s+synthesis|hypertrophy|atrophy|fiber|tissue|wasting|catabolism|nitrogen|BCAA|amino\s+acid|anabolism|relaxant|acidosis|biogenesis|oxidation|cramp)/i, label: 'muscle (qualified)' },
  { rx: /\bcarnitine\s+biosynthesis\b/i,         label: 'carnitine biosynthesis' },
  { rx: /\bfibromyalgia\b/i,                    label: 'fibromyalgia' },
  { rx: /\bsarcomere\b/i,                        label: 'sarcomere' },
  { rx: /\bsarcoplasmic\s+reticulum\b/i,         label: 'sarcoplasmic reticulum' },
  { rx: /\b(?:bone|osteo(?:blast|clast|cyte|porosis|penia|arthritis))/i, label: 'bone/osteo' },
  { rx: /\bcartilage\b|\bchondro(?:cyte|itin)/i, label: 'cartilage' },
  { rx: /\btendon\b|\btendinopath/i,             label: 'tendon' },
  { rx: /\bligament\b/i,                         label: 'ligament' },
  { rx: /\bjoint\b/i,                            label: 'joint' },
  { rx: /\bphosphocreatine\b|\bcreatine\s+kinase\b/i, label: 'phosphocreatine' },
  { rx: /\bATP\s+regeneration\b/i,               label: 'ATP regeneration' },
  { rx: /\bprotein\s+synthesis\s+(?:in|.*muscle)/i, label: 'muscle protein synthesis' },
  { rx: /\bhypertrophy\b|\batrophy\b/i,          label: 'hypertrophy/atrophy' },
  { rx: /\bsarcopen|\bcachexia\b/i,              label: 'sarcopenia' },
  { rx: /\bcollagen\s+(?:I|II|III|synthesis|hydroxylation|cross[-\s]link|biosynthesis|deposition|formation)/i, label: 'collagen' },
  { rx: /\blysyl\s+oxidase\b/i,                 label: 'lysyl oxidase (collagen)' },
  { rx: /\bRANK[-\s]?L\b|\bbisphosphonate\b/i,   label: 'bone resorption' },
  { rx: /\b(?:rheumatoid|osteo)arthritis\b/i,    label: 'arthritis' },
];

const INTEGUMENTARY: Pattern[] = [
  { rx: /\b(?:skin|cutaneous)\b/i,               label: 'skin' },
  { rx: /\bepiderm(?:is|al)/i,                   label: 'epidermis' },
  { rx: /\bdermal\b|\bdermis\b/i,                label: 'dermis' },
  { rx: /\bstratum\s+corneum\b/i,                label: 'stratum corneum' },
  { rx: /\b(?:hair\s+)?follicle/i,               label: 'follicle' },
  { rx: /\bsebac(?:eous|um)/i,                   label: 'sebaceous' },
  { rx: /\bsebum\b/i,                            label: 'sebum' },
  { rx: /\bscalp\b/i,                            label: 'scalp' },
  { rx: /\bnail\b/i,                             label: 'nail' },
  { rx: /\bkeratin(?:o|isation|ization|ocyte)/i, label: 'keratin' },
  { rx: /\bmelan(?:in|ocyte|ogenesis)/i,         label: 'melanin' },
  { rx: /\bpigment(?:ation)?/i,                  label: 'pigmentation' },
  { rx: /\bphotoag/i,                            label: 'photoaging' },
  { rx: /\bUV(?:[\sB-])|\bultraviolet/i,         label: 'UV' },
  { rx: /\bacne\b|\bpsorias|\beczema|\batopic\s+dermatitis|\bmelasma|\balopecia|\bvitiligo|\brosacea/i, label: 'skin condition' },
  { rx: /\btopical\s+(?:retinoid|retinoin|application|vehicle|absorption)/i, label: 'topical formulation' },
];

const IMMUNE_HEMATOLOGIC: Pattern[] = [
  // Tissues / cells
  { rx: /\blymph(?:atic|ocyte|node)/i,           label: 'lymphatic/lymphocyte' },
  { rx: /\bspleen\b/i,                           label: 'spleen' },
  { rx: /\bthymus\b/i,                           label: 'thymus' },
  { rx: /\bbone\s+marrow\b/i,                    label: 'bone marrow' },
  { rx: /\bT[-\s]?cell|\bCD[48]\+/i,             label: 'T-cell' },
  { rx: /\bB[-\s]?cell\b/i,                      label: 'B-cell' },
  { rx: /\bNK\s+cell\b/,                         label: 'NK-cell' },
  { rx: /\bneutrophil/i,                         label: 'neutrophil' },
  { rx: /\b(?:eosinophil|basophil|monocyte|macrophage|dendritic\s+cell|mast\s+cell)/i, label: 'leukocyte' },
  { rx: /\bplatelet\b|\bthrombocyt/i,            label: 'platelet' },
  { rx: /\b(?:RBC|erythrocyte|red\s+blood\s+cell)\b/i, label: 'erythrocyte' },
  { rx: /\bhemoglobin\b/i,                       label: 'hemoglobin' },
  { rx: /\bleukocyt/i,                           label: 'leukocyte' },
  // Cytokines / signaling
  { rx: /\bcytokin/i,                            label: 'cytokine' },
  { rx: /\binterleukin\b|\bIL[-\s]?\d/i,         label: 'interleukin' },
  { rx: /\bTNF[-\s]?(?:α|alpha)?\b/i,            label: 'TNF' },
  { rx: /\binterferon\b|\bIFN[-\s]?(?:α|β|γ)/i,  label: 'interferon' },
  { rx: /\bcomplement\s+(?:cascade|system|C[1-9])/i, label: 'complement' },
  { rx: /\bantibody\b|\bantibodies\b|\bIgG\b|\bIgE\b|\bIgA\b|\bIgM\b/i, label: 'antibody' },
  { rx: /\bMHC\b|\bHLA\b/,                       label: 'MHC/HLA' },
  { rx: /\bNLRP3\b|\binflammasome\b/i,           label: 'inflammasome' },
  // Hemostasis / coagulation
  { rx: /\bcoagul/i,                             label: 'coagulation' },
  { rx: /\banticoagul/i,                         label: 'anticoagulation' },
  { rx: /\bantiplatelet/i,                       label: 'antiplatelet' },
  { rx: /\bfibrin\b|\bprothrombin\b|\bthromb(?:in|us|osis)/i, label: 'fibrin/thrombin' },
  { rx: /\bvitamin\s+K\s+epoxide\s+reductase|\bVKOR\b/i, label: 'VKOR (warfarin)' },
  { rx: /\bfactor\s+(?:II|VII|IX|X|XIII)\b/,     label: 'coagulation factor' },
  // Functional / clinical
  { rx: /\bimmun(?:e|ity|ization|osuppress|omodulat|otherap)/i, label: 'immunity' },
  { rx: /\binflammat(?:ion|ory)\b/i,             label: 'inflammation' },
  { rx: /\banti[-\s]?inflammatory\b/i,           label: 'anti-inflammatory' },
  { rx: /\b(?:antibiotic|antibacterial|antimicrobial)\b/i, label: 'antibacterial' },
  // Antibiotic drug classes (when prose names the class but not "antibiotic")
  { rx: /\b(?:penicillin|cephalosporin|carbapenem|macrolide|fluoroquinolone|tetracycline|aminoglycoside|sulfonamide|glycopeptide|lincosamide|nitroimidazole)\b/i, label: 'antibiotic class' },
  { rx: /\bβ[-\s]?lactam\b|\bbeta[-\s]?lactam\b/i, label: 'β-lactam' },
  { rx: /\bantiviral\b/i,                        label: 'antiviral' },
  // Pathogen names — drug acts AGAINST these viruses (immune-relevant)
  { rx: /\b(?:HIV|HCV|HBV|HSV|VZV|CMV|EBV|SARS[-\s]?CoV[-\s]?2|COVID[-\s]?19|influenza)\b/, label: 'viral pathogen' },
  { rx: /\bantifungal\b/i,                       label: 'antifungal' },
  // Antiparasitic / antimalarial / anti-TB drug-class descriptors
  { rx: /\bantiparasit\w*|\banthelmintic\b|\bantimalarial\b|\bantitrematodal\b|\bcesto(?:cidal|de)\b|\bantiprotozoal\b/i, label: 'antiparasitic' },
  { rx: /\bmycobacter\w*|\btuberculosis\b|\banti[-\s]?TB\b|\bTB\s+regimen\b/i, label: 'anti-TB / mycobacterial' },
  { rx: /\bantineoplastic\b|\banti[-\s]?cancer\b|\bchemotherap/i, label: 'antineoplastic' },
  { rx: /\bantimetabolite\b|\bcancer\s+(?:regimen|treatment|therapy|cell)/i, label: 'cancer therapy' },
  { rx: /\bcytotoxic\b/i,                        label: 'cytotoxic' },
  { rx: /\b(?:leukemia|lymphoma|anemia|hemophilia|sepsis)\b/i, label: 'hem/onc condition' },
  { rx: /\bautoimmune\b|\ballerg/i,              label: 'autoimmune/allergy' },
  // Iron homeostasis — affects RBCs and is mostly relevant when
  // discussed as supplementation / overload / deficiency.
  { rx: /\bferritin\b/i,                         label: 'ferritin' },
  { rx: /\biron\s+(?:overload|deficiency|absorption|homeostasis|stores|status|chelat|supplement)/i, label: 'iron handling' },
  { rx: /\boral\s+iron\b/i,                      label: 'oral iron' },
  { rx: /\bferrous\s+(?:sulfate|gluconate|fumarate|bisglycinate)/i, label: 'iron salt' },
];

const SYSTEM_PATTERNS: Record<SystemId, Pattern[]> = {
  'nervous': NERVOUS,
  'cardiovascular': CARDIOVASCULAR,
  'respiratory': RESPIRATORY,
  'endocrine': ENDOCRINE,
  'digestive': DIGESTIVE,
  'renal': RENAL,
  'reproductive': REPRODUCTIVE,
  'musculoskeletal': MUSCULOSKELETAL,
  'integumentary': INTEGUMENTARY,
  'immune-hematologic': IMMUNE_HEMATOLOGIC,
};

// Categories that imply a default system regardless of mechanism prose.
// Conservative — only categories whose definition is system-anchored.
const CATEGORY_DEFAULTS: Record<string, SystemId[]> = {
  'topical': ['integumentary'],     // 'topical' compounds act on skin by definition
};

// ─────────────────────────────────────────────────────────────────────
// Tagger
// ─────────────────────────────────────────────────────────────────────

type TagResult = {
  slug: string;
  systems: SystemId[];
  matches: Record<string, string[]>; // system → labels of patterns that fired
  alreadyTagged: boolean;
};

// Tag is suppressed when the matched keyword is *immediately* preceded
// by a definitive negation. Only definitive-negation words ("no", "not",
// "without", "lacks", "absent", "does not", "doesn't") — quantitative
// modifiers like "reduced", "low", "minimal" are NOT included because
// they often describe pharmacological actions ("reduced hepatic
// gluconeogenesis" = metformin reduces gluconeogenesis = hepatic action,
// NOT absence of hepatic action).
//
// Window is tight (≤ 15 chars before the match, ≤ 1 adjective between)
// to avoid false suppression when a negation is in a different clause.
const NEGATION_WORDS = '(?:no|not|without|lacks|lack\\s+of|absent|does\\s+not|doesn[\'’]?t)';
const NEGATION_RX = new RegExp(`\\b${NEGATION_WORDS}\\s+(?:[a-z][a-z\\-]{1,15}\\s+)?$`, 'i');

function isNegated(haystack: string, matchStart: number): boolean {
  const before = haystack.slice(Math.max(0, matchStart - 35), matchStart);
  return NEGATION_RX.test(before);
}

function tagCompound(c: Compound): TagResult {
  const haystack = [c.name, c.mechanism ?? '', (c.aliases ?? []).join(' '), c.notes ?? ''].join(' ');

  const matches: Record<string, string[]> = {};
  for (const [sys, patterns] of Object.entries(SYSTEM_PATTERNS) as [SystemId, Pattern[]][]) {
    const fired: string[] = [];
    for (const p of patterns) {
      const m = haystack.match(p.rx);
      if (!m || m.index === undefined) continue;
      if (isNegated(haystack, m.index)) continue;
      fired.push(p.label);
    }
    if (fired.length > 0) matches[sys] = fired;
  }

  // Category defaults — augment after pattern matches.
  const cat = c.category ?? '';
  if (CATEGORY_DEFAULTS[cat]) {
    for (const sys of CATEGORY_DEFAULTS[cat]) {
      if (!matches[sys]) matches[sys] = [];
      matches[sys].push(`(category=${cat})`);
    }
  }

  // Order systems by canonical SYSTEM_IDS so output is stable.
  const ORDER: SystemId[] = [
    'nervous', 'cardiovascular', 'respiratory', 'endocrine', 'digestive',
    'renal', 'reproductive', 'musculoskeletal', 'integumentary', 'immune-hematologic',
  ];
  const systems: SystemId[] = ORDER.filter(s => matches[s]);

  return {
    slug: c.slug,
    systems,
    matches,
    alreadyTagged: Array.isArray(c.systems) && c.systems.length > 0,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Apply
// ─────────────────────────────────────────────────────────────────────

function main(): void {
  const data = JSON.parse(readFileSync(COMPOUNDS_PATH, 'utf-8')) as Compound[];

  const results: TagResult[] = data.map(tagCompound);

  // Stats
  const distribution: Record<SystemId, number> = {
    'nervous': 0, 'cardiovascular': 0, 'respiratory': 0, 'endocrine': 0, 'digestive': 0,
    'renal': 0, 'reproductive': 0, 'musculoskeletal': 0, 'integumentary': 0, 'immune-hematologic': 0,
  };
  const tagCountHistogram: Record<number, number> = {};
  let untagged = 0;
  let tagged = 0;
  let preserved = 0;

  for (const r of results) {
    if (r.alreadyTagged) {
      preserved++;
      continue;
    }
    if (r.systems.length === 0) untagged++;
    else tagged++;
    tagCountHistogram[r.systems.length] = (tagCountHistogram[r.systems.length] ?? 0) + 1;
    for (const s of r.systems) distribution[s]++;
  }

  // Apply (idempotent: skip already-tagged).
  let applied = 0;
  for (let i = 0; i < data.length; i++) {
    const c = data[i]!;
    const r = results[i]!;
    if (r.alreadyTagged) continue;
    if (r.systems.length === 0) continue;
    c.systems = r.systems;
    applied++;
  }

  // Write back, preserving JSON shape (2-space indent, trailing newline).
  writeFileSync(COMPOUNDS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  // Report
  const banner = (s: string) => console.log('\n── ' + s + ' ' + '─'.repeat(Math.max(0, 60 - s.length)));

  banner('System distribution');
  for (const [s, n] of Object.entries(distribution)) {
    console.log(`  ${s.padEnd(20)} ${String(n).padStart(4)}`);
  }

  banner('Tag-count histogram');
  for (const [k, v] of Object.entries(tagCountHistogram).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`  ${k} system${k === '1' ? '' : 's'}: ${v}`);
  }

  banner('Summary');
  console.log(`  total compounds       ${data.length}`);
  console.log(`  already tagged        ${preserved}`);
  console.log(`  newly tagged          ${tagged}`);
  console.log(`  remained untagged     ${untagged}`);
  console.log(`  applied to JSON       ${applied}`);

  banner('Untagged compounds (need manual authoring)');
  const stillUntagged = results.filter(r => !r.alreadyTagged && r.systems.length === 0);
  for (const r of stillUntagged.slice(0, 50)) {
    console.log(`  ${r.slug}`);
  }
  if (stillUntagged.length > 50) console.log(`  ... and ${stillUntagged.length - 50} more`);

  console.log(`\nWrote ${COMPOUNDS_PATH}`);
}

main();
