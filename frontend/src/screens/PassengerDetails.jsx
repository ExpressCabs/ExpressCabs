import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from '../components/ToastProvider';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.06 * i, ease: 'easeOut' },
  }),
};

function Pill({ children }) {
  return (
    <span className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-semibold">
      {children}
    </span>
  );
}

const PassengerDetails = ({
  setStep,
  onSubmitPassengerDetails,
  pickupAddress,
  dropoffAddress,
  selectedVehicle,
  passengerCount,
  fare,
  fareType,
  scheduledDateTime,
  loggedInUser,
}) => {
  const [name, setName] = useState(loggedInUser?.name || '');
  const [phone, setPhone] = useState(loggedInUser?.phone || '');
  const [email, setEmail] = useState(loggedInUser?.email || '');
  const [note, setNote] = useState('');

  const tripMeta = useMemo(() => {
    const when = scheduledDateTime ? new Date(scheduledDateTime).toLocaleString('en-AU') : 'Now';
    const pax = passengerCount ? `${passengerCount} passengers` : 'Passengers not set';
    const v = selectedVehicle?.name || selectedVehicle?.title || selectedVehicle?.id || 'Vehicle selected';
    const f = typeof fare === 'number' ? `$${fare.toFixed(2)}` : fare ? `$${fare}` : '—';
    const ft = fareType ? `${fareType}` : '';
    return { when, pax, v, f, ft };
  }, [scheduledDateTime, passengerCount, selectedVehicle, fare, fareType]);

  const submit = () => {
    if (!name || !phone) {
      toast.error('Please enter name and phone.');
      return;
    }
    onSubmitPassengerDetails({ name, phone, email, note });
  };

  return (
    <motion.div initial="hidden" animate="show" className="text-gray-900">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Passenger details</h2>
          <p className="mt-1 text-sm text-gray-600">
            Confirm your contact details so the driver can reach you.
          </p>
        </div>
        <div className="hidden md:flex flex-wrap gap-2 justify-end">
          <Pill>Secure booking</Pill>
          <Pill>24/7 support</Pill>
          <Pill>Fast confirmation</Pill>
        </div>
      </motion.div>

      {/* Trip summary */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className="mt-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 md:p-6"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-700">Trip summary</p>
            <p className="mt-2 text-sm text-gray-800">
              <span className="font-semibold">Pickup:</span> {pickupAddress || '—'}
            </p>
            <p className="mt-1 text-sm text-gray-800">
              <span className="font-semibold">Dropoff:</span> {dropoffAddress || '—'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill>{tripMeta.when}</Pill>
            <Pill>{tripMeta.pax}</Pill>
            <Pill>{tripMeta.v}</Pill>
            <Pill>{tripMeta.f} {tripMeta.ft}</Pill>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div variants={fadeUp} custom={2} className="mt-6 grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-800">Full name *</label>
            <input
              type="text"
              placeholder="Passenger name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800">Phone number *</label>
            <input
              type="tel"
              placeholder="04xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-800">Email (optional)</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-800">Note to driver (optional)</label>
          <textarea
            placeholder="e.g., Flight number, luggage details, child seat, pick-up instructions..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 w-full min-h-[120px] px-3 py-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
          />
          <p className="mt-2 text-xs text-gray-500">
            Tip: Add terminal info, airline, or special pickup instructions for faster service.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-2 grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => setStep(2)}
            className="h-11 rounded-xl border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition"
          >
            Back
          </button>

          <button
            onClick={submit}
            className="h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PassengerDetails;
