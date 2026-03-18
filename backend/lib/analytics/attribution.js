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

const hasPaidClickId = ({ gclid, gbraid, wbraid }) => Boolean(gclid || gbraid || wbraid);

const resolveSourceType = ({ gclid, gbraid, wbraid, referrer }) => {
  if (hasPaidClickId({ gclid, gbraid, wbraid })) return 'google_paid';
  const referrerHost = getReferrerHost(referrer);
  if (referrerHost.includes('google.')) return 'google_organic';
  if (!referrerHost) return 'direct';
  return 'referral_or_other';
};

const getSourceClassificationReason = ({ gclid, gbraid, wbraid, referrer }) => {
  if (gclid) return 'gclid';
  if (gbraid) return 'gbraid';
  if (wbraid) return 'wbraid';

  const referrerHost = getReferrerHost(referrer);
  if (referrerHost.includes('google.')) return 'google_referrer';
  if (!referrerHost) return 'empty_referrer';
  return 'non_google_referrer';
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
  attribution.sourceClassificationReason = getSourceClassificationReason(attribution);
  return attribution;
};

module.exports = {
  extractAttribution,
  getSourceClassificationReason,
  hasPaidClickId,
  resolveSourceType,
};
