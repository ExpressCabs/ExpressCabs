const DEFAULT_GOOGLE_ADS_ID = 'AW-17249057389';
const DEFAULT_BOOKING_CONVERSION_LABEL = 'OwxRCP63nOAaEO30_qBA';

let telClickTrackingInstalled = false;

export function getGoogleAdsId() {
  return import.meta.env.VITE_GOOGLE_ADS_ID || DEFAULT_GOOGLE_ADS_ID;
}

export function getBookingConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_BOOKING_LABEL || DEFAULT_BOOKING_CONVERSION_LABEL;
}

export function getPhoneClickConversionLabel() {
  return import.meta.env.VITE_GOOGLE_ADS_PHONE_CLICK_LABEL || '';
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
