# GAPS — the skip ledger

**A row in this file is a recorded decision, not a defect.** Each one is a cell that was
investigated and deliberately left empty: the value could not be stated verbatim by any verifiable
source, or the mechanism does not fit the model, or the number exists only in a paywalled table. The
row names the PMIDs that were chased and why each failed. That trail is a deliverable — the registry
is finished when there are no *unvisited* cells, not when every cell is filled.

**Read this file before any literature pass.** Grep it for your compound and your field first. If a
row is here, the search has already been done, and re-running it is the most expensive mistake an
authoring session can make. A row also names what would unlock the cell, so a blocker that has since
lifted is the cheapest work available.

The authoring rules this file is the by-product of are in [../authoring/HYGIENE.md](../authoring/HYGIENE.md);
the batch loop that produces these rows is in [../authoring/WORKFLOW.md](../authoring/WORKFLOW.md).

## Appending a row

Add a dated `##` section per batch, then one row per skipped cell. Table shape, in order:

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`slug`** | the exact field path, e.g. `pk.PO.V_L`, `receptor_occupancy[0].ec50_mg_l`, `half_life_hr.SC` | Every PMID chased, each with the reason it failed — *review, not primary* / *abstract states no value* / *value belongs to the comparator* / *rat, and no human data* / *range, not a point value*. Quote the sentence that decided it. | What would unlock it: full text of a named paper, a study design that does not yet exist, a schema field the model lacks, or "leave closed" with the reason. |

Write the matching state into the data as well as the row here. A skip that lives only in this file
leaves the record asserting a consumer default — see HYGIENE R5.

## A note on the filenames below

This ledger was written across many sessions against a repository layout that no longer exists.
**Assume every repository path named below is dead** — do not go looking for one, and do not
recreate it. Removed in the 2026-09-26 redesign: the `scripts/authoring/*.ts` apply-scripts; the
`DATA_QUALITY_AUDIT.md`, `DATA_QUALITY_BACKLOG.md`, `ROADMAP.md`, `PLAYBOOK.md`,
`VERIFICATION_PROMPT.md` and `FULLTEXT_QUEUE.md` companion documents; the `PDF_QUEUE` of paywalled
DOIs that several rows below cite by row number; the other one-off `scripts/` gates
(`data-lint.ts`, `audit-triage.mjs`, `normalize-receptor-keys.ts`); and the `@xeno/core` and
`@xeno/solver` packages, so a row naming `packages/core/src/types.ts`,
`packages/registry/src/loader.ts` or `packages/solver/src/*.ts` is naming the *old* code — the
types, schema, loader, queries and lint rules are all in `packages/registry/src/` now. The names
are kept in the prose because they identify *which batch* made a decision, which is part of the
record. Their dead link targets have been stripped. The rules and findings they carried are now in
[../authoring/HYGIENE.md](../authoring/HYGIENE.md).

---

# Authoring gaps — known and intentional

The registry is "complete to the limit of what can be authored with primary-source provenance under the no-fabrication rule." This file tracks specific edges and entries that have been investigated but skipped because the literature didn't yield a verbatim Ki / EC50 / induction factor in a verifiable PubMed abstract.

When you have full-text PDF access, these are good targets to pull primary numbers from and turn into authored entries.

## Catalog breadth wave — investigated, skipped (2026-06-20)

22 new compounds authored across four under-built classes (anabolics, cannabinoids, psychedelics, endocrine/research-stims) in scripts/authoring/2026-06-20-catalog-breadth-anabolics-cannabinoids-psychedelics.ts. Every compound landed as at least a verified stub (PubChem MW + mechanism + doses + systems); the fields below were investigated and skipped because no abstract named the value verbatim for the named compound.

### PK half-life — skipped

| Compound | Why skipped | Re-author target |
|---|---|---|
| **trenbolone** | No abstract names a trenbolone (or ester) plasma t½. PMID:12441365 gives AR binding + in-vivo effects, no t½. | A PO/IM crossover with sampling, or full-text. |
| **drostanolone** | Only urinary doping-control detection-window studies (PMID:26826321, 32386339) — detection window ≠ plasma t½. The "~2 day" figure traces only to Wikipedia. | Full-text plasma PK. |
| **methandrostenolone** | No primary abstract names a methandienone plasma t½ (esearch methandienone+PK+t½ → 0). "3–6 h" traces only to secondary pages. | Full-text. |
| **testosterone-propionate** | "~19 h" traces only to the Behre/Nieschlag review. Chased + rejected (wrong ester / no t½): PMID:1430080, 7543113, 2882010, 4010287, 7034161. | Primary TP crossover full-text. |
| **androstenedione** | Oral-andro abstracts (PMID:11502792) report serum AUC / urinary excretion only, no t½. | Full-text PK tables. |
| **enclomiphene** | Ghobadi 2009 (PMID:19033451) explicitly: t½ "could not be determined due to a very flat terminal half-life". 23875626, 25044085 = hormone data only. "~10 h" is full-text only. | Full-text isomer-specific PK. |
| **s23** | Jones 2009 (PMID:18772237) says only "favorable pharmacokinetic properties"; 20967890, 12604714 give no t½. Vendor "11.9 h"/"24–36 h" disagree. | A real S-23 PK study (likely none exists). |
| **2c-b** (human) | Only verbatim t½ is RAT/SC 1.1 h (PMID:18339493, which states human PK "is unknown"); 37253161 gives effect duration not t½. | Human 2C-B PK crossover. |

### Receptor occupancy — skipped

| Compound | Receptor | Why skipped |
|---|---|---|
| **nandrolone, boldenone, drostanolone, methandrostenolone, androstenedione, testosterone-propionate** | androgen_receptor | No verbatim absolute AR Ki/Kd (nM) in any abstract — RBA-only or paraphrase (PMID:6539197 RBA panel, 11252818 "similar to DHT", 4021486, 3865479). AR Ki for these live in paywalled tables. (testosterone-propionate's AR affinity belongs to released free testosterone anyway.) |
| **thcv** | CB1 | The only verbatim Δ9-THCV CB1 Ki (46.6 nM, Pertwee 2007 PMID:17245367) characterizes it as a CB1 **antagonist** in vivo — the agonist Hill-occupancy model (emax in (0,1]) can't carry an antagonist. Would need a dedicated antagonist model. |
| **delta-8-thc** | CB1/CB2 | Every verbatim Δ8 Ki located belongs to synthetic dimethyl/1-deoxy analogs; the parent value is table-only (Compton 1993 PMID:8474008 "Ki < 10 nM" band only). |
| **hhc** | CB1/CB2 | The one direct parent-HHC receptor paper (PMID:40704858) is molecular-docking only (no Ki); all numeric values found are synthetic HHC derivatives. |
| **cbn** | CB1 | No verbatim CBN CB1 Ki: McPartland 2007 (PMID:17641667) excludes cannabinol; Rosenthaler 2014 (PMID:25311884) gives no CBN number; Compton 1993 table-only; Felder 1995 (PMID:7565624) qualitative. (CB2 Ki 96.3 nM **was** authored, PMID:8819477.) |
| **2c-b** | 5-HT2A | Per-compound Ki table-only: Rickli/Liechti 2015 (PMID:26318099) gives only aggregate "<1 µM" for the 2C series; Villalobos 2004 (PMID:15006903) gives a rank-order, no number. |
| **5-meo-dmt** | 5-HT2A | Canonical values (5-HT2A 907 nM, 5-HT1A 3 nM) are table-only (Halberstadt 2012 / Ray 2010); reviews (PMID:35149998, 38486047, 27216487) qualitative. 5-HT2A is also 5-MeO-DMT's weak target (5-HT1A primary). |
| **ibogaine** | 5-HT2A | Not a primary ibogaine target (NMDA / sigma / opioid are); no abstract names a numeric ibogaine 5-HT2A Ki. |
| **mitragynine** | mu/kappa/delta opioid | Famous MOR EC50 (~339 nM / Emax ~34%) and affinities are table/figure-only in every abstract (Kruegel 2016 PMID:27192616, Obeng 2020 PMID:31834797, Sharma 2020 PMID:33154449, …) — abstracts are qualitative ("partial agonists of the human µ-opioid receptor"). |
| **enclomiphene, raloxifene** | estrogen_receptor | The only verbatim value is a **functional antagonist** IC50 (Fitzpatrick 1999 PMID:10465261: enclomiphene 77 nM, raloxifene 1 nM, inhibiting estradiol-induced PR; "none of these compounds significantly stimulated PR when given alone"). SERMs are antagonists here — the agonist Emax/EC50 occupancy model can't carry them. |

Note: `keo` for the five authored occupancy rows (trenbolone, s23 AR; cbn CB2; psilocin 5-HT2A; tianeptine MOR/DOR) is a documented **approximation** flagged in each `effect_compartment.note` — no measured keo exists for any of them.

## Catalog breadth wave 2 — PK/receptor enrichment deferred (2026-06-20)

43 more compounds authored as verified STUBS (PubChem MW + mechanism + doses + systems) in scripts/authoring/2026-06-20-catalog-breadth-wave2-terps-recreational-rc.ts: 15 terpenes, 7 anabolic-steroid tail, 10 recreational/dissociatives, 11 research chemicals. The parallel literature-verification agents for the latter three groups were knocked out mid-run by an Anthropic API overload + session limit, so their PK half-lives and receptor Ki/EC50 are **deferred, not skipped** — the value likely exists in an abstract but hasn't been pulled+verified yet. Two flagship values were re-verified inline and authored (2026-06-20-wave2-enrichment.ts): **ghb** PK (t½ 30.4 min PO, PMID:15538955) and **mdpv** DAT/NET/SERT occupancy (Baumann 2013, PMID:23072836).

Good next-pass targets (high-confidence the abstract value exists): cocaine DAT/NET/SERT Ki + plasma t½; methamphetamine t½; pcp/methoxetamine NMDA IC50 (ketamine-style); salvinorin-a κ-opioid Ki (Roth 2002 and follow-ups); mephedrone/methylone release potency; alpha-pvp DAT/NET (companion to MDPV in Baumann 2013); 2c-e/2c-i/dom/bufotenin 5-HT2A Ki; harmine/harmaline MAO-A Ki (note only — enzyme inhibition, not a receptor-occupancy key); the anabolic-tail AR Ki are expected to mostly stay table-only (same paywall pattern as wave 1). Terpene receptor/PK is genuinely thin (TRP/GABA effects qualitative) — those 15 are expected to remain stubs.

## Interaction kinetics — investigated, skipped

| From → To | Why skipped | Re-author target (full-text) |
|---|---|---|
| **berberine → cyclosporine** | PMIDs 25145883, 24066602, 29806105 explicitly conclude berberine does NOT meaningfully inhibit CYP3A4 in HLM. The clinical interaction is more likely P-gp than CYP-driven. | Author as P-gp inhibition (separate `kinetics` extension would be needed) or leave as informational. |
| **colchicine → cyclosporine**<br>**cyclosporine → colchicine** | Bidirectional cyclosporine/colchicine effect is real clinically (P-gp + weak CYP3A4) but no abstract reports a clean Ki for either direction. | Pull Ki from full-text (e.g., Wessler 2013 review) or treat as P-gp-only. |
| **paroxetine → tamoxifen** (CYP2D6) | Paroxetine is universally cited as a potent CYP2D6 mechanism-based inactivator, but PMIDs 22372551, 30192434, 27590024 don't have a verbatim Ki/K_I in the abstract. | Pull from Bertelsen 2003 or Venkatakrishnan papers (full-text). |
| **tamoxifen → warfarin** (CYP2C9) | Norendoxifen (a metabolite, PMID 21814747) inhibits CYP2C9 with IC50 990 nM, but no Ki for parent tamoxifen on CYP2C9 in any abstract. | Author as the metabolite-driven mechanism; needs CYP2C9 metabolite-tracker which the solver doesn't yet model. |
| **caffeine ↔ theobromine** (CYP1A2) | Theobromine is consistently studied as a CYP1A2 substrate, never as an inhibitor with a published Ki/IC50. PMID 10215755 confirms it's a poor isoform-selective probe. | Real interaction is co-substrate competition, not classical Ki — would need a substrate-competition model the solver doesn't yet have. |
| **modafinil → ethinylestradiol** | PMID 11823757 reports a "much smaller decrease" in EE AUC than triazolam, and EE half-life "did not appear to be affected" — no verbatim numeric AUC change. | Pull AUC numbers from Robertson 2002 full-text (CPT 71:46–56). |

## CYP2D6 victim AUC ratios — investigated, skipped (Wave 2a v1.1 session 1, 2026-05-11)

23 candidate perpetrator → victim pairs investigated across 4 CYP2D6 perpetrators. Uniform structural pattern: numbers live in result tables, FDA package inserts, or in vitro Ki papers — almost never in PubMed-indexed abstracts. The 4 edges authored this session (quinidine→{DXM, propafenone, desipramine}, paroxetine→carvedilol) were the only pairs where an abstract carried the AUC ratio verbatim. Authored in scripts/authoring/2026-05-11-wave-2a-cyp2d6.ts.

### Quinidine victims — 4 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **quinidine → metoprolol** | 3709620 (Leemann 1986, no abstract indexed), 8405032, 10702886 (Bramer 1999 — urinary 4-OH-metoprolol/metoprolol MR "42-fold decrease", not AUC ratio), 21976621, 24025984, 16472104, 12124306, 11300370, 21812498, 28520381 (review) | No abstract-verbatim quinidine→metoprolol AUC ratio in humans. Numbers are in result tables of Leemann 1986. | Pull from Leemann 1986 *Eur J Clin Pharmacol* full-text. |
| **quinidine → codeine** | 10381807 (Caraco 1999), 8819499 (Caraco 1996), 8818573, 12006904 | Caraco abstracts give O-demethylation CL changes ("162.7 vs 17.0 ml/min") and "no morphine detected" but no codeine AUC ratio. Codeine itself's AUC barely changes; clinical effect is loss of morphine production. | Schema would need a "metabolite-formation-blocked" interaction type; pure AUC-ratio model doesn't capture the clinical concern. |
| **quinidine → flecainide** | 1451729 (Munafo 1992 — IV flecainide + single 50 mg quinidine; only CL change reported), 2111245 (quinine not quinidine), 17470523, 10354960, 9131945, 9041677, 7473143 | Munafo 1992 abstract: total CL 10.6 → 8.1 ml·min⁻¹·kg⁻¹ (~23% reduction; AUC ratio ~1.31×) but no AUC ratio named verbatim. Also IV not PO so first-pass effects miss. | Full-text Munafo 1992 tables, or a PO crossover study. |
| **quinidine → nortriptyline / amitriptyline** | 17470523 (Shen 2007), 10354960 (Venkatakrishnan 1999), 9131945, 9041677, 7473143 (Schmider 1995) | All in vitro HLM / recombinant-CYP studies of TCA kinetics. No in-vivo clinical quinidine → TCA AUC ratio in any abstract. | Look beyond the in-vitro mechanistic literature for a clinical TCA-quinidine crossover. |

### Fluoxetine victims — 8 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **fluoxetine → metoprolol** | 35510497 (Xu 2022 — rat only), 30248178 (Bahar 2018 review — attributes 3-5× to paroxetine, not fluoxetine), 41392923, 37317504, 34423412, 34182907 | No human clinical fluoxetine + metoprolol PK study with abstract-verbatim AUC ratio. Xu 2022 is rat-only PK. | Full-text Hemeryck or similar; or accept paroxetine's value as proxy. |
| **fluoxetine → atomoxetine** | 16142049, 39870079, 37879849, 36015360, 33245517 (paroxetine, not fluoxetine), 32022784, 31425490, 27123802, 24098676, 23933039, 21765848, 19445548, 18215333 (Paulzen 2008 — paroxetine), 17470523, 16913391 | Atomoxetine DDI literature is dominated by paroxetine; no dedicated fluoxetine + atomoxetine PK study has an abstract-verbatim AUC ratio. | Atomoxetine PI / FDA NDA review. |
| **fluoxetine → propranolol** | 15762767 (McEnroe 2005 — almotriptan review, treats fluoxetine and propranolol as separate probes), 9399014 + 10 propranolol-DDI candidates | No fluoxetine → propranolol clinical AUC ratio in any abstract surveyed. | n/a — DDI may not be PK-clinically significant. |
| **fluoxetine → codeine** | 12006904 (Fernandes 2002 — directional inhibition order only), 9118585 (Ozdemir 1996 review — narrative), 25719307, 16595712, 8477556, 36676742, 35201310, 24396053 | Fernandes 2002 confirms inhibition order Quinidine > fluoxetine > placebo but reports no AUC ratio for codeine or morphine in the abstract. | Pull from full-text Fernandes 2002 *Pain* tables. |
| **fluoxetine → dextromethorphan** | 8477556 (Otton 1993 — in vitro Ki 0.2 µM verbatim, NOT in-vivo AUC), 11910262, 12173784 (DMR shifts, not AUC) | Otton 1993 reports in vitro HLM Ki = 0.2 µM verbatim — the schema models in-vivo back-calc'd Ki from AUC ratios, not in vitro Ki directly. No in-vivo DXM AUC ratio for fluoxetine in any abstract. | Schema extension to support in-vitro Ki provenance separately. |
| **fluoxetine → tamoxifen / endoxifen** | 28074989, 26446141, 24635399, 23760858, 21751753, 15632378, 14652237 (Stearns 2003 — paroxetine, not fluoxetine), 20081063, 16815318 (Borges 2006 — pooled "potent CYP2D6 inhibitors", not fluoxetine-specific) | Borges 2006 reports endoxifen "23.5 ± 9.5 nmol/L versus 84.1 ± 39.4 nmol/L" but the inhibitor class is pooled. No fluoxetine-specific endoxifen AUC ratio. Also wrong polarity (formation-blockade). | Schema extension for metabolite-formation interactions. |
| **fluoxetine → nortriptyline** | 2388981 (Cavanaugh 1990 — "2 to 11 times" range across two drugs combined), 7751409 (el-Yazigi 1995 — nortriptyline as amitriptyline metabolite, conflates pathways), 40213690, 33237321, 18510583, 9441422, 23338224, 8236366, 8471078 | Cavanaugh 1990 gives a range, not a point estimate, and combines desipramine + nortriptyline. No nortriptyline-specific AUC ratio in any abstract. | Full-text Cavanaugh 1990 *Psychosomatics*. |
| **fluoxetine → aripiprazole** | 18832427 (Boulton 2010 — aripiprazole as perpetrator, wrong direction), 25384118 (methylphenidate, irrelevant), 31470784, 20097249, 41431308, 40871006, 40738618, 40610843, 38993656 | No fluoxetine → aripiprazole clinical PK study with abstract-verbatim AUC ratio. The DDI is widely cited (50% aripiprazole dose reduction recommended) but the number lives in the FDA label. | Aripiprazole / Abilify NDA review docs. |

### Bupropion victims — 5 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **bupropion → metoprolol** | 16722840, 16442040, 28520381 (Medical Genetics Summary), 35871665, 32342526, 24790991, 24336065 (rat — "no statistical PK difference"), 11302931, 10741632 (paroxetine, not bupropion) | The canonical "~5× metoprolol AUC bump with bupropion" lives in the Wellbutrin / Aplenzin FDA package insert, not a PubMed-indexed abstract. | Bupropion / Wellbutrin XL NDA review docs. |
| **bupropion → dextromethorphan** | 15876900 (Kotlyar 2005) | Abstract reports urinary DM/dextrorphan metabolic ratio change ("0.012 ± 0.012 vs. 0.418 ± 0.302; P < 0.0004") — this is a urinary MR, not a plasma AUC ratio; cannot be algebraically converted. | Full-text Kotlyar 2005 *J Clin Psychopharmacol* tables. |
| **bupropion → venlafaxine** | 22171584 (Spina 2012 review — qualitative), 18293180 (Wille 2008 TDM review) | No clinical bupropion + venlafaxine DDI study with abstract-verbatim AUC ratio. | Look for VEN O-demethyl-CL papers. |
| **bupropion → tamoxifen** | 20880642 (Desmarais 2010 review — "strong CYP2D6 inhibitor" qualitative), 28074989 | Wrong polarity (endoxifen formation blockade rather than tamoxifen AUC rise). | Schema extension for metabolite-formation interactions. |
| **bupropion → tramadol** | 24153222 (Park 2014 case-report review), 34798832 (Anand 2021 prevalence study) | No clinical bupropion + tramadol PK study with abstract-verbatim AUC ratio. The clinical concern is loss-of-analgesia via M1 metabolite reduction, mechanically similar to paroxetine→tramadol. | Look for tramadol DDI papers with bupropion arm. |

### Paroxetine tail — 5 skipped (paroxetine → tamoxifen already in §"Interaction kinetics" above)

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **paroxetine → codeine** | 29963937 (Cazet 2018 systematic review — qualitative, 0.44% prevalence figure only), 14597688, 12618536 (review articles) | No original paroxetine + codeine clinical PK study with abstract-verbatim AUC ratio. The widely-cited inhibitor work used quinidine (Caraco 1996), not paroxetine. | Look for paroxetine + codeine PK crossovers. |
| **paroxetine → dextromethorphan** | 22283559 (Schoedel 2012 — paroxetine added to DMQ which already contains quinidine; CYP2D6 attribution confounded), 10211917 (Alfaro 1999 — urinary DM/DX phenotyping ratio, not AUC), 12584155 (Bertelsen 2003 — in vitro K_I, not in-vivo AUC) | Confounded probe (DMQ contains quinidine baseline) or wrong-metric (urinary MR). | Find a paroxetine + DXM crossover without quinidine pre-treatment. |
| **paroxetine → nortriptyline** | 11673748 (Laine 2001) | Verbatim "3 times mean increase in nortriptyline trough concentration" — but this is trough, not AUC, and the subjects were CYP2D6 ultrarapid metabolizers (gene duplication/triplication), not representative of the EM-default registry baseline. | Find a paroxetine + nortriptyline crossover in EMs with AUC sampling. |
| **paroxetine → propafenone** | 18675768 (citalopram + propafenone case report), 18303146 (venlafaxine + propafenone), 10591535 (rifampicin + propafenone) | No paroxetine + propafenone clinical PK study indexed on PubMed. | n/a — likely not a clinically common combo. |
| **paroxetine → propranolol** | 21923449 (paroxetine + metoprolol, already authored), 20705902 (paroxetine + carvedilol, authored this session), 30248178 (Bahar 2018 metoprolol meta-review) | No dedicated paroxetine + propranolol clinical PK study indexed on PubMed with abstract-verbatim AUC ratio. The 2-5× propranolol-rise figure in secondary sources is not traceable to a primary abstract. | Find a primary paroxetine + propranolol crossover. |

## CYP1A2 victim AUC ratios — investigated, skipped (Wave 2a v1.1 session 2, 2026-05-11)

7 candidate pairs investigated across the 2 canonical CYP1A2 perpetrators (ciprofloxacin tail + fluvoxamine tail). 5 edges authored this session (ciprofloxacin → {caffeine, ropivacaine, clozapine[case-report]}, fluvoxamine → {clozapine, tacrine}), in scripts/authoring/2026-05-11-wave-2a-cyp1a2.ts. Skips below.

### Ciprofloxacin victims — 3 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **ciprofloxacin → olanzapine** | 12107872 (wrong paper — German nutrition), 29380488 (hERG meta-analysis), 10350045 (Markowitz & DeVane 1999 case report — abstract has zero numeric content) | Only case-report literature; no controlled PK study with verbatim AUC ratio. Olanzapine is primarily CYP1A2-metabolized so the interaction is real but uncharacterized. | Olanzapine NDA review or Lilly internal PK data. |
| **ciprofloxacin → duloxetine** | 17576795 (wrong paper — chromatin biology), 23885111 (Danish register prescribing-pattern, no PK), 39831503 (FAERS tinnitus mining), 33308859 (environmental photolysis) | No clinical cipro + duloxetine PK trial abstract on PubMed. Cymbalta FDA label cites ~6× AUC but I cannot trace a primary PMID. | Cymbalta NDA review (FDA Briefing Document). |
| **ciprofloxacin → mexiletine** | 10589372 (Labbé 1999 review — narrative only), 15385831 (Labbé 2004 — abstract reports only "marginally decreased R-(-)- and S-(+)-mexiletine clearances (2 to 5 L/h; P < 0.05)" without baseline CL or percent reduction) | Cannot back-calculate AUC ratio from "2 to 5 L/h" without baseline. Authors conclude "no major drug interaction is to be expected" — likely sub-caution anyway. | Full-text Labbé 2004 *Ther Drug Monit* tables. |

### Fluvoxamine victims — 4 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **fluvoxamine → mexiletine** | 11240973 (Kusumoto 2001) | Verbatim AUC "10.4 ± 4.85 versus 6.70 ± 3.21 microg·h/mL" → ratio 1.55× — sub-2× (below caution threshold). Mexiletine is primarily CYP2D6; CYP1A2 is only partial. | n/a — clinically sub-threshold. |
| **fluvoxamine → rasagiline** | 40580751 (zebrafish/environmental — no human PK) | PubMed yields zero clinical PK abstracts for this pair. Rasagiline FDA label warns of ~10× AUC, but the number lives in the label, not a peer-reviewed abstract. | Rasagiline / Azilect NDA review or full-text Goldberg 2004 prescribing study. |
| **fluvoxamine → agomelatine** | 20196187, 28286537, 28013355, 29734455, 27021842, 19927226 | The famous ~60× agomelatine AUC interaction with fluvoxamine lives in the Valdoxan/Thymanax SmPC; no PubMed abstract carries a verbatim ratio across the 6 candidate PMIDs surveyed. | Agomelatine SmPC / EMA assessment report. |
| **fluvoxamine → frovatriptan** | 12028322 (Buchan 2002), 12168506 (clinical-trials gateway, not a PK study) | Buchan 2002 reports only "slight increases in area under the curve and maximum concentration on concomitant administration with… fluvoxamine; …these findings were considered to have no clinical significance" — no number. | n/a — likely clinically negligible. |

## CYP2C8 + CYP2C9 victim AUC ratios — investigated, skipped (Wave 2a v1.1 session 3, 2026-05-11)

9 candidate pairs investigated across 4 perpetrators (trimethoprim, gemfibrozil tail, amiodarone CYP2C9-pure, fluconazole CYP2C9 sulfonylurea tail). 10 edges authored this session (trimethoprim → {repaglinide, rosiglitazone, pioglitazone}, gemfibrozil → {cerivastatin, montelukast, pioglitazone, rosiglitazone, loperamide}, amiodarone → phenytoin, fluconazole → glimepiride) in scripts/authoring/2026-05-11-wave-2a-cyp2c.ts. Skips below.

### Trimethoprim victims — 2 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **trimethoprim → paclitaxel** | 12019187 (Wen 2002) | In vitro HLM K_i 32 µM only; no clinical AUC study. | Search beyond CYP2C8 in vitro literature for a paclitaxel + TMP clinical crossover. |
| **trimethoprim → montelukast** | 21289076 (Filppula 2011), 35131063 (case report, no PK), 16867170 (Jaakkola 2006) | All in vitro or single case report. No clinical crossover AUC ratio. | Look for clinical PK papers post-2012. |

### Amiodarone victims — 3 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **amiodarone → losartan** | 15449971 (Bailey 2004 narrative review) | No dedicated PK study; review only. | Search for clinical amiodarone + ARB PK data. |
| **amiodarone → fluvastatin** | 12822205 (Becquemont review), 21630612 (Marot case report), 20214592 (Lai CYP2C8 review), 17615423 (Schmidt case report) | All narrative reviews or case reports; no AUC ratio in any abstract. | Statin + amiodarone clinical PK study. |
| **amiodarone → sulfonylureas** (glipizide / glyburide / glimepiride) | (no candidate PMIDs found) | No PubMed-indexed dedicated PK studies; the interaction is widely cited as theoretical (CYP2C9 mechanism) but not characterized clinically. | Original PK study — likely none exists. |

### Fluconazole victims — 4 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **fluconazole → glyburide** | 10213526 (eprosartan review, wrong drug), 9512916 (Albengres review), 20592722 (Schelleman case-control OR=2.20, not AUC), 20698928 (Tirkkonen epidemiology) | No abstract-verbatim AUC ratio. Schelleman 2010 gives an epidemiologic OR for hospitalization (2.20), not a PK AUC ratio. | Search for original glyburide + fluconazole PK studies. |
| **fluconazole → glipizide** | 1299999 (Fournier case report French — no AUC), 20592722 (OR only) | Case reports and epidemiology only; no clinical PK crossover. | Look for Korean/Japanese PK studies that might be PubMed-indexed but not English-first. |
| **fluconazole → tolbutamide** | 2330488 (Lazar 1990 narrative — says "increased ... AUC" but no number), 10375008 (D0870 in vitro), 22311023 (salmon microsomes), 18381488 (Lu hepatocyte in vitro prediction) | Lazar 1990 abstract is qualitative; rest are in vitro. No clinical AUC ratio. | Lazar's original Lazar 1990 *Clin Pharmacol Ther* full-text tables. |
| **fluconazole → rosiglitazone** | 20623750 (rat toxicity), 20849824 (in vitro gene expression) | No human PK study with abstract-verbatim AUC. | Search for human fluconazole + TZD PK studies. |

## Plasma-binding displacement — investigated, skipped (Wave 2b session 1, 2026-05-05)

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **celecoxib → warfarin** | (no specific abstract found) | PubMed search returned no abstract with verbatim Δfu number for celecoxib displacing warfarin. | Pull from celecoxib safety/PK full-text (e.g. Karim 2002, Goosen 2005). |
| **aspirin/salicylate → warfarin** | 6192825, 2300044, 3651341, 6493354, 6790449 | None of these abstracts contain a verbatim Δfu number for warfarin displacement by aspirin/salicylate. PMID:6790449 mentions "free warfarin increased by 600 µM VPA" but that's the inverse direction with no number. | Pull from full-text Schentag/Aggeler-style competition data. |
| **phenytoin → valproate** (reverse direction) | 8009559 (negative), 6783979 (qualitative) | PMID:8009559 abstract is a verbatim **negative result**: "Concurrent therapy with phenytoin (n = 7) … did not cause displacement of VPA." Logged as a confirmed-not-an-effect rather than a missing-citation. | n/a — likely not a real interaction; the asymmetry (VPA→PHT works, PHT→VPA doesn't) is consistent with binding-site geometry. |
| **sulfamethoxazole → warfarin** | 882479 (Lancet letter), 53648, 3395358, 3468088, 7291718 | Mechanism widely cited but no abstract carries a verbatim Δfu number. Atovaquone+SMX-TMP papers conflate effects. | Pull from full-text equilibrium-dialysis studies. |
| **trimethoprim → warfarin** | 21189363 (atovaquone — wrong drug), 882479 (SMX, not TMP) | No abstract found with verbatim Δfu for TMP→warfarin specifically. | Search beyond TMP-SMX combination studies for TMP-only data. |
| **ibuprofen → phenytoin** | 16937340 (Lopez-Garcia 2006) | Abstract reports model-prediction range (0.99–1.36-fold) but not a measured before/after Δfu. | Pull primary clinical data with measured free-PHT. |

## Receptor occupancy — investigated, skipped (Wave 3b session 11, 2026-05-05)

| Compound | Receptor | PMIDs chased | Reason skipped |
|---|---|---|---|
| **quinine** | Nav1.5 / cardiac INa | 1660369, 9582223, 12393164, 18511484, 22451526, 27009163, 7541786, 8951714, 8360160, 1373146, 8229842 | No verbatim quinine cardiac sodium channel IC50 in any indexed abstract. PMID:9582223 (Lin 1998) reports use-dependent INa reduction at >20 µM in cochlear neurons but no IC50 fit. Quinine surfaces predominantly as Kv blocker in patch-clamp papers, not Nav. Quinidine has clean Nav1.5 data (PMID:9413244) but quinine does not. |

## Receptor occupancy — investigated, skipped

| Compound | Why skipped |
|---|---|
| **clozapine, lurasidone, mirtazapine** (D2 / 5-HT2A / H1 / α2) — **olanzapine now authored** | Multi-target drugs whose receptor Kᵢ live in paywalled tables, not abstracts. **olanzapine RESOLVED 2026-05-25 (wave 3):** D2 67.72 / 5-HT2A 4.22 / H1 0.13 nM authored from the CC-BY OA paper PMC3485633 (PMID 22726212) — **rat**; human values (Richelson 2000) backlogged to upgrade. **clozapine, lurasidone** → PDF backlog (PDF_QUEUE rows 10–13: Richelson 11132243 human D2/5-HT2A/H1; Ishibashi 20404009 lurasidone). PET D2-occupancy kₑₒ anchors verified (clozapine PMID 9690965; lurasidone PMID 23649882) — only the Kᵢ is gated. **mirtazapine** remains fully gapped (α2/H1/5-HT2A all table-only, no PET anchor). |
| **yohimbine** (α2 — wave 2) | No abstract states a verbatim numeric α2A Kᵢ; PMID 9551719 / 9750005 give only qualitative or selectivity-ratio language. Human PK anchor exists (PMID 3653227, t½ 0.6 h). Re-author from a full-text α2 binding table. |
| **trazodone** (5-HT2A — wave 2) | 5-HT2A Kᵢ is table/figure-only in the canonical primary sources (Cusack 1994 PMID 7855217 human brain; Owens 1997 PMID 9400006 rat); abstracts give rank-order text, no number. Also no abstract-quotable oral Tmax for a kₑₒ anchor. Re-author from full-text. |
| **ondansetron, granisetron, palonosetron** (5-HT3 — wave 4) | Human HEK293 5-HT3A Kd is table-only in Rojas 2008 (PMID 18633025, paywalled → PDF_QUEUE row 15). Verified abstracts give only rodent values (ondansetron mouse Kᵢ 11 nM PMID 10543422; palonosetron NG-108-15 −logKᵢ 10.5 PMID 7773546) and **no antiemetic onset/kₑₒ number**. Re-author from the Rojas full-text table + an onset anchor. |
| **tolterodine, oxybutynin** (muscarinic — wave 4; Kᵢ verified, kₑₒ missing) | Human Kᵢ verbatim (tolterodine bladder 3.3 nM, PMID 9200560; oxybutynin cloned-human m3 0.67 nM, same PMID — note m/M = human/guinea-pig pairing trap). No abstract reports an antimuscarinic (bladder) effect-onset/kₑₒ. Re-author when an onset anchor surfaces. |
| **rizatriptan** (5-HT1B/1D — wave 4) | No verbatim Kᵢ in any abstract/OA text — appears only as a comparator or in paywalled Merck full-text tables. Re-author from full-text. |
| **famotidine** (H2 — wave 4) | No abstract states a famotidine H2 Kᵢ in nM; only a functional pKd 8.2 (guinea-pig atrium, PMID 1704683) without a clean verbatim quote captured. Re-author from a confirmed full-text H2 binding value. |
| **oxycodone, naltrexone** (MOR — wave 5) | oxycodone: exact human MOR Kᵢ table-only in Volpe 2011 (PMID 21215785, paywalled → PDF_QUEUE row 16); abstract gives only "K(i)=1-100 nM" band. naltrexone: only a qualitative "~3 nM" in a Results sentence (PMID 40317337), not a precise tabulated Kᵢ. Re-author from full-text tables. |
| **memantine, dextromethorphan** (NMDA — wave 5) | IC50/Kᵢ verified verbatim (memantine IC50 2.92 µM rat, PMID 8152525; dextromethorphan Kᵢ 2913 nM rat, PMID 15240177) but NMDA is a **voltage-dependent open-channel block** — Hill–Langmuir occupancy doesn't apply (same reason as Mg²⁺ NMDA; see ketamine caveat). Intentionally not authored. |
| **donepezil, galantamine** (AChE — wave 5) | AChE IC50 verbatim (donepezil 7.03 nM, PMID 41691754; galantamine 2.15 µM, PMID 34628223) but both come from med-chem papers using them as reference comparators with the **AChE enzyme species unstated** in the abstract. Re-author from a species-defined primary characterization. |
| **eszopiclone, codeine, clomipramine** (wave 6) | eszopiclone: only an IC50 (21 nM, (+)-zopiclone enantiomer, subtype-unspecified, PMID 8398600) — not a Kᵢ. codeine: MOR only in the ">100 nM" band (Volpe 2011, PDF_QUEUE row 16); no discrete value. clomipramine: hSERT ~0.6 nM in PMC2665081 (Andersen 2009) Table 1, but the exact decimal/SEM couldn't be locked from the table render — needs a direct read of the printed table (or Tatsumi 1997 full-text). |
| **atorvastatin, simvastatin** (HMGCR — wave 7) | Per-statin human HMGCR Kᵢ is table-only in Istvan & Deisenhofer 2001 (PMID 11349148, *Science*, paywalled → PDF_QUEUE row 17; abstract says only "nanomolar range"). rosuvastatin authored (Holdgate 2003 has a verbatim Kᵢ). Re-author from the Science Table 1. |
| **dapagliflozin** (SGLT2 — wave 7) | hSGLT2 EC50 (~1.1 nM) is table/body-only in Meng 2008 (PMID 18260618) and Han 2008 (PMID 18356408); abstracts say only "potent and selective". empagliflozin authored (Grempler 2012 has verbatim IC50). Re-author from full-text. |
| **lisinopril** (ACE — wave 7) | No verified abstract states a discrete lisinopril ACE Kᵢ/IC50 in nM (PMID 1320019 "nanomolar range" + relative ranking only). Re-author from the Merck kinetic full-text. |
| **exemestane, rasagiline** (irreversible inhibitors — wave 7) | Verbatim values exist (exemestane aromatase Ki 26 nM, PMID 1525055; rasagiline MAO-B IC50 4.43 nM rat, PMID 11159700) but both are **irreversible** (suicide / mechanism-based) inhibitors — reversible Hill–Langmuir occupancy doesn't model them (same limitation as MAO/bergamottin mechanism-based inhibition). Intentionally not authored. |
| **imatinib, dasatinib, sorafenib, ruxolitinib, ibrutinib** (kinases — wave 8) | imatinib/dasatinib ABL IC50 table-only (O'Hare 2005 PMID 15930265, Buchdunger — paywalled); sorafenib Raf/VEGFR table-only (Wilhelm 2004); ruxolitinib only a cellular IL-6 IC50 281 nM (PMID 20130243), not an enzyme constant; ibrutinib BTK IC50 0.5 nM (PMID 20615965) but **covalent/irreversible**. nilotinib/erlotinib/tofacitinib/baricitinib authored. Re-author the table-blocked ones from full-text. |
| **suvorexant, lemborexant, daridorexant** (orexin OX1/OX2 — wave 11) | Discovery/pharmacology abstracts state potency only as "low nanomolar"; the numeric OX1/OX2 Kᵢ/IC50 live in paywalled JPET full-text tables (Cox 2010, Beuckmann 2017, Treiber 2017 — not in free PMC, publisher 403). Re-author from those tables. Occupancy/onset language is abstract-quotable but not a Kᵢ. |
| **zafirlukast (CysLT1), macitentan (ETA)** (wave 11) | zafirlukast: only functional pKB (~9 guinea-pig trachea), no binding Kᵢ in any abstract. macitentan: Iglarz 2008 (PMID 18780830) says only "inhibitory constants within the nanomolar range" — qualitative. montelukast/bosentan authored. Re-author from full-text tables. |
| **liraglutide, dulaglutide** (GLP-1R — wave 10) | Discovery abstracts describe affinity only qualitatively — liraglutide via Knudsen 2000 (PMID 10794683) quotes native GLP-1's EC50 55 pM, not liraglutide's (semaglutide's "3-fold vs liraglutide" gives a derived ~0.13 nM, NOT quoted → not authored); dulaglutide (PMID 20503261) says only "retained full receptor activity". semaglutide/tirzepatide/exenatide authored. Re-author from full-text. |
| **tamoxifen, pioglitazone, hydrocortisone** (nuclear — wave 9) | tamoxifen/4-OH-tamoxifen: only a relative binding affinity (RBA 310% of estradiol, PMID 6537799) — no absolute Kᵢ. pioglitazone: hPPARγ EC50 table-only (Sakamoto 2000). hydrocortisone: no abstract-quotable human GR Kd for cortisol itself (binding papers use a dexamethasone radioligand). Re-author from full-text tables. |
| **fluoxetine** (SERT) | Searched PMIDs 19641126, 24516100, 26514584, 1930610. Owens 1997 review (PMID 9400006) contains the canonical hSERT Ki ~0.81 nM in tables only, not abstracts. PMID 11543737 reports R-fluoxetine Ki = 1.4 nM but that's the inactive enantiomer. Re-author when full-text Owens 1997 / Tatsumi 1997 numbers can be cited. |
| **sertraline** (SERT) | Tried PMIDs 9537821 (Tatsumi review — KD = 25 nM at DAT only in abstract), 3371401 (platelet/imipramine assay), 19430461 (structural), 19641126. Standard ~0.29 nM hSERT Ki lives in Tatsumi 1997 *Eur J Pharmacol* table. |
| **paroxetine** (SERT) | Tried PMIDs 9400006 (Owens — methodology only in abstract), 32618269 (cryo-EM, no Ki), 18043708, 21486038. The widely-cited ~0.05 nM hSERT Ki lives in Owens 1997 / Tatsumi 1997 tables. |
| **citalopram** (SERT) | Tried PMIDs 19641126, 19892699, 20672825 (gives Ki=1–40 nM range for citalopram analogues, not citalopram itself). Standard ~1.16 nM Ki lives in tables only. |
| **propranolol, metoprolol, atenolol** (β1 + β2) | Canonical compare papers (Smith & Teitler 1999 PMID 10372227; Hoffmann 2004 PMID 14730417; Baker 2005 PMID 15655528; Nakamura 2000 PMID 10895074) report selectivity ratios, pKi, or pKB only. PMID 10895074 has propranolol pKi=9.02 at hβ1 (~0.95 nM) but as pKi, not nM. |
| **atenolol** (β1 — duplicate rows + secondary-citation smell) | Surfaced 2026-05-25 when `scripts/normalize-receptor-keys.ts` collapsed `beta1_adrenergic`→`beta_1`, leaving atenolol with **two** `beta_1` occupancy rows (ec50 0.3196 mg/L, PMID:10588927 vs ec50 0.0701 mg/L, PMID:10630733) — lint now warns (`receptor.duplicate`). Both citations are **secondary-citation smells**: PMID:10588927 (Villarroya 1999) characterizes *PF9404C* and PMID:10630733 (Yeh 2000) characterizes *vanidipinedilol* — atenolol appears only as a rat-tissue β-blocker comparator in each, not as the paper's subject. Neither is a clean human atenolol β1 Kᵢ/Kd. **Re-author as ONE row** from a primary human atenolol β1 binding paper, then drop the other. |
| **bisoprolol, nebivolol β2** | PMIDs 1691366, 12535855, 2839668, 1681809, 2462161, 11309254 surface only β1 numbers verbatim; β2 Ki is in tables. |
| **carvedilol β2** | PMIDs 1350478, 1378154, 8733065 give only β1 Kd or selectivity ratios in abstract. |
| **duloxetine, venlafaxine, vortioxetine** (SERT) | **AUTHORED 2026-05-25 (wave 1, `2026-05-25-wave1-banked-ki-keo-unblock.ts`).** Human SERT Kᵢ verbatim (duloxetine 0.8 nM, venlafaxine 82 nM — PMID 11750180; vortioxetine 1.6 nM — PMID 21486038). No measured kₑₒ exists, so a documented-approximation kₑₒ ≈ 0.4/h is anchored to human [11C]DASB/MADAM PET SERT-occupancy time-courses (16506079 / 17497139 / 23428337) — SERT *binding* occupancy equilibrates over hours, distinct from the weeks-long mood effect. |
| **nebivolol, bisoprolol β1** | **AUTHORED 2026-05-25 (wave 1).** β1 Kᵢ verbatim: bisoprolol 20 nM (PMID 1691366, rat myocyte). **Data-smell correction:** on-file nebivolol PMID 1681809 has NO verbatim β1 Kᵢ (cAMP potencies + "sub-nanomolar" only); the verbatim 0.9 nM is in PMID 2462161 (rabbit lung) — used instead. kₑₒ ≈ 2.5/h, class-typical β-blocker HR endpoint (bisoprolol shows no hysteresis vs plasma, PMID 7516019). |
| **lidocaine, bupivacaine** (Nav) — **mepivacaine still gapped** | **lidocaine + bupivacaine AUTHORED 2026-05-25 (wave 1)** as systemic Nav engagement: IC50 (not Kᵢ) verbatim from PMID:9768788 (Bräu 1998, Xenopus tonic block — lidocaine 204 µM, bupivacaine 27 µM); kₑₒ ≈ 4/h (cardiac effect tracks plasma, no effect compartment — PMID 2085708 / 8368546). **mepivacaine (149 µM, same PMID) remains skipped — no verifiable kₑₒ / effect-onset anchor.** (Procaine also has verbatim IC50 here but isn't in the registry.) |
| **levocetirizine, loratadine, diphenhydramine, chlorpheniramine, doxylamine, fexofenadine, hydroxyzine** (H1) | **Partly resolved 2026-05-25** (`2026-05-25-h1-antihistamine-occupancy.ts`): cetirizine (Kᵢ 6 nM, PMID 11809864), desloratadine (0.9 nM, PMID 12167464), and promethazine (1.4 nM, PMID 1912125 — added) are now authored using the documented-approximation kₑₒ convention (caffeine-style; effect-onset anchors PMID 10543317 / 17390761 / 11922397). No abstract carries a fitted kₑₒ for any antihistamine — only indirect-response or descriptive-onset data — so the kₑₒ values are approximations, noted as such. **Still gapped:** levocetirizine (Kᵢ 3 nM verbatim in PMID 11809864 — authorable if the enantiomer warrants its own slug); loratadine (only guinea-pig 35/118 nM, PMID 2875889 — no human abstract value, parent is weak vs its desloratadine metabolite anyway). **Data-smell correction:** the prior diphenhydramine PMID 20493137 is *guinea-pig* cerebellum (Kᵢ ~44 nM), and chlorpheniramine PMID 17099293 is a placental-localization paper — neither is a clean human competition Kᵢ, so both remain unauthorable from abstracts (full-text PDSP/IUPHAR tables would close them). doxylamine / fexofenadine / hydroxyzine: no abstract names any H1 Kᵢ. |
| **hydrocodone** (μ-opioid) | **AUTHORED 2026-05-25 (wave 1).** Kᵢ 19.8 nM verbatim (PMID 1851921, rat brain, [3H]DAMGO). No hydrocodone-specific kₑₒ exists; documented-approximation kₑₒ ≈ 2.0/h from the dihydrocodeine analog miosis t½ ≈ 21 min (PMID 17786418), flagged in-note as an analog basis. |
| **propranolol, metoprolol** (β1 — pKi verified, kₑₒ missing) | β1 pKi values from PMID:10895074 (Nakamura 2000): propranolol pKi 9.02 → ~0.95 nM, metoprolol pKi 5.99 → ~1023 nM, [125I]iodocyanopindolol on COS-7 hβ1. Abstract states pKi (not nM); deterministic conversion preserved. No abstract carries kₑₒ for either compound on HR/PR endpoints. |
| **haloperidol** (D2) | **AUTHORED 2026-05-25 (wave 1).** Kd 7.42 nM verbatim (PMID 1361536, rat striatum, [3H]haloperidol direct binding — Kd, not Ki). kₑₒ ≈ 0.5/h anchored to human PET D2 occupancy "high already 3 h after administration" (PMID 1533719). New occupancy key `dopamine_d2` → catalog DRD2. A competition-Ki could refine the Kd later. |
| **ginsenoside-rg3** (Nav1.2 / 5-HT3A / α9α10 nAChR — IC50 verified, kₑₒ missing) | Three Xenopus-oocyte IC50 values verified verbatim: Nav1.2 32 µM (Lee 2005 PMID:16014805), 5-HT3A 27.6 µM (Lee 2007 PMID:17257631), α9α10 nAChR 39.6 µM (Lee 2013 PMID:23649337). 2026-05-16 PubMed sweep ("ginsenoside Rg3" × {effect compartment, hysteresis, keo, ke0, PK-PD model, time-course, biophase}) returned zero hits with a numeric kₑₒ. Rg3 clinical literature is pure PK (Pang 2001 PMID:12580081, Zhao 2016 PMID:26470874); Cmax (16 ng/mL) / IC50 (~25 mg/L) ≈ 0.06%, so in-vivo occupancy is effectively zero — consistent with the absence of in-vivo PD-time-course studies. Re-author as a unit when any in-vivo PD-time-course abstract for Rg3 surfaces. |
| **agmatine** (I2 + α2 — Ki verified, kₑₒ missing; also no human PK) | Two passes 2026-05-17. **I2 Ki = 240 ± 25 nM** verified verbatim from PMID:8786560 (Regunathan 1996 JPET, rat aortic SMC [³H]idazoxan competition; PMID:7677378 is the same data in proceedings — cite JPET only). **α2-adrenergic Ki = 7.94 µM (rat) / 17 µM (bovine)** verified verbatim from PMID:7715734 (Pinthong 1995 NSAP: "Agmatine produced a concentration-dependent inhibition of 1 nmol/l 3H-clonidine binding to both rat (pKi-5.10 +/- 0.05) and bovine (pKi-4.77 +/- 0.38) cerebral cortex membranes"); bulk α2, not subtype-resolved; corroborated PMID:7582492 "approximately 4.8" bovine. Lint requires kₑₒ — no PubMed abstract carries kₑₒ for agmatine on any endpoint (searched: effect compartment, ke0, hysteresis, PK-PD, biophase, intrathecal time-course, opioid potentiation onset). **I1 absolute Ki — dead**: PMID:8930173 (Piletz 1996) gives only fold-selectivity ("1400-fold selective over α2A, 5000-fold over α2B, 800-fold over α2C"); PMID:11063925 (Piletz 2000) says "too low to be reliable" in human brain; PMID:7906055 (Reis 1994 *Science*) is qualitative. **NMDA** — IC50 ~300 µM exists (PMID:15982768 Askalany 2005, recombinant ε/ζ at -70 mV) but voltage-dependent channel block — Hill doesn't apply (same reason as Mg²⁺ NMDA). **Human PK — genuinely absent**: Keynan/Gilad 2010 RCT (PMID:20447305, abstract fetched) carries only dosing schedule + efficacy %; 13 Gilad GM author papers all biology/safety with no PK numbers; 16-author consensus review (PMID:23769988, *Drug Discov Today* 2013, "Agmatine: clinical applications after 100 years in translation") carries zero PK — dispositive null. Rat IV/PO available (PMID:37770201 Clements 2023 JPET: F 0.29-0.35, PO t½ 74-117 min flip-flop, IV t½ 14.9-18.9 min) — flagged in pk_unauthored.note. Re-author both Ki entries together with kₑₒ when an in-vivo PK-PD time-course paper for agmatine on any endpoint surfaces. |
| **l-theanine** | PMIDs 12499631, 12596867, 38716554 describe binding qualitatively ("80–30,000-fold less than glutamate") with no verbatim Ki/EC50 in abstracts. |
| **l-tyrosine** | Catecholamine precursor — not a direct receptor agonist, Hill model doesn't apply. |
| **levodopa** | Dopamine prodrug — AADC decarboxylates it to dopamine; dopamine (not levodopa) occupies the receptor, so the parent has no Hill occupancy of its own. |
| **alpha-gpc / citicoline** | Choline / phosphatidylcholine precursors, no direct receptor occupancy. |
| **creatine-monohydrate** | Phosphocreatine buffer, no receptor. |
| **dsip** | PMID 2547200 is BBB transport kinetics, not receptor binding. |
| **selank** | PMID 17415472 explicitly reports it does NOT displace D2 or μ/δ-opioid ligands at >40–100 µM. Mechanism appears indirect (modulates enkephalin-degrading enzymes). |
| **rhodiola-rosea** | Multi-component extract; salidroside is the marker but doesn't have a single clean receptor target. |
| **vitamin-d3** | VDR is a nuclear/genomic receptor — classical Hill occupancy model doesn't fit. |
| **zinc-picolinate** | Multi-target ion; no clean primary receptor with verifiable Ki. |
| **magnesium-glycinate / magnesium-l-threonate** | Mg²⁺ NMDA block is voltage-dependent, not Hill-isotherm. |

## PK source_pmid — investigated

All four prior gaps now closed. No remaining PK-PMID gaps among compounds with authored PK.

### Macrolide + rifabutin tail — investigated, skipped (Wave 2a v1.1 session 12, 2026-05-11)

5 candidate pairs skipped. 1 edge authored (rifabutin → buprenorphine ind×1.54 PMID:21596492). Apply-script: scripts/authoring/2026-05-11-wave-2a-macrolide-tail.ts.

Discovery: 3 candidates (clarithromycin → triazolam, erythromycin → triazolam, erythromycin → sildenafil) were already authored from prior sessions with the same PMIDs the agent re-found (Greenblatt 1998 PMID:9757151, Muirhead 2002 PMID:11879258) — making this round one of low net yield.

| Pair | PMIDs chased | Why skipped |
|---|---|---|
| **clarithromycin → quetiapine** | 19067264 (Schulz-Du Bois 2008) | Title-only on PubMed; no abstract body. |
| **clarithromycin → colchicine** | 21480191 (Terkeltaub 2011), 39585167, 26210999, 25859365, 23462027 | Terkeltaub gives only "ratios >125% across all studies" — no specific clarithromycin AUC ratio. Note: clarithromycin → colchicine *is* authored at PMID:23462027 with Ki=1.1 already — this candidate would be a duplicate. |
| **erythromycin → carbamazepine** | 1414219, 2066460, 10589373 (Rodvold review), 10668858 (Dresser review), 8787948 | Reviews + passing mentions only; no abstract-verbatim AUC for ery + CBZ. |
| **rifabutin → atazanavir** | 21712242 (Zhang 2011) | Reverse direction — ATV/r effect on rifabutin PK, not rifabutin → ATV. |
| **rifabutin → midazolam** | 30783000, 10418969 (in vitro hepatocytes ~1.9× MDZ biotransformation), 9512916, 11996607, 9402947 | In vitro only; no clinical PK study with abstract-verbatim AUC. |

### HIV PI PK + voriconazole/aprepitant/nirmatrelvir tails — investigated, skipped (v1.1 session 11, 2026-05-11)

PK authoring attempted for the 5 new HIV/ketolide stubs (cobicistat, atazanavir, darunavir, lopinavir, telithromycin) plus more perpetrator edge re-chases. 14 new compound stubs + 3 perpetrator edges did land — see scripts/authoring/2026-05-11-wave-0b-modern-stubs-plus-edges.ts. 10 candidates skipped:

| Item | PMIDs chased | Why skipped |
|---|---|---|
| **cobicistat PK** | 20043009 (Mathias 2010), 24550332 (Custodio 2014) | Abstracts give fold-ratios only (164× single-dose escalation, 47× multi-dose); no absolute Cmax/AUC/t½/F/Vd for cobicistat itself. PK lives in Tybost FDA label. |
| **atazanavir PK** | 17760738, 21447864, 18528434, 18520949, 22288567, 21712242, 27798211 | All hits are DDI ratio papers — geometric mean ratios, not absolute monotherapy PK. Bristol-Myers Squibb phase-1 paper not located within budget. |
| **darunavir PK** | 17389557 (Sekar food-effect), 27129006, 25326090, 25091302, 20710052 | All hits report relative changes (food, formulation, pregnancy) — no abstract-verbatim absolute single-dose 800 mg PK. |
| **lopinavir PK** | 20056686 (de Kanter 2010) | Verbatim Cmax 7.2 mg/L + AUC0-t 71.8 mg·h/L for 400 mg Kaletra fasted, but t½ isn't in the abstract — can't satisfy data-lint ke_hr/half_life_hr/MM requirement. Author when t½ comes from a verifiable abstract. |
| **telithromycin PK** | 14973302 (Shi 2004 renal), 15792396 (Shi 2005) | Healthy-subject Cmax/AUC are derived from a fold-ratio (3.6 / 1.6 fold-change vs healthy), not abstract-verbatim absolute values. Author when full-text Bhargava 2003 or Namour 2001 single-dose abstract surfaces with healthy-subject numbers. |
| **voriconazole → omeprazole** | 14616415 (Wood/Purkins 2003) | Paper measures the REVERSE direction (omep on vori PK). Vori→omep AUC ratio (~4× widely cited) not in any abstract; lives in Purkins 2003 *Br J Clin Pharmacol* tables. |
| **voriconazole → sirolimus** | 14563125 (wrong paper — RNAi review), 18812562 (everolimus case report) | No vori → sirolimus controlled PK abstract; only case-series-derived "90% sirolimus dose reduction" guidance. |
| **aprepitant → hormonal-contraceptives** | 14613941 (wrong paper — malaria RAMA), other searches return 0 | Primary clinical aprepitant + ethinyl-estradiol PK study not indexed under expected terms; lives in Shadle 2004 *J Clin Pharmacol* tables. |
| **nirmatrelvir → midazolam** | 35153195 (Eng 2022 preclinical disposition), 35842922 (Svedmyr 2022 review), 35239193 (guidance) | Preclinical disposition + reviews + guidance only. Paxlovid Hot Sheet midazolam DDI lives in the FDA EUA fact sheet, not a PubMed abstract. |
| **rifampin → digoxin** | 10411543 (Greiner 1999) | Abstract verbatim: "intestinal P-gp content 3.5 ± 2.1-fold" increase. AUC reduction is qualitative ("AUC was significantly lower during rifampin treatment"). P-gp content fold ≠ AUC fold. Re-author when Greiner 1999 *J Clin Invest* tables provide the actual oral digoxin AUC reduction number. |

### Cobicistat perpetrator tail — investigated, skipped (Wave 2a v1.1 session 10, 2026-05-11)

Cobicistat was added as a new compound in this session along with one authored edge (midazolam, AUC ~20× via 95% CL reduction verbatim — Mathias 2010 PMID:20043009). 5 additional candidate cobicistat victims investigated; all skipped. Apply-script: scripts/authoring/2026-05-11-wave-0b-hiv-stubs.ts.

| Pair | PMIDs chased | Why skipped |
|---|---|---|
| **cobicistat → atazanavir** | 25361436 (Sevinsky FDC bioequivalence), 21811136 (Elion 2011 phase-2 efficacy) | Phase-2 efficacy study (virologic suppression, eGFR endpoints) — abstract gives no PK AUC ratio for ATV ± COBI. |
| **cobicistat → darunavir** | 22732469 (German renal study, no DRV PK), 29522076 (Mogalian agent panel), 29237008 (Moltó DRV/COBI ± etravirine — quotes only DRV C24 change with ETR) | No DRV AUC ratio with cobicistat ± unboosted comparator in any abstract. |
| **cobicistat → elvitegravir** | 20683270 (German 2010 EVG/COBI vs EVG/RTV — GMR 118 [110-126]), 21348537, 23774876, 24550332, 24375014 | German 2010 compares COBI vs RTV boosting, not COBI vs unboosted — cannot derive AUC ratio for Ki. |
| **cobicistat → atorvastatin** | 23703578 (Chauvin review qualitative), 36001111 (rhabdo case report), 30808332 (simvastatin case report) | Case reports + review only; no quantitative AUC ratio in abstracts. |
| **cobicistat → sildenafil** | 31364387 (Pecora Fulco letter) | Letter, no numeric ratio. Only PubMed hit for this pair. |

Most cobicistat DDI numbers live in the Tybost FDA label and full-text Mathias 2012 / German 2010 / Custodio 2014 tables — not abstracts.

### Wave 2a perp grab-bag — investigated, skipped (Wave 2a v1.1 session 9, 2026-05-11)

12 candidate pairs skipped across terbinafine / aprepitant / bosentan / oxcarbazepine / modafinil — 12 edges authored in scripts/authoring/2026-05-11-wave-2a-perp-grab-bag.ts.

| Pair | PMIDs chased | Why skipped |
|---|---|---|
| **terbinafine → nortriptyline** | 12398564 (Van Der Kuy 2002 — case report), 16175144 (Castberg 2005 — amitriptyline case report) | Case reports only; no abstract-verbatim AUC ratio. |
| **terbinafine → metoprolol** | 24894748 (Bebawi 2015 case report), 19907087 (HPLC method) | Case report says "terbinafine had decreased metoprolol's clearance" without numbers. |
| **terbinafine → dextromethorphan** | 11167673 (Cai 2001 — no abstract body), 10460803 (in vitro Ki=0.03 µM verbatim), 26195224 (in vitro only) | In vitro Ki abstract-verbatim (0.03 µM, far more potent than clinical derivation) but registry schema models in-vivo back-calc'd Ki only — schema extension would be needed. |
| **terbinafine → atomoxetine** | 39870079 (in vitro CYP2D6 allele Ki) | No clinical PK study indexed. |
| **aprepitant → hormonal-contraceptives** | 17982511, 16258596, 12690708 | All "Gateways to Clinical Trials" indexing articles, not primary studies. |
| **aprepitant → tolbutamide** (CYP2C9 induction direction) | 14973304 (Shadle 2004) | Tolbutamide is missing from the registry; would also represent the unusual case where aprepitant is an INDUCER at CYP2C9 (AUC ratio 0.72 at day 8) — opposite polarity from its CYP3A4 inhibition. Skip pending tolbutamide addition + dual-direction schema. |
| **bosentan → cyclosporine** | 14617681 (rat oatp), 10620203 (Binet 2000 — explicitly NO AUC change on CsA: "CsA exposure ... was not statistically different"), 15568889 (review) | The well-known clinical interaction is CsA→bosentan (CsA inhibits bosentan clearance), not bosentan→CsA. The induction direction has no controlled-PK abstract. |
| **oxcarbazepine → simvastatin** | 22612290 (eslicarbazepine review, wrong drug), 30798113 (epidemiology) | Only review-level mentions; no primary OXC + simvastatin PK trial. |
| **modafinil → triazolam** | 18076219 (Darwish 2008 — **armodafinil** R-enantiomer, not racemic modafinil; midazolam AUC -32% oral / -17% IV under armodafinil 250 mg/d), 11823757 (Robertson 2002 qualitative) | Darwish is the wrong perpetrator (armodafinil ≠ racemic modafinil). | 
| **modafinil → cyclosporine** | 9137371 (Le Cacheux 1997 French case report), 12224444 (Prous "Gateways") | Case report + index listing only. |
| **modafinil → losartan** | 29178272 (Rowland 2018) | Abstract verbatim: SS AUC ratio "0.98 (± 0.11)" — no signal at CYP2C9. |
| **modafinil → caffeine** | 29178272 (Rowland 2018) | SS AUC ratio "0.90 (± 0.16)" → induction_factor 1.11 — below the clinically meaningful threshold (within ±10% noise). |

### Phenytoin perpetrator tail — investigated, skipped (Wave 2a v1.1 session 8, 2026-05-11)

Phenytoin as broad-CYP inducer was under-authored at 1 edge after the CBZ session. 2 more authored (scripts/authoring/2026-05-11-wave-2a-phenytoin-perp.ts) — atorvastatin and quetiapine. 6 skips below.

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **phenytoin → simvastatin** | 31884695, 22612290, 10709776 | Narrative mentions across 3 PMIDs; no PHT-specific simvastatin AUC ratio. | Full-text Ucar / similar tables. |
| **phenytoin → cyclosporine** | 6529529 (Freeman 1984), 6474556 (Keown 1984 — no abstract), 12374451, 18076219, 21993569 | Freeman 1984 abstract states phenytoin "significantly reduced the maximum concentration and the area under the concentration-time curve and significantly increased total body clearance of cyclosporin" — qualitative only, no numeric magnitude. | Full-text Freeman 1984 tables. |
| **phenytoin → midazolam** | 8598183 (Backman 1996) | Pooled CBZ+PHT cohort, AUC 5.7% applies to combined group, not split per perpetrator. Already authored under CBZ alone with caveat. | Find a PHT-only crossover. |
| **phenytoin → praziquantel** | 1549207 (Bittencourt 1992), 8525397, 8149944, 9646011, 2489000 | Bittencourt abstract qualitative: "magnitude of the decrease is surprisingly high" — no numeric ratio. | Full-text Bittencourt 1992 tables. |
| **phenytoin → warfarin** (racemic) | 6723231 (Levine 1984 — no abstract), 6995091 (review), 11502527 (clinafloxacin study) | No primary PHT-as-perpetrator AUC in abstracts. Mechanism is mixed (CYP1A2 induction reduces R-warfarin CL while CYP2C9 inhibition raises S-warfarin) — single induction_factor may not capture clinical picture even with a verbatim value. | Look for stereoisomer-resolved PHT + warfarin PK. |
| **phenytoin → R-warfarin** | 14570767, 11502527, 21182487 | No abstract with PHT → R-warfarin split. | Same as above. |

### Wave 2a azole tail + induction tail — investigated, skipped (v1.1 session 7, 2026-05-11)

11 candidate pairs skipped across itraconazole / posaconazole / voriconazole / modafinil tail searches. 10 edges authored — see scripts/authoring/2026-05-11-wave-2a-azoles-induction.ts.

### Itraconazole victims — 1 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **itraconazole → fentanyl** | 30091221 (PBPK modeling, no clinical AUC), 29027194, 9924238 (not fetched within budget) | Only PBPK modeling paper indexed; no abstract-verbatim clinical crossover AUC. | Look for a fentanyl-specific itraconazole crossover (vs the alfentanil pair which IS published). |

### Posaconazole victims — 4 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **posaconazole → cyclosporine** | 17542765 (Sansone-Parsons 2007 — "necessitated dosage reductions of 14-29%" qualitative only), 37024289 (retrospective AKI study) | Empiric dose-guidance only; no AUC ratio verbatim. | Full-text Sansone-Parsons 2007 tables. |
| **posaconazole → vincristine** | 41295177 (Italian survey), 39367622, 28299646 (reviews) | No clinical PK trial abstract; case reports and reviews only. | Search for Schering-Plough NDA primary data. |
| **posaconazole → simvastatin** | 29982245 (Aspergillosis review), 27605198 (case report), 29255993 (EHR mining) | Case report + EHR mining, no controlled crossover. | Primary posa + statin clinical PK study. |
| **posaconazole → atorvastatin** | 17136234 (Gateways to Clinical Trials index — not a study), 28973247 (NOAC bleeding cohort, off-topic), 29255993 (EHR mining) | No primary clinical trial abstract indexed. | Posaconazole NDA review documents. |

### Voriconazole victims — 4 skipped (1 authored as alfentanil bonus)

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **voriconazole → omeprazole** | 14616415 (Wood 2003) | Reverse direction — measures omeprazole's effect ON voriconazole PK ("vori Cmax +15%, AUCtau +41% during omeprazole coadministration"). vori-as-perpetrator-of-omeprazole AUC NOT in abstract (although the ~4× bump is widely cited from Purkins 2003). | Full-text Purkins 2003 *Clin Ther* tables. |
| **voriconazole → warfarin** | 14616410 (Purkins 2003) | Reports PD endpoint (prothrombin-time AUEC: 3211 s·h vs 2282 s·h placebo) but not S-warfarin AUC. Cannot back-calc Ki without an AUC ratio. | Full-text Purkins 2003 PT-AUEC paper for the underlying S-warfarin AUC if it's in the tables. |
| **voriconazole → fentanyl** | 17112806 (Saari 2006 — actual paper is **alfentanil**, not fentanyl, and was authored from this same source), 22520488 (review) | Saari studied alfentanil; fentanyl-specific PK with voriconazole not located within budget. | Primary vori + fentanyl crossover. |
| **voriconazole → sirolimus** | 16635790 (Marty 2006 retrospective case series) | Empiric "90% sirolimus dose reduction" guidance from case series. No controlled AUC ratio. | Pfizer voriconazole NDA review. |
| **voriconazole → simvastatin** | 39585167, 17655375 (Ohno modeling review) | No primary clinical trial PMID located. | Search beyond modeling literature. |

### Modafinil victims — 1 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **modafinil → ethinylestradiol** | 11823757 (Robertson 2002) | Abstract qualitative only: "marked decrease in maximum observed plasma concentrations and areas under the plasma concentration-time curve for triazolam relative to placebo, with a much smaller decrease in these parameters for ethinyl estradiol". The widely-cited ~18% EE2 AUC decrease and ~59% triazolam AUC decrease live in the full text. | Full-text Robertson 2002 *Clin Pharmacol Ther* 71:46-56 tables. |

### Wave 3b Hill occupancy fill-in — investigated, skipped (v1.1 session 6, 2026-05-11)

Of 19 compounds with keo authored but no receptor_occupancy[], 11 are documented schema/mechanism misfits (already in §"Receptor occupancy — investigated, skipped" above). Of the 8 candidates with real receptor pharmacology, 7 Hill rows were authored across 3 compounds; 3 candidates skipped because the abstract-verbatim Ki rule failed.

Authored: aripiprazole 5-HT1A/2A/2C/7 (PMID:17242925), metoprolol β1-AR (PMID:10895074), nalbuphine MOR/KOR (PMID:2826773 rat brain). Apply-script: scripts/authoring/2026-05-11-wave-3b-hill-fillin.ts.

| Compound | Receptor | PMIDs chased | Why skipped |
|---|---|---|---|
| **aripiprazole** | D2 | 12065741 (Burris 2002 — actual paper; user-supplied 12404511 was wrong PMID) | Abstract describes "high affinity to both the G protein-coupled and uncoupled states" qualitatively but no verbatim Ki number. Widely-cited 0.34 nM D2 Ki lives in Lawler 1999 *Neuropsychopharmacology* tables. |
| **oxycodone** | MOR | 21215785 (Volpe 2011 FDA), 16291875, 17349996 | Volpe 2011 brackets oxycodone into "Ki = 1-100 nM" range alongside hydrocodone / diphenoxylate / alfentanil / methadone / nalbuphine / fentanyl / morphine — no individual numeric Ki for oxycodone. Others qualitative. |
| **quetiapine** | 5-HT2A / D2 / H1 / α1 | 12176106 (Kongsamut 2002), 7871032 (Saller/Salama 1993 — actual Seroquel paper, user-supplied 8104895 was wrong PMID), 11051217, 16918396, 14972080 | All abstracts describe profile qualitatively. Numeric Ki values across the receptor profile live in Saller/Salama / Kongsamut 2002 *Pharmacol Biochem Behav* tables, not abstracts. |
| **butorphanol** | MOR / KOR | 21215785 (Volpe), 12437765, 8223888, 2856939 | Volpe 2011 brackets butorphanol into "Ki < 1 nM" alongside levorphanol/oxymorphone/hydromorphone/buprenorphine/sufentanil — no individual number. |

After this session, 11 of 19 keo-but-no-Hill compounds remain — all documented mechanism misfits (precursors, mixtures, genomic receptors, voltage-dependent channels). **Hill fill-in effectively closed at its abstract-verbatim ceiling.**

### Wave 3b keo-but-no-occupancy tail — exhaustive re-sweep (2026-06-05)

A fan-out + adversarial-verification pass (two independent NCBI/GtoPdb re-fetchers per proposed value, strict no-fabrication rule) re-checked all 14 compounds that still carry `effect_compartment.keo_per_h` but no `receptor_occupancy[]`. **Zero authorable rows** — the tail is confirmed closed at its abstract-verbatim / GtoPdb ceiling, so no apply-script was written. All 14 already sit in the skip tables above; this sweep adds the evidence below.

| Compound | Evidence added this sweep |
|---|---|
| **oxycodone** | **GtoPdb path now confirmed dead:** ligand 7093's `/interactions` endpoint returns an empty array (all species), and GtoPdb's own `bioactivityComments` states it was "unable to find publicly available affinity data for this drug at its proposed molecular target" — so there is no GtoPdb-curated MOR/KOR/DOR Kᵢ to cite. Abstract path re-confirmed dead (Monory 10374926, Carliss 19463265 [Emax rank-order only], Peckham 16291875, Lalovic 16678548, Thompson 14600248 — all table/figure-only). Still gated on the Volpe 2011 full-text table (PDF_QUEUE row 16). |
| **theanine** | Re-confirmed qualitative-only — Kakuda 2002 (12596867) gives an 80–30,000× fold-range vs glutamate (uncovertible to a point value); Sebih 2017 (28511005) NMDA partial-coagonism is qualitative; Nathan 2006 (17182482) is a secondary "micromolar affinities" review. The web-circulated "329 µM" appears in no verified abstract. |
| **dsip / selank** | Re-confirmed: no `mw_g_mol` in the registry (blocks the ec50 conversion) **and** no defined receptor Kᵢ (dsip = transport/functional only; selank = Bmax/density changes + a MAO-A IC50 *range*, non-occupancy). |
| **rhodiola-rosea** | Re-confirmed extract + enzyme mechanism — van Diermen 2009 (19168123) reports only % MAO-A/B inhibition at a fixed dose; the sole numeric is rosiridin (an isolated constituent) MAO-B pIC50 5.38, an enzyme value, not receptor occupancy. |
| **levodopa** | Newly recorded above — dopamine prodrug, mechanism misfit. |

The remaining Wave 3b frontier is the **PDF_QUEUE-blocked** entries (table-only Kᵢ in paywalled full-text: oxycodone/Volpe, clozapine, lurasidone, statins, kinases, orexin antagonists, …) — these unlock only with full-text access, not from abstracts.

### Multi-CYP perpetrators (cimetidine / CBZ / phenobarbital) — investigated, skipped (Wave 2a v1.1 session 5, 2026-05-11)

10 candidate pairs investigated across cimetidine (broad inhibitor), carbamazepine (broad inducer), and phenobarbital (broad inducer). 9 edges authored in scripts/authoring/2026-05-11-wave-2a-multi-cyp.ts; 10 skips below.

### Cimetidine victims — 2 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **cimetidine → phenytoin** | 6839635 (Bartle 1983), 6617717 (Frigo 1983) | Both abstracts qualitative ("decreased clearance", "slight significant decrease") — no verbatim AUC ratio or CL%. | Full-text Bartle 1983 *Clin Pharmacol Ther* tables. |
| **cimetidine → metoprolol** | 6136626 (Klotz/Reimann 1983 review, no metoprolol number), 6849789 (Spahn 1983 — no abstract indexed), 6096071 (Kirch 1984 review — qualitative only: "elimination half-lives ... distinctly prolonged") | No abstract-verbatim AUC ratio after 3 PMIDs. Reimann 1981 not indexed under that PMID. | Full-text Reimann 1981 or Spahn 1983. |

### Carbamazepine victims — 3 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **carbamazepine → atorvastatin** | 22056838 | Mouse anticonvulsant study; brain CBZ +61% from fluvastatin — wrong direction (atorvastatin perp of CBZ). | Primary human CBZ + atorvastatin crossover. |
| **carbamazepine → warfarin** | 24612117 (case report), 18431572 (eribulin in-vitro — unrelated), 10511917 (olanzapine review) | Case report only, no AUC ratio in any abstract. Existing CBZ → warfarin note-only entry retained. | Primary CBZ + R-warfarin crossover. |
| **carbamazepine → quetiapine** | 11903482 (Spina review), 16454538 (Besag review), 11199955 (Wong — phenytoin not CBZ) | Reviews qualitative; Wong 2001 measures phenytoin, not CBZ. | Full-text Andersson 2003 *Drugs Aging* tables. |

### Phenobarbital victims — 5 skipped

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **phenobarbital → warfarin (human)** | 69705, 7205571, 1862655 (all rat in vivo or microsome), 7620838 (protein binding only), 2407422 (smoking review), 12534314 (VPA review), 9324181 (Cropp/Bussey review — no AUC numbers) | Rat-only abstracts give induction × ~3 for (S)-warfarin (Yacobi 1980) but no human abstract with AUC change. | Full-text Cropp/Bussey 1997 or older Welling/Aggeler primary clinical PK. |
| **phenobarbital → carbamazepine** | (no targeted candidate) | No PubMed abstract with verbatim CBZ AUC change under PB induction. Bidirectional autoinduction is clinical lore but not abstract-quantified. | Primary PB+CBZ pharmacokinetic study. |
| **phenobarbital → hormonal-contraceptives** | 2191822 (Back/Orme review), 17190925 (Harden review) | Reviews qualitative — "phenobarbitone, phenytoin and carbamazepine cause contraceptive failure" but no numeric AUC for phenobarbital specifically. | Full-text Back/Orme 1990 or original Mattson/Bochner data. |

### Phenytoin victims — 1 skipped (from Backman 1996 cohort caveat)

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **phenytoin → midazolam** | 8598183 (Backman 1996) | The 5.7% AUC number is for a 6-patient cohort POOLED CBZ + PHT; abstract doesn't split. Authored under CBZ (stronger CYP3A4 inducer) with cohort-mix caveat; PHT skipped to avoid double-counting. | Find a primary PHT + midazolam crossover that splits the cohort. |

### CCB-as-CYP3A4-perpetrator atorvastatin — investigated, skipped (Wave 2a v1.1 session 4, 2026-05-11)

Both verapamil and diltiazem extensively inhibit atorvastatin clearance in clinical practice (statin myopathy risk is the canonical concern), but no PubMed abstract carries a verbatim healthy-volunteer AUC ratio for either pair.

| Pair | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **verapamil → atorvastatin** | 18193210, 17941000 (Choi 2008 series) | Both papers measure atorvastatin as the perpetrator OF verapamil (reverse direction), not verapamil → atorvastatin. | Full-text or clinical Choi 2008 reverse-arm data; or a primary verapamil + atorvastatin crossover in healthy volunteers. |
| **diltiazem → atorvastatin** | 21545622 (case report), 31518878 (PBPK simulation), 24702306 (epidemiology survey) | Case report / PBPK / population epidemiology only; no controlled crossover AUC ratio in any PubMed abstract. | Primary diltiazem + atorvastatin clinical crossover. |

### Wave 3a kₑₒ — CCB / antiarrhythmic / diuretic class re-chase (2026-05-11)

Re-chased the cardiovascular classes left unexplored by v0.5-v0.6's CNS/anesthetic focus. Result: 6/6 SKIP. Same "tables-not-abstracts" pattern as the SSRI cohort (v1.0 close-out).

| Compound | PD endpoint | Best PMID | Why skipped |
|---|---|---|---|
| **verapamil** | PR interval | 1815048 (Verotta & Sheiner 1991) | Abstract names verapamil-PR application of the effect-compartment model but kₑₒ value in tables only. Also chased 3950053 (Colburn 1986), 7053427 (Keefe 1982), 26780675 (Bergenholm 2016), 4084670 (Arnold 1985). |
| **diltiazem** | PR / HR | 3201524 (Höglund 1988) | PQ-vs-log-conc regression only, no kₑₒ. Also 3375187 (Jensen 1988), 9352390 (Luckow 1997 — discusses hysteresis but no kₑₒ in abstract). |
| **sotalol** | QT | 7996391 (Uematsu 1994) | Abstract truncated at 250 words; effect-compartment model "attempted" but no number quoted. Also 11999292 (Shi 2001 pediatric — linear QTc-C only), 1846784 (Funck-Brentano 1991), 7904936 (Funck-Brentano 1993 review), 2294688 (Woosley 1990). |
| **furosemide** | natriuresis | 3999028 (Hammarlund 1985 humans) | Hill equation + tolerance discussion only. Also 3986304 (Hammarlund 1985 rat). The textbook Brater/Smith effect-compartment work for furosemide pre-dates PubMed abstract indexing of numeric parameters. |
| **amlodipine** | BP | 18490496 (Rohatagi 2008 popPK/PD) | Emax model for olmesartan + linear for amlodipine; no kₑₒ. Zero PubMed hits for "amlodipine ke0". |
| **lithium** | QT / tremor | (no candidate) | Zero PubMed hits for "lithium ke0" or "lithium effect compartment". |

Re-author target for all 6: full-text PDF retrieval of the Verotta, Jensen, Höglund, Funck-Brentano, Hammarlund papers — the kₑₒ values are in tables/results sections.

### Wave 4b re-confirmation (2026-05-11)

Re-chased the GLP-1/GIP era candidates (modern abstracts more likely to carry α + k21 than v0.5-era literature). Result: 4/4 SKIP, ceiling confirmed.

| Compound | Best popPK PMID | Verbatim in abstract | Why skipped |
|---|---|---|---|
| **semaglutide SC** | 30788808 (Overgaard 2019 *Diabetes Ther*) | "two-compartment model with first-order absorption and elimination", CL = 0.0348 L/h, Vc = 3.59 L, Vp = 4.10 L | Confirms 2-comp architecture but α + k21 not in abstract (Q and k21 = Q/Vp reserved for full-text). |
| **tirzepatide SC** | 38356317 (Schneck & Urva 2024 *CPT PSP*) | "two-compartment model with first order absorption and elimination", "half-life of tirzepatide was ~5 days" | Terminal-only t½; no α or k21 named. |
| **retatrutide SC** | 37366315 (Jastreboff 2023 *NEJM*) + Tetelbaun 2024 review (PMID:39724554) | "mean half-life of approximately 6 days" | Terminal-only; clinical efficacy paper, no popPK rate constants. |
| **insulin-glargine SC** | (no 2-comp popPK paper indexed) | — | Best hits return the existing 1-comp source PMID:31150327. No biexponential α-phase fit in any PubMed abstract. |

Re-author target: full-text Overgaard 2019, Schneck/Urva 2024, and Coskun retatrutide popPK papers. All four have established 2-comp model fits but abstracts reserve the micro-rate constants for tables.

### Wave 4b 2-compartment skips (2026-05-03)

| Compound | Why skipped | Re-author target |
|---|---|---|
| **testosterone-enanthate** | No 2-comp PK paper indexed; long IM depot is typically modeled as flip-flop 1-comp absorption-rate-limited | Search for nonlinear depot-release fits in full-text endocrinology / sports-science literature |
| **testosterone-undecanoate** | Same as enanthate — no 2-comp publication | Same |
| **paliperidone-palmitate** | Published model is 1-compartment (PMID:19725593 explicit) | n/a — leave as 1-comp |
| **nandrolone-decanoate** | DBS sampling-only PK abstracts; no compartmental fits in any indexed abstract | Full-text Korkia or Belkien 1985 if available |

For semaglutide / tirzepatide / insulin-glargine / somatropin — abstracts confirm 2-comp model use but only quote terminal kinetics (CL + V + β); α + k21 not in abstracts. Those compounds were authored as enriched 1-comp PK pending a future full-text pass for the bi-exponential coefficients.

### Wave 1a skips (2026-05-03)

| Compound | Why skipped | Re-author target |
|---|---|---|
| **ritonavir** | Searched ~25 candidate abstracts (PMIDs 9723818, 11572864, 12433819, 12698988, 17760738, 18285477, 19710077, 20660678, 22566588, 22627182, 27645244, 31643249, etc.) — all study ritonavir as a CYP3A booster paired with another PI, not standalone monotherapy PK. No PubMed abstract reports verbatim ritonavir Cmax/Tmax/AUC/t½ for monotherapy in healthy volunteers. | Pull from a full-text monotherapy paper (Hsu 1997 *Clin Pharmacokinet* 32:381 is the classic reference, but its abstract reports no numbers). |
| **1,3-butanediol** | Existing skip (see below) — same pattern: no PubMed abstract carries verbatim 1,3-BD parent PK numbers in humans. | Pull from Mah 2023 PMC10324611 full-text figures, or Münst 1981 dog full-text. |

### Wave 1a skips (2026-05-07)

| Compound | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **minocycline** | 3072140 (Saivin 1988 review — abstract qualitative only: "readily absorbed, distributed throughout the organism as a function of their lipophilicity"); 4199710 (Macdonald 1973 — title-only, no abstract); 1211910 (Welling 1975 renal-failure — no PK numbers); 788583 (Allen 1976 review — narrative); 16816396 (Agwuh 2006 — no minocycline numerics) | No indexed PubMed abstract carries verbatim F, V_d, t½, or ka for minocycline in healthy adults. The canonical numbers (F ~95-100%, t½ ~16 h, V_d ~80-115 L) live in product labels and full-text Saivin/Curtin reviews, not in any abstract. **Re-confirmed in second sweep** (2026-05-07 session 2). | Pull from full-text Saivin 1988 *Clin Pharmacokinet* or Curtin 2017. |
| **ubrogepant** | 32053714 (Blumenfeld 2020 review — "No abstract available" on PubMed, verified twice); 31899602 (Ankrom 2020 — has Tmax 2-3 h verbatim but no F/V/ka); 35174666 (Boinpally 2022 hepatic — uses "≈" prefix, not strict verbatim); 40346979 (Boinpally/Trugman 2025 — food-effect only, no absolute params); 41562504 (Boinpally 2026 mass balance — excretion %, no F); 38261231 (Japanese vs White PK — dose-proportionality only) | Canonical F ≈ 0.254, V_d ≈ 350 L, t½ 5-7 h live in FDA label and full-text Jakate/Ankrom papers, not in any abstract. Tmax verifiable but insufficient alone. **Re-confirmed in second sweep**. | Pull from FDA NDA review documents (not PubMed-indexed) or Jakate AAPS-PharmSci posters / full-text. |

### Wave 1a session 2 skips (2026-05-07) — 22 additional

The dominant pattern is "PK exists in product labels or full-text reviews, not in any indexed PubMed abstract that carries verbatim F + V_d + t½ + ka". Per the strict no-fabrication rule, all entries below are skipped pending full-text access.

#### Modern antivirals — 4

| Compound | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **tenofovir-alafenamide** | 24508897 (Markowitz 2014 — TFV metabolite Cmax/AUC only, no parent TAF F/V/t½); 23807155 (Ruane 2013 — AUCtau ratios only); 28971607 (Custodio 2017 DDI); 29649076 (Begley 2018 DDI) | Parent TAF has very short t½ (~0.5 h, rapidly hydrolyzed intracellularly). PubMed abstracts only report TFV metabolite kinetics, never parent TAF F + V + t½ + ka quartet. | Pull from full-text Custodio 2016 / Ruane 2013, or NDA submission. |
| **efavirenz** | 11477320 (HPLC assay only); 12698988 (Barrett 2002 popPK meta-analysis — "CL/F = 2.65 vs 10.2 L/h" verbatim, "intersubject variation in V/F = 85%" verbatim, but **no V/F point estimate, no t½, no ka, no absolute F**) | Population PK meta-analyses report only CV% on V/F, not point estimates. | Pull from Smith 2001 full-text. |
| **bictegravir** | 36701274 (Subramanian 2023 — qualitative "low clearance ... Vd ≈ extracellular water in nonclinical species" only) | No PubMed abstract gives numeric F/V/t½/ka for BIC. | Pull from Custodio 2017 or Tsiang 2016 full-text. |
| **velpatasvir** | 29520729 (Mogalian 2018 hepatic — AUC ratios only); 26519191 (Mogalian 2016 DDI — qualitative) | All abstracts give AUC ratios, no absolute F/V/t½. | Pull from Mogalian 2017 single-dose primary full-text. |

#### Modern oncology — 1

| Compound | PMIDs chased | Why skipped |
|---|---|---|
| **navitoclax** | 21282543 (Gandhi 2011 phase I SCLC — dose ranges + toxicity, no PK numerics in abstract); 22184378 (Roberts 2012 phase I CLL — clinical efficacy only) | Phase I oncology abstracts focus on dose-finding + toxicity; PK details are in tables of full-text only. |

#### CNS pharmaceuticals — 5

| Compound | PMIDs chased | Why skipped |
|---|---|---|
| **doxepin-low-dose** (3-6 mg insomnia) | Krystal/Roth/Yeh searches → 0 PMID matches with verbatim 3-6 mg PK; 20658801 (Weber 2010 review — qualitative); 7293791 (Virtanen 1980 — 50 mg dose: t½ 17.9 h, Vd 22.7 L/kg, F ≈ 0.29 verbatim, but at supratherapeutic dose for insomnia indication) | The low-dose 3-6 mg formulation (Silenor) has no primary PMID; full-text label-data only. The high-dose 50 mg PK from PMID:7293791 doesn't apply directly to the insomnia formulation. |
| **brexpiprazole** | 33196868 (Wong 2021 — qualitative "approximately proportional to dose", no F/V/t½ verbatim); 26261843 (Citrome 2015 review — narrative) | Phase 1 PK abstracts give EC50 for receptor occupancy, not absolute PK params. |
| **phenelzine** | 1813896 (Mallinger 1991 review — no per-drug numerics); 4066998 (Robinson 1985 — metabolite excretion %, no t½/F/V/ka) | Phenelzine PK literature is famously sparse — rapid metabolism precludes parent-drug t½ measurement; effect outlasts plasma. |
| **butalbital** | 965130 (Lavene 1976 Optalidon DDI — "no change in bioavailability ... only caffeine and butalbital show a statistically significant interaction" — qualitative only) | Other butalbital PMIDs are LC-MS methodology or case reports without verbatim PK. |
| **nadolol** | 23677858 (Misaka 2013 — "Elimination half-life ... did not differ" but **no numeric value in abstract**); 24419562 (Misaka 2014 green tea — % change only); 10381784 (Fromm 1999 quinidine DDI — no nadolol PK) | Misaka studies confirm control single-dose PK was characterized but withhold numerics in abstract; full-text required. |

#### GI / metabolic / hormone — 5

| Compound | PMIDs chased | Why skipped |
|---|---|---|
| **eluxadoline** | 25491493 (200 mg DDI — AUC ratios only); 28719721 (no numbers); 36504331 (renal-impairment cohort — "median time to Cmax was 2.5 hours" verbatim only) | Insufficient verbatim PK profile in any single abstract. |
| **dicyclomine** | Bygdeman 1981 / Rashid 1988 not retrievable as indexed PK studies | No PubMed-indexed adult human single-dose PK abstract found. |
| **sulfasalazine** | 18167504 (Yamasaki 2008 — AUC at 2 g, no F/Vd/t½ verbatim); 4402886 (Schröder 1972 — title verified but abstract not retrievable) | AUC-only data; metabolite (sulfapyridine) kinetics dominate over parent in any case. |
| **pyrantel-pamoate** | 7993990 (Fasanmade 1994 — Cmax 37.56 ng/mL, Tmax 2.02 h verbatim but no Vd/t½/F) | Drug is intentionally minimally absorbed (gut-acting antiparasitic); no IV reference exists for F calculation. |
| **testosterone-undecanoate** PO | 21474786 (Yin 2012 SEDDS — only mean serum T levels, no TU PK); 12627930 (Bagchus 2003 — Cmax/AUC of T metabolite, not TU); 14594344 (Houwing — "5-7 hours" Tmax verbatim only, no F/Vd/t½) | TU is a prodrug measured indirectly via released testosterone; F is undefined for an esterified prodrug measured as parent hormone. |

#### Research peptides — 4

| Compound | Search outcome | Why skipped |
|---|---|---|
| **semax** | esearch `semax+pharmacokinetics+human` → 0 hits. | No human PK abstract exists. Russian-published heptapeptide. |
| **n-acetyl-semax** | "N-acetyl-semax" returns PhraseNotFound on PubMed. | No abstracts at all. |
| **n-acetyl-selank** | Selank PK PMIDs (29787664, 24605419, 18695718, 18454096, 16637290) all rodent or qualitative. PMID:18695718 (Ashmarin 2008) is tritium-label rat distribution. | No human PK abstract exists for selank or its acetyl variant. |
| **setmelanotide** | 39394922 (carbocyclic analogs); 37678438 (PLGA microspheres mouse); 37990711 (review); 35119103 (PBPK); 34544109 (Med Letter, no abstract); 31100979 (mechanism review). | No phase-1 human single-dose PK abstract with verbatim F/Vd/t½. |

#### Amino-acid supplements — 3

| Compound | Search outcome | Why skipped |
|---|---|---|
| **l-glutamine** | 33648834 (4-PB), 12548294 (peds onc dose-finding), 8329004 (fluoride PK), 2619779/3415715 (loxiglumide). | Glutamine recycles via gut/liver — parent-compound PK isn't published. |
| **l-citrulline** | 17953788 (Moinard 2008 *Citrudose*) — gives ARG metabolite Tmax/Cmax verbatim, but **CIT-parent F/Vd/t½ described only qualitatively**. | The only well-known citrulline PK abstract gives only ARG-metabolite kinetics; CIT itself qualitative. |
| **n-acetylcysteine-amide** (NACA) | 41953516 (review); 32795434 (NAC trial); 31740394 (NACA mice F=67%); 29182711 (review). | Research-only NAC variant; no human PK abstract exists. |

## MW backfill state

- **335 / 456** compounds have `mw_g_mol` authored (post-Wave-0a, 2026-05-03)
- **121** still without — Wave 0a deliberately stopped here; these have no single defined MW:
  - 62 peptides (biologics, sized in residues not g/mol)
  - 21 antibodies / mAbs (~150 kDa, varies by humanization + glycosylation)
  - 20 plant adaptogens (multi-component extracts)
  - ~13 polymers / class entries / mixtures: cholestyramine, colesevelam (anion-exchange resins), insulin (protein), inclisiran (siRNA), hormonal-contraceptives (class), lions-mane (extract), tocotrienols (4-isomer mix), silymarin (6-flavonolignan mix), hyaluronic-acid (size varies), chondroitin (polymer), omega-3-epa-dha (mix), curcumin-meriva (lecithin complex), shilajit (extract), phosphatidylserine (FA-chain varies)
- These are intentionally absent. If any of them later acquires a kinetic edge or receptor occupancy block, the script's verifier will flag the lint error and that's the trigger for either authoring a representative MW or refining the registry entry into a single-component compound.

## kₑₒ — investigated, skipped (Wave 3a session 17, cardiovascular reverse-search, 2026-05-05)

Compound-by-compound reverse-search across cardiovascular drugs. Effect-compartment models exist for many of these in published full-text but the abstracts don't carry the verbatim kₑₒ value or t½(kₑₒ). Hit rate ~2% — most CV-drug kₑₒ values live in tables/figures only.

| Compound | PMIDs chased | Reason skipped |
|---|---|---|
| metoprolol | 18475202, 9519150, 2591419, 19117045, 15184276 | Effect-compartment used (esp. 9519150 reports "Keo did not differ significantly from K21" but no number); 2591419 mentions equilibration qualitatively |
| sotalol | 11999292, 11144992, 9519150, 9549633, 9801427 | Pediatric paper (11999292) used direct linear QTc model, no effect compartment; 9519150 effect-compartment but no kₑₒ number in abstract |
| propranolol | 12784321, 8647351, 24110563, 21203694, 1951741, 2614643 | None applied PK/PD effect-compartment with numeric kₑₒ in abstract |
| esmolol | 6617063 | Only one effect-compartment hit; abstract reports PK only (t½ 9.2 min), no PD kₑₒ |
| labetalol | 33210850, 7999689, 2598569 | None reported kₑₒ |
| bisoprolol | 28577178, 15863897, 2568209 | Pop PK only, no PD kₑₒ |
| verapamil | 26780675, 9772689, 1815048, 3950053, 7053427, 6160352 | Multiple effect-compartment papers (esp. Bergenholm 2016 dog PR), no kₑₒ number quoted |
| flecainide | 24140388, 15619132, 7269731, 26780675 | PKPD QRS papers but no kₑₒ in abstract |
| diltiazem | 9352390, 1489942, 3375187, 3052985 | 9352390 invokes effect-compartment but argues hysteresis is tolerance-driven |
| nicardipine | 10553821, 8201530, 8145128, 8254178, 2526593 | Francheteau 1993 (8145128) uses effect compartment for nicardipine TPR but no kₑₒ in abstract |
| amlodipine | 27504853, 24522199, 18490496, 9052891 | Heo 2016 (27504853) describes "effect compartment delay" for SBP/DBP but no kₑₒ |
| nifedipine | 20980409, 18806627, 9796373, 9125622 | No kₑₒ in abstracts |
| losartan | 22076447, 12640335, 9453330, 8386485 | 22076447 uses effect compartment linking PRA→BP but no kₑₒ in abstract |
| captopril, ramipril, enalapril, lisinopril, perindopril, benazepril | various | No abstract-verbatim kₑₒ |
| valsartan, candesartan, olmesartan, irbesartan, telmisartan | various | No abstract-verbatim kₑₒ |
| ibutilide | 28624123, 22045830 | Effect-compartment Emax used; no kₑₒ in abstract |
| dronedarone, propafenone, mexiletine, lidocaine | various | No abstract-verbatim kₑₒ |
| furosemide, bumetanide, torsemide, hydrochlorothiazide, spironolactone, eplerenone | various | Diuretic PK/PD typically uses indirect-response model, not effect-compartment |
| hydralazine, minoxidil, nitroglycerin, isosorbide-mononitrate | various | No effect-compartment kₑₒ in abstracts |
| nebivolol | n/a | No PK/PD effect-compartment papers indexed |

## kₑₒ — analgesics + sleep/benzodiazepine + miscellaneous reverse-search (Wave 3a session 20, 2026-05-08)

Targeted reverse-search across 15 compounds (5 opioids, 5 benzodiazepine/sleep, 5 misc analgesic-adjacent). Method: PubMed efetch + WebSearch with literal tokens `"ke0"`, `"t1/2,ke0"`, `"keo"`, `"effect compartment"`, `"equilibration half-life"`. Strict no-fabrication rule.

**Result: 1 of 15 newly authored** (morphine citation upgrade), **7 already authored**, **7 skipped** (consistent with prior CNS gap pattern).

### Already authored — verified during this session

| Compound | Current kₑₒ (h⁻¹) | Source PMID | Endpoint | Status |
|---|---|---|---|---|
| morphine | **upgraded 2.58 → 0.248** | **PMID:12545149** (Skarke 2003 Clin Pharmacol Ther) | Human pupil diameter, "transfer half-life… 2.8 hours for pupil diameter" | Replaces prior rat-EEG citation (Groenendaal 2008 PMID:18467078) with the canonical human PK/PD reference. Lötsch 2005 review (PMID:15907650) and Lötsch 2001 M6G paper (PMID:11748388, range 1.8-4.4 h) corroborate. |
| lorazepam | 4.73 | PMID:10966246 (Greenblatt 2000 Crit Care Med) | EEG 13-30 Hz, t½kₑₒ 8.8 min | Already authored — verified as canonical IV-bolus human study. Gupta 1990 (PMID:2348383) reports oral t½kₑₒ 0.43 h for psychomotor (slower, oral-route surrogate); IV/EEG number is the better PK-PD anchor. |
| diazepam | 25.99 | PMID:2225714 | EEG, IV human, t½kₑₒ 1.6 min | Already authored. |
| methadone | 2.6 | PMID:15089813 | Miosis, oral, abstract verbatim "k(e0) … 2.6 ± 2.6 h⁻¹" | Already authored. Inturrisi 1990 (PMID:2188771) qualitatively describes "very rapid equilibration" but no numeric kₑₒ in abstract. |
| oxycodone | 5.78 | PMID:16729270 | Sheep brain:blood, t½ 7.2 min | Already authored. Lalovic 2006 (PMID:16678548) human pupil PK-PD modelling exists but no kₑₒ in abstract. Dari 2021 (PMID:33515201) MBMA gives IC50 26.5 ng/mL but kₑₒ in tables only. |
| tramadol | 0.389 | PMID:30117229 | Pediatric post-T&A, t½kₑₒ 1.78 h | Already authored. |
| pregabalin | 0.552 | PMID:11554426 | Rat brain ECF microdialysis, anticonvulsant | Already authored. |

### Newly investigated, skipped — abstract-only ceiling

| Compound | Endpoint chased | PMIDs reviewed | Reason skipped |
|---|---|---|---|
| **hydrocodone** | Miosis / analgesia / abuse-liability | 26814240 (intranasal HYD ER pupillometry — Cmax/Tmax/MPC qualitative, no kₑₒ); 29723441 (PK-PD correlations — abuse-liability "drug liking" maximum, no kₑₒ); Hysingla NDA 206627 doc found on FDA accessdata but not PubMed-indexed | No PubMed abstract carries hydrocodone kₑₒ. Per existing GAPS line item, the value lives in the Hysingla ER NDA Clinical Pharmacology Review (off-PubMed). Re-confirmed. |
| **zolpidem** | EEG / SPV / sleep | 19648220 (de Haas 2010 — abstract gives Tmax 0.78 h, t½ 2.2 h, sigmoid Emax + transit-tolerance models, but **no kₑₒ in abstract**); 12604703 (rat); 17907263 (sublingual, 1.75 mg, daytime, no kₑₒ); Wilson 1997 IV PMID:7846196 not retrievable as full-PK abstract | Population PK/PD analysis exists (PMC12945925) but not abstract-verbatim. The widely-cited zolpidem kₑₒ values from de Haas / Mandema-style PK/PD modelling live in tables/figures of full-text. |
| **eszopiclone** | EEG / sedation | FDA NDA 21476 Clinical Pharmacology Review (off-PubMed); no abstract reports kₑₒ; review papers (PMC2655082, PMC1325284) qualitative only | No PubMed abstract carries kₑₒ. The 1-compartment population PK model with first-order absorption is in the FDA NDA review, not on PubMed. |
| **clonazepam** | EEG / saccadic peak velocity | 6403345 (Ståhl 1983 — pediatric petit mal, qualitative EEG/clinical correlation, no PK-PD model); 1704837 (event-related potentials — qualitative); 2689183 (clobazam+clonazepam saccadic — peak velocity reduced, no kₑₒ model) | No PubMed abstract carries clonazepam kₑₒ. Long-half-life benzodiazepine — kₑₒ studies likely don't exist as effect kinetics are dominated by elimination half-life (~39 h). |
| **sumatriptan** | Headache / MCAv vasoconstriction | 9987697 (Fullerton NTG-headache PD — qualitative); 8873693 (Visser 1996 — recurrence vs response, no kₑₒ); 1379152, 23228070 (review); two-compartment PK/indirect-effects PD model exists for MCAv per ScienceDirect summary but no kₑₒ in PubMed abstract | No PubMed abstract carries sumatriptan kₑₒ. The MCAv model is indirect-response (vasoconstriction kinetics), not classical biophase. Migraine "headache resolved" endpoint is binary/categorical and resists biophase modelling. |
| **rimegepant** | Migraine relief / CGRP-R | 40614133, 37282507, 36739335, 31100979 — all PK reviews, no PD effect-compartment | No PubMed abstract carries rimegepant kₑₒ. Migraine binary endpoint problem same as sumatriptan; ubrogepant has same gap. |
| **gabapentin** | Anticonvulsant / analgesia | 26780452 (CFA hyperalgesia rat — exists in PMC but no kₑₒ in abstract); 32537149, 20818832 (gabapentinoid PK reviews — qualitative); 41908817 (OCT2 PK-PD — gives ke1 fold-change, not absolute kₑₒ) | No PubMed abstract carries gabapentin kₑₒ. Saturable absorption (LAT1) and slow tonic anticonvulsant onset confound classical biophase modelling. Pregabalin already authored from same research group's rat brain ECF paper. |
| **baclofen** | Spasticity / GABA-B | 27099877 (Heetla 2016 ITB — gives EC50 194 µg/L CSF and CSF concentration gradient, no kₑₒ in abstract); 11225954, 28233010 (oral PK reviews, qualitative); 2336342 (oral multi-dose PK, terminal t½ 4.5 h, no kₑₒ) | No PubMed abstract carries baclofen kₑₒ. The Heetla ITB model uses CSF concentration directly as effect-site (no separate biophase compartment) — kₑₒ in classical sense doesn't apply for intrathecal route. Oral baclofen biophase delay would need a full-text fit. |

### Pattern confirmation

This session re-confirms the prior CNS-gap finding: among 15 analgesia + sleep + migraine compounds investigated, the **only abstract-verbatim kₑₒ values** belong to (1) opioids modelled via pupillometry/EEG with a Lötsch-Skarke-style PK/PD design, (2) benzodiazepines modelled via Greenblatt-style EEG-β analysis, (3) tramadol's pediatric T&A study (PMID:30117229), (4) pregabalin's rat ECF anticonvulsant study (PMID:11554426). All other compounds in this catalog (zolpidem, eszopiclone, clonazepam, hydrocodone, sumatriptan, rimegepant, gabapentin, baclofen) require full-text retrieval to author kₑₒ. No fabrications attempted.

The morphine citation upgrade (PMID:18467078 rat-EEG → PMID:12545149 human pupil) is the one substantive change from this session: the prior rat number (kₑₒ = 2.58 /h) was approximately an order of magnitude faster than the human number (0.248 /h), which materially affects respiratory-depression / miosis time-course simulation. The human Skarke 2003 number is the canonical anchor.

## kₑₒ — investigated, skipped (Wave 3a session 19, CV re-confirm + DOACs/statins, 2026-05-08)

Targeted re-pass over the cardiovascular gap list focusing on β-blockers, ACEi/ARB, CCBs, statins, and DOACs to confirm whether any abstract-verbatim kₑₒ exists. Method: PubMed esearch using the literal tokens `"ke0"`, `"keo"`, `"t1/2ke0"`, `"t1/2keo"`, `"effect compartment"`, `"equilibration half-life"`, `"hysteresis"` against each compound. NCBI E-utilities efetch for every promising hit.

Result: **zero new authored kₑₒ across 11 compounds**. Hit rate matches prior session-17 pattern.

| Compound | Endpoint | PMIDs re-confirmed (2026-05-08) | Reason skipped |
|---|---|---|---|
| **propranolol** | HR / BP | 10945878 (Brynne 2000 SHR exercise — effect-comp model used, no kₑₒ in abstract); 3000793 (Wellstein 1985 — argues "concentrations of antagonist present in plasma are representative of the concentrations in the effect compartment", i.e. effectively no biophase delay, but quotes no kₑₒ); 8496815 (Takahashi 1993 — qualitative anticlockwise hysteresis only) | No abstract-verbatim kₑₒ. The Wellstein observation (plasma ≈ effect site) suggests propranolol's apparent biophase delay is small and dominated by β1-receptor binding/unbinding kinetics rather than diffusion. |
| **metoprolol** | HR / BP | 18475202 (Di Verniero 2008 fructose rat — effect-comp model, no kₑₒ); 16125622 (Höcht 2005 microdialysis SO/ACo rat — "good association between concentrations of metoprolol in the effect compartment and the corresponding hypotensive effect" but no kₑₒ); 4005128 (Good 1985 Oros) | No abstract-verbatim kₑₒ. Both rat microdialysis papers from the Höcht/Taira group exist but withhold the kₑₒ from abstracts. |
| **bisoprolol** | HR / BP | 38096536 (off-topic); 1983104 (melanin binding); 28577178, 15863897, 2568209 (re-confirm session-17 negative) | No abstract-verbatim kₑₒ. |
| **lisinopril** | ACE inhibition / BP | All previously-chased PMIDs from session 17; targeted `"ke0"` query → 0 hits | No abstract-verbatim kₑₒ. Lisinopril's tight ACE binding (slow off-rate) means classical biophase model probably doesn't fit cleanly — ACE inhibition kinetics dominate, not biophase distribution. |
| **losartan** | BP / AT1 / PRA | 22076447 re-confirmed (effect-comp linking PRA→BP, no kₑₒ); `"ke0"` query → 0 hits | No abstract-verbatim kₑₒ. |
| **amlodipine** | BP | 27504853 (Heo 2016 — describes "effect compartment delay" for SBP/DBP, no kₑₒ); 21896142; `"ke0"` query → 0 hits | No abstract-verbatim kₑₒ. Amlodipine's slow onset of action (8-12 h to peak BP effect) makes it the most kₑₒ-relevant CCB but the literature still puts the value in tables only. |
| **atorvastatin** | LDL | `"effect compartment"+"ke0"+atorvastatin` → 0 hits | LDL endpoint is 1-4 weeks scale → indirect-response (turnover) model, not biophase. kₑₒ does not fit conceptually. |
| **rosuvastatin** | LDL | Same as atorvastatin — 0 hits | Same — LDL turnover, not biophase delay. |
| **warfarin** | INR / PT | 3542339 (Holford 1986 — gives prothrombin complex synthesis 5%/h and elimination t½ 17 h; these are kdeg of the indirect-response/turnover model, NOT a kₑₒ); 27763679 (Xue 2017 — Holford theory-based PD model, sigmoid Emax on PCA synthesis inhibition, no biophase compartment); 26837174 (Lin 2015 — names symbolic K(E0) parameter but withholds the numeric value in abstract) | The famous "warfarin t½kₑₒ ≈ 3-5 days" cited in textbooks is actually the **prothrombin complex degradation half-life** (kdeg ~17 h per Holford 1986) within an **indirect-response turnover model**. It is not a biophase kₑₒ in the classical Hull/Sheiner sense and does not fit the v8 schema's `effect_compartment.keo_per_h` slot. Skip. |
| **apixaban** | anti-FXa | 28547774 (Byon 2017 popPK/PD — "relationship between apixaban concentration and anti-FXa activity was described by a linear model with a slope estimate of 0.0159 IU/ng"); `"ke0"` query → 0 hits | DOAC anti-Xa effect tracks plasma directly with no biophase delay (the FXa target is in plasma, not behind a tissue barrier). Linear PD, no kₑₒ. |
| **rivaroxaban** | anti-FXa | `"ke0"` query → 0 hits; standard popPK/PD literature uses linear concentration-effect or Emax with no biophase | Same as apixaban — anti-Xa is in plasma compartment, no biophase delay. |

### Structural notes — schema-fit issues

- **Warfarin / DOACs / statins**: even if kₑₒ values existed in full-text, three of these compounds have endpoints whose dynamics are dominated by mechanisms other than biophase distribution:
  - warfarin: factor-synthesis turnover (indirect response)
  - apixaban / rivaroxaban: target is in plasma, no biophase
  - atorvastatin / rosuvastatin: LDL turnover (indirect response)
  - The v8 `effect_compartment.keo_per_h` slot encodes a Hull/Sheiner biophase first-order rate. Forcing it onto these compounds would be a model misfit, not just a missing-citation.
- **β-blockers (propranolol/metoprolol/bisoprolol)**: HR endpoint is a clean fit for biophase modeling and the values ought to exist in full-text PK/PD studies (Wellstein 1985 full-text, Höcht/Taira microdialysis full-text). Re-author when full-text accessible. The atenolol entry (rat HR, PMID:17420778) and carvedilol entry (human MAP, PMID:19545060) currently anchor the β-blocker class as kₑₒ surrogates for any β1-blockade endpoint in the solver.

## kₑₒ — investigated, skipped (Round 2/3 reverse-search, 2026-05-05)

### CNS / psychiatric / antiseizure / migraine — abstract-only ceiling

CNS PK/PD literature is rich but abstract space is dominated by EC50/IC50/Cmax/AUC numbers, not kₑₒ. Hit rate ~1/50 (only pregabalin already authored). The following catalog targets had effect-compartment / hysteresis / PK/PD modeling papers but **no abstract carries a verbatim numeric kₑₒ or t½(kₑₒ)** — values live in tables/figures of full-text only.

| Compound | PMIDs reviewed |
|---|---|
| donepezil | 9839760 (explicitly "no hysteresis"), 26014587, 32440098, 36810198, 15341532, 22167216, 29522770, 30844374, 33164988, 34194293, 29170853, 14520164, 22974558, 19639304, 20504913, 10490892, 33546570, 34822784 |
| ondansetron | 18648229 (Charbit QT, qualitative), 24486335, 12608887, 38709223 (dog QT, qualitative), 41284044, 39726772, 40768016 |
| methylphenidate | 8888377, 9434281 (rat MPD/DA — no kₑₒ), 10511066 (Swanson tolerance — no kₑₒ), 36930337 |
| aripiprazole | 22186667 (PET PK/PD — gives EC50 only) |
| paliperidone, risperidone | 10435394 (risperidone EEG with Ce model — no numeric kₑₒ) |
| duloxetine | 22235148 (rat SERT/NET PK-PD — uses effect compartment but no numeric kₑₒ) |
| gabapentin | 41908817 (OCT2 PK-PD — gives ke1 fold-change but no absolute kₑₒ) |
| lamotrigine | 41213085, 41137852, 40468679, 40261588, 38467356, 26899987, 26808313, 28449218, 28766701, 30707894, 31353861, 31875924, 24997072, 24908562, 24905515 |
| topiramate | 39836249, 37798835, 37597080, 34255318, 33997398 |
| memantine | 41713228, 41572710, 41347550, 39231845, 37734258, 37523676, 35606598 |
| galantamine, rivastigmine | 38582413, 36761834, 36770702, 35969197, 35606598, 31826316, 35624580, 24801995, 21148081 |
| levetiracetam | 41933112 et seq. |
| zonisamide | 19845738, 19346673, 12376161, 9134537, 8831258 |
| sumatriptan, rizatriptan, eletriptan, almotriptan, frovatriptan, naratriptan, zolmitriptan, ubrogepant, rimegepant | "effect compartment" queries: 0 hits |
| atomoxetine, lisdexamfetamine, dextroamphetamine, mixed-amphetamine-salts | "effect compartment" queries: 0 hits |
| brexpiprazole, cariprazine, lurasidone, asenapine, lumateperone, pimavanserin | "effect compartment" queries: 0 hits |
| suvorexant, lemborexant, daridorexant | "effect compartment" queries: 0 hits |
| aprepitant, granisetron, palonosetron | "effect compartment" queries: 0 hits |
| oxcarbazepine, eslicarbazepine, perampanel, brivaracetam, ethosuximide, primidone | "effect compartment" queries: 0 hits |
| bupropion, mirtazapine, trazodone, vortioxetine, vilazodone, agomelatine, milnacipran | no abstract-verbatim kₑₒ |
| lithium, doxepin (low-dose) | not searchable / unlikely to have published kₑₒ |

### Opioid analgesics — abstract-only ceiling

| Compound | PMIDs reviewed | Notes |
|---|---|---|
| codeine | 17786418 (dihydrocodeine — different compound), 11453888, 19281600, 21995512, 9061102, 33515201 | Dihydrocodeine has verbatim t½(ke0) = 21.1 / 19.8 min for pupillary endpoint, but dihydrocodeine isn't in catalog and codeine isn't dihydrocodeine. |
| hydrocodone | 23719682 (pop-PK only), 26814240 (pupillometry — no kₑₒ in abstract) | Likely in Hysingla ER NDA review (FDA reviewer doc, off-PubMed). |
| tapentadol | 20383344, 22618801, 27853999, 33706636, 33262645, 36203787, 31686902, 26798023, 20818833, 40349928 | All Janssen pop-PK papers; no kₑₒ in any abstract. Likely in Nucynta NDA review (FDA reviewer doc). |
| oxymorphone | 21995512, 21439215, 22618801, 9061102 | PK-only or qualitative. |
| ~~butorphanol, nalbuphine~~ | ~~18467078 (Groenendaal 2008)~~ | **Closed 2026-05-05 (Wave 3a session 18)** — full-text PDF retrieved, Table 4 + §3.4 prose name verbatim values: butorphanol k1e=ke1=0.21 min⁻¹ → 12.6 /h, nalbuphine k1e=ke1=0.20 min⁻¹ → 12.0 /h. Both authored. |
| naltrexone | 22079773 (XR-NTX pupil blockade duration — no kₑₒ fit), 29979903 (review) | |
| pentazocine | 10336527 (only PubMed match — single record) | |
| loperamide | 39866059, 33461384, 21113482, 20396687, 19372478, 14988754 | No effect-compartment papers indexed. Peripherally-restricted opioid; GI motility kₑₒ would need indirect-response modeling, not classical biophase. |

## CYP3A4 macrolide pairs — investigated, skipped (Wave 2a session 10, 2026-05-05)

| Pair | PMIDs chased | Reason skipped |
|---|---|---|
| **clarithromycin → lovastatin** | 17655375 (Ohno review), Neuvonen 8689812 (itraconazole, wrong perpetrator) | No primary clinical PK abstract with verbatim AUC fold-change. Lovastatin's CYP3A metabolism mirrors simvastatin; clari→simva 10× AUC (PMID:15518608 supportive) implies similar magnitude but no direct clari+lova PK paper indexed. Author from full-text or treat by simvastatin analogy. |
| **clarithromycin → cyclosporine** | 24189617 (dog), 25099737 (feline tacrolimus), 33126910 (COVID protocol) | No human clinical PK abstract with verbatim AUC fold-change retrieved. |
| **clarithromycin → alfentanil** | 30091221, 27435752 (PBPK with maraviroc/atazanavir) | No clari+alfentanil-specific clinical PK paper found. |
| **clarithromycin → quetiapine** | 25580921 (NMS case), 19952877 (statin-quetiapine), 35124852 (Danish cohort HR=1.7) | Only case reports + epidemiology; no PK study with verbatim AUC. |
| **clarithromycin → carbamazepine** | 30669042, 24114622 | No abstract with verbatim AUC fold-change. |
| **erythromycin → atorvastatin** | 27858342, 36592146 (PBPK/review) | No primary clinical PK abstract with verbatim AUC fold-change. |
| **erythromycin → lovastatin** | broad search | No specific abstract with verbatim AUC fold-change. |
| **erythromycin → colchicine** | 23462027 (Davis/Wason — quotes erythromycin only as "moderate inhibitor" qualitatively) | No verbatim ery+colchicine AUC numbers in any abstract. |
| **erythromycin → fentanyl** | 12847388 (pediatric ICU pop-PK, ery patient excluded), 21112467 (diltiazem case report), 8439020 (Bartkowski sufentanil — negative) | No clean clinical fentanyl+erythromycin PK abstract with verbatim AUC. |
| **erythromycin → quetiapine** | 35124852 (clarithromycin not erythromycin), 19067264 | No clinical PK study located. |
| **erythromycin → carbamazepine** | 3945037 (Wroblewski 1986 — qualitative "doubled or tripled previous steady-state concentrations") | Borderline verbatim but range, not single-value AUC ratio. |

## Full-text PDFs to retrieve

These targets are abstract-blocked but have verbatim values in full-text body / tables. Each PDF unlocks the listed entries. Process: save PDF locally, render to PNGs via PyMuPDF (`python -c "import fitz; ..."`), Claude vision-reads pages, author per the PLAYBOOK. Listed roughly in descending value-per-PDF.

| # | Source | Where to find | Unlocks |
|---|---|---|---|
| 1 | **Hysingla ER NDA 206627 — Clinical Pharmacology Biopharmaceutics Review** | accessdata.fda.gov/scripts/cder/daf/ → search "Hysingla ER" → Approval History → Clinical Pharmacology Review PDF | hydrocodone kₑₒ (analgesia / pupillometry endpoint) — pairs with already-verified MOR Ki 19.8 nM (PMID:1851921) to unlock Wave-3b receptor occupancy in same session |
| 2 | **Nucynta NDA 022304 (IR) and 200533 (ER) — Clinical Pharmacology Reviews** | accessdata.fda.gov/scripts/cder/daf/ → search "Nucynta" → both NDAs | tapentadol kₑₒ + possibly MOR + NRI binding parameters |
| 3 | **Olkkola 1992** *Anesthesiology* — erythromycin + oral alfentanil interaction | journals.lww.com/anesthesiology archives or institutional access; look up via PubMed for exact PMID | Refines erythromycin → alfentanil oral-route Ki (currently 8.8 µM IV-only from PMID:2501060 in Wave 2a session 10) |
| 4 | **Wessler 2013** *J Cardiovasc Pharmacol Ther* — colchicine ↔ cyclosporine review with primary Kis | PubMed / direct journal | Closes 2 AUTHORING_GAPS rows: colchicine→cyclosporine + reverse direction (P-gp + weak CYP3A4 axis) |
| 5 | **Bertelsen 2003 / Venkatakrishnan papers** — paroxetine CYP2D6 mechanism-based inactivator K_I | PubMed | Closes paroxetine→tamoxifen GAPS row |
| 6 | **Mai 2004** *Clin Pharmacol Ther* — full data on SJW→cyclosporine if needing higher resolution | already authored from abstract; full-text would refine | Optional refinement |
| 7 | **Owens 1997 / Tatsumi 1997** *Eur J Pharmacol* — SSRI hSERT Ki tables | PubMed/journal archive | Closes fluoxetine/sertraline/paroxetine/citalopram SERT occupancy rows (currently in AUTHORING_GAPS receptor-occupancy section) |
| 8 | **Smith & Teitler 1999 / Hoffmann 2004 / Baker 2005** — β1/β2 selectivity tables | PubMed/journal archive | Closes propranolol/metoprolol/bisoprolol/nebivolol/carvedilol β1+β2 occupancy rows |
| 9 | **Tatsumi 1997 / Bymaster 2001** — duloxetine, venlafaxine, vortioxetine SERT/NET Ki | PubMed/journal archive | Combined with kₑₒ from a TQT study, unlocks SNRI occupancy |

When any of these PDFs is retrieved and saved on disk, follow the Groenendaal flow (commit `60d40ab` is the worked example): render to PNGs, vision-read, author one dated apply-script per session.

## CYP perpetrator pairs — investigated, skipped (Wave 2 session 11, 2026-05-05)

### Ritonavir → CYP3A4 victims (single-agent literature is sparse)

Most ritonavir DDI literature is for boosted-PI co-administration (RTV/LPV, RTV/ATV, etc.) where attribution to RTV alone is impossible.

| Pair | PMIDs chased | Reason skipped |
|---|---|---|
| **ritonavir → cyclosporine** | 27310199 (3D regimen, not isolated RTV), 15618725 (Frassetto NFV/IND only, no RTV) | No abstract reports verbatim CsA AUC ratio with single-agent RTV. |
| **ritonavir → tadalafil** | 21209236 (TPV/r 500/200 combo, not pure RTV) | No clean RTV-only abstract. |
| **ritonavir → triazolam** | 10440454 (Greenblatt 1999 editorial, no quantitative numbers) | No companion full-PK paper for triazolam in PubMed with verbatim fold-change. |
| **ritonavir → colchicine** | 21480191 | Abstract reports ">125%" pooled across CYP3A4/Pgp inhibitors, no verbatim ritonavir-specific AUC. |
| **ritonavir → diazepam** | 10668858 (review only) | No primary RTV+diazepam DDI abstract found. |
| **ritonavir → quetiapine** | 20201782 (single overdose case report) | No controlled DDI with AUC ratio. |
| **ritonavir → aripiprazole** | 27747685, 20978219 (case reports) | No AUC ratios. |
| **ritonavir → carbamazepine** | 25646891 (CBZ as perpetrator, not victim) | Reverse direction only. |

### Amiodarone → multi-CYP victims (older literature, often case reports / reviews only)

Pre-modern PK literature; many landmark amiodarone interactions documented as case series without controlled AUC fold-changes in abstracts.

| Pair | PMIDs chased | Reason skipped |
|---|---|---|
| **amiodarone → cyclosporine** | 16911499 (peds case report), 23433924 (analytical chem) | Mamprin 1992 not in PubMed with abstract; only case-series narrative. |
| **amiodarone → lidocaine** | 22218697, 12534486, 12499648, 11939645 | Reviews and case reports only. |
| **amiodarone → quinidine** | 7766341, 8801060 (in-vitro only), 11185636, 6529130 | No controlled human PK with verbatim fold-change. |
| **amiodarone → propafenone** | 11185636, 1636581, 7475046 | No human PK with verbatim fold-change. |
| **amiodarone → atorvastatin** | 23784266, 21811004 | Becquemont 2007 (PMID:17301736) studied simva + prava only, not atorva. |
| **amiodarone → fentanyl** | 18334037, 15200190, 11261905, 8209981 | Anesthesia case reports / reviews only. |
| **amiodarone → carbamazepine** | 29329017 (mouse PD model — "concentrations not changed") | No human PK with verbatim fold-change. |
| **amiodarone → phenytoin** | 8792056 (review), 14962511 (equine), 2692490 | Classic Nolan 1989/1990 not retrievable as PubMed abstract via efetch. |

## CYP perpetrator pairs — investigated, skipped (Wave 2 session 12, 2026-05-05)

### Fluconazole CYP2C9/3A4 victims

| Pair | PMIDs chased | Reason skipped |
|---|---|---|
| **fluconazole → glipizide** | 1299999 (French case report), 20698928 (epi), 20592722 (case-control OR) | No primary PK abstract with verbatim AUC fold-change. |
| **fluconazole → glyburide** | 10213526, 12913062, 24375601 | No primary PK study found. |
| **fluconazole → simvastatin** | 11005703, 24038065, 10709776 (all reviews/registry) | No primary PK trial with verbatim AUC fold-change. |

### Paroxetine CYP2D6 victims (TDI/MBI inhibitor)

| Pair | PMIDs chased | Reason skipped |
|---|---|---|
| **paroxetine → dextromethorphan** | 9617978 (Ozdemir), 11910262 (Liston), 10519458 (Avenoso) | All report DXM/dextrorphan urinary metabolic ratios — no plasma AUC fold-change. |
| **paroxetine → propranolol** | (broad search) | No primary clinical PK abstract with paroxetine + propranolol AUC. |
| **paroxetine → codeine** | 15530129 (Lötsch review) | No primary paroxetine + codeine AUC study indexed with verbatim numbers. |
| **paroxetine → galantamine** | 20156150 (Huang review) | Cites label data ("40% increase") not primary study; FDA-label primary study unpublished. |

### Bupropion CYP2D6 victims (sparser literature than paroxetine)

| Pair | PMIDs chased | Reason skipped |
|---|---|---|
| **bupropion → metoprolol** | 14512481, 11302931 (paroxetine in vitro), 24088256, 26357656, 32342526 (Shin retrospective HR=1.53, no AUC) | No primary clinical bupropion+metoprolol PK abstract with verbatim AUC. |
| **bupropion → propafenone** | 28520381, 30484705, 9656983, 10917404, 2579063 | None have bupropion+propafenone clinical AUC. |
| **bupropion → tamoxifen** | 28074989, 24635399 (review/registry) | Classify bupropion only as "moderate" CYP2D6 inhibitor; no verbatim endoxifen fold-change. |
| **bupropion → venlafaxine** | 22487138, 32067562, 35911243, 33905640, 34798832 | No primary PK abstract with verbatim ODV/venlafaxine AUC. |
| **bupropion → duloxetine, tramadol, codeine** | various | Case reports / review series only. |
| **bupropion → dextromethorphan** | 15876900 (Kotlyar 2005, urinary MR phenotype-conversion) | Reports MR not AUC — Ki not back-calculable per strict rule, though phenotype evidence strong. |

## MM elimination — investigated, skipped (Wave 4a, 2026-05-07)

The single-pathway blocker was removed 2026-07-11 (Backlog E6): the solver gained
`mm_linear_ke_hr`, a first-order pathway running in parallel with the saturable
MM one. **Acetaminophen is now authored** (see below). Aspirin still needs the
parent→metabolite half of E6.

| Compound | PMID(s) chased | Status | Re-author target |
|---|---|---|---|
| **aspirin** | PMID:6713771 (Günsberg 1984 — SALICYLURATE pathway Vm 57.3→71.4 mg/hr, Km 5.5-17.2 mg/L total; author confirmed Günsberg not Bochner); PMID:7437270 (Levy 1980 — aspirin rapidly/completely → salicylate, fm≈1, qualitative); MW 138.12 (PubChem CID 338) | **Structural blockers CLEARED; data deferred (no-fabrication).** Both E6 halves now exist — the parallel-pathway field (`mm_linear_ke_hr`) AND the parent→metabolite compartment (`Compound.metabolites` + solver metabolite.ts, 2026-07-11). What's missing is abstract-verifiable salicylate PK: a 2026-07-11 research pass found salicylate's **Vd** (review-level only, no primary abstract), the **pathway split** (Levy 1965 PMID:5862532 — no abstract), and the **parallel-term / 2nd saturable Vmax/Km** (Levy 1972 PMID:4552824 — no abstract) are full-text-only, and the split is dose-dependent (SUA 75%→22% across doses). Authoring a precise two-pathway salicylate now would be false precision. | Author a `salicylate` compound with `aspirin.metabolites = [{slug:'salicylate', fraction:~1}]` once the salicylate PK (Vd + salicylurate MM + parallel/2nd-saturable pathway) is pulled from full-text Levy 1965/1972 + Günsberg. Günsberg's SUA Vmax/Km is the saturable arm; it's per-patient mg/hr so needs Vd to convert to mg/L/hr. |
| **acetaminophen** | PMID:18759860 (Reith 2009); PMID:25342929 (Allegaert 2014 CL); PMID:3829578 (Slattery 1987 dose-dependence) | ✅ **Authored 2026-07-11** (2026-07-11-acetaminophen-parallel-mm.ts). Reith fits BOTH pathways: sulphation as saturable MM (Vmax 1.94 mg/L/h, Km 14.66 mg/L) + glucuronidation (Vmax_gluc 0.97 mmol/h/kg, Km_gluc 6.89 mmol/L ≈ 1041 mg/L ≫ Cp → first-order, kL = Vmax_gluc/Km_gluc = 0.164/h). The two pathways independently reproduce the cited therapeutic t½ 2.34 h / CL 17.8 L/h (no back-calibration) and give the documented dose-dependent half-life extension (2.4 h @325 mg → 3.1 h @4 g). | — done — |

## CYP3A4 ketoconazole victim Ki — investigated, skipped (Wave 2a, 2026-05-07)

Existing ketoconazole edges authored: cyclosporine (Ki=1.4 µM, PMID:7628178), midazolam (Ki=0.43 µM, PMID:8181191). Wave 2a added: triazolam (Ki=0.015 µM, PMID:21235585), alprazolam (Ki=0.046 µM, PMID:7946933), sildenafil (Ki=0.015 µM, PMID:10725306), nifedipine (Ki=0.015 µM, PMID:21235585).

The 5 victims below were investigated but no PubMed abstract carries a verbatim ketoconazole-specific µM Ki. The pattern: clinical KZ ↔ statin/tacrolimus/fentanyl/felodipine literature is in-vivo AUC-ratio (Neuvonen-style) or table-only in-vitro work; the µM number doesn't make it into abstracts.

| Victim | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **simvastatin** | 9321523 (Prueksaritanont 1997 — names Ki for SIM as inhibitor of MDZ, not as KZ-victim); 10215754 (Prueksaritanont 1999 — KZ "<1 µM" only); 17655375 (Ohno 2007 — clinical AUC framework) | KZ Ki on SIM-acid formation reported in tables, not abstracts. | Pull from Prueksaritanont 1997 *Drug Metab Dispos* full-text tables. |
| **atorvastatin** | 23293300 (Chu 2013 boceprevir — KZ as positive control only); 24671957 (Chang 2014 — mouse only); 20642444 (Zambon 2010 — cassette IC50, no abstract value) | No abstract names KZ Ki against ATV specifically. | Pull from full-text in-vitro CYP3A4 studies. |
| **tacrolimus** | 22106961 (Zhang 2011 — rank-order only); 8689938 (Lampen 1995 — 15-inhibitor list, no µM); 15570183 (Picard 2004 — qualitative); 14979613 (Haehner 2004 — TAC as inhibitor of nifedipine, not victim) | KZ Ki on TAC-13-O-demethylation in tables only. | Pull from Picard 2004 or Lampen 1995 full-text. |
| **fentanyl** | 8886601 (Feierman 1996 DMD — paraphrased "≥90% inhibition" only); 8712396 (Tateishi 1996 — uses gestodene/troleandomycin, not KZ); 8610902 (rat); 15731592/15557344 (study alfentanil not fentanyl) | In-vitro KZ Ki on fentanyl uses graphical inhibition curves; values in figures only. | Pull from Feierman 1996 DMD full-text Fig. 5. |
| **felodipine** | 8554939 (Halliday 1995 — KZ Ki on halofantrine, not felodipine); 10889516 (Abbas 2000 — felodipine as correlation probe only); 20702772 (Nishimuta 2010 — monkey in vivo); 7913410 (Harris 1994 — taxol) | KZ Ki on felodipine specifically not in any abstract. The Greenblatt 2011 nifedipine Ki (PMID:21235585, range 0.011-0.045 µM) is the closest dihydropyridine surrogate — already authored on the nifedipine edge. | Use nifedipine edge as the DHP-class anchor, or pull full-text felodipine-specific data when available. |

## CYP3A4 grapefruit / bergamottin — authored (Wave 2a, 2026-05-07)

`bergamottin` slug authored as new compound (MW=338.40, category="other", pk_unauthored=no-clinical-pk). Mechanism-based CYP3A4 inactivator (K_I=7.7 µM, k_inact=0.3/min on purified CYP3A4 per He 1998 PMID:9548795; K_I=40 µM in HLM per Tassaneeyakul 2000 PMID:10860553) — described in compound's `mechanism` prose since the schema models reversible Ki only.

Edges authored:
- bergamottin → felodipine (note-only, no kinetics block; clinical AUC+37%/Cmax+40% per Goosen 2004 PMID:15592332)
- bergamottin → simvastatin (Ki=34 µM verbatim from Le Goff-Klein 2004 PMID:15285845, reversible mixed-type Ki on simvastatin metabolism)

Open follow-ons:
- 6,7-dihydroxybergamottin (DHB) as a separate compound entry (K_I=5.56 µM, IC50=0.45 µM per Tassaneeyakul 2000 / Ohnishi 2000) — DHB is faster-onset and lower-K_I than BG; per Kakar 2004 (PMID:15179411) "an important contributor to the grapefruit juice effect". Defer until v1.0+.
- Schema extension for mechanism-based inhibition (K_I + k_inact + inhibition_type field) — would unlock proper time-course modeling of grapefruit / ritonavir-like irreversible perpetrators.
- bergamottin → atorvastatin (only rat in-vivo published, PMID:35699169), → amlodipine (zero PubMed hits), → cyclosporine (Malhotra 2001 PMID:11180034 suggests P-gp dominant, not CYP3A4) — all skipped.

## Enzyme-inhibitor occupancy round 2 — investigated, skipped (Wave 13, 2026-05-26)

Wave 13 authored 10 reversible-inhibitor occupancy rows (PDE3/4/5, extra carbonic anhydrase, gliptins/gliflozins), each from a re-fetched verbatim abstract/open-access value. Three were skipped:

| Compound | Target | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|---|
| **dipyridamole** | cGMP-PDE | 18174451 (review), 9163326 (PDE2/cGMP-stim, not dipyridamole), Gresele 2011 BJCP (PDE inhibition "only at 100–200 µM") | No primary abstract states a clean verbatim numeric PDE/PDE5 IC50; secondary sources scatter 0.9–5 µM. Dipyridamole's **primary** action is adenosine ENT1/ENT2 uptake inhibition (ENT1 Ki ~8 nM) — PDE inhibition is genuinely secondary/marginal. | Author the ENT1 uptake Ki as the primary mechanism; PDE constant stays unauthored (µM-range, not abstract-quotable). |
| **crisaborole** | PDE4 | 19303290 (Akama 2009 originator — abstract "potent activity" only, no number), 22841723 (Freund 2012 — "competitive, reversible … submicromolar", no nM), 27050693 (Jarnagin 2016 review — qualitative) | IC50 ~0.49 µM / Ki ~173 nM are table-only in paywalled full text; abstracts carry no numeric constant. Reversibility IS verbatim-confirmable (22841723). | Pull the numeric Ki from Freund 2012 / Akama 2009 full-text tables. |
| **dapagliflozin** | hSGLT2 | 18260618 (Meng 2008 originator — "potent and selective hSGLT2 inhibitor", no nM), 18356408 (Han 2008 — "potently and selectively inhibited human SGLT2", no nM) | hSGLT2 EC50 1.1 nM is table-only in the paywalled Meng originator; no abstract carries it. Re-confirms the wave-7 table-only flag. | Pull EC50 from Meng 2008 *J Med Chem* full-text table (flag as table-only). |

Modelling caveats on the authored rows: **apremilast** abstract gives a verbatim *range* (IC50 10–100 nM across PDE4 sub-families), modelled at the conservative upper bound (100 nM). **topiramate / zonisamide** CA inhibition is a secondary/off-target effect (primary action = Na⁺/Ca²⁺ channel block) — flagged in-note. **zonisamide** abstract reports both a classical-assay Ki (10.3 µM) and a 1-h-preincubation Ki (35.2 nM); modelled at the equilibrium 35.2 nM. **dorzolamide** topical ocular → slow kₑₒ (0.1/h, ocular-tissue compartment).

## NSAID COX occupancy — investigated, skipped (Wave 14, 2026-05-26)

Wave 14 authored human whole-blood-assay (WBA) COX-1/COX-2 IC50 occupancy for naproxen, diclofenac, meloxicam, etoricoxib (8 rows). All values are WBA so the four stay mutually comparable. Two skipped:

| Compound | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **indomethacin** | 10219655 (Laufer 1999 — PGHS-1 0.002 µM / PGHS-2 0.43 µM, but **cell-based** isolated-mononuclear-cell assay), 10377455 (Warner 1999 PNAS — per-compound IC50 table-only/paywalled), 15379866 (Härtel 2004 — cytokines, no IC50) | Only quotable value is a cell assay showing 200× COX-1 selectivity — an artifact that collapses toward ~1 in human whole blood. Mixing it with four WBA values would make indomethacin look artifactually ~1000× more COX-1-potent than naproxen. | Pull a true human-WBA indomethacin IC50 (Cryer & Feldman 1998 *Am J Med*, or Warner 1999 full-text table). |
| **aspirin** | 11717412 (Ouellet 2001 — washed-platelet residual reversible COX-1 IC50 1.3 µM; abstract confirms irreversible Ser-530 acetylation), 10377455 (Warner — table-only) | IRREVERSIBLE COX acetylator — a reversible Hill occupancy misrepresents it (cf. exemestane/rasagiline/bergamottin). The 1.3 µM is transient reversible binding, not the operative acetylation mechanism. | Needs a mechanism-based/irreversible-inhibition schema (same gap as bergamottin K_I+k_inact). |

Assay caveat on the authored rows: diclofenac + meloxicam come from **Blain 2002** (PMID:11874389), whose thesis is that the in-vitro WBA IC50 *ratio* overstates clinical COX-2 selectivity (oral diclofenac inhibits COX-1 ~70% in vivo). The absolute WBA IC50s are valid; the ratio caveat is noted per row.

## Methylxanthine adenosine occupancy — investigated, skipped (Wave 15, 2026-05-26)

Wave 15 authored cannabinoid CB1/CB2 occupancy (thc, dronabinol, cbd, cbg, beta-caryophyllene — 8 rows). The methylxanthine siblings of caffeine were investigated and **skipped on a comparability ground**, not a no-source ground:

| Compound | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **theophylline / theobromine / paraxanthine** | 6309393 (Daly 1983 — verbatim **rat-brain IC50**: theophylline A1 20–30 µM, paraxanthine 40–65, theobromine 210–280; A2 via adenylate cyclase), 9459566 (Klotz 1998 — human cloned-receptor Ki, **table-only/paywalled**), 23261866 (Orrú 2013 — behavioral, no Ki) | The existing **caffeine** entry uses **human** Ki (Fredholm 1999 review, PMID:10049999 → A1 ~11.8 µM / A2A ~2.4 µM). Daly 1983 is rat IC50 from an old adenylate-cyclase A2 assay: rat caffeine A1 IC50 is 90–110 µM (~10× off the human entry) and the rank order inverts (theophylline looks *weaker* than caffeine in rat IC50 but is *stronger* in human Ki). Authoring Daly values next to caffeine would put the methylxanthines on an incomparable scale. | Pull human cloned-receptor A1/A2A Ki from Klotz 1998 (PMID:9459566) or Fredholm 1999 full-text tables — same human assay as the caffeine entry. |
| **theacrine** | 22579816 (Feduccia 2012), 28864241 (Qiao 2017), 34946538 (Jhuo 2021) | Adenosine-antagonist evidence is entirely functional/behavioral/in-silico; no radioligand-binding Ki in any abstract. | Locate a radioligand-binding study (likely none yet exists). |
| **pentoxifylline** | 8759032 (Peterson 1996 — "not mediated by adenosine receptors"), 23699177 | Not a direct adenosine ligand (it's a non-selective PDE inhibitor); adenosine links are downstream. | n/a — author a PDE target instead if a verbatim IC50 surfaces. |

## Benzodiazepine-site occupancy — investigated, skipped (Wave 16, 2026-05-26)

Wave 16 authored gaba_a_bzd occupancy for clonazepam, eszopiclone, zopiclone (agonists) + flumazenil (antagonist) — 4 rows. Two skipped:

| Compound | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **temazepam** | 639854 (Braestrup & Squires 1978 — only group range "Ki 1–60 nM"), 723967 (Müller 1978 — non-BZDs), 2888155 (Arendt 1987 — temazepam not tested), 3017047 (Saano 1986 — peripheral sites) | No per-compound primary BZ-site Ki in any fetched abstract or open-access table — only a classical-BZD group range, which the no-fabrication rule forbids using as a point value. | Pull a temazepam-specific [3H]flunitrazepam Ki from a binding-assay full-text. |
| **oxazepam** | 639854 (group range only), 3017047 (Saano 1986 — peripheral-site Ki 21–37 µM, wrong site), 2863767 ([3H]phenytoin modulation IC50 12 µM, wrong assay) | Only central value is the group range; oxazepam-specific numbers found are peripheral-benzodiazepine-receptor or phenytoin-assay values (wrong target). | Pull a central BZ-site oxazepam Ki from full-text. |

## Dihydropyridine Cav1.2 occupancy — investigated, skipped (Wave 17, 2026-05-26)

Wave 17 authored DHP-site L-type Ca-channel (`cav1_2`) occupancy for amlodipine, nifedipine, nicardipine, nimodipine, isradipine (5 rows). Skipped:

| Compound | PMIDs chased | Why skipped | Re-author target |
|---|---|---|---|
| **felodipine** | 3027587 (Goll 1986 — tabulates 12 DHPs but abstract names only nitrendipine/nifedipine/Bay b 4328), 7109844, 6208356, 2624603, 6088927, 2706018/2442519/2412552 (calmodulin/enantiomer papers) | No abstract or fetchable open-access table gives a verbatim Cav1.2 DHP-site Ki; felodipine's retrievable binding literature is calmodulin-centric. Goll 1986 likely tabulates it but the full-text table returned HTTP 403. | Pull felodipine's row from Goll 1986 *Naunyn-Schmiedebergs* table, or a [3H]PN200-110 displacement full-text. |
| **verapamil, diltiazem** | (not chased) | Bind DISTINCT sites (phenylalkylamine / benzothiazepine) on the same L-type channel, not the DHP site. Authoring them under `cav1_2` would conflate three allosterically-coupled but pharmacologically distinct binding sites. | Author under separate site keys (e.g. `cav1_2_paa`, `cav1_2_btz`) if the schema/UI wants per-site resolution, with their own [3H]verapamil / [3H]diltiazem Ki. |

Cross-source caveat on the authored rows: nifedipine + nicardipine are true [3H]PN200-110-displacement Ki; amlodipine, nimodipine, isradipine are self-radioligand Kd; species/tissue mixed (cat ventricle, bovine aorta, rat cardiac/brain). All are DHP-site affinities and the rank order is plausible (isradipine most potent), but flag the measurement-type split.

## GtoPdb-sourced H1 + antipsychotic occupancy — authored & skipped (Wave 18, 2026-05-26)

Wave 18 introduced a **methodology shift**: for compounds whose affinity is table-only in primary papers (previously skipped), values were taken from **IUPHAR/GtoPdb** curation (the same DB feeding the receptor catalog), citing GtoPdb + the verified primary PMID as provenance. Authored: diphenhydramine, fexofenadine, hydroxyzine, chlorpheniramine (H1); cariprazine (D2); lurasidone (D2 + 5-HT2A) — 7 rows. Skipped:

| Compound | Why skipped |
|---|---|
| **loratadine** (H1) | GtoPdb "human" Ki 37 nM ≈ the historical guinea-pig value (35 nM, PMID:2875889); cited binding looks rodent; parent is weak vs its already-authored active metabolite desloratadine (0.9 nM). Species provenance too shaky to treat as human. |
| **doxylamine** (H1) | GtoPdb has NO affinity data ("unable to find publicly available affinity data … not tagged a primary drug target"). |
| **quetiapine** (D2/5-HT2A) | GtoPdb D2 is review-sourced (Arnt 1998 PMID:9430133); 5-HT2A is a multi-paper pKi range. No single curated primary value. |
| **clozapine** (D2/5-HT2A) | GtoPdb D2 (≈126–1585 nM) and 5-HT2A (≈1–25 nM) are pKi ranges aggregated across 5 papers each; no single value. |

Note: this opens **GtoPdb/PDSP curation as a sanctioned secondary-provenance tier** for future waves where abstract-verbatim numbers don't exist — provided the value is human (or species-flagged), single-valued (not a multi-paper range), and the cited primary PMID is verified to resolve and be on-topic.

## Antimuscarinic + α2 occupancy (GtoPdb) — authored & skipped (Wave 19, 2026-05-26)

Authored (GtoPdb single human pKi + verified primary PMID): oxybutynin (M3, Del Bello 2012), scopolamine (M3, Bolden 1992 cloned-human), tizanidine (α2A, Proudman 2022) — keyed `muscarinic`/`alpha_2a` to match atropine/clonidine. Skipped:

| Compound | Why skipped |
|---|---|
| **tolterodine** (M3) | GtoPdb pKi 8.4–8.5 is a 2-paper range (Gillberg 1998 / Sinha 2010); held to single-value bar. (Wave-4 noted Ki "verified, no kₑₒ" — re-check the wave-4 source for a single value.) |
| **tiotropium** (M3) | GtoPdb pKi 9.5–11.1, 5-paper range (huge span 0.008–0.32 nM). |
| **ipratropium** (M3) | GtoPdb pKi 9.3–9.8, 3-paper range. |
| **brimonidine** (α2A) | GtoPdb pKi 6.4–8.7, 5-paper range. |
| **methyldopa** (α2A) | Prodrug; GtoPdb lists no adrenoceptor binding (metabolite α-methylNE is the α2 agonist, not the parent). |

## GtoPdb multi-paper ranges — now AUTHORED (Wave 20, 2026-05-26)

**Policy update:** multi-paper pKi RANGES are now acceptable — modelled at the geometric mean (pKi-range midpoint, Ki = 10^(9 − pKi_mid)), with the full range + representative primary PMID recorded per row. This resolves the range-based skips logged in waves 18–19.

> **SUPERSEDED 2026-09-26 — do not apply this policy to new work.** It licenses exactly what
> [HYGIENE R2 and R3](../authoring/HYGIENE.md) reject: a value no paper states, hung on a
> "representative" PMID whose abstract does not state it either. A geometric mean of five papers is
> a midpoint, and the rows it produced are the *secondary_citation* and *abstract_silent* classes
> the 2026-06-28 audit then spent its length removing. The paragraph is left in place because this
> is a record of what was done, not a rulebook.
>
> **The midpoint rows are gone; the secondary-citation rows are not.** Two warnings, added
> 2026-09-26, read the occupancy notes and name every row this policy produced.
> `receptor.derived-value` covered the 28 midpoint rows and **now reports 0** — they were
> re-sourced or removed the same day, and the section at the end of this file records every one.
> `receptor.secondary-source` still reports **33 rows over 23 compounds**: a constant taken off the
> GtoPdb ligand page under a primary PMID nobody fetched. Run `pnpm report` to see them grouped.
> Both are prose rules and only know what a note admits, so expect them to miss a row that words
> the practice differently — but they no longer let the class grow silently, which is what the
> earlier ad-hoc grep could not prevent.
> Those 33 are an open defect class, not a backlog of missing data: each needs a single-valued
> affinity from a paper someone fetched, or a GAPS row and the row's removal. `pnpm verify` passes
> every one of them, because the identifiers resolve and the shape is legal.

Authored (geometric-mean of GtoPdb range; representative primary PMID verified on-topic): tolterodine (M3, Sinha 2010), tiotropium (M3, Prat 2009), ipratropium (M3, Dowling 2006), brimonidine (α2A, Jasper 1998), quetiapine (D2 review-sourced Arnt 1998 + 5-HT2A Kongsamut 2002), clozapine (D2 Sokoloff 1992 + 5-HT2A Schotte 1996), propranolol (β2, Baker 2005), sotalol (β1+β2, Baker 2005). New key `beta_2`.

**Still gapped:** propranolol **β1** — GtoPdb has no β1 row for propranolol at all (only β2/β3); needs a full-text β1/β2 selectivity table (Baker 2005 / Smith & Teitler) per the PDF_QUEUE. The remaining PDF_QUEUE rows (Richelson human antipsychotic D2/5-HT2A/H1; felodipine + verapamil/diltiazem Ca-channel; statin HMGCR) still require full-text PDF access.

## 5-HT3 antiemetics + transporters — authored & skipped (Wave 21, 2026-05-26)

Authored: ondansetron/granisetron/palonosetron (5ht3, human); atomoxetine (NET 5 nM + DAT 1451 nM, Bymaster 2002 abstract-verbatim); methylphenidate (DAT/NET GtoPdb ranges). New keys `5ht3`, `net`. Skipped:

| Compound | Why skipped |
|---|---|
| **bupropion** (DAT/NET) | GtoPdb values are wide ranges; the "Carroll 2009" PMID supplied (19442525) actually resolves to Lapinsky 2009 (pyrovalerone photoaffinity ligand) — no clean verified single source. Re-author from a confirmed primary (bupropion's active reuptake is largely via its metabolite hydroxybupropion anyway). |
| **amphetamine** (DAT/NET) | Only rat uptake-inhibition IC50 (Tuomisto 1976); and amphetamine is a substrate/RELEASER, not a reuptake blocker — an equilibrium-occupancy/Ki model misrepresents the mechanism (cf. aspirin irreversible). Needs a release/substrate model the solver doesn't have. |

Provenance reminder (smell caught): GtoPdb's palonosetron pKi 10.5 cites a computational paper (PMID:20724042) — rejected in favour of the directly-measured Hothersall 2013 human Ki.

## TCA / atypical antidepressant occupancy — authored & skipped (Wave 22, 2026-05-26)

Authored (verified primary PMID): clomipramine SERT+NET (Tatsumi 1997, PMID:9537821), mirtazapine α2A (Proudman 2022) + 5-HT2A (Fernández 2005), trazodone 5-HT2A (Knight 2004). Skipped — GtoPdb citation problems caught during verification:

| Compound / target | Why skipped |
|---|---|
| **amitriptyline** SERT/NET | GtoPdb attributes to an AMT/5-MeO-DALT NPS paper (PMID:23602445); values (158/316 nM) are ~40× weaker than canonical Tatsumi 1997 (~4/35 nM) — suspect. |
| **nortriptyline** SERT/NET | NET ref resolves to a 5-HT6 paper (mismatch); SERT ref is the NTP DrugMatrix screening DB (no primary PMID). |
| **imipramine** SERT/NET | SERT ref is an implausible *J Nat Prod* citation (mismatch); NET row has no ref. |
| **mirtazapine** H1, **trazodone** α1A | Values on GtoPdb but primary PMIDs not extractable from the rendered page (trazodone α1A is rat-only). |

**All four TCAs' human SERT/NET Ki live in Tatsumi 1997 (PMID:9537821, Eur J Pharmacol) Table — the single authoritative source.** Pulling that full-text table would let amitriptyline/nortriptyline/imipramine/desipramine/doxepin be authored consistently (PDF_QUEUE). This is the highest-value remaining full-text target.

## PK half-life provenance — sourced & remaining (Wave 23, 2026-05-26)

79 authored compounds carried a `half_life_hr` with EMPTY `refs`. Wave 23 sourced a primary PK reference (abstract states the elimination half-life, verified vs PubMed) for **54** of them — see `scripts/authoring/2026-05-26-wave23-pk-half-life-refs.ts` for the slug→PMID map. Gap now 79 → 25.

**⚠ Two data-quality flags (stored value looks wrong — NOT cited, needs a decision):**
- **tranexamic-acid** `half_life_hr.PO = 11` — established plasma t½ is ~2 h (Pilbrant 1981, PMID:7308275: "apparent elimination half-life of approximately two hours"). The 11 h appears only in tertiary labels. **Recommend correcting to ~2–3 h.**
- **allopurinol** `half_life_hr.PO = 2` — measured elimination t½ is ~0.8 h (Breithaupt 1982, PMID:7094977, IV); parent vs absorption-extended ambiguity. Review.

**Within-2× but registry value at an edge (cited, flagged):** famotidine (3.6 vs 2.6 h, high), everolimus (17.5 vs 30 h, low), amitriptyline (21 vs 36 h, low), clopidogrel (6 h = inactive metabolite SR26334, parent ~1.7 h).

**Remaining 25 unsourced (no abstract states the value / not yet swept):**
- *Full-text/label-gated pharmaceuticals (13):* hydrochlorothiazide (reCAPTCHA), amoxicillin, doxycycline, minocycline (no-abstract foundational paper), desipramine, phenelzine, butalbital, dexlansoprazole, dicyclomine, ibrutinib, upadacitinib, progesterone, prednisone — values are sound (labels/reviews) but no PubMed abstract states them verbatim; need full-text.
- *Supplements/peptides not yet swept (12):* ala, semax, n-acetyl-semax, n-acetyl-selank, l-glutamine, l-citrulline, insulin-glargine, setmelanotide, testosterone-undecanoate, paraxanthine, + the 2 flagged above.

## PK corrections + supplement sweep (Wave 24, 2026-05-26)

Resolved the non-PDF remainder of the half-life gap:
- **Value corrections (verified):** alpha-lipoic acid PO 30 h → **0.5 h** (Breithaupt-Grögler 1999, PMID:10072479 — the 30 h was ~60× wrong); tranexamic-acid PO 11 h → **2 h** (Pilbrant 1981, PMID:7308275).
- **Citations added:** paraxanthine (Lelo 1986, PMID:3756065); testosterone-undecanoate (Zhang 1998, PMID:9876028).

**Now the entire remaining unsourced-PK set is genuinely PDF/label-gated or has no primary human PK** — ready to batch under one full-text pass:
- *Need full-text/label (pharmaceuticals, value sound):* hydrochlorothiazide, amoxicillin, doxycycline, minocycline, desipramine, phenelzine, butalbital, dexlansoprazole, dicyclomine, ibrutinib, upadacitinib, progesterone, prednisone, **allopurinol** (oral parent ~1–2 h; Breithaupt 1982 is IV-only), **insulin-glargine** & **setmelanotide** (label-only), **l-glutamine** (Sadaf 2024 t½ is full-text-only).
- *No primary human PK (research peptides):* semax, n-acetyl-semax, n-acetyl-selank — leave unsourced; *l-citrulline* has only a neonate value.

## PK-completeness sweep (Waves 25–27, 2026-05-26)

Autonomous pass over the non-occupancy PK gaps:

**Phase 1 — oral absorption (ka_hr): DONE (+44).** Derived `pk.PO.ka_hr` for 44 oral drugs from a sourced oral Tmax + ke (ln2/t½) via the 1-compartment Tmax equation. Oral-ka gap 74→30. The 30 not done: ethanol (zero-order), gemfibrozil (flip-flop: Tmax > 1-comp limit), and ~28 supplements/SARMs/prodrugs with no abstract-confirmable human oral Tmax (anastrozole, bisoprolol, cariprazine label-only; lgd-4033/rad-140/ostarine/mk-677/noopept/etc.).

**Phase 2 — pk-block source_pmid: DONE (+9).** Of 31 source-less pk blocks, attached a primary PK PMID to the 9 whose paper actually reports Vd/F (telithromycin, acalabrutinib, ruxolitinib, sulfasalazine, nadolol, upadacitinib, rosiglitazone, cerivastatin, minocycline — several exact matches). The other 22 left unsourced ON PURPOSE: their only candidate PMIDs report the half-life, not Vd/F (atazanavir, lopinavir, daclatasvir, elbasvir, grazoprevir, elvitegravir, venetoclax, everolimus, temsirolimus, tolbutamide, rasagiline), or are mismatches (darunavir, tranexamic-acid, ibrutinib), or have no clean primary abstract (clozapine, dextromethorphan, cobicistat, dicyclomine, tacrine, butalbital, setmelanotide, phenelzine). These need full-text/label — PDF batch.

**Phase 3 — secondary-route PK: IV DONE (+121), non-IV documented.** The 123 IV route gaps were filled by model-derivation (IV: F=1.0 definitional; Vd & elimination route-independent → copied from the donor route; ka ignored). 2 skipped (calcitriol, dmt — no V_L). The remaining **172 non-IV route gaps (IM 68, TD 34, SC 19, IN 14, SL 13, PO 9, INH 7, PR 6)** have route-SPECIFIC bioavailability/absorption that cannot be derived and need per-route primary PK studies — a genuine structural gap, NOT bulk-fillable or derivable. Deferred to a scoped per-route sourcing effort.

**Phase 4 — DDI/interactions: ASSESSED, not a bounded gap.** The `interactions` field holds qualitative clinical DDI warnings (level/note/source_pmid) — 595 edges across the registry, 72/470 pharmacological compounds. This is open-ended/combinatorial expansion, not a fixed gap; the high-value pairs are already authored and the abstract-gated remainder is documented in the CYP/DDI sections above. No clean non-gated subset to "complete" — extend opportunistically per specific high-value pair, not in bulk.

## Non-IV route campaign — IM done, structural finding (Wave 28, 2026-05-27)

Began filling the 172 non-IV route gaps. IM (68) swept first; **only 11 cleanly authorable** (morphine, cefepime, gentamicin, phenobarbital with sourced F; cortisol, hydrocortisone, dexamethasone, clindamycin, betamethasone, lidocaine, pentazocine with parenteral F≈1 + sourced Tmax → derived ka). Per route: V_L copied (route-independent), ka derived from sourced IM Tmax, F sourced or =1.0 for non-depot parenteral small molecules.

**KEY FINDING — most non-IV route "gaps" are not cleanly fillable, in structural categories:**
1. **Depot / long-acting formulations** (~11 IM): aripiprazole-LAI, leuprolide, octreotide-LAR, olanzapine-pamoate, estradiol esters, progesterone oil, DMPA, risperidone Consta, naltrexone Vivitrol, haloperidol decanoate, levonorgestrel butanoate. These are zero-order/sustained release — the 1-comp first-order ka model doesn't fit; they need a depot model.
2. **Only relative F (vs oral/IV) or label/StatPearls values** — not the absolute F the block needs.
3. **Clinically not given by that route / no human PK** — fentanyl/alfentanil/sufentanil/misoprostol IM, etc. The `routes` list overstates PK-characterized routes.
4. **F sourced but no route Tmax** (ka not derivable) — methotrexate, ketamine, meloxicam, diclofenac, aripiprazole-IR.
5. **Flip-flop** (Tmax > 1-comp limit): insulin IM.

Implication for the remaining 104 (TD 34, SC 19, IN 14, SL 13, PO 9, INH 7, PR 6): **TD is the worst fit** — transdermal patches deliver zero-order, not first-order ka, so a 1-comp ka block misrepresents them. SC is the best remaining (parenteral, like IM). IN/SL/INH/PR have route-specific F needing per-drug sourcing with mixed yield. Expect a similar ~15–20% clean-authorable rate. Recommend: author SC + the cleanly-sourceable subset of IN/SL/PR; treat TD/INH as model-mismatched (defer to a zero-order/deposition model); accept that depot + spurious-route gaps stay open by design.

## Non-IV route campaign — clean subset complete (Wave 29, 2026-05-27)

"Clean subset only" pass over SC/IN/SL/PR (TD/INH skipped — zero-order/deposition model mismatch). Authored 9 more blocks with sourced absolute F + Tmax-derived ka (V_L copied):
- SC: morphine (F~1.0), trastuzumab (F 0.87, ka from absorption t½ 2.5 d)
- IN: fentanyl (0.747), lidocaine (0.26), morphine (0.10 simple-solution)
- SL: lorazepam (0.98), fentanyl (0.789), alprazolam (~0.9, derived)
- PR: indomethacin (0.80)

**Non-IV route campaign final tally:** +20 clean blocks (IM 11 + SC 2 + IN 3 + SL 3 + PR 1) of 172 gaps (~12%). Left open BY DESIGN (not fillable in the 1-comp model / no clean absolute-F source): all TD (34, zero-order patches) + INH (7, deposition-limited); depot formulations; relative-F-only or label-only values; clinically-spurious routes (fentanyl/alfentanil/sufentanil/misoprostol IM, etc.); and F-or-Tmax-missing pairs. These are a structural ceiling, not a backlog — revisit only with a depot/zero-order model or specific per-drug full-text.

Combined Phase 3 (IV wave 27 + non-IV waves 28–29): **+141 route pk blocks**.

## Deferred routes filled via zero-order model (Wave 30, 2026-05-27)

With the zero-order/depot solver model (wave 27 feature: `zo_dur_hr` + `lag_hr`), the previously-deferred TD/depot/INH gaps were authored — **+14 blocks**:

- **Transdermal patches (9, zero-order):** buprenorphine, clonidine, nicotine, selegiline, rivastigmine, estradiol, oxybutynin, granisetron, + **fentanyl upgraded** from the old slow-first-order (ka 0.05) to a proper zero-order patch block. `zo_dur_hr` = wear window, `lag_hr` = onset lag, F sourced (buprenorphine 0.15, clonidine 0.60, nicotine 0.76, selegiline 0.73, fentanyl 0.63) or 1.0 for the systemic patches whose absolute F isn't cleanly reported (rivastigmine/estradiol/oxybutynin/granisetron — flagged). `half_life_hr[TD]` = route-apparent t½ (skin-reservoir tail).
- **LAI depots (3, zero-order + lag):** aripiprazole lauroxil (lag 130h / release 864h, Hard 2017), olanzapine pamoate (Heres 2014), haloperidol decanoate (Gelders 1986). ke = molecular t½ (decline once depot exhausted).
- **Inhaled (2, fast first-order):** nicotine (F 0.53, Molander 1996), cbd (F 0.59, Meyer 2018). Inhaled is fast first-order, not zero-order — limit is deposition F.

End-to-end verified: clonidine TD shows lag→plateau→post-removal decline; aripiprazole depot shows the 5-day lag + sustained plateau; nicotine INH fast peak/decay.

**Now resolved with PMID-backed human PK (Wave 31, 2026-05-27):** risperidone Consta (Gefvert 2005, PMID:15710053 — lag 504h/release 336h; e2e-verified: 0 drug through day 21, release wk4–6, then decline — matches the clinically-mandated 3-week oral overlap), naltrexone Vivitrol (Dunbar 2006, PMID:16499489 — zo_dur 720h, lag 48h), octreotide LAR (Tiberg 2015, PMID:26076191, human — replaces rabbit Petersen; zo_dur 672h, lag 168h).
**Still deferred:** leuprolide depot — Mazzei 1990 (PMID:2108885) is the SUBCUTANEOUS depot but the open gap is the IM (Lupron Depot) route (SC already authored); needs an IM-depot PK paper. triptorelin (open gap is the non-standard SC route). **Left unauthored by design:** local/topical "TD" (ibuprofen, diclofenac, steroids, antifungals, lidocaine, magnesium, dhea, cbd-TD, tocopheryl-acetate, etc.) and local "INH" (budesonide, nac, glutathione, racemic epinephrine) — not systemic-delivery routes. insulin INH (IU-dosed + relative-to-SC F).

## Sugars & sweeteners expansion (2026-06-02)

Added **31 entries** under two new categories, `sugar` (9) and `sweetener` (22) — see `scripts/authoring/2026-06-02-sugars-and-sweeteners.ts`. Prose-stub level (mechanism + MW + doses + systems + aliases), `refs:[]` (no fabricated citations; MW is a chemistry fact). Disaccharides + carb mixtures carry `composition[]` so a dose expands to its constituent monosaccharide slugs at solve time. Sweetener coverage closes the **EU authorised-sweetener E-number list E950–E969** (E950 ace-K, E951 aspartame, E952 cyclamate, E953 isomalt, E954 saccharin, E955 sucralose, E957 thaumatin, E959 neohesperidin DC, E960 steviol glycosides, E961 neotame, E962 aspartame-acesulfame salt, E964 polyglycitol syrup, E965 maltitol, E966 lactitol, E967 xylitol, E968 erythritol, E969 advantame) plus the common non-E-number ones (monk fruit/mogrosides, allulose, tagatose) and the dietary sugars.

**Deliberately deferred (visited, not authored):**
- **glycyrrhizin / glycyrrhizic acid (E958)** — sweetener but with real mineralocorticoid pharmacology (11β-HSD2 inhibition → pseudohyperaldosteronism, hypertension, hypokalaemia). Deserves a *richer* entry than a sweetener stub (PK + interactions + a non-`sweetener` category call), so left for a dedicated pass rather than mis-stubbed here.
- **brazzein, monellin** — sweet proteins with essentially no commercial food use (no approved-additive status in major markets); skip until there's a tracking reason.
- **invert sugar** — glucose+fructose mixture, conceptually duplicates the HFCS composition model; add only if a distinct consumer item needs it.
- **honey, agave syrup, maple syrup** — *foods/mixtures*, not chemical compounds; out of the registry's compound scope (HFCS + maltodextrin were included only because they're industrially-defined ingredients people actively track).
- **d-ribose** (already present as `nucleoside`) and **glycerol** (already present as `glycerol-supplement`) — left in their existing categories; not reclassified.

### PK depth wave (same day, `scripts/authoring/2026-06-02-sugars-pk-wave.ts`)

Authored literature PK only where a **resolvable primary-human-PK PMID** carries the values (every number re-fetched from PubMed via efetch and the abstract text confirmed before authoring):
- **mannitol IV** — Cloyd 1986, **PMID:3080582** (n=4 humans): t½ 71.15 min → 1.186 h, Vd 0.47 L/kg → 32.9 L, F=1. 1-comp approximation of the reported 2-comp fit (2-min distribution phase negligible).
- **saccharin PO** — Sweatman 1981, **PMID:7303723**: fraction absorbed ~0.85; t½ 70 min → 1.17 h. ka/Vd not abstract-stated → solver defaults.
- **sucralose PO** — Roberts 2000, **PMID:10882816** (n=8): F≈0.145 (only ~14.5% absorbed), effective plasma t½ 13 h.

**Skipped with citation trail (PK not authored):**
- **acesulfame-K** — the canonical t½ 2.5 h is from an **unpublished** WHO/JECFA report (Christ & Rupp 1976, Hoechst No. 01-L42-0176-76), no PMID. The two PubMed primary studies (**PMID:35807817** Stampe 2022, **PMID:39111550** Sylvetsky 2024) report neither a terminal t½ nor a Vd. Vd is uncharacterised in any human study.
- **erythritol** — Bordier 2022 (**PMID:36077269**) is a valid primary human study, but the PK params (ka, t½, V1) live only in full-text Table 1, **not the abstract**, and the abstract reports **saturable** absorption — which breaks the linear 1-compartment model. Re-investigate only with a saturable-absorption model.
- **allulose** — Iida 2010 (**PMID:19765780**, primary human) reports only ~70% urinary recovery, no t½/Vd.
- **xylitol / sorbitol / maltitol / steviol glycosides / mogrosides / thaumatin / cyclamate** — non-absorbed, hepatically metabolised, saturable, or digested-as-protein; a 1-compartment plasma fit would be mechanistically wrong. Left `pk_unauthored` by design.

## Yohimbe-bark alkaloids wave — investigated, skipped (2026-06-27)

13 constituents of yohimbe bark (Pausinystalia johimbe) authored as verified skeletons in scripts/authoring/2026-06-27-yohimbe-bark-alkaloids.ts (12 indole alkaloids + 1 tannin class-mixture). Each authored entry carries PubChem-verified identity (CID + MW + formula re-fetched), a sourced presence-in-yohimbe citation, and `pk_unauthored`. The cells below were investigated and skipped.

### Receptor occupancy — rich-occupancy pass (2026-06-27, 2026-06-27-yohimbe-rich-occupancy.ts)

The abstract-verbatim search came up empty (the famous selectivities are qualitative in abstracts), so a second pass used **GtoPdb** curated affinities — the same source/standard as yohimbine's own α₂A row.

**Authored (no longer skipped):**
- **rauwolscine** → α₂A (pKi 8.4), α₂B (pKi 8.3), α₂C (pKi 9.1) from **PMID:7996470** (GtoPdb tabular antagonist values, same paper as yohimbine's α₂A) + 5-HT₂B (pKi 7.8–8.4) from **PMID:9459568** (where [³H]rauwolscine is the named radioligand). keo is a documented approximation (mirrors yohimbine 2.0/h).
- **ajmalicine** → CYP2D6 inhibition (Ki 3.3 nM = 0.0033 µM, **PMID:8487254**, GtoPdb): added to **mechanism prose** plus **8 kinetic-interaction edges** (ajmalicine → dextromethorphan, metoprolol, atomoxetine, desipramine, nortriptyline, risperidone, aripiprazole, nebivolol — CYP2D6 *clearance* substrates; bioactivation prodrugs codeine/tramadol/tamoxifen excluded) in 2026-06-27-ajmalicine-cyp2d6-edges.ts. The edges are documentary — inert in the solver until ajmalicine PK is authored.

**Still skipped:**
| Compound | Receptor | Why skipped |
|---|---|---|
| **corynanthine** | alpha_1 | GtoPdb has **zero interactions** for corynanthine (ligand 5345). Its α₁-over-α₂ preference is real but qualitative — Timmermans 1981 (**PMID:6111465**) shows the *reverse* [³H]prazosin/[³H]clonidine ratio to yohimbine, no named Ki; it is also absent from the modern human α₁-subtype binding papers (PMID:32608144). Stays a skeleton. |
| **ajmalicine** | alpha_1 / alpha_2 | The adrenoceptor side is **functional rat** data only — Demichel 1986 (**PMID:3021076**, raubasine stereoisomers in pithed rat) reports pressor antagonism, no receptor Ki/IC50; GtoPdb carries only its CYP2D6 value (authored above), not an adrenoceptor Ki. |

### Identity / scope — skipped (not authorable as named yohimbe compounds)

| Candidate | Why skipped |
|---|---|
| **methyl-yohimbine** | "Methyl yohimbine" is listed as a yohimbine analog by LC/QTOF-MS (**PMID:25905738**) but the generic name resolves to **no single PubChem CID/MW** (name lookups for methyl-/methoxy-/N-methyl-yohimbine all 404). Unauthorable without the specific isomer. |
| **19-dehydroyohimbine** | **No PubChem record** (REST name lookup 404; NCBI pccompound esearch Count=0). No CID/formula/MW obtainable. |
| **tetrahydromethylcorynantheine** | **No PubChem record** while control names resolved cleanly (tetrahydroalstonine→CID 72340, dihydrocorynantheine→CID 3039336). Almost certainly a mis-parsed LC-MS profiling label, not a discrete entity. |
| **calycanthine** | Identity real (CID 5392245, C22H26N4) but it is a **dimeric, non-yohimbane tryptamine** (Calycanthus-type); its presence in *P. johimbe* could not be verified from any primary abstract. |
| **ajmaline** | Identity real (CID 6100671) but a **Rauwolfia serpentina** alkaloid (class Ia antiarrhythmic); presence in *P. johimbe* not verifiable. |
| **epicatechocorynantheine A / B**, **epicatechocorynantheidine** | **AUTHORED 2026-06-27** as *Corynanthe pachyceras* constituents (explicitly NOT claimed for yohimbe) in 2026-06-27-corynanthe-pachyceras-flavoalkaloids.ts — corynanthean-epicatechin flavoalkaloids (CIDs 146035642 / 146035632 / 146035606) from C. pachyceras stem bark (**PMID:32517373**). Identity verified; the abstract gives only qualitative "moderate antiplasmodial activity" (no verbatim IC50). Occurrence in *P. johimbe* itself remains unconfirmed. |

### Tannins — authored as a class-mixture, not as discrete proanthocyanidins

`yohimbe-tannins` is a `pk_unauthored:'mixture'` entry (no single MW). Yohimbe bark is consistently described as tannin-rich (pharmacognosy monographs; EFSA yohimbe assessment — "tannins which can precipitate the alkaloids") but **no PubMed-indexed primary abstract names or quantifies specific *P. johimbe* proanthocyanidins**, so `refs` is left empty rather than cite a non-primary source. The constituent flavan-3-ols (`catechin`, `epicatechin`, `procyanidin-b2`) are already in the registry. Re-author target: a primary phytochemistry paper isolating named yohimbe procyanidins.

### Breadth note (~50 vs 13)

Reviews state yohimbe bark contains "yohimbine plus ~50–60 indole alkaloids," and the Sun 2011 UPLC-IM-QTOF profile (**PMID:23657953**) characterised **55** indole alkaloids — but the large majority are **unnamed isomeric LC-MS peaks** (a "hydroxy-yohimbine isomer", a "methyl-corynantheine") identified by mass/mobility, never isolated, named, or assigned a CID. They cannot be authored as discrete compounds without fabricating an identity. The 13 here are the named, PubChem-verifiable, in-yohimbe-cited subset.

Additional named candidates were chased on 2026-06-27 and **not authored**: **yohimbol** (CID 278769), **tetrahydroalstonine** (CID 72340), **sitsirikine** (CID 3050539), **geissoschizine** (CID 5280491) and **alstonine** (CID 441979) all have verified PubChem identity, but **no primary source places them specifically in *P. johimbe***. The canonical bark-alkaloid list (yohimbine / rauwolscine / β- / allo- / pseudo-yohimbine / ajmalicine / corynanthine / corynantheine / dihydrocorynantheine / dihydrositsirikine) excludes them, and Liu 2018 (PMID:30059216) names its 15 "known analogues" only by compound number. Author if a full-text constituent list (Liu 2018, or the Springer "Yohimbe Alkaloids — Pausinystalia Species" chapter) confirms presence.

## How to use this file

When picking up future authoring work:

1. For each row in the "Interaction kinetics — skipped" table, pulling the cited full-text would close that gap. Schedule the literature pass.
2. For receptor occupancy skips, most are mechanism-doesn't-fit (genomic, multi-target, ion-channel-block) and should stay skipped. l-theanine is the one worth re-investigating with full-text since it's a heavily-marketed nootropic.
3. The MW gap is intentional and fills incrementally as compounds become authoring-relevant.

## PK / keo removed as wrong-compound or table-only — 2026-06-28 data-quality audit

The cross-compound citation audit ([memory] project_v8_data_quality_audit) confirmed these values were cited to the wrong molecule, an unrelated paper, or a source where the value is table-only. Removed (or, for keo, de-cited) under the no-fabrication rule; re-author from a primary that states the value verbatim for the named compound.

| Compound | Removed | Why | PMIDs chased |
|---|---|---|---|
| **tiotropium** | keo citation (value kept as approximation) | keo for inhaled LAMAs is not a published parameter; value is an engineering approximation, not primary-sourceable. | PMID:19653626 - Prat 2009 'Discovery of novel quaternary ammonium derivatives... aclidinium bromide' (J Med Chem); the paper is the aclidinium discovery/characterization, tiotropium is at most a panel comparator and no effect-compartment/keo is given. PMID:24165906 - Hohlfeld 2014 tiotropium PK/PD i |
| **albendazole** | pk.PO | Endpoint is keyed to albendazole parent, which is non-measurable; the value belongs to the active sulfoxide metabolite. | PMID:10079501 - Marques 1999 'Enantioselective kinetic disposition of albendazole sulfoxide in neurocysticercosis'; measures the active metabolite's enantiomers (t1/2 5.2/3.3 h) in infected patients, not parent. PMID:3770064 - Marriner 1986 'Pharmacokinetics of albendazole in man'; parent 'below det |
| **cdp-choline** | pk.IV | No study administered CDP-choline IV to humans; the only human PK primary (Dinsdale) dosed orally, so per-route IV PK cannot be primary-sourced. | PMID:19906248 - dietary-choline public-health review (wrong substance, no CDP-choline IV PK). PMID:6412727 - Dinsdale 1983, the human 14C-CDP-choline PK study, but ORAL route only ('ingested dose'); no IV dosing/IV data. PMID:6684463 - Agut 1983 'Bioavailability of methyl-14C CDP-choline by oral rou |
| **hydroxyproline** | pk.PO | Free hydroxyproline has no dedicated human oral PK study; all available data are for collagen-derived peptides. | PMID:27573716 - Sontakke 2016 collagen tripeptide (Gly-Pro-Hyp/Pro-Hyp) absorption in RATS; the '2 h' is a peptide GI/plasma stability window, not a free-Hyp t1/2; no free-hydroxyproline PK. PMID:24767063 - Shigemura 2014, human (n=4) collagen-hydrolysate ingestion; reports plasma Hyp-peptide Cmax d |
| **igf-1-lr3** | pk.SC | IGF-1 LR3 (Long-R3-IGF-I) is a research-only analog used mainly in animal/cell work; no human SC PK study exists and no animal abstract gives a numeric half-life. | PMID:9488001 (pigs, 4-day LR3IGF-I infusion — growth/hormone endpoints, no numeric t1/2); PMID:9252489 (neonatal calves, SC Long-R3-IGF-I — plasma rose after SC but no half-life value); PMID:8549937 (rats, LR3IGF-I infusion — only qualitative 'variations in pharmacokinetics, clearance rates', no num |
| **mct-c6** | pk.PO | All PubMed 'hexanoic acid' PK hits resolve to unrelated molecules that merely contain a hexanoyl/hexanoic substructure in their names. | PMID:31058159 (current — studies only C8/C10/C12 MCTs; C6 never dosed); PMID:21447732 (naronapride/ATI-7505 — 'hexanoic acid' appears only inside the drug's IUPAC name, not free C6); PMID:6687803 (CGS 13080 imidazo[1,5-a]pyridine-5-hexanoic acid — thromboxane synthetase inhibitor, not a C6 fatty aci |
| **mod-grf-1-29** | pk.SC | Mod GRF 1-29 (= CJC-1295 without DAC) has no dedicated human PK study; the only ConjuChem PK data are for the DAC albumin-binding conjugate (long-acting), not the bare tetrasubstit | PMID:7962295 (current — mono-substituted D-Ala2-GHRH(1-29), IV infusion, disappearance half-time 6.7 min; different molecule); PMID:15817669 (Jetté — characterizes the CJC-1295 DAC albumin conjugate, 'present in plasma beyond 72 h'; the non-DAC tetrasubstituted scaffold is named but no standalone t1 |
| **noopept** | pk.PO | Human noopept PK exists qualitatively (15079908) but no abstract provides numbers; all numeric PK in the literature is rodent and abstract-table/full-text only. | PMID:30378564 (current — rat PK, no numeric values); PMID:15079908 (interspecies study incl. humans — qualitative 'slower elimination ... considerable individual variability', NO numeric F/Vd/t1/2); PMID:10977920 (GVS-111 rat HPLC PK — qualitative, BBB penetration, no numbers); PMID:9206571 (GVS-111 |
| **calcitriol** | pk.PO | Brandi 2002 (PMID:11981071) would re-anchor the PO F (70.6%) but cannot supply a t1/2. | PMID:8704116 (Levine 1996, the rejected cite) = hemodialysis patients, oral t1/2 38+/-14 h (PK1) and 30+/-4 h (PK2) — renal-failure prolongation, not a healthy/general value; PMID:19427587 (Jin 2009) = 8 healthy adults oral 2 ug, reports AUC/Cmax only, plasma 'did not return to baseline at 24h' so n |
| **dsip** | pk.SC |  | PMID:6379493 (Kato 1984, the rejected cite) = dog IV t1/2 4.0 min (monkey 2.9 min, rat 2.0 min) — animal IV only, not human, not SC, and 4 min ≠ stored 15 min; PMID:3628078 (Graf 1987) = in-vitro DSIP degradation in human/rat blood, qualitative 'rapid disappearance...due to degradation', no verbatim |
| **dsip** | pk.IN | Flagged endpoint covers both t1/2 (0.15 h) and F (0.05); both are unsupported and the whole IN block should be removed. | PMID:6379493 (Kato 1984, the rejected cite) = dog IV only, no intranasal route, no F; PMID:2268701 (Badikov 1990) = rabbit conjunctival instillation of 3H-DSIP, radiolabel distribution only, no F and no t1/2, and not nasal; PMID:9876605 (Chiang 1998) = transdermal iontophoresis across in-vitro skin, |

## Occupancy removed — no genuine subject-primary (2026-06-30 re-source sweep, relaxed rule, batch 5)

Even under the relaxed rule (genuine subject-primary full-text values accepted), these had only GtoPdb-aggregate or comparator-paper sources.

| Compound | Removed | Why | PMIDs chased |
|---|---|---|---|
| **fulvestrant** | occupancy estrogen_receptor | A subject-primary with an absolute human ERalpha Ki in nM may exist in older full-text tables I could not access; if found, prefer recite_and_correct over remov | PMID:12672240 (Schmidt 2003, de novo phenanthrene ERalpha ligand design) — fulvestrant/ICI 182,780 used only as a reference standard in the human recombinant ERalpha competition assay (comparator, not subject); absent from abstract; this is ALSO GtoPdb's cited source for fulvestrant ERalpha Ki 1.04  |
| **ipratropium** | occupancy muscarinic | If a value is preferred over removal, Haddad 1999 (PMID:10385241) is the best genuine human measurement (Ki 0.5-3.6 nM, ~1-2 nM midpoint -> ec50 ~0.0003-0.0007  | PMID:16847442 (Dowling 2006, currently cited) = human M3 antagonist-kinetics methods paper; never names ipratropium nor any 0.28 nM Ki (abstract_silent confirmed). PMID:10385241 (Haddad 1999, Br J Pharmacol) = genuinely measures ipratropium but as a COMPARATOR to glycopyrrolate; human lung/HASM Ki 0 |

## Occupancy removed — no genuine subject-primary (2026-06-30 batch 6)

| Compound | Removed | Why | PMIDs chased |
|---|---|---|---|
| **sulindac** | occupancy cox_1 | The value is pharmacologically real (the active metabolite), so this is a citation/attribution failure rather than a fabricated number; a reviewer may | PMID:10377455 (Warner 1999, PNAS) - value is the metabolite sulindac sulfide's (COX-1 IC50 ~1.9 uM), and sulfide is one of >40 NSAIDs in a comparator whole-blood screen; abstract silent (IC50s in tables only). PMC9913705 (Cancer 2023) - sulindac sulfide COX-1 IC50 ~1.2 uM used on |
| **tamoxifen** | occupancy estrogen_receptor | Tamoxifen is a prodrug; if an ER-occupancy row is still wanted it should be authored on the active metabolite 4-hydroxytamoxifen (analogous to sulinda | PMID:9048584 (Kuiper 1997, the cited paper): rank-order competition only, NO numeric Ki, and ranks tamoxifen among the LOWEST-affinity ERalpha ligands (4-OH-tamoxifen is the potent species) -- cannot support 15.5 nM. PMID:7317574 (Fabian 1981, tamoxifen-subject, human breast-carc |

## PK/occupancy removed — no genuine subject-primary (2026-06-30 batch 7)

| Compound | Removed | Why | PMIDs chased |
|---|---|---|---|
| **adenosylcobalamin** | pk.PO | Proving a negative: PubMed searches (cobamamide/adenosylcobalamin + pharmacokinetics/plasma/half-life/absorption) returned no subject-primary. Oral co | PMID:22116707 (currently cited) — B12 cofactor enzymology biochemistry review; abstract has zero PK (t1/2/F/V), per flag. PMID:21432861 (Mendes 2012, Biomed Chromatogr) — the ONLY cobamamide+'pharmacokinetics/plasma' hit; its analyte is cyproheptadine, cobamamide is a 1 mg minor  |
| **centrophenoxine** | pk.PO | No subject-primary reports human plasma PK (t1/2/F/Vd/ka) for the PARENT centrophenoxine/meclofenoxate: the ester is hydrolysed by esterases to DMAE + | PMID:18840370 (current citation — bioequivalence study; assays the metabolite chlorophenoxyacetic acid, parent centrophenoxine NOT detected; reports only BE confidence intervals). PMID:20515527 (Ni 2010 J Chromatogr Sci — HPLC PK of the METABOLITE chlorophenoxyacetic acid in huma |
| **degarelix** | pk.SC | The ~53-day (1272 h) terminal half-life is a formulation-specific value for the marketed 240 mg / 40 mg/mL monthly SC depot that appears only in the F | PMID:26513436 (current citation — expert-opinion review, no numeric PK). PMID:15139513 (Tornøe 2004 Pharm Res — popPK SC-depot model built from phase I IV+SC dose-escalation data; models depot release and bioavailability, does NOT report a terminal half-life). PMID:16967346 (Jadh |

## PK removed — no genuine subject-primary (2026-06-30 batch 8)

| Compound | Removed | Why | PMIDs chased |
|---|---|---|---|
| **delphinidin** | pk.PO | Aglycone delphinidin is unstable at physiologic pH and is not quantified as parent in human plasma; stored F=0.001 and t1/2=1.8 h are generic anthocya | PMID:29115354 (cited, Kalt 2017 Food Funct): urinary total/parent anthocyanin excretion from blueberry juice; delphinidin aglycone never named, measures urine not plasma, no half-life. No delphinidin-subject primary exists: PubMed 'delphinidin plasma half-life elimination' return |
| **hyaluronic-acid** | pk.TD | Both stored TD values are unsupported: F=0.02 (transdermal systemic bioavailability) and half_life_hr=12. High-MW hydrophilic HA does not meaningfully | PMID:7514978 (current, Goa & Benfield 1994, Drugs) = review of HA in ophthalmology / intra-articular osteoarthritis / wound healing; gives NO systemic or transdermal PK (no F, no half-life). Topical/transdermal-delivery literature (e.g. SPACE-peptide, nanoemulsion studies) report |
| **inosine** | pk.PO | Stored half_life_hr=1.5 for oral inosine is unsupported. Inosine is rapidly and largely presystemically metabolized (ADA/PNP) to hypoxanthine/xanthine | PMID:11724447 (current) = MS clinical / serum-urate study of oral inosine; abstract silent on inosine PK. PMID:11912550 (Yamamoto 2002, Metabolism; oral inosine 20 mg/kg in 5 healthy subjects) measures plasma uridine/hypoxanthine/xanthine/urate peaking ~2.5 h and states inosine i |
| **isoleucine** | pk.PO | No genuine subject-primary characterizes oral isoleucine PK (ka_hr/F/V_L/half_life_hr). Isoleucine is an endogenous amino acid studied nutritionally ( | PMID:15930473 (current) = 'Observations of branched-chain amino acid administration in humans' — narrative BCAA/MPS review, leucine-centric, no PK parameters; PMID:40686357 = human oral PK of 4-hydroxy-isoleucine — different molecule (fenugreek metabolite), not isoleucine; PMID:9 |
| **leucine** | pk.PO | No genuine subject-primary reports oral leucine PK (ka_hr/F/V_L/half_life_hr). Leucine kinetics are studied as stable-isotope whole-body turnover/oxid | PMID:15930473 (current) = 'Observations of branched-chain amino acid administration in humans' — narrative review of leucine/BCAA effects on muscle protein synthesis, no PK parameters; PMID:25016073 = bestatin/cefixime PEPT1/OAT1-3 drug-drug-interaction study — leucine is not the |
| **magnesium-l-threonate** | pk.PO | A subject-primary reporting compartmental oral PK for Mg-L-threonate does not appear to exist; EFSA figures (Mg F ~15-20%; threonate t½ 2-4 h) derive  | PMID:20152124 (Slutsky 2010, Neuron) — the current citation; rat learning/memory + synaptic-plasticity efficacy, brain/CSF Mg only, NO F/Vd/t½. PMID:23658180 (Li 2013, J Neurosci) — AD-mouse cognition/brain-Mg study, no PK parameters. PMID:42084749 (2026, Neuromolecular Med) — Mg |

## PK removed — no genuine subject-primary (2026-06-30 batch 9)

| Compound | Removed | Why | PMIDs chased |
|---|---|---|---|
| **methylcobalamin** | pk.PO | Stored oral values are generic B12 figures (half_life 144 h = whole-body cobalamin turnover; F 0.04 = generic high-dose passive-absorption estimate), not methylcobalamin-specific. PMID:32966937 (Hotta 2020) is a genuine mecobalamin LC-MS/MS PK paper but reports no t1/2/F/Vd in the abstract and full text is inaccessible — logged as a future full-text candidate. | PMID:18709891 (Carmel 2008, cited) = B12 fortification review, no MeCbl PK number. PMID:32966937 (Hotta 2020) = mecobalamin bioanalytical PK paper, values not accessible. Eisai Methycobal insert (Tmax ~3 h) = label not primary. |
| **retinol** | pk.PO | No subject-primary reports the stored simple-PK set (t1/2 96 h, V 21 L, F 0.8, ka 0.5). Retinol plasma kinetics are RBP-bound / homeostatically controlled — the real primaries give a multi-compartment tracer model, not a single-compartment F/V/t1/2. Stored values are textbook aggregates. | PMID:8895053 (von Reinersdorff 1996) = [13C]retinyl-palmitate tracer, only "slow final elimination", no numeric t1/2/Vd/F. PMID:9781391 (1998 compartmental model) = 34% absorption of a pharmacologic load (contradicts F=0.8), no t1/2/Vd. PMID:27830502 (cited) = narrative review, no PK. |
| **sulbutiamine** | pk.PO | No genuine human PK subject-primary exists; stored PO values (F=0.8, ka=0.8, V_L=245, t1/2=5 h) are not reported in any indexed subject-primary. Old French manufacturer (Arcalion/Enerion) data may exist but is not retrievable/verifiable. | PMID:18549472 (cited) = benfotiamine mouse PK, sulbutiamine only a comparator. PMID:8186256 = rat-brain [14C]-sulbutiamine subcellular distribution (IP), no systemic PK. PMID:31810115/31193162/39302148 = in-vitro, no PK. PMID:36286970 = Russian narrative review. |

## PK removed — no genuine subject-primary (2026-06-30 needs_review sweep)

| Compound | Removed | Why | PMIDs chased |
|---|---|---|---|
| **apigenin** | pk.PO | No human subject-primary reports t½, V, or a formal F — only qualitative very-low oral absorption (Cmax ~127 nmol/L at ~7 h; urinary recovery 0.2–0.5% of dose). Stored half_life 5 h / V 84 L / F 0.03 were cited to a polyphenol review with no apigenin-specific PK. Consistent with other poorly-absorbed polyphenols (caffeic/chlorogenic/ellagic/ferulic acid, hydroxytyrosol, oleuropein, taxifolin) which carry no pk block. | PMID:16407641 (Meyer 2006, human apiin/parsley absorption) = genuine subject-primary but reports only Cmax/Tmax + 0.22% urinary recovery, no t½/V/F. PMID:35452808 (Borges 2022, human ADME) = "apigenin per se poorly absorbed", metabolite Cmax/Tmax only, no parent t½/V/F. PMID:15113710 (Manach 2004, cited) = polyphenol review, no apigenin PK. Gradolatto 2005 rat t½ 91.8 h = non-human; review-cited 2.52 h = non-primary. |

## Occupancy known but not authored — blocked on keo, or definitive negative (2026-07-01 completeness fills)

The registry couples receptor_occupancy with effect_compartment.keo_per_h (lint `receptor.needs-keo`): an occupancy row is only valid if the compound also has a keo for Ce(t). These compounds have (or lack) a genuine subject-primary affinity but cannot get a valid occupancy row without a keo primary, which does not exist for them.

| Compound | Target | Status | Source chased |
|---|---|---|---|
| **phenibut** | GABA-B | Genuine subject-primary affinity exists (Dambrova 2008, PMID:18275958: racemic phenibut Ki 177 µM, R-phenibut 92 µM; **rat brain membranes**, [3H]CGP54626) but (a) no keo/PK-PD onset primary exists to satisfy the occupancy⇒keo invariant, and (b) µM affinity yields negligible modelled occupancy at any realistic dose. Not authored; affinity recorded here. | PMID:18275958 (affinity, rat); no human GABA-B binding + no keo study for phenibut. |
| **withanolide-a** | GABA-A | **Definitive negative** — Candelario 2015 (PMID:26068424) isolated purified withanolide A and tested it directly on native GABA-A + GABAρ1 (Xenopus oocytes, TEVC): neither withanolide A nor withaferin A activated the receptors; the ashwagandha GABAergic effect is carried by the whole extract, not this compound. No occupancy row exists to author. | PMID:26068424 (direct negative); GtoPdb has no withanolide ligand/affinity. |

## Occupancy/PK known but not authored — receptor not in occupancy vocabulary, or keo-blocked (2026-07-01 completeness fills, batch b3)

These completeness-gap compounds have a genuine subject-primary affinity (recorded below for a future model extension) but cannot get an occupancy row: either the target receptor has no canonical occupancy slug (would need OCCUPANCY_TO_CATALOG + receptors.json + direction map code changes), or the occupancy⇒keo invariant is unmet with no genuine keo primary. Most already carry authored PK.

| Compound | Target (status) — affinity, blocker |
|---|---|
| **igf-1-lr3** | pk (unauthored) | No human PK subject-primary exists (research reagent). Only rat IV-tracer studies (PMID:7693845 MCR 9.19 ml/min/kg; 8897852; 10607940) — all show LR3 cleared *faster* than IGF-I, contradicting vendor "20-30 h t½". Also IGF-1R not in occupancy vocab. |
| **edoxaban** | factor_xa (in-model) | Affinity known: Ki 0.561 nM free FXa (Furugohri 2008, PMID:18624979). Blocked on keo — anti-FXa is direct-response (Emax, no effect compartment; Zou 2025 PMID:39526427), like registry siblings apixaban/rivaroxaban. |
| **lixisenatide** | glp_1r (in-model) | Affinity known: IC50 1.43 nM human GLP-1R (Werner 2010, PMID:20570597). Blocked on keo — indirect/turnover PD only (PMID:34013770), like the deferred GLP-1 RA class. |
| **clenbuterol** | beta_2 (in-model) | Affinity known: KD 12.6 nM human β2 (Baker 2010, PMID:20590599, PMC2936015 Table 4). Blocked on keo — no PK-PD hysteresis/quotable peak-effect primary (Boner 1987 & Lodeweyckx 2024 time-courses paywalled). PK PO authored this pass. |
| **ghrp-2** | GHSR-1a | **AUTHORED 2026-07-01** (`2026-07-01-ghrp2-ghsr-occupancy.ts`; `ghsr: 'GHSR'` added to OCCUPANCY_TO_CATALOG — GHSR gtp_id 246 already in receptors.json). Occupancy = GtoPdb-curated rat GHS-R full-agonist pKi 9.3 → Ki 0.501 nM (ligand 1092 / interaction 2832; primary McKee 1997, PMID:9092793 — a competition-binding TABLE value: McKee's abstract quotes only the [35S]MK-0677 radioligand KD 0.7 nM). keo 1.13/h = human, VERBATIM in Pihoker 1998 abstract (PMID:9543135). mw 818.0 (PubChem CID 6918245). FLAG unchanged: pk.SC provenance still leans on the IV-only Pihoker study. |
| **ghrp-6** | GHSR-1a | **Not authorable — affinity claim retracted (2026-07-01 re-verification).** GHSR is now mapped (see ghrp-2), but no verifiable GHRP-6 affinity exists: Bednarek 2000 (PMID:11087562) characterizes GHRELIN + ghrelin-derived short peptides, NOT GHRP-6 (misattribution — the "~0.8 nM" is ghrelin's active core, not GHRP-6's); Howard 1996 (PMID:8688086, Science GHS-R cloning) is qualitative with no number; GtoPdb ligand 11814 has no curated interaction. Also no GHRP-6-specific keo (a GHRP-2 analog-basis keo would be defensible per the hydrocodone precedent, but only once a real affinity surfaces). Plus mw_g_mol null. |
| **gonadorelin** | GnRH-R | Not in occupancy vocab (zero occupancy rows use it). Human affinity exists (Nederpelt 2016 pKd 7.7-8.5, PMID:26398856). Effect is downstream endocrine (biphasic) — no simple keo. |
| **hexarelin** | GHSR-1a + CD36 | Neither in occupancy vocab. GHSR-1a Ki ~0.6 nM only in secondary/vendor sources. |
| **ipamorelin** | GHSR-1a | Not in occupancy vocab. Only functional rat EC50 1.3 nM (Raun 1998 PMID:9849822); human SC50 214 nM is a PK/PD potency not a Ki (Gobburu 1999 PMID:10496658). |
| **lanreotide** | SSTR2/SSTR5 | Not in occupancy vocab. Human affinities exist (Patel & Srikant 1994 PMID:7988476; GtoPdb SSTR2 pKi 8.7-9.6). Only direct-Imax PD model (Garrido 2012 PMID:21551318) — no keo. |
| **sermorelin** | GHRHR | **NOT authorable — prior claim retracted (2026-07-01 re-verification).** GHRHR is reachable (would need `ghrhr: 'GHRHR'`; gtp_id 247 already in receptors.json), but BOTH pieces fail abstract-level checks: (a) **affinity** — Gaudreau 1992 (PMID:1534126) is a RELATIVE-affinity (RA %) analogue study with no absolute pIC50 for sermorelin itself; GtoPdb ligand 6998 → GHRHR carries a qualitative "Agonist" with NO numeric affinity. The earlier "rat pIC50 8.2" is not in that abstract. (b) **keo** — the claimed 1.39/h is NOT in Tiulpakov 1995 (PMID:7586605), whose abstract is a peak-GH/AUC i.v.-bolus comparison with no PK-PD effect-compartment model. Re-author only if a full-text keo AND an absolute GHRHR affinity surface. FLAG: SC t½ 0.2h vs paper IV t½ 4.3min. |
| **huperzine-a** | acetylcholinesterase | AChE has no occupancy slug (all registry AChE inhibitors — donepezil/galantamine/rivastigmine/tacrine/physostigmine — carry occupancy=null). Affinity real (rat cortex Ki 7 nM, Zhao & Tang 2002 PMID:12445575). |
| **niacin** | GPR109A/HCA2 | Not in occupancy vocab. Affinity real (Wise 2003 PMID:12522134; Tunaru 2003 PMID:12563315). Endpoint is downstream plasma-FFA — no keo. FLAG: existing PK cited to a review (Pieper 2003). |
| **mirabegron** | beta_3/ADRB3 | No β3 occupancy slug (only β1/β2 mapped). Human β3 EC50 22.4 nM (Takasu 2007 PMID:17293563); β1/β2 EC50 ≥10 µM (negligible — would misrepresent if authored as β1/β2). |
| **pramlintide** | amylin (AMY1-3) | Not in occupancy vocab (only cgrp_receptor in the family, a different target). Human potency exists (Gingell 2014 PMID:24169554). No effect-compartment keo (PMID:38064957 drives PD from plasma). |

## needs-citation occupancy — keo-blocked / no clean human Ki (2026-07-01 completeness fills, batch b2)

| Compound | Target — affinity, blocker |
|---|---|
| **meclizine** | H1 | keo-blocked + no clean human Ki. Genuine H1 Ki only bovine (Kubo 1987, PMID:2884340); vendor 250 nM has no primary. Onset ~1h (Wang 2012, PMID:21903894) is clinical, not a measured t_eq. |
| **orphenadrine** | muscarinic / NET | keo-blocked + no numeric human Ki. Muscarinic affinity only qualitative "low" in rat (Syvalahti 1988, PMID:3353357); human M1-M5 panel (Bolden 1992, PMID:1346637) paywalled + does not confirm orphenadrine. Only quantified human affinity is NMDA (Ki 6 µM, Kornhuber 1995, PMID:8788072) — out-of-model. |
| **prochlorperazine** | dopamine_d2 | keo-blocked. D2 affinity exists (GtoPdb pKi 8.4 ~4 nM, no primary; rat only — Hamik 1989 PMID:2527092). No effect-site keo primary. |

## Completeness gaps — b4 (2026-07-01): target not in occupancy vocabulary / keo-blocked / depot flip-flop

| Compound | Target — affinity, blocker |
|---|---|
| **trestolone** | pk (unauthored) | IM acetate depot; human systemic t½≈40 min for unesterified MENT (Kumar 1997 PMID:9283946), but no depot PK study — depot is absorption-limited (flip-flop), so 40-min t½ would misrepresent duration. Implants steady-state only (PMID:10717782). |
| **brompheniramine** | H1 | keo IS supportable (Simons 1982 PMID:6128358, wheal/flare PD) but NO clean racemate human H1 Ki: only Novartis SPD AC50 52 nM (Sutherland 2023, PMID:37468498), internally inconsistent (8× vs eutomer 6.3 nM) + class-outlier vs sibling antihistamines; vendor "6.06 nM" = the eutomer. Left open. |
| **calcitonin** | calcitonin receptor (CALCR) | Not in occupancy vocab. Human/salmon-CT affinity exists (Kd ~0.44 nM, Andreassen 2014 PMID:24643196). PK.SC authored this pass. |
| **goserelin** | GnRH-R | Not in occupancy vocab. Human GnRH-R affinity exists (Nederpelt 2016, PMID:26398856). Downstream endocrine effect — no simple keo. |
| **pyridostigmine** | acetylcholinesterase | AChE has no occupancy slug (all registry AChE inhibitors carry occupancy=null). PK already present. |
| **rituximab** | CD20 | keo-blocked (biologic; no effect-site model). CD20 affinity known (Reff 1994, PMID:7506951). CD20 not in occupancy vocab either. |
| **secretin** | secretin receptor (SCTR) | Not in occupancy vocab. Human affinity exists but wrong-target for the model. |
| **zileuton** | 5-lipoxygenase (ALOX5) | Enzyme not in occupancy vocab. Affinity real (Carter 1991, PMID:1848634). |

## PK half-life — PD-orphan + unvisited-cell closure (2026-09-06)

Two literature passes run while closing the registry's last 32 unvisited cells
and the new `pd.needs-solvable-pk` lint rule. Applied in
scripts/authoring/2026-09-06-systems-tagging-and-cbn.ts
and scripts/authoring/2026-09-06-gap-closure.ts.
Every PMID below was fetched from NCBI E-utilities and read directly.

### Authored

| Compound | Route | Value | Source |
|---|---|---|---|
| **cannabinol (cbn)** | INH | t½ 43 h, F 0.39, V 3500 L (50 L/kg) | Johansson 1987, PMID:2960395 — *"The apparent terminal half lives for CBN were 32 +/- 17 h and 43 +/- 29 h after intravenous administration and smoking, respectively."* Clears the `pd.needs-solvable-pk` flag on CBN's CB2 occupancy row. |
| **cocaine** | IN / PO | t½ 1.25 h / 0.8 h | Wilkinson 1980, PMID:7357795 — *"75 +/- 5 min"* (IN, n=7) and *"48 +/- 3 min"* (PO, n=4). |
| **cocaine** | IV / INH | t½ 1.3 h / 1.15 h, V 189 L, IN F 0.80 | Jeffcoat 1989, PMID:2565204 — *"the elimination half-life was 78 min"*; *"2.70 liter/kg for V beta"*; *"Bioavailability was good after ni (80%)"*. The INH value is the abstract's pooled across-route figure (*"the half-life based on the average rate constant was 69 min"*) — its 1.1 min smoked figure is ABSORPTION half-time, not elimination. |
| **methamphetamine** | PO | t½ 10.1 h | Cook 1992, PMID:1362938 — *"The average elimination half-life was 10.1 hr (range of 6.4-15.1 hr)."* Oral only; the other routes stay unauthored. |

### Skipped — PD authored but no solvable route (`pd.needs-solvable-pk`)

These carry a kₑₒ and/or receptor occupancy rows that render identically zero
until a PK route exists. All chased 2026-09-06; none is authorable.

| Compound | Chased | Why skipped |
|---|---|---|
| **beta-caryophyllene** | PMID:35566210 (Mödinger 2022, a real 100 mg single-dose crossover, n=24) | Reports Tmax only, and the abstract states outright that *"human pharmacokinetics (PK) remain unknown"*. 11 further PMIDs are reviews or preclinical. |
| **dsip** | PMID:6379493 (Kato 1984), PMID:7028502 | Only animal PK exists: *"a mean half-life of 4.0 +/- 0.7 min in the dogs"* (dog/monkey/rat). The human IV work reports sleep effects with no PK number. |
| **magnesium-l-threonate** | PMID:42084749, 23658180 (retracted), 27829572 | No PK paper exists for the compound at all, human or animal — the literature is rodent cognition work. |
| **trenbolone** | PMID:11713000 | Veterinary/environmental only; the *"half-life of 267 days"* found is degradation in liquid manure, not a PK parameter. Corroborates the 2026-06-20 row above. |
| **s23** | PMID:38517236, 32519780, 20967890 | Never entered human trials. Chased papers are capsule-content NMR, equine/bovine assays, and canine metabolites of *S-22* — a different compound. Corroborates the 2026-06-20 row above. |
| **mdpv** | PMID:26253621 (Novellas 2015) | Only *"The elimination half-life in the striatum (61 min)"* — rat, brain tissue not plasma, subcutaneous route. α-PHP papers cover a different cathinone. |
| **rauwolscine** | >150 abstracts surveyed | Appears exclusively as an *in vitro* [³H]rauwolscine radioligand, never as an administered agent. Do not substitute yohimbine — it is a distinct stereoisomer. |

### Skipped — unvisited cells now marked `pk_unauthored`

Re-confirmations of rows already above are marked; the rest are new.

| Compound | Reason recorded | Chased |
|---|---|---|
| **harmine** | uncharacterized | PMID:39301926 (2024 Phase 1 SAD, abstract gives MTD/AEs only), 39923404, 12660312 (ayahuasca; harmine levels *"negligible"*), 33119972, 10404423, 12361741. PMID:9174681's ≈4 h belongs to **esuprone**, not harmine. |
| **harmaline** | uncharacterized | Shares harmine's literature; no dosing PK study. |
| **salvinorin-a** | uncharacterized | PMID:26880225 (Johnson 2016, dedicated inhalation PK study) says only *"Drug levels peaked at 2 min and then rapidly decreased"*; 22817868, 26874330 likewise qualitative; 21140258 sublingual, mostly below LOQ; 19462483 is rat IP. |
| **delta-8-thc** | uncharacterized | PMID:41830876 (enzyme inhibition), 38836589 (assay validation, and covers Δ8-THC**V**), 32322680 (Δ8 not detected). PMID:28942005 is a Δ9-THC paper. No Δ8 human t½ published. |
| **enclomiphene** | uncharacterized | Re-confirms 2026-06-20 row: PMID:19033451 states the half-life *"could not be determined due to a very flat terminal half-life and the long-tailed residence time"*. |
| **testosterone-propionate** | uncharacterized | Re-confirms 2026-06-20 row. PMID:4010287 is nandrolone esters; PMID:7543113 is enanthate/buciclate. Neither may be substituted. |
| **androstenedione** | uncharacterized | Re-confirms 2026-06-20 row: PMID:10359391, 10683057, 11502792 report testosterone/estradiol AUC and urinary excretion, never an androstenedione t½. |
| **methandrostenolone** | uncharacterized | Re-confirms 2026-06-20 row. PMID:2214760 covers metabolite artifacts; 24055830/19919183/22885098 give urinary detection windows (~26 days), not plasma t½; 2723001's "16 min" is in-vitro sulfate hydrolysis in equine urine; 3539458's t½ belongs to insulin. |
| **drostanolone** | uncharacterized | Re-confirms 2026-06-20 row: doping-control detection windows only. |
| **pcp** | uncharacterized | Literature is toxicological and analytical; no modeled elimination half-life in any abstract. |
| **semax, n-acetyl-semax, n-acetyl-selank** | uncharacterized | Clinically used in Russia; published work covers effects and mechanism, never peptide plasma kinetics. |
| **glucose, fructose** | homeostatic | Not a citation gap. Plasma level is defended by counter-regulation (glucose) or removed on hepatic first pass (fructose), so a Bateman curve is the wrong model regardless of what any paper reports. |
| **thcv, hhc, 2c-b, 2c-e, 2c-i, dom, bufotenin, methoxetamine, mephedrone, methylone, alpha-pvp** | research-only | Designer/research chemicals with analytical and forensic literature but no controlled human PK. 2c-b re-confirms the 2026-06-20 row (rat SC 1.1 h only, PMID:18339493, which itself states human PK *"is unknown"*). |

## PK provenance stripped — citations that did not support their values (2026-09-06)

Found by the `pk.shared-source-conflict` lint rule: pairs of records that are
the same molecule under two slugs, citing the same PMID, storing different
numbers. Repaired in
scripts/authoring/2026-09-06-citation-defects.ts
by keeping what each abstract states verbatim and dropping what it does not.
The dropped parameters are now open authoring targets.

| Compound.route | Dropped | Why | Re-author target |
|---|---|---|---|
| `arginine.PO`, `arginine.IV`, `l-arginine.PO` | `ka_hr`, `V_L` | Bode-Böger 1998 (PMID:9833603) states oral F *"68+/-9 (51-87)%"*, three clearances and three half-lives, but **no Tmax and no volume of distribution**. The pair had stored ka 1.5 vs 1.0 and V_L 28 vs 116 L under this one citation. (116 L looks like V/F recorded as V; 28 L is closer to the ~0.3–0.5 L/kg expected of a polar amino acid — the abstract cannot settle it.) Half-lives were corrected to the arms the paper names: 79.5 min oral → 1.33 h, 59.6 min at 6 g IV → 0.99 h. | A crossover with reported Vd, or full text for the volume. |
| `cdp-choline.PO`, `citicoline.PO` | `source_pmid` | Dinsdale 1983 (PMID:6412727) reports absorption/metabolism/excretion of ¹⁴C-CDP-choline **in prose only** — no ka, no volume, no F, no half-life. It says *"Absorption was virtually complete with less than 1% of the dose being found in the faeces"* and describes plasma peaks *"at 1 h, and a second larger peak at 24 h"*. The stored ka (0.8 vs 0.4), V_L (35 vs 25), F (0.99 vs 1.0) and the **56 h half-life on both** are uncited. Secades reviews (PMID:8709678, PMID:17171187) repeat the same qualitative claim with no number and are reviews, not primaries. | A primary citicoline PK study with numeric parameters; none located 2026-09-06. |
| `cortisol.IM`, `hydrocortisone.IM` | `source_pmid` | Hahner 2013 (PMID:23672956) reports only Cmax (*"110+/-29 vs 97+/-28 microg/dl"*), tmax (*"66+/-51 vs 91+/-34 min"*) and time-to-threshold for i.m. vs s.c. hydrocortisone. No volume, no half-life, no F, no ka. A ka derived from the IM tmax would be defensible, but the two records derived **different** values (1.89 vs 1.58 /h) from that one tmax, so at least one derivation is wrong; their V_L (35 vs 30 L) and t½ (2 vs 1.5 h) come from different sources for one molecule. | Derive a single ka from the paper's IM tmax and apply it to whichever record survives the duplicate merge (DATA_QUALITY_BACKLOG §7). |

Note the shape of the failure: in all three cases the registry held **two
records for one molecule**, each independently authored, and the duplication is
what let a citation drift away from its numbers unnoticed. Resolving the
duplicate slugs (DATA_QUALITY_BACKLOG §7) removes the conditions for it.

## Data dropped in the duplicate-slug merge (2026-09-06)

Ten duplicate records were merged and retired
(scripts/authoring/2026-09-06-merge-duplicate-slugs.ts,
rationale in DATA_QUALITY_BACKLOG.md §7). Each
survivor kept its own authored PK; the retired record's PK was NOT grafted on,
because merging two independently-authored parameter sets is how the
contradictions arose. Two drops are worth re-authoring:

| Lost | From | Why dropped | Re-author target |
|---|---|---|---|
| Ethanol IV route | the retired `alcohol` record (V 42 L, F 1, t½ 0.25 h, PMID:11003200) | The surviving `ethanol` record models alcohol's elimination as saturable (Michaelis-Menten, Vmax 230 mg/L/h, Km 80 mg/L, Holford 1987 PMID:3319346), which is the whole reason the fifth drink hurts disproportionately. A flat 0.25 h first-order IV half-life beside that gives one molecule two elimination models depending on route. | Author IV with the SAME MM parameters and F = 1 — saturable elimination is systemic and route-independent — once someone confirms the volume for the IV arm. |
| S-23 oral t½ 12 h | the retired `s-23` record | Uncited, and the surviving `s23` record is marked research-only precisely because S-23 never entered a human trial. Vendor figures for it disagree (11.9 h vs 24–36 h). | None expected; a real S-23 human PK study probably does not exist. |

Also note: `alcohol` and `ethanol` had disagreed on the saturable parameters
themselves (Vmax 136 vs 230 mg/L/h, Km 96 vs 80 mg/L, from PMID:11003200 and
PMID:3319346 respectively). The merge keeps Holford 1987, the source the Wave 4a
authoring session chose (a since-deleted roadmap recorded the same choice). The other paper's fit
remains a legitimate alternative if someone wants to re-verify which better
matches the registry's dosing range.

## PK re-sourcing — dead-end trails (2026-09-06, second pass)

Six parallel agents fetched every candidate abstract through NCBI E-utilities to
close the five `pk.pmid` warnings and the four "both records carry PK" identity
collisions. Applied in
scripts/authoring/2026-09-06-pk-resourcing.ts.
The searches below came back empty — **do not re-chase them from abstracts**;
each needs full text, a label, or does not exist.

| Cell | Verdict | Trail |
|---|---|---|
| **dextromethorphan** pk.PO ka / V / F | Not authorable from any abstract; the removed F 0.11 and V 300 L are DOG values | ~47 abstracts. DM is published almost exclusively as a **CYP2D6 probe**, so abstracts report AUC/Cmax ratios for the *other* drug, never DM's own disposition. No human IV/oral crossover exists, so absolute F is underivable. PMID:15500572 (KuKanich 2004) is the source of the stored numbers: 6 healthy **dogs**, verbatim "apparent volume of distribution … 5.1 +/- 2.6 L/kg" and "Oral bioavailability was 11%". Probe-only rejects: 36924284, 22147075, 21456632, 16984212, 12403641, 11192474, 10848718, 8963481, 7690693, 18362694, 25028073, 31378969, 34107166, 27273149, 38598106, 30084103, 13129991, 21870106, 15491104, 24697814, 22777153, 23222033. Human-but-numberless: 3679620 (Silvasti, qualitative), 8741125 (names parameters, reports none), 9840216 (dextrorphan, relative F only), 10698361 (metabolite). Excluded by rule (quinidine co-administration): 23340533, 15342614. |
| **nabumetone** pk.PO F | No abstract states the fraction converted to 6-MNA | 30+ abstracts including every dedicated review (1474531, 9435990, 3688000, 10841070, 3293969). Targeted searches for the ~35% figure returned nothing — it appears to live only in the Relafen prescribing information. Two near-misses that are **not** F: PMID:1474531 "At least 80% of nabumetone is absorbed" (parent absorption, and the likely origin of the removed F 0.8) and PMID:2884189 "systemic availability was 32% of the dose" (parent, 6 cirrhotic patients, no controls). |
| **nabumetone** pk.PO V | No healthy-subject volume | PMID:7781261 (Brier 1995) verbatim "The apparent volume of distribution … ranged from 23 to 60 L", but across a population including renal impairment and haemodialysis; the abstract never isolates a normal-control value. |
| **citicoline / cdp-choline** whole PK block | No modelable human PK — record marked `uncharacterized` | 45 abstracts, 16 query formulations, plus the full 1983 *Arzneimittelforschung* 33(7A) supplement title list. Human sources are qualitative only: PMID:6684463, 8709678, 17171187 all say bioavailability is "practically the same" as IV without a number. The only numeric half-life in the corpus is PMID:4059318 (Paroni 1985) — **rat**, total ¹⁴C radioactivity, "half-life ranging from 2.0 to 2.6 days", the midpoint of which was the registry's 56 h. PMID:22951317 (Sarkar 2012) is a real human oral PK study in 12 volunteers but its abstract publishes no values; full text is the only route to a number. |
| **cortisol / hydrocortisone** pk.IM | Route removed as unsourceable | `hydrocortisone[ti] AND (intramuscular[ti] OR intramuscularly[ti])` returns 8 records in all of PubMed, none a human IM PK study with numbers. PMID:32170323 (Prete 2020) is the right design — 10 adrenal-insufficiency patients, 6-hourly IM bolus, "Linear pharmacokinetic modeling" — but states no IM-specific parameter. PMID:23672956's IM tmax 66 min cannot yield a ka: the conversion needs an imported `ke` from another paper, and PMID:7120045 shows hydrocortisone's `ke` is itself dose-dependent through CBG saturation. Rejects: 22632064, 21879982, 25366540 (horses), 233690 (qualitative), 3035512 (no abstract), 14594169/14594168 (questionnaire), 18848765/15579180 (ACTH, not hydrocortisone). Wrong-route rejects carried over: 7398193, 11361050, 1600051, 1800704 (rectal). |
| **brompheniramine** H1 affinity | No abstract names a brompheniramine H1 Kᵢ/Kd/pKᵢ/IC50 | 17 abstracts fetched, ~65 title-triaged, 20 queries. Brompheniramine recurs as a *named comparator* whose value sits in a table. Two full-text leads: PMID:1970615 (Onaran 1990) names "(+)-brompheniramine" and says equilibrium constants "were therefore determined in the common carotid artery" — no value in the abstract; PMID:28040476 (Hishinuma 2017) is [³H]-mepyramine displacement at **human H1 in CHO cells** across 20 antihistamines, the ideal preparation, but names no per-drug number. PMID:37468498 re-confirmed as unusable: its abstract contains neither "brompheniramine" nor "H1". |
| **brompheniramine** pk.PO ka / F | Removed as unsourced | PMID:6128358 (Simons 1982) states t½ 24.9 h, V 11.7 L/kg and Tmax 3.1 h but no ka and no F (no IV arm). The removed ka 2 /h implies a Tmax under an hour, contradicting the paper's own 3.1 h. Note the stored V is apparent (V/F), so re-applying an independent F would double-count bioavailability. |
| **zinc** pk.PO (all four params) | Removed; record marked `homeostatic` | PMID:18271278 (Gandia 2007, 12 women, 15 mg) computed Cmax/Tmax/AUC but published none of them, has no IV arm, and studies **bis-glycinate vs gluconate** — neither the generic ion nor picolinate. Its only quantitative result is the relative "+43.4%". |
| **zinc-picolinate** pk.PO (all four params) | Removed; record marked `homeostatic` | PMID:3630857 (Barrie 1987) is a four-week static-endpoint crossover (hair/urine/erythrocyte zinc) with **no concentration-time sampling at all**, so it cannot support a half-life, ka, V or F. The record's "~30% bioavailable" note had no source and was removed with them. |
| **calcium / calcium-carbonate** pk.PO t½, ka, V | Removed; records marked `homeostatic` | Both citations support only their absorption fraction (PMID:2816495 verbatim "0.26 and 0.26"; PMID:22254052 verbatim "CaCO(3) (14.7 +/- 6.4)"). Neither abstract reports a half-life, ka or volume — the stored V pair (560 L vs 25 L for one ion) had no basis on either side. |

**The pattern worth naming.** Where a source genuinely contained a number, the
authoring session derived it correctly and often documented the derivation. Where
it did not, a plausible `{t½, ka, V, F}` quartet appeared anyway, with F clustering
at 0.25–0.3 and V varying wildly (14, 25, 30, 35, 300, 560 L) with nothing behind
it. Every unsupported value found in this pass has that quartet shape, which is
the signature of a template-filled PK block rather than authored values. The
`pk.template-quartet` heuristic is a candidate lint rule; until then, treat a
four-field PK block whose citation is a single non-PK paper as suspect.

## Mineral PK audit — dead-end trails (2026-09-06, third pass)

Four agents checked the ten mineral-salt records the `pk.template-quartet` lint
surfaced. Applied in
scripts/authoring/2026-09-06-mineral-pk-audit.ts.
Nine records lost their PK; **boron and lithium kept theirs** and were re-sourced.
Do not re-chase the searches below.

| Cell | Verdict | Trail |
|---|---|---|
| **magnesium** ×4 records (`magnesium`, `-citrate`, `-malate`, `-taurate`) | No modelable oral PK; all marked `homeostatic` | The shared citation PMID:11550076 (Ranade 2001) is a narrative REVIEW containing no numeral: "This review examines the bioavailability and pharmacokinetics of various magnesium salts and correlates pharmacodynamic action with the structure-activity relationship." The stored V 1050 L is independently impossible — every human magnesium volume in the literature is 13.65–49 L (0.25–0.44 L/kg), so it sat 20–75× above the entire published range. Swetha 2026 (PMID:42091979), a purpose-built healthy-volunteer oral study, declined to report a half-life at all: "Parameters dependent on terminal elimination (t1/2, AUC0-∞, CL/F, MRT) were not estimated because a clear terminal log-linear phase was not identifiable", with non-dose-proportional exposure. Sabatier 2003 (PMID:12775558), the only human oral+IV tracer study, needed a multi-pool exchange model where just ~25% of body Mg exchanges rapidly with plasma. Listed refs do not rescue it: PMID:14596323 is a 60-day relative-bioavailability ranking with no PK parameter, PMID:16548135 is Mg-depleted RATS. Fractional absorption in healthy adults spans 13–60% by meal and load (PMID:12936928, 14985216, 15035687, 11697813), so no single F is defensible. |
| **magnesium-glycinate** | Same; `homeostatic` | PMID:7815675 (Schuette 1994) is silent on ka, V and t½ and CONTRADICTS the stored F 0.4: "26Mg absorption was low but was not different for the two supplements (23.5% vs 22.8% for magnesium chelate and MgO, respectively)". It is also 12 ILEAL-RESECTION patients — a malabsorption cohort that cannot source a general-population value. Usable findings kept as prose: the glycinate-vs-oxide comparison and an earlier peak (mean difference 3.2 ± 1.3 h). |
| **magnesium — parenteral** | Real PK exists, deliberately NOT grafted on | Genuine one-compartment values exist for IV/IM MgSO4 at gram doses in preeclampsia and cardiac surgery: V 32.3 L + t½ 5.2 h (PMID:11568783), V 13.3 L (PMID:32642964), V 25.07 L (PMID:38872116), Vc 24 L + Vp 25 L (PMID:12403646), 0.31 L/kg non-pregnant (PMID:29169799), IM bioavailability 86.2% (PMID:23530757). These describe a therapeutic exposure that transiently overwhelms homeostasis, not a 300 mg supplement. A separate `magnesium-sulfate (parenteral)` record is the right home; see DATA_QUALITY_BACKLOG §8. |
| **zinc-acetate** | No modelable PK; `homeostatic` | PMID:8577018 (Henderson 1995) is a gastric-pH crossover in 10 volunteers reporting only plasma AUCs (524 / 378 / 364 / 66 µg·h/dL). With no IV arm, F is not derivable from it in principle, and it states no ka, V or t½. Its real finding is formulation-relative and is kept as prose. |
| **zinc-citrate / zinc-gluconate** | No modelable PK; `homeostatic` | PMID:24259556 (Wegmüller 2014) reports fractional ABSORPTION by double-isotope tracer: citrate "61.3% (56.6-71.0)" and gluconate "60.9% (50.6-71.7)". The stored 0.61 was citrate's figure copied onto gluconate, whose own number the same abstract supplies. Fractional absorption is a gut quantity measured over days of tracer collection; F is a dose-normalised AUC ratio against IV, and zinc has no meaningful zero plasma baseline to measure one against — measured plasma zinc is overwhelmingly the endogenous pool. Reading 61.3% as F 0.61 is a category error, not a rounding one. |
| **zinc — any half-life / V / absolute F** | Does not exist in any human abstract | 22 abstracts, 8 query formulations. The accepted structural model is 14 compartments with 25 kinetic parameters (Miller 2000, PMID:11049849). Plasma turns over 5.3 times per hour (Pinna 2001, PMID:11533268) and 131 times per day (Lowe 1997, PMID:9174477) — incompatible with the 4 h half-life the records stored. Absorption is saturable and status-regulated (Hambidge 2010, PMID:20200254: enterocyte saturation is "the principal means by which whole-body zinc homeostasis is maintained", max ~6 mg Zn/d), and Babcock 1982 (PMID:7078418) found an 11-fold intake increase produced "a mean plasma zinc mass increase of only 37%". Rejected: PMID:37111104 (human, on-topic, but no numeric result in the abstract), PMID:22466565 (Caco-2/rat). |
| **boron** ka / V / F | Removed; half-life KEPT and re-cited | The stored citation PMID:10050928 (Murray 1998) is a comparative REVIEW. It does carry "the half-life for elimination was essentially the same (approx 21 h) by either route", but no volume, no bioavailability figure and no absorption rate. Re-pointed at the primary: Jansen 1984 (PMID:6732506), 8 volunteers, 562–611 mg boric acid IV, "t1/2 beta 21.0 +/- 4.9 h" with "The 120 h urinary excretion was 98.7 +/- 9.1% of dose"; Schou 1984 (PMID:6595986) confirms "The halflife (t 1/2 beta) is 21 h (mean, 7 adult men)" orally. ka appears in no human boron abstract at all. V 40 L restated rather than quoted a THREE-compartment fit whose volumes are 0.251 / 0.456 / 0.340 L/kg. F 1 rested on qualitative "readily and completely absorbed"; the quotable number is 93.9% mean urinary recovery (PMID:6537937), which is recovery, not F. Excluded by kind and never to be merged: boron NEUTRON-CAPTURE and boron-DRUG literature (PMID:39965397 blood boron ~25 ppm, ~300× dietary; acoziborole PMID:40980908; carboranes PMID:35182542), dermal absorption (PMID:10050912, 9848109) and two poisonings (PMID:1432568 t½ 13.46 h, PMID:3378804 t½ 7.0 h). |
| **lithium** | Real PK; whole route re-sourced | The stored PMID:10890582 (Gai 2000) is a FOOD-EFFECT study of an in-house SUSTAINED-RELEASE matrix tablet; it names the parameters without quantifying them — "The results showed no differences in half-lifebeta, renal clearance, Vdbeta, AUC, tmax, Xinfinite(u), fraction absorbed and MRT" — so it supported none of the four stored values. Replaced by Valecha 1990 (PMID:2079355), 60 patients, single 900 mg (this record's typical dose): "volume of distribution 0.62 +/- 0.26 l/kg ... serum half life 15.34 +/- 6.06 h". Not used, and why: PMID:12242603 (IV, healthy) reports a 7.8 h beta phase the authors themselves flag as shorter than all prior reports, from a 1 h infusion with 48 h sampling — not a terminal phase; PMID:853379 ("Absolute availability of lithium") has NO ABSTRACT in PubMed so nothing is quotable; PMID:31025773 fixed both V and ka rather than estimating them; PMID:6896645 and PMID:3009841 are dogs. |
| **lithium** ka / F | Supportable but deliberately dropped | Both come from Thornhill 1978 (PMID:365541): "The mean half-lives of absorption, redistribution and elimination were 0.78 h +/- 0.05 (SE), 5.06 h +/- 0.23, 26.8 h +/- 4.5 ... for the ordinary form" (ka = ln2/0.78 = 0.89 /h) and "the ordinary preparation was completely absorbed but only 85% of the sustained-release form was absorbed". A second study and a qualitative F claim, so they were left to solver defaults with the evidence recorded on the record rather than mixed into one route. |

**Two structural findings from this pass**, both now enforced or logged:

1. **A counter-ion cannot change disposition.** Once Mg²⁺ or Zn²⁺ crosses the gut
   wall it is the same ion whatever it arrived with, so only F and ka may differ
   between salts. The magnesium family carried V 1050 L against V 14 L, and the
   zinc family 6 h against 50 h, for one ion each — a category error, not a
   disagreement between measurements. Now an ERROR: `pk.salt-disposition-drift`.
2. **Fractional absorption is not bioavailability.** Every human mineral number
   available is a gut tracer quantity, and the schema has no field that
   distinguishes it from F. Storing one as the other is what produced zinc's
   0.61 and calcium's 0.26. Logged in DATA_QUALITY_BACKLOG §8 as the higher-
   leverage schema fix.

## Template-quartet audit — all seven groups (2026-09-06, fourth pass)

Seven agents checked the 15 compounds the `pk.template-quartet` lint flagged.
Applied in
scripts/authoring/2026-09-06-template-quartet-audit.ts.
**The rule was right in all seven groups: not one shared `{ka, V, F}` trio is
stated by any cited paper.** Thirteen records keep a curve and were re-sourced;
two left the model. Do not re-chase these searches.

| Compound | What the cited paper actually was | Outcome |
|---|---|---|
| **liothyronine** | PMID:17259789 is a relative-bioequivalence study of oral formulations reporting only Cmax, AUC and Tmax — and with **no IV arm**, though it was cited for the IV route. | Re-sourced to Nicoloff 1972 (PMID:4110897), an IV tracer study: "half-life = 1.0 days" and "The mean T(3) distribution space in normal subjects was 38.4 liters". V 28 → 38.4 L. Caveat recorded: equilibration takes ~22 h against a 24 h half-life, so one compartment under-predicts the peak, and endogenous production (~27.6 mcg/day) is the same order as the dose. |
| **tryptophan** | PMID:6805013 is a tolerance study in depression, dosing 100 mg/kg (~10x this record's range), stating none of the four values. | `homeostatic`. Møller 1981 (PMID:6210561), the closest human PK paper, reports tryptophan "disappeared linearly from 2 to 5 h and exponentially from 5 to 8 h" — zero-order, so no half-life exists to cite. 50 g of glucose alone drops the pool 23% (PMID:6750316). |
| **tyrosine** | PMID:29168741 is a dose-response/cognition study sampling only to 240 min, stating no numeric plasma value at all. | `homeostatic`. Its own paper reports the response is dose- AND age-dependent, incompatible with fixed V and F. The meaningful readout is the ratio to competing large neutral amino acids, 0.13 → 0.21 (PMID:7190187). |
| **fluconazole** | PMID:2379224 prints a RANGE, "The half-life of fluconazole was 31 to 37 hours", and is silent on ka, V and F. The stored 34 h was its midpoint. | Half-life → 36.7 h, a verbatim scalar for the normal-renal-function group of Berl 1995 (PMID:7579091). V 50 → 35 L (0.5 L/kg × 70, PMID:1680653); no primary states any litre figure, and 50 L traced to a **review's** 0.7 L/kg. ka dropped — the only human value is 0.93 /h (PMID:11829202). |
| **pyrazinamide** | PMID:2737233 states "t1/2 beta = 9.6 h" and nothing else; the stored 10 h was rounded. | Half-life → 9.6 h. ka/V/F dropped. Not adopted: V/F 29.2 L in TB patients (PMID:16685561), whose absorption is **bimodal** — "3.56 h(-1) ... in comparison to slow absorbers (1.25 h(-1))" — which one ka cannot represent. **No human absolute bioavailability exists for pyrazinamide**; the modern absolute-F trial dosed the other three TB drugs intravenously and pyrazinamide orally only (PMID:26661397). |
| **carisoprodol** | PMID:27758843 is a model-fitting reanalysis whose abstract says human Vd "has not been reported", giving only a range in L/kg. | Half-life 8 → 2 h. **The 8 h was the METABOLITE's figure**: meprobamate is 9 ± 1.9 h in the same paper that gives the parent 2 ± 0.8 h (PMID:35160309), corroborated at 1.6–2.1 h by three more studies. V left unstored rather than collapsing "0.93 to 1.3 L/kg" to a midpoint. |
| **quinapril** | PMID:18672641 supports the half-life only. Its "1.4" is **quinaprilat's median tmax in hours**, which is where the stored ka came from. | Half-life 1.2 h kept (parent prodrug). V 77 L kept but F **pinned to 1** because that volume is apparent (Vd/F); the measured absolute figure is "approximately 50%" (PMID:8739020) and applying it again would halve the volume. No terminal phase to add — "no accumulation between 2 and 7 days, even in severe renal impairment" (PMID:2144994). |
| **prednisone** | PMID:39962604 is a real prednisone PK study but states no ka, volume or half-life; its "approximately 80%" is bioavailability **relative to oral prednisolone**, which is where F 0.8 came from. | Re-sourced to prednisolone, the active species: V 39.5 L and half-life 3.32 h from one arm of PMID:15098802. F left unstored — absolute bioavailability is ill-defined here, giving ~70% against IV prednisone but >1 against IV prednisolone through reversible interconversion (PMID:3350994). Caveat: saturable transcortin binding makes the set dose-conditional (PMID:7310640). |
| **rivaroxaban** | PMID:32959922 contains "1.5" and "0.80" as a **median tmax and a factor-Xa effect ratio**. Its refs also included PMID:15911722, a **warfarin review that never mentions rivaroxaban** — removed. | Re-sourced to one coherent oral one-compartment popPK fit (PMID:22242932): ka 1.24, V/F 57.9 L, CL/F 6.48 L/h, half-life from that fit's own ln2·V/CL = 6.19 h, corroborated by an independent "5.7-9.2 h at steady state" (PMID:16328318). The stored 10.7 h was the **average of the two arms** of its citation. F conditional: ≥80% up to 10 mg, but at 15-20 mg only with food (PMID:23458226). |
| **baclofen** | PMID:27879195 is a two-tablet bioequivalence study reporting only tmax/Cmax/AUClast; its "1.50" is a median tmax in hours. The record's other ref (PMID:23973998) is a **synthetic-chemistry SAR paper** with no human PK. | Re-sourced to one popPK fit (PMID:29091319): ka 2.23, V/F 44.5 L, CL/F 8.0 L/h, half-life ln2·V/CL = 3.86 h. Not adopted to avoid mixing fits: absolute F 74% against IV (PMID:25028414) and healthy single-dose 5.24 h PO / 5.79 h IV (PMID:27867020). Caveat: clearance scales with GFR as 13.5 × (GFR/103)^0.839 (PMID:30826461). |
| **rifampin** | PMID:11263520 supports the half-life only, and scopes it: "3.57 (34.85) h, at the 450 mg dose (tablet)" against 5.44 h at 600 mg in the same paper. It also concludes rifampicin shows **"zero order absorption"**, so a first-order ka is the wrong model for its own source. | Half-life kept and scoped; ka/V/F dropped. **The IV route was REMOVED** — that study dosed orally only, so no IV parameter could come from it. Not adopted: V 53.2 L at induced steady state in 261 TB patients (PMID:18391026), F "87% and 71%" fasted/fed (PMID:26661397). Caveat: autoinduction raises clearance 1.82-1.85× over ~40 days (PMID:22252827). |
| **dexmethylphenidate** / **methylphenidate** | PMID:18184535 and PMID:25274428 are bioequivalence studies (one fed, steady-state, extended-release) stating none of the values; PMID:10628897 is a **review** giving a "2 to 3 hours" range. PMID:17228864 on the racemic record is a **medicinal-chemistry synthesis paper with no human PK**. | Both half-lives → 3.74 h (PMID:20861586, 30 healthy adults); nothing supported 2.5 vs 3 h, and 2.5 h traced to **pediatric racemic** sources. F from the one absolute study with an IV arm (PMID:8430051): "d-MPH was 0.23 and that of l-MPH was 0.05". The racemic record's F 0.3 → **0.14**, since a 1:1 racemate dosed in mg delivers (0.23+0.05)/2 — the old value over-predicted exposure ~2×. ka/V dropped on both. **The rule's assumption was inverted here**: these two are related, and the evidence says they should share elimination but NOT absorption — enantiopure d-MPH reaches the circulation faster, its 1-hour concentration 56% higher than after the racemate (PMID:26729760). |
| **isosorbide-mononitrate** | PMID:15146932 prints no volume and no half-life value; its "105 ± 20%" is relative bioavailability. | Re-sourced to Straehl 1984 (PMID:6478734), which supplies three values from one study: Vss 48 L, half-life 4.15 h, and "absolute systemic availability was 100%" — a true absolute F, so the volume is a true Vss and the two pair without double-counting. ka dropped and **contradicted, not merely unsourced**: the same paper gives "absorption t 1/2 ranged from 2.5 to 5 min" (8.3-16.6 /h), roughly an order of magnitude faster than the stored 1.4. Caveat: nitrate tolerance is PD; kinetics are unchanged, so it must never be encoded as an altered half-life. |
| **linezolid** | PMID:12936973 is a renal-impairment study reporting only clearances — and it has **no IV arm**, though it was cited for the whole IV block. | Half-life 9.53 h (day 1, PMID:12407127); ka 1.81 /h (PMID:17639029); F 1 from the true absolute study, "103% (+/-20%)" (PMID:11745911), which now also carries the IV route since it actually ran one. V dropped: the only human figures are sex-split, "41.6 +/- 4.2 versus 52.2 +/- 3.3 L/70 kg", and the stored 45 L appears only in a review. Caveat: AUC rises 140.5 → 220.2 mg·h/L between days 1 and 7 while the half-life does not change, through time-dependent clearance inhibition. |

**What the pass established about the pattern.** The trio is the unsourced part
and the half-life is the authored part — that held in every group, but "authored"
did not mean correct. Of the 15 half-lives, five were verbatim, and the rest were
rounded, midpointed out of a printed range, averaged across two study arms, or
taken from the wrong analyte. Two distinct mechanisms produced the trios: pure
defaults with a real paper attached afterwards, and **digit collisions**, where
the cited abstract does contain the numeral but attached to a different quantity
— a median tmax in hours (quinapril, baclofen, rivaroxaban) or an effect ratio
(rivaroxaban). The digit collisions are the more dangerous kind, because they
survive a spot-check against the citation.

## Peptide category audit (2026-09-06, fifth pass)

All 38 peptide records with authored PK checked route by route by eight agents.
Applied in
scripts/authoring/2026-09-06-peptide-audit.ts.
**New policy:** animal-derived PK is KEPT where no human study exists, provided
`source_species` declares the species (typed field, loader schema, round-trip
test, lint rules and a compound-page chip added the same day).

**Molecular weight backfilled on 31 records**, from PubChem CIDs except
dulaglutide (63 kDa, approval document, and note it is a homodimer carrying two
GLP-1 moieties) and setmelanotide (1117.3, confirmed twice). This was the
category's real ceiling: the µM-to-mg/L conversion that receptor-occupancy
authoring needs was impossible without it. 34 records still lack one, all of
them in the research-only and local-acting buckets.

### The default that ran through the category

`V_L: 7` is plasma volume, and it sat on **13 unrelated compounds under 13
different citations** — five monoclonal antibodies, enoxaparin, and six
peptides. A 63 kDa antibody dimer and a 3.4 kDa GHRH analogue do not share a
volume of distribution. `ka_hr: 0.02` was the same across four weekly peptides.
Every peptide instance is now removed or replaced; **the five antibody rows
(atezolizumab, etanercept, galcanezumab, guselkumab, secukinumab) plus
enoxaparin are still open** and are the obvious next sweep.

### Values kept as animal, labelled

| Compound | Kept | Species |
|---|---|---|
| `hexarelin` | half-life 1.27 h + F 0.64, both from one rat fit (PMID:10611139), verbatim "a half-life of 75.9 +/- 9.3 min" and "bioavailability given s.c. was 64%" | rat |

The human figure hexarelin previously stored, 0.77, is a **biological
bioavailability** derived from growth-hormone release (PMID:8126144) — a
pharmacodynamic ratio, not a plasma measurement, and not interchangeable with a
PK bioavailability. The rat pair is better evidence and is labelled as rat.

### Route mismatches found — a category-specific failure mode

Six records stored a value under a route the cited study never used. Subcutaneous
is the route peptides are actually injected by, so an IV-derived number kept
drifting onto SC rows:

| Record | Stored route | Route actually studied |
|---|---|---|
| `ghrp-2` | SC | IV bolus in children (PMID:9543135) |
| `ghrp-6` | SC | IV bolus (PMID:23099431) |
| `ipamorelin` | SC | 15-minute IV infusion (PMID:10496658) |
| `sermorelin` | SC | constant IV infusion (PMID:7962295) |
| `bpc-157` | SC | rat and dog, IV and IM only (PMID:36588717) |
| `octreotide` | IM | a subcutaneous depot study (PMID:26076191) |

### Records that lost PK entirely

`bpc-157`, `lixisenatide`, `glp-1`, `selank`, `pt-141` → `uncharacterized`.
The two worth naming: **`glp-1` stored an ORAL route for native GLP-1**, whose
cited paper administered it intravenously and gave only glucose by mouth — the
peptide is degraded by DPP-4 within minutes and has no oral bioavailability.
**`selank`'s citation is a Russian-language radiochemical methods paper** with no
numeric PK, no stated species and no subcutaneous arm at all; its SC
bioavailability of 1 beside an intranasal 0.06 is the signature of setting an
injected route to unity and backing out the nasal fraction.

### Corrections worth naming

- **`somatropin` bioavailability 0.75 → 0.495.** The only measured human value, from a subcutaneous-versus-IV crossover in 16 patients (PMID:8890721), verbatim "The absolute bioavailability of GH following s.c. relative to i.v. administration was 49.5%". The stored figure was roughly 50% too high.
- **`oxytocin` half-life 0.07 → 1.2 h.** The stored value was a mis-rounding of the 5.5-minute DISTRIBUTION phase; elimination is governed by the terminal 1.2 h, and the volume its own paper states (15 L) had never been stored.
- **`tesamorelin` volume 7 → 200 L.** The record had kept a half-life derived from its paper's own clearance and volume while storing a default volume, so the set contradicted itself.
- **`leuprolide`** was a blend of two formulations: an immediate-release half-life, a volume sitting between the 15 mg depot's 27 L and immediate-release 37 L, and an absorption rate matching neither. Re-sourced wholly to the immediate-release primary.
- **`lanreotide`, `octreotide` IM, `triptorelin`** all confused depot with immediate-release. Depot and immediate-release are different drug products and their parameters are not interchangeable.

### Ranges: the rule applied here

Several abstracts state a range where the model needs a scalar. A midpoint may
stand **only** where the note quotes the full range verbatim and says it is a
midpoint (`cjc-1295` 5.8-8.1 d, `pramlintide` 30-50 min, `somatostatin`
1.1-3.0 min). Where a scalar exists elsewhere it wins — that is how
`liraglutide` moved off the "11-15 h" midpoint of 13 h onto a measured 12.6 h,
and `cetrorelix` off 63 h onto 56.9 h.

### Left open

- The five antibody rows and enoxaparin still carrying `V_L: 7`.
- `kisspeptin` carries an unqualified name while every value is **kisspeptin-54** specific; the separate `kisspeptin-10` record is correctly marked as having no PK. A consumer could apply the 54-mer half-life to the 10-mer.
- `calcitonin` is **salmon** calcitonin, roughly 40-50x more potent at the human receptor than the human peptide. The record is now noted and carries the salmon mass, but the name is still unqualified.
- `thymosin-alpha-1`'s half-life rests on a narrative review that never states a species; no primary exists.
- `somatropin` IV stores 3.46 L, which behaves as a **central** compartment volume — the same abstract's clearance and half-life imply 4.19 L for a true one-compartment fit — so that route understates exposure duration.

## Biologic volume audit — the V 7 L default (2026-09-06, sixth pass)

The six records the peptide pass left open: five monoclonal-antibody rows plus
enoxaparin, all carrying `V_L: 7`. Applied in
scripts/authoring/2026-09-06-biologic-volume-audit.ts.
**Every instance of the 7 L default is now cleared from the catalog.**

### The two suspected defaults split

**The 648 h half-life SURVIVED** on atezolizumab and galcanezumab. Both cited
papers state "27 days" verbatim and both approval documents agree. Three records
matching to the hour looked like a template and was one — it simply landed on
the published number. Secukinumab's 648 h is a different case (below).

**The 7 L volume FAILED, in four distinct ways**, which is what makes it worth
recording rather than just fixing:

| Record | What the source actually gives |
|---|---|
| `atezolizumab` | 6.91 L, a true **steady-state** volume (IV drug) |
| `galcanezumab` | 7.33 L, an **apparent** V/F — no IV arm has ever existed for it |
| `guselkumab` | 13.5 L in the cited paper, also apparent — nearly double the stored value |
| `etanercept` | the cited review states **no volume at all** |
| `secukinumab` | the cited paper states **no volume at all** |
| `enoxaparin` | 7.0 L verbatim, but an anti-Xa **activity** volume |

One default cannot be right for six records when the underlying quantities are a
steady-state volume, an apparent volume, a central volume and an activity-basis
volume. Where it landed close it landed close by accident.

### A defect class the PMID gate cannot catch

**Secukinumab's citation is a real, correctly attributed paper about
secukinumab whose abstract contains no numeric pharmacokinetics whatsoever** —
and all three stored values hung off it. `registry:verify` resolves identifiers,
so a real-identifier zero-content miscitation passes every gate by construction.
Only reading the abstract finds it. This is distinct from the fabricated
bimekizumab citation removed from the same record's effect compartment earlier:
that was an invented attribution, this is a genuine one carrying invented numbers.

### Where a label is the only source

No PubMed abstract states a numeric secukinumab half-life. Field-restricted
sweeps of the entire database return four records, none with a number. The 648 h
traces to the European summary of product characteristics, "The mean elimination
half-life ... was 27 days in plaque psoriasis patients". Retained and marked
label-derived rather than left pointing at a paper that never said it.

### enoxaparin — the record whose number was real and whose model was not

Its 7.0 L IS verbatim in the cited paper, so this is a genuine collision with the
default rather than the default in disguise. It still cannot carry a curve:

1. The measured quantity is anti-factor-Xa **activity**, not concentration. The volume is dose in international units over an activity in IU/mL — the units cancel into litres without a mass balance ever being done.
2. It is a polydisperse mixture whose own two activity markers decay at different rates from one injection: anti-Xa ~4 h against anti-IIa ~2 h (PMID:2851016), and 275 min against 40 min after IV (PMID:1963020).
3. Clearance falls 27-44% with renal impairment alone (PMID:15961985, PMID:11927128), before weight, pregnancy or burns.

Marked `mixture`. **`mw_g_mol` is deliberately left empty**: the ~4500 Da mean
(PMID:28635885) is real and often quoted, but a third of the mass lies outside
2000-8000 Da, so filling the field would license mole-based arithmetic with no
physical meaning. The record is also dosed in both milligrams and anti-Xa
international units (~100 IU/mg), a conversion it never carried.

### Class notes

- **etanercept is not an antibody** — a dimeric p75 TNF-receptor Fc fusion protein, with a ~3-day half-life against the 2-4 weeks typical of true antibodies. No antibody class default should reach it. Its stored mw of 150000 is correct and label-supported, and was deliberately left alone rather than harmonised to the generic figure.
- **Ten antibodies still share the generic 148000 mass.** That value feeds the µM-to-mg/L conversion behind 13 stored occupancy affinities; backing the conversion out gives clean figures like 0.127 and 0.02 nM, so the underlying affinities are real and the mass is an approximation rather than a fabrication. A real IgG1 runs 143-149 kDa, so per-molecule masses would move each stored affinity by up to ~3%. Drug-specific figures now exist for four of them.
- **All 21 biologic volumes are round per-kilogram figures scaled to 70 kg** (0.1, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05, 0.038 L/kg). That scaling is the documented convention, but the clustering into a small set of round per-kg values means the remaining sixteen rows deserve the same audit these six got.
- **Bioavailability was NOT templated** — thirteen distinct values across the class with only two coincidental pairs, so the defect is specific to volume.

## Peptide audit, part 2 — findings the first pass verified but did not write (2026-09-06)

Re-deriving the peptide pass's own coverage afterwards showed that five records
whose agent reports were complete had been left unchanged: their known-bad
values stayed in the data. Applied in
2026-09-06-peptide-audit-part2.ts.
Recorded because an audit that reports more than it applies is its own failure
mode, and only a coverage check catches it.

| Record | What was left unapplied |
|---|---|
| `octreotide` | **The IM row is a DEPOT.** It carried the immediate-release half-life of 1.5 h and cited a study of a *subcutaneous* depot. The real figure is 169 h (PMID:10806600, 22 subjects, single 30 mg IM) — about 113x the stored value. Its ka of 2 /h was also CONTRADICTED, not merely unsourced: the cited abstract states subcutaneous absorption "with a half-life ranging from 5.3 +/- 2.2 min to 11.7 +/- 7.6 min", i.e. 3.6-7.8 /h. V 21 L came from a review. |
| `triptorelin` | All four values unsupported; the citation is a depot review reporting only testosterone pharmacodynamics. The 4 h half-life is an immediate-release figure on a depot row. Now `uncharacterized`. |
| `secretin` | **Its citation has no abstract in PubMed at all** — title and authors only — so nothing in it was ever verifiable by this registry's method, and its steady-state-infusion design cannot yield a bolus half-life. Re-sourced to Boden 1974 (PMID:4815082), 3 anaesthetised DOGS, verbatim "the half-life of disappearance was 2.8+/-0.1 min", and labelled `source_species: dog`. No human secretin half-life exists in any indexed abstract. |
| `desmopressin` | V 16 L unsourced on all three routes (the human steady-state figure is ~26 L, PMID:9868744), and both extravascular ka values unsourced. Its two bioavailabilities are verbatim and were kept. The intranasal 0.08 is specific to an enhancer-containing microdose spray; a conventional nasal spray is nearer 3.4%. |
| `gonadorelin` | 0.11 h is the midpoint of a stated 5.5-8 min range AND describes only the first of two phases; now documented as both. |
| `ghrp-2` | Value verbatim but IV-derived in prepubertal children, stored on an SC row; caveat now recorded. |

## Pharmacological category, batch 1 (2026-09-06, seventh pass)

The 41 highest-signal compounds of the 412 unaudited pharmacological records,
triaged by the templating signatures earlier passes established. Eight agents
read every cited abstract. Applied in
2026-09-06-pharmacological-batch1.ts.

### The finding that dominates the batch

**ABSORPTION RATE IS UNSOURCED ACROSS THE WHOLE REGISTRY.** Half of the 524
compounds carrying a non-IV `ka_hr` share just five values:

| ka (/h) | compounds |
|---|---:|
| 1.0 | 73 |
| 1.5 | 71 |
| 0.5 | 47 |
| 1.4 | 37 |
| 0.7 | 35 |

Of the 44 audited routes carrying one, **not one was supported by its citation**.
The cause is structural rather than careless: papers report a time to peak, not
an absorption rate constant, so there was usually nothing to cite. Several stored
values are demonstrably a Tmax in HOURS reused as a rate in PER HOUR —
cimetidine's 2 collides with its own 2 h half-life, lacosamide's 1.4 traces to a
bioequivalence ratio of 1.48, zafirlukast's 0.5 to a ratio *between two rate
constants*. Every audited absorption rate is removed.

### Three defects that are wrong models, not wrong numbers

- **midazolam's oral volume of 114 L is 50.2 ÷ 0.44** — its own IV volume divided by its own bioavailability. Storing both divided the dose by F twice and understated oral exposure by exactly 1/F, about 2.3-fold. Its two routes' half-lives were also stored backwards.
- **olanzapine's IM row is a depot carrying the oral half-life.** Its own citation says the depot half-life is "~30 days, controlled by the slow rate of intramuscular absorption rather than the 30-h elimination rate-based half-life of oral olanzapine" — the stored 33 h was ~24× wrong *and* inverted the paper's point.
- **inclisiran cannot be modelled in plasma at all.** A GalNAc-siRNA taken into hepatocytes: undetectable in plasma at 48 h while its effect lasts six months.

### Route errors — a citation that never used the route it is filed under

Seven rows. The starkest is **lorazepam's IV row: its cited paper administered no
intravenous lorazepam at all — the only IV agent in it was ANTIPYRINE**, a
metabolic probe. Also enalapril (whose marketed IV product is a *different
molecule*, enalaprilat), methocarbamol, indomethacin, minocycline (oral row on an
IV-only study), levetiracetam, trimethoprim and sulfamethoxazole.

### Values contradicted rather than merely unsourced

- **zafirlukast F 0.6** — its own abstract says "The absolute bioavailability of zafirlukast is unknown". The 0.6 was mis-derived from the next sentence, that food "reduces bioavailability by approximately 40%": a food effect turned into an absolute bioavailability.
- **simvastatin's 3 h was never a half-life** — it is the midpoint of "peak inhibition of HMG-CoA reductase activity occurs within 2 to 4 hours", a pharmacodynamic time to peak effect. The active acid's half-life is 5.9 h.
- **indomethacin V 21 L** = 0.30 L/kg, *below* the observed human range of 0.34-1.57 L/kg.
- **tolbutamide 5.5 h** — a midpoint of the label's "4.5 to 6.5 hours" that sits below every published human measurement.
- **zonisamide ka 0.026 /h** was VERBATIM in its citation and is still removed: that model reports a clearance ~33× out from the literature, and 0.026 /h implies a 27 h absorption half-life against an observed Tmax of 5.3-6.0 h. Verbatim but internally inconsistent.

### Cross-paper products and wrong-analyte values

- **phenobarbital IM F 0.76** = 0.80 relative-to-oral × 0.949 absolute, from two different papers.
- **cyclophosphamide F 0.75** = 1 − a hepatic extraction ratio of 0.25, which ignores gut availability and is not a bioavailability.
- **sulfamethoxazole V 14 L** matches that paper's sulfamethoxazole *clearance* of 13.7 mL/kg/h; its **F 0.95** matches *trimethoprim's* fraction absorbed of 0.955 in a different paper.
- **amitriptyline's 21 h** silently encoded the ELDERLY value (21.7 h) as the general one; young adults are 16.2 h, and the stored 1100 L fell between the two groups' volumes without matching either.
- **diphenoxylate-atropine's half-life** is verbatim but is DIFENOXIN's, and its absorption rate was derived from a metabolite *formation* half-life.

### Records that lost PK entirely

`phenelzine`, `tranylcypromine`, `nitazoxanide`, `clopidogrel`, `rufinamide`,
`inclisiran`, `insulin-glargine` → `uncharacterized`;
`diphenoxylate-atropine` → `mixture`. Phenelzine is the second real-citation,
zero-content case: its only reference states no disposition parameter at all
despite "pharmacokinetics" in its title, and the record had no other reference.

### What survived

**bisoprolol is the best-supported record in the batch** — half-life and an
absolute bioavailability both verbatim, and because that bioavailability is
absolute its volume and F pair legitimately. Also verbatim and kept: lidocaine's
intranasal 0.26, levetiracetam's oral 7.3 h, ivermectin's 35 h, indomethacin's
rectal 0.8, riluzole's absolute 0.6, cimetidine's 2 h and 0.6, glyburide's 9.7 h
(flagged as a two-compartment terminal phase), alprazolam's oral figures.

### Still open

**371 of 412 pharmacological compounds remain unaudited**, all scoring lower on
the triage than this batch. The absorption-rate finding above applies catalog-
wide and is not confined to them.

## Triage heuristic: one citation across an intravenous and an extravascular route

**113 compounds** cite a single paper for both an IV route and an oral, IM, SC,
SL, IN or rectal one. That shape is ambiguous by construction and is worth
checking first in any future batch:

- A genuine **crossover** study dosing both ways is the gold standard, and several audited records are exactly that — cortisol (Derendorf 1991), lorazepam (Greenblatt 1982, five routes), desmopressin, cyclophosphamide.
- A **route mismatch** produces the identical shape when one route was copied onto a paper that never used it.

Among the compounds audited so far that carry this shape, **roughly half were
mismatches**: levetiracetam, trimethoprim, sulfamethoxazole, lorazepam,
methocarbamol, indomethacin, minocycline and enalapril all cited a study that
dosed only one way. It is deliberately NOT a lint rule — it would fire 113 times
with about half of them legitimate, which is the noise level that teaches authors
to ignore a gate. It is a reading order, not a verdict.

Distribution: pharmacological 81, hormone 6, amino-acid 5, alkaloid 5, biologic 4,
vitamin 4, metabolite 3, peptide 2, and one each in sleep, flavonoid and ketone.

## Pharmacological category, batch 2 (2026-09-06) — 40 compounds, eight agents

Applied by `scripts/authoring/2026-09-06-pharmacological-batch2.ts`. Of roughly
170 stored numbers, fewer than 20 were verbatim in the paper they claimed.

### Two new defect types

**A protein-binding percentage read as a bioavailability.** `terazosin` stored
F 0.9 from "90 to 94 percent … bound to plasma proteins", while the same abstract
calls the drug "completely and consistently bioavailable"; `tiagabine` stored
F 0.96 from "highly (96%) bound to plasma proteins", one clause from the 7 h
half-life that was also taken off that sentence pair. Two independent
occurrences make this a type, not an accident: a plausible fraction sitting
beside a real parameter. Both records now pin F to 1.

**A study-design interval read as a parameter.** `topiramate` stored a half-life
of 21 h. The only 21 in its cited abstract is "21 days of washout between
treatments". That paper states four half-lives — 55.7, 80.2, 72.5 and 37.1 h —
and none is 21. This is the furthest a digit collision has travelled.

### The prodrug pair, seen from both sides

`ganciclovir`'s oral row and `valganciclovir`'s row were the SAME measurement.
PMID:12189361 dosed oral valganciclovir only, and its "ganciclovir bioavailability
was 60%" is correct on the valganciclovir record and nowhere else. Oral
ganciclovir capsules average 6–9% (PMID:9110063), so the stored 0.6 over-predicted
oral exposure roughly **eight-fold** — the largest single error found in this
category so far. Both records are now correct and cross-reference each other.

### Half-lives that were something else

- `irbesartan` 14 h **was a standard deviation** — its paper says 20.21 ± 14.71, and the dispersion statistic was stored as the central value. A new shape.
- `alendronate` 240 h is a **sampling-truncation artifact**: plasma falls to ~5% of peak within 6 h while the terminal half-life exceeds 10 years, and its kinetics were characterised from urine.
- `granisetron` TD 35.9 h is an **APF530 subcutaneous poly(orthoester) depot** value (PMID:27186139), filed under a transdermal patch and attributed to a paper that says 36. The 36 h is itself absorption rate-limited: Tmax is 48 h.
- `ampicillin` 1.45 h is verbatim but **probenecid-blocked and prodrug-derived** — the study co-dosed 1 g probenecid, which blocks the tubular secretion that dominates ampicillin elimination, and gave sultamicillin.
- `diazepam` 20 h is a **CYP2C19 wild-type subgroup of six**; the other genotype arms are 62.9 and 84.0 h.
- `azathioprine` 5 h is wrong by **an order of magnitude** — parent 50 min, 6-MP 74 min.
- `betamethasone` TD 5 h **contradicts its own citation**, which states 16.6 h.
- `ketamine` 2.5 h **matches no paper**: four genuine sources give 2.0, 2.17, 3.1 and 5.2/6.1 h.

### Range midpoints stored as measurements

`nicardipine` F 0.3 (of a stated 15–45% that the same abstract calls
"non-linearly related to dose"), `irbesartan` F 0.7 (of 60–80%), `macitentan`
16 h (of 14.3–18.5), `terazosin` V 28 L (of "25 to 30 L"), `granisetron` V 250 L
(inside 186–264 but not its midpoint either). Each now carries the stated lower
endpoint with the range in prose.

### Absorption rate: 70 of 70 audited routes, zero supported

The catalog-wide finding holds without exception. What this batch adds is that
for several drugs a first-order rate is **the wrong model**, not an uncited
number: `ganciclovir`, `cefuroxime`, `nilotinib` and `penicillin-v` are all
modelled with **zero-order input** in their own cited papers, and `gabapentin`'s
absorption is **saturable** through a transporter — its cited paper is a RAT
in-situ perfusion study whose finding is precisely that a fixed bioavailability
does not exist (60% at 900 mg/day falling to 33% at 3600).

**One genuine published human ka was added**: `valganciclovir` 0.895 /h
(PMID:19738014). `tiagabine` gained a second, 1.25 /h, as part of one internally
consistent population fit (PMID:11042231) that also supplies its volume and
half-life. Across the whole audit these are the only two ever located, and
neither matched what was stored.

### Routes whose cited paper never used them

`acyclovir` IV, `granisetron` IV, `ampicillin` IV, `cefuroxime` IV,
`ganciclovir` IV, `doxycycline` IV, `dimenhydrinate` IV (a chewing-gum study),
`diazepam` IV (oral-only), `betamethasone` IV (oral-vs-topical),
`oxycodone` IV (the parenteral arm was **intramuscular**), `penicillin-v` IV.

`penicillin-v`'s IV route is **deleted rather than re-sourced: the product does
not exist.** Parenteral penicillin is penicillin G.

### Records that lost PK entirely

`alendronate`, `nilotinib`, `artemisinin`, `nitrofurantoin` → `uncharacterized`.

- `artemisinin` **induces its own metabolism** to an unusual degree: exposure falls to 24% of day 1 by day 7, oral clearance rises 207 → 981 L/h within one course, and hepatic extraction of 0.93 → 0.99 caps F near 0.07 then 0.01. No fixed parameter set is defensible.
- `nitrofurantoin`'s own citation shows urinary exposure exceeds plasma **~150-fold** with saturable renal excretion, so a linear plasma compartment does not represent the drug.
- `nilotinib`'s absolute bioavailability has never been measured — no human IV formulation exists, the literature says only that 31% is "assumed", and food raises capsule exposure up to 180%.

### Chased and rejected

Beyond the ~150 PMIDs the eight agents fetched and rejected, five were fetched
directly for this pass. **PMID:2598970** supplied nicardipine's true volume and
half-life ("of the order of 1 l/kg", "ranged from 4 to 5 h"). **PMID:3924086**
supplied penicillin V's steady-state volume (35.41 L) and oral absorption (48%).
**PMID:6488686** gave ketamine's 2.17 h but **states no volume**, and
**PMID:7459184** likewise — no racemic human ketamine volume appears in any
abstract found, so the stored value is now the lower of two enantiomer figures
(5.6 L/kg, R-ketamine). A search for a human phenoxymethylpenicillin half-life
(`26755048`, `9124826`, `1280571`, `2727648`, `649594`) returned **nothing**;
the value is derived from one paper's own volume and clearance and flagged.

Live collision hazards logged for future passes: **PMID:15899109**'s 410.9 /
442.3 L volumes are **palonosetron's**, not granisetron's; **PMID:1941629**'s
"bioavailability … 60" is an ED50 oral-to-intravenous **potency ratio in
anaesthetised rats**; **PMID:25819132**'s ka 2.24 /h belongs to **dolutegravir**,
not the abacavir co-administered with it.

### Schema gaps this batch surfaced

- **No field expresses a salt-to-active conversion.** `dimenhydrinate` carries mw 469.97 (the salt) while all of its PK describes **diphenhydramine** at 255.35; about 54% of a dose is active drug, so molar work here is 1.84× wrong. Same shape as the `lithium` mw item already logged.
- **`valacyclovir` is a wrong-analyte hybrid** the schema cannot express: mw 324.34 is the prodrug, F 0.542 is an acyclovir yield, and the disposition values are acyclovir's. The clean fix is structural — re-key to acyclovir mass, or fold it into `acyclovir` as a third route — and is deliberately not done here.
- **`cefuroxime` holds two molecules**: the oral product is cefuroxime axetil (mw 510.47, never detected intact in blood) and the IV one is cefuroxime sodium. Disposition is shared after de-esterification; absorption belongs to the ester alone.
- **`penciclovir` is still not a slug**, though all four `famciclovir` values describe it.

### Still open

**331 of 412 pharmacological compounds remain unaudited**, roughly eight more
batches at this size.

**Do not read the falling triage scores as a falling defect rate.** Batch 2's
selection topped out at 5 where batch 1's reached 9, which looked like the
signal thinning. Re-triaging for batch 3 against the same signals put five
compounds at 12 — full quartets, volumes shared across 11-15 unrelated records,
one citation spanning an IV and an oral route, and a lone reference, all at once.
The scores are only comparable within one run of one scorer. What is left is
still dense with the same shapes.

## Pharmacological category, batch 3 (2026-09-06) — 40 compounds, eight agents

Applied by `scripts/authoring/2026-09-06-pharmacological-batch3.ts`. Selected by
re-running the templating triage, which put five records at score 12 — higher
than batch 1's 9, refuting the "signal is thinning" note written after batch 2.

### The collision catalogue, which is now the story

A stored number is usually a real numeral from the right paper attached to the
wrong quantity. This batch shows how far that goes. Each of these was verified
verbatim against the cited abstract:

| Stored as | Was actually |
|---|---|
| `phenytoin` V 50 L | "additional **50 patients**" — a patient count |
| `brivaracetam` t½ 9 h | "or placebo (**9 : 3**)" — a randomisation allocation ratio |
| `triazolam` V 77 L | "mean **body weight of 77 kg**" |
| `triazolam` F 0.44 | "aged 20-**44** years" — an age-range endpoint |
| `valproate` t½ 14 h | "after **14 days** of zonisamide treatment" — a dosing duration |
| `esomeprazole` V 16 L | "clearance … decreased from 22 l/h to **16 l/h**" — a clearance |
| `erythromycin` t½ 1.5 h | "erythromycin stearate, **1.5 g**" — a dose in grams |
| `isoniazid` V 42 L | "**42.24** ± 8.51 mg/h/L" — an AUC |
| `ibandronate` V 90 L | "V(D) **> 90 L**" — an inequality bound |
| `haloperidol` zo_dur 672 h | four-weekly depot **dosing interval** |
| `pentazocine` IM ka 17.55 /h | "peak … at **15 minutes**" — the earliest sampling point |
| `clonidine` TD lag 48 h | "maximum reduction in blood pressure occurs **2 to 3 days**" — a PD onset time |
| `phenytoin` F 0.9 | "approximately **90% bound** to plasma proteins" |

**Protein binding read as bioavailability is now the most reliably recurring
collision in the catalog** — terazosin, tiagabine (batch 2) and phenytoin here.

### A defect class this batch names: MATRIX ARTEFACT

A plasma-referenced volume stored for a drug whose reference matrix is something
else. `cyclosporine` 280 L is 4.0 L/kg, the classic plasma figure, for a
whole-blood drug whose true value is 2.88 L/kg. `acetazolamide` 17 L is a
plasma-fitted volume for a drug that lives bound to carbonic anhydrase inside
erythrocytes, whose sequestration half-life is 50.2 h against a plasma 3-6 h.
With `chlorthalidone` from batch 2 that is three instances.

**`tacrolimus` is the control case that shows the test discriminates**: its 105 L
is 1.5 L/kg, inside the whole-blood range, where a plasma-referenced volume would
have been roughly fifteen times larger. It was unsourced, not artefactual.

### Two structural claims that were checked and REFUTED

Recording these so they are not re-chased.

1. **The proton-pump-inhibitor volumes are not a one-row ingestion shift.** An
   agent proposed the three PPI volumes had each inherited the row above. They are
   not adjacent in the file (indices 339, 705, 729), and catalog-wide, file-adjacent
   compounds share an identical volume only 8 times in 317 pairs, barely above a
   shuffled baseline. Lansoprazole and rabeprazole break the pattern too. The
   volumes are wrong; the proposed mechanism is not real.
2. **Acetaminophen's half-life does not double-count against its Michaelis-Menten
   parameters.** `mmEliminationRate` computes only the saturable and parallel-linear
   terms and never reads `ke_hr`; `interactions.ts` says so in a comment. The milder
   real problem stands: on a saturable route `half_life_hr` is dead data that still
   renders as though authoritative, and phenytoin's 19 h was additionally
   inconsistent with its own Michaelis parameters.

### Absorption rate: 100 audited routes, still zero supported — but the literature is richer than assumed

Nine genuine published human absorption values were located in this batch alone,
against three in all prior batches: amoxicillin 1.02 /h, isoniazid 3.94 /h,
naloxone 0.65 IM and **1.52 IN — the first literal, named, numeric `ka` found
anywhere in the series** — clonidine 1.54, triazolam 1.90–3.13 (time-of-day
dependent), tramadol 2.04–3.01 across three oral formulations, and haloperidol
1.87. **Not one matched what was stored**, and isoniazid's real value is 2.8× the
template default it replaced. Four are now stored.

Two structural lessons: **`ka` is formulation-specific**, not a drug constant
(tramadol's absorption half-life is 0.23, 0.34 and 0.38 h across three oral
forms of the same drug), and **nearly every published value comes bundled with a
lag time this schema cannot represent**, so a bare rate predicts onset too early.
That is why several verified rates were still not stored.

Absorption that is the wrong model rather than an uncited number now covers:
quinidine (zero-order, stated outright), clavulanate (triphasic — "**it was not
possible to computer fit** oral clavulanic acid data using … a single exponential"),
dipyridamole (pH-gated, two of twenty patients had undetectable plasma levels),
ibandronate (supra-proportional at the clinical dose), the three PPIs (zero-order
with a measured 0.62 h enteric-coat lag), divalproex ER, clonidine TTS,
hydralazine and metoprolol (saturable first-pass), and mebendazole.

### Records that lost PK entirely

`ibandronate`, `emoxypine`, `velpatasvir` → `uncharacterized`;
`amoxicillin-clavulanate` → `mixture`.

- **`ibandronate` makes bisphosphonates a class rule.** It repeats alendronate exactly and worse: its cited study sampled only "up to 48.0 hours", so a 240 h half-life cannot have been estimated from it at all. Sweep the remaining bisphosphonates before the next batch.
- **`emoxypine` is the purest zero-content case found** — its citation is a RABBIT study containing not one numeric PK value, and no human study of the molecule with numeric parameters exists in PubMed.
- **`amoxicillin-clavulanate` was a chimera**: a two-molecule product under amoxicillin's molecular weight, whose volume and bioavailability describe amoxicillin measured in obese adults, with an uncited half-life that happens to sit near clavulanate's. It also contradicted the `amoxicillin` record on every shared parameter.

### The largest simulation error

`haloperidol` V 12.9 L. Verbatim in its abstract, but internally inconsistent
with that same abstract's own exposure figure by ~740×; read as per-kilogram the
two reconcile, so the published units are almost certainly mislabelled. The true
IV-derived value is 17.8 L/kg (~1250 L), so the stored figure understated the
distribution space by two orders of magnitude — and it was paired with a
bioavailability and reused on all three routes.

### Non-substantiating references found

~~A **warfarin** review in `acetaminophen`'s refs.~~ **CORRECTED 2026-09-07 — this
was NOT a defect.** PMID:15911722 (Holbrook 2005) is the `source_pmid` of
acetaminophen's own **warfarin interaction entry**, and it sits on 12 compounds
for exactly that reason. The batch-3 agent judged it as PK provenance, where it
supports nothing; but `refs` also carries interaction citations, so it is
correctly filed. Nothing was deleted (that pass only added references), so no data
was damaged — but the finding as reported was wrong. **Check what a reference is
being used FOR before calling it misfiled.** A St John's wort / alprazolam
study filed under **both** `cyclosporine` and `tacrolimus`, containing neither
drug — and its "12.4 hours" is alprazolam's half-life, sitting next to
tacrolimus's stored 12. An S(-)-**atenolol** rat study in `metoprolol`'s refs
carrying a keo. A guinea-pig receptor paper in `dipyridamole`'s. Five perpetrator
interaction studies in `itraconazole`'s, four in `clarithromycin`'s, three in
`ciprofloxacin`'s, three in `quinidine`'s.

### A stored note that quoted a string absent from its paper

`metoprolol`'s effect-compartment note quoted "t½,keo = 36.6 min" from a rat
microdialysis study. The paper is real, correctly attributed and is a rat
effect-compartment study, but neither that number nor the term appears in its
abstract. **Every other keo note audited across three batches quoted accurately.**
It is now a declared approximation. Two further keo notes were corrected:
`haloperidol`'s cited a PET study that states no equilibration value at all, and
`acetazolamide`'s was **wrong in direction** — it reasoned from a fast on-rate at
the enzyme, where the published behaviour is that effect *outlasts* plasma via
slow release from an erythrocyte reservoir.

### Still open

**291 of 412 pharmacological compounds remain unaudited.** 424 non-IV route
entries still carry a `ka_hr`; on the evidence of 100 audits essentially none is
citable as stored.

## Pharmacological category, batch 4 (2026-09-06/07) — 40 compounds, eight agents

Applied by `scripts/authoring/2026-09-06-pharmacological-batch4.ts`. Two groups
were re-dispatched after hitting a session rate limit.

### Two claims that REVERSED on inspection — the most important entry here

A class rule applied without checking is how a wrong value gets written
confidently. Both of these were caught, and both are recorded so the reversal is
not re-reversed later.

1. **`tacrine`'s V 349 L beside F 0.17 is NOT the apparent-volume double-count it
   resembles.** That volume comes from an intravenous dose ("After an intravenous
   dose of 30 mg THA … Volume of distribution, V alpha … mean of 349 l"), so it is
   a **true** volume and the pairing is correct modelling. **The defect was in our
   own prose**: `source_label` called it "apparent", wording that would license a
   future editor to break a correct record. First case in the audit where the
   error is in the registry's annotation rather than in its numbers.
2. **I told the group-7 agent that sorafenib, tofacitinib and riociguat all lack
   an IV formulation and so all need F pinned to 1.** Riociguat has a real IV arm
   and a measured 94% absolute bioavailability. Right twice, wrong once.

Verified pre-emptively and also a non-defect: **`oxcarbazepine` and `phenytoin`
share mw 252.27 because they are constitutional isomers** (both C₁₅H₁₂N₂O₂).
Correct chemistry, not a template collision.

### The bisphosphonate class rule: tested, held 4 of 4, by two mechanisms

- **Sampling truncation** — `alendronate`, `ibandronate`, and now `risedronate`, whose study sampled serum for 72 h against a stored 480 h half-life. That 480 is **also its stored volume**: one unsourced numeral in two slots. No risedronate abstract states a half-life or a volume in litres at all.
- **Phase misassignment** — `zoledronate`'s 39 h is verbatim but is the **third of four** phases ("half-lives of 0.2 and 1.4 hours … and half-lives of 39 and 4526 hours"), neither the exposure-carrying phase nor the terminal one.

### New collision shapes

| Stored as | Was actually |
|---|---|
| `mepivacaine` V 80 L | the **cross-enantiomer MEAN** of R 103 and S 57, from a paper concluding they "demonstrated a marked difference" |
| `clindamycin` F 0.9 | a **RELATIVE** bioavailability between two oral products |
| `sorafenib` F 0.4 | the **DOSE** — "400 mg orally twice daily" |
| `prochlorperazine` F 0.13 | the study's **COHORT SIZE**, n=13 |
| `lansoprazole` V 18 L | its own **SUBJECT COUNT**, 9 extensive + 9 poor metabolisers |
| `zoledronate` V 14 L | a **standard deviation**, "41% ± 14%" |
| `nalbuphine` (×4) | four separate **cross-dose averages** in one record |
| `ramipril` F 0.55 | the **midpoint** of a stated "range of 44-66%" |
| `oxcarbazepine` F 0.95 | an **inequality bound**, ">95%" |
| `methylene-blue` F 0.7 | **refuted by its own abstract's arithmetic** — 9 vs 137 exposure gives 0.066 |

### A defect that survives a value check: WRONG ANALYTE ON THE PARENT'S MASS

`trandolapril` is the sharpest case in the whole audit so far. Its stored 24 h is
the **active diacid's** accumulation half-life, while the paper the record already
cites states "Trandolapril is rapidly absorbed, with a single elimination
half-life (t1/2) of **0.72 h**" for the molecule its mass names — **a 33-fold
error with the correct number sitting in its own citation.** `ramipril` fails
identically (14 h stored, ~1.9 h for the ester). Ester factors are 1.070 and
1.072, so every dose-to-mole conversion is also wrong.

**And the whole ACE-inhibitor class shares a deeper problem**: the long terminal
half-lives are **saturable binding to the target enzyme, not elimination**.
Investigators subtract that phase to get usable kinetics ("excluding the component
for saturable binding"), and lisinopril's own primary says the 40 h terminal phase
"was not predictive of steady-state parameters" against a 12.6 h accumulation
half-life. Storing a binding phase as elimination makes a model predict
accumulation that does not occur.

### Effect-compartment values: five corrected, and one lint lesson

`dofetilide`, `ondansetron`, `zolmitriptan`, `tofacitinib` and `sildenafil` all
had unsupportable kₑₒ values. **Deleting them outright is wrong** — each record
carries `receptor_occupancy` rows, and without a kₑₒ the effect-site curve renders
as zero, which `data-lint`'s `receptor.needs-keo` rule correctly rejects. They are
therefore **demoted to declared approximations with the real evidence stated**,
not removed.

Individually notable:
- **`dofetilide`'s value verified perfectly and is still wrong to use as stored** — right quote, right arithmetic, species correctly named as beagle dog. But it was measured under IV infusion, and in humans on the **oral** route "direct linear relationships were observed after oral administrations in eight of 10 subjects". This record is oral-only. **Species labelling was the right fix from an earlier pass, but it is not sufficient: an animal value also needs its route and its precision carried** (this one's is 11 ± 8 min, a sixfold band).
- **`ondansetron`'s contradicted a published DIRECT model** — the definitive QTc analysis fits "a linear concentration-response model".
- **`tofacitinib`'s was wrong in direction**, claiming equilibration with plasma while its cited rat paper attributes the effect to "attenuation of inflammation" over days.
- **`sildenafil`'s cited an in-vitro organ bath** with no route and no timing.

### A previous fix that was only half-done

`ondansetron`'s note said a fabricated palonosetron citation had been removed. It
had been moved out of the parameter block but **was still in `refs`**. Removed
here, along with 15 other non-substantiating references across the batch —
including a paper with **no abstract at all** under buprenorphine, a rat
formulation study under felodipine, and two wrong-drug binding papers under
zolmitriptan.

### Records that lost PK entirely

`risedronate`, `zoledronate`, `dexlansoprazole`, `ubrogepant`, `praziquantel` →
`uncharacterized`; `mepivacaine`, `lubiprostone` → `local-acting`.

- **`mepivacaine` and `lubiprostone` are inverted models, not merely wrong ones.** Mepivacaine acts at the injection site, so a rising plasma concentration means the block is wearing off — plasma is a toxicity index. Lubiprostone acts on the luminal face of the enterocyte and is "almost completely metabolized in the gut lumen"; its cited study measured only a metabolite, and its absorption rate equalled its elimination rate, making the model degenerate.
- **`dexlansoprazole` is the enantiomer trap with the sign inverted.** It is the R-enantiomer of lansoprazole and the slower-cleared, higher-exposure half (R/S exposure ratios 12.7, 8.5, 5.8), yet the registry gave it a *shorter* half-life and a *lower* bioavailability than the racemate. The two were not being treated as interchangeable — they were treated as independently measured, which is worse.

### Still open

**251 of 412 pharmacological compounds remain unaudited.** 390 non-IV route
entries still carry a `ka_hr`.

## Pharmacological category, batch 5 (2026-09-07) — 40 compounds, eight agents

Same recipe: triage the unaudited pharmacological remainder, take the 40
highest-scoring, dispatch eight agents of five compounds each against
`VERIFICATION_PROMPT.md`, require a verbatim abstract quote for every retained
number and an explicit list of rejected PMIDs for every one dropped.

Applied by `scripts/authoring/2026-09-07-pharmacological-batch5.ts`.

**Disposition: 34 re-sourced, 6 stripped to `pk_unauthored`.** Two routes removed
as declared-but-unparameterised, 11 non-substantiating references removed across
8 records, and 14 effect-compartment values corrected.

### The headline: an absorption rate has still never survived an audit

**Not one `ka_hr` in this batch was supported by its citation.** That extends the
run to roughly 180 audited routes across five batches with **zero** survivors.
Batch 5 adds three new mechanisms to the catalogue of how they got there:

- **`rosuvastatin`'s was BACK-DERIVED.** Against the record's own stored half-life,
  ka 0.595 reproduces a time-to-peak of *exactly* 5.00 h — and 5 h is itself the
  upper endpoint of a stated 3–5 h range. The number was computed from other
  stored numbers to make the curve peak where prose said it should. It is not a
  measurement at all, and it is the first case where we can demonstrate that.
- **`ibuprofen`'s was refuted by arithmetic in its own citation**: ka 2 predicts a
  1.04 h peak against the paper's stated 1.6–1.8 h. A genuine published rate
  (1.52 /h) existed in the same literature and now replaces it.
- **`cetirizine`'s was contradicted by the reference already on the record.**

Four records had absorption that **no first-order rate can represent**:
`isotretinoin` and `sofosbuvir` are zero-order with a lag, `raltegravir` needs
transit compartments, and `ranitidine` is bimodal (double-peaked).

### A new digit-collision shape: cross-drug transplant

**`empagliflozin`'s F 0.78 is *dapagliflozin's* bioavailability.** Not a
misattributed quantity from the right paper — a number belonging to a different
molecule in the same class. This is the first confirmed instance of the shape, so
it was **screened rather than assumed**: seven congeneric families (gliflozins,
gliptins, statins, triptans, sartans, prazoles, dipines) were checked for shared
PK values. The dapagliflozin/empagliflozin pair is the **only** case. Real, but
isolated — recorded so a future pass does not go looking for a systematic error
that is not there.

`temazepam` is the mirror image: **one source number entered into two different
fields.** Its F 0.96 is the volume in L/kg from the same paper.

### Effect compartments that point the wrong way in time

An effect compartment can only *delay* effect relative to plasma. It cannot
advance it. Two records violate this:

- **`ranitidine`**: gastric pH rises above 4 within 20–40 min of an oral dose
  while plasma peaks at ~3 h.
- **`loperamide`**: antidiarrhoeal effect begins within ~1 h against a capsule
  Tmax of 5.2 h.

These are not values that are too large or too small. They have the **wrong
sign**, and no positive rate can represent them. Both were retained as declared
placeholders (their records carry `receptor_occupancy` rows, and per the batch-4
standing rule a `keo` is never deleted out from under one) with the contradiction
stated in the note.

`empagliflozin` supplies a quieter arithmetic error: its stored 1 was an
**in-vitro radioligand dissociation half-life** — "half-life approximately 1 h" —
copied without converting a half-life to a rate. Now 0.693, though it remains an
in-vitro binding quantity rather than an in-vivo equilibration.

`nebivolol` and `labetalol` both borrowed from a **rat S(-)-atenolol** study, and
the specific figure quoted in support (2.52) does not appear in that paper at all.
`labetalol`'s note additionally claimed no human `keo` had been published, which
is false.

**One value survived.** `doxazosin`'s 0.3 is right and is now anchored to the
better source — the IV-and-oral study showing effect maximal at 5–6 h against a
~3 h plasma peak, a hysteresis measured against a route-independent input.

**`zaleplon`'s verifies exactly and still needed a caveat**: right quote, right
arithmetic — but the study delivered the drug as an **inhaled aerosol** peaking at
1.9 minutes, while this record models the oral route. Its provenance is kept
(`source_pmid` intact, not demoted); only the note changed.

### A live user-facing error, verified directly rather than accepted

`loperamide`'s stored EC50 (0.001431 mg/L) against its therapeutic Cmax (~0.00118)
made the model report **45.2% mu-opioid occupancy at an ordinary 8 mg dose** —
presenting a gut-restricted antidiarrhoeal as a centrally-active opioid. This was
computed from the shipped data, not inferred from the shape of the record.

Screening for the same shape found **5 local-acting compounds that retain
occupancy rows** and **12 compounds with F ≤ 0.10 that carry them**. Those are
logged, not fixed here.

### Records that lost PK entirely

`sofosbuvir`, `tenofovir-alafenamide`, `prasugrel`, `selegiline` →
`uncharacterized`; `loperamide`, `eluxadoline` → `local-acting`.

- **`eluxadoline` is physically impossible as stored.** V 80 L with F 0.01 implies a true volume of **0.8 L** — below plasma volume. The two are not separately identifiable because no IV arm has ever been run, and the 0.01 is an inequality bound ("less than 1% was recovered in urine") while the label states outright that absolute bioavailability "has not been determined". Its note correctly recorded that its citation had been upgraded from a review to a primary; **the fix changed nothing**, because that primary is a transporter-interaction study stating none of the values.
- **`tenofovir-alafenamide`'s F 0.25 is the DOSE** — "a single dose of TAF at 25 mg", the milligram figure stored as a fraction. Its stored 0.43 h describes the prodrug while the active intracellular species persists with a half-life of **20.8 days**, a factor of ~1160.
- **`prasugrel`'s parent is not measurable in plasma at all**, hydrolysed by intestinal carboxylesterase before reaching the circulation — so even `mw_g_mol` describes a molecule that never appears there. And a half-life cannot describe the drug in principle: P2Y₁₂ binding is irreversible, so duration is platelet turnover over 7–10 days.
- **`selegiline` joins the other irreversible MAO inhibitors.** Platelet MAO is still 96% inhibited five days after stopping, against a ~1.2 h plasma half-life. Its own literature states "systemic selegiline levels may not predict the propensity for a hypertensive crisis". Its transdermal values were sound and are preserved.
- **`sofosbuvir` has three species and the record modelled the least relevant one**: the dosed prodrug clears in minutes, the active species is an intracellular triphosphate never seen in plasma, and the measured analyte is an *inactive* metabolite ">90% of systemic drug-related material exposure" with a 27 h half-life against the stored 0.5 h.

### Two contradictions that resolved *in favour* of the stored number

Neither is a defect in the data — both were defects in **our own prose**.

- **`tranexamic-acid`**: the record's `source_label` read "t½ ~11 h" against a stored 2 h. Both figures are real and describe different quantities — 11 h is the terminal phase seen by long-sampling assays, 2 h the dominant elimination phase ("Most elimination took place during the first eight hours, giving an apparent elimination half-life of approximately two hours"). Elimination is ~90% complete by 24 h, so the terminal phase carries negligible exposure and **2 h is the right value for a one-compartment model**. Our label text was corrected; the number was not.
- **`tacrine`-shaped pairings that are legitimate.** `telithromycin`, `famotidine`, `labetalol`, `zaleplon` and `rosuvastatin` all pair a volume with an independent F and all five are **correct**, because in each the volume is IV-derived. The class-6 double-count is a real defect but it cannot be diagnosed from the shape of the record alone.

### References removed

11 across 8 records: an outcomes trial and a rabbit thrombosis model under
`apixaban`; a rat behavioural study under `zaleplon`; a med-chem paper that never
mentions the drug under `budesonide`; a paper on alpha-1 **agonists** under
`labetalol`, an antagonist; two victim-drug studies with no perpetrator PK under
`verapamil`; a hypervitaminosis-A review with no kinetics under `isotretinoin`; a
rat-bladder med-chem paper under `oxybutynin`; and an in-vitro leukocyte study
under `roflumilast`.

**`PMID:10377455` was investigated and deliberately NOT removed** from `ketorolac`
and `sulindac`. It supports no PK value on either record, but it is the COX-1/COX-2
selectivity assay that legitimately sources their `receptor_occupancy` rows — the
fourth time in this sweep that a reference supporting nothing in the PK block
turned out to be doing real work elsewhere. See the standing rule in
`DATA_QUALITY_BACKLOG.md` §9.

### Routes removed

`ibuprofen` TD and `diclofenac` TD + IM — declared with no PK block and no
citation anywhere. **`ibuprofen`'s IV route was kept**, against the initial
finding: absolute bioavailability is essentially complete (102.7%), so the
oral-derived apparent volume *is* the true volume and transfers legitimately even
though the cited study ran no IV arm. `diclofenac`'s TD route had inherited the
oral PK block wholesale despite transdermal exposure being ~400× lower.

### Still open

**~207 of 412 pharmacological compounds remain unaudited** (roughly five more
batches). **354 non-IV route entries still carry a `ka_hr`**, none of them
supported by an audit that has now examined ~180 routes without a single survivor.

## Pharmacological category, batch 6 (2026-09-07) — 40 compounds, eight agents

Same recipe. Applied by `scripts/authoring/2026-09-07-pharmacological-batch6.ts`.

**Disposition: 36 re-sourced, 4 stripped to `pk_unauthored`.** Nine routes removed,
15 non-substantiating references removed across 15 records, 7 occupancy values
replaced and 4 re-provenanced, 2 occupancy rows deleted, and 22
effect-compartment values demoted to declared approximations.

### The absorption rate constant survives — three times, after ~180 routes of nothing

- **`amiodarone` ka 0.49** — verbatim in its own cited paper: *"Absorption rate constant Ka did not statistically significant differ and was respectively 0.35 +/- 0.10 1/h and 0.49 +/- 0.35 1/h."* (The 0.49 is the branded-reference arm; the SD of 0.35 on a mean of 0.49 is a 71% coefficient of variation, so it is real but noisy.)
- **`aprepitant` ka 0.893** — a genuine NONMEM population estimate. Its "suspicious precision", which triggered a class-9 flag, is the precision of a *fit*.
- **`erlotinib` ka 0.95** — and this one **refutes** the stored value, which was 0.5, nearly half. It checks out independently: 0.95 reproduces a 4.2 h peak against this drug's observed ~4 h, while 0.5 gives 6.8 h.

**In two of the three, the correct paper was already sitting in the record's own
`refs[]`, cited by nothing.** The value was never missing; the citation was.

This falsifies, in one direction, the distribution screen run before the agents
reported. Of the 354 non-IV ka values then remaining, 288 (81%) carried two or
fewer significant figures and 245 sat in groups of four or more compounds sharing
a byte-identical number, across only 108 distinct values. But amiodarone's 0.49
has two significant figures and is real. **The distribution is a prior, not a
verdict** — the same lesson as the four reversals in §9 of the backlog.

### The class that actually explains them: back-derivation

Twelve ka values in this batch were computed from the record's own half-life to
reproduce a Tmax quoted in its own prose. Group 5 is the cleanest cluster yet —
all five, and four of them **disclose the derivation in their own notes**:

| compound | ka | t½ | Tmax it reproduces | which is |
|---|---|---|---|---|
| solifenacin | 0.85 | 55 | 5.03 h | a round 5 |
| tolterodine | 1.3 | 2 | 1.39 h | ~1.4 |
| prucalopride | 1.5 | 24 | 2.69 h | not even the 2.5 its note claims |
| ropinirole | 2.0 | 6 | 1.51 h | the midpoint of the label's 1–2 h |
| pramipexole | 1.5 | 8 | 2.017 h | *exactly* the label Tmax |
| atenolol | 0.7 | 6 | 3.08 h | the midpoint of "2-4 h" |
| fluphenazine | 1.25 | 16.4 | 2.8044 h | its paper's verbatim "tmax = 2.8 h" |
| lurasidone | 2.02 | 18 | 1.9985 h | the midpoint of its cited "1-3 h" |

**And it dissolves a cross-drug transplant I had flagged.** `lurasidone` and
`quetiapine` both store `ka 2.02`, which looked like the empagliflozin shape from
batch 5. It is not: 2.02 reproduces Tmax 2.00 h on lurasidone and 1.50 h on
quetiapine. The same rate cannot have been copied from one to the other *and*
land on each drug's own Tmax. They were derived independently and collided.
Class 9, not class 2. (The other precise shared value, `ka 1.25` on fluphenazine,
mdma and tiagabine, is still open.)

**One pre-empted false positive:** `ibuprofen`'s `ka 1.52` — the genuinely
published rate installed in batch 5 — collides with `naloxone`'s. Checked against
`HEAD~1`: naloxone carried 1.52 *before* batch 5, so it is coincidence. Do not
"correct" ibuprofen on the grounds that the value is shared.

### The occupancy model has no free-fraction term — logged as backlog §12

Found by computing rather than reading, then confirmed by three independent
routes. This is bigger than the batch; see `DATA_QUALITY_BACKLOG.md` §12.

### A new defect shape: a dropped leading digit

**`promethazine`'s V 970 L is 1970 with the first digit lost.** Verbatim:
*"Promethazine disposition is characterised by a large volume of distribution
(1970 l) and a high blood clearance (1.14 l min-1)."* And the fix cannot be
applied to V alone — `{970, 12 h}` implies a clearance 18% below the published
figure, `{1970, 12 h}` implies 67% above. Only the coherent pair
`{1970 L, 20 h}` works, and that half-life is *derived* from the paper's own
volume and clearance rather than quoted, which is recorded rather than hidden.

### Records that lost PK entirely

`elvitegravir`, `enzalutamide`, `tolterodine`, `alogliptin` → `uncharacterized`.

- **`alogliptin` was the record I expected to verify, and it is the worst in its group.** Its `F 0.65` is a **two-step digit collision**: its cited Caco-2/rat paper says "high absorption rate (>60-71%)", and that traces back to a primary where the figure is not absorption at all but *"mean fraction of drug excreted in urine from 0 to 72 hours after dosing, 60%-71%"* — a urinary recovery fraction, re-described by a secondary source, then stored as bioavailability, with 0.65 as its midpoint. Its V and t½ appear in **no** alogliptin abstract in PubMed.
- **`elvitegravir`'s half-life is contradicted by its own only reference**, which says boosting *"prolongs its elimination half-life to ∼9.5 hours"* against a stored 13. And its F is unmeasurable in principle — verified, not assumed: a search for an absolute bioavailability returns **zero** records and no IV formulation exists.
- **`enzalutamide`'s ka is a Tmax-stored-as-rate collision** (its abstract's only 1.5 is "median Tmax, 1.5 hours"), its t½ 130 matches neither the single-dose 90.7 h nor the steady-state 5.8 days, and its active metabolite carries **more than half** of total exposure.
- **`tolterodine` is superbly studied and still unauthorable.** Every scalar is a range endpoint, a rounding, or absent from its citation — V 113 L is the *top* endpoint of "0.9 to 1.6 l/kg" times an assumed weight. And the "10 to 70%" bioavailability range *is* the CYP2D6 split within one cohort, while the acting species is a parent-plus-metabolite sum whose halves have opposite genotype dependence. Its human bladder occupancy value is correct and was kept.

### Two records refuted by arithmetic against their own citations

- **`amiodarone`**: `{600 mg, F 0.5, V 5000 L}` caps Cmax at 0.060 mg/L against the **0.828 mg/L its own cited paper observed** — fourteen times low. Both parameterisations were computed before choosing: the stored set is 14× low on single-dose Cmax and 1.5× high at steady state; the replacement is 1.7× and 2.5× low. Less wrong, and fully verbatim. Recorded as a trade, not a fix.
- **`fluphenazine`**: the volume reproducing its own paper's *"Cmax 2.3 ng/mL at tmax 2.8 h"* is about 125 L, so V 1500 L runs **twelve times low**. It was retained anyway, because the resolver default would be forty-fold worse in the other direction — and **no replacement was invented**, since a volume computed from the record's own numbers is precisely the class-9 defect being hunted.

This corrects an earlier reading of my own. Fluphenazine's model reports a sober
20% D2 occupancy where most of this batch saturates, and I first recorded that as
evidence its low-F record was well behaved. It is not: the low occupancy is an
artefact of a 12×-oversized volume. **Two errors partially cancelling is not a
record that works.**

### One source number in two fields — three more

- **`metoclopramide`'s IV half-life was the oral arm's number.** Its paper gives the IV arm its own: *"a mean terminal half-life of 4.55 h +/- 0.80 h."*
- **`carvedilol` stored the identical `ec50` on its β1 and α1 rows.** The shared value back-solves to pKi exactly 8.40 — carvedilol's β1 affinity — while its α1A is 7.9. Real number, wrong field.
- **`paliperidone`'s apparent volume served both an oral row (÷ F 0.28) and a depot row (÷ F 1).** One number cannot be simultaneously apparent and absolute; that internal contradiction is what proved the class-6 defect rather than merely suggesting it.

### Class 6 examined nine times, confirmed twice, acquitted seven

After five wrongful flags in an earlier batch, every pairing was checked against
where the volume actually came from before being called.

**Confirmed** — `erlotinib` (its paper *names* its 233 L the "oral volume of
distribution", and the only IV erlotinib study publishes no volume) and
`paliperidone` (label-apparent, no IV formulation exists).

**Acquitted** — `diltiazem`, `metoclopramide`, `amlodipine`, `butorphanol`,
`tapentadol`, `clonazepam`, `solifenacin`, `bosentan`, `canagliflozin` and
`escitalopram`, all IV-derived; `sumatriptan` by physiological reductio (a 170 L
apparent volume would imply a true 24 L, impossible); and `buspirone` and
`vardenafil` by arithmetic — each shows a ~16% Cmax shortfall, the ordinary shape
of a steady-state volume in a one-compartment model, where double-division would
have predicted 7- to 25-fold low.

**`duloxetine` is the inverse of the defect and was nearly flagged as an instance
of it.** Its V 940 L is the paper's verbatim 1879.74 L apparent volume
*multiplied by F* — the correct correction — and the resulting clearance matches
the paper's published value to within 2%. Nothing in the record said so, which is
exactly how such a value gets un-corrected later; it is now written down.

### Reversals of my own prompt premises — four this batch

1. **`hydrocodone` is not a prodrug and CYP2D6 does not gate its analgesia.** A controlled crossover found *"EMs and PMs were equally responsive to oral hydrocodone, and quinidine had no consistent effect on their responses"*, concluding *"only a small role of hydromorphone"*. The stored PK and occupancy describe the right analyte; **the defect is in our own `mechanism` prose**, which opens "Prodrug — CYP2D6 O-demethylates to hydromorphone". Same shape as the tacrine reversal.
2. **`naltrexone` should not be stripped, and the agent argued me out of it.** `uncharacterized` means no primary publishes a modelled parameter — false here. Its PK *is* characterised; what fails is the plasma-to-effect link. And that is not a two-analyte problem either: human receptor-occupancy imaging found that *"for both NTX and its principal active metabolite in humans, 6-β-NTX, this relationship was indirect"*. Neither plasma species predicts blockade, which persists *"for 5 days after discontinuation"*.
3. **`sumatriptan`'s absorption parameter is not doing the wrong job.** I argued its low oral F reflects first-pass metabolism rather than poor absorption, so "absorption" was mismodelled. Its source confirms the premise — *"due mainly to presystemic metabolism"* — and that is precisely why the record's **shape is right**: the loss lives in F, and ka is a separate parameter.
4. **The `ropinirole` smoking hypothesis is unconfirmed, and is reported as a negative.** Every ropinirole-and-smoking record is about impulse-control behaviour, not kinetics, and the review's covariate list omits smoking.

Plus two structural suspicions that resolved in the data's favour: `bosentan`'s
auto-induction *"reduced [exposure] by 33% without change in tmax and t(1/2)"*, so
one half-life is valid in both phases; and `diltiazem`'s single PMID legitimately
serves both an IV and an oral row, because the study has both arms.

### Effect compartments — 22 demoted, none deleted

Group 5 recommended deleting four outright. **All four carry
`receptor_occupancy` rows**, so the batch-4 standing rule binds and they were
demoted with the evidence stated instead.

Three are wrong in *direction*, not magnitude: **`ropinirole`** (its only human
PK/PD model reports *"three of five subjects whose prolactin concentrations
nadired before ropinirole reached C_max"* — effect precedes plasma, which no
positive rate can produce), **`montelukast`** (a head-to-head IV-versus-oral
trial shows the oral arm already at 12.90% FEV1 improvement at one hour against a
3.7 h Tmax), and **`vardenafil`** (effect at 16 minutes against a 40–60 minute
Tmax, though stated carefully — "for some patients" is a responder tail, so the
defensible reading is near-instantaneous equilibrium rather than an inverted
sign). **`prucalopride`**'s is not an effect-compartment shape at all: acute
onset followed by tachyphylaxis over days.

Two notes committed defects in prose rather than in a field: **`promethazine`**'s
read its source's *earliest sampling time* as a measured onset, and
**`alogliptin`**'s presented a finding from *"rats, dogs, and monkeys"* as human.

**`atenolol`'s keo confirms the batch-5 nebivolol/labetalol finding from the other
direction.** Its source says *"0.042+/-0.012 min(-1) (k(eo))"*; ×60 = 2.52
exactly. So "2.52" genuinely does not appear in that paper — only 0.042 min⁻¹
does — which is why its appearance on two other β-blockers was a borrow. On
atenolol the drug matches.

**Two values verified and were left alone**: `carvedilol`'s 0.35 (*"The Ke0 was
(0.35 +/- 0.27) h(-1)"*) and `citalopram`'s and `escitalopram`'s QT-anchored
rates, all three fitted to continuous endpoints of the right model class.

### Occupancy rows

Seven values replaced, four re-provenanced, two deleted. **`butorphanol`'s μ and
κ rows carried one identical number from a paper that states none** — its only
Ki pair belongs to a novel analogue, butorphanol being the scaffold — and
identical affinities at both receptors make the drug's defining mixed
agonist–antagonist pharmacology unrepresentable. Both removed; no verbatim
replacement exists.

Five more were **range midpoints**, three of them taken *across different
papers*: `solifenacin` (whose range's lower endpoint came from a paper stating no
value for it at all), `prucalopride`, `carvedilol` β1 and β2, and `atenolol`
(whose cited abstract's only atenolol number is a *potency ratio*). `pramipexole`
is the same shape and **no replacement was proposed** — neither cited paper
contains an affinity, only selectivity ratios of "15" and "5-fold" sitting beside
the drug's name. Logged as an authoring gap, applying the reasoning that record
had already used to decline authoring its own D2 row.

### Routes removed

Nine: `promethazine` IM+PR, `metoclopramide` IM, `butorphanol` IM,
`sumatriptan` IN (all declared with no PK block at all); `aprepitant` IV (its
only IV exposure was a 2 mg stable-isotope **tracer microdose**, and the marketed
IV product is fosaprepitant, a different molecule); and the four depot rows —
`fluphenazine`, `risperidone`, `paliperidone`, `naltrexone` — whose release
durations are all **dosing intervals** (336 h = 2 weeks, 672 h = 28 days, 720 h =
"one month") and whose half-lives were the oral values copied across.
`paliperidone`'s depot row was additionally hung on a study of *"a single dose of
1 mg of [14C]paliperidone oral solution"*.

### Still open

**~167 of 412 pharmacological compounds remain unaudited** (about four more
batches). **316 non-IV route entries still carry a `ka_hr`** — but the survival
rate is no longer zero, so the remainder cannot simply be swept.

## `fraction_unbound`, batch A2 (2026-09-07) — 80 compounds, eight agents

The first data batch of backlog §12. The 80 compounds whose occupancy rows the
model overstates most, ranked by modelled occupancy at each record's own typical
dose. **64 sourced, 16 genuine gaps.**

Applied by `scripts/authoring/2026-09-07-fraction-unbound-a2.ts`.

**Measured effect, on a third of the target set:** pharmacological occupancy rows
reporting ≥90% occupancy at an ordinary dose fell from **52% to 34%** (109 → 71
of 210). Spot-check — risperidone 2 mg D2 goes from 89.3% to 45.4% against a
published PET value of roughly 65%; still not right, but wrong by a factor the
model can explain rather than by an order of magnitude it cannot.

### The storage rule this batch had to establish

About a third of what came back is an **inequality** (">99% bound") or a
**range** rather than a point value, and the agents were right to refuse to
invent digits. But the correction matters most exactly where the sourcing is
weakest — the >99%-bound drugs, where a 100× correction rides on a ">". Leaving
those null keeps the full uncorrected error. So:

1. Point value from an abstract → store it.
2. Point value from a label only → store it, note flags the grade.
3. **Inequality → store the implied bound.** That is an upper bound on fu, hence a *lower* bound on the correction: it can only under-correct.
4. **Range with no single measurement → store the endpoint that under-corrects** (the higher fu), both endpoints in the note.
5. Concentration-dependent within the therapeutic range → skip.

The error direction is then one-sided everywhere. Since the pre-correction state
overstates occupancy, moving partway toward truth is strictly better and
introduces no new error class.

### Four skips are "a scalar is indefensible", not "not found"

- **`linagliptin`** — *"concentration-dependent protein binding in human plasma in vitro (99% at 1 nmol/L to 75-89% at >30 nmol/L)"*, reflecting saturation of binding to its own target DPP-4. Its steady-state Cmax at the therapeutic 5 mg dose is 11–12 nmol/L, **squarely inside the transition**.
- **`montelukast`** — its methods literature states outright that *"only a range of fu can be reported with confidence because of uncertainty in the true equilibrium"* for extensively bound, high-logD drugs.
- **`cortisol`** — from one paper's own verbatim pairs, fu is 0.085 at 08:00 and 0.053 at 22:00. A 1.6× swing across an ordinary day, before any stress response, and a third source gives 0.109 by a method that reads ~16% higher than equilibrium dialysis.
- **`mifepristone`** — four independent abstracts establish that its AAG binding saturates *within* the therapeutic range, and its metabolites circulate at levels similar to parent while retaining receptor affinity.

### A limit on the whole correction, found by an agent rather than assumed

**`semaglutide` and `tirzepatide` were skipped for a reason that generalises.**
Both carry engineered fatty-acid chains whose albumin binding *is* the half-life
mechanism. Potency assays for acylated GLP-1 analogues are routinely run **with
1–2% albumin present**, precisely because that binding is the designed
mechanism — so a stored EC50 may already be albumin-shifted, and dividing by fu
would **double-count the same binding** and under-predict occupancy ~100-fold.
The discovery paper does not state its assay's albumin conditions.

`basis: 'in_vitro_ki'` silently assumes a protein-free assay. For most of the
catalog that holds; for engineered albumin binders it is unverified. Logged, not
guessed.

### Traps caught, several of them mine

- **The paliperidone rat trap, and my own prompt supplied it.** I told the agent to expect "roughly 74%" — **74.7% is the rat value** in that abstract; the human figure is 77.4%. The label's 74% is a different route to nearly the same number, for racemic paliperidone.
- **Two of my stated priors did not survive, and the agent declined to shade toward them.** I flagged 0.02–0.15 for the antidepressant/antipsychotic set; **quetiapine is genuinely 0.17** and **doxepin ~0.204**. My prior looks anchored on one outlying doxepin study.
- **`olanzapine`'s "90%" is albumin-only.** Its source says *"predominantly bound to albumin (90%) and alpha 1-acid glycoprotein (77%)"* — two separate isolated-protein percentages, not total plasma binding, which is higher than either. Skipped rather than converted.
- **`losartan`** models the parent here (confirmed against our own mw, half-life and occupancy KB), and **EXP3174 in the same paper is sevenfold more bound** — taking the metabolite's number would have been a 7× error.
- **`hydroxyzine`**'s rejected PMIDs are all **cetirizine**, its active metabolite and a chemically distinct zwitterion.
- Wrong-species values caught and rejected rather than stored: zonisamide 60% unbound (**dogs**), clomipramine 6.51% free (**rats**), cetirizine 88% (**cats**), diclofenac >99% (**monkeys**), sertraline >97% (**rat and dog**), tadalafil (**mouse**, **rat**), progesterone (**rat**).

### Two rows where fu is right and still does not fix the record

- **`rosuvastatin`** — its target is intra-hepatocyte and OATP1B1 actively concentrates it there, so free plasma is a *floor* on target-site concentration, not an estimate. One rejected paper is titled for exactly this: *"The Presence of a Transporter-Induced Protein Binding Shift"*. The correction makes this row look more principled without making it more true.
- **`spironolactone`** — the stored fu is the one parent-specific figure in the literature rather than the label's "spironolactone and its metabolites" lump, but this record's own note already records that the parent carries roughly 3% of active exposure.

### Conflicts logged rather than buried

- **`sotalol`**: one steady-state patient study reports 35–38% bound (fu ≈ 0.63) against "<7% bound" by ultrafiltration, "negligibly bound" by equilibrium dialysis, and a label saying it does not bind at all. Judged the outlier; immaterial either way, since at fu ≥ 0.93 the correction is a no-op.
- **`diphenhydramine`**: a direct measurement in healthy volunteers gives 18.3% unbound, against a 98–99% bound figure circulating in tertiary references that could not be sourced to any abstract — an order of magnitude apart.
- **`irbesartan`** (skipped): its own literature reports *"a large discrepancy in protein binding between previously reported and the present experimental data, obtained from two different non-associated laboratories"*.
- **`atomoxetine`**: label 98% vs review 99%. **A one-point difference in the bound figure is a twofold difference in fu** — the general hazard of storing fu above 98% bound.

### Still open

**158 compounds still need `fraction_unbound`** (batches A3–A4). The 16 gaps
above should not be re-chased without new evidence; four of them are
indefensible by construction rather than unsourced.

## `fraction_unbound`, batch A3 (2026-09-07) — 80 compounds, eight agents

**70 sourced, 10 gaps.** Combined with A2, pharmacological occupancy rows
reporting ≥90% occupancy at an ordinary dose have fallen from **52% to 26%**
(109 → 54 of 210).

Applied by `scripts/authoring/2026-09-07-fraction-unbound-a3.ts`.

### A live bug A2 shipped, found by an agent and fixed here

**Ten occupancy rows carry a HUMAN WHOLE-BLOOD IC50**, which is already measured
in a matrix containing albumin and AAG at physiological concentration. Such a
potency is the correct comparator for the solver's total plasma curve *as it
stands* — applying fu to it double-corrects.

Two were live: **diclofenac's COX rows against its fu of 0.003 were being shifted
333-fold in the wrong direction, and ketoprofen's 192-fold** — worse than the
uncorrected error this work exists to fix. A third `basis` value,
`whole_blood_ic50`, now opts them out, with a regression test.

The affected rows are the NSAID COX assays plus acetaminophen and etoricoxib —
`acetaminophen`, `diclofenac` (×2), `etoricoxib` (×2), `ketoprofen`, `meloxicam`
(×2), `naproxen` (×2). This is the same shape as the peptide caution logged in
A2: **`basis: 'in_vitro_ki'` silently assumes a protein-free assay**, and that
assumption is wrong for whole-blood work as well as for albumin-containing
potency assays.

### A flaw in the A2 storage rule

A2 said "an inequality can only under-correct". That holds **only for a
`>X% bound` statement**:

```
">99% bound"   → fu ∈ [0, 0.01)   → store 0.01 = MAX fu = least correction  ✓
"≤40% bound"   → fu ∈ [0.60, 1]   → store 0.60 = MIN fu = MOST correction   ✗
```

The rule is **store the maximum fu consistent with the inequality**, which
coincides with the bound in the first shape and is its opposite in the second.
`ropinirole`, `sumatriptan`, `saxagliptin` and `varenicline` are the inverted
shape; each can over-correct, but by at most 1.25–1.67×, and their notes now say
so rather than claiming a guarantee that does not hold.

**A second direction error, corrected in three A2 notes.** Occupancy is
`fu·Cp/(fu·Cp + EC50)`, so a *lower* stored fu means *more* correction. Where a
value comes from a low-concentration measurement and true fu at a real dose is
higher — `melatonin`, `acetazolamide`, `ketoprofen` — the stored figure sits
*below* the truth and **over**-corrects. Those notes claimed the opposite.

### The skips are structural, and four of them are the label's own admission

Six of ten are compounds whose binding saturates inside the therapeutic range:

- **`naproxen`** — the label documents it directly: *"saturation of plasma protein binding at higher doses"* within the approved range, with trough unbound fractions of 0.05–0.075% in young adults against 0.12–0.19% in the elderly.
- **`nabumetone`** — free fraction runs *"0.2% to 0.3%"* at 1000 mg and *"approximately 0.6% to 0.8%"* at 2000 mg, a 3–4× swing across the approved range. (Its analyte was independently confirmed as 6-MNA, matching what this record already models.)
- **`prednisolone`** — *"At serum concentrations of prednisolone up to 0.6 micron, 95.0% was bound but at higher concentrations the binding became non-linear falling to 80.5% at 1.8 microns"* — a fourfold fu swing across concentrations an ordinary 10–60 mg dose produces. Same saturable-transcortin mechanism that made cortisol a skip in A2.
- **`eplerenone`** — *"Plasma protein binding was moderate (33-60%) but concentration-dependent over the therapeutic concentration range"*, **in the very paper this registry already cites as eplerenone's PK source**.
- **`quinidine`** — *"a marked increase in unbound fraction of ... QD (13 to 36%) in human plasma when drug concentrations were increased over the ... therapeutic range"*.
- **`ibuprofen`** was kept as a floor rather than skipped, and the threshold is now quotable against its own exposure: the label puts saturation at **>20 mcg/mL** against a measured Cmax of **59.75 mcg/mL** after 800 mg — therapeutic peak sits ~3× above it.

The remaining four have no verifiable source at all: `lsd` (every "LSD binding"
hit is [³H]LSD as a *radioligand* at 5-HT2A), `psilocin`, `promethazine` (no
abstract **and** no label across three SPLs; its closest paper states the
measurement *failed* — *"not possible to measure because of low concentrations
and nonspecific binding"*), `glycine` and `ghrp-2`.

### Four of my own priors were wrong, and the agents declined to shade toward them

- **`amiodarone` is ~96% bound, not >99%** — a fourfold error in the over-correcting direction, on what is already the catalog's most fragile PK record.
- **`celecoxib` is 97.4%, not >99%** — sevenfold in fu. Its mouse, rat and dog figures sit in the *same abstract*.
- **`tianeptine` is 94–95% bound**, not weakly bound.
- **`methylphenidate`**: my ~15% is not a number any source states; the label commits only to a 10–33% band.

**And one prompt error of mine that would have been a 3× over-correction.** I
told an agent that `vardenafil` already carried `fu 0.15` from an earlier batch.
It never did — **0.15 is its bioavailability**. The agent caught it and sourced
the real value, 0.05.

Two more of my framings were refuted: **`atracurium` does have a clean human
free-fraction measurement** (I suggested it might not, and that the free-drug
frame might not fit); and **`pindolol`'s one PubMed abstract is the outlier**,
with the label and a cardiomyopathy study both putting binding under 50%.

### Traps caught

Species figures rejected rather than stored: rat (atenolol, carvedilol —
*">98% for total plasma"*, right magnitude and phrasing, wrong species;
nebivolol, triazolam, clonazepam, chlorpheniramine, lamotrigine), dog
(clonazepam, flumazenil, dronabinol, zonisamide), bovine albumin (atenolol),
rabbit (chlorpheniramine), monkey and baboon (nimodipine, letrozole).

**Isolated-protein figures rejected** — the shape that caught olanzapine in A2 —
for `zolpidem` (65–66% against isolated albumin and AAG, in the *same abstract*
as the 91.9% total), `letrozole` (albumin-only 55.1% beside the total 60.1%),
`amiodarone` (carrier shares of bound drug summing to 95.6), `estradiol`,
`carvedilol`, `chlorpheniramine`, `bicalutamide` and `tianeptine`.

**A new trap shape**: `baricitinib`'s label gives *"approximately 50% bound to
plasma proteins and 45% bound to serum proteins"* — two **total**-binding
figures in one sentence, in different matrices. The Hill comparison needs the
plasma one.

**`roflumilast` is the first case where fu and `pk_analyte` are coupled**: parent
99%, N-oxide 97%. The stored 0.01 is right only while the record models the
parent — and this record's own note says the N-oxide carries >90% of the PDE4
activity at ~12× the exposure. If it is ever repointed, fu must move to 0.03.

### Still open

**87 compounds still need `fraction_unbound`** (batch A4). The 26 gaps across A2
and A3 should not be re-chased without new evidence; ten of them are
indefensible by construction rather than unsourced.

## `pk_analyte`, batches C1 and C2 (2026-09-07) — 47 records, warning class closed

For a compound that converts to an active species, "the half-life" is not a
well-formed quantity until the analyte is named. This sweep kept finding records
where the candidates differed by an order of magnitude — sofosbuvir stored the
half-life of an *inactive* metabolite carrying >90% of systemic exposure while
its active species never enters plasma; risperidone stored the parent's
bioavailability beside the active moiety's half-life, which is neither of the two
rows its own abstract offers.

`pk_analyte` (`parent` / `active-metabolite` / `active-moiety` /
`total-drug-related`) plus `pk_analyte_name` now carry that claim, and the
`pk.prodrug-analyte-unstated` rule checks the **field** rather than sniffing
prose. **The warning class is now empty.**

### C1 — 37 records, and mostly bookkeeping by design

Almost every analyte was *already established* by an earlier batch and written
into the record's own notes — *"PK models PREDNISOLONE, the active species"*,
*"WRONG ANALYTE, CONFIRMED BY MASS ... every measured value describes MYCOPHENOLIC
ACID at 320.34"*. What was missing was a field saying so, which is exactly why
the old prose-sniffing rule failed in both directions: it passed records that
merely used the word "analyte" and failed ones that said the same thing in other
words.

**Five entries were the rule mis-firing** on compounds that do not convert at
all. Captopril's own mechanism text says *"active drug, no prodrug"*; ticagrelor's
says *"direct-acting (not a prodrug)"*. Ampicillin, clindamycin and erythromycin
have prodrug *esters*, but those are separate molecules.

**Three are `parent` because activation is intracellular or bacterial**, so no
other plasma species exists to model: isoniazid and pyrazinamide are activated
*inside the mycobacterium*, and nitroglycerin releases nitric oxide via
mitochondrial ALDH-2.

### C2 — the nine C1 deliberately did not infer

C1 left nine where the only evidence was an internal inconsistency: **a
parent-ester molecular weight beside an active-diacid half-life.** Seven were
chimeras exactly as suspected. Two were not:

- **`lovastatin` refutes the inference, and should not match its sibling.** The parent-ester tell does not apply because lactone and acid have statistically indistinguishable half-lives in the same 12 volunteers — 3.7 ± 2.5 h and 4.3 ± 2.8 h — so nothing forces the record onto the acid. A separate defect surfaced instead: its stored 3 h was the top of a **three-drug class range** (*"Lovastatin, pravastatin and simvastatin ... have elimination half-lives of 1-3 h"*), now replaced by the measured 3.7 h.
- **`molnupiravir` has a settled analyte and still no defensible numbers**, so it was stripped rather than labelled. Its stored 3 h is neither of the two rows its own abstract offers — NHC *"declined with a geometric half-life of approximately 1 hour"* with a slower phase at *"7.1 hours at the highest dose tested"*, and that abstract never says what the highest dose was.

**A record C1 had already "resolved" was reopened, and the verification agent
found it rather than the pass that created it.** `simvastatin` was labelled
`active-metabolite`/simvastatin acid on the strength of its own note — but that
same note concedes the stored bioavailability *"describes the parent lactone"*.
The row paired an **acid half-life with a lactone bioavailability** under an
active-metabolite label: the exact chimera this pass exists to eliminate. F is
now pinned to 1 so the row describes one species throughout.

### Four citation defects found along the way

`oseltamivir`, `tenofovir-disoproxil`, `sacubitril` and `lisdexamfetamine` each
cited a `source_pmid` whose abstract supports **none** of their stored numbers —
a bioequivalence study, a paper with no numeric PK at all, and two that confirm
only the analyte.

### Numeric corrections

- **`fosinopril` V 26 L contradicts its own citation**, which states *"a Vss of 5,850 +/- 2,780 mL"* — 5.85 L, a **4.4-fold error**, with 26 appearing nowhere. Its stored 12 h was in neither row (17.4 h oral, 13.0 h IV).
- **`lisdexamfetamine`** — the cleanest discrimination of the nine, one abstract, same subjects, both species: parent *"t1/2 = 0.5 hours"* against d-amphetamine *"t1/2 = 17.0 hours"*, a **34-fold split**. Its mass error is the worst of the batch at ~1.95× (263.38 vs 135.21).
- **`sacubitril`** — the parent peaks at 0.5 h and shows *"no accumulation"* on twice-daily dosing while sacubitrilat accumulates ~1.6-fold, so the stored 11 h could not be the parent. Corrected to a verbatim 12 h.

### One record that turned out better-sourced than expected

**`tazarotene`** — I wondered whether a systemic half-life is meaningful at all
for a topical retinoid. It is: its existing citation carries *both* stored values
for the metabolite explicitly, and the parenthetical *"(measured as tazarotenic
acid)"* names the analyte outright. Kept, not stripped.

## Identity collisions, batch D1 (2026-09-07) — 17 of 21 closed

A `compound.identity-collision` fires when one record lists an alias that is
another record's canonical identity, so a search for B can land on A. The 21
open warnings turned out to be **three different problems wearing one warning**.

### Kind 1 — a record claims a more specific form that has its own entry (17, all fixed)

`calcium` claimed "Calcium carbonate", `zinc` claimed "Zinc picolinate", `sodium`
and `potassium` their chlorides, `coq10-ubiquinol` claimed "coq10", and the three
branched-chain amino acids each claimed "BCAA" — every one of those is a separate
authored record. The alias was simply wrong and removing it is the whole fix.

Two are worth naming:

- **`ldn` claimed "naltrexone"** — the clearest case in the set. A search for naltrexone could surface a 4.5 mg off-label protocol instead of the 50 mg opioid antagonist.
- **`aspartate` claimed "D-Aspartic acid"** — a **stereochemical** error, not a naming one. That record is L-aspartate, the proteinogenic form; D-aspartic acid is the opposite enantiomer with its own record and its own neuroendocrine literature.
- **`epa-dha` claimed three records at once** — "Fish oil", "epa" and "dha". A combination product cannot also be each of its constituents *and* their common source.

**One collision only surfaced after another was fixed.** `zinc-picolinate` claimed
"zinc" — the mirror of `zinc` claiming "Zinc picolinate". The salt and the element
were each claiming the other, and clearing one direction exposed the other.

### Kind 2 — the SLUG is the collision, not the alias (2, deferred)

`alanine` claims "Ala" and `ribose-5-phosphate` claims "R5P" — and **both of those
are the correct standard abbreviations for those molecules.** The problem is that
the slugs `ala` and `r5p` were assigned to **alpha-linolenic acid** and
**riboflavin-5'-phosphate**. Deleting the alias would be the wrong fix; the slugs
need renaming with retired-slug forwarding.

### Kind 3 — genuine duplicates (2, deferred)

`citrulline`/`l-citrulline` and `glutamine`/`l-glutamine` are each one molecule
held twice — identical molecular weight, identical mechanism prose. And **each
pair disagrees with itself**: the unprefixed record carries authored systemic PK
while the L-prefixed one is `pk_unauthored: local-acting`, so the registry
publishes both a curve and a refusal-to-curve for the same substance.

### Deferred to D2

The four remaining need the merge machinery (inbound-reference counting and
retired-slug forwarding), not an alias edit — the same tool the earlier
duplicate-merge pass used. Doing them as alias deletions would hide the problem
rather than fix it.

## `fraction_unbound`, batch A4 (2026-09-07) — 62 compounds; track A complete

**43 sourced, 19 gaps. 177 records now carry `fraction_unbound`.** Across A2–A4,
pharmacological occupancy rows reporting ≥90% occupancy at an ordinary dose have
fallen from **52% to 26%**.

### The sweep this batch triggered mattered more than its values

Group 2 noticed that `sulindac`'s COX row is a human **whole-blood** assay, where
an fu correction double-counts. The A3 fix had screened for that **by note text**
and caught only one of seven rows citing Warner 1999 — a 40-compound whole-blood
paper. Re-screening **by `source_pmid`**, which is the authoritative key, found
six more, **three of them live**: `ketoprofen`'s second COX row (192×) and both
of `piroxicam`'s (91×).

**The lesson generalises: provenance lives in the citation, not the prose.** A
text screen over notes is a heuristic; the PMID is the fact.

One row was deliberately **not** resolved. `ibuprofen`'s COX assay used monocytes
*separated* from blood — neither protein-free nor whole-blood — and its abstract
never states the incubation medium. With fu at 0.01 that is a 100× lever either
way, so both rows carry an explicit note saying the basis is unresolved rather
than a guess.

### Six more of my priors were wrong, two reversing a planned skip

| prior | what the sources said |
|---|---|
| `thiopental` is saturable → skip | Its own authors disproved it: binding *"was found to be linear over a concentration range of 93 ± 60 µg/ml to 6.9 ± 0.62 µg/ml"*. Its real vulnerability is albumin level, a population effect. |
| `fludrocortisone` shares cortisol's saturable CBG | **A false analogy driven by a 200× dose difference.** At 0.05–0.2 mg it reaches ~0.5% of CBG capacity. Skipped, but for source quality — serum, range, species-unstated — not saturability. |
| `ketamine` ~12% bound | ~60%. The classic 12% source **has no PubMed abstract**, and the paper that measured it opens by saying it exists because *"scarce data were observed in the literature"*. |
| `budesonide` needs a route-specific value | **Route-independent.** Three labels — inhaled, oral DR, oral ER — carry the identical 85–90%, each stating concentration-independence. |
| `thc` is 97–99% bound | Nothing credible exceeds 97%; one review says 90–95%, so 0.03 may *over*-correct 2–3×. |
| `triamcinolone` may be a CBG skip | Its own paper ran exactly that test: binding *"constant, predictable ... over a 24-fold range"*. |

### The most useful single finding: two errors currently cancelling

**`fluphenazine` is skipped, and it must stay gated to a second fix.** Its volume
runs the model twelvefold low, which accidentally does most of the work the
missing fu correction should do:

```
today   (V wrong, no fu)          Cmax ~0.19 ng/mL → ~23% D2 occupancy
V repaired, still no fu           Cmax  2.3  ng/mL → ~78%
V repaired AND fu applied (~0.05) free 0.115      → ~15%
```

**Repairing the volume alone would take this row from 23% to 78% and create a new
false positive.** The two changes have to land together.

### Frame refusals — three compounds where a number would be a lie

- **`sevoflurane`** — its label has a section headed *"Protein Binding"* that says nothing about sevoflurane's own binding; it is about sevoflurane *displacing* other drugs. A live trap for a future pass. Its stored ec50 is already an aqueous bath concentration.
- **`isoflurane`** — the label carries partition coefficients, not binding. Recording fu = 1.0 would be an active lie.
- **`scopolamine`** — the label declines outright: *"may be reversibly bound to plasma proteins"*. Its trap is two sentences earlier: an 87/354 pg/mL "free vs total" pair that is **unconjugated parent vs parent-plus-conjugates**, not a free fraction.

### Where fu is right and the record still isn't

`loperamide`, `tiotropium`, `brimonidine` and `dorzolamide` all now carry a
correct fu that **does not fix the underlying frame** — each has a target reached
by local delivery rather than through plasma. Loperamide's is the sharpest: fu
0.05 would cut its spurious 45% mu-opioid occupancy to ~4%, *a better-looking
number reached for the wrong reason*. It is the right correction for that drug's
megadose hERG cardiotoxicity, which is genuinely plasma-driven, and that
distinction is recorded on the row.

### Two follow-ups the sources handed us

- **`alogliptin`'s stripped PK can be re-authored.** A2 stripped it after finding its F was a urinary-recovery fraction; the label names that culprit outright (*"60% to 71% of the dose is excreted as unchanged drug in the urine"*) **and supplies replacements** — bioavailability ~100%, volume 417 L, half-life ~21 h. That would un-zero its DPP-4 curve.
- **`cbn` is a known-magnitude, unfixable gap**, which is worth logging differently from a neutral one: it has a solvable curve driving an in-vitro CB2 Ki against total plasma, and for a compound that lipophilic true fu is plausibly under 0.01 — so its occupancy is likely overstated ~100× with nothing available to correct it.

### Record defects found in passing, independent of binding

`misoprostol`'s mw is the methyl ester while the modelled species is the acid;
`triamcinolone`'s is the free alcohol while all four marketed routes are the
acetonide; `fenofibrate`'s occupancy row converts a fenofibric-acid EC50 with the
**parent** mass, making its ec50 13% high; `sevoflurane`'s inhaled dose is in mg
for an agent dosed in vol%/MAC; and `succinylcholine`'s IV typical is 1.5 mg
against a real 1–1.5 mg/kg.

### Still open

**38 compounds still lack `fraction_unbound`**, all of them now either
documented gaps or records with no solvable PK. The 45 gaps across A2–A4 should
not be re-chased without new evidence.

## Identity collisions, batch D2 (2026-09-07) — the class is now empty

The four D1 left, each needing slug-level surgery rather than an alias edit.
**`compound.identity-collision` is now at zero.**

### Two genuine duplicates, merged

`l-citrulline` → `citrulline` and `l-glutamine` → `glutamine`. Each pair was one
molecule held twice with identical mass and mechanism, and **each disagreed with
itself**: the unprefixed record carried authored systemic PK while the
L-prefixed one was `pk_unauthored: local-acting`. The registry was publishing a
curve *and* a refusal-to-curve for one substance, and two intakes of it never
summed into one exposure.

Survivors were chosen by inbound-reference count and authored PK — the same test
the earlier merge pass used, and it agrees with that pass, which put `arginine`,
`tryptophan` and `tyrosine` ahead of their "L-" supplement-label forms.

### Two slugs that were never the right name

- **`ala` → `alpha-linolenic-acid`.** In this catalog that slug was **triply ambiguous**: "Ala" is alanine's three-letter code, "ALA" is the common abbreviation for alpha-lipoic acid — which is here as `ala-r` — and the slug itself held alpha-*linolenic* acid. A three-letter slug cannot carry three molecules. **2,248 food items rewritten.**
- **`r5p` → `riboflavin-5-phosphate`.** R5P is the standard abbreviation for **ribose**-5-phosphate, which is a separate authored record.

In both cases deleting the offending alias would have been the wrong fix, because
"Ala" and "R5P" are the *correct* abbreviations for the compounds claiming them.

### A miss the lint caught, worth recording

The first run rewrote only each food's top-level `items` and produced **454
`food.compound-ref` errors** — because builder presets nest a *second* set of
items under `options[].choices[].items`. That is precisely the failure the
earlier merge pass warned about in its own header: *"a missed one is a broken
pathway step or a food preset that logs a compound the solver cannot find."*
Reverted, the traversal fixed, re-applied: the `ala` rewrite went from 1,794 to
2,248 items, and the 454-item difference matches the error count exactly.

## Pharmacological category, batch 7 (2026-09-07) — 40 compounds, eight agents

Selected by the same triage as batches 5 and 6 from the 176 unaudited pharmacological
records carrying PK. Three records stripped, thirty-one re-sourced, six verified
unchanged. **Two new defect classes, and both were found by arithmetic rather than by
reading citations** — which is the reason to record them at length.

### Class 12 — two-compartment parameters flattened into one compartment

In the one-compartment Bateman model this registry uses, `{V_L, F, half_life_hr}`
jointly fix `CL/F = (V_L/F)·ln2/t½`, and therefore fix AUC. Comparing that against a
*verbatim published clearance or AUC* is an independent test that no defect class in
the existing taxonomy covers, because **every individual number can be correctly
sourced and the set still be wrong**:

| record | stored set implies | literature says | error |
|---|---|---|---|
| baricitinib | CL/F 5.56 L/h | "low oral-dose clearance (17 L/h)" — its own citation | 3.06× over |
| candesartan | CL/F 1.68 L/h | 13.2, 9.9 and 17.5 L/h from three sources | Cmax 4.4× high |
| febuxostat | AUC/dose 0.259 h/L | 0.095 h/L | 2.7× over |
| nimodipine | Cmax 2.5 ng/mL | "10.208 +/- 0.317 ng/ml" — its own citation | 4× under |
| etravirine | CL 17.8 L/h if t½ 41 kept | 41.7 L/h | 2.3× over |
| lamotrigine | CL 1.49 L/h | "from 1.94 to 2.28 l h(-1)" | 1.3–1.5× over |

The mechanism is a volume from a **bi-exponential fit** paired with that fit's
**terminal** half-life, fed to a solver with one compartment. Baricitinib's own
abstract says concentrations "decline in a bi-exponential fashion"; febuxostat's
32.8 L is explicitly `Vc/F` of a two-compartment model.

**Candesartan is the sharpest case and is deliberately left open.** V 9 L is its
genuine small IV-derived volume, 9.3 h is its genuine terminal half-life, and they
cannot coexist in one compartment. **Fixing F alone makes it worse**: the stored 0.4
is the *oral solution* figure where this record doses tablets (~15%), and F 0.15 cuts
the implied CL/F to 0.63 L/h. Reproducing the observed AUC needs V/F ≈ 132 L, which
no abstract states. Logged rather than closed with an invented number.

**Where the fix was applied, the derivation is disclosed in the record**, following
the promethazine precedent from batch 6: etravirine t½ 16.2 h, febuxostat V 142 L,
lamotrigine t½ 27.7 h and nimodipine V/F 2500 L are each the value that reproduces
their own cited study's clearance or observed Cmax, and each note says so.

### Class 13 — verbatim-correct but superseded

`hydroxyzine` t½ 3 h **passes the contract**: PMID:512901 says "the half-life of drug
removal was approximately 3 hr", human, oral, 100 mg, healthy males, correct analyte.
It is still wrong. Four later human studies give 20 h, 20–25 h, 29.3 h (elderly) and
7.1 h (children); the 1979 GLC-MS assay truncated sampling below the terminal phase.

**The proof is physical, not bibliographic.** V 1200 L with a 3 h half-life implies
CL/F 277 L/h = 4.6 L/min, which **exceeds cardiac output**, against a measured
9.6 ml/min/kg = 40.3 L/h. A citation check can never reach this shape.

And the absorption constant was the innocent party: ka 2.0 with the old half-life
predicts a 1.22 h peak against a measured 2.0–2.3 h, but with the corrected 20 h it
reproduces Tmax 2.00 h almost exactly. It was kept.

### The 1.5-hour generator — a catalog-wide measurement

Two agents independently reported a `ka` that solves to Tmax 1.50 h. Sweeping all 308
extravascular routes carrying both `ka` and a half-life:

- Naive test: 31 of 308 land within 0.02 h of a half-hour Tmax against 24.6 expected —
  **1.3×, i.e. nothing**.
- The naive test is contaminated by **round `ka` values, which produce a round Tmax
  trivially**. Excluding any `ka` expressible in one decimal place (or ln2) leaves 86
  routes: **14 land within 0.005 h of a half-hour against 1.7 expected — 8.1×.**

Confirmed members repaired here: quetiapine 2.02 → 1.502, venlafaxine 1.88 → 1.497,
fenofibrate 1.56 → 2.496, ketoprofen 2.13 → 0.9996 (exactly 1.000 h), piroxicam
1.02 → 4.0046. Script: `/tmp/claude-1000/tmax-sweep3.mjs`.

### Counter-finding: a published keo for an antipsychotic

**My standing claim that no published keo exists for any antipsychotic is FALSE for
aripiprazole.** Kim 2012 (PMID:22186667) — the paper already cited — fits a genuine
effect-compartment model in its Table 1 (PMC3318151): keo 0.725, RSE 12.9%, CI
0.542–0.908, with "The equilibrium half-life for the effect site ... was 0.96 hours."
Human, oral, [11C]raclopride PET, n=18. The abstract is silent, which is why an
abstract-only check flags it. **The stored value is correct and was left alone.** The
claim does hold for asenapine, brexpiprazole and clomipramine.

### The four dosing-magnitude defects

Ranked by how far they move the simulated curve:

1. **aripiprazole IM — 30–50× under-delivery.** PMID:28350572 is aripiprazole
   **lauroxil** (Aristada), a monthly extended-release prodrug dosed "441-882 mg dosed
   monthly". Its 36-day release window (`zo_dur_hr` 864, verbatim) sat beside a
   10–30 mg dose block belonging to the immediate-release agitation injection. The
   route is removed; lauroxil deserves its own record.
2. **glecaprevir — 20× exposure error.** An unsourced `F 0.05` beside a volume that
   can only be apparent, so F discounted twice.
3. **asenapine TD — 2.6× under-delivery on the marketed patch.** The *sublingual*
   bioavailability copied onto the transdermal row, where the source reports only
   relative bioavailability.
4. **doxepin — 3× under-prediction.** An apparent V/F of 22.7 L/kg paired with the
   independent F 0.29 that a different study measured.

### Digit collisions — three new shapes

- **An absorption LAG TIME stored as an absorption RATE.** chlorpheniramine `ka 0.7`:
  "Mean absorption lag time was 0.7 h (0.4-1.3 h), and mean peak time was 2.8 h".
- **A urinary excretion fraction stored as bioavailability.** varenicline `F 0.9` from
  "approximately 90% of the drug is excreted in the urine unchanged"; fenofibrate
  `F 0.60` from "59% in the urine"; sertraline `F 0.44` from "metabolites of
  paroxetine (36%) and sertraline (44%) are excreted in **faeces**".
- **A free fraction stored as bioavailability, with the donor in the same record.**
  tamsulosin `F 0.9` ↔ PMID:10492056, already in its own `refs[]`: "The mean percentage
  of unbound 14C-tamsulosin was 0.90% in the healthy subjects."

Also recurring: telmisartan's `t½ 24` is its **dosing interval** (the abstract carries
both "> 20 h" and "the full 24-h dosing interval"); eplerenone's `ka 1.7` is a **Cmax**,
"a mean EP Cmax of 1.72 mug/ml"; pindolol's `t½ 4` belongs to **mepindolol and
bopindolol**, different drugs in the same class, while its own citation's control ke
implies 1.24 h.

### Defects in OUR OWN prose, not in the data

Four this batch, which is the highest yet:

- **sertraline** — the keo note reads "sertraline 69–78% at 4 h"; the cited PET study
  says "**Escitalopram and sertraline** showed high occupancies of 69.1-77.9% at 4h".
  A combined two-drug range attributed to one drug.
- **pindolol** — the `fu_note` asserted its 71.4% figure came from "the only abstract
  that names a number". **False.** PMID:427002 also names one and disagrees: "Plasma
  protein binding was 38% and was independent of plasma concentration". Three
  independent lines now sit under 50% (38%, the label's 40%, 26–31%) against one
  outlier at 71.4%, so the stored `fraction_unbound` 0.6 is correct and now has direct
  support instead of resting on a judgement against the literature.
- **naproxen** — the warfarin interaction note credits PMID:2724076 to "Chan 1989"; the
  paper is Diana, Veronich & Kapoor. The quoted figures are verbatim and correct.
- **doxepin** — the record claimed desmethyldoxepin's free fraction is twice the
  parent's. Refuted: 21.4% vs 20.4% unbound, and 76.0% vs 75.5% bound. It also called
  doxepin a racemate; it is a mixture of **geometric** isomers, "Z:E = 15:85".

### An occupancy row cited to a PMID with no abstract

`hydroxyzine` H1 (Ki 1.99 nM) cited **PMID:12755407**, which PubMed returns with title,
authors and journal and **no abstract text whatsoever**. The row's own note admitted
the reasoning — hydroxyzine is "a UCB compound ... and a canonical member of such a
panel" — which is inference from plausibility. **This file already recorded at line 205
that no abstract names a hydroxyzine H1 Ki.** The gap log was right and the record was
wrong; the row is deleted.

Related and still open: `chlorpheniramine`'s H1 row cites PMID:11809864, which names
only cetirizine, levocetirizine and (S)-cetirizine. Two agents flagged it independently.

### New `pk_unauthored` reason: `label-only`

Added for `desvenlafaxine`, and the agent that found it argued the vocabulary point
better than the prompt did. Desvenlafaxine is **not** uncharacterized — its PK is
thoroughly characterised in its label and registration dossier. What is missing is
**indexing**: every candidate abstract reports ratios, percentage changes or subgroup
contrasts and no absolute parameter. Tagging it `uncharacterized` would tell a future
reader something false about the drug.

Records with the same shape whose numbers were **kept** because they validate against
a published exposure, rather than stripped: anastrozole (unsourceable V and F, but
{140, 0.85, 50} imply CL/F 2.283 L/h against an observed 2.257 — a 1.2% match),
apremilast (10.33 vs 10.15 L/h — 1.7%), baricitinib (kept, but it is the 3× case above).

### Strips

- **carbamazepine → `uncharacterized`.** Three independent disqualifiers, any one
  sufficient. **Autoinduction**, measured in the same subjects with deuterium-labelled
  drug: "After 17 to 32 days of treatment, the plasma clearance of CBZ-D4 was doubled";
  "During multiple dosing, the half-life is decreased to 10-20 hours" from ~35. An
  **active metabolite**: the 10,11-epoxide has "anticonvulsant activity comparable with
  that of the parent drug" at "between 5 and 81%" of parent concentration. And a
  **formulation-dominated F** spanning ~25% (tablets) to essentially complete
  (solution). **The record already contradicted itself** — its `mechanism` string says
  the drug's own elimination rate "rises 2-3× by week 4" while `half_life_hr` stored the
  treatment-naive 33 h. Its three interaction references are untouched.
- **abiraterone → `uncharacterized`.** Its citation characterises the **prodrug its own
  abstract calls undetectable**. `F 0.1` is an inequality bound ("poor oral
  bioavailability (<10%)"), with a second candidate in the same cited abstract — an
  assay limit, "0.1 ng/ml for abiraterone". A scalar F is indefensible regardless:
  fed/fasted AUC is "351.64%" and Cmax "478.45%". Absorption is not first-order at all,
  needing "an Erlang-type absorption model ... with three-transit compartments".
  **My prior that its `mw_g_mol` was the ester's was WRONG** — 349.51 is the free base,
  the circulating species, and is untouched.
- **desvenlafaxine → `label-only`**, above.

### Priors of mine that agents refuted

Recorded because the count keeps rising and each one is a lesson about the prompt:

- **No published antipsychotic keo** — false for aripiprazole (above).
- **aripiprazole/brexpiprazole cross-drug transplant** — none; all five fields differ.
- **venlafaxine/desvenlafaxine transplant** — none; checked field by field from both
  sides by two different agents.
- **clomipramine PK is the metabolite's** — no, it is the parent; the metabolite trap
  is real but confined to `fu`, where the note already documents it.
- **hydroxyzine's values are cetirizine's** — no; cetirizine's V is two orders of
  magnitude smaller.
- **vortioxetine's half-life is ~66 h** — 66 h is the *review* value; the record stores
  57 and its citation says 57 verbatim. No change needed.
- **isradipine will show the nifedipine sustained-release defect** — its cited study
  used oral solution and capsules only. (The *other* half of the prior held: the stored
  8 h was an oral absorption artefact, proven by a paper titled "half-life shorter than
  expected?".)
- **nimodipine will show it too** — no; the record correctly took the immediate-release
  arm and left the modified-release "17.8 h" alone.
- **glecaprevir is never given alone / elvitegravir-shaped boosting** — refuted: it was
  studied alone, and the boosting is **one-directional** ("Glecaprevir C max and AUC
  values during coadministration were less than 1.5-fold of the values when glecaprevir
  was administered alone"). My food-effect claim was also refuted: "Food had a minimal
  effect on ABT-493 exposures."
- **cyclobenzaprine t½ ~18 h** — unsourceable; two primaries on two formulations agree
  near 32 h. And a scalar F **is** defensible, because 0.33 is a single IV-referenced
  absolute measurement; the record's error was taking the wrong end of a secondary range.
- **baricitinib's plasma-vs-serum trap will recur** — it did not.
- **febuxostat's literature is thin** — only for F; CL/F, Vss/F, ka and both half-lives
  are all indexed.
- **chlorpheniramine will have to be skipped** — no; Huang 1982 is a proper adult
  IV+oral study, fully indexed, and was simply never cited.
- **varenicline is probably correct** — its half-life is; its F is a urinary fraction.
- **telmisartan F is 42% at 40 mg rising to 58% at 160 mg** — unsourceable from any
  abstract, and deliberately not stored.

### Near-misses recorded so nobody "corrects" them

- **tamsulosin `V_L` 16 L** looks exactly like a Cmax collision — another paper in its
  own `refs[]` reports "peak plasma levels of 16 ng ml(-1)" — but the volume is
  independently verbatim as "16 +/- 4 L in the steady state". Coincidence.
- **ketoprofen `V_L` 15 L** is a back-derivation, but from **intravenous** data
  (CL 5.10 L/h ÷ the rate implied by its own 2.05 h half-life = 15.08), so class 6 does
  **not** apply and the magnitude is right. The agent nearly flagged it wrongly.
- **aripiprazole `V_L` 343 L** is the label's 4.9 L/kg, which is an IV steady-state
  figure, so the pairing with an independent F is correct. Adopting the one published
  *apparent* alternative (192 L) would have **created** a class-6 defect.
- **pindolol `V_L` 213 L** is IV-derived (3.05 L/kg); class 8 is excluded outright by
  "the drug was not concentrated in the red cell".
- **naproxen and ketoprofen COX rows** are genuine human whole-blood assays and the
  `whole_blood_ic50` exemption is justified. Ketoprofen's were re-read from the source
  table directly and both conversions check exactly.

### Live traps for future batches

- **PMID:3105569** offers a clean human 60 L volume and an 88.6% bioavailability — for
  **glyceryl-1-mononitrate**, a metabolite, not nitroglycerin.
- **PMID:7698101** reports an "apparent volume of distribution: 1.08 +/- 0.37 l/kg"
  that scales to ≈77 L, matching lamotrigine's real V/F of 77.4 L — but its analyte is
  **carbamazepine-10,11-epoxide**.
- **PMID:29137842**'s bioavailability figures of 34.9% and 18.4% belong to **cetrozole
  and TMD-322**, not to anastrozole.
- **PMID:31794668**'s "volume of distribution" is **1421 µL in a rabbit anterior
  chamber** — six orders of magnitude from a betaxolol systemic volume.
- **PMID:8218966**'s "F(rel) 0.95" is **tenoxicam**, intramuscular versus oral, and sits
  next to piroxicam's unsourced 0.95.
- **PMID:35630561**'s "73%" for apremilast and **PMID:34429601**'s "15%" for candesartan
  are label figures restated in the introductions of **rat formulation studies**. Citing
  either would launder a label value through a rodent paper.

### Spillover outside the forty

- **pibrentasvir** carries `source_pmid: PMID:28688001` for its ka, V, F and half-life;
  that abstract states none of the four. Its half-life is available verbatim as 25 h
  from PMID:37661787. (Already selected for batch 8.)
- **imipramine** stores `ka_hr 1.5`, byte-identical to desipramine's — a tricyclic class
  default propagated across records — and its `F 0.4` traces to "absolute bioavailability
  was 40.2% in the control state".
- **quetiapine**'s 5-HT2A and H1 occupancy notes **self-declare** a "pKi range ...
  midpoint", which is class 4 on its face. Queued.

### Still open after this batch

- **candesartan's 6–8× exposure error** — no verbatim V or F exists that closes it.
- **baricitinib's 3× exposure error** — nothing about this drug is sourceable from any
  abstract; four separate searches return COUNT 0.
- **asenapine `V_L` 1500 L** — `asenapine volume of distribution` returns **zero**
  PubMed records. Retained as label-grade.
- **fluvoxamine `V_L` 1750 L** and **naproxen `V_L` 12 L** — no verbatim human volume in
  litres exists for either. The nearest naproxen statement is a class-wide inequality,
  "Volume of distribution is mostly low (less than 0.2 L/kg)".
- **PMID:7433566** (Evans 1980, oral vs parenteral clomipramine) would settle
  clomipramine's absolute F. **It has no abstract.**

### Proposed batch V1 — make class 6 machine-checkable

Class 6 has now caused reversals in four separate batches, always for the same reason:
**whether a volume is apparent (`V/F`) or true (IV-derived) cannot be recovered from the
record's shape**, only from the citation's wording. This batch alone acquitted four
suspected pairings (aripiprazole, tamsulosin, pindolol, ketoprofen) and confirmed four
(desipramine, eplerenone, piroxicam, febuxostat).

A boolean on `RoutePk` — `v_apparent` — would end the guesswork and make an
**implied-clearance lint rule** possible: with a declared *true* volume, `V·ln2/t½` is
a real clearance and cannot exceed organ blood flow. Prototyped
(`/tmp/claude-1000/cl-screen.mjs`); it currently cannot be shipped because three of its
five hits are the deliberate "pin F to 1 beside an apparent volume" convention, which
is recorded only in prose. Backfilling the field across ~633 routes is batch-sized and
is **not** done here.

## Pharmacological category, batch 8 (2026-09-07) — 40 compounds, eight agents

**The class-12 arithmetic test, introduced in batch 7, was run FIRST on all forty
records this time — before any citation was read — and it changed what the batch
found.** It fired on fourteen records and cleanly acquitted six. The acquittals are
worth as much as the hits: prazosin **1.01×**, ruxolitinib 1.1%, ibrutinib 1.7%,
desloratadine 2.2%, ethambutol 2.6%, daclatasvir 0.7%.

### The largest errors, all found by arithmetic before any reading

| record | error | cause |
|---|---|---|
| dasatinib | **18.5×** | `F 0.14` beside a volume back-solved *from* the label's own CL/F |
| loratadine | **12.4×** | `V_L 119`, byte-identical to canagliflozin's, where it is genuinely IV-derived |
| linagliptin | **10.4×** | **no `V_L` at all** — silently rendering at the 35 L solver default |
| hydroxychloroquine | **9.06×** | a *plasma* volume welded to a *blood*-derived F |
| bupropion | 6.5–8.4× | class-1 citation, three unsourced fields |
| terbinafine | 3.75× | V/F double division; no human IV formulation exists |
| losartan | 3.26× | a bi-exponential volume paired with that fit's terminal half-life |
| trastuzumab | 3.14× | same shape, on an antibody |
| baloxavir | 2.7× | prodrug mass + apparent volume beside a conversion-efficiency "F" |
| tadalafil | 2.52× | a volume its own abstract calls `Vz/F`, stored beside `F 0.4` |
| mirabegron | 2.46× | an IV Vss paired with that study's terminal half-life |
| nirmatrelvir | 2.2× | a labelled `Vz/F` stored beside `F 0.5` |
| olmesartan | 1.91× | two-compartment volume, against a CL/F **verbatim in its own abstract** |
| efavirenz | 1.59× | its own citation gave ka 0.3 and V 252; the record stored 0.5 and 390 |

### "Fixing F alone makes it worse" — the batch-7 warning, earned four times

- **mirabegron** — raising F 0.29 → 0.35 (the figure I asked the agent to look for)
  multiplies exposure by a further 1.21, turning 2.46× into **3.0×**.
- **efavirenz** — V 252 with F 1.0 gives CL/F 4.16 L/h: the error **flips** from
  1.59× under to **2.26× over**.
- **rimegepant** — pinning F to 1, the apparent class-6 fix, moves a **+3.9%**
  record to **+62%**.
- **misoprostol** — F = 1 alone still leaves implied clearance above the published
  confidence interval; V and F had to move together.

**One record went the other way, and the direction was checked before acting:**
saxagliptin's F 0.67 → 0.50 moves exposure from 23% high to 8% low, so its volume
was deliberately left alone.

### Two records whose defects CANCEL — neither was touched

- **ibrutinib.** `V_L 122` is an apparent volume multiplied by F and relabelled a
  "true Vd" in its own `source_label`; the solver then divides by F again,
  restoring it. Note that 4200 × 0.029 = 121.8. It is self-cancelling, its AUC
  lands within **1.7%** of the label, and **replacing it with the label's real
  683 L introduces a 5.6× error.** Two further errors also cancel: the stored F is
  the *fasted* figure while the AUC it reproduces is from patients dosing with
  food. Only the prose was rewritten.
- **rimegepant.** A computed volume (Vc/F + Vp/F) and an uncited label F, against a
  dose- *and formulation*-matched published AUC: **+3.9%**. Both "fixes" make it
  worse (above). No numbers changed.

### Class 14 — a per-kilogram dose stored as a flat dose

`trastuzumab.doses.IV` was `{min 4, max 8, typical 6, unit: 'mg'}`. Those are
**mg/kg** — its own citation says *"a 4 mg/kg loading dose of trastuzumab followed
by 2 mg/kg weekly"*. At the 70 kg reference the typical dose is 420 mg, not 6:
**a seventyfold under-dose**, which dwarfs the 3.14× clearance error on the same
record.

All 18 biologics were swept. Every other one carries genuinely flat mg doses in the
tens-to-hundreds. **Still open:** `infliximab` has the identical defect
(`3-10, typical 5.33`) and `rituximab`'s `375-500` is **mg/m²**; neither is fixed
here for want of a verbatim source. **There is no `mg/kg` or `mg/m²` in the
`DoseUnit` enum** (`'mg' | 'g' | 'mcg' | 'IU'`), which is why the defect is
unrepresentable rather than merely unnoticed. `trastuzumab` also declared an SC
route with no dose block; `rituximab` still does.

### The silent-default debt — found by an agent, verified wider, now linted

`resolvePk` (`packages/solver/src/pk.ts:362`) substitutes `0.5 * weight_kg` (35 L)
for a missing `V_L`, `0.9` for a missing `F` and `1.0` for a missing `ka`. None is
visible in the data. Measured across the catalog:

- **161 of 793 route rows carry no `V_L`**, across 136 compounds
- **all 161 carry a `source_pmid` or `source_label`** — every one claiming
  provenance for a number its citation never stated
- 76 extravascular rows default F to 0.9; **347 default `ka` to 1.0**, which is why
  `ka 1` appears on 34 unrelated compounds

`data-lint.ts:430` already carried a comment describing this exact hazard with no
rule behind it. This batch adds **`pk.defaulted-volume`** (per-compound, scoped to
the 29 records where an occupancy curve consumes the concentration) and
**`pk.defaulted-params`** (catalog totals). Lint: 78 → 121 warnings, 0 errors.

### Shared-value contamination is larger than the template-quartet rule sees

Screening single fields rather than quartets:

- **`ka 1.5` sits on 25 records** — 5-htp, allopurinol, glycine, lsd, warfarin,
  theophylline… It is the tricyclic default whose desipramine half was deleted in
  batch 7; imipramine's, the surviving half, is deleted here.
- `ka 1` on 34 records, `ka 0.5` on 30. **172 records share a `ka` with ≥5 others.**
- `V_L 35` on 23 compounds, `V_L 28` on 15. **224 records share a `V_L` with ≥2
  others.** Confirmed contaminated pairs this batch: `V_L 119` (loratadine +
  canagliflozin), `V_L 1750` (bupropion + fluvoxamine), `V_L 1100` (imipramine +
  clomipramine + escitalopram), `F 0.06` (bupropion + four drugs where 6% is real).

Logged as a batch of its own; not fixed here.

### The AUC/Cmax floor — a limit, not a defect

In this solver `AUC/Cmax ≥ 1/ke` even with instantaneous absorption. Four records
in one group have **published** AUC/Cmax ratios *below* that floor — loratadine
3.1×, desloratadine 2.7×, imipramine 1.4×, bupropion 3.0× — and their sources say
why: *"fitted to a biexponential equation"*, *"a two-compartment model…"*,
*"demonstrates biphasic elimination"*. **No `{V, F, ka, t½}` can honour both AUC and
Cmax for these drugs.** Every fix in this batch honours AUC/clearance, which is what
the arithmetic test measures, and states the Cmax cost. Same shape, separately, on
grazoprevir (2.3× peak shortfall, structurally unfixable), etoricoxib (3.3×),
exemestane, terbinafine (8.3× before any parameter choice) and baloxavir.

### What a `keo` can and cannot represent — a principle, applied five times

A `keo` is a **linear filter on the plasma curve**, so effect must return to
baseline as plasma clears. It therefore cannot represent effect governed by target
turnover. Applied across the batch:

- **rasagiline** (irreversible MAO-B), **ibrutinib/acalabrutinib** (covalent BTK),
  **exemestane** (steroidal inactivator), **methimazole** (intrathyroidal
  residence) — all five have **no** `effect_compartment` and no occupancy row, and
  **that absence is correct**. It is now recorded as deliberate so nobody
  "completes" these records. PET confirms the mechanism for rasagiline: *"Gradual
  recovery toward the baseline state was observed in the weeks after termination of
  treatment … confirming the irreversible binding."*
- **saxagliptin and linagliptin** both carried a `keo` whose note justified it *by
  target residence time* — the exact thing a keo cannot model. linagliptin's quoted
  off-rate is a 6.4 h dissociation half-life against a stored 42-minute delay. Both
  demoted to declared placeholders (not deleted — both carry occupancy rows).
- **ticagrelor is the legitimate case**, and its own literature says so: a
  **reversible** P2Y12 antagonist whose inhibition is *"gradually decreasing with
  declining plasma concentration … indicating that the IPA is reversible."*
- **warfarin** has no keo, correctly — its PD is clotting-factor turnover. If one is
  ever added it must be **~0.04/h**, twenty-five times smaller than the 0.5–1/h that
  all four sibling records in its group carry.

### Mass defects — the fourth, fifth and sixth instances

After fenofibrate (13.2%) in batch 7: **eslicarbazepine 16.5%** (the stored mass was
the *acetate prodrug*; proof: *"Plasma BIA 2-093 concentrations were generally below
the limit of quantification"*), **baloxavir 18.2%** (marboxil prodrug), **misoprostol
3.8%** (methyl ester). All three now declare `pk_analyte`. Only misoprostol had an
occupancy row inheriting the error; it is corrected.

**But misoprostol's occupancy row has three larger problems left open**, any one
bigger than the mass error: the source figure is a **binding Ki stored as a
functional EC50** with no Cheng–Prusoff correction, the assay is **hamster uterus**,
and the abstract names its ligand only as "misoprostol" — so if that is the *ester*,
the affinity does not describe the circulating acid at all and the row is incoherent
whichever mass is used. Needs full text.

### Defects in OUR OWN prose

- **desloratadine** — the `effect_compartment` note describes a "2–6 h window" that
  is **fexofenadine's**; the cited study is a fexofenadine-vs-desloratadine
  comparison and desloratadine's own verbatim onset there is 5 hours. The stored
  keo is right (simulated peak 8.2 h, inside the verbatim *"from 6 to 10 hours"*).
- **losartan** — a **rat** onset presented as human (*"In renal hypertensive rats…"*),
  and muddled `fu_note` arithmetic (the "sevenfold" comparator is the naive-donor
  0.2%, not the 0.4–0.5% dosed-volunteer values, which are ~3× lower).
- **prazosin** — the occupancy note credits "Ford 1998" for a paper by Fukasawa et
  al. The record nonetheless **avoided a tenfold collision in the same sentence**,
  taking the human prostate Ki (0.25 nM) over the urethra value (2.5 nM).
- **daclatasvir** — its mechanism string attributes a Cmax and AUC to the FDA label;
  those are EMA SmPC figures, and the FDA label states no Cmax at all.
- **ibrutinib** — the `source_label` asserted a "true Vd ~122 L" its own label
  refutes twice over.
- **etoricoxib** — the `effect_compartment` note claims an oral Tmax of ~1 h against
  an observed 2.6–3.3 h.

### Priors of mine refuted this batch (running total now 32)

prazosin ("likely a Tmax-as-half-life collision" — it is a correct terminal-volume
collapse verified to 1%) · tadalafil ("simple and correct" — it held its group's
largest error) · terbinafine (tissue/plasma half-life conflation — the record stores
the exposure-determining phase, and the deep phase *"contributed so little to the
total exposure"*) · pentoxifylline (ER-under-IR — ER is the **only** marketed oral
form, so there is no IR label to mismatch) · efavirenz (autoinduction like
carbamazepine — the label says accumulation is only *"22-42% lower"* than predicted,
against carbamazepine's 2–3×; **it must not be stripped**) · linagliptin (effective
half-life stored as elimination — here the effective value is the **correct** choice,
and storing the 126 h terminal one would make exposure 10.5× high) · trastuzumab
(three at once: class 6 acquitted, no flip-flop — absorption is 11× *faster* than
elimination — and it is not a residue of the "V 7 L biologic default") ·
hydroxychloroquine (**the 40,000–50,000 L figure I supplied is the PLASMA number**;
adopting it would have preserved the class-8 error) · warfarin (cross-enantiomer
mean — it is the label's racemic value; but the substance is worse: S-warfarin's
25 h half-life means the model over-persists the enantiomer doing 3–5× of the
anticoagulation) · methimazole (carbimazole-derived values — its citation dosed
methimazole directly by both routes) · loratadine/desloratadine and
imipramine/desipramine transplants (**both negative** — four marketed
parent/metabolite pairs now checked, all clean) · glecaprevir/pibrentasvir boosting
and food effect (one-directional; *"Food had minimal effect (<14%)"* on pibrentasvir
alone, though the coformulated tablet does show one — the two must not be collapsed).

### Near-misses recorded so nobody "corrects" them

- **daclatasvir** — the label's IV-microdose Vss of 47 L is the most citable-looking
  number in the record and the **wrong** one to store; it makes exposure worse. The
  label's own Vss and CL are mutually inconsistent under one compartment (they imply
  a 7.8 h half-life against its stated 12–15). **Class 12 in the source.**
- **elbasvir / grazoprevir** — the label *does* publish apparent volumes (680 L,
  1250 L) and neither is stored; the back-solved values reproduce label exposure to
  0.2% and 0.8%, where the published ones overshoot by 33% and 50%.
- **ethambutol** — `V_L 147` is deliberately *not* the published Vss (3.89 L/kg),
  which would overstate clearance 1.7×. Whoever authored it got the one-compartment
  collapse right before the class had a name.
- **ruxolitinib** — a population paper reports a *"median weight of 72.9 kg"* beside
  this record's `V_L 72`; checked, and the label figure is independent.
- **methimazole** — the 2× clearance miss is acquitted: the comparator review
  contradicts itself, and the likely cause is an apparent clearance from
  **carbimazole** dosing.
- **pentoxifylline** — implied absolute clearance exceeds hepatic blood flow, which
  its own literature explains: *"suggesting an extrahepatic metabolism."*

### Rejected with prejudice

- **PMID:31712201** (ethambutol) — *"oral clearance and volume of distribution were
  77.4 liters/h and 76.2 liters"*, which imply a 0.68 h half-life against every
  published value. It is the central compartment of a four-transit model.
  **Transplanting it would manufacture a textbook class-12 defect.**
- **PMID:21404279** (exemestane) and **PMID:35630561** (apremilast) and
  **PMID:34429601** (candesartan) — label figures restated in the introductions of
  **rat formulation studies**. Citing any would launder a label value through a
  rodent paper.
- **PMID:19118133** (nadolol) — an *ex vivo perfused human jejunum* absorption rate,
  not an in-vivo ka.

### Still open after this batch

- **infliximab** and **rituximab** dose units (above); no `mg/kg` in the enum.
- **trastuzumab** cannot be represented at all — both human popPK models are
  two-compartment with *"parallel linear and nonlinear elimination"*, i.e.
  target-mediated disposition. **The `pk_unauthored` vocabulary has no reason code
  for that shape**, so a clean strip is not currently expressible.
- **candesartan's 6–8× and baricitinib's 3× exposure errors** from batch 7 remain
  unclosed; no verbatim values exist that resolve either.
- **warfarin** has an empty `receptor_occupancy` while a directly storable EC50 sits
  in a PMID it already cites: *"Prothrombin complex synthesis is inhibited 50% at a
  warfarin concentration of about 1.5 mg/L."* Not added here because the receptor
  vocabulary has no obvious key for a synthesis-inhibition endpoint.
- **nadolol is not superposable** — *"The mean ratio of AUCss/AUCsd was 2.54 … the
  principle of superposition is not applicable for nadolol"* — and this solver does
  multi-dose **by superposition**, so it understates steady state ~2.5× for that
  drug regardless of parameters. A solver limitation, not a data defect.
- **149 of 773 pk rows have a `source_pmid` absent from their own `refs[]`.**
  Convention gap, needs a sweep.
- **`pibrentasvir`** now carries the co-formulated state explicitly; the monotherapy
  state (3–7× lower exposure) remains unrepresentable.

## Pharmacological category, batch 9 (2026-09-07) — 40 compounds, eight agents, plus a script audit

### A second, stronger arithmetic test: the Cmax/AUC identity

At the peak, `ka·e^(−ka·tmax) = ke·e^(−ke·tmax)`, and the absorption terms cancel:

> **Cmax/AUC = ke · e^(−ke·tmax)** — independent of `ka`, `V` and `F`

Verified numerically to 1e-12. So **any published {Cmax, AUC, Tmax, t½} quartet either fits
this model or cannot be fitted by any parameter choice.** That is strictly stronger than the
class-12 clearance test, where one bad number can always be traded against another. The only
escape is `lag_hr`. Corollary floor: `AUC/Cmax ≥ 1/ke`.

Records found **below the floor**, i.e. unrepresentable here at any `{ka, V, F}`:

| record | published AUC/Cmax | floor at stored t½ | |
|---|---|---|---|
| mesalamine | 0.283 h⁻¹ observed | model ceiling 0.042 | **6.8× outside** |
| dapagliflozin | 3.97 h | 18.6 h | 4.7× below |
| trimetazidine | 4.695 / 4.510 h | 4.977 / 5.324 h | both arms below |
| sumatriptan-succinate | 1.427 h | 2.885 h (at corrected t½) | 2.02× below |
| ketoconazole (tablet) | 3.083 h | 4.621 h | 1.50× below |
| rabeprazole | — | **no ka reaches its published Cmax** | fix is a 2.6 h lag |

Where a record could be fixed, the note now says **which of Cmax and AUC the fix preserves**,
because they cannot both be kept.

### The wave-25 `ka`-from-Tmax script: its central claim is false for 28 of 44

`2026-05-26-wave25-ka-from-tmax.ts` derived `ka` for 44 drugs by inverting
`Tmax = ln(ka/ke)/(ka−ke)`, with a header claiming *"Each Tmax is verbatim from a primary human
oral PK study."* All 44 were fetched and checked:

- **16 pass**
- **14 fail as the arithmetic midpoint of a stated range** (apixaban, clonidine, cyclosporine,
  dapagliflozin, dipyridamole, edoxaban, isotretinoin, lurasidone, mixed-amphetamine-salts,
  oxiracetam, pramiracetam, quetiapine, ramelteon, venlafaxine)
- **5 are numbers appearing nowhere** (empagliflozin, pitavastatin, selegiline, suvorexant,
  tacrolimus)
- **7 cite an abstract with no Tmax at all** (dutasteride, fenofibrate, lisdexamfetamine, mdma,
  piracetam, tamoxifen, viloxazine)
- **2 take another drug's arm or a renal-failure population** (dextroamphetamine, guanfacine)

**And the header's own hedge is 25% accurate.** It names four entries as re-confirmed by
spot-check — piracetam, apixaban, rosuvastatin, tamoxifen. Only **rosuvastatin** holds;
piracetam's and tamoxifen's abstracts contain no Tmax whatsoever, and apixaban's is a midpoint.
The header also promised per-row author/year comments; the table has none.

**The audit corrected two entries I had recorded as confirmed** in earlier batches: `lurasidone`
2.0 h is the midpoint of *"within 1.0-3.0 h"*, and `fluvastatin` 1.0 h passes only as a unit
conversion (its source says *"60.0 +/-30.0 minutes"*).

**Live blast radius, reconciled against the registry rather than the script:** 26 of the 44
still carry the script's `ka` unchanged, 16 carry none (removed by later audits), 2 have drifted.
**Fifteen failing entries were still live.** They are **disclosed, not deleted** — a midpoint of
a narrow range is usually inside the true spread, and deleting would fall back on the solver's
`ka` default of 1.0, which is worse for most. The script header is **retracted in place**.

Numerically wrong rather than merely unsourced, and worth chasing: fenofibrate (2.5 h vs a real
6–8), empagliflozin (1.5 vs a measured 2.72), lisdexamfetamine (4.6 vs a measured median 3.00),
tacrolimus (pulled from a 0.5–6 h review range), piracetam.

### The largest errors

| record | error | cause |
|---|---|---|
| cefdinir | **24.5×** | `V/F` double division; **no IV formulation exists**, so F cannot have been measured |
| dapoxetine | **6.45×** | class 6 (2.38×) **times** class 12 (2.71×) — decomposes exactly |
| mesalamine | 6.8× | shape, not numbers — see the floor above |
| cariprazine | **~30×** | no `V_L` at all; PET pins it |
| insulin | 3.09× | its own paper says 15.6 L; the record stored 4.9 |
| emtricitabine | 2.55× | a half-life that is neither of its two published phases |
| trimetazidine | 2.60× | an MR citation on an IR record |
| lamivudine | 2.26× | a Vss on a terminal half-life |
| bicalutamide | 2.20× | every value absent from a citation carrying four good ones |

**Dapoxetine is the cleanest diagnostic the audit has produced.** Removing the double-F division
accounts for 2.38×, replacing the α half-life with an effective one accounts for 2.71×, and
their product is the entire error. The record's own `mechanism` prose already said *"~90 min
initial; ~19 h terminal"* — the author knew it was biphasic and stored the distribution phase.

**Cariprazine is pinned by a human measurement.** With no `V_L`, the solver's 35 L default drove
modelled D2 occupancy to **98.7%** against its own citation's verbatim *"Doses ≥ 1.5 mg/d
yielded 69 - 75% D2/D3 receptor occupancy as measured in positron emission tomography scans."*
Back-solving from the PET anchor gives ~1000 L. This is backlog §12's saturation problem with an
independent measurement fixing the magnitude — and it was the **volume**, not the affinity: the
same anchor *acquits* the stored D2 ec50, which requires a steady-state concentration in exactly
the real therapeutic range.

### Six strips, each a different kind of "no"

- **navitoclax → `research-only`.** The whole block is constructed, and the arithmetic
  reproduces: fixing `ka` 0.2 and forcing Tmax to exactly 11.000 h back-solves t½ = 22.1791,
  which rounds to the stored **22.2 at full precision**. Its citation contains not one numeric PK
  parameter. Never approved, development discontinued — so no label to fall back on, and this is
  *not* the `label-only` shape.
- **linaclotide → `local-acting`.** Its label names this record's **exact dose triple** as below
  the limit of quantitation. The stored curve peaks ~20× below any published assay LOQ, for a
  quantity never measured in a human. `F 0.001` is also a **rat** number.
- **mesalamine → `local-acting`.** Shape, not numbers (above). A single scalar F is also
  indefensible across the delivery systems its dose range spans — two pH-dependent tablets differ
  **8.5× per mg**. And its stored `F 0.25` is the *sulfasalazine* citation's *"at least 25% is
  absorbed"*, an inequality about colonic 5-ASA after azo-cleavage.
- **hormonal-contraceptives → `mixture`.** Five routes with a completely empty `doses` block, no
  `mw_g_mol`, and both components already separate better-sourced records. Its `V_L 350` is not
  the progestin transplant I hypothesised but a **house filler shared by five unrelated
  compounds** — arguably worse.
- **insulin → `mixture`.** Six non-interchangeable molecules under one slug, dosed in **IU** with
  no conversion field; its own aliases name two analogues whose half-lives are 12 h and >25 h
  against a stored SC 1 h. Its SC "half-life" is the only "1 hour" in its citation — a **Tmax**.
- **dicyclomine → `label-only`.** The insert itself disowns the one half-life it quantifies
  (*"measured for 9 hours … showing a secondary phase of elimination with a somewhat longer
  half-life"*), and the stored `F 0.67` is **absent from every FDA label fetched** — the insert
  says IM is *"about twice as bioavailable"*, a relative 2:1.

### Records verified — and three where the "fix" would make it worse

- **letrozole verified to 0.3%.** Every value came from a paper never cited; the stored triple
  asserts a clearance of 2.2171 L/h against that paper's verbatim IV **2.21**. Only the citation
  moved. A coincidence is recorded so it is not "discovered" later: the numeral 42 also appears
  in this literature as *"increased significantly by 42%"*.
- **fluvastatin — every value unsourced, exposure right to 1.0–1.3×.** Saturable first-pass means
  a low clearance is cancelling a low F; **correcting either in isolation breaks it.**
- **lopinavir verified to 6%** — and the better-provenanced replacement, from *the same sixteen
  volunteers*, fits **worse** (1.34× low vs 1.06× high).
- **rabeprazole's clearance is right to 0.3%** and must not be moved on a failed verbatim check.
- **ethanol verified** — my model-class prior was refuted: it stores no half-life at all and uses
  the solver's Michaelis–Menten parameters correctly, both constants verbatim, corroborated to
  0.9% and 2.6% by an independent IV cohort.
- **cefepime — both triage flags are false positives.** Its flagged `ka` sits on IM, a real
  route; and identical IV/IM half-lives are *physiologically required* at F = 100%.

### Priors of mine refuted this batch (running total now 45)

aspirin needs Michaelis–Menten (**no** — the saturation is salicylate's, which the record does
not model) · aspirin's keo (**it has none, correctly**) · ethanol stores a first-order half-life
(**it does not**) · dapagliflozin/empagliflozin transplant (**the theft ran the other way and was
already fixed**) · bicalutamide's half-life is an enantiomer blend (**past day 1 the racemate
curve *is* the R curve**) · cariprazine's ec50 uses the wrong mass (**it is the free base; the
volume was the error**) · imatinib's volume may be true (**half right — it is apparent, but at
F 0.98 the two are indistinguishable**) · tamoxifen's mass/occupancy defect (**refuted by
absence — no occupancy row exists**) · pentoxifylline-style ER-under-IR on fluvastatin (**the
parameters are IR-shaped; the *dose block* mixes the two**) · zileuton ER-under-IR (**inverted —
the citation is IR and the dose block mixes an IR unit, a CR unit and a daily total**) ·
mesalamine's `ka` shares a value with vilazodone (**stale — vilazodone's was removed in batch 8**)
· sulfasalazine/mesalamine transplant (**runs the other way**) · atazanavir boosted/unboosted
differ several-fold (**1.8×**) · rifabutin is a carbamazepine (**its half-life is verbatim
*unchanged* on repeat dosing**) · cefdinir's `ka` is 0.8 (**it is 1.0**).

### Still open

- **aspirin's analyte scope.** At 500 mg the record's total exposure is **under 10%** of the
  salicylate exposure that produces the analgesia its 325–650 mg dose block is for. Salicylate
  *is* representable here (identity check passes, obs/model 0.875). Switching changes the
  record's identity and every downstream reference to it — a decision, not a patch.
- **`sumatriptan-succinate` should be merged into `sumatriptan`** behind retired-slug forwarding.
  The two carry SC rows that disagree (F 0.96 vs 0.97, t½ 2 vs 2.5) and the catalog's own
  authoring notes call it *"sumatriptan salt; alias"*.
- **`ketoconazole.interactions[]` has three defects** — a data region this audit has never
  touched. Two stored `ki_uM` values appear nowhere in their cited papers; two notes claim "the
  midpoint of the verbatim range" of 0.011–0.045 µM while storing 0.015 (the midpoint is 0.028);
  one stores an IC50 in a `ki_uM` field with no conversion. Verified to change nothing downstream
  — the interaction solver already pins `ke` at its floor — so the fix is provenance.
- **pitavastatin's 5.5–16× peak shortfall** is structural and unpatchable by a better scalar.
- **atazanavir's dose block spans a boosted and an unboosted regimen.**
- **255 compounds declare a route with no dose block**; ~68 are missing two or more.

## Pharmacological category, batch 10 (2026-09-08) — 40 compounds, eight agents

62 changes applied by `scripts/authoring/2026-09-08-pharmacological-batch10.ts`.
This batch completes the pharmacological sweep of records carrying PK.

### The three findings that generalise beyond this batch

**1. A whole data region acquitted by arithmetic — and its provenance still failed.**
249 records carry a `keo`; **53 claim a fitted one** (no `approximated` flag) and the
field had never been audited. I hypothesised a systematic factor-of-60 error, since
this literature reports keo **per minute** and the registry stores **per hour**.
**The hypothesis is refuted three times over** — twice by independent agents, once by
my own census. Every value checked is exactly 60× a published per-minute figure, and
converting all 53 to equilibration half-times gives a distribution **ordered correctly
by drug class**: alfentanil 0.6 min, propofol/sufentanil/fentanyl 5.6–6.8, vecuronium/
atracurium 9–12, morphine 168, digoxin 229. That ordering is not something a units bug
produces.

**But the units are the only thing that survives.** Of ten fitted keos audited here:

| record | verdict |
|---|---|
| atracurium, vecuronium, ropivacaine, ghb | verbatim, verified, **untouched** |
| remifentanil | fitted and verbatim, correctly labelled **dog** — human value is 1.9× faster |
| propofol | verbatim, but one parameter of a **two-compartment** effect model in 14 adolescents |
| sufentanil | **derived** from a narrative review's "equilibration half-lives of about 6 min" |
| alfentanil | fitted, but a 5-subject **comparator arm** with a 67 % relative SD |
| thiopental | its citation says the value was **"an ASSUMED … ke0 of 0.58"** |

The registry was citing, for thiopental, *the study that assumed the number* rather than
one that measured it. The measurement exists (PMID:6491902, arterial sampling, 1.2 min)
and lands within 0.4 %.

**2. `AUC/Cmax ≥ e·tmax` — the strongest feasibility bound yet, and it needs no half-life.**
`AUC/Cmax = e^(ke·tmax)/ke` is minimised over `ke` at `ke = 1/tmax`, giving

> **AUC/Cmax ≥ e · tmax**

from Cmax, AUC and Tmax **alone** — no half-life, no volume, no F, no ka. A published
triple violating it cannot be reproduced at *any* parameter choice, so unlike the
1/ke floor it cannot be argued away by proposing a different half-life. Verified
analytically and numerically. It settled **lovastatin's analyte choice**, which the
earlier pass could not test: the same 12 volunteers give both species, and the lactone
arm needs 4.62 h and observes 5.22 (representable) while the acid arm needs 11.14 and
observes 5.90 (**unfittable at any parameters**). The record is on the only species this
model can carry.

**3. Class 14 refined under challenge — the schema gap is real, and so is the defect.**
A g7 agent argued the per-kg finding may be **reading a schema gap as a data defect**:
`DoseUnit` is `'mg' | 'g' | 'mcg' | 'IU'` with no weight-based member and the solver
never weight-scales a dose, so flat mass at the 70 kg reference is the only
representable form. **I tested it and the distinction is clean:**

- **Stores the 70-kg equivalent — CORRECT:** vancomycin (1000 mg ≈ 15 mg/kg × 70).
- **Genuinely flat-dosed — CORRECT:** meropenem (the only per-kg literature is paediatric).
- **Stores the raw per-kg number — ~70× low:** 11 records.

**My prior was wrong on both correct records.** The eleven: propofol 2 (→140),
thiopental 4 (→280), etomidate 0.3 (→21), ketamine 1 (→70), atracurium 0.5 (→35),
vecuronium 0.1 (→7), rocuronium 1 (→70), succinylcholine 1.5 (→105), cyclosporine 6.67
(→467), ganciclovir 5 (→350), infliximab 5.33 (→373). Plus doxorubicin (mg/m², 1.73×)
and trastuzumab (fixed in batch 8). **Six fixed here** (the four anaesthetics/NMBs in
scope, sufentanil, alfentanil, plus doxorubicin); **five remain** — see the backlog.

### A reversal of one of my own earlier fixes

**fosinopril `V_L` 5.85 → 27.3.** Batch C2 (commit `10811f7`) replaced `V_L` 26 with the
verbatim 5.85 from *"a Vss of 5,850 ± 2,780 mL"*, its note calling 26 *"a 4.4-fold error,
with 26 appearing nowhere."* **The verbatim number is the wrong kind of volume.** That
abstract fits a multi-compartment IV profile; the one-compartment surrogate is Vz, not
Vss. The record has been **over-predicting exposure 5.8×** ever since, against that same
paper's own verbatim oral AUC — where the deleted 26 was 1.30×.

| V_L | implied CL | model AUC @ 10 mg | vs the paper's own oral AUC |
|---|---|---|---|
| **5.85 (stored since C2)** | 0.233 L/h | 9.44 | **5.77× high** |
| 26 (the value C2 deleted) | 1.036 | 2.12 | 1.30× |
| **27.3 (now stored)** | 1.088 | 2.02 | 1.24× |

Three independent routes converge on 20–27 L and the deleted value sat inside that band.
**Verbatim-ness is not sufficient: the quantity has to be the one the model consumes.**
Two further fosinopril findings are recorded and not acted on — the stored `F` 0.22 is a
**molar** figure while the solver multiplies dose by it as **mass** (the correct mass
factor is ~0.157), and the published triple fails `AUC/Cmax ≥ e·tmax` (8.92 vs 10.87 h),
whose only escape is an absorption lag, physically sensible for an ester.

### Interaction affinities: the second block audited, the second one defective

**gemfibrozil — all seven `ki_uM` deleted.** I verified the algebra myself: **five of six
are exactly `35/(R−1)`** for that entry's own AUC fold-ratio, to two decimals —
cerivastatin 7.62 = 35/4.59, montelukast 10.6 = 35/3.30, pioglitazone 15.9 = 35/2.20,
rosiglitazone 26.9 = 35/1.30, loperamide 29.2 = 35/1.20. **And the constant 35 is wrong
three ways:** (1) the note calls it the midpoint of a verbatim *"K(I) … of 20 to 52 µM"* —
**the midpoint is 36**; (2) that K_I belongs to gemfibrozil **glucuronide**, not
gemfibrozil, while the solver applies it against gemfibrozil's plasma concentrations;
(3) it does **double duty** as both a Ki and an inhibitor concentration [I], at a value
that is not a gemfibrozil plasma concentration on any reading. The sixth (repaglinide, 7)
should be 4.93 under the same formula, and *"7.0-fold"* appears verbatim at this record's
own dose — **an AUC fold-ratio stored as a Ki in µM.** The verbatim fold-changes survive
in the notes and are the honest quantity. Separately, **the simvastatin mechanism is
wrong** — simvastatin is not a CYP2C8 substrate, and a paper not carried here concludes
the mechanism *"is probably inhibition of non-CYP3A4-mediated metabolism of simvastatin
acid."*

**cobicistat — 1 `ki_uM` deleted.** 0.079 µM was computed as `1.5/19` from an AUC ratio;
the note says so openly. Two further problems made repair pointless: the 1.5 µM [I] is
unsourced and disagrees with the label's own Cmax (1.28 µM), and the derivation inverts a
**competitive** relationship while the edge is flagged `mbi: true`.

**Catalog scope: 601 interaction entries, 128 carry `ki_uM`. Two blocks audited, both
defective.** This is now a named backlog item.

### Compensating errors — the shape, and why one-at-a-time auditing can harm

Two independent errors running in opposite directions can leave a record looking right.
Four cases are now on record; **atracurium is the most instructive**:

| what is fixed | occupancy |
|---|---|
| nothing (as stored) | 51 % — superficially plausible |
| dose only (0.5 → 35 mg) | **98.6 % — saturated** |
| ec50 only (0.0227 → 1.36 mg/L) | **3.2 % — null** |
| **both, + hill_n 4.04** | **70.1 % — correct** |

The dose was the raw per-kg intubating figure; the ec50 was a patch-clamp IC50 in
**denervated mouse skeletal muscle** where atracurium's own PK citation contains the human
in-vivo value (*"The concentration producing 50% of the Emax was 1.36 micrograms/mL"*,
*"The mean sigmoidicity factor, gamma, was 4.04"*). **nabumetone** is the same shape at the
level of the solver defaults: `V` and `F` were unauthored, so `F` ran 2.7× high against a
correspondingly small `V`, and since only `F/V` reaches AUC the model landed within 25 %
**by accident**.

### Records where my prior was refuted

| record | my prior | what is true |
|---|---|---|
| vancomycin, meropenem | per-kg dose defect | both **correct**; vancomycin stores the 70-kg equivalent, meropenem is flat-dosed |
| brompheniramine | ka/F transplant from chlorpheniramine | the earlier pass **already removed it**; both values verbatim; the 3.3× volume gap resolves (V/F vs true V) |
| everolimus | hydroxychloroquine-shaped matrix error | **one matrix, consistently** — V/F 581 and CL/F 23 are both whole-blood, confirmed by a plasma model at 8.6× |
| venetoclax | the abiraterone case (strip the fed state) | the label **mandates food**; a fed-state parameterisation is the clinically realised one |
| sacubitril | dose block is tablet totals | they are the **sacubitril components** of the combination, stated verbatim in that form |
| nabumetone | the mass defect propagates into occupancy | **the author quarantined it correctly** — both rows used 216.23 |
| sitagliptin | the gliptin target-residence keo claim | its note makes no such claim and is honest |
| glipizide/glimepiride | same-class value collision | checked both directions — **no shared numeral** |
| ropivacaine/bupivacaine | transplant from the shared-sentence paper | ropivacaine correctly stores **its own** 117.3, not 53.7 |
| levetiracetam-er | the nifedipine ER-transplant defect | V and t½ are disposition parameters, **legitimately shared**, and its own paper proves bioequivalence |

Running total across the audit: **~50 priors of mine refuted by agents or by my own checks.**

### Changes by group

**g1 — propofol, remifentanil, sufentanil, alfentanil, thiopental**
- sufentanil: `V_L` 120 → **203**. Its citation offers both volumes in one sentence
  (*"Vd beta was 2.9 ± 0.2 1/kg, Vdss 1.7 ± 0.2 1/kg and total plasma clearance 12.7 …"*)
  and the record took the **Vss**; the terminal volume is the one that belongs with a
  terminal half-life. Severity was visible without arithmetic: the model retained 88 % of
  C₀ at 30 min where the paper says *"98% of the administered dose having left the plasma
  within 30 min"*. keo 6.93 → **6.71** (PMID:1670913). Dose 1 → 70 mcg. Dead `ka_hr: 60`
  and a parameterless IM route removed.
- propofol: keo 6.12 → **27.36** (PMID:10360845). Dose 2 → 140 mg. **PK row not repaired —
  no verbatim replacement exists** (see backlog).
- remifentanil: keo 28.8 (dog) → **55.45** (human, PMID:8638836); `source_species` removed.
  Its 2× clearance trade is now **declared** rather than silently made.
- alfentanil: keo 69.3 → **43.32** (same head-to-head). Dose 25 → 1750 mcg. Half-life
  misattribution disclosed; IM route and dead `ka_hr` removed.
- thiopental: IV `source_pmid` → **PMID:7235274** (the paper that actually contains both
  values), keo → **PMID:6491902**. Dose 4 → 280 mg. **Passes its clearance test to 2 %** —
  `V_L` 140 is almost exactly CL/β = 143, the correct Vz for the stored half-life;
  somebody derived it properly and hung it on the wrong PMID.

**g2 — atracurium, vecuronium, flumazenil, ropivacaine, ghb**
- atracurium: `source_pmid` → **PMID:6687550**, which contains all three stored values
  verbatim and pairs a **Varea** (not Vss) with a terminal half-life — implied CL 5.50
  against a stated 5.5. **The cleanest PK row in this audit, cited to a paper containing
  none of it.** Occupancy + dose fixed together (above).
- vecuronium: re-sourced to **PMID:1348166** control arm (`V_L` 64.3, t½ 2.22) — its
  previous citation is a keo-only paper stating no volume, no half-life and no clearance,
  and the stored pair implied a clearance **below even that record's own cholestasis
  reference**. Caveat stated: 919 mL/kg is a Vz, so the fix preserves exposure at the cost
  of the early peak — and for an NMB the onset phase is the clinically live one.
- flumazenil: t½ 0.7 → **1.17**, `V_L` 56 → **90.8** (PMID:2044332, *"total body clearance,
  53.8 ± 1.2 L/h … elimination half-life, 70.2 ± 9.9 min"*). Both stored numbers came from
  ranges; **the pairing passed its clearance test with room** (recorded so nobody rewrites
  it) and **the half-life erred in the dangerous direction** — 0.7 h understates
  re-sedation, this drug's central hazard.
- ropivacaine: route **IM → SC** (no IM product exists; matches the bupivacaine fix). keo
  kept and annotated: verbatim and correctly cited, but fitted *"BETWEEN AMOUNT IN THE
  DEPOT AND EFFECT-SITE COMPARTMENTS"* with an **amount** as its potency term — perineural
  diffusion, not equilibration from the systemic curve the solver feeds it.
- ghb: `F` pinned at **1**. The observed peak is **unreachable at any ka** (the ceiling
  F·D/V sits below it), so the residual is structural. MM constants deliberately not
  authored — the only published ones are **rat**.

**g3 — oseltamivir, tenofovir-DF, dolutegravir, cobicistat, venetoclax**
- oseltamivir: mw 312.4 → **284.35**, t½ 7 → **7.7**, ref PMID:36810140 dropped. **9.7× AUC
  over-prediction**, the largest in the batch; `V_L` 23 is both a range endpoint and an
  **IV Vss** paired with a terminal oral half-life, and no oral V/F is published anywhere.
- tenofovir-disoproxil: mw 519.44 → **287.21** — **80.9 % high, the largest mass defect of
  this shape in the whole audit.** The 9.2× error **decomposes**: ~2.2× from the
  prodrug/analyte mass mismatch (300 mg of fumarate is ~136 mg of tenofovir moiety, while
  the 25 % F is defined molar-equivalently) and ~4.2× from an IV Vss with a terminal
  half-life. **Correcting either alone makes the diagnosis look solved when it is not.**
  Note corrected: the "25 % food effect on tenofovir dipivoxil" attribution is a numerical
  coincidence, not the provenance.
- dolutegravir: **all four parameters** replaced from one verbatim sentence (PMID:25819132)
  — `ka_hr` 0.5 → **2.24**, `lag_hr` **0.263**, `V_L` → **17.4**, t½ → **13.4**. The old ka
  was the catalog's second-most-common value (25 records) and implied Tmax 5.13 h against
  a published 2–3 h.
- cobicistat: `source_label` rewritten (the Tybost label states **no volume and no
  clearance**; 99.5 L is a legitimate back-derivation wearing the wrong clothes); computed
  `ki_uM` deleted. **Recommendation on record: add no cobicistat perpetrator edges** —
  lopinavir and darunavir already declare ritonavir-boosted apparent parameters, so an edge
  would double-count.
- venetoclax: `ka_hr` 0.15 → **0.38**; `source_label` corrected. The label says **~26 h**
  while the label-attributed t½ is 17 — kept, because the label's own three exposure
  figures are mutually inconsistent by 1.59× and 17 is what makes exposure close.

**g4 — sitagliptin, glipizide, glimepiride, rosiglitazone, gemfibrozil**
- sitagliptin: t½ 10.4 → **7.4**, `V_L` 196 → **266**. **The identity named the guilty
  parameter and forbade the obvious fix**: three routes agree the record is 1.91× over, but
  raising `V` to ~380 would fix AUC and destroy Cmax, because the verbatim quartet gives
  AUC/Cmax 12.80 h — passing at 7.4 h, failing at 10.4. `F` 0.87 verified (real IV arm).
- glimepiride: t½ 8.2 → **2.35**. Its own verbatim pair (*"41.6 ml/min and 8.47 litres"*)
  **implies 2.35 h, not 8.2**. As stored, Cmax rendered 43 % low while AUC was 2× high —
  **errors in opposite directions, so no rescaling of V or F fixes both**.
- glipizide: t½ 4 → **5.0** (verbatim; cuts a 47 % clearance error to 17 %).
- rosiglitazone: t½ 3.5 → **3.6**, `V_L` 17.4 → **17.6** (the record's own prose said 17.6).
- gemfibrozil: seven `ki_uM` deleted (above); `ka_hr` **1.0** + `lag_hr` **0.75** authored.
  An earlier pass declined to author a ka because the observed Tmax sits above the ceiling
  this half-life allows — **correct arithmetic, wrong conclusion**: the margin is 1.7 %
  against an SD of ±1.1, another study's Tmax fits underneath, and the drug has no depot
  form. That is a **lag**, and leaving the field empty rendered Tmax 1.44 h — wrong in
  exactly the direction the earlier pass was avoiding.

**g5 — sacubitril, fosinopril, edoxaban, lovastatin, doxorubicin**
- fosinopril: the reversal (above), plus mw 563.66 → **435.50**.
- edoxaban: `V_L` **349** authored (the field was **absent**, so the solver's 35 L default
  asserted CL 2.21 L/h against a verbatim 22 — **10× low, and invisible to a citation
  check because the field was missing rather than wrong**). Storing the other verbatim
  number in the same sentence (Vss 107 L) leaves it 3.3× low. `source_pmid` moved to the
  paper that actually states 62 % (the old one says *"relative bioavailability … 67.2 %"*).
- sacubitril: mw 411.49 → **383.44**. `F` and `V` are **unsourceable, not merely unsourced**
  — seven papers chased, none states an absolute F, CL or V.
- lovastatin: `V_L` 140 → **251** (derived, declared). 140 is **the same orphan number
  already deleted from simvastatin**, whose note records that no human volume exists.
- doxorubicin: t½ 30 → **13.0** **and** doses 30/60/90 → **52/104/156** — the two errors
  were hiding each other (model AUC only 1.23× high; **fixing the dose alone makes it
  2.13× high**). The abandoned 30 h is verbatim but is the **third phase** of a
  triexponential. The apparently ready-made two-compartment set was tested and **rejected**:
  its microconstants contradict its own reported CL and AUC by 19× and fail `αβ = k21·k10`.

**g6 — moclobemide, tianeptine, ethosuximide, levetiracetam-er, brompheniramine**
- moclobemide: one state (F 0.90, `V_L` 80.7, t½ 2.00, PMID:3665338). The stored triple was
  assembled from **three different states of one paper it never cited** — V from the
  drug-naive first IV, t½ after 15 days' dosing, F from neither. **Not a carbamazepine:**
  the *elimination* parameter moves only 1.25×, and the ~3× exposure rise is representable
  here because the solver has **separate F and ke slots**, where carbamazepine had to put
  the whole effect on one.
- tianeptine: `V_L` **53.9**, `F` **0.99**, `ka_hr` **2.70** authored — the row carried a
  citation and nothing else. **The obvious verbatim volume is a class-12 trap**: the cited
  0.47 L/kg is a Vss and would assert a clearance a third below the same abstract's figure;
  the coherent value was already in this record's own refs.
- ethosuximide: t½ 50 → **53.7**. Otherwise **the control of this batch** — V verbatim and
  correctly the control arm, class 6 acquitted by construction, clearance within 5.5 %.
- levetiracetam-er: `ka_hr` 0.3 → **0.508** (back-derived to the verbatim 4 h Tmax).
- brompheniramine: `F` pinned at **1** (820 L is a V/F; the 0.9 default divided by
  bioavailability twice).

**g7 — nabumetone, palonosetron, upadacitinib, everolimus, vancomycin**
- nabumetone: `V_L` **30.9**, `F` **1**, `lag_hr` **0.19** authored; mw 228.29 → **216.23**.
- upadacitinib: t½ 11.5 → **3.8**. **3.03× under**, and the paper states the cause itself —
  294 L is Vc+Vp welded to a terminal half-life. The fix is the paper's own **"functional
  half-life of 3–4 h"**, and it corrects Tmax for free. `F` must not be touched: lowering it
  would fix AUC arithmetically but **create class 6 to paper over class 12**. Near-identical
  to baricitinib's 3.06×.
- vancomycin: t½ 6 → **6.6**, `V_L` 60 → **60.9** — the stored half-life was the
  **activated-charcoal arm** (*"Mean CONTROL values … 6.6 ± 1.5 h … WHEN ACTIVATED CHARCOAL
  WAS GIVEN … 6.0 ± 0.9 h"*). Dangling PO route removed (verified **dead, not dangerous**:
  `pkParamsForRoute` returns null without an elimination rate).
- everolimus, palonosetron: annotated only (see the refuted-priors table).

**g8 — clenbuterol, clomiphene, dnp, lgd-4033, meropenem**
- **clomiphene → `mixture`.** A published sentence declares it unauthorable: *"The
  conventional model-dependent pharmacokinetics of clomiphene citrate isomers COULD NOT BE
  DETERMINED due to a very flat terminal half-life and the long-tailed residence time."*
  The bound fails for **both isomers at once** (one needs ≥173 h and observes 86; the other
  observes 4.3) — nothing reproduces both, and a mixture record must. With the defaults it
  was predicting a peak **~42× over**.
- **dnp → `uncharacterized`.** t½ 18 is verbatim and better sourced than feared (a
  **survivor** with serial ante-mortem levels, not post-mortem) but is n=1 in
  acute-on-chronic overdose. The largest live series implies 44–65 h **with haemoperfusion
  accelerating elimination**, and states *"DNP exhibits significant NONLINEAR
  pharmacokinetics."*
- **lgd-4033 → `research-only`.** The human phase-1 is correctly cited and its abstract
  states only *"LGD-4033 had a long elimination half-life and dose-proportional
  accumulation"* — **no numeral**. All 25 indexed hits swept. Separately, the stored 5–10 mg
  is **illicit dosing, 5–10× the highest dose ever given to a human in a study**.
- meropenem: t½ 1 → **0.8** (verbatim; a rounding that broke its own clearance by 15 %).
- clenbuterol: kept and annotated. **No `V_L`**, so the default renders Cmax **4.9× over
  this record's own cited paper**; back-solving gives V/F ~190 L but that is computed, and
  no indexed abstract states a clenbuterol volume or bioavailability. Two class-2 donor
  traps flagged for whoever fills it, and a warning that PMID:6152164 is **mabuterol**.

### Investigated and deliberately not changed

| record | finding | why not acted on |
|---|---|---|
| propofol | PK row fails 4.4× against its own citation; `V_L` 196 is a thyroid study's euthyroid-control **Vss** and t½ 4 appears nowhere in that abstract | **no verbatim one-compartment replacement exists**; a consistent V for t½ 4 h is ~866 L, not a propofol volume |
| everolimus | floor fails 3.57×; Cmax renders **3.94× low**, user-visible | unrepresentable at any ka, V or F. Its ref PMID:18332470 gives t½ 30 h — **not adopted**: at 30 h the one thing the record gets right (CL/F 23) breaks |
| remifentanil | typical dose 0.25 mcg is a **mcg/kg/min infusion rate**, not a dose | the schema has no rate unit |
| tenofovir-DF, oseltamivir | the `V_L` values that would close their errors | derived, not verbatim |
| thiopental | `fu_note`'s saturation acquittal is **narrower than it claims** — the linearity finding covers ~7–93 µg/mL, non-linearity appears at 150, exactly the post-bolus peak | recorded in prose; the scalar is right for an infusion |
| alfentanil | `fu` 0.093 conflicts 1.9× with its own IV source's *"fu was 0.18 ± 0.08"* | needs a fraction-unbound pass, not a PK one |
| ropivacaine | V and CL are **blood**-referenced while the solver is plasma-referenced | no verbatim B:P ratio found; would narrow the 1.95× gap, not close it |
| glipizide | dose range matches the **GITS/XL** ceiling while the PK citation is IR | needs `zo_dur_hr` |
| levetiracetam-er | an ER tablet is better modelled by `zo_dur_hr` than by any ka | logged with the template sweep |
| atracurium, doxorubicin | laudanosine and doxorubicinol are active metabolites with **no record and no `metabolites[]` entry** | a gap, not a defect |
| gemfibrozil | a documented gemfibrozil→sitagliptin interaction (AUC 1.54×) appears in **neither** record | edge authoring, not this pass |
| palonosetron | a paraphrased secondary citation reports late levels the model increasingly under-predicts | ranked soft; the record's own primary is satisfied |

### Backlog opened or sharpened by this batch

1. **`interactions[].ki_uM` audit — 128 entries across 601.** Two blocks audited
   (ketoconazole, gemfibrozil), **both defective**, plus cobicistat's single computed edge.
   The recurring shape is *a constant inverted out of an AUC fold-ratio, stored as a
   measurement*.
2. **The remaining five raw per-kg doses:** etomidate 0.3 (→21), ketamine 1 (→70),
   rocuronium 1 (→70), succinylcholine 1.5 (→105), cyclosporine 6.67 (→467), ganciclovir 5
   (→350), infliximab 5.33 (→373). Also theophylline IV **11.7 mcg**, nonsense on any
   reading, and dexmedetomidine's mcg figures.
3. **The metabolite-analyte mass convention.** **All 19** records declaring a metabolite
   analyte store the **parent** mass. Four carry occupancy rows and are **live in the UI
   today** via `affinityLabel()` in `apps/app/src/lib/receptors.ts`, which back-converts the
   stored mg/L for display: fenofibrate (12.9 % off), nabumetone (5.6 %, 2 rows), sulindac
   (4.7 %), misoprostol (4.0 %). **A uniform convention, not 19 slips — decide centrally.**
4. **`fentanyl`'s keo is a rat tail-flick value with `source_species` unset**, so it counts
   among the 53 "fitted" records. Found while checking the sufentanil/fentanyl
   shared-sentence collision.
5. **A whole-blood matrix flag.** everolimus emits whole-blood concentrations the solver
   labels plasma (~8.6× above plasma). Inert today; an **8.6× live error** the moment
   anyone authors a plasma `fu` or a plasma-referenced `ec50` on that record.
6. **`nabumetone`'s prose contradicts its own numbers** — it calls the drug
   "COX-2-preferential" while the stored pair is 3.5× **COX-1**-selective. The IC50 numerals
   are table-only (PMC22126 is not in the OA subset) and remain **unverified**.
7. **`v_apparent` schema field** to make the V/F-vs-V distinction machine-checkable — this
   batch turned on it five separate times (sufentanil, vecuronium, oseltamivir,
   tenofovir-DF, fosinopril, upadacitinib).

## The metabolite-analyte mass convention (2026-09-08) — 10 records, class closed

`scripts/authoring/2026-09-08-analyte-mass-convention.ts`. Opened as backlog item 3
of batch 10 and closed the same day, because the sweep found a **cleaner and wider**
version of the defect than the one reported.

**The field names one species; a prodrug record describes two.** `mw_g_mol` must be the
mass of whatever `pk_analyte` declares — the species that actually circulates, which
`pk[]` and `half_life_hr[]` already describe — because **both** of its consumers want
that species:

1. **Interaction perpetrator conversion.** `ki_uM` is converted against the perpetrator's
   *plasma* curve. For a prodrug, the parent mass converts against a molecule that isn't
   there.
2. **Affinity display.** `affinityLabel()` in `apps/app/src/lib/receptors.ts` back-converts
   a stored `receptor_occupancy[].ec50_mg_l` to a Ki using the **record's** mw, while the
   row itself was authored by converting a published nM/µM affinity measured on the
   **active** species. When the two disagree the round trip does not close and **the screen
   shows a number the cited source does not contain.**

**The batch-10 report was true when the convention was first noticed and is no longer
true.** It said all 19 records store the parent mass with four live in the UI. In fact
earlier passes had already corrected **fenofibrate** and **misoprostol** (their row notes
record it explicitly), batch 10 corrected **nabumetone, fosinopril, oseltamivir, sacubitril
and tenofovir-disoproxil**, and **baloxavir** and **eslicarbazepine** were right all along.
**Of the four records with live occupancy rows, only `sulindac` still mismatched** — its row
converted with the sulfide mass (correct, and what `pk_analyte` declares) while the record
carried the parent, so the displayed affinity ran 4.5 % off. The other nine are **latent**
— no occupancy rows, no kinetics edge — but they are the same defect, one authored edge
away from going live.

| record | parent (stored) | analyte (now) | analyte | error as stored |
|---|---|---|---|---|
| lisdexamfetamine | 263.38 | **135.21** | dextroamphetamine | 48.7 % high |
| valacyclovir | 324.34 | **225.20** | acyclovir | 30.6 % high |
| valganciclovir | 354.36 | **255.23** | ganciclovir | 28.0 % high |
| mycophenolate | 433.50 | **320.34** | mycophenolic acid | 26.1 % high |
| famciclovir | 321.34 | **253.26** | penciclovir | 21.2 % high |
| tazarotene | 351.46 | **323.41** | tazarotenic acid | 8.0 % high |
| enalapril | 376.45 | **348.40** | enalaprilat | 7.5 % high |
| **sulindac** (live) | 356.41 | **340.40** | sulindac sulfide | 4.5 % high |
| simvastatin | 418.57 | **436.59** | simvastatin acid | 4.3 % low |
| prednisone | 358.43 | **360.44** | prednisolone | 0.6 % low |

**Note the last two run the other way** — an acid metabolite is not always lighter than its
ester, and prednisolone is *heavier* than prednisone. A sign-blind "the metabolite is
smaller" heuristic would have got both wrong.

**Masses are computed from the molecular formula and verified against PubChem PUG-REST, not
cited.** A molecular weight is arithmetic on a formula, not a published measurement, so the
verbatim rule does not reach it. Where an occupancy row already recorded the mass it
converted with (sulindac, 340.40), **that** value is stored so the record closes on itself
exactly.

**The convention is now written into the schema** — see the `mw_g_mol` doc comment in
`packages/core/src/types.ts`, which states which species the field names and why, so this
does not have to be rediscovered.

**Not closed by this pass:** the deeper issue is that one field serves two purposes with no
way to express a per-row conversion mass. A `receptor_occupancy[].mw_g_mol` override (or
storing the published affinity directly alongside the derived `ec50_mg_l`) would make the
round trip verifiable by lint rather than by inspection. Logged.

## Three rat kₑₒ values that read as human (2026-09-08) — backlog item 4 closed

`scripts/authoring/2026-09-08-keo-species-declared.ts`, plus a widening of the
`effect.species-in-note` lint rule in `scripts/data-lint.ts`.

**53 kₑₒ values are claimed FITTED** (no `approximated` flag). Batch 10 refuted a
systematic units error across all of them but found, while checking the
sufentanil/fentanyl shared-sentence collision, that **fentanyl's is a rat value with
`source_species` unset**. Generalised, there were three:

| record | kₑₒ /h | verbatim | study |
|---|---|---|---|
| fentanyl | 7.38 | *"The k(eo) was 0.024 min(-1) … and 0.123 min(-1) … for buprenorphine and fentanyl, respectively"* | rat tail-flick antinociception |
| atenolol | 2.52 | *"0.042+/-0.012 min(-1) (k(eo))"* | WKY rat, isoprenaline tachycardia |
| pregabalin | 0.552 | *"the calculated ECe50 and Keo values were 95.3 ng/mL and 0.0092 min-1"* | rat brain-ECF microdialysis |

**Every value is verbatim, correctly fitted and correctly attributed — only the label
was missing.** All three are kept and declared. After the pass, 9 of the 53 fitted kₑₒ
values declare a non-human species.

**A collision correctly avoided, worth recording.** fentanyl's source reports
buprenorphine and fentanyl in **one sentence** — the exact shape that has produced
transplants elsewhere — and the record took **0.123, which is fentanyl's**. buprenorphine's
own record was checked at the same time and does **not** carry this paper's figure: it cites
a separate study, verified here as *"in healthy volunteers"*. Both records are right.

### Why the existing lint rule missed them

`effect.species-in-note` required an animal word **and** a study word (pharmacokinetic,
clearance, EEG, endpoint …) in the **same sentence**. That conjunction is correct for a
compound's `notes` — long free prose that discusses many studies, where a species word
alone proves nothing, and where the PK-side rule still uses the much narrower
`ANIMAL_PK_CLAIM`. **An `effect_compartment.note` is not that.** The whole field is one
provenance statement about one value, so naming a species *is* the claim.

The conjunction made the rule miss every compactly-written note: fentanyl's entire note was
`"antinociception (rat tail-flick)"` — no study word at all — and atenolol's and
pregabalin's put the species and the study word in **different sentences**. The rule now
requires only the animal word, with `SUPERSEDED` as the sole guard — which is the clause
that was doing the real work anyway, since a keo note routinely names the animal study it
**replaced** (morphine's *"Replaces prior rat-EEG citation"*; remifentanil's record that the
value it replaced was *"correctly labelled DOG"*). **Widened, exactly these three of the 249
keo records fire, and neither false positive does.**

**The general lesson:** a rule tuned against one field's prose conventions silently
under-fires when reused on another field with different conventions. The narrowing that
made it correct for `notes` is what made it blind on `effect_compartment.note`.

## Pharmacological batch 11, part A (2026-09-08) — 7 of 24; the rest blocked

`scripts/authoring/2026-09-08-pharmacological-batch11a.ts`. **All five batch-11 agents
died on an account weekly rate limit (HTTP 429), not on anything in the work.** Group
dumps and five ready-to-send prompts survive in the session scratchpad as `b11-g1..g5.md`;
the remaining 18 records are unaudited. These seven I decided myself.

### The finding that organises this part

**Deleting an unsupported value does not leave the record silent — it leaves it asserting
the default.** `F` 0.9, `V` 0.5 L/kg (35 L) and `ka` 1.0/h are themselves unsourced
numbers, they are invisible on every surface, and for a low-availability drug they are
**further from the truth than the flawed value that was removed**.

A 2026-09-06 pass dropped `ka`, `V` and `F` from a group of records wherever the cited
abstract did not state them. **The diagnosis was right every time; the remedy was not**,
and two of the largest errors found in the whole audit are its direct result:

| record | as stored | cause |
|---|---|---|
| **raloxifene** | Cmax rendered **~2,900× over** | `F` 2 % and `V/F` 2348 L/kg are **both verbatim in the abstract the record already cited** |
| **dextromethorphan** | Cmax rendered **~100× over** | the removed values were **dog** values — correctly diagnosed — but were ~70× *closer* than the defaults that replaced them |

Same shape as the fosinopril reversal in batch 10, and the reason the standing rule exists.
The honest options are a **declared derivation** or **`pk_unauthored`**. Deleting and
saying nothing is not one of them.

### Changes

- **raloxifene** — `V_L` **164,360** (2348 L/kg × 70) + `F` **1**. Its own citation states
  the pair: *"Approximately 60% of a dose is absorbed; however, absolute bioavailability is
  only 2%. The volume of distribution is 2348 L/kg for a single oral dose of 30-150 mg, and
  the elimination half-life averages 32.5 hours."* **The two must not both be stored** —
  that volume is apparent and already contains the 2 %, so pairing it with `F` 0.02 would
  divide by absorption twice and inflate exposure 50×. The **60 % is a class-2 donor in the
  same sentence** and is deliberately not stored: it is *fractional absorption*, not
  bioavailability, and the gap between them is this drug's entire first-pass
  glucuronidation. (The missing field for that distinction is an already-logged schema gap.)
- **dextromethorphan** — `V_L` **3,359** + `F` **1**, derived from two verbatim numbers in
  its own citation: *"The apparent partial clearance of dextromethorphan to dextrorphan was
  … 970 L/hr in extensive metabolizers"* and *"2.4 hours in extensive metabolizers"*.
  **Declared as derived, and as a lower bound** — 970 is the clearance to one metabolite —
  though for this drug the bound is tight, since that route is dominant in EMs.
- **orlistat → `local-acting`.** Its citation is an argument that the record should not
  exist: 25 phase-1 studies plus two mass-balance studies concluding *"systemic absorption
  of orlistat is negligible"*, *"almost the entire dose was recovered from fecal samples"*,
  and **stating no half-life, volume or bioavailability at all**.
- **ostarine → `research-only`.** Its citation contains **only relative quantities** —
  *"reduced the maximal plasma concentration (Cmax) by 23 % and the area under the curve
  (AUC∞) by 43 %"* and four more fold-changes — the class-2 trap in its purest form. The
  stored t½ is a round 24 h. The only disposition study indexed is **rat**, and reports
  *"mean elimination half-life of 0.6 h and 16.4 h in male and female rats"* — a 27-fold
  sex difference in one species, itself a reason not to extrapolate.
- **mk-677 → `research-only`.** Its citation is a **bioanalytical method paper** (LC-MS/MS
  assay development), not a PK study, and states no half-life. The sweep for a replacement
  returns medicinal chemistry (*"F(rat)=65%, F(dog)=44%"*), a review, and equine doping
  control. Same as lgd-4033: human trials were run, and the record is still unauthorable.
- **rad-140 — ACQUITTED, my prior refuted.** Unlike its three SARM neighbours it cites a
  real phase-1 in 22 patients stating the number outright: *"The half-life (t1/2) of 44.7
  hours supported QD dosing"*. **And its dose block is not the lgd-4033 defect either** —
  that trial escalated *above* anything the record simulates. `V` and `F` are missing and
  could not be sourced; logged, not invented.

### lithium — quantified and DELIBERATELY not patched

**A therapeutic dose renders as a toxic serum level, and the cause is a catalog-wide
convention rather than a wrong number.** Every stored lithium value is verbatim. But the
dose is 900 mg of lithium **carbonate** while the volume, half-life and monitored serum
concentration all describe the lithium **ion**, and only 18.785 % of that salt mass is
lithium:

| dose as stored | Cmax | in monitored units |
|---|---|---|
| 900 mg (the carbonate) | 16.12 mg/L | **2.32 mmol/L** — above the ~1.5 toxicity threshold |
| 169.1 mg (the ion) | 3.03 mg/L | 0.44 mmol/L — right order (band is 0.6–1.2) |

**Overstatement 5.32×.** The second defect pulls the other way and is why neither is fixed
alone: no `F` is stored, so the solver substitutes 0.9 against a volume that is itself
apparent, dividing by absorption twice — **pinning `F` at 1 is correct and would make the
toxic reading 10 % worse.** Both move together or neither moves. That is the
compensating-error lesson from atracurium and doxorubicin applied *before* the mistake.

**And it is not lithium-specific.** The catalog deliberately stores free-base masses beside
salt-form doses — harmless while the mass only converts µM affinities, **not harmless once
the dose feeds the plasma curve**. Brompheniramine has the same shape at 1.36×, at least
**29 records** discuss a salt-versus-base distinction in their prose, and lithium is merely
the extreme because its counter-ion is most of the molecule. **Schema gap: there is no field
saying which moiety a dose is expressed in.** This is now a named backlog item, and it is
the highest-severity one open, because it is user-visible and points the wrong way clinically.

### Still unaudited (18)

cariprazine, metolazone, trastuzumab, desloratadine, rabeprazole, sulfasalazine, warfarin,
bupivacaine, phenibut, remdesivir, rituximab, temsirolimus, 5-fluorouracil, epinephrine,
esmolol, lithium (PK re-author), paclitaxel, rifampin. Screening arithmetic already run —
notable: **trastuzumab** implies a clearance ~3× below the published one; **paclitaxel** and
**5-fluorouracil** both carry first-order half-lives for drugs with saturable disposition;
**rifampin** and **phenibut** render entirely against silent defaults; **epinephrine** is
endogenous and may belong in `homeostatic`.

## Pharmacological batch 11, part B (2026-09-08) — 8 more; 15 of 24 now done

`scripts/authoring/2026-09-08-pharmacological-batch11b.ts`. Still no agents.

### Class 12 is the dominant defect in this group, in four distinct variants

**And in every case the verbatim clearance that exposes it is in the record's own citation.**

| record | the pairing | vs its own citation |
|---|---|---|
| **trastuzumab** | **V1, the CENTRAL compartment** of a 2-comp fit, welded to a **terminal** half-life | **3.13× under** *"clearance (CL) and volume of distribution of the CENTRAL COMPARTMENT (V1) … were 0.225 L/day, and 2.95 L … Estimated TERMINAL halflife … 28.5 days"* |
| **remdesivir** | **Vc + Vp summed** (4.89 + 46.5 = 51.39) and stored as one volume — the upadacitinib shape | **1.95× over** *"elimination clearances of remdesivir, GS704277, and GS-441524 reached 18.1 L/h, 36.9 L/h, and 4.74 L/h"* |
| **esmolol** | a half-life that is in **no arm** of its citation (9 min against a control 7.2) | **1.53× over** *"total body clearance for esmolol was 171.4 ± 69.8 … ml/min/kg for the control"* |
| **epinephrine** | volume inconsistent with a clearance stated as an **equation** | **1.33× under** *"CL (L/hr) = 127 × (BW/70)0.60 × (SAPS II/50)-0.67"* |

A **V1 welded to a terminal half-life is the worst version of the pairing** — a Vss at least
averages the two compartments; a central volume is only the first, so it understates
clearance the most. All four volumes now equal the verbatim clearance over the rate the
stored half-life implies, so exposure reproduces each paper exactly. For trastuzumab the
cost is stated: the modelled peak falls from ~142 to ~45 mg/L and the truth lies between —
the one-compartment compromise every antibody in this catalog faces.

### temsirolimus — unrepresentable, diagnosed from numbers already in its own `source_label`

That string records Cmax 585 ng/mL, AUC 1627 ng·h/mL and t½ 17.3 h. **Those three give
AUC/Cmax = 2.78 h against a floor of 24.96 h — 8.97× below**, so no `ka`, `V` or `F`
reproduces them. As stored the record was simultaneously **2.23× under on exposure and 4×
under on the peak** — opposite directions, so nothing fixes both. The everolimus verdict
applies: preserve exposure, pay on the peak, declare it.

**That makes two whole-blood-referenced mTOR inhibitors** whose concentrations the solver
labels plasma (everolimus ~8.6× above plasma). The latent trap is now a **pattern, not an
incident** — and temsirolimus additionally models only the parent while sirolimus carries
much of the activity with a far longer half-life.

### paclitaxel — a per-m² dose and a volume scaled at a *different* body surface

Its citation states everything per square metre: *"half-lives of the first and second phases
after a 275 mg/m2 dose were 0.32 and 8.6 h"*, *"The apparent volume of distribution was 55
liters/m2"*. The record stored the raw dose numerals as milligrams **and** a volume of 99 L —
that verbatim 55 scaled at **1.8 m²**. **The dose and the volume used different bodies.**
Both now use 1.73, the reference doxorubicin was corrected to (doses 80/175/175 →
138/303/303).

**The one verbatim concentration in that abstract confirms the direction:** it reports a peak
*"with a dose of 275 mg/m2 … approximately 8 microM"*, which the corrected convention
reproduces to within 1.4× where the stored one was **2.5× low**. Flagged, not asserted: the
kept half-life is the terminal one of a profile the same sentence calls **biphasic**, and this
drug's widely-described vehicle-mediated non-linearity is **not** stated by its own citation.

### phenibut → `uncharacterized`

Its cited paper is a Russian-language **bioequivalence** abstract reporting **no number of
any kind** — its entire finding is that two formulations *"are bioequivalent in terms of
pharmacokinetics"*, a statement about a *ratio*. Both stored values are class 1. **And the
bioavailability has a traceable, disqualifying origin:** the only close figure indexed is
*"Absolute bioavailability was 64%"*, from a study whose own abstract says the distribution
volume *"only slightly surpassed the volume of extracellular body fluids **in rat**"* — a
**rat** study of a **citrate derivative**, matching the stored 0.65 to within a percent. A
species misattribution stacked on a compound misattribution.

### Refuted priors from this part

- **epinephrine is NOT `homeostatic`** — I expected an endogenous catecholamine to belong
  with the minerals. Its citation argues the opposite twice, verbatim: *"Epinephrine
  pharmacokinetics is linear in septic shock patients, without any saturation at high
  doses"* and *"Basal neurohormonal status does not influence epinephrine
  pharmacokinetics."* A dosed first-order curve is the right object; the record keeps it.
- **trastuzumab's dose block is already right** — batch 8 corrected it from a raw per-kg
  figure, and the SC 600 mg is a genuine flat dose.

### Recorded, not changed

- **5-fluorouracil** — its citation is a review giving *"an apparent terminal half-life of
  approximately 8 to 20 minutes"* and **no** volume or clearance, so the stored 13.8 min is
  a range interior and the volume is class 1. **The clearance check is declared as NOT RUN**
  rather than reported as passed: no verbatim absolute clearance was found. Its
  widely-described saturable elimination is likewise flagged and not asserted, because that
  abstract does not state it.
- **esmolol's dose block** holds 50–300 with a typical of 100 **micrograms** — those are the
  **mcg/kg/min infusion rates**, a rate and not a dose (the remifentanil case), so the model
  doses roughly three ten-thousandths of the real amount. Its active metabolite ASL-8123 has
  a half-life *"more than 42 hours compared with only 4 hours"* and no record.
- **epinephrine's IM route** is declared with a dose and **no parameters**, so the
  autoinjector dose yields no curve at all.

### Still unaudited (9)

cariprazine, metolazone, desloratadine, rabeprazole, sulfasalazine, warfarin, bupivacaine,
rituximab, rifampin. Plus **lithium's paired salt-mass/F fix** from part A.

## Batch 11, part C + the sweeteners (2026-09-08) — every PK record in the catalog is now audited

`scripts/authoring/2026-09-08-pharmacological-batch11c.ts` and
`scripts/authoring/2026-09-08-sweetener-pk.ts`, plus `scripts/audit-triage.mjs`.

### The triage over-reported, and the detection was the bug

The screening script flagged 24 pharmacological records as unaudited. **Seven of them were
already fully audited** — cariprazine, metolazone, desloratadine, rabeprazole,
sulfasalazine, warfarin and bupivacaine each carry a detailed audit note from an earlier
batch, several recording defects larger than anything left in the batch. They were missed
because those passes reached them through `PATCH` tables and `need('slug')` calls that the
grep (`slug: '…'`) does not match. **Their notes were read individually before this was
concluded.**

**The script that decided what had been audited had lived in a scratch directory for ten
batches** — neither reviewable nor reproducible. It is now `scripts/audit-triage.mjs`,
takes a category argument, and builds its "done" set from *any* single-quoted string in
`scripts/authoring` that is also a real slug. That **over-matches slightly** (a slug merely
named in prose counts as audited) — deliberately the right direction to err, because a
false "done" is caught the moment someone opens the record, while a false "todo" wastes a
whole agent.

**Result: 0 unaudited records with PK in every category.**

### rifampin — part A's finding in its purest form

Its own note recorded that a 2026-09-06 pass dropped `ka`, `V` and `F`, and **named the
verbatim values it declined to adopt** *"to avoid mixing populations"* — while the defaults
it fell back on **are not a population at all**. The two declined numbers turn out to come
from **one population fit of one cohort of 261 patients**: *"The typical population estimate
of oral clearance was 19.2 liters × h(-1), while the volume of distribution was estimated
to be 53.2 liters."* Adopting them mixes nothing.

Both are **apparent**, which the abstract confirms in the same breath (*"A strong
correlation between clearance and volume of distribution suggested substantial variability
in bioavailability"*), so `F` is pinned at 1 and the verbatim absolute figure from a
different study (*"87% and 71% for rifampicin"* fasted/fed) is **deliberately not stored**
beside an apparent volume. The half-life moves with them to 1.92 h — **a deliberate change
of state**: the abandoned 3.57 h is single-dose treatment-naive, while rifampin **induces
its own metabolism** and is taken daily for months. The two states differ 1.86×, inside the
band that kept efavirenz, rifabutin and moclobemide rather than the one that stripped
carbamazepine.

- **rituximab** — t½ 528 h was a **range interior** (*"approximately 3 weeks (range, 248-859
  hours)"*); replaced with the stated mean already in its own refs, *"19.2 (± 15.2%) days"*.
  **`V` 3.1 L is unsourced and deliberately not replaced**: the only clearance either paper
  offers is itself a range (*"between 3.1 and 11.9 mL/hr/m"*), and a volume derived from its
  midpoint would commit the exact defect this audit keeps finding.

### The three sweeteners — what "bioavailability" means in this literature

**None of these three papers measures bioavailability.** They measure **recovery**, and each
record stored that recovery in `F`:

- **saccharin** — *"The fraction absorbed was about 0.85"* — fraction **absorbed**.
- **sucralose** — *"a mean of 14.5% … of the radioactivity was excreted in urine"* — urinary
  recovery of **radioactivity**, ~a sixth of which is glucuronide, so the parent-referenced
  value is nearer 0.12.

For both the substitution is defensible (neither has meaningful first-pass metabolism) —
**which is exactly why it needs saying: defensible *here*, not in general.** raloxifene in
part A carries the identical sentence shape, and storing its *"Approximately 60% of a dose
is absorbed"* as `F` would have been a 50× error. The missing field for fractional
absorption is the same schema gap the mineral pass logged.

- **sucralose** — `pk_analyte: 'total-drug-related'`. Its half-life is *"the effective
  half-life for the decline of plasma **RADIOACTIVITY**"* — not the parent — and the analyte
  field was unset, so every surface presented it as a sucralose half-life. The schema has an
  enum member for exactly this and the record did not use it.
- **saccharin** — every number verbatim, **each a different kind of quantity than its
  field**: the half-life is the *terminal* half-life of an **intravenous two-compartment
  fit** stored on an oral route (class 12 and class 8 at once), and the abstract warns
  against the oral model in its own words — *"After oral administration (2 g) more complex
  and variable plasma concentration-time curves were obtained"*. No volume is published;
  the record's note previously presented that as a choice (*"ka and Vd are left to solver
  defaults"*) rather than as the gap it is.
- **mannitol** — `V_L` 32.9 → **51.4**. Its note claimed *"a 1-compartment approximation of
  the reported 2-compartment fit"*, and **the approximation does not close**: the stored
  pair asserts 19.2 L/h against the paper's own *"7.15 ± 10.23 ml × min-1 × kg-1"* (30.0
  L/h). **A caveat larger than the correction:** n = 4 and **every reported SD exceeds its
  own mean**, so the 1.56× gap sits inside the noise and the fix buys internal coherence
  rather than accuracy. Its oral route is deliberately left parameterless — that is
  *correct* here, since oral mannitol is minimally absorbed and acts osmotically in the
  lumen, which is why the laxative warning exists.

## `dose_moiety_fraction` — the schema gap that made lithium read as toxic (2026-09-08)

Schema: `packages/core/src/types.ts`, `packages/registry/src/loader.ts`.
Solver: new `packages/solver/src/dose.ts`, threaded through 10 call sites.
Test: `packages/solver/test/dose-moiety.test.ts`. Data:
`scripts/authoring/2026-09-08-dose-moiety.ts`. Lint: `dose.moiety-note`,
`dose.salt-moiety-unset`.

**`doses[]` holds what a person takes — routinely a salt — while `pk[]` describes the free
base or the ion.** The solver divides dose by volume, so without a correction it divides a
salt mass by a free-base volume. The catalog's stated convention (free-base `mw_g_mol`
beside salt-form doses) is harmless while the mass only converts µM affinities and **not**
harmless once the dose feeds the plasma curve.

**The displayed dose is unaffected.** A 900 mg tablet is still logged and shown as 900 mg;
only the mass entering the solver changes.

### The design decision, and why it is shaped this way

The failure mode of a field like this **is not a wrong constant — it is a call site that
silently forgets to apply it**, which no numeric test catches because it only shows on the
handful of records that set the field. So:

- the fraction rides on **`PkParams`**, populated in `pkParamsForRoute` — the single place a
  registry `Compound` becomes solver params;
- every dose→mass conversion in the solver goes through one helper, **`analyteDoseMg`**;
- **a test greps the solver source and fails the build if any module calls `doseToMg` on an
  intake directly.** Two positivity/timing guards route through the helper without params
  (a positive fraction cannot change `> 0`) purely so the rule stays absolute and greppable.
- `moietyFraction` refuses a value outside (0, 1] at runtime rather than amplifying a dose,
  even though the loader already constrains it.

**Every fraction is stoichiometry, not a fitted value** — the analyte's share of the dosed
salt's formula mass, from formulae verified against PubChem. That is arithmetic, not a
published measurement, so the verbatim rule does not reach it; but the arithmetic is written
into `dose_moiety_note` on every record and **`dose.moiety-note` fails a fraction that
arrives without one**, because a bare constant like 0.188 says nothing about which salt it
came from or which analyte it leaves.

### Applied

| record | salt dosed | analyte | fraction | effect |
|---|---|---|---|---|
| **lithium** | Li₂CO₃ (73.891) | Li⁺ (2 × 6.941) | **0.18787** | 2.32 → **0.485 mmol/L** for a 900 mg dose |
| **tenofovir-disoproxil** | TDF fumarate (635.5) | tenofovir (287.21) | **0.45194** | closes the 2.2× half of its 9× error |
| **brompheniramine** | maleate (435.3) | base (319.24) | **0.73338** | 1.36× |
| **chlorpheniramine** | maleate (390.9) | base (274.79) | **0.70297** | 1.42× |

**lithium's second defect moved in the same commit, deliberately.** Batch 11a quantified the
5.32× and refused to patch it, because the missing `F` pulls the other way — the solver was
substituting 0.9 against a volume that is itself apparent, and pinning it at 1 (correct, and
supported by *"the ordinary preparation was completely absorbed"*) makes the uncorrected
reading 10 % **worse**. Fixing either alone would have been the atracurium mistake. It now
renders ~0.485 mmol/L for a single 900 mg dose against a therapeutic 0.6–1.2 — right order,
and no longer above the toxicity threshold.

**tenofovir's dose range was mixing two salt bases:** its lower bound of 245 was the same
tablet expressed as tenofovir *disoproxil* rather than as its *fumarate*. Normalised to 300.
Its stored `F` 0.25 is the label's absolute bioavailability of tenofovir **from** the
prodrug, defined molar-equivalently, so it **composes** with the fraction rather than
double-counting. Its remaining volume defect is unchanged and still logged.

### The new lint caught one immediately

`dose.salt-moiety-unset` fires on prose that affirmatively says the *doses* are a salt while
`pk[]` describes the base — deliberately narrow, because this catalog discusses salts
constantly and a rule firing on every mention would be ignored. It flagged
**tenofovir-disoproxil** on its first run, which is exactly the record batch 10 had
diagnosed and could not fix. Brompheniramine and chlorpheniramine did **not** fire: their
salt finding lived in this file rather than in the record, which is the rule behaving
correctly and is now moot since both are self-documenting.

**Still open in this class:** ≥29 records discuss a salt-vs-base distinction in prose. Only
the four above have been verified end-to-end (dose form → formula → analyte). The rest need
the same check, one at a time — the fraction is cheap, but asserting *which* salt a dose
block means is not.

## `ki_uM` is not a Ki — `ki_basis` and the calibration invariant (2026-09-08)

Schema: `InteractionKinetics.ki_basis` / `auc_ratio` / `assumed_perp_uM`.
Lint: `interactions.ki-calibration-mismatch` (ERROR),
`interactions.ki-calibration-incomplete` (ERROR), `interactions.ki-basis-unstated`.
Data: `scripts/authoring/2026-09-08-ki-calibration-basis.ts` — 21 edges, 5 perpetrators.

The field is documented as *"a published Ki against the dominant clearance enzyme of the
victim."* **Almost none of the 120 stored values is one.**

### Found by algebra, not by reading

A screen inverted every edge quoting a clinical fold-change — `I = ki_uM × (auc_ratio − 1)`
— and asked whether `I` is constant *within* a perpetrator block. **It is, to two decimals,
block after block:**

| perpetrator | assumed [I] | edges reconstructing |
|---|---|---|
| itraconazole | 0.5 µM | 5 of 8 |
| paroxetine | 0.2 µM | 7 of 7 |
| cimetidine | 5.0 µM | 4 of 4 |
| trimethoprim | 3.0 µM | 3 of 3 |
| aprepitant | 1.5 µM | 2 of 2 |
| gemfibrozil | 35 µM | 6 of 7 (deleted in batch 10) |

Some notes write the arithmetic out loud — *"Ki ≈ 0.2/1.38"*, *"Ki ≈ 1.5/0.47 = 3.19"*.
**Every edge in these blocks cites a clinical DDI study; not one cites an in-vitro Ki.**

### The calibration is mostly sound — which is why deleting would have been wrong

The solver computes an exposure ratio of `1 + Cp/Ki`, so `ki = I/(R−1)` reproduces the
published `R` **exactly when Cp = I**. Testing each block's `I` against that perpetrator's
own modelled plasma level:

| perpetrator | assumed [I] | model mean Cp | ratio |
|---|---|---|---|
| itraconazole | 0.5 | 0.53 | **0.94× — essentially exact** |
| trimethoprim | 3.0 | 3.57 | 0.84× |
| fluconazole | 30 | 41.2 | 0.73× |
| cimetidine | 5.0 | 1.63 | 3.1× high (0.65× of Cmax) |
| paroxetine | 0.2 | 0.054 | 3.7× high |
| **gemfibrozil** | 35 | 15.1 | 2.3× — and independently proved to be the **glucuronide's** K_I: foreign |

So these are **calibrations to a typical exposure**, not fabrications — a defensible way to
carry an interaction whose in-vitro constant is unpublished or unusable, since the
fold-change is what the papers actually report. Deleting them would remove real and
clinically important magnitudes (itraconazole + simvastatin is contraindicated). **Only
gemfibrozil's constant was foreign, and only gemfibrozil's was deleted.**

**The defect is the label, not the number:** a calibration sitting in a field documented as
a measurement, cited to a PMID that contains no Ki, with the dose-response away from the
assumed exposure silently unanchored.

### What changed

All three inputs are now stored, the basis is declared, and **data-lint ERRORS if `ki_uM`
does not reproduce `assumed_perp_uM / (auc_ratio − 1)` to within 2 %** — a machine-checked
invariant rather than a comment. `ki_uM` was recomputed *exactly* from each verbatim ratio,
so a stored value now reflects its own cited source rather than a rounded intermediate.
**The guard was verified by deliberately breaking two edges and confirming both errors fire**
before restoring.

### Recorded, not converted

- **itraconazole → simvastatin / midazolam / cyclosporine** imply ratios of 3.9, 4.8 and 1.3
  against cited figures of ≥10-fold, 10–15-fold and ~2-fold. They look deliberately
  **attenuated** — a tenfold clearance collapse is a violent thing to render — but that is a
  guess, and an undocumented cap is its own defect. The script **refuses to relabel an edge
  whose arithmetic does not close** (it throws), so these could not be silently swept in.
- **paroxetine's `I` is 3.7× above its own modelled mean**, so the model *under*-produces
  these interactions at typical dosing — worth stating, since paroxetine is a mechanism-based
  inhibitor whose real effect is if anything larger than a static calculation gives. Every
  paroxetine edge is already flagged `mbi`, which is consistent with the clinical
  fold-changes and inconsistent with treating the number as a reversible affinity; declaring
  the basis makes that tension visible instead of hidden.

**Still open: 99 of 120 edges across 25 perpetrators.** The largest untouched blocks are
fluconazole (12), fluvoxamine (9) and ritonavir (8). Most of their notes quote a clinical
ratio but not in a form the screen could parse, so each needs the same read-then-invert
check. The method is now mechanical and the invariant is enforced, so these are a batch of
transcription rather than of judgement.

## The solver default stored as a datum — `V_L: 35` (2026-09-08)

`scripts/authoring/2026-09-08-defaulted-volume-sweep.ts`. 29 route rows across 24 records
stored **`V_L: 35`, which is the solver's own default** (0.5 L/kg at the 70 kg reference).
**Every one carried a `source_pmid`.**

**This is the batch-11 finding running backwards.** There, a deletion silently became a
default. Here a default had silently been promoted to a datum — the more insidious of the
two, because a stored number carries a citation and reads on every surface as though someone
measured it.

**I fetched all 22 citations. Four state a volume at all, and none states 35 L.**

| record | what its own citation says | action |
|---|---|---|
| **pramiracetam** | *"the mean apparent volume of distribution (1.82-2.94 L/kg)"* = **127–206 L** | 35 → **135**; the stored value was **4–6× below the bottom of its own cited range** |
| **nac** | *"volume of distribution (VSS) was 0.47 l.kg-1"*, *"plasma clearance was 0.11 l.h-1.kg-1"* | 35 → **66.7**, plus `F` 0.07 → **0.091** |
| **hydroxocobalamin** | *"The apparent volume of distribution is 0.45 ± 0.03 L/kg"* | 35 → **31.5** |
| **tocotrienols** | *"volume of distribution (Vd/f, mg/h) 0.34"* — a volume in mg/h | **stripped to `mixture`** |

- **nac** additionally had a bioavailability matching *neither* arm of a two-arm paper: its
  citation reports reduced NAC (Vss 0.59 L/kg, F 4.0 %) and **total** NAC (Vss 0.47, F 9.1 %)
  separately, the stored t½ 6 h identifies the total arm, and the stored 0.07 sits between
  4.0 and 9.1 like a blend of two arms.
- **pramiracetam** is the awkward one: *every* parameter in that paper is a range and none is
  a point value, so nothing is directly storable. The replacement is a declared derivation
  (the clearance at the stored half-life) whose one virtue is a real cross-check — **it lands
  inside the independently stated volume range, which the stored value did not.** A range
  interior would normally be refused; the alternative was a number outside the range entirely.
- **tocotrienols** reports each isomer separately (*"Similar results … for γ-tocotrienol,
  β-tocotrienol, α-tocotrienol"*), so no single curve describes the product, and the stored
  t½ 4 h is not the 2.74/2.68 h the abstract gives for δ-tocotrienol either.

### Why deleting the other 23 is safe here and was not in batch 11

Batch 11's rule — *deleting a value does not silence a record, it makes it assert the
default* — **does not apply when the stored value IS the default.** Removing a 35 is
numerically a no-op: `resolvePk` substitutes 0.5 L/kg and `scalePkForWeight` then treats both
identically.

**Verified rather than asserted:** resolving every affected row through `pkParamsForRoute`
before and after gives **identical `V_L`, `F`, `ka_hr` and `ke_hr` on all 23 rows, 0
differing.** What changes is that the records stop claiming measurements they do not have,
and `pk.defaulted-volume` begins counting them (37 → 39 warnings; that rule is scoped to
records carrying occupancy rows, so most of the 23 are counted only in the catalog-level
aggregate).

Dropped: catechin, epicatechin, aniracetam, ascorbic-acid (×2), biotin, creatine, daidzein,
fluconazole (×2), folic-acid, genistein, methylfolate, lutein, melatonin (×2), nr,
procyanidin-b2, silymarin, theophylline (×2), tocopheryl-acetate, gamma-tocopherol.

**Two of those deserve re-sourcing rather than a blank**, and are flagged for it: theophylline's
0.5 L/kg is genuinely its textbook volume, and fluconazole's true value is nearer 0.7 L/kg —
both were right or nearly right by coincidence, and neither is in the cited abstract.
**fluconazole's half-life is acquitted in passing:** 36.7 h is verbatim and is correctly
*"Group 1"*, the normal-renal-function arm of a renal-failure study.

## `ki_basis`, batches 2–4 (2026-09-08) — 85 of 120 edges declared

Scripts `…-ki-calibration-basis-2/3/4.ts`. **120 edges: 76 `calibrated_from_auc`,
9 `in_vitro`, 35 still undeclared.**

### Two blocks are genuine measurements — the field's actual contract

- **ajmalicine (8 edges) — ACQUITTED.** All eight carry the same value because they cite the
  same thing: *"a potent in-vitro CYP2D6 inhibitor (Ki 3.3 nM)"*. **A Ki belongs to an
  enzyme, not to a victim**, so one CYP2D6 constant legitimately applies to every CYP2D6
  substrate — the repetition that made the screen flag this block is correct pharmacology,
  not a template.
- **ketoconazole → alprazolam** is verbatim: *"Ketoconazole was a potent inhibitor of ALP
  metabolism in vitro (Ki = 0.046 microM)"*. **Its other five edges are not**, and were left
  alone rather than relabelled on a guess: two take 0.015 from a verbatim *range* of
  0.011–0.045 µM — and **the nifedipine note calls that value "(midpoint)" when the midpoint
  of that range is 0.028** — one takes 0.015 from *"IC(50) values less than 0.02 microM"*,
  an **inequality**, and an IC50 is not a Ki.

### Blocks that reconstruct

| perpetrator | assumed [I] | converted | note |
|---|---|---|---|
| fluconazole | 30 µM | 11 of 12 | most notes print the arithmetic |
| fluvoxamine | 0.16 µM | **9 of 9** | ratios span 1.55 → 128 on one constant |
| ciprofloxacin | 7.5 µM | **5 of 5** | derived from three *different* kinds of reported quantity |
| amiodarone | 2 µM | 5 of 6 | |
| clarithromycin / erythromycin | 3 µM each | 4 of 5 each | two macrolides sharing a constant — a choice, not a measurement |
| ritonavir | **5 µM and 1.5 µM** | 5 of 8 | see below |
| posaconazole | 2 µM | **3 of 3** | |
| quinidine, voriconazole, verapamil, bupropion, terbinafine | 1.5 / 8 / 0.5 / 1 / 3 | 9 total | partial blocks |

**ritonavir is deliberately two-tiered and right to be.** Its notes distinguish full-dose
ritonavir (5 µM) from the 100 mg **booster** dose (1.5 µM) and calibrate each edge to the
regimen its own source studied. Those are genuinely different exposures of the same drug, so
a single block constant would have been *cruder*; the per-edge `assumed_perp_uM` records what
the prose was carrying alone.

**erythromycin → simvastatin identifies its own arm:** it does not fit the 6.2-fold
parent-drug ratio its note leads with, but fits the **3.9-fold simvastatin *acid*** ratio in
the same sentence — the author calibrated to the active acid, which is the right species.

### Blocks that do NOT reconstruct, and were left visibly undeclared

- **diltiazem** — its four edges imply 0.35, 0.27 and 0.50 µM. **No constant fits**, unlike
  its sibling verapamil (0.5 µM on two of three). Untouched.
- **fluoxetine** — two edges imply 1.0 and 7.7 µM, a sevenfold disagreement inside one block.
- **quinidine → digoxin** and **amiodarone → digoxin** both fail *and* are
  **P-glycoprotein**, not enzyme inhibition — a competitive-affinity field there is a
  borrowed shape regardless of the number in it.
- **voriconazole → tacrolimus and → alfentanil** both imply a 9-fold rise neither source
  states (6.02× and 6.67×) — two independent edges adjusted to the same wrong place, which is
  suggestive but not a finding.

**The attenuation pattern now spans three blocks** (itraconazole, ritonavir, fluconazole →
warfarin): the edges that refuse to reconstruct are disproportionately the *largest*
fold-changes — but two are attenuated and one is amplified, so hand-adjustment remains a
guess. **The script throws rather than relabel an edge whose arithmetic does not close**, so
a block can be half-converted and the rest stays visibly undeclared instead of being quietly
rounded into agreement.

**One implementation note worth keeping:** the first pass rounded the recomputed constant with
`toFixed(4)`, which is too coarse for a sub-nanomolar Ki — fluvoxamine → ramelteon
(0.16/127) rounded to 0.0013 and then **failed the 2 % invariant against itself**. The lint
caught it immediately; both scripts now use `toPrecision(6)`.

## The template `ka` sweep (2026-09-08) — the default removed, the rest counted

`scripts/authoring/2026-09-08-template-ka-sweep.ts`, plus a new `pk.template-ka` lint rule.

**621 extravascular route rows. 276 carried a `ka_hr`; 345 already defaulted silently. Of
the 276, twelve values accounted for 152 rows** — 1.0 on 31, 0.5 on 23, 1.5 on 22, 0.8 and
1.4 on 14 each, 2.0 on 12 — across compounds with nothing in common but an author reaching
for a plausible number. **The absorption rate is the most template-prone field in the
catalog**, because a plausible `ka` is easy to invent and almost nothing downstream
contradicts it.

### Only one bucket was touched, and deliberately so

`resolvePk` substitutes `ka_hr ?? 1.0`, so **a stored 1.0 is the default** — the same shape
as `V_L: 35`. 30 rows dropped it; **verified a no-op across the whole catalog**: resolving
all 777 route rows through `pkParamsForRoute` before and after gives identical `ka_hr`,
`V_L`, `F` and `ke_hr`, **0 differing**.

**The other 121 rows were not touched.** 0.5, 1.5, 0.8, 1.4 and 2.0 are *not* the default, so
deleting them would move every one of those curves toward 1.0 — the batch-11 trap, where a
deletion silently becomes a default further from the truth. They need sourcing one record at
a time.

**One row kept in the 1.0 bucket:** gemfibrozil's, authored in batch 10 paired with a
reasoned `lag_hr` of 0.75 to reproduce an observed peak the bare default renders 35 minutes
early. Deleting it would orphan the lag. Any row carrying `lag_hr` or `zo_dur_hr` is exempt
for the same reason — an absorption block authored as a unit must not be half-removed.

**None of the five records whose notes mention `ka` actually justified 1.0** — they discuss a
Tmax mismatch, a dropped value, or slow absorption *contradicting* it. Checked individually
before deleting.

### The new rule names the remaining debt

`pk.template-ka` fires on a `ka` shared by **≥5 unrelated identities under ≥5 different
citations** — well past coincidence, since real absorption rates are fitted to a Tmax and
land on untidy numbers. It excludes 1.0 (swept above; storing it asserts nothing that
omitting it does not) and reuses the quartet rule's identity-collapsing so salt families
don't count.

It fires **11 times, covering 120 rows**: 0.5 (23), 1.5 (22), 0.8 (14), 1.4 (14), 2.0 (12),
0.3 (7), 0.6 (7), 1.2 (6), 2.5 (5), 0.7 (5), 3.0 (5). The existing `pk.template-quartet` rule
needs `ka`, `V` and `F` to match *together* and now fires nowhere — a strong signal, and
therefore too narrow to see this.

**After the sweep: 246 of 621 extravascular rows carry an authored `ka`, 375 default.** That
375 is the honest number, up from 345.

## `fu_note` without a value — recording a decision instead of a gap (2026-09-08)

`scripts/authoring/2026-09-08-fu-examined-declined.ts`, plus a `pd.occupancy-needs-fu` fix.

`pd.occupancy-needs-fu` fired on 37 records. **At least one was not a gap at all.**
eplerenone's free fraction was examined in an earlier pass and skipped **on its source's own
words** — *"Plasma protein binding was moderate (33-60%) but **concentration-dependent** over
the therapeutic concentration range"*. A single scalar can represent neither a range nor a
binding that moves with concentration, and a range midpoint stored as a measurement is a
confirmed defect class here. **Declining to author one is the correct answer, not a missing
one.**

**That reasoning was sitting in prose `notes`, where the rule cannot read it**, so the lint
re-reported a settled question every run — and a warning that cannot be resolved by doing the
right thing is one authors learn to ignore.

All 177 records with an `fu_note` also had a `fraction_unbound`; the examined-and-declined
state had **no representation**. It does now: `fu_note` set *without* a value means the
question was asked and answered, and the rule stays quiet. Documented on the field itself so
the next author finds it. **37 → 36.**

**The other 36 are genuine gaps and a batch of their own** — each needs a verbatim
plasma-protein-binding figure, which the abstracts checked for the albumin-acylated peptides
(semaglutide, tirzepatide, retatrutide) do **not** contain, even though their own prose says
albumin binding is the entire molecular design. Those three matter most: an fu near 0.01
would move their occupancy curves by two orders of magnitude.

## `fraction_unbound` decisions moved into the data (2026-09-08) — 36 → 24

`scripts/authoring/2026-09-08-fu-decisions.ts`. Two values authored, ten declines recorded.

**The answer for most of these was already known.** An earlier `fraction_unbound` batch
examined them, chased the literature, and recorded **in this file** that a scalar is
*indefensible* rather than merely unfound. That reasoning never reached the data, so
`pd.occupancy-needs-fu` has been re-reporting settled questions ever since. With `fu_note`
now able to hold a decision, they are moved where the rule can read them.

### Authored — the two I could establish verbatim

**quinidine 0.228** and **quinine 0.094**, from one head-to-head study (PMID:8471402, added
to both records' refs): *"quinidine was less bound to plasma proteins (% free drug: 22.8
[15.4-47.2] vs 9.4 [7.3-15.0]%, P < 0.01)"* — 8 healthy Thai males, IV 10 mg/kg each,
one week apart. **Stated medians, not computed midpoints.** Two caveats carried into both
notes: the ranges span roughly twofold, and binding is largely to α₁-acid glycoprotein,
which **rises in the acute-phase response** — so in the malaria patients these drugs are
actually used against, fu is *lower* and the stored correction under-corrects.

### Declined — with a specific sourced reason each

| record | why a single number would be a fiction |
|---|---|
| **linagliptin** | *"concentration-dependent protein binding … (99% at 1 nmol/L to 75-89% at >30 nmol/L)"* — saturation on its own target, and the therapeutic steady-state Cmax of 11–12 nmol/L sits **inside the transition** |
| **cortisol** | fu 0.085 at 08:00 vs 0.053 at 22:00 — a **1.6× swing across an ordinary day**, before any stress response. For a hormone whose point is a diurnal rhythm, a scalar is a category error |
| **mifepristone** | AAG binding **saturates within** the therapeutic range; metabolites circulate near parent levels while retaining receptor affinity |
| **montelukast** | its own methods literature: *"only a range of fu can be reported with confidence"* |
| **irbesartan** | *"a large discrepancy … obtained from two different non-associated laboratories"* |
| **olanzapine** | the familiar "90%" is **albumin-only** (*"albumin (90%) and alpha 1-acid glycoprotein (77%)"*) — two isolated-protein figures, not total binding |
| **progesterone** | every free-fraction figure found is **rat** |

### The acylated peptides — where the correction might be *backwards*

**semaglutide, tirzepatide, retatrutide.** Their engineered fatty-acid chains bind albumin
**by design** — that binding *is* the once-weekly half-life. Potency assays for acylated
incretin analogues are routinely run **with 1–2% albumin present**, precisely because of it,
so a stored EC50 may **already** be albumin-shifted; dividing by fu would then double-count
the same binding and **under**-predict occupancy by roughly two orders of magnitude.
`basis: 'in_vitro_ki'` silently assumes a protein-free assay, which for these is unverified.
**Not merely unmeasurable — the correction could point the wrong way.**

**retatrutide was not part of the original finding and is included by extension, stated
rather than hidden:** its own prose describes the same anchor (*"a C-20 fatty diacid linker
on Lys(17) … that binds albumin"*), so the mechanism argument transfers, but the inference
is mine.

### The 24 that remain are honest gaps

7-hydroxymitragynine, cariprazine, cbg, citalopram, clonidine, desmopressin, exenatide,
fexofenadine, fludrocortisone, fluphenazine, ghrp-2, glycine, isoflurane, lsd, nalbuphine,
prednisolone, promethazine, scopolamine, sevoflurane, suvorexant, tasimelteon, taurine, cbn,
psilocin.

**No value was invented to close them.** All 110 PMIDs these records already cite were
fetched and searched for a binding figure: **four hits across 110 abstracts**, two of which
became the quinidine/quinine pair and one the linagliptin decline. Targeted searches for six
more (montelukast, olanzapine, mifepristone, fexofenadine, citalopram, irbesartan) returned
methodology and DDI-prediction papers, not measurements.

**Two sub-groups here probably need a different answer than a number.** The inhaled
anaesthetics (isoflurane, sevoflurane) are governed by blood:gas and tissue partition rather
than plasma protein binding, and the endogenous small molecules (glycine, taurine) are
essentially unbound — for both, `basis: 'in_vitro_ki'` may be the wrong frame rather than
`fraction_unbound` being the missing field.

## Cluster A (2026-09-08) — the data was mostly fine; the rules were not

Expected a data batch, found a tooling one. Of 16 warnings, **four were false positives and
one message was factually wrong.** One record needed an actual fix.

### Three rules had independently grown the same bug

The catalog's prose is largely a **record of decisions**, so a rule that reads prose must
separate a decision's *subject* from its *outcome*. Three rules didn't, and each therefore
flagged the **best-documented** records:

| rule | what it read | what the note actually said |
|---|---|---|
| `effect.species-in-note` | (fixed earlier today) | notes recording the animal study they **replaced** |
| `pk.prodrug-analyte-unstated` | valsartan "converts to an active species" | *"**no** active metabolite (unlike losartan)"* — the rule matched the phrase its own sentence negates |
| `pk.prodrug-analyte-unstated` | aripiprazole, hydroxychloroquine | a **rejected** citation for the lauroxil *prodrug*; a **salt** conversion ("converted to base … rather than") |
| `effect.approx-in-note` | sufentanil admits its kₑₒ is an estimate | my own batch-10 note describing the estimate it had just been corrected **away from** |

Fixed once, not four times: a shared `assertsOfThisRecord(sentence)` = not `SUPERSEDED` and
not `NEGATED`, applied per sentence. The species rule already had half of it; the other two
now use the same helper. **119 → 115 warnings, with no data touched for three of the four.**

### `pd.needs-solvable-pk` was overstating its symptom — I checked the consumers

The message claimed *"Ce(t) and every occupancy curve render identically zero"* for 12
records. **That is not what happens.** All four consumers guard:

- the **compound page** renders a static affinity table (emax / Kᵢ / EC₅₀), which needs no PK;
- the **receptor page** sweeps a *synthetic* Ce range for its dose-response curve and never
  touches the compound's PK;
- `routes/library/receptors/[key]/+page.svelte` — `if (!ceCurve) continue`;
- `lib/today/predictors.ts` — `if (!cp) return null`.

So nothing renders a false zero. The real cost is narrower and now stated exactly: **the
time-course half of this data can never be used.** That matters because a warning that
overstates its symptom is one authors learn to discount — and these 12 include eight
deliberate `pk_unauthored` strips whose occupancy rows are sound, sourced, and correctly
displayed. **No data was deleted.** Deleting sourced receptor pharmacology to silence a
rendering claim that was untrue would have been the worst available move.

### The one true positive

**aripiprazole → `pk_analyte: 'parent'`.** Its citation measures two molecules — *"the
pharmacokinetic parameters for plasma concentrations of aripiprazole **and its active
metabolite dehydro-aripiprazole**"* — and the stored bioavailability is unambiguously the
parent's (*"absolute bioavailability of aripiprazole following oral and intramuscular
administration were 0.85 and 0.98"*, and 0.85 is what the oral route stores).

**What that does not fix, and the note says so:** dehydro-aripiprazole carries a substantial
share of steady-state exposure with a longer half-life, so a parent-only curve understates
the active material — **the occupancy rows on this record are driven by the smaller half of
the pharmacology.** Logged rather than modelled, since a metabolite chain needs a formation
fraction this abstract does not state.

## `pk.defaulted-volume` is a standing caveat, not a backlog (2026-09-08)

Cluster B opened on the 39 `pk.defaulted-volume` warnings expecting to fill volumes. **The
premise was wrong in the opposite direction from cluster A: the rule is right, but the
warnings are not a task list.**

### Every record it names has already been audited, and the volume is absent *because* of that

My first screen said 16 of the records had notes "silent" about a volume. **That test was too
crude** — it grepped for the word, and the notes use other words. Checking them individually,
**all of them carry a substantial audit note, and several record exactly why the volume went:**

| record | what the audit found |
|---|---|
| **triazolam** | *"V 77 L was the study subjects' **mean body weight of 77 kg**"* |
| sotalol | *"V 126 L is the **EXACT MIDPOINT** of a review"* range |
| sulindac | *"V 15 L is **unsourced** and no intravenous study exists"* |
| pregabalin, melatonin | the **solver default** wearing a citation |

**The count rising is the audit working.** Removing an unsourceable volume moves a record from
"asserting a number nobody measured" to "declaring a gap", and this rule is what makes the
second state visible. Closing it by inventing numbers would undo the whole exercise.

### Today's attempt to fill some, and why it failed honestly

I fetched all 54 PMIDs cited by the eleven most likely candidates. **Three volumes turned up
and not one was usable in the record's own population:**

- **doxazosin** — two sources disagree: *"volume of distribution (1.0 to 1.9 liters/kg)"* (a
  range) versus *"3.4, 3.4, and 3.6 L/kg"* in **hypertensive patients** at t½ ≈ 19 h. The
  record's stored t½ 12.6 h is verbatim and correctly the **healthy-volunteer** subgroup, so
  adopting the patient volume would mix populations — the defect this audit spends most of its
  time removing.
- **lidocaine** — *"Vd area 0.71 L/kg"* comes from an anaesthesia study whose adult terminal
  half-life is **43 min**, against the record's 1.66 h from a different source. Coherent only
  if the half-life moves too, i.e. a re-authoring rather than a fill.
- **zonisamide** — a population fit gives *"clearance (CL) was 23.25 L/h, the volume of
  distribution of the central compartment (Vc) was 34.50 L"*. **Vc is the wrong volume** for a
  one-compartment model (the trastuzumab lesson) and summing Vc+Vp is also wrong (the
  remdesivir lesson), while CL/ke at the stored 63 h half-life gives an implausible 2113 L —
  the three numbers do not reconcile, so none is storable.

**Nothing was authored.** That is the correct outcome under the accuracy standard, and it is
worth recording so the next pass does not re-run the same fetches.

### The message now states the bias direction, measured from the catalog

It used to call the scale "arbitrary". It isn't arbitrary — it is **wrong in a consistent
direction, by a measurable amount**. Of 609 authored `V_L` rows, **73% exceed 35 L and the
median is 87 L — 2.5× the default.** So a defaulted record understates volume, overstates Cp,
and **biases occupancy HIGH**, most likely by roughly the ratio of the true volume to 35 L.

That is the same one-sided-error framing the `fraction_unbound` batch used, and it makes the
warning useful as a **reliability annotation** rather than a chore: a reader now knows which
way the number is wrong even when nobody can say by how much.

### And `pd.needs-solvable-pk` closes too — all 12, not 8

An older backlog entry called four of the twelve **re-authorable** (alogliptin, nilotinib,
enzalutamide, tolterodine). **That entry predates their audit and is wrong.** Each now carries
a decisive `pk_unauthored` reason, and none admits a scalar:

- **alogliptin** — its F was a **two-step digit collision**: the only candidate numeral traces
  to *"mean fraction of drug excreted in **URINE** … 60%-71%"*, stored as bioavailability, then
  taken as a midpoint. Its volume and half-life appear in no alogliptin abstract at all.
- **nilotinib** — no human IV form exists, the literature says only that 31% is *"assumed"*,
  and **food moves exposure 50–182%**, which defeats a scalar `F` outright.
- **enzalutamide** — **two co-equal analytes**: *"AUC0-inf of enzalutamide plus M2 was 828
  µg·h/mL versus 368 µg·h/mL for enzalutamide alone."* A single curve cannot be both.
- **tolterodine** — bioavailability *"ranged from 10 to 70%"* **because that range IS the
  CYP2D6 split**, and the acting species is a parent-plus-metabolite sum with *opposite*
  genotype dependence.

So this rule joins `pk.defaulted-volume`: a **standing state**, not a task list. The occupancy
rows on these records are real pharmacology, correctly displayed as affinity and
dose-response, and only their time-course is unavailable — which is what the corrected message
now says.

## A reported regression, and the 41-row class behind it (2026-09-08)

**Reported from the app: retatrutide's curve peaks at ~5 h where it used to peak at ~4 days.**
Real, reproducible, and traced — **not** to any of this session's commits (its `pk` block is
byte-identical across all nine) but to **`0f5fc98`, the peptide-category audit of 2026-09-06**,
which removed `ka_hr: 0.02`.

### The remedy was wrong, not the diagnosis

0.02/h appears in no abstract — true. But **removing an absorption rate does not leave the
record without one**: `resolvePk` substitutes 1.0/h. For a once-weekly subcutaneous depot that
is **50× too fast**, and it moved the modelled peak from 93.8 h to 5.4 h. Exposure never
changed (`AUC = F·D/(V·ke)` has no `ka` in it); **the shape broke**, which for a depot product
is the entire point of the formulation.

**The removing note contains the misconception, and it is subtle enough to name:** it called
0.02 *"a registry-wide default"*. It was a value **repeated across peptide records** — which is
not the same thing as the value the **solver** falls back to. Deleting the former hands you the
latter, and here they differ 50× in opposite directions. This is the batch-11a finding
(*"deleting a value doesn't silence a record, it asserts the default"*) occurring **at scale,
three days before that rule was written down**.

**That same commit stripped `ka` from 7 of 8 rows** across retatrutide, semaglutide,
tirzepatide, dulaglutide, cjc-1295, octreotide, lanreotide and cetrorelix in one pass.

### The class: 41 extravascular rows with no `ka` and a half-life ≥ 48 h

Every one renders its peak at the 1.0/h default — and because Tmax grows only
*logarithmically* as `ke` falls, **the whole class collapses into a 4.3–7.0 h window
regardless of half-life**:

| record | t½ | Tmax as rendered |
|---|---|---|
| fremanezumab | 31 d | 7.0 h |
| olanzapine (IM depot) | 30 d | 7.0 h |
| risankizumab, galcanezumab, secukinumab | 27–28 d | 6.8–6.9 h |
| denosumab, omalizumab, dupilumab, erenumab, ustekinumab | 21–26 d | 6.6–6.8 h |
| adalimumab, ixekizumab, golimumab, evolocumab, certolizumab | 12–14 d | 6.0–6.2 h |
| nandrolone (IM), octreotide, cjc-1295, semaglutide, **retatrutide** | 6–10 d | 5.4–5.9 h |
| dulaglutide, tirzepatide, boldenone (IM), phenobarbital | 4–5 d | 5.2 h |

Real SC monoclonal Tmax is **6–14 days**; olanzapine pamoate peaks around a week. **The model
shows every one of them peaking before lunch.** The error is bounded — exposure is untouched
and the curves converge within a couple of days, so weekly steady-state dosing is barely
affected — but for a single dose, which is what the compound page draws, the shape is wrong on
exactly the products whose depot behaviour is the reason they exist.

### What was fixed here, and what deliberately was not

**retatrutide's `ka` restored to 0.02, declared an estimate.** No indexed abstract states a
retatrutide Tmax — its three cited papers and an `LY3437943 pharmacokinetics` search give none
— so this is a choice **between two unsourced numbers with no null option**, because the solver
uses 1.0 whether or not anyone decided that. 0.02 is restored because its implied 3.9-day peak
is in the right regime for a weekly acylated depot and 1.0/h is not.

**`V_L: 7` was NOT restored.** A later commit (`791c095`) established that the 7 L figure was
plasma volume shared by 13 unrelated records and wrong for this class, and volume does not
affect the peak time at issue. That gap stays visible under `pk.defaulted-volume`.

**The other 40 rows are NOT bulk-restored.** Restoring forty unsourced values in one sweep is
the same move that caused this. Unlike retatrutide, **most of this class should be sourceable**:
SC monoclonals routinely report a median Tmax in days, and `ka` follows from a verbatim Tmax and
the stored `ke` by solving `ln(ka/ke)/(ka−ke) = Tmax`. That is a real batch and it is the
highest-value compound work now outstanding — it fixes a user-visible defect on ~40 products
with genuinely citable numbers.

### The class fix — 9 authored, 1 acquitted, 31 still open

`scripts/authoring/2026-09-08-slow-absorption-ka.ts`. 41 → 31 rows.

**`ka` is derived from a verbatim Tmax, which is arithmetic rather than estimation.** With
`ke` fixed by the stored half-life, `ln(ka/ke)/(ka−ke) = Tmax` inverts uniquely for `ka > ke`.
Each result is verified by substitution — all nine reproduce their target Tmax to within 0.1 h
— and the script throws if one doesn't, or if the requested Tmax exceeds the `1/ke` ceiling.

| record | verbatim Tmax | peak: was → now |
|---|---|---|
| denosumab | *"median time to Cmax (tmax) was 8 days (serum)"* | 6.8 h → **192 h** |
| fremanezumab | *"Median Tmax (range 5-11 days)"* | 7.0 h → **120 h** |
| secukinumab | *"approximately 6 days after dosing"* | 6.8 h → **144 h** |
| ustekinumab | *"tmax) was 4.0-8.5 days"* | 6.6 h → **96 h** |
| evolocumab | *"Cmax (tmax) was 4.0 days"* | 6.2 h → **96 h** |
| etanercept | *"time to peak concentration at approximately 48 to 60 hours"* | 4.6 h → **48 h** |
| dulaglutide | *"median time to Cmax (tmax) of approximately 48 h"* | 5.2 h → **48 h** |
| semaglutide | *"a median tmax of 12-24 h"* | 5.5 h → **12 h** |
| perampanel | *"(tmax) was 0.75-1.0 h"* | 5.1 h → **1 h** |

**Ranges take the endpoint that under-corrects**, both endpoints in the note — the convention
the `fraction_unbound` batch set. Every record here is currently far too *fast*, so that means
the **shorter** Tmax: it moves the curve partway and cannot overshoot. **perampanel is the one
case where the default is too SLOW** (5.1 h against a sub-hour published peak), so the rule
flips and its longer endpoint is taken.

**Exposure is untouched throughout** — `ka` cancels out of `AUC = F·D/(V·ke)`. Only the shape moves.

### Three things caught by checking rather than assuming

1. **A shared-sentence transplant, avoided.** semaglutide's source reports two drugs together:
   *"Cagrilintide … had a half-life of 159-195 h, with a median tmax of 24-72 h. Semaglutide
   2.4 mg had a half-life of 145-165 h, with a median tmax of 12-24 h."* **The 24–72 h belongs
   to cagrilintide.** Taking the first figure in the passage would have been the exact defect
   this audit keeps finding.
2. **secukinumab's abstract disagrees with itself 2.1×.** It states both *"an absorption rate
   of 0.18/day"* and a peak at *"approximately 6 days"* — but 0.18/day implies a **12.6-day**
   peak. The verbatim `ka` is one parameter of a **two-compartment population fit**, and lifting
   such a parameter into a one-compartment slot is the error already documented on propofol's
   keo. The observable was used and the conflict recorded on the record.
3. **I nearly attached four fabricated citations.** Four PMIDs in the first draft were inferred
   from context rather than read — etanercept, dulaglutide, secukinumab and perampanel were all
   wrong. Extracting the real ids from the fetched abstracts gave 15831771, 34787823, 28273356
   and 36746851, and all nine were then confirmed to resolve. **`registry:verify` rose 2475 →
   2480, so the gate would have caught a dead id — but not a live id attached to the wrong
   paper.** That failure mode is only caught by reading.

### brexpiprazole — acquitted, and worth recording

Its citation states *"tmax and the mean elimination half-life of brexpiprazole were 4-5 and
52-92"* hours, and the solver's default renders **4.9 h — inside the published range**. Nothing
was authored: storing 1.0/h would assert a measurement where a coincidence is the honest
description, and the value already in use is correct.

### The 31 still open

No Tmax turned up for them in either the records' own 98 cited abstracts or targeted searches:
adalimumab, alirocumab, certolizumab-pegol, erenumab, galcanezumab, golimumab, guselkumab,
ixekizumab, omalizumab, risankizumab, dupilumab, tirzepatide, cjc-1295, octreotide, lanreotide,
cetrorelix, olanzapine (IM depot), nandrolone (IM), boldenone (IM), phenobarbital, and the
oral tail. **These are still rendering their peaks at 4–7 h and should not be left there** —
but they need a source each, and inventing one is what caused the original regression.

### Second pass: 2 more authored, 29 counted rather than filled

`scripts/authoring/2026-09-08-slow-absorption-ka-2.ts`, plus a new
`pk.defaulted-ka-slow` rule. **41 → 29.**

**The search largely failed, and that is the result.** Twenty-seven targeted searches across
three groups — the remaining monoclonals, the depot injectables, the oral tail — on top of the
98 abstracts these records already cite. **Two usable peak times came back.** The rest either
name Tmax as a parameter without giving a value, report it qualitatively (*"higher and earlier
peaks with the phenylpropionate ester"*), or have no abstract-level PK at all. **For
monoclonals, Tmax is overwhelmingly a label and full-text figure rather than an abstract one**
— the same wall the `fraction_unbound` work hit.

| record | verbatim Tmax | peak: was → now |
|---|---|---|
| risankizumab | *"peak plasma concentration was reached approximately 3-14 days after dosing"* | 6.9 h → **72 h** |
| ixekizumab | *"median time to maximum observed ixekizumab concentrations occurred 2-4 days after dosing"* | 6.1 h → **48 h** |

risankizumab's source **independently corroborates its stored bioavailability** in the same
sentence (*"an estimated bioavailability of 89%"* against a stored 0.89) and its half-life.
ixekizumab's gives a half-life of 15–16 days against the record's 13 — a tension left alone,
since `ka` is derived against the **stored** rate constant, which is what the solver uses.

### One false lead worth recording

A tirzepatide search returned a phase 1 reporting *"The time to maximum observed drug
concentrations varied across cohorts (8-96 h)"* beside a 12-day half-life and once-weekly
dosing — a near-perfect fit for the record. **It is LY3537021, a different Lilly compound.**
Rejected by reading the title rather than the numbers, which is the only thing that catches
that class of error.

### The 29 that remain are now counted, not silent

New `pk.defaulted-ka-slow` fires per row and once in aggregate. It states the magnitude
directly — *"no ka and a 30.0-day half-life — the solver's 1.0/h default puts the peak at
7.0 h"* — and names the fix (`ln(ka/ke)/(ka−ke) = Tmax`) so the next pass knows exactly what
to look for.

**Scoped to t½ ≥ 48 h**, because below that the default is often defensible — **brexpiprazole
is the worked example: its verbatim Tmax of 4–5 h *contains* the 4.9 h the default renders.**

**Nothing was invented to close the 29.** Restoring a plausible absorption rate across a class
is exactly what produced the retatrutide regression that started this work.

### Third pass, from FDA labels — 10 authored, 2 acquitted. 29 → 19

`scripts/authoring/2026-09-08-slow-absorption-ka-labels.ts`, sourced through the DailyMed SPL
API.

**Why the source changed, and why it is not a lowered standard.** 27 targeted PubMed searches
across two passes returned four usable peak times. **For monoclonals Tmax is a label figure**
— it lives in section 12.3 and almost never reaches an abstract. A regulatory label is already
a first-class source in this schema (`RoutePk.source_label`, used by cobicistat, venetoclax and
everolimus), so this applies the standard the catalog already recognises where it is the only
place the number exists. Every quote is verbatim from the current SPL and every note records
the **DailyMed setid**, a stable identifier that survives label revisions where a PDF URL rots.

| record | verbatim from the label | peak: was → now |
|---|---|---|
| adalimumab | *"mean time to reach the maximum concentration was 5.5 days (131 ± 56 hours)"* | 6.1 h → **131 h** |
| omalizumab | *"reaching peak serum concentrations after an average of 7–8 days"* | 6.8 h → **168 h** |
| galcanezumab | *"the time to maximum concentration was about 5 days"* | 6.8 h → **120 h** |
| alirocumab | *"median times to maximum serum concentrations (t max) were 3-7 days"* | 6.4 h → **72 h** |
| golimumab | *"the median time to reach maximum serum concentrations … ranged from 2 to 6 days"* | 6.0 h → **48 h** |
| tirzepatide | *"the time to maximum plasma concentration … ranges from 8 to 72 hours"* | 5.2 h → **8 h** |
| fluoxetine | *"peak plasma concentrations … are observed after 6 to 8 hours"* | 4.4 h → **6 h** |
| azithromycin | *"T max =2.2 (0.9) hours"* | 4.6 h → **2.2 h** |
| anastrozole | *"the median T max was delayed from 2 to 5 hours … after food"* (fasted = 2 h) | 4.3 h → **2 h** |
| cetrorelix | *"t max median (min-max) [h] 1.5 (0.5-2)"* | 4.5 h → **1.5 h** |

**adalimumab's label corroborates the record twice more for free** — *"absolute bioavailability
… was 64%"* and a half-life *"ranging from 10 to 20 days"*, which contains the stored 13.
galcanezumab's states *"the elimination half-life is 27 days"*, matching exactly.

### The range-endpoint direction flips per record, so the script checks it

The convention is the endpoint that **under-corrects**. Most of this class is far too fast, so
that is the *shorter* Tmax — but **azithromycin, anastrozole and cetrorelix are the opposite**,
their defaults being too *slow*, so their under-correcting endpoint is the *longer* one. The
script computes what the default currently renders and **throws if the chosen target is within
0.2 h of it**, on the grounds that such a record belongs in the acquitted set rather than this
one. That guard is what surfaced the two acquittals below rather than my noticing them by eye.

### Two acquitted — the default is right

- **solifenacin** — *"peak plasma levels (C max) of solifenacin are reached within 3 to 8 hours"*
- **zonisamide** — *"peak plasma concentrations … occur within 2-6 hours"*

**The 1.0/h default renders 4.6 h for both — inside both ranges.** Nothing authored: storing a
number would assert a measurement where the honest description is that the default happens to
land correctly. With brexpiprazole that is **three records where the flagged default is right**,
which is exactly why the rule is scoped to long half-lives rather than to every missing `ka`.

### One trap, caught by reading the product name

olanzapine's label yields *"peak plasma concentrations occur within 15 to 45 minutes"* — but
that is **ZYPREXA IntraMuscular**, the short-acting agitation injection, described in the same
document as **ZYPREXA RELPREVV**, the pamoate depot whose 30-day half-life this record stores.
**Two products, one label.** Not authored.

### The 19 that remain

Mostly products with no US label (cjc-1295, pterostilbene, dpa, arachidonic-acid, boldenone —
research compounds, supplements and a veterinary ester), plus those whose labels state no Tmax
(dupilumab, erenumab, guselkumab, risankizumab's SKYRIZI, certolizumab, lanreotide, octreotide
LAR, cariprazine) and the olanzapine depot above. `pk.defaulted-ka-slow` counts them.

### Fourth pass, from PMC open-access full text — 41 → 12 open

`scripts/authoring/2026-09-08-slow-absorption-ka-fulltext.ts`. Three authored, one acquitted,
and the lint corrected to stop flagging records it had already been shown are correct.

**The most useful finding is that one of them was already there.** olanzapine's depot Tmax is
stated in **PMID:24815672 — the record's own cited source for that route.** The number was in
the paper the record already points at, in the **full text rather than the abstract**, and no
pass over abstracts could ever have found it. Worth stating plainly: **an abstract-only reading
of a citation is not a reading of the citation**, and three passes of this work assumed
otherwise.

| record | verbatim | peak: was → now |
|---|---|---|
| olanzapine (IM depot) | *"After injection of OLAI, the mean observed olanzapine plasma concentration … reached a peak on day 2"* | 7.0 h → **48 h** |
| erenumab | *"peak plasma concentrations are attained in approximately 5-6 days"* | 6.6 h → **120 h** |
| dupilumab | *"peak drug concentrations being achieved on average at 3-7 days after dosing"* | 6.6 h → **72 h** |

**erenumab's is a background statement, not that study's own measurement** — used because it
**cross-checks**: the galcanezumab half of the same sentence matches the EMGALITY label exactly
at 5 days, and its stated 27–28 day half-life range contains the record's 21. Recorded as such
rather than presented as a primary result. **olanzapine's precision is coarse** — a peak located
to a day, not an hour — and the note says so.

**Another shared-document trap, avoided.** The same PMC search returned *"a median T max of 12
min"*, which belongs to a different olanzapine product. The depot's figure had to be confirmed
by reading the surrounding paragraph, which establishes that OLAI is the long-acting injection
and that the measurement excludes carry-over from the prior oral dose.

**cariprazine acquitted** — *"reaching peak plasma concentrations (C max ) approximately 3 to 6
h post-dose"* contains the 4.7 h the default renders. Its note also carries a caveat the ka fix
does *not* address: the record models the parent, while its metabolite DDCAR has a far longer
half-life and accumulates over weeks.

### The rule was flagging records it had itself been shown are correct

Four rows — brexpiprazole, solifenacin, zonisamide, cariprazine — have a **published Tmax range
that contains what the default renders**. `pk.defaulted-ka-slow` was still firing on all four.
They are now an explicit allowlist in the rule, each with its verbatim range, and the aggregate
message reports them as acquitted rather than open. **A warning that cannot be resolved by
doing the right thing is one authors learn to ignore** — the same lesson that produced
`fu_note`-without-a-value earlier the same day.

### Where the class ends: 41 → 12

Across four passes and three source tiers — abstracts (11), FDA labels via DailyMed (10),
PMC full text (3) — plus **7 acquittals** where the default is verifiably right.

**The 12 that remain are not a sourcing failure so much as a category one.** Five have no
regulatory label anywhere because they are not medicines in the US: **cjc-1295** (research
peptide), **pterostilbene**, **dpa**, **arachidonic-acid** (supplements), **boldenone**
(veterinary ester). Four are products whose labels and open-access literature simply do not
state a peak time: **certolizumab-pegol, guselkumab, lanreotide, octreotide LAR**. The rest are
**phenobarbital** (PO and IM) and **nandrolone** (IM), where the literature that exists is old
and gives peaks only qualitatively (*"higher and earlier peaks with the phenylpropionate
ester"*).

For those, the honest next tier is EMA SmPCs or paywalled full text. **Nothing was invented at
any point**, and `pk.defaulted-ka-slow` counts what is left with its magnitude stated per row.

## The full-text gap sweep (2026-09-08) — and `FULLTEXT_QUEUE.md`

`scripts/authoring/2026-09-08-fulltext-gap-sweep.ts`. Prompted by the olanzapine finding: its
depot peak time was sitting in **the full text of the paper the record already cited**,
invisible to three prior passes because those passes read abstracts. **An abstract-only reading
of a citation is not a reading of the citation** — so the question became how often that had
happened elsewhere.

**Method.** Every record missing `V_L`, `F`, `ka` or `fraction_unbound` was mapped to the PMIDs
it already cites: **234 gap rows, 503 distinct citations.** Each was checked for open-access
full text — **122 of 503 (24%) are in PMC** — and those were fetched and searched for the
specific parameter the citing record lacks.

*(An implementation note that cost a wrong answer first time: batching `elink` PMID→PMC returns
**one pooled LinkSet**, not one per input, so per-PMID mapping is impossible from a batched
call. It reported 4 of 503 until each id was passed as its own `id=` parameter, which gave 122.)*

**35 candidate sentences, and most did not survive reading.** The screen is deliberately loose,
so its output is a reading list rather than a result — mostly author addresses, reference-list
fragments and table headers containing the right words. Of the real numbers, several are traps
this audit already names:

- **prednisone** — *"the bioavailability of prednisolone after oral prednisone is approximately
  80% of that after prednisolone"* is a **relative** bioavailability. The class-2 trap. Not `F`.
- **oxandrolone** — *"mean bioavailability = 62.5%"* is for a **buccal MCT-oil** formulation,
  not the oral tablet the record doses.
- **cephalexin** — its numbers are the review's **citations to other papers**, not its own.

### Three survived, and one needed rearranging

- **teriparatide** — `V_L` **89.4** + `F` 1. Its own citation gives *"CL/F (approximately 62
  l/h)"* and *"V/F … approximately 7.8 l"* — **and those two together imply a five-minute
  half-life**, against the hour the record stores. Storing 7.8 L verbatim would have asserted a
  clearance **11× below the same paper's own figure**. The stored value is that verbatim
  clearance over the stored rate, so exposure reproduces the paper.
- **mitragynine** — `V_L` **2,663** + `F` 1, from *"the apparent volume of distribution
  (38.04±24.32 L/kg)"* in the first human PK study. **The stored half-life already matched that
  same sentence exactly**, so the volume beside it had simply never been taken. Caveats recorded:
  a two-compartment fit's apparent volume against a terminal half-life, and ±64% spread in n=9.
- **olanzapine.PO** — `V_L` **1,100** + `ka` **0.3**, a verbatim *one-compartment* parameter set
  in the paper cited for the record's *other* route. Declared plainly as a **modelling
  parameterisation, not a fitted measurement** — but it is the structure this solver consumes and
  it coheres (23.1 L/h implied against the paper's stated 25). **Only the oral half is taken:**
  the same paragraph changes the parameters for the depot, so 1,100 L does *not* describe the IM
  route.

### `packages/registry/data/FULLTEXT_QUEUE.md` — the paywalled remainder

**126 gap rows across 111 compounds where every cited paper is closed access**, so nothing more
can be extracted without a subscription: `V_L` ×96, `F` ×42, `fu` ×18, `ka` ×11, over **227
distinct PMIDs**.

The file states plainly that it is **a reading list, not a defect list** — a row there is not
known to be wrong, only unresolvable from open sources — and gives the working procedure,
including what to do when a full-text value *doesn't* cohere with the record, with teriparatide
as the worked example.

## What else is wrong with compounds — a survey of catalog-internal checks (2026-09-08)

Rather than guess, a battery of checks that need no literature, only the data's own consistency.
Two new lint rules; **no data changed**, because in each case the honest action is to make the
state visible rather than to patch it.

### 1. 93 declared routes yield no plasma curve — 5 of them by default

`routes[]` drives the dosing UI (`CompoundCompose` iterates it and defaults to `routes[0]`),
while the curve needs a route with an elimination rate. **93 routes are in the first list and
not the second** — a person can log a dose against them and get nothing back.

**The severity is graded, and the grading is the point.** Only **5 are `routes[0]`**, so the
other 88 need a user to actively pick a non-default route. And **no compound has zero solvable
routes**, so nothing is wholly dead. New `pk.unsolvable-default-route` names the five:

| record | default route | why it matters |
|---|---|---|
| **epinephrine** | IM | the **autoinjector** — the commonest real-world use of the drug |
| **budesonide** | INH | inhaled is the primary indication |
| **betamethasone** | TD | topical is the primary indication |
| **5-meo-dmt** | INH | the primary route |
| **mannitol** | PO | **correct as data** — oral mannitol acts osmotically in the gut lumen |

**For four of the five the default route IS the clinically primary one**, so the fix is to
author it (or declare it `local-acting`), not to reorder. **mannitol is the exception and is
deliberately left alone:** its oral route legitimately has no plasma curve, and reordering to
put IV first would default a food-additive sweetener to a 50 g intravenous infusion — worse for
the common case. That one is a UI question (should compose say "no curve for this route"?)
rather than a data one.

### 2. Six kinetics edges are inert

`interactions.inert-kinetics`: the edge modulates the victim's `ke`, so with no `ke` there is
nothing to modulate — bosentan, carbamazepine, oxcarbazepine, phenytoin and st-johns-wort all
against `hormonal-contraceptives`, plus posaconazole → rapamycin. **Not deleted.** The
magnitudes are real and clinically important (enzyme induction causing contraceptive failure),
and each becomes live the moment the victim gains PK. Flagged so the inertness is known rather
than assumed to be working.

### 3. `metabolites[]` is used by zero records out of 1,217

The schema supports parent → metabolite chains with a molar formation fraction, and
`packages/solver/src/metabolite.ts` implements the whole thing — `metaboliteCurve`,
`metaboliteFormationRate`, `metaboliteCoupling`. **Not one record uses it**, while **48 records'
prose says an active metabolite matters.** The audit kept running into this from the other side:
*"laudanosine is NOT IN THE CATALOG and atracurium has no metabolites[] entry though the schema
supports one"*, doxorubicinol likewise, and today aripiprazole's note records that its occupancy
rows *"are driven by the smaller half of the pharmacology"*.

**And there is a trap that must be named before anyone authors this.** For a prodrug whose
`pk_analyte` is already the metabolite — valacyclovir → acyclovir, valganciclovir → ganciclovir,
lisdexamfetamine → dextroamphetamine, prednisone → prednisolone — **the record's curve IS the
metabolite's already.** Adding a chain there would produce the metabolite twice. Those pairs are
handled and must be left alone.

The genuine candidates are the five where the parent has its own activity *and* the metabolite
is separately catalogued and solvable: **codeine → morphine, risperidone → paliperidone,
imipramine → desipramine, amitriptyline → nortriptyline, mitragynine → 7-hydroxymitragynine.**
Each needs a sourced molar formation fraction, so it is a literature batch rather than a sweep.

### 4. Two things that look wrong and are not

- **71 occupancy rows saturate (>99%) at the peak dose.** Mostly correct pharmacology —
  adalimumab against TNF, apixaban against factor Xa. retatrutide's own note already says the
  tile *"will show 100% across the dosing interval, which is pharmacologically faithful even if
  visually static."* Not a defect class.
- **`hill_n` is exactly 1 on 324 of 325 rows and `emax` exactly 1 on 320.** These are documented
  modelling defaults, not measurements — so **every occupancy curve in the catalog is a simple
  hyperbola by assumption**. Worth stating as a known limitation of the shape, not a per-record
  error. The single exception is atracurium's `hill_n` 4.04, authored in batch 10 from a
  verbatim sigmoidicity factor.

## epinephrine.IM and the metabolite chains — both stopped on accuracy (2026-09-08)

Two concrete pieces of work attempted; **neither could be authored, and in one case the model
itself proves why.**

### epinephrine.IM cannot be modelled — that is a finding, not an omission

It is the record's **default route** and the drug's commonest real use, the anaphylaxis
autoinjector, carrying a dose with no PK. Setting out to author it produced a proof that it
cannot be:

**A one-compartment peak time is bounded.** `Tmax = ln(ka/ke)/(ka−ke)` rises as `ka` → `ke` and
cannot exceed **`1/ke`**. At this record's verbatim intravenous half-life of 3.5 minutes, that
ceiling is **5.0 minutes** — and the published intramuscular peak is *"Tmax 5-10 min"*. **At
the ceiling at best, past it at worst. No absorption rate reproduces it.**

That is **flip-flop kinetics**: intramuscular absorption is slower than elimination, so this
route's apparent terminal slope reflects *absorption*, and it cannot inherit the intravenous
half-life. Authoring it needs an IM-specific apparent half-life, and no indexed abstract states
one.

**And the profile is biphasic regardless.** Verbatim from a systematic review: *"Most
investigators found two Cmax's with Tmax 5-10 min and 30-50 min, respectively."* A single
first-order rate produces exactly one peak — so even with a correct half-life this route would
be structurally misrepresented. Recorded on the compound **before someone fits a rate to the
first peak and calls it done.**

### The five metabolite chains are blocked on one number each

`metabolites[]` remains unused. Every chain needs a **molar formation fraction**, and searching
abstracts plus PMC full text for codeine, risperidone, amitriptyline and imipramine returned
**no numeric fraction from any open source** — it is a derived quantity that population-PK
papers put in tables, not prose. Queued in `FULLTEXT_QUEUE.md` with the five pairs, and with
the **do-not-author list** for prodrugs whose `pk_analyte` is already the metabolite
(valacyclovir, valganciclovir, lisdexamfetamine, prednisone), where a chain would double-count.

**Both outcomes are the standard working as intended.** The epinephrine result is arguably worth
more than a fitted number would have been: the record now carries the arithmetic showing why a
plausible-looking parameterisation would be wrong.

## Nootropic class sweep — 9 added, 17 surveyed and skipped (2026-09-18)

`scripts/authoring/2026-09-18-nootropic-gap-batch.ts`. The request was one compound
(nefiracetam); the class turned out to be a short enumerable list rather than a wave, because
the catalog already carried nine racetams, the Semax/Selank peptides, the cholinergics
(donepezil, galantamine, rivastigmine, huperzine-a, tacrine), the classic vasoactives
(vinpocetine, centrophenoxine, idebenone) and a surprising tail of obscure ones (`9-me-bc`,
`nsi-189`, `tesofensine`, `theacrine`, `dihexa`). Every candidate below was checked against
live slugs **plus `aliases[]` and `retired_slugs[]`**, so a compound filed under a trade name
could not read as missing.

### Parameters investigated and skipped on the nine that were added

| Record | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **nefiracetam** | `V_L` / `F` | A V/F of 37.5 L **is** derivable from PMID:8484264 (Cmax 16.3 nmol/ml at 200 mg, Tmax 1.6 h, t½ 3.9 h) and it cross-checks — ke·V/F = 111 mL/min, inside the *"apparent clearance (CL) values were 94.4-140.3 mL min-1"* of PMID:1360528. Skipped anyway: 37.5 L is **0.536 L/kg, within 7% of the solver's own default**, so storing it re-creates the artefact the 2026-09-08 sweep deleted 23 rows for; and the derived quantity is V/F while **no absolute bioavailability exists**, so any stored pair asserts an F nobody measured. Defaults land within 4% of the observed peak. | An IV arm, or a full-text V and F. The derivation above is written out on the record so it is not redone. |
| **tolcapone** | `V_L`, `CL` | **Unreadable, not absent.** PubMed's indexed record of PMID:9754991 renders them as *"the volume of distribution was approximately 9 1, and the total clearance was approximately 71.h-l"* — OCR damage present in the XML as well as the text rendering, and the three quantities as transcribed do not close (9 L at t½ 1.8 h implies 3.5 L/h, not 7). Guessing the units back would be transcription dressed as authoring. | Full text, page 1. **Worth doing**: a ~9 L central volume is nowhere near the 35 L default this record now runs on. |
| **tolcapone** | `ka_hr` | The abstract gives a bound and a hedge, not a Tmax: peaks *"within approximately 2 h"*, absorption *"following either zero- or first-order absorption kinetics"*. `lag_hr` 0.5 **was** authored — that one is verbatim. | Full text Tmax, or the zero-order duration if that is the better fit. |
| **sarcosine** | `ka_hr` | PMID:25841105 gives *"a Tmax and t½ of ~1½- 2½ hr and ~1hr"* — the t½ is a point value and is stored, the Tmax is a **range**, and a range interior is not a measurement. | A Tmax point value. |
| **physostigmine** | PO route | Oral F **is** verbatim (*"3% for the oral solution"*, PMID:7756100) but the route is not authored: at F 0.03 an oral dose is almost entirely destroyed pre-systemically, oral physostigmine is not a marketed form, and offering PO invites a log that renders a near-flat curve as if it were a therapy. | Leave closed unless an oral product appears. |
| **physostigmine** | TD `half_life_hr` | The observed 4.9 h is **flip-flop**, and the paper says so itself — *"This indicates continued drug absorption from a skin depot."* Storing it as elimination would model an absorption artefact as disposition **and** double-count it against the `zo_dur_hr` input the patch is already represented by. TD therefore carries the IV disposition value (0.5 h). | None — the current model is the correct one. |
| **meldonium** | PO route | Declared **dangling**: the oral capsule is the common form and the reason the route is listed, but no indexed abstract states an oral t½ or F. PMID:20116348 is IV only. A dose logged against PO renders nothing until this is sourced. | An oral crossover; the ~78% figure circulating for it is not in any abstract found. |
| **meldonium** | `V_L` | Not published for any route. The multiple-dose arm (AUC₀₋₂₄ 58.56 mg·h/L, t½ 15.34 h) would yield one, but mixing a multi-dose accumulation half-life with a single-dose clearance is not a measurement of either. | Single-dose AUC + t½ from full text. |
| **nicergoline** | all PK | `pk_unauthored: uncharacterized`. Fifty years of daily dosing for dementia and **the only indexed PK is metabolite exposure split by CYP2D6 phenotype** (PMID:8971425, quoted in full on the record). PMID:11274866, PMID:1783643 and PMID:29403722 are assay-development papers. | Any parent parameter. **Note for whoever finds one**: it will almost certainly describe MMDL or MDL, so the record needs `pk_analyte: active-metabolite` + `pk_analyte_name` and its `mw_g_mol` switched to the analyte's mass. |
| **picamilon** | all PK | `pk_unauthored: research-only`. PMID:20359966 is an LC-MS/MS **assay** for picamilon in human plasma — a method validated without publishing the disposition it was built for. The Russian clinical reports (PMID:39269299, PMID:39113452, PMID:36168693) carry no kinetics. | The study the assay paper was built for. |
| **pyritinol** | all PK | `pk_unauthored: uncharacterized`. The only human work is Darge 1969 (PMID:5819373), a two-page German ³⁵S report whose **PubMed record carries no abstract at all**; its animal companion (PMID:5819364) is in the same state. PMID:6526537 measures urinary D-glucaric acid — an enzyme-induction marker, not a kinetic parameter. | Full text of the 1969 *Arzneimittelforschung* pair. |
| **7-8-dihydroxyflavone** | all PK | `pk_unauthored: research-only`. **No human exposure of any kind is published.** The only PK abstract is murine (PMID:39881861), and PMID:29295929 describes a **prodrug built because the parent's own exposure is inadequate** — the clearest possible statement that no human regimen exists. | A Phase I. None is registered. |

Also skipped across the batch: **receptor occupancy on all nine.** Tolcapone's verbatim
*"At doses of 200 mg and higher, COMT activity was inhibited by more than 80%"* (PMID:7768073)
is enzyme inhibition in erythrocytes, not receptor occupancy, and the Hill rows in this catalog
are agonist Emax/EC50. Picamilon's FDA screen (PMID:36668678) is the opposite problem — it
reports *no* binding at 50 targets, which is a real and useful result but not a curve.

### Surveyed and NOT added — the rest of the class

Ranked by indexed literature volume (PubMed totals, 2026-09-18). None was added because each
would have landed as a bare stub, and the batch above was already at playbook size.

| Candidate | PubMed | Why it is a genuine gap | What is missing |
| --- | ---: | --- | --- |
| **amantadine** | 8,825 | Large PK literature (258 hits under the PK subheading) and real cognitive/fatigue/TBI use. **The strongest single omission in this list.** | Nothing — it is authorable today. It sat out only because it reads as an antiviral/antiparkinsonian rather than a nootropic. Take it first. |
| **uridine monophosphate** | 5,084 | Staple of the choline/uridine stack. The count is inflated by generic pyrimidine biochemistry. | A human oral PK abstract; searches returned none that is not about a different drug. |
| **carnosic acid** | 1,260 | Rosemary diterpene, heavy neuroprotection literature. | Human exposure. |
| **ergoloid mesylates / dihydroergotoxine** | 754 | The original marketed "cerebral insufficiency" drug (Hydergine). PMID:4091992 (*"Absorption kinetics … following oral administration to man"*) and PMID:17941060 (human metabolite PK) both exist. | A read of those two abstracts; this is the **second-best** candidate here. |
| **Polygala tenuifolia** | 694 | Yuan Zhi; large TCM cognition literature. | Multi-constituent — needs the `composition[]` treatment, not a single curve. |
| **Cistanche** | 690 | Same shape as above (echinacoside / acteoside). | `composition[]` + per-constituent PK. |
| **piribedil** | 595 | D2/D3 agonist marketed for cognitive impairment in the elderly. | **Nothing indexed at all** — `piribedil+pharmacokinetics` and `piribedil+plasma` both return 0 hits. |
| **pemoline** | 571 | Withdrawn stimulant, still a reference compound. | Hepatotoxicity withdrawal makes it low value. |
| **oroxylin A** | 506 | Scutellaria flavone, GABA-A α2/α3. | Human data. |
| **7,8-DHF prodrugs** | — | see PMID:29295929 | — |
| **latrepirdine / dimebon** | 129 | A large, well-documented **failed** AD programme — valuable precisely as a negative. | `latrepirdine+pharmacokinetics` → 0 hits. |
| **D-serine** | — | NMDA co-agonist with real schizophrenia-cognition trials (PMID:20541910). | Human PK; PMID:22837388 is a DAAO-knockout **mouse** study. |
| **propentofylline** | — | Xanthine, glial modulator, went to Phase III for dementia. | 10 PK hits, none read yet. Reasonable next target. |
| **rolipram** | — | PDE4 reference compound, named in the piracetam-family review PMID:20166767. | Emetic dose-limiting; human PK sparse. |
| **seletracetam** | 26 | Completes the SV2A racetam branch beside levetiracetam and brivaracetam. | Discontinued; little published. |
| **nebracetam** | — | Completes the racetam set. | Essentially nothing indexed. |
| **cyclazodone / flmodafinil** | — | Grey-market stimulants. | No human PK of any kind. |

Confirmed **already present** and therefore not re-added, recorded here so the next sweep does
not repeat the search: citicoline, alpha-gpc, phosphatidylserine, acetyl-l-carnitine, bacopa,
ginkgo, rhodiola, ashwagandha, lion's mane, l-theanine, creatine, modafinil, armodafinil,
adrafinil, memantine, donepezil, rivastigmine, galantamine, tacrine, huperzine-a, vinpocetine,
centrophenoxine, idebenone, sulbutiamine, benfotiamine, dmae, phenibut, selegiline, bromantane,
nimodipine, pentoxifylline, theacrine, nsi-189, tesofensine, pqq, nmn, magnesium-l-threonate,
lithium-orotate, saffron, centella, forskolin, oxaloacetate, 9-me-bc, and all nine pre-existing
racetams.

## amantadine + ergoloid mesylates — the two follow-ups (2026-09-19)

`scripts/authoring/2026-09-19-amantadine-ergoloid.ts`. The top two rows of the
2026-09-18 "surveyed and NOT added" table, taken in that order. One authored,
one closed as a mixture — and the mixture verdict is the finding.

### amantadine — authored, with three things skipped and one thing learned

| Field | Outcome |
| --- | --- |
| `half_life_hr.PO` | **16.7 h, authored.** PMID:3834831 verbatim: *"plasma elimination half-life (36.5 +/- 15 versus 16.7 +/- 7.7 h)"*, amantadine being the second of each pair throughout that sentence. |
| `V_L` | **340.9 L, authored.** PMID:7756105 verbatim: *"apparent volume of distribution (V2/F) … 6.05 +/- 0.86 vs 4.87 +/- 0.85 l kg-1"* for smokers vs nonsmokers. The **nonsmoker arm** is stored (4.87 × 70). An arm, not a blend — the nac entry above is exactly about a value that "sits between 4.0 and 9.1 like a blend of two arms". |
| `ka_hr` | **Skipped.** PMID:498714: *"peak concentrations in plasma occurring at 1 to 12 hr"* — that is variability, not a Tmax. Nothing else states one for the immediate-release form; PMID:31372936's ~7.5 h peak is the **extended-release** tablet. |
| `F` | **Skipped.** No absolute bioavailability study exists. The tempting number is PMID:3967456's *"recovery of 88% of the single doses in urine"*, which is a **urinary recovery**; authoring it as F would be relabelling a quantity, which is the defect class this file is mostly made of. |
| `dose_moiety_fraction` | **Deliberately unset — do not "fix" this.** Amantadine is labelled as the hydrochloride and the base is 0.8058 of that formula mass, which is the lithium/brompheniramine shape. But both cited studies administered the hydrochloride, so the published V2/F is **already denominated per mg of salt** — the conversion is inside the 4.87 L/kg. Setting the fraction would divide by the counter-ion twice and run every curve 24% low. `mw_g_mol` stays the base (151.25) because that field names the circulating species for µM work, which is a different question. |

**The thing learned, worth generalising.** Resolving the finished record through
`resolvePk` at 200 mg gives a Cmax of **0.46 mg/L against Hayden's measured
0.65 — 29% low**, not the ~10% the doubled F alone predicts. The rest is
structural: **4.87 L/kg is a distribution volume and Cmax is set by the central
one.** A one-compartment fit driven by a distribution volume reproduces AUC and
the terminal slope exactly (`AUC = F·D/(V·ke)`) and understates the early peak
by however much the drug distributes. PMID:3280212 adds the second cause — the
apparent volume is *"inversely related to dose over the therapeutic range"*, so
no single number fits a 3 mg/kg study and a 200 mg study simultaneously.

This is not a reason to withhold the volume. At the 35 L default the same
calculation peaks at **4.48 mg/L, 6.9× the published Cmax**, in the direction
that flatters the drug. 0.71× is the better error and it has a known cause.
**But it means the catalog's widely-distributed compounds are systematically
low at Cmax wherever a V_z was authored into a one-compartment model**, and
that is worth a sweep of its own rather than a per-record note.

**`dose.salt-moiety-unset` is a known false positive on this record.** The rule
sniffs prose and cannot tell that the volume is salt-denominated too; its
message ("the solver divides a salt mass by a free-base volume") is simply not
true here. The record is phrased to avoid the hit rather than carry a warning
that misdescribes it. The clean fix is the one `NEGATED` already applies to the
metabolite rule in `data-lint.ts` — a guard clause for prose that states the
rule does not apply. Left undone here because it touches a CI gate and this
session was a data change; **this paragraph is the ticket.**

### ergoloid mesylates — `mixture`, and that is the answer

Listed on 2026-09-18 as the second-best candidate on the strength of two
abstracts. Reading them closes it:

- PMID:17941060 states the identity outright — *"Dihydroergotoxine is a mixture
  of semi-synthetic ergot alkaloids"* — then measures the three congeners
  **separately** in one volunteer after 27 mg, each at a Cmax near 0.04 µg/l,
  while their hydroxy-metabolites run *"one order of magnitude higher in
  concentration than their parents"*. No single species carries the exposure,
  and the ones that do are metabolites of three different parents.
- PMID:4091992 does give a human half-life — *"a slowest measured half-life of
  12-14 h"* — but by **radioimmunoassay**, which is cross-reactive across the
  congeners. It measures the mixture, not a molecule. It is also a range.

So: `pk_unauthored: { reason: 'mixture' }`, no `mw_g_mol` (four alkaloids, four
masses), and **no `composition[]` either**. That block needs a
`mg_per_g_extract` per constituent and each constituent present as its own
compound with its own PK; none of the four is in the catalog and the only human
data for any of them is a single-subject Cmax from a paper that calls itself
*"preliminary results"*. Four stubs expanding into four unsolvable curves would
add rows without adding information. The USP 3:3:2:1 ratio is in the mechanism
prose instead. **Revisit if any congener gets its own PK** — dihydroergocristine
is the likeliest, being marketed alone in some markets.

Worth keeping from PMID:4091992 even with nothing stored: twelve healthy males,
three formulations, plasma *"exceeded 200 pg ml-1 for approximately 5 h and
decayed in a biphasic manner"*, the retard capsule reaching half the solution's
Cmax at similar bioavailability. Low-concentration, biphasic and
formulation-sensitive — none of which a one-compartment curve represents
honestly, which is the same verdict from a second direction.

### rimantadine — taken, and it turned out to be more than a transcription

`scripts/authoring/2026-09-19-rimantadine.ts`. Listed here as a one-paragraph
job on the strength of the three values PMID:3834831 reports beside
amantadine's. A second paper carried an **AUC**, which is a volume once it sits
beside a half-life, so the record landed with real PK rather than as a stub.

| Field | Outcome |
| --- | --- |
| `half_life_hr.PO` | **27.5 h**, from PMID:3365917's healthy arm — *"The plasma half-life (43.6 vs 27.5 hours)"*, ESRD first. **Hayden's 36.5 h was NOT used**, and the reason is the point: the volume below is derived from PMID:3365917's AUC, and pairing one paper's clearance with another's elimination rate gives a volume neither supports. They agree anyway — *36.5 ± 15* spans 21.5–51.5 h. |
| `V_L` | **1322 L, derived and declared.** *"AUC (9.9 ± 2.1 vs 6.0 ± 1.6 micrograms.hr/ml)"* at two 100 mg doses → CL/F = 200/6.0 = 33.33 L/h; ÷ (ln2/27.5) = 1322 L = **18.9 L/kg**. Cross-checks: that is the recognisable value for this molecule, and it is the only way rimantadine's own crossover against amantadine coheres — double the half-life and a third of the Cmax off one 200 mg dose needs a much larger volume. |
| `ka`, `F` | **Skipped.** No abstract states a Tmax (PMID:3365917 mentions *"time of maximum concentration"* only to say it did not differ between groups); no absolute bioavailability study exists. |
| `dose_moiety_fraction` | **Deliberately unset**, same call and same reason as amantadine — the dosed hydrochloride is already inside the published AUC. Base is 0.8310 of the salt's formula mass. |

Two excretion figures are recorded on the compound and **not** reconciled:
*"0.6 ± 0.8%"* unchanged in 24 h plus 19% as drug-plus-hydroxy-metabolites
(PMID:3834831), against 16% unchanged (PMID:3365917). Different windows and
assays; both say the same thing qualitatively.

### The V_z-in-a-one-compartment-model pattern is now measured, not suspected

The amantadine entry above flagged this as worth a sweep. Rimantadine is the
second data point and it behaves exactly as predicted, which promotes it from a
hunch to a pattern:

| Record | authored V | modelled/published Cmax | modelled/published AUC | Cmax at the 35 L default |
| --- | ---: | ---: | ---: | ---: |
| amantadine | 4.87 L/kg | **0.71×** | — | 6.9× high |
| rimantadine | 18.9 L/kg | **0.50×** | **0.90×** | 18.7× high |

**AUC is right and Cmax is low, by an amount that tracks the volume.** That is
the structure, not the data: a distribution volume sets exposure and terminal
decay correctly in a one-compartment model and understates the peak, because
Cmax is governed by the central compartment. Rimantadine's AUC ratio of 0.90×
isolates the other, smaller effect cleanly — that 10% is the default F of 0.9
double-counting an apparent V/F that already contains F.

**What a sweep should do.** Find every record whose authored `V_L` came from a
published *apparent volume of distribution* / V_z / V2 rather than a central
volume — the catalog's median authored volume is 87 L, so the candidates are
the upper tail — and decide per record whether the surfaces that read Cmax
(occupancy, the receptor curves, "peak in N hours") can tolerate a systematic
understatement, or whether those records want a two-compartment fit. Neither
amantadine nor rimantadine should be changed on its own account: 0.71× and
0.50× are both far better than the 6.9× and 18.7× overstatements the default
gives, and both are disclosed on the record.

### Still free for the taking

Nothing further from this thread is queued. For reference, the sentences that made rimantadine cheap were:
t½ *36.5 +/- 15 h*, Cmax *0.25 +/- 0.06 micrograms/ml*, *0.6 +/- 0.8%* excreted
unchanged, plus *"Urinary excretion (0 to 24 h) of rimantadine and its
hydroxylated metabolites averaged 19% of the administered dose"*. All verified, all now authored.

## 2026-09-26 — the peptide / grey-market batch: 15 added, 11 aliases across 7 records, one uncited number struck

`scripts/authoring/2026-09-26-peptide-gap-batch.ts`. The trigger was a 69-item
request list drawn from research-peptide vendor catalogues. Measured against the
pre-batch catalog by identity (slug, name, `aliases[]` and `retired_slugs[]`,
normalised the way `data-lint` normalises): **49 of the 69 already resolved, to 48
distinct records**, and they are listed at the end of this section so the next
sweep does not re-search them. **20 did not resolve — and only 15 of those were
actually missing compounds.** The other 5 were existing records under a name the
catalog did not carry, which is a search bug rather than a gap.

Every PMID in this section was fetched from E-utilities during the batch, and the
93 the batch introduced were re-resolved in bulk against ESummary with their
titles read back. Registry-wide: **2,577 verified · 0 dead**.

### The two records that came out with authored PK

**afamelanotide** — the only compound on the list with real human kinetics.
Ugwu 1997 (PMID:9113347), three male volunteers, ten doses, three routes.

| Field | Outcome |
| --- | --- |
| `F` | **1, authored.** Verbatim: *"the SC dose is completely bioavailable compared to the IV dose"*, corroborated independently by PMID:28063031, *"Subcutaneous application had full bioavailability"*. |
| `half_life_hr.SC` | **0.8 h, authored** — the LOWER endpoint of *"from 0.8 to 1.7 h for the beta-phase"*. An endpoint, not the midpoint, per the standing rule. |
| `ka_hr` | **9.9021 /h, authored, and it is a UNIT CONVERSION not a back-derivation.** The paper states an absorption-phase *half-life* of *"0.07 to 0.79 h"*; ln2/0.07 = 9.9021. |
| `V_L` | **9.6949 L, a DECLARED DERIVATION.** No volume is published for this drug by any route, but *"Clearance ranged from 0.12 to 0.19 L kg-1 h-1"* with the stored half-life fixes it: (0.12 × 70) / (ln2/0.8) = 8.4 / 0.8664340 = 9.6949 L. The record now reproduces a verbatim published clearance by construction. |

**WHY THE LOWER ENDPOINT OF THE ABSORPTION RANGE, and this is the generalisable
part.** At the other end, 0.79 h gives ka 0.8774 /h against this record's ke of
0.8664 /h — a 1.3% difference, with `ka - ke` sitting in the Bateman
denominator. **That corner of a published range is not merely less likely, it is
UNREPRESENTABLE in a one-compartment model.** Worth checking for whenever an
absorption half-life and an elimination half-life are drawn from the same paper's
ranges: the pairing can be arithmetically impossible before it is pharmacologically
wrong.

**WHY A VOLUME WAS DERIVED HERE AT ALL.** Storing nothing is the batch-11 trap:
a missing `V_L` does not abstain, it asserts 0.5 L/kg = 35 L. Pair the clearance
range with the half-life range and the band this paper permits is **9.7–32.6 L**.
The default sits ABOVE ALL OF IT, so silence would have been a claim the paper
contradicts, running every curve up to 3.6× low. The clearance sentence names no
route, which is normally where route mismatch enters; it cannot here, because
complete SC bioavailability makes `CL` and `CL/F` the same number.

**cagrilintide** — Enebo 2021 (PMID:33894838), phase 1b, six cohorts.

| Field | Outcome |
| --- | --- |
| `half_life_hr.SC` | **159 h**, the lower endpoint of the verbatim *"half-life of 159-195 h"* across dose groups. |
| `ka_hr` | **0.1525 /h, a back-derivation, DISCLOSED on the record.** It reproduces the verbatim lower-endpoint *"median tmax of 24-72 h"* against that half-life. Authored rather than omitted because the 1.0 /h default puts the peak of a **once-weekly** peptide at 5.4 h, 4–13× early. |
| `V_L` | **Deliberately NOT derived — see below.** |
| `F` | Not published. No absolute bioavailability study exists. |

**THE VOLUME DECISION WENT THE OPPOSITE WAY FROM AFAMELANOTIDE'S, AND THE REASON
IS A CLAUSE IN THE METHODS RATHER THAN ANYTHING ABOUT THE NUMBERS.** This
abstract prints Cmax 6.14–170 nmol/L and AUC0-168h 926–24,271 nmol×h/L, so a
V/F looks one division away — 4.5 mg against 170 nmol/L gives 6.0 L. But the PK
endpoints were *"assessed from day of last dose (week 19) to end of treatment
(week 20)"*, after 16 weeks of co-escalation and 4 weeks at target: **these are
steady-state values.** At a 159–195 h half-life on a weekly interval the
accumulation ratio is about 2, so the accumulation-corrected volume is about
12 L, and the abstract does not print what would settle which is right. **A 2×
fork is not a measurement.** Generalises to every once-weekly acylated peptide in
this catalog: check whether a published Cmax is single-dose before dividing by it.

**ALSO: all cagrilintide human PK is COMBINATION PK.** Every value was measured
with semaglutide 2.4 mg co-administered; no monotherapy dataset is indexed. The
one directional finding is verbatim and one-way — cagrilintide *"did not affect
semaglutide exposure or elimination"* — with the converse untested.

### Where the literature contradicts the product — three of the fifteen

1. **ovagen is the strongest case, and it took two separate findings.** Vendors
   sell "Ovagen" as the LIVER bioregulator, the tripeptide Glu-Asp-Leu. (a) **The
   tissue is wrong**: every indexed EDL study is RENAL (PMID:28744634
   nephroprotection in rats, PMID:24958378 naming MMP-14 as the target), and
   `EDL tripeptide liver`, `Glu-Asp-Leu hepatocyte` and `hepatoprotective
   tripeptide Khavinson` all return ZERO. The Khavinson liver preparation is
   **Hepalin**, a polypeptide complex (PMID:12096446, PMID:11213728), never
   equated with this sequence. So `systems` is `renal`, and the marketed
   indication is recorded as vendor-asserted. (b) **The name is a veterinary
   drug**: in PubMed, Ovagen is an ovine FSH superovulation preparation for sheep
   and goats, carrying real doses — *"4.4 mg of Ovagen (n = 6)"* (PMID:20399062),
   *"(Ovagen(TM), 0.44 iu/ml)"* (PMID:18325004). Those must never be imported.
2. **slu-pp-332** is sold for oral use and its own literature says
   PMID:41421047: it *"improves aerobic performance in mice but lacks oral
   bioavailability"*. PO is listed because that is the form sold; the record says
   the literature contradicts it rather than quietly modelling absorption.
3. **adamax has no indexed literature whatsoever** — not PK, not pharmacology,
   not a structure. Nine adamantane×Semax searches return ZERO each against 232
   for `Semax` alone, so it is a specific absence of the analogue, not a failed
   search. **`mw_g_mol` is therefore OMITTED**: the structure is a vendor claim
   and a stored mass would lend it a precision nothing supports.

### mechano-growth-factor: an uncited half-life struck from mechanism prose

The record asserted a plasma half-life *under 10 minutes* with no citation, and
**the number is not in the literature.** `"mechano growth factor"[tiab] AND
half-life` returns exactly one record, PMID:11915923, which is qualitative —
MGF *"is not glycosylated, is smaller, and has a shorter half-life in the unbound
state than the systemic liver type IGF-1"* — and a further sweep of eleven MGF
papers found no half-life sentence and no minute-scale value. The prose now
carries that sourced qualitative statement instead. Same shape as `ccb1b42` and
`a4cb428`: a number with no source, rendering as authoritative.

**TWO TRAPS THAT WOULD PUT A HALF-LIFE BACK ON THAT RECORD WRONGLY.**
PMID:28110155 reports a human 140–200 h half-life for PEGylated rhIGF-I
(RO5046013), which is **full-length IGF-I**, not the 24-residue E-domain peptide
— almost certainly the origin of the vendor claim that PEG-MGF lasts days. And
PMID:1281675 gives mouse half-lives for *"recombinant mast cell growth factor
(rMGF)"*, where MGF is **SCF / kit ligand**, a different protein sharing the
abbreviation.

### Two requested items are ALIASES, not records

- **PEG-MGF → `mechano-growth-factor`.** Field-restricted searches
  (`"PEG-MGF"[tiab]`, `pegylated[tiab] AND "mechano growth factor"[tiab]`) return
  ONE record between them, PMID:42395176, a grey-market clinical-guidance review
  that names it in a bare parenthetical and states no stability claim, no
  half-life, no species and no dose. The premise for a distinct record — a
  different disposition — has zero evidence. `MGF-Ct24E` returns 9 records, none
  mentioning PEG; "stabilized" MGF in the literature is always biomaterials
  (PMID:24768406, PMID:22941771, PMID:23594073).
- **BPC-157 Stable / BPC-157 arginate → `bpc-157`.** Every spelling of the salt
  returns zero. The decisive test: `"BPC 157"[tiab] AND (arginate[tiab] OR
  arginine[tiab])` returns 37 records in which **"arginate" occurs 0 times and
  "salt" occurs 0 times** — every arginine is L-arginine as an NO-system tool
  compound. What the Sikiric group means by "stable" is **gastric-juice
  proteolytic stability** (*"no degradation in human gastric juice for more than
  24 h"*, PMID:35125818), not a counter-ion, and the literature entity is the
  free peptide at M.W. 1419.

### The three vendor blends

All three are `mixture` + `composition`, expanding into constituents that already
exist. **Compositions are from vendor pages and say so on the record**, because
there is no other source.

| Blend | Constituents | Modal vial | Ratio spread |
| --- | --- | --- | --- |
| `wolverine-blend` | bpc-157 + tb-500 | 20 mg (10 + 10) | 1:1 at research vendors; **1:2 at a compounding pharmacy** (5 + 10) |
| `klow-blend` | ghk-cu + bpc-157 + tb-500 + kpv | 80 mg (50/10/10/10) | every vendor stating a split agrees |
| `glow-blend` | ghk-cu + bpc-157 + tb-500 | 70 mg (50/10/10) | 90 mg (70/10/10) and a compounded 42 mg (27/5/10) also exist — **the copper peptide is the variable, the other two are stable** |

**THE DOSE BLOCKS ARE EMPTY ON PURPOSE.** Every source states a VIAL TOTAL, never
a per-injection amount; a vial is reconstituted and split across many doses, so
storing 20 mg as a dose would overstate a single administration by an order of
magnitude.

**EVIDENCE FOR THE COMBINATIONS IS ESSENTIALLY NIL, AND ONE PIECE IS NEGATIVE.**
No indexed paper studies any of the three blends, and the names never appear in
PubMed beside these peptides. For the BPC-157 + TB-500 pair specifically:
PMID:42542926 is a rat Achilles model with a combined arm at 10 and 60
micrograms/kg/day intraperitoneally — a 1:6 ratio, not the vendor 1:1 — finding
*"Combined BPC-157 and TB-500 treatment did not confer additional benefits
compared to either agent alone"*; PMID:34324435 is an uncontrolled chart review
where *"The other 4 patients received a combination of 2 peptide injections"*
with *"No specific tools ... used to measure their improvement"*. The three-way
and four-way combinations have nothing at all.

**NAME COLLISION for the alias list:** a different compounded "GLOW" exists
containing GHK-Cu, **glutathione and ascorbic acid** with no BPC-157 or TB-500,
so a user logging GLOW may mean either product; the two share one constituent.

### Naming traps, recorded so an automated harvest does not step in them

| Token | What PubMed actually returns |
| --- | --- |
| `Adamax` | all 39 hits are the **Adamax gradient-descent optimizer** from machine learning (PMID:42236259, PMID:42151246, PMID:41803168). A citation-count heuristic would rate this the best-evidenced compound in the batch. |
| `Ovagen` | **ovine FSH**, with real mg and IU doses attached. |
| `EDL` | **extensor digitorum longus** muscle, 43 hits (PMID:33540821). |
| `Glu-Asp-Leu` | substring of **Ala-Glu-Asp-Leu** (AEDL, bronchogen), a different tetrapeptide assigned to lung. |
| `AED` | **antiepileptic drug**. |
| `P021` | an **abstract number** in a Crit Care supplement (PMID:27885969). |
| `MGF` | **mast cell growth factor** / SCF (PMID:1281675). |
| `AM833` | PubMed auto-translates it to **fleroxacin**; `NN9838` is not indexed. Use the INN. |
| `Kartalax` | the indexed spelling of **Cartalax** — both belong in `aliases[]` (6 hits vs 1). |

### The six stubs, with what each is waiting on

| Record | Reason | What would unlock it |
| --- | --- | --- |
| **cibinetide** | `uncharacterized` | A phase-1 or PK-dedicated publication. Six human trials dose it and none reports a parameter; the repeated *"~2min"* half-life traces only to reviews by the developers (PMID:25728128, PMID:27634443), with no species, route, dose or n, and **a 2-min plasma figure is an IV observation — storing it on SC would be route mismatch.** Note the molecule's own premise is that its effect far outlasts plasma, so a two-minute curve would model the wrong quantity even if sourced. |
| **pentosan-polysulfate** | `mixture` | Nothing, for a mass-based curve. *"since specific assays for PPS do not exist"* (PMID:10192753) is stated outright; the oral study used clotting-time and lipase surrogates, PMID:16278190 a tritium label. Same shape as enoxaparin. **PMID:1726041 is titled as the IV human PK study and HAS NO ABSTRACT IN PUBMED** — full text is the only route to IV parameters. |
| **itpp** | `uncharacterized` | Full text of PMID:34155211, which lists PK among its secondary objectives and publishes none of it. |
| **foxo4-dri** | `research-only` | Full text of PMID:28340339 — the dosing regimen is in **STAR Methods**, which efetch does not return. |
| **slu-pp-332** | `research-only` | Any PK in any species; also no EC50 is indexed (`SLU-PP-332 EC50` → 0 hits), so no occupancy row could be authored either. |
| **p021** | `research-only` | Full text. No numeric dose appears in any of 15 abstracts — the literature gives species and duration only (*"treated for 12months with P021 or vehicle diet"*). |

### Still open after this batch

1. **The afamelanotide implant is a different kinetic object from the record.**
   The marketed product is a 16 mg controlled-release implant every 60 days
   (PMID:26132941), whose release profile is zero-order over weeks and is **not
   published**; melanin density *"peaked at day 15 and remained elevated at day
   60"* (PMID:20969564) is pharmacodynamics. The stored curve is the daily
   INJECTION. **Logging 16 mg against this record renders the injection curve and
   will be wrong by orders of magnitude in duration.** `pk[route]` is keyed by
   route and both are SC, so the schema cannot hold both without a formulation
   axis — the same gap depot/immediate-release confusion (taxonomy class 7) keeps
   hitting.
2. **cagrilintide's volume** — full text of PMID:33894838 resolves the 6 L / 12 L
   fork. Until then the record runs on 35 L, which for an albumin-bound acylated
   peptide is high (semaglutide's measured total volume is 7.7 L). **The size of
   the error is measured, not guessed:** run through the real solver at a single
   4.5 mg dose the record peaks at 24 nmol/L against the paper's 170 nmol/L, and
   since that published figure is steady-state, roughly 2× of the 7.1× gap is
   accumulation the single-dose curve is right to omit — leaving about **3.5×
   attributable to the defaulted volume**, which agrees with the 6–12 L estimate
   from the other direction.
3. **A near-zero oral bioavailability has nowhere to live.** PPS oral F is *"in
   the range of 0%"*, which is the single most decision-relevant fact about the
   oral product, and `F: 0` is the wrong shape rather than a smaller number — the
   record has no curve to multiply. Related to the standing "no field for
   fractional absorption" item.
4. **Per-BSA dosing has no schema representation** — ITPP is dosed in mg/m² and
   the stored figures are the published numbers × 1.73 m², disclosed on the
   record. This is taxonomy class 14 one dimension over from the eleven per-kg
   records.
5. **The intraperitoneal route cannot be expressed.** `Route` has no IP member,
   and it is the only published route for SLU-PP-332, FOXO4-DRI and the one
   controlled BPC-157 + TB-500 study.
6. **A real PK lead for `bpc-157`, which currently has none.** PMID:42198317, a
   2026 formulation review, states *"a recently published formal preclinical ADME
   study in two species confirming a sub-30-min plasma half-life, linear
   dose-proportional kinetics, and intramuscular bioavailability of 14-51%
   depending on species"*. **It is secondary and does not name the two species**,
   so chase the primary before authoring anything — this registry's species
   labelling is mandatory. The same review concludes *"No pharmaceutical-grade
   formulation has been developed or validated"*.
7. **The Khavinson DNA-binding mechanism reaches ovagen and cartalax only by
   extrapolation.** The peptides actually imaged entering HeLa nuclei
   (PMID:22117547) were epithalon, pinealon, testagen and bronchogen — **not AED
   and not EDL** — and the group's two docking papers disagree with each other
   about EDL's site (PMID:27909961 *ctcc* vs PMID:25946838 minor-groove
   *d(ATATATATAT)2*). Both are recorded on the records, neither asserted.
8. **A negative result worth not losing:** PMID:22238759 tested Cartalax's AED on
   aged thymocytes and found *"Only AB-9 peptide exhibited a complex geroprotective
   effect"* — i.e. negative for AED. It is not supporting evidence.

### Confirmed already present, so the next sweep can skip them

The 48 records the request list already resolved to, checked against `slug`,
`name`, `aliases[]` **and** `retired_slugs[]`: 5-amino-1mq, ace-031, aod-9604,
cdp-choline, cerebrolysin, cjc-1295, clomiphene, dihexa, dsip, enclomiphene,
epitalon, follistatin-344, ghk-cu, ghrp-2, ghrp-6, glutathione, gonadorelin,
hexarelin, humanin, igf-1-lr3, ipamorelin, kisspeptin, kpv, l-carnitine,
larazotide, liraglutide, ll-37, melanotan-ii, mk-677, mod-grf-1-29, mots-c,
nad-plus, oxytocin, pinealon, pt-141, retatrutide, ru-58841, selank, semaglutide,
semax, sermorelin, snap-8, ss-31, tb-500, tesamorelin, thymosin-alpha-1,
tirzepatide, vip.

### Five requested names were existing records under an unknown spelling

Not gaps — a lookup failure. `TB-500 Fragment` → tb-500 (**that record already IS
the 17-23 fragment**, so a new record would have been a duplicate identity),
`IGF-1 DES` → des-igf-1, `HGH (Somatropin)` → somatropin, `PEG-MGF` →
mechano-growth-factor, `BPC-157 Stable` → bpc-157. The last two are the alias
determinations written up above.

**THREE MORE SPELLINGS RESOLVE BY IDENTITY BUT NOT BY SEARCH, which is its own
finding.** `NAD+`, `Mod GRF 1-29` and `CJC-1295 no DAC` all match an existing
record once punctuation and case are normalised — so `data-lint` sees no gap — but
the app's spotlight is a plain lowercase **substring** ladder over name, slug and
aliases with no normalisation, so a user typing them got nothing. `NAD+` is the
sharpest case: the record's name is `NAD⁺` with a SUPERSCRIPT plus, which no typed
query can ever match. **An identity check is not a search check**, and only the
latter is what a user experiences. All three now carry aliases.

**One alias spelling was deliberately NOT added.** `CJC-1295 (no DAC)` would
reduce to `cjc-1295` under `data-lint`'s `identityKeyBase`, which strips a
TRAILING parenthetical before comparing identities, and would raise a false
`compound.identity-collision` against the DAC record. The space-separated form
carries the same search benefit with none of that.

## Redesign carry-over (2026-09-26)

Two decisions left open by the repository redesign, recorded here so neither is
rediscovered as a bug.

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`riboflavin-5-phosphate`** / **`ribose-5-phosphate`** | `retired_slugs` / `aliases` | `r5p` is a retired slug of riboflavin-5-phosphate and also an alias of ribose-5-phosphate, so a slug lookup forwards to the first while a name search matches the second. The abbreviation is genuinely used for both in the literature, so neither claim is wrong and picking one by fiat would mislead half of its readers. New rule `compound.retired-alias-clash` reports it as a warning. | An authoring decision about which record owns the abbreviation, or dropping it from both so that only the unambiguous names resolve. |
| *(catalog-wide)* | nutrient vitamer grouping | Four lint rules went with the food catalog the redesign removed: `nutrient-group.member-exists`, `.member-nutrition`, `.min-members` and `.shared-dv`. They read a grouping table that no longer exists, and no grouping is stored in `compounds.json` today, so nothing is left unguarded. | If shared-Daily-Value families (B12, folate, D, K vitamers) are ever authored as registry data, those four checks must come back with them: a renamed member silently ungroups, and members whose unit or RDI drifted cannot be summed. `git show feb7677 -- scripts/lint-rules.ts` has the originals. |

## GtoPdb midpoint unwind — occupancy re-sourced, 9 rows removed (2026-09-26)

The Wave-20 policy above licensed storing the geometric mean of a multi-paper
GtoPdb pKi range under a "representative" primary PMID. New lint rule
`receptor.derived-value` named all 28 surviving rows; this pass closed every
one. **14 re-sourced to a single verbatim constant, 3 to the product label, 1
stored at a disclosed range endpoint, 9 removed for want of any source.** Three
parallel literature passes ran the whole list against NCBI, PMC and Europe PMC.

The 9 removals. Each was a number no paper states, and none has a replacement
that clears HYGIENE R2, so the row is gone rather than left asserting a
midpoint. A removed occupancy row asserts nothing, which is why removal is the
honest state here and never is for PK.

| Compound | Target | PMIDs chased, and why each failed | What would unlock it |
| --- | --- | --- | --- |
| **clozapine** | 5-HT2A | 8935801 (Schotte 1996) abstract is wholly qualitative, no PMC, not OA. 24219174 (Seeman 2014) Table 1 gives 4 nM but the column is incidental to a D2 paper and its footnote chains through three reviews; Table 2's own ratio (20) does not reproduce 75/4. 26436896 (Cross 2016) has clozapine as a comparator. 8854201 is a review, and J-STAGE is blocked. | Schotte 1996 Table 1 (Springer, not OA), or Seeman's refs 19/20/26 in full text. |
| **clozapine** | H1 | 21912901 (Humbert-Claude 2012) is the right paper — clozapine the subject, all four human histamine receptors — but its abstract states no Ki and it is not OA. 12629531 (Kroeze 2003) certainly tabulates it; **its PDF is free at nature.com, which this container's proxy refuses with CONNECT 403**. 8935801 qualitative. 16983399 gives only the inequality "Ki<10 nM". H3/H2 papers (8915103, 7541279, 39661142) are the wrong subtype. | Re-run the Kroeze 2003 fetch from a session where nature.com is reachable. The PDF is free; this is a network gap, not an evidence gap. |
| **haloperidol** | D3 | 8301582 (Freedman 1994) names haloperidol once, in a list, with no Ki — the current citation is abstract-silent. `esearch haloperidol[ti] AND (D3[tiab] OR D(3)[tiab]) AND (Ki[tiab] OR affinity[tiab])` returns **COUNT 0**. A 564-hit Europe PMC sweep surfaced only docking, PET and behaviour. | Structurally unresolvable under the subject rule: haloperidol is the field's universal *reference* ligand at D2/D3 and is measured constantly, never as a paper's subject. Needs either a haloperidol-subject binding paper or a decision to accept a receptor-characterisation paper's own table. |
| **haloperidol** | 5-HT2A | Same shape. A 70-record sweep, 29 titles pulled: every one behavioural, clinical, catalepsy, microdialysis or a trial. The only verbatim value anywhere is Seeman 2014 Table 1 (74 nM) where haloperidol is an explicit comparator. Note 74 nM is close to the 100 nM midpoint removed — the midpoint was not *wrong*, it was unsourceable. | As above. |
| **quetiapine** | H1 | Cross 2016 (26436896) was checked table by table and **does not measure H1** — that lead is exhausted. 18059438 (Jensen 2008) screened quetiapine across a GPCR panel but the only H1 number in the abstract is the **metabolite's** (3.4 nM), which must not be stored as the parent; **free PDF at nature.com, proxy CONNECT 403**. 7871032 (Saller 1993) never mentions histamine. 12176106 is a hERG paper with no absolute Ki. | Jensen 2008's binding table, free at nature.com, from a session that can reach it. |
| **cortisol** | glucocorticoid (NR3C1) | 8282004 (Rupprecht 1993), the cited source, states **no cortisol number**; its only affinity is progesterone's at MR. Cortisol is a legitimate subject among its 11 steroids — the numbers are simply not in the abstract, and Elsevier 1993 is not in PMC. 1655735 paraphrases ("high affinity for cortisol"). 3037703 has no numbers. 40 further candidates screened: wrong organism, wrong target, or no constant. | Rupprecht 1993's binding table (Eur J Pharmacol 247:145-154). One table closes both cortisol rows and probably other steroid rows. |
| **cortisol** | mineralocorticoid (NR3C2) | As above; extends the dead end already recorded for hydrocortisone. | As above. Second choice: any paper measuring cortisol against a **cortisol-class** radioligand — GR papers use a dexamethasone ligand, which makes cortisol the displacer rather than the characterised ligand. |
| **buprenorphine** | kappa | 9686407 (Toll 1998), the cited source, **has no abstract in PubMed at all** and no PMC copy, so nothing can be quoted from it. 9262330 is cloned human kappa but gives buprenorphine only a rank-order mention. 11303059 (Huang 2001) is the best candidate — buprenorphine the subject, cloned receptors — but paraphrases ("in the nanomolar or subnanomolar range"); ASPET full text unreachable. 10502307 states Ki 0.072 nM verbatim but is **guinea pig caudate** and a functional antagonist-Ki. | Huang 2001 Table 1 (ASPET), or Toll 1998's SRI standard-assay table — a government monograph, so a free PDF plausibly exists outside PubMed. Toll would close buprenorphine kappa, naloxone kappa and retroactively verify naloxone delta. |
| **naloxone** | kappa | Same 9686407 problem. 10502307 gives Ki 11.4 nM verbatim but is guinea pig **and** naloxone is a comparator there. 7869844 and 7624359, both cited in the old note, state no Ki; PMC41460 is a scanned deposit with no `<body>` — full text not retrieved. 16433932 is OA but mouse, and tests neither drug. | Toll 1998, as above. Even with it in hand, check whether naloxone is a characterised ligand there or a reference antagonist before storing. |

### Findings this pass produced but did not fix

| Finding | Detail |
| --- | --- |
| **PMID:8935801 (Schotte 1996) cannot support any occupancy value in this registry** | Cited on five rows of the flagged set. Its abstract contains zero binding numerals, it has no PMC record, and Europe PMC confirms it is not open access. Two of those rows were re-sourced and two removed here; grep the catalog for the id before trusting any other. |
| **ziprasidone D2 rests on a paper nobody can read** | The row cites Schmidt 2001 (PMID:11513838) for 4.8 nM. That abstract contains no numbers at all and its full text is in neither PMC nor Europe PMC. The number is right — the GEODON label states 4.8 nM verbatim — but the citation points at text no one in the chain has seen. Not touched here: this batch's concern was the midpoint rows. Fix by moving it to the same `source_label` the other three ziprasidone rows now use. |
| **buprenorphine mu is a guinea-pig number presented as human** | The stored mu row cites PMID:10502307 for Ki 0.088 nM with no species on the record. That paper is guinea pig caudate, and the value is a functional antagonist-Ki from [35S]-GTPgammaS, not a binding Ki. Needs a species note at minimum. |
| **`efetch db=pmc` returning front matter is not the end of the road** | Two full-text wins here (Cross 2016, Seeman 2014) returned no `<body>` from `efetch` and HTTP 500 from Europe PMC's `fullTextXML`, yet `https://pmc.ncbi.nlm.nih.gov/articles/PMCxxxxxxx/` served complete HTML including the tables. Rows previously skipped as "full text not retrieved" may reopen on that route alone. |
| **Three skips here are network gaps, not evidence gaps** | nature.com, sciencedirect.com, jstage.jst.go.jp, unpaywall, openalex, crossref, semanticscholar, core.ac.uk, bindingdb and pdsp.unc.edu all return CONNECT 403 through this container's proxy, while `authoring/NETWORK.md` lists several as expected. A row that says "PDF is free but the host is blocked" should be retried, not re-searched. |
| **Rappas 2020 Table 1 also carries suvorexant and lemborexant** | The same free ACS table that closed daridorexant OX2 prints suvorexant (OX1 9.4 / OX2 9.1), lemborexant (8.6 / 9.3) and filorexant (9.2 / 9.7). The orexin cells recorded above as paywalled are openable from it. |
| **A caffeine A1 candidate was found and not taken** | PMID:21056087 states "K(i) ... 61.4±11.2μM" for caffeine verbatim, caffeine a title subject. Its abstract does not say whether that figure is the human brain homogenate or the transfected CHO preparation, and it is ~5x weaker than the A2A row's scale. Full text is Elsevier, not retrieved. Resolve the preparation question before adopting it. |

## Secondary-citation unwind — occupancy re-sourced, 15 rows removed (2026-09-26)

The companion pass to the midpoint unwind above. New lint rule
`receptor.secondary-source` named 33 rows whose affinity came off an
IUPHAR/GtoPdb ligand page while the `source_pmid` named whatever paper that
database attributes it to — a citation nobody in the chain had opened. Closed
every one: **18 re-sourced to text someone read, 15 removed.** The rule now
reports 0, as does `receptor.derived-value`.

**A cheap way to find more of this shape.** Four of the removed values (39.8,
251, 7.9, 20 nM) are exact back-conversions of one-decimal pKi/pKd figures
(7.4, 6.6, 8.1, 7.7), and two more (asenapine 0.16 nM, cariprazine 0.09 nM)
round the same way. A stored nanomolar constant that reproduces a one-decimal
p-value exactly is a GtoPdb fingerprint, and grepping for it is cheaper than
opening a paper.

### The 15 removals

| Compound | Target | PMIDs chased, and why each failed | What would unlock it |
| --- | --- | --- | --- |
| **fluphenazine** | D2 | 17826096 (Sasse 2007), the cited source, is a D3 SAR paper that **never mentions fluphenazine**. 11132243 (Richelson 2000) does not study it either — strike it from the PDF queue. 8524985 puts it in a band ("Kis less than 20 nM") at rat D4. PMC10724577 prints 1.44 nM but as a "Min Activity" scrape from a bioactivity database in a liver-cancer repurposing paper that measured nothing. | A primary radioligand study with fluphenazine as a test compound, or the PDSP source record behind the GtoPdb figure. |
| **fluphenazine** | 5-HT2A | 12629531 (Kroeze 2003) tabulates it, but its abstract reports only correlation coefficients. | Kroeze 2003 Table 1. **Network gap**: the PDF is free at nature.com, which this proxy refuses. |
| **fluphenazine** | H1 | As above. A PDSP median (pKi 7.7) corroborates the removed 20 nM, so the value is probably right — it just has no reachable primary. | As above. |
| **clomipramine** | SERT | 9537821 (Tatsumi 1997) is the right paper and clomipramine is a genuine panel member, but the abstract names only mazindol, sertraline and nomifensine. PMC2665081 studies clomipramine at hSERT, but its Table 1 is a **bitmap** — no numeric cell exists in the HTML — and its value is an uptake-inhibition Ki, not a binding Ki. | Tatsumi 1997's hSERT column (Eur J Pharmacol 340:249-258). Elsevier, **network gap**. |
| **clomipramine** | NET | Same paper, same wall. The removed 39.8 nM is pKd 7.4 back-converted. | Tatsumi 1997's hNET column. |
| **diphenhydramine** | H1 | 12065734 (Booth 2002), the cited source, **never names diphenhydramine**; its subject is the radioligand H2-PAT. Three open-access antihistamine kinetics papers were checked and none carries a value. | **A true evidence gap**, not a network one: Booth would only ever hold it as a reference antagonist. Needs a primary human-H1 competition study with diphenhydramine as a test compound. |
| **fexofenadine** | H1 | 19660947 (Aslanian 2009) contains **no numbers at all** and never names fexofenadine; its subjects are terfenadine analogues. PMC6536503 gives pKd values per enantiomer, kinetically derived and probe-dependent — three reasons it cannot fill a racemate's equilibrium row. | Also **a true evidence gap**. Needs a study with racemic fexofenadine as a test compound. |
| **scopolamine** | muscarinic (M3) | 1346637 (Bolden 1992) is exactly the right kind of source — cloned human m1-m5, [3H]QNB, scopolamine a genuine panel member — but its abstract names only QNB's own Kd. 73 further hits screened; the rest are reviews or use scopolamine as the reference antagonist. | Bolden 1992's m1-m5 table (JPET 260:576-580). ASPET, **network gap**. One PDF closes it. |
| **trazodone** | 5-HT2A | 15322733 (Knight 2004) **never names trazodone**. Cusack 1994 and Owens 1997 were already recorded as table-only and did not reopen. `trazodone AND "5-HT2C" AND Ki` returns 0 hits. | Knight 2004's table, Springer, **network gap** — but note it measures against AGONIST radioligands at the agonist-preferring conformation, so a trazodone value from it is not interchangeable with an antagonist-radioligand Ki. Cusack 1994 is the better target. |
| **trazodone** | 5-HT2C | As above; the removed 251 nM is pKi 6.6 back-converted. | As above. |
| **fludrocortisone** | MR | 8282004 (Rupprecht 1993) states no fludrocortisone number. All four retrieval routes were tested and named: no PMC copy, Europe PMC `isOpenAccess N`, doi.org and linkinghub.elsevier.com both refused. 7 further candidates, all rat or narrative. | Rupprecht 1993's binding table. **Definitively unreachable from this container**; this also blocks the two cortisol rows removed above. |
| **triamcinolone** | GR | 10747884 (Lind 2000) is a mutagenesis paper whose abstract carries no constant for any compound. | Lind 2000 Table I/II, free at jbc.org, **network gap**. Check first which compound the column holds: MW 394.43 is the free alcohol, while GR panels of that era usually run triamcinolone **acetonide** (434.5). |
| **progesterone** | PR | 9464360 (Zhi 1998) states "progesterone (Ki = 3.5 nM)" verbatim — but progesterone is the reference standard in a paper about nonsteroidal chromenoquinolines, so the comparator rule rejects it. 9667968, cited as corroboration, states **no progesterone value at all**. | A policy decision, not a document. See below. |
| **ghrp-2** | GHS-R | 9092793 (McKee 1997) gives only the radioligand's own KD (MK-0677, 0.7 nM). | McKee 1997's competition table. **Network gap, and a one-fetch close**: Europe PMC lists a FREE PDF at academic.oup.com, which this proxy refuses. The receptor is rat even so. |
| **naloxone** | delta | 9686407 (Toll 1998) **has no abstract in PubMed at all**. 12576191 gives ratios only and is mouse; 8603422 says "approximately 29 nM" with naloxone a comparator in SCLC membranes; 8114680 (Raynor 1994) has an abstract with zero numerals. | Toll 1998 via archives.nida.nih.gov — a free government PDF, **refused by this proxy**. It would close this row plus the two removed above. Second choice, Raynor 1994 Table 1. |

### A policy question this pass could not settle

Three cells now fail for the same structural reason, and no amount of further
searching will fix them: **haloperidol** at D3 and 5-HT2A, **progesterone** at
PR, and **naloxone** at delta. Each is a universal reference ligand in its
field. Its affinity is measured constantly, stated verbatim, and well
characterised — but always in a paper about some other compound, because
nobody publishes a paper whose subject is the reference standard. The
comparator rule in HYGIENE R2 exists because a comparator's value is often
wrong for the named compound; in these three cases it is almost certainly
right. Either the rule gains a narrow exception for a reference ligand
characterised in a full panel under one method, or these cells stay open
permanently. Re-running a literature pass on them is wasted effort.

### Network gaps, all confirmed by attempt this session

`nature.com`, `sciencedirect.com`, `linkinghub.elsevier.com`, `doi.org`,
`link.springer.com`, `jpet.aspetjournals.org`, `academic.oup.com`, `jbc.org`,
`archives.nida.nih.gov`, `files.eric.ed.gov`, `jstage.jst.go.jp`, and the
metadata APIs `unpaywall`, `openalex`, `crossref`, `semanticscholar`,
`core.ac.uk`, `bindingdb`, `pdsp.unc.edu` — all return CONNECT 403 through
this container's proxy, while `authoring/NETWORK.md` lists several as expected.
**Eight of the fifteen removals are gated only by that**, and each names a
document that is free where it sits. A session with those hosts open should
retry them before searching again.

### Retrieval route that keeps working

`efetch db=pmc` returning front matter with "The publisher of this article does
not allow downloading of the full text in XML form" and no `<body>` is NOT the
end of the road: `https://pmc.ncbi.nlm.nih.gov/articles/PMCnnnnnnn/` serves the
complete article including tables. That route closed five rows today (Cross
2016, Seeman 2014, Proudman 2020, Baker 2005, Torralva 2020) after both
`efetch` and Europe PMC's `fullTextXML` had failed on them. It rate-limits
hard — a reCAPTCHA page of about 21 KB means back off for a minute, not that
the article is unavailable. Try it before writing "full text not retrieved".

### Carried forward, not fixed here

| Finding | Detail |
| --- | --- |
| **labetalol has no beta-1 row** | Baker 2005 Table 1 gives it verbatim (log KD -7.63, KD 23.4 nM) beside the beta-2 value this pass authored. A beta-blocker carrying only a beta-2 row reads oddly. One line from a table already read. |
| **Baker 2005 misspells labetalol as "Labetolol"** | A grep of that full text for the correct spelling returns nothing and nearly filed the row as absent. |
| **fluphenazine keeps an effect_compartment with no occupancy** | Its three rows were removed; the kₑₒ has nothing left to drive. Not wrong, but orphaned. |
| **PMID:9667968 was cited for a value it does not contain** | It sat on the progesterone row as corroboration and states no progesterone figure at all. Independent of whether that row returns. |
| **morphine's mu row is unaffected** | It cites PMID:1851921, not Torralva 2020, whose MOR column is **rat** (CHO-rMOR). If that row is ever re-sourced there, the species changes. |

## Requested-candidate screen — 17 already present, 2 rejected on literature volume (2026-09-26)

A list of 26 candidate compounds was screened against the catalog and against PubMed.
**Seventeen were already here** under their own slug or an alias and needed nothing: `kpv`,
`humanin`, `pinealon`, `cartalax`, `ovagen`, `thymosin-alpha-1`, `vilon`, `cibinetide`
(requested as Ara-290), `dsip`, `9-me-bc`, `agmatine`, `17a-estradiol`, `epicatechin`,
`foxo4-dri`, `5-amino-1mq`, `ss-31` (requested as elamipretide) and `ergothioneine`. That is
HYGIENE Part 1 gate 1 doing its job: a request list is not a gap list.

`pyridoxamine` is genuinely absent and is NOT a collision with the two B6 records already
here — `pyridoxine` (169.18) and `p5p` (247.14) are the alcohol and phosphate vitamers, and
pyridoxamine is the third, distinct amine vitamer.

### Rejected on gate 5 — no indexed literature at all

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`ptc-2105`** | the whole record | Requested as an "Eos senotherapeutic peptide" with company-stage mouse rejuvenation claims. `esearch term=PTC-2105` returns **count 0**, and `PTC-2105 OR PTC-2107 OR Eos senotherapeutic` also returns **count 0** (2026-09-26). No indexed literature means no verifiable structure, no mechanism that is not a vendor claim, and no mass that could be stored without lending it a precision nothing supports — the `adamax` precedent. This is the `piribedil` decision in HYGIENE gate 5, applied to a compound with even less. | A first indexed primary paper naming the sequence or the structure. Until then, leave closed: a record here would be a vendor press release wearing a schema. |
| **`ptc-2107`** | the whole record | Same screen, same result: **count 0** on its own term and count 0 in the combined search. | As above. |

### Authored as a mixture, with its composition deliberately unfilled

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`gly-low`** | `composition[]` | Added as a `mixture` record because the combination is real, indexed and named: PMID:41086114 (Cell Rep 2025) states it verbatim — "A combination of nicotinamide, alpha-lipoic acid, thiamine, pyridoxamine, and piperine (Gly-Low)". Four constituents already have records and the fifth is `pyridoxamine`. But `composition[].mg_per_g_extract` is a **required positive number**, and no fetched abstract gives a per-ingredient amount or ratio — the mouse work quantifies nothing beyond "Gly-Low (in chow)" / "Gly-Low-enriched chow" (PMID:41247756). Filling five ratios to satisfy the schema would be five invented numbers. | The patent or the supplement's label, which would state the per-ingredient amounts. Also the Cell Rep methods section, which is likely to give the chow concentration. Neither was retrieved this session. |
| **`gly-low`** | `doses`, all PK | Every published exposure is dietary, in mice, unquantified per ingredient. No human exposure exists. | A human trial, which does not yet exist. |

**A citation deliberately not made, recorded so it is not "found" later:** PMID:41045492 (Aging
2025, growth-hormone excess drives liver aging via glycation stress) comes back in every Gly-Low
search and is from the same programme, but **its abstract does not mention Gly-Low**, so it is not
on the record. And the aortic study exists twice — bioRxiv PMID:39829921 and published
PMID:41247756 — whose abstracts word the same result differently ("old (24 month) mice" vs
"C57BL/6J (24 month) mice"). The published one is cited and quoted.

## Requested-candidate batch, part 2 — 9 records added, every PK cell skipped (2026-09-26)

Nine of the screened candidates cleared gates 1-5 and were authored. **Not one of them got a PK
curve**, and that is the finding rather than a shortfall: four have real human exposure and none
has a publishable human curve. Every PMID below was fetched this session; every quoted span in the
nine records was checked against its cited abstract with the registry's own matcher (64 spans
matched, the remainder being quoted proper nouns and prose, not claims).

### Peptides — `research-only`, plus one `mixture`

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`s14g-humanin`** | `mw_g_mol` | PubChem has **no CID** under `S14G-humanin`, `S14G humanin`, `HNG`, `humanin G` or `Gly14-humanin` (all PUGREST.NotFound). The parent humanin is CID 16131438 (C119H204N34O32S2, 2687.2) and **that mass belongs to the parent**. A Ser->Gly substitution is -CH2O, so ~2657.2 is arithmetically implied, but no abstract states a formula for the analogue, so it is not authored even as a declared derivation. | A PubChem entry, or a paper printing the analogue's formula or exact mass. |
| **`s14g-humanin`** | all PK, `doses` | Rat, mouse and human cells only; no human administration exists. Published routes are IV (rat), IP and ICV (mouse) — the latter two unrepresentable here. PMID:41975304 looks like human exposure and is not: it measures **endogenous** humanin as an exercise biomarker. | A human study, which does not exist. |
| **`cortagen`** | all PK, human dose, target | 13 `Cortagen[tiab]` hits, all rat, mouse, chicken, cell culture or review. Only dose anywhere is rat IM 10 µg/kg × 10 d (PMID:11276314). Human use is asserted in one background sentence of a mouse microarray paper (PMID:15159690) with no dose, n, route or trial id — the secondary-citation shape R2 rejects. No receptor or molecular target is named in any abstract. | A primary human study; any paper naming a molecular target. |
| **`vesugen`** | `doses`, route, all PK | Humans **have** been given it — PMID:26390612, 32 patients aged 41-83 — but that abstract states no dose, no route and no schedule. The only route statement is review-level (PMID:34173097, "Oral application of KED"). Worth carrying forward: the same human abstract reports **harm**, prooxidant activity and "significant inhibition of hemopoiesis", and it was co-administered with Pinealon so neither effect is attributable to KED alone. | A primary human study printing a dose; full text of PMID:26390612. |
| **`thymalin`** | `mw_g_mol` | **A trap, recorded so nobody repeats it.** PubChem for `Thymalin` returns CID 3085284 (C33H54N12O15, 858.9), whose synonym list — fetched directly — is "Nonathymulin", "Nonathymulin [INN]", "Thymic factor", "Thymulin (pig peptide moiety)", CAS 63958-90-7, i.e. **the thymulin nonapeptide, a different substance** that merely carries "Thymalin" as a synonym. Storing 858.9 would be a wrong-molecule mass. A multi-constituent preparation stores none (gate 3, pentosan-polysulfate precedent). | Nothing: the determination is that this preparation has no single mass. Leave closed. |
| **`thymalin`** | `composition[]` | Only two constituents are named — PMID:37686182, "KE and EW dipeptides are active substances of Thymalin" — and no abstract gives an amount, while `composition[].mg_per_g_extract` is a **required positive number**. Note KE (Lys-Glu) is the same dipeptide this catalog holds as `vilon`. | A manufacturer's monograph or an analytical paper quantifying the extract. |
| **`thymalin`** | `doses`, all PK | No dose in any units in any of 7 abstracts fetched, despite 293 indexed records and decades of clinical use. Targeted searches (`thymalin[tiab] AND intramuscular`, `thymalin[tiab] AND (dose OR mg)`) returned no abstract printing one. **A dose that must not be imported:** PMID:24734422's "0.005 mg / kg and 0.05 mg /kg" belongs to **tinrostim**, a comparator. | Full text of any of the Russian clinical reports. |
| **`pnc-27`** | in-vivo dose, all PK, sequence | Preclinical only after two decades; total corpus 25 records. The one potency figure is a concentration (IC50 12.4 µM, PMID:40750238), not a dose. In-vivo work is asserted without numbers (PMID:28667027); the only in-vivo route is intraperitoneal, unrepresentable here. `PNC-27 AND (clinical OR patients OR phase)` returns 5 records, all in vitro or ex vivo — PMID:26663795 says "Patient-Derived" in its title but studied **cells, not patients**. The residue sequence is in no abstract read. | Full text of PMID:14967026 for the sequence; a first in-vivo dose-ranging paper. |

### Small molecules — real human exposure, no publishable curve

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`halofuginone`** | human `half_life_hr`, `V_L`, `F`, Cmax | **The only human PK study publishes no number.** PMID:16815702 is a phase I PK study with halofuginone as its subject and reports only "The PKs of halofuginone were linear over the dose range studied with a large interpatient variability" — a paraphrase (smell #6). It has no PMC record of its own, so **full text not retrieved**. Rejected en route: PMID:12869955 ("plasma levels surpassed the predicted therapeutic exposure", review, no number); PMID:15358305 (assay development, dog plasma); PMID:16526445, PMID:7263804 (residue assays in sturgeon/chicken); PMID:20736042 (**doxycycline** PK in broilers, halofuginone only a pretreatment). | Full text of de Jonge 2006 *Eur J Cancer*, or an EMA/FDA clinical-pharmacology package. |
| **`halofuginone`** | animal PK, deliberately not carried onto the record | Real animal PK exists and was **not** authored: cattle oral t½ "harmonic mean of 27.3 h" (PMID:2590824, the paper's own point value, not a midpoint) and mouse/rat IV clearances (PMID:11761455). The reason is in that second paper — "The bioavailability of HF after i.p. and oral delivery to mice was 100% and 0%, respectively". A 0% oral F in mouse, for a drug given orally to humans, is a species discrepancy wide enough that importing any animal parameter would mislead (R8, the dofetilide lesson). | Human data. The animal numbers are recorded in `notes` and should stay there. |
| **`halofuginone`** | EPRS Ki/IC50 | No abstract states a constant for halofuginone against its own target. PMID:24100331 is a human PRS co-crystal with HF as subject but says only "high-affinity" — qualitative, the ixekizumab shape. **Numeral collisions rejected:** PMID:36394909's IC50 0.18 µM / Kd 30.3 nM belong to its designed compound 3; PMID:31821989's IC50 1.4 µM is compound 30d against *Salmonella* ThrRS; PMID:35333915's "nanomolar IC50" is a paraphrase and the enzyme is *T. gondii*. | Full text of Keller 2012 (PMC3281520), which is in PMC and may print the constant. |
| **`mitoglitazone`** | all PK, target constant | `MSDC-0160 AND pharmacokinetics` returns **0 hits**. Corpus is 14 + 6 records; every clinical abstract was fetched and both trials print doses only. **A citation deliberately not made:** PMID:23690925 identifies mTOT as Mpc1/Mpc2 but never mentions MSDC-0160 — it names **MSDC-0602** — so citing it for this compound would be a textbook secondary citation. | The sponsor's clinical-pharmacology package; nothing indexed will close it. |
| **`mitoglitazone`**, **`pyridoxamine`** | route provenance | `PO` on `mitoglitazone`, and on pyridoxamine's Pyridorin arms, is an **inference, not a citation**: PMID:23462886, PMID:24931567 and PMID:22034637 all say "once daily" / "twice daily" and never write "oral". Flagged in both records' notes. (Halofuginone is the contrast — PMID:16815702 does say "orally".) | Either trial's methods section. |
| **`skq1`** | any human systemic exposure | **The skip is the finding.** `SkQ1 AND (oral OR intravenous) AND human` → 0 hits; `SkQ1 AND (phase 1 OR tolerability) AND systemic` → 0 hits. Human use is ophthalmic topical only (PMID:26660938, 240 subjects). Hence `local-acting`: a plasma curve would be invented and an occupancy row against one meaningless (R14, loperamide). | A systemic phase 1, which does not appear to exist. |
| **`skq1`** | `doses`, cation `mw_g_mol` | The trial abstract gives the regimen ("three times daily (TID) for 6 weeks") but **no drop strength**, so there is no numeric dose. The stored mass 617.6 is PubChem CID 16679091, which the formula C36H42BrO2P shows is the **bromide salt** of a permanently charged cation; no cation-only CID was fetched and none was computed, since that would mean supplying an atomic mass from memory. Nothing in the record does molar arithmetic, so the salt mass corrupts nothing today. | The Visomitin registration dossier for the strength (Russian registration, so not on DailyMed); a cation CID for the mass. |
| **`pyridoxamine`** | `half_life_hr`, `V_L`, `F` | The one human study (PMID:34229268, 5 healthy volunteers, NCT02954588) prints **Cmax only**: "plasma PM increased in the first 3 h to a maximum of 2324 ± 266 nmol/L". "Returned to baseline after ~10 h" is an approximate duration, **not** a t½. No IV arm exists anywhere, so **no absolute F is obtainable**. A V/F is one division away and is written out in the record's notes as 511.7 L **and deliberately not stored** — salt-vs-base unresolved, endogenous baseline unsubtracted, PLP conversion saturable. Wrong-vitamer traps rejected: PMID:21079545 (doxylamine-**pyridoxine**), PMID:4056565 (pyridoxal-phosphate clearance). | Full text of PMID:34229268 (*Clin Nutr*, author-copyright) may print a t½ or AUC the abstract omits — **the highest-value single follow-up in this batch**. |
| **`pyridoxamine`** | AGE-inhibition IC50 | `pyridoxamine AND dicarbonyl AND methylglyoxal AND IC50` → 0 hits. PMID:9038143 (the post-Amadori paper) names pyridoxamine only qualitatively and its subject is aminoguanidine and a kinetic method. | A dedicated potency paper. |

## Performance / experimental breadth batch — 11 added, 4 with curves (2026-09-26)

Chosen against what the catalog already holds (30 SARMs/anabolics, 14 GH/IGF agents, 31
longevity compounds, 26 nootropics), so the target was not more stubs but the classes where
**real human PK is obtainable**. Eleven records: `roxadustat`, `daprodustat`, `vadadustat`,
`orforglipron`, `survodutide`, `mazdutide`, `bimagrumab`, `somapacitan`, `macimorelin`,
`acadesine`, `mitoq`. Seven carry authored PK. Already present and therefore not re-added:
`follistatin-344`, `ace-031`, `navitoclax`, `nsi-189`, `tianeptine`, `rad-150`, `enobosarm`,
`telmisartan`, `glynac`.

### Three PubChem name lookups that return the wrong molecule — verified first-hand

These are the batch's most reusable findings. Each was re-queried directly 2026-09-26.

| Name queried | What PubChem returns | What it actually is | The error avoided |
| --- | --- | --- | --- |
| `somapacitan` | CID 129894493, C54H95N13O20S2, **1310.5** | the albumin-binding **side-chain/linker fragment** | A 191-residue protein cannot weigh 1310 Da. The Sogroya label states the real mass verbatim, **23305.10**. Storing PubChem's would be a silent ~18x molar error — the `lithium` shape in R10. |
| `AICAR` | CID 65110, C9H15N4O8P, **338.21** | **ZMP**, the intracellular monophosphate metabolite — the phosphate is right there in the formula | 31% too high, for a phosphorylated species no patient is ever given. The drug is the riboside: `acadesine` → CID 17513, C9H14N4O5, **258.23**. The record is registered under `acadesine` with `AICAR` as an alias for exactly this reason. |
| `MitoQ` | CID 11388331, C38H47O7PS, **678.8** | the **mesylate salt** | The active species is the cation, `mitoquinone` → CID 11388332, C37H44O4P+, **583.7**, with an explicit `+`. Counter-ion confirmed by subtracting the two fetched formulae: CH3O3S, one methanesulfonate. |

`macimorelin` is the only one of the four that behaves, and even there the product is the acetate
(CID 71526737, 534.6) while every dose is the free base (CID 9804938, 474.6).

### Skipped cells

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`roxadustat`** | `pk.PO.V_L` | PMID:27352308 names `Vz/F` in Methods, discusses its variability, and **never prints a number** — in the abstract or in the retrieved full text. Not an abstract-only gap: a named-but-never-printed one. The only published volume, PMID:33486718's 14.9 L, is an apparent **central** volume from a two-compartment population fit, and R15 bars both a `Vc` in a one-compartment slot and summing Vc+Vp. | The FDA or EMA clinical-pharmacology review. **There is no US label**: DailyMed SPL v2 returns zero records for `roxadustat` and for `evrenzo`. |
| **`roxadustat`** | `pk.PO.F` | No IV formulation and no IV arm exists, so no absolute F exists. `F: 1` is pinned and the apparent CL/F 1.1 L/h is kept out of the slot. | Nothing; leave closed. |
| **`daprodustat`** | `fraction_unbound` as a measurement | Only the inequality ">99%" exists (Jesduvroq label, in vitro), stored at its under-correcting endpoint 0.01. The identical figure in PMID:34713596's full text is explicitly **"GSK data on file"**, so that paper must never be cited for it. Contrast roxadustat, which has a real equilibrium-dialysis 0.0081. | A dedicated binding study, or the FDA review's in-vitro table. |
| **`vadadustat`** | `V_L`, `F`, `CL`, Cmax, AUC | Absent from Vafseo label section 12.3 and from every abstract fetched. The anchor PK paper PMID:38924087 has **no PMC copy — full text not retrieved**, so its PK table is unread. It also carries an **erratum, PMID:39520093, whose own abstract has no content**, so what was corrected is unknown; that is why its 4.5 h was recorded and the unaffected 5.8 h from PMID:33661566 was stored instead. | Publisher full text of PMID:38924087 *and* its erratum, or the FDA review for Vafseo. |
| **all three HIF-PHIs** | `receptor_occupancy` | No numeric IC50 or Ki anywhere for any of them. Both labels say only "IC50 in the (low) nM range"; the three discovery papers say "low nanomolar" (PMID:28928122, PMID:35926869) or state the mechanism without a constant (PMID:32487538). **Rejected on two independent grounds:** PMID:35204103's IC50 is a luciferase **reporter** EC50, not an enzyme IC50, *and* roxadustat and vadadustat are comparators there to novel oxyquinolines. | Full text of PMID:28928122, PMID:35926869 and PMID:32487538, where the per-isoform PHD1/2/3 tables almost certainly live. |
| **`orforglipron`** | `receptor_occupancy` | The affinity IS verbatim and the compound IS the subject — "orforglipron is a high-affinity [inhibition constant (Ki) = 1 nM], selective ligand of the human GLP-1R" (PMID:39693407) — but no published effect-compartment rate constant exists to drive a row, and `receptor.needs-keo` is an error. The Ki is also printed to one significant figure. Recorded in prose instead. | A published GLP-1R PK/PD effect-compartment fit. |
| **`survodutide`** | all PK | PK endpoints were measured and no magnitude was published. The one PK paper reports Cmax only as a ratio ("90% CIs for adjusted geometric mean ratios spanned 1"). `survodutide AND pharmacokinetics` returns **2 records**. The single-dose arm is explicit, so a Cmax exists and is simply not printed. **Full text not retrieved** (no PMC copy). | J Hepatol 2024 full text (PMID:38857788), whose table should hold AUC0-inf, Cmax and t1/2 for the 0.3 mg single SC dose. |
| **`mazdutide`** | `half_life_hr`, Cmax | The single-dose half-life is a **4.6-fold range**, "147.3 hours to 673.3 hours (6.1 days to 28.1 days)" (PMID:35750681 full text) — 6 days and 28 days imply different pharmacology on a weekly interval, so R3 requires a skip, not an endpoint. The only clean number, "approximately 8 days", is hedged and is **week-20 steady state**. `mazdutide AND pharmacokinetics` returns **0 records**. | Supplementary Table S1 (PMID:35750681) and Table S3 (PMID:40832785) — neither retrieved. |
| **`bimagrumab`** | `mw_g_mol`, and hence `receptor_occupancy` | PubChem has no entry, and none of three full texts read prints a kDa figure, so the familiar ~150 kDa IgG mass is not citable from anything fetched. **That absence blocks an occupancy row even though a real affinity exists** (Fab Kd 973 pM ActRIIA / 16 pM ActRIIB, PMID:29109273 full text, SPR), because `ec50_mg_l` needs the mass for the nM conversion. | Full text of PMID:24298022, the BYM338 discovery paper — `efetch db=pmc PMC3911487` returned 9,826 bytes with **no `<body>`**, so it is outside the OA subset. Best single unlock for both the mass and a whole-IgG KD. |
| **`bimagrumab`** | `half_life_hr`, `CL` | **The source states they are not derivable**, which is stronger than absence: "other PK parameters, such as clearance and half-life, could not be derived using non-compartmental analysis" because of target-mediated disposition (PMID:33264516 full text). A single scalar half-life is arguably the wrong model object here. | A population PK model with a TMDD structure. Leave the NCA route closed. |
| **`somapacitan`** | `pk.SC.ka_hr` | `pk.defaulted-ka-slow` now fires on this record and the firing is correct. The label gives Tmax only as **ranges** — "reached 4 to 24 hours post dose" in adults, "8 to 25 hours" in paediatric GHD — so no honest ka derivation exists from them, and the 1/h default puts a weekly protein's peak at 4.3 h. | A published absorption-rate estimate, or a Tmax point value. |
| **`somapacitan`** | volume from a Cmax | Recorded so the next pass does not re-litigate it: **the R9 accumulation trap does NOT apply here.** PMID:28656605's Cmax figures are genuinely single-dose, the label says steady state arrives in 1-2 weeks, and PMID:29671202 reports "little or no accumulation of somapacitan". The blocker is **R15 non-linearity** instead — an eightfold dose gives a twentyfold Cmax (21.8 → 458.4 ng/mL) and the label confirms "a non-linear dose-exposure relationship with a greater than dose proportional increase in exposure". So dose/Cmax is not a volume anyone measured. | Nothing; the label's population V/F 14.6 L is already stored and is the right object. |
| **`somapacitan`** | GHR affinity | Measured but qualitative: "Receptor binding isotherms were characterized by a high and a low affinity interaction site with or without HSA" (PMID:32053994), no Kd — the ixekizumab shape. | Full text PMC7072805 (open access, not pulled) for the ITC constants. |
| **`macimorelin`** | GHS-R1a affinity | PMID:12646029 is the discovery paper with macimorelin as **subject** and states that binding to human pituitary GHS receptors and hGHS-R1a was measured, but prints **no constant** — only "high potency". **Full text not retrieved**: no `pubmed_pmc` link, so outside the OA subset. PMID:12240910 says only "similar to that of ghrelin", qualitative and comparator-framed, and names the compound EP1572. Do **not** substitute a GtoPdb aggregate. | J Med Chem 46(7):1191-203 table via institutional access. |
| **`macimorelin`** | `V_L`, `F`, `fraction_unbound` | No volume, no bioavailability and no protein binding in the label or either PK paper. No IV arm for the named compound, so no absolute F is obtainable. Exposure is also **less** than dose-proportional over 0.5-1.0 mg/kg, so no volume was derived by division. | The FDA clinical-pharmacology review for Macrilen. |
| **`acadesine`** | target affinity | Not merely absent — **the wrong primitive**. Target engagement is intracellular and allosteric (ZMP mimicking AMP at AMPK), so a Hill occupancy row against a plasma curve would misrepresent the pharmacology. The canonical mechanism paper (PMID:7744080) states no constant; PMID:30478173 is **yeast** and reports protein identifications. | Leave closed. Also: do not adopt the 2008 development profile's "adenosine receptor agonist" framing, which conflicts with the primary literature. |
| **`mitoq`** | the entire PK layer | **No human pharmacokinetic parameter exists.** `MitoQ AND Cmax` → 0 hits; `MitoQ AND (healthy volunteers OR first-in-human) AND dose` → 0 hits; the `mitoquinone AND pharmacokinetics` hits are rat or Caco-2. Plasma MitoQ **was** measured in PMID:29661838, whose full text was genuinely read (PMC5945293, `<body>` confirmed), but the number lives **only inside Figure 1** — not in any sentence or table, so reading it out would be the figure-legend defect R2 names. The authors call that sample a 24-26 h trough at 6-week steady state, so it would not license a volume even if printed. Its two citations for "the known pharmacokinetic profile" are both reviews, and the fetched one (PMID:20649545) prints no number. | A first-in-human PK study, which is not indexed. |
| **`mitoq`** | `dose_moiety_fraction` | `dose.salt-moiety-unset` fires on this record and **the rule is right** — this is the gap becoming visible, not a rule misfire (contrast R16). The cation fraction is computable, 583.7/678.8 = 0.860 from two fetched masses, but **no source states whether the 20/40/80/160 mg doses are salt or cation**, and MitoQ is a supplement with no FDA label to settle it. Applying 0.860 silently would invent the missing fact. | A manufacturer's specification, or any paper stating the moiety. |

**Live leads not pulled**, all open-access PMC ids seen in fetched records: PMC7072805
(somapacitan ITC binding constants), PMC3579463 (acadesine CLL trial PK table), PMC8332591,
PMC6325982, PMC9175552, PMC11271340 (somapacitan, may carry absolute PK in tables). Any value
taken from one must say **"full text"** in the note.

## verify:quotes to green — 12 quotes repaired, 0 values invented (2026-09-27)

`pnpm verify:quotes` was failing on `main` at 12 findings. All twelve are now closed and the gate
PASSES at 232 quotes checked. **Not one stored value turned out to be wrong**, and nothing was
removed: every failure was a quote that did not belong to the PMID it was written beside. That is
worth stating plainly, because the batch was planned expecting to strip rows.

### The class this batch actually found

A note quotes a sentence; the gate attributes every quoted span to that row's `source_pmid`. Eight
of the twelve were a phrase from a **different document** sitting in quotation marks — another
paper's characterisation, the paper's own terminology, a review's figure, or a drug label's. The
value was fine; the record was making a verbatim claim against a document that never said it.
`vadadustat` (fixed in `e8e5d68`) was the same defect, introduced the day before by this author.

**It is invisible wherever a note cites PMIDs inline in prose rather than beside a `source_pmid`**,
which is how every stub record added on 2026-09-26 is written. That is roadmap item T1.

### Values confirmed by full text, via the PMC article route

`https://pmc.ncbi.nlm.nih.gov/articles/PMCnnnnnnn/` worked on all four papers tried, including two
where `efetch db=pmc` returns front matter only. One (PMC5591798) needed **two 45-second backoffs**
before it served anything but a reCAPTCHA — the behaviour this ledger already describes. Notes on
these now say "full text", the exemption `verify-quotes` documents.

| Cell | Confirmed | Location |
| --- | --- | --- |
| `cbd` CB1 / CB2 | Ki 4.9 µM and 4.2 µM | Thomas 2007 Table 1 (PMC2189767), column "Ki for displacement of [3H]CP55940" |
| `cbg` CB1 / CB2 | Ki 381 nM and 2.6 µM | Cascio 2010 Figure 1 legend (PMC2823359) |
| `guselkumab` | KD 35 pM | Zhou 2021 body (PMC8409790) |
| `lsd` keo | 1.8 ± 1.3 /h | Dolder 2017 Table 2 (PMC5591798), row "Any drug effect", 100 µg |

### Findings that only reading the source produced

| Record | Finding | What was done |
| --- | --- | --- |
| **`cbd`** CB1 | Thomas 2007 Table 1 marks the 4.9 µM datum **footnote b, "Data previously published in Thomas et al. (2004)"** — the 2007 paper reproduces an earlier measurement. | Kept the 2007 citation and disclosed the footnote. Re-citing to PMID:15033394 would be **worse**: its abstract states no Ki and its subject is the azido analogue, so cannabidiol is not its subject either. That PMID is in `refs[]`. |
| **`cbd`**, **`cbg`** | Both CB1 rows are **mouse brain** membranes, both CB2 rows human CHO lines. An occupancy row has no `source_species`, so R8 puts species in the note; two of the four carried it only implicitly. | Species now explicit on all four. |
| **`guselkumab`** | `ec50_mg_l` was derived from MW **148000** while the record stores **147000**. | Recomputed against the record's own mass, 0.005180 → 0.005145 mg/L. A declared derivation whose input is not the record's own value is not reconstructible. |
| **`bergamottin`** | The stored quote compared **BG with NRG** and appears nowhere in PMID:15285845. The abstract *does* state the value: "in human liver microsomes … Ki = 34 +/- 5 microM" (co-incubation; 22 and 27 µM for pre-incubation ± NADPH). Separately `mbi: true` **contradicted the abstract**, which confines mechanism-based inhibition to **rat** and calls it mixed-type "in rat and man". | Quote replaced with the real sentence; `mbi` removed. |
| **`cimetidine`** | `auc_ratio` 1.5548 came from clearance figures (66.7 → 42.9 ml/min) in **PMID:6096071, a *ranitidine* review in which cimetidine is the comparator** — while the row cited PMID:89387, which states none of them. | Recalibrated from the row's own primary, verbatim: "the plasma-warfarin concentration from 0.96 to 1.76 microgram/ml" → ratio 1.8333, ki 5/(1.8333−1) = **6.0 µM** (was 9.01). The review is in `refs[]`. |
| **`topiramate`** | `"low nanomolar"` belongs to PMID:12617904, quoted inside a row citing PMID:10768298 (whose abstract *does* state the 7 µM the row uses). | Described, not quoted; ownership named. |
| **`terazosin`** | The failing span was the **paper's terminology**, which the note itself already said. The value quote passes and is untouched. | Terminology described. |
| **`voriconazole`** | The 7-fold/11-fold figures are the **label's**, not PMID:16635790's — which states no fold-change. An interaction row carries only `source_pmid` and has no `source_label` field. | Figures described and the label named precisely (set id `c620b2d7-3c2b-4252-8cfc-2f322d624435`, effective 2026-08-27, verified this session). The PMID stays as the clinical series behind the `contraindicated` level, quoted where it does speak: "an empiric initial 90% sirolimus dose reduction". |

### Open, carried forward

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`clarithromycin`** | `interactions[5].kinetics.auc_ratio` | The row cites Terkeltaub 2011 (PMID:21480191), the seven-study DDI programme that produced the data, but its abstract gives only ">125% across all studies" with **no per-drug figure**, and the paper is **not in PMC** — full text NOT RETRIEVED. The stored 3.82 comes from the 277%/282% reported in PMID:23462027, a 2013 review. So the ratio rests on a review while the citation points at the primary. Also: Terkeltaub 2011 carries an **erratum, "Dosage error in article text"** (Arthritis Rheum 2011;63(11):3521), unread. | Publisher full text of PMID:21480191 for the per-inhibitor table, and its erratum. Until then the review is named in `refs[]` and the dependency is on the record. |
| **`cimetidine`** | the new 6.0 µM | The 1.76/0.96 ratio is a **steady-state Css ratio** at subtherapeutic daily warfarin, not a single-dose AUC ratio. It is AUC-proportional at steady state, which is why it is usable, but it is not the same object as a single-dose AUC fold-change. | A single-dose crossover AUC ratio for cimetidine + warfarin; the note names the Serlin/Toon-era studies as where to look. |

## The widened quote gate — 22 records repaired, 0 values invented (2026-09-27)

Extending `verify:quotes` to inline `PMID:n … "quote"` citations (roadmap T1) took coverage from
**232 quotes to 590** and reported 22 failures on records nobody had re-read since they were
written. All 22 are closed and the gate PASSES. **Again not one stored value was wrong.** Two
batches in a row have now found the same thing: the defects in this catalog's provenance are
citation-attribution errors, not fabricated numbers.

### Three of the reported failures were the RULE, and fixing them raised coverage twice

HYGIENE R16, three times in one afternoon:

1. **A vulgar fraction.** PubMed prints perampanel's `mean t½, 109 h`; the note writes `t1/2`.
   U+00BD now folds.
2. **A Lancet middle-dot decimal.** survodutide's phase 2 abstract reads `0·6, 2·4, 3·6, or 4·8 mg`
   against the note's `0.6, 2.4`. U+00B7 now folds **between digits only** — it is an ordinary
   separator elsewhere, and there is a test asserting `A·B` is still not `A.B`.
3. **Quotation pairing.** A short quoted term shifts a scanning regex's parity: metronidazole's
   `a lower BOUND (">90%") while the measured figure is "approximately 1"` had thirty characters of
   *this repository's own prose* reported as a quotation. And a quotation may contain a full stop,
   so per-clause pairing splits it and gets the parity wrong on both sides — that mistake turned 16
   findings into 30, eight of them trailing editorial glosses (`— metoclopramide D2 Ki 444 nM.`).
   Pairing now happens over the whole note and each span is traced to the clause it opened in.

### What the 22 actually were

| Shape | Records | Treatment |
| --- | --- | --- |
| **Quote true, abstract has an interpolation the note dropped** | `acyclovir` (`(Clcr)`), `erythromycin` (`(mean +/- s.d.)`), `penicillin-v` (`and that of the potassium salt of PE was 86%`), `propofol` (`(range, 1-2.4 min)`), `vesugen` (the abstract puts quotes round "Pinealon" and "Vesugen") | Quote the sentence as printed, or mark the omission with `…`. |
| **Segments out of the order the abstract has them** | `metoprolol` — the note put `to beta(1)-AR subtypes…` before `metoprolol`, where the abstract lists the drug first | Reordered to the abstract's own order. |
| **A gloss inside the quotation marks** | `doxazosin` (`[racemic doxazosin]`) | Gloss moved outside. The three pKi figures are racemic, R- and S- in that order, which is now on the record. |
| **Wrong ligand named** | `nicotine` — quoted `[3H]nicotine`; Sabey 1999 says `tritiated cytisine and nicotine` | Corrected. |
| **A unit that is not in the source** | `rimantadine` — quoted `0.6 +/- 0.8%`; the abstract's `%` belongs to the comparator arm | Quoted the whole parenthesis instead. |
| **Quote belongs to another document** | `afamelanotide` (Ugwu 1997, not Minder 2017), `cimetidine` (the PO row's review, not the IV primary), `macimorelin` ×3 (the LABEL), `mitoq` (a full text, not the review), `gly-low` (the published paper, not the preprint), `cartalax` (a PubChem synonym), `p021` (a second dosing paper) | Attributed to its real owner, or described rather than quoted where an interaction/compound field cannot carry a second source. |
| **A full-text value that never said so** | `ustekinumab` — KD 106 pM is in Zhou 2021's body (PMC8409790), not its abstract | Marked "full text", like `guselkumab` from the same paper in the previous batch. |
| **Single quotes inside the source** | `cilostazol` — the abstract prints `suggest 'flip-flop' pharmacokinetics` | Quoted as printed. |

### Carried forward

- **`cimetidine`'s PO review is now named** (PMID:6418428) rather than called "the cited review",
  so its half-life and F are checkable. The IV row keeps Larsson 1982.
- **`macimorelin` has label figures an interaction/PK row cannot cite.** `pk[route]` has
  `source_label` and the PO row uses it, but a *quotation* in that note is attributed to whatever
  PMID the clause names, so the label's half-life sentence is now **described, not quoted**. A
  `source_label`-aware quote gate would fix this properly — see roadmap T3.
- **`p021`'s dose evidence spans three papers in one sentence**, which leaves every quotation in it
  untagged by design (two or more PMIDs in a clause is ambiguity, not a citation). One of the three
  is now described instead. Splitting that sentence per paper would make all three checkable.

## Label citations pinned to a revision — 20 of 23 (2026-09-27)

`pk.label-revision` (roadmap T3) found that **only 3 of the 28 `source_label` rows named the
revision they quote**. A label is revised in place, so "FDA label: Prezista" points at whatever it
says today, and `pnpm verify` cannot help — it resolves PMIDs and a label has none. Twenty are now
pinned with a DailyMed set id and an effective date, fetched this session.

**Two rows stopped firing once the rule was made precise, and that was the rule's fault, not
theirs.** `trandolapril` and `propylthiouracil` use `source_label` as free prose recording a
**review** ("Review (PMID:10464907)…", "V 30 L is review-derived (PMID:6172233)"). A review is not
revised in place, so asking it to name a revision is meaningless. The rule now fires only on a
string that claims to be a label.

**Six rows carried reasoning too long for the 300-character field.** That reasoning was not
deleted: `baricitinib`, `cobicistat`, `ibrutinib`, `ivabradine`, `metolazone` and `venetoclax` now
have a `source_label` that is a citation, and their provenance argument moved into `notes`, which
has no cap. `ibrutinib`'s is worth keeping visible — its stored V_L 122 is a fitted surrogate, not
the label's 683 L, and the note says "Do not replace with 683."

### Products resolved, with the search term that found them

The generic name is often the wrong search: it returns a repackager or a combination product.

| Compound | Searched | Resolved to |
| --- | --- | --- |
| `butalbital` | **Fioricet**, not "butalbital" — the latter returns a RemedyRepack repackager label | FIORICET (butalbital, acetaminophen, caffeine) |
| `ivabradine` | **Corlanor**, not "ivabradine" — the latter returns a Novadoz generic | CORLANOR |
| `nebivolol` | **Bystolic**, not "nebivolol" — the latter returns a Major generic | BYSTOLIC |
| `elbasvir`, `grazoprevir` | Zepatier | One SPL serves both components, so both rows pin the same set id |
| `pramlintide` | Symlin | SYMLINPEN — Symlin itself is discontinued, so the pen is the live label |

**A trap avoided:** searching `trandolapril` returns *trandolapril and verapamil hydrochloride
extended-release* — a combination product whose Clinical Pharmacology is not the trandolapril-alone
figure the record cites. It was not pinned, and it no longer fires anyway.

### Not pinnable — no US SPL exists

| Compound | Field | Why skipped | Re-author target |
| --- | --- | --- | --- |
| **`agomelatine`** | `pk.PO.source_label` | Never approved in the US, so DailyMed has nothing. The citation is the **EMA SmPC for Valdoxan**, which has no set id. | The SmPC's own revision date, from the EMA product page. An ISO date satisfies the rule and is the right handle for an EMA document. |
| **`daclatasvir`** | `pk.PO.source_label` | Daklinza was **withdrawn from the US market**, so no current SPL exists. DailyMed returns nothing for the brand. | An archived SPL version, or the EMA SmPC. |
| **`tacrine`** | `pk.PO.source_label` | Cognex was **withdrawn in 2013**; DailyMed returns nothing. The record already discloses the withdrawal. | An archived label. Low value — the record exists as a historical reference, and its note already flags that the V 349 L is IV-derived rather than label-derived. |

## 2026-09-27 — stored values equal to a consumer default (R6), 16 route rows

Every one of the sixteen wore a `source_pmid`. Sixteen abstracts and two labels fetched this
session. **No curve moved anywhere except omalizumab**: a stored figure that equals the default is
numerically identical to its absence, so the whole batch is a provenance repair, and the
`pk.defaulted-*` counts rising is the audit working rather than coverage regressing.

### Ten silent citations — value removed

The cited document states nothing about the field at all, and in five of the ten the study design
forbids it outright.

| Compound | Field | What the citation actually states |
| --- | --- | --- |
| `adalimumab` | `pk.SC.V_L` 5.6 | PMID:27965661 reports AUC and Cmax only. The Humira label does give a Vss but as a **range, from an IV arm** — 4.7 to 6.0 L, containing 5.6 without stating it. |
| `arachidonic-acid` | `pk.PO.F` 0.9 | PMID:22188761 is a supplementation trial measuring plasma phospholipid ARA and prostanoids. **A dietary fatty acid has no IV arm**, so absolute F is unobtainable in principle. |
| `dextroamphetamine` | `pk.PO.F` 0.9 | PMID:28936175 compares two **oral** arms. No absolute F is derivable from oral-versus-oral. |
| `gla` | `pk.PO.F` 0.9 | PMID:9707349 reports serum time courses and a morning/evening tmax difference. Oral-only. |
| `glycine` | `pk.PO.F` 0.9 | PMID:8212419 dosed **by intravenous infusion**, so it cannot state an oral F — and its headline finding is that glycine kinetics are *non-linear*, which a dose-independent F contradicts. |
| `mct-c10` | `pk.PO.F` 0.9 | PMID:31058159 reports plasma ketone responses to 20 mL oil. This record already narrated removing a defaulted `ka` from the same route object; the defaulted `F` beside it was the same defect one field over. |
| `medroxyprogesterone` | `pk.PO.F` 0.9 | PMID:2943134 compares **six oral tablet formulations against each other**. Entirely *relative* bioavailability, a different quantity. |
| `mixed-amphetamine-salts` | `pk.PO.F` 0.9 | PMID:34826114 lists its parameters explicitly (Cmax, tmax, AUC, t½, CL/F, Vss/F) and no F. Separately: **its subjects are 24 children aged 4–5**, so it does not support the record's adult 70 kg volume either. |
| `theobromine` | `pk.PO.F` 0.9 | PMID:3979003 states *"Relative bioavailability of theobromine in chocolate was 80% that of theobromine in solution"* — relative, and 80 not 90. |
| `gemfibrozil` | `pk.PO.ka_hr` 1.0 | See below: the defect is structural, not a missing sentence. |

### One wrong value — omalizumab `pk.SC.V_L` 5.6 → **5.9 L**

The only stored number in this batch that was numerically wrong. PMID:17096680 verbatim: *"the
volume of distribution for omalizumab and IgE 5900 +/- 107 ml, and that for the complex 3630 +/- 223
ml"*. The 5.6 was the ≥10 kDa protein default (0.08 L/kg × 70 kg) sitting beside a citation that
states 5.9. Two caveats now ride on the record: the 3.63 L in the same sentence belongs to the
**complex** and must not be mistaken for the drug, and the paper adds that volume *"varied with
bodyweight"*, so a 70 kg scalar is an approximation it does not endorse.

### One underdetermined parameter — gemfibrozil `ka` 1.0

The most interesting finding of the batch, and a shape worth naming. PMID:2381138 states a peak
**time**, not a rate. A single Tmax is **one equation in two unknowns** when a lag is also authored,
and this row pairs `ka` with `lag_hr` 0.75: at t½ 1.5 h and ka 1.0 the inversion returns 1.44 h,
and 1.44 + 0.75 reproduces the verbatim 2.2 h. So the **lag was solved for and `ka` was pinned at
the default to make the system determinate** — an unidentifiable parameter presented as sourced.
Removal is a no-op and the lag survives, which is the identifiable half.

### Four confirmed — kept, two with a disclosure added

- `bisoprolol`, `clonazepam`, `pregabalin`: F 0.9 is verbatim in the cited document for the named
  compound. Left exactly as they were. R6 is a *suspicion* rule, not a deletion rule.
- `moclobemide`: F 0.9 is verbatim, but **read the population**. The cited sentence forks inside
  itself: *"The absolute oral bioavailability increased from 0.56 after the first oral dose to 0.86
  and 0.90 after the first and second weeks of administration, respectively"*. 0.90 is the
  **second-week steady-state** figure; single-dose absolute F is 0.56. Anyone rendering a single
  dose from this row is using a chronic-dosing F — a 1.6-fold error, now disclosed on the record.
  R9 in a shape R9 does not name, because the collision is inside one sentence.
- `prucalopride`: the label states *"The absolute oral bioavailability is > 90%"* — a lower **bound**
  whose boundary the stored value sits exactly on. F 1.0 is as consistent with that label as 0.9.
  Kept, because the bound is real and the direction is known, and flagged so no later pass reads it
  as measured.

### Cross-cutting finding

**Five of the sixteen records carried no `notes` field at all.** A value can be silently defaulted
and then acquire a citation precisely where there is no prose for a reader to check it against, so
absence of a note is itself a weak signal for this rule. All five now carry one.

## 2026-09-27 — `fraction_unbound` for the 19 records driving an in-vitro Ki (R13)

Every one compared a **free-drug** affinity against a **total** plasma curve, overstating occupancy
by roughly 1/fu. All nineteen are now resolved: **five carry a value, fourteen carry an `fu_note`
with no value**, which is a decision rather than a gap and silences `pd.occupancy-needs-fu`
honestly. The rule count fell 108 → 89 warnings.

The pass that chased these on 2026-09-08 searched **PubMed only**. Three of the five values came
out of an **FDA label**, which is where protein binding usually lives — that is the reusable lesson
of this batch, not any single number.

### Values stored — all five label-sourced

| Compound | fu | Shape | Source |
| --- | --- | --- | --- |
| `suvorexant` | **0.01** | **Inequality**: *">99%"* bound. Stored at the maximum fu the label permits, so it cannot over-correct. | BELSOMRA, setid `e5b72731-1acb-45b7-9c13-290ad12d3951`, eff 2025-03-10 |
| `cariprazine` | **0.09** | **Range** 91–97% bound. Under-correcting endpoint. | VRAYLAR, setid `4b5f7c65-aa2d-452a-b3db-bc85c06ff12f`, eff 2025-12-18 |
| `tasimelteon` | **0.10** | Point value, *"about 90%"*. | HETLIOZ, setid `ca4a9b63-708e-49e9-8f9b-010625443b90`, eff 2026-08-04 |
| `citalopram` | **0.20** | Point value, *"about 80%"*, **human plasma** stated. | CELEXA, setid `4259d9b1-de34-43a4-85a8-41dd214e9177`, eff 2023-10-09 |
| `clonidine` | **0.80** | **Range** 20–40% bound, **in vitro** stated. Under-correcting endpoint. | DURACLON, setid `8c126bb8-732a-4949-8754-2f50b5543638`, eff 2021-03-17 |

Two caveats worth carrying forward. **Three of the five sentences are JOINT across parent and
metabolites** (cariprazine with DCAR/DDCAR, citalopram with DCT/DDCT) — they name the compound so
R2 is satisfied literally, but the spread may be across molecules rather than assay scatter. And
**clonidine's citation is the epidural label** while the record carries PO and TD; binding is
route-independent but the citation is not, and at fu 0.80 the correction is nearly inert anyway.

### Four frame refusals — the missing field is not `fraction_unbound`

For these the quantity is not merely unmeasured but not a property of the molecule as stored.
Recording fu = 1.0 would assert a measurement nobody made; **the real defect is the occupancy row's
`basis: in_vitro_ki`.**

- `glycine`, `taurine` — endogenous free amino acids, quantified in plasma as the free species.
  Every taurine search route collapses onto **sodium taurocholate in the isolated perfused rat
  liver** (PMID:3199317, PMID:3193365): a bile salt, a different molecule, a different species.
- `isoflurane`, `sevoflurane` — exposure is governed by **blood:gas and tissue partition**. The
  sevoflurane label has a section literally headed **"Protein Binding"** and it is a trap: it
  concerns sevoflurane displacing *other* drugs (*"have not been investigated"*), not its own. The
  one on-topic isoflurane paper (PMID:15791110) is calorimetry against **isolated** albumin — site
  chemistry, not a plasma free fraction.

### One saturable — `prednisolone`

Not a gap and not storable: binding is **concentration-dependent across the ordinary therapeutic
dose range**, per PMID:7310640 and confirmed by PMID:3834071 and PMID:3593903. It also moves with
**population** (transcortin capacity rises on oestrogen and in pregnancy) and with competing
endogenous cortisol. **A trap recorded:** the free fraction 0.250 in PMID:3834071's abstract is
**prednisone**, not prednisolone — do not transcribe it onto this record.

### Nine honest gaps, each with its own reason

| Compound | Why it stays open |
| --- | --- |
| `promethazine` | **The one relevant measurement FAILED**, and that is the finding: PMID:29529010 reports that promethazine *"concentrations in ultrafiltrated serum were not possible to measure because of low concentrations and nonspecific binding"*. Label silent. |
| `nalbuphine` | The obvious query returns **exactly one id**, a paper about dezocine where nalbuphine is a comparator. The Hospira label is old-format with **no Distribution subsection at all**. |
| `desmopressin` | **Five SPLs fetched, all silent**, and §12.3 of DDAVP injection has **no Distribution subsection** — Elimination, Metabolism, Excretion only. |
| `exenatide` | The strongest negative available: BYETTA §12.3 **has** a Distribution subsection and it **omits** binding, giving only the 28.3 L volume. **Scope note:** exenatide is a 39-mer that is NOT albumin-acylated, so the acylated-peptide warning (that an fu correction may point backwards) does not transfer. |
| `7-hydroxymitragynine` | Two near-misses, each disqualified differently. PMID:40119246's 73.1% is **rat plasma**, and its sentence is garbled enough the figure may belong to mitragynine. PMID:24841968 has the right method but is an **inequality** and **never names the plasma species** — R8 forbids inferring human from its use of human microsomes elsewhere. **No PMC record exists, so the one unlocking fact needs the publisher PDF.** |
| `cbg` | The obvious query returns **zero**. **Refused on R2:** PMID:36944160 asserts in passing that cannabinoids are 90–95% protein bound — an uncited class-wide background claim in a cell-viability paper, for no named compound. Storing it would give this record a fabricated ~13-fold correction. |
| `cbn` | Five searches; the only hit naming an unbound quantity reports Ki values only. The standing characterisation stands: **known magnitude, unfixable** — fu plausibly below 0.01, occupancy likely overstated ~100×. |
| `lsd` | Every "LSD binding" hit is **[³H]LSD as a radioligand**, not LSD as the analyte. The three definitive human PK papers state no binding. **The better fix is not an fu:** PMID:28197931 gives a total-plasma in-vivo EC50 near 1 ng/mL, and `basis: in_vivo_plasma_ec50` needs no correction at all. |
| `psilocin` | Same shape. Every "binding" hit is receptor binding. **PMID:30685771** reports that *"plasma psilocin levels and 5-HT2AR occupancy conformed to a single-site binding model"* from [¹¹C]Cimbi-36 PET in 8 volunteers — a **human in-vivo total-plasma occupancy curve**, which removes R13 entirely. Its abstract omits the numeric EC50, so authoring it needs full text (a Batch 6 target). |

### The gate did not see any of this until it was made to

All nineteen notes passed `verify:quotes` on the first run **because none of them was checked**:
the gate only inspects a note containing the word "verbatim", and five of these quote a PubMed
abstract without using it. Adding the word exposed two real defects in the gate itself, fixed in
`0b0f1d4`. **A gate that is opt-in by keyword reports a pass it did not earn** — worth remembering
before trusting a green run on new prose.

## 2026-09-27 — `pk.template-ka`, part 1: 32 rows where the citation DID state a peak time

The roadmap predicted strips, on the precedent that all seven `pk.template-quartet` groups were
real template-fill. **That prediction was half wrong, and the rule's own text says why:** *"real
absorption rates are fitted to a Tmax and land on untidy numbers."* That is a testable claim, so
all 121 rows in the eleven groups were tested against it — every cited abstract fetched, every
stored ka inverted to the peak time it implies, and the two compared.

| Outcome | Rows |
| --- | --- |
| Citation states **no peak time at all** — the ka is unfalsifiable against its own source | 89 |
| Citation **does** state one, and a real ka is now derived from it | **28** |
| Citation states one that **no ka can reach** — an internal inconsistency | **4** |
| Already sourced or already a declared derivation, left alone | 3 |

This section covers the 32 in the middle two rows. The 89 are part 2.

### 28 rows: a round guess replaced by a declared derivation

Each row's abstract states a peak time verbatim for the named compound. With the stored half-life
fixing ke, `ln(ka/ke)/(ka−ke) = Tmax` fixes ka uniquely — arithmetic, not an estimate — and the
arithmetic is written on each record. **Exposure is unchanged**; the absorption rate cancels out of
AUC, so only the shape moves. All 28 quotes verify against their abstracts.

The scale of the errors being corrected is the point:

| Compound | ka was | ka is | Implied peak was | Cited peak |
| --- | --- | --- | --- | --- |
| `quercetin` | 0.5 | **6.737** | 4.74 h | **0.7 h** |
| `huperzine-a` | 1.5 | **4.549** | 2.26 h | **0.97 h** (58.33 min) |
| `mifepristone` | 0.7 | **2.018** | 4.38 h | **1–2 h** |
| `desloratadine` | 0.6 | **1.252** | 5.49 h | **3.17 h** |
| `baloxavir` | 0.5 | **1.249** | 8.23 h | **4 h** |
| `same` | 0.8 | **0.2843** | 2.85 h | **5.40 h** |
| `nirmatrelvir` | 0.6 | **1.422** | 3.57 h | **2 h** |

and twenty-one more: `bupropion`, `cbd`, `codeine`, `daidzein`, `daridorexant`, `eszopiclone`,
`genistein`, `glecaprevir`, `glipizide`, `kaempferol`, `ketoconazole`, `losartan`, `lsd`,
`methylprednisolone`, `pioglitazone`, `psilocybin`, `silymarin`, `valsartan`, `withaferin-a`,
`withanolide-a`, `zolpidem`.

**The single most useful finding is `pioglitazone`.** Its stored ka was **1.5/h** and its citation
says the drug reaches maximum concentrations *"in around 1.5 hours"* — the same numeral, a peak
**time** transcribed into a rate **constant**. The record's own prose had already guessed this
("THAT SAME SENTENCE IS ALSO THE PROBABLE ORIGIN OF ka 1.5") and this pass confirms it: derived
properly the rate is 2.291/h, not 1.5. **A peak time and a rate constant are reciprocal-ish in
magnitude over the ordinary therapeutic range, which is what makes the transcription survive a
plausibility check.** Worth looking for wherever a ka equals a Tmax.

Traps handled rather than walked into, each recorded on its record:

- **A second analyte in the same sentence.** `losartan`'s abstract gives 1 h for losartan and 3½ h
  for **EXP3174**, its metabolite. `desloratadine`'s gives 3.17 h and 4.76 h for parent and 3-OH
  metabolite.
- **A second arm.** `zolpidem`'s 1.44 h is the **ciprofloxacin** arm; `codeine`'s 1.0 h is the
  **sickle-cell** arm against 1.4 h in healthy controls; `same`'s two figures are men and women,
  and 5.40 h (men) is stored rather than a midpoint of the pair.
- **A second dose form.** `ketoconazole`'s sentence gives 1.7, 1.2 and 1.0 h for tablet, suspension
  and solution; the tablet is what this record doses. `bupropion`'s 5 h is the **XL** arm, which is
  what this record is declared as — and a scalar ka cannot also carry the IR and SR peaks in the
  same sentence.
- **Ranges** (`cbd` 4–5 h, `daidzein`/`genistein` 4–8 h, `kaempferol` 1–2 h, `psilocybin` 1.8–4 h,
  `silymarin` 1–3 h, `glecaprevir` 4–5 h) take an endpoint, never a midpoint, and each note says
  which and why. Three are **joint** statements across two or more analytes, which is a caveat
  carried on the record rather than a disqualification.

### 4 rows: a cited peak time NO ka can reach

The most interesting class, and one this audit found only because it did the arithmetic. As
absorption slows, the peak time of a one-compartment model **rises toward a ceiling of 1/ke** and
never passes it. So a stored half-life and a cited peak time can be mutually impossible, and for
these four they are:

| Compound | Half-life | Ceiling 1/ke | Cited peak |
| --- | --- | --- | --- |
| `niacin` | 0.9 h | **1.30 h** | 4.6 h (median) |
| `phylloquinone` | 1.5 h | **2.16 h** | 4 h |
| `melatonin` | 0.7 h | **1.01 h** | 1.07 h (64.2 min, tablet) |
| `cefdinir` | 1.73 h | **2.50 h** | 2.5 h ± 0.48 |

`cefdinir` is the boundary case: its cited Tmax **equals** its ceiling exactly, so ka is
unidentifiable rather than impossible — the peak is only reached in the limit of infinitely slow
absorption. `melatonin` misses by 6%, within the ±44.2 min spread of its own measurement.
`niacin` misses by 3.5×, and its own citation gives 8.6 and 11.1 h for the two metabolites, so
the 0.9 h half-life is very likely the parent's while the peak is a longer-lived species.

In all four the ka is removed and the inconsistency written on the record. **The half-life is the
more likely defect** — a peak at 4.6 h cannot belong to something cleared with a 0.9 h half-life —
but re-sourcing a half-life is a different concern from this batch and is not done here.

### Part 1b — the seven label-sourced rows of the same eleven groups

Eight of the 121 rows cite a **label** rather than a PMID, so they fell outside the abstract sweep
above. Labels state a peak time far more reliably than abstracts do, and **seven of the eight do**:

| Compound | ka was | ka is | Label Tmax |
| --- | --- | --- | --- |
| `baricitinib` | 1.4 | **4.388** | *"reached approximately at 1 hour"* |
| `rasagiline` | 1.5 | **2.683** | *"in approximately 1 hour"* |
| `everolimus` | 1.5 | **2.001** | *"reached 1 to 2 hours"* |
| `ibrutinib` | 0.8 | **1.23** | *"median T max of 1 hour to 2 hours"* |
| `cobicistat` | 0.7 | **0.3961** | *"observed approximately 3.5 hours postdose"* |
| `sulfasalazine` | 0.3 | **0.2754** | *"the mean peak concentration (6 µg/mL) occurring at 6 hours"* |

**Two of these already had the Tmax written on the record and still carried a guessed rate.**
`everolimus`'s `source_label` reads "Tmax 1–2 h, t½ 16–19 h, CL/F 23 L/h, V/F 581 L" and
`rasagiline`'s reads "Tmax 1 h, t½ 3 h, F 36%, Vss 87 L" — the derivation was available without a
single fetch. A number that is present but unused is a worse failure than one that is missing, and
the lesson generalises: **read `source_label` before searching.**

Caveats on the record: `cobicistat`'s 3.5 h comes from a trial dosed **with food and coadministered
with darunavir**, not a fasted single agent; `sulfasalazine` is a **delayed-release enteric** tablet,
so its 6 h peak is release-limited and the label's own 3–12 h spread and ~10 h metabolite peaks are
different quantities.

`rabeprazole` is the eighth-row exception and joins the unreachable four: its label gives *"a range
of 2 to 5 hours (T max )"* while a 1 h half-life caps the model's peak at **1.44 h**. Even the
nearest endpoint is out of reach, which confirms what that record's own prose already suspected
("NO ka EXISTS THAT PRODUCES IT") and locates the defect: a delayed-release PPI is release-limited
and this row authors no lag. `metolazone` is the one label with no peak time anywhere; it goes to
part 2.

## 2026-09-27 — `pk.template-ka`, part 2: 78 rows stripped · the rule now fires nowhere

The remainder of the 121. Each cited document was fetched and **states no peak time for the named
compound**, so the stored rate was not merely unsourced but *unfalsifiable against its own source* —
there is nothing in the citation it could be checked against, in either direction.

| Why it was stripped | Rows |
| --- | --- |
| Cited abstract states no peak time at all | 74 |
| Cited abstract states one the stored rate does not produce, and that figure is not a Tmax | 2 |
| Cited abstract has no text (`mct-c8`) | 1 |
| Cites only a label, and the label states no peak time (`metolazone`) | 1 |

The two in the third row are worth naming because they are the near-misses of this audit.
`aripiprazole`'s abstract gives *"5% of peak plasma concentration [C(max)] values at 0.5 hours
postdose"* — **a fraction of the peak at a time, not the time of the peak**, and a screen for a
number beside peak language reads it as a Tmax. It is not one. `dapoxetine` was the mirror image and
the mistake this pass actually made: its abstract *does* state *"peak plasma concentrations reached
approximately 1 hour after dosing"*, it was stripped in the same sweep, and it is now derived
(ka 2.671/h) rather than defaulted. **Both directions of the screen are wrong often enough that the
sentence has to be read.**

### What stripping costs, stated rather than avoided

Removal is not free the way a defaulted `F` or `V` removal is. The resolver supplies **1.0/h**, so
the peak moves on every one of the 78 — exposure does not, since the absorption rate cancels out of
AUC. On **three** rows the fallback is worse than a shape change, and each says so on its own
record: `carnosine` (ke 34.66/h), `menadione` (1.54/h) and `yohimbine` (1.16/h) all eliminate
*faster* than 1.0/h, so the default makes the curve **absorption-limited where it was not** —
flip-flop introduced by a default. Keeping an invented number to avoid that would be trading a
visible modelling artefact for an invisible fabrication, which is the wrong direction.

`pk.template-ka` now fires **nowhere**, and `pk.defaulted-ka-slow` rose from 14 to 24. That is the
whole point of the batch: the debt did not go away, it became **visible**. A rule that counts silent
defaults is doing its job when it rises after an audit.

### The one prior this batch refuted

Several of the 78 records' own prose defended the stored rate — *"unsourced BUT ACQUITTED ON SHAPE"*,
*"formulation-coherent"*, *"its absorption rate is slower than its elimination rate, which correctly
encodes flip-flop"*. The last of those, on `pentoxifylline`, **is arithmetically false**: at a 1.63 h
half-life its ke is 0.425/h and the stored ka was 0.5/h, so absorption was *faster* than elimination
and no flip-flop was encoded. A shape argument is checkable, and this one was never checked. Only two
of the 121 rows had ka < ke at all.

## 2026-09-27 — the two uncatalogued occupancy keys · 13 rows

The roadmap expected 13 literature lookups to find which subtype each cited assay measured. **Not
one was needed: nine of the thirteen rows already named the subtype in their own note.** The work
was a retarget, and the finding is that the information was on the record all along while the key
above it said something weaker.

`receptors.json` already carries CHRM1–5 and ADRA1A/B/D from GtoPdb, and `alpha_1a` was already
bridged; only `m1` and `m3` were missing from the shorthand-to-gene lookup, added in `98a9ecb`.

### Nine pinned

| Compound | Was | Is | What its own note already said |
| --- | --- | --- | --- |
| `carvedilol` | `alpha_1` | `alpha_1a` | "Human alpha-1A … pKi 7.9" |
| `clomipramine` | `alpha_1` | `alpha_1a` | the α1A column, −8.12, against −6.34 and −6.15 |
| `clozapine` | `alpha_1` | `alpha_1a` | "Keyed alpha_1 to the highest-affinity subtype (alpha1A)" |
| `labetalol` | `alpha_1` | `alpha_1a` | the α1A column, −7.33 |
| `terazosin` | `alpha_1` | `alpha_1a` | *"Ki value; alpha 1A:2.5 nM"* |
| `oxybutynin` | `muscarinic` | `m3` | "Human muscarinic (M3) affinity" |
| `tiotropium` | `muscarinic` | `m3` | "human recombinant hM3 (CHO cells)" |
| `solifenacin` | `muscarinic` | `m3` | *"pK(i) values … for M(1), M(2), and M(3) … 7.6, 6.9, and 8.0"* |
| `atropine` | `muscarinic` | `m1` | "M1 cortical IC50" |

`atropine` carries a caveat rather than a clean pin: its abstract says atropine *"displayed similar
affinities for either subtype"*, so `m1` records **where the 1.6 nM was measured** (competition
against [³H]-pirenzepine in cortical membranes), not evidence of M1 selectivity.

Six of the nine had notes already within a few characters of the 600-character field, so the
retarget is recorded in this file rather than prefixed onto prose that would have to be deleted to
make room. **The evidence outranks the annotation.**

### Four kept on the class key, which is the rule working rather than an exception

The code comment on `OCCUPANCY_TARGET_KEYS` has said since it was written that `alpha_1` and
`muscarinic` stay unmapped because "pinning them to one subtype would state a selectivity no cited
value measured". These four are exactly that case, and each now says so on its own row:

- **`doxazosin`** and **`prazosin`** — measured in **native human prostate**, which expresses a
  mixture of α1 subtypes. `prazosin`'s own citation puts the cloned subtypes at 0.26–0.44 nM against
  its stored native 0.25 nM, i.e. everything within 1.8×, so prazosin is non-selective here and no
  subtype key would be more accurate.
- **`tolterodine`** — **native human urinary bladder**, M2 and M3 together. Its abstract states that
  tolterodine, *unlike* oxybutynin, shows no M3-over-M2 selectivity on cloned human receptors, so a
  subtype key would assert a selectivity the paper explicitly denies.
- **`risperidone`** — a genuine skip. The stored value is a table figure from the cloned-subtype
  study and **the row has never recorded which of α1A/1B/1D it came from**. Unlocked by Table 4 of
  PMC7327383; guessing α1A because the neighbouring rows are α1A would be pattern-matching.

`receptor.unknown-target` therefore still fires, on 4 rows instead of 13. It should: those four keys
really are uncatalogued, because the thing they name is a tissue mixture and not a catalogued target.

### Two suspicions raised and refuted — R16 in action

Reading the primary sources to pin subtypes, two rows looked like fabrications and neither was:

- `tolterodine`'s note claims *"abstract verbatim: … urinary bladder from humans (Ki 3.3 nM)"* while
  the abstract's prominent bladder figures are K(B) 4.0 nM and K(i) 2.7 nM. The 3.3 nM **is** there:
  the 2.7 nM is **guinea-pig** bladder and the sentence ends "and in urinary bladder from humans
  (K(i) 3.3 nM)". The stored value and its species are right.
- `prazosin`'s note attributes its quote to "Ford 1998" while PMID:9839591 is **Fukasawa** 1998. The
  author name is wrong; the PMID and the quote are exactly right. A wrong author beside a right PMID
  is a cosmetic defect, not a provenance one.

**But `tolterodine` shows the gate's opt-in blind spot again.** Its note says "abstract verbatim"
and then gives the sentence **with no quotation marks**, so `verify:quotes` cannot see it — the same
class of hole fixed in `0b0f1d4`. A note that claims "verbatim" and quotes nothing is unguarded by
construction, and that is worth a lint rule.

## 2026-09-27 — the 8 rows `note.announced-quote-missing` found on its first run

Five were paraphrases of a sentence the abstract does state, and are now quoted. **Every one of the
five checked out**: no stored value was wrong. What the paraphrases hid was the *disambiguation*,
and in three of the five that disambiguation is the whole difficulty of the row:

| Compound | What the paraphrase hid |
| --- | --- |
| `tolterodine` | **The species.** The cited sentence gives K(i) 2.7 nM bladder, 1.6 nM heart and 0.75 nM cortex from **guinea pigs**, and only then "and in urinary bladder from humans (K(i) 3.3 nM)". The stored 3.3 nM is the one human figure in it, and nothing on the record said so. |
| `eplerenone` | **A "respectively".** *"superior to that of spironolactone and eplerenone, whose IC50s were 36 and 713nM, respectively"* — 36 nM is spironolactone. Reading the pair in the wrong order would put a 20× error on this row. |
| `asenapine` ×2 | **A list of eight.** The pKi values arrive as `5-HT1A [8.6], 5-HT1B [8.4], 5-HT2A [10.2] …` and `D1 [8.9], D2 [8.9], D3 [9.4], D4 [9.0]`. Picking the wrong bracket is a silent subtype swap. |
| `vortioxetine` | Least of the five: 5-HT7 K(i) = 19 nM sits in a list of six affinities for the same compound. |

Two are the honest exception the rule's own text names. `labetalol` and `nadolol` take their β1
logKD from **Table 1 of PMC1576008**, and Baker 2005's abstract states no per-drug figure at all.
**A table cell is not a sentence and must not be quoted as one** — those two now say "full text",
which `verify:quotes` exempts by design, instead of claiming a verbatim the paper never wrote.

One was a false positive and the prose deserved it: `physostigmine`'s note read "despite its
bioavailability being verbatim: at F 0.03 an oral dose is …", where the colon introduces a
*consequence*, not a quotation. Reworded. **One soft positive in eight is the cost of a rule that
reads prose, and it was cheaper to fix the sentence than to weaken the rule.**

Gate coverage 637 → 642 quotes, still 0 missing. The rule now fires nowhere.

## 2026-09-27 — `pk.unsolvable-default-route` · 5 records

Each declared a `routes[0]` with no elimination rate, so the dosing UI defaulted to it and the
commonest path through the record selected a dose and rendered nothing. The rule offers two fixes —
author the route, or order `routes[]` so a solvable one leads — and **which of the two is right is a
pharmacological question, not a presentational one.**

### One authored: `budesonide` INH

The one where the unsolvable route is what the drug actually *is*. The Pulmicort Flexhaler label
supplies both missing numbers verbatim: *"an absolute systemic availability of 39% of the metered
dose"* and *"The volume of distribution of budesonide was approximately 3 L/kg"* (set id
`ae1105cd-69fc-4c15-937f-c535304341c2`, effective 2026-07-31), so F 0.39 and V 210 L at the
reference weight. The stored INH half-life of 2.8 h sits inside the label's *"2 to 3 hours"*.

**Two caveats are on the record.** The denominator is the **metered** dose, not the delivered or
lung dose — the same section puts lung deposition at 34% and measured that with a *different*
dry-powder inhaler — so a dose entered against this route must be the metered one. And no peak time
is stated for the inhaled route, so no `ka` is authored: the shape is the resolver's 1.0/h default,
while the exposure is real.

### Four reordered, each for a stated reason

| Compound | `routes[0]` was | is | Why the route cannot be authored |
| --- | --- | --- | --- |
| `mannitol` | PO | IV | **Pharmacology, not presentation: oral mannitol is essentially unabsorbed** and acts luminally as an osmotic agent. There is no systemic curve to render. PO stays declared because it is a real use. |
| `betamethasone` | TD | PO | A topical corticosteroid's systemic availability depends on vehicle, site and occlusion. **One scalar F would be a fiction**, and TD remains the commonest use. |
| `epinephrine` | IM | IV | The EpiPen label states no bioavailability, volume or half-life, and **IM epinephrine's absorption is dominated by local vasoconstriction at the injection site** — which a first-order `ka` cannot represent at all. |
| `5-meo-dmt` | INH | IN | Vaporised is the commonest real-world route and stays declared, but no human study reports an inhaled parameter. IN is the route this record has PK for. |

No route was removed from any `routes[]`; the set is identical in all four and the script refused to
run otherwise. **Reordering changes which route a reader lands on first, not what the compound is
used by.**

## 2026-09-27 — Batch 8, the singletons

### `compound.retired-alias-clash` — `r5p` resolved to the wrong molecule

Two lookups disagreed: the retired slug `r5p` forwarded to **`riboflavin-5-phosphate`** while a name
search for "R5P" hit **`ribose-5-phosphate`**, which lists it as an alias. The rule asked which
record owns the name, and the chemistry decides it rather than the reference count: **R5P is the
standard abbreviation for ribose-5-phosphate**, a pentose phosphate pathway intermediate.
Riboflavin-5'-phosphate is **FMN**, and FMN is its abbreviation — it is already in that record's
aliases.

So the tombstone was forwarding readers to the wrong molecule. It is removed, and **an `r5p` URL
that no longer resolves is better than one that silently resolves wrongly**: a 404 tells a reader to
look again, a wrong compound does not. `ribose-5-phosphate` keeps the alias, which was never in
doubt.

### `interactions.inert-kinetics` — not work, and the rule metadata now says so

Six kinetics edges name a victim with no solvable PK, so the authored magnitude modulates nothing:
`bosentan`, `carbamazepine`, `oxcarbazepine`, `phenytoin` and `st-johns-wort` → **hormonal
contraceptives**, and `posaconazole` → `rapamycin`.

The rule's own message already said "Kept deliberately — each becomes live if the victim gains PK",
but the rule was not marked `standing`, so it sat in the actionable count claiming a decision it did
not record. **Five of the six are optimistic in that message anyway**: `hormonal-contraceptives` is a
drug *class* record, a declared mixture, and it can never gain a solvable curve, so those edges will
never go live. What survives on each edge is the verbatim fold-change in its note, which is the
honest quantity — the same shape as the `gemfibrozil` interaction block, where the derived affinities
were deleted and the quoted exposure ratios kept.

Marked standing in `packages/registry/src/rules.ts`. The edges stay.

### `dose.salt-moiety-unset` on `mitoq` — left alone, as the roadmap said

No source states whether its doses are the mesylate salt or the mitoquinone cation. Still a
documented standing caveat, not a task.

## 2026-09-27 — Batch 6, the full-text re-chase · all three retrieved, none stored as a value

The PMC article route worked cleanly on all three — HTTP 200, no reCAPTCHA, no backoff needed — and
each target value was found. **Then none of the three became a stored number, for three different
reasons, and the reasons are the deliverable.** Every value is written into its record's prose so
nobody re-chases it.

PMC → PMID resolved through the id converter rather than from memory: PMC3281520 → PMID:22327401,
PMC7072805 → PMID:32053994, PMC3579463 → PMID:23228986.

### `halofuginone` — the value is real, and the registry's shape cannot hold it yet

Found, verbatim from full text where the abstract states no constant: *"The slope of the resulting
line yields a K i for HF of 18.3 nM+/− 0.5"* — HF is halofuginone, the enzyme is EPRS1. At MW 414.7
that is 0.00758901 mg/L.

**The row was written, and validation rejected it, correctly.** An occupancy entry requires an
`effect_compartment.keo_per_h`; a keo requires a curve; and this record has no authored PK because
its one human study publishes no parameter. Authoring the row would have forced an invented keo, so
`receptor.needs-keo` fired as an **error** and the row came back out. A lint rule stopping an author
from fabricating a third value to support a second one is the gate working exactly as designed.

Two things were prepared and then reverted with it, and are recorded here as the unlock: an `eprs`
entry in `nonGpcrTargets` (gene EPRS1, class enzyme, **`gtp_id: 0`** — the file's standing convention
for a target GtoPdb does not carry, already used by six entries), and an `fu_note`. **GtoPdb's Web
Services now return 401 without an API key**, so no real `gtp_id` can be looked up from this
environment even if one exists. The sequence to author this row is: PK for halofuginone → keo →
catalog entry → the Ki above.

Also a distinction worth keeping: this is a **derived** Ki, taken from the slope of IC50 against
proline (20–480 nM) for a tight-binding competitive inhibitor. It is substrate-corrected by
construction and is **not** interchangeable with a single-concentration IC50.

### `somapacitan` — retrieved, and the wrong quantity to store

Found: *"binding between somapacitan and GHBP in the absence of albumin could be characterized by two
sets of binding sites with a KD1 of 9.1 nM (high affinity binding site) and a KD2 of 103.9 nM (low
affinity binding site)"*.

**"In the absence of albumin" is fatal for this compound specifically.** Somapacitan is an
albumin-binding GH derivative — binding albumin is the whole design — so the albumin-free affinity is
not the affinity anything in plasma has. The same paper says albumin-bound somapacitan binds the
receptor with about **fivefold lower** affinity. And two sites cannot be one `ec50` anyway. Storing
9.1 nM would have overstated potency at the one condition that never obtains in a patient. **A
retrieved number is not the same as an applicable one.**

### `acadesine` — the one that paid off, as corroboration rather than as data

The CLL phase I publishes the table its abstract omits. At the 210 mg/kg optimal biological dose the
median AUC(0–24) is 123,125 ng·h/mL; at the 70 kg reference that dose is 14,700 mg, so
CL = 14,700 / 123.125 = **119 L/h**.

**That independently checks the R15 call made on this record earlier.** The stored derivation
(V = 175 × 1.4 / ln2 = 353.5 L) implies **175 L/h**; the verbatim Vss of 112 L would have implied
**55 L/h**. The derived figure lands within 1.5× of an independent patient study while the verbatim
one is off by 2.2× in the other direction. R15 said to store the volume the record's own clearance
implies, and a study nobody had read when that call was made agrees with it.

The CLL half-lives are **not** portable and are not imported: the same table gives medians from 3.9
to 61.4 h with within-cohort spreads of 2.6 to 106 h, against 1.4 h in healthy men.

### Confirmed dead, do not re-chase

`PMC3911487` (no `<body>`) and `PMC5945293` (the MitoQ value is figure-only) — unchanged from the
earlier assessment.

## 2026-09-27 — T2, the NCBI API key wired into both gates

The key is in this container's environment now, which the earlier assessment said it was not. Both
URL builders take an optional `apiKey`; the two gate scripts read `NCBI_API_KEY` and drop the
inter-batch delay from 350 ms to **110 ms (~9 req/s)**, deliberately under the 10 the key buys —
NCBI throttles on its own clock, and a run that trips the limit loses more to retries than the
margin saves.

**Measured on the full sweep, not assumed:**

| Gate | Without the key | With it |
| --- | --- | --- |
| `pnpm verify` (2,695 ids) | 24.4 s | **19.4 s** |
| `pnpm verify:quotes` (645 quotes, 502 papers) | 17.4 s | **9.1 s** |

`verify` gains only 1.26× against a 3× rate increase, because it sends 200 ids per request and so is
dominated by **per-request latency rather than by the rate limit**. `verify:quotes` sends 20 ids per
request, makes far more of them, and nearly halves. Worth knowing before anyone tries to optimise
`verify` further: the delay is no longer the bottleneck there.

Three deliberate constraints on how the key is handled:

- **It is read by the scripts, not the library.** `packages/registry` stays pure and a test can build
  both URL shapes without touching `process.env`.
- **It travels as a query parameter**, because NCBI accepts it no other way, so a built URL must
  never be logged. Neither gate logs one, and the code says so where the key is read.
- **Each run prints which rate it used and never the key** — "NCBI_API_KEY found, ~9 req/s" or "no
  NCBI_API_KEY, ~3 req/s" — so a slow run can explain itself without anyone reading the source.
  A blank or whitespace-only variable is treated as absent, so an empty secret cannot send
  `&api_key=`.

Both gates pass identically with and without the key, which is the point: the key is an
optimisation, never a dependency.

## 2026-09-27 — ROADMAP.md deleted, which was the condition it was created under

The file said so itself in its first line, and `authoring/README.md` says there is no roadmap: `pnpm
report` and this file are the state of the work. The roadmap existed to sequence one known run of
eight batches plus three tooling items across a session boundary, and every one of them is now
closed. Keeping it would leave a second source of truth that nothing updates — exactly the failure
`scripts/report.ts` documents in its own header, where four hand-maintained documents drifted apart
from each other and from the data.

The one live reference to it in this file has been reworded to stop pointing at a deleted path. The
two remaining mentions are historical and correct as history: `report.ts` names it among the four
documents that *used to* hold coverage numbers by hand, and the 2026-09 entry that lists the
documents deleted for that reason.

**State at the close, all measured:** 1,265 compounds · 230 pathways · 428 targets · `validate` 0
errors / 82 warnings · `verify` 2,695/2,695 resolved · `verify:quotes` 645 quoted, 0 missing ·
202 tests.

The nine rules still warning are worth reading as a set, because the shape of what is left changed
over this run. **Five are standing caveats, and they hold 76 of the 82 findings**:
`pk.defaulted-volume` (38), `pk.defaulted-ka-slow` (24), `pd.needs-solvable-pk` (12),
`interactions.inert-kinetics` (1, marked standing this session) and `pk.defaulted-params` (1). The
four that are not standing hold **six findings between them**: `pk.label-revision` (3, all three
unpinnable because no US SPL exists), `dose.salt-moiety-unset` (1, `mitoq`),
`pk.unsolvable-route` (1) and `receptor.unknown-target` (1, the four native-tissue occupancy rows).

`pk.defaulted-ka-slow` **rose from 14 to 24 during this run**, because Batch 4 stripped 78 invented
absorption rates. That is the intended direction: a rule that counts *silent defaults* should rise
when a rule that counts *invented values* falls to zero.
Four rules went to zero over the run — `pd.occupancy-needs-fu`, `pk.template-ka`,
`pk.unsolvable-default-route` and `compound.retired-alias-clash` — and two new rules were added that
now also fire nowhere, `pk.label-revision` aside.

## 2026-09-27 — halofuginone's EPRS affinity, authored on the second attempt

The earlier pass retrieved the Ki, wrote the row, watched validation reject it, and recorded the
sequence to unblock it as "PK for halofuginone → keo → catalog entry → the Ki". **That sequence was
wrong at its first step, and the correction is the finding.**

### The PK is not the blocker, and chasing it would have failed anyway

**CORRECTED 2026-09-27, later the same day:** this section first claimed that
`effect_compartment.source_pmid` is **required**, so a keo must be cited and cannot be reasoned into
existence. That is **false** — `pmid` is `.optional()` in the schema, and **196 records carry an
`approximated: true` keo with a note and no PMID at all**. The claim was wrong when written and is
struck here rather than quietly edited, because it was repeated in a commit message and cannot be
unsaid there.

What is true, and is what the chain actually turns on: **no paper reports an equilibration constant
for halofuginone**, and more decisively **this record has no plasma curve at all**, so a keo has
nothing to describe the approach to. Every one of the 196 approximated keos is anchored to an
observed time-to-peak effect; an estimate here would be anchored to nothing. So a complete human PK
curve would still not have produced a keo, and the chain would have stopped one step later — the
conclusion survives, the reasoning that reached it did not.

The PK was chased regardless, to be sure. PMID:16815702 (EORTC phase I, 24 patients) is the only
human PK study and its abstract gives only *"The PKs of halofuginone were linear over the dose range
studied with a large interpatient variability"* — a paraphrase, no number. Its full text is
**subscription-only**: no PMC record, Europe PMC reports `isOpenAccess: N` with the sole full-text
URL being the paywalled DOI, and its text-mined annotations cover the **abstract section only**. The
Elsevier article API would serve it and **`api.elsevier.com` is denied by this environment's egress
policy** (`connect_rejected`), so the one key that could open it cannot be used from here. Five
further PubMed searches found no second human study: every PK hit is cow, mouse, rat, chicken or a
TMPRSS2 screening paper.

### What actually blocked it was a lint rule stricter than its own reasoning

`receptor.needs-keo` errored on any occupancy row without an effect compartment, justified as "the
occupancy curve is identically zero — useless and confusing". **That is a claim about a curve, and
it does not survive contact with the renderer:** `occupancy()` in the compound view builds its table
from the rows alone and never reads `effect_compartment`; every other consumer guards on its
presence; nothing computes or displays a zero curve. The rule's own sibling says so in as many
words — `pd.needs-solvable-pk` calls the same shape a **warning** and adds *"affinity and
dose-response still render"*. Both could not be right.

So the error is now scoped to records where a keo **could** help: with a solvable route the curve is
computable and is not computed, which is a real authoring gap and stays an error. With no solvable
route there is no Cp to equilibrate against, so a keo is not merely unhelpful but meaningless, and
`pd.needs-solvable-pk` already warns. **The narrowing rests on the renderer, not on the false
premise above** — `occupancy()` reads the rows and never reads `effect_compartment`. The
catalog lints identically either way — **0 errors, and the narrowing admits only a shape that was
previously impossible to author at all.**

**The rule was forcing a choice between fabricating a citation and discarding a real sourced
affinity.** That is the shape worth recognising: when a gate leaves only those two options, suspect
the gate.

### What is stored

`eprs` added to `nonGpcrTargets` (gene EPRS1, class enzyme, **`gtp_id: 0`** — this file's convention
for a target GtoPdb does not carry, already used by six entries; GtoPdb's Web Services return 401
without an API key, so no id could be looked up). The row: Ki **18.3 nM → ec50 0.00758901 mg/L**,
`basis: in_vitro_ki`, inhibitor.

Two corrections made while checking the source rather than trusting the first read:

- **The assay was described wrongly on the first pass.** It is not rabbit reticulocyte lysate
  translation — RRL is the *translation* experiment elsewhere in the paper. The Ki comes from a
  **tRNA-Pro charging assay using the purified prolyl-tRNA synthetase domain of EPRS**.
- **The species is human**, which the first note said was unstated: *"The prolyl tRNA synthetase
  domain of human EPRS (ProRS) was expressed in E. coli"*. R8 satisfied, and it matters — the same
  paper separately used full-length EPRS purified from **rat** liver.

An `fu_note` records that R13 is **dormant** here rather than ignored: with no plasma curve there is
no total-plasma comparison for a free-drug Ki to overstate. It becomes live the moment PK is
authored.

## 2026-09-27 — halofuginone human PK: the chase is closed, not open

`api.elsevier.com` was added to the environment's allowlist to reach the EORTC phase I
(PMID:16815702), the only human PK study of halofuginone. **The allowlist change worked and the
paper is still unreachable**, for a different reason than expected, and the distinction is worth
recording because it changes who can fix it.

### The host is reachable; the key is not entitled

The proxy no longer rejects the CONNECT — Elsevier itself answers. It answers **403
`AUTHENTICATION_ERROR: "Requestor configuration settings insufficient for access to this resource"`**
on every view of the article, including `META`, and on the `entitlement` endpoint. The decisive
control: **the same key fails identically on an open-access Elsevier article**, and the
ScienceDirect search endpoint returns 401 `AUTHORIZATION_ERROR`. So this is not this paper's
paywall — **the key's account is not entitled from this network at all.** Elsevier's text-mining
access is bound to a registered institutional IP range or an InstToken, neither of which a cloud
container has. **No allowlist entry can fix that.**

### Every other route, tried and exhausted

| Route | Result |
| --- | --- |
| PMC | No record for this article |
| Europe PMC full text | `isOpenAccess: N`, sole full-text URL is the paywalled DOI |
| Europe PMC annotations | Mined text covers the **abstract section only** |
| Unpaywall, OpenAlex, CORE | Outside this environment's egress policy (`connect_rejected`) |
| **All 42 PMC articles citing the phase I** | Fetched and searched. **Not one quotes its parameters.** Every halofuginone sentence carrying a PK token is either animal, in vitro, or qualitative |
| 15 further human-flagged halofuginone studies | No PK value in any abstract |

A note on method: the first attempt fetched those 42 through the PMC article route and **29 came
back as reCAPTCHA** — the fetch rate, not the content, was the problem. Europe PMC's
`/PMC{id}/fullTextXML` endpoint is an API, has no such gate, and returned 31 of the 42 cleanly. **For
a bulk full-text sweep, use the API and not the article route.**

### What this means for the record

`pk_unauthored` stays `uncharacterized`, and its note now says the chase is **closed** rather than
outstanding — the difference between "nobody has looked" and "everything reachable has been looked
at" is the whole value of a GAPS row. What would unlock it: institutional Elsevier entitlement, or
some future paper quoting the numbers.

**This does not block the EPRS occupancy row**, which is authored and stands. That was the point of
narrowing `receptor.needs-keo`: the affinity never depended on the PK, and the earlier note that
said it did was wrong.
