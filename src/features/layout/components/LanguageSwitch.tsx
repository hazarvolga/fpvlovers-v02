'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { DEFAULT_LOCALE, isTranslatedPath, localizePath, splitLocalePath, type Locale } from '@/lib/i18n/locale';

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '/';
  const { path } = splitLocalePath(pathname);
  if (!isTranslatedPath(path)) return null;

  const target: Locale = locale === 'tr' ? DEFAULT_LOCALE : 'tr';
  const label = target === 'tr' ? 'Türkçe' : 'English';

  return (
    <Link
      href={localizePath(path, target)}
      hrefLang={target}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
      aria-label={target === 'tr' ? 'Türkçe sürüme geç' : 'Switch to English'}
    >
      <Languages className="h-3.5 w-3.5" strokeWidth={1.8} />
      {label}
    </Link>
  );
}
