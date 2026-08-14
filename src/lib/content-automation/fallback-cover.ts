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

export const FALLBACK_COVER_VARIANTS: Partial<Record<FallbackCoverFamily, readonly string[]>> = {
  racing: [
    '/images/fallbacks/fpv-racing-action.webp',
    '/images/fallbacks/fpv-racing-pit.webp',
    '/images/fallbacks/fpv-racing-operations.webp',
    '/images/fallbacks/fpv-racing-esports.webp',
  ],
  'academy-beginner': [
    '/images/fallbacks/fpv-academy-stick-control.webp',
    '/images/fallbacks/fpv-academy-simulator.webp',
  ],
  'build-workshop': ['/images/fallbacks/fpv-build-soldering.webp'],
  'tuning-betaflight': [
    '/images/fallbacks/fpv-tuning-blackbox.webp',
    '/images/fallbacks/fpv-tuning-pid-filter.webp',
  ],
  'video-goggles-vtx': [
    '/images/fallbacks/fpv-video-vtx-bench.webp',
    '/images/fallbacks/fpv-video-goggles-camera.webp',
  ],
  'radio-elrs-gps': ['/images/fallbacks/fpv-radio-elrs-gps-alt.webp'],
};

// Only legacy family-primary paths are normalized back to the per-slug SVG.
// New semantic variants are valid article-primary artwork when an admin
// explicitly restores a rejected source cover through fallbackToLocal.
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
  title?: string;
  slug?: string;
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

function resolveTextFamily(input: FallbackCoverInput | undefined): RoutedFallbackCoverFamily | undefined {
  const signal = `${input?.title || ''} ${input?.slug || ''}`.toLowerCase();
  if (!signal.trim()) return undefined;

  if (/(expresslrs|\belrs\b|binding phrase|edgetx|radio link)/.test(signal)) {
    return 'radio-elrs-gps';
  }
  if (/(blackbox|betaflight|pid[- ]?tuning|gyro|spectral densit|filter tuning)/.test(signal)) {
    return 'tuning-betaflight';
  }
  if (/(beginner|new pilot|simulator|stick control drill|acro stick)/.test(signal)) {
    return 'academy-beginner';
  }
  if (/(freestyle|acro mode|acro flight)/.test(signal)) return 'freestyle';
  if (/(long[- ]?range|cinematic)/.test(signal)) return 'cinematic-long-range';
  return undefined;
}

function resolveStrongTextFamily(
  input: FallbackCoverInput | undefined,
): RoutedFallbackCoverFamily | undefined {
  const signal = `${input?.title || ''} ${input?.slug || ''}`.toLowerCase();
  if (/(expresslrs|\belrs\b|binding phrase|edgetx|radio link)/.test(signal)) {
    return 'radio-elrs-gps';
  }
  if (/(blackbox|pid[- ]?tuning|spectral densit|gyro trace)/.test(signal)) {
    return 'tuning-betaflight';
  }
  return undefined;
}

function stableIndex(value: string, length: number): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return length > 0 ? hash % length : 0;
}

function resolveFamilyCover(
  family: FallbackCoverFamily,
  input: FallbackCoverInput | undefined,
): string {
  const primary = FALLBACK_COVER_PATHS[family];
  const variants = FALLBACK_COVER_VARIANTS[family] ?? [];
  if (variants.length === 0) return primary;
  const identity = input?.slug || input?.title;
  if (!identity) return primary;

  const signal = `${input?.title || ''} ${input?.slug || ''}`.toLowerCase();
  if (family === 'academy-beginner') {
    if (/(simulator|sim training|virtual flight)/.test(signal)) return variants[1] ?? variants[0];
    if (/(acro|stick|control drill|beginner)/.test(signal)) return variants[0];
  }
  if (family === 'tuning-betaflight') {
    if (/blackbox|spectral densit|gyro trace/.test(signal)) return variants[0];
    if (/(pid|filter|step response)/.test(signal)) return variants[1] ?? variants[0];
  }
  if (family === 'video-goggles-vtx') {
    if (/(vtx|video transmitter|rf power)/.test(signal)) return variants[0];
    if (/(goggle|camera|video link)/.test(signal)) return variants[1] ?? variants[0];
  }
  if (family === 'build-workshop' && /(solder|wiring|assembly)/.test(signal)) {
    return variants[0];
  }

  const choices = [primary, ...variants];
  return choices[stableIndex(identity, choices.length)];
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
    resolveStrongTextFamily(wrappedInput)
    ?? resolveSignalTier([
      { values: metadata?.components ?? [], rules: COMPONENT_RULES },
    ])
    ?? resolveSignalTier([
      { values: metadata?.topics ?? [], rules: TOPIC_RULES },
    ])
    ?? resolveSignalTier([
      { values: metadata?.discipline ?? [], rules: DISCIPLINE_RULES },
    ])
    ?? resolveSignalTier([
      { values: wrappedInput?.category ? [wrappedInput.category] : [], rules: CATEGORY_RULES },
    ])
    ?? resolveTextFamily(wrappedInput);

  if (family) {
    return resolveFamilyCover(family, wrappedInput);
  }

  return FALLBACK_COVER_PATHS.generic;
}
