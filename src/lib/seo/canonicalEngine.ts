/**
 * Centralized Canonical URL Engine
 * Ensures single source of truth for canonical link generation across server and client.
 */

export function cleanPathname(pathname: string): string {
  if (!pathname || pathname === '/' || pathname === '/index.html') return '/';
  // Remove duplicate slashes and trailing slashes (except root)
  const cleaned = pathname.replace(/\/+/g, '/').replace(/\/+$/, '');
  return cleaned === '' || cleaned === '/index.html' ? '/' : cleaned;
}

export function buildCanonicalUrl(
  pathOrOverride: string | undefined | null,
  routePath: string,
  origin: string
): string {
  const baseOrigin = origin.replace(/\/+$/, '');

  // 1. If explicit custom canonical URL is specified
  if (pathOrOverride && pathOrOverride.trim() !== '') {
    const trimmed = pathOrOverride.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.replace(/\/+$/, '');
    }
    // Relative path override
    const cleanRelative = cleanPathname(trimmed);
    return `${baseOrigin}${cleanRelative === '/' ? '' : cleanRelative}`;
  }

  // 2. Automatic canonical URL based on route
  const cleanRoute = cleanPathname(routePath);
  return `${baseOrigin}${cleanRoute === '/' ? '' : cleanRoute}`;
}
