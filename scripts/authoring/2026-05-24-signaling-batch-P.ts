/**
 * 2026-05-24-signaling-batch-P.ts
 *
 * step.note grind, batch P — 21 gap-2 pathways (axes, anti-infectives,
 * receptors), notes-only. All 33 existing refs title-checked via esummary
 * 2026-05-24 and topically ground these notes (see slugs below).
 * Exact from→to keys (mismatch throws); idempotent; fills empty duplicate
 * edges only (growth_hormone has a pre-annotated duplicate ghrh edge).
 *   tsx scripts/authoring/2026-05-24-signaling-batch-P.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const BATCH: Array<{ slug: string; notes: Record<string, string> }> = [
  { slug: 'acetylcholine_axis', notes: {
    'choline acetylcholine':
      'Acetylcholine is synthesized from choline and acetyl-CoA by choline acetyltransferase (ChAT), the marker ' +
      'enzyme of cholinergic neurons. High-affinity choline uptake (CHT) is rate-limiting, so choline ' +
      'availability can influence cholinergic transmission.',
    'acetylcholine choline-acetate':
      'Acetylcholine is hydrolyzed in the synaptic cleft by acetylcholinesterase (AChE) into choline and acetate ' +
      'within milliseconds, terminating the signal. AChE inhibitors (donepezil, neostigmine, organophosphates) ' +
      'prolong ACh action — the basis of Alzheimer’s and myasthenia therapy, and of nerve-agent toxicity.' } },
  { slug: 'adaptogen_hpa_stress_modulation', notes: {
    'chronic-psychophysical-stress hpa-axis-dysregulation':
      'Chronic physical or psychological stress dysregulates the HPA axis — flattening cortisol rhythms and ' +
      'impairing feedback — a state linked to fatigue and metabolic/mood disturbance. This maladaptive stress ' +
      'response is the target adaptogens are proposed to normalize.',
    'adaptogen-extract normalized-hpa-output':
      'Adaptogens (Rhodiola, ashwagandha, Eleutherococcus) are proposed stress-response modulators that nudge a ' +
      'dysregulated HPA axis back toward balance (a hormesis/“eustress” concept) rather than simply stimulating ' +
      'or sedating. Clinical evidence is mixed and mechanisms remain incompletely defined.' } },
  { slug: 'aqueous_humor_iop_regulation', notes: {
    'ciliary-body aqueous-humor-production':
      'The ciliary body secretes aqueous humor (largely by carbonic anhydrase-dependent active transport), ' +
      'nourishing the avascular cornea and lens and setting intraocular pressure. Reducing production lowers IOP — ' +
      'the mechanism of carbonic-anhydrase inhibitors and β-blockers in glaucoma.',
    'aqueous-humor trabecular-meshwork-outflow':
      'Aqueous humor drains mainly through the trabecular meshwork into Schlemm’s canal; resistance here sets IOP ' +
      'and is dysfunctional in primary open-angle glaucoma. Increasing outflow (prostaglandin analogs, ' +
      'Rho-kinase inhibitors, pilocarpine) is the dominant modern strategy to lower pressure.' } },
  { slug: 'aromatase_androgen_receptor_axis', notes: {
    'androgens estrogens':
      'Aromatase (CYP19A1) converts androgens (testosterone, androstenedione) into estrogens — the sole estrogen ' +
      'source in men and postmenopausal women. Aromatase inhibitors (anastrozole, letrozole) block this to treat ' +
      'ER-positive breast cancer, and the conversion also underlies gynecomastia.',
    'androgens androgen-receptor-activation':
      'Androgens also act directly via the androgen receptor, a nuclear receptor driving male sexual development ' +
      'and prostate growth. This is the target of AR antagonists (enzalutamide) and synthesis blockers ' +
      '(abiraterone) in prostate cancer — the AR axis being its central driver.' } },
  { slug: 'bacterial_dna_folate_disruption', notes: {
    'bacterial-dna-supercoiling bacterial-dna-replication':
      'Bacterial DNA gyrase and topoisomerase IV manage the supercoiling required for replication — enzymes ' +
      'humans lack in this form, giving selectivity. Fluoroquinolones (ciprofloxacin) trap these enzymes on DNA, ' +
      'causing lethal double-strand breaks: a key antibacterial target.',
    'paba tetrahydrofolate':
      'Bacteria must synthesize folate de novo from PABA (they cannot import it as humans do), via dihydropteroate ' +
      'synthase and dihydrofolate reductase. Sulfonamides (PABA mimics) and trimethoprim block consecutive steps; ' +
      'their synergy (co-trimoxazole) exploits a pathway humans lack — the basis of selective toxicity.' } },
  { slug: 'calcium_channel_modulation', notes: {
    'depolarization l-type-calcium-influx':
      'Membrane depolarization opens voltage-gated L-type calcium channels (Cav1.x), the dominant Ca²⁺ entry route ' +
      'in cardiac and vascular smooth muscle. These channels are the target of the dihydropyridine and ' +
      'non-dihydropyridine calcium-channel blockers used for hypertension and angina.',
    'l-type-calcium-influx cytosolic-calcium-rise':
      'Calcium entering through L-type channels raises cytosolic Ca²⁺, triggering contraction (and, in the heart, ' +
      'calcium-induced calcium release from the SR). Blocking this influx relaxes vascular smooth muscle and ' +
      'reduces cardiac contractility/rate — the therapeutic effect of CCBs.' } },
  { slug: 'cgrp_migraine_axis', notes: {
    'trigeminal-sensory-afferent cgrp-release':
      'Activation of trigeminal sensory afferents innervating the meninges releases calcitonin gene-related ' +
      'peptide (CGRP), a potent neuropeptide central to migraine. Elevated CGRP during attacks made it the ' +
      'defining target of modern migraine therapeutics.',
    'cgrp-release meningeal-vasodilation':
      'Released CGRP causes meningeal vasodilation and neurogenic inflammation and sensitizes pain pathways, ' +
      'generating the headache. Blocking it — anti-CGRP/receptor antibodies (erenumab) or small-molecule ' +
      '“gepants” — both prevents and treats migraine, validating the axis.' } },
  { slug: 'dna_damage_cytotoxic_response', notes: {
    'cellular-dna dna-damage':
      'Cellular DNA is continuously damaged by endogenous (ROS, replication errors) and exogenous (radiation, ' +
      'chemotherapy) insults. Many cytotoxic cancer therapies work precisely by inflicting unrepairable DNA ' +
      'damage — exploiting tumor cells’ high proliferation and often-defective repair.',
    'dna-damage apoptosis-mitotic-catastrophe':
      'When damage exceeds repair capacity, the DNA-damage response (ATM/ATR-p53) triggers death by apoptosis or ' +
      'mitotic catastrophe. This is the intended endpoint of genotoxic chemo/radiotherapy — and defective ' +
      'checkpoints (e.g. p53 loss) underlie both resistance and the therapeutic window.' } },
  { slug: 'epidermal_keratinization_melanogenesis', notes: {
    'keratinocyte-basal corneocyte-shedding':
      'Keratinocytes are born in the basal layer and migrate upward, progressively keratinizing into flattened, ' +
      'dead corneocytes that are shed (desquamation) over ~28 days. Disorders of this program cause psoriasis ' +
      '(too fast) and ichthyosis; retinoids and keratolytics modulate it.',
    'tyrosine eumelanin':
      'Melanocytes synthesize melanin from tyrosine via tyrosinase (the rate-limiting enzyme), packaging ' +
      'brown/black eumelanin in melanosomes transferred to keratinocytes for UV protection. Tyrosinase is the ' +
      'target of skin-lightening agents (hydroquinone) and the deficient enzyme in albinism.' } },
  { slug: 'fungal_ergosterol_biosynthesis', notes: {
    'lanosterol ergosterol':
      'Fungi convert lanosterol to ergosterol — their characteristic membrane sterol (the fungal analog of ' +
      'cholesterol) — via steps including CYP51 (14α-demethylase). Azole antifungals inhibit CYP51, and this ' +
      'fungal-specific sterol is what gives antifungals selectivity over human cells.',
    'squalene lanosterol':
      'Earlier in the pathway, squalene is epoxidized (squalene epoxidase) and cyclized to lanosterol. ' +
      'Allylamines (terbinafine) inhibit squalene epoxidase, both depleting ergosterol and accumulating toxic ' +
      'squalene — a fungicidal action used for dermatophyte infections.' } },
  { slug: 'gnrh_pulse_generator_axis', notes: {
    'kisspeptin gnrh-release':
      'Kisspeptin neurons (hypothalamic arcuate nucleus) are the master pulse generator driving episodic GnRH ' +
      'release — the true upstream switch of reproduction. Kisspeptin signaling triggers puberty, and its loss ' +
      'causes hypogonadotropic hypogonadism.',
    'gnrh-release lh-fsh-release':
      'Pulsatile GnRH drives pituitary LH and FSH secretion, with pulse frequency setting the LH:FSH ratio. The ' +
      'pulsatility is essential — continuous GnRH desensitizes the pituitary and shuts the axis down, how ' +
      'GnRH-agonist depots achieve medical castration in prostate cancer and endometriosis.' } },
  { slug: 'growth_hormone_ghs_axis', notes: {
    'ghrh pituitary-gh-release':
      'Hypothalamic GHRH stimulates pituitary somatotrophs to release growth hormone, while somatostatin inhibits ' +
      'it; the stomach peptide ghrelin (via the GHS receptor) also potently stimulates GH and appetite. This dual ' +
      'GHRH/ghrelin drive made the GHS receptor a target for GH secretagogues.',
    'pituitary-gh-release hepatic-igf-1':
      'Much of GH’s anabolic, growth-promoting action is mediated by hepatic insulin-like growth factor 1 ' +
      '(IGF-1), which it induces. IGF-1 feeds back to suppress GH — and the GH/IGF-1 axis is measured to diagnose ' +
      'acromegaly and GH deficiency, and is targeted by pegvisomant (a GH-receptor antagonist).' } },
  { slug: 'hcv_ns_replication', notes: {
    'hcv-polyprotein hcv-nonstructural-proteins':
      'HCV translates its genome as a single polyprotein, cleaved (by host signal peptidases and the viral NS3/4A ' +
      'protease) into structural and nonstructural (NS) proteins. The NS proteins build the replication ' +
      'machinery — and NS3/4A protease is the target of the “-previr” direct-acting antivirals.',
    'hcv-rna hcv-rna-replication':
      'The NS5B RNA-dependent RNA polymerase (with the NS5A assembly factor) replicates the viral RNA genome. ' +
      'NS5B inhibitors (“-buvir”, e.g. sofosbuvir) and NS5A inhibitors (“-asvir”) target these — combinations now ' +
      'cure >95% of HCV, a landmark of antiviral therapy.' } },
  { slug: 'immune_checkpoint_blockade', notes: {
    'pd-1-pd-l1-binding t-cell-exhaustion':
      'Tumor or tissue PD-L1 engaging PD-1 on T cells delivers an inhibitory signal that drives T-cell exhaustion ' +
      '— a brake tumors exploit to evade immunity. Blocking it (anti-PD-1 nivolumab/pembrolizumab; anti-PD-L1 ' +
      'atezolizumab) reinvigorates exhausted T cells, a transformative cancer immunotherapy.',
    'ctla-4-b7-binding t-cell-priming-suppression':
      'CTLA-4 outcompetes the costimulatory receptor CD28 for B7 ligands on antigen-presenting cells, suppressing ' +
      'T-cell priming early in the lymph node. Blocking it (ipilimumab) lowers the activation threshold — the ' +
      'first checkpoint inhibitor proven to extend survival in melanoma.' } },
  { slug: 'mast_cell_leukotriene_axis', notes: {
    'mast-cell-igE-crosslinking mediator-release':
      'Allergen cross-linking of IgE bound to mast-cell FcεRI triggers degranulation, releasing preformed ' +
      'histamine and proteases plus newly synthesized lipid mediators. This is the central effector event of ' +
      'immediate hypersensitivity (allergy, anaphylaxis).',
    'arachidonic-acid leukotrienes':
      'Mast cells convert arachidonic acid via 5-lipoxygenase to cysteinyl leukotrienes (LTC4/D4/E4) — potent ' +
      'bronchoconstrictors and pro-inflammatory mediators in asthma. This arm is blocked by 5-LOX inhibitors ' +
      '(zileuton) and leukotriene-receptor antagonists (montelukast).' } },
  { slug: 'mycobacterial_cell_envelope', notes: {
    'mycolic-acid-precursor mycolic-acid':
      'Mycobacteria build a unique, waxy envelope rich in mycolic acids — long-chain fatty acids essential for ' +
      'survival and impermeability. Isoniazid (via InhA) and ethambutol target mycolic-acid/arabinogalactan ' +
      'synthesis; this envelope is also why TB is intrinsically hard to treat.',
    'mycobacterial-rna-polymerase mycobacterial-mrna':
      'Mycobacterial RNA polymerase transcribes the genes for survival and replication. Rifampin binds its ' +
      'β-subunit (rpoB) to block transcription — a cornerstone TB drug, with rpoB mutations the main cause of ' +
      'rifampin resistance and a marker of multidrug-resistant TB.' } },
  { slug: 'orexin_arousal_axis', notes: {
    'orexin-release monoaminergic-arousal':
      'Hypothalamic orexin (hypocretin) neurons stabilize wakefulness by exciting the monoaminergic and ' +
      'cholinergic arousal systems. Loss of orexin neurons causes narcolepsy with cataplexy — and orexin’s role ' +
      'made it the target of the “orexin-receptor antagonist” hypnotics (suvorexant).',
    'adenosine orexin-release':
      'Accumulating adenosine (the sleep-pressure signal) and circadian inputs modulate orexin-neuron activity, ' +
      'integrating homeostatic and circadian drives. This places orexin at the hub balancing sleep and wake — and ' +
      'explains why caffeine (an adenosine antagonist) promotes arousal partly through this system.' } },
  { slug: 'posterior_pituitary_oxt_vp', notes: {
    'osmotic-or-hypovolemic-stimulus avp-release':
      'Rising plasma osmolality (sensed by hypothalamic osmoreceptors) or falling blood volume triggers the ' +
      'posterior pituitary to release arginine vasopressin (AVP/ADH). Osmotic control is exquisitely sensitive — ' +
      'AVP is the primary defense of water balance and plasma osmolality.',
    'avp-release renal-water-reabsorption':
      'AVP acts on renal collecting-duct V2 receptors to insert aquaporin-2 channels, increasing water ' +
      'reabsorption and concentrating urine. Defects cause diabetes insipidus; desmopressin (a V2 agonist) treats ' +
      'it, while V2 antagonists (tolvaptan) are used for hyponatremia and polycystic kidney disease.' } },
  { slug: 'viral_polymerase_nucleoside_inhibition', notes: {
    'nucleoside-analog analog-triphosphate':
      'Nucleoside/nucleotide-analog antivirals are prodrugs: host (and sometimes viral) kinases phosphorylate ' +
      'them to the active triphosphate. This activation requirement can confer selectivity — acyclovir, for ' +
      'example, is activated only in herpes-infected cells by viral thymidine kinase.',
    'analog-triphosphate viral-rna-dna-chain-termination':
      'The analog triphosphate is incorporated by the viral polymerase into the growing nucleic acid, halting ' +
      'synthesis (chain termination) or causing lethal mutagenesis. This is the mechanism of acyclovir (HSV), ' +
      'tenofovir (HIV/HBV), sofosbuvir (HCV), and remdesivir (SARS-CoV-2).' } },
  { slug: 'viral_protease_neuraminidase', notes: {
    'sialic-acid-on-cell-surface flu-virion-release':
      'Influenza neuraminidase cleaves sialic-acid residues on the host-cell surface, releasing newly formed ' +
      'virions so they can spread. Neuraminidase inhibitors (oseltamivir/Tamiflu, zanamivir) block this release ' +
      'step — the main class of anti-influenza drugs.',
    'sars-cov-2-polyprotein sars-cov-2-functional-proteins':
      'SARS-CoV-2 translates polyproteins that its main protease (Mpro/3CLpro) must cleave into functional ' +
      'proteins for replication. Nirmatrelvir inhibits Mpro (boosted by ritonavir in Paxlovid) — a ' +
      'protease-inhibitor strategy mirroring HIV/HCV that gave a key oral COVID therapy.' } },
  { slug: 'vitamin_antioxidant_status', notes: {
    'lipid-peroxyl-radical tocopheryl-radical':
      'Vitamin E (α-tocopherol) is the principal lipid-phase antioxidant: it donates a hydrogen atom to ' +
      'chain-carrying lipid peroxyl radicals, halting membrane lipid-peroxidation chains and itself becoming a ' +
      'relatively stable tocopheryl radical. This breaks the propagation cycle that would otherwise damage ' +
      'membranes.',
    'tocopheryl-radical alpha-tocopherol':
      'The tocopheryl radical is recycled back to active α-tocopherol by other antioxidants — chiefly vitamin C ' +
      '(ascorbate) and the glutathione system. This antioxidant network (not vitamin E alone) sustains ' +
      'protection, illustrating why isolated high-dose vitamin E supplementation has disappointed in trials.' } },
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
console.log(`batch P total: ${totalAdded} notes`);
