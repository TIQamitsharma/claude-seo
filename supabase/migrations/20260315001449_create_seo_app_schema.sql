/*
  # Claude SEO App — Initial Database Schema

  ## Summary
  Creates the core tables for the Claude SEO web application.

  ## New Tables

  ### `profiles`
  - Extends Supabase auth.users
  - Stores display name, avatar, DataForSEO API credentials
  - One row per authenticated user

  ### `projects`
  - Represents a website being tracked
  - Fields: name, URL, industry type, description
  - Belongs to one user

  ### `audits`
  - Represents a single SEO analysis run
  - Tracks command type (audit, page, technical, content, schema, sitemap, images, geo, plan, programmatic, competitor-pages, hreflang)
  - Status lifecycle: pending → running → completed | failed
  - Belongs to one project

  ### `audit_results`
  - Stores the structured JSON output of a completed audit
  - Includes overall score (0-100), category scores, raw result data
  - One-to-one with an audit

  ### `findings`
  - Individual SEO issues found during an audit
  - Severity: critical | warning | info
  - Category: technical | content | schema | performance | images | geo | sitemap | hreflang
  - Each finding has a title, description, and optional fix recommendation

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Profiles auto-created on user signup via trigger
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  dataforseo_login text DEFAULT '',
  dataforseo_password text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  industry text DEFAULT 'generic' CHECK (industry IN ('saas', 'ecommerce', 'local', 'publisher', 'agency', 'generic')),
  description text DEFAULT '',
  latest_score integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Audits table
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command text NOT NULL CHECK (command IN ('audit', 'page', 'technical', 'content', 'schema', 'sitemap', 'images', 'geo', 'plan', 'programmatic', 'competitor-pages', 'hreflang')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  url text NOT NULL,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audits"
  ON audits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audits"
  ON audits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audits"
  ON audits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audits"
  ON audits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audits_project_id ON audits(project_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);

-- Audit results table
CREATE TABLE IF NOT EXISTS audit_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL UNIQUE REFERENCES audits(id) ON DELETE CASCADE,
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score integer CHECK (technical_score >= 0 AND technical_score <= 100),
  content_score integer CHECK (content_score >= 0 AND content_score <= 100),
  schema_score integer CHECK (schema_score >= 0 AND schema_score <= 100),
  performance_score integer CHECK (performance_score >= 0 AND performance_score <= 100),
  images_score integer CHECK (images_score >= 0 AND images_score <= 100),
  geo_score integer CHECK (geo_score >= 0 AND geo_score <= 100),
  raw_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit results"
  ON audit_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_results.audit_id
      AND audits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own audit results"
  ON audit_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_results.audit_id
      AND audits.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_audit_results_audit_id ON audit_results(audit_id);

-- Findings table
CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info')),
  category text NOT NULL DEFAULT 'technical' CHECK (category IN ('technical', 'content', 'schema', 'performance', 'images', 'geo', 'sitemap', 'hreflang')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  recommendation text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own findings"
  ON findings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own findings"
  ON findings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own findings"
  ON findings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_findings_audit_id ON findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_findings_user_id ON findings(user_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category);
