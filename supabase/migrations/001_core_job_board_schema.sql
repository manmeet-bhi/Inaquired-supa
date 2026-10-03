-- ==============================================================================
-- Production Migration: 001_core_job_board_schema.sql
-- Description: Core Job Board & Platform Catalog Schema
-- Components: Extensions, Jobs, Categories, Subscribers, Audit Logs, Hardened RLS
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Schema Migrations Table (For tracking database versioning & migrations)
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  checksum TEXT
);

-- 3. Jobs Table
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

-- Indexes for ultra-fast candidate discovery & search
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs (category);
CREATE INDEX IF NOT EXISTS idx_jobs_work_arrangement ON public.jobs (work_arrangement);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON public.jobs (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON public.jobs (slug);

-- 4. Categories & Departments Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT ('cat_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6)),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- Seed Initial Default Departments / Categories
INSERT INTO public.categories (id, name, slug, description)
VALUES 
  ('cat_eng', 'Engineering', 'engineering', 'Software, infrastructure, full-stack, QA, and security roles'),
  ('cat_design', 'Design & Creative', 'design-creative', 'Product design, UI/UX, brand, and design systems'),
  ('cat_product', 'Product Management', 'product-management', 'Product strategy, technical product management, and roadmapping'),
  ('cat_marketing', 'Marketing & Growth', 'marketing-growth', 'Performance marketing, content, community, and growth marketing'),
  ('cat_sales', 'Sales & Business Dev', 'sales-business-dev', 'Enterprise sales, SDR, account management, and partnerships'),
  ('cat_ops', 'Operations & Strategy', 'operations-strategy', 'Business operations, project management, and strategy'),
  ('cat_finance', 'Finance & Accounting', 'finance-accounting', 'FP&A, accounting, corporate finance, and compliance'),
  ('cat_support', 'Customer Success & Support', 'customer-success-support', 'Customer onboarding, client technical support, and account health'),
  ('cat_ai', 'Data & AI', 'data-ai', 'Machine learning, AI research, data engineering, and analytics'),
  ('cat_hr', 'Human Resources', 'human-resources', 'People operations, talent acquisition, and technical recruiting')
ON CONFLICT (slug) DO NOTHING;

-- 5. Subscribers Table for Email / Web Push Alerts
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  endpoint TEXT,
  categories TEXT[] DEFAULT '{}',
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table (Governance and platform activity log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id VARCHAR(100) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(255) NOT NULL,
  details TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row Level Security (RLS) - Hardened Production Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies on jobs
DROP POLICY IF EXISTS "Public users can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anon full access for jobs if configured" ON public.jobs;

-- Public candidates can only view published jobs
CREATE POLICY "Public users can view published jobs"
  ON public.jobs
  FOR SELECT
  USING (status = 'published');

-- Authenticated team members can view all jobs (including drafts and archives)
CREATE POLICY "Authenticated users can view all jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated admins and recruiters can manage jobs
CREATE POLICY "Authenticated users can manage jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Clean existing policies on categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow anon manage categories" ON public.categories;

-- Public can view departments/categories
CREATE POLICY "Public can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- Only authenticated team members can manage departments
CREATE POLICY "Authenticated admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
