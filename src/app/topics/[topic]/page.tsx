import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { BookOpen, Compass, ShieldCheck } from 'lucide-react';
import { HubTracker } from '@/components/HubTracker';
import { DiscoveryLink } from '@/components/DiscoveryLink';

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = await params;
  const topic = resolvedParams.topic;

  const allContent = await listPublishedContentAsync();
  const topicContent = allContent.filter((a: PublishedArtifact) => a.metadata?.topics?.includes(topic));

  const displayTopic = topic.replace(/-/g, ' ').toUpperCase();

  const metadata: Metadata = {
    title: `${displayTopic} Hub | FPVLovers`,
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
  tone = 'cyan',
}: {
  article: PublishedArtifact;
  topic: string;
  tone?: 'cyan' | 'orange' | 'green';
}) {
  const accent = tone === 'orange' ? '#FF5C00' : tone === 'green' ? '#00FF66' : '#00F2FF';
  const commercial = isCommercialArticle(article);

  return (
    <DiscoveryLink
      href={`/article/${article.slug}`}
      targetSlug={article.slug}
      linkType="search_result"
      searchQuery={topic}
      className="group block rounded-lg border border-white/5 bg-black/40 p-4 transition-all hover:border-[#00F2FF]/35"
    >
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>
        <span>{formatLabel(article.metadata?.contentType)}</span>
        <span className="text-white/25">/</span>
        <span>{formatLabel(article.metadata?.difficulty)}</span>
        {commercial && (
          <span className="rounded bg-[#FFB800]/10 px-2 py-0.5 text-[#FFB800]">Disclosure</span>
        )}
      </div>
      <div className="font-bold text-white transition-colors group-hover:text-[#00F2FF]">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 min-h-[50vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">
          {displayTopic} <span className="text-[#00F2FF]">HUB</span>
        </h1>
        <p className="text-[#A0A0A0] max-w-md text-sm mb-8">
          We are currently preparing content for this hub. Check back soon for guides, news, and tutorials on {displayTopic.toLowerCase()}.
        </p>
        <Link href="/search" className="px-6 py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/80 text-white font-bold uppercase tracking-wider text-xs rounded transition-all">
          Explore All Content
        </Link>
      </div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <HubTracker hubType="topic" hubName={displayTopic} />
      <div className="mb-12 overflow-hidden rounded-2xl border border-[#00F2FF]/20 bg-[#050810]/75 p-8 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)]">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
            {displayTopic} <span className="text-[#00F2FF]">HUB</span>
          </h1>
          <p className="text-[#A0A0A0] max-w-2xl text-lg">
            Explore our complete collection of guides, tutorials, reviews, comparisons, and racing intelligence related to {displayTopic.toLowerCase()}.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-black uppercase tracking-widest">
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-white">
            <div className="text-2xl text-[#00F2FF]">{topicContent.length}</div>
            Indexed artifacts
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-white">
            <div className="text-2xl text-[#00FF66]">{contentTypeCount}</div>
            Content types
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-white">
            <div className="text-2xl text-[#FFB800]">{commercialCount}</div>
            Disclosure-aware
          </div>
          <Link href={`/search?q=${encodeURIComponent(topic)}`} className="rounded-lg border border-[#FF5C00]/30 bg-[#FF5C00]/10 p-4 text-[#FF5C00] transition-colors hover:border-[#FF5C00] hover:bg-[#FF5C00]/15">
            <div className="text-2xl">Search</div>
            Open tactical index
          </Link>
        </div>
      </div>

      {commercialCount > 0 && (
        <div className="mb-10 flex items-start gap-3 rounded-lg border border-[#FFB800]/25 bg-[#FFB800]/10 p-4 text-sm text-[#D6D6D6]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB800]" />
          <p>
            Some {displayTopic.toLowerCase()} pages are commercial-intent guides or reviews. FPVLovers keeps affiliate disclosure and editorial-policy links visible on commercial article pages.
          </p>
        </div>
      )}

      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-black uppercase tracking-widest text-[#00FF66] mb-6 flex items-center gap-2">
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
                className="block relative hex-panel glass-panel overflow-hidden border border-[#00FF66]/20 bg-[#050810]/70 rounded-lg group"
              >
                {a.media?.coverImage?.src && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image src={a.media.coverImage.src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
                  </div>
                )}
                <div className="p-6 relative z-10 -mt-12">
                  <span className="text-[10px] font-black tracking-widest px-3 py-1 bg-black/80 backdrop-blur-md border border-[#00FF66]/50 text-[#00FF66] rounded mb-3 inline-block">
                    {a.category}
                  </span>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#00FF66] transition-colors mb-2">{a.title}</h3>
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

      <section className="mb-12 rounded-xl border border-[#00F2FF]/15 bg-[#050810]/60 p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#00F2FF] mb-6 flex items-center gap-2">
          <Compass className="w-4 h-4" /> All {displayTopic} Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allVisible.map((article) => (
            <TopicArticleRow key={article.slug} article={article} topic={topic} tone={isCommercialArticle(article) ? 'green' : 'cyan'} />
          ))}
        </div>
      </section>

      {relatedComponents.size > 0 && (
        <section className="border-t border-[#00F2FF]/20 pt-8 mt-12">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#00F2FF] mb-6 flex items-center gap-2">
            Related Components
          </h2>
          <div className="flex flex-wrap gap-3">
            {Array.from(relatedComponents).map((comp: string) => (
              <Link key={comp} href={`/components/${comp}`} className="px-4 py-2 border border-white/10 hover:border-[#00F2FF]/50 rounded bg-black/40 uppercase tracking-widest text-[10px] font-black text-white/70 hover:text-[#00F2FF] transition-all">
                {comp.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
