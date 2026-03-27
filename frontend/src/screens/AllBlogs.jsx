import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatMelbourneDate } from '../lib/time';

function formatDate(dateLike) {
  if (!dateLike) return '';
  return formatMelbourneDate(dateLike);
}

function estimateReadTime(blog) {
  if (blog?.readingTimeMinutes) {
    return `${blog.readingTimeMinutes} min read`;
  }

  const content = [blog?.excerpt, blog?.subtitle].filter(Boolean).join(' ');
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 'Quick read';
  return `${Math.max(2, Math.round(words / 220))} min read`;
}

export default function AllBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchBlogs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/blogs`);
        if (!cancelled && res.data?.success) {
          setBlogs(Array.isArray(res.data.blogs) ? res.data.blogs : []);
        }
      } catch (error) {
        console.error('Failed to fetch blogs', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredBlog = blogs[0] || null;
  const remainingBlogs = useMemo(() => blogs.slice(1), [blogs]);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>All Blogs | Prime Cabs Melbourne</title>
        <meta
          name="description"
          content="Browse all Prime Cabs Melbourne blog articles, airport transfer guides, suburb travel tips, and booking advice."
        />
        <link rel="canonical" href="https://www.primecabsmelbourne.com.au/blogs" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="h-[420px] md:h-[520px] w-full bg-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-white" />
          <div className="absolute -top-32 -right-36 h-[460px] w-[460px] rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-44 -left-36 h-[460px] w-[460px] rounded-full bg-amber-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 md:pt-24">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
              <span className="text-xs font-semibold tracking-wide text-white/90">BLOGS</span>
              <span className="text-white/40">|</span>
              <span className="text-xs text-white/80">Prime Cabs Melbourne</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
              Airport transfer guides, suburb tips, and travel advice.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
              Browse the full Prime Cabs blog library for Melbourne airport transfer planning, booking tips, and local travel ideas.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/', { state: { nextMode: 'passenger' } })}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                Book a ride
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 520, behavior: 'smooth' })}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                Browse articles
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 -mt-10 md:-mt-14">
        <div className="rounded-[32px] border border-gray-200 bg-white/95 p-4 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.18)] backdrop-blur md:p-8">
          {loading ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-600">
              Loading blogs...
            </div>
          ) : null}

          {!loading && !blogs.length ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <h2 className="text-2xl font-extrabold text-gray-900">No blogs published yet</h2>
              <p className="mt-2 text-sm text-gray-600">New airport transfer guides and travel articles will appear here.</p>
            </div>
          ) : null}

          {!loading && featuredBlog ? (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-gray-900">
                  {featuredBlog.image1 ? (
                    <img
                      src={featuredBlog.image1}
                      alt={featuredBlog.title}
                      className="h-[280px] w-full object-cover md:h-[420px]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-[280px] w-full bg-gradient-to-br from-slate-800 to-slate-700 md:h-[420px]" />
                  )}
                </div>

                <div className="flex flex-col justify-center rounded-[28px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Featured Article</p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                    {featuredBlog.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600 md:text-[15px]">
                    {featuredBlog.excerpt || featuredBlog.subtitle || 'Read the latest airport transfer guide from Prime Cabs Melbourne.'}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    {formatDate(featuredBlog.publishedAt || featuredBlog.updatedAt) ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                        {formatDate(featuredBlog.publishedAt || featuredBlog.updatedAt)}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                      {estimateReadTime(featuredBlog)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                      {featuredBlog.authorName || 'Prime Cabs Melbourne'}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/blog/${featuredBlog.slug}`)}
                      className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black"
                    >
                      Read article
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/', { state: { nextMode: 'passenger' } })}
                      className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      Book a ride
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {remainingBlogs.map((blog) => (
                  <article
                    key={blog.id || blog.slug}
                    className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {blog.image1 ? (
                      <img
                        src={blog.image1}
                        alt={blog.title}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200" />
                    )}

                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {formatDate(blog.publishedAt || blog.updatedAt) ? (
                          <span>{formatDate(blog.publishedAt || blog.updatedAt)}</span>
                        ) : null}
                        <span>{estimateReadTime(blog)}</span>
                      </div>

                      <h3 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900">
                        {blog.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {blog.excerpt || blog.subtitle || 'Melbourne airport transfer guide from Prime Cabs Melbourne.'}
                      </p>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/blog/${blog.slug}`)}
                          className="inline-flex flex-1 items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                        >
                          Read
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/', { state: { nextMode: 'passenger' } })}
                          className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
