"use client";

import React, { useState, useMemo } from 'react';
import { type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { DiscoveryLink } from '@/components/DiscoveryLink';

interface SearchClientProps {
  initialContent: PublishedArtifact[];
  initialQuery: string;
}

const COMMERCIAL_TYPES = new Set(['review', 'comparison', 'buyer-guide', 'product-roundup']);

function formatLabel(value: string | undefined): string {
  return (value || 'unclassified').replace(/-/g, ' ');
}

function articleSearchText(article: PublishedArtifact): string {
  return [
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
}

function isCommercialArticle(article: PublishedArtifact): boolean {
  return COMMERCIAL_TYPES.has(article.metadata?.contentType || '');
}

export function SearchClient({ initialContent, initialQuery }: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [topicFilter, setTopicFilter] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');

  // Extract unique filter options from content
  const options = useMemo(() => {
    const topics = new Set<string>();
    const disciplines = new Set<string>();
    const difficulties = new Set<string>();
    const audiences = new Set<string>();
    const contentTypes = new Set<string>();

    initialContent.forEach(a => {
      a.metadata?.topics?.forEach(t => topics.add(t));
      a.metadata?.discipline?.forEach(d => disciplines.add(d));
      if (a.metadata?.difficulty) difficulties.add(a.metadata.difficulty);
      a.metadata?.audience?.forEach(au => audiences.add(au));
      if (a.metadata?.contentType) contentTypes.add(a.metadata.contentType);
    });

    return {
      topics: Array.from(topics).sort(),
      disciplines: Array.from(disciplines).sort(),
      difficulties: Array.from(difficulties).sort(),
      audiences: Array.from(audiences).sort(),
      contentTypes: Array.from(contentTypes).sort(),
    };
  }, [initialContent]);

  const filteredContent = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialContent.filter(a => {
      // Text search
      if (q) {
        if (!articleSearchText(a).includes(q)) return false;
      }

      // Metadata filters
      if (topicFilter && !a.metadata?.topics?.includes(topicFilter)) return false;
      if (disciplineFilter && !a.metadata?.discipline?.some((discipline) => discipline === disciplineFilter)) return false;
      if (difficultyFilter && a.metadata?.difficulty !== difficultyFilter) return false;
      if (audienceFilter && !a.metadata?.audience?.some((audience) => audience === audienceFilter)) return false;
      if (contentTypeFilter && a.metadata?.contentType !== contentTypeFilter) return false;

      return true;
    });
  }, [initialContent, query, topicFilter, disciplineFilter, difficultyFilter, audienceFilter, contentTypeFilter]);
  const activeFilterCount = [topicFilter, disciplineFilter, difficultyFilter, audienceFilter, contentTypeFilter]
    .filter(Boolean).length + (query.trim() ? 1 : 0);
  const commercialResultCount = filteredContent.filter(isCommercialArticle).length;
  const resetFilters = () => {
    setQuery('');
    setTopicFilter('');
    setDisciplineFilter('');
    setDifficultyFilter('');
    setAudienceFilter('');
    setContentTypeFilter('');
  };

  // Track search event after a short debounce
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (query || topicFilter || disciplineFilter || difficultyFilter || audienceFilter || contentTypeFilter) {
        import('@/lib/analytics').then(({ trackSearchEvent }) => {
          trackSearchEvent(query, filteredContent.length, {
            topic: topicFilter,
            discipline: disciplineFilter,
            difficulty: difficultyFilter,
            audience: audienceFilter,
            contentType: contentTypeFilter
          });
        });
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [query, topicFilter, disciplineFilter, difficultyFilter, audienceFilter, contentTypeFilter, filteredContent.length]);

  return (
    <div className="flex flex-col items-start gap-8 lg:flex-row">
      {/* Filters Sidebar */}
      <aside className="fpv-public-card sticky top-28 flex w-full flex-shrink-0 flex-col gap-6 rounded-lg p-6 lg:w-64">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0A0A0]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search title, topic, body..."
            className="w-full rounded border border-white/10 bg-black/60 py-2 pl-9 pr-3 font-mono text-xs uppercase text-white placeholder:text-white/25 focus:border-[#FF5C00] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {['buyer-guide', 'review', 'comparison', 'tutorial'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setContentTypeFilter(type)}
              className={`rounded border px-2 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${
                contentTypeFilter === type
                  ? 'border-[#FF5C00] bg-[#FF5C00]/15 text-[#FF5C00]'
                  : 'border-white/10 bg-black/30 text-white/55 hover:border-[#FF5C00]/40 hover:text-white'
              }`}
            >
              {formatLabel(type)}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#ff9b71]">Topic</label>
          <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} className="w-full rounded border border-white/10 bg-black/60 p-2 font-mono text-xs uppercase text-white focus:border-[#FF5C00] focus:outline-none">
            <option value="">All Topics</option>
            {options.topics.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#ff9b71]">Discipline</label>
          <select value={disciplineFilter} onChange={e => setDisciplineFilter(e.target.value)} className="w-full rounded border border-white/10 bg-black/60 p-2 font-mono text-xs uppercase text-white focus:border-[#FF5C00] focus:outline-none">
            <option value="">All Disciplines</option>
            {options.disciplines.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#ff9b71]">Difficulty</label>
          <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="w-full rounded border border-white/10 bg-black/60 p-2 font-mono text-xs uppercase text-white focus:border-[#FF5C00] focus:outline-none">
            <option value="">All Difficulties</option>
            {options.difficulties.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#ff9b71]">Audience</label>
          <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)} className="w-full rounded border border-white/10 bg-black/60 p-2 font-mono text-xs uppercase text-white focus:border-[#FF5C00] focus:outline-none">
            <option value="">All Audiences</option>
            {options.audiences.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#ff9b71]">Content Type</label>
          <select value={contentTypeFilter} onChange={e => setContentTypeFilter(e.target.value)} className="w-full rounded border border-white/10 bg-black/60 p-2 font-mono text-xs uppercase text-white focus:border-[#FF5C00] focus:outline-none">
            <option value="">All Types</option>
            {options.contentTypes.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 rounded border border-white/10 bg-black/40 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 transition-colors hover:border-[#FF5C00]/60 hover:text-[#FF5C00]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset filters
          </button>
        )}
      </aside>

      {/* Results Grid */}
      <div className="min-w-0 flex-1">
        <div className="mb-6 rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">
                {filteredContent.length} results / {initialContent.length} indexed
              </p>
              <p className="mt-1 text-sm text-[#A0A0A0]">
                Full-text scan covers titles, excerpts, metadata, topics, components, and article body sections.
              </p>
            </div>
            {commercialResultCount > 0 && (
              <div className="flex items-center gap-2 rounded border border-[#FFB800]/25 bg-[#FFB800]/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#FFB800]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {commercialResultCount} disclosure-aware
              </div>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredContent.length === 0 ? (
          <div className="col-span-full p-12 text-center text-[#A0A0A0] border border-dashed border-white/10 rounded">
            <p className="text-lg font-bold text-white">No results found.</p>
            <p className="mt-2 text-sm">Try clearing one filter or searching by component names like ELRS, O3, goggles, LiPo, PID, or racing.</p>
          </div>
        ) : (
          filteredContent.map(a => {
            const commercial = isCommercialArticle(a);
            return (
              <DiscoveryLink
                key={a.slug}
                href={`/article/${a.slug}`}
                targetSlug={a.slug}
                linkType="search_result"
                searchQuery={query}
                className="fpv-public-card fpv-public-card-hover group relative block rounded-lg p-6 transition-all"
              >
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase text-[#ff9b71]">
                  <span>{formatLabel(a.metadata?.difficulty)} &bull; {formatLabel(a.metadata?.contentType)}</span>
                  {commercial ? (
                    <span className="bg-[#FFB800]/10 px-2 py-0.5 rounded text-[#FFB800]">Disclosure</span>
                  ) : a.metadata?.topics?.[0] ? (
                    <span className="bg-white/10 px-2 py-0.5 rounded">{formatLabel(a.metadata.topics[0])}</span>
                  ) : null}
                </div>
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-[#FF5C00]">{a.title}</h3>
                <p className="text-sm text-[#A0A0A0] line-clamp-3">{a.excerpt || 'FPVLovers editorial artifact with structured metadata and article sections.'}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(a.metadata?.topics || []).slice(0, 3).map((topic) => (
                    <span key={topic} className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/45">
                      {formatLabel(topic)}
                    </span>
                  ))}
                </div>
              </DiscoveryLink>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
