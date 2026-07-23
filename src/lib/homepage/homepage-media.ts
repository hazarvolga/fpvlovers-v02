import { FALLBACK_COVER_PATHS, resolveFallbackCover } from '@/lib/content-automation/fallback-cover';
import type { ContentMetadata } from '@/lib/content-metadata';

export type HomepageMediaInput = {
  slug: string;
  title: string;
  category?: string;
  metadata?: ContentMetadata;
};

export function shouldPreferHomepageFallbackCover(source?: string): boolean {
  return !source || source.startsWith('/api/content/media/cover/');
}

export function resolveHomepageFallbackCover(item: HomepageMediaInput): string {
  const base = resolveFallbackCover({
    category: item.category,
    metadata: item.metadata,
  });
  const signal = `${item.slug} ${item.title} ${item.category || ''}`.toLowerCase();

  if (/(propeller|props|propulsion|motor|motors)/.test(signal)) {
    return FALLBACK_COVER_PATHS['motors-propulsion'];
  }
  if (/(esc|battery|batteries|lipo|charger|power)/.test(signal)) {
    return FALLBACK_COVER_PATHS['power-battery-esc'];
  }
  if (/(goggles|walksnail|avatar|o3|video|vtx|digital|analog)/.test(signal)) {
    return FALLBACK_COVER_PATHS['video-goggles-vtx'];
  }
  if (/(radio|elrs|receiver|gps|long-range|long range|signal)/.test(signal)) {
    return FALLBACK_COVER_PATHS['radio-elrs-gps'];
  }
  if (/(cinewhoop|starter|kit|toolkit|build|repair|workshop)/.test(signal)) {
    return FALLBACK_COVER_PATHS['build-workshop'];
  }
  if (/racing|race/.test(signal)) {
    return FALLBACK_COVER_PATHS.racing;
  }
  if (/(arm|arming|failsafe|troubleshoot|troubleshooting|safety|smoke-stopper)/.test(signal)) {
    return FALLBACK_COVER_PATHS['safety-regulations'];
  }

  return base;
}
