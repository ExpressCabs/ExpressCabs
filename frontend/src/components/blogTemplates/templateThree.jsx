import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import BookingForm from "../BookingForm";
import Footer from "../Footer";

const fadeUp = {
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
  if (blog?.body1) base.push({ id: "overview", title: "Overview", body: blog.body1, image: blog.image1, alt: blog.image1Alt });
  if (blog?.body2) base.push({ id: "details", title: "Key Details", body: blog.body2, image: blog.image2, alt: blog.image2Alt });
  if (blog?.conclusion) base.push({ id: "conclusion", title: "Conclusion", body: blog.conclusion, image: blog.image3, alt: blog.image3Alt });
  return base;
}

function ShareBar({ title }) {
  const encoded = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
  const text = encodeURIComponent(title || "Prime Cabs Melbourne");
  const links = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold tracking-wide text-gray-500">SHARE</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition"
          aria-label={`Share on ${l.label}`}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

export default function TemplateThree({ blog }) {
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

      {/* Header strip */}
      <div className="bg-gradient-to-b from-gray-50 via-white to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-10">
          <div className="flex flex-wrap items-center gap-3">
            <a href="/blog" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition">
              Blog
            </a>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600">{blog?.category || "Airport Transfers"}</span>
            <span className="ml-auto inline-flex gap-2">
              {readMins ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200">
                  {readMins} min read
                </span>
              ) : null}
              {published ? (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200">
                  {published}
                </span>
              ) : null}
            </span>
          </div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900"
          >
            {blog.title}
          </motion.h1>

          {blog.subtitle ? (
            <motion.p
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mt-5 text-lg md:text-xl text-gray-700 max-w-3xl leading-relaxed"
            >
              {blog.subtitle}
            </motion.p>
          ) : null}

          <motion.div custom={2} initial="hidden" animate="show" variants={fadeUp} className="mt-7">
            <ShareBar title={blog?.title} />
          </motion.div>
        </div>
      </div>

      <article className="max-w-7xl mx-auto px-6 py-14 md:py-16 grid lg:grid-cols-12 gap-10">
        {/* CONTENT */}
        <div className="lg:col-span-8">
          <div className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:text-gray-700 prose-a:text-indigo-600">
            {sections.map((s, idx) => (
              <motion.section
                key={s.id}
                id={s.id}
                className="scroll-mt-28 mt-12 first:mt-0"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                custom={idx}
                variants={fadeUp}
              >
                <h2>{s.title}</h2>

                {s.image ? (
                  <figure className="my-8">
                    <img
                      src={s.image}
                      alt={s.alt || blog?.title}
                      className="rounded-2xl shadow-sm w-full h-[280px] md:h-[420px] object-cover"
                      loading="lazy"
                    />
                    {s.alt ? <figcaption className="mt-2 text-sm text-gray-500">{s.alt}</figcaption> : null}
                  </figure>
                ) : null}

                <p>{s.body}</p>

                {idx === 0 ? (
                  <div className="not-prose my-10 rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                    <p className="text-sm font-semibold text-gray-900">Pro tip</p>
                    <p className="mt-2 text-sm text-gray-700">
                      If you’re travelling with family or extra luggage, select a larger vehicle to stay comfortable.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Maxi options", "Child seats", "Meet & greet"].map((t) => (
                        <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.section>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-14 rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-7 md:p-9"
          >
            <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">Book your transfer in minutes</h3>
            <p className="mt-2 text-sm text-gray-700">
              Quick booking, upfront quotes, and friendly local drivers — Prime Cabs Melbourne.
            </p>
            <button
              onClick={() => {
                const el = document.querySelector("form");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-5 px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
            >
              Get a quote
            </button>
          </motion.div>
        </div>

        {/* STICKY BOOKING (BookingForm unchanged) + TOC */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="rounded-1.5xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-[0_24px_60px_-22px_rgba(0,0,0,0.22)] p-2"
            >
              <h3 className="text-xl font-extrabold mb-2 text-center text-gray-900">Book Your Airport Transfer</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Fast quote • 24/7 availability
              </p>
              <BookingForm />
            </motion.div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
              <p className="text-sm font-extrabold text-gray-900">In this article</p>
              <div className="mt-4 space-y-2">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="block text-sm text-gray-700 hover:text-indigo-700 transition">
                    {s.title}
                  </a>
                ))}
              </div>

              <div className="mt-6">
                <ShareBar title={blog?.title} />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-900 text-white shadow-sm p-6">
              <p className="text-sm font-semibold text-white/80">Popular routes</p>
              <div className="mt-3 space-y-2 text-sm">
                {["Melbourne CBD ↔ Airport", "St Kilda ↔ Airport", "Docklands ↔ Airport", "Southbank ↔ Airport"].map((r) => (
                  <div key={r} className="flex items-center justify-between gap-3">
                    <span className="text-white/90">{r}</span>
                    <button
                      onClick={() => {
                        const el = document.querySelector("form");
                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-gray-900 hover:bg-gray-100 transition"
                    >
                      Quote
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </article>

      <Footer />
    </>
  );
}
