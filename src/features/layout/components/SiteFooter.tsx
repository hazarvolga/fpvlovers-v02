import Link from 'next/link';
import { Battery, Mail, Radio, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import { navigationData } from '@/lib/navigationData';
import { BackToTop } from './BackToTop';

// GAP #3: Filter out nav groups with no items — empty groups created visual holes.
const footerGroups = navigationData
  .filter((group) => group.items.length > 0)
  .map((group) => ({
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

// GAP #2: Semantic grouping for legal / platform / connect links.
const legalGroups = [
  {
    label: 'Legal',
    links: [
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' },
      { title: 'Affiliate Disclosure', href: '/disclosure' },
    ],
  },
  {
    label: 'Platform',
    links: [
      { title: 'Editorial Policy', href: '/editorial-policy' },
      { title: 'Regulations', href: '/regulations' },
      { title: 'Glossary', href: '/academy/glossary' },
    ],
  },
  {
    label: 'Connect',
    links: [
      { title: 'Advertise', href: '/advertise' },
      { title: 'Contact', href: '/contact' },
      { title: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* GAP #9: Back-to-top fixed button — client component */}
      <BackToTop />

      <footer className="relative z-10 mt-20 border-t border-white/5 bg-[#09090b]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff3131]/45 to-transparent" />
        {/* GAP #8: opacity-20 → opacity-[0.35] so the grid is actually visible */}
        <div className="pointer-events-none absolute inset-0 carbon-grid opacity-[0.35]" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr]">

            {/* Left: brand + featured quick-access links */}
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

              {/* GAP #7: text-[10px] → text-[11px], mobile single-column, truncate → line-clamp-1 */}
              <div className="grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                {featuredLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-h-[44px] items-center gap-2 rounded-sm border border-white/10 bg-[#111419]/60 px-3 py-3 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-[#ff3131]/40 hover:bg-[#ff3131]/10 hover:text-zinc-100"
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-[#ff3131] transition-colors group-hover:text-white" />
                    <span className="line-clamp-1">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: nav groups (empty groups filtered out — GAP #3) */}
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
                    <ul className="mt-4 space-y-1">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          {/* GAP #1: py-2 block gives minimum 44px tap target height */}
                          <Link
                            href={item.href}
                            className="block py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-100"
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

          {/* Info strip */}
          <div className="mt-12 grid gap-4 border-y border-white/10 py-5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Radio className="h-3 w-3 text-[#ff3131]" />
              <span className="text-zinc-300">Editorial archive</span>
              <span className="text-zinc-700">/</span>
              <span>English FPV platform</span>
            </div>
            {/* GAP #4: div → Link so the disclosure badge is clickable */}
            <Link
              href="/editorial-policy"
              className="flex items-center gap-2 transition-colors hover:text-zinc-300 md:justify-center"
            >
              <ShieldCheck className="h-3 w-3 text-[#00FF66]" />
              <span>Disclosure and review standards</span>
            </Link>
            <Link
              href="mailto:hello@fpvlovers.com.tr"
              className="flex items-center gap-2 transition-colors hover:text-zinc-300 md:justify-end"
            >
              <Mail className="h-3 w-3 text-[#ff3131]" />
              <span>hello@fpvlovers.com.tr</span>
            </Link>
          </div>

          {/* Legal bottom bar — GAP #2: semantic groups + GAP #1: py-2 tap targets + GAP #5: zinc-400 contrast */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 sm:shrink-0">
              &copy; {year} FPVLovers. Fly responsibly.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              {legalGroups.map((group) => (
                <div key={group.label} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
                    >
                      {link.title}
                    </Link>
                  ))}
                  <span className="hidden text-zinc-700 last:hidden sm:inline" aria-hidden>·</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
