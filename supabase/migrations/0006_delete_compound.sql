-- xenobiotics v12 · 0006_delete_compound · the write path 0003 left out
--
-- 0003 gave the catalog an ergonomic INSERT/UPDATE (`save_compound`) that takes
-- the mandatory revision note as an argument, because the trigger demands one
-- via `set_config` and a PostgREST call cannot run a statement before its own.
--
-- The same argument applies to DELETE, and it had no equivalent — so a delete
-- was impossible from anywhere except psql. Not refused with a reason: it
-- raised `registry.compound write needs a reason`, which reads like the caller
-- forgot something they had no way to supply. `compound_revision.action` has
-- allowed 'delete' and 'retire' since 0003, so the trail was always expecting
-- this to exist.
--
-- Deleting reference data is usually the wrong move. A compound that turned out
-- to be a duplicate should be RETIRED into the record that absorbed it, so
-- `retired_slugs` keeps forwarding the intakes people already logged under it —
-- that is the whole reason forwarding exists. Delete is for records that should
-- never have existed at all, which is why the note is required and the trail
-- keeps the full `before` document either way.

create function registry.delete_compound(p_slug text, p_note text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_note is null or btrim(p_note) = '' then
    raise exception 'a reason is required: why should this record not exist?'
      using errcode = 'check_violation';
  end if;

  perform set_config('registry.note', p_note, true);

  delete from registry.compound where slug = p_slug;
  if not found then
    raise exception 'no compound with the slug %', p_slug using errcode = 'no_data_found';
  end if;
end;
$$;

grant execute on function registry.delete_compound(text, text) to authenticated;
