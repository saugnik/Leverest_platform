-- ============================================================
-- Leverest Fintech Platform — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'relation_partner',
  'relation_manager',
  'engagement_partner',
  'engagement_manager',
  'executive',
  'accounts',
  'mis',
  'engagement_assistant'
);

CREATE TYPE employee_type AS ENUM ('deal_team', 'supervision');
CREATE TYPE branch_type   AS ENUM ('kolkata', 'delhi', 'both');
CREATE TYPE company_type  AS ENUM ('mfg_service', 'nbfc');

CREATE TYPE pipeline_stage AS ENUM (
  'lead_received',
  'meeting_done',
  'docs_requested',
  'processing',
  'bank_connect',
  'proposal_sent',
  'bank_docs',
  'approved'
);

CREATE TYPE doc_status  AS ENUM ('received', 'pending', 'required');
CREATE TYPE file_source AS ENUM ('gmail', 'drive', 'manual');
CREATE TYPE query_source AS ENUM ('bank', 'internal');
CREATE TYPE query_status AS ENUM ('open', 'resolved');

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  email         TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  role          user_role NOT NULL,
  employee_type employee_type NOT NULL,
  branch        branch_type NOT NULL,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: projects
-- ============================================================
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name       TEXT NOT NULL,
  company_type      company_type NOT NULL,
  loan_type         TEXT,
  loan_amount       NUMERIC(18, 2),
  bank              TEXT,
  commission_percent NUMERIC(5, 2),
  stage             pipeline_stage NOT NULL DEFAULT 'lead_received',
  branch            branch_type NOT NULL,
  created_by        TEXT NOT NULL REFERENCES users(email),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: project_members
-- Critical: a user with no row here for a project cannot see it.
-- ============================================================
CREATE TABLE project_members (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_email  TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by TEXT NOT NULL REFERENCES users(email),
  PRIMARY KEY (project_id, user_email)
);

-- ============================================================
-- TABLE: client_spocs
-- ============================================================
CREATE TABLE client_spocs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  designation   TEXT,
  password_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, email)
);

-- ============================================================
-- TABLE: documents
-- ============================================================
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  category      TEXT NOT NULL,
  company_type  company_type NOT NULL,
  status        doc_status NOT NULL DEFAULT 'required',
  uploaded_at   TIMESTAMPTZ,
  uploaded_by   TEXT,
  file_source   file_source,
  file_url      TEXT,
  expiry_date   DATE
);

CREATE INDEX idx_documents_project_id ON documents(project_id);

-- ============================================================
-- TABLE: queries
-- ============================================================
CREATE TABLE queries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  source      query_source NOT NULL,
  raised_by   TEXT NOT NULL,
  status      query_status NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_queries_project_id ON queries(project_id);

-- ============================================================
-- TABLE: bank_suggestions
-- ============================================================
CREATE TABLE bank_suggestions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bank_name          TEXT NOT NULL,
  interest_rate      NUMERIC(5, 2),
  processing_days    INTEGER,
  commission_percent NUMERIC(5, 2),
  notes              TEXT,
  is_selected        BOOLEAN NOT NULL DEFAULT FALSE,
  suggested_by       TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_suggestions_project_id ON bank_suggestions(project_id);

-- ============================================================
-- TABLE: internal_notes (never exposed to clients)
-- ============================================================
CREATE TABLE internal_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_internal_notes_project_id ON internal_notes(project_id);

-- ============================================================
-- TABLE: activity_log
-- ============================================================
CREATE TABLE activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_email ON notifications(user_email);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_spocs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

-- ── Helper: is the caller an admin? ──────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM users WHERE email = auth.jwt() ->> 'email'),
    FALSE
  );
$$;

-- ── Helper: caller's email ────────────────────────────────────
CREATE OR REPLACE FUNCTION my_email()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- ── Helper: true if caller is in project_members for a project ──
CREATE OR REPLACE FUNCTION is_project_member(pid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = pid AND user_email = my_email()
  );
$$;

-- ── users table ──────────────────────────────────────────────
-- Anyone can view their own record; admin sees all
CREATE POLICY "users_select" ON users FOR SELECT
  USING (email = my_email() OR is_admin());

CREATE POLICY "users_admin_all" ON users FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── projects ─────────────────────────────────────────────────
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (is_admin() OR is_project_member(id));

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (is_admin() OR EXISTS (
    SELECT 1 FROM users
    WHERE email = my_email()
    AND role IN ('relation_partner', 'relation_manager')
  ));

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (is_admin() OR is_project_member(id));

-- ── project_members ──────────────────────────────────────────
CREATE POLICY "pm_select" ON project_members FOR SELECT
  USING (is_admin() OR user_email = my_email() OR is_project_member(project_id));

CREATE POLICY "pm_insert" ON project_members FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

-- ── client_spocs ─────────────────────────────────────────────
CREATE POLICY "spocs_select_internal" ON client_spocs FOR SELECT
  USING (is_admin() OR is_project_member(project_id));

-- SPOCs can read their own record (matched by custom claim if needed)
CREATE POLICY "spocs_insert" ON client_spocs FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

CREATE POLICY "spocs_update" ON client_spocs FOR UPDATE
  USING (is_admin() OR is_project_member(project_id));

-- ── documents ────────────────────────────────────────────────
CREATE POLICY "docs_select" ON documents FOR SELECT
  USING (is_admin() OR is_project_member(project_id));

CREATE POLICY "docs_insert" ON documents FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

CREATE POLICY "docs_update" ON documents FOR UPDATE
  USING (is_admin() OR is_project_member(project_id));

-- ── queries ──────────────────────────────────────────────────
CREATE POLICY "queries_select" ON queries FOR SELECT
  USING (is_admin() OR is_project_member(project_id));

CREATE POLICY "queries_insert" ON queries FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

CREATE POLICY "queries_update" ON queries FOR UPDATE
  USING (is_admin() OR is_project_member(project_id));

-- ── bank_suggestions ─────────────────────────────────────────
CREATE POLICY "banks_select" ON bank_suggestions FOR SELECT
  USING (is_admin() OR is_project_member(project_id));

CREATE POLICY "banks_insert" ON bank_suggestions FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

CREATE POLICY "banks_update" ON bank_suggestions FOR UPDATE
  USING (is_admin() OR is_project_member(project_id));

-- ── internal_notes (never client-accessible) ─────────────────
CREATE POLICY "notes_select" ON internal_notes FOR SELECT
  USING (is_admin() OR is_project_member(project_id));

CREATE POLICY "notes_insert" ON internal_notes FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

-- ── activity_log ─────────────────────────────────────────────
CREATE POLICY "activity_select" ON activity_log FOR SELECT
  USING (is_admin() OR is_project_member(project_id));

CREATE POLICY "activity_insert" ON activity_log FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(project_id));

-- ── notifications ────────────────────────────────────────────
CREATE POLICY "notif_select" ON notifications FOR SELECT
  USING (user_email = my_email() OR is_admin());

CREATE POLICY "notif_update" ON notifications FOR UPDATE
  USING (user_email = my_email() OR is_admin());

CREATE POLICY "notif_insert" ON notifications FOR INSERT
  WITH CHECK (is_admin() OR is_project_member(
    COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::UUID)
  ));

-- ============================================================
-- SEED: Initial admin user (update email/name as needed)
-- Run AFTER creating the user in Supabase Auth Dashboard
-- ============================================================
-- INSERT INTO users (email, name, role, employee_type, branch, is_admin)
-- VALUES ('admin@leverestfin.com', 'Platform Admin', 'relation_partner', 'supervision', 'both', TRUE);
