'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rocket, BookOpen, Cpu, Search, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export function MobileUtilityBar() {
  const pathname = usePathname();
  const { status } = useSession();

  const utilities = [
    { name: 'Home', href: '/', icon: Rocket },
    { name: 'Academy', href: '/academy', icon: BookOpen },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Tools', href: '/tools', icon: Cpu },
    { name: 'Dossier', href: status === 'authenticated' ? '/academy/dossier' : '/auth/signin', icon: Activity },
  ];

  return (
    <nav aria-label="Mobile utility navigation" className="fixed bottom-0 left-0 z-50 w-full border-t border-white/5 bg-[#09090b]/90 backdrop-blur-xl lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {utilities.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors',
                isActive ? 'text-[#00F2FF]' : 'text-zinc-500 hover:text-zinc-300'
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
