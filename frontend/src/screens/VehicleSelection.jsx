import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiBriefcase, FiCheck, FiChevronDown, FiChevronUp, FiUsers } from 'react-icons/fi';
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
  selectedVehicleId,
  setSelectedVehicle,
  setFare,
  setFareType,
}) => {
  const summaryRef = useRef(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [hasTolls, setHasTolls] = useState(false);
  const [fares, setFares] = useState({});
  const [selectedId, setSelectedId] = useState(selectedVehicleId || null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setSelectedId(selectedVehicleId || null);
  }, [selectedVehicleId]);

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
    const disabled = Number(passengerCount) > vehicle.seats;
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
    <div ref={summaryRef} className="scroll-mt-28">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600" aria-live="polite">
        <span>{distanceKm ? `${distanceKm.toFixed(1)} km` : 'Calculating distance…'}</span>
        <span aria-hidden="true">•</span>
        <span>{durationMin ? `${Math.round(durationMin)} min` : 'Calculating time…'}</span>
        {hasTolls && <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-800">Tolls likely</span>}
      </div>

      <div className="grid gap-3" role="radiogroup" aria-label="Vehicle options">
        {vehicleStates.map((vehicle) => (
          <div key={vehicle.id} className={`overflow-hidden rounded-2xl border transition ${vehicle.disabled
            ? 'border-slate-200 bg-slate-50 opacity-60'
            : vehicle.isSelected
            ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-600'
            : 'border-slate-200 bg-white hover:border-blue-300'
          }`}>
            <label className={`relative flex h-[124px] items-center gap-3 px-3 py-3 sm:px-4 ${vehicle.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="radio" name="booking-vehicle" value={vehicle.id} checked={vehicle.isSelected}
                disabled={vehicle.disabled} onChange={() => handleSelect(vehicle)} className="peer sr-only" />
              <span className={`flex h-16 w-[76px] shrink-0 items-center justify-center rounded-xl ${vehicle.isSelected ? 'bg-white' : 'bg-blue-50'}`}>
                <img src={vehicle.image} alt="" aria-hidden="true" className="h-12 w-[68px] object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-base font-black text-slate-950">{vehicle.name}</span>
                  <span className="text-xs font-medium text-slate-500">1–{vehicle.seats} passengers</span>
                </span>
                <span className="mt-1 block min-h-10 text-xs leading-5 text-slate-600">{vehicle.summary}</span>
                {vehicle.disabled && <span className="mt-1 block text-xs font-bold text-red-700">Not suitable for your group</span>}
              </span>
              <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${vehicle.isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                {vehicle.isSelected && <FiCheck size={14} strokeWidth={3} />}
              </span>
            </label>
            <button type="button" onClick={() => setExpandedId((current) => current === vehicle.id ? null : vehicle.id)}
              className="flex min-h-11 w-full items-center justify-between border-t border-slate-100 px-4 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={expandedId === vehicle.id} aria-controls={`vehicle-details-${vehicle.id}`}>
              <span>Vehicle details</span>
              {expandedId === vehicle.id ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
            </button>
            {expandedId === vehicle.id && <div id={`vehicle-details-${vehicle.id}`} className="grid gap-2 border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-600 sm:grid-cols-2">
              <span className="flex items-center gap-2"><FiUsers className="text-blue-600" aria-hidden="true" />{vehicle.fitLabel}</span>
              <span className="flex items-center gap-2"><FiBriefcase className="text-blue-600" aria-hidden="true" />{vehicle.luggage}</span>
              <span>{vehicle.comfort}</span><span>{vehicle.idealFor}</span>
            </div>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">Vehicle availability is confirmed with your booking.</p>
    </div>
  );
};

export default VehicleSelection;
