const windowStore = new Map();

const clearExpiredEntries = (now) => {
  for (const [key, entry] of windowStore.entries()) {
    if (entry.resetAt <= now) {
      windowStore.delete(key);
    }
  }
};

const createRateLimiter = ({ windowMs, maxRequests, keyFn }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyFn(req);
    const current = windowStore.get(key);

    if (!current || current.resetAt <= now) {
      windowStore.set(key, { count: 1, resetAt: now + windowMs });
      clearExpiredEntries(now);
      return next();
    }

    if (current.count >= maxRequests) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many requests',
        retryAfterSeconds: retryAfter,
      });
    }

    current.count += 1;
    windowStore.set(key, current);
    return next();
  };
};

module.exports = {
  createRateLimiter,
};
