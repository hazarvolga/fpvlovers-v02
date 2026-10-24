import type { Difficulty } from '@/lib/content-metadata';

/**
 * Reader-facing content taxonomy.
 *
 * Published artifacts carry a fine-grained `category` (14 values today, some
 * with a single article). Readers browse by a small set of guide groups
 * instead. This is a display-level mapping on purpose: production content
 * lives in Postgres and the persistent content volume, so the source
 * categories stay untouched and the mapping can evolve without a data
 * migration.
 */
export type GuideGroupId =
  | 'flying'
  | 'building'
  | 'tuning'
  | 'troubleshooting'
  | 'buying'
  | 'rules-safety'
  | 'racing';

export type GuideGroup = {
  id: GuideGroupId;
  label: string;
  description: string;
  categories: string[];
};

export const GUIDE_GROUPS: GuideGroup[] = [
  {
    id: 'flying',
    label: 'Flying Skills',
    description: 'Setup, practice plans, and flying technique.',
    categories: ['Flight Guides'],
  },
  {
    id: 'building',
    label: 'Building & Parts',
    description: 'Components, builds, power, radio links, and frames.',
    categories: ['Build Guides', 'Components', 'Propulsion', 'Systems', 'Communication'],
  },
  {
    id: 'tuning',
    label: 'Tuning & Betaflight',
    description: 'PID tuning, filters, and flight controller setup.',
    categories: ['Flight Control'],
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    description: 'Fix no video, no arm, failsafes, and other common problems.',
    categories: ['Troubleshooting'],
  },
  {
    id: 'buying',
    label: 'Buying Advice',
    description: 'Buyer guides, reviews, and comparisons.',
    categories: ['Buyer Guides', 'Reviews', 'Comparisons', 'News and Reviews'],
  },
  {
    id: 'rules-safety',
    label: 'Rules & Safety',
    description: 'Regulations, airspace, and safe flying.',
    categories: ['Regulations'],
  },
  {
    id: 'racing',
    label: 'Racing',
    description: 'Race formats, events, and competition.',
    categories: ['Racing'],
  },
];

const groupByCategory = new Map<string, GuideGroup>(
  GUIDE_GROUPS.flatMap((group) => group.categories.map((category) => [category.toLowerCase(), group] as const)),
);

export function getGuideGroup(category: string | undefined): GuideGroup | undefined {
  if (!category) return undefined;
  return groupByCategory.get(category.trim().toLowerCase());
}

export function getGuideGroupById(id: string | undefined): GuideGroup | undefined {
  return GUIDE_GROUPS.find((group) => group.id === id);
}

/** Reader-facing skill levels. `expert` content is presented as Advanced. */
export type ReaderLevel = 'beginner' | 'intermediate' | 'advanced';

export const READER_LEVELS: { id: ReaderLevel; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export function toReaderLevel(difficulty: Difficulty | string | undefined): ReaderLevel | undefined {
  if (difficulty === 'beginner' || difficulty === 'intermediate' || difficulty === 'advanced') return difficulty;
  if (difficulty === 'expert') return 'advanced';
  return undefined;
}

export function getReaderLevelLabel(level: ReaderLevel): string {
  return READER_LEVELS.find((item) => item.id === level)?.label ?? level;
}
