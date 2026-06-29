import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { Cpu } from 'lucide-react';
import { HubTracker } from '@/components/HubTracker';
import { SubpageHero, SubpageShell } from '@/components/subpage/SubpageChrome';

export async function generateMetadata({ params }: { params: Promise<{ component: string }> }) {
  const resolvedParams = await params;
  const component = resolvedParams.component;

  const allContent = await listPublishedContentAsync();
  const componentContent = allContent.filter((a: PublishedArtifact) => a.metadata?.components?.includes(component));

  const displayComponent = component.replace(/-/g, ' ').toUpperCase();

  const metadata: Metadata = {
    title: `${displayComponent} Component Reference | FPVLovers`,
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
      <SubpageShell className="flex min-h-[50vh] max-w-7xl flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-tighter text-white">
          {displayComponent} <span className="text-[#FF5C00]">Library</span>
        </h1>
        <p className="text-[#A0A0A0] max-w-md text-sm mb-8">
          We are currently preparing content for this hub. Check back soon for specification guides, troubleshooting, and setups for {displayComponent.toLowerCase()}s.
        </p>
        <Link href="/search" className="px-6 py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/80 text-white font-bold uppercase tracking-wider text-xs rounded transition-all">
          Explore All Content
        </Link>
      </SubpageShell>
    );
  }

  const displayComponent = component.replace(/-/g, ' ').toUpperCase();

  // Infer related topics
  const relatedTopics = new Set<string>();
  componentContent.forEach((a: PublishedArtifact) => {
    a.metadata?.topics?.forEach((t: string) => relatedTopics.add(t));
  });

  return (
    <SubpageShell className="max-w-7xl">
      <HubTracker hubType="component" hubName={displayComponent} />
      <SubpageHero
        label="Component Library"
        title={displayComponent}
        accent="Reference"
        description={`Hardware specification guides, troubleshooting, and setup instructions for ${displayComponent.toLowerCase()}s.`}
        image="/images/fallbacks/fpv-build-workshop.webp"
        imageAlt={`${displayComponent} FPV component reference`}
        stats={[
          { label: 'Indexed artifacts', value: String(componentContent.length) },
          { label: 'Related topics', value: String(relatedTopics.size) },
          { label: 'Reference type', value: 'Component' },
          { label: 'Search path', value: 'Open' },
        ]}
        actions={[{ label: 'Search Component', href: `/search?q=${encodeURIComponent(component)}` }]}
      />

      <div className="mb-12 mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {componentContent.map((a: PublishedArtifact) => (
          <Link key={a.slug} href={`/article/${a.slug}`} className="fpv-public-card fpv-public-card-hover group relative block rounded-lg p-6 transition-all">
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#ff9b71]">
              <Cpu className="h-3.5 w-3.5 text-[#FF5C00]" />
              {a.metadata?.difficulty} &bull; {a.metadata?.contentType}
            </div>
            <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-[#FF5C00]">{a.title}</h3>
            <p className="text-sm text-[#A0A0A0] line-clamp-2">{a.excerpt}</p>
          </Link>
        ))}
      </div>

      {relatedTopics.size > 0 && (
        <section className="fpv-public-panel mt-12 rounded-lg p-8">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF5C00]">
            Related Topics
          </h2>
          <div className="flex flex-wrap gap-3">
            {Array.from(relatedTopics).map((topic: string) => (
              <Link key={topic} href={`/topics/${topic}`} className="rounded border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:border-[#FF5C00]/50 hover:text-[#FF5C00]">
                {topic.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </section>
      )}
    </SubpageShell>
  );
}
