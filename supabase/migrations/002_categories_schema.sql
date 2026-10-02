-- ==============================================================================
-- Migration: 002_categories_schema.sql
-- Description: Categories and Departments management table for inaquired
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT ('cat_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6)),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for URL slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated admins can manage categories" ON public.categories;
CREATE POLICY "Authenticated admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon manage categories" ON public.categories;
CREATE POLICY "Allow anon manage categories"
  ON public.categories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

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
