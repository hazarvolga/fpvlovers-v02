import Link from 'next/link';
import { ArrowUpRight, Battery, Mail, Radio, ShieldCheck, Zap } from 'lucide-react';
import { navigationData } from '@/lib/navigationData';

const footerGroups = navigationData.map((group) => ({
  title: group.title.replace('Pilot Tools', 'Tools'),
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
  { title: 'Pilot Pulse', href: '/pilot-pulse', icon: ArrowUpRight },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-20 border-t border-white/10 bg-[#070707]/90">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5a1f]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-0 carbon-grid opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="space-y-7">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="FPVLovers home">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#ff5a1f]/40 bg-[#ff5a1f]/12 text-[#ff9b71]">
                <span className="text-sm font-black tracking-tight">FPV</span>
              </div>
              <div className="leading-none">
                <div className="text-lg font-black tracking-tight text-white">FPVLovers</div>
                <div className="mt-1 text-[11px] font-medium text-[#8d8981]">Academy, builds, tools</div>
              </div>
            </Link>

            <p className="max-w-md text-sm leading-6 text-[#a7a19a]">
              Practical FPV guides, engineering references, build calculators, and tuning workflows for pilots who want cleaner decisions before the next flight.
            </p>

            <div className="grid max-w-md grid-cols-2 gap-3">
              {featuredLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2.5 text-xs font-semibold text-[#d8d5cf] transition-colors hover:border-[#ff5a1f]/45 hover:bg-[#ff5a1f]/10 hover:text-white"
                >
                  <item.icon className="h-3.5 w-3.5 text-[#ff9b71] transition-colors group-hover:text-[#00f2ff]" />
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
                  className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff9b71] transition-colors hover:text-[#00f2ff]"
                >
                  {group.title}
                </Link>
                {group.items.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm leading-5 text-[#9f9a91] transition-colors hover:text-white"
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

        <div className="mt-12 grid gap-4 border-y border-white/10 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8d8981] md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-[#00ff66]" />
            <span className="text-[#00ff66]">Link Active</span>
            <span className="text-white/25">/</span>
            <span>Editorial cockpit</span>
          </div>
          <div className="flex items-center gap-2 md:justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00f2ff]" />
            <span>Safety-first flight notes</span>
          </div>
          <Link href="mailto:hello@fpvlovers.com.tr" className="flex items-center gap-2 transition-colors hover:text-white md:justify-end">
            <Mail className="h-3.5 w-3.5 text-[#ff9b71]" />
            <span>hello@fpvlovers.com.tr</span>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-xs text-[#77736d] sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {year} FPVLovers. Fly responsibly.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/regulations" className="transition-colors hover:text-white">Regulations</Link>
            <Link href="/academy/glossary" className="transition-colors hover:text-white">Glossary</Link>
            <Link href="/sitemap.xml" className="transition-colors hover:text-white">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
