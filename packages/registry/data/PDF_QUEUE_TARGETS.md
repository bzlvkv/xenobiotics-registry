# PDF Queue — Targets Map

For each PDF in [PDF_QUEUE_DOIS.md](./PDF_QUEUE_DOIS.md), this file lists the **exact compound slugs and fields** that PDF unlocks. When you retrieve a PDF, run the matching authoring playbook (Groenendaal flow: render → vision-read → dated apply-script per [PLAYBOOK](../../scripts/authoring/PLAYBOOK.md) reference, see commit `60d40ab`).

Compiled 2026-05-06 against [AUTHORING_GAPS.md](./AUTHORING_GAPS.md) lines 33–62.

---

## 1. Hysingla ER NDA 206627 — Clinical Pharmacology Review (FDA)

**DOI:** none (regulatory) · **URL:** accessdata.fda.gov/drugsatfda_docs/nda/2014/206627Orig1s000ClinPharmR.pdf

| Slug | Field | What to look for in PDF | Source notes |
|---|---|---|---|
| `hydrocodone` | `pd.keo_hr` (μ-opioid) | kₑₒ from analgesia or pupillometry effect-compartment fit | Pairs with already-verified MOR Ki 19.8 nM (PMID:1851921). Lint requires kₑₒ before occupancy can land. |
| `hydrocodone` | `pd.receptor_occupancy.MOR` block | Once kₑₒ lands, populate Hill block with Ki 19.8 nM + that kₑₒ | Wave-3b receptor occupancy unlock. |

**Output:** 1 dated apply-script touching `compounds.json[hydrocodone]`.

---

## 2. Nucynta IR NDA 022304 + ER 200533 — Clinical Pharmacology Reviews (FDA)

**DOI:** none · **URLs:** accessdata.fda.gov/drugsatfda_docs/nda/2008/022304s000_ClinPharmR.pdf and `.../2011/200533Orig1s000ClinPharmR.pdf`

| Slug | Field | What to look for in PDF |
|---|---|---|
| `tapentadol` | `pd.keo_hr` (analgesia or pupillometry) | Effect-compartment kₑₒ |
| `tapentadol` | `pd.receptor_occupancy.MOR` block | MOR Ki + Hill |
| `tapentadol` | `pd.receptor_occupancy.NET` block | NET Ki (norepinephrine reuptake) |

**Output:** 1 dated apply-script.

---

## 3. Olkkola 1992 — erythromycin + oral alfentanil (citation unverified)

**DOI/PMID:** unverified — see PDF_QUEUE_DOIS.md row 3. Re-check primary citation on retrieval.

| Slug | Field | What to look for |
|---|---|---|
| `erythromycin` | `interactions.victims.alfentanil` (PO route) | Verbatim AUC fold-change or oral-route Ki refining current 8.8 µM IV-only Ki (PMID:2501060) |

**Output:** 1 entry into Wave-2a session-10 follow-up apply-script.

---

## 4. Wessler 2013 — colchicine ↔ cyclosporine (citation unverified)

**DOI/PMID:** unverified — see PDF_QUEUE_DOIS.md row 4.

| Slug | Field | What to look for |
|---|---|---|
| `colchicine` | `interactions.victims.cyclosporine` | Primary Ki (P-gp + weak CYP3A4) |
| `cyclosporine` | `interactions.victims.colchicine` | Reverse-direction AUC ratio |

Closes 2 AUTHORING_GAPS rows. **Output:** 1 dated apply-script.

---

## 5. Bertelsen 2003 + Venkatakrishnan 2005 — paroxetine MBI

**DOIs:** 10.1124/dmd.31.3.289 (PMID:12584155) and 10.1124/dmd.105.004077 (PMID:15788540)

| Slug | Field | What to look for |
|---|---|---|
| `paroxetine` | `interactions.perpetrator.CYP2D6.K_I_uM` + `induction_factor` (mechanism-based inactivator k_inact) | K_I and k_inact from Bertelsen + IVIVE-validated parameters from Venkatakrishnan |
| `paroxetine` | `interactions.victims.tamoxifen` | Closes paroxetine→tamoxifen GAPS row |

**Output:** 1 dated apply-script touching `compounds.json[paroxetine]`.

---

## 6. Mai 2004 — St John's Wort + cyclosporine (refinement)

**DOI:** 10.1016/j.clpt.2004.07.004 (PMID:15470332). Already authored from abstract; full-text would refine.

| Slug | Field | What to look for |
|---|---|---|
| `st-johns-wort` | refine existing `interactions.victims.cyclosporine` | Hyperforin-content-stratified AUC ratios (currently a single point estimate) |

**Output:** Optional refinement, low priority.

---

## 7. Owens 1997 + Tatsumi 1997 — SSRI hSERT Ki tables

**DOIs:** Owens has none indexed (PMID:9400006 — older JPET); Tatsumi 10.1016/s0014-2999(97)01393-9 (PMID:9537821)

| Slug | Field | What to look for in PDF tables |
|---|---|---|
| `fluoxetine` | `pd.receptor_occupancy.SERT` block | Ki ~0.81 nM (per AUTHORING_GAPS line 39) |
| `sertraline` | `pd.receptor_occupancy.SERT` block | Ki ~0.29 nM (line 40) |
| `paroxetine` | `pd.receptor_occupancy.SERT` block | Ki ~0.05 nM (line 41) |
| `citalopram` | `pd.receptor_occupancy.SERT` block | Ki ~1.16 nM (line 42) |

**Note:** `pd.keo_hr` for these is *also* missing (line 46). Owens/Tatsumi don't supply kₑₒ — that needs a separate TQT/PD study. SERT Ki blocks land but `receptor_occupancy` may not yet pass lint until kₑₒ arrives. Author Ki + flag in commit message that kₑₒ is the remaining blocker.

**Output:** 4 entries in 1 dated apply-script.

---

## 8. Smith & Teitler 1999 + Hoffmann 2004 + Baker 2005 — β1/β2/β3 selectivity tables

**DOIs:** 10.1023/a:1007784109255 (PMID:10372227), 10.1007/s00210-003-0860-y (PMID:14730417), 10.1038/sj.bjp.0706048 (PMID:15655528 — **corrected** from earlier wrong-match 16105936; free in PMC1576008)

| Slug | Field | What to look for |
|---|---|---|
| `propranolol` | `pd.receptor_occupancy.beta1` + `.beta2` blocks | β1 + β2 Ki in nM (current state: pKi only via PMID:10895074, line 51) |
| `metoprolol` | same | Same |
| `bisoprolol` | `pd.receptor_occupancy.beta2` block | β2 Ki (β1 already verified, line 47) |
| `nebivolol` | `pd.receptor_occupancy.beta2` block | β2 Ki (β1 already verified) |
| `carvedilol` | `pd.receptor_occupancy.beta2` block | β2 Ki (line 45 — currently only β1 Kd or selectivity ratios in abstract) |
| `atenolol` | `pd.receptor_occupancy.beta1` + `.beta2` blocks | β1 + β2 Ki |

**kₑₒ blocker:** lines 47, 51 note that nebivolol, bisoprolol, propranolol, metoprolol need kₑₒ before `receptor_occupancy` lints clean. Author Ki and flag the kₑₒ gap.

**Output:** ~6 entries in 1 dated apply-script.

---

## 9. Bymaster 2001 + Tatsumi 1997 — SNRI SERT/NET Ki

**DOIs:** 10.1016/S0893-133X(01)00298-6 (PMID:11750180); Tatsumi same as row 7

| Slug | Field | What to look for |
|---|---|---|
| `duloxetine` | `pd.receptor_occupancy.SERT` + `.NET` blocks | Ki already verbatim from PMID:11750180 (line 46), but kₑₒ still missing → PDF unlocks **only if** PD/TQT data appears in Bymaster supplement |
| `venlafaxine` | same | Same — Ki verified, kₑₒ missing |
| `vortioxetine` | `pd.receptor_occupancy.SERT` block | Ki verified PMID:21486038, kₑₒ missing |

**Status:** for SNRIs the Ki side is already done. This row is essentially **already unlocked** for `receptor_occupancy.Ki` — what's actually still gating is kₑₒ from a TQT study, NOT the Bymaster paper. Reframe queue row 9 on retrieval if Bymaster doesn't carry effect-compartment data.

**Output:** 0–3 entries depending on what Bymaster full-text yields beyond the abstract.

---

## Summary

| PDF # | Compounds touched | Estimated entries | Lint-blocking after authoring? |
|---|---|---|---|
| 1 | hydrocodone | 1 (kₑₒ + occupancy block) | No |
| 2 | tapentadol | 1 (kₑₒ + 2 occupancy blocks) | No |
| 3 | erythromycin | 1 (interaction Ki) | No |
| 4 | colchicine, cyclosporine | 2 (interactions both directions) | No |
| 5 | paroxetine | 1 (perpetrator + 1 victim) | No |
| 6 | st-johns-wort | 0–1 (refinement) | No |
| 7 | fluoxetine, sertraline, paroxetine, citalopram | 4 SERT Ki entries | **Yes** — need kₑₒ separately |
| 8 | propranolol, metoprolol, bisoprolol, nebivolol, carvedilol, atenolol | ~6 β-receptor Ki entries | **Yes** — need kₑₒ for some |
| 9 | duloxetine, venlafaxine, vortioxetine | 0–3 (most already verbatim) | **Yes** — kₑₒ still gating |

**Total lift:** ~12 compounds, ~16 dated apply-script entries across 8 sessions.

---

## Antipsychotic receptor occupancy (added 2026-05-25, wave 3 backlog)

Multi-target antipsychotic Kᵢ live in paywalled binding-profile tables (confirmed NOT in PMC open-access). kₑₒ is already solvable for each via human PET D2-occupancy anchors (Nyberg/Kapur/Nordström) — only the abstract/OA-quotable Kᵢ is missing. Author once the PDF is retrieved.

| DOI row | Slug | Field | What to look for in PDF |
|---|---|---|---|
| 10 (Richelson 2000) | clozapine | `receptor_occupancy` D2, 5-HT2A, H1 | Human-brain Kᵢ table — covers clozapine, olanzapine(human), risperidone D2, quetiapine in one table |
| 10 | risperidone | `receptor_occupancy` D2 | D2 Kᵢ (5-HT2A 0.4 nM already authored, PMID 7520908) |
| 10 / 14 | olanzapine | `receptor_occupancy` D2/5-HT2A (human) | Human values to replace the authored **rat** PMC3485633 set if human preferred |
| 12 (Ishibashi 2010) | lurasidone | `receptor_occupancy` D2, 5-HT2A, 5-HT7 | D2 1.68 / 5-HT2A 2.03 / 5-HT7 0.49 nM — whole profile |
| 12 (Jensen 2008) | quetiapine | `receptor_occupancy` D2, 5-HT2A, 5-HT7, H1 | quetiapine + norquetiapine table; kₑₒ 0.45/h already authored |
| 13 (Kroeze 2003) | clozapine, quetiapine | `receptor_occupancy` H1 | human cloned H1 Kᵢ |

**Output when retrieved:** 1 dated apply-script per PDF; clozapine, lurasidone, quetiapine get new occupancy blocks, risperidone gains D2, olanzapine optionally upgrades rat→human.

**Companion docs:**
- [PDF_QUEUE_DOIS.md](./PDF_QUEUE_DOIS.md) — DOI / PMID resolution
- [AUTHORING_GAPS.md](./AUTHORING_GAPS.md) §"Receptor occupancy — investigated, skipped" — verbatim list of skip reasons
