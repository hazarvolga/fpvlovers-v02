import type { ContentMetadata } from '@/lib/content-metadata';
import { buildCoverImageUrl } from './content-media';

export type FallbackCoverFamily =
  | 'racing'
  | 'freestyle'
  | 'cinematic-long-range'
  | 'academy-beginner'
  | 'build-workshop'
  | 'tuning-betaflight'
  | 'motors-propulsion'
  | 'power-battery-esc'
  | 'video-goggles-vtx'
  | 'radio-elrs-gps'
  | 'commercial'
  | 'safety-regulations'
  | 'generic';

export const FALLBACK_COVER_PATHS: Record<FallbackCoverFamily, string> = {
  racing: '/images/fallbacks/fpv-racing.webp',
  freestyle: '/images/fallbacks/fpv-freestyle.webp',
  'cinematic-long-range': '/images/fallbacks/fpv-cinematic-long-range.webp',
  'academy-beginner': '/images/fallbacks/fpv-academy-beginner.webp',
  'build-workshop': '/images/fallbacks/fpv-build-workshop.webp',
  'tuning-betaflight': '/images/fallbacks/fpv-tuning-betaflight.webp',
  'motors-propulsion': '/images/fallbacks/fpv-motors-propulsion.webp',
  'power-battery-esc': '/images/fallbacks/fpv-power-battery-esc.webp',
  'video-goggles-vtx': '/images/fallbacks/fpv-video-goggles-vtx.webp',
  'radio-elrs-gps': '/images/fallbacks/fpv-radio-elrs-gps.webp',
  commercial: '/images/fallbacks/fpv-commercial.webp',
  'safety-regulations': '/images/fallbacks/fpv-safety-regulations.webp',
  generic: '/images/fallbacks/fpv-generic.webp',
};

const STATIC_FALLBACK_SOURCES = new Set(Object.values(FALLBACK_COVER_PATHS));

export function resolveDisplayCover(
  source: string | undefined,
  fallback: string,
  slug?: string,
): string {
  // Generated covers are deterministic per slug and are the primary
  // copyright-safe visual. The category fallback is only for a missing or
  // failed source and is applied by ResilientCoverImage at render time.
  // Normalize legacy artifacts that persisted a fallback as their primary
  // cover; this fixes old DB shadow rows without rewriting their content.
  if (slug && source && STATIC_FALLBACK_SOURCES.has(source)) {
    return buildCoverImageUrl(slug);
  }
  return source || fallback;
}

interface FallbackCoverInput {
  category?: string;
  metadata?: ContentMetadata;
}

const COMMERCIAL_CONTENT_TYPES = new Set([
  'review',
  'comparison',
  'buyer-guide',
  'product-roundup',
]);

type RoutedFallbackCoverFamily = Exclude<FallbackCoverFamily, 'commercial' | 'generic'>;
type FieldRules = Partial<Record<RoutedFallbackCoverFamily, ReadonlySet<string>>>;

const FAMILY_ORDER: readonly RoutedFallbackCoverFamily[] = [
  'racing',
  'freestyle',
  'cinematic-long-range',
  'academy-beginner',
  'build-workshop',
  'tuning-betaflight',
  'motors-propulsion',
  'power-battery-esc',
  'video-goggles-vtx',
  'radio-elrs-gps',
  'safety-regulations',
];

const COMPONENT_RULES: FieldRules = {
  'motors-propulsion': new Set(['motor', 'motors', 'propulsion', 'propeller']),
  'power-battery-esc': new Set(['esc', 'battery', 'batteries', 'power']),
  'video-goggles-vtx': new Set([
    'goggles',
    'vtx',
    'camera',
    'video',
    'digital-video',
    'analog-video',
  ]),
  'radio-elrs-gps': new Set(['radio', 'gps', 'elrs', 'communication']),
};

const TOPIC_RULES: FieldRules = {
  freestyle: new Set(['freestyle']),
  'academy-beginner': new Set(['academy', 'beginner', 'simulators']),
  'build-workshop': new Set(['build-guides', 'soldering', 'wiring', 'workshop']),
  'tuning-betaflight': new Set(['flight-control', 'betaflight', 'tuning', 'blackbox']),
  'power-battery-esc': new Set(['battery', 'batteries', 'power']),
  'video-goggles-vtx': new Set([
    'goggles',
    'vtx',
    'camera',
    'video',
    'digital-video',
    'analog-video',
  ]),
  'radio-elrs-gps': new Set(['radio', 'gps', 'elrs', 'communication']),
  'safety-regulations': new Set(['troubleshooting', 'regulations', 'safety']),
};

const DISCIPLINE_RULES: FieldRules = {
  racing: new Set(['racing']),
  freestyle: new Set(['freestyle']),
  'cinematic-long-range': new Set(['cinematic', 'long-range']),
};

const CATEGORY_RULES: FieldRules = {
  racing: new Set(['racing']),
  'academy-beginner': new Set(['academy', 'beginner', 'simulators']),
  'build-workshop': new Set(['build-guides', 'soldering', 'wiring', 'workshop']),
  'tuning-betaflight': new Set(['flight-control', 'betaflight', 'tuning', 'blackbox']),
  'motors-propulsion': new Set(['motor', 'motors', 'propulsion', 'propeller']),
  'safety-regulations': new Set(['troubleshooting', 'regulations', 'safety']),
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function isWrappedInput(input: ContentMetadata | FallbackCoverInput): input is FallbackCoverInput {
  return 'category' in input || 'metadata' in input;
}

function resolveSignalTier(
  fields: ReadonlyArray<{ values: readonly string[]; rules: FieldRules }>,
): RoutedFallbackCoverFamily | undefined {
  const normalizedFields = fields.map(({ values, rules }) => ({
    rules,
    signals: new Set(values.map(normalize)),
  }));

  for (const family of FAMILY_ORDER) {
    if (normalizedFields.some(({ rules, signals }) =>
      [...(rules[family] ?? [])].some((value) => signals.has(value)))) {
      return family;
    }
  }

  return undefined;
}

export function resolveFallbackCover(
  input?: ContentMetadata | FallbackCoverInput,
): string {
  let wrappedInput: FallbackCoverInput | undefined;
  let metadata: ContentMetadata | undefined;

  if (input && isWrappedInput(input)) {
    wrappedInput = input;
    metadata = input.metadata;
  } else {
    metadata = input;
  }

  if (metadata?.contentType && COMMERCIAL_CONTENT_TYPES.has(metadata.contentType)) {
    return FALLBACK_COVER_PATHS.commercial;
  }

  const family =
    resolveSignalTier([
      { values: metadata?.components ?? [], rules: COMPONENT_RULES },
    ])
    ?? resolveSignalTier([
      { values: metadata?.topics ?? [], rules: TOPIC_RULES },
      { values: metadata?.discipline ?? [], rules: DISCIPLINE_RULES },
    ])
    ?? resolveSignalTier([
      { values: wrappedInput?.category ? [wrappedInput.category] : [], rules: CATEGORY_RULES },
    ]);

  if (family) {
    return FALLBACK_COVER_PATHS[family];
  }

  return FALLBACK_COVER_PATHS.generic;
}
