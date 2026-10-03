-- ==============================================================================
-- Production Migration: 003_auth_recovery_and_2fa.sql
-- Description: Password Recovery System & Two-Factor Authentication (2FA) Engine
-- Components: password_resets table, recovery RPCs, TOTP / Email 2FA / Backup Code RPCs
-- ==============================================================================

-- 1. Password Resets Table
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(128) UNIQUE NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45) DEFAULT NULL
);

-- Indexes for lightning fast lookups & verification
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets (token);
CREATE INDEX IF NOT EXISTS idx_password_resets_otp ON public.password_resets (otp_code);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON public.password_resets (expires_at);

-- 2. Hardened Row Level Security on password_resets
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct client access to password_resets" ON public.password_resets;
DROP POLICY IF EXISTS "Allow anon and auth select password_resets" ON public.password_resets;
DROP POLICY IF EXISTS "Allow anon and auth insert update password_resets" ON public.password_resets;

-- Block direct SELECT/INSERT/UPDATE from client roles; enforce SECURITY DEFINER RPC execution
CREATE POLICY "Deny direct client access to password_resets"
  ON public.password_resets
  FOR ALL
  TO anon, authenticated
  USING (false);

-- 3. Stored Procedure: Initiate Password Reset Request
CREATE OR REPLACE FUNCTION public.admin_request_password_reset(
  p_email TEXT,
  p_token TEXT,
  p_otp_code TEXT,
  p_expires_minutes INT DEFAULT 30,
  p_ip TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  user_rec RECORD;
  reset_id UUID;
  exp_time TIMESTAMPTZ;
  target_name TEXT := 'Administrator';
BEGIN
  SELECT id, email, raw_user_meta_data INTO user_rec
  FROM auth.users
  WHERE LOWER(email) = clean_email
  LIMIT 1;

  IF user_rec IS NULL THEN
    SELECT id, email, full_name INTO user_rec
    FROM public.admin_users
    WHERE LOWER(email) = clean_email
    LIMIT 1;
    
    IF user_rec IS NULL THEN
      RETURN jsonb_build_object(
        'exists', false,
        'email', clean_email,
        'message', 'User account does not exist.'
      );
    ELSE
      target_name := COALESCE(user_rec.full_name, 'Administrator');
    END IF;
  ELSE
    target_name := COALESCE(
      user_rec.raw_user_meta_data->>'full_name',
      user_rec.raw_user_meta_data->>'name',
      'Administrator'
    );
  END IF;

  -- Invalidate prior unused tokens
  UPDATE public.password_resets
  SET used_at = NOW()
  WHERE LOWER(email) = clean_email AND used_at IS NULL;

  exp_time := NOW() + (p_expires_minutes || ' minutes')::interval;

  INSERT INTO public.password_resets (
    email,
    token,
    otp_code,
    expires_at,
    ip_address
  ) VALUES (
    clean_email,
    p_token,
    p_otp_code,
    exp_time,
    p_ip
  ) RETURNING id INTO reset_id;

  RETURN jsonb_build_object(
    'exists', true,
    'id', reset_id,
    'email', clean_email,
    'full_name', target_name,
    'expires_at', exp_time
  );
END;
$$;

-- 4. Stored Procedure: Verify Password Recovery Token or 6-Digit OTP
CREATE OR REPLACE FUNCTION public.admin_verify_recovery_token(
  p_token_or_otp TEXT,
  p_email TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_input TEXT := TRIM(p_token_or_otp);
  clean_email TEXT := LOWER(TRIM(p_email));
  reset_rec RECORD;
BEGIN
  IF clean_email IS NOT NULL AND clean_email <> '' THEN
    SELECT * INTO reset_rec
    FROM public.password_resets
    WHERE LOWER(email) = clean_email
      AND (token = clean_input OR otp_code = clean_input)
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT * INTO reset_rec
    FROM public.password_resets
    WHERE (token = clean_input OR otp_code = clean_input)
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF reset_rec IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid, expired, or previously used recovery token/code.'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'email', reset_rec.email,
    'expires_at', reset_rec.expires_at
  );
END;
$$;

-- 5. Stored Procedure: Complete Password Reset with New Encrypted Password
CREATE OR REPLACE FUNCTION public.admin_complete_password_reset(
  p_token_or_otp TEXT,
  p_new_password TEXT,
  p_email TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_input TEXT := TRIM(p_token_or_otp);
  clean_email TEXT := LOWER(TRIM(p_email));
  reset_rec RECORD;
  enc_pw TEXT;
BEGIN
  IF length(trim(p_new_password)) < 8 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Password must be at least 8 characters in length.'
    );
  END IF;

  IF clean_email IS NOT NULL AND clean_email <> '' THEN
    SELECT * INTO reset_rec
    FROM public.password_resets
    WHERE LOWER(email) = clean_email
      AND (token = clean_input OR otp_code = clean_input)
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT * INTO reset_rec
    FROM public.password_resets
    WHERE (token = clean_input OR otp_code = clean_input)
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF reset_rec IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid, expired, or already used recovery token.'
    );
  END IF;

  enc_pw := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

  -- Update auth.users password
  UPDATE auth.users
  SET encrypted_password = enc_pw,
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(reset_rec.email);

  -- Mark token as consumed
  UPDATE public.password_resets
  SET used_at = NOW()
  WHERE id = reset_rec.id;

  RETURN jsonb_build_object(
    'success', true,
    'email', reset_rec.email,
    'message', 'Password has been reset successfully.'
  );
END;
$$;

-- 6. Stored Procedure: Get 2FA Status for an Admin User
CREATE OR REPLACE FUNCTION public.admin_get_2fa_status(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  user_row RECORD;
  remaining_codes INT := 0;
BEGIN
  SELECT id, email, full_name, two_factor_enabled, totp_enabled, email_2fa_enabled, totp_secret, backup_codes
  INTO user_row
  FROM public.admin_users
  WHERE LOWER(email) = clean_email
  LIMIT 1;

  IF user_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Admin user not found'
    );
  END IF;

  SELECT COUNT(*) INTO remaining_codes
  FROM jsonb_array_elements(COALESCE(user_row.backup_codes, '[]'::jsonb)) AS code
  WHERE (code->>'used')::boolean IS NOT TRUE;

  RETURN jsonb_build_object(
    'success', true,
    'userId', user_row.id,
    'email', user_row.email,
    'twoFactorEnabled', COALESCE(user_row.two_factor_enabled, false),
    'totpEnabled', COALESCE(user_row.totp_enabled, false),
    'email2faEnabled', COALESCE(user_row.email_2fa_enabled, false),
    'hasTotpSecret', (user_row.totp_secret IS NOT NULL AND LENGTH(user_row.totp_secret) > 0),
    'remainingBackupCodes', remaining_codes
  );
END;
$$;

-- 7. Stored Procedure: Save 2FA Configuration
CREATE OR REPLACE FUNCTION public.admin_save_2fa_config(
  p_email TEXT,
  p_totp_secret TEXT,
  p_totp_enabled BOOLEAN,
  p_email_enabled BOOLEAN,
  p_backup_codes JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  is_overall_enabled BOOLEAN := (p_totp_enabled OR p_email_enabled);
BEGIN
  UPDATE public.admin_users
  SET 
    two_factor_enabled = is_overall_enabled,
    totp_secret = CASE WHEN p_totp_secret IS NOT NULL AND LENGTH(p_totp_secret) > 0 THEN p_totp_secret ELSE totp_secret END,
    totp_enabled = p_totp_enabled,
    email_2fa_enabled = p_email_enabled,
    backup_codes = CASE WHEN p_backup_codes IS NOT NULL THEN p_backup_codes ELSE backup_codes END,
    updated_at = NOW()
  WHERE LOWER(email) = clean_email;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'twoFactorEnabled', is_overall_enabled,
    'totpEnabled', p_totp_enabled,
    'email2faEnabled', p_email_enabled
  );
END;
$$;

-- 8. Stored Procedure: Store Email 2FA OTP
CREATE OR REPLACE FUNCTION public.admin_store_email_2fa_otp(
  p_email TEXT,
  p_otp_code TEXT,
  p_expires_minutes INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  exp_time TIMESTAMPTZ := NOW() + (p_expires_minutes || ' minutes')::interval;
  admin_name TEXT;
BEGIN
  UPDATE public.admin_users
  SET 
    temp_email_otp = p_otp_code,
    temp_email_otp_expires = exp_time,
    updated_at = NOW()
  WHERE LOWER(email) = clean_email
  RETURNING full_name INTO admin_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin account not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'email', clean_email,
    'fullName', COALESCE(admin_name, 'Administrator'),
    'expiresAt', exp_time
  );
END;
$$;

-- 9. Stored Procedure: Verify Email 2FA OTP
CREATE OR REPLACE FUNCTION public.admin_verify_email_2fa_otp(
  p_email TEXT,
  p_otp_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  clean_otp TEXT := TRIM(p_otp_code);
  user_row RECORD;
BEGIN
  SELECT id, email, temp_email_otp, temp_email_otp_expires
  INTO user_row
  FROM public.admin_users
  WHERE LOWER(email) = clean_email
  LIMIT 1;

  IF user_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found');
  END IF;

  IF user_row.temp_email_otp IS NULL OR user_row.temp_email_otp_expires IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active verification code found. Please request a new code.');
  END IF;

  IF user_row.temp_email_otp_expires < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verification code has expired. Please request a new code.');
  END IF;

  IF user_row.temp_email_otp <> clean_otp THEN
    RETURN jsonb_build_object('success', false, 'error', 'Incorrect verification code. Please check your email and try again.');
  END IF;

  UPDATE public.admin_users
  SET 
    temp_email_otp = NULL,
    temp_email_otp_expires = NULL,
    updated_at = NOW()
  WHERE id = user_row.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 10. Stored Procedure: Consume Single-Use Backup Code
CREATE OR REPLACE FUNCTION public.admin_consume_backup_code(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  clean_code TEXT := UPPER(TRIM(p_code));
  user_row RECORD;
  codes JSONB;
  code_elem JSONB;
  code_found BOOLEAN := false;
  updated_codes JSONB := '[]'::jsonb;
BEGIN
  SELECT id, email, backup_codes
  INTO user_row
  FROM public.admin_users
  WHERE LOWER(email) = clean_email
  LIMIT 1;

  IF user_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin account not found');
  END IF;

  codes := COALESCE(user_row.backup_codes, '[]'::jsonb);

  FOR code_elem IN SELECT * FROM jsonb_array_elements(codes)
  LOOP
    IF UPPER(code_elem->>'code') = clean_code AND NOT COALESCE((code_elem->>'used')::boolean, false) AND NOT code_found THEN
      updated_codes := updated_codes || jsonb_build_object(
        'code', code_elem->>'code',
        'used', true,
        'usedAt', NOW()
      );
      code_found := true;
    ELSE
      updated_codes := updated_codes || code_elem;
    END IF;
  END LOOP;

  IF NOT code_found THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already consumed backup code.');
  END IF;

  UPDATE public.admin_users
  SET backup_codes = updated_codes, updated_at = NOW()
  WHERE id = user_row.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 11. Stored Procedure: Disable 2FA
CREATE OR REPLACE FUNCTION public.admin_disable_2fa(
  p_email TEXT,
  p_method TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  method TEXT := LOWER(TRIM(p_method));
BEGIN
  IF method = 'totp' THEN
    UPDATE public.admin_users
    SET totp_enabled = false,
        two_factor_enabled = email_2fa_enabled,
        updated_at = NOW()
    WHERE LOWER(email) = clean_email;
  ELSIF method = 'email' THEN
    UPDATE public.admin_users
    SET email_2fa_enabled = false,
        two_factor_enabled = totp_enabled,
        updated_at = NOW()
    WHERE LOWER(email) = clean_email;
  ELSE
    UPDATE public.admin_users
    SET two_factor_enabled = false,
        totp_enabled = false,
        email_2fa_enabled = false,
        updated_at = NOW()
    WHERE LOWER(email) = clean_email;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 12. Execution Permissions
GRANT EXECUTE ON FUNCTION public.admin_request_password_reset(TEXT, TEXT, TEXT, INT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_recovery_token(TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_complete_password_reset(TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_2fa_status(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_2fa_config(TEXT, TEXT, BOOLEAN, BOOLEAN, JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_store_email_2fa_otp(TEXT, TEXT, INT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_email_2fa_otp(TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_consume_backup_code(TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_disable_2fa(TEXT, TEXT) TO authenticated, anon, service_role;
