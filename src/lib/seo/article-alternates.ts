import { localizeArticlePath } from '@/lib/i18n/locale';

const BASE_URL = process.env.APP_URL || 'https://fpvlovers.com.tr';

/**
 * Both sides of a translated article cluster must advertise the same alternate
 * set, so this only returns links when both trees have a published artifact.
 */
export function buildArticleAlternates(
  slug: string,
  hasEnglish: boolean,
  hasTurkish: boolean,
): Record<string, string> {
  if (!hasEnglish || !hasTurkish) return {};
  const english = `${BASE_URL}/article/${encodeURIComponent(slug)}`;
  return {
    en: english,
    tr: `${BASE_URL}${localizeArticlePath(slug, 'tr')}`,
    'x-default': english,
  };
}
