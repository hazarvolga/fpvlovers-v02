export type Locale = 'en' | 'tr';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'tr'];

/**
 * Paths that exist in both languages. Anything not listed here stays on the
 * English URL for Turkish visitors until its translation ships, so navigation
 * never points at a 404.
 */
export const TRANSLATED_PATHS: readonly string[] = ['/', '/academy', '/guides', '/search'];

const TR_PREFIX = '/tr';

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'tr';
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Drops trailing slashes so `/academy/` compares as `/academy`; root stays `/`. */
function trimTrailingSlashes(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function isTranslatedPath(path: string): boolean {
  const pathOnly = path.split('?')[0].split('#')[0];
  const normalized = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return TRANSLATED_PATHS.includes(trimTrailingSlashes(normalized));
}

export function localizePath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE || !isTranslatedPath(normalized)) return normalized;
  const [, pathname, suffix = ''] = normalized.match(/^([^?#]*)(.*)$/) ?? [normalized, normalized, ''];
  const trimmed = trimTrailingSlashes(pathname);
  if (trimmed === '/') return `${TR_PREFIX}${suffix}`;
  return `${TR_PREFIX}${trimmed}${suffix}`;
}

export function splitLocalePath(input: string): { locale: Locale; path: string } {
  const normalized = input.startsWith('/') ? input : `/${input}`;
  if (normalized === TR_PREFIX) return { locale: 'tr', path: '/' };
  if (normalized.startsWith(`${TR_PREFIX}/`)) {
    return { locale: 'tr', path: normalized.slice(TR_PREFIX.length) };
  }
  return { locale: DEFAULT_LOCALE, path: normalized };
}
