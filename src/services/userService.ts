import { supabase } from '../lib/supabase';
import { ManagedUser, CreateUserData, UpdateUserData, UserRole, UserStatus } from '../types/user';

export type Unsubscribe = () => void;

/**
 * Maps raw Supabase database row to ManagedUser model
 */
function mapRowToUser(row: any): ManagedUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || '',
    role: (row.role as UserRole) || 'admin',
    status: (row.status as UserStatus) || 'active',
    lastSignInAt: row.last_sign_in_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || 'system'
  };
}

/**
 * Fetches all registered administrative users from Supabase
 */
export async function getUsers(): Promise<ManagedUser[]> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, status, last_sign_in_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getUsers error:', error.message);
      return [];
    }

    return (data || []).map(mapRowToUser);
  } catch (err) {
    console.warn('getUsers catch error:', err);
    return [];
  }
}

/**
 * Subscribes to real-time changes in the admin_users table
 */
export function subscribeToUsers(
  onUpdate: (users: ManagedUser[]) => void
): Unsubscribe {
  let isSubscribed = true;

  const load = async () => {
    const users = await getUsers();
    if (isSubscribed) {
      onUpdate(users);
    }
  };

  load();

  const channel = supabase
    .channel('public:admin_users_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'admin_users' },
      () => {
        load();
      }
    )
    .subscribe();
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void load();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    isSubscribed = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    supabase.removeChannel(channel);
  };
}

/**
 * Creates a new user in Supabase Auth & public.admin_users directory
 */
export async function createUser(data: CreateUserData): Promise<ManagedUser> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.fullName.trim();
  const cleanPass = data.password.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('A valid email address is required.');
  }

  if (cleanPass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // Call PostgreSQL RPC with elevated SECURITY DEFINER
  const { data: res, error } = await supabase.rpc('admin_create_user', {
    p_email: cleanEmail,
    p_password: cleanPass,
    p_full_name: cleanName,
    p_role: data.role
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: res.id,
    email: res.email,
    fullName: res.full_name,
    role: res.role,
    status: res.status,
    createdAt: new Date().toISOString()
  };
}

/**
 * Updates an existing user's profile, role, status, or resets their password
 */
export async function updateUser(userId: string, data: UpdateUserData): Promise<void> {
  const payload: any = {
    p_user_id: userId,
    p_full_name: data.fullName?.trim() || null,
    p_email: data.email?.trim().toLowerCase() || null,
    p_role: data.role || null,
    p_status: data.status || null,
    p_password: data.password && data.password.trim().length >= 6 ? data.password.trim() : null
  };

  const { error } = await supabase.rpc('admin_update_user', payload);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Permanently deletes a user from the platform (auth & directory)
 */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', {
    p_user_id: userId
  });

  if (error) {
    throw new Error(error.message);
  }
}
