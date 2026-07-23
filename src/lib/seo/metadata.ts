import { Metadata } from 'next';

const BASE = process.env.APP_URL || 'https://fpvlovers.com.tr';
const DEFAULT_OG_IMAGE = `${BASE}/api/content/media/cover/site-default`;

export function generateSeoMetadata({
  title,
  description,
  path,
  ogImage,
  type = 'article',
  publishedAt,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
	  type?: 'article' | 'website' | 'product';
  publishedAt?: string;
}): Metadata {
  const url = `${BASE}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
	      type: type === 'product' ? 'website' : type,
      images: [{ url: ogImage || DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
      ...(publishedAt && { publishedTime: publishedAt }),
      siteName: 'FPV Lovers',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage || DEFAULT_OG_IMAGE],
    },
    robots: { index: true, follow: true },
  };
}

export function generateArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author = 'FPV Lovers',
  image,
  section,
  wordCount,
  citations = [],
}: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  image?: string;
  section?: string;
  wordCount?: number;
  citations?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(image && { image: [image] }),
    ...(section && { articleSection: section }),
    ...(wordCount && { wordCount }),
    ...(citations.length > 0 && { citation: citations }),
    author: { '@type': 'Organization', name: author },
    publisher: { '@type': 'Organization', name: 'FPV Lovers', logo: { '@type': 'ImageObject', url: `${BASE}/logo-type.png` } },
  };
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
