const prisma = require('../lib/prisma');
const https = require('https');
const { isNonEmptyString } = require('../lib/validators');

const publicBlogSelect = {
    id: true,
    slug: true,
    title: true,
    subtitle: true,
    template: true,
    image1: true,
    image1Alt: true,
    image2: true,
    image2Alt: true,
    image3: true,
    image3Alt: true,
    body1: true,
    body2: true,
    conclusion: true,
    createdAt: true,
    updatedAt: true,
    metaTitle: true,
    metaDescription: true,
    excerpt: true,
    ogImage: true,
    publishedAt: true,
    authorName: true,
    isPublished: true,
    readingTimeMinutes: true,
    keywords: true,
    faqJson: true,
};

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
            conclusion,
            metaTitle,
            metaDescription,
            excerpt,
            ogImage,
            publishedAt,
            authorName,
            isPublished,
            readingTimeMinutes,
            keywords,
            faqJson,
        } = req.body;

        if (!isNonEmptyString(title) || !isNonEmptyString(template) || !isNonEmptyString(body1) || !isNonEmptyString(body2) || !isNonEmptyString(conclusion) || !isNonEmptyString(image1)) {
            return res.status(400).json({ success: false, error: 'Missing required blog fields' });
        }

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
                slug,
                metaTitle: isNonEmptyString(metaTitle) ? metaTitle.trim() : null,
                metaDescription: isNonEmptyString(metaDescription) ? metaDescription.trim() : null,
                excerpt: isNonEmptyString(excerpt) ? excerpt.trim() : null,
                ogImage: isNonEmptyString(ogImage) ? ogImage.trim() : null,
                publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
                authorName: isNonEmptyString(authorName) ? authorName.trim() : 'Prime Cabs Melbourne',
                isPublished: typeof isPublished === 'boolean' ? isPublished : true,
                readingTimeMinutes: Number.isFinite(readingTimeMinutes) ? readingTimeMinutes : null,
                keywords: isNonEmptyString(keywords) ? keywords.trim() : null,
                faqJson: faqJson ?? null,
            }
        });

        const pingURL = `https://www.google.com/ping?sitemap=${encodeURIComponent('https://www.primecabsmelbourne.com.au/sitemap.xml')}`;
        https.get(pingURL, (pingRes) => {
            console.log(`Google pinged: ${pingRes.statusCode}`);
        }).on('error', (err) => {
            console.error('Failed to ping Google:', err.message);
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
            select: publicBlogSelect,
        });

        if (!blog || !blog.isPublished) {
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
            where: {
                isPublished: true,
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                subtitle: true,
                slug: true,
                image1: true,
                metaTitle: true,
                metaDescription: true,
                excerpt: true,
                ogImage: true,
                publishedAt: true,
                updatedAt: true,
                authorName: true,
                readingTimeMinutes: true,
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
