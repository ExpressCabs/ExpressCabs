// PassengerDetails.jsx — Updated for OTP flow with parent data handoff
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
    <motion.div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center px-4 py-12" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg backdrop-blur-md">
        <h2 className="text-2xl font-bold text-center mb-6">Passenger Details</h2>
        <form className="space-y-4">
          <motion.div>
            <label className="block font-medium">Full Name *</label>
            <input type="text" className="w-full px-4 py-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
          </motion.div>
          <motion.div>
            <label className="block font-medium">Phone Number *</label>
            <input type="tel" className="w-full px-4 py-2 border rounded" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0412345678" />
            <small className="text-xs text-gray-500">An OTP will be sent to this number for verification before booking.</small>
          </motion.div>
          <motion.div>
            <label className="block font-medium">Email (optional)</label>
            <input type="email" className="w-full px-4 py-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </motion.div>
          <motion.div>
            <label className="block font-medium">Driver Note (optional)</label>
            <textarea className="w-full px-4 py-2 border rounded" rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any instructions for driver"></textarea>
          </motion.div>
          <motion.div className="flex justify-between pt-6">
            <motion.button type="button" onClick={() => setStep(2)} className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
              ← Back
            </motion.button>
            <motion.button
              type="button"
              onClick={OTP_ENABLED ? handleSendOtp : () => { }}
              disabled={!isValid || isBooking}
              className={`px-6 py-2 rounded text-white font-semibold ${isValid && !isBooking ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {isBooking ? 'Booking...' : 'Book Ride'}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
};

export default PassengerDetails;
