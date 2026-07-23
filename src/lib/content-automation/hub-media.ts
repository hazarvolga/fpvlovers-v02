import { buildCoverImageUrl } from './content-media';

/**
 * Hub artwork is generated per route, rather than reusing a category fallback
 * image. The endpoint remains copyright-safe while producing a distinct,
 * cacheable visual for each public surface.
 */
export const HUB_COVER_IMAGES = {
  academy: buildCoverImageUrl('hub-academy'),
  buyersGuides: buildCoverImageUrl('hub-buyers-guides'),
  tools: buildCoverImageUrl('hub-tools'),
  archive: buildCoverImageUrl('hub-archive'),
  racing: buildCoverImageUrl('hub-racing'),
  reviews: buildCoverImageUrl('hub-reviews'),
  comparisons: buildCoverImageUrl('hub-comparisons'),
  search: buildCoverImageUrl('hub-search'),
  glossary: buildCoverImageUrl('hub-glossary'),
  roadmap: buildCoverImageUrl('hub-roadmap'),
} as const;

export function buildTopicHubCover(topic: string): string {
  return buildCoverImageUrl(`hub-topic-${topic}`);
}

export function buildComponentHubCover(component: string): string {
  return buildCoverImageUrl(`hub-component-${component}`);
}
