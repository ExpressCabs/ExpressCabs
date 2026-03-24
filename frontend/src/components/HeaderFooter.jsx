import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhoneAlt, FaWhatsapp, FaMapMarkerAlt, FaEnvelope, FaClock } from 'react-icons/fa';
import logo from '/assets/images/logo.png';

const PRIMARY_PHONE = '+61488797233';
const WHATSAPP_LINK = 'https://wa.me/61482038902';
const EMAIL = 'bookmelbourneairporttaxis@gmail.com';
const ADDRESS = 'Melbourne, VIC';
const GOOGLE_MAPS_LINK = 'https://www.google.com/maps?q=Melbourne+VIC,+Australia';

export default function HeaderFooter({ mode, setMode, loggedInDriver, loggedInUser, setShowUserPopup }) {
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
  }, [loggedInDriver, loggedInUser]);

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
      <motion.header
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="fixed top-0 z-50 w-full"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mt-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] backdrop-blur-xl shadow-[0_18px_60px_-28px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3">
              <button
                onClick={() => handleSetMode('passenger')}
                className="flex items-center gap-2 text-left"
                aria-label="Go to homepage"
              >
                <img src={logo} alt="Prime Cabs Logo" className="h-9 w-auto" />
                <div className="leading-tight">
                  <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">Prime Cabs</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 -mt-0.5">Melbourne Airport Transfers</div>
                </div>
              </button>

              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.onClick}
                    className={[
                      'px-4 py-2 rounded-full text-sm font-semibold transition border',
                      isActive(item.key)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-[var(--surface-solid)] text-slate-700 border-[var(--border-soft)] hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                {loggedInUser ? (
                  <button
                    onClick={() => handleSetMode('myrides')}
                    className="hidden sm:inline-flex px-4 py-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-solid)] hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
                    aria-label="Open my rides"
                  >
                    Account
                  </button>
                ) : null}

                <button
                  className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--border-soft)] bg-[var(--surface-solid)] hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                >
                  <span className="text-xl leading-none">{menuOpen ? 'X' : '='}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
              />

              <motion.aside
                ref={drawerRef}
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed top-0 right-0 h-full w-[300px] bg-[var(--surface-solid)] shadow-2xl border-l border-[var(--border-soft)] md:hidden z-[60]"
                aria-label="Mobile navigation"
              >
                <div className="p-5 border-b border-[var(--border-soft)]">
                  <div className="flex items-center gap-2">
                    <img src={logo} alt="Prime Cabs Logo" className="h-8 w-auto" />
                    <div>
                      <div className="font-extrabold text-slate-900">Prime Cabs</div>
                      <div className="text-xs text-slate-500">Quick navigation</div>
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
                          : 'bg-[var(--surface-solid)] text-slate-800 border-[var(--border-soft)] hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  ))}

                  <div className="mt-6 rounded-2xl border border-[var(--border-soft)] bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-700">Need help now?</p>
                    <div className="mt-3 grid gap-2">
                      <a
                        href={`tel:${PRIMARY_PHONE}`}
                        data-track-location="header_call"
                        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
                      >
                        <FaPhoneAlt /> Call
                      </a>
                      <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-track-location="header_whatsapp"
                        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[var(--surface-solid)] border border-[var(--border-soft)] text-slate-900 font-semibold hover:bg-slate-100 transition"
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

      <div className="h-[86px] sm:h-[92px]" />
    </>
  );
}

export function SiteFooter({ setMode }) {
  const navigate = useNavigate();

  const footerLinks = [
    { label: 'Book Ride', onClick: () => { setMode?.('passenger'); navigate('/'); } },
    { label: 'Services', onClick: () => { setMode?.('services'); navigate('/services'); } },
    { label: 'Contact', onClick: () => { setMode?.('contact'); navigate('/contact'); } },
    { label: 'Airport Taxi Melbourne', onClick: () => navigate('/airport-taxi-melbourne') },
  ];

  return (
    <>
      <footer className="relative mt-16 border-t border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(211,84,0,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,116,144,0.14),_transparent_26%),linear-gradient(180deg,_#0f1115_0%,_#13161c_46%,_#0d1014_100%)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_90px_-34px_rgba(0,0,0,0.55)] overflow-hidden backdrop-blur">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr_1fr]">
              <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)]">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Prime Cabs Logo" className="h-11 w-auto" />
                  <div>
                    <p className="text-lg font-extrabold text-white">Prime Cabs</p>
                    <p className="text-sm text-white/70">Melbourne airport transfers, fixed-fare bookings, and 24/7 support.</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {['24/7 Bookings', 'WhatsApp Support', 'Airport Specialists'].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track-location="site_footer_whatsapp"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
                    aria-label="Add Prime Cabs on WhatsApp"
                  >
                    <FaWhatsapp /> Add on WhatsApp
                  </a>
                  <a
                    href={`tel:${PRIMARY_PHONE}`}
                    data-track-location="sticky_footer_call"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-white/12 bg-white/8 text-white font-semibold hover:bg-white/12 transition"
                    aria-label="Call Prime Cabs"
                  >
                    <FaPhoneAlt /> Call {PRIMARY_PHONE.replace('+61', '+61 ')}
                  </a>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/45">Quick Links</p>
                <div className="mt-5 grid gap-2">
                  {footerLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={link.onClick}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left text-sm font-semibold text-white/85 hover:bg-white/10 transition"
                    >
                      <span>{link.label}</span>
                      <span className="text-white/35">+</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/45">Find Us</p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <div className="flex items-start gap-3">
                      <FaMapMarkerAlt className="mt-1 text-white/70" />
                      <div>
                        <p className="text-sm font-semibold text-white">Address</p>
                        <p className="mt-1 text-sm text-white/70">{ADDRESS}</p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`mailto:${EMAIL}`}
                    className="rounded-2xl border border-white/10 bg-white/6 p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start gap-3">
                      <FaEnvelope className="mt-1 text-white/70" />
                      <div>
                        <p className="text-sm font-semibold text-white">Email</p>
                        <p className="mt-1 text-sm text-white/70 break-all">{EMAIL}</p>
                      </div>
                    </div>
                  </a>

                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <div className="flex items-start gap-3">
                      <FaClock className="mt-1 text-white/70" />
                      <div>
                        <p className="text-sm font-semibold text-white">Hours</p>
                        <p className="mt-1 text-sm text-white/70">Open 24/7 for bookings and support.</p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={GOOGLE_MAPS_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-white hover:bg-white/12 transition"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-black/15">
              <p className="text-sm text-white/68">Prime Cabs Melbourne. Reliable airport transfers and local taxi bookings.</p>
              <p className="text-xs text-white/45">No social profiles yet. WhatsApp is the fastest way to reach us.</p>
            </div>
          </div>
        </div>
      </footer>

      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-3">
          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] backdrop-blur-xl shadow-[0_18px_60px_-28px_rgba(0,0,0,0.3)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="hidden sm:block">
                <p className="text-sm font-extrabold text-slate-900">Need a quick airport transfer?</p>
                <p className="text-xs text-slate-600">Call or WhatsApp for an instant quote.</p>
              </div>

              <div className="flex w-full sm:w-auto gap-2">
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href={`tel:${PRIMARY_PHONE}`}
                  data-track-location="sticky_footer_call"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
                  aria-label="Call Prime Cabs"
                >
                  <FaPhoneAlt /> Call
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track-location="sticky_footer_whatsapp"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[var(--surface-solid)] border border-[var(--border-soft)] text-slate-900 font-semibold hover:bg-slate-100 transition"
                  aria-label="Add Prime Cabs on WhatsApp"
                >
                  <FaWhatsapp /> WhatsApp
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="h-[84px] sm:h-[92px]" />
    </>
  );
}
