import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const publicJobColumns = [
  'id',
  'title',
  'slug',
  'company_name',
  'location',
  'job_type',
  'work_arrangement',
  'category',
  'experience_level',
  'salary_min',
  'salary_max',
  'currency',
  'description',
  'responsibilities',
  'requirements',
  'benefits',
  'application_url',
  'application_deadline',
  'tags',
  'status',
  'featured',
  'created_at',
  'updated_at',
  'published_at',
  'seo_title',
  'seo_description',
  'seo_image_url',
  'canonical_url',
  'no_index',
].join(',');

const pageSize = 500;

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
  res.end(JSON.stringify(payload));
}

function getSearchParams(req: any): URLSearchParams {
  const requestUrl = new URL(req.url || req.originalUrl || '/', 'http://localhost');
  return requestUrl.searchParams;
}

export async function handlePublicJobs(req: any, res: any) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseKey = serviceRoleKey || anonKey;
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Public Jobs API] VITE_SUPABASE_URL and a Supabase API key must be configured.');
    return sendJson(res, 503, { error: 'Job listings are temporarily unavailable.' });
  }

  try {
    const visibleStatuses = ['published', 'archived'];
    const searchParams = getSearchParams(req);
    const rawSlug = searchParams.get('slug');
    const slug = rawSlug?.trim();
    const rawSearch = searchParams.get('q')?.trim() || '';
    const search = rawSearch.replace(/[,()"\\]/g, ' ').replace(/\s+/g, ' ').trim();
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 30;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (slug && !/^[a-zA-Z0-9._-]+$/.test(slug)) {
      return sendJson(res, 400, { error: 'Invalid job identifier.' });
    }
    if (rawSearch && !search) {
      return sendJson(res, 400, { error: 'Search query contains no searchable characters.' });
    }

    if (slug || search) {
      let query = supabase
        .from('jobs')
        .select(publicJobColumns)
        .in('status', visibleStatuses);

      if (slug) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`).limit(1);
      } else {
        if (!search) {
          return sendJson(res, 400, { error: 'Search query cannot be empty.' });
        }
        query = query
          .or(`title.ilike.%${search}%,company_name.ilike.%${search}%,category.ilike.%${search}%,location.ilike.%${search}%`)
          .order('published_at', { ascending: false })
          .limit(limit);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[Public Jobs API] Job query failed:', error.message);
        return sendJson(res, 500, { error: 'Unable to load job listings.' });
      }

      return sendJson(res, 200, { jobs: data || [] });
    }

    const allRows = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from('jobs')
        .select(publicJobColumns)
        .in('status', visibleStatuses)
        .order('published_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('[Public Jobs API] Listing query failed:', error.message);
        return sendJson(res, 500, { error: 'Unable to load job listings.' });
      }

      allRows.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }

    return sendJson(res, 200, { jobs: allRows });
  } catch (error) {
    console.error('[Public Jobs API] Unexpected error:', error);
    return sendJson(res, 500, { error: 'Unable to load job listings.' });
  }
}
