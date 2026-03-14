const DEFAULT_GOOGLE_ADS_ID = 'AW-17249057389';
const DEFAULT_BOOKING_CONVERSION_LABEL = 'OwxRCP63nOAaEO30_qBA';

let telClickTrackingInstalled = false;
let googleAdsTagPromise = null;

export function getGoogleAdsId() {
  return import.meta.env.VITE_GOOGLE_ADS_ID || DEFAULT_GOOGLE_ADS_ID;
}

export function getBookingConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_BOOKING_LABEL || DEFAULT_BOOKING_CONVERSION_LABEL;
}

export function getPhoneClickConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_PHONE_CLICK_LABEL || '';
}

export function loadGoogleAdsTag() {
  if (typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  if (typeof window !== 'undefined' && typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', getGoogleAdsId());
  }

  if (googleAdsTagPromise) {
    return googleAdsTagPromise;
  }

  googleAdsTagPromise = new Promise((resolve, reject) => {
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

  return googleAdsTagPromise;
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

export function fireGoogleAdsConversion({ sendTo, value, currency, transactionId, userData, callback } = {}) {
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

  if (!label) {
    return false;
  }

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', 'phone_click', {
        phone_number: phone,
        click_location: location,
      });
    } catch (error) {
      console.error('Google Ads phone click debug event error:', error);
    }
  }

  return fireGoogleAdsConversion({
    sendTo: `${getGoogleAdsId()}/${label}`,
    userData: phone ? { phone_number: phone } : undefined,
  });
}

export function installTelClickTracking() {
  if (telClickTrackingInstalled || typeof document === 'undefined') {
    return;
  }

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="tel:"]') : null;

    if (!link) {
      return;
    }

    const href = link.getAttribute('href') || '';
    const phone = href.replace(/^tel:/i, '').trim();
    const location =
      link.getAttribute('data-track-location') ||
      link.getAttribute('aria-label') ||
      link.textContent?.trim() ||
      'tel_link';

    firePhoneClickConversion({ phone, location });
  });

  telClickTrackingInstalled = true;
}
