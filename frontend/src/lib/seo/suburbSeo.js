import { buildMeta } from './buildMeta';
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildTaxiServiceSchema,
  buildWebsiteSchema,
} from './schemas';
import { buildCanonicalUrl, getCanonicalPathForSuburb } from './routes';

export function buildSuburbSeo(suburb) {
  const canonicalPath = getCanonicalPathForSuburb(suburb.slug);
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const title =
    suburb?.seo?.title ||
    `Melbourne Airport transfers from ${suburb.name} (${suburb.postcode}) | Fixed Price Taxi | Prime Cabs Melbourne`;
  const description =
    suburb?.seo?.metaDescription ||
    `Book a reliable taxi for Melbourne Airport transfers from ${suburb.name} (${suburb.postcode}). Fixed prices, 24/7 service, flight tracking, professional drivers.`;

  const meta = buildMeta({
    title,
    description,
    canonicalPath,
    ogImage: suburb?.seo?.ogImage || '/assets/images/prime-cabs-og.webp',
  });

  const areaServedName = `${suburb.name} VIC ${suburb.postcode}`;
  const schemas = [
    buildWebsiteSchema(),
    buildTaxiServiceSchema({
      url: canonicalUrl,
      name: `Airport Transfers from ${suburb.name} to Melbourne Airport`,
      description,
      areaServed: [{ '@type': 'Place', name: areaServedName }],
    }),
    buildBreadcrumbSchema([
      { name: 'Home', item: buildCanonicalUrl('/') },
      { name: 'Airport Transfers', item: buildCanonicalUrl('/airport-transfer/melbourne') },
      { name: `${suburb.name} ${suburb.postcode}`, item: canonicalUrl },
    ]),
  ];

  const faqSchema = buildFaqSchema(suburb?.content?.faqs || []);
  if (faqSchema) schemas.push(faqSchema);

  return { meta, canonicalPath, canonicalUrl, schemas };
}
