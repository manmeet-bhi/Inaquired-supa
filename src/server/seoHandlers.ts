import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function sendRawResponse(res: any, statusCode: number, content: string, contentType: string) {
  const buffer = Buffer.from(content, 'utf-8');
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
    res.statusCode = statusCode;
  } else if (typeof res.writeHead === 'function') {
    res.writeHead(statusCode, {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    });
  }
  res.end(buffer);
}

function resolveOrigin(req: any): string {
  const forwardedProto = req.headers?.['x-forwarded-proto'];
  const forwardedHost = req.headers?.['x-forwarded-host'];
  const host = forwardedHost || req.headers?.host || 'localhost:3000';
  const proto = forwardedProto || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function normalizeRobotsTxtContent(raw?: string, origin?: string): string {
  const defaultRobots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/

Sitemap: /sitemap.xml`;

  let content = raw || defaultRobots;
  // Unescape any literal '\\r\\n' or '\\n'
  content = content.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

  // Replace relative /sitemap.xml or inaquired.app with target origin if origin is provided
  if (origin) {
    content = content
      .replace(/Sitemap:\s*https?:\/\/[^\/]+\/sitemap\.xml/gi, `Sitemap: ${origin}/sitemap.xml`)
      .replace(/Sitemap:\s*\/sitemap\.xml/gi, `Sitemap: ${origin}/sitemap.xml`);
  }

  // Ensure trailing newline
  return content.trim() + '\n';
}

/**
 * Handle GET /robots.txt
 */
export async function handleRobotsTxt(req: any, res: any) {
  try {
    const origin = resolveOrigin(req);
    const { data } = await supabase
      .from('seo_global_settings')
      .select('robots_txt_content')
      .eq('id', 'global')
      .single();

    const rawContent = data?.robots_txt_content;
    const body = normalizeRobotsTxtContent(rawContent, origin);
    return sendRawResponse(res, 200, body, 'text/plain; charset=utf-8');
  } catch (err: any) {
    console.error('[SEO Handler] Error generating robots.txt:', err);
    const fallback = normalizeRobotsTxtContent(undefined, resolveOrigin(req));
    return sendRawResponse(res, 200, fallback, 'text/plain; charset=utf-8');
  }
}

/**
 * Static public routes list with SEO priorities
 */
export const STATIC_PUBLIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/jobs', priority: '0.9', changefreq: 'daily' },
  { path: '/remote-jobs', priority: '0.8', changefreq: 'daily' },
  { path: '/hybrid-jobs', priority: '0.8', changefreq: 'daily' },
  { path: '/internships', priority: '0.8', changefreq: 'daily' },
  { path: '/departments', priority: '0.8', changefreq: 'weekly' },
  { path: '/companies', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/post-a-job', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookies', priority: '0.3', changefreq: 'yearly' },
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generates XML Sitemap string
 */
export async function generateSitemapXmlString(origin: string): Promise<string> {
  const [jobsRes, categoriesRes, globalSeoRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, slug, title, category, company_name, updated_at, created_at, status')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true }),
    supabase
      .from('seo_global_settings')
      .select('sitemap_enabled')
      .eq('id', 'global')
      .single()
  ]);

  if (globalSeoRes.data && globalSeoRes.data.sitemap_enabled === false) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Sitemap disabled by site administrator -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }

  const jobs = jobsRes.data || [];
  const categories = categoriesRes.data || [];

  const urlEntries: string[] = [];

  // 1. Static Public Pages
  for (const route of STATIC_PUBLIC_ROUTES) {
    const loc = `${origin}${route.path}`;
    urlEntries.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // 2. Published Jobs Detail Pages
  for (const job of jobs) {
    const jobIdentifier = job.slug || job.id;
    const loc = `${origin}/jobs/${encodeURIComponent(jobIdentifier)}`;
    const lastmod = formatDate(job.updated_at || job.created_at);
    urlEntries.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // 3. Department / Category Pages
  // Include explicit categories from database as well as distinct categories in jobs
  const catNames = new Set<string>();
  categories.forEach(c => c.name && catNames.add(c.name));
  jobs.forEach(j => j.category && catNames.add(j.category));

  for (const cat of catNames) {
    const loc = `${origin}/departments?category=${encodeURIComponent(cat)}`;
    urlEntries.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // 4. Company Landing Pages
  const companyNames = new Set<string>();
  jobs.forEach(j => {
    if (j.company_name && j.company_name.trim()) {
      companyNames.add(j.company_name.trim());
    }
  });

  for (const comp of companyNames) {
    const loc = `${origin}/company/${encodeURIComponent(comp)}`;
    urlEntries.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;
}

/**
 * Handle GET /sitemap.xml
 */
export async function handleSitemapXml(req: any, res: any) {
  try {
    const origin = resolveOrigin(req);
    const xml = await generateSitemapXmlString(origin);
    return sendRawResponse(res, 200, xml, 'application/xml; charset=utf-8');
  } catch (err: any) {
    console.error('[SEO Handler] Error generating sitemap.xml:', err);
    const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${resolveOrigin(req)}/</loc></url></urlset>`;
    return sendRawResponse(res, 200, minimalXml, 'application/xml; charset=utf-8');
  }
}

/**
 * Handle GET /api/seo/summary (for admin dashboard live counters)
 */
export async function handleSeoSummary(req: any, res: any) {
  try {
    const [jobsRes, categoriesRes, globalSeoRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, company_name, status')
        .eq('status', 'published'),
      supabase
        .from('categories')
        .select('id'),
      supabase
        .from('seo_global_settings')
        .select('sitemap_enabled, updated_at')
        .eq('id', 'global')
        .single()
    ]);

    const jobs = jobsRes.data || [];
    const companies = new Set(jobs.map(j => j.company_name?.trim()).filter(Boolean));

    const data = {
      publishedJobsCount: jobs.length,
      staticPagesCount: STATIC_PUBLIC_ROUTES.length,
      categoriesCount: categoriesRes.data?.length || 0,
      companiesCount: companies.size,
      totalSitemapUrls: STATIC_PUBLIC_ROUTES.length + jobs.length + (categoriesRes.data?.length || 0) + companies.size,
      sitemapEnabled: globalSeoRes.data?.sitemap_enabled ?? true,
      lastUpdated: globalSeoRes.data?.updated_at || new Date().toISOString()
    };

    const json = JSON.stringify(data);
    return sendRawResponse(res, 200, json, 'application/json');
  } catch (err: any) {
    return sendRawResponse(res, 500, JSON.stringify({ error: err.message }), 'application/json');
  }
}
