import { supabase } from '../lib/supabase';

export interface AdminSessionUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}

export interface UpdateAdminProfileData {
  fullName?: string;
  email?: string;
  password?: string;
}

async function getActiveAdmin(userId: string): Promise<AdminSessionUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, status')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status !== 'active') return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    fullName: data.full_name || '',
  };
}

/**
 * Retrieves the currently active admin session from Supabase
 */
export async function getAdminSession(): Promise<AdminSessionUser | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session?.user) {
      return await getActiveAdmin(session.user.id);
    }
  } catch (err) {
    console.warn('Supabase getSession notice:', err);
  }
  return null;
}

/**
 * Signs in an administrator using Supabase Auth with email & password
 */
export async function signInAdmin(email: string, password: string): Promise<AdminSessionUser> {
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('No user returned by Supabase authentication.');
  }

  const admin = await getActiveAdmin(data.user.id);
  if (!admin) {
    await supabase.auth.signOut();
    throw new Error('This account is not an active administrator.');
  }

  return admin;
}

/**
 * Updates the current logged-in admin's profile (name, email, and/or password)
 */
export async function updateAdminProfile(data: UpdateAdminProfileData): Promise<AdminSessionUser> {
  const updates: any = {};
  
  if (data.fullName !== undefined) {
    updates.data = { full_name: data.fullName.trim(), name: data.fullName.trim() };
  }
  if (data.password && data.password.trim().length >= 6) {
    updates.password = data.password.trim();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated administrator session found.');
  }

  const cleanEmail = (data.email && data.email.trim()) ? data.email.trim().toLowerCase() : (user.email || '');

  // Execute admin_update_user stored procedure for immediate auth.users & admin_users email consistency
  const { error: rpcError } = await supabase.rpc('admin_update_user', {
    p_user_id: user.id,
    p_full_name: data.fullName !== undefined ? data.fullName.trim() : null,
    p_email: cleanEmail,
    p_password: data.password && data.password.trim().length >= 6 ? data.password.trim() : null
  });

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  // Update auth session metadata
  try {
    await supabase.auth.updateUser(updates);
  } catch (authErr) {
    console.warn('supabase.auth.updateUser notice:', authErr);
  }

  // Synchronize 2FA verified session cache
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('2fa_verified_email', cleanEmail);
  }

  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: cleanEmail,
    role: (metadata.role as string) || 'admin',
    fullName: data.fullName !== undefined ? data.fullName.trim() : ((metadata.full_name as string) || ''),
  };
}

/**
 * Signs out the administrator from Supabase
 */
export async function signOutAdmin(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut notice:', err);
  }
}

/**
 * Subscribes to Supabase authentication state changes
 */
export function onAdminAuthStateChange(callback: (user: AdminSessionUser | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      callback(null);
      return;
    }

    void getActiveAdmin(session.user.id)
      .then(callback)
      .catch(() => callback(null));
  });

  return () => {
    subscription.unsubscribe();
  };
}
