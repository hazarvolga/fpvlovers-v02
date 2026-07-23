import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { buildFallbackHomepageCards } from './homepage-defaults';
import { firstWaveContentPlan } from '@/lib/content-plan';
import { buildCoverImageUrl } from '@/lib/content-automation/content-media';
import { resolveFallbackCover } from '@/lib/content-automation/fallback-cover';
import {
  resolveHomepageFallbackCover,
  shouldPreferHomepageFallbackCover,
} from './homepage-media';

export type HomepageSectionCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  href: string;
  coverImage?: string;
  coverImageAlt?: string;
  fallbackCoverImage?: string;
  tier?: 'pillar' | 'support';
  views?: number;
};

export type HomepageContentModel = {
  archiveCount: number;
  featuredGuides: HomepageSectionCard[];
  recentPosts: HomepageSectionCard[];
  editorsPicks: HomepageSectionCard[];
  academyCards: {
    title: string;
    description: string;
    href: string;
    label: string;
  }[];
  engineeringCards: {
    title: string;
    description: string;
    href: string;
    label: string;
  }[];
  toolCards: {
    title: string;
    description: string;
    href: string;
    label: string;
  }[];
  sponsorSlot: {
    title: string;
    description: string;
    href?: string;
  };
};

const PILLAR_CATEGORIES = new Set([
  'Flight Guides',
  'Build Guides',
  'Troubleshooting',
  'Components',
]);

const registryBySlug = new Map<string, typeof firstWaveContentPlan[number]>(
  firstWaveContentPlan.map((e) => [e.slug, e]),
);

function tierFromRegistry(slug: string): 'pillar' | 'support' | undefined {
  return registryBySlug.get(slug)?.tier;
}

function estimateReadingTime(content: PublishedArtifact): string {
  const text = content.bodySections?.map((s) => s.content).join(' ') || '';
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

function formatPublishedDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Seed content') return 'Seed content';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Seed content';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Seed content';
  }
}

function toHomepageCard(item: PublishedArtifact, tier?: 'pillar' | 'support'): HomepageSectionCard {
  const primaryCoverImage = item.media?.coverImage?.src
    || item.coverImage
    || buildCoverImageUrl(item.slug);
  const fallbackCoverImage = resolveHomepageFallbackCover(item);
  const coverImage = shouldPreferHomepageFallbackCover(primaryCoverImage)
    ? fallbackCoverImage
    : primaryCoverImage;

  return {
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt || item.seo?.metaDescription || '',
    category: item.category,
    readingTime: estimateReadingTime(item),
    publishedAt: formatPublishedDate(item.publishedAt),
    href: `/article/${item.slug}`,
    coverImage,
    coverImageAlt: item.media?.coverImage?.alt || `${item.title} cover illustration`,
    fallbackCoverImage,
    tier,
  };
}

function sortByDate(cards: HomepageSectionCard[]): HomepageSectionCard[] {
  return [...cards].sort((a, b) => {
    const aIsSeed = a.publishedAt === 'Seed content';
    const bIsSeed = b.publishedAt === 'Seed content';
    if (aIsSeed && !bIsSeed) return 1;
    if (!aIsSeed && bIsSeed) return -1;
    if (aIsSeed && bIsSeed) return 0;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export async function resolveHomepageContent(): Promise<HomepageContentModel> {
  const published = await listPublishedContentAsync();
  const fallbackCards = buildFallbackHomepageCards().map((card) => ({
    ...card,
    fallbackCoverImage: resolveFallbackCover({ category: card.category }),
  }));

  let viewCounts: Record<string, number> = {};
  try {
    const { getArticleViewCounts } = await import('@/lib/server/analytics-store');
    viewCounts = await getArticleViewCounts();
  } catch (err) {
    console.warn('[resolveHomepageContent] Failed to fetch article view counts:', err);
  }

  const publishedCards = published.map((item) => {
    const tier = tierFromRegistry(item.slug);
    const card = toHomepageCard(item, tier);
    card.views = viewCounts[item.slug] || 0;
    return card;
  });

  const uniqueBySlug = new Map<string, HomepageSectionCard>();
  for (const card of fallbackCards) {
    card.views = viewCounts[card.slug] || 0;
    uniqueBySlug.set(card.slug, card);
  }
  for (const card of publishedCards) {
    uniqueBySlug.set(card.slug, card);
  }

  const merged = sortByDate([...uniqueBySlug.values()]);

  const featuredGuides = merged
    .filter((item) => item.tier === 'pillar' || PILLAR_CATEGORIES.has(item.category))
    .slice(0, 3);

  const recentPosts = merged.slice(0, 12);

  const editorsPicks = merged
    .filter((item) => item.tier === 'support' || !PILLAR_CATEGORIES.has(item.category))
    .slice(0, 3);

  return {
    archiveCount: publishedCards.length,
    featuredGuides,
    recentPosts,
    editorsPicks,
    academyCards: [
      { title: 'Pilot Roadmap', description: 'The beginner-first path from simulator to first flights.', href: '/academy/roadmap', label: 'Roadmap' },
      { title: 'Starter Kits', description: 'What to buy first and why it matters.', href: '/academy/starter-kits', label: 'Start Here' },
      { title: 'FPV Glossary', description: 'Decode the acronyms and setup terms.', href: '/academy/glossary', label: 'Glossary' },
      { title: 'Simulators', description: 'Practice before the first real flight.', href: '/academy/simulators', label: 'Practice' },
    ],
    engineeringCards: [
      { title: 'Hardware Data', description: 'Motors, ESCs, FCs, and video systems.', href: '/engineering/hardware', label: 'Reference' },
      { title: 'Propeller Lab', description: 'Prop size, pitch, blade count, and vibration.', href: '/engineering/hardware#props', label: 'High Friction' },
      { title: 'Firmware Tuning', description: 'Betaflight PID, EdgeTX, and ELRS setup.', href: '/engineering/firmware', label: 'Workflow' },
      { title: 'Workshop Masterclass', description: 'Soldering, repair, and maintenance.', href: '/engineering/workshop', label: 'Repair' },
    ],
    toolCards: [
      { title: 'Build Calculator', description: 'Weight, thrust, KV, and battery sizing.', href: '/tools/calculator', label: 'Priority 1' },
      { title: 'Blackbox Tuning', description: 'Log analysis, vibration review, and tuning guidance.', href: '/tools/blackbox-tuning', label: 'Priority 2' },
      { title: 'Component Duel', description: 'Side-by-side FPV part comparison.', href: '/tools/component-duel', label: 'Priority 3' },
    ],
    sponsorSlot: {
      title: 'Featured Partner',
      description: 'Strategic sponsor slot kept below the hero and above secondary content.',
    },
  };
}
