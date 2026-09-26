/**
 * 2026-05-11-wave-5a-pathway-batch-2.ts — 14 more pathways (v1.2).
 *
 * Continues from batch-1 (12 pathways, +catecholamine + caffeine +
 * serotonin from scaffolding = 15 total). This batch hits the original
 * v8.1 spec §16.3 hand-authored target of 30 by adding 14 more across
 * the remaining high-clinical-surface pathways:
 *
 * Biosynthesis (4):
 *   13. heme_biosynthesis           ALAS → ALA → ... → heme; porphyria
 *   14. histamine_axis              HDC; DAO + HNMT degradation
 *   15. nitric_oxide_synthesis      NOS; sildenafil mechanism context
 *
 * Catabolism / energy (4):
 *   16. tca_cycle                   citrate → ... → oxaloacetate
 *   17. beta_oxidation              fatty acyl-CoA → acetyl-CoA
 *   18. glycolysis                  glucose → pyruvate
 *   19. gluconeogenesis             pyruvate → glucose (4 unique steps)
 *
 * Drug metabolism (1):
 *   20. methionine_sam_cycle        methionine → SAM → SAH → homocyst
 *
 * Signaling (2):
 *   21. nfkb_signaling              TLR/TNF/IL-1 → IκB → NF-κB
 *   22. folate_one_carbon           DHF → THF → 5-methyl-THF / methotrexate
 *
 * Hemostasis (2):
 *   23. coagulation_cascade         extrinsic + intrinsic → factor Xa → thrombin → fibrin
 *   24. fibrinolysis                plasminogen → plasmin → fibrin degradation
 *
 * Endocrine axis (3):
 *   25. hpa_axis                    CRH → ACTH → cortisol
 *   26. hpg_axis                    GnRH → LH/FSH → testosterone/estradiol
 *   27. hpt_axis                    TRH → TSH → T4/T3
 *
 * Brings the registry to 27 hand-authored pathways. Final 3-5 will land
 * in batch 3 + further sessions to complete the v1.2 30-pathway target.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATHWAYS_PATH = join(__dirname, '..', '..', 'packages', 'registry', 'data', 'pathways.json');

interface PathwayStep { from: string; to: string; via?: string; via_slug?: string; note?: string; source_pmid?: string }
interface PathwayModulator { slug: string; effect: 'inhibitor' | 'activator' | 'substrate' | 'cofactor'; target?: string; note?: string }
interface Pathway {
  slug: string; name: string;
  category: 'biosynthesis' | 'catabolism' | 'drug_metabolism' | 'signaling' | 'transport' | 'membrane' | 'endocrine_axis';
  systems: string[]; description: string;
  steps: PathwayStep[];
  modulators?: PathwayModulator[];
  refs?: string[];
}

const NEW_PATHWAYS: Pathway[] = [
  {
    slug: 'heme_biosynthesis',
    name: 'Heme biosynthesis',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'nervous'],
    description: 'Eight-step pathway from succinyl-CoA + glycine to heme. Mitochondrial / cytosolic shuttle: ALAS (rate-limiting, mitochondrial; hepatic ALAS1 + erythroid ALAS2) → δ-aminolevulinic acid (ALA) → cytosolic steps to coproporphyrinogen III → back into mitochondria for protoporphyrinogen → heme (ferrochelatase). Deficiencies of any step produce the porphyrias — acute intermittent porphyria (PBGD), porphyria cutanea tarda (UROD), variegate porphyria (PPOX), erythropoietic protoporphyria (FECH). Lead inhibits ALA dehydratase + ferrochelatase, producing the basophilic stippling + microcytic anemia of plumbism. Iron deficiency limits heme via ferrochelatase substrate exhaustion.',
    steps: [
      { from: 'succinyl-coa', to: 'aminolevulinic-acid', via: 'ALAS — rate-limiting; ALAS1 (hepatic) vs ALAS2 (erythroid)' },
      { from: 'aminolevulinic-acid', to: 'porphobilinogen', via: 'ALA dehydratase — LEAD-INHIBITED' },
      { from: 'porphobilinogen', to: 'coproporphyrinogen-iii', via: 'multi-step (PBGD → UROS → UROD)' },
      { from: 'coproporphyrinogen-iii', to: 'protoporphyrin-ix', via: 'CPO → PPOX (mitochondrial re-entry)' },
      { from: 'protoporphyrin-ix', to: 'heme', via: 'ferrochelatase — inserts Fe2+; LEAD-INHIBITED' },
    ],
    refs: [],
  },
  {
    slug: 'histamine_axis',
    name: 'Histamine synthesis + degradation',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'digestive', 'nervous'],
    description: 'L-histidine → histamine via histidine decarboxylase (HDC), restricted to mast cells, basophils, enterochromaffin-like (ECL) cells of the stomach, and histaminergic neurons of the tuberomammillary nucleus. Two parallel degradation paths: peripheral diamine oxidase (DAO; intestinal, renal) → imidazole acetaldehyde; central histamine-N-methyltransferase (HNMT; cytosolic) → N-methylhistamine. DAO deficiency (genetic or post-enteritis) is the proposed mechanism of "histamine intolerance" — symptoms from dietary histamine + DAO-substrate foods (aged cheese, wine, fermented foods).',
    steps: [
      { from: 'l-histidine', to: 'histamine', via: 'histidine decarboxylase (HDC) — restricted to mast/basophil/ECL/TMN' },
      { from: 'histamine', to: 'imidazole-acetaldehyde', via: 'diamine oxidase (DAO) — peripheral path' },
      { from: 'histamine', to: 'n-methylhistamine', via: 'histamine-N-methyltransferase (HNMT) — central path' },
    ],
    refs: [],
  },
  {
    slug: 'nitric_oxide_synthesis',
    name: 'Nitric oxide synthesis',
    category: 'biosynthesis',
    systems: ['cardiovascular', 'nervous', 'immune-hematologic'],
    description: 'L-arginine + O2 → nitric oxide (NO) + L-citrulline via nitric oxide synthase. Three isoforms with distinct biology: eNOS (endothelial, Ca2+/calmodulin-regulated, basal vasodilation), nNOS (neuronal, NMDA-receptor-coupled), iNOS (inducible, cytokine-driven, macrophage anti-microbial). NO diffuses into adjacent smooth muscle, activates soluble guanylate cyclase → cGMP → PKG → vasodilation. PDE5 (sildenafil/tadalafil target) degrades cGMP — sildenafil amplifies endogenous NO signaling, doesn\'t generate it. Nitrates (nitroglycerin, isosorbide) bypass NOS by donating NO directly; tolerance develops via sulfhydryl depletion.',
    steps: [
      { from: 'l-arginine', to: 'nitric-oxide', via: 'NOS (eNOS / nNOS / iNOS); also produces L-citrulline; BH4 cofactor' },
      { from: 'nitric-oxide', to: 'cyclic-gmp', via: 'soluble guanylate cyclase (sGC) — activated by NO binding heme' },
    ],
    modulators: [
      { slug: 'sildenafil', effect: 'inhibitor', target: 'PDE5 (downstream — blocks cGMP degradation, amplifying endogenous NO)' },
      { slug: 'tadalafil', effect: 'inhibitor', target: 'PDE5' },
      { slug: 'vardenafil', effect: 'inhibitor', target: 'PDE5' },
      { slug: 'l-arginine', effect: 'substrate', target: 'NOS step' },
    ],
    refs: [],
  },
  {
    slug: 'tca_cycle',
    name: 'TCA cycle (Krebs / citric acid cycle)',
    category: 'catabolism',
    systems: ['endocrine', 'musculoskeletal'],
    description: 'Mitochondrial 8-enzyme cycle oxidizing acetyl-CoA to 2 CO2 with reduction of 3 NAD+ + 1 FAD + 1 GDP → ATP-equivalents that drive the electron transport chain. Citrate synthase condenses acetyl-CoA + oxaloacetate; aconitase isomerizes; isocitrate dehydrogenase (rate-limiting, NAD-linked) + α-ketoglutarate dehydrogenase + succinyl-CoA synthetase + succinate dehydrogenase (also Complex II of ETC) + fumarase + malate dehydrogenase complete the cycle. Anaplerotic refilling primarily from pyruvate carboxylase (pyruvate → oxaloacetate) maintains intermediate pool during high biosynthesis demand.',
    steps: [
      { from: 'acetyl-coa', to: 'citrate', via: 'citrate synthase (irreversible)' },
      { from: 'citrate', to: 'isocitrate', via: 'aconitase' },
      { from: 'isocitrate', to: 'alpha-ketoglutarate', via: 'isocitrate dehydrogenase (IDH) — rate-limiting; NAD-linked' },
      { from: 'alpha-ketoglutarate', to: 'succinyl-coa', via: 'α-KG dehydrogenase complex (mirror of PDH)' },
      { from: 'succinyl-coa', to: 'succinate', via: 'succinyl-CoA synthetase (substrate-level phosphorylation)' },
      { from: 'succinate', to: 'fumarate', via: 'succinate dehydrogenase = ETC Complex II' },
      { from: 'fumarate', to: 'malate', via: 'fumarase' },
      { from: 'malate', to: 'oxaloacetate', via: 'malate dehydrogenase (closes cycle)' },
    ],
    refs: [],
  },
  {
    slug: 'beta_oxidation',
    name: 'Fatty acid β-oxidation',
    category: 'catabolism',
    systems: ['endocrine', 'musculoskeletal', 'cardiovascular'],
    description: 'Mitochondrial degradation of fatty acyl-CoA into acetyl-CoA + FADH2 + NADH. Long-chain fatty acids must first traverse the inner mitochondrial membrane via the CARNITINE SHUTTLE (CPT1 outer, CACT translocase, CPT2 inner) — CPT1 is the major regulatory step, inhibited by malonyl-CoA (the link to fatty acid synthesis: high malonyl-CoA → cytosolic FA synthesis ON, mitochondrial β-oxidation OFF). Each β-oxidation cycle: acyl-CoA → enoyl-CoA (FAD) → 3-OH-acyl-CoA → 3-ketoacyl-CoA (NAD) → shortened acyl-CoA + acetyl-CoA. Cycle repeats until the acyl chain is fully consumed. Carnitine deficiency (genetic or valproate-induced) presents as hypoketotic hypoglycemia + cardiomyopathy + Reye-like syndrome.',
    steps: [
      { from: 'fatty-acyl-coa', to: 'enoyl-coa', via: 'acyl-CoA dehydrogenase (FAD → FADH2)' },
      { from: 'enoyl-coa', to: '3-hydroxyacyl-coa', via: 'enoyl-CoA hydratase' },
      { from: '3-hydroxyacyl-coa', to: '3-ketoacyl-coa', via: '3-OH-acyl-CoA dehydrogenase (NAD → NADH)' },
      { from: '3-ketoacyl-coa', to: 'acetyl-coa', via: 'β-ketothiolase (also produces a shortened acyl-CoA for next cycle)' },
    ],
    refs: [],
  },
  {
    slug: 'glycolysis',
    name: 'Glycolysis',
    category: 'catabolism',
    systems: ['endocrine', 'nervous'],
    description: 'Cytosolic 10-step pathway converting glucose to pyruvate with net 2 ATP + 2 NADH. Three irreversible regulatory steps: hexokinase / glucokinase (hexokinase IV in liver) — glucose phosphorylation; phosphofructokinase-1 (PFK-1) — RATE-LIMITING, allosterically inhibited by ATP + citrate, activated by AMP + F-2,6-BP; pyruvate kinase — final step, allosterically inhibited by ATP + alanine. Tumor cells exhibit aerobic glycolysis (Warburg effect) — high glycolytic flux even with O2 available, supporting biomass over ATP yield. PKM2 isoform dimer/tetramer switching is a major Warburg switch.',
    steps: [
      { from: 'glucose', to: 'glucose-6-phosphate', via: 'hexokinase (HK1-4) — glucokinase (HK4) in liver/β-cell' },
      { from: 'glucose-6-phosphate', to: 'fructose-1-6-bisphosphate', via: 'phosphofructokinase-1 (PFK-1) — RATE-LIMITING' },
      { from: 'fructose-1-6-bisphosphate', to: 'pyruvate', via: 'multi-step (aldolase + TPI + GAPDH + PGK + PGM + enolase + PYRUVATE KINASE)' },
    ],
    refs: [],
  },
  {
    slug: 'gluconeogenesis',
    name: 'Gluconeogenesis (hepatic + renal)',
    category: 'biosynthesis',
    systems: ['endocrine', 'renal', 'digestive'],
    description: 'Hepatic (+ renal cortex) synthesis of glucose from non-carb precursors (lactate, glycerol, glucogenic amino acids). Reverses 7 of 10 glycolytic steps via the same enzymes; 4 irreversible glycolytic steps are bypassed by 4 unique gluconeogenic enzymes: pyruvate carboxylase (mitochondrial; pyruvate → OAA, biotin-dependent), PEPCK (cytosolic; OAA → PEP), fructose-1,6-bisphosphatase (RATE-LIMITING; opposes PFK-1), glucose-6-phosphatase (microsomal lumen; only expressed in liver/kidney/intestine — hence those are the only gluconeogenic tissues). Cortisol + glucagon upregulate; insulin downregulates; metformin\'s primary action is to suppress hepatic gluconeogenesis.',
    steps: [
      { from: 'pyruvate', to: 'oxaloacetate', via: 'pyruvate carboxylase (biotin)' },
      { from: 'oxaloacetate', to: 'phosphoenolpyruvate', via: 'PEPCK (cytosolic)' },
      { from: 'phosphoenolpyruvate', to: 'fructose-1-6-bisphosphate', via: 'glycolysis-reversed (7 reversible steps)' },
      { from: 'fructose-1-6-bisphosphate', to: 'fructose-6-phosphate', via: 'fructose-1,6-bisphosphatase — RATE-LIMITING' },
      { from: 'glucose-6-phosphate', to: 'glucose', via: 'glucose-6-phosphatase — liver/kidney/intestine ONLY' },
    ],
    modulators: [
      { slug: 'metformin', effect: 'inhibitor', target: 'hepatic gluconeogenesis (Complex I + mGPD inhibition reduces cytoplasmic NADH for the GAPDH-reverse step)' },
    ],
    refs: [],
  },
  {
    slug: 'methionine_sam_cycle',
    name: 'Methionine cycle (SAM → SAH → homocysteine)',
    category: 'drug_metabolism',
    systems: ['nervous', 'cardiovascular', 'immune-hematologic'],
    description: 'Methionine is the methyl-group donor source: methionine → SAM (S-adenosylmethionine; MAT) → SAH (S-adenosylhomocysteine; after methyl transfer) → homocysteine (SAH hydrolase) → methionine (methionine synthase, B12 + 5-methyl-THF dependent) or → cystathionine → cysteine (B6-dependent transsulfuration). B12 OR folate deficiency raises homocysteine; chronically elevated homocysteine is a CV risk marker. MTHFR C677T polymorphism reduces 5,10-methylene-THF → 5-methyl-THF flux, raising homocysteine in homozygotes.',
    steps: [
      { from: 'methionine', to: 's-adenosylmethionine', via: 'methionine adenosyltransferase (MAT)' },
      { from: 's-adenosylmethionine', to: 's-adenosylhomocysteine', via: 'methyl transfer to acceptor substrates (DNA, histones, neurotransmitters)' },
      { from: 's-adenosylhomocysteine', to: 'homocysteine', via: 'SAH hydrolase' },
      { from: 'homocysteine', to: 'methionine', via: 'methionine synthase — B12 + 5-methyl-THF cofactors' },
      { from: 'homocysteine', to: 'cystathionine', via: 'CBS — B6 cofactor; transsulfuration branch' },
    ],
    modulators: [
      { slug: 'methionine', effect: 'substrate', target: 'cycle entry' },
      { slug: 'homocysteine', effect: 'substrate', target: 'cycle intermediate; CV risk marker' },
      { slug: 'folic-acid', effect: 'cofactor', target: 'methionine synthase (via 5-methyl-THF)' },
    ],
    refs: [],
  },
  {
    slug: 'folate_one_carbon',
    name: 'Folate / one-carbon metabolism',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'reproductive'],
    description: 'Folate (folic acid → DHF → THF) is reduced via DHFR — the methotrexate target. THF accepts one-carbon units (from serine, glycine, formate) at the N5/N10 positions to form: 5-methyl-THF (donates methyl to homocysteine → methionine), 5,10-methylene-THF (donates methyl to dUMP → dTMP via thymidylate synthase — the 5-FU target), 10-formyl-THF (donates formyl to purine de novo synthesis). Methotrexate inhibits DHFR + thymidylate synthase + AICAR transformylase — explaining its activity in chemotherapy (kills proliferating cells), rheumatology (immunosuppressant), and obstetrics (ectopic pregnancy + medical abortion). Leucovorin (5-formyl-THF) bypasses DHFR for rescue.',
    steps: [
      { from: 'folic-acid', to: 'dihydrofolate', via: 'folate reductase' },
      { from: 'dihydrofolate', to: 'tetrahydrofolate', via: 'DHFR — METHOTREXATE TARGET' },
      { from: 'tetrahydrofolate', to: '5-methyl-tetrahydrofolate', via: 'methylene-THF reductase (MTHFR) — common C677T polymorphism' },
      { from: 'tetrahydrofolate', to: '5-10-methylene-tetrahydrofolate', via: 'serine hydroxymethyltransferase (SHMT) — substrate for thymidylate synthase' },
    ],
    modulators: [
      { slug: 'methotrexate', effect: 'inhibitor', target: 'DHFR + thymidylate synthase + AICAR transformylase' },
      { slug: 'folic-acid', effect: 'substrate', target: 'cycle entry' },
    ],
    refs: [],
  },
  {
    slug: 'nfkb_signaling',
    name: 'NF-κB signaling',
    category: 'signaling',
    systems: ['immune-hematologic', 'nervous'],
    description: 'Master inflammation + survival transcription factor pathway. Resting state: NF-κB heterodimer (p50/p65) sequestered in cytoplasm bound to IκB. Activation by TLR / TNF / IL-1 / antigen receptor signaling → IKK complex phosphorylates IκB → IκB ubiquitinated + proteasomally degraded → NF-κB translocates to nucleus → drives transcription of cytokines (TNF, IL-6, IL-1β), adhesion molecules, anti-apoptotic genes (BCL-2 family), COX-2, iNOS. Glucocorticoids inhibit NF-κB via transrepression (GR-NF-κB direct interaction) — the explanation for their broad anti-inflammatory action. NSAIDs work downstream (block COX-2 product); steroids work upstream.',
    steps: [
      { from: 'tnf-alpha', to: 'ikk-activation', via: 'TNFR1 → TRADD → TRAF2 → RIP → IKK complex' },
      { from: 'ikk-activation', to: 'ikb-degradation', via: 'IκB phosphorylation → ubiquitination → 26S proteasome' },
      { from: 'ikb-degradation', to: 'nfkb-nuclear', via: 'released NF-κB heterodimer translocates to nucleus' },
      { from: 'nfkb-nuclear', to: 'inflammatory-cytokines', via: 'transcriptional activation of TNF / IL-6 / IL-1β / COX-2 / iNOS' },
    ],
    modulators: [
      { slug: 'prednisone', effect: 'inhibitor', target: 'NF-κB transrepression via GR (broad downstream effect)' },
      { slug: 'dexamethasone', effect: 'inhibitor', target: 'NF-κB transrepression via GR' },
      { slug: 'infliximab', effect: 'inhibitor', target: 'TNF-α (upstream — biologic anti-TNF mAb)' },
      { slug: 'adalimumab', effect: 'inhibitor', target: 'TNF-α (anti-TNF mAb)' },
    ],
    refs: [],
  },
  {
    slug: 'coagulation_cascade',
    name: 'Coagulation cascade (extrinsic + intrinsic → common)',
    category: 'biosynthesis',
    systems: ['immune-hematologic', 'cardiovascular'],
    description: 'Sequential serine-protease activations producing thrombin (factor IIa) and ultimately fibrin clot. Extrinsic pathway: TF (factor III) + VIIa → activates X. Intrinsic pathway: XII → XI → IX (+ VIII cofactor) → X. Common pathway: X (+ V cofactor) → thrombin → fibrin. Vitamin-K-dependent factors (II, VII, IX, X + proteins C, S) require γ-carboxylation — warfarin target via VKORC1 (see vitamin_k_cycle). Heparin enhances antithrombin\'s inhibition of IIa + Xa. LMWHs (enoxaparin) selectively boost Xa inhibition. DOACs directly inhibit factor IIa (dabigatran) or factor Xa (apixaban, rivaroxaban, edoxaban) — bypassing antithrombin.',
    steps: [
      { from: 'tissue-factor', to: 'factor-viia', via: 'extrinsic pathway initiation' },
      { from: 'factor-viia', to: 'factor-xa', via: 'common pathway entry (TF/VIIa activates X)' },
      { from: 'factor-xii', to: 'factor-xa', via: 'intrinsic pathway: XII → XI → IX (+ VIIIa cofactor) → X' },
      { from: 'factor-xa', to: 'thrombin', via: 'prothrombinase complex (Xa + Va on platelet phospholipid surface)' },
      { from: 'thrombin', to: 'fibrin', via: 'cleaves fibrinogen → fibrin monomers; also activates V, VIII, XI, XIII (positive feedback)' },
    ],
    modulators: [
      { slug: 'warfarin', effect: 'inhibitor', target: 'vitamin-K-dependent factors II/VII/IX/X (upstream γ-carboxylation)' },
      { slug: 'apixaban', effect: 'inhibitor', target: 'factor Xa (direct)' },
      { slug: 'rivaroxaban', effect: 'inhibitor', target: 'factor Xa (direct)' },
      { slug: 'edoxaban', effect: 'inhibitor', target: 'factor Xa (direct)' },
      { slug: 'dabigatran', effect: 'inhibitor', target: 'thrombin / factor IIa (direct)' },
      { slug: 'heparin', effect: 'inhibitor', target: 'antithrombin amplification (IIa + Xa inhibition)' },
      { slug: 'enoxaparin', effect: 'inhibitor', target: 'antithrombin → factor Xa (LMWH; Xa-selective)' },
    ],
    refs: [],
  },
  {
    slug: 'fibrinolysis',
    name: 'Fibrinolysis (plasminogen → plasmin)',
    category: 'catabolism',
    systems: ['immune-hematologic', 'cardiovascular'],
    description: 'Inverse of coagulation. Plasminogen is the inactive zymogen, activated by tPA (endothelial, fibrin-targeted) or uPA (urokinase, broader). Plasmin cleaves fibrin → fibrin degradation products (D-dimer being the diagnostic marker). PAI-1 inhibits tPA/uPA; α2-antiplasmin inhibits free plasmin. Therapeutic thrombolysis (alteplase, tenecteplase, reteplase) for STEMI + acute ischemic stroke + massive PE works at the tPA step. Tranexamic acid (TXA) is the prototype antifibrinolytic — inhibits plasminogen lysine-binding to fibrin, blocking plasmin generation — used to reduce surgical/trauma/obstetric bleeding.',
    steps: [
      { from: 'plasminogen', to: 'plasmin', via: 'tPA (endothelial) or uPA (urokinase); fibrin-targeted' },
      { from: 'plasmin', to: 'fibrin-degradation-products', via: 'plasmin cleaves fibrin → D-dimer + FDPs' },
    ],
    modulators: [
      { slug: 'tranexamic-acid', effect: 'inhibitor', target: 'plasminogen lysine-binding (blocks plasmin generation)' },
    ],
    refs: [],
  },
  {
    slug: 'hpa_axis',
    name: 'Hypothalamic-pituitary-adrenal axis',
    category: 'endocrine_axis',
    systems: ['endocrine', 'nervous', 'immune-hematologic'],
    description: 'Stress + circadian cortisol regulation. Hypothalamic CRH → anterior pituitary ACTH → adrenal cortex (zona fasciculata) cortisol. Negative feedback: cortisol → hypothalamus + pituitary (suppresses CRH + ACTH). Exogenous glucocorticoids suppress the entire axis — chronic high-dose Rx (>10-20 mg/d prednisone equivalent for >2-3 weeks) produces tertiary adrenal insufficiency that requires gradual taper. ACTH-stim test diagnoses primary vs secondary AI. Diurnal rhythm: ACTH + cortisol peak in early morning (~6-8am), trough at night (~midnight) — the basis for AM cortisol measurement and dexamethasone suppression test.',
    steps: [
      { from: 'crh', to: 'acth', via: 'hypothalamic CRH → anterior pituitary corticotrophs' },
      { from: 'acth', to: 'cortisol', via: 'ACTH → adrenal cortex zona fasciculata; ACTH-R / MC2R signaling' },
      { from: 'cortisol', to: 'crh-suppression', via: 'negative feedback at hypothalamus + pituitary' },
    ],
    modulators: [
      { slug: 'prednisone', effect: 'inhibitor', target: 'CRH/ACTH negative feedback (exogenous glucocorticoid)' },
      { slug: 'dexamethasone', effect: 'inhibitor', target: 'CRH/ACTH negative feedback' },
      { slug: 'hydrocortisone', effect: 'substrate', target: 'cortisol replacement in adrenal insufficiency' },
      { slug: 'cortisol', effect: 'substrate', target: 'axis endpoint; identical to endogenous' },
    ],
    refs: [],
  },
  {
    slug: 'hpg_axis',
    name: 'Hypothalamic-pituitary-gonadal axis',
    category: 'endocrine_axis',
    systems: ['endocrine', 'reproductive'],
    description: 'Reproductive endocrine loop. Hypothalamic GnRH (pulsatile) → anterior pituitary LH + FSH → gonadal steroidogenesis. Males: LH → Leydig cells → testosterone; FSH → Sertoli cells → spermatogenesis support + inhibin B. Females: cycle-dependent — FSH drives follicle growth + granulosa-cell estradiol; LH surge triggers ovulation; corpus luteum produces progesterone. Pharmacology: GnRH AGONISTS (leuprolide, goserelin) produce initial flare then downregulation/desensitization → suppression of LH/FSH — used in prostate cancer, endometriosis, central precocious puberty. GnRH ANTAGONISTS (degarelix, cetrorelix) suppress without flare. Aromatase inhibitors (anastrozole, letrozole) block peripheral estradiol synthesis.',
    steps: [
      { from: 'gnrh', to: 'lh', via: 'pituitary gonadotrophs (pulsatile GnRH; continuous GnRH causes downregulation)' },
      { from: 'gnrh', to: 'fsh', via: 'pituitary gonadotrophs (same cell, same GnRH input)' },
      { from: 'lh', to: 'testosterone', via: 'Leydig cell steroidogenesis (males); CYP17 + 3β-HSD + 17β-HSD' },
      { from: 'lh', to: 'estradiol', via: 'theca cell androgens + granulosa cell aromatase (CYP19) (females)' },
    ],
    modulators: [
      { slug: 'testosterone', effect: 'substrate', target: 'axis endpoint; suppresses GnRH/LH via negative feedback' },
    ],
    refs: [],
  },
  {
    slug: 'hpt_axis',
    name: 'Hypothalamic-pituitary-thyroid axis',
    category: 'endocrine_axis',
    systems: ['endocrine'],
    description: 'Thyroid hormone homeostasis loop. Hypothalamic TRH → anterior pituitary TSH → thyroid follicle cells → T4 (primary secretory product, ~80% of output) + T3 (~20%; the active hormone at TR-α/β). Peripheral conversion of T4 → T3 by deiodinases (D1 liver/kidney, D2 brain/pituitary, D3 inactivator). Negative feedback: T3 (intracellular pituitary) suppresses TSH. Therapeutic Rx: levothyroxine (T4) — long t½ (~7 d) allows daily dosing; liothyronine (T3) used selectively. Methimazole / PTU block thyroid peroxidase (organification step). Amiodarone disrupts thyroid status in 2-3 ways (iodine load + D1 inhibition + direct thyroiditis).',
    steps: [
      { from: 'trh', to: 'tsh', via: 'pituitary thyrotrophs' },
      { from: 'tsh', to: 'thyroxine', via: 'thyroid follicle TSH-R → thyroglobulin iodination → T4 + T3 secretion' },
      { from: 'thyroxine', to: 'triiodothyronine', via: 'peripheral deiodinase D1 (liver/kidney) + D2 (brain/pituitary)' },
    ],
    modulators: [
      { slug: 'levothyroxine', effect: 'substrate', target: 'T4 replacement (most common indication: primary hypothyroidism)' },
      { slug: 'methimazole', effect: 'inhibitor', target: 'thyroid peroxidase (organification step)' },
      { slug: 'amiodarone', effect: 'inhibitor', target: 'D1 deiodinase + iodine load (complex thyroid effects)' },
    ],
    refs: [],
  },
];

function main(): void {
  const existing = JSON.parse(readFileSync(PATHWAYS_PATH, 'utf-8'));
  const bySlug = new Map(existing.map((p: { slug: string }) => [p.slug, p]));

  let added = 0;
  for (const p of NEW_PATHWAYS) {
    if (bySlug.has(p.slug)) {
      console.log(`  [skip] ${p.slug} already exists`);
    } else {
      existing.push(p);
      added++;
      console.log(`  [add ] ${p.slug.padEnd(28)} (${p.steps.length} steps · ${p.modulators?.length ?? 0} modulators)`);
    }
  }

  existing.sort((a: { slug: string }, b: { slug: string }) => a.slug.localeCompare(b.slug));

  writeFileSync(PATHWAYS_PATH, JSON.stringify(existing, null, 2) + '\n');
  console.log(`\nWave 5a batch 2 (v1.2): +${added} pathways → ${existing.length} total.`);
}

main();
