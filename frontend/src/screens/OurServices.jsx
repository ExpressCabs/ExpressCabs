import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const services = [
    { title: 'Airport Transfers', img: '/assets/services/service1.webp' },
    { title: 'Hotel Transfers', img: '/assets/services/service2.webp' },
    { title: 'NDIS Providers', img: '/assets/services/service3.webp' },
    { title: 'Wheelchair Accessible Vehicles', img: '/assets/services/service4.webp' },
    { title: 'Private Tours', img: '/assets/services/service5.webp' },
    { title: 'Corporate Account Work', img: '/assets/services/service6.webp' },
    { title: 'Winery Tours', img: '/assets/services/service7.webp' },
    { title: 'Wedding Transfers', img: '/assets/services/service8.webp' },
];

export default function OurServices() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 px-4 py-12">
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

            <h1 className="text-4xl font-bold text-center text-blue-800 mb-6">Our Services</h1>
            <p className="text-center text-gray-700 max-w-2xl mx-auto mb-10">
                At Prime Cabs Melbourne, we offer professional and reliable transport including airport pickups, private tours, corporate rides, and NDIS-compliant vehicles.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {services.map((service, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                    >
                        <img
                            src={service.img}
                            alt={service.title}
                            className="w-full h-40 object-cover"
                        />
                        <div className="p-4 text-center">
                            <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-12">
                <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/"
                    className="bg-green-600 text-white py-3 px-6 rounded-xl shadow-md hover:bg-green-700 transition"
                >
                    Book Your Ride Now
                </motion.a>
            </div>
        </div>
    );
}
