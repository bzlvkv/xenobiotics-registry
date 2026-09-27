# Roadmap — temporary

**Delete this file when the last batch closes.** [`authoring/README.md`](authoring/README.md)
says there is no roadmap, and that `pnpm report` and [`data/GAPS.md`](data/GAPS.md) are the state
of the work. That is still the design. This file exists only to sequence one known run of batches
so the ordering survives a session boundary; it is not a second source of truth and nothing here
should be believed over `pnpm report`.

State measured 2026-09-27: 1,265 compounds · 633 authored PK · 632 explained · 0 unvisited ·
`validate` 0 errors / 104 warnings · `verify` 2,694/2,694 resolved · **`verify:quotes` FAILING at
12**.

Rules for every batch below: one concern per commit; `pnpm check` then `pnpm verify` is the finish
condition; a skip is a deliverable and gets its GAPS row; if the diff touches `packages/`, that is
a separate commit.

---

## Batch 1 — get `verify:quotes` green · 12 cells — **DONE 2026-09-27**

Gate PASSES at 232 quotes, 0 missing. No stored value was wrong and nothing was removed: all twelve
were quotes attributed to the wrong document. Findings are in `data/GAPS.md`.

A failing gate outranks every warning, so this goes first. Three sub-classes, three fixes, one
commit each.

- [x] **1a — full text reachable? (5 cells)** `cbd` ×2 (PMID:17245363), `cbg` ×2
      (PMID:20002104), `guselkumab` (PMID:34460338). GAPS records that
      `https://pmc.ncbi.nlm.nih.gov/articles/PMCnnnnnnn/` serves tables where `efetch db=pmc` and
      Europe PMC both fail; that route is untested on these three. Fetch → find the value in the
      table → say **"full text"** in the note, which the gate exempts by design. If unreachable,
      remove the rows and write the GAPS row. This decides whether four cannabinoid occupancy
      rows survive.
- [x] **1b — paraphrase sold as a quote (3 cells)** `topiramate` "low nanomolar",
      `terazosin` "first-order rate constant of inhibitory Emax", `lsd` "Any drug effect". These
      break R3 independently of the gate: a paraphrase is not a value. Expect removal + GAPS, not
      re-sourcing.
- [x] **1c — interaction notes whose number is not in the abstract (4 cells)** `bergamottin`
      (PMID:15285845), `cimetidine` (PMID:89387), `clarithromycin` (PMID:21480191),
      `voriconazole` (PMID:16635790). Re-source to a paper that states it, or mark full text.

Finish: `pnpm verify:quotes` PASS. Do this before Batch 2 — `cbg` and `lsd` appear in both, and
one concern per diff forbids touching them twice.

## T1 — close the `verify:quotes` blind spot · `packages/` — **DONE 2026-09-27**

- [x] The gate only inspects a note sitting beside a `source_pmid`. Every stub record added on
      2026-09-26 cites its PMIDs **inline in prose**, so roughly twenty records are unguarded, and
      the `vadadustat` defect fixed in `e8e5d68` proves the guarded path catches real errors.
      Extend `quotesIn` to inline `PMID:n … "quote"` clause pairs and sweep the ~660 records
      carrying notes. Expect a large new finding count; that is the point, not a regression.

Done in four commits: inline attribution, two normaliser folds, whole-note quotation pairing, and
22 data repairs. Coverage 232 -> 590 quotes; gate PASSES. Findings in `data/GAPS.md`.

## Batch 2 — `fraction_unbound` · 19 records

- [ ] 7-hydroxymitragynine, cariprazine, cbg, cbn, citalopram, clonidine, desmopressin, exenatide,
      glycine, isoflurane, lsd, nalbuphine, prednisolone, promethazine, psilocin, sevoflurane,
      suvorexant, tasimelteon, taurine.

R13: each compares a free-drug Ki against a total plasma curve, overstating occupancy by ~1/fu.
DailyMed labels carry protein binding for the approved ones. Concentration-dependent binding is a
reason **not** to store a scalar — `fu_note` with no value, which is a decision and silences the
rule honestly.

## Batch 3 — stored values equal to a consumer default · 16 route rows

- [ ] `V_L 5.6`: adalimumab.SC, omalizumab.SC. `ka 1`: gemfibrozil.PO. `F 0.9`:
      arachidonic-acid, bisoprolol, clonazepam, dextroamphetamine, gla, glycine, mct-c10,
      medroxyprogesterone, mixed-amphetamine-salts, moclobemide, pregabalin, prucalopride,
      theobromine.

R6: every one wears a `source_pmid`. Fetch each abstract, confirm or strip. Stripping is
numerically a no-op — what changes is that the record stops claiming a measurement, and the
`pk.defaulted-*` counts rise, which is the audit working.

## Batch 4 — `pk.template-ka` · 11 groups

- [ ] R11. Precedent is unambiguous: all seven `pk.template-quartet` groups audited in 2026-09
      were real template-fill and not one shared trio was stated by any cited paper. Expect
      strips.

## Batch 5 — the two uncatalogued occupancy keys · 13 rows · `packages/` + data

- [ ] `alpha_1` (8 rows): carvedilol, clomipramine, clozapine, doxazosin, labetalol, prazosin,
      risperidone, terazosin.
- [ ] `muscarinic` (5 rows): atropine, oxybutynin, tiotropium, tolterodine, solifenacin.

Pin each row to the subtype **its cited assay measured** (α1A/1B/1D, M1–M5) — never to a subtype
the paper did not measure. Needs an `OCCUPANCY_TARGET_KEYS` line plus a catalog entry, so the code
change commits separately from the data.

## Batch 6 — full-text re-chase · 7 "not retrieved" rows + 20 named PMC ids

- [ ] Best targets: **PMC3281520** (halofuginone EPRS IC50, would unblock an occupancy row),
      **PMC7072805** (somapacitan ITC constants), **PMC3579463** (acadesine CLL PK table).
- [ ] Known dead, do not re-chase: PMC3911487 (no `<body>`), PMC5945293 (MitoQ value is
      figure-only).

## Batch 7 — `pk.unsolvable-default-route` · 5 records

- [ ] 5-meo-dmt, betamethasone, budesonide, epinephrine, mannitol. `routes[0]` yields no
      elimination rate, so the commonest path through each record renders nothing.

## Batch 8 — singletons

- [ ] `compound.retired-alias-clash` — riboflavin-5-phosphate.
- [ ] `interactions.inert-kinetics` — 1 catalog row.
- [ ] `dose.salt-moiety-unset` on `mitoq` is a **documented standing caveat**, not work: no source
      states whether its doses are salt or cation. Leave it.

## T2 / T3 — tooling, opportunistic · `packages/`, `scripts/`

- [ ] **T2** Wire `NCBI_API_KEY` into `packages/registry/src/pubmed.ts` and
      `scripts/verify-citations.ts`: 3 → 10 req/s. The key is not in this container's environment,
      so it needs adding as an environment secret first.
- [ ] **T3** A `source_label` verifier. 26 rows cite DailyMed labels and **no gate checks them at
      all**; resolve the set id and the effective date.
