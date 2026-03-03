import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

import ContactUs from './ContactUs';
import OurServices from './OurServices';
import BlogPreviewCarousel from '../components/BlogPreviewCarousel';
import BookingForm from '../components/BookingForm';

const heroImages = [
  '/assets/images/prime_cabs_landscape.avif',
  '/assets/images/prime_cabs_landscape2.avif',
  '/assets/images/prime_cabs_landscape3.avif',
  '/assets/images/prime_cabs_landscape4.avif',
];

const fleet = [
  { name: 'Sedan', seats: 4, image: '/assets/vehicles/sedan-modern.png' },
  { name: 'Luxury', seats: 4, image: '/assets/vehicles/luxury-modern.png' },
  { name: 'SUV', seats: 6, image: '/assets/vehicles/suv-modern.png' },
  { name: 'Van', seats: 11, image: '/assets/vehicles/van-modern.png' },
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
        {done ? 'OK' : '-'}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function AddressScreen({ loggedInUser }) {
  const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';

  const [heroIndex, setHeroIndex] = useState(0);
  const [fleetIndex, setFleetIndex] = useState(0);

  // ✅ NEW: step sync + clickable pill request
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepAllowed, setMaxStepAllowed] = useState(1);
  const [requestedStep, setRequestedStep] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const next = heroImages[(heroIndex + 1) % heroImages.length];
    const img = new Image();
    img.src = next;
  }, [heroIndex]);

  useEffect(() => {
    const fleetTimer = setInterval(() => {
      setFleetIndex((prev) => (prev + 1) % fleet.length);
    }, 2000);
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
                            "image": "https://www.primecabsmelbourne.com.au/logo.png",
                            "telephone": "+61488797233",
                            "address": {
                                "@type": "PostalAddress",
                                "streetAddress": "29 Bayswater Rd",
                                "addressLocality": "Croydon",
                                "addressRegion": "VIC",
                                "postalCode": "3136",
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
                        "logo": "https://www.primecabsmelbourne.com.au/assets/images/logo.png"
                    })}
                </script>

      </Helmet>


      <section className="relative min-h-[100vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={heroIndex}
            src={heroImages[heroIndex]}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            fetchpriority={heroIndex === 0 ? 'high' : 'auto'}
            loading={heroIndex === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/35" />
        <div className="absolute inset-0">
          <div className="absolute -top-36 -right-40 w-[520px] h-[520px] bg-[var(--brand)]/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-48 -left-40 w-[520px] h-[520px] bg-[var(--accent)]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 min-h-[100vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
            <motion.div
              className="lg:col-span-6 text-white"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={fadeUp}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
                <span className="text-xs font-semibold tracking-wide">MELBOURNE AIRPORT TRANSFERS</span>
              </div>

              <motion.h1 custom={1} variants={fadeUp} className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Book a reliable taxi in minutes.
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="mt-5 text-lg md:text-xl text-white/85 max-w-xl">
                Fixed fare airport transfers with professional drivers and comfortable vehicles.
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="mt-7 flex flex-wrap gap-2">
                {['24/7 Available', 'Fixed Upfront Quotes', 'Airport Specialists', 'Clean Vehicles'].map((t) => (
                  <span
                    key={t}
                    className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur"
                  >
                    {t}
                  </span>
                ))}
              </motion.div>

              {/* ✅ Clickable pills (synced to real progress) */}
              <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-wrap gap-2">
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
              </motion.div>
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
              Choose the right vehicle for your trip - from standard sedans to group vans.
            </p>
          </motion.div>

          <div className="mt-10">
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
              {fleet.map((car, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: 0.05 * index, ease: 'easeOut' }}
                  className="group bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition overflow-hidden"
                >
                  <div className="p-6">
                    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                      <img src={car.image} alt={car.name} className="mx-auto h-40 object-contain transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900">{car.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Seats up to {car.seats}</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white">Popular</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="block md:hidden bg-white p-6 rounded-3xl border border-gray-200 shadow-sm max-w-md mx-auto">
              <motion.div
                key={fleetIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                  <img src={fleet[fleetIndex].image} alt={fleet[fleetIndex].name} className="mx-auto h-40 object-contain" loading="lazy" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mt-5">{fleet[fleetIndex].name}</h3>
                <p className="text-sm text-gray-600 mt-1">Seats up to {fleet[fleetIndex].seats} passengers</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8">
        <BlogPreviewCarousel />
      </div>

      <div className="mt-8">
        <OurServices />
      </div>

      <ContactUs />
    </div>
  );
}

