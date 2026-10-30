import React from 'react';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { SubpageHero, SubpageShell } from '@/components/subpage/SubpageChrome';
import { SearchClient, type SearchDocument } from './SearchClient';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';

export const metadata = {
  title: 'Search Hub | FPVLovers',
  description: 'Search FPV guides, news, tutorials, and reviews.',
};

function buildSearchDocument(article: PublishedArtifact): SearchDocument {
  const searchText = [
    article.title,
    article.excerpt,
    article.slug,
    article.category,
    article.metadata?.contentType,
    article.metadata?.difficulty,
    ...(article.metadata?.topics || []),
    ...(article.metadata?.discipline || []),
    ...(article.metadata?.audience || []),
    ...(article.metadata?.components || []),
    ...(article.bodySections || []).map((section) => `${section.title} ${section.content}`),
  ].filter(Boolean).join(' ').toLowerCase();

  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    publishedAt: article.publishedAt,
    metadata: article.metadata,
    searchText,
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const allContent = await listPublishedContentAsync();
  const searchIndex = allContent.map(buildSearchDocument);
  const resolvedParams = await searchParams;
  const initialQuery = Array.isArray(resolvedParams.q) ? resolvedParams.q[0] : resolvedParams.q || '';
  const commercialCount = searchIndex.filter((article) => (
    ['review', 'comparison', 'buyer-guide', 'product-roundup'].includes(article.metadata?.contentType || '')
  )).length;

  return (
    <SubpageShell className="max-w-7xl">
      <SubpageHero
        label="FPV Knowledge Index"
        title="Search FPV"
        accent="Library"
        description="Search FPVLovers tutorials, buyer guides, reviews, comparisons, racing updates, and technical references from one editorial index."
        image={HUB_COVER_IMAGES.search}
        imageAlt="FPV drone knowledge index visual"
        stats={[
          { label: 'Published artifacts', value: String(searchIndex.length) },
          { label: 'Commercial guides', value: String(commercialCount) },
          { label: 'Editorial index', value: 'Active' },
          { label: 'Disclosure path', value: 'Open' },
        ]}
      />

      <div className="mt-12">
          <SearchClient initialContent={searchIndex} initialQuery={initialQuery} />
      </div>
    </SubpageShell>
  );
}
