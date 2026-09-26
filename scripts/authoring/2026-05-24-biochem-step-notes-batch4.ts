/**
 * 2026-05-24-biochem-step-notes-batch4.ts
 *
 * step.note LARGE batch 4 — 12 textbook pathways (steroid-hormone
 * biosynthesis, tyrosine + phenylalanine catabolism, histamine, MAO,
 * vitamin D, vitamin B12, CoA synthesis, ubiquinone, taurine, caffeine
 * + nicotine demethylation). Established biochem/pharmacology,
 * complementary to each `via`; grounded by existing refs[], NO new
 * PMIDs. Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-biochem-step-notes-batch4.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  steroid_hormone_biosynthesis: {
    'cholesterol pregnenolone':
      'The rate-limiting step is StAR-mediated delivery of cholesterol to the inner mitochondrial membrane, ' +
      'then CYP11A1 (side-chain cleavage) makes pregnenolone — the common precursor of all steroid hormones. ' +
      'ACTH/LH acutely drive StAR; StAR or CYP11A1 defects cause lipoid adrenal hyperplasia.',
    'pregnenolone progesterone':
      '3β-HSD converts Δ5 steroids to Δ4 and sits on every branch, so its deficiency impairs cortisol, ' +
      'aldosterone, and sex steroids together — a form of congenital adrenal hyperplasia.',
    'progesterone cortisol':
      'The glucocorticoid arm runs via 21-hydroxylase (CYP21A2) then 11β-hydroxylase. CYP21A2 deficiency is ' +
      'the commonest congenital adrenal hyperplasia (~90%): blocked cortisol shunts precursors to androgens ' +
      '(virilization) and loses aldosterone (salt-wasting).',
    'pregnenolone testosterone':
      'CYP17A1 has dual 17α-hydroxylase + 17,20-lyase activities gating the androgen/sex-steroid branch; the ' +
      'lyase step commits toward DHEA/androgens. It is the target of abiraterone (prostate cancer) and is ' +
      'inhibited off-target by ketoconazole.',
    'testosterone estradiol':
      'Aromatase irreversibly converts androgens to estrogens in gonads, adipose, brain, and bone — the basis ' +
      'of aromatase inhibitors (anastrozole/letrozole) in ER-positive breast cancer, and why adipose is a ' +
      'major peripheral estrogen source.',
  },
  tyrosine_metabolism: {
    'tyrosine 4-hydroxyphenylpyruvate':
      'Tyrosine aminotransferase (glucocorticoid-induced) begins tyrosine catabolism; its deficiency causes ' +
      'tyrosinemia type II. Tyrosine is also the branch-point substrate for catecholamines, thyroid hormone, ' +
      'and melanin.',
    '4-hydroxyphenylpyruvate homogentisic-acid':
      'HPP dioxygenase is the target of nitisinone, used in tyrosinemia type I to block the pathway upstream ' +
      'of the toxic downstream metabolites (and repurposed for alkaptonuria); the same enzyme class is the ' +
      'triketone-herbicide target.',
    'homogentisic-acid maleylacetoacetate':
      'Homogentisate dioxygenase deficiency causes alkaptonuria — homogentisic acid accumulates, darkening ' +
      'urine on standing and depositing as ochronotic pigment in cartilage and joints over decades.',
    'maleylacetoacetate fumarate-acetoacetate':
      'Fumarylacetoacetate hydrolase finishes catabolism to fumarate (TCA) + acetoacetate (ketogenic). FAH ' +
      'deficiency is tyrosinemia type I, where accumulating fumarylacetoacetate is hepatotoxic/carcinogenic — ' +
      'treated by nitisinone (blocking upstream) plus diet.',
  },
  histamine_axis: {
    'l-histidine histamine':
      'Histidine decarboxylase (PLP/B6-dependent) makes histamine in mast cells, basophils, ' +
      'enterochromaffin-like (ECL) cells, and histaminergic neurons. ECL histamine drives gastric acid (the ' +
      'H2-blocker axis); mast-cell histamine drives allergy.',
    'histamine imidazole-acetaldehyde':
      'Diamine oxidase is the main peripheral/gut route for clearing dietary and luminal histamine; low DAO ' +
      '(genetic, or inhibited by alcohol/drugs) is the proposed basis of “histamine intolerance” to ' +
      'fermented/aged foods.',
    'histamine n-methylhistamine':
      'HNMT, using SAM, is the principal route for inactivating histamine inside cells — especially in the CNS ' +
      'and bronchi, which lack DAO. The two routes (DAO peripheral, HNMT central) split histamine clearance ' +
      'by compartment.',
  },
  monoamine_oxidase_metabolism: {
    'serotonin 5-hydroxyindoleacetaldehyde':
      'MAO-A preferentially deaminates serotonin (and norepinephrine) → 5-HIAA, the urinary carcinoid marker. ' +
      'MAO-A inhibition raises synaptic serotonin/NE (antidepressant MAOIs) and underlies the tyramine ' +
      '“cheese reaction”.',
    'norepinephrine dihydroxyphenylglycoaldehyde':
      'MAO-A degrades norepinephrine toward DHPG/VMA (urinary catecholamine markers used in pheochromocytoma ' +
      'workup). MAO sits on the outer mitochondrial membrane, policing the cytosolic monoamine pool not ' +
      'protected inside vesicles.',
    'dopamine dopal':
      'Dopamine is a substrate for both MAO-A and MAO-B → DOPAC → HVA. MAO-B predominates in the basal ' +
      'ganglia, so selective MAO-B inhibitors (selegiline, rasagiline) raise dopamine in Parkinson’s with ' +
      'less tyramine interaction; the DOPAL intermediate is itself neurotoxic.',
  },
  vitamin_d_metabolism: {
    '7-dehydrocholesterol cholecalciferol':
      'UV-B photolyzes 7-dehydrocholesterol in skin to previtamin D3, which thermally isomerizes to ' +
      'cholecalciferol — the endogenous source, limited by latitude, season, sunscreen, and skin ' +
      'pigmentation. Dietary D2/D3 bypass this step.',
    'cholecalciferol 25-hydroxycholecalciferol':
      'Hepatic CYP2R1 makes 25-hydroxyvitamin D (calcidiol) — the major circulating, storage form and the ' +
      'analyte measured to assess vitamin-D status (its long half-life reflects overall stores).',
    '25-hydroxycholecalciferol calcitriol':
      'Renal CYP27B1 (1α-hydroxylase) makes active calcitriol, up-regulated by PTH and low phosphate and ' +
      'deficient in chronic kidney disease (renal osteodystrophy). Extra-renal CYP27B1 in macrophages ' +
      'explains the hypercalcemia of sarcoid/granulomatous disease.',
    'calcitriol inactive-24-hydroxy':
      'CYP24A1 inactivates calcitriol and 25-OH-D by 24-hydroxylation as negative feedback (induced by ' +
      'calcitriol and FGF23). Loss-of-function CYP24A1 mutations cause idiopathic infantile hypercalcemia ' +
      'from impaired vitamin-D breakdown.',
  },
  vitamin_b12_metabolism: {
    'cobalamin methylcobalamin':
      'Methylcobalamin is the cytosolic cofactor for methionine synthase (homocysteine → methionine); MTRR ' +
      'keeps the cobalamin reduced. Defects here or dietary B12 deficiency impair remethylation, raising ' +
      'homocysteine and causing megaloblastic anemia plus the methyl-folate trap.',
    'cobalamin adenosylcobalamin':
      'Adenosylcobalamin is the mitochondrial cofactor for methylmalonyl-CoA mutase (propionate → ' +
      'succinyl-CoA). Its deficiency raises methylmalonic acid (MMA) — a sensitive, B12-specific early marker ' +
      '(unlike homocysteine, which also rises in folate deficiency).',
  },
  coa_synthesis: {
    'pantothenate 4-prime-phosphopantothenate':
      'Pantothenate kinase (vitamin B5 → its phosphate) is the rate-limiting, feedback-regulated committed ' +
      'step of CoA synthesis. PANK2 mutations cause PKAN (pantothenate-kinase-associated neurodegeneration), ' +
      'a brain iron-accumulation disorder.',
    '4-prime-phosphopantothenate coa':
      'Subsequent steps add cysteine and an ADP moiety to build coenzyme A — the universal acyl carrier ' +
      '(acetyl-, malonyl-, succinyl-, fatty-acyl-CoA) central to nearly all intermediary metabolism, so CoA ' +
      'availability broadly gates acyl-group chemistry.',
  },
  ubiquinone_biosynthesis: {
    'tyrosine 4-hydroxybenzoate':
      'Tyrosine supplies ubiquinone’s aromatic head group (4-hydroxybenzoate); the benzoquinone ring is the ' +
      'redox-active part that cycles between oxidized and reduced forms in the electron-transport chain.',
    'mevalonate polyprenyl-pyrophosphate':
      'The isoprenoid tail comes from the mevalonate pathway shared with cholesterol synthesis — so ' +
      'HMG-CoA-reductase-inhibiting statins reduce the precursor for CoQ10’s tail, a proposed (debated) ' +
      'mechanism of statin-associated muscle symptoms.',
    '4-hydroxybenzoate coenzyme-q10':
      'A mitochondrial COQ enzyme complex assembles the head, attaches the polyprenyl tail, and decorates the ' +
      'ring. Primary CoQ10 deficiencies (COQ-gene defects) cause encephalomyopathy/nephropathy responsive to ' +
      'high-dose ubiquinone.',
  },
  taurine_synthesis: {
    'cysteine cysteine-sulfinic-acid':
      'Cysteine dioxygenase commits cysteine toward taurine (vs glutathione or H2S) and is strongly regulated ' +
      'by cysteine availability, protecting against cysteine toxicity — the gateway to the taurine branch of ' +
      'sulfur-amino-acid metabolism.',
    'cysteine-sulfinic-acid hypotaurine':
      'CSAD (PLP/B6-dependent) is the rate-limiting taurine-synthesis enzyme; humans synthesize taurine ' +
      'slowly (and cats lack CSAD entirely), making it conditionally essential — hence taurine in infant ' +
      'formula and its abundance in animal foods.',
    'hypotaurine taurine':
      'Hypotaurine is oxidized to taurine, among the most abundant free amino acids — used in bile-salt ' +
      '(taurocholate) conjugation, osmoregulation, membrane/Ca²⁺ stabilization, and antioxidant defense in ' +
      'heart and retina.',
  },
  caffeine_demethylation: {
    'caffeine paraxanthine':
      'CYP1A2 N3-demethylation to paraxanthine is ~84% of caffeine clearance, and paraxanthine carries much ' +
      'of the stimulant effect. CYP1A2 activity varies widely (the *1F polymorphism), is induced by smoking, ' +
      'and is inhibited by fluvoxamine, ciprofloxacin, and oral contraceptives.',
    'caffeine theobromine':
      'A minor (~12%) CYP1A2 route yields theobromine (also the main cacao methylxanthine). Because one enzyme ' +
      'dominates, caffeine is a classic CYP1A2 phenotyping probe — and pregnancy markedly slows caffeine ' +
      'clearance via reduced CYP1A2.',
    'caffeine theophylline':
      'The smallest (~4%) route gives theophylline, itself a narrow-therapeutic-index drug — so CYP1A2 ' +
      'inhibitors (ciprofloxacin, fluvoxamine) that also raise theophylline can cause toxicity, illustrating ' +
      'the shared metabolism.',
  },
  nicotine_metabolism: {
    'nicotine cotinine':
      'CYP2A6 is rate-limiting (~80% of nicotine clearance); cotinine’s long half-life makes it the standard ' +
      'biomarker of tobacco/nicotine exposure. Slow CYP2A6 metabolizers smoke less and quit more easily — a ' +
      'pharmacogenetic determinant of smoking behavior.',
    'cotinine trans-3-hydroxycotinine':
      'The same CYP2A6 hydroxylates cotinine; the 3-hydroxycotinine:cotinine ratio (the nicotine metabolite ' +
      'ratio, NMR) is a validated in-vivo CYP2A6 activity phenotype that predicts response to ' +
      'nicotine-replacement versus varenicline.',
    'nicotine nicotine-n-oxide':
      'A minor FMO3-mediated route; the dominance of CYP2A6 means CYP2A6 inhibitors or loss-of-function ' +
      'variants substantially raise nicotine exposure and shift smoking patterns.',
  },
  phenylalanine_metabolism: {
    'phenylalanine tyrosine':
      'Phenylalanine hydroxylase (BH4-dependent) converts phenylalanine to tyrosine; its deficiency causes ' +
      'phenylketonuria (PKU), where accumulating phenylalanine is neurotoxic — managed by lifelong Phe ' +
      'restriction (and sapropterin in BH4-responsive forms). BH4-cofactor defects cause atypical PKU that ' +
      'also impairs monoamine synthesis.',
  },
};

const data: Array<{ slug: string; steps: Array<{ from: string; to: string; note?: string }> }> =
  JSON.parse(readFileSync(PATHWAYS_PATH, 'utf8'));

let added = 0;
for (const [slug, stepNotes] of Object.entries(NOTES)) {
  const pw = data.find(p => p.slug === slug);
  if (!pw) throw new Error(`pathway "${slug}" not found`);
  const used = new Set<string>();
  for (const step of pw.steps) {
    const key = `${step.from} ${step.to}`;
    const note = stepNotes[key];
    if (note === undefined) continue;
    used.add(key);
    if (step.note) continue;
    if (note.length > 500) throw new Error(`${slug} "${key}": note ${note.length} > 500 chars`);
    step.note = note;
    added++;
  }
  const missing = Object.keys(stepNotes).filter(k => !used.has(k));
  if (missing.length) throw new Error(`${slug}: note key(s) matched no step: ${missing.join(' | ')}`);
}

writeFileSync(PATHWAYS_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`added ${added} step notes across ${Object.keys(NOTES).length} pathways`);
