export const routeInventory = {
  indexable: [
    '/',
    '/airport-taxi-melbourne',
    '/airport-transfer/melbourne',
    '/contact',
    '/services',
    '/blogs',
  ],
  dynamicIndexable: [
    '/airport-transfer/melbourne/:suburbSlug',
    '/blog/:slug',
  ],
  noindex: [
    '/register',
    '/driver',
    '/driver-register',
    '/driver-forgot-password',
    '/user-forgot-password',
    '/reset-password',
    '/ride-success',
    '/admin',
    '/admin/login',
  ],
};

export function isNoindexPath(pathname = '') {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (routeInventory.noindex.includes(normalized)) {
    return true;
  }

  return normalized.startsWith('/admin');
}
