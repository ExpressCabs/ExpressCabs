const DEFAULT_GOOGLE_ADS_ID = 'AW-17249057389';
const DEFAULT_BOOKING_CONVERSION_LABEL = 'OwxRCP63nOAaEO30_qBA';

let googleTagPromise = null;
let googleTagConfigured = false;
let googleTagPrimeInstalled = false;
let googleTagPrimeTimeoutId = null;
let telClickTrackingCleanup = null;
let whatsappClickTrackingCleanup = null;
const DEDUPE_WINDOW_MS = 1000;
const recentEventTimestamps = new Map();

export function getGoogleAdsId() {
  return import.meta.env.VITE_GOOGLE_ADS_ID || DEFAULT_GOOGLE_ADS_ID;
}

export function getGa4MeasurementId() {
  return import.meta.env.VITE_GA4_MEASUREMENT_ID || '';
}

export function getBookingConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_BOOKING_LABEL || DEFAULT_BOOKING_CONVERSION_LABEL;
}

export function getPhoneClickConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_PHONE_CLICK_LABEL || '';
}

export function getWhatsappClickConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_WHATSAPP_CLICK_LABEL || '';
}

function ensureGtagStub() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

function configureGoogleTargets() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function' || googleTagConfigured) {
    return;
  }

  window.gtag('js', new Date());
  window.gtag('config', getGoogleAdsId());

  const ga4MeasurementId = getGa4MeasurementId();
  if (ga4MeasurementId) {
    window.gtag('config', ga4MeasurementId, { send_page_view: false });
  }

  googleTagConfigured = true;
}

export function loadGoogleAdsTag() {
  if (typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  ensureGtagStub();
  configureGoogleTargets();

  if (googleTagPromise) {
    return googleTagPromise;
  }

  googleTagPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-ads-tag="true"]');
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve(true);
        return;
      }

      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.dataset.googleAdsTag = 'true';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${getGoogleAdsId()}`;
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve(true);
      },
      { once: true }
    );
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });

  return googleTagPromise;
}

export function primeGoogleAdsTagLoad() {
  if (typeof window === 'undefined' || googleTagPrimeInstalled) {
    return;
  }

  googleTagPrimeInstalled = true;

  const startLoad = () => {
    if (googleTagPrimeTimeoutId) {
      window.clearTimeout(googleTagPrimeTimeoutId);
      googleTagPrimeTimeoutId = null;
    }

    cleanup();
    loadGoogleAdsTag().catch((error) => {
      console.error('Google Ads tag failed to load:', error);
    });
  };

  const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'focusin'];
  const cleanup = () => {
    interactionEvents.forEach((eventName) => {
      window.removeEventListener(eventName, startLoad, true);
    });
  };

  interactionEvents.forEach((eventName) => {
    window.addEventListener(eventName, startLoad, { capture: true, once: true, passive: true });
  });

  googleTagPrimeTimeoutId = window.setTimeout(startLoad, 10000);
}

function getSafeTrimmedValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildEnhancedUserData({ name, email, phone }) {
  const trimmedEmail = getSafeTrimmedValue(email);
  const trimmedPhone = getSafeTrimmedValue(phone);
  const trimmedName = getSafeTrimmedValue(name);
  const nameParts = trimmedName ? trimmedName.split(/\s+/).filter(Boolean) : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const userData = {};

  if (trimmedEmail) {
    userData.email_address = trimmedEmail;
  }

  if (trimmedPhone) {
    userData.phone_number = trimmedPhone;
  }

  if (firstName || lastName) {
    userData.address = {
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      country: 'AU',
    };
  }

  return userData;
}

function emitEvent(eventName, params = {}) {
  ensureGtagStub();
  configureGoogleTargets();

  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return false;
  }

  try {
    window.gtag('event', eventName, params);
    return true;
  } catch (error) {
    console.error(`Google tag event error for ${eventName}:`, error);
    return false;
  }
}

export function trackPageView({ path, title, location } = {}) {
  const ga4MeasurementId = getGa4MeasurementId();
  if (!ga4MeasurementId) {
    return false;
  }

  return emitEvent('page_view', {
    page_path: path,
    page_title: title,
    page_location: location,
  });
}

function shouldSkipDuplicateEvent(key) {
  if (typeof Date === 'undefined') {
    return false;
  }

  const now = Date.now();
  const lastFiredAt = recentEventTimestamps.get(key);

  if (typeof lastFiredAt === 'number' && now - lastFiredAt < DEDUPE_WINDOW_MS) {
    return true;
  }

  recentEventTimestamps.set(key, now);

  if (recentEventTimestamps.size > 50) {
    for (const [eventKey, timestamp] of recentEventTimestamps.entries()) {
      if (now - timestamp >= DEDUPE_WINDOW_MS) {
        recentEventTimestamps.delete(eventKey);
      }
    }
  }

  return false;
}

export function fireGoogleAdsConversion({ sendTo, value, currency, transactionId, userData, callback } = {}) {
  ensureGtagStub();
  configureGoogleTargets();

  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return false;
  }

  try {
    const payload = {
      send_to: sendTo,
      value,
      currency,
      transaction_id: transactionId,
      event_callback: typeof callback === 'function' ? callback : undefined,
    };

    if (userData && Object.keys(userData).length > 0) {
      payload.user_data = userData;
    }

    window.gtag('event', 'conversion', payload);
    return true;
  } catch (error) {
    console.error('Google Ads conversion tracking error:', error);
    return false;
  }
}

export function fireBookingConversion({ value, transactionId, name, email, phone } = {}) {
  const dedupeKey = `booking:${transactionId || 'unknown'}`;
  if (shouldSkipDuplicateEvent(dedupeKey)) {
    return false;
  }

  return fireGoogleAdsConversion({
    sendTo: `${getGoogleAdsId()}/${getBookingConversionLabel()}`,
    value,
    currency: 'AUD',
    transactionId,
    userData: buildEnhancedUserData({ name, email, phone }),
  });
}

export function firePhoneClickConversion({ phone, location } = {}) {
  const label = getPhoneClickConversionLabel();
  const dedupeKey = `phone:${phone || 'unknown'}:${location || 'unknown'}`;
  if (shouldSkipDuplicateEvent(dedupeKey)) {
    return false;
  }

  if (!label) {
    return false;
  }

  return fireGoogleAdsConversion({
    sendTo: `${getGoogleAdsId()}/${label}`,
    userData: phone ? { phone_number: phone } : undefined,
  });
}

export function fireWhatsappClickConversion({ location } = {}) {
  const label = getWhatsappClickConversionLabel();
  const dedupeKey = `whatsapp:${location || 'unknown'}`;
  if (shouldSkipDuplicateEvent(dedupeKey)) {
    return false;
  }

  if (!label) {
    return false;
  }

  return fireGoogleAdsConversion({
    sendTo: `${getGoogleAdsId()}/${label}`,
  });
}

export function installTelClickTracking() {
  if (telClickTrackingCleanup || typeof document === 'undefined') {
    return telClickTrackingCleanup;
  }

  const handleDocumentClick = (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="tel:"]') : null;

    if (!link) {
      return;
    }

    loadGoogleAdsTag().catch(() => {});

    const href = link.getAttribute('href') || '';
    const phone = href.replace(/^tel:/i, '').trim();
    const location =
      link.getAttribute('data-track-location') ||
      link.getAttribute('aria-label') ||
      link.textContent?.trim() ||
      'tel_link';

    firePhoneClickConversion({ phone, location });
  };

  document.addEventListener('click', handleDocumentClick);

  telClickTrackingCleanup = () => {
    document.removeEventListener('click', handleDocumentClick);
    telClickTrackingCleanup = null;
  };

  return telClickTrackingCleanup;
}

export function installWhatsappClickTracking() {
  if (whatsappClickTrackingCleanup || typeof document === 'undefined') {
    return whatsappClickTrackingCleanup;
  }

  const handleDocumentClick = (event) => {
    const link =
      event.target instanceof Element
        ? event.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"]')
        : null;

    if (!link) {
      return;
    }

    loadGoogleAdsTag().catch(() => {});

    const location =
      link.getAttribute('data-track-location') ||
      link.getAttribute('aria-label') ||
      link.textContent?.trim() ||
      'whatsapp_link';

    fireWhatsappClickConversion({ location });
  };

  document.addEventListener('click', handleDocumentClick);

  whatsappClickTrackingCleanup = () => {
    document.removeEventListener('click', handleDocumentClick);
    whatsappClickTrackingCleanup = null;
  };

  return whatsappClickTrackingCleanup;
}
