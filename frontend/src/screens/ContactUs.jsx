import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

export default function ContactUs() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 px-4 py-10">
            <Helmet>
                <title>Contact Express Cabs – Melbourne Airport Taxi & Ride Booking</title>
                <meta
                    name="description"
                    content="Need a reliable airport taxi in Melbourne? Contact Express Cabs 24/7 for fast, affordable rides to and from Tullamarine and Avalon airports."
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            name: "Express Cabs",
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
                            url: "https://expresscabs.com.au/contact",
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
                Contact Express Cabs
            </motion.h1>

            <motion.p
                className="text-center text-gray-700 max-w-2xl mx-auto mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                Need a reliable airport taxi in Melbourne? We’re here to help 24/7 with fast, affordable rides.
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
                </motion.div>

                <motion.div
                    className="bg-white p-6 rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-xl font-semibold mb-4">Contact Form</h2>
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
