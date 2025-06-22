// ContactUs.jsx — Beautifully styled and functional contact form
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaTaxi } from 'react-icons/fa';

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
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 px-4 py-10">
            <Helmet>
                <title>Contact Prime Cabs Melbourne | 24/7 Airport Taxi Booking & Support</title>
                <meta name="description" content="Contact Prime Cabs for reliable Melbourne airport taxi bookings. 24/7 support for Tullamarine, Avalon, and Melbourne suburbs. Fast response and affordable fixed fare quotes." />
                <link rel="canonical" href="https://primecabsmelbourne.com.au/contact" />
                {/*  gtag script */}
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

            <motion.h1 className="text-4xl font-bold text-center text-blue-900 mb-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                Contact Prime Cabs Melbourne
            </motion.h1>

            <motion.p className="text-center text-gray-600 max-w-xl mx-auto mb-12 text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                Reach out for 24/7 Melbourne airport transfers, ride bookings, or fare quotes. We’re here to help—fast, friendly and reliable.
            </motion.p>

            <motion.div className="grid sm:grid-cols-2 gap-8 max-w-5xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.2 }}>
                <motion.div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h2 className="text-2xl font-semibold mb-5 text-blue-700">Business Information</h2>
                    <div className="space-y-3 text-gray-700">
                        <p className="flex items-center gap-3"><FaMapMarkerAlt className="text-blue-600" /> 29 Bayswater Rd, Croydon VIC 3136</p>
                        <p className="flex items-center gap-3"><FaPhoneAlt className="text-blue-600" /> +61 482 038 902</p>
                        <p className="flex items-center gap-3"><FaEnvelope className="text-blue-600" /> support@expresscabs.com.au</p>
                        <p className="flex items-center gap-3 mt-2"><FaClock className="text-blue-600" /> Open 24/7 – Every Day</p>
                    </div>
                </motion.div>

                <motion.div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <h2 className="text-2xl font-semibold mb-5 text-blue-700">Send Us a Message</h2>
                    <form className="grid gap-4" onSubmit={handleSubmit}>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500" required />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your Email" className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500" required />
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Your Phone" className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500" required />
                        <select name="type" value={formData.type} onChange={handleChange} className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500">
                            <option>General Inquiry</option>
                            <option>Booking Request</option>
                            <option>Complaint</option>
                            <option>Partnership</option>
                        </select>
                        <label className="text-sm text-gray-600">
                            <input type="checkbox" name="callback" checked={formData.callback} onChange={handleChange} className="mr-2" /> Request a callback
                        </label>
                        <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Your message..." className="border border-gray-300 p-3 rounded-md min-h-[120px] focus:ring-2 focus:ring-blue-500" required />
                        <button type="submit" disabled={submitting} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded-md transition">
                            {submitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </motion.div>
            </motion.div>

            <div className="max-w-5xl mx-auto mt-16 bg-white shadow-md rounded-2xl p-6">
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-2 text-blue-800"><FaTaxi /> Areas We Serve</h3>
                <p className="text-gray-700 text-base">
                    Prime Cabs serves greater Melbourne: Tullamarine Airport, Avalon Airport, CBD, Croydon, Doncaster, Box Hill, Ringwood, Burwood, Richmond, South Yarra, Glen Waverley, and more.
                </p>
            </div>

            <motion.div className="mt-12 max-w-5xl mx-auto rounded overflow-hidden shadow-xl" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
                <iframe
                    src="https://www.google.com/maps?q=29+Bayswater+Rd,+Croydon+VIC+3136,+Australia&output=embed"
                    width="100%"
                    height="300"
                    allowFullScreen=""
                    loading="lazy"
                    className="border-0 w-full h-[300px]"
                ></iframe>
            </motion.div>
        </div>
    );
}
