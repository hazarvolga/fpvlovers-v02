'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Menu, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigationData } from '@/lib/navigationData';
import { cn } from '@/lib/utils';

const navLinks = navigationData.map((item) => ({
  title: item.title.replace('Pilot Tools', 'Tools'),
  href: item.href,
  icon: item.icon,
  label: item.label,
  items: item.items,
}));

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();

  const closeNavigation = () => {
    setMobileMenuOpen(false);
    setActiveMenu(null);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full border-b transition-all duration-300',
        scrolled
          ? 'border-white/10 bg-[#080808]/88 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl'
          : 'border-white/6 bg-[#080808]/62 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group" aria-label="FPVLovers home" onClick={closeNavigation}>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#ff5a1f]/35 bg-[#ff5a1f]/12 text-[#ff9b71] transition-colors group-hover:border-[#ff5a1f]/70">
            <span className="text-sm font-black tracking-tight">FPV</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-black tracking-tight text-white">FPVLovers</span>
            <span className="mt-1 text-[11px] font-medium text-[#8d8981]">Academy, builds, tools</span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isOpen = activeMenu === item.href;
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setActiveMenu(item.href)}
                onMouseLeave={() => setActiveMenu(null)}
                onFocus={() => setActiveMenu(item.href)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[#bdb7ad] transition-colors hover:bg-white/[0.06] hover:text-white',
                    isActive && 'bg-white/8 text-white',
                  )}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  onClick={closeNavigation}
                >
                  <item.icon className={cn('h-4 w-4', isActive ? 'text-[#ff9b71]' : 'text-[#77736d]')} />
                  {item.title}
                  <ChevronDown className={cn('h-3.5 w-3.5 text-[#77736d] transition-transform', isOpen && 'rotate-180 text-[#ff9b71]')} />
                </Link>

                <div
                  className={cn(
                    'absolute left-1/2 top-full z-50 w-[360px] -translate-x-1/2 pt-3 transition',
                    isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                  )}
                  role="menu"
                >
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c]/95 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="border-b border-white/8 px-4 py-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff9b71]">{item.label}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                        <item.icon className="h-4 w-4 text-[#d8d5cf]" />
                        {item.title}
                      </div>
                    </div>
                    <div className="grid gap-1 p-2">
                      {item.items.map((subItem) => {
                        const subActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              'group flex items-start gap-3 rounded-md px-3 py-3 transition-colors hover:bg-white/[0.06]',
                              subActive && 'bg-white/8',
                            )}
                            onClick={() => setActiveMenu(null)}
                            role="menuitem"
                          >
                            <div className={cn(
                              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[#8d8981] transition-colors group-hover:border-[#ff5a1f]/35 group-hover:text-[#ff9b71]',
                              subActive && 'border-[#ff5a1f]/45 text-[#ff9b71]',
                            )}>
                              <subItem.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3 text-sm font-bold text-[#ebe7df]">
                                <span>{subItem.title}</span>
                                <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70" />
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8d8981]">{subItem.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-[#8d8981]">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search FPV guides</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools/calculator">Build Calculator</Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#080808]/96 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <div key={item.href} className="rounded-lg border border-white/8 bg-white/[0.02] p-2">
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-[#bdb7ad]',
                      isActive && 'bg-white/8 text-white',
                    )}
                    onClick={closeNavigation}
                  >
                    <item.icon className={cn('h-4 w-4', isActive ? 'text-[#ff9b71]' : 'text-[#77736d]')} />
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-[#77736d]" />
                  </Link>
                  <div className="mt-1 grid gap-1 pl-7">
                    {item.items.map((subItem) => {
                      const subActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#9f9a91] transition-colors hover:bg-white/[0.05] hover:text-white',
                            subActive && 'bg-white/8 text-white',
                          )}
                          onClick={closeNavigation}
                        >
                          <subItem.icon className={cn('h-3.5 w-3.5', subActive ? 'text-[#ff9b71]' : 'text-[#77736d]')} />
                          {subItem.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
