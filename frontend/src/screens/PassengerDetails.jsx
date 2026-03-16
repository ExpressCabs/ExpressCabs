import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
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
  const topRef = useRef(null);
  const [name, setName] = useState(loggedInUser?.name || '');
  const [phone, setPhone] = useState(loggedInUser?.phone || '');
  const [email, setEmail] = useState(loggedInUser?.email || '');
  const [note, setNote] = useState('');

  const tripMeta = useMemo(() => {
    const when = scheduledDateTime ? new Date(scheduledDateTime).toLocaleString('en-AU') : 'Now';
    const pax = passengerCount ? `${passengerCount} passengers` : 'Passengers not set';
    const vehicleName = selectedVehicle?.name || selectedVehicle?.title || selectedVehicle?.id || 'Vehicle selected';
    const totalFare = typeof fare === 'number' ? `$${fare.toFixed(2)}` : fare ? `$${fare}` : '--';
    const fareLabel = fareType || '';
    return { when, pax, vehicleName, totalFare, fareLabel };
  }, [scheduledDateTime, passengerCount, selectedVehicle, fare, fareType]);

  useEffect(() => {
    if (!topRef.current) return;

    topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const submit = () => {
    if (!name || !phone) {
      toast.error('Please enter name and phone.');
      return;
    }

    onSubmitPassengerDetails({ name, phone, email, note });
  };

  return (
    <motion.div ref={topRef} initial="hidden" animate="show" className="scroll-mt-28 text-gray-900">
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Passenger details</h2>
          <p className="mt-1 text-sm text-gray-600">
            Confirm your contact details so the driver can reach you.
          </p>
        </div>
        <div className="hidden flex-wrap justify-end gap-2 md:flex">
          <Pill>Secure booking</Pill>
          <Pill>24/7 support</Pill>
          <Pill>Fast confirmation</Pill>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        custom={1}
        className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
      >
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Trip summary</p>
            <p className="mt-2 text-sm text-gray-800">
              <span className="font-semibold">Pickup:</span> {pickupAddress || '--'}
            </p>
            <p className="mt-1 text-sm text-gray-800">
              <span className="font-semibold">Dropoff:</span> {dropoffAddress || '--'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <Pill>{tripMeta.when}</Pill>
            <Pill>{tripMeta.pax}</Pill>
            <Pill>{tripMeta.vehicleName}</Pill>
            <Pill>{tripMeta.totalFare}{tripMeta.fareLabel ? ` | ${tripMeta.fareLabel}` : ''}</Pill>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={2} className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-800">Full name *</label>
            <input
              type="text"
              placeholder="Passenger name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800">Phone number *</label>
            <input
              type="tel"
              placeholder="04xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
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
            className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-800">Note to driver (optional)</label>
          <textarea
            placeholder="e.g., Flight number, luggage details, child seat, pick-up instructions..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
          />
          <p className="mt-2 text-xs text-gray-500">
            Tip: Add terminal info, airline, or special pickup instructions for faster service.
          </p>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setStep(2)}
            className="h-11 rounded-xl border border-gray-200 bg-white font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Back
          </button>

          <button
            onClick={submit}
            className="h-11 rounded-xl bg-gray-900 font-semibold text-white transition hover:bg-black"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PassengerDetails;
