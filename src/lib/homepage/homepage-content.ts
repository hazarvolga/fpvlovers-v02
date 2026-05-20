import { listPublishedContent, type PublishedArtifact } from '@/lib/content-automation/content-reader';

export type HomepageSectionCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  href: string;
  coverImage?: string;
  tier?: 'pillar' | 'support';
};

export type HomepageContentModel = {
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

function estimateReadingTime(content: PublishedArtifact): string {
  const text = content.bodySections?.map((s) => s.content).join(' ') || '';
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

function toHomepageCard(item: PublishedArtifact): HomepageSectionCard {
  return {
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt || item.seo?.metaDescription || '',
    category: item.category,
    readingTime: estimateReadingTime(item),
    publishedAt: item.publishedAt
      ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
    href: `/article/${item.slug}`,
  };
}

export function resolveHomepageContent(): HomepageContentModel {
  const published = listPublishedContent();
  const cards = published.map(toHomepageCard);

  const featuredGuides = cards
    .filter((item) => PILLAR_CATEGORIES.has(item.category))
    .slice(0, 3);

  const recentPosts = [...cards].slice(0, 6);

  const editorsPicks = cards
    .filter((item) => !PILLAR_CATEGORIES.has(item.category))
    .slice(0, 3);

  return {
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
      { title: 'Propeller Lab', description: 'Prop size, pitch, blade count, and vibration.', href: '/engineering/hardware', label: 'High Friction' },
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
