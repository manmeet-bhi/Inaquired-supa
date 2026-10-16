BEGIN;

-- The migration runner connects as the table owner; API roles do not need access.
ALTER TABLE IF EXISTS public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schema_migrations
  FROM PUBLIC, anon, authenticated, service_role;

-- Remove a legacy overload that disabled 2FA without authorization.
DROP FUNCTION IF EXISTS public.admin_disable_2fa(TEXT);

-- Keep the current two-argument operation server-only.
REVOKE ALL ON FUNCTION public.admin_disable_2fa(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_disable_2fa(TEXT, TEXT)
  TO service_role;

-- This helper is used by authenticated admin policies; pin its resolution path.
ALTER FUNCTION public.is_superadmin()
  SET search_path = pg_catalog, public, auth, pg_temp;
REVOKE ALL ON FUNCTION public.is_superadmin()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin()
  TO authenticated;

-- Remove permissive policies superseded by the MFA-gated policies.
DROP POLICY IF EXISTS "Allow anon insert to audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated admins can manage seo_global_settings"
  ON public.seo_global_settings;
DROP POLICY IF EXISTS "Authenticated admins can manage seo_page_settings"
  ON public.seo_page_settings;

-- Audit logs are consumed only by trusted database/server operations.
REVOKE ALL ON TABLE public.audit_logs
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;

-- Public object URLs do not require a policy that permits listing bucket contents.
DROP POLICY IF EXISTS "Public can view ap-northeast-1 bucket items"
  ON storage.objects;

-- Browser alerts are local to the visitor's browser; no subscriber rows are used.
DROP TABLE IF EXISTS public.subscribers;

COMMIT;
