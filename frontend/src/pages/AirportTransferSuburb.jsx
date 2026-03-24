import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

import suburbs from "../data/melbourneSuburbs.json";
import BookingForm from "../components/BookingForm";
import AirportTransferCoreContent from "../components/AirportTransferCoreContent";
import NearbySuburbs from "../components/NearbySuburbs";
import { buildMeta } from "../lib/seo/buildMeta";
import { buildSuburbSeo } from "../lib/seo/suburbSeo";

const CANONICAL_BASE =
  import.meta.env.VITE_CANONICAL_BASE_URL ||
  "https://www.primecabsmelbourne.com.au";

// Lightweight inline icons (no extra dependencies)
function Icon({ children, className = "", ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

const Icons = {
  Route: (props) => (
    <Icon {...props}>
      <path
        d="M7 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M17 12.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9.2 10.6c2.1 1.3 3.5 1.9 5.6 1.9h1.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12.2 6.4h4.2a3 3 0 0 1 0 6H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Icon>
  ),
  Clock: (props) => (
    <Icon {...props}>
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7v5l3.2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  ),
  Plane: (props) => (
    <Icon {...props}>
      <path
        d="M21 16.5 13.2 13l-2.1 3.2 1.4 1.4-1.8 1.2-2.2-2.2-2.3 1a1.5 1.5 0 0 1-2-1.3v-.2c0-.6.3-1.2.9-1.5l2.8-1.5-2.8-2.8 1.2-1.8 3.9 2 3.2-2.1-3.5-7.8 2-1L16 7l3.1-1.3a1.7 1.7 0 0 1 2.4 1.6v.2c0 .7-.4 1.4-1.1 1.7L19 10l2 3.9-1.8 1.2-2.8-2.8-1.5 2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  ),
  Check: (props) => (
    <Icon {...props}>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  ),
  Chevron: (props) => (
    <Icon {...props}>
      <path
        d="m8 10 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  ),
};

export default function AirportTransferSuburb() {
  const { suburbSlug } = useParams();

  const bookingRef = useRef(null);

  // Support both route styles:
  // 1) /airport-transfer/croydon
  // 2) /airport-transfer/croydon-3136
  const suburb = useMemo(() => {
    return (
      suburbs.find((s) => s.slug === suburbSlug) ||
      suburbs.find((s) => `${s.slug}-${s.postcode}` === suburbSlug)
    );
  }, [suburbSlug]);

  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState(() => new Set());

  // Build origin/destination only when suburb exists
  const origin = useMemo(() => {
    if (!suburb) return "";
    return encodeURIComponent(`${suburb.name} VIC ${suburb.postcode}`);
  }, [suburb]);

  const destination = useMemo(
    () => encodeURIComponent("Melbourne Airport, VIC"),
    []
  );

  // Metrics fetch (distance + duration)
  useEffect(() => {
    if (!suburb) return;

    let cancelled = false;

    async function load() {
      try {
        setMetricsLoading(true);
        setMetricsError(null);
        setMetrics(null);

        const apiBase = import.meta.env.VITE_API_BASE_URL;
        if (!apiBase) {
          throw new Error("VITE_API_BASE_URL missing");
        }

        const res = await fetch(
          `${apiBase}/api/airport-metrics?suburb=${encodeURIComponent(
            suburb.name
          )}&postcode=${suburb.postcode}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Unable to load metrics");
        }

        if (!cancelled) setMetrics(data);
      } catch (e) {
        if (!cancelled) {
          setMetrics(null);
          setMetricsError(
            "Unable to load distance/ETA right now. Please try again."
          );
        }
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [suburb?.slug, suburb?.postcode]);

  const seo = suburb ? buildSuburbSeo(suburb) : null;
  const missingSuburbMeta = buildMeta({
    title: "Suburb Not Found | Prime Cabs Melbourne",
    description: "The requested airport transfer suburb page could not be found.",
    canonicalPath: "/airport-transfer/melbourne",
    robots: "noindex, nofollow",
  });

  if (!suburb) {
    return (
      <>
        <Helmet>
          <title>{missingSuburbMeta.title}</title>
          <meta name="description" content={missingSuburbMeta.description} />
          <meta name="robots" content={missingSuburbMeta.robots} />
          <link rel="canonical" href={missingSuburbMeta.canonical} />
        </Helmet>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold">Suburb not found</h1>
          <p className="mt-2 text-gray-600">
            Please check the URL or go back to the suburb list.
          </p>
          <Link
            to="/airport-transfer/melbourne"
            className="inline-block mt-6 px-5 py-3 rounded-lg bg-black text-white"
          >
            View all suburbs
          </Link>
        </div>
      </>
    );
  }

  // Fallbacks if metrics fails
  const distanceText =
    metrics?.distanceText ??
    (suburb.distanceKm ? `${suburb.distanceKm} km` : "—");

  const durationText =
    metrics?.durationText ?? (suburb.etaMin ? `${suburb.etaMin} mins` : "—");

  const canonicalUrl = seo.canonicalUrl;

  // FAQ schema JSON-LD
  const faqs = suburb?.content?.faqs || [];
  const faqSchema =
    Array.isArray(faqs) && faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
          })),
        }
      : null;

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;

  const scrollToBooking = () => {
    if (!bookingRef?.current) return;
    bookingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFaq = (idx) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const sectionAnim = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <Helmet>
  {(() => {
    const brand = "Prime Cabs Melbourne";
    const siteUrl = CANONICAL_BASE;
    const pageUrl = canonicalUrl;

    // Core SEO text
    const primaryKeyword = `Melbourne Airport transfers from ${suburb.name}`;
    const title =
      suburb?.seo?.title ||
      `${primaryKeyword} (${suburb.postcode}) | Fixed Price Taxi | ${brand}`;

    const description =
      suburb?.seo?.metaDescription ||
      `Book a reliable taxi for Melbourne Airport transfers from ${suburb.name} (${suburb.postcode}). Fixed prices, 24/7 service, flight tracking, professional drivers.`;

    // OG image (use your real image if you have one)
    const ogImage =
      suburb?.seo?.ogImage ||
      `${siteUrl}/images/og/airport-transfer.jpg`;

    // Optional: keywords (not used for ranking by Google, but harmless)
    const keywords = [
      `airport transfer ${suburb.name}`,
      `Melbourne airport taxi ${suburb.name}`,
      `Tullamarine transfers ${suburb.name}`,
      `fixed price airport transfers ${suburb.name}`,
      `taxi to Melbourne Airport from ${suburb.name}`,
    ].join(", ");

    // JSON-LD schemas
    const areaServedName = `${suburb.name} VIC ${suburb.postcode}`;
    const serviceName = `Airport Transfers from ${suburb.name} to Melbourne Airport`;

    // Keep LocalBusiness minimal (don’t invent phone/address)
    const localBusiness = {
      "@type": "LocalBusiness",
      name: brand,
      url: siteUrl,
      areaServed: [
        { "@type": "AdministrativeArea", name: "Melbourne VIC" },
        { "@type": "Place", name: areaServedName },
      ],
    };

    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: serviceName,
      serviceType: "Airport transfer",
      provider: localBusiness,
      areaServed: [{ "@type": "Place", name: areaServedName }],
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: pageUrl,
      },
    };

    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: pageUrl,
      inLanguage: "en-AU",
      isPartOf: {
        "@type": "WebSite",
        name: brand,
        url: siteUrl,
      },
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Airport Transfers",
          item: `${siteUrl}/airport-transfer/melbourne`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${suburb.name} ${suburb.postcode}`,
          item: pageUrl,
        },
      ],
    };

    const schemas = [
      webPageSchema,
      serviceSchema,
      breadcrumbSchema,
      ...(faqSchema ? [faqSchema] : []),
    ];

    return (
      <>
        {/* Core SEO */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />

        {/* Indexing / snippets */}
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <meta name="googlebot" content="index,follow" />

        {/* Optional */}
        <meta name="keywords" content={keywords} />
        <meta name="theme-color" content="#0b1220" />

        {/* Geo (helps local relevance; harmless) */}
        <meta name="geo.region" content="AU-VIC" />
        <meta name="geo.placename" content={`${suburb.name} VIC`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={brand} />
        <meta property="og:locale" content="en_AU" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta
          property="og:image:alt"
          content={`Airport transfers from ${suburb.name} to Melbourne Airport`}
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD */}
        {schemas.map((schema, idx) => (
          <script key={idx} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </>
    );
  })()}
</Helmet>


      {/* HERO / HEADLINE */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        {/* soft blobs */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white/90 text-sm backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Melbourne Airport Transfers • Trusted, on-time, 24/7
            </div>

            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-white">
              {suburb?.seo?.h1 || `Airport Transfers from ${suburb.name}`}
            </h1>

            <p className="mt-4 text-base md:text-lg text-white/80 max-w-3xl mx-auto">
              Book a reliable Melbourne Airport transfer from {suburb.name} ({suburb.postcode}).
              Fixed pricing, professional drivers, and flight tracking—so you can relax.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/90 text-sm backdrop-blur">
                <Icons.Check className="h-4 w-4" /> Fixed Pricing
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/90 text-sm backdrop-blur">
                <Icons.Check className="h-4 w-4" /> 24/7 Service
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/90 text-sm backdrop-blur">
                <Icons.Check className="h-4 w-4" /> Flight Tracking
              </span>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={scrollToBooking}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-900 px-6 py-3 font-semibold shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-[1.02]"
              >
                Get a quote / Book now
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-900/10 transition-transform duration-300 group-hover:translate-y-0.5">
                  <Icons.Chevron className="h-4 w-4" />
                </span>
              </button>

              <Link
                to="/airport-transfer/melbourne"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10"
              >
                View all suburbs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BOOKING FORM */}
      <div ref={bookingRef} className="relative -mt-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={sectionAnim}
          transition={{ duration: 0.45 }}
          className="max-w-6xl mx-auto px-4"
        >
          <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur shadow-xl shadow-slate-900/10">
            <div className="px-6 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-600">Instant quote • Secure booking</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">Book from {suburb.name} to Melbourne Airport</div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                  <Icons.Plane className="h-5 w-5" />
                  MEL (Tullamarine)
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-3">
              <BookingForm embedded />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Distance / ETA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionAnim}
        transition={{ duration: 0.45 }}
        className="max-w-6xl mx-auto px-6 py-12"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Distance to MEL</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Icons.Route className="h-5 w-5" />
              </span>
            </div>
            {metricsLoading ? (
              <div className="mt-3 h-8 w-28 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
              <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                {distanceText}
              </div>
            )}
            <div className="mt-2 text-sm text-slate-500">Fastest route varies by traffic</div>
          </div>

          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Typical travel time</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icons.Clock className="h-5 w-5" />
              </span>
            </div>
            {metricsLoading ? (
              <div className="mt-3 h-8 w-24 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
              <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                {durationText}
              </div>
            )}
            <div className="mt-2 text-sm text-slate-500">We track flights and plan pickups</div>
          </div>

          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Airport</div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icons.Plane className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Melbourne (MEL)
            </div>
            <div className="mt-2 text-sm text-slate-500">Tullamarine Airport</div>
          </div>
        </div>

        {metricsError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {metricsError}
          </div>
        ) : null}
      </motion.section>

      {/* Google Map */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionAnim}
        transition={{ duration: 0.45 }}
        className="max-w-6xl mx-auto px-6 pb-12"
      >
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/70">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Live directions</h2>
                <p className="mt-1 text-sm text-slate-600">
                  From {suburb.name} ({suburb.postcode}) to Melbourne Airport.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  <Icons.Route className="h-4 w-4" /> Route preview
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  <Icons.Clock className="h-4 w-4" /> Traffic-aware
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {!mapsKey ? (
              <div className="p-5 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900">
                Google Maps key missing. Add{" "}
                <code className="px-1 py-0.5 bg-yellow-100 rounded">
                  VITE_GOOGLE_MAPS_BROWSER_KEY
                </code>{" "}
                to your frontend .env file.
              </div>
            ) : (
              <iframe
                title={`Directions from ${suburb.name} to Melbourne Airport`}
                className="w-full h-[420px] rounded-2xl border border-slate-200"
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=${origin}&destination=${destination}&mode=driving`}
              />
            )}
          </div>
        </div>
      </motion.section>

      {/* 30% SUBURB-SPECIFIC CONTENT (from enriched JSON) */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionAnim}
        transition={{ duration: 0.45 }}
        className="max-w-6xl mx-auto px-6 pb-10"
      >
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Taxi & Airport Transfers in {suburb.name} ({suburb.postcode})
              </h2>
              <p className="mt-3 text-slate-600">
                Premium airport transfers with professional drivers, comfortable vehicles, and on-time pickups.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:max-w-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Pickup suburb</div>
                <div className="mt-1 font-semibold text-slate-900">{suburb.name}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Destination</div>
                <div className="mt-1 font-semibold text-slate-900">Melbourne Airport</div>
              </div>
            </div>
          </div>

          {suburb?.content?.intro ? (
            <p className="mt-6 text-slate-700 leading-relaxed">
              {suburb.content.intro}
            </p>
          ) : null}

          {suburb?.content?.localityNote ? (
            <p className="mt-4 text-slate-700 leading-relaxed">
              {suburb.content.localityNote}
            </p>
          ) : null}

          {Array.isArray(suburb?.content?.serviceHighlights) &&
          suburb.content.serviceHighlights.length ? (
            <ul className="mt-8 grid sm:grid-cols-2 gap-3 text-slate-700">
              {suburb.content.serviceHighlights.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icons.Check className="h-4 w-4" />
                  </span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {Array.isArray(faqs) && faqs.length ? (
            <div className="mt-12">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                  FAQs for {suburb.name}
                </h3>
                <p className="text-sm text-slate-600">
                  Tap a question to expand.
                </p>
              </div>

              <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 overflow-hidden">
                {faqs.map((f, idx) => {
                  const isOpen = openFaqs.has(idx);
                  const panelId = `faq-panel-${idx}`;
                  const buttonId = `faq-button-${idx}`;

                  return (
                    <div key={idx} className="bg-white">
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggleFaq(idx)}
                        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{f.q}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            Quick answer inside
                          </div>
                        </div>
                        <span
                          className={`mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          <Icons.Chevron className="h-5 w-5" />
                        </span>
                      </button>

                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className={`px-5 overflow-hidden transition-all duration-300 ${
                          isOpen ? "max-h-96 pb-5" : "max-h-0"
                        }`}
                      >
                        <p className="text-slate-700 leading-relaxed">
                          {f.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </motion.section>

      {/* 70% CONSISTENT CONTENT */}
      <AirportTransferCoreContent suburb={suburb} />

      {/* LINKS TO OTHER SUBURBS */}
      <NearbySuburbs suburb={suburb} />
    </>
  );
}
