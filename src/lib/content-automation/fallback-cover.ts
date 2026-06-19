import type { ContentMetadata } from '@/lib/content-metadata';

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

const FAMILY_SIGNALS: ReadonlyArray<{
  family: Exclude<FallbackCoverFamily, 'commercial' | 'generic'>;
  values: ReadonlySet<string>;
}> = [
  { family: 'racing', values: new Set(['racing']) },
  { family: 'freestyle', values: new Set(['freestyle']) },
  {
    family: 'cinematic-long-range',
    values: new Set(['cinematic', 'long-range']),
  },
  {
    family: 'academy-beginner',
    values: new Set(['academy', 'beginner', 'simulators']),
  },
  {
    family: 'build-workshop',
    values: new Set(['build-guides', 'soldering', 'wiring', 'workshop']),
  },
  {
    family: 'tuning-betaflight',
    values: new Set(['flight-control', 'betaflight', 'tuning', 'blackbox']),
  },
  {
    family: 'motors-propulsion',
    values: new Set(['motor', 'motors', 'propulsion', 'propeller']),
  },
  {
    family: 'power-battery-esc',
    values: new Set(['esc', 'battery', 'batteries', 'power']),
  },
  {
    family: 'video-goggles-vtx',
    values: new Set([
      'goggles',
      'vtx',
      'camera',
      'video',
      'digital-video',
      'analog-video',
    ]),
  },
  {
    family: 'radio-elrs-gps',
    values: new Set(['radio', 'gps', 'elrs', 'communication']),
  },
  {
    family: 'safety-regulations',
    values: new Set(['troubleshooting', 'regulations', 'safety']),
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function isWrappedInput(input: ContentMetadata | FallbackCoverInput): input is FallbackCoverInput {
  return 'category' in input || 'metadata' in input;
}

function resolveSignalTier(values: Array<string | undefined>): FallbackCoverFamily | undefined {
  const signals = new Set(values.filter((value): value is string => Boolean(value)).map(normalize));

  for (const rule of FAMILY_SIGNALS) {
    if ([...rule.values].some((value) => signals.has(value))) {
      return rule.family;
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
    resolveSignalTier(metadata?.components ?? [])
    ?? resolveSignalTier([
      ...(metadata?.topics ?? []),
      ...(metadata?.discipline ?? []),
    ])
    ?? resolveSignalTier([wrappedInput?.category]);

  if (family) {
    return FALLBACK_COVER_PATHS[family];
  }

  return FALLBACK_COVER_PATHS.generic;
}
