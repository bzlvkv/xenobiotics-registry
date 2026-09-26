# Data-quality backlog — unfinished items

Open items left after the 2026-06-28 → 2026-07-01 data-quality audit + remediation
(branch `audit/data-quality-remediation`). The **compound** side was complete as
of that audit (all 216 confirmed citation flags + 8 needs_review + 5 dropped +
43 completeness items done). What remains:

> **Update 2026-09-06.** A provenance-and-integrity pass closed the registry's
> last 32 unvisited cells (every compound now resolves to authored PK or an
> explicit reason), typed two kinds of previously prose-only provenance
> (`pk[route].source_label`, `effect_compartment.approximated`), finished
> body-system tagging at 1231/1231, and fixed a solver gate that silently
> dropped MM-only routes. It also opened **§7 below — 31 duplicate compound
> identities**, a new track on the compound side that the 2026-07 audit did not
> look for. Gates: data-lint 0 errors, registry:verify 1908/1908 PMIDs.

Companion files: `DATA_QUALITY_AUDIT.md` (the audit report), `AUTHORING_GAPS.md`
(every affinity/PMID chased for the items below is logged there with its blocker).

---

## 1. Foods (the whole #5 track — not started)

- **14 high-severity templated-panel misattributions** — byte-identical nutrition
  panels shared across unrelated brands: one whey amino panel across 13/7/5 brands;
  an electrolyte panel smeared across aloe-juice + lemonade + soda; In-N-Out +
  Wendy's fries sharing one 38-fatty-acid panel. Need per-product re-extraction
  from real labels. Surfaced by data-lint `food.content-duplicate` warnings.
- **Provenance backfill** — 2,198 / 4,487 presets have no re-derivable source
  (no `fdc_id` / `source_url` / `label_ref`); supplements worst (435/439). Plus
  2,197 carry the placeholder `captured_at: '2026-06-14'` (hardcoded by the old
  merge gate) — re-stamp on re-author. data-lint `food.provenance` warnings.

## 2. Occupancy-model receptor-vocabulary extension (CODE change, biggest ceiling)

~13 completeness-gap compounds were logged as needing only a canonical occupancy
slug. Affinities + PMIDs are in `AUTHORING_GAPS.md`.

**Correction (2026-07-01 verification pass).** Two parts of the original framing
were too optimistic:
1. **Wiring is usually 1 edit, not 3.** Every GPCR target here (GHSR, GHRHR,
   GNRHR, SSTR2/5, ADRB3, CALCR, SCTR, HCAR2) *already exists* in `receptors.json`
   (it's the full IUPHAR non-olfactory GPCR set). For a GPCR you add only the
   `OCCUPANCY_TO_CATALOG` bridge line (apps/app/src/lib/receptors.ts); `direction.ts`
   needs no edit for agonists/antagonists/inhibitors (already handled). The full
   3-file edit applies ONLY to the non-GPCR enzyme/immune targets (AChE, ALOX5,
   CD20), which aren't in the GPCR catalog.
2. **Vocab is rarely the *only* blocker.** Most of these compounds are ALSO
   keo-blocked, or their affinity is rat/table-only/relative-only — so adding the
   slug alone does not unblock them. On re-verification, only **ghrp-2** survived.

**Done:** `ghrp-2` → GHSR **AUTHORED** (`2026-07-01-ghrp2-ghsr-occupancy.ts`):
GtoPdb-curated rat pKi 9.3 + verbatim human keo 1.13/h. See AUTHORING_GAPS.

Still waiting (vocab present-or-easy, but each has a *second* blocker):

| Target to add | Compounds waiting | Affinity (in AUTHORING_GAPS) + 2nd blocker |
|---|---|---|
| GHSR-1a / ghrelin (mapped) | ~~ghrp-2~~ **done**; ghrp-6, ipamorelin, hexarelin | ghrp-6 has NO verifiable affinity (PMID:11087562 is ghrelin, not GHRP-6; Howard 1996 PMID:8688086 qualitative; GtoPdb none) + no keo; ipamorelin only functional rat EC50; hexarelin affinity secondary/vendor only |
| GnRH-R (GNRHR) | gonadorelin, goserelin | pKd 7.7–8.5 (Nederpelt 2016, PMID:26398856) — but downstream endocrine effect, no simple keo (both) |
| SSTR2 / SSTR5 | lanreotide | SSTR2 pKi 8.7–9.6 (Patel 1994, PMID:7988476) |
| GHRHR | sermorelin | ✗ **not authorable** — Gaudreau 1992 (PMID:1534126) is RA%-only (no absolute pIC50); GtoPdb has no numeric affinity; claimed keo 1.39/h absent from PMID:7586605 abstract. Prior claim retracted (2026-07-01). |
| acetylcholinesterase (ALOX5-style enzyme) | huperzine-a, pyridostigmine | HupA rat Ki 7 nM (PMID:12445575) |
| GPR109A / HCA2 | niacin | Wise 2003 (PMID:12522134) |
| β3 / ADRB3 | mirabegron | EC50 22.4 nM (Takasu 2007, PMID:17293563) |
| amylin (AMY1-3) | pramlintide | Gingell 2014 (PMID:24169554) |
| CALCR (calcitonin R) | calcitonin | Kd ~0.44 nM (Andreassen 2014, PMID:24643196) |
| SCTR (secretin R) | secretin | genuine human affinity exists |
| ALOX5 (5-LOX enzyme) | zileuton | Carter 1991 (PMID:1848634) |
| CD20 | rituximab | Reff 1994 (PMID:7506951) — also keo-blocked (biologic) |

Note on the two "orphaned keos" originally logged here: **GHRP-2 Ke0 1.13/h
(PMID:9543135) is now wired** (verbatim-confirmed, authored with the GHSR row
above). The **sermorelin keo 1.39/h (PMID:7586605) claim was retracted** on
2026-07-01 — that value is not in the paper's abstract (a peak-GH/AUC bolus
comparison with no PK-PD model), so it can't anchor an occupancy row.

## 3. keo-blocked in-model occupancy (affinity + target both available)

Target IS in the occupancy vocabulary and a genuine affinity exists, but the
`receptor.needs-keo` invariant is unmet (no genuine effect-site/PK-PD keo primary).
Author the occupancy row the moment a keo primary is found:

| Compound | Target — affinity | keo status |
|---|---|---|
| edoxaban | factor_xa Ki 0.561 nM (PMID:18624979) | direct-response PD, no keo (like apixaban/rivaroxaban) |
| lixisenatide | glp_1r IC50 1.43 nM (PMID:20570597) | indirect/turnover PD, no keo (GLP-1 class) |
| clenbuterol | beta_2 KD 12.6 nM (PMID:20590599) | Boner 1987 / Lodeweyckx 2024 time-courses paywalled |
| meclizine | H1 (only bovine Ki; vendor 250 nM unsourced) | no keo; also no clean human Ki |
| prochlorperazine | dopamine_d2 (GtoPdb pKi 8.4, rat/tabular) | no keo primary |
| brompheniramine | H1 (SPD racemate 52 nM, internally inconsistent) | **keo IS supportable** (Simons 1982, PMID:6128358); blocked only on a clean racemate H1 Ki |

## 4. Pre-existing PK estimates surfaced during authoring (unsourceable, not fixed)

Flagged while doing other work; left as-is because no primary exists to correct to
(would need full-text access or a label, which carries no PMID):

- **sermorelin**: `ka_hr=3` & `V_L=7` are unsupported estimates — `V_L=7`
  contradicts the Geref label IV Vd ~24 L. Missing `mw_g_mol` (~3357.9).
- **ghrp-2**: `half_life_hr.SC=0.55` is IV-derived (route caveat — Pihoker 1998 dosed i.v.). (`mw_g_mol` 818.0 was added 2026-07-01 with the GHSR occupancy row; no longer missing.)
- **niacin**: `ka_hr`/`F`/`V_L` remain modeling defaults — Menon 2007 (now cited)
  is an extended-release study; an immediate-release `ka`/Tmax would need
  Neuvonen 1991 (PMID:1958442) full-text table extraction.

## 5. Low-confidence recites to revisit with full-text access (kept, user-approved)

Cite a genuine subject-primary but the exact value sits in a paywalled table that
couldn't be read; value rests on GtoPdb/consensus corroboration. Upgrade to a
verbatim recite (or correct) if/when full text is obtained:

- **hydroxyzine** H1 → Gillard 2003 (PMID:12755407, 2-page supplement) — hydroxyzine's
  presence in the paper is inferred, not confirmed. Weakest of the set.
- **lorazepam** BZ-site → Hadingham 1993 (PMID:8391122) — kept ~5 nM (rat-derived);
  human recombinant is likely ~1–2 nM, so may run ~2.5× high.
- **mirtazapine** 5-HT2C → Millan 2000 (PMID:10762339) — retained 39 nM is the
  GtoPdb/ChEMBL consensus, not confirmed as Millan's own Table 1 value.
- **oxybutynin** M3 → Reitz 2007 (PMID:18045203) — value matches GtoPdb exactly; cell not open-access.
- **ondansetron** 5-HT3A → 10 nM is a consensus **midpoint estimate** (direction —
  down from the 0.47 nM comparator outlier — is well-corroborated).
- **tamoxifen** t½ 96 h — this is the primary's single-dose value; 168 h (steady-state
  terminal) may be preferred for a chronically-dosed SERM. Reviewer's call.
- **tesamorelin** t½ 0.13 h (CL/V-derived, FDA multi-dose ~0.43 h); **testosterone-cypionate**
  t½ 192 h (label; literature ~4.5 d); **tenofovir-disoproxil** t½ 17 h (primary says 12–15 h).

## 6. Housekeeping

- **Merge**: branch `audit/data-quality-remediation` is unmerged — open a PR to main.
- ~~**README**: current-state table stale at 1038 compounds (actual 1,231).~~ **Done 2026-07-01** — compound count (→1,231) + PMID total (→1,903) refreshed; header notes the remaining rows are still the 2026-05-11 snapshot.


## 7. Duplicate compound identities — 12 merged, 21 open (2026-09-06)

Slug uniqueness was never identity uniqueness. Two records could carry distinct
slugs while describing the SAME molecule, because one was the other's alias
("ethanol" / "alcohol"), an international name ("albuterol" / "salbutamol"), a
stereochemical prefix ("tyrosine" / "l-tyrosine"), or a spelling variant
("epitalon" / "epithalon"). Nothing merged them at runtime: search returned
both, Today drew two curves, two intakes of one substance never summed, and
each side was authored independently — so the registry published two different
half-lives for one molecule, occasionally citing the SAME paper for both.

Surfaced by the `compound.identity-collision` lint rule. 33 pairs found;
**12 merged and retired**, 21 left open. Run
`pnpm registry:lint | grep identity-collision` for the current list.

### Merged (2026-09-06)

Applied in [scripts/authoring/2026-09-06-merge-duplicate-slugs.ts](../../../scripts/authoring/2026-09-06-merge-duplicate-slugs.ts).
Survivors were chosen by counting INBOUND REFERENCES, not by which name reads
better — every reference to a retired slug is a link that must be rewritten,
and the counts overrode the more natural-sounding name in four cases.

| Retired | Survivor | Why the survivor won |
|---|---|---|
| `alcohol` | `ethanol` | 132 food items + the demo seed reference ethanol; alcohol none |
| `l-arginine` | `arginine` | 555 food items + the FDC nutrient importer |
| `l-tryptophan` | `tryptophan` | 621 food items + the FDC nutrient importer |
| `l-tyrosine` | `tyrosine` | 525 food items + the FDC nutrient importer |
| `citicoline` | `cdp-choline` | 3 inbound interaction edges + the IV route |
| `mk7` | `vitamin-k2-mk7` | member of the vitamin-K nutrient group (Daily Value) |
| `s-23` | `s23` | carries the androgen-receptor occupancy row |
| `epithalon` | `epitalon` | more common transliteration; carries the SC half-life |
| `albuterol` | `salbutamol` | carries the INH route, the one a SABA is dosed by |
| `copper-tripeptide-1` | `ghk-cu` | carries all three routes (TD/SC/IN) |

**How user data survives.** `Intake.compound` stores a raw slug and the op log
is append-only, so intakes logged before the merge still name the retired slug.
The surviving record keeps the old names in `Compound.retired_slugs`, and every
slug lookup resolves through `compoundIndex` (in `@xeno/core`, so the solver,
oplog and app all share one forwarding table). A pre-merge intake therefore
still gets its PK. Nothing rewrites the log. The retired record's name and
aliases fold into the survivor so search still finds it by the old name.

Registry-INTERNAL references (5 pathway steps, 15 pathway modulators, 13 food
items, 4 interaction edges) were rewritten to the canonical slug at merge time.
Forwarding exists for user data alone, and data-lint keeps internal references
pointed at live slugs.

Two deliberate data drops, logged in [AUTHORING_GAPS.md](./AUTHORING_GAPS.md):
`alcohol`'s IV route (a flat 0.25 h first-order half-life, incoherent grafted
onto ethanol's saturable model) and `s-23`'s uncited 12 h oral half-life.

| Pair | Question |
|---|---|
### The two decided pairs (second pass, same day)

Both were merged, but only after their PK was repaired — each pair published two
contradictory parameter sets for one molecule while *neither* citation supported
its own numbers, so carrying either set across would have preserved a defect.
Applied in
[2026-09-06-pk-resourcing.ts](../../../scripts/authoring/2026-09-06-pk-resourcing.ts),
which must run before the merge script.

| Pair | Resolution |
|---|---|
| `hydrocortisone` → `cortisol` | `cortisol` won on inbound references (3 pathway steps, 3 modulators, the GR/MR occupancy rows, the kₑₒ). Its PK cited a review (PMID:15634032) whose abstract contains no number at all; hydrocortisone's cited a real study (PMID:29795974) that supports only F. Both sets were replaced by Derendorf 1991 (PMID:2050835), a 20 mg IV/PO crossover stating t½ 1.7 h, V 34 L and F 96% in one place. The IM route was dropped from both: no human abstract states an IM absorption parameter, and the two records' IM `ka` values (1.89 vs 1.58 /h) had no source. |
| `sodium-oxybate` → `ghb` | Inbound references favoured `sodium-oxybate` (2 modulators vs 0), but the evidence was lopsided the other way: `ghb`'s single stored value was verbatim-supported and its paper (PMID:15538955) also states an unused V of 52.7 L, while **all four** of `sodium-oxybate`'s PK values are absent from PMID:22337777, which reports no t½, no V, no ka, and — having no IV arm — no derivable F. `ghb` survives with V added; the kₑₒ and the GABA-B row were moved across first. Two corrections on the way: `emax` 1 → 0.69 (the row's own note said "set emax ~= 0.69 (NOT 1)" and it had never been applied) and the EC50 re-derived at the free-acid MW 104.1 → 520.5 mg/L, since the surviving record doses GHB, not its sodium salt. |

A sweep for the same defect across all 328 occupancy rows — a note naming an
`emax` different from the stored one — found no other instance.

### Still open (21 pairs)

All are believed legitimate: a salt or ester form with its own absorption
(`zinc` / `zinc-picolinate`, `calcium` / `calcium-carbonate`, `potassium` /
`potassium-chloride`, `sodium` / `sodium-chloride`), or a class entry beside its
members (`bcaa` / `leucine`+`isoleucine`+`valine`, `epa-dha` / `epa`+`dha`,
`fish-oil`). The rule stays a warning for that reason. The four mineral pairs no
longer publish contradictory curves — all four records are now
`pk_unauthored: homeostatic` (see §8).

**To merge another pair:** add it to the merge script's `MERGES` table with the
inbound-reference count that justifies the survivor, re-run with `--write`, then
`pnpm registry:check` and `pnpm -r test`. The script rewrites internal
references and folds aliases; the lint rules `compound.retired-collision` and
`compound.retired-self` guard the forwarding table.


## 8. Template-filled PK blocks — the pattern behind §7's contradictions (2026-09-06)

A verification pass over the four "both records carry PK" collisions found the
same shape every time: where a source genuinely contained a number the authoring
session derived it correctly and often documented the derivation, and where it
did not, a plausible `{t½, ka, V, F}` quartet appeared anyway. F clustered at
0.25–0.3; V varied wildly (14, 25, 30, 35, 300, 560 L) with nothing behind it.

Five compounds were repaired in this pass and are recorded in
[AUTHORING_GAPS.md](./AUTHORING_GAPS.md) §"PK re-sourcing" with the full
dead-end PMID trail:

- **calcium, calcium-carbonate, zinc, zinc-picolinate** — every half-life, ka
  and volume was unsourced; the citations support only the two calcium
  absorption fractions. All four are now `pk_unauthored: homeostatic`, keeping
  the verbatim absorption facts in `notes`.
- **cdp-choline** — the stored 56 h half-life traced to rat total-radioactivity
  kinetics (PMID:4059318); no human abstract states any citicoline PK parameter.
  Now `pk_unauthored: uncharacterized`.
- **dextromethorphan** — the removed F 0.11 and V 300 L are the canine values of
  PMID:15500572. A species misattribution, not merely an uncited number.

**The lint now exists.** `pk.template-quartet` (data-lint, added 2026-09-06)
keys on the only signal available offline: an invented `{ka, V, F}` trio repeats
verbatim across unrelated compounds, because the same default was reached for
more than once. IV routes are exempt (F is 1 by definition, ka absent), and so
are same-molecule relatives — one ion legitimately shares one parameter set, and
`compound.identity-collision` already covers those pairs. That leaves unrelated
molecules storing byte-identical absorption, volume and bioavailability under
different citations.

It flagged **7 groups covering 15 compounds**, and **all seven were audited and
cleared on 2026-09-06** (fourth pass,
[2026-09-06-template-quartet-audit.ts](../../../scripts/authoring/2026-09-06-template-quartet-audit.ts)).
The rule was right every time: not one shared trio was stated by any cited paper.
Thirteen records were re-sourced and keep a curve; `tryptophan` and `tyrosine`
joined the homeostatic bucket. Per-compound trails are in
[AUTHORING_GAPS.md](./AUTHORING_GAPS.md) §"Template-quartet audit".

Four findings from that pass are worth carrying forward:

- **The half-life was the authored field, but authored did not mean correct.**
  Of 15, five were verbatim; the rest were rounded (pyrazinamide 9.6 → 10),
  midpointed out of a printed range (fluconazole "31 to 37 hours" → 34), averaged
  across two study arms (rivaroxaban "10.6 vs 10.8" → 10.7), or taken from the
  wrong analyte — carisoprodol's 8 h is its metabolite meprobamate's figure,
  about 4× the parent's.
- **Digit collisions are the dangerous failure mode.** Several trios were not
  pure defaults: the cited abstract genuinely contains the numeral, attached to a
  different quantity. quinapril's ka 1.4 is quinaprilat's median tmax in hours;
  baclofen's 1.5 is a median tmax; rivaroxaban's 1.5 and 0.80 are a median tmax
  and a factor-Xa effect ratio. These survive a spot-check against the citation
  and only fall to a value-by-value read.
- **Apparent volumes must not be paired with an independent bioavailability.**
  Several replacement volumes are V/F from oral studies, so F is already inside
  them; those records now pin `F: 1` and record the measured figure in prose.
  Pairing them would divide the dose by F twice. Records fixed this way:
  quinapril, rivaroxaban, baclofen, fluconazole.
- **Two mis-routed citations and one misfiled reference were found incidentally.**
  rifampin's and linezolid's whole IV blocks cited oral-only studies, and
  rivaroxaban carried a warfarin review that never mentions the drug. linezolid's
  IV route moved to a study that actually ran an IV arm; rifampin's was removed.

**The mineral audit is now complete** (2026-09-06, third pass,
[2026-09-06-mineral-pk-audit.ts](../../../scripts/authoring/2026-09-06-mineral-pk-audit.ts)).
Ten more salt records were checked against their cited abstracts; nine lost their
PK and two kept it. Full trails in [AUTHORING_GAPS.md](./AUTHORING_GAPS.md).

| Record(s) | Outcome |
|---|---|
| `magnesium`, `-citrate`, `-malate`, `-taurate`, `-glycinate` | `pk_unauthored: homeostatic`. Four shared one narrative-review citation containing no numeral; the fifth's paper contradicts its stored F and is an ileal-resection cohort. The stored V 1050 L was 20–75× the entire published human range. |
| `zinc-acetate`, `-citrate`, `-gluconate` | `pk_unauthored: homeostatic`, completing the family — `zinc` and `zinc-picolinate` were done in the previous pass, leaving three records drawing curves off the same template. |
| `boron` | **Keeps its curve.** Elimination is genuinely first-order and renal; only the citation and three parameters were wrong. Half-life 21 h re-pointed from a review to the primary. |
| `lithium` | **Keeps its curve.** Whole route re-sourced to a single-dose study matching the record's own typical dose; half-life 24 → 15.34 h, V 50 → 43.4 L. |

Homeostatic records now total 14 across the calcium, magnesium and zinc families
plus glucose and fructose.

### Still open from this pass

- **A parenteral magnesium record.** Genuine one-compartment MgSO4 PK exists at
  gram doses in preeclampsia and cardiac surgery (V 32.3 L, t½ 5.2 h,
  PMID:11568783, and four more in AUTHORING_GAPS). It was deliberately not
  grafted onto the supplement record — different exposure, different population
  — but a clearly-labelled `magnesium-sulfate (parenteral)` record would be
  legitimate if the app ever models IV magnesium.
- **Fractional absorption has no schema field.** Every human mineral number is a
  gut tracer quantity (61.3% zinc citrate, 0.26 calcium, 13–60% magnesium), and
  the registry has nowhere to put it except `F`, which means something else. That
  substitution produced several of the values this pass removed. Adding the
  distinction would prevent the whole error class rather than correcting rows one
  at a time — the highest-leverage fix left on the mineral side.
- **`lithium.mw_g_mol` is 6.94, elemental lithium, while its doses are lithium
  carbonate** (300–1800 mg; Li₂CO₃ is 73.89 g/mol and only ~18.8% lithium by
  mass). Any molar conversion would overstate the dose ~5.3×. Currently inert —
  `mw_g_mol` is consumed only for kinetic-interaction perpetrator conversions and
  lithium has no edges and no occupancy rows — so this is logged rather than
  changed, since fixing it is an identity decision (is the record the element or
  the salt?) and not a data repair.
- **The 7 `pk.template-quartet` groups above** are still unverified.
**Open:** the same audit has not been run on the rest of the catalog. Candidates
with the quartet shape and a single non-PK citation include `magnesium` (V
1050 L), `magnesium-citrate`, `magnesium-glycinate`, `boron` and `lithium` —
though lithium is a dosed drug with real PK literature and will likely keep its
curve. A `pk.template-quartet` lint heuristic (flag a four-field PK block whose
`source_pmid` resolves to a paper with no PK in its abstract) would surface the
rest mechanically; it needs the abstract corpus that `registry:verify` already
fetches, so the two could share a cache.

## 9. The pharmacological sweep — what two batches of 40 taught (2026-09-06)

§8's quartet rule found template-filled blocks by looking for repetition. The
pharmacological sweep looked instead at every value in a cited abstract, for 81
compounds across two batches. The result is that **repetition was never the
main problem**: a stored number was far more likely to be a real numeral from
the right paper, attached to the wrong quantity.

### The taxonomy, as it now stands

Eleven classes, in descending frequency:

1. **Real PMID, zero content.** A genuine, correctly-attributed, on-topic paper whose abstract states none of the values hung on it. **19 cases** and the single largest class. `registry:verify` passes these by construction — it resolves identifiers, not claims.
2. **Digit collision.** The abstract contains the numeral, attached to something else: a Tmax in hours reused as a rate per hour, a **standard deviation** read as a mean (`irbesartan`), a **protein-binding percentage** read as a bioavailability (`terazosin`, `tiagabine`), a **21-day washout** read as a half-life (`topiramate`), a detection-limit statement read as a half-life (`valacyclovir`). Batch 5 added two shapes that are not collisions with *another quantity* but with **another record**: `empagliflozin`'s F 0.78 is **dapagliflozin's** bioavailability — a value belonging to a different molecule in the same class (screened across seven congeneric families; it is the only case) — and `temazepam` entered **one source number into two different fields**, its F 0.96 being the volume in L/kg from the same paper.
3. **Route mismatch.** A row filed under a paper that never used that route — 18 found, almost always an IV row hung on an oral-only study.
4. **Range midpoint stored as a measurement.** A value no one measured, and sometimes of a quantity that is not scalar at all (`nicardipine`'s bioavailability is explicitly non-linear in dose).
5. **Wrong analyte.** Prodrug versus active species: `ganciclovir`/`valganciclovir`, `famciclovir`/penciclovir, `valacyclovir`/acyclovir, `azathioprine`/6-mercaptopurine, `simvastatin`'s acid.
6. **Apparent volume paired with an independent F**, which divides the dose by F twice.
7. **Depot versus immediate-release.** `granisetron`'s transdermal half-life was a subcutaneous poly(orthoester) depot value; `olanzapine`'s IM row carried an oral figure against a ~30-day depot.
8. **Matrix artefact** (named in batch 3, three instances). A plasma-referenced volume stored for a drug whose reference matrix is something else — `cyclosporine` (whole blood, 4.0 vs a true 2.88 L/kg), `acetazolamide` and `chlorthalidone` (both erythrocyte-bound). `tacrolimus` is the control showing the test discriminates: its volume sits inside the whole-blood range, so it was merely unsourced, not artefactual.
9. **Back-derived parameter** (named in batch 5, and the dominant `ka` defect by batch 6). Not measured and not mis-copied from anywhere — *computed from the record's other stored values* to make the curve peak where prose said it should. `rosuvastatin`'s ka 0.595 reproduces, against its own stored half-life, a time-to-peak of exactly 5.00 h, and 5 h is itself the upper endpoint of a stated 3–5 h range. This class is invisible to a citation check by construction, because there is no citation to check — the tell is arithmetic self-consistency with the *rest of the row*. Batch 6 found twelve, including all five of one group, four of which **disclose the derivation in their own notes**; and it dissolved a suspected cross-drug transplant, since `lurasidone` and `quetiapine` share `ka 2.02` but that rate reproduces each drug's *own* Tmax (2.00 h and 1.50 h), so it cannot have been copied between them.
10. **Effect compartment with the wrong sign** (named in batch 5). A `keo` cannot advance effect relative to plasma, only delay it, so a record whose effect *precedes* its Tmax has no representable value at any magnitude: `ranitidine` (gastric pH above 4 at 20–40 min vs a ~3 h plasma peak) and `loperamide` (effect within ~1 h vs a 5.2 h Tmax). Both indicate a target that is not seeing plasma concentrations at all. Batch 6 added `ropinirole` (its only human PK/PD model reports "three of five subjects whose prolactin concentrations nadired before ropinirole reached C_max"), `montelukast` and `vardenafil`.
11. **Dropped leading digit** (named in batch 6, one instance). `promethazine`'s V 970 L is 1970 with the first digit lost. Distinctive because the fix cannot be applied to the field alone: {970, 12 h} implies a clearance 18% below published and {1970, 12 h} implies 67% above — only the coherent {V, t½} pair works. A transcription slip rather than a reasoning error, and the only defence is the arithmetic cross-check against the source's own clearance.

### The structural finding

**Absorption rate is unsourced catalog-wide.** Across 70 audited routes carrying
a `ka_hr`, **not one was supported by its citation**, and only two genuine
published human values were located in the entire effort (`valganciclovir`
0.895 /h, `tiagabine` 1.25 /h) — neither matching what was stored. The cause is
structural rather than careless: papers report a **time to peak**, not a rate
constant, so there was usually nothing to cite and a plausible number appeared.

For several drugs a first-order rate is not merely uncited but **the wrong
model**: `ganciclovir`, `cefuroxime`, `nilotinib` and `penicillin-v` are modelled
with zero-order input in their own cited papers, and `gabapentin`'s absorption is
saturable. Every audited `ka` has been removed and left to `resolvePk`'s declared
default, which is at least visible as a default.

**390 non-IV route entries still carry a `ka_hr`.** On the evidence of 141 audits,
essentially none of them is citable as stored. That is the largest single block of
unsupported numbers left in the registry.

**Batch 3 changed the picture on what is available, though.** It located nine
genuine published human absorption rates against three in all prior batches
combined, including the first literal, named, numeric `ka` in the series
(naloxone, 1.52 /h intranasal). None matched what was stored; isoniazid's real
value is 2.8× the template default it replaced. Two structural lessons came with
them: **`ka` is formulation-specific, not a drug constant** — tramadol's
absorption half-life is 0.23, 0.34 and 0.38 h across three oral forms of the same
drug — and **nearly every published value is reported with a lag time this schema
cannot represent**, so storing a bare rate predicts onset too early. Several
verified rates were therefore still not stored.

### Deliberately not fixed here

- **`penciclovir` is not a slug**, though every `famciclovir` value describes it.
- **`valacyclovir` is a wrong-analyte hybrid** the schema cannot express — prodrug mass, metabolite yield, metabolite disposition.
- **`cefuroxime` holds two molecules** (axetil ester orally, sodium salt intravenously) under one free-acid molecular weight.
- **`dimenhydrinate` carries the salt's mass while its PK is diphenhydramine's** — the same missing salt-to-active conversion already logged for `lithium`. Molar work on that record is 1.84× wrong.

### Still open

**251 of 412 pharmacological compounds remain unaudited.**

A caution for whoever runs the next one: batch 2's triage topped out at 5 where
batch 1's reached 9, which read like the signal thinning out. It was not. Re-run
against the same signals for batch 3, five compounds scored 12 — a full
`{t½, ka, V, F}` quartet, a volume shared byte-identically across 11-15 unrelated
records, one citation covering both an IV and an oral row, and a lone reference,
all on the same record. **Triage scores are comparable only within a single run
of a single scorer.** Judge the remaining debt by the shapes, not by the number.

## 10. Two reversals from batch 4 — how to apply a class rule (2026-09-07)

The taxonomy in §9 is now good enough that it can be applied too fast. Batch 4
produced two claims that **reversed on inspection**, and both are worth carrying
forward as method, not just as data.

**A defect that lives in our own prose, not in a number.** `tacrine` stores
V 349 L beside F 0.17, which is the textbook shape of an apparent volume divided
by bioavailability twice. It is not: the volume was measured after an intravenous
dose, so it is a true V and the pairing is correct. What was wrong was the
registry's own `source_label`, which called it "apparent" — an annotation that
would have licensed a later editor to break a correct record. **Check what the
source measured before applying class 6; and audit our own wording, not only the
literature's.**

**A class generalisation that was right twice and wrong once.** The batch-4 prompt
asserted that sorafenib, tofacitinib *and* riociguat all lack an intravenous
formulation, so all three needed F pinned to 1. Riociguat has a real IV arm and a
measured 94% absolute bioavailability, and the agent said so. The two genuinely
unmeasurable ones were fixed; the third would have been damaged.

**Species labelling is necessary but not sufficient.** `dofetilide`'s kₑₒ was
correctly labelled as a beagle-dog value and verified exactly — right quote, right
arithmetic. It is still the wrong value for that record, because it was measured
under IV infusion while the record is oral-only, and in humans on the oral route
the concentration–effect relationship is **direct**, with no hysteresis at all.
Its stated precision (11 ± 8 min) is also a sixfold band stored as a point.
**An animal-derived value needs its route and its precision carried alongside its
species, plus a check that human data on the modelled route do not contradict it.**

**Deleting a kₑₒ can break a record.** Five effect-compartment values in batch 4
were unsupportable, but removing them outright made `data-lint`'s
`receptor.needs-keo` rule fire: those compounds carry `receptor_occupancy` rows
whose effect-site curve cannot be computed without one. The right repair is to
**demote to a declared approximation with the evidence stated**, not to delete.

**A third reversal, found in batch 5's triage (2026-09-07).** Batch 3 reported "a
warfarin review sitting in acetaminophen's reference list" as a non-substantiating
citation. It is not: PMID:15911722 is the `source_pmid` of acetaminophen's own
**warfarin interaction entry**, and it appears on 12 compounds for that reason.
The agent evaluated it as PK provenance, where it genuinely supports nothing —
but `refs` also carries interaction citations. **Before calling a reference
misfiled, check what it is being used for.** No data was damaged, because that
pass only added references and never removed any; the error was in the write-up.

That makes three reversals across two batches, all of the same shape: a rule
applied to the right object in the wrong context. The rules are good enough now
that the checking, not the pattern-matching, is the scarce step.

**A fourth reversal, and now a standing rule (2026-09-07).** Batch 5 flagged an
in-vitro COX-selectivity assay as a defective reference on two NSAIDs. It sits on
five, and on four of them it is the **cited source of their COX-1/COX-2
`receptor_occupancy` rows** — a correct citation, not a misfile. That is the
fourth time an agent has evaluated `refs` purely as PK provenance and condemned a
legitimate entry.

**`refs` serves three distinct purposes: PK provenance, `receptor_occupancy`
sources, and `interactions` citations. A reference that supports no PK value is
not thereby misfiled.** Any future audit prompt should say so explicitly, and any
proposed reference deletion should be checked against all three before it is
applied. None of the four was ever deleted, so no data has been damaged — but the
error rate on this one judgement is now high enough to be worth designing out.

## 11. Occupancy curves on records whose target never sees plasma (2026-09-07)

Found by computing, not by inspection. `loperamide`'s stored EC50 (0.001431 mg/L)
against its therapeutic Cmax (~0.00118 mg/L) made the shipped model report
**45.2% mu-opioid occupancy at an ordinary 8 mg dose** — a gut-restricted
antidiarrhoeal presented to the user as a centrally-active opioid. Fixed in
batch 5 by moving the record to `pk_unauthored: local-acting`, which removes the
curve.

The general shape: a `receptor_occupancy` row is only meaningful if the target
compartment is in equilibrium with plasma. Two populations where it usually is not,
re-screened after batch 5:

- **6 `local-acting` compounds still carry occupancy rows** — `beta-caryophyllene`, `brimonidine`, `dorzolamide`, `loperamide`, `tiotropium`, `triamcinolone`. All six now also have no solvable PK, so the curves render as zero rather than wrongly; they show up in the `pd.needs-solvable-pk` warning set. Keeping the affinity data is right (the Ki values are real); what is missing is a way to say *the target is not plasma-coupled* rather than *the PK is unknown*.
- **5 compounds with a non-IV F ≤ 0.10 carry occupancy rows** — `buspirone` (0.04), `desmopressin` (0.08), `dronabinol` (0.06), `progesterone` (0.09), `ramelteon` (0.018). These are not necessarily wrong: heavy first-pass extraction is compatible with a plasma-coupled target. But each pairs a large apparent volume with a small F, so **the occupancy number is the most sensitive consumer of exactly the class-6 double-count**, and any error in F propagates straight to a user-facing percentage.

Not fixed here. The durable fix is a schema field distinguishing a
**plasma-coupled** target from a local one, so occupancy can be suppressed by
declaration rather than as a side effect of having no PK.

## 12. The occupancy model has no free-fraction term (2026-09-07) — P1

**This subsumes §11.** Loperamide was one instance of a systematic bias, not the
whole problem.

### The measurement

Running the registry's own one-compartment Bateman at each record's own
`doses.typical`, then its own Hill function against its own `ec50_mg_l`:

| population | computable rows | ≥90% occupancy | ≥60% | <1% |
|---|---|---|---|---|
| all | 283 | 157 (55%) | 60 (21%) | 7 (2%) |
| **pharmacological** | **213** | **113 (53%)** | **47 (22%)** | 5 (2%) |
| biologic | 13 | 13 (100%) | 0 | 0 |

The biologics saturating is **correct** — monoclonals are dosed to saturate their
target by design, and that split is the control showing the test discriminates.
The small-molecule number is the anomaly: **75% of pharmacological occupancy rows
report ≥60% occupancy at an ordinary dose.** That is not a distribution of
pharmacology.

### The mechanism, verified in the code rather than inferred

- `receptorSite` (`packages/registry/src/loader.ts:101`) carries `receptor`, `pathway`, `emax`, `ec50_mg_l`, `hill_n`, `action`, `source_pmid`, `note`. **No protein-binding field.**
- The compound schema has no `fraction_unbound` either.
- `hillOccupancyAt(ce_mg_l, site)` (`packages/solver/src/hill.ts:24`) compares the effect-site concentration, derived from the **total** plasma curve, directly against `ec50_mg_l`.
- Almost every stored `ec50_mg_l` is, by its own note, an **in-vitro binding Ki in nM** — a *free*-drug affinity — converted by `Ki_nM × mw / 1e6`.

Comparing a free-drug Ki against a total plasma concentration overstates occupancy
by roughly 1/fu. Most of the affected records are 90–99% protein bound.

The only place plasma binding appears anywhere in the model is
`plasma_binding_displacement` on an **interaction edge**
(`packages/core/src/types.ts`) — a perturbation term with no baseline to perturb.

### Three independent confirmations, one of them measured in humans

1. **`buspirone`** — the model reports **30–39%** 5-HT1A occupancy at a therapeutic dose. Human PET measured *"5+/-17%"*, and those authors concluded buspirone *"is already clinically effective at low levels of 5-HT1A receptor occupancy"*. A rat in-vivo occupancy titration agrees: EC50 *"0.38 +/- 0.06 microM"* in dorsal raphe = 0.1465 mg/L, **25× the stored in-vitro Ki**. (Batch 6 replaced this row with the in-vivo value.)
2. **`duloxetine`** — stored SERT `ec50` 0.000238 mg/L against a published **in-vivo** figure from the same literature: *"The ED50 value of 5-HTT occupancy was 7.9 mg for dose and 3.7 ng/ml for plasma concentration"* = 0.0037 mg/L, **15× higher**.
3. **`mirtazapine`** — a 30 mg dose gives plasma ~0.05–0.06 mg/L; the stored ec50 predicts ~97% 5-HT2A occupancy against a human PET measurement of **60%**. Matching 60% needs ~140 nM, close to the cited paper's own full-text 158 nM.

### Why this is a schema problem, not a row problem

Same shape as the already-logged fractional-absorption gap: the error class is
designed in, so correcting rows does not fix it — and a corrected row is then
inconsistent with the 200-odd that were not. Two options, not mutually exclusive:

- **Add a fraction-unbound field** to the compound (it is a published, single-valued, well-tabulated property) and divide `ce` by it before the Hill call. This keeps in-vitro Ki values usable, which matters because that is what most of the literature publishes.
- **Distinguish the quantity in the field itself** — an in-vitro binding Ki and an in-vivo plasma EC50 are different measurements, and duloxetine's case shows the latter is publishable and sometimes published. A `basis: 'in_vitro_ki' | 'in_vivo_plasma_ec50'` discriminator would at least stop the two being silently interchanged.

Until one exists, **every occupancy percentage the app renders for a
protein-bound small molecule is biased high, in one direction, by roughly the
free fraction.**

### Related, and cheap
130 `doses` rows carry no `unit`. Consumers default to `mg`, and I checked every
row where that would be wrong (typical dose < 1 or > 3000): all seven are
genuinely mg — cerivastatin 0.4, epinephrine 0.3, ethanol 14000, melatonin 0.5,
mibolerone 0.2, salvinorin-a 0.5. Benign today; make `unit` required, or default
it explicitly at authoring time.
