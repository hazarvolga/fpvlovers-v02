'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, ArrowRight } from 'lucide-react';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import { trackComparisonClick } from '@/lib/analytics';

interface ComparisonsHubClientProps {
  initialComparisons: PublishedArtifact[];
}

export function ComparisonsHubClient({ initialComparisons }: ComparisonsHubClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract all unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const c of initialComparisons) {
      if (c.metadata?.comparison?.comparisonCategory) {
        cats.add(c.metadata.comparison.comparisonCategory);
      }
    }
    return Array.from(cats);
  }, [initialComparisons]);

  // Filter comparisons
  const filteredComparisons = useMemo(() => {
    if (selectedCategory === 'all') return initialComparisons;
    return initialComparisons.filter(
      c => c.metadata?.comparison?.comparisonCategory === selectedCategory
    );
  }, [initialComparisons, selectedCategory]);

  const handleComparisonClick = (slug: string, productA: string, productB: string) => {
    trackComparisonClick(slug, { productA, productB, component: 'comparisons_hub_grid' });
  };

  return (
    <div id="comparisons" className="mt-10">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 text-xs font-mono font-black uppercase border tracking-wider transition-all duration-300 ${
            selectedCategory === 'all'
              ? 'bg-[#00F2FF]/10 border-[#00F2FF] text-[#00F2FF] shadow-[0_0_15px_rgba(0,242,255,0.15)]'
              : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
          }`}
        >
          All Categories ({initialComparisons.length})
        </button>
        {categories.map((cat) => {
          const count = initialComparisons.filter(
            c => c.metadata?.comparison?.comparisonCategory === cat
          ).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-mono font-black uppercase border tracking-wider transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-[#00F2FF]/10 border-[#00F2FF] text-[#00F2FF] shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                  : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filteredComparisons.length === 0 ? (
        <div className="text-center py-20 border border-white/5 bg-[#050810]/40 rounded-lg">
          <p className="text-[#A0A0A0] font-mono text-sm uppercase tracking-widest">
            No published comparisons found matching selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredComparisons.map((comp) => {
            const meta = comp.metadata!.comparison!;
            const coverImage = comp.media?.coverImage?.src || comp.coverImage;

            return (
              <div
                key={comp.slug}
                className="hex-panel glass-panel border border-white/10 bg-[#050810]/70 hover:border-[#FF5C00]/50 transition-all duration-500 rounded-lg overflow-hidden flex flex-col group relative"
              >
                {/* Cover Image */}
                {coverImage && (
                  <div className="relative w-full h-48 bg-black/50 border-b border-white/5 overflow-hidden">
                    <Image
                      src={coverImage}
                      alt={`${meta.productA} vs ${meta.productB}`}
                      fill
                      className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  {/* Category info */}
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-widest text-[#00F2FF]">
                    <span className="font-black px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/80">
                      VS Matchup
                    </span>
                    <span>&bull;</span>
                    <span>{meta.comparisonCategory}</span>
                  </div>

                  {/* Versus Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="text-xs font-mono text-white/40 uppercase">Product A</div>
                      <div className="text-lg font-black text-white truncate">{meta.productA}</div>
                    </div>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono font-black text-[#FF5C00] tracking-tighter">
                      VS
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-xs font-mono text-white/40 uppercase">Product B</div>
                      <div className="text-lg font-black text-white truncate">{meta.productB}</div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-4 group-hover:text-[#00F2FF] transition-colors leading-tight">
                    {comp.title}
                  </h3>

                  {/* Winner telemetry badge */}
                  <div className="mb-6 p-4 bg-zinc-950/80 border border-white/5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#00FF66]" />
                      <div>
                        <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest">VERDICT WINNER</div>
                        <div className="text-sm font-mono font-black text-white uppercase">{meta.winner}</div>
                      </div>
                    </div>
                    <div className="text-[9px] font-mono font-black uppercase text-[#00F2FF] tracking-wider px-2.5 py-1 bg-[#00F2FF]/10 border border-[#00F2FF]/20 rounded">
                      {meta.winner.toLowerCase() === 'tie' ? 'DRAW' : 'DOMINATED'}
                    </div>
                  </div>

                  {/* Excerpt */}
                  {comp.excerpt && (
                    <p className="text-sm text-white/70 font-sans mb-6 line-clamp-3 leading-relaxed">
                      {comp.excerpt}
                    </p>
                  )}

                  {/* Read Comparison CTA */}
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <Link
                      href={`/article/${comp.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase tracking-widest text-white/80 hover:text-[#FF5C00] transition-colors group/link"
                      onClick={() => handleComparisonClick(comp.slug, meta.productA, meta.productB)}
                    >
                      Read Full Comparison
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-all text-[#FF5C00]" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
