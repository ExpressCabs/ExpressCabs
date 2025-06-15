// PassengerDetails.jsx — Enhanced with modern UI and motion transitions
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PassengerDetails = ({
  setStep,
  pickupAddress,
  pickupLoc,
  dropoffAddress,
  dropoffLoc,
  bookingType,
  scheduledDateTime,
  passengerCount,
  selectedVehicle,
  fare,
  fareType,
  loggedInUser,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const navigate = useNavigate();
  const isValid = name.trim() && phone.trim();

  const handleBookRide = async () => {
    if (!isValid) return;
    if (!pickupLoc || !dropoffLoc) {
      alert('Pickup or Dropoff location is missing. Please go back and enter them.');
      return;
    }

    const rideDate = bookingType === 'later' ? new Date(scheduledDateTime) : new Date();

    const payload = {
      name,
      phone,
      email,
      note,
      pickup: pickupAddress,
      pickupLat: pickupLoc?.lat?.() ?? null,
      pickupLng: pickupLoc?.lng?.() ?? null,
      dropoff: dropoffAddress,
      dropoffLat: dropoffLoc?.lat?.() ?? null,
      dropoffLng: dropoffLoc?.lng?.() ?? null,
      rideDate,
      vehicleType: selectedVehicle?.id ?? null,
      fare: fare ?? null,
      fareType,
      passengerCount,
      userId: loggedInUser?.id ?? null,
    };

    console.log('Payload being sent:', payload);

    try {
      console.log('📤 Sending booking request...');
      const response = await fetch('${import.meta.env.VITE_API_BASE_URL}/api/rides/book-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('✅ Response JSON:', result);

      if (response.ok) {
        setName('');
        setPhone('');
        setEmail('');
        setNote('');
        navigate('/ride-success', { state: { isGuest: !loggedInUser } });
      } else {
        alert(`❌ Booking failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('❌ An error occurred while booking the ride.');
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center px-4 py-12"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg backdrop-blur-md">
        <h2 className="text-2xl font-bold text-center mb-6">Passenger Details</h2>

        <form className="space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <label className="block font-medium">Full Name *</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <label className="block font-medium">Phone Number *</label>
            <input
              type="tel"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0412345678"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <label className="block font-medium">Email (optional)</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <label className="block font-medium">Driver Note (optional)</label>
            <textarea
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any instructions for driver"
            ></textarea>
          </motion.div>

          <motion.div
            className="flex justify-between pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setStep(2)}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              ← Back
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleBookRide}
              disabled={!isValid}
              className={`px-6 py-2 rounded text-white font-semibold transition-all ${isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              Book Ride
            </motion.button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
};

export default PassengerDetails;
