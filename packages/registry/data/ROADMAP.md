# Registry roadmap to v1.0

The ordered work to get from current state ([README.md](./README.md)) to "finished." Batches are sequenced so each wave unblocks the next; hard prereqs are enforced by [`data-lint.ts`](../../../scripts/data-lint.ts), so out-of-order authoring fails CI.

For the definition of done see [README.md](./README.md). For the authoring loop see [`scripts/authoring/PLAYBOOK.md`](../../../scripts/authoring/PLAYBOOK.md). For investigated-and-skipped cells see [AUTHORING_GAPS.md](./AUTHORING_GAPS.md).

---

## Scope tiers — v1.0 vs v1.1

v1.0 is the smallest cut that still feels complete. v1.1 fills the long tail. Per-wave scope is annotated below; the original full-depth targets are preserved as v1.1.

| Wave | v1.0 cut | v1.1 cut | Why |
|---|---|---|---|
| 0a MW backfill | done | done | Foundation, no tier. |
| 0b Catalog 1000+ | done | done | Foundation, no tier. |
| 1a Top-100 PK | **all 100** | — | Spine of every other surface; active-stack gap-closure rule (PLAYBOOK §1) already pulls these in. Don't cut. |
| 1b Top-80 supplement PK provenance | done | done | — |
| 2a CYP perpetrators | **CYP3A4 only** (rifampin / keto / ritonavir / fluconazole / grapefruit) + AUTHORING_GAPS closure | 2D6 / 2C9 / 2C8 / 1A2 | 3A4 covers >50% of clinically meaningful DDIs; the rest is long-tail. |
| 2b Plasma binding | all (~10–20 pairs) | — | Already small. |
| 3a kₑₒ | **50 most-logged + receptor-active prereqs for 3b** | balance to 120 | Drops Spec §10's 120-target to "what users will actually see." |
| 3b Hill occupancy | **deferred** | full ~50 candidates | Without 3b, occupancy curves render for ~17 hand-PK compounds. Today still shows kₑₒ-driven Ce(t); "% occupancy overlay" lands in v1.1. |
| 4a MM elimination | all 5 (phenytoin, ethanol, salicylates, theophylline, acetaminophen) | — | One session; phenytoin/ethanol can't fake 1st-order without lying. |
| 4b Two-compartment | **deferred** | all ~8 | Solver ships; depot drugs render as 1-comp with a note. |
| 5a Pathways 33→80+ | parallel, optional | finish | Off critical path either way. |
| 5b GAPS closure | parallel, optional | continue | Off critical path either way. |

**v1.0 effort: ~18–30 sessions (~3 months at 2/wk).** v1.1 adds ~13–23 more sessions to reach the original full-depth target.

---

## Dependency chain

```
Wave 0 (foundations)  ──┬──>  Wave 1 (PK depth)  ──>  Wave 3 (PD layer)
                        │                          └─>  Wave 4 (MM, 2-comp)
                        └──>  Wave 2 (DDI)

Wave 5 (pathways + GAPS closure) — independent, runs in parallel
```

Hard blockers enforced by `data-lint.ts`:

- Kinetic interaction edge requires perpetrator `mw_g_mol` (µM↔mg/L conversion).
- `effect_compartment.keo` requires `pk[route]` to exist (Ce(t) is solved from Cp(t)).
- `receptor_occupancy[]` requires `effect_compartment.keo` (Hill operates on Ce, not plasma — see [`feedback_pd_keo_authoring`](../../../../../../.claude/projects/c--Users-teaha-pro-xenobiotics/memory/feedback_pd_keo_authoring.md)).

Bottom-up is forced.

---

## Standing rule

**Active-stack PK gap closure preempts everything.** Any compound the user has logged via `intake.create` that lacks PK is highest priority — closes the "no PK on file" affordance on Today. Drop into whichever wave is currently running. (Mirrors PLAYBOOK §1.)

---

## Wave 0 — Foundations

Unblocks every other wave. Waves 0a and 0b touch different fields and can run in parallel.

### 0a. MW backfill, perpetrator universe — ✅ done (2026-05-03)

- Target was ~150; landed 179 in [2026-05-03-mw-backfill-wave-0a.ts](../../../scripts/authoring/2026-05-03-mw-backfill-wave-0a.ts) on top of the 156 from the original [2026-05-02-mw-backfill.ts](../../../scripts/authoring/2026-05-02-mw-backfill.ts) → **335 / 456 compounds (73%) carry mw_g_mol**.
- The remaining 121 are intentional skips — biologics, peptides, antibodies, plant extracts, polymers, and class-mixture entries with no single defined MW. See [AUTHORING_GAPS.md](./AUTHORING_GAPS.md) §"MW backfill state" for the breakdown.
- Wave 2 DDI authoring is now unblocked.

### 0b. Catalog stub expansion, 456 → 1000+ — ✅ done (2026-05-03)

- **Catalog: 1001 compounds, 94% body-system tagged, 80% MW-backfilled.**
- 11 sub-batches of stub authoring spanning the prioritized buckets:
  - Top prescribed meds (~108 stubs): antifungals, macrolides, rifamycins, ARBs, ACEi, CCBs, diuretics, sulfonylureas/DPP-4/meglitinides, PDE5, PPIs, H2 blockers, antibiotics (β-lactams + macrolides + fluoroquinolones + tetracyclines + aminoglycosides + nitroimidazoles + sulfonamides), NSAIDs, antiseizure (broad SOC), triptans/gepants, antihistamines (1st + 2nd gen), asthma/COPD (SABA/LABA/LAMA/ICS), antipsychotics, GI (PPI/H2/prokinetic/antiemetic/laxative), anticoagulants/antiplatelets, antiarrhythmics (Class I/III)
  - Supplements + research (~80): botanicals, mushrooms, algae, single-molecule actives, omega-3 individual fatty acids, research peptides (Khavinson + cosmetic), SARMs, biohacker compounds, cosmetic peptides, sports nutrition, nootropics
  - Specialty Rx (~80): cancer + hormone therapy, glaucoma drops, antifungals (topical + systemic), HIV/HCV/CMV/HSV antivirals, anesthetics + NMBAs, antiparasitics, anti-TB, cannabinoids, OB/GYN, urologic, naltrexone, JAK inhibitors, anti-rosacea
  - Topical pharmaceutical actives (~30): potency-ladder corticosteroids, calcineurin inhibitors, antifungals, antibiotics, retinoids, hair-loss, hyperpigmentation, scalp/dental
- 40+ pattern gaps caught + patched mid-flight in [scripts/authoring/2026-05-02-systems-tagging.ts](../../../scripts/authoring/2026-05-02-systems-tagging.ts) — antibiotic class names, viral pathogens, μ/κ-opioid Greek glyphs, neuropathy / nociceptor / TRP channels, benzodiazepine class, voltage-gated Na+ channels, cancer regimen / antimetabolite, SV2A, etc.
- The 201 still-without-MW + 63-still-untagged are intentional skips: biologics, peptides, antibodies, plant extracts, polymers, class-mixture entries with no single defined MW; or biochemistry-only mechanism prose without organ-system context.

---

## Wave 1 — PK depth

Unblocks Waves 3 and 4 (kₑₒ and MM/2-comp depend on `pk[route]` existing).

### 1a. Top-100 prescribed-meds PK

- Full `pk[route]` (ka, V, F, ke or t½) + `source_pmid` per route.
- Unblocks Wave 2: most CYP perpetrators are prescription meds.
- Pre-identifies Wave 4 candidates: MM-eliminated and 2-comp compounds cluster in this set (phenytoin, theophylline, testosterone esters, semaglutide, etc.).
- Estimated: 5–8 sessions.

### 1b. Top-80 supplements PK verification — ✅ done (verified 2026-05-06)

- The provenance pass intent of Wave 1b is satisfied: a full-catalog scan
  of all 395 compounds with authored PK shows **0 routes missing
  `source_pmid`** — every authored PK route has a primary-source PMID.
  Coverage was reached incrementally through the v7 import + v0.5
  source-PMID pass + the 8 Wave-1a sessions.
- The secondary Wave-1b intent ("fix topically-wrong refs") was
  largely closed at v0.5 when 5 mis-imported refs[] entries were
  dropped (creatine-monohydrate / modafinil / glycine / citicoline /
  zinc-picolinate). A full topically-wrong sweep across all 1015
  compounds' refs[] arrays remains an open per-compound verification
  task but is not blocking v1.0 data depth.

---

## Wave 2 — Kinetic interactions

Depends on Wave 0a (perpetrator MW) and ideally Wave 1a (so the perpetrators have PK).

### 2a. CYP perpetrator clusters — **v1.0 cut done (2026-05-07)**

CYP3A4 v1.0 cut closed at commit 00754ea. State of all 5 canonical CYP3A4 perpetrators:
- **rifampin** (induction): 9 edges authored at v0.6 (warfarin, EE, midazolam, atorvastatin, simvastatin, cyclosporine, tacrolimus, losartan, verapamil)
- **ritonavir**: 8 edges authored (atorvastatin, simvastatin, tacrolimus, midazolam, sildenafil, alprazolam, fentanyl, amlodipine)
- **fluconazole**: 11 edges authored (warfarin, tacrolimus, phenytoin, losartan, ibuprofen, celecoxib, fluvastatin, omeprazole, diazepam, midazolam, triazolam)
- **ketoconazole**: 2 → 6 edges (added triazolam, alprazolam, sildenafil, nifedipine 2026-05-07)
- **bergamottin / grapefruit furanocoumarins**: new compound authored; 2 edges (felodipine, simvastatin). Mechanism-based inactivation (K_I + k_inact) captured in compound `mechanism` prose; reversible Ki edge for simvastatin from PMID:15285845.

5 ketoconazole victims (simvastatin, atorvastatin, tacrolimus, fentanyl, felodipine) skipped — KZ Ki reported only in figures/tables of full-text papers, never in abstracts. Logged in AUTHORING_GAPS.md.

Author Ki / IC50 / induction factor with verified PMID for each enzyme cluster's canonical perpetrators:

| Enzyme | Canonical perpetrators | Tier |
|---|---|---|
| CYP3A4 | rifampin (induction, done elsewhere), ketoconazole, ritonavir, fluconazole, grapefruit furanocoumarins | **v1.0** |
| CYP2D6 | paroxetine, fluoxetine, bupropion, quinidine | v1.1 |
| CYP2C9 | fluconazole, amiodarone | v1.1 |
| CYP2C8 | gemfibrozil (already authored), trimethoprim | v1.1 |
| CYP1A2 | fluvoxamine, ciprofloxacin | v1.1 |

Plus **full-text closure of the 6 rows already in [AUTHORING_GAPS.md](./AUTHORING_GAPS.md)** — candidate PMIDs identified, awaiting PDF access for the verbatim Ki / K_I — counts toward v1.0.

Estimated: v1.0 1–3 sessions (3A4 + GAPS); v1.1 +3–5 (other enzymes).

### 2b. Plasma binding competition — **v1.0 closed at ceiling (2026-05-08)**

- **Final state: 5 edges authored** — aspirin → valproate (Δfu=2.58, PMID:6804150), clofibrate → warfarin (Δfu=0.13, PMID:480183), and three others.
- **Original target was 10–20 pairs but exhaustive verification confirmed only ~5–6 are achievable** under the strict + full-text rule. Most warfarin/NSAID/sulfa/sulfonylurea pairs report displacement qualitatively in abstracts and the numeric Δfu lives in tables of paywalled equilibrium-dialysis full-text papers (Schentag, Aggeler, Karim) which aren't PMC-indexed.
- **Re-tiered**: v1.0 closed at 5 edges. Remaining 6 candidate pairs documented in AUTHORING_GAPS.md as full-text-bound. The original 10–20 target was an overestimate of what's verifiable from public sources.

---

## Wave 3 — PD layer

Depends on Wave 1 (Hill operates on Ce, Ce needs PK).

### 3a. kₑₒ for priority compounds — **v1.0 closed at ceiling (2026-05-08)**

- **Final state: 76 kₑₒ authored** (well above the absolute "50" target).
- **Cohort coverage is uneven**: anesthesia / opioid / antipsychotic classes well-covered; SSRI/SNRI/cardiovascular (statin/ACEi/DOAC) cohorts mostly skipped.
- **Skip pattern is structural, not authoring-debt**:
  - SSRIs/SNRIs: industry TQT studies either found null QT signal (no model fit) or used linear regression instead of effect-compartment (sertraline/fluoxetine/paroxetine/duloxetine/venlafaxine/vortioxetine all SKIP after exhaustive PMC search 2026-05-08).
  - Statins/ACEi/DOACs: turnover-driven (LDL/PT) or plasma-direct (anti-Xa) PD endpoints — kₑₒ is a conceptual misfit, not a missing citation.
  - β-blockers, antipsychotics, opioids: now have core members authored (atenolol/carvedilol/metoprolol; aripiprazole/quetiapine; full opioid cohort from anesthesia work).
- **Re-tiered**: v1.0 cut closed at 76 kₑₒ (well-distributed across mechanically-relevant classes). v1.1 balance to 120 stays as a stretch target, contingent on full-text PDF access for paywalled TQT papers and FDA NDA reviews.

### 3b. Hill occupancy for receptor-active compounds — **v1.1**

- Deferred from v1.0. Current state: 56 compounds with receptor_occupancy[]; all have kₑₒ (lint enforces).
- SSRI receptor occupancy specifically blocked at v1.0: SERT Ki values verified verbatim from PMC5044489 (Nevels 2016 Table 1) for 7 SSRIs but kₑₒ chain unbreakable in PMC literature. Re-author when full-text TQT papers become accessible.

### 3b. Hill occupancy for receptor-active compounds — **v1.1**

- Deferred from v1.0. Without 3b, occupancy curves render for the ~17 hand-PK compounds already authored; Today's Ce(t) still works via 3a's kₑₒ. The "% occupancy overlay" surface lands in v1.1.
- ~50 candidates (after pruning the mechanism-doesn't-fit set documented in AUTHORING_GAPS.md: genomic / nuclear receptors, voltage-dependent ion-channel block, multi-target precursors, ion-only mechanisms).
- Each row: receptor + Kd + Hill n + `source_pmid`.
- Estimated: 4–6 sessions.

---

## Wave 4 — Specialized solver coverage

Solver code shipped at v0.6 / Phase 4; these waves only need authoring.

### 4a. MM (saturable) elimination — **v1.0** — ✅ done (2026-05-07)

5-compound target; final state:

- phenytoin — authored at v0.5 (Vmax 0.53/hr, Km 4.03 mg/L, PMID:27174459)
- theophylline — authored at v0.5 (Vmax 0.31/hr, Km 2.4 mg/L, PMID:11554438)
- ethanol — authored 2026-05-07 ([scripts/authoring/2026-05-07-wave-4a-mm-elimination.ts](../../../scripts/authoring/2026-05-07-wave-4a-mm-elimination.ts)) as new compound: V_L=37, F=0.8, Vmax=230 mg/L/h, Km=80 mg/L (PMID:3319346 Holford 1987; cross-validated by PMID:1261158 Wilkinson/Wagner 1976)
- salicylates / aspirin — **schema/solver READY (2026-07-11), data deferred.** Both E6 halves shipped — the parallel-pathway field (`mm_linear_ke_hr`) and the parent→metabolite compartment (`Compound.metabolites` + solver metabolite.ts). Remaining blocker is *data, not schema*: a research pass found salicylate's Vd, pathway split, and parallel-term Vmax/Km are full-text-only (Levy 1965 PMID:5862532 / 1972 PMID:4552824, no abstracts) and dose-dependent — authoring precisely now would be false precision. Only Günsberg's salicylurate Vmax/Km (PMID:6713771), fm≈1 (PMID:7437270), and MW 138.12 are abstract-verifiable. See [AUTHORING_GAPS.md §"MM elimination"](./AUTHORING_GAPS.md). Author `salicylate` + `aspirin.metabolites` once the PK is pulled from full-text.
- acetaminophen — ✅ **authored 2026-07-11** ([scripts/authoring/2026-07-11-acetaminophen-parallel-mm.ts](../../../scripts/authoring/2026-07-11-acetaminophen-parallel-mm.ts)) once the solver gained the `mm_linear_ke_hr` parallel-pathway field (Backlog E6). Reith 2009 (PMID:18759860) fits BOTH pathways: sulphation as saturable MM (Vmax 1.94 mg/L/h, Km 14.66 mg/L) + glucuronidation (Km≈1041 mg/L ≫ Cp → first-order, kL 0.164/h). Reproduces the cited therapeutic t½ 2.34 h / CL 17.8 L/h with no back-calibration and gives the documented dose-dependent half-life extension (Slattery PMID:3829578). Previously skipped as "schema-fit."

### 4b. Two-compartment PK — **v1.1 closed at ceiling (2026-05-11)**

- **Final state: 1 compound authored (testosterone-cypionate IM, source PMID:29367424).** Solver supports α/β/k21 (shipped v0.6 / Phase 4); only one of the ~8 originally-targeted depots has an abstract-verbatim α and k21 triple.
- **Ceiling is structural.** The 2026-05-11 re-chase of semaglutide / tirzepatide / retatrutide / insulin-glargine via PubMed E-utilities confirmed the v0.5 finding: modern popPK abstracts (Overgaard 2019 PMID:30788808 semaglutide; Schneck/Urva 2024 PMID:38356317 tirzepatide; Jastreboff 2023 PMID:37366315 retatrutide) reliably describe 2-comp model architecture and quote CL/F + Vc/F + Vp/F + terminal t½ — but reserve α and k21 for full-text tables.
- testosterone-enanthate / -undecanoate / paliperidone-palmitate / nandrolone-decanoate were already documented as 2-comp skips at v0.5 (paliperidone-palmitate is explicitly 1-comp per PMID:19725593; the rest have no compartmental fit in any indexed abstract). See [AUTHORING_GAPS.md](./AUTHORING_GAPS.md) §"Wave 4b 2-compartment skips" + §"Wave 4b re-confirmation 2026-05-11".
- v1.1 stretch: full-text PDF access to the Overgaard / Urva / Coskun popPK papers would unlock 4-5 additional 2-comp authorings.

---

## Wave 5 — Independent / parallel

Run anytime; not on the critical path to v1.0 data depth.

### 5a. Pathways 33 → 80+ — **v1.2 hand-authored target met 2026-05-11**

**Final state: 30 hand-authored pathways shipped** in a single multi-batch session that combined schema design, loader, lint extension, tests, and three content batches:

- **Architecture:** [packages/core/src/types.ts](../../../packages/core/src/types.ts) `Pathway` interface; [packages/registry/src/loader.ts](../../../packages/registry/src/loader.ts) `pathwaySchema` + `loadPathways`; [packages/registry/data/pathways.json](./pathways.json) canonical source; [scripts/data-lint.ts](../../../scripts/data-lint.ts) extended for pathway cross-references; [scripts/verify-registry.ts](../../../scripts/verify-registry.ts) walks pathway PMIDs.
- **Content (30 pathways):**
  - **Biosynthesis / drug-metabolism core (10):** catecholamine_synthesis, serotonin_melatonin_axis, caffeine_demethylation, cholesterol_synthesis, bile_acid_synthesis, vitamin_k_cycle, warfarin_metabolism, ketone_body_synthesis, urea_cycle, heme_biosynthesis
  - **Catabolism + energy (5):** purine_catabolism, tca_cycle, beta_oxidation, glycolysis, gluconeogenesis
  - **Drug metabolism + one-carbon (3):** ethanol_metabolism, nicotine_metabolism, methionine_sam_cycle, folate_one_carbon
  - **Signaling (3):** mtor_signaling, nfkb_signaling, arachidonic_acid_cascade
  - **Hemostasis (2):** coagulation_cascade, fibrinolysis
  - **Endocrine axes (4):** hpa_axis, hpg_axis, hpt_axis, raas_axis
  - **Specialty (3):** histamine_axis, nitric_oxide_synthesis (+ the 30th — see pathways.json)
- **PMIDs added:** 8 (catecholamine/serotonin/caffeine refs); all verified by `pnpm registry:verify`.
- **Modulator references:** ~80 across the 30 pathways, all pointing to existing compounds.json slugs.

**v1.2 stretch — 50+ Recon3D-derived subsystems:** the second target from spec §16.3. Different content type than hand-authored pathways: Recon3D contains ~3,800 reactions across ~110 metabolic subsystems. Import would be its own ETL pass + schema-fit review (the Recon3D reaction model uses fluxes + cofactors that don't map 1:1 to the v1.2 PathwayStep schema). Deferred — separate plan.

### 5b. AUTHORING_GAPS.md closure

As full-text PDF access opens up, walk the file row by row. Each closure converts a documented skip into an authored value or a confirmation that the mechanism still doesn't fit.

---

## Effort summary — actual (2026-05-08)

| Wave | Final state | Status |
|---|---|---|
| 0a + 0b (foundations) | 335 MW + 1014 compounds | ✅ done |
| 1a (top-100 PK) | 96/96 effective coverage | ✅ done |
| 1b (PK provenance) | 0 routes missing source_pmid | ✅ done |
| 2a (CYP3A4 DDIs) | 5 perpetrators, 36 edges total | ✅ done |
| 2b (plasma binding) | 5 edges (ceiling at ~5-6 from public sources) | ✅ closed at ceiling |
| 3a (kₑₒ) | 76 authored across mechanically-relevant classes | ✅ closed at ceiling |
| 3b (Hill occupancy) | 56 compounds (deferred to v1.1) | tier'd to v1.1 |
| 4a (MM elimination) | phenytoin/theophylline/ethanol authored; aspirin/APAP skipped (schema misfit) | ✅ done |
| 4b (2-compartment PK) | deferred to v1.1 | tier'd to v1.1 |
| 5 (pathways/GAPS closure) | parallel/incremental | ongoing |

**Total v1.0 effort: ~10 sessions across 2026-05-07 to 2026-05-08** including foundation audit, full-text path opening, and the ceiling-discovery rounds. Catalog: 1014 compounds, 963 PMIDs verified (0 dead).

**Two unbreakable ceilings discovered**:
1. Wave 2b plasma-binding (~5-6 pairs achievable from public sources; original 10-20 target was an overestimate)
2. Wave 3a SSRI/SNRI receptor occupancy (kₑₒ chain blocked — TQT papers either found null signals or used linear regression, not effect-compartment models)

These are NOT missing-citation gaps — they're documented structural / conceptual / paywall ceilings logged in [AUTHORING_GAPS.md](./AUTHORING_GAPS.md).

**v1.1 stretch targets** (require full-text PDF access for paywalled TQT/equilibrium-dialysis/PET papers): SSRI receptor occupancy chain, β-blocker/antipsychotic kₑₒ via PET tables, statin/sulfonylurea binding displacement.

---

## Updating this file

When a wave finishes, mark it done and update the [README current-state table](./README.md). When new priorities surface (a regulatory signal, a community contribution backlog), insert a wave and re-render the dependency chain. The file decays if it lags behind reality, so prefer many small edits over big rewrites.
