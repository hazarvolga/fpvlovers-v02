import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import {
  Archive,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Eye,
  Gauge,
  Globe2,
  GraduationCap,
  Heart,
  Mail,
  RadioTower,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react';
import { resolveHomepageContent, type HomepageSectionCard } from '@/lib/homepage/homepage-content';
import { Badge } from '@/components/ui/badge';
import { NewsletterWidget } from '@/features/tools/components/NewsletterWidget';
import { ResilientCoverImage } from '@/components/ResilientCoverImage';

export const revalidate = 300;

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

type HomePillar = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  image: string;
  icon: IconComponent;
};

const heroShortcuts: {
  title: string;
  description: string;
  href: string;
  icon: IconComponent;
}[] = [
  {
    title: 'Academy',
    description: 'Step-by-step learning for every level',
    href: '/academy/roadmap',
    icon: GraduationCap,
  },
  {
    title: 'Glossary',
    description: 'Understand every FPV concept',
    href: '/academy/glossary',
    icon: BookOpen,
  },
  {
    title: 'Buyer Guides',
    description: 'Gear choices with commercial intent',
    href: '/buyers-guides',
    icon: ShoppingBag,
  },
  {
    title: 'Tools',
    description: 'Calculators and analyzers',
    href: '/tools',
    icon: Wrench,
  },
  {
    title: 'Racing',
    description: 'Events, pilots, teams and formats',
    href: '/racing',
    icon: Trophy,
  },
];

const pillars: HomePillar[] = [
  {
    eyebrow: 'Academy',
    title: 'Learn FPV',
    description: 'Courses, roadmaps and beginner-safe paths designed for real pilot progress.',
    href: '/academy/roadmap',
    image: '/images/fallbacks/fpv-academy-beginner.webp',
    icon: GraduationCap,
  },
  {
    eyebrow: 'Buyer Guides',
    title: 'Choose Gear',
    description: 'Editorial buying guides for drones, goggles, radios, chargers and starter kits.',
    href: '/buyers-guides',
    image: '/images/fallbacks/fpv-commercial.webp',
    icon: ShoppingBag,
  },
  {
    eyebrow: 'Tools',
    title: 'Improve FPV',
    description: 'Calculators, blackbox analysis and practical setup tools for cleaner decisions.',
    href: '/tools',
    image: '/images/fallbacks/fpv-tuning-betaflight.webp',
    icon: Gauge,
  },
  {
    eyebrow: 'Drone Archive',
    title: 'Explore FPV',
    description: 'Drone categories, build styles and platform references for every mission type.',
    href: '/archive',
    image: '/images/fallbacks/fpv-cinematic-long-range.webp',
    icon: Archive,
  },
  {
    eyebrow: 'Racing',
    title: 'Compete FPV',
    description: 'Race formats, pilot development, league coverage and event intelligence.',
    href: '/racing',
    image: '/racing/racing-hero.png',
    icon: Trophy,
  },
];

const communityStats: {
  label: string;
  value: string;
  icon: IconComponent;
}[] = [
  { label: 'Published artifacts', value: '117+', icon: BookOpen },
  { label: 'Pilot tools', value: '6', icon: Wrench },
  { label: 'Core hubs', value: '5', icon: Globe2 },
  { label: 'Fake event dates', value: '0', icon: CheckCircle2 },
  { label: 'Editorial owner', value: 'HVE', icon: Users },
];

const editorialProofCards: {
  title: string;
  text: string;
  detail: string;
  icon: IconComponent;
}[] = [
  {
    title: 'No fake scale',
    text: 'FPVLovers does not invent traffic, user counts, awards, or sponsorship claims for marketing polish.',
    detail: 'Startup-stage honest positioning',
    icon: ShieldCheck,
  },
  {
    title: 'Review evidence boundary',
    text: 'Hands-on product reviews can be marked only when a real sample, test notes, or editor evidence exists.',
    detail: 'Hazar Volga Ekiz review line',
    icon: Eye,
  },
  {
    title: 'Automation with oversight',
    text: 'Autonomous content can support guides and research, while commercial product claims require stricter editorial control.',
    detail: 'AI workflow, human accountability',
    icon: RadioTower,
  },
];

const coveredBrands = [
  'BetaFPV',
  'Gemfan',
  'T-Motor',
  'HQProp',
  'RadioMaster',
  'CaddxFPV',
  'iFlight',
  'DJI',
];

function ThinIcon({ icon: Icon, className = 'h-5 w-5' }: { icon: IconComponent; className?: string }) {
  return <Icon className={className} strokeWidth={1.35} />;
}

function formatDisplayDate(card: HomepageSectionCard): string {
  if (!card.publishedAt || card.publishedAt === 'Seed content') return 'Editorial archive';
  return card.publishedAt;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/10 pl-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-600">{label}</div>
      <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-200">{value}</div>
    </div>
  );
}

function CommunityStat({ label, value, icon: Icon }: { label: string; value: string; icon: IconComponent }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#ff3131]/25 bg-[#ff3131]/[0.06] text-[#ff3131]">
        <ThinIcon icon={Icon} className="h-5 w-5" />
      </div>
      <div className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
    </div>
  );
}

function EditorialButton({
  href,
  children,
  tone = 'red',
}: {
  href: string;
  children: ReactNode;
  tone?: 'red' | 'ghost';
}) {
  const toneClasses = tone === 'red'
    ? 'border-[#ff3131]/60 bg-[#e12227] text-white shadow-[0_18px_44px_rgba(225,34,39,0.24)] hover:bg-[#ff3131]'
    : 'border-white/[0.14] bg-black/20 text-white hover:border-white/[0.32] hover:bg-white/[0.06]';

  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-between gap-5 rounded-[0.45rem] border px-6 py-3 text-xs font-black uppercase tracking-[0.12em] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${toneClasses}`}
    >
      <span>{children}</span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
      </span>
    </Link>
  );
}

function PillarCard({ pillar }: { pillar: HomePillar }) {
  return (
    <Link
      href={pillar.href}
      className="group relative min-h-[17rem] overflow-hidden rounded-[0.7rem] border border-white/[0.12] bg-[#111419] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[#ff3131]/[0.45]"
    >
      <Image
        src={pillar.image}
        alt={`${pillar.title} FPV visual`}
        fill
        sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw"
        className="object-cover opacity-50 grayscale transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04] group-hover:opacity-[0.68] group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/[0.66] to-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,49,49,0.20),transparent_28rem)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="relative flex h-full min-h-[17rem] flex-col justify-between p-6">
        <div className="flex items-center gap-3 text-white">
          <span className="text-[#ff3131]">
            <ThinIcon icon={pillar.icon} className="h-5 w-5" />
          </span>
          <span className="text-sm font-black uppercase tracking-[0.08em]">{pillar.eyebrow}</span>
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-[-0.03em] text-white">{pillar.title}</h3>
          <p className="mt-3 max-w-[16rem] text-sm leading-6 text-zinc-300">{pillar.description}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#ff3131]">
            Explore <ArrowRight className="h-3.5 w-3.5 transition-transform duration-700 group-hover:translate-x-1" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function LatestContentItem({ card, featured = false }: { card: HomepageSectionCard; featured?: boolean }) {
  return (
    <Link
      href={card.href}
      data-testid="latest-content-card"
      data-featured={featured ? 'true' : 'false'}
      className={`group overflow-hidden rounded-[1.5rem] border border-white/[0.10] bg-[#080b0f] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[#ff3131]/[0.42] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_80px_rgba(225,34,39,0.12)] ${
        featured ? 'md:col-span-2 md:grid md:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]' : ''
      }`}
    >
      <div className={`relative overflow-hidden bg-white/[0.03] ${featured ? 'aspect-[16/10] md:aspect-auto md:min-h-[16rem]' : 'aspect-[16/10]'}`}>
        {card.coverImage && (
          <ResilientCoverImage
            src={card.coverImage}
            fallbackSrc={card.fallbackCoverImage}
            alt={card.coverImageAlt || card.title}
            fill
            sizes={featured ? '(min-width: 1024px) 48vw, 100vw' : '(min-width: 768px) 30vw, 100vw'}
            unoptimized={true}
            className="object-cover opacity-[0.78] grayscale transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.05] group-hover:opacity-100 group-hover:grayscale-0"
          />
        )}
      </div>
      <div className={featured ? 'flex flex-col justify-center p-6 md:p-8' : 'p-5'}>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
          <span className="rounded-full border border-[#ff3131]/30 bg-[#ff3131]/[0.08] px-2.5 py-1 text-[#ff8a8d]">{card.category}</span>
          <span>{formatDisplayDate(card)}</span>
        </div>
        <h3 className={`${featured ? 'mt-5 text-xl md:text-2xl' : 'mt-4 text-base'} line-clamp-3 font-black leading-tight tracking-[-0.02em] text-white transition-colors duration-500 group-hover:text-[#ff3131]`}>
          {card.title}
        </h3>
        {featured ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">{card.excerpt}</p> : null}
        <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
          <span>{card.readingTime}</span>
          {(card.views !== undefined && card.views > 0) ? (
            <>
              <span className="text-zinc-700">•</span>
              <Eye className="h-3.5 w-3.5" strokeWidth={1.35} />
              <span>{card.views ?? 0}</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-white md:text-2xl">
      {children}
    </h2>
  );
}

export default async function HomePage() {
  const content = await resolveHomepageContent();
  const recentPostCards = content.recentPosts;
  const dynamicCommunityStats = communityStats.map((stat) => (
    stat.label === 'Published artifacts'
      ? { ...stat, value: `${content.archiveCount}+` }
      : stat
  ));
  const guideCards = [
    ...content.featuredGuides,
    ...content.editorsPicks,
    ...content.recentPosts,
  ]
    .filter((card, index, cards) => cards.findIndex((candidate) => candidate.slug === card.slug) === index)
    .slice(0, 3);

  return (
    <div className="overflow-hidden pb-24">
      <section className="relative min-h-[calc(100dvh-5rem)] border-b border-white/8 bg-[#050607] pt-24">
        <Image
          src="/images/fallbacks/fpv-cinematic-long-range.webp"
          alt="Cinematic long range FPV drone ready for flight"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.86]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050607_0%,rgba(5,6,7,0.90)_28%,rgba(5,6,7,0.24)_62%,rgba(5,6,7,0.38)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(225,34,39,0.20),transparent_24rem),radial-gradient(circle_at_78%_12%,rgba(0,242,255,0.12),transparent_30rem)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050607] to-transparent" />

        <div className="relative mx-auto flex min-h-[calc(100dvh-5rem)] max-w-[104rem] flex-col justify-center px-5 pb-10 sm:px-8 lg:px-16">
          <div className="max-w-3xl pt-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ff3131] md:text-base">
              Learn. Build. Fly. Compete.
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.8rem] xl:text-[5.35rem]">
              The Ultimate FPV Knowledge <span className="text-[#e12227]">Hub</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-zinc-300 md:text-lg">
              Everything FPV pilots need in one place. Tutorials, buyer guides, product reviews, tools, racing coverage and real-world performance education.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <EditorialButton href="/academy/roadmap">Start Learning</EditorialButton>
              <EditorialButton href="/archive" tone="ghost">Explore Archive</EditorialButton>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
              <Metric label="Content" value={`${content.archiveCount}+ Articles`} />
              <Metric label="Reviews" value="Evidence First" />
              <Metric label="Editor" value="Hazar Volga Ekiz" />
            </div>
          </div>

          <div className="mt-12 rounded-[0.9rem] border border-white/10 bg-black/[0.34] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-md">
            <div className="grid gap-2 md:grid-cols-5">
              {heroShortcuts.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-[0.55rem] px-5 py-5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.06] ${
                    index > 0 ? 'md:border-l md:border-white/10' : ''
                  }`}
                >
                  <span className="text-white transition-colors duration-500 group-hover:text-[#ff3131]">
                    <ThinIcon icon={item.icon} className="h-7 w-7" />
                  </span>
                  <span>
                    <span className="block text-sm font-black uppercase tracking-[0.06em] text-white">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-400">{item.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[112rem] px-5 py-20 sm:px-8 lg:px-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white md:text-3xl">
            Built for <span className="text-[#ff3131]">pilots.</span> By pilots.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            FPVLovers is not an internal telemetry dashboard. It is a public FPV media and knowledge system for beginners, builders, racers and cinematic pilots.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {pillars.map((pillar) => (
            <PillarCard key={pillar.href} pillar={pillar} />
          ))}
        </div>
      </section>

      <section id="latest" className="mx-auto grid max-w-[112rem] gap-6 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.85fr)_minmax(19rem,0.75fr)] lg:px-16">
        <div className="rounded-[2rem] border border-white/[0.10] bg-white/[0.035] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="rounded-[calc(2rem-0.5rem)] bg-[#0b0d10]/[0.96] p-6 md:p-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff8a8d]">Editorial index · {content.archiveCount} published</p>
                <SectionTitle>Latest Content</SectionTitle>
              </div>
              <Link href="/search" className="group inline-flex items-center gap-3 rounded-full border border-white/[0.14] bg-white/[0.04] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#ff3131]/50 hover:bg-[#ff3131]/[0.10]">
                Browse all
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff3131]/[0.14] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
              </Link>
            </div>
          {recentPostCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recentPostCards.map((card, index) => (
                <LatestContentItem key={card.slug} card={card} featured={index === 0} />
              ))}
            </div>
          ) : (
            <div className="rounded-[0.6rem] border border-dashed border-white/[0.12] py-12 text-center text-sm text-zinc-500">
              Articles will appear here as they are published.
            </div>
          )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/[0.10] bg-white/[0.035] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="rounded-[calc(2rem-0.5rem)] bg-[#0b0d10]/[0.96] p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <SectionTitle>Upcoming Races</SectionTitle>
            <Link href="/racing" className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#ff3131] transition-colors hover:text-white">
              View Calendar <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="rounded-[1.25rem] border border-[#ff3131]/20 bg-black/[0.28] p-5">
            <div className="grid gap-5 sm:grid-cols-[4.25rem_1fr] sm:items-center">
              <div className="rounded-[0.45rem] border border-[#ff3131]/[0.24] bg-[#ff3131]/[0.08] px-3 py-4 text-center">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#ff3131]">Live</div>
                <div className="mt-1 text-2xl font-black text-white">QA</div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Current race calendar only</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  FPVLovers will publish upcoming race dates only after they are current and verified. No past-dated fixture data is hard-coded into the homepage.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-[0.3rem] border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                    Racing workflow monitored
                  </Badge>
                  <Badge variant="outline" className="rounded-[0.3rem] border-[#ff3131]/30 bg-[#ff3131]/[0.08] text-[10px] uppercase tracking-[0.14em] text-[#ff8a8d]">
                    No fake event dates
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[112rem] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
        <div className="space-y-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff3131]">Editorial trust layer</p>
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Affiliate-ready without pretending to be bigger than we are.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-zinc-400">
            Reviews and buying guides are structured around disclosure, source quality, product evidence and editor accountability. Product review samples can be accepted, but conclusions stay independent.
          </p>
          <div className="flex flex-wrap gap-3">
            <EditorialButton href="/reviews" tone="ghost">Read Reviews</EditorialButton>
            <EditorialButton href="/disclosure" tone="ghost">Disclosure</EditorialButton>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Affiliate Disclosure', text: 'Commercial links are disclosed and separated from editorial judgment.', href: '/disclosure', icon: ShieldCheck },
            { title: 'Product Reviews', text: 'Hands-on review paths can be marked and editor-approved by Hazar Volga Ekiz.', href: '/reviews', icon: Eye },
            { title: 'Buying Intent', text: 'Buyer guides, comparisons and starter kits are surfaced for affiliate readiness.', href: '/buyers-guides', icon: ShoppingBag },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[0.7rem] border border-white/10 bg-white/[0.035] p-6 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[#ff3131]/40 hover:bg-white/[0.055]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff3131]/10 text-[#ff3131]">
                <ThinIcon icon={item.icon} />
              </span>
              <h3 className="mt-7 text-base font-black uppercase tracking-[-0.01em] text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
              <div className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#ff3131]">
                Open <ArrowRight className="h-3.5 w-3.5 transition-transform duration-700 group-hover:translate-x-1" strokeWidth={1.5} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[112rem] px-5 sm:px-8 lg:px-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Featured Guides</p>
            <SectionTitle>Pilot Knowledge Feed</SectionTitle>
          </div>
          <Link href="/academy/roadmap" className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#ff3131] transition-colors hover:text-white sm:flex">
            View academy <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        {guideCards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {guideCards.map((card) => (
              <Link
                key={card.slug}
                href={card.href}
                className="group overflow-hidden rounded-[0.7rem] border border-white/10 bg-[#0b0d10] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[#ff3131]/[0.35]"
              >
                <div className="relative aspect-[16/10] border-b border-white/10">
                  {card.coverImage && (
                    <ResilientCoverImage
                      src={card.coverImage}
                      fallbackSrc={card.fallbackCoverImage}
                      alt={card.coverImageAlt || card.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      unoptimized={true}
                      className="object-cover opacity-80 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04] group-hover:opacity-100"
                    />
                  )}
                </div>
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <Badge variant="outline" className="rounded-[0.3rem] border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                      {card.category}
                    </Badge>
                    <span className="font-mono text-[10px] text-zinc-500">{card.readingTime}</span>
                  </div>
                  <h3 className="line-clamp-2 text-lg font-black leading-tight text-white transition-colors duration-500 group-hover:text-[#ff3131]">
                    {card.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{card.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[0.7rem] border border-dashed border-white/[0.12] py-16 text-center text-zinc-500">
            Featured guides will appear here as content is published.
          </div>
        )}
      </section>

      <section className="mx-auto mt-20 max-w-[112rem] px-5 sm:px-8 lg:px-16">
        <div className="rounded-[0.8rem] border border-white/10 bg-[#0b0d10]/[0.92] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white md:text-3xl">
              Join a global community of <span className="text-[#ff3131]">FPV pilots</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Community growth is earned, not inflated. These homepage signals show what FPVLovers can honestly stand behind today.
            </p>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {dynamicCommunityStats.map((stat) => (
              <CommunityStat key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[112rem] px-5 sm:px-8 lg:px-16">
        <div className="rounded-[0.8rem] border border-white/10 bg-[#0b0d10]/[0.92] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:p-10">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Trusted by process, not claims</p>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em] text-white md:text-3xl">
              Editorial standards pilots can audit
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {editorialProofCards.map((card) => (
              <div key={card.title} className="rounded-[0.7rem] border border-white/10 bg-white/[0.035] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff3131]/10 text-[#ff3131]">
                  <ThinIcon icon={card.icon} />
                </div>
                <h3 className="mt-8 text-lg font-black uppercase tracking-[-0.02em] text-white">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{card.text}</p>
                <div className="mt-6 border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff8a8d]">
                  {card.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[112rem] px-5 sm:px-8 lg:px-16">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[0.8rem] border border-white/10 bg-[#0b0d10]/[0.92] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[0.7rem] border border-[#ff3131]/25 bg-[#ff3131]/[0.06] text-[#ff3131]">
                <ThinIcon icon={Mail} className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">Stay in the loop</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                  Get practical FPV tutorials, tool updates, buying guides and verified race coverage without hype.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <NewsletterWidget />
            </div>
          </div>

          <div className="rounded-[0.8rem] border border-white/10 bg-[#0b0d10]/[0.92] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Brands covered in FPV guides</p>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em] text-white">Tracked, not claimed as partners</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                FPVLovers can cover products from these FPV ecosystem brands. This is not a partnership claim unless a sponsor agreement is explicitly published.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {coveredBrands.map((brand) => (
                <div
                  key={brand}
                  className="rounded-[0.45rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-zinc-300"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
