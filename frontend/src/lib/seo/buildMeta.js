import { buildCanonicalUrl } from './routes';

const DEFAULT_OG_IMAGE = '/assets/images/prime-cabs-og.webp';

export function buildMeta({
  title,
  description,
  canonicalPath,
  robots = 'index,follow',
  ogImage = DEFAULT_OG_IMAGE,
  type = 'website',
  siteName = 'Prime Cabs Melbourne',
}) {
  const canonical = buildCanonicalUrl(canonicalPath);
  const normalizedOgImage = /^https?:\/\//i.test(ogImage)
    ? ogImage
    : buildCanonicalUrl(ogImage);

  return {
    title,
    description,
    canonical,
    robots,
    openGraph: {
      type,
      siteName,
      url: canonical,
      title,
      description,
      image: normalizedOgImage,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: normalizedOgImage,
    },
  };
}
