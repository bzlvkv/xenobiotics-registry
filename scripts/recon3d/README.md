# Recon3D ETL

Cross-reference v8's hand-authored pathway registry against the
**Recon3D** human metabolic reconstruction (Brunk et al. 2018,
[PMID:29457794](https://pubmed.ncbi.nlm.nih.gov/29457794/)).

Recon3D is a genome-scale model: ~13k reactions, ~4k metabolites,
~2k genes, grouped into ~111 named _subsystems_. It is the canonical
public reference for human metabolism and is hosted at
[vmh.life](https://www.vmh.life/) (Virtual Metabolic Human project).

## Cross-reference fields

| Field on v8                        | Recon3D entity     | Shape                                 |
| ---------------------------------- | ------------------ | ------------------------------------- |
| `Pathway.recon3d_subsystem`        | Subsystem name     | `string` (e.g. `"Citric acid cycle"`) |
| `PathwayStep.recon3d_reaction_ids` | BiGG reaction IDs  | `string[]` (e.g. `["HEX1", "PGI"]`)   |
| `Compound.recon3d_metabolite_id`   | BiGG metabolite ID | `string` (e.g. `"atp"`, `"glc__D"`)   |
| `Compound.recon3d_gene_symbol`     | HGNC gene symbol   | `string` (e.g. `"TPH2"`)              |

BiGG IDs are case-sensitive and use double-underscore for compartment
qualifiers (`atp_c` = cytoplasmic ATP). v8 stores the bare ID without
the compartment suffix — compartmentalization is a Recon3D concern,
not a v8 one.

## Files

- `scripts/recon3d/rebuild-map.ts` — derives `recon3d-map.json` from
  the current `pathways.json`. Run after any edit to a pathway's
  `recon3d_subsystem` field.
- `scripts/recon3d/import-skeleton.ts` — skeleton for the full Recon3D
  ingestion. Network-gated by `--fetch` flag; without it, the script
  is a dry-run that only validates the existing map. To run a true
  ingestion, supply `--fetch` and a path to a downloaded
  `Recon3D.json` from the VMH download portal.
- `packages/registry/data/recon3d-map.json` — version-controlled
  snapshot of the subsystem ↔ pathway alignment.
- `packages/registry/src/recon3d.ts` — runtime lookup helpers
  (`buildSubsystemIndex`, `findSiblings`, `vmhSubsystemUrl`, …).

## Why not auto-fetch?

The full Recon3D JSON is ~80 MB and changes only on major releases.
Auto-fetching at build time would slow CI for a near-static resource.
The downloaded file should be cached locally outside the repo (e.g.
`~/.cache/recon3d/Recon3D.json`) and the ingestion script run by hand
when the upstream version bumps.
