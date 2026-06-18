import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { Navbar } from '@/features/layout/components/Navbar';
import { SiteFooter } from '@/features/layout/components/SiteFooter';
import { SearchClient } from './SearchClient';

export const metadata = {
  title: 'Search Hub | FPVLovers',
  description: 'Search FPV guides, news, tutorials, and reviews.',
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const allContent = await listPublishedContentAsync();
  const resolvedParams = await searchParams;
  const initialQuery = Array.isArray(resolvedParams.q) ? resolvedParams.q[0] : resolvedParams.q || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <div className="mb-12 border-b border-[#1A1A1D] pb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          KNOWLEDGE <span className="text-[#00F2FF]">SEARCH</span>
        </h1>
        <p className="text-[#A0A0A0] max-w-2xl text-lg mt-4">
          Discover articles, guides, and tutorials across the FPV ecosystem.
        </p>
      </div>

      <SearchClient initialContent={allContent} initialQuery={initialQuery} />
    </div>
  );
}
