import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const suburbsFile = path.join(frontendDir, 'src', 'data', 'melbourneSuburbs.json');
const baseUrl = String(
  process.env.VITE_CANONICAL_BASE_URL || 'https://www.primecabsmelbourne.com.au'
).replace(/\/+$/, '');
const apiBaseUrl = String(process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const NOW_ISO = new Date().toISOString();

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ');
}

function absoluteUrl(input = '') {
  if (!input) return `${baseUrl}/assets/images/prime-cabs-og.webp`;
  if (/^https?:\/\//i.test(input)) return input;
  return `${baseUrl}${input.startsWith('/') ? input : `/${input}`}`;
}

function toRouteDir(routePath) {
  const cleaned = routePath.replace(/^\/+/, '');
  return cleaned ? path.join(distDir, cleaned) : distDir;
}

async function writeRouteHtml(routePath, html) {
  const targetDir = toRouteDir(routePath);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, 'index.html'), html, 'utf8');
}

async function loadShellTemplate() {
  return fs.readFile(path.join(distDir, 'index.html'), 'utf8');
}

async function loadSuburbs() {
  const raw = await fs.readFile(suburbsFile, 'utf8');
  return JSON.parse(raw);
}

function injectHtmlDocument(shellHtml, { headMarkup, bodyMarkup, dataScript = '' }) {
  let output = shellHtml;
  output = output.replace('</head>', `${headMarkup}\n${dataScript}\n  </head>`);
  output = output.replace('<div id="root"></div>', `<div id="root">${bodyMarkup}</div>`);
  return output;
}

function formatPublishedDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Australia/Sydney',
  });
}

function buildMetaTags({ title, description, canonicalUrl, ogImage, type = 'website', schema, robots }) {
  const image = absoluteUrl(ogImage);
  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta name="robots" content="${escapeHtml(
      robots || 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    )}" />
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:site_name" content="Prime Cabs Melbourne" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function buildDataScript(payload) {
  if (!payload) return '';
  return `    <script>window.__PRERENDER_DATA__ = ${JSON.stringify(payload)};</script>`;
}

function renderShellPage({ eyebrow, title, description, bullets = [], ctaLabel = 'Book now', ctaHref = '/' }) {
  return `
    <main style="font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111827;">
      <section style="padding:80px 24px 56px;background:linear-gradient(180deg,#111827 0%,#1f2937 52%,#ffffff 100%);">
        <div style="max-width:1100px;margin:0 auto;">
          <p style="display:inline-block;margin:0;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.16);color:#f9fafb;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(
            eyebrow
          )}</p>
          <h1 style="margin:22px 0 18px;font-size:clamp(2.4rem,5vw,4.8rem);line-height:1.02;color:#ffffff;max-width:780px;">${escapeHtml(
            title
          )}</h1>
          <p style="margin:0;max-width:760px;font-size:1.1rem;line-height:1.8;color:rgba(255,255,255,0.84);">${escapeHtml(
            description
          )}</p>
          ${
            bullets.length
              ? `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:28px;">
              ${bullets
                .map(
                  (bullet) =>
                    `<span style="padding:8px 14px;border-radius:999px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.16);color:#ffffff;font-size:13px;font-weight:600;">${escapeHtml(
                      bullet
                    )}</span>`
                )
                .join('')}
            </div>`
              : ''
          }
          <div style="margin-top:34px;">
            <a href="${escapeHtml(
              ctaHref
            )}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ffffff;color:#111827;text-decoration:none;font-weight:700;">${escapeHtml(
    ctaLabel
  )}</a>
          </div>
        </div>
      </section>
    </main>`;
}

function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Prime Cabs Melbourne',
    url: `${baseUrl}/`,
    telephone: '+61488797233',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'VIC',
      addressCountry: 'AU',
    },
  };
}

function buildBlogSchema(blog, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt || blog.subtitle || '',
    datePublished: blog.publishedAt || blog.createdAt || NOW_ISO,
    dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt || NOW_ISO,
    author: {
      '@type': 'Person',
      name: blog.authorName || 'Prime Cabs Melbourne',
    },
    image: [absoluteUrl(blog.ogImage || blog.image1)].filter(Boolean),
    mainEntityOfPage: canonicalUrl,
  };
}

function buildBlogBody(blog) {
  const published = formatPublishedDate(blog.publishedAt || blog.createdAt);
  const sections = [
    { heading: 'Overview', body: blog.body1, image: blog.image1, alt: blog.image1Alt },
    { heading: 'Details', body: blog.body2, image: blog.image2, alt: blog.image2Alt },
    { heading: 'Conclusion', body: blog.conclusion, image: blog.image3, alt: blog.image3Alt },
  ].filter((section) => normalizeText(section.body));

  const sectionMarkup = sections
    .map((section) => {
      const imageMarkup = section.image
        ? `<figure style="margin:24px 0;">
            <img src="${escapeHtml(section.image)}" alt="${escapeHtml(section.alt || blog.title)}" style="width:100%;border-radius:20px;display:block;object-fit:cover;max-height:420px;" />
          </figure>`
        : '';

      return `<section style="margin-top:32px;">
        <h2 style="font-size:1.6rem;line-height:1.2;margin:0 0 14px;color:#111827;">${escapeHtml(section.heading)}</h2>
        ${imageMarkup}
        <p style="font-size:1rem;line-height:1.8;margin:0;color:#374151;">${escapeHtml(normalizeText(stripHtml(section.body)))}</p>
      </section>`;
    })
    .join('');

  return `
    <main style="max-width:900px;margin:0 auto;padding:48px 24px 80px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#ffffff;color:#111827;">
      <article>
        <p style="font-size:0.82rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin:0;">Prime Cabs Melbourne Blog</p>
        <h1 style="font-size:clamp(2.2rem,5vw,4rem);line-height:1.05;margin:16px 0 18px;color:#111827;">${escapeHtml(blog.title)}</h1>
        ${
          blog.subtitle
            ? `<p style="font-size:1.15rem;line-height:1.7;color:#4b5563;margin:0 0 18px;">${escapeHtml(normalizeText(stripHtml(blog.subtitle)))}</p>`
            : ''
        }
        <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:0.95rem;color:#6b7280;margin-bottom:28px;">
          ${published ? `<span>${escapeHtml(published)}</span>` : ''}
          <span>Prime Cabs Melbourne</span>
        </div>
        ${sectionMarkup}
      </article>
    </main>`;
}

function buildSuburbSchema(suburb, canonicalUrl, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TaxiService',
    name: `Airport Transfers from ${suburb.name} to Melbourne Airport`,
    url: canonicalUrl,
    description,
    areaServed: [{ '@type': 'Place', name: `${suburb.name} VIC ${suburb.postcode}` }],
  };
}

function buildSuburbBody(suburb) {
  const highlights = Array.isArray(suburb?.content?.serviceHighlights)
    ? suburb.content.serviceHighlights
    : [];
  const faqs = Array.isArray(suburb?.content?.faqs) ? suburb.content.faqs : [];

  return `
    <main style="max-width:920px;margin:0 auto;padding:48px 24px 80px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#ffffff;color:#111827;">
      <article>
        <p style="font-size:0.82rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin:0;">Melbourne Airport Transfers</p>
        <h1 style="font-size:clamp(2.2rem,5vw,4rem);line-height:1.05;margin:16px 0 18px;color:#111827;">${escapeHtml(
          suburb?.seo?.h1 || `Airport Transfers from ${suburb.name}`
        )}</h1>
        <p style="font-size:1.12rem;line-height:1.75;color:#4b5563;margin:0 0 24px;">
          ${escapeHtml(
            normalizeText(
              suburb?.content?.intro ||
                `Book a reliable airport transfer from ${suburb.name} (${suburb.postcode}) to Melbourne Airport with fixed pricing, professional drivers, and 24/7 availability.`
            )
          )}
        </p>
        ${
          suburb?.content?.localityNote
            ? `<p style="font-size:1rem;line-height:1.8;color:#374151;margin:0 0 28px;">${escapeHtml(
                normalizeText(suburb.content.localityNote)
              )}</p>`
            : ''
        }
        ${
          highlights.length
            ? `<section style="margin-top:30px;">
                <h2 style="font-size:1.55rem;line-height:1.2;margin:0 0 16px;color:#111827;">Why travellers book from ${escapeHtml(
                  suburb.name
                )}</h2>
                <ul style="padding-left:20px;margin:0;color:#374151;line-height:1.8;">
                  ${highlights.map((item) => `<li>${escapeHtml(normalizeText(item))}</li>`).join('')}
                </ul>
              </section>`
            : ''
        }
        ${
          faqs.length
            ? `<section style="margin-top:36px;">
                <h2 style="font-size:1.55rem;line-height:1.2;margin:0 0 16px;color:#111827;">FAQs for ${escapeHtml(
                  suburb.name
                )}</h2>
                ${faqs
                  .map(
                    (faq) => `<div style="margin-bottom:18px;">
                      <h3 style="font-size:1.05rem;margin:0 0 8px;color:#111827;">${escapeHtml(faq.q)}</h3>
                      <p style="font-size:1rem;line-height:1.75;margin:0;color:#4b5563;">${escapeHtml(
                        normalizeText(faq.a)
                      )}</p>
                    </div>`
                  )
                  .join('')}
              </section>`
            : ''
        }
      </article>
    </main>`;
}

function buildStaticRoutes() {
  return [
    {
      routePath: '/',
      title: 'Melbourne Airport Taxi | Fixed Fare Airport Transfers - Prime Cabs Melbourne',
      description:
        'Book a reliable Melbourne Airport taxi with Prime Cabs Melbourne. 24/7 airport transfers, fixed fares, no surge pricing, professional drivers.',
      ogImage: '/assets/images/home-hero-paid-pc.webp',
      schema: {
        ...buildOrganizationSchema(),
        '@type': 'TaxiService',
        serviceType: 'Airport Transfer Taxi',
        description:
          '24/7 airport transfer taxi service in Melbourne with fixed fares, clean vehicles, and professional drivers.',
      },
      bodyMarkup: renderShellPage({
        eyebrow: 'Melbourne Airport Transfers',
        title: 'Reach the airport on time, without the stress.',
        description:
          'Professional Melbourne airport transfers with fixed fares, clean vehicles, and quick online booking.',
        bullets: ['Trusted by Melbourne travellers', 'No surprise surge pricing', 'Fast online booking'],
      }),
    },
    {
      routePath: '/airport-taxi-melbourne',
      title: 'Melbourne Airport Taxi Transfers | Prime Cabs Melbourne',
      description:
        'Book affordable, fast and professional airport taxis in Melbourne. Fixed fares, 24/7 service to Tullamarine and Avalon Airport.',
      ogImage: '/assets/images/airport-hero.webp',
      schema: {
        ...buildOrganizationSchema(),
        '@type': 'Service',
        serviceType: 'Airport Transfer Taxi',
        name: 'Melbourne Airport Taxi Transfers - Prime Cabs',
        areaServed: ['Melbourne', 'Tullamarine Airport', 'Avalon Airport'],
      },
      bodyMarkup: renderShellPage({
        eyebrow: 'Airport Taxi Melbourne',
        title: 'Melbourne Airport Taxi Transfers',
        description:
          'Tullamarine, Avalon, family travel, executive pickups, and 24/7 fixed-fare airport rides across Melbourne.',
        bullets: ['Fixed fares', '24/7 service', 'Professional drivers', 'Group vehicles available'],
      }),
    },
    {
      routePath: '/airport-transfer/melbourne',
      title: 'Melbourne Airport Transfers by Suburb | Prime Cabs Melbourne',
      description:
        'Browse all Melbourne suburbs for airport transfer taxi bookings. Reliable pickups, fixed fares, and 24/7 availability.',
      ogImage: '/assets/images/prime-cabs-og.webp',
      schema: {
        ...buildOrganizationSchema(),
        '@type': 'CollectionPage',
        name: 'Melbourne Airport Transfers by Suburb',
        url: `${baseUrl}/airport-transfer/melbourne`,
      },
      bodyMarkup: renderShellPage({
        eyebrow: 'Airport Transfer Hub',
        title: 'Melbourne Airport Transfers by Suburb',
        description:
          'Explore suburb-specific airport transfer pages across Melbourne with fixed fares, local route coverage, and fast online booking.',
        bullets: ['Suburb landing pages', 'Fixed-fare quotes', '24/7 Melbourne coverage'],
      }),
    },
    {
      routePath: '/services',
      title: 'Our Taxi Services | Prime Cabs Melbourne',
      description:
        'Explore our Melbourne taxi services including airport transfers, hotel pickups, business rides, and long-distance travel.',
      ogImage: '/assets/images/prime-cabs-og.webp',
      schema: {
        ...buildOrganizationSchema(),
        '@type': 'Service',
        serviceType: 'Taxi services',
        name: 'Prime Cabs Melbourne Services',
      },
      bodyMarkup: renderShellPage({
        eyebrow: 'Services',
        title: 'Transport services designed for comfort, reliability and time-saving.',
        description:
          'From airport transfers to corporate bookings and private tours, choose a service that fits your trip.',
        bullets: ['Airport specialists', 'Business travel', 'Private tours', 'Group transport'],
      }),
    },
    {
      routePath: '/contact',
      title: 'Contact Prime Cabs Melbourne | 24/7 Airport Taxi Booking and Support',
      description:
        'Contact Prime Cabs for reliable Melbourne airport taxi bookings. 24/7 support for Tullamarine, Avalon, and Melbourne suburbs.',
      ogImage: '/assets/images/prime-cabs-og.webp',
      schema: buildOrganizationSchema(),
      bodyMarkup: renderShellPage({
        eyebrow: 'Contact',
        title: 'Contact Prime Cabs Melbourne',
        description:
          'Reach out for 24/7 Melbourne airport transfers, ride bookings, or fare quotes. We are here to help fast and clearly.',
        bullets: ['24/7 support', 'Fast response', 'Fixed fare quotes'],
        ctaLabel: 'Contact us',
        ctaHref: '/contact',
      }),
    },
  ];
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Request failed with status ${res.statusCode} for ${url}`));
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
  });
}

async function loadPublishedBlogs() {
  if (!apiBaseUrl) {
    console.warn('[prerender] VITE_API_BASE_URL missing. Skipping blog prerender.');
    return [];
  }

  const listResponse = await requestJson(`${apiBaseUrl}/api/blogs`);
  const blogs = Array.isArray(listResponse?.blogs) ? listResponse.blogs : [];
  const detailedBlogs = [];

  for (const blog of blogs) {
    if (!blog?.slug) continue;
    const detailResponse = await requestJson(`${apiBaseUrl}/api/blogs/${blog.slug}`);
    if (detailResponse?.success && detailResponse.blog) {
      detailedBlogs.push(detailResponse.blog);
    }
  }

  return detailedBlogs;
}

async function prerenderStaticRoutes(shellHtml) {
  const routes = buildStaticRoutes();

  for (const route of routes) {
    const canonicalUrl = `${baseUrl}${route.routePath === '/' ? '/' : route.routePath}`;
    const html = injectHtmlDocument(shellHtml, {
      headMarkup: buildMetaTags({
        title: route.title,
        description: route.description,
        canonicalUrl,
        ogImage: route.ogImage,
        schema: route.schema,
      }),
      bodyMarkup: route.bodyMarkup,
    });
    await writeRouteHtml(route.routePath, html);
  }

  console.log(`[prerender] Generated ${routes.length} core route snapshots.`);
}

async function prerenderBlogs(shellHtml) {
  const blogs = await loadPublishedBlogs();

  for (const blog of blogs) {
    const routePath = `/blog/${blog.slug}`;
    const canonicalUrl = `${baseUrl}${routePath}`;
    const title = blog.metaTitle || `${blog.title} | Prime Cabs Melbourne`;
    const description =
      blog.metaDescription || blog.excerpt || blog.subtitle || 'Prime Cabs Melbourne blog article.';
    const html = injectHtmlDocument(shellHtml, {
      headMarkup: buildMetaTags({
        title,
        description,
        canonicalUrl,
        ogImage: blog.ogImage || blog.image1,
        type: 'article',
        schema: buildBlogSchema(blog, canonicalUrl),
      }),
      bodyMarkup: buildBlogBody(blog),
      dataScript: buildDataScript({
        routeType: 'blog',
        routePath,
        blog,
      }),
    });

    await writeRouteHtml(routePath, html);
  }

  console.log(`[prerender] Generated ${blogs.length} blog route snapshots.`);
}

async function prerenderSuburbs(shellHtml) {
  const suburbs = await loadSuburbs();
  let count = 0;

  for (const suburb of suburbs) {
    if (!suburb?.slug) continue;

    const routePath = `/airport-transfer/melbourne/${suburb.slug}`;
    const canonicalUrl = `${baseUrl}${routePath}`;
    const title =
      suburb?.seo?.title ||
      `Melbourne Airport transfers from ${suburb.name} (${suburb.postcode}) | Fixed Price Taxi | Prime Cabs Melbourne`;
    const description =
      suburb?.seo?.metaDescription ||
      `Book a reliable taxi for Melbourne Airport transfers from ${suburb.name} (${suburb.postcode}). Fixed prices, 24/7 service, flight tracking, professional drivers.`;

    const html = injectHtmlDocument(shellHtml, {
      headMarkup: buildMetaTags({
        title,
        description,
        canonicalUrl,
        ogImage: suburb?.seo?.ogImage || '/assets/images/prime-cabs-og.webp',
        schema: buildSuburbSchema(suburb, canonicalUrl, description),
      }),
      bodyMarkup: buildSuburbBody(suburb),
      dataScript: buildDataScript({
        routeType: 'suburb',
        routePath,
        suburb,
      }),
    });

    await writeRouteHtml(routePath, html);
    count += 1;
  }

  console.log(`[prerender] Generated ${count} suburb route snapshots.`);
}

async function main() {
  const shellHtml = await loadShellTemplate();
  await prerenderStaticRoutes(shellHtml);
  await prerenderSuburbs(shellHtml);
  await prerenderBlogs(shellHtml);
}

main().catch((error) => {
  console.error('[prerender] Failed:', error);
  process.exitCode = 1;
});
