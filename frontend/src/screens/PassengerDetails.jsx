import React, { useState } from 'react';
import { motion } from 'framer-motion';

const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';

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
  onSubmitPassengerDetails,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const isValid = name.trim() && phone.trim();

  const handleSendOtp = async () => {
    if (!isValid) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        onSubmitPassengerDetails({ name, phone, email, note });
        setStep(4);
      } else {
        alert(`❌ Failed to send OTP: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('OTP send error:', err);
      alert('❌ Could not send OTP. Please try again.');
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Passenger Details</h2>

      <form className="space-y-4">
        <div>
          <label className="block font-medium text-gray-800">Full Name *</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded text-black"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-800">Phone Number *</label>
          <input
            type="tel"
            className="w-full px-4 py-2 border rounded text-black"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0412345678"
          />
          <small className="mt-1 text-sm text-gray-700">
            An OTP will be sent to this number for verification before booking.
          </small>
        </div>

        <div>
          <label className="block font-medium text-gray-800">Email (optional)</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-800">Driver Note (optional)</label>
          <textarea
            className="w-full px-4 py-2 border rounded text-black"
            rows="3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any instructions for driver"
          ></textarea>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={OTP_ENABLED ? handleSendOtp : () => { }}
            disabled={!isValid || isBooking}
            className={`px-6 py-2 rounded text-white font-semibold ${isValid && !isBooking
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
              }`}
          >
            {isBooking ? 'Booking...' : 'Book Ride'}
          </button>
        </div>
      </form>
    </>
  );
};

export default PassengerDetails;
