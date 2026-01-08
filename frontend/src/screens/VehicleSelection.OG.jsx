import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import sedanImg from '/assets/vehicles/sedan-modern.png';
import suvImg from '/assets/vehicles/suv-modern.png';
import vanImg from '/assets/vehicles/van-modern.png';
import luxuryImg from '/assets/vehicles/luxury-modern.png';

const VEHICLES = [
  { id: 'sedan', name: 'Sedan', seats: 4, image: sedanImg },
  { id: 'luxury', name: 'Luxury', seats: 4, image: luxuryImg },
  { id: 'suv', name: 'SUV', seats: 6, image: suvImg },
  { id: 'van', name: 'Van', seats: 11, image: vanImg },
];

const RATES = [
  { start: '09:00', end: '17:00', flagfall: 5.25, rate: 2.047 },
  { start: '17:00', end: '00:00', flagfall: 6.55, rate: 2.265 },
  { start: '00:00', end: '09:00', flagfall: 7.80, rate: 2.495 },
];

const GOVERNMENT_LEVY = 1.32;
const BOOKING_FEE = 2.70;
const HIGH_OCCUPANCY_FEE = 17.35;

function getFareRateForTime(timeString) {
  const time = parseInt(timeString.slice(0, 2), 10);
  if (time >= 9 && time < 17) return RATES[0];
  if (time >= 17 && time < 24) return RATES[1];
  return RATES[2];
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
  const [fares, setFares] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!pickupLoc || !dropoffLoc) return;
    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: pickupLoc,
        destination: dropoffLoc,
        travelMode: 'DRIVING',
      },
      (result, status) => {
        if (status === 'OK') {
          const distanceMeters = result.routes[0].legs[0].distance.value;
          const km = distanceMeters / 1000;
          setDistanceKm(km);
        } else {
          console.error('Could not fetch route:', status);
        }
      }
    );
  }, [pickupLoc, dropoffLoc]);

  useEffect(() => {
    if (!distanceKm) return;
    const timeString =
      bookingType === 'now'
        ? new Date().toTimeString().slice(0, 5)
        : new Date(scheduledDateTime).toTimeString().slice(0, 5);
    const { flagfall, rate } = getFareRateForTime(timeString);
    const newFares = {};
    for (const v of VEHICLES) {
      let total = flagfall + distanceKm * rate + GOVERNMENT_LEVY + BOOKING_FEE;
      if (passengerCount > 4 && v.seats > 4) total += HIGH_OCCUPANCY_FEE;
      if (v.id === 'luxury') total += 11.0;
      newFares[v.id] = total.toFixed(2);
    }
    setFares(newFares);
    if (selectedId && newFares[selectedId]) {
      if (typeof setFare === 'function') {
        setFare(parseFloat(newFares[selectedId]));
      }
      if (typeof setFareType === 'function') {
        const selectedVehicle = VEHICLES.find((v) => v.id === selectedId);
        const highOccupancyApplies = passengerCount > 4 && selectedVehicle.seats > 4;
        setFareType(highOccupancyApplies ? 'High Occupancy' : 'Standard');
      }
    }
  }, [distanceKm, passengerCount, bookingType, scheduledDateTime, selectedId]);

  const handleSelect = (vehicle) => {
    setSelectedId(vehicle.id);
    if (setSelectedVehicle) setSelectedVehicle(vehicle);
  };

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Select Your Vehicle</h2>

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
            className={`mb-4 flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all duration-200 ${disabled
              ? 'bg-gray-200 opacity-50 cursor-not-allowed'
              : isSelected
                ? 'ring-2 ring-blue-400 border-blue-500 bg-white cursor-pointer'
                : 'bg-white hover:ring-1 hover:ring-gray-400 cursor-pointer'
              }`}
          >
            <div className="flex items-center gap-4">
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="w-16 h-16 object-contain"
              />
              <div>
                <div className="font-semibold text-lg">{vehicle.name}</div>
                <div className="text-sm text-gray-500">Seats: {vehicle.seats}</div>
              </div>
            </div>
            <div className="text-lg font-bold text-black">
              ${fares[vehicle.id] || '--'}
            </div>
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
          className={`px-6 py-2 rounded text-white font-semibold transition-all ${selectedId
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          Next
        </motion.button>
      </div>
    </>
  );
};

export default VehicleSelection;
