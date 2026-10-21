-- ==============================================================================
-- inaquired Database Schema & Storage Configuration for Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY DEFAULT ('job_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6)),
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  company_name VARCHAR(120) NOT NULL,
  location VARCHAR(200) NOT NULL,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  work_arrangement VARCHAR(50) NOT NULL CHECK (work_arrangement IN ('remote', 'on-site', 'hybrid')),
  category VARCHAR(80) NOT NULL,
  experience_level VARCHAR(50) NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'internship')),
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  requirements TEXT NOT NULL,
  benefits TEXT,
  benefits_title TEXT,
  application_url TEXT NOT NULL,
  application_deadline DATE,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'system'
);

-- Indexes for ultra-fast candidate discovery
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_work_arrangement ON public.jobs (work_arrangement);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON public.jobs (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs (slug);

-- 3. Audit Logs Table (Immutable governance log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(255) NOT NULL,
  details TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published and archived jobs.
CREATE POLICY "Public users can view published jobs"
  ON public.jobs
  FOR SELECT
  USING (status IN ('published', 'archived'));

-- Explicit table grants (Supabase Data API compliance)
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT ALL ON public.jobs TO service_role;

-- Audit logs are strictly server-only
REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;

-- 5. Supabase Storage Egress Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('ap-northeast-1', 'ap-northeast-1', true)
ON CONFLICT (id) DO NOTHING;
