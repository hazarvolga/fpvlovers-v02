import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowRight, BookOpen, Calculator, Cpu, RadioTower, Wrench, Zap } from 'lucide-react';
import { resolveHomepageContent, type HomepageSectionCard } from '@/lib/homepage/homepage-content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NewsletterWidget } from '@/features/tools/components/NewsletterWidget';
import { PilotPulseWidget } from '@/features/tools/components/PilotPulseWidget';

function ArticleCard({ card, accent = 'cyan' }: { card: HomepageSectionCard; accent?: 'cyan' | 'orange' | 'neutral' }) {
  const accentClass = accent === 'orange' ? 'group-hover:text-[#ff9b71]' : accent === 'cyan' ? 'group-hover:text-[#9eeef2]' : 'group-hover:text-white';
  const bypassOptimization = Boolean(card.coverImage?.startsWith('/api/content/media/cover/') || card.coverImage?.includes('images.pexels.com'));

  return (
    <Card className="group overflow-hidden bg-[#101112]/72">
      {card.coverImage && (
        <Link href={card.href} className="relative block aspect-[16/10] overflow-hidden border-b border-white/8">
          <Image
            src={card.coverImage}
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
          <span className="font-mono text-xs text-[#77736d]">{card.readingTime}</span>
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
  const content = resolveHomepageContent();
  const heroCard = content.featuredGuides[0] || content.recentPosts[0];
  const secondaryHeroCards = content.featuredGuides.slice(1, 3);
  const bypassHeroOptimization = Boolean(heroCard?.coverImage?.startsWith('/api/content/media/cover/') || heroCard?.coverImage?.includes('images.pexels.com'));
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
      <section className="px-4 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              FPV learning, builds, and tools without the noise.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#bdb7ad]">
              FPVLovers brings practical FPV guides, setup references, build calculators, and tuning workflows into one clean cockpit for pilots who want to fly better.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/academy/roadmap">
                  Start the academy <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/tools/calculator">Open build calculator</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-y border-white/10 py-5">
              {[
                ['Academy', 'Beginner path'],
                ['Engineering', 'Build references'],
                ['Tools', 'Practical calculators'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#77736d]">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-[#d8d5cf]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {heroCard && (
            <Link href={heroCard.href} className="group block overflow-hidden rounded-lg border border-white/10 bg-[#101112]/75 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
              <div className="relative aspect-[16/11] overflow-hidden">
                {heroCard.coverImage && (
                  <Image
                    src={heroCard.coverImage}
                    alt={heroCard.coverImageAlt || heroCard.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    unoptimized={true}
                    className="h-full w-full object-cover opacity-[0.94] transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070707] to-transparent p-6">
                  <Badge variant="amber">{heroCard.category}</Badge>
                  <h2 className="mt-3 max-w-xl text-2xl font-bold leading-tight text-white">{heroCard.title}</h2>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <PilotPulseWidget />
      </section>

      <section className="mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {secondaryHeroCards.map((card) => (
          <ArticleCard key={card.slug} card={card} />
        ))}
        <div className="rounded-lg border border-[#ff5a1f]/20 bg-[#ff5a1f]/8 p-6">
          <div className="font-mono text-xs uppercase tracking-[0.16em] text-[#ff9b71]">{content.sponsorSlot.title}</div>
          <h3 className="mt-3 text-xl font-bold text-white">Partner-ready FPV placements</h3>
          <p className="mt-3 text-sm leading-6 text-[#bdb7ad]">{content.sponsorSlot.description}</p>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Featured Guides" href="/#guides" icon={BookOpen} />
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
          <SectionHeading title="Pilot Academy" href="/academy" icon={RadioTower} />
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
          <SectionHeading title="Engineering Lab" href="/engineering" icon={Wrench} />
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

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="Tools To Build Faster" href="/tools" icon={Calculator} />
        <div className="grid gap-4 md:grid-cols-3">
          {content.toolCards.map((card, index) => (
            <Link key={card.href} href={card.href} className="group rounded-lg border border-white/10 bg-[#101112]/78 p-6 transition hover:border-[#ff5a1f]/35">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#ff5a1f]/12 text-[#ff9b71]">
                  {index === 0 ? <Calculator className="h-5 w-5" /> : index === 1 ? <Cpu className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <span className="font-mono text-xs text-[#77736d]">{card.label}</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#ff9b71]">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#9f9a91]">{card.description}</p>
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
