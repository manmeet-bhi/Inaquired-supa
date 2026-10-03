-- ==============================================================================
-- Production Migration: 005_seo_engine_and_redirects.sql
-- Description: Dynamic Job SEO Columns, Redirect Management & Change History Tracking
-- Components: jobs table extensions, seo_redirects, seo_audit_log, RLS policies
-- ==============================================================================

-- 1. Extend Jobs Table with Optional SEO Overrides
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_image_url TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS no_index BOOLEAN DEFAULT FALSE;

-- 2. SEO Redirect Management Table (301 / 308 Permanent & 302 / 307 Temporary)
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id TEXT PRIMARY KEY DEFAULT ('redir_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6)),
  source_path VARCHAR(500) NOT NULL UNIQUE,
  destination_path VARCHAR(500) NOT NULL,
  status_code INT NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_redirects_source ON public.seo_redirects (source_path) WHERE is_active = TRUE;

-- 3. SEO Change Audit Trail
CREATE TABLE IF NOT EXISTS public.seo_audit_log (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  admin_email VARCHAR(150),
  action VARCHAR(50) NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_audit_log_entity ON public.seo_audit_log (entity_type, entity_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active redirects" ON public.seo_redirects;
DROP POLICY IF EXISTS "Authenticated admins can manage redirects" ON public.seo_redirects;
DROP POLICY IF EXISTS "Authenticated admins can read and create audit logs" ON public.seo_audit_log;

-- Allow public and server middleware to read active redirects
CREATE POLICY "Public can read active redirects"
  ON public.seo_redirects
  FOR SELECT
  USING (is_active = TRUE);

-- Authenticated admins can manage all redirects
CREATE POLICY "Authenticated admins can manage redirects"
  ON public.seo_redirects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated admins can manage audit logs
CREATE POLICY "Authenticated admins can read and create audit logs"
  ON public.seo_audit_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
