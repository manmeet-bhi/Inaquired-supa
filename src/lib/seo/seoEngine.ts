import { supabase } from '../../lib/supabase.ts';
import { buildCanonicalUrl, cleanPathname } from './canonicalEngine.ts';
import { 
  generateJobPostingJsonLd, 
  generateBreadcrumbJsonLd, 
  generateWebSiteJsonLd, 
  generateOrganizationJsonLd,
  BreadcrumbItem 
} from './jsonLdEngine.ts';
import { DEFAULT_GLOBAL_SEO, DEFAULT_PAGE_SEO_LIST } from '../../services/seoService.ts';

export interface ServerMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: {
    index: boolean;
    follow: boolean;
  };
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    type: 'website' | 'article';
    imageUrl?: string;
  };
  twitter: {
    card: 'summary_large_image' | 'summary';
    title: string;
    description: string;
    site?: string;
    imageUrl?: string;
  };
  verification: {
    google?: string;
    bing?: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  jsonLd: Record<string, any>[];
  statusCode?: number;
}

/**
 * Next.js App Router style centralized metadata resolver
 */
export async function generateMetadata(
  pathname: string,
  origin: string
): Promise<ServerMetadata> {
  const rawPath = cleanPathname(pathname.split('?')[0]);
  const cleanPath = (rawPath === '/index.html' || rawPath === '') ? '/' : rawPath;
  const baseOrigin = origin.replace(/\/+$/, '');

  // 1. Fetch Global Settings from Supabase
  let globalSeo = DEFAULT_GLOBAL_SEO;
  try {
    const { data } = await supabase
      .from('seo_global_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (data) {
      globalSeo = {
        siteName: data.site_name || DEFAULT_GLOBAL_SEO.siteName,
        titleSeparator: data.title_separator || DEFAULT_GLOBAL_SEO.titleSeparator,
        defaultTitle: data.default_title || DEFAULT_GLOBAL_SEO.defaultTitle,
        defaultDescription: data.default_description || DEFAULT_GLOBAL_SEO.defaultDescription,
        defaultOgImageUrl: data.default_og_image_url || '',
        twitterHandle: data.twitter_handle || DEFAULT_GLOBAL_SEO.twitterHandle,
        googleSiteVerification: data.google_site_verification || '',
        bingSiteVerification: data.bing_site_verification || '',
        robotsTxtContent: data.robots_txt_content || DEFAULT_GLOBAL_SEO.robotsTxtContent,
        sitemapEnabled: data.sitemap_enabled ?? true
      };
    }
  } catch (err) {
    // Fall back to default global SEO
  }

  const siteName = globalSeo.siteName || 'inaquired';
  const sep = globalSeo.titleSeparator || '–';

  // 2. Protect Admin and API routes (Strictly NoIndex)
  if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/api')) {
    return {
      title: `Admin Control Panel ${sep} ${siteName}`,
      description: 'Restricted administrative workspace for Inaquired platform operations.',
      canonicalUrl: `${baseOrigin}${cleanPath}`,
      robots: { index: false, follow: false },
      openGraph: {
        title: `Admin Control Panel ${sep} ${siteName}`,
        description: 'Restricted administrative workspace.',
        url: `${baseOrigin}${cleanPath}`,
        siteName,
        type: 'website'
      },
      twitter: {
        card: 'summary',
        title: `Admin Control Panel ${sep} ${siteName}`,
        description: 'Restricted administrative workspace.'
      },
      verification: {},
      jsonLd: []
    };
  }

  // 3. Dynamic Job Details Page: /jobs/[slug]
  if (cleanPath.startsWith('/jobs/') && cleanPath !== '/jobs') {
    const slugOrId = decodeURIComponent(cleanPath.replace('/jobs/', '')).trim();

    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
        .single();

      if (!job) {
        // Job Not Found / Expired
        return {
          title: `Job Opening Not Found ${sep} ${siteName}`,
          description: 'The requested job opening is no longer active or has been archived.',
          canonicalUrl: `${baseOrigin}${cleanPath}`,
          robots: { index: false, follow: false },
          openGraph: {
            title: `Job Opening Not Found ${sep} ${siteName}`,
            description: 'The requested job opening is no longer active.',
            url: `${baseOrigin}${cleanPath}`,
            siteName,
            type: 'website'
          },
          twitter: {
            card: 'summary',
            title: `Job Opening Not Found ${sep} ${siteName}`,
            description: 'The requested job opening is no longer active.'
          },
          verification: {},
          jsonLd: [],
          statusCode: 404
        };
      }

      // Check if job is draft or archived
      const isPublished = job.status === 'published';
      const isBlocked = Boolean(job.no_index) || !isPublished;

      // Intelligent Fallbacks:
      // Title: Custom SEO Title -> "{Title} at {Company} {sep} {SiteName}"
      const title = job.seo_title && job.seo_title.trim()
        ? job.seo_title.trim()
        : `${job.title} at ${job.company_name} ${sep} ${siteName}`;

      // Description: Custom SEO Description -> generated from job metadata
      const description = job.seo_description && job.seo_description.trim()
        ? job.seo_description.trim()
        : `${job.title} vacancy at ${job.company_name} (${job.location || 'Remote'}). Work arrangement: ${job.work_arrangement}. Apply directly with transparent compensation.`;

      // Canonical: Custom canonical -> auto-generated URL
      const canonicalUrl = buildCanonicalUrl(job.canonical_url, `/jobs/${job.slug || job.id}`, baseOrigin);

      // Social Image
      const imageUrl = job.seo_image_url || job.attachment_url || globalSeo.defaultOgImageUrl || undefined;

      // Breadcrumbs: Home > Jobs > [Category] > [Job Title]
      const breadcrumbs: BreadcrumbItem[] = [
        { name: 'Home', path: '/' },
        { name: 'Jobs', path: '/jobs' },
        { name: job.category || 'General', path: `/departments?category=${encodeURIComponent(job.category || 'General')}` },
        { name: job.title, path: `/jobs/${job.slug || job.id}` }
      ];

      // Structured Data: JobPosting + BreadcrumbList
      const jsonLd: Record<string, any>[] = [
        generateJobPostingJsonLd(job, baseOrigin),
        generateBreadcrumbJsonLd(breadcrumbs, baseOrigin)
      ];

      return {
        title,
        description,
        canonicalUrl,
        robots: {
          index: !isBlocked,
          follow: !isBlocked
        },
        openGraph: {
          title,
          description,
          url: canonicalUrl,
          siteName,
          type: 'article',
          imageUrl
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          site: globalSeo.twitterHandle,
          imageUrl
        },
        verification: {
          google: globalSeo.googleSiteVerification,
          bing: globalSeo.bingSiteVerification
        },
        breadcrumbs,
        jsonLd,
        statusCode: 200
      };

    } catch (err) {
      console.warn('[SEO Engine] Error resolving dynamic job metadata:', err);
    }
  }

  // 3.5 Dynamic Category Page: /category/[slug]
  if (cleanPath.startsWith('/category/') && cleanPath !== '/category') {
    const rawCategory = decodeURIComponent(cleanPath.replace('/category/', '')).trim();
    const formattedCategory = rawCategory
      .split(/[-_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const title = `${formattedCategory} Jobs ${sep} ${siteName}`;
    const description = `Discover verified ${formattedCategory} career opportunities on ${siteName}. Apply directly with salary transparency.`;
    const canonicalUrl = buildCanonicalUrl(undefined, cleanPath, baseOrigin);

    return {
      title,
      description,
      canonicalUrl,
      robots: { index: true, follow: true },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName,
        type: 'website',
        imageUrl: globalSeo.defaultOgImageUrl || undefined
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: globalSeo.twitterHandle,
        imageUrl: globalSeo.defaultOgImageUrl || undefined
      },
      verification: {
        google: globalSeo.googleSiteVerification,
        bing: globalSeo.bingSiteVerification
      },
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Departments', path: '/departments' },
        { name: formattedCategory, path: cleanPath }
      ],
      jsonLd: [],
      statusCode: 200
    };
  }

  // 3.6 Dynamic Company Page: /company/[name]
  if (cleanPath.startsWith('/company/') && cleanPath !== '/company') {
    const company = decodeURIComponent(cleanPath.replace('/company/', '')).trim();
    const title = `Careers at ${company} ${sep} ${siteName}`;
    const description = `Explore open job openings and career opportunities at ${company} on ${siteName}.`;
    const canonicalUrl = buildCanonicalUrl(undefined, cleanPath, baseOrigin);

    return {
      title,
      description,
      canonicalUrl,
      robots: { index: true, follow: true },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName,
        type: 'website',
        imageUrl: globalSeo.defaultOgImageUrl || undefined
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: globalSeo.twitterHandle,
        imageUrl: globalSeo.defaultOgImageUrl || undefined
      },
      verification: {
        google: globalSeo.googleSiteVerification,
        bing: globalSeo.bingSiteVerification
      },
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Companies', path: '/companies' },
        { name: company, path: cleanPath }
      ],
      jsonLd: [],
      statusCode: 200
    };
  }

  // 4. Static Public Routes & Overrides
  let targetPath = cleanPath;
  if (targetPath === '/by-departments') targetPath = '/departments';
  if (targetPath === '/by-companies') targetPath = '/companies';
  if (targetPath === '/post-job') targetPath = '/post-a-job';
  if (targetPath === '/cookie-policy') targetPath = '/cookies';

  let pageConfig: any = null;
  try {
    const { data } = await supabase
      .from('seo_page_settings')
      .select('*')
      .eq('route_path', targetPath)
      .single();

    if (data) {
      pageConfig = {
        routePath: data.route_path,
        pageName: data.page_name,
        metaTitle: data.meta_title,
        metaDescription: data.meta_description,
        canonicalUrl: data.canonical_url,
        ogTitle: data.og_title,
        ogDescription: data.og_description,
        ogImageUrl: data.og_image_url,
        ogType: data.og_type || 'website',
        twitterCard: data.twitter_card || 'summary_large_image',
        noIndex: Boolean(data.no_index),
        noFollow: Boolean(data.no_follow)
      };
    }
  } catch {
    // Fall back to built-in page defaults
  }

  // Fallback to DEFAULT_PAGE_SEO_LIST if database entry not yet populated
  if (!pageConfig) {
    pageConfig = DEFAULT_PAGE_SEO_LIST.find(p => p.routePath === targetPath) || null;
  }

  // If known page exists
  if (pageConfig) {
    const title = pageConfig.metaTitle || globalSeo.defaultTitle;
    const description = pageConfig.metaDescription || globalSeo.defaultDescription;
    const canonicalUrl = buildCanonicalUrl(pageConfig.canonicalUrl, cleanPath, baseOrigin);
    const imageUrl = pageConfig.ogImageUrl || globalSeo.defaultOgImageUrl || undefined;

    const breadcrumbs: BreadcrumbItem[] = cleanPath === '/'
      ? [{ name: 'Home', path: '/' }]
      : [
          { name: 'Home', path: '/' },
          { name: pageConfig.pageName || cleanPath.replace('/', ''), path: cleanPath }
        ];

    const jsonLd: Record<string, any>[] = [];

    // Root page gets WebSite and Organization
    if (cleanPath === '/') {
      jsonLd.push(generateWebSiteJsonLd(siteName, baseOrigin));
      jsonLd.push(generateOrganizationJsonLd(siteName, baseOrigin, globalSeo.twitterHandle));
    } else {
      jsonLd.push(generateBreadcrumbJsonLd(breadcrumbs, baseOrigin));
    }

    return {
      title,
      description,
      canonicalUrl,
      robots: {
        index: !pageConfig.noIndex,
        follow: !pageConfig.noFollow
      },
      openGraph: {
        title: pageConfig.ogTitle || title,
        description: pageConfig.ogDescription || description,
        url: canonicalUrl,
        siteName,
        type: pageConfig.ogType || 'website',
        imageUrl
      },
      twitter: {
        card: pageConfig.twitterCard || 'summary_large_image',
        title: pageConfig.ogTitle || title,
        description: pageConfig.ogDescription || description,
        site: globalSeo.twitterHandle,
        imageUrl
      },
      verification: {
        google: globalSeo.googleSiteVerification,
        bing: globalSeo.bingSiteVerification
      },
      breadcrumbs,
      jsonLd,
      statusCode: 200
    };
  }

  // 5. Unrecognized Route (Strict 404 Metadata to prevent Soft 404s)
  return {
    title: `Page Not Found ${sep} ${siteName}`,
    description: 'The requested page could not be located on the Inaquired platform.',
    canonicalUrl: `${baseOrigin}${cleanPath}`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `Page Not Found ${sep} ${siteName}`,
      description: 'The requested page could not be located.',
      url: `${baseOrigin}${cleanPath}`,
      siteName,
      type: 'website'
    },
    twitter: {
      card: 'summary',
      title: `Page Not Found ${sep} ${siteName}`,
      description: 'The requested page could not be located.'
    },
    verification: {},
    jsonLd: [],
    statusCode: 404
  };
}

/**
 * Escapes HTML attributes safely
 */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generates server-rendered HTML <head> string
 */
export function renderServerHtmlHeadTags(meta: ServerMetadata): string {
  const tags: string[] = [];

  // 1. Primary Title & Description
  tags.push(`<title>${escapeHtmlAttr(meta.title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`);

  // 2. Canonical URL
  tags.push(`<link rel="canonical" href="${escapeHtmlAttr(meta.canonicalUrl)}" />`);

  // 3. Robots Directives
  const robotDirectives: string[] = [];
  robotDirectives.push(meta.robots.index ? 'index' : 'noindex');
  robotDirectives.push(meta.robots.follow ? 'follow' : 'nofollow');
  tags.push(`<meta name="robots" content="${robotDirectives.join(', ')}" />`);

  // 4. OpenGraph Tags
  tags.push(`<meta property="og:title" content="${escapeHtmlAttr(meta.openGraph.title)}" />`);
  tags.push(`<meta property="og:description" content="${escapeHtmlAttr(meta.openGraph.description)}" />`);
  tags.push(`<meta property="og:url" content="${escapeHtmlAttr(meta.openGraph.url)}" />`);
  tags.push(`<meta property="og:site_name" content="${escapeHtmlAttr(meta.openGraph.siteName)}" />`);
  tags.push(`<meta property="og:type" content="${escapeHtmlAttr(meta.openGraph.type)}" />`);
  if (meta.openGraph.imageUrl) {
    tags.push(`<meta property="og:image" content="${escapeHtmlAttr(meta.openGraph.imageUrl)}" />`);
  }

  // 5. Twitter / X Tags
  tags.push(`<meta name="twitter:card" content="${escapeHtmlAttr(meta.twitter.card)}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtmlAttr(meta.twitter.title)}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtmlAttr(meta.twitter.description)}" />`);
  if (meta.twitter.site) {
    tags.push(`<meta name="twitter:site" content="${escapeHtmlAttr(meta.twitter.site)}" />`);
  }
  if (meta.twitter.imageUrl) {
    tags.push(`<meta name="twitter:image" content="${escapeHtmlAttr(meta.twitter.imageUrl)}" />`);
  }

  // 6. Search Console Verifications
  if (meta.verification.google) {
    tags.push(`<meta name="google-site-verification" content="${escapeHtmlAttr(meta.verification.google)}" />`);
  }
  if (meta.verification.bing) {
    tags.push(`<meta name="msvalidate.01" content="${escapeHtmlAttr(meta.verification.bing)}" />`);
  }

  // 7. Structured Data / JSON-LD Scripts
  for (const schema of meta.jsonLd) {
    const serializedSchema = JSON.stringify(schema)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
    tags.push(`<script type="application/ld+json">${serializedSchema}</script>`);
  }

  return tags.join('\n    ');
}

/**
 * Injects pre-rendered metadata into the HTML template, replacing any placeholder tags
 */
export function injectMetadataIntoHtml(htmlTemplate: string, meta: ServerMetadata): string {
  // Strip existing static title and description tags from template to prevent duplication
  let cleanHtml = htmlTemplate
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name="description"[\s\S]*?>/gi, '')
    .replace(/<meta\s+property="og:title"[\s\S]*?>/gi, '')
    .replace(/<meta\s+property="og:description"[\s\S]*?>/gi, '')
    .replace(/<meta\s+property="og:type"[\s\S]*?>/gi, '')
    .replace(/<meta\s+property="og:site_name"[\s\S]*?>/gi, '')
    .replace(/<meta\s+property="og:image"[\s\S]*?>/gi, '')
    .replace(/<meta\s+name="twitter:card"[\s\S]*?>/gi, '')
    .replace(/<meta\s+name="twitter:title"[\s\S]*?>/gi, '')
    .replace(/<meta\s+name="twitter:description"[\s\S]*?>/gi, '')
    .replace(/<meta\s+name="twitter:site"[\s\S]*?>/gi, '')
    .replace(/<meta\s+name="twitter:image"[\s\S]*?>/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?>/gi, '')
    .replace(/<meta\s+name="robots"[\s\S]*?>/gi, '')
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

  const renderedHeadTags = renderServerHtmlHeadTags(meta);

  // Inject into <head>
  if (cleanHtml.includes('</head>')) {
    return cleanHtml.replace('</head>', `    ${renderedHeadTags}\n  </head>`);
  }

  return `${renderedHeadTags}\n${cleanHtml}`;
}
