import React from 'react';
import { motion } from 'framer-motion';
import BookingForm from '../bookingForm';
import { Helmet } from 'react-helmet-async';

export default function TemplateOne({ blog }) {
    return (
        <div className="bg-gradient-to-b from-white via-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <Helmet>
                <title>{blog.title} | Prime Cabs Melbourne</title>
                <meta name="description" content={blog.subtitle || 'Reliable Melbourne Airport taxi service by Prime Cabs'} />
                <meta name="keywords" content="Melbourne Airport Taxi, Airport Transfers, Prime Cabs, Book Taxi Melbourne, Airport Pickup Melbourne, Taxi to Airport" />
                <link rel="canonical" href={`https://www.primecabsmelbourne.com.au/blog/${blog.slug}`} />

                {/* Open Graph for social sharing */}
                <meta property="og:title" content={blog.title} />
                <meta property="og:description" content={blog.subtitle} />
                <meta property="og:image" content={blog.image1} />
                <meta property="og:url" content={`https://WWW.primecabsmelbourne.com.au/blog/${blog.slug}`} />
                <meta property="og:type" content="article" />

                {/* BlogPosting Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": blog.title,
                        "description": blog.subtitle,
                        "image": blog.image1,
                        "author": {
                            "@type": "Organization",
                            "name": "Prime Cabs Melbourne"
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Prime Cabs Melbourne",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://www.primecabsmelbourne.com.au/logo.png"
                            }
                        },
                        "url": `https://www.primecabsmelbourne.com.au/blog/${blog.slug}`,
                        "datePublished": blog.createdAt || new Date().toISOString()
                    })}
                </script>
            </Helmet>

            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-5xl font-black text-gray-800 mb-4">
                        {blog.title}
                    </h1>
                    <p className="text-xl text-gray-600 font-medium">
                        {blog.subtitle}
                    </p>
                </motion.div>

                {/* Embedded Booking Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-white shadow-2xl rounded-2xl p-6 md:p-10 mb-12"
                >
                    <h3 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
                        Book Your Melbourne Airport Taxi
                    </h3>
                    <BookingForm />
                </motion.div>

                {blog.image1 && (
                    <motion.img
                        src={blog.image1}
                        alt={blog.image1Alt || 'Blog Image'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="rounded-xl shadow-lg w-full h-[420px] object-cover mb-8"
                    />
                )}

                <motion.p
                    className="text-lg leading-8 text-gray-700 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    {blog.body1}
                </motion.p>

                {blog.image2 && (
                    <motion.img
                        src={blog.image2}
                        alt={blog.image2Alt || 'Blog Image'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="rounded-xl shadow-md w-full h-[300px] object-cover mb-8"
                    />
                )}

                <motion.p
                    className="text-lg leading-8 text-gray-700 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    {blog.body2}
                </motion.p>

                {blog.image3 && (
                    <motion.img
                        src={blog.image3}
                        alt={blog.image3Alt || 'Blog Image'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="rounded-xl shadow-md w-full h-[300px] object-cover mb-8"
                    />
                )}

                <motion.p
                    className="text-lg leading-8 text-gray-800 font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                >
                    {blog.conclusion}
                </motion.p>
            </div>
        </div>
    );
}
