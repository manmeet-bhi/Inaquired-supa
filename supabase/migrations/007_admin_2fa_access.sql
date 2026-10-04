-- ==============================================================================
-- Migration: 007_admin_2fa_access.sql
-- Description: Grant active authenticated administrators access to 2FA procedures
-- ==============================================================================

BEGIN;

-- Allow authenticated users (who are verified active administrators) to manage their 2FA
GRANT EXECUTE ON FUNCTION public.admin_get_2fa_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_2fa_config(TEXT, TEXT, BOOLEAN, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_disable_2fa(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_consume_backup_code(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_store_email_2fa_otp(TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_email_2fa_otp(TEXT, TEXT) TO authenticated;

COMMIT;
