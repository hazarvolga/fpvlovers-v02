'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Rocket, ShoppingBag, Cpu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_LOCALE, localizePath, splitLocalePath, type Locale } from '@/lib/i18n/locale';

export function MobileUtilityBar({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const pathname = usePathname();
  const { path } = splitLocalePath(pathname || '/');

  // Mirrors the primary navigation journey: Start Here -> Gear -> Tools.
  // Account/progress lives in the header menu, not in the thumb bar.
  const utilities = (locale === 'tr'
    ? [
        { name: 'Ana Sayfa', path: '/', icon: Home },
        { name: 'Başla', path: '/academy', icon: Rocket },
        { name: 'Ekipman', path: '/buyers-guides', icon: ShoppingBag },
        { name: 'Ara', path: '/search', icon: Search },
        { name: 'Araçlar', path: '/tools', icon: Cpu },
      ]
    : [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Start', path: '/academy', icon: Rocket },
        { name: 'Gear', path: '/buyers-guides', icon: ShoppingBag },
        { name: 'Search', path: '/search', icon: Search },
        { name: 'Tools', path: '/tools', icon: Cpu },
      ]).map((item) => ({ ...item, href: localizePath(item.path, locale) }));

  return (
    <nav aria-label="Mobile utility navigation" className="fixed bottom-0 left-0 z-50 w-full border-t border-white/5 bg-[#09090b]/90 backdrop-blur-xl lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {utilities.map((item) => {
          const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors',
                isActive ? 'text-[#00F2FF]' : 'text-zinc-400 hover:text-zinc-300'
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]")} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
