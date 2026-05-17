import { Metadata } from 'next';

const BASE = process.env.APP_URL || 'https://fpvlovers.com.tr';

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
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
      ...(publishedAt && { publishedTime: publishedAt }),
      siteName: 'FPV Lovers',
      locale: 'tr_TR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    robots: { index: true, follow: true },
  };
}

export function generateArticleSchema({
  title,
  description,
  url,
  datePublished,
  author = 'FPV Lovers',
}: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    ...(datePublished && { datePublished, dateModified: datePublished }),
    author: { '@type': 'Organization', name: author },
    publisher: { '@type': 'Organization', name: 'FPV Lovers', logo: { '@type': 'ImageObject', url: `${BASE}/img/oracle-logo.png` } },
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
