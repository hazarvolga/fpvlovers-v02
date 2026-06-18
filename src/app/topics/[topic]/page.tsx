import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { BookOpen } from 'lucide-react';
import { HubTracker } from '@/components/HubTracker';

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = await params;
  const topic = resolvedParams.topic;
  
  const allContent = await listPublishedContentAsync();
  const topicContent = allContent.filter((a: PublishedArtifact) => a.metadata?.topics?.includes(topic));
  
  const displayTopic = topic.replace(/-/g, ' ').toUpperCase();

  const metadata: any = {
    title: `${displayTopic} Hub | FPVLovers`,
    description: `Everything you need to know about ${displayTopic.toLowerCase()} in FPV. Guides, news, tutorials and more.`,
  };

  if (topicContent.length < 2) {
    metadata.robots = { index: false };
  }

  return metadata;
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

  // Infer related components
  const relatedComponents = new Set<string>();
  topicContent.forEach((a: PublishedArtifact) => {
    a.metadata?.components?.forEach((c: string) => relatedComponents.add(c));
  });

  const displayTopic = topic.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <HubTracker hubType="topic" hubName={displayTopic} />
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
          {displayTopic} <span className="text-[#00F2FF]">HUB</span>
        </h1>
        <p className="text-[#A0A0A0] max-w-2xl text-lg">
          Explore our complete collection of articles, guides, and tutorials related to {displayTopic.toLowerCase()}.
        </p>
      </div>
      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-black uppercase tracking-widest text-[#00FF66] mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Featured {displayTopic} Guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((a: PublishedArtifact) => (
              <Link key={a.slug} href={`/article/${a.slug}`} className="block relative hex-panel glass-panel overflow-hidden border border-[#00FF66]/20 bg-[#050810]/70 rounded-lg group">
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
              </Link>
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
              <Link key={a.slug} href={`/article/${a.slug}`} className="group block p-4 bg-black/40 border border-white/5 hover:border-[#00F2FF]/30 rounded">
                <div className="text-[#00F2FF] text-[10px] font-mono uppercase mb-1">{a.metadata?.contentType}</div>
                <div className="text-white font-bold group-hover:text-[#00F2FF] transition-colors">{a.title}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-6 border-b border-white/10 pb-4">
            Advanced Content
          </h2>
          <div className="flex flex-col gap-4">
            {advanced.length === 0 ? <p className="text-[#A0A0A0] italic text-sm">No advanced content yet.</p> : advanced.map((a: PublishedArtifact) => (
              <Link key={a.slug} href={`/article/${a.slug}`} className="group block p-4 bg-black/40 border border-white/5 hover:border-[#FF5C00]/30 rounded">
                <div className="text-[#FF5C00] text-[10px] font-mono uppercase mb-1">{a.metadata?.contentType}</div>
                <div className="text-white font-bold group-hover:text-[#FF5C00] transition-colors">{a.title}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>

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
