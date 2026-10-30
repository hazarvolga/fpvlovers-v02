import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { SubpageHero, SubpageSectionHeader, SubpageShell } from '@/components/subpage/SubpageChrome';
import { LevelBadge } from '@/components/ui/level-badge';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import {
  GUIDE_GROUPS,
  READER_LEVELS,
  getGuideGroup,
  getGuideGroupById,
  getGuideGroupDescription,
  getGuideGroupLabel,
  getReaderLevelLabel,
  toReaderLevel,
  type GuideGroup,
  type ReaderLevel,
} from '@/lib/content-taxonomy';
import { localizePath, type Locale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

type StatSource = 'published' | 'beginner' | 'topics';

type HeroStatCopy = { label: string; source: StatSource } | { label: string; value: string };
type HeroActionCopy = { label: string; target: { kind: 'beginner-guides' } | { kind: 'path'; href: string } };

type GuidesCopy = {
  hero: {
    label: string;
    title: string;
    accent: string;
    description: string;
    imageAlt: string;
    stats: HeroStatCopy[];
    actions: HeroActionCopy[];
  };
  filterLabel: string;
  levelLabel: string;
  topicLabel: string;
  allLevels: string;
  allTopics: string;
  guidesCount: (count: number) => string;
  allGuides: string;
  levelGuides: (levelLabel: string) => string;
  emptyResult: string;
  showAllLevels: string;
  zeroContent: string;
  engineering: {
    label: string;
    title: string;
    description: string;
  };
};

const COPY: Record<Locale, GuidesCopy> = {
  en: {
    hero: {
      label: 'Guides',
      title: 'FPV guides',
      accent: 'for every level.',
      description:
        "Pick your level and a topic. Every guide is tagged Beginner, Intermediate, or Advanced so you know what you're getting into.",
      imageAlt: 'FPV drone guides library visual',
      stats: [
        { label: 'Published guides', source: 'published' },
        { label: 'Beginner guides', source: 'beginner' },
        { label: 'Topics', source: 'topics' },
        { label: 'New to FPV?', value: 'Start Here' },
      ],
      actions: [
        { label: 'Beginner guides', target: { kind: 'beginner-guides' } },
        { label: 'New to FPV? Start here', target: { kind: 'path', href: '/academy' } },
      ],
    },
    filterLabel: 'Filter guides',
    levelLabel: 'Level',
    topicLabel: 'Topic',
    allLevels: 'All levels',
    allTopics: 'All topics',
    guidesCount: (count) => `${count} guides`,
    allGuides: 'All guides',
    levelGuides: (levelLabel) => `${levelLabel} guides`,
    emptyResult: 'No guides match this combination yet.',
    showAllLevels: 'Show all levels',
    zeroContent: 'No guides have been published in this language yet. Browse the English guides.',
    engineering: {
      label: 'Advanced',
      title: 'Engineering deep dives',
      description: 'Flight control research, propulsion, RF links, and aircraft systems.',
    },
  },
  tr: {
    hero: {
      label: 'Rehberler',
      title: 'Her seviye için',
      accent: 'FPV rehberleri.',
      description: 'Seviyene ve konuya göre filtrele: uçuş, toplama, ayar, sorun giderme, satın alma, kurallar ve yarış.',
      imageAlt: 'FPV drone rehber kütüphanesi görseli',
      stats: [
        { label: 'Yayınlanan rehber', source: 'published' },
        { label: 'Başlangıç rehberi', source: 'beginner' },
        { label: 'Konu', source: 'topics' },
        { label: "FPV'ye yeni misin?", value: 'Buradan Başla' },
      ],
      actions: [
        { label: 'Başlangıç rehberleri', target: { kind: 'beginner-guides' } },
        { label: "FPV'ye yeni misin? Buradan başla", target: { kind: 'path', href: '/academy' } },
      ],
    },
    filterLabel: 'Rehberleri filtrele',
    levelLabel: 'Seviye',
    topicLabel: 'Konu',
    allLevels: 'Tüm seviyeler',
    allTopics: 'Tüm konular',
    guidesCount: (count) => `${count} rehber`,
    allGuides: 'Tüm rehberler',
    levelGuides: (levelLabel) => `${levelLabel} rehberleri`,
    emptyResult: 'Bu kombinasyona uyan rehber yok.',
    showAllLevels: 'Tüm seviyeleri göster',
    zeroContent: 'Bu dilde yayınlanmış rehber henüz yok. İngilizce rehberlere göz atabilirsin.',
    engineering: {
      label: 'İleri',
      title: 'Mühendislik detayları',
      description: 'Uçuş kontrolü araştırmaları, itki sistemleri, RF linkleri ve hava aracı sistemleri.',
    },
  },
};

function buildHref(level: string | undefined, topic: string | undefined, locale: Locale): string {
  const params = new URLSearchParams();
  if (level) params.set('level', level);
  if (topic) params.set('topic', topic);
  const query = params.toString();
  return localizePath(query ? `/guides?${query}` : '/guides', locale);
}

function sortNewestFirst(a: PublishedArtifact, b: PublishedArtifact): number {
  return (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0);
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-10 items-center rounded-full border px-4 text-[11px] font-black uppercase tracking-[0.12em] transition-colors',
        active
          ? 'border-[#ff3131]/60 bg-[#ff3131]/[0.12] text-white'
          : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white',
      )}
    >
      {children}
    </Link>
  );
}

function GuideCard({ article, locale }: { article: PublishedArtifact; locale: Locale }) {
  const group = getGuideGroup(article.category);
  return (
    <Link
      href={localizePath(`/article/${article.slug}`, locale)}
      className="fpv-public-card fpv-public-card-hover group flex h-full flex-col rounded-lg p-5 transition-all"
    >
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge difficulty={article.metadata?.difficulty} locale={locale} />
        {group && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            {getGuideGroupLabel(group, locale)}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-bold leading-snug text-white transition-colors group-hover:text-[#ff3131]">
        {article.title}
      </h3>
      {article.excerpt && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{article.excerpt}</p>
      )}
    </Link>
  );
}

function resultsTitleFor(
  level: ReaderLevel | undefined,
  topic: GuideGroup | undefined,
  locale: Locale,
  copy: GuidesCopy,
): string {
  if (topic) {
    const levelLabel = level ? getReaderLevelLabel(level, locale) : undefined;
    return [levelLabel, getGuideGroupLabel(topic, locale)].filter(Boolean).join(' · ');
  }
  return level ? copy.levelGuides(getReaderLevelLabel(level, locale)) : copy.allGuides;
}

export async function GuidesHub({ locale, level, topic }: { locale: Locale; level?: string; topic?: string }) {
  const copy = COPY[locale];
  const requestedLevel = level;
  const selectedLevel: ReaderLevel | undefined = READER_LEVELS.some((item) => item.id === requestedLevel)
    ? (requestedLevel as ReaderLevel)
    : undefined;
  const selectedTopic = getGuideGroupById(topic);

  const content = await listPublishedContentAsync(locale);
  const guides = content
    .filter((article) => !selectedLevel || toReaderLevel(article.metadata?.difficulty) === selectedLevel)
    .filter((article) => !selectedTopic || getGuideGroup(article.category)?.id === selectedTopic.id)
    .sort(sortNewestFirst);

  const beginnerCount = content.filter((article) => toReaderLevel(article.metadata?.difficulty) === 'beginner').length;
  const resultsTitle = resultsTitleFor(selectedLevel, selectedTopic, locale, copy);
  const statCounts = { published: content.length, beginner: beginnerCount, topics: GUIDE_GROUPS.length };
  const heroStats = copy.hero.stats.map((stat) => ({
    label: stat.label,
    value: 'source' in stat ? String(statCounts[stat.source]) : stat.value,
  }));
  const heroActions = copy.hero.actions.map((action) => ({
    label: action.label,
    href:
      action.target.kind === 'beginner-guides'
        ? buildHref('beginner', selectedTopic?.id, locale)
        : localizePath(action.target.href, locale),
  }));

  return (
    <SubpageShell>
      <SubpageHero
        label={copy.hero.label}
        title={copy.hero.title}
        accent={copy.hero.accent}
        description={copy.hero.description}
        image={HUB_COVER_IMAGES.guides}
        imageAlt={copy.hero.imageAlt}
        stats={heroStats}
        actions={heroActions}
      />

      <section className="mt-10 space-y-5" aria-label={copy.filterLabel}>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">{copy.levelLabel}</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip href={buildHref(undefined, selectedTopic?.id, locale)} active={!selectedLevel}>{copy.allLevels}</FilterChip>
            {READER_LEVELS.map((item) => (
              <FilterChip key={item.id} href={buildHref(item.id, selectedTopic?.id, locale)} active={selectedLevel === item.id}>
                {getReaderLevelLabel(item.id, locale)}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">{copy.topicLabel}</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip href={buildHref(selectedLevel, undefined, locale)} active={!selectedTopic}>{copy.allTopics}</FilterChip>
            {GUIDE_GROUPS.map((group) => (
              <FilterChip key={group.id} href={buildHref(selectedLevel, group.id, locale)} active={selectedTopic?.id === group.id}>
                {getGuideGroupLabel(group, locale)}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        {content.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/[0.12] px-6 py-12 text-center text-sm text-zinc-400">
            <Link href="/guides" className="text-[#ff3131] hover:underline">{copy.zeroContent}</Link>
          </div>
        ) : (
          <>
            <SubpageSectionHeader label={copy.guidesCount(guides.length)} title={resultsTitle} />
            {selectedTopic && <p className="-mt-2 mb-6 text-sm text-zinc-400">{getGuideGroupDescription(selectedTopic, locale)}</p>}
            {guides.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {guides.map((article) => (
                  <GuideCard key={article.slug} article={article} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/[0.12] px-6 py-12 text-center text-sm text-zinc-400">
                {copy.emptyResult}{' '}
                <Link href={buildHref(undefined, selectedTopic?.id, locale)} className="text-[#ff3131] hover:underline">{copy.showAllLevels}</Link>
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-12">
        <Link
          href="/engineering"
          className="fpv-public-card fpv-public-card-hover group flex items-center justify-between gap-4 rounded-lg p-6"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">{copy.engineering.label}</p>
            <p className="mt-1 font-bold text-white">{copy.engineering.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{copy.engineering.description}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-[#ff3131] transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </SubpageShell>
  );
}
