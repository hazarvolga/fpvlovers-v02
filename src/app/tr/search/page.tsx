import React from 'react';
import { listPublishedContentAsync } from '@/lib/content-automation/content-reader';
import { SubpageHero, SubpageShell } from '@/components/subpage/SubpageChrome';
import { SearchClient } from '@/features/search/components/SearchClient';
import { buildSearchDocument } from '@/lib/search/search-document';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'Arama: FPV rehberlerinde ara | FPVLovers',
  description: 'Türkçe FPV içeriklerinde başlık, konu ve gövde metninde ara.',
  path: '/search',
  locale: 'tr',
  type: 'website',
});

export default async function TurkishSearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const allContent = await listPublishedContentAsync('tr');
  const searchIndex = allContent.map((article) => buildSearchDocument(article, 'tr'));
  const resolvedParams = await searchParams;
  const initialQuery = Array.isArray(resolvedParams.q) ? resolvedParams.q[0] : resolvedParams.q || '';
  const commercialCount = searchIndex.filter((article) => (
    ['review', 'comparison', 'buyer-guide', 'product-roundup'].includes(article.metadata?.contentType || '')
  )).length;

  return (
    <SubpageShell className="max-w-7xl">
      <SubpageHero
        label="FPV Bilgi Dizini"
        title="FPV'de ara,"
        accent="kütüphanede."
        description="FPVLovers eğitimlerini, satın alma rehberlerini, incelemeleri, karşılaştırmaları, yarış haberlerini ve teknik referansları tek bir editoryal dizinde ara."
        image={HUB_COVER_IMAGES.search}
        imageAlt="FPV drone bilgi dizini görseli"
        stats={[
          { label: 'Yayınlanan içerik', value: String(searchIndex.length) },
          { label: 'Ticari rehber', value: String(commercialCount) },
          { label: 'Editoryal dizin', value: 'Aktif' },
          { label: 'Açıklama yolu', value: 'Açık' },
        ]}
      />

      <div className="mt-12">
          <SearchClient locale="tr" initialContent={searchIndex} initialQuery={initialQuery} />
      </div>
    </SubpageShell>
  );
}
