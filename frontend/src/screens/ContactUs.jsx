import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaTaxi } from 'react-icons/fa';

export default function ContactUs() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 px-4 py-10">
            <Helmet>
                <title>Contact Prime Cabs Melbourne | 24/7 Airport Taxi Booking & Support</title>
                <meta
                    name="description"
                    content="Contact Prime Cabs for reliable Melbourne airport taxi bookings. 24/7 support for Tullamarine, Avalon, and Melbourne suburbs. Fast response and affordable fixed fare quotes."
                />
                <link rel="canonical" href="https://primecabsmelbourne.com.au/contact" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            name: "Prime Cabs Melbourne",
                            address: {
                                "@type": "PostalAddress",
                                streetAddress: "29 Bayswater Rd",
                                addressLocality: "Croydon",
                                addressRegion: "VIC",
                                postalCode: "3136",
                                addressCountry: "AU",
                            },
                            telephone: "+61482038902",
                            email: "support@expresscabs.com.au",
                            url: "https://primecabsmelbourne.com.au/contact",
                            openingHours: ["Mo-Su 00:00-23:59"],
                            areaServed: "Melbourne, Victoria",
                            contactPoint: {
                                "@type": "ContactPoint",
                                contactType: "Customer Service",
                                telephone: "+61482038902"
                            }
                        }),
                    }}
                />
            </Helmet>

            <motion.h1
                className="text-3xl font-bold text-center text-blue-800 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Contact Prime Cabs Melbourne
            </motion.h1>

            <motion.p
                className="text-center text-gray-700 max-w-2xl mx-auto mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                Reach out to us for 24/7 Melbourne airport transfers, ride bookings, fare quotes, or any inquiries. We’re here to assist with your travel needs across Tullamarine, Avalon and the metro area.
            </motion.p>

            <motion.div
                className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ staggerChildren: 0.2 }}
            >
                <motion.div
                    className="bg-white p-6 rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h2 className="text-xl font-semibold mb-4">Business Details</h2>
                    <p className="flex items-center gap-2 mb-2 text-gray-700">
                        <FaMapMarkerAlt className="text-blue-600" /> 29 Bayswater Rd, Croydon VIC 3136
                    </p>
                    <p className="flex items-center gap-2 mb-2 text-gray-700">
                        <FaPhoneAlt className="text-blue-600" /> +61 482 038 902
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                        <FaEnvelope className="text-blue-600" /> support@expresscabs.com.au
                    </p>
                    <p className="flex items-center gap-2 mt-4 text-gray-700">
                        <FaClock className="text-blue-600" /> Open 24/7 – Every Day
                    </p>
                </motion.div>

                <motion.div
                    className="bg-white p-6 rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-xl font-semibold mb-4">Send Us a Message</h2>
                    <form className="grid gap-4">
                        <input type="text" placeholder="Name" className="border p-2 rounded" required />
                        <input type="email" placeholder="Email" className="border p-2 rounded" required />
                        <input type="tel" placeholder="Phone" className="border p-2 rounded" required />
                        <textarea
                            placeholder="Your message"
                            className="border p-2 rounded min-h-[100px]"
                            required
                        ></textarea>
                        <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700">
                            Send Message
                        </button>
                    </form>
                </motion.div>
            </motion.div>

            {/* Service Areas */}
            <div className="max-w-4xl mx-auto mt-12 bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-800"><FaTaxi /> Areas We Serve</h3>
                <p className="text-gray-700">
                    Prime Cabs offers taxi pickup and dropoff across the greater Melbourne area including Tullamarine Airport, Avalon Airport, CBD, Croydon, Doncaster, Box Hill, Ringwood, Burwood, Richmond, South Yarra, Glen Waverley, and more.
                </p>
            </div>

            {/* Embedded Map */}
            <motion.div
                className="mt-10 max-w-4xl mx-auto rounded overflow-hidden shadow-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
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
