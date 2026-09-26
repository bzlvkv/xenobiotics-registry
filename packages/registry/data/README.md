# Registry data

Source of truth for compounds, references, kinetic interactions, receptor occupancies, and effect-compartment parameters.

This folder is canonical. Everything the solver and UI consume flows from `compounds.json`. The cloud `registry.*` Postgres tables and the CDN bundle are downstream projections; this file is upstream.

---

## Definition of done

The registry is finished when **all three axes** below are satisfied. They are independent — hitting one does not substitute for another.

### 1. Breadth — catalog coverage

Per [plan §16](../../../../plan/index.html), the v8 catalog target is **1000+ compounds**, sourced by priority:

| Bucket | Target |
|---|---|
| Top 100 prescribed meds (global volume) | 100 |
| Top 80 most-tracked supplements (public surveys + import logs) | 80 |
| GLP-1 / metabolic / longevity-focus | 60 |
| Adaptogens / nootropics / amino acids (community queue) | 60 |
| Coverage gaps (top-30 per system × 10 systems) | ~300 |
| Pathway closures (any compound that completes a hand-authored pathway) | varies |

**Pathways:** 33 → 80+ (30 hand-authored + 50+ Recon3D-derived).

### 2. Depth — solver layers populated per compound

Per [spec §10](../../../../spec/index.html). Not every compound needs every layer; what matters is that the layers required by each compound's mechanism are populated.

| Layer | Target |
|---|---|
| Bateman 1-comp PK (`pk[route]`) | every compound that's dosed (≥80% of catalog) |
| Monte Carlo IIV | every compound with PK |
| Effect compartment (`keo`) | 120 priority | **249** | **53 fitted from a published PK/PD model; 196 are declared estimates** (`approximated: true` + a note giving the reasoning). The 2026-09-06 first pass flagged 34 uncited estimates; a second pass the same day found 160 more whose `effect_compartment` cited a PMID while the note beside it said "Approximation; no published kₑₒ" — the PMID anchored the pharmacology (a PET time-course, an onset trial, the binding primary), not the number, and the compound page rendered each as a fitted measurement. Those PMIDs now live in `refs[]`; `data-lint`'s `effect.approx-in-note` rule catches any recurrence. Classes with no published effect-compartment model at all (nuclear-receptor agonists, therapeutic antibodies, DORAs, most oral small molecules outside anaesthesia and analgesia) are why the estimates exist. |
| Hill–Langmuir occupancy (`receptor_occupancy[]`) | every receptor-active compound |
| Two-compartment | compounds with literature 2-comp fits (testosterone esters, semaglutide, etc.) |
| MM saturable elimination | indicated compounds (phenytoin, ethanol, salicylates, etc.) |
| Kinetic interaction edges (CYP induction/inhibition, plasma-binding competition) | top-N clinically-relevant pairs |
| MW backfill (`mw_g_mol`) | every small molecule that could be a kinetics perpetrator |

### 3. Quality — provenance and CI discipline

This axis is **non-negotiable** and is the registry's competitive moat against any LLM-generated catalog.

- Every PK / Ki / IC50 / EC50 / induction factor / Hill coefficient cites a `source_pmid` whose abstract names the value verbatim. No paraphrasing, no fabrication. (See [`feedback_no_fabricated_citations`](../../../../../../.claude/projects/c--Users-teaha-pro-xenobiotics/memory/feedback_no_fabricated_citations.md).)
- [`scripts/verify-registry.ts`](../../../scripts/verify-registry.ts) walks every `source_pmid` against NCBI ESummary on every CI run.
- [`scripts/data-lint.ts`](../../../scripts/data-lint.ts) enforces structural invariants (no kinetic edge without perpetrator MW, no receptor occupancy without `keo`, no orphan PK route, etc.).
- [`.github/workflows/registry.yml`](../../../.github/workflows/registry.yml) runs both gates on every PR + push to `main` that touches this folder.
- Every cell investigated and skipped (no verifiable abstract carries the value, or mechanism doesn't fit the Hill model, etc.) gets a row in [`AUTHORING_GAPS.md`](./AUTHORING_GAPS.md) with the candidate PMIDs that were chased.

The quality bar is what makes "done" meaningful: the registry is finished when **there are no unvisited cells**, not when every cell is filled. A skip with a citation trail is as much a deliverable as an authored value.

---

## Current state (all counts measured 2026-09-26)

> Re-measured on 2026-09-26. The previous figures dated from 2026-09-06 and three
> batches had landed against them without updating this table (the nootropic gap
> batch, amantadine/rimantadine, and the peptide/grey-market batch), so several
> numbers below move by more than that last batch alone accounts for. Where a
> count went DOWN against the old figure, the cause is the 2026-09-08 sweeps that
> deleted defaulted volumes and template absorption rates, not a regression.

| Axis | Target | Current | Notes |
|---|---|---|---|
| Compound count | 1000+ | **1,244** ✅ | v1.0 catalog target met since 2026-05-06; grown through the v1.1/v1.2 additions, the 2026-06 catalog-breadth waves and audit completeness fills, then trimmed by the 2026-09-06 duplicate-identity merges (1,231 → 1,219), and grown again by the 2026-09-18/19 nootropic and adamantane batches (+12) and the 2026-09-26 peptide/grey-market batch (+15). |
| **Unvisited cells** | **0** | **0** ✅ | Every compound resolves to authored PK *or* an explicit `pk_unauthored` reason — 626 authored, 618 explained. This is the axis the definition of done above is actually written against: "finished when there are no unvisited cells, not when every cell is filled." |
| Hand-authored PK | priority subset | **626** ✅ | Compounds with at least one authored `pk[route]`. Across them, **788 route entries, every one of which cites a source: 767 a PMID, 21 a regulatory label (`source_label`), 0 unsourced.** Nine audit passes on 2026-09-06 re-sourced or removed every value whose citation did not support it. A source is not a warrant: the passes read every cited abstract value by value, and **most stored numbers did not survive that reading** — see [AUTHORING_GAPS.md](./AUTHORING_GAPS.md). |
| `pk_unauthored` explained | — | **618** | By reason: research-only 291, local-acting 149, mixture 103, `uncharacterized` 57, `homeostatic` 16 and `label-only` 2. enoxaparin joined `mixture` on 2026-09-06: it is a polydisperse chain distribution measured as anti-Xa activity rather than concentration, so a mass-based curve models a quantity that was never measured. |
| Effect compartment (`keo`) | 120 priority | **249** | 53 fitted from a published PK/PD model; **196 are declared estimates** (`approximated: true` + a note giving the reasoning). The split is new as of 2026-09-06 and is far worse than the docs previously claimed: 160 records cited a PMID while their own note said "Approximation; no published kₑₒ", and those citations moved to `refs[]`. Classes with no published effect-compartment model at all (nuclear-receptor agonists, therapeutic antibodies, DORAs) are why the estimates exist. |
| Hill occupancy | receptor-active set | **235** | 325 `receptor_occupancy` rows across 235 compounds; every row carries a `source_pmid` (lint-enforced). |
| Kinetic interaction edges | top-N risk pairs | **169** | Ki + induction + plasma-binding edges spanning CYP1A2 / 2C8 / 2C9 / 2C19 / 2D6 / 3A4 + P-gp. Wave 2a exhaustively closed across 12 authoring sessions; ~100 further candidate pairs investigated and skipped under the tables-vs-abstracts ceiling. |
| MM elimination | indicated | **4** ✅ | phenytoin (PMID:27174459), ethanol (PMID:3319346), theophylline (PMID:11554438), acetaminophen parallel-pathway (PMID:18759860). Salicylate deferred — full-text-only and dose-dependent. |
| Two-compartment | indicated | **1** | testosterone-cypionate IM (PMID:29367424); closed at ceiling — modern popPK abstracts describe 2-comp architecture but reserve α and k21 for full-text tables. |
| MW backfill | small molecules | **1,109** | Grown by 31 on 2026-09-06 through the peptide audit (PubChem CIDs, plus two approval documents), and by 9 more on 2026-09-26, every one of those re-queried against PubChem during the batch rather than carried over from a search report. Molecular weight is what the µM-to-mg/L conversion needs, so its absence was the ceiling on receptor-occupancy authoring for peptides. The remainder are biologics, extracts, polymers and class-mixture entries with no single defined MW — and two records added on 2026-09-26 store no mass ON PURPOSE for reasons worth reusing: pentosan polysulfate is a 4–6 kDa polydisperse distribution rather than a molecule, and adamax has no verifiable structure at all, only a vendor claim, so a stored mass would lend it a precision nothing supports. |
| Body-system tags | every compound | **1,244 / 1,244** ✅ | Reached 2026-09-06 with the last 27 (dietary fatty acids, phytosterols, minor carotenoids and tocopherol vitamers, fluoride/nitrate/chlorophyll). `data-lint`'s `systems.tagged` rule is now an **error**, not a warning, so the backlog cannot silently reopen. |
| PMIDs verified | 100% of cited | **2,577 / 2,577** ✅ | CI-gated via `pnpm registry:verify`; 0 dead. The gate resolves identifiers only — a real, correctly-attributed paper whose abstract states none of the values hung on it passes by construction. **Thirty-plus such cases have now been found**, making it the single largest defect class in the catalog: secukinumab, phenelzine, clopidogrel, rufinamide, inclisiran, dichloroacetate, olanzapine, hydrochlorothiazide, famciclovir, pregabalin, ziprasidone, doravirine, pravastatin, artemisinin, cefuroxime, nilotinib, topiramate, nitrofurantoin, acyclovir, and across batch 3 levofloxacin, clarithromycin, erythromycin, propranolol, metoprolol, valproate, acetazolamide, methotrexate, cyclosporine, emoxypine and velpatasvir, and across batch 5 repaglinide, ledipasvir, telithromycin, cinacalcet and tenofovir-alafenamide — the last of which cites two *different* papers in `source_pmid` and `refs`, neither stating any stored value. Batch 6 adds citalopram, erlotinib, hydrocodone, tolterodine and carvedilol, and sharpens the point: in three of those the correct paper was **already in the record's own `refs[]`, cited by nothing**. |
| **Pathways** | 80+ | **92** ✅ | 80 hand-authored across 5 batches + 12 from the Recon3D ETL (Brunk 2018, PMID:29457794). 52 carry a `recon3d_subsystem` cross-reference. |

### Known integrity gap

The `compound.identity-collision` lint rule (added 2026-09-06) found **33 pairs
of records claiming one molecule under two slugs**. **Twelve have been merged and
retired**; the catalog fell 1,231 → 1,219. Survivors were chosen by inbound-
reference count, so `ethanol`, `arginine`, `tryptophan` and `tyrosine` beat the
more label-like `alcohol` and "L-" forms.

Retirement is safe for user data because `Compound.retired_slugs` keeps the old
names and every slug lookup resolves through `compoundIndex` (in `@xeno/core`,
shared by the solver, oplog and app), so an intake logged under a retired slug
still finds its PK. The op log is never rewritten.

The last two merges closed the pairs that had been left for a decision.
`hydrocortisone` folded into `cortisol` and `sodium-oxybate` into `ghb` — in both
cases the two records had published contradictory PK for one molecule while
neither citation supported its own numbers, so the survivor's PK was re-sourced
from a primary before the merge rather than carried over. The GHB merge also
corrected a GABA-B `emax` of 1 that the row's own note had specified as 0.69.

**21 pairs remain open and are believed legitimate** — a salt form beside its
parent (`calcium` / `calcium-carbonate`, `zinc` / `zinc-picolinate`, `sodium` /
`sodium-chloride`), or a class entry beside its members (`bcaa` / `leucine` +
`isoleucine` + `valine`, `epa-dha` / `epa` + `dha`). The rule stays a warning for
that reason. The four salt pairs no longer publish contradictory curves: all four
mineral records are now `pk_unauthored: homeostatic`. See
[DATA_QUALITY_BACKLOG.md §7](./DATA_QUALITY_BACKLOG.md).

### System tag distribution (2,065 tags across 1,244 compounds)

| System | Tagged | System | Tagged |
|---|---:|---|---:|
| nervous            | 450 | musculoskeletal     | 138 |
| digestive          | 384 | integumentary       | 114 |
| immune-hematologic | 292 | renal               | 80 |
| cardiovascular     | 235 | reproductive        | 78 |
| endocrine          | 235 | respiratory         | 59 |

Multi-system tagging is the norm (1,244 compounds carry 2,065 tags). Distribution reflects the registry's bias toward CNS-active and metabolic compounds; the immune-hematologic and integumentary buckets grew through Wave 0b's specialty Rx + topical actives expansion.

---

## How to extend

1. Read [`ROADMAP.md`](./ROADMAP.md) for the ordered wave plan from current state to v1.0 — batches are sequenced so each wave unblocks the next.
2. Read [`AUTHORING_GAPS.md`](./AUTHORING_GAPS.md) — every row is a candidate that's already been investigated and is awaiting full-text access or a mechanism-fit fix. Don't redo dead-end PubMed searches.
3. Pick a target list per the active wave in ROADMAP, with the standing rule that active-stack PK gaps preempt anything else.
4. Follow the parallel-agent verification loop in [`scripts/authoring/PLAYBOOK.md`](../../../scripts/authoring/PLAYBOOK.md). Each session lands as one dated apply-script under `scripts/authoring/`.
5. CI must stay green on `pnpm registry:lint && pnpm registry:verify && pnpm -r test`.

The discipline is the deliverable. A small authored set with full provenance is worth more than a large one without.
