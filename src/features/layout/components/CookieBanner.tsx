'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { legalPath } from '@/lib/legal/paths';
import type { ConsentState } from '@/lib/consent/consent';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locale';
import { useConsent } from './ConsentProvider';

const COPY = {
  en: {
    title: 'Cookie preferences',
    body: 'We use necessary cookies to run the site. Analytics cookies load only if you allow them.',
    accept: 'Accept all',
    reject: 'Reject non-essential',
    manage: 'Manage preferences',
    save: 'Save choices',
    necessary: 'Necessary',
    necessaryDesc: 'Required for sign-in, security and remembering this choice.',
    analytics: 'Analytics',
    analyticsDesc: 'Aggregated page and search metrics that help us improve the site.',
    marketing: 'Marketing',
    marketingDesc: 'Used only if we add advertising or affiliate tracking pixels. Currently off.',
    cookies: 'Cookie Policy',
  },
  tr: {
    title: 'Çerez tercihleri',
    body: 'Siteyi çalıştırmak için zorunlu çerezler kullanıyoruz. Analitik çerezler yalnızca izin verirseniz yüklenir.',
    accept: 'Tümünü kabul et',
    reject: 'Zorunlu olmayanları reddet',
    manage: 'Tercihleri yönet',
    save: 'Seçimleri kaydet',
    necessary: 'Zorunlu',
    necessaryDesc: 'Oturum, güvenlik ve bu tercihi hatırlamak için gereklidir.',
    analytics: 'Analitik',
    analyticsDesc: 'Siteyi geliştirmek için toplu sayfa ve arama metrikleri.',
    marketing: 'Pazarlama',
    marketingDesc: 'Yalnızca reklam veya affiliate izleme pikseli eklenirse kullanılır. Şu an kapalı.',
    cookies: 'Çerez Politikası',
  },
} as const;

type CookieCopy = (typeof COPY)[Locale];

/**
 * Mounted only while the preferences panel is open, so the checkboxes always
 * start from the recorded decision without a state-syncing effect.
 */
function PreferencesPanel({
  copy,
  consent,
  locale,
  onSave,
  onClose,
}: {
  copy: CookieCopy;
  consent: ConsentState | null;
  locale: Locale;
  onSave: (categories: { analytics: boolean; marketing: boolean }) => void;
  onClose: () => void;
}) {
  const [analytics, setAnalytics] = useState(consent?.categories.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.categories.marketing ?? false);

  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      <label className="flex items-start gap-3 text-[11px] text-zinc-300">
        <input type="checkbox" checked disabled className="mt-0.5" />
        <span><strong className="text-zinc-100">{copy.necessary}</strong> — {copy.necessaryDesc}</span>
      </label>
      <label className="flex items-start gap-3 text-[11px] text-zinc-300">
        <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="mt-0.5" />
        <span><strong className="text-zinc-100">{copy.analytics}</strong> — {copy.analyticsDesc}</span>
      </label>
      <label className="flex items-start gap-3 text-[11px] text-zinc-300">
        <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} className="mt-0.5" />
        <span><strong className="text-zinc-100">{copy.marketing}</strong> — {copy.marketingDesc}</span>
      </label>
      <div className="flex items-center gap-2 pt-1">
        <Button variant="amber" size="sm" onClick={() => onSave({ analytics, marketing })} className="min-h-9 px-4 font-mono text-[10px] font-black uppercase">
          {copy.save}
        </Button>
        <button type="button" onClick={onClose} className="min-h-9 rounded border border-white/10 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
          {locale === 'tr' ? 'Kapat' : 'Close'}
        </button>
      </div>
    </div>
  );
}

export function CookieBanner({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const { consent, ready, preferencesOpen, save, openPreferences, closePreferences } = useConsent();
  const copy = COPY[locale];

  if (!ready) return null;
  if (consent && !preferencesOpen) return null;

  const isPanel = preferencesOpen || Boolean(consent);
  const cookiePolicyHref = legalPath('cookies', locale);

  return (
    <div role={isPanel ? 'dialog' : 'region'} aria-label={copy.title} className="fixed inset-x-0 bottom-16 z-40 border-t border-white/10 bg-[#050810]/95 backdrop-blur-md lg:bottom-0">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-200">{copy.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-zinc-400">
              {copy.body}{' '}
              <Link href={cookiePolicyHref} className="text-[#ff8a8d] hover:underline">{copy.cookies}</Link>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="min-h-9 rounded border border-white/10 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
              {copy.reject}
            </button>
            <Button variant="amber" size="sm" onClick={() => save({ analytics: true, marketing: true })} className="min-h-9 px-4 font-mono text-[10px] font-black uppercase">
              {copy.accept}
            </Button>
            <button type="button" onClick={openPreferences} className="min-h-9 rounded border border-white/10 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
              {copy.manage}
            </button>
          </div>
        </div>

        {preferencesOpen && (
          <PreferencesPanel
            copy={copy}
            consent={consent}
            locale={locale}
            onSave={save}
            onClose={closePreferences}
          />
        )}
      </div>
    </div>
  );
}
