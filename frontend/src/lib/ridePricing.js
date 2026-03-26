import suburbsData from '../data/melbourneSuburbs.json';

const VEHICLES = [
  { id: 'sedan', seats: 4, multiplier: 1.0 },
  { id: 'luxury', seats: 4, multiplier: 1.0, luxurySurcharge: 11.0 },
  { id: 'suv', seats: 6, multiplier: 1.0 },
  { id: 'van', seats: 11, multiplier: 1.0 },
];

export const BOOKING_FEE = 2.7;
export const DEFAULT_TOLL_CHARGE = 10.0;
export const SOUTH_EAST_TOLL_CHARGE = 10.0;
export const OTHER_TOLL_CHARGE = 6.0;
export const GLOBAL_TRIP_MULTIPLIER = 1.1;
export const SHORT_TRIP_DISTANCE_THRESHOLD_KM = 35;
export const SHORT_TRIP_SURCHARGE = 10.0;
export const SHORT_TRIP_SURCHARGE_CBD = 5.0;
export const SHORT_TRIP_MULTIPLIER = 1.025;
export const MEL_AIRPORT_PICKUP_FEE = 5.15;
export const TIME_RATE_MULTIPLIER = 1.2;
export const GOVERNMENT_LEVY = 1.2;
export const HIGH_OCCUPANCY_FEE = 17.8;

const suburbRegionMap = new Map(
  suburbsData
    .filter((suburb) => suburb && suburb.name)
    .map((suburb) => [String(suburb.name).toLowerCase().trim(), String(suburb.region || '').trim()])
);

function normalizeSuburbName(suburb) {
  if (!suburb) return '';
  return String(suburb).toLowerCase().trim();
}

function isMelbourneCBDSuburb(suburb) {
  const normalized = normalizeSuburbName(suburb);
  if (!normalized) return false;
  return (
    normalized === 'melbourne' ||
    normalized === 'melbourne cbd' ||
    normalized.includes('melbourne') && (normalized.includes('cbd') || normalized.includes('3000'))
  );
}

function isSouthEastSuburb(suburb) {
  const normalized = normalizeSuburbName(suburb);
  if (!normalized) return false;

  const region = suburbRegionMap.get(normalized);
  if (region) {
    return region.toLowerCase().includes('south-east');
  }

  // fallback: string hints
  return /south[-\s]*east|south\s*east|south[-\s]*east\s*&\s*bayside/.test(normalized);
}

export const TARIFFS = {
  day: { name: 'Tarrif 1', flagfall: 5.25, perKm: 1.917, perMin: 0.713 },
  evening: { name: 'Tarrif 2', flagfall: 6.55, perKm: 2.145, perMin: 0.792 },
};

const SPEED_SWITCH_KMH = 27;
const SLOW_SPEED_KMH = 20;
const FAST_SPEED_KMH = 45;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function getLocText(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return loc.formatted_address || loc.description || loc.name || loc.place_id || '';
}

export function isMelbourneAirport(text) {
  const t = String(text || '').toLowerCase();
  return (
    t.includes('melbourne airport') ||
    t.includes('tullamarine airport') ||
    (t.includes('mel') && t.includes('airport')) ||
    t.includes('mel t1') ||
    t.includes('mel t2') ||
    t.includes('mel t3') ||
    t.includes('mel t4') ||
    t.includes('terminal 1') ||
    t.includes('terminal 2') ||
    t.includes('terminal 3') ||
    t.includes('terminal 4')
  );
}

export function pickTariff(dateObj) {
  const hour = dateObj.getHours();
  if (hour >= 9 && hour < 17) return TARIFFS.day;
  return TARIFFS.evening;
}

export function roundMoney(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function estimateSlowFastSplit(distanceKm, durationMin) {
  const d = Math.max(0, distanceKm || 0);
  const mins = Math.max(0, durationMin || 0);
  const tHrs = mins / 60;

  if (d === 0 || tHrs === 0) {
    return { slowKm: 0, fastKm: d, slowMin: 0 };
  }

  const avgSpeed = d / tHrs;
  if (avgSpeed <= SPEED_SWITCH_KMH) {
    return { slowKm: d, fastKm: 0, slowMin: mins };
  }

  const denom = 1 / SLOW_SPEED_KMH - 1 / FAST_SPEED_KMH;
  if (denom <= 0) {
    return { slowKm: 0, fastKm: d, slowMin: 0 };
  }

  const dSlow = (tHrs - d / FAST_SPEED_KMH) / denom;
  const slowKm = clamp(dSlow, 0, d);
  const fastKm = d - slowKm;
  const slowMin = (slowKm / SLOW_SPEED_KMH) * 60;

  return { slowKm, fastKm, slowMin };
}

export function computeSwitchFare({ distanceKm, durationMin, tariff }) {
  const { fastKm, slowMin } = estimateSlowFastSplit(distanceKm, durationMin);
  return tariff.flagfall + fastKm * tariff.perKm + slowMin * tariff.perMin * TIME_RATE_MULTIPLIER;
}

export function computeVehicleFare({
  vehicle,
  distanceKm,
  durationMin,
  tariff,
  passengerCount,
  airportPickup,
  hasTolls,
  pickupSuburb,
  dropoffSuburb,
}) {
  let total = computeSwitchFare({ distanceKm, durationMin, tariff }) + GOVERNMENT_LEVY + BOOKING_FEE;

  if (distanceKm < SHORT_TRIP_DISTANCE_THRESHOLD_KM) {
    const applicableShortTripSurcharge = isMelbourneCBDSuburb(pickupSuburb) ? SHORT_TRIP_SURCHARGE_CBD : SHORT_TRIP_SURCHARGE;
    total += applicableShortTripSurcharge;
    total *= SHORT_TRIP_MULTIPLIER;
  } else {
    total *= GLOBAL_TRIP_MULTIPLIER;
  }

  if (passengerCount > 4 && vehicle.seats > 4) total += HIGH_OCCUPANCY_FEE;
  if (vehicle.luxurySurcharge) total += vehicle.luxurySurcharge;
  if (airportPickup) total += MEL_AIRPORT_PICKUP_FEE;

  if (hasTolls) {
    const sourceSuburb = pickupSuburb || dropoffSuburb;
    const tollCharge = isSouthEastSuburb(sourceSuburb) ? SOUTH_EAST_TOLL_CHARGE : OTHER_TOLL_CHARGE;
    total += tollCharge;
  }

  total *= vehicle.multiplier;

  return roundMoney(total);
}

export function estimateFareRange({
  distanceKm,
  durationMin,
  rideDate,
  passengerCount = 1,
  airportPickup = false,
  hasTolls = false,
  pickupSuburb = '',
  dropoffSuburb = '',
}) {
  const tariff = pickTariff(rideDate);
  const eligibleVehicles = VEHICLES.filter((vehicle) => {
    if (passengerCount > 6 && vehicle.id === 'suv') return false;
    if (passengerCount > 4 && vehicle.seats <= 4) return false;
    return true;
  });

  const sedanVehicle = eligibleVehicles.find((vehicle) => vehicle.id === 'sedan');
  const baseVehicle = sedanVehicle || eligibleVehicles[0];

  if (!baseVehicle) {
    return null;
  }

  const baseFare = computeVehicleFare({
    vehicle: baseVehicle,
    distanceKm,
    durationMin,
    tariff,
    passengerCount,
    airportPickup,
    hasTolls,
    pickupSuburb,
    dropoffSuburb,
  });

  return {
    minFare: roundMoney(Math.max(0, baseFare - 4)),
    maxFare: roundMoney(baseFare + 4),
    tariff,
  };
}
