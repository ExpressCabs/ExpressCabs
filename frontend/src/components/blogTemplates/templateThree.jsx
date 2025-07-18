import React from 'react';
import { motion } from 'framer-motion';
import BookingForm from '../bookingForm';
import { Helmet } from 'react-helmet-async';

export default function TemplateThree({ blog }) {
    return (
        <article className="max-w-6xl mx-auto text-gray-900">
            <div className="grid md:grid-cols-2 gap-10">
                <Helmet>
                    <title>{blog.title} | Prime Cabs Melbourne</title>
                    <meta name="description" content={blog.subtitle || 'Reliable Melbourne Airport taxi service by Prime Cabs'} />
                    <meta name="keywords" content="Melbourne Airport Taxi, Airport Transfers, Prime Cabs, Book Taxi Melbourne, Airport Pickup Melbourne, Taxi to Airport" />
                    <link rel="canonical" href={`https://primecabsmelbourne.com.au/blog/${blog.slug}`} />

                    {/* Open Graph for social sharing */}
                    <meta property="og:title" content={blog.title} />
                    <meta property="og:description" content={blog.subtitle} />
                    <meta property="og:image" content={blog.image1} />
                    <meta property="og:url" content={`https://primecabsmelbourne.com.au/blog/${blog.slug}`} />
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
                                    "url": "https://primecabsmelbourne.com.au/logo.png"
                                }
                            },
                            "url": `https://primecabsmelbourne.com.au/blog/${blog.slug}`,
                            "datePublished": blog.createdAt || new Date().toISOString()
                        })}
                    </script>
                </Helmet>
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-5xl font-extrabold mb-3"
                    >
                        {blog.title}
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-2xl text-gray-600 mb-6"
                    >
                        {blog.subtitle}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-lg leading-relaxed mb-6"
                    >
                        {blog.body1}
                    </motion.p>

                    {blog.image1 && (
                        <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            src={blog.image1}
                            alt={blog.image1Alt || 'Blog Image'}
                            className="w-full h-[320px] object-cover rounded-xl shadow mb-6"
                        />
                    )}

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-lg leading-relaxed mb-6"
                    >
                        {blog.body2}
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="bg-white border shadow-xl rounded-2xl p-6"
                >
                    <h3 className="text-2xl font-semibold mb-4 text-center">Book Your Ride</h3>
                    <BookingForm />
                </motion.div>
            </div>

            {blog.image2 && (
                <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    src={blog.image2}
                    alt={blog.image2Alt || 'Blog Image'}
                    className="w-full h-[300px] object-cover rounded-xl mt-10 shadow"
                />
            )}

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-lg leading-relaxed font-medium mt-6"
            >
                {blog.conclusion}
            </motion.p>

            {blog.image3 && (
                <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    src={blog.image3}
                    alt={blog.image3Alt || 'Blog Image'}
                    className="w-full h-[300px] object-cover rounded-xl mt-6 shadow"
                />
            )}
        </article>
    );
}
