# Authoring playbook

**How** to add primary-source-cited data to the registry. Sister docs:

- [`packages/registry/data/README.md`](../../packages/registry/data/README.md) — what done looks like (breadth / depth / quality targets and current state).
- [`packages/registry/data/ROADMAP.md`](../../packages/registry/data/ROADMAP.md) — the ordered wave plan from current state to v1.0; tells you which wave a session belongs in.
- [`packages/registry/data/AUTHORING_GAPS.md`](../../packages/registry/data/AUTHORING_GAPS.md) — investigated-and-skipped cells with chased PMIDs; check before any literature pass.

## The discipline contract

Every PMID in the registry resolves against NCBI ESummary. Every Ki / IC50 / EC50 / induction factor / Hill coefficient comes from the cited paper's abstract, **verbatim**. If the abstract paraphrases ("Ki values were in the µM range") that is not enough — find a paper that names the number for the named compound, or skip the entry and add a row to [packages/registry/data/AUTHORING_GAPS.md](../../packages/registry/data/AUTHORING_GAPS.md).

CI gates the contract: every PR that touches `packages/registry/data/**` runs `pnpm registry:lint` (schema sanity) and `pnpm registry:verify` (PMID resolution). A dead PMID or a kinetics block missing provenance fails the merge. Don't bypass the gate.

## The loop — one authoring session

Each session writes one dated apply-script to this folder. Sessions are independent: re-running an old script is a no-op (the script's idempotent `if-already-authored: skip` checks see the existing data and short-circuit).

### 1. Pick the target list

Where the next authoring effort goes. Triaged by user-visible payoff:

| Priority | Source list |
|---|---|
| Highest | Active-stack PK gaps — compounds the user has logged via `intake.create` that have no authored PK. Query the op log; the resulting "no PK on file" affordance on Today goes away as each row is authored. |
| High | CYP perpetrator clusters — open rows in [AUTHORING_GAPS.md](../../packages/registry/data/AUTHORING_GAPS.md), prioritized by how often the perpetrator shows up in users' active stacks. |
| Medium | keo + receptor occupancy for compounds that already have authored PK + effect_compartment but no Hill curve. |
| Low | MW backfill for compounds that aren't perpetrators yet but are likely future ones (small-molecule pharmaceuticals). |

A target list of **10–25 entries** is the right batch size for one session — small enough that parallel agents finish in ~5 min, big enough that the apply-script is worth writing.

### 2. Spawn parallel verification agents

Use the prompt template in [VERIFICATION_PROMPT.md](./VERIFICATION_PROMPT.md). Each agent gets a focused scope (one CYP enzyme, or one entity type) and returns a structured report with:

- The PMID, verified by `efetch` against NCBI E-utilities
- The verbatim quote with the value
- Whether the abstract supports authoring or whether to skip

Run **3–5 agents in parallel** so the literature work compresses. Each agent runs ~1–3 min. While they work, do mechanical pre-work: build the apply-script skeleton, MW lookups, schema scaffolding.

### 3. Collate verified findings

When agents return, manually copy the verified rows into a new dated apply-script. Use the existing scripts as templates:

- [2026-05-02-mw-backfill.ts](./2026-05-02-mw-backfill.ts) — straight slug → value map, no provenance needed (chemistry facts).
- [2026-05-02-kinetics-and-receptors.ts](./2026-05-02-kinetics-and-receptors.ts) — kinetic edges, PK PMIDs, receptor occupancy with full provenance trail.

The script must:
- Be idempotent (skip if the data is already there)
- Mutate compounds.json in place via `JSON.parse + writeFileSync`
- Print a summary of what it applied + what it skipped

Skipped entries (because no verifiable abstract) go into the same script as comments AND get added to AUTHORING_GAPS.md.

### 4. Run + verify + commit

```sh
pnpm tsx scripts/authoring/<dated-script>.ts
pnpm registry:lint        # schema sanity, < 2s, must pass
pnpm registry:verify      # PMID resolution, ~30s, must pass
pnpm -r test              # solver + oplog + registry tests, must pass
git add -p packages/registry/data/compounds.json scripts/authoring/<dated-script>.ts packages/registry/data/AUTHORING_GAPS.md
git commit -m "data(registry): <one-line summary> · N entries authored, M skipped"
```

The CI gate runs on push; a clean local `registry:check` plus `pnpm -r test` is a strong predictor of green CI.

### 5. Update AUTHORING_GAPS.md

Every skip in step 3 corresponds to a row in [AUTHORING_GAPS.md](../../packages/registry/data/AUTHORING_GAPS.md). Future sessions skip the dead-end PMIDs the verifier already chased.

## Apply-script naming

`scripts/authoring/YYYY-MM-DD-short-slug.ts`. One script per session, dated for the session date (not the merge date). Multi-day projects can use multiple sessions; that's fine — just name each by the date you wrote it.

## When to skip

Skip an entry when:
- No primary-source PMID can be found via PubMed E-utilities for the value
- The abstract paraphrases the value rather than naming it
- The abstract names a value but the methodology is wrong (rat data when human is needed for clinical authoring; in vitro Ki at non-physiological pH; etc.)
- The mechanism doesn't fit the schema (Mg²⁺ NMDA block is voltage-dependent and Hill-occupancy doesn't apply; vitamin D3 is genomic; etc.)

Document the skip in AUTHORING_GAPS.md with one line per skip: which PMIDs were checked, why each was rejected, what would unlock authoring (usually full-text PDF access).

## When NOT to use this loop

- **Pure MW backfill.** MW is a chemistry fact; no verification needed beyond "is this molecule what its name says it is." Use the MW backfill script template directly, no agents needed.
- **Schema migrations.** When a new field is added to PkParams or InteractionRef, that's solver/code work first. Authoring follows once the schema lands.
- **Bulk slug renames.** Use a refactor script + re-run verify; not authoring.

## Throughput

The cadence holds because the agents do the literature work in parallel. A solo human pass would take 5× longer per session and most sessions would never start. Steady-state is 5–10 hours/week of human review against parallel-agent literature work.

For the targets each session is chipping away at — 1000+ compound catalog, 120 priority compounds at full Phase 4 depth, MM/2-comp/DDI coverage, MW backfill — see [`packages/registry/data/README.md`](../../packages/registry/data/README.md). That doc owns "what done means"; this one owns "how to chip at it."
