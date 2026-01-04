import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import BookingForm from "../BookingForm";
import Footer from "../Footer";

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.08 * i, ease: "easeOut" },
  }),
};

function formatDate(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });
}

function estimateReadTime(text) {
  const words = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  if (!words) return null;
  return Math.max(2, Math.round(words / 220));
}

function buildSections(blog) {
  const base = [];
  if (blog?.body1) base.push({ title: "Overview", body: blog.body1, image: blog.image1, alt: blog.image1Alt });
  if (blog?.body2) base.push({ title: "What to know", body: blog.body2, image: blog.image2, alt: blog.image2Alt });
  if (blog?.conclusion) base.push({ title: "Final thoughts", body: blog.conclusion, image: blog.image3, alt: blog.image3Alt });
  return base;
}

function ShareMini({ title }) {
  const encoded = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
  const text = encodeURIComponent(title || "Prime Cabs Melbourne");
  const items = [
    { label: "FB", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}` },
    { label: "IN", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wide text-gray-500">SHARE</span>
      {items.map((i) => (
        <a
          key={i.label}
          href={i.href}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition"
          aria-label={`Share on ${i.label}`}
        >
          {i.label}
        </a>
      ))}
    </div>
  );
}

export default function TemplateTwo({ blog }) {
  const published = formatDate(blog?.publishedAt || blog?.date);
  const readMins =
    blog?.readTime ||
    estimateReadTime([blog?.subtitle, blog?.body1, blog?.body2, blog?.conclusion].filter(Boolean).join(" "));
  const sections = useMemo(() => buildSections(blog), [blog]);

  return (
    <>
      <Helmet>
        <title>{blog.title} | Prime Cabs Melbourne</title>
        <meta name="description" content={blog.subtitle || "Reliable Melbourne Airport taxi service by Prime Cabs"} />
        <meta name="keywords" content="Melbourne Airport Taxi, Airport Transfers, Prime Cabs" />
        <link rel="canonical" href={`https://www.primecabsmelbourne.com.au/blog/${blog.slug}`} />

        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.subtitle} />
        <meta property="og:image" content={blog.image1} />
        <meta property="og:type" content="article" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blog.title,
            description: blog.subtitle,
            image: blog.image1,
            author: { "@type": "Organization", name: "Prime Cabs Melbourne" },
            datePublished: blog?.publishedAt || blog?.date,
          })}
        </script>
      </Helmet>

      <article className="bg-gradient-to-b from-gray-50 via-white to-white">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-6 pt-10">
          <div className="flex flex-wrap items-center gap-3">
            <a href="/blog" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition">
              Blog
            </a>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600">{blog?.category || "Travel & Transfers"}</span>

            <div className="ml-auto">
              <ShareMini title={blog?.title} />
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <motion.h1
                initial="hidden"
                animate="show"
                variants={fade}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900"
              >
                {blog.title}
              </motion.h1>

              {blog.subtitle ? (
                <motion.p
                  custom={1}
                  initial="hidden"
                  animate="show"
                  variants={fade}
                  className="mt-6 text-lg md:text-xl text-gray-700 leading-relaxed"
                >
                  {blog.subtitle}
                </motion.p>
              ) : null}

              <motion.div
                custom={2}
                initial="hidden"
                animate="show"
                variants={fade}
                className="mt-8 flex flex-wrap items-center gap-3 text-sm text-gray-600"
              >
                {published ? <span>{published}</span> : null}
                {published ? <span className="text-gray-300">•</span> : null}
                <span className="font-semibold text-gray-800">Prime Cabs Melbourne</span>
                {readMins ? (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>{readMins} min read</span>
                  </>
                ) : null}
              </motion.div>

              {/* Quick highlights */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="show"
                variants={fade}
                className="mt-10 grid sm:grid-cols-3 gap-3"
              >
                {["Professional drivers", "Clean vehicles", "Airport specialists"].map((t) => (
                  <div key={t} className="rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{t}</p>
                    <p className="text-xs text-gray-600 mt-1">Designed for comfort & reliability.</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hero image */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white"
              >
                {blog?.image1 ? (
                  <img
                    src={blog.image1}
                    alt={blog.image1Alt || blog.title}
                    className="w-full h-[260px] md:h-[360px] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-[260px] md:h-[360px] bg-gradient-to-br from-gray-200 to-gray-100" />
                )}
                <div className="p-5">
                  <p className="text-sm text-gray-700">
                    Want a stress-free airport transfer? Book in minutes — we’ll handle the rest.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Booking CTA (BookingForm unchanged) */}
        <div className="max-w-7xl mx-auto px-6 mt-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-3xl border border-gray-200 bg-white/90 backdrop-blur shadow-[0_24px_60px_-22px_rgba(0,0,0,0.22)] p-4 md:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">
                  Get your quote & book instantly
                </h3>
                <p className="text-sm text-gray-600 mt-1">Fast, secure, and designed for airport travel.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                  Upfront pricing
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                  24/7 available
                </span>
              </div>
            </div>

            <BookingForm />
          </motion.div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-14 md:py-16">
          <div className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:text-gray-700 prose-a:text-indigo-600">
            {sections.map((s, idx) => (
              <motion.section
                key={s.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                custom={idx}
                variants={fade}
                className="mt-10 first:mt-0"
              >
                <h2>{s.title}</h2>

                {s.image ? (
                  <figure className="my-8">
                    <img
                      src={s.image}
                      alt={s.alt || blog?.title}
                      className="rounded-2xl shadow-sm w-full h-[260px] md:h-[380px] object-cover"
                      loading="lazy"
                    />
                    {s.alt ? <figcaption className="mt-2 text-sm text-gray-500">{s.alt}</figcaption> : null}
                  </figure>
                ) : null}

                <p>{s.body}</p>

                {idx === 1 ? (
                  <div className="not-prose my-10 rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
                    <p className="text-sm font-semibold text-indigo-700">Traveller checklist</p>
                    <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                      {["Confirm terminal", "Add flight number", "Allow peak-hour buffer", "Keep phone reachable"].map(
                        (t) => (
                          <li key={t} className="flex gap-2 items-start">
                            <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-gray-900" />
                            <span>{t}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : null}
              </motion.section>
            ))}

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="not-prose mt-14"
            >
              <div className="rounded-3xl bg-gray-900 text-white p-7 md:p-9 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-extrabold">Ready when you are.</h3>
                    <p className="mt-2 text-white/80 text-sm">
                      Book your Melbourne Airport transfer with Prime Cabs — fast, reliable and comfortable.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const el = document.querySelector("form");
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="px-6 py-3 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
                  >
                    Book now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </article>

      <Footer />
    </>
  );
}
