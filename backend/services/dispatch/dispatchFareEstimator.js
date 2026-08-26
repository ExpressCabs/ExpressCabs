const { toDispatchMinimumTier } = require('../../lib/dispatch/farePolicy');

const BOOKING_FEE = 2.7;
const GOVERNMENT_LEVY = 1.2;
const SHORT_TRIP_DISTANCE_THRESHOLD_KM = 35;
const SHORT_TRIP_SURCHARGE = 10;
const SHORT_TRIP_SURCHARGE_CBD = 5;
const SHORT_TRIP_MULTIPLIER = 1.025;
const GLOBAL_TRIP_MULTIPLIER = 1.1;
const MEL_AIRPORT_PICKUP_FEE = 5.15;
const HIGH_OCCUPANCY_FEE = 17.8;
const TIME_RATE_MULTIPLIER = 1.2;
const SPEED_SWITCH_KMH = 27;
const SLOW_SPEED_KMH = 20;
const FAST_SPEED_KMH = 45;
const TARIFFS = {
  day: { flagfall: 5.25, perKm: 1.917, perMin: 0.713 },
  evening: { flagfall: 6.55, perKm: 2.145, perMin: 0.792 },
};

const getMelbourneHour = (date) => Number(new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Melbourne', hour: '2-digit', hourCycle: 'h23',
}).format(new Date(date)));

const isAirport = (address) => /melbourne airport|tullamarine|\bairport\b|terminal\s*[1-4]/i.test(String(address || ''));
const isCbd = (address) => /\bmelbourne(?:\s+cbd)?\b|\b3000\b/i.test(String(address || ''));

const calculateFare = ({ distanceKm, durationMin, pickupAt, passengerCount, pickup, hasTolls }) => {
  const hour = getMelbourneHour(pickupAt || new Date());
  const tariff = hour >= 9 && hour < 17 ? TARIFFS.day : TARIFFS.evening;
  const hours = durationMin / 60;
  const averageSpeed = hours > 0 ? distanceKm / hours : FAST_SPEED_KMH;
  const denominator = 1 / SLOW_SPEED_KMH - 1 / FAST_SPEED_KMH;
  const slowKm = averageSpeed <= SPEED_SWITCH_KMH
    ? distanceKm
    : Math.max(0, Math.min(distanceKm, (hours - distanceKm / FAST_SPEED_KMH) / denominator));
  const fastKm = distanceKm - slowKm;
  const slowMinutes = slowKm / SLOW_SPEED_KMH * 60;
  let fare = tariff.flagfall + fastKm * tariff.perKm + slowMinutes * tariff.perMin * TIME_RATE_MULTIPLIER
    + GOVERNMENT_LEVY + BOOKING_FEE;

  if (distanceKm < SHORT_TRIP_DISTANCE_THRESHOLD_KM) {
    fare += isCbd(pickup) ? SHORT_TRIP_SURCHARGE_CBD : SHORT_TRIP_SURCHARGE;
    fare *= SHORT_TRIP_MULTIPLIER;
  } else {
    fare *= GLOBAL_TRIP_MULTIPLIER;
  }
  if (Number(passengerCount) > 4) fare += HIGH_OCCUPANCY_FEE;
  if (isAirport(pickup)) fare += MEL_AIRPORT_PICKUP_FEE;
  if (hasTolls) fare += 6;
  return Math.round((fare + Number.EPSILON) * 100) / 100;
};

const estimateDispatchFare = async (booking, { fetchImpl = global.fetch } = {}) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !booking.pickup || !booking.dropoff || typeof fetchImpl !== 'function') return null;
  try {
    const response = await fetchImpl('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.travelAdvisory.tollInfo',
      },
      body: JSON.stringify({
        origin: { address: `${booking.pickup}, Victoria, Australia` },
        destination: { address: `${booking.dropoff}, Victoria, Australia` },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        departureTime: booking.pickupAt ? new Date(booking.pickupAt).toISOString() : undefined,
        computeAlternativeRoutes: false,
        units: 'METRIC',
        languageCode: 'en-AU',
      }),
    });
    const payload = await response.json();
    const route = payload?.routes?.[0];
    if (!response.ok || !route) return null;
    const distanceKm = Number(route.distanceMeters) / 1000;
    const durationMin = Number(String(route.duration || '').replace(/s$/, '')) / 60;
    if (!Number.isFinite(distanceKm) || !Number.isFinite(durationMin)) return null;
    const calculatedFare = calculateFare({
      distanceKm,
      durationMin,
      pickupAt: booking.pickupAt,
      passengerCount: booking.passengerCount,
      pickup: booking.pickup,
      hasTolls: Boolean(route.travelAdvisory?.tollInfo),
    });
    return { calculatedFare, ...toDispatchMinimumTier(calculatedFare) };
  } catch (error) {
    console.error('Dispatch fare estimation failed:', error.message);
    return null;
  }
};

module.exports = { calculateFare, estimateDispatchFare };
