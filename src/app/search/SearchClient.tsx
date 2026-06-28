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
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Filters Sidebar */}
      <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6 p-6 hex-panel glass-panel bg-[#050810]/70 border border-white/5 rounded-lg sticky top-28">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A0A0A0]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search title, topic, body..."
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-[#222] rounded text-white font-mono text-xs uppercase focus:border-[#00F2FF] focus:outline-none"
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
                  ? 'border-[#00F2FF] bg-[#00F2FF]/15 text-[#00F2FF]'
                  : 'border-white/10 bg-black/30 text-white/55 hover:border-[#00F2FF]/40 hover:text-white'
              }`}
            >
              {formatLabel(type)}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Topic</label>
          <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Topics</option>
            {options.topics.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Discipline</label>
          <select value={disciplineFilter} onChange={e => setDisciplineFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Disciplines</option>
            {options.disciplines.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Difficulty</label>
          <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Difficulties</option>
            {options.difficulties.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Audience</label>
          <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Audiences</option>
            {options.audiences.map(o => <option key={o} value={o}>{formatLabel(o)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Content Type</label>
          <select value={contentTypeFilter} onChange={e => setContentTypeFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
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
      <div className="flex-1 min-w-0">
        <div className="mb-6 rounded-lg border border-white/10 bg-black/30 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#00F2FF]">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="block relative hex-panel glass-panel p-6 border border-white/5 hover:border-[#00F2FF]/50 bg-[#050810]/70 rounded-lg group transition-all"
              >
                <div className="text-[10px] font-mono text-[#00F2FF] uppercase mb-2 flex items-center justify-between">
                  <span>{formatLabel(a.metadata?.difficulty)} &bull; {formatLabel(a.metadata?.contentType)}</span>
                  {commercial ? (
                    <span className="bg-[#FFB800]/10 px-2 py-0.5 rounded text-[#FFB800]">Disclosure</span>
                  ) : a.metadata?.topics?.[0] ? (
                    <span className="bg-white/10 px-2 py-0.5 rounded">{formatLabel(a.metadata.topics[0])}</span>
                  ) : null}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#00F2FF] transition-colors mb-2 line-clamp-2">{a.title}</h3>
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
