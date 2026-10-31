import type { Locale } from '@/lib/i18n/locale';

export type LegalDocumentKey = 'privacy' | 'cookies' | 'terms' | 'kvkk';

export const LEGAL_PATHS = {
  en: {
    privacy: '/privacy',
    cookies: '/cookie-policy',
    terms: '/terms',
  },
  tr: {
    privacy: '/tr/gizlilik-politikasi',
    cookies: '/tr/cerez-politikasi',
    terms: '/tr/kullanim-kosullari',
    kvkk: '/tr/kvkk-aydinlatma',
  },
} as const;

export const LEGAL_PAGE_PAIRS = [
  { en: LEGAL_PATHS.en.privacy, tr: LEGAL_PATHS.tr.privacy },
  { en: LEGAL_PATHS.en.cookies, tr: LEGAL_PATHS.tr.cookies },
  { en: LEGAL_PATHS.en.terms, tr: LEGAL_PATHS.tr.terms },
] as const;

export function legalPath(key: LegalDocumentKey, locale: Locale): string {
  if (locale === 'tr') return LEGAL_PATHS.tr[key];
  if (key === 'kvkk') return LEGAL_PATHS.en.privacy;
  return LEGAL_PATHS.en[key];
}
