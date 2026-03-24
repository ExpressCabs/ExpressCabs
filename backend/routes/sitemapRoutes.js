const express = require('express');
const prisma = require('../lib/prisma');
const suburbs = require('../../frontend/src/data/melbourneSuburbs.json');

const router = express.Router();

const BASE_URL = String(process.env.CANONICAL_BASE_URL || 'https://www.primecabsmelbourne.com.au').replace(/\/+$/, '');

const STATIC_URLS = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/airport-taxi-melbourne', changefreq: 'daily', priority: '0.9' },
  { path: '/services', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/airport-transfer/melbourne', changefreq: 'weekly', priority: '0.9' },
];

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(pathname) {
  if (!pathname || pathname === '/') return `${BASE_URL}/`;
  return `${BASE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function formatIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildUrlset(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items
  .map(
    (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(item.lastmod)}</lastmod>
    <changefreq>${escapeXml(item.changefreq)}</changefreq>
    <priority>${escapeXml(item.priority)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

function buildSitemapIndex(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items
  .map(
    (item) => `  <sitemap>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(item.lastmod)}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;
}

router.get(['/sitemap.xml', '/api/sitemap.xml'], async (req, res) => {
  try {
    const latestBlog = await prisma.blog.findFirst({
      where: { isPublished: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        updatedAt: true,
        createdAt: true,
      },
    });

    const latestBlogDate = latestBlog?.updatedAt || latestBlog?.createdAt || new Date();
    const now = new Date();

    const sitemap = buildSitemapIndex([
      { loc: toAbsoluteUrl('/api/sitemaps/static.xml'), lastmod: formatIso(now) },
      { loc: toAbsoluteUrl('/api/sitemaps/suburbs.xml'), lastmod: formatIso(now) },
      { loc: toAbsoluteUrl('/api/sitemaps/blogs.xml'), lastmod: formatIso(latestBlogDate) },
    ]);

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (err) {
    console.error('Failed to generate sitemap index:', err);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/sitemaps/static.xml', async (req, res) => {
  try {
    const lastmod = formatIso(new Date());
    const sitemap = buildUrlset(
      STATIC_URLS.map((item) => ({
        loc: toAbsoluteUrl(item.path),
        lastmod,
        changefreq: item.changefreq,
        priority: item.priority,
      }))
    );

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (err) {
    console.error('Failed to generate static sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/sitemaps/suburbs.xml', async (req, res) => {
  try {
    const lastmod = formatIso(new Date());
    const sitemap = buildUrlset(
      suburbs
        .filter((suburb) => suburb?.slug)
        .map((suburb) => ({
          loc: toAbsoluteUrl(`/airport-transfer/melbourne/${suburb.slug}`),
          lastmod,
          changefreq: 'weekly',
          priority: '0.8',
        }))
    );

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (err) {
    console.error('Failed to generate suburb sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/sitemaps/blogs.xml', async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        slug: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    const sitemap = buildUrlset(
      blogs
        .filter((blog) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blog.slug))
        .map((blog) => ({
          loc: toAbsoluteUrl(`/blog/${blog.slug}`),
          lastmod: formatIso(blog.updatedAt || blog.publishedAt || blog.createdAt),
          changefreq: 'monthly',
          priority: '0.7',
        }))
    );

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (err) {
    console.error('Failed to generate blog sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
