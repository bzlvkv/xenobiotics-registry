/**
 * 2026-05-24-biochem-step-notes-batch3.ts
 *
 * step.note LARGE batch 3 — 12 textbook metabolic/physiologic pathways
 * (methionine/SAM cycle, carnitine shuttle, pyruvate, arachidonic-acid
 * cascade, coagulation, ethanol, NO synthesis, vitamin-K cycle, BH4
 * cycle, iron, polyol, choline/TMAO). Established biochemistry/
 * pharmacology, complementary to each `via`; grounded by existing
 * refs[], NO new PMIDs. Exact from→to keys (mismatch throws); idempotent.
 *   tsx scripts/authoring/2026-05-24-biochem-step-notes-batch3.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

const NOTES: Record<string, Record<string, string>> = {
  methionine_sam_cycle: {
    'methionine s-adenosylmethionine':
      'Methionine adenosyltransferase makes SAM, the universal methyl donor (a high-energy sulfonium). SAM ' +
      'also feeds polyamine synthesis and allosterically activates CBS — steering homocysteine toward ' +
      'disposal when methyl status is high.',
    's-adenosylmethionine s-adenosylhomocysteine':
      'Hundreds of methyltransferases (COMT, PEMT, DNA/histone enzymes…) transfer SAM’s methyl group, ' +
      'producing SAH. SAH is a potent product-inhibitor of those enzymes, so the SAM:SAH ratio (the ' +
      '“methylation index”) gauges methylation capacity.',
    's-adenosylhomocysteine homocysteine':
      'SAH hydrolase reversibly releases homocysteine and adenosine, and the equilibrium actually favors ' +
      'synthesis — so it proceeds only when both products are cleared downstream, making homocysteine ' +
      'disposal the pull that keeps methylation running.',
    'homocysteine methionine':
      'Methionine synthase remethylates homocysteine using 5-methyl-THF and a vitamin-B12 (methylcobalamin) ' +
      'cofactor — where folate and B12 status converge. B12 deficiency traps folate as 5-methyl-THF (the ' +
      '“methyl-folate trap”), causing a functional folate deficiency.',
    'homocysteine cystathionine':
      'The transsulfuration alternative: CBS (B6-dependent, SAM-activated) routes homocysteine to ' +
      'cysteine/glutathione rather than remethylation. The remethylation-vs-transsulfuration balance sets ' +
      'plasma homocysteine, elevated in B12/folate/B6 deficiency and CBS defects.',
  },
  carnitine_shuttle: {
    'long-chain-acyl-coa acyl-carnitine':
      'CPT1 on the outer mitochondrial membrane is the rate-limiting gate of fatty-acid oxidation. It is ' +
      'inhibited by malonyl-CoA (the fatty-acid-synthesis intermediate), so in the fed state high ' +
      'malonyl-CoA shuts the import gate, preventing simultaneous synthesis and oxidation.',
    'acyl-carnitine mitochondrial-acyl-carnitine':
      'Carnitine-acylcarnitine translocase antiports acylcarnitine inward for free carnitine outward across ' +
      'the inner membrane; its deficiency blocks long-chain fat oxidation, causing hypoketotic hypoglycemia ' +
      'and cardiomyopathy on fasting.',
    'mitochondrial-acyl-carnitine mitochondrial-acyl-coa':
      'CPT2 on the inner leaflet regenerates acyl-CoA for β-oxidation. CPT2 deficiency is a common cause of ' +
      'exertion/fasting rhabdomyolysis; only long-chain fats need this shuttle, while medium/short-chain fats ' +
      'enter mitochondria directly.',
  },
  pyruvate_metabolism: {
    'pyruvate acetyl-coa':
      'Pyruvate dehydrogenase irreversibly commits carbohydrate carbon to oxidation/lipogenesis, needing five ' +
      'cofactors (thiamine/TPP, lipoate, FAD, NAD, CoA). It is inhibited by acetyl-CoA/NADH and by PDK ' +
      'phosphorylation (fasting); thiamine deficiency (beriberi/Wernicke) cripples it.',
    'pyruvate lactate':
      'Lactate dehydrogenase regenerates NAD⁺ to sustain glycolysis when oxygen/mitochondria are limiting ' +
      '(exercise, anaerobic tissue, the Warburg effect). Lactate is not waste — it shuttles between tissues ' +
      '(Cori cycle, lactate shuttle) as fuel and gluconeogenic substrate.',
    'pyruvate oxaloacetate':
      'Pyruvate carboxylase (biotin-dependent, acetyl-CoA-activated) replenishes TCA oxaloacetate ' +
      '(anaplerosis) and is the first committed step of gluconeogenesis — favored in fasting when fat-derived ' +
      'acetyl-CoA accumulates.',
  },
  arachidonic_acid_cascade: {
    'arachidonic-acid prostaglandin-h2':
      'Cyclooxygenase (constitutive COX-1, inducible COX-2) makes the prostanoid precursor PGH2 and is the ' +
      'NSAID target. Aspirin irreversibly acetylates COX (permanently in anucleate platelets); COX-2-selective ' +
      'coxibs spare gastric COX-1 but raise CV risk by shifting the TXA2/prostacyclin balance.',
    'prostaglandin-h2 prostaglandin-e2':
      'PGE2 (via inducible mPGES-1) drives inflammation, pain, hypothalamic fever, and gastric mucosal ' +
      'protection — the last being why COX inhibition causes ulcers. It also keeps the fetal ductus arteriosus ' +
      'open, the basis of indomethacin closure.',
    'prostaglandin-h2 thromboxane-a2':
      'Platelet thromboxane synthase makes TXA2, a potent vasoconstrictor and platelet aggregator. Low-dose ' +
      'aspirin’s antiplatelet action is irreversible knockout of platelet TXA2 (platelets cannot resynthesize ' +
      'COX), while endothelium recovers.',
    'prostaglandin-h2 prostacyclin':
      'Endothelial prostacyclin (PGI2) opposes thromboxane — vasodilating and inhibiting platelet aggregation. ' +
      'The TXA2:PGI2 balance governs hemostasis and vascular tone (and underlies coxib CV risk); PGI2 analogs ' +
      'treat pulmonary hypertension.',
    'arachidonic-acid leukotriene-a4':
      '5-lipoxygenase (with FLAP) diverts arachidonate to leukotrienes rather than prostanoids and is the ' +
      'zileuton target. COX blockade can shunt substrate toward this LOX branch — a proposed mechanism of ' +
      'aspirin-exacerbated respiratory disease.',
    'leukotriene-a4 leukotriene-b4':
      'LTB4 is a powerful neutrophil chemoattractant and activator, central to neutrophilic inflammation ' +
      '(IBD, psoriasis) — distinct from the cysteinyl leukotrienes’ bronchoconstrictor role.',
    'leukotriene-a4 cysteinyl-leukotrienes':
      'LTC4/D4/E4 (the “slow-reacting substance of anaphylaxis”) drive bronchoconstriction, mucus, and ' +
      'vascular leak in asthma/allergy; montelukast and zafirlukast block the CysLT1 receptor.',
  },
  coagulation_cascade: {
    'tissue-factor factor-viia':
      'The extrinsic pathway is the physiologic trigger: injury exposes tissue factor, which binds and ' +
      'activates factor VII. The TF/VIIa complex is the dominant in-vivo initiator and is reflected by the ' +
      'prothrombin time (PT/INR) — the warfarin monitoring test.',
    'factor-viia factor-xa':
      'TF/VIIa activates factor X, starting the common pathway. Factor Xa is the convergence point and the ' +
      'target of the direct oral “-xaban” anticoagulants (apixaban, rivaroxaban); fondaparinux/heparin–' +
      'antithrombin act largely here too.',
    'factor-xii factor-xa':
      'The intrinsic (contact) pathway (XII→XI→IX with VIIIa) amplifies thrombin and is measured by the aPTT ' +
      '(heparin monitoring). Hemophilia A (VIII) and B (IX) are intrinsic deficiencies; factor XII deficiency ' +
      'prolongs aPTT but doesn’t cause bleeding.',
    'factor-xa thrombin':
      'The prothrombinase complex (Xa + Va on a Ca²⁺-dependent platelet phospholipid surface) converts ' +
      'prothrombin to thrombin — a massive amplification. Factors II/VII/IX/X (and proteins C/S) need ' +
      'vitamin-K-dependent γ-carboxylation, the warfarin target.',
    'thrombin fibrin':
      'Thrombin cleaves fibrinogen to fibrin and activates factor XIII (cross-linking) plus cofactors V/VIII/XI ' +
      '(feed-forward), while via thrombomodulin it activates protein C (an anticoagulant brake). Thrombin is ' +
      'the direct target of dabigatran and of heparin-potentiated antithrombin.',
  },
  ethanol_metabolism: {
    'ethanol acetaldehyde':
      'Alcohol dehydrogenase (cytosolic) oxidizes ethanol to toxic acetaldehyde, consuming NAD⁺; the high ' +
      'NADH/NAD⁺ ratio drives lactate (acidosis), suppresses gluconeogenesis (fasting hypoglycemia), and ' +
      'promotes fatty liver. CYP2E1 contributes more with chronic intake.',
    'acetaldehyde acetate':
      'Mitochondrial ALDH2 detoxifies acetaldehyde; the common East-Asian ALDH2*2 loss-of-function variant ' +
      'lets acetaldehyde accumulate (alcohol-flush reaction, higher esophageal-cancer risk). Disulfiram ' +
      'inhibits ALDH2 deliberately to deter drinking.',
  },
  nitric_oxide_synthesis: {
    'l-arginine nitric-oxide':
      'NO synthases (endothelial eNOS, neuronal nNOS, inducible iNOS) oxidize arginine to NO + citrulline, ' +
      'needing BH4, NADPH, and calmodulin. BH4 depletion “uncouples” eNOS to make superoxide instead of NO ' +
      '(endothelial dysfunction); citrulline/arginine supplements aim to raise NO substrate.',
    'nitric-oxide cyclic-gmp':
      'NO diffuses into smooth muscle and binds the heme of soluble guanylate cyclase, raising cGMP → ' +
      'vasodilation. PDE5 inhibitors (sildenafil) block cGMP breakdown, nitrates donate NO directly, and ' +
      'riociguat directly stimulates sGC in pulmonary hypertension.',
  },
  vitamin_k_cycle: {
    'phylloquinone vitamin-k-hydroquinone':
      'Vitamin K is reduced to its active hydroquinone to serve as the γ-carboxylase cofactor. Dietary K1 ' +
      '(phylloquinone, leafy greens) and bacterial/animal K2 (menaquinones) both feed this cycle.',
    'vitamin-k-hydroquinone vitamin-k-epoxide':
      'γ-glutamyl carboxylase uses the hydroquinone (plus O2/CO2) to carboxylate glutamates to Gla on factors ' +
      'II/VII/IX/X and proteins C/S — and on osteocalcin/MGP (bone, vascular) — the modification that lets ' +
      'these proteins bind Ca²⁺ and membranes.',
    'vitamin-k-epoxide phylloquinone':
      'VKOR (VKORC1) recycles the spent epoxide back to vitamin K — the warfarin target. Warfarin depletes ' +
      'reduced vitamin K, yielding under-carboxylated, nonfunctional factors; VKORC1/CYP2C9 variants explain ' +
      'much of warfarin’s dosing variability, and dietary vitamin K antagonizes it.',
  },
  bh4_cycle: {
    'gtp 7-8-dihydroneopterin-triphosphate':
      'GTP cyclohydrolase 1 is the rate-limiting, feedback-regulated step of de-novo BH4 synthesis. BH4 is the ' +
      'obligate cofactor for the aromatic amino-acid hydroxylases (PAH, TH, TPH) and all NOS isoforms, so ' +
      'GTPCH1 deficiency causes dopa-responsive dystonia and hyperphenylalaninemia.',
    '7-8-dihydroneopterin-triphosphate bh4':
      'PTPS then sepiapterin reductase finish de-novo BH4. Because BH4 supplies phenylalanine hydroxylase, ' +
      'BH4-responsive PKU (and synthetic BH4, sapropterin) lowers phenylalanine — and BH4 is studied to ' +
      '“re-couple” eNOS.',
    'bh2 bh4':
      'Each hydroxylation oxidizes BH4 to BH2; dihydropteridine reductase regenerates BH4 using NADH. DHPR ' +
      'deficiency is a malignant PKU variant that also starves dopamine/serotonin synthesis of the cofactor ' +
      'despite a low-phenylalanine diet.',
  },
  iron_metabolism: {
    'dietary-iron enterocyte-iron':
      'At the apical enterocyte, DCYTB reduces ferric to ferrous iron for the DMT1 importer; heme iron uses a ' +
      'separate, more efficient route. Vitamin C aids non-heme absorption while phytates, tannins, and calcium ' +
      'inhibit it.',
    'enterocyte-iron plasma-iron':
      'Ferroportin is the only cellular iron exporter and the master control point: the hepatic hormone ' +
      'hepcidin (raised by iron load and inflammation) degrades it, trapping iron in cells — the basis of ' +
      'anemia of chronic disease, while hepcidin deficiency causes hemochromatosis.',
    'plasma-iron erythroblast-iron':
      'Plasma iron rides transferrin to receptor-mediated endocytosis, then is stored in ferritin or used for ' +
      'heme. There is no regulated route to excrete iron — loss is only via bleeding/cell shedding — so ' +
      'absorption is the sole control, which is why overload is hard to clear.',
  },
  polyol_pathway: {
    'glucose sorbitol':
      'Aldose reductase reduces glucose to sorbitol using NADPH; normally minor, it surges in hyperglycemia in ' +
      'insulin-independent tissues (lens, nerve, retina, kidney). NADPH consumption depletes glutathione ' +
      '(oxidative stress) and trapped sorbitol causes osmotic injury — diabetic cataract/neuropathy (epalrestat targets it).',
    'sorbitol fructose':
      'Sorbitol dehydrogenase oxidizes sorbitol to fructose, consuming NAD⁺ (raising NADH much as ethanol ' +
      'does). The added fructose and altered redox compound the polyol pathway’s role in diabetic tissue ' +
      'injury; this route also makes seminal fructose.',
  },
  choline_tmao_metabolism: {
    'choline trimethylamine':
      'Gut bacteria cleave dietary choline, carnitine, and betaine to trimethylamine via CutC/D — a ' +
      'microbiome-dependent step, so antibiotics and microbiome composition shift TMA output. Red meat, eggs, ' +
      'and fish are the main precursors.',
    'trimethylamine trimethylamine-n-oxide':
      'Hepatic FMO3 oxidizes TMA to TMAO; elevated TMAO is epidemiologically linked to atherosclerosis/CV risk ' +
      '(a debated diet–microbiome–host axis). FMO3 loss-of-function causes trimethylaminuria (“fish-odor ' +
      'syndrome”) from unoxidized, volatile TMA.',
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
