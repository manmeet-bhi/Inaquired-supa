BEGIN;

CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
      AND status = 'active'
      AND role IN ('superadmin', 'admin', 'recruiter', 'editor')
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;

DROP POLICY IF EXISTS "Allow authenticated users to read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow users to update own record or superadmin" ON public.admin_users;
DROP POLICY IF EXISTS "Active administrators can read admin_users" ON public.admin_users;

CREATE POLICY "Active administrators can read admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

REVOKE ALL ON TABLE public.admin_users FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, email, full_name, role, status, created_at, updated_at, last_sign_in_at)
  ON TABLE public.admin_users TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'admin'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  enc_pw TEXT;
  clean_email TEXT := LOWER(TRIM(p_email));
  clean_name TEXT := TRIM(p_full_name);
  clean_role TEXT := TRIM(p_role);
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role
  FROM public.admin_users
  WHERE id = auth.uid() AND status = 'active';

  IF caller_role IS NULL OR caller_role NOT IN ('superadmin', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: active administrator access is required.';
  END IF;

  IF clean_role NOT IN ('superadmin', 'admin', 'recruiter', 'editor') THEN
    RAISE EXCEPTION 'Invalid administrator role.';
  END IF;

  IF clean_role = 'superadmin' AND caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'Only a superadmin can create another superadmin.';
  END IF;

  IF clean_email = '' OR p_password IS NULL OR LENGTH(TRIM(p_password)) < 6 THEN
    RAISE EXCEPTION 'A valid email and password of at least 6 characters are required.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = clean_email)
     OR EXISTS (SELECT 1 FROM public.admin_users WHERE LOWER(email) = clean_email) THEN
    RAISE EXCEPTION 'A user with this email already exists.';
  END IF;

  enc_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token,
    reauthentication_token, is_super_admin, is_sso_user, is_anonymous,
    email_change_confirm_status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    clean_email, enc_pw, NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', clean_role, 'full_name', clean_name), NOW(), NOW(),
    '', '', '', '', '', '', '', '', false, false, false, 0
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    new_id, new_id, new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', clean_email),
    'email', NOW(), NOW(), NOW()
  );

  INSERT INTO public.admin_users (id, email, full_name, role, status, created_at, updated_at)
  VALUES (new_id, clean_email, clean_name, clean_role, 'active', NOW(), NOW());

  RETURN jsonb_build_object(
    'id', new_id, 'email', clean_email, 'full_name', clean_name,
    'role', clean_role, 'status', 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role TEXT;
  target_role TEXT;
  old_email TEXT;
  clean_email TEXT := LOWER(TRIM(p_email));
BEGIN
  SELECT role INTO caller_role
  FROM public.admin_users
  WHERE id = auth.uid() AND status = 'active';

  IF caller_role IS NULL OR caller_role NOT IN ('superadmin', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: active administrator access is required.';
  END IF;

  SELECT role, email INTO target_role, old_email
  FROM public.admin_users WHERE id = p_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Administrator account not found.';
  END IF;

  IF target_role = 'superadmin' AND caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'Only a superadmin can manage another superadmin.';
  END IF;

  IF p_user_id = auth.uid() AND (p_role IS NOT NULL OR p_status IS NOT NULL) THEN
    RAISE EXCEPTION 'You cannot change your own role or account status.';
  END IF;

  IF p_role IS NOT NULL AND p_role NOT IN ('superadmin', 'admin', 'recruiter', 'editor') THEN
    RAISE EXCEPTION 'Invalid administrator role.';
  END IF;

  IF p_role = 'superadmin' AND caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'Only a superadmin can grant the superadmin role.';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended', 'pending') THEN
    RAISE EXCEPTION 'Invalid administrator status.';
  END IF;

  IF clean_email IS NOT NULL AND clean_email <> '' AND clean_email <> LOWER(old_email)
     AND (EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = clean_email AND id <> p_user_id)
       OR EXISTS (SELECT 1 FROM public.admin_users WHERE LOWER(email) = clean_email AND id <> p_user_id)) THEN
    RAISE EXCEPTION 'A user with this email already exists.';
  END IF;

  UPDATE public.admin_users
  SET email = COALESCE(NULLIF(clean_email, ''), email),
      full_name = COALESCE(NULLIF(TRIM(p_full_name), ''), full_name),
      role = COALESCE(p_role, role),
      status = COALESCE(p_status, status),
      updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE auth.users
  SET email = COALESCE(NULLIF(clean_email, ''), email),
      raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'role', COALESCE(p_role, raw_user_meta_data->>'role'),
        'full_name', COALESCE(NULLIF(TRIM(p_full_name), ''), raw_user_meta_data->>'full_name')
      ),
      encrypted_password = CASE
        WHEN p_password IS NOT NULL AND LENGTH(TRIM(p_password)) >= 6
        THEN extensions.crypt(TRIM(p_password), extensions.gen_salt('bf'))
        ELSE encrypted_password
      END,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE auth.identities
  SET identity_data = jsonb_set(identity_data, '{email}', to_jsonb(COALESCE(NULLIF(clean_email, ''), old_email))),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role TEXT;
  target_role TEXT;
BEGIN
  SELECT role INTO caller_role
  FROM public.admin_users
  WHERE id = auth.uid() AND status = 'active';

  IF caller_role IS NULL OR caller_role NOT IN ('superadmin', 'admin') OR p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: administrator access is required and self-deletion is not allowed.';
  END IF;

  SELECT role INTO target_role FROM public.admin_users WHERE id = p_user_id;
  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Administrator account not found.';
  END IF;

  IF target_role = 'superadmin' AND caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'Only a superadmin can delete another superadmin.';
  END IF;

  IF target_role = 'superadmin' AND (
    SELECT COUNT(*) FROM public.admin_users WHERE role = 'superadmin' AND status = 'active'
  ) <= 1 THEN
    RAISE EXCEPTION 'The last active superadmin cannot be deleted.';
  END IF;

  DELETE FROM public.admin_users WHERE id = p_user_id;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_request_password_reset(TEXT, TEXT, TEXT, INT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_verify_recovery_token(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_complete_password_reset(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_password_reset(TEXT, TEXT, TEXT, INT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_recovery_token(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_complete_password_reset(TEXT, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.admin_get_2fa_status(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_save_2fa_config(TEXT, TEXT, BOOLEAN, BOOLEAN, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_store_email_2fa_otp(TEXT, TEXT, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_verify_email_2fa_otp(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_consume_backup_code(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_disable_2fa(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_2fa_status(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_2fa_config(TEXT, TEXT, BOOLEAN, BOOLEAN, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_store_email_2fa_otp(TEXT, TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_email_2fa_otp(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_consume_backup_code(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_disable_2fa(TEXT, TEXT) TO service_role;

COMMIT;