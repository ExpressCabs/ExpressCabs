import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import sedanImg from '/assets/vehicles/sedan-modern.png';
import suvImg from '/assets/vehicles/suv-modern.png';
import vanImg from '/assets/vehicles/van-modern.png';
import luxuryImg from '/assets/vehicles/luxury-modern.png';

const VEHICLES = [
  { id: 'sedan', name: 'Sedan', seats: 4, image: sedanImg, multiplier: 1.0 },
  { id: 'luxury', name: 'Luxury', seats: 4, image: luxuryImg, multiplier: 1.0, luxurySurcharge: 11.0 },
  { id: 'suv', name: 'SUV', seats: 6, image: suvImg, multiplier: 1.0 },
  { id: 'van', name: 'Van', seats: 11, image: vanImg, multiplier: 1.0 },
];

// --- Fees you control ---
const BOOKING_FEE = 2.70; // ✅ you confirmed you charge this
const DEFAULT_TOLL_CHARGE = 10.0; // ✅ add when route uses tolls (approx)
const GLOBAL_TRIP_MULTIPLIER = 1.1;
const SHORT_TRIP_DISTANCE_THRESHOLD_KM = 35;
const SHORT_TRIP_SURCHARGE = 10.0;
const SHORT_TRIP_MULTIPLIER = 1.025;

// --- Pass-through fees (set as needed) ---
const MEL_AIRPORT_PICKUP_FEE = 5.15;// Melbourne Airport access fee (pass-through)
const TIME_RATE_MULTIPLIER = 1.2;
// --- Vic taxi-style quote model (time + distance) ---
// NOTE: This is an approximation model (not a live meter). It is designed to be consistent and realistic for quoting.
const TARIFFS = {
  day: { name: 'Day', flagfall: 5.25, perKm: 2.037, perMin: 0.713 },       // ~9am–5pm
  evening: { name: 'Evening', flagfall: 6.55, perKm: 2.265, perMin: 0.792 }, // ~5pm–9am
};

const GOVERNMENT_LEVY = 1.20; // Trip levy recovery (keep aligned with what you display)
const HIGH_OCCUPANCY_FEE = 17.80; // If you apply it for 5+ pax in a high-occupancy vehicle

function getLocText(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return (
    loc.formatted_address ||
    loc.description ||
    loc.name ||
    loc.place_id ||
    ''
  );
}

function isMelbourneAirport(text) {
  const t = (text || '').toLowerCase();
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

function pickTariff(dateObj) {
  const hour = dateObj.getHours();
  if (hour >= 9 && hour < 17) return TARIFFS.day;
  return TARIFFS.evening;
}

function roundMoney(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}


// ---- Speed-threshold meter approximation ----
// Vic taxi meters typically charge EITHER time OR distance depending on speed.
// Requirement: if speed < 27km/h => time rate, else => distance rate.
// Google Directions gives only total distance + total duration, not per-step speeds,
// so we estimate a split between "slow" and "fast" portions using a 2-speed mixture model.
//
// Tuning knobs (reasonable defaults):
// - SLOW_SPEED_KMH: typical congested/urban speed (<27)
// - FAST_SPEED_KMH: typical flowing traffic speed (>27)
const SPEED_SWITCH_KMH = 27;
const SLOW_SPEED_KMH = 20;
const FAST_SPEED_KMH = 45;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Estimate how much of the trip is "slow" (<SPEED_SWITCH_KMH) vs "fast" (>SPEED_SWITCH_KMH)
 * using a 2-speed mixture model.
 *
 * Inputs: distanceKm (km), durationMin (minutes)
 * Returns:
 *  - slowKm: distance travelled at SLOW_SPEED_KMH
 *  - fastKm: remaining distance travelled at FAST_SPEED_KMH
 *  - slowMin: minutes spent in slow portion (time-charged)
 */
function estimateSlowFastSplit(distanceKm, durationMin) {
  const d = Math.max(0, distanceKm || 0);
  const mins = Math.max(0, durationMin || 0);
  const tHrs = mins / 60;

  if (d === 0 || tHrs === 0) {
    return { slowKm: 0, fastKm: d, slowMin: 0 };
  }

  // If average speed is already below the switch, treat whole trip as slow/time.
  const avgSpeed = d / tHrs;
  if (avgSpeed <= SPEED_SWITCH_KMH) {
    return { slowKm: d, fastKm: 0, slowMin: mins };
  }

  // Solve mixture:
  // t = d_s / v_s + (d - d_s) / v_f
  // => d_s = (t - d/v_f) / (1/v_s - 1/v_f)
  const vS = SLOW_SPEED_KMH;
  const vF = FAST_SPEED_KMH;

  const denom = (1 / vS) - (1 / vF);
  if (denom <= 0) {
    // fallback: no valid split, charge distance only
    return { slowKm: 0, fastKm: d, slowMin: 0 };
  }

  const dSlow = (tHrs - d / vF) / denom;
  const slowKm = clamp(dSlow, 0, d);
  const fastKm = d - slowKm;
  const slowMin = (slowKm / vS) * 60;

  return { slowKm, fastKm, slowMin };
}

function computeSwitchFare({ distanceKm, durationMin, tariff }) {
  const { fastKm, slowMin } = estimateSlowFastSplit(distanceKm, durationMin);
  // meter-like: flagfall + distance when fast + time when slow
  return tariff.flagfall + fastKm * tariff.perKm + slowMin * tariff.perMin * TIME_RATE_MULTIPLIER;
}

const VehicleSelection = ({
  pickupLoc,
  dropoffLoc,
  passengerCount,
  bookingType,
  scheduledDateTime,
  setStep,
  setSelectedVehicle,
  setFare,
  setFareType,
  setMap,
}) => {
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [hasTolls, setHasTolls] = useState(false);

  const [fares, setFares] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const rideDateObj = useMemo(() => {
    if (bookingType === 'now') return new Date();
    if (!scheduledDateTime) return new Date();
    return new Date(scheduledDateTime);
  }, [bookingType, scheduledDateTime]);

  const tariff = useMemo(() => pickTariff(rideDateObj), [rideDateObj]);

  const airportPickup = useMemo(() => {
    const pickupText = getLocText(pickupLoc);
    return isMelbourneAirport(pickupText);
  }, [pickupLoc]);

  // ---- Route lookup: distance, time, toll detection ----
  useEffect(() => {
    if (!pickupLoc || !dropoffLoc || !window?.google?.maps) return;

    const service = new window.google.maps.DirectionsService();

    const routePromise = (avoidTolls) =>
      new Promise((resolve, reject) => {
        service.route(
          {
            origin: pickupLoc,
            destination: dropoffLoc,
            travelMode: 'DRIVING',
            ...(avoidTolls ? { avoid: ['tolls'] } : {}),
          },
          (result, status) => {
            if (status === 'OK') resolve(result);
            else reject(status);
          }
        );
      });

    (async () => {
      try {
        // 1) Normal route
        const normal = await routePromise(false);
        const route = normal.routes?.[0];
        const leg = route?.legs?.[0];

        if (!leg) return;

        const km = (leg.distance?.value || 0) / 1000;
        const mins = (leg.duration?.value || 0) / 60;

        setDistanceKm(km);
        setDurationMin(mins);

        // Fast toll detection signals
        const warningsText = (route?.warnings || []).join(' ').toLowerCase();
        const steps = leg.steps || [];
        const stepsHaveTollHint = steps.some((s) => {
          const instr = (s.instructions || '').toLowerCase();
          return instr.includes('toll') || instr.includes('citylink') || instr.includes('eastlink');
        });

        let tollDetected = warningsText.includes('toll') || stepsHaveTollHint;

        // 2) If not obvious, compare vs avoid-tolls route (most reliable)
        if (!tollDetected) {
          try {
            const noToll = await routePromise(true);
            const noTollLeg = noToll.routes?.[0]?.legs?.[0];
            if (noTollLeg) {
              const normalDist = leg.distance?.value || 0;
              const noTollDist = noTollLeg.distance?.value || 0;
              const normalDur = leg.duration?.value || 0;
              const noTollDur = noTollLeg.duration?.value || 0;

              const distanceDiffPct = normalDist > 0 ? (noTollDist - normalDist) / normalDist : 0;
              const durationDiffPct = normalDur > 0 ? (noTollDur - normalDur) / normalDur : 0;

              // thresholds to avoid false positives
              tollDetected = distanceDiffPct > 0.08 || durationDiffPct > 0.10;
            }
          } catch (e) {
            // If avoid-tolls route fails, fall back to earlier detection
          }
        }

        setHasTolls(Boolean(tollDetected));
      } catch (err) {
        console.error('Could not fetch route:', err);
      }
    })();
  }, [pickupLoc, dropoffLoc]);

  // ---- Fare calculation ----
  useEffect(() => {
    if (!distanceKm || !durationMin) return;

    const newFares = {};

    for (const v of VEHICLES) {
      // Base quote: meter-like switch (time OR distance based on speed)
      const base = computeSwitchFare({ distanceKm, durationMin, tariff });

      let total = base + GOVERNMENT_LEVY + BOOKING_FEE;

      if (distanceKm < SHORT_TRIP_DISTANCE_THRESHOLD_KM) {
        total += SHORT_TRIP_SURCHARGE;
        total *= SHORT_TRIP_MULTIPLIER;
      } else {
        total *= GLOBAL_TRIP_MULTIPLIER;
      }

      // High occupancy add-on
      if (passengerCount > 4 && v.seats > 4) total += HIGH_OCCUPANCY_FEE;

      // Luxury surcharge
      if (v.luxurySurcharge) total += v.luxurySurcharge;

      // Airport pickup fee (auto based on pickup text)
      if (airportPickup) total += MEL_AIRPORT_PICKUP_FEE;

      // Toll estimate: if route has tolls, add $10
      if (hasTolls) total += DEFAULT_TOLL_CHARGE;

      total *= v.multiplier;

      newFares[v.id] = roundMoney(total).toFixed(2);
    }

    setFares(newFares);

    if (selectedId && newFares[selectedId]) {
      if (typeof setFare === 'function') {
        setFare(parseFloat(newFares[selectedId]));
      }
      if (typeof setFareType === 'function') {
        const selectedVehicle = VEHICLES.find((x) => x.id === selectedId);
        const highOccupancyApplies = passengerCount > 4 && selectedVehicle?.seats > 4;

        const parts = [];
        parts.push(tariff.name);
        parts.push(highOccupancyApplies ? 'High Occupancy' : 'Standard');
        if (airportPickup) parts.push('Airport pickup');
        if (hasTolls) parts.push('Tolls');

        setFareType(parts.join(' • '));
      }
    }
  }, [distanceKm, durationMin, passengerCount, selectedId, tariff, airportPickup, hasTolls]);

  const handleSelect = (vehicle) => {
    setSelectedId(vehicle.id);
    if (setSelectedVehicle) setSelectedVehicle(vehicle);
  };

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Select Your Vehicle</h2>

      <div className="mb-4 rounded-xl border bg-white p-4 text-sm text-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-semibold">
              Quote: {tariff.name}
              {airportPickup ? ' • Airport pickup' : ''}
              {hasTolls ? ' • Tolls' : ''}
            </div>
            <div className="opacity-80">
              Distance: {distanceKm ? distanceKm.toFixed(1) : '--'} km • Time: {durationMin ? Math.round(durationMin) : '--'} min
            </div>
          </div>
          <div className="text-right opacity-80">
            <div>Rates: ${tariff.perKm}/km or ${tariff.perMin}/min (switch at {'<'}27 km/h)</div>
            <div>Flagfall: ${tariff.flagfall}</div>
            <div>Booking fee: ${BOOKING_FEE.toFixed(2)}</div>
            {/* {hasTolls && <div>Tolls (est.): ${DEFAULT_TOLL_CHARGE.toFixed(2)}</div>} */}
            {airportPickup && <div>Airport fee: ${MEL_AIRPORT_PICKUP_FEE.toFixed(2)}</div>}
          </div>
        </div>
      </div>

      {VEHICLES.map((vehicle, index) => {
        const disabled =
          (passengerCount > 4 && vehicle.seats <= 4) ||
          (vehicle.id === 'suv' && passengerCount > 6);
        const isSelected = selectedId === vehicle.id;

        return (
          <motion.div
            key={vehicle.id}
            onClick={() => !disabled && handleSelect(vehicle)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className={`mb-4 flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all duration-200 ${
              disabled
                ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                : isSelected
                ? 'ring-2 ring-blue-400 border-blue-500 bg-white cursor-pointer'
                : 'bg-white hover:ring-1 hover:ring-gray-400 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-4">
              <img src={vehicle.image} alt={vehicle.name} className="w-16 h-16 object-contain" />
              <div>
                <div className="font-semibold text-lg">{vehicle.name}</div>
                <div className="text-sm text-gray-500">Seats: {vehicle.seats}</div>
              </div>
            </div>
            <div className="text-lg font-bold text-black">${fares[vehicle.id] || '--'}</div>
          </motion.div>
        );
      })}

      <div className="flex justify-between pt-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setMap(null);
            setStep(1);
          }}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          ← Back
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(3)}
          disabled={!selectedId}
          className={`px-6 py-2 rounded text-white font-semibold transition-all ${
            selectedId ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Next
        </motion.button>
      </div>
    </>
  );
};

export default VehicleSelection;
