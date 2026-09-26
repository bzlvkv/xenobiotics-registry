-- xenobiotics v12 · 0002_registry · the cited reference catalog
--
-- THE CHANGE THAT DEFINES v12: this schema is the registry's SOURCE OF TRUTH,
-- not a projection of it.
--
-- In v8 the canonical registry was version-controlled JSON — compounds.json and
-- friends — and these tables were a downstream copy pushed by a build script.
-- The discipline lived in git: 300+ dated idempotent apply-scripts, reviewable
-- diffs, `data-lint` and a live NCBI PMID check at push time.
--
-- Moving authoring into the database moves that discipline with it, or the moat
-- is gone. Three things carry it (see 0003_registry_authoring.sql):
--   · every write is recorded in registry.compound_revision — who, when, what
--     changed, and WHY. That replaces git history, and it is not optional.
--   · every cited PMID carries a verification status and timestamp, so an
--     unverified citation is visibly unverified rather than quietly assumed.
--   · a skip is a deliverable: registry.authoring_gap records the cells that
--     were investigated and could not be honestly filled, with the candidate
--     PMIDs that were chased. "Finished" means no unvisited cells, not every
--     cell filled.
--
-- READ PATH. Clients do not query these tables row by row. Authoring writes
-- here; a Publish action builds a content-addressed bundle, uploads it to
-- Storage, and upserts one bundle_manifest row. Clients fetch that bundle once,
-- cache it in IndexedDB, and revalidate against the manifest version — so the
-- app still works with no network, which is the whole point of local-first.

create schema if not exists registry;
grant usage on schema registry to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- compound — one row per slug, full record in `data`
-- ─────────────────────────────────────────────────────────────────────────────
-- `data` is the entire Compound object as the Zod loader in @xeno/registry
-- defines it. Kept as one jsonb document rather than shredded into columns
-- because the loader is the schema: one validator, used by the app, the solver,
-- the authoring UI and the publish step alike. Shredding would create a second,
-- drifting definition.
--
-- The promoted columns exist only for indexing and for the authoring list view.

create table registry.compound (
  slug          text primary key,
  name          text not null,
  aliases       text[] not null default '{}'::text[],
  category      text not null,
  /* Retired slugs this record absorbed, so an intake logged under an old name
     still resolves. The September 2026 identity merges retired 16 of them, and
     user data is never rewritten — the lookup forwards instead. */
  retired_slugs text[] not null default '{}'::text[],
  /* 'authored' — has at least one cited pk[route]
     'unauthored' — carries an explicit pk_unauthored reason
     'draft' — in progress, excluded from published bundles */
  pk_status     text not null default 'draft'
                check (pk_status in ('authored', 'unauthored', 'draft')),
  data          jsonb not null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id) on delete set null
);

create index compound_category on registry.compound (category);
create index compound_aliases on registry.compound using gin (aliases);
create index compound_retired on registry.compound using gin (retired_slugs);
create index compound_pk_status on registry.compound (pk_status);

-- ─────────────────────────────────────────────────────────────────────────────
-- pathway / receptor — the other two published datasets
-- ─────────────────────────────────────────────────────────────────────────────
-- v8 had no tables for these at all; they only ever existed as JSON. Same
-- document-in-jsonb treatment, same reason.

create table registry.pathway (
  slug       text primary key,
  name       text not null,
  category   text not null,
  systems    text[] not null default '{}'::text[],
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index pathway_category on registry.pathway (category);

create table registry.receptor (
  key        text primary key,
  name       text not null,
  family     text,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index receptor_family on registry.receptor (family);

-- ─────────────────────────────────────────────────────────────────────────────
-- reference — one row per cited PMID, with its verification state
-- ─────────────────────────────────────────────────────────────────────────────
-- In v8 this was the shadow of `pnpm registry:verify`, a batch job that walked
-- every PMID against NCBI ESummary at push time. Here it is a first-class
-- record, because the gate it enforces only means something if it is checked
-- when a value is authored rather than minutes before a release.
--
-- `verified_at` null means NOT YET CHECKED, which the authoring UI must show as
-- such. A citation nobody has resolved is not evidence.
--
-- Note what this gate can and cannot do: it proves the identifier resolves to a
-- real, correctly-attributed paper. It CANNOT prove the abstract states the
-- value hung on it. Thirty-plus such cases were the single largest defect class
-- found in v8's catalog — a real paper, cited for a number it never mentions.
-- Only a human reading the abstract closes that gap.

create table registry.reference (
  pmid        text primary key,
  title       text,
  year        int,
  authors     text[],
  journal     text,
  doi         text,
  /* 'ok' — ESummary resolved it
     'dead' — the identifier does not resolve
     'error' — the check itself failed (network, rate limit); retry, don't trust */
  status      text check (status in ('ok', 'dead', 'error')),
  verified_at timestamptz,
  data        jsonb not null default '{}'::jsonb
);

create index reference_year on registry.reference (year);
create index reference_unverified on registry.reference (pmid) where verified_at is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- interaction — directed edges between compounds
-- ─────────────────────────────────────────────────────────────────────────────
-- Drives the solver's DDI pass (CYP inhibition and induction, plasma-binding
-- displacement) and the interactions panel. Coefficients live in `data` because
-- they differ by kind: a Ki edge and an induction edge share no fields.

create table registry.interaction (
  a_slug     text not null references registry.compound (slug) on delete cascade,
  b_slug     text not null references registry.compound (slug) on delete cascade,
  kind       text not null,
  /* v5's six-tier scale, carried forward unchanged because it is good:
     synergistic | beneficial | caution | warn | major | contraindicated */
  level      text not null
             check (level in ('synergistic', 'beneficial', 'caution', 'warn', 'major', 'contraindicated')),
  refs       text[] not null default '{}'::text[],
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (a_slug, b_slug, kind)
);

create index interaction_a on registry.interaction (a_slug);
create index interaction_b on registry.interaction (b_slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- bundle_manifest — what is currently published
-- ─────────────────────────────────────────────────────────────────────────────
-- One row per published bundle version, history kept, so a rollback is just
-- pointing at an older row. `version` is the content hash from build-bundle, so
-- republishing identical data is a no-op rather than a new version.

create table registry.bundle_manifest (
  version        text primary key,
  schema_version int not null,
  generated_at   timestamptz not null,
  /* per-dataset {count, bytes, gzipBytes, sha256} */
  datasets       jsonb not null,
  storage_base   text,
  published_at   timestamptz not null default now(),
  published_by   uuid references auth.users(id) on delete set null
);

create index bundle_manifest_published on registry.bundle_manifest (published_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Access — world-readable reference data; writes gated in 0003
-- ─────────────────────────────────────────────────────────────────────────────
-- The catalog is public by design: it is a cited reference, and the library
-- surfaces are the only indexable pages the app has. RLS is still enabled on
-- every table so the write policies in 0003 have something to attach to —
-- a table without RLS ignores policies entirely.

alter table registry.compound enable row level security;
alter table registry.pathway enable row level security;
alter table registry.receptor enable row level security;
alter table registry.reference enable row level security;
alter table registry.interaction enable row level security;
alter table registry.bundle_manifest enable row level security;

create policy compound_public_read on registry.compound for select using (true);
create policy pathway_public_read on registry.pathway for select using (true);
create policy receptor_public_read on registry.receptor for select using (true);
create policy reference_public_read on registry.reference for select using (true);
create policy interaction_public_read on registry.interaction for select using (true);
create policy bundle_manifest_public_read on registry.bundle_manifest for select using (true);

grant select on all tables in schema registry to anon, authenticated;
