import { Metadata } from 'next';
import { DEFAULT_LOCALE, isTranslatedPath, localizePath, type Locale } from '@/lib/i18n/locale';

const BASE = process.env.APP_URL || 'https://fpvlovers.com.tr';
const DEFAULT_OG_IMAGE = `${BASE}/api/content/media/cover/site-default`;

export function generateSeoMetadata({
  title,
  description,
  path,
  ogImage,
  type = 'article',
  publishedAt,
  locale = DEFAULT_LOCALE,
}: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
	  type?: 'article' | 'website' | 'product';
  publishedAt?: string;
  locale?: Locale;
}): Metadata {
  const canonicalPath = localizePath(path, locale);
  const url = `${BASE}${canonicalPath}`;
  const languages = isTranslatedPath(path)
    ? {
        en: `${BASE}${path}`,
        tr: `${BASE}${localizePath(path, 'tr')}`,
        'x-default': `${BASE}${path}`,
      }
    : undefined;

  return {
    title,
    description,
    alternates: languages ? { canonical: url, languages } : { canonical: url },
    openGraph: {
      title,
      description,
      url,
	      type: type === 'product' ? 'website' : type,
      images: [{ url: ogImage || DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
      ...(publishedAt && { publishedTime: publishedAt }),
      siteName: 'FPV Lovers',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
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
