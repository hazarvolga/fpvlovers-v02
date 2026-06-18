import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { Cpu } from 'lucide-react';
import { HubTracker } from '@/components/HubTracker';

export async function generateMetadata({ params }: { params: Promise<{ component: string }> }) {
  const resolvedParams = await params;
  const component = resolvedParams.component;
  
  const allContent = await listPublishedContentAsync();
  const componentContent = allContent.filter((a: PublishedArtifact) => a.metadata?.components?.includes(component));
  
  const displayComponent = component.replace(/-/g, ' ').toUpperCase();

  const metadata: any = {
    title: `${displayComponent} Component Hub | FPVLovers`,
    description: `Everything you need to know about ${displayComponent.toLowerCase()}s in FPV drones. Guides, troubleshooting, and setups.`,
  };

  if (componentContent.length < 2) {
    metadata.robots = { index: false };
  }

  return metadata;
}

export default async function ComponentHubPage({ params }: { params: Promise<{ component: string }> }) {
  const resolvedParams = await params;
  const component = resolvedParams.component;
  
  const allContent = await listPublishedContentAsync();
  const componentContent = allContent.filter((a: PublishedArtifact) => a.metadata?.components?.includes(component));

  if (componentContent.length === 0) {
    const displayComponent = component.replace(/-/g, ' ').toUpperCase();
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 min-h-[50vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">
          {displayComponent} <span className="text-[#00F2FF]">HUB</span>
        </h1>
        <p className="text-[#A0A0A0] max-w-md text-sm mb-8">
          We are currently preparing content for this hub. Check back soon for specification guides, troubleshooting, and setups for {displayComponent.toLowerCase()}s.
        </p>
        <Link href="/search" className="px-6 py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/80 text-white font-bold uppercase tracking-wider text-xs rounded transition-all">
          Explore All Content
        </Link>
      </div>
    );
  }

  const displayComponent = component.replace(/-/g, ' ').toUpperCase();

  // Infer related topics
  const relatedTopics = new Set<string>();
  componentContent.forEach((a: PublishedArtifact) => {
    a.metadata?.topics?.forEach((t: string) => relatedTopics.add(t));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <HubTracker hubType="component" hubName={displayComponent} />
      <div className="mb-12 border-b border-[#1A1A1D] pb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded bg-[#00FF66]/10 flex items-center justify-center border border-[#00FF66]/30 text-[#00FF66]">
            <Cpu className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
            {displayComponent} <span className="text-[#A0A0A0]">HUB</span>
          </h1>
        </div>
        <p className="text-[#A0A0A0] max-w-2xl text-lg mt-4">
          Hardware specification guides, troubleshooting, and setup instructions for {displayComponent.toLowerCase()}s.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {componentContent.map((a: PublishedArtifact) => (
          <Link key={a.slug} href={`/article/${a.slug}`} className="block relative hex-panel glass-panel p-6 border border-white/5 hover:border-[#00FF66]/50 bg-[#050810]/70 rounded-lg group transition-all">
            <div className="text-[10px] font-mono text-[#00FF66] uppercase mb-2">
              {a.metadata?.difficulty} &bull; {a.metadata?.contentType}
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#00FF66] transition-colors mb-2 line-clamp-2">{a.title}</h3>
            <p className="text-sm text-[#A0A0A0] line-clamp-2">{a.excerpt}</p>
          </Link>
        ))}
      </div>

      {relatedTopics.size > 0 && (
        <section className="border-t border-[#00FF66]/20 pt-8 mt-12 bg-gradient-to-t from-black to-[#00FF66]/5 p-8 rounded-lg">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#00FF66] mb-6 flex items-center gap-2">
            Related Topics
          </h2>
          <div className="flex flex-wrap gap-3">
            {Array.from(relatedTopics).map((topic: string) => (
              <Link key={topic} href={`/topics/${topic}`} className="px-4 py-2 border border-white/10 hover:border-[#00FF66]/50 rounded bg-black/40 uppercase tracking-widest text-[10px] font-black text-white/70 hover:text-[#00FF66] transition-all">
                {topic.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
