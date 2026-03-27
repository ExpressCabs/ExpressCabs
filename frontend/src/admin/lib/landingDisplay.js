const GOOGLE_PAID_CLICK_PARAMS = new Set([
  'gclid',
  'gbraid',
  'wbraid',
  'gad_campaignid',
  'gad_source',
  'gclsrc',
  'dclid',
]);

export function sanitizeLandingValue(value) {
  if (!value) return '-';

  try {
    const url = new URL(value, 'https://placeholder.local');

    GOOGLE_PAID_CLICK_PARAMS.forEach((param) => {
      url.searchParams.delete(param);
    });

    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    return value;
  }
}
