// routes/sitemapRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

const BASE_URL = process.env.CANONICAL_BASE_URL || 'https://www.primecabsmelbourne.com.au';

const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
      select: { slug: true, createdAt: true },
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogs
  .filter((blog) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blog.slug))
  .map(
    (blog) => `
  <url>
    <loc>${escapeXml(`${BASE_URL}/blog/${blog.slug}`)}</loc>
    <lastmod>${blog.createdAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (err) {
    console.error('Failed to generate sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
