import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import logo from '/assets/images/logo.png';

const HeaderFooter = ({ mode, setMode, loggedInDriver, loggedInUser, setShowUserPopup }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  const handleSetMode = (newMode) => {
    setMode(newMode);
    navigate('/');
  };

  const goTo = (path, newMode) => {
    if (newMode) setMode(newMode);
    navigate(path);
  };

  const navItems = useMemo(() => {
    return [
      {
        key: 'passenger',
        label: 'Book Ride',
        onClick: () => handleSetMode('passenger'),
      },
      {
        key: loggedInDriver ? 'driverdashboard' : 'driverlogin',
        label: `Driver (${loggedInDriver ? 'Dashboard' : 'Login'})`,
        onClick: () => handleSetMode(loggedInDriver ? 'driverdashboard' : 'driverlogin'),
      },
      {
        key: 'services',
        label: 'Services',
        onClick: () => goTo('/services', 'services'),
      },
      {
        key: 'contact',
        label: 'Contact Us',
        onClick: () => goTo('/contact', 'contact'),
      },
      loggedInUser
        ? {
            key: 'myrides',
            label: 'My Rides',
            onClick: () => handleSetMode('myrides'),
          }
        : {
            key: 'userlogin',
            label: 'Login / Register',
            onClick: () => handleSetMode('userlogin'),
          },
    ];
  }, [loggedInDriver, loggedInUser, mode]);

  // Close drawer on outside click / ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onPointerDown = (e) => {
      if (!menuOpen) return;
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  const isActive = (key) => mode === key;

  return (
    <>
      {/* HEADER */}
      <motion.header
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="fixed top-0 z-50 w-full"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_-28px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3">
              {/* Brand */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-left"
                aria-label="Go to homepage"
              >
                <img src={logo} alt="Prime Cabs Logo" className="h-9 w-auto" />
                <div className="leading-tight">
                  <div className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">
                    Prime Cabs
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-500 -mt-0.5">
                    Melbourne Airport Transfers
                  </div>
                </div>
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className={[
                      'px-4 py-2 rounded-full text-sm font-semibold transition border',
                      isActive(item.key)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                {/* Optional: user popup trigger if you use it elsewhere */}
                {loggedInUser && typeof setShowUserPopup === 'function' ? (
                  <button
                    onClick={() => setShowUserPopup(true)}
                    className="hidden sm:inline-flex px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition"
                    aria-label="Open user menu"
                  >
                    Account
                  </button>
                ) : null}

                {/* Mobile menu button */}
                <button
                  className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                >
                  <span className="text-xl leading-none">{menuOpen ? '✕' : '☰'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/35 backdrop-blur-[2px] md:hidden"
              />

              <motion.aside
                ref={drawerRef}
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed top-0 right-0 h-full w-[300px] bg-white shadow-2xl border-l border-gray-200 md:hidden z-[60]"
                aria-label="Mobile navigation"
              >
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <img src={logo} alt="Prime Cabs Logo" className="h-8 w-auto" />
                    <div>
                      <div className="font-extrabold text-gray-900">Prime Cabs</div>
                      <div className="text-xs text-gray-500">Quick navigation</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        item.onClick();
                        setMenuOpen(false);
                      }}
                      className={[
                        'w-full text-left px-4 py-3 rounded-2xl border text-sm font-semibold transition',
                        isActive(item.key)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  ))}

                  <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-700">Need help now?</p>
                    <div className="mt-3 grid gap-2">
                      <a
                        href="tel:+61488797233"
                        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
                      >
                        <FaPhoneAlt /> Call
                      </a>
                      <a
                        href="https://wa.me/61482038902"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition"
                      >
                        <FaWhatsapp /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-[86px] sm:h-[92px]" />

      {/* FOOTER CTA BAR (modern floating) */}
      <motion.footer
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-3">
          <div className="rounded-2xl border border-gray-200 bg-white/85 backdrop-blur-xl shadow-[0_18px_60px_-28px_rgba(0,0,0,0.35)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="hidden sm:block">
                <p className="text-sm font-extrabold text-gray-900">Need a quick airport transfer?</p>
                <p className="text-xs text-gray-600">Call or WhatsApp for an instant quote.</p>
              </div>

              <div className="flex w-full sm:w-auto gap-2">
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href="tel:+61488797233"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
                  aria-label="Call Prime Cabs"
                >
                  <FaPhoneAlt /> Call
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://wa.me/61482038902"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-white border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition"
                  aria-label="WhatsApp Prime Cabs"
                >
                  <FaWhatsapp /> WhatsApp
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Bottom spacer so page content isn't hidden behind CTA bar */}
      <div className="h-[84px] sm:h-[92px]" />
    </>
  );
};

export default HeaderFooter;
