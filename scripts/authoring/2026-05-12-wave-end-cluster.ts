/**
 * 2026-05-12-wave-end-cluster.ts — Endocrine + Peptide cluster (END-1..6).
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
    slug: 'glucocorticoid_receptor_signaling',
    name: 'Glucocorticoid receptor (GR) signaling',
    category: 'signaling',
    systems: ['endocrine', 'immune-hematologic'],
    description: `GR is a ligand-activated nuclear transcription factor (NR3C1). Cortisol (endogenous) + synthetic glucocorticoids bind cytoplasmic GR → conformational change releases HSP90 chaperones → nuclear translocation → dimer binding to glucocorticoid response elements (GREs) on DNA. Two transcriptional modes: transactivation (canonical positive regulation — metabolic + anti-inflammatory cytokine reduction) and transrepression (NF-κB + AP-1 tethering — anti-inflammatory without metabolic side effects, the goal of "dissociated GR ligands"). Therapeutic glucocorticoids: hydrocortisone (cortisol replacement), methylprednisolone (IV anti-inflammatory bolus, MS exacerbation), prednisolone (active metabolite of prednisone), dexamethasone (long-acting, no mineralocorticoid activity, intracranial edema + COVID-19 ARDS), inhaled (fluticasone, budesonide, beclomethasone, ciclesonide — high topical:systemic ratio for asthma/COPD), topical (clobetasol, betamethasone — covered in DERM cluster). Fludrocortisone is mineralocorticoid-dominant.`,
    steps: [
      { from: 'cortisol-or-synthetic-glucocorticoid', to: 'gr-activation-translocation', via: 'HSP90 release + nuclear import → GRE binding' },
      { from: 'gr-activation-translocation', to: 'antiinflammatory-gene-transcription', via: 'transrepression of NF-κB + AP-1 + transactivation of MKP-1, GILZ' },
    ],
    modulators: [
      { slug: 'methylprednisolone', effect: 'activator', target: 'GR (intermediate-acting)', note: 'IV bolus for MS exacerbation + asthma exacerbation + transplant rejection; mild mineralocorticoid activity' },
      { slug: 'prednisolone', effect: 'activator', target: 'GR (intermediate-acting)', note: 'active metabolite of prednisone; chronic immunosuppression workhorse; bone density loss + cataract + glucose dysregulation tail' },
      { slug: 'fludrocortisone', effect: 'activator', target: 'mineralocorticoid receptor (dominant)', note: 'classic mineralocorticoid; primary adrenal insufficiency + orthostatic hypotension off-label' },
      { slug: 'budesonide', effect: 'activator', target: 'GR (inhaled + oral controlled-release)', note: 'inhaled asthma + COPD (Pulmicort); PO controlled-release for ileal Crohn (high hepatic first-pass minimizes systemic exposure)' },
      { slug: 'fluticasone', effect: 'activator', target: 'GR (inhaled/intranasal)', note: 'inhaled steroid (Flovent) + nasal (Flonase); high topical:systemic ratio; CYP3A4 substrate (ritonavir DDI → Cushing\'s)' },
      { slug: 'beclomethasone', effect: 'activator', target: 'GR (inhaled)', note: 'first inhaled steroid (QVAR); active metabolite beclomethasone-17-monopropionate' },
      { slug: 'ciclesonide', effect: 'activator', target: 'GR (inhaled prodrug → des-ciclesonide)', note: 'inhaled steroid prodrug activated by lung esterases; minimal systemic exposure → low HPA suppression' },
      { slug: 'fluticasone-furoate', effect: 'activator', target: 'GR (inhaled, once-daily)', note: 'long-acting inhaled steroid; component of Trelegy (ICS/LAMA/LABA triple)' },
      { slug: 'triamcinolone', effect: 'activator', target: 'GR (intermediate-acting)', note: 'IM/intra-articular depot + intranasal + topical; long local duration' },
      { slug: 'betamethasone', effect: 'activator', target: 'GR (long-acting)', note: 'antenatal lung-maturation (preterm labor); topical + injectable forms' },
      { slug: 'mometasone', effect: 'activator', target: 'GR (inhaled/topical)', note: 'inhaled asthma + topical dermatology; minimal systemic absorption' },
    ],
    refs: [],
  },
  {
    slug: 'growth_hormone_ghs_axis',
    name: 'Growth hormone / GHRH / GHS axis',
    category: 'endocrine_axis',
    systems: ['endocrine', 'musculoskeletal'],
    description: `Hypothalamic GHRH stimulates pituitary GH release; somatostatin (SST) inhibits. GH acts on hepatocyte GHR → JAK2 → STAT5 → IGF-1 production (the main mediator of GH growth effects). Synthetic GHRH analogs (sermorelin, mod-grf-1-29, cjc-1295 — DAC-extended) pulse-stimulate endogenous GH. GHS-R agonists (ghrelin pathway — ghrp-2, ghrp-6, ipamorelin, hexarelin) are an orthogonal route to GH release via the stomach ghrelin receptor. Tesamorelin is a GHRH analog approved for HIV-associated lipodystrophy. mk-677 (ibutamoren) is an oral non-peptide GHS-R agonist. Direct GH replacement: somatropin (recombinant human GH) for GH deficiency. IGF-1 analogs: igf-1-lr3 (research only) + mecasermin (Increlex). ACE-031 inhibits myostatin (negative muscle-growth regulator). AOD-9604 is a GH fragment with claimed lipolytic activity (research-only). Acromegaly Rx: octreotide/lanreotide (SST analogs — see somatostatin pathway in END-6).`,
    steps: [
      { from: 'ghrh', to: 'pituitary-gh-release', via: 'GHRH-R on somatotrophs → Gs → cAMP → GH secretion' },
      { from: 'ghrh', to: 'pituitary-gh-release', via_slug: undefined, note: 'somatostatin opposes via SST2-R/Gi' },
      { from: 'pituitary-gh-release', to: 'hepatic-igf-1', via: 'GHR → JAK2 → STAT5 → IGF-1 transcription' },
    ],
    modulators: [
      { slug: 'cjc-1295', effect: 'activator', target: 'GHRH-R (DAC-extended GHRH analog)', note: 'GHRH analog with drug affinity complex extending t½ to ~8 days; research peptide (no FDA approval); pulse-amplification of endogenous GH' },
      { slug: 'sermorelin', effect: 'activator', target: 'GHRH-R', note: 'GHRH(1-29) — minimum bioactive fragment; pediatric GH-deficiency diagnostic + adult research; short half-life' },
      { slug: 'mod-grf-1-29', effect: 'activator', target: 'GHRH-R (tetrasubstituted GRF analog)', note: 'modified GRF(1-29) with 4 amino-acid substitutions for enzymatic stability; research peptide' },
      { slug: 'ghrp-2', effect: 'activator', target: 'GHS-R1a (ghrelin receptor agonist)', note: 'growth-hormone-releasing peptide; orthogonal to GHRH pathway; research peptide' },
      { slug: 'ghrp-6', effect: 'activator', target: 'GHS-R1a', note: 'GHRP-6; food-craving side effect from on-target ghrelin-receptor activation' },
      { slug: 'ipamorelin', effect: 'activator', target: 'GHS-R1a (selective)', note: 'cleaner GHS-R agonist (no significant prolactin/cortisol/glucose effects); research peptide' },
      { slug: 'hexarelin', effect: 'activator', target: 'GHS-R1a', note: 'older GHRP; cardiac receptor activity beyond GH release; research peptide' },
      { slug: 'tesamorelin', effect: 'activator', target: 'GHRH-R', note: 'FDA-approved (Egrifta) for HIV-associated lipodystrophy; SC qd' },
      { slug: 'mk-677', effect: 'activator', target: 'GHS-R1a (oral non-peptide)', note: 'ibutamoren; oral nightly; sleep architecture changes + appetite increase; research-stage for sarcopenia' },
      { slug: 'somatropin', effect: 'activator', target: 'GH receptor (recombinant hGH)', note: 'GH-deficiency replacement; pediatric + adult; bypasses hypothalamic-pituitary regulation entirely' },
      { slug: 'igf-1-lr3', effect: 'activator', target: 'IGF-1R (research peptide, extended t½)', note: 'long-arg-3 IGF-1 modification reduces IGFBP binding → extended free t½; research only' },
      { slug: 'des-igf-1', effect: 'activator', target: 'IGF-1R (truncated)', note: 'des(1-3) IGF-1 — reduced IGFBP affinity, similar logic to LR3; research only' },
      { slug: 'mechano-growth-factor', effect: 'activator', target: 'IGF-1Ec splice variant receptor', note: 'IGF-1 Ec/Eb splice variant; muscle-injury upregulated; tissue repair claims' },
      { slug: 'ace-031', effect: 'inhibitor', target: 'myostatin / activin (soluble ActRIIB)', note: 'soluble activin-receptor decoy; muscle-growth claims; suspended phase II for vascular adverse events (DMD trial)' },
      { slug: 'aod-9604', effect: 'activator', target: 'lipolytic GH C-terminus fragment (research)', note: 'GH(176-191); claimed lipolytic effects without growth-promoting activity; research-only — minimal clinical evidence' },
    ],
    refs: [],
  },
  {
    slug: 'gnrh_pulse_generator_axis',
    name: 'GnRH pulse generator + kisspeptin / gonadotrope axis',
    category: 'endocrine_axis',
    systems: ['endocrine', 'reproductive'],
    description: `Hypothalamic GnRH neurons fire pulsatile bursts (90-min interpulse interval in adult ♀ follicular phase, faster luteal) under upstream control of kisspeptin/KNDy neurons (arcuate nucleus). GnRH → anterior pituitary gonadotropes → LH + FSH → gonadal sex-steroid synthesis. Pulsatile GnRH stimulates; continuous GnRH desensitizes (paradoxical castration). Therapeutic exploitation: pulsatile GnRH (gonadorelin) for hypothalamic infertility; continuous GnRH agonists (leuprolide, triptorelin, goserelin) → initial flare → desensitization → chemical castration for prostate cancer + central precocious puberty + endometriosis; GnRH antagonists (cetrorelix, ganirelix, degarelix) suppress without flare. Kisspeptin (KISS1 + kisspeptin-10 = KP-10 minimum agonist fragment) directly activates KISS1R on GnRH neurons — research-stage as a GnRH-pulse stimulator.`,
    steps: [
      { from: 'kisspeptin', to: 'gnrh-release', via: 'KISS1R on GnRH neurons → Gq → IP3 → GnRH exocytosis' },
      { from: 'gnrh-release', to: 'lh-fsh-release', via: 'GnRH-R on gonadotropes → Gq → LH/FSH secretion' },
    ],
    modulators: [
      { slug: 'gonadorelin', effect: 'activator', target: 'GnRH-R (pulsatile dosing)', note: 'pulsatile pump → physiologic gonadotropin release for hypothalamic infertility; opposite effect of continuous depot' },
      { slug: 'leuprolide', effect: 'inhibitor', target: 'GnRH-R (continuous agonist → desensitization)', note: 'depot agonist; initial flare then sustained suppression; prostate cancer + endometriosis + precocious puberty' },
      { slug: 'triptorelin', effect: 'inhibitor', target: 'GnRH-R (continuous agonist)', note: 'depot GnRH agonist; long-acting trimonthly + 6-monthly formulations' },
      { slug: 'cetrorelix', effect: 'inhibitor', target: 'GnRH-R (competitive antagonist)', note: 'GnRH antagonist; IVF cycle suppression without initial flare; faster offset than agonists' },
      { slug: 'ganirelix', effect: 'inhibitor', target: 'GnRH-R', note: 'GnRH antagonist; IVF cycle suppression' },
      { slug: 'degarelix', effect: 'inhibitor', target: 'GnRH-R', note: 'GnRH antagonist; prostate cancer — no testosterone flare unlike leuprolide initial period' },
      { slug: 'kisspeptin', effect: 'activator', target: 'KISS1R', note: 'upstream of GnRH; research stage for GnRH-deficiency disorders' },
      { slug: 'kisspeptin-10', effect: 'activator', target: 'KISS1R (KP-10 minimum agonist)', note: 'shortened bioactive fragment; research only' },
    ],
    refs: [],
  },
  {
    slug: 'melanocortin_mc4r_axis',
    name: 'Melanocortin receptor axis (MC1R / MC4R / MSH analogs)',
    category: 'signaling',
    systems: ['endocrine', 'integumentary', 'nervous'],
    description: `Melanocortin receptors (MC1-5R) — Gs-coupled GPCRs activated by POMC-derived peptides (α-MSH, β-MSH, γ-MSH, ACTH). MC1R on melanocytes mediates eumelanin synthesis (skin pigmentation); MC2R is the ACTH receptor on adrenal cortex; MC3R + MC4R in hypothalamus regulate appetite + energy balance; MC5R has thermoregulation + exocrine roles. Therapeutic / research peptides: setmelanotide (Imcivree) — MC4R-selective agonist for monogenic obesity (POMC, PCSK1, LEPR deficiency, BBS); pt-141 (bremelanotide) — MC1R/MC3R/MC4R nonselective agonist for hypoactive sexual desire disorder (premenopausal women); melanotan-ii — MC1R-biased nonselective agonist marketed as tanning peptide (unregulated; melanoma risk + nausea + spontaneous erections). α-MSH is the canonical endogenous ligand.`,
    steps: [
      { from: 'pomc', to: 'alpha-msh', via: 'PC1/3 + PC2 prohormone convertase cleavage in hypothalamic arcuate nucleus + skin' },
      { from: 'alpha-msh', to: 'mc1r-melanogenesis', via: 'MC1R on melanocytes → cAMP → MITF → tyrosinase → eumelanin' },
      { from: 'alpha-msh', to: 'mc4r-appetite-suppression', via: 'MC4R on PVN neurons → reduced food intake' },
    ],
    modulators: [
      { slug: 'setmelanotide', effect: 'activator', target: 'MC4R (selective)', note: 'Imcivree; monogenic obesity (POMC/PCSK1/LEPR deficiency, BBS); SC qd' },
      { slug: 'pt-141', effect: 'activator', target: 'MC1R + MC3R + MC4R (nonselective)', note: 'bremelanotide (Vyleesi); HSDD in premenopausal women; on-demand SC; nausea + flushing common' },
      { slug: 'melanotan-ii', effect: 'activator', target: 'MC1R + MC3R + MC4R (nonselective)', note: 'unregulated tanning peptide; melanoma risk + appetite suppression + spontaneous erections; not FDA-approved' },
    ],
    refs: [],
  },
  {
    slug: 'posterior_pituitary_oxt_vp',
    name: 'Posterior pituitary (oxytocin / vasopressin)',
    category: 'endocrine_axis',
    systems: ['endocrine', 'renal', 'reproductive'],
    description: `Magnocellular neurons in supraoptic + paraventricular nuclei synthesize oxytocin + arginine vasopressin (AVP, ADH), package them in vesicles, and release into the systemic circulation at the posterior pituitary. AVP: V1A (vasoconstriction), V1B (ACTH release), V2 (renal collecting duct aquaporin-2 insertion → water reabsorption). Oxytocin: uterine contraction at parturition + breast myoepithelial milk ejection + social-bonding CNS effects. Therapeutic: oxytocin (IV for labor induction + postpartum hemorrhage); desmopressin (DDAVP — V2-selective for central DI + bedwetting + von Willebrand disease); vasopressin (IV pressor in vasodilatory shock + cardiac arrest historical).`,
    steps: [
      { from: 'osmotic-or-hypovolemic-stimulus', to: 'avp-release', via: 'osmoreceptor + baroreceptor input → magnocellular firing → posterior-pituitary release' },
      { from: 'avp-release', to: 'renal-water-reabsorption', via: 'V2R → Gs → AQP2 trafficking to apical membrane → water reabsorption' },
    ],
    modulators: [
      { slug: 'oxytocin', effect: 'activator', target: 'OXT-R (uterine + mammary)', note: 'IV labor induction + augmentation + postpartum hemorrhage; intranasal off-label for social bonding research' },
      { slug: 'vasopressin', effect: 'activator', target: 'V1A + V2 (full agonist)', note: 'IV pressor in vasodilatory septic shock; cardiac arrest historical use (ACLS dropped 2010)' },
      { slug: 'desmopressin', effect: 'activator', target: 'V2 (selective synthetic AVP analog)', note: 'central DI + nocturnal enuresis + von Willebrand disease type 1 (releases stored vWF/factor VIII); SC/IV/intranasal' },
    ],
    refs: [],
  },
  {
    slug: 'gi_endocrine_peptides_misc',
    name: 'GI endocrine peptides (somatostatin / VIP / CCK / secretin / glucagon / amylin)',
    category: 'endocrine_axis',
    systems: ['digestive', 'endocrine'],
    description: `Gut + pancreatic + hypothalamic peptide hormones with diverse signaling. Somatostatin (SST) inhibits growth-hormone release + multiple GI secretions; therapeutic analogs (octreotide, lanreotide) for acromegaly + neuroendocrine tumors (carcinoid, VIPoma, glucagonoma) + variceal bleeding. VIP (vasoactive intestinal peptide) → vasodilation + intestinal secretion + bronchodilation. CCK → gallbladder contraction + pancreatic secretion + satiety. Secretin → pancreatic bicarbonate release. Glucagon (α-cell) opposes insulin → hepatic gluconeogenesis + glycogenolysis; clinical glucagon kit for severe hypoglycemia + β-blocker poisoning. Pramlintide is an amylin (IAPP) analog co-secreted with insulin; SC pre-meal injection for type 1 + insulin-treated type 2 diabetes (slows gastric emptying + suppresses glucagon). Retatrutide is a triple GLP-1/GIP/glucagon agonist in late-stage weight-loss trials.`,
    steps: [
      { from: 'gi-meal-signals', to: 'gi-peptide-release', via: 'enteroendocrine cells (K, L, I, S, EC) secrete CCK/GIP/GLP-1/secretin/somatostatin in response to nutrient sensing' },
    ],
    modulators: [
      { slug: 'octreotide', effect: 'activator', target: 'SST2 + SST5', note: 'somatostatin analog; acromegaly + carcinoid syndrome + VIPoma + variceal bleeding; SC tid → LAR monthly depot' },
      { slug: 'lanreotide', effect: 'activator', target: 'SST2 + SST5', note: 'somatostatin analog; deep SC q4 weeks (Somatuline Depot); acromegaly + NETs' },
      { slug: 'somatostatin', effect: 'inhibitor', target: 'SST1-5 (endogenous)', note: 'native 14-mer + 28-mer; IV infusion for variceal bleed (rare clinical use vs octreotide due to short t½)' },
      { slug: 'secretin', effect: 'activator', target: 'secretin receptor (SCTR)', note: 'IV diagnostic for ZE syndrome (paradoxical gastrin rise) + pancreatic function testing; minimal Rx use' },
      { slug: 'cholecystokinin', effect: 'activator', target: 'CCK-A + CCK-B', note: 'gallbladder contraction + pancreatic secretion + central satiety; IV diagnostic only' },
      { slug: 'vip', effect: 'activator', target: 'VPAC1 + VPAC2', note: 'VIP; vasodilator + bronchodilator + intestinal secretagogue; minimal Rx — investigational for PAH' },
      { slug: 'glucagon', effect: 'activator', target: 'glucagon receptor (GCGR)', note: 'severe hypoglycemia rescue (IM kit + nasal Baqsimi) + β-blocker poisoning; GI imaging adjunct' },
      { slug: 'pramlintide', effect: 'activator', target: 'amylin receptor (AMY1-3)', note: 'amylin analog; pre-meal SC adjunct to insulin in T1D/T2D; slows gastric emptying + glucagon suppression' },
      { slug: 'retatrutide', effect: 'activator', target: 'GLP-1R + GIP-R + glucagon-R (triple agonist)', note: 'phase 3 obesity (TRIUMPH); weight loss exceeding tirzepatide in head-to-head trials' },
      { slug: 'pancreatic-polypeptide', effect: 'inhibitor', target: 'NPY4R (Y4)', note: 'PP family hormone; satiety + gallbladder relaxation; research-stage for obesity' },
    ],
    refs: [],
  },
];

// Modulator extensions to hpg_axis (END-1)
const HPG_EXT = [
  { slug: 'testosterone-cypionate', effect: 'substrate' as const, target: 'AR (T cypionate IM depot ester)', note: 'TRT workhorse; weekly IM; cypionate ester slows release (t½ ~8d as authored 2-comp PK Wave 4b)' },
  { slug: 'testosterone-enanthate', effect: 'substrate' as const, target: 'AR (T enanthate IM depot ester)', note: 'IM TRT; very similar PK to cypionate; international markets differ in which is standard' },
  { slug: 'testosterone-undecanoate', effect: 'substrate' as const, target: 'AR (T undecanoate IM ultra-depot)', note: 'IM 10-12 weekly (Aveed); much longer-acting than cypionate/enanthate' },
  { slug: 'nandrolone-decanoate', effect: 'activator' as const, target: 'AR (DHT-resistant — milder androgenic profile)', note: '19-nor T derivative; resists 5α-reductase → preserves muscle anabolism with reduced prostate/scalp DHT load' },
  { slug: 'oxandrolone', effect: 'activator' as const, target: 'AR (oral C17α-alkylated)', note: 'mild oral anabolic; HIV wasting + burn recovery + alcoholic hepatitis; hepatic strain' },
  { slug: 'stanozolol', effect: 'activator' as const, target: 'AR (oral C17α-alkylated)', note: 'Winstrol; hereditary angioedema (older Rx); oral hepatotoxic' },
  { slug: 'methyltestosterone', effect: 'activator' as const, target: 'AR (oral)', note: 'oldest oral T; hepatotoxicity essentially eliminated it from contemporary TRT — relegated to historical' },
  { slug: 'fluoxymesterone', effect: 'activator' as const, target: 'AR (oral fluorinated)', note: 'Halotestin; powerful oral anabolic-androgen; severe hepatotoxicity' },
  { slug: 'danazol', effect: 'activator' as const, target: 'AR + PR partial (anti-gonadotropin)', note: 'endometriosis + hereditary angioedema + ITP; androgenic side effects limit use' },
  { slug: 'finasteride', effect: 'inhibitor' as const, target: '5α-reductase type 2', note: 'BPH (5 mg) + male-pattern hair loss (1 mg); post-finasteride syndrome controversy' },
  { slug: 'dutasteride', effect: 'inhibitor' as const, target: '5α-reductase type 1 + 2 (dual)', note: 'BPH; broader 5α-R inhibition than finasteride; CYP3A4 substrate' },
  { slug: 'ethinyl-estradiol', effect: 'activator' as const, target: 'ER (synthetic estrogen)', note: '17α-ethinyl group resists hepatic clearance → oral activity; combined OC backbone' },
  { slug: '17a-estradiol', effect: 'activator' as const, target: 'ER (17α stereoisomer, weak)', note: 'much weaker than 17β-estradiol; research interest in age-related effects' },
  { slug: 'levonorgestrel', effect: 'activator' as const, target: 'PR (progestin) + weak AR', note: 'second-gen progestin; IUD + emergency contraception (Plan B 1.5 mg) + combined OC' },
  { slug: 'norethindrone', effect: 'activator' as const, target: 'PR (progestin)', note: '19-nor progestin; component of POPs + combined OC; mild androgenic activity' },
  { slug: 'drospirenone', effect: 'activator' as const, target: 'PR + antimineralocorticoid + antiandrogen', note: 'fourth-gen progestin; Yaz/Yasmin; hyperkalemia risk + VTE rate above older progestins' },
  { slug: 'oral-contraceptive-combo', effect: 'inhibitor' as const, target: 'hypothalamic-pituitary GnRH/LH-FSH (estrogen + progestin combination)', note: 'mixture; estrogen + progestin suppresses GnRH pulse + ovulation' },
  { slug: 'progestin-only-pill', effect: 'inhibitor' as const, target: 'cervical mucus + endometrial atrophy + intermittent ovulation suppression', note: 'progestin-only contraception; less reliable ovulation suppression vs combined OCs' },
  { slug: 'dhea', effect: 'substrate' as const, target: 'adrenal androgen precursor (→ androstenedione → T/E2)', note: 'OTC supplement; conversion downstream to T + E2 is variable + individual; uncontrolled hormone-modulation potential' },
  { slug: 'dhea-sulfate', effect: 'substrate' as const, target: 'circulating depot of DHEA (sulfated for stability)', note: 'DHEA-S is the predominant circulating form; reservoir for tissue-specific desulfation' },
];

// HPT extension
const HPT_EXT = [
  { slug: 'liothyronine', effect: 'activator' as const, target: 'thyroid hormone receptor TRα/β (T3 active form)', note: 'Cytomel; rapid-onset thyroid replacement; short t½ requires bid-tid dosing; T3 + T4 combo controversial' },
  { slug: 'propylthiouracil', effect: 'inhibitor' as const, target: 'TPO (thyroid peroxidase) + peripheral T4→T3 deiodination', note: 'PTU; hyperthyroidism (Graves\') second-line; hepatotoxicity boxed warning; preferred in 1st-trimester pregnancy' },
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
    console.log(`  [add ] ${p.slug.padEnd(40)} ${p.category} mods=${p.modulators?.length ?? 0}`);
  }
  const hpg = bySlug.get('hpg_axis');
  if (hpg) console.log(`  [ext ] hpg_axis                                +${addModulators(hpg, HPG_EXT)} (now ${hpg.modulators!.length})`);
  const hpt = bySlug.get('hpt_axis');
  if (hpt) console.log(`  [ext ] hpt_axis                                +${addModulators(hpt, HPT_EXT)} (now ${hpt.modulators!.length})`);
  writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\nEND cluster: +${added} pathways. Total: ${data.length}.`);
}

main();
