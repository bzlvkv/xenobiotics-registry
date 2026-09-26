# Hygiene — what is worth adding, and what gets rejected

This is the file to read before you touch the data. Part 1 says what earns a row. Part 2 is the
rejection rules, each with the defect that produced it. The [smells checklist](#smells--run-your-own-batch-against-this-before-validating)
at the end is what you run your own batch against before `pnpm validate`.

Every count below is labelled with where it came from: **audit** means the 2026-06-28 data-quality
audit of 1,592 value-citation pairs, **sweep** means the 2026-09-06/07/08 pharmacological and
schema sweeps, and **live** means measured from
[`../data/compounds.json`](../data/compounds.json) on 2026-09-26. Most sweep figures are in
[`../data/GAPS.md`](../data/GAPS.md); a few survive only in the audit and backlog documents the
redesign removed, which `git show feb7677 -- packages/registry/data/` recovers in full. A **live**
number you can recompute; an **audit** or **sweep** number is a record of what a pass found, and
re-running the pass is the only way to refresh it.

---

# Part 1 — What earns a row

## The principle

**A small authored set with full provenance is worth more than a large one without.** The
registry's moat is not its size; it is that every number in it can be traced. Breadth that lands
as unverifiable rows does not add coverage, it adds a liability that later passes have to strip —
and stripping is expensive: the 2026-09 sweeps removed hundreds of numbers, and the records that
survived best were the ones that had said "I do not know" in the first place.

The definition of done is **no unvisited cells, not every cell filled**. A cell with an honest
`pk_unauthored` reason and a GAPS row is finished. A cell with a plausible number and a citation
that does not state it is unfinished *and* actively wrong. Live: 626 compounds with authored PK,
618 with a declared reason, 0 with neither. That zero is the number to protect.

## What a compound has to clear to be added

Check in this order. Stop at the first failure.

| # | Gate | Why |
| --- | --- | --- |
| 1 | **Is it already here?** Search `slug`, `name`, `aliases[]` **and** `retired_slugs[]`. | 33 duplicate identities were shipped before `compound.identity-collision` existed (sweep); 12 were merged away. A "new" compound under a trade name, an international name (`albuterol`/`salbutamol`), a stereochemical prefix (`l-tyrosine`/`tyrosine`) or a transliteration (`epithalon`/`epitalon`) is not new. |
| 2 | **Does a human exposure exist at all?** | If the only PK in the literature is murine, or the only paper is a prodrug built *because* the parent's exposure is inadequate, the record can exist as `pk_unauthored: research-only` but will not get a curve. 7,8-dihydroxyflavone is the worked case (GAPS, 2026-09-18). |
| 3 | **Is it one molecule?** | A multi-constituent botanical needs the `composition[]` treatment, not a single curve — *Polygala tenuifolia* and *Cistanche* were skipped on exactly that ground. A polydisperse polymer has no MW: pentosan polysulfate stores none on purpose. |
| 4 | **Will it land as more than a bare stub?** | A stub is mechanism + MW + doses + systems + aliases and no PK. Stubs are legitimate — `pk_unauthored` makes them honest — but a batch of nothing but stubs buys little. The 2026-09-18 nootropic sweep added 9 of 26 candidates and wrote the other 17 into GAPS with what each one is missing. |
| 5 | **Is anyone going to look at it?** | Indexed literature volume is the cheapest proxy: amantadine (8,825 PubMed hits, real cognitive/TBI use) was the strongest omission in that sweep; piribedil returned **0 hits** for `piribedil+pharmacokinetics` and stayed out. |

**Worth catalog space**, in rough priority: prescribed drugs that are CYP perpetrators or victims
(they make interaction edges possible); compounds that complete a target already carrying
authored occupancy rows, because same-target precedent means the model already fits; compounds
that close a hand-authored pathway's modulator list; widely-self-administered supplements and
grey-market peptides, where nothing else published is honest about provenance; and compounds with
a clean single-target GPCR or reversible-enzyme mechanism, which is what the Hill model can carry.

**Noise**, and why: a drug whose mechanism the model cannot express (voltage-dependent block,
genomic nuclear-receptor action, a pure antagonist where the occupancy rows are agonist
Emax/EC50); a withdrawn compound with no reference value (pemoline); a vendor-named "peptide" with
no verifiable structure (adamax stores no mass at all, because a stored mass would lend it a
precision nothing supports); and any compound whose entire literature is a single non-indexed
vendor claim.

## What a minimum honest record is

| Entity | Minimum |
| --- | --- |
| **Compound** | `slug`, `name`, `category`, `mechanism`, `routes[]` (≥1), `doses` for at least the primary route with an explicit `unit`, `systems[]` (**error** if empty: `systems.tagged`), and either authored `pk` for a route or `pk_unauthored: {reason, note}`. `refs: []` is acceptable; a fabricated ref is not. |
| **Compound with PK** | Per route: something an elimination rate can be computed from — `half_life_hr[route]`, `ke_hr`, or MM params (`pk.elimination` is an **error** otherwise) — plus `source_pmid` or `source_label` (`pk.pmid`). |
| **Compound with occupancy** | `effect_compartment.keo_per_h` (`receptor.needs-keo`, **error**), a `source_pmid` per row (`receptor.pmid`, **error**), a canonical receptor key (`receptor.alias`), and `fraction_unbound` or an `fu_note` saying why not (`pd.occupancy-needs-fu`). |
| **Pathway** | `slug`, `name`, `category`, `systems[]`, `description`, ordered `steps[]` with `from`/`to`/`via`/`note`. Every `from_slug`/`to_slug`/`via_slug` you assert must resolve (`pathway.step-from-slug`, `pathway.step-to-slug`, `pathway.via-slug`, all **errors**) — so assert one only when you mean it. Free-text endpoints are the norm: most pathway endpoints are processes and states, not molecules. |
| **Pathway modulator** | `slug` (must be a live compound: `pathway.modulator-slug`, **error**), `effect` (`inhibitor`/`activator`/`substrate`/`cofactor`), `target`. A `step` index must be in range (`pathway.modulator-step`). |
| **Receptor target** | [`../data/receptors.json`](../data/receptors.json) has two halves with different rules. `receptors[]` is GPCR nomenclature fetched from IUPHAR/BPS (version 2026.3) by `pnpm receptors:fetch`: never hand-edit it, because the next fetch overwrites it. `nonGpcrTargets[]` is hand-curated and preserved byte-for-byte across fetches, and it is the only place to catalog an enzyme, transporter, ion channel, nuclear receptor or immune target. A new entry there needs `key`, `name`, `family`, `gene`, `full_name`, `class` and the real GtoPdb `gtp_id` (0 only when the Guide has none). No per-row PMID in either half, by design: it is nomenclature. Occupancy rows use shorthand (`5-HT2A`) while `receptors[]` is keyed by gene (`HTR2A`); `OCCUPANCY_TARGET_KEYS` in `packages/registry/src/lint.ts` bridges the two, so a new GPCR shorthand key needs a line there, checked against the catalog entry's `name`. Live: 2 of the 92 distinct `receptor_occupancy[].receptor` keys resolve to nothing, the class-level `alpha_1` and `muscarinic`. `receptor.unknown-target` **W** names them and `pnpm report` counts them as `targets.occupancyKeysUnknown`. Pin a class-level row to one subtype only when the cited value measured that subtype. |

---

# Part 2 — What gets rejected

Each rule: the rule, why it exists, what it looked like when it shipped, and how it is caught now.
"Only a human reading the abstract" means no rule can catch it — that is the point of saying so.

## R1. Never fabricate a citation. Fetch, do not recall.

**Why.** A model trained on biomedical literature produces plausible PMIDs on demand. The
identifier looks right, the topic looks right, and nothing downstream objects.

**Shipped.** In a 2026-09-08 batch, four PMIDs in the first draft were inferred from context
rather than read — etanercept, dulaglutide, secukinumab and perampanel were all attached to the
wrong papers. The real ids, extracted from the fetched abstracts, were 15831771, 34787823,
28273356 and 36746851 (sweep).

**Caught by.** `pnpm verify` resolves every identifier against NCBI ESummary; a dead id fails.
The loader enforces the `PMID:\d+` shape and throws before any rule runs. Neither catches a *live* id
on the wrong paper — that needs R2.

## R2. A resolving PMID is not a warrant. The abstract must state the value verbatim, for the named compound.

**Why.** This is the single largest defect class the dataset has ever had, and the gate passes it
by construction: `pnpm verify` resolves identifiers, not claims.

**The numbers.** Of 1,592 authored value-citation pairs, **47% (752) were verbatim-confirmed** and
**216 were confirmed problems** after adversarial re-check (256 raw flags → 216 confirmed, 40
cleared). By type: **secondary_citation 84, abstract_silent 65, mismatch 47, wrong_compound 15**.
By layer: pk 136, occupancy 62, keo 10, interaction 3. The keo layer was worst at 23%
verbatim-confirmed (51 of 226). 1,148 unique PMIDs were read; **0 were dead** (audit). A later
sweep named **"real PMID, zero content" as 19 cases and the largest single class** in its own
batch (sweep).

**Shipped — abstract-silent.** A cardiovascular *outcomes* trial cited for PK it does not contain:
`evolocumab.pk.SC` → FOURIER; `fenofibrate.pk.PO` → FIELD; `bempedoic-acid.pk.PO` → CLEAR
Outcomes; `teriparatide.pk.SC` → the Neer NEJM fracture-efficacy trial, which carries no
half-life, no V, no F, no ka. `ixekizumab`'s occupancy note asserted an "abstract verbatim" KD of
1.8 pM where the abstract says only "high affinity", qualitatively.

**Shipped — secondary citation.** The value is real and often verbatim, but the compound is only a
comparator in someone else's discovery paper: `bicalutamide`'s 159 nM Ki came from a figure legend
in the **enzalutamide** discovery paper; `zolmitriptan`'s from a binding study of **eletriptan**;
`tiotropium`'s M3 Ki 0.050 nM from an **aclidinium** paper that never mentions tiotropium;
`piperine`'s PK from a study whose analyte is **curcumin**. The whole SSRI transporter block
(`fluoxetine`, `fluvoxamine`, `sertraline`) traced to a **paroxetine review's Table 1**.

**Caught by.** `pnpm verify:quotes`, where the note quotes the sentence it took the value from:
that quote is a falsifiable claim about a named document, and the gate fetches the document and
decides it. 19 of 228 quotes fail today. It cannot judge a note that quotes nothing, which is
where the rest of this class lives. Otherwise: only a human — or an agent — reading the abstract.
There cannot be a general offline rule for this: the defect is a mismatch between a paper's text and a stored number, and the text is
not in the repo. One subclass IS mechanical, because it confesses: `receptor.secondary-source`
(**warning**) reports the 33 occupancy rows whose own note credits the IUPHAR/GtoPdb ligand page for
the affinity while the `source_pmid` names the paper that database attributes it to. That is the
shape `pnpm verify` is documented as unable to see — the id resolves, the paper is on topic, and
nobody in the chain opened it.

## R3. No range midpoint, no paraphrase, no cross-paper average.

**Why.** A midpoint is a number nobody measured, and for some quantities it is not even scalar —
`nicardipine`'s bioavailability is explicitly non-linear in dose.

**Shipped.** `sotalol`'s V 126 L was "the EXACT MIDPOINT of a review" range. `fluconazole`'s
half-life was midpointed out of a printed "31 to 37 hours". `rivaroxaban`'s was averaged across
two study arms ("10.6 vs 10.8" → 10.7). `pyrazinamide`'s 9.6 was rounded to 10. `ondansetron`'s
5-HT3A 10 nM was a consensus midpoint. `triazolam`'s V 77 L was **the study subjects' mean body
weight of 77 kg** (sweep).

**When the source states a RANGE.** A range is not a value, but it is not nothing either. Three
outcomes are legitimate, in this order.

1. **An endpoint, disclosed.** Store one endpoint, never the interior, and say in the note that it
   is an endpoint of a stated range and which one. Choose the endpoint that UNDER-corrects, so the
   record errs toward the default rather than past it: the higher `fraction_unbound` (less free-drug
   correction), the shorter half-life, the smaller volume. 18 records already follow this and say
   "stored at its under-correcting endpoint" in the note.
2. **A declared derivation (R4)**, when another verbatim value in the same paper pins the quantity —
   a clearance and a half-life jointly fix a volume, and that arithmetic beats any endpoint.
3. **A skip (R7)**, when the range spans a decision: two endpoints that imply different
   pharmacology, or a spread wide enough that either end misleads. The GAPS row says "range, not a
   point value" and gives both ends.

Never the midpoint, the geometric mean, or the mean of two arms. If a batch wants one of those, it
wants outcome 2 and has not done the arithmetic yet.

**The one place this rule was suspended, and the debt it left.** A 2026-05-26 wave adopted a written
policy of storing the geometric mean of a multi-paper GtoPdb pKi range under a "representative"
primary PMID. That policy is superseded and must not be applied. The 28 occupancy rows it produced
were unwound on 2026-09-26 — 14 re-sourced to a single verbatim constant, 3 to the product label, 1
stored at a disclosed range endpoint, and **9 removed outright** because no source states them —
so `receptor.derived-value` reports 0 today. Keep it that way: a row is closed by a single-valued
affinity from a paper someone fetched, or by removing the row and writing the GAPS entry. The trail
for all nine removals, and the full-text routes that would reopen them, is at the end of
[`../data/GAPS.md`](../data/GAPS.md).

**Caught by.** `receptor.derived-value` (**warning**) on the occupancy rows, where the practice was
systematic and the notes say so in their own words — but it is a prose rule, so see R16, and it
only knows what a note admits. Everywhere else: reading. `pk.defaulted-volume` becomes visible
*after* you remove such a value, which is the point of removing it.

## R4. A declared derivation is allowed. A guess is not. The difference is written on the record.

**Why.** Papers report a Tmax, not a rate constant; a clearance, not a volume. Refusing all
arithmetic would leave whole classes uncurvable. What makes arithmetic honest is disclosure.

**A declared derivation states, on the record:** the inputs, the arithmetic, and the source of
each input. Example, `cagrilintide.pk.SC.ka_hr = 0.1525` — "a back-derivation, DISCLOSED on the
record. It reproduces the verbatim lower-endpoint *median tmax of 24-72 h* against that
half-life. Authored rather than omitted because the 1.0 /h default puts the peak of a once-weekly
peptide at 5.4 h, 4-13× early."

**Shipped as a guess.** `rosuvastatin`'s `ka` 0.595 reproduces, against its own stored half-life,
a time-to-peak of exactly 5.00 h — and 5 h is the upper endpoint of a stated 3-5 h range. This
class is invisible to a citation check by construction, because there is no citation to check; the
tell is arithmetic self-consistency with the rest of the row. A 2026-09-07 batch found twelve, and
**four of them disclosed the derivation in their own notes** — those four were fine (sweep).

**Caught by.** Nothing mechanical. Disclose it or do not author it.

## R5. Deleting an unsupported value does not silence the record. It makes it assert the default.

**Why.** The consumer fills a missing field: `F` 0.9, `V` 0.5 L/kg (**35 L** at the 70 kg
reference; 0.08 L/kg = 5.6 L for proteins at MW ≥ 10 kDa), `ka` 1.0 /h. A deleted number is
replaced by an unsourced one that no surface labels.

**Shipped.** The 2026-09-06 peptide audit removed `retatrutide`'s `ka_hr: 0.02`; its curve moved
from peaking at ~4 days to ~5 h, and the regression was reported from the app (sweep).

**So the honest options are exactly three:** a verbatim value; a declared derivation (R4); or an
explicit `pk_unauthored: {reason, note}` — `local-acting`, `research-only`, `mixture`,
`homeostatic`, `uncharacterized`, `label-only`. Never a silent deletion.

**Caught by.** `pk.defaulted-volume` (per-compound where occupancy consumes the concentration;
catalog-level for the rest), `pk.defaulted-params` (the F and ka totals), `pk.defaulted-ka-slow`
(no `ka` on a route whose half-life is ≥ 48 h, where the 1.0 /h default is wrong in kind rather
than by a margin). Treat all three as **standing caveats, not task lists** — every record
`pk.defaulted-volume` currently names has already been audited, and the volume is absent
*because* of that audit. The count rising is the audit working.

**Direction of the error, measured.** Of 615 authored `V_L` rows, **73% exceed 35 L and the median
is 88 L — 2.5× the default** (live) — so a defaulted small molecule understates volume, overstates Cp and
**biases occupancy high**. For proteins ≥ 10 kDa all 18 authored volumes fall *below* 35 L. For
mid-size peptides (3-10 kDa) the six authored volumes span 7.7-200 L with 35 L inside the spread,
so the direction is genuinely unknown and claiming one would be false precision (sweep).

## R6. The inverse trap: a stored value that IS the default, wearing a citation.

**Why.** More insidious than R5, because the number carries a `source_pmid` and reads on every
surface as though someone measured it.

**Shipped.** 29 route rows across 24 records stored **`V_L: 35`, the solver's own default. Every
one carried a `source_pmid`.** All 22 citations were fetched: **four state a volume at all, and
none states 35 L.** `pramiracetam`'s own cited range was 1.82-2.94 L/kg = 127-206 L, so the stored
value was 4-6× below the bottom of its own citation. `pregabalin` and `melatonin` were the default
wearing a citation outright (sweep). Separately, `ka` 1.0 /h appeared across dozens of unrelated
compounds for the same reason.

**Caught by.** `pk.template-quartet` (an identical `{ka, V, F}` trio across unrelated identities
under different citations) and `pk.template-ka` (one `ka` shared by ≥ 5 unrelated identities under
≥ 5 citations, excluding 1.0 which *is* the default). A LONE stored default trips no rule, because
some drugs really do have those values — so `pnpm report` ends with **Stored values equal to a
default**, every row whose `V_L`, `F` or `ka` exactly equals one. That list is a reading list, not a
defect list. Removing a stored default is numerically a
no-op — verified by resolving every affected row before and after: identical `V_L`, `F`, `ka_hr`
and `ke_hr` on all 23 rows, 0 differing. What changes is that the record stops claiming a
measurement.

## R7. A skip is a deliverable.

**Why.** A skipped cell with a trail is finished work. Without the trail the next pass re-runs the
same dead-end searches, which is the most expensive thing an agent can do here.

**The row.** Append to [`../data/GAPS.md`](../data/GAPS.md): the compound and field, the PMIDs
chased with why each was rejected, and what would unlock it (usually full text, sometimes a study
that does not exist). See the file's own header for the format.

**Shipped well.** `enclomiphene` — "Ghobadi 2009 (PMID:19033451) explicitly: t½ *could not be
determined due to a very flat terminal half-life*. 23875626, 25044085 = hormone data only. ~10 h
is full-text only." That row means nobody searches for it again.

**Caught by.** Nothing. This is discipline, and it is the difference between a registry and a pile.

## R8. Species labelling: an animal value is keepable, an unlabelled one is not.

**Why.** An unlabelled rat half-life renders exactly like a human one. Live: only 3 of 788 route
entries and 13 of 249 effect compartments declare `source_species`, which is either correct or a
gap — do not add to it.

**Shipped.** `dextromethorphan`'s removed F 0.11 and V 300 L were the **canine** values of
PMID:15500572 — a species misattribution, not merely an uncited number. Three kₑₒ values read as
human until the 2026-09-08 pass declared them (sweep).

**Not sufficient on its own.** `dofetilide`'s kₑₒ was correctly labelled beagle-dog and verified
exactly — right quote, right arithmetic — and is still the wrong value for that record, because it
was measured under IV infusion while the record is oral-only, and in humans on the oral route the
concentration-effect relationship is direct with no hysteresis at all. Its stated precision
(11 ± 8 min) is also a sixfold band stored as a point. **An animal value needs its route and its
precision carried alongside its species, plus a check that human data on the modelled route do
not contradict it.**

**Caught by.** `pk.species-in-note` and `effect.species-in-note` — both prose-reading, so see R16.
`source_species` is an enum: rat, mouse, dog, pig, sheep, rabbit, monkey, horse, cow.

## R9. Steady-state values are not single-dose values.

**Why.** Dividing a dose by a steady-state Cmax gives a volume inflated by the accumulation ratio,
and the abstract usually does not print which it is.

**Shipped as a refusal.** `cagrilintide`'s abstract prints Cmax 6.14-170 nmol/L, so a V/F looks
one division away: 4.5 mg against 170 nmol/L gives 6.0 L. But the PK endpoints were "assessed from
day of last dose (week 19) to end of treatment (week 20)", after 16 weeks of escalation — these
are steady-state values. At a 159-195 h half-life on a weekly interval the accumulation ratio is
about 2, so the corrected volume is about 12 L, and the abstract does not print what would settle
it. **A 2× fork is not a measurement**, so no volume was authored (sweep). This generalises to
every once-weekly acylated peptide in the catalog: **check whether a published Cmax is single-dose
before dividing by it.**

**Also.** `tamoxifen`'s t½ 96 h is the single-dose value where 168 h is the steady-state terminal;
`enzalutamide`'s stored 130 h matches neither its single-dose 90.7 h nor its steady-state 5.8 days.

**Caught by.** Only reading the methods clause in the abstract.

## R10. Route, salt versus base, and analyte: name which molecule and which route the number describes.

**Route.** 18 route mismatches were found in one sweep, "almost always an IV row hung on an
oral-only study" — `rifampin`'s and `linezolid`'s whole IV blocks cited oral-only work. Depot
versus immediate-release is the same error by another name: `granisetron`'s transdermal half-life
was a subcutaneous poly(orthoester) depot value; `olanzapine`'s IM row carried an oral figure
against a ~30-day depot. And `ka` is **formulation-specific, not a drug constant** — tramadol's
absorption half-life is 0.23, 0.34 and 0.38 h across three oral forms of one drug.
*Caught by:* `pk.route-listed` (a `pk` route not in `routes[]`), `pk.unsolvable-route` and
`pk.unsolvable-default-route` (a declared route that yields no elimination rate, where `routes[0]`
is the route a consumer defaults to, so the commonest path through the record renders nothing).

**Salt versus base.** `lithium.mw_g_mol` is 6.94, elemental lithium, while its doses are lithium
carbonate (Li₂CO₃ 73.89 g/mol, ~18.8% lithium by mass) — any molar conversion overstates ~5.3×.
`dimenhydrinate` carries the salt's mass while its PK is diphenhydramine's: molar work on that
record is 1.84× wrong. `ghb`'s EC50 had to be re-derived at the free-acid MW 104.1 when the
surviving record dosed the acid, not the sodium salt.
*Caught by:* `dose.moiety-note` (a `dose_moiety_fraction` without the note recording the salt, the
analyte and the arithmetic), `dose.salt-moiety-unset` (prose says the dose is a salt while `pk[]`
describes the base and no fraction is set), and `pk.salt-disposition-drift` (**error** — a
counter-ion changes absorption `F` and `ka`, never the ion's distribution volume or half-life).

**Analyte.** Prodrug versus active species: `carisoprodol` stored its metabolite meprobamate's 8 h
against a parent ~2 h, about 4× off; `prednisone`'s whole block described prednisolone.
`enzalutamide` has **two co-equal analytes** — "AUC0-inf of enzalutamide plus M2 was 828 µg·h/mL
versus 368 for enzalutamide alone" — and a single curve cannot be both.
*Caught by:* `pk.prodrug-analyte-unstated` — prose-reading, so see R16. Set `pk_analyte` to
`parent`, `active-metabolite`, `active-moiety` or `total-drug-related`, plus `pk_analyte_name`.

## R11. Template-filled blocks and shared citations across unrelated records.

**Why.** Where a source genuinely carried a number, the authoring session derived it correctly and
often documented the derivation. Where it did not, **a plausible `{t½, ka, V, F}` quartet appeared
anyway.** `F` clustered at 0.25-0.30; `V` varied wildly (14, 25, 30, 35, 300, 560 L) with nothing
behind it.

**Shipped.** `pk.template-quartet` flagged **7 groups covering 15 compounds**. All seven were
audited and **the rule was right every time: not one shared trio was stated by any cited paper.**
Thirteen records were re-sourced; `tryptophan` and `tyrosine` moved to `pk_unauthored:
homeostatic`. Five of those 15 half-lives were verbatim; the rest were rounded, midpointed,
averaged, or the wrong analyte's (sweep).

**Digit collisions are the dangerous variant.** Several trios were not pure defaults — the cited
abstract genuinely contains the numeral, attached to a different quantity. `quinapril`'s ka 1.4 is
quinaprilat's median Tmax in hours; `baclofen`'s 1.5 is a median Tmax; `irbesartan` stored a
**standard deviation** as a mean; `terazosin` and `tiagabine` stored a **protein-binding
percentage** as a bioavailability; `topiramate` stored a **21-day washout** as a half-life;
`valacyclovir` stored a **detection-limit statement** as one. `empagliflozin`'s F 0.78 is
**dapagliflozin's**. `temazepam` entered one source number into two fields, its F 0.96 being the
volume in L/kg. `promethazine`'s V 970 L is 1970 with the leading digit lost — and that one cannot
be fixed field-by-field, because {970, 12 h} implies a clearance 18% below published and
{1970, 12 h} implies 67% above; only the coherent {V, t½} pair works. **These survive a
spot-check against the citation and fall only to a value-by-value read** (sweep).

**Caught by.** `pk.template-quartet`, `pk.template-ka`, and `pk.shared-source-conflict`
(**error** — two records that are the same molecule whose shared source cannot support both).

## R12. One molecule, one record.

**Why.** Slug uniqueness was never identity uniqueness. Two records could describe the same
molecule under different slugs, and nothing merged them at runtime: search returned both, each
side was authored independently, and the registry published two different half-lives for one
molecule — occasionally **citing the same paper for both**.

**Shipped.** 33 pairs, and **the class is now empty** — `compound.identity-collision` reports
nothing against the current data (live). Getting there took three different fixes for one warning,
and knowing which you are looking at is the whole skill (sweep, GAPS batches D1 and D2):

| What the warning meant | The fix |
| --- | --- |
| A record claimed an alias that is another record's identity: `calcium` claimed "Calcium carbonate", the three branched-chain amino acids each claimed "BCAA", `ldn` claimed "naltrexone". 17 of these. | **Remove the alias.** The salt beside its parent is legitimate; the parent CLAIMING the salt's name is not, because a search for one lands on the other. |
| The slug itself collided: `alanine` claims "Ala", `ribose-5-phosphate` claims "R5P". 2, deferred. | Slug-level surgery, not an alias edit. |
| Two records really were one molecule, each disagreeing with itself — one carried authored PK while the other declared `pk_unauthored`. 12 merged, plus 2 more in D2. | **Merge and retire**, after repairing the PK. |

So a salt/parent warning does NOT mean "believed legitimate, leave it": it means one of them is
wearing the other's name. Read the alias lists before assuming the pair is the problem.

**How retirement forwards a slug.** The survivor keeps the retired name in `retired_slugs[]`, and
`compoundIndex` resolves lookups through it, so an old reference still finds the record. Survivors
were chosen by **counting inbound references, not by which name reads better** — the counts
overrode the more natural-sounding name in four cases. Registry-internal references (pathway
steps, modulators, interaction edges) are rewritten to the canonical slug at merge time;
forwarding exists for external references alone. Before merging, **repair the PK first**: in both
of the two hardest pairs, each side published contradictory parameters while *neither* citation
supported its own numbers, so carrying either set across would have preserved a defect.

**Caught by.** `slug.unique` and `compound.retired-self` / `compound.retired-collision`
(**errors** — a tombstone must not shadow a live record or be claimed twice),
`compound.identity-collision` (**warning**), `pk.shared-source-conflict` (**error**).

## R13. An in-vitro Ki is a free-drug number. The plasma curve is total.

**Why.** Almost every stored `ec50_mg_l` is, by its own note, an in-vitro binding Ki in nM
converted as `Ki_nM × MW / 1e6` — a **free**-drug affinity. The Hill function compares it against
an effect-site concentration derived from the **total** plasma curve. That overstates occupancy by
roughly `1/fu`, and most affected records are 90-99% protein bound.

**Measured, then re-measured.** Running the registry's own one-compartment arithmetic at each
record's `doses.typical` against its own Hill function, the audit found **113 of 213 computable
pharmacological occupancy rows (53%) at ≥90% occupancy** (sweep) — not a distribution of
pharmacology. The `fraction_unbound` batches that followed cut it: the same computation today
reports **50 of 219 (23%)** (live; re-run it with `impliedExposure` from `@xeno/registry`, which
is what the compound page's implied-values card uses). The 13 biologics all saturating **is
correct** — monoclonals are dosed to saturate by design — and that split is the control showing
the test discriminates.

**Confirmed against humans.** `buspirone`: the model reported 30-39% 5-HT1A occupancy at a
therapeutic dose where human PET measured "5+/-17%". `duloxetine`: stored SERT ec50 0.000238 mg/L
against a published **in-vivo** 0.0037 mg/L, 15× higher. `mirtazapine`: predicted ~97% 5-HT2A
against a PET measurement of 60%.

**So.** Author `fraction_unbound` (0,1] with an `fu_note` carrying the verbatim quote, species and
population, and any concentration-dependence that makes the scalar an approximation — `linagliptin`
is 99% bound at 1 nmol/L and 75-89% above 30 nmol/L, with its therapeutic Cmax squarely inside
that transition, which is a reason **not** to author a scalar. Say so in `fu_note`; that is a
decision, not a gap. Set `basis` when the value is not an in-vitro Ki: `in_vivo_plasma_ec50` and
`whole_blood_ic50` are already referenced to total plasma and need no correction.

**Caught by.** `pd.occupancy-needs-fu` — scoped to non-biologics with a solvable route and at least
one `in_vitro_ki` row, and silenced by either a value or an `fu_note`.

## R14. Occupancy is meaningless if the target never sees plasma.

**Why.** A Hill row assumes the target compartment is in equilibrium with plasma.

**Shipped.** `loperamide`'s stored EC50 against its therapeutic Cmax made the shipped model report
**45.2% mu-opioid occupancy at an ordinary 8 mg dose** — a gut-restricted antidiarrhoeal presented
as a centrally-active opioid. Fixed by moving the record to `pk_unauthored: local-acting`, which
removes the curve. Six `local-acting` compounds still carry occupancy rows; keeping the affinity
data is right — the Ki values are real — what is missing is a way to say *the target is not
plasma-coupled* rather than *the PK is unknown* (sweep).

**Also.** A kₑₒ can only delay effect relative to plasma, never advance it. A record whose effect
*precedes* its Tmax has no representable value at any magnitude: `ranitidine` (gastric pH above 4
at 20-40 min against a ~3 h plasma peak), `loperamide`, `ropinirole`, `montelukast`, `vardenafil`.
Those indicate a target that is not seeing plasma concentrations at all.

**Caught by.** `receptor.needs-keo` (**error**), `pd.needs-solvable-pk` (**warning** — a standing
state, not a task list: all 12 records it names are correct deliberate strips, their affinity and
dose-response still render, and only the time-course half of the data is unavailable).
`interactions.inert-kinetics` is the same shape on the interaction side — six edges modulate a
victim `ke` that does not exist; the magnitudes are real and become live the moment the victim
gains PK, so they are flagged, not deleted.

## R15. Check what the record DOES, not only what it cites.

**Why.** Values individually correct can be jointly impossible, and no citation check sees it.

**The worked example.** `teriparatide` carried a verbatim `V/F` of 7.8 L beside a verbatim `CL/F`
of 62 L/h. Both quotes were right. Together they implied a **five-minute** half-life against the
hour the record stored. It now stores the volume its own clearance implies, which is the fix below. The prescribed handling when a full-text value does not cohere with what the
record already stores: **store the value the record's own stored clearance implies, and say so**
(FULLTEXT_QUEUE, 2026-09-08).

**The other three shapes.** An apparent volume must not be paired with an independent `F`, because
`V/F` already contains it and pairing divides the dose by F twice — `quinapril`, `rivaroxaban`,
`baclofen` and `fluconazole` now pin `F: 1` and record the measured figure in prose. A central
volume `Vc` is the wrong volume for a one-compartment model, and summing `Vc + Vp` is also wrong.
And a matrix artefact: a plasma-referenced volume stored for a drug whose reference matrix is
whole blood (`cyclosporine`, 4.0 against a true 2.88 L/kg) or erythrocytes (`acetazolamide`,
`chlorthalidone`). `tacrolimus` is the control showing the test discriminates — its volume sits
inside the whole-blood range, so it was merely unsourced, not artefactual.

**Caught by.** Arithmetic, which the tooling now does for you. Each compound page in `pnpm dev`
that has any PK carries a **What the stored values imply** card: one-compartment Cmax, Tmax, AUC
and clearance at the typical dose, computed by `impliedExposure` in
`packages/registry/src/exposure.ts`. An input the record does not store is badged **default** and
one computed from another field is marked **derived**; anything unmarked is stored as shown. Hold
Cmax, AUC and clearance against the paper before you commit, and treat a `default` badge on a value
you believe you authored as a missing or misspelled field. A route the card cannot resolve says so
and why. Call `impliedExposure` directly for the same numbers in a script.

## R16. When a prose-reading lint rule fires, suspect the RULE first.

**Why.** This catalog's prose is largely a **record of decisions**, so a rule that reads prose must
separate a decision's *subject* from its *outcome* — otherwise it reliably flags the
best-documented records, because a thorough note discusses the defect it does not have.

**Shipped.** Three rules independently grew the same bug. `pk.prodrug-analyte-unstated` fired on
`valsartan`'s note saying "**no** active metabolite (unlike losartan)" — matching the phrase its
own sentence negates — and on `aripiprazole`'s description of a **rejected** citation.
`effect.approx-in-note` fired on a note describing the estimate it had just been corrected **away
from**. `effect.species-in-note` fired on notes recording the animal study they **replaced**.
Fixed once with a shared `assertsOfThisRecord(sentence)` test applied per sentence: 119 → 115
warnings, **with no data touched for three of the four** (sweep).

**And three reversals of rule-application, all the same shape — a rule applied to the right object
in the wrong context.** `refs[]` serves **three** purposes: PK provenance, `receptor_occupancy`
sources, and `interactions` citations. An agent evaluated `refs` purely as PK provenance and
condemned a legitimate entry four separate times — a warfarin review on acetaminophen is that
record's own warfarin-interaction source, and a COX-selectivity assay on two NSAIDs is the cited
source of their COX-1/COX-2 occupancy rows. **A reference that supports no PK value is not thereby
misfiled.** Separately, `tacrine`'s V 349 L beside F 0.17 is the textbook shape of a double-divided
apparent volume and is correct — the volume was measured after an IV dose. What was wrong was the
registry's own `source_label` calling it "apparent".

**So.** Before you change data to silence a warning: read the whole note, check what the reference
is being used for, and check what the source measured. **Deleting sourced pharmacology to silence a
rendering claim that was untrue is the worst available move.** And a kₑₒ that is unsupportable
should be **demoted to a declared approximation with the evidence stated**, not deleted — deleting
five of them made `receptor.needs-keo` fire on records whose occupancy rows cannot be computed
without one.

## R17. Declare an estimate as an estimate.

**Why.** A kₑₒ is either fitted from a published PK/PD model (`source_pmid`) or an openly declared
estimate (`approximated: true` + a note giving the reasoning). The state that gets rejected is a
bare number, or worse, an estimate wearing a citation.

**Shipped.** Live: of 249 effect compartments, **53 are fitted and 196 are declared estimates**. A
2026-09-06 first pass flagged 34 uncited estimates; a second pass the same day found **160 more
whose `effect_compartment` cited a PMID while the note beside it said "Approximation; no published
kₑₒ"** — the PMID anchored the pharmacology (a PET time-course, an onset trial), not the number,
and the compound page rendered each as a fitted measurement. Those PMIDs moved to `refs[]`.

**Caught by.** `effect.pmid` (a kₑₒ with neither a source nor `approximated`),
`effect.approx-conflict` (**error** — both at once: a fitted value is not an estimate),
`effect.approx-note` (`approximated` without reasoning), `effect.approx-in-note` (a cited kₑₒ whose
own note admits it is an estimate — prose-reading, see R16).

## R18. A calibrated constant is not a measured one.

**Why.** `interactions[].kinetics.ki_uM` reads as a published Ki. **120 of the catalog's entries
were a clinical AUC fold-change inverted through an assumed perpetrator exposure**, which is a
legitimate quantity and a different one. Live: 76 of 161 kinetics blocks declare
`ki_basis: calibrated_from_auc`, 9 declare `in_vitro`.

**So.** Declare `ki_basis` and store the arithmetic: `ki_uM = assumed_perp_uM / (auc_ratio − 1)`.
Then the calibration is reconstructible and checkable.

**Caught by.** `interactions.ki-basis-unstated` (calibration inputs present but `ki_basis` is not
`calibrated_from_auc`), `interactions.ki-calibration-incomplete` (**error** — the basis is declared
but the inputs are missing), `interactions.ki-calibration-mismatch` (**error** — the stored
constant does not reproduce the declared fold-change within 2%), `interactions.kinetics-pmid`
(**error** — kinetics without a source), `interactions.ki-needs-mw` (**error** — the µM→mg/L
conversion needs the perpetrator's `mw_g_mol` or it silently skips),
`interactions.induction-positive`, `interactions.target-exists` (**error** — a kinetic edge to an
unknown slug cannot modulate anything).

## R19. Know which of your numbers are modelling defaults, and say so.

Not a defect, a limitation to state rather than hide. Live: `hill_n` is exactly 1 on **324 of 325**
occupancy rows and `emax` exactly 1 on 320, so **every occupancy curve in the catalog is a simple
hyperbola by assumption**. The one exception is `atracurium`'s `hill_n` 4.04, from a verbatim
sigmoidicity factor. Similarly, 71 occupancy rows saturate above 99% at the peak dose and most of
those are correct pharmacology — adalimumab against TNF, apixaban against factor Xa (sweep). Neither is a defect class; both belong in the note.

---

## Smells — run your own batch against this before validating

Ten checks, cheapest first. Each one has caught a shipped defect.

| # | Smell | Why it is a smell |
| --- | --- | --- |
| 1 | The value equals a consumer default: `V_L` 35 or 5.6, `F` 0.9, `ka` 1.0. | R6. 29 rows shipped `V_L: 35` with citations. |
| 2 | The same `{ka, V, F}` trio, or the same `ka`, appears on another compound in your batch. | R11. Seven groups, all confirmed template-filled. |
| 3 | `F` sits in 0.25-0.30 and `V` is a round number (25, 30, 35, 300). | R11. That is the shape of the invented quartet. |
| 4 | The numeral appears in the abstract but attached to a different quantity — a Tmax, an SD, a protein-binding %, a washout, a detection limit. | R11. Survives a spot-check; only a value-by-value read catches it. |
| 5 | The paper's *subject* is a different molecule, and yours is a comparator, a reference standard, or a parent scaffold. | R2. 84 confirmed secondary citations. |
| 6 | The paper is an outcomes trial, a review, a med-chem discovery paper, a bioequivalence study, or an assay-development paper. | R2. 65 confirmed abstract-silent. |
| 7 | The abstract quotes a range, and your number is inside it but not an endpoint. | R3. A range interior is not a measurement. |
| 8 | An apparent volume (`V/F`) sits beside an independently sourced `F`; or a `Vc` from a population fit sits in a one-compartment slot. | R15. Divides the dose by F twice. |
| 9 | The Cmax or AUC you divided by was measured at steady state, or in patients where your half-life is from healthy volunteers. | R9 and R15. Mixing populations is the defect the audit spends most of its time removing. |
| 10 | Open the record's **What the stored values imply** card. Does Tmax and Cmax match the paper? Is any input you meant to store marked `default`? Then set Cmax against each occupancy row's `ec50_mg_l`: Cmax at 10× EC50 is about 91% occupancy and at 100× is about 99%, so a ratio like that at an ordinary dose needs explaining. | R13 and R15. Before the fu correction 53% of pharmacological rows sat ≥90%; it is 23% now, so a saturated row is no longer the norm. |

Then, before `pnpm validate`:

- every new PMID fetched, not recalled, and quoted verbatim in the note (R1, R2);
- every animal value carries `source_species`, its route, and its precision (R8);
- every derivation states inputs, arithmetic and the source of each input (R4);
- every removal is replaced by a derivation or a `pk_unauthored` reason (R5);
- every skip has its GAPS row with the PMIDs chased (R7);
- every new compound checked against `slug`, `name`, `aliases[]` and `retired_slugs[]` (R12);
- every warning you are about to silence: rule checked before data (R16).

Next: [WORKFLOW.md](./WORKFLOW.md) for the batch loop, [FIELDS.md](./FIELDS.md) for the
field-by-field reference.
