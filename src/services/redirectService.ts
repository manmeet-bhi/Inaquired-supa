import { supabase } from '../lib/supabase.ts';

export interface SeoRedirect {
  id: string;
  source_path: string;
  destination_path: string;
  status_code: 301 | 302 | 307 | 308;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// In-memory cache for fast server-side and client-side lookups
let redirectCache: SeoRedirect[] | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function clearRedirectCache() {
  redirectCache = null;
  lastCacheFetchTime = 0;
}

/**
 * Validates whether adding/updating a redirect would cause a circular loop
 */
export function detectRedirectLoop(
  sourcePath: string,
  destinationPath: string,
  existingList: SeoRedirect[]
): { hasLoop: boolean; message?: string } {
  const normSource = sourcePath.trim().replace(/\/+$/, '') || '/';
  const normDest = destinationPath.trim().replace(/\/+$/, '') || '/';

  if (normSource === normDest) {
    return { hasLoop: true, message: 'Source and destination cannot be identical (self-redirect loop).' };
  }

  // Check chain up to 10 hops
  let currentTarget = normDest;
  const visited = new Set<string>([normSource]);

  for (let hop = 0; hop < 10; hop++) {
    if (visited.has(currentTarget)) {
      return { hasLoop: true, message: `Circular redirect loop detected: ${currentTarget} routes back to ${sourcePath}.` };
    }
    visited.add(currentTarget);

    const nextHop = existingList.find(r => r.is_active && r.source_path.replace(/\/+$/, '') === currentTarget);
    if (!nextHop) break;
    currentTarget = nextHop.destination_path.replace(/\/+$/, '');
  }

  return { hasLoop: false };
}

/**
 * Fetch all redirects from Supabase
 */
export async function getAllRedirects(): Promise<SeoRedirect[]> {
  const now = Date.now();
  if (redirectCache && now - lastCacheFetchTime < CACHE_TTL_MS) {
    return redirectCache;
  }

  try {
    const { data, error } = await supabase
      .from('seo_redirects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      redirectCache = data as SeoRedirect[];
      lastCacheFetchTime = now;
      return redirectCache;
    }
  } catch (err) {
    console.warn('[RedirectService] Error fetching redirects:', err);
  }

  return redirectCache || [];
}

/**
 * Fast lookup for a single route redirect (used in server middleware and router)
 */
export async function getRedirectForPath(
  path: string
): Promise<{ destination: string; status: number } | null> {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/';
  const all = await getAllRedirects();
  const match = all.find(r => r.is_active && (r.source_path.replace(/\/+$/, '') || '/') === clean);

  if (match) {
    return {
      destination: match.destination_path,
      status: match.status_code || 301
    };
  }

  return null;
}

/**
 * Create a new redirect
 */
export async function createRedirect(redirect: {
  source_path: string;
  destination_path: string;
  status_code?: 301 | 302 | 307 | 308;
  is_active?: boolean;
  notes?: string;
}): Promise<SeoRedirect> {
  const existing = await getAllRedirects();
  const loopCheck = detectRedirectLoop(redirect.source_path, redirect.destination_path, existing);
  if (loopCheck.hasLoop) {
    throw new Error(loopCheck.message);
  }

  const payload = {
    source_path: redirect.source_path.trim(),
    destination_path: redirect.destination_path.trim(),
    status_code: redirect.status_code || 301,
    is_active: redirect.is_active ?? true,
    notes: redirect.notes || '',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('seo_redirects')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create redirect');
  }

  clearRedirectCache();
  return data as SeoRedirect;
}

/**
 * Update an existing redirect
 */
export async function updateRedirect(
  id: string,
  updates: Partial<SeoRedirect>
): Promise<SeoRedirect> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('seo_redirects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update redirect');
  }

  clearRedirectCache();
  return data as SeoRedirect;
}

/**
 * Delete a redirect
 */
export async function deleteRedirect(id: string): Promise<void> {
  const { error } = await supabase
    .from('seo_redirects')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to delete redirect');
  }

  clearRedirectCache();
}
