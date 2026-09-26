-- xenobiotics v12 · 0005_catalog_meta · dataset-level provenance
--
-- Not every fact about a dataset belongs to a row in it. The receptor catalog
-- is generated from the IUPHAR/BPS Guide to PHARMACOLOGY and carries a `meta`
-- block naming the source, its URL, the release version and the date it was
-- fetched. `registry.receptor` stores one row per target and has nowhere to put
-- that, so the seed dropped it.
--
-- Which was invisible while everything downstream read receptors.json. Reading
-- the catalog back out of Postgres surfaces it immediately: the app's own Zod
-- loader requires `meta`, so the reconstructed document fails to load, and the
-- honest fix is to keep the provenance rather than to synthesise a plausible
-- one at read time. A citation the database invented is exactly what this
-- registry exists not to publish.

create table registry.catalog_meta (
  /* the dataset this describes — 'receptors', and whatever later needs one */
  dataset    text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table registry.catalog_meta enable row level security;

create policy catalog_meta_public_read on registry.catalog_meta
  for select using (true);
create policy catalog_meta_curator_write on registry.catalog_meta
  for all using (registry.is_curator()) with check (registry.is_curator());

grant select on registry.catalog_meta to anon, authenticated;
grant insert, update, delete on registry.catalog_meta to authenticated;

-- The receptor catalog's own provenance, as `scripts/build-receptor-catalog.ts`
-- writes it into receptors.json. Inserted here rather than left to the seed
-- script because the seed is a one-time job that has already run against the
-- live project, and a migration is the only thing that reaches a database
-- someone else stands up tomorrow.
insert into registry.catalog_meta (dataset, data)
values (
  'receptors',
  jsonb_build_object(
    'source', 'IUPHAR/BPS Guide to PHARMACOLOGY',
    'url', 'https://www.guidetopharmacology.org/',
    'version', '2026.1',
    'fetched', '2026-05-28',
    'note', 'receptors = non-olfactory/non-taste GPCRs. nonGpcrTargets = the non-GPCR targets (enzymes/transporters/ion channels/nuclear receptors/immune) the registry binds, by occupancy key. Nomenclature reference (name/family/gene); no per-row PMID by design.'
  )
)
on conflict (dataset) do nothing;
