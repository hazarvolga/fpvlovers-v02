import React from 'react';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { SearchClient } from './SearchClient';

export const metadata = {
  title: 'Search Hub | FPVLovers',
  description: 'Search FPV guides, news, tutorials, and reviews.',
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const allContent = await listPublishedContentAsync();
  const resolvedParams = await searchParams;
  const initialQuery = Array.isArray(resolvedParams.q) ? resolvedParams.q[0] : resolvedParams.q || '';
  const commercialCount = allContent.filter((article) => (
    ['review', 'comparison', 'buyer-guide', 'product-roundup'].includes(article.metadata?.contentType || '')
  )).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <div className="mb-12 overflow-hidden rounded-2xl border border-[#00F2FF]/20 bg-[#050810]/75 p-8 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)]">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
            KNOWLEDGE <span className="text-[#00F2FF]">SEARCH</span>
          </h1>
          <p className="text-[#A0A0A0] max-w-2xl text-lg mt-4">
            Search FPVLovers tutorials, buyer guides, reviews, comparisons, racing updates, and technical references from one tactical index.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-black uppercase tracking-widest">
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-white">
            <div className="text-2xl text-[#00F2FF]">{allContent.length}</div>
            Published artifacts
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-white">
            <div className="text-2xl text-[#FFB800]">{commercialCount}</div>
            Commercial guides
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-white">
            <div className="text-2xl text-[#00FF66]">Live</div>
            Editorial index
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-white">
            <div className="text-2xl text-[#FF5C00]">Open</div>
            Disclosure path
          </div>
        </div>
      </div>

      <SearchClient initialContent={allContent} initialQuery={initialQuery} />
    </div>
  );
}
