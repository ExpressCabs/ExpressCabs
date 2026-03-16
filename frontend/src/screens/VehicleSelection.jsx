import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import sedanImg from '/assets/vehicles/sedan-modern.png';
import suvImg from '/assets/vehicles/suv-modern.png';
import vanImg from '/assets/vehicles/van-modern.png';
import luxuryImg from '/assets/vehicles/luxury-modern.png';
import {
  BOOKING_FEE,
  MEL_AIRPORT_PICKUP_FEE,
  computeVehicleFare,
  getLocText,
  isMelbourneAirport,
  pickTariff,
} from '../lib/ridePricing';

const VEHICLES = [
  { id: 'sedan', name: 'Sedan', seats: 4, image: sedanImg, multiplier: 1.0 },
  { id: 'luxury', name: 'Luxury', seats: 4, image: luxuryImg, multiplier: 1.0, luxurySurcharge: 11.0 },
  { id: 'suv', name: 'SUV', seats: 6, image: suvImg, multiplier: 1.0 },
  { id: 'van', name: 'Van', seats: 11, image: vanImg, multiplier: 1.0 },
];

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
  const summaryRef = useRef(null);
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

  useEffect(() => {
    if (!summaryRef.current) return;

    summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
        const normal = await routePromise(false);
        const route = normal.routes?.[0];
        const leg = route?.legs?.[0];

        if (!leg) return;

        const km = (leg.distance?.value || 0) / 1000;
        const mins = (leg.duration?.value || 0) / 60;

        setDistanceKm(km);
        setDurationMin(mins);

        const warningsText = (route?.warnings || []).join(' ').toLowerCase();
        const steps = leg.steps || [];
        const stepsHaveTollHint = steps.some((s) => {
          const instr = (s.instructions || '').toLowerCase();
          return instr.includes('toll') || instr.includes('citylink') || instr.includes('eastlink');
        });

        let tollDetected = warningsText.includes('toll') || stepsHaveTollHint;

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
              tollDetected = distanceDiffPct > 0.08 || durationDiffPct > 0.1;
            }
          } catch {
            // Keep earlier toll detection.
          }
        }

        setHasTolls(Boolean(tollDetected));
      } catch (err) {
        console.error('Could not fetch route:', err);
      }
    })();
  }, [pickupLoc, dropoffLoc]);

  useEffect(() => {
    if (!distanceKm || !durationMin) return;

    const newFares = {};

    for (const vehicle of VEHICLES) {
      const total = computeVehicleFare({
        vehicle,
        distanceKm,
        durationMin,
        tariff,
        passengerCount,
        airportPickup,
        hasTolls,
      });

      newFares[vehicle.id] = total.toFixed(2);
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

        setFareType(parts.join(' | '));
      }
    }
  }, [airportPickup, distanceKm, durationMin, hasTolls, passengerCount, selectedId, setFare, setFareType, tariff]);

  const handleSelect = (vehicle) => {
    setSelectedId(vehicle.id);
    if (setSelectedVehicle) setSelectedVehicle(vehicle);
  };

  return (
    <>
      <div ref={summaryRef} className="mb-4 scroll-mt-28">
        <h2 className="mb-3 text-center text-2xl font-semibold text-gray-800">Select Your Vehicle</h2>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
          <div className="flex flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  {tariff.name}
                </span>
                {airportPickup && (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                    Airport pickup
                  </span>
                )}
                {hasTolls && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    Tolls likely
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  {distanceKm ? distanceKm.toFixed(1) : '--'} km
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  {durationMin ? Math.round(durationMin) : '--'} min
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  {Number(passengerCount) || '--'} passenger{Number(passengerCount) === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="grid gap-1 text-xs text-slate-600 sm:text-right">
              <div>${tariff.perKm}/km + ${tariff.perMin}/min</div>
              <div>Booking fee ${BOOKING_FEE.toFixed(2)}</div>
              {airportPickup && <div>Airport fee ${MEL_AIRPORT_PICKUP_FEE.toFixed(2)}</div>}
              {hasTolls && <div>Toll charges added if used</div>}
            </div>
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
            className={`mb-4 flex items-center justify-between rounded-xl border p-4 shadow-sm transition-all duration-200 ${
              disabled
                ? 'cursor-not-allowed bg-gray-200 opacity-50'
                : isSelected
                ? 'cursor-pointer border-blue-500 bg-white ring-2 ring-blue-400'
                : 'cursor-pointer bg-white hover:ring-1 hover:ring-gray-400'
            }`}
          >
            <div className="flex items-center gap-4">
              <img src={vehicle.image} alt={vehicle.name} className="h-16 w-16 object-contain" />
              <div>
                <div className="text-lg font-semibold">{vehicle.name}</div>
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
          className="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
        >
          {'<- Back'}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(3)}
          disabled={!selectedId}
          className={`rounded px-6 py-2 font-semibold text-white transition-all ${
            selectedId ? 'bg-green-600 hover:bg-green-700' : 'cursor-not-allowed bg-gray-400'
          }`}
        >
          Next
        </motion.button>
      </div>
    </>
  );
};

export default VehicleSelection;
