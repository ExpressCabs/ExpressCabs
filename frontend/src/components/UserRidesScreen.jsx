// UserRidesScreen.jsx — Modern UI upgrade (logic unchanged)
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

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
    return new Date(d).toLocaleString('en-AU', {
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
  if (typeof v !== 'number') return '—';
  return `$${v.toFixed(2)}`;
}

const UserRidesScreen = ({ user, onLogout, setMode }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rides/user/${user.id}`);
        const data = await res.json();
        setRides(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching user rides:', error);
        setRides([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchRides();
  }, [user]);

  const { myRides, pastRides } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    (rides || []).forEach((ride) => {
      const rideTime = new Date(ride.rideDate);
      const minutesFromNow = (rideTime - now) / 60000;

      if (ride.status === 'completed') {
        past.push(ride);
      } else if (minutesFromNow >= -60) {
        upcoming.push(ride);
      }
    });

    // Optional sorting for better UX (does not change your logic, only order)
    upcoming.sort((a, b) => new Date(a.rideDate) - new Date(b.rideDate));
    past.sort((a, b) => new Date(b.rideDate) - new Date(a.rideDate));

    return { myRides: upcoming, pastRides: past };
  }, [rides]);

  const RideCard = ({ ride, variant = 'upcoming' }) => {
    const tone = variant === 'upcoming' ? 'green' : 'gray';
    const hasDriver = Boolean(ride?.driver);

    return (
      <motion.li
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition overflow-hidden"
      >
        {/* Top strip */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-gray-900">
                {ride?.pickup || 'Pickup'} <span className="text-gray-300">→</span> {ride?.dropoff || 'Dropoff'}
              </p>
              <p className="mt-1 text-xs text-gray-600">{fmtDateTime(ride?.rideDate)}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Pill tone={tone}>{variant === 'upcoming' ? 'Upcoming' : 'Past'}</Pill>
              <Pill tone="blue">{money(ride?.fare)}</Pill>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-500">Passenger</p>
              <p className="mt-1 font-semibold text-gray-900">{ride?.name || '—'}</p>
              <p className="mt-1 text-gray-700">{ride?.phone || '—'}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-500">Trip</p>
              <p className="mt-1 text-gray-800">
                <span className="font-semibold">From:</span> {ride?.pickup || '—'}
              </p>
              <p className="mt-1 text-gray-800">
                <span className="font-semibold">To:</span> {ride?.dropoff || '—'}
              </p>
            </div>
          </div>

          {/* Driver block */}
          <div className="mt-4">
            {hasDriver ? (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-indigo-700">Driver assigned</p>
                    <p className="mt-1 font-extrabold text-gray-900">{ride.driver?.name || '—'}</p>
                    <p className="mt-1 text-sm text-gray-800">{ride.driver?.phone || '—'}</p>
                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-semibold">Vehicle:</span> {ride.driver?.carModel || '—'}{' '}
                      {ride.driver?.taxiRegistration ? `(${ride.driver.taxiRegistration})` : ''}
                    </p>
                  </div>

                  {ride.driver?.phone ? (
                    <a
                      href={`tel:${ride.driver.phone}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
                    >
                      Call driver
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-700">Driver status</p>
                <p className="mt-1 text-sm text-gray-600">
                  Driver details will appear here once a driver is assigned.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>My Rides | Express Cabs Melbourne</title>
        <meta
          name="description"
          content="View and manage your upcoming and past taxi rides with Express Cabs. Stay updated on your scheduled trips."
        />
      </Helmet>

      {/* Hero header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-[340px] md:h-[420px] w-full bg-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
          <div className="absolute -top-32 -right-36 w-[460px] h-[460px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-44 -left-36 w-[460px] h-[460px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="text-white max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
                <span className="text-xs font-semibold tracking-wide text-white/90">ACCOUNT</span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-white/80">My rides</span>
              </div>

              <motion.h1 custom={1} variants={fadeUp} className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
                My Rides
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="mt-4 text-white/85 text-lg">
                Welcome, <span className="font-semibold">{user?.name || 'Guest'}</span>
                {user?.phone ? <span className="text-white/60"> • {user.phone}</span> : null}
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
                <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                  Upcoming & past history
                </span>
                <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                  Driver details when assigned
                </span>
              </motion.div>
            </div>

            <div className="md:ml-auto">
              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  onLogout();
                  setMode('passenger');
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
              >
                Logout
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 md:-mt-12 pb-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={softIn}
          className="rounded-3xl border border-gray-200 bg-white/90 backdrop-blur shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-6 md:p-10"
        >
          {/* Loading */}
          {loading ? (
            <div className="space-y-4">
              <div className="h-7 w-44 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-28 bg-gray-200 rounded-3xl animate-pulse" />
              <div className="h-28 bg-gray-200 rounded-3xl animate-pulse" />
            </div>
          ) : (
            <>
              {/* Upcoming */}
              <div className="mb-10">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Upcoming rides</h2>
                  <Pill tone="green">{myRides.length} total</Pill>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  Rides within the last 60 minutes are shown here as upcoming until completed.
                </p>

                <div className="mt-6">
                  {myRides.length > 0 ? (
                    <ul className="space-y-4">
                      {myRides.map((ride) => (
                        <RideCard key={ride.id} ride={ride} variant="upcoming" />
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
                      <p className="font-semibold text-gray-900">No upcoming rides</p>
                      <p className="mt-1 text-sm text-gray-600">
                        When you book a ride, it will appear here with driver details (once assigned).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Past */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Past rides</h2>
                  <Pill tone="gray">{pastRides.length} total</Pill>
                </div>

                <div className="mt-6">
                  {pastRides.length > 0 ? (
                    <ul className="space-y-4">
                      {pastRides.map((ride) => (
                        <RideCard key={ride.id} ride={ride} variant="past" />
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
                      <p className="font-semibold text-gray-900">No past rides</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Completed rides will appear here for easy reference.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default UserRidesScreen;
