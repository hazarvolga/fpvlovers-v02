import type { Metadata } from 'next';

const BASE = process.env.APP_URL || 'https://fpvlovers.com.tr';

export function legalMetadata({
  title,
  description,
  canonicalPath,
  languages,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  languages?: Record<string, string>;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE}${canonicalPath}`,
      ...(languages
        ? { languages: Object.fromEntries(Object.entries(languages).map(([key, path]) => [key, `${BASE}${path}`])) }
        : {}),
    },
    openGraph: {
      title,
      description,
      url: `${BASE}${canonicalPath}`,
      siteName: 'FPVLovers',
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}
