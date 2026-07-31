import type { ContentBrief } from '@/lib/content-types';
import type { ContentJob, ContentTemplate } from './types';

const CATEGORY_TEMPLATE_MAP: Record<string, ContentTemplate> = {
  'Flight Guides': 'tech-article',
  'Build Guides': 'build-guide',
  Troubleshooting: 'troubleshooting',
  Components: 'comparison',
  Racing: 'community-roundup',
  Regulations: 'regulation-guide',
  'News and Reviews': 'tech-article',
};

const PILLAR_TEMPLATE: ContentTemplate = 'build-guide';
const SUPPORT_TEMPLATE: ContentTemplate = 'tech-article';

// Editorial FPV sites that carry actual photography — used by harvestImagesFromDatabase()
// to find real images in the raw_content table.
// Rules: pick sites that (a) were/are crawled, (b) have editorial photography, not just docs.
const CATEGORY_SOURCE_HINTS: Record<string, string[]> = {
  'Flight Guides': [
    'https://oscarliang.com/',
    'https://www.rotorriot.com/',
  ],
  'Build Guides': [
    'https://oscarliang.com/',
    'https://www.fpvknowitall.com/',
  ],
  Troubleshooting: [
    'https://oscarliang.com/',
    'https://www.rotorriot.com/',
  ],
  Components: [
    'https://oscarliang.com/',
    'https://pyrodrone.com/',
  ],
  Racing: [
    'https://www.rotorriot.com/',
    'https://www.multigp.com/',
  ],
  Regulations: [
    'https://oscarliang.com/',
    'https://www.rotorriot.com/',
  ],
  'News and Reviews': [
    'https://www.rotorriot.com/',
    'https://oscarliang.com/',
  ],
};

function sourceHintsForEntry(entry: ContentBrief): string[] {
  const categorySources = CATEGORY_SOURCE_HINTS[entry.category] || [];
  // Keep the stable source domains, but add article-specific terms so the
  // image harvester can rank candidates for this article instead of returning
  // the same first rows for every category job.
  return [
    ...categorySources,
    entry.title,
    entry.primaryKeyword,
    ...entry.secondaryKeywords,
    entry.whyThisMatters,
  ].filter((hint, index, hints) => hint.trim().length > 0 && hints.indexOf(hint) === index);
}

export function briefFromContentEntry(entry: ContentBrief): ContentJob {
  const template =
    CATEGORY_TEMPLATE_MAP[entry.category] ||
    (entry.tier === 'pillar' ? PILLAR_TEMPLATE : SUPPORT_TEMPLATE);

  return {
    id: `brief-${entry.slug}`,
    briefSlug: entry.slug,
    title: entry.title,
    category: entry.category,
    status: 'brief',
    topic: entry.summary,
    language: 'en',
    template,
    promptVersion: 'v2',
    sourceHints: sourceHintsForEntry(entry),
    seo: {
      slug: entry.slug,
      metaDescription: entry.metaDescription,
      keywords: [entry.primaryKeyword, ...entry.secondaryKeywords],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function briefsFromContentPlan(entries: readonly ContentBrief[]): ContentJob[] {
  return entries.map(briefFromContentEntry);
}

type BriefPriority = { slug: string; priority: number; reason: string };

export function pickNextBestBriefs(
  existingJobSlugs: Set<string>,
  entries: readonly ContentBrief[],
  count: number,
): BriefPriority[] {
  const unpicked = entries.filter((e) => (
    !existingJobSlugs.has(e.slug) &&
    !existingJobSlugs.has(`brief-${e.slug}`)
  ));

  const scored = unpicked.map((entry) => {
    let priority = 0;

    if (entry.tier === 'pillar') priority += 100;
    if (entry.category === 'Troubleshooting') priority += 50;
    if (entry.searchIntent === 'diagnostic') priority += 30;
    if (entry.audience === 'beginner') priority += 20;

    return {
      slug: entry.slug,
      priority,
      reason:
        entry.tier === 'pillar'
          ? 'pillar gap'
          : entry.category === 'Troubleshooting'
            ? 'high-intent troubleshooting'
            : 'support article for pillar cluster',
    };
  });

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, count);
}

export function enqueueBestBriefs(
  entries: readonly ContentBrief[],
  existingJobSlugs: Set<string>,
  count: number,
): ContentJob[] {
  const picked = pickNextBestBriefs(existingJobSlugs, entries, count);
  const bySlug = Object.fromEntries(entries.map((e) => [e.slug, e]));
  return picked.map((p) => briefFromContentEntry(bySlug[p.slug]));
}
