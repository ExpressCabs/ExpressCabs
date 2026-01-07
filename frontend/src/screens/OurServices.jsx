import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const services = [
  { title: 'Airport Transfers', img: '/assets/services/service1.webp', desc: 'Fixed fare pickups to/from Melbourne Airport.' },
  { title: 'Hotel Transfers', img: '/assets/services/service2.webp', desc: 'Smooth hotel pickups across Melbourne.' },
  { title: 'NDIS Providers', img: '/assets/services/service3.webp', desc: 'Reliable transport for NDIS participants.' },
  { title: 'Wheelchair Accessible Vehicles', img: '/assets/services/service4.webp', desc: 'WAV options with comfortable boarding.' },
  { title: 'Private Tours', img: '/assets/services/service5.webp', desc: 'Flexible tours with a local driver.' },
  { title: 'Corporate Account Work', img: '/assets/services/service6.webp', desc: 'Professional service for business travel.' },
  { title: 'Winery Tours', img: '/assets/services/service7.webp', desc: 'Yarra Valley day trips and groups.' },
  { title: 'Wedding Transfers', img: '/assets/services/service8.webp', desc: 'Guest transfers and event coordination.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.06 * i, ease: 'easeOut' },
  }),
};

const softIn = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

function TrustPill({ children }) {
  return (
    <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
      {children}
    </span>
  );
}

export default function OurServices() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Our Taxi Services | Prime Cabs Melbourne</title>
        <meta
          name="description"
          content="Explore our Melbourne taxi services – airport transfers, hotel pickups, business rides, and long-distance travel. Professional drivers & fixed pricing."
        />
        <link rel="canonical" href="https://www.primecabsmelbourne.com.au/services" />
        <meta name="robots" content="index, follow" />

        {/* gtag script (kept) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17249057389"></script>
        <script type="text/javascript">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17249057389');
          `}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Airport Taxi",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Prime Cabs Melbourne",
              "url": "https://www.primecabsmelbourne.com.au",
              "telephone": "+61482038902",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "29 Bayswater Rd",
                "addressLocality": "Croydon",
                "addressRegion": "VIC",
                "postalCode": "3136",
                "addressCountry": "AU"
              }
            },
            "areaServed": "Melbourne, Australia",
            "description": "Reliable Melbourne airport taxi transfers to and from Tullamarine and Avalon airports."
          })}
        </script>
      </Helmet>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-[520px] md:h-[620px] w-full bg-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
          <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-48 -left-40 w-[520px] h-[520px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-20 md:pt-24 md:pb-24">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
              <span className="text-xs font-semibold tracking-wide text-white/90">SERVICES</span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/80">Prime Cabs Melbourne</span>
            </div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-white"
            >
              Transport services designed for comfort, reliability & time-saving.
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mt-6 text-lg md:text-xl text-white/85 leading-relaxed">
              From airport transfers to corporate bookings and private tours — choose a service that fits your trip.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap gap-2">
              <TrustPill>24/7 Available</TrustPill>
              <TrustPill>Fixed Upfront Quotes</TrustPill>
              <TrustPill>Professional Drivers</TrustPill>
              <TrustPill>Clean Vehicles</TrustPill>
            </motion.div>

            <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
              >
                Book now
              </a>
              <a
                href="#services-grid"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition"
              >
                Explore services
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section id="services-grid" className="max-w-7xl mx-auto px-4 -mt-12 md:-mt-16 pb-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={softIn}
          className="rounded-3xl border border-gray-200 bg-white/90 backdrop-blur shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-4 md:p-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Our services</h2>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Choose from popular transfer types and specialist travel options. Ideal for airport travel, events and day tours.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                Melbourne-wide
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                Group options
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                custom={index}
                variants={fadeUp}
                className="group rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={service.img}
                    alt={service.title}
                    className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-90" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-sm font-extrabold text-white">{service.title}</p>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{service.desc}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                      Learn more
                    </span>
                    <span className="text-xs text-gray-500">Prime Cabs</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mid CTA strip */}
          <div className="mt-10 rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-indigo-700">Need an airport transfer today?</p>
                <h3 className="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">
                  Get a quick quote and book instantly.
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  Upfront pricing, 24/7 availability and professional drivers across Melbourne.
                </p>
              </div>

              <a
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
              >
                Book your ride
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bottom CTA section */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Reliable transfers. Comfortable vehicles. Friendly service.
              </h3>
              <p className="mt-3 text-gray-600 max-w-2xl">
                Whether you’re travelling solo, with family or in a group — we’ll get you there safely and on time.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Airport specialists', 'Meet & greet available', 'Group vans', 'NDIS-friendly rides'].map((t) => (
                  <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="rounded-3xl bg-gray-900 text-white p-7 md:p-9 shadow-sm"
              >
                <p className="text-sm font-semibold text-white/80">Ready to book?</p>
                <p className="mt-2 text-xl md:text-2xl font-extrabold">Book your ride in minutes.</p>
                <p className="mt-2 text-sm text-white/75">
                  Fast quote • 24/7 availability • Melbourne-wide
                </p>
                <a
                  href="/"
                  className="mt-6 inline-flex w-full items-center justify-center px-6 py-3 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
                >
                  Book Now
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
