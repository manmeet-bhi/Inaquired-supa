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
  getEnvVar('VITE_SUPABASE_URL', 'https://wnpsrdtlqxfiglhmalwq.supabase.co');

export const SUPABASE_ANON_KEY = 
  getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_n2im84IXBbQ3v2XluipN6Q_N_gfjbhu');

export const SUPABASE_STORAGE_URL =
  getEnvVar('VITE_SUPABASE_STORAGE_URL', 'https://wnpsrdtlqxfiglhmalwq.storage.supabase.co/storage/v1/s3');

export const SUPABASE_STORAGE_REGION =
  getEnvVar('VITE_SUPABASE_STORAGE_REGION', 'ap-northeast-1');

export const SUPABASE_STORAGE_BUCKET =
  getEnvVar('VITE_SUPABASE_STORAGE_BUCKET', 'ap-northeast-1');

/**
 * Supabase client instance for real-time data sync, database queries, and storage
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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
