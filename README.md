# xenobiotics-registry

The cited compound / receptor / pathway registry: the data, the schema that
validates it, the gates that police it, and the authoring history that produced
it. Extracted from the xenobiotics app repos so registry work can happen without
an app in the way.

**1,244 compounds · 230 pathways · 2,596 cited PMIDs, all resolving · 0 lint errors.**

## What is here, and what is not

|                           |                                                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/registry/data/` | **The source of truth.** `compounds.json`, `receptors.json`, `pathways.json`, `recon3d-map.json`, plus the provenance docs — `AUTHORING_GAPS.md` is the important one.           |
| `packages/core/`          | The schema. `types.ts` is the contract; `schemas.ts` the zod mirror.                                                                                                             |
| `packages/registry/src/`  | The loader. Zod validation, the query layer, interaction resolution, PubMed helpers. **The loader is the schema** — a field it does not declare is silently stripped.            |
| `packages/solver/`        | The PK/PD engine, included because authoring uses it. A stored value is judged by what it makes the model DO, not by how it reads.                                               |
| `scripts/`                | The gates (`data-lint`, `verify-registry`), the build/publish path (`build-bundle`, `push-bundle`), the database path (`seed-registry`, `grant-curator`), and the ETL importers. |
| `scripts/authoring/`      | **380 dated, already-run apply-scripts: the provenance trail.** Not maintained source — a historical record, excluded from lint.                                                 |
| `supabase/migrations/`    | The `registry.*` schema, copied verbatim. See the README there before running them.                                                                                              |

**No foods.** The food catalog, its authoring pipeline and its lint rules stayed
behind; that is a separate concern with its own docs and its own 4,500 rows. The
loader still exports `loadFoods` because `FoodPreset` remains an interchange
shape in the schema. Three of the provenance docs still DISCUSS foods, in
`DATA_QUALITY_AUDIT.md`, `DATA_QUALITY_BACKLOG.md` and `AUTHORING_GAPS.md` —
those passages are a historical record of audits that covered both catalogs and
are left intact rather than rewritten, because editing a finished audit to match
a later repository split would falsify it.

**No app, no oplog, no sync.** Nothing here renders or stores user data.

## The one inversion to know about

**In this project the JSON is the source of truth. In the v12 app repo, Postgres
is.** So `scripts/registry-source.ts` defaults to reading the JSON and takes
`--from-db` to opt into the database — the reverse of the wiring it shipped with.
`--from-json` is still accepted so a command copied from v12 does what it says.

That is not a disagreement with v12, it is a division of labour. Authoring here
is a dated apply-script writing JSON, reviewed as a diff and gated in git. v12
authors through its admin UI into `registry.compound`, with
`registry.compound_revision` carrying the who/when/why that git carries here.
The bridge is one-directional: `registry:seed --write` pushes this JSON into a
database, and `registry:bundle` + `registry:push` publish a content-addressed
bundle the apps fetch.

## Commands

```
pnpm install
pnpm registry:lint        # data-lint: structural invariants + provenance rules
pnpm registry:verify      # every cited PMID against NCBI ESummary (minutes)
pnpm registry:check       # both
pnpm test                 # core, registry, solver suites
pnpm typecheck            # packages AND scripts
pnpm lint
pnpm gates                # everything offline (skips the NCBI round trip)
```

Database paths need `.env` (see `.env.example`); nothing above does.

## The rules that make this worth having

These are not style preferences. Each one exists because its absence produced a
measurable error that reached the model.

1. **Every number cites a source whose abstract states it VERBATIM.** No
   paraphrase, no midpoint of a range, no fabricated PMID. `registry:verify`
   resolves identifiers; it cannot tell you the abstract says nothing about the
   value hung on it, and **that miscitation is the single largest defect class
   found so far.** Only reading the abstract catches it.
2. **A skip is a deliverable.** A cell investigated and honestly left empty gets
   a row in `AUTHORING_GAPS.md` with the PMIDs that were chased. "Finished"
   means no unvisited cells, not every cell filled.
3. **Deleting an unsupported value does not leave a record silent — it leaves it
   asserting the solver default** (`F` 0.9, `V` 0.5 L/kg, `ka` 1.0/h), which is
   itself unsourced and invisible. The honest options are a DECLARED DERIVATION
   or a `pk_unauthored` reason. Never delete and say nothing.
4. **An animal value is keepable; an unlabelled one is not.** `source_species`
   exists so a rat half-life cannot render as a human one.
5. **Check what a record DOES, not just what it cites.** Resolve it through the
   solver and compare against a published Cmax or clearance. Values that are
   each individually correct can still be jointly impossible.
6. **When a prose-reading lint rule fires, suspect the rule first.** It will flag
   the best-documented records, because they are the ones whose notes discuss the
   defect they do not have.

New authoring follows the recipe in `scripts/authoring/VERIFICATION_PROMPT.md`
and `PLAYBOOK.md`: one dated, idempotent apply-script per batch, written as a
data table with a guard per record, then the gaps file, then the gates.

## Provenance

Assembled 2026-09-26. Tooling and registry data from the v12 app repo
(`v12/`, which is already foods-free and has the lint rules split out of the gate
entry point); the authoring history and the Recon3D ETL from v8
(`v8/code/v0.1/`, which keeps the fuller set). **The originals were left in
place** — both app repos still boot on their own copy of `compounds.json`, so
nothing here removes anything from them. Keeping the copies in step is a manual
step until one of them consumes a published bundle instead.
