const getSafeWindow = () => (typeof window === 'undefined' ? null : window);

export function resolveSourceType({ gclid, gbraid, wbraid, referrer }) {
  if (gclid || gbraid || wbraid) return 'google_paid';

  try {
    const host = referrer ? new URL(referrer).hostname.toLowerCase() : '';
    if (host.includes('google.')) return 'google_organic';
    if (!host) return 'direct';
  } catch (error) {
    if (!referrer) return 'direct';
  }

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
