# Instructions for AI agents

This repository is a cited data registry. The data in `data/` is the product,
and its value is that every number traces to a source that actually states it.

## Before you touch anything in `data/`

Read [`authoring/README.md`](authoring/README.md) first, every session. It is
short, and it links the rest in the order you need it:

- [`authoring/HYGIENE.md`](authoring/HYGIENE.md): what is worth adding, and the
  rules that reject bad or unverified data.
- [`authoring/WORKFLOW.md`](authoring/WORKFLOW.md): how to run a batch and
  validate it.
- [`authoring/FIELDS.md`](authoring/FIELDS.md): what each field means and what
  provenance it needs.
- [`data/GAPS.md`](data/GAPS.md): cells already investigated and skipped. Check
  it before any literature search so you do not re-chase a dead end.

These rules are not optional and they are not style. Each one exists because
its absence put a wrong number in front of a reader.

## The rules you must never break

1. Never cite a source you did not fetch in this session. Never write a PMID
   from memory.
2. A number is stored only if the cited abstract or label states it verbatim for
   the named compound, or it is a declared derivation whose inputs are all
   verbatim and whose arithmetic is written on the record.
3. When you cannot source a value, record the skip in `data/GAPS.md`. Do not
   guess, and do not silently delete a value.
4. Run `pnpm validate` after every edit. Before you call the work finished, run
   `pnpm check` and then `pnpm verify`: that pair is the finish condition. Zero
   errors is the bar. Say what you could not verify. If you touched a note that
   quotes its source, run `pnpm verify:quotes` too — it checks the quote against
   the abstract, which is the half `pnpm verify` cannot see.

## Commands

```
pnpm validate   # schema + lint rules, offline, ~1 s. Must show 0 errors.
pnpm validate --save /tmp/before.json   # baseline, before a batch
pnpm validate --since /tmp/before.json  # only what your edit changed
pnpm verify     # every cited PMID against NCBI. Network, about 25 s.
pnpm verify:quotes # every verbatim quote against the abstract it cites. Network, ~6 s.
pnpm report     # what is authored and what is open, derived from the data
pnpm test       # registry package tests, including the no-field-loss check
./live.sh       # validate, then serve the browsing client for a spot-check
pnpm dev        # the client alone, without the install check or the gate
pnpm check      # format + lint + typecheck + test + validate
```

## Code

The only library is `packages/registry` (types, zod schema, loader, queries,
lint rules, and the `impliedExposure` / `impliedOccupancy` spot-checks that resolve a record's
stored numbers into an implied curve and occupancy). `packages/web` is a read-only browsing client. `scripts/` holds the
gates. There is no database, no app and no build pipeline for the data: the
JSON files are the source of truth and changes are reviewed as git diffs.

## Tone

Answer in as few lines as the question needs. No preamble, no recap of what
was read, no restating the rules back. Lists over prose. Config and example
files contain only what is required to run: no explanatory comments.

## Git

Work on `main` and push `main`. **Never push a branch**, and never open a pull
request. If a session starts you on a side branch — some harnesses do — merge it
into `main`, push `main`, and stay there. A branch that still exists on the
remote is unfinished work, not a deliverable.
