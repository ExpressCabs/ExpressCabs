import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from './ToastProvider';
import { formatMelbourneDateTime } from '../lib/time';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.06 * i, ease: 'easeOut' },
  }),
};

const softIn = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

function Pill({ children, tone = 'gray' }) {
  const cls =
    tone === 'green'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : tone === 'blue'
      ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
      : tone === 'red'
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-gray-50 border-gray-200 text-gray-700';

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function fmtDateTime(d) {
  try {
    return formatMelbourneDateTime(d, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(d);
  }
}

function money(v) {
  if (typeof v !== 'number') return '-';
  return `$${v.toFixed(2)}`;
}

const DriverDashboard = ({ driver, onLogout }) => {
  const [tab, setTab] = useState('unassigned');
  const [unassignedRides, setUnassignedRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    if (tab === 'unassigned') fetchUnassignedRides();
    else if (tab === 'myrides') fetchMyRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchUnassignedRides = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/rides/unassigned`);
      setUnassignedRides(res.data);
    } catch (err) {
      console.error('Error fetching unassigned rides:', err);
      toast.error('Unable to load unassigned rides right now.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRides = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/rides/assigned?driverId=${driver.id}`
      );
      setMyRides(res.data);
    } catch (err) {
      console.error('Error fetching assigned rides:', err);
      toast.error('Unable to load your assigned rides right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (rideId) => {
    setAssigning(rideId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/rides/${rideId}/assign`,
        { driverId: driver.id }
      );
      if (res.status === 200 || res.status === 204) {
        toast.success('Ride assigned successfully.');
        setUnassignedRides((prev) => prev.filter((r) => r.id !== rideId));
        if (tab === 'myrides') fetchMyRides();
      } else {
        toast.error('Unexpected response from server.');
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      toast.error(err.response?.data?.error || 'Failed to assign ride.');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (rideId) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/rides/${rideId}/unassign`,
        { driverId: driver.id }
      );
      if (res.status === 200) {
        toast.success('Ride unassigned successfully.');
        setMyRides((prev) => prev.filter((r) => r.id !== rideId));
        fetchUnassignedRides();
      }
    } catch (err) {
      console.error('Unassign error:', err);
      toast.error(err.response?.data?.error || 'Could not unassign ride.');
    }
  };

  const myActiveRides = useMemo(
    () => (myRides || []).filter((r) => !['completed', 'cancelled'].includes(r.status)),
    [myRides]
  );

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-[340px] md:h-[420px] w-full bg-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
          <div className="absolute -top-32 -right-36 w-[460px] h-[460px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-44 -left-36 w-[460px] h-[460px] bg-emerald-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="text-white max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
                <span className="text-xs font-semibold tracking-wide text-white/90">DRIVER</span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-white/80">Dashboard</span>
              </div>

              <motion.h1 custom={1} variants={fadeUp} className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
                Welcome, {driver?.name}
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="mt-4 text-white/85 text-lg">
                Manage ride assignments quickly. Tap "Assign to Me" to lock a job.
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
                <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                  Live queue
                </span>
                <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                  My active rides
                </span>
                <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                  One-tap complete
                </span>
              </motion.div>
            </div>

            <div className="md:ml-auto">
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                onClick={onLogout}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
              >
                Logout
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 -mt-10 md:-mt-12 pb-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={softIn}
          className="rounded-3xl border border-gray-200 bg-white/90 backdrop-blur shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-6 md:p-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Rides</h2>
              <p className="mt-1 text-sm text-gray-600">
                Switch between the available queue and your assigned jobs.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTab('unassigned')}
                className={`px-4 py-2 rounded-full transition font-semibold border ${
                  tab === 'unassigned'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Unassigned
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                  {unassignedRides.length}
                </span>
              </button>

              <button
                onClick={() => setTab('myrides')}
                className={`px-4 py-2 rounded-full transition font-semibold border ${
                  tab === 'myrides'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                }`}
              >
                My Rides
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                  {myActiveRides.length}
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              <div className="h-24 rounded-3xl bg-gray-200 animate-pulse" />
              <div className="h-24 rounded-3xl bg-gray-200 animate-pulse" />
              <div className="h-24 rounded-3xl bg-gray-200 animate-pulse" />
            </div>
          ) : tab === 'unassigned' ? (
            <div className="mt-6">
              {unassignedRides.length === 0 ? (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
                  <p className="font-semibold text-gray-900">No available rides at the moment.</p>
                  <p className="mt-1 text-sm text-gray-600">Check back shortly. New jobs appear here.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {unassignedRides.map((ride, idx) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(idx * 0.03, 0.2) }}
                      className="rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition overflow-hidden"
                    >
                      <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-gray-900">
                              {ride.pickup} <span className="text-gray-300">→</span> {ride.dropoff}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">{fmtDateTime(ride.rideDate)}</p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Pill tone="blue">Unassigned</Pill>
                            <Pill>{ride.passengerCount ? `${ride.passengerCount} pax` : 'Pax -'}</Pill>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <button
                          onClick={() => handleAssign(ride.id)}
                          className="w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition disabled:opacity-60"
                          disabled={assigning === ride.id}
                        >
                          {assigning === ride.id ? 'Assigning...' : 'Assign to Me'}
                        </button>
                        <p className="mt-3 text-xs text-gray-500 text-center">
                          Assigning locks this ride to your account.
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              {myActiveRides.length === 0 ? (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
                  <p className="font-semibold text-gray-900">You have no assigned rides yet.</p>
                  <p className="mt-1 text-sm text-gray-600">Assign a ride from the Unassigned tab.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {myActiveRides.map((ride, idx) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(idx * 0.03, 0.2) }}
                      className="rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition overflow-hidden"
                    >
                      <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-emerald-50 to-white">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-gray-900">
                              {ride.pickup} <span className="text-gray-300">→</span> {ride.dropoff}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">{fmtDateTime(ride.rideDate)}</p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Pill tone="green">Assigned</Pill>
                            <Pill tone="blue">{money(ride.fare)}</Pill>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 text-sm">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-semibold text-gray-500">Passenger</p>
                            <p className="mt-1 font-semibold text-gray-900">{ride.name || '-'}</p>
                            <p className="mt-1 text-gray-700">{ride.phone || '-'}</p>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <p className="text-xs font-semibold text-gray-500">Trip</p>
                            <p className="mt-1 text-gray-800">
                              <span className="font-semibold">From:</span> {ride.pickup || '-'}
                            </p>
                            <p className="mt-1 text-gray-800">
                              <span className="font-semibold">To:</span> {ride.dropoff || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleUnassign(ride.id)}
                            className="flex-1 h-11 rounded-xl bg-white border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition"
                          >
                            Unassign
                          </button>

                          <button
                            onClick={async () => {
                              if (!window.confirm('Mark this ride as completed?')) return;
                              const res = await fetch(
                                `${import.meta.env.VITE_API_BASE_URL}/api/rides/${ride.id}/complete`,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ driverId: driver.id }),
                                }
                              );
                              if (res.ok) {
                                toast.success('Ride marked as completed.');
                                fetchMyRides();
                              } else {
                                const error = await res.json();
                                toast.error(error?.error || 'Failed to update ride.');
                              }
                            }}
                            className="flex-1 h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                          >
                            Complete
                          </button>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 text-center">
                          Completing moves this ride into history.
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default DriverDashboard;
