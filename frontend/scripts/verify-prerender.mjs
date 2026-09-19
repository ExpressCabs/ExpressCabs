import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');

const requiredFiles = [
  'index.html',
  path.join('airport-taxi-melbourne', 'index.html'),
  path.join('airport-transfer', 'melbourne', 'index.html'),
  path.join('contact', 'index.html'),
  path.join('services', 'index.html'),
  path.join('blogs', 'index.html'),
  path.join('airport-transfer', 'melbourne', 'croydon', 'index.html'),
  '404.html',
];

async function exists(relativePath) {
  try {
    await fs.access(path.join(distDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return fs.readFile(path.join(distDir, relativePath), 'utf8');
}

function countMatches(value, pattern) {
  return (value.match(pattern) || []).length;
}

function verifyJsonLd(html, label) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const [, payload] of scripts) {
    try {
      JSON.parse(payload);
    } catch {
      throw new Error(`${label} contains invalid JSON-LD.`);
    }
  }
}

async function verify() {
  const missing = [];

  for (const file of requiredFiles) {
    if (!(await exists(file))) {
      missing.push(file);
    }
  }

  if (missing.length) {
    throw new Error(`Missing prerender output: ${missing.join(', ')}`);
  }

  const coreRoutes = [
    { file: 'index.html', canonical: 'https://www.primecabsmelbourne.com.au/' },
    { file: path.join('airport-taxi-melbourne', 'index.html'), canonical: 'https://www.primecabsmelbourne.com.au/airport-taxi-melbourne' },
    { file: path.join('airport-transfer', 'melbourne', 'index.html'), canonical: 'https://www.primecabsmelbourne.com.au/airport-transfer/melbourne' },
    { file: path.join('contact', 'index.html'), canonical: 'https://www.primecabsmelbourne.com.au/contact' },
    { file: path.join('services', 'index.html'), canonical: 'https://www.primecabsmelbourne.com.au/services' },
    { file: path.join('blogs', 'index.html'), canonical: 'https://www.primecabsmelbourne.com.au/blogs' },
  ];
  const coreHtml = await Promise.all(coreRoutes.map(async (route) => ({
    ...route,
    html: await read(route.file),
  })));
  const home = coreHtml[0].html;
  const suburb = await read(path.join('airport-transfer', 'melbourne', 'croydon', 'index.html'));
  const notFound = await read('404.html');
  const staticSitemap = await read('static-sitemap.xml');
  const isPreview = process.env.VERCEL_ENV === 'preview';

  for (const route of coreHtml) {
    if (countMatches(route.html, /<title>/gi) !== 1) {
      throw new Error(`${route.file} must contain exactly one title element.`);
    }
    verifyJsonLd(route.html, route.file);
  }
  verifyJsonLd(suburb, 'representative suburb');
  if (!/name="robots" content="noindex,nofollow,noarchive"/i.test(notFound)) {
    throw new Error('404 document must be noindex.');
  }
  if (/airport-transfer\/melbourne\/croydon/i.test(staticSitemap)) {
    throw new Error('Unreviewed suburb URLs must not appear in the static sitemap.');
  }

  if (isPreview) {
    for (const route of coreHtml) {
      if (!/name="robots" content="noindex,nofollow,noarchive"/i.test(route.html)) {
        throw new Error(`Preview route ${route.file} must be noindex.`);
      }
      if (/rel="canonical"/i.test(route.html)) {
        throw new Error(`Preview route ${route.file} must not emit a production canonical tag.`);
      }
    }
  } else {
    for (const route of coreHtml) {
      if (!route.html.includes(`<link rel="canonical" href="${route.canonical}"`)) {
        throw new Error(`Production canonical is missing or incorrect for ${route.file}.`);
      }
      if (!/name="robots" content="index,follow/i.test(route.html)) {
        throw new Error(`Production route ${route.file} must be indexable.`);
      }
    }
    if (!/name="robots" content="noindex,follow"/i.test(suburb)) {
      throw new Error('Unreviewed suburb prerender must be noindex,follow.');
    }
  }

  console.log(`[prerender] Verified ${requiredFiles.length} route files and SEO invariants (${isPreview ? 'Preview' : 'production'}).`);
}

verify().catch((error) => {
  console.error('[prerender] Verification failed:', error.message);
  process.exitCode = 1;
});
