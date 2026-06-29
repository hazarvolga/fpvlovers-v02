import Link from 'next/link';
import { ArrowUpRight, Battery, Mail, Radio, ShieldCheck, Zap } from 'lucide-react';
import { navigationData } from '@/lib/navigationData';

const footerGroups = navigationData.map((group) => ({
  title: group.title,
  href: group.href,
  items: group.items.slice(0, 4).map((item) => ({
    title: item.title,
    href: item.href,
  })),
}));

const featuredLinks = [
  { title: 'Build Calculator', href: '/tools/calculator', icon: Zap },
  { title: 'Part Matcher', href: '/tools/part-matcher', icon: Radio },
  { title: 'Battery Safety', href: '/regulations/battery', icon: Battery },
  { title: 'News', href: '/pilot-pulse', icon: ArrowUpRight },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-20 border-t border-white/5 bg-[#09090b]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff3131]/45 to-transparent" />
      <div className="pointer-events-none absolute inset-0 carbon-grid opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="space-y-7">
            <Link href="/" className="inline-flex items-center gap-3 group" aria-label="FPVLovers home">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#ff3131]/30 bg-[#ff3131]/10 text-[#ff3131] transition-colors group-hover:border-[#ff3131]">
                <span className="text-xs font-mono font-bold tracking-widest">FPV</span>
              </div>
              <div className="leading-none">
                <div className="text-lg font-bold tracking-tight text-zinc-100 uppercase">FPVLovers</div>
                <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">Knowledge System</div>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-6 text-zinc-400">
              Editorial FPV tutorials, buyer guides, reviews, comparisons, tools and racing knowledge for pilots who want clearer decisions before the next flight.
            </p>

            <div className="grid max-w-md grid-cols-2 gap-3">
              {featuredLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-2 rounded-sm border border-white/10 bg-[#111419]/60 px-3 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-[#ff3131]/40 hover:bg-[#ff3131]/10 hover:text-zinc-100"
                >
                  <item.icon className="h-3.5 w-3.5 text-[#ff3131] transition-colors group-hover:text-white" />
                  <span className="min-w-0 truncate">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
            {footerGroups.map((group) => (
              <div key={group.href} className="min-w-0">
                <Link
                  href={group.href}
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-white"
                >
                  {group.title}
                </Link>
                {group.items.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-xs font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-100"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 border-y border-white/10 py-5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-[#ff3131]" />
            <span className="text-zinc-300">Editorial archive</span>
            <span className="text-zinc-700">/</span>
            <span>English FPV platform</span>
          </div>
          <div className="flex items-center gap-2 md:justify-center">
            <ShieldCheck className="h-3 w-3 text-[#00FF66]" />
            <span>Disclosure and review standards</span>
          </div>
          <Link href="mailto:hello@fpvlovers.com.tr" className="flex items-center gap-2 transition-colors hover:text-zinc-300 md:justify-end">
            <Mail className="h-3 w-3 text-[#ff3131]" />
            <span>hello@fpvlovers.com.tr</span>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-[10px] font-mono text-zinc-600 sm:flex-row sm:items-center sm:justify-between uppercase tracking-widest">
          <p>(c) {year} FPVLovers. Fly responsibly.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/regulations" className="transition-colors hover:text-zinc-400">Regulations</Link>
            <Link href="/academy/glossary" className="transition-colors hover:text-zinc-400">Glossary</Link>
            <Link href="/privacy" className="transition-colors hover:text-zinc-400">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-400">Terms of Service</Link>
            <Link href="/editorial-policy" className="transition-colors hover:text-zinc-400">Editorial Policy</Link>
            <Link href="/disclosure" className="transition-colors hover:text-zinc-400">Affiliate Disclosure</Link>
            <Link href="/advertise" className="transition-colors hover:text-zinc-400">Advertise</Link>
            <Link href="/contact" className="transition-colors hover:text-zinc-400">Contact</Link>
            <Link href="/sitemap.xml" className="transition-colors hover:text-zinc-400">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
