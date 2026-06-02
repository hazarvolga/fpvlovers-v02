import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Flag,
  PlayCircle,
  Radio,
  Zap,
} from 'lucide-react';
import { RacingPanel as Panel, RacingShell, RacingStatusDot as StatusDot } from '@/features/racing/components/RacingChrome';
import { generateSeoMetadata } from '@/lib/seo/metadata';
import {
  raceCalendarPreview,
  racingCrawlerTargets,
  racingEvents,
  racingMission,
  racingSections,
  rankingMethodology,
  rankingPreviewRows,
  trackSpotlight,
} from '@/lib/racingData';

export const metadata = generateSeoMetadata({
  title: 'FPV Racing Division | Global Drone Racing Ecosystem',
  description:
    'A dedicated FPV racing platform for global events, drone racing leagues, pilots, teams, tracks, rankings, race technology, results, media, and FPV racing history.',
  path: '/racing',
  type: 'website',
});

const academySkills = ['Race Lines', 'Gate Management', 'Throttle Discipline', 'Track Reading', 'Qualifying Strategy', 'Finals Strategy'];
const mediaModules = ['Race Highlights', 'Pilot Interviews', 'Track Walkthroughs', 'Technical Breakdowns'];

export default function RacingDivisionPage() {
  const topEvents = racingEvents.slice(0, 5);
  const technologySection = racingSections.find((section) => section.slug === 'technology');

  return (
    <RacingShell>
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
              <div className="relative min-h-[330px] overflow-hidden rounded-md border border-white/10 bg-[#06070a]">
                <Image
                  src="/racing/racing-hero.png"
                  alt="FPV racing quads flying through illuminated gates"
                  fill
                  priority
                  className="object-cover opacity-[0.58]"
                  sizes="(min-width: 1024px) 65vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050608] via-[#050608]/78 to-[#050608]/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-black/35" />
                <div className="relative z-10 flex min-h-[330px] flex-col justify-end p-6 sm:p-8">
                  <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-sm border border-[#00f2ff]/25 bg-[#00f2ff]/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#00f2ff]">
                    <Radio className="h-3.5 w-3.5" />
                    Competitive command center
                  </div>
                  <h1 className="max-w-3xl text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
                    FPV Racing <span className="text-[#ff5a1f]">Division</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d8d5cf]">
                    {racingMission.statement}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link href="/racing/events" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ff5a1f] px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition-colors hover:bg-[#ff7638]">
                      Browse events
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link href="/racing/calendar" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-black/45 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:border-[#00f2ff]/45">
                      View calendar
                      <CalendarDays className="h-4 w-4 text-[#00f2ff]" />
                    </Link>
                  </div>
                </div>
              </div>

              <Panel title="Race calendar" label="Season control" href="/racing/calendar">
                <div className="grid grid-cols-3 border-b border-white/8 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">
                  <span>Window</span>
                  <span>Event source</span>
                  <span className="text-right">League</span>
                </div>
                <div className="mt-2 space-y-2">
                  {raceCalendarPreview.map((item) => (
                    <Link key={`${item.league}-${item.window}`} href="/racing/calendar" className="grid grid-cols-3 gap-3 rounded-sm border border-white/6 bg-black/28 px-3 py-2.5 text-xs transition-colors hover:border-[#ff5a1f]/30">
                      <span className="font-mono text-[#ff9b71]">{item.window}</span>
                      <span className="min-w-0 truncate text-[#d8d5cf]">{item.event}</span>
                      <span className="text-right font-mono text-[#8d8981]">{item.league}</span>
                    </Link>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">
                  <span>All dates require official source confirmation</span>
                  <span className="text-[#00f2ff]">Filter ready</span>
                </div>
              </Panel>
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_0.95fr]">
              <Panel title="World rankings preview" label="Rating model" href="/racing/rankings">
                <div className="grid grid-cols-[44px_1fr_110px] border-b border-white/8 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">
                  <span>Pos</span>
                  <span>Entity</span>
                  <span className="text-right">Signal</span>
                </div>
                <div className="mt-2 space-y-2">
                  {rankingPreviewRows.map((row) => (
                    <div key={row.position} className="grid grid-cols-[44px_1fr_110px] gap-3 rounded-sm border border-white/6 bg-black/28 px-3 py-2.5 text-xs">
                      <span className="font-mono text-lg font-black text-white">{row.position}</span>
                      <span>
                        <span className="block font-bold text-[#d8d5cf]">{row.entity}</span>
                        <span className="mt-1 block text-[11px] text-[#8d8981]">{row.scope}</span>
                      </span>
                      <span className="text-right text-[11px] text-[#00ff66]">{row.ratingSignal}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Global event database" label="Official-source index" href="/racing/events">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {topEvents.map((event) => (
                    <Link key={event.id} href="/racing/events" className="min-h-[122px] rounded-sm border border-white/8 bg-black/30 p-3 transition-colors hover:border-[#00f2ff]/35">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 bg-white/[0.035]">
                        <Flag className="h-4 w-4 text-[#ff5a1f]" />
                      </div>
                      <h3 className="mt-3 text-xs font-black text-white">{event.name}</h3>
                      <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[#8d8981]">{event.scope}</p>
                    </Link>
                  ))}
                </div>
              </Panel>

              <Panel title="Track spotlight" label="Circuit library" href="/racing/tracks">
                <div className="grid gap-4 md:grid-cols-[1fr_130px] lg:grid-cols-1 2xl:grid-cols-[1fr_130px]">
                  <div className="relative h-44 overflow-hidden rounded-sm border border-[#00f2ff]/18 bg-[#050608]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.055)_1px,transparent_1px)] bg-[size:22px_22px]" />
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 170" role="img" aria-label="FPV race track map model">
                      <path d="M34 118 C74 28, 118 54, 144 92 S224 150, 260 42" fill="none" stroke="#00f2ff" strokeWidth="2" strokeDasharray="5 6" />
                      <path d="M34 118 C92 146, 202 30, 260 42" fill="none" stroke="#ff5a1f" strokeWidth="2" />
                      {[34, 88, 142, 206, 260].map((x, i) => (
                        <circle key={x} cx={x} cy={i % 2 ? 58 : 118} r="8" fill="rgba(0,242,255,0.08)" stroke="#00f2ff" strokeWidth="1" />
                      ))}
                    </svg>
                    <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">Map renderer planned</div>
                  </div>
                  <div className="space-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">
                    <div className="text-sm font-black text-white">{trackSpotlight.name}</div>
                    <div>Gates: <span className="text-[#00f2ff]">{trackSpotlight.gateCount}</span></div>
                    <div>Length: <span className="text-[#00f2ff]">{trackSpotlight.lapDistance}</span></div>
                    <div>Speed: <span className="text-[#ff9b71]">{trackSpotlight.speedRating}</span></div>
                    <div>Risk: <span className="text-[#ff9b71]">{trackSpotlight.difficulty}</span></div>
                  </div>
                </div>
              </Panel>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr_0.9fr]">
              <Panel title="Racing academy" label="Training path" href="/racing/academy">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
                  {academySkills.map((skill) => (
                    <div key={skill} className="rounded-sm border border-white/8 bg-black/28 p-3 text-center text-xs font-semibold text-[#d8d5cf]">
                      <Activity className="mx-auto mb-2 h-4 w-4 text-[#ff9b71]" />
                      {skill}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Media center" label="Broadcast hub" href="/racing/media">
                <div className="grid grid-cols-2 gap-2">
                  {mediaModules.map((moduleName, index) => (
                    <div key={moduleName} className="relative min-h-[92px] overflow-hidden rounded-sm border border-white/8 bg-black/30 p-3">
                      <PlayCircle className="h-6 w-6 text-[#00f2ff]" />
                      <div className="absolute right-3 top-3 font-mono text-[10px] text-white/35">0{index + 1}</div>
                      <div className="mt-5 text-xs font-bold text-white">{moduleName}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Race technology" label="Engineering side" href="/racing/technology">
                <div className="grid grid-cols-2 gap-2">
                  {(technologySection?.modules ?? []).slice(0, 6).map((moduleName) => (
                    <div key={moduleName} className="rounded-sm border border-white/8 bg-black/28 p-3 text-xs text-[#d8d5cf]">
                      <Zap className="mb-2 h-4 w-4 text-[#00f2ff]" />
                      {moduleName}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Hall of Fame" label="Legacy vault" href="/racing/hall-of-fame">
                <div className="grid grid-cols-2 gap-2">
                  {['Pilots', 'Aircraft', 'Teams', 'Championships'].map((label, index) => (
                    <div key={label} className="rounded-sm border border-white/8 bg-black/28 p-4 text-center">
                      <div className="text-2xl font-black text-[#ff5a1f]">{[0, 0, 0, 0][index]}</div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8d8981]">{label}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#8d8981]">Inductions stay empty until official, source-backed historical profiles are approved.</p>
              </Panel>
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Panel title="Ranking methodology" label="Transparent formula" href="/racing/rankings">
                <div className="grid gap-2 md:grid-cols-2">
                  {rankingMethodology.slice(0, 6).map((metric) => (
                    <div key={metric.label} className="rounded-sm border border-white/8 bg-black/28 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-white">{metric.label}</span>
                        <span className="font-mono text-[10px] text-[#ff9b71]">{metric.weight}</span>
                      </div>
                      <p className="mt-2 text-[11px] leading-4 text-[#8d8981]">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Official sources first" label="Crawler queue targets" href="/racing/events">
                <div className="space-y-2">
                  {racingCrawlerTargets.slice(0, 7).map((target, index) => (
                    <div key={target} className="flex gap-3 rounded-sm border border-white/8 bg-black/28 p-3 text-sm leading-5 text-[#b8b2aa]">
                      <StatusDot tone={index % 2 ? 'cyan' : 'orange'} />
                      {target}
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section className="mt-4 overflow-hidden rounded-md border border-white/10 bg-[#08090d]/82">
              <div className="grid gap-0 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 lg:grid-cols-[180px_1fr_220px]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[#00ff66] lg:border-b-0 lg:border-r">
                  <Radio className="h-4 w-4" />
                  Live timing feed
                </div>
                <div className="grid grid-cols-2 gap-3 border-b border-white/10 px-4 py-3 sm:grid-cols-5 lg:border-b-0">
                  <span>Rank: <span className="text-[#00ff66]">schema</span></span>
                  <span>Pilot: <span className="text-white">pending</span></span>
                  <span>Last lap: <span className="text-white">--.--</span></span>
                  <span>Speed: <span className="text-white">source</span></span>
                  <span>Gap: <span className="text-white">pending</span></span>
                </div>
                <Link href="/racing/future-systems" className="flex items-center justify-center gap-2 px-4 py-3 text-[#ff5a1f] transition-colors hover:bg-[#ff5a1f]/10 hover:text-white">
                  View live timing roadmap
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
    </RacingShell>
  );
}
