const MELBOURNE_TIMEZONE = 'Australia/Melbourne';

const formatDate = (value, locale, options) => {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value || '-');
    }

    return date.toLocaleString(locale, {
      timeZone: MELBOURNE_TIMEZONE,
      ...options,
    });
  } catch {
    return String(value || '-');
  }
};

export function formatMelbourneDateTime(value, options = {}) {
  return formatDate(value, 'en-AU', options);
}

export function formatMelbourneDate(value, options = {}) {
  return formatDate(value, 'en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatMelbourneTime(value, options = {}) {
  return formatDate(value, 'en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...options,
  });
}

export { MELBOURNE_TIMEZONE };
