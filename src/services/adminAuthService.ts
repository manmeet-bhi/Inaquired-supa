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

/**
 * Retrieves the currently active admin session from Supabase
 */
export async function getAdminSession(): Promise<AdminSessionUser | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error && session?.user) {
      const metadata = session.user.user_metadata || {};
      return {
        id: session.user.id,
        email: session.user.email || '',
        role: (metadata.role as string) || 'admin',
        fullName: (metadata.full_name as string) || (metadata.name as string) || '',
      };
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

  const metadata = data.user.user_metadata || {};
  return {
    id: data.user.id,
    email: data.user.email || cleanEmail,
    role: (metadata.role as string) || 'admin',
    fullName: (metadata.full_name as string) || (metadata.name as string) || '',
  };
}

/**
 * Updates the current logged-in admin's profile (name, email, and/or password)
 */
export async function updateAdminProfile(data: UpdateAdminProfileData): Promise<AdminSessionUser> {
  const updates: any = {};
  
  if (data.fullName !== undefined) {
    updates.data = { full_name: data.fullName.trim(), name: data.fullName.trim() };
  }
  if (data.email && data.email.trim()) {
    updates.email = data.email.trim().toLowerCase();
  }
  if (data.password && data.password.trim().length >= 6) {
    updates.password = data.password.trim();
  }

  const { data: res, error } = await supabase.auth.updateUser(updates);
  if (error) {
    throw error;
  }

  if (!res.user) {
    throw new Error('Failed to update profile.');
  }

  // Also sync with public.admin_users if present
  try {
    const tableUpdate: any = { updated_at: new Date().toISOString() };
    if (data.fullName !== undefined) tableUpdate.full_name = data.fullName.trim();
    if (data.email) tableUpdate.email = data.email.trim().toLowerCase();
    await supabase.from('admin_users').update(tableUpdate).eq('id', res.user.id);
  } catch (syncErr) {
    // Non-blocking sync warning
    console.warn('admin_users table sync notice:', syncErr);
  }

  const metadata = res.user.user_metadata || {};
  return {
    id: res.user.id,
    email: res.user.email || (data.email ? data.email.trim().toLowerCase() : ''),
    role: (metadata.role as string) || 'admin',
    fullName: (metadata.full_name as string) || (metadata.name as string) || (data.fullName?.trim() || ''),
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
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const metadata = session.user.user_metadata || {};
      callback({
        id: session.user.id,
        email: session.user.email || '',
        role: (metadata.role as string) || 'admin',
        fullName: (metadata.full_name as string) || (metadata.name as string) || '',
      });
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

