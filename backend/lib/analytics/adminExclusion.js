const ADMIN_PATH_PREFIXES = ['/admin', '/api/admin'];

const safeString = (value) => (typeof value === 'string' ? value.trim() : '');

const looksLikeAdminPath = (value) => {
  const input = safeString(value).toLowerCase();
  if (!input) {
    return false;
  }

  return ADMIN_PATH_PREFIXES.some((prefix) => input.startsWith(prefix)) || input.includes('/admin');
};

const isAdminAnalyticsPath = (req) => {
  if (!req) {
    return false;
  }

  return (
    looksLikeAdminPath(req.path) ||
    looksLikeAdminPath(req.originalUrl) ||
    req.user?.role === 'admin'
  );
};

const isAdminSessionPayload = (input = {}) => {
  return looksLikeAdminPath(input.landingPath) || looksLikeAdminPath(input.landingUrl);
};

const isAdminEventPayload = (input = {}) => looksLikeAdminPath(input.path);

const isAdminSessionRecord = (session) => {
  if (!session) {
    return false;
  }

  return isAdminSessionPayload(session);
};

const getNonAdminSessionWhere = (extraWhere = {}) => ({
  ...extraWhere,
  AND: [
    ...(Array.isArray(extraWhere.AND) ? extraWhere.AND : []),
    {
      OR: [
        { landingPath: null },
        { landingPath: { not: { startsWith: '/admin' } } },
      ],
    },
    {
      OR: [
        { landingUrl: null },
        { landingUrl: { not: { contains: '/admin' } } },
      ],
    },
  ],
});

const getNonAdminEventWhere = (extraWhere = {}) => ({
  ...extraWhere,
  AND: [
    ...(Array.isArray(extraWhere.AND) ? extraWhere.AND : []),
    {
      OR: [
        { path: null },
        { path: { not: { startsWith: '/admin' } } },
      ],
    },
    {
      session: {
        AND: [
          {
            OR: [
              { landingPath: null },
              { landingPath: { not: { startsWith: '/admin' } } },
            ],
          },
          {
            OR: [
              { landingUrl: null },
              { landingUrl: { not: { contains: '/admin' } } },
            ],
          },
        ],
      },
    },
  ],
});

const getNonAdminNestedEventWhere = (extraWhere = {}) => ({
  ...extraWhere,
  AND: [
    ...(Array.isArray(extraWhere.AND) ? extraWhere.AND : []),
    {
      OR: [
        { path: null },
        { path: { not: { startsWith: '/admin' } } },
      ],
    },
  ],
});

module.exports = {
  getNonAdminEventWhere,
  getNonAdminNestedEventWhere,
  getNonAdminSessionWhere,
  isAdminAnalyticsPath,
  isAdminEventPayload,
  isAdminSessionPayload,
  isAdminSessionRecord,
};
