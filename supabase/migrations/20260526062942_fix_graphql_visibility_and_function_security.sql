/*
  # Fix GraphQL schema visibility and SECURITY DEFINER function

  ## Summary
  Revokes public/anonymous SELECT grants on all app tables so they no longer
  appear in the GraphQL schema to unauthenticated users, and revokes SELECT
  grants from the generic `authenticated` role so table structure is not
  discoverable by every signed-in user (RLS policies already enforce per-user
  row access — this just removes the table from the GraphQL introspection for
  roles that should not see it).

  Also revokes EXECUTE on the `handle_new_user` trigger function from both
  `anon` and `authenticated` since it is only meant to be called internally
  by the database trigger, not via the REST API.

  ## Changes

  ### Tables affected
  - public.audit_results
  - public.audits
  - public.findings
  - public.profiles
  - public.projects

  ### Actions
  1. Revoke SELECT from `anon` on all five tables
  2. Revoke ALL from `anon` on all five tables (belt-and-suspenders)
  3. Revoke SELECT from `authenticated` on all five tables
  4. Re-grant SELECT (and necessary DML) to `authenticated` so RLS-gated
     queries continue to work
  5. Revoke EXECUTE on public.handle_new_user() from anon, authenticated,
     and PUBLIC so it cannot be called via REST API
*/

-- 1 & 2. Revoke all access from anon on all app tables
REVOKE ALL ON TABLE public.audit_results FROM anon;
REVOKE ALL ON TABLE public.audits FROM anon;
REVOKE ALL ON TABLE public.findings FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.projects FROM anon;

-- 3. Revoke SELECT from authenticated on all app tables
REVOKE SELECT ON TABLE public.audit_results FROM authenticated;
REVOKE SELECT ON TABLE public.audits FROM authenticated;
REVOKE SELECT ON TABLE public.findings FROM authenticated;
REVOKE SELECT ON TABLE public.profiles FROM authenticated;
REVOKE SELECT ON TABLE public.projects FROM authenticated;

-- 4. Re-grant minimum required permissions so RLS-gated queries still work
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.findings TO authenticated;
GRANT SELECT ON TABLE public.audit_results TO authenticated;

-- 5. Revoke EXECUTE on handle_new_user from all roles that should not call it
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
