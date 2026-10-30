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
  toReaderLevel,
  type ReaderLevel,
} from '@/lib/content-taxonomy';
import { generateSeoMetadata } from '@/lib/seo/metadata';
import { cn } from '@/lib/utils';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'FPV Guides for Every Level | FPVLovers',
  description: 'Browse FPV guides by skill level and topic: flying skills, building, tuning, troubleshooting, buying advice, rules, and racing.',
  path: '/guides',
  type: 'website',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(level?: string, topic?: string): string {
  const params = new URLSearchParams();
  if (level) params.set('level', level);
  if (topic) params.set('topic', topic);
  const query = params.toString();
  return query ? `/guides?${query}` : '/guides';
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

function GuideCard({ article }: { article: PublishedArtifact }) {
  const group = getGuideGroup(article.category);
  return (
    <Link
      href={`/article/${article.slug}`}
      className="fpv-public-card fpv-public-card-hover group flex h-full flex-col rounded-lg p-5 transition-all"
    >
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge difficulty={article.metadata?.difficulty} />
        {group && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{group.label}</span>
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

export default async function GuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedLevel = firstParam(params.level);
  const level: ReaderLevel | undefined = READER_LEVELS.some((item) => item.id === requestedLevel)
    ? (requestedLevel as ReaderLevel)
    : undefined;
  const topic = getGuideGroupById(firstParam(params.topic));

  const allContent = await listPublishedContentAsync();
  const guides = allContent
    .filter((article) => !level || toReaderLevel(article.metadata?.difficulty) === level)
    .filter((article) => !topic || getGuideGroup(article.category)?.id === topic.id)
    .sort(sortNewestFirst);

  const beginnerCount = allContent.filter((article) => toReaderLevel(article.metadata?.difficulty) === 'beginner').length;
  const levelLabel = level ? READER_LEVELS.find((item) => item.id === level)?.label : undefined;
  const resultsTitle = topic
    ? [levelLabel, topic.label].filter(Boolean).join(' · ')
    : levelLabel ? `${levelLabel} guides` : 'All guides';

  return (
    <SubpageShell>
      <SubpageHero
        label="Guides"
        title="FPV guides"
        accent="for every level."
        description="Pick your level and a topic. Every guide is tagged Beginner, Intermediate, or Advanced so you know what you're getting into."
        image={HUB_COVER_IMAGES.guides}
        imageAlt="FPV drone guides library visual"
        stats={[
          { label: 'Published guides', value: String(allContent.length) },
          { label: 'Beginner guides', value: String(beginnerCount) },
          { label: 'Topics', value: String(GUIDE_GROUPS.length) },
          { label: 'New to FPV?', value: 'Start Here' },
        ]}
        actions={[
          { label: 'Beginner guides', href: buildHref('beginner', topic?.id) },
          { label: 'New to FPV? Start here', href: '/academy' },
        ]}
      />

      <section className="mt-10 space-y-5" aria-label="Filter guides">
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Level</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip href={buildHref(undefined, topic?.id)} active={!level}>All levels</FilterChip>
            {READER_LEVELS.map((item) => (
              <FilterChip key={item.id} href={buildHref(item.id, topic?.id)} active={level === item.id}>
                {item.label}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Topic</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip href={buildHref(level, undefined)} active={!topic}>All topics</FilterChip>
            {GUIDE_GROUPS.map((group) => (
              <FilterChip key={group.id} href={buildHref(level, group.id)} active={topic?.id === group.id}>
                {group.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <SubpageSectionHeader label={`${guides.length} guides`} title={resultsTitle} />
        {topic && <p className="-mt-2 mb-6 text-sm text-zinc-400">{topic.description}</p>}
        {guides.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((article) => (
              <GuideCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/[0.12] px-6 py-12 text-center text-sm text-zinc-400">
            No guides match this combination yet.{' '}
            <Link href={buildHref(undefined, topic?.id)} className="text-[#ff3131] hover:underline">Show all levels</Link>
          </div>
        )}
      </section>

      <section className="mt-12">
        <Link
          href="/engineering"
          className="fpv-public-card fpv-public-card-hover group flex items-center justify-between gap-4 rounded-lg p-6"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Advanced</p>
            <p className="mt-1 font-bold text-white">Engineering deep dives</p>
            <p className="mt-1 text-sm text-zinc-400">Flight control research, propulsion, RF links, and aircraft systems.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-[#ff3131] transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </SubpageShell>
  );
}
