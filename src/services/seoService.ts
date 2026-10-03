import { supabase } from '../lib/supabase.ts';

export interface GlobalSeoSettings {
  siteName: string;
  titleSeparator: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImageUrl: string;
  twitterHandle: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  robotsTxtContent: string;
  sitemapEnabled: boolean;
  updatedAt?: string;
}

export interface PageRouteSeo {
  routePath: string; // e.g. '/', '/jobs', '/departments'
  pageName: string; // e.g. 'Home Landing', 'Browse Jobs'
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary_large_image' | 'summary';
  noIndex: boolean;
  noFollow: boolean;
  updatedAt?: string;
}

export function sanitizeDefaultUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('https://inaquired.app')) return '';
  return url;
}

export function normalizeRobotsTxt(raw?: string): string {
  if (!raw) return DEFAULT_GLOBAL_SEO.robotsTxtContent;
  let cleaned = raw.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/https?:\/\/inaquired\.app\/sitemap\.xml/g, '/sitemap.xml');
  return cleaned.trim() + '\n';
}

export const DEFAULT_GLOBAL_SEO: GlobalSeoSettings = {
  siteName: 'inaquired',
  titleSeparator: '–',
  defaultTitle: 'inaquired – Find Remote, On-Site & Hybrid Jobs & Internships',
  defaultDescription: 'Discover verified career opportunities on inaquired. Explore remote, hybrid, and on-site roles with direct employer links, zero spam, and transparent compensation.',
  defaultOgImageUrl: '',
  twitterHandle: '@inaquired',
  googleSiteVerification: '',
  bingSiteVerification: '',
  robotsTxtContent: `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/

Sitemap: /sitemap.xml`,
  sitemapEnabled: true,
  updatedAt: new Date().toISOString()
};

export const DEFAULT_PAGE_SEO_LIST: PageRouteSeo[] = [
  {
    routePath: '/',
    pageName: 'Home Landing Page',
    metaTitle: 'inaquired – Find Remote, On-Site & Hybrid Jobs & Internships',
    metaDescription: 'Discover verified career opportunities on inaquired. Explore remote, hybrid, and on-site roles with direct employer links, zero spam, and transparent compensation.',
    keywords: ['remote jobs', 'tech careers', 'verified job listings', 'software engineer jobs', 'paid internships'],
    canonicalUrl: '',
    ogTitle: 'inaquired – Find Remote, On-Site & Hybrid Jobs',
    ogDescription: 'Verified opportunities with salary transparency and direct application links.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/jobs',
    pageName: 'Browse All Jobs',
    metaTitle: 'Explore Verified Job Openings & Remote Opportunities | inaquired',
    metaDescription: 'Filter thousands of open tech, design, marketing, and engineering positions with verified compensation packages and zero registration barriers.',
    keywords: ['all jobs', 'job search', 'remote tech jobs', 'startup hiring', 'engineering jobs'],
    canonicalUrl: '',
    ogTitle: 'Browse Verified Openings | inaquired',
    ogDescription: 'Real-time job search across engineering, product, sales, and design.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/departments',
    pageName: 'Departments Directory',
    metaTitle: 'Browse Jobs by Department & Industry Category | inaquired',
    metaDescription: 'Explore career openings categorized by industry: Engineering, Design, Product Management, Marketing, Data & AI, Sales, and Finance.',
    keywords: ['job departments', 'career categories', 'engineering roles', 'marketing careers', 'product management'],
    canonicalUrl: '',
    ogTitle: 'Browse Jobs by Department | inaquired',
    ogDescription: 'Curated career opportunities categorized across 10+ industry verticals.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/companies',
    pageName: 'Hiring Companies',
    metaTitle: 'Verified Hiring Companies & Top Tech Employers | inaquired',
    metaDescription: 'Discover transparent employers and top startups actively hiring candidates worldwide with direct application links.',
    keywords: ['companies hiring', 'top tech employers', 'remote startups', 'verified employers'],
    canonicalUrl: '',
    ogTitle: 'Hiring Companies Directory | inaquired',
    ogDescription: 'Explore companies with active hiring openings and verified candidate protection.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/about',
    pageName: 'About Us',
    metaTitle: 'About inaquired – The Transparent Career Discovery Platform',
    metaDescription: 'Our mission is to make job discovery simple, transparent, and accessible for everyone by gathering verified openings from trusted direct sources.',
    keywords: ['about inaquired', 'job platform mission', 'career discovery', 'serverless job portal'],
    canonicalUrl: '',
    ogTitle: 'About inaquired – Transparent Job Discovery',
    ogDescription: 'Learn about our zero-spam platform bridging talent and verified opportunities.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/contact',
    pageName: 'Contact & Support',
    metaTitle: 'Contact Support & Employer Partnerships | inaquired',
    metaDescription: 'Get in touch with the inaquired team for employer partnerships, opening verifications, or candidate support.',
    keywords: ['contact inaquired', 'employer support', 'partnership inquiries', 'help desk'],
    canonicalUrl: '',
    ogTitle: 'Contact inaquired Support & Partnerships',
    ogDescription: 'Reach out to our team for questions, feedback, or verified employer listings.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/privacy',
    pageName: 'Privacy Policy',
    metaTitle: 'Privacy Policy & Candidate Data Protection | inaquired',
    metaDescription: 'Learn how inaquired safeguards candidate confidentiality with zero unsolicited data sharing and no mandatory applicant registration.',
    keywords: ['privacy policy', 'candidate privacy', 'gdpr compliance', 'data protection'],
    canonicalUrl: '',
    ogTitle: 'Privacy Policy | inaquired',
    ogDescription: 'Strict candidate confidentiality and zero-spam governance.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/terms',
    pageName: 'Terms of Service',
    metaTitle: 'Terms of Service & Platform Governance | inaquired',
    metaDescription: 'Platform guidelines, candidate rights, and employer listing policies governing the inaquired career discovery portal.',
    keywords: ['terms of service', 'platform terms', 'candidate rights', 'job listing rules'],
    canonicalUrl: '',
    ogTitle: 'Terms of Service | inaquired',
    ogDescription: 'Clear terms and platform guidelines for job seekers and employers.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/remote-jobs',
    pageName: 'Remote Jobs Directory',
    metaTitle: 'Remote Jobs Worldwide – Work From Anywhere | inaquired',
    metaDescription: 'Browse 100% verified remote job openings across engineering, marketing, design, and sales with transparent salaries and direct applications.',
    keywords: ['remote jobs', 'work from anywhere', 'telecommute careers', 'remote software engineer', 'virtual jobs'],
    canonicalUrl: '',
    ogTitle: 'Find Remote Jobs Worldwide | inaquired',
    ogDescription: 'Verified work-from-anywhere positions with transparent compensation and zero spam.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/hybrid-jobs',
    pageName: 'Hybrid Work Opportunities',
    metaTitle: 'Hybrid Jobs & Flexible Office Roles | inaquired',
    metaDescription: 'Explore hybrid career opportunities offering flexible remote schedules and modern collaborative workspaces.',
    keywords: ['hybrid jobs', 'flexible work', 'hybrid schedule', 'office and remote', 'tech hybrid roles'],
    canonicalUrl: '',
    ogTitle: 'Explore Hybrid Career Opportunities | inaquired',
    ogDescription: 'Discover flexible roles balancing remote autonomy with collaborative team environments.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/internships',
    pageName: 'Internships & Early Career',
    metaTitle: 'Paid Internships & Early Career Tech Roles | inaquired',
    metaDescription: 'Kickstart your career with verified paid internships, student co-ops, and graduate development programs at top organizations.',
    keywords: ['paid internships', 'student tech internships', 'summer internships', 'entry level careers', 'graduate programs'],
    canonicalUrl: '',
    ogTitle: 'Paid Internships & Early Career Roles | inaquired',
    ogDescription: 'Launch your professional journey with verified paid internships and student opportunities.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/post-a-job',
    pageName: 'Post a Job Listing',
    metaTitle: 'Post a Job – Hire Verified Talent Fast | inaquired',
    metaDescription: 'Reach tens of thousands of active job seekers. Post verified tech, product, design, and business roles with high visibility.',
    keywords: ['post a job', 'hire talent', 'employer job posting', 'recruit developers', 'talent acquisition'],
    canonicalUrl: '',
    ogTitle: 'Post a Job & Hire Top Talent | inaquired',
    ogDescription: 'Connect directly with motivated candidates and fill open roles faster.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  },
  {
    routePath: '/cookies',
    pageName: 'Cookie Policy',
    metaTitle: 'Cookie Policy & Web Tracking Transparency | inaquired',
    metaDescription: 'Review our cookie usage standards. We respect user choice with zero invasive third-party ad tracking.',
    keywords: ['cookie policy', 'tracking transparency', 'browser storage', 'privacy compliance'],
    canonicalUrl: '',
    ogTitle: 'Cookie Policy | inaquired',
    ogDescription: 'Transparent browser storage and cookie practices protecting user privacy.',
    ogImageUrl: '',
    ogType: 'website',
    twitterCard: 'summary',
    noIndex: false,
    noFollow: false,
    updatedAt: new Date().toISOString()
  }
];

const LOCAL_STORAGE_GLOBAL_KEY = 'inaquired_seo_global_settings';
const LOCAL_STORAGE_PAGES_KEY = 'inaquired_seo_page_overrides';

export async function getGlobalSeoSettings(): Promise<GlobalSeoSettings> {
  // Check Supabase first
  try {
    const { data, error } = await supabase
      .from('seo_global_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (!error && data) {
      const mapped: GlobalSeoSettings = {
        siteName: data.site_name || DEFAULT_GLOBAL_SEO.siteName,
        titleSeparator: data.title_separator || DEFAULT_GLOBAL_SEO.titleSeparator,
        defaultTitle: data.default_title || DEFAULT_GLOBAL_SEO.defaultTitle,
        defaultDescription: data.default_description || DEFAULT_GLOBAL_SEO.defaultDescription,
        defaultOgImageUrl: sanitizeDefaultUrl(data.default_og_image_url),
        twitterHandle: data.twitter_handle || DEFAULT_GLOBAL_SEO.twitterHandle,
        googleSiteVerification: data.google_site_verification || '',
        bingSiteVerification: data.bing_site_verification || '',
        robotsTxtContent: normalizeRobotsTxt(data.robots_txt_content),
        sitemapEnabled: data.sitemap_enabled ?? DEFAULT_GLOBAL_SEO.sitemapEnabled,
        updatedAt: data.updated_at
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_GLOBAL_KEY, JSON.stringify(mapped));
      }
      return mapped;
    }
  } catch (err) {
    // Supabase table may not exist yet; fall back gracefully
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_GLOBAL_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          const sanitized: GlobalSeoSettings = {
            ...DEFAULT_GLOBAL_SEO,
            ...parsed,
            defaultOgImageUrl: sanitizeDefaultUrl(parsed.defaultOgImageUrl),
            robotsTxtContent: normalizeRobotsTxt(parsed.robotsTxtContent)
          };
          localStorage.setItem(LOCAL_STORAGE_GLOBAL_KEY, JSON.stringify(sanitized));
          return sanitized;
        }
      } catch (e) {}
    }
  }

  return DEFAULT_GLOBAL_SEO;
}

export async function saveGlobalSeoSettings(settings: GlobalSeoSettings): Promise<void> {
  const payload = {
    ...settings,
    robotsTxtContent: normalizeRobotsTxt(settings.robotsTxtContent),
    updatedAt: new Date().toISOString()
  };

  // Always save locally first for instant reactivity
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_GLOBAL_KEY, JSON.stringify(payload));
  }

  // Sync to Supabase
  try {
    await supabase
      .from('seo_global_settings')
      .upsert({
        id: 'global',
        site_name: payload.siteName,
        title_separator: payload.titleSeparator,
        default_title: payload.defaultTitle,
        default_description: payload.defaultDescription,
        default_og_image_url: payload.defaultOgImageUrl,
        twitter_handle: payload.twitterHandle,
        google_site_verification: payload.googleSiteVerification,
        bing_site_verification: payload.bingSiteVerification,
        robots_txt_content: payload.robotsTxtContent,
        sitemap_enabled: payload.sitemapEnabled,
        updated_at: payload.updatedAt
      });
  } catch (err) {
    console.warn('Supabase sync notice for SEO global settings:', err);
  }
}

export async function getPageSeoList(): Promise<PageRouteSeo[]> {
  // Check Supabase first
  try {
    const { data, error } = await supabase
      .from('seo_page_settings')
      .select('*');

    if (!error && data && data.length > 0) {
      const dbMap = new Map<string, any>(data.map(d => [d.route_path, d]));
      const merged = DEFAULT_PAGE_SEO_LIST.map(def => {
        const found = dbMap.get(def.routePath);
        if (!found) return def;
        return {
          routePath: found.route_path,
          pageName: found.page_name || def.pageName,
          metaTitle: found.meta_title || def.metaTitle,
          metaDescription: found.meta_description || def.metaDescription,
          keywords: found.keywords || def.keywords,
          canonicalUrl: sanitizeDefaultUrl(found.canonical_url),
          ogTitle: found.og_title || def.ogTitle,
          ogDescription: found.og_description || def.ogDescription,
          ogImageUrl: sanitizeDefaultUrl(found.og_image_url),
          ogType: found.og_type || def.ogType,
          twitterCard: found.twitter_card || def.twitterCard,
          noIndex: Boolean(found.no_index),
          noFollow: Boolean(found.no_follow),
          updatedAt: found.updated_at
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_PAGES_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    // Supabase table may not exist yet; fall back gracefully
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_PAGES_KEY);
    if (cached) {
      try {
        const parsed: PageRouteSeo[] = JSON.parse(cached);
        // Merge defaults to guarantee all pages exist and sanitize any legacy defaults
        const map = new Map(parsed.map(p => [p.routePath, p]));
        const cleaned = DEFAULT_PAGE_SEO_LIST.map(def => {
          const item = map.get(def.routePath) || def;
          return {
            ...item,
            canonicalUrl: sanitizeDefaultUrl(item.canonicalUrl),
            ogImageUrl: sanitizeDefaultUrl(item.ogImageUrl)
          };
        });
        localStorage.setItem(LOCAL_STORAGE_PAGES_KEY, JSON.stringify(cleaned));
        return cleaned;
      } catch (e) {}
    }
  }

  return DEFAULT_PAGE_SEO_LIST;
}

export async function savePageSeo(pageSeo: PageRouteSeo): Promise<void> {
  const currentList = await getPageSeoList();
  const updatedList = currentList.map(item => {
    if (item.routePath === pageSeo.routePath) {
      return { ...pageSeo, updatedAt: new Date().toISOString() };
    }
    return item;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_PAGES_KEY, JSON.stringify(updatedList));
  }

  try {
    await supabase
      .from('seo_page_settings')
      .upsert({
        route_path: pageSeo.routePath,
        page_name: pageSeo.pageName,
        meta_title: pageSeo.metaTitle,
        meta_description: pageSeo.metaDescription,
        keywords: pageSeo.keywords,
        canonical_url: pageSeo.canonicalUrl,
        og_title: pageSeo.ogTitle,
        og_description: pageSeo.ogDescription,
        og_image_url: pageSeo.ogImageUrl,
        og_type: pageSeo.ogType,
        twitter_card: pageSeo.twitterCard,
        no_index: pageSeo.noIndex,
        no_follow: pageSeo.noFollow,
        updated_at: new Date().toISOString()
      });
  } catch (err) {
    console.warn('Supabase sync notice for SEO page settings:', err);
  }
}
