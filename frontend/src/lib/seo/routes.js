const FALLBACK_BASE_URL = 'https://www.primecabsmelbourne.com.au';

export function getBaseUrl() {
  const configured =
    import.meta.env.VITE_CANONICAL_BASE_URL ||
    import.meta.env.VITE_SITE_URL ||
    FALLBACK_BASE_URL;

  return String(configured).replace(/\/+$/, '');
}

export function normalizePath(pathname = '/') {
  if (!pathname) return '/';

  const raw = String(pathname).trim();
  const withoutQuery = raw.split('?')[0].split('#')[0] || '/';
  const normalized = withoutQuery.replace(/\/{2,}/g, '/');

  if (normalized === '/') return '/';
  return normalized.replace(/\/+$/, '');
}

export function buildCanonicalUrl(pathname = '/') {
  return `${getBaseUrl()}${normalizePath(pathname)}`;
}

export function getCanonicalPathForSuburb(slug = '') {
  return normalizePath(`/airport-transfer/melbourne/${slug}`);
}

export function getCanonicalPathForBlog(slug = '') {
  return normalizePath(`/blog/${slug}`);
}

export function getCanonicalPathForStatic(pathname = '/') {
  return normalizePath(pathname);
}
