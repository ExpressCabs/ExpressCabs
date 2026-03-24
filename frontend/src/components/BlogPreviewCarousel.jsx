import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BlogPreviewCarousel() {
  const [blogs, setBlogs] = useState([]);
  const [blogIndex, setBlogIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const navigate = useNavigate();

  const goToBooking = () => {
    navigate('/', { state: { nextMode: 'passenger' } });
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/blogs`);
        if (res.data?.success) setBlogs(res.data.blogs || []);
      } catch (err) {
        console.error('Failed to fetch blogs', err);
      }
    };
    fetchBlogs();
  }, []);

  // Safe derived values (NO early return before hooks)
  const currentBlog = blogs?.[blogIndex];
  const images = useMemo(() => {
    if (!currentBlog) return [];
    return [currentBlog.image1, currentBlog.image2, currentBlog.image3].filter(Boolean);
  }, [currentBlog]);

  const safeImg = images[imageIndex] || images[0] || '';

  const dots = useMemo(() => (blogs || []).map((b) => b.slug), [blogs]);

  // Same timing/rotation logic (guarded safely)
  useEffect(() => {
    if (!blogs.length) return;
    if (!currentBlog) return;

    const imgs = images.length ? images : [];
    if (!imgs.length) return;

    const interval = setInterval(() => {
      if (imageIndex < imgs.length - 1) {
        setImageIndex((prev) => prev + 1);
      } else {
        setImageIndex(0);
        setBlogIndex((prev) => (prev + 1) % blogs.length);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [blogs.length, blogIndex, imageIndex, images, currentBlog, blogs]);

  // Navigation helpers (no hooks here)
  const goToBlog = (idx) => {
    setBlogIndex(idx);
    setImageIndex(0);
  };

  const goPrev = () => {
    if (!blogs.length) return;
    const next = (blogIndex - 1 + blogs.length) % blogs.length;
    goToBlog(next);
  };

  const goNext = () => {
    if (!blogs.length) return;
    const next = (blogIndex + 1) % blogs.length;
    goToBlog(next);
  };

  // ✅ Now it's safe to return conditionally (hooks already ran)
  if (!blogs.length || !currentBlog) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-gray-200 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
      <div className="relative h-[320px] md:h-[440px]">
        <AnimatePresence mode="wait">
          <motion.img
            key={safeImg || `${currentBlog.slug}-${imageIndex}`}
            src={safeImg}
            alt={currentBlog?.title || 'Blog preview'}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1.06 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60" />
        <div className="absolute -top-28 -right-28 w-[380px] h-[380px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-28 w-[420px] h-[420px] rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-6xl mx-auto px-5 md:px-8">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <motion.div
                  key={currentBlog.slug}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur text-white/90">
                    <span className="text-xs font-semibold tracking-wide">TRAVEL GUIDES</span>
                    <span className="text-white/40">•</span>
                    <span className="text-xs text-white/80">Latest blog</span>
                  </div>

                  <h2 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow">
                    {currentBlog.title}
                  </h2>

                  {currentBlog.excerpt ? (
                    <p className="mt-3 text-white/85 text-sm md:text-base max-w-2xl">
                      {currentBlog.excerpt}
                    </p>
                  ) : (
                    <p className="mt-3 text-white/85 text-sm md:text-base max-w-2xl">
                      Discover tips, airport transfer advice, and Melbourne travel ideas — updated regularly.
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/blog/${currentBlog.slug}`)}
                      className="h-11 px-5 rounded-full bg-white text-gray-900 font-semibold shadow hover:bg-gray-100 transition"
                    >
                      Read article
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/blogs')}
                      className="h-11 px-5 rounded-full bg-white/10 border border-white/20 text-white font-semibold backdrop-blur hover:bg-white/15 transition"
                    >
                      View all blogs
                    </motion.button>
                  </div>

                  {/* Image dots */}
                  <div className="mt-6 flex items-center gap-2">
                    {(images.length ? images : ['fallback']).map((_, idx) => (
                      <button
                        key={`${currentBlog.slug}-img-${idx}`}
                        type="button"
                        onClick={() => setImageIndex(idx)}
                        className="group"
                        aria-label={`Show image ${idx + 1}`}
                      >
                        <span
                          className={`block h-2.5 rounded-full transition-all ${
                            idx === imageIndex ? 'w-10 bg-white' : 'w-2.5 bg-white/40 group-hover:bg-white/70'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="md:col-span-5">
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur p-5 md:p-6 pb-10 md:pb-20 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)]"
                >
                  <p className="text-xs font-semibold text-white/80">Now showing</p>
                  <p className="mt-2 text-white font-extrabold text-lg leading-snug">
                    {currentBlog.title}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/85">
                        {blogIndex + 1} / {blogs.length}
                      </span>
                      <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/85">
                        Image {Math.min(imageIndex + 1, Math.max(images.length, 1))} / {Math.max(images.length, 1)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/15 transition"
                        aria-label="Previous blog"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/15 transition"
                        aria-label="Next blog"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {dots.slice(0, 8).map((slug, idx) => {
                      const active = idx === blogIndex;
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => goToBlog(idx)}
                          className={`h-2.5 rounded-full transition-all ${
                            active ? 'w-10 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'
                          }`}
                          aria-label={`Go to blog ${idx + 1}`}
                        />
                      );
                    })}
                    {dots.length > 8 ? <span className="text-xs text-white/70 ml-1">+{dots.length - 8}</span> : null}
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => navigate(`/blog/${currentBlog.slug}`)}
                      className="w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                    >
                      Learn more
                    </button>
                    <p className="mt-3 text-xs text-white/75 text-center">
                      Updated guides for airport transfers, suburbs, and Melbourne travel tips.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 py-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Explore more:</span> airport transfer tips, suburb guides, and travel advice.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="h-10 px-4 rounded-full border border-gray-200 bg-white font-semibold text-gray-900 hover:bg-gray-50 transition"
            >
              Browse blogs
            </button>
            <button
              type="button"
              onClick={goToBooking}
              className="h-10 px-4 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
            >
              Book a ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
