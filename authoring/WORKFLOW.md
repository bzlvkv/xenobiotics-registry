# Workflow — one batch, end to end

The loop as it exists now. The data files are the source of truth, you **edit them directly**, and
the git diff is the review. There are no apply-scripts: the old loop wrote one dated, idempotent
TypeScript script per batch into a directory that has been deleted. Do not resurrect it. A script
that mutates the JSON is a second source of truth and an unreviewable diff.

Read [HYGIENE.md](./HYGIENE.md) before this file. This one is mechanics; that one is judgement.

---

## 0. Before you start

```
pnpm install
pnpm report        # the current state: what is authored, what is open
pnpm validate      # must be clean BEFORE you touch anything, so any failure later is yours
```

If `pnpm validate` is not clean on a fresh checkout, fix that or stop. Starting a batch on top of
existing findings makes your own diff unjudgeable.

**Save a baseline before you touch anything**, because about a hundred warnings are always present
and several rules report the whole catalog on one line — a new defect often changes a count inside
an existing message rather than adding a line, and scanning for it by eye does not work:

```sh
pnpm validate --save /tmp/before.json
```

After each edit, `pnpm validate --since /tmp/before.json` prints only what is new or changed, and
says how many findings your edit resolved.

## 1. Pick a target list, and size it

**10-25 entries.** Small enough that parallel verification finishes in minutes, large enough that
the diff is worth reviewing. Two failure modes to avoid: a batch of 60 where the last 30 get less
attention than the first 30, and a batch of 3 where the setup cost dominates.

**One concern per batch.** A batch is "the `fraction_unbound` for these 20 compounds" or "these 12
compounds' PO half-life" or "the `ki_basis` on these 21 edges" — not "improve these 20 compounds".
A single-concern batch produces a diff a reviewer can check by reading one column, and it lets you
state a finish condition.

**Where the next batch comes from**, in priority order:

| Priority | Source |
| --- | --- |
| Highest | A defect class `pnpm validate` names as an **error**. Errors block; nothing else matters while one exists. |
| High | An open row in [`../data/GAPS.md`](../data/GAPS.md) whose blocker has lifted — the row names what would unlock it, and sometimes what it needs is now reachable. |
| High | `pnpm report --json`: `coverage.compounds.unvisited` (must stay empty — `compound.unvisited` is now a lint error too), `coverage.targets.occupancyKeysUnknown` (live: 2 of 92 occupancy keys, both class-level, resolve to no catalog entry), `coverage.compounds.untagged`. |
| Medium | A compound that completes a target which already carries authored occupancy rows — same-target precedent means the model already fits. |
| Medium | A compound that closes a hand-authored pathway's modulator list. |
| Low | Breadth. Read [HYGIENE.md Part 1](./HYGIENE.md#part-1--what-earns-a-row) first; a breadth batch that lands as bare stubs buys little. |

**Never size a batch by a triage score from a previous run.** One sweep's triage topped out at 5
where the previous reached 9, which read like the signal thinning out. It was not: re-run against
the same signals, the next batch scored five compounds at 12. **Triage scores are comparable only
within a single run of a single scorer.** Judge remaining debt by the defect shapes, not by a number.

## 2. Find what is actually open

Four sources, and they say different things.

| Source | What it tells you | What it does not |
| --- | --- | --- |
| `pnpm report` | The coverage report: per-layer counts, unvisited and untagged records, the reasons PK was not authored, uncatalogued occupancy keys, citation totals, and the rows storing a value equal to a default. `pnpm report --json` gives the same under `coverage.*` (`coverage.compounds.unvisited`, `coverage.targets.occupancyKeysUnknown`) for a script to plan from. | Whether anything is *wrong*. It counts, it does not judge. |
| `pnpm validate` | Errors and warnings by rule id. Errors are blocking; warnings are a mix of task lists and standing states. | Which warnings are standing states. `pk.defaulted-volume` and `pd.needs-solvable-pk` are **not** backlogs — see [HYGIENE R5 and R14](./HYGIENE.md#r5-deleting-an-unsupported-value-does-not-silence-the-record-it-makes-it-assert-the-default). |
| [`../data/GAPS.md`](../data/GAPS.md) | Every cell already investigated, the PMIDs already chased, and why each was rejected. **Grep it for your compound before you search PubMed.** | Anything about cells nobody has looked at yet. |
| `pnpm dev`, the client's `#/health` route | The same findings and coverage, rendered — and the compound pages, which is where a wrong number looks wrong. | Nothing you cannot get from the CLI, but it is faster for eyeballing 20 records. |

## 3. The literature pass

**Fetch. Do not recall.** An agent asked for a PMID will produce one that resolves and is about
roughly the right topic, and `pnpm verify` will pass it. Four such ids reached a batch draft in
2026-09-08 before being caught. Every id you write must come out of a response body you read in
this session.

### The exact calls

Search:

```sh
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=20&term=midazolam+AND+pharmacokinetics+AND+bioavailability"
```

Read the abstract — **this is the call that matters**, and there is no substitute for it:

```sh
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=6138080&rettype=abstract&retmode=text"
```

Confirm the id resolves to the paper you think it is (the same endpoint `pnpm verify` uses;
200 ids per request is NCBI's documented ceiling):

```sh
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=6138080,27780297&retmode=json"
```

Check for open-access full text before declaring a value unreachable — 122 of 503 closed-looking
citations in one sweep turned out to be in PMC, and three yielded a usable value:

```sh
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pmc&id=6138080&retmode=json"
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=PMC1234567&retmode=xml"
```

**A PMC id is not full text.** For an article outside the open-access subset, that `efetch` returns
front matter only — title, authors, abstract — with no `<body>` and `pmc-prop open-access "no"`. It
succeeds, it is several kilobytes long, and grepping it for a value finds nothing whether or not
the paper contains one. **Before concluding anything, check the response has a `<body>` element.**
If it does not, the honest GAPS wording is "full text not retrieved", never "full text silent" —
the second is a false trail, and this ledger's whole promise is that a recorded row is not
re-chased.

**Abstracts can be truncated.** Older records end with `(ABSTRACT TRUNCATED AT 400 WORDS)`. The
value may be in the missing part, so that is "not retrieved" too.

**A full-text value may be stored**, and it is often the only place a volume or an `fu` is printed.
Cite the same `source_pmid` and say **"full text"** in the note beside the quote, so a later reader
does not check the abstract, fail to find the number, and file it as a miscitation. The rule an
abstract-only value satisfies — verbatim, for the named compound, in the paper you fetched — is
unchanged.

The human-readable link, which is what `pubmedUrl()` produces: `https://pubmed.ncbi.nlm.nih.gov/6138080/`.

### Rate-limit courtesy

**3 requests per second without an API key**, 10 with one. `pnpm verify` batches 200 ids and sleeps
350 ms between batches, with 5 retries on exponential backoff. Match that: batch your `esummary`
calls, sleep between them, and do not fan out 40 parallel `efetch` calls against NCBI. A 429 that
retries silently is how a batch ends up with a value nobody read.

### What you are looking for, per field

Ask for the quantity by the name the literature uses, not by the name the schema uses.

| Field | Ask for | Watch for |
| --- | --- | --- |
| `half_life_hr[route]` | "elimination half-life", single-dose, healthy volunteers | terminal vs steady-state; flip-flop on depot and transdermal routes; the metabolite's figure |
| `pk[route].V_L` | an absolute volume, or `V/F` **declared as apparent** | `Vc` from a population fit is the wrong volume for one compartment; whole-blood-referenced drugs; a volume that is really the subjects' body weight |
| `pk[route].F` | "absolute bioavailability", against an IV arm | no IV form means no absolute F exists — pin `F: 1` and put the measured figure in prose rather than pairing it with an apparent volume |
| `pk[route].ka_hr` | there is usually nothing to ask for: papers report a **Tmax**, not a rate | `ka = ` the root of `ln(ka/ke)/(ka − ke) = Tmax`, and that is a **derivation** — disclose it. `ka` is formulation-specific, not a drug constant |
| `receptor_occupancy[].ec50_mg_l` | a Ki / Kd / EC50 in nM **for your compound as the paper's subject** | comparator and reference-standard values; GtoPdb aggregates cited to whichever paper happened to be open; convert as `Ki_nM × mw_g_mol / 1e6` |
| `effect_compartment.keo_per_h` | a published PK/PD effect-compartment fit | if there is none, `approximated: true` + a note. Do not hang a PET time-course PMID on an estimate |
| `fraction_unbound` | "fraction unbound", "% protein bound" in human plasma | concentration-dependence across the therapeutic range is a reason **not** to store a scalar — say so in `fu_note` |
| `interactions[].kinetics.ki_uM` | an in-vitro Ki, **or** a clinical AUC ratio to calibrate from | declare `ki_basis`; store `auc_ratio` and `assumed_perp_uM` so the arithmetic reconstructs |
| `mw_g_mol` | PubChem, re-queried during the batch | not carried over from a previous search report; not stored at all for a polydisperse polymer |

### Recording a verified value

Three things go in together, or it is not authored:

1. the value, in the schema's units;
2. `source_pmid` (or `source_label` for a regulatory label / monograph, which is legitimate primary
   provenance and is often the only public document stating Cmax, t½ and F together);
3. the **verbatim quote** in the record's `note` / `notes`, with the species, population and any
   caveat. The quote is what makes the record re-checkable without re-fetching.

**Fetching a label.** NCBI does not index labels, so use DailyMed's SPL service, and treat it with
the same discipline as a paper — fetched this session, quoted verbatim:

```sh
curl -s "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=darunavir"
curl -s "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/<setid>.xml"
```

A `source_label` string must name **the product, the set id and the label's effective date**, or the
sentence cannot be found again: a label is revised in place, and "FDA label: Prezista" points at
whatever it says today. Say which section the value came from (Clinical Pharmacology), and whether
the label's route or formulation differs from the record's. `fraction_unbound` has no source field
at all, so a label-sourced `fu` carries its citation in `fu_note` — and the PMID or set id also goes
in `refs[]`, because nothing reads prose.

Live example, `midazolam`'s occupancy note: *Videbaek 1993 — abstract verbatim "Kd … for midazolam,
73, 76, 58 and 30 nmol/l plasma water"; mean 59.25 nM. Human cortex, [123I]iomazenil SPECT. MW
325.77*. Value, quote, arithmetic, method, conversion input — in one sentence.

### Recording a skip

Append a row to [`../data/GAPS.md`](../data/GAPS.md) under a dated section for your batch. Name:
the compound and the field; **every PMID you chased and why each failed**; and what would unlock it.
Then write the corresponding state into the data. **Which field carries the skip is not a matter of
taste — a rule reads a specific one**, and a decision recorded in the wrong place keeps firing as
though nobody had looked:

| What you could not source | The decided state |
| --- | --- |
| The whole record's PK | `pk_unauthored: {reason, note}`. This is what keeps `compound.unvisited` at zero. |
| `fraction_unbound` | `fu_note` with **no** `fraction_unbound`. `pd.occupancy-needs-fu` reads `fu_note`, not `notes` — reasoning left in `notes` leaves the warning firing forever. |
| `effect_compartment.keo_per_h` | the estimate plus `approximated: true` and a note giving the reasoning. Move any PMID that anchors the pharmacology rather than the number into `refs[]`. |
| One PK parameter (`V_L`, `ka_hr`, `F`) | the absent field plus a sentence in `notes`. Expect `pk.defaulted-volume` or `pk.defaulted-ka-slow` to start reporting it: that is the gap becoming visible, which is the point. |
| An occupancy row that cannot be sourced | remove the row. A row needs `source_pmid` (`receptor.pmid`, error), so there is no honest half-state. |

A skip that lives only in GAPS.md and not in the data leaves the record asserting a default
([HYGIENE R5](./HYGIENE.md#r5-deleting-an-unsupported-value-does-not-silence-the-record-it-makes-it-assert-the-default)).

## 4. Editing the JSON safely

The three datasets are excluded from Prettier on purpose (see `.prettierignore`): reformatting
3.8 MB of machine-written JSON produces a diff nobody can review.

- **2-space indent, one value per line, trailing newline.** Match the surrounding file exactly.
- **Key order is conventional, not enforced.** The prevailing order on a compound, measured from
  the file: `slug`, `name`, `aliases`, `category`, `mechanism`, `routes`, `doses`, `half_life_hr`,
  `mw_g_mol`, `pk`, `refs`, `interactions`, `systems`, `pk_unauthored`, `composition`, `notes`,
  `effect_compartment`, `recon3d_metabolite_id`, `receptor_occupancy`, `retired_slugs`,
  `pk_analyte`, `nutrition`, `pk_analyte_name`, `fraction_unbound`, `dose_moiety_fraction`,
  `fu_note`, `dose_moiety_note`. Records vary, so match the record you are editing rather than this
  list, and put a new key where its neighbours already put it.
- **Do not resort the file.** `loadCompounds` and `loadPathways` sort by `name` at load time, so
  on-disk order is not load-bearing. `compounds.json` is broadly name-ascending with the most recent
  batch appended at the end; insert a new record near its alphabetical neighbours or append it, but
  never re-sort, which would turn a 20-line change into a 1,244-record diff.
- **One concern per diff.** If you find a second defect while authoring the first, write it into
  GAPS.md and do it in the next batch.
- **Check a serialiser round-trips before you rewrite a whole file with it.** All three data files
  are exactly `JSON.stringify(data, null, 2)` plus a trailing newline, so a JavaScript read-modify-
  write is byte-identical apart from your change — verify it on the file you are about to touch:
  `node -e 'const f="data/compounds.json",fs=require("fs"),r=fs.readFileSync(f,"utf8");console.log(r===JSON.stringify(JSON.parse(r),null,2)+"\n")'`.
  Python's `json.dumps` is NOT equivalent: its default separators and `ensure_ascii` rewrite
  spacing and every non-ASCII character across the file, turning a one-line change into an
  unreviewable diff.
- **Editing prose is editing data.** `mechanism` and `notes` carry the provenance the lint rules
  read. When you supersede a value, say what it replaced and why — but phrase it as a record of the
  decision, because that is what the prose rules are tuned against
  ([HYGIENE R16](./HYGIENE.md#r16-when-a-prose-reading-lint-rule-fires-suspect-the-rule-first)).

## 5. The validation ladder

Run in this order. Each rung is cheaper than the one after it, so a failure costs you less the
earlier it fires.

```
pnpm validate --since /tmp/before.json   # only what your edit changed. Seconds.
pnpm validate                            # the whole picture. 0 errors is the bar.
pnpm test                                # the package suites, including no-field-loss.
pnpm verify                              # every cited PMID against NCBI. Network, about 25 s.
./live.sh                                # spot-check. Open every record you touched.
```

`./live.sh` installs if needed, runs the gate, and then serves the client, so you cannot browse a
catalog that does not parse. `pnpm dev` skips both checks.

`pnpm check` runs format, lint, typecheck, test and validate in one command; run it before you call
a batch done, then `pnpm verify`. **That pair is the finish condition** — nothing else counts as
finished, and there is no rung you may skip because the edit looked small.

- `pnpm validate` at **0 errors** is non-negotiable. For warnings: a new warning is either your
  defect or a rule firing wrongly — decide which before changing anything
  ([HYGIENE R16](./HYGIENE.md#r16-when-a-prose-reading-lint-rule-fires-suspect-the-rule-first)).
  `pnpm report` separates the warnings that may be work from the four standing caveats, which are
  audited states you must not close by inventing a number.
- `pnpm verify` catches a dead id. It **cannot** catch a live id on the wrong paper, which is the
  larger defect class. Do not let a green verify stand in for having read the abstract.
- In `pnpm dev`, check what the record *does*. Each compound page with PK carries a **What the
  stored values imply** card: the one-compartment Cmax, Tmax, AUC and clearance at the typical dose,
  with defaults badged and derived values marked. Compare them with the paper, and treat a
  `default` badge on a value you meant to store as a missing or misspelled field.
  ([HYGIENE R15](./HYGIENE.md#r15-check-what-the-record-does-not-only-what-it-cites).)

## 6. A good commit

One batch, one concern, one commit. Message shape:

```
data(registry): <one line, the concern> · N authored, M skipped

<what was checked and how>: the target list, where it came from, and the method.
<what was authored>: the fields, with the anchor values and their PMIDs.
<what was skipped and why>: pointing at the GAPS.md section that carries the trail.
<anything reversed or reconsidered>: including a rule that fired wrongly.
```

The body is the part that matters. A reviewer reading the diff sees numbers change; only the message
says which abstracts were read, which candidates were rejected, and what the batch decided **not**
to do. Files touched by a normal batch: `data/compounds.json` (or `pathways.json`) and
`data/GAPS.md`. If the diff touches anything under `packages/`, that is a different commit.

---

## Appendix — the verification prompt

Paste this when you fan a literature pass out to sub-agents. Replace the bracketed parts. Give each
agent a **narrow** scope — one field, or one mechanism class — and 8-12 entries.

```
I am authoring [FIELD] data for a cited pharmacology registry.

STRICT RULE: never fabricate a citation. Every PMID you return must be VERIFIED by fetching it
in this session, and every numeric value must appear in the abstract VERBATIM for the NAMED
compound. If the abstract paraphrases ("Ki values were in the micromolar range"), that is not
enough. If the compound is only a COMPARATOR or a REFERENCE STANDARD in a paper about something
else, that is not enough either, however correct the number is.

For each entry below, find ONE primary-source PMID whose abstract states the value. For each id,
run both of these and read the output:

  curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=NNNN&rettype=abstract&retmode=text"
  curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=NNNN&retmode=json"

Keep to about 3 requests per second.

[TARGET LIST — one line each: compound (or pair) -> field needed -> notes, constraints,
 and any PMIDs already chased and rejected, copied from data/GAPS.md]

Return one structured row per entry:
  - PMID, and the paper's title + journal + year as ESummary returned them
  - the value, with units
  - the VERBATIM quote containing it
  - the SUBJECT of the paper (is my compound the subject, or a comparator?)
  - species, population (healthy volunteers / patients), route, formulation,
    single-dose or steady-state, and the analyte measured (parent / metabolite)
  - any arithmetic you did, with its inputs
  - one line on what the paper is

If no primary-source value exists in a verifiable abstract, say so plainly and SKIP it. A skip
with the PMIDs you chased and why each failed is a deliverable and is worth as much to me as a
value. Do not paraphrase, do not store the midpoint of a range, and do not average across papers
without writing out the arithmetic. Quality over quantity; take the time you need.
```

**Why each part of that prompt earns its place.**

| Part | Why |
| --- | --- |
| "Never fabricate" **first** | It is the guardrail, and a model trained on biomedical literature will otherwise produce plausible PMIDs from training weights. Stating it last gets it ignored. |
| The exact `curl` commands | Removes ambiguity about the endpoint and the format, and makes the loop deterministic across agents with different habits. Agents invent plausible URLs otherwise. |
| **Both** `efetch` and `esummary` | `efetch` gives the abstract, which is where the value must be. `esummary` gives the title and journal, which is how you confirm the id is the paper the agent thinks it is. The 2026-09-08 near-miss was four live ids attached to the wrong papers — `efetch` alone would not have surfaced it as cleanly as reading the titles back. |
| "Verbatim" + "exact quote" | Forces the source text into the reply, so the reviewer can confirm the value was not paraphrased into existence. The quote then goes into the record's note and survives as provenance. |
| "Is my compound the SUBJECT?" | Secondary-citation was the single largest confirmed defect type (84 of 216). The value is often correct *and* the citation is still wrong. No other question in the prompt catches it. |
| Species / population / route / formulation / single-dose / analyte | Each is a shipped defect class: the canine F stored as human, the patient volume paired with a healthy-volunteer half-life, the IV row on an oral-only study, the depot figure on an immediate-release route, the steady-state Cmax divided as if single-dose, the metabolite's half-life stored as the parent's. |
| "Any arithmetic you did, with its inputs" | A declared derivation is allowed; an undeclared one is a guess. This is the line that separates them. |
| The explicit **skip** path, valued equally | Without it an unverified entry gets quietly dropped or quietly invented. GAPS.md is downstream of these explicit skips, and the dead ends are what make the next pass cheap. |
| Already-chased PMIDs in the target list | Stops the agent re-running searches that GAPS.md records as dead. This is the single highest-leverage line in the prompt. |
