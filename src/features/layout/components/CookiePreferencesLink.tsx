'use client';

import type { Locale } from '@/lib/i18n/locale';
import { useConsent } from './ConsentProvider';

export function CookiePreferencesLink({ locale }: { locale: Locale }) {
  const { openPreferences } = useConsent();
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
    >
      {locale === 'tr' ? 'Çerez Tercihleri' : 'Cookie Preferences'}
    </button>
  );
}
