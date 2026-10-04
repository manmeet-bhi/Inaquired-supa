import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Unsubscribe = () => void;

/**
 * Fetches all categories / departments from Supabase
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase getCategories error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn('getCategories error:', err);
    return [];
  }
}

/**
 * Subscribes to real-time changes in categories
 */
export function subscribeToCategories(
  onUpdate: (categories: Category[]) => void
): Unsubscribe {
  let isSubscribed = true;

  const load = async () => {
    const cats = await getCategories();
    if (isSubscribed) {
      onUpdate(cats);
    }
  };

  load();

  const channel = supabase
    .channel('public:categories_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
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
 * Creates a new category / department
 */
export async function createCategory(data: { name: string; slug: string; description?: string }): Promise<Category> {
  const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const payload = {
    id,
    name: data.name.trim(),
    slug: cleanSlug,
    description: data.description?.trim() || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: inserted.id,
    name: inserted.name,
    slug: inserted.slug,
    description: inserted.description,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
  };
}

/**
 * Updates an existing category (name, slug, description)
 */
export async function updateCategory(
  id: string,
  updates: { name?: string; slug?: string; description?: string }
): Promise<void> {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.slug !== undefined) {
    payload.slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  if (updates.description !== undefined) payload.description = updates.description.trim();

  const { error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a category / department
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}
