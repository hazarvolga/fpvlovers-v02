import type { Difficulty } from '@/lib/content-metadata';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';

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

const GROUP_LABELS_TR: Record<GuideGroupId, { label: string; description: string }> = {
  flying: { label: 'Uçuş Teknikleri', description: 'Kurulum, pratik planı ve uçuş tekniği.' },
  building: { label: 'Toplama ve Parçalar', description: 'Bileşenler, yapımlar, güç, radyo linki ve gövdeler.' },
  tuning: { label: 'Ayar ve Betaflight', description: 'PID ayarı, filtreler ve uçuş kontrolcüsü kurulumu.' },
  troubleshooting: { label: 'Sorun Giderme', description: 'Görüntü yok, arm olmuyor, failsafe ve diğer yaygın sorunlar.' },
  buying: { label: 'Satın Alma', description: 'Satın alma rehberleri, incelemeler ve karşılaştırmalar.' },
  'rules-safety': { label: 'Kurallar ve Güvenlik', description: 'Mevzuat, hava sahası ve güvenli uçuş.' },
  racing: { label: 'Yarış', description: 'Yarış formatları, etkinlikler ve müsabaka.' },
};

const LEVEL_LABELS_TR: Record<ReaderLevel, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

export function getGuideGroupLabel(group: GuideGroup, locale: Locale = DEFAULT_LOCALE): string {
  return locale === 'tr' ? GROUP_LABELS_TR[group.id].label : group.label;
}

export function getGuideGroupDescription(group: GuideGroup, locale: Locale = DEFAULT_LOCALE): string {
  return locale === 'tr' ? GROUP_LABELS_TR[group.id].description : group.description;
}

export function getReaderLevelLabel(level: ReaderLevel, locale: Locale = DEFAULT_LOCALE): string {
  return locale === 'tr' ? LEVEL_LABELS_TR[level] : (READER_LEVELS.find((item) => item.id === level)?.label ?? level);
}
