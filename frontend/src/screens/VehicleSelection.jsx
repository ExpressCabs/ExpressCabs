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
  {
    id: 'sedan',
    name: 'Sedan',
    seats: 4,
    image: sedanImg,
    multiplier: 1.0,
    badge: 'Most popular',
    summary: 'Smooth everyday airport and city transfers.',
    idealFor: 'Best for solo travellers, couples, and light luggage.',
    luggage: '2 large + 2 cabin bags',
    comfort: 'Balanced comfort',
    rideStyle: 'Everyday transfer',
    accent: {
      badge: 'bg-slate-900',
      tint: 'from-slate-200 via-slate-150 to-stone-300/95',
      chip: 'border-slate-200 bg-slate-100 text-slate-700',
      panel: 'border-slate-200 bg-slate-100/80',
    },
  },
  {
    id: 'luxury',
    name: 'Luxury',
    seats: 4,
    image: luxuryImg,
    multiplier: 1.0,
    luxurySurcharge: 11.0,
    badge: 'Premium ride',
    summary: 'A quieter, more polished ride for business or special occasions.',
    idealFor: 'Best for executive pickups and elevated comfort.',
    luggage: '2 large + 2 cabin bags',
    comfort: 'Premium cabin',
    rideStyle: 'Executive transfer',
    accent: {
      badge: 'bg-slate-900',
      tint: 'from-slate-200 via-slate-150 to-stone-300/95',
      chip: 'border-slate-200 bg-slate-100 text-slate-700',
      panel: 'border-slate-200 bg-slate-100/80',
    },
  },
  {
    id: 'suv',
    name: 'SUV',
    seats: 6,
    image: suvImg,
    multiplier: 1.0,
    badge: 'Extra room',
    summary: 'More cabin space for families and bulky bags.',
    idealFor: 'Best for groups needing flexibility and comfort.',
    luggage: '4 large + 3 cabin bags',
    comfort: 'Spacious seating',
    rideStyle: 'Family transfer',
    accent: {
      badge: 'bg-slate-900',
      tint: 'from-slate-200 via-slate-150 to-stone-300/95',
      chip: 'border-slate-200 bg-slate-100 text-slate-700',
      panel: 'border-slate-200 bg-slate-100/80',
    },
  },
  {
    id: 'van',
    name: 'Van',
    seats: 11,
    image: vanImg,
    multiplier: 1.0,
    badge: 'Group transfer',
    summary: 'Built for larger groups, airport teams, and event travel.',
    idealFor: 'Best for 7+ passengers or substantial luggage.',
    luggage: 'Up to 8 large bags',
    comfort: 'Large group layout',
    rideStyle: 'Group transfer',
    accent: {
      badge: 'bg-slate-900',
      tint: 'from-slate-200 via-slate-150 to-stone-300/95',
      chip: 'border-slate-200 bg-slate-100 text-slate-700',
      panel: 'border-slate-200 bg-slate-100/80',
    },
  },
];

const VehicleSelection = ({
  pickupLoc,
  dropoffLoc,
  pickupSuburb,
  dropoffSuburb,
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
            avoidTolls: Boolean(avoidTolls),
            avoidHighways: false,
            avoidFerries: false,
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
        pickupSuburb,
        dropoffSuburb,
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
  }, [
    airportPickup,
    distanceKm,
    durationMin,
    dropoffSuburb,
    hasTolls,
    passengerCount,
    pickupSuburb,
    selectedId,
    setFare,
    setFareType,
    tariff,
  ]);

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
        const fitLabel = Number(passengerCount) > 0
          ? vehicle.seats >= Number(passengerCount)
            ? `Comfortably fits ${Number(passengerCount)} passenger${Number(passengerCount) === 1 ? '' : 's'}`
            : `Not suitable for ${Number(passengerCount)} passengers`
          : `Seats up to ${vehicle.seats}`;

        return (
          <motion.div
            key={vehicle.id}
            onClick={() => !disabled && handleSelect(vehicle)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className={`mb-3 overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 ${
              disabled
                ? 'cursor-not-allowed bg-gray-200 opacity-50'
                : isSelected
                ? 'cursor-pointer border-slate-950 bg-slate-50 ring-2 ring-slate-900/20 shadow-[0_22px_44px_-24px_rgba(15,23,42,0.72),0_10px_18px_-14px_rgba(15,23,42,0.35)]'
                : 'cursor-pointer bg-white shadow-[0_14px_28px_-22px_rgba(15,23,42,0.42),0_6px_12px_-10px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.46),0_10px_18px_-12px_rgba(15,23,42,0.22)]'
            }`}
          >
            <div
              className={`border-b border-slate-300/70 bg-gradient-to-br ${vehicle.accent.tint} px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(148,163,184,0.18)]`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#f3f4f6_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_22px_-16px_rgba(15,23,42,0.55)]">
                    <img src={vehicle.image} alt={vehicle.name} className="h-11 w-11 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-bold tracking-tight text-slate-900">{vehicle.name}</div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_14px_-10px_rgba(15,23,42,0.45)] ${vehicle.accent.badge}`}>
                        {vehicle.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600 md:text-[13px]">{vehicle.summary}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 md:justify-end">
                  <span className="rounded-full border border-white/80 bg-white/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_12px_-10px_rgba(15,23,42,0.3)]">
                    {vehicle.rideStyle}
                  </span>
                  <span className="rounded-full border border-white/80 bg-white/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_12px_-10px_rgba(15,23,42,0.3)]">
                    {vehicle.comfort}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 px-3.5 py-2.5 md:grid-cols-[1.5fr,1fr] md:items-start">
              <div className="space-y-2">
                <div>
                  <p className="text-[13px] leading-5 text-slate-700">{vehicle.idealFor}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className={`rounded-full border px-2.5 py-1 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_14px_-12px_rgba(15,23,42,0.28)] ${vehicle.accent.chip}`}>
                    Seats up to {vehicle.seats}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_14px_-12px_rgba(15,23,42,0.28)] ${vehicle.accent.chip}`}>
                    {vehicle.luggage}
                  </span>
                </div>
              </div>

              <div className={`rounded-xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_22px_-18px_rgba(15,23,42,0.26)] ${
                disabled
                  ? 'border-red-200 bg-red-50/70'
                  : isSelected
                  ? 'border-slate-300 bg-slate-100/80'
                  : vehicle.accent.panel
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Trip Fit</p>
                    <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-900">{fitLabel}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    disabled
                      ? 'bg-red-100 text-red-700'
                      : isSelected
                      ? 'bg-slate-950 text-white ring-2 ring-white/70'
                      : 'bg-white/80 text-slate-700'
                  }`}>
                    {disabled ? 'Not suitable' : isSelected ? 'Selected' : 'Available'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setMap(null);
            setStep(1);
          }}
          className="h-11 rounded-xl border border-gray-200 bg-white font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          Back
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(3)}
          disabled={!selectedId}
          className={`h-11 rounded-xl font-semibold text-white transition ${
            selectedId ? 'bg-gray-900 hover:bg-black' : 'cursor-not-allowed bg-gray-400'
          }`}
        >
          Next
        </motion.button>
      </div>
    </>
  );
};

export default VehicleSelection;
