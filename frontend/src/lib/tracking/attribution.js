const PAID_SEARCH_PATTERN = /(cpc|ppc|paid|paidsearch|paid-search|paid_search|sem)/i;

const getSafeWindow = () => (typeof window === 'undefined' ? null : window);

export function resolveSourceType({ gclid, utmMedium, utmSource, referrer }) {
  if (gclid) return 'google_paid';
  if (utmMedium && PAID_SEARCH_PATTERN.test(utmMedium)) return 'paid_search_other';

  try {
    const host = referrer ? new URL(referrer).hostname.toLowerCase() : '';
    if (host.includes('google.')) return 'google_organic';
    if (!host) return 'direct';
  } catch (error) {
    if (!referrer) return 'direct';
  }

  if (utmSource) return 'tagged_other';
  return 'referral_or_other';
}

export function parseLandingAttribution() {
  const safeWindow = getSafeWindow();
  if (!safeWindow) {
    return {
      landingUrl: '',
      landingPath: '',
      referrer: '',
      sourceType: 'direct',
    };
  }

  const url = new URL(safeWindow.location.href);
  const searchParams = url.searchParams;
  const attribution = {
    landingUrl: url.toString(),
    landingPath: `${url.pathname}${url.search}`,
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    utmSource: searchParams.get('utm_source') || '',
    utmMedium: searchParams.get('utm_medium') || '',
    utmCampaign: searchParams.get('utm_campaign') || '',
    utmTerm: searchParams.get('utm_term') || '',
    utmContent: searchParams.get('utm_content') || '',
    gclid: searchParams.get('gclid') || '',
    gbraid: searchParams.get('gbraid') || '',
    wbraid: searchParams.get('wbraid') || '',
  };

  return {
    ...attribution,
    sourceType: resolveSourceType(attribution),
  };
}
