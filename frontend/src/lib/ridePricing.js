const VEHICLES = [
  { id: 'sedan', seats: 4, multiplier: 1.0 },
  { id: 'luxury', seats: 4, multiplier: 1.0, luxurySurcharge: 11.0 },
  { id: 'suv', seats: 6, multiplier: 1.0 },
  { id: 'van', seats: 11, multiplier: 1.0 },
];

export const BOOKING_FEE = 2.7;
export const DEFAULT_TOLL_CHARGE = 10.0;
export const GLOBAL_TRIP_MULTIPLIER = 1.1;
export const SHORT_TRIP_DISTANCE_THRESHOLD_KM = 35;
export const SHORT_TRIP_SURCHARGE = 10.0;
export const SHORT_TRIP_MULTIPLIER = 1.025;
export const MEL_AIRPORT_PICKUP_FEE = 5.15;
export const TIME_RATE_MULTIPLIER = 1.2;
export const GOVERNMENT_LEVY = 1.2;
export const HIGH_OCCUPANCY_FEE = 17.8;

export const TARIFFS = {
  day: { name: 'Day', flagfall: 5.25, perKm: 2.037, perMin: 0.713 },
  evening: { name: 'Evening', flagfall: 6.55, perKm: 2.265, perMin: 0.792 },
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
}) {
  let total = computeSwitchFare({ distanceKm, durationMin, tariff }) + GOVERNMENT_LEVY + BOOKING_FEE;

  if (distanceKm < SHORT_TRIP_DISTANCE_THRESHOLD_KM) {
    total += SHORT_TRIP_SURCHARGE;
    total *= SHORT_TRIP_MULTIPLIER;
  } else {
    total *= GLOBAL_TRIP_MULTIPLIER;
  }

  if (passengerCount > 4 && vehicle.seats > 4) total += HIGH_OCCUPANCY_FEE;
  if (vehicle.luxurySurcharge) total += vehicle.luxurySurcharge;
  if (airportPickup) total += MEL_AIRPORT_PICKUP_FEE;
  if (hasTolls) total += DEFAULT_TOLL_CHARGE;

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
}) {
  const tariff = pickTariff(rideDate);
  const eligibleVehicles = VEHICLES.filter((vehicle) => {
    if (passengerCount > 6 && vehicle.id === 'suv') return false;
    if (passengerCount > 4 && vehicle.seats <= 4) return false;
    return true;
  });

  const fareValues = eligibleVehicles.map((vehicle) =>
    computeVehicleFare({
      vehicle,
      distanceKm,
      durationMin,
      tariff,
      passengerCount,
      airportPickup,
      hasTolls,
    })
  );

  if (fareValues.length === 0) {
    return null;
  }

  return {
    minFare: Math.min(...fareValues),
    maxFare: Math.max(...fareValues),
    tariff,
  };
}
