import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

import TemplateOne from '../components/blogTemplates/templateOne';
import TemplateTwo from '../components/blogTemplates/templateTwo';
import TemplateThree from '../components/blogTemplates/templateThree';

export default function BlogSlug() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

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
                    <title>Blog Not Found | Prime Cabs Melbourne</title>
                    <meta name="robots" content="noindex, nofollow" />
                    <link rel="canonical" href="https://www.primecabsmelbourne.com.au/" />
                </Helmet>
                <div className="p-8 text-center text-red-600">Blog not found.</div>
            </>
        );
    }

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
        <main className="p-6 sm:p-12 bg-white">
            {renderTemplate()}
        </main>
    );
}
