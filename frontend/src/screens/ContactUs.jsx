// ContactUs.jsx — Modern Webjet-style polish (logic unchanged)
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaTaxi } from 'react-icons/fa';

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

function TrustPill({ children }) {
  return (
    <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
      {children}
    </span>
  );
}

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    type: 'General Inquiry',
    callback: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Message sent successfully!');
        setFormData({ name: '', email: '', phone: '', message: '', type: 'General Inquiry', callback: false });
      } else {
        alert(`❌ Failed to send: ${data.message}`);
      }
    } catch (err) {
      console.error('Send error:', err);
      alert('❌ Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Contact Prime Cabs Melbourne | 24/7 Airport Taxi Booking & Support</title>
        <meta
          name="description"
          content="Contact Prime Cabs for reliable Melbourne airport taxi bookings. 24/7 support for Tullamarine, Avalon, and Melbourne suburbs. Fast response and affordable fixed fare quotes."
        />
        <link rel="canonical" href="https://www.primecabsmelbourne.com.au/contact" />
        {/* gtag script */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17249057389"></script>
        <script type="text/javascript">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17249057389');
          `}
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
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
              <span className="text-xs font-semibold tracking-wide text-white/90">CONTACT</span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/80">Prime Cabs Melbourne</span>
            </div>

            <motion.h1 custom={1} variants={fadeUp} className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">
              Contact Prime Cabs Melbourne
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mt-6 text-lg md:text-xl text-white/85 leading-relaxed">
              Reach out for 24/7 Melbourne airport transfers, ride bookings, or fare quotes. We’re here to help—fast,
              friendly and reliable.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap gap-2">
              <TrustPill>24/7 Support</TrustPill>
              <TrustPill>Fast Response</TrustPill>
              <TrustPill>Fixed Fare Quotes</TrustPill>
              <TrustPill>Airport Specialists</TrustPill>
            </motion.div>

            <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
              <a
                href="#contact-form"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-gray-900 font-semibold hover:bg-gray-100 transition"
              >
                Send a message
              </a>
              <a
                href="tel:+61488797233"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition"
              >
                Call now
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-6 -mt-14 md:-mt-16 pb-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={softIn}
          className="rounded-3xl border border-gray-200 bg-white/90 backdrop-blur shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-6 md:p-10"
        >
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Business info */}
            <motion.div className="lg:col-span-5" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Business information</h2>
              <p className="mt-2 text-gray-600">
                Prefer a quick call? We’re available 24/7 for bookings, quotes, and support.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <FaMapMarkerAlt className="text-gray-900 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">29 Bayswater Rd, Croydon VIC 3136</p>
                  </div>
                </div>

                <a
                  href="tel:+61488797233"
                  className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <FaPhoneAlt className="text-gray-900 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">+61 488 797 233</p>
                  </div>
                </a>

                <a
                  href="mailto:support@PrimeCabs.com.au"
                  className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <FaEnvelope className="text-gray-900 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">support@PrimeCabs.com.au</p>
                  </div>
                </a>

                <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <FaClock className="text-gray-900 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Hours</p>
                    <p className="text-sm text-gray-600">Open 24/7 – Every Day</p>
                  </div>
                </div>
              </div>

              {/* Small trust / CTA */}
              <div className="mt-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
                <p className="text-sm font-semibold text-indigo-700">Airport transfer today?</p>
                <p className="mt-1 text-lg font-extrabold text-gray-900">Call now for a quick quote.</p>
                <p className="mt-2 text-sm text-gray-700">Fast response • Fixed fare quotes • Melbourne-wide</p>
                <a
                  href="tel:+61488797233"
                  className="mt-5 inline-flex w-full items-center justify-center px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-black transition"
                >
                  Call +61 488 797 233
                </a>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              id="contact-form"
              className="lg:col-span-7"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Send us a message</h2>
                <p className="mt-2 text-gray-600">
                  Tell us what you need and we’ll get back to you as soon as possible.
                </p>

                {/* FORM LOGIC UNCHANGED */}
                <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-800">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Name"
                        className="mt-2 w-full h-11 border border-gray-200 px-3 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-800">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Your Email"
                        className="mt-2 w-full h-11 border border-gray-200 px-3 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-800">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Your Phone"
                        className="mt-2 w-full h-11 border border-gray-200 px-3 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-800">Message type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="mt-2 w-full h-11 border border-gray-200 px-3 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                      >
                        <option>General Inquiry</option>
                        <option>Booking Request</option>
                        <option>Complaint</option>
                        <option>Partnership</option>
                      </select>
                    </div>
                  </div>

                  <label className="text-sm text-gray-600 flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="callback"
                      checked={formData.callback}
                      onChange={handleChange}
                      className="h-4 w-4"
                    />
                    Request a callback
                  </label>

                  <div>
                    <label className="text-sm font-semibold text-gray-800">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Your message..."
                      className="mt-2 w-full border border-gray-200 px-3 py-3 rounded-xl bg-white text-sm min-h-[140px] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-11 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold transition disabled:opacity-70"
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>

                  <p className="text-xs text-gray-500 mt-1">
                    By submitting, you agree to be contacted regarding your enquiry.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Areas we serve */}
          <div className="mt-10 rounded-3xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
            <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <FaTaxi className="text-gray-900" /> Areas we serve
            </h3>
            <p className="mt-3 text-gray-700">
              Prime Cabs serves greater Melbourne: Tullamarine Airport, Avalon Airport, CBD, Croydon, Doncaster, Box Hill,
              Ringwood, Burwood, Richmond, South Yarra, Glen Waverley, and more.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {['Tullamarine Airport', 'Avalon Airport', 'Melbourne CBD', 'Eastern Suburbs', 'Hotels & Events', 'NDIS'].map(
                (t) => (
                  <span
                    key={t}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700"
                  >
                    {t}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Map */}
          <motion.div
            className="mt-10 rounded-3xl overflow-hidden border border-gray-200 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
              <p className="font-semibold">Find us</p>
              <a
                className="text-sm text-white/80 hover:text-white transition"
                href="https://www.google.com/maps?q=29+Bayswater+Rd,+Croydon+VIC+3136,+Australia"
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
            <iframe
              src="https://www.google.com/maps?q=29+Bayswater+Rd,+Croydon+VIC+3136,+Australia&output=embed"
              width="100%"
              height="340"
              allowFullScreen=""
              loading="lazy"
              className="border-0 w-full h-[340px]"
              title="Prime Cabs Melbourne Location Map"
            />
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
