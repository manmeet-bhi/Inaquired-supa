-- ==============================================================================
-- Production Migration: 002_admin_users_and_access.sql
-- Description: Administrator Directory, Roles, and User Provisioning Stored Procedures
-- Components: admin_users table, is_superadmin, admin_create_user, admin_update_user, admin_delete_user
-- ==============================================================================

-- 1. Create admin_users directory table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'recruiter', 'editor')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  totp_secret TEXT DEFAULT NULL,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  email_2fa_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  temp_email_otp VARCHAR(10) DEFAULT NULL,
  temp_email_otp_expires TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ DEFAULT NULL
);

-- Ensure all 2FA columns exist if upgrading
ALTER TABLE public.admin_users 
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_secret TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_2fa_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS temp_email_otp VARCHAR(10) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS temp_email_otp_expires TIMESTAMPTZ DEFAULT NULL;

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users (role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users (status);
CREATE INDEX IF NOT EXISTS idx_admin_users_2fa_enabled ON public.admin_users (two_factor_enabled);

-- 2. Helper function to check if caller is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- 3. Row Level Security Policies
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow users to update own record or superadmin" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon and auth read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon and auth write admin_users" ON public.admin_users;

-- Only authenticated team members can read the administrator directory
CREATE POLICY "Allow authenticated users to read admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can update their own profile, or superadmins can update any profile
CREATE POLICY "Allow users to update own record or superadmin"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_superadmin())
  WITH CHECK (auth.uid() = id OR public.is_superadmin());

-- 4. Stored Procedure: Admin Create User (Provisions auth.users, auth.identities, admin_users)
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
BEGIN
  IF clean_role NOT IN ('superadmin', 'admin', 'recruiter', 'editor') THEN
    clean_role := 'admin';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = clean_email) OR
     EXISTS (SELECT 1 FROM public.admin_users WHERE LOWER(email) = clean_email) THEN
    RAISE EXCEPTION 'A user with email % already exists.', clean_email;
  END IF;

  enc_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Insert into Supabase auth.users with all non-null fields
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

  -- Insert into Supabase auth.identities
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

  -- Insert into public.admin_users directory
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

-- 5. Stored Procedure: Admin Update User (Supports full name, role, status, password, and email)
DROP FUNCTION IF EXISTS public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

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
  clean_name TEXT := TRIM(p_full_name);
  clean_role TEXT := TRIM(p_role);
  clean_status TEXT := TRIM(p_status);
  clean_email TEXT := LOWER(TRIM(p_email));
  old_email TEXT;
  target_id UUID := p_user_id;
BEGIN
  -- Verify authorization: caller must be admin/superadmin or updating self
  IF auth.uid() IS NOT NULL THEN
    IF auth.uid() <> target_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = auth.uid() AND (role = 'superadmin' OR role = 'admin')
      ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to update other user accounts.';
      END IF;
    END IF;
  END IF;

  SELECT email INTO old_email FROM public.admin_users WHERE id = target_id;
  IF old_email IS NULL THEN
    SELECT email INTO old_email FROM auth.users WHERE id = target_id;
  END IF;

  -- Email is changing
  IF clean_email IS NOT NULL AND clean_email <> '' AND (old_email IS NULL OR clean_email <> LOWER(old_email)) THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = clean_email AND id <> target_id) OR
       EXISTS (SELECT 1 FROM public.admin_users WHERE LOWER(email) = clean_email AND id <> target_id) THEN
      RAISE EXCEPTION 'A user with email % already exists.', clean_email;
    END IF;

    UPDATE public.admin_users
    SET email = clean_email,
        full_name = COALESCE(clean_name, full_name),
        role = COALESCE(clean_role, role),
        status = COALESCE(clean_status, status),
        updated_at = NOW()
    WHERE id = target_id;

    UPDATE auth.users
    SET email = clean_email,
        raw_user_meta_data = raw_user_meta_data || 
          jsonb_build_object(
            'role', COALESCE(clean_role, raw_user_meta_data->>'role'),
            'full_name', COALESCE(clean_name, raw_user_meta_data->>'full_name')
          ),
        encrypted_password = CASE 
          WHEN p_password IS NOT NULL AND length(trim(p_password)) >= 6 
          THEN extensions.crypt(trim(p_password), extensions.gen_salt('bf')) 
          ELSE encrypted_password 
        END,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = target_id;

    UPDATE auth.identities
    SET identity_data = jsonb_set(identity_data, '{email}', to_jsonb(clean_email)),
        updated_at = NOW()
    WHERE user_id = target_id;

    IF old_email IS NOT NULL AND old_email <> '' THEN
      UPDATE public.password_resets
      SET email = clean_email
      WHERE LOWER(email) = LOWER(old_email);
    END IF;

  ELSE
    -- Email not changed
    UPDATE public.admin_users
    SET full_name = COALESCE(clean_name, full_name),
        role = COALESCE(clean_role, role),
        status = COALESCE(clean_status, status),
        updated_at = NOW()
    WHERE id = target_id;

    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || 
          jsonb_build_object(
            'role', COALESCE(clean_role, raw_user_meta_data->>'role'),
            'full_name', COALESCE(clean_name, raw_user_meta_data->>'full_name')
          ),
        encrypted_password = CASE 
          WHEN p_password IS NOT NULL AND length(trim(p_password)) >= 6 
          THEN extensions.crypt(trim(p_password), extensions.gen_salt('bf')) 
          ELSE encrypted_password 
        END,
        updated_at = NOW()
    WHERE id = target_id;
  END IF;

  RETURN true;
END;
$$;

-- 6. Stored Procedure: Admin Delete User
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  DELETE FROM public.admin_users WHERE id = p_user_id;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN true;
END;
$$;

-- 7. Hardened Permissions on User Management Stored Procedures
REVOKE EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(UUID) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated, service_role;
