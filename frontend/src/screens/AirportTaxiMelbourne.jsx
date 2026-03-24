import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaPhoneAlt,
  FaPlaneDeparture,
  FaShieldAlt,
  FaSuitcaseRolling,
  FaUserTie,
} from 'react-icons/fa';
import sedanImg from '/assets/vehicles/lexus300h.webp';
import suvImg from '/assets/vehicles/toyota kluger.webp';
import vanImg from '/assets/vehicles/van.webp';
import luxuryImg from '/assets/vehicles/GLE300D.webp';
import heroImg from '/assets/images/airport-hero.webp';
import BookingForm from '../components/BookingForm';

const fleet = [
  {
    name: 'Executive Sedan',
    seats: 4,
    image: sedanImg,
    tag: 'Most booked',
    summary: 'Fast, polished airport transfers for solo travellers, couples, and corporate pickups.',
    panelClass: 'border-slate-200 bg-white',
    imageWrapClass: 'border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]',
  },
  {
    name: 'Mercedes GLE300D',
    seats: 5,
    image: luxuryImg,
    tag: 'Premium ride',
    summary: 'A standout luxury airport option with premium comfort, stronger road presence, and a more refined arrival experience.',
    panelClass: 'border-amber-200 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] shadow-[0_22px_50px_-26px_rgba(217,119,6,0.35)]',
    imageWrapClass: 'border-amber-200 bg-[linear-gradient(180deg,#fff7e8_0%,#fde8c3_100%)]',
  },
  {
    name: 'SUV',
    seats: 6,
    image: suvImg,
    tag: 'Family favourite',
    summary: 'Extra cabin and luggage room for families, airport runs with gear, and flexible group travel.',
    panelClass: 'border-slate-200 bg-white',
    imageWrapClass: 'border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]',
  },
  {
    name: 'Group Van',
    seats: 11,
    image: vanImg,
    tag: 'Large groups',
    summary: 'Ideal for larger airport groups, events, and travellers who need genuine luggage capacity.',
    panelClass: 'border-slate-200 bg-white',
    imageWrapClass: 'border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]',
  },
];

const trustPoints = [
  '24/7 airport pickups and drop-offs',
  'Fixed-fare quotes before you confirm',
  'Flight-aware planning for airport runs',
  'Clean vehicles with professional drivers',
];

const serviceCards = [
  {
    icon: FaClock,
    title: 'Always timed for the airport',
    body: 'Early departures, late arrivals, and peak-hour travel are planned around real airport timing, not guesswork.',
  },
  {
    icon: FaShieldAlt,
    title: 'Clear, fixed-price quoting',
    body: 'We focus on upfront pricing so travellers can book with confidence instead of dealing with surge-style surprises.',
  },
  {
    icon: FaUserTie,
    title: 'Professional airport experience',
    body: 'Drivers, vehicle quality, and communication are designed to feel dependable from booking through arrival.',
  },
];

const routeHighlights = [
  'Melbourne CBD to Tullamarine',
  'Eastern suburbs to Melbourne Airport',
  'South East Melbourne airport transfers',
  'Avalon Airport private taxi bookings',
];

const faqs = [
  {
    q: 'Can I pre-book an airport taxi in Melbourne?',
    a: 'Yes. You can book ahead online for airport departures or arrivals, choose your vehicle, and lock in your trip before travel day.',
  },
  {
    q: 'Do you cover suburbs outside the CBD?',
    a: 'Yes. Prime Cabs covers Melbourne CBD, eastern suburbs, south east Melbourne, and wider metro airport transfer routes.',
  },
  {
    q: 'What vehicle should I choose for airport luggage?',
    a: 'Sedans work well for lighter travel, while SUVs and vans are better for families, extra bags, and larger airport groups.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: 'easeOut' },
  }),
};

export default function AirportTaxiMelbourne({ loggedInUser }) {
  const bookingRef = useRef(null);

  const serviceSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Airport Transfer Taxi',
      name: 'Melbourne Airport Taxi Transfers - Prime Cabs',
      provider: {
        '@type': 'LocalBusiness',
        name: 'Prime Cabs Melbourne',
        url: 'https://www.primecabsmelbourne.com.au',
        image: 'https://www.primecabsmelbourne.com.au/favicon_io/android-chrome-512x512.png',
        telephone: '+61482038902',
        address: {
          '@type': 'PostalAddress',
          addressRegion: 'VIC',
          addressCountry: 'AU',
        },
      },
      areaServed: [
        { '@type': 'Place', name: 'Melbourne' },
        { '@type': 'Place', name: 'Tullamarine Airport' },
        { '@type': 'Place', name: 'Avalon Airport' },
      ],
      description:
        '24/7 airport transfer taxi service in Melbourne with fixed-fare quoting, professional drivers, and vehicle options for solo travellers, families, and groups.',
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: 'https://www.primecabsmelbourne.com.au/airport-taxi-melbourne',
      },
    }),
    []
  );

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    }),
    []
  );

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#f4f7fb_42%,#ffffff_100%)] pb-32 text-slate-900">
      <Helmet>
        <title>Melbourne Airport Taxi Transfers | Prime Cabs Melbourne</title>
        <meta
          name="description"
          content="Book a premium Melbourne airport taxi with fixed-fare quoting, 24/7 airport transfers, professional drivers, and vehicle options for solo travellers, families, and groups."
        />
        <link rel="canonical" href="https://www.primecabsmelbourne.com.au/airport-taxi-melbourne" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Melbourne Airport Taxi Transfers | Prime Cabs Melbourne" />
        <meta
          property="og:description"
          content="Premium Melbourne airport transfers with fixed quotes, clean vehicles, and dependable airport-focused service."
        />
        <meta property="og:image" content="https://www.primecabsmelbourne.com.au/assets/images/airport-hero.webp" />
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(8,12,18,0.92)_0%,rgba(10,16,24,0.74)_42%,rgba(9,14,22,0.88)_100%)]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url('${heroImg}')` }}
        />
        <div className="absolute -left-28 top-10 h-80 w-80 rounded-full bg-amber-500/18 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-500/16 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#fffdf8]" />

        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-4 pb-24 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-6">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 backdrop-blur">
              <FaPlaneDeparture className="text-[12px] text-amber-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                Melbourne Airport Transfers
              </span>
            </div>

            <motion.h1 custom={1} variants={fadeUp} className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              Airport taxi booking that feels premium before the ride even starts.
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-8 text-white/82 md:text-xl">
              Prime Cabs Melbourne helps travellers get to Tullamarine and Avalon with fixed-fare confidence, clean vehicles, and a smoother airport experience from quote to drop-off.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="mt-7 flex flex-wrap gap-2">
              {trustPoints.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur"
                >
                  <FaCheckCircle className="text-[13px] text-emerald-300" />
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scrollToBooking}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#f59e0b_0%,#d97706_100%)] px-6 py-3.5 text-base font-semibold text-slate-950 shadow-[0_20px_50px_-20px_rgba(245,158,11,0.7)] transition hover:scale-[1.01]"
              >
                Get instant quote
                <FaArrowRight className="text-[13px]" />
              </button>

              <a
                href="tel:+61488797233"
                data-track-location="airport_page_call"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/14"
              >
                <FaPhoneAlt className="text-[13px]" />
                Call now
              </a>
            </motion.div>

            <motion.div
              custom={5}
              variants={fadeUp}
              className="mt-10 grid max-w-2xl gap-3 rounded-[28px] border border-white/10 bg-white/8 p-4 backdrop-blur md:grid-cols-3"
            >
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Airport focus</p>
                <p className="mt-2 text-lg font-bold text-white">Tullamarine + Avalon</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Vehicle range</p>
                <p className="mt-2 text-lg font-bold text-white">Sedans to group vans</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Booking style</p>
                <p className="mt-2 text-lg font-bold text-white">Fast, fixed, reliable</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            ref={bookingRef}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[34px] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.26),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.18),transparent_26%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(247,249,252,0.96)_100%)] p-4 shadow-[0_34px_90px_-28px_rgba(0,0,0,0.55)] md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Airport Booking</p>
                  <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                    Quote and book in minutes
                  </h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  24/7 airport support
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#fff7e8_0%,#fff1cf_100%)] px-4 py-3 shadow-[0_16px_35px_-24px_rgba(217,119,6,0.45)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-800">
                  Quote Calculation
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Enter your pickup and dropoff in the booking flow below to calculate your quote.
                </p>
              </div>

              <BookingForm embedded loggedInUser={loggedInUser} />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_25px_70px_-28px_rgba(15,23,42,0.3)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why travellers switch</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Start your airport trip with clear timing and a clear quote.
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              When you are booking an airport taxi, you want the important details handled early: the right vehicle, reliable timing, and a quote you can trust before you confirm.
            </p>

            <div className="mt-6 grid gap-4">
              {serviceCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    custom={index + 1}
                    variants={fadeUp}
                    className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Icon />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="rounded-[30px] border border-slate-200 bg-[linear-gradient(140deg,#0f172a_0%,#111827_46%,#1e293b_100%)] p-6 text-white shadow-[0_30px_90px_-34px_rgba(15,23,42,0.55)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Airport travel cues</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Built around real airport customer needs</h2>
              </div>
              <div className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/82">
                Melbourne-wide coverage
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <div className="flex items-center gap-3">
                  <FaSuitcaseRolling className="text-amber-300" />
                  <p className="text-lg font-bold">Vehicle fit matters</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Families, business travellers, and luggage-heavy trips need the right vehicle from the start, not after booking confusion.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <div className="flex items-center gap-3">
                  <FaPlaneDeparture className="text-emerald-300" />
                  <p className="text-lg font-bold">Airport timing first</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  Your airport transfer is presented around timing, reliability, and smooth booking so you can move quickly and book with confidence.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-black/12 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">Popular airport request patterns</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {routeHighlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/88">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToBooking}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Start booking
              </button>
              <Link
                to="/airport-transfer/melbourne"
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-3 font-semibold text-white transition hover:bg-white/12"
              >
                Explore suburb routes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="rounded-[34px] border border-slate-200 bg-[linear-gradient(180deg,#fffefb_0%,#ffffff_100%)] p-6 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.24)] md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fleet Selection</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Vehicles that match the airport trip, not just the booking.
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
                A strong airport page should reassure customers immediately that solo trips, premium arrivals, family transfers, and larger airport groups are all covered.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Clean vehicles. Professional presentation.
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {fleet.map((vehicle, index) => (
              <motion.div
                key={vehicle.name}
                custom={index + 1}
                variants={fadeUp}
                className={`group rounded-[28px] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${vehicle.panelClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                    {vehicle.tag}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    Up to {vehicle.seats}
                  </span>
                </div>

                <div className={`mt-5 overflow-hidden rounded-[24px] border ${vehicle.imageWrapClass}`}>
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                  />
                </div>

                <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">{vehicle.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{vehicle.summary}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_0.95fr] lg:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Coverage</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Melbourne airport coverage that feels broad and dependable.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-slate-600">
            We service Melbourne CBD, eastern suburbs, south east corridors, family-heavy residential areas, and airport routes where punctuality matters most. The page now presents this as a premium airport service, not just a generic transport listing.
          </p>

          <div className="mt-6 rounded-[28px] border border-slate-200 overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d805202.0266101739!2d144.39515249695575!3d-37.9696510536865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad646b5d2ba4df7%3A0x4045675218ccd90!2sMelbourne%20VIC!5e0!3m2!1sen!2sau!4v1749944188822!5m2!1sen!2sau"
              className="h-[360px] w-full border-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Melbourne airport transfer coverage map"
            />
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Questions travellers ask</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Faster answers before customers commit.
          </h2>

          <div className="mt-6 space-y-3">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-bold text-slate-900">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#1f2937_100%)] p-8 text-white shadow-[0_34px_90px_-34px_rgba(15,23,42,0.55)] md:p-10"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Final CTA</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                Make the airport leg of the trip feel sorted now.
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-white/78">
                Enter your pickup and dropoff, choose your vehicle, and lock in your Melbourne airport transfer in just a few steps.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scrollToBooking}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Book airport transfer
              </button>
              <a
                href="tel:+61488797233"
                data-track-location="airport_page_bottom_call"
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-6 py-3 font-semibold text-white transition hover:bg-white/12"
              >
                Speak to us now
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <p className="sr-only">
        Prime Cabs Melbourne provides fixed-fare airport taxi transfers for Tullamarine and Avalon Airport, including sedans, SUVs, luxury vehicles, and group vans for Melbourne travellers.
      </p>
    </div>
  );
}
