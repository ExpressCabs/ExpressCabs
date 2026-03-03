// src/components/UserRegisterScreen.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

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

const UserRegisterScreen = ({ onBackToLogin }) => {
  const location = useLocation();
  const initialName = location.state?.name || '';
  const initialPhone = location.state?.phone || '';
  const initialEmail = location.state?.email || '';

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Registration failed');
        return;
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Create Account | Express Cabs</title>
        <meta
          name="description"
          content="Create an Express Cabs account to book faster and track your rides."
        />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://www.primecabsmelbourne.com.au/" />
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
              <span className="text-xs text-white/80">Register</span>
            </div>

            <motion.h1 custom={1} variants={fadeUp} className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
              Create your account
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mt-4 text-white/85 text-lg max-w-2xl">
              Register once to book faster next time and view your ride history in one place.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
              <TrustPill>Track rides</TrustPill>
              <TrustPill>Faster booking</TrustPill>
              <TrustPill>Secure account</TrustPill>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CARD */}
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
              {success ? (
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl">
                    🎉
                  </div>
                  <h2 className="mt-5 text-2xl font-extrabold text-gray-900">Registration Successful!</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    You can now log in to track your rides.
                  </p>

                  <button
                    onClick={onBackToLogin}
                    className="mt-6 w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                  >
                    Go to Login
                  </button>

                  <p className="mt-4 text-xs text-gray-500">
                    If you need help, contact support and we’ll assist quickly.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-900">Register</h2>
                      <p className="mt-1 text-sm text-gray-600">Enter your details to create your account.</p>
                    </div>
                    <span className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                      24/7 Service
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-800">Full name</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-2 w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                      />
                    </div>

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

                    <div>
                      <label className="text-sm font-semibold text-gray-800">Email (optional)</label>
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2 w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-800">Password</label>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2 w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Tip: Use at least 8 characters and mix letters & numbers.
                      </p>
                    </div>

                    <button
                      onClick={handleRegister}
                      className="w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                    >
                      Register
                    </button>

                    <p className="text-sm text-center text-gray-600">
                      Already have an account?{' '}
                      <button
                        onClick={onBackToLogin}
                        className="font-semibold text-gray-900 underline underline-offset-4"
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default UserRegisterScreen;
