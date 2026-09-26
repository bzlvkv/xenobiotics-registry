# xenobiotics-registry

A cited registry of compounds, pathways and receptor targets. Every stored
number traces to a source that states it, and every cell that could not be
honestly filled is recorded as a skip rather than guessed.

The data is expanded by AI agents. The rules they follow are in
[`authoring/`](authoring/README.md), and the gates in `scripts/` reject what
breaks them.

## Layout

| Path                 | What it is                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/`              | The source of truth. `compounds.json`, `pathways.json`, `receptors.json`, and `GAPS.md`, the ledger of cells investigated and skipped.              |
| `authoring/`         | Instructions only. What is worth adding, what gets rejected and why, how to run and validate a batch, and a field-by-field reference.               |
| `packages/registry/` | The one library: types, a strict zod schema, loaders, queries, the lint rules, and one-compartment exposure arithmetic. Browser-safe except `read`. |
| `packages/web/`      | A read-only browsing client. Vite, TypeScript, no framework.                                                                                        |
| `scripts/`           | The gates: `validate`, `verify-citations`, `report`, and `fetch-receptors` for the GPCR half of the target catalog.                                 |

There is no database, no app and no publish pipeline. The JSON files are edited
directly and reviewed as git diffs.

## Commands

```
pnpm install
pnpm dev               # browse the registry at http://localhost:5173
pnpm validate          # schema + lint rules, offline, well under a second. 0 errors is the bar.
pnpm verify            # every cited PMID against NCBI ESummary. Needs network, under a minute.
pnpm report            # what is authored and what is open, derived from the data
pnpm receptors:fetch   # refresh the GPCR catalog from the IUPHAR/BPS Guide to PHARMACOLOGY
pnpm test              # registry package tests, including a no-field-loss check on the real data
pnpm check             # format + lint + typecheck + test + validate
pnpm build             # static build of the client into packages/web/dist
```

## What the gates prove, and what they cannot

`pnpm validate` loads all three datasets through a strict schema, so a
misspelled or undeclared field fails instead of disappearing. It then runs the
lint rules, each of which exists because its absence once put a wrong number in
the data. Warnings are a backlog and do not fail the gate. Errors do.

`pnpm verify` proves every cited PMID resolves to a real paper. It cannot prove
the paper's abstract states the value hung on it. That miscitation is the
largest defect class this dataset has had, and only reading the abstract
catches it. [`authoring/HYGIENE.md`](authoring/HYGIENE.md) explains how to read
for it.

## For AI agents

Read [`AGENTS.md`](AGENTS.md), then
[`authoring/README.md`](authoring/README.md), before changing anything in
`data/`.

## History

The registry was extracted from two app repositories. The first commit after
the initial one, `chore: snapshot the imported registry before the redesign`,
holds everything the redesign removed. That includes about 380 dated
apply-scripts that wrote the data, the PK/PD solver, the Supabase schema and
publish scripts, and the audit and roadmap documents. Their lessons now live in
`authoring/`, and `git show` recovers any of the files.
