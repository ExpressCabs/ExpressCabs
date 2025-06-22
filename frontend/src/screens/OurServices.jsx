import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const services = [
    {
        title: '✈️ Airport Transfers',
        description:
            '24/7 pickup and dropoff to Tullamarine and Avalon Airports. Real-time ride tracking, flight monitoring, and professional drivers ensure a seamless experience.',
    },
    {
        title: '🧳 Luggage-Friendly Vehicles',
        description:
            'Choose from Standard, Luxury, SUV, and Van options with ample luggage capacity. Ideal for solo travelers, families, and group airport transfers.',
    },
    {
        title: '🚖 On-Demand & Scheduled Rides',
        description:
            'Book a ride instantly or schedule in advance using our web or mobile app. Get fare estimates and transparent pricing with no hidden fees.',
    },
    {
        title: '🌙 Late Night & Holiday Coverage',
        description:
            'Operating 24/7 including weekends and public holidays. High-occupancy and safety-compliant vehicles available for larger groups.',
    },
];

export default function OurServices() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 px-4 py-10">
            <Helmet>
                <title>Our Taxi Services | Prime Cabs Melbourne</title>
                <meta name="description" content="Explore our Melbourne taxi services – airport transfers, hotel pickups, business rides, and long-distance travel. Professional drivers & fixed pricing." />
                <link rel="canonical" href="https://primecabsmelbourne.com.au/services" />
                <meta name="robots" content="index, follow" />
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
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "serviceType": "Airport Taxi",
                        "provider": {
                            "@type": "LocalBusiness",
                            "name": "Prime Cabs Melbourne",
                            "url": "https://primecabsmelbourne.com.au",
                            "telephone": "+61482038902",
                            "address": {
                                "@type": "PostalAddress",
                                "streetAddress": "29 Bayswater Rd",
                                "addressLocality": "Croydon",
                                "addressRegion": "VIC",
                                "postalCode": "3136",
                                "addressCountry": "AU"
                            }
                        },
                        "areaServed": "Melbourne, Australia",
                        "description": "Reliable Melbourne airport taxi transfers to and from Tullamarine and Avalon airports."
                    })}
                </script>
            </Helmet>

            <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">
                Our Services
            </h1>
            <p className="text-center text-gray-700 max-w-2xl mx-auto mb-10">
                At Express Cabs, we specialize in reliable, on-time transportation services to and from Melbourne’s airports.
                Whether you’re traveling for business or leisure, we’ve got the perfect ride for you.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {services.map((service, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                        <h2 className="text-xl font-semibold text-blue-700 mb-2">
                            {service.title}
                        </h2>
                        <p className="text-gray-700">{service.description}</p>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-10">
                <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/"
                    className="bg-green-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transition"
                >
                    Book Your Airport Ride Now
                </motion.a>
            </div>
        </div>
    );
}
