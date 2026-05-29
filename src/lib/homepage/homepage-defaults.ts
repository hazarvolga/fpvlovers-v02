import { firstWaveContentPlan } from '@/lib/content-plan';
import type { HomepageSectionCard } from './homepage-content';
import { buildContentMedia } from '@/lib/content-automation/content-media';

export function buildFallbackHomepageCards(): HomepageSectionCard[] {
  return firstWaveContentPlan.map((item) => {
    const media = buildContentMedia({
      slug: item.slug,
      title: item.title,
      category: item.category,
      excerpt: item.summary,
    });

    return {
      slug: item.slug,
      title: item.title,
      excerpt: item.summary,
      category: item.category,
      readingTime: `${Math.max(1, Math.round(item.estimatedWordCount / 200))} min read`,
      publishedAt: 'Seed content',
      href: `/article/${item.slug}`,
      tier: item.tier,
      coverImage: media.coverImage.src,
      coverImageAlt: media.coverImage.alt,
    };
  });
}
