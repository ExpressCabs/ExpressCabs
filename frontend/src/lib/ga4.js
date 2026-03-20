import { shouldSkipAnalyticsTracking } from './tracking/adminExclusion';
import { getTrackingContext } from './tracking/session';

const DEBUG_GA4 = import.meta.env.DEV || import.meta.env.VITE_GA4_DEBUG === 'true';
const PAGE_VIEW_DEDUPE_WINDOW_MS = 1200;
const EVENT_DEDUPE_WINDOW_MS = 1200;

let lastPageView = { key: '', at: 0 };
const recentEvents = new Map();

const GA4_EVENT_MAP = {
  booking_started: 'booking_started',
  pickup_entered: 'pickup_entered',
  dropoff_entered: 'dropoff_entered',
  fare_calculated: 'fare_calculated',
  vehicle_selected: 'vehicle_selected',
  booking_submit_error: 'booking_error',
  tel_click: 'call_click',
  whatsapp_click: 'whatsapp_click',
};

const isFiniteNumber = (value) => Number.isFinite(Number(value));

const pruneRecentEvents = (now) => {
  for (const [key, timestamp] of recentEvents.entries()) {
    if (now - timestamp > EVENT_DEDUPE_WINDOW_MS) {
      recentEvents.delete(key);
    }
  }
};

const shouldSkipRecentEvent = (key) => {
  const now = Date.now();
  pruneRecentEvents(now);

  const previousAt = recentEvents.get(key);
  if (typeof previousAt === 'number' && now - previousAt <= EVENT_DEDUPE_WINDOW_MS) {
    return true;
  }

  recentEvents.set(key, now);
  return false;
};

const getGa4MeasurementId = () => import.meta.env.VITE_GA4_MEASUREMENT_ID || '';

const getGtag = () => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return null;
  }

  return window.gtag;
};

export const trackGa4Event = (eventName, params = {}) => {
  if (!getGa4MeasurementId() || shouldSkipAnalyticsTracking()) {
    return false;
  }

  const gtag = getGtag();
  if (!gtag) {
    return false;
  }

  const payload = DEBUG_GA4 ? { ...params, debug_mode: true } : params;

  if (DEBUG_GA4) {
    console.info('[GA4]', eventName, payload);
  }

  gtag('event', eventName, payload);
  return true;
};

const emitGa4Event = trackGa4Event;

const getSourceType = () => getTrackingContext()?.attribution?.sourceType || 'direct';

const buildCommonParams = (payload = {}) => {
  const params = {
    source_type: payload.sourceType || getSourceType(),
  };

  if (payload.pickupSuburb) params.pickup_suburb = payload.pickupSuburb;
  if (payload.dropoffSuburb) params.dropoff_suburb = payload.dropoffSuburb;
  if (payload.vehicleType) params.vehicle_type = payload.vehicleType;
  if (isFiniteNumber(payload.estimatedFare)) params.estimated_fare = Number(payload.estimatedFare);
  if (payload.bookingType) params.booking_type = payload.bookingType;
  if (isFiniteNumber(payload.passengerCount)) params.passenger_count = Number(payload.passengerCount);
  if (typeof payload.isAirportPickup === 'boolean') params.is_airport_pickup = payload.isAirportPickup;
  if (typeof payload.isAirportDropoff === 'boolean') params.is_airport_dropoff = payload.isAirportDropoff;
  if (payload.riskBand) params.risk_band = payload.riskBand;
  if (payload.clickLocation) params.click_location = payload.clickLocation;
  if (payload.entrySurface || payload.metadata?.entrySurface) params.entry_surface = payload.entrySurface || payload.metadata?.entrySurface;
  if (payload.stepName) params.step_name = payload.stepName;
  if (payload.errorType || payload.metadata?.errorType) params.error_type = payload.errorType || payload.metadata?.errorType;

  return params;
};

const getEventDedupeKey = (eventName, payload = {}) =>
  [
    eventName,
    payload.stepName || '',
    payload.pickupSuburb || '',
    payload.dropoffSuburb || '',
    payload.vehicleType || '',
    isFiniteNumber(payload.estimatedFare) ? Number(payload.estimatedFare).toFixed(2) : '',
    payload.clickLocation || '',
    payload.clickTarget || '',
  ].join('|');

export function trackGA4PageView({ path = '', title = '', location = '' } = {}) {
  if (!getGa4MeasurementId() || shouldSkipAnalyticsTracking()) {
    return false;
  }

  const now = Date.now();
  const key = `${path}|${title}|${location}`;
  if (lastPageView.key === key && now - lastPageView.at <= PAGE_VIEW_DEDUPE_WINDOW_MS) {
    return false;
  }

  lastPageView = { key, at: now };
  return emitGa4Event('page_view', {
    page_path: path,
    page_title: title,
    page_location: location,
  });
}

export function trackMappedGA4Event(internalEventName, payload = {}) {
  const ga4EventName = GA4_EVENT_MAP[internalEventName];
  if (!ga4EventName || shouldSkipAnalyticsTracking()) {
    return false;
  }

  const dedupeKey = getEventDedupeKey(ga4EventName, payload);
  if (shouldSkipRecentEvent(dedupeKey)) {
    return false;
  }

  const params = buildCommonParams(payload);
  if (['fare_calculated', 'vehicle_selected', 'booking_success'].includes(ga4EventName)) {
    params.currency = 'AUD';
    if (isFiniteNumber(payload.estimatedFare)) {
      params.value = Number(payload.estimatedFare);
    }
  }

  if (ga4EventName === 'booking_success') {
    if (payload.rideId || payload.metadata?.rideId) {
      params.ride_id = payload.rideId || payload.metadata?.rideId;
    }
  }

  return emitGa4Event(ga4EventName, params);
}
