import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const RideSuccessScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.state?.isGuest ?? false;

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/', {
        state: { nextMode: isGuest ? 'passenger' : 'myrides' },
      });
    }, 3000); // wait 3 seconds before redirect

    return () => clearTimeout(timeout);
  }, [isGuest, navigate]);

  return (
    <div className="app-min-h bg-white">
      <Helmet>
        <title>Thank You – Ride Booked | Express Cabs</title>
        <meta
          name="description"
          content="Your ride has been successfully booked with Express Cabs. We'll be in touch shortly with driver details."
        />
        <meta name="robots" content="noindex, nofollow" />

        {/* Global site tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17249057389"></script>

        {/* Google Ads conversion event for Booking-Form-Submitted */}
        <script type="text/javascript">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17249057389');
            gtag('event', 'conversion', {
              send_to: 'AW-17249057389/OwxRCP63nOAaEO30_qBA',
              value: 1.0,
              currency: 'AUD'
            });
          `}
        </script>
      </Helmet>

      {/* Premium success hero */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="h-[520px] w-full bg-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
          <div className="absolute -top-32 -right-36 w-[520px] h-[520px] bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-44 -left-36 w-[520px] h-[520px] bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="max-w-3xl text-white"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
              <span className="text-xs font-semibold tracking-wide text-white/90">BOOKING CONFIRMED</span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/80">Express Cabs</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55, ease: 'easeOut' }}
              className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight"
            >
              Ride booked successfully
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55, ease: 'easeOut' }}
              className="mt-4 text-white/85 text-lg max-w-2xl"
            >
              Thanks — we’ll confirm your booking shortly and share driver details when assigned.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.55, ease: 'easeOut' }}
              className="mt-6 flex flex-wrap gap-2"
            >
              <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                24/7 Service
              </span>
              <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                Airport Specialists
              </span>
              <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                Fast Confirmation
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Glass success card */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 md:-mt-12 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-gray-200/70 via-white/60 to-gray-200/70 blur-xl" />
            <div className="relative rounded-[28px] border border-gray-200 bg-white/90 backdrop-blur shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-7 md:p-10 text-center">
              {/* Animated check */}
              <motion.div
                initial={{ scale: 0.85, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl"
              >
                ✅
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}
                className="mt-5 text-2xl md:text-3xl font-extrabold text-gray-900"
              >
                Booking received
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55, ease: 'easeOut' }}
                className="mt-2 text-sm md:text-base text-gray-600"
              >
                {isGuest
                  ? "Redirecting you back to booking..."
                  : "Redirecting you to My Rides..."}
              </motion.p>

              {/* Progress bar */}
              <div className="mt-6 rounded-full bg-gray-100 border border-gray-200 overflow-hidden h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-full bg-gray-900"
                />
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    navigate('/', { state: { nextMode: isGuest ? 'passenger' : 'myrides' } })
                  }
                  className="h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                >
                  Continue now
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="h-11 rounded-xl border border-gray-200 bg-white font-semibold text-gray-900 hover:bg-gray-50 transition"
                >
                  Home
                </button>
              </div>

              <p className="mt-5 text-xs text-gray-500">
                If you need urgent assistance, contact us via call/WhatsApp from the bottom bar.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default RideSuccessScreen;
