-- ==============================================================================
-- Migration: 008_grant_2fa_status_anon.sql
-- Description: Grant anon execute permission on admin_get_2fa_status for login checks
-- ==============================================================================

BEGIN;

-- Allow anon (unauthenticated callers and anon publishable key) to check 2FA status before login
GRANT EXECUTE ON FUNCTION public.admin_get_2fa_status(TEXT) TO anon;

COMMIT;
