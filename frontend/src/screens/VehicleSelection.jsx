import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import sedanImg from '/assets/vehicles/sedan-modern.png';
import suvImg from '/assets/vehicles/suv-modern.png';
import vanImg from '/assets/vehicles/van-modern.png';
import luxuryImg from '/assets/vehicles/luxury-modern.png';
import {
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
      badge: 'border border-slate-800/70 bg-slate-900/90',
      tint: 'from-slate-100/95 via-white/88 to-sky-100/70',
      chip: 'border-white/55 bg-white/72 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]',
      panel: 'border-slate-300/70 bg-slate-50/82',
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
      badge: 'border border-slate-800/70 bg-slate-900/90',
      tint: 'from-stone-100/95 via-white/88 to-amber-100/70',
      chip: 'border-white/55 bg-white/72 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]',
      panel: 'border-stone-300/70 bg-stone-50/84',
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
      badge: 'border border-slate-800/70 bg-slate-900/90',
      tint: 'from-slate-100/95 via-white/88 to-emerald-100/70',
      chip: 'border-white/55 bg-white/72 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]',
      panel: 'border-emerald-300/70 bg-emerald-50/80',
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
      badge: 'border border-slate-800/70 bg-slate-900/90',
      tint: 'from-slate-100/95 via-white/88 to-violet-100/70',
      chip: 'border-white/55 bg-white/72 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]',
      panel: 'border-violet-300/70 bg-violet-50/80',
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

  const vehicleStates = VEHICLES.map((vehicle) => {
    const disabled =
      (passengerCount > 4 && vehicle.seats <= 4) ||
      (vehicle.id === 'suv' && passengerCount > 6);
    const isSelected = selectedId === vehicle.id;
    const fitLabel = Number(passengerCount) > 0
      ? vehicle.seats >= Number(passengerCount)
        ? `Comfortably fits ${Number(passengerCount)} passenger${Number(passengerCount) === 1 ? '' : 's'}`
        : `Not suitable for ${Number(passengerCount)} passengers`
      : `Seats up to ${vehicle.seats}`;

    return {
      ...vehicle,
      disabled,
      isSelected,
      fitLabel,
      fare: fares[vehicle.id],
    };
  });

  return (
    <>
      <div ref={summaryRef} className="mb-4 scroll-mt-28">
        <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight text-slate-900">Select Your Vehicle</h2>

        <div className="rounded-[26px] border border-white/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.56)_0%,rgba(226,232,240,0.42)_100%)] px-4 py-3 text-sm text-slate-700 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.26)] backdrop-blur-xl">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full border border-slate-300/60 bg-white/84 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              {distanceKm ? distanceKm.toFixed(1) : '--'} km
            </span>
            <span className="rounded-full border border-slate-300/60 bg-white/84 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              {durationMin ? Math.round(durationMin) : '--'} min
            </span>
            <span className="rounded-full border border-slate-300/60 bg-white/84 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              {Number(passengerCount) || '--'} passenger{Number(passengerCount) === 1 ? '' : 's'}
            </span>
            {airportPickup && (
              <span className="rounded-full border border-sky-200/70 bg-sky-100/55 px-3 py-1 text-sky-700 backdrop-blur-md">
                Airport pickup
              </span>
            )}
            {hasTolls && (
              <span className="rounded-full border border-amber-200/70 bg-amber-100/55 px-3 py-1 text-amber-700 backdrop-blur-md">
                Tolls likely
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(226,232,240,0.34)_100%)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_28px_70px_-38px_rgba(15,23,42,0.34)] backdrop-blur-xl">
        <div className="grid gap-2">
          {vehicleStates.map((vehicle, index) => (
            <motion.button
              key={vehicle.id}
              type="button"
              onClick={() => !vehicle.disabled && handleSelect(vehicle)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`grid rounded-[20px] border px-3 py-2.5 text-left transition-all duration-200 md:grid-cols-[minmax(0,1.5fr)_90px_120px_130px] md:items-center md:gap-3 ${
                vehicle.disabled
                  ? 'cursor-not-allowed border-slate-300/60 bg-white/48 opacity-50'
                  : vehicle.isSelected
                  ? 'border-slate-400/45 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(241,245,249,0.94)_100%)] shadow-[0_24px_52px_-30px_rgba(15,23,42,0.42)] ring-2 ring-slate-700/12'
                  : 'border-slate-300/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.84)_100%)] shadow-[0_18px_38px_-28px_rgba(15,23,42,0.24)] hover:-translate-y-0.5 hover:border-slate-300/90 hover:bg-white'
              }`}
            >
              <div className="relative flex min-w-0 items-center gap-3 py-1.5 before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,rgba(148,163,184,0)_0%,rgba(148,163,184,0.5)_18%,rgba(148,163,184,0.5)_82%,rgba(148,163,184,0)_100%)] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,rgba(148,163,184,0)_0%,rgba(148,163,184,0.5)_18%,rgba(148,163,184,0.5)_82%,rgba(148,163,184,0)_100%)]">
                <div className={`relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/90 bg-gradient-to-br ${vehicle.accent.tint} shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_18px_-16px_rgba(15,23,42,0.35)]`}>
                  <img src={vehicle.image} alt={vehicle.name} className="h-8 w-8 object-contain" />
                </div>
                <div className="relative z-[1] min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-900">{vehicle.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white ${vehicle.accent.badge}`}>
                      {vehicle.badge}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4.5 text-slate-600">{vehicle.summary}</p>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-300/55 bg-white/84 px-3 py-1.5 text-xs text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:mt-0 md:block md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:hidden">Seats</span>
                <span className="font-semibold text-slate-900">{vehicle.seats}</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-300/55 bg-white/84 px-3 py-1.5 text-xs text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:mt-0 md:block md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:hidden">Luggage</span>
                <span className="font-semibold text-slate-900">{vehicle.luggage}</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-300/55 bg-white/84 px-3 py-1.5 text-xs text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:mt-0 md:block md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:hidden">Best for</span>
                <span className="font-semibold text-slate-900">{vehicle.rideStyle}</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between md:mt-0 md:justify-end">
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                  vehicle.disabled
                    ? 'bg-red-100 text-red-700'
                    : vehicle.isSelected
                    ? 'bg-slate-950 text-white'
                    : 'border border-slate-200/85 bg-white text-slate-700'
                }`}>
                  {vehicle.disabled ? 'Not suitable' : vehicle.isSelected ? 'Selected' : 'Select'}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-1.5 md:col-span-4 md:mt-0.5">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${vehicle.accent.chip}`}>
                  {vehicle.comfort}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${vehicle.accent.chip}`}>
                  {vehicle.fitLabel}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setMap(null);
            setStep(1);
          }}
          className="h-12 rounded-2xl border border-white/55 bg-white/68 font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition hover:bg-white/82"
        >
          Back
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(3)}
          disabled={!selectedId}
          className={`h-12 rounded-2xl border font-semibold text-white shadow-[0_20px_46px_-30px_rgba(15,23,42,0.65)] backdrop-blur-md transition ${
            selectedId
              ? 'border-slate-800/70 bg-[linear-gradient(180deg,rgba(30,41,59,0.98)_0%,rgba(15,23,42,1)_100%)] hover:brightness-105'
              : 'cursor-not-allowed border-slate-500/40 bg-slate-400/70'
          }`}
        >
          Next
        </motion.button>
      </div>
    </>
  );
};

export default VehicleSelection;
