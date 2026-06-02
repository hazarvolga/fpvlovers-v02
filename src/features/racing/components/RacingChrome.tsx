import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  CircleDot,
  Database,
  Flag,
  Gauge,
  GraduationCap,
  MapPinned,
  Medal,
  Newspaper,
  PlayCircle,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { racingSections } from '@/lib/racingData';

export const racingSectionIcons = {
  events: Trophy,
  calendar: CalendarDays,
  leagues: Flag,
  pilots: Users,
  teams: ShieldCheck,
  tracks: MapPinned,
  rankings: Gauge,
  results: Database,
  technology: Zap,
  academy: GraduationCap,
  history: CircleDot,
  news: Newspaper,
  media: PlayCircle,
  'hall-of-fame': Medal,
  'future-systems': Radio,
};

export function RacingPanel({
  title,
  label,
  href,
  children,
  className = '',
}: {
  title: string;
  label?: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-white/10 bg-[#08090d]/82 p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          {label && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00f2ff]">{label}</div>}
          <h2 className="mt-1 text-base font-black uppercase tracking-tight text-white">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#8d8981] transition-colors hover:text-[#00f2ff]">
            view
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function RacingStatusDot({ tone = 'cyan' }: { tone?: 'cyan' | 'orange' | 'green' }) {
  const color = tone === 'orange' ? 'bg-[#ff5a1f]' : tone === 'green' ? 'bg-[#00ff66]' : 'bg-[#00f2ff]';
  return <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}

export function RacingShell({
  currentSlug,
  breadcrumbCurrent,
  children,
}: {
  currentSlug?: string;
  breadcrumbCurrent?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030406] text-[#f8fafc]">
      <div className="mx-auto max-w-[1560px] px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <CyberBreadcrumb
          items={[
            breadcrumbCurrent
              ? { label: 'Racing Division', href: '/racing' }
              : { label: 'Racing Division', isCurrentPage: true },
            ...(breadcrumbCurrent ? [{ label: breadcrumbCurrent, isCurrentPage: true }] : []),
          ]}
          className="mb-6"
        />

        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-28 rounded-md border border-white/10 bg-[#08090d]/88 p-3">
              <div className="mb-4 border-b border-white/10 pb-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5a1f]">Racing Division</div>
                <Link href="/racing" className="mt-2 flex items-center gap-2 text-sm font-black uppercase text-white transition-colors hover:text-[#00f2ff]">
                  <Trophy className="h-4 w-4 text-[#ff5a1f]" />
                  Competition Grid
                </Link>
              </div>

              <nav className="space-y-1" aria-label="Racing division navigation">
                {racingSections.map((section) => {
                  const Icon = racingSectionIcons[section.slug];
                  const active = currentSlug === section.slug;
                  return (
                    <Link
                      key={section.slug}
                      href={section.href}
                      className={`group flex items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-[#ff5a1f]/14 text-white'
                          : 'text-[#aaa49c] hover:bg-[#ff5a1f]/12 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 transition-colors ${active ? 'text-[#ff9b71]' : 'text-[#77736d] group-hover:text-[#ff9b71]'}`} />
                      {section.title}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 rounded-sm border border-[#00ff66]/20 bg-[#00ff66]/5 p-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                <div className="mb-2 text-[#00ff66]">System status</div>
                {['Data feeds schema-ready', 'Results sync planned', 'Rankings engine designed', 'Media ingest planned'].map((item) => (
                  <div key={item} className="mt-2 flex items-center justify-between gap-2 text-white/48">
                    <span>{item}</span>
                    <span className="text-[#00ff66]">OK</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
