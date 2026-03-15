/*
  # Fix RLS Performance and Security Issues

  ## Changes

  1. RLS Policy Optimization
     - Replace `auth.uid()` with `(select auth.uid())` in all policies across all tables
     - This prevents re-evaluation of auth functions for every row, significantly improving query performance at scale

  2. Tables affected
     - profiles: view, insert, update policies
     - projects: view, insert, update, delete policies
     - audits: view, insert, update, delete policies
     - audit_results: view, insert policies
     - findings: view, insert, delete policies

  3. Security Fix
     - Set `search_path = ''` on handle_new_user() function to prevent search path injection attacks

  4. Index Cleanup
     - Drop unused indexes to reduce write overhead (they will be recreated if queries need them)
*/

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================
-- PROJECTS
-- ============================================================
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- AUDITS
-- ============================================================
DROP POLICY IF EXISTS "Users can view own audits" ON audits;
DROP POLICY IF EXISTS "Users can insert own audits" ON audits;
DROP POLICY IF EXISTS "Users can update own audits" ON audits;
DROP POLICY IF EXISTS "Users can delete own audits" ON audits;

CREATE POLICY "Users can view own audits"
  ON audits FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own audits"
  ON audits FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own audits"
  ON audits FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own audits"
  ON audits FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- AUDIT_RESULTS
-- ============================================================
DROP POLICY IF EXISTS "Users can view own audit results" ON audit_results;
DROP POLICY IF EXISTS "Users can insert own audit results" ON audit_results;

CREATE POLICY "Users can view own audit results"
  ON audit_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_results.audit_id
      AND audits.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own audit results"
  ON audit_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_results.audit_id
      AND audits.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- FINDINGS
-- ============================================================
DROP POLICY IF EXISTS "Users can view own findings" ON findings;
DROP POLICY IF EXISTS "Users can insert own findings" ON findings;
DROP POLICY IF EXISTS "Users can delete own findings" ON findings;

CREATE POLICY "Users can view own findings"
  ON findings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own findings"
  ON findings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own findings"
  ON findings FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- FIX handle_new_user SEARCH PATH
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- DROP UNUSED INDEXES
-- ============================================================
DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_audits_project_id;
DROP INDEX IF EXISTS idx_audits_user_id;
DROP INDEX IF EXISTS idx_audits_status;
DROP INDEX IF EXISTS idx_audits_created_at;
DROP INDEX IF EXISTS idx_audit_results_audit_id;
DROP INDEX IF EXISTS idx_findings_audit_id;
DROP INDEX IF EXISTS idx_findings_user_id;
DROP INDEX IF EXISTS idx_findings_severity;
DROP INDEX IF EXISTS idx_findings_category;
