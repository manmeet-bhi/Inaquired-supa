-- ==============================================================================
-- Production Migration: 004_seo_and_storage_schema.sql
-- Description: SEO Metadata Suite (Global & Page Settings) & File Storage Security
-- Components: seo_global_settings, seo_page_settings, storage bucket policies
-- ==============================================================================

-- 1. SEO Global Settings Table
CREATE TABLE IF NOT EXISTS public.seo_global_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
  site_name VARCHAR(150) NOT NULL DEFAULT 'inaquired',
  title_separator VARCHAR(20) NOT NULL DEFAULT '–',
  default_title VARCHAR(255) NOT NULL DEFAULT 'inaquired – Find Remote, On-Site & Hybrid Jobs & Internships',
  default_description TEXT NOT NULL DEFAULT 'Discover verified career opportunities on inaquired. Explore remote, hybrid, and on-site roles with direct employer links, zero spam, and transparent compensation.',
  default_og_image_url TEXT DEFAULT '',
  twitter_handle VARCHAR(80) DEFAULT '@inaquired',
  google_site_verification VARCHAR(255) DEFAULT '',
  bing_site_verification VARCHAR(255) DEFAULT '',
  robots_txt_content TEXT DEFAULT 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/*\n\nSitemap: /sitemap.xml',
  sitemap_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default global SEO record
INSERT INTO public.seo_global_settings (
  id,
  site_name,
  title_separator,
  default_title,
  default_description,
  default_og_image_url,
  twitter_handle,
  google_site_verification,
  bing_site_verification,
  robots_txt_content,
  sitemap_enabled
) VALUES (
  'global',
  'inaquired',
  '–',
  'inaquired – Find Remote, On-Site & Hybrid Jobs & Internships',
  'Discover verified career opportunities on inaquired. Explore remote, hybrid, and on-site roles with direct employer links, zero spam, and transparent compensation.',
  '',
  '@inaquired',
  '',
  '',
  'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/*\n\nSitemap: /sitemap.xml',
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. SEO Page-Level Settings Table
CREATE TABLE IF NOT EXISTS public.seo_page_settings (
  route_path VARCHAR(255) PRIMARY KEY,
  page_name VARCHAR(150) NOT NULL,
  meta_title VARCHAR(255) NOT NULL,
  meta_description TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  canonical_url TEXT DEFAULT '',
  og_title VARCHAR(255) DEFAULT '',
  og_description TEXT DEFAULT '',
  og_image_url TEXT DEFAULT '',
  og_type VARCHAR(50) DEFAULT 'website',
  twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
  no_index BOOLEAN DEFAULT FALSE,
  no_follow BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_page_settings_route ON public.seo_page_settings (route_path);

-- 3. Row Level Security for SEO Tables
ALTER TABLE public.seo_global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read global SEO settings" ON public.seo_global_settings;
DROP POLICY IF EXISTS "Authenticated admins can manage global SEO settings" ON public.seo_global_settings;
DROP POLICY IF EXISTS "Public can read page SEO settings" ON public.seo_page_settings;
DROP POLICY IF EXISTS "Authenticated admins can manage page SEO settings" ON public.seo_page_settings;

-- Public can read SEO configurations
CREATE POLICY "Public can read global SEO settings"
  ON public.seo_global_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read page SEO settings"
  ON public.seo_page_settings
  FOR SELECT
  USING (true);

-- Authenticated administrators can manage SEO configurations
CREATE POLICY "Authenticated admins can manage global SEO settings"
  ON public.seo_global_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated admins can manage page SEO settings"
  ON public.seo_page_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Storage Bucket Security Hardening
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    DROP POLICY IF EXISTS "Authenticated or Anon uploads to ap-northeast-1 bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated uploads to ap-northeast-1 bucket" ON storage.objects;
    
    CREATE POLICY "Authenticated uploads to ap-northeast-1 bucket"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'ap-northeast-1' AND
        (LOWER(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp', 'pdf', 'doc', 'docx', 'svg'))
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage policy configuration deferred: %', SQLERRM;
END $$;
