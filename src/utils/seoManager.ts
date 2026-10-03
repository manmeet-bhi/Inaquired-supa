import { useEffect } from 'react';
import { getGlobalSeoSettings, getPageSeoList, PageRouteSeo, GlobalSeoSettings } from '../services/seoService';

export function applyRouteSEO(pathname: string) {
  if (typeof document === 'undefined') return;

  // If on a job detail page, let JobDetailPage manage its specific title and structured data
  if (pathname.startsWith('/jobs/')) {
    return;
  }

  // Normalized path with aliases
  let normalizedPath = pathname === '' ? '/' : pathname;
  if (normalizedPath === '/by-departments') normalizedPath = '/departments';
  if (normalizedPath === '/by-companies') normalizedPath = '/companies';
  if (normalizedPath === '/post-job') normalizedPath = '/post-a-job';
  if (normalizedPath === '/cookie-policy') normalizedPath = '/cookies';

  // Dynamic Category Pages: /category/[slug]
  if (normalizedPath.startsWith('/category/')) {
    const rawCategory = decodeURIComponent(normalizedPath.replace('/category/', '')).trim();
    const formatted = rawCategory
      .split(/[-_]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    document.title = `${formatted} Jobs | inaquired`;
    return;
  }

  // Dynamic Company Pages: /company/[name]
  if (normalizedPath.startsWith('/company/')) {
    const company = decodeURIComponent(normalizedPath.replace('/company/', '')).trim();
    document.title = `Careers at ${company} | inaquired`;
    return;
  }

  Promise.all([getGlobalSeoSettings(), getPageSeoList()]).then(([globalSettings, pageList]) => {
    // Check again in case route navigated away during fetch
    if (window.location.pathname.startsWith('/jobs/')) return;

    // 1. Google Site Verification
    if (globalSettings.googleSiteVerification) {
      let meta = document.querySelector('meta[name="google-site-verification"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', globalSettings.googleSiteVerification);
    }

    // 2. Bing Webmaster Verification
    if (globalSettings.bingSiteVerification) {
      let meta = document.querySelector('meta[name="msvalidate.01"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'msvalidate.01');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', globalSettings.bingSiteVerification);
    }

    // Match page override
    const pageConfig = pageList.find(p => p.routePath === normalizedPath);
    const title = pageConfig?.metaTitle || globalSettings.defaultTitle;
    const description = pageConfig?.metaDescription || globalSettings.defaultDescription;
    const canonical = (pageConfig?.canonicalUrl && pageConfig.canonicalUrl.trim() !== '')
      ? pageConfig.canonicalUrl
      : (typeof window !== 'undefined' ? `${window.location.origin}${normalizedPath === '/' ? '' : normalizedPath}` : normalizedPath);
    const ogImage = pageConfig?.ogImageUrl || globalSettings.defaultOgImageUrl;
    const ogTitle = pageConfig?.ogTitle || title;
    const ogDesc = pageConfig?.ogDescription || description;

    // Document Title
    document.title = title;

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Canonical
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonical);

    // OpenGraph Title & Description
    let ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (!ogTitleMeta) {
      ogTitleMeta = document.createElement('meta');
      ogTitleMeta.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitleMeta);
    }
    ogTitleMeta.setAttribute('content', ogTitle);

    let ogDescMeta = document.querySelector('meta[property="og:description"]');
    if (!ogDescMeta) {
      ogDescMeta = document.createElement('meta');
      ogDescMeta.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescMeta);
    }
    ogDescMeta.setAttribute('content', ogDesc);

    // OpenGraph Image
    if (ogImage) {
      let ogImageMeta = document.querySelector('meta[property="og:image"]');
      if (!ogImageMeta) {
        ogImageMeta = document.createElement('meta');
        ogImageMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogImageMeta);
      }
      ogImageMeta.setAttribute('content', ogImage);
    }

    // Twitter Card
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', ogTitle);

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDesc) {
      twitterDesc = document.createElement('meta');
      twitterDesc.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDesc);
    }
    twitterDesc.setAttribute('content', ogDesc);

    // Robots NoIndex / NoFollow
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (pageConfig?.noIndex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', pageConfig.noFollow ? 'noindex, nofollow' : 'noindex, follow');
    } else if (metaRobots) {
      metaRobots.remove();
    }
  });
}
