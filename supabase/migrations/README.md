# Registry migrations

Copied VERBATIM from the v12 app repo (`v12/supabase/migrations/`) and
deliberately not renumbered, so a diff against that repo stays readable.

**`0001_app.sql` is absent on purpose.** It creates the `app` schema — devices,
ops, profiles, billing — which is the application's concern and not this
project's. That has one consequence worth knowing before you run these against a
fresh Supabase project:

- **`0004_service_role_grants.sql` grants on BOTH schemas** (`grant usage on
schema app to service_role`) and will fail here with _permission denied_ /
  _schema "app" does not exist_. Drop the two `app` lines, or apply it only to a
  project that already has the app schema. It is left unedited rather than
  silently forked, because a migration that differs from the one the app repo
  ran is worse than one that needs a documented edit.

The other four are self-contained: `0002` creates the `registry` schema and its
tables, `0003` the authoring RPCs plus `compound_revision` and `authoring_gap`,
`0005` catalog metadata, `0006` the delete path.

Nothing in this project needs a database to run. The gates read the JSON; the
database is a publication target reached through `registry:seed` and
`registry:push`.
