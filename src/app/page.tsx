import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowRight, BookOpen, Calculator, Cpu, RadioTower, Wrench, Zap, Eye } from 'lucide-react';
import { resolveHomepageContent, type HomepageSectionCard } from '@/lib/homepage/homepage-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NewsletterWidget } from '@/features/tools/components/NewsletterWidget';
import { PilotPulseWidget } from '@/features/tools/components/PilotPulseWidget';
import { ResilientCoverImage } from '@/components/ResilientCoverImage';

function ArticleCard({ card, accent = 'cyan' }: { card: HomepageSectionCard; accent?: 'cyan' | 'orange' | 'neutral' }) {
  const accentClass = accent === 'orange' ? 'group-hover:text-[#ff9b71]' : accent === 'cyan' ? 'group-hover:text-[#9eeef2]' : 'group-hover:text-white';
  return (
    <Card className="group overflow-hidden bg-[#101112]/72">
      {card.coverImage && (
        <Link href={card.href} className="relative block aspect-[16/10] overflow-hidden border-b border-white/8">
          <ResilientCoverImage
            src={card.coverImage}
            fallbackSrc={card.fallbackCoverImage}
            alt={card.coverImageAlt || card.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            unoptimized={true}
            className="h-full w-full object-cover opacity-[0.92] transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          />
        </Link>
      )}
      <CardHeader>
        <div className="mb-3 flex items-center justify-between gap-3">
          <Badge variant={accent === 'orange' ? 'amber' : 'default'}>{card.category}</Badge>
          <span className="font-mono text-xs text-[#77736d] flex items-center gap-1.5">
            <span>{card.readingTime}</span>
            {(card.views !== undefined && card.views !== null) ? (
              <>
                <span className="text-zinc-700">&bull;</span>
                <Eye className="h-3.5 w-3.5 text-[#77736d] opacity-80" />
                <span className="text-[11px] text-[#77736d]">{card.views ?? 0}</span>
              </>
            ) : null}
          </span>
        </div>
        <Link href={card.href}>
          <CardTitle className={`line-clamp-2 text-lg transition-colors ${accentClass}`}>{card.title}</CardTitle>
        </Link>
        <CardDescription className="line-clamp-3 leading-relaxed">{card.excerpt}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Link href={card.href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#d8d5cf] hover:text-white">
          Read guide <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function SectionHeading({ title, href, icon: Icon }: { title: string; href?: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[#ff9b71]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="hidden items-center gap-1 text-sm font-semibold text-[#9f9a91] hover:text-white sm:flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const content = await resolveHomepageContent();
  const heroCard = content.featuredGuides[0] || content.recentPosts[0];
  const secondaryHeroCards = content.featuredGuides.slice(1, 3);
  const spotlightSlugs = new Set([
    heroCard?.slug,
    ...secondaryHeroCards.map((card) => card.slug),
  ].filter((slug): slug is string => Boolean(slug)));
  const featuredGuideCards = [
    ...content.featuredGuides,
    ...content.recentPosts,
    ...content.editorsPicks,
  ].filter((card, index, cards) => (
    !spotlightSlugs.has(card.slug)
    && cards.findIndex((candidate) => candidate.slug === card.slug) === index
  )).slice(0, 3);
  const recentPostCards = content.recentPosts
    .filter((card) => !spotlightSlugs.has(card.slug))
    .slice(0, 6);
  const editorsPickCards = content.editorsPicks
    .filter((card) => !spotlightSlugs.has(card.slug))
    .slice(0, 3);

  return (
    <div className="pb-20">
      <section className="px-4 pt-32 sm:px-6 lg:px-8 border-b border-white/5 pb-10 bg-[#09090b]">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF66]">System Online / Awaiting Input</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl uppercase leading-[1.1]">
              <span className="text-zinc-500 block text-2xl sm:text-3xl mb-2 font-mono tracking-widest">FPVLOVERS</span>
              Flight Control &<br /> Telemetry Hub
            </h1>
            
            <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400 font-mono">
              Actionable engineering data, real-time pulse feeds, build calculators, and tuning references designed for zero-latency decision making.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link 
                href="/academy/roadmap"
                className="group relative flex items-center justify-between gap-4 rounded-sm border border-[#FF5C00]/40 bg-[#FF5C00]/10 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#FF5C00] transition-all hover:bg-[#FF5C00]/20 hover:border-[#FF5C00]"
              >
                <span>Initialize Academy</span>
                <Zap className="h-4 w-4" />
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#FF5C00] transition-all duration-300 group-hover:w-full" />
              </Link>
              
              <Link 
                href="/tools/calculator"
                className="group relative flex items-center justify-between gap-4 rounded-sm border border-white/10 bg-white/5 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
              >
                <span>Access Calculator</span>
                <Calculator className="h-4 w-4" />
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-white/30 transition-all duration-300 group-hover:w-full" />
              </Link>
            </div>
            
            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/5 pt-6">
              {[
                ['Status', 'Active'],
                ['Uplink', 'Secured'],
                ['Version', 'OS-v2.0'],
              ].map(([label, value]) => (
                <div key={label} className="border-l border-white/10 pl-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">{label}</div>
                  <div className="mt-1 font-mono text-xs font-bold text-zinc-300 uppercase">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {heroCard && (
            <div className="relative group">
              <div className="absolute -inset-1 rounded-sm bg-gradient-to-tr from-[#00F2FF]/20 to-[#FF5C00]/20 opacity-0 blur transition duration-500 group-hover:opacity-100" />
              <Link href={heroCard.href} className="relative block overflow-hidden rounded-sm border border-white/10 bg-[#18181b]">
                <div className="border-b border-white/5 px-4 py-2 bg-[#09090b] flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Featured Datastream</span>
                  <Badge variant="outline" className="rounded-none border-white/10 text-[9px] bg-white/5 text-zinc-300">{heroCard.category}</Badge>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  {heroCard.coverImage && (
                    <ResilientCoverImage
                      src={heroCard.coverImage}
                      fallbackSrc={heroCard.fallbackCoverImage}
                      alt={heroCard.coverImageAlt || heroCard.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      unoptimized={true}
                      className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100 mix-blend-luminosity hover:mix-blend-normal"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent p-6">
                    <h2 className="mt-3 max-w-xl text-xl font-bold leading-tight text-zinc-100 uppercase tracking-wide group-hover:text-[#00F2FF] transition-colors">{heroCard.title}</h2>
                    <p className="mt-2 line-clamp-2 text-xs font-mono text-zinc-400">{heroCard.excerpt}</p>
                    <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                      <span>{heroCard.readingTime}</span>
                      {(heroCard.views !== undefined && heroCard.views !== null) ? (
                        <>
                          <span className="text-zinc-700">&bull;</span>
                          <Eye className="h-3.5 w-3.5 text-zinc-500 opacity-80" />
                          <span>{heroCard.views ?? 0}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <PilotPulseWidget />
      </section>

      <section className="mx-auto mt-12 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {secondaryHeroCards.map((card) => (
          <ArticleCard key={card.slug} card={card} />
        ))}
        <div className="rounded-sm border border-[#00F2FF]/20 bg-[#00F2FF]/5 p-6 flex flex-col justify-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[#00F2FF] flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00F2FF] animate-pulse" />
            {content.sponsorSlot.title}
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-100 uppercase tracking-wide">Partner-ready FPV placements</h3>
          <p className="mt-2 text-xs leading-5 text-zinc-400 font-mono">{content.sponsorSlot.description}</p>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Featured Guides" href="/academy/roadmap" icon={BookOpen} />
        {featuredGuideCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featuredGuideCards.map((card) => (
              <ArticleCard key={card.slug} card={card} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/12 py-16 text-center text-[#9f9a91]">
            Featured guides will appear here as content is published.
          </div>
        )}
      </section>

      <section className="mx-auto mt-20 grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionHeading title="Learn" href="/academy" icon={RadioTower} />
          <div className="grid gap-3 sm:grid-cols-2">
            {content.academyCards.map((card) => (
              <Link key={card.href} href={card.href} className="rounded-lg border border-white/10 bg-white/[0.025] p-5 transition hover:border-[#28d7df]/35 hover:bg-[#28d7df]/6">
                <div className="font-mono text-xs text-[#9eeef2]">{card.label}</div>
                <h3 className="mt-2 font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9f9a91]">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading title="Build" href="/engineering" icon={Wrench} />
          <div className="grid gap-3 sm:grid-cols-2">
            {content.engineeringCards.map((card) => (
              <Link key={card.href} href={card.href} className="rounded-lg border border-white/10 bg-white/[0.025] p-5 transition hover:border-[#ff5a1f]/35 hover:bg-[#ff5a1f]/6">
                <div className="font-mono text-xs text-[#ff9b71]">{card.label}</div>
                <h3 className="mt-2 font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9f9a91]">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-12">
        <SectionHeading title="System Utilities" href="/tools" icon={Calculator} />
        <div className="grid gap-4 md:grid-cols-3">
          {content.toolCards.map((card, index) => (
            <Link key={card.href} href={card.href} className="group rounded-sm border border-white/5 bg-[#18181b]/50 p-6 transition hover:border-[#FF5C00]/40 hover:bg-[#18181b]">
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#FF5C00]/10 text-[#FF5C00] transition-colors group-hover:bg-[#FF5C00] group-hover:text-black">
                  {index === 0 ? <Calculator className="h-4 w-4" /> : index === 1 ? <Cpu className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">SYS_UTILITY_{index + 1}</span>
              </div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide group-hover:text-[#FF5C00] transition-colors">{card.title}</h3>
              <p className="mt-2 text-[11px] leading-5 text-zinc-500 font-mono">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Recent Posts" icon={BookOpen} />
        {recentPostCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recentPostCards.map((card) => (
              <ArticleCard key={card.slug} card={card} accent="neutral" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/12 py-12 text-center text-[#9f9a91]">
            Articles will appear here as they are published.
          </div>
        )}
      </section>

      {editorsPickCards.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Editor's Picks" icon={Cpu} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {editorsPickCards.map((card) => (
              <ArticleCard key={card.slug} card={card} accent="orange" />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-3xl px-4 sm:px-6 lg:px-8">
        <NewsletterWidget />
      </section>
    </div>
  );
}
