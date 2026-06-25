'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Menu, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigationData } from '@/lib/navigationData';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { loadDossierFromBrowser } from '@/lib/state/dossier-serializer';
import { PilotDossier } from '@/types/pilot-dossier';

const navLinks = navigationData.map((item) => ({
  title: item.title,
  href: item.href,
  icon: item.icon,
  label: item.label,
  items: item.items,
}));

export function Navbar() {
  const { data: session, status } = useSession();
  const [localDossier, setLocalDossier] = useState<PilotDossier | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeNavigation = () => {
    setMobileMenuOpen(false);
    setActiveMenu(null);
    setUserMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const activeDossier = loadDossierFromBrowser();
    const dossierTimeout = setTimeout(() => {
      setLocalDossier(activeDossier);
    }, 0);
    return () => clearTimeout(dossierTimeout);
  }, [status]);

  useEffect(() => {
    const navTimer = setTimeout(() => {
      setUserMenuOpen(false);
    }, 0);
    return () => clearTimeout(navTimer);
  }, [pathname]);

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full border-b transition-all duration-300 font-sans',
        scrolled
          ? 'border-white/5 bg-[#09090b]/90 shadow-2xl backdrop-blur-xl'
          : 'border-transparent bg-[#09090b]/50 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group" aria-label="FPVLovers home" onClick={closeNavigation}>
          <div className="relative h-[72px] w-[300px] -ml-2">
            <Image
              src="/logo-type.png"
              alt="FPVLovers Logo"
              fill
              sizes="(max-width: 768px) 240px, 300px"
              priority
              className="object-contain object-left brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity scale-[1.6] origin-left"
            />
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isOpen = activeMenu === item.href;
            const hasItems = item.items.length > 0;
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => hasItems && setActiveMenu(item.href)}
                onMouseLeave={() => setActiveMenu(null)}
                onFocus={() => hasItems && setActiveMenu(item.href)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-100',
                    isActive && 'text-zinc-100'
                  )}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  onClick={closeNavigation}
                >
                  {item.title}
                  {hasItems && <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition-transform', isOpen && 'rotate-180 opacity-100')} />}
                </Link>

                {hasItems && (
                  <div
                    className={cn(
                      'absolute left-1/2 top-full z-50 w-[360px] -translate-x-1/2 pt-3 transition',
                      isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                    )}
                    role="menu"
                  >
                    <div className="overflow-hidden rounded-md border border-white/5 bg-[#18181b]/95 shadow-2xl backdrop-blur-xl">
                      <div className="border-b border-white/5 px-4 py-3 bg-[#09090b]">
                        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">{item.label}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-100">
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
                                'group flex items-start gap-3 rounded-md px-3 py-3 transition-colors hover:bg-white/5',
                                subActive && 'bg-white/5',
                              )}
                              onClick={() => setActiveMenu(null)}
                              role="menuitem"
                            >
                              <div className={cn(
                                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-white/5 bg-black/20 text-zinc-500 transition-colors group-hover:border-[#00F2FF]/30 group-hover:text-[#00F2FF]',
                                subActive && 'border-[#00F2FF]/50 text-[#00F2FF]',
                              )}>
                                <subItem.icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-zinc-300 group-hover:text-zinc-100">
                                  <span>{subItem.title}</span>
                                  <ChevronRight className="h-3 w-3 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70" />
                                </div>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">{subItem.description}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {/* Dynamic Authentication Button */}
          {status === 'authenticated' ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-sm border border-[#00F2FF]/30 hover:border-[#00F2FF] bg-[#00F2FF]/5 px-3.5 py-2 text-[10px] font-mono uppercase tracking-widest text-[#00F2FF] transition-all hover:bg-[#00F2FF]/10 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping animate-duration-1000" />
                🛰️ {session.user?.name || 'Pilot'}
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-sm border border-white/5 bg-[#18181b] p-2 shadow-2xl z-50 text-[10px] font-mono uppercase tracking-widest">
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5 bg-[#09090b] rounded-sm">
                    <span className="text-zinc-600 block text-[9px]">Authorized Operator</span>
                    <span className="text-zinc-300 font-bold block truncate mt-1">{session.user?.email}</span>
                  </div>
                  <Link
                    href="/academy/dossier"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-[#A0A0A0] hover:text-white hover:bg-white/[0.04] transition-colors uppercase block text-[10px]"
                  >
                    🚀 Dossier Profile
                  </Link>
                  <Link
                    href="/academy/roadmap"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-[#A0A0A0] hover:text-white hover:bg-white/[0.04] transition-colors uppercase block text-[10px]"
                  >
                    🗺️ Flight Roadmap
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-[#FF5C00] hover:bg-[#FF5C00]/5 transition-colors uppercase text-[10px] cursor-pointer mt-1 border-t border-white/5 pt-2"
                  >
                    ❌ Logout Session
                  </button>
                </div>
              )}
            </div>
          ) : localDossier ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-md border border-[#FF5C00]/30 hover:border-[#FF5C00] bg-[#FF5C00]/5 px-3.5 py-2 text-xs font-mono uppercase tracking-widest text-[#FF5C00] transition-all hover:bg-[#FF5C00]/10 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] animate-pulse" />
                📡 {localDossier.callsign}
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-white/10 bg-[#0b0b0c] p-2 shadow-2xl z-50 text-xs font-mono">
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                    <span className="text-[#888] uppercase block text-[9px]">Offline Callsign</span>
                    <span className="text-white font-bold block truncate">{localDossier.assignedClass}</span>
                  </div>
                  <Link
                    href="/academy/dossier"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-[#A0A0A0] hover:text-white hover:bg-white/[0.04] transition-colors uppercase block text-[10px]"
                  >
                    🚀 Dossier Profile
                  </Link>
                  <Link
                    href="/academy/roadmap"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-[#A0A0A0] hover:text-white hover:bg-white/[0.04] transition-colors uppercase block text-[10px]"
                  >
                    🗺️ Flight Roadmap
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (confirm("WARNING: Are you sure you want to decommission this pilot dossier?")) {
                        document.cookie = "fpv_dossier_v1=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure";
                        window.location.reload();
                      }
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-[#FF5C00] hover:bg-[#FF5C00]/5 transition-colors uppercase text-[10px] cursor-pointer mt-1 border-t border-white/5 pt-2"
                  >
                    ❌ Decommission Call
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-sm bg-[#FF5C00] hover:bg-[#FF5C00]/90 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white transition-all"
            >
              Authorize
            </Link>
          )}
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
                <div key={item.href} className="rounded-sm border border-white/5 bg-[#18181b]/50 p-2">
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-sm px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors',
                      isActive && 'bg-white/5 text-zinc-100',
                    )}
                    onClick={closeNavigation}
                  >
                    <item.icon className={cn('h-3.5 w-3.5', isActive ? 'text-[#00F2FF]' : 'text-zinc-500')} />
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-[#77736d]" />
                  </Link>
                  {item.items.length > 0 && (
                    <div className="mt-1 grid gap-1 pl-7">
                      {item.items.map((subItem) => {
                        const subActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              'flex items-center gap-2 rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300',
                              subActive && 'bg-white/5 text-zinc-300',
                            )}
                            onClick={closeNavigation}
                          >
                            <subItem.icon className={cn('h-3 w-3', subActive ? 'text-[#00F2FF]' : 'text-zinc-600')} />
                            {subItem.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
              {[
                { title: 'Buyer Guides', href: '/buyers-guides' },
                { title: 'Reviews', href: '/reviews' },
                { title: 'Disclosure', href: '/disclosure' },
                { title: 'Editorial Policy', href: '/editorial-policy' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-sm border border-white/10 bg-white/[0.03] px-3 py-3 text-center text-[10px] font-mono font-black uppercase tracking-widest text-zinc-300 transition-colors hover:border-[#00F2FF]/40 hover:text-[#00F2FF]"
                  onClick={closeNavigation}
                >
                  {item.title}
                </Link>
              ))}
            </div>
            
            {/* Dynamic Authentication Button for Mobile */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
              {status === 'authenticated' ? (
                <Link
                  href="/academy/roadmap"
                  className="flex items-center justify-center gap-2 rounded-md border border-[#00F2FF]/30 bg-[#00F2FF]/5 py-3 text-sm font-mono uppercase tracking-widest text-[#00F2FF]"
                  onClick={closeNavigation}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
                  🛰️ Pilot: {session.user?.name || 'Authorized'}
                </Link>
              ) : localDossier ? (
                <Link
                  href="/academy/roadmap"
                  className="flex items-center justify-center gap-2 rounded-md border border-[#FF5C00]/30 bg-[#FF5C00]/5 py-3 text-sm font-mono uppercase tracking-widest text-[#FF5C00]"
                  onClick={closeNavigation}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] animate-pulse" />
                  📡 Pilot: {localDossier.callsign}
                </Link>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center rounded-sm bg-[#FF5C00] py-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white"
                  onClick={closeNavigation}
                >
                  Authorize Signal
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
