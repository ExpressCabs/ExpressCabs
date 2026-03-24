import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

import TemplateOne from '../components/blogTemplates/templateOne';
import TemplateTwo from '../components/blogTemplates/templateTwo';
import TemplateThree from '../components/blogTemplates/templateThree';
import { buildMeta } from '../lib/seo/buildMeta';
import { buildBlogPostingSchema } from '../lib/seo/schemas';
import { getCanonicalPathForBlog } from '../lib/seo/routes';

export default function BlogSlug() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const notFoundMeta = buildMeta({
        title: 'Blog Not Found | Prime Cabs Melbourne',
        description: 'The requested blog article could not be found.',
        canonicalPath: '/',
        robots: 'noindex, nofollow',
    });

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/blogs/${slug}`);
                if (res.data.success) {
                    setBlog(res.data.blog);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error('Error fetching blog:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [slug]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (notFound || !blog) {
        return (
            <>
                <Helmet>
                    <title>{notFoundMeta.title}</title>
                    <meta name="description" content={notFoundMeta.description} />
                    <meta name="robots" content={notFoundMeta.robots} />
                    <link rel="canonical" href={notFoundMeta.canonical} />
                </Helmet>
                <div className="p-8 text-center text-red-600">Blog not found.</div>
            </>
        );
    }

    const canonicalPath = getCanonicalPathForBlog(blog.slug);
    const meta = buildMeta({
        title: blog.metaTitle || `${blog.title} | Prime Cabs Melbourne`,
        description: blog.metaDescription || blog.excerpt || blog.subtitle || 'Prime Cabs Melbourne blog article.',
        canonicalPath,
        ogImage: blog.ogImage || blog.image1,
        type: 'article',
    });
    const blogSchema = buildBlogPostingSchema({
        blog,
        canonicalUrl: meta.canonical,
    });

    // Normalize and render template
    const renderTemplate = () => {
        const template = blog.template?.trim().toLowerCase();

        switch (template) {
            case 'templateone':
            case 'template1':
                return <TemplateOne blog={blog} />;
            case 'templatetwo':
            case 'template2':
                return <TemplateTwo blog={blog} />;
            case 'templatethree':
            case 'template3':
                return <TemplateThree blog={blog} />;
            default:
                return (
                    <div className="text-center text-gray-500">
                        Invalid template selected: <code>{blog.template}</code>
                    </div>
                );
        }
    };

    return (
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="robots" content={meta.robots} />
                <link rel="canonical" href={meta.canonical} />
                <meta property="og:type" content={meta.openGraph.type} />
                <meta property="og:site_name" content={meta.openGraph.siteName} />
                <meta property="og:url" content={meta.openGraph.url} />
                <meta property="og:title" content={meta.openGraph.title} />
                <meta property="og:description" content={meta.openGraph.description} />
                <meta property="og:image" content={meta.openGraph.image} />
                <meta name="twitter:card" content={meta.twitter.card} />
                <meta name="twitter:title" content={meta.twitter.title} />
                <meta name="twitter:description" content={meta.twitter.description} />
                <meta name="twitter:image" content={meta.twitter.image} />
                <script type="application/ld+json">
                    {JSON.stringify(blogSchema)}
                </script>
            </Helmet>
            <main className="p-6 sm:p-12 bg-white">
                {renderTemplate()}
            </main>
        </>
    );
}
