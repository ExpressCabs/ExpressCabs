// src/components/UserLoginScreen.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: 'easeOut' },
  }),
};

const softIn = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

function TrustPill({ children }) {
  return (
    <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
      {children}
    </span>
  );
}

const UserLoginScreen = ({ onLogin, onRegisterClick }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      alert('Please enter both phone and password');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Login failed');
        return;
      }

      onLogin(data.user); // ✅ keep exact behavior
    } catch (error) {
      console.error('Login error:', error);
      alert('Login request failed');
    }
  };

  return (
    <div className="app-min-h bg-white">
      <Helmet>
        <title>User Login | Express Cabs</title>
        <meta
          name="description"
          content="Login to your Express Cabs account to manage bookings and view ride history."
        />
      </Helmet>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-[420px] md:h-[520px] w-full bg-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
          <div className="absolute -top-32 -right-36 w-[460px] h-[460px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-44 -left-36 w-[460px] h-[460px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
              <span className="text-xs font-semibold tracking-wide text-white/90">ACCOUNT</span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/80">Login</span>
            </div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight"
            >
              Welcome back
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mt-4 text-white/85 text-lg max-w-2xl">
              Login to track your rides, save details, and book faster next time.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
              <TrustPill>Track rides</TrustPill>
              <TrustPill>Faster booking</TrustPill>
              <TrustPill>Secure account</TrustPill>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LOGIN CARD */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 md:-mt-12 pb-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={softIn}
          className="max-w-lg mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-gray-200/70 via-white/60 to-gray-200/70 blur-xl" />
            <div className="relative rounded-[28px] border border-gray-200 bg-white/90 backdrop-blur shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-6 md:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">User Login</h2>
                  <p className="mt-1 text-sm text-gray-600">Enter your phone and password to continue.</p>
                </div>
                <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                  24/7 Service
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {/* Phone */}
                <div>
                  <label className="text-sm font-semibold text-gray-800">Phone number</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-semibold text-gray-800">Password</label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3 pr-24 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Login */}
                <button
                  onClick={handleLogin}
                  className="w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                >
                  Login
                </button>

                {/* Register CTA (kept exact behavior) */}
                <div className="text-sm text-center text-gray-600">
                  Don’t have an account?{' '}
                  <button
                    onClick={onRegisterClick}
                    className="font-semibold text-gray-900 underline underline-offset-4"
                  >
                    Register
                  </button>
                </div>

                {/* Forgot password link (kept exact) */}
                <div className="text-sm text-center">
                  <a href="/user-forgot-password" className="text-gray-900 font-semibold underline underline-offset-4">
                    Forgot Password?
                  </a>
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                By logging in, you agree to be contacted regarding your bookings and account activity.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default UserLoginScreen;
