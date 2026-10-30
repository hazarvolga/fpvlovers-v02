import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n/locale';
import { buildCoverImageUrl } from '@/lib/content-automation/content-media';

const SITE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';
const DEFAULT_SITE_COVER = buildCoverImageUrl('site-default');

// Baseline Organization/WebSite structured data for every page. Article pages layer
// their own Article/BreadcrumbList/Review schema on top of this via their own script tag.
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'FPVLovers',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-type.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'FPVLovers',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export const SITE_JSON_LD = JSON.stringify(siteJsonLd).replace(/</g, '\\u003c');

export function buildRootMetadata(locale: Locale = 'en'): Metadata {
  const base = new URL(SITE_URL);
  const common = {
    metadataBase: base,
    icons: { icon: '/logo-type.png', shortcut: '/logo-type.png' },
  } as const;

  if (locale === 'tr') {
    return {
      ...common,
      title: 'FPVLovers | FPV Öğren, Topla, Uç',
      description: 'FPV rehberleri, ekipman seçimi, kurallar ve pratik araçlar. Sıfırdan başlayanlar için sade Türkçe anlatım.',
      keywords: ['FPV', 'Türkçe', 'Başlangıç', 'Drone', 'Simülatör', 'SHGM', 'Rehber'],
      alternates: { canonical: '/tr' },
      openGraph: {
        type: 'website',
        siteName: 'FPVLovers',
        title: 'FPVLovers | FPV Öğren, Topla, Uç',
        description: 'Sıfırdan başlayanlar için Türkçe FPV rehberleri.',
        images: [{ url: DEFAULT_SITE_COVER, width: 1200, height: 675, alt: 'FPVLovers FPV rehberleri' }],
        locale: 'tr_TR',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'FPVLovers | FPV Öğren, Topla, Uç',
        description: 'Sıfırdan başlayanlar için Türkçe FPV rehberleri.',
        images: [DEFAULT_SITE_COVER],
      },
    };
  }

  return {
    ...common,
    title: 'FPV LOVERS | Learn, Build, Race, Fly, Tools, News',
    description: 'English-first FPV guides, engineering references, and practical pilot tools for building, tuning, and learning faster.',
    keywords: ['FPV', 'Learn', 'Build', 'Race', 'Fly', 'Tools', 'News', 'Build Guides', 'Troubleshooting'],
    openGraph: {
      type: 'website',
      siteName: 'FPVLovers',
      title: 'FPVLovers | Learn, Build, Race, Fly',
      description: 'English-first FPV guides, engineering references, and practical pilot tools.',
      images: [{ url: DEFAULT_SITE_COVER, width: 1200, height: 675, alt: 'FPVLovers FPV editorial guides' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'FPVLovers | Learn, Build, Race, Fly',
      description: 'English-first FPV guides, engineering references, and practical pilot tools.',
      images: [DEFAULT_SITE_COVER],
    },
  };
}
