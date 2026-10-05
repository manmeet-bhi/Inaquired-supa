BEGIN;

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  bucket_key CHAR(64) PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL CHECK (attempt_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window_started
  ON public.auth_rate_limits (window_started_at);

ALTER TABLE public.password_resets
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0
  CHECK (failed_attempts >= 0);

CREATE OR REPLACE FUNCTION public.admin_verify_recovery_token(
  p_token_or_otp TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
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
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  ELSE
    SELECT * INTO reset_rec
    FROM public.password_resets
    WHERE token = clean_input
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF reset_rec IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid, expired, or previously used recovery token/code.'
    );
  END IF;

  IF reset_rec.token <> clean_input AND reset_rec.otp_code <> clean_input THEN
    UPDATE public.password_resets
    SET failed_attempts = failed_attempts + 1,
        used_at = CASE WHEN failed_attempts + 1 >= 10 THEN NOW() ELSE used_at END
    WHERE id = reset_rec.id;

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

CREATE OR REPLACE FUNCTION public.admin_complete_password_reset(
  p_token_or_otp TEXT,
  p_new_password TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
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
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  ELSE
    SELECT * INTO reset_rec
    FROM public.password_resets
    WHERE token = clean_input
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF reset_rec IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid, expired, or already used recovery token.'
    );
  END IF;

  IF reset_rec.token <> clean_input AND reset_rec.otp_code <> clean_input THEN
    UPDATE public.password_resets
    SET failed_attempts = failed_attempts + 1,
        used_at = CASE WHEN failed_attempts + 1 >= 10 THEN NOW() ELSE used_at END
    WHERE id = reset_rec.id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid, expired, or already used recovery token.'
    );
  END IF;

  enc_pw := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

  UPDATE auth.users
  SET encrypted_password = enc_pw,
      updated_at = NOW()
  WHERE LOWER(email) = LOWER(reset_rec.email);

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

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_rate_limits FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.admin_two_factor_sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_two_factor_sessions_verified_at
  ON public.admin_two_factor_sessions (verified_at);

ALTER TABLE public.admin_two_factor_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_two_factor_sessions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_mark_two_factor_session_verified(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF p_session_id IS NULL OR p_user_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = p_user_id
      AND status = 'active'
      AND two_factor_enabled
  ) THEN
    RAISE EXCEPTION 'An active administrator with 2FA enabled is required.';
  END IF;

  INSERT INTO public.admin_two_factor_sessions (session_id, user_id, verified_at)
  VALUES (p_session_id, p_user_id, NOW())
  ON CONFLICT (session_id) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      verified_at = EXCLUDED.verified_at;

  IF random() < 0.01 THEN
    DELETE FROM public.admin_two_factor_sessions
    WHERE verified_at < NOW() - INTERVAL '1 day';
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_is_two_factor_session_verified(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_two_factor_sessions AS session
    JOIN public.admin_users AS admin ON admin.id = session.user_id
    WHERE session.session_id = p_session_id
      AND session.user_id = p_user_id
      AND admin.status = 'active'
      AND admin.two_factor_enabled
      AND session.verified_at >= NOW() - INTERVAL '12 hours'
      AND session.verified_at <= NOW() + INTERVAL '1 minute'
  );
$$;

REVOKE ALL ON FUNCTION public.admin_mark_two_factor_session_verified(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_is_two_factor_session_verified(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_two_factor_session_verified(UUID, UUID)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_is_two_factor_session_verified(UUID, UUID)
  TO service_role;

CREATE OR REPLACE FUNCTION public.admin_consume_auth_rate_limit(
  p_scope TEXT,
  p_identifier TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  clean_scope TEXT := LOWER(TRIM(p_scope));
  clean_identifier TEXT := LOWER(TRIM(p_identifier));
  hashed_key CHAR(64);
  bucket RECORD;
  window_interval INTERVAL;
BEGIN
  IF clean_scope = '' OR clean_identifier = ''
     OR p_limit < 1 OR p_limit > 1000
     OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid authentication rate-limit parameters.';
  END IF;

  hashed_key := encode(
    extensions.digest(clean_scope || ':' || clean_identifier, 'sha256'),
    'hex'
  );
  window_interval := make_interval(secs => p_window_seconds);

  INSERT INTO public.auth_rate_limits (bucket_key, window_started_at, attempt_count)
  VALUES (hashed_key, NOW(), 1)
  ON CONFLICT (bucket_key) DO UPDATE
  SET window_started_at = CASE
        WHEN public.auth_rate_limits.window_started_at + window_interval <= NOW() THEN NOW()
        ELSE public.auth_rate_limits.window_started_at
      END,
      attempt_count = CASE
        WHEN public.auth_rate_limits.window_started_at + window_interval <= NOW() THEN 1
        ELSE public.auth_rate_limits.attempt_count + 1
      END
  RETURNING window_started_at, attempt_count INTO bucket;

  IF random() < 0.01 THEN
    DELETE FROM public.auth_rate_limits
    WHERE window_started_at < NOW() - INTERVAL '1 day';
  END IF;

  RETURN jsonb_build_object(
    'allowed', bucket.attempt_count <= p_limit,
    'retryAfterSeconds', GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (bucket.window_started_at + window_interval - NOW())))::INTEGER
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_consume_auth_rate_limit(TEXT, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_consume_auth_rate_limit(TEXT, TEXT, INTEGER, INTEGER)
  TO service_role;

CREATE OR REPLACE FUNCTION public.can_manage_sensitive_admin_data()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users AS admin
    WHERE admin.id = auth.uid()
      AND admin.status = 'active'
      AND admin.role IN ('superadmin', 'admin', 'recruiter', 'editor')
      AND (
        NOT admin.two_factor_enabled
        OR EXISTS (
          SELECT 1
          FROM public.admin_two_factor_sessions AS session
          WHERE session.session_id = NULLIF(auth.jwt()->>'session_id', '')::UUID
            AND session.user_id = admin.id
            AND session.verified_at >= NOW() - INTERVAL '12 hours'
            AND session.verified_at <= NOW() + INTERVAL '1 minute'
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_sensitive_admin_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_sensitive_admin_data() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_admin_user_mfa_for_mutations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.can_manage_sensitive_admin_data() THEN
    RAISE EXCEPTION 'A recently verified active administrator session is required.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_admin_user_mfa_for_mutations() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_admin_user_mfa_for_mutations ON public.admin_users;
CREATE TRIGGER enforce_admin_user_mfa_for_mutations
  BEFORE INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_admin_user_mfa_for_mutations();

DROP POLICY IF EXISTS "Active administrators can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can read permitted admin profiles" ON public.admin_users;
CREATE POLICY "Admins can read permitted admin profiles"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    (id = auth.uid() AND status = 'active')
    OR public.can_manage_sensitive_admin_data()
  );

DROP POLICY IF EXISTS "Authenticated users can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Verified admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Verified admins can manage jobs" ON public.jobs;

CREATE POLICY "Verified admins can view all jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (public.can_manage_sensitive_admin_data());

CREATE POLICY "Verified admins can manage jobs"
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (public.can_manage_sensitive_admin_data())
  WITH CHECK (public.can_manage_sensitive_admin_data());

DROP POLICY IF EXISTS "Authenticated admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Verified admins can manage categories" ON public.categories;
CREATE POLICY "Verified admins can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.can_manage_sensitive_admin_data())
  WITH CHECK (public.can_manage_sensitive_admin_data());

DROP POLICY IF EXISTS "Authenticated admins can manage global SEO settings" ON public.seo_global_settings;
DROP POLICY IF EXISTS "Verified admins can manage global SEO settings" ON public.seo_global_settings;
CREATE POLICY "Verified admins can manage global SEO settings"
  ON public.seo_global_settings
  FOR ALL
  TO authenticated
  USING (public.can_manage_sensitive_admin_data())
  WITH CHECK (public.can_manage_sensitive_admin_data());

DROP POLICY IF EXISTS "Authenticated admins can manage page SEO settings" ON public.seo_page_settings;
DROP POLICY IF EXISTS "Verified admins can manage page SEO settings" ON public.seo_page_settings;
CREATE POLICY "Verified admins can manage page SEO settings"
  ON public.seo_page_settings
  FOR ALL
  TO authenticated
  USING (public.can_manage_sensitive_admin_data())
  WITH CHECK (public.can_manage_sensitive_admin_data());

DROP POLICY IF EXISTS "Authenticated admins can manage redirects" ON public.seo_redirects;
DROP POLICY IF EXISTS "Verified admins can manage redirects" ON public.seo_redirects;
CREATE POLICY "Verified admins can manage redirects"
  ON public.seo_redirects
  FOR ALL
  TO authenticated
  USING (public.can_manage_sensitive_admin_data())
  WITH CHECK (public.can_manage_sensitive_admin_data());

DROP POLICY IF EXISTS "Authenticated admins can read and create audit logs" ON public.seo_audit_log;
DROP POLICY IF EXISTS "Verified admins can manage audit logs" ON public.seo_audit_log;
CREATE POLICY "Verified admins can manage audit logs"
  ON public.seo_audit_log
  FOR ALL
  TO authenticated
  USING (public.can_manage_sensitive_admin_data())
  WITH CHECK (public.can_manage_sensitive_admin_data());

CREATE OR REPLACE FUNCTION public.admin_disable_2fa(
  p_email TEXT,
  p_method TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
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
        temp_email_otp = NULL,
        temp_email_otp_expires = NULL,
        two_factor_enabled = totp_enabled,
        updated_at = NOW()
    WHERE LOWER(email) = clean_email;
  ELSE
    UPDATE public.admin_users
    SET two_factor_enabled = false,
        totp_enabled = false,
        email_2fa_enabled = false,
        temp_email_otp = NULL,
        temp_email_otp_expires = NULL,
        updated_at = NOW()
    WHERE LOWER(email) = clean_email;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin user not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_2fa_status(TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_save_2fa_config(TEXT, TEXT, BOOLEAN, BOOLEAN, JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_disable_2fa(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_store_email_2fa_otp(TEXT, TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_verify_email_2fa_otp(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_consume_backup_code(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_save_2fa_config(TEXT, TEXT, BOOLEAN, BOOLEAN, JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_2fa_status(TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_disable_2fa(TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_store_email_2fa_otp(TEXT, TEXT, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_email_2fa_otp(TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_consume_backup_code(TEXT, TEXT)
  TO service_role;

COMMIT;
