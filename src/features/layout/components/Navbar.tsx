'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Search, ChevronRight, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigationData } from '@/lib/navigationData';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300 pointer-events-auto",
      scrolled ? "bg-[#050810]/80 backdrop-blur-xl border-b border-[#00F5FF]/20 shadow-[0_4px_30px_rgba(0,245,255,0.05)]" : "bg-transparent border-b border-transparent"
    )}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* LOGO */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-[#00F5FF] rounded-sm transform rotate-45 flex items-center justify-center group-hover:shadow-[0_0_15px_#00F5FF] transition-all">
                <div className="w-4 h-4 border-2 border-[#050810]" />
              </div>
              <span className="font-black text-xl md:text-2xl italic tracking-tighter uppercase text-white group-hover:text-[#00F5FF] transition-colors">
                FPV <span className="text-[#00F5FF] group-hover:text-white transition-colors">LOVERS</span>
              </span>
            </Link>
          </div>

          {/* DESKTOP MEGA-MENU */}
          <div className="hidden lg:flex items-center gap-1 h-full" onMouseLeave={() => setActiveMenu(null)}>
            {navigationData.map((nav) => {
              const isActive = activeMenu === nav.title;
              return (
                <div
                  key={nav.title}
                  className="h-full flex items-center px-4 cursor-pointer relative group"
                  onMouseEnter={() => setActiveMenu(nav.title)}
                >
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors mb-0.5",
                      isActive ? "text-[#00F5FF]" : "text-white/40 group-hover:text-[#00F5FF]/70"
                    )}>
                      {nav.label}
                    </span>
                    <span className={cn(
                      "text-sm font-black uppercase tracking-tight transition-colors flex items-center gap-1.5",
                      isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/70 group-hover:text-white"
                    )}>
                      <nav.icon className="w-3.5 h-3.5" />
                      {nav.title}
                    </span>
                  </div>

                  {/* Active Indicator Line */}
                  <div className={cn(
                    "absolute bottom-0 left-0 w-full h-[2px] bg-[#00F5FF] transition-transform origin-left",
                    isActive ? "scale-x-100 shadow-[0_0_10px_#00F5FF]" : "scale-x-0"
                  )} />

                  {/* MEGA MENU DROPDOWN */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, rotateX: -10 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, y: 5, transition: { duration: 0.1 } }}
                        className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] mt-2 glass border-[#00F5FF]/20 rounded-xl overflow-hidden shadow-2xl z-50 origin-top bg-[#050810]/95 backdrop-blur-2xl"
                      >
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F5FF] to-transparent opacity-50" />
                         <div className="p-6 grid grid-cols-2 gap-6 relative">
                            {/* Decorative Grid */}
                            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />

                            <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-[#00F5FF] border-b border-white/10 pb-2 mb-2 flex items-center gap-2">
                               <nav.icon className="w-4 h-4" /> {nav.title} _DATABANKS
                            </div>

                            {nav.items.map((item) => (
                              <Link
                                href={item.href}
                                key={item.title}
                                className="group/item flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors z-10"
                                onClick={() => setActiveMenu(null)}
                              >
                                 <div className="w-10 h-10 rounded bg-black/50 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover/item:border-[#00F5FF]/50 group-hover/item:text-[#00F5FF] text-white/50 transition-colors">
                                    <item.icon className="w-5 h-5" />
                                 </div>
                                 <div>
                                   <div className="text-sm font-black uppercase text-white group-hover/item:text-[#00F5FF] flex items-center gap-1 transition-colors">
                                      {item.title}
                                      <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                   </div>
                                   <div className="text-xs text-white/40 font-medium leading-snug mt-1">
                                      {item.description}
                                   </div>
                                 </div>
                              </Link>
                            ))}
                         </div>
                         <div className="bg-black/60 p-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/30 uppercase z-10 relative">
                            <span>Sys.Status: Online</span>
                            <span className="text-[#00F5FF]/50">RAG Synced</span>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* AI SEARCH & QUICK LINKS (Right Side) */}
          <div className="hidden lg:flex items-center gap-6">
             {/* AI Search Bar */}
             <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00F5FF]/20 to-indigo-500/20 rounded-md blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center bg-black/40 border border-white/10 rounded-md py-1.5 pl-3 pr-2 focus-within:border-[#00F5FF]/50 transition-colors w-[220px]">
                   <Search className="w-4 h-4 text-white/50 mr-2 flex-shrink-0" />
                   <input
                     type="text"
                     placeholder="Ask AI about FPV..."
                     className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full font-mono"
                   />
                   <div className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 rounded text-white/50 ml-2">⌘K</div>
                </div>
             </div>

             <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                <Button variant="ghost" size="icon" className="hover:text-[#00F5FF] hover:bg-[#00F5FF]/10 relative group" asChild>
                   <Link href="/tools">
                     <Target className="w-5 h-5" />
                     <span className="absolute -bottom-8 bg-black border border-white/10 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Duel</span>
                   </Link>
                </Button>
                <Button variant="amber" size="sm" className="text-[10px] h-8 px-4 font-black shadow-[0_0_15px_rgba(255,184,0,0.3)] animate-pulse">
                   <Zap className="w-3 h-3 mr-1" /> HOT DEALS
                </Button>
             </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="lg:hidden flex items-center gap-4">
             <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                <Search className="w-5 h-5" />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6 text-[#00F5FF]" /> : <Menu className="w-6 h-6" />}
             </Button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-[#050810]/95 backdrop-blur-3xl border-b border-[#00F5FF]/20 overflow-hidden"
          >
             <div className="p-4 max-h-[80vh] overflow-y-auto pb-8 relative">
               <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
               <div className="relative z-10 flex flex-col gap-6">

                 {/* Mobile Search */}
                 <div className="relative flex items-center bg-black border border-white/10 rounded-md py-3 pl-4 pr-3">
                    <Search className="w-5 h-5 text-[#00F5FF] mr-3" />
                    <input
                      type="text"
                      placeholder="Ask AI about FPV..."
                      className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30 w-full font-mono"
                    />
                 </div>

                 {/* Navigation Accordion Style */}
                 {navigationData.map((nav) => (
                    <div key={nav.title} className="flex flex-col border-b border-white/5 pb-4 last:border-0 last:pb-0">
                       <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded bg-[#00F5FF]/10 flex items-center justify-center border border-[#00F5FF]/20 text-[#00F5FF]">
                             <nav.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#00F5FF] font-bold leading-none mb-1">{nav.label}</div>
                            <div className="text-base font-black uppercase text-white">{nav.title}</div>
                          </div>
                       </div>

                       <div className="flex flex-col gap-1 pl-11">
                          {nav.items.map((item) => (
                             <Link
                               key={item.title}
                               href={item.href}
                               className="py-2 text-sm font-semibold text-white/70 hover:text-[#00F5FF] flex justify-between items-center"
                               onClick={() => setMobileMenuOpen(false)}
                             >
                                {item.title}
                                <ChevronRight className="w-4 h-4 opacity-50" />
                             </Link>
                          ))}
                       </div>
                    </div>
                 ))}

                 {/* Mobile Quick Actions */}
                 <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                    <Button variant="cyber" className="flex-1 text-xs"><Target className="w-4 h-4 mr-2" /> COMPARE</Button>
                    <Button variant="amber" className="flex-1 text-xs animate-pulse"><Zap className="w-4 h-4 mr-2" /> HOT DEALS</Button>
                 </div>

               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
