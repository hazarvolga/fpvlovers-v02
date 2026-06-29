import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { BookOpen, Compass, ShieldCheck } from 'lucide-react';
import { HubTracker } from '@/components/HubTracker';
import { DiscoveryLink } from '@/components/DiscoveryLink';
import { SubpageHero, SubpageShell } from '@/components/subpage/SubpageChrome';

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = await params;
  const topic = resolvedParams.topic;

  const allContent = await listPublishedContentAsync();
  const topicContent = allContent.filter((a: PublishedArtifact) => a.metadata?.topics?.includes(topic));

  const displayTopic = topic.replace(/-/g, ' ').toUpperCase();

  const metadata: Metadata = {
    title: `${displayTopic} Knowledge Library | FPVLovers`,
    description: `Everything you need to know about ${displayTopic.toLowerCase()} in FPV. Guides, news, tutorials and more.`,
  };

  if (topicContent.length < 2) {
    metadata.robots = { index: false };
  }

  return metadata;
}

const COMMERCIAL_TYPES = new Set(['review', 'comparison', 'buyer-guide', 'product-roundup']);

function formatLabel(value: string | undefined): string {
  return (value || 'unclassified').replace(/-/g, ' ');
}

function isCommercialArticle(article: PublishedArtifact): boolean {
  return COMMERCIAL_TYPES.has(article.metadata?.contentType || '');
}

function TopicArticleRow({
  article,
  topic,
  tone = 'orange',
}: {
  article: PublishedArtifact;
  topic: string;
  tone?: 'cyan' | 'orange' | 'green';
}) {
  const accent = tone === 'green' ? '#00FF66' : tone === 'cyan' ? '#7dd3fc' : '#FF5C00';
  const commercial = isCommercialArticle(article);

  return (
    <DiscoveryLink
      href={`/article/${article.slug}`}
      targetSlug={article.slug}
      linkType="search_result"
      searchQuery={topic}
      className="fpv-public-card fpv-public-card-hover group block rounded-lg p-4 transition-all"
    >
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>
        <span>{formatLabel(article.metadata?.contentType)}</span>
        <span className="text-white/25">/</span>
        <span>{formatLabel(article.metadata?.difficulty)}</span>
        {commercial && (
          <span className="rounded bg-[#FFB800]/10 px-2 py-0.5 text-[#FFB800]">Disclosure</span>
        )}
      </div>
      <div className="font-bold text-white transition-colors group-hover:text-[#FF5C00]">
        {article.title}
      </div>
      {article.excerpt && (
        <p className="mt-2 line-clamp-2 text-sm text-[#A0A0A0]">{article.excerpt}</p>
      )}
    </DiscoveryLink>
  );
}

export default async function TopicHubPage({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = await params;
  const topic = resolvedParams.topic;

  const allContent = await listPublishedContentAsync();
  const topicContent = allContent.filter((a: PublishedArtifact) => a.metadata?.topics?.includes(topic));

  if (topicContent.length === 0) {
    const displayTopic = topic.replace(/-/g, ' ').toUpperCase();
    return (
      <SubpageShell className="flex min-h-[50vh] max-w-7xl flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-tighter text-white">
          {displayTopic} <span className="text-[#FF5C00]">Library</span>
        </h1>
        <p className="text-[#A0A0A0] max-w-md text-sm mb-8">
          We are currently preparing content for this hub. Check back soon for guides, news, and tutorials on {displayTopic.toLowerCase()}.
        </p>
        <Link href="/search" className="px-6 py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/80 text-white font-bold uppercase tracking-wider text-xs rounded transition-all">
          Explore All Content
        </Link>
      </SubpageShell>
    );
  }

  const featured = topicContent.filter((a: PublishedArtifact) => a.metadata?.difficulty === 'advanced' || a.metadata?.contentType === 'guide').slice(0, 2);
  const beginner = topicContent.filter((a: PublishedArtifact) => a.metadata?.difficulty === 'beginner');
  const advanced = topicContent.filter((a: PublishedArtifact) => a.metadata?.difficulty === 'advanced' || a.metadata?.difficulty === 'expert');
  const allVisible = topicContent.slice(0, 12);
  const commercialCount = topicContent.filter(isCommercialArticle).length;
  const contentTypeCount = new Set(topicContent.map((a) => a.metadata?.contentType || a.template || 'article')).size;

  // Infer related components
  const relatedComponents = new Set<string>();
  topicContent.forEach((a: PublishedArtifact) => {
    a.metadata?.components?.forEach((c: string) => relatedComponents.add(c));
  });

  const displayTopic = topic.replace(/-/g, ' ').toUpperCase();

  return (
    <SubpageShell className="max-w-7xl">
      <HubTracker hubType="topic" hubName={displayTopic} />
      <SubpageHero
        label="Topic Library"
        title={displayTopic}
        accent="Knowledge"
        description={`Explore FPVLovers guides, tutorials, reviews, comparisons, and racing intelligence related to ${displayTopic.toLowerCase()}.`}
        image="/images/fallbacks/fpv-academy-beginner.webp"
        imageAlt={`${displayTopic} FPV knowledge hub`}
        stats={[
          { label: 'Indexed artifacts', value: String(topicContent.length) },
          { label: 'Content types', value: String(contentTypeCount) },
          { label: 'Disclosure-aware', value: String(commercialCount) },
          { label: 'Search path', value: 'Open' },
        ]}
        actions={[{ label: 'Search Topic', href: `/search?q=${encodeURIComponent(topic)}` }]}
      />

      {commercialCount > 0 && (
        <div className="mb-10 mt-12 flex items-start gap-3 rounded-lg border border-[#FFB800]/25 bg-[#FFB800]/10 p-4 text-sm text-[#D6D6D6]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB800]" />
          <p>
            Some {displayTopic.toLowerCase()} pages are commercial-intent guides or reviews. FPVLovers keeps affiliate disclosure and editorial-policy links visible on commercial article pages.
          </p>
        </div>
      )}

      {featured.length > 0 && (
        <section className="mb-12 mt-12">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-black uppercase tracking-widest text-white">
            <BookOpen className="w-5 h-5" /> Featured {displayTopic} Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((a: PublishedArtifact) => (
              <DiscoveryLink
                key={a.slug}
                href={`/article/${a.slug}`}
                targetSlug={a.slug}
                linkType="search_result"
                searchQuery={topic}
                className="fpv-public-card fpv-public-card-hover group relative block overflow-hidden rounded-lg"
              >
                {a.media?.coverImage?.src && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image src={a.media.coverImage.src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050607] to-transparent" />
                  </div>
                )}
                <div className="p-6 relative z-10 -mt-12">
                  <span className="mb-3 inline-block rounded border border-[#FF5C00]/40 bg-black/80 px-3 py-1 text-[10px] font-black tracking-widest text-[#FF5C00] backdrop-blur-md">
                    {a.category}
                  </span>
                  <h3 className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-[#FF5C00]">{a.title}</h3>
                  <p className="text-sm text-[#A0A0A0] line-clamp-2">{a.excerpt}</p>
                </div>
              </DiscoveryLink>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4">
            Beginner Content
          </h2>
          <div className="flex flex-col gap-4">
            {beginner.length === 0 ? <p className="text-[#A0A0A0] italic text-sm">No beginner content yet.</p> : beginner.map((a: PublishedArtifact) => (
              <TopicArticleRow key={a.slug} article={a} topic={topic} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4">
            Advanced Content
          </h2>
          <div className="flex flex-col gap-4">
            {advanced.length === 0 ? <p className="text-[#A0A0A0] italic text-sm">No advanced content yet.</p> : advanced.map((a: PublishedArtifact) => (
              <TopicArticleRow key={a.slug} article={a} topic={topic} tone="orange" />
            ))}
          </div>
        </section>
      </div>

      <section className="fpv-public-panel mb-12 rounded-xl p-6">
        <h2 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF5C00]">
          <Compass className="w-4 h-4" /> All {displayTopic} Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allVisible.map((article) => (
            <TopicArticleRow key={article.slug} article={article} topic={topic} tone={isCommercialArticle(article) ? 'green' : 'cyan'} />
          ))}
        </div>
      </section>

      {relatedComponents.size > 0 && (
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF5C00]">
            Related Components
          </h2>
          <div className="flex flex-wrap gap-3">
            {Array.from(relatedComponents).map((comp: string) => (
              <Link key={comp} href={`/components/${comp}`} className="rounded border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:border-[#FF5C00]/50 hover:text-[#FF5C00]">
                {comp.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </section>
      )}
    </SubpageShell>
  );
}
