import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BlogPreviewCarousel() {
    const [blogs, setBlogs] = useState([]);
    const [blogIndex, setBlogIndex] = useState(0);
    const [imageIndex, setImageIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await axios.get('/api/blogs');
                if (res.data.success) setBlogs(res.data.blogs);
            } catch (err) {
                console.error('Failed to fetch blogs', err);
            }
        };
        fetchBlogs();
    }, []);

    useEffect(() => {
        if (blogs.length === 0) return;

        const currentBlog = blogs[blogIndex];
        const images = [currentBlog.image1, currentBlog.image2, currentBlog.image3].filter(Boolean);

        const interval = setInterval(() => {
            if (imageIndex < images.length - 1) {
                setImageIndex((prev) => prev + 1);
            } else {
                setImageIndex(0);
                setBlogIndex((prev) => (prev + 1) % blogs.length);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [blogs, blogIndex, imageIndex]);

    if (blogs.length === 0) return null;

    const currentBlog = blogs[blogIndex];
    const images = [currentBlog.image1, currentBlog.image2, currentBlog.image3].filter(Boolean);

    return (
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden rounded-xl shadow-lg">
            <AnimatePresence mode="wait">
                <motion.img
                    key={images[imageIndex]}
                    src={images[imageIndex]}
                    alt="Preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50"
                />
            </AnimatePresence>

            <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-4">
                <motion.h2
                    key={currentBlog.slug}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5 }}
                    className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg"
                >
                    {currentBlog.title}
                </motion.h2>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/blog/${currentBlog.slug}`)}
                    className="bg-white text-black px-6 py-2 rounded-full font-medium shadow"
                >
                    Learn More
                </motion.button>
            </div>
        </div>
    );
}
