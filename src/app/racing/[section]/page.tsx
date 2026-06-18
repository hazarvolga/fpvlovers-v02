import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronRight,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import {
  RacingPanel as Panel,
  RacingShell,
  RacingStatusDot as StatusDot,
  racingSectionIcons,
} from '@/features/racing/components/RacingChrome';
import { generateSeoMetadata } from '@/lib/seo/metadata';
import {
  getRacingSection,
  raceCalendarPreview,
  racingCrawlerTargets,
  racingEvents,
  racingSections,
  rankingMethodology,
  rankingPreviewRows,
  trackSpotlight,
} from '@/lib/racingData';
import { getStoreSection, getStoreCalendar, getStorePilots, getStoreLeagues } from '@/lib/racing-store-bridge';
import LiveTimingFeed from '@/features/racing/components/LiveTimingFeed';

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
    title: `${section.title} | FPV Race Division`,
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

function sectionSignal(status: string) {
  if (status === 'crawler-ready') return 'Crawler-ready';
  if (status === 'future-system') return 'Roadmap';
  return 'Live structure';
}

export default async function RacingSectionPage({ params }: PageProps) {
  const { section: slug } = await params;
  const section = getRacingSection(slug);
  const storeData = getStoreSection(slug);

  if (!section) {
    notFound();
  }

  const Icon = racingSectionIcons[section.slug];
  const adjacentSections = racingSections.filter((item) => item.slug !== section.slug).slice(0, 6);
  const dataCount = storeData.length;

  // Merge calendar items
  const storeCal = getStoreCalendar();
  const calendarItems = slug === 'calendar' && storeCal.length > 0 ? [
    ...storeCal.slice(0, 4).map((item: any) => ({
      window: 'Upcoming',
      event: item.event,
      league: item.league,
    })),
    ...raceCalendarPreview,
  ] : raceCalendarPreview;

  return (
    <RacingShell currentSlug={section.slug} breadcrumbCurrent={section.title}>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.8fr)]">
        <div className="relative overflow-hidden rounded-md border border-white/10 bg-[#06070a] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,90,31,0.18),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(0,242,255,0.12),transparent_34%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45" />
          <div className="relative z-10">
            <Link href="/racing" className="mb-7 inline-flex items-center gap-2 rounded-sm border border-white/10 bg-black/35 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#00f2ff] transition-colors hover:border-[#00f2ff]/40 hover:text-white">
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              Racing command center
            </Link>
            <div className="inline-flex items-center gap-2 rounded-sm border border-[#ff5a1f]/30 bg-[#ff5a1f]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff9b71]">
              <Icon className="h-3.5 w-3.5" />
              {section.label}
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
              {section.title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#d8d5cf] sm:text-base">
              {section.description}
            </p>
          </div>
        </div>

        <Panel title="Module control" label={sectionSignal(section.status)}>
          <div className="flex items-start gap-3 rounded-sm border border-[#00ff66]/18 bg-[#00ff66]/5 p-4">
            <Radio className="mt-0.5 h-5 w-5 shrink-0 text-[#00ff66]" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ff66]">Status</div>
              <div className="mt-2 text-sm font-bold leading-6 text-white">{statusCopy(section.status)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-[0.12em]">
            <div className="rounded-sm border border-white/8 bg-black/30 p-3">
              <span className="block text-white/40">Records</span>
              <span className="mt-2 block text-2xl font-black text-white">{dataCount || section.modules.length}</span>
            </div>
            <div className="rounded-sm border border-white/8 bg-black/30 p-3">
              <span className="block text-white/40">Source</span>
              <span className="mt-2 block text-2xl font-black text-white">{dataCount > 0 ? 'Store' : 'Schema'}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-white/8 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">
            Source-backed claims only. Unsupported live rankings stay hidden.
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {storeData.length > 0 ? (
          <Panel title={`${section.title} records`} label={`${storeData.length} verified`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {storeData.slice(0, 10).map((item: any, i: number) => (
                <div key={i} className="rounded-sm border border-white/8 bg-black/30 p-4">
                  {item.name && <h3 className="text-sm font-black text-white">{item.name}</h3>}
                  {item.pilot && <h3 className="text-sm font-black text-white">{item.pilot}</h3>}
                  {item.event && <h3 className="text-sm font-black text-white">{item.event}</h3>}
                  {item.title && <h3 className="text-sm font-black text-white">{item.title}</h3>}
                  {item.summary && <p className="mt-1 text-xs text-[#9f9a91]">{item.summary}</p>}
                  {item.achievement && <p className="mt-1 text-xs text-[#9f9a91]">{item.achievement}</p>}
                  {item.reason && <p className="mt-1 text-xs text-[#9f9a91]">{item.reason}</p>}
                  {item.description && <p className="mt-1 text-xs text-[#9f9a91]">{item.description}</p>}
                  {item.location && <p className="mt-1 font-mono text-[10px] text-[#00f2ff]">{item.location}{item.country ? ' · ' + item.country : ''}</p>}
                  {item.league && <p className="mt-1 font-mono text-[10px] text-white/40">{item.league}{item.difficulty ? ' · ' + item.difficulty : ''}</p>}
                  {item.nationality && <p className="mt-1 font-mono text-[10px] text-white/40">{item.nationality}{item.team ? ' · ' + item.team : ''}</p>}
                  {item.years_active && <p className="mt-1 font-mono text-[10px] text-white/40">{item.years_active}</p>}
                  {item.specialty && <p className="mt-1 font-mono text-[10px] text-[#00f2ff]">{item.specialty}</p>}
                  {item.date && <p className="mt-1 font-mono text-[10px] text-[#00ff66]">{item.date}</p>}
                  {item.position && <span className="font-mono text-sm text-[#ff5a1f] font-black mr-2">#{item.position}</span>}
                  {item.points && <span className="font-mono text-[10px] text-[#00ff66]">{item.points} pts</span>}
                  {item.trend && <span className="ml-2 font-mono text-[9px] text-white/30 uppercase">{item.trend}</span>}
                  {item.type && <span className="mt-1 inline-block font-mono text-[9px] text-white/30 uppercase">{item.type}</span>}
                  {item.year && <span className="mt-1 inline-block font-mono text-[9px] text-[#00f2ff] ml-2">{item.year}</span>}
                  {item.inducted && <p className="mt-1 font-mono text-[10px] text-[#ff5a1f]">Inducted: {item.inducted}</p>}
                  {item.category && <p className="mt-1 font-mono text-[10px] text-white/40">{item.category}</p>}
                  {item.system && <p className="mt-1 font-mono text-[10px] text-[#00ff66]">{item.system}</p>}
                  {item.status && <span className="mt-1 inline-block font-mono text-[9px] text-[#ff9b71] uppercase">{item.status}</span>}
                </div>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Section deliverables" label="Data modules">
            <div className="grid gap-3 sm:grid-cols-2">
              {section.modules.map((moduleName, index) => (
                <div key={moduleName} className="rounded-sm border border-white/8 bg-black/30 p-4">
                  <span className="font-mono text-sm font-black text-[#ff5a1f]">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-sm font-black uppercase text-white">{moduleName}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#8d8981]">
                    Data-backed racing module with official source provenance and editorial review state.
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {storeData.length > 0 ? (
          <Panel title={`${section.title} data`} label={`${storeData.length} records`} className="w-full">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {storeData.slice(0, 15).map((item: any, i: number) => (
                <div key={i} className="rounded-sm border border-white/8 bg-black/30 p-3 flex items-start gap-3">
                  {item.position && <span className="font-mono text-lg font-black text-[#ff5a1f] shrink-0 w-8">#{item.position}</span>}
                  <div className="flex-1 min-w-0">
                    {item.name && <h3 className="text-sm font-black text-white">{item.name}</h3>}
                    {item.pilot && <h3 className="text-sm font-black text-white">{item.pilot}</h3>}
                    {item.event && <h3 className="text-sm font-black text-white">{item.event}</h3>}
                    {item.title && <h3 className="text-sm font-black text-white">{item.title}</h3>}
                    {item.summary && <p className="mt-1 text-xs text-[#9f9a91]">{item.summary}</p>}
                    {item.achievement && <p className="mt-1 text-xs text-[#9f9a91]">{item.achievement}</p>}
                    {item.reason && <p className="mt-1 text-xs text-[#9f9a91]">{item.reason}</p>}
                    {item.description && <p className="mt-1 text-xs text-[#9f9a91]">{item.description}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {item.nationality && <span className="font-mono text-[10px] text-white/40">{item.nationality}</span>}
                      {item.team && <span className="font-mono text-[10px] text-white/40">{item.team}</span>}
                      {item.league && <span className="font-mono text-[10px] text-[#00f2ff]">{item.league}</span>}
                      {item.country && <span className="font-mono text-[10px] text-white/40">{item.country}</span>}
                      {item.years_active && <span className="font-mono text-[10px] text-white/40">{item.years_active}</span>}
                      {item.specialty && <span className="font-mono text-[10px] text-[#00ff66]">{item.specialty}</span>}
                      {item.points && <span className="font-mono text-[10px] text-[#00ff66]">{item.points} pts</span>}
                      {item.trend && <span className="font-mono text-[9px] text-white/30 uppercase">· {item.trend}</span>}
                      {item.type && <span className="font-mono text-[9px] text-white/30 uppercase">· {item.type}</span>}
                      {item.year && <span className="font-mono text-[9px] text-[#00f2ff]">· {item.year}</span>}
                      {item.date && <span className="font-mono text-[10px] text-[#00ff66]">{item.date}</span>}
                      {item.location && <span className="font-mono text-[10px] text-[#00f2ff]">{item.location}</span>}
                      {item.difficulty && <span className="font-mono text-[10px] text-white/40">· {item.difficulty}</span>}
                      {item.inducted && <span className="font-mono text-[10px] text-[#ff5a1f]">Inducted {item.inducted}</span>}
                      {item.category && <span className="font-mono text-[10px] text-white/40">{item.category}</span>}
                      {item.system && <span className="font-mono text-[10px] text-[#00ff66]">{item.system}</span>}
                      {item.status && <span className="font-mono text-[9px] text-[#ff9b71] uppercase">{item.status}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="SEO cluster" label="Search surface">
            <ul className="space-y-3">
              {section.seoTargets.map((target) => (
                <li key={target} className="flex items-center justify-between gap-3 rounded-sm border border-white/8 bg-black/30 p-3">
                  <span className="text-sm text-[#d8d5cf]">{target}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#00f2ff]">target</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Panel title="Calendar feed" label="Season model" href="/racing/calendar">
          <div className="space-y-2">
            {calendarItems.map((item) => (
              <Link key={`${item.league}-${item.window}`} href="/racing/calendar" className="grid grid-cols-[86px_1fr_86px] gap-3 rounded-sm border border-white/6 bg-black/28 px-3 py-2.5 text-xs transition-colors hover:border-[#ff5a1f]/30">
                <span className="font-mono text-[#ff9b71]">{item.window}</span>
                <span className="min-w-0 truncate text-[#d8d5cf]">{item.event}</span>
                <span className="text-right font-mono text-[#8d8981]">{item.league}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Ranking signals" label="Rating model" href="/racing/rankings">
          <div className="space-y-2">
            {rankingPreviewRows.slice(0, 4).map((row) => (
              <div key={row.position} className="grid grid-cols-[42px_1fr] gap-3 rounded-sm border border-white/6 bg-black/28 px-3 py-2.5 text-xs">
                <span className="font-mono text-lg font-black text-white">{row.position}</span>
                <span>
                  <span className="block font-bold text-[#d8d5cf]">{row.entity}</span>
                  <span className="mt-1 block text-[11px] text-[#00ff66]">{row.ratingSignal}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Source policy" label="Crawler targets" href="/racing/events">
          <div className="space-y-2">
            {racingCrawlerTargets.slice(0, 5).map((target, index) => (
              <div key={target} className="flex gap-3 rounded-sm border border-white/8 bg-black/28 p-3 text-xs leading-5 text-[#b8b2aa]">
                <StatusDot tone={index % 2 ? 'cyan' : 'orange'} />
                {target}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {storeData.length > 0 && (
        <Panel title="Intelligence pipeline records" label={`${storeData.length} verified`} className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {storeData.slice(0, 10).map((item: any, i: number) => (
              <div key={i} className="rounded-sm border border-white/8 bg-black/30 p-4">
                {item.name && <h3 className="text-sm font-black text-white">{item.name}</h3>}
                {item.event && <h3 className="text-sm font-black text-white">{item.event}</h3>}
                {item.title && <h3 className="text-sm font-black text-white">{item.title}</h3>}
                {item.summary && <p className="mt-1 text-xs text-[#9f9a91]">{item.summary}</p>}
                {item.achievement && <p className="mt-1 text-xs text-[#9f9a91]">{item.achievement}</p>}
                {item.location && <p className="mt-1 font-mono text-[10px] text-[#00f2ff]">{item.location}{item.country ? ' · ' + item.country : ''}</p>}
                {item.league && <p className="mt-1 font-mono text-[10px] text-white/40">{item.league}{item.difficulty ? ' · ' + item.difficulty : ''}</p>}
                {item.nationality && <p className="mt-1 font-mono text-[10px] text-white/40">{item.nationality}{item.team ? ' · ' + item.team : ''}</p>}
                {item.date && <p className="mt-1 font-mono text-[10px] text-[#00ff66]">{item.date}</p>}
                {item.position && <span className="font-mono text-xs text-[#ff5a1f]">#{item.position}</span>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {section.slug === 'events' && (
        <Panel title="Seed event database" label="Official-source index" className="mt-4">
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
        </Panel>
      )}

      {section.slug === 'rankings' && (
        <Panel title="FPVLovers racing rating formula" label="Transparent formula" className="mt-4">
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
        </Panel>
      )}

      {section.slug === 'calendar' && (
        <Panel title="Calendar filter model" label="Filters" className="mt-4">
          <div className="grid gap-3 md:grid-cols-4">
            {storeCal.length > 0 ? [
              {label:'Regions', vals:[...new Set(storeCal.map((c:any)=>c.country||c.location))].slice(0,4)},
              {label:'Leagues', vals:[...new Set(storeCal.map((c:any)=>c.league))].filter(Boolean)},
              {label:'Status', vals:['upcoming','completed','live']},
              {label:'Confidence', vals:['verified (1.0)','high (0.9)','medium (0.8)']},
            ].map((f) => (
              <div key={f.label} className="rounded-sm border border-white/8 bg-black/30 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ff5a1f] mb-2">{f.label}</div>
                {f.vals.map((v: string) => (
                  <div key={v} className="font-mono text-[9px] text-[#d8d5cf] py-0.5">{v}</div>
                ))}
              </div>
            )) : ['Region', 'League', 'Race class', 'Date range', 'Status', 'Country', 'Venue type', 'Source confidence'].map((filter) => (
              <div key={filter} className="rounded-sm border border-white/8 bg-black/30 p-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#d8d5cf]">
                {filter}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {section.slug === 'tracks' && (
        <Panel title="Circuit library model" label="Track map" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="relative h-64 overflow-hidden rounded-sm border border-[#00f2ff]/18 bg-[#050608]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.055)_1px,transparent_1px)] bg-[size:22px_22px]" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 170" role="img" aria-label="FPV race track map model">
                <path d="M34 118 C74 28, 118 54, 144 92 S224 150, 260 42" fill="none" stroke="#00f2ff" strokeWidth="2" strokeDasharray="5 6" />
                <path d="M34 118 C92 146, 202 30, 260 42" fill="none" stroke="#ff5a1f" strokeWidth="2" />
                {[34, 88, 142, 206, 260].map((x, i) => (
                  <circle key={x} cx={x} cy={i % 2 ? 58 : 118} r="8" fill="rgba(0,242,255,0.08)" stroke="#00f2ff" strokeWidth="1" />
                ))}
              </svg>
            </div>
            <div className="space-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">
              <div className="text-sm font-black text-white">{trackSpotlight.name}</div>
              <div>Location: <span className="text-[#00f2ff]">{trackSpotlight.location}</span></div>
              <div>Gates: <span className="text-[#00f2ff]">{trackSpotlight.gateCount}</span></div>
              <div>Length: <span className="text-[#00f2ff]">{trackSpotlight.lapDistance}</span></div>
              <div>Speed: <span className="text-[#ff9b71]">{trackSpotlight.speedRating}</span></div>
              <div>Risk: <span className="text-[#ff9b71]">{trackSpotlight.difficulty}</span></div>
            </div>
          </div>
        </Panel>
      )}

      <section className="mt-4">
        <LiveTimingFeed />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title="Crawler and data policy" label="Official-source gate">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#00f2ff]" />
            <p className="text-sm leading-6 text-[#b8b2aa]">
              Racing data enters through the existing crawl queue and Dify intelligence workflow. Official event, league, rules, result, pilot, and team sources come first; unsupported claims remain labelled as planned architecture rather than live standings.
            </p>
          </div>
        </Panel>

        <Panel title="Related Racing modules" label="Command rail">
          <div className="grid gap-3 sm:grid-cols-2">
            {adjacentSections.map((item) => (
              <Link key={item.slug} href={item.href} className="group rounded-sm border border-white/10 bg-black/30 p-4 transition-colors hover:border-[#ff5a1f]/40 hover:bg-[#101116]">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff9b71]">{item.label}</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-black uppercase text-white">{item.title}</span>
                  <ChevronRight className="h-4 w-4 text-[#ff5a1f] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </RacingShell>
  );
}
