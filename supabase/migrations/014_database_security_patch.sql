-- ==============================================================================
-- Production Migration: 014_database_security_patch.sql
-- Description: Database Security Remediation & Oct 30 Supabase Grant Alignment
-- 1. Explicit GRANTs to comply with Supabase Data API privilege changes
-- 2. Revoke client access to sensitive auth tables (password_resets, 2FA sessions, rate limits)
-- 3. Lock down sensitive RPCs to service_role only
-- 4. Harden storage bucket upload policies against Stored XSS and unauthorized uploads
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Explicit Data API Table Grants (Supabase Oct 30 Compliance)
-- ------------------------------------------------------------------------------

-- Jobs table
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

-- Categories table
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

-- SEO Global Settings
GRANT SELECT ON public.seo_global_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seo_global_settings TO authenticated;
GRANT ALL ON public.seo_global_settings TO service_role;

-- SEO Page Settings
GRANT SELECT ON public.seo_page_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seo_page_settings TO authenticated;
GRANT ALL ON public.seo_page_settings TO service_role;

-- SEO Redirects
GRANT SELECT ON public.seo_redirects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seo_redirects TO authenticated;
GRANT ALL ON public.seo_redirects TO service_role;

-- SEO Audit Log (Admin only)
GRANT SELECT, INSERT ON public.seo_audit_log TO authenticated;
GRANT ALL ON public.seo_audit_log TO service_role;

-- ------------------------------------------------------------------------------
-- 2. Defense-in-Depth REVOKEs on Sensitive Tables
-- ------------------------------------------------------------------------------

-- Password Resets table: internal token storage, server-only access
REVOKE ALL ON TABLE public.password_resets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.password_resets TO service_role;

-- Two-Factor Sessions table: server-only session verifications
REVOKE ALL ON TABLE public.admin_two_factor_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_two_factor_sessions TO service_role;

-- Auth Rate Limits table: internal rate counters
REVOKE ALL ON TABLE public.auth_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.auth_rate_limits TO service_role;

-- Core audit logs: immutable server-only governance log
REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;

-- ------------------------------------------------------------------------------
-- 3. Lock Down Sensitive Password Recovery & Auth RPCs
-- ------------------------------------------------------------------------------

-- Ensure password reset functions are accessible strictly to service_role
REVOKE ALL ON FUNCTION public.admin_request_password_reset(TEXT, TEXT, TEXT, INT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_password_reset(TEXT, TEXT, TEXT, INT, TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.admin_verify_recovery_token(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_recovery_token(TEXT, TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.admin_complete_password_reset(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_complete_password_reset(TEXT, TEXT, TEXT)
  TO service_role;

-- ------------------------------------------------------------------------------
-- 4. Harden Storage Bucket Upload Policy
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    DROP POLICY IF EXISTS "Authenticated uploads to ap-northeast-1 bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated or Anon uploads to ap-northeast-1 bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Verified admins upload to ap-northeast-1 bucket" ON storage.objects;

    -- Only active, 2FA-verified admins can upload, excluding dangerous SVG files (Stored XSS)
    CREATE POLICY "Verified admins upload to ap-northeast-1 bucket"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'ap-northeast-1' AND
        private.can_manage_sensitive_admin_data() AND
        (LOWER(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp', 'pdf', 'doc', 'docx'))
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage policy update notice: %', SQLERRM;
END $$;

COMMIT;
