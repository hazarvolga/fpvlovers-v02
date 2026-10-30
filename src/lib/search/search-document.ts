import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import type { ContentMetadata } from '@/lib/content-metadata';
import type { Locale } from '@/lib/i18n/locale';
import { normalizeSearchText } from '@/lib/i18n/search-text';

export type SearchDocument = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  metadata?: ContentMetadata;
  searchText: string;
};

/**
 * Builds the searchable blob for one artifact. The blob is folded with the same
 * helper the client uses on the query, so `ucus` finds `Uçuş` in the Turkish
 * tree while English text stays byte-identical to a plain lowercasing.
 */
export function buildSearchDocument(article: PublishedArtifact, locale: Locale): SearchDocument {
  const searchText = normalizeSearchText(
    [
      article.title,
      article.excerpt,
      article.slug,
      article.category,
      article.metadata?.contentType,
      article.metadata?.difficulty,
      ...(article.metadata?.topics || []),
      ...(article.metadata?.discipline || []),
      ...(article.metadata?.audience || []),
      ...(article.metadata?.components || []),
      ...(article.bodySections || []).map((section) => `${section.title} ${section.content}`),
    ].filter(Boolean).join(' '),
    locale,
  );

  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    publishedAt: article.publishedAt,
    metadata: article.metadata,
    searchText,
  };
}
