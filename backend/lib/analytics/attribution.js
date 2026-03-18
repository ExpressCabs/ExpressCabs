const paidSearchPattern = /(cpc|ppc|paid|paidsearch|paid-search|paid_search|sem)/i;

const sanitizeAttributionValue = (value, max = 255) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const getReferrerHost = (referrer) => {
  if (!referrer) {
    return '';
  }

  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch (error) {
    return '';
  }
};

const resolveSourceType = ({ gclid, utmMedium, utmSource, referrer }) => {
  if (gclid) return 'google_paid';
  if (utmMedium && paidSearchPattern.test(utmMedium)) return 'paid_search_other';

  const referrerHost = getReferrerHost(referrer);
  if (referrerHost.includes('google.')) return 'google_organic';
  if (!referrerHost) return 'direct';
  if (utmSource) return 'tagged_other';
  return 'referral_or_other';
};

const extractAttribution = (payload = {}) => {
  const attribution = {
    landingUrl: sanitizeAttributionValue(payload.landingUrl, 1200),
    landingPath: sanitizeAttributionValue(payload.landingPath || payload.path, 255),
    referrer: sanitizeAttributionValue(payload.referrer, 1200),
    utmSource: sanitizeAttributionValue(payload.utmSource),
    utmMedium: sanitizeAttributionValue(payload.utmMedium),
    utmCampaign: sanitizeAttributionValue(payload.utmCampaign),
    utmTerm: sanitizeAttributionValue(payload.utmTerm),
    utmContent: sanitizeAttributionValue(payload.utmContent),
    gclid: sanitizeAttributionValue(payload.gclid),
    gbraid: sanitizeAttributionValue(payload.gbraid),
    wbraid: sanitizeAttributionValue(payload.wbraid),
  };

  attribution.sourceType = resolveSourceType(attribution);
  return attribution;
};

module.exports = {
  extractAttribution,
  resolveSourceType,
};
