-- xenobiotics v12 · 0003_registry_authoring · the discipline, as machinery
--
-- The registry's value is not the data. It is that every number in it can be
-- traced to a source that actually states it, and that the cells nobody could
-- honestly fill are recorded as such rather than quietly guessed.
--
-- In v8 that discipline was carried by git and a push-time linter. Authoring in
-- a database has to carry it in tables, or "put the registry in a database"
-- silently means "abandon the thing that made the registry worth having". These
-- four tables are that carry.

-- ─────────────────────────────────────────────────────────────────────────────
-- curator — who may author
-- ─────────────────────────────────────────────────────────────────────────────
-- Membership, not a JWT claim, so granting and revoking is a row and shows up
-- in the audit trail like everything else.

create table registry.curator (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'curator' check (role in ('curator', 'admin')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  note       text
);

alter table registry.curator enable row level security;

-- Curators can see the roster; only admins change it. `security definer` so the
-- policy functions below don't recurse through this table's own RLS.
create function registry.is_curator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from registry.curator c where c.user_id = auth.uid());
$$;

create function registry.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from registry.curator c where c.user_id = auth.uid() and c.role = 'admin'
  );
$$;

create policy curator_read on registry.curator
  for select using (registry.is_curator());
create policy curator_admin_write on registry.curator
  for all using (registry.is_admin()) with check (registry.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- compound_revision — what replaces git history
-- ─────────────────────────────────────────────────────────────────────────────
-- Full before/after snapshots rather than a diff. Compounds are a couple of KB;
-- storing both halves means any past state can be reconstructed exactly and a
-- bad edit can be reverted without reasoning about patch application. Cheap
-- insurance for the one asset that would take months to re-author.
--
-- `note` is the WHY, and it is NOT NULL on purpose. v8's apply-scripts each
-- carried their reasoning in a header comment, and that prose is how a later
-- reader knows whether a value was read off an abstract, derived, or estimated.
-- A revision without a reason is how a catalog rots.

create table registry.compound_revision (
  id          bigserial primary key,
  slug        text not null,
  /* 'create' | 'update' | 'delete' | 'retire' (merged into another slug) */
  action      text not null check (action in ('create', 'update', 'delete', 'retire')),
  before      jsonb,
  after       jsonb,
  note        text not null,
  author      uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index compound_revision_slug on registry.compound_revision (slug, created_at desc);
create index compound_revision_author on registry.compound_revision (author, created_at desc);

alter table registry.compound_revision enable row level security;

-- The audit trail is public: it is the provenance, and hiding it would defeat
-- the point of keeping it. Append-only even for curators — no update, no delete
-- policy exists, so a revision cannot be quietly rewritten.
create policy revision_public_read on registry.compound_revision
  for select using (true);
create policy revision_curator_insert on registry.compound_revision
  for insert with check (registry.is_curator() and author = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- authoring_gap — the skips, which are deliverables
-- ─────────────────────────────────────────────────────────────────────────────
-- v8 kept these as prose in AUTHORING_GAPS.md, FULLTEXT_QUEUE.md and
-- PDF_QUEUE_*.md — thousands of lines recording which cells were investigated
-- and why they could not be filled, with the candidate PMIDs that were chased.
--
-- That file WAS the definition of done: the registry is finished when there are
-- no unvisited cells, not when every cell is filled. As rows, the same record
-- becomes queryable — "show me every compound whose ka is blocked on paywalled
-- full text" is a question, not a grep.
--
-- Worked example of why `status = 'blocked'` has to exist: all five queued
-- parent→metabolite chains (codeine→morphine, risperidone→paliperidone,
-- imipramine→desipramine, amitriptyline→nortriptyline,
-- mitragynine→7-hydroxymitragynine) need a molar formation fraction that a
-- 2026-09-08 sweep found in no open abstract or PMC full text. The solver
-- implements the whole model; the data cannot be authored honestly. That is a
-- blocked cell, not a missing one, and the difference matters.

create table registry.authoring_gap (
  id              bigserial primary key,
  slug            text not null,
  /* the cell: 'pk.PO.ka', 'effect_compartment.keo', 'metabolites', … */
  field           text not null,
  /* 'open' — not yet investigated
     'blocked' — investigated; no source states the value (paywalled, unpublished)
     'skipped' — investigated; the model does not fit this compound
     'resolved' — since authored */
  status          text not null default 'open'
                  check (status in ('open', 'blocked', 'skipped', 'resolved')),
  reason          text not null,
  /* every PMID that was chased and did not carry the value */
  candidate_pmids text[] not null default '{}'::text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  author          uuid references auth.users(id) on delete set null,
  unique (slug, field)
);

create index authoring_gap_status on registry.authoring_gap (status);
create index authoring_gap_slug on registry.authoring_gap (slug);

alter table registry.authoring_gap enable row level security;

create policy gap_public_read on registry.authoring_gap
  for select using (true);
create policy gap_curator_write on registry.authoring_gap
  for all using (registry.is_curator()) with check (registry.is_curator());

-- ─────────────────────────────────────────────────────────────────────────────
-- Write access to the catalog itself
-- ─────────────────────────────────────────────────────────────────────────────
-- Public read came from 0002. Writes are curators only. Nothing here lets an
-- ordinary signed-in account touch the reference data.

create policy compound_curator_write on registry.compound
  for all using (registry.is_curator()) with check (registry.is_curator());
create policy pathway_curator_write on registry.pathway
  for all using (registry.is_curator()) with check (registry.is_curator());
create policy receptor_curator_write on registry.receptor
  for all using (registry.is_curator()) with check (registry.is_curator());
create policy reference_curator_write on registry.reference
  for all using (registry.is_curator()) with check (registry.is_curator());
create policy interaction_curator_write on registry.interaction
  for all using (registry.is_curator()) with check (registry.is_curator());
create policy bundle_manifest_curator_write on registry.bundle_manifest
  for all using (registry.is_curator()) with check (registry.is_curator());

grant select, insert, update, delete
  on registry.compound, registry.pathway, registry.receptor,
     registry.reference, registry.interaction, registry.bundle_manifest,
     registry.authoring_gap, registry.curator
  to authenticated;
grant select, insert on registry.compound_revision to authenticated;
grant usage on sequence registry.compound_revision_id_seq to authenticated;
grant usage on sequence registry.authoring_gap_id_seq to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- A revision is not optional
-- ─────────────────────────────────────────────────────────────────────────────
-- Enforced in the database rather than trusted to the authoring UI, because an
-- audit trail that a client can forget to write is not an audit trail. The
-- trigger reads a note the caller sets for the transaction:
--
--   select set_config('registry.note', 'ka from Tmax, PMID:12345678', true);
--   update registry.compound set data = … where slug = 'caffeine';
--
-- With no note set, the write is REJECTED. That is deliberately annoying: it is
-- the one place where making the easy thing hard is correct.

create function registry.record_compound_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text := nullif(current_setting('registry.note', true), '');
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
  elsif new.pk_status = 'draft' and old.pk_status <> 'draft' then
    v_action := 'update';
  else
    v_action := 'update';
  end if;

  if v_note is null then
    raise exception
      'registry.compound write needs a reason: select set_config(''registry.note'', ''why'', true) first'
      using errcode = 'check_violation';
  end if;

  insert into registry.compound_revision (slug, action, before, after, note, author)
  values (
    coalesce(new.slug, old.slug),
    v_action,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    v_note,
    auth.uid()
  );

  return coalesce(new, old);
end;
$$;

create trigger compound_revision_trigger
  after insert or update or delete on registry.compound
  for each row execute function registry.record_compound_revision();

-- ─────────────────────────────────────────────────────────────────────────────
-- save_compound — the ergonomic write path
-- ─────────────────────────────────────────────────────────────────────────────
-- The trigger above demands a reason via `set_config`, which is fine from psql
-- and impossible from PostgREST: a REST call cannot run a statement before its
-- insert. Without this RPC the authoring UI could not write at all, and the
-- seed importer would have to hold a direct Postgres connection.
--
-- So the note becomes a REQUIRED ARGUMENT instead of an ambient setting. That is
-- the better shape anyway — a caller cannot forget a parameter the signature
-- insists on, whereas it can absolutely forget a set_config.
--
-- `security invoker` is load-bearing: this runs as the CALLER, so the curator
-- policy and RLS still apply. A `security definer` here would hand every signed
-- in account write access to the catalog.

create function registry.save_compound(
  p_slug text,
  p_data jsonb,
  p_note text,
  p_pk_status text default 'draft'
)
returns registry.compound
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row registry.compound;
begin
  if p_note is null or btrim(p_note) = '' then
    raise exception 'a reason is required: what did you change, and on what evidence?'
      using errcode = 'check_violation';
  end if;

  perform set_config('registry.note', p_note, true);

  insert into registry.compound (slug, name, aliases, category, retired_slugs, pk_status, data, updated_by)
  values (
    p_slug,
    coalesce(p_data ->> 'name', p_slug),
    coalesce(
      (select array_agg(value #>> '{}') from jsonb_array_elements(p_data -> 'aliases')),
      '{}'::text[]
    ),
    coalesce(p_data ->> 'category', 'other'),
    coalesce(
      (select array_agg(value #>> '{}') from jsonb_array_elements(p_data -> 'retired_slugs')),
      '{}'::text[]
    ),
    p_pk_status,
    p_data,
    auth.uid()
  )
  on conflict (slug) do update
    set name          = excluded.name,
        aliases       = excluded.aliases,
        category      = excluded.category,
        retired_slugs = excluded.retired_slugs,
        pk_status     = excluded.pk_status,
        data          = excluded.data,
        updated_at    = now(),
        updated_by    = excluded.updated_by
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function registry.save_compound(text, jsonb, text, text) to authenticated;

-- Bulk variant. The initial import is 1,217 compounds, and a re-author pass can
-- touch hundreds; one RPC per row would be that many round trips and a partial
-- failure halfway through. This applies the whole batch in ONE transaction, so
-- it either all lands or none of it does — which is what you want when the thing
-- being written is the catalog.
--
-- `p_rows` is a jsonb array of Compound documents. Same note requirement, same
-- `security invoker` posture, same revision row per compound.

create function registry.save_compounds(
  p_rows jsonb,
  p_note text,
  p_pk_status text default 'draft'
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row jsonb;
  v_n integer := 0;
begin
  if p_note is null or btrim(p_note) = '' then
    raise exception 'a reason is required for every registry write'
      using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be a jsonb array of compound documents';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    -- `_pk_status` is a per-row override the caller may attach; strip it before
    -- storing so it never pollutes the Compound document itself.
    perform registry.save_compound(
      v_row ->> 'slug',
      v_row - '_pk_status',
      p_note,
      coalesce(v_row ->> '_pk_status', p_pk_status)
    );
    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;

grant execute on function registry.save_compounds(jsonb, text, text) to authenticated;
