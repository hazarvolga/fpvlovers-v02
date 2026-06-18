"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { Search } from 'lucide-react';
import { DiscoveryLink } from '@/components/DiscoveryLink';

interface SearchClientProps {
  initialContent: PublishedArtifact[];
  initialQuery: string;
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
    return initialContent.filter(a => {
      // Text search
      if (query) {
        const q = query.toLowerCase();
        const textMatch = a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.slug.includes(q);
        if (!textMatch) return false;
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
            placeholder="Search keywords..."
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-[#222] rounded text-white font-mono text-xs uppercase focus:border-[#00F2FF] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Topic</label>
          <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Topics</option>
            {options.topics.map(o => <option key={o} value={o}>{o.replace(/-/g, ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Discipline</label>
          <select value={disciplineFilter} onChange={e => setDisciplineFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Disciplines</option>
            {options.disciplines.map(o => <option key={o} value={o}>{o.replace(/-/g, ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Difficulty</label>
          <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Difficulties</option>
            {options.difficulties.map(o => <option key={o} value={o}>{o.replace(/-/g, ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Audience</label>
          <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Audiences</option>
            {options.audiences.map(o => <option key={o} value={o}>{o.replace(/-/g, ' ')}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-2">Content Type</label>
          <select value={contentTypeFilter} onChange={e => setContentTypeFilter(e.target.value)} className="w-full bg-black/60 border border-[#222] rounded p-2 text-white text-xs uppercase font-mono focus:border-[#00F2FF] focus:outline-none">
            <option value="">All Types</option>
            {options.contentTypes.map(o => <option key={o} value={o}>{o.replace(/-/g, ' ')}</option>)}
          </select>
        </div>
      </aside>

      {/* Results Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredContent.length === 0 ? (
          <div className="col-span-full p-12 text-center text-[#A0A0A0] border border-dashed border-white/10 rounded">
            No results found matching your filters.
          </div>
        ) : (
          filteredContent.map(a => {
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
                  <span>{a.metadata?.difficulty || 'N/A'} &bull; {a.metadata?.contentType || 'N/A'}</span>
                  {a.metadata?.topics?.[0] && <span className="bg-white/10 px-2 py-0.5 rounded">{a.metadata.topics[0]}</span>}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#00F2FF] transition-colors mb-2 line-clamp-2">{a.title}</h3>
                <p className="text-sm text-[#A0A0A0] line-clamp-3">{a.excerpt}</p>
              </DiscoveryLink>
            );
          })
        )}
      </div>
    </div>
  );
}
