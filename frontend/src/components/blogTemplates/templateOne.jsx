import React, { useMemo } from "react";
import { motion } from "framer-motion";
import BookingForm from "../BookingForm";
import Footer from "../Footer";
import { Helmet } from "react-helmet-async";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: "easeOut" },
  }),
};

const floatIn = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

function formatDate(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });
}

function slugToText(s = "") {
  return String(s).replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
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
  const sections = [];

  if (blog?.body1) sections.push({ id: "intro", title: "Overview", content: blog.body1, image: blog.image1, alt: blog.image1Alt });
  if (blog?.body2) sections.push({ id: "details", title: "Key Details", content: blog.body2, image: blog.image2, alt: blog.image2Alt });
  if (blog?.conclusion) sections.push({ id: "wrap-up", title: "Conclusion", content: blog.conclusion, image: blog.image3, alt: blog.image3Alt });

  // If a blog has custom headings array in future:
  // blog.sections = [{title, body, image, alt}]
  if (Array.isArray(blog?.sections) && blog.sections.length) {
    return blog.sections.map((s, idx) => ({
      id: s.id || `section-${idx + 1}`,
      title: s.title || `Section ${idx + 1}`,
      content: s.body || "",
      image: s.image,
      alt: s.alt,
    }));
  }

  return sections;
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

function TrustPills() {
  const items = ["24/7 Airport Transfers", "Fixed Upfront Quotes", "Professional Drivers", "Instant Booking"];
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function TemplateOne({ blog }) {
  const published = formatDate(blog?.publishedAt || blog?.date);
  const readMins = blog?.readTime || estimateReadTime([blog?.subtitle, blog?.body1, blog?.body2, blog?.conclusion].filter(Boolean).join(" "));
  const category = blog?.category || "Travel Tips";
  const sections = useMemo(() => buildSections(blog), [blog]);

  return (
    <>
      <Helmet>
        <title>{blog.title} | Prime Cabs Melbourne</title>
        <meta
          name="description"
          content={blog.subtitle || "Reliable Melbourne Airport taxi service by Prime Cabs"}
        />
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

      {/* HERO (modern cover style) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="h-[520px] md:h-[620px] w-full bg-gray-900"
            style={{
              backgroundImage: blog?.image1 ? `url(${blog.image1})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
          <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-48 -left-40 w-[520px] h-[520px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 md:pt-24 md:pb-32">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-white/85">
              <a href="/blog" className="text-xs md:text-sm hover:text-white transition">
                Blog
              </a>
              <span className="text-white/40">/</span>
              <span className="text-xs md:text-sm">{slugToText(blog?.slug)}</span>

              <span className="ml-auto inline-flex items-center gap-2">
                <span className="text-[11px] md:text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur">
                  {category}
                </span>
                {readMins ? (
                  <span className="text-[11px] md:text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur">
                    {readMins} min read
                  </span>
                ) : null}
              </span>
            </div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-white"
            >
              {blog.title}
            </motion.h1>

            {blog.subtitle ? (
              <motion.p
                custom={2}
                variants={fadeUp}
                className="mt-6 text-lg md:text-xl text-white/85 leading-relaxed"
              >
                {blog.subtitle}
              </motion.p>
            ) : null}

            <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3 text-white/80">
              {published ? <span className="text-sm">{published}</span> : null}
              {blog?.author ? (
                <>
                  <span className="text-white/35">•</span>
                  <span className="text-sm">By {blog.author}</span>
                </>
              ) : null}
              <span className="text-white/35">•</span>
              <span className="text-sm">Prime Cabs Melbourne</span>
            </motion.div>

            <TrustPills />
          </motion.div>
        </div>
      </section>

      {/* BOOKING (kept as-is, wrapped only) */}
      <div className="max-w-6xl mx-auto px-6 -mt-20 md:-mt-24 relative z-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={floatIn}
          className="bg-white/85 backdrop-blur-xl border border-gray-200 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] rounded-3xl p-6 md:p-10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">Book Your Melbourne Airport Taxi</h3>
              <p className="text-sm text-gray-600 mt-1">
                Fast quotes • Meet & greet options • Comfortable vehicles
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                No hidden fees
              </span>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                24/7 support
              </span>
            </div>
          </div>

          <BookingForm />
        </motion.div>
      </div>

      {/* BODY */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Main */}
          <div className="lg:col-span-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:text-gray-700 prose-a:text-indigo-600"
            >
              {sections.map((s, idx) => (
                <motion.div key={s.id} custom={idx} variants={fadeUp} className="scroll-mt-28" id={s.id}>
                  <h2>{s.title}</h2>

                  {s.image ? (
                    <figure className="my-8">
                      <img
                        src={s.image}
                        alt={s.alt || blog?.title}
                        className="rounded-2xl shadow-xl w-full h-[280px] md:h-[420px] object-cover"
                        loading="lazy"
                      />
                      {(s.alt || blog?.image1Alt) ? (
                        <figcaption className="mt-2 text-sm text-gray-500">{s.alt || blog?.image1Alt}</figcaption>
                      ) : null}
                    </figure>
                  ) : null}

                  <p>{s.content}</p>

                  {/* Callout block after first section */}
                  {idx === 0 ? (
                    <div className="not-prose my-10 p-6 rounded-2xl border bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div>
                          <p className="text-sm font-semibold text-indigo-700">Quick tip</p>
                          <p className="text-gray-800 mt-1 font-medium">
                            Pre-book your airport pickup to lock in availability during peak hours.
                          </p>
                          <p className="text-gray-600 text-sm mt-1">
                            Flight delays? No worries — add your flight number and we’ll track it.
                          </p>
                        </div>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.querySelector("form");
                            el?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="inline-flex justify-center px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-black transition"
                        >
                          Jump to booking
                        </a>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ))}

              {/* Closing CTA */}
              <motion.div custom={sections.length + 1} variants={fadeUp} className="not-prose mt-14">
                <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-7 md:p-9">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">
                        Need a reliable airport transfer today?
                      </h3>
                      <p className="text-gray-600 mt-2">
                        Book in minutes with Prime Cabs Melbourne — professional drivers and clean vehicles.
                      </p>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.querySelector("form");
                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex justify-center px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                    >
                      Book now
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right rail */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6"
              >
                <p className="text-sm font-extrabold text-gray-900">In this article</p>
                <div className="mt-4 space-y-2">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-sm text-gray-700 hover:text-indigo-700 transition"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
                <div className="mt-6">
                  <ShareBar title={blog?.title} />
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-900 to-black text-white shadow-sm p-6"
              >
                <p className="text-sm font-semibold text-white/80">Customer favourite</p>
                <p className="mt-2 text-lg font-extrabold">Melbourne Airport Transfers</p>
                <p className="mt-2 text-sm text-white/75">
                  Smooth pickups, spacious luggage room, and friendly service — every time.
                </p>
                <button
                  onClick={() => {
                    const el = document.querySelector("form");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="mt-5 w-full px-5 py-2.5 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
                >
                  Get a quote
                </button>
              </motion.div>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </>
  );
}
