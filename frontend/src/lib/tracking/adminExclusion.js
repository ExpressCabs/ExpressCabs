export function isAdminTrackingPath(path = '') {
  return typeof path === 'string' && path.startsWith('/admin');
}

export function shouldSkipAnalyticsTracking() {
  if (typeof window === 'undefined') {
    return false;
  }

  return isAdminTrackingPath(window.location.pathname || '');
}
