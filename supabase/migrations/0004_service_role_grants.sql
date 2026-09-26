-- xenobiotics v12 · 0004_service_role_grants
--
-- 0001–0003 granted the two schemas to `anon` and `authenticated` and stopped
-- there, which is the right instinct — those are the roles a browser can reach,
-- and everything about them is deliberately narrow. But `service_role` got
-- nothing, and it is the role that has to do the work no user can:
--
--   · the initial seed import, which runs before any curator exists and so
--     cannot satisfy the curator policy by definition — a bootstrap problem
--     the service key exists to break;
--   · scripts/push-bundle.ts, which publishes a built registry bundle and
--     upserts the manifest row.
--
-- `service_role` bypasses RLS by design, so these grants do not widen what any
-- *user* can do. They are the difference between the maintenance path working
-- and failing with "permission denied for schema registry", which is exactly
-- how the first seed run failed.
--
-- Keep the key off every client. It is not a stronger login; it is the absence
-- of a login.

grant usage on schema app to service_role;
grant usage on schema registry to service_role;

grant all privileges on all tables in schema app to service_role;
grant all privileges on all tables in schema registry to service_role;
grant all privileges on all sequences in schema app to service_role;
grant all privileges on all sequences in schema registry to service_role;
grant all privileges on all functions in schema app to service_role;
grant all privileges on all functions in schema registry to service_role;

-- A table added by a later migration would otherwise land ungranted and break
-- the maintenance path again, at whatever future moment someone next runs it.
alter default privileges in schema app
  grant all privileges on tables to service_role;
alter default privileges in schema registry
  grant all privileges on tables to service_role;
alter default privileges in schema app
  grant all privileges on sequences to service_role;
alter default privileges in schema registry
  grant all privileges on sequences to service_role;
alter default privileges in schema registry
  grant all privileges on functions to service_role;
