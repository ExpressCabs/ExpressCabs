import { getTrackingContext, getTrackingPageContext } from './session';
import { shouldSkipAnalyticsTracking } from './adminExclusion';
import { trackMappedGA4Event } from '../ga4';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 4000;
const HEARTBEAT_INTERVAL_MS = 5000;

let initialized = false;
let startPromise = null;
let flushTimerId = null;
let heartbeatTimerId = null;
let queue = [];
let flushInFlight = false;
let unloadHandlersInstalled = false;
let sessionEndSent = false;

const endpoint = (path) => `${API_BASE_URL}${path}`;

const getClientContext = () => ({
  ...getTrackingContext(),
  ...getTrackingPageContext(),
  screenWidth: typeof window !== 'undefined' ? window.innerWidth : null,
  timezone:
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '',
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
});

const scheduleFlush = () => {
  if (flushTimerId || typeof window === 'undefined') {
    return;
  }

  flushTimerId = window.setTimeout(() => {
    flushTimerId = null;
    flushAnalyticsQueue();
  }, FLUSH_INTERVAL_MS);
};

const sendJson = async (url, payload, options = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'omit',
    keepalive: options.keepalive || false,
  });

  if (!response.ok) {
    throw new Error(`Analytics request failed with ${response.status}`);
  }

  return response;
};

const sendBeaconPayload = (url, payload) => {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false;
  }

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(url, blob);
  } catch (error) {
    return false;
  }
};

const installUnloadHandlers = () => {
  if (unloadHandlersInstalled || typeof window === 'undefined') {
    return;
  }

  const handlePageHide = () => {
    flushAnalyticsQueue({ useBeacon: true });
    endAnalyticsSession({ reason: 'pagehide', useBeacon: true });
  };

  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handlePageHide);
  unloadHandlersInstalled = true;
};

const stopHeartbeat = () => {
  if (heartbeatTimerId && typeof window !== 'undefined') {
    window.clearInterval(heartbeatTimerId);
    heartbeatTimerId = null;
  }
};

const pingAnalyticsSession = async () => {
  if (shouldSkipAnalyticsTracking() || sessionEndSent) {
    return false;
  }

  const payload = {
    sessionToken: getTrackingContext().sessionToken,
  };

  if (!payload.sessionToken) {
    return false;
  }

  try {
    await sendJson(endpoint('/api/analytics/session/ping'), payload, { keepalive: true });
    return true;
  } catch (error) {
    console.error('Analytics session ping failed:', error);
    return false;
  }
};

const ensureHeartbeat = () => {
  if (heartbeatTimerId || typeof window === 'undefined') {
    return;
  }

  heartbeatTimerId = window.setInterval(() => {
    pingAnalyticsSession();
  }, HEARTBEAT_INTERVAL_MS);
};

export function initializeAnalyticsTracking() {
  if (shouldSkipAnalyticsTracking()) {
    initialized = false;
    startPromise = null;
    return Promise.resolve(false);
  }

  if (initialized) {
    return Promise.resolve(true);
  }

  if (startPromise) {
    return startPromise;
  }

  const payload = getClientContext();
  installUnloadHandlers();

  startPromise = sendJson(endpoint('/api/analytics/session/start'), {
    visitorToken: payload.visitorToken,
    sessionToken: payload.sessionToken,
    landingUrl: payload.attribution.landingUrl,
    landingPath: payload.attribution.landingPath,
    referrer: payload.attribution.referrer,
    utmSource: payload.attribution.utmSource,
    utmMedium: payload.attribution.utmMedium,
    utmCampaign: payload.attribution.utmCampaign,
    utmTerm: payload.attribution.utmTerm,
    utmContent: payload.attribution.utmContent,
    gclid: payload.attribution.gclid,
    gbraid: payload.attribution.gbraid,
    wbraid: payload.attribution.wbraid,
    pageTitle: payload.pageTitle,
    screenWidth: payload.screenWidth,
    timezone: payload.timezone,
    userAgent: payload.userAgent,
  })
    .then(() => {
      initialized = true;
      sessionEndSent = false;
      ensureHeartbeat();
      return true;
    })
    .catch((error) => {
      console.error('Analytics session start failed:', error);
      return false;
    })
    .finally(() => {
      startPromise = null;
    });

  return startPromise;
}

export function trackAnalyticsEvent(eventName, payload = {}) {
  if (!eventName || shouldSkipAnalyticsTracking()) {
    return false;
  }

  initializeAnalyticsTracking();

  const pageContext = getTrackingPageContext();
  queue.push({
    eventName,
    eventTime: new Date().toISOString(),
    path: payload.path || pageContext.path,
    pageTitle: payload.pageTitle || pageContext.pageTitle,
    stepName: payload.stepName || null,
    pickupSuburb: payload.pickupSuburb || null,
    dropoffSuburb: payload.dropoffSuburb || null,
    isAirportPickup: typeof payload.isAirportPickup === 'boolean' ? payload.isAirportPickup : undefined,
    isAirportDropoff: typeof payload.isAirportDropoff === 'boolean' ? payload.isAirportDropoff : undefined,
    estimatedFare: typeof payload.estimatedFare === 'number' ? payload.estimatedFare : undefined,
    vehicleType: payload.vehicleType || null,
    passengerCount: Number.isFinite(Number(payload.passengerCount)) ? Number(payload.passengerCount) : undefined,
    bookingType: payload.bookingType || null,
    bookingDateTime: payload.bookingDateTime || null,
    clickTarget: payload.clickTarget || null,
    clickLocation: payload.clickLocation || null,
    metadata: payload.metadata || null,
  });

  trackMappedGA4Event(eventName, {
    ...payload,
    sourceType: payload.sourceType || getTrackingContext()?.attribution?.sourceType || '',
  });

  if (queue.length >= BATCH_SIZE) {
    flushAnalyticsQueue();
  } else {
    scheduleFlush();
  }

  return true;
}

export async function flushAnalyticsQueue(options = {}) {
  if (shouldSkipAnalyticsTracking()) {
    queue = [];
    return false;
  }

  if (flushInFlight || queue.length === 0) {
    return false;
  }

  if (flushTimerId && typeof window !== 'undefined') {
    window.clearTimeout(flushTimerId);
    flushTimerId = null;
  }

  const payload = {
    ...getTrackingContext(),
    events: queue.splice(0, queue.length),
  };

  if (options.useBeacon) {
    return sendBeaconPayload(endpoint('/api/analytics/events/batch'), payload);
  }

  flushInFlight = true;
  try {
    await sendJson(endpoint('/api/analytics/events/batch'), payload, { keepalive: true });
    return true;
  } catch (error) {
    queue = [...payload.events, ...queue];
    console.error('Analytics batch flush failed:', error);
    return false;
  } finally {
    flushInFlight = false;
  }
}

export function endAnalyticsSession({ reason = 'manual', useBeacon = false } = {}) {
  if (shouldSkipAnalyticsTracking()) {
    queue = [];
    return false;
  }

  if (sessionEndSent) {
    return false;
  }

  sessionEndSent = true;
  stopHeartbeat();
  const payload = {
    ...getTrackingContext(),
    ...getTrackingPageContext(),
    endedAt: new Date().toISOString(),
    reason,
  };

  if (useBeacon) {
    return sendBeaconPayload(endpoint('/api/analytics/session/end'), payload);
  }

  sendJson(endpoint('/api/analytics/session/end'), payload, { keepalive: true }).catch((error) => {
    console.error('Analytics session end failed:', error);
  });
  return true;
}
