BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Move policy helpers out of PostgREST's exposed public schema.
ALTER FUNCTION public.is_superadmin() SET SCHEMA private;
ALTER FUNCTION private.is_superadmin()
  SET search_path = pg_catalog, public, auth, pg_temp;
REVOKE ALL ON FUNCTION private.is_superadmin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO authenticated;

ALTER FUNCTION public.is_active_admin() SET SCHEMA private;
ALTER FUNCTION private.is_active_admin()
  SET search_path = pg_catalog, public, auth, pg_temp;
REVOKE ALL ON FUNCTION private.is_active_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_active_admin() TO authenticated;

ALTER FUNCTION public.can_manage_sensitive_admin_data() SET SCHEMA private;
ALTER FUNCTION private.can_manage_sensitive_admin_data()
  SET search_path = pg_catalog, public, auth, pg_temp;
REVOKE ALL ON FUNCTION private.can_manage_sensitive_admin_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_manage_sensitive_admin_data() TO authenticated;

-- Policies keep their dependency on the moved helper's function OID. Update
-- the trigger function body too, since PL/pgSQL source references are textual.
CREATE OR REPLACE FUNCTION public.enforce_admin_user_mfa_for_mutations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.can_manage_sensitive_admin_data() THEN
    RAISE EXCEPTION 'A recently verified active administrator session is required.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_admin_user_mfa_for_mutations()
  FROM PUBLIC, anon, authenticated;

-- Retain the private, authorization-checking implementations while exposing
-- invoker wrappers to the admin client. The private schema is not exposed by
-- PostgREST, and the underlying routines still validate the caller's admin role.
ALTER FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.admin_create_user(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_create_user(TEXT, TEXT, TEXT, TEXT)
  TO authenticated;

CREATE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private, auth
AS $$
  SELECT private.admin_create_user(p_email, p_password, p_full_name, p_role);
$$;
REVOKE ALL ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT)
  TO authenticated;

ALTER FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  SET SCHEMA private;
REVOKE ALL ON FUNCTION private.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated;

CREATE FUNCTION public.admin_update_user(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private, auth
AS $$
  SELECT private.admin_update_user(
    p_user_id, p_full_name, p_role, p_status, p_password, p_email
  );
$$;
REVOKE ALL ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated;

ALTER FUNCTION public.admin_delete_user(UUID) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_delete_user(UUID) TO authenticated;

CREATE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, private, auth
AS $$
  SELECT private.admin_delete_user(p_user_id);
$$;
REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

COMMIT;
