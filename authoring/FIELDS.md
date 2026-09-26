# Fields — the authoring reference

Every field an author writes, with its units, the provenance it requires, the lint rules that touch
it, and the mistake it invites. Derived from the live data in
[`../data/compounds.json`](../data/compounds.json), [`../data/pathways.json`](../data/pathways.json)
and [`../data/receptors.json`](../data/receptors.json), and from the zod schema in
`packages/registry/src/schema.ts`. Counts marked **live** are from 2026-09-26.

Conventions used below: **E** = lint error (blocks), **W** = lint warning. `*` = required.
"the loader" in the Rules column means the constraint is enforced by the zod schema, which `pnpm
validate` runs **before** the lint rules — a violation throws with a field path rather than
producing a finding. Every schema object is strict: a key not listed here, including a misspelling
like `sourse_pmid`, fails validation instead of being silently dropped. "Provenance" is what the field needs beside it to be honest, not merely to
validate.

---

## Compound — identity

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `slug`* | `^[a-z0-9][a-z0-9-]{1,63}$` | — | `slug.unique` **E**; the loader | A new slug for a molecule already in the catalog under an alias, an international name, a stereochemical prefix or a transliteration. Search `slug`, `name`, `aliases[]` **and** `retired_slugs[]` first. |
| `name`* | string | — | `compound.identity-collision` **W** | The identity rule keys on the name, so a name that reduces to another record's identity flags even with a distinct slug. 33 pairs shipped this way; 12 were merged. |
| `aliases[]` | string[] (live: 1,159 records carry at least one) | — | — | Omitting a spelling a user will actually type. `NAD⁺` with a superscript plus could never be matched by a typed query until an alias was added. An identity check is not a search check. |
| `category`* | 25-member enum: `pharmacological` (live: 500), `peptide`, `alkaloid`, `topical`, `adaptogen`, `terpenoid`, `hormone`, `vitamin`, `amino-acid`, `mineral`, `lipid`, `nootropic`, `flavonoid`, `stimulant`, `sweetener`, `metabolite`, `polyphenol`, `other`, `ketone`, `sleep`, `biologic`, `sugar`, `nucleoside`, `nucleotide`, `neurotransmitter` | — | the loader | `biologic` is load-bearing: it exempts the record from `pd.occupancy-needs-fu`, because an IgG is not albumin-bound. Mis-categorising a small molecule as `biologic` silences a real warning. |
| `retired_slugs[]` | slug[] (live: 16 names on 16 records) | The merge decision, recorded in a GAPS.md row | `compound.retired-self` **E**, `compound.retired-collision` **E** | A tombstone that is also a live slug, or claimed by two records — the lookup then resolves unpredictably. Choose the survivor by **inbound reference count**, not by which name reads better. |
| `systems[]`* | 10-member enum: `nervous`, `cardiovascular`, `respiratory`, `endocrine`, `digestive`, `renal`, `reproductive`, `musculoskeletal`, `integumentary`, `immune-hematologic` | — | `systems.tagged` **E**, `systems.valid` **E**, `systems.unique` **E** | Leaving it empty. It is an error, not a warning: coverage reached 1,244/1,244 and the backlog is closed. Multi-tagging is the norm. |
| `mechanism`* | free text | Cite anything numeric in it | `pk.prodrug-analyte-unstated` **W**, `dose.salt-moiety-unset` **W** | Prose rules read this field. A sentence saying the dose is a salt, or that the compound converts to an active species, is a *claim* the rules will hold you to — which is correct, but phrase negations and supersessions clearly. |
| `notes` | free text (live: 660 records) | This is where the verbatim quotes live | `pk.species-in-note` **W**, `pk.prodrug-analyte-unstated` **W** | Treating it as commentary. It is the provenance of record: quote, species, population, arithmetic, and what a superseded value was. |
| `refs[]` | `PMID:\d+`[], defaults to `[]` | Every entry must resolve | the loader (shape), `pnpm verify` (resolution) | Assuming `refs` is PK provenance. It serves **three** purposes — PK provenance, `receptor_occupancy` sources, and `interactions` citations. A reference supporting no PK value is not thereby misfiled; four legitimate entries were condemned on that reasoning. |
| `mw_g_mol` | g/mol (live: 1,109) | PubChem CID, re-queried in the batch | `interactions.ki-needs-mw` **E** | Storing the salt's mass while the PK describes the base (`lithium` 6.94 elemental against carbonate doses; `dimenhydrinate`). Storing a mass for a polydisperse polymer at all. Both are identity decisions, not data repairs. |

## Compound — routes and doses

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `routes[]`* | ≥1 of `PO SL IM IV SC IN TD INH PR` | — | `pk.route-listed` **E**, `pk.unsolvable-route` **W**, `pk.unsolvable-default-route` **W** | `routes[0]` is the route a consumer defaults to, so a first route with no solvable PK means the commonest path through the record renders nothing. Live: 1,687 declared routes (PO 998, IV 210, TD 132, SC 116, IM 84, INH 67, IN 49, SL 26, PR 5), of which 788 carry an authored `pk` block (PO 515, IV 159, SC 51, IM 25, TD 13, IN 12, SL 7, INH 5, PR 1). |
| `doses{route}`* | `{min, max, typical, unit}` | The label or the literature; `typical` is what occupancy is judged at | the loader | `unit` is **required** (`mg`/`g`/`mcg`/`IU`). 130 rows once omitted it and consumers defaulted to `mg` — right every time by luck, and a silent default on a dose is a hundredfold error waiting. |
| `dose_moiety_fraction` | (0,1] — the fraction of dosed mass that is the species `pk[]` describes (live: 4) | The salt, the analyte and the arithmetic, in `dose_moiety_note` | `dose.moiety-note` **W**, `dose.salt-moiety-unset` **W** | A bare stoichiometric constant. `0.188` says nothing about which salt it came from or which analyte it leaves, and a wrong one is invisible — the curve simply moves. |
| `dose_moiety_note` | ≤600 chars | — | `dose.moiety-note` **W** | — |

## Compound — `pk[route]`

Live: 788 route blocks; **all 788 carry a `source_pmid` or `source_label`**.

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `half_life_hr[route]` | hours, on the **compound**, not in `pk` (live: 856 records carry at least one) | Verbatim "elimination half-life" | `pk.elimination` **E** (some elimination path required), `pk.defaulted-ka-slow` **W** | Terminal vs steady-state; the metabolite's figure stored as the parent's (`carisoprodol`, 4× off); a flip-flop absorption artefact stored as disposition on a depot or transdermal route; a 21-day washout read as a half-life. |
| `ke_hr` | 1/h. **Live: 0 rows use it** — elimination comes from `half_life_hr[route]` | — | `pk.elimination` **E** | — |
| `V_L` | litres, absolute (live: 615 of 788) | A measured volume, or a declared derivation | `pk.defaulted-volume` **W** | The largest cluster of shipped defects. Absent → the consumer substitutes 0.5 L/kg = **35 L** (0.08 L/kg = 5.6 L at MW ≥ 10 kDa). Of 615 authored rows, 73% exceed 35 L and the median is 88 L, so defaulting a small molecule **biases occupancy high**. Never store 35 itself; never pair an apparent `V/F` with an independent `F`; never store a population `Vc` in a one-compartment slot; never store a plasma-referenced volume for a whole-blood drug. |
| `F` | [0,1] (live: 715) | An absolute bioavailability, against an IV arm | the loader (`pk.f-range` **E** is a backstop), `pk.defaulted-params` **W** | Absent → defaults to 0.9. Protein-binding percentages and urinary-recovery fractions read as F (`terazosin`, `tiagabine`, `alogliptin`). A congener's value (`empagliflozin`'s 0.78 is dapagliflozin's). No IV form means no absolute F exists: pin `F: 1` and put the figure in prose. |
| `ka_hr` | 1/h (live: 275 of 629 non-IV rows, plus one IV row) | Almost always a **declared derivation** from a verbatim Tmax | `pk.template-ka` **W**, `pk.defaulted-ka-slow` **W** | The most template-prone field in the catalog. Across 70 audited rows carrying one, **not a single value was supported by its citation**; only two genuine published human rates were ever located. Papers report a Tmax, not a rate. `ka` is formulation-specific, and published values almost always carry a lag time. Absent → defaults to 1.0/h, which for a once-weekly peptide puts the peak 4-13× early. |
| `lag_hr` | hours (live: 9) | Verbatim | — | — |
| `zo_dur_hr` | hours of zero-order input (live: 12) | Verbatim, or the paper's own model | — | Using it *and* a first-order `ka` for the same input, which double-counts absorption. |
| `alpha_hr`, `beta_hr`, `k21_hr` | 1/h, two-compartment (live: 1 route) | A published 2-comp fit | `pk.elimination` **E** | Modern popPK abstracts describe the architecture and reserve α and k21 for full-text tables. |
| `mm_vmax_per_hr`, `mm_km_mg_per_l`, `mm_linear_ke_hr` | Michaelis-Menten (live: 6, 6, 2) | A published saturable fit | `pk.elimination` **E** | — |
| `source_pmid` | `PMID:\d+` (live: 767) | must resolve **and** state the value | `pk.pmid` **W**, `pnpm verify` | The whole of [HYGIENE R2](./HYGIENE.md#r2-a-resolving-pmid-is-not-a-warrant-the-abstract-must-state-the-value-verbatim-for-the-named-compound). An outcomes trial, a review, a med-chem paper or a bioequivalence study cited for PK it does not contain. A route row is a **bundle** and its values may legitimately come from different documents — say which came from where in prose. |
| `source_label` | ≤300 chars (live: 26) | The label or monograph, named precisely | `pk.pmid` **W** | Calling a true IV-measured volume "apparent" in your own label text — `tacrine`'s said so, which would have licensed a later editor to break a correct record. Audit your own wording. |
| `source_species` | enum `rat mouse dog pig sheep rabbit monkey horse cow`; absent = human (live: 3) | — | `pk.species-in-note` **W** | Omitting it. An unlabelled rat half-life renders exactly like a human one. Not sufficient alone: carry the route and the precision too, and check human data on the modelled route do not contradict it. |
| `note` | free text (live: 5) | — | — | — |
| `pk_unauthored` | `{reason, note}`; reason ∈ `research-only` (live: 291), `local-acting` (149), `mixture` (103), `uncharacterized` (57), `homeostatic` (16), `label-only` (2) | The note says what was looked for and not found | — | Treating it as failure. It is the honest terminal state and it is what keeps `unvisited` at 0. `local-acting` also correctly removes an occupancy curve whose target never sees plasma. |
| `pk_analyte` | `parent` / `active-metabolite` / `active-moiety` / `total-drug-related` (live: 56) | — | `pk.prodrug-analyte-unstated` **W** | Leaving it unset on a prodrug: parent and metabolite routinely differ by an order of magnitude and a bare number carries no analyte. Also — if `pk_analyte` already names the metabolite, the record's curve **is** the metabolite's, so a `metabolites[]` chain would produce it twice. |
| `pk_analyte_name` | ≤80 chars (live: 23) | — | — | — |

## Compound — `effect_compartment`

Live: 249 records — **53 fitted, 196 declared estimates**.

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `keo_per_h`* | 1/h | A published PK/PD effect-compartment fit, or `approximated` | `receptor.needs-keo` **E** (occupancy requires it), `pd.needs-solvable-pk` **W** | A kₑₒ can only **delay** effect relative to plasma. A record whose effect precedes its Tmax has no representable value at any magnitude (`ranitidine`, `loperamide`, `ropinirole`, `montelukast`, `vardenafil`) and indicates a target not seeing plasma. Also: lifting one parameter out of a two-compartment population fit into a one-compartment slot. |
| `source_pmid` | `PMID:\d+` (live: 53) | must state the kₑₒ | `effect.pmid` **W**, `effect.approx-conflict` **E** | Hanging a PET time-course or onset-trial PMID on a value the paper does not state. 160 records did exactly that while their own notes said "Approximation; no published kₑₒ"; those PMIDs moved to `refs[]`. |
| `approximated` | boolean (live: 196) | A note giving the reasoning | `effect.approx-conflict` **E**, `effect.approx-note` **W**, `effect.approx-in-note` **W** | Setting it **and** a `source_pmid` — a fitted value is not an estimate. Conversely, deleting an unsupportable kₑₒ instead of demoting it: removal makes `receptor.needs-keo` fire on records whose occupancy cannot be computed without one. |
| `source_species` | same enum (live: 13) | — | `effect.species-in-note` **W** | `dofetilide`'s beagle kₑₒ was labelled correctly, verified exactly, and still wrong for the record — measured under IV infusion where the record is oral-only, and its 11 ± 8 min is a sixfold band stored as a point. |
| `note` | ≤600 chars (live: 248) | — | `effect.approx-note` **W**, `effect.approx-in-note` **W** | The prose rules read it per sentence. A note describing the estimate it was corrected **away from** used to fire the rule; phrase supersessions plainly. |

## Compound — `receptor_occupancy[]`

Live: 302 rows on 225 compounds. `hill_n` is exactly 1 on **301 of 302** and `emax` exactly 1 on
**297** — so every curve in the catalog is a simple hyperbola **by assumption**. Say so in the note.

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `receptor`* | ≤80-char key, must be canonical | Should match a `key` in [`../data/receptors.json`](../data/receptors.json) | `receptor.alias` **E**, `receptor.duplicate` **W**, `receptor.unknown-target` **W** | Occupancy unions by **exact** key, so `MOR` and `mu_opioid` render as two receptors. The alias map collapses `MOR`→`mu_opioid`, `KOR`→`kappa_opioid`, `sert`→`SERT`, `β1-AR`/`beta1_adrenergic`→`beta_1`, `nicotinic_ach`→`nachr_muscle`. Deliberately **not** aliased: `gaba_a` vs `gaba_a_bzd`, `nav` vs `nav1_5`. Shorthand keys such as `5-HT2A` or `mu_opioid` resolve to their gene-keyed catalog entry (`HTR2A`, `OPRM1`) through `OCCUPANCY_TARGET_KEYS` in `packages/registry/src/lint.ts`; a new GPCR shorthand key needs a line there. Live: 2 of 92 distinct keys resolve to nothing, the class-level `alpha_1` and `muscarinic`, which `receptor.unknown-target` lists and `pnpm report` counts as `targets.occupancyKeysUnknown`. |
| `ec50_mg_l`* | mg/L, > 0 | The Ki/Kd/EC50 quote **plus** the conversion arithmetic | the loader (`receptor.ec50-positive` **E** is a backstop), `pd.occupancy-needs-fu` **W** | Two separate traps. (1) A comparator's value: 62 of 216 confirmed audit problems were occupancy rows, mostly the compound appearing as a reference standard in someone else's paper. (2) An in-vitro Ki is a **free**-drug number while the plasma concentration is **total** — 53% of pharmacological rows once reported ≥90% occupancy at an ordinary dose (audit), 23% today after the `fraction_unbound` batches (live). Convert as `Ki_nM × mw_g_mol / 1e6`. |
| `emax`* | [0,1] | — | `receptor.emax-range` **E** | Storing 1 when the record's own note specifies otherwise — `ghb`'s GABA-B `emax` was 1 while its note said "set emax ~= 0.69 (NOT 1)" and had never been applied. A sweep of all 328 rows found no other instance; check yours anyway. |
| `hill_n`* | > 0 | — | the loader (`receptor.hill-positive` **E** is a backstop) | Storing something other than 1 without a verbatim sigmoidicity factor. `atracurium`'s 4.04 is the only one in the catalog. |
| `action` | enum incl. `agonist`, `partial_agonist`, `inverse_agonist`, `antagonist`, `inhibitor`, `blocker`, `neutralizer`, `pam`, `nam`, `substrate`, `modulator`, `unknown` | — | — | The model is an agonist Emax/EC50 curve. A pure antagonist, a voltage-dependent blocker, or a genomic nuclear-receptor action does not fit it — skip and write the GAPS row rather than forcing a shape. |
| `pathway` | ≤80 chars, free text (live: 295) | — | — | — |
| `basis` | `in_vitro_ki` (default when absent) / `in_vivo_plasma_ec50` (live: 2) / `whole_blood_ic50` (live: 16) | — | `pd.occupancy-needs-fu` **W** | Leaving an in-vivo plasma EC50 unlabelled: it is already referenced to total plasma and needs no free-fraction correction, so the label changes the arithmetic. |
| `source_pmid` / `source_label` | `PMID:\d+`, or a label naming product + set id + effective date | must state the value for your compound as **subject** | `receptor.pmid` **E** (neither present), `receptor.secondary-source` **W** | See `ec50_mg_l`. A PMID copied off an IUPHAR/GtoPdb ligand page is the shape `pnpm verify` can never catch: the id resolves, the paper is on topic and correctly attributed, and nobody in the chain opened it. Live: 0 — the class was closed on 2026-09-26. `source_label` works as it does on a pk route and exists because for some agents no paper states the affinity at all — ziprasidone's 5-HT2A, 5-HT2C and H1 constants are in GEODON section 12.2 and in no abstract or open full text. A label prints the number with no species, tissue or radioligand around it, so say that in the `note`. |
| `note` | ≤600 chars (live: 298) | Species, tissue, radioligand, verbatim quote, conversion | `receptor.derived-value` **W**, `receptor.secondary-source` **W** | Claiming "abstract verbatim" for a number the abstract states only qualitatively (`ixekizumab`, `nivolumab`, `pembrolizumab` all did). Both rules read this prose clause by clause, so a note recording the bad value it REPLACED does not fire — say "the previous value was a midpoint" and the rule stays quiet, which is why re-authored rows read the way they do. |

## Compound — free fraction

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `fraction_unbound` | (0,1]; absent = 1.0, i.e. no correction (live: 179) | Verbatim quote, species and population in `fu_note`, **and the PMID or label set id in `refs[]`** — the field has no source slot of its own, and `pnpm verify` never reads prose | `pd.occupancy-needs-fu` **W** | Storing a scalar where binding is concentration-dependent across the therapeutic range — `linagliptin` is 99% bound at 1 nmol/L and 75-89% above 30, with its Cmax inside the transition. Also: taking a label sentence that reports the parent and a metabolite together. |
| `fu_note` | ≤600 chars (live: 190) | — | `pd.occupancy-needs-fu` **W** | Nothing. An `fu_note` with **no value** is a legitimate state: it records that the question was examined and a scalar was deliberately not authored. That is a decision, not a gap. |

## Compound — `interactions[]`

Live: 606 edges, 161 carrying a `kinetics` block.

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `slug`*, `name`* | ≤80 / ≤120 chars | — | `interactions.target-exists` **E** (kinetic edges only) | Off-registry edges are allowed for informational notes; a *kinetic* block on one cannot modulate anything. |
| `level`* | `synergistic` (live: 276), `caution` (172), `major` (97), `warn` (33), `contraindicated` (28), `beneficial` | — | the loader | — |
| `note`* | ≤500 chars | — | — | — |
| `timing` | ≤120 chars (live: 9) | — | — | — |
| `source_pmid` | `PMID:\d+` (live: 290) | — | `interactions.kinetics-pmid` **E** when `kinetics` is present | — |
| `kinetics.ki_uM` | µM (live: 120) | `ki_basis`, and the calibration inputs if calibrated | `interactions.ki-needs-mw` **E** | Reading as a published Ki when it is a clinical fold-change inverted through an assumed exposure — **120 entries were exactly that**. The µM→mg/L conversion silently skips without the perpetrator's `mw_g_mol`. |
| `kinetics.ki_basis` | `in_vitro` (live: 9) / `calibrated_from_auc` (live: 76) | — | `interactions.ki-basis-unstated` **W** | Omitting it while storing calibration inputs. |
| `kinetics.auc_ratio` | > 1 (live: 76) | Verbatim clinical fold-change | `interactions.ki-calibration-incomplete` **E**, `interactions.ki-calibration-mismatch` **E** | The invariant is `ki_uM = assumed_perp_uM / (auc_ratio − 1)`, checked to 2%. A urinary metabolic ratio, a trough concentration, or a clearance change is **not** an AUC ratio and cannot be converted to one. |
| `kinetics.assumed_perp_uM` | µM (live: 76) | State the assumption | `interactions.ki-calibration-incomplete` **E** | — |
| `kinetics.induction_factor` | multiplier on victim `ke`, > 0 (live: 36) | Verbatim AUC fold-change, converted | the loader (`interactions.induction-positive` **E** is a backstop) | Storing enzyme-protein induction (a smaller number) as though it were the AUC effect. |
| `kinetics.mbi` | boolean (live: 33) | — | — | Time-dependent inactivation is approximated as competitive Ki; note the approximation. |
| `kinetics.plasma_binding_displacement` | number (live: 5) | — | — | It is a perturbation term with no baseline to perturb unless `fraction_unbound` is authored. |
| — | — | — | `interactions.inert-kinetics` **W** | Six edges modulate a victim `ke` that does not exist. Real magnitudes, inert today, live the moment the victim gains PK. **Not a reason to delete.** |

## Compound — composition, nutrition, cross-references

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `composition` | `{standardization?, constituents[{slug, mg_per_g_extract, note?, source_pmid?}]}` (live: 38) | Per constituent | the loader | This is the right treatment for a multi-constituent botanical — *Polygala tenuifolia*, *Cistanche* — instead of one curve for a mixture. |
| `nutrition` | `{rdi, unit, ul?, note, source_pmid?}`; unit ∈ `mg mcg IU g` (live: 33) | The authority for the Daily Value | the loader | — |
| `recon3d_metabolite_id` | ≤40 chars (live: 48) | Recon3D (Brunk 2018, PMID:29457794) | — | — |
| `metabolites[]` | **not in the schema** — a parent → metabolite chain with a molar formation fraction | The formation fraction | — | 48 records' prose says an active metabolite matters, and this is the shape that would carry it, but `compoundSchema` does not declare it, so writing one today fails `pnpm validate` with an unrecognized-key error. Authoring it means a schema change first. Blocked on one number per pair: the molar formation fraction, which population-PK papers report in tables, not abstracts. **Do not author a chain where `pk_analyte` already names the metabolite** (`valacyclovir`, `valganciclovir`, `lisdexamfetamine`, `prednisone`) — the curve is already the metabolite's and a chain would produce it twice. |

---

## Pathway

Live: 230 pathways, 899 steps, 1,919 modulators, 71 with a Recon3D subsystem, 1 with a diagram.

| Field | Type / units | Provenance | Rules | The mistake it invites |
| --- | --- | --- | --- | --- |
| `slug`*, `name`* | string | — | `pathway.slug-unique` **E** | — |
| `category`* | 11-member enum: `signaling` (live: 53), `biosynthesis` (49), `receptor_pharmacology` (36), `catabolism` (30), `endocrine_axis` (11), `immune_innate` (10), `drug_metabolism` (9), `transport` (9), `cell_death` (8), `disease_cascade` (8), `membrane` (7) | — | the loader | — |
| `domains[]` | 12-member enum: `metabolic` (live: 75), `neuropsychiatric` (48), `cardiometabolic` (31), `oncology` (29), `endocrine_reproductive` (27), `immune_inflammation` (26), `aging_regenerative` (19), `gi_hepatic` (16), `dermatology` (12), `infectious_disease` (12), `pain_analgesia` (10), `respiratory` (5) | — | — | Note it is **plural**; 223 of 230 pathways carry at least one. |
| `systems`*, `description`* | enum[] / free text | Cite anything numeric | — | The description carries `[[pathway-slug]]` cross-links; a typo there is a dead link no rule checks. |
| `subtitle`, `sensation` | free text (live: 122, 11) | — | — | — |
| `recon3d_subsystem` | string (live: 71) | Recon3D | — | — |
| `refs[]` | `PMID:\d+`[], defaults to `[]` | Every entry resolves | the loader (shape), `pnpm verify` (resolution) | Three pathways carry none. A pathway whose steps cite nothing and whose refs are empty asserts its mechanism on no source at all. |
| `steps[].from`*, `.to`* | ≤80 chars, **free text** | — | the loader (`pathway.step-len` **E** is a backstop) | Most endpoints are processes and states, not molecules ("cortical pyramidal glutamate release"). Free text is correct here; a rule that warned on unresolved endpoints fired 1,613 times and was unactionable. |
| `steps[].via` | ≤120 chars | — | the loader (`pathway.step-len` **E** is a backstop) | — |
| `steps[].note` | ≤500 chars | — | the loader (`pathway.step-len` **E** is a backstop) | The length limits are **hard**: the zod schema rejects an over-long field, so `pnpm validate` throws with the field path before any rule runs. The matching lint rules can only fire on data that reached them another way. |
| `steps[].from_slug`, `.to_slug`, `.via_slug` | compound slug (live: 122, 63, 1) | — | `pathway.step-from-slug` **E**, `pathway.step-to-slug` **E**, `pathway.via-slug` **E** | These are **claims**. Present-but-unresolvable is an error. Assert one only when you mean the endpoint is that catalogued compound. |
| `steps[].source_pmid` | `PMID:\d+` (live: 66) | — | `pnpm verify` | — |
| `steps[].recon3d_reaction_ids[]` | ≤40 chars each (live: 20 steps) | Recon3D | — | — |
| `modulators[].slug`* | compound slug | — | `pathway.modulator-slug` **E** | Modulators are by definition catalogued compounds, so an unresolvable slug is an error — and this is what a compound merge has to rewrite (15 modulators were repointed in the 2026-09-06 merge). |
| `modulators[].effect`* | `inhibitor` (live: 973), `activator` (678), `substrate` (207), `cofactor` (61) | — | the loader | — |
| `modulators[].target` | ≤120 chars, optional | — | the loader (`pathway.modulator-len` **E** is a backstop) | Optional in the schema and unchecked by any rule, but write it: without it a modulator says a compound touches the pathway and not where. |
| `modulators[].step` | integer index into `steps[]` (live: 143) | — | `pathway.modulator-step` **E** | Reordering or deleting a step silently invalidates every modulator index pointing past it. |
| `modulators[].note`, `.source_pmid` | ≤500 chars / `PMID:\d+` (live: 1,087, 22) | — | the loader (`pathway.modulator-len` **E** is a backstop) | — |
| `diagram.nodes[]` | `{id, label, kind, sub?, layer?, x?, y?, w?, h?, details?}`; kind ∈ `input signal hub effector outcome crosstalk`; `details` is `{role?, function?, clinical?, targets?[]}`, live on 0 nodes | — | `pathway.diagram-node-dup` **E**, `pathway.diagram-coord` **E** | Coordinates live on a 1500 × 1060 canvas; off-canvas is an error. Live: one pathway has a diagram, with 21 nodes and 21 edges. |
| `diagram.edges[]` | `{from, to, label?, enzyme?, role?, location?, pmid?, rateLimiting?, crosstalk?}` | `pmid` is bare digits here, not `PMID:` | `pathway.diagram-ref` **E** | Every `from`/`to` must name a declared node. |
| `diagram.chips[]`, `diagram.feedback` | node references | — | `pathway.diagram-ref` **E** (it checks `chips[].target` and `feedback.from`/`.to` too) | Live: 0 chips, 0 feedback authored. |

---

## Receptor catalog

[`../data/receptors.json`](../data/receptors.json) has two halves. `receptors[]` is **fetched, not
authored**, from the IUPHAR/BPS Guide to PHARMACOLOGY, version 2026.3. `nonGpcrTargets[]` is
**hand-curated** and preserved byte-for-byte by every fetch. `meta` records the source, url, version
and fetch date. There is no per-row PMID **by design** — it is nomenclature, not measurement.
Live: 381 GPCRs, 47 non-GPCR targets.

| Field | Where | Notes |
| --- | --- | --- |
| `key`* | both lists | What `receptor_occupancy[].receptor` must match. This is the only field an authoring decision touches, and only indirectly: choosing the key for an occupancy row. |
| `name`*, `family`*, `gene`* (nullable), `full_name`*, `gtp_id`* | both | From the Guide. Do not hand-edit. |
| `class`* | `nonGpcrTargets` only | `enzyme`, and the other target classes the registry binds (transporters, ion channels, nuclear receptors, immune targets). |

**To add a GPCR**, do not hand-write it into `receptors[]`: run `pnpm receptors:fetch`, which
regenerates that half from the Guide and would overwrite a hand edit. It refuses to shrink the
catalog unless you pass `--force`.

**To add a non-GPCR target**, add it to `nonGpcrTargets[]` by hand, with every field above and the
real GtoPdb `gtp_id` from the Guide's page for it (0 only if the Guide has none). The fetch
preserves this half untouched.

Before adding either, check whether the uncatalogued occupancy key is just shorthand for a target
already in the file. If it is, add one line to `OCCUPANCY_TARGET_KEYS` in `packages/registry/src/lint.ts`, checked against the catalog entry's `name`,
instead of a new entry. If a target genuinely has no catalog entry, the
occupancy key still works, the gap shows up as a `receptor.unknown-target` warning and in `pnpm
report` as `targets.occupancyKeysUnknown`, and the decision belongs in
[`../data/GAPS.md`](../data/GAPS.md) rather than in an invented entry.

---

See [HYGIENE.md](./HYGIENE.md) for why each rule exists, and [WORKFLOW.md](./WORKFLOW.md) for the
batch loop and the E-utilities calls.
