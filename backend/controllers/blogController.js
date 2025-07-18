const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const https = require('https');

const createBlog = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            template,
            image1,
            image1Alt,
            image2,
            image2Alt,
            image3,
            image3Alt,
            body1,
            body2,
            conclusion
        } = req.body;

        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const blog = await prisma.blog.create({
            data: {
                title,
                subtitle,
                template,
                image1,
                image1Alt,
                image2,
                image2Alt,
                image3,
                image3Alt,
                body1,
                body2,
                conclusion,
                slug
            }
        });

        const pingURL = `https://www.google.com/ping?sitemap=${encodeURIComponent('https://expresscabs.onrender.com/api/sitemap.xml')}`;
        https.get(pingURL, (pingRes) => {
            console.log(`✅ Google pinged: ${pingRes.statusCode}`);
        }).on('error', (err) => {
            console.error('❌ Failed to ping Google:', err.message);
        });

        res.json({ success: true, blog });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ success: false, error: 'Failed to create blog' });
    }
};

const getBlogBySlug = async (req, res) => {
    const { slug } = req.params;

    try {
        const blog = await prisma.blog.findUnique({
            where: { slug },
        });

        if (!blog) {
            return res.status(404).json({ success: false, error: 'Blog not found' });
        }

        res.json({ success: true, blog });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const getAllBlogs = async (req, res) => {
    try {
        const blogs = await prisma.blog.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                image1: true,
                image2: true,
                image3: true,
            }
        });

        res.json({ success: true, blogs });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch blogs' });
    }
};


module.exports = {
    createBlog,
    getBlogBySlug,
    getAllBlogs

};
