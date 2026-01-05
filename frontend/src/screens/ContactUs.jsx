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
      </Helmet>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-6 pb-16 pt-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={softIn}
          className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 md:p-10"
        >
          {/* Areas we serve */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
            <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <FaTaxi className="text-gray-900" /> Areas we serve
            </h3>

            <p className="mt-3 text-gray-700">
              Prime Cabs provides professional Melbourne Airport transfers across major suburbs and destinations.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { name: 'Melbourne CBD', slug: 'melbourne-cbd' },
                { name: 'Croydon', slug: 'croydon' },
                { name: 'Ringwood', slug: 'ringwood' },
                { name: 'Box Hill', slug: 'box-hill' },
                { name: 'Doncaster', slug: 'doncaster' },
                { name: 'Glen Waverley', slug: 'glen-waverley' },
                { name: 'Richmond', slug: 'richmond' },
                { name: 'South Yarra', slug: 'south-yarra' },
              ].map((area) => (
                <a
                  key={area.slug}
                  href={`/airport-transfer/melbourne/${area.slug}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white transition"
                >
                  Melbourne Airport transfers from {area.name}
                </a>
              ))}
            </div>

            {/* ✅ NEW LINK ADDED HERE */}
            <div className="mt-4">
              <a
                href="/airport-transfer/melbourne"
                className="underline text-sm font-semibold text-gray-900 hover:text-black"
              >
                View all Melbourne suburbs →
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
