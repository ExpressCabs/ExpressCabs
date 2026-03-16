import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const RideSuccessScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const topRef = useRef(null);
  const isGuest = location.state?.isGuest ?? false;

  useEffect(() => {
    if (!topRef.current) return;

    topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/', {
        state: { nextMode: isGuest ? 'passenger' : 'myrides' },
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isGuest, navigate]);

  return (
    <div ref={topRef} className="min-h-screen scroll-mt-28 bg-white">
      <Helmet>
        <title>Thank You - Ride Booked | Express Cabs</title>
        <meta
          name="description"
          content="Your ride has been successfully booked with Express Cabs. We'll be in touch shortly with driver details."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-[520px] w-full bg-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
          <div className="absolute -right-36 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-44 -left-36 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="max-w-3xl text-white"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
              <span className="text-xs font-semibold tracking-wide text-white/90">BOOKING CONFIRMED</span>
              <span className="text-xs text-white/80">Express Cabs</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55, ease: 'easeOut' }}
              className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl"
            >
              Ride booked successfully
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55, ease: 'easeOut' }}
              className="mt-4 max-w-2xl text-lg text-white/85"
            >
              Thanks, we will confirm your booking shortly and share driver details when assigned.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.55, ease: 'easeOut' }}
              className="mt-6 flex flex-wrap gap-2"
            >
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/90 backdrop-blur md:text-sm">
                24/7 Service
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/90 backdrop-blur md:text-sm">
                Airport Specialists
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/90 backdrop-blur md:text-sm">
                Fast Confirmation
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="-mt-10 mx-auto max-w-7xl px-6 pb-16 md:-mt-12">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto max-w-xl"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-gray-200/70 via-white/60 to-gray-200/70 blur-xl" />
            <div className="relative rounded-[28px] border border-gray-200 bg-white/90 p-7 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] backdrop-blur md:p-10">
              <motion.div
                initial={{ scale: 0.85, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-2xl"
              >
                OK
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}
                className="mt-5 text-2xl font-extrabold text-gray-900 md:text-3xl"
              >
                Booking received
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55, ease: 'easeOut' }}
                className="mt-2 text-sm text-gray-600 md:text-base"
              >
                {isGuest ? 'Redirecting you back to booking...' : 'Redirecting you to My Rides...'}
              </motion.p>

              <div className="mt-6 h-3 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-full bg-gray-900"
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() =>
                    navigate('/', { state: { nextMode: isGuest ? 'passenger' : 'myrides' } })
                  }
                  className="h-11 rounded-xl bg-gray-900 font-semibold text-white transition hover:bg-black"
                >
                  Continue now
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="h-11 rounded-xl border border-gray-200 bg-white font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Home
                </button>
              </div>

              <p className="mt-5 text-xs text-gray-500">
                If you need urgent assistance, contact us via call or WhatsApp from the bottom bar.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default RideSuccessScreen;
