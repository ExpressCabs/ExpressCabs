const { hashIp } = require('./hash');

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const rawIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0]
    : req.ip || req.socket?.remoteAddress || '';

  return typeof rawIp === 'string' ? rawIp.trim() : '';
};

const detectBrowser = (userAgent) => {
  const ua = String(userAgent || '').toLowerCase();
  if (!ua) return 'unknown';
  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'chrome';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'safari';
  if (ua.includes('firefox/')) return 'firefox';
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
  if (ua.includes('bot') || ua.includes('spider') || ua.includes('crawl')) return 'bot';
  return 'other';
};

const detectDeviceType = ({ userAgent, screenWidth }) => {
  const ua = String(userAgent || '').toLowerCase();
  if (ua.includes('ipad') || ua.includes('tablet')) return 'tablet';
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) return 'mobile';
  if (Number.isFinite(screenWidth) && screenWidth > 0 && screenWidth < 900) return 'mobile';
  return 'desktop';
};

const extractRequestContext = (req, payload = {}) => {
  const userAgent = String(payload.userAgent || req.headers['user-agent'] || '').slice(0, 512);
  const screenWidth = Number(payload.screenWidth);

  return {
    rawIp: getClientIp(req),
    ipHash: hashIp(getClientIp(req)),
    userAgent,
    browser: detectBrowser(userAgent),
    deviceType: detectDeviceType({
      userAgent,
      screenWidth: Number.isFinite(screenWidth) ? screenWidth : undefined,
    }),
    screenWidth: Number.isFinite(screenWidth) ? Math.round(screenWidth) : null,
    timezone:
      typeof payload.timezone === 'string' && payload.timezone.trim()
        ? payload.timezone.trim().slice(0, 100)
        : null,
    geoCity:
      typeof req.headers['x-vercel-ip-city'] === 'string' ? req.headers['x-vercel-ip-city'].slice(0, 100) : null,
    geoRegion:
      typeof req.headers['x-vercel-ip-country-region'] === 'string'
        ? req.headers['x-vercel-ip-country-region'].slice(0, 100)
        : null,
    geoCountry:
      typeof req.headers['x-vercel-ip-country'] === 'string'
        ? req.headers['x-vercel-ip-country'].slice(0, 100)
        : null,
  };
};

module.exports = {
  extractRequestContext,
};
