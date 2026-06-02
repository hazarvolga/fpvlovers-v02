import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronRight, Database, Gauge, ListChecks, Radio, Search, ShieldCheck } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { generateSeoMetadata } from '@/lib/seo/metadata';
import { getRacingSection, racingEvents, racingSections, rankingMethodology } from '@/lib/racingData';

type PageProps = {
  params: Promise<{ section: string }>;
};

export function generateStaticParams() {
  return racingSections.map((section) => ({ section: section.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { section: slug } = await params;
  const section = getRacingSection(slug);

  if (!section) {
    return {};
  }

  return generateSeoMetadata({
    title: `${section.title} | FPV Racing Division`,
    description: section.description,
    path: section.href,
    type: 'website',
  });
}

function statusCopy(status: string) {
  if (status === 'crawler-ready') return 'Ready for official-source crawl queue ingestion';
  if (status === 'future-system') return 'Future product system, schema-first surface active';
  return 'Live information architecture and editorial surface active';
}

export default async function RacingSectionPage({ params }: PageProps) {
  const { section: slug } = await params;
  const section = getRacingSection(slug);

  if (!section) {
    notFound();
  }

  const adjacentSections = racingSections.filter((item) => item.slug !== section.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#030406] text-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <CyberBreadcrumb
          items={[
            { label: 'Racing Division', href: '/racing' },
            { label: section.title, isCurrentPage: true },
          ]}
          className="mb-8"
        />

        <section className="rounded-md border border-white/10 bg-[#07080c]/80 p-6 sm:p-8">
          <Link href="/racing" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#00f2ff] transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Racing Division
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff9b71]">{section.label}</div>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">{section.title}</h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#b8b2aa] sm:text-base">{section.description}</p>
            </div>

            <div className="rounded-sm border border-white/10 bg-black/35 p-5">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-[#00ff66]" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ff66]">Module status</div>
                  <div className="mt-1 text-sm font-bold text-white">{statusCopy(section.status)}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                <div className="border border-white/8 bg-white/[0.02] p-3">
                  <span className="block text-white/40">Modules</span>
                  <span className="mt-2 block text-lg font-black text-white">{section.modules.length}</span>
                </div>
                <div className="border border-white/8 bg-white/[0.02] p-3">
                  <span className="block text-white/40">SEO targets</span>
                  <span className="mt-2 block text-lg font-black text-white">{section.seoTargets.length}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-md border border-white/10 bg-[#08090d]/70 p-6">
            <div className="mb-5 flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-[#ff5a1f]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Section deliverables</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.modules.map((moduleName, index) => (
                <div key={moduleName} className="rounded-sm border border-white/8 bg-black/30 p-4">
                  <span className="font-mono text-sm font-black text-[#ff5a1f]">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-sm font-black uppercase text-white">{moduleName}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#8d8981]">
                    Data-backed racing module planned for this section with official source provenance and editorial context.
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-white/10 bg-[#08090d]/70 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Search className="h-5 w-5 text-[#00f2ff]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white">SEO cluster</h2>
            </div>
            <ul className="space-y-3">
              {section.seoTargets.map((target) => (
                <li key={target} className="flex items-center justify-between gap-3 rounded-sm border border-white/8 bg-black/30 p-3">
                  <span className="text-sm text-[#d8d5cf]">{target}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#00f2ff]">target</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {section.slug === 'events' && (
          <section className="mt-8 rounded-md border border-white/10 bg-[#08090d]/70 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Database className="h-5 w-5 text-[#ff5a1f]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Seed event database</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {racingEvents.map((event) => (
                <div key={event.id} className="rounded-sm border border-white/8 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-white">{event.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#9f9a91]">{event.history}</p>
                    </div>
                    <a href={event.officialUrl} className="shrink-0 text-[#00f2ff] hover:text-white" aria-label={`${event.name} official website`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="mt-4 space-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                    <div>Organizer: {event.organizer}</div>
                    <div>Ruleset: {event.ruleset}</div>
                    <div>Location model: {event.locationModel}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {section.slug === 'rankings' && (
          <section className="mt-8 rounded-md border border-white/10 bg-[#08090d]/70 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Gauge className="h-5 w-5 text-[#00f2ff]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white">FPVLovers racing rating formula</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {rankingMethodology.map((metric) => (
                <div key={metric.label} className="rounded-sm border border-white/8 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase text-white">{metric.label}</h3>
                    <span className="font-mono text-[10px] text-[#ff9b71]">{metric.weight}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#9f9a91]">{metric.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {section.slug === 'calendar' && (
          <section className="mt-8 rounded-md border border-white/10 bg-[#08090d]/70 p-6">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[#ff5a1f]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Calendar filter model</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {['Region', 'League', 'Race class', 'Date range', 'Status', 'Country', 'Venue type', 'Source confidence'].map((filter) => (
                <div key={filter} className="rounded-sm border border-white/8 bg-black/30 p-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#d8d5cf]">
                  {filter}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-md border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#00f2ff]" />
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Crawler and data policy</h2>
              <p className="mt-2 text-sm leading-6 text-[#b8b2aa]">
                Racing data should enter through the existing crawl queue and retrieval pipeline only. Official event, league, rules, result, pilot, and team sources come first; unsupported claims remain labelled as planned architecture rather than live standings.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 border-b border-white/10 pb-3">
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Related Racing modules</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {adjacentSections.map((item) => (
              <Link key={item.slug} href={item.href} className="group rounded-md border border-white/10 bg-[#08090d]/70 p-4 transition-colors hover:border-[#ff5a1f]/40 hover:bg-[#101116]">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff9b71]">{item.label}</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-black uppercase text-white">{item.title}</span>
                  <ChevronRight className="h-4 w-4 text-[#ff5a1f] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
