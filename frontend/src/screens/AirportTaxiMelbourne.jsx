import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import sedanImg from '/assets/vehicles/sedan-modern.png';
import suvImg from '/assets/vehicles/suv-modern.png';
import vanImg from '/assets/vehicles/van-modern.png';
import luxuryImg from '/assets/vehicles/luxury-modern.png';
import bgHero from '/assets/images/airport-hero.webp';
import AddressScreen from '../screens/AddressScreen';

const fleet = [
    { name: 'Sedan', seats: 4, image: sedanImg },
    { name: 'Luxury', seats: 4, image: luxuryImg },
    { name: 'SUV', seats: 6, image: suvImg },
    { name: 'Van', seats: 11, image: vanImg },
];

const AirportTaxiMelbourne = ({ loggedInUser }) => {
    return (
        <div className="min-h-screen bg-white text-gray-800 pb-32">
            <Helmet>
                <title>Melbourne Airport Taxi Transfers | Prime Cabs Melbourne</title>
                <meta name="description" content="Book affordable, fast and professional airport taxis in Melbourne. Fixed fares, 24/7 service to Tullamarine & Avalon Airport. Fleet includes sedans, SUVs, and vans." />
                <link rel="canonical" href="https://www.primecabsmelbourne.com.au/airport-taxi-melbourne" />
                <meta name="robots" content="index, follow" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "serviceType": "Airport Transfer Taxi",
                        "name": "Melbourne Airport Taxi Transfers - Prime Cabs",
                        "provider": {
                            "@type": "LocalBusiness",
                            "name": "Prime Cabs Melbourne",
                            "url": "https://www.primecabsmelbourne.com.au",
                            "image": "https://www.primecabsmelbourne.com.au/favicon_io/android-chrome-512x512.png",
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
                        "areaServed": [
                            {
                                "@type": "Place",
                                "name": "Melbourne"
                            },
                            {
                                "@type": "Place",
                                "name": "Tullamarine Airport"
                            },
                            {
                                "@type": "Place",
                                "name": "Avalon Airport"
                            }
                        ],
                        "description": "24/7 airport transfer taxi service in Melbourne. Reliable pickups and drop-offs to and from Tullamarine and Avalon Airport. Choose from Sedans, SUVs, Vans and Luxury Cabs.",
                        "availableChannel": {
                            "@type": "ServiceChannel",
                            "serviceUrl": "https://www.primecabsmelbourne.com.au/airport-taxi-melbourne"
                        },
                        "hasOfferCatalog": {
                            "@type": "OfferCatalog",
                            "name": "Fleet Options",
                            "itemListElement": [
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Sedan",
                                    "description": "Standard 4-seater sedan for Melbourne airport transfers."
                                }
                                },
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Luxury",
                                    "description": "Premium luxury vehicle for comfortable airport transfers."
                                }
                                },
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "SUV",
                                    "description": "Spacious SUV ideal for families, luggage, and group travel."
                                }
                                },
                                {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Van",
                                    "description": "High-capacity van for group airport transfers, up to 11 passengers."
                                }
                                }
                            ]
                            }

                    })}
                </script>
            </Helmet>

            {/* Hero Section */}
            <div
                className="bg-cover bg-center h-[70vh] flex flex-col justify-center items-center text-white text-center px-4"
                style={{ backgroundImage: `url(${bgHero})` }}
            >
                <motion.h1
                    className="text-4xl md:text-5xl font-bold drop-shadow-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    Melbourne Airport Taxi Transfers
                </motion.h1>
                <motion.p
                    className="mt-4 text-lg md:text-xl drop-shadow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Tullamarine | Avalon | 24/7 Cabs | Instant Booking
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6"
                >
                    <Link
                        to="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-lg shadow-lg"
                    >
                        Book Your Ride Now
                    </Link>
                </motion.div>
            </div>

            {/* Keyword Intro */}
            <section className="py-8 px-4 md:px-16 text-center max-w-3xl mx-auto">
                <p className="text-lg text-gray-700">
                    At Prime Cabs Melbourne, we specialize in reliable and affordable airport taxi transfers.
                    Whether you're heading to <strong>Melbourne Airport (Tullamarine)</strong> or <strong>Avalon Airport</strong>,
                    our professional taxi service ensures you're always on time.
                    We proudly service <strong>Croydon, Ringwood, Box Hill, Doncaster, Burwood, Glen Waverley, and all Melbourne suburbs</strong>.
                </p>
            </section>
            <section className="py-8 px-4 md:px-16">
                <div className="max-w-4xl mx-auto">
                    <AddressScreen isEmbedded={true} loggedInUser={loggedInUser} />
                </div>
            </section>


            {/* Fleet Section */}
            <section className="py-12 px-4 md:px-16 bg-gray-50">
                <h2 className="text-3xl font-bold text-center mb-8">Our Fleet</h2>
                <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
                    Choose from our well-maintained fleet to suit your travel needs — from comfortable sedans to spacious vans
                    for family airport transfers. All vehicles are air-conditioned, clean, and driven by licensed professionals.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {fleet.map((v, idx) => (
                        <motion.div
                            key={v.name}
                            className="bg-white rounded-xl shadow-md p-6 text-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ delay: 0.1 * idx }}
                        >
                            <img src={v.image} alt={v.name} className="w-24 h-24 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold">{v.name}</h3>
                            <p className="text-sm text-gray-500">Seats up to {v.seats} passengers</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-12 px-4 md:px-16">
                <h2 className="text-3xl font-bold text-center mb-8">Why Choose Prime Cabs?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-xl font-bold mb-2">24/7 Availability</h4>
                        <p>We’re always ready to drive — day or night, weekday or weekend, public holiday or late night pickup.</p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-xl font-bold mb-2">Fixed Pricing</h4>
                        <p>Use our fare estimator. Know your cost upfront with no surge pricing or hidden charges.</p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-xl font-bold mb-2">Professional Drivers</h4>
                        <p>Fully licensed, insured, and experienced drivers with excellent local knowledge and punctuality.</p>
                    </div>
                </div>
            </section>

            {/* Areas We Serve */}
            <section className="py-12 px-4 md:px-16 bg-gray-100">
                <h2 className="text-3xl font-bold text-center mb-8">Melbourne Suburbs We Cover</h2>
                <p className="text-center max-w-2xl mx-auto mb-6 text-gray-700">
                    We provide taxi services to and from all metro Melbourne areas including <strong>CBD, Northern Suburbs, Eastern Suburbs, South East Melbourne</strong> and beyond.
                    Key areas include:
                    <br />
                    <strong>Croydon, Ringwood, Box Hill, Doncaster, Glen Waverley, Dandenong, South Yarra, St Kilda, Brighton, Docklands, and Tullamarine Airport.</strong>
                </p>
                <div className="h-[400px]">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d805202.0266101739!2d144.39515249695575!3d-37.9696510536865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad646b5d2ba4df7%3A0x4045675218ccd90!2sMelbourne%20VIC!5e0!3m2!1sen!2sau!4v1749944188822!5m2!1sen!2sau"
                        className="w-full h-[400px] border-0 rounded-xl"
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Book your airport taxi today</h2>
                <p className="text-gray-600 mb-6">Trusted by hundreds of Melbourne travellers every week. Secure your ride now.</p>
                <Link
                    to="/"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded shadow-lg text-lg"
                >
                    Book Now
                </Link>
            </section>

            {/* Hidden SEO Keywords */}
            <p className="sr-only">
                Prime Cabs Melbourne provides 24/7 airport taxi service to Melbourne Airport, Avalon Airport, Croydon, Box Hill, Doncaster, Ringwood, Dandenong, and all eastern suburbs.
                Book online airport taxis, private transfers, group vans, and professional cab services in Melbourne at fixed fares.
            </p>
        </div>
    );
};

export default AirportTaxiMelbourne;
