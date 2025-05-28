import React, { useEffect, useState } from 'react';

const VEHICLES = [
  { id: 'sedan', name: 'Sedan', seats: 4, icon: '🚗' },
  { id: 'luxury', name: 'Luxury', seats: 4, icon: '🚘' },
  { id: 'suv', name: 'SUV', seats: 6, icon: '🚙' },
  { id: 'van', name: 'Van', seats: 11, icon: '🚐' },
];

const RATES = [
  { start: '09:00', end: '17:00', flagfall: 5.10, rate: 1.982 },
  { start: '17:00', end: '00:00', flagfall: 5.80, rate: 2.050 },
  { start: '00:00', end: '09:00', flagfall: 6.20, rate: 2.150 },
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
  setSelectedVehicle
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

    const timeString = bookingType === 'now'
      ? new Date().toTimeString().slice(0, 5)
      : new Date(scheduledDateTime).toTimeString().slice(0, 5);

    const { flagfall, rate } = getFareRateForTime(timeString);

    const newFares = {};
    for (const v of VEHICLES) {
      let total = flagfall + (distanceKm * rate) + GOVERNMENT_LEVY + BOOKING_FEE;
      if (passengerCount > 4 && v.seats > 4) total += HIGH_OCCUPANCY_FEE;
      newFares[v.id] = total.toFixed(2);
    }
    setFares(newFares);
  }, [distanceKm, passengerCount, bookingType, scheduledDateTime]);

  const handleSelect = (vehicle) => {
    setSelectedId(vehicle.id);
    if (setSelectedVehicle) setSelectedVehicle(vehicle);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-2">Select a Vehicle</h2>

      {VEHICLES.map((vehicle) => {
        const disabled = passengerCount > 4 && vehicle.seats <= 4;
        const isSelected = selectedId === vehicle.id;

        return (
          <div
            key={vehicle.id}
            className={`flex items-center justify-between p-4 rounded border shadow transition-all duration-200 ${
              disabled
                ? 'bg-gray-200 opacity-60'
                : isSelected
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{vehicle.icon}</span>
              <div>
                <div className="font-semibold">{vehicle.name}</div>
                <div className="text-sm text-gray-500">Seats: {vehicle.seats}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">${fares[vehicle.id] || '--'}</div>
              <button
                disabled={disabled}
                onClick={() => handleSelect(vehicle)}
                className={`mt-2 px-4 py-1 rounded text-white font-medium ${
                  disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Select
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex justify-between pt-6">
        <button
          onClick={() => setStep(1)}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          ← Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!selectedId}
          className={`px-6 py-2 rounded text-white font-semibold ${
            selectedId ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default VehicleSelection;
