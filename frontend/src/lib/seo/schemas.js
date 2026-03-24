import { buildCanonicalUrl } from './routes';

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Prime Cabs Melbourne',
    url: buildCanonicalUrl('/'),
  };
}

export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Prime Cabs Melbourne',
    url: buildCanonicalUrl('/'),
    telephone: '+61488797233',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'VIC',
      addressCountry: 'AU',
    },
  };
}

export function buildTaxiServiceSchema({ url, name, description, areaServed = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TaxiService',
    name,
    url,
    description,
    areaServed,
  };
}

export function buildBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export function buildFaqSchema(faqs = []) {
  if (!Array.isArray(faqs) || !faqs.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

export function buildBlogPostingSchema({ blog, canonicalUrl }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt || blog.subtitle || '',
    datePublished: (blog.publishedAt || blog.createdAt)?.toISOString?.() || undefined,
    dateModified: (blog.updatedAt || blog.publishedAt || blog.createdAt)?.toISOString?.() || undefined,
    author: {
      '@type': 'Person',
      name: blog.authorName || 'Prime Cabs Melbourne',
    },
    image: [blog.ogImage || blog.image1].filter(Boolean).map((value) => (
      /^https?:\/\//i.test(value) ? value : buildCanonicalUrl(value)
    )),
    mainEntityOfPage: canonicalUrl,
  };
}
