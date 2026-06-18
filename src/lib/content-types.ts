export const contentCategories = [
  { slug: 'flight-guides', label: 'Flight Guides' },
  { slug: 'build-guides', label: 'Build Guides' },
  { slug: 'troubleshooting', label: 'Troubleshooting' },
  { slug: 'components', label: 'Components' },
  { slug: 'racing', label: 'Racing' },
  { slug: 'regulations', label: 'Regulations' },
  { slug: 'news-reviews', label: 'News and Reviews' },
] as const;

export const contentTiers = ['pillar', 'support'] as const;

export type ContentCategory = (typeof contentCategories)[number]['label'];
export type ContentCategorySlug = (typeof contentCategories)[number]['slug'];
export type ContentTier = (typeof contentTiers)[number];

import { ContentMetadata } from './content-metadata';

export interface ContentBrief {
  slug: string;
  metadata?: ContentMetadata;
  title: string;
  category: ContentCategory;
  tier: ContentTier;
  audience: 'beginner' | 'beginner-to-intermediate' | 'intermediate';
  searchIntent: 'informational' | 'commercial' | 'diagnostic' | 'comparative';
  primaryKeyword: string;
  secondaryKeywords: readonly string[];
  seoTitle: string;
  metaDescription: string;
  summary: string;
  whyThisMatters: string;
  outline: readonly string[];
  estimatedWordCount: number;
}

export const contentCategoryMap = Object.fromEntries(
  contentCategories.map((category) => [category.slug, category]),
) as Record<ContentCategorySlug, (typeof contentCategories)[number]>;

export function isContentCategory(value: string): value is ContentCategory {
  return contentCategories.some((category) => category.label === value);
}

export function isContentTier(value: string): value is ContentTier {
  return (contentTiers as readonly string[]).includes(value);
}
