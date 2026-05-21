import { listPublishedContent, type PublishedArtifact } from '@/lib/content-automation/content-reader';

export type SeoMetadata = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
  readingTime: string;
  wordCount: number;
  lastModified: string;
};

function estimateWordCount(article: PublishedArtifact): number {
  const text = article.bodySections?.map((s) => s.content).join(' ') || '';
  return text.split(/\s+/).filter(Boolean).length;
}

function estimateReadingTime(wordCount: number): string {
  return `${Math.max(1, Math.round(wordCount / 200))} min read`;
}

export function generateSeoMetadata(): SeoMetadata[] {
  const articles = listPublishedContent();

  return articles.map((article) => {
    const wordCount = estimateWordCount(article);
    const readingTime = estimateReadingTime(wordCount);

    return {
      slug: article.slug,
      title: article.title,
      description: article.excerpt || article.seo?.metaDescription || article.title,
      keywords: article.seo?.keywords || [],
      ogImage: `/api/content/media/cover/${article.slug}`,
      canonical: `https://fpvlovers.com.tr/article/${article.slug}`,
      readingTime,
      wordCount,
      lastModified: article.publishedAt || new Date().toISOString(),
    };
  });
}

export function generateSitemapEntries(): { url: string; priority: number; changefreq: string }[] {
  const articles = listPublishedContent();
  const homepage = [{ url: 'https://fpvlovers.com.tr', priority: 1.0, changefreq: 'daily' }];

  const pages = [
    { url: 'https://fpvlovers.com.tr/academy', priority: 0.9, changefreq: 'weekly' },
    { url: 'https://fpvlovers.com.tr/engineering', priority: 0.9, changefreq: 'weekly' },
    { url: 'https://fpvlovers.com.tr/tools', priority: 0.8, changefreq: 'weekly' },
    { url: 'https://fpvlovers.com.tr/archive', priority: 0.7, changefreq: 'weekly' },
    { url: 'https://fpvlovers.com.tr/regulations', priority: 0.7, changefreq: 'monthly' },
  ];

  const articlePages = articles.map((a) => ({
    url: `https://fpvlovers.com.tr/article/${a.slug}`,
    priority: 0.8,
    changefreq: 'monthly',
  }));

  return [...homepage, ...pages, ...articlePages];
}
