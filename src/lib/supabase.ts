import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  return defaultValue;
};

export const SUPABASE_URL = 
  getEnvVar('VITE_SUPABASE_URL', '');

export const SUPABASE_ANON_KEY = 
  getEnvVar('VITE_SUPABASE_ANON_KEY', '');

export const SUPABASE_STORAGE_URL =
  getEnvVar('VITE_SUPABASE_STORAGE_URL', '');

export const SUPABASE_STORAGE_REGION =
  getEnvVar('VITE_SUPABASE_STORAGE_REGION', 'ap-northeast-1');

export const SUPABASE_STORAGE_BUCKET =
  getEnvVar('VITE_SUPABASE_STORAGE_BUCKET', 'ap-northeast-1');

const sessionPersistenceKey = 'inaquired_admin_keep_logged_in';
const observedAuthStorageKeys = new Set<string>();
let keepAdminSessionLoggedIn = true;

if (typeof window !== 'undefined') {
  try {
    keepAdminSessionLoggedIn = window.localStorage.getItem(sessionPersistenceKey) !== 'false';
  } catch (error) {
    console.warn('Could not read administrator session preference:', error);
  }
}

const authStorage = {
  getItem: async (key: string) => {
    observedAuthStorageKeys.add(key);
    if (typeof window === 'undefined') return null;
    const storage = keepAdminSessionLoggedIn ? window.localStorage : window.sessionStorage;
    return storage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    observedAuthStorageKeys.add(key);
    if (typeof window === 'undefined') return;
    const storage = keepAdminSessionLoggedIn ? window.localStorage : window.sessionStorage;
    storage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    observedAuthStorageKeys.add(key);
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export function setAdminSessionPersistence(keepLoggedIn: boolean): void {
  keepAdminSessionLoggedIn = keepLoggedIn;
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(sessionPersistenceKey, String(keepLoggedIn));
    for (const key of observedAuthStorageKeys) {
      const target = keepLoggedIn ? window.localStorage : window.sessionStorage;
      const source = keepLoggedIn ? window.sessionStorage : window.localStorage;
      const existingSession = source.getItem(key);
      if (existingSession) target.setItem(key, existingSession);
      source.removeItem(key);
    }
  } catch (error) {
    console.error('Could not update administrator session persistence:', error);
    throw error;
  }
}

/**
 * Supabase client instance for real-time data sync, database queries, and storage
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: authStorage,
  },
});

export interface SupabaseErrorInfo {
  error: string;
  operationType: string;
  table?: string;
  details?: string;
}

export function handleSupabaseError(error: unknown, operationType: string, table?: string): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: SupabaseErrorInfo = {
    error: errMessage,
    operationType,
    table,
  };
  console.warn('Supabase Error: ', errInfo);
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Quick connection check to Supabase
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('jobs').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // Table might not be created yet, but connection is alive
      console.info('Supabase reachable (table check):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase connection test note: falling back to local store.', err);
    return false;
  }
}
