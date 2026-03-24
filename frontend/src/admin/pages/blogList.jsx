import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function formatDate(dateLike) {
  if (!dateLike) return '--';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const loadBlogs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/blogs`);
        if (!cancelled && res.data?.success) {
          setBlogs(Array.isArray(res.data.blogs) ? res.data.blogs : []);
        }
      } catch (error) {
        console.error('Failed to load blogs:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBlogs();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Content</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">All Blogs</h1>
          <p className="mt-2 text-sm text-slate-600">Manage published blog articles and jump straight to the public blog index.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            View Public Blogs
          </button>
          <Link
            to="/admin/blogs/new"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Write New Blog
          </Link>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="px-5 py-6 text-sm text-slate-500">Loading blogs...</p> : null}

        {!loading && !blogs.length ? (
          <div className="px-5 py-10 text-center">
            <p className="text-lg font-bold text-slate-900">No published blogs found</p>
            <p className="mt-2 text-sm text-slate-600">Create the first article from the blog editor.</p>
          </div>
        ) : null}

        {!loading && blogs.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Slug</th>
                  <th className="px-5 py-4">Published</th>
                  <th className="px-5 py-4">Author</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id || blog.slug} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{blog.title}</p>
                        <p className="mt-1 max-w-[420px] text-xs text-slate-500">
                          {blog.excerpt || blog.subtitle || 'No excerpt available.'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">/{blog.slug}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(blog.publishedAt || blog.updatedAt)}</td>
                    <td className="px-5 py-4 text-slate-600">{blog.authorName || 'Prime Cabs Melbourne'}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/blog/${blog.slug}`)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/blog/${blog.slug}`)}
                          className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black"
                        >
                          Copy Link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
