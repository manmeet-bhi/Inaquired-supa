-- ==============================================================================
-- Migration: 005_account_recovery_schema.sql
-- Description: Account Recovery and Password Reset System using Resend
-- ==============================================================================

-- 1. Create password_resets table for tracking recovery tokens and OTP codes
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

-- 2. Indexes for efficient lookup and security cleanup
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets (token);
CREATE INDEX IF NOT EXISTS idx_password_resets_otp ON public.password_resets (otp_code);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON public.password_resets (expires_at);

-- 3. Row Level Security
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon and auth select password_resets" ON public.password_resets;
CREATE POLICY "Allow anon and auth select password_resets"
  ON public.password_resets
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert update password_resets" ON public.password_resets;
CREATE POLICY "Allow anon and auth insert update password_resets"
  ON public.password_resets
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4. Stored Procedure: Initiate Password Reset Request
CREATE OR REPLACE FUNCTION public.admin_request_password_reset(
  p_email TEXT,
  p_token TEXT,
  p_otp_code TEXT,
  p_expires_minutes INT DEFAULT 30,
  p_ip TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_email TEXT := LOWER(TRIM(p_email));
  user_rec RECORD;
  reset_id UUID;
  exp_time TIMESTAMPTZ;
  target_name TEXT := 'Administrator';
BEGIN
  -- Validate presence in auth.users or admin_users
  SELECT id, email, raw_user_meta_data INTO user_rec
  FROM auth.users
  WHERE LOWER(email) = clean_email
  LIMIT 1;

  IF user_rec IS NULL THEN
    -- Check public.admin_users directory
    SELECT id, email, full_name INTO user_rec
    FROM public.admin_users
    WHERE LOWER(email) = clean_email
    LIMIT 1;
    
    IF user_rec IS NULL THEN
      -- Return negative status securely without revealing too much detail
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

  -- Invalidate any prior unused reset tokens for this email
  UPDATE public.password_resets
  SET used_at = NOW()
  WHERE LOWER(email) = clean_email AND used_at IS NULL;

  -- Compute expiration timestamp
  exp_time := NOW() + (p_expires_minutes || ' minutes')::interval;

  -- Insert new reset record
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
    'token', p_token,
    'otp_code', p_otp_code,
    'expires_at', exp_time
  );
END;
$$;

-- 5. Stored Procedure: Verify Recovery Token or OTP
CREATE OR REPLACE FUNCTION public.admin_verify_recovery_token(
  p_token_or_otp TEXT,
  p_email TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_input TEXT := TRIM(p_token_or_otp);
  clean_email TEXT := CASE WHEN p_email IS NOT NULL AND length(trim(p_email)) > 0 THEN LOWER(TRIM(p_email)) ELSE NULL END;
  rec RECORD;
BEGIN
  SELECT * INTO rec
  FROM public.password_resets
  WHERE (token = clean_input OR otp_code = clean_input)
    AND (clean_email IS NULL OR LOWER(email) = clean_email)
    AND used_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF rec IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'The recovery token or code is invalid or has expired.'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'id', rec.id,
    'email', rec.email,
    'expires_at', rec.expires_at
  );
END;
$$;

-- 6. Stored Procedure: Complete Password Reset
CREATE OR REPLACE FUNCTION public.admin_complete_password_reset(
  p_token_or_otp TEXT,
  p_new_password TEXT,
  p_email TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_input TEXT := TRIM(p_token_or_otp);
  clean_email TEXT := CASE WHEN p_email IS NOT NULL AND length(trim(p_email)) > 0 THEN LOWER(TRIM(p_email)) ELSE NULL END;
  clean_pw TEXT := TRIM(p_new_password);
  rec RECORD;
  enc_pw TEXT;
BEGIN
  IF length(clean_pw) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters in length.';
  END IF;

  -- Locate valid active reset token
  SELECT * INTO rec
  FROM public.password_resets
  WHERE (token = clean_input OR otp_code = clean_input)
    AND (clean_email IS NULL OR LOWER(email) = clean_email)
    AND used_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF rec IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired recovery code. Please request a new link.';
  END IF;

  -- Hash password with pgcrypto
  enc_pw := extensions.crypt(clean_pw, extensions.gen_salt('bf'));

  -- Update auth.users
  UPDATE auth.users
  SET encrypted_password = enc_pw,
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(rec.email);

  -- Update public.admin_users
  UPDATE public.admin_users
  SET updated_at = NOW()
  WHERE LOWER(email) = LOWER(rec.email);

  -- Invalidate token
  UPDATE public.password_resets
  SET used_at = NOW()
  WHERE id = rec.id;

  RETURN jsonb_build_object(
    'success', true,
    'email', rec.email,
    'message', 'Password has been successfully updated.'
  );
END;
$$;

-- 7. Grant Permissions
GRANT EXECUTE ON FUNCTION public.admin_request_password_reset(TEXT, TEXT, TEXT, INT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_recovery_token(TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_complete_password_reset(TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
