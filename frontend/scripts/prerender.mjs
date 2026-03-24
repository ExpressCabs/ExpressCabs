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

function injectHtmlDocument(shellHtml, { headMarkup, bodyMarkup }) {
  let output = shellHtml;
  output = output.replace('</head>', `${headMarkup}\n  </head>`);
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

function buildMetaTags({ title, description, canonicalUrl, ogImage, type = 'website', schema }) {
  const image = absoluteUrl(ogImage);
  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
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

function buildBlogSchema(blog, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt || blog.subtitle || '',
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
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

  try {
    const listResponse = await requestJson(`${apiBaseUrl}/api/blogs`);
    const blogs = Array.isArray(listResponse?.blogs) ? listResponse.blogs : [];
    const detailedBlogs = [];

    for (const blog of blogs) {
      if (!blog?.slug) continue;

      try {
        const detailResponse = await requestJson(`${apiBaseUrl}/api/blogs/${blog.slug}`);
        if (detailResponse?.success && detailResponse.blog) {
          detailedBlogs.push(detailResponse.blog);
        }
      } catch (error) {
        console.warn(`[prerender] Skipping blog ${blog.slug}: ${error.message}`);
      }
    }

    return detailedBlogs;
  } catch (error) {
    console.warn(`[prerender] Unable to load blog data: ${error.message}`);
    return [];
  }
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
    });

    await writeRouteHtml(routePath, html);
    count += 1;
  }

  console.log(`[prerender] Generated ${count} suburb route snapshots.`);
}

async function main() {
  const shellHtml = await loadShellTemplate();
  await prerenderSuburbs(shellHtml);
  await prerenderBlogs(shellHtml);
}

main().catch((error) => {
  console.error('[prerender] Failed:', error);
  process.exitCode = 1;
});
