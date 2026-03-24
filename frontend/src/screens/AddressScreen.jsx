import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

import BookingForm from '../components/BookingForm';

const ContactUs = lazy(() => import('./ContactUs'));
const BlogPreviewCarousel = lazy(() => import('../components/BlogPreviewCarousel'));

const HERO_DESKTOP_IMAGE = '/assets/images/home-hero-paid-pc.webp';
const HERO_MOBILE_IMAGE = '/assets/images/home-hero-paid-mob.webp';
const HERO_FALLBACK_IMAGE = '/assets/images/airport-hero.webp';

const fleet = [
  {
    name: 'Lexus ES300h',
    seats: 4,
    image: '/assets/vehicles/lexus300h.webp',
    tag: 'Executive sedan',
    summary: 'Quiet, refined airport travel for business trips and premium pickups.',
  },
  {
    name: 'Lexus 450HL',
    seats: 6,
    image: '/assets/vehicles/lexus450hl.webp',
    tag: 'Premium SUV',
    summary: 'Luxury space for families, luggage-heavy bookings, and longer transfers.',
  },
  {
    name: 'Toyota Kluger',
    seats: 6,
    image: '/assets/vehicles/toyota kluger.webp',
    tag: 'Family SUV',
    summary: 'Comfortable group travel with extra room for bags and airport gear.',
  },
  {
    name: 'Mercedes Van',
    seats: 11,
    image: '/assets/vehicles/van.webp',
    tag: 'Group transfer',
    summary: 'Ideal for larger groups, event travel, and airport shuttle-style bookings.',
  },
  {
    name: 'GLE300D',
    seats: 5,
    image: '/assets/vehicles/GLE300D.webp',
    tag: 'Luxury SUV',
    summary: 'A polished high-comfort option for travellers who want extra presence and space.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: 'easeOut' },
  }),
};

const softIn = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

function StepPill({ label, active, done, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        done
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : active
          ? 'bg-white border-gray-200 text-gray-900 shadow-sm'
          : 'bg-white/20 border-white/20 text-white/85 backdrop-blur',
      ].join(' ')}
      title={disabled ? 'Complete previous steps first' : `Go to ${label}`}
    >
      <span
        className={[
          'inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-extrabold',
          done ? 'bg-emerald-600 text-white' : active ? 'bg-gray-900 text-white' : 'bg-white/15 text-white',
        ].join(' ')}
        >
        {done ? '•' : '-'}
        </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function DeferredSection({ children, minHeight = 'min-h-[240px]' }) {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || shouldRender) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div ref={containerRef} className={shouldRender ? '' : minHeight}>
      {shouldRender ? (
        <Suspense
          fallback={
            <div className={`w-full ${minHeight} rounded-3xl border border-gray-200 bg-white/70 animate-pulse`} />
          }
        >
          {children}
        </Suspense>
      ) : null}
    </div>
  );
}

export default function AddressScreen({ loggedInUser }) {
  const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';

  const [fleetIndex, setFleetIndex] = useState(0);

  // ✅ NEW: step sync + clickable pill request
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepAllowed, setMaxStepAllowed] = useState(1);
  const [requestedStep, setRequestedStep] = useState(null);

  useEffect(() => {
    const fleetTimer = setInterval(() => {
      setFleetIndex((prev) => (prev + 1) % fleet.length);
    }, 4500);
    return () => clearInterval(fleetTimer);
  }, []);

  const stepMeta = useMemo(() => {
    const labels = [
      { key: 1, label: 'Book' },
      { key: 2, label: 'Vehicle' },
      { key: 3, label: 'Passenger' },
      ...(OTP_ENABLED ? [{ key: 4, label: 'Verify' }] : []),
    ];
    return labels;
  }, [OTP_ENABLED]);

  const handleProgressChange = ({ step, maxStepAllowed }) => {
    setCurrentStep(step);
    setMaxStepAllowed(maxStepAllowed);
  };

  const onPillClick = (targetKey) => {
    // request step change; BookingForm will accept only if allowed
    setRequestedStep(targetKey);
    // small reset so clicking same pill twice still triggers effect in child
    setTimeout(() => setRequestedStep(null), 0);
  };

  const activeFleet = fleet[fleetIndex];
  const prevFleet = () => setFleetIndex((prev) => (prev - 1 + fleet.length) % fleet.length);
  const nextFleet = () => setFleetIndex((prev) => (prev + 1) % fleet.length);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        {/* Primary SEO */}
        <title>Melbourne Airport Taxi | Fixed Fare Airport Transfers - Prime Cabs Melbourne</title>
        <meta
          name="description"
          content="Book a reliable Melbourne Airport taxi with Prime Cabs Melbourne. 24/7 airport transfers, fixed fares, no surge pricing, professional drivers. Instant online booking."
        />

        {/* Canonical */}
        <link rel="canonical" href="https://www.primecabsmelbourne.com.au/" />

        {/* Keywords (low weight but safe) */}
        <meta
          name="keywords"
          content="Melbourne airport taxi, airport transfers Melbourne, Melbourne airport cab, taxi to Melbourne airport, fixed fare airport taxi, Melbourne airport pickup"
        />

        {/* Open Graph (Facebook / WhatsApp / LinkedIn) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Melbourne Airport Taxi | Fixed Fare Transfers - Prime Cabs Melbourne" />
        <meta
          property="og:description"
          content="24/7 Melbourne Airport taxi service with fixed fares. Book online for fast, reliable airport transfers across Melbourne."
        />
        <meta property="og:url" content="https://www.primecabsmelbourne.com.au/" />
        <meta property="og:image" content="https://www.primecabsmelbourne.com.au/assets/images/prime-cabs-og.webp" />
        <meta property="og:site_name" content="Prime Cabs Melbourne" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Melbourne Airport Taxi | Prime Cabs Melbourne" />
        <meta
          name="twitter:description"
          content="Fixed fare Melbourne Airport taxi service. Book 24/7 airport transfers online with Prime Cabs Melbourne."
        />
        <meta name="twitter:image" content="https://www.primecabsmelbourne.com.au/assets/images/prime-cabs-og.webp" />

        {/* Geo / Local SEO */}
        <meta name="geo.region" content="AU-VIC" />
        <meta name="geo.placename" content="Melbourne" />
        <meta name="geo.position" content="-37.8136;144.9631" />
        <meta name="ICBM" content="-37.8136, 144.9631" />

        {/* Mobile / UX */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Crawling */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "serviceType": "Airport Transfer Taxi",
                        "name": "Melbourne Airport Taxi Transfers - Prime Cabs",
                        "provider": {
                            "@type": "LocalBusiness",
                            "name": "Prime Cabs Melbourne",
                            "url": "https://www.primecabsmelbourne.com.au",
                            "image": "https://www.primecabsmelbourne.com.au/favicon_io/android-chrome-512x512.png",
                            "telephone": "+61488797233",
                            "address": {
                                "@type": "PostalAddress",
                                "addressRegion": "VIC",
                                "addressCountry": "AU"
                            }
                        },
                        "areaServed": [
                            {
                                "@type": "Place",
                                "name": "Melbourne"
                            },
                            {
                                "@type": "Place",
                                "name": "Tullamarine Airport"
                            },
                            {
                                "@type": "Place",
                                "name": "Avalon Airport"
                            }
                        ],
                        "description": "24/7 airport transfer taxi service in Melbourne. Reliable pickups and drop-offs to and from Tullamarine and Avalon Airport. Choose from Sedans, SUVs, Vans and Luxury Cabs.",
                        "availableChannel": {
                            "@type": "ServiceChannel",
                            "serviceUrl": "https://www.primecabsmelbourne.com.au/airport-taxi-melbourne"
                        },
                        "hasOfferCatalog": {
                            "@type": "OfferCatalog",
                            "name": "Fleet Options",
                            "itemListElement": [
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Sedan",
                                    "description": "Standard 4-seater sedan for Melbourne airport transfers."
                                }
                                },
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Luxury",
                                    "description": "Premium luxury vehicle for comfortable airport transfers."
                                }
                                },
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "SUV",
                                    "description": "Spacious SUV ideal for families, luggage, and group travel."
                                }
                                },
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Van",
                                    "description": "High-capacity van for group airport transfers, up to 11 passengers."
                                }
                                }
                            ]
                            }

                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TaxiService",
                        "name": "Prime Cabs Melbourne",
                        "url": "https://www.primecabsmelbourne.com.au/",
                        "logo": "https://www.primecabsmelbourne.com.au/favicon_io/android-chrome-512x512.png"
                    })}
                </script>

      </Helmet>


      <section className="relative min-h-[100vh] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_#101114_0%,_#16181c_42%,_#242933_100%)]" />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 md:hidden"
          style={{
            backgroundImage: `url('${HERO_MOBILE_IMAGE}'), url('${HERO_FALLBACK_IMAGE}')`,
          }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat opacity-56 md:block"
          style={{
            backgroundImage: `url('${HERO_DESKTOP_IMAGE}'), url('${HERO_FALLBACK_IMAGE}')`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(211,84,0,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,116,144,0.12),_transparent_30%),linear-gradient(90deg,_rgba(10,11,14,0.76)_0%,_rgba(15,17,21,0.56)_42%,_rgba(15,17,21,0.34)_100%)]" />
        <div className="absolute inset-y-0 left-0 hidden w-[58%] lg:block bg-[radial-gradient(circle_at_left,_rgba(255,255,255,0.1),_transparent_58%)]" />
        <div className="absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-black/20" />
        </div>

        <div className="relative z-10 min-h-[100vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
            <motion.div
              className="lg:col-span-6 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                <span className="text-xs font-semibold tracking-wide">MELBOURNE AIRPORT TRANSFERS</span>
              </div>

              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Reach the airport on time, without the stress.
              </h1>

              <p className="mt-5 text-lg md:text-xl text-white/85 max-w-xl">
                Professional Melbourne airport transfers with fixed fares, clean vehicles, and quick online booking.
              </p>

              <div className="mt-6 max-w-xl rounded-3xl border border-white/12 bg-black/20 px-4 py-4 backdrop-blur-sm shadow-[0_24px_60px_-34px_rgba(0,0,0,0.75)]">
                <div className="flex flex-wrap gap-2">
                  {['Trusted by Melbourne travellers', 'No surprise surge pricing', 'Fast online booking'].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/82 md:text-[15px]">
                  Book in a few steps and travel with confidence, whether you are heading to the airport, arriving late, or planning an early pickup.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {['24/7 Available', 'Fixed Upfront Quotes', 'Airport Specialists', 'Clean Vehicles'].map((t) => (
                  <span
                    key={t}
                    className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* ✅ Clickable pills (synced to real progress) */}
              <div className="mt-10 flex flex-wrap gap-2">
                {stepMeta.map((s) => (
                  <StepPill
                    key={s.key}
                    label={s.label}
                    active={currentStep === s.key}
                    done={currentStep > s.key}
                    disabled={s.key > maxStepAllowed}
                    onClick={() => onPillClick(s.key)}
                  />
                ))}
              </div>
            </motion.div>

            <div className="lg:col-span-6">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
                variants={softIn}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-white/25 via-white/10 to-white/25 blur-xl" />
                <div className="relative rounded-[28px] border border-white/20 bg-white/85 backdrop-blur-xl shadow-[0_30px_90px_-30px_rgba(0,0,0,0.6)] p-4 md:p-7">
                  <BookingForm
                    embedded
                    loggedInUser={loggedInUser}
                    onProgressChange={handleProgressChange}
                    requestedStep={requestedStep}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* Fleet + other sections unchanged */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Our Fleet</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
              Browse the vehicles most often chosen for airport pickups, executive transfers, and group travel.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative mt-10 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]"
          >
            <div className="relative h-[420px] md:h-[500px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeFleet.name}
                  src={activeFleet.image}
                  alt={activeFleet.name}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.03)_0%,rgba(15,23,42,0.08)_100%)]" />
            </div>

            <div className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 md:px-8 md:py-6">
              <motion.div
                key={`${activeFleet.name}-details`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                      {activeFleet.tag}
                    </div>
                    <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-[2rem]">
                      {activeFleet.name}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
                      {activeFleet.summary}
                    </p>
                  </div>

                  <div className="flex gap-2 md:pt-1">
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Seats up to {activeFleet.seats}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Airport ready
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Professional transfer
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {fleet.map((car, index) => {
                      const active = index === fleetIndex;
                      return (
                        <button
                          key={car.name}
                          type="button"
                          onClick={() => setFleetIndex(index)}
                          className="group"
                          aria-label={`Show ${car.name}`}
                        >
                          <span
                            className={`block h-2.5 rounded-full transition-all ${
                              active ? 'w-10 bg-slate-900' : 'w-2.5 bg-slate-300 group-hover:bg-slate-500'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mt-8">
        <DeferredSection minHeight="min-h-[420px]">
          <BlogPreviewCarousel />
        </DeferredSection>
      </div>

      <DeferredSection minHeight="min-h-[840px]">
        <ContactUs showMap={false} />
      </DeferredSection>
    </div>
  );
}
