-- ==============================================================================
-- Migration: 004_fix_auth_users_schema.sql
-- Description: Clean up NULL tokens in auth.users and ensure admin_create_user populates non-null fields
-- ==============================================================================

-- 1. Clean up any existing NULL values in auth.users
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_super_admin = COALESCE(is_super_admin, false),
  is_sso_user = COALESCE(is_sso_user, false),
  is_anonymous = COALESCE(is_anonymous, false),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0);

-- 2. Replace admin_create_user procedure with explicit non-null string fields
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'admin'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID := gen_random_uuid();
  enc_pw TEXT;
  clean_email TEXT := LOWER(TRIM(p_email));
  clean_name TEXT := TRIM(p_full_name);
  clean_role TEXT := TRIM(p_role);
BEGIN
  -- Validate Role
  IF clean_role NOT IN ('superadmin', 'admin', 'recruiter', 'editor') THEN
    clean_role := 'admin';
  END IF;

  -- Check if email exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = clean_email) THEN
    RAISE EXCEPTION 'A user with email % already exists.', clean_email;
  END IF;

  -- Hash password using pgcrypto
  enc_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Insert into Supabase Auth users with ALL required non-null string fields
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_super_admin,
    is_sso_user,
    is_anonymous,
    email_change_confirm_status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_id,
    'authenticated',
    'authenticated',
    clean_email,
    enc_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', clean_role, 'full_name', clean_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false,
    false,
    false,
    0
  );

  -- Insert into Supabase Auth identities
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_id,
    new_id,
    new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', clean_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  -- Insert into public.admin_users
  INSERT INTO public.admin_users (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    new_id,
    clean_email,
    clean_name,
    clean_role,
    'active',
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object(
    'id', new_id,
    'email', clean_email,
    'full_name', clean_name,
    'role', clean_role,
    'status', 'active'
  );
END;
$$;

-- 3. Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
