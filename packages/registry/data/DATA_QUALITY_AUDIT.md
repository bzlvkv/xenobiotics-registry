# Data-quality audit — registry + foods (complete)

**Optimized for:** VERIFIABILITY (every value sourced to a primary, verbatim citation) + COMPLETENESS (genuine unvisited gaps).
**Method:** all 1,592 authored value↔citation pairs checked against pre-fetched PubMed abstracts (1,148 unique PMIDs, 0 dead) for verbatim-match + primary-source; every flag adversarially re-checked (refute-default, run in bounded batches). Completeness + food classification by dedicated agents. Catalog: 1,231 compounds · 230 pathways · 4,487 foods.

---

## 1. Executive summary

Structural discipline is excellent (lint 0 errors; 0 dead PMIDs). On faithfulness, **47% of values are verbatim-confirmed**, 37% plausible-but-not-verbatim, and **216 confirmed problems** survived adversarial re-check (256 raw flags → 216 confirmed / 40 cleared). The problems are concentrated and the patterns are systematic: **(a)** PK params cited to cardiovascular *outcomes* trials that carry no PK (FOURIER/FIELD/VA-HIT), **(b)** receptor values that are GtoPdb/IUPHAR aggregates cited to comparator papers, **(c)** clean numeric mismatches the abstract actually states correctly. Completeness is in good shape: of 143 candidate gaps, **96 are correctly out-of-model / not-a-gap** — only 37 are real fills. Foods carry the largest raw debt: **2,198 / 4,487 unre-derivable** + dozens of templated-panel misattributions.

**5 high-severity already fixed** (ala, ashwagandha, testosterone-cypionate, tolterodine, vortioxetine); gate green.

---

## 2. Verifiability — citation faithfulness

| Layer | n | verbatim-confirmed | low-risk unconfirmable | confirmed problems |
|---|--:|--:|--:|--:|
| interaction | 170 | 126 (74%) | 41 | 3 |
| occupancy | 327 | 160 (49%) | 82 | 62 |
| pk | 869 | 415 (48%) | 305 | 136 |
| keo | 226 | 51 (23%) | 156 | 10 |
| **TOTAL** | **1592** | **752 (47%)** | 584 | **211 (+5 fixed)** |

**Confirmed problems by type:** secondary_citation 84 · abstract_silent 65 · wrong_compound 15 · mismatch 47.
**By layer:** occupancy 62 · interaction 3 · keo 10 · pk 136.

### 2a. HIGH severity (23)
| slug | field | verdict | reason |
|---|---|---|---|
| `bicalutamide` | receptor_occupancy[0] | secondary_citation | Cited paper is the enzalutamide (MDV3100/RD162) discovery paper; bicalutamide appears only as a comparator and the 159 nM Ki is from a figure legend,  |
| `tiotropium` | receptor_occupancy[0] | secondary_citation | Cited abstract is about aclidinium bromide discovery and never mentions tiotropium; the M3 Ki 0.050 nM is GtoPdb-curated, and the note misdescribes th |
| `zolmitriptan` | receptor_occupancy[0] | secondary_citation | Paper is a binding study of ELETRIPTAN; zolmitriptan appears only as a comparator and no zolmitriptan Ki/KD is reported. |
| `bempedoic-acid` | pk.PO | abstract_silent | Cited paper is the CLEAR Outcomes cardiovascular endpoint trial; abstract reports MACE incidence/hazard ratios only and contains NO PK parameters (hal |
| `beta-carotene` | pk.PO | abstract_silent | Cited paper is a vitamin A absorption/storage review (Sub-cellular Biochemistry) about hepatic stellate cells and RBP4; abstract gives no beta-caroten |
| `dronabinol` | pk.PO | mismatch | Abstract gives THC (dronabinol) half-life 2.75 h; stored 25 h is ~9x higher (terminal redistribution value absent from this paper). |
| `epinephrine` | pk.IV | abstract_silent | Cited paper is an unrelated surgical case report; abstract never mentions epinephrine or any PK parameter. |
| `evolocumab` | pk.SC | abstract_silent | Cited paper is the FOURIER cardiovascular outcomes trial, not a PK study; abstract carries no PK parameters (half-life, V, F) for evolocumab. |
| `fenofibrate` | pk.PO | abstract_silent | Cited paper is the FIELD cardiovascular outcomes trial (Lancet 2005); abstract reports only CV event outcomes/hazard ratios, no PK parameters. |
| `fisetin` | pk.PO | secondary_citation | Cited paper is a broad polyphenol bioavailability review; fisetin is not its subject and is not named in the abstract, so none of the stored fisetin-s |
| `hydroxyzine` | pk.PO | mismatch | Abstract states the elimination half-life is ~3 hr, but the stored half-life is 20 hr (~7x higher). |
| `morphine` | pk.PO | secondary_citation | Cited paper is a review of the metabolite morphine-6-glucuronide (M6G), not a primary morphine PK study; abstract contains no morphine V/F/t1/2 values |
| `morphine` | pk.IV | secondary_citation | Same M6G review cited for morphine IV PK; the abstract reports no morphine Vd or half-life, only a discussion of the M6G metabolite. |
| `naringenin` | pk.PO | secondary_citation | Cited paper is a broad polyphenol bioavailability review, not a primary naringenin PK study; naringenin is not named and no naringenin-specific F/V/t1 |
| `paraxanthine` | pk.PO | wrong_compound | Cited PMID is an ophthalmology paper, not a paraxanthine PK study; abstract has nothing about paraxanthine. |
| `piperine` | pk.PO | secondary_citation | Paper measures CURCUMIN pharmacokinetics; piperine is only the co-administered glucuronidation-inhibitor/bioavailability enhancer, not the analyte. No |
| `quinapril` | pk.PO | mismatch | Stored half-life 25h but abstract explicitly reports quinapril t1/2 = 1.2h (quinaprilat 1.8-1.9h); no 25h value appears (~20x off). |
| `rituximab` | pk.IV | wrong_compound | Cited PMID is an unrelated paper about eosinophilic esophagitis phenotypes; it contains no rituximab and no PK data (V=3.1, half-life=528h unsupported |
| `silybin` | pk.PO | wrong_compound | Cited PMID is a physical-chemistry fluorescence paper unrelated to silybin or any pharmacokinetics. |
| `silybin` | pk.IV | wrong_compound | Same mis-cited physical-chemistry paper (N-phenylpyrrole ICT fluorescence); no silybin content. |
| `sulbutiamine` | pk.PO | secondary_citation | Paper is a benfotiamine pharmacology study in mice; sulbutiamine is only a passing comparator with no PK values reported. |
| `teriparatide` | pk.SC | abstract_silent | Cited paper is the Neer NEJM fracture-efficacy trial; abstract contains zero PK (no half-life, Vd, F, or ka). |
| `vinpocetine` | pk.PO | mismatch | Cited abstract states oral bioavailability 56.6% and T1/2-beta 4.83 h, but the entry stores F=0.07 (7%, ~8x lower) and half-life 3 h; both contradict  |

### 2b. MEDIUM severity (143) — first 40
| slug | field | verdict | reason |
|---|---|---|---|
| `acetazolamide` | receptor_occupancy[0] | secondary_citation | Value (12.0 nM hCA II → 0.002667 mg/L) converts correctly and is in the abstract, but acetazolamide is only the reference STANDARD; the paper's subjec |
| `alfentanil` | receptor_occupancy[0] | secondary_citation | EC50 20.1 nM → 0.008372 mg/L converts correctly and is verbatim, but the paper characterizes remifentanil (GI 87084B); alfentanil is only a comparator |
| `aripiprazole` | receptor_occupancy[4] | secondary_citation | Cited paper is about NEW sulfonamide analogs of aripiprazole; aripiprazole is only a comparator and the abstract gives no D2 Ki for it. |
| `baclofen` | receptor_occupancy[0] | secondary_citation | Paper's subjects are baclofen homologues; baclofen is the reference parent and its EC50 is admittedly from full text, not the abstract (which only quo |
| `budesonide` | receptor_occupancy[0] | secondary_citation | Cited paper is a novel-ICS (clinical candidate 15) discovery paper; budesonide is not named in the abstract and no GR EC50/pEC50 is stated; stored val |
| `celecoxib` | receptor_occupancy[0] | secondary_citation | Value is correct and verbatim in the abstract, but the cited paper is a valdecoxib characterization study where celecoxib is only a benchmark comparat |
| `chlorpheniramine` | receptor_occupancy[0] | secondary_citation | Paper is about novel phthalazinone H1/H3 antagonists; chlorpheniramine is at best a comparator and the abstract never names it or the 7 nM value (valu |
| `clozapine` | receptor_occupancy[3] | secondary_citation | Cited paper studies serotonin-receptor ligands at alpha1 subtypes; clozapine is not a subject and is not mentioned in the abstract (proper primary wou |
| `duloxetine` | receptor_occupancy[1] | secondary_citation | Cited paper is a med-chem study of novel 4-phenyl tetrahydroisoquinolines; duloxetine is not its subject and the value is GtoPdb-curated, absent from  |
| `fluoxetine` | receptor_occupancy[0] | secondary_citation | Cited paper is a review/opinion piece about paroxetine; fluoxetine's 0.81 nM SERT value comes from a compiled comparison table (Table 1), not a primar |
| `fluvoxamine` | receptor_occupancy[0] | secondary_citation | Cited paper is a paroxetine review; fluvoxamine SERT 0.79 nM is at most a Table-1 comparator, not the paper's subject, and is absent from the abstract |
| `fulvestrant` | receptor_occupancy[0] | secondary_citation | Cited paper is a novel phenanthrene ER-ligand design study; fulvestrant is not a subject and pKi 8.98 / 1.05 nM is absent from the abstract. |
| `hydroxyzine` | receptor_occupancy[0] | secondary_citation | Cited paper is a primary study of cetirizine/levocetirizine H1 binding; hydroxyzine is not its subject and is never mentioned in the abstract. The 1.9 |
| `ipratropium` | receptor_occupancy[0] | abstract_silent | Cited M3-kinetics methods paper never names ipratropium or any 0.28 nM Ki in its abstract; the stored value is a GtoPdb midpoint (pKi 9.3-9.8 across 3 |
| `ixekizumab` | receptor_occupancy[0] | abstract_silent | Note asserts an 'abstract verbatim' KD of 1.8 pM/0.8 pM, but the abstract states only qualitative 'high affinity' with no numeric KD. |
| `labetalol` | receptor_occupancy[1] | secondary_citation | Cited paper studies 62 alpha-AGONISTS; labetalol is an alpha1-ANTAGONIST and is not a subject nor mentioned, so the abstract carries no labetalol alph |
| `lamotrigine` | receptor_occupancy[0] | secondary_citation | Value (185 uM) is abstract-verbatim and converts correctly, but the paper's subject is PNU-151774E; lamotrigine appears only as a comparator (note its |
| `lorazepam` | receptor_occupancy[0] | secondary_citation | Value (~5 nM) is abstract-verbatim but lorazepam is only a reference comparator in a paper whose subject is beta-carboline-3-carboxylate endogenous li |
| `losartan` | receptor_occupancy[0] | secondary_citation | Value (54 nM) is abstract-verbatim and converts correctly, but the paper's subject is L-158,809; losartan (DuP-753) is only a comparator reference dru |
| `melatonin` | receptor_occupancy[0] | abstract_silent | Cited paper is a melatonin PK systematic review with no receptor-binding data; cannot support an MT1 affinity EC50. |
| `melatonin` | receptor_occupancy[1] | abstract_silent | Same PK review; no MT2 receptor-affinity figure present in abstract. |
| `methylphenidate` | receptor_occupancy[0] | secondary_citation | Paper is about MPH analogues; methylphenidate is only the parent/comparator and the 61 nM value is a GtoPdb cross-paper geometric mean, not in this ab |
| `methylphenidate` | receptor_occupancy[1] | secondary_citation | Same MPH-analogues paper; MPH is comparator only and NET Ki 474 nM is a GtoPdb compilation absent from the abstract. |
| `metoclopramide` | receptor_occupancy[1] | abstract_silent | Cited abstract is a generic 5-HT3A vs 3A/3B profile comparison with no numeric values and no mention of metoclopramide; value is GtoPdb-curated. |
| `mifepristone` | receptor_occupancy[1] | secondary_citation | Cited paper is about nonsteroidal chromenoquinoline PR modulators; steroidal mifepristone is not a subject and is not mentioned, and Ki 1.1 nM is abse |
| `mirtazapine` | receptor_occupancy[1] | secondary_citation | Cited paper is a med-chem discovery of NEW tetracyclic derivatives; mirtazapine is only a comparator (per note), not the subject, and the abstract nam |
| `mirtazapine` | receptor_occupancy[2] | secondary_citation | Same discovery paper about novel compounds; mirtazapine is a comparator, not the subject, and abstract states no 5-HT2C Ki. |
| `modafinil` | receptor_occupancy[0] | abstract_silent | Cited paper is an in vivo PET occupancy study reporting % binding-potential changes, not a binding EC50/Ki; no value convertible to 0.55 mg/L appears  |
| `nalbuphine` | receptor_occupancy[2] | secondary_citation | Synthesis paper for NEW opioid ligands; nalbuphine is the parent scaffold being chemically modified, not the subject, and the abstract gives no numeri |
| `nivolumab` | receptor_occupancy[0] | abstract_silent | Note claims a verbatim KD figure (3186 pM for nivolumab/MDX-1106) that does not appear anywhere in the abstract; nivolumab is only a comparator in a s |
| `ondansetron` | receptor_occupancy[0] | secondary_citation | Cited paper's subject is palonosetron; ondansetron is only a reference comparator and is not even mentioned in the abstract. Value lifted from full-te |
| `oxybutynin` | receptor_occupancy[0] | secondary_citation | Cited paper is about novel 1,4-dioxane M3 antagonists; oxybutynin is only a reference standard (GtoPdb-curated value), not a subject, and is absent fr |
| `pembrolizumab` | receptor_occupancy[0] | secondary_citation | Cited paper's subject is sintilimab; pembrolizumab is a passing comparator and its KD is not in the abstract despite the note claiming 'verbatim'. |
| `quetiapine` | receptor_occupancy[0] | secondary_citation | Cited paper is a literature review, not a primary source, and the D2 Ki/pKi is absent from the abstract (GtoPdb-aggregated value). |
| `retatrutide` | receptor_occupancy[0] | abstract_silent | Correct primary discovery paper for LY3437943=retatrutide, but abstract gives only qualitative receptor activity; no EC50/affinity number to support t |
| `retatrutide` | receptor_occupancy[1] | abstract_silent | Abstract states GIPR is the most potent activity qualitatively but provides no EC50 figure; stored GIPR EC50 is unverifiable from the cited abstract. |
| `retatrutide` | receptor_occupancy[2] | abstract_silent | GCGR potency stated only qualitatively; abstract contains no quantitative EC50 to support the stored value. |
| `risperidone` | receptor_occupancy[1] | secondary_citation | Cited PMID is a qualitative narrative review, not a primary binding study; abstract contains no D2 Ki — the 0.44 nM value was GtoPdb-curated, not meas |
| `secukinumab` | receptor_occupancy[0] | secondary_citation | Cited paper is a bimekizumab discovery paper (496.g3); secukinumab appears only as a commercial comparator and its 129 pM KD is not stated in the abst |
| `sertraline` | receptor_occupancy[0] | secondary_citation | Cited paper is a paroxetine review article; sertraline is not the subject and its 0.29 nM SERT value comes from a compiled Table 1, not a primary bind |

…and 103 more medium (see confirmed-all.json).

### 2c. LOW severity (45)
`caffeine`, `morphine`, `olanzapine`, `yohimbine`, `adalimumab`, `diphenhydramine`, `etanercept`, `infliximab`, `metoclopramide`, `pembrolizumab`, `secukinumab`, `tiotropium`, `adalimumab`, `agomelatine`, `apixaban`, `astaxanthin`, `butorphanol`, `calcium`, `cbd`, `carnosine`, `centrophenoxine`, `degarelix`, `dipyridamole`, `dsip`, `fentanyl`, `galantamine`, `glimepiride`, `granisetron`, `liraglutide`, `lixisenatide`, `methylene-blue`, `methylene-blue`, `mixed-amphetamine-salts`, `nimodipine`, `noopept`, `procyanidin-b2`, `quinidine`, `quinidine`, `riociguat`, `sumatriptan`, `trimethoprim`, `trimethoprim`, `vasopressin`, `verapamil`, `zonisamide`

---

## 3. Completeness — 143 candidates triaged

Discipline check: **55 out-of-model · 35 not-a-gap · 6 local-acting · 4 mixture** were correctly excluded. **37 genuine fills + 6 need a pk_unauthored marker.**

### 3a. Genuine fills + needs-citation (37), by priority
| slug | classification | priority | rationale |
|---|---|---|---|
| `heroin` | genuine-fill | high | Diacetylmorphine; note says 'Plasma t1/2 deferred'. The prodrug note correctly routes mu-opioid OCCUPANCY (PD layer) to morphine/6-MAM, but  |
| `phenelzine` | needs-citation | high | The only true citation gap of the six. Active prescribed irreversible non-selective MAOI with AUTHORED, load-bearing PK: half_life_hr.PO=11. |
| `oxycodone` | needs-citation | high | Genuine MOR agonist where the Hill model DOES fit (keo authored), so this is a real fillable gap — not a misfit. Blocked only because the ex |
| `7-hydroxymitragynine` | genuine-fill | high | Active μ-opioid partial agonist; has PK + mw_g_mol (414.5). MOR agonism fits the Hill occupancy model and is a load-bearing safety claim for |
| `ipamorelin` | genuine-fill | high | Selective GHSR-1a (ghrelin receptor) agonist — the flagship clean GH-secretagogue peptide in the biohacker/TRT audience. PK authored (F, V,  |
| `lsd` | genuine-fill | high | Potent 5-HT2A agonist; mechanism already cites Ki ~3.5 nM. 5-HT2A agonism is in-model (psilocin authored with 5-HT2A occupancy). Flagship, a |
| `clenbuterol` | genuine-fill | high | Selective β2-adrenoceptor (ADRB2) agonist, clean Gs/cAMP mechanism — directly fits the agonist Emax/Hill model, with strong same-target prec |
| `edoxaban` | genuine-fill | medium | Reversible, competitive direct FXa inhibitor (DU-176b) with PK authored. FXa is a soluble serine protease, but reversible competitive enzyme |
| `ghrp-2` | genuine-fill | medium | GHSR-1a (ghrelin receptor) GPCR agonist with PK authored (F, t1/2) but no keo/occupancy. In-model agonist; fillable once a verbatim GHSR EC5 |
| `ghrp-6` | genuine-fill | medium | First-gen GHSR-1a GPCR agonist with PK authored; in-model agonist lacking keo+occupancy. Fillable with a GHSR EC50/Ki + keo approximation. |
| `gonadorelin` | genuine-fill | medium | Native GnRH decapeptide, GnRH-R GPCR agonist with PK authored; commonly used in TRT protocols (core Tier-1 audience). Fractional GnRH-R occu |
| `hexarelin` | genuine-fill | medium | Most potent GHSR-1a GPCR agonist among the GHRPs (also binds CD36). In-model agonist lacking keo+occupancy; fillable with a GHSR EC50/Ki + k |
| `huperzine-a` | genuine-fill | medium | Reversible acetylcholinesterase inhibitor (Ki ~25 nM cited in mechanism) with PK authored. AChE is in-model in this registry (donepezil/gala |
| `igf-1-lr3` | genuine-fill | medium | IGF-1 analog acting as an IGF-1R agonist (its defining LR3/Arg3 modifications reduce IGFBP binding, raising free bioactive IGF-1). IGF-1R is |
| `lanreotide` | genuine-fill | medium | Cyclic octapeptide somatostatin analog, SSTR2 + SSTR5 GPCR agonist with PK authored. In-model agonist. Octreotide (same class, same receptor |
| `lixisenatide` | genuine-fill | medium | GLP-1R agonist (exenatide backbone). GLP-1R peptide-GPCR agonism is in-model — exenatide is already authored with a verbatim GLP-1R Ki (Sche |
| `meclizine` | needs-citation | medium | First-gen H1 antagonist (+ mild antimuscarinic). H1-antagonist binding occupancy IS in-model here (cetirizine/desloratadine/promethazine aut |
| `mirabegron` | genuine-fill | medium | β3-adrenergic receptor AGONIST — a clean GPCR-agonist fit for the Hill-occupancy model. Has pk, not in AUTHORING_GAPS, and a verbatim β3 EC5 |
| `niacin` | genuine-fill | medium | At pharmacologic doses activates the HCA2/GPR109A GPCR on adipocytes (agonist) — clearly in-model, and the verbatim EC50 is well-documented  |
| `phenibut` | needs-citation | medium | Primarily a GABA-B receptor agonist (GPCR agonist, in-model) with secondary voltage-gated Ca²⁺ channel inhibition (out-of-model). Popular gr |
| `pramlintide` | genuine-fill | medium | Amylin analog activating AMY receptors (calcitonin receptor + RAMP1/2/3) — a peptide-GPCR agonist, in-model and analogous to the authored GL |
| `prochlorperazine` | needs-citation | medium | Phenothiazine D2 antagonist. D2-antagonist binding occupancy IS in-model here (haloperidol authored with a D2 Kd). Common antiemetic/migrain |
| `sermorelin` | genuine-fill | medium | GHRHR is in the catalog; sermorelin is a clean GHRH-fragment GPCR agonist (cAMP→GH). Class-B peptide agonist like the authored GLP-1R/GCGR r |
| `sodium-oxybate` | genuine-fill | medium | GHB salt acting as a GABA-B (and GHB-receptor) agonist. GABA-B is in the catalog and already authored (gaba_b x1, baclofen-style). Reversibl |
| `tasimelteon` | genuine-fill | medium | MT1/MT2 (MTNR1A/MTNR1B) dual agonist; both are in the catalog and already authored (mt1 x2, mt2 x2), so there is direct same-target preceden |
| `galactose` | genuine-fill | low | Single aldohexose monosaccharide, NOT a mixture (its disaccharide neighbors sucrose/lactose/maltose/trehalose all carry pk_unauthored:mixtur |
| `trestolone` | genuine-fill | low | 7a-methyl-19-nortestosterone (MENT), IM acetate depot. Exception to the AAS skip pattern: unlike the others it was developed as a male hormo |
| `brompheniramine` | genuine-fill | low | First-gen H1 antagonist with PK + mw_g_mol; fits the authored antihistamine-occupancy convention (cetirizine/desloratadine/promethazine). Ge |
| `calcitonin` | genuine-fill | low | Peptide agonist at the calcitonin receptor (GPCR) — modelable like the authored GLP-1 peptides. Has PK (SC) but no mw_g_mol, which the ec50  |
| `goserelin` | genuine-fill | low | GnRH/LHRH superagonist depot, GPCR agonist — occupancy computable from agonist affinity (in-model). Lower priority: oncology depot whose the |
| `orphenadrine` | needs-citation | low | Polypharmacology: muscarinic antagonist + NET inhibitor (both in-model as binding occupancy, like the registry's antimuscarinics/NRIs) plus  |
| `pyridostigmine` | genuine-fill | low | Reversible peripheral AChE inhibitor — its target is the AChE enzyme (mech also notes nicotinic desensitization, but the binding target is A |
| `rituximab` | genuine-fill | low | Anti-CD20 IgG1 mAb. mAb 'immune'-class occupancy IS modeled (13 authored rows: adalimumab→tnf_alpha, pembrolizumab/nivolumab→pd_1, omalizuma |
| `secretin` | genuine-fill | low | SCTR (secretin receptor) is in the GPCR catalog; secretin is a Gs-coupled class-B peptide agonist, same family as GLP-1R/GCGR/GIPR which are |
| `somatostatin` | genuine-fill | low | SSTR1-5 are all in the catalog; somatostatin is a (multi-subtype) GPCR agonist. Inhibitory agonist still occupies — occupancy is fractional  |
| `withanolide-a` | needs-citation | low | Mechanism is primarily neurotrophic (BDNF/CREB) but it 'modulates GABA-A receptors' — and gaba_a/gaba_a_bzd ARE in-model (benzodiazepine-sit |
| `zileuton` | genuine-fill | low | Reversible 5-lipoxygenase (ALOX5) inhibitor. The CysLT1 mention in the mech is the DOWNSTREAM receptor, not zileuton's target — its actual t |

### 3b. Anabolic-steroid cluster → needs pk_unauthored marker (6)
`oxymetholone`, `methenolone`, `turinabol`, `methasterone`, `mesterolone`, `mibolerone` — PK-eligible but no abstract-verifiable plasma t½ (same paywall pattern as the documented anabolic skips). Mark, don't fabricate.

---

## 4. Foods

Provenance: **2,198 / 4,487 unre-derivable** (no fdc_id/url/ref). Worst: supplement 435/439 (100%), fast_food 706.

### 4a. Templated-panel misattributions — HIGH (14)
- **whey-amino-panel shared by 13 brands (animal-whey...xwerks-grow)** — 13 distinct whey brands carry a byte-identical 9-amino-acid panel (leucine 2.63 g, isoleucine 1.5 g, ... histidine 450 mg) despite serving sizes rangi → Re-extract per-SKU amino panels from each brand's actual label/COA (or USDA); do not reuse a single whey profile. Verify
- **whey/blend amino panel shared by 7 brands (1st-phorm... rule-one-r1)** — 7 different whey/blend brands share an identical amino panel (leucine 2.52 g ... histidine 432 mg) while servings span 33 g to 47 g (2 scoops). Same t → Re-extract per-SKU from each brand's label; values must differ with each product's serving size and amino composition.
- **casein/RTD amino panel shared by 5 SKUs (ascent-micellar-casein... transparent-labs-casein)** — Three casein powders (35-36 g scoops) and two milk-protein RTD shakes (Ghost 414 mL/25 g, Muscle Milk 325 mL/25 g) all carry an identical amino panel. → Separate casein-powder vs RTD-shake extraction; pull each SKU's real per-serving aminos.
- **plant-protein amino panel shared by 4 SKUs (kos... vega-protein-and-greens)** — KOS (43 g/2 scoops), Orgain RTD (11 oz/20 g protein), Vega One (41 g), and Vega Protein&Greens (33 g) share a byte-identical plant amino panel across  → Re-extract per-SKU; plant-protein amino profiles vary by pea/rice/hemp blend and serving — do not share one panel.
- **plant-protein amino panel shared by 4 SKUs (nuzest... truvani)** — Nuzest (25 g/2 scoops), OWYN RTD (12 oz/20 g), Ritual (32 g), Truvani (30 g) share an identical amino panel despite different serving sizes and protei → Re-extract per-SKU from each brand's label.
- **electrolyte mineral panel templated across aloe juice + lemonade + powder + vodka seltzer** — lily-of-the-desert-aloe-vera-juice (8 fl oz), gnarly-nutrition-lemon-lime (1 scoop ~13 g powder), lakewood-organic-lemonade (8 fl oz), and nutrl-vodka → Re-extract per-SKU. The Gnarly electrolyte-powder panel was templated onto unrelated beverages — pull each product's act
- **electrolyte mineral panel templated across teas + electrolyte tablet (yogi-bedtime... stash-peppermint)** — Yogi Bedtime Tea (1 bag brewed), Luzianne unsweetened iced tea (8 fl oz), Stash peppermint tea (1 bag) and a Hammer Nutrition electrolyte tablet all s → Re-extract per-SKU; brewed teas should reflect near-zero added minerals, electrolyte tablet pulled from its own label.
- **electrolyte mineral panel templated across sodas + electrolyte dropper (cheerwine, vernors, diet-rite + elete)** — Cheerwine, Vernors Ginger Ale and Diet Rite (each 12 fl oz soda) plus an Elete electrolyte dropper (~3.5 mL) all carry identical sodium 125 / potassiu → Re-extract per-SKU; sodas should show only their actual (mostly sodium) content.
- **electrolyte mineral panel templated across teas + electrolyte powder (spindrift, halfday, owls-brew + now-foods)** — Spindrift half-tea/lemonade, Halfday iced tea, Owl's Brew sparkling tea (each 12 fl oz) and a NOW Foods electrolyte powder (1 scoop ~6 g) share identi → Re-extract per-SKU from each beverage's and the powder's own label.
- **electrolyte panel templated across Hansen's soda + 2 Electrolit drinks** — Hansen's Black Cherry (12 fl oz cane-sugar soda) shares an identical panel (sodium 430 / potassium 490 / magnesium 30 / calcium 50 mg, sucrose 31 g) w → Re-extract Hansen's from its own label; the two Electrolit flavors may legitimately share but should be verified per-fla
- **identical 38-compound fatty-acid panel on In-N-Out Animal Fries + Wendy's Baconator Fries** — Two different loaded-fries products from different chains share a byte-identical 38-compound panel (butyric, gondoic, erucic acid, etc.) AND an identi → Re-extract each item per-chain from its own nutrition data; the shared 255 g serving is itself a smell to recheck.
- **fast_food — 706 zero-provenance rows (kind:'label', no fdc_id/source_url)** — fast_food is the catalog's dominant, highest-frequency category (2164 rows, 48% of all presets) and contributes the single largest unre-derivable buck → Backfill per-chain, not per-row — cheapest lever in the catalog. For each chain, fetch its public nutrition PDF/site onc
- **supplement — all 439 rows unre-derivable (0 fdc_id, 0 source_url)** — Supplements are 100% unre-derivable (439/439 carry only kind:'label' with no source) and are core, high-frequency logs for this app's biohacker/TRT pe → Adopt NIH's Dietary Supplement Label Database (DSLD) as the supplement analog of FDC — it has stable DSLD IDs, archived 
- **Branded packaged drinks — soda(94)+sports_drink(54)+electrolyte(78)+coffee_tea(121)+juice(68)+protein(105)+alcohol(128) ≈ 648 none rows** — These are high-frequency consumer logs that are unre-derivable, but unlike supplements they ARE packaged goods with a GTIN/UPC and so are largely pres → Re-run the existing value-match harness (scripts/authoring/2026-06-22-recover-wholefood-provenance.ts) pointed at FDC da

### 4b. Provenance backfill priority
- **electrolyte panel templated across Hansen's soda + 2 Electrolit drinks** (high) — Re-extract Hansen's from its own label; the two Electrolit flavors may legitimately share but should be verified per-flavor.
- **fast_food — 706 zero-provenance rows (kind:'label', no fdc_id/source_url)** (high) — Backfill per-chain, not per-row — cheapest lever in the catalog. For each chain, fetch its public nutrition PDF/site once and attach a source_url to every bare 
- **supplement — all 439 rows unre-derivable (0 fdc_id, 0 source_url)** (high) — Adopt NIH's Dietary Supplement Label Database (DSLD) as the supplement analog of FDC — it has stable DSLD IDs, archived label PDFs, and structured per-ingredien
- **Branded packaged drinks — soda(94)+sports_drink(54)+electrolyte(78)+coffee_tea(121)+juice(68)+protein(105)+alcohol(128) ≈ 648 none rows** (high) — Re-run the existing value-match harness (scripts/authoring/2026-06-22-recover-wholefood-provenance.ts) pointed at FDC dataType 'Branded' instead of SR Legacy/Fo
- **fast_food — 904 aggregator-only URLs (fastfoodnutrition.org 515 + myfooddiary.com 371)** (medium) — Upgrade aggregator URLs to the chain's official nutrition PDF wherever one exists (most major chains already have an official domain cited on sibling rows — reu
- **Whole-food + generic residue — dairy(70)+grain(59)+snack(115)+condiment(73)+other(41)+meat_seafood(37)+produce(21)** (medium) — Re-run the SAME harness with three cheap fixes: (1) add the Survey (FNDDS) dataType to the PREFER list as a fallback (FNDDS covers prepared/mixed dishes SR Lega
- **Provenance schema + verify gate — authority tiering, dsld_id field, placeholder/manual cleanup** (low) — Harden the gate so backfill progress is measurable and doesn't regress: (1) add a source.authority enum (primary = fdc|dsld|official-brand-PDF, secondary = aggr

---

## 5. Recommended remediation order

1. **Quick wins — mismatch + wrong_compound (62)**: the abstract states the correct value → just correct the stored number (e.g. fentanyl t½ 16h, glimepiride 8.2h, haloperidol ~30h, galantamine 5.68h). Highest signal-to-effort.
2. **needs-citation (7)**: values exist + are sound but carry no source — add the citation (phenelzine/oxycodone PK from label; etc.).
3. **abstract_silent PK on outcomes-trials (65)**: re-source each to a real PK study, or remove + log if table-only.
4. **secondary_citation re-source (84)**: GtoPdb-aggregate occupancy/PK values cited to comparator papers → hunt a primary stating the value verbatim, adopt that value; remove + log the table-only ones (AUTHORING_GAPS-style).
5. **Completeness fills (37)**: high-priority first (heroin, 7-hydroxymitragynine, ipamorelin, lsd, clenbuterol, oxycodone/phenelzine citations). Add the 6 anabolic pk_unauthored markers.
6. **Foods**: fix the 14 high-severity templated-panel misattributions (re-extract per-SKU), then the provenance backfill (FDC-derivable generics first, supplements need labels).

*Provenance: read pre-fetched abstracts for 1,148 PMIDs (0 dead); judged all 1,592 value↔citation pairs offline; all 256 flags adversarially re-checked (refute-default) → 216 confirmed / 40 cleared. Completeness + foods classified by dedicated agents. 2026-06-28.*
