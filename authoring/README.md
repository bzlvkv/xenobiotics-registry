# Authoring the registry

A row is worth having when a reader can get from the number back to the sentence that states it.
That is the whole product. Anyone can generate a thousand plausible half-lives; this registry is
worth something only because each of its numbers is traceable to a source that actually says it,
for the named molecule, on the named route, in a named species. A small authored set with full
provenance beats a large one without, and the fastest way to destroy the registry's value is to
add volume that nobody can check. Before you add anything, read
[HYGIENE.md](./HYGIENE.md) — it defines what earns a row and what gets rejected.

## What is here

| Path | What it holds |
| --- | --- |
| [`../data/compounds.json`](../data/compounds.json) | 1,244 compounds: identity, mechanism prose, routes, doses, PK per route, effect compartment, receptor occupancy, interaction edges, citations. |
| [`../data/pathways.json`](../data/pathways.json) | 230 pathways: ordered steps, compound modulators, Recon3D cross-references, one optional diagram overlay. |
| [`../data/receptors.json`](../data/receptors.json) | The target nomenclature: 381 non-olfactory GPCRs and 47 non-GPCR targets, from IUPHAR/BPS Guide to PHARMACOLOGY. Reference data — no per-row PMID by design. |
| [`../data/GAPS.md`](../data/GAPS.md) | The skip ledger. 5,700 lines of cells investigated and deliberately left empty, with the PMIDs already chased. **Read it before any literature pass.** |

Counts measured from the live data on 2026-09-26: 626 compounds carry authored PK, 618 carry an
explicit `pk_unauthored` reason, **0 carry neither**. 788 route entries, all 788 cited.
4,041 citation instances resolving to 2,601 unique PMIDs.

## The five commands

```
pnpm validate      # schema + loaders + lint rules. Seconds. Must be clean before you commit.
pnpm verify        # every cited PMID against NCBI ESummary. Minutes, network.
pnpm verify:quotes # every verbatim quote against the abstract it names. Seconds, network.
pnpm report        # the coverage report: what is authored, what is open, which keys are unknown.
pnpm dev           # the browser client — spot-check the records you touched.
```

## The rules, in the smallest complete form

1. **Never invent a citation.** Every `source_pmid` must resolve (`pnpm verify`) **and** the
   abstract must state the value verbatim for the named compound. Fetch the abstract; do not
   recall it. Where a note carries the sentence it quoted, `pnpm verify:quotes` now checks that
   sentence against that abstract — the only part of rule 2 a machine can decide. Four PMIDs in one 2026-09-08 batch draft were inferred from context and all four
   were wrong papers — live ids, wrong papers, which `pnpm verify` passes by construction.
2. **A resolving PMID is not a warrant.** A real, on-topic, correctly-attributed paper whose
   abstract states none of the values hung on it is the largest defect class this dataset has
   ever had: 84 secondary-citation plus 65 abstract-silent out of 216 confirmed problems
   (DATA_QUALITY_AUDIT, 2026-06-28). Only reading the abstract catches it.
3. **No paraphrase, no range midpoint, no cross-paper average.** "Ki values were in the µM
   range" is not a number. A declared derivation — inputs, arithmetic, and the source of each
   input, written on the record — is allowed and is a different thing from a guess.
4. **Deleting an unsupported value does not silence the record.** It makes the record assert the
   consumer default: `F` 0.9, `V` 0.5 L/kg (35 L at the 70 kg reference), `ka` 1.0 /h. The two
   honest options are a declared derivation or an explicit `pk_unauthored` reason. Never a silent
   deletion. The inverse also holds: a stored value that *is* the default, wearing a citation, is
   a defect — 29 route rows stored `V_L: 35` and every one carried a `source_pmid`.
5. **A skip is a deliverable.** A cell investigated and honestly left empty gets a row in
   [`../data/GAPS.md`](../data/GAPS.md) naming the PMIDs chased and what would unlock it.
   "Finished" means no unvisited cells, not every cell filled.
6. **Say which species, which route, which molecule.** An animal value is keepable; an
   unlabelled one is not. `source_species` exists on `pk[route]` and `effect_compartment`; an
   occupancy row or a `fraction_unbound` has no such field, so the species goes in the note.
   A prodrug's curve must name its analyte
   (`pk_analyte`). A salt dose against free-base PK needs `dose_moiety_fraction`.
7. **Check what the record DOES, not only what it cites.** Values individually correct can be
   jointly impossible, and each compound page's implied-values card resolves them for you.
   Teriparatide's verbatim `V/F` 7.8 L beside its verbatim `CL/F` 62 L/h
   implied a five-minute half-life against the hour the record stored; it now stores the volume
   its own clearance implies.
8. **When a prose-reading lint rule fires, suspect the rule first.** Those rules flag the
   best-documented records, because a thorough note discusses the defect it does *not* have. One
   2026-09-08 cluster of 16 warnings was 4 false positives, 1 wrong message, and 1 real fix.

## Reading order

| Read this | When |
| --- | --- |
| [HYGIENE.md](./HYGIENE.md) | **First, always.** What earns a row; the rejection rules with the shipped defect behind each; the smells checklist to run your own batch against. |
| [WORKFLOW.md](./WORKFLOW.md) | When you are about to do a batch. Target selection, the exact E-utilities calls, how to edit the JSON, the validation ladder, the sub-agent verification prompt. |
| [FIELDS.md](./FIELDS.md) | While writing JSON. Every field, its units, the provenance it requires, the lint rules that touch it, and the mistake it invites. |
| [`../data/GAPS.md`](../data/GAPS.md) | Before searching PubMed for anything. If the cell is already there, the search is already done. |
| [NETWORK.md](./NETWORK.md) | When a fetch fails or a session is being set up. The hosts an authoring session needs, by tier. |

Everything else you might look for is gone on purpose. There are no dated apply-scripts: the
JSON files are the source of truth, you edit them directly, and the git diff is the review. There
is no roadmap; `pnpm report` and [`../data/GAPS.md`](../data/GAPS.md) are the state of the work.
There is no PK/PD solver; `impliedExposure` in the registry package and the compound page's
**What the stored values imply** card do the one-compartment arithmetic the hygiene rules need. The
nutrient-group lint rules left with the food catalog, since no grouping is stored here.

The schema is strict. A field it does not declare, including a misspelled one, fails
`pnpm validate` rather than being silently dropped, so a new field means a schema change in the
same commit.

If you read only this file, you still must not: fabricate a PMID, store a range midpoint, delete
a value without declaring what replaced it, add an animal number without naming the species
(`source_species` where the schema has it, the note everywhere else), or skip a cell without
writing the GAPS row.
